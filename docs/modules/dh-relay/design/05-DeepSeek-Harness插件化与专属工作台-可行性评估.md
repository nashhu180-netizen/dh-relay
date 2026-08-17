<!-- dh:v1 -->
# DeepSeek Harness 插件化与专属工作台：可行性评估与验证方案

> 状态：探索性技术评估，待用户确认。本文没有进入 `design/README.md` 的 `designInputs[]` 白名单，不授权 B 拆计划或 D 开工。
>
> 研究日期：2026-08-17
>
> 研究基线：DeepSeek 官方仓库 `deepseek-ai/deepseek-harness`，标签 `dsh-v0.1.0-rc.7`，提交 `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`。
>
> 关联方案：[04-跨平台运行时与可扩展编排](./04-跨平台运行时与可扩展编排-技术方案评估与决策.md)。本文提出一条新的上层平台路线，暂不推翻 04 中的 Workflow Contract、受控图、Gate Adapter、Herdr、Outbox 和领域真相分层。

## 1. 评估问题

本次要判断三个问题：

1. dh-relay 能否作为 DeepSeek Harness 插件运行。
2. DeepSeek Harness 能否承接 agent-console 原本计划承担的薄壳与个人工作台角色。
3. 一旦采用 DeepSeek Harness，dh-relay 是否还需要独立的 Go Core，或者应改为原生 TypeScript 插件。

## 2. 结论

### 2.1 总体判断

这个方向值得进入技术验证，战略匹配度较高。

DeepSeek Harness 已经具备插件服务、Profile、组合包、Web UI、UI Slot、工作区、会话、模型路由、工具、后台任务、持久终端、Subagent、审批、用户问答、存储和进程管理等基础能力。它能够承担个人工作台的通用外壳，减少 agent-console 从零建设平台能力的工作量。

同时，dh-relay 不能直接改写成 DeepSeek Harness 当前的动态工作流脚本。官方 `ctx.workflowEngine` 面向模型编写的临时编排，当前缺少检查点、进程重启恢复、保存工作流、后台脱离运行和运行服务级追踪。这些缺口正好位于 dh-relay 的核心价值区。

推荐路线是：

> **先把 dh-relay 作为 DeepSeek Harness 中的持久工作流服务插件接入，把 DeepSeek Harness 用作个人工作台外壳；Relay Core 在验证期继续保持独立。**

产品体验上，用户会在 DeepSeek Harness 中看到和操作 dh-relay。工程实现上，首轮采用插件桥接现有 Relay Runtime，避免立即把运行核心重写进一个仍处于开发者预览期的平台。

### 2.2 当前明确支持的判断

- 支持将 dh-relay 做成 DSH Profile 中的可安装组合包。
- 支持在 DSH 中提供 `ctx.relay` 服务、Relay 命令、模型工具和工作流状态事件。
- 支持增加 Relay Run 列表、流程图、Attention、证据、审批和项目导航界面。
- 支持复用 DSH 的工作区、聊天、模型配置、设置、会话、权限和插件管理能力。
- 支持把 DevHarness 作为 Relay Workflow Contract 与 Gate Bundle 接入。
- 支持继续保留 Herdr，承载需要交互、续接和状态感知的外部 Agent。
- 支持在验证成功后冻结 agent-console 的独立平台建设，并将其缩为启动器或停止继续开发。

### 2.3 当前不建议的判断

- 不建议把 `dev-harness/task-standard` 直接改写成模型自由生成的 DSH workflow script。
- 不建议立即删除 dh-relay 独立运行能力。
- 不建议立即把 Go 方案全部换成 TypeScript 实现。
- 不建议让模型通过 DSH 动态包机制生成或替换 Relay Core。
- 不建议让 DSH 内置审批记录直接承担 DevHarness E11 的最终授权真相。
- 不建议现在删除 agent-console 仓库。

## 3. DeepSeek Harness 当前能力与成熟度

### 3.1 产品状态

DeepSeek Harness 是 DeepSeek AI 发布的开源 Agent Harness，采用 Cordis 插件架构，官方口号为 `Everything is a Plugin`。当前版本为 `0.1.0-rc.7`，官方 README 将其标记为开发者预览，并明确提示未来会出现破坏兼容性的变更。

因此，本项目可以把它当作高潜力平台和技术验证对象，暂时不能把其内部 API 视为稳定长期合同。

### 3.2 插件与组装模型

DSH 插件是导出 `apply(ctx)` 的 TypeScript 模块，也可以使用对象或 `Service` 类形态。插件通过 `inject` 声明依赖，通过 Cordis Context 提供或消费服务。插件卸载时，事件监听、工具、定时器和 `ctx.effect()` 注册的资源会被自动清理。

可分发插件使用两级结构：

- Bundle：npm 包，声明 `dsh.bundle`，提供一层 `cordis.patch.yml`。
- Profile：用户可启动的插件组合，按顺序装入多个 Bundle，再叠加用户自己的 patch。

这与个人工作台需求较匹配。可以建立一个独立 Profile：

```text
profile: personal-workbench

@deepseek-ai/dsh-base
@deepseek-ai/dsh-web-app
@personal/dsh-relay-bundle
@personal/dsh-devharness-bundle
@personal/dsh-project-actions
用户机器级 patch
```

### 3.3 可复用能力

| DSH 能力 | 对个人工作台的价值 | 对 dh-relay 的价值 |
|---|---|---|
| Workspace | 管理多个本地仓库 | 提供目标仓选择与 cwd |
| Session 与 Chat | 统一交互入口 | 展示任务对话与证据 |
| 模型路由 | 管理 DeepSeek 等模型 | 为 Relay 节点选择 DSH Agent |
| Subagent seam | 多提供方委托 | 可用于短时、无交互节点 |
| Jobs | 后台任务展示与取消 | 展示正在进行的插件调用 |
| Subprocess | 受管进程树 | 启动 Relay Runtime 或辅助工具 |
| Terminal | 持久 PTY | 可承载进程内短期交互终端 |
| Interaction | 审批、问题、权限 | 提供 Attention 和确认界面基础 |
| Storage | JSON、SQLite、领域记录 | 保存插件配置和可重建读模型 |
| UI Slots | 插入自定义 React UI | 实现 Run 图、Attention 和证据面板 |
| Commands 与 Tools | 无模型命令与模型工具 | 暴露 relay start/status/resume 等能力 |
| Profile 与 Bundle | 组合专属产品 | 形成个人工作台发行形态 |

## 4. 与 dh-relay 需求的关键差距

### 4.1 DSH 动态工作流当前不具备 Relay 级持久性

DSH 的 `ctx.workflowEngine` 适合由模型编写脚本，扇出 Subagent，并在前台收集结果。当前官方限制包括：

- 没有工作流日志化和检查点；
- 进程重启后不能恢复；
- 没有保存工作流；
- 没有后台启动、轮询和脱离收集；
- 服务不追踪独立运行句柄，持有方负责取消与 dispose；
- worker thread 只是隔离事件循环，不构成安全边界。

这意味着 DSH 动态工作流可以承担一次性研究、并行分析和临时 fan-out，不能承担 DevHarness 标准任务从 S0 到 E13 的权威执行。

### 4.2 DSH Jobs 和 Terminal 也以进程生命周期为边界

DSH Jobs 是进程内后台任务注册表。Terminal 提供按 Agent 所有者隔离的持久 PTY，但官方明确说明 Harness 重启后不会恢复。

因此，DSH 重启后的持续运行、跨天恢复、attempt、receipt、checkpoint、迟到结果隔离和唯一写者仍需 Relay Runtime 负责。

### 4.3 内置外部 Agent 提供方适合窄任务

DSH 已经提供 Codex、Claude Code、ACP 和 DSH SDK 等 Subagent Provider，这是很有价值的能力。

当前 Codex 与 Claude Code 提供方具有共同限制：

- 每次请求创建全新的进程与临时会话；
- 主要向父级返回最终文本；
- 不提供产品会话续接、恢复和进度流；
- 不提供人工审批或用户问答路径；
- 宿主 CLI 安装、账号状态和兼容性仍由机器环境负责。

它们适合 fresh review、只读审计、一次性研究和边界清晰的短任务。需要用户确认、长时施工、续接和可见终端状态的节点，首轮继续使用 Herdr 更稳妥。

### 4.4 DSH Approval 不能直接承担 DevHarness E11

DSH 的 `ctx.approval` 是活跃 Agent 轮次内的一次性审批，结果为允许一次、拒绝、取消或不可用。当前没有持久的轮次外授权、授权存储、撤销或复杂 effect 列表合同。

DevHarness E11 需要冻结 `releasePacket hash + allowed_effects + excluded_effects`，并允许 E12/E13 在用户确认后连续执行精确本地收口。这个授权仍应由 Relay 自己的 approval request/receipt 协议持有。

DSH 可以提供展示和回答界面，Relay Store 保存最终授权回执。

### 4.5 动态包机制不适合承重核心

DSH 支持模型在运行时定义和运行动态 Cordis 包。Host 半运行在 `node:vm` 中，官方明确说明该 VM 不构成安全边界，定义只保存在内存中，重启后不会恢复。带浏览器半的动态包在没有页面连接时还可能持续挂起。

该机制可以用于临时 UI 和实验能力，不能用于生成、替换或升级 Relay Core、DevHarness Gate 和高权限 Finalizer。

## 5. 四种整合方案

### 5.1 方案 A：把 dh-relay 写成 DSH 动态 workflow script

```text
DSH Agent
  -> workflow tool
  -> 模型生成脚本
  -> 子 Agent fan-out
```

优点是开发快、原生使用 DSH workflow UI。

缺点是缺少持久恢复、授权冻结、固定拓扑、唯一写者和外部 effect 管理，也会重新引入 Planner 自由组图的授权问题。

结论：不采用为权威流水。仅用于一次性辅助子流程。

### 5.2 方案 B：原生 TypeScript Relay Service 插件

```text
DSH Profile
  -> ctx.relay
  -> TypeScript Durable Relay Engine
  -> DSH services
```

优点：

- 与 DSH Agent、Subagent、Storage、Subprocess、Interaction 和 UI 直接集成；
- 单一 TypeScript 技术栈，AI 开发友好；
- 插件和 UI 调用链短；
- 个人工作台体验最统一。

风险：

- DSH 仍处于开发者预览；
- API 变化会直接影响 Relay Core；
- DSH 进程重启成为运行时故障域；
- 原生实现仍需自己建设持久工作流引擎，无法直接复用当前 workflow seam；
- 独立 CLI 和其他外壳能力会减弱。

结论：作为验证成功后的长期候选，当前不直接开工。

### 5.3 方案 C：DSH 插件外壳 + 独立 Relay Runtime

```text
DSH Web / Agent
        |
        v
Relay Bridge Plugin
        |
        v
relay.rpc/v1
        |
        v
Detached Relay Runtime
        |
        +-> Workflow Contract / Gate Adapter
        +-> Herdr / Process
        +-> Run Store / Outbox
```

优点：

- DSH 提供工作台、模型、会话、工具和 UI；
- Relay 保留持久恢复和独立运行能力；
- DSH 升级或退出时，业务仓运行真相不受影响；
- 可以先桥接现有实现，再决定 Go 或 TypeScript；
- agent-console 和 DSH 可在过渡期同时读取相同 Relay 协议。

成本：

- 同时维护 Node 与 Relay Runtime；
- 需要 IPC、版本协商和重连；
- DSH 原生服务与 Relay Adapter 之间多一层映射。

结论：**推荐作为第一阶段和默认目标。**

### 5.4 方案 D：Fork DeepSeek Harness 做私有工作台

优点是可以全面改 UI 和内核。

成本是长期追上游、处理大量 TypeScript monorepo 变更、同步安全修复与插件接口。

结论：当前不采用。优先通过 Profile、Bundle、Service 和 UI Slot 扩展上游发行版。

## 6. 推荐目标架构

```text
┌──────────────────────────────────────────────────────────────┐
│                  Personal Workbench Profile                  │
│                                                              │
│  DSH Workspace / Chat / Models / Sessions / Settings         │
│  Relay Run UI / Attention Inbox / Evidence / Approval        │
└──────────────────────────────┬───────────────────────────────┘
                               │ Cordis Service + Remote API
                               v
┌──────────────────────────────────────────────────────────────┐
│                    Relay Bridge Bundle                       │
│                                                              │
│  ctx.relay                                                   │
│  relay commands / tools                                      │
│  sidecar discovery / reconnect / capability negotiation      │
│  client UI registration                                      │
└──────────────────────────────┬───────────────────────────────┘
                               │ relay.rpc/v1
                               v
┌──────────────────────────────────────────────────────────────┐
│                  Detached Relay Runtime                      │
│                                                              │
│  ResolvedPlan / Engine / Authority / Store / Replay          │
│  Approval / Attention / Outbox                               │
│  Workflow Contract / DevHarness Gate Adapter                 │
│  Runtime Adapter: DSH Agent / Herdr / Process / Fake         │
└──────────────────────────────────────────────────────────────┘
                               │
                               v
                 业务仓 Git / DevPlan / Workspace / Review
```

### 6.1 三类真相

| 真相 | 权威位置 |
|---|---|
| 业务与验收真相 | 目标业务仓 Git、DevPlan、workspace、review、verify |
| Relay 运行真相 | `.dh-relay/<run_id>/` 的计划、attempt、receipt、事件、approval、outbox |
| DSH 工作台状态 | 会话、UI 选择、插件配置和可重建读模型 |

DSH UI 可以展示和操作 Relay，不能把 DSH Session 或 Job 状态提升为 DevHarness 任务完成事实。

### 6.2 插件拆分建议

首轮保持少量包：

```text
@personal/dsh-relay-host
  提供 ctx.relay、IPC、版本协商、命令和事件

@personal/dsh-relay-client
  注册 Run 列表、流程图、Attention、证据和审批 UI

@personal/dsh-devharness
  提供 Contract/Gate 元数据与 DevHarness 展示适配

@personal/dsh-workbench
  Bundle，装配上面三个插件和默认配置
```

Host 与 Client 之间只传稳定数据协议。所有 DSH 依赖集中在一个兼容层中，业务代码使用自有接口，降低 DSH RC 升级造成的扩散。

### 6.3 Relay Service API

建议 `ctx.relay` 提供窄接口：

```text
contracts()
listRuns()
inspectRun(runId)
validate(request)
start(request)
control(request)
answerAttention(request)
approve(request)
subscribe(filter)
```

模型工具只公开允许模型使用的子集。E11 approval、E12 finalizer 和高权限 effect 不通过普通模型工具直接开放。

## 7. IPC 与进程生命周期

### 7.1 验证期

首个 PoC 可以通过 DSH Subprocess 调用现有 Relay CLI，先实现只读命令：

```text
relay contracts --json
relay list --json
relay status <run_id> --json
relay inspect <run_id> --json
```

这一步只验证 DSH 插件、Profile、UI、工作区和 Relay 数据模型是否匹配，不承诺生产级持续运行。

### 7.2 生产目标

生产目标使用版本化 `relay.rpc/v1`：

- Windows：Named Pipe；
- Linux：Unix Domain Socket；
- 消息：换行分帧 JSON-RPC；
- 必须有 protocol version、runtime version、capability hash 和 request id；
- 支持查询、命令和事件订阅；
- 支持取消、重连和幂等控制请求；
- DSH 插件卸载只断开客户端，不取消已经接受的 Relay Run。

Relay Runtime 应当独立于 DSH Web 进程存活。插件可以在未发现 Runtime 时启动它，随后转为连接方。DSH 重启后重新连接并从 Relay Store 重建展示。

不直接复用 DSH SDK wire protocol。官方 SDK 当前面向外部客户端驱动 DSH Agent，缺少协议版本协商、逐提示词取消和明确的提示词级结果。Relay RPC 的职责不同，需要独立合同。

## 8. Agent 执行策略

### 8.1 DSH Native Agent

适合：

- 基础 Agent Task；
- 研究、总结、规划；
- 在 DSH 自身工具与会话中完成的节点；
- 需要直接展示过程和 UI 的节点。

Relay 可以增加 `dsh-agent` Runtime Adapter，通过 Bridge Plugin 启动 Agent，并把 DSH Session 事件映射为 HostObservation 与 Result。

### 8.2 DSH Codex、Claude Code、ACP Subagent

适合：

- fresh-context 只读复核；
- 一次性代码审计；
- 输出只需要最终文本的窄任务；
- 无人值守且不会触发用户问答的节点。

不优先用于：

- 长时间编码施工；
- 需要续接的节点；
- 需要人工审批或 AskUserQuestion 的节点；
- 需要完整进度流和结构化 checkpoint 的节点。

### 8.3 Herdr

Herdr 首轮继续承担：

- 外部 CLI Agent 的交互式会话；
- `working / blocked / done / idle / unknown` 观测；
- 需要用户在终端内回答的问题；
- 跨步骤可见和可重连的终端现场。

采用 DSH 后，Herdr 的范围可能逐步缩小。是否完全移除，需要等 DSH 外部 Agent Provider 支持续接、进度、人工交互和稳定状态后重新评估。

## 9. DevHarness 的接入

04 文档中的 Workflow Contract 方案继续成立：

```text
DevHarness Skill 与节点图
        -> dev-harness/task-standard@N
        -> ResolvedPlan
        -> Relay Runtime
```

DSH 承担的是工作台、交互与部分执行提供方。DevHarness 的以下规则继续由 Contract 和 Gate Adapter 持有：

- S0~S3 与 E0~E13；
- 两轮独立复核；
- 需求复核与教训复核；
- releasePacket；
- H=0；
- 风险放行与不可豁免项；
- verify 与销户；
- 用户确认后的精确本地收口 effect。

受控图也继续成立。DSH 的插件开放性不赋予 Planner 任意修改 DevHarness 主路径的权限。

## 10. 专属工作台的产品形态

### 10.1 可以复用的 DSH 页面

- 工作区选择；
- 会话与对话；
- 模型与提供方配置；
- Agent Preset；
- 权限预设；
- 插件设置与清单；
- 后台 Jobs；
- Subagent 导航；
- 通用工具调用展示。

### 10.2 需要新增的页面

#### 工作台首页

展示：

- 已登记项目；
- 最近活动；
- 未完成 Relay Run；
- Attention；
- 待人验；
- Outbox dead-letter；
- 常用本地应用入口。

#### Relay Run 页面

展示：

- Workflow Contract 与版本；
- ResolvedPlan 图；
- 当前节点和并行节点；
- DSH、Herdr 与 Process 运行状态；
- attempt、checkpoint、result、gate 和证据；
- 重试、返工、暂停和恢复；
- 周报等外部 Action 状态。

#### Attention 与 Approval 页面

展示：

- Agent blocked；
- authority 失配；
- Gate 不通过；
- releasePacket；
- allowed effects 与 excluded effects；
- 用户回答与 receipt hash。

### 10.3 与 agent-console 的关系

若 DSH Pilot 通过，DSH Web 可以接管 agent-console 原计划中的平台壳：项目发现、运行展示、节点配置、Agent 入口、提醒和导航。

agent-console 暂时保留，处置顺序建议为：

1. Pilot 期间停止新增重复的平台 UI；
2. DSH 工作台完成真实任务后比较体验和稳定性；
3. 若 DSH 通过验收，agent-console 缩为本地启动器、托盘壳或 WebView 包装；
4. 若 DSH 未通过，继续原 agent-console 路线。

业务代码仍留在业务仓。工作台只持有集成插件、配置、状态投影和导航。

## 11. Go 与 TypeScript 的技术决策

DeepSeek Harness 的出现会重新打开核心语言选择。

### 11.1 继续独立 Go Core

适合以下目标：

- DSH、agent-console 和 CLI 都能作为客户端；
- Relay Run 不随 UI 进程退出；
- Windows 与 Linux 交付单独二进制；
- 长期保持平台中立；
- 通过稳定 RPC 隔离 DSH RC 变化。

### 11.2 改为原生 TypeScript 插件

适合以下条件：

- DSH 已成为确定的唯一工作台；
- Cordis Service 与 UI API 趋于稳定；
- 原生接入 Agent、Subagent、Storage、Subprocess 和 Interaction 的收益明显高于双运行时成本；
- DSH 重启后的恢复语义经过验证；
- Windows 与 Linux 的真实任务均稳定运行。

### 11.3 当前裁决

在 DSH Pilot 完成前，暂停把 Go 当作不可逆的最终承诺。继续设计平台无关的 Relay 协议、Run Store、ResolvedPlan、Workflow Contract 和 Gate Contract。

Pilot 后按证据二选一：

- DSH 适配稳定，原生能力收益显著：评估 TypeScript Relay Service；
- DSH 变化快或独立运行价值明显：继续 Go sidecar。

无论最终选择哪种语言，DSH UI 与业务仓之间都只依赖 Relay 稳定协议。

## 12. 风险

### 12.1 上游兼容风险

当前只有 RC 标签，官方明确预告破坏性变更。需要：

- 固定 tag 和 commit；
- 为 DSH import 建立单一兼容层；
- Profile 单独使用 `$DSH_HOME`；
- 插件包锁定依赖；
- 每次升级先在测试 Profile 验证；
- Relay 数据格式不依赖 DSH 内部事件类型。

### 12.2 插件供应链风险

从 Git 安装 TypeScript 插件时可能执行 `prepare`，且安装构建脚本位于 Agent 沙箱之外。个人插件应优先使用：

- 本地可信 checkout；
- 固定 commit；
- 预构建 tarball；
- 受控私有 npm 包。

不允许模型自动安装未知插件或给未知 Git 包授权构建。

### 12.3 单进程与插件卸载风险

Cordis 会在依赖服务消失时 dispose 消费插件。Relay Bridge 必须把“插件断开”和“Run 取消”分开。已经接受的 Run 由独立 Runtime 继续持有。

### 12.4 UI 扩展成本

外部 UI Bundle 已有公开示例，但 DSH Host/Client 分离、Remote API、类型生成和 Slot 组合仍有学习成本。PoC 必须提前验证完整的外部 Client Plugin 链路，避免只验证 Host 插件后误判工作台可行性。

### 12.5 Windows 与 Linux 成熟度

仓库已有 Windows 专项代码和检查，产品仍处于快速迭代期。必须分别验证：

- 安装与升级；
- Web UI；
- 子进程树清理；
- Named Pipe 或 Unix Socket；
- 工作区路径；
- Codex、Claude、Herdr 与 Git；
- DSH 重启和 Relay 重连。

## 13. 技术验证计划

### POC-0：冻结基线

- 固定 `dsh-v0.1.0-rc.7@99f6f02`；
- 创建独立 `personal-workbench` Profile；
- 使用独立 DSH Home，避免污染日常配置；
- 记录 Windows 与 Linux 安装过程、启动命令和资源占用。

### POC-1：外部插件与 UI

- 建最小 Host Service，提供 `ctx.relay`；
- 建最小 Client Plugin，在 UI 中增加 Relay 面板；
- 通过 Bundle 安装到 Profile；
- 验证卸载、重载和升级后资源能够清理；
- 验证不修改 DSH 上游仓库即可工作。

### POC-2：只读 Relay Bridge

- 读取 contracts、run list、status、ResolvedPlan、Attention；
- 渲染一条 fake run 和一条历史真实 run；
- DSH 重启后重新连接并恢复相同展示；
- Relay CLI 独立运行不受插件影响。

### POC-3：窄控制与 Agent Provider

- 支持 validate、start、resume、stop；
- 使用 DSH Native Agent 完成一条 `basic-agent-task`；
- 使用 DSH Codex 或 Claude Provider 完成一条 fresh read-only review；
- 使用 Herdr 完成一条可交互节点；
- 三种 Provider 的 Result 统一进入 Relay 协议。

### POC-4：DevHarness 实战

- 使用 `dev-harness/task-standard` 跑一张标准档任务；
- E11 在 DSH UI 展示 releasePacket 和 effect；
- Relay 保存 approval receipt；
- E12/E13 只执行授权 effect；
- DSH 重启、插件重载和浏览器刷新均不改变 Run 真相；
- Windows 与 Linux 各跑一条代表性路径。

### POC-5：架构决策

根据证据选择：

```text
A. DSH 工作台 + Go Relay Runtime
B. DSH 原生 TypeScript Relay Service
C. 结束 DSH 路线，恢复 agent-console + 独立 Relay
```

## 14. 验收命题

### 14.1 插件与工作台

| ID | 验收命题 |
|---|---|
| W1 | Relay Bundle 可以通过 DSH Profile 安装、启用、禁用和卸载，不修改上游 DSH 源码 |
| W2 | Host 与 Client 插件均可在树外仓库构建和安装 |
| W3 | DSH UI 能展示项目、Run 图、Attention、证据和 Action 状态 |
| W4 | DSH 版本升级产生的改动集中在兼容层，Relay 协议与 Run Store 不变化 |
| W5 | 禁用 Relay Bundle 后，独立 Relay CLI 仍能读取和恢复同一 Run |

### 14.2 持久性与权威

| ID | 验收命题 |
|---|---|
| R1 | DSH Web 进程退出后，已接受 Run 继续存在或可由 Relay Runtime 确定性恢复 |
| R2 | DSH 重启后从 Relay Store 重建 RunState，不依赖旧浏览器内存 |
| R3 | DSH Job、Terminal 或 Session 状态不能直接把 Relay 节点或 DevHarness 任务改为完成 |
| R4 | Relay 与业务仓事实冲突时进入 Attention，不自动覆盖 DevPlan、review 或 Git |
| R5 | DSH 插件卸载不会取消已接受 Run，除非用户提交明确 control request |

### 14.3 编排与授权

| ID | 验收命题 |
|---|---|
| A1 | DSH 模型不能提交任意 workflow script 代替已发布 Workflow Contract |
| A2 | Planner 只能选择 Contract、参数、optional、assignment override 和合法 hook |
| A3 | E11 approval receipt 绑定 releasePacket hash、allowed effects 和 excluded effects |
| A4 | DSH 内置一次性 approval 不能绕过 Relay 的持久授权协议 |
| A5 | 动态 Cordis 包不能注册为 Relay Core、Gate Adapter 或 Finalizer |

### 14.4 Agent 与跨平台

| ID | 验收命题 |
|---|---|
| P1 | DSH Native Agent、DSH One-shot Subagent、Herdr Agent 和 Process 节点均可映射为统一 Result |
| P2 | 需要人工交互或续接的节点不会被错误路由到 one-shot Codex/Claude Provider |
| P3 | Windows 与 Linux 均能安装 Profile、显示 UI、连接 Relay Runtime 和执行基础任务 |
| P4 | 子进程、PTY、Herdr 和 Relay Runtime 在取消与退出后有可证明的清理结果 |

## 15. 停止条件

命中以下任一情况时，停止大规模迁移，只保留实验插件：

- 外部 Client Plugin 必须长期 fork DSH 才能工作；
- 连续 RC 升级反复改变核心 UI 或 Service 合同，兼容层无法收束；
- DSH 重启会不可控地终止或污染 Relay Run；
- Windows 或 Linux 任一主平台无法稳定运行；
- E11/E12 授权无法保持 Relay 独立真相；
- 外部 Agent 交互能力不足，且 Herdr 无法通过插件方式共存；
- 插件安装和更新的供应链风险无法接受；
- 个人工作台体验未明显优于独立 agent-console。

## 16. 对现有项目的影响

### dh-relay

- 04 中的 Workflow Contract、Gate Adapter、受控图、Outbox、Herdr 和三类真相继续有效；
- Go 语言结论转为 Pilot 后决策；
- 下一步应先做 DSH 技术验证，不直接启动完整运行时重写；
- Relay 对外 JSON 协议的重要性提高。

### DevHarness

- 继续作为独立方法论与领域规则源；
- 增加 DSH Bundle 时只提供 Contract、Gate、展示元数据和命令接线；
- DevPlan、workspace、review、verify 仍留业务仓；
- 不把 DevHarness 全文复制进 DSH 插件。

### agent-console

- 保留仓库和现有设计；
- Pilot 期间暂停建设与 DSH 重复的工作台能力；
- DSH 验证通过后，再决定缩成启动器、WebView 壳或停止开发。

### Herdr

- 继续作为外部交互式 Agent 宿主；
- DSH 自有 Agent 和 one-shot Provider 可以分担部分节点；
- 是否退出主路径由实测决定。

## 17. 最终建议

这条路线值得试，且可能明显改变三个项目的边界：

```text
DeepSeek Harness
  承担个人工作台与插件平台

dh-relay
  承担持久、受控、可恢复的工作流服务

DevHarness
  承担开发领域 Workflow Contract 与 Gate

业务仓
  承担代码、计划、工件和验收真相

Herdr
  承担外部交互式 Agent 运行与状态观测
```

第一阶段应当验证 DSH 能否成为稳定的外壳和 UI 平台。验证通过后，再决定 Relay Core 留在独立 Go Runtime，或迁入原生 TypeScript Cordis Service。

当前最重要的保护原则是：

> **DSH 可以替换工作台外壳，不能在验证前接管 Relay 的持久运行真相和 DevHarness 的领域真相。**

## 18. 官方资料基线

以下资料均固定到本次研究提交 `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`：

- [DeepSeek Harness README](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/README.zh.md)
- [架构与插件树](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/docs/architecture.zh.md)
- [第一个插件](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/docs/user/develop/basic/index.zh.md)
- [打包、Profile 与安装](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/docs/user/develop/basic/publish.zh.md)
- [包与能力总览](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/README.zh.md)
- [动态 Workflow seam](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/workflow/workflow/README.zh.md)
- [Subagent 总览](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/subagent/README.zh.md)
- [Codex Provider](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/subagent/subagent-codex/README.zh.md)
- [Claude Code Provider](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/subagent/subagent-claude-code/README.zh.md)
- [持久 PTY](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/terminal/terminal/README.zh.md)
- [审批](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/interaction/user-approval/README.zh.md)
- [用户问答](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/interaction/user-questions/README.zh.md)
- [Storage](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/storage/README.zh.md)
- [Web Client 与 UI 插件](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/README.zh.md)
- [进程外 SDK](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/sdk/README.zh.md)
