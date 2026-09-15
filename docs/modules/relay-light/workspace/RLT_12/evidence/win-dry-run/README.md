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

计划 `docs/modules/relay-light/relay/dryrun-win-01/`，分支 `dryrun/rlt12-win`，账本 51 行、四阶段全部 `closed result=done`。编排为 Devin swe-2 max（`wA:p2`，只分发不施工）；每阶段一个 codex 监工在独立终端空间，worker 各自一 pane。

| 阶段 | 监工空间 | 关键事件 | 用时 | 结果 |
|---|---|---|---|---|
| W#1 | wC | builder#1 devin 一次交付七件套+task_plan（c9d7bae）；plan-reviewer#1 read-only 沙箱拒写 review.plan.md → `blocked`→`agent_lost`；plan-reviewer#2 换 `workspace-write` 上线 → FAIL(P1-001 信号共写 progress) → builder 两轮整改（37370a7、4a718d9）→ 复审3 PASS | 20:44–21:41 | done（c9d7bae…4a718d9，编排补豁免 8e878c6） |
| C#1 | wD | coder#1 devin 一次过：`.gitignore` 追加段 + check-ignore 命中 line30 + 测试 164+7 OK（85af7fb）；checker#1 独立复跑测试 PASS 无 P1；scribe#1 汇总 progress | 21:44–22:16 | done（85af7fb…6733688） |
| R#1 | wE | lesson#1 PASS P2=1 / consistency#1 PASS P2=0 并行（codex workspace-write）；scribe 汇总 | 22:19–22:28 | done（8348142） |
| F#1 | wF | scribe#1 落 as-built + HANDOFF_READY | 22:29–22:36 | done（a73d775），未 push/PR |

交付物验证（编排亲核，2026-09-14 22:4x）：`git check-ignore -v tools/relay-light/__pycache__/x.pyc` → `.gitignore:30:__pycache__/` 命中；`pwsh tools/tests/relay-light-log.ps1` 全绿（164 用例 363s OK skipped=2 + 7 用例 2.3s OK，exit 0）后 `git status --short` 无任何 `__pycache__`/`*.pyc` 行。

### 发现（供 RLT_12 正式跑与协议修订参考）

| # | 发现 | 影响 | 建议 |
|---|---|---|---|
| DR-W-001 | codex `--sandbox read-only` 在 Windows + codex-cli 0.154.0 **能启动、能读**（对照 DR-F-001 Linux bwrap 起不来 = 未复现），但**拒写一切文件**——reviewer 的产出 `review.plan.md` 落不了盘，实例对本节点交付物等同失联 | plan-reviewer#1 blocked→agent_lost，换 `--sandbox workspace-write` + prompt 约束（只准写列名产物）后全阶段顺畅 | Windows 上 codex 复核/决策角色的 launch 档定为 `workspace-write`，"只读"约束由 prompt 承担；`read-only` 仅适合纯问答探测。launch_fix 记 `agent_launch` note 即可，不用 plan_amend |
| DR-W-002 | 编排派单照 Linux 写法给的 `escalate --agent monitor#1 decider=monitor#1` **不合法**：A69 要求 helper 恰为 `decider=decider#<n>`/`strategist=strategist#<n>`；监工按纪律原样贴 stderr 停下，未绕过（对照 DR-F-003：Linux 提议的 "monitor#1 escalate" 出口在现行校验下不存在） | 一次编排→监工往返修正 | 真正的合法出口 = `blocked → agent_lost`（迁移表内合法）再重拉；派单模板与 SKILL 文档应把这条写死，别再发明 monitor helper |
| DR-W-003 | `herdr agent prompt` 对新启动 codex 发长中文派单，4 次监工派单中 3 次（W1/C1/F1）停在输入框未提交，补 `send-keys enter` 即提交；R1 一次直过（DR-F-004 在 Windows **复现**，约 75% 命中） | 每次约 30~60s 空转，有纪律兜住 | 「先 wait --until idle 再 prompt + 发后核真提交（seq+working+read 输入框空）」是必要纪律，建议保留并写进所有派单 |
| DR-W-004 | `checkpoint` 不能落 terminal agent（A60：对 done 的 builder#1 写 checkpoint 被拒） | P1 整改路由须挂在 live reviewer 名下 `routed_to=<worker>#<n>`，实际整改 prompt 发 worker pane | 已写进本计划 C1/R1 派单纪律段；建议沉淀进 adapter |
| DR-W-005 | 本机 `where.exe devin` 可解析（`AppData\Local\devin\cli\bin`），与派单"不在 PATH"的预期不同；`herdr agent start --kind devin` 实测直接可用，devin worker（builder/coder/scribe ×4 实例）全部一次拉起、无 Connection lost（对照 DR-F-002 未复现） | 无阻塞 | 登记为环境差异；正式跑维持 `--permission-mode dangerous` + 静默>20min→agent_lost 纪律 |
| DR-W-006 | 编码：`PYTHONUTF8` 未设的 pwsh pane 里 `relay_log.py status` 中文输出正常，无 UnicodeEncodeError（对照 RLT_10 F-003 在 Windows + Python 3.14 **未复现**） | 派活 pane 无需注入 PYTHONUTF8 | 如实登记；若正式跑换 Python 版本需重测 |
| DR-W-007 | 裸 `herdr agent start --kind codex`（监工）实际跑的是**账号默认模型 gpt-6-astra medium**，不是 roles.toml 监工档语义里的"低档" | 四阶段监工均跑在高档模型上（预演可接受，正式跑算偏离） | 正式跑在 launch 列/启动串显式 `-m` 钉模型档 |
| DR-W-008 | worker 进场 `git rebase master` 被**同 worktree 内他人 WIP** 拒绝（builder、coder 两次命中）：活账本 `relay_log.jsonl` 实时追加 + untracked 文件本身就是 WIP 源；merge-base 核查证实 HEAD 已含 master 顶点，按 no-op 处置 | 不阻塞，但每棒都撞一次 | task_plan 契约头把「rebase 被 WIP 拒 → merge-base 等价核查」写成标准处置（本卡 task_plan 已这么做，效果良好） |
| DR-W-009 | DR-F-005（后台 wait 进程被低内存杀掉）在 Windows 未复现：编排侧 devin 后台 `herdr agent wait` 与前台阻塞循环全程正常 | 无 | 保留前台阻塞循环为主、拍子内巡账本为辅的现行做法 |
| DR-W-010 | DR-F-006 对照：plan-review 的 FAIL 仍是合同/措辞类 P1，但本次抓到**真问题**——GitHub-flow 豁免确实没记录、信号约定确实撞 A67 写入者独占 | light 档 plan-review 证明不是橡皮图章 | 不建议收窄到「三项核查」；保留写入者边界与豁免核查。顺带产出更优约定：完成信号改 `done.<role>.md` 独立文件，progress.md 归 scribe 独占——建议回写协议 |
| DR-W-011 | GitHub 协作闸对演习卡的适用性：预演工件按派单硬边界不走 Issue/PR，但**豁免必须显式记录**才可核验（plan-review P1 逼出来，编排补 `GitHub-flow: user-waived` 行于本 README 卡 stub，commit 8e878c6） | 一次性补录 | 正式/预演任务卡 stub 建议预置 `GitHub-flow:` 字段位 |

结论：relay-light 0.1.0 的账本、状态机、五阶段控制事件与 light Recipe 双路复核在 **Windows 上端到端跑通**；真实异常路径（read-only 拒写产出 → agent_lost → launch_fix 重拉、A69/A60 拒错后校正、FAIL→checkpoint→整改→复审 PASS）全部按协议语义工作。与 Linux 预演相比，Windows 侧 codex 沙箱可用但语义不同（能读不能写），编码坑未复现，devin 拉起无障碍，prompt 吞回车坑复现。RLT_12 正式跑的剩余注意点集中在：复核角色 launch 档改 workspace-write、监工显式钉模型档、派单模板修正 escalate/checkpoint 边界写法。
