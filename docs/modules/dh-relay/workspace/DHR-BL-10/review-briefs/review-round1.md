# review-brief · DHR-BL-10 代码复核轮 1

你是被派进 dh-relay 的**复核 worker**（手动派活）。**只读，不改任何代码。**

## 铁律

- 只读：禁止编辑、禁止 git 写操作、禁止跑会改文件的命令。测试可以跑（只读消耗）。
- 你不是主控：不派活、不问用户、不做验收裁决。只写事实与级别。
- 结论写进独立文件 `docs/modules/dh-relay/workspace/DHR-BL-10/review-logs/review-round1.codex.md`
  ——但**你只输出内容到 stdout**，由主控落盘（你是只读沙盒）。

## 复核对象

工作树 `.dh-worktrees/DHR-BL-10`，分支 `wt/DHR-BL-10`，基线 `master` = `f04d797`。
未提交改动共 7 个文件，用 `git diff` 看全量。

## 先读

1. `AGENTS.md`（仓根）——宪章 7 条 +「编排协议段」
2. `docs/modules/dh-relay/workspace/DHR-BL-10/brief.md`——8 条完成条件、**允许路径清单**、边界
3. `docs/modules/dh-relay/workspace/DHR-BL-10/task_plan.md`——原定施工步骤（注意：其中 as-built 行号「21/57」是**错的**，实际是 9/57，施工方已纠正并记 progress）
4. `docs/modules/dh-relay/workspace/DHR-BL-10/progress.md`——证据账 E-001~E-010
5. `docs/modules/dh-relay/workspace/DHR-BL-10/findings.md`——F-001~F-006

## 施工方身份（决定你要多疑）

施工由 **zcode（GLM-5.3 做步骤 0~4，GLM-5.3-Flash 复验并做 5~8）** 完成——即**被接入的这个 CLI 自己给自己接线**。
主控已独立复跑全量回归并复核 diff，但主控也参与了写 task_plan，**不算独立**。你是唯一的独立眼睛。

## 专挑这些（逐条给 P0~P3 级别 + 证据）

1. **目标范围漂移 / 越界**：实际 diff 是否严格落在 brief 的允许路径清单内？有没有顺手改了不该改的。
2. **行为回归**：`claude` / `codex` 两条既有分支是否真的逐字未变？对照 `git show HEAD:tools/host/relay-worker-entry.ps1`。
   特别核 **F-006**：`-ceq`（大小写敏感）改成 `switch`（大小写不敏感）带来的派发语义变化，是可接受的顺带修复还是越界？新 `switch` 无 `default` 分支有没有风险？
3. **密钥与绝对路径**：新增行有没有凭据值、有没有 zcode 安装绝对路径。宪章#6 是红线。
4. **证据缺口 / 可伪造点**：progress 的 E-004~E-010 是否可复跑？特别是 **E-009 那次「真实拉起一棒」**——沙盒在 `%TEMP%` 且已被清理，证据是否只剩自述？这条支撑的是唯一的人验项（完成条件 7），证据强度不够要明说。
5. **测试有效性**：新增 4 条断言是否真能逮住问题？E-005 用 `git stash` 做红态实证的手法是否可信、有没有污染工作树的残留风险？
   建议你**自己选一个变异点**：把 `relay-worker-entry.ps1` 的生产代码故意改坏（你只读，所以只需**指出**改哪一行、改成什么、预期哪条断言变红），供主控实施。
6. **隐性逻辑**：`switch` 三分支下 `$LASTEXITCODE` 的取值路径有没有变化（原 `if/else` 必执行一条，新 `switch` 理论上可能一条都不匹配）。
7. **流程被跳过**：有没有该读没读、该记没记；「失序补录」标记用得对不对。

## 输出格式

```
## 结论：approved / approved-with-P2 / changes-requested
## 发现
| ID | 级别 | 问题 | 证据（文件:行 / 命令输出） | 建议处置 |
## 变异点建议（供主控实施）
锚点 path:line ｜ 原值→变异值 ｜ 语义类别(改条件/改返回值/改边界) ｜ 预期变红的断言名
## 我核过但没问题的点（逐条列，别只说"其余正常"）
```
