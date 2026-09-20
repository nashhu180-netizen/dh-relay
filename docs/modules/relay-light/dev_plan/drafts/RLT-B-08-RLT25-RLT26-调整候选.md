<!-- dh:v1 · B-adjust 候选 v2（草案，未经讲解 / 用户确认）。拟定事件 RLT-B-08（冲突处置见 §0）。 -->
# RLT-B-08 调整候选 v2 — 新增 RLT_25 / RLT_26（RLT_13 转派回流两卡）

- **目标文档**：[`dev_plan/P1-RelayLight-开发方案.md`](../P1-RelayLight-开发方案.md)
- **事件 ID**：拟定 `RLT-B-08`；该号曾被提议未登记，冲突事实与处置见 §0。
- **状态**：草案 v2。v1 经 fresh-context 独立审核（[`design/evidence/12-RLT-B08-RLT25-RLT26-交叉审核.md`](../../design/evidence/12-RLT-B08-RLT25-RLT26-交叉审核.md)，结论 REVISE：P2×2 + P3×2、无 P0/P1），本版逐项整改：P2-1 簿记清单补齐并纠正 A2 owner 误述（§3.7 / §4 / §5-O5）、P2-2 RLT_25 前置改为条件化（§1 / §5-O2）、P3-1 F-010 扩围注记（§2 / §3.9 / §5-O3）、P3-2 跳号时文件名留痕（§0.2 / §3.8）。本文件只是候选，落盘前任何字句都不是合同；正式流程仍走「主会话裁决 → 讲解 → 必要调整与定向复审 → 用户确认 → 落盘」。
- **输入边界**：唯一正式设计输入 = `design/README.md` `designInputs[]` 指向的 [`design/01-RelayLight-产品设计与验收.md`](../../design/01-RelayLight-产品设计与验收.md)（活动事件 RLT-A-06 / RLT-A-07 / RLT-A-11）。需求事实来源：GitHub Issue #49（RLT_25）、Issue #50（RLT_26），均 `Relates to #48`（RLT_13）；两 Issue 已建户，本候选不再补户。
- **来源 findings 出处**：`workspace/RLT_13/findings.md` 的 **F-001 / F-002** 目前只存在于未合入分支 `wt/RLT_13` 的工作树（RLT_13 在制）；`workspace/RLT_22/findings.md` 的 **F-005 / F-010**（F-005 已在 `dh:status` 登记为待承接转派项）与 `workspace/RLT_24/findings.md` 的 **F-C1-01 / F-C1-03** 已随 master 可读。引用未合入分支事实时保留「目前在未合并分支 `wt/RLT_13` 上」的标注。
- **本候选不授权**：不授权 D-start、不授权建 workspace、不授权 commit / push / PR / GitHub 服务端合并 / verify / 代签 / 部署发布 / 用户级 skill 副本重同步；也不改正式 DevPlan、不改 `design/`、不改任何代码。落盘动作清单（§3）本身也需用户在对话中明确确认后才执行。

## 0. 事件号冲突事实与处置方案

### 0.1 事实（可核查）

1. **B 号段实际已发到 `RLT-B-07`**：`design/evidence/09-交叉审核记录-RLT-A08-Linux预演回流.md` 含正式 `dh:planning-evidence:v1 event=RLT-B-07` 标记（review 与 understanding 各一），DevPlan §0 有「RLT-B-07 调整」叙述条，PR #20（`b078095`）已落盘。但 DevPlan 顶部活动 `planning-event` 声明仍为 `RLT-B-06`，历史索引表只收 B-01~B-05——**B-07 未进索引属既有簿记缺口**。
2. **`RLT-B-08` 曾被提议、从未正式登记**：`design/drafts/A09-复核触发信号与返工生命周期修订候选.md` §8.5 提议「DevPlan 侧需一个 `RLT-B-08` 承接」（RLT_22 加卡的计划侧调整）；`design/evidence/10` 两处明写「`RLT-B-08` 卡号/批次/依赖仍待 B 侧另行决定」；DevPlan §0 的 RLT-A-09 条原文记「本条 DevPlan 侧调整的正式 B 事件号尚未确定（候选稿 §8.5 提议 `RLT-B-08`，待 B 侧另行确认），故顶部 `planning-event` 活动声明本次不动」。事实上 RLT_22 的 DevPlan 侧变更（加卡、批次、卡数）随 RLT-A-09 证据链一并落盘合入，全程未登记独立 B 事件——活动声明、历史索引、`planning-evidence` 标记三处权威登记均未发出过 `RLT-B-08`。

### 0.2 处置方案（不伪造历史）

- **方案 A（推荐，与本候选文件名一致）**：本事件正式采用 `RLT-B-08`，即该号在权威登记处的**首次正式使用**——提议不等于登记，不构成一号两发。落盘时三处留痕防歧义：①顶部活动 `planning-event` 改为 `RLT-B-08`；②历史索引新增本事件行，备注「该号曾于 RLT-A-09 候选 §8.5 被提议用于 RLT_22 的 DevPlan 侧调整但未登记，本事件为其首次正式使用」；③§0 的 RLT-A-09 条悬置句收口为事实陈述：「该 DevPlan 侧调整随 RLT-A-09 证据链落盘、未单发 B 号；`RLT-B-08` 由本事件（RLT_25/RLT_26）首次正式使用」。
- **方案 B（备选）**：跳号采用 `RLT-B-09`，`RLT-B-08` 永久留空并在历史索引注明「曾于 A09 证据被提议、未登记」。若用户认为同号双出处仍有追溯歧义，取此方案。**采方案 B 时本候选文件不改名**——`drafts/` 属形成史目录，文件名保留 `RLT-B-08` 字样，落盘时补一句「文件名与最终事件号差异」说明（§3.8），与方案 A 的三处留痕同理防歧义。
- **明确不做**：不把 `RLT-B-08` 回溯登记给 RLT_22 的 DevPlan 侧调整——该调整已随 A 事件落盘，事后补发会伪造「当时经 B 事件确认」的历史；不改 A09 候选稿、evidence/09、evidence/10 原文（形成史原样保留，只用新登记行收口）。

## 1. RLT_25 卡草案 — 统一 normal Recipe 权威与闸门登记（Issue #49）

- **来源**：`wt/RLT_13` 工作树 `workspace/RLT_13/findings.md` F-001；同源 `workspace/RLT_22/findings.md` F-005（三份权威打架：仓根 `AGENTS.md` 宪章#5 三路 / `dh-mapping.toml` `[recipes.normal]` 两路 / dev-harness 模板另含一致性区）。Issue #49。
- **目标**：消除 normal 档复核路数的权威冲突——正式设计 `design/01` §6.3 与 `HC-RL-A115`（`normal = requirement + lesson`）、`tools/relay-light/skill/dh-mapping.toml`、仓根 `AGENTS.md` 宪章#5（`代码轮1 + 需求方向 + 教训`）、dev-harness 侧登记（review.md 模板一致性区 / G6）当前给出不同答案；本卡把获用户裁决的目标口径落到本仓全部在管权威源，使任一处对 normal reviewer 集合给出同一结果，且真实 normal 复核产物可被 `lint` 与收口检查一致解释。
- **非目标**：
  - **不裁决 normal 的目标路数**（两路还是三路、`code-round1` 是否计入 reviewers 集合、一致性路地位）——目标取值是 Recipe 合同问题，由用户裁决承载（需改 `design/01` 时先经独立 A-adjust），本候选与本卡均不预判、不以实现反推合同。
  - 不改 `design/` 任何文件；不新增、不退役、不改号验收 ID；不改活动总账。
  - 不改 dev-harness 仓与上游模板（`tools/dh-policy/registry.mjs`、review.md 模板、SKILL G6 等）；外部不一致只登记依赖与后续项，不跨仓顺手改。
  - 不回溯改写已收口卡（RLT_08/10/12/21/22/24 等）的复核记录与 `review.md`——历史实跑路数按事实保留，不补造不适用的第一轮/第二轮/一致性路径。
  - 不改 RLT_13 在制工作区与 findings；原则上不改 `relay_log.py`（A116 的 lint 守门已实现，本卡只对齐其读取的配置与文档；若施工发现非改程序行为不可，走停止边界）。
- **验收口径**：
  - **机器证**｜来源：`design/01` §6.3 + `HC-RL-A115`｜目标口径经用户裁决落定后（需改 `design/01` 时经前置 A-adjust），本仓在管权威源（`dh-mapping.toml [recipes.normal]`、`AGENTS.md` 宪章#5、skill 中 Recipe 叙述）对 normal reviewer 集合与正式设计取值逐项一致；一致性以固定闭集比对 + 结构测试证明，三档取值仍与 `dh-mapping.toml` 唯一权威对应。
  - **机器证**｜来源：`design/01` §11 `HC-RL-A116`｜`lint` 对 `recipe=normal` 且 R 实例 reviewer 集合等于目标集合的合成计划通过；缺一路、多一路（含 `code-round2` / `consistency` 误挂）的反例 fail closed 退 2 并报有效编号。
  - **机器证**｜来源：`design/01` §11 `HC-RL-A92`｜`dh-mapping.toml` 四类内容（stages ↔ dh 节点、三档 Recipe、`limits`、`on_exceed`）装载与校验保持，相关既有单测全绿。
  - **机器证**｜来源：`design/01` §11 `HC-RL-A117` + 仓根 `AGENTS.md` 宪章#5｜本卡及此后 normal 卡的 `review.md` 路径登记与冻结 Recipe 逐路一致；历史卡复核记录只登记事实，不伪造 legacy 第一轮/第二轮/一致性路径。
  - **机器证**｜来源：Issue #49 验收第 4 条｜相关单测全绿、仓级 runner 通过、`git diff --check` 干净、允许路径审计 diff 为空；外部 dev-harness 依赖与偏差在 findings 留痕。
  - **人判**：无新增——目标 Recipe 取值由用户裁决记录承载（需改 `design/01` 时经必要的前置 A-adjust），本卡不设独立人判项。
- **变更范围**：`dh-mapping.toml`（如需）、`AGENTS.md` 宪章#5（如需）、skill 五件中 Recipe 叙述段（如需）、`test_relay_log.py` / `test_install_skill.py` 相应断言（如需）、本卡工作区。
- **允许路径建议**：<!-- dh:allowed-paths:v1 task=RLT_25 -->
  - `tools/relay-light/skill/**`
  - `AGENTS.md`
  - `tools/relay-light/test_relay_log.py`
  - `tools/relay-light/test_install_skill.py`
  - `docs/modules/relay-light/workspace/RLT_25/**`
  - 显式排除：`docs/modules/relay-light/design/**`（设计正文修订属 A 事件领域，无论是否触发均不在本卡范围）、dev-harness 仓一切路径（外部依赖只登记）、`tools/relay-light/relay_log.py`（默认不含；确需改动即触发停止边界）。
- **档位**：标准（治理契约与配置行为调整）。
- **任务类型**：常规 `normal`（marker 建议 `<!-- dh:task-type:v1 task=RLT_25 type=normal -->`）。
- **依赖 / 批次**：**D-start 前置按 Issue #49 字面条件化**——第一步恒为「用户裁决目标 normal Recipe 取值」（本候选不预判两路/三路）；裁决结果分两路：①若目标口径需改 `design/01` 或验收命题（如 normal 变为含 code-round1 的三路）→ 先走独立 A-adjust（拟定 `RLT-A-12`，号以正式登记为准），其落盘为 D-start **硬前置**；②若裁决维持 `design/01` 现行两路、只修本仓其它权威源（宪章#5 / 映射 / 模板叙述对齐到 §6.3）→ 无需独立 A 事件，但**该用户裁决记录本身须作为 D-start 前置证据**出示（可折叠进本 B 事件的确认记录或一次轻量澄清留痕）。新增**第 7 批**，与 RLT_26 同批、互不依赖、可并行。与在制 RLT_13（`wt/RLT_13`）无文件级冲突：其允许路径为 `relay/**` 与 `workspace/RLT_13/**`，且 config-fixture 系复制非引用。
- **Devin `swe-2-max` 执行约束**：施工实例固定 Devin `swe-2-max`（用户指定；复核实例按 Recipe 另派、不受此约束绑定）；一卡一 worktree `wt/RLT_25`，自核对过的 master 基线创建；进场第一动作 `git rebase --autostash master`；施工者不复核自己的卡；**本卡自身复核按 D-start 时已生效的权威口径执行**（前置裁决 / A-adjust 保证彼时口径已定）；skill 五件变更后两侧用户级副本重同步须当次单独授权；commit / push / PR / 合并 / verify 逐项独立授权。
- **停止边界**：需要用户选目标 Recipe、需要跨仓修改 dev-harness、需要新增/改号验收 ID、发现未登记的第三处权威冲突时，停下呈交裁决；不得为让 `dh gate` 变绿补造不适用的复核记录（Issue #49 原文）。

## 2. RLT_26 卡草案 — `resource_close` 现役文档同步与 19 词残留清理（Issue #50）

- **来源**：`wt/RLT_13` 工作树 `workspace/RLT_13/findings.md` F-002；`workspace/RLT_24/findings.md` F-C1-01（skill/adapters/as-built 未收录 `resource_close`）、F-C1-03（§3.4 校验次序表述）；可选并入 `workspace/RLT_22/findings.md` F-010（同一快照的 trigger 口径滞后，已登记「转下一卡」）。Issue #50。
- **目标**：把 RLT_24 已实现并验收的 `resource_close` 合同——第 20 控制事件、按解码 `object_type` 的写入者归属（pane→`monitor#<n>`，workspace/worktree→`orchestrator#<n>`）、`note` wire format 四键闭集与逐键校验、`reason` 条件、关后允许记账、§12 关失败取证路径——完整同步到现役文档面：仓内 skill 单源（`SKILL.md` 控制事件表与相关纪律段、`references/adapter-claude-code.md`、`references/adapter-codex.md`）与 `as-built/RLT_05-实现快照.md`；清理会误导当前行为的 19 词口径残留。
- **非目标**：
  - **不重做或扩展 `resource_close` 核心实现**——`relay_log.py` 只读引用、不进允许路径。
  - **不改冻结 wire format**（四键闭集、`object_type` 枚举、编码规则），不新增事件词。
  - **不追改历史证据**：`workspace/**`、`relay/**` 账本与计划、`design/evidence/**`、以及 as-built 内两份时点记录（`现役Runner一致性对照.md`、`持久化产物退场核对.md`）原样保留——其中的「19 事件」属时点事实，不改写、不冒充现役口径。
  - 不改 `design/01` 正文（§11 `HC-RL-A85` 行仍列 19 词时代写入者枚举，属设计正文修订，如需同步须另走 A 事件）；不新增/退役/改号验收 ID；不改 dev-harness。
- **验收口径**：
  - **机器证**｜来源：`design/01` §11 `HC-RL-A2`｜skill 三文件与 as-built 快照的事件词表 = 20 词全集、控制/agent 二分正确且含 `resource_close`；对现役口径文件的「19 词 / 19 个事件」类表述 grep 归零，时点记录类命中逐条登记豁免理由。
  - **机器证**｜来源：`design/01` §3.4 + `HC-RL-A155`｜`SKILL.md` 控制事件表含 `resource_close` 行：写入者归属按解码 `object_type`、note 四键闭集与逐键校验、允许在 `node_close`/`stage_close` 之后记账、不进状态机、不改变节点/阶段派生——逐点与 `relay_log.py` 实现一致。
  - **机器证**｜来源：`design/01` §11 `HC-RL-A156`｜文档写明 `outcome=failed` 必须有非空非纯空白 `reason`、`outcome=ok` 不得带 `reason` 的条件合同。
  - **机器证**｜来源：`design/01` §12 + `HC-RL-A157`｜两份 adapter 与 F 阶段收口纪律含关闭失败取证路径（写 `resource_close outcome=failed` → 按 `seq`/`object_id` 检索 → 处置记录落证据），与 RLT_24 实证口径一致。
  - **机器证**｜来源：`design/01` §11 `HC-RL-A158`｜as-built 快照注明向后兼容事实（`rlt12-win-01` 71 行字节不变、`lint` 退出 0、新旧实现稳定字段一致），不把历史兼容写成历史补记。
  - **机器证（并入项，待用户裁决，见 §5）**｜来源：`design/01` `HC-RL-A144`～`A150` / `A137` + `workspace/RLT_22/findings.md` F-010｜同族「现役文档滞后于已实现合同」残留一并清零：`RLT_05-实现快照.md` 的 trigger 三态（补 `on:review_ready:` 四态与 A144~A147 语义）、§5「两套计数」（改三套）、`SKILL.md` L151「两套计数」残留、`SKILL.md` `stage_result` 行「在该实例全部节点 closed 之后」旧口径（对照 `HC-RL-A137` 的 `blocked/failed` 允许节点未关）。若批准并入，落盘时须同步补范围注记（DevPlan 卡「来源」行写明「并入 RLT_22 F-010 同族残留」，Issue #50 的对应注记/评论另需当次授权后补记），避免「卡做了 Issue 没写的事」；若不批并入则整体剔除、另立承接，不影响前五条成立。
  - **机器证**｜来源：Issue #50 验收第 3 条｜skill 文本结构检查覆盖新增纪律原文（沿用既有 `test_relay_log.py` / `test_install_skill.py` 的 skill 文本断言机制）；unittest 全绿、仓级 runner `RELAY ALL PASS`、`git diff --check` 干净、允许路径审计 diff 为空。
  - **人判**：无新增——文档与冻结合同的一致性全部机器可核；施工中发现实现与合同不一致走停止边界，不转化为人判放行。
- **变更范围**：skill 单源三文件、as-built 快照、必要结构测试、本卡工作区。
- **允许路径建议**：<!-- dh:allowed-paths:v1 task=RLT_26 -->
  - `tools/relay-light/skill/**`
  - `tools/relay-light/test_relay_log.py`
  - `tools/relay-light/test_install_skill.py`
  - `docs/modules/relay-light/as-built/RLT_05-实现快照.md`
  - `docs/modules/relay-light/workspace/RLT_26/**`
  - 显式排除：`tools/relay-light/relay_log.py`、`docs/modules/relay-light/design/**`、`docs/modules/relay-light/relay/**`、`docs/modules/relay-light/workspace/`（RLT_26 除外）、as-built 下另两份时点文档、两侧用户级 skill 副本（仅由安装器 `--all` 同步、须当次授权）。
- **档位**：标准（文档/模板与现役实现一致性修复，非生产部署）。
- **任务类型**：常规 `normal`（marker 建议 `<!-- dh:task-type:v1 task=RLT_26 type=normal -->`）。
- **依赖 / 批次**：RLT_24 已合入并验收（满足）；无其它硬前置。第 7 批，与 RLT_25 并行。
- **Devin `swe-2-max` 执行约束**：同 §1 约束集（`swe-2-max` 施工、`wt/RLT_26`、rebase master 进场、施工者不自核、skill 变更后两侧重同步当次授权、Git/远端动作逐项独立授权）。
- **停止边界**：若发现 RLT_24 核心实现与正式设计不一致，停止并回报，不以文档同步掩盖代码缺陷；需要改 design 正文、改冻结 wire format 或新增验收 ID 时停下呈交裁决；不清理历史留痕（Issue #50 原文）。

## 3. DevPlan 落盘联动清单（用户确认后原子同步，本候选不执行）

1. 顶部 `planning-event` 活动声明改为本事件号（按 §0 裁决）；`RLT-B-06` 转历史索引；**索引补登 `RLT-B-07`**（标注「索引补登、非新事件」——机械更正 §0.1 的既有缺口）。
2. §0 追加本事件调整条：两卡事实、Issue #49/#50、§0 事件号处置、证据锚点（fresh 审核 / understanding 落 `design/evidence/` 后回链）。
3. §0 的 RLT-A-09 条悬置句按 §0 方案 A 收口（若方案 B 则改写为「`RLT-B-08` 永久未登记」口径）。
4. §3.1 索引表新增两行：RLT_25（标准 / 未开始 / 批次 7 / 依赖：用户裁决记录，若需改 design 则前置 A-adjust（拟 `RLT-A-12`）/ Issue #49）、RLT_26（标准 / 未开始 / 批次 7 / 依赖：RLT_24 / Issue #50）；工作区列均「—」。
5. §3.2 追加两卡正文（按 §1/§2 草案文字，落成既有卡格式）。
6. §4 批次表新增第 7 批行（两卡；批末可演示结果 = normal Recipe 各权威源一致 + `resource_close` 现役文档面同步完成；开批条件：RLT_25 须有用户裁决记录（若需改 design 则前置 A-adjust 落盘）+ 各自 D-start 授权），段尾卡数 19→21。
7. **顺带簿记补录包（逐项均可被用户否决，不默认落盘）**——fresh 审核 P2-1 补齐的同型失修点：
   - §6 对照表缺 `HC-RL-A151`～`A158` 八行（owner = RLT_23 / RLT_24，第 6 批落盘时的存量缺口）→ 机械补登；
   - §6 对照表 `HC-RL-A2` 行 owner 仍为 `RLT_03`（L617），而 RLT-A-11 已把 A2 修订为 20 词并改派 `RLT_24` 承接（`design/01` L21、§11 A2 行、§3.1 RLT_24 行）→ 行值校正或注明新旧承接关系；
   - §6 表尾脚注「125+15 条（RLT-A-09 后）」→ 更正为当前活动总账 148（AI 133 + 人验 15，按正式输入 §11 重算）；
   - §1（L55）「承接其 125 条 `HC-RL-A*` 与 15 条 `HC-RL-H*`，共 140 条」→ 更正为 148；
   - §9（L739）「前四批交付 122 条机器验收与 13 条人验；第 5 批 RLT_18 补齐 …总账 140 条」→ 总账更正为 148，且「前四批/第 5 批」二分口径本身失修（A151~A158 归属第 6 批），按含第 6/7 批的口径重述。
   以上全部为簿记更正、不改任何验收语义；不批则另记 findings 留存。
8. 若 §0 采方案 B（跳号 `RLT-B-09`）：本候选文件名保留 `RLT-B-08`（形成史不改名），落盘时在历史索引与 §0 事件条内补「文件名与最终事件号差异」说明（P3-2）。
9. 若 F-010 并入获批准：DevPlan §3.2 RLT_26 卡「来源」行补「并入 RLT_22 F-010 同族残留」范围注记；Issue #50 的对应注记/评论须当次授权后补记（P3-1）。
10. §8.1 覆盖关重算并写明「两卡不新申领验收 ID、活动总账 148 不变」；§8.3 依赖关补记「RLT_25 的 D-start 前置为用户裁决记录或 A-adjust 落盘（按 §1 条件化口径）」与无环结论；§9 卡数 19→21。
11. `dh:status` 块按落盘时事实机械更新（本候选不预写）；`design/README.md` 内容目录可机械补本候选与后续 evidence 链接。
12. RLT_13 的 §3.1 状态行回填属该卡自身收口范围，本事件不代填。

## 4. 三关自查

- **覆盖**：两卡不新申领、不退役、不改号验收 ID；活动总账保持 148。四条来源 finding 各有承接——RLT_13 F-001 + RLT_22 F-005 → RLT_25，RLT_13 F-002 + RLT_24 F-C1-01 → RLT_26；RLT_24 F-C1-03（§3.4 校验次序表述）由 RLT_26 文档同步顺带核对、不改合同；RLT_24 F-C1-04 已经 `decisions.md` 用户裁决闭合，不在承接范围；RLT_22 F-010 为可选并入项（§2 第六条机器证）。每条验收均回链正式 `design/01` + 稳定 ID（A92/A115/A116/A117、A2/A155~A158，并入项 A137/A144~A150）；被引用 ID 的 owner 归属以 §6 对照表现状为准：A115/A116 归 RLT_05；**A2 的 §6 行现仍写 `RLT_03`**——RLT-A-11 已把 A2 命题修订为 20 词并改派 RLT_24 承接，行值滞后属 §3.7 簿记校正项而非本两卡的移交；A151~A158 尚无 §6 行（同属该补录包）。本两卡只做一致性与守门证据，不半签、不移交 owner——若前置 A-adjust 修订这些 ID 的命题列，owner 与补取证安排由该 A 事件裁决。
- **颗粒度**：RLT_25 一个验收单元「normal Recipe 权威一致 + lint 守门」；RLT_26 一个验收单元「`resource_close` 现役文档同步 + 残留清零」；两卡互不半签、可在各自 worktree 独立实现/证明/签署；均只写边界与验收，未写函数级步骤。
- **依赖**：RLT_25 ← 用户裁决目标 normal Recipe（恒为前置；裁决需改 `design/01` 时升级为独立 A-adjust 硬前置，裁决维持现状则裁决记录即前置证据）；RLT_26 ← RLT_24（已满足）；两卡互不依赖、与在制 RLT_13 无文件重叠；软建议 RLT_25 早于第 3 批实跑卡（RLT_14/15/16/19，其 `recipe=normal` 计划会重演 F-001/F-005 歧义）落地——是否升级为硬依赖列开放项 O4。全计划无环。

## 5. 待用户裁决开放项（逐项可选）

1. **O1 · 事件号**：A = 采用 `RLT-B-08` 首登（推荐；附 §0.2 三处留痕）｜B = 跳号 `RLT-B-09`、`B-08` 永久留空备注；采 B 时本候选文件名保留 `B-08` 作形成史，落盘加注差异说明（§3.8）。
2. **O2 · RLT_25 前置形态**：① 条件化（按 Issue #49 字面，推荐）：先由用户裁决目标 normal Recipe——裁决需改 `design/01` 或验收命题 → 独立 A-adjust（拟 `RLT-A-12`）为 D-start 硬前置；裁决维持 `design/01` 现两路、只修本仓其它权威源 → 免独立 A 事件，但该裁决记录为 D-start 前置证据。② 无条件硬前置：任何取值都先走独立 A-adjust。两案均不预判两路/三路。
3. **O3 · F-010 并入 RLT_26**：并入（§2 第六条机器证生效；落盘补 DevPlan 来源行注记，Issue #50 注记须当次授权）｜不并入（整项剔除、另立承接）。
4. **O4 · RLT_25 是否升级为第 3 批实跑卡（RLT_14/15/16/19）硬前置**：升级｜不升（建议不升，仅记录口径风险——第 3 批 `recipe=normal` 计划会重演 F-001/F-005 歧义）。
5. **O5 · §3.7 簿记补录包**（含 §6 A151~A158 八行、§6 A2 owner 行校正、§6 脚注、§1 L55、§9 L739 五处，全部机械）：随本事件落盘（可再逐项否决）｜不落盘（另记 findings 留存）。

## 6. 不授权声明

本候选与两 Issue 的创建均**不授权** D-start、commit、push、PR、GitHub 服务端合并、verify、代签、部署/发布、用户级 skill 副本重同步、建立 workspace，或对正式 DevPlan / `design/` / 代码的任何写动作。B 落盘、各卡 D-start、各卡收口 verify 均为独立闸，逐次取用户在对话中的明确确认。
