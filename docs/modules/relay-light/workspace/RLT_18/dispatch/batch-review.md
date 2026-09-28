# phase=batch-review · batch reviewer — 审第 n 批

先读同目录 `README.md`。只读（除自己的 `check.batch-<n>.md` 与 signal），不提交，做完即停。工作目录 `/home/nash/work/dh-relay/.dh-worktrees/RLT_18`。RELAY_RECEIPT preflight。

读 `task_plan.md` 第 n 批、`progress.md` 本批条目、`evidence/batch-<n>/`、`DONE.batch-<n>.coder*.md`、`git log --oneline origin/master..HEAD`、`git diff origin/master --name-only`、`git diff origin/master -- tools/relay-light/`。判：
1. 是否偏离 task_plan（符号、用例清单逐项落地、oracle 要素不丢、有 RED 证据）；
2. 是否越允许路径（`__pycache__` 新增、`docs/modules/relay-light/relay/**`、用户级副本、execution_strategy 是否被 worker 写）；
3. 自己复跑本批新增用例（`cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.<类>.<用例> ...`）；全量回归不重跑，只核 coder 登记的全量命令/用例数/退出码是否晚于本批最终改动且自洽；
4. 与 design §3.6/§7.2/A82/A83/A101 冲突与否：watch 有无写账、有无立即重挂、去重键、单测是否真打桩；实测批另核探针已关、证据标实跑与时刻、无冒写人判；
5. progress 写者边界：本批只一条、非 coder 未写。

产出 `workspace/RLT_18/check.batch-<n>.md`（结论 PASS/FAIL + 逐项表 + FAIL 的可整改具体项）；signal `DONE.batch-<n>.review.md`（phase=batch-review agent=batch-reviewer#b<n> batch=<n> path=na review_round=1 remediation_count=0 verdict=PASS|FAIL evidence=docs/modules/relay-light/workspace/RLT_18/check.batch-<n>.md）。
复审（「复审 round k」）：只核上轮 FAIL 项闭合 + 新问题，追加到同文件「复审 round k」节，signal `DONE.batch-<n>.review.round-<k>.md`。
