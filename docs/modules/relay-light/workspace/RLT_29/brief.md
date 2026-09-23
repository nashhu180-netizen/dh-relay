<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_29 single-task 单卡接力模式

## 覆盖任务与身份

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| RLT_29 | P1-RelayLight | DevPlan §3.2 `RLT_29`；design/01 §7.5、§11 A159～A168/H19 |

- GitHub Issue：#56；PR 关联使用 `Relates to #56`，在高危出口闸闭合前不自动关闭。
- 工作树：`/home/nash/work/dh-relay/.dh-worktrees/RLT_29`；分支：`wt/RLT_29`；基线：`master@93d65cb`；client=`devin-cli`。
- 档位：标准；高危：组件接线；`task_type=heavy`。
- D-start：用户 2026-09-22 整版确认并授权连续推进；E10 展示后的人验结论仍须用户查看证据后确认。

## 目标 (Outcome)

交付与完整 relay 并列、互斥的 `single-task` 模式：无 relay plan/log、无 W/C/R/X/F；一任务一 Herdr workspace、独立角色 tab/pane、monitor 对 repo 完全只读、orchestrator 按 durable 工件机械路由、plan/batch/final 两级复核与 heavy Recipe 完整闭合，且完整模式零回归。

## 完成条件

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| 1 | `single-task` 与完整 relay 并列且互斥，不创建/读写 `relay_plan.md`、`relay_log.jsonl`，不使用 W/C/R/X/F；完整模式模板与行为不回归。 | AI | RLT_29 / design/01 `HC-RL-A159` |
| 2 | 一任务一 Herdr workspace、每角色实例一独立具名 tab/pane；orchestrator 启动前展示全部拟启动角色/实例模型与推理档表并询问确认，未确认不得启动任何 agent；用户可逐角色修改，确认写入 `execution_strategy.md`，恢复沿用未变确认，新增/换角色或实例、模型/推理档需重问；真实询问→确认→Herdr tab/model 与快照一致；最大工具权限不扩张 Git/发布/verify/人验授权。 | AI | `HC-RL-A160` |
| 3 | 生命周期固定为 workspace/task_plan → plan review → 分批开发+batch review → 按 `task_type` 展开的 final review → 主会话人验；batch 与 final 是两道独立闸。 | AI | `HC-RL-A161` |
| 4 | plan/batch review 各最多整改 2 轮，FAIL 回同 builder/coder、原 reviewer 复审；workflow-final 每条适用 path 最多返工 2 轮且每轮 fresh reviewer；超限按合同分路。 | AI | `HC-RL-A162` |
| 5 | monitor 对 repo/workspace 完全只读，只在 Herdr wait/get/read 并 prompt 通知 orchestrator，通知不落盘；恢复依据 durable signals + review/decision + `execution_strategy.md` + Herdr 实态；`progress.md` 仅由当前 batch coder 写施工里程碑/证据引用。 | AI | `HC-RL-A163` |
| 6 | monitor 每 120 秒 wait/get，无变化静默；Enter 三条件同时成立才发送一次并复验，失败通知 orchestrator/换 fresh，禁止连按。 | AI | `HC-RL-A164` |
| 7 | single-task 标头字段合法且与完整 relay 标头互斥；产出型 builder/coder/reviewer/decider 在 DONE/BLOCKED 后即停。RELAY_RECEIPT 分流 fail closed：产出型角色只写精确 BLOCKED 后停；monitor 只用 Herdr prompt 非 durable 通知 orchestrator 后停，repo/workspace 零写入、不写 BLOCKED；均不清 RELAY_*。 | AI | `HC-RL-A165` |
| 8 | 全部适用 `task_type` Recipe path PASS 或可核查 N/A、最终无 open P0/P1；单一 final reviewer 不替代 Recipe。 | AI | `HC-RL-A166` |
| 9 | durable signal 与路由不依赖终端状态；orchestrator 只分发/路由，产出型 builder/coder/reviewer/decider 写信号后停止；monitor 只发非 durable Herdr prompt 通知。 | AI | `HC-RL-A167` |
| 10 | 仓内 skill 单源、双 adapter、安装副本一致性与 as-built 覆盖 single-task；`roles.toml` 不为凑改动写死模型。 | AI | `HC-RL-A168` |
| 11 | 用户查看含模型分配询问、确认及实际 Herdr tab/model 与快照一致链的真实 Herdr heavy single-task 自举证据，判断该模式是否清楚、可控、值得日常使用。 | 人 | `HC-RL-H19` |

## 两层 final 复核证据（P1 防歧义硬条）

1. **workflow-final review 层**：single-task 每条适用 path 的整改后复审必须换 **fresh reviewer**；最多返工 2 轮。不得用同 reviewer targeted recheck 充当此层证据。
2. **dev-harness E2 Recipe `code_review` 层**：本卡 marker 为 `mode=single-full-targeted`；完整 fresh 初审出现 open P0/P1 后，attempt 2 必须由**同一 `reviewer_session_id`**做 targeted recheck。
3. 两层分别登记 reviewer identity/session、输入差异、finding、结论。fresh 与 same-reviewer 条件相斥时默认不能合并为一条证据；施工者不得复核自己的施工。
4. `heavy` 五路——代码轮1、代码轮2、需求方向、一致性、教训——一条不少；batch PASS、单一 final reviewer 或 E2 targeted receipt 均不能替代整套 Recipe。

## 运行合同摘要

- single-task 路由只使用 `plan` / `plan-review` / `batch` / `batch-review` / `workflow-final` / `e2-code-review` / `decision` / `monitor` / `human-acceptance`；三批编号为 `batch=1/2/3`，审核文件为 `check.batch-<n>.md`。
- `review_round` 与 `remediation_count` 分开：初审 `review_round=1 remediation_count=0`；允许整改 1、2 两次。plan/batch 回同 builder/coder + 原 reviewer；workflow-final 每次整改复核换 fresh reviewer；E2 targeted 使用同一 reviewer session。
- monitor 对 repo/workspace 完全只读，不写 `progress.md`、`execution_strategy.md`、DONE/BLOCKED、轮询/通知日志或任何 workspace 文档。`execution_strategy.md` 由 orchestrator 在启动/更换角色时机械维护用户确认分配与实际启动配置；`progress.md` 仅由当前顺序执行的 batch coder 在自己 batch 追加一条施工里程碑/证据引用，不含 pane/agent 状态、轮询、通知或终端输出。reviewer/orchestrator 不写 progress。batch-3 coder 不写 workflow-final/E2/reviewer/monitor 产物。
- 恢复权威为实际 worker/reviewer/decider 自写的 durable signals、独立 review/decision 工件、`execution_strategy.md` 配置与 Herdr 实态；monitor prompt 通知和 `progress.md` 均不是运行真相。
- 旧 `DONE.plan-review.post-decision.md` PASS 已被本 user-adjust 规划变更取代；本调整经独立 plan-review PASS 前不放行施工。
- 产出型 builder/coder/reviewer/decider 首步检查 `RELAY_RECEIPT`：存在时只写本角色精确 `BLOCKED.*.md` 单行 signal，零其它业务写入、不清 `RELAY_*`，随后停止。monitor 同样首步检查，但命中时 repo/workspace 零写入，只用 Herdr prompt 非 durable 通知 orchestrator 并立即停止，不写 BLOCKED，不清 `RELAY_*`。
- DONE/BLOCKED 单行字段固定为 task、phase、agent、batch、path、review_round、remediation_count、verdict，以及 evidence；BLOCKED 另含 reason。精确文件名、sole writer 与接收者以 task_plan §4 为准，plan-review 使用不可覆盖的 `DONE.plan-review.round-<review_round>.md`；round-1 与唯一 round-2 历史例外按 task_plan §4 读取，round3 及未来所有 signal 强制新 schema。
- batch-1 写施工前 baseline；batch-3 用相同 cwd/命令比较。新增或变化失败、任一 RLT_29 failure、任一 open P0/P1 一律 BLOCKED；仅 failure IDs 与摘要完全匹配 baseline 的 inherited noise 可单列。

## 边界

- In scope：DevPlan 允许路径闭集；三批施工、结构测试、安装副本一致性、真实 Herdr 自举、as-built。
- Out of scope：`relay_log.py`、dev-harness、完整 relay 合同、旧卡解冻、部署/生产操作。
- 停止线：目标/验收/ID 变化；需改禁区；两层 final 证据不能分开取证；open P0/P1 超限；方向/范围/验收/数据语义/安全/生产影响需人裁决。

## 触及子系统

- relay-light skill 核心与 Claude/Codex adapter
- 仓根 worker 协议分流
- skill 安装一致性结构测试
- relay-light as-built
