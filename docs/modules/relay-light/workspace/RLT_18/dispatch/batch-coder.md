# phase=batch · coder — 只做派单指定的第 n 批

先读同目录 `README.md`。做完写 signal 即停。

1. `cd /home/nash/work/dh-relay/.dh-worktrees/RLT_18 && git status && git branch --show-current`（必须 `wt/RLT_18`，否则 BLOCKED）。RELAY_RECEIPT preflight。
2. 读 `brief.md`、`task_plan.md`（第 n 批 + 共通约束）、`review.plan.md`、上一批 `check.batch-<n-1>.md`；oracle 逐字读 design/01 §3.6、§7.2、A82/A83/A101、H11/H12。
3. **RED 先行**：先写本批用例跑出失败并原样记录（命令 / 失败摘要 / 退出码），再实现到 GREEN。单测打桩 herdr 与时钟。只改允许路径。
4. 完成判据 + 回归：
   ```
   cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log; cd ../..
   PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1
   git diff --check && git diff origin/master --name-only && git status --porcelain
   git diff origin/master --stat -- docs/modules/relay-light/relay/
   ```
5. 证据落 `workspace/RLT_18/evidence/batch-<n>/`（RED、GREEN、回归输出）；`progress.md` **只追加一条**本批施工里程碑 + 证据引用；`findings.md` / `lesson_candidates.md` 按需追加。
6. 只 add 点名文件提交 `feat(relay-light): RLT_18 batch <n> <一句话>`（纯证据批用 `docs(relay-light)`）。
7. 写 `DONE.batch-<n>.coder.md`（phase=batch agent=coder#b<n> batch=<n> path=na review_round=1 remediation_count=0 verdict=READY evidence=...），一并提交，停止。

实测批（派单写明「实测批」时）：按 README 特别授权执行，探针用完关闭，证据标实跑与时刻，人判留空。
整改（「按 check.batch-<n>.md 整改 k」）：同批内逐条改，重跑 3~7，signal `DONE.batch-<n>.coder.remediation-<k>.md`（remediation_count=k）。
BLOCKED：oracle 互斥 / 须越允许路径 / design 字面不定且 task_plan 未给解法 / 实测环境不可用 → 写 `BLOCKED.batch-<n>.coder.md`（带 reason）并提交，停止。
