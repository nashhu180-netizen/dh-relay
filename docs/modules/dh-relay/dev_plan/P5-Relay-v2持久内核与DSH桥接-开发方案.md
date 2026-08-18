# P5 Relay v2 持久内核与多控制面桥接 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:status
汇报: 已按 design/06 重写为控制面独立的承重内核；等待 P4 基线阶段闸
现状: DHR_28~31 均未开始
进行到: blocked-by-phase-gate:P4-CM
下一步: P4-CM 通过并经用户放行后，依据 Pilot 报告做 B-adjust 与 fresh 审核
看什么: design/05、design/06、P4 Pilot 报告、evidence/07
阻塞: P4 基线 Gate 未通过
-->

## 0. 定位

P5 建立所有工作台背后的最小承重运行时。它交付一个不依赖 DSH、不依赖 DevHarness 的 `relay/basic-agent-task@1`，并把 Relay CLI 建成必须存在的参考控制客户端。

DSH Bridge、Pi TUI 或其他客户端只连接稳定协议。它们可以缺席、断开或被替换，不改变 Runtime、Run Store 和业务仓真相。

P5 的最早可用结果是：

```text
不开 DSH
  -> 启动 Relay Runtime
  -> 用 relay CLI 创建和观察 basic-agent-task
  -> 关闭 SSH/终端
  -> Runtime 保持或确定性恢复
  -> 重新连接后继续处理
```

## 1. 前置条件

开工前必须满足：

- P4 基线机器闸 P4-CM 全部通过；
- P4 对 DSH 增强轨已有明确通过、受限或判否结论；
- 用户在对话中明确放行 P5；
- P4 证据已回流并完成 B-adjust；
- 本计划经过 fresh 交叉审核。

DSH 增强轨判否不阻止 P5。此时 P5 以 Relay CLI 为默认客户端，DSH Bridge 任务只保留合同接口或转为条件执行。

## 2. 交付范围

交付：

1. Relay Runtime 实现语言和独立进程形态的正式 ADR。
2. 平台无关的核心 JSON 协议与 `relay.rpc/v1`。
3. Detached Relay Runtime、唯一写者 Store、事件账、快照和恢复。
4. Windows Named Pipe 与 Linux Unix Domain Socket 的本地协议边界；首轮可以先完成当前主平台传输，另一平台以合同和 fixture 固定，P9 完成真实定型。
5. 一等公民的 Relay CLI 参考客户端。
6. 可选 DSH Bridge Adapter；P4 判否时不要求实现完整 Client UI。
7. Pi 或其他终端客户端接入所需的 JSON/RPC 合同。
8. `relay/basic-agent-task@1` 的 Process 垂直闭环。
9. 至少一个 Agent Executor 的候选闭环，可使用 Pi、DSH Native 或后续 Herdr；该项不能让 Runtime 依赖相应工作台进程。
10. CLI 与任何已接入客户端读取同一 Run。

不交付：

- DevHarness S0~E13；
- Herdr 多账号正式施工；
- 多卡调度；
- 重编排、诊断 Agent；
- 周报 Outbox；
- E11/E12/E13；
- 完整 Linux 生产定型；
- 公网远程服务；
- 多主机分布式调度。

## 3. 核心协议与存储

P5 先冻结 basic-agent-task 真正使用的最小集合：

```text
relay.rpc/v1
relay.run/v2
relay.event/v2
relay.run-state/v1
relay.launch-receipt/v2
relay.checkpoint/v2
relay.result/v2
```

以下协议在 P5 定义 v0 形状和 fixture，首次承重使用时再正式冻结：

```text
relay.resolved-plan/v1
relay.host-observation/v1
relay.attention/v1
relay.approval/v1
```

协议必须平台、客户端和业务域无关，不能导入 DSH、Cordis、Pi、Herdr 或 DevHarness 私有类型。

RPC 目标：

```text
Windows: Named Pipe
Linux: Unix Domain Socket
Transport: newline-delimited JSON-RPC 2.0
```

握手冻结：

```text
protocol_version
runtime_version
capability_hash
client_id
request_id
```

Run Store 从 P5 起固定在：

```text
<repo>/.dh-relay/<run_id>/
```

仓根必须显式忽略 `/.dh-relay/`。Relay 不得自行修改业务仓 `.gitignore`；缺少安全前置时 start fail-closed。

## 4. 控制客户端合同

参考 CLI 至少实现：

```text
relay list [--json]
relay status <run_id> [--json]
relay inspect <run_id> [--json]
relay events <run_id> --follow [--json]
relay start --request <file>
relay stop <run_id>
relay resume <run_id>
```

Attention、Approval 和 Plan Revision 的命令在 P7/P8 首次使用时补齐，但 P5 的 RPC 和命令装配方式必须预留。

所有客户端消费同一 Read Model：

```text
RunSummary
RunDetail
NodeSummary
EventEnvelope
AttentionSummary
```

DSH、Pi 和 CLI 不能分别从 events 推导状态。Read Model 由 Runtime 生成，客户端只渲染。

## 5. 任务表

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位 | 状态 | 依赖 | 工作区 | 验收时间 · verify SHA |
|---|---|---|---|---|---|---|
| DHR_28 | 根据 P4 证据确定 Runtime 语言、Agent 宿主归属和客户端中立协议 | 标准 | blocked-by-phase-gate:P4-CM | P4 Gate | <开工时回填> | |
| DHR_29 | 实现 Detached Runtime、Store、事件账与恢复 | 标准 | blocked-by-phase-gate:P4-CM | DHR_28 | <开工时回填> | |
| DHR_30 | 实现 Relay CLI 参考客户端与可选 DSH/Pi Bridge 接缝 | 标准 | blocked-by-phase-gate:P4-CM | DHR_29 | <开工时回填> | |
| DHR_31 | 以 DSH 关闭状态跑通 basic-agent-task 垂直闭环 | 标准 | blocked-by-phase-gate:P4-CM | DHR_30 | <开工时回填> | |

DHR_29 预计在开工 B-adjust 时拆成不少于两张实际施工卡，至少分离“Store/回放”和“宿主/lease/恢复”。本表保留阶段责任，不把一张标准卡当成不可拆承诺。

### DHR_28：ADR、协议与宿主归属

目标：

- 根据 P4 的控制面证据，选择 Go sidecar 或独立 TypeScript Runtime。
- 冻结最小协议、reason code、兼容矩阵和 golden fixture。
- 明确每类 Agent Executor 由谁持有进程和会话。

选择原则：

| 条件 | 倾向 |
|---|---|
| 独立 CLI、跨外壳、单二进制和 DSH 隔离价值更高 | Go Runtime |
| TypeScript 复用 Agent SDK 收益高，仍保持独立进程和 CLI | TypeScript Runtime |
| 需要把 Core 嵌入 DSH Web 进程 | 当前拒绝，需回 A |

Agent 宿主 ADR 必须回答：

```text
process executor 由 Runtime 直接持有
pi-agent 由 Runtime 直接持有 SDK/RPC，或通过已冻结 Adapter
DSH Native Agent 由 Bridge 代持时，DSH 消失如何标记 Attempt
Herdr Agent 由 Herdr server 持有，Runtime 如何恢复观察
```

机器验收：

- 协议正反 fixture 可由独立校验器验证。
- 未知字段、未知版本、能力不匹配 fail-closed。
- DSH 与 Runtime 不共享活动对象或内存状态。
- 任一必经角色都不能只声明 `dsh-agent`。

### DHR_29：Detached Runtime 与 Store

目标：

- 建立独立宿主 PID/lease、单 Run 唯一写者和过期接管。
- 建立不可变工件、追加事件、原子快照和确定性回放。
- 支持 checkpoint、result、迟到结果和冲突终态。
- 保证没有控制客户端在线时 Runtime 仍可运行。

机器验收：

- 客户端退出、SSH 断开和 DSH 完全停止后 Runtime 保持运行或可恢复。
- Runtime 强杀后从 Store 重建相同状态签名。
- 第二个宿主被 lease 拒绝，过期后可接管。
- 重复 checkpoint/result 幂等，冲突终态拒绝。
- 迟到结果按 Receipt 身份链接受或隔离。
- 客户端断开事件不能生成 cancel。

### DHR_30：Relay CLI 与客户端 Adapter

目标：

- 实现参考 CLI 的查询、follow、start、stop 和 resume。
- 冻结客户端中立 Read Model。
- 条件允许时实现 DSH Host Bridge 的查询、订阅、重连和窄控制。
- 提供 Pi/其他客户端可消费的 JSON fixture 与 RPC 示例。

最小 Runtime 接口：

```text
contracts()
listRuns()
inspectRun(runId)
validate(request)
start(request)
control(request)
subscribe(filter)
```

机器验收：

- DSH 未安装时 CLI 完整可用。
- DSH 插件卸载只断开客户端，不取消 Run。
- 任一客户端重连后从 Runtime 重建状态。
- 重复 control request 以 request id 幂等。
- DSH/Pi 私有字段不进入 Relay Store。
- CLI 文本与 JSON 由同一 Read Model 渲染。

### DHR_31：basic-agent-task 垂直闭环

第一条权威工作流：

```text
prepare
  -> process task
  -> collect structured result
  -> machine verify
  -> succeeded
```

Process 闭环通过后，再尝试一个 Agent 节点：

```text
prepare
  -> launch selected agent executor
  -> await structured result
  -> optional machine verify
  -> succeeded
```

目标：

- 全程关闭 DSH，使用 Relay CLI 启动、观察和恢复 Process Run。
- 关闭控制终端后，Runtime 继续或保持可恢复。
- 重新连接后读取相同事件、状态和终态。
- 条件允许时启动 Pi 或 DSH Native Agent；Executor 消失时只中断对应 Attempt。
- DSH 可在 Run 已经存在后作为附加客户端连接，并看到同一状态；该项在 P4 判否时记不适用。

不允许使用 DevHarness 特有字段，借此证明 Relay Core 与 DevHarness、DSH均解耦。

## 6. P5 阶段闸

### 核心机器闸 P5-M

| ID | 命题 |
|---|---|
| P5-M1 | Runtime 与 DSH、Pi、终端客户端的生命周期分离 |
| P5-M2 | DSH 完全关闭时，CLI 可启动、查询、停止、恢复 Run |
| P5-M3 | 强杀 Runtime 并恢复后，状态、事件和终态确定一致 |
| P5-M4 | CLI 文本/JSON与任一已接入客户端读取同一 Read Model |
| P5-M5 | basic-agent-task 的 Process 闭环在无 DevHarness、无 DSH 时完整运行 |
| P5-M6 | 协议版本、能力和未知输入均 fail-closed |
| P5-M7 | 客户端断开不取消 Run，必经角色无 DSH-only 依赖 |
| P5-M8 | Store 位于规范根，`.gitignore` 前置与零误跟踪有证据 |

### 增强验收 P5-X

```text
DSH Bridge 重连并重建 UI
Pi 客户端读取同一 Run
Agent Executor basic task
```

这些能力按 P4 结论和实际可用性实现。失败不能推翻已经通过的独立 Runtime 核心，但会影响默认工作台和 P6/P7 Executor 选择。

### 人类闸 P5-H

用户判断：

- 独立 Runtime 与 CLI 的启动、资源和恢复成本是否可接受；
- 不开 DSH 时，终端控制是否足以处理故障；
- DSH 若可用，和独立 Runtime 的组合是否仍像统一工作台；
- 选定的 Runtime 语言是否继续作为后续默认。

### 解锁规则

P5-M 全部通过、P5-H 明确、用户同意进入 P6 后，P6 才解除阻塞。P5-X 中的 DSH 项目可以是通过、受限或不适用，不能成为核心路线的唯一解锁条件。

## 7. 从旧 P2 吸收的责任

P5 吸收旧 P2 中以下通用能力：

```text
relay/v2 身份链与兼容
Detached 宿主
PID/lease
恢复锁
参考 CLI 和查询
运行索引
基础 Executor 引用字段
```

旧 P2 的文件级 PowerShell 实施提示不迁移。行为、契约和测试命题作为 Oracle 使用。

## 8. 开工边界

P4-CM 未通过时，DHR_28~31 均不得进入 D 开工。本计划重写后需要 fresh 审核。
