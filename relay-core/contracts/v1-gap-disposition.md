# v1 协议缺口逐条处置表

> **这是什么**：P4 Pilot 拿真实历史 v1 现场做只读投影时，逐条撞出来的协议缺口。DHR_28 冻结 v2 协议时必须对每一条给出**明确处置**——采纳进 v2 字段，或显式不采纳并写明理由。**不许留空、不许写"待定"。**
>
> **缺口清单来源**（逐行照抄，不改写）：[`design/evidence/10-P4-多控制面Pilot报告.md` §4「v1 协议缺口清单」](../../docs/modules/dh-relay/design/evidence/10-P4-多控制面Pilot报告.md)。详证见 DHR_27 findings F-002 与 `relay-control-pilot/src/read-model/project-v1.mjs` 映射表。
>
> **所有权**（B-13 二分，DevPlan §0.2）：**本处置表 → DHR_28**（契约冻结时裁决）；**正式 Read Model 冻结 + 关闭 P4 列表投影白名单例外 → DHR_30**。P4 报告原文按留痕原则不回改，差异由 DHR_50 附录按诚实差额机制核对。
>
> **G 编号锁**：`G1`~`G6` = P4 §4 表**自上而下的行序**，**锁定不得重排**——ADR-002 有四处前向引用（`G5` / `G6`），重排会使其静默失效。见 `../adr/ADR-002-agent-host-ownership.md`「G 编号锁」。

## 处置表

每条以可 grep 锚点 `v1-gap-disposition: <gap-id>` 起头。

---

v1-gap-disposition: G1

| 项 | 内容 |
|---|---|
| **缺口（P4 原文照抄）** | v1 不记录 `workflow_name / summary / trigger / trigger_by` |
| **P4 投影期处置（原文照抄）** | `project` 强制操作员补供（缺则 exit 2 点名），`source_refs` 加 `note` 留痕"操作员补供" |
| **P4 给 P5 的含义（原文照抄）** | v2 协议应把"这是什么活、谁触发"记进 run 现场 |
| **v2 处置** | **采纳进 v2 字段** |
| **落到哪个 schema 的哪个字段** | `relay.run/v2`：`workflow_name`（必填）、`summary`（必填）、`trigger`（必填，枚举 `human` / `schedule` / `system` / `upstream`）、`trigger_by`（`trigger=human` 时必填，其余可空） |
| **理由** | P4 实证这四项**缺失即无法投影**——操作员被迫在投影时补供，等于把"这是什么活"的真相放在了人的脑子里而不是 run 现场。Runtime 是 Run 真相的唯一写者（design/05 §4 三类真相），起活时它必然知道这四项，没有理由不记。列为必填而非可选：可选会让"缺省"重新变成常态，P4 的痛点原样复发。`trigger_by` 条件必填是因为 `trigger=schedule/system` 时没有自然人主体，强填会造假。 |

---

v1-gap-disposition: G2

| 项 | 内容 |
|---|---|
| **缺口（P4 原文照抄）** | 无 run 级状态 |
| **P4 投影期处置（原文照抄）** | 投影器（源头侧）按节点聚合：failed > running > waiting_human > 全 succeeded；表外→unknown，unknown 归 `needs_you` 浮顶不沉底 |
| **P4 给 P5 的含义（原文照抄）** | v2 应源头记 run 级状态，或冻结这套聚合语义为协议 |
| **v2 处置** | **采纳进 v2 字段**（两条含义**都取**：源头记 + 聚合语义入协议） |
| **落到哪个 schema 的哪个字段** | `relay.run-state/v1`：`run_status`（必填，枚举 6 值）+ `group`（必填，枚举 4 值）；同 schema 内以规范性条款冻结**七档**聚合优先级，其中①~⑥由文末 `allOf` **机器强制**：①任一节点 `failed` 或 `orphaned` → `failed`；②否则任一 `running` → `running`；③否则任一 `waiting_human` → `waiting_human`；④否则任一 `unknown` → `unknown`；⑤否则任一 `pending` → `pending`；⑥否则全部 `succeeded` → `succeeded`；⑦节点集合为空 → `pending`（`node_states` 有 `minItems:1`，故本档在合法线路上不可达，是计算期防御档）。`unknown` 必须归入 `needs_you` 分堆（不得沉底），但 **`pending` 归 `running`**。 ⚠️ **本行原写四档口径（`failed > running > waiting_human > succeeded`，表外一律 `unknown`），已按批次检查点 2 小审 D-19（findings F-025）与 E2 代码复核轮 2 · P1-1 更正**。原因：v2 的 `node_state.status` 比 v1 多了 `pending` 与 `orphaned` 两值，二者落在旧表外走 `unknown` → 经 `group` 硬拦浮顶 `needs_you`，会把**每一个刚创建的 Run 以及每两个节点之间的空档**都变成报警噪音。 **这条为什么必须改**（E2 实测）：照本行原口径构造的三份载荷——「全 `pending` 的新 Run 记 `unknown`/`needs_you`」「`[succeeded, pending]` 记 `unknown`」「`[orphaned, running]` 记 `unknown`」——**被本卡自己交付的校验器逐份拒收**。DHR_29 若照旧口径实现聚合逻辑，产出的每一份 run-state 都过不了闸，而且实现的正是 D-19 判死的那个病灶。（⚠️ 上方标「P4 投影期处置 · 原文照抄」的行**保留旧文字不动**，那是留痕。） |
| **理由** | P4 给的是"或"，本卡取"且"，理由是二者解决的不是同一个问题：**源头记** 解决"客户端不必推导"（Read Model 架构约束：分堆与排序由源头给），**冻结聚合语义** 解决"源头怎么算出这个值"必须唯一、可复算、跨实现一致。只记不冻，两个 Runtime 实现会算出不同的 run_status；只冻不记，客户端又被迫自己算。`unknown` 浮顶而非沉底是 P4 已验证的安全默认——不认识的状态必须让人看见，不能悄悄埋掉。 |

---

v1-gap-disposition: G3

| 项 | 内容 |
|---|---|
| **缺口（P4 原文照抄）** | 无节点 title |
| **P4 投影期处置（原文照抄）** | `title = node_id` 1:1，不造语义 |
| **P4 给 P5 的含义（原文照抄）** | v2 节点应带人话标题 |
| **v2 处置** | **采纳进 v2 字段** |
| **落到哪个 schema 的哪个字段** | `relay.run/v2` 节点对象：`title`（必填，人话短标题）、`node_id`（必填，机器标识）。二者**分字段**，禁止用同一字段兼任 |
| **理由** | P4 的降级处置（`title = node_id`）是**诚实但有损**的：屏幕上出现的是 `fix` / `review3` 这类机器 id，人得自己翻译。要求 `title` 必填而非可选，是因为可选会让所有实现都省掉它、P4 的降级重新变成常态。**不允许 Runtime 自动用 `node_id` 兜底填充 `title`**——那等于把有损降级写进协议；缺 title 应在 Workflow 定义期就被拒绝（fail-closed），而不是运行期糊弄过去。 |

---

v1-gap-disposition: G4

| 项 | 内容 |
|---|---|
| **缺口（P4 原文照抄）** | 无 run 级 `attempt` |
| **P4 投影期处置（原文照抄）** | 缺省=源头不记，屏幕显示"未知" |
| **P4 给 P5 的含义（原文照抄）** | 沿用 DHR_25 结论："缺省不等于 1" |
| **v2 处置** | **采纳进 v2 字段**，并把「缺省≠1」提升为**协议级规范条款** |
| **落到哪个 schema 的哪个字段** | `relay.run/v2`：`attempt`（整数，`minimum: 1`，**可空**）。规范条款：`null` / 缺省一律表示"源头未记录"，**任何实现不得将其解释或渲染为 `1`**；渲染侧显示"未知" |
| **理由** | 这是四条里唯一**故意不设必填**的。`attempt` 表达的是"这个 Run 是第几次跑"，而"源头没记"与"确实是第 1 次"是两个不同的事实——强制必填会逼实现填一个假的 `1`，把"不知道"伪装成"知道"，正是 DHR_25 判死的那种失真。可空 + 禁止兜底解释，是把"不知道"如实保留在协议里。校验器不校验业务真伪，但**渲染层把 `null` 显示成 `1` 属违约**，批 3 以反例钉住。 |

---

v1-gap-disposition: G5

| 项 | 内容 |
|---|---|
| **缺口（P4 原文照抄）** | `brief_ref` 携带主机绝对路径 |
| **P4 投影期处置（原文照抄）** | 冻结时授权改写为相对路径；投影输出不含该字段 |
| **P4 给 P5 的含义（原文照抄）** | v2 一切 locator 必须相对/符号化（同 `log_locator` 校验） |
| **v2 处置** | **采纳，且提升为全域硬约束**（不限于 `brief_ref` 一个字段） |
| **落到哪个 schema 的哪个字段** | 全域：所有 locator 类字段统一 `$ref` 到 `relay.common/v1#/$defs/locator`。**实际使用点（逐个核过，非推测）**：`executor_profile.ref`（`_shared`）、`log_locator`（checkpoint / result）、`executor_ref`（event）、`source_refs[].path`（run）、`host_ref`（host-observation v0 形状）。⚠️ 本行原先列的 `adapter_ref` / `bridge_ref` / `server_ref` **在 12 份 schema 里一个都不存在**——它们只出现在 ADR-002 的散文里，批 2 落地时收敛成了单一 `executor_profile.ref`（按 `kind` 区分语义）。已按批次检查点 2 小审 D-4/D-5 更正，偏离登记见 findings F-016/F-018 |
| **pattern 实装口径（与实现同步，勿凭本行推测）** | `^(?![A-Za-z][A-Za-z0-9+.-]*:)(?![\\/~%]).+$`。两道守卫：①拒绝一切 scheme 形或盘符形前缀——含 `C:\x` / `C:/x` / **盘符相对 `C:x`** / `http://` / **单斜杠 `file:/etc/passwd`**（RFC 8089 下与三斜杠等价合法，只挡 `://` 会漏，批次检查点 2 小审 D-3 实测抓到）；②拒绝以 `\` `/` `~` `%` 起头——UNC、POSIX 绝对、**家目录展开 `~/x`**（展开后即含用户名的主机绝对路径，正是本条的隐私理由要挡的）、**环境变量展开 `%SystemRoot%/x``**。违规 → `E_ABSOLUTE_LOCATOR`。**有意从严**：`a:b` / `notes:x` 这类含冒号的相对路径一并被拒（放宽会同时放进 `C:x`），登记于 findings F-011 与 `_shared` 的 description |
| **理由** | 绝对路径进协议有两重伤害：**可移植性**（换机器即失效，跨 Windows/Linux 双平台是 P5 的硬要求）与**隐私**（主机路径含用户名等，AGENTS 宪章#6 要求进仓证据先按白名单过滤，P4 冻结时正是为此做了授权改写并只存哈希不存原值）。P4 只对 `brief_ref` 一个字段做了处置，本卡扩到全域——因为下一个新增的 locator 字段一样会踩，逐字段打补丁必然漏。用 schema `pattern` 而非运行时检查，是为了让它**静态可证**（承接验收口径第 2 条"fixture 与 schema 静态可证"）。 |

---

v1-gap-disposition: G6

| 项 | 内容 |
|---|---|
| **缺口（P4 原文照抄）** | `terminal_state` 是 psmux 会话观测态、非任务结果 |
| **P4 投影期处置（原文照抄）** | 不参与状态映射 |
| **P4 给 P5 的含义（原文照抄）** | v2 应把"会话观测"与"任务结果"分字段建模 |
| **v2 处置** | **采纳，且提升为跨 schema 的建模原则** |
| **落到哪个 schema 的哪个字段** | 分两处，**禁止混用**：①**会话/宿主观测** → `relay.host-observation/v1`（本卡只定 v0 形状，P6/P7 首次承重时冻结），承载 `observation_status`（如 `alive` / `observation_lost`）；②**任务结果** → `relay.result/v2`，承载 `outcome` 与 reason code。`relay.run-state/v1` 的 `run_status` **只能由任务结果推导**，不得读取任何观测态字段 |
| **理由** | 这条是六条里**语义最危险**的一条：把"终端会话没了"当成"任务失败"，会在真相账上留下假的失败终态，而 Run 可能还在跑。ADR-002 把同一原则用在了两处更要命的地方——第③问（DSH 作为控制客户端消失 ≠ 承载的 Executor 消失，前者绝不动 Run，见 design/06 H4）与第④问（Herdr `observation_lost` 不判死、只有拿到 server 明确否定才 `executor_lost`）。所以它不是"改一个字段名"，而是**一条贯穿协议的建模纪律**：观测态回答"我还看得见吗"，结果回答"这活成了没有"，两者永不同字段、永不互相推导。 |

## 处置汇总

| gap | 处置 | 关键落点 |
|---|---|---|
| G1 | 采纳 | `relay.run/v2`：`workflow_name` / `summary` / `trigger` / `trigger_by` ⚠️ `trigger` 的枚举相对 P4 pilot **改了两个值**：`api` → `system`、`parent_run` → `upstream`（E14 一致性复核 F-E14-5 补登记；原先只写了 v2 枚举、没写 pilot 侧叫什么，属 B-13 禁止的静默漂移）。`human` / `schedule` 两值不变 |
| G2 | 采纳（源头记 **且** 冻结聚合语义） | `relay.run-state/v1`：`run_status` + 聚合优先级规范条款 |
| G3 | 采纳 | `relay.run/v2` 节点：`title` 与 `node_id` 分字段，禁自动兜底 |
| G4 | 采纳（可空 + 「缺省≠1」入协议） | `relay.run/v2`：`attempt` 可空，禁解释为 1 |
| G5 | 采纳并扩到全域 | `relay.locator` 定义 + `E_ABSOLUTE_LOCATOR` |
| G6 | 采纳并升为建模原则 | `relay.host-observation/v1`（观测）vs `relay.result/v2`（结果），禁混用 |

**六条全部采纳，无一条"显式不采纳"。** 这不是偷懒——P4 §5 的 H4「负面（如实）」已经明说：v1 现场作为长期数据源不够，继续建 Runtime 就意味着 P5 要把这些缺口在 v2 协议里补齐。本表是对那句话的兑现。

**本表与 DHR_30 的交接**：G1~G4 直接决定 Read Model 的字段级定义，DHR_30 正式冻结 Read Model 时以 P4 两份 pilot schema（`relay.pilot-read-model/v1` / `relay.pilot-run-list/v1`）为字段级起点，**按本表修订**；字段增删须回链本表的 gap-id，不得静默漂移（DevPlan §2.3 B-13 条款）。

> ⚠️ **DHR_30 开工前必读：本卡已经替你冻掉了三个 Read Model 展示字段**（E4 需求复核 P3-2 + E14 一致性复核 F-E14-3 要求点明）。
> `relay.run-state/v1` 里的 `group`（必填 + 6 条 `run_status → group` 映射由 `allOf` 机器强制）、`progress`、`elapsed_seconds` 三个字段，本是 P4 `relay.pilot-run-list/v1` 的列表投影字段。本卡冻结它们是在授权范围内（§2.3 把 `relay.run-state/v1` 列进 DHR_28 要冻的最小协议集，G2 的处置权也在本卡），**但你从 DevPlan 的卡面上看不见这个天花板**——那里只说「以 P4 两份 pilot schema 为字段级起点、按处置表修订」。三条具体约束：
> 1. **`group` 是 `run_status` 的全函数**，携带零独立信息。将来若正式 Read Model 需要一种不是 `run_status` 纯函数的分堆，**须改契约**（这条同时是 `state_signature` 可复算的前提：源头对 group 有裁量 = 同一状态两个实现算出不同签名 = P5-M3 直接失效）。
> 2. **`group` 的词表与 pilot 不同**：pilot 是 `[needs_you, blocked, running, done]`，v2 是 `[needs_you, running, done, failed]`；`failed` 的归堆也从 `needs_you` 改成了 `failed`。理由见 `run-state` schema 的 `group` 注。
> 3. **`progress` 已按 F-E14-3 改回 pilot 的 `{done, total}` 计数对**（本卡首版擅自改成 0..1 比率，会让 P4 已验证、且被 B-13 列进 P5-M4 证据的跨屏断言「progress 等于详情节点实际计数」无法表达）。`done <= total` schema 表达不了——**归属更正（DHR_29 验收第 6 项；本行原文写「交你实现期守」是 B-15 拆卡前的陈旧指名）**：该约束归 **DHR_29** 实现期守，**且已守**：Store 回放构造性保证 `done` 只数 `succeeded` 节点、`total` 取 `nodes` 全集长度，反例钉在 `relay-core/test/store.test.mjs`（node_states 覆盖全集与 done<=total 一测）。你（DHR_30）读到的只是展示侧事实，不承担守卫。
>
> **另：`node_states` 必填 + `minItems: 1` 只约束「完整状态文档」这一形态**。列表 / 摘要投影**不复用**本协议，应沿 `relay.pilot-run-list/v1` 血统另立列表协议——别拿 run-state 当列表 schema 再回头说约束太紧。
