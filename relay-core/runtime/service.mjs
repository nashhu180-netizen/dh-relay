// service.mjs — DHR_30 仓库级 Runtime 服务（design/07 全文 + design/08 §2~§5 的实现）。
//
// 它是控制面里**唯一**导入 Store 与 runtime host 的进程：CLI / DSH Bridge / Pi 都只发 RPC。
// 三条承诺落在这里：
//   ① 后台统一控制——每个 Run 一个内嵌 HostSessionActor，service 只创建/查找/等待，绝不持写句柄；
//   ② 连接当前服务——contracts 是连接唯一首请求，身份、代次、本机 capability 全等才解闸；
//   ③ 重复操作只生效一次——(client_id, request_id, method) + JCS 摘要落在项目级 operation ledger。
//
// 边界（design/07 §6）：不开公网服务，不写业务仓 .gitignore。
//
// DHR_31 起的一处**有意收窄**：§6 原文里的「不 import workflow / Process / executor，
// 不推进业务节点」是 DHR_30 的边界——那一卡交付的是生命周期保持器，节点推进无人负责。
// 本卡把推进接了进来，但接法不动唯一写者：service 只**起** driver
// （`runtime/workflow-driver.mjs`），driver 的一切读写仍排进宿主 actor 自己的串行队列，
// service 依旧不持 Store 写句柄。

import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { localCapabilityHash, localCapabilityHashV2 } from '../rpc/capabilities.mjs';
import { createBootstrapServer } from '../rpc/bootstrap.mjs';
import { createRpcServer } from '../rpc/server.mjs';
import { readOpenAttentions } from '../store/store.mjs';
import { loadAjv, validateOne } from '../tools/validate.mjs';
import { discoverRepo, orderRunSummaries, scanRuns } from './discovery.mjs';
import { endpointForRepo, repoHash, writeDescriptor } from './endpoint.mjs';
import { readOrCreateLocalUserCapability } from './credentials.mjs';
import { assertStoreRootIgnored } from './gitignore.mjs';
import { createHostSessionActor, runRootOf } from './host.mjs';
import { ledgerPath, operationKey, readLedger, recoveryFor, requestDigest, writeLedger } from './ledger.mjs';
import { formatRunId, isValidRunId, localDateStamp, normalizeThemeSlug } from './runid.mjs';
import { defaultIndexPath } from './startrun.mjs';
import { readHostStatus } from './status.mjs';
import { assessRunReachability } from './reachability.mjs';
import { startWorkflowDriver } from './workflow-driver.mjs';
import { createStore } from '../store/store.mjs';
import { retryWithFrozenProfile } from './attempt-retry.mjs';

const READ_MODEL = 'relay.client-read-model/v1';
const READ_MODEL_V2 = 'relay.client-read-model/v2';

let validatorCache;
export function validateRuntimeDocument({ contract_id: contractId, document } = {}) {
  validatorCache ??= loadAjv();
  const schema = validateOne(validatorCache.ajv, validatorCache.byId, contractId, document);
  if (!schema.ok) return { valid: false, reason: schema.reason };
  if (contractId === 'relay.run/v2') {
    const reachability = assessRunReachability(document);
    if (!reachability.valid) return { valid: false, reason: reachability.reason };
  }
  return { valid: true, reason: null };
}

/**
 * 可预期失败的稳定 reason（design/07 §5.2）。业务 handler **不得**以断开连接表达它们——
 * 断连之后客户端既拿不到原因也不知道该不该重试，只能瞎猜。
 */
function serviceError(reason, detail = null) {
  const error = new Error(detail ? `${reason}:${detail}` : reason);
  error.reason = reason;
  return error;
}

/**
 * 把 Runtime 各层抛出的既有错误映射成稳定 reason。
 * 这些错误（`E_RUN_NOT_FOUND`、`E_GITIGNORE_MISSING`、`E_LEASE_HELD:…`、`E_STORE_CORRUPT:…`）
 * 本来就带着码，只是以 message 前缀的形式；不认领它们就会走 server 的 fail-closed 断连分支。
 */
function withReason(error) {
  if (error?.reason) return error;
  const code = String(error?.message ?? '').split(':')[0];
  if (/^E_[A-Z0-9_]{2,62}$/.test(code)) error.reason = code;
  return error;
}

const nowIso = () => new Date().toISOString();

/** 从 run 文档推 slug：主题名只为人读，唯一性全靠仓级序号（runid.mjs 的 D23 口径）。 */
function slugFor(run) {
  const candidate = String(run?.workflow_name ?? run?.summary ?? 'run')
    .toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30).replace(/-+$/, '');
  try {
    return normalizeThemeSlug(candidate || 'run');
  } catch {
    return 'run';
  }
}

function readModelStatus(status, { source = 'runtime-v2', readOnly = false } = {}) {
  return {
    run_id: status.run_id, source, read_only: readOnly,
    host: status.host, host_detail: status.host_detail,
    ledger: status.ledger, events: status.events,
  };
}

const legacyStatusView = (runId) => ({
  run_id: runId, source: 'legacy-v1', read_only: true,
  host: null, host_detail: null, ledger: null, events: null,
});

/** host_detail 在 Read Model 里是字符串或 null；lease.mjs 给的是结构体，这里做唯一一次投影。 */
function hostDetailText(detail) {
  if (detail === null || detail === undefined) return null;
  if (typeof detail === 'string') return detail;
  if (detail.corrupt) return 'corrupt';
  return `epoch:${detail.epoch}`;
}

async function readEventsFromDisk(runRoot) {
  try {
    const text = await readFile(join(runRoot, 'events.jsonl'), 'utf8');
    return text.split('\n').filter(Boolean).map(line => JSON.parse(line));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw serviceError('E_STORE_CORRUPT', 'events-unreadable');
  }
}

/**
 * 启动一届仓库级 Runtime service。
 *
 * 就绪顺序是硬的（design/07 §3）：**bind → credential → 发现/对账 → 发布 ready descriptor**。
 * 每一步的理由：
 *   · bind 在最前：成功 bind 是唯一服务的 fencing。没赢下端点的候选连 credential 都不许读，
 *     更不许改 ledger 或 descriptor——否则两个候选会互相踩。
 *   · descriptor 最后发布：它是「可以来连了」的唯一信号；提前发布等于把半成品 service 广播出去。
 *   · 退出**不删** descriptor：留着的陈旧 descriptor 是可检测的发现信息，不是所有权。
 *     下一届只有在 bind 成功之后才覆盖它，杜绝旧进程删掉新 descriptor 的 ABA。
 */
export async function startRuntimeService({
  repoRoot,
  endpoint = endpointForRepo(repoRoot),
  v2Endpoint = endpointForRepo(repoRoot, { channel: 'v2' }),
  bootstrapEndpoint = endpointForRepo(repoRoot, { channel: 'bootstrap' }),
  localUserCapability = null,
  credentialRoot,
  runtimeVersion = '0.0.0',
  indexPath = defaultIndexPath(),
  legacyRoot,
  gitBin = 'git',
  executorProfileRegistryPath,
  profileEnvironment = process.env,
  clock = () => Date.now(),
} = {}) {
  if (!repoRoot) throw new Error('E_BAD_VALUE:repo-root-required');

  /** 就绪前的一切请求都只能得到稳定拒绝，不得看到半成品状态。 */
  let descriptor = null;
  let v2Descriptor = null;
  let capability = null;
  const actors = new Map();
  /** run_id -> 当前这届 workflow driver（DHR_31）。它不持写句柄，只经 actor 队列推进。 */
  const drivers = new Map();
  /** run_id -> Set<subscription>；订阅是连接本地状态，只活在内存里。 */
  const subscriptions = new Map();
  let ledger = { version: 1, operations: {}, next_seq: 0 };
  let known = { v2: [], legacy: [], roots: new Map(), report: [], orphans: new Set() };

  // service 的唯一 async 队列：ledger 与 actor 生命周期的所有变更都排这一条，
  // 于是「同键并发」「保留号」「发现结果」三者之间不存在交错窗口。
  let tail = Promise.resolve();
  const enqueue = (job) => {
    const outcome = tail.then(job);
    tail = outcome.then(() => undefined, () => undefined);
    return outcome;
  };

  const persistLedger = () => writeLedger(repoRoot, ledger);
  const requireReady = () => { if (!descriptor) throw serviceError('E_SERVICE_NOT_READY', 'descriptor-not-published'); };

  function isLegacy(runId) {
    return known.legacy.some(item => item.run_id === runId);
  }

  /**
   * 孤儿 Store（盘上有 Run 根、operation ledger 里无人认领，design/08 §3）。
   * 它可读不可写：投影带 `read_only:true`，一切 mutation 与 actor 建立一律稳定拒绝。
   * 理由是两条约束的交点——「Run Store 才是 Run 真相」不许把它藏起来，
   * 「孤儿 Store fail-closed」不许在一个无人认领的现场上继续产生新事实。
   */
  function isOrphan(runId) {
    return known.orphans?.has(runId) === true;
  }

  const refuseOrphan = (runId) => {
    if (isOrphan(runId)) throw serviceError('E_ORPHAN_STORE_READ_ONLY', runId);
  };

  /**
   * 运行期只重扫盘上的 Run 与 legacy，**绝不重读 ledger**。
   * ledger 在启动时对完账之后就以内存这一份为唯一权威：service 是它的唯一写者，
   * 重读会把一次正在进行的 operation 从对象图里换掉——之后所有 phase 推进都写进了
   * 一个已经没人引用的对象，Receipt 于是永远提交不上（同键重试会再执行一次）。
   */
  async function refreshKnown() {
    // ledger 传的是内存这一份（唯一权威），不是重新从盘上读——孤儿判定与保留号必须看同一本账。
    const scanned = await scanRuns({ repoRoot, legacyRoot, ledger });
    known = { ...scanned, ledger, next_seq: ledger.next_seq };
  }

  /** 启动时的完整四步发现：只在这里读/修 ledger 与 runs.json 索引。 */
  async function bootstrapDiscovery() {
    known = await discoverRepo({ repoRoot, indexPath, legacyRoot, clock });
    ledger = known.ledger;
  }

  // ── actor 生命周期 ───────────────────────────────────────────────────────────
  async function ensureActor(runId) {
    const existing = actors.get(runId);
    if (existing) return existing;
    // 最后一道闸：actor 建立 = 取 lease + 写 lease_acquired，本身就是写。
    // 孤儿在这里必须停住，哪怕上游漏判（design/08 §3 的 fail-closed）。
    refuseOrphan(runId);
    const actor = createHostSessionActor({ repoRoot, runId, gitBin });
    actors.set(runId, actor);
    actor.done.then((outcome) => {
      if (actors.get(runId) === actor) actors.delete(runId);
      // 这一届结束（优雅 stop / 失租 / 失败）：把挂在它 Store 句柄上的 barrier 摘掉。
      // 留着不摘，订阅就永远认为自己「已挂上」，下一届 actor 来了也不会重挂。
      detach(runId, actor);
      return outcome;
    }).catch(() => {});
    try {
      await actor.ready;
    } catch (error) {
      actors.delete(runId);
      throw withReason(error);
    }
    // 订阅必须挂在 actor 的 Store 写队列上：barrier 与实时推送共用同一次串行化。
    for (const subscription of subscriptions.get(runId) ?? []) await attach(subscription, actor);
    return actor;
  }

  /**
   * 把一条订阅挂到（或重挂到）某一届 actor 的 Store 写队列上。
   *
   * 订阅的归属是 **(连接, run)**，不是 (连接, actor)：客户端订的是这个 Run 的事件流，
   * 它不该知道也不该关心中途换了几届 actor。所以换代时不是「断开让客户端重订」——
   * 那要求客户端能察觉失聪，而它察觉不到——而是服务端按**最后已送 seq** 无缝续上。
   *
   * 重挂窗口内先回到缓冲态：新 barrier 之前的漏发事件要按 seq 排在实时推送**前面**，
   * 两股流直接交错就会乱序。切分点用 `barrier.next_seq`：小于它的从新 Store 句柄补，
   * 大于等于它的必然经 barrier 推来，两边严丝合缝、不重不漏。
   */
  async function attach(subscription, actor) {
    if (subscription.closed) return;
    if (subscription.actor === actor && subscription.barrier) return;
    subscription.barrier?.unsubscribe();
    subscription.barrier = null;
    const wasLive = subscription.live;
    subscription.live = false;
    let barrier;
    try {
      barrier = await actor.store.subscribe(
        (event, state) => subscription.push(event, state),
        { rejectOpenAttention: subscription.readModelVersion === 'v1' },
      );
    } catch (error) {
      if (String(error?.message ?? error).startsWith('E_ATTENTION_REQUIRES_READ_MODEL_V2')) {
        subscription.closeForAttention();
        return;
      }
      throw error;
    }
    subscription.barrier = barrier;
    subscription.actor = actor;
    const missed = actor.store.events
      .filter(event => event.seq > subscription.lastSentSeq && event.seq < barrier.next_seq)
      .map(event => [event, null]);
    // 漏发的排在缓冲队首：它们的 seq 全都小于 barrier.next_seq，也就小于缓冲里任何一条。
    subscription.buffer.unshift(...missed);
    if (wasLive) subscription.drain();
  }

  /**
   * 起一届 workflow driver（DHR_31）。**故意不 await**：start / resume 的 RPC 应答不该
   * 等业务节点跑完，否则一条 30 秒的 Run 会把 service 的串行队列堵 30 秒。
   * 同一 Run 已有在跑的 driver 时不再起第二届——那会让两个推进器抢同一批 ready 节点。
   */
  function driveRun(runId, actor, { retryFailed = false } = {}) {
    if (drivers.has(runId)) return drivers.get(runId);
    const driver = startWorkflowDriver({
      repoRoot, runId, actor, retryFailed, clock,
      herdrRegistryPath: executorProfileRegistryPath,
      profileEnvironment,
    });
    drivers.set(runId, driver);
    driver.done.then(() => {
      if (drivers.get(runId) === driver) drivers.delete(runId);
    }, () => {});
    return driver;
  }

  /** 停掉某个 Run 的 driver 并等它收口（被中断的步骤会先落 E_EXECUTOR_KILLED 终态）。 */
  async function stopDriver(runId) {
    const driver = drivers.get(runId);
    if (!driver) return;
    drivers.delete(runId);
    await driver.stop().catch(() => {});
  }

  /** 某一届 actor 结束：摘掉挂在它身上的 barrier，订阅本身留着等下一届重挂。 */
  function detach(runId, actor) {
    for (const subscription of subscriptions.get(runId) ?? []) {
      if (subscription.actor !== actor) continue;
      subscription.barrier?.unsubscribe();
      subscription.barrier = null;
      subscription.actor = null;
    }
  }

  // ── Read Model ──────────────────────────────────────────────────────────────
  async function statusViewOf(runId) {
    if (isLegacy(runId)) return legacyStatusView(runId);
    if (!known.roots.has(runId)) await refreshKnown();
    if (!known.roots.has(runId)) {
      if (isLegacy(runId)) return legacyStatusView(runId);
      throw serviceError('E_RUN_NOT_FOUND', runId);
    }
    const status = await readHostStatus({ repoRoot, runId, clock });
    return readModelStatus({ ...status, host_detail: hostDetailText(status.host_detail) },
      { readOnly: isOrphan(runId) });
  }

  /** v1 没有 Attention 字段；必须显式拒绝，不能靠过滤 Run 伪造兼容。 */
  async function assertV1AttentionCompatible(runId) {
    if (isLegacy(runId)) return;
    if (!known.roots.has(runId)) await refreshKnown();
    if (!known.roots.has(runId)) return;
    const actor = actors.get(runId);
    let openAttentions;
    try {
      openAttentions = actor
        ? await actor.store.openAttentions()
        : await readOpenAttentions({ root: known.roots.get(runId) });
    } catch (error) {
      throw withReason(error);
    }
    if (openAttentions.length > 0) {
      throw serviceError('E_ATTENTION_REQUIRES_READ_MODEL_V2', runId);
    }
  }

  async function attentionsFor(runId) {
    if (isLegacy(runId)) return [];
    if (!known.roots.has(runId)) await refreshKnown();
    if (!known.roots.has(runId)) return [];
    const actor = actors.get(runId);
    try {
      return await (actor
        ? actor.store.openAttentions()
        : readOpenAttentions({ root: known.roots.get(runId) }));
    } catch (error) {
      throw withReason(error);
    }
  }

  // ── operation ledger ────────────────────────────────────────────────────────
  function receiptFor({ method, kind, runId, handshake, digest, state, reason = null, receiptId = randomUUID() }) {
    return {
      protocol: 'relay.launch-receipt/v2', receipt_id: receiptId, request_id: handshake.request_id,
      client_id: handshake.client_id, method, state, reason, run_id: runId,
      node_id: null, attempt_id: null, kind,
      issued_at: nowIso(), issued_by_runtime: `runtime-${descriptor.generation}`, request_digest: digest,
    };
  }

  /** Receipt 的真相在 Run Store；ledger 只是索引。读回时永远先问 Store。 */
  async function receiptOf(operation) {
    const root = operation.run_id ? known.roots.get(operation.run_id) : null;
    if (root && operation.receipt_id) {
      try {
        return JSON.parse(await readFile(join(root, 'operations', `${operation.receipt_id}.json`), 'utf8'));
      } catch { /* 落到 ledger 副本：failed 操作本来就没有 Store 可写 */ }
    }
    return operation.receipt ?? null;
  }

  async function commitReceipt(operation, actor, receipt) {
    operation.receipt_id = receipt.receipt_id;
    operation.receipt = receipt;
    operation.phase = 'actor_ready';
    await persistLedger();
    // 先把 operation event flush 到 Run Store，再把 ledger 变成 receipt_committed。
    // 顺序不能倒：ledger 领先于事件账时，恢复会读到一个事件账里不存在的 Receipt。
    const written = await actor.submitControl(store => store.appendOperation(receipt));
    if (written?.ok === false) throw serviceError(written.reason ?? 'E_REQUEST_CONFLICT', 'operation-not-written');
    operation.phase = 'receipt_committed';
    await persistLedger();
    return receipt;
  }

  async function runStart(operation, params, handshake, digest) {
    const reachability = assessRunReachability(params.run);
    if (!reachability.valid) throw serviceError(reachability.reason, reachability.at);

    const recovery = recoveryFor(operation.phase);
    if (recovery.replayReceipt) {
      const receipt = await receiptOf(operation);
      if (receipt) return receipt;
      operation.phase = 'actor_ready'; // ledger 领先于事件账：退回可重做的相位
    }

    if (!operation.run_id) {
      // 前置闸先于任何落盘：`.dh-relay/` 没被 Git 忽略时连保留号都不许发。
      await assertStoreRootIgnored({ repoRoot, gitBin });
      const seq = ledger.next_seq + 1;
      const runId = formatRunId({ seq, slug: slugFor(params.run), date: localDateStamp(clock()) });
      ledger.next_seq = seq;
      operation.run_id = runId;
      operation.phase = 'run_id_reserved';
      // 保留号先落盘再建 Store：崩在这之后重试会沿用同一个号，绝不发第二个。
      await persistLedger();
    }

    const runId = operation.run_id;
    const root = runRootOf({ repoRoot, runId });
    if (operation.phase === 'run_id_reserved') {
      await assertStoreRootIgnored({ repoRoot, gitBin });
      let exists = true;
      try { await readFile(join(root, 'run.json'), 'utf8'); } catch { exists = false; }
      if (!exists) {
        const store = await createStore({ root, run: { ...params.run, run_id: runId } });
        await store.appendEvent({ kind: 'run_created', at: nowIso() });
      }
      operation.phase = 'store_created';
      await persistLedger();
      await refreshKnown();
    }

    const actor = await ensureActor(runId);
    const receipt = operation.receipt ?? receiptFor({
      method: 'start', kind: 'start', runId, handshake, digest, state: 'committed',
    });
    const committed = await commitReceipt(operation, actor, receipt);
    // Receipt 落定之后才开始推进：先有「这次 start 确实发生了」的账，再有节点事实。
    driveRun(runId, actor);
    return committed;
  }

  async function runControl(operation, params, handshake, digest) {
    const recovery = recoveryFor(operation.phase);
    if (recovery.replayReceipt) {
      const receipt = await receiptOf(operation);
      if (receipt) return receipt;
      operation.phase = 'actor_ready';
    }
    const runId = params.run_id;
    // legacy v1 只投影只读状态：现在和将来的所有 control action 一律拒绝（design/07 §5.1）。
    if (isLegacy(runId)) throw serviceError('E_LEGACY_READ_ONLY', runId);
    if (!known.roots.has(runId)) {
      await refreshKnown();
      if (isLegacy(runId)) throw serviceError('E_LEGACY_READ_ONLY', runId);
      if (!known.roots.has(runId)) throw serviceError('E_RUN_NOT_FOUND', runId);
    }
    // 孤儿只读：stop/resume 都拒。放在认领 run_id 之前——被拒的 control 不该反过来
    // 把这个孤儿「认领」进 ledger，那等于用一次失败的操作给它补一张出生证。
    refuseOrphan(runId);
    operation.run_id = runId;

    if (params.action === 'stop') {
      const actor = actors.get(runId);
      if (!actor) throw serviceError('E_SERVICE_NOT_READY', 'no-live-session');
      const receipt = operation.receipt ?? receiptFor({
        method: 'control', kind: 'stop', runId, handshake, digest, state: 'committed',
      });
      // 先在自己的 lease 内提交 Receipt，再终止：反过来就成了「回执写不进去的停机」。
      const committed = await commitReceipt(operation, actor, receipt);
      // driver 先停：被中断的步骤要在 actor 还活着（lease 还在自己手里）时把
      // E_EXECUTOR_KILLED 终态写进去，否则那个 attempt 会永远悬在 running。
      await stopDriver(runId);
      actor.stop();
      await actor.done;
      return committed;
    }

    // resume：只有新 actor ready（lease 已取得、lease_acquired 已落账）之后才提交 Receipt。
    const actor = await ensureActor(runId);
    const receipt = operation.receipt ?? receiptFor({
      method: 'control', kind: 'resume', runId, handshake, digest, state: 'committed',
    });
    const committed = await commitReceipt(operation, actor, receipt);
    // resume = 从事件账重建进度继续推进，并对失败节点开 fresh attempt（H12）。
    driveRun(runId, actor, { retryFailed: true });
    return committed;
  }

  /** start / control 的公共外壳：幂等判定 → 执行 → 失败落 failed Receipt。 */
  async function mutate(method, params, handshake, frame) {
    requireReady();
    const digest = requestDigest(frame);
    const key = operationKey({ client_id: handshake.client_id, request_id: handshake.request_id, method });
    return enqueue(async () => {
      const prior = ledger.operations[key];
      if (prior) {
        // 同键不同摘要 = 两个不同的请求用了同一个幂等键。绝不执行第二次，也绝不覆盖第一次。
        if (prior.request_digest !== digest) throw serviceError('E_REQUEST_CONFLICT', 'digest-differs');
        const receipt = await receiptOf(prior);
        if (prior.phase === 'receipt_committed' && receipt) return { receipt };
        if (prior.phase === 'failed') {
          if (receipt) return { receipt };
          throw serviceError(prior.reason ?? 'E_SERVICE_NOT_READY', 'prior-failed');
        }
      }
      const operation = prior ?? {
        client_id: handshake.client_id, request_id: handshake.request_id, method,
        request_digest: digest, run_id: null, phase: 'accepted', receipt_id: null, reason: null,
      };
      ledger.operations[key] = operation;
      if (!prior) await persistLedger();
      try {
        const receipt = method === 'start'
          ? await runStart(operation, params, handshake, digest)
          : await runControl(operation, params, handshake, digest);
        return { receipt };
      } catch (error) {
        const failure = withReason(error);
        operation.phase = 'failed';
        operation.reason = failure.reason ?? 'E_SERVICE_NOT_READY';
        // failed 也要有 Receipt：客户端凭它知道「这次确实失败了」，而不是「结果未知」。
        // 但 Receipt 的 run_id 是必填且必须合 v2 形态——失败在发号之前（或对象是 legacy v1 Run）
        // 时根本没有可写的 run_id。那种情况回 `receipt: null`（design/08 §1 允许），
        // 绝不为了凑齐字段编一个号出来。
        const runIdForReceipt = isValidRunId(operation.run_id) ? operation.run_id : null;
        operation.receipt = runIdForReceipt
          ? receiptFor({
            method, kind: method === 'start' ? 'start' : params.action, runId: runIdForReceipt,
            handshake, digest, state: 'failed', reason: operation.reason,
            receiptId: operation.receipt_id ?? randomUUID(),
          })
          : null;
        operation.receipt_id = operation.receipt?.receipt_id ?? null;
        await persistLedger();
        if (operation.receipt) failure.receipt = operation.receipt;
        throw failure;
      }
    });
  }

  // ── subscribe ───────────────────────────────────────────────────────────────
  /**
   * design/08 §5 的 barrier：在**写队列内**注册 buffered subscriber 并取得当前尾 seq，
   * 读该 seq 对应的 snapshot，随后发送 snapshot，再按 seq 排空缓冲。
   * 网络发送全部在队列之外做——慢客户端不得堵住 Store 的写。
   */
  async function subscribe(params, sink, readModelVersion = 'v1') {
    requireReady();
    const runId = params.run_id;
    const afterSeq = params.after_seq ?? null;
    return enqueue(async () => {
      if (isLegacy(runId)) throw serviceError('E_LEGACY_READ_ONLY', runId);
      if (!known.roots.has(runId)) {
        await refreshKnown();
        if (isLegacy(runId)) throw serviceError('E_LEGACY_READ_ONLY', runId);
        if (!known.roots.has(runId)) throw serviceError('E_RUN_NOT_FOUND', runId);
      }
      const root = known.roots.get(runId);
      const subscription = {
        runId, barrier: null, actor: null, live: false, buffer: [], readModelVersion,
        /** 最后一条**已送达**的 seq。actor 换代时的补发切分点就是它——见 attach()。 */
        lastSentSeq: -1,
        push(event, state) {
          if (subscription.closed) return;
          if (subscription.live) subscription.emit(event, state);
          else subscription.buffer.push([event, state]);
        },
        emit(event, state) {
          // 换代补发与实时推送有可能覆盖同一条 seq；已送过的一律丢弃，
          // 「重复允许客户端丢弃」不等于服务端可以随便重发（design/08 §5）。
          if (event.seq <= subscription.lastSentSeq) return;
          if (subscription.readModelVersion === 'v1'
            && (event.kind === 'fallback_pause_created' || event.kind === 'fallback_pause_resolved')) {
            subscription.closeForAttention(event.seq);
            return;
          }
          if (!sink.event(event)) return;
          subscription.lastSentSeq = event.seq;
          if (state) sink.runStateChanged({ state, caused_by_seq: event.seq });
        },
        /** 转入实时态并排空缓冲。快照（本次 RPC 响应）落线之后才允许调用。 */
        drain() {
          if (subscription.closed) return;
          subscription.live = true;
          for (const [event, state] of subscription.buffer.splice(0)) subscription.emit(event, state);
        },
        closeForAttention(causedBySeq = null) {
          if (subscription.closed) return;
          subscription.closed = true;
          subscriptions.get(runId)?.delete(subscription);
          subscription.barrier?.unsubscribe();
          const suffix = causedBySeq === null ? '' : `;caused_by_seq=${causedBySeq}`;
          sink.close('E_ATTENTION_REQUIRES_READ_MODEL_V2', `run_id=${runId}${suffix}`);
        },
        closed: false,
      };

      const actor = actors.get(runId);
      if (actor) {
        try {
          subscription.barrier = await actor.store.subscribe(
            (event, state) => subscription.push(event, state),
            { rejectOpenAttention: readModelVersion === 'v1' },
          );
        } catch (error) {
          if (String(error?.message ?? error).startsWith('E_ATTENTION_REQUIRES_READ_MODEL_V2')) {
            throw serviceError('E_ATTENTION_REQUIRES_READ_MODEL_V2', runId);
          }
          throw error;
        }
        subscription.actor = actor;
      } else if (readModelVersion === 'v1') {
        await assertV1AttentionCompatible(runId);
      }
      // 没有活 actor 时没有任何写者：此刻盘上的条数就是精确的尾 seq。
      // actor 只可能由本队列创建，届时 attach() 会把订阅接上，中间不存在缝隙。
      const nextSeq = subscription.barrier ? subscription.barrier.next_seq : (await readEventsFromDisk(root)).length;
      if (!subscriptions.has(runId)) subscriptions.set(runId, new Set());
      subscriptions.get(runId).add(subscription);

      // cursor：只补严格大于 after_seq 的连续 seq。缺口一律拒绝，不猜、不拼。
      let backfill = [];
      if (afterSeq !== null) {
        if (!Number.isInteger(afterSeq) || afterSeq < 0 || afterSeq > nextSeq - 1) {
          subscriptions.get(runId).delete(subscription);
          subscription.barrier?.unsubscribe();
          throw serviceError('E_CURSOR_GAP', `after_seq=${afterSeq}`);
        }
        backfill = (await readEventsFromDisk(root)).filter(event => event.seq > afterSeq && event.seq < nextSeq);
      }
      const incompatibleBackfill = readModelVersion === 'v1'
        ? backfill.find(event => event.kind === 'fallback_pause_created' || event.kind === 'fallback_pause_resolved')
        : null;
      // 快照（含 cursor 补发）覆盖到 nextSeq-1 为止：这就是「客户端已经拿到的最后一条」，
      // 也就是 actor 换代时补发的起点。
      subscription.lastSentSeq = afterSeq === null ? nextSeq - 1 : afterSeq;

      const snapshot = await statusViewOf(runId);
      const openAttentions = readModelVersion === 'v2' ? await attentionsFor(runId) : null;
      const unsubscribe = () => {
        subscription.closed = true;
        subscriptions.get(runId)?.delete(subscription);
        subscription.barrier?.unsubscribe();
      };
      return {
        result: {
          protocol: readModelVersion === 'v2' ? READ_MODEL_V2 : READ_MODEL, view: 'event_stream_snapshot', run_id: runId,
          snapshot, snapshot_seq: Math.max(0, nextSeq - 1), next_seq: nextSeq,
          ...(readModelVersion === 'v2' ? { open_attentions: openAttentions } : {}),
        },
        unsubscribe,
        // 快照（= 本次 RPC 响应）发出去之后才排空缓冲：客户端拿到的顺序永远是
        // 「先快照、再按 seq 的增量」，两者之间没有第三种可能。
        afterSend: () => {
          if (incompatibleBackfill) {
            subscription.closeForAttention(incompatibleBackfill.seq);
            return;
          }
          for (const event of backfill) {
            subscription.emit(event, null);
            if (subscription.closed) break;
          }
          subscription.drain();
        },
      };
    });
  }

  // ── RPC handlers ────────────────────────────────────────────────────────────
  const handlers = {
    // 实际身份回证走 createRpcServer 的 authorize seam；这里的存在只是让 contracts
    // 通过「方法已实现」这道闸（未注入的方法一律 E_UNKNOWN_METHOD）。
    contracts: () => { requireReady(); return descriptor; },
    async listRuns(params) {
      requireReady();
      await refreshKnown();
      const items = [...known.v2];
      if (params?.include_legacy === true) items.push(...known.legacy);
      for (const item of items) await assertV1AttentionCompatible(item.run_id);
      // F-026：排序由源头给（分堆词表序 + 堆内 run_id 升序），客户端只按此序渲染不重排。
      return { protocol: READ_MODEL, view: 'run_list', items: orderRunSummaries(items) };
    },
    async inspectRun(params) {
      requireReady();
      await assertV1AttentionCompatible(params.run_id);
      const status = await statusViewOf(params.run_id);
      if (params.view === 'status') {
        return { protocol: READ_MODEL, view: 'status', source: status.source, read_only: status.read_only, status, detail: null };
      }
      if (status.source === 'legacy-v1') {
        // legacy 的 detail 只能是「读不到」——v1 现场里没有 relay.run-state/v1 这份事实。
        // 判据是 **source**，不是 read_only：孤儿 v2 也是 read_only，但它的 state.json
        // 是一份真实存在、刚被逐行校验过的 relay.run-state/v1，藏起来就是把事实当没发生。
        return { protocol: READ_MODEL, view: 'detail', source: status.source, read_only: true, status: null, detail: null };
      }
      const root = known.roots.get(params.run_id);
      const detail = JSON.parse(await readFile(join(root, 'state.json'), 'utf8'));
      return { protocol: READ_MODEL, view: 'detail', source: status.source, read_only: status.read_only, status: null, detail };
    },
    subscribe: (params, sink) => subscribe(params, sink, 'v1'),
    start: (params, sinkOrHandshake, maybeFrame) => mutate('start', params, sinkOrHandshake, maybeFrame),
    control: (params, sinkOrHandshake, maybeFrame) => mutate('control', params, sinkOrHandshake, maybeFrame),
    validate: validateRuntimeDocument,
  };

  const v2Handlers = {
    contracts: () => { requireReady(); return v2Descriptor; },
    async listRuns(params) {
      if (params.read_model_version === 'v1') {
        return handlers.listRuns({ include_legacy: params.include_legacy });
      }
      requireReady();
      await refreshKnown();
      const items = [...known.v2];
      if (params.include_legacy === true) items.push(...known.legacy);
      const enriched = [];
      for (const item of orderRunSummaries(items)) {
        enriched.push({ ...item, open_attentions: await attentionsFor(item.run_id) });
      }
      return {
        protocol: READ_MODEL_V2, view: 'run_list',
        open_attentions: enriched.flatMap(item => item.open_attentions), items: enriched,
      };
    },
    async inspectRun(params) {
      if (params.read_model_version === 'v1') {
        return handlers.inspectRun({ run_id: params.run_id, view: params.view });
      }
      requireReady();
      const status = await statusViewOf(params.run_id);
      const open_attentions = await attentionsFor(params.run_id);
      if (params.view === 'status') {
        return { protocol: READ_MODEL_V2, view: 'status', source: status.source, read_only: status.read_only, status, detail: null, open_attentions };
      }
      if (status.source === 'legacy-v1') {
        return { protocol: READ_MODEL_V2, view: 'detail', source: status.source, read_only: true, status: null, detail: null, open_attentions };
      }
      const detail = JSON.parse(await readFile(join(known.roots.get(params.run_id), 'state.json'), 'utf8'));
      return { protocol: READ_MODEL_V2, view: 'detail', source: status.source, read_only: status.read_only, status: null, detail, open_attentions };
    },
    subscribe: (params, sink) => subscribe(
      { run_id: params.run_id, after_seq: params.after_seq }, sink, params.read_model_version,
    ),
    async 'retry-with-profile'(params) {
      requireReady();
      if (!known.roots.has(params.run_id)) await refreshKnown();
      if (!known.roots.has(params.run_id)) throw serviceError('E_RUN_NOT_FOUND', params.run_id);
      refuseOrphan(params.run_id);
      const actor = await ensureActor(params.run_id);
      try {
        return await actor.submitControl(store => retryWithFrozenProfile({
          store, params, registryPath: executorProfileRegistryPath, environment: profileEnvironment,
        }));
      } catch (error) {
        throw withReason(error);
      }
    },
  };

  // ── ① bind：赢下确定性端点才算这一届 service ─────────────────────────────────
  const handle = await createRpcServer({
    endpoint, formal: true, ownerAware: true, capability: localCapabilityHash(), handlers,
    authorize: (params) => {
      requireReady();
      if (params.descriptor_version !== descriptor.descriptor_version
        || params.repo_id !== descriptor.repo_id
        || params.generation !== descriptor.generation
        || params.local_user_capability !== capability) {
        throw serviceError('E_SERVICE_IDENTITY_MISMATCH');
      }
      return descriptor;
    },
  });

  let v2Handle;
  let bootstrapHandle;

  try {
    v2Handle = await createRpcServer({
      endpoint: v2Endpoint, formal: true, ownerAware: true, schemaId: 'relay.rpc/v2',
      capability: localCapabilityHashV2(), handlers: v2Handlers,
      authorize: (params) => {
        requireReady();
        if (params.descriptor_version !== descriptor.descriptor_version
          || params.repo_id !== descriptor.repo_id
          || params.generation !== descriptor.generation
          || params.local_user_capability !== capability) {
          throw serviceError('E_SERVICE_IDENTITY_MISMATCH');
        }
        return v2Descriptor;
      },
    });
    // ── ② credential：只有已 bind 的 service 才读/建它 ────────────────────────
    capability = localUserCapability ?? await readOrCreateLocalUserCapability(repoRoot, credentialRoot ? { credentialRoot } : {});
    // ── ③ 发现与对账：ledger、runs.json、legacy 投影 ─────────────────────────
    await bootstrapDiscovery();
    // ── ④ 全部就绪后才发布 ready descriptor ──────────────────────────────────
    descriptor = {
      descriptor_version: 1,
      repo_id: `sha256:${repoHash(repoRoot)}`,
      endpoint,
      generation: randomUUID(), // 每次成功 bind 产生的不可预测值，只做本届服务身份
      runtime_version: runtimeVersion,
      capability_hash: localCapabilityHash(),
      state: 'ready',
    };
    v2Descriptor = {
      protocol: 'relay.rpc-descriptor/v2', endpoint: v2Endpoint,
      capability_hash: localCapabilityHashV2(), methods_schema: 'relay.rpc-methods/v2',
      read_model_versions: ['v1', 'v2'],
    };
    bootstrapHandle = await createBootstrapServer({ endpoint: bootstrapEndpoint, descriptor: v2Descriptor });
    await writeDescriptor(repoRoot, descriptor);
  } catch (error) {
    await bootstrapHandle?.close().catch(() => {});
    await v2Handle?.close().catch(() => {});
    await handle.close().catch(() => {});
    throw withReason(error);
  }

  return {
    descriptor,
    localUserCapability: capability,
    handle,
    v2Handle,
    bootstrapHandle,
    v2Descriptor,
    v2Endpoint,
    bootstrapEndpoint,
    ledgerPath: ledgerPath(repoRoot),
    get discovery() { return known; },
    close: async () => {
      for (const set of subscriptions.values()) for (const subscription of set) subscription.closed = true;
      subscriptions.clear();
      // driver 先于 actor 收口：它的终态写还要经 actor 队列落盘，也顺带杀掉在跑的步骤子进程。
      await Promise.allSettled([...drivers.keys()].map(runId => stopDriver(runId)));
      for (const actor of actors.values()) actor.stop();
      await Promise.allSettled([...actors.values()].map(actor => actor.done));
      actors.clear();
      // descriptor 留在盘上：它是陈旧发现信息，不是所有权（design/07 §3）。
      await bootstrapHandle.close();
      await v2Handle.close();
      await handle.close();
    },
  };
}

/** 只读工具：列出仓内已知的 v2 Run 根。给 launcher / 诊断用，不参与控制路径。 */
export async function listRunRoots(repoRoot) {
  try {
    const entries = await readdir(join(resolve(repoRoot), '.dh-relay'), { withFileTypes: true });
    return entries.filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}
