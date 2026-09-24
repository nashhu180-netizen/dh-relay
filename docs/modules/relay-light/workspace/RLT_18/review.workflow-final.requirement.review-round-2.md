# RLT_18 workflow-final requirement review-round-2

2026-09-24 · reviewer#requirement-r2（fresh 实例，未参与本卡任何施工、批审与 round-1 复核）· 审上一轮 requirement r1 唯一未闭合项 **RQ-1**（P2：H12-② 兜底链恢复半段未端到端演示）是否由 `evidence/rq1-redemo/`（commit `13e0210`）复演闭合。核查基准：派单六条判据 + round-1 RQ-1 整改建议「stage-stalled → 修正后存活核 → 判死 → 重拉 → 首条通知到达」。

## 结论

PASS — RQ-1 由复演闭合，无 open P0/P1。run-2 的 T1′→T6′ 每一步均在 raw/ 原文逐字核到；修正后存活核在真实 `bash -c` 包装下未自匹配且正确判死（正负两向各演示两次）；T3′ 确为编排 1200s tick 触发的 stage-stalled 而非普通通知；run-1 偏离与重跑理由如实披露、raw 双全，无挑样本；探针 argv、tab 清理、watch 零残留、改动面与 fixture 落点全部守住边界；T6′ 重观察通知是 adapter 明载语义，未引入新的需求层问题。

## 发现

| ID | 级别 P0/P1/P2/P3 | 位置 文件:行 | 事实 | 建议整改 |
|---|---|---|---|---|
| R2-1 | P3 | `evidence/rq1-redemo/H12-redemo.md:23,24,36` | 个别非承重细节无 raw 逐字出处或略窄于 poll 窗口：「循环壳 4140706（lstart 11:45:04）」在 raw/ 全文检索无此 PID/时刻（python 4140884 本身有 pane-lead-full.txt:205 + poll 行5 实证）；run-1 T2 标「11:55:3x–11:55:52」而 poll 显示 working 样本止于 11:55:27（窗口实为 11:55:27–52）；run-2 lead「done/2193 (12:00:3x)」而 poll 12:00:05 已 done/2193。均为约值级偏差，主链事实全部有原文。 | 人判展示时口头说明为约值即可；或补一句「时刻以 poll 采样粒度为准」。不影响 RQ-1 闭合。 |
| R2-2 | P3 | `evidence/rq1-redemo/raw/run2-setup.txt:9-10` | run-2 初始两 watch 的 `herdr pane run` 循环命令文本未逐字落 raw（仅时间戳；生成的 python cmdline 有 :12-13 实证）。「按 D13 跑 shell 重启循环」靠 run-1 CMD 原文（watch-loops-start.txt:3,6）与 T5′ 逐字循环（pane-lead-t4r.txt:277-285）旁证。非承重——T1′ 是整 tab close 杀死，与循环是否存在无关。 | 无（已成事实；后续实测把 pane run 全文 tee 进 raw 即可）。 |
| R2-3 | P3 | `evidence/rq1-redemo/H12-redemo.md:63-66`、`raw/pane-lead-t4r.txt:359,390-391` | T6′ 首条通知 `coder#1 -> done` 是新 watch（PID 24908）对已 done worker 的**重观察**（dedup per-process），且到达（~12:20:3x-41）晚于 lead 形式核写账（seq 6-8 ts 12:20:29-30）——对本 run 结果属信息冗余。但它正是 adapter-claude-code.md:101 明载的「重启后去重从零开始，已 settled 的在场 agent 可能各再收一次通知，按对账处理」语义，也恰是兜底链的设计本意（死窗期漏报的补报）；它证明了重拉 watch 不止进程在、而是端到端会观察→推送→唤醒 lead。证据已如实披露来源，无粉饰。 | 无。人判知悉即可——它证明的是「通知通道活着」，不是「lead 靠它才知道 worker done」。 |

## 核查范围与方法

- **判据(1) T1′→T6′ 逐步对 raw 原文（不信摘要，抽核全部引用行号）**：
  - **T1′** `raw/t1r-close.txt` 逐字：pre-close 12:00:38.531 阶段级 python `4170554`（`--notify rlt18-probe2-lead --level stage`，h12r）在列；lead `done`/2193、worker `working`/2187、orch `done`/2192；`tab close w4B:t16` → `{"type":"ok"}`；post-close 仅剩编排级 `4170550` + `(stage-level watch gone)`。poll 行43（12:00:54）起 watchpy 只剩 4170550，全程一致。
  - **T2′** poll 行89 `12:10:36 | lead=done/2193 worker=done/2208 …`（前行 12:10:11 仍 working/2187）；worker pane 末行 `probe2-w2-done`（post-run-state.txt:46）；行89–132 lead 恒 done/2193——死窗期无任何发往 lead 的 prompt，属实。
  - **T3′** `raw/pane-orch-t3r.txt`：`❭ [relay-light] tick`（:59）→ `status --json`（:63-79，stage `RLT18Y:C#1` open、D1 open、`coder#1 无终态事件`）→ `herdr agent list`（:81-139）→ `Stall condition met — notifying stage-lead`（:141-143）→ `herdr agent prompt rlt18-probe2-lead "[relay-light] stage-stalled RLT18Y:C#1"`（:145-153，回执 `agent_prompted`）。对照组成立：同 pane 的 `monitor#1 -> idle/done` 普通推送（:11-41、:160-169）一律只答 `recorded — no action`——stage-stalled 确由 tick 触发而非普通通知。
  - **T4′** `raw/pane-lead-t4r.txt`：`❭ [relay-light] stage-stalled RLT18Y:C#1`（:256）→ 逐字执行修正后存活核 `pgrep -af -- 'relay_log.py watch --plan …/h12r --notify rlt18-probe2-lead --level stage' | grep -v 'pgrep' | grep -Ev "^($$|$PPID) "`（:258-262）→ **空输出 `Exited with code 1`**（:263）→ 判死（:265）。
  - **T5′** 同 pane：`herdr tab create --workspace w4B --label rlt18-probe2-watch-stage-re --no-focus` → `w4B:t17 / w4B:p17`（:267-275）；`herdr pane run` 跑 D13 循环 `while :; do python3 … watch …; rc=$?; case $rc in 0|2|3|4) break;; esac; sleep 5; done`（:277-285 逐字）；复核命中 `24908 python3 … --level stage`（:287-296）；poll 行134 `watchpy=24908,4170550` 旁证。
  - **T6′** 同 pane `❭ [relay-light] coder#1 -> done`（:359）+ poll 行135 `12:20:41 lead … -> working/2226`（被通知唤醒）；lead 自述来源「fresh watch re-observing … dedup is per-process」（:390-391）。观察窗：T1′ 12:00:38 → 上限 12:25:38，链内事件止于 ~12:21:07（poll 行136），全在窗内。
- **判据(2) 存活核未自匹配且正确判死**：`pgrep` 空输出 + exit 1（:263）对 batch-3 幻 PID 机制是直接反证——Devin 探针命令同样经 `bash -c '<全文>'` 包装（pane-lead-full.txt:148 实证其 argv 含命令全文），包装壳 cmdline 必含 `pgrep` 字样且为 `$$`/`$PPID`，两道过滤任一都使其不可命中；同时 watch 真死（T1′ 起 poll 连续只见 4170550）→ 判死正确。正向亦验：同管道在 :214 命中 4170554、:292 命中 24908。两向、两 run 各演示一次（run-1：pane-lead-full.txt:170-175 空→判死、:200-209 命中 4140884→判活）。
- **判据(3) T3′ 为 tick 触发**：编排 watch `4170550` lstart 11:59:33（run2-setup.txt:9-13）+ `WATCH_TICK_SECONDS = 1200`（relay_log.py:3527，发送在 :3944）→ 锚点 ≈12:19:33；orch `done/2192 → working/2218` 于 poll 行133（12:19:51），与「tick → prompt → 唤醒」时序吻合；orch 全程只对 `tick` 做对账（见上），死窗期 lead 侧零 prompt。无 driver 手动伪造迹象（最后一次 driver→orch prompt 是 11:59:45 的 brief，run2-setup.txt:16）。
- **判据(4) run-1 偏离与重跑理由如实**：run-1 全程未发生编排 tick（编排 watch 11:58:33 随 tY 关闭，首锚 ~12:02:41 未达，run1-winddown.txt + poll 行37 `watchpy=none`）——lead 是被**排队中的** `coder#1 -> idle` 提前唤醒后走「任何唤醒先核存活」完成判死+重拉（pane-lead-full.txt:170-209），恢复动作成功但未走 stage-stalled 路径，故按派单链路用独立 fixture h12r 重跑（不改写 h12 账本，两者 lint 均 exit 0）。偏离原因、防提前唤醒措施（worker `TASK: sleep 660` 先于 watch 启动，H12-redemo.md:32-34 + run2-setup.txt:2-4 + worker 实际 working 至 ~12:10:2x）全部前置披露；run-1 raw 完整保留，无挑样本。
- **判据(5) 边界逐项**：
  - 探针 argv：三探针 `herdr agent start` 回执 argv 逐字为 `["devin","--model","swe-2-medium","--permission-mode","dangerous"]`（raw/agent-starts.txt:3,6,9），与 execution_strategy.md:38-40 用户确认 argv 一致。
  - probe tab 全关：cleanup-verify.txt:3-20（t0/t11/t12/t14/t15/t17 关 + tab list 无 probe2/watch tab；tZ/tY/t16 已先于 T1/T1′/winddown 关）；本路独立复核——当前 `pgrep -af 'relay_log\.py watch'`（滤自身包装）**零命中**，watch/loop 无残留。
  - 未改代码/adapter/SKILL.md/design/batch-3 证据：复演提交 `13e0210` 文件面仅 `evidence/rq1-redemo/**`（git log --name-only 逐文件核）；691d7d1 后的 `4c3eef5` 代码/SKILL 改动属 consistency 整改线、已被 consistency r2 PASS，与本复演无关。
  - fixture 仅在 `evidence/rq1-redemo/fixture/{h12,h12r}/**`（find 核实），落在 execution_strategy.md:60 追加豁免 glob 内；账本写均带 `--config-dir <fixture>/config`，未污染仓账本。
  - 探针未写仓库文件：五份 brief 均禁读写仓文件（fixture 目录除外），pane 原文未见越界写；lead 对 fixture 账本写 seq 6-8 是其 stage-lead 角色 brief 允许且仅落 fixture。
  - `__pycache__`/`*.pyc` 审计为空（cleanup-verify.txt:26 + 本路 find 复核）；证据无凭据值；人判结论格留空（H12-redemo.md:94-96），「只取证不判」守住。
- **判据(6) 新需求层问题**：T6′ 通知语义已在 R2-3 评估——adapter-claude-code.md:101 明载重启后 dedup 从零开始、已 settled 在场 agent 可能各再收一次通知，复演观察与该文一致；「首条通知到达」证明了重拉 watch 的真实功能（观察→推送→唤醒全通），不要求「新变迁」。另：重拉 watch 在 stage_result 后按退出码 0 干净退出、循环 break（:368-395 + poll 行136 24908 消失）——附带实证了末节点关闭退出路径。无新需求层问题。
- **其他抽查**：h12/h12r 账本 seq1-8 与 post-run-state.txt 逐字一致；probe brief 存活核/重拉段与 adapter :113、编排位规则与 :114 逐字一致（仅替换 plan_dir/agent 名/stage_id）；lead/orch/worker 三 brief 的「不读流程文档、不写仓文件、只按 brief」约定齐；`monitor_launch herdr=rlt18-probe2-lead` 使编排级 watch 盯 lead 本体（`monitor#1 -> <state>` 推送来源成立）。

## 范围外发现

- adapter 编排位规则「stage-lead 为 idle」在 herdr 状态集里的字面是 `done`/`idle` 两态，orch 探针按 `done/idle` 合并解读执行（pane-orch-t3r.txt:142）——忠实于文档化启发式但暴露 adapter 用词轻微含糊（batch-3 实测亦同）；是否收紧措辞归 consistency/设计层，不属本路。
- 复演以 Devin 探针执行 **claude adapter 文本**（H12-redemo.md:5 已声明）：自匹配机制是 `bash -c` 包装层行为，本次实证在该层成立；claude/codex 各自包装未逐一重测（机制同质 + test_c1_1 单测已钉，风险低）。Windows 侧 `Get-CimInstance` 写法仍无实跑（F-002 挂起项的既有边界，非本次新缺口）。
- run-1 中 lead 被排队通知唤醒的时序（brief-prompts.txt:3 title 已是 `coder#1 -> idle`）再次旁证 H11 的「忙时排队留存」观察——与 RQ-2/RQ-3 登记的投递层现象同源，不另立案。
