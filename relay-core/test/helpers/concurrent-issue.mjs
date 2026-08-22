// 并发发号 helper（实施提示 4：并发用例是真并发，两个真实进程同时 start）。
// 用法：node concurrent-issue.mjs <repoRoot> <indexPath> <outPath>
// 结果写 outPath：{ ok, seq?, run_id?, error? } —— 由测试进程收集断言。

import { writeFile } from 'node:fs/promises';
import { createRunWithNumbering } from '../../runtime/startrun.mjs';

const [repoRoot, indexPath, outPath] = process.argv.slice(2);
const run = {
  protocol: 'relay.run/v2',
  run_id: 'placeholder',
  workflow_name: 'concurrent-issue',
  summary: 'concurrent numbering probe',
  trigger: 'system',
  trigger_by: null,
  created_at: new Date().toISOString(),
  labels: [],
  nodes: [{ node_id: 'node-a', title: 'A', required: true, executor_profiles: [{ kind: 'process', ref: 'worker.mjs' }] }],
};

try {
  const issued = await createRunWithNumbering({ repoRoot, slug: 'conc', run, indexPath });
  await writeFile(outPath, JSON.stringify({ ok: true, seq: issued.seq, run_id: issued.run_id }));
} catch (error) {
  await writeFile(outPath, JSON.stringify({ ok: false, error: error.message }));
}
