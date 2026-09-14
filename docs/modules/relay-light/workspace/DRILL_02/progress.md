<!-- dh:v1 -->
# progress — DRILL_02

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-14 | W builder（builder#1 · Devin swe-2-max） | 读仓根 AGENTS.md、演习卡 README、monitor-W1 派单、relay_plan.md、RLT_10 七件套格式参照；进场 `git rebase master` 被他人 unstaged WIP 拒绝，核查 merge-base 证实 HEAD 已含 master 顶点（rebase 目标事实满足，未 stash/清理）；基线探针确认 `.gitignore` 不覆盖 `__pycache__`；建立 DRILL_02 七件套与 C1 单批计划 | W-BL-001；W-BL-002；F-001；七件套 commit=`c9d7bae`（P1-001 整改见 `done.builder.md`） | 发 `W_READY` 交 monitor，不进 C1 |
| 2026-09-14 | C1 coder（coder#1） | `.gitignore` 末尾追加 Python 副产品忽略段（`__pycache__/`、`*.pyc`，既有 27 行未动）；进场 rebase 再被他人 WIP 拒绝，merge-base 核查证已含 master 顶点（F-002）；AC-1 / AC-2 双绿 | C1-EV-001~004；F-002；施工 commit=`85af7fb3e47e0cfe4150595c056da82f0d0e1b5a`；信号 commit=`3883fcaa28e7ec4e0b270bcb4159ca7c5e808276`（留证全文见 `done.coder.md`） | READY_FOR_REVIEW → checker 小审 |
| 2026-09-14 | C1 checker（checker#1） | 独立小审：复核 `.gitignore` 纯追加 diff、亲跑 `check-ignore` 与完整测试套件（164 项 `OK (skipped=2)` + 7 项 `OK`，自然退出 exit 0），测后 `git status --short` 与 `git ls-files` 零 `__pycache__`/`.pyc`，四集合闭集核查通过 | C1-EV-003~005；`check.C1.md`；`done.checker.md` | **PASS，无 P1** → scribe 汇总 |
| 2026-09-14 | C1 scribe（scribe#1 · claude-fable-5-1） | 汇总 C1 进 progress.md：登记 C1-EV-001~005 证据账、更新批次状态；核查 F-002 基线事实（merge-base=master=`51d8062`，见 findings）；只读跑 `relay_log.py status` 确认 C1 开放、scribe 缺终态。运行异常登记（据监工派单事实）：coder prompt 需补一次 Enter（seq102→103 转 working 且输入清空）；checker 启动后空输入被 Herdr 误标 done/interactive_ready，`--until idle` 60s timeout，改读 done 确认空输入就绪，prompt 补 Enter 后 seq106→108 working 且输入清空；两次均未重拉 | 本文件 C1 批次记录；`done.scribe.md` | 发 `CONSTRUCTION_DONE` 交 monitor，C1 收口待 R1 派活 |

## 施工批次状态（预填，不代表已执行）

| Batch | 功能单元 | 红 | 绿 | 小审 | 状态 |
|---|---|---|---|---|---|
| C1 | `.gitignore` 末尾追加 `__pycache__/` + `*.pyc` 忽略段 | 基线已证：`check-ignore` exit 1（W-BL-002）；当批 RED 复跑 exit 1（C1-EV-002） | AC-1 exit 0 命中 `.gitignore:30:__pycache__/`（C1-EV-003）；AC-2 测后零 `__pycache__`/`.pyc`（C1-EV-004） | checker PASS 无 P1（`check.C1.md`） | DONE |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 | 支撑结论 |
|---|---|---|---|---|
| W-BL-001 | Git 基线（W 进场） | `git status --short`；`git branch --show-current`；`git rebase master`；`git merge-base HEAD master`；`git rev-parse master` `HEAD` | branch=`dryrun/rlt12-win`；rebase exit 1 `cannot rebase: You have unstaged changes`（`relay_log.jsonl` 他人未暂存改动 + untracked `.devin/`、`dispatch/monitor-W1.md`、`tools/relay-light/__pycache__/`）；merge-base=master=`51d80629e2debfde8c6cc644f2433808a9a66275`，HEAD=`90cb19659e280c587a35cd50866ae70b540fb829` | 分支已落在 master 顶点上，rebase 即便执行也是 no-op；按派单不 stash/清理他人 WIP，如实登记 F-001；W 规划在正确任务树与已核对基线上进行 |
| W-BL-002 | 验收基线（AC-1/AC-2 前置事实） | `git check-ignore -v tools/relay-light/__pycache__/x.pyc`；`git status --short` | check-ignore exit 1、无输出；status 含 `?? tools/relay-light/__pycache__/` | 演习卡基线实测复核成立：现行 `.gitignore` 不覆盖 `__pycache__`/`.pyc`，验收目标真实缺失，C1 有活可干 |
| C1-EV-001 | 施工落盘 commit | `git diff-tree --no-commit-id --name-status -r 85af7fb`（checker 核） | commit=`85af7fb3e47e0cfe4150595c056da82f0d0e1b5a`：`.gitignore` 末尾纯追加（+空行/注释/`__pycache__/`/`*.pyc`，既有 27 行未动）+ `findings.md`（F-002）+ `lesson_candidates.md`；信号 commit=`3883fcaa28e7ec4e0b270bcb4159ca7c5e808276` 仅新增 `done.coder.md` | C1 施工产物落盘，改动面符合计划 |
| C1-EV-002 | 当批 RED | `git check-ignore -v tools/relay-light/__pycache__/x.pyc`（追加前，coder 复跑） | 无输出，exit 1；当时 status 见 `?? tools/relay-light/__pycache__/` | 追加前规则确不存在，非假绿 |
| C1-EV-003 | AC-1 GREEN | `git check-ignore -v tools/relay-light/__pycache__/x.pyc`（追加后；checker 独立复跑同径） | `.gitignore:30:__pycache__/\ttools/relay-light/__pycache__/x.pyc`，exit 0 | AC-1 闭合：规则行真实命中 |
| C1-EV-004 | AC-2 GREEN | `pwsh tools/tests/relay-light-log.ps1`（checker 亲跑到底）→ `git status --short` + `git ls-files` | `Ran 164 tests in 413.826s` → `OK (skipped=2)`；`Ran 7 tests in 3.849s` → `OK`；自然退出 exit 0；测后 status 全量与 ls-files 匹配 `__pycache__|\.pyc` 计数均为 0 | AC-2 闭合：套件真跑绿且副产品不再入 status/索引 |
| C1-EV-005 | 边界 / 四集合 | `git diff --name-only master...HEAD`；unstaged / staged / untracked 集；`git diff --name-only 85af7fb3^ 3883fcaa`；`git diff --check` | coder 两笔 commit 并集仅 `.gitignore` + `workspace/DRILL_02/**`；`tools/` 对 master 零 diff；index 空；untracked/unstaged 余项全为他人现场（`relay_log.jsonl`、`.devin/`、dispatch/* 等）；`diff --check` exit 0 仅他人文件 LF→CRLF warning | C1 allowed-paths 闭集成立，无越界、无暂存他人 WIP |

## 信号

（durable signal 已改为各角色独立 `done.<role>.md`，见 task_plan §批次与 durable signal；本文件由 scribe 独占维护，不再承接 DONE 行。builder 的 W_READY 已迁至 `done.builder.md`。）
