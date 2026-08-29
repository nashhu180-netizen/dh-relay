// pending.mjs — CLI 的客户端 request record（design/08 §2）。
//
// start/stop/resume 发送前先把**完整请求**（client_id / request_id / method / params /
// request_digest / at）原子落在这里（锁内 temp + rename），收到确定结果后收回。CLI 崩在
// 中间时，下一届 CLI 启动凭残条里的原幂等键（client_id + request_id + method，逐字取自
// record）重试收敛，服务端的 operation ledger 保证绝不执行第二次。
//
// 并发纪律（F-019，2026-08-28 用户裁决定稿）：这份账被同仓所有 CLI 进程共享，add/remove
// 全程持同目录独占锁文件（`wx` 创建；拿不到就短退避重试）。**没有自动陈锁回收**——三轮
// 复审（R-D-01 / R-E-01 / R-F-01）证明文件系统语义下「检查锁对象后原子删除」不可得，任何
// 自动回收都留有被挂起持有者醒来提交进他人临界区的竞态窗；取舍是绝对互斥优先：退避耗尽
// 一律 E_PENDING_LOCK_BUSY 稳定拒绝（账未动，重试安全），错误信息带持有者 pid/时间/锁
// 路径与手工恢复指引（pid 已死才建议删锁）。崩死在毫秒级临界区内留下残锁是罕见事件，用
// 一次手工删除换零竞态。锁内容仍带随机 owner token：释放与提交（rename / 收账 unlink）前
// 核验 token 作纵深防御——万一锁被人工误删又被抢建，失主放弃提交整段重试，绝不写坏账。
// 私有纪律（F-020，2026-08-28 用户裁决定稿）：pending 连同锁/临时文件住 **`.dh-relay/private/`
// 独立私有子目录**——design/08 §2 要求「pending 目录 owner-only」而 descriptor 所在的
// `.dh-relay/` 根须沿业务仓 ACL 可发现（R-F-03 抓出的两头冲突），分层各归各。private/ 由
// 本模块独占创建：每次写入前显式收权（POSIX chmod 目录 0o700、三类文件 0o600；win32 走
// icacls：/reset 清既有显式 ACE → /inheritance:r 去继承 → /grant:r 只授当前用户 (OI)(CI)F，
// 文件按对象继承同样 owner-only），设不上就 fail-closed——合同没给平台例外。
// 它不是真相：幂等与 Receipt 的真相在 service 的 runtime-operations.json 与 Run 事件账。

import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { chmod, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** 拿不到锁的短退避：50ms × 最多 100 次（≈5s 上界），耗尽即稳定拒绝。 */
const LOCK_RETRY_MS = 50;
const LOCK_RETRY_MAX = 100;

export function pendingPath(repoRoot) {
  // F-020：private/ 是本模块独占的 owner-only 子目录；descriptor 所在的 .dh-relay/ 根
  // 沿业务仓 ACL，两头互不干扰（design/08 §2，2026-08-28 用户裁决落点）。
  return join(resolve(repoRoot), '.dh-relay', 'private', 'pending-operations.json');
}

function corrupt(detail) {
  const error = new Error(`E_STORE_CORRUPT:pending-operations:${detail}`);
  error.reason = 'E_STORE_CORRUPT';
  return error;
}

function lockBusy(detail) {
  const error = new Error(`E_PENDING_LOCK_BUSY:${detail}`);
  error.reason = 'E_PENDING_LOCK_BUSY';
  return error;
}

/** 内部信号：持锁在临界区中途被回收（锁已不在或 token 易主），放弃本次提交、整段重试。 */
function lockLost(detail) {
  const error = new Error(`E_PENDING_LOCK_LOST:${detail}`);
  error.reason = 'E_PENDING_LOCK_LOST';
  return error;
}

/** 本进程已收过权的目录（win32 icacls 每次 spawn 有实际开销，每进程每目录收一次即可）。 */
const tightenedDirectories = new Set();

/**
 * R-E-02：win32 的 chmod 近似 no-op，owner-only 要靠 DACL——icacls 去掉继承 ACE 并整表
 * 重授「仅当前用户 (OI)(CI)F」；(OI)(CI) 使目录下新建的 pending/临时/锁文件按对象继承同样
 * 只剩当前用户。设不上（icacls 缺失 / 拒绝）即 fail-closed：合同没给平台例外（design/08 §2）。
 */
async function tightenWindowsAcl(directory) {
  if (process.platform !== 'win32' || tightenedDirectories.has(directory)) return;
  const user = process.env.USERNAME;
  if (!user) throw corrupt('win32-username-unavailable');
  try {
    // 三步收权（R-F-02）：/reset 先清掉一切**既有显式** ACE（/grant:r 只替换同名用户的
    // ACE、清不掉别人的），再去继承、再整表只授当前用户；(OI)(CI) 让目录下新建文件按
    // 对象继承同样 owner-only。
    await execFileAsync('icacls', [directory, '/reset']);
    await execFileAsync('icacls', [directory, '/inheritance:r', '/grant:r', `${user}:(OI)(CI)F`]);
  } catch (error) {
    throw corrupt(`win32-acl-tighten-failed:${error?.code ?? 'icacls-error'}`);
  }
  tightenedDirectories.add(directory);
}

/**
 * F-020/R-D-02：`.dh-relay/` 可能已被 runtime/endpoint 以默认 ACL 先建好——mkdir 的
 * mode 对已存在目录不生效，写前必须显式 chmod 收权（POSIX 的真实 mode 由测试钉住；
 * win32 走 icacls，见 tightenWindowsAcl）。
 */
async function ensurePendingDirectory(directory) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  await tightenWindowsAcl(directory);
}

/** chmod 兜底对 ENOENT 宽容：文件刚被（合法地）收走不算错，其余错误照抛。 */
function chmodTight(path, mode) {
  return chmod(path, mode).catch(error => { if (error?.code !== 'ENOENT') throw error; });
}

/**
 * RW2-1：核验锁文件当前持有者是否仍是 token 本人。文件已不存在（被陈锁回收）或 token
 * 不符（别人已抢建）都返回 false；读不了/解析不了同样按「非己方」处理——宁可放弃提交、
 * 也不误删他人之锁。
 */
async function lockOwnedBy(lockPath, token) {
  let text;
  try {
    text = await readFile(lockPath, 'utf8');
  } catch {
    return false;
  }
  try {
    return JSON.parse(text)?.token === token;
  } catch {
    return false;
  }
}

/** 持有者进程是否还活着：kill 0 报 ESRCH 才算死；EPERM = 存在但无权，按活处理。 */
function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== 'ESRCH';
  }
}

/**
 * 跨进程互斥：同目录 `pending-operations.lock` 以 `wx` 独占创建（内容 `{pid, token, at}`，
 * token = randomUUID），全程持锁执行 task。EEXIST → 短退避重试；耗尽 → E_PENDING_LOCK_BUSY
 * 稳定拒绝（账未动，重试安全），错误信息按锁上登记的持有者 pid 存活与否给手工恢复指引。
 * **没有自动回收**（F-019 用户裁决）：任何「检查后删除」在文件系统语义下都非原子，绝对
 * 互斥优先。task 收到 `stillOwner()`；提交前核验失败（内部 lockLost）= 锁被人工干预易主，
 * 放弃本次结果，从抢锁开始整段重来。
 */
async function withPendingLock(repoRoot, task) {
  const directory = dirname(pendingPath(repoRoot));
  await ensurePendingDirectory(directory);
  const lockPath = join(directory, 'pending-operations.lock');
  for (let round = 0; ; round += 1) {
    const token = randomUUID();
    for (let attempt = 0; ; attempt += 1) {
      try {
        await writeFile(lockPath,
          `${JSON.stringify({ pid: process.pid, token, at: new Date().toISOString() })}\n`,
          { encoding: 'utf8', flag: 'wx', mode: 0o600 });
        await chmodTight(lockPath, 0o600);
        break;
      } catch (error) {
        const windowsCreateRace = process.platform === 'win32'
          && (error?.code === 'EPERM' || error?.code === 'EACCES');
        if (error?.code !== 'EEXIST' && !windowsCreateRace) throw error;
        if (windowsCreateRace && attempt >= LOCK_RETRY_MAX - 1) throw error;
        if (attempt >= LOCK_RETRY_MAX - 1) {
          // 稳定拒绝前读一次锁面（尽力而为），把持有者信息与恢复指引带给用户。
          let holder = null;
          try {
            holder = JSON.parse(await readFile(lockPath, 'utf8'));
          } catch { /* 锁面读不出就只报路径 */ }
          const pid = Number.isInteger(holder?.pid) ? holder.pid : null;
          const since = typeof holder?.at === 'string' ? holder.at : 'unknown';
          // R-G-04：pid 只是**瞬时存活线索**，不是锁的所有权凭据（撞号 / 期间易主都可能），
          // 所以恢复指引必须要求人先停光本机 CLI、再复核锁面内容，最后才删——不能只凭这行 pid。
          if (pid !== null && !pidAlive(pid)) {
            throw lockBusy(`lock-holder-dead:pid=${pid}:since=${since}:pid 只是瞬时存活线索、不是所有权凭据；请先停掉本机所有 relay CLI，再复核 ${lockPath} 内容仍为该已死进程，然后手工删除并重试`);
          }
          throw lockBusy(`lock-holder-${pid === null ? 'unknown' : `alive:pid=${pid}`}:since=${since}:${lockPath} 正被占用，稍后重试；pid 不能证明所有权，仅当停光本机 CLI 并复核锁面后才可手工删锁`);
        }
        await new Promise(done => setTimeout(done, LOCK_RETRY_MS));
      }
    }
    try {
      return await task({ stillOwner: () => lockOwnedBy(lockPath, token) });
    } catch (error) {
      if (error?.reason !== 'E_PENDING_LOCK_LOST') throw error;
      if (round >= LOCK_RETRY_MAX - 1) throw lockBusy(`lock-lost-retry-exhausted:${lockPath}`);
      // 持锁被中途回收：放弃本次提交结果，外圈从抢锁开始整段重试。
    } finally {
      // 释放前必须核验 token 是自己的才 unlink；不符或文件已不存在 = 自己的锁已被陈锁
      // 回收（可能已有新持锁者）——绝不 unlink，否则删掉的是别人的锁（R-D-01 根因）。
      if (await lockOwnedBy(lockPath, token)) await unlink(lockPath).catch(() => {});
    }
  }
}

/** 读全部残条。文件不存在 = 无在途操作；坏了必须 fail-closed，不能当空账。 */
export async function readPendingRecords(repoRoot) {
  let text;
  try {
    text = await readFile(pendingPath(repoRoot), 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw corrupt(error?.code ?? 'unreadable');
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw corrupt('unparsable');
  }
  if (parsed?.version !== 1 || !Array.isArray(parsed.pending)) throw corrupt('shape');
  return parsed.pending;
}

async function writeRecords(repoRoot, records, { stillOwner, beforeRename } = {}) {
  const path = pendingPath(repoRoot);
  await ensurePendingDirectory(dirname(path));
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify({ version: 1, pending: records }, null, 2)}\n`,
      { encoding: 'utf8', mode: 0o600 });
    await chmodTight(temporary, 0o600);
    // 测试钩子（R-E-03）：临时文件与锁只在临界区内存活，这里给测试一个确定性观测点。
    if (beforeRename) await beforeRename({ temporaryPath: temporary });
    // RW2-1：rename 提交前核验持锁——易主（自己的锁已被陈锁回收、可能有新持锁者）即放弃
    // 本次提交，抛 lockLost 让 withPendingLock 整段重试；绝不把旧快照写进别人的临界区。
    if (stillOwner && !(await stillOwner())) throw lockLost(`lock-not-owned-before-rename:${path}`);
    await rename(temporary, path);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
  // rename 后的 chmod 兜底：顺带把上一届以宽权限留下的账面一并收紧（F-020/R-D-02）。
  await chmodTight(path, 0o600);
}

/**
 * 新 mutating 命令发送前先落一条残条（持锁 read-modify-rename，绝不覆盖并发写入）。
 * testHooks 仅供进程内测试做临界区确定性观测（R-E-03），生产路径不传。
 */
export async function addPendingRecord(repoRoot, record, testHooks = undefined) {
  await withPendingLock(repoRoot, async ({ stillOwner }) => {
    const records = await readPendingRecords(repoRoot);
    records.push(record);
    await writeRecords(repoRoot, records, { stillOwner, beforeRename: testHooks?.beforeRename });
  });
}

/**
 * 该 request_id 已拿到确定结果（成功或确定失败）：把这条残条收走；全空则连文件一起收走。
 * 同样持锁——并发 CLI 各收各的条，互不覆盖。收账 unlink 与 rename 同属提交：同样核验
 * 持锁（RW2-1），易主即整段重试——重试后重读账面，绝不会误删并发者刚写入的条目。
 */
export async function removePendingRecord(repoRoot, requestId) {
  await withPendingLock(repoRoot, async ({ stillOwner }) => {
    const records = await readPendingRecords(repoRoot);
    const rest = records.filter(record => record?.request_id !== requestId);
    if (rest.length === records.length) return;
    if (rest.length === 0) {
      if (!(await stillOwner())) throw lockLost(`lock-not-owned-before-unlink:${pendingPath(repoRoot)}`);
      await unlink(pendingPath(repoRoot)).catch(error => { if (error?.code !== 'ENOENT') throw error; });
      return;
    }
    await writeRecords(repoRoot, rest, { stillOwner });
  });
}
