# adapter-claude-code — Claude Code 主控侧适配层

> relay-light 协议核心见同目录 `SKILL.md`。本文件只冻结 Claude Code 侧的命令模板、拉起写法与等待纪律；协议语义一律以 `SKILL.md` 为准。

`<RELAY_LOG>` 指 dh-relay 仓 `tools/relay-light/relay_log.py` 的绝对路径。

## 身份与配置目录

本侧默认安装副本 = `~/.claude/skills/relay-light/`（只提供缺省模板）。**每一个** `relay_log.py` 的 add / status / lint 调用都显式带 `--config-dir <plan_dir>/config/`（HC-RL-A136）；不带时五情形解析可能撞上双侧歧义退出 3。

## 账本命令模板

### Windows（`python`）

```powershell
python <RELAY_LOG> add --plan <plan_dir> --node <n> --event <e> --agent <a> --note "<t>" --config-dir <plan_dir>/config/
python <RELAY_LOG> status --plan <plan_dir> --json --config-dir <plan_dir>/config/
python <RELAY_LOG> lint --plan <plan_dir> --config-dir <plan_dir>/config/
```

### Linux（`python3`）

```bash
python3 <RELAY_LOG> add --plan <plan_dir> --node <n> --event <e> --agent <a> --note "<t>" --config-dir <plan_dir>/config/
python3 <RELAY_LOG> status --plan <plan_dir> --json --config-dir <plan_dir>/config/
python3 <RELAY_LOG> lint --plan <plan_dir> --config-dir <plan_dir>/config/
```

### 远程（`bash -lc`）

```bash
bash -lc "python3 <RELAY_LOG> status --plan <plan_dir> --json --config-dir <plan_dir>/config/"
```

## agent 拉起

- 开 tab：`herdr tab create --workspace <ws> --cwd <任务 worktree> --label <角色名> --no-focus`，结果里的 `root_pane.pane_id` 就是目标 pane；一个 agent 一个 tab，不用 `pane split`。
- **claude kind**：`herdr agent start <名> --kind claude --pane <pane_id> -- --model <m> --effort <e> --dangerously-skip-permissions` 在 Linux 直接可用（2026-09-21 本机实测；旧文说的 shim 坑只在 Windows 出现，Windows 仍走 `herdr pane run` + `agent rename`）。
- **codex kind**：`herdr agent start <名> --kind codex --pane <pane_id> -- -m <model> -c model_reasoning_effort=<e> --dangerously-bypass-approvals-and-sandbox`。ThinkPad Linux 上 codex 的任何 `--sandbox`（read-only / workspace-write）都撞 bwrap（`RTM_NEWADDR Operation not permitted`），跑不了 shell，所以 Claude 主控下也一律 bypass 启动（2026-09-21 用户裁决：codex 无限制）；只读角色（plan-reviewer / checker / reviewer）的只读约束由派单 prompt 明文承担（「不改任何文件、只读被审对象」），监工在其 `agent_launch.note` 记 `launch_fix=codex_bypass_bwrap`。不要后台跑 `codex exec`（stdin 挂死）。
- **devin kind**：`herdr agent start <名> --kind devin --pane <pane_id> -- --model swe-2-max|swe-2-medium --permission-mode dangerous`。
- **omp kind**：`herdr agent start <名> --kind omp --pane <pane_id> -- --model opencode-go/deepseek-flash --thinking <off|low|medium|high|xhigh|max>`。
- 角色 → 发起方式查本计划 `config/roles.toml`，本文件不写死模型。派单 prompt 只发 ASCII 指针（读 `<文件>` 并照做），长中文提示词写文件。

## 环境预检（拉起前）

拉起每个 agent 前先核启动形态在本环境可用，codex 启动档位按主控侧分叉：

- Claude 主控下 codex worker 在能用沙箱的机器上以默认 sandbox 启动；在沙箱撞 bwrap 的机器（本机 ThinkPad Linux）按上节一律 bypass 启动并记 `launch_fix`。
- Codex 主控下沿用既有 bypass 结论；仅在该主控侧的沙箱型只读启动不可用且账本连续 `NOT_RUN` 时，按环境预检改用 bypass 沙箱启动，提示词明确只读约束，并在 `agent_launch.note` 记录 `launch_fix=<token>`；不得把 bypass 写成无条件全局口径。

Codex 主控侧机制细节：沙箱型只读启动（如 codex 复核形态的 `-- --sandbox read-only`）起不来（账本连续 `NOT_RUN` 即信号）时才改用 bypass 沙箱启动（如 `--dangerously-bypass-approvals-and-sandbox`），只读约束改由派活 prompt 明文承担（「不改任何文件、只读被审对象」），`launch_fix=<token>` 记在该 `agent_launch` 的 `note` 作运行事实——不改计划 `launch` 列、不走 `plan_amend`。

## 派活 prompt 模板（监工 → agent）

```text
[relay-light] worker · node=<n> · agent=<角色>#<实例> · workspace=<任务工作区>
读：<repo>/AGENTS.md → <任务工作区>/brief.md、task_plan.md、progress.md、findings.md
边界：<本节点 allowed-paths 一句话>
硬规则：你是 worker 不是主控；不拉终端不派活；卡住写 blocked 信号不憋死；
凭据/密钥值永不写进 note、progress、findings、decision 或任何工件与账本。
完成：按节点要求写产出 → 打小结 → 按任务工作区约定写完成信号即停；relay-light 无 node_closed，worker 完成即停、不等下一节点。
```

## 拉起监工 / 编排 的 prompt 片段

编排拉起监工、人拉起编排时，派单文案必须原样含等待硬规则：

```text
硬规则：`wait` 返回时必须有接收者（watch 推送 / 前台阻塞循环 / 后台退出唤醒三选一）；watch 未实现时不得结束回合空等。
```

## 派活提交纪律

`agent start` 后先 `herdr agent wait <名> --until idle`——等启动横幅与初始化提示消化完再 `herdr agent prompt` 发派单；prompt 发出后必须读 pane 末行确认派单已真提交（`herdr agent read <名>` 看末行/输入框已清空），未提交补一发 `herdr agent send-keys <名> enter` 并复核，仍不动按下方 stalled 处置走 `agent_lost`。

向 agent 发通知后必须读 pane 末行确认实际投递；pane 出现 `queued` 排队提示时补 `send-keys enter` 并复核送达；未确认投递不得当作已通知。

判定方判定 PASS 前，送审方与判定方均不记 `done`；FAIL 走 live 判定方的 `checkpoint` 路由回同一送审方；PASS 后按送审方→判定方顺序记终态。

## 等待与接收者（硬规则）

`herdr agent wait` 是阻塞式 CLI、不是推送——**返回那一刻必须有接收者**，没人听信号就丢。三种满足方式：

1. **watch 推送**（设计已冻结、尚未实现；实现后由它唤醒监听者，收到 `[relay-light] tick` 对账）
2. **前台阻塞循环**：`herdr agent wait <agent> --timeout 1200000`（自带 20 分钟节拍）；返回后按状态分路——`blocked` → 账本记 `blocked` 走升级链；`done`/`idle` → **先读产出判断是否合格**，合格才写账本的 `done`
3. **Claude 侧后台**：`run_in_background` 挂 wait，进程退出会唤醒本 session

watch 未实现前**一律走方式 2 或 3**，不得结束回合空等。`agent wait --until blocked` 只作可选模式，不是默认。

**编排等待纪律**：编排侧等监工时优先用账本文件事件监听（盯 `relay_log.jsonl` 新行到达），不用后台 `wait`/轮询进程（会被系统回收丢唤醒）；并配「监工连续空闲 ≥2 分钟且无新账本行」告警——命中即巡检该监工 pane 末行与 Herdr 状态，按 stalled/ledger_silent 口径处置，不空等。

## stalled 处置

`herdr agent prompt` 发出后必须验证「真提交」：`herdr agent get <名>` 看 `state_change_seq` 是否变化、`status` 是否转 `working`。长 prompt 可能停在输入框未提交（herdr 报 `agent_prompt_stalled` 或 seq 不动）——补一发 `herdr agent send-keys <名> enter`，再 `agent get` 复验，没动就再补；终极判据 = `herdr agent read` 看输入框已清空。输入通道整体冻结时**别纠缠**：该实例弃用（账本记 `agent_lost`），开新 pane 拉 fresh 实例续派。

## agent_lost 判活（监工模板）

pane 的 `working → done` 不等于 agent 收工（长 `sleep` 中也会被报 `done`）；判 `agent_lost` 前必须同时确认 pane 无 `Running tools` 计时器在走、账本无该 agent 新行、Herdr `agent get` 状态非 working；不得单凭 pane 状态判死重拉。`ledger_silent` 仍按 A140 核 Herdr 状态 + pane 末行 + 允许路径产出：三者均无变化才中断；任一仍在变化不得中断。

## ledger_silent 处置

`status` 按账本最近事件计算静默，超过 `limits.silence_timeout_min`（默认 30 分钟）的在场 agent 标 `ledger_silent`——提示非挂死判定。处置原文：

```text
ledger_silent → 核 Herdr 状态 + pane 末行 + 允许路径产出 三者是否也无变化 → 三者均无变化才中断并记 agent_lost silent_timeout → 同 pane 重拉 #n+1；任一仍在变化不得中断。
```

## 红线

- 凭据 / 密钥值永不进 prompt、note、工件、账本（A27）。
- 不硬编码模型名；角色 → 发起方式查 `roles.toml`（A132）。
- `planner-amend` 改计划实例的白名单、守门流程与账本规则以 `SKILL.md` 的「planner-amend 改计划模板」为准，adapter 不重复展开。
- 本 adapter 只描述 Claude Code 侧；另一侧见 `adapter-codex.md`。
