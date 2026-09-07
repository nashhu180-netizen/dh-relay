import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { localCapabilityHashV2 } from '../rpc/capabilities.mjs';
import { createTransportClient } from '../rpc/transport.mjs';
import { endpointForRepo } from '../runtime/endpoint.mjs';
import { writeLedger } from '../runtime/ledger.mjs';
import { startRuntimeService } from '../runtime/service.mjs';
import { startWorkflowDriver } from '../runtime/workflow-driver.mjs';
import { createStore, receiptBoundResultDigest } from '../store/store.mjs';
import { retryWithFrozenProfile } from '../runtime/attempt-retry.mjs';
import { createExecutorIdentity } from '../profiles/identity.mjs';
import { loadAjv, validateOne } from '../tools/validate.mjs';
import { makeFakeHerdr } from './helpers/fake-herdr.mjs';

const execFileAsync = promisify(execFile);
const contracts = loadAjv();
const INSTRUCTION = 'DHR80 bridge test task';
const instruction_ref = { path: 'task.md', sha256: createHash('sha256').update(INSTRUCTION, 'utf8').digest('hex') };

const run = {
  protocol: 'relay.run/v2', run_id: 'R001-dhr80-rpc-20260907', workflow_name: 'dhr80',
  summary: 'DHR80 retry result bridge', trigger: 'system', created_at: '2026-09-07T00:00:00Z', labels: [],
  nodes: [{ node_id: 'node-a', title: 'A', role: 'work', required: false,
    executor_profiles: [{ kind: 'herdr-agent', ref: 'herdr.codex.main' }], instruction_ref }],
};

const dhr80Profile = {
  executor_profile_id: 'herdr.codex.main', backend: 'herdr', product: 'codex-cli', command_alias: 'codex',
  account_alias: 'acct-codex-main',
  capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported',
    structured_result: 'supported', user_input_passthrough: 'supported' },
  supported_platforms: [process.platform], headless_supported: true,
  config_fingerprint_rule: { kind: 'file-exists', path_template: '${DHR80_PROFILE_HOME}/config.toml',
    fields: [{ pointer: '/model', classification: 'nonsecret' }] },
};
const dhr80Identity = createExecutorIdentity(dhr80Profile, { '/model': 'test-model' });
const sha256 = (...parts) => createHash('sha256').update(parts.join('\n'), 'utf8').digest('hex');

const until = async (check, timeoutMs = 8_000) => {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() >= deadline) throw new Error('timeout');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
};

async function makeRepo(prefix) {
  const repoRoot = await mkdtemp(join(tmpdir(), prefix));
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  return repoRoot;
}

async function bootstrapV2(t, endpoint) {
  let response = null;
  const client = await createTransportClient(endpoint, { onFrame: frame => { response = frame; } });
  t.after(() => client.destroy());
  client.send({ protocol: 'relay.rpc-bootstrap/v1' });
  return until(() => response);
}

async function connectV2(t, endpoint, { clientId = 'dhr80-v2-test', requestPrefix = 'dhr80-v2' } = {}) {
  const responses = new Map();
  const client = await createTransportClient(endpoint, {
    onFrame: (frame) => {
      const verdict = validateOne(contracts.ajv, contracts.byId, 'relay.rpc/v2', frame);
      assert.ok(verdict.ok, `v2 服务端帧不合合同：${verdict.reason}@${verdict.at} ${JSON.stringify(frame)}`);
      if ('id' in frame) responses.set(frame.id, frame);
    },
  });
  t.after(() => client.destroy());
  let nextId = 0;
  const call = async (method, params) => {
    const id = (nextId += 1);
    client.send({
      jsonrpc: '2.0', id, method,
      handshake: {
        protocol_version: 'relay.rpc/v2', runtime_version: '0.0.0', capability_hash: localCapabilityHashV2(),
        client_id: clientId, request_id: `${requestPrefix}-${id}`,
      },
      params,
    });
    return until(() => responses.get(id));
  };
  return { call, client };
}

async function mutationSnapshot(runRoot) {
  const eventsText = await readFile(join(runRoot, 'events.jsonl'), 'utf8');
  const stateText = await readFile(join(runRoot, 'state.json'), 'utf8');
  const events = eventsText.trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
  return {
    eventsText,
    stateText,
    events,
    resultFiles: (await readdir(join(runRoot, 'results'))).sort(),
    receiptFiles: (await readdir(join(runRoot, 'receipts'))).sort(),
    pauseFiles: (await readdir(join(runRoot, 'pauses'))).sort(),
    resolutionFiles: (await readdir(join(runRoot, 'pause-resolutions'))).sort(),
    attemptFacts: events.filter(event => ['attempt_started', 'attempt_succeeded', 'attempt_failed'].includes(event.kind)),
  };
}

function fallbackPauseFor(receipt, { raisedAt = '2026-09-07T00:00:01.000Z', manualRetryProfiles = [dhr80Identity] } = {}) {
  const reason = 'E_FALLBACK_UNAVAILABLE';
  const parts = [receipt.run_id, receipt.node_id, receipt.attempt_id, receipt.receipt_id, reason];
  return {
    protocol: 'relay.fallback-pause/v1',
    pause_id: sha256('fallback-pause/v1', ...parts),
    run_id: receipt.run_id, node_id: receipt.node_id, attempt_id: receipt.attempt_id, receipt_id: receipt.receipt_id,
    reason_code: reason, raised_at: raisedAt,
    fence: {
      protocol: 'relay.attempt-fence/v1', fence_id: sha256('attempt-fence/v1', ...parts),
      attempt_id: receipt.attempt_id, receipt_id: receipt.receipt_id, reason_code: reason, fenced_at: raisedAt,
    },
    attention: {
      protocol: 'relay.attention/v1', attention_id: sha256('attention/v1', ...parts),
      run_id: receipt.run_id, node_id: receipt.node_id, attempt_id: receipt.attempt_id, receipt_id: receipt.receipt_id,
      reason_code: reason, state: 'open', raised_at: raisedAt,
    },
    manual_retry_profiles: manualRetryProfiles,
  };
}

async function bootRetryService(t, { initialReceiptMode = false, includeOlderReceipt = false,
  runId = 'R001-dhr80-rpc-20260907' } = {}) {
  const repoRoot = await makeRepo('dhr80-rpc-scenario-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const runDocument = { ...run, run_id: runId };
  const runRoot = join(repoRoot, '.dh-relay', runId);
  const profileHome = join(repoRoot, 'profile');
  const registryPath = join(repoRoot, 'profiles.json');
  const runtimeRoot = join(repoRoot, 'runtime');
  await mkdir(profileHome, { recursive: true });
  await mkdir(runtimeRoot, { recursive: true });
  await writeFile(join(profileHome, 'config.toml'), 'model = "test-model"\n', 'utf8');
  await writeFile(join(repoRoot, 'task.md'), INSTRUCTION, 'utf8');
  await writeFile(registryPath, JSON.stringify({ profiles: [dhr80Profile] }), 'utf8');
  const initialReceipt = {
    protocol: 'relay.attempt-receipt/v1', receipt_id: 'receipt-dhr80-old', run_id: runId,
    node_id: 'node-a', attempt_id: 'attempt-dhr80-old', issued_at: '2026-09-07T00:00:00.000Z',
    executor_identity: dhr80Identity, fallback_profile_snapshots: [dhr80Identity],
    ...(initialReceiptMode ? { result_submission_mode: 'receipt-bound/v1' } : {}),
  };
  const olderReceipt = includeOlderReceipt ? {
    ...initialReceipt, receipt_id: 'receipt-dhr80-older', attempt_id: 'attempt-dhr80-older',
    issued_at: '2026-09-06T23:59:00.000Z', result_submission_mode: 'receipt-bound/v1',
  } : null;
  const pause = fallbackPauseFor(initialReceipt);
  const store = await createStore({ root: runRoot, run: runDocument });
  if (olderReceipt) await store.registerAttemptReceipt(olderReceipt);
  await store.registerAttemptReceipt(initialReceipt);
  await store.appendFallbackPause(pause);
  await writeLedger(repoRoot, { version: 1, next_seq: 1, operations: {
    claim: { run_id: runId, phase: 'accepted', receipt_id: null },
  } });
  const endpoint = endpointForRepo(repoRoot, { runtimeRoot });
  const v2Endpoint = endpointForRepo(repoRoot, { runtimeRoot, channel: 'v2' });
  const bootstrapEndpoint = endpointForRepo(repoRoot, { runtimeRoot, channel: 'bootstrap' });
  let service = await startRuntimeService({
    repoRoot, endpoint, v2Endpoint, bootstrapEndpoint, localUserCapability: 'local-capability',
    indexPath: join(runtimeRoot, 'runs.json'), executorProfileRegistryPath: registryPath,
    profileEnvironment: { DHR80_PROFILE_HOME: profileHome },
  });
  t.after(() => service?.close().catch(() => {}));
  const v2 = await connectV2(t, v2Endpoint);
  const authorized = await v2.call('contracts', {
    descriptor_version: service.descriptor.descriptor_version, repo_id: service.descriptor.repo_id,
    generation: service.descriptor.generation, local_user_capability: 'local-capability',
  });
  assert.deepEqual(authorized.result, service.v2Descriptor);
  const retry = (retryRequestId = 'b'.repeat(64), executorProfileId = dhr80Profile.executor_profile_id,
    pauseId = pause.pause_id) => v2.call('retry-with-profile', {
    run_id: runId, node_id: 'node-a', pause_id: pauseId,
    executor_profile_id: executorProfileId, retry_request_id: retryRequestId,
  });
  const submit = (receiptId, outcome = 'succeeded', reason = null) => v2.call('submit-executor-result', {
    protocol: 'relay.executor-result-submission/v1', receipt_id: receiptId, outcome, reason,
  });
  return { repoRoot, runRoot, runtimeRoot, profileHome, registryPath, profileEnvironment: { DHR80_PROFILE_HOME: profileHome },
    runDocument, olderReceipt, initialReceipt, pause, service, v2, retry, submit };
}

const rpcReason = frame => frame.error?.data?.reason ?? frame.result?.reason;
const eventKinds = snapshot => snapshot.eventsText.trim().split(/\r?\n/).filter(Boolean)
  .map(line => JSON.parse(line).kind);

function withoutStateSignature(state) {
  const { state_signature: ignored, ...unsigned } = state;
  return unsigned;
}

function assertOnlyLegalRetryMutation(before, after, { resolution, receipt }) {
  const appendedEvents = after.events.slice(before.events.length);
  assert.equal(appendedEvents.length, 2, 'a legal retry must append exactly two events');
  assert.deepEqual(after.events.slice(0, before.events.length), before.events);
  assert.equal(after.eventsText,
    `${before.eventsText}${appendedEvents.map(event => `${JSON.stringify(event)}\n`).join('')}`);
  assert.deepEqual(after.resultFiles, before.resultFiles);
  assert.deepEqual(after.pauseFiles, before.pauseFiles);
  assert.deepEqual(after.receiptFiles, [...before.receiptFiles, `${receipt.receipt_id}.json`].sort());
  assert.deepEqual(after.resolutionFiles,
    [...before.resolutionFiles, `${resolution.pause_id}-${resolution.retry_request_id}.json`].sort());
  assert.deepEqual(after.attemptFacts.slice(0, before.attemptFacts.length), before.attemptFacts);
  assert.deepEqual(after.attemptFacts.at(-1), appendedEvents[1]);
  assert.equal(appendedEvents[0].kind, 'fallback_pause_resolved');
  assert.deepEqual(JSON.parse(appendedEvents[0].detail), resolution);
  assert.equal(appendedEvents[1].kind, 'attempt_started');
  assert.equal(appendedEvents[1].attempt_id, receipt.attempt_id);
  assert.equal(appendedEvents[1].detail, `receipt:${receipt.receipt_id}`);

  const beforeState = JSON.parse(before.stateText);
  const afterState = JSON.parse(after.stateText);
  assert.deepEqual(withoutStateSignature(afterState), {
    ...withoutStateSignature(beforeState),
    run_status: 'running',
    group: 'running',
    node_states: beforeState.node_states.map(node => node.node_id === receipt.node_id
      ? { ...node, status: 'running', current_attempt_id: receipt.attempt_id,
        attempt_count: (node.attempt_count ?? 0) + 1 }
      : node),
    updated_at: receipt.issued_at,
  });
  assert.notEqual(afterState.state_signature, beforeState.state_signature);
}

test('DHR80 batch 2: fresh retry Receipt submits through the formal v2 result RPC', async (t) => {
  const repoRoot = await makeRepo('dhr80-rpc-v2-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const runRoot = join(repoRoot, '.dh-relay', run.run_id);
  const profileHome = join(repoRoot, 'profile');
  const registryPath = join(repoRoot, 'profiles.json');
  await mkdir(profileHome, { recursive: true });
  await writeFile(join(profileHome, 'config.toml'), 'model = "test-model"\n', 'utf8');
  await writeFile(join(repoRoot, 'task.md'), INSTRUCTION, 'utf8');
  const profile = {
    executor_profile_id: 'herdr.codex.main', backend: 'herdr', product: 'codex-cli', command_alias: 'codex',
    account_alias: 'acct-codex-main',
    capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported',
      structured_result: 'supported', user_input_passthrough: 'supported' },
    supported_platforms: [process.platform], headless_supported: true,
    config_fingerprint_rule: { kind: 'file-exists', path_template: '${DHR80_RPC_HOME}/config.toml',
      fields: [{ pointer: '/model', classification: 'nonsecret' }] },
  };
  await writeFile(registryPath, JSON.stringify({ profiles: [profile] }), 'utf8');
  const profileEnvironment = { DHR80_RPC_HOME: profileHome };
  const identity = createExecutorIdentity(profile, { '/model': 'test-model' });
  const receipt = {
    protocol: 'relay.attempt-receipt/v1', receipt_id: 'receipt-dhr80-old', run_id: run.run_id,
    node_id: 'node-a', attempt_id: 'attempt-dhr80-old', issued_at: '2026-09-07T00:00:00.000Z',
    executor_identity: identity, fallback_profile_snapshots: [identity],
  };
  const digest = (...parts) => createHash('sha256').update(parts.join('\n'), 'utf8').digest('hex');
  const reason = 'E_FALLBACK_UNAVAILABLE';
  const pause = {
    protocol: 'relay.fallback-pause/v1',
    pause_id: digest('fallback-pause/v1', run.run_id, 'node-a', receipt.attempt_id, receipt.receipt_id, reason),
    run_id: run.run_id, node_id: 'node-a', attempt_id: receipt.attempt_id, receipt_id: receipt.receipt_id,
    reason_code: reason, raised_at: '2026-09-07T00:00:01.000Z',
    fence: {
      protocol: 'relay.attempt-fence/v1',
      fence_id: digest('attempt-fence/v1', run.run_id, 'node-a', receipt.attempt_id, receipt.receipt_id, reason),
      attempt_id: receipt.attempt_id, receipt_id: receipt.receipt_id, reason_code: reason,
      fenced_at: '2026-09-07T00:00:01.000Z',
    },
    attention: {
      protocol: 'relay.attention/v1',
      attention_id: digest('attention/v1', run.run_id, 'node-a', receipt.attempt_id, receipt.receipt_id, reason),
      run_id: run.run_id, node_id: 'node-a', attempt_id: receipt.attempt_id, receipt_id: receipt.receipt_id,
      reason_code: reason, state: 'open', raised_at: '2026-09-07T00:00:01.000Z',
    },
    manual_retry_profiles: [identity],
  };
  const store = await createStore({ root: runRoot, run });
  await store.registerAttemptReceipt(receipt);
  await store.appendFallbackPause(pause);
  await writeLedger(repoRoot, { version: 1, next_seq: 1, operations: { claim: { run_id: run.run_id } } });

  const runtimeRoot = join(repoRoot, 'private-runtime');
  await mkdir(runtimeRoot, { recursive: true });
  const service = await startRuntimeService({
    repoRoot,
    endpoint: endpointForRepo(repoRoot, { runtimeRoot }),
    v2Endpoint: endpointForRepo(repoRoot, { runtimeRoot, channel: 'v2' }),
    bootstrapEndpoint: endpointForRepo(repoRoot, { runtimeRoot, channel: 'bootstrap' }),
    localUserCapability: 'local-capability', indexPath: join(runtimeRoot, 'runs.json'),
    executorProfileRegistryPath: registryPath, profileEnvironment,
  });
  t.after(async () => { await service.close().catch(() => {}); });

  const negotiated = await bootstrapV2(t, service.bootstrapEndpoint);
  assert.deepEqual(negotiated, service.v2Descriptor);
  const v2 = await connectV2(t, negotiated.endpoint);
  const authorized = await v2.call('contracts', {
    descriptor_version: service.descriptor.descriptor_version, repo_id: service.descriptor.repo_id,
    generation: service.descriptor.generation, local_user_capability: 'local-capability',
  });
  assert.deepEqual(authorized.result, service.v2Descriptor);

  const retryParams = {
    run_id: run.run_id, node_id: 'node-a', pause_id: pause.pause_id,
    executor_profile_id: identity.executor_profile_id, retry_request_id: 'b'.repeat(64),
  };
  const retried = await v2.call('retry-with-profile', retryParams);
  assert.equal(retried.result?.ok, true, JSON.stringify(retried));
  const freshReceipt = retried.result.attempt_receipt;
  assert.notEqual(freshReceipt.receipt_id, receipt.receipt_id);
  assert.notEqual(freshReceipt.attempt_id, receipt.attempt_id);
  assert.equal(freshReceipt.result_submission_mode, 'receipt-bound/v1');
  const persistedFreshReceipt = JSON.parse(await readFile(join(runRoot, 'receipts', `${freshReceipt.receipt_id}.json`), 'utf8'));
  assert.equal(persistedFreshReceipt.result_submission_mode, 'receipt-bound/v1');
  const attention = await v2.call('inspectRun', { run_id: run.run_id, view: 'status', read_model_version: 'v2' });
  assert.deepEqual(attention.result.open_attentions, []);

  const beforeSubmit = await mutationSnapshot(runRoot);
  assert.deepEqual(beforeSubmit.resultFiles, []);
  const committed = await v2.call('submit-executor-result', {
    protocol: 'relay.executor-result-submission/v1', receipt_id: freshReceipt.receipt_id,
    outcome: 'succeeded', reason: null,
  });
  assert.equal(committed.error, undefined, JSON.stringify(committed));
  assert.equal(committed.result?.ok, true, JSON.stringify(committed));
  assert.equal(committed.result?.idempotent, false);
  assert.equal(committed.result?.result?.protocol, 'relay.result/v2');
  assert.equal(committed.result?.result?.receipt_id, freshReceipt.receipt_id);
  assert.equal(committed.result?.result?.attempt_id, freshReceipt.attempt_id);
  assert.equal(committed.result?.result?.structured?.source, 'receipt-bound-submission/v1');
  const afterSubmit = await mutationSnapshot(runRoot);
  assert.equal(afterSubmit.resultFiles.length, 1);
  assert.equal(afterSubmit.attemptFacts.length, beforeSubmit.attemptFacts.length + 1);
  assert.equal(afterSubmit.attemptFacts.at(-1).kind, 'attempt_succeeded');
  assert.equal(afterSubmit.events.at(-1).kind, 'attempt_succeeded');
  assert.equal(afterSubmit.events.at(-1).attempt_id, freshReceipt.attempt_id);
  assert.equal(afterSubmit.events.at(-1).detail, `receipt:${freshReceipt.receipt_id}`);
  assert.equal(JSON.parse(afterSubmit.stateText).node_states[0].status, 'succeeded');
});

test('DHR80 batch 2: failed submission is server-derived and committed idempotently', async (t) => {
  const scene = await bootRetryService(t, { runId: 'R001-dhr80-failed-20260907' });
  const retried = await scene.retry('c'.repeat(64));
  assert.equal(retried.result?.ok, true, JSON.stringify(retried));
  const freshReceipt = retried.result.attempt_receipt;
  const before = await mutationSnapshot(scene.runRoot);

  const malformed = await scene.v2.call('submit-executor-result', {
    protocol: 'relay.executor-result-submission/v1', receipt_id: freshReceipt.receipt_id,
    outcome: 'failed', reason: 'E_EXECUTOR_REPORTED_FAILURE', structured: { must: 'be-rejected' },
  });
  assert.equal(rpcReason(malformed), 'E_UNKNOWN_FIELD', JSON.stringify(malformed));
  assert.deepEqual(await mutationSnapshot(scene.runRoot), before,
    'submission identity/structured extras must be rejected before any Store mutation');

  const wrongFailureReason = await scene.v2.call('submit-executor-result', {
    protocol: 'relay.executor-result-submission/v1', receipt_id: freshReceipt.receipt_id,
    outcome: 'failed', reason: null,
  });
  assert.equal(rpcReason(wrongFailureReason), 'E_BAD_VALUE', JSON.stringify(wrongFailureReason));
  assert.deepEqual(await mutationSnapshot(scene.runRoot), before,
    'failed submissions must use the fixed failure reason before reaching the Store');

  const committed = await scene.submit(freshReceipt.receipt_id, 'failed', 'E_EXECUTOR_REPORTED_FAILURE');
  assert.equal(committed.error, undefined, JSON.stringify(committed));
  assert.equal(committed.result?.ok, true, JSON.stringify(committed));
  assert.equal(committed.result?.idempotent, false);
  const result = committed.result.result;
  assert.deepEqual(Object.keys(result).sort(), [
    'attempt_id', 'executor_kind', 'finished_at', 'log_locator', 'node_id', 'outcome',
    'payload_digest', 'quarantined', 'reason', 'receipt_id', 'run_id', 'structured', 'protocol',
  ].sort());
  assert.equal(result.protocol, 'relay.result/v2');
  assert.equal(result.run_id, scene.runDocument.run_id);
  assert.equal(result.node_id, freshReceipt.node_id);
  assert.equal(result.attempt_id, freshReceipt.attempt_id);
  assert.equal(result.receipt_id, freshReceipt.receipt_id);
  assert.equal(result.executor_kind, 'herdr-agent');
  assert.equal(result.outcome, 'failed');
  assert.equal(result.reason, 'E_EXECUTOR_REPORTED_FAILURE');
  assert.deepEqual(result.structured, { source: 'receipt-bound-submission/v1' });
  assert.equal(result.log_locator, null);
  assert.equal(result.quarantined, false);
  assert.equal(result.payload_digest, receiptBoundResultDigest(result));

  const after = await mutationSnapshot(scene.runRoot);
  assert.equal(after.resultFiles.length, before.resultFiles.length + 1);
  assert.equal(after.attemptFacts.at(-1).kind, 'attempt_failed');
  assert.equal(after.events.at(-1).kind, 'attempt_failed');
  assert.equal(after.events.at(-1).at, result.finished_at);
  assert.equal(after.events.at(-1).reason, result.reason);
  assert.equal(after.events.at(-1).detail, `receipt:${freshReceipt.receipt_id}`);
  assert.equal(JSON.parse(after.stateText).node_states[0].status, 'failed');

  const duplicate = await scene.submit(freshReceipt.receipt_id, 'failed', 'E_EXECUTOR_REPORTED_FAILURE');
  assert.equal(duplicate.result?.ok, true, JSON.stringify(duplicate));
  assert.equal(duplicate.result?.idempotent, true);
  assert.deepEqual(duplicate.result?.result, result);
  assert.deepEqual(await mutationSnapshot(scene.runRoot), after,
    'same committed result must not append a second Result/event/state mutation');

  const conflict = await scene.submit(freshReceipt.receipt_id, 'succeeded', null);
  assert.equal(rpcReason(conflict), 'E_TERMINAL_STATE_CONFLICT', JSON.stringify(conflict));
  assert.deepEqual(await mutationSnapshot(scene.runRoot), after,
    'a different terminal result must not overwrite the committed failed Result');
});

test('DHR80 batch 2: service restart restores the same fresh Receipt gate without another Attempt', async (t) => {
  const scene = await bootRetryService(t, { runId: 'R001-dhr80-restart-20260907' });
  const retried = await scene.retry('d'.repeat(64));
  assert.equal(retried.result?.ok, true, JSON.stringify(retried));
  const freshReceipt = retried.result.attempt_receipt;
  const beforeRestart = await mutationSnapshot(scene.runRoot);
  const receiptIdsBefore = beforeRestart.receiptFiles;
  const attemptsBefore = beforeRestart.attemptFacts.filter(event => event.kind === 'attempt_started');

  scene.v2.client.destroy();
  await scene.service.close();
  const restarted = await startRuntimeService({
    repoRoot: scene.repoRoot,
    endpoint: endpointForRepo(scene.repoRoot, { runtimeRoot: scene.runtimeRoot }),
    v2Endpoint: endpointForRepo(scene.repoRoot, { runtimeRoot: scene.runtimeRoot, channel: 'v2' }),
    bootstrapEndpoint: endpointForRepo(scene.repoRoot, { runtimeRoot: scene.runtimeRoot, channel: 'bootstrap' }),
    localUserCapability: 'local-capability', indexPath: join(scene.runtimeRoot, 'runs.json'),
    executorProfileRegistryPath: scene.registryPath, profileEnvironment: scene.profileEnvironment,
  });
  t.after(() => restarted.close().catch(() => {}));
  const v2 = await connectV2(t, restarted.v2Endpoint);
  const authorized = await v2.call('contracts', {
    descriptor_version: restarted.descriptor.descriptor_version, repo_id: restarted.descriptor.repo_id,
    generation: restarted.descriptor.generation, local_user_capability: 'local-capability',
  });
  assert.deepEqual(authorized.result, restarted.v2Descriptor);

  const committed = await v2.call('submit-executor-result', {
    protocol: 'relay.executor-result-submission/v1', receipt_id: freshReceipt.receipt_id,
    outcome: 'succeeded', reason: null,
  });
  assert.equal(committed.error, undefined, JSON.stringify(committed));
  assert.equal(committed.result?.ok, true, JSON.stringify(committed));
  assert.equal(committed.result?.result?.receipt_id, freshReceipt.receipt_id);
  const afterRestart = await mutationSnapshot(scene.runRoot);
  assert.deepEqual(afterRestart.receiptFiles, receiptIdsBefore, 'restart must not mint another Receipt');
  assert.deepEqual(afterRestart.attemptFacts.filter(event => event.kind === 'attempt_started'), attemptsBefore,
    'restart must not open another Attempt');
  assert.equal(afterRestart.attemptFacts.at(-1).kind, 'attempt_succeeded');
  assert.equal(JSON.parse(afterRestart.stateText).node_states[0].status, 'succeeded');
});

test('DHR80 batch 2: retry profile, snapshot, pause, and key guards stay atomic', async (t) => {
  const scene = await bootRetryService(t, { runId: 'R001-dhr80-retry-guards-20260907' });

  const leaseWarmup = await scene.retry('8'.repeat(64), dhr80Profile.executor_profile_id, 'a'.repeat(64));
  assert.equal(rpcReason(leaseWarmup), 'E_FALLBACK_PAUSE_RESOLUTION_INVALID', JSON.stringify(leaseWarmup));
  await until(async () => eventKinds(await mutationSnapshot(scene.runRoot)).includes('lease_acquired'));
  const before = await mutationSnapshot(scene.runRoot);
  const malformedRetry = await scene.v2.call('retry-with-profile', {
    run_id: scene.runDocument.run_id, node_id: 'node-a', pause_id: scene.pause.pause_id,
    executor_profile_id: dhr80Profile.executor_profile_id, retry_request_id: '9'.repeat(64),
    attempt_id: 'must-not-be-accepted',
  });
  assert.equal(rpcReason(malformedRetry), 'E_UNKNOWN_FIELD', JSON.stringify(malformedRetry));
  assert.deepEqual(await mutationSnapshot(scene.runRoot), before,
    'retry request fields are closed before any Store mutation');

  const beforeWrongProfile = await mutationSnapshot(scene.runRoot);
  const wrongProfile = await scene.retry('e'.repeat(64), 'herdr.codex.other');
  assert.equal(rpcReason(wrongProfile), 'E_FALLBACK_PAUSE_RESOLUTION_INVALID', JSON.stringify(wrongProfile));
  const afterWrongProfile = await mutationSnapshot(scene.runRoot);
  assert.deepEqual(afterWrongProfile, beforeWrongProfile,
    'a non-frozen profile must not create a resolution or fresh Attempt');

  await writeFile(join(scene.profileHome, 'config.toml'), 'model = "changed"\n', 'utf8');
  const beforeDrift = await mutationSnapshot(scene.runRoot);
  const drifted = await scene.retry('f'.repeat(64));
  assert.equal(rpcReason(drifted), 'E_FALLBACK_PAUSE_RESOLUTION_INVALID', JSON.stringify(drifted));
  const afterDrift = await mutationSnapshot(scene.runRoot);
  assert.deepEqual(afterDrift, beforeDrift,
    'a changed non-secret projection must not partially resolve the pause');

  await writeFile(join(scene.profileHome, 'config.toml'), 'model = "test-model"\n', 'utf8');
  const beforeBadPause = await mutationSnapshot(scene.runRoot);
  const badPause = await scene.retry('0'.repeat(64), dhr80Profile.executor_profile_id, 'a'.repeat(64));
  assert.equal(rpcReason(badPause), 'E_FALLBACK_PAUSE_RESOLUTION_INVALID', JSON.stringify(badPause));
  const afterBadPause = await mutationSnapshot(scene.runRoot);
  assert.deepEqual(afterBadPause, beforeBadPause,
    'an unknown pause must not create a resolution or fresh Attempt');

  const retryKey = '1'.repeat(64);
  const beforeLegalRetry = await mutationSnapshot(scene.runRoot);
  const resolved = await scene.retry(retryKey);
  assert.equal(resolved.result?.ok, true, JSON.stringify(resolved));
  assert.equal(resolved.result?.idempotent, false);
  const freshReceipt = resolved.result.attempt_receipt;
  const afterLegalRetry = await mutationSnapshot(scene.runRoot);
  assertOnlyLegalRetryMutation(beforeLegalRetry, afterLegalRetry, {
    resolution: resolved.result.resolution, receipt: freshReceipt,
  });

  const beforeReplay = await mutationSnapshot(scene.runRoot);
  const replay = await scene.retry(retryKey);
  assert.equal(replay.result?.ok, true, JSON.stringify(replay));
  assert.equal(replay.result?.idempotent, true);
  assert.deepEqual(replay.result?.resolution, resolved.result.resolution);
  assert.deepEqual(replay.result?.attempt_receipt, resolved.result.attempt_receipt);
  assert.equal(replay.result?.attempt_receipt?.result_submission_mode, 'receipt-bound/v1');
  assert.deepEqual(await mutationSnapshot(scene.runRoot), beforeReplay,
    'same-key replay is idempotent and must not add a second legal mutation');

  const beforeKeyConflict = await mutationSnapshot(scene.runRoot);
  const keyConflict = await scene.retry(retryKey, 'herdr.codex.other');
  assert.equal(rpcReason(keyConflict), 'E_FALLBACK_PAUSE_CONFLICT', JSON.stringify(keyConflict));
  assert.deepEqual(await mutationSnapshot(scene.runRoot), beforeKeyConflict,
    'same-key conflict must not mutate the already resolved pause');

  const beforeClosedPause = await mutationSnapshot(scene.runRoot);
  const closedPause = await scene.retry('2'.repeat(64));
  assert.equal(rpcReason(closedPause), 'E_FALLBACK_PAUSE_CONFLICT', JSON.stringify(closedPause));
  assert.deepEqual(await mutationSnapshot(scene.runRoot), beforeClosedPause,
    'a closed pause must not mutate the resolved retry');
});

test('DHR80 batch 2: historical, old, non-current, unknown, fenced, and unauthenticated receipts stay rejected', async (t) => {
  const historical = await bootRetryService(t, {
    includeOlderReceipt: true, runId: 'R001-dhr80-receipt-guards-20260907',
  });
  const beforeHistorical = await mutationSnapshot(historical.runRoot);
  const missingMode = await historical.submit(historical.initialReceipt.receipt_id);
  assert.equal(rpcReason(missingMode), 'E_IDENTITY_MISMATCH', JSON.stringify(missingMode));
  const older = await historical.submit(historical.olderReceipt.receipt_id);
  assert.equal(rpcReason(older), 'E_IDENTITY_MISMATCH', JSON.stringify(older));
  const unknown = await historical.submit('receipt-dhr80-unknown');
  assert.equal(rpcReason(unknown), 'E_IDENTITY_MISMATCH', JSON.stringify(unknown));
  assert.deepEqual(await mutationSnapshot(historical.runRoot), beforeHistorical,
    'historical, old, and unknown Receipt rejection must not mutate the Run');

  const unauthenticated = await connectV2(t, historical.service.v2Endpoint, {
    clientId: 'dhr80-unauthenticated', requestPrefix: 'dhr80-unauthenticated',
  });
  const unauthorized = await unauthenticated.call('submit-executor-result', {
    protocol: 'relay.executor-result-submission/v1', receipt_id: historical.initialReceipt.receipt_id,
    outcome: 'succeeded', reason: null,
  });
  assert.equal(rpcReason(unauthorized), 'E_CLIENT_NOT_AUTHORIZED', JSON.stringify(unauthorized));
  unauthenticated.client.destroy();
  assert.deepEqual(await mutationSnapshot(historical.runRoot), beforeHistorical,
    'unauthenticated submission must not mutate the Run');

  const leaseWarmup = await historical.retry('4'.repeat(64), dhr80Profile.executor_profile_id, 'b'.repeat(64));
  assert.equal(rpcReason(leaseWarmup), 'E_FALLBACK_PAUSE_RESOLUTION_INVALID', JSON.stringify(leaseWarmup));
  await until(async () => eventKinds(await mutationSnapshot(historical.runRoot)).includes('lease_acquired'));
  const oldReceiptPath = join(historical.runRoot, 'receipts', `${historical.initialReceipt.receipt_id}.json`);
  const oldReceiptBytesBeforeRetry = await readFile(oldReceiptPath);
  const beforeHistoricalRetry = await mutationSnapshot(historical.runRoot);
  const historicalRetry = await historical.retry('3'.repeat(64));
  assert.equal(historicalRetry.result?.ok, true, JSON.stringify(historicalRetry));
  assert.equal(historicalRetry.result?.idempotent, false);
  const afterHistoricalRetry = await mutationSnapshot(historical.runRoot);
  assertOnlyLegalRetryMutation(beforeHistoricalRetry, afterHistoricalRetry, {
    resolution: historicalRetry.result.resolution,
    receipt: historicalRetry.result.attempt_receipt,
  });
  assert.deepEqual(await readFile(oldReceiptPath), oldReceiptBytesBeforeRetry,
    'legal retry must not rewrite the historical Receipt bytes');

  const beforeOldReceiptSubmit = await mutationSnapshot(historical.runRoot);
  const oldReceiptSubmit = await historical.submit(historical.initialReceipt.receipt_id);
  assert.equal(rpcReason(oldReceiptSubmit), 'E_IDENTITY_MISMATCH', JSON.stringify(oldReceiptSubmit));
  assert.deepEqual(await mutationSnapshot(historical.runRoot), beforeOldReceiptSubmit,
    'old Receipt submission must be rejected without any mutation');
  assert.deepEqual(await readFile(oldReceiptPath), oldReceiptBytesBeforeRetry,
    'old Receipt bytes must remain unchanged after rejected submission');

  const fenced = await bootRetryService(t, {
    initialReceiptMode: true, runId: 'R001-dhr80-fenced-20260907',
  });
  await until(async () => eventKinds(await mutationSnapshot(fenced.runRoot)).includes('host_observation_changed'));
  const beforeFenced = await mutationSnapshot(fenced.runRoot);
  const fencedResult = await fenced.submit(fenced.initialReceipt.receipt_id);
  assert.equal(rpcReason(fencedResult), 'E_ATTEMPT_FENCED', JSON.stringify(fencedResult));
  assert.deepEqual(await mutationSnapshot(fenced.runRoot), beforeFenced,
    'a fenced Receipt must be rejected before any Result mutation');
});

test('DHR80 batch 2: a lost lease rejects the fresh-result route without mutation', async (t) => {
  const scene = await bootRetryService(t, {
    initialReceiptMode: true, runId: 'R001-dhr80-lease-lost-20260907',
  });
  await until(async () => eventKinds(await mutationSnapshot(scene.runRoot)).includes('host_observation_changed'));
  const before = await mutationSnapshot(scene.runRoot);
  const leasePath = join(scene.runRoot, 'host-lease.json');
  const held = JSON.parse(await readFile(leasePath, 'utf8'));
  await writeFile(leasePath, JSON.stringify({
    ...held, epoch: held.epoch + 1,
    acquired_at: new Date().toISOString(), expires_at: new Date(Date.now() + 600_000).toISOString(),
    expires_at_epoch_ms: Date.now() + 600_000,
  }), 'utf8');

  const rejected = await scene.submit(scene.initialReceipt.receipt_id);
  assert.equal(rpcReason(rejected), 'E_LEASE_HELD', JSON.stringify(rejected));
  assert.match(JSON.stringify(rejected), /lease-lost/);
  const after = await mutationSnapshot(scene.runRoot);
  assert.deepEqual(after, before, 'a lease-lost submission must leave Result/event/state/attempt facts unchanged');
});

test('DHR80 batch 2: a recovered retry Attempt at done/idle waits for submission and never launches', async (t) => {
  const repoRoot = await makeRepo('dhr80-idle-retry-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const runId = 'R001-dhr80-idle-retry-20260907';
  const runDocument = { ...run, run_id: runId };
  const runRoot = join(repoRoot, '.dh-relay', runId);
  const profileHome = join(repoRoot, 'profile');
  const registryPath = join(repoRoot, 'profiles.json');
  await mkdir(profileHome, { recursive: true });
  await writeFile(join(profileHome, 'config.toml'), 'model = "test-model"\n', 'utf8');
  await writeFile(join(repoRoot, 'task.md'), INSTRUCTION, 'utf8');
  await writeFile(registryPath, JSON.stringify({ profiles: [dhr80Profile] }), 'utf8');
  const oldReceipt = {
    protocol: 'relay.attempt-receipt/v1', receipt_id: 'receipt-dhr80-idle-old', run_id: runId,
    node_id: 'node-a', attempt_id: 'attempt-dhr80-idle-old', issued_at: '2026-09-07T00:00:00.000Z',
    executor_identity: dhr80Identity, fallback_profile_snapshots: [dhr80Identity],
    result_submission_mode: 'receipt-bound/v1',
  };
  const store = await createStore({ root: runRoot, run: runDocument });
  await store.registerAttemptReceipt(oldReceipt);
  const pause = fallbackPauseFor(oldReceipt);
  await store.appendFallbackPause(pause);
  const retried = await retryWithFrozenProfile({
    store, registryPath, environment: { DHR80_PROFILE_HOME: profileHome },
    params: {
      run_id: runId, node_id: 'node-a', pause_id: pause.pause_id,
      executor_profile_id: dhr80Profile.executor_profile_id, retry_request_id: 'a'.repeat(64),
    }, now: () => '2026-09-07T00:00:02.000Z',
  });
  assert.equal(retried.ok, true, JSON.stringify(retried));
  assert.equal(retried.attempt_receipt.result_submission_mode, 'receipt-bound/v1');
  const freshReceipt = retried.attempt_receipt;
  await store.appendEvent({
    kind: 'host_observation_changed', at: '2026-09-07T00:00:03.000Z', node_id: 'node-a',
    attempt_id: freshReceipt.attempt_id, executor_ref: 'herdr-retry-agent',
    host_ref: `herdr-terminal/sha256-${'a'.repeat(64)}`, observation_status: 'alive',
    detail: 'herdr_status=idle;agent=herdr-retry-agent;pane=pane-1;seq=1;work_dir_root=repo;profile=herdr.codex.main;agent_get=idle;pane_get=idle',
  });

  const fake = makeFakeHerdr({ statuses: ['idle', 'idle', 'done'], paneStatuses: ['idle', 'idle'] });
  const driver = startWorkflowDriver({
    repoRoot, runId, actor: { submitControl: job => job(store) }, herdrCli: fake.cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR80_PROFILE_HOME: profileHome },
    herdrPollMs: 2, doneTimeoutMs: 20,
  });
  t.after(() => driver.stop().catch(() => {}));
  await until(() => store.events.some(event => event.kind === 'human_input_requested'
    && event.reason === 'E_EXECUTOR_RESULT_MISSING'));
  assert.equal(driver.hasOpenSubmissionGates, true);
  const pollsAtAttention = fake.agentGets;
  await until(() => fake.agentGets > pollsAtAttention);
  assert.equal((await readdir(join(runRoot, 'results'))).length, 0,
    'done/idle without a formal submission must not create Result');
  assert.equal((await store.readState()).node_states[0].status, 'waiting_human');
  assert.equal(store.events.some(event => String(event.detail).includes('herdr_status=idle')), true);
  assert.equal(store.events.some(event => String(event.detail).includes('herdr_status=done')), true);
  assert.equal(store.events.filter(event => event.kind === 'fallback_pause_created').length, 1,
    'done/idle must not create a second fallback pause');
  assert.equal(store.events.some(event => ['attempt_succeeded', 'attempt_failed'].includes(event.kind)), false);
  assert.equal(fake.calls.some(([name]) => ['agentStart', 'paneSplit', 'paneRun', 'agentPrompt'].includes(name)), false,
    `recovery of a retry Attempt must not launch or send a startup instruction: ${JSON.stringify(fake.calls)}`);
  assert.deepEqual(fake.sent, [], 'done/idle without submission must not send an instruction');
  await driver.stop();
  await driver.done;
});
