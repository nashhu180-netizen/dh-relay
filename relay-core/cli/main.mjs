#!/usr/bin/env node
// main.mjs — Relay CLI 参考客户端（DHR_30 步骤 4）。
//
// 七条命令 list / status / inspect / events / start / stop / resume 全部走唯一 RPC client
// （cli/client.mjs：launcher 发现 → 只读凭据 → contracts 首请求回证）。
// 渲染纪律（design/08 §1）：--json = Read Model 原样序列化；text = 同一对象的人读渲染，
// 本文件不自己算任何字段。start/stop/resume 先落 pending record 再发送（design/08 §2），
// CLI 启动时先按原幂等键收敛残条，再执行新命令。

import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { buildRequestEnvelope, clientError, connectCli } from './client.mjs';
import { addPendingRecord, readPendingRecords, removePendingRecord } from './pending.mjs';
import { requestDigest } from '../runtime/ledger.mjs';
import {
  renderDetailView, renderEvent, renderEventSnapshot, renderFocus, renderReceipt, renderRpcError,
  renderRunList, renderRunStateChanged, renderStatusView, renderTransportFailure, RESULT_UNKNOWN_HINT,
} from './render.mjs';

const COMMANDS = new Set(['list', 'status', 'inspect', 'events', 'focus', 'start', 'stop', 'resume']);
/** 每个命令的 positional 形状（F-025）：多余或缺失一律 usage 退出码 1，绝不静默忽略。 */
const POSITIONAL_COUNTS = { list: 0, status: 1, inspect: 1, events: 1, focus: 2, start: 0, stop: 1, resume: 1 };
/** 非 follow 的 events 等补发收齐的 fail-out 上限：只作超时报错，绝不作完成判据（F-021）。 */
const EVENTS_BACKFILL_TIMEOUT_MS = 30_000;
const VALUE_FLAGS = new Set(['root', 'run', 'after']);
const BOOL_FLAGS = new Set(['json', 'follow', 'include-legacy']);

export function usage() {
  return 'usage: relay list [--include-legacy] | status <run_id> | inspect <run_id>'
    + ' | events <run_id> [--follow] [--after <seq>] | focus <run_id> <node_id> | start --run <run.json>'
    + ' | stop <run_id> | resume <run_id>  [--root <repo>] [--json]';
}

class UsageError extends Error {}

function parseArgv(argv) {
  const [command, ...rest] = argv;
  const flags = {};
  const positional = [];
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }
    const name = token.slice(2);
    if (VALUE_FLAGS.has(name)) {
      const value = rest[index + 1];
      if (value === undefined) throw new UsageError(`--${name} 需要一个值`);
      flags[name] = value;
      index += 1;
    } else if (BOOL_FLAGS.has(name)) {
      flags[name] = true;
    } else {
      throw new UsageError(`未知参数 ${token}`);
    }
  }
  return { command, flags, positional };
}

/** 顺序化输出：进程退出前等写入落定，管道/重定向下不截断。 */
function makeEmitter(stream) {
  let chain = Promise.resolve();
  return {
    write(text) { chain = chain.then(() => new Promise(done => stream.write(text, done))); },
    drain() { return chain; },
  };
}

function emitError(err, error, json) {
  err.write(json
    ? `${JSON.stringify({ error: { reason: error.reason, receipt: error.receipt, detail: error.detail } }, null, 2)}\n`
    : `${renderRpcError(error)}\n`);
}

/** 公共收尾：稳定拒绝 → 措辞二分渲染 + 退出码 1；成功 → 渲染 Read Model。 */
function report(outcome, { json, out, err, renderText, pickResult }) {
  if (!outcome.ok) {
    emitError(err, outcome.error, json);
    return 1;
  }
  const model = pickResult(outcome.result);
  out.write(json ? `${JSON.stringify(model, null, 2)}\n` : `${renderText(model)}\n`);
  return 0;
}

/**
 * CLI 启动时的残条收敛（design/08 §2）：用原幂等键重放，拿到任何确定响应即收回。
 * 传输层失败会向上抛——结果未知，残条必须留着给下一届 CLI。
 * F-018：重放帧的 handshake 用 **record 里存的** client_id（配合 pending.mjs 持久完整
 * 请求），复合幂等键才与原请求逐字一致；record 缺 client_id 无法复原原键，重放等于
 * 换键二次执行——fail-closed 报损坏，残条留着。
 */
async function convergePending({ conn, repoRoot, err, json }) {
  for (const record of await readPendingRecords(repoRoot)) {
    if (record?.method !== 'start' && record?.method !== 'control') continue;
    if (typeof record.client_id !== 'string' || record.client_id.length === 0) {
      throw clientError('E_STORE_CORRUPT', `pending-record-missing-client_id:${record?.request_id ?? 'unknown'}`);
    }
    if (!json) err.write(`relay: pending: 以原幂等键收敛 ${record.method} (request_id=${record.request_id})\n`);
    const outcome = await conn.call(record.method, record.params,
      { requestId: record.request_id, clientId: record.client_id });
    await removePendingRecord(repoRoot, record.request_id);
    if (!outcome.ok) emitError(err, outcome.error, json);
  }
}

async function loadRunDocument(flags) {
  if (!flags.run) throw new UsageError('start 需要 --run <run.json>');
  const text = await readFile(resolve(flags.run), 'utf8');
  const run = JSON.parse(text); // 解析失败 = 本地输入错误，报错退出，不发请求
  if (!run || typeof run !== 'object' || Array.isArray(run)) throw new UsageError('--run 文件必须是 JSON 对象');
  return run;
}

async function runList({ repoRoot, flags, json, out, err }) {
  const conn = await connectCli({ repoRoot });
  try {
    await convergePending({ conn, repoRoot, err, json });
    const outcome = await conn.call('listRuns', { include_legacy: flags['include-legacy'] === true });
    return report(outcome, { json, out, err, renderText: renderRunList, pickResult: result => result });
  } finally {
    conn.close();
  }
}

async function runInspect({ repoRoot, flags, positional, json, out, err, view }) {
  const runId = positional[0];
  const conn = await connectCli({ repoRoot });
  try {
    await convergePending({ conn, repoRoot, err, json });
    const outcome = await conn.call('inspectRun', { run_id: runId, view });
    return report(outcome, {
      json, out, err,
      renderText: view === 'status' ? renderStatusView : renderDetailView,
      pickResult: result => result,
    });
  } finally {
    conn.close();
  }
}

async function runMutating({ repoRoot, flags, positional, command, json, out, err }) {
  const method = command === 'start' ? 'start' : 'control';
  const params = command === 'start'
    ? { run: await loadRunDocument(flags) }
    : { run_id: positional[0], action: command };
  const conn = await connectCli({ repoRoot });
  try {
    await convergePending({ conn, repoRoot, err, json });
    // F-019：残条持久**完整请求**——client_id / request_id / method / params /
    // request_digest / at。digest 与实际发送帧同源（buildRequestEnvelope +
    // runtime/ledger 的 requestDigest），崩溃后下一届才能逐字重放原幂等键。
    const requestId = `cli-${randomUUID()}`;
    const record = {
      client_id: conn.clientId,
      request_id: requestId,
      method,
      params,
      request_digest: requestDigest(buildRequestEnvelope({ method, params, requestId, clientId: conn.clientId })),
      at: new Date().toISOString(),
    };
    await addPendingRecord(repoRoot, record);
    const outcome = await conn.call(method, params, { requestId });
    await removePendingRecord(repoRoot, requestId);
    return report(outcome, { json, out, err, renderText: renderReceipt, pickResult: result => result.receipt });
  } finally {
    conn.close();
  }
}

async function runEvents({ repoRoot, flags, positional, json, out, err }) {
  const runId = positional[0];
  let cursor = null;
  if (flags.after !== undefined) {
    cursor = Number(flags.after);
    if (!Number.isInteger(cursor) || cursor < 0) throw new UsageError('--after 需要非负整数');
  }
  const follow = flags.follow === true;

  let stopRequested = false;
  let notifyStop = () => {};
  const stopPromise = new Promise(done => { notifyStop = done; });
  const requestStop = () => {
    if (stopRequested) return;
    stopRequested = true;
    notifyStop();
  };
  const onSignal = () => requestStop();
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);
  // 管道/重定向下的「调用方收尾」信号：stdin 关闭 = 跟随结束（TTY 上仍是 Ctrl-C）。
  // 只在 --follow 注册：非跟随的 events 按 next_seq 精确计数收尾，headless 下 stdin 的
  // 立即 EOF 不得把它砍成「快照还没落稳就退出」。
  if (follow && !process.stdin.isTTY) {
    process.stdin.resume();
    process.stdin.once('end', onSignal);
  }

  const sleep = ms => new Promise(done => setTimeout(done, ms));
  try {
    // 订阅态在重连之间延续：printedSeq = 已打印的最高事件 seq（去重基线，也是断线重连的
    // after_seq 游标）；snapshotSeq = 最近一次快照的 snapshot_seq（状态游标）。二者取 max
    // 才是「用户已拿到的信息」高水位——快照覆盖过的事件不会再以补发形式到达，
    // 补发事件（≤ 快照 seq）也绝不能被快照 seq 挡掉。printedSeqs 是已打印 seq 的全录，
    // 供非 follow 的精确计数使用（F-021）。
    const state = { printedSeq: cursor ?? null, snapshotSeq: null, printedSeqs: [], backfill: null, snapshotOnly: false };

    const emitEvent = params => {
      const seq = params?.seq;
      if (typeof seq !== 'number') return;
      if (state.printedSeq !== null && seq <= state.printedSeq) return; // 重复 seq 由客户端丢弃
      state.printedSeq = seq;
      state.printedSeqs.push(seq);
      out.write(json ? `${JSON.stringify(params)}\n` : `${renderEvent(params)}\n`);
      // 非 follow 的完成判据（F-021）：补发区间 (after_seq, next_seq) 逐条计数，
      // 收齐即完成——不用任何固定静默窗当判据。
      const backfill = state.backfill;
      if (backfill && seq > backfill.after && seq < backfill.nextSeq) {
        const collected = state.printedSeqs.filter(s => s > backfill.after && s < backfill.nextSeq).length;
        if (collected >= backfill.target) {
          state.backfill = null;
          backfill.resolve();
        }
      }
    };
    const emitState = params => {
      out.write(json ? `${JSON.stringify(params)}\n` : `${renderRunStateChanged(params)}\n`);
    };
    let conn = null;
    let converged = false;
    while (!stopRequested) {
      try {
        conn = await connectCli({ repoRoot });
        if (!converged) {
          await convergePending({ conn, repoRoot, err, json }); // CLI 启动时收敛一次，不随重连重复
          converged = true;
        }
        conn.setNotificationHandler((frame) => {
          if (!frame || typeof frame !== 'object') return;
          // 状态只来自 runStateChanged 通知与 subscribe 快照，绝不从事件流推导（B-4）。
          if (frame.method === 'event' && frame.params) emitEvent(frame.params);
          else if (frame.method === 'runStateChanged' && frame.params) emitState(frame.params);
        });
        // 服务端只在显式给 after_seq 时才补发；非 follow 的默认起点 = 用户传入或 0
        // （F-021），否则快照之外的存量事件会被静默丢掉。--follow 不带 --after 时保持
        // 「快照 + 实时」语义。E_CURSOR_GAP 后退化为纯快照（游标已证明不可用）。
        const params = { run_id: runId };
        const requestBackfill = follow ? cursor !== null : !state.snapshotOnly;
        if (requestBackfill) params.after_seq = cursor ?? 0;
        const outcome = await conn.call('subscribe', params);
        if (!outcome.ok) {
          // cursor 缺口：整体重新快照，绝不拼接补缝（design/08 §5）。
          if (outcome.error.reason === 'E_CURSOR_GAP') {
            cursor = null;
            state.printedSeq = null;
            state.printedSeqs = [];
            state.backfill = null;
            if (!follow) state.snapshotOnly = true;
            continue;
          }
          emitError(err, outcome.error, json);
          return 1;
        }
        state.snapshotSeq = outcome.result.snapshot_seq;
        out.write(json ? `${JSON.stringify(outcome.result)}\n` : `${renderEventSnapshot(outcome.result)}\n`);
        if (!follow) {
          if (!requestBackfill) return 0; // 退化快照：无补发可等，快照即完整
          const after = params.after_seq;
          const nextSeq = outcome.result.next_seq;
          if (!Number.isInteger(nextSeq) || nextSeq < 0) {
            throw new Error(`events:subscribe 快照 next_seq 非法：${JSON.stringify(outcome.result.next_seq)}`);
          }
          // 目标条数 = (after_seq, next_seq) 区间长度；起点已达区间尾（next_seq-1 <=
          // after_seq）则目标为 0，无需等待直接完成。
          const target = Math.max(0, nextSeq - 1 - after);
          const collected = state.printedSeqs.filter(seq => seq > after && seq < nextSeq).length;
          if (collected >= target) return 0;
          // 30s 只是 fail-out 上限：超时报错退出码非 0，绝不当作「收齐了」。
          await Promise.race([
            new Promise(resolve => { state.backfill = { after, nextSeq, target, resolve }; }),
            new Promise((_, reject) => setTimeout(() => {
              reject(new Error(`events:${EVENTS_BACKFILL_TIMEOUT_MS}ms 内未收齐补发事件`
                + `（目标 ${target} 条，实收 ${collected} 条，after_seq=${after}）`));
            }, EVENTS_BACKFILL_TIMEOUT_MS)),
          ]);
          return 0;
        }
        await Promise.race([conn.closed, stopPromise]);
      } catch (error) {
        if (!follow) throw error; // 非跟随：传输失败即结果未知，向上报
        err.write(`relay: 连接断开，重连中（${error?.message ?? error}）\n`);
      } finally {
        conn?.close();
        conn = null;
      }
      if (stopRequested) break;
      // 重连游标 = 已送达高水位；没有任何已送达信息时才从头取全量快照。
      const highWater = Math.max(state.printedSeq ?? -1, state.snapshotSeq ?? -1);
      cursor = highWater >= 0 ? highWater : null;
      await sleep(300);
    }
    return 0;
  } finally {
    process.removeListener('SIGINT', onSignal);
    process.removeListener('SIGTERM', onSignal);
    await out.drain();
  }
}

/** focus 与 events 同路订阅：只从 RPC 通知收事件，绝不直读 events.jsonl。 */
async function runFocus({ repoRoot, flags, positional, json, out, err }) {
  const [runId, nodeId] = positional;
  const conn = await connectCli({ repoRoot });
  try {
    await convergePending({ conn, repoRoot, err, json });
    const events = [];
    const received = new Set();
    conn.setNotificationHandler((frame) => {
      if (frame?.method === 'event') {
        received.add(frame.params?.seq);
        if (frame.params?.kind === 'host_observation_changed' && frame.params.node_id === nodeId) events.push(frame.params);
      }
    });
    const outcome = await conn.call('subscribe', { run_id: runId, after_seq: 0 });
    if (!outcome.ok) return report(outcome, { json, out, err });
    const target = Math.max(0, outcome.result.next_seq - 1);
    if (target > 0) {
      await new Promise((resolve, reject) => {
        const end = Date.now() + EVENTS_BACKFILL_TIMEOUT_MS;
        const check = () => {
          // host 事件也许不存在；用服务端事件尾作为唯一收齐判据，避免静默窗猜测。
          if (received.has(target)) return resolve();
          if (Date.now() >= end) return reject(new Error('focus: 未收齐 subscribe 回放事件'));
          setTimeout(check, 10);
        };
        check();
      });
    }
    const event = events.sort((a, b) => a.seq - b.seq).at(-1) ?? null;
    const model = { event };
    out.write(json ? `${JSON.stringify(model, null, 2)}\n` : `${renderFocus(event)}\n`);
    return 0;
  } finally {
    conn.close();
  }
}

async function run(argv) {
  const out = makeEmitter(process.stdout);
  const err = makeEmitter(process.stderr);
  let exitCode = 0;
  try {
    const { command, flags, positional } = parseArgv(argv);
    if (!COMMANDS.has(command)) throw new UsageError(command ? `未知命令 ${command}` : '缺少命令');
    // F-025：按命令声明 positional 形状，多余/缺失一律 usage，绝不静默忽略。
    const expected = POSITIONAL_COUNTS[command];
    if (positional.length !== expected) {
      throw new UsageError(command === 'start'
        ? `start 的 run 文档经 --run <run.json> 传入，不收位置参数（收到 ${positional.length} 个）`
        : `${command} 需要恰好 ${expected} 个位置参数，收到 ${positional.length} 个`);
    }
    const repoRoot = resolve(flags.root || process.cwd());
    const json = flags.json === true;
    if (command === 'list') exitCode = await runList({ repoRoot, flags, json, out, err });
    else if (command === 'status') exitCode = await runInspect({ repoRoot, flags, positional, json, out, err, view: 'status' });
    else if (command === 'inspect') exitCode = await runInspect({ repoRoot, flags, positional, json, out, err, view: 'detail' });
    else if (command === 'events') exitCode = await runEvents({ repoRoot, flags, positional, json, out, err });
    else if (command === 'focus') exitCode = await runFocus({ repoRoot, flags, positional, json, out, err });
    else exitCode = await runMutating({ repoRoot, flags, positional, command, json, out, err });
  } catch (error) {
    if (error instanceof UsageError) {
      err.write(`relay: ${error.message}\n${usage()}\n`);
    } else if (error?.reason === 'E_PROTOCOL_VIOLATION') {
      // RW-5：协议违约不是「结果未知」——如实报违约原文（含服务端 reason）。
      // pending 由抛错路径天然保留，交给下一届 CLI 处置。
      err.write(`relay: ${error.message}\n`);
    } else {
      err.write(`${renderTransportFailure(error?.message ?? String(error))}\n`);
    }
    exitCode = 1;
  }
  await out.drain();
  await err.drain();
  return exitCode;
}

try {
  process.exit(await run(process.argv.slice(2)));
} catch (error) {
  console.error(`relay: ${error?.stack ?? error}`);
  process.exit(1);
}
