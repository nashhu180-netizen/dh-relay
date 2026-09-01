/**
 * DHR_70 — Receipt-bound 提交权在 Attempt 非终态时必须保持。
 *
 * 承接 DHR_35 的 E-3526 / F-3514：Claude 路启动与 Receipt 均成功，`submit-executor-result`
 * 却撞 `E_LEASE_HELD:actor-closed`，节点停在 running、无 Result。
 *
 * 口径（DevPlan §3.2 DHR_70）：
 *   A1  lease 仍有效 + Receipt current + 节点非终态 → 晚交必须 committed Ack + 唯一 Result
 *   A2  旧 actor 已结束或失租 + Run 非终态 + Receipt current
 *       → 旧 actor 拒绝且零 mutation；service 新取 lease、新 actor、重建 gate 后提交恰好一个 Result
 *   A3  无法合法取得当前 lease（真 lease-lost / 非 current Receipt / 已终态）→ 保持拒绝、零 mutation
 *
 * 红线：不得为修 actor-closed 放宽单写者；不得要求提交打到「写 Receipt 的那一届进程」。
 */
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { localCapabilityHashV2 } from '../rpc/capabilities.mjs';
import { createTransportClient } from '../rpc/transport.mjs';
import { endpointForRepo } from '../runtime/endpoint.mjs';
import { startRuntimeService } from '../runtime/service.mjs';
import { startWorkflowDriver } from '../runtime/workflow-driver.mjs';
import { createStore } from '../store/store.mjs';
import { writeLedger } from '../runtime/ledger.mjs';
import { makeFakeHerdr } from './helpers/fake-herdr.mjs';

const execFileAsync = promisify(execFile);
const HASH = 'a'.repeat(64);

const runTemplate = {
  protocol: 'relay.run/v2', run_id: 'RUN-DHR70', workflow_name: 'dhr70', summary: 'DHR70 submission gate',
  trigger: 'system', created_at: '2026-09-01T00:00:00.000Z', labels: [],
  nodes: [{ node_id: 'node-a', title: 'A', role: 'work', required: true,
    executor_profiles: [{ kind: 'herdr-agent', ref: 'herdr.claude.main' }] }],
};

const identity = {
  executor_profile_id: 'herdr.claude.main', account_alias: 'acct-main',
  config_fingerprint: HASH, executor_capability_hash: HASH,
};

const receiptTemplate = {
  protocol: 'relay.attempt-receipt/v1', receipt_id: 'rcpt-dhr70', run_id: runTemplate.run_id,
  node_id: 'node-a', attempt_id: 'attempt-dhr70', issued_at: '2026-09-01T00:00:00.000Z',
  executor_identity: identity, fallback_profile_snapshots: [],
  result_submission_mode: 'receipt-bound/v1',
};

/** events.jsonl 里历次 lease_acquired 的 epoch 序列（host.mjs 写的 detail 形如 `epoch:3`）。 */
const leaseEpochs = (raw) => raw.split('\n').filter(Boolean).map(line => JSON.parse(line))
  .filter(event => event.kind === 'lease_acquired')
  .map(event => Number(String(event.detail).split(':')[1]));

const until = async (check, timeoutMs = 20_000) => {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() >= deadline) throw new Error('timeout');
    await new Promise(resolve => setTimeout(resolve, 25));
  }
};

/** 驱动 C 用例的 Claude profile：`product:'claude-code'` 才走 DHR_69 的 Claude 分支。 */
const claudeProfile = {
  executor_profile_id: 'herdr.claude.main', backend: 'herdr', product: 'claude-code',
  command_alias: 'claude', account_alias: 'acct-main',
  capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported',
    structured_result: 'supported', user_input_passthrough: 'supported' },
  supported_platforms: [process.platform], headless_supported: true,
  config_fingerprint_rule: { kind: 'file-exists', path_template: '${DHR70_PROFILE_HOME}/profile.json',
    fields: [{ pointer: '/model', classification: 'nonsecret' }] },
};

/** 第二份 Attempt Receipt：注册后它成为 current，`rcpt-dhr70` 退化为陈旧 Receipt。 */
const supersedingReceipt = {
  ...receiptTemplate, receipt_id: 'rcpt-dhr70-next', attempt_id: 'attempt-dhr70-next',
  issued_at: '2026-09-01T00:01:00.000Z',
};

/**
 * 起一个带 receipt-bound gate 的 service：bootstrap 会为它取 lease、建 actor、注册 gate。
 * `supersede:true` 时额外注册一份更晚的 Attempt Receipt，用来构造「非 current Receipt」。
 */
async function bootService(t, { supersede = false } = {}) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr70-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  const runtimeRoot = join(repoRoot, 'runtime');
  await mkdir(runtimeRoot, { recursive: true });
  const endpoint = endpointForRepo(repoRoot, { runtimeRoot });
  const v2Endpoint = endpointForRepo(repoRoot, { runtimeRoot, channel: 'v2' });
  const bootstrapEndpoint = endpointForRepo(repoRoot, { runtimeRoot, channel: 'bootstrap' });

  const runId = 'R001-dhr70-20260901';
  const run = { ...runTemplate, run_id: runId };
  const runRoot = join(repoRoot, '.dh-relay', runId);
  const store = await createStore({ root: runRoot, run });
  await store.registerAttemptReceipt({ ...receiptTemplate, run_id: runId });
  if (supersede) await store.registerAttemptReceipt({ ...supersedingReceipt, run_id: runId });
  await writeLedger(repoRoot, { version: 1, next_seq: 1, operations: {
    claim: { run_id: runId, phase: 'accepted', receipt_id: null },
  } });

  const service = await startRuntimeService({
    repoRoot, endpoint, v2Endpoint, bootstrapEndpoint, localUserCapability: 'local-capability',
    indexPath: join(runtimeRoot, 'runs.json'),
  });
  t.after(() => service.close().catch(() => {}));

  const responses = new Map();
  const client = await createTransportClient(v2Endpoint, { onFrame: frame => { responses.set(frame.id, frame); } });
  t.after(() => client.destroy());
  let nextId = 0;
  const call = async (method, params) => {
    const id = ++nextId;
    client.send({ jsonrpc: '2.0', id, method, handshake: {
      protocol_version: 'relay.rpc/v2', runtime_version: '0.0.0', capability_hash: localCapabilityHashV2(),
      client_id: 'dhr70-test', request_id: `dhr70-${id}`,
    }, params });
    return until(() => responses.get(id), 10_000);
  };
  await call('contracts', {
    descriptor_version: service.descriptor.descriptor_version, repo_id: service.descriptor.repo_id,
    generation: service.descriptor.generation, local_user_capability: 'local-capability',
  });
  return { repoRoot, runRoot, runId, service, call };
}

const submit = (call, receiptId = receiptTemplate.receipt_id,
  { outcome = 'succeeded', reason = null } = {}) => call('submit-executor-result', {
  protocol: 'relay.executor-result-submission/v1', receipt_id: receiptId, outcome, reason,
});

/** 被拒时的统一断言：拿到 reason 码 + 零 mutation（没有 Result、节点没被推进）。 */
const assertRejected = async (frame, runRoot, expectedReason, note) => {
  assert.ok(frame.error, `${note}：必须被拒，实得 ${JSON.stringify(frame.result)}`);
  assert.equal(frame.error?.data?.reason, expectedReason, `${note}：${JSON.stringify(frame.error?.data)}`);
  assert.deepEqual(await resultsOf(runRoot), [], `${note}：拒绝不得留下 Result`);
};

const resultsOf = async (runRoot) => readdir(join(runRoot, 'results')).catch(() => []);
const nodeStatus = async (runRoot) =>
  JSON.parse(await readFile(join(runRoot, 'state.json'), 'utf8')).node_states[0].status;
const eventsOf = async (runRoot) => (await readFile(join(runRoot, 'events.jsonl'), 'utf8'))
  .trim().split('\n').filter(Boolean).map(line => JSON.parse(line));

/**
 * 本届 herdr 等待已经结束：恢复路径找不到 executor_ref，写下 observation_lost 后 `continue`，
 * driver.done 随即 settle——而 gate 因 `hasOpenSubmissionGates` 被 `driveRun` 故意保留。
 * 这正是 Codex E-3525 的晚交形态（等待已收口、提交才到）。
 */
const untilRoundEnded = (runRoot) => until(async () => (await eventsOf(runRoot))
  .some(event => event.observation_status === 'observation_lost'), 10_000);

test('DHR70 A1: lease 仍有效时，本届 herdr 等待结束后的晚交必须 committed 且只写一个 Result', async (t) => {
  const { runRoot, call } = await bootService(t);
  await untilRoundEnded(runRoot);

  // 前置：节点非终态、Receipt current、lease 未被动过（本进程仍是合法持有者）。
  assert.equal(await nodeStatus(runRoot), 'running');
  assert.deepEqual(await resultsOf(runRoot), []);
  const lease = JSON.parse(await readFile(join(runRoot, 'host-lease.json'), 'utf8'));
  assert.equal(lease.holder_pid, process.pid, 'A1 的前提是 lease 仍由现役 service 合法持有');

  const settled = await submit(call);
  assert.equal(settled.error, undefined,
    'lease 有效时的晚交不得被拒：' + JSON.stringify(settled.error));
  assert.equal(settled.result?.ok, true);
  assert.equal(settled.result?.idempotent, false);
  assert.equal(settled.result?.result?.receipt_id, receiptTemplate.receipt_id);
  assert.equal(settled.result?.result?.structured?.source, 'receipt-bound-submission/v1');
  assert.deepEqual(await resultsOf(runRoot), [receiptTemplate.receipt_id + '.json']);
  assert.equal(await nodeStatus(runRoot), 'succeeded');

  // 同 digest 重投幂等：不新增第二个 Result。
  const again = await submit(call);
  assert.equal(again.result?.ok, true);
  assert.equal(again.result?.idempotent, true);
  assert.deepEqual(await resultsOf(runRoot), [receiptTemplate.receipt_id + '.json']);
});

test('DHR70 A2: 旧 actor 失租关闭后，非终态 Run 的晚交必须由新持 lease 的 actor 写入唯一 Result', async (t) => {
  const { runRoot, call } = await bootService(t);
  // 与 A1 只差一个变量：同样等本届 herdr 等待结束、gate 同样保留，唯一不同是旧 actor 会失租。
  await untilRoundEnded(runRoot);

  // 前置：节点非终态、Receipt current、尚无 Result。
  assert.notEqual(await nodeStatus(runRoot), 'succeeded');
  assert.deepEqual(await resultsOf(runRoot), []);

  // 外部接管租约：epoch+1 且 holder 非本进程 → 旧 actor 下一个 tick renew 失败 → 失租关闭。
  // expires_at 设为过去 + holder_pid 用一个已死 pid，保证接管者走后 service 仍能合法重取。
  const leasePath = join(runRoot, 'host-lease.json');
  const held = JSON.parse(await readFile(leasePath, 'utf8'));
  const eventsBefore = await readFile(join(runRoot, 'events.jsonl'), 'utf8');
  await writeFile(leasePath, JSON.stringify({
    ...held, holder_pid: 999999999, epoch: held.epoch + 1,
    acquired_at: new Date(Date.now() - 60000).toISOString(),
    expires_at: new Date(Date.now() - 30000).toISOString(),
    expires_at_epoch_ms: Date.now() - 30000,
  }), 'utf8');

  // 轮询到旧 actor 真的关闭为止。**每一次被拒都当场取证**：A2 口径的前半句是「旧 actor 对
  // 提交拒绝且零 mutation」，只把 lease-lost 响应丢掉等于这半句从没被证明——一个「被 fence
  // 时顺手写几条非 Result 事件、之后再照常重建」的实现能一路绿到底（F-70-R2-01）。
  // A3-1 证的是「无合法 lease 时一直拒」，替代不了 A2 这个「先拒、后由新 actor 接手」的阶段证据。
  let refusals = 0;
  const settled = await until(async () => {
    const frame = await submit(call);
    const detail = JSON.stringify(frame.error ?? frame.result ?? {});
    if (!detail.includes('lease-lost')) return frame;
    refusals += 1;
    await assertRejected(frame, runRoot, 'E_LEASE_HELD', '旧 actor 失租后的提交');
    assert.equal(await readFile(join(runRoot, 'events.jsonl'), 'utf8'), eventsBefore,
      '旧 actor 被 fence 期间不得追加任何事件');
    return null;
  }, 20000);
  assert.ok(refusals >= 1,
    'A2 必须真的经历过旧 actor 的拒绝阶段，否则「先拒后重建」只证了后半句');

  // 红：现役会停在 E_LEASE_HELD:actor-closed —— gate 还在，但它指着一具尸体。
  assert.equal(settled.error, undefined,
    '非终态 + current Receipt 的晚交不得被拒：' + JSON.stringify(settled.error));
  assert.equal(settled.result?.ok, true);
  assert.equal(settled.result?.result?.receipt_id, receiptTemplate.receipt_id);
  assert.equal(settled.result?.result?.structured?.source, 'receipt-bound-submission/v1');

  // 恰好一个 Result，且旧 actor 没在关闭后再写过账。
  assert.deepEqual(await resultsOf(runRoot), [receiptTemplate.receipt_id + '.json']);
  assert.notEqual(await readFile(join(runRoot, 'events.jsonl'), 'utf8'), eventsBefore);

  // A2 的另一半（F-70-R1-01）：不只是"交进去了"，而是**经由新取的 lease** 交进去的。
  // 少了下面这段，一个绕开 lease 直接落盘的实现也能让上面几条断言全绿——那正是本卡红线要挡的。
  const leaseAfter = JSON.parse(await readFile(leasePath, 'utf8'));
  assert.equal(leaseAfter.holder_pid, process.pid,
    '晚交必须在本 service 重新持有 lease 之后才写：' + JSON.stringify(leaseAfter));
  assert.equal(leaseAfter.epoch, held.epoch + 2,
    '外部接管是 epoch+1，本 service 重取应为 epoch+2（既非复用旧 epoch，也不跳号）');

  // lease_acquired 只在 host 取到 lease 后写：恰新增一条 = 真的新起了一届 actor，不是旧 actor 复活。
  assert.deepEqual(
    leaseEpochs(await readFile(join(runRoot, 'events.jsonl'), 'utf8')),
    [...leaseEpochs(eventsBefore), held.epoch + 2],
    '应恰好新增一条 lease_acquired（epoch ' + (held.epoch + 2) + '）',
  );

  // 同 digest 重投幂等：不新增第二个 Result。
  const again = await submit(call);
  assert.equal(again.result?.ok, true);
  assert.equal(again.result?.idempotent, true);
  assert.deepEqual(await resultsOf(runRoot), [receiptTemplate.receipt_id + '.json']);
});

test('DHR70 A3-1: 另一进程活着持有 lease 时，晚交必须一直被拒且零 mutation', async (t) => {
  const { runRoot, call } = await bootService(t);
  await untilRoundEnded(runRoot);
  const eventsBefore = await readFile(join(runRoot, 'events.jsonl'), 'utf8');

  // 真接管：epoch+1 且持有者**活着**（本测试进程）、租约**未过期** ——
  // 这与 A2 的「无主过期租约」正相反：谁也不该能合法重取，提交必须一直被拒。
  const leasePath = join(runRoot, 'host-lease.json');
  const held = JSON.parse(await readFile(leasePath, 'utf8'));
  await writeFile(leasePath, JSON.stringify({
    ...held, holder_pid: process.pid, epoch: held.epoch + 1,
    acquired_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 600_000).toISOString(),
    expires_at_epoch_ms: Date.now() + 600_000,
  }), 'utf8');

  // 阶段一：旧 actor 还没走到续租 tick —— Store 的 writeGuard 必须在落盘前把它 fence 掉。
  const fenced = await submit(call);
  await assertRejected(fenced, runRoot, 'E_LEASE_HELD', '接管后写路径被 fence');
  assert.match(JSON.stringify(fenced.error.data), /lease-lost/);

  // 阶段二：旧 actor 续租失败并关闭之后，仍必须拒绝——不得因为「gate 还在」就放行。
  // 判据只看「不再是 writeGuard 的 fence」，不锁死 detail：修复前它落 `actor-closed`，
  // 修复后 service 会摘掉死 actor 去重取 lease，于是落 acquireLease 的裸 `E_LEASE_HELD`。
  // 两种形态都必须是拒绝——本例要钉的是「拒绝」这件事本身，不是它的措辞。
  const closed = await until(async () => {
    const frame = await submit(call);
    return JSON.stringify(frame.error ?? frame.result ?? {}).includes('lease-lost') ? null : frame;
  }, 20_000);
  await assertRejected(closed, runRoot, 'E_LEASE_HELD', '旧 actor 关闭后仍无合法 lease');

  assert.equal(await nodeStatus(runRoot), 'running', '被拒的提交不得推进节点状态');
  assert.equal(await readFile(join(runRoot, 'events.jsonl'), 'utf8'), eventsBefore,
    '被拒的提交不得追加任何事件');
});

test('DHR70 A3-2: Receipt 已被更晚的 Attempt 取代时，即便 lease 有效也必须拒绝', async (t) => {
  const { runRoot, call } = await bootService(t, { supersede: true });
  await untilRoundEnded(runRoot);

  const lease = JSON.parse(await readFile(join(runRoot, 'host-lease.json'), 'utf8'));
  assert.equal(lease.holder_pid, process.pid, '本例的前提是 lease 完全正常，只有 Receipt 不 current');

  const stale = await submit(call, receiptTemplate.receipt_id);
  await assertRejected(stale, runRoot, 'E_IDENTITY_MISMATCH', '陈旧 Receipt');
  assert.equal(await nodeStatus(runRoot), 'running');
});

test('DHR70 A3-3 / B: 已终态冲突与未知 Receipt 保持现役拒绝语义', async (t) => {
  const { runRoot, call } = await bootService(t);
  await untilRoundEnded(runRoot);

  // B：未知 Receipt —— 不得因为 known 索引里查不到就去修 runs.json（那是账目 mutation）。
  const unknown = await submit(call, 'rcpt-dhr70-unknown');
  await assertRejected(unknown, runRoot, 'E_IDENTITY_MISMATCH', '未知 Receipt');

  // 先合法提交一次，把节点推到终态。
  const committed = await submit(call);
  assert.equal(committed.result?.ok, true);
  assert.equal(await nodeStatus(runRoot), 'succeeded');

  // A3-3：终态后换一个 outcome 重投 —— 冲突，且不得覆盖已落的 Result。
  const conflict = await submit(call, receiptTemplate.receipt_id,
    { outcome: 'failed', reason: 'E_EXECUTOR_REPORTED_FAILURE' });
  assert.ok(conflict.error, '终态冲突必须被拒，实得 ' + JSON.stringify(conflict.result));
  assert.equal(conflict.error?.data?.reason, 'E_TERMINAL_STATE_CONFLICT');
  assert.deepEqual(await resultsOf(runRoot), [receiptTemplate.receipt_id + '.json']);
  const result = JSON.parse(await readFile(join(runRoot, 'results',
    receiptTemplate.receipt_id + '.json'), 'utf8'));
  assert.equal(result.outcome, 'succeeded', '冲突提交不得改写已落 Result');
});

/**
 * C（对齐 DHR_35 的 E-3526 观测 `herdr_status=idle;agent_get=idle;pane_get=error`）：
 * `pane get` 失败只是伴随信号。DHR_69 的覆盖规则唯一——idle ∧ pane **blocked** 才派生 blocked；
 * `error` 不覆盖，因此它**不得**单独把 Attempt 写成 `E_EXECUTOR_HOST_LOST` 终态。
 * 本例走 driver 层：service 不转发 `herdrCli`，只有这一层能注入观测形态。
 */
test('DHR70 C: agent_get=idle ∧ pane_get=error 不得单独判死 Attempt，提交仍须走得通', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr70-pane-error-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const runId = 'R001-dhr70-pane-error-20260901';
  const runRoot = join(repoRoot, '.dh-relay', runId);
  const store = await createStore({ root: runRoot, run: { ...runTemplate, run_id: runId } });
  const registryPath = join(repoRoot, 'profiles.json');
  await writeFile(join(repoRoot, 'profile.json'), JSON.stringify({ model: 'test-model' }), 'utf8');
  await writeFile(registryPath, JSON.stringify({ profiles: [claudeProfile] }), 'utf8');

  const fake = makeFakeHerdr({ statuses: ['idle'], paneAlive: false });
  const driver = startWorkflowDriver({
    repoRoot, runId, actor: { submitControl: job => job(store) }, herdrCli: fake.cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR70_PROFILE_HOME: repoRoot },
    herdrPollMs: 2, doneTimeoutMs: 20,
  });
  t.after(() => driver.stop());
  await driver.done;

  // 观测形态必须真的是 E-3526 那一条，否则本例证明不了任何事。
  const observation = [...store.events].reverse()
    .find(event => event.kind === 'host_observation_changed');
  assert.match(String(observation?.detail), /agent_get=idle/);
  assert.match(String(observation?.detail), /pane_get=error/);

  // 不得判死：既没有 E_EXECUTOR_HOST_LOST，也没有 attempt_failed。
  assert.equal(store.events.some(event => event.reason === 'E_EXECUTOR_HOST_LOST'), false,
    'pane_get=error 不是宿主丢失的证据');
  assert.equal(store.events.some(event => event.kind === 'attempt_failed'), false);
  const attention = store.events.find(event => event.kind === 'human_input_requested');
  assert.equal(attention?.reason, 'E_EXECUTOR_RESULT_MISSING',
    '本届等待到期只该落「没交结果」，不该落「宿主没了」');
  assert.equal((await store.readState()).node_states[0].status, 'waiting_human');
  assert.equal(driver.hasOpenSubmissionGates, true, 'gate 必须活过本届等待');

  // 提交仍须走得通（A1 形态）：恰一个 Result，节点转 succeeded。
  const attempt = store.events.find(event => event.kind === 'attempt_started');
  const receiptId = String(attempt.detail).slice('receipt:'.length);
  const submitted = await driver.submitExecutorResult({
    protocol: 'relay.executor-result-submission/v1', receipt_id: receiptId,
    outcome: 'succeeded', reason: null,
  });
  assert.equal(submitted.ok, true, JSON.stringify(submitted));
  assert.deepEqual(await resultsOf(runRoot), [receiptId + '.json']);
  assert.equal((await store.readState()).node_states[0].status, 'succeeded');
});
