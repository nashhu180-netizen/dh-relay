<!-- dh:v1 -->
# review.consistency — DRILL_02 R1

## 结论

**PASS**。P1=0，P2=0。

本路只核一致性与边界：`.gitignore` 改动、四集合、allowed-paths、`task_plan.md` 逐步执行记录、`progress.md` 与只读账本 `status`。未改代码、计划、账本或其他 reviewer 产物。

## 1. `.gitignore` 与 AC-1

```text
> git diff master...HEAD -- .gitignore
@@ -25,3 +25,7 @@
 node_modules/
+
+# Python 测试副产品（不入仓；承接 RLT_10 F-002）
+__pycache__/
+*.pyc
GITIGNORE_DIFF_EXIT=0

> git check-ignore -v tools/relay-light/__pycache__/x.pyc
.gitignore:30:__pycache__/    tools/relay-light/__pycache__/x.pyc
CHECK_IGNORE_EXIT=0
```

逐行核当前文件：原第 1～27 行保持不变；仅在末尾新增第 28 行空行、第 29 行注释、第 30 行 `__pycache__/`、第 31 行 `*.pyc`。与 brief、演习卡及 task plan 钉死的两条规则一致，AC-1 可复现。

## 2. 四集合与 allowed-paths

取证时四集合：

- committed（`git diff --name-only master...HEAD`）：含 `.gitignore`、`workspace/DRILL_02/**`，另含本预演在 C1 前已有的 `relay/dryrun-win-01/{relay_plan.md,relay_log.jsonl,dispatch/orchestrator.md}` 与演习卡 README。
- working unstaged：仅 `docs/modules/relay-light/relay/dryrun-win-01/relay_log.jsonl`（当班 monitor 的共享账本现场）。
- index staged：空。
- untracked：`.devin/config.local.json`、`dispatch/monitor-{W1,C1,R1}.md`、`done.builder.md`、`done.plan-reviewer.md`、`review.plan.md`，均为已盘点的编排/并行 WIP；本 reviewer 未暂存、删除或修改。

归因复核：`git diff --name-only master...4a718d9` 已含上述 relay 计划/账本/演习卡与 W 阶段合同；C1 起点后的 `git diff --name-only 4a718d9..HEAD` 仅含 `.gitignore` 与 `workspace/DRILL_02/**`。coder 两笔提交精确并集 `85af7fb3^..3883fcaa` 也仅为 `.gitignore`、`done.coder.md`、`findings.md`、`lesson_candidates.md`。因此按 task plan 明定的“他人 WIP/产物不算本批越界、但不得暂存或删除”口径，C1 实际改动满足 allowed-paths；`tools/` 零 diff。`git diff --check` exit 0（仅共享账本 LF→CRLF warning）。

## 3. `task_plan.md` 逐步对账

| 步骤 | 对账结果 | 证据 |
|---|---|---|
| 1. 进场基线 | PASS | `done.coder.md` 记录首个 Git 动作为 `git rebase master`，被共享 WIP 拒绝；merge-base=master=`51d8062...`，未 stash/清理。 |
| 2. 当批 RED | PASS | C1-EV-002 / `done.coder.md`：追加前 `check-ignore` 无输出、exit 1，status 可见 `__pycache__/`。 |
| 3. 末尾追加 | PASS | 当前 diff 仅新增空行、注释和两条钉死规则；原 27 行未动。 |
| 4. AC-1 GREEN | PASS | 本 reviewer 独立复现 `.gitignore:30:__pycache__/` 命中，exit 0。 |
| 5. AC-2 GREEN | PASS | `check.C1.md` 记录 checker 亲跑到底：164 项 `OK (skipped=2)` + 7 项 `OK`，自然退出 0；测后 status/索引零 `__pycache__`/`.pyc`。 |
| 6. 边界 | PASS | 四集合已逐项盘点；index 空；C1 精确范围在闭集；`tools/` 零 diff；`diff --check` exit 0。 |
| 7. 收口 | PASS | 施工 commit=`85af7fb3e47e0cfe4150595c056da82f0d0e1b5a`，信号 commit=`3883fcaa28e7ec4e0b270bcb4159ca7c5e808276`；checker PASS，scribe 已汇总；未见本卡 push/PR/merge/verify 越位。 |

## 4. progress 与账本状态一致性

只读命令：

```text
python tools/relay-light/relay_log.py status --plan docs/modules/relay-light/relay/dryrun-win-01 --config-dir C:/Users/nash/.claude/skills/relay-light/
```

取证结果 exit 0：`DRILL_02:W#1 closed result=done`；`DRILL_02:C#1 closed result=done`；`DRILL_02:R#1 open`、节点 R1 open，lesson#1 与 consistency#1 当时均已 launch 且尚无终态；F1 pending。

`progress.md` 把 C1 批次标为 DONE、记录 checker PASS，并把下一步指向 R1；它没有提前宣称 R1/F1 完成。与账本当前阶段一致。progress 中“C1 开放、scribe 缺终态”明确属于 scribe 当时的只读查询记录，随后账本 C1 closed 是正常时序推进，不构成冲突。

## 分级计数

- P1：0
- P2：0
- 最终结论：PASS
