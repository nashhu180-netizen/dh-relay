import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { localCapabilityHashV2 } from '../rpc/capabilities.mjs';
import { createTransportClient } from '../rpc/transport.mjs';
import { buildV2RequestEnvelope, connectCliV2 } from '../cli/client.mjs';
import { endpointForRepo } from '../runtime/endpoint.mjs';
import { startRuntimeService } from '../runtime/service.mjs';
import { startWorkflowDriver } from '../runtime/workflow-driver.mjs';
import { createStore, openStore } from '../store/store.mjs';
import { digest } from '../tools/canonical.mjs';
import { loadAjv, validateOne } from '../tools/validate.mjs';
import { makeFakeHerdr } from './helpers/fake-herdr.mjs';
import { writeLedger } from '../runtime/ledger.mjs';

const execFileAsync = promisify(execFile);

const HASH = 'a'.repeat(64);
const run = {
  protocol: 'relay.run/v2', run_id: 'RUN-DHR64', workflow_name: 'dhr64', summary: 'DHR64 bridge',
  trigger: 'system', created_at: '2026-08-30T00:00:00.000Z', labels: [],
  nodes: [{ node_id: 'node-a', title: 'A', role: 'work', required: true,
    executor_profiles: [{ kind: 'herdr-agent', ref: 'herdr.codex.main' }] }],
};

const identity = {
  executor_profile_id: 'herdr.codex.main', account_alias: 'acct-main',
  config_fingerprint: HASH, executor_capability_hash: HASH,
};

const receipt = {
  protocol: 'relay.attempt-receipt/v1', receipt_id: 'rcpt-dhr64', run_id: run.run_id,
  node_id: 'node-a', attempt_id: 'attempt-dhr64', issued_at: '2026-08-30T00:00:00.000Z',
  executor_identity: identity, fallback_profile_snapshots: [],
  result_submission_mode: 'receipt-bound/v1',
};

const herdrProfile = {
  executor_profile_id: 'herdr.codex.main', backend: 'herdr', product: 'codex-cli', command_alias: 'codex',
  account_alias: 'acct-main',
  capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported',
    structured_result: 'supported', user_input_passthrough: 'supported' },
  supported_platforms: [process.platform], headless_supported: true,
  config_fingerprint_rule: { kind: 'file-exists', path_template: '${DHR64_PROFILE_HOME}/profile.json',
    fields: [{ pointer: '/model', classification: 'nonsecret' }] },
};

const until = async (check, timeoutMs = 5_000) => {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() >= deadline) throw new Error('timeout');
    await new Promise(resolve => setTimeout(resolve, 5));
  }
};

test('DHR64 contract: receipt-bound submission has a closed schema and fixed failure reason', () => {
  const { ajv, byId } = loadAjv();
  assert.equal(validateOne(ajv, byId, 'relay.executor-result-submission/v1', {
    protocol: 'relay.executor-result-submission/v1', receipt_id: receipt.receipt_id,
    outcome: 'succeeded', reason: null,
  }).ok, true);
  assert.equal(validateOne(ajv, byId, 'relay.executor-result-submission/v1', {
    protocol: 'relay.executor-result-submission/v1', receipt_id: receipt.receipt_id,
    outcome: 'failed', reason: 'E_EXECUTOR_REPORTED_FAILURE',
  }).ok, true);
  assert.equal(validateOne(ajv, byId, 'relay.executor-result-submission/v1', {
    protocol: 'relay.executor-result-submission/v1', receipt_id: receipt.receipt_id,
    outcome: 'failed', reason: 'E_BAD_VALUE',
  }).ok, false);
  assert.equal(validateOne(ajv, byId, 'relay.executor-result-submission/v1', {
    protocol: 'relay.executor-result-submission/v1', receipt_id: receipt.receipt_id,
    outcome: 'succeeded', reason: null, structured: { should: 'be-rejected' },
  }).ok, false);
});

test('DHR64 Store bridge: only a current receipt-bound submission commits a server result', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr64-bridge-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.registerAttemptReceipt(receipt);

  const submission = {
    protocol: 'relay.executor-result-submission/v1', receipt_id: receipt.receipt_id,
    outcome: 'succeeded', reason: null,
  };
  const resultDigest = digest({
    protocol: 'relay.result/v2', run_id: run.run_id, node_id: receipt.node_id,
    attempt_id: receipt.attempt_id, receipt_id: submission.receipt_id,
    executor_kind: 'herdr-agent', outcome: submission.outcome, reason: submission.reason,
    structured: { source: 'receipt-bound-submission/v1' },
  });
  const committed = await store.submitExecutorResult(submission);
  assert.equal(committed.ok, true);
  assert.equal(committed.idempotent, false);
  assert.equal(committed.result.protocol, 'relay.result/v2');
  assert.equal(committed.result.executor_kind, 'herdr-agent');
  assert.equal(committed.result.payload_digest, resultDigest);
  assert.deepEqual(committed.result.structured, { source: 'receipt-bound-submission/v1' });
  assert.equal((await readFile(join(root, 'results', `${receipt.receipt_id}.json`), 'utf8')).includes('receipt-bound-submission/v1'), true);

  assert.deepEqual(await store.submitExecutorResult(submission), { ...committed, idempotent: true });
  assert.deepEqual(await store.submitExecutorResult({ ...submission, outcome: 'failed', reason: 'E_EXECUTOR_REPORTED_FAILURE' }),
    { ok: false, reason: 'E_TERMINAL_STATE_CONFLICT' });
  assert.deepEqual(await store.submitExecutorResult({ ...submission, receipt_id: 'rcpt-unknown' }),
    { ok: false, reason: 'E_IDENTITY_MISMATCH' });

  const mutationFiles = await readdir(join(root, 'mutations'));
  assert.ok(mutationFiles.some(name => name.endsWith('.committed')), 'bridge must leave a committed mutation marker');
});

test('DHR64 Store bridge: a lost lease or a non-Attempt receipt cannot commit Result', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr64-fence-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  let guardCalls = 0;
  const store = await createStore({ root, run, writeGuard: async () => {
    guardCalls += 1;
    if (guardCalls === 3) throw new Error('E_LEASE_HELD:lease-lost');
  } });
  await store.registerAttemptReceipt(receipt);
  await assert.rejects(() => store.submitExecutorResult({
    protocol: 'relay.executor-result-submission/v1', receipt_id: receipt.receipt_id,
    outcome: 'succeeded', reason: null,
  }), /E_LEASE_HELD:lease-lost/);
  assert.deepEqual(await readdir(join(root, 'results')), [], 'a lost lease must not leave a Result');

  const pseudoRoot = await mkdtemp(join(tmpdir(), 'dhr64-pseudo-receipt-'));
  t.after(() => rm(pseudoRoot, { recursive: true, force: true }));
  const pseudoStore = await createStore({ root: pseudoRoot, run });
  await pseudoStore.registerReceipt({
    receipt_id: 'rcpt-pseudo', node_id: 'node-a', attempt_id: 'attempt-pseudo',
    result_submission_mode: 'receipt-bound/v1',
  });
  await assert.rejects(() => pseudoStore.submitExecutorResult({
    protocol: 'relay.executor-result-submission/v1', receipt_id: 'rcpt-pseudo', outcome: 'succeeded', reason: null,
  }), /E_SCHEMA_INVALID/);
  assert.deepEqual(await readdir(join(pseudoRoot, 'results')), [], 'a non-Attempt receipt must not create Result');
});

test('DHR64 Store bridge: prepared result mutation recovers before load and fails closed when its blob is corrupt', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr64-recovery-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.registerAttemptReceipt(receipt);
  const eventsBefore = await readFile(join(root, 'events.jsonl'), 'utf8');
  const stateBefore = await readFile(join(root, 'state.json'), 'utf8');
  const committed = await store.submitExecutorResult({
    protocol: 'relay.executor-result-submission/v1', receipt_id: receipt.receipt_id,
    outcome: 'succeeded', reason: null,
  });
  assert.equal(committed.ok, true);
  const preparedName = (await readdir(join(root, 'mutations'))).find(name => name.endsWith('.prepared.json'));
  assert.ok(preparedName);
  const transactionId = preparedName.replace('.prepared.json', '');
  const journal = JSON.parse(await readFile(join(root, 'mutations', preparedName), 'utf8'));
  await rm(join(root, 'mutations', `${transactionId}.committed`));
  await writeFile(join(root, 'events.jsonl'), eventsBefore, 'utf8');
  await writeFile(join(root, 'state.json'), stateBefore, 'utf8');
  await rm(join(root, 'results', `${receipt.receipt_id}.json`));
  const recovered = await openStore({ root });
  assert.equal((await recovered.readState()).node_states[0].status, 'succeeded');
  assert.ok((await readdir(join(root, 'results'))).includes(`${receipt.receipt_id}.json`));
  assert.ok((await readFile(join(root, 'events.jsonl'), 'utf8')).includes('attempt_succeeded'));

  const blob = journal.targets.find(target => target.path === `results/${receipt.receipt_id}.json`).blob;
  await rm(join(root, 'mutations', `${transactionId}.committed`));
  await writeFile(join(root, blob), 'corrupt', 'utf8');
  await assert.rejects(() => openStore({ root }), /E_STORE_MUTATION_RECOVERY_FAILED:blob-invalid/);
});

test('DHR64 driver gate: an early submission finishes a working Herdr Attempt without pane inference', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr64-driver-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const runId = 'R001-dhr64-driver-20260830';
  const root = join(repoRoot, '.dh-relay', runId);
  const runDocument = { ...run, run_id: runId };
  const store = await createStore({ root, run: runDocument });
  const registryPath = join(repoRoot, 'profiles.json');
  await writeFile(join(repoRoot, 'profile.json'), JSON.stringify({ model: 'test-model' }), 'utf8');
  await writeFile(registryPath, JSON.stringify({ profiles: [herdrProfile] }), 'utf8');
  const fake = makeFakeHerdr({ statuses: ['working'], read: 'must-not-be-used' });
  const driver = startWorkflowDriver({
    repoRoot, runId, actor: { submitControl: job => job(store) }, herdrCli: fake.cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR64_PROFILE_HOME: repoRoot },
    herdrPollMs: 2, doneTimeoutMs: 100,
  });
  t.after(() => driver.stop());

  await until(() => driver.hasOpenSubmissionGates && fake.sent.length > 0, 5_000);
  const attempt = store.events.find(event => event.kind === 'attempt_started');
  const receiptId = attempt.detail.slice('receipt:'.length);
  const submitted = await driver.submitExecutorResult({
    protocol: 'relay.executor-result-submission/v1', receipt_id: receiptId, outcome: 'succeeded', reason: null,
  });
  assert.equal(submitted.ok, true);
  await driver.done;
  assert.equal(fake.agentReads, 0, 'done 不得 capture pane output');
  assert.equal(store.events.some(event => event.kind === 'attempt_failed'), false);
  assert.equal(store.events.some(event => event.kind === 'human_input_requested' && event.reason === 'E_EXECUTOR_RESULT_MISSING'), false);
  const result = JSON.parse(await readFile(join(root, 'results', `${receiptId}.json`), 'utf8'));
  assert.deepEqual(result.structured, { source: 'receipt-bound-submission/v1' });
  assert.equal((await store.readState()).node_states[0].status, 'succeeded');
  assert.match(fake.sent[0].text, new RegExp(receiptId));
  assert.match(fake.sent[0].text, /submit-result/);
});

test('DHR64 driver gate: missing done submission becomes E_EXECUTOR_RESULT_MISSING attention', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr64-driver-missing-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const runId = 'R001-dhr64-driver-missing-20260830';
  const root = join(repoRoot, '.dh-relay', runId);
  const runDocument = { ...run, run_id: runId };
  const store = await createStore({ root, run: runDocument });
  const registryPath = join(repoRoot, 'profiles.json');
  await writeFile(join(repoRoot, 'profile.json'), JSON.stringify({ model: 'test-model' }), 'utf8');
  await writeFile(registryPath, JSON.stringify({ profiles: [herdrProfile] }), 'utf8');
  const fake = makeFakeHerdr({ statuses: ['idle'] });
  const driver = startWorkflowDriver({
    repoRoot, runId, actor: { submitControl: job => job(store) }, herdrCli: fake.cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR64_PROFILE_HOME: repoRoot },
    herdrPollMs: 2, doneTimeoutMs: 10,
  });
  t.after(() => driver.stop());
  await until(() => store.events.some(event => event.kind === 'human_input_requested'
    && event.reason === 'E_EXECUTOR_RESULT_MISSING'), 5_000);
  const pollsAtAttention = fake.agentGets;
  await until(() => fake.agentGets > pollsAtAttention, 5_000);
  const missing = store.events.find(event => event.kind === 'human_input_requested'
    && event.reason === 'E_EXECUTOR_RESULT_MISSING');
  assert.ok(missing, 'missing submission must be a persistent attention event');
  assert.equal((await readdir(join(root, 'results'))).length, 0, 'missing submission must not create Result');
  assert.equal((await store.readState()).node_states[0].status, 'waiting_human');
  await driver.stop();
  await driver.done;
});

test('DHR64 service v2: restart-recovered gate routes submission through actor and Store', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr64-service-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  const runtimeRoot = join(repoRoot, 'runtime');
  await mkdir(runtimeRoot, { recursive: true });
  const endpoint = endpointForRepo(repoRoot, { runtimeRoot });
  const v2Endpoint = endpointForRepo(repoRoot, { runtimeRoot, channel: 'v2' });
  const bootstrapEndpoint = endpointForRepo(repoRoot, { runtimeRoot, channel: 'bootstrap' });
  const runId = 'R001-dhr64-service-20260830';
  const runDocument = { ...run, run_id: runId };
  const runRoot = join(repoRoot, '.dh-relay', runId);
  const store = await createStore({ root: runRoot, run: runDocument });
  await store.registerAttemptReceipt({ ...receipt, run_id: runId });
  await writeLedger(repoRoot, { version: 1, next_seq: 1, operations: {
    claim: { run_id: runId, phase: 'accepted', receipt_id: null },
  } });
  let service = await startRuntimeService({
    repoRoot, endpoint, v2Endpoint, bootstrapEndpoint, localUserCapability: 'local-capability',
    indexPath: join(runtimeRoot, 'runs.json'),
  });
  t.after(() => service?.close());
  const responses = new Map();
  const client = await createTransportClient(v2Endpoint, { onFrame: frame => { responses.set(frame.id, frame); } });
  t.after(() => client.destroy());
  const call = async (id, method, params) => {
    client.send({ jsonrpc: '2.0', id, method, handshake: {
      protocol_version: 'relay.rpc/v2', runtime_version: '0.0.0', capability_hash: localCapabilityHashV2(),
      client_id: 'dhr64-service-test', request_id: `dhr64-${id}`,
    }, params });
    return until(() => responses.get(id));
  };
  const authorized = await call(1, 'contracts', {
    descriptor_version: service.descriptor.descriptor_version, repo_id: service.descriptor.repo_id,
    generation: service.descriptor.generation, local_user_capability: 'local-capability',
  });
  assert.deepEqual(authorized.result, service.v2Descriptor);
  const submission = await call(2, 'submit-executor-result', {
    protocol: 'relay.executor-result-submission/v1', receipt_id: receipt.receipt_id,
    outcome: 'succeeded', reason: null,
  });
  assert.equal(submission.result.ok, true);
  assert.equal(submission.result.result.receipt_id, receipt.receipt_id);
  assert.equal((await readdir(join(runRoot, 'results'))).length, 1);
  assert.equal(JSON.parse(await readFile(join(runRoot, 'state.json'), 'utf8')).node_states[0].status, 'succeeded');
  const duplicate = await call(3, 'submit-executor-result', {
    protocol: 'relay.executor-result-submission/v1', receipt_id: receipt.receipt_id,
    outcome: 'succeeded', reason: null,
  });
  assert.equal(duplicate.result.ok, true);
  assert.equal(duplicate.result.idempotent, true, 'committed same-digest RPC retry must remain idempotent');

  const eventsBeforeRestart = await readFile(join(runRoot, 'events.jsonl'), 'utf8');
  client.destroy();
  await service.close();
  service = null;
  service = await startRuntimeService({
    repoRoot, endpoint, v2Endpoint, bootstrapEndpoint, localUserCapability: 'local-capability',
    indexPath: join(runtimeRoot, 'runs.json'),
  });
  const restartedResponses = new Map();
  const restartedClient = await createTransportClient(v2Endpoint, { onFrame: frame => { restartedResponses.set(frame.id, frame); } });
  t.after(() => restartedClient.destroy());
  const restartedCall = async (id, method, params) => {
    restartedClient.send({ jsonrpc: '2.0', id, method, handshake: {
      protocol_version: 'relay.rpc/v2', runtime_version: '0.0.0', capability_hash: localCapabilityHashV2(),
      client_id: 'dhr64-service-test-restarted', request_id: `dhr64-restarted-${id}`,
    }, params });
    return until(() => restartedResponses.get(id));
  };
  const restartedAuthorized = await restartedCall(1, 'contracts', {
    descriptor_version: service.descriptor.descriptor_version, repo_id: service.descriptor.repo_id,
    generation: service.descriptor.generation, local_user_capability: 'local-capability',
  });
  assert.deepEqual(restartedAuthorized.result, service.v2Descriptor);
  const restartedDuplicate = await restartedCall(2, 'submit-executor-result', {
    protocol: 'relay.executor-result-submission/v1', receipt_id: receipt.receipt_id,
    outcome: 'succeeded', reason: null,
  });
  assert.equal(restartedDuplicate.result.ok, true);
  assert.equal(restartedDuplicate.result.idempotent, true, 'terminal duplicate must remain idempotent after service restart');
  assert.equal(await readFile(join(runRoot, 'events.jsonl'), 'utf8'), eventsBeforeRestart,
    'terminal duplicate after restart must not reacquire actor or append lease/observation events');

});

test('DHR64 bootstrap: an invalid later Receipt rejects before any earlier Run takes a lease', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr64-bootstrap-preflight-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  const runtimeRoot = join(repoRoot, 'runtime');
  await mkdir(runtimeRoot, { recursive: true });
  const endpoint = endpointForRepo(repoRoot, { runtimeRoot });
  const v2Endpoint = endpointForRepo(repoRoot, { runtimeRoot, channel: 'v2' });
  const bootstrapEndpoint = endpointForRepo(repoRoot, { runtimeRoot, channel: 'bootstrap' });
  const firstRunId = 'R001-dhr64-bootstrap-first-20260830';
  const laterRunId = 'R001-dhr64-bootstrap-later-20260830';
  const firstRoot = join(repoRoot, '.dh-relay', firstRunId);
  const laterRoot = join(repoRoot, '.dh-relay', laterRunId);
  const firstStore = await createStore({ root: firstRoot, run: { ...run, run_id: firstRunId } });
  await firstStore.registerAttemptReceipt({ ...receipt, run_id: firstRunId, receipt_id: 'rcpt-bootstrap-first' });
  const laterStore = await createStore({ root: laterRoot, run: { ...run, run_id: laterRunId } });
  await laterStore.registerReceipt({
    receipt_id: 'rcpt-bootstrap-later', node_id: 'node-a', attempt_id: 'attempt-bootstrap-later',
    result_submission_mode: 'receipt-bound/v1',
  });
  await writeLedger(repoRoot, { version: 1, next_seq: 2, operations: {
    first: { run_id: firstRunId, phase: 'accepted', receipt_id: null },
    later: { run_id: laterRunId, phase: 'accepted', receipt_id: null },
  } });
  let service;
  try {
    await assert.rejects(() => startRuntimeService({
      repoRoot, endpoint, v2Endpoint, bootstrapEndpoint, localUserCapability: 'local-capability',
      indexPath: join(runtimeRoot, 'runs.json'),
    }), /E_STORE_MUTATION_RECOVERY_FAILED/);
  } finally {
    await service?.close();
  }
  const firstEvents = await readFile(join(firstRoot, 'events.jsonl'), 'utf8');
  assert.equal(firstEvents.includes('lease_acquired'), false, 'preflight rejection must not acquire the earlier Run lease');
});

test('DHR64 terminal duplicate: a forged persisted Receipt fails closed after restart', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr64-terminal-receipt-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  const runtimeRoot = join(repoRoot, 'runtime');
  await mkdir(runtimeRoot, { recursive: true });
  const endpoint = endpointForRepo(repoRoot, { runtimeRoot });
  const v2Endpoint = endpointForRepo(repoRoot, { runtimeRoot, channel: 'v2' });
  const bootstrapEndpoint = endpointForRepo(repoRoot, { runtimeRoot, channel: 'bootstrap' });
  const runId = 'R001-dhr64-terminal-receipt-20260830';
  const runRoot = join(repoRoot, '.dh-relay', runId);
  const store = await createStore({ root: runRoot, run: { ...run, run_id: runId } });
  const attemptReceipt = { ...receipt, run_id: runId, receipt_id: 'rcpt-terminal-forged' };
  await store.registerAttemptReceipt(attemptReceipt);
  await store.submitExecutorResult({
    protocol: 'relay.executor-result-submission/v1', receipt_id: attemptReceipt.receipt_id,
    outcome: 'succeeded', reason: null,
  });
  const persistedReceiptPath = join(runRoot, 'receipts', `${attemptReceipt.receipt_id}.json`);
  const forgedReceipt = JSON.parse(await readFile(persistedReceiptPath, 'utf8'));
  delete forgedReceipt.protocol;
  await writeFile(persistedReceiptPath, JSON.stringify(forgedReceipt), 'utf8');
  await writeLedger(repoRoot, { version: 1, next_seq: 1, operations: {
    claim: { run_id: runId, phase: 'accepted', receipt_id: null },
  } });
  const service = await startRuntimeService({
    repoRoot, endpoint, v2Endpoint, bootstrapEndpoint, localUserCapability: 'local-capability',
    indexPath: join(runtimeRoot, 'runs.json'),
  });
  t.after(() => service.close());
  const responses = new Map();
  const client = await createTransportClient(v2Endpoint, { onFrame: frame => { responses.set(frame.id, frame); } });
  t.after(() => client.destroy());
  const call = async (id, method, params) => {
    client.send({ jsonrpc: '2.0', id, method, handshake: {
      protocol_version: 'relay.rpc/v2', runtime_version: '0.0.0', capability_hash: localCapabilityHashV2(),
      client_id: 'dhr64-terminal-receipt-test', request_id: `dhr64-terminal-${id}`,
    }, params });
    return until(() => responses.get(id));
  };
  await call(1, 'contracts', {
    descriptor_version: service.descriptor.descriptor_version, repo_id: service.descriptor.repo_id,
    generation: service.descriptor.generation, local_user_capability: 'local-capability',
  });
  const duplicate = await call(2, 'submit-executor-result', {
    protocol: 'relay.executor-result-submission/v1', receipt_id: attemptReceipt.receipt_id,
    outcome: 'succeeded', reason: null,
  });
  assert.equal(duplicate.error?.data?.reason, 'E_STORE_MUTATION_RECOVERY_FAILED');
});

test('DHR64 CLI client: v2 bootstrap/handshake is explicit and does not downgrade', async (t) => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr64-cli-'));
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  const credentialRoot = join(repoRoot, 'credentials');
  const service = await startRuntimeService({ repoRoot, credentialRoot, indexPath: join(repoRoot, 'runs.json') });
  t.after(() => service.close());
  const envelope = buildV2RequestEnvelope({ method: 'submit-executor-result', params: {
    protocol: 'relay.executor-result-submission/v1', receipt_id: 'rcpt-cli', outcome: 'succeeded', reason: null,
  }, requestId: 'req-cli', clientId: 'cli-test' });
  assert.equal(envelope.handshake.protocol_version, 'relay.rpc/v2');
  assert.equal(envelope.handshake.capability_hash, localCapabilityHashV2());
  const client = await connectCliV2({ repoRoot, credentialRoot });
  t.after(() => client.close());
  const rejected = await client.call('submit-executor-result', envelope.params);
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error.reason, 'E_IDENTITY_MISMATCH');
});
