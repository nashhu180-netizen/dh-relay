import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmod, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createStore, openStore } from '../store/store.mjs';
import { retryWithFrozenProfile } from '../runtime/attempt-retry.mjs';
import { createExecutorIdentity } from '../profiles/identity.mjs';
import { loadAjv, validateOne } from '../tools/validate.mjs';

const HASH = 'a'.repeat(64);
const identifier = (protocol, ...parts) => createHash('sha256').update(`${protocol}\n${parts.join('\n')}`, 'utf8').digest('hex');
const identity = {
  executor_profile_id: 'herdr.codex.main',
  account_alias: 'acct-codex-main',
  config_fingerprint: HASH,
  executor_capability_hash: HASH,
};

const run = {
  protocol: 'relay.run/v2', run_id: 'RUN-1', workflow_name: 'attempt-contract', summary: 'DHR_61 test',
  trigger: 'system', trigger_by: null, created_at: '2026-08-29T00:00:00Z', labels: [],
  nodes: [{ node_id: 'node-1', title: 'Node', required: true, executor_profiles: [{ kind: 'process', ref: 'worker.mjs' }] }],
};

function attemptReceipt() {
  return {
    protocol: 'relay.attempt-receipt/v1', receipt_id: 'receipt-1', run_id: 'RUN-1', node_id: 'node-1', attempt_id: 'attempt-1',
    issued_at: '2026-08-29T00:00:00.000Z', executor_identity: identity, fallback_profile_snapshots: [identity],
  };
}

function fallbackPause() {
  const run_id = 'RUN-1';
  const node_id = 'node-1';
  const attempt_id = 'attempt-1';
  const receipt_id = 'receipt-1';
  const reason_code = 'E_FALLBACK_UNAVAILABLE';
  return {
    protocol: 'relay.fallback-pause/v1', pause_id: identifier('fallback-pause/v1', run_id, node_id, attempt_id, receipt_id, reason_code), run_id, node_id, attempt_id, receipt_id,
    reason_code, raised_at: '2026-08-29T00:00:01.000Z',
    fence: { protocol: 'relay.attempt-fence/v1', fence_id: identifier('attempt-fence/v1', run_id, node_id, attempt_id, receipt_id, reason_code), attempt_id, receipt_id, reason_code, fenced_at: '2026-08-29T00:00:01.000Z' },
    attention: { protocol: 'relay.attention/v1', attention_id: identifier('attention/v1', run_id, node_id, attempt_id, receipt_id, reason_code), run_id, node_id, attempt_id, receipt_id, reason_code, state: 'open', raised_at: '2026-08-29T00:00:01.000Z' },
    manual_retry_profiles: [],
  };
}

function retryResolution() {
  return {
    protocol: 'relay.fallback-pause-resolution/v1',
    pause_id: fallbackPause().pause_id,
    attention_id: fallbackPause().attention.attention_id,
    executor_profile_id: identity.executor_profile_id,
    retry_request_id: HASH,
    resolved_at: '2026-08-29T00:00:02.000Z',
    attempt_id: 'attempt-2',
    receipt_id: 'receipt-2',
  };
}

function retryReceipt() {
  return {
    ...attemptReceipt(),
    receipt_id: 'receipt-2',
    attempt_id: 'attempt-2',
    issued_at: '2026-08-29T00:00:02.000Z',
  };
}

test('DHR_61 D1: Attempt Receipt freezes a non-secret identity and its ordered fallback snapshots', () => {
  const { ajv, byId } = loadAjv();
  const receipt = attemptReceipt();

  assert.equal(validateOne(ajv, byId, 'relay.attempt-receipt/v1', receipt).ok, true);
  assert.equal(validateOne(ajv, byId, 'relay.attempt-receipt/v1', {
    ...receipt,
    executor_identity: { ...identity, password: 'must-not-enter-a-receipt' },
  }).ok, false, 'Receipt must reject credential-shaped fields rather than persist them');
  assert.equal(validateOne(ajv, byId, 'relay.attempt-receipt/v1', {
    ...receipt,
    fallback_profile_snapshots: Array.from({ length: 7 }, () => identity),
  }).ok, false, 'The frozen fallback route is capped at six snapshots');
});

test('DHR_61 D1: Store persists and replays the same validated Attempt Receipt', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr61-attempt-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });

  assert.deepEqual(await store.registerAttemptReceipt(attemptReceipt()), { ok: true, idempotent: false });
  assert.deepEqual(await store.registerAttemptReceipt(attemptReceipt()), { ok: true, idempotent: true });
  const saved = JSON.parse(await readFile(join(root, 'receipts', 'receipt-1.json'), 'utf8'));
  assert.deepEqual(
    (({ issued_seq, ...receipt }) => receipt)(saved),
    attemptReceipt(),
    'the persisted artifact must contain the same frozen identity snapshot',
  );
  const reopened = await openStore({ root });
  assert.deepEqual(reopened.events, store.events, 'replay must retain the receipt-backed attempt event');
});

test('DHR_61 D2: one canonical pause fences the old Attempt and projects waiting_human', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr61-pause-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.registerAttemptReceipt(attemptReceipt());

  assert.deepEqual(await store.appendFallbackPause(fallbackPause()), { ok: true, idempotent: false });
  assert.deepEqual(await store.appendFallbackPause(fallbackPause()), { ok: true, idempotent: true }, 'same canonical pause must not append another seq');
  assert.equal((await store.readState()).node_states[0].status, 'waiting_human');
  assert.deepEqual(
    await store.appendCheckpoint({ receipt_id: 'receipt-1', node_id: 'node-1', attempt_id: 'attempt-1', checkpoint_id: 'late-checkpoint', payload_digest: HASH, at: '2026-08-29T00:00:02.000Z' }),
    { ok: false, reason: 'E_ATTEMPT_FENCED' },
  );
});

test('DHR_61 D2: a pause with a forged derived identifier is rejected before it can fence an Attempt', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr61-pause-id-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.registerAttemptReceipt(attemptReceipt());
  await assert.rejects(() => store.appendFallbackPause({ ...fallbackPause(), fence: { ...fallbackPause().fence, fence_id: HASH } }),
    /E_FALLBACK_PAUSE_INVALID/);
});

test('DHR_61 D2: manual retry profiles must remain an ordered subset of the Receipt snapshots', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr61-pause-frozen-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  const second = { ...identity, executor_profile_id: 'herdr.codex.second', account_alias: 'acct-codex-second' };
  await store.registerAttemptReceipt({ ...attemptReceipt(), fallback_profile_snapshots: [identity, second] });

  await assert.rejects(
    () => store.appendFallbackPause({ ...fallbackPause(), manual_retry_profiles: [{ ...identity, executor_profile_id: 'herdr.codex.late' }] }),
    /E_FALLBACK_PAUSE_INVALID:profile-not-frozen/,
  );
  await assert.rejects(
    () => store.appendFallbackPause({ ...fallbackPause(), manual_retry_profiles: [second, identity] }),
    /E_FALLBACK_PAUSE_INVALID:profile-not-frozen/,
  );
  assert.deepEqual(await store.appendFallbackPause({ ...fallbackPause(), manual_retry_profiles: [second] }), { ok: true, idempotent: false });
});

test('DHR_61 D2: opening a Store completes a prepared pause mutation before allowing writes', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr61-pause-recovery-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.registerAttemptReceipt(attemptReceipt());
  const beforeEvents = await readFile(join(root, 'events.jsonl'), 'utf8');
  await store.appendFallbackPause(fallbackPause());
  const transactionId = (await readdir(join(root, 'mutations'))).find(name => name.endsWith('.prepared.json')).replace('.prepared.json', '');
  await rm(join(root, 'mutations', `${transactionId}.committed`));
  await writeFile(join(root, 'events.jsonl'), beforeEvents, 'utf8');
  const reopened = await openStore({ root });
  assert.equal((await reopened.readState()).node_states[0].status, 'waiting_human');
  assert.deepEqual(await reopened.appendResult({ receipt_id: 'receipt-1', node_id: 'node-1', attempt_id: 'attempt-1',
    executor_kind: 'process', outcome: 'failed', reason: 'E_BAD_VALUE', at: '2026-08-29T00:00:02.000Z', payload_digest: HASH, structured: {} }),
  { ok: false, reason: 'E_ATTEMPT_FENCED' });
});

test('DHR_61 D2: an incomplete pause without its recoverable mutation fails closed', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr61-pause-corrupt-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.registerAttemptReceipt(attemptReceipt());
  const beforeEvents = await readFile(join(root, 'events.jsonl'), 'utf8');
  await store.appendFallbackPause(fallbackPause());
  await writeFile(join(root, 'events.jsonl'), beforeEvents, 'utf8');
  await rm(join(root, 'mutations'), { recursive: true, force: true });
  await assert.rejects(() => openStore({ root }), /E_STORE_MUTATION_RECOVERY_FAILED:pause-ledger-incomplete/);
});

test('DHR_61 D2: a tampered mutation journal cannot escape the Run root', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr61-pause-escape-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.registerAttemptReceipt(attemptReceipt());
  await store.appendFallbackPause(fallbackPause());
  const journalName = (await readdir(join(root, 'mutations'))).find(name => name.endsWith('.prepared.json'));
  const journalPath = join(root, 'mutations', journalName);
  const journal = JSON.parse(await readFile(journalPath, 'utf8'));
  journal.targets[0].path = '../../outside.json';
  await writeFile(journalPath, JSON.stringify(journal), 'utf8');
  await rm(join(root, 'mutations', `${journal.transaction_id}.committed`));
  await assert.rejects(() => openStore({ root }), /E_STORE_MUTATION_RECOVERY_FAILED:path-escape/);
});

test('DHR_61 D2: committed pause and resolution journals are not replayed after later ledger writes', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr61-committed-reopen-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.registerAttemptReceipt(attemptReceipt());
  await store.appendFallbackPause({ ...fallbackPause(), manual_retry_profiles: [identity] });
  await store.appendFallbackPauseResolution({ resolution: retryResolution(), attempt_receipt: retryReceipt() });
  const reopened = await openStore({ root });
  assert.equal((await reopened.readState()).node_states[0].current_attempt_id, 'attempt-2');
  assert.deepEqual(await reopened.openAttentions(), []);
});

test('DHR_61 D2: raw pause events and terminal-to-pause regressions are rejected at the Store boundary', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr61-pause-boundary-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.registerAttemptReceipt(attemptReceipt());
  await assert.rejects(() => store.appendEvent({
    kind: 'fallback_pause_created', at: fallbackPause().raised_at, node_id: 'node-1', attempt_id: 'attempt-1',
    reason: 'E_FALLBACK_UNAVAILABLE', detail: JSON.stringify(fallbackPause()),
  }), /E_TERMINAL_STATE_CONFLICT:fallback_pause_created-via-raw-append/);
  await store.appendResult({ receipt_id: 'receipt-1', node_id: 'node-1', attempt_id: 'attempt-1',
    executor_kind: 'process', outcome: 'succeeded', reason: null, at: '2026-08-29T00:00:02.000Z', payload_digest: HASH, structured: {} });
  await assert.rejects(() => store.appendFallbackPause(fallbackPause()), /E_TERMINAL_STATE_CONFLICT:fallback-pause-after-terminal/);
});

test('DHR_61 D2: a retry resolution atomically closes the pause and opens one fresh Attempt', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr61-resolution-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.registerAttemptReceipt(attemptReceipt());
  await store.appendFallbackPause({ ...fallbackPause(), manual_retry_profiles: [identity] });

  assert.deepEqual(await store.appendFallbackPauseResolution({ resolution: retryResolution(), attempt_receipt: retryReceipt() }),
    { ok: true, idempotent: false, resolution: retryResolution(), attempt_receipt: retryReceipt() });
  assert.equal((await store.readState()).node_states[0].current_attempt_id, 'attempt-2');
  assert.equal((await store.readState()).node_states[0].status, 'running');
  assert.deepEqual(await store.openAttentions(), []);
  assert.deepEqual(await store.appendResult({ receipt_id: 'receipt-1', node_id: 'node-1', attempt_id: 'attempt-1',
    executor_kind: 'process', outcome: 'failed', reason: 'E_BAD_VALUE', at: '2026-08-29T00:00:03.000Z', payload_digest: HASH, structured: {} }),
  { ok: false, reason: 'E_ATTEMPT_FENCED' });
  assert.deepEqual(await store.appendFallbackPauseResolution({ resolution: retryResolution(), attempt_receipt: retryReceipt() }),
    { ok: true, idempotent: true, resolution: retryResolution(), attempt_receipt: retryReceipt() });
  const conflictingResolution = { ...retryResolution(), retry_request_id: 'c'.repeat(64), attempt_id: 'attempt-3', receipt_id: 'receipt-3' };
  const conflictingReceipt = { ...retryReceipt(), attempt_id: 'attempt-3', receipt_id: 'receipt-3' };
  assert.deepEqual(await store.appendFallbackPauseResolution({ resolution: conflictingResolution, attempt_receipt: conflictingReceipt }),
    { ok: false, reason: 'E_FALLBACK_PAUSE_CONFLICT' });
});

test('DHR_61 D2: a retry may only select a frozen snapshot and a closed pause rejects a new key', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr61-resolution-negative-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = await createStore({ root, run });
  await store.registerAttemptReceipt(attemptReceipt());
  await store.appendFallbackPause(fallbackPause());
  await assert.rejects(() => store.appendFallbackPauseResolution({ resolution: retryResolution(), attempt_receipt: retryReceipt() }), /E_FALLBACK_PAUSE_RESOLUTION_INVALID:profile-not-frozen/);
});

test('DHR_61 D2: retry-with-profile rechecks the current nonsecret projection before the atomic resolution', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr61-retry-profile-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const profileHome = join(root, 'profile');
  const registryPath = join(root, 'registry.json');
  await (await import('node:fs/promises')).mkdir(profileHome);
  await writeFile(join(profileHome, 'config.toml'), 'model = "test-model"\n', 'utf8');
  const profile = {
    executor_profile_id: identity.executor_profile_id, backend: 'herdr', product: 'codex-cli', command_alias: 'codex', account_alias: identity.account_alias,
    capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' },
    supported_platforms: ['win32'], headless_supported: true,
    config_fingerprint_rule: { kind: 'file-exists', path_template: '${DHR61_RETRY_HOME}/config.toml', fields: [{ pointer: '/model', classification: 'nonsecret' }] },
    fallback_profile_ids: ['herdr.codex.backup'],
  };
  const fallbackProfile = { ...profile, executor_profile_id: 'herdr.codex.backup', account_alias: 'acct-backup', fallback_profile_ids: [] };
  await writeFile(registryPath, JSON.stringify({ profiles: [profile, fallbackProfile] }), 'utf8');
  const environment = { DHR61_RETRY_HOME: profileHome };
  const frozen = createExecutorIdentity(profile, { '/model': 'test-model' });
  const frozenFallback = createExecutorIdentity(fallbackProfile, { '/model': 'test-model' });
  const store = await createStore({ root: join(root, 'run'), run });
  await store.registerAttemptReceipt({ ...attemptReceipt(), executor_identity: frozen, fallback_profile_snapshots: [frozen] });
  await store.appendFallbackPause({ ...fallbackPause(), manual_retry_profiles: [frozen] });
  const result = await retryWithFrozenProfile({ store, registryPath, environment, params: {
    run_id: run.run_id, node_id: 'node-1', pause_id: fallbackPause().pause_id,
    executor_profile_id: frozen.executor_profile_id, retry_request_id: 'b'.repeat(64),
  }, now: () => '2026-08-29T00:00:02.000Z' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.attempt_receipt.fallback_profile_snapshots, [frozenFallback]);
  assert.deepEqual(await retryWithFrozenProfile({ store, registryPath, environment, params: {
    run_id: run.run_id, node_id: 'node-1', pause_id: fallbackPause().pause_id,
    executor_profile_id: frozen.executor_profile_id, retry_request_id: 'b'.repeat(64),
  } }), { ...result, idempotent: true }, 'same retry key must return the committed fresh Attempt');
  await writeFile(join(profileHome, 'config.toml'), 'model = "changed"\n', 'utf8');
  const secondStore = await createStore({ root: join(root, 'run-2'), run });
  await secondStore.registerAttemptReceipt({ ...attemptReceipt(), executor_identity: frozen, fallback_profile_snapshots: [frozen] });
  await secondStore.appendFallbackPause({ ...fallbackPause(), manual_retry_profiles: [frozen] });
  await assert.rejects(() => retryWithFrozenProfile({ store: secondStore, registryPath, environment, params: {
    run_id: run.run_id, node_id: 'node-1', pause_id: fallbackPause().pause_id,
    executor_profile_id: frozen.executor_profile_id, retry_request_id: 'c'.repeat(64),
  } }), /E_FALLBACK_PAUSE_RESOLUTION_INVALID:profile-snapshot-mismatch/);
});

test('DHR_61 D2: a failed mutation poisons the live handle until reopen completes recovery',
  { skip: process.platform !== 'win32' }, async (t) => {
    const root = await mkdtemp(join(tmpdir(), 'dhr61-mutation-poison-'));
    const statePath = join(root, 'state.json');
    t.after(async () => {
      await chmod(statePath, 0o666).catch(() => {});
      await rm(root, { recursive: true, force: true });
    });
    const store = await createStore({ root, run });
    await store.registerAttemptReceipt(attemptReceipt());

    await chmod(statePath, 0o444);
    await assert.rejects(() => store.appendFallbackPause(fallbackPause()), /EPERM|EACCES/);
    await assert.rejects(() => store.appendCheckpoint({
      receipt_id: 'receipt-1', node_id: 'node-1', attempt_id: 'attempt-1',
      checkpoint_id: 'after-failed-mutation', payload_digest: HASH, at: '2026-08-29T00:00:02.000Z',
    }), /E_STORE_MUTATION_RECOVERY_FAILED:reopen-required/);

    await chmod(statePath, 0o666);
    const reopened = await openStore({ root });
    assert.equal((await reopened.openAttentions()).length, 1,
      'reopen must finish the prepared pause rather than lose or duplicate it');
  });
