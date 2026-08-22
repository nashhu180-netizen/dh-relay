// start 前置闸（P5-M8a · DHR_28 F-009）：Run Store 根 <repo>/.dh-relay/ 必须被业务仓忽略，
// 缺失 → start fail-closed（E_GITIGNORE_MISSING，协议码 reason-codes §二）。
// 判定必须按 Git 的忽略语义（git check-ignore），不得字面量匹配单一模式——
// 本仓用的是任意深度 `.dh-relay/`，字面量找 `/.dh-relay/` 会假阴性拒启动（F-009 反例）。
// Relay 不得自行修改业务仓 .gitignore——这里只读判定。

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function assertStoreRootIgnored({ repoRoot, gitBin = 'git' }) {
  let failure;
  try {
    await execFileAsync(gitBin, ['-C', repoRoot, 'check-ignore', '-q', '--', '.dh-relay/probe'], { windowsHide: true });
    return; // exit 0 = 被忽略
  } catch (error) {
    failure = error;
  }
  const code = typeof failure.code === 'number' ? failure.code : Number.NaN;
  if (code === 1) throw new Error('E_GITIGNORE_MISSING'); // check-ignore: 未被忽略
  // git 不存在 / 不是 git 仓 / 其它错误：一律 fail-closed，绝不降级放行。
  throw new Error(`E_GITCHECK_FAILED:${Number.isNaN(code) ? String(failure.code ?? 'spawn') : code}`);
}
