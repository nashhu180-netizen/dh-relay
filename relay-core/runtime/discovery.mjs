// discovery.mjs — service 重启后的固定发现顺序（design/07 §5.2、design/08 §5）。
//
//   ① 扫 <repo>/.dh-relay/<run_id>/：run.json + events.jsonl + state.json 齐备且过协议校验 = 完整 v2 Run
//   ② 只对 runtime-operations.json 对账：Store event 与 ledger 冲突一律以 **Store event** 为准
//   ③ 用发现结果修复用户级 runs.json 加速索引（仍持既有全局 <runs.json>.lock）
//   ④ 只读扫 .dh-runtime/relay/ 并投影 legacy-v1
//
// 顺序是硬的，理由在每一步的注释里：**Run Store 才是 Run 真相**，ledger 是索引与保留号，
// runs.json 只是跨仓发号加速表。任何一步反过来（用索引覆盖事件账）都会把已发生的事实抹掉。
//
// 本模块只读 Run 与 legacy 现场，不取 lease、不迁移、不推进任何业务节点。

import { readFile, readdir, rename, writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';

import { readEventLog } from '../store/store.mjs';
import { loadAjv, validateOne } from '../tools/validate.mjs';
import { defaultIndexPath } from './startrun.mjs';
import { acquireRepoLock } from './repolock.mjs';
import { readLedger, seedNextSeq, writeLedger } from './ledger.mjs';
import { RUN_ID_PATTERN } from './runid.mjs';

let validatorCache;
function contractValidator() {
  validatorCache ??= loadAjv();
  return validatorCache;
}

/**
 * 完整性判据（design/08 §5 第 1 步）：三份文件齐备 + 协议校验通过。少一条都不是可控 Run。
 *
 * ⚠️「协议校验通过」包含**事件账逐行校验**，不是「events.jsonl 这个文件名在」。
 * 只看存在性会把一本读不动的账端进 Read Model：list/status 已经把它当成可控 Run 报出去，
 * 随后任何 openStore 都会 fail-closed——两条判据不一致，就是「看得见、打不开」。
 * 这里复用 Store 的同一段 `readEventLog`，让两者永远同真同假。
 */
async function classifyRunRoot(root, runId) {
  let run;
  try {
    run = JSON.parse(await readFile(join(root, 'run.json'), 'utf8'));
  } catch (error) {
    return { state: error?.code === 'ENOENT' ? 'incomplete_store' : 'corrupt_store', detail: 'run.json' };
  }
  if (run?.run_id !== runId) return { state: 'run_id_mismatch', detail: String(run?.run_id ?? '') };
  let state;
  try {
    state = JSON.parse(await readFile(join(root, 'state.json'), 'utf8'));
    await readFile(join(root, 'events.jsonl'), 'utf8');
  } catch (error) {
    return { state: error?.code === 'ENOENT' ? 'incomplete_store' : 'corrupt_store', detail: 'state/events' };
  }
  const { ajv, byId } = contractValidator();
  if (!validateOne(ajv, byId, 'relay.run/v2', run).ok) return { state: 'corrupt_store', detail: 'run-schema' };
  if (!validateOne(ajv, byId, 'relay.run-state/v1', state).ok) return { state: 'corrupt_store', detail: 'state-schema' };
  try {
    await readEventLog({ root, run });
  } catch (error) {
    // JSON 坏 / torn tail / seq 缺口全落这里（E_EVENT_LOG_CORRUPT:*）。
    return { state: 'corrupt_store', detail: String(error?.message ?? 'events-unreadable') };
  }
  return { state: 'complete', run, ledgerView: state };
}

/** Run Store 里这条 operation 是否真的落过账。判据是 operation 工件，与事件严格同批写入。 */
async function operationInStore(root, receiptId) {
  if (!receiptId) return false;
  try {
    const receipt = JSON.parse(await readFile(join(root, 'operations', `${receiptId}.json`), 'utf8'));
    return receipt?.receipt_id === receiptId;
  } catch {
    return false;
  }
}

async function listDirectories(root) {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries.filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeIndexAtomic(indexPath, index) {
  await mkdir(resolve(indexPath, '..'), { recursive: true });
  const temporary = `${indexPath}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  await rename(temporary, indexPath);
}

/**
 * 第 ③ 步：用盘上事实重建**本仓**分段。
 * 两条纪律：
 *   · 其他仓的 segment 一个字都不能碰——这把锁是所有仓共用的一把，跨仓 service 同时在改它；
 *   · max_seq 只增不减。号发过就不回收：把 max_seq 按现存 Run 调小，等于允许把已删 Run 的号再发一次。
 */
async function repairIndex({ indexPath, repoRoot, runIds, issuedRunIds = [], clock }) {
  const canonicalRepo = resolve(repoRoot);
  const lock = await acquireRepoLock({ path: `${indexPath}.lock`, clock });
  try {
    let index;
    try {
      index = JSON.parse(await readFile(indexPath, 'utf8'));
      if (index?.version !== 1 || typeof index.repos !== 'object' || index.repos === null) throw new Error('shape');
    } catch (error) {
      if (error?.code && error.code !== 'ENOENT') throw error;
      index = { version: 1, repos: {} };
    }
    const bucket = index.repos[canonicalRepo] ?? { max_seq: 0, runs: [] };
    const previous = new Map((bucket.runs ?? []).map(entry => [entry.run_id, entry]));
    const highWater = seedNextSeq({ runIds: [...issuedRunIds, ...runIds, ...previous.keys()], indexMaxSeq: bucket.max_seq ?? 0 });
    index.repos[canonicalRepo] = {
      max_seq: highWater,
      runs: runIds.map(runId => previous.get(runId) ?? { run_id: runId, summary: '', created_at: null }),
    };
    await writeIndexAtomic(indexPath, index);
    return index.repos[canonicalRepo];
  } finally {
    await lock.release();
  }
}

/**
 * ledger 认领的 run_id 集合。没被任何 operation 认领的盘上根 = 孤儿 Store。
 * 缺 ledger 时返回空集：那等于「什么都认不了」，于是全部按孤儿只读处理——
 * 这是 fail-closed 的那一侧，比默认可写安全。
 */
function claimedRunIds(ledger) {
  const claimed = new Set();
  for (const operation of Object.values(ledger?.operations ?? {})) {
    if (operation?.run_id) claimed.add(operation.run_id);
  }
  return claimed;
}

/**
 * 跑完整的四步发现。返回同一份 Read Model 素材 + fail-closed report + 已对账的 ledger。
 * @returns {Promise<{v2:object[],legacy:object[],roots:Map<string,string>,report:object[],ledger:object,next_seq:number}>}
 */
export async function scanRuns({
  repoRoot,
  legacyRoot = join(resolve(repoRoot), '.dh-runtime', 'relay'),
  ledger = null,
} = {}) {
  if (!repoRoot) throw new Error('E_BAD_VALUE:repo-root-required');
  const storeRoot = join(resolve(repoRoot), '.dh-relay');
  const report = [];
  const claimed = claimedRunIds(ledger);

  // ① Run 真相：盘上的完整 v2 Run。
  const roots = new Map();
  const v2 = [];
  /**
   * 已被占用过的号。**包含残缺/损坏根**——design/08 §3 的 seed 只说「完整 v2 Run 根」，
   * 但一个已经建到一半的 `R002-…/` 目录同样意味着 2 号发出去过。把它排除在 seed 之外，
   * 下一个 Run 就会拿到 2 号并撞进那个半成品目录（`run.json` 是 wx 独占创建，直接 EEXIST）。
   * 「绝不发第二个号」优先于 seed 口径的字面最小集。
   */
  const issuedRunIds = [];
  for (const name of await listDirectories(storeRoot)) {
    if (RUN_ID_PATTERN.test(name)) issuedRunIds.push(name);
    const root = join(storeRoot, name);
    const verdict = await classifyRunRoot(root, name);
    if (verdict.state !== 'complete') {
      report.push({ kind: verdict.state, run_id: name, detail: verdict.detail });
      continue;
    }
    roots.set(name, root);
    // 孤儿（盘上有根、ledger 里无人认领）投影为**只读的 v2 条目**：
    // 不隐藏——Run Store 才是 Run 真相，用索引缺失否定事件账里的事实等于抹掉已发生的事；
    // 也不可写——它的来处无从对账，在上面建 actor 继续写字就是让一个无人认领的现场
    // 继续产生新事实。`source` 仍是 runtime-v2：它不是 legacy，只是没人认领。
    v2.push({
      run_id: name, source: 'runtime-v2', read_only: !claimed.has(name),
      run_status: verdict.ledgerView.run_status ?? null,
      group: verdict.ledgerView.group ?? null,
      updated_at: verdict.ledgerView.updated_at ?? null,
    });
  }
  const orphans = new Set([...roots.keys()].filter(runId => !claimed.has(runId)));

  // ④ legacy 只读投影。只投目录名这一条**可读事实**；其余一律 null——
  // v1 的事件形状不是 v2 契约，从它推 run_status 就是猜（design/08 §1 明令不得）。
  const legacy = (await listDirectories(legacyRoot))
    .filter(name => !roots.has(name))
    .map(name => ({ run_id: name, source: 'legacy-v1', read_only: true, run_status: null, group: null, updated_at: null }));

  return { v2, legacy, roots, report, issuedRunIds, orphans };
}

/**
 * run_list 的**源头排序**（B-13「分堆与排序由源头给」在正式 Read Model 上的落地，F-026）：
 * 分堆词表按报警优先 `needs_you → running → done → failed`（unknown 状态映射进 needs_you、
 * 必须让人先看见——与 run-state/v1 group 条款同一设计意图）；词表外的 group 自成一堆、
 * 排在已知堆之后、堆间按首现顺序（承 P4「词表外自成一节原样打印」）；group 为 null
 * （legacy / 无账面）殿后。堆内按 run_id 升序——确定性排序，不依赖目录扫描顺序。
 * 客户端一律按此序原样渲染，不重排、不从 run_status 推导（P4 架构约束）。
 */
const KNOWN_GROUP_ORDER = new Map([['needs_you', 0], ['running', 1], ['done', 2], ['failed', 3]]);

export function orderRunSummaries(items) {
  const unknownRanks = new Map();
  const rankOf = (group) => {
    if (group === null || group === undefined) return Number.MAX_SAFE_INTEGER;
    if (KNOWN_GROUP_ORDER.has(group)) return KNOWN_GROUP_ORDER.get(group);
    if (!unknownRanks.has(group)) unknownRanks.set(group, KNOWN_GROUP_ORDER.size + unknownRanks.size);
    return unknownRanks.get(group);
  };
  for (const item of items) rankOf(item.group); // 词表外 group 的首现顺位先定格，排序才稳定
  return [...items].sort((a, b) => {
    const ra = rankOf(a.group);
    const rb = rankOf(b.group);
    if (ra !== rb) return ra - rb;
    return a.run_id < b.run_id ? -1 : a.run_id > b.run_id ? 1 : 0;
  });
}

export async function discoverRepo({
  repoRoot,
  indexPath = defaultIndexPath(),
  legacyRoot = join(resolve(repoRoot), '.dh-runtime', 'relay'),
  clock = () => Date.now(),
} = {}) {
  // ledger 先读：第 ① 步要靠它区分「有人认领的 Run」与「孤儿」，只读投影因此在扫描当场定下来。
  const ledger = await readLedger(repoRoot);
  const { v2, legacy, roots, report, issuedRunIds, orphans } = await scanRuns({ repoRoot, legacyRoot, ledger });

  // ② 只对 ledger 对账。这一步**不创建、不删除任何 Run**——它只让索引与事实一致。
  let ledgerChanged = false;
  for (const [key, operation] of Object.entries(ledger.operations)) {
    const root = operation?.run_id ? roots.get(operation.run_id) : null;
    if (operation?.run_id && !root) {
      // 保留号已发但根还没建起来：号必须留着，重试走同一 run_id，绝不释放。
      if (operation.phase !== 'failed') report.push({ kind: 'reserved_without_root', run_id: operation.run_id, phase: operation.phase, key });
      continue;
    }
    if (!root) continue;
    const backed = await operationInStore(root, operation.receipt_id);
    if (operation.phase === 'receipt_committed' && !backed) {
      // ledger 说提交了，Run Store 里却没有——提交没落成。退回可重做的相位，
      // 否则客户端会拿到一个在事件账里根本不存在的 Receipt。
      ledger.operations[key] = { ...operation, phase: 'actor_ready' };
      ledgerChanged = true;
      report.push({ kind: 'receipt_not_in_store', run_id: operation.run_id, receipt_id: operation.receipt_id, key });
    } else if (operation.phase === 'actor_ready' && backed) {
      // Run Store 有事件即为真：ledger 只是崩在了最后一步落盘上。
      ledger.operations[key] = { ...operation, phase: 'receipt_committed' };
      ledgerChanged = true;
    }
  }
  // 盘上有根、ledger 里无人认领 = 孤儿。报出来，但它是真实存在的 Run：
  // 不隐藏（Run Store 才是真相）、只读投影（见 scanRuns）、也绝不静默覆盖或重发它的号。
  for (const runId of orphans) report.push({ kind: 'orphan_store', run_id: runId });
  if (ledgerChanged) await writeLedger(repoRoot, ledger);

  // ③ 用发现结果修复加速索引。索引永远不是 Run 或 Receipt 真相。
  const reservations = Object.values(ledger.operations).map(operation => operation?.run_id).filter(Boolean);
  const bucket = await repairIndex({ indexPath, repoRoot, runIds: [...roots.keys()], issuedRunIds, clock });
  const nextSeq = seedNextSeq({ runIds: [...issuedRunIds, ...reservations], indexMaxSeq: bucket.max_seq });
  if (ledger.next_seq !== nextSeq) {
    ledger.next_seq = nextSeq;
    await writeLedger(repoRoot, ledger);
  }

  return { v2, legacy, roots, report, orphans, ledger, next_seq: nextSeq };
}
