import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import {
  bindOwnedEndpoint, createTransportClient, probeEndpoint,
  shouldReclaimEndpoint, shouldUnlinkOnClose, E_ENDPOINT_IN_USE,
} from '../rpc/transport.mjs';
import { localCapabilityHash } from '../rpc/capabilities.mjs';
import { canonicalRepoRoot, endpointForRepo, repoHash } from '../runtime/endpoint.mjs';
import { createHostSessionActor } from '../runtime/host.mjs';
import { ensureRuntimeService } from '../runtime/launcher.mjs';
import { startRuntimeService, validateRuntimeDocument } from '../runtime/service.mjs';
import { createStore } from '../store/store.mjs';

const runDocument = (runId = 'R001-probe-20260823') => ({
  protocol: 'relay.run/v2', run_id: runId, workflow_name: 'probe', summary: 'probe',
  trigger: 'system', created_at: '2026-08-23T00:00:00Z',
  nodes: [{ node_id: 'node-a', title: 'node', role: 'work', required: false, executor_profiles: [{ kind: 'process', ref: 'bin/probe' }] }],
});

const h6DepthOneNodes = () => [
  { node_id: 'gate', title: '闸', role: '复核', required: false,
    executor_profiles: [{ kind: 'dsh-agent', ref: 'bridge/dsh' }] },
  { node_id: 'final', title: '终', role: '执行', required: true,
    depends_on: ['gate'],
    executor_profiles: [{ kind: 'process', ref: 'bin/x' }] },
];

async function runFixture(relativePath) {
  return JSON.parse(await readFile(new URL(`../fixtures/${relativePath}`, import.meta.url), 'utf8'));
}

const until = async (check, timeout = 2_000) => {
  const end = Date.now() + timeout;
  while (!check()) {
    if (Date.now() > end) throw new Error('timeout');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
};
const execFileAsync = promisify(execFile);

test('Runtime service：先 contracts 身份确认，随后 listRuns 返回唯一 Read Model', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr30-service-'));
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  const runtimeRoot = join(repoRoot, 'private-runtime');
  const endpoint = endpointForRepo(repoRoot, { runtimeRoot });
  const localUserCapability = 'local-capability';
  const service = await startRuntimeService({ repoRoot, endpoint, localUserCapability });
  t.after(async () => { await service.close(); await rm(repoRoot, { recursive: true, force: true }); });
  const received = [];
  const client = await createTransportClient(endpoint, { onFrame: frame => received.push(frame) });
  t.after(() => client.destroy());
  const handshake = { protocol_version: 'relay.rpc/v1', runtime_version: '0.0.0', capability_hash: localCapabilityHash(), client_id: 'test-client', request_id: 'request-1' };
  client.send({ jsonrpc: '2.0', id: 1, method: 'listRuns', handshake, params: {} });
  await until(() => received.length === 1);
  assert.equal(received[0].error.data.reason, 'E_CLIENT_NOT_AUTHORIZED');
  client.send({ jsonrpc: '2.0', id: 2, method: 'contracts', handshake: { ...handshake, request_id: 'request-2' }, params: {
    descriptor_version: 1, repo_id: service.descriptor.repo_id, generation: service.descriptor.generation, local_user_capability: localUserCapability,
  } });
  await until(() => received.length === 2);
  assert.deepEqual(received[1].result, service.descriptor);
  client.send({ jsonrpc: '2.0', id: 3, method: 'listRuns', handshake: { ...handshake, request_id: 'request-3' }, params: {} });
  await until(() => received.length === 3);
  assert.deepEqual(received[2].result, { protocol: 'relay.client-read-model/v1', view: 'run_list', items: [] });
  client.send({ jsonrpc: '2.0', id: 4, method: 'start', handshake: { ...handshake, request_id: 'request-4' }, params: { run: runDocument() } });
  await until(() => received.length === 4, 8_000);
  assert.equal(received[3].result.receipt.state, 'committed');
  assert.equal(received[3].result.receipt.method, 'start');
  const runId = received[3].result.receipt.run_id;
  client.send({ jsonrpc: '2.0', id: 5, method: 'control', handshake: { ...handshake, request_id: 'request-5' }, params: { run_id: runId, action: 'stop' } });
  await until(() => received.length === 5, 8_000);
  assert.deepEqual(received[4].result.receipt.kind, 'stop');
});

test('Runtime validate 直连接口：H6 四例与坏图返回冻结 valid/reason 形状', async () => {
  const golden = await runFixture('golden/run.v2.json');
  const direct = await runFixture('negative/h6-dsh-only-required-role.json');
  const cases = [
    {
      name: '深度 1',
      document: { ...golden, nodes: h6DepthOneNodes() },
      expected: { valid: false, reason: 'E_DSH_ONLY_REQUIRED_ROLE' },
    },
    {
      name: '深度 >=2',
      document: { ...golden, nodes: [
        { node_id: 'gate', title: '闸', role: '复核', required: false,
          executor_profiles: [{ kind: 'dsh-agent', ref: 'bridge/dsh' }] },
        { node_id: 'mid', title: '中', role: '执行', required: false, depends_on: ['gate'],
          executor_profiles: [{ kind: 'process', ref: 'bin/mid' }] },
        { node_id: 'final', title: '终', role: '执行', required: true, depends_on: ['mid'],
          executor_profiles: [{ kind: 'process', ref: 'bin/final' }] },
      ] },
      expected: { valid: false, reason: 'E_DSH_ONLY_REQUIRED_ROLE' },
    },
    {
      name: '阴性对照',
      document: { ...golden, nodes: [
        { node_id: 'optional-dsh', title: '选', role: '旁路', required: false,
          executor_profiles: [{ kind: 'dsh-agent', ref: 'bridge/dsh' }] },
        { node_id: 'required-process', title: '必', role: '执行', required: true,
          executor_profiles: [{ kind: 'process', ref: 'bin/required' }] },
      ] },
      expected: { valid: true, reason: null },
    },
    {
      name: '直接形态',
      document: direct,
      expected: { valid: false, reason: 'E_DSH_ONLY_REQUIRED_ROLE' },
    },
    {
      name: '缺失依赖目标',
      document: { ...golden, nodes: [
        { node_id: 'final', title: '终', role: '执行', required: true, depends_on: ['missing'],
          executor_profiles: [{ kind: 'process', ref: 'bin/final' }] },
      ] },
      expected: { valid: false, reason: 'E_BAD_VALUE' },
    },
    {
      name: '依赖成环',
      document: { ...golden, nodes: [
        { node_id: 'a', title: '甲', role: '执行', required: true, depends_on: ['b'],
          executor_profiles: [{ kind: 'process', ref: 'bin/a' }] },
        { node_id: 'b', title: '乙', role: '执行', required: false, depends_on: ['a'],
          executor_profiles: [{ kind: 'process', ref: 'bin/b' }] },
      ] },
      expected: { valid: false, reason: 'E_BAD_VALUE' },
    },
    {
      name: '自环',
      document: { ...golden, nodes: [
        { node_id: 'self', title: '自', role: '执行', required: true, depends_on: ['self'],
          executor_profiles: [{ kind: 'process', ref: 'bin/self' }] },
      ] },
      expected: { valid: false, reason: 'E_BAD_VALUE' },
    },
  ];

  for (const item of cases) {
    const outcome = validateRuntimeDocument({ contract_id: 'relay.run/v2', document: item.document });
    assert.deepEqual(outcome, item.expected, item.name);
    assert.deepEqual(Object.keys(outcome).sort(), ['reason', 'valid'], `${item.name} 不得泄漏 at`);
  }
});

test('F-003 证据钉：RPC 冻结信封拒绝含斜杠的 relay.run/v2 contract_id', async (t) => {
  const repoRoot = await makeRepo('dhr31-f003-');
  const endpoint = endpointForRepo(repoRoot, { runtimeRoot: join(repoRoot, 'private-runtime') });
  const capability = 'dhr31-test-capability';
  const service = await startRuntimeService({
    repoRoot, endpoint, localUserCapability: capability, indexPath: join(repoRoot, 'runs.json'),
  });
  t.after(async () => { await service.close(); await rm(repoRoot, { recursive: true, force: true }); });

  const golden = await runFixture('golden/run.v2.json');
  const outcome = await callOnce(t, endpoint, service.descriptor, capability, 'validate', {
    contract_id: 'relay.run/v2', document: { ...golden, nodes: h6DepthOneNodes() },
  }, { requestId: 'req-f003-pin', clientId: 'f003-pin' });
  assert.equal(outcome.error.data.reason, 'E_BAD_VALUE');
  assert.match(outcome.error.data.detail, /contract_id must match pattern/);
});

test('Runtime service start：H6 深度 1 在落 Run 目录前拒绝，golden 仍成功', async (t) => {
  const repoRoot = await makeRepo('dhr31-start-');
  const endpoint = endpointForRepo(repoRoot, { runtimeRoot: join(repoRoot, 'private-runtime') });
  const capability = 'dhr31-test-capability';
  const service = await startRuntimeService({
    repoRoot, endpoint, localUserCapability: capability, indexPath: join(repoRoot, 'runs.json'),
  });
  t.after(async () => { await service.close(); await rm(repoRoot, { recursive: true, force: true }); });

  const golden = await runFixture('golden/run.v2.json');
  const rejected = await callOnce(t, endpoint, service.descriptor, capability, 'start', {
    run: { ...golden, nodes: h6DepthOneNodes() },
  }, { requestId: 'req-start-h6', clientId: 'start-h6' });
  assert.equal(rejected.error.data.reason, 'E_DSH_ONLY_REQUIRED_ROLE');
  const entriesAfterReject = await readdir(join(repoRoot, '.dh-relay'), { withFileTypes: true });
  assert.deepEqual(entriesAfterReject.filter(entry => entry.isDirectory()).map(entry => entry.name), [],
    'H6 拒绝必须发生在 createStore 前，不留下 Run 目录');

  const started = await callOnce(t, endpoint, service.descriptor, capability, 'start', { run: golden },
    { requestId: 'req-start-golden', clientId: 'start-golden' });
  assert.equal(started.result.receipt.state, 'committed');
});

test('endpoint：canonical repo root 折叠同一仓的不同写法，且 endpoint 名只含 hash', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr30-canon-'));
  t.after(async () => { await rm(repoRoot, { recursive: true, force: true }); });
  const base = repoHash(repoRoot);

  // 同一仓的不同写法必须落同一 endpoint——否则 launcher 与 service 会各自 bind 一个端点，
  // 「成功 bind 是唯一服务的 fencing」这条就失效了（design/07 §3）。
  assert.equal(repoHash(`${repoRoot}${sep}`), base, '尾部分隔符不得改变 canonical root');
  assert.equal(repoHash(join(repoRoot, 'sub', '..')), base, '`..` 段必须在 hash 前解析掉');
  if (process.platform === 'win32') {
    assert.equal(repoHash(repoRoot.toUpperCase()), base, 'Windows 必须做不区分大小写的规范化');
    assert.equal(repoHash(repoRoot.split('\\').join('/')), base, 'Windows 正斜杠写法必须折叠到同一 root');
    // UNC 的服务器/共享名是路径身份的一部分，不得被剥掉当本地路径。
    const unc = ['', '', 'server', 'share', 'repo'].join('\\');
    const uncOther = ['', '', 'other', 'share', 'repo'].join('\\');
    assert.ok(canonicalRepoRoot(unc).startsWith(['', '', 'server', 'share'].join('\\')),
      'UNC 必须保留 server/share');
    assert.notEqual(repoHash(unc), repoHash(uncOther), '不同 UNC 服务器必须是不同的仓');
  }

  const other = await mkdtemp(join(tmpdir(), 'dhr30-canon-'));
  t.after(async () => { await rm(other, { recursive: true, force: true }); });
  assert.notEqual(repoHash(other), base, '不同仓必须落不同 endpoint');

  // design/07 §3：endpoint 名只使用 hash，避免路径长度与敏感路径泄露。
  const endpoint = endpointForRepo(repoRoot, { runtimeRoot: join(repoRoot, 'private') });
  const splitPath = (value) => value.split('\\').flatMap(part => part.split('/'));
  const leaf = splitPath(endpoint.address).pop();
  assert.ok(leaf.includes(base), `endpoint 叶子名须含 repo hash：${leaf}`);
  const secret = splitPath(canonicalRepoRoot(repoRoot)).filter(Boolean).pop();
  assert.ok(!leaf.includes(secret), `endpoint 名不得泄露仓路径片段：${leaf}`);
});

test('owner-aware bind：活 owner 在时输家被拒且绝不清理对方端点', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr30-bind-'));
  t.after(async () => { await rm(repoRoot, { recursive: true, force: true }); });
  const endpoint = endpointForRepo(repoRoot, { runtimeRoot: join(repoRoot, 'private') });
  await mkdir(join(repoRoot, 'private'), { recursive: true });

  const winner = await bindOwnedEndpoint(endpoint, {});
  t.after(() => winner.close().catch(() => {}));
  // 双 launcher：第二个候选必须以稳定 reason 失败，不得盲删对方端点后自己上位。
  await assert.rejects(() => bindOwnedEndpoint(endpoint, {}), (error) => {
    assert.equal(error.reason, E_ENDPOINT_IN_USE);
    return true;
  }, '第二个 bind 必须被拒');
  assert.equal(await probeEndpoint(endpoint), 'alive', '输家不得让赢家的端点失效');

  await winner.close();
  if (endpoint.kind === 'unix') {
    assert.equal(existsSync(endpoint.address), false, '自己仍持有时 close 必须清理残留 socket');
  }
});

test('owner-aware bind：残留 socket 可回收，但新 owner 已接手后旧 close 不得 unlink', async (t) => {
  if (process.platform === 'win32') {
    // Windows named pipe 无文件残留（最后一个句柄关闭即消失），design/08 §2 明写「不删 pipe」。
    // 决策本身仍在下一条用例里以纯函数逐档验证。
    return;
  }
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr30-stale-'));
  t.after(async () => { await rm(repoRoot, { recursive: true, force: true }); });
  const endpoint = endpointForRepo(repoRoot, { runtimeRoot: join(repoRoot, 'private') });
  await mkdir(join(repoRoot, 'private'), { recursive: true });

  // ① 明确无 listener 的残留：探测确认 absent 后由同一 bind 流程 unlink 重试一次。
  await writeFile(endpoint.address, '', 'utf8');
  assert.equal(await probeEndpoint(endpoint), 'absent', '无 listener 的残留必须被判为 absent');
  const first = await bindOwnedEndpoint(endpoint, {});
  assert.equal(await probeEndpoint(endpoint), 'alive');

  // ② 新 owner 接手后，旧 handle 的 close continuation 只能关自己的句柄。
  await new Promise((done) => first.server.close(() => done()));
  await unlink(endpoint.address).catch(() => {});
  const second = await bindOwnedEndpoint(endpoint, {});
  t.after(() => second.close().catch(() => {}));
  await first.close();
  assert.equal(await probeEndpoint(endpoint), 'alive', '旧 close 不得 unlink 新 owner 的端点');
});

test('owner-aware 决策：探测结果与 owner token 逐档决定回收与清理（跨平台纯函数）', () => {
  // 真 UDS 残留只在非 Windows 可复现，但「什么时候允许删」是纯决策——它必须在每个平台
  // 都被钉住，否则 Windows 上跑的回归对 design/08 §2 这条一个字都证明不了。
  assert.equal(shouldReclaimEndpoint({ kind: 'unix', probe: 'absent', attempt: 0 }), true);
  assert.equal(shouldReclaimEndpoint({ kind: 'unix', probe: 'alive', attempt: 0 }), false, '活 owner 必须复用而不是删');
  assert.equal(shouldReclaimEndpoint({ kind: 'unix', probe: 'unknown', attempt: 0 }), false, '探测不确定=不许删');
  assert.equal(shouldReclaimEndpoint({ kind: 'unix', probe: 'absent', attempt: 1 }), false, '只重试一次，第二次须重新探测');
  assert.equal(shouldReclaimEndpoint({ kind: 'pipe', probe: 'absent', attempt: 0 }), false, 'Windows 永不删 pipe');

  assert.equal(shouldUnlinkOnClose({ kind: 'unix', owner: 'dev:1', current: 'dev:1' }), true);
  assert.equal(shouldUnlinkOnClose({ kind: 'unix', owner: 'dev:1', current: 'dev:2' }), false, '端点已换 owner：只能关自己的句柄');
  assert.equal(shouldUnlinkOnClose({ kind: 'unix', owner: 'dev:1', current: null }), false, '端点已消失：无可清理，也不得代删');
  assert.equal(shouldUnlinkOnClose({ kind: 'unix', owner: null, current: 'dev:1' }), false, '自己没拿到 owner token 就不许删');
  assert.equal(shouldUnlinkOnClose({ kind: 'pipe', owner: 'x', current: 'x' }), false, 'Windows 永不删 pipe');
});

async function makeRepo(prefix = 'dhr30-') {
  const repoRoot = await mkdtemp(join(tmpdir(), prefix));
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  return repoRoot;
}

const untilAsync = async (check, timeout = 8_000) => {
  const end = Date.now() + timeout;
  for (;;) {
    if (await check()) return true;
    if (Date.now() > end) throw new Error('timeout');
    await new Promise(resolve => setTimeout(resolve, 25));
  }
};

/** service 进程自己建的本机 credential——客户端从同一份用户私有文件取值。 */
async function readCapability(repoRoot) {
  const dir = join(repoRoot, 'private-credentials');
  const { readdir } = await import('node:fs/promises');
  const [name] = (await readdir(dir)).filter(file => file.endsWith('.json'));
  return JSON.parse(await readFile(join(dir, name), 'utf8')).local_user_capability;
}

/** 起一条连接：contracts 回证 → 调一个方法 → 留着连接给 t.after 清。 */
async function callOnce(t, endpoint, descriptor, capability, method, params, { requestId = `req-${Math.random().toString(36).slice(2)}`, clientId = 'cli-proc' } = {}) {
  const responses = new Map();
  const client = await createTransportClient(endpoint, {
    onFrame: frame => { if ('id' in frame) responses.set(frame.id, frame); },
  });
  t.after(() => client.destroy());
  const send = async (id, name, body, rid) => {
    client.send({
      jsonrpc: '2.0', id, method: name,
      handshake: {
        protocol_version: 'relay.rpc/v1', runtime_version: '0.0.0',
        capability_hash: localCapabilityHash(), client_id: clientId, request_id: rid,
      },
      params: body,
    });
    await untilAsync(async () => responses.has(id), 20_000);
    return responses.get(id);
  };
  const identity = await send(1, 'contracts', {
    descriptor_version: descriptor.descriptor_version, repo_id: descriptor.repo_id,
    generation: descriptor.generation, local_user_capability: capability,
  }, 'req-contracts');
  assert.ok(identity.result, `contracts 应通过：${JSON.stringify(identity.error ?? {})}`);
  const outcome = await send(2, method, params, requestId);
  outcome.usedRequestId = requestId;
  client.destroy();
  return outcome;
}

test('actor：ready 只在 lease 与 lease_acquired 都落定后兑现，控制走同一串行队列', async (t) => {
  const repoRoot = await makeRepo('dhr30-actor-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const runId = 'R001-actor-20260827';
  const store = await createStore({ root: join(repoRoot, '.dh-relay', runId), run: runDocument(runId) });
  await store.appendEvent({ kind: 'run_created', at: '2026-08-27T00:00:00Z' });

  const actor = createHostSessionActor({ repoRoot, runId, ttlMs: 2_000, tickMs: 50 });
  const context = await actor.ready;
  assert.ok(context.store, 'ready 必须交出已打开的 Store');
  assert.ok(context.store.events.some(event => event.kind === 'lease_acquired'),
    'ready 兑现时 lease_acquired 必须已经在事件账里——否则「已就绪」是空话');

  // submitControl 是唯一控制入口，且必须串行：两个并发提交不得交错写。
  const order = [];
  const slow = actor.submitControl(async () => { order.push('a-in'); await new Promise(r => setTimeout(r, 40)); order.push('a-out'); return 'a'; });
  const fast = actor.submitControl(async () => { order.push('b-in'); return 'b'; });
  assert.deepEqual(await Promise.all([slow, fast]), ['a', 'b']);
  assert.deepEqual(order, ['a-in', 'a-out', 'b-in'], '控制必须在 actor 队列内严格串行');

  // submitControl 拿到的就是 actor 自己的 Store 句柄——它是该 Run 的唯一写者。
  const receipt = {
    protocol: 'relay.launch-receipt/v2', receipt_id: 'rcpt-actor', request_id: 'req-1', client_id: 'cli-1',
    method: 'control', state: 'committed', reason: null, run_id: runId, node_id: null, attempt_id: null,
    kind: 'stop', issued_at: '2026-08-27T00:00:02Z', issued_by_runtime: 'runtime-1', request_digest: 'c'.repeat(64),
  };
  await actor.submitControl(async (handle) => handle.appendOperation(receipt));
  assert.deepEqual(await actor.store.readOperation('rcpt-actor'), receipt);

  actor.stop();
  assert.equal((await actor.done).outcome, 'graceful', 'done 必须给出三态之一，而不是抛/悬');
  assert.equal(existsSync(join(repoRoot, '.dh-relay', runId, 'host-lease.json')), false, '优雅停机必须释放自己的 lease');
});

test('actor：失租后队列拒绝一切写，done 报 lost_lease；启动失败报 failed', async (t) => {
  const repoRoot = await makeRepo('dhr30-actor-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const runId = 'R002-lost-20260827';
  const runRoot = join(repoRoot, '.dh-relay', runId);
  const store = await createStore({ root: runRoot, run: runDocument(runId) });
  await store.appendEvent({ kind: 'run_created', at: '2026-08-27T00:00:00Z' });

  const actor = createHostSessionActor({ repoRoot, runId, ttlMs: 300, tickMs: 30 });
  await actor.ready;
  // 换手：把 lease 文件改成别人的。旧 actor 的 renew 必然失败，之后它的任何写都必须被拒。
  await writeFile(join(runRoot, 'host-lease.json'), JSON.stringify({
    run_id: runId, holder_pid: process.pid, epoch: 99,
    acquired_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60_000).toISOString(),
    expires_at_epoch_ms: Date.now() + 60_000, hostname: 'other',
  }), 'utf8');
  const outcome = await actor.done;
  assert.equal(outcome.outcome, 'lost_lease', '失租必须是可判定的终态，不是异常');
  await assert.rejects(() => actor.submitControl(async () => 'must not run'), (error) => {
    assert.equal(error.reason, 'E_LEASE_HELD');
    return true;
  }, '失租后队列必须拒绝所有写——迟到的写正是双写者的来源');
  assert.equal(JSON.parse(await readFile(join(runRoot, 'host-lease.json'), 'utf8')).epoch, 99,
    '只释放自己取得的 lease：绝不删别人的');

  // 启动前置闸失败（Run 根不存在）→ failed，而不是把进程挂在 ready 上。
  const doomed = createHostSessionActor({ repoRoot, runId: 'R003-missing-20260827', ttlMs: 300, tickMs: 30 });
  await assert.rejects(() => doomed.ready, /E_RUN_NOT_FOUND|ENOENT/);
  assert.equal((await doomed.done).outcome, 'failed');
});

/** 真实进程回归的共享底座：detached service + 不触真 home 的私有目录 + 显式清场。 */
function processHarness(t) {
  const pids = new Set();
  t.after(async () => {
    for (const pid of pids) { try { process.kill(pid, 'SIGKILL'); } catch { /* 已退出 */ } }
  });
  return {
    async launch(repoRoot, options = {}) {
      const outcome = await ensureRuntimeService({
        repoRoot, timeoutMs: 30_000,
        credentialRoot: join(repoRoot, 'private-credentials'),
        env: {
          ...process.env,
          DH_RELAY_CREDENTIAL_ROOT: join(repoRoot, 'private-credentials'),
          DH_RELAY_INDEX_PATH: join(repoRoot, 'private-runtime', 'runs.json'),
        },
        ...options,
      });
      if (outcome.pid) pids.add(outcome.pid);
      return outcome;
    },
    /** 强杀当前持有端点的 service（不优雅停机——这就是 crash 用例要的形态）。 */
    async kill(endpoint) {
      for (const pid of pids) { try { process.kill(pid, 'SIGKILL'); } catch { /* 已退出 */ } }
      pids.clear();
      await untilAsync(async () => await probeEndpoint(endpoint) !== 'alive', 15_000);
    },
  };
}

test('launcher：双 launcher 并发只产生一个 service，两边回证到同一代次', async (t) => {
  const repoRoot = await makeRepo('dhr30-launch-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const harness = processHarness(t);

  const [left, right] = await Promise.all([harness.launch(repoRoot), harness.launch(repoRoot)]);
  assert.equal(left.descriptor.generation, right.descriptor.generation,
    '两个 launcher 必须看到同一届 service——「成功 bind 是唯一服务的 fencing」的全部含义');
  assert.deepEqual(left.endpoint, endpointForRepo(repoRoot));
  assert.equal(await probeEndpoint(left.endpoint), 'alive');
  // 输掉 bind 的候选必须安静退出，而不是留在那儿重试或报错。
  assert.equal(await probeEndpoint(left.endpoint), 'alive');

  const third = await harness.launch(repoRoot);
  assert.equal(third.launched, false, '有活 service 时必须复用，不得再拉一个');
  assert.equal(third.descriptor.generation, left.descriptor.generation);
});

test('launcher：篡改/陈旧 descriptor 一律 fail-closed，绝不把凭据导向别的端点', async (t) => {
  const repoRoot = await makeRepo('dhr30-desc-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const harness = processHarness(t);
  const first = await harness.launch(repoRoot);

  const descriptorFile = join(repoRoot, '.dh-relay', 'runtime.json');
  const good = JSON.parse(await readFile(descriptorFile, 'utf8'));

  // ① 端点被改指到别处：活 service 还在我们推导的端点上，但 descriptor 说的不是它 → 拒绝。
  await writeFile(descriptorFile, JSON.stringify({ ...good, endpoint: { kind: good.endpoint.kind, address: `${good.endpoint.address}-evil` } }), 'utf8');
  await assert.rejects(() => harness.launch(repoRoot, { timeoutMs: 3_000 }),
    (error) => { assert.equal(error.reason, 'E_SERVICE_IDENTITY_MISMATCH'); return true; },
    'descriptor 指向别的端点时必须 fail-closed');

  // ② 代次/能力指纹/状态不符：同样只认逐字相等。
  for (const tampered of [
    { ...good, capability_hash: 'f'.repeat(64) },
    { ...good, state: 'starting' },
    { ...good, generation: '' },
    { ...good, repo_id: `sha256:${'0'.repeat(64)}` },
  ]) {
    await writeFile(descriptorFile, JSON.stringify(tampered), 'utf8');
    await assert.rejects(() => harness.launch(repoRoot, { timeoutMs: 3_000 }),
      (error) => { assert.equal(error.reason, 'E_SERVICE_IDENTITY_MISMATCH'); return true; },
      `被篡改的 descriptor 必须 fail-closed：${JSON.stringify(tampered).slice(0, 80)}`);
  }

  // ③ 损坏的 descriptor：读取本身就 fail-closed，不当成「没有 service」直接再拉一个。
  await writeFile(descriptorFile, '{ not json', 'utf8');
  await assert.rejects(() => harness.launch(repoRoot, { timeoutMs: 3_000 }), /E_STORE_CORRUPT/);

  // 复原后仍是同一届 service：以上全过程既没杀进程也没换端点。
  await writeFile(descriptorFile, JSON.stringify(good), 'utf8');
  const again = await harness.launch(repoRoot);
  assert.equal(again.descriptor.generation, first.descriptor.generation, '回证失败绝不导致误杀活 service');
});

test('launcher：service 被强杀后重启，既有 Run 被重新发现且陈旧 descriptor 不是所有权', async (t) => {
  const repoRoot = await makeRepo('dhr30-crash-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const harness = processHarness(t);
  const first = await harness.launch(repoRoot);
  const capability = await readCapability(repoRoot);

  const started = await callOnce(t, first.endpoint, first.descriptor, capability, 'start', { run: runDocument() });
  const runId = started.result.receipt.run_id;

  await harness.kill(first.endpoint);
  // 陈旧 descriptor 仍在盘上——它是可检测的发现信息，不是所有权（design/07 §3）。
  assert.ok(existsSync(join(repoRoot, '.dh-relay', 'runtime.json')), 'service 退出不得删 descriptor');

  const second = await harness.launch(repoRoot);
  assert.notEqual(second.descriptor.generation, first.descriptor.generation, '新一届必须是新代次');
  const listed = await callOnce(t, second.endpoint, second.descriptor, capability, 'listRuns', { include_legacy: false });
  assert.deepEqual(listed.result.items.map(item => item.run_id), [runId], '重启后必须重新发现既有 Run');

  // 崩溃后同键重试：不得发第二个号，也不得产生第二份 Receipt。
  const retried = await callOnce(t, second.endpoint, second.descriptor, capability, 'start',
    { run: runDocument() }, { requestId: started.usedRequestId });
  assert.deepEqual(retried.result.receipt, started.result.receipt, '跨进程崩溃的同键重试必须给出同一 Receipt');
});
