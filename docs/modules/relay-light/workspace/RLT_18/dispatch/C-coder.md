# C · coder — 按 task_plan 分批施工

先读同目录 `README.md`，再读本文件。编排每次说「做第 n 批」，**只做那一批**，做完即停。

## 每批流程
1. `cd /home/nash/work/dh-relay/.dh-worktrees/RLT_18 && git status && git branch --show-current`——分支必须是 `wt/RLT_18`，否则 BLOCKED。（首批前编排已确保基线最新，**不要自行 rebase**。）
2. 读 `brief.md`、`task_plan.md`（本批 + 每批共通约束）、`review.plan.md`、上一批 `check.C<n-1>.md`（若有）；oracle 逐字读 design/01 §3.6（约 480–491）、§7.2（约 894–908）、约 1351–1353、1408–1409 行。
3. **RED 先行**：先按本批用例清单写测试，跑出失败并原样记录（命令 + 失败摘要 + 退出码）；再实现到 GREEN。只改 README 允许路径。单测一律打桩 herdr 与时钟。
4. 跑本批完成判据，再跑回归：
   ```
   cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log; cd ../..
   PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1
   git diff --check && git diff origin/master --name-only && git status --porcelain
   git diff origin/master --stat -- docs/modules/relay-light/relay/
   ```
5. `progress.md` 日志表加一行、证据账本登记 E-ID（命令 / 关键输出 / 退出码，RED 与 GREEN 各一条）；`findings.md` / `lesson_candidates.md` 追加（无则写「C<n> 无」）。
6. 只 add 点名文件（禁止 `git add -A` / `.`），`git commit -m "feat(relay-light): RLT_18 C<n> <一句话>"`（纯文档/证据批用 `docs(relay-light)`）。
7. pane 打四行小结（做了什么 / 证据 / 偏离与 findings / 下一步，缺项写「无」），`progress.md` 信号节追加：
```
DONE task=RLT_18 role=coder node=C<n> status=<OK|BLOCKED> ts=<ISO8601>
  summary: <一行，含本批新增/修改用例数与全量单测结果>
  artifacts: <文件,commit sha>
```
停止。

## 实测批（H11/H12）
仅当编排说「做实测批」时，按 README「实测特别授权」执行：探针 agent 名 `rlt18-probe-*`，只在 herdr workspace `w4B` 开 pane，用完关闭；证据落 `workspace/RLT_18/evidence/`，写清实跑、时刻、内容；人判结论留空给用户。

## checker FAIL 回送（编排说「按 check.C<n>.md 整改」）
同批内逐条整改，重跑 3~7，commit 信息加 `fix`，信号 summary 注明「整改 r<k>」。

## 返工（编排说「X<k>：按 review.<路>.md 整改」）
同上流程，信号 `node=X<k>`，commit `fix(relay-light): RLT_18 X<k> ...`。

## BLOCKED
oracle 互斥 / 只能越允许路径才能满足 / design 字面无法确定且 task_plan 未给解法 / 实测环境不可用 → 不猜、不越界，findings 记一条 + 信号 `status=BLOCKED`，停止。
