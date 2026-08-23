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
