<!-- dh:v1 -->
# DeepSeek Harness 插件化与专属工作台：目标架构与阶段交付方案

> 状态：DSH 专属工作台方向冻结，不再属于当前 `designInputs[]`。本文保留当时的研究和裁决；后续若重启 DSH 方向，须以 [10 薄计划与显式节点边界](./10-薄RelayPlan与显式节点边界-产品设计调整.md) 的统一 Runtime/Read Model 边界另行立项与拆计划。本文不授权任何任务卡直接开工。
>
> 首次研究：2026-08-17
>
> 主线收束：2026-08-18
>
> DeepSeek Harness 研究基线：`deepseek-ai/deepseek-harness`，`dsh-v0.1.0-rc.7@99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`
>
> 交叉审核：[Claude 对 05 的评估](./evidence/05-DSH插件化-对05方案的评估意见-待第三方评估.md)
>
> 第三方裁决：[DSH 插件化第三方裁决与阶段主线](./evidence/06-DSH插件化-第三方裁决与阶段主线.md)

## 1. 用户目标

用户希望把 dh-relay 做成个人专属工作台中的持久工作流能力。工作台需要统一连接多个本地项目、多个 Agent 产品和多个账号，同时保留业务代码位于业务仓、DevHarness 规则独立演进、运行过程可恢复和可审计。

当前主要施工环境包含：

```text
Codex: codex / codex-ninth
Claude Code: claude / claude-grok / claude5
交互宿主: Herdr
目标工作台: DeepSeek Harness
```

这些入口的真实命令、配置目录、账号态、环境变量、身份探测和 quota 样本需要后续本机审计。本文只冻结逻辑边界，不猜测本机实现。

## 2. 最终架构判断

采用方案 C：

```text
DeepSeek Harness Personal Workbench
        |
        | Cordis Service / Remote UI
        v
Relay Bridge Plugin
        |
        | relay.rpc/v1
        v
Detached Relay Runtime
        |
        +-- Workflow Contract / Gate Adapter
        +-- Herdr Executor
        +-- DSH Native Agent Executor
        +-- DSH One-shot Subagent Executor
        +-- Process / Fake Executor
        +-- Run Store / Replay / Approval / Attention / Outbox
        |
        v
业务仓 Git / DevPlan / Workspace / Review / Verify
```

职责如下：

| 组件 | 权责 |
|---|---|
| DeepSeek Harness | 工作区、对话、模型配置、插件管理、可视化、Attention、审批界面和导航 |
| Relay Bridge | DSH 与 Relay Runtime 的协议适配、重连、读模型和窄控制 |
| Relay Runtime | ResolvedPlan、状态机、唯一写者、恢复、Attempt、Receipt、Approval、Outbox 和确定性执行 |
| DevHarness | Workflow Contract、领域 Gate、任务工件、质量规则和 verify 真相 |
| Herdr | 外部 Codex/Claude Code 的交互式运行、续接、pane 和状态观测 |
| 业务仓 | 代码、DevPlan、workspace、review、as-built、knowledge 和 Git 历史 |

DSH 是目标产品外壳。Relay Runtime 在阶段验证期间保持独立进程，以隔离 DSH 开发者预览版本的变化和 Web 进程生命周期。

## 3. 为什么采用方案 C

### 3.1 DSH 能直接提供的价值

DSH 已具备：

- Profile 与 Bundle；
- 树外 Host/Client Plugin；
- Web UI 与 UI Slot；
- Workspace、Session、模型路由与设置；
- Subagent、Jobs、Subprocess、Terminal；
- Approval、User Questions、Storage；
- 插件安装和 Profile 组合。

这些能力能够承担个人工作台的通用外壳，显著减少 agent-console 从零建设平台能力的工作量。

### 3.2 DSH 当前无法独立承担的责任

DSH 动态 Workflow 当前缺少：

- 工作流日志化和检查点；
- 进程重启后的工作流恢复；
- 已发布、版本化的持久工作流；
- 后台脱离收集；
- 服务级运行句柄追踪；
- Authority Snapshot、Attempt、Receipt 和迟到结果隔离；
- DevHarness Finalizer 的跨步骤授权和恢复。

DSH continuable Subagent 已有持久描述符、会话持久化和冷恢复，这提高了原生 TypeScript 方案的长期价值。它解决的是 Agent 会话续接，整张受控工作流的事务和恢复仍由 Relay Runtime 提供。

### 3.3 DSH 仍处于快速迭代期

官方将当前版本标记为开发者预览，并提示后续会出现破坏兼容性的变化。外部 Client UI、Remote API 和 Cordis Service 是最需要实测的风险面。

因此：

- 所有 DSH import 集中在 Bridge 兼容层；
- Relay 数据协议不导入 DSH 私有类型；
- Run 不随 DSH 插件卸载或 Web 进程退出而取消；
- 后续必须实际跨一个 DSH 版本复验兼容性。

## 4. 三类真相

| 真相类型 | 权威位置 | 内容 |
|---|---|---|
| 业务与验收真相 | 业务仓 Git、DevPlan、workspace、review、verify | 目标、验收、工件、复核、完成和销户 |
| Relay 运行真相 | `<repo>/.dh-relay/<run_id>/` | ResolvedPlan、Attempt、Receipt、事件、宿主观测、Approval、Outbox、恢复 |
| DSH 工作台状态 | DSH Session、设置和可重建投影 | 当前页面、关联 Run、事件游标、展示偏好 |

状态层级必须分开：

```text
Herdr done
  只表示 Agent 停止工作

Relay node succeeded
  表示节点提交了合法 Result

DevHarness task completed
  表示领域 Gate、用户确认、Finalizer 和 verify 全部成立
```

DSH Session、Job、Terminal 和浏览器状态不能直接改变 Relay 或 DevHarness 的完成事实。

## 5. DSH 插件形态

建议首轮保持四个树外包：

```text
@personal/dsh-relay-host
  ctx.relay、IPC、版本协商、事件和命令

@personal/dsh-relay-client
  Run 图、Attention、证据和审批 UI

@personal/dsh-devharness
  Contract/Gate 展示元数据与领域接线

@personal/dsh-workbench
  Bundle，装配上述插件和默认 Profile
```

建议的 DSH Profile：

```text
personal-workbench
```

Host 与 Client 只传稳定数据协议。Relay Bridge 暴露窄接口：

```text
contracts()
executorProfiles()
listRuns()
inspectRun(runId)
validate(request)
start(request)
control(request)
answerAttention(request)
approve(request)
subscribe(filter)
```

普通模型工具不能直接调用 E12 Finalizer 和高权限 effect。

## 6. Relay Runtime 与 IPC

### 6.1 生命周期

Relay Runtime 独立于 DSH Web 进程：

- DSH 插件可以发现并连接 Runtime；
- Runtime 不存在时，可以由受控启动器拉起；
- 插件卸载只断开客户端；
- DSH 重启后重新连接并从 Run Store 重建页面；
- Runtime 崩溃后从快照和事件账确定性恢复。

### 6.2 生产协议

```text
Windows: Named Pipe
Linux: Unix Domain Socket
Transport: newline-delimited JSON-RPC 2.0
```

握手至少包含：

```text
protocol_version
runtime_version
capability_hash
client_id
request_id
```

RPC 支持查询、命令、事件订阅、重连、幂等请求和取消。DSH SDK 协议面向外部客户端驱动 DSH Agent，职责和 Relay RPC 不同，因此不直接复用。

### 6.3 核心语言

P4 Pilot 完成前不锁定 Relay Runtime 最终语言。

P5 开工时根据证据选择：

| 证据 | 倾向 |
|---|---|
| 独立 CLI、跨外壳、单二进制和 DSH 隔离价值更高 | Go Runtime |
| DSH Service 复用收益很高，独立 TypeScript 进程仍可保持生命周期分离 | TypeScript Runtime |
| 需要把 Runtime 嵌入 DSH Web 进程 | 回到 A 讨论，当前不接受 |

无论语言选择，协议、Run Store、Workflow Contract 和业务仓真相保持平台无关。

## 7. 两种 Profile

DSH 与 Relay 都使用 Profile 一词，必须明确区分：

| 类型 | 作用 | 示例 |
|---|---|---|
| DSH Profile | 装配整个工作台插件树 | `personal-workbench` |
| Relay Executor Profile | 决定某节点由哪个产品、账号和后端执行 | `herdr.codex.ninth` |

### 7.1 Executor Profile 示例

```text
herdr.codex.default
herdr.codex.ninth
herdr.claude.default
herdr.claude.grok
herdr.claude.minimax
dsh.native.planner
dsh.review.codex-one-shot
dsh.review.claude-one-shot
dsh.diagnoser.readonly
process.gate
process.finalizer
```

注册表保存逻辑身份和能力：

```text
executor_profile_id
backend
product
command_alias
account_alias
capabilities
expected_identity
config_fingerprint_rule
quota_detector_id
fallback_profile_ids
```

计划和 Git 留档不保存凭据值、完整敏感环境和任意 CLI 参数。

Launch Receipt 冻结：

```text
executor_profile_id
executor_kind
product
account_alias
config_fingerprint
capability_hash
host_ref
```

## 8. Agent 执行策略

### 8.1 Codex API 作为 DSH 模型

将 Codex 代理成 OpenAI 兼容 API，可以让 DSH Native Agent 使用 Codex 模型。此时：

- DSH 提供 Agent Loop、工具、权限、会话和上下文；
- Codex 模型提供推理和工具调用决策；
- Codex CLI 的产品线程、原生工具协议和账号交互不会自动进入 DSH。

这条路线适合主对话、规划、文档、汇总和部分范围清楚的编码任务。正式使用前必须验证流式、Tool Call、并行工具、多轮历史、取消、错误映射和长上下文。

### 8.2 实际 Codex 和 Claude Code 产品

复杂施工首选：

```text
Relay
  -> Herdr Adapter
  -> Codex CLI / Claude Code
```

Herdr 提供 `working / blocked / done / idle / unknown`、pane、交互和续接。Relay 持有 Receipt、Checkpoint、Result、超时和恢复。

### 8.3 DSH One-shot Provider

DSH 官方 Codex、Claude Code、ACP Provider 适合：

- fresh review；
- 一次性代码审计；
- 无交互短任务；
- 只需要最终文本的窄节点。

当前不优先用于长时间施工、人工审批、AskUserQuestion、续接和完整进度流。

### 8.4 DevHarness 节点路由建议

| 节点 | 首选执行 |
|---|---|
| S0 工作区 | Process |
| S1 brief | DSH Native Agent |
| S2 task plan | DSH Native 强模型 |
| S3 长时间施工 | Herdr + Codex/Claude Code |
| S3 小型施工 | DSH Native + 合格的 Codex API |
| 批次小审 | DSH One-shot 或 fresh Agent |
| E0 机器体检 | Process |
| E1 DevHarness Gate | Gate Adapter |
| E2 第二轮代码复核 | DSH One-shot Codex/Claude 或 fresh Herdr |
| E3 复核收敛 | DSH Native 强模型 |
| E4 需求复核 | DSH Native 或 One-shot |
| E5 教训复核 | DSH Native |
| E6 Miner | DSH Native 低成本模型 |
| E7 As-built | DSH Native |
| E8 证据挂接 | DSH Native + Gate |
| E9/E10 展示 | DSH UI |
| E11 用户确认 | DSH UI + Relay Approval Receipt |
| E12 精确合入 | Privileged Process |
| E13 销户 | Finalizer Process |

## 9. DevHarness 接入

DevHarness 通过版本化 Workflow Contract 接入：

```text
DevHarness Skill 与节点图
  -> dev-harness/task-standard@N
  -> Workflow Compiler
  -> ResolvedPlan
  -> Relay Runtime
```

Relay Core 不内置 A/B/D/E、任务卡、两轮复核和 releasePacket 的业务含义。Contract 和 Gate Adapter持有：

- S0~S3 与 E0~E13；
- 两轮独立复核；
- 需求复核与教训复核；
- H=0、风险和不可豁免规则；
- releasePacket；
- E11/E12/E13；
- verify 和销户。

每个 Run 冻结：

```text
source_repo
source_commit
contract_id
contract_version
contract_content_hash
gate_bundle_id
gate_bundle_digest
required_capabilities
```

## 10. 接力计划与文档落点

### 10.1 dh-relay 产品文档

保留在 dh-relay 仓：

```text
docs/modules/dh-relay/design/
docs/modules/dh-relay/dev_plan/
```

### 10.2 运行现场

一次真实 Run 的权威现场：

```text
<repo>/.dh-relay/<run_id>/
```

建议结构：

```text
authority-snapshot.json
plan/
  plan-proposal.json
  resolved-plan.json
  resolved-plan.md
  revisions/<revision_id>/
relay-state.json
events.jsonl
host-lease.json
launches/
attempts/
checkpoints/
diagnostics/
attentions/
approvals/
closeout/
outbox/
shots/
```

`resolved-plan.json` 是执行权威。Markdown 版本是可重建的人读投影。

### 10.3 预运行请求

用户确认前尚无正式 Run，可以使用：

```text
<repo>/.dh-relay/inbox/authorization/<request_id>.json
```

确认后固化到：

```text
<run>/requests/authorization-request.json
```

该路径的 schema、并发和清理由 P7 正式冻结。

### 10.4 Git 留档

Run 收口后：

```text
<repo>/docs/relay/README.md
<repo>/docs/relay/runs/<run_id>/
```

归档包含最终 ResolvedPlan、时间线、每卡终态、verify SHA、Profile 摘要、重编排、诊断、Approval、Action、Oracle 和精选证据。

### 10.5 DSH 投影

DSH 只保存可删除、可重建的关联：

```text
dsh_session_id
canonical_repo
run_id
last_seen_event_seq
opened_node_id
```

投影丢失后，从 `~/.dh-relay/runs.json` 和业务仓 Run Store 重建。

## 11. 重编排 Agent

重编排 Agent 继续支持，触发点为 `dependency_blocked`。

流程：

```text
Relay 创建 replan request
  -> Replanner 只读 Authority、Contract、计划和证据
  -> 提交 proposal
  -> Compiler 校验
  -> DSH 展示图 Diff 和影响面
  -> 用户批准或拒绝
  -> Relay 保存 receipt 并发布 plan revision
```

当前边界：

- 只在当前卡内增加合法前置节点；
- 不加卡、不换卡；
- 不删硬节点；
- 不修改目标、验收和 effect；
- 不直接写 ResolvedPlan 和 active state；
- 不受影响卡继续，依赖闭包在安全点冻结。

首选 DSH Native 强模型，Herdr + Codex/Claude 作为 fallback。

## 12. 诊断 Agent

诊断 Agent 保持一次性、强制只读。触发包括：

```text
interrupted_unknown
paused
closeout_blocked
quota 无 fallback
恢复发现断棒
authority 或 gate 冲突
```

DSH 下分为两段：

1. Diagnoser 生成 report、evidence 和 option set 后退出。
2. Relay 持久化 Attention，DSH 展示，用户可以稍后选择。

选项冻结：

```text
option_id
action
params
target
expected_state_hash
nonce
expires_at
```

Relay 校验逐字段等值、Profile 能力、目标身份、状态 hash 和单次消费。DSH 提供界面，不持有控制真相。

日常施工 Profile 通常拥有写权限，不能直接用于 Diagnoser。无法机器证明只读的 Profile 不进入 allowlist。

## 13. Hook、Action 与 Outbox

跨项目周报、通知和索引更新通过 durable Outbox：

```text
<run>/outbox/requests/
<run>/outbox/attempts/
<run>/outbox/results/
```

首批 Hook：

```text
run.started
node.succeeded
card.succeeded
card.failed
attention.opened
run.finished
```

首个真实 Action：

```text
project-status.weekly-report.append@1
```

规则：

- Action 已注册并带版本和 content hash；
- 计划内禁止内联 shell；
- request 不可变并携带 idempotency key；
- 默认 best_effort；
- 失败、重试和 dead-letter 可见；
- 目标项目拥有业务逻辑和检查器；
- Action 成功不能替代源任务验收。

## 14. 专属工作台产品面

复用 DSH：

- Workspace；
- Session 与 Chat；
- 模型和 Provider 设置；
- Agent Preset；
- 权限与插件设置；
- Jobs、Subagent 和工具展示。

新增最少三个面：

### 工作台首页

项目、最近 Run、Attention、待人验和 dead-letter。

### Relay Run 页面

Contract、ResolvedPlan、当前节点、Executor Profile、DSH/Herdr/Process 状态、Attempt、证据、Action 和恢复控制。

### Attention 与 Approval 页面

诊断报告、合法选项、重编排 Diff、releasePacket、allowed/excluded effects 和 Receipt。

完整产品 UI 只在底层流水有可展示事实后逐步建设。P4 仅验证一个最小面板。

## 15. 阶段交付主线

现役 DevPlan：

```text
P4 DSH 工作台最小 Pilot
  验证 Windows 树外插件、最小 UI、fake/v1 只读和棒 0 Proposal

P5 Relay v2 持久内核与 DSH Bridge
  冻结协议、Detached Runtime、Store、恢复和 basic-agent-task

P6 Herdr 多账号执行底座
  审计 codex/codex-ninth/claude/claude-grok/claude5，跑真实施工

P7 DevHarness 单卡完整流水
  一张真实标准卡跑通 S0~E13 和 verify

P8 多卡编排与运行治理
  多卡、重编排、诊断、周报 Outbox、归档和 Oracle

P9 双平台定型与迁移
  Windows/Linux、DSH 升级、发布、legacy 和 agent-console 裁决
```

阶段闸规则：

1. 前一阶段机器验收全部通过。
2. 前一阶段人类体验判断已记录。
3. 失败和未验证项已诚实列出。
4. 用户明确同意进入下一阶段。

设计总方向的选择不等于 P4~P9 全部开工授权。

## 16. 对 Claude 交叉审核的处理

| 意见 | 处理 |
|---|---|
| 计划堆叠 | 采纳，冻结旧 P2/P3，改成 P4~P9 单线阶段闸 |
| POC-2 前置过重 | 采纳，P4 只读 v1/fake；v2 Contract/Profile 放 P5 |
| UI 早于流水 | 采纳，P4 只做最小面板，P5 起优先 Runtime |
| continuable 子 Agent 被低估 | 部分采纳，纳入语言和执行器评估，仍保留 Relay 编排层 |
| Windows 风险 | 采纳，P4 Windows 第一主平台 |
| Client UI RC 风险 | 采纳，Bridge 兼容层和版本升级复验 |
| 04/05 冲突 | 采纳，05 成为主线，04 只保留被继承部分 |

完整裁决见 evidence/06。

## 17. 与既有设计和计划的关系

### design/01

继续作为 P1 已实现基线。

### design/02

继续作为完整流水的功能、安全和验收需求来源。旧 P2 的 PowerShell 实施切分不再约束新阶段计划。

### design/03

保留 Herdr preflight 和风险证据。Herdr 实施由 P6 重新承接。

### design/04

继续采用：

```text
Workflow Contract
受控图
Gate Adapter
Herdr
Outbox
三类真相
```

以下结论由本文取代：

```text
Go 已经锁定为最终语言
agent-console 是目标控制台
```

### 旧 P2/P3

冻结废弃。DHR_04 已完成成果保留；其余旧任务停止生效，历史 ID 不复用。现役状态见 `dev_plan/README.md`。

## 18. 风险和停止条件

命中以下任一条件时，停止扩大 DSH 投入并回到方向裁决：

- 树外 Client Plugin 必须长期 fork DSH；
- DSH 连续升级导致兼容层无法收束；
- DSH 重启会终止或污染 Relay Run；
- Windows 或 Linux 主平台无法稳定运行；
- E11/E12 授权无法保持 Relay 独立真相；
- Herdr 无法与 DSH 工作台共存；
- 插件安装和更新供应链风险不可接受；
- 工作台体验没有明显优于独立 agent-console；
- 某阶段持续扩大范围却无法交付自己的最小闭环。

## 19. 最终完成形态

```text
DeepSeek Harness
  日常默认工作台

Relay Runtime
  持久、受控、可恢复的工作流服务

DevHarness
  开发领域 Contract 与 Gate

Herdr
  Codex/Claude Code 外部交互式施工宿主

业务仓
  代码、计划、工件和验收真相
```

P9 完成后，04、旧 P2、旧 P3 和各 Pilot 文档转为历史与证据，不再与现役说明并列。

## 20. 官方资料基线

本轮研究固定到 `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`：

- `README.zh.md`
- `docs/architecture.zh.md`
- `docs/user/develop/basic/index.zh.md`
- `docs/user/develop/basic/publish.zh.md`
- `packages/README.zh.md`
- `packages/workflow/workflow/README.zh.md`
- `packages/subagent/subagent/README.zh.md`
- `packages/subagent/subagent-codex/README.zh.md`
- `packages/subagent/subagent-claude-code/README.zh.md`
- `packages/terminal/terminal/README.zh.md`
- `packages/interaction/user-approval/README.zh.md`
- `packages/interaction/user-questions/README.zh.md`
- `packages/storage/README.zh.md`
- `packages/client/README.zh.md`
- `packages/sdk/README.zh.md`
