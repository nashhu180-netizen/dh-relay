<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-21 session=kpi-agg decision_mode=auto recipe=normal cards=AA_17 -->
# P3 AA_17 接力计划（CLI 全量 Parquet + MCP 接入）

> 落点：本计划、账本与 `config/`（roles.toml + dh-mapping.toml）都在 dh-relay 仓 `docs/relay/wf-analytics-platform/activity-analysis/aa17/`；施工对象是 wf-analytics-platform 仓（下文 `wf-analytics-platform:` 前缀为该仓相对路径）。所有 relay_log 调用 `--config-dir` 指向本目录 `config/`。
> 卡：[P3 §AA_17](wf-analytics-platform:poc_core_kpi_web/poc_core_kpi_web_v2/docs/modules/activity-analysis/dev_plan/P3-活动分析数据底座-开发方案.md)。**P3 卡文只写「档位：标准（生产接线，verify）」，没有 `dh:task-type` 标记**；本计划暂按 `recipe=normal` 起草，须用户确认（若按 AA_25 同类接线卡定 heavy，改 marker 与 R1 reviewer 行为四路后重 lint）。AA_02（轻档纯文档对照）与本卡 recipe 不同，不并入本计划，可在本计划 F1 后另开 `relay/aa02` light 计划。
> 工作区未建：W 阶段 builder 新建 `workspace/36-AA_17-cli-full-parquet-mcp/`（编号接 35）。基线 master `39a24a8fc`；worktree `.dh-worktrees/AA_17`（`wt/AA_17`），三软链同前。本机 `dh.role=worker`。
> 依赖状态：AA_10/12/13/21 代码均已在 master；端包 full 人验（HAA-07）受 AA_14 约束，不进本计划；实施不依赖 AA_16。
> decision_mode=auto：decider 只在 P3 卡文变更范围（cli registry + 命令实现、mcp_gateway tools、定向测试、工作区）内裁决；需要新 task_type、改 frontend、碰 test 的一律 escalate。

## 节点表

| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| W1 | AA_17 | AA_17:W#1 | build | agent:plan-reviewer | | builder 建七件套 + task_plan（B0 冻结 release/manifest 字段与精确允许路径 / B1 CLI 主导出六份 Parquet+manifest 原子写、非空目标拒写、失败不留半成品 / B2 CLI 单视图细分导出 / B3 MCP 全六视图与单视图读取、scope fail-closed、PAT 范围评估 / B4 CLI 与 MCP 同参一致性机器证 AAI-17/18 + 顺带修 AA_12 findings Q-1 记述）；plan-reviewer 按 normal 审 |
| C1 | AA_17 | AA_17:C#1 | construction | agent:checker | W1 | B0+B1：`cli/registry.yaml`、`cli/commands/activity_analysis.py` 主导出 + `tests/cli/` |
| C2 | AA_17 | AA_17:C#2 | construction | agent:checker | C1 | B2+B3：细分导出；`backend/mcp_gateway/tools/` 六视图/单视图工具 + `tests/test_mcp_*`；cli-self-check 通过 |
| C3 | AA_17 | AA_17:C#3 | construction | agent:checker | C2 | B4：同参一致性测试（stage/manifest_schema_version/data_release_id/available_views/threshold_version 与行值），V5/V6 形状对照补机器证 |
| R1 | AA_17 | AA_17:R#1 | review | agent:scribe | C3 | normal：requirement + lesson；scribe 跑 `dh activity-analysis` 体检、cli-self-check、定向测试后汇总 review.md |
| F1 | AA_17 | AA_17:F#1 | handoff | agent:scribe | R1 | 备料：as-built、AI 提交区、交付汇报、HAA-07 端包 full 人验步骤清单（交用户） |

## agent 表

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| builder | W1 | builder | roles.toml:builder | 36-AA_17 七件套 + task_plan.md | | 目标/非目标/验收照抄 P3 卡文；允许路径按卡文变更范围列精确文件 |
| plan-reviewer | W1 | plan-reviewer | roles.toml:plan-reviewer | 36-AA_17/review.plan.md | on:review_ready:builder | normal 全量审 |
| coder | C1 | coder | roles.toml:coder | CLI 主导出代码 + 测试 + findings/lesson 行 | | RED 先于实现 |
| checker | C1 | checker | roles.toml:checker | 36-AA_17/check.C1.md | | 核原子写/拒写/无半成品三条有测试 |
| scribe | C1 | scribe | roles.toml:scribe | 36-AA_17/progress.md | on:done:coder | |
| decider | C1 | decider | roles.toml:decider | 36-AA_17/decision.<d>.md | on:blocked | auto |
| coder | C2 | coder | roles.toml:coder | 细分导出 + MCP 工具 + 测试 | | |
| checker | C2 | checker | roles.toml:checker | 36-AA_17/check.C2.md | | 核 scope fail-closed、不传 Parquet 二进制 |
| scribe | C2 | scribe | roles.toml:scribe | 36-AA_17/progress.md | on:done:coder | |
| decider | C2 | decider | roles.toml:decider | 36-AA_17/decision.<d>.md | on:blocked | |
| coder | C3 | coder | roles.toml:coder | 一致性测试 + 形状对照证据 + findings 行 | | push origin wt/AA_17 |
| checker | C3 | checker | roles.toml:checker | 36-AA_17/check.C3.md | | |
| scribe | C3 | scribe | roles.toml:scribe | 36-AA_17/progress.md | on:done:coder | |
| decider | C3 | decider | roles.toml:decider | 36-AA_17/decision.<d>.md | on:blocked | |
| requirement | R1 | reviewer | roles.toml:reviewer | 36-AA_17/review.requirement.md | | 只读；对 AAI-17/18 与 NM-2.8 逐项核 |
| lesson | R1 | reviewer | roles.toml:reviewer | 36-AA_17/review.lesson.md | | 只读 |
| scribe | R1 | scribe | roles.toml:scribe | 36-AA_17/review.md + progress.md | | 全部 reviewer done 后由 monitor 拉起 |
| scribe | F1 | scribe | roles.toml:scribe | as-built、提交区、汇报、人验清单 | | 只备料 |

## 角色启动参数与公共约定

- 同 `docs/relay/wf-analytics-platform/task-runtime/p21-normal/relay_plan.md`（dh-relay 仓）。禁止：新装包、push GitLab、建 MR、合入、verify、deploy、碰 test/prod、改 frontend。
