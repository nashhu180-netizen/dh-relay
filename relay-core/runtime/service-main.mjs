// service-main.mjs — Runtime service 的进程入口。launcher 只 spawn 它，不与它做 IPC：
// 就绪信号是「确定性 endpoint 连得上 + `state=ready` 的 descriptor 通过身份回证」。
//
// 输给别的候选（E_ENDPOINT_IN_USE）是**正常结局**，不是错误：本仓已经有唯一 service 了，
// 这正是我们想要的结果，安静退出即可——报错会让并发 launcher 误以为启动失败。

import { resolve } from 'node:path';

import { startRuntimeService } from './service.mjs';

function argOf(name, fallback) {
  const index = process.argv.indexOf(name);
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const repoRoot = resolve(argOf('--root', process.cwd()));

// 用户私有目录的落点默认走 `~/.dh-relay/`；这两个环境变量只是把落点挪个地方，
// 不改变任何语义。它们让**真实进程**的回归可以不碰使用者的 home——
// 「测试永不触真 home」是 startrun.mjs 起就立的纪律，进程化之后同样要成立。
const credentialRoot = process.env.DH_RELAY_CREDENTIAL_ROOT || undefined;
const indexPath = process.env.DH_RELAY_INDEX_PATH || undefined;

let service;
try {
  service = await startRuntimeService({ repoRoot, credentialRoot, ...(indexPath ? { indexPath } : {}) });
} catch (error) {
  if (error?.reason === 'E_ENDPOINT_IN_USE') process.exit(0);
  process.exitCode = 1;
  throw error;
}

const shutdown = async () => {
  try { await service.close(); } finally { process.exit(0); }
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
