<!-- dh:v1 · task_plan.md -->
# task_plan — DRILL_02 仓根 .gitignore 忽略 Python 副产品

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：你是 DRILL_02 在 relay-light 计划 `dryrun-win-01` 下的 worker，只处理派单指定的当前节点。进入 `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\dryrun-rlt12-win` 后第一个 Git 动作是 `git rebase master`；被他人 WIP 拒绝时不 stash、不清理，核查 merge-base 并把结果留证于自有 `done.<role>.md`（由 scribe 后续汇总至 `progress.md`）。先读仓根 `AGENTS.md`、本文件、`brief.md`、`progress.md`、`findings.md` 与演习卡 README。只在 DRILL_02 allowed-paths 内修改；偏离只记 findings 与自有 `done.<role>.md` 小结，不改本计划、账本、派单或越界文件，不自行复核、verify、push、PR、merge。

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `AGENTS.md` | worker 铁律、allowed-paths/复核/凭据边界、relay-light 编排协议段 |
| C-002 | 演习卡 `workspace/RLT_12/evidence/win-dry-run/README.md` | DRILL_02 目标/允许路径/light 档位/两条验收；基线实测结论 |
| C-003 | `relay/dryrun-win-01/relay_plan.md` | 节点表 W1→C1→R1→F1、agent 表与触发关系 |
| C-004 | `relay/dryrun-win-01/dispatch/monitor-W1.md` 及当班监工派单 | 本节点指令集与信号约定 |
| C-005 | 仓根 `.gitignore` | 追加落点与既有风格（注释段 + 规则行） |
| C-006 | `tools/tests/relay-light-log.ps1` | AC-2 驱动器：调用方式与预期耗时（准入实测 ~644s） |

## 全程允许路径闭集与禁改项

只允许修改：

- 仓根 `.gitignore`（仅末尾追加段）
- `docs/modules/relay-light/workspace/DRILL_02/**`

禁止修改 `tools/` 一切内容、`relay/` 计划账本派单、DevPlan、design、AGENTS、其他 workspace；禁止 stash/清理他人 WIP 与既有 untracked（含 `tools/relay-light/__pycache__/`——AC-2 靠 ignore 生效，不靠删除）。若事实证明必须动禁改项才能满足验收，登记 finding 与证据后发 `DONE ... status=BLOCKED`。

## 批次与 durable signal

单批施工：C1 → checker 小审 PASS → scribe 汇总，随后 R1（lesson + consistency 两路并发）→ F1。durable signal 不共写——**每角色只写自有的 `done.<role>.md`**（文件名取 relay_plan agent 表名：`done.builder.md` / `done.plan-reviewer.md` / `done.coder.md` / `done.checker.md` / `done.scribe.md` / `done.decider.md` / `done.lesson.md` / `done.consistency.md`）；**`progress.md` 归 scribe 独占维护**（日志行、E-ID 证据账登记），其余任何角色不写。各角色完工在自有 done 文件写一行：

```text
DONE task=DRILL_02 role=<role> batch=<W|C1|R1|F1> status=<W_READY|PASS|FAIL|READY_FOR_REVIEW|BLOCKED|DONE> evidence=<逗号分隔,含 commit=SHA> next=monitor
```

同 agent 跨节点由 batch 区分（scribe 见于 C1/R1/F1）；各角色 status 取值以当班监工派单逐字为准；写完信号立即停止，不等 `node_closed`，不越位派活。

## 施工共通约束

- 证据的可核查原始形式（命令 + verbatim 摘要 + commit SHA）随各角色产出文件与自有 done 文件给出；E-ID 编号与证据账本由 scribe 在 `progress.md` 统一登记。DONE 的 `evidence=` 只引用真实存在的文件/commit/已登记 E-ID，禁止悬空描述符。
- 只暂存点名文件，禁止 `git add -A` / `git add .`；commit scope 用英文 `relay-light`。
- 每批跑 `git diff --check` 与四集合 allowed-paths 检查：`git diff --name-only master...HEAD`、working tree、index、untracked 逐集合反选闭集；注意他人 WIP/产物不算本批越界，但不得被自己暂存或删除。
- checker 只读本批 diff/证据写独立 `check.C1.md`，信号写 `done.checker.md`；coder 不改 checker 结论或 review.md 复核区。
- 凭据/密钥值永不写入任何工件与账本。

## 施工步骤 (Steps)

### Batch C1 — .gitignore 追加忽略段（AC-1 / AC-2）

**改动文件**：仓根 `.gitignore`（仅追加），以及本卡 `findings.md` / `lesson_candidates.md` / `done.coder.md`（`progress.md` 归 scribe 独占，coder 不写）。

**计划 diff**（规则行钉死，注释措辞可同义微调）：

```gitignore
# Python 测试副产品（不入仓；承接 RLT_10 F-002）
__pycache__/
*.pyc
```

1. **进场基线**：`git rebase master`；`git status`；`git branch --show-current`。rebase 被拒时核查 `git merge-base HEAD master` 与 `git rev-parse master` 是否相等，结果记 E-ID。
2. **本批 RED**：`git check-ignore -v tools/relay-light/__pycache__/x.pyc` → 追加前预期 exit 1 无输出（W 基线 W-BL-002 已证一次，本批复跑取当批证据）；`git status --short` 可见 `?? tools/relay-light/__pycache__/`。
3. **追加**：把上面计划 diff 追加到 `.gitignore` 末尾，不改既有 27 行。
4. **AC-1 GREEN**：复跑 `git check-ignore -v tools/relay-light/__pycache__/x.pyc` → exit 0，输出含 `.gitignore:<行号>:__pycache__/` 或 `*.pyc` 命中行，逐字留证。
5. **AC-2 GREEN**：`pwsh tools/tests/relay-light-log.ps1` 实跑到底（预期 exit 0、两份 unittest 输出 OK；耗时约 10~11 分钟属正常），随后 `git status --short` 全量输出存档，断言无任何 `__pycache__` 行。不要求 `.devin/` 等其他 untracked 消失。
6. **边界**：`git diff --check`；四集合检查；`git diff .gitignore` 确认纯追加；`tools/` 零 diff。
7. **收口**：只暂存 `.gitignore` 与本卡 workspace 自有工件并 commit；coder 自己写 findings/lesson_candidates 行与 `done.coder.md` 四行小结，发 `DONE task=DRILL_02 role=coder batch=C1 status=READY_FOR_REVIEW evidence=...,commit=SHA next=monitor` 即停。`progress.md` 的日志与 E-ID 登记由 scribe 独占补登，coder 不写。

**已知 RED / 停止边界**：追加段后若 AC-1 仍 exit 1（如被在先否定规则覆盖）或 AC-2 仍见 `__pycache__`，不得改 `tools/`、不得删 `__pycache__/` 目录凑判据——记 F-ID 发 BLOCKED 交监工。

**checker 小审输入**：`.gitignore` 追加段 diff；check-ignore 前后两份 verbatim；测试套件尾部输出与 exit 码；`git status --short` 全量；四集合边界；commit SHA。

## 整卡收束

light Recipe 不设 CONSTRUCTION_DONE 复核闸升级：C1 经 checker 小审、scribe 汇总 `progress.md` 后进 R1（lesson + consistency 两路，由监工按 relay_plan 拉 reviewer），R1 闭合后 F1 scribe 备料收口。施工者不进入复核，复核者只读不改。
