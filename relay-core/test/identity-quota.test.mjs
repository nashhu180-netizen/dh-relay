import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createExecutorIdentity } from '../profiles/identity.mjs';
import { retryWithFrozenProfile } from '../runtime/attempt-retry.mjs';
import { buildFallbackPause, selectQualifiedFallback } from '../runtime/executors/identity/fallback.mjs';
import { classifyQuota } from '../runtime/executors/quota/classifier.mjs';
import { createStore } from '../store/store.mjs';

const HASH = 'a'.repeat(64);
const TEST_DETECTOR_ID = 'synthetic-usage-limit/v1';
const SHA256_HEX = /^[0-9a-f]{64}$/;
const capabilities = { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' };

function profile(id, account, pathTemplate, extra = {}) {
  return {
    executor_profile_id: id, backend: 'herdr', product: 'codex-cli', command_alias: 'codex', account_alias: account,
    capabilities, supported_platforms: ['win32'], headless_supported: true,
    config_fingerprint_rule: { kind: 'file-exists', path_template: pathTemplate, fields: [{ pointer: '/model', classification: 'nonsecret' }] },
    ...extra,
  };
}

async function mutationSnapshot(runRoot) {
  const files = async directory => (await readdir(join(runRoot, directory))).sort();
  return {
    eventsText: await readFile(join(runRoot, 'events.jsonl'), 'utf8'),
    stateText: await readFile(join(runRoot, 'state.json'), 'utf8'),
    resultFiles: await files('results'),
    receiptFiles: await files('receipts'),
    pauseFiles: await files('pauses'),
    resolutionFiles: await files('pause-resolutions'),
  };
}

test('DHR_34: quota requires registered structured evidence', () => {
  const detectors = { [TEST_DETECTOR_ID]: { status: 429, code: 'usage_limit_reached' } };
  assert.deepEqual(classifyQuota({ detectorId: TEST_DETECTOR_ID, signal: { http_status: 429, error_code: 'usage_limit_reached' }, detectors }),
    { classification: 'quota_confirmed', detector_id: TEST_DETECTOR_ID });
  assert.equal(classifyQuota({ detectorId: TEST_DETECTOR_ID, signal: { http_status: 429, error_code: 'rate_limited' }, detectors }).classification, 'not_quota');
  assert.equal(classifyQuota({ detectorId: 'unknown', signal: { http_status: 429, error_code: 'usage_limit_reached' }, detectors }).classification, 'unknown');
  assert.equal(classifyQuota({ detectorId: TEST_DETECTOR_ID, signal: { message: 'usage limit reached' }, detectors }).classification, 'unknown');
});

test('DHR_34: fallback selection honors the frozen Receipt snapshot', async t => {
  const root = await mkdtemp(join(tmpdir(), 'dhr34-fallback-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'profile.json'), JSON.stringify({ model: 'test-model' }));
  const environment = { DHR34_CONFIG: root };
  const template = '${DHR34_CONFIG}/profile.json';
  const linux = profile('herdr.codex.linux', 'acct-linux', template, { supported_platforms: ['linux'] });
  const stale = profile('herdr.codex.stale', 'acct-stale', template);
  const qualified = profile('herdr.codex.qualified', 'acct-qualified', template);
  const unsignable = profile('herdr.codex.unsignable', 'acct-unsignable', template, { fallback_profile_ids: ['herdr.codex.unconfigured'] });
  const unconfigured = profile('herdr.codex.unconfigured', 'acct-unconfigured', template);
  delete unconfigured.config_fingerprint_rule;
  const receipt = { fallback_profile_snapshots: [
    createExecutorIdentity(linux, { '/model': 'test-model' }),
    createExecutorIdentity(stale, { '/model': 'old-model' }),
    createExecutorIdentity(qualified, { '/model': 'test-model' }),
  ] };
  const selected = await selectQualifiedFallback({ attemptReceipt: receipt, registry: { profiles: [linux, stale, qualified] }, environment, platform: 'win32' });
  assert.equal(selected.status, 'selected');
  assert.equal(selected.profile.executor_profile_id, qualified.executor_profile_id);
  assert.deepEqual(await selectQualifiedFallback({
    attemptReceipt: { fallback_profile_snapshots: [
      receipt.fallback_profile_snapshots[0],
      receipt.fallback_profile_snapshots[1],
      createExecutorIdentity(unsignable, { '/model': 'test-model' }),
    ] },
    registry: { profiles: [linux, stale, unsignable, unconfigured] }, environment, platform: 'win32',
  }), { status: 'fallback_unavailable' });
  assert.deepEqual(await selectQualifiedFallback({ attemptReceipt: receipt, registry: null, environment, platform: 'win32' }), { status: 'registry_unavailable' });
});

test('DHR_34: canonical pause permits an explicit frozen-profile retry only', async t => {
  const root = await mkdtemp(join(tmpdir(), 'dhr34-retry-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const profileHome = join(root, 'profile');
  await mkdir(profileHome);
  await writeFile(join(profileHome, 'profile.json'), JSON.stringify({ model: 'test-model' }));
  const environment = { DHR34_CONFIG: profileHome };
  const main = profile('herdr.codex.main', 'acct-main', '${DHR34_CONFIG}/profile.json');
  const backup = profile('herdr.codex.backup', 'acct-backup', '${DHR34_CONFIG}/profile.json');
  await writeFile(join(root, 'registry.json'), JSON.stringify({ profiles: [main, backup] }));
  const frozen = createExecutorIdentity(backup, { '/model': 'test-model' });
  const run = { protocol: 'relay.run/v2', run_id: 'RUN-dhr34', workflow_name: 'quota', summary: 'quota retry', trigger: 'system', trigger_by: null, created_at: '2026-09-07T00:00:00Z', labels: [], nodes: [{ node_id: 'agent', title: 'agent', required: false, executor_profiles: [{ kind: 'herdr-agent', ref: main.executor_profile_id }] }] };
  const store = await createStore({ root: join(root, 'run'), run });
  const receipt = { protocol: 'relay.attempt-receipt/v1', receipt_id: 'receipt-1', run_id: run.run_id, node_id: 'agent', attempt_id: 'attempt-1', issued_at: '2026-09-07T00:00:00.000Z', executor_identity: createExecutorIdentity(main, { '/model': 'test-model' }), fallback_profile_snapshots: [frozen] };
  await store.registerAttemptReceipt(receipt);
  const pause = buildFallbackPause({ runId: run.run_id, nodeId: 'agent', attemptReceipt: receipt, raisedAt: '2026-09-07T00:00:01.000Z' });
  const samePause = buildFallbackPause({ runId: run.run_id, nodeId: 'agent', attemptReceipt: receipt, raisedAt: '2026-09-07T00:00:01.000Z' });
  assert.deepEqual({
    protocol: pause.protocol, run_id: pause.run_id, node_id: pause.node_id, attempt_id: pause.attempt_id,
    receipt_id: pause.receipt_id, reason_code: pause.reason_code, raised_at: pause.raised_at,
  }, {
    protocol: 'relay.fallback-pause/v1', run_id: run.run_id, node_id: 'agent', attempt_id: 'attempt-1',
    receipt_id: 'receipt-1', reason_code: 'E_FALLBACK_UNAVAILABLE', raised_at: '2026-09-07T00:00:01.000Z',
  });
  assert.deepEqual({
    protocol: pause.fence.protocol, attempt_id: pause.fence.attempt_id, receipt_id: pause.fence.receipt_id,
    reason_code: pause.fence.reason_code, fenced_at: pause.fence.fenced_at,
  }, {
    protocol: 'relay.attempt-fence/v1', attempt_id: 'attempt-1', receipt_id: 'receipt-1',
    reason_code: 'E_FALLBACK_UNAVAILABLE', fenced_at: '2026-09-07T00:00:01.000Z',
  });
  assert.deepEqual({
    protocol: pause.attention.protocol, run_id: pause.attention.run_id, node_id: pause.attention.node_id,
    attempt_id: pause.attention.attempt_id, receipt_id: pause.attention.receipt_id,
    reason_code: pause.attention.reason_code, state: pause.attention.state, raised_at: pause.attention.raised_at,
  }, {
    protocol: 'relay.attention/v1', run_id: run.run_id, node_id: 'agent', attempt_id: 'attempt-1',
    receipt_id: 'receipt-1', reason_code: 'E_FALLBACK_UNAVAILABLE', state: 'open', raised_at: '2026-09-07T00:00:01.000Z',
  });
  for (const id of [pause.pause_id, pause.fence.fence_id, pause.attention.attention_id]) assert.match(id, SHA256_HEX);
  assert.equal(pause.pause_id, samePause.pause_id);
  assert.equal(pause.fence.fence_id, samePause.fence.fence_id);
  assert.equal(pause.attention.attention_id, samePause.attention.attention_id);
  assert.deepEqual(pause.manual_retry_profiles, receipt.fallback_profile_snapshots);
  await store.appendFallbackPause(pause);
  const result = await retryWithFrozenProfile({ store, registryPath: join(root, 'registry.json'), environment, params: { run_id: run.run_id, node_id: 'agent', pause_id: pause.pause_id, executor_profile_id: backup.executor_profile_id, retry_request_id: HASH }, now: () => '2026-09-07T00:00:02.000Z' });
  assert.equal(result.ok, true);
  assert.equal(result.attempt_receipt.result_submission_mode, 'receipt-bound/v1');
  assert.equal(result.attempt_receipt.run_id, run.run_id);
  assert.equal(result.attempt_receipt.node_id, 'agent');
  assert.equal(result.attempt_receipt.executor_identity.executor_profile_id, backup.executor_profile_id);
  assert.deepEqual(result.attempt_receipt.executor_identity, frozen);
  assert.match(result.attempt_receipt.attempt_id, /^retry-/);
  assert.notEqual(result.attempt_receipt.attempt_id, receipt.attempt_id);
  assert.match(result.attempt_receipt.receipt_id, /^receipt-/);
  assert.notEqual(result.attempt_receipt.receipt_id, receipt.receipt_id);
  assert.deepEqual(await store.openAttentions(), []);
});

test('DHR_34: non-frozen profile retry is rejected without mutation', async t => {
  const root = await mkdtemp(join(tmpdir(), 'dhr34-retry-rejected-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const profileHome = join(root, 'profile');
  await mkdir(profileHome);
  await writeFile(join(profileHome, 'profile.json'), JSON.stringify({ model: 'test-model' }));
  const environment = { DHR34_CONFIG: profileHome };
  const main = profile('herdr.codex.main', 'acct-main', '${DHR34_CONFIG}/profile.json');
  const backup = profile('herdr.codex.backup', 'acct-backup', '${DHR34_CONFIG}/profile.json');
  await writeFile(join(root, 'registry.json'), JSON.stringify({ profiles: [main, backup] }));
  const frozen = createExecutorIdentity(backup, { '/model': 'test-model' });
  const run = { protocol: 'relay.run/v2', run_id: 'RUN-dhr34-rejected', workflow_name: 'quota', summary: 'quota retry', trigger: 'system', trigger_by: null, created_at: '2026-09-07T00:00:00Z', labels: [], nodes: [{ node_id: 'agent', title: 'agent', required: false, executor_profiles: [{ kind: 'herdr-agent', ref: main.executor_profile_id }] }] };
  const runRoot = join(root, 'run');
  const store = await createStore({ root: runRoot, run });
  const receipt = { protocol: 'relay.attempt-receipt/v1', receipt_id: 'receipt-1', run_id: run.run_id, node_id: 'agent', attempt_id: 'attempt-1', issued_at: '2026-09-07T00:00:00.000Z', executor_identity: createExecutorIdentity(main, { '/model': 'test-model' }), fallback_profile_snapshots: [frozen] };
  await store.registerAttemptReceipt(receipt);
  const pause = buildFallbackPause({ runId: run.run_id, nodeId: 'agent', attemptReceipt: receipt, raisedAt: '2026-09-07T00:00:01.000Z' });
  await store.appendFallbackPause(pause);
  const before = await mutationSnapshot(runRoot);
  await assert.rejects(
    retryWithFrozenProfile({ store, registryPath: join(root, 'registry.json'), environment, params: { run_id: run.run_id, node_id: 'agent', pause_id: pause.pause_id, executor_profile_id: main.executor_profile_id, retry_request_id: HASH }, now: () => '2026-09-07T00:00:02.000Z' }),
    { message: 'E_FALLBACK_PAUSE_RESOLUTION_INVALID:profile-not-frozen' },
  );
  assert.deepEqual(await mutationSnapshot(runRoot), before);
});
