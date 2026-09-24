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
| builder | Claude Opus 5.5 | medium | rlt18-builder（builder#1） | w4B:t3 / w4B:p2 | 2026-09-23 确认；实际 argv=`claude --model claude-opus-5-5 --effort medium --dangerously-skip-permissions`（gate 前已启动，切换后 `/clear` 再派）；plan 阶段 DONE.builder.md 已交；plan-review round 3 PASS 后于 batch 全部 PASS 时关闭 tab | confirmed-observed-closed |
| plan-reviewer | Claude Opus 5.5 | medium | rlt18-plan-reviewer（plan-reviewer#1） | w4B:t4 / w4B:p4 | 2026-09-23 确认；实际 argv=`claude --model claude-opus-5-5 --effort medium --dangerously-skip-permissions`，Herdr 配置已核对；plan 阶段结束，batch 全部 PASS 时关闭 tab | confirmed-observed-closed |
| batch reviewer | Devin SWE-2 | Max | 每批一个 | 待 Herdr 返回 | 2026-09-23 用户修改为 SWE-2 Max；未启动 | confirmed-pending |
| batch reviewer | Devin SWE-2 | Max | rlt18-b1-reviewer（batch-reviewer#b1） | w4B:t7 / w4B:p7 | 同上确认；实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对；DONE.batch-1.coder（`4b4b95c`）后派审；durable PASS 后单次 `/clear` 并复验为新 session（revision=5），随后关闭 tab | confirmed-observed-cleared-closed |
| batch reviewer | Devin SWE-2 | Max | rlt18-b2-reviewer（batch-reviewer#b2） | w4B:t9 / w4B:p9 | 同上确认；实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对；DONE.batch-2.coder（`0f9686f`）后派审；durable PASS 后单次 `/clear` 并复验为新 session（revision=5），随后关闭 tab | confirmed-observed-cleared-closed |
| batch reviewer | Devin SWE-2 | Max | rlt18-b3-reviewer（batch-reviewer#b3） | w4B:tK / w4B:pK | 同上确认；实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对；DONE.batch-3.coder（`fe1cf00`）后派审；durable PASS 后单次 `/clear` 并复验为新 session（revision=5），随后关闭 tab | confirmed-observed-cleared-closed |
| coder | Devin SWE-2 | Max | 每批一个 | 待 Herdr 返回 | 2026-09-23 确认；未启动 | confirmed-pending |
| coder | Devin SWE-2 | Max | rlt18-b1-coder（coder#b1，batch 1） | w4B:t6 / w4B:p6 | 同上确认；实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对；plan-review round 3 PASS（`57656bc`）后派 batch 1；batch-1 reviewer round 2 PASS（`d0a8196`）后单次 `/clear` 并复验为新 session（revision=5），随后关闭 tab | confirmed-observed-cleared-closed |
| coder | Devin SWE-2 | Max | rlt18-b2-coder（coder#b2，batch 2） | w4B:t8 / w4B:p8 | 同上确认；实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对；batch 1 清理闸完成后派 batch 2；batch-2 reviewer PASS（`777d2e2`）后单次 `/clear` 并复验为新 session（revision=5），随后关闭 tab | confirmed-observed-cleared-closed |
| coder | Devin SWE-2 | Max | rlt18-b3-coder（coder#b3，batch 3 实测批） | w4B:tA / w4B:pA | 同上确认；实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对；探针模型闸通过（`624685a`）后派 batch 3；batch-3 reviewer round 2 PASS（`b6dd1bc`）后单次 `/clear` 并复验为新 session（revision=5），随后关闭 tab | confirmed-observed-cleared-closed |
| probe（batch 3 实测） | Claude Sonnet 5 | low | rlt18-probe-lead-claude（扮 stage-lead，H11 Claude 侧 / H12） | 由 batch-3 coder 按实测特别授权拉起 | 2026-09-24 用户 AskUserQuestion 点选「按表确认」；指定 argv=`claude --model claude-sonnet-5 --effort low --dangerously-skip-permissions` ；batch 3 由 coder#b3 按该 argv 拉起、实测后关闭（batch-3 reviewer 核验零残留） | confirmed-observed-closed |
| probe（batch 3 实测） | GPT-5.6 Sol | low | rlt18-probe-lead-codex（扮 stage-lead，H11 Codex 侧） | 同上 | 同上；指定 argv=`codex -m gpt-5.6-sol -c model_reasoning_effort=low --dangerously-bypass-approvals-and-sandbox` ；batch 3 由 coder#b3 按该 argv 拉起、实测后关闭（batch-3 reviewer 核验零残留） | confirmed-observed-closed |
| probe（batch 3 实测） | Devin SWE-2 | medium | rlt18-probe-worker（扮在场 worker） | 同上 | 同上；指定 argv=`devin --model swe-2-medium --permission-mode dangerous` ；batch 3 由 coder#b3 按该 argv 拉起、实测后关闭（batch-3 reviewer 核验零残留） | confirmed-observed-closed |
| probe（batch 3 实测） | Claude Sonnet 5 | low | rlt18-probe-orch（扮编排，H12-②） | 同上 | 同上；指定 argv=`claude --model claude-sonnet-5 --effort low --dangerously-skip-permissions` ；batch 3 由 coder#b3 按该 argv 拉起、实测后关闭（batch-3 reviewer 核验零残留） | confirmed-observed-closed |
| decider | Claude Fable 5.1 | medium | rlt18-decider（decider#1） | w4B:t5 / w4B:p5 | 2026-09-23 确认；实际 argv=`claude --model claude-fable-5-1 --effort medium --dangerously-skip-permissions`，Herdr 配置已核对；因 BLOCKED.builder.plan-remediation-1（F-007）拉起 | confirmed-observed |
| workflow-final reviewer | Devin SWE-2 | Max | 每路每轮 fresh | 待 Herdr 返回 | 2026-09-23 确认；未启动 | confirmed-pending |
| workflow-final reviewer | Devin SWE-2 | Max | rlt18-wf-code1-r1（code-round1，review round 1，fresh） | w4B:tM / w4B:pM | 同上确认；实际 argv=`devin --model swe-2-max --permission-mode dangerous`，Herdr 配置已核对；三批全部 PASS 后派 | confirmed-observed |
| E2 code reviewer | Devin SWE-2 | Max | attempt 1 fresh | 待 Herdr 返回 | 2026-09-23 确认；未启动 | confirmed-pending |

权限：用户指示全部最大（claude `--dangerously-skip-permissions`、devin `--permission-mode dangerous`）。最大工具权限不扩张 commit/push/PR/merge/verify/人验授权。

## batch 3 fixture 路径豁免（plan-review round 1 P2-3 条件，orchestrator 登记）

single-task「不创建/读写 relay_plan.md / relay_log.jsonl」的路径审计，对且仅对 glob `docs/modules/relay-light/workspace/RLT_18/evidence/batch-3/fixture/**` 例外：那是被测对象 watch 的输入 fixture（完整 relay 最小计划 + 账本），不是本卡运行账本；不含凭据，须过完整 lint。2026-09-24 orchestrator 登记。

## 授权

用户 2026-09-23：D-start（豁免 RLT_13/RLT_17 前置）；GitHub 链点选 创建 Issue、commit + push、创建 PR、服务端合并。未授权：verify 代签、人判（H11/H12）、用户级 skill 副本同步（收口时展示目标另行确认）。
