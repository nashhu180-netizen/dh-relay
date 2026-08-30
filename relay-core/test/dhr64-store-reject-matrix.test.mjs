import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { rejectPendingTransportWaiters } from '../cli/client.mjs';
import { buildFallbackPause } from '../runtime/executors/identity/fallback.mjs';
import { createStore } from '../store/store.mjs';

const HASH = 'a'.repeat(64);
const run = {
  protocol: 'relay.run/v2', run_id: 'RUN-DHR64-MATRIX', workflow_name: 'dhr64', summary: 'DHR64 matrix',
  trigger: 'system', created_at: '2026-08-30T00:00:00.000Z', labels: [],
  nodes: [{ node_id: 'node-a', title: 'A', role: 'work', required: true,
    executor_profiles: [{ kind: 'herdr-agent', ref: 'herdr.codex.main' }] }],
};
const identity = {
  executor_profile_id: 'herdr.codex.main', account_alias: 'acct-main',
  config_fingerprint: HASH, executor_capability_hash: HASH,
};
const receipt = {
  protocol: 'relay.attempt-receipt/v1', receipt_id: 'rcpt-dhr64-current', run_id: run.run_id,
  node_id: 'node-a', attempt_id: 'attempt-dhr64-current', issued_at: '2026-08-30T00:00:00.000Z',
  executor_identity: identity, fallback_profile_snapshots: [], result_submission_mode: 'receipt-bound/v1',
};
const submission = receiptId => ({
  protocol: 'relay.executor-result-submission/v1', receipt_id: receiptId, outcome: 'succeeded', reason: null,
});

test('DHR64 matrix: old Receipt and canonical fallback fence cannot commit Result', async (t) => {
  const staleRoot = await mkdtemp(join(tmpdir(), 'dhr64-stale-receipt-'));
  t.after(() => rm(staleRoot, { recursive: true, force: true }));
  const staleStore = await createStore({ root: staleRoot, run });
  const oldReceipt = { ...receipt, receipt_id: 'rcpt-dhr64-old', attempt_id: 'attempt-dhr64-old' };
  await staleStore.registerAttemptReceipt(oldReceipt);
  await staleStore.registerAttemptReceipt(receipt);
  assert.deepEqual(await staleStore.submitExecutorResult(submission(oldReceipt.receipt_id)),
    { ok: false, reason: 'E_IDENTITY_MISMATCH' });
  assert.deepEqual(await readdir(join(staleRoot, 'results')), []);

  const pausedRoot = await mkdtemp(join(tmpdir(), 'dhr64-fallback-pause-'));
  t.after(() => rm(pausedRoot, { recursive: true, force: true }));
  const pausedStore = await createStore({ root: pausedRoot, run });
  await pausedStore.registerAttemptReceipt(receipt);
  await pausedStore.appendFallbackPause(buildFallbackPause({
    runId: run.run_id, nodeId: receipt.node_id, attemptReceipt: receipt, raisedAt: '2026-08-30T00:00:01.000Z',
  }));
  assert.deepEqual(await pausedStore.submitExecutorResult(submission(receipt.receipt_id)),
    { ok: false, reason: 'E_ATTEMPT_FENCED' });
  assert.deepEqual(await readdir(join(pausedRoot, 'results')), []);
});

test('DHR64 matrix: v2 transport close rejects every in-flight waiter', async () => {
  const waiters = new Map();
  const pending = new Promise((resolve, reject) => {
    waiters.set(7, { resolve, reject, timer: setTimeout(() => reject(new Error('unexpected timeout')), 1_000) });
  });
  rejectPendingTransportWaiters(waiters, 'v2-socket-closed');
  await assert.rejects(pending, error => error?.reason === 'E_TRANSPORT_CLOSED');
  assert.equal(waiters.size, 0);
});
