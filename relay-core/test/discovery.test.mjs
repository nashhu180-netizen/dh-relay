// discovery.test.mjs — DHR_30 的重启发现（design/07 §5.2 / design/08 §5 的四步固定顺序）。
//
//   ① 扫 <repo>/.dh-relay/<run_id>/ 取完整 v2 Run（Run 真相）
//   ② 只对 runtime-operations.json 对账（Store event 与 ledger 冲突以 Store event 为准）
//   ③ 用发现结果修复用户级 runs.json 加速索引
//   ④ 只读扫 .dh-runtime/relay/ 并投影 legacy-v1
//
// 这里钉的是「顺序」和「谁是真相」；跨进程崩溃重试在 service.test.mjs。

import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createStore } from '../store/store.mjs';
import { discoverRepo } from '../runtime/discovery.mjs';
import { ledgerPath, writeLedger } from '../runtime/ledger.mjs';

const runDocument = (runId) => ({
  protocol: 'relay.run/v2', run_id: runId, workflow_name: 'probe', summary: 'probe',
  trigger: 'system', created_at: '2026-08-27T00:00:00Z',
  nodes: [{ node_id: 'node-a', title: 'node', role: 'work', required: false, executor_profiles: [{ kind: 'process', ref: 'bin/probe' }] }],
});

async function makeV2Run(repoRoot, runId) {
  const root = join(repoRoot, '.dh-relay', runId);
  const store = await createStore({ root, run: runDocument(runId) });
  await store.appendEvent({ kind: 'run_created', at: '2026-08-27T00:00:00Z' });
  return { root, store };
}

const receiptFor = (runId, receiptId) => ({
  protocol: 'relay.launch-receipt/v2', receipt_id: receiptId, request_id: 'req-1', client_id: 'cli-1',
  method: 'start', state: 'committed', reason: null, run_id: runId, node_id: null, attempt_id: null,
  kind: 'start', issued_at: '2026-08-27T00:00:01Z', issued_by_runtime: 'runtime-1', request_digest: 'a'.repeat(64),
});

const opRecord = (overrides) => ({
  client_id: 'cli-1', request_id: 'req-1', method: 'start', request_digest: 'a'.repeat(64),
  run_id: null, phase: 'accepted', receipt_id: null, reason: null, ...overrides,
});

test('discovery：完整 v2 Run 进 Read Model，残缺根只进 report 不冒充 Run', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr30-disc-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const indexPath = join(repoRoot, 'index', 'runs.json');
  await makeV2Run(repoRoot, 'R001-probe-20260827');
  // 只有 run.json、没有事件账与快照 = 半个现场，绝不能当成一个可控 Run 端出去。
  const partial = join(repoRoot, '.dh-relay', 'R002-partial-20260827');
  await mkdir(partial, { recursive: true });
  await writeFile(join(partial, 'run.json'), JSON.stringify(runDocument('R002-partial-20260827')), 'utf8');
  await writeLedger(repoRoot, { version: 1, next_seq: 2, operations: { k1: opRecord({ run_id: 'R001-probe-20260827', phase: 'receipt_committed', receipt_id: 'rcpt-1' }) } });

  const found = await discoverRepo({ repoRoot, indexPath });
  assert.deepEqual(found.v2.map(item => item.run_id), ['R001-probe-20260827']);
  assert.equal(found.v2[0].source, 'runtime-v2');
  assert.equal(found.v2[0].read_only, false);
  assert.ok(found.report.some(entry => entry.kind === 'incomplete_store' && entry.run_id === 'R002-partial-20260827'),
    '残缺根必须进 fail-closed report');
  assert.equal(found.next_seq >= 2, true, '保留号 seed 不得低于盘上最大号');
});

test('discovery：损坏事件账不得冒充完整 v2 Run——JSON 坏 / torn tail / seq 缺口三类都进 fail-closed report', async (t) => {
  // design/07 §5.2 与 design/08 §5 第 1 步的判据是「协议校验通过」，不是「三个文件名都在」。
  // 只看 events.jsonl 存不存在，等于把一本读不动的事件账端进 Read Model：
  // 之后 openStore 必然 fail-closed，可 list/status 已经把它当成可控 Run 报出去了。
  const runId = 'R002-broken-20260827';
  const corruptions = {
    // ① 某一行不是 JSON：整本账从这里往后都无法定序。
    'json-broken': (lines) => `${lines[0]}\n{not json\n`,
    // ② torn tail：最后一行没写完就断电/被杀。少了结尾换行 = 这一行的内容不可信。
    'torn-tail': (lines) => `${lines[0]}\n${lines[0].slice(0, Math.floor(lines[0].length / 2))}`,
    // ③ seq 缺口：事件账的 seq 从 0 起密集，跳号意味着中间那条事实丢了——
    //    带着缺口回放出来的 state 是**编**的，不是账上的。
    'seq-gap': (lines) => `${lines[0]}\n${JSON.stringify({ ...JSON.parse(lines[0]), seq: 2 })}\n`,
  };

  for (const [label, corrupt] of Object.entries(corruptions)) {
    const repoRoot = await mkdtemp(join(tmpdir(), `dhr30-corrupt-${label}-`));
    t.after(() => rm(repoRoot, { recursive: true, force: true }));
    const indexPath = join(repoRoot, 'index', 'runs.json');
    await makeV2Run(repoRoot, 'R001-healthy-20260827');
    const { root } = await makeV2Run(repoRoot, runId);
    const eventsPath = join(root, 'events.jsonl');
    const lines = (await readFile(eventsPath, 'utf8')).split('\n').filter(Boolean);
    await writeFile(eventsPath, corrupt(lines), 'utf8');

    const found = await discoverRepo({ repoRoot, indexPath });
    assert.deepEqual(found.v2.map(item => item.run_id), ['R001-healthy-20260827'],
      `${label}：损坏事件账绝不能进普通 Read Model`);
    assert.ok(found.report.some(entry => entry.kind === 'corrupt_store' && entry.run_id === runId),
      `${label}：损坏 Store 必须进 fail-closed report，实得 ${JSON.stringify(found.report)}`);
    // 与 F-008 的保守 seed 口径一致：损坏根照样占号。号发过就是发过，
    // 把它排除在 seed 之外，下一个 Run 会拿到同号并撞进这个坏目录。
    assert.equal(found.next_seq, 2, `${label}：损坏根必须计入 seed，绝不重发它的号`);
  }
});

test('discovery：ledger 与 Run Store 冲突时以 Store 事件为准并修复 ledger', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr30-disc-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const indexPath = join(repoRoot, 'index', 'runs.json');
  const runId = 'R001-probe-20260827';
  const { store } = await makeV2Run(repoRoot, runId);

  // ① ledger 说已提交，Store 里却没有这条 operation —— 提交是假的，必须退回可重做的相位。
  await writeLedger(repoRoot, { version: 1, next_seq: 1, operations: {
    unbacked: opRecord({ run_id: runId, phase: 'receipt_committed', receipt_id: 'rcpt-missing' }),
  } });
  let found = await discoverRepo({ repoRoot, indexPath });
  assert.equal(found.ledger.operations.unbacked.phase, 'actor_ready',
    'Store 里没有的 Receipt 不算已提交——不得让客户端拿到一个不存在的回执');
  assert.ok(found.report.some(entry => entry.kind === 'receipt_not_in_store'));
  assert.equal(JSON.parse(await readFile(ledgerPath(repoRoot), 'utf8')).operations.unbacked.phase, 'actor_ready',
    '修复必须落盘，否则下一届 service 还要再判一次');

  // ② Store 里有这条 operation，ledger 却停在 actor_ready —— 以 Store 为准补成已提交。
  await store.appendOperation(receiptFor(runId, 'rcpt-real'));
  await writeLedger(repoRoot, { version: 1, next_seq: 1, operations: {
    lagging: opRecord({ run_id: runId, phase: 'actor_ready', receipt_id: 'rcpt-real' }),
  } });
  found = await discoverRepo({ repoRoot, indexPath });
  assert.equal(found.ledger.operations.lagging.phase, 'receipt_committed', 'Run Store 有事件即为真');
});

test('discovery：缺根的 reservation 保号不释放，孤儿 Store 进 report', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr30-disc-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const indexPath = join(repoRoot, 'index', 'runs.json');
  await makeV2Run(repoRoot, 'R003-orphan-20260827');
  await writeLedger(repoRoot, { version: 1, next_seq: 5, operations: {
    reserved: opRecord({ run_id: 'R005-ghost-20260827', phase: 'run_id_reserved' }),
  } });

  const found = await discoverRepo({ repoRoot, indexPath });
  assert.equal(found.ledger.operations.reserved.phase, 'run_id_reserved', '缺根的保留号必须原样留着，重试走同一 run_id');
  assert.ok(found.report.some(entry => entry.kind === 'reserved_without_root' && entry.run_id === 'R005-ghost-20260827'));
  // 盘上有根、ledger 里无人认领 = 孤儿：报出来，但它仍是真实存在的 Run，不许被当空号覆盖。
  assert.ok(found.report.some(entry => entry.kind === 'orphan_store' && entry.run_id === 'R003-orphan-20260827'));
  const orphan = found.v2.find(item => item.run_id === 'R003-orphan-20260827');
  assert.ok(orphan, 'Run Store 才是 Run 真相，孤儿不得从列表消失');
  // 「不隐藏」与「可写」是两件事：孤儿的来处无从对账，投影必须自带只读标记，
  // 否则 F-009 登记的「只读列出」在实现里就只是一句自述（F-013）。
  assert.equal(orphan.read_only, true, '孤儿 Store 的投影必须是只读的');
  assert.equal(orphan.source, 'runtime-v2', '孤儿仍是 v2 Run，不得被降级成 legacy');
  assert.ok(found.orphans.has('R003-orphan-20260827'), 'scanRuns 必须把孤儿集合交出来供控制面判定');
  assert.equal(found.next_seq, 5, '孤儿与保留号都必须计入 seed，绝不重号');
});

test('discovery：legacy v1 只读投影，事实读不到就是 null，绝不从 v1 猜值', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr30-disc-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const indexPath = join(repoRoot, 'index', 'runs.json');
  const legacyRun = join(repoRoot, '.dh-runtime', 'relay', 'RELAY-DF-legacy-1');
  await mkdir(legacyRun, { recursive: true });
  await writeFile(join(legacyRun, 'state.json'), JSON.stringify({ anything: 'v1 形状不是 v2 契约' }), 'utf8');

  const found = await discoverRepo({ repoRoot, indexPath });
  assert.deepEqual(found.legacy, [{
    run_id: 'RELAY-DF-legacy-1', source: 'legacy-v1', read_only: true,
    run_status: null, group: null, updated_at: null,
  }], 'legacy 只投影目录名这一条可读事实；其余一律 null');
  // 只读：绝不取 lease、绝不迁移、绝不改一个字节。
  assert.deepEqual(await readFile(join(legacyRun, 'state.json'), 'utf8'), JSON.stringify({ anything: 'v1 形状不是 v2 契约' }));
  assert.equal(found.report.some(entry => entry.run_id === 'RELAY-DF-legacy-1'), false, 'legacy 不进 fail-closed report');
});

test('discovery：用发现结果修复 runs.json 索引，且索引永远不是 Run 真相', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr30-disc-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const indexPath = join(repoRoot, 'index', 'runs.json');
  await mkdir(join(repoRoot, 'index'), { recursive: true });
  // 索引里有一个盘上根本不存在的 Run，且 max_seq 落后于盘上事实。
  const other = join(tmpdir(), 'some-other-repo');
  await writeFile(indexPath, JSON.stringify({
    version: 1,
    repos: {
      [repoRoot]: { max_seq: 1, runs: [{ run_id: 'R009-ghost-20260827', summary: 'x', created_at: '2026-08-27T00:00:00Z' }] },
      [other]: { max_seq: 4, runs: [{ run_id: 'R004-elsewhere-20260827', summary: 'y', created_at: '2026-08-27T00:00:00Z' }] },
    },
  }), 'utf8');
  await makeV2Run(repoRoot, 'R002-probe-20260827');

  const found = await discoverRepo({ repoRoot, indexPath });
  const index = JSON.parse(await readFile(indexPath, 'utf8'));
  assert.deepEqual(index.repos[repoRoot].runs.map(entry => entry.run_id), ['R002-probe-20260827'],
    '索引以盘上事实重建：幽灵条目必须消失');
  assert.equal(index.repos[repoRoot].max_seq >= 9, true, 'max_seq 只增不减——号一旦发过就绝不回收');
  assert.deepEqual(index.repos[other].runs.map(entry => entry.run_id), ['R004-elsewhere-20260827'],
    '跨仓 segment 必须原样保留，不得被本仓修复覆盖');
  assert.deepEqual(found.v2.map(item => item.run_id), ['R002-probe-20260827'], 'Read Model 只认盘上事实');
});
