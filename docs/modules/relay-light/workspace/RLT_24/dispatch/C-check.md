# C · checker — 每批方向评估

先读同目录 `README.md`。你是审核，**只读**（不改任何文件、不提交；产出文件由编排代提交），编排说「审第 n 批」时做一次，做完即停。工作目录 `/home/nash/work/dh-relay/.dh-worktrees/RLT_24`。

读 `task_plan.md` 第 n 批、`progress.md` 该批日志与证据、`git log --oneline master..HEAD`、`git diff master --name-only`、`git diff master -- tools/relay-light/`。只回答：
1. 本批是否偏离 task_plan（改动的符号/函数、用例清单是否逐项落地且不丢 oracle 要素，有无 RED 证据）；
2. 是否越允许路径（含 `__pycache__` 新增、`docs/modules/relay-light/relay/**` 有无变化、rlt12-win-01 账本 sha256 是否与 master 一致）；
3. 本批完成判据自己复跑是否真达成（按用例名过滤跑本批新增用例）；
4. 回归自己复跑：`cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log` 与 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`，记退出码与用例数；
5. 本批实现是否与 design/01 §3.4 wire format（301–328 行）或既有合同冲突（重点：非 `resource_close` 事件的自由 note 不得被解析；既有断言有无被削弱或删除）。

产出 `workspace/RLT_24/check.C<n>.md`（结论 PASS/FAIL + 逐项表 + FAIL 的可整改具体项）；信号：
```
DONE task=RLT_24 role=checker node=C<n> status=<PASS|FAIL> ts=<ISO8601>
  summary: <一行，含 P1/P2 计数>
  artifacts: check.C<n>.md
```
二轮（编排说「复审 C<n> r<k>」）：只核上轮 FAIL 项闭合 + 有无新问题，追加到同文件「复审 r<k>」节。不做正式复核。
