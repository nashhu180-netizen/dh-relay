import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { startWorkflowDriver } from '../runtime/workflow-driver.mjs';
import { createStore } from '../store/store.mjs';
import { makeFakeHerdr } from './helpers/fake-herdr.mjs';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, label, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (!(await check())) {
    if (Date.now() > deadline) throw new Error(`timeout:${label}`);
    await sleep(5);
  }
}

const profile = {
  executor_profile_id: 'herdr.codex.dhr72', backend: 'herdr', product: 'codex-cli', command_alias: 'codex',
  account_alias: 'acct-test', capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported',
    headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' },
  supported_platforms: [process.platform], headless_supported: true,
  config_fingerprint_rule: { kind: 'file-exists', path_template: '${DHR72_PROFILE_HOME}/profile.json',
    fields: [{ pointer: '/model', classification: 'nonsecret' }] },
};
const INSTRUCTION = 'DHR72 test task';
const instruction_ref = { path: 'task.md', sha256: createHash('sha256').update(INSTRUCTION, 'utf8').digest('hex') };

test('DHR72 driver: initial idle remains observable until later working records a checkpoint', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr72-continuous-'));
  const runId = 'RUN-DHR72-CONTINUOUS';
  const run = {
    protocol: 'relay.run/v2', run_id: runId, workflow_name: 'dhr72', summary: 'continuous observation',
    trigger: 'system', created_at: '2026-09-04T00:00:00.000Z', labels: [],
    nodes: [{ node_id: 'node-a', title: 'A', role: 'work', required: true,
      executor_profiles: [{ kind: 'herdr-agent', ref: profile.executor_profile_id }], instruction_ref }],
  };
  const root = join(repoRoot, '.dh-relay', runId);
  const store = await createStore({ root, run });
  const registryPath = join(repoRoot, 'profiles.json');
  await writeFile(join(repoRoot, 'profile.json'), JSON.stringify({ model: 'test-model' }), 'utf8');
  await writeFile(join(repoRoot, 'task.md'), INSTRUCTION, 'utf8');
  await writeFile(registryPath, JSON.stringify({ profiles: [profile] }), 'utf8');
  // launch probes once before the polling loop; retain two idle observations
  // for the loop itself before the first working heartbeat.
  const fake = makeFakeHerdr({ statuses: ['idle', 'idle', 'idle', 'idle', 'working'] });
  const driver = startWorkflowDriver({
    repoRoot, runId, actor: { submitControl: job => job(store) }, herdrCli: fake.cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR72_PROFILE_HOME: repoRoot },
    herdrPollMs: 20, doneTimeoutMs: 0, observationLostMs: 40,
  });
  t.after(async () => { await driver.stop(); await rm(repoRoot, { recursive: true, force: true }); });

  await until(() => store.events.some(event => event.kind === 'human_input_requested'
    && event.reason === 'E_EXECUTOR_RESULT_MISSING'), 'idle attention');
  await until(() => store.events.some(event => event.kind === 'checkpoint_recorded'), 'working checkpoint');
  assert.ok(fake.agentGets >= 3, 'checkpoint must come from an observation after the idle Attention');
  // Let the final fake observation settle before reading the durable snapshot. On Windows,
  // repeatedly opening state.json while the driver atomically replaces it can make rename
  // fail with EPERM; this remains a single durable read and does not inspect the in-memory ledger.
  await sleep(100);
  assert.equal((await store.readState()).node_states[0].status, 'running');
  fake.setStatuses(['idle']);
  await until(() => store.events.filter(event => event.reason === 'E_EXECUTOR_RESULT_MISSING').length === 2,
    'working resets the next idle episode only');
  await driver.stop();
  await driver.done;
});

test('DHR72 driver: idle plus blocked pane never checkpoints, returns running, or re-sends the submission instruction', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr72-idle-blocked-'));
  const runId = 'RUN-DHR72-IDLE-BLOCKED';
  const run = {
    protocol: 'relay.run/v2', run_id: runId, workflow_name: 'dhr72', summary: 'idle blocked guard',
    trigger: 'system', created_at: '2026-09-04T00:00:00.000Z', labels: [],
    nodes: [{ node_id: 'node-a', title: 'A', role: 'work', required: true,
      executor_profiles: [{ kind: 'herdr-agent', ref: profile.executor_profile_id }], instruction_ref }],
  };
  const root = join(repoRoot, '.dh-relay', runId);
  const store = await createStore({ root, run });
  const registryPath = join(repoRoot, 'profiles.json');
  await writeFile(join(repoRoot, 'profile.json'), JSON.stringify({ model: 'test-model' }), 'utf8');
  await writeFile(join(repoRoot, 'task.md'), INSTRUCTION, 'utf8');
  await writeFile(registryPath, JSON.stringify({ profiles: [profile] }), 'utf8');
  // Launch observes working and sends the instruction once. Later idle observations
  // must be paired with the blocked pane projection, not mistaken for working.
  const fake = makeFakeHerdr({ statuses: ['working', 'working', 'working', 'idle'], paneStatuses: ['blocked'] });
  const driver = startWorkflowDriver({
    repoRoot, runId, actor: { submitControl: job => job(store) }, herdrCli: fake.cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR72_PROFILE_HOME: repoRoot },
    herdrPollMs: 20, doneTimeoutMs: 0, observationLostMs: 40, signalConflictMs: 0,
  });
  t.after(async () => { await driver.stop(); await rm(repoRoot, { recursive: true, force: true }); });

  await until(() => fake.paneGets >= 2, 'idle plus blocked pane observations');
  assert.equal(fake.sent.length, 1, 'idle plus blocked must not re-send the instruction');
  assert.equal(store.events.some(event => event.kind === 'checkpoint_recorded'), false);
  assert.equal((await store.readState()).node_states[0].status, 'waiting_human');
  await driver.stop();
  await driver.done;
});

async function exitFixture(t, { suffix, statuses, paneStatuses, fakeOptions = {}, actorFactory, driverOptions = {} }) {
  const repoRoot = await mkdtemp(join(tmpdir(), `dhr72-exit-${suffix}-`));
  const runId = `RUN-DHR72-${suffix}`;
  const run = {
    protocol: 'relay.run/v2', run_id: runId, workflow_name: 'dhr72', summary: `exit ${suffix}`,
    trigger: 'system', created_at: '2026-09-04T00:00:00.000Z', labels: [],
    nodes: [{ node_id: 'node-a', title: 'A', role: 'work', required: true,
      executor_profiles: [{ kind: 'herdr-agent', ref: profile.executor_profile_id }], instruction_ref }],
  };
  const root = join(repoRoot, '.dh-relay', runId);
  const store = await createStore({ root, run });
  const registryPath = join(repoRoot, 'profiles.json');
  await writeFile(join(repoRoot, 'profile.json'), JSON.stringify({ model: 'test-model' }), 'utf8');
  await writeFile(join(repoRoot, 'task.md'), INSTRUCTION, 'utf8');
  await writeFile(registryPath, JSON.stringify({ profiles: [profile] }), 'utf8');
  const fake = makeFakeHerdr({ statuses, paneStatuses, ...fakeOptions });
  const actor = actorFactory?.(store) ?? { submitControl: job => job(store) };
  const driver = startWorkflowDriver({
    repoRoot, runId, actor, herdrCli: fake.cli, herdrRegistryPath: registryPath,
    profileEnvironment: { DHR72_PROFILE_HOME: repoRoot }, herdrPollMs: 20,
    doneTimeoutMs: 0, observationLostMs: 40, ...driverOptions,
  });
  t.after(async () => { await driver.stop(); await rm(repoRoot, { recursive: true, force: true }); });
  return { root, store, driver, fake, repoRoot, registryPath };
}

const receiptIdOf = store => store.events.find(event => event.kind === 'attempt_started')?.detail.slice('receipt:'.length);

async function assertNoLaterEvents(store, eventCount, label) {
  await sleep(60);
  assert.equal(store.events.length, eventCount, `${label}: exit must not append later events`);
}

test('DHR72 driver: committed Receipt Result exits with no later observation events', async (t) => {
  const item = await exitFixture(t, { suffix: 'COMMITTED', statuses: ['working'] });
  await until(() => receiptIdOf(item.store) && item.driver.hasOpenSubmissionGates, 'Receipt gate');
  const submitted = await item.driver.submitExecutorResult({
    protocol: 'relay.executor-result-submission/v1', receipt_id: receiptIdOf(item.store), outcome: 'succeeded', reason: null,
  });
  assert.equal(submitted.ok, true);
  await item.driver.done;
  await assertNoLaterEvents(item.store, item.store.events.length, 'committed Result');
});

test('DHR72 driver: explicit stop exits with no later observation events', async (t) => {
  const item = await exitFixture(t, { suffix: 'STOP', statuses: ['working'] });
  await until(() => item.store.events.some(event => event.kind === 'checkpoint_recorded'), 'checkpoint');
  await item.driver.stop();
  assert.ok(item.store.events.some(event => event.reason === 'E_EXECUTOR_KILLED'));
  await assertNoLaterEvents(item.store, item.store.events.length, 'explicit stop');
});

test('DHR72 driver: host loss exits with no later observation events', async (t) => {
  const item = await exitFixture(t, {
    suffix: 'HOST-LOST', statuses: ['unknown'], fakeOptions: { agentAlive: false, paneAlive: false, missing: true },
    driverOptions: { herdrReadyTimeoutMs: 0 },
  });
  await item.driver.done;
  assert.ok(item.store.events.some(event => event.reason === 'E_EXECUTOR_HOST_LOST'));
  await assertNoLaterEvents(item.store, item.store.events.length, 'host loss');
});

test('DHR72 driver: a terminal Attempt is not observed again by a new driver', async (t) => {
  const item = await exitFixture(t, { suffix: 'TERMINAL', statuses: ['working'] });
  await until(() => receiptIdOf(item.store) && item.driver.hasOpenSubmissionGates, 'Receipt gate');
  assert.equal((await item.driver.submitExecutorResult({
    protocol: 'relay.executor-result-submission/v1', receipt_id: receiptIdOf(item.store), outcome: 'succeeded', reason: null,
  })).ok, true);
  await item.driver.done;
  const eventCount = item.store.events.length;
  const pollsBeforeResume = item.fake.agentGets;
  const resumed = startWorkflowDriver({
    repoRoot: item.repoRoot, runId: 'RUN-DHR72-TERMINAL', actor: { submitControl: job => job(item.store) },
    herdrCli: item.fake.cli, herdrRegistryPath: item.registryPath,
    profileEnvironment: { DHR72_PROFILE_HOME: item.repoRoot }, herdrPollMs: 20,
  });
  await resumed.done;
  assert.equal(item.fake.agentGets, pollsBeforeResume, 'terminal resume must not poll the old Attempt');
  const later = item.store.events.slice(eventCount);
  assert.ok(later.every(event => event.kind === 'run_finished' && event.node_id === null),
    'terminal resume may only close the Run; it must not observe or mutate the old Attempt');
});

for (const closureReason of ['actor-closed', 'lease-lost']) {
  test(`DHR72 driver: ${closureReason} fails closed with no old-actor event write`, async (t) => {
    let closed = false;
    let rejectedWrites = 0;
    const item = await exitFixture(t, {
      suffix: closureReason.toUpperCase(), statuses: ['working'],
      actorFactory: store => ({ submitControl: async job => {
        if (closed) {
          rejectedWrites += 1;
          throw new Error(`E_LEASE_HELD:${closureReason}`);
        }
        const result = await job(store);
        if (store.events.some(event => event.kind === 'attempt_started')) closed = true;
        return result;
      } }),
    });
    await item.driver.done;
    const eventCountAtClosure = item.store.events.length;
    assert.ok(rejectedWrites >= 1, `${closureReason}: the closed actor must reject a driver write`);
    assert.equal(item.store.events.some(event => event.kind === 'host_observation_changed'), false);
    await assertNoLaterEvents(item.store, eventCountAtClosure, closureReason);
  });
}
