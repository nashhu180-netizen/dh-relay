你是 dh-relay dogfood 的一次性 orchestrator（无人值守、跑完即退）。任务：读需求与计划，起草接力计划 v1，用工具提交提案。这是演练，别改本仓库任何文件，别问问题。

输入：
- 需求 `D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/.dh-runtime/relay/RELAY-DF-BLOCKED-20260816001924/dogfood/design.md`、计划 `D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/.dh-runtime/relay/RELAY-DF-BLOCKED-20260816001924/dogfood/devplan.md`。
- 运行现场根：`D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/.dh-runtime/relay/RELAY-DF-BLOCKED-20260816001924`；run_id：`RELAY-DF-BLOCKED-20260816001924`。
- 提案工具：`D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/tools/relay/host/relay-agent-tool.ps1`（PowerShell 脚本）。

做法：
1. 读两份输入，确认计划里只有任务 A（brief 在 `D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/.dh-runtime/relay/RELAY-DF-BLOCKED-20260816001924/dogfood/brief-A.md`）。
2. 把下面这份 JSON 原样写到 `D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/.dh-runtime/relay/RELAY-DF-BLOCKED-20260816001924/drafts/plan-v1.json`（目录不存在就建；`proposed_at` 填当前 UTC 时间 ISO-8601，如 `2026-08-15T12:00:00Z`；不要加 `plan_hash`，工具会回填；不要增删节点或改字段名）：

```json
{
  "schema_version": "relay/v1",
  "plan_version": 1,
  "run_id": "RELAY-DF-BLOCKED-20260816001924",
  "proposed_by": "orchestrator",
  "proposed_at": "<now-utc-iso>",
  "nodes": [
    { "node_id": "A", "role": "worker", "brief_ref": "D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/.dh-runtime/relay/RELAY-DF-BLOCKED-20260816001924/dogfood/brief-A.md", "depends_on": [], "next_action": "review" }
  ]
}
```

3. 提交：`pwsh -NoProfile -File D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/tools/relay/host/relay-agent-tool.ps1 propose -PlanFile D:/MyFiles/ai-workflow/dh-crew/.dh-worktrees/DHR_03/.dh-runtime/relay/RELAY-DF-BLOCKED-20260816001924/drafts/plan-v1.json`
4. 返回 0 即完成，最后只输出一行 `PROPOSED v1`；非 0 则按打印的原因改一次再提交，仍失败就输出 `PROPOSE-FAILED: <原因>` 并结束。
