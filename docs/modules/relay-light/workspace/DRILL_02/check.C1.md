<!-- dh:v1 -->
# check.C1 — DRILL_02 checker 小审

## 结论

**PASS**。AC-1、AC-2 与 C1 allowed-paths 均闭合；未发现 P1 项。测试为 checker 本人实跑并等待自然退出，不以启动成功代替完成。

## 输入与提交身份

- coder 施工 commit：`85af7fb3e47e0cfe4150595c056da82f0d0e1b5a`，parent=`4a718d931da6a6581c233f511d75f15068f8c8a9`。
- coder 信号 commit：`3883fcaa28e7ec4e0b270bcb4159ca7c5e808276`，parent=`85af7fb3e47e0cfe4150595c056da82f0d0e1b5a`；检查时 HEAD 与该 SHA 相等。
- `git diff-tree --no-commit-id --name-status -r 85af7fb...`：`.gitignore`、`findings.md`、`lesson_candidates.md`。
- `git diff-tree --no-commit-id --name-status -r 3883fcaa...`：仅新增 `done.coder.md`。

## 逐项核查

### 1. `.gitignore` 仅末尾追加

命令：

```powershell
git diff 85af7fb3^ 85af7fb3 -- .gitignore
```

实际 diff 尾部：

```diff
 node_modules/
+
+# Python 测试副产品（不入仓；承接 RLT_10 F-002）
+__pycache__/
+*.pyc
```

逐行读取当前文件确认原有第 1～27 行未改，新增仅第 28 行空行、第 29 行注释、第 30 行 `__pycache__/`、第 31 行 `*.pyc`。结论：PASS。

### 2. RED 证据与 AC-1 GREEN

- RED 为状态变更前证据：`done.coder.md` 记录追加前命令 `git check-ignore -v tools/relay-light/__pycache__/x.pyc` 无输出、exit 1，并记录当时 `git status --short` 含 `?? tools/relay-light/__pycache__/`。checker 另以 `git diff 85af7fb3^ 85af7fb3 -- .gitignore` 核对 parent 仅有原 27 行、尚无两条 Python ignore 规则；证据相互一致。
- checker 当前亲跑：

```text
> git check-ignore -v tools/relay-light/__pycache__/x.pyc
.gitignore:30:__pycache__/    tools/relay-light/__pycache__/x.pyc
CHECK_IGNORE_EXIT=0
```

结论：AC-1 PASS。

### 3. AC-2 完整测试自然退出

命令：

```powershell
pwsh tools/tests/relay-light-log.ps1
```

实际最终尾部（checker 本人实跑）：

```text
----------------------------------------------------------------------
Ran 164 tests in 413.826s

OK (skipped=2)
...
----------------------------------------------------------------------
Ran 7 tests in 3.849s

OK
```

进程自然退出，exit 0。中间出现的参数错误、注入失败与 source-missing 文本均来自对应负例测试，相关用例逐项为 `ok`，最终两组 unittest 汇总均为 `OK`。

测后命令及 `git status --short` 全量实际输出：

```text
> git status --short
 M docs/modules/relay-light/relay/dryrun-win-01/relay_log.jsonl
?? .devin/
?? docs/modules/relay-light/relay/dryrun-win-01/dispatch/monitor-C1.md
?? docs/modules/relay-light/relay/dryrun-win-01/dispatch/monitor-W1.md
?? docs/modules/relay-light/workspace/DRILL_02/done.builder.md
?? docs/modules/relay-light/workspace/DRILL_02/done.plan-reviewer.md
?? docs/modules/relay-light/workspace/DRILL_02/review.plan.md
STATUS_EXIT=0
```

对上述全量输出匹配 `__pycache__|\.pyc`：`PRODUCT_MATCH_COUNT=0`；`git ls-files` 同口径：`TRACKED_PRODUCT_COUNT=0`。结论：AC-2 PASS。以上既有他人 WIP 仅盘点，未清理、未暂存，不计为 C1 越界。

### 4. 四集合与 allowed-paths

终检命令：

```powershell
git diff --name-only master...HEAD
git diff --name-only
git diff --cached --name-only
git ls-files --others --exclude-standard
git diff --name-only 85af7fb3^ 3883fcaa
git diff --check
```

实际集合：

```text
[committed master...HEAD]
.gitignore
docs/modules/relay-light/relay/dryrun-win-01/dispatch/orchestrator.md
docs/modules/relay-light/relay/dryrun-win-01/relay_log.jsonl
docs/modules/relay-light/relay/dryrun-win-01/relay_plan.md
docs/modules/relay-light/workspace/DRILL_02/brief.md
docs/modules/relay-light/workspace/DRILL_02/done.coder.md
docs/modules/relay-light/workspace/DRILL_02/execution_strategy.md
docs/modules/relay-light/workspace/DRILL_02/findings.md
docs/modules/relay-light/workspace/DRILL_02/lesson_candidates.md
docs/modules/relay-light/workspace/DRILL_02/progress.md
docs/modules/relay-light/workspace/DRILL_02/review.md
docs/modules/relay-light/workspace/DRILL_02/task_plan.md
docs/modules/relay-light/workspace/RLT_12/evidence/win-dry-run/README.md

[working unstaged]
docs/modules/relay-light/relay/dryrun-win-01/relay_log.jsonl

[index staged]
<empty>

[untracked]
.devin/config.local.json
docs/modules/relay-light/relay/dryrun-win-01/dispatch/monitor-C1.md
docs/modules/relay-light/relay/dryrun-win-01/dispatch/monitor-W1.md
docs/modules/relay-light/workspace/DRILL_02/done.builder.md
docs/modules/relay-light/workspace/DRILL_02/done.plan-reviewer.md
docs/modules/relay-light/workspace/DRILL_02/review.plan.md

[C1 coder two-commit union: 85af7fb3^..3883fcaa]
.gitignore
docs/modules/relay-light/workspace/DRILL_02/done.coder.md
docs/modules/relay-light/workspace/DRILL_02/findings.md
docs/modules/relay-light/workspace/DRILL_02/lesson_candidates.md
```

`master...HEAD` 中 relay 计划/账本、RLT_12 README 与 DRILL_02 前置合同是既有 W/编排历史，不是 coder 两笔 commit 引入；working/untracked 项是共享现场中已盘点的他人 WIP。C1 coder 两笔 commit 的精确并集只含仓根 `.gitignore` 与 `workspace/DRILL_02/**`，符合闭集；`tools/` 零改动。`git diff --check` exit 0，仅对他人 `relay_log.jsonl` 打印 LF→CRLF warning。checker 未执行 add/commit/rebase，未修改 index。

## P1

无。
