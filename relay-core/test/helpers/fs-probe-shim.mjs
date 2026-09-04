// fs-probe-shim.mjs — DHR_74 诊断探针 shim（测试侧，非生产代码）。
// 经 loader hook（fs-probe-hooks.mjs）替换所有 ESM 对 'node:fs/promises' 的导入：
// 被列名的 op 走计时包装，其余原样透传（export * 冲突名自动让位于本地导出）。
// 纯观测：不改任何 fs 行为；日志打印时内建 UUID 脱敏（F-7106 口径）。
import * as real from 'node:fs/promises';
import { createHash } from 'node:crypto';

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const idTags = new Map();

export function redactId(text) {
  return String(text).replace(UUID_RE, (match) => {
    let tag = idTags.get(match);
    if (!tag) {
      tag = `~${createHash('sha256').update(match.toLowerCase()).digest('hex').slice(0, 12)}`;
      idTags.set(match, tag);
    }
    return tag;
  });
}

export const probeState = {
  calls: {},
  slowCount: 0,
  maxElapsedMs: 0,
  pending: new Map(),
  nextId: 1,
};

export function emit(line) {
  try {
    const stamp = new Date().toISOString().slice(11, 23);
    process.stderr.write(`[fs-probe ${stamp}] ${redactId(line)}\n`);
  } catch { /* 诊断探针自身的问题不回灌测试 */ }
}

function describeArgs(args) {
  const first = args.find((value) => typeof value === 'string' || (value && typeof value.toString === 'function' && !(value instanceof Uint8Array) && !(value instanceof ArrayBuffer)));
  return first === undefined ? '' : String(first);
}

function timed(op, fn) {
  return async function fsProbeTimed(...args) {
    const id = probeState.nextId++;
    const entry = { op, path: describeArgs(args), start: performance.now() };
    probeState.pending.set(id, entry);
    probeState.calls[op] = (probeState.calls[op] ?? 0) + 1;
    try {
      const result = await fn(...args);
      settle(id, entry, null);
      return result;
    } catch (error) {
      settle(id, entry, error);
      throw error;
    }
  };
}

function settle(id, entry, error) {
  probeState.pending.delete(id);
  const elapsed = performance.now() - entry.start;
  if (elapsed > probeState.maxElapsedMs) probeState.maxElapsedMs = elapsed;
  if (elapsed > 1000) {
    probeState.slowCount++;
    emit(`SLOW-RESOLVE op=${entry.op} elapsed=${Math.round(elapsed)}ms path=${entry.path}${error ? ` err=${error?.code ?? error?.name}` : ''}`);
  }
}

export function summarizeAtExit() {
  const pendingLines = [];
  const now = performance.now();
  for (const entry of probeState.pending.values()) {
    pendingLines.push(`EXIT-PENDING op=${entry.op} elapsed=${Math.round(now - entry.start)}ms path=${entry.path}`);
  }
  for (const line of pendingLines) emit(line);
  emit(`EXIT-SUMMARY calls=${JSON.stringify(probeState.calls)} slow=${probeState.slowCount} max_elapsed=${Math.round(probeState.maxElapsedMs)}ms pending=${probeState.pending.size}`);
}

const wrapped = {
  rename: timed('rename', real.rename),
  writeFile: timed('writeFile', real.writeFile),
  appendFile: timed('appendFile', real.appendFile),
  readFile: timed('readFile', real.readFile),
  open: timed('open', real.open),
  mkdir: timed('mkdir', real.mkdir),
  mkdtemp: timed('mkdtemp', real.mkdtemp),
  rm: timed('rm', real.rm),
  unlink: timed('unlink', real.unlink),
  readdir: timed('readdir', real.readdir),
  stat: timed('stat', real.stat),
  lstat: timed('lstat', real.lstat),
  cp: timed('cp', real.cp),
  chmod: timed('chmod', real.chmod),
  utimes: timed('utimes', real.utimes),
  copyFile: timed('copyFile', real.copyFile),
};

export const rename = wrapped.rename;
export const writeFile = wrapped.writeFile;
export const appendFile = wrapped.appendFile;
export const readFile = wrapped.readFile;
export const open = wrapped.open;
export const mkdir = wrapped.mkdir;
export const mkdtemp = wrapped.mkdtemp;
export const rm = wrapped.rm;
export const unlink = wrapped.unlink;
export const readdir = wrapped.readdir;
export const stat = wrapped.stat;
export const lstat = wrapped.lstat;
export const cp = wrapped.cp;
export const chmod = wrapped.chmod;
export const utimes = wrapped.utimes;
export const copyFile = wrapped.copyFile;

export * from 'node:fs/promises';
