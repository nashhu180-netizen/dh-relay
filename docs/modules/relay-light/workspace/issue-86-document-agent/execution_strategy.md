<!-- dh:v1 · execution_strategy.md -->
# execution_strategy — Issue #86

> sole writer 例外：本文件按合同应由 orchestrator 维护；本卡用户明确将全部过程文档委托文档 agent，故由 builder#docs 代笔登记。模型/角色分配决定仍归用户与主会话，本文件只转录已确认事实，不代替确认。

## 会话与终端实态（实时核验 ID）

- session：`kpi-agg`；当前任务 space：dh-relay `w4K`。
- 编排/主会话（Codex，实施+协调）：`w4K:p1`。
- 文档 agent `builder#docs`（本会话）：tab `w4K:t2`，pane `w4K:p2`，Herdr name `rlt86-docs`。
- 迁移说明：本会话原登记 `w4S:t1`/`w4S:p1`、环境继承的 `w3H`/`w4S` 均已过期——用户 2026-09-28 指示「放当前space，不开新space」，会话原地迁入 w4K，旧 w4S 已自动关闭；不据此旧值操作、不清环境。

## 模型分配（用户 2026-09-28 本轮确认）

| 角色 / 实例 | 模型 | 状态 |
|---|---|---|
| 编排 + skill 实施（主会话 w4K:p1） | Codex 主会话；模型档由用户/主会话掌握，本表不猜不记 | active |
| builder#docs（文档 agent，w4K:t2/p2，Herdr `rlt86-docs`） | Devin SWE-2 high（native swe-2-high） | active（收口回填棒） |
| plan-reviewer（w4K:t4/p4，Herdr `rlt86-plan-review`） | swe-2-high（argv 核验） | 已完成（round-1 PASS） |
| batch-reviewer（w4K:t5/p5，Herdr `rlt86-batch-review`） | swe-2-high（argv 核验） | 已完成（round-1 PASS） |
| workflow-final 教训 reviewer（w4K:t7/p7，Herdr `rlt86-final-lesson`） | swe-2-high | 已完成（round-1 PASS，转录确认核毕） |
| workflow-final 一致性 reviewer（w4K:t6/p6，Herdr `rlt86-final-consistency`） | swe-2-high | 已完成（round-1 PASS，转录确认核毕） |
| watcher（phase=watcher，w4K:t3/p3，Herdr `rlt86-watch`） | swe-2-high（argv 核验） | active |

- 全部复核会话已完成：plan-review、batch-review、workflow-final（教训+一致性两路径）均经原 reviewer 转录确认 PASS；watcher 常驻至收口。
- 已确认的同分工实例复用/交接不重复索权；新增分工、变更模型或推理档才按 model-allocation gate 再经用户确认。

## 运行方式

- 单卡接力，无 relay_plan/relay_log 账本，无 stage-lead；orchestrator=主会话派活位，watcher 只观察报信。
- 一批：plan → plan-review → batch=1（主会话施工+验证）→ batch-review → workflow-final（light：教训+一致性）→ 收口回填。
- 写者分工例外（本卡用户指定）：产品内容主会话写；过程工件文档 agent 写；durable signal、原始日志、结构化复核结论各生产者自写。
- RELAY_RECEIPT fail-closed 分流按 SKILL/AGENTS 现役合同执行，任何分支不清 `RELAY_*` 环境变量。

## 收尾铁律

- 远端 commit/push/PR/merge 由主会话按 AGENTS 单卡授权核对执行；文档 agent 不做远端操作，只按实际结果回填。
- PR 关联 `Relates to #86`（高危/需人验项未闭合不关闭 Issue；DA-08 类用户判断未取得前不代签）。
- 必需 CI：relay-tests-pwsh Windows/Ubuntu、relay-light-python 全 SUCCESS；relay-core 按 workflow continue-on-error 仅观测。
