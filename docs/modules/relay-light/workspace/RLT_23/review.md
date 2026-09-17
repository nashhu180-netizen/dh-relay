# RLT_23 · 复核与验收

> `task_type=light`。施工者不得复核自己的卡。W1 只登记路径与靶子；结论和证据由独立复核者填写，人类签名区留空。

## 复核路径登记

| 路径 | 独立性 | 必审靶子 | reviewer | 结论 | 证据 |
|---|---|---|---|---|---|
| lesson | 非施工者，独立路 | `lesson_candidates.md` 的候选来源、去重和可复用性；若始终无候选，留可核查 N/A 与库版本；对照 RLT_11 F-003/F-005/F-006/F-007 有无重犯 | rlt23-review-lesson | APPROVE（判据内 P1=0/P2=0；范围外 P2 建议 1 条+观察 2 条） | review.lesson.md |
| consistency | 非施工者，独立路 | A151～A154 与 A140、SKILL/两 adapter 同类模板、设计/DevPlan 非目标及允许路径逐项比对；核主控侧分叉、F checklist 独立行 | rlt23-review-consistency | APPROVE（判据内 P1=0/P2=0；范围外观察 1 条） | review.consistency.md |

## AI 提交区

| 项目 | 结论 | 证据 |
|---|---|---|
| 四条验收 | A151～A154 结构判据全部命中、反向检查零行；C1/C2 两批 checker 均 PASS（P1=0 P2=0） | check.C1.md（A151/A153 三处逐字命中 3/3/3/3、软表述反查零行 rg exit 1）；check.C2.md（A152 分叉 adapter 2/2 + SKILL 各 1、A154 F 模板 `- [ ]` 独立行命中 1 且未勾选、无条件 bypass 反查零行 rg exit 1）；progress.md E-C1-02～E-C1-05、E-C2-02～E-C2-07 |
| 两路复核 | 教训路与一致性路均 APPROVE，判据内 P1=0 P2=0 | review.lesson.md（逐条判据 4 项全 PASS；范围外 P2 建议 1 条 + 观察 2 条）；review.consistency.md（逐条判据 7 项全 PASS；范围外观察 1 条）；本文件「复核路径登记」表 |
| 范围与回归 | 全部改动在 `tools/relay-light/skill/**` 与本卡 workspace 闭集内；两条规定回归均 exit 0 | progress.md E-C1-06～E-C1-08、E-C2-08～E-C2-10（`python3 -m unittest` 210 tests OK、`run-relay-tests.ps1` `RELAY ALL PASS (SKIPPED: 1)`、四集合仅含允许路径、`git diff --check` 零错误、无 `__pycache__`）；check.C2.md 判据 2/4/5；review.consistency.md 判据 5～7（复核者独立复跑同绿） |

## 人类签名区

| 签名人 | 日期 | 结论 | 证据 |
|---|---|---|---|
| | | | |
