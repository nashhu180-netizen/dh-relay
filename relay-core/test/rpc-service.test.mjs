// rpc-service.test.mjs — DHR_30 步骤 3：把连接闸、method schema、稳定业务 error 与
// subscribe barrier/cursor 接进 service handlers 之后的**行为**回归。
//
// 全部经真 socket、真 Store、真 lease 跑；没有任何 handler 注入 seam。

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { localCapabilityHash, localCapabilityHashV2 } from '../rpc/capabilities.mjs';
import { createTransportClient } from '../rpc/transport.mjs';
import { endpointForRepo } from '../runtime/endpoint.mjs';
import { operationKey, requestDigest, writeLedger } from '../runtime/ledger.mjs';
import { localDateStamp } from '../runtime/runid.mjs';
import { startRuntimeService } from '../runtime/service.mjs';
import { createStore } from '../store/store.mjs';
import { createExecutorIdentity } from '../profiles/identity.mjs';
import { loadAjv, validateOne } from '../tools/validate.mjs';

const execFileAsync = promisify(execFile);
const contracts = loadAjv();

const runDocument = (slug = 'probe') => ({
  protocol: 'relay.run/v2', run_id: `R001-${slug}-20260827`, workflow_name: slug, summary: slug,
  trigger: 'system', created_at: '2026-08-27T00:00:00Z',
  nodes: [{ node_id: 'node-a', title: 'node', role: 'work', required: false, executor_profiles: [{ kind: 'process', ref: 'bin/probe' }] }],
});

const until = async (check, timeout = 8_000) => {
  const end = Date.now() + timeout;
  for (;;) {
    const value = check();
    if (value) return value;
    if (Date.now() > end) throw new Error('timeout');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
};

async function makeRepo(prefix) {
  const repoRoot = await mkdtemp(join(tmpdir(), prefix));
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  return repoRoot;
}

async function startService(t, prefix, options = {}) {
  const repoRoot = options.repoRoot ?? await makeRepo(prefix);
  const runtimeRoot = join(repoRoot, 'private-runtime');
  await mkdir(runtimeRoot, { recursive: true });
  const endpoint = endpointForRepo(repoRoot, { runtimeRoot });
  const service = await startRuntimeService({
    repoRoot, endpoint, localUserCapability: 'local-capability',
    indexPath: join(repoRoot, 'private-runtime', 'runs.json'), ...options,
  });
  t.after(async () => { await service.close().catch(() => {}); });
  if (!options.repoRoot) t.after(async () => { await rm(repoRoot, { recursive: true, force: true }); });
  return { repoRoot, endpoint, service };
}

/** 一个连接 = 一个客户端。所有帧都过冻结 relay.rpc/v1 校验，杜绝「测试自己发非法帧还绿」。 */
async function connect(t, endpoint, { clientId = 'cli-1', capabilityHash = localCapabilityHash() } = {}) {
  const responses = new Map();
  const notifications = [];
  const client = await createTransportClient(endpoint, {
    onFrame: (frame) => {
      const verdict = validateOne(contracts.ajv, contracts.byId, 'relay.rpc/v1', frame);
      assert.ok(verdict.ok, `服务端发出的帧不合冻结契约：${verdict.reason}@${verdict.at} ${JSON.stringify(frame)}`);
      if ('id' in frame) responses.set(frame.id, frame);
      else notifications.push(frame);
    },
  });
  t.after(() => client.destroy());
  let nextId = 0;
  const call = async (method, params, { requestId } = {}) => {
    const id = (nextId += 1);
    client.send({
      jsonrpc: '2.0', id, method,
      handshake: {
        protocol_version: 'relay.rpc/v1', runtime_version: '0.0.0',
        capability_hash: capabilityHash, client_id: clientId, request_id: requestId ?? `req-${id}`,
      },
      params,
    });
    return until(() => responses.get(id));
  };
  return { client, call, notifications, responses };
}

const LEGACY_FIXED_V1_HASH = '994d5f038cd1bcbbb9463eed5ca04b2ffc324f07b374571899b8df3a6c5c971e';

const authorize = (session, descriptor) => session.call('contracts', {
  descriptor_version: descriptor.descriptor_version, repo_id: descriptor.repo_id,
  generation: descriptor.generation, local_user_capability: 'local-capability',
});

async function bootstrapV2(t, endpoint) {
  let response = null;
  const client = await createTransportClient(endpoint, { onFrame: frame => { response = frame; } });
  t.after(() => client.destroy());
  client.send({ protocol: 'relay.rpc-bootstrap/v1' });
  return until(() => response);
}

async function connectV2(t, endpoint, { clientId = 'cli-v2' } = {}) {
  const responses = new Map();
  const notifications = [];
  const client = await createTransportClient(endpoint, {
    onFrame: (frame) => {
      const verdict = validateOne(contracts.ajv, contracts.byId, 'relay.rpc/v2', frame);
      assert.ok(verdict.ok, `v2 服务端帧不合合同：${verdict.reason}@${verdict.at} ${JSON.stringify(frame)}`);
      if ('id' in frame) responses.set(frame.id, frame);
      else notifications.push(frame);
    },
  });
  t.after(() => client.destroy());
  let nextId = 0;
  const call = async (method, params, { requestId } = {}) => {
    const id = (nextId += 1);
    client.send({
      jsonrpc: '2.0', id, method,
      handshake: {
        protocol_version: 'relay.rpc/v2', runtime_version: '0.0.0', capability_hash: localCapabilityHashV2(),
        client_id: clientId, request_id: requestId ?? `v2-req-${id}`,
      },
      params,
    });
    return until(() => responses.get(id));
  };
  return { client, call, notifications };
}

test('service：bind 失败的候选一个字节都不碰私有 credential', async (t) => {
  const repoRoot = await makeRepo('dhr30-cred-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const runtimeRoot = join(repoRoot, 'private-runtime');
  await mkdir(runtimeRoot, { recursive: true });
  const credentialRoot = join(repoRoot, 'private-credentials');
  const endpoint = endpointForRepo(repoRoot, { runtimeRoot });
  const indexPath = join(runtimeRoot, 'runs.json');

  const first = await startRuntimeService({ repoRoot, endpoint, credentialRoot, indexPath });
  t.after(async () => { await first.close().catch(() => {}); });
  const { readdir } = await import('node:fs/promises');
  const before = await readdir(credentialRoot);
  assert.equal(before.length, 1, '已 bind 的 service 才创建 credential');

  // 输家：bind 失败 → 必须在碰 credential 之前就停下（design/07 §3.4）。
  const loser = join(repoRoot, 'loser-credentials');
  await assert.rejects(() => startRuntimeService({ repoRoot, endpoint, credentialRoot: loser, indexPath }),
    (error) => { assert.equal(error.reason, 'E_ENDPOINT_IN_USE'); return true; });
  await assert.rejects(() => readdir(loser), /ENOENT/, 'bind 失败的候选不得创建 credential 目录');

  // credential 绝不进项目：descriptor 与账本里都不许出现它的值。
  const descriptorText = await import('node:fs/promises').then(fs => fs.readFile(join(repoRoot, '.dh-relay', 'runtime.json'), 'utf8'));
  assert.equal(descriptorText.includes(first.localUserCapability), false, 'descriptor 不得携带本机 capability');
});

test('service：contracts 是连接唯一首请求，未授权与身份不符都不断连', async (t) => {
  const { endpoint, service } = await startService(t, 'dhr30-auth-');
  const session = await connect(t, endpoint);

  const early = await session.call('listRuns', { include_legacy: false });
  assert.equal(early.error.data.reason, 'E_CLIENT_NOT_AUTHORIZED');

  const wrongIdentity = await session.call('contracts', {
    descriptor_version: 1, repo_id: service.descriptor.repo_id,
    generation: 'not-the-current-generation', local_user_capability: 'local-capability',
  });
  assert.equal(wrongIdentity.error.data.reason, 'E_SERVICE_IDENTITY_MISMATCH');

  const wrongCapability = await session.call('contracts', {
    descriptor_version: 1, repo_id: service.descriptor.repo_id,
    generation: service.descriptor.generation, local_user_capability: 'guessed',
  });
  assert.equal(wrongCapability.error.data.reason, 'E_SERVICE_IDENTITY_MISMATCH');

  // 失败的身份确认不得断连——客户端还要在同一连接上重试。
  const ok = await authorize(session, service.descriptor);
  assert.deepEqual(ok.result, service.descriptor);

  // 已授权连接上再发 contracts = 协议违例：唯一首请求就是唯一。
  const twice = await authorize(session, service.descriptor);
  assert.equal(twice.error.data.reason, 'E_CLIENT_NOT_AUTHORIZED');
  // 仍然不断连：业务方法照常可用。
  assert.equal((await session.call('listRuns', { include_legacy: false })).result.view, 'run_list');
});

test('service：未知 run / legacy 只读 / cursor 缺口都是稳定 error，连接一路不断', async (t) => {
  const { repoRoot, endpoint, service } = await startService(t, 'dhr30-errors-');
  await mkdir(join(repoRoot, '.dh-runtime', 'relay', 'RELAY-DF-old'), { recursive: true });
  const session = await connect(t, endpoint);
  await authorize(session, service.descriptor);

  const unknown = await session.call('inspectRun', { run_id: 'R404-nope-20260827', view: 'status' });
  assert.equal(unknown.error.data.reason, 'E_RUN_NOT_FOUND');

  // legacy 必须能被看见（只读），但任何 control 都拒绝——包括将来新增的 action。
  const legacyList = await session.call('listRuns', { include_legacy: true });
  const legacyItem = legacyList.result.items.find(item => item.run_id === 'RELAY-DF-old');
  assert.deepEqual(legacyItem, {
    run_id: 'RELAY-DF-old', source: 'legacy-v1', read_only: true,
    run_status: null, group: null, updated_at: null,
  });
  assert.equal((await session.call('listRuns', { include_legacy: false })).result.items.some(item => item.source === 'legacy-v1'),
    false, 'include_legacy=false 时不得混进 legacy 条目');
  const legacyStop = await session.call('control', { run_id: 'RELAY-DF-old', action: 'stop' });
  assert.equal(legacyStop.error.data.reason, 'E_LEGACY_READ_ONLY');
  const legacyResume = await session.call('control', { run_id: 'RELAY-DF-old', action: 'resume' });
  assert.equal(legacyResume.error.data.reason, 'E_LEGACY_READ_ONLY');
  const legacyStatus = await session.call('inspectRun', { run_id: 'RELAY-DF-old', view: 'status' });
  assert.equal(legacyStatus.result.read_only, true);
  assert.equal(legacyStatus.result.status.ledger, null, 'legacy 的账面事实读不到就是 null，绝不猜');

  // 一路错下来连接必须还活着：可预期失败不用断连表达（design/07 §5.2）。
  const started = await session.call('start', { run: runDocument('errors') });
  assert.equal(started.result.receipt.state, 'committed');
  const gap = await session.call('subscribe', { run_id: started.result.receipt.run_id, after_seq: 9_999 });
  assert.equal(gap.error.data.reason, 'E_CURSOR_GAP');
  assert.equal((await session.call('listRuns', { include_legacy: false })).result.view, 'run_list', '连接仍可用');

  // B1 双根并列（R-J-02）：v2 与 legacy 同仓共存时，同一份 include_legacy=true 清单必须同列两根；
  // 默认清单仍只含 v2。上文对 legacy 的 stop/resume 拒绝（E_LEGACY_READ_ONLY）即同场景的只读半条。
  const v2RunId = started.result.receipt.run_id;
  const both = (await session.call('listRuns', { include_legacy: true })).result.items;
  assert.ok(both.some(item => item.run_id === v2RunId && item.source === 'runtime-v2'),
    '双根并列：v2 run 必须在 include_legacy=true 清单里');
  assert.ok(both.some(item => item.run_id === 'RELAY-DF-old' && item.source === 'legacy-v1' && item.read_only === true),
    '双根并列：legacy run 必须同份清单可见且只读');
  const defaults = (await session.call('listRuns', { include_legacy: false })).result.items;
  assert.ok(defaults.some(item => item.run_id === v2RunId), '默认清单必须含 v2 run');
  assert.equal(defaults.some(item => item.source === 'legacy-v1'), false, '默认清单不得混进 legacy');
});

test('service：孤儿 Store 只读——可 list/inspect/subscribe，一切 mutation 与 actor 建立都拒绝', async (t) => {
  // design/08 §3：「Run 根已存在而 ledger 不在时作为孤儿 Store fail-closed」。
  // 本卡对它的解释（findings F-009）是「进 report + 仍可列出只读 + 其号计入 seed」——
  // 「只读」必须是机器事实：孤儿的来处无从对账，让 resume 在上面建 actor 写字，
  // 等于用一个无人认领的现场继续发生新事实。
  const repoRoot = await makeRepo('dhr30-orphan-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const orphanId = 'R007-orphan-20260827';
  const orphanRoot = join(repoRoot, '.dh-relay', orphanId);
  const store = await createStore({ root: orphanRoot, run: { ...runDocument('orphan'), run_id: orphanId } });
  await store.appendEvent({ kind: 'run_created', at: '2026-08-27T00:00:00Z' });

  const { endpoint, service } = await startService(t, 'dhr30-orphan-', { repoRoot });
  const session = await connect(t, endpoint);
  await authorize(session, service.descriptor);

  // ① 可读：Run Store 才是 Run 真相，索引缺失不能否定事件账里已经发生的事实。
  const listed = (await session.call('listRuns', { include_legacy: false })).result.items
    .find(item => item.run_id === orphanId);
  assert.ok(listed, '孤儿 Run 不得从列表消失');
  assert.equal(listed.source, 'runtime-v2', '孤儿仍是 v2 Run，不得被降级成 legacy');
  assert.equal(listed.read_only, true, '孤儿必须自带只读标记');
  assert.equal((await session.call('inspectRun', { run_id: orphanId, view: 'status' })).result.read_only, true);
  const detail = await session.call('inspectRun', { run_id: orphanId, view: 'detail' });
  assert.equal(detail.result.detail?.protocol, 'relay.run-state/v1', '孤儿的事件账读得到，detail 不该是 null');
  assert.equal((await session.call('subscribe', { run_id: orphanId, after_seq: null })).result.view,
    'event_stream_snapshot', 'subscribe 是只读的，孤儿照样可订');

  // ② 一切 mutation 与 actor 建立都拒绝，且盘上一个字节都不动。
  const before = await readFile(join(orphanRoot, 'events.jsonl'), 'utf8');
  for (const action of ['stop', 'resume']) {
    const denied = await session.call('control', { run_id: orphanId, action }, { requestId: `req-${action}` });
    assert.equal(denied.error?.data?.reason, 'E_ORPHAN_STORE_READ_ONLY',
      `${action} 必须被拒，实得 ${JSON.stringify(denied)}`);
  }
  assert.equal(await readFile(join(orphanRoot, 'events.jsonl'), 'utf8'), before, '被拒的 control 不得往孤儿 Store 写一个字节');
  await assert.rejects(() => access(join(orphanRoot, 'host-lease.json')), /ENOENT/,
    '孤儿 Run 绝不许建立 actor 取 lease');
  // 连接一路不断：这是稳定拒绝，不是协议违例。
  assert.equal((await session.call('listRuns', { include_legacy: false })).result.view, 'run_list');
});

test('service：每一份 error data 都带 receipt——非 operation 错误为 null，operation 可预期失败为 failed Receipt', async (t) => {
  // design/08 §1 逐字：「RPC error response 一律为 `{reason:reason_code, receipt:relay.launch-receipt/v2|null}`」。
  // 「一律」不是「有 Receipt 时才带」：客户端要靠 `receipt` 这个字段**在不在**来区分
  // 「这次操作确实失败了（带 failed Receipt，同键重试拿同一份）」与「这次连操作都没开始
  // （receipt=null，重试是安全的）」。字段可省略时两种情况在线上完全同形，只能靠猜。
  const { repoRoot, endpoint, service } = await startService(t, 'dhr30-errreceipt-');
  const session = await connect(t, endpoint);

  // ① 连接闸：还没授权就调业务方法。这不是 operation，receipt 必须是显式 null。
  const early = await session.call('listRuns', { include_legacy: false });
  assert.equal(early.error.data.reason, 'E_CLIENT_NOT_AUTHORIZED');
  assert.ok(Object.hasOwn(early.error.data, 'receipt'), 'error data 必须恒带 receipt 字段');
  assert.equal(early.error.data.receipt, null);

  await authorize(session, service.descriptor);

  // ② 读侧稳定拒绝同样恒带 receipt:null。
  const unknown = await session.call('inspectRun', { run_id: 'R404-nope-20260827', view: 'status' });
  assert.equal(unknown.error.data.reason, 'E_RUN_NOT_FOUND');
  assert.equal(unknown.error.data.receipt, null);

  const started = await session.call('start', { run: runDocument('errreceipt') }, { requestId: 'req-start' });
  const runId = started.result.receipt.run_id;
  const gap = await session.call('subscribe', { run_id: runId, after_seq: 9_999 });
  assert.equal(gap.error.data.reason, 'E_CURSOR_GAP');
  assert.equal(gap.error.data.receipt, null);

  // ③ operation 的可预期失败：新一届 service 手上没有活 session，stop 拒绝——
  // 这次是**已经发过号的 operation**，必须回一份 failed Receipt 而不是 null。
  await service.close();
  const restarted = await startService(t, 'dhr30-errreceipt-', { repoRoot });
  const second = await connect(t, restarted.endpoint);
  await authorize(second, restarted.service.descriptor);
  const stopped = await second.call('control', { run_id: runId, action: 'stop' }, { requestId: 'req-stop' });
  assert.equal(stopped.error.data.reason, 'E_SERVICE_NOT_READY');
  const failed = stopped.error.data.receipt;
  assert.ok(failed, 'operation 失败必须带 failed Receipt');
  assert.equal(failed.state, 'failed');
  assert.equal(failed.reason, 'E_SERVICE_NOT_READY');
  assert.equal(failed.run_id, runId);
  // 同键重试拿到的是同一份 failed Receipt（design/08 §3 恢复表 `failed` 行：不重新执行）——
  // 这正是「带 Receipt」的用处：客户端凭它知道重试不会再打一枪。
  const retry = await second.call('control', { run_id: runId, action: 'stop' }, { requestId: 'req-stop' });
  assert.deepEqual(retry.result?.receipt ?? retry.error?.data?.receipt, failed);
});

test('service：start 保留号后崩溃重试不发第二个号，Receipt 唯一且落在 Run 事件账', async (t) => {
  const { repoRoot, endpoint, service } = await startService(t, 'dhr30-idem-');
  const session = await connect(t, endpoint);
  await authorize(session, service.descriptor);

  const first = await session.call('start', { run: runDocument('idem') }, { requestId: 'req-start' });
  const receipt = first.result.receipt;
  assert.equal(receipt.state, 'committed');
  assert.equal(receipt.method, 'start');
  assert.equal(receipt.node_id, null);
  assert.equal(receipt.attempt_id, null);

  // 同键同摘要重投：同一 Receipt，绝不第二次执行。
  const replay = await session.call('start', { run: runDocument('idem') }, { requestId: 'req-start' });
  assert.deepEqual(replay.result.receipt, receipt, '同键同摘要必须返回同一持久 Receipt');
  const list = await session.call('listRuns', { include_legacy: false });
  assert.equal(list.result.items.length, 1, '重投不得建出第二个 Run');

  // 同键不同摘要 = 冲突，不执行。
  const conflict = await session.call('start', { run: runDocument('other') }, { requestId: 'req-start' });
  assert.equal(conflict.error.data.reason, 'E_REQUEST_CONFLICT');
  assert.equal((await session.call('listRuns', { include_legacy: false })).result.items.length, 1);

  // Receipt 的真相在 Run 事件账里，不是 ledger。
  const detail = await session.call('inspectRun', { run_id: receipt.run_id, view: 'detail' });
  assert.equal(detail.result.detail.protocol, 'relay.run-state/v1');
  const { readFile } = await import('node:fs/promises');
  const events = (await readFile(join(repoRoot, '.dh-relay', receipt.run_id, 'events.jsonl'), 'utf8'))
    .split('\n').filter(Boolean).map(line => JSON.parse(line));
  const committed = events.filter(event => event.kind === 'operation_committed');
  assert.equal(committed.length, 1, 'operation_committed 必须恰有一条');
  assert.equal(committed[0].detail, `operation:${receipt.receipt_id}:${receipt.request_digest}:committed`);
  const stored = JSON.parse(await readFile(join(repoRoot, '.dh-relay', receipt.run_id, 'operations', `${receipt.receipt_id}.json`), 'utf8'));
  assert.deepEqual(stored, receipt);

  // 新一届 service（= 崩溃重启）必须发现既有 Run，并对同一请求返回同一 Receipt、同一 run_id。
  await service.close();
  const restarted = await startService(t, 'dhr30-idem-', { repoRoot });
  const second = await connect(t, restarted.endpoint, { clientId: 'cli-1' });
  await authorize(second, restarted.service.descriptor);
  const afterRestart = await second.call('start', { run: runDocument('idem') }, { requestId: 'req-start' });
  assert.deepEqual(afterRestart.result.receipt, receipt, '跨重启的同键重试必须给出同一 Receipt');
  assert.deepEqual((await second.call('listRuns', { include_legacy: false })).result.items.map(item => item.run_id), [receipt.run_id]);
});

test('service：stop 在 lease 内先提交 Receipt 再停机，resume 只在新 actor ready 后提交', async (t) => {
  const { repoRoot, endpoint, service } = await startService(t, 'dhr30-control-');
  const session = await connect(t, endpoint);
  await authorize(session, service.descriptor);
  const runId = (await session.call('start', { run: runDocument('control') })).result.receipt.run_id;
  const runRoot = join(repoRoot, '.dh-relay', runId);
  const { readFile, access } = await import('node:fs/promises');

  const stopped = await session.call('control', { run_id: runId, action: 'stop' }, { requestId: 'req-stop' });
  assert.equal(stopped.result.receipt.kind, 'stop');
  assert.equal(stopped.result.receipt.method, 'control');
  assert.equal(stopped.result.receipt.state, 'committed');
  // Receipt 是在自己的 lease 内写下的：它必须已经在事件账里，而 lease 已释放。
  const eventsAfterStop = (await readFile(join(runRoot, 'events.jsonl'), 'utf8')).split('\n').filter(Boolean).map(JSON.parse);
  assert.ok(eventsAfterStop.some(event => event.detail === `operation:${stopped.result.receipt.receipt_id}:${stopped.result.receipt.request_digest}:committed`));
  await assert.rejects(() => access(join(runRoot, 'host-lease.json')), /ENOENT/, '优雅停机必须释放自己的 lease');
  assert.equal((await session.call('inspectRun', { run_id: runId, view: 'status' })).result.status.host, 'dead');

  const resumed = await session.call('control', { run_id: runId, action: 'resume' }, { requestId: 'req-resume' });
  assert.equal(resumed.result.receipt.kind, 'resume');
  assert.equal((await session.call('inspectRun', { run_id: runId, view: 'status' })).result.status.host, 'alive',
    'resume 成功的含义就是新 actor 已取得 lease');
  const eventsAfterResume = (await readFile(join(runRoot, 'events.jsonl'), 'utf8')).split('\n').filter(Boolean).map(JSON.parse);
  const resumeIndex = eventsAfterResume.findIndex(event => event.detail === `operation:${resumed.result.receipt.receipt_id}:${resumed.result.receipt.request_digest}:committed`);
  const leaseIndex = eventsAfterResume.map(event => event.kind).lastIndexOf('lease_acquired');
  assert.ok(leaseIndex < resumeIndex && leaseIndex !== -1, 'resume 的 Receipt 必须晚于新 lease——先回执后取租=撒谎');

  // 重复 stop 用同一 request_id：同一 Receipt，不重复执行。
  const stopAgain = await session.call('control', { run_id: runId, action: 'stop' }, { requestId: 'req-stop' });
  assert.deepEqual(stopAgain.result.receipt, stopped.result.receipt);
});

test('service：subscribe 先快照后增量，cursor 严格连续，断开只清订阅不取消 Run', async (t) => {
  const { endpoint, service } = await startService(t, 'dhr30-sub-');
  const session = await connect(t, endpoint);
  await authorize(session, service.descriptor);
  const runId = (await session.call('start', { run: runDocument('sub') })).result.receipt.run_id;

  const snapshot = await session.call('subscribe', { run_id: runId, after_seq: null });
  assert.equal(snapshot.result.view, 'event_stream_snapshot');
  assert.equal(snapshot.result.run_id, runId);
  assert.equal(snapshot.result.snapshot.run_id, runId);
  assert.ok(snapshot.result.next_seq >= snapshot.result.snapshot_seq);

  // 订阅之后发生的事件必须以 seq 严格递增推过来，且不与快照重叠。
  await session.call('control', { run_id: runId, action: 'stop' }, { requestId: 'req-stop' });
  const live = await until(() => (session.notifications.filter(frame => frame.method === 'event').length > 0
    ? session.notifications.filter(frame => frame.method === 'event') : null));
  const seqs = live.map(frame => frame.params.seq);
  assert.deepEqual(seqs, [...seqs].sort((a, b) => a - b), '推送必须按 seq 递增');
  assert.ok(seqs.every(seq => seq >= snapshot.result.next_seq), '快照里已有的事件不得重复推送');
  const stateFrames = session.notifications.filter(frame => frame.method === 'runStateChanged');
  assert.ok(stateFrames.every(frame => Number.isInteger(frame.params.caused_by_seq)),
    'runStateChanged 必带 caused_by_seq，两种通知才落在同一事件序上');

  // cursor 补发：从 0 之后补，必须严格连续、不重不漏。
  const replayed = await connect(t, endpoint, { clientId: 'cli-2' });
  await authorize(replayed, service.descriptor);
  const fromCursor = await replayed.call('subscribe', { run_id: runId, after_seq: 0 });
  assert.equal(fromCursor.result.view, 'event_stream_snapshot');
  const backfill = await until(() => (replayed.notifications.filter(f => f.method === 'event').length >= fromCursor.result.next_seq - 1
    ? replayed.notifications.filter(f => f.method === 'event') : null));
  assert.deepEqual(backfill.map(f => f.params.seq).slice(0, fromCursor.result.next_seq - 1),
    Array.from({ length: fromCursor.result.next_seq - 1 }, (unused, index) => index + 1),
    'cursor 只补严格大于 after_seq 的连续 seq');

  // 断开连接：只清该连接的订阅，绝不产生 cancel、绝不动 Run（design/06 H4）。
  const before = (await session.call('inspectRun', { run_id: runId, view: 'status' })).result.status;
  replayed.client.destroy();
  await new Promise(resolve => setTimeout(resolve, 100));
  const after = (await session.call('inspectRun', { run_id: runId, view: 'status' })).result.status;
  assert.deepEqual(after.ledger, before.ledger, '客户端断开不得改变 Run 的任何账面状态');
  assert.equal((await session.call('listRuns', { include_legacy: false })).result.items.length, 1);
});

test('DHR_77 service：旧固定 v1 hash 在分派前拒绝且零订阅推送', async (t) => {
  const { endpoint, service } = await startService(t, 'dhr77-old-hash-');
  const session = await connect(t, endpoint, { clientId: 'legacy-v1', capabilityHash: LEGACY_FIXED_V1_HASH });
  const rejected = await session.call('subscribe', { run_id: 'R404-legacy-hash-20260906', after_seq: null });
  assert.equal(rejected.error?.data?.reason, 'E_CAPABILITY_MISMATCH');
  assert.equal(session.notifications.length, 0, '能力不匹配必须早于 subscribe 注册与 event 推送');
  assert.equal(LEGACY_FIXED_V1_HASH === localCapabilityHash(), false);
  await service.close();
});

test('service：actor 换代后订阅无缝重挂——subscribe → stop → resume，新事件仍推给原连接且不重不漏', async (t) => {
  // design/08 §5 的 barrier 挂在 **actor 的 Store 写队列**上。actor 经 stop / lost-lease 之后
  // 由 resume 换成新的一届，旧 barrier 就挂在一个再也不会写字的句柄上——存活的连接从此
  // 静默失聪：既没有断开、也没有错误，只是永远收不到新事件了。这比断连更坏，
  // 因为客户端没有任何信号可以据以重订。
  const { repoRoot, endpoint, service } = await startService(t, 'dhr30-resub-');
  const session = await connect(t, endpoint);
  await authorize(session, service.descriptor);
  const runId = (await session.call('start', { run: runDocument('resub') })).result.receipt.run_id;

  const snapshot = await session.call('subscribe', { run_id: runId, after_seq: null });
  const firstLiveSeq = snapshot.result.next_seq;

  // 换代：stop 让当届 actor 优雅退出，resume 起新一届并取新 lease。
  await session.call('control', { run_id: runId, action: 'stop' }, { requestId: 'req-stop' });
  await session.call('control', { run_id: runId, action: 'resume' }, { requestId: 'req-resume' });

  // 判据用盘上事件账做标尺：快照之后的每一条 seq 都必须**恰好推过一次**。
  const onDisk = (await readFile(join(repoRoot, '.dh-relay', runId, 'events.jsonl'), 'utf8'))
    .split('\n').filter(Boolean).map(line => JSON.parse(line));
  const expected = onDisk.map(event => event.seq).filter(seq => seq >= firstLiveSeq);
  assert.ok(expected.length >= 3,
    'stop 的 operation_committed + resume 的 lease_acquired 与 operation_committed 至少三条');

  const pushed = await until(() => {
    const frames = session.notifications.filter(frame => frame.method === 'event');
    return frames.length >= expected.length ? frames : null;
  });
  assert.deepEqual(pushed.map(frame => frame.params.seq), expected,
    '换代前后的事件必须按 seq 连续推给同一连接：不重、不漏、不乱序');
  // 换代之后写下的那条 Receipt 事件确实到了客户端手上——这才是「无缝」的实质。
  const kinds = pushed.map(frame => frame.params.kind);
  assert.equal(kinds.filter(kind => kind === 'lease_acquired').length, 1, 'resume 的新 lease 事件必须推达');
  assert.equal(kinds.filter(kind => kind === 'operation_committed').length, 2, 'stop 与 resume 两份 Receipt 事件都要推达');
});

test('service：并发同键 start 只落一个 Receipt，并发不同键各得其所', async (t) => {
  const { endpoint, service } = await startService(t, 'dhr30-race-');
  const a = await connect(t, endpoint, { clientId: 'cli-a' });
  const b = await connect(t, endpoint, { clientId: 'cli-a' });
  await authorize(a, service.descriptor);
  await authorize(b, service.descriptor);

  const [left, right] = await Promise.all([
    a.call('start', { run: runDocument('race') }, { requestId: 'same-key' }),
    b.call('start', { run: runDocument('race') }, { requestId: 'same-key' }),
  ]);
  const receipts = [left, right].map(response => response.result?.receipt ?? null);
  const settled = receipts.filter(Boolean);
  // 允许其中一个拿到 in_flight 拒绝（E_REQUEST_IN_FLIGHT），但绝不允许出现两个不同 Receipt。
  const ids = new Set(settled.map(receipt => receipt.receipt_id));
  assert.equal(ids.size <= 1, true, `同键并发不得产生两个 Receipt：${JSON.stringify(receipts)}`);
  for (const response of [left, right]) {
    if (response.error) assert.equal(response.error.data.reason, 'E_REQUEST_IN_FLIGHT');
  }
  assert.equal((await a.call('listRuns', { include_legacy: false })).result.items.length, 1);

  const [one, two] = await Promise.all([
    a.call('start', { run: runDocument('race-a') }, { requestId: 'key-1' }),
    b.call('start', { run: runDocument('race-b') }, { requestId: 'key-2' }),
  ]);
  assert.notEqual(one.result.receipt.run_id, two.result.receipt.run_id, '不同键必须各发一个号，绝不重号');
  assert.equal((await a.call('listRuns', { include_legacy: false })).result.items.length, 3);
});

test('service：ledger 每个 phase 崩溃后重试都收敛到同一 run_id 与同一 Receipt', async (t) => {
  // design/07 §7 第 3 条：「service 在 accepted 到 receipt 各阶段崩溃…Receipt 唯一且持久，
  // 崩溃重试不产生第二个 run_id」。崩在哪一相位，盘上留下的**就是** ledger 里的那个 phase——
  // 所以逐个 phase 摆好现场再拉起新一届 service，正是那句话的可复跑形态。
  const clientId = 'cli-crash';
  const requestId = 'req-crash';

  for (const phase of ['accepted', 'run_id_reserved', 'store_created', 'actor_ready']) {
    // accepted 相位 ledger 里 run_id 为 null，重试号由 service 按自己的时钟现发；其余相位由 fixture
    // 保留号钉死、service 只能沿用。期望值随之二分：钉死相位逐字比对保留号，accepted 相位只验形状、
    // 后续盘上断言以实际 Receipt 为准——彻底关掉 fixture 日期与发号日期的跨午夜窗口（F-017 / R-C-07）。
    const reservedRunId = `R001-crash-${localDateStamp()}`;
    const run = { ...runDocument('crash'), run_id: reservedRunId };
    const repoRoot = await makeRepo(`dhr30-phase-${phase}-`);
    t.after(() => rm(repoRoot, { recursive: true, force: true }));
    const runtimeRoot = join(repoRoot, 'private-runtime');
    await mkdir(runtimeRoot, { recursive: true });

    // 用与客户端完全相同的帧算摘要——摘要对不上就成了 E_REQUEST_CONFLICT，测的就不是恢复了。
    const frame = {
      jsonrpc: '2.0', id: 2, method: 'start',
      handshake: {
        protocol_version: 'relay.rpc/v1', runtime_version: '0.0.0',
        capability_hash: localCapabilityHash(), client_id: clientId, request_id: requestId,
      },
      params: { run },
    };
    const digest = requestDigest(frame);
    const operation = {
      client_id: clientId, request_id: requestId, method: 'start', request_digest: digest,
      run_id: phase === 'accepted' ? null : reservedRunId, phase, receipt_id: null, reason: null,
    };
    let plannedReceipt = null;
    if (phase === 'store_created' || phase === 'actor_ready') {
      const store = await createStore({ root: join(repoRoot, '.dh-relay', reservedRunId), run });
      await store.appendEvent({ kind: 'run_created', at: '2026-08-27T00:00:00Z' });
    }
    if (phase === 'actor_ready') {
      // 崩在「Receipt 已定、还没 flush 到 Run Store」的窗口里：重试必须提交**同一份** Receipt。
      plannedReceipt = {
        protocol: 'relay.launch-receipt/v2', receipt_id: 'rcpt-planned', request_id: requestId,
        client_id: clientId, method: 'start', state: 'committed', reason: null, run_id: reservedRunId,
        node_id: null, attempt_id: null, kind: 'start', issued_at: '2026-08-27T00:00:01Z',
        issued_by_runtime: 'runtime-previous-generation', request_digest: digest,
      };
      operation.receipt_id = plannedReceipt.receipt_id;
      operation.receipt = plannedReceipt;
    }
    await writeLedger(repoRoot, {
      version: 1, next_seq: phase === 'accepted' ? 0 : 1,
      operations: { [operationKey(operation)]: operation },
    });

    const endpoint = endpointForRepo(repoRoot, { runtimeRoot });
    const service = await startRuntimeService({
      repoRoot, endpoint, localUserCapability: 'local-capability',
      indexPath: join(runtimeRoot, 'runs.json'),
    });
    t.after(async () => { await service.close().catch(() => {}); });
    const session = await connect(t, endpoint, { clientId });
    await authorize(session, service.descriptor);

    const retried = await session.call('start', { run }, { requestId });
    const receipt = retried.result?.receipt;
    assert.ok(receipt, `${phase}: 重试必须收敛到一个 Receipt，实得 ${JSON.stringify(retried.error ?? {})}`);
    assert.equal(receipt.state, 'committed', `${phase}: 重试必须提交`);
    if (phase === 'accepted') {
      assert.match(receipt.run_id, /^R001-crash-\d{8}$/, `${phase}: 现发号必须仍是 R001-crash-<日期段> 形态`);
    } else {
      assert.equal(receipt.run_id, reservedRunId, `${phase}: 必须沿用保留号，绝不发第二个号`);
    }
    const settledRunId = receipt.run_id;
    if (plannedReceipt) assert.deepEqual(receipt, plannedReceipt, `${phase}: 必须提交崩溃前定下的同一份 Receipt`);

    const roots = (await readdir(join(repoRoot, '.dh-relay'), { withFileTypes: true }))
      .filter(entry => entry.isDirectory()).map(entry => entry.name);
    assert.deepEqual(roots, [settledRunId], `${phase}: 只能有一个 Run 根`);
    const persisted = JSON.parse(await readFile(join(repoRoot, '.dh-relay', 'runtime-operations.json'), 'utf8'));
    assert.equal(persisted.operations[operationKey(operation)].phase, 'receipt_committed', `${phase}: ledger 必须推进到已提交`);
    // Receipt 的真相落在 Run 事件账里，且只有一条。
    const events = (await readFile(join(repoRoot, '.dh-relay', settledRunId, 'events.jsonl'), 'utf8'))
      .split('\n').filter(Boolean).map(line => JSON.parse(line));
    assert.equal(events.filter(event => event.kind === 'operation_committed').length, 1, `${phase}: operation_committed 只能有一条`);

    // 再重试一次：仍是同一份，绝不第二次执行。
    const again = await session.call('start', { run }, { requestId });
    assert.deepEqual(again.result.receipt, receipt, `${phase}: 二次重试仍须同一 Receipt`);
    await service.close();
  }
});

test('DHR_61：bootstrap 协商独立 v2，Attention 可见且 retry-with-profile 原子开 fresh Attempt', async (t) => {
  const repoRoot = await makeRepo('dhr61-rpc-v2-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const run = runDocument('attention');
  const runRoot = join(repoRoot, '.dh-relay', run.run_id);
  const profileHome = join(repoRoot, 'profile');
  const registryPath = join(repoRoot, 'profiles.json');
  await mkdir(profileHome, { recursive: true });
  await writeFile(join(profileHome, 'config.toml'), 'model = "test-model"\n', 'utf8');
  const profile = {
    executor_profile_id: 'herdr.codex.main', backend: 'herdr', product: 'codex-cli', command_alias: 'codex', account_alias: 'acct-codex-main',
    capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' },
    supported_platforms: ['win32'], headless_supported: true,
    config_fingerprint_rule: { kind: 'file-exists', path_template: '${DHR61_RPC_HOME}/config.toml', fields: [{ pointer: '/model', classification: 'nonsecret' }] },
  };
  await writeFile(registryPath, JSON.stringify({ profiles: [profile] }), 'utf8');
  const profileEnvironment = { DHR61_RPC_HOME: profileHome };
  const identity = createExecutorIdentity(profile, { '/model': 'test-model' });
  const receipt = {
    protocol: 'relay.attempt-receipt/v1', receipt_id: 'receipt-v2-1', run_id: run.run_id,
    node_id: 'node-a', attempt_id: 'attempt-v2-1', issued_at: '2026-08-30T00:00:00.000Z',
    executor_identity: identity, fallback_profile_snapshots: [identity],
  };
  const digest = (...parts) => createHash('sha256').update(parts.join('\n'), 'utf8').digest('hex');
  const reason = 'E_FALLBACK_UNAVAILABLE';
  const pause = {
    protocol: 'relay.fallback-pause/v1',
    pause_id: digest('fallback-pause/v1', run.run_id, 'node-a', 'attempt-v2-1', 'receipt-v2-1', reason),
    run_id: run.run_id, node_id: 'node-a', attempt_id: 'attempt-v2-1', receipt_id: 'receipt-v2-1',
    reason_code: reason, raised_at: '2026-08-30T00:00:01.000Z',
    fence: {
      protocol: 'relay.attempt-fence/v1',
      fence_id: digest('attempt-fence/v1', run.run_id, 'node-a', 'attempt-v2-1', 'receipt-v2-1', reason),
      attempt_id: 'attempt-v2-1', receipt_id: 'receipt-v2-1', reason_code: reason, fenced_at: '2026-08-30T00:00:01.000Z',
    },
    attention: {
      protocol: 'relay.attention/v1',
      attention_id: digest('attention/v1', run.run_id, 'node-a', 'attempt-v2-1', 'receipt-v2-1', reason),
      run_id: run.run_id, node_id: 'node-a', attempt_id: 'attempt-v2-1', receipt_id: 'receipt-v2-1',
      reason_code: reason, state: 'open', raised_at: '2026-08-30T00:00:01.000Z',
    },
    manual_retry_profiles: [identity],
  };
  const store = await createStore({ root: runRoot, run });
  await store.registerAttemptReceipt(receipt);
  await store.appendFallbackPause(pause);
  await writeLedger(repoRoot, { version: 1, next_seq: 1, operations: { claim: { run_id: run.run_id } } });

  const { endpoint, service } = await startService(t, 'dhr61-rpc-v2-', {
    repoRoot, executorProfileRegistryPath: registryPath, profileEnvironment,
  });
  const negotiated = await bootstrapV2(t, service.bootstrapEndpoint);
  assert.deepEqual(negotiated, service.v2Descriptor);
  assert.equal(negotiated.endpoint.address, service.v2Endpoint.address);

  const legacy = await connect(t, endpoint);
  await authorize(legacy, service.descriptor);
  assert.equal((await legacy.call('listRuns', { include_legacy: false })).error.data.reason,
    'E_ATTENTION_REQUIRES_READ_MODEL_V2');

  const v2 = await connectV2(t, negotiated.endpoint);
  const authorized = await v2.call('contracts', {
    descriptor_version: 1, repo_id: service.descriptor.repo_id, generation: service.descriptor.generation,
    local_user_capability: 'local-capability',
  });
  assert.deepEqual(authorized.result, negotiated);
  const listed = await v2.call('listRuns', { include_legacy: false, read_model_version: 'v2' });
  assert.deepEqual(listed.result.open_attentions, [pause.attention]);
  assert.deepEqual(listed.result.items[0].open_attentions, [pause.attention]);
  const inspected = await v2.call('inspectRun', { run_id: run.run_id, view: 'status', read_model_version: 'v2' });
  assert.deepEqual(inspected.result.open_attentions, [pause.attention]);

  const retryParams = {
    run_id: run.run_id, node_id: 'node-a', pause_id: pause.pause_id,
    executor_profile_id: identity.executor_profile_id, retry_request_id: 'b'.repeat(64),
  };
  const retried = await v2.call('retry-with-profile', retryParams, { requestId: 'retry-call-1' });
  assert.equal(retried.result.ok, true);
  assert.notEqual(retried.result.attempt_receipt.attempt_id, receipt.attempt_id);
  const replayed = await v2.call('retry-with-profile', retryParams, { requestId: 'retry-call-2' });
  assert.deepEqual(replayed.result, { ...retried.result, idempotent: true });
  const conflict = await v2.call('retry-with-profile', {
    ...retryParams, retry_request_id: 'c'.repeat(64),
  }, { requestId: 'retry-call-conflict' });
  assert.equal(conflict.error.data.reason, 'E_FALLBACK_PAUSE_CONFLICT',
    'a closed-pause conflict must be a schema-valid RPC error, not a dropped connection');
  assert.deepEqual((await v2.call('inspectRun', { run_id: run.run_id, view: 'status', read_model_version: 'v2' })).result.open_attentions, []);
  assert.equal((await legacy.call('listRuns', { include_legacy: false })).result.items.length, 1,
    'Attention 关闭后冻结 v1 成功 payload 恢复可读');

  const legacyBackfill = await connect(t, endpoint, { clientId: 'cli-v1-backfill' });
  await authorize(legacyBackfill, service.descriptor);
  const snapshot = await legacyBackfill.call('subscribe', { run_id: run.run_id, after_seq: 0 });
  assert.equal(snapshot.result.view, 'event_stream_snapshot');
  const closed = await until(() => legacyBackfill.responses.get(null));
  assert.equal(closed.error.data.reason, 'E_ATTENTION_REQUIRES_READ_MODEL_V2');
  assert.equal(legacyBackfill.notifications.some(frame => frame.method === 'event'
    && ['fallback_pause_created', 'fallback_pause_resolved'].includes(frame.params.kind)), false,
  'v1 cursor backfill must close before exposing a v2-only event kind');
});

test('DHR_61：坏 Run 让列表稳定 fail-closed，但连接仍可读取健康 Run', async (t) => {
  const repoRoot = await makeRepo('dhr61-rpc-recovery-error-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const healthy = runDocument('healthy');
  const damaged = { ...runDocument('damaged'), run_id: 'R002-damaged-20260827' };
  const healthyStore = await createStore({ root: join(repoRoot, '.dh-relay', healthy.run_id), run: healthy });
  await healthyStore.appendEvent({ kind: 'run_created', at: healthy.created_at });
  const damagedRoot = join(repoRoot, '.dh-relay', damaged.run_id);
  const damagedStore = await createStore({ root: damagedRoot, run: damaged });
  await damagedStore.appendEvent({ kind: 'run_created', at: damaged.created_at });
  await writeLedger(repoRoot, {
    version: 1, next_seq: 2,
    operations: { healthy: { run_id: healthy.run_id }, damaged: { run_id: damaged.run_id } },
  });
  const { endpoint, service } = await startService(t, 'dhr61-rpc-recovery-error-', { repoRoot });
  const transactionId = '11111111-1111-4111-8111-111111111111';
  await writeFile(join(damagedRoot, 'mutations', `${transactionId}.prepared.json`),
    JSON.stringify({ protocol: 'relay.store-mutation/v1', transaction_id: transactionId, state: 'prepared', targets: [] }), 'utf8');

  const legacy = await connect(t, endpoint);
  await authorize(legacy, service.descriptor);
  const legacyList = await legacy.call('listRuns', { include_legacy: false });
  assert.ok(legacyList.error, `expected a stable list error, got ${JSON.stringify(legacyList)}`);
  assert.equal(legacyList.error.data.reason, 'E_STORE_MUTATION_RECOVERY_FAILED');
  assert.equal((await legacy.call('inspectRun', { run_id: healthy.run_id, view: 'status' })).result.status.run_id,
    healthy.run_id, 'a stable list error must not drop the connection or poison healthy per-Run reads');

  const negotiated = await bootstrapV2(t, service.bootstrapEndpoint);
  const v2 = await connectV2(t, negotiated.endpoint);
  await v2.call('contracts', {
    descriptor_version: 1, repo_id: service.descriptor.repo_id, generation: service.descriptor.generation,
    local_user_capability: 'local-capability',
  });
  assert.equal((await v2.call('listRuns', { include_legacy: false, read_model_version: 'v2' })).error.data.reason,
    'E_STORE_MUTATION_RECOVERY_FAILED');
  assert.equal((await v2.call('inspectRun', {
    run_id: healthy.run_id, view: 'status', read_model_version: 'v2',
  })).result.status.run_id, healthy.run_id);
});
