import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { deriveHerdrHostRef, launchHerdrAgent, observationDetail, observeHerdrAgent } from '../runtime/executors/herdr/herdr-executor.mjs';
import { startWorkflowDriver } from '../runtime/workflow-driver.mjs';
import { createStore } from '../store/store.mjs';
import { dumpDriverScene, untilEvent } from './helpers/bounded-wait.mjs';
import { makeFakeHerdr } from './helpers/fake-herdr.mjs';

const INSTRUCTION = 'DHR69 test task';
const instruction_ref = { path: 'task.md', sha256: createHash('sha256').update(INSTRUCTION, 'utf8').digest('hex') };

const HASH = 'a'.repeat(64);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, label, timeoutMs = 45_000) {
  const end = Date.now() + timeoutMs;
  while (!(await check())) {
    if (Date.now() > end) throw new Error(`timeout:${label}`);
    await sleep(5);
  }
}
const parseDetail = detail => Object.fromEntries(String(detail ?? '').split(';').map(part => part.split(/=(.*)/s)).filter(([key]) => key));

const codexProfile = {
  executor_profile_id: 'herdr.codex.test', backend: 'herdr', product: 'codex-cli', command_alias: 'codex',
  account_alias: 'acct-test',
  capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported',
    structured_result: 'supported', user_input_passthrough: 'supported' },
  supported_platforms: ['win32'], headless_supported: true,
  config_fingerprint_rule: { kind: 'file-exists', path_template: '${DHR69_PROFILE_HOME}/profile.json',
    fields: [{ pointer: '/model', classification: 'nonsecret' }] },
};
const claudeProfile = { ...codexProfile, executor_profile_id: 'herdr.claude.test', product: 'claude-code', command_alias: 'claude' };

async function runtimeFixture(t, { statuses, paneStatuses, registryProfile = claudeProfile, fake = {}, driver = {} } = {}) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr69-runtime-'));
  const runId = 'R001-dhr69';
  const run = {
    protocol: 'relay.run/v2', run_id: runId, workflow_name: 'relay/basic-agent-task@1', summary: 'dhr69',
    trigger: 'system', created_at: '2026-08-31T00:00:00.000Z',
    nodes: [{ node_id: 'herdr', title: 'herdr', role: '执行', required: false, depends_on: [],
      executor_profiles: [{ kind: 'herdr-agent', ref: registryProfile.executor_profile_id }], instruction_ref }],
  };
  const root = join(repoRoot, '.dh-relay', runId);
  await mkdir(root, { recursive: true });
  const registryPath = join(repoRoot, 'profiles.json');
  await writeFile(join(repoRoot, 'profile.json'), JSON.stringify({ model: 'test-model' }), 'utf8');
  await writeFile(join(repoRoot, 'task.md'), INSTRUCTION, 'utf8');
  await writeFile(registryPath, JSON.stringify({ profiles: [registryProfile] }), 'utf8');
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: run.created_at });
  const herdr = makeFakeHerdr({ statuses, paneStatuses, ...fake });
  const started = startWorkflowDriver({
    repoRoot, runId, actor: { submitControl: fn => fn(store) }, herdrCli: herdr.cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR69_PROFILE_HOME: repoRoot },
    herdrPollMs: 20, observationLostMs: 60_000, doneTimeoutMs: 60_000, herdrReadyTimeoutMs: 0,
    ...driver,
  });
  t.after(async () => {
    await started.stop();
    await rm(repoRoot, { recursive: true, force: true }).catch(() => {});
  });
  return { store, root, driver: started, fake: herdr, repoRoot };
}

async function recoveryFixture(t, { statuses, paneStatuses, ...fakeExtras }) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr69-recovery-'));
  const runId = 'R001-dhr69-recovery';
  const run = {
    protocol: 'relay.run/v2', run_id: runId, workflow_name: 'relay/basic-agent-task@1', summary: 'dhr69-recovery',
    trigger: 'system', created_at: '2026-08-31T00:00:00.000Z',
    nodes: [{ node_id: 'herdr', title: 'herdr', role: '执行', required: false, depends_on: [],
      executor_profiles: [{ kind: 'herdr-agent', ref: claudeProfile.executor_profile_id }], instruction_ref }],
  };
  const root = join(repoRoot, '.dh-relay', runId);
  await mkdir(root, { recursive: true });
  const registryPath = join(repoRoot, 'profiles.json');
  await writeFile(join(repoRoot, 'profile.json'), JSON.stringify({ model: 'test-model' }), 'utf8');
  await writeFile(join(repoRoot, 'task.md'), INSTRUCTION, 'utf8');
  await writeFile(registryPath, JSON.stringify({ profiles: [claudeProfile] }), 'utf8');
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: run.created_at });
  await store.appendEvent({ kind: 'node_started', at: run.created_at, node_id: 'herdr' });
  await store.registerAttemptReceipt({
    protocol: 'relay.attempt-receipt/v1', receipt_id: 'rcpt-recover', run_id: runId, node_id: 'herdr',
    attempt_id: 'attempt-recover', issued_at: run.created_at,
    executor_identity: {
      executor_profile_id: claudeProfile.executor_profile_id, account_alias: 'acct-test',
      config_fingerprint: HASH, executor_capability_hash: HASH,
    },
    fallback_profile_snapshots: [],
    result_submission_mode: 'receipt-bound/v1',
  });
  await store.appendEvent({
    kind: 'host_observation_changed', at: run.created_at, node_id: 'herdr', attempt_id: 'attempt-recover',
    executor_ref: 'recover-agent', observation_status: 'alive',
    host_ref: deriveHerdrHostRef('term-1'),
    detail: observationDetail({
      herdrStatus: 'working', agentName: 'recover-agent', paneId: 'recover-pane', seq: 3,
      workDirRoot: repoRoot, profileId: claudeProfile.executor_profile_id,
    }),
  });
  const fake = makeFakeHerdr({ statuses, paneStatuses, ...fakeExtras });
  const driver = startWorkflowDriver({
    repoRoot, runId, actor: { submitControl: fn => fn(store) }, herdrCli: fake.cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR69_PROFILE_HOME: repoRoot },
    herdrPollMs: 20, doneTimeoutMs: 60_000, herdrReadyTimeoutMs: 0,
  });
  t.after(async () => {
    await driver.stop();
    await rm(repoRoot, { recursive: true, force: true }).catch(() => {});
  });
  return { store, driver, fake };
}

test('DHR_69/E-2：fake paneGet 形态对齐 E-1 普通 shell pane', async () => {
  const shapesPath = fileURLToPath(new URL(
    '../../docs/modules/dh-relay/workspace/DHR_69/evidence/herdr-command-shapes.json', import.meta.url));
  const recorded = JSON.parse(await readFile(shapesPath, 'utf8'));
  const paneGet = recorded.probes.find(probe => probe.label === 'pane-get');
  assert.equal(recorded.assertions, 'pass');
  assert.equal(paneGet.exit_code, 0);
  assert.equal(paneGet.stdout_is_json, true);
  assert.equal(paneGet.agent_status_field_path, 'result.pane.agent_status');
  assert.equal(typeof paneGet.agent_status_value, 'string');
  assert.deepEqual(paneGet.result_keys, ['pane', 'type']);

  const fake = makeFakeHerdr();
  const value = fake.cli.paneGet('pane-1').value;
  assert.deepEqual(Object.keys(value).sort(), [...paneGet.result_keys].sort());
  assert.equal(typeof value.pane.agent_status, 'string');
  assert.equal(fake.paneGets, 1);
});

test('DHR_69/A adapter：假就绪 idle+pane blocked → launch_blocked，保留 handle，不关 pane', async () => {
  const fake = makeFakeHerdr({ statuses: ['idle'], paneStatuses: ['blocked'] });
  const launched = await launchHerdrAgent({
    cli: fake.cli, registryProfile: claudeProfile,
    runId: 'R001', nodeId: 'node-a', attemptId: 'attempt-false-ready', workDirRoot: 'C:/work', readyTimeoutMs: 0,
  });
  assert.equal(launched.ok, true);
  assert.equal(launched.launch_blocked, true);
  assert.equal(launched.handle.agent_name, 'herdr-attempt-false-ready');
  assert.equal(fake.paneKills, 0);
  assert.equal(launched.ready_observation.herdr_status, 'blocked');
  assert.equal(launched.ready_observation.agent_get, 'idle');
  assert.equal(launched.ready_observation.pane_get, 'blocked');
  assert.equal(launched.ready_observation.pane_get_called, true);
  assert.ok(fake.paneGets >= 1);
});

test('DHR_69/A 负例：Codex agent_not_ready 不读 pane get，argv/行为不变', async () => {
  const notReady = { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'exit:1:{"error":{"code":"agent_not_ready"}}', notReady: true };
  const fake = makeFakeHerdr({ agentStartResult: notReady, statuses: ['blocked'] });
  const launched = await launchHerdrAgent({
    cli: fake.cli, registryProfile: codexProfile,
    runId: 'R001', nodeId: 'node-a', attemptId: 'attempt-not-ready', workDirRoot: 'C:/work', readyTimeoutMs: 0,
  });
  assert.equal(launched.ok, true);
  assert.equal(launched.launch_blocked, true);
  assert.equal(fake.paneKills, 0);
  assert.equal(fake.paneGets, 0, 'agent get 不是 idle 时不得读 pane get');
  assert.equal(fake.calls.filter(([kind]) => kind === 'agentStart').length, 1);
});

test('DHR_69/D：非 idle 三态 paneGet 次数为 0；idle 才读 pane', async () => {
  for (const status of ['working', 'done', 'unknown']) {
    const fake = makeFakeHerdr({ statuses: [status] });
    const observed = await observeHerdrAgent({ cli: fake.cli, handle: { agent_name: 'a', pane_id: 'p' } });
    assert.equal(observed.observation.herdr_status, status);
    assert.equal(observed.observation.pane_get_called, false);
    assert.equal(observed.observation.pane_get, '-');
    assert.equal(fake.paneGets, 0, `${status} 不得读 pane get`);
  }
  const idle = makeFakeHerdr({ statuses: ['idle'], paneStatuses: ['unknown'] });
  const observedIdle = await observeHerdrAgent({ cli: idle.cli, handle: { agent_name: 'a', pane_id: 'p' } });
  assert.equal(observedIdle.observation.herdr_status, 'idle', 'pane unknown 不得覆盖 idle');
  assert.equal(observedIdle.observation.pane_get_called, true);
  assert.equal(idle.paneGets, 1);
});

test('DHR_69/A driver：假就绪恰写一次 blocked Attention，扣住指令，不写 HOST_LOST', async (t) => {
  const { store, root, driver, fake } = await runtimeFixture(t, {
    statuses: ['idle'], paneStatuses: ['blocked'],
  });
  t.after(() => driver.stop());
  // DHR_71（B-36）：这条等待原来用文件级 `until` 的 45s 默认预算，超时只说得出一句
  // `timeout:false-ready waiting_human`——说不出 45s 时节点停在哪。换成有界等待，
  // 目标事件不变（**等派生状态**，不是等断言值），只把上限按真实调用链算准、把超限现场打出来。
  //
  // 上限依据（B-36 冻结规则：按本用例实际走的 `launchHerdrAgent` 调用链，把每次 Herdr CLI
  // 调用的生产上限逐段相加 × 1.5）。夹具默认 `claudeProfile` → 走 Claude 的 `pane run` 链，
  // 恰六次 CLI 调用，每次的生产上限都是 herdr-cli.mjs:41 的通用 per-call `timeoutMs = 10_000`
  // （**没有** `agent start`，所以 60_000 那条不适用）：
  //     paneSplit + paneRun + agentList + agentRename + agentGet + paneGet
  //   = 6 × 10_000 = 60_000 → × 1.5 = **90_000**
  // 夹具 `herdrReadyTimeoutMs: 0`，所以 rename 恰一轮、就绪循环不等——链上没有重试项。
  // 保守上限，只负责把挂住变成上限内 fail + dump，不解释成因。
  const FALSE_READY_LAUNCH_BUDGET_MS = 90_000;
  await untilEvent(async () => (await store.readState()).node_states[0]?.status === 'waiting_human',
    { label: 'DHR_69/A false-ready waiting_human', timeoutMs: FALSE_READY_LAUNCH_BUDGET_MS,
      dump: () => dumpDriverScene({ store, fake }) });
  const attention = store.events.filter(event => event.kind === 'human_input_requested');
  assert.equal(attention.length, 1);
  const fields = parseDetail(attention[0].detail);
  assert.equal(fields.herdr_status, 'blocked');
  assert.equal(fields.agent_get, 'idle');
  assert.equal(fields.pane_get, 'blocked');
  assert.equal(attention[0].reason ?? null, null);
  assert.equal(store.events.some(event => event.reason === 'E_EXECUTOR_HOST_LOST'), false);
  assert.equal(fake.sent.length, 0);
  assert.equal(fake.paneKills, 0);
  assert.equal(store.events.some(event => event.kind === 'attempt_started'), true);
  assert.deepEqual(await readdir(join(root, 'results')), []);
  const changed = store.events.filter(event => event.kind === 'host_observation_changed');
  assert.ok(changed.length >= 1);
  const obs = parseDetail(changed[0].detail);
  assert.equal(obs.agent_get, 'idle');
  assert.equal(obs.pane_get, 'blocked');
  assert.equal(obs.herdr_status, 'blocked');
});

test('DHR_69/B：中途假 idle 不得写 RESULT_MISSING，不得结束 Attempt', async (t) => {
  const { store, driver, fake } = await runtimeFixture(t, {
    statuses: ['working', 'working', 'working', 'idle'], paneStatuses: ['blocked'],
    driver: { herdrReadyTimeoutMs: 10_000, doneTimeoutMs: 80 },
  });
  t.after(() => driver.stop());
  await until(() => store.events.some(event => event.kind === 'human_input_requested' && (event.reason ?? null) === null),
    'mid-run blocked attention');
  await sleep(120);
  assert.equal(store.events.some(event => event.reason === 'E_EXECUTOR_RESULT_MISSING'), false);
  const state = await store.readState();
  assert.notEqual(state.node_states[0]?.status, 'failed');
  assert.equal(fake.sent.length, 1, '启动正常时应先发出提交指令');
  const blocked = store.events.filter(event => event.kind === 'human_input_requested' && (event.reason ?? null) === null);
  assert.equal(blocked.length, 1);
});

test('DHR_69/C recovery：假就绪先观测再扣住，离开 blocked 后继续观测但不重发旧 Attempt', async (t) => {
  const { store, driver, fake } = await recoveryFixture(t, { statuses: ['idle'], paneStatuses: ['blocked'] });
  await until(() => store.events.some(event => event.kind === 'human_input_requested' && (event.reason ?? null) === null),
    'recovery blocked attention');
  assert.equal(fake.sent.length, 0, '观测为 blocked 时不得先发提交指令');
  fake.setStatuses(['working']);
  fake.setPaneStatuses(['unknown']);
  await until(() => store.events.some(event => event.kind === 'checkpoint_recorded'), 'working after recovery');
  assert.equal(fake.sent.length, 0, '恢复届不得重发旧 Attempt 的启动内容');
});

test('DHR_69/C recovery：观测失败不得把提交指令发出去（F-69-R2-01）', async (t) => {
  const { store, fake } = await recoveryFixture(t, {
    statuses: ['idle'], paneStatuses: ['blocked'], agentGetFailAfter: 1,
  });
  await until(() => fake.agentGets >= 2, 'probe then observe');
  await sleep(80);
  assert.equal(fake.sent.length, 0, 'observe 失败时不得发提交指令');
  assert.equal(store.events.some(event => event.reason === 'E_EXECUTOR_RESULT_MISSING'), false);
});

test('DHR_69/F：持续 idle∧blocked 升级一条可区分 Attention，不放行、不判失败，恢复后恰补发一次', async (t) => {
  const { store, driver, fake } = await runtimeFixture(t, {
    statuses: ['idle'], paneStatuses: ['blocked'],
    driver: { signalConflictMs: 40, doneTimeoutMs: 60_000 },
  });
  await until(() => store.events.filter(event => event.kind === 'human_input_requested').length === 1, 'initial attention');
  await until(() => store.events.some(event => /conflict_escalation=idle_blocked/.test(event.detail ?? '')), 'escalation');
  const attention = store.events.filter(event => event.kind === 'human_input_requested');
  assert.equal(attention.length, 2);
  assert.equal(attention[0].reason ?? null, null);
  assert.equal(attention[1].reason ?? null, null);
  const upgrade = parseDetail(attention[1].detail);
  assert.equal(upgrade.conflict_escalation, 'idle_blocked');
  assert.equal(upgrade.agent_get, 'idle');
  assert.equal(upgrade.pane_get, 'blocked');
  assert.equal(fake.sent.length, 0);
  assert.equal((await store.readState()).node_states[0]?.status, 'waiting_human');
  assert.equal(store.events.some(event => event.reason === 'E_EXECUTOR_RESULT_MISSING'), false);
  assert.equal(store.events.some(event => event.kind === 'attempt_failed'), false);

  fake.setStatuses(['working']);
  fake.setPaneStatuses(['unknown']);
  await until(() => fake.sent.length === 1, 'send after signals agree');
  assert.equal(fake.sent.length, 1);
});

test('DHR_69/F：mismatch 被 unknown 打断后必须重新计时，不得立即升级', async (t) => {
  const { store, driver, fake } = await runtimeFixture(t, {
    statuses: ['idle'], paneStatuses: ['blocked'],
    driver: { signalConflictMs: 80, doneTimeoutMs: 60_000 },
  });
  await until(() => store.events.filter(event => event.kind === 'human_input_requested').length === 1, 'initial attention');
  const paneGetsAfterLaunch = fake.paneGets;
  await until(() => fake.paneGets > paneGetsAfterLaunch, 'poll loop has started mismatch timer');
  fake.setStatuses(['unknown']);
  await until(() => store.events.some(event => event.observation_status === 'observation_lost'), 'left mismatch via unknown');
  await sleep(120);
  assert.equal(store.events.some(event => /conflict_escalation=idle_blocked/.test(event.detail ?? '')), false,
    'unknown 期间不得按旧计时升级');
  fake.setStatuses(['idle']);
  fake.setPaneStatuses(['blocked']);
  await sleep(40);
  assert.equal(store.events.some(event => /conflict_escalation=idle_blocked/.test(event.detail ?? '')), false,
    '回到 mismatch 后必须重新满 T，不得立即升级');
  await until(() => store.events.some(event => /conflict_escalation=idle_blocked/.test(event.detail ?? '')),
    'fresh T after resume');
});
