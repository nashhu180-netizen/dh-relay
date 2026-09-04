import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { renderFocus } from '../cli/render.mjs';
import { HERDR_START_TIMEOUT_MS, makeHerdrCli } from '../runtime/executors/herdr/herdr-cli.mjs';
import { startWorkflowDriver } from '../runtime/workflow-driver.mjs';
import { createStore, openStore } from '../store/store.mjs';
import { HEADLESS_SSH_SCENARIO } from './helpers/headless-ssh-scenario.mjs';
import { HERDR_STATUS_MAPPING, attachHerdrAgent, captureHerdrResult, launchHerdrAgent, observationDetail, observeHerdrAgent, reconcileHerdrAgent, sendToHerdrAgent, stopHerdrAgent } from '../runtime/executors/herdr/herdr-executor.mjs';
import { loadExecutorProfiles, resolveProfile } from '../runtime/executors/herdr/profile-registry.mjs';
import { dumpDriverScene, untilEvent, withDeadline } from './helpers/bounded-wait.mjs';
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
    'herdr_status=working;agent=a;pane=p;seq=2;work_dir_root=C:/work;profile=herdr.codex.main;agent_get=-;pane_get=-');
  assert.match(observationDetail({ herdrStatus: 'unknown', agentName: '-', paneId: '-', seq: null, workDirRoot: 'C:/work', profileId: 'herdr.codex.main' }), /;seq=-;/);
  assert.equal((await observeHerdrAgent({ cli: fake.cli, handle: launched.handle })).observation.herdr_status, 'working');
  assert.equal((await observeHerdrAgent({ cli: fake.cli, handle: launched.handle })).observation.herdr_status, 'blocked');
  const captured = await captureHerdrResult({ cli: fake.cli, handle: launched.handle, judge: text => text.includes('ok') ? { outcome: 'succeeded', reason: null, structured: { verdict: 'ok' } } : null });
  assert.equal(captured.verdict.outcome, 'succeeded');
  // DHR_68/D：真实 `agent prompt` 的 result 是 `{agent:{…},type}`，不是空对象、也不是只有 type。
  const prompted = await sendToHerdrAgent({ cli: fake.cli, handle: launched.handle, text: 'hello' });
  assert.equal(prompted.ok, true);
  assert.deepEqual(Object.keys(prompted.value).sort(), ['agent', 'type']);
  assert.equal(fake.sent[0].text, 'hello');
  assert.equal(attachHerdrAgent({ handle: launched.handle }).instruction, `herdr agent attach ${launched.handle.agent_name}`);
  assert.deepEqual(await stopHerdrAgent({ cli: fake.cli, handle: launched.handle }), { ok: true, value: { type: 'ok' } });
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
  const driver = startWorkflowDriver({ repoRoot, runId, actor: { submitControl: fn => fn(store) }, herdrCli: fake.cli, herdrRegistryPath: registryPath, profileEnvironment: { DHR33_PROFILE_HOME: repoRoot }, herdrPollMs: 20, observationLostMs: 50, doneTimeoutMs: 50, ...options.driver });
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

test('DHR_33 driver #3/#5：done 有界、判定成功与双亡 HOST_LOST', { skip: 'F-3520 → DHR_72：herdrJudge 直写 Result 通路已被 DHR_64 删除，用例待按 Receipt-bound 语义重写' }, async (t) => {
  const noJudge = await runtimeFixture(t, ['idle', 'done'], { driver: { doneTimeoutMs: 100, herdrPollMs: 20 } });
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
  const lost = await runtimeFixture(t, ['idle', 'unknown', 'unknown'], { driver: { observationLostMs: 1000 } });
  t.after(() => lost.driver.stop());
  await runtimeUntil(() => lost.store.events.some(event => event.observation_status === 'observation_lost'), 'observation lost');
  assert.equal(lost.store.events.some(event => event.kind === 'attempt_failed' || event.kind === 'attempt_orphaned'), false);
});

test('DHR_33 driver：stop 撞 launch 窗口仍杀 pane，失败写 killed Result 且不造 Attention', { skip: 'F-3520 → DHR_72：现役 driver 在 stop 撞 launch 窗口时写 human_input_requested 而非 attempt_failed(E_EXECUTOR_KILLED)，用例待重写' }, async (t) => {
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
  const { store, driver, fake } = await runtimeFixture(t, ['idle'], { driver: { doneTimeoutMs: 100, herdrPollMs: 20 } });
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
  assert.match(lost[0].detail, /;profile=herdr\.codex\.test;/);
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
  const driver = startWorkflowDriver({ repoRoot, runId, actor: { submitControl: fn => fn(store) }, herdrCli: fake.cli, herdrRegistryPath: registryPath, herdrPollMs: 20 });
  return { store, driver };
}

test('DHR_33 driver #10：恢复届按账上 ref 判 orphaned 或接管同一 attempt', { skip: 'F-3520 → DHR_72：DHR_64 起恢复届探活 missing 写 human_input_requested(E_EXECUTOR_HOST_LOST) 而非 attempt_orphaned(E_EXECUTOR_ORPHANED)，用例待按 Receipt-bound 语义重写' }, async (t) => {
  // 上限依据：恢复届的探活是 `herdrCli.agentGet` 一次调用，生产上限是 herdr-cli 的
  // per-call `timeoutMs = 10_000`（herdr-cli.mjs:41）——**不是** `HERDR_START_TIMEOUT_MS`
  // （那只给 `agent start` 用，恢复届不 launch）。原来的 10s 预算等于 0 余量，Store 落盘
  // 与事件重放的时间全没算进去；按「生产上限 + 50%」取 15s。
  const RECOVERY_PROBE_BUDGET_MS = 15_000;
  const gone = await recoveryFixture(t, { agentAlive: false, paneAlive: false, missing: true });
  // `recoveryFixture` 只登记了 `rm(repoRoot)`、没登记 stop，而 after 钩子按登记顺序跑——
  // 所以 stop 只能用 `finally` 兜在用例体里，不能用 `t.after`（那会排在 rm 之后，删目录
  // 正好撞上仍在写盘的 driver → F-7103 的挂死）。夹具本身一个字不动。
  // 另：`recoveryFixture` 不暴露 fake，所以现场只打事件序列与派生状态。
  const goneScene = () => dumpDriverScene({ store: gone.store });
  try {
    await untilEvent(() => gone.store.events.some(event => event.kind === 'attempt_orphaned'),
      { label: '#10 恢复届 attempt_orphaned', timeoutMs: RECOVERY_PROBE_BUDGET_MS, dump: goneScene });
    // driver.done 的生产上限是 driver 自己的 `doneTimeoutMs = 60_000`（workflow-driver.mjs:33）。
    await withDeadline(gone.driver.done, { label: '#10 gone.driver.done', timeoutMs: 60_000, dump: goneScene });
  } finally {
    await gone.driver.stop();
  }
  assert.equal(gone.store.events.find(event => event.kind === 'attempt_orphaned').reason, 'E_EXECUTOR_ORPHANED');
  const live = await recoveryFixture(t, { statuses: ['working'] });
  try {
    await untilEvent(() => live.store.events.some(event => event.kind === 'checkpoint_recorded'),
      { label: '#10 接管同一 attempt 首条 checkpoint_recorded', timeoutMs: RECOVERY_PROBE_BUDGET_MS,
        dump: () => dumpDriverScene({ store: live.store }) });
  } finally {
    await live.driver.stop();
  }
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

// ---------------------------------------------------------------------------
// DHR_68：真实宿主接线。三条缺陷均由 DHR_35 的真实 Windows 实录暴露，fake 之所以
// 看不见，是因为它当时的返回形态与真实 herdr 不一致（见验收项 D 与
// workspace/DHR_68/evidence/real-herdr-command-shapes.json）。
// ---------------------------------------------------------------------------

test('DHR_68/A adapter：启动超时先对账——agent 已建成沿用 handle，未建成才关同一 pane，且永不重发启动', async () => {
  // 真实形态：Windows 上 spawnSync 超时命中 child.error.code=ETIMEDOUT（DHR_35 实测 `spawn:ETIMEDOUT`）。
  const timedOut = { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'spawn:ETIMEDOUT', timedOut: true };

  const alive = makeFakeHerdr({ agentStartResult: timedOut, agentAlive: true, statuses: ['idle'] });
  const kept = await launchHerdrAgent({ cli: alive.cli, registryProfile: profile,
    runId: 'R001', nodeId: 'node-a', attemptId: 'attempt-timeout-alive', workDirRoot: 'C:/work' });
  assert.equal(kept.ok, true, 'timeout+agent alive must keep the launch');
  assert.equal(kept.handle.agent_name, 'herdr-attempt-timeout-alive');
  assert.equal(kept.handle.pane_id, 'pane-1');
  assert.equal(alive.paneKills, 0, 'must not kill a pane that already hosts a live agent');
  assert.equal(alive.calls.filter(([kind]) => kind === 'agentStart').length, 1, 'reconcile must never re-issue agent start');

  const gone = makeFakeHerdr({ agentStartResult: timedOut, agentAlive: false, missing: true });
  const closed = await launchHerdrAgent({ cli: gone.cli, registryProfile: profile,
    runId: 'R001', nodeId: 'node-a', attemptId: 'attempt-timeout-dead', workDirRoot: 'C:/work' });
  assert.equal(closed.ok, false);
  assert.equal(gone.paneKills, 1);
  assert.deepEqual(gone.calls.at(-1), ['paneKill', 'pane-1'], 'only the pane this launch created may be closed');
  assert.equal(gone.calls.filter(([kind]) => kind === 'agentStart').length, 1);

  // 非超时失败保持既有语义：即便 agent 恰好存在也不对账、照旧关闭同一新 pane。
  const plain = makeFakeHerdr({ agentStartResult: { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'agent-start-failed' }, agentAlive: true });
  const plainLaunch = await launchHerdrAgent({ cli: plain.cli, registryProfile: profile,
    runId: 'R001', nodeId: 'node-a', attemptId: 'attempt-plain-fail', workDirRoot: 'C:/work' });
  assert.equal(plainLaunch.ok, false);
  assert.equal(plain.paneKills, 1);

  // Claude 分支的启动调用是 pane run；超时对账走 agent list 按新 pane 过滤。
  const claudeProfile = { ...profile, executor_profile_id: 'herdr.claude.main', product: 'claude-code', command_alias: 'claude' };
  const claudeAlive = makeFakeHerdr({ paneRunResult: { ...timedOut }, statuses: ['idle'] });
  const claudeKept = await launchHerdrAgent({ cli: claudeAlive.cli, registryProfile: claudeProfile,
    runId: 'R001', nodeId: 'node-a', attemptId: 'attempt-claude-timeout', workDirRoot: 'C:/work' });
  assert.equal(claudeKept.ok, true);
  assert.equal(claudeAlive.paneKills, 0);
  assert.equal(claudeAlive.calls.filter(([kind]) => kind === 'paneRun').length, 1, 'reconcile must never re-issue pane run');
});

test('DHR_68/A herdr-cli：启动专用超时与其余动词分离，超时带 timedOut 语义位', async (t) => {
  assert.equal(HERDR_START_TIMEOUT_MS, 60_000, '启动专用超时冻结为 60 秒（B-32 用户裁决）');
  const root = await mkdtemp(join(tmpdir(), 'dhr68-herdr-bin-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = join(root, 'state.json');
  const bin = fileURLToPath(new URL('./helpers/fake-herdr-bin.mjs', import.meta.url));
  await writeFile(statePath, JSON.stringify({ delay_ms: 120, responses: { 'agent start': { agent: { terminal_id: 't1' } } } }), 'utf8');

  // 通用上限 30ms：agent get 超时；agent start 因为用启动专用上限（默认 60s）而通过。
  const cli = makeHerdrCli({ herdrBin: process.execPath, herdrArgs: [bin, statePath], timeoutMs: 30 });
  const slowGet = cli.agentGet('slow');
  assert.equal(slowGet.ok, false);
  assert.equal(slowGet.timedOut, true, 'Windows 上超时命中 child.error.code=ETIMEDOUT，也必须标 timedOut');
  assert.equal(slowGet.missing, false);
  assert.equal(cli.agentStart({ name: 'a', kind: 'codex', paneId: 'p1' }).ok, true, 'agent start 不受通用 10s 上限约束');

  // 启动专用上限本身可被压低，证明它确实被 agent start 使用。
  const tight = makeHerdrCli({ herdrBin: process.execPath, herdrArgs: [bin, statePath], startTimeoutMs: 20 });
  const startTimeout = tight.agentStart({ name: 'a', kind: 'codex', paneId: 'p1' });
  assert.equal(startTimeout.ok, false);
  assert.equal(startTimeout.timedOut, true);

  // agent_not_ready 是启动期 blocked，不是 missing。
  await writeFile(statePath, JSON.stringify({ exit_code: 1,
    stderr: '{"error":{"code":"agent_not_ready","message":"agent a is not ready"},"id":"cli:agent:start"}' }), 'utf8');
  const notReady = makeHerdrCli({ herdrBin: process.execPath, herdrArgs: [bin, statePath] })
    .agentStart({ name: 'a', kind: 'codex', paneId: 'p1' });
  assert.equal(notReady.ok, false);
  assert.equal(notReady.notReady, true);
  assert.equal(notReady.missing, false);
});

test('DHR_68/B：pane run 不解 JSON，Claude 在真实空 stdout 形态下仍完成识别与 rename', async (t) => {
  // fake 的默认值就是真实形态：exit 0 + 空 stdout（对照 evidence/real-herdr-command-shapes.json）。
  const shapeProbe = makeFakeHerdr();
  assert.deepEqual(shapeProbe.cli.paneRun({ paneId: 'pane-1', command: 'claude', args: [] }), { ok: true, value: '' });

  const claudeProfile = { ...profile, executor_profile_id: 'herdr.claude.main', product: 'claude-code', command_alias: 'claude' };
  const fake = makeFakeHerdr({ paneRunResult: { ok: true, value: '' }, statuses: ['idle'] });
  const launched = await launchHerdrAgent({ cli: fake.cli, registryProfile: claudeProfile,
    runId: 'R001', nodeId: 'node-a', attemptId: 'attempt-empty-stdout', workDirRoot: 'C:/work', args: ['--test'] });
  assert.equal(launched.ok, true, '真实 pane run 返回空 stdout 时 Claude 启动必须成功');
  assert.equal(fake.paneKills, 0);
  assert.deepEqual(fake.calls.slice(0, 4), [
    ['paneSplit', 'C:/work'],
    ['paneRun', 'pane-1', 'claude', ['--test']],
    ['agentList'],
    ['agentRename', 'pane-1', 'herdr-attempt-empty-stdout'],
  ]);

  // wrapper 层：paneRun 必须走 json:false，返回字符串而不是解析后的对象。
  const root = await mkdtemp(join(tmpdir(), 'dhr68-panerun-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = join(root, 'state.json');
  const bin = fileURLToPath(new URL('./helpers/fake-herdr-bin.mjs', import.meta.url));
  await writeFile(statePath, JSON.stringify({ responses: { 'pane run': {}, 'agent start': { agent: { terminal_id: 't1' } } } }), 'utf8');
  const cli = makeHerdrCli({ herdrBin: process.execPath, herdrArgs: [bin, statePath] });
  const ran = cli.paneRun({ paneId: 'p1', command: 'claude', args: ['--x'] });
  assert.equal(ran.ok, true);
  assert.equal(typeof ran.value, 'string', 'pane run 不得被当成 JSON 解析');
  // Codex 的 agent start 返回处理不变：仍拆信封、仍读 agent.terminal_id。
  assert.equal(cli.agentStart({ name: 'a', kind: 'codex', paneId: 'p1', args: ['--x'] }).value.agent.terminal_id, 't1');
  const calls = JSON.parse(await readFile(statePath, 'utf8')).calls;
  assert.deepEqual(calls[0], ['pane', 'run', 'p1', 'claude', '--x']);
  assert.deepEqual(calls[1], ['agent', 'start', 'a', '--kind', 'codex', '--pane', 'p1', '--', '--x']);
});

test('DHR_68/C adapter：启动期 blocked 保留 handle、不关 pane、不重试', async () => {
  const notReady = { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'exit:1:{"error":{"code":"agent_not_ready"}}', notReady: true };
  const fake = makeFakeHerdr({ agentStartResult: notReady, statuses: ['blocked'] });
  const launched = await launchHerdrAgent({ cli: fake.cli, registryProfile: profile,
    runId: 'R001', nodeId: 'node-a', attemptId: 'attempt-blocked', workDirRoot: 'C:/work', readyTimeoutMs: 0 });
  assert.equal(launched.ok, true, 'start-time blocked 是要人来处理的暂停，不是启动失败');
  assert.equal(launched.launch_blocked, true);
  assert.equal(launched.handle.agent_name, 'herdr-attempt-blocked');
  assert.equal(launched.handle.pane_id, 'pane-1');
  assert.equal(fake.paneKills, 0, '不得关掉正等着用户确认信任的 pane');
  assert.equal(fake.calls.filter(([kind]) => kind === 'agentStart').length, 1, '不得重试启动');
  assert.equal(launched.ready_observation?.herdr_status, 'blocked');

  // 观测本身报 blocked（Claude 的信任框出现在 pane run 成功之后）也算启动期 blocked。
  const claudeProfile = { ...profile, executor_profile_id: 'herdr.claude.main', product: 'claude-code', command_alias: 'claude' };
  const claudeFake = makeFakeHerdr({ statuses: ['blocked'] });
  const claudeLaunched = await launchHerdrAgent({ cli: claudeFake.cli, registryProfile: claudeProfile,
    runId: 'R001', nodeId: 'node-a', attemptId: 'attempt-claude-blocked', workDirRoot: 'C:/work', readyTimeoutMs: 0 });
  assert.equal(claudeLaunched.ok, true);
  assert.equal(claudeLaunched.launch_blocked, true);
  assert.equal(claudeFake.paneKills, 0);
});

test('DHR_68/C driver：启动即 blocked 恰写一次 waiting_human，不写 HOST_LOST，指令扣住不发', async (t) => {
  // 状态序列全为 blocked（fake 的最后一项是粘性的），所以这一段是确定性的：
  // 节点会稳定停在 waiting_human，不会被后续观测推回 running。
  const notReady = { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'exit:1:{"error":{"code":"agent_not_ready"}}', notReady: true };
  const { store, root, driver, fake } = await runtimeFixture(t, ['blocked'], {
    fake: { agentStartResult: notReady },
    driver: { herdrReadyTimeoutMs: 0 },
  });
  t.after(() => driver.stop());
  const t0 = Date.now();

  // 等**派生状态**而不是事件数组：事件先入内存、状态稍后收敛，等事件会取到半路的现场。
  //
  // 上限依据（B-36 冻结规则：按本用例实际走的 `launchHerdrAgent` 调用链，把每次 Herdr CLI
  // 调用的**生产上限**逐段相加 × 1.5）。这条是 Codex profile + `agentStart` 返回 notReady →
  // `startBlocked`，链上恰三次 CLI 调用：
  //     paneSplit 10_000（herdr-cli.mjs:41 通用 per-call 上限）
  //   + agentStart 60_000（herdr-cli.mjs:17 `HERDR_START_TIMEOUT_MS`，只有 `agent start` 用它）
  //   + 首次 agentGet 10_000（`startBlocked` 时夹具 `herdrReadyTimeoutMs:0` → 就绪循环不重试）
  //   = 80_000 → × 1.5 = **120_000**
  // 原来的 45s 方向是反的：把「45s 在生产 60s 之内」当成余量，实际**上限必须 ≥ 生产合法
  // 上限**，否则一次合法的慢启动就会被判成失败。这是保守上限，只负责把挂住变成上限内
  // fail + dump，不解释成因。
  const BLOCKED_LAUNCH_BUDGET_MS = 120_000;
  const blockedScene = () => dumpDriverScene({ store, fake, t0 });
  await untilEvent(async () => (await store.readState()).node_states[0]?.status === 'waiting_human',
    { label: 'DHR_68/C waiting_human', timeoutMs: BLOCKED_LAUNCH_BUDGET_MS, dump: blockedScene });
  const attention = store.events.filter(event => event.kind === 'human_input_requested');
  assert.equal(attention.length, 1, '启动期 blocked 只应产生一条持久 Attention');
  assert.match(attention[0].detail, /herdr_status=blocked/, 'Attention 必须带真实 blocked 观测，不能写成 unknown');
  assert.equal(attention[0].reason ?? null, null, '这是等人，不是宿主失联');
  assert.equal(store.events.some(event => event.reason === 'E_EXECUTOR_HOST_LOST'), false);
  assert.equal((await store.readState()).node_states[0].status, 'waiting_human');
  assert.equal(fake.sent.length, 0, 'blocked 期间不得把提交指令打进信任对话框');
  assert.equal(fake.paneKills, 0, '不得关掉正等着用户确认信任的 pane');
  assert.equal(store.events.some(event => event.kind === 'attempt_started'), true);

  // 再等若干轮观测，确认 Attention 不会被反复写。
  //
  // 上限依据（同一条冻结规则，但这里等的是**轮询**而不是 launch）：要等满 5 轮，每轮 =
  // 一次观测 CLI 调用的生产上限 10_000 + 夹具生效的 `herdrPollMs`（实际值 20）：
  //     5 × (10_000 + 20) × 1.5 = **75_150**
  const BLOCKED_FIVE_POLLS_BUDGET_MS = 75_150;
  await untilEvent(() => fake.agentGets >= 5,
    { label: 'DHR_68/C ≥5 blocked polls', timeoutMs: BLOCKED_FIVE_POLLS_BUDGET_MS, dump: blockedScene });
  assert.equal(store.events.filter(event => event.kind === 'human_input_requested').length, 1);
  assert.equal(fake.sent.length, 0);
  assert.deepEqual(await readdir(join(root, 'results')), [], 'blocked 与观测都不得产生 Result');
});

test('DHR_68/C driver：人处理完信任后离开 blocked，提交指令恰好补发一次', async (t) => {
  const notReady = { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'exit:1:{"error":{"code":"agent_not_ready"}}', notReady: true };
  const { store, driver, fake } = await runtimeFixture(t, ['blocked', 'blocked', 'working'], {
    fake: { agentStartResult: notReady },
    driver: { herdrReadyTimeoutMs: 0 },
  });
  t.after(() => driver.stop());

  // 这些断言都是单调的（事件与 sent 只增不减），不依赖采样时机。
  await runtimeUntil(() => fake.sent.length === 1, 'deferred completion instruction', 45_000);
  assert.match(fake.sent[0].text, /submit-result --receipt-id /);
  await runtimeUntil(() => store.events.some(event => event.kind === 'checkpoint_recorded'), 'working checkpoint', 45_000);
  await runtimeUntil(() => fake.agentGets >= 8, 'several working polls', 45_000);
  assert.equal(fake.sent.length, 1, 'completion instruction 只补发一次');
  assert.equal(store.events.filter(event => event.kind === 'human_input_requested').length, 1, 'Attention 不因解除 blocked 而重复');
  assert.equal(store.events.some(event => event.reason === 'E_EXECUTOR_HOST_LOST'), false);
  assert.equal(fake.paneKills, 0);
});

test('DHR_68/C driver：blocked 直接跳到 done 时提交指令仍补发一次（复核轮 2 · F-68-R2-01）', async (t) => {
  // 轮 2 抓到的漏洞：补发条件曾是白名单 ['working','idle']，blocked → done 会整条漏掉，
  // 随后 done 分支去等 Result，最终误落 E_EXECUTOR_RESULT_MISSING。
  const notReady = { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'exit:1:{"error":{"code":"agent_not_ready"}}', notReady: true };
  const { store, driver, fake } = await runtimeFixture(t, ['blocked', 'blocked', 'done'], {
    fake: { agentStartResult: notReady },
    driver: { herdrReadyTimeoutMs: 0, doneTimeoutMs: 400 },
  });
  t.after(() => driver.stop());

  await runtimeUntil(() => fake.sent.length === 1, 'deferred instruction on blocked->done', 45_000);
  assert.match(fake.sent[0].text, /submit-result --receipt-id /);
  await driver.done;
  assert.equal(fake.sent.length, 1, 'completion instruction 只补发一次');
  assert.equal(store.events.filter(event => event.kind === 'human_input_requested'
    && (event.reason ?? null) === null).length, 1, '启动期 blocked 的等人事件仍只有一条');
  assert.equal(store.events.some(event => event.reason === 'E_EXECUTOR_HOST_LOST'), false);
  assert.equal(fake.paneKills, 0);
});

test('DHR_68/D：fake-herdr 每个被触及命令的返回形态逐条对齐真实 herdr 的实测记录', async () => {
  // 验收 D 的机器化：不靠人眼比对注释，直接拿真实 probe 的 `result_keys` 当 oracle。
  // 对照表由 `workspace/DHR_68/scripts/probe-command-shapes.mjs` 对真实 herdr 0.8.2 跑出。
  const shapesPath = fileURLToPath(new URL(
    '../../docs/modules/dh-relay/workspace/DHR_68/evidence/real-herdr-command-shapes.json', import.meta.url));
  const recorded = JSON.parse(await readFile(shapesPath, 'utf8'));
  const probeOf = (label) => {
    // 先精确匹配，再退回前缀匹配——`pane close` 的 label 带动态 pane id，
    // 但 `agent-get` 必须命中自己而不是 `agent-get-missing`。
    const found = recorded.probes.find(probe => probe.label === label)
      ?? recorded.probes.find(probe => probe.label.startsWith(`${label}-`));
    assert.ok(found, `真实对照表缺少命令 ${label}——验收 D 要求逐命令有实测证据`);
    return found;
  };

  const fake = makeFakeHerdr();
  // 左：fake 的调用；右：真实 probe 的 label。json:false 的命令在 wrapper 层返回字符串。
  const jsonCommands = [
    ['pane-split', () => fake.cli.paneSplit({ cwd: 'C:/work' })],
    ['pane-get', () => fake.cli.paneGet('pane-1')],
    ['pane-close', () => fake.cli.paneKill('pane-1')],
    ['agent-start', () => fake.cli.agentStart({ name: 'a', kind: 'codex', paneId: 'pane-1' })],
    ['agent-list', () => fake.cli.agentList()],
    ['agent-get', () => fake.cli.agentGet('a')],
    ['agent-rename', () => fake.cli.agentRename({ target: 'pane-1', name: 'a' })],
    ['agent-prompt', () => fake.cli.agentPrompt('a', 'hi')],
    ['agent-send-keys', () => fake.cli.agentSendKeys('a', ['enter'])],
  ];
  for (const [label, call] of jsonCommands) {
    const probe = probeOf(label);
    assert.equal(probe.stdout_is_json, true, `${label} 真实输出应为 JSON`);
    assert.ok(Array.isArray(probe.result_keys), `${label} 真实对照表缺 result_keys`);
    const value = call().value;
    assert.deepEqual(Object.keys(value).sort(), [...probe.result_keys].sort(),
      `${label} 的 fake 返回形态与真实 herdr 不一致——DHR_67 正是栽在这里`);
  }

  // 走 `json:false` 的命令：真实 stdout 不是 JSON，wrapper 返回字符串。
  for (const [label, call] of [
    ['pane-run', () => fake.cli.paneRun({ paneId: 'pane-1', command: 'claude', args: [] })],
    ['agent-read', () => fake.cli.agentRead('a')],
  ]) {
    const probe = probeOf(label);
    assert.equal(probe.stdout_is_json, false, `${label} 真实输出不应是 JSON`);
    assert.equal(typeof call().value, 'string', `${label} 的 fake 应返回字符串`);
  }
  // `pane run` 成功时真实 stdout 是**空**的——这正是 DHR_67 的 fake 掩盖掉的那条。
  assert.equal(probeOf('pane-run').stdout_len, 0);
  assert.equal(fake.cli.paneRun({ paneId: 'pane-1', command: 'claude', args: [] }).value, '');

  // 失败形态：真实 herdr 把 JSON 错误写 stderr 且 exit 1；`missing` 靠 message 里的 "not found"。
  for (const label of ['pane-get-missing', 'agent-get-missing']) {
    const probe = probeOf(label);
    assert.equal(probe.exit_code, 1);
    assert.equal(probe.stdout_len, 0);
    assert.match(probe.stderr_head, /"code":"(pane|agent)_not_found"/);
    assert.match(probe.stderr_head, /not found/);
  }
  const dead = makeFakeHerdr({ agentAlive: false, paneAlive: false, missing: true });
  assert.match(dead.cli.agentGet('a').detail, /^exit:1:\{"error":\{"code":"agent_not_found"/);
  assert.match(dead.cli.paneGet('pane-1').detail, /^exit:1:\{"error":\{"code":"pane_not_found"/);
});
