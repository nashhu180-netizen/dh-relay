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

## 2026-09-29 用户修订与收口授权（当前）

- 用户先确认「不作为默认流程」，再要求「现在的协议 做下修改下 不要求开独立的文档agent。现在也没有用这个呀」。协议默认由原责任方写文档，不要求独立 document 实例或 SYNCED；仅在用户明确指定试验时启用可选代笔。
- 用户随后授权「改完后 更新下 master 同步到两个设备多个agent的skill里面」，并明确「任务也关闭」。本轮覆盖 PR #87 更新、必要复核/CI、GitHub master 合入及复验、ThinkPad/ThinkBook 多 agent skill 同步和任务/Issue #86 关闭；上述最新授权取代旧的“未安装/不自动安装/保留现场”停止边界。
- 本轮过程文档由 Codex 主会话直接维护，不启用独立文档 agent。既有独立 reviewer 只做本次增量复核并自行写结论，不走 document 转录链。
- 结案口径为「试跑完成，用户决定不默认采用」。原减负收益未证实，DA-08 不标减负验收通过；未覆盖的协议场景与 F-C1 原有非阻断项保留，不把关闭任务解释为全能力验收通过。
- 本轮交付状态：协议已修订；19 项安装/结构测试与 skill 校验通过；增量独立复核、最新 CI、远端合入和双设备同步尚待实际完成。最终证据统一归本目录收口记录。
