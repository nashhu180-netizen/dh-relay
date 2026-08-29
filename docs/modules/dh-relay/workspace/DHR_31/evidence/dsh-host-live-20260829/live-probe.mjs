// live-probe.mjs — DHR_31 批 5·5.1 的验收探针：把树外 Host 的活数据仓接到本仓真实
// service 上，证明「五个方法返回的是活数据」，并与 CLI 的 Read Model 逐字对拍。
//
// 这个脚本自己**不受**插件包的安装拓扑契约约束（它不进 tarball），所以由它承担
// `connect` 的注入——这正是 F-019 留出来的那个空位在真实环境里的样子。

import { connectDshBridge } from 'file:///D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_31/relay-core/adapters/dsh-bridge/index.mjs'
import { LiveRelayPilotRepository } from 'file:///D:/MyFiles/ai-workflow/dh-relay-p4-pilot/relay-control-pilot/src/dsh-host/live-store.mjs'

const repoRoot = 'D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_31'

const repo = new LiveRelayPilotRepository({
  repoRoot,
  connect: connectDshBridge,
  refreshIntervalMs: 0, // 探针只拉一次，不留后台定时器
})

await repo.start()

const list = repo.listRuns()
const diagnostics = repo.diagnostics()
const hash = repo.fixtureHash()

console.log('# 五方法 · 活数据')
console.log(`fixtureHash(): ${hash}`)
console.log(`diagnostics(): ${JSON.stringify(diagnostics)}`)
console.log(`listRuns().schema_version: ${list.schema_version}`)
console.log(`listRuns().source_kind:    ${list.source_kind}`)
console.log(`listRuns().runs.length:    ${list.runs.length}`)
console.log('')
console.log('# 列表项（逐字）')
for (const run of list.runs) console.log(JSON.stringify(run))
console.log('')

const runId = list.runs.at(-1)?.run_id
console.log(`# getRun(${runId})`)
console.log(JSON.stringify(repo.getRun(runId), null, 1))
console.log('')
console.log('# getRun(不存在的 id) —— 契约要求返回 null')
console.log(JSON.stringify(repo.getRun('no-such-run')))
console.log('')
console.log('# snapshot() 顶层键')
console.log(JSON.stringify(Object.keys(repo.snapshot())))
console.log('')

// 关键断言：面板拿到的这些真值，必须与 CLI 看到的**同一状态**一致（design/06 H3）。
const bridge = await connectDshBridge({ repoRoot });
const cliDetail = (await bridge.inspect(runId)).detail;
const projected = repo.getRun(runId);
const checks = [
  ['run_id', projected.run_id === cliDetail.run_id],
  ['run_status', projected.run_status === cliDetail.run_status],
  ['updated_at', projected.updated_at === cliDetail.updated_at],
  ['nodes 条数', projected.nodes.length === cliDetail.node_states.length],
  ['每个节点 node_id/状态逐一相符', projected.nodes.every((n, i) =>
    n.node_id === cliDetail.node_states[i].node_id && n.node_status === cliDetail.node_states[i].status)],
  ['attentions 为空数组（P5 无 Attention）', Array.isArray(projected.attentions) && projected.attentions.length === 0],
  ['未编造 title', projected.nodes.every(n => !('title' in n))],
  ['未编造 role', projected.nodes.every(n => !('role' in n))],
  ['未编造 depends_on', projected.nodes.every(n => !('depends_on' in n))],
  ['未编造 workflow_name', !('workflow_name' in projected)],
];
console.log('# H3 同一状态对拍（左：Host 投影  右：Bridge Read Model）');
let bad = 0;
for (const [name, ok] of checks) {
  if (!ok) bad += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
}
bridge.close?.();
repo.close();
console.log('');
console.log(bad === 0 ? 'ALL PASS' : `${bad} FAILED`);
process.exit(bad === 0 ? 0 : 1);
