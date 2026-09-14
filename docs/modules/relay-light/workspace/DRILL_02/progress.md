<!-- dh:v1 -->
# progress — DRILL_02

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-14 | W builder（builder#1 · Devin swe-2-max） | 读仓根 AGENTS.md、演习卡 README、monitor-W1 派单、relay_plan.md、RLT_10 七件套格式参照；进场 `git rebase master` 被他人 unstaged WIP 拒绝，核查 merge-base 证实 HEAD 已含 master 顶点（rebase 目标事实满足，未 stash/清理）；基线探针确认 `.gitignore` 不覆盖 `__pycache__`；建立 DRILL_02 七件套与 C1 单批计划 | W-BL-001；W-BL-002；F-001；七件套 commit=`c9d7bae`（P1-001 整改见 `done.builder.md`） | 发 `W_READY` 交 monitor，不进 C1 |

## 施工批次状态（预填，不代表已执行）

| Batch | 功能单元 | 红 | 绿 | 小审 | 状态 |
|---|---|---|---|---|---|
| C1 | `.gitignore` 末尾追加 `__pycache__/` + `*.pyc` 忽略段 | 基线已证：`check-ignore` exit 1（W-BL-002），施工时复跑取当批 RED | 待执行 | 待执行 | PENDING |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 | 支撑结论 |
|---|---|---|---|---|
| W-BL-001 | Git 基线（W 进场） | `git status --short`；`git branch --show-current`；`git rebase master`；`git merge-base HEAD master`；`git rev-parse master` `HEAD` | branch=`dryrun/rlt12-win`；rebase exit 1 `cannot rebase: You have unstaged changes`（`relay_log.jsonl` 他人未暂存改动 + untracked `.devin/`、`dispatch/monitor-W1.md`、`tools/relay-light/__pycache__/`）；merge-base=master=`51d80629e2debfde8c6cc644f2433808a9a66275`，HEAD=`90cb19659e280c587a35cd50866ae70b540fb829` | 分支已落在 master 顶点上，rebase 即便执行也是 no-op；按派单不 stash/清理他人 WIP，如实登记 F-001；W 规划在正确任务树与已核对基线上进行 |
| W-BL-002 | 验收基线（AC-1/AC-2 前置事实） | `git check-ignore -v tools/relay-light/__pycache__/x.pyc`；`git status --short` | check-ignore exit 1、无输出；status 含 `?? tools/relay-light/__pycache__/` | 演习卡基线实测复核成立：现行 `.gitignore` 不覆盖 `__pycache__`/`.pyc`，验收目标真实缺失，C1 有活可干 |

## 信号

（durable signal 已改为各角色独立 `done.<role>.md`，见 task_plan §批次与 durable signal；本文件由 scribe 独占维护，不再承接 DONE 行。builder 的 W_READY 已迁至 `done.builder.md`。）
