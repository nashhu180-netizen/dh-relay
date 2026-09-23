# model-allocation 实态核对 — RLT_29 batch-3

- 记录时间：2026-09-23（batch-3 coder 施工期间实测）
- 确认来源：用户在 2026-09-22 对话中明确确认全角色实例模型/推理档分配；orchestrator 已按合同机械写入 `execution_strategy.md`（本文件不改写它，只核对实态）。
- 观察手段：`herdr workspace list` / `herdr tab list --workspace w41` / `herdr agent list` / `herdr pane process-info --pane w41:pN`，原始输出见同目录 `herdr/`。

## 拓扑事实（实观测）

- 一任务一 workspace：`herdr workspace list` 中 RLT_29 全部角色实例均在 `w41`（label `dh-relay`，tab_count=11，pane_count=11）。无第二个本任务 workspace。
- 每角色实例一个独立具名 tab/pane：`herdr tab list` / `agent list` 实态 11 个 tab 各 1 pane，label 与角色实例一一对应（下表）。
- 无 `relay_plan.md` / `relay_log.jsonl`：workspace 内 `find` 无任何 plan/log（见 `post/B-05.txt` 对应扫描）。
- monitor repo/workspace 零写：本批期间 monitor（`r29-monitor`，w41:t3/p3）无对 repo/workspace 的任何写入工件；其活动只有 Herdr wait/get/read 与 prompt 通知（合同要求即如此）。

## 逐实例对照（execution_strategy.md 快照 vs 实观测 argv）

| 角色实例 | 快照 tab/pane | 实观测 agent/argv | 快照模型/档 | 实测一致 |
|---|---|---|---|---|
| orchestrator（主会话） | w41:t1/p1 | `codex`（主会话进程） | Codex 主会话 | 一致（codex 主会话在场） |
| r29-builder | w41:t2/p2 | `codex -m gpt-5.6-sol -c model_reasoning_effort=medium --dangerously-bypass-approvals-and-sandbox` | Codex GPT-5.6 Sol medium | 一致 |
| r29-monitor | w41:t3/p3 | `devin --model swe-2-medium --permission-mode dangerous --respect-workspace-trust false` | Devin SWE-2 medium | 一致 |
| r29-plan-reviewer | w41:t4/p4 | `codex -m gpt-5.6-sol -c model_reasoning_effort=medium --dangerously-bypass-approvals-and-sandbox` | Codex GPT-5.6 Sol medium | 一致 |
| r29-decider | w41:t5/p5 | `codex -m gpt-6-astra -c model_reasoning_effort=medium --dangerously-bypass-approvals-and-sandbox` | Codex Astra medium | 一致 |
| r29-b1-coder | w41:t6/p6 | `devin --model swe-2-max --permission-mode dangerous --respect-workspace-trust false`（revision=5） | Devin SWE-2 Max | 一致 |
| r29-b1-reviewer | w41:t7/p7 | `devin --model swe-2-max --permission-mode dangerous --respect-workspace-trust false`（revision=5） | Devin SWE-2 Max | 一致 |
| r29-b2-coder | w41:t8/p8 | `devin --model swe-2-max --permission-mode dangerous`（revision=5） | Devin SWE-2 Max | 一致 |
| r29-b2-reviewer | w41:t9/p9 | `devin --model swe-2-max --permission-mode dangerous`（revision=5） | Devin SWE-2 Max | 一致 |
| r29-b3-coder | w41:tA/pA | `devin --model swe-2-max --permission-mode dangerous`（revision=4，本 worker） | Devin SWE-2 Max | 一致 |
| r29-b3-reviewer | w41:tB/pB | `devin --model swe-2-max --permission-mode dangerous`（revision=2，待命中） | Devin SWE-2 Max | 一致 |

- workflow-final reviewers 与 E2 reviewer：`execution_strategy.md` 记为 pending/未启动；实观测 w41 中无对应 tab/pane —— 与快照一致（尚未拉起，不预造证据）。

## 恢复依据事实（已发生）

- durable signals：`DONE.builder*.md`、`DONE.plan-review*.md`、`DONE.decision.*.md`、`DONE.batch-1.coder.md`、`DONE.batch-1.review.md`（PASS）、`DONE.batch-2.coder.md`、`DONE.batch-2.review.md`（PASS）、`BLOCKED.batch-1.coder.md`（quotepath 事故，已由 decision.batch-1.quotepath.md 裁决闭合）均在 workspace 实存。
- batch-1、batch-2 clear 链（均已发生，见 `check.batch-1.md`/`check.batch-2.md` 与 `execution_strategy.md`）：reviewer durable PASS → 工件齐全 → orchestrator 对 coder/reviewer 各一次 `/clear` → 复验（两批 coder/reviewer revision 均=5，本批实测确认）→ 下一批启动。batch-3 的 reviewer PASS/clear 尚未发生，不作声明。
- 恢复权威四类：durable signals、独立 review/decision 工件（`check.batch-1.md`、`check.batch-2.md`、`decision.*.md`、`review.plan*.md`）、`execution_strategy.md`、Herdr 实态（本目录捕获）。`progress.md` 仅为施工证据索引。
