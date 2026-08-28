// ledger.mjs — DHR_30 的项目级 operation ledger（design/08 §3 的唯一 service ledger）。
//
// 它回答三件事，且只回答这三件：
//   ① 这次 start/control 我是不是已经做过了（幂等键 + 摘要）；
//   ② 崩在半路时下一届 service 该从哪儿接着做（phase 恢复表）；
//   ③ 这个仓下一个 run_id 该是几号（next_seq 保留号）。
//
// 它**不是** Run 的真相：Receipt 与 operation_* 事件的真相在 Run Store（store.appendOperation）。
// ledger 是索引与保留号；两者不一致时以 Run Store 为准并修复 ledger（design/08 §3 末段）。
//
// 依赖面：node 标准库 + 本仓 canonical/runid。零契约编译、零 RPC、零 Store 依赖。

import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { digestExcluding, jcs } from '../tools/canonical.mjs';
import { RUN_ID_PATTERN } from './runid.mjs';

/** design/08 §3 的 phase 全集，顺序即正常推进顺序（最后一个是终止态）。 */
export const LEDGER_PHASES = ['accepted', 'run_id_reserved', 'store_created', 'actor_ready', 'receipt_committed', 'failed'];

export function ledgerPath(repoRoot) {
  return join(resolve(repoRoot), '.dh-relay', 'runtime-operations.json');
}

/**
 * 幂等键：JCS 序列化的 `{client_id, request_id, method}`（design/08 §3）。
 * 用 JCS 而不是字符串拼接是为了让键在任何实现里都算得出同一个值，
 * 也免掉分隔符注入（`a|b` 与 `a` + `|b` 撞车）。
 */
export function operationKey({ client_id: clientId, request_id: requestId, method }) {
  if (!clientId || !requestId || !method) throw new Error('E_BAD_VALUE:operation-key-incomplete');
  return jcs({ client_id: clientId, request_id: requestId, method });
}

/**
 * request_digest（design/08 §3）：克隆完整 relay.rpc/v1 request envelope，
 * 从其 handshake 副本移除 request_id，再对该对象 `digestExcluding(…, ['id'])`。
 *
 * ⚠️ 必须克隆。就地删 `handshake.request_id` 会让调用方手里那一帧变残——
 * 而那一帧随后还要拿去执行、还要用 request_id 建 Receipt。
 */
export function requestDigest(frame) {
  const copy = structuredClone(frame);
  if (copy && typeof copy.handshake === 'object' && copy.handshake !== null) delete copy.handshake.request_id;
  return digestExcluding(copy, ['id']);
}

function corrupt(detail) {
  const error = new Error(`E_STORE_CORRUPT:runtime-operations:${detail}`);
  error.reason = 'E_STORE_CORRUPT';
  return error;
}

export async function readLedger(repoRoot) {
  let text;
  try {
    text = await readFile(ledgerPath(repoRoot), 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return { version: 1, operations: {}, next_seq: 0 };
    throw corrupt(error?.code ?? 'unreadable');
  }
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    // 损坏账本绝不能被当成空账本：那等于把已保留的号全部释放，同一 run_id 会被发第二次。
    throw corrupt('unparsable');
  }
  if (doc?.version !== 1 || !doc.operations || typeof doc.operations !== 'object' || Array.isArray(doc.operations)) throw corrupt('shape');
  if (!Number.isInteger(doc.next_seq) || doc.next_seq < 0) throw corrupt('next-seq');
  return doc;
}

/**
 * 账本落盘：temp write + fsync → atomic rename → directory fsync（design/08 §3）。
 * 少了 fsync，「保留号已写下」在断电后可能是假的——重启会把同一个号再发一次。
 */
export async function writeLedger(repoRoot, ledger) {
  const path = ledgerPath(repoRoot);
  const dir = dirname(path);
  await mkdir(dir, { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  let handle;
  try {
    handle = await open(temporary, 'wx');
    await handle.writeFile(`${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
    await handle.sync();
  } finally {
    await handle?.close();
  }
  try {
    await rename(temporary, path);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
  // 目录 fsync 让 rename 本身也持久化。Windows 不支持对目录 open('r')/fsync，
  // 那里 rename 由文件系统保证原子性——拿不到就跳过，不把可选加固变成硬失败。
  let dirHandle;
  try {
    dirHandle = await open(dir, 'r');
    await dirHandle.sync();
  } catch { /* 平台不支持目录 fsync：rename 的原子性仍成立 */ } finally {
    await dirHandle?.close().catch(() => {});
  }
}

/**
 * next_seq 的 seed（design/08 §3）：所有完整 v2 Run 根与 runs.json 本仓最大号的最大值。
 * 认不出的目录名一律忽略——发号唯一性全靠这个 seed，从乱猜的名字里读出个数字来
 * 反而会把号抬到别处或压到重号。
 */
export function seedNextSeq({ runIds = [], indexMaxSeq = 0 } = {}) {
  let max = Number.isInteger(indexMaxSeq) && indexMaxSeq > 0 ? indexMaxSeq : 0;
  for (const runId of runIds) {
    if (!RUN_ID_PATTERN.test(runId)) continue;
    const seq = Number.parseInt(runId.slice(1, runId.indexOf('-')), 10);
    if (Number.isInteger(seq) && seq > max) max = seq;
  }
  return max;
}

/** design/08 §3 的恢复表，逐行落成可断言的结构。 */
const RECOVERY = {
  accepted: { reserve: true, reuseRunId: false, commitReceipt: false, replayReceipt: false, reexecute: true },
  run_id_reserved: { reserve: false, reuseRunId: true, commitReceipt: false, replayReceipt: false, reexecute: true },
  store_created: { reserve: false, reuseRunId: true, commitReceipt: false, replayReceipt: false, reexecute: true },
  actor_ready: { reserve: false, reuseRunId: true, commitReceipt: true, replayReceipt: false, reexecute: true },
  receipt_committed: { reserve: false, reuseRunId: true, commitReceipt: false, replayReceipt: true, reexecute: false },
  failed: { reserve: false, reuseRunId: false, commitReceipt: false, replayReceipt: true, reexecute: false },
};

export function recoveryFor(phase) {
  const recovery = RECOVERY[phase];
  if (!recovery) throw corrupt(`unknown-phase:${phase}`);
  return recovery;
}
