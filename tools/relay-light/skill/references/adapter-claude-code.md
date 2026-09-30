# adapter-claude-code — 编排/stage-lead 位为 `claude` kind 时的适配层

> relay-light 协议核心见同目录 `SKILL.md`。本文件只冻结 Claude Code 侧的命令模板、拉起写法与等待纪律；协议语义一律以 `SKILL.md` 为准。

**两条轴别混**（术语见 `SKILL.md`「术语与判断分层」）：

- **agent kind** = 这个位置上跑的是哪种 agent（`claude` / `codex` / `devin` / `omp`）。本文件分叉的就是它：编排/stage-lead 位为 `claude` kind 时，等待能力是「可后台跑（进程退出唤醒 session）或用文件事件监听，**允许结束回合**」。`devin` / `omp` 目前只在 worker 位实跑过，放到编排/stage-lead 位要先补一份同级适配。
- **终端载体** = 管终端空间与标签页的工具，当前是 herdr。本文件里所有 `herdr *` 命令都属于载体层，换载体只改这些命令行，协议正文与 kind 分叉都不动。

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
- **codex kind**：`herdr agent start <名> --kind codex --pane <pane_id> -- -m <model> -c model_reasoning_effort=<e> --dangerously-bypass-approvals-and-sandbox`。ThinkPad Linux 上 codex 的任何 `--sandbox`（read-only / workspace-write）都撞 bwrap（`RTM_NEWADDR Operation not permitted`），跑不了 shell，所以 编排/stage-lead 位为 `claude` kind 时也一律 bypass 启动（2026-09-21 用户裁决：codex 无限制）；只读角色（plan-reviewer / checker / reviewer）的只读约束由派单 prompt 明文承担（「不改任何文件、只读被审对象」），stage-lead 在其 `agent_launch.note` 记 `launch_fix=codex_bypass_bwrap`。不要后台跑 `codex exec`（stdin 挂死）。
- **devin kind**：`herdr agent start <名> --kind devin --pane <pane_id> -- --model swe-2-max|swe-2-medium --permission-mode dangerous`。
- **omp kind**：`herdr agent start <名> --kind omp --pane <pane_id> -- --model opencode-go/deepseek-flash --thinking <off|low|medium|high|xhigh|max>`。
- 角色 → 发起方式查本计划 `config/roles.toml`，本文件不写死模型。stage-lead 取 `[stage-lead]` 段；已开计划的 `config/roles.toml` 若只有旧名 `[monitor]` 段，按 `[monitor]` 取档（旧名兼容）。派单 prompt 只发 ASCII 指针（读 `<文件>` 并照做），长中文提示词写文件。

## 环境预检（拉起前）

拉起每个 agent 前先核启动形态在本环境可用，codex 启动档位按编排/stage-lead 位的 kind 分叉：

- 编排/stage-lead 位为 `claude` kind 时 codex worker 在能用沙箱的机器上以默认 sandbox 启动；在沙箱撞 bwrap 的机器（本机 ThinkPad Linux）按上节一律 bypass 启动并记 `launch_fix`。
- 编排/stage-lead 位为 `codex` kind 时沿用既有 bypass 结论；仅在该侧的沙箱型只读启动不可用且账本连续 `NOT_RUN` 时，按环境预检改用 bypass 沙箱启动，提示词明确只读约束，并在 `agent_launch.note` 记录 `launch_fix=<token>`；不得把 bypass 写成无条件全局口径。

`codex` kind 侧机制细节：沙箱型只读启动（如 codex 复核形态的 `-- --sandbox read-only`）起不来（账本连续 `NOT_RUN` 即信号）时才改用 bypass 沙箱启动（如 `--dangerously-bypass-approvals-and-sandbox`），只读约束改由派活 prompt 明文承担（「不改任何文件、只读被审对象」），`launch_fix=<token>` 记在该 `agent_launch` 的 `note` 作运行事实——不改计划 `launch` 列、不走 `plan_amend`。

## 派活 prompt 模板（stage-lead → agent）

```text
[relay-light] worker · node=<n> · agent=<角色>#<实例> · workspace=<任务工作区>
读：<repo>/AGENTS.md → <任务工作区>/brief.md、task_plan.md、progress.md、findings.md
边界：<本节点 allowed-paths 一句话>
硬规则：你是 worker：不拉终端、不派活；卡住写 blocked 信号不憋死；
凭据/密钥值永不写进 note、progress、findings、decision 或任何工件与账本。
完成：按节点要求写产出 → 打小结 → 按任务工作区约定写完成信号即停；relay-light 无 node_closed，worker 完成即停、不等下一节点。
```

## 拉起 stage-lead / 编排 的 prompt 片段

编排拉起 stage-lead、人拉起编排时，派单文案必须原样含等待硬规则：

```text
硬规则：`wait` 返回时必须有接收者（watch 推送 / 前台阻塞循环 / 后台退出唤醒三选一）；无 watch 时不得结束回合空等。
```

## 拉起 watcher 的 prompt 片段

派活方**先起 watch 后起 watcher**——stage-lead 拉本阶段终端空间的一个、编排拉编排终端空间的一个（每终端空间一个）。watcher 拉起后立即检查一次（看不到即报），随后进入 10 分钟节拍。watcher 用低档，缺省取 `roles.toml` `[watcher]` 档；已开计划的 `config/roles.toml` 无 `[watcher]` 时依次取 `[stage-lead]`、旧名 `[monitor]` 档（旧名兼容），由派活方拉起时指定。派单片段：

```text
[relay-light] watcher · space=<stage_id|orchestrator> · notify=<派活方 Herdr 名> · plan=<plan_dir>
你是本终端空间的 watcher：只读巡检本空间 watch 是否存活，每 10 分钟一轮；拉起后立即检查一次，随后用 run_in_background 跑 sleep 600 作节拍（进程退出唤醒本 session；不写前台长 sleep）。
每轮先核 watch 存活，按本空间层级取一式：
- 阶段空间：`pgrep -af -- 'relay_log.py watch --plan <plan_dir> --notify <stage-lead 的 Herdr 名> --level stage' | grep -v 'pgrep' | grep -Ev "^($$|$PPID) "`
- 编排空间：`pgrep -af -- 'relay_log.py watch --plan <plan_dir> --notify <编排的 Herdr 名> --level plan' | grep -v 'pgrep' | grep -Ev "^($$|$PPID) "`
Windows 同式：
- 阶段空间：`Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*relay_log.py watch --plan <plan_dir> --notify <stage-lead 的 Herdr 名> --level stage*' -and $_.CommandLine -notlike '*Get-CimInstance*' -and $_.ProcessId -ne $PID }`
- 编排空间：`Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*relay_log.py watch --plan <plan_dir> --notify <编排的 Herdr 名> --level plan*' -and $_.CommandLine -notlike '*Get-CimInstance*' -and $_.ProcessId -ne $PID }`
非空即存活（循环壳或 python 任一命中，勿缩窄）。
为空再只读判本层是否已正常结束：`python3 <RELAY_LOG> status --plan <plan_dir> --json --config-dir <plan_dir>/config/`——阶段级：stages[] 中本 stage_id 的 nodes 在 nodes[] 里全部 state=closed，或该 stage state=closed；编排级：open_stages 与 pending_nodes 均空且 stages[-1] state=closed。已结束 → 静默，打印 WATCHER_STOPPED 结束巡检。未结束或 status 读失败 → 报信：`herdr agent prompt <派活方> "[relay-light] watch-down stage <stage_id>"`（编排空间：`"[relay-light] watch-down plan plan"`），发完读派活方 pane 末行，只在出现 `queued` / `Press Enter to send` 时补一次 Enter，其它输入框残留一律不碰。同一缺席期每轮至多一条、连续 3 轮报信后 watch 仍缺席 → 打印 WATCHER_GAVE_UP 收声，不再发任何 prompt；期间 watch 恢复则计数清零、静默。
硬规则：只读；不重拉 watch、不写账、不改文件、不派活、不判内容。
```

## 派活提交纪律

`agent start` 后先 `herdr agent wait <名> --until idle`——等启动横幅与初始化提示消化完再 `herdr agent prompt` 发派单；prompt 发出后必须读 pane 末行确认派单已真提交（`herdr agent read <名>` 看末行/输入框已清空），未提交补一发 `herdr agent send-keys <名> enter` 并复核，仍不动按下方 stalled 处置走 `agent_lost`。

向 agent 发通知后必须读 pane 末行确认实际投递；pane 出现 `queued` 排队提示时补 `send-keys enter` 并复核送达；未确认投递不得当作已通知。

判定方判定 PASS 前，送审方与判定方均不记 `done`；FAIL 走 live 判定方的 `checkpoint` 路由回同一送审方；PASS 后按送审方→判定方顺序记终态。

## 等待与接收者（硬规则）

`herdr agent wait` 是阻塞式 CLI、不是推送——**`wait` 返回时必须有接收者**，没人听信号就丢。三种满足方式：

1. **watch 推送（默认）**：沿用本侧「一 agent 一 tab」约定，在当前阶段终端空间单独开一个 tab，跑 shell 重启循环包住 watch：

   ```bash
   while :; do python3 <RELAY_LOG> watch --plan <plan_dir> --notify <自己的 Herdr 名> --level <stage|plan> --config-dir <plan_dir>/config/; rc=$?; case $rc in 0|2|3|4) break;; esac; sleep 5; done
   ```

   Windows（`python`）：

   ```powershell
   while ($true) { python <RELAY_LOG> watch --plan <plan_dir> --notify <自己的 Herdr 名> --level <stage|plan> --config-dir <plan_dir>/config/; if ($LASTEXITCODE -in 0,2,3,4) { break }; Start-Sleep 5 }
   ```

   stage-lead 位 `--level stage`、编排位 `--level plan`；watch 只通知不写账、每 20 分钟发 `[relay-light] tick`，收到 tick 跑 `status --json` 与 `herdr agent list` 对账。调用行参数顺序固定（`--plan … --notify …` 是 watch 后首两位），存活检查按它定位层级。进程崩溃/被杀几秒内由循环重拉；退出码 {0,2,3,4} 是正常结束或确定性错误、不重拉；重启后去重与 tick 计时从零开始，已 settled 的在场 agent 可能各再收一次通知，按对账处理。watch 起来后在本空间拉起 watcher（见「拉起 watcher 的 prompt 片段」）。

2. **前台阻塞循环（无 watch 回退）**：`herdr agent wait <agent> --timeout 1200000`（自带 20 分钟节拍）；返回后按状态分路——`blocked` → 账本记 `blocked` 走升级链；`done`/`idle` → **有判定方的节点读判定方结论**（stage-lead 不自己判内容）、无判定方的只做形式核（产出存在、非空、在允许路径内），过了才写账本的 `done`
3. **Claude 侧后台**：`run_in_background` 挂 wait，进程退出会唤醒本 session

节拍归属：有 watch → 20 分钟节拍由 watch 维持（`[relay-light] tick`）；无 watch → 由前台 `wait --timeout 1200000` 维持。watch 存活巡检 10 分钟节拍由 watcher 维持。watch 未启动或不可用时回退方式 2（Claude 侧可 3）；**无 watch 时不得结束回合空等**，有 watch 时允许结束回合、靠 prompt 唤醒。`agent wait --until blocked` 只作可选模式，不是默认。

stage-lead 记 `agent_launch`、编排记 `monitor_launch` 时在 note 写 `herdr=<Herdr 名>`（watch 用它找要挂的 Herdr agent）；未写时 watch 按 `<名字>-<attempt>` 猜。

### watch 死亡处置

- **进程级**：watch 不直接在 tab 里跑，跑的是上面那条重启循环——崩溃/被杀几秒内自动重拉；0/2/3/4 退出是正常结束或确定性错误，循环停下不空转。
- **watcher 巡检**（阶段级与编排级同一套）：watch 的 pane 被关时，由本空间 watcher 每 10 分钟只读巡检发现——阶段空间 watcher 报信 stage-lead、编排空间 watcher 报信编排去重拉；拉起时机、检查命令与判死口径见「拉起 watcher 的 prompt 片段」。
- **stage-lead 位**：整个 watch pane 被关时由本空间 watcher 每 10 分钟巡检发现。收到 `[relay-light] watch-down stage <stage_id>` 或任何唤醒时，先核自己这一层 watch 是否还活着：`pgrep -af -- 'relay_log.py watch --plan <plan_dir> --notify <自己的 Herdr 名> --level stage' | grep -v 'pgrep' | grep -Ev "^($$|$PPID) "`；Windows：`Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*relay_log.py watch --plan <plan_dir> --notify <自己的 Herdr 名> --level stage*' -and $_.CommandLine -notlike '*Get-CimInstance*' -and $_.ProcessId -ne $PID }`。过滤不能省——在 `bash -c`/`pwsh -Command` 包装里执行时，包装壳 cmdline 自带本检查全文（必含 `pgrep`/`Get-CimInstance` 字样）且进程即 `$$`/`$PID`（其父即 `$PPID`），裸 `pgrep -f`/`-like` 会命中包装壳自身报出幻 PID。`--notify` 配 `--level stage` 才只认自己这一层，编排级 watch 命中不算（同 plan 下两个共用同一 `--notify` 名的 stage 级 watch 则互相不能区分，按名定位的固有边界）；循环壳或 python 任一命中即算存活——勿缩窄成只认 `python`，重启循环 `sleep 5` 窗口期 python 暂死会把活 watch 误判死，人工重拉与自动重拉撞出双 watch。不在则按重启循环重拉，或改前台 `herdr agent wait <agent> --timeout 1200000`。
- **编排位**：收到 `[relay-light] tick` 就跑 `status --json` 与 `herdr agent list` 做 §7.2 通用对账，不做 watch 存活判定、不发任何 stall 提示。收到 `[relay-light] watch-down plan plan` 时核自己这一层 watch（`--notify <自己的 Herdr 名> --level plan`，同 C1-1 写法），不在则按重启循环重拉。
- **watcher 自身缺席**：派活方在 tick 对账见 `herdr agent list` 无本空间 watcher 时顺带重拉，不另设巡检节拍。
- **报信目标随派活方重拉**（stage-lead / 编排被重拉时）：Herdr 名不变则本层 watch 的 `--notify` 与 watcher 的 `notify=` 报信目标无需切换；换了新名，派活方按重启循环重拉本层 watch（`--notify` 改指新名）并按派单片段重派本空间 watcher（`notify=` 新名）。
- 完整 relay 每终端空间一个 watcher agent，10 分钟只读巡检本空间 watch、只报信本空间派活方；watch 只通知不写账、不做停滞检测；编排不承担 watch 存活对账。

**编排等待纪律**：编排侧等 stage-lead 时优先用账本文件事件监听（盯 `relay_log.jsonl` 新行到达），不用后台 `wait`/轮询进程（会被系统回收丢唤醒）；并配「stage-lead 连续空闲 ≥2 分钟且无新账本行」告警——命中即巡检该 stage-lead pane 末行与 Herdr 状态，按 stalled/ledger_silent 口径处置，不空等。

## stalled 处置

`herdr agent prompt` 发出后必须验证「真提交」：`herdr agent get <名>` 看 `state_change_seq` 是否变化、`status` 是否转 `working`。长 prompt 可能停在输入框未提交（herdr 报 `agent_prompt_stalled` 或 seq 不动）——补一发 `herdr agent send-keys <名> enter`，再 `agent get` 复验，没动就再补；终极判据 = `herdr agent read` 看输入框已清空。输入通道整体冻结时**别纠缠**：该实例弃用（账本记 `agent_lost`），开新 pane 拉 fresh 实例续派。

## agent_lost 判活（stage-lead 模板）

pane 的 `working → done` 不等于 agent 收工（长 `sleep` 中也会被报 `done`）；判 `agent_lost` 前必须同时确认 pane 无 `Running tools` 计时器在走、账本无该 agent 新行、Herdr `agent get` 状态非 working；不得单凭 pane 状态判死重拉。`ledger_silent` 仍按 A140 核 Herdr 状态 + pane 末行 + 允许路径产出：三者均无变化才中断；任一仍在变化不得中断。

## ledger_silent 处置

`status` 按账本最近事件计算静默，超过 `limits.silence_timeout_min`（默认 30 分钟）的在场 agent 标 `ledger_silent`——提示非挂死判定。处置原文：

```text
ledger_silent → 核 Herdr 状态 + pane 末行 + 允许路径产出 三者是否也无变化 → 三者均无变化才中断并记 agent_lost silent_timeout → 同 pane 重拉 #n+1；任一仍在变化不得中断。
```

## single-task 单卡接力模式（本侧适配）

> 协议语义以 `SKILL.md` 的「`single-task` 单卡接力模式」一节为准；本节只冻结 Claude Code 侧的启动、派单、watcher 节拍与恢复写法。single-task 对完整模式执行计划不创建或读写 `relay_plan.md` / `relay_log.jsonl`，不使用 W/C/R/X/F；上方账本命令模板不适用于本模式，`relay_log` 账本与 `progress.md` 都不是本模式的运行真相。

### 总表关联与交棒

启动/恢复时先执行 `SKILL.md`「卡级总表维护与交棒核对」：在已有 `execution_strategy.md` 登记总表路径和唯一维护会话，无关联则明确记无。等待、卡级结果改变、停下及交棒时由维护会话更新总表；交棒前核对状态、下一步、证据及日期，无法完成则报告“总表待同步”，不宣称已交棒。非维护卡在卡级事件写好待同步行后，由其 orchestrator 用 `herdr agent prompt <维护会话的 Herdr 名> "[relay-light] card-chain update <卡号> <交接工件仓相对路径>"` 通知维护会话（发后照本文件通知投递确认规则读 pane 末行），维护会话先核原证据再汇总，通知不可达按“总表待同步”报告；维护会话所在卡收口汇报前必须先把维护权移交（默认给下一张已开工且关联本表的卡的 orchestrator，多张按总表行序取首张，无则交回用户）：交出方用 `herdr agent prompt <接收方 Herdr 名> "[relay-light] card-chain maintainer-handoff <总表仓相对路径>"` 通知（读 pane 末行确认投递），接收方在自己的 execution_strategy.md 登记并回一行确认，交出方收到后才改总表页头和自己的登记；接收方未确认/不可达按交回用户处理，未完成移交不算收口。维护会话在本卡收口移交前（或收到非维护卡收口通知时）先执行 `SKILL.md`「自动接续」：总表该下一卡行「自动接续」为「是」（用户写定，含 orchestrator 模型档）且接棒条件证据齐全时，先按 SKILL ② 完成 Issue / 分支与 worktree / Draft MR/PR，再按上方「agent 拉起」写法新开 Herdr workspace（`herdr workspace create`）、建 orchestrator tab 并按该行写定的模型档 `herdr agent start`，启动 prompt 给原卡路径、总表路径、Issue 号、分支、worktree 路径、MR/PR 号与写定分配，读 pane 末行确认投递后再对它发 maintainer-handoff；「否」/空白只核对报告；模型档未写定或任一步失败按 SKILL ④ 停，行写「等待：<原因>」，不重试、不临时向用户索要分配。这里允许维护会话读写卡级总表，不允许 worker/watcher 读写完整执行计划；默认不委托总表写入。启用 document 时登记维护方可按核心分工顺序委托总表代笔，watcher 仍零写入。总表不是运行真相，恢复仍以本节四类权威为准。

### 编排边界与验证派单

执行 `SKILL.md` single-task 的「编排职责与执行边界」「范围外既有失败」合同。需要测试、基线对照或验收证据复算时，派给已获授权的 coder/当前路径 reviewer（批次内为 batch-reviewer，workflow-final/E2 保留原 phase/path 及各自换人/计数规则）；orchestrator 不使用自己的 shell、后台任务或工具代跑。可做的只读核对限于身份、路径、状态、字段及已有结论的程序性核对，缺证则路由补证，不自行重建业务结论。

用户对进行中动作提出原则性纠正时，不自动解释为立即 kill 或删除现场；停止发起新的同类动作，语义不清由主会话澄清并保留现场。明确停止指令或既有停止条件立即执行；终止进程与删除现场分别判断。

### 启动前 model-allocation gate

- 拉起任何 agent 之前，orchestrator 先向用户展示全部拟启动角色/实例的模型与推理档提案表并明确询问确认；推荐默认仅是提案、不写死模型，用户可逐角色修改。**未获明确确认不得启动任何 agent**——缺询问、先启动后补确认、按未确认的默认选择直接拉起、角色/实例/模型/推理档变更免确认，均属违规。
- 确认后由 orchestrator 机械地把确认来源、角色/实例、模型、推理档写入任务工作区 `execution_strategy.md`；未启动的 tab/pane 标 pending，启动后补齐实际 Herdr workspace/tab/pane 与观察来源并逐项比对。`execution_strategy.md` 仅 orchestrator 在授权/停止线、角色/模型/实例、总表关联/维护人、派单路由、批次/clear 闸或提交/checkpoint SHA 变化时维护，其余角色与 watcher 默认只读；启用 document 时按核心首次建卡/代笔与核对合同执行，模型决定不转移；`roles.toml` 仍只是完整模式缺省模板，不为本模式写死模型。
- 恢复时可沿用已有明确确认且分配未变的快照；新增/更换角色或实例、换模型或推理档必须再次询问确认。超时、静默或最大工具权限均不推定确认；最大工具权限不扩张 commit/push/PR/merge/deploy/verify/人验授权。询问由当前主会话执行，不为询问另启 agent。

### 拓扑与拉起

- 一张任务卡 = 一个 Herdr workspace；每个角色实例一个独立具名 tab：`herdr tab create --workspace <ws> --cwd <任务 worktree> --label <角色> --no-focus`，取 `root_pane.pane_id` 后按上方 kind 命令与环境预检拉起，不在同一 tab 内 split。模型/推理档以 `execution_strategy.md` 中用户确认的分配为准。

用户明确要求在当前 space 的标签页执行时，复用已核实的 workspace ID，为本卡角色分别创建具名 tab；不新建 space，不依赖失效的继承 ID 或 UI 焦点。同一 Git 任务仍只用一个 worktree，共享 space 不共享写权。

### 决定落点与写者

执行核心 SKILL「durable signal 与写者边界」：用户裁决（点选/确认时间与原始来源，未知时间标未知）、decider 摘要与独立 decision 引用、D 项状态、范围外发现/P3 去处和给用户的知会统一落 `findings.md`。遗留须用户明确点头并标去处；知会或沉默不是同意。orchestrator 仅记录已有裁决与引用，coder 按派单记发现/证据；基线归因及关闭仍仅 coder 按审核流程回写，编排不代判。编排安排同文件错开写，每次指定章节与唯一写者；复核期间冻结相关候选内容，启用 document 才按原责任方确认代笔。

`execution_strategy.md` 只记上述编排事实，业务决定只放 findings 对应条目的指针；授权/模型确认事实仍在执行策略。`progress.md` 仅当前 batch coder 追加施工里程碑与证据引用，不放决定；`lesson_candidates.md` 仍仅 coder 按派单追加。主会话人验结果仍引用真实用户来源记录到 findings，不能用开工授权或摘要代签。此段仅适用 single-task；完整模式仍按核心的 coder/scribe 合同记录，不套用本段写权。

### 文档 agent 派单

默认由原责任方直接写文档，不要求创建独立文档 agent、终端或标签页，不登记 document 实例，也不等待其 SYNCED 信号；缺少 document 配置或信号不构成阻塞。仅在用户明确指定本卡试验时启用，并执行核心 SKILL「文档 agent（single-task 可选分工）」全部合同；以下代笔规则仅在启用时覆盖本侧默认写者描述。document 模型/实例须已确认；可委托全部获授权人工文档，也可按用户指定保留产品文档给执行者、只委托过程记录。首次建卡由主会话先给已确认分工、任务来源与创建路径，再由 document 登记执行策略，不要求先存在该文件。

沿用下方九值 phase：document 是角色，path=document-<请求标识>，成功 verdict=SYNCED，独立请求文件名；不新增 phase/账本或修改 roles.toml。派单附来源版本、原阶段/路径、结论与证据、精确写路径及责任确认方。reviewer 先自写 READY_FOR_DOCUMENT 和原始结构化结果；文档代笔完成后，同一 reviewer 核对映射再另发确认 signal，原 FAIL/REVISE 不得翻成 PASS。document 的 DONE/SYNCED 不用于原路径放行，代笔纠错不算新复核轮；实质改变仍走原复核规则。任何 phase 下 document 都不执行测试、部署、提交或验收。

同一获授权文档顺序写，验证期间冻结相关文件。来源过期/冲突/缺失时 BLOCKED/待同步，保留原始证据，不重跑已完成施工。效果由执行侧评价，document 只转录；恢复核经责任方确认的报告及原始来源，不信单独摘要。以上为协议约束，不是工具或沙箱硬保证。

### 派单 prompt 模板（orchestrator → worker）

```text
[relay-light:single-task] worker · phase=<phase> · agent=<角色>#<实例> · batch=<n|na> · round=<n> · workspace=<任务工作区>
读：<repo>/AGENTS.md → <任务工作区>/brief.md、task_plan.md（及派单指定的其它工件）
边界：<本棒 allowed-paths 一句话>
验证责任：<执行者；独立核验者；不涉及验证则写不适用>
对照基线：<整卡/批次用途；完整 SHA；选择依据；不适用须说明>
执行合同：<cwd；解释器；完整命令；必要环境/依赖；收集范围；串行要求>
临时现场：<允许位置/准备方式；所需资源；证据保存与清理责任；无则写无>
证据与写者：<精确路径/章节及本次唯一写者；findings 的决定记录由编排或获派 coder 错开追加，基线归因仍仅 coder 写、review 由 reviewer 写；启用 document 时按确认代笔，原始结论/signal 仍由原角色写>
决定引用：<findings 条目与用户/decision 原始来源；无则写无；缺源/冲突/待决定时不推进依赖动作，回报编排澄清>
通过/阻塞：<必需通过项；允许失败集合及审核/授权引用；缺证或新增失败的 BLOCKED 出口>
硬规则：你是 worker：不拉终端、不派活、不回头问用户；先跑 RELAY_RECEIPT preflight；
卡住写本角色精确 BLOCKED 单行 signal 不憋死；凭据/密钥值永不写进任何工件。
完成：只写派单指向的产出与本角色单行 DONE/BLOCKED signal 即停；无 node_closed，
不创建/读写 relay_plan.md、relay_log.jsonl。
```

- phase 闭集：`plan` / `plan-review` / `batch` / `batch-review` / `workflow-final` / `e2-code-review` / `decision` / `watcher` / `human-acceptance`；`batch=1|2|3|na`。本标头与上方 `[relay-light] worker · node=...` 互斥：见 single-task 标头不进入完整流水，见完整标头不适用本节。
- durable signal 单行 schema：`DONE|BLOCKED task=<t> phase=<p> agent=<r>#<i> batch=<1|2|3|na> path=<path|na> review_round=<n> remediation_count=<0|1|2> verdict=<v> evidence=<repo 相对路径[,...]>`，BLOCKED 另含 `reason=<snake_case>`；值无空白。产出型 builder/coder/reviewer/decider（含已启用的 document）写完 signal 即停；orchestrator 只按 durable signal 与独立 review/decision 工件机械分发/路由，不把终端状态当真相。
- `RELAY_RECEIPT` fail closed 分流：产出型 builder/coder/reviewer/decider（含已启用的 document）命中时只写本角色精确 `BLOCKED.*.md` 单行 signal 后立即停止；watcher 命中保持 repo/workspace 零写入，只用 Herdr prompt 非 durable 通知 orchestrator 后停、不写 BLOCKED。两分支均不得清除任何 `RELAY_*`。

### watcher 节拍与安全 Enter

- watcher 常驻，对 repo/workspace **完全只读**：只做 `herdr agent wait` / `agent get` / `agent read` 与 prompt 通知；不写 signal/progress/execution_strategy/轮询日志/通知日志或任何文档，不路由、不分派、不启动 agent。
- 节拍：每 120 秒一轮——`herdr agent wait <名> --timeout 120000` 返回后 `agent get` + `agent read` 核对状态；无变化静默不发通知，有变化即时 `herdr agent prompt` 通知 orchestrator（通知非 durable，不落盘）。
- 安全 Enter：仅当三条件**同时**成立才发一次 `send-keys enter` 并复验——①本次派单文本仍停在输入框（含 Devin `queued` 指令仍排队未发出）；②`state_change_seq` 未推进；③当前界面不是审批/确认 UI。任一不满足即不按；一次仍失败则通知 orchestrator 并换 fresh 实例，禁止连按。

### 恢复依据

恢复权威只有四类：原角色自写的 durable signals、独立 review/decision 工件及其原始来源、由 orchestrator 核对的 `execution_strategy.md`、Herdr 实态。`progress.md` 只是施工证据索引、watcher 通知只是即时提示，二者都不是运行真相；本模式不存在 relay 账本。恢复/重启从四类权威重建，不依赖终端存活状态。 `findings.md` 是决定与遗留的检索入口，沿其来源引用回查上述独立工件及用户原始裁决，不新增第五类运行权威；摘要缺源、冲突或仍待用户决定时，不推进依赖该决定的动作，回原责任方澄清。

## 红线

- 凭据 / 密钥值永不进 prompt、note、工件、账本（A27）。
- 不硬编码模型名；角色 → 发起方式查 `roles.toml`（A132）。
- `planner-amend` 改计划实例的白名单、守门流程与账本规则以 `SKILL.md` 的「planner-amend 改计划模板」为准，adapter 不重复展开。
- 本 adapter 只描述 Claude Code 侧；另一侧见 `adapter-codex.md`。
