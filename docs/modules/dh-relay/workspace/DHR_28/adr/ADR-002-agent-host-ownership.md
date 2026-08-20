# ADR-002 · Agent 宿主归属（必答四问）

- **状态**：草案 · 待批次检查点 1 小审 + 用户裁决（与 ADR-001 同批摆出）
- **卡**：DHR_28（P5 批次 1）
- **必答来源**：DevPlan `P5-…-开发方案.md` §2.3「Agent 宿主 ADR 必答」四问，逐字承接
- **语言无关**：本 ADR 的结论**不依赖 ADR-001 的语言裁决**——四问答的是"谁持有 Executor、它消失时真相怎么记"，是协议与责任边界问题。仅第②问的实现手段（SDK 直连 vs Adapter）会被语言裁决影响，已在该节标出。

## 共同底座（四问共用的语义）

先钉三条，四问都在这三条上展开，避免每节重复：

1. **Attempt 是最小失败单元**（design/06 **H7**：「DSH-only Executor 丢失只影响对应 Attempt，不能污染其他节点或 Run 真相」）。Executor 消失 → 只终结**该 Attempt**，节点可重试；Run 真相与其他节点不受污染。
2. **换 Executor 必产生 fresh Attempt**（design/06 **H12**：「更换 Agent Executor 时产生 fresh Attempt，并重新经过相同质量链」）。禁止把新 Executor 的结果续写进旧 Attempt。
3. **客户端断开 ≠ 取消**（design/06 **H4**：「客户端断开、DSH 插件卸载和 SSH 断开均不隐式取消 Run」）。**"控制客户端消失"与"Executor 消失"是两件事**——前者不动 Run，后者只中断对应 Attempt。第③问的全部微妙之处都在这条上。

> 术语：**持有（own）** = 谁负责拉起进程/会话、谁观察它的存活、谁收它的结果。**代持（broker）** = Runtime 不直接持有，通过一个中间件（Bridge / server）间接观察，中间件消失时 Runtime 失去观察能力但 Run 本身不受影响。
>
> **G 编号锁（前向引用约定）**：本文多处引用 `G1`~`G6`，指 P4 主报告 §4「v1 协议缺口清单」表**自上而下的行序**（G1=不记录 `workflow_name/summary/trigger/trigger_by`、G2=无 run 级状态、G3=无节点 title、G4=无 run 级 `attempt`、G5=`brief_ref` 携带主机绝对路径、G6=`terminal_state` 是会话观测态非任务结果）。**该行序锁定、不得重排**——批次 2 步 7 落 `v1-gap-disposition.md` 时须先复核本锁，否则本文四处前向引用会静默失效（批次检查点 1 小审 F-5，findings F-006）。

---

## 第①问：process executor 由谁持有

**问题原文**：process executor 由 Runtime 直接持有。

- **归属**：**Runtime 直接持有**。Runtime 自己 spawn 子进程、持有其 PID、直接读 stdout/stderr 与退出码。不经任何工作台、不经任何 Bridge。
- **消失时的语义**：子进程退出码非 0 或被外部杀死 → 该 **Attempt** 终结为 `failed`，reason code 区分 `E_EXECUTOR_EXIT_NONZERO`（自己退的）与 `E_EXECUTOR_KILLED`（被外部杀的）。节点按 Workflow 的重试策略决定是否开 fresh Attempt（H12）。**Runtime 自身被强杀**是另一回事——那走 DHR_29 的 lease/恢复路径，不是本问。
- **恢复路径**：Runtime 重启后从事件账回放，看到"Attempt 已开始但无终态"的 process Attempt，按 PID + 启动指纹**探活**：进程还在 → 重新接管观察；进程已不在 → 该 Attempt 判 `orphaned`，开 fresh Attempt 重试（不复用旧 Attempt id）。
- **契约层如何表达**：`relay.event/v2` 的 attempt 生命周期事件带 `executor_kind: "process"` 与 `executor_ref`（**符号化 locator，禁绝对路径**——承接 P4 缺口 G5）；`relay.result/v2` 的 attempt 终态枚举含上述两个 reason code。process 是**唯一无需任何外部宿主的 executor**，因此它是 design/06 **H6**（「任一必经 Workflow 角色至少存在一个非 DSH-only 合法 Executor Profile」）契约层的**兜底满足者**。

answer: process-executor · Runtime 直接持有 · 子进程终态即 Attempt 终态 · 重启后按 PID+指纹探活，探不到判 orphaned 开 fresh Attempt · 契约层 executor_kind="process" 且作为 H6 的兜底非-DSH Executor

---

## 第②问：pi-agent 由 Runtime 直接持有 SDK/RPC，还是经冻结 Adapter

**问题原文**：pi-agent 由 Runtime 直接持有 SDK/RPC 或经冻结 Adapter。

- **归属**：**经冻结 Adapter，不直接持有 SDK**。理由三条：
  1. **协议中立性硬约束**：DevPlan §2.2 与 design/05 §6.2 禁止协议导入 Pi 私有类型。Runtime 直接 import Pi SDK，等于把 Pi 的类型与版本节奏拖进内核——即使协议文件本身干净，Runtime 的依赖树也不干净了。
  2. **DHR_26 的实测教训**：DSH 侧「`import Service` 会让插件可用性依赖安装拓扑」「靠 module fallback 解析 = 把正确性押在安装方式上」，最终必须改成零 bare import 才解耦（`workspace/DHR_26/findings.md` §7/§12e 取代注）。**这条教训对 Pi 同样成立**——直连 SDK 就是把 Runtime 的正确性押在 Pi 的安装形态上。
  3. **语言裁决不该绑架架构**：若 ADR-001 选 L-Go，直连 TS SDK 本就不成立；若选 L-TS，直连"能做"但会把上面两条代价一起买下。**Adapter 方案在两种语言下都成立**，这正是它该被选中的理由。
- **Adapter 的"冻结"含义**：Adapter 与 Runtime 之间只走**已冻结的 JSON/RPC 合同**（`relay.rpc/v1`），Adapter 内部怎么调 Pi 是它自己的事。Adapter 是**独立进程**，不与 Runtime 共享内存对象（同 design/05 §6.2 对 DSH 的要求）。
- **消失时的语义**：Adapter 进程消失 → 视同该 Attempt 的 executor 消失，Attempt 终结、reason code `E_EXECUTOR_ADAPTER_LOST`；**Run 与其他节点不受影响**（H7）。Pi 侧会话若仍活着但 Adapter 断了，Runtime **不假设**会话可续——按 H12 开 fresh Attempt，不把旧会话的后续输出续写进旧 Attempt。
- **恢复路径**：Runtime 重启 → 回放事件账 → 对无终态的 pi Attempt，尝试按 `adapter_ref` 重连 Adapter：重连成功且 Adapter 报同一 attempt 仍在 → 恢复观察；否则判 `orphaned` + fresh Attempt。
- **契约层如何表达**：`executor_kind: "pi-agent"`，另带 `adapter_ref`（符号化）。**协议里不出现任何 Pi 私有类型名**——Pi 的输入输出在协议层一律降为 `relay.result/v2` 的通用结构化结果。P5 阶段 pi-agent 属 **P5-X 条件项**（DevPlan §4.2），本卡只冻结合同形状，不要求实现 Adapter。

> **与 ADR-001 的耦合点（唯一一处）**：若用户裁决 L-TS，团队可能倾向"反正同语言，直连算了"。本 ADR 建议**即使选 L-TS 也走 Adapter**，理由见上第 2、3 条。若用户/复核认为该建议在 L-TS 下应放宽，须作为**方向决策**另行登记，不得在批次 2 写 schema 时静默改口。

answer: pi-agent · 经冻结 Adapter（独立进程、只走 relay.rpc/v1，不直连 SDK）· Adapter 消失即 Attempt 终结 E_EXECUTOR_ADAPTER_LOST，不假设 Pi 会话可续 · 重启后按 adapter_ref 重连，失败判 orphaned 开 fresh Attempt · 契约层 executor_kind="pi-agent" + adapter_ref，零 Pi 私有类型

---

## 第③问：DSH Native Agent 由 Bridge 代持时，DSH 消失如何标记 Attempt

**问题原文**：DSH Native Agent 由 Bridge 代持时 DSH 消失如何标记 Attempt。

> **本问按契约层回答**（DevPlan §3.1 DHR_28 备注逐字：「ADR 涉 DSH 的必答题按契约层回答，DHR_50 未收敛不阻塞本卡」）。实现侧的可行性由 DHR_49/DHR_50 收敛，本节只定协议怎么表达，并显式留口。

- **归属**：**Bridge 代持，Runtime 不直接持有**。DSH Native Agent 跑在 DSH 进程内，Runtime 只能通过 DSH Host Bridge 间接观察。Bridge 只走 RPC 合同、不碰内存对象（DevPlan §3.2 DHR_30 实施提示逐字）。
- **消失时的语义 —— 本问的核心，必须把两件事分开**：

  | 事件 | 对 Run 的影响 | 对 Attempt 的影响 |
  |---|---|---|
  | DSH 作为**控制客户端**断开 / 插件卸载 / 窗口关闭 | **无影响**（H4：不隐式取消 Run） | **无影响**——只要该 Run 没有跑在 DSH 里的 Executor |
  | DSH 消失，且**有 DSH-native Executor 正在跑** | **不取消 Run**（H4 仍然管用） | **仅该 Attempt** 终结，reason `E_EXECUTOR_HOST_LOST`；其他节点与 Run 真相零污染（H7） |

  也就是说：**"DSH 消失"不是一个事件，是两个**。协议必须能区分它们，否则一个关窗口的动作就会被误记成 executor 丢失。这条正是 P4 缺口 **G6**（`terminal_state` 是 psmux 会话观测态、非任务结果，须分字段建模）在 DSH 侧的同构——**会话/客户端观测态与任务结果必须是不同字段**。
- **不确定的边界（如实登记，不装作已知）**：DSH 消失瞬间，Native Agent 可能已经产出了结果但尚未经 Bridge 回传。协议层的处理：该 Attempt 先标 `E_EXECUTOR_HOST_LOST`，若日后收到**带同一 Attempt 身份链**的迟到结果，按 design/02 **B11**「迟到结果按 Receipt 身份链接受或隔离」处理——**接受进隔离区、不改已定终态**，由人或后续节点裁决。这条复用 P1 已有的迟到结果 Oracle（DevPlan §3.2 DHR_29 实施提示）。
- **恢复路径**：Runtime 重启后对无终态的 dsh-native Attempt，尝试经 Bridge 重连：Bridge 在且报同一 attempt 仍在 → 恢复观察；Bridge 不在或报无此 attempt → 判 `orphaned` + fresh Attempt（H12）。**Runtime 的恢复不得依赖 DSH 存活**（H1）。
- **契约层如何表达**：
  - `executor_kind: "dsh-agent"` + `bridge_ref`（符号化）。
  - **H6 契约级断言**（DevPlan §3.2 DHR_28 验收口径第 3 条）：任一**必经**角色的合法 Executor 集合**不能只有 `dsh-agent`**——schema 层拒绝，不是运行时检查。这是本卡批次 3 的反例 fixture 之一。
  - **会话观测态与任务结果分字段**：`relay.host-observation/v1`（v0 形状，本卡只定形状）承载"DSH/会话还在不在"，`relay.result/v2` 承载"任务结果"，二者不得混用同一字段。
- **留口（待 DHR_50）**：DSH 三态若判否，`dsh-agent` 在协议里仍**保留为合法枚举成员**（因为 H6 的断言需要它作为"被拒绝的单选"存在），但 Bridge 实现转为"只留合同接口"（出处：DevPlan **§3.1 DHR_30 索引行**「判否→只留合同接口」+ **§1 前置条件 B-11 段**「DSH 判否时 DSH Bridge 只保留合同接口或转可选」；§3.2 的 DHR_30 卡正文无此句——出处经批次检查点 1 小审 F-3 校正）。**本卡不因 DHR_50 未收敛而缺答，也不预判其结论。**

answer: dsh-native · Bridge 代持 · 必须区分「DSH 作为控制客户端消失=不动 Run 不动 Attempt（H4）」与「DSH 承载的 Executor 消失=仅该 Attempt 终结 E_EXECUTOR_HOST_LOST（H7）」，会话观测态与任务结果分字段（同 G6）· 迟到结果按 B11 身份链进隔离区不改已定终态 · 重启后经 Bridge 重连，失败判 orphaned 开 fresh Attempt · 契约层 executor_kind="dsh-agent" + bridge_ref，且必经角色不得只声明 dsh-agent（H6 schema 层拒绝）· DHR_50 判否时枚举保留、实现只留合同接口

---

## 第④问：Herdr Agent 由 Herdr server 持有时，Runtime 如何恢复观察

**问题原文**：Herdr Agent 由 Herdr server 持有时 Runtime 如何恢复观察。

> Herdr 正式施工归 **P6**（DevPlan §1「不含」逐字：不含 Herdr 多账号正式施工）。本节只答契约层，不设计 Herdr 接入。

- **归属**：**Herdr server 持有**。与第③问的 Bridge 代持形似但有一处关键不同：**Herdr server 是一个可独立于 Runtime 存活的长期服务**，而 DSH Bridge 依附于 DSH 桌面进程的生命周期。这意味着 Herdr 的 Attempt **更可能在 Runtime 重启后仍然活着**。
- **消失时的语义**：Herdr server 不可达 → Runtime **不立即**把 Attempt 判死。因为 server 只是"观察面"消失，Agent 可能仍在跑。协议区分两态：
  - `observation_lost`（观察中断，Attempt **不终结**）——写进 `relay.host-observation/v1`，不写 `relay.result/v2`。
  - `executor_lost`（确认 Executor 已死，Attempt 终结）——只有 Runtime **拿到 Herdr 的明确否定答复**（"无此 attempt"）时才能进入此态。
  两者不得合并——这是第③问同一条"观测态 ≠ 结果"原则（G6）在 Herdr 侧的复用。
- **恢复路径**：Runtime 重启 → 回放事件账 → 对无终态的 herdr Attempt，按 `server_ref` + attempt 身份链**向 Herdr server 查询**：
  - server 报"仍在跑" → **恢复观察，续用原 Attempt**（不开 fresh Attempt——这是与第①②③问最大的差别，因为 Executor 从未死过）；
  - server 报"已结束 + 结果" → 按身份链接受该结果（B11）；
  - server 报"无此 attempt" → 判 `orphaned` + fresh Attempt（H12）；
  - server 不可达 → 维持 `observation_lost`，**不判死、不重试**，向用户出 Attention（design/06 H5：需要人类输入时安全暂停并留下持久 Attention）。
- **契约层如何表达**：`executor_kind: "herdr-agent"` + `server_ref`（符号化）。协议**不导入 Herdr 私有类型**（DevPlan §2.2 禁改边界逐字），Herdr 的账号/会话概念在协议层降为不透明的 `server_ref` + attempt 身份链。`relay.attention/v1`（v0 形状）承载 `observation_lost` 超时后的 Attention——**本卡只定形状，P7 首次承重时才冻结**。

answer: herdr-agent · Herdr server 持有 · 必须区分 observation_lost（观察中断，Attempt 不终结）与 executor_lost（拿到 server 明确否定才终结），不得合并 · 重启后按 server_ref+身份链查询：仍在跑则续用原 Attempt（不开 fresh）、已结束按 B11 接受结果、无此 attempt 判 orphaned 开 fresh、不可达则维持 observation_lost 并出 Attention（H5）· 契约层 executor_kind="herdr-agent" + server_ref，零 Herdr 私有类型

---

## 四问对协议的净产出（批次 2 的直接输入）

| 产出 | 落到哪 |
|---|---|
| `executor_kind` 枚举：`process` / `pi-agent` / `dsh-agent` / `herdr-agent` | `relay.run/v2` 节点角色定义 + `relay.event/v2` attempt 事件 |
| **禁词表豁免注（批 3 步 14 建 `forbidden-types.txt` 时执行）**：上行三个厂商 token（`pi-agent` / `dsh-agent` / `herdr-agent`）**显式白名单**。禁词表针对的是**导入的私有类型名**（DevPlan §2.2 / design/05 §6.2），不是不透明枚举**字面量**；且 H6 契约断言本身就依赖 `dsh-agent` 作为"被拒绝的单选"存在（DevPlan §3.2 DHR_28 验收口径第 3 条逐字用了该 token）。不加白名单则批 3 全域 grep 必然误报（批次检查点 1 小审 F-7，findings F-008） | `<CODE_ROOT>/tools/forbidden-types.txt` + 批 3 步 14 |
| 每种 kind 配一个**符号化** ref 字段：`executor_ref` / `adapter_ref` / `bridge_ref` / `server_ref`（禁绝对路径，承接 G5） | 同上 |
| reason code：`E_EXECUTOR_EXIT_NONZERO` / `E_EXECUTOR_KILLED` / `E_EXECUTOR_ADAPTER_LOST` / `E_EXECUTOR_HOST_LOST` / `E_EXECUTOR_ORPHANED` | `contracts/reason-codes.md` |
| **观测态与结果分字段**（G6 的协议化）：`relay.host-observation/v1` 承载 observation，`relay.result/v2` 承载结果，禁混用 | `contracts/` v0 形状 + 正式 schema |
| **H6 契约级断言**：必经角色的合法 Executor 集合不能只有 `dsh-agent` | `relay.run/v2` schema 约束 + 批次 3 反例 fixture |
| **恢复语义分三档**：续用原 Attempt（herdr 仍在跑）/ 判 orphaned 开 fresh（其余）/ 维持 observation_lost 不判死（herdr 不可达） | `relay.run-state/v1` + `relay.event/v2` |

## 未决与留口

| 项 | 状态 | 谁关 |
|---|---|---|
| DSH 三态（可行 / 受限 / 判否） | 未收敛，**不阻塞本卡** | DHR_50 |
| pi-agent Adapter 在 L-TS 裁决下是否放宽为直连 SDK | 本 ADR 建议**不放宽**；若要放宽须作方向决策另行登记 | 用户 / 批次检查点 1 小审 |
| Herdr 接入的实际形态 | 本卡只答契约层 | P6 |
| `attention` / `approval` / `resolved-plan` / `host-observation` 的**正式**冻结 | 本卡只定 v0 形状 | P6 / P7 首次承重时 |
