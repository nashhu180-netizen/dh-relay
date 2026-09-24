# RLT_18 workflow-final code-round1 review-round-1

2026-09-25 · reviewer#code-round1-r1 · 目标实现：`git diff origin/master...HEAD`（基线 `5ab3bba`，HEAD `eef097e`）· 对应 `dispatch/workflow-final.md`「只核实现」路径。

## 结论

FAIL — 有一项 open P1（C1-1：adapter 存活检查 `pgrep -f` 自匹配，实跑已证假阳性），整改后复审。

## 发现

| ID | 级别 P0/P1/P2/P3 | 位置 文件:行 | 事实 | 建议整改 |
|---|---|---|---|---|
| C1-1 | P1 | `tools/relay-light/skill/references/adapter-claude-code.md:317`、`adapter-codex.md:315`（`pgrep -f -- 'relay_log.py watch --plan <plan_dir> --notify <自己的 Herdr 名> --level stage'`；Windows 等效行 :320/:318）；测试钉字 `test_relay_log.py:6427-6432` | D12②「先核 watch 存活」依赖该 `pgrep -f` 行。agent 经外壳执行该命令时，外壳命令行整串含搜索模式 → `pgrep -f` 命中调用者自身，恒返回幻影 PID → 结构性地永远报「存活」。批三 H12-② 实跑已证：watch 自 08:08:14 死后，stage-stalled 链路中 lead 仍答「存活: pid 3787534」（`evidence/batch-3/H12.md`、`raw/pane-lead-claude-t3.txt`）；driver 手工复现自匹配（`raw/pgrep-selfmatch.txt`）。即 UD-1 裁决的兜底恢复路径在被照字面执行时必然失效。次级 caveat：`--plan/--notify/--level` 不能区分同 plan 下共享 notify 名的两个 stage 级 watch。 | 保留「匹配循环壳或 python 都算存活」语义但排除自身祖先（例如 `pgrep -af` 后丢弃含 `pgrep`/`$$`/`$PPID` 的行），勿直接锚定 `^python3?`——锚定会把「重启循环 `sleep 5` 窗口期 python 暂死」误判为死 → 人工重拉与循环自动重拉竞争出双 watch、重复通知。Windows `Get-CimInstance` 按调用方式同样继承自匹配，需同步说明。两 adapter 同文同步改，`test_relay_log.py:6427-6432` 钉字断言随改。 |
| C1-2 | P2 | `relay_log.py:3748-3784`（`_watch_agent_loop` 无异常屏障）、`relay_log.py:3900-3921`（死线程重生） | agent 线程任意未捕获异常（如 `HerdrClient._run` 对非 UTF-8 herdr 输出 `UnicodeDecodeError`、prompt 含 NUL 的 `ValueError`）→ 线程死 → 主循环见 `not is_alive()` 且 agent 仍 present → 原地重生，`notified=None` → 若 agent 已 settled，立即重发同一 `X -> done`（正是 F-008 观察到的症状之一），且 pane stderr 之外无任何痕迹。同时与 D4「已盯过并退出的不再重开」在异常路径上冲突（批一 check O-4 曾以 P3 记；F-008 把该路径从理论升级为可解释实跑异常的唯一进程内机制）。 | 把 per-key 已通知状态移出线程局部（如共享 `dict[key] -> last_notified`，重生线程继承），或异常死不再重生并显式上报；无论取舍，重生时应留 stderr 日志便于归因。 |
| C1-3 | P3 | `relay_log.py:3922-3925` | tick 锚 `next_tick = now + 1200`（发 tick 时刻起算）而非 `start + k*1200`：主循环每轮 jitter 累积，多次 tick 后相位持续后漂。两次相邻间隔仍 ≥1200，§7.2 的 20 分钟兜底下限不受破坏。 | 可接受；若要定相位改 `next_tick += WATCH_TICK_SECONDS`。 |
| C1-4 | P3 | `relay_log.py:3542-3554` | `HerdrClient._run` 的 `subprocess.run` 无 `timeout`：herdr 挂死会卡住对应线程，`stop` 置位后也不退；`run_watch` join 上限 35s 仅告警（`relay_log.py:3933-3937`），daemon 线程随进程退出，不外泄。 | 可给 herdr 调用加兜底 timeout；现状影响有界，不阻塞。 |
| C1-5 | P3 | `relay_log.py:3732-3744` | `_watch_notify` 对非法状态（非 ASCII / 含换行）按「已通知」记账但不发送：`idle → idlé → idle` 会重发第二条 `-> idle`，且中间无可视通知行——理论上的无痕 dup 路径。触发依赖 herdr 返回畸形 status，未在实跑出现。 | 非法状态可不记账直接返回 `notified`，或放行 ASCII 可见集合；低优先。 |
| C1-6 | P3 | `test_relay_log.py:8380-8455`（`_watch_source_violations`） | A101 AST 哨兵残余面：`os.remove/unlink/mkdir`、`Path.unlink/mkdir/touch`、`subprocess.call/check_call/check_output` 未枚举；HerdrClient 之外的非 herdr 字面量首参 subprocess（如 `["sh","-c",…]`）也不在约束内。哨兵有效（git 只读子进程、HerdrClient 外 `["herdr",…]`、self.* IO、A101-2 变异自证均覆盖），但不是完备证明。 | 可按需补枚举；现状作为 tripwire 已够用。 |
| C1-7 | P3 | `test_relay_log.py:36`（`SUBCOMMANDS` 不含 `watch`）；`relay_log.py:3787-3794` + `3914-3916` | ① `run_cli` 自动注 `--config-dir` 不覆盖 watch（批二 check O-2 已记 P3）。② `_watch_monitor_terminal` 的 `monitor_restart` 分支只认 `stage_of`（线程生成时快照，不认后续 amend 节点）且分支整体偏窄（批二 check O-4② 已记 P3）。 | 均已有登记，可随下次整改一并处理或维持记录。 |

## F-008 专项：第二条 `coder#1 -> done` 的实现级核查

批三观测：lead-claude 在 08:09 一次回合内连续应答两条 `[relay-light] coder#1 -> done`（`raw/pane-lead-claude-t3.txt` :23/:27），worker 无终态行；lead-codex 亦曾见第二条 `› [relay-light]`（内容未保存，可能是 `› tick`）。findings.md F-008 记「来源未定」。

**结论：去重本身无稳态漏洞。** `_watch_agent_loop` 中 `notified` 的完整生命周期核查（`relay_log.py:3732-3784`）：同一 `(agent,state)` 只有在以下情况才会第二次发送——

1. 中间采样到 `working`（`get` 轮询 30s 粒度，工作期短于外部 20s 进程轮询、但盖过某个 get 采样点即成立）→ 这是 D9 设计的正确重通知；
2. 中间采样到其它 settled 状态且其 `-> X` 通知发出或被非法标记（C1-5，无痕但理论性）；
3. agent 线程异常死亡 → 进程内重生、`notified=None`（C1-2）；
4. watch 进程崩溃 → pane 内重启循环重拉（D13 记录的「重启 → dedup 复位 → 重发首条」），argv-only 的 20s 轮询分辨不出 PID 变化；
5. 有第二个 watch 源盯同一 agent——两份 fixture ledger 各仅一行 `agent_launch coder#1`，排除；
6. prompt 投递/transcript 层重复（herdr/agent 前端），watch 代码之外。

对观测到的第二条最一致的候选：(4)+(3) 与 lead 报的 `pid 3779796` 若确为真实 python 则吻合（轮询日志只记命令行、无法识别 PID 变化）；(1) 要求 worker 在 20s 轮询间隙内有一次 done→working→done 翻盖并盖过 get 采样点，窗口较紧但能同时解释 codex 侧第二条（若其内容确为 `-> done` 而非 `tick`）。现有原料无法裁决，「来源未定」维持；但代码层面可确认：**无稳态 dedup 缺陷，所有再通知候选均位于 dedup 不变式之外或其边界（进程/线程重启复位）**。C1-2 是其中唯一可通过代码消除的路径，已按 P2 列整改。

## 核查范围与方法

- **实现**：`relay_log.py` 全部 watch 路径——`HerdrClient._run/wait/get/prompt`、`WatchClock`、`threading.excepthook`、`_watch_herdr_name`、`_watch_present_agents`（终态过滤、bound_stage 过滤、setdefault 首个 launch note）、`_watch_present_monitors`（stage_id 匹配、最新 monitor、herdr= 缺省 `monitor-k`）、`_watch_agent_terminal`/`_watch_monitor_terminal`（done/agent_lost/cancelled、stage_close、新 monitor_launch、monitor_restart）、`_watch_notify`（`[relay-light] X -> Y`、非法状态拒发、失败不记账）、`_watch_prompt`（tick ASCII 校验）、`_watch_agent_loop`（wait → settled 通知 → polling get 30s → working 复位 → reattach wait）、`_watch_startup`（3 次读、2s 重试、stop 感知、`bound_stage` 判定）、`_watch_should_exit`（stage 级全节点 closed；plan 级末 stage stage_close）、`run_watch`（runtime 重读容错、线程生成/重生、tick 1200、join 35s 告警、stop 收尾）、`_watch_command`/`main`（exit 2/3/4 映射、notify 校验、非 RelayError 上抛 → 进程 1 → 循环重拉）。
- **测试**：`test_relay_log.py` WatchTests 39 例 + SkillAdapter/SkillCoreDoc 25 例全部实跑（`PYTHONDONTWRITEBYTECODE=1`）：39+25=64, OK。桩是真桩——`FakeHerdr` 脚本化 wait/get/prompt（无真 herdr、无真 sleep）、`FakeClock` 事件驱动虚拟时钟（advance_to/enter/leave/quiescent 配对、线程异常 excepthook 捕获断言为空、Python 版本门槛断言）；断言是行为级且可证伪（R-A82-2 钉死 wait→+30s get 次序、R-A82-5/6 钉调用序列与去重、R-A83-3/4/5 钉 exit 0、R-A83-12a-f 钉 exit 2/3/4 与 RuntimeError 冒泡、A101-2 变异注入证明哨兵非空转、A83-9 在基线 5ab3bba 上反证 adapter 合同 RED 有效）。
- **adapter/SKILL**：两份 adapter diff 对称——`watch --plan <dir> --notify <名> --level stage|plan --config-dir` 调用形态、D13 `{0,2,3,4}` 停集 + `sleep 5` 重启循环（POSIX `case` 与 PowerShell `-in` 等价）、D12② stage-stalled 仲裁段、`--timeout 1200000` 前台 wait 回退、空等禁令保留；SKILL.md 三处 watch 措辞改动在 UD-2 授权内。
- **边界核对**：禁改路径全空（`docs/modules/relay-light/relay/`、install_skill、roles/dh-mapping、design/、AGENTS.md 无 diff）；DevPlan 改动仅 RLT_18 行 + UD-2 白名单行，不属本路径问题。
- **证据交叉**：重建批三 H11/H12 时间线（两份 fixture、四只 watch 进程、两次 kill、orch tick、`agent-status-poll.log` 20s 轮询），对照 `raw/` 逐条核「谁可能发出第二条 done」；`raw/pgrep-selfmatch.txt` 与 `pane-lead-claude-t3.txt` 证实 C1-1 为实跑级而非理论缺陷。
- **既往登记**：check.batch-1（O-4 线程重生）、check.batch-2（O-2 SUBCOMMANDS、O-4② monitor_restart）、lesson L-03（pgrep 自匹配已记、adapter 未改）均已核对并采信，重复项不再升级占用编号。

## 范围外发现

- SKILL.md UD-2 措辞与 adapter 全文一致性属 consistency 路径（批二 check O-1 已登记改写句），本路径未见新增。
- `raw/orch-ghost-tick.txt`（编排侧输入框幻影 tick）与 codex 模型切换异常属 herdr/终端层环境现象，与本实现无关。
- Windows 镜像同步、A125、verify 挂起为环境/裁决事项（DevPlan 行已注明），不构成 code-round1 阻塞。
