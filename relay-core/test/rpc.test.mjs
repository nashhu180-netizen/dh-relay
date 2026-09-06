// rpc.test.mjs — DHR_52 施工步骤 2/3/4：capability 帮助器 + NDJSON 传输 + RPC 服务端握手路径
// 证：① 本地指纹与权威快照 `capability-baseline.json` 逐字相等（基线平等）；
//     ② 形态合法但不同的 peer hash 被严格拒绝为 `E_CAPABILITY_MISMATCH`；
//     ③ 传输确定性分帧/坏帧映射/真实 socket 往返/关闭清理/连接级 handler seam；
//     ④ 服务端最小握手：合法 request 只调 handlers[method]、指纹不符拒绝、未实现方法拒绝、
//        信封/坏帧以既有 reason 拒绝、断连零 Store/零 handler 副作用、并发连接各回各的连接。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { E_CAPABILITY_MISMATCH, localCapability, localCapabilityHash, localCapabilityHashV2, verifyPeerCapability } from '../rpc/capabilities.mjs';
import { createRpcServer, E_UNKNOWN_METHOD } from '../rpc/server.mjs';
import {
  E_TRANSPORT_FRAME_INVALID,
  localEndpoint,
  createFramer,
  createTransportServer,
  createTransportClient,
} from '../rpc/transport.mjs';
import { loadAjv, validateOne } from '../tools/validate.mjs';
import { createStore } from '../store/store.mjs';

const BASELINE = fileURLToPath(new URL('../capability-baseline.json', import.meta.url));

const STORE_RUN = {
  protocol: 'relay.run/v2', run_id: 'RUN-DHR52-RPC', workflow_name: 'rpc-test', summary: 'RPC Store evidence',
  trigger: 'system', trigger_by: null, created_at: '2026-08-23T00:00:00Z', labels: [],
  nodes: [{ node_id: 'node-a', title: 'A', required: true, executor_profiles: [{ kind: 'process', ref: 'worker.mjs' }] }],
};

// 形态合法但值不同：sha256 小写十六进制，64 字符。
const DIFFERENT_SHA256 = '0'.repeat(63) + 'f';
const LEGACY_FIXED_V1_HASH = '994d5f038cd1bcbbb9463eed5ca04b2ffc324f07b374571899b8df3a6c5c971e';

test('基线平等：localCapability() 复算指纹与权威快照 capability_hash 逐字相等', () => {
  const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
  const local = localCapability();

  // 复算（经 tools/canonical.mjs 的 digest）必须等于快照里记录的权威 hash —— 快照未失配。
  assert.equal(local.capability_hash, baseline.capability_hash);
  // 快照自身自洽：manifest 就是基线里的那份。
  assert.deepEqual(local.capability_manifest, baseline.capability_manifest);
  // 且快照记录的 hash 确实是快照 manifest 的指纹（不经帮助器，独立复核 canonical 口径）。
  assert.equal(localCapabilityHashV2(), baseline.capability_hash);
  assert.equal(localCapabilityHash(), baseline.capability_hash,
    'v1 and bootstrap/v2 must advertise the same full event-inclusive baseline');
  assert.equal(localCapabilityHash(), localCapabilityHashV2());
});

test('DHR_77 capability: legacy fixed v1 hash is rejected before dispatch', () => {
  assert.notEqual(LEGACY_FIXED_V1_HASH, localCapabilityHash());
  const r = verifyPeerCapability(LEGACY_FIXED_V1_HASH);
  assert.equal(r.ok, false);
  assert.equal(r.code, E_CAPABILITY_MISMATCH);
});

test('基线平等：本地指纹是 64 位小写十六进制 sha256（形态合法）', () => {
  const hash = localCapabilityHash();
  assert.match(hash, /^[0-9a-f]{64}$/);
});

test('握手通过：与本地指纹相同的 peer hash → ok:true', () => {
  const r = verifyPeerCapability(localCapabilityHash());
  assert.equal(r.ok, true);
  assert.equal(r.code, null);
});

test('拒绝不匹配：不同但格式合法的 peer hash → E_CAPABILITY_MISMATCH', () => {
  // DIFFERENT_SHA256 是合法 sha256 形态，只是值不同 —— 必须拒绝，不得按交集降级。
  assert.notEqual(DIFFERENT_SHA256, localCapabilityHash());
  const r = verifyPeerCapability(DIFFERENT_SHA256);
  assert.equal(r.ok, false);
  assert.equal(r.code, E_CAPABILITY_MISMATCH);
  assert.match(r.reason, /capability 指纹不符/);
});

test('拒绝不匹配：非字符串 peer hash 同样无法匹配 → E_CAPABILITY_MISMATCH', () => {
  const r = verifyPeerCapability(undefined);
  assert.equal(r.ok, false);
  assert.equal(r.code, E_CAPABILITY_MISMATCH);
});

// ————— DHR_52 施工步骤 3：可移植本地 NDJSON 传输 —————
// 证四点：① 确定性分帧/组帧（任意切分等价整块）；② 坏帧映射 E_TRANSPORT_FRAME_INVALID；
//         ③ 真实 OS 传输双向 NDJSON 往返 + partial 写入；④ 关闭清理，客户端关闭只作传输清理。

/** 轮询等待条件成立（真实 socket 事件异步到达）。 */
async function until(cond, ms = 3000) {
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > ms) throw new Error('until 超时');
    await new Promise((r) => setTimeout(r, 5));
  }
}

test('分帧：单帧整块喂入 → 一个对象', () => {
  const frames = [];
  const errs = [];
  const f = createFramer({ onFrame: (o) => frames.push(o), onFrameError: (e) => errs.push(e) });
  f.push(Buffer.from('{"a":1,"b":"xy"}\n'));
  assert.equal(errs.length, 0);
  assert.deepEqual(frames, [{ a: 1, b: 'xy' }]);
});

test('分帧：逐字节喂入（含打断多字节 UTF-8 边界）与整块结果逐字一致', () => {
  const line = JSON.stringify({ jsonrpc: '2.0', method: 'partial', params: { data: '你好 world' }, id: 7 });
  const full = Buffer.from(line + '\n');

  const ref = [];
  createFramer({ onFrame: (o) => ref.push(o) }).push(full);

  const got = [];
  const f = createFramer({ onFrame: (o) => got.push(o) });
  for (const b of full) f.push(Buffer.from([b]));
  assert.deepEqual(got, ref);
});

test('分帧：一次 push 两行帧 → 两个独立对象', () => {
  const got = [];
  const f = createFramer({ onFrame: (o) => got.push(o) });
  f.push(Buffer.from('{"x":1}\n{"y":2}\n'));
  assert.deepEqual(got, [{ x: 1 }, { y: 2 }]);
});

test('坏帧：不可解析 JSON → E_TRANSPORT_FRAME_INVALID', () => {
  const errs = [];
  const f = createFramer({ onFrame: () => { throw new Error('不应收到帧'); }, onFrameError: (e) => errs.push(e) });
  f.push(Buffer.from('{not json}\n'));
  assert.equal(errs.length, 1);
  assert.equal(errs[0].code, E_TRANSPORT_FRAME_INVALID);
});

test('坏帧：非法 UTF-8 → E_TRANSPORT_FRAME_INVALID，不替换为 U+FFFD 后继续解析', () => {
  const errs = [];
  const frames = [];
  createFramer({ onFrame: (o) => frames.push(o), onFrameError: (e) => errs.push(e) })
    .push(Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xff, 0x22, 0x7d, 0x0a]));
  assert.deepEqual(frames, []);
  assert.equal(errs[0]?.code, E_TRANSPORT_FRAME_INVALID);
});

test('坏帧：非对象帧（数字/字符串/数组/null）→ E_TRANSPORT_FRAME_INVALID', () => {
  for (const bad of ['42', '"str"', '[1,2]', 'null']) {
    const errs = [];
    const f = createFramer({ onFrame: () => {}, onFrameError: (e) => errs.push(e) });
    f.push(Buffer.from(bad + '\n'));
    assert.equal(errs.length, 1, `应拒绝 ${bad}`);
    assert.equal(errs[0].code, E_TRANSPORT_FRAME_INVALID);
  }
});

test('坏帧：超长帧（超过 maxFrameBytes）→ E_TRANSPORT_FRAME_INVALID（有界防无界累积）', () => {
  const errs = [];
  const f = createFramer({ maxFrameBytes: 8, onFrame: () => {}, onFrameError: (e) => errs.push(e) });
  f.push(Buffer.from('{"big":"value exceeds limit"}\n'));
  assert.equal(errs.length, 1);
  assert.equal(errs[0].code, E_TRANSPORT_FRAME_INVALID);
});

test('坏帧：不完整超长帧必须丢弃到换行，尾部不得按新帧执行', () => {
  const errs = [];
  const frames = [];
  const f = createFramer({ maxFrameBytes: 16, onFrame: (o) => frames.push(o), onFrameError: (e) => errs.push(e) });
  f.push(Buffer.alloc(17, 0x78));
  f.push(Buffer.from('{"ok":1}\n'));
  assert.equal(errs.length, 1);
  assert.deepEqual(frames, [], '超长帧的尾部不能因 chunk 边界被解释为独立请求');
});

test('传输：真实本地 socket 双向 NDJSON 往返', async () => {
  const endpoint = localEndpoint();
  const serverFrames = [];
  const clientFrames = [];
  let serverConn = null;
  let client;

  const server = await createTransportServer(endpoint, {
    onConnection: (conn) => { serverConn = conn; },
    onFrame: (o) => serverFrames.push(o),
  });
  try {
    client = await createTransportClient(endpoint, { onFrame: (o) => clientFrames.push(o) });
    await until(() => serverConn !== null);

    client.send({ jsonrpc: '2.0', method: 'ping', id: 1 });
    await until(() => serverFrames.length === 1);
    assert.deepEqual(serverFrames[0], { jsonrpc: '2.0', method: 'ping', id: 1 });

    serverConn.send({ jsonrpc: '2.0', result: 'pong', id: 1 });
    await until(() => clientFrames.length === 1);
    assert.deepEqual(clientFrames[0], { jsonrpc: '2.0', result: 'pong', id: 1 });
  } finally {
    client?.destroy();
    await server.close();
  }
});

test('传输：partial 写入（一帧切成三段，含打断多字节 UTF-8）仍确定性组帧', async () => {
  const endpoint = localEndpoint();
  const serverFrames = [];
  let serverConn = null;
  const server = await createTransportServer(endpoint, {
    onConnection: (conn) => { serverConn = conn; },
    onFrame: (o) => serverFrames.push(o),
  });
  let client;
  try {
    client = await createTransportClient(endpoint, {});
    // 等服务端 accept 完成再写：connect 同一 tick 内写入（服务端尚未 accept）
    // 在 Windows named pipe 上会被丢弃，先建连再写才是确定性顺序。
    await until(() => serverConn !== null);
    const payload = { jsonrpc: '2.0', method: 'partial', params: { data: '你好 world' }, id: 7 };
    const bytes = Buffer.from(JSON.stringify(payload) + '\n');
    const cut1 = Math.floor(bytes.length / 3);
    const cut2 = Math.floor((bytes.length * 2) / 3);
    client.socket.write(bytes.subarray(0, cut1));
    await new Promise((r) => setTimeout(r, 5));
    client.socket.write(bytes.subarray(cut1, cut2));
    await new Promise((r) => setTimeout(r, 5));
    client.socket.write(bytes.subarray(cut2));

    await until(() => serverFrames.length === 1);
    assert.deepEqual(serverFrames[0], payload);
  } finally {
    client?.destroy();
    await server.close();
  }
});

test('传输：真实 socket 上坏 JSON → 服务端报 E_TRANSPORT_FRAME_INVALID', async () => {
  const endpoint = localEndpoint();
  const errs = [];
  let serverConn = null;
  const server = await createTransportServer(endpoint, {
    onConnection: (conn) => { serverConn = conn; },
    onFrameError: (e) => errs.push(e),
  });
  let client;
  try {
    client = await createTransportClient(endpoint, {});
    // 与服务端 accept 同步：accept 前写入会在 Windows named pipe 上被丢弃。
    await until(() => serverConn !== null);
    client.socket.write('{"bad": }\n');
    await until(() => errs.length === 1);
    assert.equal(errs[0].code, E_TRANSPORT_FRAME_INVALID);
  } finally {
    client?.destroy();
    await server.close();
  }
});

test('传输：客户端关闭仅触发传输清理（onClose），不产生任何业务副作用', async () => {
  const endpoint = localEndpoint();
  let serverConn = null;
  let closeCount = 0;
  const server = await createTransportServer(endpoint, {
    onConnection: (conn) => { serverConn = conn; },
    onClose: () => { closeCount += 1; },
  });
  let client;
  try {
    client = await createTransportClient(endpoint, {});
    await until(() => serverConn !== null);
    client.destroy();
    await until(() => closeCount === 1);
    assert.equal(closeCount, 1, '客户端关闭只触发一次传输清理信号');
    // 无 Store/cancel 副作用：transport 层不暴露任何写入路径，仅 onClose 信号。
  } finally {
    client?.destroy();
    await server.close();
  }
});

test('传输：关闭服务端清理端点（非 Windows 移除 UDS socket）', async () => {
  const endpoint = localEndpoint();
  const server = await createTransportServer(endpoint, {});
  try {
    if (endpoint.kind === 'unix') {
      assert.equal(existsSync(endpoint.address), true, '监听后 UDS socket 文件存在');
    }
  } finally {
    await server.close();
    if (endpoint.kind === 'unix') {
      assert.equal(existsSync(endpoint.address), false, '关闭后 UDS socket 已移除');
    }
    // Windows：named pipe 随最后句柄关闭自动消失，无文件可断言。
  }
});

test('传输 seam：createConnectionHandlers 每连接生成 handlers——帧与关闭都回落具体连接', async () => {
  const endpoint = localEndpoint();
  const perConnFrames = [];
  let closeCount = 0;
  let serverConn = null;
  const server = await createTransportServer(endpoint, {
    onConnection: (conn) => { serverConn = conn; },
    createConnectionHandlers() {
      return {
        onFrame: (o) => perConnFrames.push(o),
        onClose: () => { closeCount += 1; },
      };
    },
  });
  let client;
  try {
    client = await createTransportClient(endpoint, {});
    await until(() => serverConn !== null);
    client.send({ jsonrpc: '2.0', method: 'ping', id: 1 });
    await until(() => perConnFrames.length === 1);
    assert.deepEqual(perConnFrames[0], { jsonrpc: '2.0', method: 'ping', id: 1 },
      '帧经连接级 onFrame 到达，不依赖移除传输层 data 监听');
    client.destroy();
    await until(() => closeCount === 1);
    assert.equal(closeCount, 1, '关闭经连接级 onClose 回落');
  } finally {
    client?.destroy();
    await server.close();
  }
});

test('传输：客户端仍连着时服务端 close 确定性完成（不挂起）', async () => {
  const endpoint = localEndpoint();
  let serverConn = null;
  let clientClosed = false;
  const server = await createTransportServer(endpoint, {
    onConnection: (conn) => { serverConn = conn; },
    onClose: () => { clientClosed = true; },
  });
  // 客户端保持连接，不提前 destroy —— 直接调 server.close()。
  const client = await createTransportClient(endpoint, {});
  await until(() => serverConn !== null);

  // 修复前：server.close() 等所有服务端 socket 关闭，客户端还连着 → 永久挂起。
  // 修复后：close() 先销毁本 server 接受的在线 socket，server.close() 确定性回调。
  await server.close();

  // 服务端 close 已返回：它销毁了自己的服务端 socket，客户端对端随之关闭。
  await until(() => clientClosed, 3000);
  assert.equal(clientClosed, true, '服务端 close 后客户端对端被关闭');
  client.destroy();
});

// ————— DHR_52 施工步骤 4：RPC 服务端最小握手路径 —————
// 证七点：① 合法 request 只调 handlers[method] 并回其 result，响应帧过冻结信封；
//         ② 形态合法但不同的 capability hash → E_CAPABILITY_MISMATCH（不降级、不调 handler）；
//         ③ 未实现方法（subscribe）→ E_UNKNOWN_METHOD；
//         ④ 不合冻结信封（缺 handshake）→ 既有 reason（E_MISSING_FIELD）；
//         ⑤ 坏 JSON 帧 → E_TRANSPORT_FRAME_INVALID（id null）；
//         ⑥ 客户端断开只清连接本地状态：Store 零调用、handler 零调用，服务端继续服务新连接；
//         ⑦ 并发连接：请求/回复/坏帧/断连都只回落各自连接（连接级 handler seam，真实传输）。

/** 构造合法 request 帧；capability_hash 默认取真实本地指纹（过握手的最小形态）。 */
function makeRequest(method, overrides = {}) {
  return {
    jsonrpc: '2.0',
    id: 1,
    method,
    handshake: {
      protocol_version: 'relay.rpc/v1',
      runtime_version: '0.0.0',
      capability_hash: localCapabilityHash(),
      client_id: 'cli-1',
      request_id: 'req-1',
    },
    params: {},
    ...overrides,
  };
}

/** Store 间谍：任何方法被调即计数并抛错——服务端碰 Store 当场红。 */
function makeStoreSpy() {
  const state = { calls: 0 };
  const store = new Proxy({}, {
    get: () => (...args) => { state.calls += 1; throw new Error('RPC 服务端不得触碰 Store：' + args[0]); },
  });
  return { store, state };
}

/** 起一个服务端：endpoint 随机、Store 为抛错间谍、runId 固定。 */
async function withRpcServer(handlers) {
  const endpoint = localEndpoint();
  const spy = makeStoreSpy();
  const handle = await createRpcServer({ runId: 'RUN-1', store: spy.store, endpoint, handlers });
  return { endpoint, handle, storeState: spy.state };
}

test('server：合法 request 只调 handlers[method] 并回其 result，响应帧过冻结信封', async () => {
  const called = [];
  const { endpoint, handle } = await withRpcServer({
    contracts: (params) => { called.push('contracts'); return { valid: true, reason: null }; },
    inspectRun: () => { called.push('inspectRun'); return { nope: true }; },
    listRuns: () => { called.push('listRuns'); return []; },
    validate: () => { called.push('validate'); return { valid: true }; },
    start: () => { called.push('start'); return { started: true }; },
    control: () => { called.push('control'); return { controlled: true }; },
  });
  const received = [];
  let accepted = 0;
  handle.server.on('connection', () => { accepted += 1; });
  let client;
  try {
    client = await createTransportClient(endpoint, { onFrame: (o) => received.push(o) });
    // 先等服务端 accept 再写（Windows named pipe 上 accept 前写入会被丢弃——传输用例同一约定）。
    await until(() => accepted === 1);
    client.send(makeRequest('contracts', { params: { run_id: 'RUN-1' } }));
    await until(() => received.length === 1);
    assert.deepEqual(called, ['contracts'], '合法 request 只应调用 handlers.contracts，不得串扰其他方法');
    assert.deepEqual(received[0], { jsonrpc: '2.0', id: 1, result: { valid: true, reason: null } });
    // 服务端响应本身必须过冻结信封（response 分支）。
    const { ajv, byId } = loadAjv();
    const v = validateOne(ajv, byId, 'relay.rpc/v1', received[0]);
    assert.equal(v.ok, true, `服务端响应不合冻结信封：${v.reason ?? ''} ${v.detail ?? ''}`);
  } finally {
    client?.destroy();
    await handle.close();
  }
});

test('server：形态合法但不同的 capability hash → E_CAPABILITY_MISMATCH（不降级、不调 handler）', async () => {
  const called = [];
  const { endpoint, handle } = await withRpcServer({ contracts: () => { called.push('contracts'); return { ok: true }; } });
  const received = [];
  let accepted = 0;
  handle.server.on('connection', () => { accepted += 1; });
  let client;
  try {
    client = await createTransportClient(endpoint, { onFrame: (o) => received.push(o) });
    await until(() => accepted === 1);
    // DIFFERENT_SHA256 形态合法（^[0-9a-f]{64}$），只是值不同——必须拒绝且不按交集降级。
    const wrong = makeRequest('contracts', { handshake: { ...makeRequest('contracts').handshake, capability_hash: DIFFERENT_SHA256 } });
    client.send(wrong);
    await until(() => received.length === 1);
    assert.deepEqual(called, [], '指纹不符不得调用任何 handler');
    assert.equal(received[0].jsonrpc, '2.0');
    assert.equal(received[0].id, 1);
    assert.equal(received[0].error.data.reason, E_CAPABILITY_MISMATCH);
    assert.match(received[0].error.data.detail ?? '', /capability 指纹不符/);
  } finally {
    client?.destroy();
    await handle.close();
  }
});

test('server：未实现方法（subscribe）→ E_UNKNOWN_METHOD', async () => {
  const called = [];
  const { endpoint, handle } = await withRpcServer({ contracts: () => { called.push('contracts'); return { ok: true }; } });
  const received = [];
  let accepted = 0;
  handle.server.on('connection', () => { accepted += 1; });
  let client;
  try {
    client = await createTransportClient(endpoint, { onFrame: (o) => received.push(o) });
    await until(() => accepted === 1);
    // subscribe 在 schema 枚举内（形态合法）但本卡未实现：确定性回 E_UNKNOWN_METHOD。
    client.send(makeRequest('subscribe'));
    await until(() => received.length === 1);
    assert.deepEqual(called, [], '未实现方法不得调用任何 handler');
    assert.equal(received[0].id, 1);
    assert.equal(received[0].error.data.reason, E_UNKNOWN_METHOD);
    assert.equal(received[0].error.code, -32601);
  } finally {
    client?.destroy();
    await handle.close();
  }
});

test('server：不合冻结信封（缺 handshake）→ 既有 reason E_MISSING_FIELD', async () => {
  const called = [];
  const { endpoint, handle } = await withRpcServer({ contracts: () => { called.push('contracts'); return { ok: true }; } });
  const received = [];
  let accepted = 0;
  handle.server.on('connection', () => { accepted += 1; });
  let client;
  try {
    client = await createTransportClient(endpoint, { onFrame: (o) => received.push(o) });
    await until(() => accepted === 1);
    client.send({ jsonrpc: '2.0', id: 2, method: 'contracts' }); // 缺 handshake，信封不合
    await until(() => received.length === 1);
    assert.deepEqual(called, [], '信封不合不得调用任何 handler');
    assert.equal(received[0].id, 2);
    assert.equal(received[0].error.data.reason, 'E_MISSING_FIELD');
  } finally {
    client?.destroy();
    await handle.close();
  }
});

test('server：坏 JSON 帧 → E_TRANSPORT_FRAME_INVALID（id null）', async () => {
  const called = [];
  const { endpoint, handle } = await withRpcServer({ contracts: () => { called.push('contracts'); return { ok: true }; } });
  const received = [];
  let accepted = 0;
  handle.server.on('connection', () => { accepted += 1; });
  let client;
  try {
    client = await createTransportClient(endpoint, { onFrame: (o) => received.push(o) });
    await until(() => accepted === 1);
    client.socket.write('{"bad": }\n');
    await until(() => received.length === 1);
    assert.deepEqual(called, [], '坏帧不得调用任何 handler');
    assert.equal(received[0].id, null, '帧不可解析时无法取 id，按 JSON-RPC 回 null');
    assert.equal(received[0].error.data.reason, E_TRANSPORT_FRAME_INVALID);
    assert.equal(received[0].error.code, -32700);
  } finally {
    client?.destroy();
    await handle.close();
  }
});

test('server：客户端断开只清连接本地状态——Store 零调用、handler 零调用、服务端继续服务', async () => {
  const called = [];
  const endpoint = localEndpoint();
  const spy = makeStoreSpy();
  const handle = await createRpcServer({
    runId: 'RUN-1', store: spy.store, endpoint,
    handlers: { contracts: (params) => { called.push('contracts'); return { ok: true, echo: params }; } },
  });
  const received = [];
  let accepted = 0;
  handle.server.on('connection', () => { accepted += 1; });
  let c1;
  let c2;
  try {
    // 第一个客户端完成一次合法握手后断开。
    c1 = await createTransportClient(endpoint, {});
    await until(() => accepted === 1);
    c1.send(makeRequest('contracts', { params: { n: 1 } }));
    await until(() => called.length === 1);
    c1.destroy();
    await new Promise((r) => setTimeout(r, 20));
    // 断连只触发传输清理信号：不得碰 Store、不得调 handler（含 cancel 类）、不发任何帧。
    assert.equal(spy.state.calls, 0, '客户端断开不得触碰 Store');
    assert.deepEqual(called, ['contracts'], '断连本身不得调用任何 handler（不得发 cancel）');
    // 同一服务端继续服务新连接：重连握手仍成功，状态可由新连接取得。
    c2 = await createTransportClient(endpoint, { onFrame: (o) => received.push(o) });
    await until(() => accepted === 2);
    c2.send(makeRequest('contracts', { params: { n: 2 } }));
    await until(() => received.length === 1);
    assert.deepEqual(received[0], { jsonrpc: '2.0', id: 1, result: { ok: true, echo: { n: 2 } } });
  } finally {
    c1?.destroy();
    c2?.destroy();
    await handle.close();
  }
});

test('server：客户端断开不改变真实 Store state/events，重连仍取得同一状态', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr52-rpc-store-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run: STORE_RUN });
  await store.appendEvent({ kind: 'run_created', at: '2026-08-23T00:00:00Z' });
  const endpoint = localEndpoint();
  const handle = await createRpcServer({
    runId: STORE_RUN.run_id, store, endpoint,
    handlers: { inspectRun: () => store.readState() },
  });
  t.after(() => handle.close());
  const beforeState = await store.readState();
  const beforeEvents = await readFile(join(root, 'events.jsonl'), 'utf8');
  const received = [];
  let accepted = 0;
  handle.server.on('connection', () => { accepted += 1; });
  let c1;
  let c2;
  try {
    c1 = await createTransportClient(endpoint, {});
    await until(() => accepted === 1);
    c1.destroy();
    await until(() => accepted === 1); // 让 close 回调完成连接本地清理。
    await new Promise((r) => setTimeout(r, 20));
    assert.deepEqual(await store.readState(), beforeState, '断连不得改变真实 Store state');
    assert.equal(await readFile(join(root, 'events.jsonl'), 'utf8'), beforeEvents, '断连不得改写真实事件账');
    c2 = await createTransportClient(endpoint, { onFrame: (o) => received.push(o) });
    await until(() => accepted === 2);
    c2.send(makeRequest('inspectRun'));
    await until(() => received.length === 1);
    assert.deepEqual(received[0].result, beforeState, '重连必须从同一 Store 取得同一状态');
  } finally {
    c1?.destroy();
    c2?.destroy();
  }
});

test('server：并发连接请求/回复/坏帧/断连各回各的连接（连接级 seam，不靠移除监听器）', async () => {
  const called = [];
  const { endpoint, handle } = await withRpcServer({
    contracts: (params) => { called.push(params.tag); return { ok: true, tag: params.tag }; },
  });
  const aFrames = [];
  const bFrames = [];
  let accepted = 0;
  handle.server.on('connection', () => { accepted += 1; });
  let a;
  let b;
  try {
    a = await createTransportClient(endpoint, { onFrame: (o) => aFrames.push(o) });
    await until(() => accepted === 1);
    b = await createTransportClient(endpoint, { onFrame: (o) => bFrames.push(o) });
    await until(() => accepted === 2);
    // 交错请求：两个连接各发各的，回复必须回落到各自连接（同一 id 也不串扰）。
    a.send(makeRequest('contracts', { params: { tag: 'A' } }));
    b.send(makeRequest('contracts', { params: { tag: 'B' } }));
    await until(() => aFrames.length === 1 && bFrames.length === 1);
    assert.deepEqual(aFrames[0], { jsonrpc: '2.0', id: 1, result: { ok: true, tag: 'A' } });
    assert.deepEqual(bFrames[0], { jsonrpc: '2.0', id: 1, result: { ok: true, tag: 'B' } });
    // 连接 A 的坏帧错误也只回 A：连接本地 onFrameError，不串扰 B。
    a.socket.write('{"bad": }\n');
    await until(() => aFrames.length === 2);
    assert.equal(bFrames.length, 1, 'A 的坏帧不得串扰 B');
    assert.equal(aFrames[1].id, null);
    assert.equal(aFrames[1].error.data.reason, E_TRANSPORT_FRAME_INVALID);
    // 连接 A 断开只清 A 的连接本地记账；B 继续服务。
    a.destroy();
    b.send(makeRequest('contracts', { params: { tag: 'B2' } }));
    await until(() => bFrames.length === 2);
    assert.deepEqual(bFrames[1], { jsonrpc: '2.0', id: 1, result: { ok: true, tag: 'B2' } });
    assert.deepEqual(called, ['A', 'B', 'B2'], '三个请求各命中各自连接、无串扰');
  } finally {
    a?.destroy();
    b?.destroy();
    await handle.close();
  }
});

// ————— DHR_52 施工步骤 4.2：连接本地订阅 seam（subscribe → sink 推送 / 断连 unsubscribe）—————
// 证四点：① subscribe 返回注入的 result（不发明读取模型），sink.event / sink.runStateChanged
//         推送完整冻结对象并返回 true，客户端收到的通知帧本身再过冻结信封（notification 分支）；
//         ② 三种无效载荷（交叉协议 / 缺 protocol / 未知字段）fail-closed：sink 返回 false、不发帧；
//         ③ 有效载荷逐字原样发送（通知帧 = 构造帧，params 是注入的完整对象）；
//         ④ 客户端断开对每个订阅的 unsubscribe 恰调用一次，Store 零调用、零 cancel；
//         ⑤ 回归（时序）：订阅响应返回后 / sink 推送送达后，连接存活期间 unsubscribe
//            零调用，断开后恰一次——旧实现账目未登记，subscribe 解析即误调（旧用例只看
//            断开后总次数，抓不到该时序）。

// 完整冻结协议对象：event 取自 negative 反例里的 relay.event/v2 载荷（形态本身合法），
// run-state 取自 golden 通知夹具——两者都已由下面的冻结信封断言独立复核。
const FULL_EVENT = {
  protocol: 'relay.event/v2',
  run_id: 'RUN-1',
  seq: 1,
  at: '2026-08-21T10:00:00+08:00',
  kind: 'run_created',
};
const FULL_RUN_STATE = {
  protocol: 'relay.run-state/v1',
  run_id: 'RUN-1',
  run_status: 'pending',
  group: 'running',
  node_states: [{ node_id: 'fix', status: 'pending' }],
  updated_at: '2026-08-21T10:00:00+08:00',
};
const FULL_RUN_STATE_CHANGED = { state: FULL_RUN_STATE, caused_by_seq: 1 };

function proxyWithHiddenToJson(items) {
  const target = [...items];
  Object.defineProperty(target, 'toJSON', { configurable: true, value: () => [] });
  let inspected = false;
  return new Proxy(target, {
    ownKeys(value) {
      inspected = true;
      return Reflect.ownKeys(value).filter((key) => key !== 'toJSON');
    },
    get(value, key, receiver) {
      if (key === 'toJSON' && inspected) return Reflect.get(value, key, receiver);
      return Reflect.get(value, key, receiver);
    },
  });
}

function proxyWithChangingLength(items) {
  const target = [...items];
  let reads = 0;
  return new Proxy(target, {
    get(value, key, receiver) {
      if (key === 'length') return reads++ === 0 ? 1 : Reflect.get(value, key, receiver);
      return Reflect.get(value, key, receiver);
    },
  });
}

test('server：subscribe 注入 seam——sink.event/runStateChanged 推送完整冻结对象并返回 true', async () => {
  const { ajv, byId } = loadAjv();
  const sinkCalls = [];
  let sink;
  const unsubscribed = [];
  const { endpoint, handle } = await withRpcServer({
    contracts: () => ({ ok: true }),
    subscribe: (params, s) => {
      sink = s;
      sinkCalls.push(params);
      return { result: { ok: true, echo: params }, unsubscribe: () => unsubscribed.push('unsub') };
    },
  });
  const received = [];
  let accepted = 0;
  handle.server.on('connection', () => { accepted += 1; });
  let client;
  try {
    client = await createTransportClient(endpoint, { onFrame: (o) => received.push(o) });
    await until(() => accepted === 1);
    client.send(makeRequest('subscribe', { params: { want: ['event', 'runStateChanged'] } }));
    await until(() => received.length === 1);
    // subscribe 请求只回注入的 result，不发明读取模型。
    assert.deepEqual(received[0],
      { jsonrpc: '2.0', id: 1, result: { ok: true, echo: { want: ['event', 'runStateChanged'] } } });
    assert.deepEqual(sinkCalls, [{ want: ['event', 'runStateChanged'] }], 'subscribe 收到原始 params');
    assert.equal(typeof sink, 'object');
    // 两个 sink 方法：有效完整载荷 → 返回 true 且逐字原样推送。
    assert.equal(sink.event(FULL_EVENT), true);
    assert.equal(sink.runStateChanged(FULL_RUN_STATE_CHANGED), true);
    await until(() => received.length === 3);
    assert.deepEqual(received[1], { jsonrpc: '2.0', method: 'event', params: FULL_EVENT }, 'event 通知逐字原样');
    assert.deepEqual(received[2],
      { jsonrpc: '2.0', method: 'runStateChanged', params: FULL_RUN_STATE_CHANGED }, 'runStateChanged 通知逐字原样');
    for (const frame of received.slice(1)) {
      const v = validateOne(ajv, byId, 'relay.rpc/v1', frame);
      assert.equal(v.ok, true, `推送通知须过冻结信封：${v.reason ?? ''} ${v.detail ?? ''}`);
    }
  } finally {
    client?.destroy();
    await handle.close();
  }
  // 服务端 close 销毁在途 socket → 触发断连清理：unsubscribe 仍只被调用一次。
  // 清理经 socket close 事件异步到达（server.close 回调先于连接级 onClose 触发），
  // 先轮询等齐再断言——修复前该断言靠 subscribe 解析时的误调蒙混过关。
  await until(() => unsubscribed.length === 1);
  assert.deepEqual(unsubscribed, ['unsub'], 'unsubscribe 恰被调用一次');
});

test('DHR_61：v1 subscription sink 先发标准 Attention error 再关闭并移除连接', async () => {
  let sink;
  let closed = false;
  const unsubscribed = [];
  const { endpoint, handle } = await withRpcServer({
    subscribe: (params, value) => {
      sink = value;
      return { result: { ok: true }, unsubscribe: () => unsubscribed.push('unsub') };
    },
  });
  const received = [];
  let client;
  try {
    client = await createTransportClient(endpoint, { onFrame: frame => received.push(frame) });
    client.socket.once('close', () => { closed = true; });
    client.send(makeRequest('subscribe'));
    await until(() => received.length === 1);
    assert.equal(sink.close('E_ATTENTION_REQUIRES_READ_MODEL_V2', 'run_id=RUN-1;caused_by_seq=4'), true);
    await until(() => received.length === 2 && closed);
    assert.equal(received[1].id, null);
    assert.equal(received[1].error.data.reason, 'E_ATTENTION_REQUIRES_READ_MODEL_V2');
    assert.equal(received[1].error.data.receipt, null);
    await until(() => unsubscribed.length === 1);
    assert.equal(sink.event(FULL_EVENT), false, '已失去资格的连接不得再收到 pause event');
  } finally {
    client?.destroy();
    await handle.close();
  }
  assert.deepEqual(unsubscribed, ['unsub']);
});

test('server：sink 对三种无效载荷 fail-closed——返回 false、不发任何帧', async () => {
  const { ajv, byId } = loadAjv();
  let sink;
  const { endpoint, handle } = await withRpcServer({
    subscribe: (params, s) => { sink = s; return { result: { ok: true } }; },
  });
  const received = [];
  let accepted = 0;
  handle.server.on('connection', () => { accepted += 1; });
  let client;
  try {
    client = await createTransportClient(endpoint, { onFrame: (o) => received.push(o) });
    await until(() => accepted === 1);
    client.send(makeRequest('subscribe'));
    await until(() => received.length === 1); // 只有 subscribe 响应
    // ① 交叉协议：runStateChanged 塞 relay.event/v2 载荷（F-023 反例）、event 塞 run-state 载荷。
    for (const [method, params] of [['runStateChanged', { state: FULL_EVENT, caused_by_seq: 1 }], ['event', FULL_RUN_STATE]]) {
      const r = validateOne(ajv, byId, 'relay.rpc/v1', { jsonrpc: '2.0', method, params });
      assert.equal(r.reason, 'E_PROTOCOL_MISMATCH', '完整且可识别的另一冻结协议对象才报 F-057 新码');
      assert.equal(r.at, method === 'runStateChanged' ? '/params/state/protocol' : '/params/protocol');
    }
    assert.equal(sink.runStateChanged({ state: FULL_EVENT, caused_by_seq: 1 }), false);
    assert.equal(sink.event(FULL_RUN_STATE), false);
    // ② 缺 protocol。
    const noProtocol = { ...FULL_EVENT };
    delete noProtocol.protocol;
    assert.equal(validateOne(ajv, byId, 'relay.rpc/v1',
      { jsonrpc: '2.0', method: 'event', params: noProtocol }).reason, 'E_MISSING_FIELD',
    '缺 protocol 不是完整、可识别的另一协议，保留 E_MISSING_FIELD');
    const crossMissingProtocol = { ...FULL_EVENT };
    delete crossMissingProtocol.protocol;
    assert.equal(validateOne(ajv, byId, 'relay.rpc/v1',
      { jsonrpc: '2.0', method: 'runStateChanged', params: { state: crossMissingProtocol, caused_by_seq: 1 } }).reason, 'E_UNKNOWN_FIELD',
    '不完整的另一协议对象不报 F-057 新码，保留实际最具体的未知字段错误');
    assert.equal(sink.event(noProtocol), false);
    // ③ 未知字段。
    assert.equal(validateOne(ajv, byId, 'relay.rpc/v1',
      { jsonrpc: '2.0', method: 'runStateChanged', params: { ...FULL_RUN_STATE_CHANGED, bogus: 1 } }).reason, 'E_UNKNOWN_FIELD',
    '未知字段不是完整冻结对象，保留 E_UNKNOWN_FIELD');
    assert.equal(validateOne(ajv, byId, 'relay.rpc/v1',
      { jsonrpc: '2.0', method: 'runStateChanged', params: { state: { ...FULL_EVENT, bogus: 1 }, caused_by_seq: 1 } }).reason, 'E_UNKNOWN_FIELD',
    '含未知字段的另一协议对象不完整，保留 E_UNKNOWN_FIELD 而非 F-057 新码');
    assert.equal(sink.runStateChanged({ ...FULL_RUN_STATE_CHANGED, bogus: 1 }), false);
    assert.equal(sink.runStateChanged({ ...FULL_RUN_STATE_CHANGED, bogus: undefined }), false,
      'undefined 未知字段不得先被 JSON.stringify 静默删除后放行');
    assert.equal(sink.runStateChanged({ ...FULL_RUN_STATE_CHANGED, toJSON: () => FULL_RUN_STATE_CHANGED }), false,
      '不得调用生产者提供的 toJSON 把非法通知净化成合法帧');
    const nodeStatesWithToJson = [...FULL_RUN_STATE.node_states];
    nodeStatesWithToJson.toJSON = () => [];
    assert.equal(sink.runStateChanged({ state: { ...FULL_RUN_STATE, node_states: nodeStatesWithToJson }, caused_by_seq: 1 }), false,
      '数组自身的 toJSON 不得在原对象校验后改变通知载荷');
    const nodeStatesWithExtra = [...FULL_RUN_STATE.node_states];
    nodeStatesWithExtra.extra = true;
    assert.equal(sink.runStateChanged({ state: { ...FULL_RUN_STATE, node_states: nodeStatesWithExtra }, caused_by_seq: 1 }), false,
      '数组任意额外属性不得进入序列化路径');
    const nodeStatesWithAccessor = [...FULL_RUN_STATE.node_states];
    let accessorReads = 0;
    Object.defineProperty(nodeStatesWithAccessor, '0', { get: () => { accessorReads += 1; return FULL_RUN_STATE.node_states[0]; } });
    assert.equal(sink.runStateChanged({ state: { ...FULL_RUN_STATE, node_states: nodeStatesWithAccessor }, caused_by_seq: 1 }), false,
      '数组索引 accessor 不得在预检时执行');
    assert.equal(accessorReads, 0, '拒绝 accessor 时不得执行其 getter');
    // ④ 本协议内普通坏值。
    assert.equal(validateOne(ajv, byId, 'relay.rpc/v1',
      { jsonrpc: '2.0', method: 'event', params: { ...FULL_EVENT, at: 'not-a-timestamp' } }).reason, 'E_BAD_VALUE',
    '本协议内普通坏值不冒充发送目标错误，保留 E_BAD_VALUE');
    // 三种反例后等待一段真实时间：不得有任何通知帧发出。
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(received.length, 1, '无效载荷一律不得发帧');
    // 紧随其后的有效载荷正常推送：sink 未被无效载荷破坏，顺序确定。
    assert.equal(sink.event(FULL_EVENT), true);
    await until(() => received.length === 2);
    assert.deepEqual(received[1], { jsonrpc: '2.0', method: 'event', params: FULL_EVENT });
  } finally {
    client?.destroy();
    await handle.close();
  }
});

test('server：通知从数组 snapshot 发送，不受 Proxy 或原型 toJSON 影响', async () => {
  let sink;
  const { endpoint, handle } = await withRpcServer({
    subscribe: (_, s) => { sink = s; return { result: {} }; },
  });
  const received = [];
  let client;
  try {
    client = await createTransportClient(endpoint, { onFrame: (o) => received.push(o) });
    client.send(makeRequest('subscribe'));
    await until(() => received.length === 1 && sink);
    assert.equal(sink.runStateChanged({ state: { ...FULL_RUN_STATE,
      node_states: proxyWithHiddenToJson(FULL_RUN_STATE.node_states) }, caused_by_seq: 1 }), true);
    const changingLength = proxyWithChangingLength([...FULL_RUN_STATE.node_states, { node_id: 'review', status: 'pending' }]);
    assert.equal(sink.runStateChanged({ state: { ...FULL_RUN_STATE, node_states: changingLength }, caused_by_seq: 1 }), true);
    const inheritedToJson = [...FULL_RUN_STATE.node_states];
    Object.setPrototypeOf(inheritedToJson, { toJSON: () => [] });
    assert.equal(sink.runStateChanged({ state: { ...FULL_RUN_STATE, node_states: inheritedToJson }, caused_by_seq: 1 }), true);
    const savedArrayToJson = Array.prototype.toJSON;
    try {
      Array.prototype.toJSON = () => [];
      assert.equal(sink.runStateChanged({ state: { ...FULL_RUN_STATE, node_states: [...FULL_RUN_STATE.node_states] }, caused_by_seq: 1 }), true);
    } finally {
      if (savedArrayToJson === undefined) delete Array.prototype.toJSON;
      else Array.prototype.toJSON = savedArrayToJson;
    }
    await until(() => received.length === 5);
    assert.deepEqual(received[1], { jsonrpc: '2.0', method: 'runStateChanged', params: FULL_RUN_STATE_CHANGED });
    assert.deepEqual(received[2], { jsonrpc: '2.0', method: 'runStateChanged', params: {
      state: { ...FULL_RUN_STATE, node_states: [...FULL_RUN_STATE.node_states, { node_id: 'review', status: 'pending' }] }, caused_by_seq: 1,
    } });
    assert.deepEqual(received[3], { jsonrpc: '2.0', method: 'runStateChanged', params: FULL_RUN_STATE_CHANGED });
    assert.deepEqual(received[4], { jsonrpc: '2.0', method: 'runStateChanged', params: FULL_RUN_STATE_CHANGED });
  } finally {
    client?.destroy();
    await handle.close();
  }
});

test('server：连接关闭后遗留 sink 返回 false，不假称已送达', async () => {
  let sink;
  const { endpoint, handle } = await withRpcServer({ subscribe: (_, s) => { sink = s; return { result: {} }; } });
  let client;
  try {
    client = await createTransportClient(endpoint);
    client.send(makeRequest('subscribe'));
    await until(() => sink);
    client.destroy();
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(sink.event(FULL_EVENT), false);
  } finally { client?.destroy(); await handle.close(); }
});

test('server：错误详情不超过冻结 response 信封的 4096 字符上限', async () => {
  const { endpoint, handle } = await withRpcServer({});
  const received = [];
  let accepted = 0;
  handle.server.on('connection', () => { accepted += 1; });
  let client;
  try {
    client = await createTransportClient(endpoint, { onFrame: (o) => received.push(o) });
    await until(() => accepted === 1);
    const oversized = makeRequest('contracts');
    for (let i = 0; i < 1000; i += 1) oversized[`unknown_${i}`] = i;
    client.send(oversized);
    await until(() => received.length === 1);
    assert.ok((received[0].error.data.detail ?? '').length <= 4096);
    const { ajv, byId } = loadAjv();
    assert.equal(validateOne(ajv, byId, 'relay.rpc/v1', received[0]).ok, true,
      '服务端错误响应自身须能通过冻结 response 信封');
  } finally {
    client?.destroy();
    await handle.close();
  }
});

test('server：非 JSON handler 结果不发非法 response 或击穿服务端', async () => {
  const { endpoint, handle } = await withRpcServer({
    contracts: (params) => params.kind === 'function' ? (() => {})
      : (params.kind === 'bigint' ? 123n
        : (params.kind === 'nested-undefined' ? { ok: true, bogus: undefined }
          : (params.kind === 'array-to-json'
            ? { ok: true, rows: Object.assign([{ id: 1 }], { toJSON: () => [] }) }
            : (params.kind === 'array-proxy'
              ? { ok: true, rows: proxyWithHiddenToJson([{ id: 1 }]) }
              : { ok: true })))),
  });
  let accepted = 0;
  handle.server.on('connection', () => { accepted += 1; });
  const closeOne = [];
  const receivedOne = [];
  let first;
  let second;
  try {
    first = await createTransportClient(endpoint, {
      onFrame: (o) => receivedOne.push(o), onClose: () => closeOne.push(true),
    });
    await until(() => accepted === 1);
    first.send(makeRequest('contracts', { params: { kind: 'function' } }));
    await until(() => closeOne.length === 1);
    assert.deepEqual(receivedOne, [], '函数结果不得被 JSON 静默省略后发成缺 result 的 response');

    const receivedTwo = [];
    const closeTwo = [];
    second = await createTransportClient(endpoint, {
      onFrame: (o) => receivedTwo.push(o), onClose: () => closeTwo.push(true),
    });
    await until(() => accepted === 2);
    second.send(makeRequest('contracts', { params: { kind: 'bigint' } }));
    await until(() => closeTwo.length === 1);
    assert.deepEqual(receivedTwo, [], 'BigInt 序列化异常不得逸出或写出 response');

    const closeThree = [];
    const receivedThree = [];
    const thirdBad = await createTransportClient(endpoint, {
      onFrame: (o) => receivedThree.push(o), onClose: () => closeThree.push(true),
    });
    await until(() => accepted === 3);
    thirdBad.send(makeRequest('contracts', { params: { kind: 'nested-undefined' } }));
    await until(() => closeThree.length === 1);
    assert.deepEqual(receivedThree, [], 'nested undefined 不得先发净化 response 再断连');
    thirdBad.destroy();

    const closeFour = [];
    const receivedFour = [];
    const fourthBad = await createTransportClient(endpoint, {
      onFrame: (o) => receivedFour.push(o), onClose: () => closeFour.push(true),
    });
    await until(() => accepted === 4);
    fourthBad.send(makeRequest('contracts', { params: { kind: 'array-to-json' } }));
    await until(() => closeFour.length === 1);
    assert.deepEqual(receivedFour, [], 'array toJSON 不得先发净化 response 再断连');
    fourthBad.destroy();

    const proxyFrames = [];
    const fifth = await createTransportClient(endpoint, { onFrame: (o) => proxyFrames.push(o) });
    await until(() => accepted === 5);
    fifth.send(makeRequest('contracts', { params: { kind: 'array-proxy' } }));
    await until(() => proxyFrames.length === 1);
    assert.deepEqual(proxyFrames[0], { jsonrpc: '2.0', id: 1, result: { ok: true, rows: [{ id: 1 }] } },
      'response 必须序列化预先构造的 snapshot，而不是可变的 Proxy');
    fifth.destroy();

    const thirdFrames = [];
    const third = await createTransportClient(endpoint, { onFrame: (o) => thirdFrames.push(o) });
    await until(() => accepted === 6);
    third.send(makeRequest('contracts', { params: { kind: 'ok' } }));
    await until(() => thirdFrames.length === 1);
    assert.deepEqual(thirdFrames[0], { jsonrpc: '2.0', id: 1, result: { ok: true } },
      '坏结果断连后服务端仍能服务后续连接');
    third.destroy();
  } finally {
    first?.destroy();
    second?.destroy();
    await handle.close();
  }
});

test('server：通知写入出现背压时断开该连接并返回 false', async () => {
  let sink;
  let serverSocket;
  const { endpoint, handle } = await withRpcServer({
    subscribe: (_, s) => { sink = s; return { result: {} }; },
  });
  handle.server.on('connection', (socket) => { serverSocket = socket; });
  const received = [];
  let client;
  try {
    client = await createTransportClient(endpoint, { onFrame: (o) => received.push(o) });
    client.send(makeRequest('subscribe'));
    await until(() => received.length === 1 && sink && serverSocket);
    serverSocket.write = () => false;
    assert.equal(sink.event(FULL_EVENT), false);
    await until(() => client.socket.destroyed);
  } finally {
    client?.destroy();
    await handle.close();
  }
});

test('F-057：已注册同名新版本保持 E_UNSUPPORTED_VERSION，不误报协议错位', () => {
  const { ajv, byId } = loadAjv();
  const future = JSON.parse(readFileSync(fileURLToPath(new URL('../contracts/relay.event.v2.schema.json', import.meta.url)), 'utf8'));
  future.$id = 'https://dh-relay.local/contracts/relay.event/v3';
  future.properties.protocol.const = 'relay.event/v3';
  ajv.addSchema(future);
  byId.set(future.$id, future);
  byId.set('relay.event/v3', future);
  const r = validateOne(ajv, byId, 'relay.rpc/v1', {
    jsonrpc: '2.0', method: 'runStateChanged', params: { state: { ...FULL_EVENT, protocol: 'relay.event/v3' }, caused_by_seq: 1 },
  });
  assert.equal(r.reason, 'E_UNSUPPORTED_VERSION');
});

test('server：客户端断开对订阅的 unsubscribe 恰调用一次，Store 零调用、零 cancel', async () => {
  const unsubscribed = [];
  const subscribeCalls = [];
  let sink;
  const endpoint = localEndpoint();
  const spy = makeStoreSpy();
  const handle = await createRpcServer({
    runId: 'RUN-1', store: spy.store, endpoint,
    handlers: {
      contracts: () => ({ ok: true }),
      subscribe: (params, s) => {
        subscribeCalls.push(params);
        sink = s;
        return { result: { ok: true }, unsubscribe: () => unsubscribed.push('unsub') };
      },
    },
  });
  const received = [];
  let accepted = 0;
  handle.server.on('connection', () => { accepted += 1; });
  let client;
  try {
    client = await createTransportClient(endpoint, { onFrame: (o) => received.push(o) });
    await until(() => accepted === 1);
    client.send(makeRequest('subscribe'));
    await until(() => received.length === 1);
    // 订阅建立后推一条：证明订阅活着（sink 绑定本连接）。
    assert.equal(sink.event(FULL_EVENT), true);
    await until(() => received.length === 2);
    client.destroy();
    await until(() => unsubscribed.length === 1);
    assert.deepEqual(subscribeCalls, [{}], '断连不得再调 subscribe（不发 cancel）');
    assert.equal(spy.state.calls, 0, '客户端断开不得触碰 Store');
    // 再等一段真实时间：unsubscribe 不得被重复调用。
    await new Promise((r) => setTimeout(r, 20));
    assert.deepEqual(unsubscribed, ['unsub'], 'unsubscribe 恰一次、不重复');
  } finally {
    client?.destroy();
    await handle.close();
  }
  assert.deepEqual(unsubscribed, ['unsub'], '服务端 close 不重复调用（总计恰一次）');
});

test('server：回归——订阅存活期间 unsubscribe 零调用（响应后/推送后），断开后恰一次', async () => {
  // 修复前：connectionSubscriptions 从未登记（onConnection 只 add 到 connections），
  // subscribe 解析时 get(conn) 恒为 undefined，直接走「连接已关」分支立即误调
  // unsubscribe——连接还活着、响应都还没回客户端。旧用例只断言断开后总次数，
  // 抓不到该时序；本用例在响应后、推送后、断开后三个时点显式断言。
  const unsubscribed = [];
  const subscribeCalls = [];
  let sink;
  const endpoint = localEndpoint();
  const spy = makeStoreSpy();
  const handle = await createRpcServer({
    runId: 'RUN-1', store: spy.store, endpoint,
    handlers: {
      subscribe: (params, s) => {
        subscribeCalls.push(params);
        sink = s;
        return { result: { ok: true }, unsubscribe: () => unsubscribed.push('unsub') };
      },
    },
  });
  const received = [];
  let accepted = 0;
  handle.server.on('connection', () => { accepted += 1; });
  let client;
  try {
    client = await createTransportClient(endpoint, { onFrame: (o) => received.push(o) });
    await until(() => accepted === 1);
    client.send(makeRequest('subscribe'));
    await until(() => received.length === 1); // subscribe 响应已回客户端
    assert.equal(unsubscribed.length, 0, '响应返回后、连接存活：unsubscribe 必须零调用');
    // sink 推送完整冻结对象并送达客户端：订阅仍活着，必须仍为零调用。
    assert.equal(sink.event(FULL_EVENT), true);
    await until(() => received.length === 2);
    assert.equal(unsubscribed.length, 0, 'sink 推送送达后、连接存活：unsubscribe 必须零调用');
    // 再等一段真实时间：确认没有延迟误调。
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(unsubscribed.length, 0, '连接存活期间任何时刻都不得调用 unsubscribe');
    // 断开：恰一次，零 Store、零额外 subscribe（不发 cancel）。
    client.destroy();
    await until(() => unsubscribed.length === 1);
    assert.equal(spy.state.calls, 0, '断开不得触碰 Store');
    await new Promise((r) => setTimeout(r, 20));
    assert.deepEqual(unsubscribed, ['unsub'], '断开后 unsubscribe 恰一次、不重复');
    assert.deepEqual(subscribeCalls, [{}], '断连不得再调 subscribe（不发 cancel）');
  } finally {
    client?.destroy();
    await handle.close();
  }
  assert.deepEqual(unsubscribed, ['unsub'], '服务端 close 不重复调用（总计恰一次）');
});

test('server：异步 handler reject 只断开当前连接，服务端仍可服务后续连接', async () => {
  const { endpoint, handle } = await withRpcServer({
    contracts: (params) => params.kind === 'reject'
      ? Promise.reject(new Error('handler rejected'))
      : { ok: true },
  });
  const closed = [];
  const firstFrames = [];
  let first;
  let second;
  try {
    first = await createTransportClient(endpoint, {
      onFrame: (o) => firstFrames.push(o), onClose: () => closed.push(true),
    });
    first.send(makeRequest('contracts', { params: { kind: 'reject' } }));
    await until(() => closed.length === 1);
    assert.deepEqual(firstFrames, [], 'reject 不得写出半合法 response');

    const secondFrames = [];
    second = await createTransportClient(endpoint, { onFrame: (o) => secondFrames.push(o) });
    second.send(makeRequest('contracts', { params: { kind: 'ok' } }));
    await until(() => secondFrames.length === 1);
    assert.deepEqual(secondFrames[0], { jsonrpc: '2.0', id: 1, result: { ok: true } });
  } finally {
    first?.destroy();
    second?.destroy();
    await handle.close();
  }
});

test('server：连接关闭后迟到的 subscribe resolve 立即且仅调用一次 unsubscribe', async () => {
  let resolveSubscribe;
  const unsubscribed = [];
  const { endpoint, handle } = await withRpcServer({
    subscribe: () => new Promise((resolve) => { resolveSubscribe = resolve; }),
  });
  let client;
  try {
    client = await createTransportClient(endpoint);
    client.send(makeRequest('subscribe'));
    await until(() => typeof resolveSubscribe === 'function');
    client.destroy();
    resolveSubscribe({ result: { ok: true }, unsubscribe: () => unsubscribed.push('unsub') });
    await until(() => unsubscribed.length === 1);
    await new Promise((r) => setTimeout(r, 20));
    assert.deepEqual(unsubscribed, ['unsub'], '迟到 resolve 必须清理一次且不得重复');
  } finally {
    client?.destroy();
    await handle.close();
  }
});
