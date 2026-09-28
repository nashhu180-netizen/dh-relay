# H12-redemo 实测证据 — RQ-1 复演：H12-② 恢复半段端到端（关阶段级 watch pane → 编排 tick 对账 → stage-stalled → 修正后存活核判死 → 重拉 → 首条通知到达）

> 只取证不判。时刻为系统本地时（+08:00）。原始输出见 `raw/` 引用文件，本文件摘录逐字引自 raw。
> 复演对象：requirement review-round-1 RQ-1（`evidence/batch-3/H12.md:44-49` 恢复半段未成功缺口），用当前 HEAD 代码与 C1-1 修正后 adapter 存活核。
> 探针：`rlt18-probe2-lead`（扮 stage-lead/monitor#1）、`rlt18-probe2-worker`（扮在场 worker/coder#1）、`rlt18-probe2-orch`（扮编排）。三者均为 Devin SWE-2 medium，实际 argv 经 `herdr agent start` 回执逐字为 `devin --model swe-2-medium --permission-mode dangerous`（raw/agent-starts.txt）。**lead 由 Devin 模拟、按 claude adapter 文本执行**（存活核与重拉写法逐字照录 adapter-claude-code.md「watch 死亡处置 · stage-lead 位」，brief 见 `probe-briefs/lead.md`、`lead-r.md`）。
> tick 不可缩短：`relay_log.py` 内 `WATCH_TICK_SECONDS = 1200` 为模块常量，无环境变量/CLI 测试参数——按派单约定等真实 20 分钟 tick；观察窗均 ≤ T1 后 25 分钟。
> 两层 watch 均按 D13 在各自 pane 内跑 shell 重启循环（raw/watch-loops-start.txt、run2-setup.txt）。

## 总览：两次运行

| 运行 | fixture | 事件链 | 结果 |
|---|---|---|---|
| run-1 | `fixture/h12`（stage `RLT18X:C#1`，node C1） | T1 关 pane → lead 被**排队中的** `coder#1 -> idle` 通知提前唤醒 → 存活核判死 → 重拉 → worker done 时新 watch 通知 → lead 关账 | 恢复半段技术动作全部成功，但**未走 stage-stalled 路径**（重拉发生在编排 tick 之前，stage 在 tick 前已关闭） |
| run-2 | `fixture/h12r`（stage `RLT18Y:C#1`，node D1） | T1′ 关 pane（watch 对 working worker 静默，lead 无滞留通知）→ T2′ worker done 静默 → T3′ 编排 tick 对账发 `stage-stalled` → T4′ 存活核判死 → T5′ 重拉 → T6′ 首条通知到达 | **派单指定的端到端链路完整跑通** |

## run-1（fixture/h12）— 偏离路径记录

- 11:42:41 两 watch 重启循环启动：编排级 `--notify rlt18-probe2-orch --level plan`（python 4134559），阶段级 `--notify rlt18-probe2-lead --level stage`（python 4134564）（raw/watch-loops-start.txt）。
- 11:42:4x 阶段级 watch 观察到 worker=idle，向 lead 推送 `coder#1 -> idle`（lead pane `terminal_title` 与 raw/pane-lead-full.txt:259-264 所载「Wake cause: [relay-light] coder#1 -> idle」）；该通知在 lead 处理 brief 期间排队。
- **T1 = 11:43:52** `herdr tab close w4B:tZ` → ok；此刻 worker=`working`（seq 2157）、lead=`done`（seq 2149）（raw/t1-close.txt）。post-close 进程表无 rlt18-probe2-lead 层级 watch。
- ~11:45 lead 被排队的 `coder#1 -> idle` 唤醒，按「任何唤醒先核存活」执行修正后存活核：
  `pgrep -af -- 'relay_log.py watch --plan .../fixture/h12 --notify rlt18-probe2-lead --level stage' | grep -v 'pgrep' | grep -Ev "^($$|$PPID) "` → **空输出** → 判「Stage-level watch is dead」（pane-lead-full.txt:171-177）。
- 重拉：`herdr tab create --workspace w4B --label rlt18-probe2-watch-stage-re` → tab w4B:t14/pane w4B:p14 → `herdr pane run w4B:p14 "while :; do python3 ... watch --plan .../h12 --notify rlt18-probe2-lead --level stage --config-dir .../config/; rc=$?; case $rc in 0|2|3|4) break;; esac; sleep 5; done"`；复核命中 `PID 4140884`（pane-lead-full.txt:181-204）。进程侧：循环壳 4140706（/bin/bash，lstart 11:45:04）→ python 4140884（lstart 11:45:07）。
- T2 ≈ 11:55:3x–11:55:52 worker `working→done`（poll log 行 30）；同一样本 lead `done→working`（被重拉 watch 的 `coder#1 -> done` 唤醒）。
- 11:56:03 lead 按 stage-lead 常规向 fixture 账本写 `done`→`node_close`→`stage_result`（seq 6-8，raw/post-run-state.txt h12 账本；pane-lead-full.txt:152-183）。
- 阶段级 watch 4140884 在末节点关闭后自行 exit 0，循环 `case 0` break 退出（12:22 前已消失；t14 pane 壳提示符返回，raw/pane-lead-t4r.txt:371-378 同款形态）。
- 旧编排级 watch 4134559 于 11:58:33 随 tab w4B:tY 关闭（raw/run1-winddown.txt），其首个 tick 锚点 ~12:02:41 未到达即终止——**run-1 全程未发生编排 tick 对账，无 stage-stalled**。
- 小结：run-1 的「判死 + 重拉 + 通知到达」发生在普通唤醒（排队通知）而非 stage-stalled 上，提前消解了 stall；故按派单链路重跑 run-2。

## run-2（fixture/h12r）— 派单指定链路

> 防提前唤醒措施：worker 的 `TASK: sleep 660` 先于阶段级 watch 启动发出——阶段级 watch 全程只见 `working`（`herdr agent wait` 不匹配 working、持续挂起），T1′ 前对 lead 零通知；lead 仅被 brief 指针唤醒一次并随即 `done`（poll 行 39 后 lead 持续 done/2193 至 stage-stalled 前）。

- 11:59:15 worker `TASK: sleep 660 && echo probe2-w2-done`；11:59:21 采样 worker=`working`（seq 2187）（raw/run2-setup.txt）。
- 11:59:32 两 watch 重启循环启动：编排级 python 4170550（`--level plan --notify rlt18-probe2-orch`），阶段级 python 4170554（`--level stage --notify rlt18-probe2-lead`），plan 均为 `fixture/h12r`（run2-setup.txt）。
- 11:59:45 lead 收到 lead-r.md 指针并唤醒：存活核命中 `4170554`（pane-lead-t4r.txt:210-218，`Exited with code 0`）→ 判存活不重拉 → done/2193（12:00:3x）。

### T1′ = 12:00:38 — 阶段级 watch pane 关闭

- `herdr tab close w4B:t16` → ok。pre-close：阶段级 python 4170554 在列；lead=`done`/2193、worker=`working`/2187、orch=`done`/2192。post-close：仅剩编排级 4170550，`(stage-level watch gone)`（raw/t1r-close.txt 逐字）。

### T2′ ≈ 12:10:1x–12:10:36 — worker 回 done（静默）

- poll log 行 89：`12:10:36 ... worker working/2187 -> done/2208`；worker pane 末行 `probe2-w2-done`（raw/post-run-state.txt）。此刻起至 T3′ 无任何发往 lead 的 prompt（lead 保持 done/2193，poll 行 89–132）——h12r 账本无 coder#1 终态、D1 未关。

### T3′ ≈ 12:19:3x–12:20:0x — 编排 tick 对账发 stage-stalled

- 编排级 watch lstart 11:59:33 → tick 锚点 ≈ 12:19:33；poll 行 133：`12:19:51 orch done/2192 -> working/2218`（收到 tick 开始对账）。
- orch pane（raw/pane-orch-t3r.txt）逐字：`❭ [relay-light] tick`（:59）→ `status --json`（:63-79：stage `RLT18Y:C#1` open、节点 D1 open、`coder#1 无终态事件`）→ `herdr agent list`（:81-139）→ 判定「Stall condition met — notifying stage-lead」（:141-143）→ `herdr agent prompt rlt18-probe2-lead "[relay-light] stage-stalled RLT18Y:C#1"`（:145-153，回执 `agent_prompted`）。
- 同期对照：orch 对该 watch 推送的 `monitor#1 -> idle/done` 均只答「recorded — no action」（pane-orch-t3r.txt:11-41、:160-169），符合「仅 tick 触发对账」。

### T4′ ≈ 12:20:0x — lead 存活核（修正后原文）判死、未自匹配

- lead pane（raw/pane-lead-t4r.txt）：`❭ [relay-light] stage-stalled RLT18Y:C#1`（:256）→ 逐字执行 `pgrep -af -- 'relay_log.py watch --plan .../fixture/h12r --notify rlt18-probe2-lead --level stage' | grep -v 'pgrep' | grep -Ev "^($$|$PPID) "`（:258-262）→ **输出为空、`Exited with code 1`**（:263）→ 答「Stage-level watch for h12r is dead. Relaunching via restart loop in a new tab.」（:265）。
- 对比 batch-3 旧写法的幻 PID（`pgrep-selfmatch.txt` 3789309 / H12.md:49），本次 Devin 包装执行下**无任何 PID 行输出**——`grep -v 'pgrep'` 与 `^($$|$PPID)` 过滤使其自身命令行不被命中（未自匹配的直接证据 = :263 空输出 + exit 1）。

### T5′ ≈ 12:20:1x — lead 按 adapter 重拉

- `herdr tab create --workspace w4B --label rlt18-probe2-watch-stage-re --no-focus` → tab **w4B:t17 / pane w4B:p17**（pane-lead-t4r.txt:267-275）。
- `herdr pane run w4B:p17 "while :; do python3 .../relay_log.py watch --plan .../fixture/h12r --notify rlt18-probe2-lead --level stage --config-dir .../config/; rc=$?; case $rc in 0|2|3|4) break;; esac; sleep 5; done"`（:277-285，D13 原文）。
- 复核存活：同一存活核管道命中 `24908 python3 ... watch ... --notify rlt18-probe2-lead --level stage ...`（:287-296）；poll 行 134 `watchpy=24908,4170550` 旁证。

### T6′ ≈ 12:20:2x–12:20:41 — 重拉后首条通知到达 lead

- 重拉的 watch 挂 `herdr agent wait rlt18-probe2-worker` 立即返回 `done` → 向 lead 推送 `coder#1 -> done`；lead pane `❭ [relay-light] coder#1 -> done`（pane-lead-t4r.txt:359），poll 行 135 `12:20:41 lead done/2223 -> working/2226`（被该通知唤醒）。
- lead 自述该通知来源：「The coder#1 -> done notification was the fresh watch process re-observing the worker's done state before exiting (dedup is per-process)」（pane-lead-t4r.txt:390-391）。
- 后续（恢复后 stage-lead 常规处理，不计入兜底链本身）：lead 写 `done`→`node_close`→`stage_result`（h12r 账本 seq 6-8，ts 12:20:29-30，raw/post-run-state.txt）；watch 满足末节点关闭 exit 0、循环 break（:368-395 lead 复核「not a dead watch」：p17 壳提示符返回 + 进程表空）。

### 观察窗

- T1′=12:00:38 → 窗口上限 12:25:38；T6′ 事件止于 ~12:21:07（lead done/2227），全部链内事件在窗内完成。

## 操作者介入（本棒 driver 动作）

- 试验操作本体（均在派单实测授权内）：`herdr tab create/close`、`herdr pane run`（D13 循环）、`herdr agent start/prompt/get/read/wait/send-keys`（未用 send-keys）、`kill`（仅杀 poll 脚本进程，未杀 watch——阶段级 watch 一律经 `tab close` 整 pane 关闭）、进程与 pane 读取。
- run-1 → run-2 切换属计划内重跑：run-1 因排队通知提前唤醒 lead 而偏离目标链路；h12r 为独立新 fixture（不改写 h12 账本），两 fixture lint 均 exit 0（raw/setup-fixture.txt、setup-fixture-h12r.txt、post-run-state.txt）。
- 收尾误操作记录：首次清理命令中 `pkill -f rlt18-poll` 命中自身命令行致该次 shell 提前终止（与 pgrep 自匹配同机制）；改以精确 PID/`tab close` 完成清理，已如实记录于 raw/cleanup-verify.txt。
- lead/orch/worker 的写账动作：lead 作为 stage-lead 对 fixture 账本写 `done`/`node_close`/`stage_result`（其 brief 允许）；orch/worker 未写账；驱动者未写任何 fixture 账本行。

## 原始文件（raw/）

- `setup-fixture.txt` / `setup-fixture-h12r.txt` — 两 fixture 建账 + lint 输出
- `setup-tabs.txt` / `agent-starts.txt` / `brief-prompts.txt` / `worker-task.txt` — run-1 探针拉起（含 argv 回执）
- `run2-setup.txt` — run-2 worker TASK、tab 创建、watch 循环启动与进程摘录
- `watch-loops-start.txt` — run-1 两 watch 循环启动与 PID/lstart
- `t1-close.txt` / `t1r-close.txt` — T1/T1′ 关 pane 前后状态逐条
- `agent-status-poll.log` — 25s 轮询 lead/worker/orch 状态+seq 与 watch python 列表（含 run-1/run-2 全程；行号见正文引用）
- `pane-lead-full.txt` / `pane-lead-1156.txt` — run-1 lead pane（判死→重拉→alive→关账）
- `pane-orch-t3r.txt` — run-2 orch pane（tick→对账→stage-stalled 全文）
- `pane-lead-t4r.txt` — run-2 lead pane（stage-stalled→pgrep 空→t17/p17 重拉→24908→`coder#1 -> done`→exit 0 退出链全文）
- `post-run-state.txt` — 两 fixture 账本终态、lint、tab/worker pane 摘录
- `run1-winddown.txt`、`cleanup-verify.txt` — 收尾核验（tab 全关、无 probe2/watch 残留、`__pycache__` 审计空）

## 人判结论

（留空，由人判）
