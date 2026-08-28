// Detached 宿主会话（P5-M1 / P5-M3 · design/02 D18）：
//   前置闸 → 取得/接管 lease → openStore fail-closed 重建 → 补记接管事件 → tick 循环续租
//   → 优雅停机释放 lease；被强杀则 lease 变陈旧，下一任走接管路径（M3 的恢复起点）。
//
// 边界：本卡宿主是「生命周期保持器」——不含 executor/工作流调度（DHR_31 行使）、不开 RPC（DHR_52）。
// 宿主对 Store 的一切变更都挂 writeGuard=fencing 重验：接管发生后，旧宿主残余的任何写
// （含 appendResult）在串行队列内被 E_LEASE_HELD:lease-lost 拒绝——这是移交②「不弱于 v1 CAS」的机制本体。

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { openStore } from '../store/store.mjs';
import { assertStoreRootIgnored } from './gitignore.mjs';
import { acquireLease } from './lease.mjs';

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const isLostLease = (error) => error?.message === 'E_LEASE_HELD:lease-lost';

export function runRootOf({ repoRoot, runId }) {
  return join(resolve(repoRoot), '.dh-relay', runId);
}

/**
 * 运行一届宿主会话，直到 shouldStop()/信号触发优雅停机。返回会话摘要供测试断言。
 * 抛 E_LEASE_HELD（已有活宿主）/ E_GITIGNORE_MISSING / openStore 的完整性错误族。
 */
export async function runHostSession({
  repoRoot,
  runId,
  ttlMs = 15_000,
  tickMs = null,
  clock = () => Date.now(),
  shouldStop = () => false,
  onReady = null,
  trapSignals = false,
  gitBin = 'git',
}) {
  const tickEvery = tickMs ?? Math.max(50, Math.floor(ttlMs / 3));
  const runRoot = runRootOf({ repoRoot, runId });
  await assertStoreRootIgnored({ repoRoot, gitBin });
  const lease = await acquireLease({ runRoot, runId, ttlMs, clock });

  let stopping = false;
  const requestStop = () => {
    stopping = true;
  };
  const traps = [];
  if (trapSignals) {
    for (const signalName of ['SIGTERM', 'SIGINT']) {
      const handler = () => requestStop();
      process.on(signalName, handler);
      traps.push([signalName, handler]);
    }
  }

  let store;
  let lostLease = false;
  let renewals = 0;
  try {
    store = await openStore({
      root: runRoot,
      writeGuard: async () => {
        if (!(await lease.verify())) throw new Error('E_LEASE_HELD:lease-lost');
      },
    });
    if (lease.tookOver) {
      await store.appendEvent({ kind: 'lease_expired', at: new Date(clock()).toISOString(), detail: `epoch:${lease.previousEpoch}` });
    }
    await store.appendEvent({ kind: 'lease_acquired', at: new Date(clock()).toISOString(), detail: `epoch:${lease.epoch}` });
    await onReady?.({ store, runId, epoch: lease.epoch, tookOver: lease.tookOver });

    while (!stopping && !shouldStop()) {
      await sleep(tickEvery);
      try {
        await lease.renew();
        renewals += 1;
      } catch (error) {
        if (isLostLease(error)) {
          lostLease = true; // 写权已易主：立即停机且绝不释放别人的租约
          break;
        }
        throw error;
      }
    }
  } catch (error) {
    // 初始化期的首个 lease_* 事件同样受 writeGuard fencing；若此时已换手，
    // 必须与 tick 期失租同义收敛，不能让会话以未处理错误退出。
    if (isLostLease(error)) lostLease = true;
    else throw error;
  } finally {
    for (const [signalName, handler] of traps) process.off(signalName, handler);
    if (!lostLease) await lease.release();
  }
  return {
    run_id: runId,
    epoch: lease.epoch,
    took_over: lease.tookOver,
    previous_epoch: lease.previousEpoch,
    renewals,
    lost_lease: lostLease,
    graceful: !lostLease,
  };
}

/**
 * DHR_30 的 service 内嵌 HostSession actor（design/07 §3.2 的四接口合同）。
 * 它只维持 lease 与 Store 单写者，不 import workflow / Process / executor，也不推进业务节点。
 *
 *   ready           成功仅当 lease 已取得、Store 已打开、lease_acquired 已写入
 *   submitControl() 在 actor 串行队列内执行一段控制作业（写 Receipt、停或恢复）
 *   stop()          请求优雅停止；同一队列释放 lease，且只释放自己取得的那一份
 *   done            { outcome: 'graceful' | 'lost_lease' | 'failed', … }
 *
 * **失租后队列拒绝所有写**：这是「不出现双写者」的最后一道闸。Store 的 writeGuard 已经在
 * 落盘前重验 lease，actor 队列这一层是把「已知失租」变成**立刻可判定的拒绝**，
 * 免得调用方把一堆迟到写排进队列再一条条失败。
 */
export function createHostSessionActor(options) {
  let resolveReady;
  let rejectReady;
  let stopping = false;
  let context = null;
  let lostLease = false;
  let finished = false;
  const ready = new Promise((resolveReadyPromise, rejectReadyPromise) => {
    resolveReady = resolveReadyPromise;
    rejectReady = rejectReadyPromise;
  });
  ready.catch(() => {}); // ready 的拒绝由调用方决定何时消费；这里只防未处理拒绝告警

  // 控制队列与 Store 写队列是两层：Store 保证「一次变更内部」的串行，
  // 这一层保证「一次控制作业整体」的串行——写 Receipt 与随后的停机不得被别的控制插进来。
  let tail = Promise.resolve();

  const done = runHostSession({
    ...options,
    shouldStop: () => stopping || options.shouldStop?.() === true,
    onReady: async (ctx) => {
      await options.onReady?.(ctx);
      context = ctx;
      resolveReady(ctx);
    },
  }).then(
    (summary) => {
      finished = true;
      lostLease = summary.lost_lease === true;
      return { outcome: lostLease ? 'lost_lease' : 'graceful', ...summary };
    },
    (error) => {
      finished = true;
      lostLease = true; // 会话已不在：无论何种原因，之后的写一律不许再进队列
      rejectReady(error);
      return { outcome: 'failed', error, run_id: options.runId, lost_lease: false, graceful: false };
    },
  );

  function refuseIfClosed() {
    if (!lostLease && !finished) return null;
    const error = new Error('E_LEASE_HELD:actor-closed');
    error.reason = 'E_LEASE_HELD';
    return error;
  }

  return {
    ready,
    done,
    get store() { return context?.store ?? null; },
    get runId() { return options.runId; },
    /** 在 actor 串行队列内跑一段控制作业；参数是本 actor 独占的 Store 句柄。 */
    submitControl(job) {
      const outcome = tail.then(async () => {
        const refusal = refuseIfClosed();
        if (refusal) throw refusal;
        if (!context) await ready;
        return job(context.store, context);
      });
      tail = outcome.then(() => undefined, () => undefined);
      return outcome;
    },
    stop() { stopping = true; },
  };
}

/** 拉起脱离本进程的 detached 宿主（stdio 丢弃、unref）。返回子进程 pid。 */
export function startDetachedHost({ repoRoot, runId, nodeBin = process.execPath }) {
  const hostMainPath = fileURLToPath(new URL('./host-main.mjs', import.meta.url));
  const child = spawn(nodeBin, [hostMainPath, '--root', resolve(repoRoot), '--run-id', runId], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
  return child.pid;
}
