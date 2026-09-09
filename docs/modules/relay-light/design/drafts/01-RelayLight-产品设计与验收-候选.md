<!-- 01-RelayLight-产品设计与验收-候选.md — A-full 共创草案。整版确认后才建 design/README.md 入口、把本文晋级为 design/01-产品设计与验收.md 并写入白名单。
     在那之前 design/ 下只有本 drafts 目录，不预建 README（空白名单会被 resolver 判 fail closed）。 -->
<!-- dh:topic tier=标准 review=待补（六轮 fresh 复核已回，裁决已并入；证据文件晋级时落 evidence/） -->
<!-- dh:planning-event 占位：候选稿不承载 planning-event；晋级时在正文首行补 dh:planning-event:v1 -->

# RelayLight 产品设计与验收（**共创草案 · 未生效**）

> **本文是候选稿，不是正式设计输入。** 未经用户整版确认，不授权 B 拆计划，也不授权 D 开工。
> 冻结来源：2026-09-08 至 09-09 用户与主控的产品讨论 + 六轮 fresh 复核裁决 + 一轮结构性调整 + **2026-09-09 补充：运行中改计划流程（§4.5）**。**已无遗留待决策项**（见 §8）。

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
| 决策模式 | marker 的 `decision_mode=auto / consult`，只管 decider；strategist **永远交用户** | 一刀切（要么全自动风险大，要么全问烦） | 中 |
| 运行中改计划 | planner 改计划实例可直接改开发方案任务行与任务卡，**绕过 dev-harness「改开发方案须 B-adjust 用户确认」**（§4.5） | 每次改计划都交用户（范围内的小改也要打断人）／完全禁改（计划一处不对就整体重来） | 中 |
| attempt 计数 | 按 `(node, agent 名)` 计，每节点从 1 起、跨节点不累计，上限 3 每节点独立 | 全卡累计（返工节点白吃预算） | 中 |
| 账本程序运行时 | **Python 3 单文件**，落点 `tools/relay-light/relay_log.py`，仅标准库 | pwsh 7（Linux 侧要额外装） | 高 |
| 配置文件格式 | TOML，用标准库 `tomllib`（Python ≥3.11） | JSON（无注释，配置表可读性差） | 低 |
| 字符串比较大小写 | 显式区分大小写，枚举集合精确匹配，不做 `.lower()` 归一（同源教训库候选-5） | 大小写不敏感 | 低但必须一开始就对 |

### 1.4 范围与分期

- **首版交付**：`relay_log.py`（`add` / `status` / `lint`）+ skill 三件 + 两份配置 + 五种阶段模板 + Windows 两个主控组合实跑。
- **P2**：`watch` 组件（设计已冻结，见 §3.6）。
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

**运行时 = Python 3 单文件**，落点 `tools/relay-light/relay_log.py`，只用标准库。首版三个子命令 `add` / `status` / `lint`；第四个 `watch` 是 P2 可选组件，设计已冻结（§3.6）。

### 3.1 命令签名与退出码

```text
relay_log.py add    --plan <dir> --node <n> --event <e> --agent <a> [--note <text>]
relay_log.py status --plan <dir> [--json]
relay_log.py lint   --plan <dir> [--json]
```

`--plan` 指向 `docs/modules/<模块>/relay/<plan_id>/`。

| 命令 | 退出码 |
|---|---|
| `add` | `0` 成功；`2` 参数、词表或时序不合法；`3` relay_plan 缺失或解析失败；`4` 写入失败 |
| `status` | `0` 正常；`3` relay_plan 缺失或解析失败；`4` 账本读取或解析失败 |
| `lint` | `0` 通过；`2` 规则违反；`3` relay_plan 缺失或解析失败 |

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
| **节点状态层** | `pending` / `ready` / `open` / `closed` / `superseded` | `status` 派生，不落盘 |

**两个 `done` 不是一回事**：Herdr 的 `done` 只代表 agent 停下，**只触发监工去读产出**；账本的 `done` 是**监工读完产出后的判断**，`note` 里列产出文件。

### 3.4 事件分两类，只有一类走状态机

**控制事件**（`agent` 字段为 `orchestrator#<n>` 或 `monitor#<n>`，**不进状态机**）：

| 事件 | 写入者 | 时序规则 |
|---|---|---|
| `plan_loaded` | 编排 | 必须是**第 1 行且仅一次**；`node` 填第一个非 superseded 节点号 |
| `stage_start` | 编排 | 每**阶段实例**仅一次，且在该实例任何 `monitor_launch` 之前；`note` 带 `stage_id=` |
| `monitor_launch` | 编排 | 每阶段实例至少一次（重拉监工可多次），必须在本实例 `stage_start` 之后；`note` 带 `stage_id=` |
| `node_start` | 监工 | 每节点仅一次；在该节点任何 `agent_launch` 之前；`depends_on` 未全 `closed` 时退出 `2` |
| `node_close` | 监工 | 仅在双判据成立时接受，每节点一次 |
| `stage_result` | 监工 | 每阶段实例**可多次**（`blocked` 后用户裁决要续写终局）；`note` 必须含 `stage_id=` 与 `outcome=done / blocked / failed / cancelled` 及原因。**`status` 只认该实例最新一条** |
| `stage_close` | 编排 | 每**阶段实例**一次，前置是**该实例最新 `stage_result` 的 `outcome ∈ {done, cancelled}`**，否则退出 `2` |
| `monitor_restart` | 监工 | 任意位置，不限次 |
| `plan_amend` | 监工 | 运行中改计划完成后写（§4.5），任意位置、不限次，**不进状态机**；`agent` 必须是 `monitor#<n>`；`note` 写方案文件名 + 新节点号列表，形如 `decision.2.md nodes=C3,C4` |

**agent 事件**（`agent_launch`、`checkpoint`、`blocked`、`escalate`、`decision`、`user_decision`、`resume`、`done`、`agent_lost`、`cancelled`）走 `(node, agent)` 状态机：

```text
agent_launch → checkpoint* → ( blocked → escalate → decision → [user_decision] → resume )* → (done | agent_lost | cancelled)
```

**终态后同一 `(node, agent)` 不得再有任何事件。** `escalate` / `decision` / `user_decision` **记在被阻塞的那个 agent 名下**，决策 agent 的标识写进 `note`。

**决策链顺序固定**：`blocked` → `escalate` → `decision` → `resume`，其中 **`user_decision` 只在 `decision_mode=consult` 时出现**，位置固定在 `decision` 与 `resume` 之间。`auto` 模式**没有** `user_decision`；`consult` 模式缺 `user_decision` 就写 `resume` 退出 `2`。

**`user_decision` 的 `note` 写法约定**：方案里含「需要改计划」时（§4.5），用户同意写 `approve-amend: <理由或补充>`，用户否决写 `reject-amend: <用户的替代指示>`。否决时监工不拉改计划实例、不重拉 decider，直接把替代指示送回同一个 coder 并写 `resume`，账本上不出现 `plan_amend`。方案不含改计划时 `note` 自由文本，不用这两个前缀。

**`checkpoint` 是批内往返的唯一载体**：checker 给方案、coder 按方案修、decider 方案送回后继续，全部记 `checkpoint`，`note` 写轮次或决策文件名。`checkpoint` **可重复任意次，不新增 attempt、不新增 `agent_launch`**。attempt 只在**节点级返工**（X 阶段新节点）时从该节点的 1 重新起算。

### 3.5 账本合同（实现细节，冻结）

**attempt 分配**：`--agent` 传**完整** `<名字>#<attempt>`，由监工分配 = 该 `(node, 名字)` 已有最大 attempt + 1。`add` 校验 `agent_launch` 的 attempt **必须恰好等于最大值 + 1**，否则退出 `2`。

**`add` 入参校验**（任一违反退出 `2`）：

- `node` 必须在节点表中且**非 superseded**；
- `agent` 名（去掉 `#attempt`）必须在**该节点**的 agent 表中；`orchestrator#<n>`、`monitor#<n>` 与 **`planner-amend#<n>`** 豁免（改计划实例由监工过门后按需拉起，不预先写进 agent 表，§4.5.2）；
- `event` 必须在词表中；
- **控制事件的 `by` 必须与该事件的法定写入者一致**（§3.4 表），越权退出 `2`；
- `trigger` 为 `on:done:<X>` 的 agent，写 `agent_launch` 时 **X 在本节点必须已有 `done`**（`agent_lost` / `cancelled` 不算）；
- `trigger` 为 `on:blocked` 的 agent，写 `agent_launch` 时**本节点必须存在一个 agent 其最新事件为 `blocked` 或 `escalate` 且尚未 `resume`**；
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
  "plan": {"marker": "...", "cards": ["DHR_90"]},
  "open_stages": ["DHR_90:C#1"],
  "current_node": "C2",
  "stages": [{"stage_id": "DHR_90:C#1", "stage": "C", "card": "DHR_90", "k": 1,
              "state": "open", "nodes": ["C1", "C2"], "result": null}],
  "nodes": [{"node": "C2", "card": "DHR_90", "stage": "DHR_90:C#1", "type": "construction",
             "state": "open", "closable": false, "reasons": ["coder#1 无终态事件"]}],
  "agents": [{"node": "C2", "agent": "coder#1", "last_event": "checkpoint",
              "last_ts": "...", "idle_seconds": 2839}],
  "errors": []
}
```

`stages` 与 `nodes` 按节点表顺序，`agents` 按 `(node, 首次 launch 的 seq)` 顺序。**`open_stages` 是列表**——跨卡时可能有多个阶段实例同时 open；同卡串行保证同一张卡在列表里至多出现一次。

**错误输出**：统一写 **stderr**，格式 `error: <code> <message>`。

**`lint` 违反项输出**：每条一行写 stderr，格式 `lint: <规则编号> <message>`，**规则编号即对应验收项 ID**（如 `lint: RL-A47 close 值非法: all_agents_done`）。`--json` 输出 `{"ok": false, "violations": [{"rule": "...", "message": "...", "line": 12}]}`。

**lint 规则 → 验收项 ID 映射**（每条规则都有 ID 咬住；新增规则必须同批补验收项）：

| 规则 | ID |
|---|---|
| 缺表头 / 表结构不合法 / 单元格含竖线 | RL-A24 |
| `agent.node` 指向不存在节点 / 同节点 agent 名重复 | RL-A24 |
| 缺 marker 或 marker 缺 `skill=` / `session=` / `decision_mode=` / `recipe=` | RL-A18 |
| `recipe` 值非法，或 R 阶段 reviewer 集合与该档不符 | RL-A116 |
| `decision_mode` 值非法 | RL-A90 |
| 节点号重复（含已 superseded 的号） | RL-A46 |
| `close` 值非法 / 引用不存在的 agent 名 | RL-A47 |
| `depends_on` 指向不存在节点或成环 | RL-A48 |
| `depends_on` 指向 superseded 节点 | RL-A72 |
| `depends_on` 跨阶段指向未闭合阶段 | RL-A89 |
| `trigger` 值非法 / `on:done:` 引用不存在 agent | RL-A35 |
| `on:done:` 跨节点引用 | RL-A71 |
| 节点无非 superseded 的 agent（空节点） | RL-A75 |
| `stage` 值不在阶段枚举内 | RL-A86 |
| 同一阶段的节点未按 stage 分组连续（忽略 superseded 行；§4.5 的追加行落在表尾不算违规） | RL-A86 |
| `stage_id` 格式非法或 `<card>` 前缀与 `card` 列不一致 | RL-A104 |
| 同卡阶段实例的 `depends_on` 链有分叉（同卡并行） | RL-A109 |
| `card` 未在 marker 的 `cards` 列表中 | RL-A87 |
| 节点表含 kickoff / verify-signoff 类 `type` | RL-A88 |

### 3.6 可选组件 `watch`（P2，设计已冻结）

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
| `launch` | 发起方式；留空则取 `roles.toml` 的默认 |
| `output` | 产出文件 |
| `trigger` | 留空 = 节点开始即发起；`on:blocked` = 上游 agent 卡住时；`on:done:<名字>` = 等指定**同节点** agent `done` 后发起。**批内持续在场的角色（coder、checker）一律留空**——它们要在对方拿到终态前就在场 |
| `note` | 备注。废弃行写 `superseded` |

**不写 `model` 列**——模型统一从 `roles.toml` 按 `role` 取，避免同一角色在多处各写各的。

### 4.3 硬约束与 lint

单元格**禁止出现竖线**（解析按竖线切列）。lint 逐条查：表头齐、**节点号全计划唯一**（含已 superseded 的号）、`stage` 为合法 `stage_id` 且其 `<card>` 前缀与 `card` 列一致、**同一阶段实例的节点按 stage 分组连续**、**同卡阶段实例串行**（`depends_on` 链无分叉）、`card` 在 marker 的 `cards` 里、`close` 与 `trigger` 合法且引用存在、`on:done:` 只引用同节点、`depends_on` 指向存在且非 superseded 的节点且不成环、**跨阶段依赖只能指向已在前面的阶段**、`agent.node` 存在、同节点内 agent 名唯一、**每个节点至少一个非 superseded 的 agent**。

**「连续」这条按 stage 分组判定，不看物理行号相邻**（为 §4.5 运行中改计划放宽）：忽略 superseded 行后，同一 `stage_id` 的非 superseded 节点在表中构成一段连续区间即算通过，**追加行落在表尾也通过**。其余规则一条不放松——**节点号重复（含已 superseded 的号）仍然拒绝**，`depends_on` 不得指向 superseded、跨阶段依赖只指向前面的阶段、同卡阶段实例串行也都照旧。正是这几条没放松，编排才能从计划无歧义地推出下一阶段。

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

- decider 触发的，按 marker 的 `decision_mode`——`auto` 直接过门；`consult` 先问用户，出一条 `user_decision`。
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
- **不进 blocked 链**：改计划实例**不允许写 `blocked` / `escalate`**——它是过门之后的执行者，不能再触发第二轮升级。做不到就按「超出范围」处理：在方案文件里写清原因、收工，`stage_result` 记 `blocked` 交用户。

**可碰文件白名单（按路径）**：

| 可碰 | 路径 | 怎么碰 |
|---|---|---|
| 接力计划 | `docs/modules/<模块>/relay/<plan_id>/relay_plan.md` | 节点表与 agent 表，按 §4.4 追加行 + 旧行标 superseded |
| 计划 marker | 同上文件第一行的 `cards=` 字段 | 新增任务卡时加卡号 |
| 开发方案 | `docs/modules/<模块>/dev_plan/P<N>-*.md`（DevPlan 户口本） | 任务行的描述、拆分、合并、先后、依赖 |
| 任务卡施工步骤 | `docs/modules/<模块>/workspace/<卡号>/task_plan.md` | 施工步骤 |

**禁区（按路径）**：**`docs/modules/<模块>/design/` 整个目录**——包含 `design/01-产品设计与验收.md`（设计方案与验收清单同在此文件）、`design/README.md`、`design/evidence/`、`design/records/`、`design/drafts/`。**验收 ID 不得新增，也不得改动。**

**碰到禁区就不改**——在方案文件里写「超出范围」并说明要改什么，然后收工；**当班监工把本阶段的 `stage_result` 记 `blocked`**，由编排通知用户（§2.1 的 `blocked` 分路）。

**禁区判定是整份方案的开关，不做部分执行**：方案里**只要有一处**落进禁区，**整份改动都不落笔**——不允许「先把白名单内的那几处改了，禁区那处留给用户」。理由是半改过的计划既不是旧计划也不是新计划，用户接手时无从判断现场。

#### 4.5.3 四种情况

| 发现要改的是 | 改计划 agent 做什么 | 额外问用户？ |
|---|---|---|
| **当前任务卡内容**（范围内，验收 ID 不变） | 改 `task_plan`；`relay_plan` 对应节点按 §4.4 追加或标 superseded；开发方案只在任务描述或依赖变了时同步一行 | 不用，走 §4.5.1 的门 |
| **新增一张任务卡** | 开发方案加任务行；marker 的 `cards` 加新卡号；`relay_plan` 追加这张卡的 W／C／R／F 阶段行。**任务工作区七件套不由它建**，由新卡 W 阶段的 builder 照常建；编排开到新 W 阶段时才拉监工 | 不用 |
| **开发方案的任务拆分／合并／先后／依赖**（范围内） | 直接改开发方案，`relay_plan` 的 `depends_on` 跟着改 | 不用。**此举绕过 dev-harness「改开发方案须 B-adjust 用户确认」的规则，是有意的显式决策**（§1.3、§14） |
| **设计方案，或需要新增验收条目** | 不改；在方案文件写「超出范围」后收工；本阶段 `stage_result` 记 `blocked` 交用户。用户在接力外走 dev-harness A-full／A′（必要时 B-adjust）改完后裁决「继续」，当班监工在**同一阶段实例内**接着干；若改动大到计划整体不成立，重新拉规划 agent 出新计划，旧计划整体按 §4.4 标 superseded | **必须** |

#### 4.5.4 账本、编排与 lint 的配套

- **账本**：新增控制事件 **`plan_amend`**，由**当班监工**写，`agent` 为 `monitor#<n>`，**不进状态机**；`note` 写方案文件名 + 新节点号列表，形如 `decision.2.md nodes=C3,C4`（§3.4、§3.5）。
- **编排不缓存计划**：每次开阶段前重读 `relay_plan`（用 `status` 输出，忽略 superseded 行），下一阶段从计划推导，不背 `W→C→R→F` 固定顺序（§2.1）。
- **编排不监听 `plan_amend`**：改计划信息**只经本阶段 `stage_result.note` 的 `amend=` 摘要**到达编排，编排据此在开下一阶段前重读计划。`plan_amend` 只是账本上的事实记录，不承担通知职责。
- **`stage_result` 带改动摘要**：本阶段发生过 `plan_amend` 时，监工在 `stage_result.note` 里写方案文件名与新节点号；编排据此重读计划再定下一阶段（§5.2.1）。
- **追加节点谁接手**：**当前阶段实例内**追加的节点由当班监工直接接手；**后续阶段**的追加由编排开到时按常规处理。
- **lint 放宽**：只放宽「同一阶段实例的节点连续」这一条，改为按 stage 分组判定、忽略 superseded 行、允许追加行落在表尾（§4.3）；节点号唯一、`depends_on` 不指向 superseded、跨阶段依赖只指向前面阶段、同卡阶段实例串行**都不变**。

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

### 5.3 节点关闭判据

**固定为双条件合取：**

1. 本节点所有已 `agent_launch` 的 agent 都有**终态事件**（`done`、`agent_lost` 或 `cancelled`）；
2. 若 `close` 列非空，则该 agent 有 **`done`** 终态（`agent_lost` / `cancelled` 不满足条件 2）。

条件 1 永不豁免——施工节点写 `close=agent:scribe` 时，coder 与 checker 也挂在该节点上，scribe 终态但它们未交付时仍不可关。正因为条件 1 永远在，`all_agents_done` 这种枚举值恒真、纯属重复，不设。

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

```toml
[stages.C]
dh_nodes = ["S3"]

[stages.R]
dh_nodes = ["E0", "E1", "E2", "E4", "E5", "E14", "E6", "E3"]

[recipes.heavy]
reviewers = ["code-round2", "requirement", "consistency", "lesson"]
[recipes.normal]
reviewers = ["code-round2", "requirement", "lesson"]
[recipes.light]
reviewers = ["lesson", "consistency"]

[rework]
max_rounds = 2
on_exceed = "strategist-then-user"
```

四类内容：**各阶段对应的 dh 节点**、**Recipe 三档对应哪些 reviewer**、**复核最大轮数**、**止损规则**。

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
两套计数独立、不叠加、不互相重置：attempt 抓「实例挂了重拉」，
rework 抓「复核打回」。任一先到上限即停，出口相同：
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

**两套止损计数，各自独立，谁先到谁触发，不叠加**：

| 计数 | 范围 | 上限 | 递增时机 |
|---|---|---|---|
| **attempt** | 节点实例内同一 agent 名 | 3（每节点独立，跨节点不累计） | 仅在本节点 `agent_lost` / `cancelled` / 阶段 `failed` 后重拉时 +1；**批内 `checkpoint` 往返不增**；节点级返工是新节点实例、从 1 起 |
| **X 轮数** | 复核返工轮 | `dh-mapping.toml` 的 `max_rounds`（当前 2） | 每开一个 X 阶段 +1 |

**出口相同**：任一先到上限即停 → 拉 **strategist** → **交用户裁决**。两者不叠加计算，也不互相重置。

### 7.4 终端空间拓扑与 pane 布局

- **一个阶段 = 一个终端空间**（`herdr workspace create`，cwd 指向该卡的 worktree）；编排另有自己独占的一个。
- 空间内 agent 都是**根 tab 里的 pane**；**tab 这一层不使用**。
- **不同仓库各开各的具名 session**：`herdr --session <仓库名> ...`（用户现役 `app` / `kpi` / `kpi-agg`），session 名写进 marker。
- **阶段结束关整个终端空间**；全计划结束后先关空间再删 worktree，顺序反了会留占用。
- 布局：同时在场 agent ≤3 时监工占左侧整列、其余右侧上下分；4 个时四格；一般不超过 4 个。**第二次 `pane split` 要显式传目标 pane，不要用 `--current`**。
- 账本 agent 标识用 `<名字>#<attempt>`，**不记 pane ID**（关闭后不复用且带空间前缀）。

## 8. 决策状态与显式选择

### 8.1 待决策项：**无，全部已决**

skill 放置位置已拍板：**独立用户级 skill**。Claude Code 侧 `~/.claude/skills/relay-light/`（`SKILL.md` 核心 + `references/adapter-claude-code.md` + `references/adapter-codex.md` + `roles.toml` + `dh-mapping.toml`），Codex 侧 `~/.codex/skills/relay-light/` 放**同一份内容**，两侧同源、内容一致；同步方式由开发方案定。仓内 AGENTS.md 阅读矩阵加一行索引；**dev-harness 不改**。

### 8.2 `by` 字段可伪造：明确的设计选择

账本的 `by` 标称写入者，但**没有物理校验**能证明写这行的真是编排或监工——轻版**不做身份校验**，用「零启动成本」换来的。因此 RL-A85 验的是**一致性**（有没有出现越权形态的记录），**不是真伪**。要真伪就得回到 receipt 那套重型身份链，那正是本模块放弃的东西。

## 9. 四个场景

### 9.1 批次施工 + 方向评估（批内不换人）

**coder 与 checker 都在节点开始时拉起，批内持续在场**，由监工用 `herdr agent prompt` 在两者之间来回送。

```text
C1 node_start
  agent_launch coder#1        （trigger 留空）
  agent_launch checker#1      （trigger 留空）

  coder 写完第 1 轮，pane 打四行小结
    → checkpoint coder#1    note=round=1 小结已出
  监工把小结与 diff 送 checker
    → checkpoint checker#1  note=round=1 偏离：X 处未按 task_plan 第 2 条
  监工把方案 prompt 回同一个 coder（不换人、不加 attempt）
    → checkpoint coder#1    note=round=1 按方案已修

  checker 再核，通过
    → done checker#1        note=round=2 通过
    → done coder#1          note=本批完成，四行小结已收
  agent_launch scribe#1     （on:done:coder）
    → done scribe#1         note=progress.md 已写
  node_close C1             （close=agent:checker，条件 1 要求三者全终态）

下一批 C2：开新的 coder#1 / checker#1（新节点，attempt 重新从 1 起）
```

三条要点：

- **checker 通过才进下一批**，不是「修完就进」。checker 的账本 `done` 语义就是「本批方向通过」。
- **批内的「方案 → 修」一律走 `checkpoint`**，`note` 记 checker 轮次；`agent_launch` 与 attempt **都不增加**。
- coder 在 checker 通过前**拿不到终态事件**——这是状态机能成立的前提（终态后同一 agent 不得再有事件）。所以 checker 的 trigger 是**留空**（节点开始即在场），不是 `on:done:coder`。

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
   过 → stage_close X1 → 回 R 收敛
   不过 → X2（第 2 轮，max_rounds=2 已达）
X2 仍不过（X 轮数达 max_rounds=2）→ 监工拉 strategist
   （另一条等价入口：某节点内 attempt 达 3 —— 两套计数谁先到谁触发，不叠加）
   输入：brief、task_plan、全部 review、账本
   输出：全局方案 或 建议停卡
   → **永远交用户裁决**（不看 decision_mode）→ user_decision
```

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

**「超出范围」分支**：若 decider 提出的改动落进禁区（要改设计方案，或要新增验收条目），改计划实例**不改任何文件**，在方案文件里写「超出范围」后收工，账本形态变成：

```text
agent_launch planner-amend#1  note=改计划实例
done      planner-amend#1     note=超出范围：需新增验收条目 RL-A???，未改任何文件
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
| plan-reviewer | W1 | plan-reviewer | | review.plan.md | on:done:builder | |
| coder | C1 | coder | zcode | (代码与 findings) | | |
| checker | C1 | checker | | check.C1.md | | |
| scribe | C1 | scribe | | progress.md | on:done:coder | |
| decider | C1 | decider | | decision.1.md | on:blocked | |
```

### 10.2 账本示例 · 运行中快照

```json
{"seq":1,"ts":"2026-09-09T09:00:05+08:00","node":"W1","event":"plan_loaded","agent":"orchestrator#1","by":"orchestrator","note":"skill=0.1.0 session=app cards=DHR_90,DHR_91"}
{"seq":2,"ts":"2026-09-09T09:00:10+08:00","node":"W1","event":"stage_start","agent":"orchestrator#1","by":"orchestrator","note":"stage_id=DHR_90:W#1"}
{"seq":3,"ts":"2026-09-09T09:00:40+08:00","node":"W1","event":"monitor_launch","agent":"orchestrator#1","by":"orchestrator","note":"stage_id=DHR_90:W#1 ws=relay-w1"}
{"seq":4,"ts":"2026-09-09T09:01:02+08:00","node":"W1","event":"node_start","agent":"monitor#1","by":"monitor","note":""}
{"seq":5,"ts":"2026-09-09T09:01:20+08:00","node":"W1","event":"agent_launch","agent":"builder#1","by":"monitor","note":"attempt=1"}
{"seq":6,"ts":"2026-09-09T09:40:11+08:00","node":"W1","event":"done","agent":"builder#1","by":"monitor","note":"七件套齐，task_plan.md 已写"}
{"seq":7,"ts":"2026-09-09T09:40:30+08:00","node":"W1","event":"agent_launch","agent":"plan-reviewer#1","by":"monitor","note":"on:done:builder"}
{"seq":8,"ts":"2026-09-09T10:02:15+08:00","node":"W1","event":"done","agent":"plan-reviewer#1","by":"monitor","note":"review.plan.md 已读，无 P0"}
{"seq":9,"ts":"2026-09-09T10:02:30+08:00","node":"W1","event":"node_close","agent":"monitor#1","by":"monitor","note":"双判据成立"}
{"seq":10,"ts":"2026-09-09T10:02:35+08:00","node":"W1","event":"stage_result","agent":"monitor#1","by":"monitor","note":"stage_id=DHR_90:W#1 outcome=done task_plan 已过审"}
{"seq":11,"ts":"2026-09-09T10:02:50+08:00","node":"W1","event":"stage_close","agent":"orchestrator#1","by":"orchestrator","note":"stage_id=DHR_90:W#1"}
{"seq":12,"ts":"2026-09-09T10:03:05+08:00","node":"C1","event":"stage_start","agent":"orchestrator#1","by":"orchestrator","note":"stage_id=DHR_90:C#1"}
```

写入者交接看得很清楚：seq 1-3 编排、4-10 监工（末条是 `stage_result`）、11-12 编排。**时间上不重叠**，且收尾四步顺序为 `node_close` → `stage_result` → `stage_close` → 关空间。

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
| relay_plan 示例 | §10.1 | RL-A24 / RL-A46 / RL-A47 / RL-A86 / RL-A87 / RL-A90 |
| 账本示例 | §10.2 | RL-A37 / RL-A2 / RL-A85 / RL-A89 / RL-A93 |
| status 输出示例 | §10.3 | RL-A43 / RL-A44 / RL-A62 |

## 11. 验收清单

> 分栏依据**验收二分**：机器能完整证明的进 AI 栏，只有需要用户凭业务判断「结果对不对 / 能不能用」的进人验栏。复合观察点已原子化，共享 E-ID 的两条分列两栏。
>
> **共 119 条：AI 自动验收 104 条 + 人类验收 15 条**（2026-09-09 补充 §4.5 运行中改计划，新增 RL-A119～RL-A123 与 RL-H16、RL-H17 共 7 条；原 112 条 = 99 + 13）。
>
> **已退役且不再复用的 ID**：RL-A1、A3、A4、A6、A20、A22、A23、A25（原子化拆分）；RL-A8、A76、A79、H8、H9（本轮结构调整后语义改变）。

### 11.1 AI 自动验收栏

| ID | 验收项 | 怎么证明 |
|---|---|---|
| RL-A37 | 纯追加：连续 20 次 `add` 后 `seq` 为 1..20 连续 | 单测断言 seq 序列 |
| RL-A38 | 无重复无覆盖：20 次 `add` 后行数恰为 20，历史行逐字节不变 | 单测比对写入前后前 N 行 |
| RL-A39 | 程序不产生临时文件 | 单测目录快照无新增 `.tmp`；静态检查无 `os.replace` |
| RL-A40 | 程序不加锁 | 静态检查无 `fcntl` / `msvcrt` / `filelock` 类调用 |
| RL-A2 | 账本事件层 19 词白名单 fail closed | 单测：19 个合法词全过；未知词退出码 2 且不落盘 |
| RL-A41 | 枚举比对区分大小写：`NODE_START` 被拒（同源教训库候选-5） | 单测 |
| RL-A42 | 静态守卫：无 `.lower()` / `.casefold()` 用于枚举归一 | 静态 grep |
| RL-A43 | `status` 输出六项齐：当前阶段、当前节点、节点状态、在场 agent 与最近事件时间、可关闭判定、不可关原因 | 单测：喂 §10.2 账本 + §10.1 plan，断言与 §10.3 样张一致 |
| RL-A44 | `status` 措辞只转述账本事实，不含产出合格性判断词 | 静态检查输出模板词表 |
| RL-A5 | relay_plan 缺失或解析失败时三个子命令均退出码 **3** 并给可读原因 | 单测：缺文件 / 缺表头 / 节点号重复 |
| RL-A45 | 账本读取或解析失败时 `status` 退出码 **4** | 单测：账本含坏行 / 不可读 |
| RL-A84 | 空账本语义：账本不存在或为空时 `status` / `lint` 退出 0，`current_stage` 与 `current_node` 为 `null`、所有节点 `pending`；`add` 自动建文件且首条非 `plan_loaded` 时退出 2 | 单测：缺文件与空文件各一例；首条写 `node_start` 被拒 |
| RL-A46 | lint：节点号唯一，已 superseded 的号仍占用，重复即拒 | 单测 |
| RL-A47 | lint：`close` 为空或 `agent:<已存在 agent 名>`，其它写法一律拒 | 单测含 `all_agents_done` 反例 |
| RL-A48 | lint：`depends_on` 指向存在节点且不成环 | 单测含成环反例 |
| RL-A72 | lint：`depends_on` 指向 superseded 节点时报错 | 单测 |
| RL-A64 | superseded 语义：`status` 与 lint 忽略该行，派生结果与不含该行时一致 | 单测 |
| RL-A73 | superseded 节点无关闭语义：`state` 为 `superseded`，不计入 closed 也不计入 pending，不影响当前节点派生 | 单测 |
| RL-A75 | lint：每个节点至少一个非 superseded 的 agent，空节点报错 | 单测：零 agent、agent 全 superseded 各一例 |
| RL-A86 | lint：`stage` 值在 `W/C/R/X/F` 枚举内，且**同一阶段的节点按 stage 分组连续**（忽略 superseded 行）；`status --json` 的 `stages` 按节点表顺序派生 | 单测：非法 stage 值、同 stage 节点被另一 stage 隔断各一例被拒；正例断言 stages 派生 |
| RL-A104 | lint：`stage_id` 格式为 `<card>:<stage>#<k>`，`<stage>` 在枚举内、`<card>` 与本行 `card` 列一致；格式非法或前缀不符时报错 | 单测：格式非法、前缀不符各一例被拒；合法例断言解析出 `card`/`stage`/`k` 三段 |
| RL-A109 | lint：**同卡阶段实例串行**——同一张卡的阶段实例 `depends_on` 链无分叉；跨卡并行允许 | 单测：同卡两阶段并列被拒；跨卡两阶段并列通过 |
| RL-A110 | 阶段实例可重复进入：同卡同 stage 的 `#1` / `#2` 各自独立，各写各的 `stage_result`，`R#1` 的 `failed` 不影响 `R#2` 判定 | 单测：构造 R#1 failed + R#2 done，断言 R#2 的 `stage_close` 被接受 |
| RL-A111 | `open_stages` 派生：所有已 `stage_start` 未 `stage_close` 的实例；跨卡可多个，同卡至多一个 | 单测：跨卡两实例同时 open 断言列表长度 2；同卡两实例同时 open 报警 |
| RL-A112 | 阶段收尾四步顺序（`node_close` → `stage_result` → `stage_close` → 关空间）：`stage_result` 早于该实例末节点 `node_close` 时退出 2；`stage_close` 在无 `stage_result` 或最新 `outcome ∉ {done, cancelled}` 时退出 2 | 单测：顺序颠倒、缺 result、outcome 为 blocked 三例 |
| RL-A105 | `stage_result` 合同：`note` 含 `stage_id=` 与 `outcome=done / blocked / failed / cancelled`；缺字段或非法值退出 2。**同一实例允许多条**，`status` 只认最新一条 | 单测：缺 stage_id、非法 outcome 各一例被拒；连写 blocked→done 断言 status 取 done |
| RL-A118 | `blocked` 收尾路径：最新 `outcome=blocked` 时 `stage_close` 退出 2；补写 `outcome=done` 或 `outcome=cancelled` 后被接受；`cancelled` 的 `note` 必须引用 `user_decision` | 单测：blocked 下 close 被拒；两条终局各一例被接受；cancelled 缺引用被拒 |
| RL-A119 | `plan_amend` 事件校验：`agent` 必须是 `monitor#<n>`（`by=monitor`），`note` 必须同时含方案文件名与 `nodes=<节点号,节点号>`；**不进状态机**，同一 `(node, monitor#<n>)` 可重复出现且不影响 agent 事件配对 | 单测：`agent` 填 `coder#1` 被拒；`note` 缺文件名、缺 `nodes=` 各一例被拒；合法例连写两条均被接受且状态机派生不变 |
| RL-A120 | lint 放宽后仍守得住：同一 stage 的节点**追加在表尾**通过、被 superseded 行隔开通过；而**节点号重复（含已 superseded 的号）仍被拒**，`depends_on` 指向 superseded、跨阶段依赖指向后面的阶段、同卡阶段实例并行也仍被拒 | 单测：两条放宽正例各一；四条未放宽反例各一，断言退出 2 与编号 |
| RL-A121 | 编排开阶段前重读计划：**不修改 `relay_log.py` 代码、仅向计划文件追加新阶段的节点行后再次调用 `status`**，输出的 `stages` 含该新阶段且顺序正确；下一阶段由计划推导而非固定 `W→C→R→F` | 单测：同一 plan 目录，第一次 `status` 后仅追加 X 阶段节点行、再次 `status`，断言 `stages` 多出该实例；构造非 WCRF 顺序的计划断言推导跟随计划 |
| RL-A122 | 改计划白名单（按路径）：改计划实例只允许改 `docs/modules/<模块>/relay/<plan_id>/relay_plan.md`（含其 marker 的 `cards=`）、`docs/modules/<模块>/dev_plan/P<N>-*.md`、`docs/modules/<模块>/workspace/<卡号>/task_plan.md`；**`docs/modules/<模块>/design/` 整个目录是禁区**，被改动即验收失败（验收 ID 不得新增或改动）。禁区命中时**整份改动不落笔**，不做部分执行 | 结构检查：对改计划前后做 `git diff --name-only`，断言变更路径集合 ⊆ 上述三条白名单路径且与 `design/` 前缀无交集；构造一次改到 `design/01-产品设计与验收.md` 的反例，断言检查项报错且白名单内文件也未被改动 |
| RL-A123 | `stage_result` 改动摘要格式：本阶段有 `plan_amend` 时 `note` 必须含 `amend=<方案文件名>` 与 `nodes=<节点号,节点号>`，缺则退出 2；无 `plan_amend` 时不得出现 `amend=` | 单测：有 amend 缺摘要被拒、格式合法被接受、无 amend 却写摘要被拒各一例 |
| RL-A106 | 编排机械分路可判定：`status --json` 暴露每个 open 阶段实例的**最新** `stage_result.outcome`，`done`/`cancelled`/`blocked`/`failed` 四值各自对应唯一动作，且 `failed` 的重拉次数上限为 1（第二次 failed 不再重拉） | 单测：四种 outcome 各断言派生出的建议动作；连续两次 failed 断言不再给「重拉」 |
| RL-A107 | 两套计数独立且不叠加：attempt 达 3 与 X 轮数达 `max_rounds` 各自独立触发 strategist 出口；一方递增不影响另一方计数 | 单测：只 attempt 超限、只 X 超限、两者都未超限三例，断言触发与否及计数互不影响 |
| RL-A87 | lint：`card` 必须在 marker 的 `cards` 列表中；跨卡计划能解析出多卡 | 单测：card 不在 cards 被拒；两卡计划解析出 `cards` 长度 2 |
| RL-A88 | 节点表**只含监工派 agent 的节点**：`type` 不得为 kickoff 或 verify 签字类；**E11/E12/E13 不进接力** | 单测：五种阶段模板断言无此类 `type`；结构检查映射配置未列 E11/E12/E13 |
| RL-A24 | relay_plan 解析规范：两张固定表头表、单元格禁竖线、`agent.node` 存在、同节点 agent 名唯一、`depends_on` 留空即依赖前一节点 | 单测：合法样本解析出预期结构；各反例被拒 |
| RL-A18 | marker 必需且含 `skill=` / `session=` / `decision_mode=` / `recipe=` / `cards=`；缺则 lint 拒绝；`plan_loaded` 事件带版本号 | 单测：缺各字段的 plan 被拒；`plan_loaded` 的 note 含 `skill=` |
| RL-A116 | 档位一致性：`recipe` 值在 `heavy/normal/light` 内；**R 阶段实际挂的 reviewer 集合必须等于该档在 `dh-mapping.toml` 的集合**，不等即 lint 报错 | 单测：三档各一正例；`recipe=normal` 却挂了 code-round2 的反例被拒 |
| RL-A117 | 档位来源：skill 写明档位唯一来自 DevPlan 任务卡 `任务类型` 字段；**字段缺失时规划必须向用户索取，不得默认** | 结构检查 skill 命中该规则原文与「不得自默认」字样 |
| RL-A90 | `decision_mode` 解析：只接受 `auto` / `consult`，其它值 lint 报错；解析结果可被 `status --json` 读出 | 单测：两个合法值各一例、非法值一例 |
| RL-A35 | `trigger` 三态：lint 接受空 / `on:blocked` / `on:done:<名字>`，拒绝引用不存在的 agent 名 | 单测：三种合法各一例，`on:done:nobody` 被拒 |
| RL-A71 | `on:done:` 只允许同节点引用，跨节点报错 | 单测 |
| RL-A65 | 未触发的 agent 不算悬空：`coder` 未终态时 `status` 不把 `scribe` 视为应在场 | 单测 |
| RL-A55 | 账本行固定七字段齐全，`agent` 为 `<名字>#<attempt>` 格式 | 单测 schema 校验 |
| RL-A50 | 配对键为 `(node, agent)`：同名 agent 在两个节点各自配对，互不串 | 单测 |
| RL-A49 | attempt 按 `(node, agent 名)` 计数，每节点从 1 起，跨节点不累计 | 单测：同节点返工 `#1`/`#2`；另一节点同名重新 `#1` |
| RL-A58 | attempt 分配校验：`agent_launch` 的 attempt 必须恰为最大值 + 1，否则退出 2 | 单测：跳号与重号各一例 |
| RL-A51 | 账本不出现 pane ID | 静态检查字段与样例 |
| RL-A85 | 写入者一致性：控制事件的 `by` 必须与法定写入者一致（**`stage_start` / `stage_close` / `plan_loaded` / `monitor_launch` 归 orchestrator；`node_start` / `node_close` / `monitor_restart` / `stage_result` / `plan_amend` 与全部 agent 事件归 monitor**），越权退出 2 并在 `status` 报警（**验一致性不验真伪**，见 §8.2） | 单测：监工写 `stage_start`、编排写 `agent_launch`、编排写 `stage_result`、编排写 `plan_amend` 各一例被拒 |
| RL-A93 | 写入者交接不重叠：编排的写入区间与监工的写入区间在 `seq` 上不交错（编排只在 `stage_close`..下一 `stage_start`/`monitor_launch` 段写） | 单测：对 §10.2 样本断言区间划分；构造交错样本报警 |
| RL-A59 | `add` 入参校验：`node` 在表中且非 superseded、`agent` 名属于该节点（`orchestrator#`/`monitor#`/`planner-amend#` 豁免）、`event` 在词表；违反退出 2 | 单测：四种违反各一例；另断言 `planner-amend#1` 不在 agent 表时仍被接受 |
| RL-A60 | agent 事件状态机：单 `(node, agent)` 序列合法，终态后不得再有事件 | 单测：非法迁移与终态后追加各一反例 |
| RL-A68 | 节点级控制事件时序：`node_start` 每节点一次且先于该节点任何 `agent_launch`；`node_close` 仅双判据成立时且每节点一次；`monitor_restart` 任意位置 | 单测：前两条各一反例；`monitor_restart` 插多处均被接受 |
| RL-A89 | 阶段级控制事件时序：`plan_loaded` 唯一且居首；`stage_start` 每实例一次且先于本实例 `monitor_launch`；`monitor_launch` 必在本实例 `stage_start` 之后；`stage_close` 要求该实例全部节点 `closed`（`stage_result` 前置另见 RL-A112）；`depends_on` 跨阶段只能指向前面的阶段 | 单测：五条各一反例，断言退出 2 且原因可读 |
| RL-A69 | 事件分类：控制事件的 `agent` 为 `orchestrator#<n>` 或 `monitor#<n>` 且不进状态机；`escalate` / `decision` / `user_decision` 记在被阻塞 agent 名下、决策 agent 标识写进 `note` | 单测：控制事件填普通 agent 名被拒；升级链断言三条事件的 agent 字段 |
| RL-A70 | `on:done:<X>` 前置校验：X 在本节点无 `done` 则退出 2；X 为 `agent_lost` / `cancelled` 同样退出 2 | 单测三例 |
| RL-A77 | `on:blocked` 前置校验：本节点无「最新事件为 `blocked` 或 `escalate` 且未 `resume`」的 agent 时退出 2 | 单测：无阻塞现场、已 `resume` 之后各一例 |
| RL-A78 | 依赖与顺序校验：`depends_on` 未全 `closed` 时写 `node_start` 退出 2；本节点无 `node_start` 时写 `agent_launch` 退出 2 | 单测两例 |
| RL-A17 | 关闭双判据：`close=agent:x` 且 x 已 `done` 但同节点另一 agent 无终态时仍判不可关并列出该 agent；`close` 留空时只用条件 1 | 单测两例 |
| RL-A74 | 条件 2 只认 `done`：`close=agent:x` 而 x 为 `agent_lost` 或 `cancelled` 时判不可关 | 单测两例 |
| RL-A61 | 当前阶段与节点派生：第一个非 superseded 且未 `node_close` 的节点为当前节点，其 `stage` 为当前阶段；依赖未全 closed 为 `pending`，有 `node_start` 为 `open`，无为 `ready` | 单测：三种情形各一例 |
| RL-A81 | `closed` 只读账本：有 `node_close` 即 closed，无则不是；判据成立但无 `node_close` 时 `state` 为 `open`、`closable` 为 true | 单测 |
| RL-A62 | `status --json` 结构与排序：字段齐全（含 `current_stage` / `stages` / `card`），`stages` 与 `nodes` 按节点表顺序，`agents` 按 `(node, 首次 launch seq)` 顺序 | 单测：过 `json.loads` 并逐字段断言 |
| RL-A63 | 错误统一写 stderr，格式 `error: <code> <message>` | 单测：捕获 stderr 断言格式；stdout 无错误文本 |
| RL-A80 | `lint` 合同：签名与退出码 0/2/3；违反项每条一行写 stderr，格式 `lint: <规则编号> <message>` 且编号为验收项 ID；`--json` 输出 `{"ok","violations":[{"rule","message","line"}]}` | 单测：三种退出码各一例；断言行格式与编号取值；`--json` 逐字段断言 |
| RL-A94 | lint 规则编号全覆盖：§3.5 映射表列出的每条规则都能被触发，且报出的编号存在于本验收表 | 单测：逐规则构造反例，断言编号集合 ⊆ 验收 ID 集合 |
| RL-A56 | `add` 退出码 0 / 2 / 3 / 4 四种形态各自可复现 | 单测四例 |
| RL-A91 | `roles.toml` 可加载：`tomllib` 读出全部角色的 `model` 与 `launch`；模板与流程文档**不出现硬编码模型名** | 单测加载并断言键集合；静态 grep 模板无模型名 |
| RL-A92 | `dh-mapping.toml` 可加载并承载四类内容：阶段↔dh 节点、三档 Recipe 的 reviewer 列表、`limits`、`on_exceed`；样例见 §6.3 | 单测加载并逐项断言；断言 `stages.R.dh_nodes` 含 E0/E1/E2/E3/E4/E5/E6/E14，且 E11/E12/E13 不出现在任何阶段 |
| RL-A115 | Recipe 三档的 reviewer 集合严格对齐 dev-harness 节点表的 `task_type` 派生：heavy = code-round2 + requirement + lesson + consistency；normal = requirement + lesson；light = lesson + consistency。**权威取值只在 `dh-mapping.toml`**，设计正文与 §6.2 不复述 | 单测逐档断言集合相等；静态检查 §6.2 未复述具体路数 |
| RL-A99 | 返工轮数上限读配置：把 `limits.rework_max_rounds` 从 2 改成 3 后，X 阶段模板生成的返工节点数随之改变，`relay_log.py` 无需改动 | 单测：两种配置各生成一次，断言节点数；`git diff` 对 `relay_log.py` 为空 |
| RL-A108 | checker 可选：模板默认挂 checker，删掉 checker 行后 C 节点仍能过 lint（`close` 随之留空或改指 scribe），且 `status` 不把缺席的 checker 视为悬空 | 单测：带 checker 与不带 checker 两份模板各过一次 lint 与 status 派生 |
| RL-A95 | 场景一模板：C 节点含 coder + checker + scribe + decider；**coder 与 checker 的 trigger 均留空**（批内同时在场），scribe 为 `on:done:coder`，decider 为 `on:blocked`；`close=agent:checker` | 单测：模板过 lint 并断言四个 agent 的 trigger 与 close |
| RL-A102 | 批内往返不加 attempt：同一 `(node, coder)` 连续多条 `checkpoint` 后仍是 `#1`，账本无第二条 `agent_launch` | 单测：三轮 checker 往返，断言 attempt 恒为 1 且 `agent_launch` 仅一条 |
| RL-A113 | attempt 只因实例挂掉而增：本节点 `agent_lost` / `cancelled` / 阶段 `failed` 之后重拉才接受 `attempt+1` 的 `agent_launch`；无这三种前因时第二条 `agent_launch` 退出 2 | 单测：三种合法前因各一例被接受；无前因一例被拒 |
| RL-A103 | 节点级返工才换实例：X 阶段节点的 coder 是该节点的 `#1`，与 C 阶段同名 coder 互不影响；C 节点内不产生第二个 coder 实例 | 单测：跨 C/X 两节点断言各自 `#1`；C 节点内第二条 coder `agent_launch` 被拒（attempt 校验） |
| RL-A114 | 决策链顺序：`blocked`→`escalate`→`decision`→`resume` 为固定序；`consult` 模式缺 `user_decision` 就写 `resume` 退出 2；`auto` 模式出现 `user_decision` 退出 2 | 单测：两种模式各一正例一反例 |
| RL-A96 | 场景二分路：`decision_mode=auto` 时账本序列不含 `user_decision`；`consult` 时 `decision` 之后必须先有 `user_decision` 才接受 `resume`；**两种模式下 `resume` 都记在原 coder 名下且不新增 `agent_launch`** | 单测：两种模式各构造一条序列；auto 例断言接受、consult 例断言缺 `user_decision` 时 `resume` 退出 2；两例均断言 coder 仍为 `#1` |
| RL-A97 | 场景三超限：X 阶段达到 `max_rounds` 后再开一轮 X 被 lint 拒绝；strategist 的结论事件恒为 `user_decision`（不因 `decision_mode=auto` 走 `resume`） | 单测：超限模板被拒；auto 模式下 strategist 链断言仍要 `user_decision` |
| RL-A98 | 计划与账本落点 `docs/modules/<模块>/relay/<plan_id>/`，不在任一卡的任务工作区内 | 结构检查路径；静态检查 skill 与模板无「计划放 workspace」表述 |
| RL-A100 | 术语统一：全文与 skill 中「终端空间」指 Herdr workspace、「任务工作区」指 dev-harness 目录，无混用 | 静态检查：`workspace` 一词在中文语境下不单独出现，两术语各自命中 |
| RL-A11 | 测试经薄壳 `tools/tests/relay-light-log.ps1` 登记进 `$suites` 并全绿 | 跑 `run-relay-tests.ps1` 全量，展示退出码与套件名 |
| RL-A15 | Python 测试可脱离 pwsh 直跑（Linux 回归入口） | `python3 -m unittest` 直跑，展示退出码；与 RL-A11 同一份测试文件 |
| RL-A16 | 账本程序只用标准库 | 静态检查 import 全在标准库清单内 |
| RL-A12 | skill 五件齐且落点正确：`SKILL.md` + 两个 adapter + `roles.toml` + `dh-mapping.toml`；核心含角色表 / 五阶段模板 / 账本用法 / 拓扑布局 / 硬规则 / 放弃项 | 结构检查文件存在 + 按小节标题清点 |
| RL-A32 | 两侧同源：`~/.codex/skills/relay-light/` 与 Claude Code 侧五个文件逐字节一致 | 逐文件比对哈希 |
| RL-A33 | 仓内 `AGENTS.md` 阅读矩阵含指向 relay-light skill 的索引行；dev-harness 未被改动 | 结构检查 + `git diff` 对 dev-harness 仓为空 |
| RL-A19 | skill 核心含「Linux 收口前直跑 python 测试并原样贴进 progress.md」硬规则 | 结构检查命中；Linux 实跑卡的 `progress.md` 含原样命令与退出码 |
| RL-A21 | 两适配层都写明「wait 返回时必须有接收者」及三种满足方式；监工与编排的 prompt 模板含该硬规则原文 | 结构检查 + grep 两份模板 |
| RL-A26 | 命令模板冻结（Windows `python` / Linux `python3` / 远程 `bash -lc`）写进适配层；适配层含 claude kind 的 `pane run` + `rename` 起法与 `agent_prompt_stalled` 处理 | 结构检查按条目清点 |
| RL-A27 | 密钥红线以**规则**落地：派活 prompt 模板与 skill 核心均含「不得把凭据值写进 note / progress / decision」禁令原文 | 结构检查两处命中；grep 已知凭据模式仅作 smoke |
| RL-A28 | AGENTS.md 新增 relay-light 编排协议段，且现有 Runner 铁律已标「冻结流水」 | 结构检查 |
| RL-A34 | 流水判定：监工 prompt 模板首行含 `[relay-light] worker · node … · agent …#… · workspace …` 标头；AGENTS 段含「见此标头即完成即停不等 node_closed，有 RELAY_RECEIPT 即冻结 Runner 流水」判定句 | 结构检查首行格式 + grep AGENTS 段 |
| RL-A29 | 模块身份落地：slug、`docs/modules/relay-light/`、`tools/relay-light/`、verify scope 英文 `relay-light`；AGENTS 的「本仓只有一个模块」与 `dh` 自动选模块描述已同步改 | 结构检查 + `dh relay-light` 能解析 |
| RL-A66 | 变体规则写进 skill：coder 收工小结固定四行且缺项写「无」；scribe 的三条素材来源与优先级；scribe 不碰 findings / lesson_candidates 且不得发明 | 结构检查命中四行模板与硬约束原文 |
| RL-A67 | 职责唯一形态：`findings.md` / `lesson_candidates.md` 写入者解析为 coder，`progress.md` 解析为 scribe | 单测断言职责映射 |
| RL-A82 | `watch` 重挂规则：发通知后不立即重挂，改为每 30 秒 `herdr agent get` 轮询；账本出终态则停止盯，Herdr 回 `working` 则重挂；同一 `(agent, 状态)` 转换只通知一次 | 单测（打桩 herdr）：断言无立即重挂、两条退出路径、去重 |
| RL-A83 | `watch` 维持 20 分钟兜底：每 20 分钟发 `[relay-light] tick`；无 watch 时该节拍由前台 `wait --timeout 1200000` 维持；编排层 watch 在末阶段 `stage_close` 后退出 | 单测（打桩时钟）断言 tick 周期与退出条件；结构检查适配层写明归属 |
| RL-A101 | `watch` 只通知不写账 | 静态检查 `watch` 代码路径无写账调用 |
| RL-A13 | 持久化产物退场路径在设计与实现中均已声明（§12） | 结构检查：设计有 §12；`status` 不做任何自动删除 |
| RL-A14 | 现役 dh-relay 未被改动 | `git diff --stat` 对 `tools/runner/` `tools/host/` `tools/contracts/` 为空 |
| RL-A30 | **〔E-链路〕** 一份真计划跑完后：全部阶段 `stage_close`、全部节点 `closed`，每条 `agent_launch` 都有配对终态事件，无悬空 agent | 实跑后 `status --json` 断言 |
| RL-A31 | **〔E-账本〕** 账本每行过 schema 校验，事件顺序满足状态机与阶段时序偏序 | 对实跑账本跑校验脚本 |

### 11.2 人类验收栏

| ID | AI/你做什么验证动作 | 对话里展示什么证据 | 你判断什么 |
|---|---|---|---|
| RL-H1 | **〔E-链路〕** 在 Windows 用 **Claude Code 主控**跑完一份真计划（W→C→R→F） | relay_plan 全文、账本全文、`status` 两次输出、产出文件清单 | 这套接力是否真的比手动派活省事、值不值得继续用 |
| RL-H13 | **〔编排形态〕** 展示编排 + 按阶段监工的实跑形态 | 编排 pane 的操作序列、各阶段终端空间的建立与关闭、账本里 `by` 的交接段落 | 三层结构（编排→监工→agent）是否顺手；编排会不会成为新瓶颈；阶段换监工是否真的比全程一个监工好 |
| RL-H2 | 在 Windows 用 **Codex 主控**跑同样一份计划 | 同上 + 两次跑用的 skill 是同一份的证明 | 换主控后是否只靠适配层就跑通，核心有没有被迫改 |
| RL-H3 | 在 ThinkPad（Linux）用 **Claude Code 主控**跑一份计划 | 同上 + `python3 -m unittest` 退出码 | Linux 侧用起来是否与 Windows 一致 |
| RL-H4 | 在 ThinkPad（Linux）用 **Codex 主控**跑一份计划 | 同上 | 四组合矩阵是否都能实际交付 |
| RL-H5 | 展示 `status` 输出 | §10.3 形态的真实输出 | 你能否只看这一屏就判断「现在哪个阶段、轮到谁、卡住没有、多久没动」 |
| RL-H14 | **〔场景一〕** 走一遍批次施工 + 方向评估，含至少一次「偏离 → 送回同一 coder 修 → checker 通过」的往返 | 该批的 `checkpoint` 序列、check 文件、coder pane 的两轮小结 | checker 的方向评估是否真能拦住跑偏；批内不换人是否保住了 coder 的上下文；每批一个高档 checker 会不会太贵 |
| RL-H6 | **〔场景二〕** 走一遍 blocked → decider，`auto` 与 `consult` 各一次 | 两条事件链 + `decision.<n>.md` | 两种模式各自的手感；默认该用哪个 |
| RL-H15 | **〔场景三〕** 走一遍复核 → 返工 → 超限 → strategist → 你裁决 | X 阶段轮次账本、全部 review、strategist 结论 | 轮数上限 2 是否合适；strategist 的输入够不够它做全局判断 |
| RL-H16 | **〔改计划·卡内追加节点〕** 实跑 §9.4 那条链：施工 `blocked` → decider 提「需要改计划」→ 过门 → `planner-amend` 在**当前阶段实例内追加节点** → **当班监工直接接手**跑完 | 方案文件、改计划前后的 `relay_plan` diff、`plan_amend` 与带 `amend=` 摘要的 `stage_result`、监工接手新节点的账本片段 | 卡内追加这条路顺不顺；agent 自己改任务卡与开发方案（绕过 B-adjust）你是否放心；禁区的「超出范围 → 交你」拦得住不 |
| RL-H17 | **〔改计划·新增任务卡追加阶段〕** 实跑新增一张任务卡：`planner-amend` 改开发方案 + marker `cards` + 追加该卡的 W／C／R／F 阶段行 → **编排开到新 W 阶段时才拉监工**，builder 照常建七件套 | 开发方案与 marker 的 diff、追加的阶段行、编排开出新阶段的账本片段、新卡任务工作区的建立记录 | 跨卡追加时编排能不能正确开出新阶段；「七件套不由改计划实例建」这个分工是否顺手 |
| RL-H7 | 只改 `roles.toml` / `dh-mapping.toml` / 模板调整一次协作方式，不改代码 | 改动前后 diff + 新计划生成的 relay_plan | 「改协作 = 改配置」是否真的成立 |
| RL-H10 | **〔E-账本〕** 只给你账本，不给别的 | `relay_log.jsonl` 全文 | 你能否只凭它还原出当时发生了什么、卡在哪、谁救的场 |
| RL-H11 | **〔watch 实测〕** 监工正在 `working` 时 watch 发来的 prompt 是否被排队而非丢弃——Claude Code 与 Codex **分别验** | 两种监工各自：制造 working → 触发推送 → 展示收到时刻与内容 | 推送在忙时是否可靠，要不要退回前台循环 |
| RL-H12 | **〔watch 实测〕** watch 进程死亡后 20 分钟兜底是否接住 | 杀掉 watch → 展示下一次例行查看的时刻与发现 | 兜底是否兜得住，20 分钟是否可接受 |

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
- 首版不做 `watch`（P2 组件，设计已冻结见 §3.6）；落地后也只通知不写账。
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

1. **skill 两侧同步方式**：Claude Code 侧与 Codex 侧五个文件要求内容一致，用软链、复制脚本还是手动由开发方案定。→ RL-A32
2. **AGENTS.md 编排协议段**：新增 relay-light 一段（worker 完成即停、无 `node_closed`、标头判定），现有 Runner 铁律标「冻结流水」。→ RL-A28 / RL-A34
3. **AGENTS.md 模块身份**：「本仓只有一个模块」与 `dh` 自动选模块的描述随双模块现状同步改。→ RL-A29
4. **一致性对照任务**：relay-light 与现役 Runner 是同一问题域的两条并行路径，B 段须出对照任务，逐条列两者对「节点 / 角色 / 事件 / 关闭」的定义差异并裁决「有意差异」还是「遗漏」。
5. **教训候选回流**：把 §15 自查里的三条新教训提进 `knowledge/教训库-候选.md`。
6. **改计划实例的提示词与白名单校验**：`planner-amend` 的提示词模板（输入四件、一次改完、跑 lint 修到过、碰禁区写「超出范围」）与白名单校验怎么落地（`git diff --stat` 比对还是别的形式），由开发方案定。→ RL-A122
7. **绕过 B-adjust 的决定要写进 AGENTS.md**：relay-light **有意绕过** dev-harness「改开发方案须 B-adjust 用户确认」这条，须在 AGENTS.md 的 relay-light 编排协议段注明，免得后来人当成违规。→ RL-A28 / §1.3

## 15. 查漏自查（对照 dev-harness `references/查漏清单.md`）

| 检查项 | 结论 |
|---|---|
| A-full 顺序 | 已走到「草案 → 六轮 fresh 复核 → 主控裁决 → 结构性调整」。**用户整版确认未做**，故仍在 `drafts/`，**不预建 `design/README.md`**——空 `designInputs[]` 会被 resolver 判 fail closed。 |
| 候选稿边界 | 已标「共创草案 · 未生效」；不进 `designInputs[]`，不作 B 输入。审核证据晋级时落 `design/evidence/`。 |
| 扫 knowledge/ 教训库 | 已扫。命中并规避：候选-5（大小写，RL-A41/A42）、候选-10（append + superseded，§4.4）、候选-18（陈锁自动回收，§13）、候选-38（入口能解析≠能执行，适配层）。 |
| 扫 knowledge/ 设计期知识库 | 该库在本仓不存在，按「库不存在跳过不算违规」处理。 |
| 扫 backlog | dh-relay 的 backlog 是那个模块的池子；relay-light 本次未从中拉走条目。 |
| 持久化产物退场路径 | §12 已逐类写「谁删 / 何时删 / 删失败怎么办」；纯追加后无临时文件问题；「只写不删」为显式选择并给了理由。 |
| 核心决策清单 | §1.3 十六条**全部已决**（2026-09-09 补入「运行中改计划」一条），均标不可逆程度；无遗留待决策项。 |
| 与 dev-harness 的规则冲突 | relay-light 的改计划实例**有意绕过**「改开发方案须 B-adjust 用户确认」，已在 §1.3 记为显式决策、§4.5.3 写明适用条件、§14 第 7 条要求写进 AGENTS.md。设计方案与验收清单仍走 dev-harness 原路，不绕。 |
| 单点风险 | 编排是常驻单点，挂掉则计划停摆但账本不断流（阶段边界可续跑，§7.3）。监工按阶段独立，单点半径从整个计划缩到一个阶段——这是本轮结构调整最大的收益。Herdr 仍是无退路的必备项。 |
| 教训候选（本卡新增） | ①**阻塞式等待放后台再结束回合 = 监控断线**（ThinkPad 实测）。②**同名不同义的枚举必须分层**：Herdr 的 `done` 与账本的 `done` 一个是「停下」一个是「验收合格」。③**两个系统各有一个叫 workspace 的东西时必须先改名再设计**，否则每条规则都要带定语。 |
| 拓扑与 worktree 纪律 | 一阶段一终端空间（cwd 指向该卡 worktree），与宪章「一卡一 worktree、收口即删树」同拍；**先关终端空间再删树**。 |
| 密钥红线 | §13 与 skill 核心引用宪章第 6 条，RL-A27 以规则原文检查为主、grep 为 smoke。 |
| 跨语言复用风险 | 账本是 Python、现役 Runner 是 PowerShell，只能借手法不能借代码；且只借纯追加、不借原子替换。 |
| 验收二分与原子化 | 已按机器证/人判分栏，人验栏只留业务判断。AI 栏凡含两个以上可独立失败断言的均已拆分。共享 E-ID：E-链路（RL-A30 / RL-H1）、E-账本（RL-A31 / RL-H10）。 |
| 验收 ID 稳定性 | 包内唯一，新条目一律续号（本轮 §4.5 续到 RL-A119～RL-A123、RL-H16、RL-H17），不复用退役号。**已退役且不再复用**：RL-A1/A3/A4/A6/A20/A22/A23/A25（原子化拆分）、RL-A8/A76/A79/H8/H9（结构调整后语义改变）。 |
| 一致性对照 | 已列为 §14 第 4 条开发方案同步项。 |
| 数据口径契约 | 本模块不涉及指标口径，N/A。 |
