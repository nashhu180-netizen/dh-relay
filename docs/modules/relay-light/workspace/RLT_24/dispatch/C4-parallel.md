# C4 · coder2 — 与 C3 并行的取证批（用户 2026-09-17 15:50 裁决「C4 并行，独立 pane」）

先读同目录 `README.md`、`C-coder.md`，再读本文件。本文件对 `C-coder.md` 的**覆盖项**如下，冲突处以本文件为准。

你是 `rlt24-coder2`（node=C4，agent=coder#1 的并行实例）。同一 worktree 里 `rlt24-coder` 正在做 C3（改 `tools/relay-light/test_relay_log.py`，可能还有 `relay_log.py`，**未提交**）。

## 并行防冲突硬规则

1. **禁止** `git rebase` / `git stash` / `git checkout -- ` / `git reset` / `git add -A|.`——会卷走或冲掉 C3 的未提交改动。跳过 `C-coder.md` 第 1 步的 rebase，只做 `git status && git branch --show-current` 核对分支 `wt/RLT_24`。
2. **不改** `tools/relay-light/relay_log.py` 与 `test_relay_log.py`。C4 只用已提交的 C1/C2 能力（`add`/`lint`/`status`）取证；若发现取证必须改代码 → findings 记一条 + 信号 BLOCKED 停止。若 C3 的未提交改动导致工具暂时跑不通，等 2 分钟再试，连续 3 次不通再 BLOCKED。
3. 你的产出只落：`workspace/RLT_24/evidence/**`（fixture 计划目录、两份证据文件、取证原始输出）。施工中的日志与证据账本先写 `evidence/C4-log.md`，**不要边做边改 progress.md / findings.md / lesson_candidates.md**。
4. 收尾时一次性：把 C4 日志行、E-C4-* 证据账本、信号块**追加**到 `progress.md` 末尾对应节（先重新读文件再追加，不整文件覆盖）；findings / lesson_candidates 同样只追加「C4」小节。然后只 add `evidence/` 下你的文件 + `progress.md` + `findings.md` + `lesson_candidates.md` 中**你追加的部分**所在文件——若 `git diff` 显示这三个文件里含有非你写入的未提交改动（C3 coder 的），**不要 add 这些文件**，只提交 evidence/，并在信号 summary 注明「progress 行待编排代提交」。`.git/index.lock` 存在时等 10 秒重试。
5. 回归：不跑全量 unittest（C3 正在改测试，结果不绑定你的批次）；只跑 `lint`/`status` 取证命令与 `git diff master --stat -- docs/modules/relay-light/relay/` + rlt12-win-01 sha256 核对。所有 python 命令带 `PYTHONDONTWRITEBYTECODE=1`。
6. 不关闭、不操作任何真实在用的 herdr workspace/pane；实跑只能对不存在的测试 id。

## 做什么
按 `task_plan.md`「## C4 — A157」段（r2 修订版，含 `decisions.md` 第 1 行裁决）执行：阶段空间、编排空间各一例可控关闭失败，证据四要素 + 用途来源 + 首节点对照 + 待人工处理状态。

## 完成
commit `docs(relay-light): RLT_24 C4 A157 two-workspace close-failure evidence`，pane 打四行小结，信号：
```
DONE task=RLT_24 role=coder node=C4 status=<OK|BLOCKED> ts=<ISO8601>
  summary: <一行>
  artifacts: <文件,commit sha>
```
停止。
