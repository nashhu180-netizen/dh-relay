// 仓级锁（design/02 D23：发号「搭在建 run 时已有的仓级锁上」；v1 那把锁是 PowerShell 侧的，
// v2 本卡新造——实施提示 5）。同一把锁服务 run_id 发号；claim/archive lease 是后续卡的语义。
//
// 协议：'wx' 独占创建锁文件 = 拿锁；已存在则读持有人——过期或持有人进程已死 → 回收（unlink）重试；
// 否则退避等待直到超时。超时抛内部前缀 E_REPO_LOCK_TIMEOUT（reason-codes §四边界声明：
// 进程内异常前缀不上协议线）。跨仓单文件按仓分段，A 仓死锁不得挡 B 仓——所以必须有超时与陈旧回收。

import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { isProcessAlive } from './pidalive.mjs';

const DEFAULT_TTL_MS = 15_000;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_MS = 25;

function iso(epochMs) {
  return new Date(epochMs).toISOString();
}

function parseHolder(text) {
  try {
    const holder = JSON.parse(text);
    if (holder && Number.isInteger(holder.pid)) return holder;
    return null;
  } catch {
    return null; // 半写/损坏
  }
}

function holderIsStale(holder, now) {
  // 只有「读到了完整持有人在档」才允许判陈旧。文件存在但不可解析 = 有人正卡在
  // open-wx 与 writeFile 之间（在途锁）：绝不能回收——本锁的临界区（发号）没有
  // fencing 兜底，偷在途锁会制造双持有人（E14 复核 @ReviewRound1 实证窗口）。
  // 代价：open-wx 后崩死留下的空文件会把锁永久卡到超时（有界、可人工清），可接受。
  if (!holder) return false;
  if (Number.isInteger(holder.expires_at_epoch_ms) && now >= holder.expires_at_epoch_ms) return true;
  return !isProcessAlive(holder.pid);
}

export async function acquireRepoLock({
  path,
  ttlMs = DEFAULT_TTL_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retryMs = DEFAULT_RETRY_MS,
  clock = () => Date.now(),
}) {
  await mkdir(dirname(path), { recursive: true });
  const deadline = clock() + timeoutMs;
  for (;;) {
    const now = clock();
    const payload = {
      pid: process.pid,
      nonce: crypto.randomUUID(), // 归属令牌：同一进程内多次取得也可区分（release/renew 只认自己的）
      acquired_at: iso(now),
      expires_at: iso(now + ttlMs),
      expires_at_epoch_ms: now + ttlMs,
    };
    let handle;
    try {
      handle = await open(path, 'wx');
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const holder = parseHolder(await readFile(path, 'utf8').catch(() => ''));
      if (!holderIsStale(holder, clock())) {
        if (clock() >= deadline) {
          throw new Error(`E_REPO_LOCK_TIMEOUT:${join('…', String(timeoutMs))}ms`);
        }
        await new Promise((resolve) => setTimeout(resolve, retryMs));
        continue;
      }
      // 陈旧锁回收：先到者赢 unlink；输家下一轮 EEXIST 重读即可。
      await unlink(path).catch(() => {});
      continue;
    }
    try {
      await handle.writeFile(`${JSON.stringify(payload)}\n`, 'utf8');
    } finally {
      await handle.close();
    }
    return {
      path,
      pid: process.pid,
      nonce: payload.nonce,
      release: async () => {
        // 只释放仍是自己的锁（pid+nonce 双校验）：内容不匹配（已被换手/陈旧回收）就不动。
        const current = parseHolder(await readFile(path, 'utf8').catch(() => ''));
        if (current?.pid === process.pid && current.nonce === payload.nonce) await unlink(path).catch(() => {});
      },
    };
  }
}
