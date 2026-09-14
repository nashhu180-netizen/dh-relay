<!-- dh:v1 -->
# done.coder — DRILL_02 Batch C1

DONE task=DRILL_02 role=coder batch=C1 status=READY_FOR_REVIEW evidence=.gitignore,findings.md,lesson_candidates.md,done.coder.md,commit=85af7fb next=monitor

## 四行小结

- **做了什么**：仓根 `.gitignore` 末尾追加「Python 测试副产品（不入仓；承接 RLT_10 F-002）」忽略段（`__pycache__/`、`*.pyc`，+4 行含段前空行，既有 27 行未动）；findings 记 F-002、lesson_candidates 记 C1 观察行；AC-1 / AC-2 双绿。
- **证据**：见下方留证小节（命令 + verbatim 摘要 + exit + commit SHA）；施工 commit=`85af7fb3e47e0cfe4150595c056da82f0d0e1b5a`；本信号文件由紧随其后的信号 commit 单独提交（HEAD）。
- **偏离与 findings**：F-002（进场 rebase 再被他人 WIP 拒绝，merge-base 核查证 no-op，未 stash/清理）；lesson_candidates 追加一条重复观测。其余无。
- **下一步**：next=monitor——checker 小审 → scribe 汇总 progress；本棒即停，不进复核、不 verify、不 push/PR/merge。

## 留证（C1 全程）

| 步骤 | 命令 | verbatim 摘要 / 结果 | exit |
|---|---|---|---|
| 进场 rebase | `git rebase master` | `error: cannot rebase: You have unstaged changes.`（他人 WIP：`relay_log.jsonl` unstaged + untracked `.devin/`、dispatch/monitor-{W1,C1}.md、done.builder.md、done.plan-reviewer.md、review.plan.md、`tools/relay-light/__pycache__/`） | 1 |
| merge-base 核查 | `git merge-base HEAD master` / `git rev-parse master` / `git rev-parse HEAD` | merge-base=`51d80629e2debfde8c6cc644f2433808a9a66275` = master 顶点；HEAD=`4a718d931da6a6581c233f511d75f15068f8c8a9` → 分支已含基线，rebase 为 no-op | 0 |
| branch | `git branch --show-current` | `dryrun/rlt12-win` | 0 |
| RED | `git check-ignore -v tools/relay-light/__pycache__/x.pyc`（追加前） | 无输出；`git status --short` 见 `?? tools/relay-light/__pycache__/` | 1 |
| AC-1 GREEN | `git check-ignore -v tools/relay-light/__pycache__/x.pyc`（追加后） | `.gitignore:30:__pycache__/\ttools/relay-light/__pycache__/x.pyc` | 0 |
| AC-2 GREEN | `pwsh tools/tests/relay-light-log.ps1` | `Ran 164 tests in 367.118s` → `OK (skipped=2)`；`Ran 7 tests in 2.378s` → `OK`；套件自然退出 | 0 |
| AC-2 判据 | `git status --short`（测后全量） | 8 行：` M .gitignore`、` M relay_log.jsonl`、`?? .devin/`、`?? dispatch/monitor-C1.md`、`?? dispatch/monitor-W1.md`、`?? done.builder.md`、`?? done.plan-reviewer.md`、`?? review.plan.md`；grep `__pycache__`/`.pyc` 均零命中（grep exit 1） | 0 |
| 边界 | `git diff --check` | 仅 warning：`relay_log.jsonl` LF→CRLF（他人文件，非本批） | 0 |
| 边界 | `git diff .gitignore` | 纯末尾追加：空行 + 注释行 + `__pycache__/` + `*.pyc` | 0 |
| 四集合 | committed `master...HEAD` / unstaged / staged / untracked | 本批越界零：committed 新增仅 `.gitignore`+workspace 自有工件；unstaged 集 = `.gitignore`（本批）+ `relay_log.jsonl`（他人，未 stage）；staged 集空；untracked 全为他人现场；`tools/` 对 master 零 diff | 0 |

## 边界确认

- 本批改动闭集：`.gitignore`、`workspace/DRILL_02/{findings,lesson_candidates,done.coder}.md`；`progress.md` 未写（scribe 独占）；`tools/` 零改动；`__pycache__/` 目录原地未删（ignore 生效不靠删产物）。
- 未 stage / 未触碰他人文件：`relay_log.jsonl`（账本独占）、`.devin/`、dispatch/*、`done.builder.md`、`done.plan-reviewer.md`、`review.plan.md`。
- 凭据/密钥值：无写入。
