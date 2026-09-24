# check.batch-3 — RLT_18 batch 3 实测批复核（batch-reviewer#b3，初审 round 1）

> 日期 2026-09-24。审查对象：commit `fe1cf00`（batch 3 实测证据，仅 workspace 文件，无代码改动）。
> 复核方式：逐项对 task_plan batch 3 完成判据与探针设计、decisions.md UD-1、execution_strategy.md 已确认 argv 与 fixture 豁免；逐字核全部 12 份 raw 文件与三份证据文件的引用一致性；本棒独立执行 fixture lint ×3、路径审计、探针/watch 残留核验（herdr tab list / agent list / pgrep）、凭据扫描。不重跑实测、不改代码。
> RELAY_RECEIPT preflight：`env | grep -c '^RELAY_RECEIPT='` = 0，无 RELAY_*，按正常流程执行。

## 结论：FAIL

形式判据（三份证据文件、H12 三节、fixture lint、零残留、路径审计、回归自洽、无冒写人判、无凭据）全部满足；但**证据文字与所引 raw 存在 4 处实质不一致/无据断言（F-1~F-4）与 4 处引文或时刻不准（F-5~F-8）**。本批全部价值在于交给用户的人判证据必须可被 raw 复核——凡「raw 摘录与结论文字不一致」即属本批致命项，全部可整改（改文字/补出处即可，不需重跑实测）。

## 逐项核对（task_plan batch 3 完成判据 + 派单重点核项）

| # | 检查项 | 结论 | 依据 |
|---|---|---|---|
| 1 | 三份证据文件存在、各含时刻/内容与 raw 引用 | 符合（形式）；引用准确性见 F-1~F-7 | H11-claude.md（布置+关键观测+附带观测+原始文件+人判结论留空）；H11-codex.md 同构；H12.md 见 #2 |
| 2 | H12.md 含 H12-①/H12-② 两节、T1/T2/T3、T1 时 worker 状态摘录、操作者介入节 | 符合 | 「H12-① 进程级自动恢复」「H12-② 阶段级 pane 被关」分节；T1=08:08:14、T2≈08:08:5x–08:09:10、T3≈08:14:03–08:14:1x；T1 时 worker=working 引 poll 08:08:09/08:08:30（本棒核实为真）；「操作者介入」节列 tab create/close、pane run、agent prompt、kill、send-keys 清 ghost、pgrep 复现，有介入已如实写 |
| 3 | 编排级 watch 在 T1 前已运行（H12-② 前置） | 符合 | plan watch python PID 3756944，ps lstart=07:54:03 < T1 08:08:14；poll 每次采样均在 |
| 4 | T3 tick 锚点与对账/stage-stalled/存活核记录 | 符合 | lstart+1200s=08:14:03 与 pane-orch-t3.txt `❯ [relay-light] tick`→Ran 3 shell commands→对账结论文（done 8:14）一致；stage-stalled 于 pane-lead-claude-t3.txt:69；lead 答「存活（pid 3787534）未重拉」（:73），与进程表无该 watch 的事实核验及 pgrep-selfmatch 复现一致 |
| 5 | H12-① kill/重拉记录 | 符合（重拉首通 pane 原文缺见 F-5） | kill-sequence.txt：python 3774076 kill@08:05:40.583 → 循环壳 3773911 不变 → 新 python 3774542（t+7s）；命令输出原文齐 |
| 6 | fixture lint ×3 exit 0 | 符合（本棒实测） | `python3 tools/relay-light/relay_log.py lint --plan <fixture> --config-dir <fixture>/config` ×3 全 `lint: ok` exit 0；账本各 5 行、ts 全为 07:51 创建期，实测中未被写（与 cleanup-verify 一致） |
| 7 | 无 rlt18-probe-* 残留 | 符合（本棒实测） | `herdr tab list --workspace w4B` 仅 t1/t2/t3/t4/t5/tA/tK（tK=本 reviewer）；`herdr agent list` 无 rlt18-probe-*；`pgrep -af 'relay_log\.py watch'` 与重启循环模式均无真实进程（唯一命中为本棒自身包装壳） |
| 8 | §1.1 路径审计（fixture 豁免精确 glob） | 符合（本棒实测） | 审计命令输出空；无 `__pycache__`（含 --ignored）；`git diff --check` 干净；fe1cf00 提交面仅 evidence/batch-3/** + progress/lesson_candidates/DONE，全在允许路径内；execution_strategy/decisions 未被 coder 写 |
| 9 | §1.6 回归全绿 | 符合（登记自洽，按规不重跑；无时间戳见 O-4） | regressions.txt：262 tests OK（=batch-2 后 test_relay_log 数）、pwsh RELAY ALL PASS SKIPPED:1；本批无代码改动 |
| 10 | 探针按已确认 argv 启动 | 部分符合（O-3） | lead-codex 启动行逐字在 pane 卷动区，与登记 `codex -m gpt-5.6-sol -c model_reasoning_effort=low --dangerously-bypass-approvals-and-sandbox` 一致；orch 横幅 Sonnet 5 low；lead-claude 状态栏 Sonnet 5+bypass；worker 无 pane 原文。探针模型闸 624685a 先于派工 |
| 11 | 实测授权边界（只在 w4B、rlt18-probe- 前缀、用完关闭） | 符合 | tab 均 w4B；agent 名全 rlt18-probe-*；已全关（#7） |
| 12 | 无冒写人判 | 符合（O-6 措辞注意） | 三份「人判结论」均留空「（留空，由人判）」；正文「未被丢弃」等句有 raw 直接支撑但近结论措辞，登记注意 |
| 13 | 凭据不泄露 | 符合 | 凭据模式扫描无命中；pane 原文仅含 UI 装饰（版本横幅、credit 提示、用户名状态栏），无密钥类串 |
| 14 | watch 只读不写账 | 符合 | 三 fixture 账本 5 行止于 07:51 创建、lint 通过；探针 brief 与行为均未写账 |
| 15 | progress 写者边界 | 符合（内容含 F-1 同源句） | 施工里程碑仅 batch-3 一行（coder#b3）；证据账本 E-301~E-305；其余角色未写 |
| 16 | DONE signal schema | 符合 | 单行齐字段、verdict=READY、5 条 evidence 路径均存在 |

## FAIL 项（可整改具体项）

### P1 — raw 与证据文字实质不一致/无据

- **F-1「短暂 h12-stage python」断言被所引 raw 否定**。`H12.md`「中间观测」：「进程轮询显示一个新的 `python3 … fixture/h12 --notify rlt18-probe-lead-claude --level stage` 于 **08:08:30、08:08:50 两次采样存在**，08:09:10 起消失（raw/agent-status-poll.log）」。本棒逐行核：该文件 08:08:30 与 08:08:50 两次采样各只有 3 个 watch python（plan + h11-claude + h11-codex），**无 h12-stage**；h12-stage python 最后出现于 08:08:09 采样（pane 关闭前）。同源扩散：`H11-claude.md` 附带观测①「短暂 python（08:08:30–08:08:50 存在于进程表，见 H12.md）」、②「pid 3779796 可能为真命中」，及 `progress.md` batch-3 行「来源未定的短暂 h12-stage python」。lead-claude 第二条 `coder#1 -> done`（pane-lead-claude-t3.txt:27）确为实事，但「短暂 h12 python 所发」的归因当前无 raw 支撑。
  整改：改写为「poll log 未捕获该进程；第二条通知来源未定（候选：h11-claude watch 重发 / 去重缺口 / 未被采样的短命进程；lead 08:09 应答 pid 3779796 提示当时或存在实例）」等如实措辞；若有当时其它进程快照请补入 raw/ 并改引。
- **F-2 lead-codex working 窗口夸大**。`H11-codex.md` 轮询行：「lead-codex `working` 08:06:28→**08:12:14** 前后」。poll log 实为 working 止于 08:10:12 采样、**08:10:32 起持续 done**。「08:12:14」在全部 raw 中无对应时刻。
  整改：改为「working 08:06:28→08:10:12，done 自 08:10:32」。
- **F-3 codex「第二条通知」无据**。`H11-codex.md` 关键观测第二条：「**08:15:59 pane 读**（raw/pane-lead-codex-0809.txt 同段后文）：第二条 `› [relay-light] coder#1 -> done` 位于两条 sleep 任务条目之间」。所引文件是 **08:09:58 单快照**（首行 `now 08:09:58`），全文仅一条 `› [relay-light]`（第 46 行，位于第二条 sleep prompt 之后而非「两条 sleep 条目之间」）；raw/ 下无任何 08:15:59 codex pane 文件。另：07:57 启动首通在该 pane 可见转写中亦不可见（banner 起完整，ack 7:53 → WAKE prompt 之间无通知行）。
  整改：删去该断言或补真实 pane 原文入 raw/ 并改引；如需保留「两条通知」事实请注明各自的原始出处。
- **F-4 H11-claude 行级引用错 + 「排队形态」直接证据缺**。①「pane-lead-claude-0809.txt 第 10 行 `❯ [relay-light] coder#1 -> done`」——实际在**第 4 行**（第 10 行是 `done 8:09` 标记）；②「第 8–14 行：上方 `❯ TASK: seq 1 500000000 …` 排队项紧邻其下」——该文件**无 TASK 行**，TASK 排队项在 pane-lead-claude-t3.txt 第 8/12/14/18 行；③「**08:09:3x pane 读**：该通知以 `❯` 排队形态显示在输入区」——现存唯一同时段快照为 08:09:58，其时通知已在转写中作答完毕（done 8:09）、输入框为空 `❯`，「排队形态滞留输入区」无保存下来的直接证据（lesson L-04 的排队预览机制可作证，但本条观察本身的 pane 原文未留存）。
  整改：改引正确文件与行号；「排队形态」句改为有据措辞（如「两条 `❯` 通知按序出现于转写并被同一回合作答，见 t3.txt:23/27/29」），未留存的 08:09:3x 输入区状态如实标注未保存。

### P2 — 引文/时刻不准或证据缺口

- **F-5 重拉首通 pane 原文未留存**。`H12.md` H12-①：lead-claude ~08:05:5x–08:06:0x 收 `coder#1 -> done` 答「Watch 存活（pid 3774542/3774688）」，注「pane 原文见 pane-lead-claude-t3.txt 之前滚动区与 **08:06:10 pane read**」。t3.txt 可见区起于 ~8:08，该交换不在任何已存 raw；「08:06:10 pane read」文件不存在。kill/重拉本体（F-5 不影响）有 kill-sequence.txt 原文支撑，唯 lead 侧首通仅为同期二手记录。
  整改：注明「pane 原文未保存，以 h12-1-kill-sequence.txt 同期记录为准」并降级措辞，或补真实出处。
- **F-6 时刻笔误**。`H11-claude.md` 布置行「lead **8:57** 前已收并答…（done 7:57）」——与括号内 done 7:57 及全时间线（07:5x 启动）矛盾，应为 7:58 前后。
- **F-7 引文失真**。`H11-codex.md`：「Waiting for background terminal (**3m 14s** • esc to interrupt)」——raw 原文为「**3m 35s**」；同句末「→ `• Ran sleep 240 && echo LEAD_CODEX_WAKE2`（**8:10 完成**）」——08:09:58 raw 显示仍为 Waiting，「8:10 完成」仅为与 poll done 08:10:32 相容的推断，无 pane 原文。
  整改：按 raw 逐字改；「8:10 完成」标为推断或删。
- **F-8 H12-② 观察窗未满足规格尾巴**。plan：「观察至编排下一次 tick 之后 5 分钟」。tick ~08:14:0x、lead 应答 done 8:14；poll log 止于 08:15:57、cleanup 08:16:14——tick 后仅 ~2 分钟。规定记录项（T3/对账/stage-stalled/存活核/动作）虽已齐，但「tick 后 5 分钟」窗未满。
  整改：在 H12.md 如实注明观察止于 tick 后 ~2 分钟及理由，或补至 5 分钟的观察证据。

## 观察项（不阻塞，供 orchestrator/人判知悉）

| # | 级别 | 观察 |
|---|---|---|
| O-1 | P3 | fixture h12 的 `monitor_launch` 为 `herdr=rlt18-probe-lead-claude`，task_plan 字面建议 `herdr=rlt18-probe-orch`。实现版使编排级 watch 盯 stage-lead（monitor#1），与实测 `monitor#1 -> done` 推送及 stage-stalled 拓扑一致、更贴近真实 relay；H12.md 头部已如实披露映射。建议保留，请 orchestrator 确认该字面偏差可接受。 |
| O-2 | P3 | orch pane 的 `monitor#1 -> done` 实有 3 条（done 7:54/8:08/8:09，pane-orch-t3.txt:18–34），H12.md 对照节写「×2（8:08、8:09）」——窗口内口径可辩护但与所引 pane 计数不一致。 |
| O-3 | P3 | 探针 argv 核验程度：lead-codex 逐字一致；orch/lead-claude 横幅与状态栏一致（effort 仅 orch 可见）；rlt18-probe-worker 无 pane 原文（pane-worker-final.txt 为 pane_not_found），argv 无直接证据。另 codex 会话模型中途显示切换 GPT-5.6-Sol→GPT-6-Luna，证据已如实记异常（来源未定）。 |
| O-4 | P3 | regressions.txt 未记运行时刻；结果自洽且本批无代码改动，不阻塞。 |
| O-5 | P3·人判材料 | H11-claude 实验条件：claude 长命令一律后台化，通知到达时（~08:09:0x）poll 采样 lead-claude=done（微回合间隙），「≥90 秒前台任务造持续 working」未严格成立——证据已如实披露忙碌实为「排队 TASK+后台完成事件」微回合形态，交由人判。 |
| O-6 | P3 | 「未被丢弃」「符合 brief」等措辞近结论性，但由 raw 直接支撑且三份人判结论格均留空；维持注意即可。 |
| O-7 | P3 | pane 全文含 UI 装饰（版本横幅、`$250 credit`、用户名/主机名状态栏）——pane 原文属证据本体、非 herdr 结构化输出白名单对象；未见凭据。 |

## 复核人执行的命令（摘要）

- `env | grep -c '^RELAY_RECEIPT='` → 0（preflight 通过）
- `pgrep -af 'relay_log\.py watch'` / 重启循环模式 → 无真实进程
- `herdr tab list --workspace w4B` → 无 rlt18-probe-*；`herdr agent list` → 无 rlt18-probe-*
- `git -c core.quotepath=false ls-files -co --exclude-standard | grep -E '(^|/)(relay_plan\.md|relay_log\.jsonl)$' | grep -v '<fixture glob>' | grep '^docs/modules/relay-light/workspace/RLT_18/'` → 空
- `__pycache__`（含 --ignored）→ 空；`git diff --check origin/master` → 干净
- `PYTHONDONTWRITEBYTECODE=1 python3 tools/relay-light/relay_log.py lint --plan <fixture> --config-dir <fixture>/config` ×3 → 全 exit 0
- `git show fe1cf00 --stat` → 仅 workspace 文件；`git log` 确认探针模型闸 624685a 先于派工
- 凭据模式扫描（api_key/secret/token/bearer/ghp_/sk- 等）→ 无命中
- 逐行核读：三份证据 md × 全部 12 份 raw + 4 份 probe-briefs + 3 组 fixture（plan/ledger/config）
