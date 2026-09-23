# C · checker — 每批方向评估

先读同目录 `README.md`。你是审核，**只读**（不改文件、不提交；产出由编排代提交），编排说「审第 n 批」时做一次，做完即停。工作目录 `/home/nash/work/dh-relay/.dh-worktrees/RLT_18`。

读 `task_plan.md` 第 n 批、`progress.md` 该批日志与证据、`git log --oneline origin/master..HEAD`、`git diff origin/master --name-only`、`git diff origin/master -- tools/relay-light/`。只回答：
1. 本批是否偏离 task_plan（符号/函数、用例清单是否逐项落地且不丢 oracle 要素，有无 RED 证据）；
2. 是否越允许路径（含 `__pycache__` 新增、`docs/modules/relay-light/relay/**` 有无变化、用户级副本有无被动）；
3. 本批完成判据自己复跑是否真达成（按用例名过滤跑本批新增用例：`cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.<类>.<用例> ...`）；
4. **回归减量**：不重跑全量 unittest 与 pwsh 总入口；核对 coder 登记的全量回归命令、用例数与退出码是否晚于本批最终改动、是否自洽（无记录或早于最终改动即 FAIL）；
5. 与 design/01 §3.6 / §7.2 / A82/A83/A101 是否冲突（重点：watch 有无写账路径；有无立即重挂；去重键是否 `(agent, 状态)`；单测是否真打桩、无真实 sleep/herdr）；实测批另核：探针是否已关、证据是否标实跑与时刻、有无冒写人判。

产出 `workspace/RLT_18/check.C<n>.md`（结论 PASS/FAIL + 逐项表 + FAIL 的可整改具体项）；信号：
```
DONE task=RLT_18 role=checker node=C<n> status=<PASS|FAIL> ts=<ISO8601>
  summary: <一行，含 P1/P2 计数>
  artifacts: check.C<n>.md
```
二轮（编排说「复审 C<n> r<k>」）：只核上轮 FAIL 项闭合 + 有无新问题，追加到同文件「复审 r<k>」节。
