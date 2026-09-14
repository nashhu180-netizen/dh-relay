<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — DRILL_02 仓根 .gitignore 忽略 Python 副产品（RLT_12 Windows 非正式预演）

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DRILL_02 | relay-light 计划 `dryrun-win-01`（非正式预演） | [演习卡 README](../RLT_12/evidence/win-dry-run/README.md) §演习卡 DRILL_02 |

- **DevPlan / GitHub 户头**：本卡不在 DevPlan 任务表内、仅本次 Windows 非正式预演使用，卡状态不计入 RLT_12。GitHub 协作步骤（Issue/push/PR/CI/服务端合并）已获用户整体豁免，记录见演习卡 README 卡段 `GitHub-flow: user-waived (2026-09-14, scope=dryrun-win-01 全部预演工件与 DRILL_02)`（落盘 commit `8e878c6`）；该豁免仅限 GitHub-flow 一节，不推及 D-start、verify、验收、发布等其他闸。
- **施工现场**：`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\dryrun-rlt12-win`（分支 `dryrun/rlt12-win`，基线 master `51d8062`，派单 commit `1e1b4d7` 在其上）。
- **档位 / Recipe**：轻；`task_type=light`（演习卡内 `dh:task-type:v1` stub 冻结），R 阶段 = 教训 + 一致性两路。

## 目标 (Outcome)

仓根 `.gitignore` 追加忽略段覆盖 `__pycache__/` 与 `*.pyc`，使 Python 测试副产品不再以 untracked 进入 `git status`——承接 RLT_10 findings F-002（复核期 `.pyc` 曾入树、后被移除）。

## Zero-context 自查

construction worker 进入本 worktree 后第一个 Git 动作是 `git rebase master`；若被他人 WIP 拒绝，按派单纪律不 stash、不清理，核查 `git merge-base HEAD master` 是否已等于 master 顶点并如实记 progress。随后读仓根 `AGENTS.md`、本文件、`task_plan.md`、`progress.md`、`findings.md` 与演习卡 README；只读盘点 `.gitignore` 现状与 `tools/tests/relay-light-log.ps1` 的调用方式。演习卡 README 决定 allowed-paths 与验收口径；如合同与现状冲突，只落 `findings.md` 并发 BLOCKED，不得越权修改。

## 完成条件 ★必写

逐字承接演习卡 README「验收」行：

### AC-1

> `git check-ignore -v tools/relay-light/__pycache__/x.pyc` 命中 `.gitignore`

判据：exit 0，输出列出 `.gitignore` 中实际命中的规则行（形如 `.gitignore:<line>:<pattern>  tools/relay-light/__pycache__/x.pyc`）。目标路径不要求真实存在，`check-ignore` 按路径名判。

### AC-2

> 跑完 `pwsh tools/tests/relay-light-log.ps1` 后 `git status --short` 不出现 `__pycache__`

判据：测试套件真实执行到底（准入实测约 10~11 分钟，164+7 项）；其后 `git status --short` 全量输出无任何含 `__pycache__` 的行。现场既有 untracked（`.devin/`、dispatch 文件等）属他人现场，与本判据无关，不要求消失也不许清理。

## 边界 (Boundaries)

- In scope 闭集：仓根 `.gitignore`、`docs/modules/relay-light/workspace/DRILL_02/**`。
- Out of scope：不改 `tools/` 下任何程序与测试、relay 计划/账本/派单、DevPlan、design、AGENTS、其他 workspace；不 stash、不清理他人 WIP（`relay_log.jsonl` 未暂存改动、`.devin/`、`__pycache__/` 等）。
- 本卡是非正式预演卡：无 DevPlan 状态列可改；测试绿、checker PASS、reviewer 结论均不等于 verify、验收、push、PR、CI 或 merge。
- 每个 worker 发完自己的 DONE 信号即停；BLOCKED 交 monitor→编排裁决，worker 不自选边、不憋死。

## 触及子系统

- `repository hygiene`：仓根 `.gitignore` 忽略规则（只在末尾追加段，不动既有行）。
- `relay-light test entry`：`tools/tests/relay-light-log.ps1` 仅作验收驱动器被调用，不修改。
