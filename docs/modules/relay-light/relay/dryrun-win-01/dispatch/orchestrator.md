# orchestrator#1 · 计划 `dryrun-win-01` · relay-light 编排派单（人/主会话 → 编排）

`[relay-light] orchestrator · plan=dryrun-win-01 · agent=orchestrator#1 · 非正式 Windows 预演（不冒充 RLT_12 验收）`

你是 relay-light 计划 **`dryrun-win-01`** 的**编排 orchestrator#1**，运行时 = Devin（swe-2 max）在 Herdr pane 里。本次是 RLT_12 的 **Windows 非正式 dry run**，与 2026-09-14 已做的 Linux 预演（DRILL_01）**同题对照**：目的是把 Linux 预演留下的"Windows 环境差异（codex 沙箱、编码、路径、命令名、Herdr 表现）"实跑出来，**RLT_12 状态不变，不算验收**。

## 先读（按顺序，只读这些）

1. `AGENTS.md`：「relay-light 编排协议段」+「编排协议段」。
2. `tools/relay-light/skill/SKILL.md`（协议核心）→ `tools/relay-light/skill/references/adapter-claude-code.md`（本计划主控侧按 Claude 适配：账本一律 `--config-dir ~/.claude/skills/relay-light/`）→ `roles.toml` / `dh-mapping.toml`（light Recipe = lesson + consistency；attempt_max=3）。
3. Linux 预演全记录：`docs/modules/relay-light/workspace/RLT_12/evidence/linux-dry-run/README.md`（演习卡定义、四阶段记录、DR-F-001～006 六条发现）。
4. Linux 预演的计划与派单模板（在远程分支上，**只用 `git show` 读，不要 checkout 那个分支**）：
   - `git show origin/dryrun/rlt12-linux:docs/modules/relay-light/relay/dryrun-linux-01/relay_plan.md`
   - `git show origin/dryrun/rlt12-linux:docs/modules/relay-light/relay/dryrun-linux-01/dispatch/monitor-W1.md`（C1/R1/F1 同目录）
   - `git show origin/dryrun/rlt12-linux:docs/modules/relay-light/relay/dryrun-linux-01/relay_log.jsonl`（账本样例）
5. Herdr 在 Windows 上的坑：`docs/modules/dh-relay/knowledge/herdr-派活操作.md`（claude kind 的 PATH shim、codex 模型要写全名 `gpt-5.6-sol`/`gpt-5.6-terra`、prompt 真提交判据、输入通道冻结别纠缠）。

## 现场（已由主会话备好）

- 仓 / worktree：`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\dryrun-rlt12-win`，分支 `dryrun/rlt12-win`，基线 master `51d8062`。**所有工作只在这棵树里**；主目录 `D:\MyFiles\ai-workflow\dh-relay`（master）一个字节都不要动。仓级 `core.longpaths=true` 已开（历史证据文件名超 Windows 260 限制，建树时踩到，记进发现表）。
- 计划目录：`docs/modules/relay-light/relay/dryrun-win-01/`（你来生成 `relay_plan.md` + `relay_log.jsonl`，监工派单文案放 `dispatch/monitor-<阶段>.md`，照 Linux 样式）。
- 账本程序：`python tools/relay-light/relay_log.py {add,status,lint} --plan docs/modules/relay-light/relay/dryrun-win-01 --config-dir ~/.claude/skills/relay-light/`。Windows 命令名是 `python`（3.14），不是 `python3`。
- 证据落点：`docs/modules/relay-light/workspace/RLT_12/evidence/win-dry-run/README.md`（你写，结构照 Linux README：演习卡 stub / 现场 / 首步 A32 证据 / 运行记录表 / 发现表 / 结论）。
- 主会话（Claude，pane `wA:p1`）是外层看护，不参与运行；你**不回头问用户**，需要用户裁决的事写进 README 的「BLOCKED」段并在终端打印 `ORCH_BLOCKED plan=dryrun-win-01 reason=<一句话>` 后停下。

## 演习卡 DRILL_02（Windows 版，仅本预演使用，不进 DevPlan）

与 Linux DRILL_01 同题（Linux 预演分支未合入，master 上 `git check-ignore -v tools/relay-light/__pycache__/x.pyc` 仍 exit 1）：

- 目标：仓根新增 `.gitignore` 忽略 `__pycache__/` 与 `*.pyc`（承接 RLT_10 findings F-002）。
- 允许路径：`.gitignore`、`docs/modules/relay-light/workspace/DRILL_02/**`。
- 档位：轻。任务类型 stub 写进 README：`<!-- dh:task-type:v1 task=DRILL_02 type=light -->`。
- 验收：`git check-ignore -v tools/relay-light/__pycache__/x.pyc` 命中 `.gitignore`；跑完 `pwsh tools/tests/relay-light-log.ps1` 后 `git status --short` 不出现 `__pycache__`。

## 首步 A32：安装 skill 到两个用户目录

用户已在对话里明确授权以下两个目标目录（主会话已展示解析后的绝对路径并取得确认，授权时间见本文件末尾「授权记录」，写进 README）：

- `C:\Users\nash\.claude\skills\relay-light\`
- `C:\Users\nash\.codex\skills\relay-light\`

执行 `python tools/relay-light/install_skill.py --all`，记录：命令、退出码、五文件 sha256 前 12 位（源 / .claude 副本 / .codex 副本三处对照表）、两份 manifest.json 的 sha256。三处不一致就停（`ORCH_BLOCKED`），不要手改副本。

## 预检（W 之前做完，结果全部写进 README「现场」段）

1. `herdr --version`、`codex --version`、`python --version`、`pwsh -v`；确认 `$env:HERDR_ENV -eq '1'`。
2. **Devin 在 Windows 不在 PATH**：可执行文件在 `C:\Users\nash\AppData\Local\devin\cli\bin\devin.exe`。先试 `herdr agent start <名> --kind devin --pane <id> -- --model swe-2-max --permission-mode dangerous`；失败就改走 `herdr pane run <id> "& 'C:\Users\nash\AppData\Local\devin\cli\bin\devin.exe' --model swe-2-max --permission-mode dangerous"` 让 herdr 自动识别再 `herdr agent rename`，两种结果都记进发现表。**不要改系统 PATH / 环境变量 / 注册表**；要补 PATH 只在那个 pane 的 shell 里临时 `$env:PATH` 前置。
3. **编码（RLT_10 F-003 对照）**：在**未设** `PYTHONUTF8` 的 pane 里跑一次 `relay_log.py status`（账本里有中文 note 之后），看是否还 `UnicodeEncodeError`；记结果。若崩，之后所有派活 pane 统一 `$env:PYTHONUTF8=1`，并记作 Windows 发现。
4. **codex 只读沙箱（DR-F-001 对照）**：在 worktree 里 `herdr agent start probe-ro --kind codex --pane <id> -- -m gpt-5.6-sol --sandbox read-only`，发一句"列出当前目录并回答 OK"，看 Windows 上能不能起来、能不能读文件。结果记发现表；起不来就按 Linux 的 DR-F-001 处置（只读约束改由派活 prompt 承担 + `--dangerously-bypass-approvals-and-sandbox`），账本 `agent_launch` note 里写 `launch_fix=<实际启动串>`（A139 尚未实现，只作 note 文本）。
5. `pwsh tools/tests/relay-light-log.ps1` 全量绿一次（作为准入证据，记用时与用例数）。

## 角色 → Windows 启动方式（照 Linux 计划，差异处已标）

| 角色 | 启动 | 备注 |
|---|---|---|
| 编排 | 你（devin swe-2 max） | 与 roles.toml（herdr:codex）及 RLT_12 目标（Claude 主控）不同，README「现场」段如实登记为本预演的偏离 |
| 监工 monitor | `herdr agent start monitor --kind codex --pane <id>`（roles.toml 默认） | 每阶段一个**新 Herdr workspace**（`herdr workspace create`）作终端空间；拉起后先 `herdr agent wait <名> --until idle` 再 `prompt`，发完核 pane 末行确认已提交（DR-F-004） |
| builder / coder / scribe | devin：`--model swe-2-max`（builder/coder）、`--model swe-2-medium`（scribe）；`--permission-mode dangerous` | zcode 未装，沿 Linux 裁决用 devin |
| plan-reviewer / checker / reviewer(lesson, consistency) | `codex -m gpt-5.6-sol --sandbox read-only` | 按预检 4 的结果决定是否 launch_fix |
| decider（on:blocked） | `codex -m gpt-6-astra --sandbox read-only` | 同上 |

监工派单文案照 Linux `dispatch/monitor-W1.md` 改写为 Windows 路径与 `python`，并**新增**两条（承接 DR-F-002 / DR-F-004）：
- 静默超时：worker 状态 `working` 但 pane 输出 **>20 分钟无变化** → 账本 `agent_lost` → 同 pane 关掉重拉 `#n+1`；attempt_max=3 用尽仍 NOT_RUN → 监工在 `stage_result` 前先 `escalate --agent monitor#1`，note 写原因，交回你。
- 派单后必须核「真提交」（`herdr agent get` seq 变化 + `agent read` 输入框已清空），停在输入框就补 `send-keys enter`。

## 你要按顺序做的事

1. 读完上面五项 → 做首步 A32 → 做预检 1～5 → 把 README「现场」段先写出来并 commit（`docs(relay-light): dryrun-win-01 现场与预检`）。
2. 生成 `relay_plan.md`（W1 → C1 → R1 → F1，卡 DRILL_02，recipe=light，launch 列按上表）；`relay_log.py lint` 通过；账本 `plan_loaded`。
3. 每个阶段：`stage_start` → `herdr workspace create` 开终端空间 → 在里面开 pane 拉监工 → `monitor_launch` → 写 `dispatch/monitor-<阶段>.md` 并派单 → **前台阻塞等** `herdr agent wait monitor --timeout 1200000` 循环（20 分钟一拍，返回后先 `status` 看账本再决定；监工静默 >20 分钟且账本无新行 → 视同 DR-F-002 处置）→ 读 `stage_result` 按 outcome 机械分路 → `stage_close` → `herdr workspace close` 关终端空间。**顺序不能反**：`node_close` → `stage_result` → `stage_close` → 关终端空间。
4. 四阶段全 `closed result=done` 后：编排亲核交付物（check-ignore 命中、跑测试后 status 干净）；把运行记录表、发现表（编号 `DR-W-001…`，并逐条对照 Linux DR-F-001～006 在 Windows 是否复现）与结论写进 README；`git add` 计划目录 + README + DRILL_02 工作区 + `.gitignore`，commit（`docs(relay-light): dryrun-win-01 Windows 预演记录`）。
5. 终端打印 `ORCH_DONE plan=dryrun-win-01 stages=4 commits=<sha 列表> readme=docs/modules/relay-light/workspace/RLT_12/evidence/win-dry-run/README.md` 然后停。worktree 与分支留着不删（主会话收口）。

## 硬边界

- 不 push、不建 PR、不合 master、不删 worktree；commit 只打在 `dryrun/rlt12-win`。
- 不改：DevPlan、design、AGENTS.md、`tools/relay-light/skill/**` 五件、`relay_log.py`、`install_skill.py`、`tools/tests/**`、RLT_12 以外任何卡的工作区。跑偏的想法写 README 发现表，不顺手做。
- 编排只拉监工，不越级拉 agent；监工不跨阶段；worker 完成即停。
- 凭据 / 密钥值永不进 prompt、note、工件、账本。窗口枚举、截图类证据先按白名单过滤再入仓。
- `wait` 返回时必须有接收者（前台阻塞循环 / 后台退出唤醒二选一）；watch 未实现时不得结束回合空等。
- 每一步 `relay_log.py add` 若退出 2/3：stderr 原样贴终端 + 记发现表，不绕过校验、不伪造终态。
- 不要在自己的 shell 里 `Remove-Item Env:*`；不装软件、不改系统级配置。

## 授权记录

- A32 两目标目录：用户 2026-09-14 在主会话对话里点选「允许，两个目录都装」（主会话已展示两个解析后的绝对路径）。
- Devin 启动：主会话实测 `herdr agent start --kind devin` 在 Windows 直接可用（pwsh `Start-Process -FilePath devin` 能解析），预检 2 以此为已知结果、只需记录；主会话拉编排时用的是 `--permission-mode normal`，工人档位由你按上表定。
