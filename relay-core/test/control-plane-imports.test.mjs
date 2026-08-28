// control-plane-imports.test.mjs — design/07 §4 的 import 纪律钉子（R-J-01 采纳半条）。
//
// 合同原文：「service 是唯一导入 Store 与 runtime host 的**控制面进程**：CLI / DSH Bridge / Pi
// 都只发 RPC」。唯一写者的运行期仲裁是 lease fencing（writeGuard，失租写被拦，另有整套回归）；
// 本文件守的是静态半条——控制面代码（cli/**、adapters/**）不得 import Store 或宿主/发号直写
// 原语，rpc/** 作为传输层同样不碰。DHR_51 交付的 host-main / startrun 是宿主侧原语，不在
// 控制面，故不禁它们存在，只禁控制面引用它们。

import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

// 控制面与传输层禁引的模块（按路径片段匹配 import 说明符）：
// store/**（Store 本体）、host.mjs / host-main.mjs（宿主 session 与 detached 入口）、
// startrun.mjs（发号 + 建 Run 直写原语）。ledger.mjs 的 requestDigest 是纯函数，客户端
// 算幂等摘要合法，不在禁列。
const FORBIDDEN = ['store/', 'store.mjs', 'host.mjs', 'host-main.mjs', 'startrun.mjs'];
const CONTROL_PLANE_DIRS = ['cli', 'adapters/dsh-bridge', 'rpc'];

async function mjsFilesUnder(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await mjsFilesUnder(path));
    else if (entry.name.endsWith('.mjs')) out.push(path);
  }
  return out;
}

function importSpecifiers(source) {
  // 静态 import 与动态 import(...) 的字符串说明符都收；注释里的提及不算。
  const noComments = source.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const specs = [];
  for (const match of noComments.matchAll(/import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g)) specs.push(match[1]);
  for (const match of noComments.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) specs.push(match[1]);
  return specs;
}

test('控制面 import 纪律：cli/adapters/rpc 不引 Store 与宿主/发号直写原语（design/07 §4）', async () => {
  const violations = [];
  for (const dir of CONTROL_PLANE_DIRS) {
    for (const file of await mjsFilesUnder(join(ROOT, dir))) {
      const specs = importSpecifiers(await readFile(file, 'utf8'));
      for (const spec of specs) {
        if (FORBIDDEN.some(fragment => spec.includes(fragment))) {
          violations.push(`${file} -> ${spec}`);
        }
      }
    }
  }
  assert.deepEqual(violations, [], '控制面出现 Store/宿主直写 import 即违反 design/07 §4');
});

test('生产 runtime 无人引用 detached 宿主入口与发号原语——它们只由 lease fencing 仲裁的宿主侧使用', async () => {
  // host-main.mjs 是 detached 宿主进程入口（DHR_51「关窗不停工」交付物），createRunWithNumbering
  // 是发号原语；两者不许被**任何**生产代码当普通库函数调用——design/07 §3.3 明文「禁止 RPC
  // handler 或 CLI 直接调用旧 createRunWithNumbering」，service 无豁免（R-K-02 修正：原豁免口
  // 会让 service 新增调用时两钉仍绿）。service 自身也不 spawn detached host（它内嵌 actor）。
  // defaultIndexPath 是纯路径函数，引它合法；此钉只打 createRunWithNumbering/startDetachedHost
  // 与 host-main 的引用。
  const offenders = [];
  for (const dir of ['runtime', 'cli', 'adapters/dsh-bridge', 'rpc', 'store']) {
    for (const file of await mjsFilesUnder(join(ROOT, dir))) {
      const base = file.replace(/\\/g, '/').split('/').pop();
      if (['host-main.mjs', 'host.mjs', 'startrun.mjs'].includes(base)) continue; // 定义与宿主侧自身
      const source = await readFile(file, 'utf8');
      const specs = importSpecifiers(source);
      if (specs.some(spec => spec.includes('host-main'))) offenders.push(`${file} -> host-main`);
      const noComments = source.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
      if (/\bcreateRunWithNumbering\b/.test(noComments)) {
        offenders.push(`${file} -> createRunWithNumbering`);
      }
      if (/\bstartDetachedHost\b/.test(noComments)) offenders.push(`${file} -> startDetachedHost`);
    }
  }
  assert.deepEqual(offenders, [], '生产代码不得把宿主入口/发号原语当普通库函数调用');
});
