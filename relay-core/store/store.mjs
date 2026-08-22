import { appendFile, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { basename, join } from 'node:path';

import { loadAjv, validateOne } from '../tools/validate.mjs';
import { applyEvents, replayRun } from './state.mjs';

const encode = (value) => JSON.stringify(value);

const EVENT_SCHEMA_ID = 'relay.event/v2';

// 这些 kind 直接决定回放出的节点状态。节点的当前 attempt 定了终态之后再写它们，
// 就是对已定终态的污染——一律拒绝；隔离留痕 late_result_quarantined 不在此列，
// 它不推进任何状态，终态后仍必须可写（可追溯）。
const LIFECYCLE_KINDS = new Set(['node_started', 'attempt_started', 'checkpoint_recorded', 'human_input_requested']);

let validatorCache;
function eventValidator() {
  validatorCache ??= loadAjv();
  return validatorCache;
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

export { replayRun };

function createHandle({ root, run, events, receipts, checkpoints, results, enqueue }) {
  const runPath = join(root, 'run.json');
  const eventsPath = join(root, 'events.jsonl');
  const statePath = join(root, 'state.json');
  const receiptsPath = join(root, 'receipts');
  const checkpointsPath = join(root, 'checkpoints');
  const resultsPath = join(root, 'results');
  const quarantinePath = join(root, 'quarantine');

  function ensureKnownNode(nodeId) {
    if (!run.nodes.some((node) => node.node_id === nodeId)) throw new Error('E_BAD_VALUE:unknown-node');
  }

  function currentReceipt(nodeId) {
    return [...receipts.values()]
      .filter((receipt) => receipt.node_id === nodeId)
      .sort((left, right) => left.issued_seq - right.issued_seq)
      .at(-1);
  }

  // 节点「当前 attempt」的终态。终态按 receipt（= attempt）记账：旧 attempt 的终态
  // 锁不住新 attempt（重试路径），只锁它自己。
  function terminalOf(nodeId) {
    const current = currentReceipt(nodeId);
    return current ? results.get(current.receipt_id) : undefined;
  }

  async function persistState() {
    await writeAtomic(statePath, replayRun({ run, events }));
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
    return event;
  }

  return {
    get events() { return [...events]; },
    appendEvent(input) {
      return enqueue(async () => {
        const event = await emitEvent(input);
        await persistState();
        return event;
      });
    },
    registerReceipt(receipt) {
      return enqueue(async () => {
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
        await emitEvent({ kind: 'attempt_started', at: receipt.at ?? run.created_at, node_id: receipt.node_id, attempt_id: receipt.attempt_id, detail: `receipt:${receipt.receipt_id}` });
        await persistState();
        return { ok: true, idempotent: false };
      });
    },
    appendCheckpoint(checkpoint) {
      return enqueue(async () => {
        if (!checkpoint || typeof checkpoint !== 'object') throw new Error('E_BAD_VALUE:checkpoint-required');
        // 判定次序：身份链 → 幂等 → 终态守卫。身份先行堵住「冒用 attempt_id
        // 借同 key 同 digest 白拿 idempotent ack」的洞；幂等在终态守卫之前，
        // 让已记录 checkpoint 的原样重投在其 attempt 定终态后仍回 idempotent、
        // 不误报终态冲突。
        const receipt = receipts.get(checkpoint.receipt_id);
        if (!receipt) return { ok: false, reason: 'E_IDENTITY_MISMATCH' };
        if (checkpoint.attempt_id !== receipt.attempt_id) return { ok: false, reason: 'E_IDENTITY_MISMATCH' };
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
    appendResult(result) {
      return enqueue(async () => {
        if (!result || typeof result !== 'object') throw new Error('E_BAD_VALUE:result-required');
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
    async readState() { return JSON.parse(await readFile(statePath, 'utf8')); },
    get runPath() { return runPath; },
  };
}

export async function createStore({ root, run }) {
  validateRunSemantics(run);
  await mkdir(root, { recursive: true });
  const runPath = join(root, 'run.json');
  await writeCreateNew(runPath, run);
  for (const dir of ['receipts', 'checkpoints', 'results', 'quarantine']) {
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
    enqueue: createWriteQueue(),
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
    if (!validateOne(ajv, byId, EVENT_SCHEMA_ID, event).ok) throw new Error(`E_EVENT_LOG_CORRUPT:schema-line-${index}`);
    events.push(event);
  }
  return events;
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
export async function openStore({ root }) {
  let run;
  try {
    run = JSON.parse(await readFile(join(root, 'run.json'), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') throw new Error('E_RUN_NOT_FOUND');
    throw new Error('E_STORE_CORRUPT:run-json-unreadable');
  }
  validateRunSemantics(run);
  const events = await loadEvents(root, run);
  const receipts = await loadArtifacts(join(root, 'receipts'), (receipt) => requireId(receipt?.receipt_id, 'receipt-id'));
  const results = await loadArtifacts(join(root, 'results'), (result) => requireId(result?.receipt_id, 'receipt-id'));
  const checkpoints = await loadCheckpoints(join(root, 'checkpoints'));
  await writeAtomic(join(root, 'state.json'), replayRun({ run, events }));
  return createHandle({
    root,
    run,
    events,
    receipts,
    checkpoints,
    results,
    enqueue: createWriteQueue(),
  });
}
