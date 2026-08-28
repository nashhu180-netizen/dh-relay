// DHR_30 Runtime service 的稳定本地端点与项目 descriptor。
// endpoint 只由 canonical repo root 推导，客户端不会信任 descriptor 里的任意地址。

import { createHash, randomUUID } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

/**
 * design/08 §2 的唯一 canonical repo identity。
 *
 * 为什么不能只 `resolve()`：endpoint 由 canonical root 的 SHA-256 导出，而「成功 bind 该
 * endpoint 是唯一服务的 fencing」（design/07 §3）。同一个仓只要有两种写法能算出两个 hash，
 * 两个 launcher 就会各自 bind 一个端点、各自当自己是唯一 service——fencing 名存实亡。
 *
 * · 两个平台都先解析符号链接（未落盘的路径退回解析后的绝对路径，用于纯计算场景）；
 * · Windows 文件系统不区分大小写，故折叠大小写；`resolve()` 已把正斜杠转成反斜杠，
 *   UNC 的 `\\server\share` 前缀原样保留——服务器/共享名是路径身份的一部分，不是可省前缀；
 * · Linux 用 realpath，不折叠大小写（路径大小写敏感）。
 */
export function canonicalRepoRoot(repoRoot) {
  if (typeof repoRoot !== 'string' || repoRoot.length === 0) throw new Error('E_BAD_VALUE:repo-root-required');
  const absolute = resolve(repoRoot);
  let resolved = absolute;
  try {
    resolved = realpathSync(absolute);
  } catch { /* 未落盘的路径按解析后的绝对路径处理：hash 仍确定，只是不穿透 symlink */ }
  // resolve() 已去掉多余分隔符与 `.`/`..`；只剩「非根路径的尾部分隔符」需要削平。
  const trimmed = resolved.length > 3 ? resolved.replace(/[\\/]+$/, '') : resolved;
  return process.platform === 'win32' ? trimmed.toLowerCase() : trimmed;
}

export function repoHash(repoRoot) {
  return createHash('sha256').update(canonicalRepoRoot(repoRoot), 'utf8').digest('hex');
}

export function endpointForRepo(repoRoot, { runtimeRoot = join(homedir(), '.dh-relay', 'runtime') } = {}) {
  const hash = repoHash(repoRoot);
  if (process.platform === 'win32') return { kind: 'pipe', address: `\\\\.\\pipe\\dh-relay-${hash}` };
  return { kind: 'unix', address: join(runtimeRoot || tmpdir(), `${hash}.sock`) };
}

/**
 * descriptor 落点用 `resolve()` 而非 canonical root：canonical root 是**身份口径**
 * （要折叠大小写才能保证 hash 唯一），不是给文件系统用的路径。拿折叠过的路径去写文件
 * 会让仓内出现与真实目录不同大小写的写法。
 */
export function descriptorPath(repoRoot) {
  return join(resolve(repoRoot), '.dh-relay', 'runtime.json');
}

export async function readDescriptor(repoRoot) {
  try {
    return JSON.parse(await readFile(descriptorPath(repoRoot), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw new Error(`E_STORE_CORRUPT:runtime-descriptor:${error?.code ?? 'unreadable'}`);
  }
}

export async function writeDescriptor(repoRoot, descriptor) {
  const path = descriptorPath(repoRoot);
  await mkdir(join(path, '..'), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(descriptor, null, 2)}\n`, 'utf8');
  await rename(temporary, path);
}
