# P5 Relay v2 持久内核与 DSH 桥接 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:status
汇报: 路线计划已落盘，等待 P4 阶段闸
现状: DHR_28~31 均未开始
进行到: blocked-by-phase-gate:P4
下一步: P4 通过并经用户放行后，先对本计划做 B-adjust 与 fresh 审核
看什么: design/05、evidence/06、P4 Pilot 报告
阻塞: P4 Gate 未通过
-->

## 0. 定位

P5 建立 DSH 工作台背后的最小承重运行时。它交付一条与 DevHarness 无关的 `basic-agent-task`，证明 DSH 关闭后 Run 仍可持续或确定性恢复。

P5 不追求完整流水。它只冻结所有后续阶段共享的协议、存储、进程所有权和桥接边界。

## 1. 前置条件

开工前必须满足：

- P4 机器闸全部通过；
- P4 人类体验闸明确选择继续；
- 用户在对话中明确放行 P5；
- P4 证据已回流本计划并完成 B-adjust；
- 本计划经过 fresh 交叉审核。

## 2. 交付范围

交付：

1. Relay Runtime 实现语言和进程形态的正式 ADR。
2. `relay.rpc/v1`、`relay.run/v2` 与核心 JSON 协议。
3. Detached Relay Runtime、唯一写者 Store、事件账、快照和恢复。
4. DSH Bridge 的查询、订阅和窄控制。
5. `relay/basic-agent-task@1` 的端到端运行。
6. CLI 与 DSH UI 读取同一 Run。

不交付：

- DevHarness S0~E13；
- Herdr 多账号施工；
- 多卡调度；
- 重编排、诊断 Agent；
- 周报 Outbox；
- E11/E12/E13；
- 完整 Linux 实战。

## 3. 核心协议

P5 至少冻结以下协议：

```text
relay.rpc/v1
relay.run/v2
relay.resolved-plan/v1
relay.event/v2
relay.run-state/v1
relay.launch-receipt/v2
relay.checkpoint/v2
relay.result/v2
relay.host-observation/v1
relay.attention/v1
```

协议必须平台无关，不能导入 DSH、Cordis、Herdr 或 DevHarness 私有类型。

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

## 4. 任务表

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位 | 状态 | 依赖 | 工作区 | 验收时间 · verify SHA |
|---|---|---|---|---|---|---|
| DHR_28 | 根据 P4 证据确定 Runtime 语言并冻结 v2/RPC 协议 | 标准 | blocked-by-phase-gate:P4 | P4 Gate | <开工时回填> | |
| DHR_29 | 实现 Detached Runtime、Store、事件账与恢复 | 标准 | blocked-by-phase-gate:P4 | DHR_28 | <开工时回填> | |
| DHR_30 | 实现 DSH Bridge 查询、订阅、重连与窄控制 | 标准 | blocked-by-phase-gate:P4 | DHR_29 | <开工时回填> | |
| DHR_31 | 跑通 basic-agent-task 垂直闭环 | 标准 | blocked-by-phase-gate:P4 | DHR_30 | <开工时回填> | |

### DHR_28：ADR 与协议

目标：

- 根据 P4 的外部插件体验、DSH API 稳定性和进程生命周期证据，选择 Go sidecar 或独立 TypeScript Runtime。
- 冻结协议 schema、reason code、兼容矩阵和 golden fixture。

选择原则：

| 条件 | 倾向 |
|---|---|
| 独立 CLI、跨外壳、单二进制和 DSH 隔离价值更高 | Go Runtime |
| DSH Service 复用收益很高，但仍能独立进程运行 | TypeScript Runtime |
| 需要把 Core 嵌入 DSH Web 进程 | 当前拒绝，需回 A |

机器验收：

- 协议正反 fixture 可由独立校验器验证。
- DSH 与 Runtime 使用生成或共享的稳定数据合同，不共享活动对象。
- 未知字段、未知版本、能力不匹配 fail-closed。

### DHR_29：Detached Runtime 与 Store

目标：

- 建立独立宿主 PID/lease、单 Run 唯一写者和过期接管。
- 建立不可变工件、追加事件、原子快照和确定性回放。
- 支持 start、status、stop、resume、inspect。

机器验收：

- 客户端退出后 Runtime 继续推进等待节点或保持可恢复状态。
- Runtime 强杀后能够从 Store 重建同一状态签名。
- 第二个宿主被 lease 拒绝，过期后可接管。
- 重复 checkpoint/result 幂等，冲突终态拒绝。
- 迟到结果按 receipt 身份链接受或隔离。

### DHR_30：DSH Bridge

目标：

- Host Plugin 提供 `ctx.relay`。
- Client Plugin 消费稳定读模型。
- 支持查询、事件订阅、重连和窄控制。

最小接口：

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

- DSH 插件卸载只断开客户端，不取消 Run。
- DSH 重启后从 Runtime 重建 UI，不依赖旧 Session 内存。
- 重复 control request 以 request id 幂等。
- DSH 版本私有字段不进入 Relay Store。

### DHR_31：basic-agent-task 垂直闭环

工作流：

```text
prepare
  -> launch DSH Native Agent
  -> await structured result
  -> optional machine verify
  -> succeeded
```

目标：

- DSH Native Agent 接收自包含 brief。
- Agent 通过窄入口提交 checkpoint/result。
- DSH UI 和 CLI 同时展示同一 Run。
- Run 在 DSH 重启后继续或恢复。

不允许使用 DevHarness 特有字段，借此证明 Relay Core 与 DevHarness 解耦。

## 5. P5 阶段闸

### 机器闸 P5-M

| ID | 命题 |
|---|---|
| P5-M1 | Runtime 与 DSH Web 进程生命周期分离 |
| P5-M2 | 强杀并恢复后状态、事件和终态确定一致 |
| P5-M3 | DSH 重启后重新连接并重建 UI |
| P5-M4 | CLI 与 DSH 读取同一 Run Store |
| P5-M5 | basic-agent-task 在无 DevHarness Contract 情况下完整运行 |
| P5-M6 | 协议版本、能力和未知输入均 fail-closed |

### 人类闸 P5-H

用户判断：

- 独立 Runtime 带来的启动和资源成本是否可接受；
- DSH 页面与独立运行时的组合是否仍像一个统一工作台；
- 选定的 Runtime 语言是否继续作为后续默认。

### 解锁规则

P5-M 全部通过、P5-H 明确、用户同意进入 P6 后，P6 才解除阻塞。

## 6. 从旧 P2 吸收的责任

P5 吸收旧 P2 中以下通用能力：

```text
relay/v2 身份链与兼容
Detached 宿主
PID/lease
恢复锁
控制台和查询
运行索引
基础 profile 引用字段
```

旧 P2 的文件级 PowerShell 实施提示不迁移。行为、契约和测试命题作为 Oracle 使用。

## 7. 开工边界

本计划预先落盘只用于展示阶段责任。P4 未通过时，DHR_28~31 均不得进入 D 开工。
