# RLT_18 workflow-final lesson（UD-3）· review-round-1

2026-09-25 · reviewer#lesson-ud3-r1（fresh，未参与本卡任何施工、批审与复核）· 审查对象：UD-3 差异范围 `a6773e7..HEAD`（U1 RED `2c1dc47` + GREEN `638b9e6`、U2 证据 `f495cf5`/`f4c2661`/整改 `401defb`、RLT-A-14 事件节点提交、orchestrator 登记；路径审计基点钉 `5ab3bba`）· 对应 `dispatch/workflow-final.md` lesson 路 + `task_plan.md:337`（lesson 路须核本轮教训候选登记，点名例「兜底机制不能依赖被兜对象的节拍」）。

## 结论

PASS — 无 open P0/P1。点名已知坑中：`__pycache__`、dotted 单测入口、CI 浅克隆基线、打桩纪律均未复发且按纪律执行（基线钉 `5ab3bba` 恰是 F-012 浮动基线坑的先发应用）；**「后台进程回收」复发一次**——driver 自己的 nohup 轮询脚本漏关 ~18 小时并向已入库证据文件追加噪声（已如实披露、已清理，item b）；prompt 排队/pane done 以「探针首回合 done ≠ 节拍已武装」新形态出现（item d）；候选-34 手抄转录以小形态（行号/出处引用漂移 4 处）再复发一次。教训账缺口：`lesson_candidates.md` 在 UD-3 全程零改动，派单点名评估的五条新教训 (a)–(e) 与两条复发均未登记——1 条 P2（登记缺口）+ 2 条 P3，不阻塞，补救是一次追加。

## 发现

| ID | 级别 P0/P1/P2/P3 | 位置 文件:行 | 事实 | 建议整改 |
|---|---|---|---|---|
| LES-U3-1 | P2 | `lesson_candidates.md`（UD-3 范围零改动，`git log a6773e7..HEAD` 对该文件为空）；`task_plan.md:337` | 派单点名评估的五条 UD-3 新教训 (a)–(e) 全部未登记候选；其中 (a) 正是 task_plan §5.6 写明 lesson 路应看到登记的示例条（「兜底机制不能依赖被兜对象的节拍」目前只留在 D16 理由列，`task_plan.md:228`，未进教训账）。候选-34 家族小形态复发（requirement ud3 r1 RQ-U3-4：4 处行号/文件出处偏差，事实本体无误，`401defb` 已闭合）与「后台进程回收」复发（item b）也未在「已知候选复发登记」位留 L-R 行——该登记位是 round-1 整改刚建立的机制，UD-3 首次适用即空转。 | `lesson_candidates.md` 追加：候选 L-05~L-09（建议表述见「新教训登记核查」节，复核者只读未代写）+ 复发登记 L-R2（后台进程回收，item b）、L-R3（候选-34 小形态，RQ-U3-4）。 |
| LES-U3-2 | P3 | `evidence/ud3-h12/H12.md:63-64`、`raw/agent-status-poll.log` | item b 复发的次生影响值得写进教训规则：漏关脚本写入的对象是**已入库证据文件**（commit `f495cf5` 后继续追加 17:32 起的 `?` 噪声行至尾行 10:54:12，2540 行中数据止于行 70），迫使「commit 后未提交漂移丢弃」处置；且 kill/pgrep 补救复查无 raw 落物（H12.md:64 已如实披露接受现状）。收尾清单核了探针 tab 与 watch 进程（cleanup-close/verify），不含 driver 自己起的后台写者。 | 并入 L-06 候选规则：观测/轮询类后台脚本收尾单列核对（`jobs`/自记 PID 清单），且观测输出不写证据目录内已入库文件（或先杀写者再提交证据）；补救命令 tee 进 raw。 |
| LES-U3-3 | P3 | —（仓内零落账）；对照 `execution_strategy.md` agent 表 | item (c)：派单所述「Devin 连接中断停在 Connection error、需人工发消息续跑，本轮 coder 与 reviewer 各一次」在仓内无任何落账——execution_strategy agent 行、progress、findings 均无对应注记。此类 worker 可用性中断直接影响「长时间无输出 = 仍在干活」的派活方判断，教训账之外连一行运行注记都没有。 | 登记 L-07 候选外，建议 orchestrator 对同类会话中断事件在 execution_strategy 对应行加一格注记（一行即可），便于教训矿工程序取证。 |

## 已知坑复发核查（逐项）

| 已知坑（来源） | 判定 | 依据 |
|---|---|---|
| CI 浅克隆基线（钉 SHA + `cat-file -e` + `git fetch --depth=1` 兜底 + 失败 `self.fail` 不 skip） | **未复发，纪律保持** | `test_relay_log.py:8756` `RLT18_BASELINE_SHA="5ab3bba"`、`fetch_baseline_text`（:8759-8773）探测+fetch+None；`test_a83_13`（:5619-5628）与 adapter 基线 RED（:6446-6451）均 `self.fail` 不 skip。UD-3 审计基点钉 `5ab3bba`（F-012、task_plan §5.4(3)/§5.5、E-705）——恰是「浮动 origin/master 误报」教训的先发正确应用 |
| `__pycache__` / PYTHONDONTWRITEBYTECODE | **未复发** | H12.md:60 审计「git status 无、16:00 后新建无」；E-705 路径审计空；本棒实测 `git status --porcelain --ignored` 与 `find` 均无 `__pycache__`/`*.pyc`；UD-3 全命令带 `PYTHONDONTWRITEBYTECODE=1`（E-701/703/704、H12.md:62） |
| dotted 单测入口 | **未复发** | 全部命令为 `cd tools/relay-light && python3 -m unittest test_relay_log[.Class]` 或 `discover -s . -p 'test_*.py'`（E-701~705、H12.md:62） |
| 后台进程回收 / 进程残留 | **复发 1 次（driver 侧新形态），已披露已清理** | item b：`/tmp/rlt18-u3-poll.sh`（nohup，父 bash 538714）探针清理时遗漏，空转 ~17.9h（poll log 17:03:00 起、数据止于 17:31:42、噪声至次日 10:54:12），次日发现并 kill、pgrep 复查无残留（f4c2661 补记 H12.md:63）。新形态：既往收尾清单覆盖探针 tab 与 watch 进程（cleanup-verify 零残留成立），不含 driver 自己的观测脚本——见 LES-U3-2 |
| prompt 排队 / 补回车（herdr-派活操作.md 既有） | **纪律被执行；同族新形态见 item d** | watcher-o 发 watch-down 后按 D19 只读 pane 末行、无 `queued`/`Press Enter to send` → 正确不补 Enter（pane-watcher-o-t3.txt 逐字、H12.md:34）；但 watcher-s 的既有草稿 `act as this probe now` 需 driver 补 Enter 提交、watcher-o 需 `Continue` 续跑（nudge-1.txt）——「送达≠开始干活」见下 |
| pane done 不等于收工 | **以新形态出现：首回合 done ≠ 节拍已武装** | item d：watcher-s 读 brief 停在确认问句、watcher-o 首回合结束未续节拍（曾遇费率弹窗，watcher-o-dialog.txt），两侧各需一次人工轻推才武装；watcher-o 侧节拍迟至 17:06:53 武装，该侧检查间隔拉长至 ~14 分钟、T1′−T0′≈12.6 分钟（H12.md:31、RQ-U3-3）。item (c) Connection error 停死同属「停了≠完了」族 |
| 证据手抄（dh-relay 候选-34，本卡 L-R1） | **小形态复发 1 次，批内捕获闭合** | requirement ud3 r1 RQ-U3-4：H12.md 4 处行号/出处偏差（±1–2 行 + 一处错引文件），事实本体均逐字核到、整改 `401defb` 闭合；同族但轻于 batch-3 F-1~F-8 |
| 打桩纪律（herdr/时钟打桩、不真 sleep） | **未违犯** | UD-3 relay_log.py 零改动（E-702）；新增断言为文本断言 + R-U3-5② 最小 fixture 真跑 `status --json` 核键名（code-round1 ud3 复核 §5 确认），无 herdr/时钟真调 |

## 新教训登记核查（派单点名 (a)–(e)）

`lesson_candidates.md` UD-3 范围零改动，五条均未登记。逐条评估与建议候选表述（本棒只读，未代写）：

| 项 | 事实核 | 判定 | 建议候选表述（可直接入 `lesson_candidates.md`） |
|---|---|---|---|
| (a) 兜底机制不能依赖被兜底对象的节拍 | 属实且已被正确应用：D16 排除「watch 给 watcher 发 tick」的理由原文即此（task_plan.md:228）；UD-1 讨论中用户已指出同构矛盾（decisions.md UD-3 触发节） | **未登记**；task_plan:337 点名它为例 | **L-05（领域知识/设计）**：「兜底/看门机制的计时与触发源不得依赖被兜底对象——watch 死后给 watcher 发 tick 的方案随 watch 同步停摆。评估兜底方案先问：被兜对象死亡时，兜底的节拍源还在走吗。触发：RLT_18 UD-3 D16 定稿（watch 10min 巡检改由 agent 自身定时）」 |
| (b) U2 driver 轮询脚本漏关至次日 | 属实：f4c2661 补记、poll log 2540 行（数据止行 70）、次日 ~10:55 清理 | **未登记**（已知坑「后台进程回收」的 driver 侧新形态复发） | **L-R2 复发行**：「后台进程回收坑复发——探针/watch 零残留但 driver 自己的 nohup 轮询脚本漏关 ~18h，写已入库证据文件产生 commit 后漂移（f4c2661、agent-status-poll.log 行 71 起噪声）。规则扩展：收尾清单含『driver 自起后台写者』（jobs/自记 PID），观测输出不写已入库证据文件」 |
| (c) Devin 停在 Connection error 不自动恢复 | 派单所述（coder 与 reviewer 各一次）；仓内零落账（LES-U3-3）。与 U2 时间线一致：探针 09-24 17:32 收尾、提交在 09-25 10:54 | **未登记** | **L-07（行为流程/工具）**：「Devin 长会话停在 `Connection error` 不自动恢复，需人工发消息续跑。派活方见 worker 长时间无输出先按『可能连接已死』处置（发一条无害续跑消息探活），不按『仍在干活』无限等。触发：RLT_18 UD-3 coder/reviewer 各一次」 |
| (d) watcher 探针两侧各需一次人工轻推才进入巡检节拍 | 属实：nudge-1.txt 两次轻推逐字；后果已量化——武装推迟使 watcher-o 侧首个检查间隔 ~14 min（RQ-U3-3） | **未登记** | **L-08（行为流程）**：「带周期节拍职责的 agent 派单后须确认『节拍已武装』（如后台 sleep/合并调用已起），首回合 done 不代表进入节拍——推迟武装直接拉长首个检查间隔；评估发现时延以实际武装时刻为 T0。触发：ud3-h12 两 watcher 各需一次轻推（nudge-1.txt），watcher-o 侧首间隔 ~14 min」 |
| (e) 输入框未提交文字（可能客户端自动建议）易误认操作者介入 | 属实：requirement r1 RQ-U3-2 逮住「用户键入草稿」归因断言，整改改「键入者不可考」（H12.md:53）；lead pane 草稿 `check watch-down pane w4B:p1X still running` 形似操作指令实为未提交文字。同族既往：E2 派单时 monitor 把用户输入框未送出文本当指令转述（`881727a`，UD-3 范围外但同卡） | **未登记**；与 herdr-派活操作.md「输入框残留文本」既有条目互补（那条讲残留阻塞输入，这条讲残留被误读为意图） | **L-09（领域知识）**：「pane 输入框内未提交文字可能是客户端自动建议或草稿，不得据此归因『用户/操作者键入』；判『是否构成介入』只看其后有无对应回应回合。向 agent 转述用户意图前先确认文本已提交。触发：RQ-U3-2（『用户键入草稿』改『键入者不可考』）、ud3-h12 三处输入框草稿（H12.md:53）」 |

## 核查范围与方法

- **RELAY_RECEIPT preflight**：`env | grep -c '^RELAY_'` → 0，无 `RELAY_RECEIPT` → 正常复核面，未进 fail-closed 分支。
- **对照集**：`docs/modules/relay-light/knowledge/` 不存在（本棒确认）；`docs/modules/dh-relay/knowledge/教训库-候选.md` 候选-1~34（重点候选-8/12/13/23/34）与 `herdr-派活操作.md`（prompt 排队 :25/:29-31、输入框冻结 :55）用于判重；本卡 `lesson_candidates.md`（L-01~04 + L-R1，UD-3 零改动）与 `findings.md`（F-010~F-014 为 UD-3 新登记，均 findings 级非教训级）。
- **UD-3 范围取证**：`git log/diff a6773e7..HEAD`；U1 RED/GREEN 证据（ud3-u1/red.txt 12 subTest FAIL、green.txt、path-audit.txt）；U2 证据 `evidence/ud3-h12/`（H12.md 全文、raw/nudge-1.txt、watcher-o-dialog.txt、agent-status-poll.log 首尾与噪声边界行 70/71）；整改 `401defb` diff 逐条对 RQ-U3-1~7。
- **横读复核产出**：requirement ud3 r1（RQ-U3-1~7，本条目的 (d)(e) 与候选-34 小形态的事实来源）、code-round1 ud3 r1（PASS，P3×3，确认 relay_log.py 零改动与审计基点）；execution_strategy.md 各 agent 行（含 UD-3 四路派单记录 4703c0d）。
- **本棒实测**：当前树 `__pycache__`/`*.pyc` 零残留；poll log 噪声边界与提交后漂移处置复核成立。
- **边界**：不重复 code/requirement 路结论（RQ-U3-1~7、U3-C1-1~3 仅作教训侧输入采信）；不改 lesson_candidates.md（只读纪律），候选表述以建议形式留在本文件。

## 范围外发现

- item (c) 的仓内零落账已列 LES-U3-3；monitor 转述用户未送出输入框文本事件（`881727a`）在 UD-3 基点之前，作 item (e) 的同族既往引用，不重复计复发。
- F-008「第二条 `coder#1 -> done` 来源未定」仍挂起（进程内重发已由 code-round1 整改闭合，其余候选悬置）——维持 findings 登记，本轮不构成教训条目。
- watcher-o 派单后遇费率限制弹窗（watcher-o-dialog.txt，`send-keys 2` 保模型处置）——d 族「启动需要人工处置」的又一实例，不另立条。
