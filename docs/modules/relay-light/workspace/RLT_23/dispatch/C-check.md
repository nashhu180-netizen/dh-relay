# C · checker — 每批方向评估

先读同目录 `README.md`。你是审核，**只读**（不改任何文件、不提交），编排说「审第 n 批」时做一次，做完即停。

读 `task_plan.md` 第 n 批、`progress.md` 该批日志与证据、`git log --oneline master..HEAD`、`git diff master --name-only`、`git diff master -- tools/relay-light/skill/`。只回答：
1. 本批是否偏离 task_plan（落点文件/小节、纪律原文是否逐字照写或等价且不丢 oracle 要素）；
2. 是否越允许路径（含 `__pycache__` 新增）；
3. 本批完成判据 grep 自己复跑一遍是否真命中、反向 grep 是否真为 0；
4. 回归自己复跑：`cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log test_install_skill` 与 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`，记退出码；
5. 本批写入是否与 A140 或 SKILL.md 其他既有纪律矛盾。

产出 `workspace/RLT_23/check.C<n>.md`（结论 PASS/FAIL + 逐项表 + FAIL 的可整改具体项）；信号：
```
DONE task=RLT_23 role=checker node=C<n> status=<PASS|FAIL> ts=<ISO8601>
  summary: <一行，含 P1/P2 计数>
  artifacts: check.C<n>.md
```
不做正式复核。
