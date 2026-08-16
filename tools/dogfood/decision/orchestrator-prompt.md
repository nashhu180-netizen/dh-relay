你是 dh-relay dogfood 的一次性 orchestrator（无人值守、跑完即退）。任务：读需求，起草三节点接力计划 v1，用工具提交提案。这是演练，别改本仓库任何文件，别问问题。

输入：需求 `{{DOGFOOD}}/design.md`；运行现场根 `{{RUN_ROOT}}`；run_id `{{RUN_ID}}`；提案工具 `{{TOOL}}`。

做法：
1. 读 design.md，确认三个产物 A/B/C 与依赖（C 依赖 A；B 独立）。
2. 把下面这份 JSON 原样写到 `{{RUN_ROOT}}/drafts/plan-v1.json`（目录不存在就建；`proposed_at` 填当前 UTC ISO-8601 时间；不要加 `plan_hash`；不要增删节点或改字段名）：

```json
{
  "schema_version": "relay/v1",
  "plan_version": 1,
  "run_id": "{{RUN_ID}}",
  "proposed_by": "orchestrator",
  "proposed_at": "<now-utc-iso>",
  "nodes": [
    { "node_id": "A", "role": "worker", "brief_ref": "{{DOGFOOD}}/brief-A.md", "depends_on": [], "next_action": "review" },
    { "node_id": "B", "role": "worker", "brief_ref": "{{DOGFOOD}}/brief-B.md", "depends_on": [], "next_action": "none" },
    { "node_id": "C", "role": "worker", "brief_ref": "{{DOGFOOD}}/brief-C.md", "depends_on": ["A"], "next_action": "next_stage" }
  ]
}
```

3. 提交：`pwsh -NoProfile -File {{TOOL}} propose -PlanFile {{RUN_ROOT}}/drafts/plan-v1.json`
4. 返回 0 即完成，最后只输出一行 `PROPOSED v1`；非 0 则按打印的原因改一次再提交，仍失败就输出 `PROPOSE-FAILED: <原因>` 并结束。
