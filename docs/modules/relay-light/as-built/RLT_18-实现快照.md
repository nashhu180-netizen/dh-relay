# RLT_18 实现快照 — relay-light watch（第 5 批）与 watch 死亡兜底

> 本文是 RLT_18 收口的 as-built 快照，只记已落进 `tools/relay-light/relay_log.py`、两个 adapter（`skill/references/adapter-claude-code.md`、`adapter-codex.md`）与 `skill/SKILL.md` 的**现役事实**；设计权威仍是 `design/01`（含 RLT-A-14 晋级版 §3.6 / §7.2 / §7.3）。行号以本快照落盘时点为准。
> 测试面：`tools/relay-light/test_relay_log.py` 274 例全绿；`pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` → `RELAY ALL PASS (SKIPPED: 1)`（2026-09-28）。
> 验收：A82 / A83 / A101 机器证通过；H11（2026-09-24）、H12 契约 v2（2026-09-28）用户人判接受；release_mode=risk-accepted（F-002：Windows 两副本同步与 A125 终局回归挂起）。

## 1. CLI 面

`python3 relay_log.py watch --plan <plan_dir> --notify <herdr 名> [--level stage|plan] [--config-dir <dir>]`（argparse 定义 `relay_log.py:3990-3994`；`--level` 默认 `stage`）。

- `--notify` 必须是非空、ASCII、无空白的 token，否则 argparse 报错退 2（`relay_log.py:3997-4004`）。
- 入口 `_watch_command` → `run_watch(plan_dir, notify, level, config, HerdrClient(), WatchClock())`；`RelayError` 按既有 `_fail` 映射退出码。
- 正常退出 0：阶段级 = 绑定 stage 的全部 active 节点均 `closed`（空阶段永不满足）；编排级 = 无 open stage、无 pending 节点且末 stage `closed`（`_watch_should_exit`，`relay_log.py:3836-3857`）。
- 阶段级启动时若无 open stage → `watch_no_open_stage`；启动读失败重试两次、间隔 2 s（`_watch_startup`）。

## 2. 运行模型

| 常量 | 值 | 用途 |
|---|---|---|
| `WATCH_POLL_SECONDS` | 30 | 主循环重读账本、线程 get 轮询间隔 |
| `WATCH_TICK_SECONDS` | 1200 | `[relay-light] tick` 节拍（20 分钟） |
| `WATCH_WAIT_TIMEOUT_MS` | 30000 | `herdr agent wait` 单次超时 |

- **主循环**（`run_watch`）：每 30 s 重读 plan + 账本 → `derive_status`；重读失败只报 stderr 不退出。按层级求在场者，每个 `(scope, agent)` 起一个守护线程；每 1200 s 向 `--notify` 发一次 `[relay-light] tick`。退出时 `stop` 并 join 各线程（35 s 超时只报 stderr）。
- **在场者**：阶段级 = 绑定 stage 内节点上、末事件非终态的 agent（`_watch_present_agents`）；编排级 = 每个 open stage 的当前 stage-lead，只由 `monitor_launch` 账本行推导为 `monitor#<该 stage 的 launch 序数>`，不读 `status.agents`（`_watch_present_monitors`）。
- **Herdr 名映射**（`_watch_herdr_name`）：launch note 里的 `herdr=` token 优先，否则 `name#N` → `name-N`；非 ASCII / 含空白 → 跳过并报 stderr 一次。
- **单 agent 线程**（`_watch_agent_loop`）：`wait` → 非 `working` 状态发通知 → 转 30 s `get` 轮询；回到 `working` 清去重键并重新 `wait`；账本出现该实例终态事件即退出。stage-lead 线程另在 `stage_close`、同 stage 更新的 `monitor_launch` 或更新实例的 `monitor_restart` 时退出（`_watch_monitor_terminal`）。
- **去重**：同一 `(scope, agent)` 同一状态只通知一次；去重态存于共享 `notified_shared`，线程异常重生后继承、不重发（code-round1 C1-2）。
- **通知文本**：`[relay-light] <ledger agent> -> <state>` 与 `[relay-light] tick`；非 ASCII 或含换行的文本拒发并报 stderr。
- **只通知不写账（A101）**：watch 闭包无 `append_event` / 写模式 `open` / `write_text` / `os.replace` / `shutil` 等写调用；唯一子进程是 `HerdrClient` 调 `herdr`（`wait` / `get` / `prompt`），herdr 侧失败一律返回 None/False、不抛出；stdout 按 UTF-8 `errors="replace"` 解码。

## 3. 载体与死亡兜底（adapter 现役约定，RLT-A-14 契约 v2）

- **进程级**：watch 不直接跑在 pane 里，而是包在 shell 重启循环中：`while :; do python3 <RELAY_LOG> watch … ; rc=$?; case $rc in 0|2|3|4) break;; esac; sleep 5; done`（Windows 侧为 PowerShell 等价式）。崩溃 / 被杀后约 5 s 内重拉（batch-3 实测 ≤7 s）；0/2/3/4 视为正常结束或确定性错误，循环停止。
- **载体级（watcher 巡检）**：派活方先起 watch 再起 watcher，每个终端空间一个 watcher agent。watcher 每 10 分钟只读巡检本空间 watch 是否存活：存活核用 `pgrep -af` 加排除自身行（Windows 用 `Win32_Process`）；缺席时再用 `status --json` 判本层是否已正常结束；未结束就向本空间派活方发 `[relay-light] watch-down stage <stage_id>` 或 `[relay-light] watch-down plan plan`，派活方核实后重拉。节拍：Claude 侧 `run_in_background` 跑 `sleep 600`；Codex 侧前台 `sleep 600`，`timeout_ms=660000`。
- **编排位**：收到 tick 只做 §7.2 通用对账，不做 watch 存活判定、不发 stall 提示。
- **节拍归属**：有 watch 时 20 分钟节拍由 watch 维持；无 watch 时由前台 `herdr agent wait --timeout 1200000` 维持。

## 4. 本卡未交付 / 已知边界

- Windows 两份用户级 skill 副本同步与 `HC-RL-A125` 两机终局回归挂起（F-002）。
- F-008：batch-3 观测到的第二条 `coder#1 -> done` 来源未定（进程内重发路径已闭合），P2 待复核。
- F-013：adapter「一 agent 一 tab」与 design「tab 这一层不使用」的载体口径漂移，登记 backlog。
- F-016：watcher 拉起后需一次轻推才进入节拍，登记 backlog（改 brief 让其自启）。
- H12 两组合（阶段级 × Codex watcher、编排级 × Claude watcher）未实测，按机制同构接受。
