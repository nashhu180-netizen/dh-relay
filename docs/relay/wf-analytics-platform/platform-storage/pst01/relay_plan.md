<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-21 session=kpi-agg decision_mode=consult recipe=normal cards=PST_01 -->
# P1 PST_01 接力计划（源对象、时间与实际阻塞预检）

> 落点：本计划、账本与 `config/`（roles.toml + dh-mapping.toml）都在 dh-relay 仓 `docs/relay/wf-analytics-platform/platform-storage/pst01/`；施工对象是 wf-analytics-platform 仓（下文 `wf-analytics-platform:` 前缀为该仓相对路径）。所有 relay_log 调用 `--config-dir` 指向本目录 `config/`。
> 卡：[P1 §PST_01](wf-analytics-platform:poc_core_kpi_web/poc_core_kpi_web_v2/docs/modules/platform-storage/dev_plan/P1-迁移到PostgreSQL-开发方案.md)（normal）；工作区 `workspace/01-PST_01-source-preflight/` 已建七件套与批次 0～4 + 收口的 task_plan，W 阶段只核对基线与冻结批次 0 环境项。PST_02/PST_03 为 heavy，且开工闸取决于本卡产出的故障阻塞表与用户排除裁决，另开 `relay/pst02-03` heavy 计划。
> 基线 master `39a24a8fc`；worktree `.dh-worktrees/PST_01`（`wt/PST_01`），三软链同前；PST_REPO=该树绝对路径，PST_PY=主仓 v2 `.venv/bin/python`（[Linux 执行约定](wf-analytics-platform:poc_core_kpi_web/poc_core_kpi_web_v2/docs/modules/platform-storage/workspace/README.md)）。本机 `dh.role=worker`。
> decision_mode=consult：本卡是迁移的事实基础，未知数据处置、脏数据责任方、混源时间归类不可区分项全部交用户；decider 只出方案。
> **批次 4 前置**：合法 SQLite 源快照（test 的 app.db 副本）只能由用户提供，落到 worktree 外目录并以绝对路径传给 `--source`；快照未到时 C4 不开工，监工写 stage_result outcome=blocked 交主控。C1～C3 不需要快照，可夜间跑。

## 节点表

| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| W1 | PST_01 | PST_01:W#1 | build | agent:plan-reviewer | | builder 核对 01 工作区对 master 39a24a8fc 成立，批次 0 环境项（PST_REPO/PST_PY、测试隔离入口）写成可执行清单；plan-reviewer 按 normal 审 |
| C1 | PST_01 | PST_01:C#1 | construction | agent:checker | W1 | 批次 0+1：环境确认、只读预检命令骨架与完整模型发现（53 表 + agent_bind_codes + 模型外对象）；只读链不启动 lifespan/PAT/observer |
| C2 | PST_01 | PST_01:C#2 | construction | agent:checker | C1 | 批次 2：十项预检与类型反例（Boolean 默认、NULL/JSON null、混源时间归属、最大字段、pending 对象、F3 规模） |
| C3 | PST_01 | PST_01:C#3 | construction | agent:checker | C2 | 批次 3：故障前置逐项表（有证/无证、责任卡）与全写入者清单（PST-A06 准备） |
| C4 | PST_01 | PST_01:C#4 | construction | agent:checker | C3 | 批次 4：合法副本实测，`--source <副本> --output <独立目录>`，报告绑定副本来源与代码 SHA；前置：用户已提供快照 |
| R1 | PST_01 | PST_01:R#1 | review | agent:scribe | C4 | normal：requirement + lesson；scribe 跑 `dh platform-storage` 体检与 pytest 后汇总 review.md |
| F1 | PST_01 | PST_01:F#1 | handoff | agent:scribe | R1 | 备料：evidence/source-inventory.md 交接、AI 提交区、交付汇报、PST_02 开工闸清单（待修故障 / 待用户排除项） |

## agent 表

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| builder | W1 | builder | roles.toml:builder | 01-PST_01 七件套核对 + task_plan 批次 0 清单 | | 不改目标/验收 |
| plan-reviewer | W1 | plan-reviewer | roles.toml:plan-reviewer | 01-PST_01/review.plan.md | on:review_ready:builder | normal 全量审；测试隔离须在应用导入前生效为 P1 |
| coder | C1 | coder | roles.toml:coder | 预检脚本骨架 + 模型发现 + `tests/test_platform_storage_preflight.py` + findings 行 | | 只读源；新文件路径按 task_plan |
| checker | C1 | checker | roles.toml:checker | 01-PST_01/check.C1.md | | 核只读链无隐式写（PAT 续期/lifespan） |
| scribe | C1 | scribe | roles.toml:scribe | 01-PST_01/progress.md | on:done:coder | |
| decider | C1 | decider | roles.toml:decider | 01-PST_01/decision.<d>.md | on:blocked | consult |
| coder | C2 | coder | roles.toml:coder | 十项预检实现 + 反例测试 | | |
| checker | C2 | checker | roles.toml:checker | 01-PST_01/check.C2.md | | 核十项逐项有结果、不可区分项标阻断而非猜 |
| scribe | C2 | scribe | roles.toml:scribe | 01-PST_01/progress.md | on:done:coder | |
| decider | C2 | decider | roles.toml:decider | 01-PST_01/decision.<d>.md | on:blocked | |
| coder | C3 | coder | roles.toml:coder | 故障前置表 + 写入者清单 + findings 行 | | |
| checker | C3 | checker | roles.toml:checker | 01-PST_01/check.C3.md | | 核每项有行键/责任方 |
| scribe | C3 | scribe | roles.toml:scribe | 01-PST_01/progress.md | on:done:coder | |
| decider | C3 | decider | roles.toml:decider | 01-PST_01/decision.<d>.md | on:blocked | |
| coder | C4 | coder | roles.toml:coder | 副本实测报告 evidence/source-inventory.md + findings 行 | | push origin wt/PST_01；报告不含凭据与快照内容 |
| checker | C4 | checker | roles.toml:checker | 01-PST_01/check.C4.md | | 核报告绑定副本来源与 SHA |
| scribe | C4 | scribe | roles.toml:scribe | 01-PST_01/progress.md | on:done:coder | |
| decider | C4 | decider | roles.toml:decider | 01-PST_01/decision.<d>.md | on:blocked | |
| requirement | R1 | reviewer | roles.toml:reviewer | 01-PST_01/review.requirement.md | | 只读；对 PST-A01/A06 与 AC1/AC2 逐项核 |
| lesson | R1 | reviewer | roles.toml:reviewer | 01-PST_01/review.lesson.md | | 只读 |
| scribe | R1 | scribe | roles.toml:scribe | 01-PST_01/review.md + progress.md | | 全部 reviewer done 后由 monitor 拉起 |
| scribe | F1 | scribe | roles.toml:scribe | 交接、提交区、汇报、PST_02 开工闸清单 | | 只备料 |

## 角色启动参数与公共约定

- 同 `docs/relay/wf-analytics-platform/task-runtime/p21-normal/relay_plan.md`（dh-relay 仓）。禁止：新装包（含 psycopg / Alembic，本卡不需要）、push GitLab、建 MR、合入、verify、碰 test/prod、写源数据、把快照或凭据写进任何工件。
