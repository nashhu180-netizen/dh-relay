// ledger.test.mjs — DHR_30 的 operation ledger（design/08 §3 的唯一 service ledger）。
//
// 这里钉的是 ledger **自身**的口径：幂等键与摘要怎么算、每个 phase 崩溃后恢复到哪、
// 保留号从哪儿 seed。service 级的崩溃重试真进程用例在 service.test.mjs。

import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  LEDGER_PHASES, ledgerPath, operationKey, readLedger, recoveryFor,
  requestDigest, seedNextSeq, writeLedger,
} from '../runtime/ledger.mjs';

const frame = (overrides = {}) => ({
  jsonrpc: '2.0',
  id: overrides.id ?? 1,
  method: overrides.method ?? 'start',
  handshake: {
    protocol_version: 'relay.rpc/v1', runtime_version: '0.0.0', capability_hash: 'a'.repeat(64),
    client_id: overrides.clientId ?? 'cli-1', request_id: overrides.requestId ?? 'req-1',
  },
  params: overrides.params ?? { run_id: 'R001-probe-20260827', action: 'stop' },
});

test('ledger：request_digest 复用 JCS 且只排除 id 与 handshake.request_id', () => {
  const base = requestDigest(frame());
  assert.match(base, /^[0-9a-f]{64}$/, 'digest 必须是小写 sha256 十六进制');

  // 同一请求换 JSON-RPC id / 换 request_id：摘要必须不变——否则同键重试会被误判成冲突。
  assert.equal(requestDigest(frame({ id: 99 })), base, 'JSON-RPC id 不参与摘要');
  assert.equal(requestDigest(frame({ requestId: 'req-2' })), base, 'handshake.request_id 不参与摘要');

  // 键序不参与摘要（RFC 8785 JCS 的本义）。
  const reordered = frame();
  const shuffled = { params: reordered.params, handshake: reordered.handshake, method: reordered.method, id: reordered.id, jsonrpc: reordered.jsonrpc };
  assert.equal(requestDigest(shuffled), base, '键序不得影响摘要');

  // 语义变了摘要必须变——这是 E_REQUEST_CONFLICT 的全部判据。
  assert.notEqual(requestDigest(frame({ params: { run_id: 'R001-probe-20260827', action: 'resume' } })), base);
  assert.notEqual(requestDigest(frame({ method: 'control' })), base);
  assert.notEqual(requestDigest(frame({ clientId: 'cli-2' })), base, 'client_id 是请求的一部分，参与摘要');

  // 摘要不得把原帧改坏：调用方随后还要用同一帧执行。
  const original = frame();
  requestDigest(original);
  assert.equal(original.handshake.request_id, 'req-1', 'digest 计算不得就地删掉 request_id');
});

test('ledger：幂等键是 (client_id, request_id, method) 复合键', () => {
  const key = operationKey({ client_id: 'cli-1', request_id: 'req-1', method: 'start' });
  assert.equal(key, operationKey({ method: 'start', request_id: 'req-1', client_id: 'cli-1' }), '键序不得改变幂等键');
  for (const differ of [
    { client_id: 'cli-2', request_id: 'req-1', method: 'start' },
    { client_id: 'cli-1', request_id: 'req-2', method: 'start' },
    { client_id: 'cli-1', request_id: 'req-1', method: 'control' },
  ]) {
    assert.notEqual(operationKey(differ), key, `三元组任一分量不同即不同键：${JSON.stringify(differ)}`);
  }
});

test('ledger：写入原子且不留临时文件，损坏文件 fail-closed', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr30-ledger-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));

  assert.deepEqual(await readLedger(repoRoot), { version: 1, operations: {}, next_seq: 0 }, '无账本时给出空账本而不是报错');

  const ledger = { version: 1, next_seq: 3, operations: { k: { client_id: 'cli-1', request_id: 'req-1', method: 'start', request_digest: 'a'.repeat(64), run_id: null, phase: 'accepted', receipt_id: null, reason: null } } };
  await writeLedger(repoRoot, ledger);
  assert.deepEqual(await readLedger(repoRoot), ledger, '写完立刻可读回同一份');
  const leftovers = (await readdir(join(repoRoot, '.dh-relay'))).filter(name => name.includes('.tmp'));
  assert.deepEqual(leftovers, [], '不得留下临时文件');

  await writeFile(ledgerPath(repoRoot), '{ this is not json', 'utf8');
  await assert.rejects(() => readLedger(repoRoot), /E_STORE_CORRUPT/, '损坏账本必须 fail-closed，不得当空账本重开号');
});

test('ledger：next_seq 的 seed 取 v2 Run 根与 runs.json 本仓最大号的最大值', () => {
  assert.equal(seedNextSeq({ runIds: [], indexMaxSeq: 0 }), 0);
  assert.equal(seedNextSeq({ runIds: ['R001-a-20260827', 'R007-b-20260827'], indexMaxSeq: 3 }), 7, '盘上有更大的号时以盘为准');
  assert.equal(seedNextSeq({ runIds: ['R001-a-20260827'], indexMaxSeq: 12 }), 12, '索引更大时以索引为准');
  // 认不出的目录名不得把 seed 拉低或抬高——发号唯一性靠 seed，猜错就会重号。
  assert.equal(seedNextSeq({ runIds: ['not-a-run-id', 'R004-a-20260827'], indexMaxSeq: 0 }), 4);
});

test('ledger：六个 phase 的恢复动作与 design/08 §3 的表逐行一致', () => {
  assert.deepEqual(LEDGER_PHASES, ['accepted', 'run_id_reserved', 'store_created', 'actor_ready', 'receipt_committed', 'failed']);
  // 恢复表是「崩溃重试为什么不会发第二个号」的全部依据，故逐行钉住。
  assert.equal(recoveryFor('accepted').reserve, true, 'accepted：继续 reserve，同一 key 不重开号');
  assert.equal(recoveryFor('run_id_reserved').reuseRunId, true, 'run_id_reserved：用保留号建 Store');
  assert.equal(recoveryFor('store_created').reuseRunId, true, 'store_created：打开既有 Store，不新建');
  assert.equal(recoveryFor('actor_ready').commitReceipt, true, 'actor_ready：把 Receipt 写入 Run Store 后提交 ledger');
  assert.equal(recoveryFor('receipt_committed').replayReceipt, true, 'receipt_committed：直接返回既有 Receipt');
  assert.equal(recoveryFor('failed').reexecute, false, 'failed：不重新执行，返回同一 failed Receipt');
  assert.equal(recoveryFor('accepted').reexecute, true);
  assert.throws(() => recoveryFor('made-up'), /E_STORE_CORRUPT/, '未知 phase 是账本损坏，不得当作可继续');
});
