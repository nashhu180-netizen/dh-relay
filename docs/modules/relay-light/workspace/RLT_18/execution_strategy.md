<!-- dh:v1 · execution_strategy.md -->
# execution_strategy — RLT_18

## 写入与恢复合同

`single-task`：一任务一 Herdr workspace（`w4B`），每个角色实例一个独立具名 tab。启动前 orchestrator 展示全部拟启动角色/实例的模型与推理档表并询问明确确认；未确认不得启动任何 agent。新增/换角色或实例、换模型或推理档须重问。

本文件仅 orchestrator 维护，其余角色与 monitor 只读。恢复权威：worker/reviewer/decider 自写 durable signals、独立 review/decision 工件、本文件、Herdr 实态；`progress.md` 与 monitor 通知都不是运行真相。

## 模式切换记录（失序补录）

2026-09-23 用户先给出六角色分工，orchestrator 按完整模式手动派活写了 W/C 风格派单并**在未走 model-allocation gate 的情况下**拉起 `rlt18-monitor`（Devin SWE-2 medium）与 `rlt18-builder`（Claude Opus 5.5 medium）。随后用户指示「这个任务走简单版的 relay-lite」→ 切到 `single-task`：builder 被 Escape 中断（未写任何文件），旧派单删除重写，补走 model-allocation gate。monitor 在 gate 前已启动、只读运行，gate 确认后按新 `monitor.md` 重新派单。

## 已确认模型与实际启动配置

确认来源：2026-09-23 用户在 AskUserQuestion 中确认 orchestrator 提案表，并修改「batch reviewer 用 Devin SWE-2 Max」。

| 角色 | 模型 | 推理档 | 实例 | tab/pane | 确认来源 / 实际配置核对 | 状态 |
|---|---|---|---|---|---|---|
| orchestrator | 主会话（不在确认表） | — | rlt18-orch | w4B:t1 / w4B:p1 | — | observed |
| monitor | Devin SWE-2 | medium | rlt18-monitor（monitor#1） | w4B:t2 / w4B:p3 | 2026-09-23 确认；实际 argv=`devin --model swe-2-medium --permission-mode dangerous`（gate 前已启动，见上节） | confirmed-observed |
| builder | Claude Opus 5.5 | medium | rlt18-builder（builder#1） | w4B:t3 / w4B:p2 | 2026-09-23 确认；实际 argv=`claude --model claude-opus-5-5 --effort medium --dangerously-skip-permissions`（gate 前已启动，切换后 `/clear` 再派）；plan 阶段 DONE.builder.md 已交 | confirmed-observed |
| plan-reviewer | Claude Opus 5.5 | medium | rlt18-plan-reviewer（plan-reviewer#1） | w4B:t4 / w4B:p4 | 2026-09-23 确认；实际 argv=`claude --model claude-opus-5-5 --effort medium --dangerously-skip-permissions`，Herdr 配置已核对 | confirmed-observed |
| batch reviewer | Devin SWE-2 | Max | 每批一个 | 待 Herdr 返回 | 2026-09-23 用户修改为 SWE-2 Max；未启动 | confirmed-pending |
| coder | Devin SWE-2 | Max | 每批一个 | 待 Herdr 返回 | 2026-09-23 确认；未启动 | confirmed-pending |
| decider | Claude Fable 5.1 | medium | decider#1（按需） | 待 Herdr 返回 | 2026-09-23 确认；未启动 | confirmed-pending |
| workflow-final reviewer | Devin SWE-2 | Max | 每路每轮 fresh | 待 Herdr 返回 | 2026-09-23 确认；未启动 | confirmed-pending |
| E2 code reviewer | Devin SWE-2 | Max | attempt 1 fresh | 待 Herdr 返回 | 2026-09-23 确认；未启动 | confirmed-pending |

权限：用户指示全部最大（claude `--dangerously-skip-permissions`、devin `--permission-mode dangerous`）。最大工具权限不扩张 commit/push/PR/merge/verify/人验授权。

## 授权

用户 2026-09-23：D-start（豁免 RLT_13/RLT_17 前置）；GitHub 链点选 创建 Issue、commit + push、创建 PR、服务端合并。未授权：verify 代签、人判（H11/H12）、用户级 skill 副本同步（收口时展示目标另行确认）。
