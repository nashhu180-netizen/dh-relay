<!-- dh:v1 · execution_strategy.md -->
# execution_strategy — RLT_29

## 写入与恢复合同

`single-task`：一任务一 Herdr workspace，每个角色实例一个独立具名 tab/pane。启动前由 orchestrator 展示全部拟启动角色/实例的模型与推理档表并询问明确确认；未确认不得启动任何 agent。恢复只沿用已明确确认且未变的配置；新增/换角色或实例、换模型或推理档须重问。

本文件只保存用户确认的模型分配与实际启动配置，由 orchestrator 在启动或更换角色时机械维护。monitor 对本文件及全部 repo/workspace 完全只读。恢复时，orchestrator 联合读取实际 worker/reviewer/decider 自写的 durable signals、独立 review/decision 工件、本配置与 Herdr 实态；`progress.md` 不是运行真相。

## 已确认模型与实际启动配置

| 角色 | 模型 | 推理档 | 实例 | tab/pane | 确认来源/时点及实际配置核对 | 状态 |
|---|---|---|---|---|---|---|
| orchestrator | 主会话既有实例（不在确认表） | — | 主会话 | w41:t1/p1 | 2026-09-22 用户明文“嗯 确认”模型分配表；Herdr 配置已核对 | confirmed-observed |
| monitor | Devin SWE-2 | medium | monitor#1 | w41:t3/p3 | 同上；Herdr 配置已核对 | confirmed-observed |
| builder | Codex GPT-5.6 Sol | medium | r29-builder（builder#1） | w41:t2/p2 | 同上；Herdr 配置已核对 | confirmed-observed |
| plan-reviewer | Codex GPT-5.6 Sol | medium | r29-plan-reviewer（#1/#2 复用同实例） | w41:t4/p4 | 同上；Herdr 配置已核对 | confirmed-observed |
| coder | Devin SWE-2 | Max | r29-b1-coder（batch-1） | w41:t6/p6 | 同上；Herdr 配置已核对；batch-1 reviewer PASS 后已单次 `/clear` 并复验为新 session（revision=5） | confirmed-observed-cleared |
| batch reviewer | Devin SWE-2 | Max | r29-b1-reviewer（batch-1） | w41:t7/p7 | 同上；Herdr 配置已核对；durable PASS 后已单次 `/clear` 并复验为新 session（revision=5） | confirmed-observed-cleared |
| coder | Devin SWE-2 | Max | r29-b2-coder（batch-2） | w41:t8/p8 | 同上 confirmed proposal；实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对；batch-2 reviewer PASS 后已单次 `/clear` 并复验为新 session（revision=5） | confirmed-observed-cleared |
| batch reviewer | Devin SWE-2 | Max | r29-b2-reviewer（batch-2） | w41:t9/p9 | 同上 confirmed proposal；实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对；durable PASS 后已单次 `/clear` 并复验为新 session（revision=5） | confirmed-observed-cleared |
| coder | Devin SWE-2 | Max | r29-b3-coder（batch-3） | w41:tA/pA | 同上 confirmed proposal；实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对；batch-3 reviewer PASS 后已单次 `/clear` 并复验为新 session（revision=5） | confirmed-observed-cleared |
| batch reviewer | Devin SWE-2 | Max | r29-b3-reviewer（batch-3） | w41:tB/pB | 同上 confirmed proposal；实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对；durable PASS 后已单次 `/clear` 并复验为新 session（revision=5） | confirmed-observed-cleared |
| workflow-final reviewer | Devin SWE-2 | Max | r29-wf-code1-r1（code-round1，review round 1） | w41:tC/pC | 用户已确认 workflow-final 每轮 fresh reviewer 使用 SWE-2 Max；2026-09-23 实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对 | confirmed-observed |
| workflow-final reviewer | Devin SWE-2 | Max | r29-wf-code2-r1（code-round2，review round 1） | w41:tD/pD | 同一已确认 fresh-reviewer 分配；2026-09-23 实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对 | confirmed-observed |
| workflow-final reviewer | Devin SWE-2 | Max | r29-wf-requirement-r1（requirement，review round 1） | w41:tE/pE | 同一已确认 fresh-reviewer 分配；2026-09-23 实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对 | confirmed-observed |
| workflow-final reviewer | Devin SWE-2 | Max | r29-wf-consistency-r1（consistency，review round 1） | w41:tF/pF | 同一已确认 fresh-reviewer 分配；2026-09-23 实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对 | confirmed-observed |
| workflow-final reviewer | Devin SWE-2 | Max | r29-wf-lesson-r1（lesson，review round 1） | w41:tG/pG | 同一已确认 fresh-reviewer 分配；2026-09-23 实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对 | confirmed-observed |
| workflow-final reviewer | Devin SWE-2 | Max | r29-wf-lesson-r2（lesson，review round 2，fresh remediation review） | w41:tH/pH | 同一已确认 fresh-reviewer 分配；2026-09-23 实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对；round-1 FAIL 后 lesson remediation=1 | confirmed-observed |
| workflow-final reviewer | Devin SWE-2 | Max | 每轮独立 fresh 实例 | 待 Herdr 返回 | 同上 confirmed proposal；未启动 | confirmed-pending |
| E2 code reviewer | Devin SWE-2 | Max | r29-e2-code-review-a1（full attempt 1；same-session targeted attempt 2 only if open P0/P1） | w41:tJ/pJ | 同上 confirmed proposal；2026-09-23 实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对；attempt 1 fresh | confirmed-observed |
| decider | Codex Astra | medium | r29-decider（decider#1） | w41:t5/p5 | 同上；Herdr 配置已核对（agent 报告 gpt-6-astra medium） | confirmed-observed |

`confirmed-pending` 只表示用户已确认拟用分配，不表示实例已启动或已观察。orchestrator 后续按角色/实例拆行维护实际启动配置，不得把某一角色的确认扩展到其它实例。

## 分工与写入边界

- orchestrator：维护本文件，分发、读取 durable signals/review/decision 并机械路由；不施工、不复核、不写 progress。
- monitor：对 repo/workspace 完全只读；只在 Herdr wait/get/read，状态变化即时 prompt orchestrator，不写任何 repo/workspace 文档或 signal。
- builder/coder：只写派单允许路径与自己的 durable signal；当前 batch coder 另在 `progress.md` 追加自己 batch 的一条施工里程碑/证据引用。
- reviewer/decider：只写各自合同指定的 review/decision 与 durable signal，不写 progress 或本文件。
- RELAY_RECEIPT preflight 按角色分流：产出型 builder/coder/reviewer/decider 命中时只写本角色精确 `BLOCKED.*.md` 后立即停止；monitor 命中时 repo/workspace 零写入，只用 Herdr prompt 非 durable 通知 orchestrator 后立即停止，不写 BLOCKED。两个分支均不清除 `RELAY_*`。产出型角色的信号文件名、单行 schema、sole writer 与接收者只认 task_plan §4。

## 授权

用户 2026-09-22 已授权设计/B/D/施工/复核与后续 commit/push/PR/CI/merge/verify/清理/Issue close；但 E10 展示后的人验结论仍须用户确认。本 builder 不执行版本或远端动作。最大工具权限不扩大任何授权。
