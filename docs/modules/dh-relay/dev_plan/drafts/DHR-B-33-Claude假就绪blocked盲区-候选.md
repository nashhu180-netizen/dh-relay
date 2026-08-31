<!-- dh:v1 · dev_plan/drafts/DHR-B-33-Claude假就绪blocked盲区-候选.md -->
# DHR-B-33 候选 · Claude 假就绪导致的 blocked 盲区（v2 · 草案）

> 状态：**草案 v2，已过一轮 fresh 只读审核，未经用户确认、未落盘**。它不发 ID、不授权开工。
> v2 = 按 [evidence/33](../../design/evidence/33-DHR69-Claude假就绪blocked盲区-B调整交叉审核记录.md) 第一轮裁决修订（`W-01`~`W-09` 全部采纳，无驳回）。**其中 `W-01` 推翻了 v1 的一条核心论证**（"误判会自愈"），已按裁决重写 §3.1。
> 触发：`design/13`（A-27 正式输入）§0 登记的硬前置 `F-6809`；用户 2026-08-31 对话明文「现在拆」。

## 1. 触发与授权链

- **上游设计输入**：[design/13 §0](../../design/13-目录信任自动放行-产品设计与验收.md)（`DHR-A-27`，2026-08-31 用户整版确认，`designInputs[]` 正式输入）明写：`F-6809` **必须先于** A-27 的 B-adjust 单独立卡并收口，`A27-M7` 依赖它成立。
- **实测证据**：[evidence/32 §2](../../design/evidence/32-A27-目录信任能力矩阵-实测.md)（只读能力矩阵，六形态 × 两产品）。
- **用户指令**：2026-08-31 对话明文「现在拆」，承接主控上一轮「要我现在去拆 `F-6809` 那张卡吗」的提问。
- **本次只发一张任务卡**，但它**不只装 `F-6809`**：
  - 【`W-07` 采纳】v1 写的"本次只拆 `F-6809` 一张卡"会掩盖 §3.2 同时提议**并入 `F-6807`**。二者是**两件事、两个确认点**：拆卡本身、以及是否把 recovery 缺陷并进同一张卡（`D-B33-2`）。用户确认时**分开列**，不以"F-6809 单卡"一句概括。
- **A-27 主卡本次不发 ID**。`design/13 §6` 拟议的第二张卡，其前置 `P-A1`（两产品信任条目配置格式）、`P-A2`（并发写协议）均未实测，且 `A27-M5` 的上限 `N` 按 `V-06` 必须在进入 B-adjust 前冻结为有限正整数，现仍待定。**在这三项补齐前拆主卡等于把"待定"写成"已定"，违反 `[G8]`。**

## 2. 缺陷的完整面（**比 `F-6809` 初登记更宽**）

`F-6809` 初登记只写了启动期。主控为本次拆卡回读 `workflow-driver.mjs` 全段后确认：**同一个假 `idle` 在三个时点各造成一次伤害，且第二个此前未登记。**（两名复审均逐条打开代码核对，确认三条属实；并确认②"此前未作为 finding 登记"属实。）

实测信号（evidence/32 §2 第 6 行 `claude / outside`，同一时刻）：

| 信号 | 值 |
|---|---|
| `herdr agent start` 退出码 | **0**（成功） |
| `agent get` 的 `agent_status` | **idle** |
| `pane get` 的 `agent_status` | **blocked** |
| 屏幕文本 | 就是目录信任框 |

| # | 时点 | 现役代码 | 后果 | 此前是否登记 |
|---|---|---|---|---|
| ① | **启动期** | `herdr-executor.mjs:73` 的 `agent_not_ready` 不触发（exit 0）；`:98` 的就绪轮询继续条件是 `!['idle','working'].includes(status)`，假 `idle` 使它立即退出，故 `:106` 的 `launchBlocked` 也不置位 | `launch_blocked=false`、`blind=false` → driver 立即把 Receipt 提交指令 `sendToHerdrAgent` 打进信任框 = 静默挂死 | 是（`F-6809`） |
| ② | **轮询期** | `observeHerdrAgent`（`herdr-executor.mjs:111`）只读 `agent get`；假 `idle` 落进 `workflow-driver.mjs:351` 的 `done \|\| idle` 分支 → `waitForExecutorResult` 等不到 → 写 `E_EXECUTOR_RESULT_MISSING` 并 **return 结束 Attempt** | 不止是挂死，还是**归因错误**：真实原因是"在等你按信任框"，账上却记成"executor 没交结果"。人看账本会去查错方向 | **否——本草案首次登记** |
| ③ | **recovery 期** | `workflow-driver.mjs:274` 的 `if (receiptBound && recovery)` 分支**无条件**发提交指令，中间**一次观测都没有** | 恢复到一个正卡在框上的 agent 时，必然把指令打进框里；且这一支连 ① 的检测都绕过了 | 部分——即 `F-6807`（DHR_68 范围外跟踪项，挂在候选-11） |

> **① 的证据边界（承接 design/13 §0，如实保留）**：evidence/32 同批实验里 `agent get` 与 `pane get` 本就会因采样时刻不同而短暂不一致（codex 两行是 working↔idle 互换），所以**单次观测不足以证明"每次启动必现"**。因此本卡的关闭判据**不是再观测一次真实产品**，而是**受控回归夹具**：构造 `agent get` 返回 `idle` ∧ `pane get` 返回 `blocked`，断言 relay 的行为。**本卡不跑真实 Agent。**

## 3. 修法与三个决定点

### 3.1 决定点 D-B33-1：修在哪一层，以及**持续不一致怎么收敛**

| 方案 | 内容 | 代价 |
|---|---|---|
| **甲**（窄） | 只在 `launchHerdrAgent` 的就绪判定里交叉核对 `pane get` | 只修 ①。② ③ 原样保留，卡面承诺只能写"启动期不打进框" |
| **乙**（观测层，**主控推荐**） | 在 `observeHerdrAgent` 里做**条件交叉核对**：仅当 `agent get` 报 `idle` 时才多读一次 `pane get`；`pane get` 报 `blocked` 才把该次观测判定为 `blocked` | 每次 `idle` 观测多一次 CLI 调用；`host_observation_changed` 的语义面变宽；**并引入下述"持续不一致"问题** |

**推荐乙的理由**：

1. ② ③ 与 ① 是**同一个假 `idle`**，不是三个 bug。只修 ① 会让卡面承诺变成半真——这正是 A-27 四轮复审反复抓主控的那类表述。
2. A-27 的 `A27-M11` 本来就要求"中途未预置嵌套仓 × 假 `idle` 形态"零提交指令。那是 ② 的形态。修在观测层，A-27 主卡才不用再动一次同一段代码。
3. 只在 `idle` 上核对，不碰 `working` / `done` / `unknown`，避免每轮双倍 CLI 调用。

> **⚠️【`W-01` 采纳 · v1 的原第 2 条理由已被推翻，保留形成史】** v1 写的是「失败方向是安全的：一次误判只会晚发几百毫秒，会自愈，因为 DHR_68 已建好离开 blocked 后恰补发一次的路径」。
> **两名复审各自独立打开代码核出这句是假的**：补发的条件是 `instructionPending && observation.herdr_status !== 'blocked'`（`workflow-driver.mjs:333`）。派生状态是从 `pane get` 来的——**若 `pane get` 持续报陈旧的 `blocked`，派生状态永远离不开 `blocked`，指令永不补发**。而 evidence/32 只证明两个信号"曾经不一致"，**从未证明 `pane get` 会自行刷新**。所以正常打完一轮变 `idle` 的 agent 可能被**永久**扣在 `waiting_human`，不是"晚几百毫秒"。

**因此本草案补上一条明确的收敛策略（成为验收项 `机器证 F`，不是提示）**：

- **判定方向仍是 fail-closed**：`idle` ∧ `pane=blocked` → 判 `blocked`、扣住提交指令。**宁可停下等人，也不把指令打进框。**
- **但不允许静默地永远停下去**。两信号**持续不一致超过 `T`**（冻结为 **60_000 ms**，与现役 `observationLostMs` / `doneTimeoutMs` 同形态、同为 driver 默认参数，**不新增环境变量或 registry 字段**）时，**恰再写一条**可区分的升级 Attention（`reason` 用一个**新的、专表"宿主两个状态源持续打架"**的错误码，不复用 `E_EXECUTOR_HOST_LOST` / `E_EXECUTOR_RESULT_MISSING`），把两个原始信号一起摆出来。**指令继续扣住**——升级只改变可见性，不改变安全方向。
- **一致后恰补发一次**提交指令（沿用 DHR_68 的既有路径，不新写第二条补发逻辑）。

> 这条正是本卡的立卡理由本身：**不静默**。一个"两个状态源持续打架"的宿主，本身就是该让人看见的事实，而不是一个安静的永久等待。

### 3.2 决定点 D-B33-2：`F-6807`（③ recovery 分支）是否并入本卡

**主控推荐：并入。** 理由：本卡的命题是「relay 绝不把提交指令发给一个正卡在框上的 agent」。recovery 分支不修，这句话在恢复路径上就是假的——命题拆不开，测试夹具、允许路径、改动文件三者完全重合。并入不是顺手扩范围，是让命题闭合。

**并入的代价**：允许路径含 `workflow-driver.mjs` 的 recovery 分支（DHR_68 时该文件只放开了启动期 blocked 事件路径）。仍**不动 Result 判定**（该边界的精确定义见 §4 允许路径限定，`W-04` 采纳后已改写）。

**【`W-03` 采纳 · 并入后带出一个必须由用户裁的口径问题】**：`instructionPending` 只是 driver 的**内存变量**（`workflow-driver.mjs:223`、`:333`），**没有任何持久化记录"这个 Attempt 是否已经发过提交指令"**。所以"恰补发一次"到底指什么，有两解：

| 解 | 含义 | 代价 |
|---|---|---|
| **收窄（主控推荐）** | "恰补发一次" = **单个 driver 届内**恰一次；**显式接受**「指令已发 → driver 重启 → recovery 再发一次」这条跨届重复 | 承诺弱一点，但可在本卡范围内被机器完整证明。重复发送的下游代价有限：DHR_64 已把 Receipt 绑定的结果提交做成幂等 |
| 放宽 | "恰补发一次" = **Attempt 全生命周期**唯一 | 必须持久化发送状态 → 要动 Store / Receipt，**超出本卡允许路径**，且与 A-27 主卡的 `relay.event/v2` 契约改动撞车 |

**若用户不同意并入**：本卡命题收窄为"启动期与轮询期"，`F-6807` 继续挂候选-11，且 A-27 的 `A27-M10`（recovery 路径同源）将带着一个已知未修的缺陷进入主卡。

**【`W-08` 采纳】边界重申**：并入 `F-6807` 只是让本卡的命题覆盖 recovery 路径，**不等于本卡承接了 `A27-M10` / `A27-M11`**——那两条仍是 A-27 主卡的验收项，本卡只是使它们成为可能的前置。

### 3.3 决定点 D-B33-3：`DHR_35` 是否新增依赖本卡

**主控推荐：新增依赖。** `DHR_35` 是 Windows 真实闭环实录，用的就是真实 Claude Code。一旦撞上假 `idle`，产出的不是一条失败记录，而是**一条错误归因的记录**（②：记成 `E_EXECUTOR_RESULT_MISSING`）。实录证据被污染比实录失败更贵。

> **【`W-09` 采纳 · v1 的一句不可证表述已删】** v1 写「跑在固定 fixture 根 + 幂等 `bootstrap-fixture-trust.ps1` 上、**撞信任框概率低**」。该概率**没有证据支撑**，已删。现在只摆两条路和各自的证据边界，不把业务取舍包装成技术必然。

| 路 | 得到什么 | 证据边界 |
|---|---|---|
| **等**（推荐） | 实录里的每一条归因都可信 | `DHR_35` 再等一张卡 |
| **先跑** | 更快拿到真实现象 | 实录必须**显式登记**「本次实录不用于证明 Claude 假 `idle` 情形已被正确归因」 |

**【`W-06` 采纳 · 这是理解风险，确认时须单列】** 现役 P6 任务表白纸黑字写着 `DHR_35`「**已无技术阻塞**」（`P6 §3.1`）。采纳本项等于把它改回"有阻塞"。用户已多次表达想尽快重跑实录——**这是取舍，交用户裁**，且确认本草案**不等于**授权重跑真实 Agent。

## 4. 任务卡草案（拟发 ID `DHR_69`）

> `DHR_36~40` 为已取消历史 ID 不复用；`DHR_41~62` 已用于其它计划；`DHR_69` 全仓未占用（主控已 grep 核，两名复审独立复核确认）。

- **目标**：让 relay 在 **Claude 报"假就绪"**（`agent get` = `idle` 而实际卡在产品对话框、`pane get` = `blocked`）时，仍能判定为 blocked，并落到 DHR_68 已冻结的人工暂停行为上——**保留 handle、不关 pane、扣住 Receipt 提交指令、恰写一条带真实 blocked 观测的 `human_input_requested`、一致后恰补发一次**；且**两信号持续打架时不静默永等，而是升级为一条可区分的 Attention**。覆盖**启动期 / 轮询期 / recovery 期**三个时点。
- **非目标**：
  - **不预置、不写、不读任何产品配置**（那是 A-27 主卡的事，本卡一个字节都不碰）；
  - **不代答任何对话框、零按键**（全路径无 `send-keys` / `send-text` 新增调用面）；
  - 不改 Receipt / Result / Store / RPC / contracts 语义；
  - 不改用户级 registry、凭据、账号或额度配置；
  - **不跑真实 Agent**——关闭判据是受控回归夹具（§2 证据边界）；
  - 不碰 Linux / SSH；不承接 `A27-M7` / `A27-M10` / `A27-M11` 本身（那是 A-27 主卡的验收项，本卡只是前置）；
  - 不修 `F-6808`（as-built delta），另行处理。
- **验收口径**（全部机器证，无人判项）：

  | ID | 命题 | 自动证据 |
  |---|---|---|
  | **机器证 A** | **启动期**：夹具令 `agent start` 返回 exit 0、`agent get` 返回 `idle`、`pane get` 返回 `blocked` → adapter 返回 `launch_blocked=true` 且保留 handle、不关 pane、不额外创建 Attempt/Result；driver **不发**提交指令，**恰写一次**带 blocked 观测的 `human_input_requested`，不写 `E_EXECUTOR_HOST_LOST`。Codex 的既有 `agent_not_ready` 路径 argv 与行为**逐字不变**（负例断言）。 | fake 正负例 + driver 事件序列断言 |
  | **机器证 B** | **轮询期**：agent 启动时正常，中途转为假 `idle`（`pane get` = `blocked`）→ **不得**落进 `done\|\|idle` 分支、**不得**写 `E_EXECUTOR_RESULT_MISSING`、**不得**结束 Attempt；须走 blocked 分支并恰写一条 `human_input_requested`。此为本草案首次登记的后果 ②。 | driver 事件序列断言 |
  | **机器证 C** | **recovery 期**（`D-B33-2` 采纳时生效）：恢复到一个假 `idle` / 真 `blocked` 的 agent → 发提交指令**之前**先做一次观测；观测为 blocked 时扣住指令走人工暂停，离开 blocked 后**在同一 driver 届内恰补发一次**。**【`W-03` 采纳】口径显式收窄到"届内"**：跨 driver 重启的重复发送**是本卡明确接受的已知限制**，须写进卡面与 `progress`，不得表述成 Attempt 级唯一。 | driver recovery 双路径断言 + 跨届重复的显式负向登记 |
  | **机器证 D** | **不静默改写观测**：`host_observation_changed` 同时含 `agent get` 原始值、`pane get` 原始值与派生结论三者；仅在 `agent get` = `idle` 时才发起 `pane get`（`working` / `done` / `unknown` 三态下 `pane get` 调用次数断言为 0）。 | 事件字段断言 + CLI 调用计数断言 |
  | **机器证 E** | **fake 形态取证纪律（承接 DHR_68/D）**，**【`W-02` 采纳】拆成两半，两半都可机器判**：<br>**E-1** 一个**可复跑的只读 shape probe 脚本**（`herdr pane get` / `agent get` 的真实返回：exit code、是否 JSON、`agent_status` 字段路径与取值域），probe 自身带**自动解析与断言**，不是给人读的表格；<br>**E-2** fake 的 `paneGet` 必须按 E-1 的实测形态返回（现役只是个 `paneAlive` 布尔桩，**没有状态字段，不得照它想当然**），并以 evidence/32 已实测的 `F-6809` 形态作为 fixture 的事实基准。 | E-1 可复跑 probe（只读，不启动产品 Agent）+ E-2 fake 形态断言 |
  | **机器证 F** | **【`W-01` 采纳 · 新增】持续不一致必须收敛且可见**：夹具令 `agent get` = `idle` ∧ `pane get` = `blocked` **持续超过 `T`=60_000 ms** → 断言：①提交指令始终未发；②初始 Attention **恰一条**；③超过 `T` 后**恰一条**可区分的升级 Attention（新错误码，不复用 `E_EXECUTOR_HOST_LOST` / `E_EXECUTOR_RESULT_MISSING`），事件里同时留两个原始信号；④两信号恢复一致后**恰补发一次**提交指令。**不得出现"安静地永远等下去"。** | driver 事件序列 + 假时钟夹具 |
  | **有效单测（重核卡必做）** | 变异点由第二轮复核实例选点：把交叉核对判据改坏（如 `pane get` 结论被忽略）后，指定测试必须变红。 | 改坏必红九字段 |

- **变更范围**：

  <!-- dh:allowed-paths:v1 task=DHR_69 -->
  - `relay-core/runtime/executors/herdr/herdr-executor.mjs`
  - `relay-core/runtime/workflow-driver.mjs`
  - `relay-core/test/herdr-adapter.test.mjs`
  - `relay-core/test/helpers/fake-herdr.mjs`
  - `relay-core/test/dhr69-false-ready.test.mjs`
  - `relay-core/package.json`
  - `docs/modules/dh-relay/workspace/DHR_69/**`

  **【`W-05` 采纳】`herdr-cli.mjs` 已从清单中删除**——复审核出现役 `herdr-cli.mjs:80` 已经暴露 `paneGet()` 且返回完整 pane 数据，`herdr-executor.mjs` 的 `entity()` / `field()` 能直接解包，本卡**不需要**改它。

  **限定**：
  - `workflow-driver.mjs` 只可改**观测→事件路径**与 **recovery 分支的发送时机**。**【`W-04` 采纳，边界改写】**「不动 Result 判定」的精确含义是：**不得修改 Receipt-bound Result、等待超时与 `E_EXECUTOR_RESULT_MISSING` 的语义**；但**允许**因受机器证支撑的派生 `blocked` 而使该分支**不可达**——那正是机器证 B 要的结果，不是越界。
  - `package.json` 只可向既有 test script 追加本卡新测试文件这一个 token。
  - 不得改 `herdr-cli.mjs`、`profile-registry.mjs`、`service.mjs`、Store、RPC、contracts、用户级 registry，或 `DHR_35` / `DHR_68` 的工作区。
- **档位**：标准（外部宿主组件接线 · 高危五类之一）。
- **任务类型**：重核 `heavy`（改的是启动与观测语义 + driver 事件序列，且是 A-27 的硬前置）。
- **依赖**：`DHR_67`（其 Claude `pane run` 启动路径是本卡的直接上游）、`DHR_68`（本卡修的是它留下的 Claude 侧盲区，且复用它冻结的人工暂停行为）。
- **实施提示**（≤3 条，只写约束）：
  1. 必须另行 D-start；本卡授权不等于开工授权。
  2. `pane get` 的真实返回形态**先取证再写 fake**（机器证 E-1 在前、E-2 在后）——这正是 DHR_68 存在的原因，不得重犯。
  3. 交叉核对**只在 `agent get` = `idle` 时发起**，不得改成每轮双读；也不得反向"用 `agent get` 覆盖 `pane get`"。

## 5. 依赖与状态变更

- 新增 `DHR_69`（标准 / heavy），状态 `未开始`。
- 依赖图：`DHR_67, DHR_68 → DHR_69`；若 `D-B33-3` 采纳，再加 `DHR_69 → DHR_35`。无环。
- `DHR_35` 保持 `进行中`；若 `D-B33-3` 采纳，其依赖列增加 `DHR_69`，备注中「已无技术阻塞」须**同步改掉**（`W-06`）。
- `DHR_68` 保持 `已完成`，**但任务表备注列须补一句**：「其启动期 blocked 检测对 Claude 的**假就绪**形态失效（`F-6809`），反例与修复由 `DHR_69` 承接」。**理由同 B-32 对 DHR_67 的处理——不接受只写在草案里，阶段闸读的是任务表。**
- `F-6807` 若按 `D-B33-2` 并入，则从候选-11 的"范围外跟踪"转为 `DHR_69` 的机器证 C，**并仍是 `DHR_69` 的一个独立收口项**（`W-08`）；`F-6808` 不动。

## 6. 不变项

`design/13` 的目标、边界、`A27-*` 稳定验收 ID 与 D-1 / D-2 / §1.3.5 三项用户裁决**均不变**；`design/12` 的 `P6-RI-A1~A5` 定义与稳定 ID、Receipt / Result / Store / RPC / contracts 合同、Linux `B-22`① 延后语义、`P6-M1~M7`、`DHR_35` 的真实闭环责任与允许路径**均不变**。本卡是"修实现以兑现既有语义"（design/06 H1/H5 的启动期人工暂停命题在 Claude 上本就该成立），**不改任何稳定验收 ID，故不触发 A-full**（两名复审独立复核确认该判断成立）。

## 7. 授权边界

本草案落盘（若用户确认）**只授权**：P6 DevPlan 的任务表、任务卡、依赖与备注同步，加上本次审核工件入仓。

**不授权**：`DHR_69` D-start、任何生产代码改动、真实 Agent、产品配置读写、A-27 主卡发 ID、`P-A1` / `P-A2` 实测、verify、合并、推送、部署或环境操作。

## 8. 审核账

一轮 fresh 只读审核（`b33rev1` / `b33rev2`，两名互不可见），共 10 条、去重后 **9 个独立议题：采纳 9 · 驳回 0**。裁决与落点见 [evidence/33](../../design/evidence/33-DHR69-Claude假就绪blocked盲区-B调整交叉审核记录.md)。**其中 `W-01` 推翻了 v1 的一条核心论证**，`W-02` / `W-03` 各补上一条本来证不了的验收，`W-05` 砍掉一条多余的允许路径。
