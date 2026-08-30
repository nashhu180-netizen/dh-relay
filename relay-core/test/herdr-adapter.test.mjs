import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { renderFocus } from '../cli/render.mjs';
import { makeHerdrCli } from '../runtime/executors/herdr/herdr-cli.mjs';
import { startWorkflowDriver } from '../runtime/workflow-driver.mjs';
import { createStore, openStore } from '../store/store.mjs';
import { HEADLESS_SSH_SCENARIO } from './helpers/headless-ssh-scenario.mjs';
import { HERDR_STATUS_MAPPING, attachHerdrAgent, captureHerdrResult, launchHerdrAgent, observationDetail, observeHerdrAgent, reconcileHerdrAgent, sendToHerdrAgent, stopHerdrAgent } from '../runtime/executors/herdr/herdr-executor.mjs';
import { loadExecutorProfiles, resolveProfile } from '../runtime/executors/herdr/profile-registry.mjs';
import { makeFakeHerdr } from './helpers/fake-herdr.mjs';
import { settledState } from './helpers/settled-state.mjs';

const profile = {
  executor_profile_id: 'herdr.codex.main', backend: 'herdr', product: 'codex-cli', command_alias: 'codex', account_alias: 'acct-codex-main',
  capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' },
  supported_platforms: ['win32'], headless_supported: true,
};

test('DHR_33 adapter：状态映射、句柄、附着与输入均不触碰 Store', async () => {
  const fake = makeFakeHerdr({ statuses: ['idle', 'working', 'blocked', 'done'], read: 'VERDICT: ok' });
  const launched = await launchHerdrAgent({ cli: fake.cli, registryProfile: profile, runId: 'R001-herdr-20260829', nodeId: 'node-a', attemptId: 'attempt-a', workDirRoot: 'C:/work' });
  assert.equal(launched.ok, true);
  assert.equal(launched.handle.work_dir_root, 'C:/work');
  assert.equal(launched.handle.agent_name, 'herdr-attempt-a');
  assert.equal(launched.blind, false);
  assert.deepEqual(HERDR_STATUS_MAPPING.blocked, { status: 'waiting_human', event: 'human_input_requested' });
  assert.equal(observationDetail({ herdrStatus: 'working', agentName: 'a', paneId: 'p', seq: 2, workDirRoot: 'C:/work', profileId: 'herdr.codex.main' }),
    'herdr_status=working;agent=a;pane=p;seq=2;work_dir_root=C:/work;profile=herdr.codex.main');
  assert.match(observationDetail({ herdrStatus: 'unknown', agentName: '-', paneId: '-', seq: null, workDirRoot: 'C:/work', profileId: 'herdr.codex.main' }), /;seq=-;/);
  assert.equal((await observeHerdrAgent({ cli: fake.cli, handle: launched.handle })).observation.herdr_status, 'working');
  assert.equal((await observeHerdrAgent({ cli: fake.cli, handle: launched.handle })).observation.herdr_status, 'blocked');
  const captured = await captureHerdrResult({ cli: fake.cli, handle: launched.handle, judge: text => text.includes('ok') ? { outcome: 'succeeded', reason: null, structured: { verdict: 'ok' } } : null });
  assert.equal(captured.verdict.outcome, 'succeeded');
  assert.deepEqual(await sendToHerdrAgent({ cli: fake.cli, handle: launched.handle, text: 'hello' }), { ok: true, value: {} });
  assert.equal(fake.sent[0].text, 'hello');
  assert.equal(attachHerdrAgent({ handle: launched.handle }).instruction, `herdr agent attach ${launched.handle.agent_name}`);
  assert.deepEqual(await stopHerdrAgent({ cli: fake.cli, handle: launched.handle }), { ok: true, value: {} });
  const failedLaunchFake = makeFakeHerdr({ agentStartResult: { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'agent-start-failed' } });
  const launchFailed = await launchHerdrAgent({ cli: failedLaunchFake.cli,
    registryProfile: profile, runId: 'R001-herdr-20260829', nodeId: 'node-a', attemptId: 'attempt-b', workDirRoot: 'C:/work' });
  assert.equal(launchFailed.ok, false);
  assert.equal(failedLaunchFake.paneKills, 1);
  assert.match(launchFailed.detail, /pane-kill=ok/);
});

test('DHR_67 adapter：Claude 固定 pane run→唯一识别→rename，Codex 保持 agent start', async () => {
  const claudeProfile = { ...profile, executor_profile_id: 'herdr.claude.main', product: 'claude-code', command_alias: 'claude' };
  const claudeFake = makeFakeHerdr();
  const claude = await launchHerdrAgent({ cli: claudeFake.cli, registryProfile: claudeProfile,
    runId: 'R001', nodeId: 'node-a', attemptId: 'attempt-claude', workDirRoot: 'C:/work', args: ['--test'] });
  assert.equal(claude.ok, true);
  assert.equal(claude.handle.agent_name, 'herdr-attempt-claude');
  assert.deepEqual(claudeFake.calls.slice(0, 4), [
    ['paneSplit', 'C:/work'],
    ['paneRun', 'pane-1', 'claude', ['--test']],
    ['agentList'],
    ['agentRename', 'pane-1', 'herdr-attempt-claude'],
  ]);

  const codexFake = makeFakeHerdr();
  const codex = await launchHerdrAgent({ cli: codexFake.cli, registryProfile: profile,
    runId: 'R001', nodeId: 'node-a', attemptId: 'attempt-codex', workDirRoot: 'C:/work', args: ['--x'] });
  assert.equal(codex.ok, true);
  assert.deepEqual(codexFake.calls.slice(0, 2), [
    ['paneSplit', 'C:/work'],
    ['agentStart', 'herdr-attempt-codex', 'codex', 'pane-1', ['--x']],
  ]);
  assert.equal(codexFake.calls.some(([kind]) => kind === 'paneRun' || kind === 'agentRename'), false);
});

test('DHR_67 adapter：Claude 零/多个、识别超时或 rename 失败仅关闭同一新 pane', async () => {
  const claudeProfile = { ...profile, executor_profile_id: 'herdr.claude.main', product: 'claude-code', command_alias: 'claude' };
  for (const { name, options, launchOptions } of [
    { name: 'zero', options: { listedAgents: [] }, launchOptions: { readyTimeoutMs: 0 } },
    { name: 'multiple', options: { listedAgents: [{ agent: 'claude', name: 'a', pane_id: 'pane-1' }, { agent: 'claude', name: 'b', pane_id: 'pane-1' }] }, launchOptions: { readyTimeoutMs: 0 } },
    { name: 'mixed-type', options: { listedAgents: [{ agent: 'claude', name: 'a', pane_id: 'pane-1' }, { agent: 'codex', name: 'b', pane_id: 'pane-1' }] }, launchOptions: { readyTimeoutMs: 0 } },
    { name: 'non-claude', options: { listedAgents: [{ agent: 'codex', name: 'other', pane_id: 'pane-1' }] }, launchOptions: { readyTimeoutMs: 0 } },
    { name: 'timeout', options: { listedAgents: [] }, launchOptions: { readyTimeoutMs: 1, readyPollMs: 1 } },
    { name: 'rename', options: { agentRenameResult: { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'rename-failed' } }, launchOptions: { readyTimeoutMs: 0 } },
  ]) {
    const fake = makeFakeHerdr(options);
    const launched = await launchHerdrAgent({ cli: fake.cli, registryProfile: claudeProfile,
      runId: 'R001', nodeId: 'node-a', attemptId: `attempt-${name}`, workDirRoot: 'C:/work', ...launchOptions });
    assert.equal(launched.ok, false, name);
    assert.equal(fake.paneKills, 1, name);
    assert.deepEqual(fake.calls.at(-1), ['paneKill', 'pane-1'], name);
  }
});

test('DHR_67 adapter：Claude 只接受同 pane 的唯一 Claude，且有界等待后续识别', async () => {
  const claudeProfile = { ...profile, executor_profile_id: 'herdr.claude.main', product: 'claude-code', command_alias: 'claude' };
  const delayed = makeFakeHerdr({ listedAgentSnapshots: [
    [{ agent: 'codex', name: 'other-pane', pane_id: 'pane-other' }],
    [{ agent: 'claude', name: 'detected-agent', pane_id: 'pane-1', terminal_id: 'term-1' }],
  ] });
  const launched = await launchHerdrAgent({ cli: delayed.cli, registryProfile: claudeProfile,
    runId: 'R001', nodeId: 'node-a', attemptId: 'attempt-delayed', workDirRoot: 'C:/work', readyTimeoutMs: 20, readyPollMs: 1 });
  assert.equal(launched.ok, true);
  assert.deepEqual(delayed.calls.slice(0, 5), [
    ['paneSplit', 'C:/work'],
    ['paneRun', 'pane-1', 'claude', []],
    ['agentList'],
    ['agentList'],
    ['agentRename', 'pane-1', 'herdr-attempt-delayed'],
  ]);
});

test('DHR_33 adapter：unknown 经 pane 复核区分 observation_lost 与 host_lost，均不造 reason code', async () => {
  const livePane = makeFakeHerdr({ statuses: ['unknown'], paneAlive: true });
  const missingPane = makeFakeHerdr({ statuses: ['unknown'], paneAlive: false, agentAlive: false, missing: true });
  const transient = { cli: {
    agentGet: () => ({ ok: false, missing: false }),
    paneGet: () => ({ ok: false, missing: false }),
  } };
  const handle = { agent_name: 'a', pane_id: 'p' };
  assert.equal((await reconcileHerdrAgent({ cli: livePane.cli, handle })).kind, 'observation_lost');
  assert.equal((await reconcileHerdrAgent({ cli: missingPane.cli, handle })).kind, 'host_lost');
  assert.equal((await reconcileHerdrAgent({ cli: transient.cli, handle })).kind, 'observation_lost');
});

test('DHR_33 profile registry：只读校验、未命中 profile 保持 null', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr33-registry-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = join(root, 'executor-profiles.json');
  await writeFile(path, JSON.stringify({ profiles: [profile] }), 'utf8');
  const loaded = await loadExecutorProfiles({ registryPath: path });
  assert.equal(loaded.ok, true);
  assert.equal(resolveProfile(loaded.registry, profile.executor_profile_id).command_alias, 'codex');
  assert.equal(resolveProfile(loaded.registry, 'herdr.codex.absent'), null);
});

test('DHR_33 focus：只渲染事件既有字段，无观测降级', () => {
  const event = { node_id: 'node-a', at: '2026-08-29T00:00:00Z', observation_status: 'observation_lost', executor_ref: 'relay-a', detail: 'herdr_status=unknown' };
  const text = renderFocus(event);
  for (const value of Object.values(event)) assert.ok(text.includes(value));
  assert.ok(text.includes('herdr agent attach relay-a'));
  assert.equal(text.split('\n').find(line => line.startsWith('attach: ')),
    `attach: ${attachHerdrAgent({ handle: { agent_name: 'relay-a', pane_id: 'pane-a' } }).instruction}`);
  assert.ok(!renderFocus({ ...event, executor_ref: null }).includes('attach:'));
  assert.equal(renderFocus(null), '无宿主观测');
});

test('DHR_33 herdr-cli：文件状态可执行桩逐字接收六个动词参数并拆 result 信封', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr33-herdr-bin-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = join(root, 'state.json');
  await writeFile(statePath, JSON.stringify({ responses: {
    'pane split': { pane: { pane_id: 'p1' } }, 'agent start': { agent: { terminal_id: 't1' } },
    'agent get': { agent: { agent_status: 'working', state_change_seq: 3 } }, 'agent read': {},
    'agent send-keys': {}, 'agent prompt': {}, 'pane get': { pane: { pane_id: 'p1' } }, 'pane close': {},
    'pane run': {}, 'agent list': { agents: [{ agent: 'claude', name: 'detected', pane_id: 'p1' }] }, 'agent rename': {}, '--version': {},
  } }), 'utf8');
  const bin = fileURLToPath(new URL('./helpers/fake-herdr-bin.mjs', import.meta.url));
  const cli = makeHerdrCli({ herdrBin: process.execPath, herdrArgs: [bin, statePath] });
  assert.equal(cli.paneSplit({ cwd: 'C:/work' }).value.pane.pane_id, 'p1');
  assert.equal(cli.agentStart({ name: 'a', kind: 'codex', paneId: 'p1', args: ['--x'] }).value.agent.terminal_id, 't1');
  assert.equal(cli.agentGet('a').value.agent.agent_status, 'working');
  assert.ok(cli.agentRead('a').ok);
  assert.ok(cli.agentSendKeys('a', ['enter']).ok);
  assert.ok(cli.agentPrompt('a', 'hello').ok);
  assert.ok(cli.paneGet('p1').ok);
  assert.ok(cli.paneKill('p1').ok);
  assert.ok(cli.version().ok);
  assert.ok(cli.paneRun({ paneId: 'p1', command: 'claude', args: ['--x'] }).ok);
  assert.equal(cli.agentList().value.agents[0].pane_id, 'p1');
  assert.ok(cli.agentRename({ target: 'p1', name: 'renamed' }).ok);
  const calls = JSON.parse(await readFile(statePath, 'utf8')).calls;
  assert.deepEqual(calls[0], ['pane', 'split', '--current', '--no-focus', '--direction', 'right', '--cwd', 'C:/work']);
  assert.deepEqual(calls[1], ['agent', 'start', 'a', '--kind', 'codex', '--pane', 'p1', '--', '--x']);
  assert.deepEqual(calls[2], ['agent', 'get', 'a']);
  assert.deepEqual(calls[3], ['agent', 'read', 'a', '--source', 'recent-unwrapped', '--lines', '120']);
  assert.deepEqual(calls[4], ['agent', 'send-keys', 'a', 'enter']);
  assert.deepEqual(calls[5], ['agent', 'prompt', 'a', 'hello']);
  assert.deepEqual(calls[6], ['pane', 'get', 'p1']);
  assert.deepEqual(calls[7], ['pane', 'close', 'p1']);
  assert.deepEqual(calls[8], ['--version']);
  assert.deepEqual(calls[9], ['pane', 'run', 'p1', 'claude', '--x']);
  assert.deepEqual(calls[10], ['agent', 'list']);
  assert.deepEqual(calls[11], ['agent', 'rename', 'p1', 'renamed']);
});

test('DHR_33 herdr-cli：超时与明确 not-found 分别保留 transient/missing 语义', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr33-herdr-bin-error-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = join(root, 'state.json');
  const bin = fileURLToPath(new URL('./helpers/fake-herdr-bin.mjs', import.meta.url));
  await writeFile(statePath, JSON.stringify({ exit_code: 1, stderr: 'agent not found' }), 'utf8');
  assert.equal(makeHerdrCli({ herdrBin: process.execPath, herdrArgs: [bin, statePath] }).agentGet('gone').missing, true);
  await writeFile(statePath, JSON.stringify({ delay_ms: 50 }), 'utf8');
  const timeout = makeHerdrCli({ herdrBin: process.execPath, herdrArgs: [bin, statePath], timeoutMs: 1 }).agentGet('slow');
  assert.equal(timeout.ok, false);
  assert.equal(timeout.missing, false);
});

const runtimeSleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function runtimeUntil(check, label, timeoutMs = 10_000) {
  const end = Date.now() + timeoutMs;
  while (!(await check())) {
    if (Date.now() > end) throw new Error(`timeout:${label}`);
    await runtimeSleep(5);
  }
}

async function runtimeFixture(t, statuses, options = {}) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr33-runtime-'));
  const runId = 'R001-herdr-runtime-20260829';
  const profileRef = options.profileRef ?? 'herdr.codex.test';
  const run = { protocol: 'relay.run/v2', run_id: runId, workflow_name: 'relay/basic-agent-task@1', summary: 'herdr runtime', trigger: 'system', created_at: '2026-08-29T00:00:00Z', nodes: [{ node_id: 'herdr', title: 'herdr', role: '执行', required: false, depends_on: [], executor_profiles: [{ kind: 'herdr-agent', ref: profileRef }] }] };
  const root = join(repoRoot, '.dh-relay', runId);
  await mkdir(root, { recursive: true });
  const registryPath = join(repoRoot, 'profiles.json');
  const configPath = join(repoRoot, 'profile.json');
  await writeFile(configPath, JSON.stringify({ model: 'test-model' }), 'utf8');
  const registryProfile = options.registryProfile ?? { executor_profile_id: 'herdr.codex.test', backend: 'herdr', product: 'codex-cli', command_alias: 'codex', account_alias: 'acct-test', capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' }, supported_platforms: ['win32'], headless_supported: true, config_fingerprint_rule: { kind: 'file-exists', path_template: '${DHR33_PROFILE_HOME}/profile.json', fields: [{ pointer: '/model', classification: 'nonsecret' }] } };
  await writeFile(registryPath, JSON.stringify({ profiles: [registryProfile] }), 'utf8');
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: run.created_at });
  const fake = makeFakeHerdr({ statuses, ...options.fake });
  const driver = startWorkflowDriver({ repoRoot, runId, actor: { submitControl: fn => fn(store) }, herdrCli: fake.cli, herdrRegistryPath: registryPath, profileEnvironment: { DHR33_PROFILE_HOME: repoRoot }, herdrPollMs: 2, observationLostMs: 5, doneTimeoutMs: 5, ...options.driver });
  t.after(async () => { await driver.stop(); await rm(repoRoot, { recursive: true, force: true }); });
  return { store, root, driver, fake };
}

test('DHR_33 driver #1/#2：心跳逐次落账，blocked 第二沿与重放持久', async (t) => {
  const { store, root, driver } = await runtimeFixture(t, ['idle', 'working', 'working', 'blocked', 'working', 'blocked']);
  t.after(() => driver.stop());
  await runtimeUntil(() => store.events.filter(event => event.kind === 'human_input_requested').length === 2, 'two blocked edges');
  const checkpoints = store.events.filter(event => event.kind === 'checkpoint_recorded');
  assert.equal(checkpoints.length, 3);
  assert.equal(new Set(checkpoints.map(event => event.detail)).size, checkpoints.length);
  assert.deepEqual(await (await openStore({ root })).readState(), await store.readState());
});

test('DHR_33 driver #3/#5：done 有界、判定成功与双亡 HOST_LOST', async (t) => {
  const noJudge = await runtimeFixture(t, ['idle', 'done'], { driver: { doneTimeoutMs: 10, herdrPollMs: 2 } });
  t.after(() => noJudge.driver.stop());
  await noJudge.driver.done;
  assert.equal((await settledState(noJudge.root)).node_states[0].status, 'waiting_human');
  const judged = await runtimeFixture(t, ['idle', 'done'], { driver: { herdrJudge: () => ({ outcome: 'succeeded', reason: null, structured: { verdict: 'ok' } }) } });
  t.after(() => judged.driver.stop());
  await runtimeUntil(() => judged.store.events.some(event => event.kind === 'attempt_succeeded'), 'judge result');
  await judged.driver.done;
  assert.equal((await judged.store.readState()).node_states[0].status, 'succeeded');
  const judgedReceipt = judged.store.events.find(event => event.kind === 'attempt_succeeded').detail.replace(/^receipt:/, '');
  assert.equal(JSON.parse(await readFile(join(judged.root, 'results', `${judgedReceipt}.json`), 'utf8')).executor_kind, 'herdr-agent');
  const idleJudged = await runtimeFixture(t, ['idle', 'idle'], { driver: { herdrJudge: () => ({ outcome: 'succeeded', reason: null, structured: { verdict: 'idle-ok' } }) } });
  t.after(() => idleJudged.driver.stop());
  await idleJudged.driver.done;
  const idleReceipt = idleJudged.store.events.find(event => event.kind === 'attempt_succeeded').detail.replace(/^receipt:/, '');
  assert.equal(JSON.parse(await readFile(join(idleJudged.root, 'results', `${idleReceipt}.json`), 'utf8')).executor_kind, 'herdr-agent');
  const missing = await runtimeFixture(t, ['unknown'], { fake: { agentAlive: false, paneAlive: false, missing: true } });
  t.after(() => missing.driver.stop());
  await runtimeUntil(() => missing.store.events.some(event => event.kind === 'attempt_failed'), 'host lost');
  assert.equal(missing.store.events.find(event => event.kind === 'attempt_failed').reason, 'E_EXECUTOR_HOST_LOST');
});

test('DHR_33 driver：blocked 后 send、恢复心跳；观测断不落 Result', async (t) => {
  const { store, driver, fake } = await runtimeFixture(t, ['idle', 'blocked', 'working', 'working']);
  t.after(() => driver.stop());
  await runtimeUntil(() => store.events.some(event => event.kind === 'human_input_requested'), 'blocked attention');
  await sendToHerdrAgent({ cli: fake.cli, handle: { agent_name: 'herdr-runtime', pane_id: 'pane-1' }, text: 'continue' });
  await runtimeUntil(() => store.events.some(event => event.kind === 'checkpoint_recorded'), 'working after send');
  assert.equal(fake.sent.at(-1).text, 'continue');
  assert.match(store.events.filter(event => event.kind === 'host_observation_changed').at(-1).detail, /herdr_status=working/);
  const lost = await runtimeFixture(t, ['idle', 'unknown', 'unknown'], { driver: { observationLostMs: 100 } });
  t.after(() => lost.driver.stop());
  await runtimeUntil(() => lost.store.events.some(event => event.observation_status === 'observation_lost'), 'observation lost');
  assert.equal(lost.store.events.some(event => event.kind === 'attempt_failed' || event.kind === 'attempt_orphaned'), false);
});

test('DHR_33 driver：stop 撞 launch 窗口仍杀 pane，失败写 killed Result 且不造 Attention', async (t) => {
  let driver;
  const { store, fake, driver: started } = await runtimeFixture(t, ['idle'], { fake: {
    paneKillResult: { ok: false, detail: 'close-failed' }, onAgentStart: () => driver.stop(),
  } });
  driver = started;
  await driver.done;
  assert.equal(fake.paneKills, 1);
  const failed = store.events.find(event => event.kind === 'attempt_failed');
  assert.equal(failed?.reason, 'E_EXECUTOR_KILLED');
  assert.equal(store.events.some(event => event.kind === 'human_input_requested'), false);
});

test('DHR_67 driver：Claude adapter 启动失败保留既有 Attempt，进入人工处理且不造 Result', async (t) => {
  const registryProfile = { executor_profile_id: 'herdr.claude.test', backend: 'herdr', product: 'claude-code', command_alias: 'claude', account_alias: 'acct-test', capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' }, supported_platforms: ['win32'], headless_supported: true, config_fingerprint_rule: { kind: 'file-exists', path_template: '${DHR33_PROFILE_HOME}/profile.json', fields: [{ pointer: '/model', classification: 'nonsecret' }] } };
  const { store, root, driver, fake } = await runtimeFixture(t, ['idle'], { profileRef: 'herdr.claude.test', registryProfile,
    fake: { agentRenameResult: { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'rename-failed' } } });
  await runtimeUntil(() => store.events.some(event => event.kind === 'human_input_requested'), 'claude launch attention');
  await driver.done;
  assert.equal((await settledState(root)).node_states[0].status, 'waiting_human');
  assert.equal(store.events.some(event => event.kind === 'attempt_started'), true);
  assert.equal(store.events.some(event => event.kind === 'attempt_succeeded' || event.kind === 'attempt_failed'), false);
  assert.deepEqual(await readdir(join(root, 'results')), []);
  assert.equal(fake.paneKills, 1);
});

test('DHR_33 driver：idle 超阈值单次 Attention 后停止轮询', async (t) => {
  const { store, driver, fake } = await runtimeFixture(t, ['idle'], { driver: { doneTimeoutMs: 10, herdrPollMs: 2 } });
  t.after(() => driver.stop());
  await runtimeUntil(() => store.events.some(event => event.kind === 'human_input_requested'), 'idle attention');
  await driver.done;
  assert.equal(store.events.filter(event => event.kind === 'human_input_requested').length, 1);
  assert.equal(fake.paneKills, 0);
  assert.equal(fake.agentReads, 0);
});

test('DHR_33 driver #4/#7/#9：观测断单次升级、恢复后再升级；SSH 桩不冒充', async (t) => {
  const { store, driver } = await runtimeFixture(t, ['idle', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'working', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown']);
  t.after(() => driver.stop());
  await runtimeUntil(() => store.events.filter(event => event.kind === 'human_input_requested').length >= 2, 'loss attention twice');
  const lost = store.events.filter(event => event.kind === 'host_observation_changed' && event.observation_status === 'observation_lost');
  assert.equal(lost.length, 2);
  assert.match(lost[0].detail, /;profile=herdr\.codex\.test$/);
  assert.equal(HEADLESS_SSH_SCENARIO.note, 'Linux 真实 SSH 证据延后（B-22①），桩不冒充');
});

test('DHR_33 driver #7/#8：成功观测的非 ready 是盲区；未知 profile 零事件', async (t) => {
  const blind = await launchHerdrAgent({ cli: makeFakeHerdr({ statuses: ['unknown'] }).cli, registryProfile: profile,
    runId: 'R001', nodeId: 'n', attemptId: 'a', workDirRoot: 'C:/work', readyTimeoutMs: 1, readyPollMs: 1 });
  assert.equal(blind.ok, true);
  assert.equal(blind.blind, true);
  const unknown = await runtimeFixture(t, ['working'], { profileRef: 'herdr.codex.absent' });
  await unknown.driver.done;
  assert.deepEqual(unknown.store.events.map(event => event.kind), ['run_created']);
});

async function recoveryFixture(t, fakeOptions) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr33-recovery-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const runId = 'R001-herdr-recovery-20260829';
  const run = { protocol: 'relay.run/v2', run_id: runId, workflow_name: 'relay/basic-agent-task@1', summary: 'recovery', trigger: 'system', created_at: '2026-08-29T00:00:00Z', nodes: [{ node_id: 'herdr', title: 'herdr', role: '执行', required: false, depends_on: [], executor_profiles: [{ kind: 'herdr-agent', ref: profile.executor_profile_id }] }] };
  const root = join(repoRoot, '.dh-relay', runId);
  await mkdir(root, { recursive: true });
  const registryPath = join(repoRoot, 'profiles.json');
  await writeFile(registryPath, JSON.stringify({ profiles: [profile] }), 'utf8');
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: run.created_at });
  await store.appendEvent({ kind: 'node_started', at: run.created_at, node_id: 'herdr' });
  await store.registerReceipt({ receipt_id: 'rcpt-recover', attempt_id: 'attempt-recover', node_id: 'herdr', at: run.created_at });
  if (!fakeOptions.withoutRef) await store.appendEvent({ kind: 'host_observation_changed', at: run.created_at, node_id: 'herdr', attempt_id: 'attempt-recover', executor_ref: 'recover-agent', observation_status: 'alive', detail: observationDetail({ herdrStatus: 'working', agentName: 'recover-agent', paneId: 'recover-pane', seq: 3, workDirRoot: repoRoot, profileId: profile.executor_profile_id }) });
  const fake = makeFakeHerdr(fakeOptions);
  const driver = startWorkflowDriver({ repoRoot, runId, actor: { submitControl: fn => fn(store) }, herdrCli: fake.cli, herdrRegistryPath: registryPath, herdrPollMs: 2 });
  return { store, driver };
}

test('DHR_33 driver #10：恢复届按账上 ref 判 orphaned 或接管同一 attempt', async (t) => {
  const gone = await recoveryFixture(t, { agentAlive: false, paneAlive: false, missing: true });
  await runtimeUntil(() => gone.store.events.some(event => event.kind === 'attempt_orphaned'), 'orphaned recovery');
  await gone.driver.done;
  assert.equal(gone.store.events.find(event => event.kind === 'attempt_orphaned').reason, 'E_EXECUTOR_ORPHANED');
  const live = await recoveryFixture(t, { statuses: ['working'] });
  await runtimeUntil(() => live.store.events.some(event => event.kind === 'checkpoint_recorded'), 'take over recovery');
  await live.driver.stop();
  assert.equal(live.store.events.filter(event => event.kind === 'attempt_started').length, 1);
});

test('DHR_33 driver：恢复届 transient 探测与无 ref 都只落 observation_lost', async (t) => {
  const transient = await recoveryFixture(t, { agentAlive: false, missing: false });
  await transient.driver.done;
  assert.equal(transient.store.events.some(event => event.kind === 'attempt_orphaned'), false);
  assert.ok(transient.store.events.some(event => event.observation_status === 'observation_lost'));
  const noRef = await recoveryFixture(t, { withoutRef: true });
  await noRef.driver.done;
  assert.equal(noRef.store.events.some(event => event.kind === 'attempt_orphaned'), false);
  assert.ok(noRef.store.events.some(event => event.observation_status === 'observation_lost'));
});
