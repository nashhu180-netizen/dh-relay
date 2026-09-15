<!-- dh:v1 -->
# review.code-round1 — RLT_12 独立复核记录（代码轮 1）

> 复核者：Claude Opus 5（`claude-opus-5`），fresh 实例，未参与 RLT_12 任何施工或编排。
> 现场：`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12-review`，分支 `wt/RLT_12-review`，基线 master `2a9c4f4`。
> 复核对象：`review.md:33` code-round1 行登记的五个靶子 + 编排指定的两项本卡特有必查。
> 时间：2026-09-15。

## 结论

**REVISE　·　P1 = 3　·　P2 = 5**

本卡的**机器侧实体是扎实的**：账本 71 行 lint 绿、status 五阶段全闭合、16 个 `agent_launch` 实例逐个有终态、
全部被引用的 RLT_21 产出 commit 在本仓真实存在、`config_dir` 由程序自己写入而非调用方伪造。X1 的计划追加合规，
凭据扫描零命中。

问题**全部集中在「验收落章」这一层**：本卡被标为「已验收（带风险放行）」，但它自己的完成条件逐条挂证据表八行的
「证据 / 达成?」两列**整列全空**，`progress.md` 的 E-002～E-008 **七个槽位无一回填**（含机器条件 #2/#3 的唯一
槽位 E-007，而该证据实际已在 `dd3ac3c` 取得），H10 的独立展示**从未进行却记为「通过」**，本卡自身 normal 三路
复核在落章时**三路全为「待执行」**。这三条构成 P1。

**本卡已于 2026-09-15 squash 合入 master（`7981556`）并经用户整体授权验收，本记录不主张回退**；下列 P1/P2 是
整改项，由编排排期。

---

## 一、P1 明细

### P1-1　完成条件逐条挂证据表整列空白，却已落「已验收」

**事实**：`review.md:87-96` 的「完成条件逐条挂证据」八行，`证据 (E-00x)` 与 `达成?` 两列**八行全空**；
同文件 `review.md:130` 却写「当前状态：**已验收（带风险放行）**」。

**证据**：

- `workspace/RLT_12/review.md:89-96`——八行末两列均为空单元格。
- `workspace/RLT_12/progress.md:18-24`——E-002～E-008 七行「结果」列一律 `待实跑（预留槽位）`。其中 **E-007**
  的「支撑什么结论」列写明它是「完成条件 #2（`HC-RL-A30`）与 #3（`HC-RL-A31`）」的唯一证据槽位。
- `progress.md:65` 自己立的禁令原文：「**E-002～E-008 是预留槽位，不是结论**：`结果` 列在实跑前一律
  `待实跑（预留槽位）`，**任何人不得据此宣称已达成**。收口时把真实命令、输出与判读补进对应行，并回填
  `review.md` 的「达成?」列。」
- 与之矛盾的是：机器闸证据**实际已经取到**，就在 `dd3ac3c`（`verify(relay-light): RLT_12 机器闸取证——
  A32/A30/A31 三条`，已 `git log -1` 核存在），只是从未回流进 `progress.md` 与 `review.md`。

**判读**：这不是「证据不存在」，是「证据取到了没入账」。A32 的原文在 E-001 里是完整的；A30/A31 的原文躺在
verify 提交的 message 里，没进任一表格。结果是本卡最终交付的两份台账都无法自证验收成立。

**整改动作**：

1. 把 `dd3ac3c` 的三段原始输出（A32 三处哈希、A30 阶段与终态核对、A31 `lint: ok` exit=0）逐字回填
   `progress.md` E-007，「结果」列改 `pass`。
2. E-002～E-006 的「结果」列由 `待实跑（预留槽位）` 改为如实措辞（例：`未取得——2026-09-15 用户整体授权代记，
   材料未落盘`），使其与 `review.md:105-109` 元数据表已写明的口径一致。
3. `review.md:89-96` 八行补齐两列：#1/#2/#3 填 `E-001`/`E-007` 与「达成」，#4～#8 填「未逐条判定（整体授权代记）」，
   #8 另标「展示未进行」。

---

### P1-2　H10「只给账本」展示从未进行，人类签名区仍记「通过」

**事实**：完成条件 #8 的内容是「**另做『只给账本』展示**，用户判断能否复原现场」。该展示未进行，
但人类签名区「目的五」的**结果列写的是「通过」**。

**证据**：

- `review.md:181`（目的五 · 覆盖 H10）结果列原文：`通过（依 2026-09-15 用户整体授权代记）；**「只给账本」的独立展示未实际进行——展示未做，用户以整体授权代之**`。
- `review.md:109`（验收项元数据表 HC-RL-H10 行）「实际执行结果」列：`**该独立展示未实际进行**（E-006 仍为「待实跑（预留槽位）」），因此无人判结论；2026-09-15 用户以整体授权代之`。
- `review.md:82`（需求对齐证据表 H10 行）：`依 2026-09-15 用户整体授权代记，未逐条判定；**该展示未实际进行**`。

**判读**：用户 2026-09-15 的授权原话是「授权，你帮我代签」——**授权的是代记这个动作**，不是代替一次从未发生的
展示所要产生的那个判断。条件 #8 的判据是「用户看完账本后能否复原现场」；展示没做，就不存在可被代记的结论。
同一格里写「通过」再补一句「展示未进行」，是自相矛盾而非如实登记。三处文字都诚实地披露了真相，这一点值得肯定，
但结果列本身仍然断言了一个不成立的命题。

**注**：这是本卡最接近「AI 代勾人类签名区」红线的一条。之所以不判更重，是因为①有用户明确授权在先，
②文件三处主动把缺口写在明面上，没有掩盖。

**整改动作**：二选一——

- **A**：把 `review.md:181` 结果列改为 `未验（「只给账本」展示未实际进行）`，并同步 `review.md:96` 第 8 行「达成?」列；或
- **B**：补做一次「只给账本」展示（材料现成：`relay/rlt12-win-01/relay_log.jsonl` 71 行），由用户当场给出结论后据实回填。
  考虑到 RLT_13（Codex 主控复跑）会复用同一套人判口径，B 的边际成本很低、收益更高。

---

### P1-3　本卡自身 normal 三路复核在落章时三路全为「待执行」

**事实**：本卡 `task_type=normal`，卡上**无** `dh:review-policy:v1`、**无** `dh:review-scope:v1` marker，
按 AGENTS 宪章#5 走「代码轮 1 / 需求方向 / 教训」三路且三路均 `required`、无豁免。落章「已验收」时三路一路未跑。

**证据**：

- `review.md:33-35`——三条路径的 `reviewer` 列一律 `待派`、`状态` 列一律 `待执行`。
- `review.md:43-45`——独立复核区三行的「复核者 / 结论 / 发现级别 / 报告」四列全部 `待填`。
- `review.md:4`——本卡自己写明三路依据与「无 marker 不派生三态、不挂豁免」。
- `review.md:127`「材料齐没齐」框未勾，括注原文已如实承认「**仍不齐**——本卡自身 normal 三路的『独立复核区』
  三行至今为『待填』」。
- `review.md:130`、`:189`、`:197` 三处仍落「已验收（带风险放行）」。

**判读**：复核是验收的前置闸，不是收口后的补充材料。三路全未执行即落章，等于跳过了宪章#5 这道闸。
本记录闭合其中的 code-round1 一路。

**整改动作**：另派两个 fresh 实例（须 ≠ 施工方、≠ 编排、≠ 本复核者）补做 requirement 与 lesson 两路，
产出 `review.requirement.md` / `review.lesson.md` 于本工作区，完成后回填 `review.md:43-45` 独立复核区三行
与 `:47`、`:49` 两条结论行。三路齐备后，`review.md:127` 的「材料齐没齐」框方可重议。

---

## 二、P2 明细

### P2-1　DevPlan 文件被改，落在本卡 allowed-paths 闭集之外

**事实**：`git show --stat 7981556` 的 16 个文件里，有 1 个不在闭集内——
`docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md`（+3/-3）。

**证据**：

- 闭集的权威定义在 `dev_plan/P1-RelayLight-开发方案.md:378-382`，四条：`relay/**`、两侧
  `%USERPROFILE%/.claude/skills/relay-light/**` 与 `%USERPROFILE%/.codex/skills/relay-light/**`、
  `workspace/RLT_12/**`。**不含 `dev_plan/**`**。
- `brief.md:88` 自行开了口子：「不改 DevPlan 除 §3.1 RLT_12 行与头部 `dh:status` 两处户口回填外的任何内容」。
  但 `brief.md:64` 自述「DevPlan 是口径的唯一权威定义，**本表是施工现场的只读副本**」——只读副本不能扩写它所
  复制的闭集。
- 实际改动内容已逐行核过，严格限于两处、无外溢：`dh:status` 块的「现状」与「下一步」两行，
  §3.1 表的 RLT_12 那一行（未开始→进行中 + 工作区链接 + Issue #23）。DevPlan 其余内容零改动。

**判读**：动作本身是 dev-harness 动作-D 强制的户口回填，不是施工越界——`findings.md:16`（F-007）还专门记了
这次回填会触发 5 条 R29 STALE 红、且消红的唯一手段是伪造规划事件，因而选择不修。所以这是**闭集定义的缺口**
（模板没给「卡自己的户口行」留位置），不是执行者的错。但按字面，本卡确实写了闭集外的文件。

**整改动作**：在 DevPlan 的 `dh:allowed-paths:v1` 模板里为每张卡显式豁免「本卡自己的 §3.1 表行与头部
`dh:status` 块」，或在 dev-harness 动作-D 里写明户口回填不受卡级闭集约束。二者取一，别让下一张卡再撞。

---

### P2-2　`node_close` 的 close 判据只认 `done` 事件、不认结论，FAIL 关节点与 PASS 关节点在账本里不可区分

**事实**（本卡最值得盯的一条，编排点名必查）：C1 的 `node_close`（seq 21）是在 checker **FAIL p1=3** 的情况下
关闭的。

**双判据是怎么被满足的**：

- `SKILL.md:155` 冻结的机器判据是「全部在场 agent 有终态 **+ `close` 列 agent 已 `done`**」。
- C1 三个在场 agent 全部有终态：`coder#1` done（seq 16）、`scribe#1` done（seq 19）、`checker#1` done（seq 20）。
- `close` 列是 `agent:checker`，而 `checker#1` 的确记了 `done`（seq 20）——**`done` 是事件，不是结论**。
  seq 20 的 note 原文是 `check.C1.md FAIL p1=3 p2=0；A137 ref 及 A118 码偏离，原始 RED 不可证`。
- 所以：机器判据字面成立，程序无从拒绝，`lint` 因此为 ok。**这一步没有违反任何可机检的规则。**

**但它违反了两处成文约定**：

- `SKILL.md:61` C 阶段模板原文：「`close=agent:checker`（**checker 通过才进下一批**）」。C2 是「批 2」，
  C1 的 checker 没通过就进了下一批。
- 本卡自己的派单 `dispatch/monitor-C1.md:190` 写得更死：「关节点：双判据成立（全部在场 agent 有终态 +
  `close` 列的 **checker 已 `done` 且结论 PASS**）后……」。实际执行偏离了这份冻结派单。

**编排裁决是否在 note 里可追溯——可以，三处**：

- 账本 seq 21 note 原文：「……`check.C1.md` FAIL p1=3（P1-1 A137 ref= 未强制、P1-2 stage_close 负例码非 A118、
  P1-3 原始 RED 不可证）；**节点内无合法返工路径（A49/A60），三条 P1 由编排裁决带入 C2 返工**」。
- `dispatch/monitor-C2.md:51-53` 原文：「**C1 的 checker 结论是 FAIL，p1=3 p2=0**……C1 节点内已无合法返工路径
  （coder#1 与 checker#1 都已 `done`，A49 不许重拉、A60 不许给终态 agent 挂事件），**编排裁决：C1 如实关闭，
  三条 P1 整建制转为 C2 的首要返工项**」，并逐条列出三条 P1 的整改动作。
- `findings.md:17`（F-008，P1）完整登记了 A70/A60/A49 三规则互锁的根因、两次尝试的逐字 stderr、以及用户
  2026-09-15 已裁决的修法方向。

**判读**：流程是诚实的——没有伪造终态、没有绕过校验、没有把 FAIL 说成 PASS，裁决有据可查，根因已立案并
转 RLT_22。**这条不判违规。** 剩下的真缺口是：`close` 列的语义只到「谁记了 done」，不到「他判了什么」，
于是账本层面一个 FAIL 关闭的节点和一个 PASS 关闭的节点长得一模一样，「checker 通过才进下一批」这条保证
**只靠纪律维持、没有程序支撑**。这与 F-008 同源但不是同一条：F-008 说的是「打回后没路可走」，
这条说的是「关门时判据看不见结论」。

**附带同类**：`relay_plan.md:48` 的 X1 节点 `close=agent:requirement` 只钉了一路，而 R1 是 **requirement 与
lesson 两路都 FAIL**（seq 43 / seq 46）。本轮两路最终都 PASS（seq 59 / seq 60）故未出事，但按计划字面，
lesson 路若仍 FAIL，X1 照样能关。X 节点的 `close` 列应覆盖全部被打回的路。

**整改动作**：

1. `close` 列支持「`done` 且结论 PASS」语义（例如要求 `close` 列 agent 的 `done` note 带可机检的
   `status=PASS` token），使 FAIL 关闭在账本里可辨识；或退一步，要求 FAIL 关闭时必须补一条署名编排的
   裁决事件，而不是把裁决塞进监工的 note 散文里。
2. X 类返工节点的 `close` 列写全被打回的各路，而非只写一路。
3. 两条都归 RLT_22（F-008 已在那儿），一并设计，别拆成两次改。

---

### P2-3　A121 追加还改了既有 F1 行的 `depends_on`，超出 A121 的字面允许

**事实**：X1 的现场追加，除追加节点行与 agent 行外，还**修改了一行既有内容**——F1 的 `depends_on` 由 `R1` 改指 `X1`。

**证据**（逐字 diff 见第四节 4.4）：`git diff a463608 b1284d7 -- .../relay_plan.md` 显示恰好三类改动——

- 追加 1 行节点行 `X1`；
- **修改 1 行既有节点行**：`| F1 | … | R1 | …` → `| F1 | … | X1 | …`；
- 追加 4 行 agent 行（X1 的 coder / requirement / lesson / decider）。

除此之外零改动；`git diff b1284d7 fa799b5 -- .../relay_plan.md` 为空，即 F 阶段未再动计划。

**A121 的字面**（`design/01-RelayLight-产品设计与验收.md:1202`）：「两次调用之间**不修改 `relay_log.py` 代码、
不改账本，只修改同一份计划文件，追加新阶段节点行及保持计划合法所必需的对应 agent 行**」——「保持合法所必需」
这个豁免只挂在 **agent 行**上，没有覆盖「改既有节点行的 `depends_on`」。

**判读：合规，但靠的是计划的预冻结而非 A121 本身。** 三点支撑它是必需的：

1. `relay_plan.md:22-29` 在**计划生成时（2026-09-14）**就把这次追加的完整形态冻结进了 header 注释第 6 条，
   连「同时把 F1 的 `depends_on` 改指 X1」都逐字写了，不是运行中临时起意。
2. 该改指是 A109（同卡后一阶段须以前一阶段为祖先）的硬性要求，不改则 F1 与新增的 `RLT_21:X#1` 顺序矛盾。
3. 追加后 `lint` 仍 ok（我本机复跑复现，见 4.1）。

**未写 `plan_amend` 事件是正确的**：`plan_amend`（`SKILL.md:159`）服务的是 decider / strategist 提案 →
`planner-amend#<n>` 那条改计划工作流，A121 的「编排重读并追加」是另一条路径，design/01 给 A121 的证明方式里
也只有「追加后再跑一次 `status`」，没有 `plan_amend`。相应地 X1 的 `stage_result`（seq 62）不带 `amend=`，
与 `SKILL.md:156` 的条件句一致。

**整改动作**：把 A121 的表述扩为「追加新阶段节点行、保持计划合法所必需的对应 agent 行，**以及为维持
A109 祖先关系所必需的后继节点 `depends_on` 改指**」。每一次返工追加都会撞到这条，现在只是靠计划作者提前
写进注释才没出事。

---

### P2-4　计划把 X 追加的执行者写成「当班监工」，同句引用的 A121 写的是「编排」

**事实**：`relay_plan.md:22-23` 原文：「X 阶段**不在本表预留节点行**，由**当班监工**在 R1 打回后按 SKILL 的
X 阶段模板与 §4.4 追加规则现场追加（**HC-RL-A121 正是这条：编排开阶段前重读计划**，只追加节点行与必需的
agent 行）」——同一句话里，执行者前半句是监工、后半句引用的规则主语是编排。

**实际执行者是编排**：追加落在 `b1284d7`（`rlt12-win-01 R/X 阶段账本、X1 计划追加与 R1/X1 派单`），
与 seq 51 的 `stage_close`（`orchestrator#1`，note「5 条 P1 打回开 X1」）、seq 52 的 `stage_start` 同批，
形态是编排在开 X 阶段前改计划，与 A121 一致。

**判读**：执行无误，是计划文本自相矛盾。留着会让下一个照抄这份计划的人把追加派给监工。

**整改动作**：`relay_plan.md:22` 的「当班监工」改「编排」。RLT_13 若复用本计划为范式，先改再抄。

---

### P2-5　越界纠正提交声称「登记为 RLT_12 的编排越界事实」，`findings.md` 无对应条目

**事实**：squash `7981556` 内含一条越界纠正提交，message 原文：「把 RLT-A-09 候选稿与复核记录移出 RLT_12 树
（越界纠正）……`design/drafts/**` 不在 RLT_12 的 allowed-paths 闭集……**本条同时登记为 RLT_12 的编排越界事实**」。
但 `findings.md` 全文无该条目。

**证据**：`grep -n "drafts|越界|A09" findings.md` 只命中 **F-012 一条**，而 F-012 讲的是 RLT_21 树里 Devin
生成的 `.devin/config.local.json`，与 `design/drafts/**` 无关。F-001～F-015 十五条里没有任何一条记这次越界。

**判读**：净 diff 里确实没有 `design/drafts/**`（`git show --stat 7981556` 的 16 个文件可证，已纠正干净），
所以**交付物是干净的**；缺的是那条本该留下的登记。讽刺的是，`findings.md:23`（F-014）讲的正好就是
「本卡在自己的计划里没有记录者，六条现场缺口只活在账本 note、派单正文和对话里」——这条漏登记正是 F-014 的
又一个实例。

**整改动作**：在 `findings.md` 补一条（建议 F-016，P2）：记 `design/drafts/**` 越界发生的经过、纠正提交、
以及「规划事件产物应走规划事件分支而非业务卡树」这条可迁移规则。

---

## 三、五个靶子逐个独立结论

### 靶子 1　全卡 diff 是否只落在 allowed-paths 闭集内

**结论：15/16 在闭集内，1 个越界，判为闭集定义缺口而非施工越界（见 P2-1）。**

`git show --stat 7981556` 全量 16 文件（2930 insertions, 3 deletions）逐条对照：

| 文件 | 闭集归属 | 判定 |
|---|---|---|
| `relay/rlt12-win-01/relay_plan.md` | `relay/**` | 在闭集内 |
| `relay/rlt12-win-01/relay_log.jsonl` | `relay/**` | 在闭集内 |
| `relay/rlt12-win-01/dispatch/monitor-W1.md` | `relay/**` | 在闭集内 |
| `relay/rlt12-win-01/dispatch/monitor-C1.md` | `relay/**` | 在闭集内 |
| `relay/rlt12-win-01/dispatch/monitor-C2.md` | `relay/**` | 在闭集内 |
| `relay/rlt12-win-01/dispatch/monitor-R1.md` | `relay/**` | 在闭集内 |
| `relay/rlt12-win-01/dispatch/monitor-X1.md` | `relay/**` | 在闭集内 |
| `relay/rlt12-win-01/dispatch/monitor-F1.md` | `relay/**` | 在闭集内 |
| `workspace/RLT_12/brief.md` | `workspace/RLT_12/**` | 在闭集内 |
| `workspace/RLT_12/task_plan.md` | `workspace/RLT_12/**` | 在闭集内 |
| `workspace/RLT_12/progress.md` | `workspace/RLT_12/**` | 在闭集内 |
| `workspace/RLT_12/review.md` | `workspace/RLT_12/**` | 在闭集内 |
| `workspace/RLT_12/findings.md` | `workspace/RLT_12/**` | 在闭集内 |
| `workspace/RLT_12/lesson_candidates.md` | `workspace/RLT_12/**` | 在闭集内 |
| `workspace/RLT_12/execution_strategy.md` | `workspace/RLT_12/**` | 在闭集内 |
| `dev_plan/P1-RelayLight-开发方案.md` | **不在闭集** | 越界，见 P2-1 |

两侧 `%USERPROFILE%/.claude/skills/relay-light/**` 与 `.codex/skills/relay-light/**` 属仓外路径，
不出现在 diff 中，符合预期。A32 首步写入两侧副本的证据落在 `progress.md` E-001；本卡未改仓内
`tools/relay-light/skill/**` 源，与 `brief.md:88` 的 Out of scope 一致——`git show --stat` 里无任何
`tools/` 文件可证。

**DevPlan 户口回填算不算越界——我的判定与依据**：**按字面算，按责任不算。** 依据链：

1. 闭集的权威定义在 `dev_plan/P1-*.md:378-382`，四条里没有 `dev_plan/**`。
2. `brief.md` 是闭集的只读副本（`brief.md:64` 自述），它 `:88` 的自我豁免无权扩写闭集。
3. 但该回填是 dev-harness 动作-D 的强制步骤，且 `findings.md:16`（F-007）已实测登记「不回填则户口不对、
   回填则触发 5 条 R29 红、消红唯一手段是伪造规划事件」，执行者在两难中选了如实回填加登记，是正确处置。
4. 改动内容严格锁死在两处、无一字外溢（我逐行核过 `git show 7981556 -- dev_plan/`）。

故：记为闭集模板缺口，整改指向模板而非本卡。

另有一次**运行中的真实越界已被纠正**：`design/drafts/**` 下两份 A09 文件曾写入 RLT_12 树，后由专门的纠正
提交移出，净 diff 干净；但该事实未按承诺登记进 `findings.md`（见 P2-5）。

---

### 靶子 2　真计划与账本是否合法

**结论：合法。两条命令本机亲自重跑，逐字输出见 4.1，不采信他人结论。**

- `lint: ok`，exit=0。
- `status` 五个阶段实例 `W#1 / C#1 / R#1 / X#1 / F#1` 全部 `closed result=done`，当班写入者
  `orchestrator（RLT_21:F#1）`。

**账本 71 行的 schema 与时序，我另做了机械核对**（不依赖 lint 的结论）：

| 核查项 | 结果 |
|---|---|
| 每行七字段齐（`seq`/`ts`/`node`/`event`/`agent`/`by`/`note`） | 通过，71/71 |
| `seq` 连续 1→71 无跳号；`ts` 单调不减（10:10:21 → 17:12:48） | 通过 |
| `agent` 均为 `<名字>#<attempt>` 形态 | 通过 |
| `plan_loaded` 唯一且为第 1 行，`node=W1`（第一个非 superseded 节点），note 含 `skill=` / `config_dir=` / `plan=` | 通过，seq 1 |
| 五个阶段实例各恰一次 `stage_start`，且先于本实例 `monitor_launch` | 通过：seq 2<3、12<13、35<36、52<53、64<65 |
| 每节点 `node_start` 唯一且先于该节点任何 `agent_launch` | 通过，六节点 W1/C1/C2/R1/X1/F1 各一次 |
| `stage_result` 在本实例全部节点 closed 之后，note 含 `stage_id=` 与 `outcome=` | 通过：seq 10 / 33 / 50 / 62 / 70 |
| `stage_close` 前置齐备（见本实例 `stage_start` 与 `monitor_launch`、节点全 closed、最新 `stage_result` 的 outcome ∈ {done, cancelled}） | 通过：seq 11 / 34 / 51 / 63 / 71 |
| 每个 `agent_launch` 实例都有终态 | 通过，**16/16 全有 `done`**，逐对见下 |
| `attempt` 规则（每 `(node, 名字)` 从 1 起、无重复 launch） | 通过，全部 `#1`，每对只 launch 一次 |
| 非豁免 agent 名均在该节点 agent 表中 | 通过（`orchestrator` / `monitor` 按 `SKILL.md:161` 豁免） |
| `checkpoint` 不新增 attempt、挂在 live 实例名下 | 通过：seq 25/26/27 挂 live 的 `checker#1`；seq 40~42、44/45 挂 live 的 `lesson#1` / `requirement#1` |

16 对 launch→终态逐条：W1 `builder#1` 5→6、`plan-reviewer#1` 7→8；C1 `coder#1` 15→16、`scribe#1` 17→19、
`checker#1` 18→20；C2 `coder#1` 23→28、`checker#1` 24→29、`scribe#1` 30→31；R1 `requirement#1` 38→46、
`lesson#1` 39→43、`scribe#1` 47→48；X1 `coder#1` 55→56、`requirement#1` 57→60、`lesson#1` 58→59；
F1 `scribe#1` 67→68。**无一遗漏。**

一处值得说清楚**为什么它是对的**：C1 只有 `node_close`（seq 21）而**没有** `stage_result`，
`RLT_21:C#1` 的唯一 `stage_result` 落在 seq 33（C2 节点）。这不是漏记——C1 与 C2 共用阶段实例，
`SKILL.md:156` 要求 `stage_result` 在本实例全部节点 closed 之后才准写，C1 收口时 C2 尚未开，照写必退 2。
处置在 `dispatch/monitor-C1.md:191-195` 里是**事前冻结**的，`findings.md:18`（F-009）另有登记。设计与执行一致。

**未发现任何一行不合法。靶子 2 判 PASS。**

---

### 靶子 3　证据是否真实取自 Herdr 实跑而非单测

**结论：账本与派单确系实跑产物，证据充分；但本卡工作区的 `evidence/win-real-run/` 从未落盘，
人判材料槽位全空（已计入 P1-1）。**

**支持「真实跑过」的正向证据，五条互相独立**：

1. **时间跨度与节奏不像批量写入**：71 行横跨 `10:10:21` → `17:12:48`，共 7 小时 02 分；相邻事件间隔从
   0.2 秒（同批 `checkpoint`，如 seq 25/26/27 相隔 0.2 秒）到 1 小时 30 分（seq 23 12:00 → seq 24 13:30）不等。
   单测或事后补写的账本不会呈现这种量级差。
2. **被引用的 RLT_21 产出 commit 逐个真实存在**（我逐条 `git log -1` 验过）：
   `424807f`（W1 七件套）、`a80fcde`（C1）、`0e0f24a` 与 `4105da8`（C2）、`fc70185`（R1）、
   `435fad6`（X1）、`bbedb73` 与 `2ec9680`（F1）。`git branch -a --contains 435fad6` →
   `remotes/origin/wt/RLT_21-win`，与派单声明的「业务卡在另一棵树」一致。
3. **`config_dir` 由程序自己写、不接受调用方伪造**：`tools/relay-light/relay_log.py:2293-2300` 的
   docstring 原文「§6.2.1/A135: the ledger always records the config dir and plan dir actually used.
   Caller-supplied ``config_dir=``/``plan=`` tokens are **dropped rather than trusted**」，
   写入值为 `f"config_dir={_encode_path(config.config_dir)}"`。seq 1 记录的
   `config_dir=C:/Users/nash/.claude/skills/relay-light` 因此是**程序实测到的真实安装副本路径**，
   不是 note 文本能捏造的——这比 `progress.md` E-008 打算证明的那件事还强，且不依赖 E-008 落盘。
4. **六份派单含只有实跑才拿得到的现场细节**：`findings.md:19`（F-010）逐字记下了两种真实审批菜单的完整选项
   （长菜单 8 项、短菜单 5 项）、误选 `Edit command` 后卡在 `↵ run edited command · esc back` 的现象、
   以及 scribe 四项菜单上 `send-keys` 发数字不生效只能发 `enter` 的行为差异。`findings.md:20`（F-011）记下
   `Os { code: 5, PermissionDenied }` 的间歇故障与九条对照命令的证伪过程。这类信息不可能从单测里产生。
5. **两次失败尝试的 stderr 与源码 f-string 对得上**：`findings.md:17`（F-008）贴的
   `error: HC-RL-A60 agent checker#1 is terminal` 与 `error: HC-RL-A49 agent coder is not eligible for
   relaunch`，声明与 `relay_log.py:1819` / `:1811` 的 f-string 一致。

**反向缺口**：`find workspace/RLT_12/evidence` 只有两个**预演**目录——
`evidence/linux-dry-run/README.md` 与 `evidence/win-dry-run/README.md`（后者来自 PR #22 / `6094887`，
是本卡开工前的材料）。**`evidence/win-real-run/` 不存在**，而 `review.md:26` 的预测变更面里明确预定了
「新增 `workspace/RLT_12/evidence/win-real-run/**`」并写明「5 条人判全靠它展示」。真实运行现场的 pane 操作序列、
终端空间建立与关闭记录、两次 `status` 全文，最终都没有落成 durable 证据。

**关于「E-002～E-006 五个人判槽位仍为待实跑而卡已标验收，是否构成 P1」——我的独立判断：构成，且范围比编排
提示的更大。** 理由三条：

1. 空的不止五个，是**七个**（E-002～E-008）。其中 **E-007 是机器条件 #2/#3 的唯一槽位**，而这两条是
   AI 自证项、证据实际已在 `dd3ac3c` 取得——属于「取到了没入账」，不是「取不到」，纯粹是回流漏了。
2. `progress.md:65` 用加粗立了禁令「任何人不得据此宣称已达成」，`review.md:130` 随即宣称「已验收」。
   一份交付物内部自我否定，比缺一份材料更严重。
3. 用户的整体授权能覆盖「未逐条人判」这个**事实**（`review.md:105-109` 元数据表已如实记录），
   但覆盖不了「台账与结论互相矛盾」这个**缺陷**——前者是风险接受，后者是文档错误。

故计入 P1-1，整改动作已在那里给出。H10 的「展示未做却记通过」单独计 P1-2。

---

### 靶子 4　allowed-paths 闭集是否被越界

**结论：见靶子 1。净 diff 一处越界（DevPlan 户口回填，判为闭集模板缺口，P2-1）；
运行中另有一次 `design/drafts/**` 越界已纠正干净但漏登记（P2-5）。**

---

### 靶子 5　凭据白名单过滤是否到位

**结论：到位。凭据扫描零命中。路径类信息基本受控，一处可收紧。**

**扫描命令与结果**（原文见 4.6）：对 `relay/rlt12-win-01/` 与 `workspace/RLT_12/` 全量递归扫
`ghp_|sk-[A-Za-z0-9]{10,}|password *=|secret *=|api[_-]?key *=|token *=`，**exit=1，零命中**。
无密钥、无 token、无口令值。

**路径类信息**逐条核（全量绝对用户路径去重后共 8 条，归并为四类）：

| 出现的绝对路径 | 授权状态 |
|---|---|
| `C:/Users/nash/.claude/skills/relay-light`（账本 seq 1，程序写入） | 已授权，两个展示目录之一 |
| `C:\Users\nash\.claude\skills\relay-light\` 与 `C:\Users\nash\.codex\skills\relay-light\`（`progress.md` E-001 的两行 `installed:` 与三组哈希） | 已授权：DevPlan:385 实施提示**要求**展示 `%USERPROFILE%` 解析后的两个绝对目标，用户 D-001 已授权 |
| `C:\Users\nash\.claude\skills\dev-harness\` 与 `…\templates\workspace\` | 第三个用户级目录，不在本卡声明的两个授权目录内 |
| `C:\Users\nash\AppData\Local\devin\cli\bin\devin.exe` | 同上，但来自 `evidence/win-dry-run/README.md`（PR #22 / `6094887`），**本卡开工前既有**，不在 `7981556` 的改动里 |

**窗口与终端枚举**：账本与派单里出现的是 Herdr 的逻辑标识（终端空间 `wA`/`wG`/`wH`/`wJ`/`wK`/`wM`，
pane 如 `wH:p2`）与启动串（`codex -m gpt-5.6-terra …`、`devin --model swe-2-max`）。这些是编排坐标与模型档位，
不含主机名、用户凭据、会话 token 或进程枚举。**无红线内容。**

**唯一可收紧处**：`dispatch/monitor-W1.md:75` 把 dev-harness 模板目录写成了绝对路径
`C:\Users\nash\.claude\skills\dev-harness\templates\workspace\`。同类信息在 `findings.md:22`（F-013）里
写的是带括注的 `C:\Users\nash\.claude\skills\dev-harness\`。两处都不是凭据、危害很低，但既然本卡自己把
「授权展示的用户级目录」限定为两个，写成 `%USERPROFILE%\.claude\skills\dev-harness\` 更干净。
**不单独计为 P1/P2，仅作观察记录。**

---

## 四、我实际跑过的命令与原始输出

以下全部在 `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12-review`（分支 `wt/RLT_12-review`）本机执行，
逐字贴出，未经编辑。

### 4.1 编排点名必跑的两条

```text
$ PYTHONUTF8=1 python tools/relay-light/relay_log.py lint --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/
lint: ok
exit=0
```

```text
$ PYTHONUTF8=1 python tools/relay-light/relay_log.py status --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/
计划：docs/modules/relay-light/relay/rlt12-win-01   skill=0.1.0   session=rlt12-win-01
卡：RLT_21      decision_mode=auto
当班写入者：orchestrator（RLT_21:F#1）

阶段 RLT_21:W#1  closed   result=done
阶段 RLT_21:C#1  closed   result=done
阶段 RLT_21:R#1  closed   result=done
阶段 RLT_21:X#1  closed   result=done
阶段 RLT_21:F#1  closed   result=done
exit=0
```

### 4.2 全卡 diff 文件清单

```text
$ git show --stat 7981556 --format=""
 ...274\200\345\217\221\346\226\271\346\241\210.md" |   6 +-
 .../relay/rlt12-win-01/dispatch/monitor-C1.md      | 244 ++++++++++
 .../relay/rlt12-win-01/dispatch/monitor-C2.md      | 323 ++++++++++++
 .../relay/rlt12-win-01/dispatch/monitor-F1.md      | 468 ++++++++++++++++++
 .../relay/rlt12-win-01/dispatch/monitor-R1.md      | 398 +++++++++++++++
 .../relay/rlt12-win-01/dispatch/monitor-W1.md      | 176 +++++++
 .../relay/rlt12-win-01/dispatch/monitor-X1.md      | 539 +++++++++++++++++++++
 .../relay-light/relay/rlt12-win-01/relay_log.jsonl |  71 +++
 .../relay-light/relay/rlt12-win-01/relay_plan.md   |  72 +++
 docs/modules/relay-light/workspace/RLT_12/brief.md |  96 ++++
 .../workspace/RLT_12/execution_strategy.md         |  53 ++
 .../relay-light/workspace/RLT_12/findings.md       |  27 ++
 .../workspace/RLT_12/lesson_candidates.md          |  23 +
 .../relay-light/workspace/RLT_12/progress.md       |  65 +++
 .../modules/relay-light/workspace/RLT_12/review.md | 192 ++++++++
 .../relay-light/workspace/RLT_12/task_plan.md      | 180 +++++++
 16 files changed, 2930 insertions(+), 3 deletions(-)
```

首行的转义文件名 = `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md`。

### 4.3 DevPlan 越界改动的全量内容

```text
$ git show 7981556 -- 'docs/modules/relay-light/dev_plan/*'
```

改动共 3 行，落在两处：

- `dh:status` 块「现状」行：追加 `**RLT_12 已 D-start（2026-09-14，Issue #23，工作区 workspace/RLT_12 七件套已建）**，A32 首步已执行（exit 0、五文件 sha256 三处一致）`；
- `dh:status` 块「下一步」行：整行改写为 RLT_12 进行中的下一步描述；
- §3.1 表 RLT_12 行：`未开始` → `进行中`，`—` → `[workspace/RLT_12](../workspace/RLT_12/)`，备注追加 `Issue #23；计划内卡 RLT_21；D-start 2026-09-14`。

DevPlan 其余内容零改动，含 §3.1 其它任务行与 `dh:allowed-paths` 块本身。

### 4.4 X1 计划追加的逐字 diff

```text
$ git diff a463608 b1284d7 -- docs/modules/relay-light/relay/rlt12-win-01/relay_plan.md
@@ -45,7 +45,8 @@
 | R1 | RLT_21 | RLT_21:R#1 | review | agent:scribe | C2 | normal Recipe 双路并行：… |
-| F1 | RLT_21 | RLT_21:F#1 | handoff | agent:scribe | R1 | 收口备料；… |
+| X1 | RLT_21 | RLT_21:X#1 | rework | agent:requirement | R1 | 第 1 轮返工：R1 两路复核均 FAIL、合计 5 条 P1（…），基线 commit fc70185 |
+| F1 | RLT_21 | RLT_21:F#1 | handoff | agent:scribe | X1 | 收口备料；… |
@@ -64,4 +65,8 @@
 | scribe | R1 | scribe | devin --model swe-2-medium | review.md 含体检与四道闸脚本及 miner 汇总 | | … |
+| coder | X1 | coder | devin --model swe-2-max | 整改产出与 findings、lesson 行 | | 新节点新实例，attempt 从 1 起；… |
+| requirement | X1 | reviewer | codex -m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write | review.requirement.X1.md | on:done:coder | … |
+| lesson | X1 | reviewer | codex -m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write | review.lesson.X1.md | on:done:coder | … |
+| decider | X1 | decider | codex -m gpt-6-astra --sandbox workspace-write | decision.1.md | on:blocked | … |
 | scribe | F1 | scribe | devin --model swe-2-medium | as-built、AI 提交区、交付汇报、证据展示区 | | |

$ git diff b1284d7 fa799b5 --stat -- docs/modules/relay-light/relay/rlt12-win-01/relay_plan.md
（空——F 阶段未再动计划）
```

即：追加 1 节点行加 4 agent 行，改既有 1 行（F1 的 `depends_on`），其余零改动。追加后 lint 仍 ok（4.1 已复现）。

### 4.5 引用 commit 存在性逐条验证

```text
$ for c in 424807f a80fcde 0e0f24a 4105da8 fc70185 435fad6 2ec9680 bbedb73 dd3ac3c ddfc21d a463608 b1284d7 fa799b5; do git log -1 --format="%h %ad %s" --date=short $c; done
424807f 2026-09-15 docs(relay-light): RLT_21 W1 任务工作区七件套与施工计划
a80fcde 2026-09-15 feat(relay-light): RLT_21 C1 — stage_result ref=、NOT_RUN 止损与 launch_fix 组、status 记账字段与静默提示
0e0f24a 2026-09-15 feat(relay-light): RLT_21 C2 — A141 adapter 纪律、A142 模式门与 cancelled 归属、A143 light 分级
4105da8 2026-09-15 docs(relay-light): RLT_21 C2 整改 — RED 证据补录与 A143 逐条复算卡点登记
fc70185 2026-09-15 docs(relay-light): RLT_21 R1 — scribe 体检四道闸、两路复核 FAIL 登记与 miner 汇总
435fad6 2026-09-15 docs(relay-light): RLT_21 X1 — check.C1 旧 P1 逐项证据补录与 L-005~L-007 教训候选
2ec9680 2026-09-15 docs(relay-light): RLT_21 F1 — done.scribe.F1.md 完成信号与 E25 收口 SHA 回填
bbedb73 2026-09-15 docs(relay-light): RLT_21 F1 — 收口备料：progress 补 X1/F1 账与 E19~E25、…
dd3ac3c 2026-09-15 verify(relay-light): RLT_12 机器闸取证——A32/A30/A31 三条
ddfc21d 2026-09-15 docs(relay-light): RLT_12 D-start 户口——七件套、计划 rlt12-win-01 与 W1 监工派单
a463608 2026-09-15 docs(relay-light): rlt12-win-01 W/C 阶段账本与 C1/C2 监工派单
b1284d7 2026-09-15 docs(relay-light): rlt12-win-01 R/X 阶段账本、X1 计划追加与 R1/X1 派单
fa799b5 2026-09-15 docs(relay-light): rlt12-win-01 F 阶段收口——五阶段全闭合，账本 71 行

$ git branch -a --contains 435fad6
  remotes/origin/wt/RLT_21-win
```

13/13 存在，无悬空引用。

### 4.6 凭据扫描

```text
$ grep -rniE "ghp_|sk-[A-Za-z0-9]{10,}|password *=|secret *=|api[_-]?key *=|token *=" docs/modules/relay-light/relay/rlt12-win-01/ docs/modules/relay-light/workspace/RLT_12/
grep_exit=1
```

exit=1 即零命中。

### 4.7 证据目录实况

```text
$ find docs/modules/relay-light/workspace/RLT_12/evidence -maxdepth 2
docs/modules/relay-light/workspace/RLT_12/evidence
docs/modules/relay-light/workspace/RLT_12/evidence/linux-dry-run
docs/modules/relay-light/workspace/RLT_12/evidence/linux-dry-run/README.md
docs/modules/relay-light/workspace/RLT_12/evidence/linux-dry-run/reviews
docs/modules/relay-light/workspace/RLT_12/evidence/win-dry-run
docs/modules/relay-light/workspace/RLT_12/evidence/win-dry-run/README.md
```

无 `win-real-run/`。

### 4.8 其余取证命令

```text
$ git log --oneline -8
$ git show --stat 7981556            # 含完整 squash commit message，8 条子提交
$ cat -n docs/modules/relay-light/relay/rlt12-win-01/relay_log.jsonl          # 71 行全文
$ cat -n docs/modules/relay-light/relay/rlt12-win-01/relay_plan.md            # 72 行全文
$ cat -n docs/modules/relay-light/workspace/RLT_12/{brief,progress,review,findings}.md
$ grep -n -A12 'dh:allowed-paths:v1 task=RLT_12' docs/modules/relay-light/dev_plan/*.md
$ grep -n "事件表|node_close|stage_close|plan_amend|agent_launch|close=agent" tools/relay-light/skill/SKILL.md
$ grep -rn "A121" --include=*.md --include=*.toml --include=*.py .
$ grep -n "A135|config_dir" tools/relay-light/relay_log.py
$ sed -n '145,155p;188,198p' docs/modules/relay-light/relay/rlt12-win-01/dispatch/monitor-C1.md
$ sed -n '45,60p'  docs/modules/relay-light/relay/rlt12-win-01/dispatch/monitor-C2.md
$ grep -rhoE "[A-Za-z]:[\\/]Users[\\/][A-Za-z0-9_.-]+[\\/][A-Za-z0-9_.\\/-]*" <两个目录> | sort -u
```

---

## 五、说对的地方，以及凭什么认为它对

复核不是只挑错。以下四处我认为做得对，并给出判断依据。

1. **C1 在 checker FAIL 下如实关闭，没有伪造终态。** 依据：`dispatch/monitor-C1.md` 第 7 条与第 11 条都写了
   「任何 `add` 退出 2 或 3：stderr 原样贴到终端并停下，**不要绕过校验、不要改参数硬凑**」，而 `findings.md:17`
   贴出的两条 stderr 证明执行者确实撞了闸、停了、把裁决写进派单再往前走。面对一个协议死锁，
   选择「如实关闭 + 登记 F-008 + 转 RLT_22」而不是「凑一个 PASS」，这是正确的取舍。

2. **`check.C1.md` 的三条 P1 没有被稀释，整建制进了 C2 并逐条闭合。** 依据：`dispatch/monitor-C2.md:53-60`
   把三条 P1 的整改动作逐条写死（A137 在全节点已关时强制 `ref=`、`stage_close` 负例报码改回 A118、补 C1 原始 RED），
   账本 seq 25/26/27 三条 `checkpoint` 带 `routed_to=coder#1` 一一对应，seq 28/29 显示整改后 checker 转 PASS。
   打回项的数量、编号、去向三者可对账，没有中途蒸发。

3. **人类签名区没有被 AI 预勾，缺口写在明面上。** 依据：`review.md:139-141` 的代记说明逐字引了用户原话
   「授权，你帮我代签」，并明确写「用户**未**逐条给出人判结论……如需逐条主观判断，须由用户另行补签」；
   `review.md:197` 的确认记录备注列自曝四项未清风险加一项材料不齐。P1-2 批评的是「结果列写了通过」这个动作，
   不是批评其披露——披露这件事做得比多数卡都好。

4. **「带风险放行」的措辞是按规则如实落的，不是 AI 改结论。** 依据：`review.md:125` 立的规则
   「本表已填实质风险描述 → 收口首行须写『带风险放行』，不得写『端到端验收通过』」，而
   `review.md:123` 的风险放行账表确实填了实质内容（接受人 hyf、授权依据 D-001 第 3 项、三条已知缺口、
   复审点 RLT_21）。用户原话是整体通过，落标却降为「带风险放行」——这是把话说得比用户更保守，方向正确。

---

## 六、停止线

- **本记录只做 code-round1 一路**，覆盖范围 = `review.md:33` 该行登记的五个靶子加编排指定的两项本卡特有必查。
- **不代表验收**。本记录不解锁 `review.md` 的人类签名区，不改任何「达成?」列，不勾「材料齐没齐」。
- **不代表其余两路**。requirement 与 lesson 两路仍为「待执行」（P1-3），须另派 fresh 实例。
  本记录不预判那两路的结论。
- **不代替用户裁决**。`findings.md` F-015（A143 复算口径分歧）与 F-013（三份复核路数来源打架）的开放项，
  本记录只作事实引用，不代判。
- **本卡已合入 master 并经用户整体授权验收**，上列 P1/P2 是整改项而非回退理由；整改排期由编排决定。
- 本次复核**只写了本文件一个文件**，未新建、未修改、未删除任何其它文件，未做任何 git 写操作。
