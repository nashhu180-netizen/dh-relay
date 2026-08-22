// detached 宿主的进程入口：startDetachedHost 以 `node host-main.mjs --root <p> --run-id <id>` 拉起。
// 退出码：0 优雅停机；3 写权被拒（E_LEASE_HELD 族）；2 用法错误；1 其它 fail-closed。
// 本文件不是 CLI 命令、不注册 bin——relay 命令名归 DHR_30（卡面硬边界 1）。

import { resolve } from 'node:path';
import { runHostSession } from './host.mjs';

function argValue(name, fallback = undefined) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : fallback;
}

const repoRoot = resolve(argValue('root', process.cwd()));
const runId = argValue('run-id');
if (!runId) {
  console.error('E_BAD_VALUE:run-id-required');
  process.exit(2);
}

runHostSession({ repoRoot, runId, trapSignals: true }).then(
  () => process.exit(0),
  (error) => {
    console.error(error?.message ?? String(error));
    process.exit(String(error?.message).startsWith('E_LEASE_HELD') ? 3 : 1);
  },
);
