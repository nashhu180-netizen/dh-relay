<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-21 session=kpi-agg decision_mode=consult recipe=heavy cards=PLD_20,PLD_07,PLD_02 -->
# P1 B1/B3b 三卡接力计划（PLD_20 → PLD_07 → PLD_02）

> 落点：本计划、账本与 `config/`（roles.toml + dh-mapping.toml）都在 dh-relay 仓 `docs/relay/wf-analytics-platform/payment-ltv/p1-b1/`；施工对象是 wf-analytics-platform 仓（下文 `wf-analytics-platform:` 前缀为该仓相对路径）。所有 relay_log 调用 `--config-dir` 指向本目录 `config/`。
> 卡：[P1 §PLD_20](wf-analytics-platform:poc_core_kpi_web/poc_core_kpi_web_v2/docs/modules/payment-ltv/dev_plan/P1-付费与LTV开发方案.md)、[§PLD_07](wf-analytics-platform:poc_core_kpi_web/poc_core_kpi_web_v2/docs/modules/payment-ltv/dev_plan/P1-付费与LTV开发方案.md)、[§PLD_02](wf-analytics-platform:poc_core_kpi_web/poc_core_kpi_web_v2/docs/modules/payment-ltv/dev_plan/P1-付费与LTV开发方案.md)，三卡均 heavy。三卡工作区 `workspace/PLD_20/`、`workspace/PLD_07/`、`workspace/PLD_02/` 均未建立，W 阶段由 builder 新建七件套与分批 task_plan。
> 基线：master `39a24a8fc`。worktree：`.dh-worktrees/PLD_20`（`wt/PLD_20`）、`.dh-worktrees/PLD_07`（`wt/PLD_07`）；`.dh-worktrees/PLD_02` 已存在但基于 521cb0eef（落后 80 提交、零改动），开工前由主控删除重建到 39a24a8fc。三树各补 `.venv`、`frontend/node_modules`、`backend/data/datasets` 软链。本机 `dh.role=worker`。
> **三条硬闸（计划不替代）**：①三卡 P1 允许路径目前只登记了工作区与 P1 文档本身，代码接入路径「开工时另行登记」——W 阶段 builder 在 task_plan 列出精确代码路径并直接 B-adjust 写进 P1 该卡 `dh:allowed-paths` 块（用户 2026-09-21 裁决：路径登记不需逐次确认），plan-reviewer 审登记是否越出卡文「变更范围」（越出为 P1）；C 阶段开工前置 = 登记已落且 plan-reviewer PASS；②PLD_20 的不良人来源字段「开工核实」与 PLD_07 的存储格式（Parquet 候选）属用户裁决，decision_mode=consult；③真实数数取数与 test canonical build 只在 integrator 机，本计划 C 阶段只做本地代码、契约测试与样本 Parquet 上的验证，真实取数由主控另派 ssh integrator 只读探针后把样本落到 worktree（不含凭据）。
> 前置状态：PLD_01 只差 verify（PLD_02、PLD_07 的形式依赖）；PLD_09 报告待用户裁决（不阻塞本计划三卡）。

## 节点表

| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| W1 | PLD_20 | PLD_20:W#1 | build | agent:plan-reviewer | | builder 建 workspace/PLD_20 七件套 + 分批 task_plan（B0 冻结来源字段与拟登记代码路径 / B1 role_base 13 列 schema 与契约测试 / B2 backfill 与已发布分区迁移逻辑 / B3 不良人两项目接入 / B4 样本对数）；plan-reviewer 按 heavy 审 |
| C1 | PLD_20 | PLD_20:C#1 | construction | agent:checker | W1 | B0+B1：冻结项落 decision、role_base 13 列 store/schema + `test_role_base_*` 契约测试 RED→GREEN；开工前置：P1 允许路径已 B-adjust 登记 |
| C2 | PLD_20 | PLD_20:C#2 | construction | agent:checker | C1 | B2+B3：backfill/分区迁移逻辑（AA_25 首创口径重建与 13 列补齐合并为一次受控迁移，本地样本上验证）+ 不良人两项目 SQL 段 |
| C3 | PLD_20 | PLD_20:C#3 | construction | agent:checker | C2 | B4：主控提供的样本 Parquet 上三方对数、cross-month 保护测试；test 分区实操不进本计划 |
| R1 | PLD_20 | PLD_20:R#1 | review | agent:scribe | C3 | heavy：code-round2 + requirement + lesson + consistency 并行；scribe 跑 `dh payment-ltv` 体检与四道闸后汇总 |
| F1 | PLD_20 | PLD_20:F#1 | handoff | agent:scribe | R1 | 备料：as-built、AI 提交区、交付汇报、test 迁移逐项授权清单（交用户） |
| W2 | PLD_07 | PLD_07:W#1 | build | agent:plan-reviewer | F1 | builder 建 workspace/PLD_07 七件套 + task_plan（B0 存储格式/覆盖元数据冻结与拟登记路径 / B1 store / B2 service+覆盖元数据 / B3 CLI pull/build/导出 / B4 样本验证） |
| C4 | PLD_07 | PLD_07:C#1 | construction | agent:checker | W2 | B0+B1：`account_daily_fact_store.py` + 契约测试；调用 PLD_05 定稿 SQL 不改口径 |
| C5 | PLD_07 | PLD_07:C#2 | construction | agent:checker | C4 | B2+B3：service、覆盖元数据、`cli/commands/base_data.py` 与 `cli/registry.yaml` 扩展、`app_config.yaml` 登记（宪章 #8） |
| C6 | PLD_07 | PLD_07:C#3 | construction | agent:checker | C5 | B4：样本 Parquet 上 pull/build 端到端与对数 |
| R2 | PLD_07 | PLD_07:R#1 | review | agent:scribe | C6 | heavy 四路 + scribe 体检汇总 |
| F2 | PLD_07 | PLD_07:F#1 | handoff | agent:scribe | R2 | 备料同 F1 |
| W3 | PLD_02 | PLD_02:W#1 | build | agent:plan-reviewer | F2 | builder 建 workspace/PLD_02 七件套 + task_plan（B0 任务类型/队列画像冻结与拟登记路径 / B1 `account_register_tasks.py` 日常+手动+历史补跑 / B2 接 task_template_registry、scheduler、任务日志 / B3 契约与调度回归） |
| C7 | PLD_02 | PLD_02:C#1 | construction | agent:checker | W3 | B0+B1；开工前置：PLD_01 verify 已落或用户明确豁免形式依赖 |
| C8 | PLD_02 | PLD_02:C#2 | construction | agent:checker | C7 | B2+B3：先过《队列路由与并发接入手册》闸，再接 background_sync 画像与调度模板 |
| R3 | PLD_02 | PLD_02:R#1 | review | agent:scribe | C8 | heavy 四路 + scribe 体检汇总 |
| F3 | PLD_02 | PLD_02:F#1 | handoff | agent:scribe | R3 | 备料同 F1；另列 test 调度启用步骤交用户 |

## agent 表

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| builder | W1 | builder | roles.toml:builder | workspace/PLD_20 七件套 + task_plan.md + P1 PLD_20 allowed-paths 登记 | | 目标/边界照抄 P1 卡文；代码路径写进 P1 allowed-paths 块 |
| plan-reviewer | W1 | plan-reviewer | roles.toml:plan-reviewer | workspace/PLD_20/review.plan.md | on:review_ready:builder | heavy 全量审；登记路径越出 P1 卡文变更范围为 P1 |
| coder | C1 | coder | roles.toml:coder | schema/store 代码 + 契约测试 + findings/lesson 行 | | RED 先于实现；只 stage 已登记路径 |
| checker | C1 | checker | roles.toml:checker | workspace/PLD_20/check.C1.md | | 核登记已落、RED/GREEN 真实、无口径漂移 |
| scribe | C1 | scribe | roles.toml:scribe | workspace/PLD_20/progress.md | on:done:coder | |
| decider | C1 | decider | roles.toml:decider | workspace/PLD_20/decision.<d>.md | on:blocked | consult：产出方案后等 user_decision |
| coder | C2 | coder | roles.toml:coder | backfill/迁移逻辑 + 不良人 SQL 段 + 测试 | | |
| checker | C2 | checker | roles.toml:checker | workspace/PLD_20/check.C2.md | | 核一次受控迁移语义、分区冻结/跨月保护 |
| scribe | C2 | scribe | roles.toml:scribe | workspace/PLD_20/progress.md | on:done:coder | |
| decider | C2 | decider | roles.toml:decider | workspace/PLD_20/decision.<d>.md | on:blocked | |
| coder | C3 | coder | roles.toml:coder | 对数脚本与结果 + findings/lesson 行 | | push origin wt/PLD_20 |
| checker | C3 | checker | roles.toml:checker | workspace/PLD_20/check.C3.md | | |
| scribe | C3 | scribe | roles.toml:scribe | workspace/PLD_20/progress.md | on:done:coder | |
| decider | C3 | decider | roles.toml:decider | workspace/PLD_20/decision.<d>.md | on:blocked | |
| code-round2 | R1 | reviewer | roles.toml:reviewer | workspace/PLD_20/review.code-round2.md | | 只读；换人代码轮 2 |
| requirement | R1 | reviewer | roles.toml:reviewer | workspace/PLD_20/review.requirement.md | | 只读；对 P1 PLD_20 验收点逐项核 |
| lesson | R1 | reviewer | roles.toml:reviewer | workspace/PLD_20/review.lesson.md | | 只读 |
| consistency | R1 | reviewer | roles.toml:reviewer | workspace/PLD_20/review.consistency.md | | 只读；核 base-data/tables/role_base.md 与 AA_25 口径一致 |
| scribe | R1 | scribe | roles.toml:scribe | workspace/PLD_20/review.md + progress.md | | 全部 reviewer done 后由 monitor 拉起 |
| scribe | F1 | scribe | roles.toml:scribe | as-built、提交区、汇报、test 授权清单 | | 只备料 |
| builder | W2 | builder | roles.toml:builder | workspace/PLD_07 七件套 + task_plan.md + P1 PLD_07 allowed-paths 登记 | | 代码路径写进 P1 allowed-paths 块 |
| plan-reviewer | W2 | plan-reviewer | roles.toml:plan-reviewer | workspace/PLD_07/review.plan.md | on:review_ready:builder | heavy |
| coder | C4 | coder | roles.toml:coder | store + 契约测试 | | |
| checker | C4 | checker | roles.toml:checker | workspace/PLD_07/check.C4.md | | |
| scribe | C4 | scribe | roles.toml:scribe | workspace/PLD_07/progress.md | on:done:coder | |
| decider | C4 | decider | roles.toml:decider | workspace/PLD_07/decision.<d>.md | on:blocked | |
| coder | C5 | coder | roles.toml:coder | service/CLI/app_config 登记 + 测试 | | |
| checker | C5 | checker | roles.toml:checker | workspace/PLD_07/check.C5.md | | 核宪章 #8 登记与 registry 一致 |
| scribe | C5 | scribe | roles.toml:scribe | workspace/PLD_07/progress.md | on:done:coder | |
| decider | C5 | decider | roles.toml:decider | workspace/PLD_07/decision.<d>.md | on:blocked | |
| coder | C6 | coder | roles.toml:coder | 端到端样本验证 + findings/lesson 行 | | push origin wt/PLD_07 |
| checker | C6 | checker | roles.toml:checker | workspace/PLD_07/check.C6.md | | |
| scribe | C6 | scribe | roles.toml:scribe | workspace/PLD_07/progress.md | on:done:coder | |
| decider | C6 | decider | roles.toml:decider | workspace/PLD_07/decision.<d>.md | on:blocked | |
| code-round2 | R2 | reviewer | roles.toml:reviewer | workspace/PLD_07/review.code-round2.md | | 只读 |
| requirement | R2 | reviewer | roles.toml:reviewer | workspace/PLD_07/review.requirement.md | | 只读 |
| lesson | R2 | reviewer | roles.toml:reviewer | workspace/PLD_07/review.lesson.md | | 只读 |
| consistency | R2 | reviewer | roles.toml:reviewer | workspace/PLD_07/review.consistency.md | | 只读 |
| scribe | R2 | scribe | roles.toml:scribe | workspace/PLD_07/review.md + progress.md | | 全部 reviewer done 后由 monitor 拉起 |
| scribe | F2 | scribe | roles.toml:scribe | as-built、提交区、汇报 | | 只备料 |
| builder | W3 | builder | roles.toml:builder | workspace/PLD_02 七件套 + task_plan.md + P1 PLD_02 allowed-paths 登记 | | 代码路径写进 P1 allowed-paths 块 |
| plan-reviewer | W3 | plan-reviewer | roles.toml:plan-reviewer | workspace/PLD_02/review.plan.md | on:review_ready:builder | heavy |
| coder | C7 | coder | roles.toml:coder | worker 任务 + 测试 | | |
| checker | C7 | checker | roles.toml:checker | workspace/PLD_02/check.C7.md | | 核 PLD_01 verify 前置或豁免记录 |
| scribe | C7 | scribe | roles.toml:scribe | workspace/PLD_02/progress.md | on:done:coder | |
| decider | C7 | decider | roles.toml:decider | workspace/PLD_02/decision.<d>.md | on:blocked | |
| coder | C8 | coder | roles.toml:coder | 调度/模板/日志接线 + 回归 | | push origin wt/PLD_02 |
| checker | C8 | checker | roles.toml:checker | workspace/PLD_02/check.C8.md | | 核队列手册闸已过 |
| scribe | C8 | scribe | roles.toml:scribe | workspace/PLD_02/progress.md | on:done:coder | |
| decider | C8 | decider | roles.toml:decider | workspace/PLD_02/decision.<d>.md | on:blocked | |
| code-round2 | R3 | reviewer | roles.toml:reviewer | workspace/PLD_02/review.code-round2.md | | 只读 |
| requirement | R3 | reviewer | roles.toml:reviewer | workspace/PLD_02/review.requirement.md | | 只读 |
| lesson | R3 | reviewer | roles.toml:reviewer | workspace/PLD_02/review.lesson.md | | 只读 |
| consistency | R3 | reviewer | roles.toml:reviewer | workspace/PLD_02/review.consistency.md | | 只读 |
| scribe | R3 | scribe | roles.toml:scribe | workspace/PLD_02/review.md + progress.md | | 全部 reviewer done 后由 monitor 拉起 |
| scribe | F3 | scribe | roles.toml:scribe | as-built、提交区、汇报、test 启用步骤 | | 只备料 |

## 角色启动参数

- 同 `docs/relay/wf-analytics-platform/task-runtime/p21-normal/relay_plan.md`（dh-relay 仓）「角色启动参数」；heavy 卡 code-round2 与首轮 coder 换模型（roles.toml:reviewer 按档位）。

## 公共施工约定

1. 每批开工核 dh.role / 分支 / 净树 / 基线含 39a24a8fc；`$PY`=主仓 v2 `.venv/bin/python`。
2. 真实数数取数不在 worker 机做；样本 Parquet 由主控落到 worktree `backend/data/datasets/` 软链目录之外的 `workspace/<card>/samples/`（`.git/info/exclude` 忽略），不含凭据。
3. 禁止：新装包、push GitLab、建 MR、合入、verify、deploy、碰 test/prod、删 worktree、写 `.env`、改未登记路径。
