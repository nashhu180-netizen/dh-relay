<!-- dh:v1 · progress.md -->
# progress — RLT_09

> 事实与证据账本。施工期由 scribe 按账本/diff/四行小结追加；W builder 只写初始化行与预留结构。

## 日志

| 日期 | 阶段 / 批次 | 动作 | 结果 | 证据 |
|---|---|---|---|---|
| 2026-09-13 | W / builder | 读取 dispatch 与冻结输入，建立 RLT_09 七件套，拆 B1～B5（含 RLT_10 F-003）并冻结 heavy 五路复核 | 待 plan-reviewer 审核 | `brief.md`、`task_plan.md`、`execution_strategy.md`、`findings.md`、`lesson_candidates.md`、`review.md` |

## 证据账本

| E-ID | 批次 | 命令 / 操作 | 原始结果摘要 | 支撑结论 |
|---|---|---|---|---|
| E-B1-01 | B1 | `python3 -m unittest -v tools.relay-light.test_relay_log.RelayLifecycleTests.test_plan_amend_requires_monitor_and_complete_note_and_is_repeatable tools.relay-light.test_relay_log.RelayLifecycleTests.test_stage_result_amend_summary_matches_stage_history`（实现经 `git stash` 还原至批前态） | exit 1，`FAILED (failures=9)`：coder#1 写 plan_amend 报 HC-RL-A69 而非 A119；monitor#1 缺文件名 / 缺 `nodes=` / `nodes=` 空值 / 空列表项 4 例均被接受（exit 0）；status 投影 `errors` 因无 `nodes=` 的入帐行报警；A123 三例（有 amend 缺 `amend=`、缺 `nodes=`、无 amend 带 `amend=`）均被接受 | RED：A119/A123 目标断言失败，无 TypeError/fixture 错 |
| E-B1-02 | B1 | 同上命令（实现恢复后） | exit 0，`OK`，2 tests | GREEN：A119 五反例精确拒绝 + 同 `(node, monitor#1)` 连写两条 + 前后 status 投影不变；A123 五组通过 |
| E-B1-03 | B1 | `python3 -m unittest tools/relay-light/test_relay_log.py` | exit 0，`Ran 143 tests in 167.868s OK (skipped=2)` | Python 全量回归绿（2 skipped 为既有 F-002 标记用例） |
| E-B1-04 | B1 | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | exit 0，末行 `RELAY ALL PASS (SKIPPED: 1)` | PowerShell 全量绿（relay-light 薄壳重跑 Python 143 + install_skill 7） |
| E-B1-05 | B1 | `rm -rf tools/relay-light/__pycache__`；`git diff --check`；`git diff master --name-only`；`git status --short --untracked-files=all` | __pycache__ 已删；`--check` 无输出；name-only 仅含允许路径（design/dev_plan 为已授权 W 阶段提交，非本批改动） | 边界与 whitespace 洁净 |

## 批次 Handoff

| 批次 | candidate SHA | RED / GREEN | audit | 下一步 |
|---|---|---|---|---|

## 信号

DONE task=RLT_09 role=builder batch=W status=W_READY evidence=brief.md,task_plan.md,execution_strategy.md,progress.md,findings.md,lesson_candidates.md,review.md,commit=aaa2700 next=orchestrator
DONE task=RLT_09 role=audit batch=W status=FAIL evidence=review.plan.md next=orchestrator
DONE task=RLT_09 role=builder batch=W2 status=W_READY evidence=commit=ce14890 next=orchestrator

DONE task=RLT_09 role=decide batch=1 status=CONSULT evidence=decision.1.md next=orchestrator
DECISION task=RLT_09 decision=decision.1 choice=F-001:B,P1-03:A,A-adjust:authorized by=user(2026-09-13,orchestrator-session) evidence=design/evidence/08,RLT-A-07 next=builder-W3
DONE task=RLT_09 role=builder batch=W3 status=W_READY evidence=commits=bdd6cc2,e201158 next=orchestrator
DONE task=RLT_09 role=audit batch=W3 status=FAIL evidence=review.plan.md next=orchestrator
DONE task=RLT_09 role=builder batch=W4 status=W_READY evidence=commit=0898ab9 next=orchestrator
DONE task=RLT_09 role=audit batch=W4 status=PASS evidence=review.plan.md next=orchestrator
