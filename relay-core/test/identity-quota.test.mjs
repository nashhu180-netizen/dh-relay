import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createExecutorIdentity } from '../profiles/identity.mjs';
import { buildFallbackPause, selectQualifiedFallback } from '../runtime/executors/identity/fallback.mjs';
import { classifyQuota } from '../runtime/executors/quota/classifier.mjs';
import { startWorkflowDriver } from '../runtime/workflow-driver.mjs';
import { createStore } from '../store/store.mjs';
import { makeFakeHerdr } from './helpers/fake-herdr.mjs';

const HASH = 'a'.repeat(64);
const TEST_DETECTOR_ID = 'synthetic-usage-limit/v1';
const TEST_QUOTA_DETECTORS = Object.freeze({
  [TEST_DETECTOR_ID]: Object.freeze({ status: 429, code: 'usage_limit_reached' }),
});
const capabilities = {
  interactive: 'supported', resume: 'supported', readonly: 'supported',
  headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported',
};

function profile(id, account, root, extra = {}) {
  return {
    executor_profile_id: id, backend: 'herdr', product: 'codex-cli', command_alias: 'codex',
    account_alias: account, capabilities, supported_platforms: ['win32'], headless_supported: true,
    config_fingerprint_rule: {
      kind: 'file-exists', path_template: '${DHR34_CONFIG}/profile.json',
      fields: [{ pointer: '/model', classification: 'nonsecret' }],
    },
    ...extra,
  };
}

test('DHR_34: quota requires a registered detector plus explicit 429/code agreement', () => {
  assert.deepEqual(classifyQuota({
    detectorId: TEST_DETECTOR_ID, signal: { http_status: 429, error_code: 'usage_limit_reached' },
    detectors: TEST_QUOTA_DETECTORS,
  }), { classification: 'quota_confirmed', detector_id: TEST_DETECTOR_ID });
  for (const signal of [
    { http_status: 403, error_code: 'permission_denied' },
    { http_status: 503, error_code: 'network_unavailable' },
    { http_status: 500, error_code: 'internal_error' },
    { http_status: 429, error_code: 'rate_limited' },
    { http_status: 503, error_code: 'usage_limit_reached' },
  ]) assert.equal(classifyQuota({ detectorId: TEST_DETECTOR_ID, signal, detectors: TEST_QUOTA_DETECTORS }).classification, 'not_quota');
  assert.equal(classifyQuota({
    detectorId: 'unknown-detector/v1', signal: { http_status: 429, error_code: 'usage_limit_reached' },
  }).classification, 'unknown');
  assert.equal(classifyQuota({ detectorId: TEST_DETECTOR_ID, signal: { message: 'usage limit reached' },
    detectors: TEST_QUOTA_DETECTORS }).classification, 'unknown');
});

test('DHR_34: fallback selection follows Receipt order and skips drift or platform mismatch', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr34-fallback-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'profile.json'), JSON.stringify({ model: 'test-model' }), 'utf8');
  const environment = { DHR34_CONFIG: root };
  const first = profile('herdr.codex.first', 'acct-first', root, { supported_platforms: ['linux'] });
  const second = profile('herdr.codex.second', 'acct-second', root);
  const third = profile('herdr.codex.third', 'acct-third', root);
  const frozenFirst = createExecutorIdentity(first, { '/model': 'test-model' });
  const frozenSecond = createExecutorIdentity(second, { '/model': 'old-model' });
  const frozenThird = createExecutorIdentity(third, { '/model': 'test-model' });
  const receipt = { fallback_profile_snapshots: [frozenFirst, frozenSecond, frozenThird] };
  const selected = await selectQualifiedFallback({
    attemptReceipt: receipt, registry: { profiles: [first, second, third] }, environment, platform: 'win32',
  });
  assert.equal(selected.status, 'selected');
  assert.equal(selected.profile.executor_profile_id, 'herdr.codex.third');
  assert.deepEqual(selected.identity, frozenThird);
  assert.deepEqual(selected.fallback_profile_snapshots, []);
  assert.deepEqual(await selectQualifiedFallback({ attemptReceipt: receipt, registry: null, environment, platform: 'win32' }),
    { status: 'registry_unavailable' });
});

test('DHR_34: no qualified fallback produces the frozen canonical pause identity chain', () => {
  const frozen = {
    executor_profile_id: 'herdr.codex.backup', account_alias: 'acct-backup',
    config_fingerprint: HASH, executor_capability_hash: HASH,
  };
  const pause = buildFallbackPause({
    runId: 'RUN-1', nodeId: 'node-1', raisedAt: '2026-08-30T00:00:00.000Z',
    attemptReceipt: {
      receipt_id: 'receipt-1', attempt_id: 'attempt-1', fallback_profile_snapshots: [frozen],
    },
  });
  assert.equal(pause.reason_code, 'E_FALLBACK_UNAVAILABLE');
  assert.deepEqual(pause.manual_retry_profiles, [frozen]);
  assert.equal(pause.fence.attempt_id, 'attempt-1');
  assert.equal(pause.attention.state, 'open');
  assert.match(pause.pause_id, /^[0-9a-f]{64}$/);
});

async function driverFixture(t, { fallbackPlatforms = ['win32'], fallbackFallbackIds = [], thirdProjection = true } = {}) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr34-driver-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const runId = 'R001-dhr34-quota-fallback';
  const root = join(repoRoot, '.dh-relay', runId);
  await mkdir(root, { recursive: true });
  const configRoot = join(repoRoot, 'config');
  await mkdir(configRoot, { recursive: true });
  await writeFile(join(configRoot, 'profile.json'), JSON.stringify({ model: 'test-model' }), 'utf8');
  const source = profile('herdr.codex.source', 'acct-source', configRoot, {
    quota_detector_id: TEST_DETECTOR_ID, fallback_profile_ids: ['herdr.codex.backup'],
  });
  const fallback = profile('herdr.codex.backup', 'acct-backup', configRoot, {
    supported_platforms: fallbackPlatforms, quota_detector_id: TEST_DETECTOR_ID,
    fallback_profile_ids: fallbackFallbackIds,
  });
  const third = profile('herdr.codex.third', 'acct-third', configRoot,
    thirdProjection ? {} : { config_fingerprint_rule: undefined });
  const registryPath = join(repoRoot, 'executor-profiles.json');
  await writeFile(registryPath, JSON.stringify({ profiles: [source, fallback, third] }), 'utf8');
  const run = {
    protocol: 'relay.run/v2', run_id: runId, workflow_name: 'dhr34', summary: 'quota fallback',
    trigger: 'system', trigger_by: null, created_at: '2026-08-30T00:00:00Z', labels: [],
    nodes: [{
      node_id: 'agent', title: 'agent', role: '执行', required: false, depends_on: [],
      executor_profiles: [{ kind: 'herdr-agent', ref: source.executor_profile_id }],
    }],
  };
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: run.created_at });
  return { repoRoot, root, runId, registryPath, store, source, fallback, third,
    environment: { DHR34_CONFIG: configRoot } };
}

test('DHR_34: confirmed quota starts one qualified fallback as a fresh Attempt', async (t) => {
  const fixture = await driverFixture(t);
  const fake = makeFakeHerdr({ statuses: ['idle', 'done', 'idle', 'done'], read: 'sanitized-result' });
  let judged = 0;
  const driver = startWorkflowDriver({
    repoRoot: fixture.repoRoot, runId: fixture.runId, actor: { submitControl: fn => fn(fixture.store) },
    herdrCli: fake.cli, herdrRegistryPath: fixture.registryPath, profileEnvironment: fixture.environment,
    quotaDetectors: TEST_QUOTA_DETECTORS, platform: 'win32',
    herdrPollMs: 1, herdrJudge: () => judged++ === 0
      ? { outcome: 'failed', reason: 'E_EXECUTOR_EXIT_NONZERO', structured: {
        quota_signal: { http_status: 429, error_code: 'usage_limit_reached' },
      } }
      : { outcome: 'succeeded', reason: null, structured: { verdict: 'ok' } },
  });
  t.after(() => driver.stop());
  assert.deepEqual(await driver.done, { ok: true });
  const starts = fixture.store.events.filter(event => event.kind === 'attempt_started');
  assert.equal(starts.length, 2);
  assert.notEqual(starts[0].attempt_id, starts[1].attempt_id);
  const receipts = await Promise.all(starts.map(async event => JSON.parse(await readFile(
    join(fixture.root, 'receipts', `${event.detail.replace(/^receipt:/, '')}.json`), 'utf8'))));
  assert.equal(receipts[0].executor_identity.executor_profile_id, 'herdr.codex.source');
  assert.equal(receipts[1].executor_identity.executor_profile_id, 'herdr.codex.backup');
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_failed').length, 1);
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_succeeded').length, 1);
  assert.deepEqual(await fixture.store.appendCheckpoint({
    receipt_id: receipts[0].receipt_id, node_id: 'agent', attempt_id: receipts[0].attempt_id,
    checkpoint_id: 'late-source', payload_digest: HASH, at: '2026-08-30T00:00:02.000Z',
  }), { ok: false, reason: 'E_IDENTITY_MISMATCH' });
  assert.deepEqual(await fixture.store.appendResult({
    receipt_id: receipts[0].receipt_id, node_id: 'agent', attempt_id: receipts[0].attempt_id,
    executor_kind: 'herdr-agent', outcome: 'succeeded', reason: null,
    at: '2026-08-30T00:00:03.000Z', payload_digest: HASH, structured: {},
  }), { ok: false, reason: 'late_result_quarantined' });
});

test('DHR_34: confirmed quota without a qualified fallback pauses and opens no Attempt', async (t) => {
  const fixture = await driverFixture(t, { fallbackPlatforms: ['linux'] });
  const fake = makeFakeHerdr({ statuses: ['idle', 'done'], read: 'sanitized-result' });
  const driver = startWorkflowDriver({
    repoRoot: fixture.repoRoot, runId: fixture.runId, actor: { submitControl: fn => fn(fixture.store) },
    herdrCli: fake.cli, herdrRegistryPath: fixture.registryPath, profileEnvironment: fixture.environment,
    quotaDetectors: TEST_QUOTA_DETECTORS, platform: 'win32',
    herdrPollMs: 1, herdrJudge: () => ({
      outcome: 'failed', reason: 'E_EXECUTOR_EXIT_NONZERO',
      structured: { quota_signal: { http_status: 429, error_code: 'usage_limit_reached' } },
    }),
  });
  t.after(() => driver.stop());
  assert.deepEqual(await driver.done, { ok: true });
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_started').length, 1);
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_failed').length, 0);
  assert.equal(fixture.store.events.filter(event => event.kind === 'fallback_pause_created').length, 1);
  assert.equal((await fixture.store.readState()).node_states[0].status, 'waiting_human');
});

test('DHR_34: a failed canonical pause write fails closed without a text-only Attention', async (t) => {
  const fixture = await driverFixture(t, { fallbackPlatforms: ['linux'] });
  const guardedStore = new Proxy(fixture.store, { get(target, property) {
    if (property === 'appendFallbackPause') return async () => { throw new Error('E_STORE_WRITE_FAILED:test'); };
    return Reflect.get(target, property);
  } });
  const fake = makeFakeHerdr({ statuses: ['idle', 'done'], read: 'sanitized-result' });
  const driver = startWorkflowDriver({
    repoRoot: fixture.repoRoot, runId: fixture.runId, actor: { submitControl: fn => fn(guardedStore) },
    herdrCli: fake.cli, herdrRegistryPath: fixture.registryPath, profileEnvironment: fixture.environment,
    quotaDetectors: TEST_QUOTA_DETECTORS, platform: 'win32',
    herdrPollMs: 1, herdrJudge: () => ({
      outcome: 'failed', reason: 'E_EXECUTOR_EXIT_NONZERO',
      structured: { quota_signal: { http_status: 429, error_code: 'usage_limit_reached' } },
    }),
  });
  t.after(() => driver.stop());
  const outcome = await driver.done;
  assert.equal(outcome.ok, false);
  assert.match(outcome.error.message, /E_STORE_WRITE_FAILED/);
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_failed').length, 0);
  assert.equal(fixture.store.events.filter(event => event.kind === 'fallback_pause_created').length, 0);
  assert.equal(fixture.store.events.filter(event => event.kind === 'human_input_requested').length, 0);
});

test('DHR_34: permission failure remains terminal and never switches identity', async (t) => {
  const fixture = await driverFixture(t);
  const fake = makeFakeHerdr({ statuses: ['idle', 'done'], read: 'sanitized-result' });
  const driver = startWorkflowDriver({
    repoRoot: fixture.repoRoot, runId: fixture.runId, actor: { submitControl: fn => fn(fixture.store) },
    herdrCli: fake.cli, herdrRegistryPath: fixture.registryPath, profileEnvironment: fixture.environment,
    quotaDetectors: TEST_QUOTA_DETECTORS, platform: 'win32',
    herdrPollMs: 1, herdrJudge: () => ({
      outcome: 'failed', reason: 'E_EXECUTOR_EXIT_NONZERO',
      structured: { quota_signal: { http_status: 403, error_code: 'permission_denied' } },
    }),
  });
  t.after(() => driver.stop());
  assert.deepEqual(await driver.done, { ok: true });
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_started').length, 1);
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_failed').length, 1);
  assert.equal(fixture.store.events.filter(event => event.kind === 'fallback_pause_created').length, 0);
});

test('DHR_34: an unregistered detector cannot trigger an automatic identity switch', async (t) => {
  const fixture = await driverFixture(t);
  const fake = makeFakeHerdr({ statuses: ['idle', 'done'], read: 'sanitized-result' });
  const driver = startWorkflowDriver({
    repoRoot: fixture.repoRoot, runId: fixture.runId, actor: { submitControl: fn => fn(fixture.store) },
    herdrCli: fake.cli, herdrRegistryPath: fixture.registryPath, profileEnvironment: fixture.environment,
    platform: 'win32', herdrPollMs: 1, herdrJudge: () => ({
      outcome: 'failed', reason: 'E_EXECUTOR_EXIT_NONZERO',
      structured: { quota_signal: { http_status: 429, error_code: 'usage_limit_reached' } },
    }),
  });
  t.after(() => driver.stop());
  assert.deepEqual(await driver.done, { ok: true });
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_started').length, 1);
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_failed').length, 1);
  assert.equal(fixture.store.events.filter(event => event.kind === 'fallback_pause_created').length, 0);
});

test('DHR_34: an unsignable nested fallback makes the candidate unavailable and pauses canonically', async (t) => {
  const fixture = await driverFixture(t, {
    fallbackFallbackIds: ['herdr.codex.third'], thirdProjection: false,
  });
  const fake = makeFakeHerdr({ statuses: ['idle', 'done'], read: 'sanitized-result' });
  const driver = startWorkflowDriver({
    repoRoot: fixture.repoRoot, runId: fixture.runId, actor: { submitControl: fn => fn(fixture.store) },
    herdrCli: fake.cli, herdrRegistryPath: fixture.registryPath, profileEnvironment: fixture.environment,
    quotaDetectors: TEST_QUOTA_DETECTORS, platform: 'win32', herdrPollMs: 1,
    herdrJudge: () => ({ outcome: 'failed', reason: 'E_EXECUTOR_EXIT_NONZERO',
      structured: { quota_signal: { http_status: 429, error_code: 'usage_limit_reached' } } }),
  });
  t.after(() => driver.stop());
  assert.deepEqual(await driver.done, { ok: true });
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_started').length, 1);
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_failed').length, 0);
  assert.equal(fixture.store.events.filter(event => event.kind === 'fallback_pause_created').length, 1);
  assert.equal(fixture.store.events.filter(event => event.kind === 'human_input_requested').length, 0);
});

test('DHR_34: fallback quota pauses for human choice and cannot chain to a third identity', async (t) => {
  const fixture = await driverFixture(t, { fallbackFallbackIds: ['herdr.codex.third'] });
  const fake = makeFakeHerdr({ statuses: ['idle', 'done', 'idle', 'done'], read: 'sanitized-result' });
  const driver = startWorkflowDriver({
    repoRoot: fixture.repoRoot, runId: fixture.runId, actor: { submitControl: fn => fn(fixture.store) },
    herdrCli: fake.cli, herdrRegistryPath: fixture.registryPath, profileEnvironment: fixture.environment,
    quotaDetectors: TEST_QUOTA_DETECTORS, platform: 'win32',
    herdrPollMs: 1, herdrJudge: () => ({
      outcome: 'failed', reason: 'E_EXECUTOR_EXIT_NONZERO',
      structured: { quota_signal: { http_status: 429, error_code: 'usage_limit_reached' } },
    }),
  });
  t.after(() => driver.stop());
  assert.deepEqual(await driver.done, { ok: true });
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_started').length, 2);
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_failed').length, 1);
  assert.equal(fixture.store.events.filter(event => event.kind === 'fallback_pause_created').length, 1);
  assert.equal((await fixture.store.readState()).node_states[0].status, 'waiting_human');
});

test('DHR_34: an invalid current registry fails closed through canonical pause', async (t) => {
  const fixture = await driverFixture(t);
  const fake = makeFakeHerdr({ statuses: ['idle', 'done'], read: 'sanitized-result' });
  const driver = startWorkflowDriver({
    repoRoot: fixture.repoRoot, runId: fixture.runId, actor: { submitControl: fn => fn(fixture.store) },
    herdrCli: fake.cli, herdrRegistryPath: fixture.registryPath, profileEnvironment: fixture.environment,
    quotaDetectors: TEST_QUOTA_DETECTORS, platform: 'win32',
    herdrPollMs: 1, herdrJudge: () => {
      writeFileSync(fixture.registryPath, '{', 'utf8');
      return { outcome: 'failed', reason: 'E_EXECUTOR_EXIT_NONZERO',
        structured: { quota_signal: { http_status: 429, error_code: 'usage_limit_reached' } } };
    },
  });
  t.after(() => driver.stop());
  assert.deepEqual(await driver.done, { ok: true });
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_started').length, 1);
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_failed').length, 0);
  assert.equal(fixture.store.events.filter(event => event.kind === 'fallback_pause_created').length, 1);
});

test('DHR_34: recovery trusts the fallback Receipt and cannot regain automatic chaining', async (t) => {
  const fixture = await driverFixture(t, { fallbackFallbackIds: ['herdr.codex.third'] });
  const fallbackIdentity = createExecutorIdentity(fixture.fallback, { '/model': 'test-model' });
  const thirdIdentity = createExecutorIdentity(fixture.third, { '/model': 'test-model' });
  const issuedAt = '2026-08-30T00:00:01.000Z';
  await fixture.store.appendEvent({ kind: 'node_started', at: issuedAt, node_id: 'agent' });
  await fixture.store.registerAttemptReceipt({
    protocol: 'relay.attempt-receipt/v1', receipt_id: 'rcpt-recovered-fallback',
    run_id: fixture.runId, node_id: 'agent', attempt_id: 'attempt-recovered-fallback', issued_at: issuedAt,
    executor_identity: fallbackIdentity, fallback_profile_snapshots: [thirdIdentity],
  });
  await fixture.store.appendEvent({
    kind: 'host_observation_changed', at: issuedAt, node_id: 'agent', attempt_id: 'attempt-recovered-fallback',
    executor_ref: 'recovered-fallback', observation_status: 'alive',
    detail: `herdr_status=working;agent=recovered-fallback;pane=recovered-pane;seq=1;work_dir_root=${fixture.repoRoot};profile=${fixture.source.executor_profile_id}`,
  });
  const fake = makeFakeHerdr({ statuses: ['done', 'done'], read: 'sanitized-result' });
  const driver = startWorkflowDriver({
    repoRoot: fixture.repoRoot, runId: fixture.runId, actor: { submitControl: fn => fn(fixture.store) },
    herdrCli: fake.cli, herdrRegistryPath: fixture.registryPath, profileEnvironment: fixture.environment,
    quotaDetectors: TEST_QUOTA_DETECTORS, platform: 'win32',
    herdrPollMs: 1, herdrJudge: () => ({
      outcome: 'failed', reason: 'E_EXECUTOR_EXIT_NONZERO',
      structured: { quota_signal: { http_status: 429, error_code: 'usage_limit_reached' } },
    }),
  });
  t.after(() => driver.stop());
  assert.deepEqual(await driver.done, { ok: true });
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_started').length, 1);
  assert.equal(fixture.store.events.filter(event => event.kind === 'attempt_failed').length, 0);
  assert.equal(fixture.store.events.filter(event => event.kind === 'fallback_pause_created').length, 1);
});
