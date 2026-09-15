<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_12 Windows Claude 首个真计划端到端 demo

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：你是 RLT_12 的执行者。RLT_12 的「施工」= **在 Windows 上用 relay-light 跑一份真计划并取证**，不是改程序。进入 `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12` 后第一个 Git 动作是 `git rebase --autostash master`；先读仓根 `AGENTS.md`、`brief.md`、本文件、`progress.md`、`findings.md`。只在 `brief.md`「允许路径」闭集内落盘；偏离路线只记 `progress.md` / `findings.md`，不回头改本文件，不改 DevPlan（除第 8 步的两处户口回填）、不改 `design/`、不改 `tools/`。不自行 verify、push、PR、merge 或部署。

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `AGENTS.md`（宪章 7 条 + 「relay-light 编排协议段」+ 「编排协议段（worker 铁律）」） | 入口/出口/需求境/确认/复核/密钥/worktree 七条硬规则；被派进本仓的 worker 的判定标头与停棒纪律 |
| C-002 | [DevPlan §RLT_12](../../dev_plan/P1-RelayLight-开发方案.md#rlt_12--windows-claude-首个真计划端到端-demo) + §3.1 RLT_12 行 + 头部 `dh:status` | 目标/非目标/8 条验收口径/允许路径/档位/`task_type=normal`/实施提示（首步 A32、准入证据、收尾顺序） |
| C-003 | [DevPlan §RLT_21](../../dev_plan/P1-RelayLight-开发方案.md#rlt_21--linux-预演回流监工异常出口启动修正记账静默超时与派活纪律决策模式门) | 计划内唯一业务卡的目标/非目标/7 条验收/允许路径/`task_type=normal`——真计划的 W/C/R/X/F 是围绕它跑的 |
| C-004 | `tools/relay-light/skill/SKILL.md` | 十一角色表、五阶段模板（W/C/R/X/F 的节点表与 agent 表原文）、账本用法、控制事件表、两条决策链、planner-amend 模板、10 条硬规则 |
| C-005 | `tools/relay-light/skill/references/adapter-claude-code.md` | Claude Code 侧命令模板（Windows `python` + `--config-dir ~/.claude/skills/relay-light/`）、herdr 开 pane/拉 agent 写法、派活 prompt 模板、等待与接收者三法、stalled 处置 |
| C-006 | `tools/relay-light/skill/dh-mapping.toml` + `roles.toml` | `[stages]` 阶段→dh 节点映射、`[recipes.*]` reviewer 展开、`[limits]`（`rework_max_rounds=2`、`attempt_max=3`）；角色→模型档与 `launch` |
| C-007 | `evidence/linux-dry-run/README.md`（本树） | Linux 预演 DR-F-001～006、四阶段实跑时序与用时、A32 取证格式范例 |
| C-008 | Windows 预演 README `evidence/win-dry-run/README.md`（PR #22 已合入 master `6094887`） | Windows 侧环境差异实测（含 DR-W-001：codex `--sandbox read-only` 在 Windows 能读不能写）；正式跑前必须读，不要把 Linux 结论套到 Windows |
| C-009 | `progress.md` E-001 | A32 首步已完成的原始证据（命令、退出码、五文件 sha256 三处一致、两份 manifest 哈希） |
| C-010 | `docs/modules/relay-light/workspace/RLT_10/`（同模块最近一张标准档卡） | 七件套格式、证据账本写法、批次小审与三路复核登记样板 |

## 全程允许路径闭集与禁改项

只允许修改（逐字承接 DevPlan `dh:allowed-paths:v1 task=RLT_12`）：

- `docs/modules/relay-light/relay/**`
- `%USERPROFILE%/.claude/skills/relay-light/**`
- `%USERPROFILE%/.codex/skills/relay-light/**`
- `docs/modules/relay-light/workspace/RLT_12/**`

另加第 8 步明确授权的 DevPlan 两处户口回填（§3.1 RLT_12 行 + 头部 `dh:status`），除此之外 DevPlan 不动。

禁止修改：`tools/relay-light/**`（含 `relay_log.py`、`install_skill.py`、`skill/` 源）、`docs/modules/relay-light/design/**`、`AGENTS.md`、其它卡工作区、现役 Runner（`tools/runner/`、`tools/host/`、`tools/contracts/`）。若实跑证明必须改禁改路径才能继续，**停下登记 `findings.md` 并交主会话/用户裁决**，不得自行扩权。

## 关键决策（一句话各一行）

- Worktree：是，分支 `wt/RLT_12`，目录 `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12`，基线 master `51d8062`，client=claude-code。
- 接力计划：`plan_id=rlt12-win-01`，目录 `docs/modules/relay-light/relay/rlt12-win-01/`；账本程序 = 本树 `tools/relay-light/relay_log.py`；每次调用带 `--config-dir ~/.claude/skills/relay-light/`。
- 主控形态：本会话 Claude Code（Herdr pane `wA:p1`）= 编排 `orchestrator#1`，**只分发不施工**。
- 派子 agent：是。监工 = codex（启动串显式 `-m` 钉模型）；builder/coder = devin `swe-2-max`；scribe = devin `swe-2-medium`；plan-reviewer/checker/reviewer = codex `-m gpt-5.6-sol --sandbox workspace-write`（Windows 上 read-only 能读不能写，见 PR #22 的 DR-W-001）；decider = codex `-m gpt-6-astra`。`roles.toml` 不改，实际启动方式逐节点写在 `relay_plan.md` 的 `launch` 列（Linux 预演同法）。
- 本卡自身复核（≠ 计划内 R 阶段）：RLT_12 `task_type=normal`，按 AGENTS 宪章#5 走**代码轮 1、需求方向、教训**三路；施工者不复核自己的卡。
- 委托节点：按 `references/节点表.md` 默认——S1 brief、E4、E5、E6、E7 派出；判断节点（施工步骤、代码复核收敛、人闸）留主会话（用户 2026-09-14 确认）。

## 施工步骤 (Steps)

### 步骤 1 — A32 首步安装与取证（**已完成**，证据 E-001）

**状态**：已于 2026-09-14 23:30 在本树执行完毕，**不要重跑**。

- 命令：`python tools/relay-light/install_skill.py --all`（cwd = RLT_12 worktree，HEAD `51d8062`）。
- 结果：exit 0；`installed: C:\Users\nash\.claude\skills\relay-light`、`installed: C:\Users\nash\.codex\skills\relay-light`。
- 判据：源 `tools/relay-light/skill/` 与 `.claude` / `.codex` 两副本的五文件 sha256 **三处逐字节一致**；两份 `manifest.json` 各自哈希已记（内容含各自路径故不同，属安装器约定）。
- 原文落点：`progress.md` 证据账本 **E-001**（逐字抄录，非只写路径）。
- 前置授权：DevPlan 实施提示要求「开工前展示 `%USERPROFILE%` 解析后的两个绝对目标并取得用户明确授权」——两个绝对目标即上面两行 `installed:`，用户 2026-09-14 已授权（D-start 授权包，见 `brief.md`）。

**验证命令（任何时候需要复核 A32 时重跑，不改文件）**：

```powershell
python - <<'PY'
import hashlib, pathlib
roots = [r"tools\relay-light\skill", r"C:\Users\nash\.claude\skills\relay-light", r"C:\Users\nash\.codex\skills\relay-light"]
files = ["SKILL.md", r"references\adapter-claude-code.md", r"references\adapter-codex.md", "roles.toml", "dh-mapping.toml"]
for r in roots:
    print("##", r)
    for f in files:
        p = pathlib.Path(r) / f
        print(hashlib.sha256(p.read_bytes()).hexdigest(), f)
PY
```

预期：三组输出的五行哈希两两相同 → A32 通过（完成条件 #1）。

### 步骤 2 — planner 生成 `relay_plan.md` 并 lint 通过

**产出文件**：`docs/modules/relay-light/relay/rlt12-win-01/relay_plan.md`（由另一个 planner agent 生成，**不由本卡 builder 建，也不放进任务工作区**——SKILL.md 硬规则 3 / A98）。

**怎么写**（planner 的合同，本步只登记验收）：

- 第一行 marker 含 `skill=` / `session=` / `recipe=` / `cards=` 等字段；`cards=RLT_21`（用户 2026-09-14 裁决：真计划唯一业务卡）。
- `recipe=` 的唯一来源是 DevPlan 任务卡 `任务类型`——RLT_21 是 `normal`（SKILL.md 硬规则 2，字段缺失必须停下问用户，不得默认）。
- 正文两张固定表头的 markdown 表（节点表 + agent 表），按 SKILL.md 五阶段模板逐段展开：W（builder + plan-reviewer）→ C（每批 coder + checker + scribe，decider `on:blocked`）→ R（reviewer 按 recipe 展开 + scribe 收敛）→ X（如需）→ F（scribe）。
- `launch` 列逐节点写实际启动方式（见「关键决策」派子 agent 一行），`roles.toml` 不改。

**怎么验**：

```powershell
python tools\relay-light\relay_log.py lint --plan docs\modules\relay-light\relay\rlt12-win-01 --config-dir ~/.claude/skills/relay-light/
```

预期：exit 0、stdout `lint: ok`、stderr 空。非 0 时按 stderr 的 `lint: HC-RL-A<n> <message>` 逐条改计划，**不改程序**。lint 绿是开跑前置；把命令与输出原文记 `progress.md`。

### 步骤 3 — 编排按 adapter-claude-code 跑 W→C→R→（X）→F

**执行者**：本会话（`orchestrator#1`），只做三件事——重读计划并为阶段建终端空间拉监工；等监工；读 `stage_result` 按 `outcome` 机械分路（SKILL.md 角色表）。**不越级拉 agent、不做判断题、不缓存计划。**

**3.0 开跑：`plan_loaded`**

```powershell
python tools\relay-light\relay_log.py add --plan docs\modules\relay-light\relay\rlt12-win-01 --node <第一个非 superseded 节点号> --event plan_loaded --agent orchestrator#1 --note "skill=... config_dir=<规范化并百分号编码的配置目录> plan=docs/modules/relay-light/relay/rlt12-win-01" --config-dir ~/.claude/skills/relay-light/
```

必须是账本第 1 行且仅一次；`note` 必须含 `skill=`、`config_dir=`（**规范化并百分号编码**，A135 展开路径即完成条件 #1 之外的「未使用 fixture」证据）与 `plan=`。

**3.1 每个阶段实例的固定序列**

开：`stage_start`（编排，每实例一次，`note` 带 `stage_id=`）→ 建终端空间（herdr workspace，cwd = 该卡 worktree）→ `monitor_launch`（编排，`note` 带 `stage_id=`）→ 监工在空间内派本阶段全部 agent。

收：**`node_close` → `stage_result` → `stage_close` → 关终端空间**（DevPlan 实施提示明写，顺序反了会留占用；正式输入 §5.2.1、§12）。全计划结束后**先关空间再删 worktree**。

- `node_close`（监工）：仅双判据成立才接受——全部在场 agent 有终态 **且** `close` 列 agent 已 `done`。
- `stage_result`（监工）：`note` 必须含 `stage_id=` 与 `outcome=done|blocked|failed|cancelled` 及原因，且在该实例全部节点 `closed` 之后；`outcome=cancelled` 须引用对应 `user_decision`；本阶段发生过 `plan_amend` 时另补 `amend=<方案文件名>` 与 `nodes=`。
- `stage_close`（编排）：前置 = 已见本实例 `stage_start`/`monitor_launch`、全部节点 `closed`、最新 `stage_result` 的 `outcome ∈ {done, cancelled}`，否则退出 2。

**3.2 各阶段要点**

| 阶段 | agent 行（按 SKILL.md 模板） | close | 本卡要留的证据 |
|---|---|---|---|
| W | builder（七件套与 `task_plan.md`）；plan-reviewer（`review.plan.md`，`trigger=on:done:builder`） | `agent:plan-reviewer` | RLT_21 工作区七件套由 **W 阶段 builder** 建（不是本卡建）；plan-review 结论 |
| C | coder + checker 批内同时在场（trigger 留空）；scribe `on:done:coder`；decider `on:blocked` | `agent:checker` | **checker 至少一次纠偏**（完成条件 #7 的 H14 靶子）：`check.C<n>.md` 里要有一条实际打回并被 coder 在批内改正的记录；批内不换人 → 记 `checkpoint`，不新增 attempt |
| R | reviewer 按 `recipe=` 经 `[recipes.<档>]` 展开，每路一行、trigger 留空并行；scribe 在全部 reviewer `done` 后由监工拉起收敛 `review.md`（空 trigger 是模板写明的约定例外） | `agent:scribe` | RLT_21 是 `normal` → `[recipes.normal].reviewers = ["requirement", "lesson"]`，**展开为 requirement、lesson 两行**。`[stages] R` 的 `dh_nodes` 含 `E1`（代码轮 1）但 recipe 未给它 reviewer 行——落差已登记 `findings.md` F-005，**由主会话在编排时裁决，本计划不自行发明第三个 reviewer 行**；dev-harness 侧「批次小审 = 代码复核轮 1 前移」由 C 阶段 checker 的 `check.C<n>.md` 承担 |
| X | coder（新实例，attempt 从 1 起）+ 被打回的那路 reviewer（`on:done:coder`）+ decider `on:blocked` | `agent:<打回路>` | 仅在 R 打回时进入；轮数上限 `rework_max_rounds=2`，超限停 → strategist → 用户 |
| F | scribe（as-built、提交区、汇报与证据区） | `agent:scribe` | 收口备料 |

**3.3 止损与异常（两套计数独立、不叠加、不互相重置）**

- `attempt_max=3`（节点实例内同一 agent 名重拉上限）；`rework_max_rounds=2`（X 轮数）。任一先到上限即停 → 监工拉 strategist → 输出全局方案或建议停卡 → **永远交用户裁决**。
- `attempt` 只在 `agent_lost` / `cancelled` / 阶段 `failed` 后重拉时 +1；批内 `checkpoint` 往返不增。
- **已知缺口（用户已接受，本卡不修，见 `findings.md` F-001～F-003）**：监工在无 blocked 终态 agent 时写 `stage_result outcome=blocked` 会被 A112 拒；环境性 `NOT_RUN` 只能走 `blocked → agent_lost` 重拉；`launch_fix=` 只是 `note` 文本。遇到就**如实记录实际遭遇**（这是 RLT_21 的输入），不要绕过程序校验、不要伪造终态。

**3.4 派活与等待纪律（adapter 原文）**

- 派活 prompt 首行必须是：`[relay-light] worker · node=<n> · agent=<角色>#<实例> · workspace=<任务工作区>`（AGENTS「relay-light 编排协议段」判定标头）。
- 开 pane：`herdr pane split --current --direction right --cwd <任务 worktree> --no-focus`；**第二次 split 显式传目标 pane，不用 `--current`**。
- claude kind 有 PATH shim 坑：`herdr pane run <pane_id> "claude --permission-mode acceptEdits"` 再 `herdr agent rename <pane_id> <名>`。codex kind 可 `herdr agent start <名> --kind codex --pane <pane_id>` 直接用。
- **等待必须有接收者**：`herdr agent wait` 是阻塞式 CLI，返回那一刻必须有接收者——前台阻塞循环（`--timeout 1200000`）或 Claude 侧 `run_in_background`；watch 未实现时**不得结束回合空等**（SKILL.md 硬规则 8）。Linux 预演 DR-F-005 实测后台轮询进程会被低内存杀掉，编排改用**账本文件事件监听**更稳。
- **stalled 处置**：`herdr agent prompt` 后必须验「真提交」——`herdr agent get <名>` 看 `state_change_seq` 是否变、`status` 是否转 `working`；停在输入框就补 `herdr agent send-keys <名> enter` 再复验；输入通道整体冻结则弃用该实例（账本记 `agent_lost`），开新 pane 拉 fresh 实例。Linux 预演 DR-F-004 实测启动提示会吞掉回车导致空转 1 小时。
- **密钥红线**：凭据/密钥值永不进 prompt、note、工件、账本；pane 截图与窗口枚举类证据**先按白名单过滤**，不靠事后扫描兜底（AGENTS 宪章#6、SKILL.md 硬规则 1）。

### 步骤 4 — 证据清单（按 8 条完成条件逐条对齐，边跑边落 `progress.md`）

每条证据先登记 `progress.md` 证据账本（E-ID + 类型 + 命令/路径 + 结果 + 支撑结论），再从 `review.md` 引用；禁止悬空描述符。

| 完成条件 | 要展示的东西 | 取证命令 / 落点 |
|---|---|---|
| #1 A32（机器证） | 源与两侧副本五文件 sha256 三处一致 + 两份 manifest 哈希 | E-001（已落）；需复核时跑步骤 1 的验证脚本 |
| #2 A30（机器证） | 所有阶段 `closed`、节点 `closed`、launch 全有终态 | `relay_log.py status --plan <plan_dir> --config-dir ~/.claude/skills/relay-light/` **全文**；另存 `--json` 一份 |
| #3 A31（机器证） | 真账本每行 schema 与全时序合法 | `relay_log.py lint --plan <plan_dir> --config-dir ~/.claude/skills/relay-light/` → `lint: ok` exit 0；`relay_log.jsonl` **全文**入证据目录 |
| #4 H1（人判） | 「Claude 主控真计划是否省事、值得继续」 | 全程用时表（按阶段）、编排实际操作次数、`relay_plan.md` **全文**、产出清单（RLT_21 的 diff / 文件清单） |
| #5 H13（人判） | 「三层结构、阶段换监工与编排瓶颈」 | **编排 pane 操作序列**（逐条命令 + 时间戳）、**终端空间建立/关闭记录**（每阶段一个 workspace，何时建何时关）、每阶段监工实例与其存活区间 |
| #6 H5（人判） | 「仅看 status 判断阶段、轮到谁、阻塞与静默时长」 | **status 两次输出**：至少一次在运行中（有在场 agent / 阻塞态）、一次在收口后；两次都留全文 |
| #7 H14（人判） | 「checker 纠偏效果、批内不换人和成本」 | **checkpoint 序列**（账本中该批 `checkpoint` 行）与对应 **`check.C<n>.md` 文件**；证明打回后是同一个 coder 实例（attempt 未 +1） |
| #8 H10（人判） | 「只给账本能否复原现场」 | 单独做一份「只给账本」展示：只提供 `relay_log.jsonl`，不给 pane 记录/计划外说明，请用户复原现场 |
| 通用 | 「用默认安装副本而非 fixture」 | **adapter 命令原文**（每条 `add/status/lint` 都带 `--config-dir ~/.claude/skills/relay-light/`）+ `plan_loaded` 的 **`config_dir=` 解码路径**（A135 展开并编码记录） |

证据文件落 `docs/modules/relay-light/workspace/RLT_12/evidence/win-real-run/`（本卡允许路径内）。`relay_plan.md` 与账本本身落计划目录，不复制进工作区，证据里写清相对路径。

### 步骤 5 — 本卡自身复核（normal 三路）与收口

1. **施工者不复核自己的卡**（宪章#5）。RLT_12 `task_type=normal` → 代码轮 1、需求方向、教训三路，按 `review.md` 的路径登记表派独立 fresh 复核者。
2. `review.md` 的「完成条件逐条挂证据」表补 Evidence ID 与达成结论；人类签名区 5 条人判（H1/H13/H5/H14/H10）的「验什么/做什么/通过标准」已预生成，**结果列只能由用户在对话中确认后回填，AI 不得预勾**（宪章#4）。
3. 需求境证据（宪章#3）：8 条完成条件里 5 条是人判，必须有「需求/人验项 + 场景操作路径 + 证据 ID + 结论」，且展示的是真实 Herdr 操作与真账本，不是单测（DevPlan 非目标明写「不把单测代替真实 Herdr 操作」）。
4. **收口前 `verify(relay-light):` 由用户确认后才提交**（宪章#2、#4；DevPlan 实施提示明写）。scope 必须是英文 `relay-light`。无 verify 只能标「待验收」。

### 步骤 6 — 收尾顺序与清理

先关终端空间，再收工作树；`git log` 能在主树看到 squash/verify 提交、主树 `workspace/RLT_12/` 有最新现场件之后，才允许 `git worktree remove` / `dh wt done`（动作-D「删树前先确认主树已包含完整记录」）。

### 步骤 7 — `dh relay-light` 自检

```powershell
dh relay-light
```

只看与 RLT_12 相关的红项；有红修到不红，或在 `findings.md` 记明原因与归属。

### 步骤 8 — DevPlan 户口回填（**只改两处**）

1. §3.1 任务表 RLT_12 行：状态 `未开始` → `进行中`；工作区列填 `[workspace/RLT_12](../workspace/RLT_12/)`；备注追加 `Issue #23；计划内卡 RLT_21；D-start 2026-09-14`。
2. 头部 `dh:status` 块：`现状` / `下一步` 各同步一句，不大改结构。

除这两处外 DevPlan 不动。**状态列与 `dh:status` 只由主会话/编排改，relay 流水里的 worker 不得改**（AGENTS 施工 worker 铁律）。
