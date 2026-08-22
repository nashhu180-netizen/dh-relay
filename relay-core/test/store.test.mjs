import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { applyEvents } from '../store/state.mjs';
import { createStore, openStore, replayRun } from '../store/store.mjs';
import { loadAjv, validateOne } from '../tools/validate.mjs';

const run = {
  protocol: 'relay.run/v2',
  run_id: 'RUN-DHR29',
  workflow_name: 'store-test',
  summary: 'Store red test',
  trigger: 'system',
  trigger_by: null,
  created_at: '2026-08-21T00:00:00Z',
  labels: [],
  nodes: [{ node_id: 'node-a', title: 'A', required: true, executor_profiles: [{ kind: 'process', ref: 'worker.mjs' }] }]
};

test('Store：事件账只追加，独立回放得到相同 state_signature', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr29-store-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: '2026-08-21T00:00:00Z' });
  await store.appendEvent({ kind: 'node_started', node_id: 'node-a', at: '2026-08-21T00:00:01Z' });
  const eventsText = await readFile(join(root, 'events.jsonl'), 'utf8');
  assert.equal(eventsText.trim().split('\n').length, 2, '每个事件只追加一行');
  const { ajv, byId } = loadAjv();
  for (const event of store.events) assert.equal(validateOne(ajv, byId, 'relay.event/v2', event).ok, true, '每个落盘事件必须符合冻结契约');
  const first = await replayRun({ run, events: store.events });
  const second = await replayRun({ run, events: store.events });
  assert.equal(first.state_signature, second.state_signature, '同一事件账回放必须逐字节一致');
});

test('Store：checkpoint/result 幂等；冲突和迟到结果不得污染终态', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr29-store-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  const oldReceipt = { receipt_id: 'receipt-old', node_id: 'node-a', attempt_id: 'z-attempt' };
  assert.deepEqual(await store.registerReceipt(oldReceipt), { ok: true, idempotent: false });
  assert.deepEqual(await store.registerReceipt(oldReceipt), { ok: true, idempotent: true }, '同一 receipt 重投不得产生新的 seq');
  const checkpoint = { receipt_id: 'receipt-old', node_id: 'node-a', attempt_id: 'z-attempt', checkpoint_id: 'checkpoint-1', payload_digest: 'a'.repeat(64), at: '2026-08-21T00:00:01Z' };
  assert.deepEqual(await store.appendCheckpoint(checkpoint), { ok: true, idempotent: false });
  assert.deepEqual(await store.appendCheckpoint(checkpoint), { ok: true, idempotent: true });
  assert.deepEqual(await store.appendCheckpoint({ ...checkpoint, payload_digest: 'b'.repeat(64) }), { ok: false, reason: 'E_CHECKPOINT_CONFLICT' });
  await store.registerReceipt({ receipt_id: 'receipt-current', node_id: 'node-a', attempt_id: 'a-attempt' });
  const late = await store.appendResult({ receipt_id: 'receipt-old', node_id: 'node-a', attempt_id: 'z-attempt', outcome: 'failed', payload_digest: 'c'.repeat(64), at: '2026-08-21T00:00:02Z' });
  assert.deepEqual(late, { ok: false, reason: 'late_result_quarantined' });
  const accepted = { receipt_id: 'receipt-current', node_id: 'node-a', attempt_id: 'a-attempt', outcome: 'succeeded', payload_digest: 'd'.repeat(64), at: '2026-08-21T00:00:03Z' };
  assert.deepEqual(await store.appendResult(accepted), { ok: true, idempotent: false });
  assert.deepEqual(await store.appendResult(accepted), { ok: true, idempotent: true });
  assert.deepEqual(await store.appendResult({ ...accepted, outcome: 'failed', payload_digest: 'e'.repeat(64) }), { ok: false, reason: 'E_TERMINAL_STATE_CONFLICT' });
  const state = await store.readState();
  assert.equal(state.node_states[0].status, 'succeeded', '迟到或冲突结果不得改写终态');
  assert.equal(store.events.filter((event) => event.kind === 'late_result_quarantined').length, 1, '迟到结果必须留痕隔离');
});

test('Store：waiting_human 只能由事件账产生，快照加增量回放与全量一致', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr29-store-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'human_input_requested', node_id: 'node-a', at: '2026-08-21T00:00:01Z' });
  const snapshot = await store.readState();
  const replayed = replayRun({ run, events: store.events });
  assert.equal(snapshot.run_status, 'waiting_human');
  assert.equal(snapshot.state_signature, replayed.state_signature, '快照必须可由全量事件逐字节重建');
});

test('Store：拒绝非规范 labels，并按 v1 口径脱敏 structured 落盘', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr29-store-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(() => createStore({ root: join(root, 'bad'), run: { ...run, labels: [{ key: 'z', value: '1' }, { key: 'a', value: '2' }] } }), /labels-not-sorted/);
  const store = await createStore({ root, run });
  await store.registerReceipt({ receipt_id: 'receipt-current', node_id: 'node-a', attempt_id: 'attempt-1' });
  await store.appendResult({ receipt_id: 'receipt-current', node_id: 'node-a', attempt_id: 'attempt-1', outcome: 'succeeded', payload_digest: 'f'.repeat(64), at: '2026-08-21T00:00:03Z', structured: { note: 'api_key=not-a-real-secret-1234', token: 'sk-notarealsecret123456' } });
  const stored = await readFile(join(root, 'results', 'receipt-current.json'), 'utf8');
  assert.match(stored, /<REDACTED:api_key>/);
  assert.doesNotMatch(stored, /not-a-real-secret-1234|sk-notarealsecret123456/);
  const late = await store.appendResult({ receipt_id: 'old-receipt', node_id: 'node-a', attempt_id: 'old-attempt', outcome: 'failed', payload_digest: 'e'.repeat(64), at: '2026-08-21T00:00:04Z', structured: { api_key: 'not-a-real-secret-5678', password: 'plain-password', pem: '-----BEGIN PRIVATE KEY-----\nnot-a-real-private-material\n-----END PRIVATE KEY-----', session_key: 'sk-notarealsecret654321' } });
  assert.deepEqual(late, { ok: false, reason: 'late_result_quarantined' });
  const quarantine = await readFile(join(root, 'quarantine', (await readdir(join(root, 'quarantine')))[0]), 'utf8');
  assert.match(quarantine, /<REDACTED:api_key>|<REDACTED:password>|<REDACTED:private_key>/);
  assert.doesNotMatch(quarantine, /not-a-real-secret-5678|plain-password|not-a-real-private-material|sk-notarealsecret654321/);
});

test('Store：openStore 从磁盘重建事件账与工件，幂等与冲突判定跨重启成立', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr29-reopen-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  const receipt = { receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1' };
  await store.registerReceipt(receipt);
  const checkpoint = { receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1', checkpoint_id: 'checkpoint-1', payload_digest: 'a'.repeat(64), at: '2026-08-21T00:00:01Z' };
  await store.appendCheckpoint(checkpoint);
  const result = { receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1', outcome: 'succeeded', payload_digest: 'b'.repeat(64), at: '2026-08-21T00:00:02Z' };
  await store.appendResult(result);
  const before = store.events;

  const reopened = await openStore({ root });
  assert.deepEqual(reopened.events, before, '重开后的事件账必须与重启前一致');
  assert.deepEqual(await reopened.registerReceipt(receipt), { ok: true, idempotent: true }, 'receipt 幂等判定必须跨重启成立');
  assert.deepEqual(await reopened.appendCheckpoint(checkpoint), { ok: true, idempotent: true }, 'checkpoint 幂等判定必须跨重启成立');
  assert.deepEqual(await reopened.appendCheckpoint({ ...checkpoint, payload_digest: 'c'.repeat(64) }), { ok: false, reason: 'E_CHECKPOINT_CONFLICT' });
  assert.deepEqual(await reopened.appendResult(result), { ok: true, idempotent: true }, 'result 幂等判定必须跨重启成立');
  const late = await reopened.appendResult({ receipt_id: 'receipt-gone', node_id: 'node-a', attempt_id: 'attempt-9', outcome: 'failed', payload_digest: 'd'.repeat(64), at: '2026-08-21T00:00:03Z' });
  assert.deepEqual(late, { ok: false, reason: 'late_result_quarantined' });
  const seqBeforeFinish = reopened.events.length;
  const next = await reopened.appendEvent({ kind: 'run_finished', at: '2026-08-21T00:00:04Z' });
  assert.equal(next.seq, seqBeforeFinish, '重启后 seq 必须从已加载账本末尾继续');
  assert.equal((await reopened.readState()).node_states[0].status, 'succeeded');
});

test('Store：openStore 对事件账损坏 fail-closed', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr29-corrupt-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: '2026-08-21T00:00:00Z' });
  await store.appendEvent({ kind: 'node_started', node_id: 'node-a', at: '2026-08-21T00:00:01Z' });
  const eventsPath = join(root, 'events.jsonl');
  const lines = store.events.map((event) => JSON.stringify(event));

  await writeFile(eventsPath, (await readFile(eventsPath, 'utf8')).replace(/\n$/, '') + '{"protocol":"relay.event', 'utf8');
  await assert.rejects(() => openStore({ root }), /E_EVENT_LOG_CORRUPT/, '强杀留下的半行必须拒绝重建');

  await writeFile(eventsPath, `${lines.join('\n')}\n`, 'utf8');
  await assert.doesNotReject(() => openStore({ root }), '完整账本必须可重建');

  const gap = [lines[0], JSON.stringify({ ...store.events[1], seq: 5 })].join('\n') + '\n';
  await writeFile(eventsPath, gap, 'utf8');
  await assert.rejects(() => openStore({ root }), /E_EVENT_LOG_CORRUPT/, 'seq 断档必须拒绝重建');

  const foreign = [lines[0], JSON.stringify({ ...store.events[1], run_id: 'RUN-OTHER' })].join('\n') + '\n';
  await writeFile(eventsPath, foreign, 'utf8');
  await assert.rejects(() => openStore({ root }), /E_EVENT_LOG_CORRUPT/, '外来 run 的事件必须拒绝重建');

  const badKind = [lines[0], JSON.stringify({ ...store.events[1], kind: 'no_such_kind' })].join('\n') + '\n';
  await writeFile(eventsPath, badKind, 'utf8');
  await assert.rejects(() => openStore({ root }), /E_EVENT_LOG_CORRUPT/, '账内事件不合冻结契约必须拒绝重建');

  await assert.rejects(() => openStore({ root: join(root, 'missing') }), /E_RUN_NOT_FOUND/);
});

test('Store：快照加增量回放与全量回放在每个切点逐字节一致', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr29-snap-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.registerReceipt({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1' });
  await store.appendCheckpoint({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1', checkpoint_id: 'checkpoint-1', payload_digest: 'a'.repeat(64), at: '2026-08-21T00:00:01Z' });
  await store.appendEvent({ kind: 'human_input_requested', node_id: 'node-a', attempt_id: 'attempt-1', at: '2026-08-21T00:00:02Z' });
  await store.appendResult({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1', outcome: 'succeeded', payload_digest: 'b'.repeat(64), at: '2026-08-21T00:00:03Z' });

  for (let cut = 0; cut <= store.events.length; cut += 1) {
    const snapshotAtCut = replayRun({ run, events: store.events.slice(0, cut) });
    const { state_signature: ignored, ...unsigned } = snapshotAtCut;
    const incremental = applyEvents({ run, state: unsigned, events: store.events.slice(cut) });
    for (let round = 0; round < 3; round += 1) {
      const full = replayRun({ run, events: store.events });
      assert.equal(incremental.state_signature, full.state_signature, `切点 ${cut}：快照加增量必须与全量同签名`);
      assert.deepEqual(incremental, full, `切点 ${cut}：快照加增量必须与全量逐字段相同`);
    }
  }
});

test('Store：写前 schema 校验拒绝非法事件且不落盘不留痕', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr29-schema-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: '2026-08-21T00:00:00Z' });
  const before = await readFile(join(root, 'events.jsonl'), 'utf8');
  await assert.rejects(() => store.appendEvent({ kind: 'no_such_kind', at: '2026-08-21T00:00:01Z' }), /E_SCHEMA_INVALID/, '未知 kind 必须在写盘前被契约拒绝');
  await assert.rejects(() => store.appendEvent({ kind: 'human_input_requested', at: '2026-08-21T00:00:01Z' }), /E_SCHEMA_INVALID/, 'K-1 事件缺 node_id 必须在写盘前被拒');
  assert.equal(await readFile(join(root, 'events.jsonl'), 'utf8'), before, '被拒事件不得落盘');
  assert.equal(store.events.length, 1, '被拒事件不得进入内存账');
});

test('Store：receipt+attempt 身份链不符按 B11 口径处置', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr29-identity-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.registerReceipt({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1' });
  assert.deepEqual(
    await store.appendCheckpoint({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-9', checkpoint_id: 'cp-x', payload_digest: 'a'.repeat(64), at: '2026-08-21T00:00:01Z' }),
    { ok: false, reason: 'E_IDENTITY_MISMATCH' },
    'checkpoint 冒用他人 attempt 必须拒绝',
  );
  await store.appendCheckpoint({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1', checkpoint_id: 'cp-ok', payload_digest: 'c'.repeat(64), at: '2026-08-21T00:00:01Z' });
  assert.deepEqual(
    await store.appendCheckpoint({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-9', checkpoint_id: 'cp-ok', payload_digest: 'c'.repeat(64), at: '2026-08-21T00:00:02Z' }),
    { ok: false, reason: 'E_IDENTITY_MISMATCH' },
    '冒用 attempt 借同 key 同 digest 重投不得白拿 idempotent',
  );
  const late = await store.appendResult({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-9', outcome: 'succeeded', payload_digest: 'b'.repeat(64), at: '2026-08-21T00:00:02Z' });
  assert.deepEqual(late, { ok: false, reason: 'late_result_quarantined' }, 'result 冒用他人 attempt 必须隔离');
  await assert.rejects(() => store.registerReceipt({ receipt_id: 'receipt-bad', node_id: 'node-unknown', attempt_id: 'attempt-x' }), /E_BAD_VALUE/, 'receipt 指向不存在节点必须拒绝');
  assert.equal(store.events.filter((event) => event.kind === 'checkpoint_recorded' && event.detail === 'checkpoint:cp-x').length, 0, '身份不符的 checkpoint 不得留事件');
});
test('Store：终态不可被本 attempt 后续事件污染，fresh attempt 不被旧终态锁死', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr29-terminal-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.registerReceipt({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1' });
  await store.appendResult({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1', outcome: 'failed', reason: 'E_EXECUTOR_EXIT_NONZERO', payload_digest: 'a'.repeat(64), at: '2026-08-21T00:00:01Z' });
  assert.equal((await store.readState()).node_states[0].status, 'failed');
  assert.deepEqual(
    await store.appendCheckpoint({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1', checkpoint_id: 'cp-late', payload_digest: 'b'.repeat(64), at: '2026-08-21T00:00:02Z' }),
    { ok: false, reason: 'E_TERMINAL_STATE_CONFLICT' },
    '终态后本 attempt 的新 checkpoint 必须拒绝',
  );
  await assert.rejects(() => store.appendEvent({ kind: 'human_input_requested', node_id: 'node-a', attempt_id: 'attempt-1', at: '2026-08-21T00:00:03Z' }), /E_TERMINAL_STATE_CONFLICT/, '终态后 waiting_human 不得再产生');
  await assert.rejects(() => store.appendEvent({ kind: 'node_started', node_id: 'node-a', at: '2026-08-21T00:00:03Z' }), /E_TERMINAL_STATE_CONFLICT/, '终态后 node_started 不得回退状态');
  const eventsAfterPollution = store.events.length;
  const late = await store.appendResult({ receipt_id: 'receipt-r0', node_id: 'node-a', attempt_id: 'attempt-0', outcome: 'succeeded', payload_digest: 'c'.repeat(64), at: '2026-08-21T00:00:04Z' });
  assert.deepEqual(late, { ok: false, reason: 'late_result_quarantined' }, '隔离留痕在终态后仍可用');
  assert.equal(store.events.length, eventsAfterPollution + 1);
  assert.equal((await store.readState()).node_states[0].status, 'failed', '迟到结果不得改写终态');

  await store.registerReceipt({ receipt_id: 'receipt-r2', node_id: 'node-a', attempt_id: 'attempt-2' });
  assert.deepEqual(
    await store.appendResult({ receipt_id: 'receipt-r2', node_id: 'node-a', attempt_id: 'attempt-2', outcome: 'succeeded', payload_digest: 'd'.repeat(64), at: '2026-08-21T00:00:05Z' }),
    { ok: true, idempotent: false },
    'fresh attempt 的结果必须被接受，不被旧终态锁死',
  );
  const state = await store.readState();
  assert.equal(state.node_states[0].status, 'succeeded');
  assert.equal(state.node_states[0].attempt_count, 2, '重试次数必须随 fresh attempt 累计');
});

test('Store：并发 append 的 seq 串行化无重号无断档', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr29-concurrent-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  const writes = Array.from({ length: 6 }, (_, index) => store.appendEvent({ kind: 'run_created', at: `2026-08-21T00:00:0${index}Z` }));
  await Promise.all(writes);
  assert.deepEqual(store.events.map((event) => event.seq), Array.from({ length: 6 }, (_, index) => index), '并发写必须获得连续且唯一的 seq');
  const lines = (await readFile(join(root, 'events.jsonl'), 'utf8')).trim().split('\n');
  assert.deepEqual(lines.map((line) => JSON.parse(line).seq), store.events.map((event) => event.seq), '落盘顺序必须与 seq 一致');
});

test('Store：P1 迟到结果 fixture 复验 v2 判定不弱于 v1（compat-matrix §6 移交第 2 条）', async (t) => {
  const fixture = async (name) => JSON.parse(await readFile(new URL(`../../tools/tests/fixtures/results/${name}`, import.meta.url), 'utf8'));
  const stale = await fixture('result-stale-attempt.json');
  const current = await fixture('result-duplicate.json');
  const wrongHash = await fixture('result-wrong-hash.json');

  // v1 身份 → v2 身份的映射保持相对次序：attempt 1 的 receipt 先签发（seq 小），
  // attempt 2 后签发成为当前回执；v1 的 plan_hash CAS ≙ v2 的 payload_digest 幂等键。
  const openAndDrive = async () => {
    const root = await mkdtemp(join(tmpdir(), 'dhr29-p1fixture-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const fixtureRun = { ...run, nodes: [{ node_id: 'A', title: 'A', required: true, executor_profiles: [{ kind: 'process', ref: 'worker.mjs' }] }] };
    const store = await createStore({ root, run: fixtureRun });
    await store.registerReceipt({ receipt_id: 'receipt-A-att-1', node_id: 'A', attempt_id: 'attempt-1' });
    await store.registerReceipt({ receipt_id: 'receipt-A-att-2', node_id: 'A', attempt_id: 'attempt-2' });
    return store;
  };
  const asResult = (fixtureDoc, receiptId) => ({
    receipt_id: receiptId,
    node_id: 'A',
    attempt_id: `attempt-${fixtureDoc.attempt_id}`,
    outcome: fixtureDoc.result_status === 'succeeded' ? 'succeeded' : 'failed',
    payload_digest: fixtureDoc.plan_hash,
    at: fixtureDoc.written_at,
  });

  // 次序一：迟到结果在最终结果之后到达——隔离，不改终局。
  let store = await openAndDrive();
  assert.deepEqual(await store.appendResult(asResult(stale, 'receipt-A-att-1')), { ok: false, reason: 'late_result_quarantined' }, '旧 attempt 结果在当前回执下必须隔离（≥ v1 result_stale）');
  assert.deepEqual(await store.appendResult(asResult(current, 'receipt-A-att-2')), { ok: true, idempotent: false });
  assert.deepEqual(await store.appendResult(asResult(wrongHash, 'receipt-A-att-2')), { ok: false, reason: 'E_TERMINAL_STATE_CONFLICT' }, '同回执异 plan_hash 必须冲突拒绝（≥ v1 CAS 拒收，且给显式码）');
  assert.equal((await store.readState()).node_states[0].status, 'succeeded');
  assert.equal(store.events.filter((event) => event.kind === 'late_result_quarantined').length, 1);

  // 次序二：迟到结果抢在最终结果之前、但已在 attempt 2 注册之后——同样隔离（判定挂 seq 不挂提交顺序）。
  store = await openAndDrive();
  assert.deepEqual(await store.appendResult(asResult(stale, 'receipt-A-att-1')), { ok: false, reason: 'late_result_quarantined' });
  assert.deepEqual(await store.appendResult(asResult(current, 'receipt-A-att-2')), { ok: true, idempotent: false });
  assert.equal((await store.readState()).node_states[0].status, 'succeeded');
});

test('Store：node_states 覆盖全集与 done<=total（schema 表达不了、实现期守的约束各一反例）', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr29-invariants-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const multiRun = {
    ...run,
    nodes: [
      { node_id: 'node-a', title: 'A', required: true, executor_profiles: [{ kind: 'process', ref: 'worker.mjs' }] },
      { node_id: 'node-b', title: 'B', required: true, executor_profiles: [{ kind: 'process', ref: 'worker.mjs' }] },
    ],
  };
  const store = await createStore({ root, run: multiRun });
  assert.deepEqual((await store.readState()).progress, { done: 0, total: 2 }, '建库即可读且 done<=total 从第一拍成立');
  await store.registerReceipt({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1' });
  await store.appendResult({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1', outcome: 'succeeded', payload_digest: 'a'.repeat(64), at: '2026-08-21T00:00:01Z' });
  const midway = await store.readState();
  assert.deepEqual(midway.node_states.map((nodeState) => nodeState.node_id), ['node-a', 'node-b'], 'F-037：只推进一个节点时全集仍必须出现——漏节点会让聚合条款空真');
  assert.deepEqual(midway.progress, { done: 1, total: 2 }, 'F-070：中间态 done<total');
  assert.equal(midway.run_status, 'pending', '有 succeeded 有 pending 时聚合为 pending（归堆 needs_you→running 由 group 承担）');
  await assert.rejects(() => store.appendEvent({ kind: 'node_started', node_id: 'ghost', at: '2026-08-21T00:00:02Z' }), /E_BAD_VALUE/, '幽灵节点事件必须拒绝，不得制造幻影条目');
  await store.registerReceipt({ receipt_id: 'receipt-r2', node_id: 'node-b', attempt_id: 'attempt-1' });
  await store.appendResult({ receipt_id: 'receipt-r2', node_id: 'node-b', attempt_id: 'attempt-1', outcome: 'succeeded', payload_digest: 'b'.repeat(64), at: '2026-08-21T00:00:03Z' });
  const final = await store.readState();
  assert.deepEqual(final.progress, { done: 2, total: 2 }, 'F-070 边界：全部 succeeded 时 done==total');
  assert.equal(final.run_status, 'succeeded');
});
