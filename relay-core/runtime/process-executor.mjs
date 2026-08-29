// process-executor.mjs — Process Executor（`executor_kind: "process"`，ADR-002 第①问的运行时落点）。
//
// 只做三件事，且都是纯粹的：把 `executor_profiles[].ref` 解析成一个**仓内**可执行入口、
// 起一个子进程喂上下文收结构化输出、把子进程的退出形态翻译成 reason code。
// 不碰 Store、不认识节点与依赖——记账与调度是 workflow-driver 的事。
//
// 边界：本文件不新增任何 reason code，用的三个（`E_EXECUTOR_EXIT_NONZERO` /
// `E_EXECUTOR_KILLED` / `E_BAD_VALUE`）都在 `contracts/reason-codes.md` 里已冻结。

import { spawn } from 'node:child_process';
import { realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

/** 失败结果里保留的 stderr 尾部字节数——够定位，又不至于把日志灌进事件账。 */
const STDERR_TAIL_MAX = 2000;

/** relative() 的越界判据。`..foo` 不是上跳，只有首段恰为 `..` 才是。 */
function escapesRoot(root, target) {
  const inside = relative(root, target);
  return inside === '' || isAbsolute(inside) || inside.split(/[\\/]/)[0] === '..';
}

/**
 * 第一道（词法）守卫：把 locator 形态的 `ref` 解析成绝对路径，并按 resolve **之后**的
 * 落点判断是否还在仓内。
 *
 * 为什么不能只靠契约层的 `locator` pattern：那道守卫挡的是「绝对路径」（盘符 / UNC /
 * POSIX 绝对 / URI scheme / `~` / `%`），而 `../../etc/passwd` 是**合法的相对路径**——
 * 它一个字都不违反 locator，却能把执行点带出业务仓。也不能靠字符串里有没有 `..` 来判
 * （`steps/../../x` 与 `..foo/x` 都含点，前者越界后者不越界）。
 *
 * ⚠️ 词法守卫**挡不住符号链接**（F-009，批 2 小审 P0）：`steps/link.mjs` 在词法上老老实实
 * 待在仓内，`resolve` 不会去读它指向哪儿。真实落点的判定在 `resolveStepEntry()`，那一步
 * 才是安全边界；本函数保留为纯函数，是因为「什么形状的 ref 一眼就不合法」值得独立钉住，
 * 且它不需要文件系统就能逐档复跑。
 *
 * @returns `{ ok: true, path }` | `{ ok: false, reason: 'E_BAD_VALUE', detail }`
 */
export function resolveStepRef({ repoRoot, ref }) {
  const reject = (detail) => ({ ok: false, reason: 'E_BAD_VALUE', detail });
  if (typeof ref !== 'string' || ref.length === 0) return reject('executor-ref-required');
  // 与 locator 守卫同口径的前置拒绝：盘符/UNC/POSIX 绝对/家目录/环境变量展开/URI scheme。
  if (isAbsolute(ref) || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(ref) || /^[\\/~%]/.test(ref)) {
    return reject('executor-ref-not-relative');
  }
  const root = resolve(repoRoot);
  const target = resolve(root, ref);
  if (escapesRoot(root, target)) return reject('executor-ref-escapes-repo');
  return { ok: true, path: target };
}

/**
 * 第二道（真实落点）守卫，也是**安全边界本体**：对仓根与目标各做一次 `realpath`，
 * 再判断解析完符号链接之后的落点是否仍在仓内。
 *
 * 为什么必须 realpath 两边：只 realpath 目标，仓根若自身含符号链接段（macOS 的
 * `/var → /private/var`、临时目录、Windows 短名）就会与解析后的目标对不上，把合法路径
 * 误判成逃逸；只 realpath 仓根则等于没做——`steps/link.mjs → 仓外/evil.mjs` 照过
 * （F-009 的原漏洞：`stat()` 跟随符号链接，于是「文件存在」的判定通过了，执行点却在仓外）。
 *
 * 三种归宿，对应三种不同的事实：
 *   · `{ ok:false, reason:'E_BAD_VALUE' }`  ref 越界（词法或符号链接）→ 调用方开 Attempt 并立刻记终态；
 *   · `{ ok:true, runnable:false }`         仓内合法但没有可执行文件（不存在 / 是目录）→ 节点保持 pending；
 *   · `{ ok:true, runnable:true, path }`    可驱动，`path` 是已解析的真实路径。
 *
 * 已知残余（有意接受）：realpath 与随后 spawn 之间存在 TOCTOU 窗口。Relay 的 Run Store 与
 * 步骤脚本都在**本机、本用户**的业务仓里，能在这个窗口里换链接的人本来就能直接改步骤脚本；
 * 为它引入文件句柄级的锁不改变威胁模型，只增加平台差异。
 */
export async function resolveStepEntry({ repoRoot, ref }) {
  const lexical = resolveStepRef({ repoRoot, ref });
  if (!lexical.ok) return lexical;

  let realRoot;
  try {
    realRoot = await realpath(repoRoot);
  } catch {
    return { ok: false, reason: 'E_BAD_VALUE', detail: 'repo-root-unresolvable' };
  }

  let realTarget;
  try {
    realTarget = await realpath(lexical.path);
  } catch (error) {
    // 指不到东西（含指向不存在目标的断链）：没有可执行入口，但也没有越界事实。
    if (error?.code === 'ENOENT') return { ok: true, runnable: false, path: lexical.path };
    return { ok: false, reason: 'E_BAD_VALUE', detail: `executor-ref-unresolvable-${error?.code ?? 'unknown'}` };
  }

  if (escapesRoot(realRoot, realTarget)) {
    return { ok: false, reason: 'E_BAD_VALUE', detail: 'executor-ref-escapes-repo-via-link' };
  }

  let isFile = false;
  try {
    isFile = (await stat(realTarget)).isFile();
  } catch { /* 竞态删除：按「没有可执行入口」处理 */ }
  return { ok: true, runnable: isFile, path: realTarget };
}

/**
 * 起一个步骤子进程：stdin 喂 JSON 上下文，stdout 收 JSON 结构化结果。
 * 返回 `{ done, kill }`——`kill()` 是 stop control 中断在跑步骤的唯一入口，
 * 它先置 killed 再杀，这样退出形态永远能与「自己非 0 退出」区分开
 * （Windows 上被杀的子进程 signal 恒为 null，只靠 signal 判断会把 kill 误记成 exit-nonzero）。
 */
export function startProcessStep({ scriptPath, cwd, context, nodeBin = process.execPath }) {
  let killed = false;
  let stdout = '';
  let stderr = '';
  const child = spawn(nodeBin, [scriptPath], { cwd, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.stdin.on('error', () => { /* 子进程先退出时 stdin 会 EPIPE；真相由 close 给出 */ });

  const done = new Promise((settle) => {
    let finished = false;
    const finish = (payload) => {
      if (finished) return;
      finished = true;
      settle({ killed, stdout, stderr_tail: stderr.slice(-STDERR_TAIL_MAX), ...payload });
    };
    child.on('error', (error) => finish({ code: null, signal: null, spawn_failed: String(error?.message ?? error) }));
    child.on('close', (code, signal) => finish({ code, signal, spawn_failed: null }));
  });

  try {
    child.stdin.end(JSON.stringify(context));
  } catch { /* 同上：不吞真相，只是不让写 stdin 的失败盖过退出码 */ }

  return {
    done,
    kill() {
      killed = true;
      try { child.kill('SIGKILL'); } catch { /* 已退出 */ }
    },
  };
}

/**
 * 把子进程的退出形态翻译成 `{ outcome, reason, structured }`。
 * 纯函数，故「什么形态该记什么码」可以被逐档钉住，而不必真去杀一个进程。
 */
export function classifyStepOutcome(raw) {
  const failure = (reason, extra = {}) => ({
    outcome: 'failed',
    reason,
    structured: {
      exit_code: raw?.code ?? null,
      signal: raw?.signal ?? null,
      stderr_tail: raw?.stderr_tail ?? '',
      ...extra,
    },
  });

  if (raw?.killed === true) return failure('E_EXECUTOR_KILLED');
  // 起不来（ENOENT / EACCES …）与「起来了但非 0 退出」在结果侧是同一件事：这次没跑成。
  // 不为它单开一个码——新增码要走契约批次，而本卡禁改 contracts。
  if (raw?.spawn_failed) return failure('E_EXECUTOR_EXIT_NONZERO', { spawn_failed: raw.spawn_failed });
  if (raw?.code !== 0) return failure('E_EXECUTOR_EXIT_NONZERO');

  const text = String(raw?.stdout ?? '').trim();
  if (text === '') return { outcome: 'succeeded', reason: null, structured: {} };
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return failure('E_BAD_VALUE', { detail: 'stdout-not-json' });
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return failure('E_BAD_VALUE', { detail: 'stdout-not-object' });
  }
  return { outcome: 'succeeded', reason: null, structured: parsed };
}
