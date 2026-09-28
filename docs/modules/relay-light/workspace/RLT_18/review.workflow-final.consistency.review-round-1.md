# RLT_18 workflow-final consistency review-round-1

2026-09-24 · reviewer#consistency-r1（fresh，未参与本卡任何施工与批审）· 对象：`git diff origin/master...HEAD`（基线 `5ab3bba`，HEAD `691d7d1`）全部改动与 workspace 工件。只回答 consistency 一路：adapter 两份之间、adapter↔SKILL.md、SKILL.md↔design、task_plan↔实现、证据↔raw 的矛盾与残留旧口径；术语（stage-lead / watcher / single-task）一致。

## 结论

FAIL — 一项 open P1（CS-1：SKILL.md:347「120 秒空闲上报由程序负责」为 design 与实现均无依据的不实程序能力断言）。

## 发现

| ID | 级别 P0/P1/P2/P3 | 位置 文件:行 | 事实 | 建议整改 |
|---|---|---|---|---|
| CS-1 | P1 | `tools/relay-light/skill/SKILL.md:347`（放弃项第 5 条，UD-2 项③，commit `0f9686f` 引入） | 该行写「状态变化通知、20 分钟 tick、**120 秒空闲上报**由程序负责」。但 watch 全部行为在 design/01 §3.6（480–491）冻结为三项：状态变化通知、30 秒 `get` 轮询、20 分钟 `[relay-light] tick`——无 120 秒周期、无「空闲上报」概念；实现常量 `WATCH_POLL_SECONDS=30`/`WATCH_TICK_SECONDS=1200`/`WATCH_WAIT_TIMEOUT_MS=30000`（`relay_log.py:3527-3529`），全文件无 120 秒机制。「120 秒节拍」只属于 single-task 的人肉 `phase=monitor`（design:971、A164、SKILL.md:333、两 adapter monitor 节拍行），且本卡同改的 SKILL.md:40 恰写明 single-task「无账本不接 watch、`phase=monitor` 仍以 120 秒节拍人肉充当」——347 行把该人肉节拍错误归属给程序，SKILL 内部亦自相矛盾。UD-2/task_plan 建议措辞（「watch 只通知不写账、不做驱动器与停滞检测；无 watch 时一律走前台 `wait` 回退」）不含此句，系改写时新增断言；check.batch-2 O-1 仅登记「改写非逐字」（P2 措辞保真），未核出该事实错误。 | 删去「120 秒空闲上报」子句或改回 UD-2 原意（如「watch 只通知不写账、不做驱动器与停滞检测；无 watch 时一律走前台 `wait` 回退」）；`test_a83_13`/`_skill_ud2_checks` 的 `abandon5` 断言可补防再犯片段（如断言不含「空闲上报」）。 |
| CS-2 | P3 | `task_plan.md:68`（D12②）与 `:134`（batch 2 §3a） | 计划内文引用的存活核命令为早期形态 `pgrep -f -- 'relay_log.py watch --plan <plan_dir> --notify <自己的 Herdr 名>'`；交付 adapter 为加固形态 `pgrep -af -- '… --notify <名> --level stage' \| grep -v 'pgrep' \| grep -Ev "^($$|$PPID) "`（Windows `Win32_Process`+排己）。两次增量均有登记：P2-C 补 `--level stage`（check.batch-2 #10）、C1-1 补排己过滤（code-round1 整改 `41c29ed`、L-03、progress wf 行）。漂移方向为增强且经复核，task_plan 属冻结计划档不回写。 | 无需动作；登记知悉计划文本滞后于交付文本属预期。 |
| CS-3 | P3 | `evidence/batch-3/probe-briefs/lead-claude.md:19`、`lead-codex.md:19` | 探针派单携带的存活核为当时 adapter 形态 `pgrep -f -- '… --notify <名> --level stage'`（早于 C1-1 排己加固）；lead-claude 照字面执行产出幻 PID「存活 pid 3787534」，恰为加固修复的实测动因（raw/pgrep-selfmatch.txt）。派单工件为冻结历史证据，不回改；与现行 adapter 文本不同步属时序必然，非矛盾。 | 无需动作。 |

## 核查范围与方法

- **adapter 两份互核**：`git diff origin/master...HEAD` 两 adapter 逐 hunk 比对——watch 默认/回退、D13 重启循环（POSIX `case 0|2|3|4` ↔ PS `-in 0,2,3,4`）、D12 三层死亡处置、`stage-stalled` 文案、`herdr=` 约定、节拍归属两句逐字对称；差异仅载体约定（claude tab / codex pane，F-006 已登记）与 kind 能力（codex 无 `run_in_background`，方式 3 明确不适用），均有意且正确。
- **adapter↔实现**：CLI 签名 `watch --plan --notify [--level stage|plan] [--config-dir]` 与 `main` 注册（`relay_log.py:3990-3996`）一致；调用行参数顺序「`--plan … --notify …` 首两位」与 adapter 存活核定位口径一致；退出码停集 {0,2,3,4} 与 `_error` 缺省 2 / `_runtime_plan`·配置 3 / `_ledger_error` 4 / 正常 0 映射一致；tick 1200、30 秒轮询、`[relay-light] <agent> -> <state>` 单行 ASCII、`herdr=`→`<名字>-<attempt>` 猜测逐项对得上。
- **adapter↔SKILL.md**：硬规则 8 新句与两 adapter 派单硬规则句一致（「无 watch 时不得结束回合空等」保留）；watcher 行（:40）与 adapter single-task monitor 节拍（每 120 秒，`adapter-claude-code.md:168`/`adapter-codex.md:170`）、SKILL.md:333 一致；**放弃项 :347 发现 CS-1**。
- **SKILL.md↔design**：硬规则 8 对应 §7.2:898 一句话口径；watcher 行对应 design:971/A164 的 120 秒人肉 monitor；「编排 tick 驱动停滞对账」对应 §7.2:896 + UD-1 B′；`stage-stalled` 流程为 UD-1 裁决扩展（design 未写，decisions.md 已登记，adapter 承载），不构成矛盾。
- **task_plan↔实现**：D1–D13 全部落地（`_watch_should_exit`/`_watch_present_monitors`/`_watch_monitor_terminal`/`HerdrClient`/`WatchClock`/`run_watch` 均在）；A82/A83/A101 oracle 要素由 WatchTests/SkillAdapterTests/SkillCoreDocTests 承接；仅存活核文本滞后（CS-2）。
- **证据↔raw**：抽查批三关键断言——`pane-lead-claude-t3.txt:23/27` 两条 `coder#1 -> done`、`:69` `stage-stalled RLT18X:C#1`、`:73` 幻 PID「存活 3787534」、`pgrep-selfmatch.txt` 复现记录——与 `H12.md`/`check.batch-3.md` 复审结论逐字相符；batch-3 评审 F-1~F-8 已在整改 `e144dac` 闭合，本路未见新证据/原文不一致。
- **术语**：`stage-lead` 在两 adapter 与 SKILL.md 一致使用；账本标识 `monitor#<n>` 为有意保留（SKILL.md:31 注记、`_watch_present_monitors` 合成、`monitor_launch` 事件）；`single-task` 的 `phase=monitor` 沿用历史合同（SKILL.md:343）；`监工` 在 skill/adapter/实现中零命中（`test_relay_log.py:4119` 一处为 RLT_05 既有 fixture note 自由文本，不在本卡 diff，范围外）；「watch 未实现/尚未实现」在交付文件零残留（仅任务档与评审记录的引用语境）。
- **复跑**：`cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.WatchTests test_relay_log.SkillAdapterTests test_relay_log.SkillCoreDocTests` → 66 tests OK（4.134s），与 `evidence/workflow-final-remediation-1/green.txt` 一致；RELAY_RECEIPT preflight 为空；`__pycache__`/`.pyc` 审计为空。

## 范围外发现

- `origin/master` 已漂移至 `13d477b`（`evidence/workflow-final-remediation-1/path-audit.txt` 已标注）——收口 rebase/合入属 orchestrator 与用户闸门。
- SKILL.md 第 40 行与放弃项行均为 UD-2 限定点位内的改写（非逐字），check.batch-2 O-1 已按 P2 登记措辞保真度；CS-1 为该改写引入的实质事实错误，单列升级。
- F-008（第二条 `coder#1 -> done` 来源未定）维持 code-round1 r2 结论：进程内重发路径已闭合，其余候选悬置——不属本路新增。
