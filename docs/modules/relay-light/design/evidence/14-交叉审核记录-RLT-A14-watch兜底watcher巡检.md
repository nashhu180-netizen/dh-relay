<!-- dh:v1 · RLT-A-14 交叉审核与确认形成史 -->
# RLT-A-14 交叉审核记录：watch 死亡兜底改由 watcher 10 分钟巡检

## 一、事件身份与证据边界

- 规划事件：`RLT-A-14`，stage = A-full；目标文档 `design/01-RelayLight-产品设计与验收.md`。
- GitHub Issue：#65（复用 RLT_18 的 Issue，正文扩界）；分支 / worktree `wt/RLT_18`，与 RLT_18 代码同一 PR 收口（UD-5 Q1）。
- 档位：标准档 · 高危（组件接线）。
- 候选稿：`design/drafts/A14/A14-候选.md`（C1b v2，358 行）；配套 `drafts/A14/brief.md`、`drafts/A14/issue-65-扩界.md`。候选稿与本记录留在 `drafts/` / `evidence/` 作形成史，不进 `designInputs[]`。
- 方向来源（已由用户裁决，本审核不重评方向）：`workspace/RLT_18/decisions.md` UD-3、UD-5 Q1–Q6、UD-6 U-1/U-2；范围来源 `workspace/RLT_18/task_plan.md` §5.3。
- RLT-B-10（B-adjust，目标 `dev_plan/P1-RelayLight-开发方案.md`）与本事件共用本记录，见 §四。
- 本记录**不代表**用户整版确认、晋级、B-adjust、verify 或验收。

<a id="review-rlt-a14"></a>
<!-- dh:planning-evidence:v1 event=RLT-A-14 artifact=design/01-RelayLight-产品设计与验收.md kind=review -->

## 二、fresh A 审核（C1-audit · fresh-01）

- 审核者：`a-reviewer#a14`（fresh，未参与候选稿起草）；轮次 round 1；2026-09-24。
- 基线：分支 `wt/RLT_18` HEAD `2c1dc47`。`design/01` 相对候选稿声明的 `65298ee` 与路径审计基点 `5ab3bba` 均**零差异**（`git diff` 空），候选稿行号仍然有效。
- 读过：AGENTS.md；`drafts/A14/` 三件；Issue #65 线上正文（`gh api repos/{owner}/{repo}/issues/65`，只读；`gh issue view` 因 Projects classic 报错改用 API）；design/01 被改各节与头部；`decisions.md` UD-1～UD-6；`task_plan.md` §5；先例 `evidence/13`、`evidence/11`、`drafts/A11/review.fresh-01.md`；辅助核对 `SKILL.md` 第 25 / 40 行、`adapter-claude-code.md` 第 89 / 112–114 行、`adapter-codex.md` 第 103 行、`workspace/RLT_18/evidence/batch-3/H12.md`、DevPlan H12 口径行（第 653 行）。
- 方法：用脚本逐字比对（不信摘要），并在 scratch 副本上把候选稿全部 17 个改点按「改前 → 改后」逐一替换 / 插入，模拟原子晋级后再做计数与残留检查。

### 结论

**PASS**：P0 = 0，P1 = 0，P2 = 1，P3 = 5。候选稿「改前原文」与现行 design/01 逐字一致，改后内容忠实 UD-3 / UD-5 / UD-6、无夹带，模拟晋级后验收 ID 仍为 159，唯一变化的 ID 行是 H12。唯一 P2 是新文本里的「pane / tab」与 §7.4、§13「tab 这一层不使用」字面冲突；它不阻断晋级，但建议晋级前做一次最小措辞整改（见 P2-1）。

### 逐项核对

| # | 核对项 | 结论 | 依据 |
|---|---|---|---|
| (1) | 「改前原文」逐字一致 | **通过** | 16 个完整改前块在 design/01 中**逐字唯一命中**（A-01@121、A-02@135、A-03@489–491、A-04@896–898、A-05@919、A-06@1409、A-07@1439、B-01@3、B-02@6、B-03@8、B-04@15、B-06@1239、B-07@1480、C-01@158、C-02@885–892）；B-05 按说明只录行首，其真实前缀 `> **RLT-A-13 single-task 模式增补 2026-09-22（用户已整版确认）**——新增与完整 relay 并列、互斥的 \`single-task\` 模式：` 与第 19 行开头一致，锚点唯一。 |
| (2) | 忠实 UD-3 / UD-5 / UD-6，无夹带 | **通过** | 字符级差异显示 A-01 只改「一→二」并加「（含旁路 watcher）」；A-02 / A-03 / A-04 / A-05 / B-04 / C-01 都只在原文后追加内容；A-06、A-07、B-01～B-03、B-06、B-07、C-02 的替换都落在所述改点内。A82 / A83 / A101（1351–1353）、第 488 行 tick 句、第 299 行「`roles.toml` 十一个角色」不变；`relay_log.py` 行为描述未改：A-03 只写 pane 内重启循环（UD-1 ①，UD-3 保留），退出码指向两 adapter，不在设计里新立 watch 退出码合同。全文仍称「监工」，没有改成 stage-lead；新词「派活方」「载体」都在原句里注明了指代，只是描述词，不替换任何现有术语。对应关系：Q2→A-02「每终端空间一个」；Q3→A-04 / 第 488 行不动；Q4→A-05 第 3 点；Q5→A-02 档位格；U-1→C-01 / C-02；U-2→A-06 保号 v2。 |
| (3) | 与未改部分无新矛盾 | **通过（附 P2-1、P3-4）** | §2 表头与 SKILL 第 25 行同为「十二个角色（含旁路 watcher）」，模拟晋级后表内 12 行；watcher 行 5 格，与表头列数一致。§2.1 / §7.1 由 C 组写明例外，§1.2 第 81 行与 §13 末行「编排越级拉 agent 禁止」在 C-01「不算越级」的口径下仍成立（措辞见 P3-4）。§3.5 豁免四名不受影响，因为 watcher 不入账本。§7.2 通用对账与 A-05 第 3 点「对账时见 watcher 缺席顺带重拉」相容，watcher 本来就在 `herdr agent list` 里。§7.3 监工 / 编排挂掉两段不变。§11.2 除 H12 外无改动；§13 A-07 与 §3.6「程序侧停滞检测不做」相容；§15 B-07 已登记。§7.5 single-task 在 A-02 末句明示排除，120 秒 monitor 不受影响。角色计数：`十二个角色` 只在第 121 行与 B-05 出现，`十一个角色` 只剩第 299 行（指段数，按设计保留）。 |
| (4) | H12 v2 可判、可被 U2 支撑 | **通过** | 判断列「兜底是否兜得住，10 分钟是否可接受」与展示列一一对应。展示 ① 进程级自拉由 batch-3 `H12.md` 第 10–15 行支撑：壳 PID 不变，≤7 秒重拉新 python；UD-5 Q6 定为引用既有证据。展示 ② 由 task_plan §5.6 H12-A / H12-B 支撑，分别记 T0 / T1 / T3 / T4 / T5、`watch-down` 原文与到达时刻、派活方重拉时刻；H12-A 取接近 10 分钟上界、H12-B 取短时延对照，正好给「10 分钟能否接受」提供体感。H12-C（正常结束不误报）与 watcher 自身死亡不在 v2 展示列内，与 UD-5 Q4 / Q6 一致。 |
| (5) | 头部 / 索引 / 增补行 / 总账格式 | **通过（附 P3-2）** | B-02 与 A-13 声明逐字段同构，evidence 路径与 `dispatch/README.md` 第 32 行允许路径、本文件名逐字一致。模拟晋级后 `dh:planning-event:v1` 恰 1 条且 `id=RLT-A-14`。B-04 行格式同 A-02～A-05 行。B-05 结构同 A-13 增补行：粗体标题 + 日期 + 「用户已整版确认」、来源、改动、ID 处理、evidence 链接、Issue、档位、「本行不代表验收或 verify」。B-06 / B-07 沿用 RLT-A-11「修订既有行 A2，保号不改号」先例。实测 `HC-RL-[AH]\d+` 行 159 条（AI 143 + 人验 16），模拟晋级后仍为 159，只有 `HC-RL-H12` 一行变化。「20 分钟兜底」只残留在 §3.6 第 488 行、A83 行与 B-05 的 v1 引文，与候选稿晋级核验要点 4 一致；`stage-stalled` 零命中。 |
| (6) | Issue #65 正文扩界 | **通过（附 P3-5）** | 线上正文 `updated_at 2026-09-24T07:10:34Z`；「范围」节末有【扩界 2026-09-24 · RLT-A-14】子条，正文末有「扩界记录（RLT-A-14，2026-09-24）」节。改动清单第 1–8 行与候选稿 A-01～A-07、B 组、C 组一一对应：C 组已落为第 8 行，H12 行不再带 U-2 备选括注，与 UD-6 一致。「明确不改」与候选稿「明确不改」一致。issue comments = 0，确认是改正文，不是用评论代替。原有文字未改。 |
| (7) | 可原子晋级（照抄即可） | **通过（附 P3-1、P3-2）** | 17 个改点在 scratch 副本上按候选稿文本机械替换 / 插入全部成功：每个锚点唯一命中，无需再创作。晋级时只需填写 `<晋级日期>`（B-01 / B-05 / B-06，共 3 处），并在用户整版确认后保留 B-05 的「用户已整版确认」字样（候选稿 O-4 已声明）。 |

### Findings

| 编号 | 级别 | 位置 | 问题 | 依据 | 整改建议 |
|---|---|---|---|---|---|
| P2-1 | P2 | 候选稿 A-03（:104）、A-05 第 2 点（:143）、A-06 H12 v2（:162）、B-05（:267）中的「pane / tab」 | 新文本把 watch 载体写成「pane / tab」，而 design/01 §7.4 写「空间内 agent 都是根 tab 里的 pane；**tab 这一层不使用**」，§13「不做」写「Herdr tab 这一层：不使用」，§3.6 首句也写「单独开一个 **pane** 运行」。晋级后，设计会在同一文档里一处说不用 tab、另一处把 tab 当作 watch 载体。根因是既有漂移：adapter-claude-code 第 89 行按「一 agent 一 tab」给 watch 单开 tab，batch-3 / U2 实测也是关 tab。本事件范围不该修这个漂移，但也不该把它写进设计正文。 | 审核项 (3)；design/01:482、:936、:1440 | 二选一，交 orchestrator 路由：(a) 把 4 处「pane / tab」统一改成「pane」（关 tab 必然关掉其中的 pane，H12 v2 展示仍成立，U2 不受影响），并把 adapter 用 tab 与 §7.4 / §13 的漂移记入 RLT_18 findings / backlog；(b) 保持原文，由用户在整版确认时知情接受这处字面张力。不影响 PASS。 |
| P3-1 | P3 | 候选稿 §0 改点总表 C-02 行（:38） | 总表写「888–892」，C-02 小节标题与实际改前块是 885–892（含 ```` ```text ```` 围栏）。 | design/01:885–892 | 把总表改为 885–892；不影响晋级文本。 |
| P3-2 | P3 | 候选稿 B-05 小节标题（:256）与说明（:264） | 标题写「空一行分隔」，说明写「后接空行」，而改后块末行是引用续行 `>`，与 A-13 / A-11 之间第 20 行的 `>` 连接先例一致。晋级者如果按字面再加真空行，引用块会被拆开，只是呈现差异。 | design/01:18–21 | 晋级者照抄 fenced block 原文，不另加空行；可顺手把标题改为「以 `>` 续行与第 19 行连接」。 |
| P3-3 | P3 | 候选稿 A-06 理由 5（:171）与 B-05 v1 引文（:267） | 理由 5 称「v1 原文逐字保存在 B-05 增补说明行里」，但 B-05 引文省去了命题列前缀 `**〔watch 实测〕**`，并用 `｜` 代替表格分隔，不算逐字。B-05 自己写的是「经 Git 历史可还原」，本身没有问题。 | design/01:1409 | 把理由 5 改为「v1 三列要旨引于 B-05，原文经 Git 历史逐字可还原」，或在 B-05 引文补回 `〔watch 实测〕`。只是形成史措辞，不影响设计正文。 |
| P3-4 | P3 | C-01（:318）与 C-02（:347） | C-01 定性为「**不算越级**」且「不增加上面的『三件事』」，C-02 却写「编排不越级拉 agent（本空间旁路 watcher **除外**）」。「除外」暗示它本属越级，与 C-01 的定性不同；§13 末行「编排越级拉 agent … 禁止」没有例外，只在 C-01 的口径下自洽。C-01「不增加三件事」也没说明它归入哪一件。 | design/01:1442、:139–141 | 可选：C-02 括注改为「（本空间旁路 watcher 不属越级，§2.1）」；C-01 可补「属第 2 件『等监工』用 watch 的配套」。不改也不构成矛盾。 |
| P3-5 | P3 | Issue #65 原正文「停止边界」首条与「验收」人判行 | 原文仍写「不改 design」和「`HC-RL-H12`（杀 watch 后 20 分钟兜底）」（按「原有文字一字不改」保留）。扩界记录说明了设计改动与 H12 v2，但没有明说它**取代**这两句，读者需要自己推断优先级。 | Issue #65 线上正文 | 由 orchestrator 视需要在「扩界记录」节补一句：「本节就 design/01 与 H12 口径取代正文『停止边界：不改 design』与『验收：H12 20 分钟兜底』两处」。这是 gh 写操作，须在 UD-5 Q1 授权范围内执行，本审核不代做。 |

### 范围外观察（不计 finding，供登记）

- **O-a**：§7.3「监工挂掉」重拉监工后，没有写明阶段级 watch 与 watcher 的 `--notify` / 报信目标是否要改指新监工。watch 早就有这个缺口，watcher 照样继承。它属于 adapter 操作层问题，建议 U1 在 adapter 核对，或记 findings。
- **O-b**：design §3.1 的命令签名与退出码表都不含 `watch`（既有），A-03 把退出码合同指向两 adapter 是正确处理，没有借机补设计。
- **O-c**：同意候选稿 O-1（历史索引表缺 A-06 / A-07 / A-11 行）、O-2（「实时监控」行实际在 §13）、O-3（watcher 档位与「模型档全部写在 roles.toml」的张力，已由 UD-5 Q5 裁决、F-011 登记）；本事件按原处理即可。
- **O-d**：DevPlan 第 653 行 H12 人判口径仍是「杀 watch 后 20 分钟兜底」，按流程闸在晋级后 B-adjust，现在不需要动。

## 三、讲解、理解对齐与用户整版确认

<a id="understanding-rlt-a14"></a>
<!-- dh:planning-evidence:v1 event=RLT-A-14 artifact=design/01-RelayLight-产品设计与验收.md kind=understanding -->

orchestrator（RLT_18 主会话）2026-09-24 在 fresh-01 PASS 且整改 1（`e7c127d`）后，于主会话向用户白话讲解候选稿 6 点，随后 AskUserQuestion 请用户整版确认。

- 用户裁决链（均为用户点选或原话，见 `workspace/RLT_18/decisions.md`）：UD-3 人判原话「还是加个 watch 的agent 10分钟检查一次。编排不做这个事情」；UD-5 Q1 本卡同分支 A-full、Q2 每终端空间一个、Q3 只取消存活检查（tick 与通用对账保留）、Q4–Q6 按推荐；UD-6 U-1 写明编排拉 watcher 为唯一例外、U-2 H12 保号升契约 v2。
- 讲解要点（与候选稿对应）：①§2 角色表新增旁路 watcher，11→12 角色，每终端空间一个、10 分钟只读巡检、缺席报信本空间派活方重拉、不派活不写账不改文件不自拉，single-task monitor 不受影响（A-01/A-02）；②§7.3「watch 挂掉」三层——进程级循环自拉、载体级 watcher 发 `watch-down` 由派活方重拉、watcher 自身缺席由派活方对账顺带重拉，残余风险接受（A-03/A-05）；③编排不做 watch 存活对账，20 分钟 tick 只做通用对账，程序零改动，A82/A83/A101 不动（A-03/A-04）；④§2.1/§7.1 写明编排在自己空间拉 watcher 不算越级（C-01/C-02）；⑤H12 保号升契约 v2：判「watcher 10 分钟巡检是否接住、10 分钟是否可接受」，展示进程级自拉与阶段级/编排级 pane 被关后的发现、通知与重拉时刻（A-06）；⑥§13 不做清单措辞、头部声明换 RLT-A-14、历史索引与增补说明、验收总账仍 159（A-07、B 组）。
- **用户整版确认**：2026-09-24 AskUserQuestion 问句原文「RLT-A-14 整版设计稿（上面 6 点）是否确认晒级进正式设计文档？」，用户点选选项「确认晒级」（问句与选项中「晒级」均为 orchestrator 笔误，指「晋级」；选项说明原文「按候选稿原样写进 design/01，然后 U1 改 adapter/SKILL（GREEN），再重演 H12 v2。」）。确认对象 = `drafts/A14/A14-候选.md` @ `e7c127d`。
- 本节不代表 verify、验收或 RLT_18 完成；晋级、晋级复核与 DevPlan H12 口径行 B-adjust 仍按流程闸依次进行。

## 四、RLT-B-10 · DevPlan RLT_18 H12 口径行同步（B-adjust）

- 事件：`RLT-B-10`，stage = B-adjust；目标 `dev_plan/P1-RelayLight-开发方案.md`；依据 `workspace/RLT_18/decision.b10-devplan-h12.md`（decider#2，verdict=AUTO：dh check R29 与 Issue #65 流程闸共同决定须开最小 B 事件）。
- 改动（仅 6 处簿记）：标题更新日期；头部 B-10 说明行；活动声明 B-09→B-10；说明句与历史索引补 B-09 行；RLT_18 验收口径 H12 行镜像 design/01 `HC-RL-H12` 契约 v2；§3.1 追加「RLT-B-10 调整」条目（含 UD-2 允许路径追加行事件补登）。不新增任务、不改批次、不改 A82/A83/A101、映射表与任务行不动。

<a id="review-rlt-b10"></a>
<!-- dh:planning-evidence:v1 event=RLT-B-10 artifact=dev_plan/P1-RelayLight-开发方案.md kind=review -->

### fresh 窄审

reviewer#b10（fresh，未参与 A-14 与 decision.b10）2026-09-24 按 `decision.b10-devplan-h12.md` §4 第 3 步清单窄审，只读核对工作树未提交草案（`git diff -- dev_plan/ evidence/14`），**verdict = PASS**，五条全过：

| # | 检查项 | 结论 | 依据 |
|---|---|---|---|
| 1 | DevPlan H12 口径与 design/01 `HC-RL-H12` v2 三列语义一致 | PASS | DevPlan 新行（diff 后第 658 行）「用户判断 watch 死亡后本终端空间 watcher 的 10 分钟巡检是否接住、10 分钟是否可接受」镜像 design/01 第 1426 行判项列；演示列「杀 watch 进程→shell 重启循环自拉；关阶段级/编排级载体→watcher 巡检时刻、`[relay-light] watch-down …` 通知与派活方重拉时刻」对应 v2 演示①②；验收列「10 分钟是否可接受」一致；v1「20 分钟兜底」注明经 Git 历史可还原。 |
| 2 | DevPlan 除 decision §4 第 1 步所列 6 处外零改动 | PASS | `git diff -U0` 恰 6 个 hunk：标题行日期（-1）、头部 B-10 说明行（+2 行）、活动声明 B-09→B-10（-8/+10）、说明句改写（-10/+12）、历史索引末追加 B-09 行（+25）、§3.1 追加「RLT-B-10 调整」（+67，2 行）、H12 行（-653/+658）；与清单 6 处一一对应，允许路径块（第 660 行）、映射表（第 827 行）、任务行（第 137 行）均无 hunk 触及。 |
| 3 | 声明 / 证据 marker 的 event、artifact、锚点互指正确 | PASS | 声明 `id=RLT-B-10 stage=B-adjust artifact=dev_plan/P1-RelayLight-开发方案.md`，review/understanding 均指 `../design/evidence/14-…#review-rlt-b10` / `#understanding-rlt-b10`；evidence/14 §四两个 `<a id>` 锚点与两条 `dh:planning-evidence:v1` marker 的 event=RLT-B-10、artifact（精确等于声明值）、kind=review/understanding 逐项吻合；§一身份节已补「RLT-B-10 与本事件共用本记录，见 §四」。 |
| 4 | 历史索引含 B-09 且 B-09 原证据路径未改 | PASS | 索引表末新增 `RLT-B-09` 行，证据列 `../design/evidence/13-交叉审核记录-single-task模式.md#review-rlt-b09` / `#understanding-rlt-b09`，与被替换的原活动声明路径逐字相同；evidence/13 第 37/47 行两锚点仍在。 |
| 5 | `node dh-check.mjs relay-light` 无 R29 行且失败数 ≤77 | PASS | 实测输出 `合计: 77 失败, 37 警告`，全文 grep 无 `R29` / `EVENT_*` / `EVIDENCE_*` 行，回到 decision §2.1 所测基线。 |

- findings：无 P0/P1/P2 发现。窄审范围仅为上表五条；DevPlan §3.1「RLT-B-10 调整」条目内「含 UD-2 允许路径追加行事件补登」一句与 decision §5 范围外观察一致，属登记性陈述，非本窄审判项。
- 本窄审不代表用户确认（understanding 节待主会话问句回填）、不代表 verify 或验收。

<a id="understanding-rlt-b10"></a>
<!-- dh:planning-evidence:v1 event=RLT-B-10 artifact=dev_plan/P1-RelayLight-开发方案.md kind=understanding -->

### 授权链与用户确认

- 授权链：UD-5 Q1 选项文本（本卡同分支走 A-full，含 Issue #65 正文扩界）→ Issue #65「扩界记录」流程闸列明「原子晋级 design/01 → B-adjust DevPlan RLT_18 H12 口径行」→ UD-7 用户整版确认 A-14（确认说明含「再重演 H12 v2」）。
- 用户当次确认（2026-09-24，orchestrator 主会话 AskUserQuestion）：问句原文「RLT-A-14 已晒级。现在按 Issue #65 流程闸最后一步开 RLT-B-10，只把 DevPlan RLT_18 的 H12 验收口径行从『杀 watch 后 20 分钟兜底』改成与 design/01 一致的『watcher 10 分钟巡检』契约 v2，不动任务、批次和机器证。是否确认落盘？」（「晒级」为 orchestrator 笔误，指「晋级」）；用户点选「确认落盘（推荐）」，选项说明原文「按 fresh 窄审通过的草案提交（共 6 处簿记改动，dh check 已验无报错）。」
- 本节不代表 verify、验收或 RLT_18 完成。
