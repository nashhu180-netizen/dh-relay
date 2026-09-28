# RLT_18 workflow-final requirement review-round-1

2026-09-24 · reviewer#requirement-r1（fresh，未参与本卡任何施工与复核）· 审查对象：`git diff origin/master...HEAD`（基线 `5ab3bba`，HEAD `691d7d1`）· 对应 `dispatch/workflow-final.md`「requirement」路径：DevPlan 目标与 A82/A83/A101 oracle「怎么证明」列是否真满足；H11/H12 证据能否支撑用户人判；非目标（写账/驱动/秒级监控）有无被违反；前置豁免三条影响是否如实登记。

## 结论

PASS — 无 open P0/P1。三条机器证 oracle 的证明要素全部落地且经本路独立复跑与抽查证实；H11/H12 取证如实、足以支撑人判（含一处 P2 恢复半段缺口与若干 P3 已披露边界）；非目标未被违反；UD-1/UD-2 裁决忠实落地；豁免三影响登记齐全。

## 发现

| ID | 级别 P0/P1/P2/P3 | 位置 文件:行 | 事实 | 建议整改 |
|---|---|---|---|---|
| RQ-1 | P2 | `evidence/batch-3/H12.md:44-49`、`adapter-claude-code.md:113`、`adapter-codex.md:115`、`evidence/workflow-final-remediation-1/pgrep-self-exclusion.txt` | H12-② 兜底链的**恢复半段在实测中未成功**：阶段级 watch pane 关闭（T1≈08:08:14）后，编排 tick → 对账 → `stage-stalled` 送达正常（T3≈08:14:03，距 T1 约 6 分钟，在 20 分钟界内，pane-orch-t3.txt:36-43 实证）；但 lead 的存活核命中 `pgrep -f` 自匹配幻 PID 判「存活」未重拉（pane-lead-claude-t3.txt:69-75 + pgrep-selfmatch.txt 复现实证）——「关 pane → stage-stalled → 正确判死并重拉」从未端到端成功演示一次。C1-1 整改（41c29ed）已修正两 adapter 存活核命令并经真进程三段实测（test_c1_1），但**修正后命令未在真实探针链路复演**：人判材料里「兜底兜得住」的恢复半段只有文本级修复 + 单测/真进程级验证，无活链路证据。证据本身如实完整（H12.md 如实记误判与未重拉、findings 登记清晰），不妨碍用户判断，但「兜底是否兜得住」的关键一半可信度依赖未复演的修正命令。 | 建议 orchestrator 在人验前安排一次短链路复演（仅需 stage-stalled → 修正后存活核 → 判死一段，现有 fixture 几分钟内可完成），或在人判展示时显式声明该缺口；不阻塞本路 PASS。 |
| RQ-2 | P3 | `evidence/batch-3/H11-claude.md:16,22`、`H11-codex.md:16`、`findings.md` F-008、`raw/pane-lead-claude-t3.txt:23,27` | lead-claude 转写出现第二条 `❯ [relay-light] coder#1 -> done`（:27，本路已对 raw 逐字核实两条均存在），lead-codex 亦曾见第二条 `› [relay-light]`（pane 原文未保存）；来源未定。code-round1 已判实现层无稳态 dedup 缺陷并闭合唯一可代码消除路径（C1-2/notified_shared，test_c1_2 钉住），剩余候选（未被 20s 轮询采到的短命重拉、prompt 投递层重复）在 dedup 不变式之外；「短命重拉→dedup 复位→重发」是 adapter 明载的既有取舍（重启后已 settled 在场 agent 可能各再收一次通知，按对账处理）。方向为「多发」非「漏发」，不削弱「未被丢弃」结论，但属通知可靠性信号。 | 维持 findings F-008 待复核登记（勿冒领结案，现状登记正确）；人判 H11「要不要退回前台循环」时一并知悉多发方向的实测观察。 |
| RQ-3 | P3 | `evidence/batch-3/H11-codex.md:8`、`raw/pane-lead-codex-0809.txt:28-31`、`raw/orch-ghost-tick.txt:14-15` | codex 侧 07:57 启动首通在自 banner 起完整的 pane 快照转写中**不可见**（ack 7:53 → 07:58:49 首条 sleep prompt 之间无通知行，本路逐字核实），其送达/处理无 pane 原文可核——idle/非忙碌时段存在未解释投递缺口。候选机制：herdr 排队预览层被后续 prompt 覆盖消失（orch-ghost-tick.txt 已记录同类现象）。证据已如实披露「不可见、无原文可核」，未夸大。 | 如实披露即可；人判知悉——若成立则为「投递层可靠」的反例，与忙时「排队留存」观察并存，供用户取舍。 |
| RQ-4 | P3 | `evidence/batch-3/H12.md:59-61`、`check.batch-3.md` F-5/F-8 | 「观察至 tick 后 5 分钟」实际约 2 分钟（规定记录项已在窗内齐获，提前收口原因已注明）；H12-① 重拉首通、H11-claude 首通应答、08:09:3x 排队形态等 pane 原文未保存——均已如实标注「未保存/以同期二手记录为准」，非隐瞒。 | 已披露；若人判需要更长自发观察窗或直接原文证据，现有材料的边界已在文内标明，取舍属用户。 |

## 核查范围与方法

- **权威来源逐字核对**：DevPlan「#### RLT_18」段（644-668）与任务表第 137 行；design/01 §3.6（480-491）、§7.2（894-908）、第 115/140/189/1436-1439 行、HC-RL-A82/A83/A101（1351-1353）、HC-RL-H11/H12（1408-1409）、A125（1280）；`decisions.md` UD-1/UD-2；`brief.md` 完成条件；`task_plan.md` D1-D13 解读登记与三批规格；AGENTS.md 宪章。
- **oracle 对账（机器证）**：
  - **A82**：R-A82-1~15 共 19 用例覆盖 oracle 三要素——发通知后无立即重挂（R-A82-2/3 钉 wait→+30s get 次序）、两条退出路径（R-A82-4a/b/c 终态退线程 + R-A82-5 working 重挂并再通知）、`(agent,状态)` 去重（R-A82-6、C1-2 重生继承去重态）。超出 oracle 的韧性用例（失败退避 R-A82-11、非法状态拒发 R-A82-13、运行期容错 R-A82-14/15）均为加固非替代。
  - **A83**：tick 1200s 周期与独立性（R-A83-1/2）、阶段级末节点 node_close 退出（R-A83-3/4/11）、编排级末 stage_close 退出（R-A83-5）、编排级只盯 monitor#n 不越级报 worker（R-A83-6/10）、退出后不再发（R-A83-7）、退出码 {0,2,3,4} 合同（R-A83-12a-f）；**结构检查适配层归属**由 R-A83-8（两 adapter 节拍归属/`--timeout 1200000`/`[relay-light] tick`/stage-stalled/存活核钉字）与 R-A83-9（5ab3bba 基线反证 RED 有效）承担；SKILL UD-2 三处由 test_a83_13 钉住。
  - **A101**：静态闭包检查（`_watch*`/`run_watch`/`HerdrClient`/`WatchClock` 根递归追调用，禁 append/open-写/replace 等）+ 变异注入自证（A101-2）+ 运行期 plan/ledger 字节不变（A101-3）。本路另对 relay_log.py watch 段（3521-3970）独立 grep：唯一副作用为 `subprocess.run(["herdr",…])` 与 stderr `print`，无文件写/追加/删除调用；实测旁证——三 fixture 账本 07:51 起 5 行全程未变（cleanup-verify.txt:7、check.batch-3 #6 本棒复验 lint×3 exit 0）。
- **独立复跑**：`cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.WatchTests test_relay_log.SkillAdapterTests test_relay_log.SkillCoreDocTests` → **66 tests OK（3.959s）**；<30s 证明桩是真桩（FakeHerdr 脚本化、FakeClock 离散事件，无真 herdr、无真 sleep）。`__pycache__`/`*.pyc` 审计为空。
- **H11/H12 证据 vs raw 逐条抽核**（不采信转述，承重断言全部对原文）：`agent-status-poll.log` 238 行——worker `working` 08:06:28→08:08:50、`done` 自 08:09:10；lead-codex `working` 08:06:28→08:10:12、`done` 自 08:10:32；h12-stage python 最后见于 08:08:09 采样、08:08:30 起消失且未再现（与 pane 关闭 08:08:14 一致）；lead-claude 除 08:09:31/08:14:15 两次 working 采样外全 done（微回合形态，证据如实披露）。`pane-lead-claude-0809.txt:4` 通知行、`:43` 空输入框；`pane-lead-claude-t3.txt:23/:27` 两条通知、`:69` stage-stalled、`:73`「存活（pid 3787534）未重拉」；`pane-orch-t3.txt:36-43` tick→Ran 3→对账发 stage-stalled、`:18/:24/:30` 三条 monitor#1→done 均答 Noted only；`h12-1-kill-sequence.txt` kill 3774076→壳 3773911 不变→新 python 3774542 ≤7s；`pgrep-selfmatch.txt` 幻 PID 机制复现；`pane-lead-codex-0809.txt:46` 通知行、`:49` Waiting 3m35s、启动横幅 GPT-5.6-Sol 与状态栏 GPT-6-Luna 切换异常属实。三份证据文件的人判结论格均留空、未冒判；F-1~F-8 整改后文字与 raw 逐字一致（本路抽核承重行）。
- **非目标核对**：watch 只 prompt `--notify` 目标（`_watch_notify`/`_watch_prompt` 单一出口）；不给 worker 发任何指令（R-A83-10 零 herdr 调用钉住）；stage-stalled 由编排 agent 按 adapter 发出、**程序不做停滞检测**（design 1437 边界守住）；节拍 30s 轮询 + 1200s tick + wait 30s 分段，无秒级监控；完整 relay 不设人肉 watcher（SKILL.md:40 + 两 adapter 同文）；「不塞前四批抢跑」不适用（本卡即第 5 批）。
- **裁决忠实度**：UD-1 三层全部落地——①pane 内 D13 重启循环（两 adapter Linux/Windows 双写法、`{0,2,3,4}` 停集、`sleep 5`、调用行 `--plan … --notify …` 固定首两位）；②阶段级 pane 被关由编排 tick 对账 → `stage-stalled`（adapter 编排位原文 + H12-② 实证送达）；③编排级 pane 被关如实写「无自动发现，依赖人工，按 §7.3」。UD-2：`git diff -U0` SKILL.md 恰 3 hunk（watcher 行 / 硬规则 8 / 放弃项 5），无其它改动。
- **豁免登记**：F-001（RLT_17 将跑在带 watch 的 adapter）、F-002（Windows 两副本 + A125 终局回归挂起）、F-003（verify 可能被钩子拦 → 最多到待验收）在 `findings.md`、`brief.md`、DevPlan 第 137 行、`execution_strategy.md` 授权节均有登记；review.md 将 A125 标挂起——如实。
- **允许路径**：diff 面仅 5 个允许代码文件 + workspace + DevPlan 单行（orchestrator 域：RLT_18 任务行状态 + UD-2 白名单行）；design/、AGENTS.md、install_skill.py、`docs/modules/relay-light/relay/**` 零改动。
- **既往闸采信不重复**：check.batch-1（P1-1 pycache 已闭合）、check.batch-2（O-1 真替换已核）、check.batch-3（F-1~F-8 闭合、O-1/O-5 遗留转人判）、code-round1 r1/r2（C1-1/C1-2 闭合、F-008 专项结论「无稳态 dedup 缺陷」）——本路对承重项做了独立抽核确认，不重复其职责。
- **探针合同核对**：四份 probe-brief 均照录 adapter 规则、禁读流程文档、禁写仓库；h12 fixture `monitor_launch herdr=rlt18-probe-lead-claude` 使编排级 watch 盯 stage-lead 本体（较 task_plan 字面 `rlt18-probe-orch` 更贴近 D3 在场者语义），偏差已在 H12.md 头部与 check O-1 如实披露待确认；模型闸 624685a 先于派工，execution_strategy 四探针行 confirmed-observed-closed。

## 范围外发现

- `origin/master` 已漂移至 `13d477b`（path-audit 已标注）；收口 rebase/合入属 orchestrator 与用户闸门。
- D2 边角：绑定 stage 全部节点被 superseded 而无 active 节点时 stage 不满足退出（R-A83-11 有意语义，plan-review 已认可）——极端 amend 形态下阶段级 watch 不会自动退出，靠 pane 关闭/人工兜底；已登记解读，不属本路新发现。
- 环境层异常（orch 输入框 ghost tick 排队预览、codex 会话模型显示切换、多处未提交草稿）为 herdr/终端层现象，与交付实现无关，证据已如实记录。
- Windows 侧存活核与重启循环命令从未在 Windows 实跑（F-002 挂起的一部分）；A125 终局回归挂起——均已登记。
- consistency 路径另行核对 adapter↔SKILL↔design 措辞一致性（check.batch-2 O-1 已登记 SKILL 改写句保真度观察），不属本路。
