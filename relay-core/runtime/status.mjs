// 只读宿主三态读数（P5-M3 的观察手段；B7 三态半条）。
//
// 形态边界（卡面硬边界 1/2/3 + 实施提示 3）：
//   - 不叫 `relay status`、不注册 bin：用法 = `node relay-core/runtime/status.mjs <run_id> [--root <repoRoot>]`。
//   - 三态来源 = PID/lease 文件（lease.mjs inspectHost）；账面读数来自 Store 已落盘的
//     state.json / events.jsonl——只渲染 Store 产出，不从事件自行推导状态（§2.3 架构约束）。
//   - 不定义新协议对象、不动 relay.host-observation/v1（那是 Executor 观测，形状不对且未冻结）。
// 输出恒为一份 JSON 文档；run 不存在 → stderr E_RUN_NOT_FOUND、exit 2。

import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { runRootOf } from './host.mjs';
import { inspectHost } from './lease.mjs';

export async function readHostStatus({ repoRoot, runId, clock = () => Date.now() }) {
  const runRoot = runRootOf({ repoRoot, runId });
  let runJson;
  try {
    runJson = JSON.parse(await readFile(join(runRoot, 'run.json'), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error('E_RUN_NOT_FOUND');
    throw new Error(`E_STORE_CORRUPT:run-json:${error.code ?? 'unreadable'}`);
  }
  const host = await inspectHost({ runRoot, clock });

  // state.json 是纯派生缓存（as-built §3.5）：只读来展示；读不到不拦三态判定。
  let ledger = null;
  try {
    const state = JSON.parse(await readFile(join(runRoot, 'state.json'), 'utf8'));
    ledger = {
      run_status: state.run_status,
      group: state.group,
      progress: state.progress,
      updated_at: state.updated_at,
      state_signature: state.state_signature,
    };
  } catch {
    ledger = null;
  }
  let events = null;
  try {
    const text = await readFile(join(runRoot, 'events.jsonl'), 'utf8');
    events = text.endsWith('\n') || text.length === 0 ? text.split('\n').filter(Boolean).length : text.split('\n').length;
  } catch {
    events = null;
  }

  return { run_id: runId, workflow_name: runJson.workflow_name ?? null, host: host.state, host_detail: host.detail, ledger, events };
}

async function main(argv) {
  let root = process.cwd();
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--root') {
      root = argv[index + 1];
      index += 1;
    } else {
      positional.push(argv[index]);
    }
  }
  const [runId] = positional;
  if (!runId) {
    console.error('usage: node relay-core/runtime/status.mjs <run_id> [--root <repoRoot>]');
    process.exit(2);
  }
  try {
    const report = await readHostStatus({ repoRoot: root, runId });
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error?.message ?? String(error));
    process.exit(String(error?.message).startsWith('E_RUN_NOT_FOUND') ? 2 : 1);
  }
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) await main(process.argv.slice(2));
