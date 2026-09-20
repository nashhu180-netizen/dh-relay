<!-- dh:v1 -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_26 现役文档同步

## 覆盖任务
| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| RLT_26 | P1 | [DevPlan §3.2 RLT_26](../../dev_plan/P1-RelayLight-开发方案.md) |

## 目标 (Outcome)
把 resource_close 的现役文档与已冻结合同/已实现代码对齐，并清理获批的 F-010 残留。标准档、normal；不做核心实现。

- Issue: https://github.com/nashhu180-netizen/dh-relay/issues/50 （F-010 扩围评论 issuecomment-5747218816）。
- worktree: `D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/RLT_26`；branch: `wt/RLT_26`；client: `other`（Devin CLI）。
- 基线：master `9ca3eda8e743f356e8ef0dfb8351eaffaba315fb`，建树后快进纳入已推送的 B-08 规划提交 `660c9be8eff916cc2df1fff1f707d1dacafc4735`；无新增 merge commit。
- 用户 2026-09-20「确认」六项推荐方案，已授权本卡落户并由 Devin SWE-2 Max 施工；随后「做之前 代码先提交推送」要求先推送准备基线。施工者只负责本卡施工，不自核、不提交推送、不创建 PR、不合并、不 verify、不改用户级 skill 副本。

## Zero-context 自查
先读本文件、task_plan、findings、正式设计与 DevPlan 本卡即可施工；合同冲突只写 blocked 信号，不越权改合同。

## 完成条件（DevPlan 逐字副本）
| # | 条件 | 谁验（AI / 人） | 出处 |
|---|---|---|---|
| 1 | **机器证**｜来源：`design/01` §11 `HC-RL-A2`｜skill 三文件与 as-built 快照的事件词表 = 20 词全集、控制/agent 二分正确且含 `resource_close`；对现役口径文件的「19 词 / 19 个事件」类表述 grep 归零，时点记录类命中逐条登记豁免理由。 | AI | [DevPlan RLT_26](../../dev_plan/P1-RelayLight-开发方案.md#rlt_26--resource_close-现役文档同步与-19-词残留清理issue-50) |
| 2 | **机器证**｜来源：`design/01` §3.4 + `HC-RL-A155`｜`SKILL.md` 控制事件表含 `resource_close` 行：写入者归属按解码 `object_type`、note 四键闭集与逐键校验、允许在 `node_close`/`stage_close` 之后记账、不进状态机、不改变节点/阶段派生——逐点与 `relay_log.py` 实现一致。 | AI | [DevPlan RLT_26](../../dev_plan/P1-RelayLight-开发方案.md#rlt_26--resource_close-现役文档同步与-19-词残留清理issue-50) |
| 3 | **机器证**｜来源：`design/01` §11 `HC-RL-A156`｜文档写明 `outcome=failed` 必须有非空非纯空白 `reason`、`outcome=ok` 不得带 `reason` 的条件合同。 | AI | [DevPlan RLT_26](../../dev_plan/P1-RelayLight-开发方案.md#rlt_26--resource_close-现役文档同步与-19-词残留清理issue-50) |
| 4 | **机器证**｜来源：`design/01` §12 + `HC-RL-A157`｜两份 adapter 与 F 阶段收口纪律含关闭失败取证路径（写 `resource_close outcome=failed` → 按 `seq`/`object_id` 检索 → 处置记录落证据），与 RLT_24 实证口径一致。 | AI | [DevPlan RLT_26](../../dev_plan/P1-RelayLight-开发方案.md#rlt_26--resource_close-现役文档同步与-19-词残留清理issue-50) |
| 5 | **机器证**｜来源：`design/01` §11 `HC-RL-A158`｜as-built 快照注明向后兼容事实（`rlt12-win-01` 71 行字节不变、`lint` 退出 0、新旧实现稳定字段一致），不把历史兼容写成历史补记。 | AI | [DevPlan RLT_26](../../dev_plan/P1-RelayLight-开发方案.md#rlt_26--resource_close-现役文档同步与-19-词残留清理issue-50) |
| 6 | **机器证（2026-09-20 用户已批准并入）**｜来源：`design/01` `HC-RL-A144`～`A150` / `A137` + `workspace/RLT_22/findings.md` F-010｜同族「现役文档滞后于已实现合同」残留一并清零：`RLT_05-实现快照.md` 的 trigger 三态（补 `on:review_ready:` 四态与 A144~A147 语义）、§5「两套计数」（改三套）、`SKILL.md` L151「两套计数」残留、`SKILL.md` `stage_result` 行「在该实例全部节点 closed 之后」旧口径（对照 `HC-RL-A137` 的 `blocked/failed` 允许节点未关）。本卡来源已标注并入 RLT_22 F-010；用户同次授权给 Issue #50 补充范围备注。 | AI | [DevPlan RLT_26](../../dev_plan/P1-RelayLight-开发方案.md#rlt_26--resource_close-现役文档同步与-19-词残留清理issue-50) |
| 7 | **机器证**｜来源：Issue #50 验收第 3 条｜skill 文本结构检查覆盖新增纪律原文（沿用既有 `test_relay_log.py` / `test_install_skill.py` 的 skill 文本断言机制）；unittest 全绿、仓级 runner `RELAY ALL PASS`、`git diff --check` 干净、允许路径审计 diff 为空。 | AI | [DevPlan RLT_26](../../dev_plan/P1-RelayLight-开发方案.md#rlt_26--resource_close-现役文档同步与-19-词残留清理issue-50) |

## 边界 (Boundaries)
施工允许路径（比任务卡 skill/** 窄，按本次实际范围）：
- `tools/relay-light/skill/SKILL.md`
- `tools/relay-light/skill/references/adapter-claude-code.md`
- `tools/relay-light/skill/references/adapter-codex.md`
- `tools/relay-light/test_relay_log.py`
- `tools/relay-light/test_install_skill.py`（仅确有必要）
- `docs/modules/relay-light/as-built/RLT_05-实现快照.md`
- `docs/modules/relay-light/workspace/RLT_26/**`

禁止改 relay_log.py、AGENTS.md、TOML、正式 design、DevPlan、其他 workspace、真实 relay 账本、两份历史 as-built 时点记录、用户级副本。RLT_25 的 normal 三路配置对齐不在本卡。
若发现核心实现与正式设计不一致，或须改 wire format/新增 ID/扩允许路径：在 findings/progress 与 construction.DONE.md 写 blocked，然后停止，不问用户、不顺手修。

## 触及子系统
现役说明快照 `as-built/RLT_05-实现快照.md`；源代码无变更。
