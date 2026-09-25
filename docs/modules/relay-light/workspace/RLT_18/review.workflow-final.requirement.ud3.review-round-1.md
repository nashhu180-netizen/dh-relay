# RLT_18 workflow-final requirement（UD-3）· review-round-1

2026-09-25 · reviewer#requirement-ud3-r1（fresh，未参与本卡任何施工、批审与复核）· 审查对象：`evidence/ud3-h12/**`（commit `f495cf5` + 补记 `f4c2661`），signal `DONE.workflow-final.ud3.coder-u2.md` · 权威：晋级后 design/01 `HC-RL-H12` v2 行（:1426，RLT-A-14）、DevPlan RLT_18 验收口径 H12 行（:658）、`task_plan.md` §5.6（:343-370）与 §5.7、`decisions.md` UD-1/UD-5（用户裁决，只核落地忠实）。

## 结论

**FAIL** — 1 个 open P1（§5.6 明文要求的「两侧覆盖组合未实测」声明缺席），外加 2 个 P2（介入清单漏登 lead 输入框草稿 + 「用户键入」归因断言不可考；B 段 T1′−T0′ 未标注、~14 分钟检查间隔的成因未点出）与 4 个 P3。证据本体可信：H12-A/H12-B 主链全部承重断言已对 raw/ 原文逐字核到，无伪造；非目标（watch 写账/驱动/秒级监控/编排侧 stall 提示）未被违反。

## 发现

| ID | 级别 | 位置 文件:行 | 事实 | 建议整改 |
|---|---|---|---|---|
| RQ-U3-1 | P1 | `evidence/ud3-h12/H12.md`（全文）vs `task_plan.md:366` | §5.6 明文要求「`H12.md` 写明『阶段级 × Codex watcher、编排级 × Claude watcher 组合未实测』」；H12.md 全文无该句（grep `未实测\|两侧\|组合` 零命中）。覆盖缺口可从 :5 探针表推出（watcher-s=claude/阶段空间、watcher-o=codex/编排空间），且未测组合与已测侧机制同构（同一套 pgrep/status/watch-down 流程，仅 notify 目标与报信原文不同；节拍写法按 kind 不按层级），外推风险低——但明文规定的人判必备披露缺席，用户须自行推导才知道两侧覆盖不完整。 | H12.md 补一句「阶段级 × Codex watcher、编排级 × Claude watcher 组合未实测」（建议放 H12-B 节末或「节拍实测」节）。 |
| RQ-U3-2 | P2 | `H12.md:47-53` vs `raw/transcript-lead.txt:77`、`raw/pane-lead-t3.txt:77` | 「操作者介入」清单漏登 lead pane 输入框草稿 `check watch-down pane w4B:p1X still running`——该文字位于输入框边框内（:76-78 两条 ─── 分隔线之间），其后无 `●`/`✻` 回合，**确未提交、对链路零影响**；但介入清单的功用正是供人判排除干预，漏列一处使清单不完整。同节 :52 称 watcher-s 两草稿为「用户键入草稿」系归因断言：raw 无法区分 用户键入 / driver 经 send-keys 键入 / 客户端输入框自动建议——watcher-s 草稿在 17:18（`keep watching, next round`，pane-watcher-s-t3.txt:77）与 17:31（`stop watching, this is enough evidence`，transcript-watcher-s.txt:77）两次快照间变化，主动编辑与随上下文更新的建议两种解释都成立。 | 介入清单补 lead 输入框草稿条目（注明未提交、无回应回合）；「用户键入」改为中性表述（如「输入框内未提交文字，键入者不可考」）。 |
| RQ-U3-3 | P2 | `H12.md:30-31` vs `task_plan.md:361` | §5.6 要求「两段均在 `H12.md` 标注 T1−T0 与 T3−T1」：A 段已给 T1−T0「≈1–2 分钟」与 T3−T1（以「发现延迟 ≈8+ 分钟」形式，≈8.7–8.9 min）；B 段只给「T1′ 距 watcher-o 下次检查 ≈1.2 分钟」（≈T3′−T1′≈1.4 min），**未标 T1′−T0′**。按 H12.md 自定 T0′=watcher-o 首轮检查 17:03 计，T1′−T0′≈12.6 分钟，与 §5.6 预期的「≈8–9 分钟」不符；根因是已披露的 Continue 轻推使 watcher-o 节拍迟至 17:06:53 才武装，该侧检查间隔实际拉长至 ~14 分钟（17:03→17:17）——本 run 编排侧最坏情形发现时延其实 >10 分钟（启动伪影而非稳态），与「10 分钟是否可接受」人判直接相关却未标注。 | B 节补标 T1′−T0′（≈12.6 分钟）并注明与计划 8–9 分钟预期的偏差及成因（轻推延迟武装节拍）；T3′−T1′ 一并显式标注。 |
| RQ-U3-4 | P3 | `H12.md:17,19,31,33` | 引用行号小偏差（±1–2 行）与一处错引文件：①:17「post-close 进程表仅剩编排级 535995 与 watcher-o 包装 544623（raw/t1-close.txt 逐字）」——t1-close.txt:7 的 post-close 只列 `535995`，`544623` 出自 poll 行 12 起而非该文件；②:19 缺席窗口引「行 17–37」未含边界行 38（17:18:12，同样无阶段级 python，断言本身成立）；③:31「poll 行 34 起 watchpy 仅剩 544623，行 36 起为空」——实际 544623-only 始自行 32（17:15:40）、为空始自行 35（17:16:56）；④:33「poll 行 36–37 `orch done/2509 -> working/2522`」——转变发生在行 35→36（17:16:56→17:17:21）。各断言事实本体均逐字核到、时刻无误，仅引用行号/出处偏差。 | 修正四处行号/出处（①改为「t1-close.txt 见 535995；544623 见 poll 行 12 起」，③④按上记行号改）。 |
| RQ-U3-5 | P3 | `H12.md:53` | 「driver 未写任何 fixture 账本行」字面不成立——fixture 5 条建账行（plan_loaded…agent_launch，16:57:32）均为 driver 在 setup 阶段以 `relay_log.py add` 写入（setup-fixture.txt:2-6 与 fixture/relay_log.jsonl 逐字一致）。语境上指重演观察窗内未写，但按字面会误导。 | 改为「重演观察窗内（17:01 起）driver 未写账」或同义限定。 |
| RQ-U3-6 | P3 | `H12.md:57-62` | 收尾补救断言缺 raw 落物：「子进程 538717 被 kill、父壳退出，pgrep 复查无残留」无对应 raw 文件（log 尾止于入库行 10:54:12 可旁证追加停止，但 kill 与 pgrep 复核本身无凭据）；§5.6 收尾要求「`herdr agent list` 摘录无残留」——agents-final.txt 为 17:31 关 tab **前**快照（其中 7 个探针 tab 仍在列），关后 agent list 未留证。另两处节拍证据小缺口：watcher-o 600 s 合并调用起点「17:06:53」与 `timeout_ms=660000` 参数在 raw 中无直接出处（10m52s 时长可旁证未被截断、poll 行 12 起见包装进程 544623）；该调用返回码未捕获（对照 watcher-s 侧 transcript-watcher-s.txt:31-32 有 `exit code 0`）。 | 接受现状或补一句「kill/pgrep 复查与关后 agent list 无 raw 落物」；后续实测把补救命令输出 tee 进 raw。 |
| RQ-U3-7 | P3 | `H12.md:50` | 「两次均未改 brief 内容、未加提示」措辞绝对化——`act as this probe now`（Enter 提交既有草稿）与 `Continue` 严格说都是发往 agent 的额外 prompt；其内容确为无信息量的续跑指令、未改 brief、未泄露测试意图，结论方向正确但字面过强。 | 改「未改 brief、未注入与实验内容相关的提示」。 |

## 专项必核答复

1. **操作者介入认定**：`check watch-down pane w4B:p1X still running`（transcript-lead.txt:77 / pane-lead-t3.txt:77）与 watcher-s 两草稿（pane-watcher-s-t3.txt:77 `keep watching, next round` @17:18；transcript-watcher-s.txt:77 `stop watching, this is enough evidence` @17:31）均位于各 pane 输入框边框内、其后**无任何回应或新回合**——三处均未提交，对 H12-A/B 因果链零影响，**不构成介入**。是否为用户/driver 键入或客户端自动建议：raw 不可判（见 RQ-U3-2）。已提交的 `act as this probe now`（pane-watcher-s-t3.txt:16，有 `Ran 1 shell command` 回合）属下方专项 2 的已披露轻推。H12.md 措辞需更正：补登 lead 草稿、归因改中性。
2. **轻推与弹窗处置**：`raw/nudge-1.txt` 逐字核到 17:06:41.204 send-keys enter→ok（提交 watcher-s 既有草稿）与 17:06:42.218 prompt `Continue`→agent_prompted；`raw/watcher-o-dialog.txt` 逐字核到 17:04:57.263 send-keys `2`（Keep current model）→ok，保住了分配模型 GPT-5.6-Sol low。派单本体（17:03:11-12 brief-prompts.txt 五条 `Read <brief>`）投递的是 adapter 原文（见方法 §比对），三次处置均不含测试内容提示——**未违反「按 adapter 原文派单，不加提示」的实质**（不教练、不泄露），但严格说是额外输入，H12.md 已如实披露（:50）。对证明力的影响限于**节拍起点**：两侧 watcher 都靠这一推才进入巡检（watcher-s 停在确认问句、watcher-o 首回合结束未自动武装节拍）；其后的 关 pane→检出→报信→存活核→重拉→重拉后首通 全链无 further 操作者输入，链的证明力完整保留。附带观察（人判可一并权衡）：watcher 自主续拍在两侧都需一次人工轻推才走起来。
3. **T1 时机偏差**：目标 ≤30 s；实际 T0≈17:07（watcher-s 首轮检查）→T1=17:09:08.584，T1−T0≈2.1–2.4 分钟，H12.md 记「≈1–2 分钟」略有低估但已如实记为偏差（:18、:51）。发现时延 T3−T1≈8.7–8.9 分钟 ≈ 10 分钟上界的 88%，**呈现了接近最坏情形的体验**，且在断言界内（T3−T1 ≤ 10 分钟 + 一轮检查耗时）。H12-B 对照成立：T1′=17:15:39 落在 watcher-o 下次检查（≈17:16:53）前 ≈1.2 分钟，T3′−T1′≈1.4 分钟——短时延对照演示成功。两段合起来覆盖了 [≈1.4, ≈8.8] 分钟的发现时延区间供人判；唯 B 段 T1′−T0′（≈12.6 分钟）与该侧 ~14 分钟间隔成因未标（RQ-U3-3）。
4. **收尾遗漏**：`/tmp/rlt18-u3-poll.sh` 漏关至 09-25 ~10:55 属实且已如实披露（f4c2661 补记于 H12.md:62）。入库 log 共 2540 行：真实数据止于行 70（17:31:42），行 71（17:32:08）起为 `?` 噪声至尾行 10:54:12——「17:32 以后为噪声」边界精确、与 17:31:57 起的 7 tab 关闭回执一致；commit `f495cf5` 后工作区追加行已按未提交漂移丢弃（入库行未改动，git status 干净）。**对证据可信度影响小**：证据窗（17:03–17:32）完整无损，噪声标记清楚；对「收尾核验」一节的影响是补救动作本身无 raw 落物（RQ-U3-6）。「两侧覆盖组合未实测」的声明**未写明**（RQ-U3-1）。

## 核查范围与方法

- **RELAY_RECEIPT preflight**：`env | grep -i relay` 无 `RELAY_RECEIPT` 命中 → 正常复核面，未进 fail-closed 分支。
- **权威逐字**：design/01:1426（H12 v2 行）、:20（RLT-A-14 事件注记）、:1256/:1497（保号登记）；DevPlan:3,67,658（RLT-B-10 口径行）；task_plan §5.6（:343-370）与 §5.7（:372-385）；decisions.md UD-1（watch 三层兜底被 UD-3 取代关系）、UD-5（Q1–Q6）；dispatch/README.md 实测批授权与允许路径。
- **逐条断言对 raw 抽核（不信摘要，承重项全核）**：
  - 启动：`watch-loops-start.txt` 17:01:49 pane run 两条、`535991`（stage→lead）/`535995`（plan→orch）逐字与 H12.md:7 一致；`agent-starts.txt` 五探针 argv 与 `execution_strategy.md:49-53` 用户确认 argv 逐字一致（model-allocation gate 先于启动，:6 规则满足）；`setup-fixture.txt` 建账 5 行 + `lint: ok`；`setup-tabs.txt` 7 tab 创建于 w4B、名均 `rlt18-probe-u3-*`。
  - 节拍：`pane-watcher-s-t3.txt` 逐字核到 17:07 首轮 `watch alive (pid 535991)`→静默、`run_in_background` `sleep 600`（id `beoheexee`）；watcher-o 合并调用「`Worked for 10m 52s · 5:17 PM`」（pane-watcher-o-t3.txt:75 逐字）——Codex 600 s 前台调用未断拍属实；包装进程 `544623` 自 poll 行 12（17:07:14）起在列。
  - H12-A：T1=17:09:08.584 `tab close w4B:t1N`→ok（t1-close.txt:4-5）；T0≈17:07、worker `working/2511`（poll 多行一致）；缺席窗 poll 行 17（17:09:20）起无 535991；watcher-s 第 2 轮（17:17:5x–17:18）检出缺席+stage open→`herdr agent prompt rlt18-probe-u3-lead "[relay-light] watch-down stage RLT18U:C#1"`，pane 逐字「reported … (1st absence-count report). No pane Enter needed.」；到达窗 17:17:46–17:18:12（poll 行 37→38 `lead done/2510→working/2527`）；lead 存活核空→判死→w4B:p1X 重拉（transcript-lead.txt:41-58 逐字）；poll 行 39（17:18:37）`watchpy=560184,561980` 新阶段级 python 561980；worker 17:18:37 转 done/2530→新 watch 推 `coder#1 -> done`→lead 核 561980 判存活不重拉（:60-74）；watcher-s 第 3 轮 ~17:28 `Watch is back (pid 561980) → silent`（transcript-watcher-s.txt:53-66）、本缺席期仅 1 条报信。
  - H12-B：T1′=17:15:39.040 `tab close w4B:t1P`→ok、`(no watch procs except watcher-call wrappers)`（t1p-close.txt:2-5）；watcher-o 第 2 轮 pgrep 空（exit 1）→status `open_stages=["RLT18U:C#1"]`/U1 open/`coder#1 无终态事件`→`watch-down plan plan` 发 orch、读 pane 末行无 `queued`/`Press Enter to send` 未补 Enter（pane-watcher-o-t3.txt:39-44,73）；到达窗 17:16:56–17:17:21（poll 行 35→36）；orch 核死→重拉 `PID 560184` 于 w4B:p1W（pane-orch-t3.txt:39-45 逐字），poll 行 37（17:17:46）`watchpy=560184`。
  - H12-①：`evidence/batch-3/H12.md:10-16` + `raw/h12-1-kill-sequence.txt` 逐字核到 `kill 3774076`@08:05:40.583、壳 3773911 不变、新 python 3774542 ≤7 s、首通 `coder#1 -> done`（原文未保存以二手记录为准，引用忠实）；H12-C 按 UD-5 Q6 不做，:45 注明依据。
  - 收尾：cleanup-close.txt 7 tab 全 ok + C1-1 过滤后 watch 进程空；cleanup-verify.txt `__pycache__` 审计空、fixture lint ok、`Ran 274 tests … OK`、pwsh `RELAY ALL PASS (SKIPPED: 1)`；`人判结论` 格留空（:80）守住只取证不判。
- **非目标核对**：全部 raw/probe-briefs/fixture grep `stage-stalled` 零命中（编排侧无 stall 提示成立，transcript-orch 三条 `monitor#1 ->` 推送均只答记录不动作）；无任何 `relay_log.py add/checkpoint/close` 出现于 raw（watch 写账未犯）；watcher 节拍 600 s（25 s poll 是 driver 观测工具非机制）；transcript 中 watch 只推送、无探针驱动行为（驱动未犯）。
- **派单原文比对**：watcher-s/watcher-o brief 的「派单」代码块与 adapter-claude-code.md:82-92 / adapter-codex.md:84-94 逐字一致（仅 `<…>` 占位代入本空间值）；lead/orch「规则」节与 adapter stage-lead 位（:132/134）、编排位（:133）原文一致并含 probe 具体化插入（w4B/tab 名）——「原文照录」标签略松但插入均为机械脚手架，无测试提示。
- **提交与路径**：`f495cf5` 全部落 `workspace/RLT_18/**`（fixture 在豁免 glob 内）；`f4c2661` 仅 H12.md +1 行；git status 干净。

## 范围外发现

- **tab/pane 载体词漂移**：实测以关 tab（t1N/t1P）杀死 watch 载体，design/01 H12 v2 与 RLT-A-14 统一写「pane」；findings.md F-013 已登记归 backlog 另案裁定，不属本路新发现。
- **Codex 侧稳态节拍 ≈10.5–11 分钟**：`Worked for 10m 52s` 含 sleep 600 + 检查/报信耗时，一轮略超 10 分钟名义值，在 D16「节拍 ±1 分钟可接受」界内，供人判知悉。
- **watcher 自主续拍**：两 watcher 均停在派单后首回合（确认问句/回合结束），靠一次完成性轻推进入巡检——机制自启动可靠性的观察，已如实披露于介入节，方向问题是否需流程层跟进归 orchestrator/用户。
- **前置豁免一致性**：实测全在 Linux（豁免②挂起 Windows 副本与 A125），brief 中 Windows 命令变体仅照录 adapter 未实跑——与既有登记一致，非新缺口。
