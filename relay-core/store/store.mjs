import { appendFile, mkdir, open, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

import { loadAjv, validateOne } from '../tools/validate.mjs';
import { digest, jcs } from '../tools/canonical.mjs';
import { applyEvents, replayRun } from './state.mjs';

const encode = (value) => JSON.stringify(value);

const EVENT_SCHEMA_ID = 'relay.event/v2';
const LEGACY_HOST_REF_SENTINEL = `herdr-terminal/sha256-${'0'.repeat(64)}`;
const ATTEMPT_RECEIPT_SCHEMA_ID = 'relay.attempt-receipt/v1';
const RESULT_SCHEMA_ID = 'relay.result/v2';
const RESULT_SUBMISSION_SCHEMA_ID = 'relay.executor-result-submission/v1';
const FALLBACK_PAUSE_SCHEMA_ID = 'relay.fallback-pause/v1';
const FALLBACK_PAUSE_RESOLUTION_SCHEMA_ID = 'relay.fallback-pause-resolution/v1';
const MUTATION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// 这些 kind 直接决定回放出的节点状态。节点的当前 attempt 定了终态之后再写它们，
// 就是对已定终态的污染——一律拒绝；隔离留痕 late_result_quarantined 不在此列，
// 它不推进任何状态，终态后仍必须可写（可追溯）。
const LIFECYCLE_KINDS = new Set(['node_started', 'attempt_started', 'checkpoint_recorded', 'human_input_requested']);

// F-011（DHR_29 移交，DHR_51 封堵）：终态 kind 只能由 appendResult 记账。公开 raw 入口
// 一旦放行它们，就能绕过终态守卫直接污染回放——attempt_* 三兄弟在 schema 里带
// node_id/attempt_id、看起来像正常事件，实则越过「结果 → 终态」的唯一通道。
const TERMINAL_RESULT_KINDS = new Set(['attempt_succeeded', 'attempt_failed', 'attempt_orphaned']);
const MUTATION_ONLY_KINDS = new Set(['fallback_pause_created', 'fallback_pause_resolved']);

let validatorCache;
function eventValidator() {
  validatorCache ??= loadAjv();
  return validatorCache;
}

function assertAttemptReceipt(receipt) {
  const { ajv, byId } = eventValidator();
  const verdict = validateOne(ajv, byId, ATTEMPT_RECEIPT_SCHEMA_ID, receipt);
  if (!verdict.ok) throw new Error(`E_SCHEMA_INVALID:${verdict.reason}`);
}

function attemptReceiptContract(receipt) {
  const { issued_seq: ignored, ...contract } = receipt;
  return contract;
}

function assertResultSubmission(submission) {
  const { ajv, byId } = eventValidator();
  const verdict = validateOne(ajv, byId, RESULT_SUBMISSION_SCHEMA_ID, submission);
  if (!verdict.ok) throw new Error(`E_SCHEMA_INVALID:${verdict.reason}`);
}

function assertResult(result) {
  const { ajv, byId } = eventValidator();
  const verdict = validateOne(ajv, byId, RESULT_SCHEMA_ID, result);
  if (!verdict.ok) throw new Error(`E_SCHEMA_INVALID:${verdict.reason}`);
}

export function receiptBoundResultDigest(result) {
  return digest({
    protocol: result.protocol,
    run_id: result.run_id,
    node_id: result.node_id,
    attempt_id: result.attempt_id,
    receipt_id: result.receipt_id,
    executor_kind: result.executor_kind,
    outcome: result.outcome,
    reason: result.reason ?? null,
    structured: { source: 'receipt-bound-submission/v1' },
  });
}

function assertResultLedger(run, events, receipts, results) {
  for (const result of results.values()) {
    if (result?.protocol !== RESULT_SCHEMA_ID) continue;
    assertResult(result);
    const receipt = receipts.get(result.receipt_id);
    if (!receipt || receipt.run_id !== run.run_id || receipt.result_submission_mode !== 'receipt-bound/v1'
      || result.run_id !== run.run_id || result.node_id !== receipt.node_id
      || result.attempt_id !== receipt.attempt_id || result.executor_kind !== 'herdr-agent') {
      throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:result-identity-mismatch');
    }
    assertAttemptReceipt(attemptReceiptContract(receipt));
    if (result.structured?.source !== 'receipt-bound-submission/v1'
      || Object.keys(result.structured ?? {}).length !== 1
      || result.log_locator !== null || result.quarantined !== false
      || result.payload_digest !== receiptBoundResultDigest(result)) {
      throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:result-digest-mismatch');
    }
    const kind = result.outcome === 'succeeded' ? 'attempt_succeeded' : result.outcome === 'failed' ? 'attempt_failed' : null;
    const event = events.find(item => item.run_id === run.run_id && item.kind === kind && item.node_id === result.node_id
      && item.attempt_id === result.attempt_id && item.at === result.finished_at
      && item.reason === (result.reason ?? null) && item.detail === `receipt:${result.receipt_id}`);
    if (!event) throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:result-ledger-incomplete');
  }
  for (const event of events.filter(item => ['attempt_succeeded', 'attempt_failed'].includes(item.kind))) {
    const receiptId = typeof event.detail === 'string' && event.detail.startsWith('receipt:')
      ? event.detail.slice('receipt:'.length) : null;
    if (receiptId && !results.has(receiptId)) {
      throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:result-ledger-incomplete');
    }
  }
}

function assertFallbackPause(pause) {
  const { ajv, byId } = eventValidator();
  const verdict = validateOne(ajv, byId, FALLBACK_PAUSE_SCHEMA_ID, pause);
  if (!verdict.ok) throw new Error(`E_SCHEMA_INVALID:${verdict.reason}`);
}

function assertFallbackPauseResolution(resolution) {
  const { ajv, byId } = eventValidator();
  const verdict = validateOne(ajv, byId, FALLBACK_PAUSE_RESOLUTION_SCHEMA_ID, resolution);
  if (!verdict.ok) throw new Error(`E_SCHEMA_INVALID:${verdict.reason}`);
}

function assertPauseLedger(events, pauses) {
  for (const pause of pauses.values()) {
    const detail = jcs(pause);
    const event = events.find(item => item.kind === 'fallback_pause_created'
      && item.node_id === pause.node_id && item.attempt_id === pause.attempt_id
      && item.at === pause.raised_at && item.reason === pause.reason_code && item.detail === detail);
    if (!event) throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:pause-ledger-incomplete');
  }
  for (const event of events.filter(item => item.kind === 'fallback_pause_created')) {
    let pause;
    try { pause = JSON.parse(event.detail); } catch { throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:pause-ledger-invalid'); }
    assertFallbackPause(pause);
    const stored = pauses.get(pause.pause_id);
    if (!stored || jcs(pause) !== event.detail || jcs(stored) !== event.detail
      || event.node_id !== pause.node_id || event.attempt_id !== pause.attempt_id
      || event.at !== pause.raised_at || event.reason !== pause.reason_code) {
      throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:pause-ledger-incomplete');
    }
  }
}

function assertResolutionLedger(events, resolutions, pauses, receipts) {
  for (const record of resolutions.values()) {
    const { resolution, attempt_receipt: attemptReceipt } = record;
    const pause = pauses.get(resolution.pause_id);
    const event = events.find(item => item.kind === 'fallback_pause_resolved'
      && item.node_id === pause?.node_id && item.attempt_id === resolution.attempt_id
      && item.at === resolution.resolved_at && item.detail === jcs(resolution));
    if (!pause || !event || !receipts.has(resolution.receipt_id)
      || jcs((({ issued_seq, ...value }) => value)(receipts.get(resolution.receipt_id))) !== jcs(attemptReceipt)) {
      throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:resolution-ledger-incomplete');
    }
  }
  for (const event of events.filter(item => item.kind === 'fallback_pause_resolved')) {
    let resolution;
    try { resolution = JSON.parse(event.detail); } catch { throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:resolution-ledger-invalid'); }
    assertFallbackPauseResolution(resolution);
    const record = resolutions.get(`${resolution.pause_id}\u0000${resolution.retry_request_id}`);
    if (!record || jcs(record.resolution) !== event.detail
      || event.node_id !== record.attempt_receipt.node_id || event.attempt_id !== resolution.attempt_id
      || event.at !== resolution.resolved_at) {
      throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:resolution-ledger-incomplete');
    }
  }
}

// 所有变更操作串行过这一队列：seq 分配与落盘之间隔着 await，不排队则并发 append 会重号。
function createWriteQueue() {
  let tail = Promise.resolve();
  return (job) => {
    const outcome = tail.then(job);
    tail = outcome.then(() => undefined, () => undefined);
    return outcome;
  };
}

function requireId(value, label) {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`E_BAD_VALUE:${label}-required`);
  return value;
}

function validateRunSemantics(run) {
  const nodeIds = run.nodes.map((node) => node.node_id);
  if (new Set(nodeIds).size !== nodeIds.length) throw new Error('E_BAD_VALUE:duplicate-node-id');
  const labels = run.labels ?? [];
  for (let index = 0; index < labels.length; index += 1) {
    if (index > 0 && labels[index - 1].key > labels[index].key) {
      throw new Error('E_BAD_VALUE:labels-not-sorted');
    }
    if (index > 0 && labels[index - 1].key === labels[index].key) throw new Error('E_BAD_VALUE:duplicate-label-key');
  }
}

function redactStructured(value) {
  if (typeof value === 'string') {
    return value
      .replace(/\b(?:api[_-]?key|apikey|x-api-key)\b\s*[:=]\s*["']?([A-Za-z0-9_-]{8,})["']?/gi, (_, secret) => _.replace(secret, '<REDACTED:api_key>'))
      .replace(/\bsk-[A-Za-z0-9_-]{10,}\b/g, '<REDACTED:api_key>')
      .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '<REDACTED:private_key>')
      .replace(/\b(?:password|passwd|pwd)\b\s*[:=]\s*["']?([^\s"']{4,})["']?/gi, (_, secret) => _.replace(secret, '<REDACTED:password>'));
  }
  if (Array.isArray(value)) return value.map(redactStructured);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, nested]) => {
    if (/^(?:api[_-]?key|apikey|x-api-key)$/i.test(key)) return [key, '<REDACTED:api_key>'];
    if (/^(?:password|passwd|pwd)$/i.test(key)) return [key, '<REDACTED:password>'];
    return [key, redactStructured(nested)];
  }));
  return value;
}

async function writeCreateNew(path, value) {
  await writeFile(path, encode(value), { encoding: 'utf8', flag: 'wx' });
}

async function writeAtomic(path, value) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, encode(value), 'utf8');
  await rename(temporary, path);
}

const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

async function readTextOrAbsent(path) {
  try { return await readFile(path, 'utf8'); } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

async function writeAtomicText(path, text) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  const handle = await open(temporary, 'w');
  try { await handle.writeFile(text, 'utf8'); await handle.sync(); } finally { await handle.close(); }
  await rename(temporary, path);
  const directory = await open(dirname(path), 'r');
  try {
    try { await directory.sync(); } catch (error) {
      if (process.platform !== 'win32' || error?.code !== 'EPERM') throw error;
    }
  } finally { await directory.close(); }
}

async function readCommittedMarker(mutationRoot, transactionId) {
  const markerText = await readTextOrAbsent(join(mutationRoot, `${transactionId}.committed`));
  if (markerText === null) return false;
  let marker;
  try { marker = JSON.parse(markerText); } catch { throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:marker-unreadable'); }
  if (marker?.protocol !== 'relay.store-mutation/v1' || marker?.transaction_id !== transactionId || marker?.state !== 'committed') {
    throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:marker-invalid');
  }
  return true;
}

async function commitMutation(root, targets) {
  const mutationRoot = join(root, 'mutations');
  const transaction_id = randomUUID();
  const blobRoot = join(mutationRoot, 'staging', transaction_id);
  await mkdir(blobRoot, { recursive: true });
  const preparedTargets = [];
  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index];
    const before = await readTextOrAbsent(target.path);
    const blob = join(blobRoot, `${index}.blob`);
    await writeAtomicText(blob, target.content);
    preparedTargets.push({ path: relative(root, target.path).replaceAll('\\', '/'), blob: relative(root, blob).replaceAll('\\', '/'),
      before_hash: before === null ? null : sha256(before), staging_hash: sha256(target.content) });
  }
  const journal = { protocol: 'relay.store-mutation/v1', transaction_id, state: 'prepared', targets: preparedTargets };
  const journalPath = join(mutationRoot, `${transaction_id}.prepared.json`);
  await writeAtomicText(journalPath, jcs(journal));
  await applyPreparedMutation(root, journal);
  await writeAtomicText(join(mutationRoot, `${transaction_id}.committed`), jcs({ protocol: 'relay.store-mutation/v1', transaction_id, state: 'committed' }));
}

async function applyPreparedMutation(root, journal) {
  if (journal?.protocol !== 'relay.store-mutation/v1' || journal?.state !== 'prepared'
    || !MUTATION_ID_PATTERN.test(journal?.transaction_id ?? '') || !Array.isArray(journal.targets)) {
    throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:journal-invalid');
  }
  for (const target of journal.targets) {
    if (typeof target.path !== 'string' || typeof target.blob !== 'string' || typeof target.staging_hash !== 'string') {
      throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:target-invalid');
    }
    const underRoot = (candidate) => {
      const path = resolve(root, candidate);
      const fromRoot = relative(root, path);
      if (fromRoot === '' || fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
        throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:path-escape');
      }
      return path;
    };
    const blob = await readTextOrAbsent(underRoot(target.blob));
    if (blob === null || sha256(blob) !== target.staging_hash) throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:blob-invalid');
    const path = underRoot(target.path);
    const current = await readTextOrAbsent(path);
    const currentHash = current === null ? null : sha256(current);
    if (currentHash === target.staging_hash) continue;
    if (currentHash !== target.before_hash) throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:target-conflict');
    await writeAtomicText(path, blob);
    const verified = await readTextOrAbsent(path);
    if (verified === null || sha256(verified) !== target.staging_hash) throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:target-write');
  }
}

async function recoverMutations(root) {
  const mutationRoot = join(root, 'mutations');
  let names;
  try { names = await readdir(mutationRoot); } catch (error) { if (error?.code === 'ENOENT') return; throw error; }
  for (const name of names.filter(item => item.endsWith('.prepared.json')).sort()) {
    try {
      const journal = JSON.parse(await readFile(join(mutationRoot, name), 'utf8'));
      if (name !== `${journal?.transaction_id}.prepared.json`) throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:transaction-id-mismatch');
      if (!MUTATION_ID_PATTERN.test(journal?.transaction_id ?? '')) throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:journal-invalid');
      if (await readCommittedMarker(mutationRoot, journal.transaction_id)) continue;
      await applyPreparedMutation(root, journal);
      await writeAtomicText(join(mutationRoot, `${journal.transaction_id}.committed`), jcs({ protocol: 'relay.store-mutation/v1', transaction_id: journal.transaction_id, state: 'committed' }));
    } catch (error) {
      if (String(error?.message ?? error).startsWith('E_STORE_MUTATION_RECOVERY_FAILED')) throw error;
      throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:journal-unreadable');
    }
  }
}

export { replayRun };

/** DHR_30：operation Receipt 的 state ↔ 事件 kind 是一一对应的，不允许第三种写法。 */
const OPERATION_EVENT_KIND = {
  in_flight: 'operation_accepted',
  committed: 'operation_committed',
  failed: 'operation_failed',
};

function cursorGap(detail) {
  const error = new Error(`E_CURSOR_GAP:${detail}`);
  error.reason = 'E_CURSOR_GAP';
  return error;
}

function createHandle({ root, run, events, receipts, checkpoints, results, operations, pauses, resolutions, enqueue, writeGuard = null }) {
  const runPath = join(root, 'run.json');
  const eventsPath = join(root, 'events.jsonl');
  const statePath = join(root, 'state.json');
  const receiptsPath = join(root, 'receipts');
  const checkpointsPath = join(root, 'checkpoints');
  const resultsPath = join(root, 'results');
  const quarantinePath = join(root, 'quarantine');
  const operationsPath = join(root, 'operations');
  const pausesPath = join(root, 'pauses');
  const resolutionsPath = join(root, 'pause-resolutions');
  const fencedAttempts = new Set([...pauses.values()].map(pause => `${pause.attempt_id}\u0000${pause.receipt_id}`));
  let mutationRecoveryRequired = false;

  /**
   * 订阅者（连接本地，纯内存）。design/08 §5 的 barrier：注册发生在**写队列内**，
   * 于是「快照截止到哪一条」与「从哪一条开始推」由同一次串行化决定，两者之间没有缝隙。
   * 推送只做一次同步入列，真正的网络发送由订阅方在队列外做——不让慢客户端堵住 Store 写。
   */
  const subscribers = new Set();

  // fencing（DHR_51 · 移交②）：可选写权卫兵，在串行队列内、每次变更落盘前调用；
  // 抛错即中止本次变更（事件与工件都不落盘）。Store 不理解卫兵语义——保持域中立。
  const guardedJob = async (job) => {
    if (mutationRecoveryRequired) throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:reopen-required');
    if (writeGuard) await writeGuard();
    return job();
  };
  const runWrite = (job) => enqueue(() => guardedJob(job));

  async function commitStoreMutation(targets) {
    try {
      // Admission was guarded when this serialized job began. Recheck at the
      // durable mutation boundary because the lease may be lost while the
      // Result, event and state targets are being derived.
      if (writeGuard) await writeGuard();
      await commitMutation(root, targets);
    } catch (error) {
      mutationRecoveryRequired = true;
      throw error;
    }
  }

  function ensureKnownNode(nodeId) {
    if (!run.nodes.some((node) => node.node_id === nodeId)) throw new Error('E_BAD_VALUE:unknown-node');
  }

  function currentReceipt(nodeId) {
    return [...receipts.values()]
      .filter((receipt) => receipt.node_id === nodeId)
      .sort((left, right) => left.issued_seq - right.issued_seq)
      .at(-1);
  }

  function executorKindForReceipt(receipt) {
    const profileId = receipt?.executor_identity?.executor_profile_id;
    const node = run.nodes.find(item => item.node_id === receipt?.node_id);
    const profile = node?.executor_profiles?.find(item => item?.ref === profileId
      || item?.executor_profile_id === profileId);
    return profile?.kind ?? null;
  }

  function bridgePayloadDigest({ receipt, outcome, reason, executorKind }) {
    return receiptBoundResultDigest({
      protocol: RESULT_SCHEMA_ID,
      run_id: receipt.run_id,
      node_id: receipt.node_id,
      attempt_id: receipt.attempt_id,
      receipt_id: receipt.receipt_id,
      executor_kind: executorKind,
      outcome,
      reason,
    });
  }

  // 节点「当前 attempt」的终态。终态按 receipt（= attempt）记账：旧 attempt 的终态
  // 锁不住新 attempt（重试路径），只锁它自己。
  function terminalOf(nodeId) {
    const current = currentReceipt(nodeId);
    return current ? results.get(current.receipt_id) : undefined;
  }

  /** 本次写里新产生、尚未通知订阅者的事件。见 persistState 的顺序说明。 */
  let pendingNotifications = [];

  /**
   * 写快照并**在此之后**通知订阅者。
   * 顺序是有讲究的：订阅方要按 `(event, state)` 成对渲染，而 state 只有在 replay 完这条事件
   * 之后才是对的。在 append 之后立刻通知，推出去的 state 会是上一条事件时的旧快照。
   */
  async function persistState() {
    const state = replayRun({ run, events });
    await writeAtomic(statePath, state);
    const emitted = pendingNotifications;
    pendingNotifications = [];
    for (const event of emitted) {
      for (const listener of subscribers) {
        try { listener(event, state); } catch { /* 订阅者自身的问题不回灌 Store 写路径 */ }
      }
    }
  }

  // 仅在写队列内调用：校验 → 守卫 → 落盘 → 进内存账。
  async function emitEvent(input) {
    const event = {
      protocol: 'relay.event/v2',
      run_id: run.run_id,
      seq: events.length,
      at: input.at,
      kind: input.kind,
      node_id: input.node_id ?? null,
      attempt_id: input.attempt_id ?? null,
      executor_kind: input.executor_kind ?? null,
      executor_ref: input.executor_ref ?? null,
      host_ref: input.host_ref ?? null,
      observation_status: input.observation_status ?? null,
      reason: input.reason ?? null,
    };
    if (input.detail !== undefined && input.detail !== null) event.detail = input.detail;

    const { ajv, byId } = eventValidator();
    const verdict = validateOne(ajv, byId, EVENT_SCHEMA_ID, event);
    if (!verdict.ok) throw new Error(`E_SCHEMA_INVALID:${verdict.reason}`);

    if (LIFECYCLE_KINDS.has(event.kind) && event.node_id !== null) {
      ensureKnownNode(event.node_id);
      const current = currentReceipt(event.node_id);
      if (current && event.attempt_id !== null && event.attempt_id !== current.attempt_id) {
        throw new Error('E_IDENTITY_MISMATCH:attempt-not-current');
      }
      if (current && terminalOf(event.node_id)) {
        throw new Error(`E_TERMINAL_STATE_CONFLICT:${event.kind}-after-terminal`);
      }
    }

    await appendFile(eventsPath, `${encode(event)}\n`, 'utf8');
    events.push(event);
    pendingNotifications.push(event);
    return event;
  }

  function publishCommitted(eventsToPublish, state) {
    for (const event of eventsToPublish) {
      for (const listener of subscribers) {
        try { listener(event, state); } catch { /* 订阅者自身的问题不回灌 Store 写路径 */ }
      }
    }
  }

  async function registerReceipt(receipt) {
    requireId(receipt?.receipt_id, 'receipt-id');
    requireId(receipt?.attempt_id, 'attempt-id');
    ensureKnownNode(requireId(receipt?.node_id, 'node-id'));
    const prior = receipts.get(receipt.receipt_id);
    if (prior) {
      const { issued_seq: ignored, ...priorReceipt } = prior;
      if (encode(priorReceipt) === encode(receipt)) return { ok: true, idempotent: true };
      return { ok: false, reason: 'E_REQUEST_CONFLICT' };
    }
    const stored = { ...receipt, issued_seq: events.length };
    await writeCreateNew(join(receiptsPath, `${receipt.receipt_id}.json`), stored);
    receipts.set(receipt.receipt_id, stored);
    await emitEvent({ kind: 'attempt_started', at: receipt.issued_at ?? receipt.at ?? run.created_at, node_id: receipt.node_id, attempt_id: receipt.attempt_id, detail: `receipt:${receipt.receipt_id}` });
    await persistState();
    return { ok: true, idempotent: false };
  }

  function assertPauseSemantics(pause) {
    assertFallbackPause(pause);
    if (pause.run_id !== run.run_id || pause.fence.attempt_id !== pause.attempt_id || pause.fence.receipt_id !== pause.receipt_id
      || pause.attention.run_id !== pause.run_id || pause.attention.node_id !== pause.node_id
      || pause.attention.attempt_id !== pause.attempt_id || pause.attention.receipt_id !== pause.receipt_id
      || pause.raised_at !== pause.fence.fenced_at || pause.raised_at !== pause.attention.raised_at) {
      throw new Error('E_FALLBACK_PAUSE_INVALID');
    }
    const parts = [pause.run_id, pause.node_id, pause.attempt_id, pause.receipt_id, pause.reason_code];
    const derive = (protocol) => sha256(`${protocol}\n${parts.join('\n')}`);
    if (pause.pause_id !== derive('fallback-pause/v1')
      || pause.fence.fence_id !== derive('attempt-fence/v1')
      || pause.attention.attention_id !== derive('attention/v1')) {
      throw new Error('E_FALLBACK_PAUSE_INVALID');
    }
  }

  function assertFrozenRetryProfiles(pause, receipt) {
    const snapshots = receipt.fallback_profile_snapshots ?? [];
    let cursor = 0;
    for (const profile of pause.manual_retry_profiles) {
      const canonical = jcs(profile);
      const index = snapshots.findIndex((snapshot, offset) => offset >= cursor && jcs(snapshot) === canonical);
      if (index < 0) throw new Error('E_FALLBACK_PAUSE_INVALID:profile-not-frozen');
      cursor = index + 1;
    }
  }

  function assertResolutionSemantics(resolution, attemptReceipt) {
    assertFallbackPauseResolution(resolution);
    assertAttemptReceipt(attemptReceipt);
    const pause = pauses.get(resolution.pause_id);
    if (!pause || resolution.attention_id !== pause.attention.attention_id
      || attemptReceipt.run_id !== run.run_id || attemptReceipt.node_id !== pause.node_id
      || attemptReceipt.attempt_id !== resolution.attempt_id || attemptReceipt.receipt_id !== resolution.receipt_id
      || attemptReceipt.attempt_id === pause.attempt_id || attemptReceipt.receipt_id === pause.receipt_id) {
      throw new Error('E_FALLBACK_PAUSE_RESOLUTION_INVALID');
    }
    const frozen = pause.manual_retry_profiles.find(item => item.executor_profile_id === resolution.executor_profile_id);
    if (!frozen || jcs(frozen) !== jcs(attemptReceipt.executor_identity)) {
      throw new Error('E_FALLBACK_PAUSE_RESOLUTION_INVALID:profile-not-frozen');
    }
  }

  return {
    get events() { return [...events]; },
    appendEvent(input) {
      return runWrite(async () => {
        if (TERMINAL_RESULT_KINDS.has(input?.kind) || MUTATION_ONLY_KINDS.has(input?.kind)) {
          throw new Error(`E_TERMINAL_STATE_CONFLICT:${input.kind}-via-raw-append`);
        }
        const event = await emitEvent(input);
        await persistState();
        return event;
      });
    },
    registerReceipt(receipt) {
      return runWrite(() => registerReceipt(receipt));
    },
    registerAttemptReceipt(receipt) {
      return runWrite(async () => {
        assertAttemptReceipt(receipt);
        return registerReceipt(receipt);
      });
    },
    appendFallbackPause(pause) {
      return runWrite(async () => {
        assertPauseSemantics(pause);
        const detail = jcs(pause);
        if (Buffer.byteLength(detail, 'utf8') > 4096) throw new Error('E_FALLBACK_PAUSE_INVALID:detail-too-large');
        const prior = pauses.get(pause.pause_id);
        if (prior) return jcs(prior) === detail
          ? { ok: true, idempotent: true }
          : { ok: false, reason: 'E_FALLBACK_PAUSE_CONFLICT' };
        const current = currentReceipt(pause.node_id);
        if (!current || current.receipt_id !== pause.receipt_id || current.attempt_id !== pause.attempt_id) {
          throw new Error('E_FALLBACK_PAUSE_INVALID:attempt-not-current');
        }
        assertFrozenRetryProfiles(pause, current);
        if (terminalOf(pause.node_id)) throw new Error('E_TERMINAL_STATE_CONFLICT:fallback-pause-after-terminal');
        const event = {
          protocol: 'relay.event/v2', run_id: run.run_id, seq: events.length, at: pause.raised_at,
          kind: 'fallback_pause_created', node_id: pause.node_id, attempt_id: pause.attempt_id,
          executor_kind: null, executor_ref: null, observation_status: null, reason: pause.reason_code, detail,
        };
        const { ajv, byId } = eventValidator();
        const verdict = validateOne(ajv, byId, EVENT_SCHEMA_ID, event);
        if (!verdict.ok) throw new Error(`E_SCHEMA_INVALID:${verdict.reason}`);
        const nextState = replayRun({ run, events: [...events, event] });
        const priorEvents = (await readTextOrAbsent(eventsPath)) ?? '';
        await commitStoreMutation([
          { path: join(pausesPath, `${pause.pause_id}.json`), content: encode(pause) },
          { path: eventsPath, content: `${priorEvents}${encode(event)}\n` },
          { path: statePath, content: encode(nextState) },
        ]);
        pauses.set(pause.pause_id, pause);
        fencedAttempts.add(`${pause.attempt_id}\u0000${pause.receipt_id}`);
        events.push(event);
        publishCommitted([event], nextState);
        return { ok: true, idempotent: false };
      });
    },
    appendFallbackPauseResolution({ resolution, attempt_receipt: attemptReceipt } = {}) {
      return runWrite(async () => {
        assertResolutionSemantics(resolution, attemptReceipt);
        const key = `${resolution.pause_id}\u0000${resolution.retry_request_id}`;
        const prior = resolutions.get(key);
        if (prior) return jcs(prior) === jcs({ resolution, attempt_receipt: attemptReceipt })
          ? { ok: true, idempotent: true, ...prior }
          : { ok: false, reason: 'E_FALLBACK_PAUSE_CONFLICT' };
        if ([...resolutions.values()].some(item => item.resolution.pause_id === resolution.pause_id)) {
          return { ok: false, reason: 'E_FALLBACK_PAUSE_CONFLICT' };
        }
        if (receipts.has(attemptReceipt.receipt_id)) throw new Error('E_FALLBACK_PAUSE_RESOLUTION_INVALID:receipt-exists');
        const event = {
          protocol: 'relay.event/v2', run_id: run.run_id, seq: events.length, at: resolution.resolved_at,
          kind: 'fallback_pause_resolved', node_id: attemptReceipt.node_id, attempt_id: attemptReceipt.attempt_id,
          executor_kind: null, executor_ref: null, observation_status: null, reason: null, detail: jcs(resolution),
        };
        const attemptEvent = {
          protocol: 'relay.event/v2', run_id: run.run_id, seq: events.length + 1, at: attemptReceipt.issued_at,
          kind: 'attempt_started', node_id: attemptReceipt.node_id, attempt_id: attemptReceipt.attempt_id,
          executor_kind: null, executor_ref: null, observation_status: null, reason: null, detail: `receipt:${attemptReceipt.receipt_id}`,
        };
        const { ajv, byId } = eventValidator();
        for (const candidate of [event, attemptEvent]) {
          const verdict = validateOne(ajv, byId, EVENT_SCHEMA_ID, candidate);
          if (!verdict.ok) throw new Error(`E_SCHEMA_INVALID:${verdict.reason}`);
        }
        const storedReceipt = { ...attemptReceipt, issued_seq: events.length + 1 };
        const record = { resolution, attempt_receipt: attemptReceipt };
        const nextState = replayRun({ run, events: [...events, event, attemptEvent] });
        const priorEvents = (await readTextOrAbsent(eventsPath)) ?? '';
        await commitStoreMutation([
          { path: join(resolutionsPath, `${resolution.pause_id}-${resolution.retry_request_id}.json`), content: encode(record) },
          { path: join(receiptsPath, `${attemptReceipt.receipt_id}.json`), content: encode(storedReceipt) },
          { path: eventsPath, content: `${priorEvents}${encode(event)}\n${encode(attemptEvent)}\n` },
          { path: statePath, content: encode(nextState) },
        ]);
        resolutions.set(key, record);
        receipts.set(attemptReceipt.receipt_id, storedReceipt);
        events.push(event, attemptEvent);
        publishCommitted([event, attemptEvent], nextState);
        return { ok: true, idempotent: false, ...record };
      });
    },
    async openAttentions() {
      return [...pauses.values()]
        .filter(pause => ![...resolutions.values()].some(item => item.resolution.pause_id === pause.pause_id))
        .map(pause => pause.attention);
    },
    async readFallbackPause(pauseId) { return pauses.get(pauseId) ?? null; },
    async readFallbackPauseResolution(pauseId, retryRequestId) {
      return resolutions.get(`${pauseId}\u0000${retryRequestId}`) ?? null;
    },
    appendCheckpoint(checkpoint) {
      return runWrite(async () => {
        if (!checkpoint || typeof checkpoint !== 'object') throw new Error('E_BAD_VALUE:checkpoint-required');
        // 判定次序：身份链 → 幂等 → 终态守卫。身份先行堵住「冒用 attempt_id
        // 借同 key 同 digest 白拿 idempotent ack」的洞；幂等在终态守卫之前，
        // 让已记录 checkpoint 的原样重投在其 attempt 定终态后仍回 idempotent、
        // 不误报终态冲突。
        const receipt = receipts.get(checkpoint.receipt_id);
        if (!receipt) return { ok: false, reason: 'E_IDENTITY_MISMATCH' };
        if (checkpoint.attempt_id !== receipt.attempt_id) return { ok: false, reason: 'E_IDENTITY_MISMATCH' };
        if (fencedAttempts.has(`${checkpoint.attempt_id}\u0000${checkpoint.receipt_id}`)) return { ok: false, reason: 'E_ATTEMPT_FENCED' };
        const current = currentReceipt(checkpoint.node_id);
        if (current?.receipt_id !== checkpoint.receipt_id) return { ok: false, reason: 'E_IDENTITY_MISMATCH' };
        const key = `${checkpoint.receipt_id}\u0000${checkpoint.checkpoint_id}`;
        const prior = checkpoints.get(key);
        if (prior) return prior.payload_digest === checkpoint.payload_digest
          ? { ok: true, idempotent: true }
          : { ok: false, reason: 'E_CHECKPOINT_CONFLICT' };
        if (results.get(current.receipt_id)) return { ok: false, reason: 'E_TERMINAL_STATE_CONFLICT' };
        checkpoints.set(key, checkpoint);
        const checkpointRoot = join(checkpointsPath, checkpoint.receipt_id);
        await mkdir(checkpointRoot, { recursive: true });
        await writeCreateNew(join(checkpointRoot, `${checkpoint.checkpoint_id}.json`), checkpoint);
        await emitEvent({ kind: 'checkpoint_recorded', at: checkpoint.at, node_id: checkpoint.node_id, attempt_id: checkpoint.attempt_id, detail: `checkpoint:${checkpoint.checkpoint_id}` });
        await persistState();
        return { ok: true, idempotent: false };
      });
    },
    /**
     * DHR_64 receipt-bound Result ingress. The caller supplies only the closed
     * submission object; every Result identity and its structured payload are
     * derived from the durable current Attempt Receipt here.
     */
    submitExecutorResult(submission) {
      return runWrite(async () => {
        if (!submission || typeof submission !== 'object') throw new Error('E_BAD_VALUE:submission-required');
        assertResultSubmission(submission);
        const receipt = receipts.get(submission.receipt_id);
        if (!receipt || receipt.result_submission_mode !== 'receipt-bound/v1') {
          return { ok: false, reason: 'E_IDENTITY_MISMATCH' };
        }
        assertAttemptReceipt(attemptReceiptContract(receipt));
        if (receipt.run_id !== run.run_id) return { ok: false, reason: 'E_IDENTITY_MISMATCH' };
        if (fencedAttempts.has(`${receipt.attempt_id}\u0000${receipt.receipt_id}`)) {
          return { ok: false, reason: 'E_ATTEMPT_FENCED' };
        }
        const current = currentReceipt(receipt.node_id);
        if (current?.receipt_id !== receipt.receipt_id || current.attempt_id !== receipt.attempt_id) {
          return { ok: false, reason: 'E_IDENTITY_MISMATCH' };
        }
        const executorKind = executorKindForReceipt(receipt);
        if (executorKind !== 'herdr-agent') return { ok: false, reason: 'E_IDENTITY_MISMATCH' };
        const structured = { source: 'receipt-bound-submission/v1' };
        const payloadDigest = bridgePayloadDigest({
          receipt, outcome: submission.outcome, reason: submission.reason, executorKind,
        });
        const prior = results.get(receipt.receipt_id);
        if (prior) {
          const committedBridge = prior.protocol === RESULT_SCHEMA_ID
            && prior.structured?.source === 'receipt-bound-submission/v1';
          return committedBridge && prior.payload_digest === payloadDigest
            && prior.outcome === submission.outcome
            && (prior.reason ?? null) === submission.reason
            ? { ok: true, idempotent: true, result: prior }
            : { ok: false, reason: 'E_TERMINAL_STATE_CONFLICT' };
        }
        if (terminalOf(receipt.node_id)) return { ok: false, reason: 'E_TERMINAL_STATE_CONFLICT' };

        const finishedAt = new Date().toISOString();
        const result = {
          protocol: RESULT_SCHEMA_ID,
          run_id: receipt.run_id,
          node_id: receipt.node_id,
          attempt_id: receipt.attempt_id,
          receipt_id: receipt.receipt_id,
          executor_kind: executorKind,
          outcome: submission.outcome,
          reason: submission.reason,
          finished_at: finishedAt,
          structured,
          log_locator: null,
          payload_digest: payloadDigest,
          quarantined: false,
        };
        assertResult(result);
        const kind = submission.outcome === 'succeeded' ? 'attempt_succeeded' : 'attempt_failed';
        const event = {
          protocol: 'relay.event/v2', run_id: run.run_id, seq: events.length,
          at: finishedAt, kind, node_id: receipt.node_id, attempt_id: receipt.attempt_id,
          executor_kind: null, executor_ref: null, observation_status: null,
          reason: submission.reason, detail: `receipt:${receipt.receipt_id}`,
        };
        const { ajv, byId } = eventValidator();
        const eventVerdict = validateOne(ajv, byId, EVENT_SCHEMA_ID, event);
        if (!eventVerdict.ok) throw new Error(`E_SCHEMA_INVALID:${eventVerdict.reason}`);
        const nextState = replayRun({ run, events: [...events, event] });
        const priorEvents = (await readTextOrAbsent(eventsPath)) ?? '';
        await commitStoreMutation([
          { path: join(resultsPath, `${receipt.receipt_id}.json`), content: encode(result) },
          { path: eventsPath, content: `${priorEvents}${encode(event)}\n` },
          { path: statePath, content: encode(nextState) },
        ]);
        results.set(receipt.receipt_id, result);
        events.push(event);
        publishCommitted([event], nextState);
        return { ok: true, idempotent: false, result };
      });
    },
    appendResult(result) {
      return runWrite(async () => {
        if (!result || typeof result !== 'object') throw new Error('E_BAD_VALUE:result-required');
        if (fencedAttempts.has(`${result.attempt_id}\u0000${result.receipt_id}`)) return { ok: false, reason: 'E_ATTEMPT_FENCED' };
        const current = currentReceipt(result.node_id);
        const identityHolds = current
          && current.receipt_id === result.receipt_id
          && result.attempt_id === current.attempt_id;
        if (!identityHolds) {
          await writeCreateNew(join(quarantinePath, `${randomUUID()}.json`), { ...result, structured: redactStructured(result.structured) });
          await emitEvent({ kind: 'late_result_quarantined', at: result.at, node_id: result.node_id ?? null, attempt_id: result.attempt_id ?? null, detail: `receipt:${result.receipt_id}` });
          await persistState();
          return { ok: false, reason: 'late_result_quarantined' };
        }
        const prior = results.get(result.receipt_id);
        if (prior) return prior.payload_digest === result.payload_digest && prior.outcome === result.outcome
          ? { ok: true, idempotent: true }
          : { ok: false, reason: 'E_TERMINAL_STATE_CONFLICT' };
        if (!['succeeded', 'failed', 'orphaned'].includes(result.outcome)) throw new Error('E_BAD_VALUE:outcome');
        const sanitized = { ...result, structured: redactStructured(result.structured) };
        results.set(result.receipt_id, sanitized);
        const kind = { succeeded: 'attempt_succeeded', failed: 'attempt_failed', orphaned: 'attempt_orphaned' }[sanitized.outcome];
        await writeCreateNew(join(resultsPath, `${sanitized.receipt_id}.json`), sanitized);
        await emitEvent({ kind, at: sanitized.at, node_id: sanitized.node_id, attempt_id: sanitized.attempt_id, reason: sanitized.reason ?? null, detail: `receipt:${sanitized.receipt_id}` });
        await persistState();
        return { ok: true, idempotent: false };
      });
    },
    /**
     * DHR_30 operation Receipt 落账（design/08 §3）：Receipt 与 operation_* 事件在同一次
     * 串行写里落盘，故「Run Store 有这条 operation 事件」与「Receipt 可读回」永远同真同假。
     * ledger 只是索引；恢复时以本函数写下的事实为准。
     */
    appendOperation(receipt) {
      return runWrite(async () => {
        const receiptId = requireId(receipt?.receipt_id, 'receipt-id');
        const kind = OPERATION_EVENT_KIND[receipt?.state];
        if (!kind) throw new Error(`E_BAD_VALUE:operation-state:${receipt?.state}`);
        requireId(receipt?.request_digest, 'request-digest');
        const prior = operations.get(receiptId);
        if (prior) {
          // 同 receipt_id 同内容 = 重投；内容不同 = 冲突，绝不静默覆盖（幂等的全部意义）。
          return encode(prior) === encode(receipt)
            ? { ok: true, idempotent: true }
            : { ok: false, reason: 'E_REQUEST_CONFLICT' };
        }
        await mkdir(operationsPath, { recursive: true });
        await writeCreateNew(join(operationsPath, `${receiptId}.json`), receipt);
        operations.set(receiptId, receipt);
        await emitEvent({
          kind, at: receipt.issued_at, node_id: null, attempt_id: null,
          detail: `operation:${receiptId}:${receipt.request_digest}:${receipt.state}`,
        });
        await persistState();
        return { ok: true, idempotent: false };
      });
    },
    async readOperation(receiptId) { return operations.get(receiptId) ?? null; },
    get operations() { return [...operations.values()]; },

    /**
     * 订阅 barrier。返回 `{ snapshot_seq, next_seq, unsubscribe }`：
     * 调用方应把 `seq < next_seq` 的事件作为快照读走，`seq >= next_seq` 的从推送里取。
     * 用 next_seq 而不是 `> snapshot_seq` 作切分：空事件账时 snapshot_seq 无自然取值，
     * 用 0 冒充会让第 0 条事件被当成「快照里已有」而丢掉。
     */
    subscribe(listener, { rejectOpenAttention = false } = {}) {
      if (typeof listener !== 'function') throw new Error('E_BAD_VALUE:listener-required');
      return enqueue(async () => {
        if (rejectOpenAttention && [...pauses.values()].some(
          pause => ![...resolutions.values()].some(item => item.resolution.pause_id === pause.pause_id),
        )) throw new Error('E_ATTENTION_REQUIRES_READ_MODEL_V2');
        const nextSeq = events.length;
        subscribers.add(listener);
        let released = false;
        return {
          snapshot_seq: Math.max(0, nextSeq - 1),
          next_seq: nextSeq,
          unsubscribe: () => {
            if (released) return;
            released = true;
            subscribers.delete(listener);
          },
        };
      });
    },

    /**
     * cursor 补发（design/08 §5）：只补**严格连续**的 seq。事件账里 seq 从 0 起密集，
     * 所以「客户端声称看过的 seq 我们没有」就是缺口——拒绝，不从头重放也不拼接。
     */
    async readEventsAfter(afterSeq) {
      if (!Number.isInteger(afterSeq) || afterSeq < -1) throw cursorGap(`not-a-cursor:${afterSeq}`);
      const lastSeq = events.length - 1;
      if (afterSeq > lastSeq) throw cursorGap(`ahead-of-log:${afterSeq}>${lastSeq}`);
      return events.filter(event => event.seq > afterSeq);
    },
    async readState() { return JSON.parse(await readFile(statePath, 'utf8')); },
    get runPath() { return runPath; },
  };
}

export async function createStore({ root, run, writeGuard = null }) {
  validateRunSemantics(run);
  await mkdir(root, { recursive: true });
  const runPath = join(root, 'run.json');
  await writeCreateNew(runPath, run);
  for (const dir of ['receipts', 'checkpoints', 'results', 'quarantine', 'operations', 'pauses', 'pause-resolutions', 'mutations/staging']) {
    await mkdir(join(root, dir), { recursive: true });
  }
  // 建库即写初始快照：readState 在任何变更之前都可读，不留「首写前 ENOENT」的窗口。
  await writeAtomic(join(root, 'state.json'), replayRun({ run, events: [] }));
  return createHandle({
    root,
    run,
    events: [],
    receipts: new Map(),
    checkpoints: new Map(),
    results: new Map(),
    operations: new Map(),
    pauses: new Map(),
    resolutions: new Map(),
    enqueue: createWriteQueue(),
    writeGuard,
  });
}

async function loadEvents(root, run) {
  let text;
  try {
    text = await readFile(join(root, 'events.jsonl'), 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  if (text === '') return [];
  if (!text.endsWith('\n')) throw new Error('E_EVENT_LOG_CORRUPT:torn-tail');
  const { ajv, byId } = eventValidator();
  const events = [];
  const lines = text.slice(0, -1).split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    let event;
    try {
      event = JSON.parse(lines[index]);
    } catch {
      throw new Error(`E_EVENT_LOG_CORRUPT:line-${index}`);
    }
    if (event?.protocol !== 'relay.event/v2' || event.run_id !== run.run_id) throw new Error(`E_EVENT_LOG_CORRUPT:line-${index}`);
    if (event.seq !== index) throw new Error(`E_EVENT_LOG_CORRUPT:seq-${index}`);
    let verdict = validateOne(ajv, byId, EVENT_SCHEMA_ID, event);
    const legacyShape = event?.protocol === EVENT_SCHEMA_ID
      && event.kind === 'host_observation_changed'
      && event.observation_status === 'alive'
      && !Object.prototype.hasOwnProperty.call(event, 'host_ref');
    if (!verdict.ok && legacyShape) {
      verdict = validateOne(ajv, byId, EVENT_SCHEMA_ID, { ...event, host_ref: LEGACY_HOST_REF_SENTINEL });
    }
    if (!verdict.ok) throw new Error(`E_EVENT_LOG_CORRUPT:schema-line-${index}`);
    events.push(event);
  }
  return events;
}

/**
 * 只读的事件账完整性校验（DHR_30 · discovery 的完整性判据）。
 *
 * 它就是 `openStore` 用的**同一段** `loadEvents`：逐行可解析、协议与 run 归属正确、
 * seq 从 0 严格连续、逐条过冻结 `relay.event/v2`；任何一条不成立即抛
 * `E_EVENT_LOG_CORRUPT:*`。discovery 不能直接调 `openStore` 判完整性——后者会
 * **重写 state.json**，而发现是只读的（design/08 §5 第 1 步与第 4 步都写死了「不迁移、不改一个字节」）。
 * 单独开这个出口，是为了让「discovery 认定完整」与「openStore 打得开」永远同真同假：
 * 两条判据各写一份，迟早会分叉成「列表里能看见、一打开就 fail-closed」。
 */
export async function readEventLog({ root, run }) {
  return loadEvents(root, run);
}

async function readArtifactJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    // 工件损坏同样 fail-closed，但包装成仓内错误码而不是裸 SyntaxError/ENOTDIR。
    throw new Error(`E_STORE_CORRUPT:artifact-${error?.code ?? 'unparsable'}-${basename(path)}`);
  }
}

async function loadArtifacts(dir, keyOf) {
  const map = new Map();
  let names;
  try {
    names = await readdir(dir);
  } catch (error) {
    if (error?.code === 'ENOENT') return map;
    throw error;
  }
  for (const name of names.filter((file) => file.endsWith('.json')).sort()) {
    const artifact = await readArtifactJson(join(dir, name));
    map.set(keyOf(artifact), artifact);
  }
  return map;
}

async function loadCheckpoints(dir) {
  const map = new Map();
  let receiptDirs;
  try {
    receiptDirs = await readdir(dir);
  } catch (error) {
    if (error?.code === 'ENOENT') return map;
    throw error;
  }
  for (const receiptDir of receiptDirs.sort()) {
    const files = await readdir(join(dir, receiptDir));
    for (const name of files.filter((file) => file.endsWith('.json')).sort()) {
      const checkpoint = await readArtifactJson(join(dir, receiptDir, name));
      map.set(`${checkpoint.receipt_id}\u0000${checkpoint.checkpoint_id}`, checkpoint);
    }
  }
  return map;
}

/**
 * 从磁盘重建 Store：run.json 为身份锚点，events.jsonl 逐行解析并做完整性校验
 * （可解析、协议与 run 归属、seq 从 0 连续、逐条过冻结契约），receipt/checkpoint/result
 * 工件全部回装，幂等与冲突判定因此跨重启成立。事件账是真值：state.json 每次打开都
 * 由全量事件重算并原子重写（自愈「append 与 persist 之间被强杀」的半更新现场）。
 * 任何损坏一律 fail-closed（E_EVENT_LOG_CORRUPT / E_STORE_CORRUPT），不做部分恢复。
 */
export async function openStore({ root, writeGuard = null }) {
  let run;
  try {
    run = JSON.parse(await readFile(join(root, 'run.json'), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') throw new Error('E_RUN_NOT_FOUND');
    throw new Error('E_STORE_CORRUPT:run-json-unreadable');
  }
  await recoverMutations(root);
  validateRunSemantics(run);
  const events = await loadEvents(root, run);
  const receipts = await loadArtifacts(join(root, 'receipts'), (receipt) => requireId(receipt?.receipt_id, 'receipt-id'));
  for (const receipt of receipts.values()) {
    if (receipt.protocol === 'relay.attempt-receipt/v1') assertAttemptReceipt((({ issued_seq, ...value }) => value)(receipt));
  }
  const results = await loadArtifacts(join(root, 'results'), (result) => requireId(result?.receipt_id, 'receipt-id'));
  assertResultLedger(run, events, receipts, results);
  const checkpoints = await loadCheckpoints(join(root, 'checkpoints'));
  const operations = await loadArtifacts(join(root, 'operations'), (operation) => requireId(operation?.receipt_id, 'receipt-id'));
  const pauses = await loadArtifacts(join(root, 'pauses'), (pause) => {
    assertFallbackPause(pause);
    return requireId(pause?.pause_id, 'pause-id');
  });
  const resolutions = await loadArtifacts(join(root, 'pause-resolutions'), (record) => {
    assertFallbackPauseResolution(record?.resolution);
    assertAttemptReceipt(record?.attempt_receipt);
    return `${record.resolution.pause_id}\u0000${record.resolution.retry_request_id}`;
  });
  assertPauseLedger(events, pauses);
  assertResolutionLedger(events, resolutions, pauses, receipts);
  await writeAtomic(join(root, 'state.json'), replayRun({ run, events }));
  return createHandle({
    root,
    run,
    events,
    receipts,
    checkpoints,
    results,
    operations,
    pauses,
    resolutions,
    enqueue: createWriteQueue(),
    writeGuard,
  });
}

/**
 * Read-only Attention projection for RPC discovery paths. It never rewrites
 * state.json and never completes a prepared mutation without the Run writer.
 */
export async function readOpenAttentions({ root }) {
  const mutationRoot = join(root, 'mutations');
  let mutationNames = [];
  try { mutationNames = await readdir(mutationRoot); } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  for (const name of mutationNames.filter(item => item.endsWith('.prepared.json'))) {
    let journal;
    try { journal = JSON.parse(await readFile(join(mutationRoot, name), 'utf8')); } catch {
      throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:journal-unreadable');
    }
    if (!MUTATION_ID_PATTERN.test(journal?.transaction_id ?? '')
      || name !== `${journal.transaction_id}.prepared.json`) {
      throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:transaction-id-mismatch');
    }
    if (!await readCommittedMarker(mutationRoot, journal.transaction_id)) {
      throw new Error('E_STORE_MUTATION_RECOVERY_FAILED:recovery-required');
    }
  }
  let run;
  try { run = JSON.parse(await readFile(join(root, 'run.json'), 'utf8')); } catch {
    throw new Error('E_STORE_CORRUPT:run-json-unreadable');
  }
  validateRunSemantics(run);
  const events = await loadEvents(root, run);
  const receipts = await loadArtifacts(join(root, 'receipts'), receipt => requireId(receipt?.receipt_id, 'receipt-id'));
  const pauses = await loadArtifacts(join(root, 'pauses'), (pause) => {
    assertFallbackPause(pause);
    return requireId(pause?.pause_id, 'pause-id');
  });
  const resolutions = await loadArtifacts(join(root, 'pause-resolutions'), (record) => {
    assertFallbackPauseResolution(record?.resolution);
    assertAttemptReceipt(record?.attempt_receipt);
    return `${record.resolution.pause_id}\u0000${record.resolution.retry_request_id}`;
  });
  assertPauseLedger(events, pauses);
  assertResolutionLedger(events, resolutions, pauses, receipts);
  return [...pauses.values()]
    .filter(pause => ![...resolutions.values()].some(item => item.resolution.pause_id === pause.pause_id))
    .map(pause => pause.attention);
}
