# A-01 RelayLight 运行中改计划交叉审核与整版确认记录

对象：[正式 design/01](../01-RelayLight-产品设计与验收.md)，[A-01 形成史](../drafts/01-RelayLight-产品设计与验收-候选.md)。本记录只覆盖 2026-09-09 补充的 §4.5「运行中改计划」及其配套改动；2026-09-08 至 09-09 的前六轮 fresh 复核未单独落盘，仅在正式输入文件头的冻结来源行记载。

## 背景

2026-09-09 用户补充需求：**决策 agent 发现计划不对时可以改接力计划，且要同步开发方案与任务卡**。主控与用户对齐后固化为 §4.5，要点四条：

- 发现要改的只能是 decider（施工 blocked 时）或 strategist（返工超限时），两者只在自己的方案文件里写「需要改计划」，自己不改任何文件。
- 过门沿用现有的门，不新增规则：decider 触发的按 marker 的 `decision_mode`，strategist 触发的永远先交用户。
- 过门后由当班监工拉一个 planner 角色的**改计划实例**（`planner-amend#<n>`）一次改完，跑 lint，做完关闭。
- 护栏：**任务卡、开发方案、接力计划三样 agent 可自己改；设计方案与验收清单 agent 不碰，交用户。**

配套写入四情况表（卡内改、新增卡、改开发方案拆分、撞禁区）、新增控制事件 `plan_amend`、编排每次开阶段前重读计划、`stage_result` 带改动摘要、lint 的「阶段节点连续」一条放宽。

<a id="review-rlt-a01"></a>
<!-- dh:planning-evidence:v1 event=RLT-A-01 artifact=design/01-RelayLight-产品设计与验收.md kind=review -->

## 第一轮 fresh 复审与裁决

审核形态：codex 只读沙盒，fresh context、未参与起草。结论 CHANGES_REQUESTED：**P0=2、P1=7、P2=4，共 13 条**。主会话逐条裁决，**13 条全部归入「AI 已修」，无「须用户决定」项，无驳回项**。

### P0

- **P0-1 `watch` 推送 `plan_amend` 无实现依据**。§3.6 冻结的 watch 只推 Herdr agent 状态变化与 20 分钟 tick，不读账本事件，原文却写「编排收到 watch 推送的 `plan_amend` 只记不动作」，凭空多出一条推送通道。裁决：删掉该说法，改为**编排不监听 `plan_amend`**，改计划信息只经本阶段 `stage_result.note` 的 `amend=` 摘要到达编排，编排据此在开下一阶段前重读计划。§3.6 不动。
- **P0-2 HC-RL-A85 把 `stage_result` 误归编排**。原写法「`stage_*` 归 orchestrator」把监工写的 `stage_result` 一并划走，与 §3.4 事件表和 §10.2 账本样例都矛盾，且新增的 `plan_amend` 未归类。裁决：改为 **`stage_start` / `stage_close` / `plan_loaded` / `monitor_launch` 归 orchestrator；`node_start` / `node_close` / `monitor_restart` / `stage_result` / `plan_amend` 与全部 agent 事件归 monitor**，并核对 §3.4 与 §10.2 一致。

### P1

- **P1-3 `planner-amend` 不进 blocked 链**：它是过门之后的执行者，不能再触发第二轮升级。补「不允许写 `blocked` / `escalate`；做不到就按超出范围处理」。
- **P1-4 lint 兜底缺失**：原文只写「不过就自己修到过」，没有出口。补**重试上限 3 次**，仍不过视同超出范围。
- **P1-5 `consult` 否决分支缺失**：只写了用户同意的路径。补 `user_decision` 的 `note` 约定——同意写 `approve-amend:`，否决写 `reject-amend:` 加用户的替代指示；否决时监工不拉改计划实例、不重拉 decider，直接把指示送回同一个 coder 并写 `resume`，账本不出现 `plan_amend`。
- **P1-6 超出范围分支断在 blocked**：用户裁决继续后没写怎么接回来。补当班监工为 `coder#1` 补写 `resume`、本阶段跑完补写 `outcome=done`，衔接 §5.2.1 的 blocked 收尾路径。
- **P1-7 HC-RL-H16 混装两个场景**：卡内追加节点与新增任务卡追加阶段的验证动作和判断点都不同。拆为 **HC-RL-H16 卡内追加节点**（监工直接接手）与 **HC-RL-H17 新增任务卡追加阶段**（编排开出新阶段）。
- **P1-8 `relay_plan.md` 的并发未交代**：§3.7 只讲了账本单写者。补「计划文件同样单写者：改计划实例编辑期间编排不读该文件，编排只在阶段开始前重读，两者由 `stage_result` 隔开」。
- **P1-9 白名单是口语不是路径**，无法机器校验。改为按路径写死，并到 dev-harness skill 查证真实骨架后填：白名单 = `docs/modules/<模块>/relay/<plan_id>/relay_plan.md`（含 marker 的 `cards=`）、`docs/modules/<模块>/dev_plan/P<N>-*.md`、`docs/modules/<模块>/workspace/<卡号>/task_plan.md`；**禁区 = `docs/modules/<模块>/design/` 整个目录**（验收清单与设计方案同在 `design/01-*.md`）。HC-RL-A122 的验证方法改为对这组路径做 `git diff --name-only` 断言。

### P2

- **P2-10 表格单元格里的转义竖线**（第 74、218、953 行）违反草案自己的硬约束，统一改成 `/` 分隔。
- **P2-11 `superseded-by` 在拆分场景下有歧义**：补「一个旧节点拆成多个新节点时只引用承接 `depends_on` 的那一个，其余由新节点自身的依赖链体现；该字段是单值，不写成列表」。
- **P2-12 禁区判定未说是否可部分执行**：补「只要有一处落进禁区，整份改动都不落笔」，理由是半改过的计划既不是旧计划也不是新计划。
- **P2-13 HC-RL-A121 措辞含糊**（「不重启程序」不可验证），改为「不修改 `relay_log.py` 代码、仅向计划文件追加新阶段的节点行后再次调用 `status`」。

## 定向复审

同一形态只读复审：**13 条中 12 条闭合**，遗留 1 条**新引入**问题——第 6 条（P1-6）修补超出范围分支时，为「用户裁决继续」补了一条 `user_decision`，但它前面没有紧邻的 `decision`，违反 §3.4 的决策链固定序（`blocked → escalate → decision → [user_decision] → resume`），会被 HC-RL-A114 判失败。裁决：**删掉那条 `user_decision`，直接写 `resume`**，`note` 写「用户在接力外补齐设计/验收后裁决继续，见本阶段 `stage_result` 历史」；**不在 §3.4 加例外**。改后该分支事件序列为 `agent_launch planner-amend#1` → `done planner-amend#1`（超出范围）→ `stage_result outcome=blocked` → `resume coder#1` → `stage_result outcome=done`，与固定序无冲突。

至此 13 条全部闭合，无新增 P0/P1。

<a id="understanding-rlt-a01"></a>
<!-- dh:planning-evidence:v1 event=RLT-A-01 artifact=design/01-RelayLight-产品设计与验收.md kind=understanding -->

## 理解与整版确认

用户要的是：接力跑起来之后，计划发现不对**不用停摆等人**，但**能自己改的范围必须钉死**。钉法是一句护栏——任务卡、开发方案、接力计划三样 agent 自己改，设计方案与验收清单一律交用户。这里有一处**有意的规则冲突**：改计划实例直接改开发方案任务行，**绕过了 dev-harness「改开发方案须 B-adjust 用户确认」**。这是显式决策，不是疏漏，已写进 §1.3 核心决策清单（不可逆程度「中」，备选为「每次改计划都交用户」与「完全禁改」），并在 §14 要求写进 AGENTS.md 的 relay-light 编排协议段。

**2026-09-09 用户整版确认**，本文晋级为 relay-light 的正式设计输入。确认时的口径：

- 验收清单 **119 条 = AI 自动验收 104 条 + 人类验收 15 条**（本轮新增 HC-RL-A119～HC-RL-A123 与 HC-RL-H16、HC-RL-H17 共 7 条；原 112 条 = 99 + 13）。
- 事件词表由 18 个增至 19 个（新增 `plan_amend`）。
- 核心决策清单由十五条增至十六条。
- 整版确认**不授权 B 拆计划、不授权 D 开工**，两者仍各自走门。

- 正式输入 ID 前缀改为 `HC-RL-`，与候选稿的 `RL-` 一一对应，**编号不变**（`RL-A37` 即 `HC-RL-A37`）。改前缀是为了被 dev-harness 解析器识别（`tools/dh-core.mjs` 的 `^HC-[A-Z0-9]+-[AHM]\d+$`），不改变任何验收语义；`drafts/` 候选稿保留 `RL-` 原样作形成史。

## A′ 增补 · B 审核回流（2026-09-09，**用户已确认 2026-09-09**）

<a id="review-rlt-a02"></a>
<!-- dh:planning-evidence:v1 event=RLT-A-02 artifact=design/01-RelayLight-产品设计与验收.md kind=review -->

来源：B 拆计划阶段的 fresh-context 审核，在 `design/drafts/P1-RelayLight-开发方案-候选.md` 原 §7「正式输入中的矛盾或缺口」里列出 5 条 P1（该节现已改写为 §7「正式输入回流与实施证据要求」）。B 不擅自改设计，回流到 A′ 由正式输入澄清。**五条均只改契约细节与验证描述，验收 ID 一条未增未删未改号。**

| # | B 审核提出的问题 | A′ 裁决与落点 |
|---|---|---|
| 1 | **Recipe 权威冲突**：§6.2 示例写 `normal = code-round2 + requirement + lesson` 且用 `[rework]` 节，与 §6.3、HC-RL-A115 的 `normal = requirement + lesson`、`[limits]` 节矛盾 | 以 §6.3 与 HC-RL-A115 为准。§6.2 改为只写结构不写取值，删掉 normal 的错误路数与 `[rework]` 写法，显式声明止损节名是 `[limits]` 与 `[limits.on_exceed]` |
| 2 | **`status --json` schema 不完整**：HC-RL-A62 要的 `current_stage`、HC-RL-A106 要的建议动作与 failed 重拉计数都没有稳定键名 | §3.5 补顶层字段合同表并冻结键名：`current_stage`、`last_stage_result`、`suggested_action`（五枚举）、`monitor_relaunch_count`、`pending_nodes`、`superseded_ignored`，空值语义写明。HC-RL-A62 与 HC-RL-A106 的验证描述改为引用这些字段名 |
| 3 | **strategist 账本链缺口**：HC-RL-A97 要 strategist 最终形成 `user_decision`，但 §3.4 把 `user_decision` 限定在 decider 的 `decision→[user_decision]→resume` 里，返工超限路径没说事件记在哪个 `(node, agent)` | §3.4 补第二条链并冻结：触发者是监工，全链记在**触发时最后一个 X 阶段 coder** 名下，顺序 `escalate` → `agent_launch strategist#n` → `decision` → `user_decision` → (`resume` 或 `cancelled`)；**`user_decision` 永远出现，不看 `decision_mode`**；该链允许 `escalate` 作链首、无 `blocked` 前置。原「`user_decision` 只在 consult 出现」改为「decider 链按 `decision_mode`；strategist 链永远有」。§9.3 补事件行样例，HC-RL-A114 与 HC-RL-A97 验证描述同步 |
| 4 | **配置定位与生成接口未定义**：两侧 skill 同时存在时从哪份 `dh-mapping.toml` 读没说；HC-RL-A99 又要求模板生成随配置变，但首版只有 add/status/lint | 新增 §6.2.1 解析优先级：`--config-dir` 显式指定优先，其次是当前平台自己的 skill 目录（Claude Code 读 `~/.claude/`，Codex 读 `~/.codex/`），**不做跨目录比对**；两侧一致由 RLT_01 的五文件清单哈希保证。`plan_loaded` 的 `note` 必须记录实际使用的配置目录。HC-RL-A99 明确模板生成是 lint 与 skill 的内部实现，**不新增公共 CLI 子命令** |
| 5 | **新增任务卡的路径授权未闭合**：白名单里的 `workspace/<卡号>/task_plan.md` 没说新卡算不算 | §4.5.2 收窄：`<卡号>` 只能是**改动前** marker `cards` 里已存在的卡；新增卡的 `task_plan.md` 由该卡 W 阶段 builder 建，改计划实例不写。HC-RL-A122 验证描述同步 |

### 用户当场追加裁决（2026-09-09）

除上表五条回流外，用户在同一轮里另拍两条，**均非 B 审核提出，属用户直接决策**：

| # | 裁决 | 落点 |
|---|---|---|
| 6 | **`decision_mode` 默认 `auto`** ——marker 未写 `decision_mode=` 时按 `auto` 解析，要 `consult` 必须显式声明；规划 agent 的计划模板默认写 `decision_mode=auto` | `design/01` §4 marker 规范、§1.3 决策模式行、§3.5 lint 映射表、§4.5.1；HC-RL-A18 与 HC-RL-A90 的验证描述同步。B 草案 RLT_14 验收口径改为「默认 auto 与显式 consult 两路都实跑」 |
| 7 | **`watch` 接着做，正式排第 5 批** ——RLT_18 不再标「可延后 / 待用户决定」，前四批完成后直接开工 | B 草案索引备注、RLT_18 卡、§4 批次表、§8.3、§9 完工清单去掉「可延后 / 用户决定」字样；**正式输入同步改口径**——§1.4 由「P2」改为「第 5 批必做」、§3 由「第四个 watch 是 P2 可选组件」改为「排在开发方案第 5 批」、§3.6 标题去掉「P2」、§13 由「首版不做 watch」改为「前四批不做，第 5 批必做、前四批不依赖」。全文与 B 草案的 `P2` 字样计数均归零 |

第 6 条牵动一处既有契约：原 HC-RL-A18 要求 marker 必须含 `decision_mode=`，与「可省且默认 auto」直接冲突。裁决为**以用户新决策为准**——`decision_mode=` 从必需字段降为可选字段，marker 其余四个字段（`skill=` / `session=` / `recipe=` / `cards=`）仍然必需。HC-RL-A18 只改验证描述，**编号与验收语义边界不变**。

<a id="understanding-rlt-a02"></a>
<!-- dh:planning-evidence:v1 event=RLT-A-02 artifact=design/01-RelayLight-产品设计与验收.md kind=understanding -->

### 理解与确认状态

**状态：用户已于 2026-09-09 明文确认**，与 B 开发方案（`RLT-B-01`）同批生效；正式输入头部已改标「已确认 2026-09-09」。开发方案 §7 的对应条目改写为「已由 A′ 增补澄清」。B 事件的完整审核与确认记录见 [`02-交叉审核记录-RelayLight-B拆计划.md`](./02-交叉审核记录-RelayLight-B拆计划.md)。
