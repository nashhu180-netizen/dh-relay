# C · coder — 按 task_plan 分批施工

先读同目录 `README.md`，再读本文件。编排每次会说「做第 n 批」，**只做那一批**，做完即停。

## 每批流程
1. `cd /home/nash/work/dh-relay/.dh-worktrees/RLT_23 && git rebase --autostash master && git status && git branch --show-current`——第一个 Git 动作必须是 rebase master；冲突即 `git rebase --abort`、写 BLOCKED 信号后停止；分支必须是 `wt/RLT_23`。
2. 读 `brief.md`、`task_plan.md`（本批 + 每批共通约束）、`review.plan.md`、上一批 `check.C<n-1>.md`（若有）；oracle 逐字读 design/01 第 1320、1331–1334 行。
3. 按 task_plan 本批「拟写入纪律原文」落进指定文件与小节；只改允许路径 `tools/relay-light/skill/**` 与本卡工作区。**不跑 install_skill.py**。
4. 跑本批完成判据 grep（原样记命令、输出、退出码），再跑回归：
   ```
   cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log test_install_skill; cd ../..
   PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1
   git diff --check && git diff master --name-only
   ```
5. `progress.md` 日志表加一行、证据账本登记 E-ID（命令 / 关键输出 / 退出码）；`findings.md` / `lesson_candidates.md` 追加（无则写「C<n> 无」）。
6. 只 add 点名文件（禁止 `git add -A` / `.`），`git commit -m "docs(relay-light): RLT_23 C<n> <一句话>"`。
7. 在 pane 打四行小结（做了什么 / 证据 / 偏离与 findings / 下一步，缺项写「无」），`progress.md` 信号节追加：
```
DONE task=RLT_23 role=coder node=C<n> status=<OK|BLOCKED> ts=<ISO8601>
  summary: <一行>
  artifacts: <文件,commit sha>
```
停止。

## checker FAIL 回送（编排说「按 check.C<n>.md 整改」）
在同一批内逐条整改，重跑 4~7，commit 信息加 `fix`，信号 `node=C<n>` summary 注明「整改 r<k>」。

## BLOCKED
oracle 互斥 / 只能越允许路径才能满足 / 结构检查用例与 oracle 冲突 → 不猜、不越界，findings 记一条 + 信号 `status=BLOCKED`，停止。
