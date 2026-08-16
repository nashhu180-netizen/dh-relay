你是 dh-relay dogfood 的一次性 replanner（无人值守、跑完即退）。节点 A 报了 dependency_blocked，你要读它的交接，补上缺的节点，把 A 排到后面续跑。这是演练，别改本仓库任何文件，别问问题。

输入：
- A 的交接：`D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/.dh-runtime/relay/RELAY-DF-BLOCKED-20260816001924/attempts/A/1/handoff.md`（先读它，确认缺的是 work/B.txt）。
- 需求/计划：`D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/.dh-runtime/relay/RELAY-DF-BLOCKED-20260816001924/dogfood/design.md`、`D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/.dh-runtime/relay/RELAY-DF-BLOCKED-20260816001924/dogfood/devplan.md`。
- 当前生效计划：`D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/.dh-runtime/relay/RELAY-DF-BLOCKED-20260816001924/active-plan.json`（只读，看 plan_version=1、节点 A 的 brief_ref/next_action，v2 里 A 这三样必须原样保留）。
- run_id：`RELAY-DF-BLOCKED-20260816001924`；提案工具：`D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/tools/relay/host/relay-agent-tool.ps1`。

做法：
1. 把下面这份 JSON 写到 `D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/.dh-runtime/relay/RELAY-DF-BLOCKED-20260816001924/drafts/plan-v2.json`（`proposed_at` 填当前 UTC ISO 时间；不要加 `plan_hash`；A 的 `brief_ref`/`role`/`next_action` 必须与 active-plan.json 里 A 的完全相同；`resume_from` 指 A 的 attempt 1）：

```json
{
  "schema_version": "relay/v1",
  "plan_version": 2,
  "run_id": "RELAY-DF-BLOCKED-20260816001924",
  "proposed_by": "replanner",
  "proposed_at": "<now-utc-iso>",
  "nodes": [
    { "node_id": "B", "role": "worker", "brief_ref": "D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/.dh-runtime/relay/RELAY-DF-BLOCKED-20260816001924/dogfood/brief-B.md", "depends_on": [], "next_action": "none" },
    { "node_id": "A", "role": "worker", "brief_ref": "D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/.dh-runtime/relay/RELAY-DF-BLOCKED-20260816001924/dogfood/brief-A.md", "depends_on": ["B"], "next_action": "review", "resume_from": { "node_id": "A", "attempt_id": 1 } }
  ]
}
```

2. 提交：`pwsh -NoProfile -File D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/tools/relay/host/relay-agent-tool.ps1 propose -PlanFile D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/.dh-runtime/relay/RELAY-DF-BLOCKED-20260816001924/drafts/plan-v2.json`
3. 返回 0 即完成，最后只输出一行 `PROPOSED v2`；非 0 则按打印的原因改一次再提交，仍失败就输出 `PROPOSE-FAILED: <原因>` 并结束。
