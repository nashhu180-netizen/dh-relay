// dsh-bridge.test.mjs — Bridge 只经真实 Runtime service、真实 Store 与 RPC socket 验证。

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';

import { connectDshBridge } from '../adapters/dsh-bridge/index.mjs';
import { localCapabilityHash } from '../rpc/capabilities.mjs';
import { createTransportClient, createTransportServer } from '../rpc/transport.mjs';
import { endpointForRepo, repoHash } from '../runtime/endpoint.mjs';
import { startRuntimeService } from '../runtime/service.mjs';
import { createStore } from '../store/store.mjs';

const execFileAsync = promisify(execFile);
const until = async (check, timeout = 8_000) => {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() > deadline) throw new Error('timeout');
    await new Promise(resolve => setTimeout(resolve, 20));
  }
};

const runDocument = (runId) => ({
  protocol: 'relay.run/v2', run_id: runId, workflow_name: 'bridge', summary: 'bridge',
  trigger: 'system', created_at: '2026-08-27T00:00:00Z',
  nodes: [{ node_id: 'node-a', title: 'node', role: 'work', required: false, executor_profiles: [{ kind: 'process', ref: 'bin/probe' }] }],
});

async function setup(t) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr30-bridge-'));
  const credentialRoot = join(repoRoot, 'private-credentials');
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  const runId = 'R001-bridge-20260827';
  const store = await createStore({ root: join(repoRoot, '.dh-relay', runId), run: runDocument(runId) });
  await store.appendEvent({ kind: 'run_created', at: '2026-08-27T00:00:00Z' });
  await store.appendEvent({ kind: 'node_started', node_id: 'node-a', at: '2026-08-27T00:00:01Z' });
  const service = await startRuntimeService({
    repoRoot, endpoint: endpointForRepo(repoRoot), credentialRoot,
    indexPath: join(repoRoot, 'private-runtime', 'runs.json'),
  });
  const sockets = [];
  service.handle.server.on('connection', socket => sockets.push(socket));
  t.after(async () => { await service.close().catch(() => {}); });
  t.after(async () => { await rm(repoRoot, { recursive: true, force: true }); });
  return { repoRoot, credentialRoot, runId, service, sockets, store };
}

async function startLiveRun(t, service) {
  const replies = new Map();
  const client = await createTransportClient(service.descriptor.endpoint, {
    onFrame: frame => replies.set(frame.id, frame),
  });
  t.after(() => client.destroy());
  let id = 0;
  const call = async (method, params) => {
    const requestId = ++id;
    client.send({
      jsonrpc: '2.0', id: requestId, method,
      handshake: {
        protocol_version: 'relay.rpc/v1', runtime_version: '0.0.0', capability_hash: localCapabilityHash(),
        client_id: 'dsh-bridge-stream-test', request_id: `stream-${requestId}`,
      },
      params,
    });
    return until(() => replies.get(requestId));
  };
  const contracts = await call('contracts', {
    descriptor_version: service.descriptor.descriptor_version,
    repo_id: service.descriptor.repo_id,
    generation: service.descriptor.generation,
    local_user_capability: service.localUserCapability,
  });
  assert.deepEqual(contracts.result, service.descriptor);
  const started = await call('start', { run: runDocument('bridge-stream') });
  return started.result.receipt.run_id;
}

test('dsh bridge：查询原样返回 Read Model，控制拒绝原样透传且不写 pending', async (t) => {
  const { repoRoot, credentialRoot, runId } = await setup(t);
  const bridge = await connectDshBridge({ repoRoot, credentialRoot });
  t.after(() => bridge.close());

  const list = await bridge.listRuns();
  assert.equal(list.view, 'run_list');
  assert.deepEqual(list.items[0], {
    run_id: runId, source: 'runtime-v2', read_only: true,
    run_status: 'running', group: 'running', updated_at: '2026-08-27T00:00:01Z',
  });
  const status = await bridge.status(runId);
  const detail = await bridge.inspect(runId);
  assert.equal(status.view, 'status');
  assert.equal(detail.view, 'detail');
  await assert.rejects(() => bridge.control(runId, 'stop', { requestId: 'dsh-control-1' }), (error) => {
    assert.equal(error.data.reason, 'E_ORPHAN_STORE_READ_ONLY');
    assert.equal(error.data.receipt, null);
    return true;
  });
});

test('dsh bridge：E_CURSOR_GAP 整体回快照，状态仅来自快照', async (t) => {
  const { repoRoot, credentialRoot, runId } = await setup(t);
  const bridge = await connectDshBridge({ repoRoot, credentialRoot, reconnectDelayMs: 5 });
  t.after(() => bridge.close());
  const snapshots = [];
  const states = [];
  const gaps = [];
  const events = [];
  const subscription = await bridge.subscribe(runId, {
    afterSeq: 999,
    onSnapshot: snapshot => snapshots.push(snapshot),
    onState: state => states.push(state),
    onGap: gap => gaps.push(gap),
    onEvent: event => events.push(event),
  });
  t.after(() => subscription.stop());

  await until(() => snapshots.length === 1 && gaps.length === 1);
  assert.equal(gaps[0].reason, 'E_CURSOR_GAP');
  assert.equal(snapshots[0].view, 'event_stream_snapshot');
  assert.equal(states.length, 1, '初始状态只由新的订阅快照给出');
  assert.equal(states[0].run_id, runId);
  assert.deepEqual(events, [], '重建快照前不拼接 gap 两侧事件');
});

test('dsh bridge：真实 socket 断线中途按已送达高水位续传，事件不重不漏', async (t) => {
  const { repoRoot, credentialRoot, service, sockets } = await setup(t);
  const runId = await startLiveRun(t, service);
  const bridge = await connectDshBridge({ repoRoot, credentialRoot, reconnectDelayMs: 5 });
  t.after(() => bridge.close());
  const snapshots = [];
  const events = [];
  const subscription = await bridge.subscribe(runId, {
    onSnapshot: snapshot => snapshots.push(snapshot),
    onEvent: event => events.push(event),
  });
  t.after(() => subscription.stop());

  await bridge.control(runId, 'stop', { requestId: 'dsh-stream-stop-1' });
  await until(() => events.length > 0);
  const subscriptionSocket = sockets.filter(socket => !socket.destroyed).at(-1);
  assert.ok(subscriptionSocket, '订阅必须经真实 service socket 建立');
  subscriptionSocket.destroy();

  await bridge.control(runId, 'resume', { requestId: 'dsh-stream-resume' });
  await bridge.control(runId, 'stop', { requestId: 'dsh-stream-stop-2' });
  await until(() => snapshots.length === 2);
  const expected = (await import('node:fs/promises').then(fs => fs.readFile(
    join(repoRoot, '.dh-relay', runId, 'events.jsonl'), 'utf8',
  ))).trim().split('\n').map(JSON.parse).filter(event => event.seq > snapshots[0].snapshot_seq);
  await until(() => events.length === expected.length);
  assert.ok(expected.length > 0, '真实 Runtime actor 必须产生待续传事件');
  assert.deepEqual(events.map(event => event.seq), expected.map(event => event.seq),
    '断线两侧按已送达 after_seq 与真实事件账严格连续续传');
});

test('dsh bridge：真实 service 停止后重试耗尽通知宿主且订阅只终止一次', async (t) => {
  const { repoRoot, credentialRoot, runId, service } = await setup(t);
  const bridge = await connectDshBridge({ repoRoot, credentialRoot, reconnectDelayMs: 5, reconnectAttempts: 2 });
  t.after(() => bridge.close());
  const closed = [];
  const subscription = await bridge.subscribe(runId, { onClosed: reason => closed.push(reason) });

  // 先让下一次 ensure 立即拒绝错误 descriptor，再关闭真实 service；不让 launcher 的 15s 拉起等待掩盖重试边界。
  await writeFile(join(repoRoot, '.dh-relay', 'runtime.json'), `${JSON.stringify({
    ...service.descriptor,
    endpoint: { ...service.descriptor.endpoint, address: 'not-the-derived-endpoint' },
  })}\n`, 'utf8');
  await service.close();
  await until(() => closed.length === 1, 5_000);
  assert.equal(closed[0], 'retries-exhausted');
  subscription.stop();
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(closed.length, 1, '终止订阅已从活动集合摘除，stop 不得重复通知');
});

test('dsh bridge：真实 socket close 立即拒绝在途请求，不等待 120s 超时', async (t) => {
  const { repoRoot, credentialRoot, sockets } = await setup(t);
  const bridge = await connectDshBridge({ repoRoot, credentialRoot });
  t.after(() => bridge.close());
  const sessionSocket = sockets.filter(socket => !socket.destroyed).at(-1);
  assert.ok(sessionSocket, '查询会话必须经真实 service socket 建立');
  sessionSocket.pause();

  const pending = bridge.listRuns().then(
    () => ({ kind: 'resolved' }),
    error => ({ kind: 'rejected', error }),
  );
  sessionSocket.destroy();
  const outcome = await Promise.race([
    pending,
    new Promise(resolve => setTimeout(() => resolve({ kind: 'deadline' }), 5_000)),
  ]);
  assert.equal(outcome.kind, 'rejected', '注释掉 close reject 逻辑后必须在 5s 内报红');
  assert.equal(outcome.error.reason, 'E_CONNECTION_CLOSED');
});

test('dsh bridge：reconnectAttempts=0 零预算断线也走 onClosed，绝不静默死（R-H-01）', async (t) => {
  const { repoRoot, credentialRoot, runId, sockets } = await setup(t);
  const bridge = await connectDshBridge({ repoRoot, credentialRoot, reconnectDelayMs: 5, reconnectAttempts: 0 });
  t.after(() => bridge.close());
  const closed = [];
  const snapshots = [];
  const subscription = await bridge.subscribe(runId, {
    onSnapshot: snapshot => snapshots.push(snapshot),
    onClosed: reason => closed.push(reason),
  });
  await until(() => snapshots.length === 1);

  const subscriptionSocket = sockets.filter(socket => !socket.destroyed).at(-1);
  assert.ok(subscriptionSocket, '订阅必须经真实 service socket 建立');
  subscriptionSocket.destroy();

  await until(() => closed.length === 1, 5_000);
  assert.equal(closed[0], 'retries-exhausted', '零预算重连必须走同一终态通知，不得因循环体未进入而静默');
  subscription.stop();
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(closed.length, 1, '已终止的订阅不得二次通知');
});

test('dsh bridge：重连途中 E_CURSOR_GAP 不消耗重试预算，仍按合同整体重快照（R-H-02）', async (t) => {
  // 真实 append-only Store 造不出「重连时 cursor 越界」，用假 service 精确扣住第二次 subscribe 回 gap。
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr30-bridge-gap-'));
  t.after(async () => { await rm(repoRoot, { recursive: true, force: true }); });
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  const credentialRoot = join(repoRoot, 'private-credentials');
  await mkdir(credentialRoot, { recursive: true });
  await writeFile(join(credentialRoot, `${repoHash(repoRoot)}.json`),
    `${JSON.stringify({ version: 1, local_user_capability: 'bridge-gap-capability' })}\n`, 'utf8');
  const endpoint = endpointForRepo(repoRoot);
  if (process.platform !== 'win32') {
    await mkdir(join(homedir(), '.dh-relay', 'runtime'), { recursive: true });
  }
  const descriptor = {
    descriptor_version: 1, repo_id: `sha256:${repoHash(repoRoot)}`, endpoint,
    generation: randomUUID(), runtime_version: '0.0.0',
    capability_hash: localCapabilityHash(), state: 'ready',
  };
  await mkdir(join(repoRoot, '.dh-relay'), { recursive: true });
  await writeFile(join(repoRoot, '.dh-relay', 'runtime.json'), `${JSON.stringify(descriptor, null, 2)}\n`, 'utf8');

  let subscribeCount = 0;
  const subscribeAfterSeqs = [];
  const snapshotFor = (seq) => ({
    view: 'event_stream_snapshot', run_id: 'R001-gap-20260828',
    snapshot: { run_id: 'R001-gap-20260828' }, snapshot_seq: seq, next_seq: seq + 1,
  });
  const server = await createTransportServer(endpoint, {
    onFrame: (frame, conn) => {
      if (!frame || typeof frame !== 'object') return;
      if (frame.method === 'contracts') {
        conn.send({ jsonrpc: '2.0', id: frame.id, result: descriptor });
        return;
      }
      if (frame.method === 'subscribe') {
        subscribeCount += 1;
        subscribeAfterSeqs.push(frame.params?.after_seq ?? null);
        if (subscribeCount === 1) {
          // 首订阅成功建立基线，随后掐断连接逼出 reconnect。
          conn.send({ jsonrpc: '2.0', id: frame.id, result: snapshotFor(3) });
          setTimeout(() => conn.destroy(), 50);
        } else if (subscribeCount === 2) {
          // 重连第一击：按旧 cursor 回 gap——按合同它是恢复义务，不许吃掉唯一一次预算。
          conn.send({ jsonrpc: '2.0', id: frame.id, error: { code: -32000, message: 'gap', data: { reason: 'E_CURSOR_GAP' } } });
        } else {
          conn.send({ jsonrpc: '2.0', id: frame.id, result: snapshotFor(7) });
        }
      }
    },
  });
  t.after(() => server.close().catch(() => {}));

  const bridge = await connectDshBridge({ repoRoot, credentialRoot, reconnectDelayMs: 5, reconnectAttempts: 1 });
  t.after(() => bridge.close());
  const snapshots = [];
  const gaps = [];
  const closed = [];
  const subscription = await bridge.subscribe('R001-gap-20260828', {
    onSnapshot: snapshot => snapshots.push(snapshot),
    onGap: gap => gaps.push(gap),
    onClosed: reason => closed.push(reason),
  });
  t.after(() => subscription.stop());

  await until(() => snapshots.length === 2, 8_000);
  assert.equal(gaps.length, 1, '重连途中的 gap 恰回调一次 onGap');
  assert.equal(gaps[0].reason, 'E_CURSOR_GAP');
  assert.deepEqual(closed, [], 'attempts=1 时 gap 不得触发 retries-exhausted——gap 不占预算');
  assert.equal(snapshots[1].snapshot_seq, 7, 'gap 后必须拿到整体重建的新快照');
  assert.deepEqual(subscribeAfterSeqs, [null, 3, null],
    '三次 subscribe 的 cursor：首订阅 null → 重连带旧高水位 → gap 清空后 null 重快照');
});
