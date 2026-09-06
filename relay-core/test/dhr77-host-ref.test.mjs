import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import * as herdrExecutor from '../runtime/executors/herdr/herdr-executor.mjs';
import * as render from '../cli/render.mjs';
import { startWorkflowDriver } from '../runtime/workflow-driver.mjs';
import { createStore, openStore, readEventLog } from '../store/store.mjs';
import { makeFakeHerdr } from './helpers/fake-herdr.mjs';

const PREFIX = 'herdr-terminal/sha256-';

const legacyRun = (runId = 'RUN-DHR77-LEGACY') => ({
  protocol: 'relay.run/v2', run_id: runId, workflow_name: 'dhr77', summary: 'legacy host ref',
  trigger: 'system', created_at: '2026-09-06T00:00:00.000Z', labels: [],
  nodes: [{ node_id: 'node-a', title: 'A', role: 'work', required: true,
    executor_profiles: [{ kind: 'herdr-agent', ref: 'herdr-agent' }] }],
});

const legacyAliveEvent = (runId = 'RUN-DHR77-LEGACY') => ({
  protocol: 'relay.event/v2', run_id: runId, seq: 0, at: '2026-09-06T00:00:00.000Z',
  kind: 'host_observation_changed', node_id: 'node-a', attempt_id: 'attempt-a',
  executor_kind: 'herdr-agent', executor_ref: 'herdr-agent', observation_status: 'alive',
  detail: 'legacy observation',
});

async function legacyEventFixture(t, event) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr77-legacy-'));
  const root = join(repoRoot, '.dh-relay', event.run_id);
  const eventsPath = join(root, 'events.jsonl');
  const run = legacyRun(event.run_id);
  await mkdir(root, { recursive: true });
  await writeFile(join(root, 'run.json'), `${JSON.stringify(run)}\n`, 'utf8');
  await writeFile(eventsPath, `${JSON.stringify(event)}\n`, 'utf8');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  return { run, root, eventsPath };
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

test('DHR_77 B46 Store: legacy alive event reopens read-only through both entries', async (t) => {
  const event = legacyAliveEvent();
  const item = await legacyEventFixture(t, event);
  const before = sha256(await readFile(item.eventsPath));

  const readEvents = await readEventLog({ root: item.root, run: item.run });
  assert.deepEqual(readEvents, [event]);
  assert.equal(Object.prototype.hasOwnProperty.call(readEvents[0], 'host_ref'), false);

  const reopened = await openStore({ root: item.root });
  assert.deepEqual(reopened.events, [event]);
  assert.equal(Object.prototype.hasOwnProperty.call(reopened.events[0], 'host_ref'), false);
  assert.equal(sha256(await readFile(item.eventsPath)), before, 'reopen 不得迁移或写回 events.jsonl');
});

test('DHR_77 B46 Store: null, neighboring corruption, and new writer missing ref remain rejected', async (t) => {
  for (const [label, event] of [
    ['alive with explicit null host_ref', { ...legacyAliveEvent(), host_ref: null }],
    ['otherwise-invalid neighboring field', { ...legacyAliveEvent(), executor_ref: '/absolute/path' }],
  ]) {
    const item = await legacyEventFixture(t, event);
    await assert.rejects(() => readEventLog({ root: item.root, run: item.run }), /E_EVENT_LOG_CORRUPT:schema-line-0/, label);
    await assert.rejects(() => openStore({ root: item.root }), /E_EVENT_LOG_CORRUPT:schema-line-0/, label);
  }

  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr77-new-writer-'));
  const run = legacyRun('RUN-DHR77-NEW-WRITER');
  const store = await createStore({ root: join(repoRoot, '.dh-relay', run.run_id), run });
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  await assert.rejects(() => store.appendEvent({
    kind: 'host_observation_changed', at: run.created_at, node_id: 'node-a', attempt_id: 'attempt-a',
    executor_kind: 'herdr-agent', executor_ref: 'herdr-agent', observation_status: 'alive',
  }), /E_SCHEMA_INVALID/, '新 writer 不得写入缺 host_ref 的 alive event');
});

test('DHR_77 host_ref: frozen UTF-8 golden vectors are byte-exact', () => {
  assert.equal(typeof herdrExecutor.deriveHerdrHostRef, 'function',
    'Herdr adapter must expose the single frozen terminal_id derivation');
  for (const [terminalId, digest] of [
    ['term-A', 'd76a03ffa38ce927745a459ea6932def020927c540d7959bd03120a24e4470d9'],
    ['  padded  ', 'e950de60d62682580236a81af257482ea57a99adbbbf1ff6c52fbde81ebdb002'],
    ['终端-α', 'e1d69ba9676276c9ef0b619a9dcff17dc5de1edf7aa025ce1049f61165033316'],
    ['\u0001', '6c372de9d734954d8ac1e14e84af9a38354e0c5e90dd39420091213226da18ab'],
  ]) {
    assert.equal(herdrExecutor.deriveHerdrHostRef(terminalId), `${PREFIX}${digest}`);
  }
});

test('DHR_77 host_ref: only non-empty string terminal_id is accepted', () => {
  assert.equal(typeof herdrExecutor.deriveHerdrHostRef, 'function',
    'Herdr adapter must expose the single frozen terminal_id derivation');
  for (const value of [undefined, null, 7, {}, [] , '']) {
    assert.equal(herdrExecutor.deriveHerdrHostRef(value), null);
  }
  assert.match(herdrExecutor.deriveHerdrHostRef(' '), /^herdr-terminal\/sha256-[0-9a-f]{64}$/);
});

const profile = {
  executor_profile_id: 'herdr.codex.test', product: 'codex-cli', command_alias: 'codex',
};

function launchCli(agent) {
  let kills = 0;
  return {
    get kills() { return kills; },
    paneSplit: async () => ({ ok: true, value: { pane: { pane_id: 'pane-fallback' } } }),
    agentStart: async () => ({ ok: true, value: { agent } }),
    agentGet: async () => ({ ok: true, value: { agent: { ...agent, agent_status: 'idle', state_change_seq: 1 } } }),
    paneGet: async () => ({ ok: true, value: { pane: { agent_status: 'idle' } } }),
    paneKill: async () => { kills += 1; return { ok: true }; },
  };
}

test('DHR_77 launch writer: missing or invalid terminal_id cannot fall back', async () => {
  for (const terminalId of [undefined, null, 7, {}, '']) {
    const cli = launchCli({ terminal_id: terminalId, pane_id: 'pane-fallback', agent: 'fallback', agent_session: 'fallback' });
    const launched = await herdrExecutor.launchHerdrAgent({
      cli, registryProfile: profile, runId: 'RUN-DHR77', nodeId: 'node-a', attemptId: 'attempt-a',
      workDirRoot: 'C:/work', readyTimeoutMs: 0,
    });
    assert.equal(launched.ok, false);
    assert.equal(launched.reason, 'E_BAD_VALUE:HERDR_CLI');
    assert.equal(cli.kills, 1);
  }
});

test('DHR_77 observe writer: current Herdr response supplies the ref', async () => {
  const valid = await herdrExecutor.observeHerdrAgent({
    cli: { agentGet: async () => ({ ok: true, value: { agent: {
      terminal_id: 'term-A', agent_status: 'working', state_change_seq: 2,
    } } }) },
    handle: { agent_name: 'locator-only', pane_id: 'pane-fallback' },
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.observation.host_ref,
    `${PREFIX}d76a03ffa38ce927745a459ea6932def020927c540d7959bd03120a24e4470d9`);

  for (const terminalId of [undefined, 7, '']) {
    const invalid = await herdrExecutor.observeHerdrAgent({
      cli: { agentGet: async () => ({ ok: true, value: { agent: {
        terminal_id: terminalId, pane_id: 'pane-fallback', agent: 'fallback', agent_session: 'fallback',
        agent_status: 'working', state_change_seq: 2,
      } } }) },
      handle: { agent_name: 'locator-only', pane_id: 'pane-fallback' },
    });
    assert.equal(invalid.ok, false);
    assert.equal(invalid.reason, 'E_BAD_VALUE:HERDR_CLI');
  }
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, label) {
  const deadline = Date.now() + 10_000;
  while (!(await check())) {
    if (Date.now() > deadline) throw new Error(`timeout:${label}`);
    await sleep(5);
  }
}

async function driverFixture(t, fakeOptions) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr77-driver-'));
  const runId = 'RUN-DHR77-HOST-REF';
  const profileRef = 'herdr.codex.dhr77';
  const run = {
    protocol: 'relay.run/v2', run_id: runId, workflow_name: 'dhr77', summary: 'host ref',
    trigger: 'system', created_at: '2026-09-06T00:00:00.000Z', labels: [],
    nodes: [{ node_id: 'node-a', title: 'A', role: 'work', required: true,
      executor_profiles: [{ kind: 'herdr-agent', ref: profileRef }] }],
  };
  const root = join(repoRoot, '.dh-relay', runId);
  await mkdir(root, { recursive: true });
  const store = await createStore({ root, run });
  const registryPath = join(repoRoot, 'profiles.json');
  await writeFile(join(repoRoot, 'profile.json'), JSON.stringify({ model: 'test' }), 'utf8');
  await writeFile(registryPath, JSON.stringify({ profiles: [{
    executor_profile_id: profileRef, backend: 'herdr', product: 'codex-cli', command_alias: 'codex',
    account_alias: 'acct-test', capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported',
      headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' },
    supported_platforms: [process.platform], headless_supported: true,
    config_fingerprint_rule: { kind: 'file-exists', path_template: '${DHR77_PROFILE_HOME}/profile.json',
      fields: [{ pointer: '/model', classification: 'nonsecret' }] },
  }] }), 'utf8');
  const fake = makeFakeHerdr(fakeOptions);
  const driver = startWorkflowDriver({
    repoRoot, runId, actor: { submitControl: job => job(store) }, herdrCli: fake.cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR77_PROFILE_HOME: repoRoot },
    herdrPollMs: 20, observationLostMs: 40, doneTimeoutMs: 1_000,
  });
  const driverState = { done: false, error: null };
  driver.done.then(() => { driverState.done = true; }, error => { driverState.done = true; driverState.error = error; });
  t.after(async () => { await driver.stop(); await rm(repoRoot, { recursive: true, force: true }); });
  return { store, driver, fake, driverState };
}

test('DHR_77 driver: working to working terminal replacement appends a new ref', async (t) => {
  const item = await driverFixture(t, {
    statuses: ['working'], terminalIds: ['term-1', 'term-1', 'term-2'],
  });
  await until(() => {
    if (item.driverState.error) throw item.driverState.error;
    if (item.driverState.done) throw new Error(`driver-ended-before-replacement:${JSON.stringify({ events: item.store.events, calls: item.fake.calls })}`);
    return item.store.events.filter(event => event.kind === 'host_observation_changed').length >= 2;
  },
    'replacement observation');
  const observations = item.store.events.filter(event => event.kind === 'host_observation_changed');
  assert.equal(observations[0].observation_status, 'alive');
  assert.equal(observations[1].observation_status, 'alive');
  assert.notEqual(observations[0].host_ref, observations[1].host_ref);
  assert.equal(observations[0].detail.includes('term-'), false);
  await item.driver.stop();
});

test('DHR_77 driver: observation loss retains the last successful ref', async (t) => {
  const item = await driverFixture(t, {
    statuses: ['working'], terminalIds: ['term-1'], agentGetFailAfter: 1,
  });
  await until(() => {
    if (item.driverState.error) throw item.driverState.error;
    if (item.driverState.done) throw new Error(`driver-ended-before-loss:${JSON.stringify({ events: item.store.events, calls: item.fake.calls })}`);
    return item.store.events.some(event => event.kind === 'host_observation_changed'
      && event.observation_status === 'observation_lost');
  }, 'lost observation');
  const observations = item.store.events.filter(event => event.kind === 'host_observation_changed');
  assert.equal(observations[0].observation_status, 'alive');
  assert.equal(observations[1].observation_status, 'observation_lost');
  assert.equal(observations[1].host_ref, observations[0].host_ref);
  await item.driver.stop();
});

async function recoveryFixture(t, fakeOptions, { seedHostRef = null } = {}) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr77-recovery-'));
  const runId = 'RUN-DHR77-RECOVERY';
  const profileRef = 'herdr.codex.dhr77';
  const run = {
    protocol: 'relay.run/v2', run_id: runId, workflow_name: 'dhr77', summary: 'host ref recovery',
    trigger: 'system', created_at: '2026-09-06T00:00:00.000Z', labels: [],
    nodes: [{ node_id: 'node-a', title: 'A', role: 'work', required: true,
      executor_profiles: [{ kind: 'herdr-agent', ref: profileRef }] }],
  };
  const root = join(repoRoot, '.dh-relay', runId);
  await mkdir(root, { recursive: true });
  const registryPath = join(repoRoot, 'profiles.json');
  await writeFile(join(repoRoot, 'profile.json'), JSON.stringify({ model: 'test' }), 'utf8');
  await writeFile(registryPath, JSON.stringify({ profiles: [{
    executor_profile_id: profileRef, backend: 'herdr', product: 'codex-cli', command_alias: 'codex',
    account_alias: 'acct-test', capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported',
      headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' },
    supported_platforms: [process.platform], headless_supported: true,
    config_fingerprint_rule: { kind: 'file-exists', path_template: '${DHR77_PROFILE_HOME}/profile.json',
      fields: [{ pointer: '/model', classification: 'nonsecret' }] },
  }] }), 'utf8');
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: run.created_at });
  await store.appendEvent({ kind: 'node_started', at: run.created_at, node_id: 'node-a' });
  await store.registerAttemptReceipt({
    protocol: 'relay.attempt-receipt/v1', receipt_id: 'rcpt-recover', run_id: runId, node_id: 'node-a',
    attempt_id: 'attempt-recover', issued_at: run.created_at,
    executor_identity: {
      executor_profile_id: profileRef, account_alias: 'acct-test',
      config_fingerprint: 'a'.repeat(64), executor_capability_hash: 'a'.repeat(64),
    },
    fallback_profile_snapshots: [],
    result_submission_mode: 'receipt-bound/v1',
  });
  let seed = null;
  let seedIndex = -1;
  if (seedHostRef !== null) {
    await store.appendEvent({
      kind: 'host_observation_changed', at: run.created_at, node_id: 'node-a', attempt_id: 'attempt-recover',
      executor_ref: 'recover-agent', observation_status: 'alive', host_ref: seedHostRef,
      detail: herdrExecutor.observationDetail({
        herdrStatus: 'working', agentName: 'recover-agent', paneId: 'recover-pane', seq: 3,
        workDirRoot: repoRoot, profileId: profileRef,
      }),
    });
    seedIndex = store.events.length - 1;
    seed = { ...store.events[seedIndex] };
  }
  const fake = makeFakeHerdr(fakeOptions);
  const driver = startWorkflowDriver({
    repoRoot, runId, actor: { submitControl: job => job(store) }, herdrCli: fake.cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR77_PROFILE_HOME: repoRoot },
    herdrPollMs: 20, observationLostMs: 40, doneTimeoutMs: 1_000,
  });
  const driverState = { done: false, error: null };
  driver.done.then(() => { driverState.done = true; }, error => { driverState.done = true; driverState.error = error; });
  t.after(async () => { await driver.stop(); await rm(repoRoot, { recursive: true, force: true }); });
  return { store, driver, fake, driverState, seed, seedIndex };
}

test('DHR_77 cold recovery: same terminal ID keeps the ref and leaves the seeded event untouched', async (t) => {
  const seedRef = herdrExecutor.deriveHerdrHostRef('term-1');
  const item = await recoveryFixture(t, { statuses: ['working'] }, { seedHostRef: seedRef });
  await until(() => {
    if (item.driverState.error) throw item.driverState.error;
    return item.store.events.filter(event => event.kind === 'host_observation_changed').length >= 2;
  }, 'cold recovery observation');
  const observations = item.store.events.filter(event => event.kind === 'host_observation_changed');
  assert.equal(observations.length, 2);
  assert.equal(observations[1].observation_status, 'alive');
  assert.equal(observations[1].host_ref, seedRef);
  assert.deepEqual(item.store.events[item.seedIndex], item.seed);
  await item.driver.stop();
});

test('DHR_77 cold recovery: a different terminal ID replaces the ref while the seeded event stays untouched', async (t) => {
  const seedRef = herdrExecutor.deriveHerdrHostRef('term-1');
  const item = await recoveryFixture(t, { statuses: ['working'], terminalIds: ['term-2'] }, { seedHostRef: seedRef });
  await until(() => {
    if (item.driverState.error) throw item.driverState.error;
    return item.store.events.filter(event => event.kind === 'host_observation_changed').length >= 2;
  }, 'cold recovery replacement');
  const observations = item.store.events.filter(event => event.kind === 'host_observation_changed');
  assert.equal(observations[1].observation_status, 'alive');
  assert.equal(observations[1].host_ref, herdrExecutor.deriveHerdrHostRef('term-2'));
  assert.notEqual(observations[1].host_ref, observations[0].host_ref);
  assert.deepEqual(item.store.events[item.seedIndex], item.seed);
  await item.driver.stop();
});

test('DHR_77 cold recovery: initial loss without a prior success leaves host_ref absent', async (t) => {
  const item = await recoveryFixture(t, { statuses: ['working'] });
  await until(() => {
    if (item.driverState.error) throw item.driverState.error;
    return item.store.events.some(event => event.kind === 'host_observation_changed'
      && event.observation_status === 'observation_lost');
  }, 'cold recovery initial loss');
  const observations = item.store.events.filter(event => event.kind === 'host_observation_changed');
  assert.equal(observations.length, 1);
  assert.equal(observations[0].observation_status, 'observation_lost');
  assert.equal(observations[0].host_ref ?? null, null);
  await item.driver.stop();
});

test('DHR_77 cold recovery: probe failure keeps the last successful ref on the loss event', async (t) => {
  const seedRef = herdrExecutor.deriveHerdrHostRef('term-1');
  const item = await recoveryFixture(t, { statuses: ['working'], agentAlive: false }, { seedHostRef: seedRef });
  await until(() => {
    if (item.driverState.error) throw item.driverState.error;
    return item.store.events.some(event => event.kind === 'host_observation_changed'
      && event.observation_status === 'observation_lost');
  }, 'cold recovery probe loss');
  const observations = item.store.events.filter(event => event.kind === 'host_observation_changed');
  assert.equal(observations.length, 2);
  assert.equal(observations[1].observation_status, 'observation_lost');
  assert.equal(observations[1].host_ref, seedRef);
  assert.deepEqual(item.store.events[item.seedIndex], item.seed);
  await item.driver.stop();
});

test('DHR_77 CLI projection: current/history/none/legacy labels omit diagnostic detail', () => {
  assert.equal(typeof render.projectEvent, 'function');
  assert.equal(typeof render.projectFocus, 'function');
  const current = {
    seq: 7, kind: 'host_observation_changed', node_id: 'node-a', at: '2026-09-06T00:00:00Z',
    observation_status: 'alive', host_ref: `${PREFIX}d76a03ffa38ce927745a459ea6932def020927c540d7959bd03120a24e4470d9`,
    executor_ref: 'herdr-node-a', detail: 'work_dir_root=C:/sensitive;terminal_id=raw',
  };
  const currentProjection = render.projectFocus(current);
  assert.equal(currentProjection.host_ref_label, '当前观测');
  assert.equal(currentProjection.detail, undefined);
  assert.equal(render.projectEvent(current).detail, undefined);
  assert.ok(!render.renderFocus(current).includes('work_dir_root'));
  assert.ok(!render.renderEvent(current).includes('terminal_id=raw'));
  assert.equal(render.projectFocus({ ...current, observation_status: 'observation_lost' }).host_ref_label, '历史观测');
  assert.equal(render.projectFocus({ ...current, observation_status: 'observation_lost', host_ref: null }).host_ref_label,
    '尚无可信 terminal 标签');
  const legacy = { ...current };
  delete legacy.host_ref;
  assert.equal(render.projectFocus(legacy).host_ref_label, 'legacy 未提供');
  assert.ok(render.renderFocus(legacy).includes('host_ref_label: legacy 未提供'));
  assert.ok(render.renderFocus({ ...current, host_ref: null }).includes('host_ref_label: 尚无可信 terminal 标签'));
});
