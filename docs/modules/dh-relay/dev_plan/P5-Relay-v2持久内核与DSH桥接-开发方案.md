# P5-Relay v2 持久内核与多控制面桥接 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:planning-event:v1 id=DHR-B-13 stage=B-adjust artifact=dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md review=../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b13 understanding=../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#understanding-b13 -->
<!-- dh:status
汇报: P5 已按 design/06 重写为「控制面独立的承重内核」：Runtime + Store + 参考 CLI 必备，DSH/Pi 只是可替换客户端。B-11（2026-08-20）：解锁前置改为 P4-CM1/2/3/5/6a + 主报告 + 用户放行，不再等 DSH 三态收敛；DSH 轨与本阶段并行，汇合点在 DHR_30 的 DSH Bridge 条件部分与 DHR_31 的 DSH 附加客户端项（须有 DHR_50 结论才执行）
现状: **P4 阶段闸已解锁**——CM1/2/3/5/6a 全绿 + 主报告落盘（P4 verify `252a131`）+ 用户 2026-08-20 对话放行（答复「按你的建议走」采纳 AI 明示建议=放行并推进 DHR_28，记录见 workspace/DHR_27/progress.md 尾部与本次对话）；DHR_28~31 均未开始
进行到: P5 ▸ 开工前 B-调整进行中（P4 证据回流）
下一步: B-调整草案 → fresh 审核 → 讲解 / 理解问答 → 用户确认落盘 → DHR_28 入口闸分流开工
看什么: P4 主报告（evidence/10，含 §4 v1 协议缺口清单 = DHR_28 直接输入）、design/05、design/06
阻塞: 无（开工前 B-调整未完成前 DHR_28~31 不得开工）
-->

> 文件名沿用首次落盘的「DSH桥接」，标题与责任已按 design/06 改为多控制面桥接；改名放 P9 统一处置。

## 0. B 方案审核与理解确认

### 0.1 白话说明：这个阶段做啥、解决啥、做完得到啥

- **要解决的问题**：现在 AI 干活是「你开着窗口它才跑，窗口一关就断」。P5 要造一个后台常驻的「接力内核」：任务状态存在它那里，你关掉窗口、断开 SSH，活照样跑，回来还能接着看。同时定死一套协议，让命令行、DSH、Pi 这些窗口都只是「看同一份真相的不同显示器」。

| 任务 | 用大白话说在做啥 | 解决什么问题 |
|---|---|---|
| DHR_28 | 先拍板技术选型（内核用什么语言写、怎么独立跑），把内核和外部窗口之间说话的「协议」定死，并给一份样例数据集和校验器 | 后面所有人（内核、命令行、DSH、Pi）说同一种话，避免各写各的 |
| DHR_29 | 真正把常驻内核做出来：一个后台进程，任务的每一步都记账、可回放、崩了能恢复，同一时间只有它一个人能写状态 | 「关窗不停工、断线不丢账」这件事有真东西支撑，而不是靠某个 GUI 活着 |
| DHR_30 | 做正式的命令行客户端（查询 / 跟踪 / 启动 / 停止 / 恢复），条件允许时把 DSH 接到同一内核上；给 Pi 等其他窗口留好接口 | 命令行成为第一条正式控制面；DSH 是并行接入的第二条，两者读同一份状态 |
| DHR_31 | 全程不开 DSH，只用命令行跑通一条最小任务：启动 → 处理 → 收结果 → 机器验收 → 完成；中途关掉终端再连回来，状态一致 | 端到端证明内核真的能脱离任何窗口独立工作 |

- **完成后你手里有什么**：
  1. 一个后台常驻的接力内核 + 一份定死的协议（后面 P6~P9 都在它上面盖房子）。
  2. 一个正式的命令行控制面，可以启动、看、停、恢复任务。
  3. 一次「关掉窗口任务照跑、回来能接上」的实证。
  4. DSH 接入内核的桥（如果 P4 判 DSH 可行）。

### 0.2 审核与确认记录

- **事件类型**：B-新建（2026-08-18 从 design/05 阶段主线拆出）+ 同日 B-调整（按 design/06 把 DSH Bridge 从必交付降为可选 Adapter，Relay CLI 升为必备参考客户端，新增 fail-closed 与客户端断开不取消 Run 等硬约束）。同一未确认事件内修订，任务数、依赖未变。
- **审核记录**：已做闸前路线图级 fresh 审核——2026-08-18 claude-grok（fresh、只读、`--model grok-4.5`）R-P56 一致性与承接审，结论「有条件通过」；原文与只读形态见 [evidence/09](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b05)。P4 阶段闸通过、用户放行后，依据前序证据再做定向 B-调整 + 复审（不是「闸前不能审」）。
- **主会话裁决**：已做——逐条采纳 / 待用户决定见 [evidence/09 §2 裁决总表](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#2-主会话裁决总表2026-08-18)；已采纳项已回写本计划正文，「待用户决定」项在正文显式标注。
- **讲解记录**：待补——重点讲清 Run 真相从哪进（start request）、存在哪（`<repo>/.dh-relay/<run_id>/`）、Runtime 承诺什么（客户端断开不取消、强杀可恢复、fail-closed）、如何独立验证（状态签名重建、CLI 与客户端同 Read Model）、失败怎么发现（reason code / Attention）。
- **理解问题**：待补（候选：「Runtime 强杀后恢复，你期望的是『完全一致地续跑』还是『恢复到最后安全点、需人确认再续』？」）。
- **用户回答 / 解释**：待补。
- **调整与复审**：待补。
- **用户确认**：待补。**DHR_28~31 为预留编号，落盘不等于 B 确认，也不构成开工授权。**
- **B-12 关联修订（2026-08-20，本计划侧事件；与 P4 `DHR-B-11` 同批、同一次审核 / 讲解 / 用户确认）**：本计划前置条件、DHR_28 依赖口径、DHR_30/31 的 DSH 条件项判定依据（含 H4「DSH 插件卸载」子命题条件化、P5-H「DSH 组合」问条件化）随 B-11 调整同步修订——解锁不再等 DSH 三态收敛，DSH 条件项以 P4 DHR_50 结论为开工判据。事件本体见 P4 计划 §0.2（DHR-B-11），本计划侧记录见 [evidence/09 §21~§22](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b12)。本条不改变 DHR_28~31 的任务拆分与验收口径本体。
- **B-13 开工前 B-调整（2026-08-20，P4 证据回流）**：P4 阶段闸解锁（DHR_27 verify `252a131` + 用户放行）后，按 §0.2 既有约定把 P4 实测证据回流进本计划：①DHR_28 增加「v1 协议缺口逐条处置表」验收（缺口清单 = P4 主报告 §4 六条实测缺口）；②DHR_30 的 Read Model 冻结起点钉为 P4 冻结的两份 pilot schema + 「分堆与排序由源头给」架构约束（两条镜像断言纳入 P5-M4 证据），并承接关闭 P4 §0.2 列表投影白名单例外；③§2.3 增补 Read Model 字段级起点条款；④DHR_30 Bridge 条件部分登记 DHR_26 侦察落档为施工依据。任务拆分、依赖、档位均未变。**缺口清单所有权改挂说明**：P4 主报告 §4 原标注「P5 DHR_30 协议设计输入」的 v1 缺口清单，自本事件起二分——**逐条处置表 → DHR_28**（契约冻结时裁决）；**正式 Read Model 冻结 + 关闭白名单例外 → DHR_30**；P4 报告原文按留痕原则不回改，差异由 DHR_50 附录按诚实差额机制核对。审核与确认记录见 [evidence/09 §23~§24](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b13)。

## 1. 概述

- **交付什么 / 不含什么**：
  - 交付：①Runtime 实现语言与独立进程形态 ADR；②平台无关核心 JSON 协议与 `relay.rpc/v1`；③Detached Relay Runtime、唯一写者 Store、事件账、快照与恢复；④Windows Named Pipe / Linux Unix Domain Socket 本地协议边界（首轮可先完成当前主平台传输，另一平台以合同 + fixture 固定，P9 定型）；⑤一等公民 Relay CLI 参考客户端；⑥可选 DSH Bridge Adapter（P4 判否时不要求完整 Client UI）；⑦Pi / 其他终端客户端接入所需 JSON/RPC 合同；⑧`relay/basic-agent-task@1` 的 Process 垂直闭环；⑨【P5-X 条件项，非必达——用户 2026-08-18 拍板】一个 Agent Executor 候选闭环（Pi / DSH Native，不得让 Runtime 依赖相应工作台进程）；⑩CLI 与任一已接入客户端读取同一 Run。
  - 不含：DevHarness S0~E13、Herdr 多账号正式施工、多卡调度、重编排 / 诊断 Agent、周报 Outbox、E11/E12/E13、完整 Linux 生产定型、公网远程服务、多主机分布式调度。
- **最早可用结果**：不开 DSH → 启动 Relay Runtime → 用 relay CLI 创建和观察 basic-agent-task → 关闭 SSH/终端 → Runtime 保持或确定性恢复 → 重连后继续处理。
- **承接设计**（拆计划输入 = `design/README.md` 白名单）：
  - [design/06 多控制面、Headless 与 SSH 运行](../design/06-多控制面与Headless-SSH运行-设计补充.md) · 「验收命题」节 **H1 / H2 / H3 / H4 / H5**（P5 以 basic-agent-task 级证明）+ §3 硬约束 + §10「P5」。
  - [design/05 DSH 插件化与专属工作台](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md) · §4 三类真相、§6 Relay Runtime 与 IPC（6.1 生命周期 / 6.2 生产协议 / 6.3 核心语言）、§10.2 运行现场。
  - [design/02 完整流水 · 产品设计与验收](../design/02-完整流水-产品设计与验收.md) · **B1**（relay/v2 契约与 v1 只读兼容、双根 discovery）、**B7**（控制台与接续、宿主存活语义 D18、run_id 规范化 D23、`.gitignore` 前置）、**B6**（宿主健壮性）——作为行为 / 契约 Oracle 承接，旧 PowerShell 文件切分不迁移。
- **前置条件**（B-11 修订）：P4-CM1/2/3/5/6a 全部通过（CM4 可为「延后（DHR_50）」）；P4 主报告（CM 部分）已落盘；P4 证据已回流并完成本计划开工前 B-调整；本计划经 fresh 审核；用户对话明确放行 P5。**DSH 三态收敛不再是本阶段解锁前置**：DSH 轨（DHR_26→DHR_49→DHR_50）与本阶段并行，汇合点 = DHR_30 的 DSH Bridge 条件部分与 DHR_31 的 DSH 附加客户端项——该两处开工 / 执行前必须已有 DHR_50 三态结论，未有则记「未执行，待 DHR_50」，CLI 主线不受影响。DHR_50 收敛前本阶段默认控制面为 Relay CLI（阶段默认，不是回退）；DSH 判否时 DSH Bridge 只保留合同接口或转可选。
- **实施策略一句话**：新建独立 Runtime 旁路（不在旧 PowerShell Host 上改），先冻结协议再建 Store/恢复，再做 CLI，最后用 basic-agent-task 闭环——用「无 DSH、无 DevHarness」的最小工作流证明内核与所有工作台、领域规则解耦。
- **任务前缀 / 模块 slug**：`DHR_` / `dh-relay`。
- **批次**：批次 1=`DHR_28`（ADR + 协议 fixture）；批次 2=`DHR_29 → DHR_30`（Runtime/Store + CLI）；批次 3=`DHR_31`（第一个端到端 demo：DSH 关闭下 Process 闭环 + 可选 Agent 节点）。DHR_29 开工 B-调整时预计拆成不少于两张实际施工卡（至少分离「Store/回放」与「宿主/lease/恢复」）。

## 2. 工程切分

### 2.1 实现单元

| 单元 | 职责 | 入口 / 主要文件 | 关联任务 |
|---|---|---|---|
| ADR + contracts | 语言 / 进程形态 ADR；`relay.rpc/v1`、`relay.run/v2`、`relay.event/v2`、`relay.run-state/v1`、`relay.launch-receipt/v2`、`relay.checkpoint/v2`、`relay.result/v2` schema、reason code、兼容矩阵、golden fixture；`resolved-plan/host-observation/attention/approval` v0 形状 | 新 Runtime 仓 / 目录（DHR_28 ADR 定）下 `contracts/`；独立校验器 | DHR_28 |
| runtime-core | Detached 宿主、PID/lease、唯一写者 Store、追加事件、原子快照、确定性回放、checkpoint/result/迟到结果 | Runtime 源码 `runtime/`、`store/` | DHR_29 |
| rpc-transport | Named Pipe（Windows）/ Unix Domain Socket（Linux）+ NDJSON JSON-RPC 2.0；握手 `protocol_version / runtime_version / capability_hash / client_id / request_id` | `rpc/` | DHR_29 / DHR_30 |
| relay-cli | 参考客户端：`list / status / inspect / events --follow / start / stop / resume`（`[--json]`）；客户端中立 Read Model 渲染 | `cli/` | DHR_30 |
| client-adapters | 可选 DSH Host Bridge（查询 / 订阅 / 重连 / 窄控制）；Pi / 其他客户端 JSON fixture 与 RPC 示例 | `adapters/dsh-bridge/`、`fixtures/clients/` | DHR_30 |
| basic-agent-task | `relay/basic-agent-task@1` Workflow：Process 闭环 + 可选 Agent 节点 | `workflows/basic-agent-task/`、e2e 证据 | DHR_31 |

### 2.2 复用与禁改边界

| 路径 | 禁改 / 扩展 / 新建 | 说明 |
|---|---|---|
| 新 Runtime 代码根（DHR_28 ADR 决定语言与落点） | 新建 | Go sidecar 或独立 TypeScript Runtime；「把 Core 嵌入 DSH Web 进程」当前拒绝，需回 A |
| `<repo>/.dh-relay/<run_id>/` | 新建（运行现场，不入仓） | P5 起固定为 Run Store 根；仓根须显式忽略 `/.dh-relay/`；Relay 不得自行改业务仓 `.gitignore`，缺前置时 start fail-closed |
| `.dh-runtime/relay/`（v1 现场） | 只读 | 只读发现与投影，不 resume、零新写 |
| `tools/`（P1 PowerShell Runner）与 `tools/tests/` | 只读复用为 Oracle | 行为、契约与测试命题作为 Oracle；文件级实施切分不迁移；DHR_04 隔离与策略守卫成果继续作迁移 Oracle |
| DSH / Cordis / Pi / Herdr / DevHarness 私有类型 | 禁入协议 | 协议必须平台、客户端、业务域无关 |
| DeepSeek Harness 上游源码 | 禁改 | Bridge 只走树外 |

### 2.3 阶段专属约束

- **P5 冻结的最小协议集**：`relay.rpc/v1`、`relay.run/v2`、`relay.event/v2`、`relay.run-state/v1`、`relay.launch-receipt/v2`、`relay.checkpoint/v2`、`relay.result/v2`；`relay.resolved-plan/v1`、`relay.host-observation/v1`、`relay.attention/v1`、`relay.approval/v1` 只定 v0 形状与 fixture，首次承重时（P6/P7）再冻结。
- **RPC**：Windows Named Pipe / Linux Unix Domain Socket，newline-delimited JSON-RPC 2.0；握手字段见 2.1。
- **最小 Runtime 接口**：`contracts() / listRuns() / inspectRun(runId) / validate(request) / start(request) / control(request) / subscribe(filter)`。
- **客户端中立 Read Model**：`RunSummary / RunDetail / NodeSummary / EventEnvelope / AttentionSummary`，由 Runtime 生成，DSH / Pi / CLI 只渲染、不各自从 events 推导状态。**（B-13）字段级起点** = P4 冻结的 `relay.pilot-read-model/v1`（详情）与 `relay.pilot-run-list/v1`（列表，含必填 `group`、源头给的 `progress / elapsed_seconds` 等），经 DHR_25 人判签收并被 DHR_27 真实历史数据验证；P5 正式化时按 DHR_28 的 v1 缺口处置表修订，字段增删须留处置记录、不静默漂移。
- **参考 CLI 最小命令**：`relay list [--json]`、`relay status <run_id> [--json]`、`relay inspect <run_id> [--json]`、`relay events <run_id> --follow [--json]`、`relay start --request <file>`、`relay stop <run_id>`、`relay resume <run_id>`；Attention / Approval / Plan Revision 命令 P7/P8 首次使用时补齐，但 RPC 与命令装配方式须预留。
- **Agent 宿主 ADR 必答**：process executor 由 Runtime 直接持有；pi-agent 由 Runtime 直接持有 SDK/RPC 或经冻结 Adapter；DSH Native Agent 由 Bridge 代持时 DSH 消失如何标记 Attempt；Herdr Agent 由 Herdr server 持有时 Runtime 如何恢复观察。
- **语言选择原则**：独立 CLI、跨外壳、单二进制、DSH 隔离价值更高 → Go；TypeScript 复用 Agent SDK 收益高且仍独立进程 + CLI → TypeScript。

## 3. 任务表

### 3.1 索引

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位（轻/标准） | 状态 | 依赖 | 工作区 | 验收时间 / verify SHA | 备注 |
|---|---|---|---|---|---|---|---|
| DHR_28 | 根据 P4 证据确定 Runtime 语言、Agent 宿主归属与客户端中立协议（ADR + golden fixture） | 标准 | 未开始 | P4 阶段闸（P4-CM1/2/3/5/6a 通过 + 主报告落盘 + 用户放行，B-11 口径） | <开工时回填 workspace/…> | | 阶段闸阻塞：blocked-by-phase-gate P4-CM（B-11：不等 DSH 三态收敛）；ADR 涉 DSH 的必答题按契约层回答，DHR_50 未收敛不阻塞本卡 |
| DHR_29 | 实现 Detached Runtime、唯一写者 Store、事件账与恢复 | 标准 | 未开始 | DHR_28 | <开工时回填 workspace/…> | | 阶段闸阻塞；开工 B-调整时预计拆 ≥2 张 |
| DHR_30 | 实现 Relay CLI 参考客户端与可选 DSH/Pi Bridge 接缝 | 标准 | 未开始 | DHR_29 | <开工时回填 workspace/…> | | 阶段闸阻塞；DSH Bridge 条件部分以 P4 DHR_50 结论为开工判据（B-11 汇合点）：无结论→记「未执行，待 DHR_50」，判否→只留合同接口；CLI 部分不受影响 |
| DHR_31 | 以 DSH 关闭状态跑通 basic-agent-task 垂直闭环 | 标准 | 未开始 | DHR_30 | <开工时回填 workspace/…> | | 阶段闸阻塞；第一个端到端 demo；DSH 附加客户端项按 DHR_50 结论执行（B-11） |

> 状态列只填五枚举；阶段闸阻塞写在「备注」列。P4-CM 未通过时 DHR_28~31 均不得进入 D 开工。

### 3.2 任务卡

#### DHR_28

- **目标**：依据 P4 控制面证据做出 Runtime 语言 / 独立进程形态 ADR 与 Agent 宿主归属 ADR，冻结 P5 最小协议集、reason code、兼容矩阵与 golden fixture，并交付独立校验器，让后续 Runtime、CLI 与任何客户端有唯一契约来源。
- **非目标**：不实现 Runtime；不写 DSH UI；不冻结 P7/P8 才承重的 resolved-plan / attention / approval 正式版本（只定 v0 形状）。
- **验收口径**：
  - **机器证**：[design/02 B1](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)（契约正反例、双解析器思路）· 本计划 P5-M6：协议正反 fixture 可由独立校验器验证；未知字段、未知版本、能力不匹配 fail-closed。
  - **机器证**：[design/05 §6.2 生产协议](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#62-生产协议)：协议不导入 DSH / Cordis / Pi / Herdr / DevHarness 私有类型；DSH 与 Runtime 不共享活动对象或内存状态（fixture 与 schema 静态可证）。
  - **机器证**：[design/06 H6](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)（契约级）：任一必经角色不能只声明 `dsh-agent`（schema 层拒绝）。
  - **机器证**：ADR 落盘且回答 §2.3「Agent 宿主 ADR 必答」四问；语言选择依据引用 P4 报告证据。
  - **机器证 · v1 缺口处置（B-13 新增）**：契约文档含对 [P4 主报告 §4「v1 协议缺口清单」](../design/evidence/10-P4-多控制面Pilot报告.md)六条实测缺口的**逐条处置表**（每条：采纳进 v2 字段 / 显式不采纳 + 理由；含可 grep 锚点 `v1-gap-disposition:`）——缺口含：run 现场不记录 `workflow_name / summary / trigger / trigger_by`（P4 实证导致投影须操作员补供）、无 run 级状态、无节点 title、run 级 attempt「缺省≠1」语义、locator 必须相对/符号化、会话观测态与任务结果须分字段。处置方向由本卡 ADR 定，不预设结论。
- **变更范围**：新 Runtime 仓 / 目录的 `contracts/`、校验器、ADR 文档；本卡 `workspace/DHR_28/`。
- **档位**：标准（协议与架构决策是后续全部阶段的地基）。
- **实施提示**：复用 P1 `tools/contracts/` 与 DHR_04 守卫作为 Oracle；「把 Core 嵌入 DSH Web 进程」不是可选项；不因 DSH 增强轨结论改变协议中立性。**（B-13）**Read Model 语义起点 = P4 冻结的 `relay.pilot-read-model/v1` + `relay.pilot-run-list/v1`（DHR_25 人判 H1 签收 + DHR_27 真实数据验证），尤其**架构约束**（分堆与排序由源头给、客户端不推导）与**源头计量约束**（progress/elapsed 由源头算，客户端不读时钟）两条——与 DHR_30 的「两条镜像断言」（该架构约束的测试形态）分名指称，避免混淆；语言 ADR 的 P4 侧证据含：Node 全链 pilot（schema/render/CLI + 约 250 行纯函数投影器）跨 Node v24(Win)/v18(Linux) 输出逐字节一致、dsh-host 零 bare import 的装载拓扑教训（workspace/DHR_26）。

#### DHR_29

- **目标**：实现 Detached Relay Runtime：独立宿主 PID/lease、单 Run 唯一写者、过期接管，不可变工件 + 追加事件 + 原子快照 + 确定性回放，支持 checkpoint / result / 迟到结果 / 冲突终态，保证无任何控制客户端在线时 Runtime 仍在运行。
- **非目标**：不做 CLI 与客户端 Adapter（归 DHR_30）；不跑 basic-agent-task 全闭环（归 DHR_31）；不做多卡；不实现 Herdr。
- **验收口径**：
  - **机器证**：[design/06 H1 / H4](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P5-M1/M7：客户端退出、SSH 断开、DSH 完全停止后 Runtime 保持运行或可恢复；客户端断开事件不能生成 cancel。
  - **机器证**：[design/02 B7 宿主存活语义 D18](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) · P5-M3：Runtime 强杀后从 Store 重建相同状态签名；第二个宿主被 lease 拒绝，过期后可接管。
  - **机器证**：[design/02 B7 run_id 规范化 D23 / `.gitignore` 前置](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) · P5-M8：Store 位于 `<repo>/.dh-relay/<run_id>/`；缺 `.gitignore` 锚定时 start fail-closed 且 Relay 不改业务仓 `.gitignore`；零误跟踪。
  - **机器证**：[design/02 B6 / B11](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)：重复 checkpoint/result 幂等，冲突终态拒绝；迟到结果按 Receipt 身份链接受或隔离。
- **变更范围**：Runtime `runtime/`、`store/`、`rpc/` 服务端；本卡 `workspace/DHR_29/`（拆卡后各自工作区）。
- **档位**：标准（组件接线 + 持久状态；开工 B-调整时拆卡）。
- **实施提示**：复用 P1 恢复锁 / CAS / 迟到结果 fixture 作为回放 Oracle；先证明「无客户端也能跑」再接任何客户端；lease 与恢复走同一事件账，不另立状态。

#### DHR_30

- **目标**：实现 Relay CLI 参考客户端（查询 / follow / start / stop / resume，text 与 json 同源渲染），冻结客户端中立 Read Model；条件允许时实现 DSH Host Bridge 的查询、订阅、重连与窄控制，并给出 Pi / 其他客户端可消费的 JSON fixture 与 RPC 示例。
- **非目标**：不实现完整 DSH Client UI（P4 判否时更不实现）；不做 Attention / Approval 命令正式版（P7/P8）；不让任何客户端直接写 Store。
- **验收口径**：
  - **机器证**：[design/06 H2](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P5-M2：DSH 未安装时 CLI 完整可用（list/status/inspect/events/start/stop/resume）。
  - **机器证**：[design/06 H3](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P5-M4：CLI 文本与 JSON 由同一 Read Model 渲染；任一已接入客户端与 CLI 读取同一 Run；DSH/Pi 私有字段不进入 Relay Store。**（B-13 加严）**Read Model 正式冻结以 P4 两份 pilot schema 为字段级起点（按 DHR_28 的 v1 缺口处置表修订），「分堆与排序由源头给」的两条镜像断言（改 `group` 必须移动 / 只改 `run_status` 必须逐字不变）纳入 P5-M4 证据；随本卡把字段级定义补进 design 正文并**关闭 P4 §0.2 列表投影白名单例外**——关闭判据（机检，双端 `rg` 可证）：design 落点文出现字段级定义 + 可 grep 标记 `whitelist-exception-closed: DHR_30`，且 P4 计划 §0.2 例外条机械回注回链该标记。
  - **机器证**：[design/06 H4](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)：任一客户端断开 / 退出不取消 Run，重连后从 Runtime 重建状态（无条件项，用 CLI 或任一非 DSH 客户端证）；其中「DSH 插件卸载只断开客户端」子命题为条件项（B-11 复审回写）——按 P4 DHR_50 结论执行，未收敛记「未执行，待 DHR_50」，判否记 N/A。
  - **机器证**：[design/02 B1](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)（relay/v2 契约矩阵中的控制请求幂等子命题）· P5-M2：重复 control request 以 request id 幂等，Receipt 唯一。
  - **机器证**（P5-X，条件执行；B-11：执行条件 = P4 DHR_50 已收敛且非判否，未收敛记「未执行，待 DHR_50」）：DSH Bridge 重连并重建 UI；Pi 客户端读取同一 Run 的 fixture 示例可解析（Pi 部分不受 DHR_50 约束）。
- **变更范围**：`cli/`、`adapters/dsh-bridge/`（条件）、`fixtures/clients/`；**（B-13）**承接 Read Model 字段级定义的 design 落点——默认 [design/06](../design/06-多控制面与Headless-SSH运行-设计补充.md)（新增字段级定义节；若开工分流时确认另建 design 文档，按 design-治理走）+ `dev_plan/P4-DSH工作台最小Pilot-开发方案.md` §0.2 白名单例外条（仅机械回注关闭标记回链）；本卡 `workspace/DHR_30/`。
- **档位**：标准（客户端接线；DSH Bridge 部分若执行需真实截图作需求境证据）。
- **实施提示**：CLI 是 P5 唯一必备客户端；Bridge 只走 RPC 合同不碰内存对象；命令装配方式为 P7/P8 的 attention/approve 预留。**（B-13）**DSH Bridge 条件部分若执行，施工依据 = DHR_26 侦察落档（[workspace/DHR_26/](../workspace/DHR_26/) findings 与 `src/dsh-host/` README：`dsh plugin` profile 装载、`ctx.provide` 公开 API、零 bare import 拓扑约束、rc 迭代风险基线）。

#### DHR_31

- **目标**：以 DSH 全程关闭状态，用 Relay CLI 启动、观察、恢复 `relay/basic-agent-task@1` 的 Process 闭环（prepare → process task → collect structured result → machine verify → succeeded），关闭控制终端后 Runtime 继续或可恢复，重连后读取相同事件 / 状态 / 终态；Process 闭环通过后再尝试一个 Agent 节点（Pi / DSH Native，Executor 消失只中断对应 Attempt）。
- **非目标**：不使用任何 DevHarness 特有字段；不跑 Herdr（P6）；不做多卡；DSH 作为附加客户端连接只验展示一致性，P4 判否时记不适用。
- **验收口径**：
  - **机器证**：[design/06 H1 / H2 / H5](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P5-M5：无 DevHarness、无 DSH 时 Process 闭环完整运行；控制终端关闭后 Runtime 继续；重连后事件 / 状态 / 终态一致。
  - **机器证**：[design/06 H7 / H12](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)（若 Agent 节点执行）：Executor 消失只中断对应 Attempt，重试产生 fresh Attempt。
  - **机器证**：[design/06 H3](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)（P5-X）：DSH 在 Run 已存在后作为附加客户端连接并看到同一状态；按 P4 DHR_50 结论执行（B-11）——未收敛时登记「未执行，待 DHR_50」，判否时登记不适用。
  - **人判**：[design/05 §6.1 生命周期](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#61-生命周期) · P5-H：向用户展示启动 / 资源 / 恢复耗时、终端断连恢复实录与 CLI 输出；用户判断独立 Runtime + CLI 的成本是否可接受、不开 DSH 时终端控制是否足以处理故障、DSH 若可用组合是否仍像统一工作台（本问按 P4 DHR_50 结论：未收敛时延后、判否时记 N/A，不阻塞其余人判，B-11 复审回写）、选定语言是否继续作默认。
- **变更范围**：`workflows/basic-agent-task/`、e2e 脚本与证据；本卡 `workspace/DHR_31/`。
- **档位**：标准（端到端接线 + 人判）。
- **实施提示**：Process 闭环先于 Agent 闭环，Agent 失败不推翻 Process 结论；不得借 DevHarness 字段「顺手」证明领域接入。

### 3.3 标准档共同收口条件

每张卡进入「待验收」前：两轮独立换人复核；需求境证据（DHR_31 须有真实终端断连 / 重连实录，Bridge 若执行须有截图）；`dh dh-relay` 与本卡证据命令可复跑；P0/P1 清零；只停在待人验，用户对话确认后才 `verify(dh-relay):`。

## 4. P5 阶段闸

### 4.1 核心机器闸 P5-M

| ID | 命题 | 承接卡 |
|---|---|---|
| P5-M1 | Runtime 与 DSH、Pi、终端客户端的生命周期分离 | DHR_29 |
| P5-M2 | DSH 完全关闭时，CLI 可启动、查询、停止、恢复 Run | DHR_30 / DHR_31 |
| P5-M3 | 强杀 Runtime 并恢复后，状态、事件和终态确定一致 | DHR_29 |
| P5-M4 | CLI 文本/JSON 与任一已接入客户端读取同一 Read Model（B-13：含源头 `group` 镜像断言；正式字段级定义关闭 P4 列表白名单例外——细则见 DHR_30 卡） | DHR_30 |
| P5-M5 | basic-agent-task 的 Process 闭环在无 DevHarness、无 DSH 时完整运行 | DHR_31 |
| P5-M6 | 协议版本、能力和未知输入均 fail-closed | DHR_28 |
| P5-M7 | 客户端断开不取消 Run，必经角色无 DSH-only 依赖 | DHR_28 / DHR_29 |
| P5-M8 | Store 位于规范根，`.gitignore` 前置与零误跟踪有证据 | DHR_29 |

### 4.2 增强验收 P5-X 与人类闸 P5-H

- **P5-X**（按 P4 结论与实际可用性执行，其中 DSH 项以 DHR_50 结论为判据（B-11）；失败不推翻已通过的独立内核，但影响默认工作台与 P6/P7 Executor 选择）：DSH Bridge 重连并重建 UI；Pi 客户端读取同一 Run；Agent Executor basic task。
- **P5-H**（用户判断，见 DHR_31 人判项）：独立 Runtime 与 CLI 的启动 / 资源 / 恢复成本；不开 DSH 时终端控制是否足以处理故障；DSH 与独立 Runtime 组合是否仍像统一工作台（按 DHR_50 结论：未收敛延后、判否 N/A，B-11）；选定语言是否继续作默认。

### 4.3 解锁 P6 的规则

P5-M 全部通过 ∧ P5-H 明确 ∧ 用户对话同意进入 P6。P5-X 中的 DSH 项可以是通过 / 受限 / 不适用，不能成为核心路线的唯一解锁条件。

## 5. 覆盖、颗粒度与依赖查漏

| 检查 | 结论 |
|---|---|
| 覆盖 | design/06 H1 / H3 / H4 / H5 由 DHR_29/30/31 承接；H2 只承接子集（list/status/inspect/events/start/stop/resume，**不含 attention/approve**，其余交 P7）；H6/H7/H12 契约级或条件级承接（Agent 节点为 P5-X，H7 全称由 P6/P7 关闭）；design/05 §6 由 DHR_28/29 承接；design/02 B1/B6/B7/B11 作 Oracle 由 DHR_28/29 承接；P5-M1~M8 每条至少一张卡 |
| 颗粒度 | DHR_28=契约 + ADR 验收单元；DHR_29=持久内核验收单元（开工时拆 ≥2）；DHR_30=客户端验收单元；DHR_31=端到端闭环 + 人判单元 |
| 依赖 | `DHR_28 → DHR_29 → DHR_30 → DHR_31` 单链无环；DHR_28 额外依赖 P4 阶段闸 |

## 6. 计划完工

- [ ] DHR_28~31 全部销户（状态=已完成 或 已取消并留因）。
- [ ] P5-M1~M8 全部有等价 pass 证据；P5-X 三态已登记。
- [ ] 端到端联调证据：DSH 关闭下 basic-agent-task Process 闭环 + 终端断连恢复实录可复跑。
- [ ] P5-H 已向用户展示并由用户在对话中判断；P6 是否解锁由用户明确表态。
- [ ] `dev_plan/README.md` 活跃计划表状态已更新。
