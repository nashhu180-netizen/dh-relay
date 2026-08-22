// Run 级宿主 lease（design/02 D18 · DevPlan P5-M3）。
//
// 语义：
//   - lease 文件 <runRoot>/host-lease.json 是「同一 Run 唯一活写者」的仲裁物。
//   - 取得：无锁 → wx 独占创建（epoch=1）；已过期或持有人进程已死 → 接管（epoch+1）；
//     新鲜且持有人活着 → E_LEASE_HELD（协议码，reason-codes §四）。
//   - 「持有人进程已死」视同过期可接管：独占性仍由 wx 仲裁保证，可用性对齐 v1 恢复锁
//     的陈旧回收语义；这是相对字面 TTL 更强的一处，等价性结论里明示（见 test 的移交②用例）。
//   - fencing：持有者在每次经 Store 变更前调 verify() 重验「lease 文件仍写着我的 pid+epoch」——
//     与 v1 authority_generation CAS 同强度（写时校验），不需要跨重启的持久计数器。
//   - lease 文件是运行现场内部状态，不是协议对象：不设 protocol 字段、不进契约、不冻形状
//     （实施提示 3：三态只以库返回值与测试断言呈现）。

import { open, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { hostname } from 'node:os';
import { join } from 'node:path';
import { isProcessAlive } from './pidalive.mjs';

export const LEASE_FILE = 'host-lease.json';
const DEFAULT_TTL_MS = 15_000;

function iso(epochMs) {
  return new Date(epochMs).toISOString();
}

export function leasePath(runRoot) {
  return join(runRoot, LEASE_FILE);
}

// 损坏标记：文件存在但不可解析（半写/空/坏 JSON）。与 ENOENT（文件不存在）语义必须分开——
// 前者代表「有人在途或崩在写中途」，acquire 需要走回收分支而不是当无锁（否则 wx 永远 EEXIST、无限自旋）。
export const LEASE_CORRUPT = Symbol('LEASE_CORRUPT');

export async function readLease(runRoot) {
  let raw;
  try {
    raw = await readFile(leasePath(runRoot), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    return LEASE_CORRUPT; // 瞬时可读性失败按损坏处理：接管仲裁靠 wx，读失败不阻塞安全
  }
  try {
    const parsed = JSON.parse(raw);
    // R2-N1：expires 缺失时 inspect 会把「无到期时间」当成未过期（alive）而 acquire 会接管
    // （NaN 比较恒 false）——三态不变量被异形租约打破。缺 pid/epoch/expires 一律视为损坏。
    const expiry = parsed?.expires_at_epoch_ms ?? (parsed ? Date.parse(parsed.expires_at) : NaN);
    if (!parsed || !Number.isInteger(parsed.holder_pid) || !Number.isInteger(parsed.epoch) || !Number.isFinite(expiry)) {
      return LEASE_CORRUPT;
    }
    return parsed;
  } catch {
    return LEASE_CORRUPT;
  }
}

function sameHolder(lease, holder) {
  return Boolean(lease && holder && lease.holder_pid === holder.pid && lease.epoch === holder.epoch);
}

async function writeLeaseExclusive(runRoot, payload) {
  let handle;
  try {
    handle = await open(leasePath(runRoot), 'wx');
  } catch (error) {
    if (error.code === 'EEXIST') return false; // 别人先到 —— 仲裁失败
    throw error;
  }
  try {
    await handle.writeFile(`${JSON.stringify(payload)}\n`, 'utf8');
  } finally {
    await handle.close();
  }
  return true;
}

async function replaceLeaseAtomic(runRoot, payload) {
  const tmp = `${leasePath(runRoot)}.tmp-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  await writeFile(tmp, `${JSON.stringify(payload)}\n`, 'utf8');
  await rename(tmp, leasePath(runRoot));
}

/**
 * 取得（或接管）Run 的宿主 lease。成功返回控制句柄；被拒抛 Error('E_LEASE_HELD')。
 * 返回 tookOver=true 时，previousEpoch 为被接管的上一任 epoch（宿主据此补记 lease_expired 事件）。
 */
const DEFAULT_ACQUIRE_TIMEOUT_MS = 10_000;
const DEFAULT_ACQUIRE_BACKOFF_MS = 25;

export async function acquireLease({
  runRoot,
  runId,
  ttlMs = DEFAULT_TTL_MS,
  clock = () => Date.now(),
  timeoutMs = DEFAULT_ACQUIRE_TIMEOUT_MS,
  backoffMs = DEFAULT_ACQUIRE_BACKOFF_MS,
}) {
  const deadline = clock() + timeoutMs;
  for (;;) {
    if (clock() > deadline) {
      // 有界：绝不无限自旋（P1：空/损坏租约曾让本循环 EEXIST 死转）。超时是内部前缀，不上协议线。
      throw new Error('E_LEASE_ACQUIRE_TIMEOUT');
    }
    const now = clock();
    const existing = await readLease(runRoot);
    if (existing && existing !== LEASE_CORRUPT && now < Date.parse(existing.expires_at) && isProcessAlive(existing.holder_pid)) {
      throw new Error('E_LEASE_HELD');
    }
    const tookOver = existing !== null; // 损坏/有效旧租约都是接管；纯缺失才是首取
    const previousEpoch = existing && existing !== LEASE_CORRUPT ? existing.epoch : null;
    const payload = {
      run_id: runId,
      holder_pid: process.pid,
      epoch: existing && existing !== LEASE_CORRUPT ? existing.epoch + 1 : 1,
      acquired_at: iso(now),
      expires_at: iso(now + ttlMs),
      expires_at_epoch_ms: now + ttlMs,
      hostname: hostname(),
    };
    let claimed;
    if (existing) {
      // 接管（含损坏回收）：先撤旧再 wx 创建；并发接管者输家下一轮重读即可（unlink 后谁建归谁）。
      // 损坏被回收是安全的：真正的独占仲裁是 wx，且旧持有人的后续写会被 fencing 拒绝（self-healing）。
      await unlink(leasePath(runRoot)).catch(() => {});
      claimed = await writeLeaseExclusive(runRoot, payload);
    } else {
      claimed = await writeLeaseExclusive(runRoot, payload);
    }
    if (!claimed) {
      if (backoffMs > 0) await new Promise((resolveSleep) => setTimeout(resolveSleep, backoffMs));
      continue;
    }

    const self = () => readLease(runRoot).then((current) => sameHolder(current, { pid: process.pid, epoch: payload.epoch }));
    return {
      ...payload,
      tookOver,
      previousEpoch,
      /** fencing 校验：lease 文件仍写着本持有人（供 Store writeGuard 在串行队列内调用）。 */
      verify: self,
      /**
       * 续租：unlink+wx 重建（与 acquire 同一仲裁协议），不 rename 覆写。
       * R1-03（P1）教训：原实现 readLease→replaceLeaseAtomic(rename) 有覆写窗口——接管者
       * wx 建好后，旧持有人的 rename 会把新持有人的租约整体覆盖（Windows rename 语义），
       * fence 复活、两宿主短暂共写 events.jsonl（双 seq 风险）。unlink+wx 下：
       *   - 我方租约仍新鲜（活持有人）→ 接管者被 E_LEASE_HELD 挡，unlink 后 wx 必赢；
       *   - 我方已过期/已死 → 接管者可能先 wx 成功 → 我方 wx 失败 → lease-lost 退出。
       * 窗口内租约文件瞬时缺失（微秒级）：inspect 可能闪 dead，无操作面影响，登记 as-built。
       */
      renew: async () => {
        const current = await readLease(runRoot);
        if (!sameHolder(current, { pid: process.pid, epoch: payload.epoch })) {
          throw new Error('E_LEASE_HELD:lease-lost');
        }
        const now = clock();
        // 新鲜度闸：已过期的租约不得续——陈旧宿主一旦能续租，就可能在接管者 wx 建好
        // 之后 unlink 掉对方的文件自己重建（fence 复活）。过期 = 权威已失，直接停机。
        const currentExpiry = current.expires_at_epoch_ms ?? Date.parse(current.expires_at);
        if (now >= currentExpiry) {
          throw new Error('E_LEASE_HELD:lease-lost');
        }
        const nextNow = now;
        await unlink(leasePath(runRoot)).catch(() => {});
        const next = {
          ...current,
          acquired_at: current.acquired_at,
          expires_at: iso(nextNow + ttlMs),
          expires_at_epoch_ms: nextNow + ttlMs,
        };
        const claimed = await writeLeaseExclusive(runRoot, next);
        if (!claimed) throw new Error('E_LEASE_HELD:lease-lost');
        return true;
      },
      /** 优雅释放：仍是自己才删。 */
      release: async () => {
        if (await self()) await unlink(leasePath(runRoot)).catch(() => {});
      },
    };
  }
}

/**
 * 只读三态判定（B7/D18）：alive=新鲜且持有人活；lease_expired=过期或持有人已死（此时
 * acquire 必成功）；dead=run 在而 lease 无。与 acquire 的成败构成可测不变量（见 runtime 测试）。
 */
export async function inspectHost({ runRoot, clock = () => Date.now() }) {
  const lease = await readLease(runRoot);
  if (!lease) return { state: 'dead', detail: null };
  if (lease === LEASE_CORRUPT) {
    // 损坏租约 = 无有效持有人（可接管），与 acquire 的回收分支语义一致。
    return { state: 'lease_expired', detail: { corrupt: true } };
  }
  const now = clock();
  const expired = now >= (lease.expires_at_epoch_ms ?? Date.parse(lease.expires_at));
  const holderAlive = isProcessAlive(lease.holder_pid);
  return {
    state: !expired && holderAlive ? 'alive' : 'lease_expired',
    detail: { epoch: lease.epoch, holder_pid: lease.holder_pid, expires_at: lease.expires_at, expired, holder_alive: holderAlive },
  };
}
