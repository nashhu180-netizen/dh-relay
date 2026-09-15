<!-- 01-RelayLight-产品设计与验收.md — relay-light 模块的正式设计输入；planning-event 与审核回链写在本文，不写在 README。 -->

# RelayLight 产品设计与验收（**正式设计输入 · 更新至 2026-09-13**）

<!-- dh:topic tier=标准 review=RelayLight运行中改计划 -->
<!-- dh:planning-event:v1 id=RLT-A-06 stage=A-full artifact=design/01-RelayLight-产品设计与验收.md review=evidence/07-交叉审核记录-RLT05合同缺口候选.md#review-rlt-a06 understanding=evidence/07-交叉审核记录-RLT05合同缺口候选.md#understanding-rlt-a06 -->
<!-- dh:planning-event:v1 id=RLT-A-07 stage=A-adjust artifact=design/01-RelayLight-产品设计与验收.md review=evidence/08-交叉审核记录-RLT09-oracle澄清.md#review-rlt-a07 understanding=evidence/08-交叉审核记录-RLT09-oracle澄清.md#understanding-rlt-a07 -->

> **历史规划事件索引（A-full；非活动声明，仅作追溯）**——旧事件的原始可解析 `planning-event` 声明注释已按 `RLT-A-06` 事件转为本索引；出处、含义与证据路径保持原值，未删除、未改写，Git 历史中仍可还原。**活动声明为上面的 `RLT-A-06` 与本次最小澄清 `RLT-A-07`；DevPlan 活动事件仍是 `RLT-B-06`。**
>
> | 事件 | stage | 证据（交叉审核记录） | 处理 |
> |---|---|---|---|
> | `RLT-A-02` | A-full | `evidence/01-交叉审核记录-RelayLight运行中改计划.md#review-rlt-a02` / `#understanding-rlt-a02` | 转历史索引 |
> | `RLT-A-03` | A-full | `evidence/03-交叉审核记录-RelayLight仓内skill单源.md#review-rlt-a03` / `#understanding-rlt-a03` | 转历史索引 |
> | `RLT-A-04` | A-full | `evidence/05-交叉审核记录-RLT03与RLT05验收边界.md#review-rlt-a04` / `#understanding-rlt-a04` | 转历史索引 |
> | `RLT-A-05` | A-full | `evidence/06-交叉审核记录-RLT03阶段合同补充.md#review-rlt-a05` / `#understanding-rlt-a05` | 转历史索引 |
>
> 八条 A/B 旧事件（含 DevPlan 侧 `RLT-B-01`~`RLT-B-04`）的完整字段、替换缘由与确认来源见 [`design/evidence/06-交叉审核记录-RLT03阶段合同补充.md`](evidence/06-交叉审核记录-RLT03阶段合同补充.md)与本轮 `evidence/07`。

> **RLT-A-10 最小澄清 2026-09-15（用户已裁决）**——RLT_21 施工时发现 `HC-RL-A143` 的 oracle 期望值与本条自己冻结的分级规则不可兼得：按冻结四类逐条计级，预演 `review.plan.md` 两轮 P1 的诚实复算结果是 **3 P1 + 2 P2**，而原写的 1 P1 + 4 P2 只有额外引入未冻结的「同根去重 / 残留折级」口径才能达到。用户 2026-09-15 在两个出口中裁决取**修订 oracle 期望值**（而非补一套去重/折级规则），故本次**只改 A143 的「怎么验」列期望数字并写明计级口径**；A143 的命题列一字不改。**验收 ID 未新增、未删除、未改号**，活动总账仍为 140（AI 125 + 人验 15）。证据与逐条计级明细见 [`workspace/RLT_21/findings.md`](../workspace/RLT_21/findings.md) 的 F-009。**本行只记 oracle 澄清，不代表 D-start、不代表验收、不代表 verify。**

> **RLT-A-09 修订 2026-09-15（用户已裁决六项开放项）**——复核触发条件由终态 `done` 改为**非终态「待复核」信号**：复用 `checkpoint` 事件 + 类型化 token（`ready_for_review=` / `reviewed=` / `ready_seq=`），trigger 词表扩集新增 `on:review_ready:<名字>`；判定角色闭集 `{plan-reviewer, checker, reviewer}`，适用范围 = 送审方与判定方同处一个节点的 **W / C / X**，**R 阶段不适用、R 模板一字不改**。新增 HC-RL-A144～A150，修订 A35 / A65 / A71 / A107；**A2 / A62 / A95 / A102 一字不改**，A49 / A60 / A70 不豁免、不削弱、不改号。活动总账 133→140。用户 2026-09-15 对候选稿六项开放项的逐条裁决、三轮复核结论与晋级范围见 [`evidence/10-交叉审核记录-RLT-A09-复核触发信号.md`](evidence/10-交叉审核记录-RLT-A09-复核触发信号.md)。**本行只记设计晋级，不代表 D-start、不代表验收、不代表 verify。**

> **RLT-A-07 最小澄清 2026-09-13（用户已确认）**——RLT_09 W 审核发现 A122 的三类白名单与“失败时写方案文件”冲突，以及 A121 “仅追加节点行”与 A75 的合法计划要求冲突。用户选择：A122 保留三类闭集，拒绝时计划目标与输入方案文件均零变化，原因写入 `planner-amend done.note`，monitor 再记 `stage_result outcome=blocked`；A121 澄清为两次 status 之间只修改同一计划文件，追加新阶段节点行及保持计划合法所必需的对应 agent 行，不改代码、不改账本。**验收 ID 未新增、未删除、未改号。**完整记录见 [`evidence/08-交叉审核记录-RLT09-oracle澄清.md`](evidence/08-交叉审核记录-RLT09-oracle澄清.md)。

> **RLT-A-06 修订 2026-09-11（用户已确认）**——A117 转 RLT_07；A91/A108 退役并拆为 A131～A134；新增 A135/A136 分别约束 relay-log 配置目录与 adapter 显式传参；H2 退役、H18 续发；补齐 A97 lint 映射。活动总账 122→126。完整复核、理解校验与整版确认见 [`evidence/07-交叉审核记录-RLT05合同缺口候选.md`](evidence/07-交叉审核记录-RLT05合同缺口候选.md)。

> **GitHub 关联**：RLT-A-06 / RLT-B-06 / RLT_05 共用 [Issue #8](https://github.com/nashhu180-netizen/dh-relay/issues/8)。

> **RLT-A-04 修订 2026-09-10（用户已确认）**——校正 RLT_03/RLT_05/RLT_07 的验收边界：A18/A62/A73/A92 保号，A64/A86/A88/A90 退役并由 A126～A130、A62/A73/A92 原子承接；`status.plan` 补 `decision_mode`，superseded 不再伪造节点状态。活动总账 121→122。

> **RLT-A-03 增补 2026-09-10（用户已确认）**——skill 五文件改为 `tools/relay-light/skill/` 仓内单源，两个用户级目录为全量同步的派生副本；新增 HC-RL-A124/A125，总账 119→121。首版同步失败后排除原因并整套重跑，不引入发布事务或历史 manifest。

> **A′ 增补 2026-09-09：B 审核回流四处契约澄清（已确认 2026-09-09）**——§6.2 Recipe 冲突消解、§3.5 `status --json` 字段冻结、§3.4 strategist 账本链、§6.2.1 配置解析优先级，另含 §4.5.2 新增卡路径授权收窄、§4 `decision_mode` 默认 `auto`。**验收 ID 一条未增未删未改号。**
>
> **本文是 relay-light 模块的正式设计输入**，已经用户整版确认。整版确认不等于授权施工：B 拆计划、D 开工仍按 dev-harness 各自的门走。
> 冻结来源：2026-09-08 至 09-09 用户与主控的产品讨论 + 六轮 fresh 复核裁决 + 一轮结构性调整 + **2026-09-09 补充：运行中改计划流程（§4.5）**。**已无遗留待决策项**（见 §8）。候选稿见 `drafts/`，审核证据见 `evidence/`。

## 0. 阅读约定与模块身份

### 0.1 两个「workspace」分开叫

全文严格区分，不混用：

| 术语 | 指什么 |
|---|---|
| **终端空间** | Herdr workspace。`herdr workspace create` 出来的那个东西，里面是 pane |
| **任务工作区** | dev-harness 的 `workspace/<卡号>/` 目录，里面是 brief / task_plan / progress 等七件套 |

### 0.2 核心术语

- **计划**：一份 `relay_plan.md`。**可跨多张任务卡**。
- **阶段实例**：一个**终端空间** + 一个**监工**。标识 `stage_id = <card>:<stage>#<k>`，`k` 是该卡该阶段**第几次进入**（`R#2` = 返工后再复核）。阶段内含 1..N 个节点。
- **节点**：阶段内不可跨越的一个步骤，有唯一编号和固定的关闭判据（§5.3）。节点**顺序执行**。
- **agent**：受当班监工管理的一个执行实例，账本身份 `<名字>#<attempt>`。**做完即关 pane，返工开新**。
- **账本**：`relay_log.jsonl`，只追加的事件流。**只记录，不驱动**。

### 0.3 模块身份

relay-light 是本仓**独立模块**，slug `relay-light`；文档 `docs/modules/relay-light/`，代码 `tools/relay-light/`，**verify scope = `relay-light`**（英文，中文 scope 会让 grep 闸门失效）。现役 dh-relay 的 Runner / Ticket / Receipt 体系**冻结在 P6 现状，不删不迁**。AGENTS.md 里「本仓只有一个模块」与 `dh` 自动选中模块的描述**需同步改**（§14）。

**计划与账本的落点**：`docs/modules/<模块>/relay/<plan_id>/`，**不放在某张卡的任务工作区里**——因为一份计划可跨多张卡。

## 1. 人话版目标

### 1.1 我们在做什么

把「派活 + 干活 + 复核 + 收口」这套已经在日常用的手动接力，收缩成 **一份 skill + 一份文本计划 + 一个只记录不驱动的账本程序**。多 agent 怎么协作**全部由 skill 里的配置表决定**——改协作方式 = 改配置与模板，不改代码。

起因：dh-relay 现役方案过重——82 张卡、15 份设计输入、约 4000 行代码，走到 P6 而真正跑单卡流水的 P7 未开工。用户日常真正在用的是手动派活，靠 AGENTS.md worker 铁律和任务工作区文件交接，一次都没依赖 Runner。relay-light 承认这个事实并把它固化。

### 1.2 关键决策（动这些要重新讨论）

| 决策 | 一句理由 |
|---|---|
| 程序只记录不驱动 | 驱动逻辑进代码，改协作方式就得改代码。 |
| 协作方式在配置与模板里 | 角色、模型、路数、复核轮数是产品参数，放文本才改得动。 |
| **三层执行结构：编排 → 监工 → agent** | 拉取顺序固定，谁也不越级；编排管阶段，监工管节点，agent 干活。 |
| **监工按阶段独立，不是全程一个** | 一个阶段一个终端空间一个监工，阶段结束一起关，上下文不累积。 |
| **规划产出计划后自行关闭** | 规划是一次性的高档模型开销，不该常驻。 |
| 关闭判据全局固定，不由节点自定义 | 判据固定成双条件合取，`status` 才能机械判断。 |
| 信号只来自 Herdr agent 状态 | 文件只承载内容；「完了没有」由 `herdr agent wait` 给。 |
| **任一时刻单写者** | 编排只在阶段之间写、监工只在自己阶段内写，时间上不重叠，无需锁。 |
| **与 dev-harness 的对应关系放独立映射配置** | dev-harness 改了只改配置和模板，不动 `relay_log.py`。 |
| **运行中可改计划，但只追加不原地改** | 现场发现计划不对时不必停摆；改动范围锁死在任务卡、开发方案、接力计划三样，设计方案与验收清单永远交用户（§4.5）。 |
| 不做物理拦截，也不做身份校验 | 放弃 receipt 身份链；`by` 字段可伪造是**设计选择**，见 §8.2。 |

### 1.3 核心决策清单（改动牵动 ≥3 个文件/模块/人）

| 决策点 | 选了什么 | 备选与取舍 | 不可逆程度 |
|---|---|---|---|
| 执行结构 | 编排（常驻整个计划）→ 每阶段监工 → agent | 单监工全程在场（上下文累积、阶段边界糊） | 高 |
| 计划粒度 | 一份计划可跨多张任务卡；落点 `docs/modules/<模块>/relay/<plan_id>/` | 一卡一计划放卡的任务工作区（跨卡编排做不了） | 高 |
| 节点表列 | `node`｜`card`｜`stage`｜`type`｜`close`｜`depends_on`｜`note` | 无 card/stage 列（跨卡与阶段边界无处表达） | 高 |
| 账本行结构 | 固定七字段 `seq`/`ts`/`node`/`event`/`agent`/`by`/`note`（§3.2） | 自由 note（机器配对不了） | 高 |
| 事件词表 | 19 个，分控制事件与 agent 事件两类，白名单 fail closed | 自由字符串 | 中 |
| 三层词表分离 | Herdr 状态层 / 账本事件层 / 节点状态层各自独立 | 混成一张（`done` 同时指两件事） | 高 |
| 并发协议 | 任一时刻单写者 + `open(mode='a')` 纯追加，不做临时文件替换、不加锁 | 加锁（对时间上不重叠的两个写者是多余复杂度） | 中 |
| 角色模型配置 | 独立 `roles.toml`，流程不写死模型 | 模型写进模板（换模型要改多处） | 中 |
| dev-harness 映射 | 独立 `dh-mapping.toml`，承载阶段↔dh 节点、三档 reviewer、复核轮数上限、止损规则 | 映射硬编码进流程文档（dh 一改就全篇返工） | 高 |
| 复核返工轮数上限 | 读映射配置，**当前值 2**；超限停 → strategist → 用户 | 写死 3（与 dev-harness 止损脱钩） | 低 |
| 决策模式 | marker 的 `decision_mode=auto / consult`，**默认 `auto`（未写即 auto，consult 须显式声明）**，只管 decider；strategist **永远交用户** | 默认 consult（每次阻塞都打断人）／一刀切（要么全自动风险大，要么全问烦） | 中 |
| 运行中改计划 | planner 改计划实例可直接改开发方案任务行与任务卡，**绕过 dev-harness「改开发方案须 B-adjust 用户确认」**（§4.5） | 每次改计划都交用户（范围内的小改也要打断人）／完全禁改（计划一处不对就整体重来） | 中 |
| attempt 计数 | 按 `(node, agent 名)` 计，每节点从 1 起、跨节点不累计，上限 3 每节点独立 | 全卡累计（返工节点白吃预算） | 中 |
| 账本程序运行时 | **Python 3 单文件**，落点 `tools/relay-light/relay_log.py`，仅标准库 | pwsh 7（Linux 侧要额外装） | 高 |
| 配置文件格式 | TOML，用标准库 `tomllib`（Python ≥3.11） | JSON（无注释，配置表可读性差） | 低 |
| 字符串比较大小写 | 显式区分大小写，枚举集合精确匹配，不做 `.lower()` 归一（同源教训库候选-5） | 大小写不敏感 | 低但必须一开始就对 |

### 1.4 范围与分期

- **首版交付**：`relay_log.py`（`add` / `status` / `lint`）+ skill 三件 + 两份配置 + 五种阶段模板 + Windows 两个主控组合实跑。
- **第 5 批**：`watch` 组件（设计已冻结见 §3.6；**必做**，前四批不依赖它、可先验收）。
- **人验后置**：Linux 两个组合由用户在 ThinkPad 上跑。验收矩阵 = Windows/Linux × Claude Code 主控/Codex 主控，共 4 个组合。
- **环境实测**：Herdr 0.8.0 自管 PTY、不依赖 tmux；Windows Python **3.14.0**、Linux Python **3.12**，两侧均 ≥3.11，**`tomllib` 可用**——原「Windows 版本待确认」的探测项**已由实测答复**，JSON 退路作为不启用的兜底保留。

## 2. 角色层

十一个角色。**模型档全部写在 `roles.toml`**，本节只写职责与拉取关系，不写死模型。

| 角色 | 默认档 | 谁拉起 | 生命周期 | 只做这些事 |
|---|---|---|---|---|
| **规划** planner | 高档 | 人；**改计划实例由当班监工拉起** | 一次性，产出计划后**自行关闭**；**监工可按需再拉起作为「改计划实例」**（`planner-amend#<n>`，§4.5） | 读任务卡、`dh-mapping.toml`，**定档**（见下），生成 `relay_plan.md`。**不参与运行**；改计划实例只按 §4.5 白名单改文件后关闭 |
| **编排** orchestrator | 低档（可配） | 人 | **常驻整个计划**，独占一个终端空间 | 只三件事，见下 |
| **监工** monitor | 低档（可配） | 编排 | **按阶段独立**，阶段结束随终端空间关闭 | 派本阶段所有 agent、盯人、路由、升级、**写节点与 agent 事件** |
| **builder** | 低档 | 监工 | 单节点 | W 阶段建任务工作区七件套与 `task_plan` |
| **plan-reviewer** | 高档 | 监工 | 单节点 | W 阶段审 `task_plan` |
| **coder** | 高档 | 监工 | **批内持续在场**，本批 checker 通过后才收工 | 写代码、提交；自己在 `findings.md` / `lesson_candidates.md` 追加一两行；每轮写完在 pane 打四行小结 |
| **scribe** | 低档 | 监工 | 单节点 | 只写 `progress.md`；R/F 阶段还跑脚本与汇总（§6） |
| **checker** 方向评估 | 高档 | 监工 | **批内持续在场**，与 coder 同生共死 | 核对本批是否偏离 `task_plan`，偏离则写解决方案交监工；通过才收工。**不做复核** |
| **decider** 决策 | 高档（可配） | 监工 | 按需 | 施工 `blocked` 时拉起，产出可落地方案；**可在 `decision.<n>.md` 里提出「需要改计划」并写明改动内容**（§4.5），自己不改任何文件 |
| **reviewer** | 按档位 | 监工 | 单路 | R 阶段各路复核，路数由 Recipe 决定 |
| **strategist** 全局决策 | 高档 | 监工 | 按需 | 复核返工到轮数上限仍不过时拉起；**可在方案文件里提出「需要改计划」并写明改动内容**（§4.5），自己不改任何文件 |

### 2.1 编排只做三件事

1. **重读计划、为阶段建终端空间并拉监工**——每次开阶段前先跑 `status` 重读 `relay_plan.md`（忽略 superseded 行）确定本阶段是哪一个，再 `herdr workspace create` + 拉起 monitor。
2. **等监工**——用 `watch` 推送，**编排层也用 watch，不前台刷**。
3. **读监工写的最新 `stage_result`，按 `outcome` 机械分路**（不做判断，见下表）；`done` / `cancelled` 时**先写 `stage_close`、再关终端空间**，然后**回到第 1 件重读计划**，由计划推导下一阶段。

**编排不做判断题。** 监工在阶段结束前必须写一条 `stage_result`，编排只查表：

| `outcome` | 编排怎么做 |
|---|---|
| `done` | 写 `stage_close` → 关终端空间 → 进下一阶段 |
| `cancelled` | 同 `done` 的动作（用户已裁决放弃本阶段）：写 `stage_close` → 关终端空间 → 进下一阶段 |
| `blocked` | **通知用户，等待**。不自行重试、不进下一阶段。用户裁决后：继续 → 监工在**同一阶段实例内**接着干、最终补写 `outcome=done`；放弃 → 监工写 `outcome=cancelled`（`note` 引用该 `user_decision`），编排再 `stage_close` |
| `failed` | **重拉监工一次**（写 `monitor_launch`）；再次 `failed` → **通知用户** |

这样「该重拉还是该推进」不再依赖编排的模型能力，只依赖监工写下的一个枚举值。

**编排不缓存计划。** 计划在运行中可能被改（§4.5），所以编排**每次开阶段前都重读 `relay_plan.md`**——用 `status` 的输出，忽略 superseded 行——**下一阶段从计划推导，不背 `W→C→R→F` 的固定顺序**。

**编排不监听 `plan_amend`。** 改计划的信息**只经本阶段 `stage_result.note` 的 `amend=` 摘要到达编排**（§5.2.1），编排据此在**开下一阶段前**重读计划。编排照旧只等 `stage_result`，中途不因计划被改而动作。

**编排不直接拉施工或复核 agent。** 拉取顺序固定：**编排拉监工，监工拉其余**。改计划实例也由**当班监工**拉起，不由编排拉（§4.5）。

### 2.2 checker 与 decider 与 strategist 的分界

| 角色 | 什么时候上 | 输入 | 输出 | 谁裁决 |
|---|---|---|---|---|
| **checker** | 施工**每轮写完后**（例行，批内可多轮） | 本轮 diff + `task_plan` | 偏离判断；偏离则给解决方案 | 监工用 `herdr agent prompt` 把方案**送回同一个 coder** 修 |
| **decider** | 施工 **`blocked`** 时（异常） | 阻塞现场 | `decision.<n>.md` 可落地方案 | 看 `decision_mode`：`auto` 监工直接把方案**送回同一个 coder**；`consult` 监工**先问用户**，用户同意后同样送回同一个 coder |
| **strategist** | 复核**返工到轮数上限仍不过** | brief、task_plan、**全部 review**、账本 | 全局方案，或**建议停卡** | **永远交用户裁决**，不受 `decision_mode` 影响 |

三者都不做复核，也都不写账本，**也不改任何文件**——decider 与 strategist 只在自己的方案文件里写「需要改计划」及改动内容，真正落笔改文件由 planner 的**改计划实例**执行（§4.5）。

**checker 按节点可选**：C 阶段每个批次节点的 checker 行**由规划决定挂不挂**，模板默认挂，规划可以删行。它与 R 阶段需求复核的职责重叠是**有意的**——checker 是**早期纠偏**（本批还没写完就拦），需求复核是**终局复核**（全部写完后按验收清单核）。两者时机、输入和代价都不同，重叠换来的是「跑偏不拖到复核才发现」。

**批内不换人**：checker 与 decider 给出的方案都**送回同一个 coder**，走 `herdr agent prompt`，账本记 `checkpoint`（`note` 写 checker 轮次或决策文件名），**不新增 attempt**。**只有节点级返工**（复核阶段打回，走 X 阶段新节点）才开新实例、attempt 才 +1。

### 2.2.1 Recipe 档位的唯一来源

**档位（`heavy` / `normal` / `light`）只有一个来源：DevPlan 任务卡的 `任务类型` 字段。**

- 字段存在 → 直接采用，写进 marker 的 `recipe=<档>`。
- **字段缺失（legacy 卡）→ 规划必须在 prompt 里由用户指定，不得自行默认。** 没拿到就停下问，不许猜。

marker 的 `recipe=` 是 lint 的校验依据：**R 阶段实际挂的 reviewer 集合必须与该档在 `dh-mapping.toml` 里的集合一致**，不一致即报错。这条把「档位」从一句口头约定变成机器可查的东西。

### 2.3 `roles.toml`

skill 内独立文件，键是角色名，值是模型与发起方式。**完整样例见 §6.3。流程文档与模板不写死模型**，一律引用角色名。

## 3. 账本程序 relay-log

**运行时 = Python 3 单文件**，落点 `tools/relay-light/relay_log.py`，只用标准库。前四批交付三个子命令 `add` / `status` / `lint`；第四个 `watch` 排在开发方案第 5 批，设计已冻结（§3.6）。

### 3.1 命令签名与退出码

```text
relay_log.py add    --plan <dir> --node <n> --event <e> --agent <a> [--note <text>] [--config-dir <dir>]
relay_log.py status --plan <dir> [--json] [--config-dir <dir>]
relay_log.py lint   --plan <dir> [--json] [--config-dir <dir>]
```

`--plan` 指向 `docs/modules/<模块>/relay/<plan_id>/`。

| 命令 | 退出码 |
|---|---|
| `add` | `0` 成功；`2` 参数、词表或时序不合法；`3` relay_plan 缺失/解析失败，配置目录无法判定，或选中配置缺失、不可读、解析失败；`4` 写入失败 |
| `status` | `0` 正常；`3` relay_plan 缺失/解析失败，配置目录无法判定，或选中配置缺失、不可读、解析失败；`4` 账本读取或解析失败 |
| `lint` | `0` 通过；`2` 规则违反；`3` relay_plan 缺失/解析失败，配置目录无法判定，或选中配置缺失、不可读、解析失败 |

**命令边界（A5 勘误，2026-09-10 用户确认裁决）**：**解析级**失败——relay_plan 缺文件、缺 marker、缺表头或表结构不合法等——`add` / `status` / `lint` **三个子命令一律退出 `3`** 并给可读原因；计划**已解析成功但违反 lint 规则**时，**`lint` 退出 `2`**（stderr `lint: <规则编号> <message>`），而 `add` / `status` 因该计划不可用**仍退出 `3`**（stderr `error: <code> <message>`），不得把「规则违反为 2」泛化成三命令都退 `2`。**节点号重复（含已 superseded 的号）由 A46 的负例证明**，不作为 A5 的解析失败示例。`add` 自身对 node / agent / event / 时序的入参校验（§3.5、A59）与上述分流不同层，仍照旧退出 `2`。

`status` 输出：当前阶段、当前节点、节点状态、在场 agent 与各自最近事件时间、**可关闭判定与不可关原因**。**`status` 不判产出是否合格，只判账本完整性**——措辞只转述账本事实，形如「节点 C2 不可关：coder#1 无终态事件」。

### 3.2 账本行结构（固定七字段）

| 字段 | 内容 |
|---|---|
| `seq` | 序号 = 读文件行数 + 1，由当班单写者保证连续 |
| `ts` | ISO 8601 本地时区**带偏移** |
| `node` | 节点号；阶段级控制事件填该阶段**第一个节点号** |
| `event` | 账本事件层词表之一 |
| `agent` | `<名字>#<attempt>`；编排用 `orchestrator#<n>`，监工用 `monitor#<n>` |
| `by` | 写入者：`orchestrator` 或 `monitor` |
| `note` | 自由文本 |

**终态事件与 `agent_launch` 的配对键是 `(node, agent)`**。

**attempt 的定义（写死）**：**同一节点实例内、同一 agent 名的 `agent_launch` 次数**。它**只在该 agent 于本节点 `agent_lost` / `cancelled` / 所属阶段 `failed` 之后被重拉时 +1**，上限 3。

- **批内 `checkpoint` 往返不增**（checker 送方案、decider 送方案都不增）。
- **节点级返工是新的节点实例**，attempt 从 1 起。

这是**有意的分工**：**attempt 抓「实例挂了重拉」**，**X 轮数抓「复核打回」**，两者量的是不同的东西，所以独立计数、不叠加（§7.3）。

### 3.3 三层词表（分开写，不许混用同名概念）

| 层 | 取值 | 谁产生 |
|---|---|---|
| **Herdr 状态层** | `working` / `idle` / `done` / `blocked` / `unknown` | `herdr agent wait` 返回 |
| **账本事件层** | 19 个，见下 | 编排与监工 |
| **节点状态层** | `pending` / `ready` / `open` / `closed` | `status` 派生，不落盘；superseded 只是计划行废弃标记，不是状态值 |

**两个 `done` 不是一回事**：Herdr 的 `done` 只代表 agent 停下，**只触发监工去读产出**；账本的 `done` 是**监工读完产出后的判断**，`note` 里列产出文件。

### 3.4 事件分两类，只有一类走状态机

**控制事件**（`agent` 字段为 `orchestrator#<n>` 或 `monitor#<n>`，**不进状态机**）：

| 事件 | 写入者 | 时序规则 |
|---|---|---|
| `plan_loaded` | 编排 | 必须是**第 1 行且仅一次**；`node` 填第一个非 superseded 节点号；`note` 必须含 **`config_dir=<实际使用的配置目录>`** 与 **`plan=<计划目录路径>`**（§6.2.1），其余内容自由 |
| `stage_start` | 编排 | 每**阶段实例**仅一次，且在该实例任何 `monitor_launch` 之前；`note` 带 `stage_id=` |
| `monitor_launch` | 编排 | 每阶段实例至少一次（重拉监工可多次），必须在本实例 `stage_start` 之后；`note` 带 `stage_id=` |
| `node_start` | 监工 | 每节点仅一次；在该节点任何 `agent_launch` 之前；`depends_on` 未全 `closed` 时退出 `2` |
| `node_close` | 监工 | 仅在双判据成立时接受，每节点一次 |
| `stage_result` | 监工 | 每阶段实例**可多次**（`blocked` 后用户裁决要续写终局）；`note` 必须含 `stage_id=` 与 `outcome=done / blocked / failed / cancelled` 及原因。**`outcome ∈ {done, cancelled}` 要求本实例全部节点已 `closed`；`outcome ∈ {blocked, failed}` 允许节点未关**，但 `note` 必须以 `ref=<agent>#<n>:<事件>` 引用本实例内一条未终局的 `blocked` 或一条 `agent_lost`（RLT-A-08）。**`status` 只认该实例最新一条** |
| `stage_close` | 编排 | 每**阶段实例**一次，前置是**该实例最新 `stage_result` 的 `outcome ∈ {done, cancelled}`**，否则退出 `2` |
| `monitor_restart` | 监工 | 任意位置，不限次 |
| `plan_amend` | 监工 | 运行中改计划完成后写（§4.5），任意位置、不限次，**不进状态机**；`agent` 必须是 `monitor#<n>`；`note` 写方案文件名 + 新节点号列表，形如 `decision.2.md nodes=C3,C4` |

**agent 事件**（`agent_launch`、`checkpoint`、`blocked`、`escalate`、`decision`、`user_decision`、`resume`、`done`、`agent_lost`、`cancelled`）走 `(node, agent)` 状态机：

```text
agent_launch → checkpoint* → ( blocked → escalate → decision → [user_decision] → resume )* → (done | agent_lost | cancelled)
```

**终态后同一 `(node, agent)` 不得再有任何事件。** `escalate` / `decision` / `user_decision` **记在被阻塞的那个 agent 名下**，决策 agent 的标识写进 `note`。

**决策链有两条，顺序都固定。**

**一、decider 链**（施工 `blocked` 触发）：`blocked` → `escalate` → `decision` → `resume`。`user_decision` **按 `decision_mode` 决定有没有**，位置固定在 `decision` 与 `resume` 之间：`auto` 模式**没有** `user_decision`，出现即退出 `2`；`consult` 模式缺 `user_decision` 就写 `resume` 退出 `2`。

**二、strategist 链**（返工轮数或 attempt 达上限触发，§7.3）：

- **触发者是监工**，不是某个 agent 主动 `blocked`。
- **事件归属分两类**（与 §9.2 的 decider 写法一致）：
  - **决策类事件** `escalate` / `decision` / `user_decision` / `resume` / `cancelled` 记在**触发时最后一个 X 阶段 coder** 名下，strategist 的标识写进 `note`；
  - **生命周期事件** `agent_launch` / `done` 记在 **`strategist#<n>` 自己名下**。
- 顺序固定：

```text
escalate      <coder>         note=strategist=strategist#<n> 原因=rework 超限 或 attempt 超限
agent_launch  strategist#<n>   ← 生命周期事件，记在 strategist 自己名下
decision      <coder>          note=strategist=strategist#<n> <strategist 方案文件>
done          strategist#<n>   ← 生命周期事件，记在 strategist 自己名下
user_decision <coder>          ← 永远出现，不看 decision_mode
  ├─ 用户选继续 → resume    <coder>   note 引用该 user_decision
  └─ 用户选停卡 → cancelled <coder>   note 引用该 user_decision
```

- **`user_decision` 在这条链上永远出现**，`decision_mode=auto` 也一样；缺它就写 `resume` 或 `cancelled` 一律退出 `2`。
- 这条链**没有 `blocked` 起头**——`escalate` 直接作为链首被接受，因为触发信号来自监工的计数而非 agent 自报阻塞。
- 终局二选一：`resume`（继续，该 coder 仍是同一实例、不新增 attempt）或 `cancelled`（停卡，该 coder 终态封口）。

一句话区分：**decider 链按 `decision_mode` 决定要不要问用户；strategist 链永远有 `user_decision`。**

**`user_decision` 的 `note` 写法约定**：方案里含「需要改计划」时（§4.5），用户同意写 `approve-amend: <理由或补充>`，用户否决写 `reject-amend: <用户的替代指示>`。否决时监工不拉改计划实例、不重拉 decider，直接把替代指示送回同一个 coder 并写 `resume`，账本上不出现 `plan_amend`。方案不含改计划时 `note` 自由文本，不用这两个前缀。

**`checkpoint` 是批内往返的唯一载体**：checker 给方案、coder 按方案修、decider 方案送回后继续，全部记 `checkpoint`，`note` 写轮次或决策文件名。`checkpoint` **可重复任意次，不新增 attempt、不新增 `agent_launch`**。attempt 只在**节点级返工**（X 阶段新节点）时从该节点的 1 重新起算。

**「待复核」信号与三个 token**（RLT-A-09）：送审方与判定方同处一个节点时（W / C / X），送审方**不再靠先记 `done`** 来触发判定方，而是写一条**非终态**的 `checkpoint`，`note` 带 `ready_for_review=<判定方 agent 名>`；判定方在 `done` 的 `note` 里带 `reviewed=<送审方实例全名>` 与 `ready_seq=<该信号的 seq>`，回指自己答的是哪一轮。**账本事件层词表不变**——仍是那 19 个词，信号落在 `checkpoint` 现有的合法迁移里，agent 事件状态机的迁移表一行不改，终态封口一字不改。**判定角色闭集 = `{plan-reviewer, checker, reviewer}`**：`roles.toml` 十一个角色里只有这三个产出 PASS / FAIL 结论并可能打回；`scribe` 是收敛者，`decider` / `strategist` 是决策者，都不判定，均不在集内；集合随 `roles.toml` 变化由未来 A 事件同步，不由施工者临场扩充。**一条信号只对一个判定方，N 路就写 N 条 `checkpoint`**。这三个 token **不是**上面决策链的 helper token（`decider=` / `strategist=`），不参与决策归属校验。**R 阶段不适用**——R 节点没有同节点送审方（见 §5.2）。写入与配对的合同见 §3.5，验收见 HC-RL-A144 / A145 / A146。

### 3.5 账本合同（实现细节，冻结）

**attempt 分配**：`--agent` 传**完整** `<名字>#<attempt>`，由监工分配 = 该 `(node, 名字)` 已有最大 attempt + 1。`add` 校验 `agent_launch` 的 attempt **必须恰好等于最大值 + 1**，否则退出 `2`。

**`add` 入参校验**（任一违反退出 `2`）：

- `node` 必须在节点表中且**非 superseded**；
- `agent` 名（去掉 `#attempt`）必须在**该节点**的 agent 表中；豁免成员**并列四名**：`orchestrator#<n>`、`monitor#<n>`、**`planner-amend#<n>`** 与 **`strategist#<n>`**（后两者都由监工**按需**拉起、不按节点预挂进 agent 表，见 §4.5.2 与 §3.4 的 strategist 链）。**豁免的仅是本条「agent 名在该节点 agent 表中」**——`node` 活跃且非 superseded、`event` 在词表、控制事件写者一致、agent 状态机与终态封口、attempt 分配、各 trigger / 依赖 / `node_start` 前置闸**一律照常校验**（A59）；
- `event` 必须在词表中；
- **控制事件的 `by` 必须与该事件的法定写入者一致**（§3.4 表），越权退出 `2`；
- `trigger` 为 `on:done:<X>` 的 agent，写 `agent_launch` 时 **X 在本节点必须已有 `done`**（`agent_lost` / `cancelled` 不算）；
- `trigger` 为 `on:blocked` 的 agent，写 `agent_launch` 时**本节点必须存在一个 agent 其最新事件为 `blocked` 或 `escalate` 且尚未 `resume`**；
- `trigger` 为 `on:review_ready:<X>` 的 agent（RLT-A-09），写 `agent_launch` 时**本节点必须存在一条 `checkpoint`**——其 `agent` 为 `X` 在本节点的**当前实例** `X#<a>`（该名下最大 attempt），其 `note` 的 `ready_for_review=` 值**恰等于本 agent 名**，且该 `checkpoint` 是 `X#<a>` 这个**实例的最新 agent 事件**（按实例判，不按名字跨 attempt 判）；由此 `X#<a>` 必未终态。任一不成立退出 `2`（A144）。**`on:done:<X>` 的前置一条不改**，两种 trigger 各判各的；
- `checkpoint` 的 `note` 含 `ready_for_review=` 时（RLT-A-09）：该前缀的 token **恰好一个**（≥2 退出 `2`——note 解析对重名 key 只保留首个，多写会静默丢失，必须写入时拒绝）；值指向的 agent 须在**本节点** agent 表中且其 `role` 在判定角色闭集内；写入者自身**不得**是判定角色；该 `checkpoint` **不伴随 `agent_launch`、不增 attempt**。`add` 层**不设轮次硬上限**（上限由 §7.3 的第三套计数以只读投影承担）（A145）；
- **判定角色写 `done` 的配对闸**（RLT-A-09）：**当且仅当本节点存在至少一条指向该 agent 的 `ready_for_review=` 信号时生效**。生效时 `note` 须含 `reviewed=<S>#<a>` 与 `ready_seq=<n>`；`<n>` 指向的事件须是一条 `checkpoint`，其 `agent` 字段**逐字等于** `<S>#<a>`、其 `ready_for_review=` 值等于本 agent 名，且是 `(node, <S>#<a>, 本 agent)` 组合下**最新**的一条信号；`<S>#<a>` 须在本节点**已 `done`** 且其 `seq` **早于**本条。任一不成立退出 `2`（A146）。**校验位点在写 `done` 当场，不在 `node_close` 兜底**；本节点没有任何指向它的信号时**闸不生效**，该 agent 按现行规则写 `done`——R 阶段与一切旧计划因此天然不受影响（A148）；
- `agent_launch` 在本节点尚无 `node_start` 时退出 `2`；
- **`plan_amend` 的 `agent` 必须是 `monitor#<n>`**（`by=monitor`），且 `note` 必须同时含**方案文件名**与 `nodes=<新节点号,新节点号>` 列表，缺一退出 `2`（§4.5）。

**空账本**：账本不存在或为空时 `status` / `lint` 视为「**未开始**」——`current_stage` 与 `current_node` 为 `null`、所有节点 `pending`，**退出 `0`**（不是错误）。`add` 在账本不存在时**自动创建文件**，且**首条必须是 `plan_loaded`**，否则退出 `2`。

**`closed` 的派生**：节点 `closed` **当且仅当账本存在该节点的 `node_close`**；而 `node_close` 只在 closable 成立时被 `add` 接受。因此 `status` 的 **`closed` 只读账本**，**`closable` 才做判据计算**。守门在 `add`，不在 `status`。

**当前节点与 open 阶段派生**：按节点表顺序取**第一个非 superseded 且未 `node_close`** 的节点为当前节点（superseded 行既非 closed 也非 pending，直接跳过）。**`open_stages`** = 所有已 `stage_start` 且未 `stage_close` 的阶段实例。节点状态：

| 情况 | 状态 |
|---|---|
| `depends_on`（留空 = 前一节点）未全部 `closed` | `pending` |
| 依赖已满足，且已有 `node_start` | `open` |
| 依赖已满足，但无 `node_start` | `ready` |

**`status --json` 结构**：

```json
{
  "plan": {"marker": "...", "cards": ["DHR_90"], "decision_mode": "auto"},
  "open_stages": ["DHR_90:C#1"],
  "current_stage": "DHR_90:C#1",
  "current_node": "C2",
  "last_stage_result": {"stage_id": "DHR_90:C#1", "outcome": "blocked",
                        "note": "stage_id=DHR_90:C#1 outcome=blocked 表结构有二义"},
  "suggested_action": "wait_user",
  "monitor_relaunch_count": 0,
  "pending_nodes": ["R1", "F1"],
  "superseded_ignored": 2,
  "stages": [{"stage_id": "DHR_90:C#1", "stage": "C", "card": "DHR_90", "k": 1,
              "state": "open", "nodes": ["C1", "C2"], "result": null}],
  "nodes": [{"node": "C2", "card": "DHR_90", "stage": "DHR_90:C#1", "type": "construction",
             "state": "open", "closable": false, "reasons": ["coder#1 无终态事件"]}],
  "agents": [{"node": "C2", "agent": "coder#1", "last_event": "checkpoint",
              "last_ts": "...", "idle_seconds": 2839}],
  "errors": []
}
```

**顶层字段合同（冻结，键名不得改）**：

| 字段 | 类型与取值 | 空值 |
|---|---|---|
| `current_stage` | 当前阶段实例的 `stage_id` | 未开始时 `null` |
| `current_node` | 当前节点号 | 未开始时 `null` |
| `last_stage_result` | 对象 `{stage_id, outcome, note}`，取**当前阶段实例最新一条** `stage_result` | 本阶段尚无 `stage_result` 时 `null` |
| `suggested_action` | 枚举五取一：`open_next_stage` / `wait_user` / `relaunch_monitor` / `notify_user` / `none` | 无可建议动作时 `none`，不用 `null` |
| `monitor_relaunch_count` | 整数，**当前阶段实例内**因 `failed` 重拉监工的次数 | 未开始时 `0` |
| `pending_nodes` | 字符串列表，状态为 `pending` 的节点号，按节点表顺序 | 无则空列表 `[]` |
| `superseded_ignored` | 整数，本次派生**跳过的 superseded 行计数**（节点表 + agent 表合计） | 无则 `0` |
| `open_stages` | 字符串列表，已 `stage_start` 未 `stage_close` 的 `stage_id` | 无则 `[]` |
| `plan` | 对象，见下 | 恒存在 |
| `stages` | 对象列表，见下 | 无则 `[]` |
| `nodes` | 对象列表，见下 | 无则 `[]` |
| `agents` | 对象列表，见下 | 无则 `[]` |
| `errors` | 字符串列表，账本自身的结构问题 | 无则 `[]` |

**嵌套对象的字段合同**：

| 位置 | 字段 | 类型与取值 | 空值 |
|---|---|---|---|
| `plan` | `marker` | 字符串，marker 原文 | 恒存在 |
| `plan` | `cards` | 字符串列表，marker 的 `cards` | 至少一项 |
| `plan` | `decision_mode` | 字符串，`auto` / `consult`；marker 省略时派生 `auto` | 恒存在 |
| `stages[]` | `stage_id` | 字符串 `<card>:<stage>#<k>` | 恒存在 |
| `stages[]` | `stage` | 字符串，`W`/`C`/`R`/`X`/`F` 之一 | 恒存在 |
| `stages[]` | `card` | 字符串，卡号 | 恒存在 |
| `stages[]` | `k` | 整数，第几次进入该阶段 | 恒存在 |
| `stages[]` | `state` | 字符串，`pending` / `open` / `closed` | 恒存在 |
| `stages[]` | `nodes` | 字符串列表，本实例的节点号，按节点表顺序 | 至少一项 |
| `stages[]` | `result` | 对象，取该实例最新 `stage_result`，内部字段见下 | 尚无结果时 `null` |
| `nodes[]` | `node` | 字符串，节点号 | 恒存在 |
| `nodes[]` | `card` | 字符串，卡号 | 恒存在 |
| `nodes[]` | `stage` | 字符串，所属 `stage_id` | 恒存在 |
| `nodes[]` | `type` | 字符串，`build`/`construction`/`review`/`rework`/`handoff` | 恒存在 |
| `nodes[]` | `state` | 字符串，`pending` / `ready` / `open` / `closed` | 恒存在 |
| `nodes[]` | `closable` | 布尔，双判据是否成立 | 恒存在 |
| `nodes[]` | `reasons` | 字符串列表，不可关的原因 | 可关时 `[]` |
| `agents[]` | `node` | 字符串，所在节点号 | 恒存在 |
| `agents[]` | `agent` | 字符串 `<名字>#<attempt>` | 恒存在 |
| `agents[]` | `last_event` | 字符串，账本事件层词表之一 | 恒存在 |
| `agents[]` | `last_ts` | 字符串，ISO 8601 带偏移 | 恒存在 |
| `agents[]` | `idle_seconds` | 整数，距最近事件的秒数 | 恒存在 |

**`stages[].result` 的内部字段**（该对象非 `null` 时全部存在）：

| 字段 | 类型与取值 | 空值 |
|---|---|---|
| `stage_id` | 字符串 `<card>:<stage>#<k>`，与所属 `stages[].stage_id` 相等 | 恒存在 |
| `outcome` | 字符串，枚举四取一：`done` / `blocked` / `failed` / `cancelled` | 恒存在 |
| `note` | 字符串，`stage_result` 的 `note` 原文 | 可为空字符串 `""` |
| `amend` | 字符串，本阶段 `plan_amend` 的方案文件名（`note` 里 `amend=` 的值） | 本阶段无 `plan_amend` 时 `null` |
| `nodes` | 字符串列表，本阶段追加的新节点号（`note` 里 `nodes=` 的值） | 无追加时空列表 `[]` |

**superseded 行不出现在 `stages` / `nodes` / `agents` 里**，只计入 `superseded_ignored`。

**A62/A73 分工**：HC-RL-A62 只验 status schema、排序与 `superseded_ignored` 计数结构；HC-RL-A73 独占“含/不含 superseded 行的活跃 status 投影差分等价”，两条不互抄验证方式。

`suggested_action` 与 §2.1 的分路表一一对应：`done` / `cancelled` → `open_next_stage`；`blocked` → `wait_user`；`failed` 且 `monitor_relaunch_count` 为 0 → `relaunch_monitor`；`failed` 且已重拉过一次 → `notify_user`；其余 → `none`。**这是派生建议，不是命令**——编排照旧自己查表决定，程序不驱动。

`stages` 与 `nodes` 按节点表顺序，`agents` 按 `(node, 首次 launch 的 seq)` 顺序。**`open_stages` 是列表**——跨卡时可能有多个阶段实例同时 open；同卡串行保证同一张卡在列表里至多出现一次。

**错误输出**：统一写 **stderr**，格式 `error: <code> <message>`。

**`lint` 违反项输出**：每条一行写 stderr，格式 `lint: <规则编号> <message>`，**规则编号即对应验收项 ID**（如 `lint: HC-RL-A47 close 值非法: all_agents_done`）。`--json` 输出 `{"ok": false, "violations": [{"rule": "...", "message": "...", "line": 12}]}`。

**lint 规则 → 验收项 ID 映射**（每条规则都有 ID 咬住；新增规则必须同批补验收项）：

| 规则 | ID |
|---|---|
| 缺表头 / 表结构不合法 / 单元格含竖线 | HC-RL-A24 |
| `agent.node` 指向不存在节点 / 同节点 agent 名重复 | HC-RL-A24 |
| 缺 marker 或 marker 缺 `skill=` / `session=` / `recipe=` / `cards=`（`decision_mode=` 可省，省则按 `auto`） | HC-RL-A18 |
| `recipe` 值非法，或 R 阶段 reviewer 集合与该档不符 | HC-RL-A116 |
| `decision_mode` 值非法 | HC-RL-A130 |
| 节点号重复（含已 superseded 的号） | HC-RL-A46 |
| `close` 值非法 / 引用不存在的 agent 名 | HC-RL-A47 |
| `depends_on` 指向不存在节点或成环 | HC-RL-A48 |
| `depends_on` 指向 superseded 节点 | HC-RL-A72 |
| `depends_on` 跨阶段指向未闭合阶段 | HC-RL-A89 |
| `trigger` 值非法 / `on:done:` 引用不存在 agent | HC-RL-A35 |
| `on:done:` 跨节点引用 | HC-RL-A71 |
| `on:review_ready:` 引用不存在 agent，或 trigger 取值不在四态内（含 `on:review-ready:` 一类拼写变体） | HC-RL-A35 |
| `on:review_ready:` 跨节点引用（含 R 形态：该节点内根本没有可引用的同节点送审方） | HC-RL-A71 |
| 节点无非 superseded 的 agent（空节点） | HC-RL-A75 |
| `stage` 值不在阶段枚举内 | HC-RL-A129 |
| 同一阶段的节点未按 stage 分组连续（忽略 superseded 行；§4.5 的追加行落在表尾不算违规）〔产品终态；阶段性交付范围见本表后的阶段性交付注记〕 | HC-RL-A129 |
| `stage_id` 格式非法或 `<card>` 前缀与 `card` 列不一致 | HC-RL-A104 |
| 同卡阶段实例的 `depends_on` 链有分叉（同卡并行） | HC-RL-A109 |
| `card` 未在 marker 的 `cards` 列表中 | HC-RL-A87 |
| 节点表含 kickoff / verify-signoff 类 `type` | HC-RL-A126 |
| `X#k` 的 `k` 超过 `limits.rework_max_rounds` | HC-RL-A97 |

**阶段性交付注记（A129，2026-09-10 用户确认裁决）**：上表与 §4.3 描述的是**产品终态**。阶段性交付的 RLT_03 只交付**基础 lint**——先忽略 superseded 行，被 superseded 行隔开的重现**当前即通过**；同一 `stage_id` 被**其他活跃 `stage_id`** 隔断而重现时按基础规则拒绝。「同一 stage 的合法追加行落在表尾通过」由 RLT_09 按 A120 承接实现与取证，届时以其合法追加正例覆盖 RLT_03 的临时限制；**只放宽连续性这一条**，其余四项硬约束不放宽。**RLT_03 的临时拒绝不代表最终产品禁止运行中追加**，§4.5 的终态承诺保留不变。

### 3.6 `watch` 组件（第 5 批，设计已冻结）

`relay_log.py watch --plan <dir> --notify <agent>`，在**当前阶段的终端空间**里单独开一个 pane 运行；编排层用同一程序、`--notify` 指向编排。

- 读 `status --json` 取**在场 agent**，**每个 agent 一个线程**挂 `herdr agent wait`。
- 某个 wait 返回即执行 `herdr agent prompt <notify> "[relay-light] <agent> -> <state>"`（**短 ASCII 单行**，避开中文长 prompt 停在输入框的坑）。
- **发完通知不立即重挂**——settled 态下 `wait` 会立刻返回造成重复唤醒。改为每 **30 秒** `herdr agent get` 轮询该 agent，直到 **(a)** 账本出现该 agent 的终态事件 → 停止盯它、线程退出；或 **(b)** Herdr 状态回到 `working` → 重新挂 `wait`。
- **同一 `(agent, 状态)` 转换只通知一次。**
- **20 分钟兜底计时由 watch 维持**：每 20 分钟发一条 `[relay-light] tick`。
- **本阶段末节点 `node_close` 后自动退出**（编排层的 watch 则在末阶段 `stage_close` 后退出）。

**`watch` 只通知、不写账**——写入者规则不变。

### 3.7 并发协议

**任一时刻单写者 + 纯追加**：`open(path, 'a')` 一行一 json，**不做临时文件替换、不加锁**。

两个写者**时间上不重叠**，交接点就是 §5.2.1 的四步收尾：

```text
末节点 node_close（监工）→ stage_result（监工）→ stage_close（编排）→ 关终端空间（编排）
```

监工只在**自己阶段实例之内**写，末笔是 `stage_result`；编排在监工止笔后接手写 `stage_close`，**再关终端空间**（关空间在 `stage_close` 之后，不在之前）。下一实例的 `stage_start` / `monitor_launch` 之后编排再次止笔。`seq = 现有行数 + 1`，由当班写者保证。

多监工同时写是**恢复协议**要防的事（§7.3），不是写入协议要防的事。

**`relay_plan.md` 同样是单写者**：运行中只有改计划实例会写它（§4.5），**它编辑期间编排不读该文件**——编排只在**阶段开始前**重读一次，而改计划实例只在阶段**进行中**动笔，两者由 `stage_result` 隔开（改计划实例先关闭、监工才写 `stage_result`、编排才动）。所以计划文件也不需要锁。

实现只**借手法、不复用代码**：只追加写法参照 `tools/runner/relay-store.ps1:59-80` 的 `Add-RelayEvent`。**不借** `Write-RelayJsonAtomic` 的临时文件替换——那是为整份覆盖设计的。枚举**命名**可借 `tools/contracts/relay-schema.ps1:96`、`:246`、`:209`，不照搬值。

**程序明确不做**：停滞检测、陈锁自动回收（教训库候选-18）、任何「下一步该谁」的推导。

### 3.8 测试与登记

测试为 `tools/relay-light/test_relay_log.py`（标准库 `unittest`）。`tools/tests/run-relay-tests.ps1` 的循环对每个 `$suites` 条目硬编码 `pwsh -NoProfile -File`，Python 文件塞不进去；加薄壳 `tools/tests/relay-light-log.ps1` shell out 到 `python` 并转发输出与退出码，把壳登记进 `$suites`。壳里 `python` 不可用时打印 `SUITE SKIP ...`（runner 已识别该前缀）。

`run-relay-tests.ps1` 本身是 pwsh 脚本，Linux 上跑不了，所以 **Linux 侧回归入口是直接跑 Python 测试**。两条入口跑同一份测试文件。

## 4. relay_plan.md 规范

文件名固定 `relay_plan.md`，落在 `docs/modules/<模块>/relay/<plan_id>/`。**第一行是 marker**：

```text
<!-- relay-light:plan v1 skill=<ver> generated=<date> session=<herdr session> decision_mode=<auto|consult> recipe=<heavy|normal|light> cards=<卡号,卡号> -->
```

**`decision_mode` 的默认值是 `auto`**：marker 里**没写 `decision_mode=` 时按 `auto` 解析**，要 `consult` 必须显式声明。写了就必须是 `auto` 或 `consult` 两值之一，其它值 lint 报错（HC-RL-A130）。**marker 的其余字段仍然必需**——`skill=` / `session=` / `recipe=` / `cards=` 缺一即 lint 拒绝（HC-RL-A18）。**规划 agent 生成计划时模板默认写 `decision_mode=auto`**，把默认值显式化，便于事后从计划本身看出当时的模式。

正文是**两张 markdown 表，表头固定**。解析只用标准库（逐行扫描 + split），**找不到表头即报错**，不猜。

### 4.1 节点表

| 列 | 含义 |
|---|---|
| `node` | 节点号，**全计划唯一** |
| `card` | 所属任务卡号，必须在 marker 的 `cards` 里 |
| `stage` | 所属**阶段实例** `stage_id`，格式 `<card>:<stage>#<k>`，`stage` 部分取值 `W`/`C`/`R`/`X`/`F`（§5.1）。**一个阶段实例只属于一张卡**，`<card>` 必须与本行 `card` 列一致 |
| `type` | 节点类型（`build` / `construction` / `review` / `rework` / `handoff`）。**没有 kickoff，也没有 verify 签字类** |
| `close` | 关闭判据的**可选条件 2**。留空 = 不加条件；`agent:<名字>` = 该 agent 必须有 `done` 终态。无论哪种，仍同时要求条件 1 |
| `depends_on` | 依赖节点号；**留空 = 依赖前一节点** |
| `note` | 备注。废弃节点写 `superseded-by:<新节点号>` |

### 4.2 agent 表

| 列 | 含义 |
|---|---|
| `agent` | agent 名字（账本身份前半段） |
| `node` | 挂在哪个节点 |
| `role` | 角色名（对应 `roles.toml` 的键） |
| `launch` | 发起方式；留空则取 `roles.toml` 的默认。**实际启动方式与本列不同时不改计划**：监工在该 `agent_launch.note` 写 `launch_fix=<原因>`，视为运行事实记账而非改计划（RLT-A-08；不触发 `plan_amend`，lint 不校验本列与账本一致） |
| `output` | 产出文件 |
| `trigger` | 留空 = 节点开始即发起；`on:blocked` = 上游 agent 卡住时；`on:done:<名字>` = 等指定**同节点** agent `done` 后发起；**`on:review_ready:<名字>`**（RLT-A-09）= 等指定**同节点** agent 发出指向本 agent 的「待复核」信号后发起，**被等的那个 agent 不必进终态**。**批内持续在场的角色（coder、checker）一律留空**——它们要在对方拿到终态前就在场。新 trigger 只用于送审方与判定方同处一个节点的 **W / C / X**，**R 阶段不用**——R 节点没有同节点送审方，写了会被「只允许同节点引用」直接拒掉 |
| `note` | 备注。废弃行写 `superseded` |

**不写 `model` 列**——模型统一从 `roles.toml` 按 `role` 取，避免同一角色在多处各写各的。

### 4.3 硬约束与 lint

单元格**禁止出现竖线**（解析按竖线切列）。lint 逐条查：表头齐、**节点号全计划唯一**（含已 superseded 的号）、`stage` 为合法 `stage_id` 且其 `<card>` 前缀与 `card` 列一致、**同一阶段实例的节点按 stage 分组连续**、**同卡阶段实例串行**（`depends_on` 链无分叉）、`card` 在 marker 的 `cards` 里、`close` 与 `trigger` 合法且引用存在、`on:done:` **与 `on:review_ready:`** 只引用同节点、`depends_on` 指向存在且非 superseded 的节点且不成环、**跨阶段依赖只能指向已在前面的阶段**、`agent.node` 存在、同节点内 agent 名唯一、**每个节点至少一个非 superseded 的 agent**。

**「连续」这条按 stage 分组判定，不看物理行号相邻**（为 §4.5 运行中改计划放宽）：忽略 superseded 行后，同一 `stage_id` 的非 superseded 节点在表中构成一段连续区间即算通过，**追加行落在表尾也通过**。其余规则一条不放松——**节点号重复（含已 superseded 的号）仍然拒绝**，`depends_on` 不得指向 superseded、跨阶段依赖只指向前面的阶段、同卡阶段实例串行也都照旧。正是这几条没放松，编排才能从计划无歧义地推出下一阶段。

> **阶段性交付注记（RLT_03 → RLT_09，2026-09-10 用户确认裁决）**：上面这段是**产品终态**。阶段性交付的 RLT_03 只交付**基础 lint**，基础边界**先忽略 superseded 行**——被 superseded 行隔开的重现**当前即通过**；同一 `stage_id` 被**其他活跃 `stage_id`** 隔断而重现时，基础规则按 A129 拒绝。「同一 stage 的合法追加行落在表尾通过」由 RLT_09 按 A120 承接实现与取证，届时以其合法追加正例覆盖 RLT_03 的临时限制；**只放宽连续性这一条**，节点号唯一、`depends_on` 不指向 superseded、跨阶段依赖只指向前面的阶段、同卡阶段实例串行**四项硬约束都不放宽**。**RLT_03 的临时拒绝不代表最终产品禁止运行中追加**——§4.5 的终态承诺（当前阶段实例内追加由当班监工接手、后续阶段由编排开到时按常规处理，并由 RLT_16 / RLT_19 实跑证明）保留不变。

### 4.4 改计划规则

沿用教训库候选-10，不原地改写：

- **节点号永不复用**，废弃的号也不放回。
- 改计划 = 追加一行新节点号，旧行 `note` 写 `superseded-by:<新节点号>`；agent 表同理，废弃行 `note` 写 `superseded`。
- **一个旧节点拆成多个新节点时，`superseded-by` 只引用「承接它 `depends_on` 关系」的那一个**（通常是拆出来的第一个）；其余新节点不写进旧行，它们的先后由**新节点自身的 `depends_on` 链**体现。`superseded-by` 是单值字段，不写成列表——否则依赖该旧节点的下游不知道该改指向谁。
- **`status` 与 lint 忽略 superseded 行**；但节点号仍被占用，lint 拒绝重复节点号。
- **superseded 节点没有「关闭」语义**——不是 closed 也不是 pending，`status` 直接忽略。
- **`depends_on` 指向 superseded 节点时 lint 报错**：替代节点必须在自己那行重写依赖。
- 改 skill 只对新计划生效；已开工的计划按自己那份走完。

### 4.5 运行中改计划

计划开工后发现要改，不停摆、也不原地改写——按 §4.4 的追加规则由一个**改计划实例**一次改完。一句话护栏：

> **任务卡、开发方案、接力计划三样 agent 可自己改；设计方案与验收清单 agent 不碰，交用户。**

#### 4.5.1 谁能发现、怎么过门

**只有两个角色能发现「计划要改」**：

| 角色 | 什么时候 | 它做什么 |
|---|---|---|
| **decider** | 施工 `blocked` 时 | 在 `decision.<n>.md` 里写「需要改计划」及改动内容 |
| **strategist** | 复核返工超轮数上限时 | 在自己的方案文件里写「需要改计划」及改动内容 |

两者**只写方案文件，自己不改任何文件**，写完收工关 pane。

**要不要先问用户，沿用现有的门，不新增规则**：

- decider 触发的，按 marker 的 `decision_mode`（**默认 `auto`**）——`auto` 直接过门；`consult` 先问用户，出一条 `user_decision`。
- strategist 触发的，**永远先交用户**（不看 `decision_mode`，与 §2.2 一致）。

**「改计划」视作决策方案的一部分：方案过门，改计划一并过门。** 不为改计划单设第二道门。

**用户否决改计划时**（`consult` 模式下用户不同意，或 strategist 方案被驳回）：

- `user_decision` 的 `note` **以 `reject-amend:` 开头**，后面写**用户的替代指示**；同意的写法对称，以 `approve-amend:` 开头。
- 监工**不拉改计划实例、也不重拉 decider**，直接把用户的替代指示用 `herdr agent prompt` **送回同一个 coder**，然后写 `resume`（`note` 引用该 `user_decision`）。
- 计划因此**一个字都不改**，账本上**不出现 `plan_amend`**，`stage_result.note` 也就不带 `amend=` 摘要。

#### 4.5.2 改计划实例

过门后，**当班监工拉一个 planner 角色的「改计划实例」**——复用 §2 的规划角色与它在 `roles.toml` 里的模型档，**不发明新角色**，agent 名形如 `planner-amend#<n>`。

- **输入**：方案文件（`decision.<n>.md` 或 strategist 方案文件）、当前 `relay_plan.md`、开发方案、涉及的任务卡 `task_plan.md`。
- **动作**：**一次改完该改的文件**，然后跑 `relay-log lint`；不过就自己修。
- **lint 兜底**：**重试上限 3 次**，第 3 次仍不过就**视同「超出范围」**处理，不再硬修。
- **收尾**：做完关闭，不常驻。
- **账本身份**：`planner-amend#<n>` 走普通 agent 事件（`agent_launch` → `done`），但因为它是过门后**按需**拉起、不预先写进 agent 表，`add` 对它**豁免「agent 名必须在该节点 agent 表中」这条**（§3.5）；其余校验照旧。
- **不进 blocked 链**：改计划实例**不允许写 `blocked` / `escalate`**——它是过门之后的执行者，不能再触发第二轮升级。做不到就按「超出范围」处理：计划目标文件与输入方案文件均不改，改计划实例以普通 `done.note` 写 `outcome=out-of-scope proposal=<方案文件名> reason=<原因>` 后收工；当班监工再把本阶段的 `stage_result` 记 `blocked` 交用户。

**可碰文件白名单（按路径）**：

| 可碰 | 路径 | 怎么碰 |
|---|---|---|
| 接力计划 | `docs/modules/<模块>/relay/<plan_id>/relay_plan.md` | 节点表与 agent 表，按 §4.4 追加行 + 旧行标 superseded |
| 计划 marker | 同上文件第一行的 `cards=` 字段 | 新增任务卡时加卡号 |
| 开发方案 | `docs/modules/<模块>/dev_plan/P<N>-*.md`（DevPlan 户口本） | 任务行的描述、拆分、合并、先后、依赖 |
| 任务卡施工步骤 | `docs/modules/<模块>/workspace/<卡号>/task_plan.md`，**`<卡号>` 只能是 marker `cards` 里已存在的卡** | 施工步骤 |

**新增任务卡时，改计划实例不写新卡的 `task_plan.md`**——它只往 marker 的 `cards` 加卡号、往开发方案加任务行、往 `relay_plan` 追加该卡的阶段行；新卡的任务工作区七件套（含 `task_plan.md`）由**该卡 W 阶段的 builder** 照常建（§4.5.3 第二种情况）。所以白名单里的 `<卡号>` 判定用的是**改动前**的 `cards` 列表。

**禁区（按路径）**：**`docs/modules/<模块>/design/` 整个目录**——包含 `design/01-产品设计与验收.md`（设计方案与验收清单同在此文件）、`design/README.md`、`design/evidence/`、`design/records/`、`design/drafts/`。**验收 ID 不得新增，也不得改动。**

**碰到禁区就不改**——计划目标文件与作为输入的方案文件全部保持零变化；改计划实例不写 `blocked` / `escalate`，也不写 `plan_amend`，只以自己的普通 `done.note` 写结构化原因 `outcome=out-of-scope proposal=<方案文件名> reason=<原因>` 后收工。**当班监工再把本阶段的 `stage_result` 记 `blocked`**，由编排通知用户（§2.1 的 `blocked` 分路）。失败原因用 `proposal=` 关联原方案，不回写方案文件。

**禁区判定是整份方案的开关，不做部分执行**：方案里**只要有一处**落进禁区，**整份改动都不落笔**——不允许「先把白名单内的那几处改了，禁区那处留给用户」。理由是半改过的计划既不是旧计划也不是新计划，用户接手时无从判断现场。

#### 4.5.3 四种情况

| 发现要改的是 | 改计划 agent 做什么 | 额外问用户？ |
|---|---|---|
| **当前任务卡内容**（范围内，验收 ID 不变） | 改 `task_plan`；`relay_plan` 对应节点按 §4.4 追加或标 superseded；开发方案只在任务描述或依赖变了时同步一行 | 不用，走 §4.5.1 的门 |
| **新增一张任务卡** | 开发方案加任务行；marker 的 `cards` 加新卡号；`relay_plan` 追加这张卡的 W／C／R／F 阶段行。**任务工作区七件套不由它建**，由新卡 W 阶段的 builder 照常建；编排开到新 W 阶段时才拉监工 | 不用 |
| **开发方案的任务拆分／合并／先后／依赖**（范围内） | 直接改开发方案，`relay_plan` 的 `depends_on` 跟着改 | 不用。**此举绕过 dev-harness「改开发方案须 B-adjust 用户确认」的规则，是有意的显式决策**（§1.3、§14） |
| **设计方案，或需要新增验收条目** | 计划目标与输入方案文件均不改；planner-amend 以普通 `done.note` 写结构化「超出范围」原因，本阶段由 monitor 写 `stage_result outcome=blocked` 交用户。用户在接力外走 dev-harness A-full／A′（必要时 B-adjust）改完后裁决「继续」，当班监工在**同一阶段实例内**接着干；若改动大到计划整体不成立，重新拉规划 agent 出新计划，旧计划整体按 §4.4 标 superseded | **必须** |

#### 4.5.4 账本、编排与 lint 的配套

- **账本**：新增控制事件 **`plan_amend`**，由**当班监工**写，`agent` 为 `monitor#<n>`，**不进状态机**；`note` 写方案文件名 + 新节点号列表，形如 `decision.2.md nodes=C3,C4`（§3.4、§3.5）。
- **编排不缓存计划**：每次开阶段前重读 `relay_plan`（用 `status` 输出，忽略 superseded 行），下一阶段从计划推导，不背 `W→C→R→F` 固定顺序（§2.1）。
- **编排不监听 `plan_amend`**：改计划信息**只经本阶段 `stage_result.note` 的 `amend=` 摘要**到达编排，编排据此在开下一阶段前重读计划。`plan_amend` 只是账本上的事实记录，不承担通知职责。
- **`stage_result` 带改动摘要**：本阶段发生过 `plan_amend` 时，监工在 `stage_result.note` 里写方案文件名与新节点号；编排据此重读计划再定下一阶段（§5.2.1）。
- **追加节点谁接手**：**当前阶段实例内**追加的节点由当班监工直接接手；**后续阶段**的追加由编排开到时按常规处理。
- **lint 放宽**：只放宽「同一阶段实例的节点连续」这一条，改为按 stage 分组判定、忽略 superseded 行、允许追加行落在表尾（§4.3）；节点号唯一、`depends_on` 不指向 superseded、跨阶段依赖只指向前面阶段、同卡阶段实例串行**都不变**。本条是**产品终态**；阶段性交付的适用范围（RLT_03 的基础 lint 与 RLT_09 的放宽交付）见 §4.3 阶段性交付注记。

## 5. 阶段与节点

### 5.1 五个阶段

| 阶段 | 名字 | 干什么 |
|---|---|---|
| **W** | 建工作区 | 建任务工作区七件套、写 `task_plan` 并过审 |
| **C** | 施工 | 按 `task_plan` 批次施工，每批带方向评估 |
| **R** | 复核 | 机器体检 + 各路并行复核 + 收敛 |
| **X** | 返工 | 复核有 P0/P1 时的修复子环 |
| **F** | 收口备料 | as-built、verify 材料、汇报、证据展示区 |

**阶段实例 = 一个终端空间 + 一个监工。** 阶段内节点顺序执行。同一阶段可多次进入，用 `#k` 区分：`DHR_90:X#1`、`DHR_90:X#2`、返工后的 `DHR_90:R#2`。X 的轮数上限读 `dh-mapping.toml`。

**一个阶段实例只属于一张卡**——`stage_id` 前缀就是 `card`。终端空间的 `cwd` 因此明确 = **该卡的 worktree**。

**并行只允许跨卡**：同一张卡的阶段实例**必须串行**（lint 校验同卡 `depends_on` 链无分叉），不同卡的阶段实例可各自在自己的终端空间里并行。

**每个阶段实例独立写自己的 `stage_result`**，没有跨实例的汇总规则——`R#1` 的 `failed` 不影响 `R#2` 的判定。

### 5.2 节点内的 agent 纪律

- 一个节点可挂任意多个 agent、可并行；复核批就是「一个节点挂 N 个 reviewer」。
- 每份文件在一个节点内**只有一个写入者**：`findings.md` / `lesson_candidates.md` 归 coder，`progress.md` 归 scribe，reviewer 各写各的 `review.<路径>.md`。
- decider、checker、strategist 都不写账本，也不做复核。
- **判定 PASS 之前，送审方与判定方都不记终态**（RLT-A-09）。送审方与判定方同处一个节点时（W / C / X），送审方每一轮产出写一条带 `ready_for_review=<判定方>` 的 `checkpoint` 送审；判定方 FAIL 时**保持 live**，把每条 P1 落成挂在自己名下的 `checkpoint`（`note` 写路由信息），整改意见发回**同一个** live 送审方；送审方改完再发一条新信号，由**同一个判定实例**复审，**不重拉、不新增 `agent_launch`、不增 attempt**。
- **PASS 之后的终态顺序固定：先送审方、后判定方**（RLT-A-09）。判定方在两者之间保持 live，是它「已判 PASS 但尚未封口」的唯一可观察形态；`on:done:<送审方>` 的下游（如 C 的 scribe）也正是在送审方封口这一刻才命中。程序侧的保证见 §3.5 的配对闸（A146）。
- **R 阶段不走这条**：R 节点只有多路 reviewer 与一个 scribe，**没有同节点送审方**，reviewer 复核的是上一节点的产出；R 打回本来就有合法出口（写 `stage_result` 附打回清单，由编排追加 X 节点）。R 模板一字不改，配对闸对它不生效。

### 5.2.1 阶段收尾的固定顺序

```text
末节点 node_close（监工）
  → stage_result（监工，note 带 stage_id 与 outcome）
  → stage_close（编排，前置：该实例最新 stage_result 的 outcome ∈ {done, cancelled}）
  → 关终端空间（编排）
```

四步顺序固定，`add` 逐条校验：`stage_result` 在该实例末节点 `node_close` 之前写会退出 `2`；`stage_close` 在无 `stage_result` 或最新 `outcome ∉ {done, cancelled}` 时退出 `2`。

**本阶段发生过 `plan_amend` 时，`stage_result.note` 必须带改动摘要**：在 `stage_id=` 与 `outcome=` 之外补写**方案文件名**与 `nodes=<新节点号,新节点号>`，形如：

```text
stage_id=DHR_90:C#1 outcome=done amend=decision.2.md nodes=C3,C4 本批完成，计划已追加两节点
```

编排读到这条摘要就知道要**重读计划**再定下一阶段（§2.1、§4.5.4）。本阶段没发生 `plan_amend` 时不写这段。

**`blocked` 之后的收尾路径**：`stage_result` **允许多次写入**，`status` 只认最新一条。

```text
outcome=blocked（监工）→ 编排通知用户 → 用户裁决
  ├─ 继续 → 监工在同一阶段实例内接着干 → 最终补写 outcome=done → 编排 stage_close
  └─ 放弃 → 监工写 outcome=cancelled（note 引用该 user_decision）→ 编排 stage_close
```

`failed` 路径不变（重拉监工一次，再 failed 通知用户）。

**环境性 NOT_RUN 出口**（RLT-A-08）：某 agent 在本节点连续 `agent_lost` 达 `attempt_max` 且每条 `note` 含 `NOT_RUN`（进程从未进入工作态，如沙箱起不来、模型不可达），监工不再重拉，也不伪造 `blocked`；直接写 `stage_result outcome=blocked ref=<agent>#<n>:agent_lost` 交编排转用户。用户裁决「换启动方式」时，监工在同一阶段实例内以 `launch_fix=` 记账重拉（attempt 继续 +1，`attempt_max` 对同一 `launch_fix` 值各自计数）；裁决「放弃」走 `cancelled`。

### 5.3 节点关闭判据

**固定为双条件合取：**

1. 本节点所有已 `agent_launch` 的 agent 都有**终态事件**（`done`、`agent_lost` 或 `cancelled`）；
2. 若 `close` 列非空，则该 agent 有 **`done`** 终态（`agent_lost` / `cancelled` 不满足条件 2）。

条件 1 永不豁免——施工节点写 `close=agent:scribe` 时，coder 与 checker 也挂在该节点上，scribe 终态但它们未交付时仍不可关。正因为条件 1 永远在，`all_agents_done` 这种枚举值恒真、纯属重复，不设。

**双判据本身一字不改**（RLT-A-09）：新增的只是**进终态的时机**——本节点存在指向某判定方的「待复核」信号时，该判定方的 `done` 必须晚于它所复核的那个送审方实例的 `done`（§3.5 的配对闸，A146）。两条判据仍在 `node_close` 判，配对闸在写 `done` 当场判，**位点不同、互不替代**；没有信号的节点（R 阶段与一切旧计划）判据与时机都照旧。

**阶段关闭**：该实例全部节点 `closed`、监工写下最新 `outcome ∈ {done, cancelled}` 的 `stage_result` 后，编排写 `stage_close`。

## 6. 与 dev-harness 的映射

> **本节的具体取值全部落在 skill 内的 `dh-mapping.toml`**，正文只写结构。**dev-harness 变更时只改映射配置与模板，不改 `relay_log.py`。**

### 6.1 阶段 ↔ dev-harness 节点

| 阶段 | 对应 dh 节点 | relay 侧怎么做 |
|---|---|---|
| **W** | S0 建工作区、S1 brief、S2 施工步骤 | builder 建七件套与 `task_plan`；plan-reviewer 审 `task_plan` |
| **C** | S3 施工 | 按 `task_plan` 批次拆 **C1..Cn** 节点；每批 **coder + checker + scribe**，**decider `on:blocked`** |
| **R** | E0 机器体检、E1 check 四道闸（scribe 跑脚本）；**按 Recipe 档位挂的并行 reviewer**；E6 miner；E3 收敛（scribe 汇总 `review.md`） | 一个 R 阶段实例内按上述分节点。**哪几路 reviewer 由档位决定，权威取值只在 §6.3 的 `dh-mapping.toml`**，本表不复述 |
| **X** | E2/E3 的**返工子环** | coder 修 + reviewer 再审；**轮数上限读映射配置（当前 2）**，超限停 → strategist → 用户 |
| **F** | E7 as-built、E8 填 AI 提交区、E9 交付汇报、E10 证据展示区 | 全部由 scribe 备料 |

**E11 用户确认 / E12 代签 / E13 销户不进接力**——那是人闸与主干操作，留给人和主 session。

### 6.2 `dh-mapping.toml` 承载什么

四类内容：**各阶段对应的 dh 节点**、**Recipe 三档对应哪些 reviewer**、**复核最大轮数**、**止损规则**。结构形如：

```toml
[stages.<阶段>]
dh_nodes = <见 §6.3>        # 各阶段对应的 dh 节点列表，取值见 §6.3

[recipes.<档>]
reviewers = [...]          # 三档的具体路数见 §6.3，本节不复述

[limits]
rework_max_rounds = <整数>   # 取值见 §6.3
attempt_max = <整数>         # 取值见 §6.3

[limits.on_exceed]
action = "<止损动作>"        # 取值见 §6.3
```

**本节只写结构，不写取值。** Recipe 三档的 reviewer 集合与止损数值的**权威取值只在 §6.3 的完整样例**（对应 HC-RL-A115、HC-RL-A116）；止损配置节名固定为 `[limits]` 与 `[limits.on_exceed]`，**没有 `[rework]` 这个节**。

### 6.2.1 配置文件的解析优先级

`roles.toml` 与 `dh-mapping.toml` 共用同一 resolver 和配置加载结果，不做合并：

| 情形 | 结果 |
|---|---|
| 显式给 `--config-dir <dir>` | 只使用该目录；优先于所有默认候选 |
| 未显式给，且仅 `~/.claude/skills/relay-light/` 存在 | 使用 Claude 目录 |
| 未显式给，且仅 `~/.codex/skills/relay-light/` 存在 | 使用 Codex 目录 |
| 未显式给，且两侧目录同时存在 | 配置来源有歧义，退出 3，要求显式 `--config-dir` |
| 未显式给，且两侧目录均不存在 | 无配置来源，退出 3，要求先安装或显式 `--config-dir` |

“存在”指候选目录存在；选中后任一必需配置缺失、不可读或解析失败，同样 fail closed 退出 3。双侧/零侧、显式目录不存在报 `HC-RL-A135`；选中目录的 `roles.toml` 加载失败报 `HC-RL-A131`，`dh-mapping.toml` 加载失败报 `HC-RL-A92`。三个子命令共用该 resolver 的加载结果，不得以 `config=None` 绕过 A116/A97。

正式 adapter 必须知道自己使用哪一侧：Claude adapter 在 `add`/`status`/`lint` 的所有命令模板显式传 `~/.claude/skills/relay-light/`，Codex adapter 显式传 `~/.codex/skills/relay-light/`。relay-log 不猜主控或调用进程身份，不直接回退到仓内 `tools/relay-light/skill/`。

显式值先按当前用户 home 展开 `~`，再依次做 `abspath`、`normpath`（不解析符号链接），并仅把 `os.sep` 换成 `/`。**不做跨目录比对，也不检测副本是否陈旧**；副本与仓内源一致由安装器的五文件哈希校验负责（HC-RL-A32 / A124）。

**`plan_loaded` 事件的 `note` 必须含 `config_dir=<实际使用的配置目录>` 与 `plan=<计划目录路径>`**。`config_dir=` 记录上述规范化绝对路径经 `urllib.parse.quote(path, safe="/:~-._")` 得到的百分号编码，使其保持单个无空白 token。形如：

```text
skill=0.1.0 config_dir=C:/Users/Alice%20Li/.claude/skills/relay-light plan=docs/modules/dh-relay/relay/wave-2026-09 session=app cards=DHR_90,DHR_91
```

两个键都缺一不可（§3.4），这样事后从账本就能还原当时读的是哪一份配置、跑的是哪一份计划。

## 6.3 两份配置文件的完整样例

落点在 skill 目录，**开发方案负责建文件**。

**`dh-mapping.toml`**：

```toml
# 阶段 → dev-harness 节点
[stages]
W = { dh_nodes = ["S0", "S1", "S2"] }
C = { dh_nodes = ["S3"] }
R = { dh_nodes = ["E0", "E1", "E2", "E4", "E5", "E14", "E6", "E3"] }
X = { dh_nodes = ["E2", "E3"] }          # 返工子环
F = { dh_nodes = ["E7", "E8", "E9", "E10"] }
# E11 用户确认 / E12 代签 / E13 销户 不进接力

# Recipe 三档 → R 阶段挂哪些 reviewer
# 严格对齐 dev-harness 节点表 E2 与 E14 的 task_type 派生规则：
#   E2 代码轮 2：heavy 必做，normal 默认不做，light 整段不适用
#   E14 一致性：heavy 与 light 必过，normal 不必查
[recipes.heavy]
reviewers = ["code-round2", "requirement", "lesson", "consistency"]

[recipes.normal]
reviewers = ["requirement", "lesson"]

[recipes.light]
reviewers = ["lesson", "consistency"]

# 止损
[limits]
rework_max_rounds = 2      # X 阶段轮数上限
attempt_max = 3            # 节点实例内同一 agent 名的重拉上限

[limits.on_exceed]
action = "strategist-then-user"
note = """
三套计数独立、不叠加、不互相重置：attempt 抓「实例挂了重拉」，
rework 抓「X 阶段复核打回」，节点内送审轮次抓「判定方在同一节点里反复打回」。
任一先到上限即停，出口相同：
监工拉 strategist → strategist 输出全局方案或建议停卡 → 永远交用户裁决。
"""
```

**`roles.toml`**：

```toml
[planner]
model = "高档"
launch = "claude opus"

[orchestrator]
model = "低档"
launch = "herdr:codex"

[monitor]
model = "低档"
launch = "herdr:codex"

[builder]
model = "低档"
launch = "zcode"

[plan-reviewer]
model = "高档"
launch = "claude opus"

[coder]
model = "高档"
launch = "zcode"            # 额度尽则 codex gpt-5.6-terra high

[scribe]
model = "低档"
launch = "zcode"

[checker]
model = "高档"
launch = "claude opus"

[decider]
model = "高档"
launch = "claude opus"

[reviewer]
model = "按档位"
launch = "codex --sandbox read-only"

[strategist]
model = "高档"
launch = "claude opus"
```

## 7. 运作

### 7.1 分工与拉取顺序

```text
人 → 规划（产出 relay_plan 后自关）
人 → 编排（常驻，独占一个终端空间）
编排 → 每阶段实例：建终端空间 + 拉监工 + 等 + 读 stage_result 分路 + stage_close + 关终端空间
监工 → 本阶段所有 agent
```

编排**不越级拉 agent**；监工**不跨阶段存活**；规划**不参与运行**。

### 7.2 等待与节奏

**默认：等 `watch` 推送。** watch 既推状态变化，也每 20 分钟推一条 `[relay-light] tick`；收到 `tick` 就跑 `status` 与 `herdr agent list` 对账。**这种模式下监工与编排都允许结束回合**，靠 prompt 唤醒。

**没有 `watch` 时**回退到前台 `wait` 循环（`--timeout 1200000` 自带 20 分钟节拍）。一句话：**有 `watch` 时允许结束回合、靠 prompt 唤醒；无 `watch` 时不得结束回合。**

前台循环写法：

```bash
herdr agent wait <agent> --timeout 1200000
```

返回 `idle` / `done` / `blocked`，按状态分路：`blocked` → 记 `blocked` 走升级；`done` / `idle` → **先读产出判断是否合格**，再记账本的 `done`。`agent wait --until blocked` 只作可选模式，不做默认。

**硬规则：`wait` 返回时必须有接收者。** wait 是阻塞式 CLI 不是推送，返回那一刻没人在听信号就丢了。三种满足方式：watch 推送模式（接收者是被唤醒的监工或编排）；Codex 侧无 watch 时前台阻塞循环；Claude Code 侧无 watch 时前台或后台（`run_in_background` 退出会唤醒 session）。所以不写「必须前台」这种绝对话。

### 7.3 恢复协议

**监工挂掉**（阶段内）：

1. **先关旧监工 pane**（人或编排做）——这是防止两个监工同时写账的唯一手段。
2. 编排重拉监工，写一条 `monitor_launch`。
3. 新监工第一动作 `herdr agent list` 盘点在场 agent，写 `monitor_restart`（`note` 列盘点结果）。
4. 已 `agent_launch` 但不在场、又无终态的 agent，逐个记 `agent_lost`。

**编排挂掉**：账本停在某个 `stage_start` / `monitor_launch` 之后。人重拉编排，它读 `status --json` 定位当前阶段续跑；**不重复写 `stage_start`**（每阶段仅一次）。

**三套止损计数，各自独立，谁先到谁触发，不叠加**（RLT-A-09 由两套扩为三套）：

| 计数 | 范围 | 上限 | 递增时机 |
|---|---|---|---|
| **attempt** | 节点实例内同一 agent 名 | 3（每节点独立，跨节点不累计） | 仅在本节点 `agent_lost` / `cancelled` / 阶段 `failed` 后重拉时 +1；**批内 `checkpoint` 往返不增**；节点级返工是新节点实例、从 1 起 |
| **X 轮数** | 复核返工轮 | `dh-mapping.toml` 的 `max_rounds`（当前 2） | 每开一个 X 阶段 +1 |
| **节点内送审轮次** | 节点内同一判定方 | `dh-mapping.toml` 的 `rework_max_rounds`（当前 2；**与 X 轮数共用取值，不新增配置键、不改取值**） | 每写一条指向该判定方的 `ready_for_review=` 信号 +1，**首轮计入**；耗尽判据是「条数 ≥ 上限 **且** 该判定方在本节点仍无 `done`」（RLT-A-09） |

**静默超时**（RLT-A-08）：`status` 只看账本，最近事件距今超过 `dh-mapping.toml` 的 `limits.silence_timeout_min`（默认 30）即标 `ledger_silent` 提示；提示不等于挂死。监工收到提示后再核三件事：Herdr 报告的 agent 状态、pane 末行、允许路径内产出文件，**三者均无变化**才判定挂死：先向其发送中断使 `wait` 返回，再写 `agent_lost`（`note` 含 `silent_timeout`），同 pane 重拉 `#n+1`，重发派活并注明「先检查已有部分产物」；任一仍在变化则不得中断。这是 attempt 递增的合法前因之一（A113 的 `agent_lost` 分支），不是新的计数。

**出口相同**：任一先到上限即停 → 拉 **strategist** → **交用户裁决**。三者不叠加计算，也不互相重置。**第三套只投影、不拒写**（RLT-A-09）：与前两套一样是只读派生，`add` 从不因轮次拒绝任何 ready 信号；超限后第 N+1 条仍照常落账，由监工读到耗尽标记后拉 strategist，`escalate` 作链首、`user_decision` 永远出现（§3.4 的 strategist 链不变）。三套计数**都不进 `status --json` 的冻结 schema**，处境一致。

### 7.4 终端空间拓扑与 pane 布局

- **一个阶段 = 一个终端空间**（`herdr workspace create`，cwd 指向该卡的 worktree）；编排另有自己独占的一个。
- 空间内 agent 都是**根 tab 里的 pane**；**tab 这一层不使用**。
- **不同仓库各开各的具名 session**：`herdr --session <仓库名> ...`（用户现役 `app` / `kpi` / `kpi-agg`），session 名写进 marker。
- **阶段结束关整个终端空间**；全计划结束后先关空间再删 worktree，顺序反了会留占用。
- 布局：同时在场 agent ≤3 时监工占左侧整列、其余右侧上下分；4 个时四格；一般不超过 4 个。**第二次 `pane split` 要显式传目标 pane，不要用 `--current`**。
- 账本 agent 标识用 `<名字>#<attempt>`，**不记 pane ID**（关闭后不复用且带空间前缀）。

## 8. 决策状态与显式选择

### 8.1 待决策项：**无，全部已决**

skill 放置位置已拍板：**仓内单源 + 两侧派生副本**。唯一可编辑源为 `tools/relay-light/skill/`，五件是 `SKILL.md` 核心、`references/adapter-claude-code.md`、`references/adapter-codex.md`、`roles.toml`、`dh-mapping.toml`；`~/.claude/skills/relay-light/` 与 `~/.codex/skills/relay-light/` 只由安装器从仓内源单向全量覆盖，不得就地编辑、反向同步或使用软链。

安装器为标准库 Python 文件 `tools/relay-light/install_skill.py`。Windows 执行 `python tools/relay-light/install_skill.py --all`，Linux 执行 `python3 tools/relay-light/install_skill.py --all`；`--all` 从当前用户 home 派生两个固定目标，每次覆盖全部五文件并校验两侧哈希。任一步失败即非零退出，首版**不承诺原子、回滚或中断恢复**，失败后两侧可能暂时不同步；此时不得启动新的 relay-light 计划，排除失败原因后重新执行整套 `--all`，直到退出 0 且两侧五文件均与仓内源一致。

每个目标成功后只写一份可解析的**当前 manifest**，下次成功同步直接覆盖；字段为 `source_head`、`source_dirty`、五文件相对路径与哈希、`installed_to`、`installed_at`。不设 manifest ID、不留历史、不与 `plan_loaded` 绑定；跨机正式证据要求 `source_dirty=false`。运行时由 adapter 显式传入本侧用户级副本；直接调用按 §6.2.1 的五情形解析，**不直接读仓内源**。仓内 AGENTS.md 阅读矩阵加一行索引；**dev-harness 不改**。

### 8.2 `by` 字段可伪造：明确的设计选择

账本的 `by` 标称写入者，但**没有物理校验**能证明写这行的真是编排或监工——轻版**不做身份校验**，用「零启动成本」换来的。因此 HC-RL-A85 验的是**一致性**（有没有出现越权形态的记录），**不是真伪**。要真伪就得回到 receipt 那套重型身份链，那正是本模块放弃的东西。

## 9. 四个场景

### 9.1 批次施工 + 方向评估（批内不换人）

**coder 与 checker 都在节点开始时拉起，批内持续在场**，由监工用 `herdr agent prompt` 在两者之间来回送。

```text
C1 node_start
  agent_launch coder#1        （trigger 留空）
  agent_launch checker#1      （trigger 留空）

  coder 写完第 1 轮，pane 打四行小结
    → checkpoint coder#1    note=ready_for_review=checker round=1 小结已出   ← seq S1，非终态送审信号
  监工把小结与 diff 送 checker
    → checkpoint checker#1  note=routed_to=coder#1 round=1 偏离：X 处未按 task_plan 第 2 条
                            （FAIL，checker 保持 live，不记 done）
  监工把方案 prompt 回同一个 coder（不换人、不加 attempt）
    → checkpoint coder#1    note=round=1 按方案已修
    → checkpoint coder#1    note=ready_for_review=checker round=2 已可复核    ← seq S2，第 2 轮送审

  checker 再核，通过（同一个 checker#1 实例复审，不重拉、不新增 agent_launch）
    → done coder#1          note=本批完成，四行小结已收                   ← 送审方先封口
    → done checker#1        note=reviewed=coder#1 ready_seq=S2 PASS        ← 判定方后封口
  agent_launch scribe#1     （on:done:coder）
    → done scribe#1         note=progress.md 已写
  node_close C1             （close=agent:checker，条件 1 要求三者全终态）

下一批 C2：开新的 coder#1 / checker#1（新节点，attempt 重新从 1 起）
```

三条要点：

- **checker 通过才进下一批**，不是「修完就进」。checker 的账本 `done` 语义就是「本批方向通过」。
- **批内的「方案 → 修」一律走 `checkpoint`**，`note` 记 checker 轮次；`agent_launch` 与 attempt **都不增加**。
- coder 在 checker 通过前**拿不到终态事件**——这是状态机能成立的前提（终态后同一 agent 不得再有事件）。所以 checker 的 trigger 是**留空**（节点开始即在场），不是 `on:done:coder`。
- **判定 PASS 之前谁都不记 `done`**（RLT-A-09）：coder 每一轮产出用一条带 `ready_for_review=checker` 的 `checkpoint` 送审；checker FAIL 时保持 live，把整改意见落成自己名下的 `checkpoint` 路由回同一个 coder；PASS 后按 **coder 先、checker 后**依次封口，checker 的 `done.note` 用 `reviewed=` 与 `ready_seq=` 回指它答的是哪一条信号。C 阶段 checker 的 trigger **仍然留空**，因此**发不发信号由纪律定**；一旦发了，封口顺序就由程序咬住（§3.5 的 A145 / A146）。

### 9.2 blocked → decider → 按 `decision_mode` 分路（同样不换人）

```text
blocked   coder#1     note=表结构有二义
escalate  coder#1     note=decider=decider#1
agent_launch decider#1（trigger=on:blocked）
decision  coder#1     note=decider=decider#1 decision.1.md
done      decider#1   note=方案可落地，decider 收工关 pane
   ├─ decision_mode=auto    → 监工直接把方案 prompt 回同一个 coder#1
   └─ decision_mode=consult → 监工先问用户 → user_decision coder#1 → 再 prompt 回同一个 coder#1
resume    coder#1     note=按 decision.1.md 继续
  （coder 继续本批，之后照旧走 checkpoint ↔ checker 直到通过）
```

`decision_mode` 在 marker 里，**只管 decider**。两种模式的区别只在「要不要先问用户」，**都不换 coder**——decider 收工关 pane，coder 原地 `resume`。

### 9.3 复核 → 返工 → 超限停 → strategist → 用户

```text
R 阶段：四路 reviewer 并行 → scribe 收敛 review.md
   有 P0/P1 → 编排开 X1 阶段（新终端空间、新监工）
X1：**开新的 coder 实例**（节点级返工，attempt 从该节点的 1 起）修 + reviewer 再审
   X 节点内 coder 与 reviewer 同处一表：coder 写 checkpoint 带 ready_for_review=<打回路> 送审，
   该路 reviewer 的 trigger 为 on:review_ready:coder；FAIL 则 reviewer 保持 live 路由回同一 coder，
   PASS 后按 coder 先、reviewer 后封口（§5.2、§3.5）
   过 → stage_close X1 → 回 R 收敛
   不过 → X2（第 2 轮，max_rounds=2 已达）
X2 仍不过（X 轮数达 max_rounds=2）→ 监工拉 strategist
   （另两条等价入口：某节点内 attempt 达 3，或某节点内对同一判定方的送审轮次达 rework_max_rounds
     —— 三套计数谁先到谁触发，不叠加）
   输入：brief、task_plan、全部 review、账本
   输出：全局方案 或 建议停卡
   → **永远交用户裁决**（不看 decision_mode）
```

账本上这一段的事件行（§3.4 的 strategist 链：决策类事件记在 X2 那个 coder 名下，`agent_launch` 与 `done` 记在 `strategist#1` 自己名下）：

```text
escalate      coder#1        note=strategist=strategist#1 原因=rework 达 max_rounds=2
agent_launch  strategist#1
decision      coder#1        note=strategist=strategist#1 strategy.1.md
done          strategist#1   note=全局方案已出，strategist 收工关 pane
user_decision coder#1        note=用户裁决：继续，按 strategy.1.md 收窄本卡范围
resume        coder#1        note=按 user_decision 与 strategy.1.md 继续
```

用户若选停卡，最后两行换成：

```text
user_decision coder#1        note=用户裁决：停卡，本卡转 backlog
cancelled     coder#1        note=引用上条 user_decision，停卡
```

两种终局都**必须先有 `user_decision`**，`decision_mode=auto` 也不例外。

### 9.4 运行中改计划（blocked → decider 提出改计划 → planner 改计划实例 → 追加节点）

以 `decision_mode=consult`、施工阶段 `DHR_90:C#1` 的 `C1` 节点为例：

```text
blocked   coder#1          note=task_plan 第 3 步依赖的接口不存在，本卡范围内要拆成两步
escalate  coder#1          note=decider=decider#1
agent_launch decider#1     （trigger=on:blocked）
decision  coder#1          note=decider=decider#1 decision.2.md 含「需要改计划」
done      decider#1        note=方案可落地，需改 task_plan 与 relay_plan，decider 收工关 pane
user_decision coder#1      note=approve-amend: 用户同意 decision.2.md（含改计划）

agent_launch planner-amend#1   note=改计划实例，输入 decision.2.md + relay_plan + 开发方案 + task_plan
done      planner-amend#1  note=task_plan 已改；relay_plan 追加 C3/C4，旧 C1 标 superseded-by:C3；lint 通过

plan_amend  monitor#1      note=decision.2.md nodes=C3,C4
resume    coder#1          note=按 decision.2.md 与新 task_plan 继续

  （C3 / C4 落在当前阶段实例 DHR_90:C#1 内，由当班监工直接接手）
  … node_start C3 → … → node_close C4

stage_result monitor#1     note=stage_id=DHR_90:C#1 outcome=done amend=decision.2.md nodes=C3,C4
stage_close  orchestrator#1 note=stage_id=DHR_90:C#1
  （编排读到 amend 摘要 → 重读 relay_plan → 由计划推出下一阶段，不背固定顺序）
```

四条要点：

- **过门沿用现有的门**：这里是 `consult`，所以有 `user_decision`；`auto` 模式这一行不出现，其余完全一样。strategist 触发的改计划**永远**要 `user_decision`。
- **decider 不改文件**，只在 `decision.2.md` 里写改动内容；落笔的是 `planner-amend#1`。
- **`plan_amend` 由监工写**，`agent` 是 `monitor#<n>`，不进状态机；coder 那条链照旧 `decision → user_decision → resume`。
- **`stage_result.note` 带 `amend=` 摘要**，这是编排知道要重读计划的唯一依据。

**「用户否决」分支**：`consult` 模式下用户不同意改计划时，计划一个字都不改：

```text
decision  coder#1          note=decider=decider#1 decision.2.md 含「需要改计划」
done      decider#1        note=方案可落地，decider 收工关 pane
user_decision coder#1      note=reject-amend: 不拆步，先按原 task_plan 用桩接口跑通再说
resume    coder#1          note=按 user_decision 的替代指示继续，计划不改
  （监工不拉改计划实例、不重拉 decider，直接把替代指示 prompt 回同一个 coder#1）
  （账本无 plan_amend，故 stage_result 的 note 不带 amend= 摘要）
```

**「超出范围」分支**：若 decider 提出的改动落进禁区（要改设计方案，或要新增验收条目），改计划实例保持全部计划目标文件与输入方案文件零变化，不写 `blocked` / `escalate` 或 `plan_amend`，只用自己的普通 `done.note` 记录结构化「超出范围」原因后收工；账本形态变成：

```text
agent_launch planner-amend#1  note=改计划实例
done      planner-amend#1     note=outcome=out-of-scope proposal=decision.2.md reason=需新增验收条目，计划目标与输入方案文件均未改
stage_result monitor#1        note=stage_id=DHR_90:C#1 outcome=blocked 改计划超出范围，需用户走 dev-harness
  （编排通知用户等待；无 plan_amend，故 note 不带 amend= 摘要）
```

用户在接力外走 dev-harness A-full／A′（必要时 B-adjust）改完设计与验收，再裁决「继续」。**接回来的动作**：当班监工在**同一阶段实例内**为 `coder#1` **补写一条 `resume`**，coder 按新方案或原 `task_plan` 继续；本阶段跑完后监工**补写 `outcome=done` 的 `stage_result`**，编排再 `stage_close`——这正是 §5.2.1 的 `blocked` 收尾路径，不另设规则：

```text
（用户在接力外改完设计与验收，裁决「继续」）
resume    coder#1          note=用户在接力外补齐设计/验收后裁决继续，见本阶段 stage_result 历史
  … 本阶段跑完 …
stage_result monitor#1     note=stage_id=DHR_90:C#1 outcome=done 用户补齐验收后续跑完成
```

若改动大到计划整体不成立，则重新拉规划 agent 出新计划，旧计划整体按 §4.4 标 superseded。

## 10. 验收样品

### 10.1 relay_plan 示例（跨两张卡，摘录）

```markdown
<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-09 session=app decision_mode=consult recipe=normal cards=DHR_90,DHR_91 -->

## 节点表

| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| W1 | DHR_90 | DHR_90:W#1 | build | agent:plan-reviewer | | |
| C1 | DHR_90 | DHR_90:C#1 | construction | agent:checker | W1 | |
| C2 | DHR_90 | DHR_90:C#1 | construction | agent:checker | C1 | |
| R1 | DHR_90 | DHR_90:R#1 | review | agent:scribe | C2 | |
| F1 | DHR_90 | DHR_90:F#1 | handoff | agent:scribe | R1 | |

## agent 表

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| builder | W1 | builder | | task_plan.md | | |
| plan-reviewer | W1 | plan-reviewer | | review.plan.md | on:review_ready:builder | |
| coder | C1 | coder | zcode | (代码与 findings) | | |
| checker | C1 | checker | | check.C1.md | | |
| scribe | C1 | scribe | | progress.md | on:done:coder | |
| decider | C1 | decider | | decision.1.md | on:blocked | |
```

### 10.2 账本示例 · 运行中快照

```json
{"seq":1,"ts":"2026-09-09T09:00:05+08:00","node":"W1","event":"plan_loaded","agent":"orchestrator#1","by":"orchestrator","note":"skill=0.1.0 config_dir=C:/Users/Alice%20Li/.claude/skills/relay-light plan=docs/modules/dh-relay/relay/wave-2026-09 session=app cards=DHR_90,DHR_91"}
{"seq":2,"ts":"2026-09-09T09:00:10+08:00","node":"W1","event":"stage_start","agent":"orchestrator#1","by":"orchestrator","note":"stage_id=DHR_90:W#1"}
{"seq":3,"ts":"2026-09-09T09:00:40+08:00","node":"W1","event":"monitor_launch","agent":"orchestrator#1","by":"orchestrator","note":"stage_id=DHR_90:W#1 ws=relay-w1"}
{"seq":4,"ts":"2026-09-09T09:01:02+08:00","node":"W1","event":"node_start","agent":"monitor#1","by":"monitor","note":""}
{"seq":5,"ts":"2026-09-09T09:01:20+08:00","node":"W1","event":"agent_launch","agent":"builder#1","by":"monitor","note":"attempt=1"}
{"seq":6,"ts":"2026-09-09T09:40:11+08:00","node":"W1","event":"checkpoint","agent":"builder#1","by":"monitor","note":"ready_for_review=plan-reviewer round=1 七件套齐，task_plan.md 已写"}
{"seq":7,"ts":"2026-09-09T09:40:30+08:00","node":"W1","event":"agent_launch","agent":"plan-reviewer#1","by":"monitor","note":"on:review_ready:builder"}
{"seq":8,"ts":"2026-09-09T10:02:05+08:00","node":"W1","event":"done","agent":"builder#1","by":"monitor","note":"task_plan.md 定稿，送审方先封口"}
{"seq":9,"ts":"2026-09-09T10:02:15+08:00","node":"W1","event":"done","agent":"plan-reviewer#1","by":"monitor","note":"reviewed=builder#1 ready_seq=6 PASS review.plan.md 已读，无 P0"}
{"seq":10,"ts":"2026-09-09T10:02:30+08:00","node":"W1","event":"node_close","agent":"monitor#1","by":"monitor","note":"双判据成立"}
{"seq":11,"ts":"2026-09-09T10:02:35+08:00","node":"W1","event":"stage_result","agent":"monitor#1","by":"monitor","note":"stage_id=DHR_90:W#1 outcome=done task_plan 已过审"}
{"seq":12,"ts":"2026-09-09T10:02:50+08:00","node":"W1","event":"stage_close","agent":"orchestrator#1","by":"orchestrator","note":"stage_id=DHR_90:W#1"}
{"seq":13,"ts":"2026-09-09T10:03:05+08:00","node":"C1","event":"stage_start","agent":"orchestrator#1","by":"orchestrator","note":"stage_id=DHR_90:C#1"}
```

写入者交接看得很清楚：seq 1-3 编排、4-11 监工（末条是 `stage_result`）、12-13 编排。**时间上不重叠**，且收尾四步顺序为 `node_close` → `stage_result` → `stage_close` → 关空间。W 段同时是「待复核」信号的最小形态（RLT-A-09）：seq 6 是 builder 的**非终态**送审信号，seq 7 靠 `on:review_ready:builder` 拉起 plan-reviewer，seq 8 / 9 按**送审方先、判定方后**依次封口，seq 9 的 `reviewed=` 与 `ready_seq=6` 回指它答的是哪一条信号。

**agent_lost 后重拉、attempt +1** 的形态（另一张卡的片段）：

```json
{"seq":48,"ts":"2026-09-09T14:10:02+08:00","node":"C3","event":"agent_launch","agent":"coder#1","by":"monitor","note":"zcode"}
{"seq":49,"ts":"2026-09-09T14:52:30+08:00","node":"C3","event":"agent_lost","agent":"coder#1","by":"monitor","note":"pane 输入通道冻结，弃用"}
{"seq":50,"ts":"2026-09-09T14:53:10+08:00","node":"C3","event":"agent_launch","agent":"coder#2","by":"monitor","note":"重拉，attempt=2"}
```

### 10.3 `status` 输出示例

```text
计划：docs/modules/dh-relay/relay/wave-2026-09/   skill=0.1.0   session=app
卡：DHR_90, DHR_91      decision_mode=consult
当班写入者：monitor（DHR_90:C#1）

阶段 DHR_90:W#1  closed   result=done
阶段 DHR_90:C#1  open     result=—
  节点 C1 construction   open
    不可关：coder#1 无终态事件
    在场 agent：coder#1  最近 checkpoint @ 10:31:12（静默 00:12:40）
  节点 C2 construction   pending
阶段 DHR_90:R#1  pending
阶段 DHR_90:F#1  pending
```

### 10.4 样品与验收对照

| 样品 | 路径 | 覆盖哪条验收项 |
|---|---|---|
| relay_plan 示例 | §10.1 | HC-RL-A24 / HC-RL-A46 / HC-RL-A47 / HC-RL-A87 / HC-RL-A129 / HC-RL-A130 |
| 账本示例 | §10.2 | HC-RL-A37 / HC-RL-A2 / HC-RL-A85 / HC-RL-A89 / HC-RL-A93 |
| status 输出示例 | §10.3 | HC-RL-A43 / HC-RL-A44 / HC-RL-A62 |

## 11. 验收清单

> 分栏依据**验收二分**：机器能完整证明的进 AI 栏，只有需要用户凭业务判断「结果对不对 / 能不能用」的进人验栏。复合观察点已原子化，共享 E-ID 的两条分列两栏。
>
> **共 140 条：AI 自动验收 125 条 + 人类验收 15 条**（2026-09-11 RLT-A-06 退役 A91/A108、续发 A131～A136，AI 净增 4；退役 H2、续发 H18，人验净值 0；2026-09-14 RLT-A-08 续发 A137～A143，AI 净增 7；2026-09-15 RLT-A-09 续发 A144～A150，AI 净增 7，人验净值 0，退役清单不增）。
>
> **已退役且不再复用的 ID**：HC-RL-A1、HC-RL-A3、HC-RL-A4、HC-RL-A6、HC-RL-A20、HC-RL-A22、HC-RL-A23、HC-RL-A25、HC-RL-A64、HC-RL-A86、HC-RL-A88、HC-RL-A90、HC-RL-A91、HC-RL-A108（原子化拆分）；HC-RL-A8、HC-RL-A76、HC-RL-A79、HC-RL-H2、HC-RL-H8、HC-RL-H9（语义或结构调整）。

### 11.1 AI 自动验收栏

| ID | 验收项 | 怎么证明 |
|---|---|---|
| HC-RL-A37 | 纯追加：连续 20 次 `add` 后 `seq` 为 1..20 连续 | 单测断言 seq 序列 |
| HC-RL-A38 | 无重复无覆盖：20 次 `add` 后行数恰为 20，历史行逐字节不变 | 单测比对写入前后前 N 行 |
| HC-RL-A39 | 程序不产生临时文件 | 单测目录快照无新增 `.tmp`；静态检查无 `os.replace` |
| HC-RL-A40 | 程序不加锁 | 静态检查无 `fcntl` / `msvcrt` / `filelock` 类调用 |
| HC-RL-A2 | 账本事件层 19 词白名单 fail closed | 单测：19 个合法词全过；未知词退出码 2 且不落盘 |
| HC-RL-A41 | 枚举比对区分大小写：`NODE_START` 被拒（同源教训库候选-5） | 单测 |
| HC-RL-A42 | 静态守卫：无 `.lower()` / `.casefold()` 用于枚举归一 | 静态 grep |
| HC-RL-A43 | `status` 输出六项齐：当前阶段、当前节点、节点状态、在场 agent 与最近事件时间、可关闭判定、不可关原因 | 单测：喂 §10.2 账本 + §10.1 plan，断言与 §10.3 样张一致 |
| HC-RL-A44 | `status` 措辞只转述账本事实，不含产出合格性判断词 | 静态检查输出模板词表 |
| HC-RL-A5 | **解析级**失败（relay_plan 缺文件、缺 marker、缺表头或表结构不合法）时 `add` / `status` / `lint` **三个子命令均退出码 3** 并给可读原因；计划**已解析成功但违反 lint 规则**时，`lint` 退出 **2**、`add` / `status` 仍退出 **3**；`add` 自身的参数 / 词表 / 时序非法（A59 等）仍退出 2 | 单测：缺文件 / 缺表头 / 缺 marker 三例、三命令各退 3；一条语义违规计划 `lint=2` 且 `add` / `status`=3、拒绝路径账本不增行；节点号重复改由 A46 负例取证，不列为本条示例 |
| HC-RL-A45 | 账本读取或解析失败时 `status` 退出码 **4** | 单测：账本含坏行 / 不可读 |
| HC-RL-A84 | 空账本语义：账本不存在或为空时 `status` / `lint` 退出 0，`current_stage` 与 `current_node` 为 `null`、所有节点 `pending`；`add` 自动建文件且首条非 `plan_loaded` 时退出 2 | 单测：缺文件与空文件各一例；首条写 `node_start` 被拒 |
| HC-RL-A46 | lint：节点号唯一，已 superseded 的号仍占用，重复即拒 | 单测 |
| HC-RL-A47 | lint：`close` 为空或 `agent:<已存在 agent 名>`，其它写法一律拒 | 单测含 `all_agents_done` 反例 |
| HC-RL-A48 | lint：`depends_on` 指向存在节点且不成环 | 单测含成环反例 |
| HC-RL-A72 | lint：`depends_on` 指向 superseded 节点时报错 | 单测 |
| HC-RL-A128 | parser/lint 派生活跃计划时忽略 superseded 行（**本卡核心命题**）；显式例外清单**不增不减**，其中 A46 节点号占用、A72 禁止依赖 superseded、A75 空节点三项由 RLT_03 逐项证明；A120 是**跨卡兼容性引用**，其表尾追加放宽与完整「两正四反」集成取证由 RLT_09 独占，不作为 RLT_03 已实现能力 | 含/不含同一 superseded 行的对照只比较活跃结构与退出码，不比较可能由 A72 降级为 A48 的 lint 规则编号；A46 / A72 / A75 逐项覆盖；RLT_03 已有的「superseded 行隔开通过」保留，由 RLT_09 在 A120 下复验 |
| HC-RL-A73 | superseded 节点没有关闭状态，不进入 `stages`/`nodes`/`agents`、closed 或 pending 派生；只增加 `superseded_ignored`，且不影响 `current_stage`、`current_node` 与活跃节点状态 | 含 superseded 行的完整 status 与删去该行的活跃投影做规范化差分；唯一允许差异是 `superseded_ignored` |
| HC-RL-A75 | lint：每个节点至少一个非 superseded 的 agent，空节点报错 | 单测：零 agent、agent 全 superseded 各一例 |
| HC-RL-A129 | lint：`stage` 值在 `W/C/R/X/F` 枚举内，且**同一阶段的节点按 stage 分组连续**（忽略 superseded 行）〔产品终态，口径即 §3.5 的「连续」行；阶段性交付范围见 §3.5 / §4.3 注记〕 | 单测：非法 stage 值、同 stage 节点被另一**活跃** stage 隔断各一例被拒；合法正例通过并断言规则编号 A129；superseded 行隔开的重现**当前即通过**（基础边界先忽略 superseded）；「同 stage 合法追加落在表尾」的放宽由 RLT_09 按 A120 覆盖 |
| HC-RL-A104 | lint：`stage_id` 格式为 `<card>:<stage>#<k>`，`<stage>` 在枚举内、`<card>` 与本行 `card` 列一致；格式非法或前缀不符时报错 | 单测：格式非法、前缀不符各一例被拒；合法例断言解析出 `card`/`stage`/`k` 三段 |
| HC-RL-A109 | lint：**同卡阶段实例串行**——同一张卡的阶段实例 `depends_on` 链无分叉；跨卡并行允许 | 单测：同卡两阶段并列被拒；跨卡两阶段并列通过 |
| HC-RL-A110 | 阶段实例可重复进入：同卡同 stage 的 `#1` / `#2` 各自独立，各写各的 `stage_result`，`R#1` 的 `failed` 不影响 `R#2` 判定 | 单测：构造 R#1 failed + R#2 done，断言 R#2 的 `stage_close` 被接受 |
| HC-RL-A111 | `open_stages` 派生：所有已 `stage_start` 未 `stage_close` 的实例；跨卡可多个，同卡至多一个 | 单测：跨卡两实例同时 open 断言列表长度 2；同卡两实例同时 open 报警 |
| HC-RL-A112 | 阶段收尾四步顺序（`node_close` → `stage_result` → `stage_close` → 关空间）：**`outcome ∈ {done, cancelled}` 的** `stage_result` 早于该实例末节点 `node_close` 时退出 2（`blocked`/`failed` 的前置见 A137，RLT-A-08 澄清）；`stage_close` 在无 `stage_result` 或最新 `outcome ∉ {done, cancelled}` 时退出 2 | 单测：`done` 顺序颠倒、缺 result、outcome 为 blocked 三例 |
| HC-RL-A105 | `stage_result` 合同：`note` 含 `stage_id=` 与 `outcome=done / blocked / failed / cancelled`；缺字段或非法值退出 2。**同一实例允许多条**，`status` 只认最新一条 | 单测：缺 stage_id、非法 outcome 各一例被拒；连写 blocked→done 断言 status 取 done |
| HC-RL-A118 | `blocked` 收尾路径：最新 `outcome=blocked` 时 `stage_close` 退出 2；补写 `outcome=done` 或 `outcome=cancelled` 后被接受；`cancelled` 的 `note` 必须引用 `user_decision` | 单测：blocked 下 close 被拒；两条终局各一例被接受；cancelled 缺引用被拒 |
| HC-RL-A119 | `plan_amend` 事件校验：`agent` 必须是 `monitor#<n>`（`by=monitor`），`note` 必须同时含方案文件名与 `nodes=<节点号,节点号>`；**不进状态机**，同一 `(node, monitor#<n>)` 可重复出现且不影响 agent 事件配对 | 单测：`agent` 填 `coder#1` 被拒；`note` 缺文件名、缺 `nodes=` 各一例被拒；合法例连写两条均被接受且状态机派生不变 |
| HC-RL-A120 | lint 放宽后仍守得住：同一 stage 的节点**追加在表尾**通过、被 superseded 行隔开通过；而**节点号重复（含已 superseded 的号）仍被拒**，`depends_on` 指向 superseded、跨阶段依赖指向后面的阶段、同卡阶段实例并行也仍被拒 | 单测：两条放宽正例各一；四条未放宽反例各一，断言退出 2 与编号 |
| HC-RL-A121 | 编排开阶段前重读计划：两次调用之间**不修改 `relay_log.py` 代码、不改账本，只修改同一份计划文件，追加新阶段节点行及保持计划合法所必需的对应 agent 行**；再次调用 `status` 后，输出的 `stages` 含该新阶段且顺序正确，下一阶段由计划推导而非固定 `W→C→R→F` | 单测：同一 plan 目录第一次 `status` 后，只在该 `relay_plan.md` 追加 X 阶段节点行及通过 A75 所必需的对应 agent 行，不改代码或账本；再次 `status`，断言 `stages` 多出该实例；构造非 WCRF 顺序的计划断言推导跟随计划 |
| HC-RL-A122 | 改计划白名单（按路径）保持**三类闭集**：改计划实例只允许改 `docs/modules/<模块>/relay/<plan_id>/relay_plan.md`（含其 marker 的 `cards=`）、`docs/modules/<模块>/dev_plan/P<N>-*.md`、以及 `docs/modules/<模块>/workspace/<卡号>/task_plan.md` 且 **`<卡号>` 必须是改动前 marker `cards` 里已存在的卡**；新增卡的 `task_plan.md` 由该卡 W 阶段 builder 建，改计划实例写它即判失败。**`docs/modules/<模块>/design/` 整个目录是禁区**。禁区命中时整份拒绝，全部计划目标文件与输入方案文件均保持零变化，不做部分执行；planner-amend 不写 `blocked` / `escalate` / `plan_amend`，以普通 `done.note` 写 `outcome=out-of-scope proposal=<方案文件名> reason=<原因>`，再由 monitor 写 `stage_result outcome=blocked` | 结构检查：用紧邻本次改计划的 before/after 快照取实际变更集，成功分支断言 actual 与 proposed 精确相等、且集合是三类白名单子集并与 `design/` 前缀无交集；新增卡场景断言不含新卡的 `task_plan.md`。构造允许路径 + `design/01-RelayLight-产品设计与验收.md` 的混合反例，断言预检报错、所有计划目标文件和输入方案文件前后均零变化；账本另断言 planner-amend 只有合法 `done.note`，随后 monitor 的 `stage_result` 为 blocked，且无 planner-amend `blocked` / `escalate` / `plan_amend` |
| HC-RL-A123 | `stage_result` 改动摘要格式：本阶段有 `plan_amend` 时 `note` 必须含 `amend=<方案文件名>` 与 `nodes=<节点号,节点号>`，缺则退出 2；无 `plan_amend` 时不得出现 `amend=` | 单测：有 amend 缺摘要被拒、格式合法被接受、无 amend 却写摘要被拒各一例 |
| HC-RL-A124 | 仓内目录是唯一可编辑源；安装器只有仓内源→两侧副本的单向全量同步。一次同步中途失败后可通过重新执行整套 `--all` 收敛，不要求原子或回滚 | 临时 home 中人为改一侧副本并注入一次五文件复制中途失败，断言失败非零且仓内源未变；再次执行 `--all`，断言两侧五文件均与仓内源一致 |
| HC-RL-A125 | Windows 与 ThinkPad 在同一 clean commit 各执行一次 `--all`，四个用户级目录的五文件哈希全等，四份当前 manifest 的 `source_head` 与五文件源哈希一致 | 两机分别展示命令与退出 0；比对四目录五文件哈希及四份当前 manifest；`source_dirty=true` 不计入本条证据 |
| HC-RL-A106 | 编排机械分路可判定：`status --json` 的 `last_stage_result.outcome` 暴露当前阶段实例**最新** outcome，并派生 `suggested_action` 五枚举之一——`done`/`cancelled` → `open_next_stage`，`blocked` → `wait_user`，`failed` 且 `monitor_relaunch_count` 为 0 → `relaunch_monitor`，`failed` 且已重拉一次 → `notify_user`，其余 → `none`；`failed` 重拉上限为 1 | 单测：四种 outcome 各断言 `suggested_action` 取值；连续两次 failed 断言 `monitor_relaunch_count` 为 1 且动作转为 `notify_user` |
| HC-RL-A107 | **三套**计数独立且不叠加（RLT-A-09 由两套扩为三套）：attempt 达 3、X 阶段轮数达 `max_rounds`、节点内送审轮次达 `limits.rework_max_rounds`，三者各自独立触发 strategist 出口；一方递增不影响另一方计数、不互相重置，**谁先到谁触发** | 单测：只 attempt 超限、只 X 超限、只送审轮次超限、三者都未超限四例，断言触发与否及计数互不影响 |
| HC-RL-A87 | lint：`card` 必须在 marker 的 `cards` 列表中；跨卡计划能解析出多卡 | 单测：card 不在 cards 被拒；两卡计划解析出 `cards` 长度 2 |
| HC-RL-A126 | relay_plan 节点表只含监工派 agent 的节点；lint 拒绝 kickoff 或 verify-signoff 类 `type` | 合法 node type 正例与两类禁止 type 反例，断言 lint 结果及规则编号 A126 |
| HC-RL-A127 | 五阶段模板生成的节点均为监工派 agent 的节点，不生成 kickoff 或 verify 签字节点 | 对五阶段模板逐一生成或读取并断言无禁止 `type`；模板由 RLT_07 落地后取证 |
| HC-RL-A24 | relay_plan 解析规范：两张固定表头表、单元格禁竖线、`agent.node` 存在、同节点 agent 名唯一、`depends_on` 留空即依赖前一节点 | 单测：合法样本解析出预期结构；各反例被拒 |
| HC-RL-A18 | marker 必需且含 `skill=` / `session=` / `recipe=` / `cards=`，缺则 lint 拒绝；**`decision_mode=` 可省，省略时解析为默认值 `auto`**；`plan_loaded` 事件带版本号 | 单测：缺 `skill`/`session`/`recipe`/`cards` 各一例被拒；省略 `decision_mode` 的 plan 通过 lint 且 parser 派生出 `auto`；`plan_loaded` 的 note 含 `skill=` |
| HC-RL-A116 | 档位一致性：`recipe` 值在 `heavy/normal/light` 内；**R 阶段实际挂的 reviewer 集合必须等于该档在 `dh-mapping.toml` 的集合**，不等即 lint 报错 | 单测：三档各一正例；`recipe=normal` 却挂了 code-round2 的反例被拒 |
| HC-RL-A117 | 档位来源：skill 写明档位唯一来自 DevPlan 任务卡 `任务类型` 字段；**字段缺失时规划必须向用户索取，不得默认** | 结构检查 skill 命中该规则原文与「不得自默认」字样 |
| HC-RL-A130 | `decision_mode` 解析与 lint：写了只接受 `auto` / `consult`，其它值 lint 拒绝；未写时 parser 派生 `auto` | 单测：两个合法值、非法值、省略默认各一例；非法例断言 lint 退出码与规则编号 A130 |
| HC-RL-A35 | `trigger` **四态**（RLT-A-09 扩集，原三态取值与语义一字不改）：lint 接受空 / `on:blocked` / `on:done:<名字>` / `on:review_ready:<名字>`，拒绝引用不存在的 agent 名 | 单测：四种合法各一例，`on:done:nobody` 与 `on:review_ready:nobody` 各一例被拒 |
| HC-RL-A71 | `on:done:` **与 `on:review_ready:`** 只允许同节点引用，跨节点报错（RLT-A-09 扩写，原例与判据不变）；该约束同时机械地拒掉没有同节点送审方的节点（R 形态）上的 `on:review_ready:` | 单测：两种前缀各一例跨节点引用被拒；另一例给 R 形态节点的 reviewer 写 `on:review_ready:coder`，断言被本条拒 |
| HC-RL-A65 | 未触发的 agent 不算悬空：`coder` 未终态时 `status` 不把 `scribe` 视为应在场（命题不变；RLT-A-09 只补证据） | 单测；另补一个 `on:review_ready:` 未触发的同款正例 |
| HC-RL-A55 | 账本行固定七字段齐全，`agent` 为 `<名字>#<attempt>` 格式 | 单测 schema 校验 |
| HC-RL-A50 | 配对键为 `(node, agent)`：同名 agent 在两个节点各自配对，互不串 | 单测 |
| HC-RL-A49 | attempt 按 `(node, agent 名)` 计数，每节点从 1 起，跨节点不累计 | 单测：同节点返工 `#1`/`#2`；另一节点同名重新 `#1` |
| HC-RL-A58 | attempt 分配校验：`agent_launch` 的 attempt 必须恰为最大值 + 1，否则退出 2 | 单测：跳号与重号各一例 |
| HC-RL-A51 | 账本不出现 pane ID | 静态检查字段与样例 |
| HC-RL-A85 | 写入者一致性：控制事件的 `by` 必须与法定写入者一致（**`stage_start` / `stage_close` / `plan_loaded` / `monitor_launch` 归 orchestrator；`node_start` / `node_close` / `monitor_restart` / `stage_result` / `plan_amend` 与全部 agent 事件归 monitor**），越权退出 2 并在 `status` 报警（**验一致性不验真伪**，见 §8.2） | 单测：监工写 `stage_start`、编排写 `agent_launch`、编排写 `stage_result`、编排写 `plan_amend` 各一例被拒 |
| HC-RL-A93 | 写入者交接不重叠：编排的写入区间与监工的写入区间在 `seq` 上不交错（编排只在 `stage_close`..下一 `stage_start`/`monitor_launch` 段写） | 单测：对 §10.2 样本断言区间划分；构造交错样本报警 |
| HC-RL-A59 | `add` 入参校验：`node` 在表中且非 superseded、`agent` 名属于该节点（豁免成员**并列四名** `orchestrator#` / `monitor#` / `planner-amend#` / `strategist#`，**仅**豁免「agent 名属于该节点 agent 表」这一条）、`event` 在词表；违反退出 2。状态机与终态封口、写者一致、attempt、各 trigger / 依赖 / `node_start` 前置闸**照常校验** | 单测：四种违反各一例；另断言 `planner-amend#1` 与 `strategist#1` 不在 agent 表时仍被接受，而其在 node 非活跃 / event 越词表 / 前置不成立时**仍按对应编号拒绝** |
| HC-RL-A60 | agent 事件状态机：单 `(node, agent)` 序列合法，终态后不得再有事件 | 单测：非法迁移与终态后追加各一反例 |
| HC-RL-A68 | 节点级控制事件时序：`node_start` 每节点一次且先于该节点任何 `agent_launch`；`node_close` 仅双判据成立时且每节点一次；`monitor_restart` 任意位置 | 单测：前两条各一反例；`monitor_restart` 插多处均被接受 |
| HC-RL-A89 | 阶段级控制事件时序：`plan_loaded` 唯一且居首；`stage_start` 每实例一次且先于本实例 `monitor_launch`；`monitor_launch` 必在本实例 `stage_start` 之后；`stage_close` 要求该实例全部节点 `closed`（`stage_result` 前置另见 HC-RL-A112）；`depends_on` 跨阶段只能指向前面的阶段 | 单测：五条各一反例，断言退出 2 且原因可读 |
| HC-RL-A69 | 事件分类：控制事件的 `agent` 为 `orchestrator#<n>` 或 `monitor#<n>` 且不进状态机；`escalate` / `decision` / `user_decision` 记在被阻塞 agent 名下、决策 agent 标识写进 `note` | 单测：控制事件填普通 agent 名被拒；升级链断言三条事件的 agent 字段 |
| HC-RL-A70 | `on:done:<X>` 前置校验：X 在本节点无 `done` 则退出 2；X 为 `agent_lost` / `cancelled` 同样退出 2 | 单测三例 |
| HC-RL-A77 | `on:blocked` 前置校验：本节点无「最新事件为 `blocked` 或 `escalate` 且未 `resume`」的 agent 时退出 2 | 单测：无阻塞现场、已 `resume` 之后各一例 |
| HC-RL-A78 | 依赖与顺序校验：`depends_on` 未全 `closed` 时写 `node_start` 退出 2；本节点无 `node_start` 时写 `agent_launch` 退出 2 | 单测两例 |
| HC-RL-A17 | 关闭双判据：`close=agent:x` 且 x 已 `done` 但同节点另一 agent 无终态时仍判不可关并列出该 agent；`close` 留空时只用条件 1 | 单测两例 |
| HC-RL-A74 | 条件 2 只认 `done`：`close=agent:x` 而 x 为 `agent_lost` 或 `cancelled` 时判不可关 | 单测两例 |
| HC-RL-A61 | 当前阶段与节点派生：第一个非 superseded 且未 `node_close` 的节点为当前节点，其 `stage` 为当前阶段；依赖未全 closed 为 `pending`，有 `node_start` 为 `open`，无为 `ready` | 单测：三种情形各一例 |
| HC-RL-A81 | `closed` 只读账本：有 `node_close` 即 closed，无则不是；判据成立但无 `node_close` 时 `state` 为 `open`、`closable` 为 true | 单测 |
| HC-RL-A62 | `status --json` schema、排序与计数结构：§3.5 冻结表列出的**顶层与嵌套字段全部存在且键名精确**——顶层 `plan`/`open_stages`/`current_stage`/`current_node`/`last_stage_result`/`suggested_action`/`monitor_relaunch_count`/`pending_nodes`/`superseded_ignored`/`stages`/`nodes`/`agents`/`errors`；`plan`{marker, cards, decision_mode}，其中 `decision_mode` 为 `auto`/`consult`；`stages[]`{stage_id, stage, card, k, state, nodes, result}；`nodes[]`{node, card, stage, type, state, closable, reasons}；`agents[]`{node, agent, last_event, last_ts, idle_seconds}；`stages[].result` 非 `null` 时内部键为 {stage_id, outcome, note, amend, nodes}。空值按表，superseded 行不出现在三个列表，`stages`/`nodes` 按节点表顺序，`agents` 按 `(node, 首次 launch seq)` 顺序 | 单测逐层断言精确键集合、类型、空值与排序；显式 auto/consult 及省略默认三例断言 `plan.decision_mode`；含 superseded 行时只断言列表排除与计数结构，差分等价由 A73 独占；有/无 `plan_amend` 各断言 result 五键 |
| HC-RL-A63 | 错误统一写 stderr，格式 `error: <code> <message>` | 单测：捕获 stderr 断言格式；stdout 无错误文本 |
| HC-RL-A80 | `lint` 合同：签名与退出码 0/2/3；违反项每条一行写 stderr，格式 `lint: <规则编号> <message>` 且编号为验收项 ID；`--json` 输出 `{"ok","violations":[{"rule","message","line"}]}` | 单测：三种退出码各一例；断言行格式与编号取值；`--json` 逐字段断言 |
| HC-RL-A94 | lint 规则编号全覆盖：§3.5 映射表列出的每条规则都能被触发，且报出的编号存在于本验收表 | 单测：逐规则构造反例，断言编号集合 ⊆ 验收 ID 集合 |
| HC-RL-A56 | `add` 退出码 0 / 2 / 3 / 4 四种形态各自可复现 | 单测四例 |
| HC-RL-A131 | `split-from: HC-RL-A91`；`roles.toml` 可由 `tomllib` 加载，角色键与 §6.3 的 11 个角色精确相等，每个角色均有 `model` 与 `launch` | 单测加载完整配置并断言精确角色集合与键集合 |
| HC-RL-A132 | `split-from: HC-RL-A91`；skill 核心、adapter、五阶段模板与流程说明不硬编码模型名，只引用角色名 | 只扫描 `SKILL.md` 与两个 adapter，排除 TOML；对当前冻结闭集 `{opus, gpt-5.6-terra}` 做大小写不敏感词边界匹配，前后不得是 ASCII 字母、数字、`.` 或 `-`；档位词与 `claude/codex/zcode/herdr:codex` 等启动器/通道名排除。闭集随 §6.3 模型变化由未来 A 事件同步，不由施工者临场扩充 |
| HC-RL-A92 | `dh-mapping.toml` 可加载并承载四类内容：阶段↔dh 节点、三档 Recipe 的 reviewer 列表、`limits`、`on_exceed`；样例见 §6.3 | 单测加载并逐项断言；断言 `stages.R.dh_nodes` 含 E0/E1/E2/E3/E4/E5/E6/E14，且 E11/E12/E13 不出现在任何阶段 |
| HC-RL-A115 | Recipe 三档的 reviewer 集合严格对齐 dev-harness 节点表的 `task_type` 派生：heavy = code-round2 + requirement + lesson + consistency；normal = requirement + lesson；light = lesson + consistency。**权威取值只在 `dh-mapping.toml`**，设计正文与 §6.2 不复述 | 单测逐档断言集合相等；静态检查 §6.2 未复述具体路数 |
| HC-RL-A99 | 配置读取与返工上限：把 `limits.rework_max_rounds` 从 2 改成 3 后，X 阶段模板生成的返工节点数随之改变，`relay_log.py` 无需改动。**模板生成是 lint 与 skill 的内部实现，不新增公共 CLI 子命令**——前四批对外仍只有 `add`/`status`/`lint`。**配置定位按 §6.2.1**：显式 `--config-dir` 优先于默认目录；`plan_loaded.note` 必须含 `config_dir=` 与 `plan=` | 单测：经内部接口按两种配置各生成一次，断言节点数；`git diff` 对 `relay_log.py` 为空；断言 CLI 子命令集合仍为三个；显式目录与默认候选同时存在时读前者；断言 note 两键齐全 |
| HC-RL-A133 | `split-from: HC-RL-A108`；`SKILL.md` 五阶段模板的 C 节点默认 agent 行包含 checker，trigger/close 继续服从 A95 | 与 A95 共用正式模板 fixture，本条只断言 checker 默认存在 |
| HC-RL-A134 | `split-from: HC-RL-A108`；任意结构合法的 C 计划删去 checker 后，`close` 留空或改指 scribe 时仍通过 lint，且 status 不把缺席 checker 当悬空 | 用两份只差 checker/close 的合成 plan 分别跑 lint 与 status |
| HC-RL-A135 | 三个子命令均接受 `--config-dir`；直调未显式传入时按 §6.2.1 五情形判定；显式值展开 `~`、规范化为绝对路径并百分号编码记入 `plan_loaded.note` | 验证三个 help、Claude-only、Codex-only、双侧、零侧及含空格/非 ASCII HOME/USERPROFILE 的 `~/...` 路径；解码后精确等于规范化绝对路径；双侧/零侧均 rc=3、错误 A135 且账本不增 |
| HC-RL-A136 | 两份 adapter 中调用 `relay_log.py add/status/lint` 的每个命令模板都显式带本侧默认安装副本的 `--config-dir` | 枚举两份 adapter 的全部 Windows/Linux 调用；每个都指向本侧，三子命令各至少出现一次 |
| HC-RL-A95 | 场景一模板：C 节点含 coder + checker + scribe + decider；**coder 与 checker 的 trigger 均留空**（批内同时在场），scribe 为 `on:done:coder`，decider 为 `on:blocked`；`close=agent:checker` | 单测：模板过 lint 并断言四个 agent 的 trigger 与 close |
| HC-RL-A102 | 批内往返不加 attempt：同一 `(node, coder)` 连续多条 `checkpoint` 后仍是 `#1`，账本无第二条 `agent_launch` | 单测：三轮 checker 往返，断言 attempt 恒为 1 且 `agent_launch` 仅一条 |
| HC-RL-A113 | attempt 只因实例挂掉而增：本节点 `agent_lost` / `cancelled` / 阶段 `failed` 之后重拉才接受 `attempt+1` 的 `agent_launch`；无这三种前因时第二条 `agent_launch` 退出 2 | 单测：三种合法前因各一例被接受；无前因一例被拒 |
| HC-RL-A103 | 节点级返工才换实例：X 阶段节点的 coder 是该节点的 `#1`，与 C 阶段同名 coder 互不影响；C 节点内不产生第二个 coder 实例 | 单测：跨 C/X 两节点断言各自 `#1`；C 节点内第二条 coder `agent_launch` 被拒（attempt 校验） |
| HC-RL-A114 | 两条决策链顺序：**decider 链** `blocked`→`escalate`→`decision`→`resume` 为固定序，`consult` 缺 `user_decision` 就写 `resume` 退出 2、`auto` 出现 `user_decision` 退出 2；**strategist 链** `escalate`→`agent_launch strategist#n`→`decision`→`done strategist#n`→`user_decision`→(`resume` 或 `cancelled`)，其中**决策类事件（escalate/decision/user_decision/resume/cancelled）记在触发时最后一个 X 阶段 coder 名下，生命周期事件（agent_launch/done）记在 `strategist#n` 自己名下**，**`user_decision` 永远必需（含 `auto` 模式）**，缺它写 `resume`/`cancelled` 退出 2；strategist 链允许 `escalate` 作链首、无 `blocked` 前置 | 单测：decider 链两种模式各一正例一反例；strategist 链在 `auto` 下断言缺 `user_decision` 被拒、两种终局各一正例、无 `blocked` 起头的 `escalate` 被接受；逐事件断言归属——五条决策事件的 `agent` 为该 coder，`agent_launch` 与 `done` 的 `agent` 为 `strategist#1` |
| HC-RL-A96 | 场景二分路：`decision_mode=auto` 时账本序列不含 `user_decision`；`consult` 时 `decision` 之后必须先有 `user_decision` 才接受 `resume`；**两种模式下 `resume` 都记在原 coder 名下且不新增 `agent_launch`** | 单测：两种模式各构造一条序列；auto 例断言接受、consult 例断言缺 `user_decision` 时 `resume` 退出 2；两例均断言 coder 仍为 `#1` |
| HC-RL-A97 | 场景三超限：X 阶段达到 `max_rounds` 后再开一轮 X 被 lint 拒绝；strategist 链的结论**必须经 `user_decision`** 才能走 `resume` 或 `cancelled`，`decision_mode=auto` 亦然；事件归属分两类——**决策类事件（`escalate`/`decision`/`user_decision`/`resume`/`cancelled`）记在触发时最后一个 X 阶段 coder 名下，`agent_launch` 与 `done` 记在 `strategist#n` 名下** | 构造其它结构均合法、唯一违规为 X 轮数超限的合成 plan，断言 lint 退出 2 且精确报 A97；auto 下断言缺 `user_decision` 的两终局均被拒；断言事件归属 |
| HC-RL-A98 | 计划与账本落点 `docs/modules/<模块>/relay/<plan_id>/`，不在任一卡的任务工作区内 | 结构检查路径；静态检查 skill 与模板无「计划放 workspace」表述 |
| HC-RL-A100 | 术语统一：全文与 skill 中「终端空间」指 Herdr workspace、「任务工作区」指 dev-harness 目录，无混用 | 静态检查：`workspace` 一词在中文语境下不单独出现，两术语各自命中 |
| HC-RL-A11 | 测试经薄壳 `tools/tests/relay-light-log.ps1` 登记进 `$suites` 并全绿 | 跑 `run-relay-tests.ps1` 全量，展示退出码与套件名 |
| HC-RL-A15 | Python 测试可脱离 pwsh 直跑（Linux 回归入口） | `python3 -m unittest` 直跑，展示退出码；与 HC-RL-A11 同一份测试文件 |
| HC-RL-A16 | 账本程序只用标准库 | 静态检查 import 全在标准库清单内 |
| HC-RL-A12 | skill 五件齐且落点正确：`SKILL.md` + 两个 adapter + `roles.toml` + `dh-mapping.toml`；核心含角色表 / 五阶段模板 / 账本用法 / 拓扑布局 / 硬规则 / 放弃项 | 结构检查文件存在 + 按小节标题清点 |
| HC-RL-A32 | 当前机器两个派生副本的五文件各自与仓内唯一源 `tools/relay-light/skill/` 逐字节一致 | 以仓内源为基准逐文件比对两侧哈希 |
| HC-RL-A33 | 仓内 `AGENTS.md` 阅读矩阵含指向 relay-light skill 的索引行；dev-harness 未被改动 | 结构检查 + `git diff` 对 dev-harness 仓为空 |
| HC-RL-A19 | skill 核心含「Linux 收口前直跑 python 测试并原样贴进 progress.md」硬规则 | 结构检查命中；Linux 实跑卡的 `progress.md` 含原样命令与退出码 |
| HC-RL-A21 | 两适配层都写明「wait 返回时必须有接收者」及三种满足方式；监工与编排的 prompt 模板含该硬规则原文 | 结构检查 + grep 两份模板 |
| HC-RL-A26 | 命令模板冻结（Windows `python` / Linux `python3` / 远程 `bash -lc`）写进适配层；适配层含 claude kind 的 `pane run` + `rename` 起法与 `agent_prompt_stalled` 处理 | 结构检查按条目清点 |
| HC-RL-A27 | 密钥红线以**规则**落地：派活 prompt 模板与 skill 核心均含「不得把凭据值写进 note / progress / decision」禁令原文 | 结构检查两处命中；grep 已知凭据模式仅作 smoke |
| HC-RL-A28 | AGENTS.md 新增 relay-light 编排协议段，且现有 Runner 铁律已标「冻结流水」 | 结构检查 |
| HC-RL-A34 | 流水判定：监工 prompt 模板首行含 `[relay-light] worker · node … · agent …#… · workspace …` 标头；AGENTS 段含「见此标头即完成即停不等 node_closed，有 RELAY_RECEIPT 即冻结 Runner 流水」判定句 | 结构检查首行格式 + grep AGENTS 段 |
| HC-RL-A29 | 模块身份落地：slug、`docs/modules/relay-light/`、`tools/relay-light/`、verify scope 英文 `relay-light`；AGENTS 的「本仓只有一个模块」与 `dh` 自动选模块描述已同步改 | 结构检查 + `dh relay-light` 能解析 |
| HC-RL-A66 | 变体规则写进 skill：coder 收工小结固定四行且缺项写「无」；scribe 的三条素材来源与优先级；scribe 不碰 findings / lesson_candidates 且不得发明 | 结构检查命中四行模板与硬约束原文 |
| HC-RL-A67 | 职责唯一形态：`findings.md` / `lesson_candidates.md` 写入者解析为 coder，`progress.md` 解析为 scribe | 单测断言职责映射 |
| HC-RL-A82 | `watch` 重挂规则：发通知后不立即重挂，改为每 30 秒 `herdr agent get` 轮询；账本出终态则停止盯，Herdr 回 `working` 则重挂；同一 `(agent, 状态)` 转换只通知一次 | 单测（打桩 herdr）：断言无立即重挂、两条退出路径、去重 |
| HC-RL-A83 | `watch` 维持 20 分钟兜底：每 20 分钟发 `[relay-light] tick`；无 watch 时该节拍由前台 `wait --timeout 1200000` 维持；编排层 watch 在末阶段 `stage_close` 后退出 | 单测（打桩时钟）断言 tick 周期与退出条件；结构检查适配层写明归属 |
| HC-RL-A101 | `watch` 只通知不写账 | 静态检查 `watch` 代码路径无写账调用 |
| HC-RL-A13 | 持久化产物退场路径在设计与实现中均已声明（§12） | 结构检查：设计有 §12；`status` 不做任何自动删除 |
| HC-RL-A14 | 现役 dh-relay 未被改动 | `git diff --stat` 对 `tools/runner/` `tools/host/` `tools/contracts/` 为空 |
| HC-RL-A30 | **〔E-链路〕** 一份真计划跑完后：全部阶段 `stage_close`、全部节点 `closed`，每条 `agent_launch` 都有配对终态事件，无悬空 agent | 实跑后 `status --json` 断言 |
| HC-RL-A31 | **〔E-账本〕** 账本每行过 schema 校验，事件顺序满足状态机与阶段时序偏序 | 对实跑账本跑校验脚本 |
| HC-RL-A137 | `clarifies: HC-RL-A112`；`stage_result` 分 outcome 校验节点关闭：`done`/`cancelled` 仍要求本实例全部节点 `closed`（A112）；`blocked`/`failed` 允许节点未关，但 `note` 必须含 `ref=<agent>#<n>:blocked` 或 `ref=<agent>#<n>:agent_lost` 且该引用在本实例内存在、为该 agent 最新事件；缺 `ref=`、引用不存在或引用已被 `resume`/终态覆盖均退出 2 并报 A137 | 单测：节点未关时 `blocked`+合法 ref 接受、`done` 仍拒 A112；三种非法 ref 各一例退出 2 报 A137；`stage_close` 对 `blocked` 仍拒 A118 |
| HC-RL-A138 | 环境性 NOT_RUN 出口：同一 `(node, agent)` 连续 `attempt_max` 条 `agent_lost` 且 `note` 均含 `NOT_RUN` 后，第 `attempt_max+1` 条 `agent_launch` 被拒（A107 attempt 止损）；此时 `stage_result outcome=blocked ref=<agent>#<attempt_max>:agent_lost` 被接受。**新预算只能由用户开**：编排把 blocked 交用户后，监工以该 agent 名下一条 `user_decision`（`note` 含 `launch_fix=<token>`）记录裁决，随后带同一 `launch_fix=<token>` 的 `agent_launch` 才被接受，attempt 继续递增，止损对该 token 组重新计 `attempt_max`；**每条 `user_decision` 只授权一个 token，每个 `(node, agent)` 最多一个 `launch_fix` 组**（总预算 ≤ 2×`attempt_max`），无授权引用、token 不一致或第二组均退出 2 | 单测：三连 NOT_RUN 后第四条无授权拒；`user_decision launch_fix=bypass_sandbox` 后同 token `#4` 接受、异 token 拒；第二组 `user_decision` 拒；`status` 不可关原因列出 `NOT_RUN` 计数与 fix 组 |
| HC-RL-A139 | `launch_fix=` 记账：`agent_launch.note` 可含 `launch_fix=<token>`；`add` 不校验其与计划 `launch` 列的关系、不要求 `plan_amend`；`status --json` 在该 agent 条目暴露 `launch_fix` 字段（无则为 null） | 单测：带/不带 `launch_fix` 各一例，断言 `status --json` 字段；lint 不因 launch 列与账本不一致报错 |
| HC-RL-A140 | 静默超时配置：`dh-mapping.toml` 的 `limits.silence_timeout_min` 可加载（默认 30）；`status` 只按**账本**最近事件计算静默，超过该值时该 agent 行标 `ledger_silent` **提示**（不是挂死判定）；skill 核心与两份 adapter 的监工模板含「`ledger_silent` → 核 Herdr 状态 + pane 末行 + 允许路径产出三者是否也无变化 → 三者均无变化才中断并记 `agent_lost silent_timeout` → 同 pane 重拉 `#n+1`；任一仍在变化不得中断」原文 | 单测：打桩时钟断言提示出现/不出现；结构检查三处模板命中「三者均无变化」与「不得中断」两句 |
| HC-RL-A141 | 派活提交与等待纪律写进两份 adapter：`agent start` 后 `wait --until idle` 再 `prompt`，prompt 后读取 pane 末行确认已提交（未提交则 `send-keys Enter` 一次并复核）；编排等待优先用账本文件事件监听，附「监工连续空闲 ≥2 分钟且无新账本行」告警；沙箱型只读启动不可用时的替代（bypass 沙箱 + 提示词只读约束 + `launch_fix=`）写进 adapter 环境预检 | 结构检查两份 adapter 各命中三段原文 |
| HC-RL-A142 | `decision_mode` 模式门与 `cancelled` 归属闸在 `add` 路径实现：`consult` 下 `decision` 后无 `user_decision` 即写 `resume` 退出 2；`auto` 下 decider 链出现 `user_decision` 退出 2；`cancelled` 进入决策类归属校验（A69），非触发 agent 名下的 `cancelled` 退出 2 | RLT_07 钉住的两条 `@unittest.skip` 负例去 skip 即绿；新增 `cancelled` 归属正反各一例 |
| HC-RL-A143 | light 档 plan-review 分级（用户 2026-09-14 裁决 C）：skill 核心的 plan-reviewer 模板写明——纯措辞/格式/引用陈旧项一律 P2、不阻断 PASS；allowed-paths、写入者边界（谁写 progress/findings/lesson）、节点/阶段边界、验收命令与完成信号缺失或矛盾仍为 P1 阻断；模板附「light 只按此分级，heavy/normal 不变」 | 结构检查：模板命中「P2 不阻断」与四类 P1 原文；预演 `review.plan.md` 两轮 P1 按新分级重判可复算为 **3 P1 + 2 P2**（RLT-A-10 修订期望值）——该数是按冻结四类**逐条计级**得出：每一条独立发现项各自判级，**不做同根去重、不对残留项折级**（原期望 1 P1 + 4 P2 只在未冻结的归并口径下成立，已撤销）。逐条计级明细见 [`workspace/RLT_21/findings.md`](../workspace/RLT_21/findings.md) F-009 |
| HC-RL-A144 | `on:review_ready:<S>` 拉起前置（RLT-A-09 新增；A70 保号、语义一字不改，本条独立承接新 trigger）：写 `agent_launch <Rv>#<n>` 且其 trigger 为 `on:review_ready:<S>` 时，本节点须存在一条 `checkpoint`——其 `agent` 为 `<S>` 在本节点的**当前实例** `<S>#<a>`（该名下最大 attempt），其 `note` 的 `ready_for_review=` 值**恰等于 `<Rv>`**，且该 `checkpoint` 是 `<S>#<a>` 这个**实例的最新 agent 事件**（按实例判，不按名字跨 attempt 判）；由此 `<S>#<a>` 必未处于终态。任一不成立退出 2 并报 `HC-RL-A144` | 单测：合法一例被接受；九条拒绝例各断言退出 2 且编号为 A144——`<S>` 只有不带 token 的普通 `checkpoint`；`<S>` 在本节点无任何事件；`<S>` 已 `done`；已 `agent_lost`；已 `cancelled`；token 指向另一个判定方（`ready_for_review=requirement` 却拉 `lesson`）；旧 attempt 重放（`coder#1` 发信号后 `agent_lost`、`coder#2` 重拉 live，用旧信号拉起）；信号被后续普通 `checkpoint` 覆盖；信号之后写了 `blocked`。另断言同一 `<Rv>` 的重复 `agent_launch` 由 A58 / A49 拦下，编号**不是** A144 |
| HC-RL-A145 | 送审信号写入合同（RLT-A-09 新增）：`checkpoint` 的 `note` 含 `ready_for_review=` 时——该前缀的 token **恰好一个**（≥2 直接退出 2，因 `_note_tokens` 只保留首个、多写会静默丢失）；`<Rv>` 须在**本节点** agent 表中存在且其 `role` ∈ 判定角色闭集 `{plan-reviewer, checker, reviewer}`；写入者自身不得是判定角色（判定方不给自己送审）；该 `checkpoint` 不伴随 `agent_launch`、不增 attempt。三个新 token（`ready_for_review=` / `reviewed=` / `ready_seq=`）**不是** A69 的 helper token，不进决策归属扫描集。**`add` 层不设轮次硬上限**，上限由 A147 以只读投影承担 | 单测：合法一例被接受；两个同名 token、`<Rv>` 不在本节点、`<Rv>` 的 role 不在闭集、判定角色给自己送审各一例退出 2 报 A145；连续 N 条信号（N > `rework_max_rounds`）均被 `add` 接受，断言 attempt 恒为 1 且 `agent_launch` 仅一条（与 A102 共用 fixture，本条只断言不被拒）；同一 note 内 `ready_for_review=` 与 `decider=` 并存时断言 A69 只认后者 |
| HC-RL-A146 | 判定方封口配对闸（RLT-A-09 新增；**执行位点是写 `done` 时的语义校验，不在 `node_close` 兜底**）：**当且仅当本节点存在至少一条指向该判定方的 `ready_for_review=` 信号时生效**。生效时，`role` ∈ 判定角色闭集的 agent 写 `done` 须满足——`note` 含 `reviewed=<S>#<a>` 与 `ready_seq=<n>`；`<n>` 指向的事件是一条 `checkpoint`，其 `agent` 字段**逐字等于** `<S>#<a>` 且其 `ready_for_review=` 值等于 `<Rv>`（杜绝旧实例信号与新实例 `reviewed=` 拼接）；该条是 `(node, <S>#<a>, <Rv>)` 组合下**最新**的一条 ready 信号；`<S>#<a>` 在本节点**已 `done`** 且其 `seq` **早于**本条。任一不成立退出 2 并报 `HC-RL-A146` | 单测：正序一例被接受；缺 `reviewed=`、缺 `ready_seq=`、`ready_seq` 指向旧轮次信号、指向他人信号、跨实例拼接（`ready_seq` 指向 `coder#1` 的信号而 `reviewed=coder#2`）、`<S>#<a>` 尚未终态、`<S>#<a>` 为 `agent_lost` 各一例退出 2 报 A146；**不生效正例**：R 形态（节点内无任何指向该 reviewer 的信号）下 reviewer 直接写 `done` 被接受，证明闸不误伤 R 与旧计划；**多路正例**：X 节点两路各绑各的 `ready_seq`，一路两轮一路一轮，两路 `done` 均被接受；**位点证明**：断言错误在写 `done` 时返回而非等到 `node_close`，且该 `done` 不落账、账本行数不变 |
| HC-RL-A147 | 第三套止损计数（RLT-A-09 新增；**只投影、不拒写**）：`loss_stop()` 新增 `review_rounds[(node, 判定方)]` = 该组合下的 ready 信号条数（**首轮计入**），`review_exhausted` 判据为「条数 ≥ `limits.rework_max_rounds` 且该判定方在本节点仍无 `done`」；耗尽时 `LossStop.triggered` 为真，出口为监工拉 strategist → `escalate` 作链首 → 交用户裁决（A97 / A114 不变）。**不新增配置键、不改取值**；`add` 不因轮次拒绝任何写入 | 单测：`rework_max_rounds` 取 2 与 3 两种配置，**同一实现**分别断言耗尽发生在第 2 条与第 3 条未通过的信号处；断言超限后第 N+1 条 ready 仍被 `add` 接受且账本增行；断言耗尽后 strategist 链可正常以 `escalate` 起头；断言三套计数互不叠加、互不重置（与 A107 共用 fixture） |
| HC-RL-A148 | 向后兼容（RLT-A-09 新增；trigger 词表是**扩集不是替换**）：`on:done:<X>` 的 lint 与运行时语义与 A70 逐字一致，旧计划与已落盘账本原样通过、不需迁移；**R 模板与一切不存在 ready 信号的节点不受 A146 影响**（A146 的生效条件给出结构性保证）；同一节点内**混用** `on:done:` 与 `on:review_ready:` 两种 trigger 均被接受，两路各按自己的前置被校验；`lint` 不对 `on:done:` 报错，也不报「建议迁移」（lint 只有 0 / 2 / 3 三个退出码，无警告通道） | 单测：`rlt12-win-01` 的 `relay_plan.md` 原样过 lint 且退出 0；该计划的账本 71 行原样重放，断言逐条被接受、R 段不触发 A146；一份混用两种 trigger 的合成 plan 过 lint 并跑通一条完整账本，`on:done:` 那路按 A70 判、`on:review_ready:` 那路按 A144 判，各构造一个反例断言编号不串 |
| HC-RL-A149 | 模板与 adapter 同步（RLT-A-09 新增；适用范围 = 送审方与判定方同处一个节点的 **W / C / X**，**R 不适用**）：`SKILL.md` 的 **W 阶段模板**中 plan-reviewer 的 trigger 由 `on:done:builder` 改为 `on:review_ready:builder`；**X 阶段模板**中被打回那路 reviewer 的 trigger 由 `on:done:coder` 改为 `on:review_ready:coder`；**C 阶段模板** trigger 列不改（checker 仍留空，A95 一字不改）但补「PASS 前不记 done」纪律原文；**R 阶段模板一字不改**。`SKILL.md` 硬规则段与两份 adapter 的监工模板各含「判定方判定 PASS 前，送审方与判定方均不记 `done`；FAIL 走 live 判定方的 `checkpoint` 路由回同一送审方；PASS 后按送审方→判定方顺序记终态」原文 | ①结构检查：五阶段模板逐一读取，断言 W 的 plan-reviewer 行与 X 的 reviewer 行取新 trigger、C 的 checker 仍留空、**R 三行与现状逐字一致**；`SKILL.md` 与两份 adapter 三处各命中该段原文。②最小账本序列测试：对 W、C、X 各跑一条合成账本，覆盖三种情形——判定方 `agent_lost` 后按 A49 合法重拉并重新消费新信号；一路 FAIL 后由**同一实例**复审至 PASS（断言无第二条 `agent_launch`）；X 两路中一路 FAIL 一路 PASS 时，另一路不被重拉也不被提前封口 |
| HC-RL-A150 | lint 覆盖新 trigger（RLT-A-09 新增）：`trigger` 四态——空 / `on:blocked` / `on:done:<名字>` / `on:review_ready:<名字>`，非法值与引用不存在的 agent 名均拒（A35 承接）；`on:review_ready:` 与 `on:done:` 同样**只允许同节点引用**，跨节点报错（A71 承接） | 单测：四种合法 trigger 各一正例；`on:review_ready:nobody`、跨节点引用、拼写变体（如 `on:review-ready:`）各一反例，断言编号分别为 A35 / A71 / A35；**R 形态反例**：给一个没有同节点送审方的节点的 reviewer 写 `on:review_ready:coder`，断言被 A71 拒——这是「R 不适用本修订」的机械证据；另断言 §3.5 的 lint 规则映射表中 `on:review_ready:` 的两行（分别咬 A35 与 A71）存在 |

### 11.2 人类验收栏

| ID | AI/你做什么验证动作 | 对话里展示什么证据 | 你判断什么 |
|---|---|---|---|
| HC-RL-H1 | **〔E-链路〕** 在 Windows 用 **Claude Code 主控**跑完一份真计划（W→C→R→F）；Claude adapter 显式传 Claude 默认安装副本 | relay_plan 全文、账本全文、`status` 两次输出、产出文件清单、adapter 命令、账本 `config_dir=` 的解码绝对路径 | 这套接力是否真的比手动派活省事、值不值得继续用 |
| HC-RL-H13 | **〔编排形态〕** 展示编排 + 按阶段监工的实跑形态 | 编排 pane 的操作序列、各阶段终端空间的建立与关闭、账本里 `by` 的交接段落 | 三层结构（编排→监工→agent）是否顺手；编排会不会成为新瓶颈；阶段换监工是否真的比全程一个监工好 |
| HC-RL-H18 | `supersedes: HC-RL-H2`；在 Windows 用 **Codex 主控**跑同样一份计划，Codex adapter 显式传入 Codex 默认安装副本的 `~/...` 路径 | relay_plan 全文、账本全文、`status` 两次输出、产出清单、两次五文件哈希、账本编码后的 `config_dir=` 及解码绝对路径、adapter 命令与默认副本路径；证明未使用 fixture | 换主控后是否只靠 adapter 跑通，核心有没有被迫改；默认安装副本是否可直接协作 |
| HC-RL-H3 | 在 ThinkPad（Linux）用 **Claude Code 主控**跑一份计划；Claude adapter 显式传 Claude 默认副本 | relay_plan/账本全文、`status` 两次输出、产出清单、adapter 命令、`config_dir=` 解码路径、默认副本哈希与 `python3 -m unittest` 退出码 | Linux 侧用起来是否与 Windows 一致 |
| HC-RL-H4 | 在 ThinkPad（Linux）用 **Codex 主控**跑一份计划；Codex adapter 显式传 Codex 默认副本 | relay_plan/账本全文、`status` 两次输出、产出清单、adapter 命令、`config_dir=` 解码路径与默认副本哈希 | 四组合矩阵是否都能实际交付 |
| HC-RL-H5 | 展示 `status` 输出 | §10.3 形态的真实输出 | 你能否只看这一屏就判断「现在哪个阶段、轮到谁、卡住没有、多久没动」 |
| HC-RL-H14 | **〔场景一〕** 走一遍批次施工 + 方向评估，含至少一次「偏离 → 送回同一 coder 修 → checker 通过」的往返 | 该批的 `checkpoint` 序列、check 文件、coder pane 的两轮小结 | checker 的方向评估是否真能拦住跑偏；批内不换人是否保住了 coder 的上下文；每批一个高档 checker 会不会太贵 |
| HC-RL-H6 | **〔场景二〕** 走一遍 blocked → decider，`auto` 与 `consult` 各一次 | 两条事件链 + `decision.<n>.md` | 两种模式各自的手感；默认该用哪个 |
| HC-RL-H15 | **〔场景三〕** 走一遍复核 → 返工 → 超限 → strategist → 你裁决 | X 阶段轮次账本、全部 review、strategist 结论 | 轮数上限 2 是否合适；strategist 的输入够不够它做全局判断 |
| HC-RL-H16 | **〔改计划·卡内追加节点〕** 实跑 §9.4 那条链：施工 `blocked` → decider 提「需要改计划」→ 过门 → `planner-amend` 在**当前阶段实例内追加节点** → **当班监工直接接手**跑完 | 方案文件、改计划前后的 `relay_plan` diff、`plan_amend` 与带 `amend=` 摘要的 `stage_result`、监工接手新节点的账本片段 | 卡内追加这条路顺不顺；agent 自己改任务卡与开发方案（绕过 B-adjust）你是否放心；禁区的「超出范围 → 交你」拦得住不 |
| HC-RL-H17 | **〔改计划·新增任务卡追加阶段〕** 实跑新增一张任务卡：`planner-amend` 改开发方案 + marker `cards` + 追加该卡的 W／C／R／F 阶段行 → **编排开到新 W 阶段时才拉监工**，builder 照常建七件套 | 开发方案与 marker 的 diff、追加的阶段行、编排开出新阶段的账本片段、新卡任务工作区的建立记录 | 跨卡追加时编排能不能正确开出新阶段；「七件套不由改计划实例建」这个分工是否顺手 |
| HC-RL-H7 | 在受控 `--config-dir` fixture 中只改 `roles.toml` / `dh-mapping.toml` / 明确模板片段调整一次协作方式，不改核心或两个 adapter | fixture 从当时仓内五文件复制；展示差异白名单、核心/双 adapter 哈希不变及新计划 relay_plan | 「改协作 = 改配置」是否真的成立 |
| HC-RL-H10 | **〔E-账本〕** 只给你账本，不给别的 | `relay_log.jsonl` 全文 | 你能否只凭它还原出当时发生了什么、卡在哪、谁救的场 |
| HC-RL-H11 | **〔watch 实测〕** 监工正在 `working` 时 watch 发来的 prompt 是否被排队而非丢弃——Claude Code 与 Codex **分别验** | 两种监工各自：制造 working → 触发推送 → 展示收到时刻与内容 | 推送在忙时是否可靠，要不要退回前台循环 |
| HC-RL-H12 | **〔watch 实测〕** watch 进程死亡后 20 分钟兜底是否接住 | 杀掉 watch → 展示下一次例行查看的时刻与发现 | 兜底是否兜得住，20 分钟是否可接受 |

## 12. 持久化产物与退场路径

| 产物 | 谁删 | 何时删 | 删失败怎么办 |
|---|---|---|---|
| `relay_log.jsonl` 与 `relay_plan.md` | 不删 | 落在 `docs/modules/<模块>/relay/<plan_id>/`，随模块文档永久保留 | N/A |
| `decision.<n>.md` / `check.<节点>.md` | 不删 | 随任务工作区合入保留 | N/A |
| `review.<路径>.md` / `progress.md` / `findings.md` | 不删 | 同上 | N/A |
| 阶段的终端空间与 pane | 监工 / 编排 | agent 干完关 pane；阶段结束编排关整个终端空间 | 报错交人，不强删 |
| 编排的终端空间 | 人 | 全计划结束后关 | 同上 |
| worktree | 人 / 主 session | 收口 squash 合入后删树（沿用 AGENTS 宪章）；**先关终端空间再删树** | 顺序反了会留占用，报错交人 |

程序**不产生临时文件**（纯追加），无临时文件回收问题。「只写不删」是**显式选择**：账本与决策文件每计划几百行文本，量级不构成容量风险，且是复盘唯一证据。

## 13. 边界与放弃项

**不做**：

- 节点边界的物理拦截，也不做写入者身份校验（§8.2）。
- 多账号额度自动轮换，只有回退链。
- **计划的原地改写引擎**：不做。运行中改计划走 §4.5 的**追加流程**——追加行并把旧行标 `superseded`，由 planner 的改计划实例一次改完。
- **改计划 agent 碰设计方案与验收清单**：不做。禁区里的改动一律写「超出范围」交用户（§4.5.2）。
- **前四批不做 `watch`**：它排在开发方案第 5 批必做，前四批不依赖它、可先各自验收（设计已冻结见 §3.6）；落地后也只通知不写账。
- 程序侧停滞检测、陈锁自动回收、文件锁。
- **无 Herdr 的退路**：Herdr 是必备项，两个平台都是。
- 实时监控：watch 推送 + 20 分钟兜底，不做秒级盯屏。
- Herdr tab 这一层：不使用。
- **E11 / E12 / E13 不进接力**：用户确认、verify 代签、销户留给人和主 session。
- 编排越级拉 agent、监工跨阶段存活、规划参与运行：三者都禁止。

**不复用**：psmux adapter / relay-host / preflight；`tools/host/relay-agent-tool.ps1`（强绑 `RELAY_RECEIPT` 七字段）。`tools/runner/relay-store.ps1` 只借纯追加写法，不借原子替换，不复用代码（跨语言）。

**禁改**：现役 dh-relay 的 `tools/runner/` `tools/host/` `tools/contracts/`；已开工计划的 `relay_plan.md` **禁原地改写，只准按 §4.5 追加**。

**待决策**：无，全部已决。

## 14. 开发方案同步项（B 拆计划时必须承接）

1. **skill 单源与全量同步**：仓内 `tools/relay-light/skill/` 是唯一源；标准库 Python 安装器用 `--all` 全量覆盖当前机器 Claude/Codex 两侧并校验哈希。失败后排除原因并整套重跑；不使用软链，不做事务化。→ HC-RL-A32 / HC-RL-A124 / HC-RL-A125
2. **AGENTS.md 编排协议段**：新增 relay-light 一段（worker 完成即停、无 `node_closed`、标头判定），现有 Runner 铁律标「冻结流水」。→ HC-RL-A28 / HC-RL-A34
3. **AGENTS.md 模块身份**：「本仓只有一个模块」与 `dh` 自动选模块的描述随双模块现状同步改。→ HC-RL-A29
4. **一致性对照任务**：relay-light 与现役 Runner 是同一问题域的两条并行路径，B 段须出对照任务，逐条列两者对「节点 / 角色 / 事件 / 关闭」的定义差异并裁决「有意差异」还是「遗漏」。
5. **教训候选回流**：把 §15 自查里的三条新教训提进 `knowledge/教训库-候选.md`。
6. **改计划实例的提示词与白名单校验**：`planner-amend` 的提示词模板须含输入四件、一次改完、跑 lint 修到过；碰禁区时三类计划目标与输入方案文件均零变化，不写 `blocked` / `escalate` / `plan_amend`，只在普通 `done.note` 写结构化「超出范围」原因，由 monitor 续写 `stage_result outcome=blocked`。白名单校验须用紧邻本次动作的改前/改后快照取得精确变更集。→ HC-RL-A122
7. **绕过 B-adjust 的决定要写进 AGENTS.md**：relay-light **有意绕过** dev-harness「改开发方案须 B-adjust 用户确认」这条，须在 AGENTS.md 的 relay-light 编排协议段注明，免得后来人当成违规。→ HC-RL-A28 / §1.3
8. **Linux 预演回流（RLT-A-08）**：`stage_result` 按 outcome 分校验与 `ref=` 引用、环境性 NOT_RUN 出口、`launch_fix=` 记账、静默超时配置与监工模板、派活提交/等待纪律与沙箱替代预检、`decision_mode` 模式门与 `cancelled` 归属闸，须由一张标准档卡承接；用户 2026-09-14 裁决**不作 RLT_12 硬依赖**——RLT_12 可先跑，但带已知缺口开工须另取风险确认，并在证据中写明 A112/NOT_RUN 缺口口径；light 卡 plan-review 按 A143 分级。→ HC-RL-A137～A143

## 15. 查漏自查（对照 dev-harness `references/查漏清单.md`）

| 检查项 | 结论 |
|---|---|
| A-full 顺序 | 初版、RLT-A-03～A05 的形成史均保留。RLT-A-06 已完成候选起草、四轮 fresh Opus 复核与收敛、主控讲解、理解校验及 2026-09-11 用户整版确认；本次只晋级 A，B06 和 D-start 仍分闸。 |
| 候选稿边界 | 候选稿保留在 `drafts/` 作形成史，**不进 `designInputs[]`**；A06 的正式语义已原子晋级到本文，审核与确认证据见 `design/evidence/07-交叉审核记录-RLT05合同缺口候选.md`。 |
| 扫 knowledge/ 教训库 | 已扫。命中并规避：候选-5（大小写，HC-RL-A41/A42）、候选-10（append + superseded，§4.4）、候选-18（陈锁自动回收，§13）、候选-38（入口能解析≠能执行，适配层）。 |
| 扫 knowledge/ 设计期知识库 | 该库在本仓不存在，按「库不存在跳过不算违规」处理。 |
| 扫 backlog | dh-relay 的 backlog 是那个模块的池子；relay-light 本次未从中拉走条目。 |
| 持久化产物退场路径 | §12 已逐类写「谁删 / 何时删 / 删失败怎么办」；纯追加后无临时文件问题；「只写不删」为显式选择并给了理由。 |
| 核心决策清单 | §1.3 十六条**全部已决**（2026-09-09 补入「运行中改计划」一条），均标不可逆程度；无遗留待决策项。 |
| 与 dev-harness 的规则冲突 | relay-light 的改计划实例**有意绕过**「改开发方案须 B-adjust 用户确认」，已在 §1.3 记为显式决策、§4.5.3 写明适用条件、§14 第 7 条要求写进 AGENTS.md。设计方案与验收清单仍走 dev-harness 原路，不绕。 |
| 单点风险 | 编排是常驻单点，挂掉则计划停摆但账本不断流（阶段边界可续跑，§7.3）。监工按阶段独立，单点半径从整个计划缩到一个阶段——这是本轮结构调整最大的收益。Herdr 仍是无退路的必备项。 |
| 教训候选（本卡新增） | ①**阻塞式等待放后台再结束回合 = 监控断线**（ThinkPad 实测）。②**同名不同义的枚举必须分层**：Herdr 的 `done` 与账本的 `done` 一个是「停下」一个是「验收合格」。③**两个系统各有一个叫 workspace 的东西时必须先改名再设计**，否则每条规则都要带定语。 |
| 拓扑与 worktree 纪律 | 一阶段一终端空间（cwd 指向该卡 worktree），与宪章「一卡一 worktree、收口即删树」同拍；**先关终端空间再删树**。 |
| 密钥红线 | §13 与 skill 核心引用宪章第 6 条，HC-RL-A27 以规则原文检查为主、grep 为 smoke。 |
| 跨语言复用风险 | 账本是 Python、现役 Runner 是 PowerShell，只能借手法不能借代码；且只借纯追加、不借原子替换。 |
| 验收二分与原子化 | 已按机器证/人判分栏，人验栏只留业务判断。AI 栏凡含两个以上可独立失败断言的均已拆分。共享 E-ID：E-链路（HC-RL-A30 / HC-RL-H1）、E-账本（HC-RL-A31 / HC-RL-H10）。 |
| 验收 ID 稳定性 | 包内唯一，新条目一律续号；RLT-A-06 退役 A91/A108/H2，续发 A131～A136/H18，不复用旧号；RLT-A-08 续发 A137～A143、RLT-A-09 续发 A144～A150，两者**均只续号，不退役、不改号、不复用**。完整退役清单见 §11，A131～A134 保留 `split-from`，H18 保留 `supersedes`。 |
| 一致性对照 | 已列为 §14 第 4 条开发方案同步项。 |
| 数据口径契约 | 本模块不涉及指标口径，N/A。 |
