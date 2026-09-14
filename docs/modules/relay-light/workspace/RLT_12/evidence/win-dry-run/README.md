# RLT_12 Windows 预演（非正式 dry run，2026-09-14）

> 与同日 Linux 预演（DRILL_01，见 `../linux-dry-run/README.md`）同题对照。本目录只是 RLT_12 的 Windows 预演证据，**不冒充验收**；RLT_12 状态不变。编排 = Devin（swe-2 max）orchestrator#1，派单见 `docs/modules/relay-light/relay/dryrun-win-01/dispatch/orchestrator.md`。

## 演习卡 DRILL_02（不在 DevPlan 任务表内，仅本预演使用）

- 目标：仓根 `.gitignore` 追加忽略 `__pycache__/` 与 `*.pyc`（承接 RLT_10 findings F-002）。
- 允许路径：`.gitignore`、`docs/modules/relay-light/workspace/DRILL_02/**`。
- 档位：轻。**任务类型**：轻量 <!-- dh:task-type:v1 task=DRILL_02 type=light -->（Recipe 档位来源；DevPlan 无此卡，以本 stub 代替）
- `GitHub-flow: user-waived (2026-09-14, scope=dryrun-win-01 全部预演工件与 DRILL_02)`——授权依据：编排派单硬边界明示「commit 只打 `dryrun/rlt12-win`，不 push、不建 PR、不合 master」，即用户对本工作项的 GitHub 协作步骤（Issue/push/PR/CI/服务端合并）整体豁免；本卡与预演工件均不离开本地分支。
- 验收：`git check-ignore -v tools/relay-light/__pycache__/x.pyc` 命中 `.gitignore`；跑完 `pwsh tools/tests/relay-light-log.ps1` 后 `git status --short` 不出现 `__pycache__`。
- 基线实测：`.gitignore` 已存在（906B）但不覆盖 `__pycache__`——`git check-ignore` exit 1，`tools/relay-light/__pycache__/` 为 untracked。

## 现场

- 仓 / worktree：`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\dryrun-rlt12-win`，分支 `dryrun/rlt12-win`，基线 master `51d8062`（派单 commit `1e1b4d7` 在其上）。主目录（master）未动。
- 计划与账本：`docs/modules/relay-light/relay/dryrun-win-01/`（`relay_plan.md` + `relay_log.jsonl` + `dispatch/`）。
- 编排：Devin swe-2 max（本 README 写入者），Herdr pane `wA:p2`。**与 roles.toml（herdr:codex）及 RLT_12 目标（Claude 主控）不同，登记为本预演的偏离**——目的是在 Windows 上实跑 relay-light 流水本身。
- 主控侧适配：adapter = `references/adapter-claude-code.md`，账本一律 `--config-dir ~/.claude/skills/relay-light/`；Windows 命令名 `python`（3.14），非 `python3`。
- 外层看护：主会话 Claude，pane `wA:p1`，不参与运行。
- `core.longpaths=true`：建树时历史证据文件名超 Windows 260 限制踩到，已在仓级开启（主会话备好现场时记录，见发现表）。

### 版本与身份（预检 1）

| 项 | 值 |
|---|---|
| herdr | 0.8.2 |
| codex | codex-cli 0.154.0 |
| python | 3.14.0（命令名 `python`） |
| pwsh | 7.6.6 |
| HERDR_ENV | `1`（workspace `wA`，编排 pane `wA:p2`） |
| shell | 编排自身 shell 为 Git Bash；Herdr pane 内为 pwsh |

### Devin 启动（预检 2）

- 主会话实测 `herdr agent start --kind devin` 在 Windows 直接可用（pwsh `Start-Process -FilePath devin` 能解析），按派单授权记录采用为已知结果。
- 编排侧实测 `where.exe devin` 可解析到 `C:\Users\nash\AppData\Local\devin\cli\bin\devin.exe`（与派单"不在 PATH"的预期不同——本机 PATH 已含该目录；不改系统配置，如实登记为环境差异）。
- worker 档位：builder/coder = `devin --model swe-2-max --permission-mode dangerous`，scribe = `devin --model swe-2-medium --permission-mode dangerous`。

### 编码（预检 3，对照 RLT_10 F-003）

- 方法：账本 `plan_loaded` 落中文 note 后，在 Herdr pane `wB:p2`（pwsh，`PYTHONUTF8` 实测为空）直跑 `relay_log.py status`。
- 结果：**无 UnicodeEncodeError**，中文（计划/卡/当班写入者/阶段名）正常输出。F-003 在 Windows + Python 3.14 上**未复现**，派活 pane 不需要设 `PYTHONUTF8=1`。

### codex 只读沙箱（预检 4，对照 DR-F-001）

- `herdr agent start probe-ro --kind codex --pane wB:p1 -- -m gpt-5.6-sol --sandbox read-only`：正常启动（interactive_ready，idle）。
- prompt「列出当前目录并回答 OK」→ agent 跑 `Get-ChildItem` 列出 worktree 根目录并回答 OK，读文件正常。
- 结论：`--sandbox read-only` 在 Windows + codex-cli 0.154.0 **可用**，DR-F-001（Linux bwrap loopback 失败）**未复现**。各 reviewer 按 plan launch 列直拉 read-only，无需 `launch_fix`。

### 准入测试（预检 5）

```
$ pwsh tools/tests/relay-light-log.ps1
Ran 164 tests in 630.526s — OK (skipped=2)
Ran 7 tests in 3.164s — OK
EXIT=0  ELAPSED≈644s
```

## 首步：install_skill.py --all（A32）

用户 2026-09-14 授权两个目标目录：`C:\Users\nash\.claude\skills\relay-light\`、`C:\Users\nash\.codex\skills\relay-light\`（授权记录见编排派单末尾）。

```
$ python tools/relay-light/install_skill.py --all
installed: C:\Users\nash\.claude\skills\relay-light
installed: C:\Users\nash\.codex\skills\relay-light
exit=0
```

五文件 sha256 前 12 位（源 / .claude 副本 / .codex 副本三处相同）：

| 文件 | sha256[:12] |
|---|---|
| SKILL.md | bcf7aa4721e4 |
| references/adapter-claude-code.md | 55e88780a5c6 |
| references/adapter-codex.md | 7c95a337c8e7 |
| roles.toml | 61e55dc27660 |
| dh-mapping.toml | dcad3731699d |

manifest.json 两侧各一份（.claude `44a347ac6d0f`，.codex `ce98e8219e63`，内容含各自路径故不同，属安装器约定）。

## 预演运行记录（2026-09-14，Windows，非正式，不计 RLT_12 状态）

（四阶段跑完后填写）

### 发现（供 RLT_12 正式跑与协议修订参考）

（跑完后填写，编号 DR-W-001…，逐条对照 Linux DR-F-001～006）

## BLOCKED

（无）
