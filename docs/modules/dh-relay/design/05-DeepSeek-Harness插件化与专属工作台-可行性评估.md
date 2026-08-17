<!-- dh:v1 -->
# DeepSeek Harness 插件化与专属工作台：可行性评估与验证方案

> 状态：探索性技术评估，待用户确认。本文没有进入 `design/README.md` 的 `designInputs[]` 白名单，不授权 B 拆计划或 D 开工。
>
> 研究日期：2026-08-17
>
> 本次增补：2026-08-17。补充方案 C 的完整运行边界、DSH Profile 与 Relay Executor Profile 的区分、多账号 Herdr 执行配置、接力计划与文档落点、重编排 Agent、诊断 Agent，以及 DSH 下的施工节点路由建议。
>
> 研究基线：DeepSeek 官方仓库 `deepseek-ai/deepseek-harness`，标签 `dsh-v0.1.0-rc.7`，提交 `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`。
>
> 关联方案：[04-跨平台运行时与可扩展编排](./04-跨平台运行时与可扩展编排-技术方案评估与决策.md)、[02-P2 完整流水产品设计](./02-完整流水-产品设计与验收.md)、[P2 完整流水开发方案](../dev_plan/P2-完整流水-开发方案.md)。本文提出一条新的上层平台路线，暂不推翻 04 中的 Workflow Contract、受控图、Gate Adapter、Herdr、Outbox 和领域真相分层。

## 1. 评估问题

本次要判断五个问题：

1. dh-relay 能否作为 DeepSeek Harness 插件运行。
2. DeepSeek Harness 能否承接 agent-console 原本计划承担的薄壳与个人工作台角色。
3. 一旦采用 DeepSeek Harness，dh-relay 是否还需要独立的 Go Core，或者应改为原生 TypeScript 插件。
4. 接入 DSH 后，接力计划、运行现场、Git 留档和 DevHarness 工件分别落在哪里。
5. 现有 P2 中的接力计划生成 Agent、重编排 Agent、诊断 Agent和多账号执行 Profile 如何映射到新架构。

## 2. 结论

### 2.1 总体判断

这个方向值得进入技术验证，战略匹配度较高。

DeepSeek Harness 已经具备插件服务、Profile、组合包、Web UI、UI Slot、工作区、会话、模型路由、工具、后台任务、持久终端、Subagent、审批、用户问答、存储和进程管理等基础能力。它能够承担个人工作台的通用外壳，减少 agent-console 从零建设平台能力的工作量。

同时，dh-relay 不能直接改写成 DeepSeek Harness 当前的动态工作流脚本。官方 `ctx.workflowEngine` 面向模型编写的临时编排，当前缺少检查点、进程重启恢复、保存工作流、后台脱离运行和运行服务级追踪。这些缺口正好位于 dh-relay 的核心价值区。

推荐路线是：

> **先把 dh-relay 作为 DeepSeek Harness 中的持久工作流服务接入，把 DeepSeek Harness 用作个人工作台外壳；Relay Runtime 在验证期继续保持独立。**

产品体验上，用户会在 DeepSeek Harness 中看到和操作 dh-relay。工程实现上，首轮采用插件桥接独立 Relay Runtime，避免立即把运行核心重写进一个仍处于开发者预览期的平台。

### 2.2 当前明确支持的判断

- 支持将 dh-relay 做成 DSH Profile 中的可安装组合包。
- 支持在 DSH 中提供 `ctx.relay` 服务、Relay 命令、模型工具和工作流状态事件。
- 支持增加 Relay Run 列表、流程图、Attention、证据、审批和项目导航界面。
- 支持复用 DSH 的工作区、聊天、模型配置、设置、会话、权限和插件管理能力。
- 支持把 DevHarness 作为 Relay Workflow Contract 与 Gate Bundle 接入。
- 支持继续保留 Herdr，承载需要交互、续接和状态感知的外部 Agent。
- 支持将 `codex`、`codex-ninth`、`claude`、`claude-grok`、`claude5` 等本机入口登记为独立 Relay Executor Profile。
- 支持继续使用业务仓 `.dh-relay/<run_id>/` 保存运行真相，并用 `docs/relay/` 保存 Git 留档。
- 支持 P2 已设计的接力计划生成 Agent、重编排 Agent和诊断 Agent。
- 支持在验证成功后冻结 agent-console 的独立平台建设，并将其缩为启动器、托盘壳、WebView 壳或停止继续开发。

### 2.3 当前不建议的判断

- 不建议把 `dev-harness/task-standard` 直接改写成模型自由生成的 DSH workflow script。
- 不建议立即删除 dh-relay 独立运行能力。
- 不建议立即把 Go 方案全部换成 TypeScript 实现。
- 不建议让模型通过 DSH 动态包机制生成或替换 Relay Core。
- 不建议让 DSH 内置审批记录直接承担 DevHarness E11 的最终授权真相。
- 不建议把 DSH Session、Job、Terminal 或浏览器状态当作 Relay Run 的唯一状态来源。
- 不建议把具体 CLI 命令、配置目录、账号参数和凭据写入 ResolvedPlan。
- 不建议现在删除 agent-console 仓库。

### 2.4 当前架构裁决

第一阶段按方案 C 验证：

```text
DSH Personal Workbench
  + Relay Bridge Plugin
  + Detached Relay Runtime
  + DevHarness Workflow Contract / Gate
  + Herdr / DSH Agent / Process Executors
```

验证完成后再选择：

```text
A. DSH 工作台 + 独立 Go Relay Runtime
B. DSH 工作台 + 原生 TypeScript Relay Service
C. 停止 DSH 路线，恢复 agent-console + 独立 Relay
```

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
| 模型路由 | 管理 DeepSeek、OpenAI、Anthropic 与自定义网关 | 为 DSH Native Agent 节点选择模型 |
| Subagent seam | 多提供方委托 | 可用于短时、无交互节点和 fresh review |
| Jobs | 后台任务展示与取消 | 展示插件调用和短时子任务 |
| Subprocess | 受管进程树 | 启动 Relay Runtime 或辅助工具 |
| Terminal | 持久 PTY | 可承载进程内短期交互终端 |
| Interaction | 审批、问题、权限 | 提供 Attention 和确认界面基础 |
| Storage | JSON、SQLite、领域记录 | 保存插件配置和可重建读模型 |
| UI Slots | 插入自定义 React UI | 实现 Run 图、Attention 和证据面板 |
| Commands 与 Tools | 无模型命令与模型工具 | 暴露 relay start/status/resume 等窄能力 |
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

DSH Jobs 是进程内后台任务注册表。Terminal 提供按 Agent 所有者隔离的持久 PTY，但 Harness 重启后不会恢复。

因此，DSH 重启后的持续运行、跨天恢复、attempt、receipt、checkpoint、迟到结果隔离和唯一写者仍需 Relay Runtime 负责。

### 4.3 内置外部 Agent 提供方适合窄任务

DSH 已经提供 Codex、Claude Code、ACP 和 DSH SDK 等 Subagent Provider，这是很有价值的能力。

当前 Codex 与 Claude Code 提供方具有共同限制：

- 每次请求创建全新的进程与临时会话；
- 主要向父级返回最终文本；
- 不提供产品会话续接、恢复和完整进度流；
- 不提供人工审批或用户问答路径；
- 宿主 CLI 安装、账号状态和兼容性仍由机器环境负责。

它们适合 fresh review、只读审计、一次性研究和边界清晰的短任务。需要用户确认、长时施工、续接和可见终端状态的节点，首轮继续使用 Herdr 更稳妥。

### 4.4 DSH Approval 不能直接承担 DevHarness E11

DSH 的 `ctx.approval` 是活跃 Agent 轮次内的一次性审批，结果为允许一次、拒绝、取消或不可用。当前没有持久的轮次外授权、授权存储、撤销或复杂 effect 列表合同。

DevHarness E11 需要冻结 `releasePacket hash + allowed_effects + excluded_effects`，并允许 E12/E13 在用户确认后连续执行精确本地收口。这个授权仍应由 Relay 自己的 approval request/receipt 协议持有。

DSH 可以提供展示和回答界面，Relay Store 保存最终授权回执。

### 4.5 动态包机制不适合承重核心

DSH 支持模型在运行时定义和运行动态 Cordis 包。Host 半运行在 `node:vm` 中，该 VM 不构成安全边界，定义只保存在内存中，重启后不会恢复。带浏览器半的动态包在没有页面连接时还可能持续挂起。

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
        +-> Herdr / DSH Agent / Process
        +-> Run Store / Replay / Outbox
```

方案 C 包含四个清晰平面：

1. **工作台平面**：DSH Workspace、Chat、Models、Settings、Relay UI。
2. **桥接平面**：Cordis Host/Client 插件、`ctx.relay`、Remote API、IPC 和兼容层。
3. **运行平面**：Detached Relay Runtime、ResolvedPlan、状态机、持久化、恢复、授权与执行适配器。
4. **领域平面**：DevHarness Contract、Gate、业务仓 Git、DevPlan、workspace、review 和 verify。

优点：

- DSH 提供工作台、模型、会话、工具和 UI；
- Relay 保留持久恢复和独立运行能力；
- DSH 升级或退出时，业务仓运行真相不受影响；
- 可以先桥接现有实现，再决定 Go 或 TypeScript；
- agent-console 和 DSH 可在过渡期同时读取相同 Relay 协议；
- Herdr 和本机多账号 CLI 继续使用原有产品配置；
- DSH 浏览器刷新、插件卸载或 Web 进程重启不会取消已接受的 Run。

成本：

- 同时维护 Node 与 Relay Runtime；
- 需要 IPC、版本协商和重连；
- DSH 原生服务与 Relay Adapter 之间多一层映射；
- DSH Host/Client 插件和外部 Runtime 需要独立兼容测试。

结论：**推荐作为第一阶段和默认目标。**

#### 方案 C 的一次完整运行

```text
1. 用户在 DSH 选择业务仓、任务卡和 Workflow Contract
2. 用户配置节点 Executor Profile、Optional Node 和 Hook
3. DSH Bridge 提交 authorization request
4. Relay 校验 DevPlan、Git、Contract、Profile 与 effect
5. DSH 展示精确卡清单、执行图、账号别名和外部效果
6. 用户确认
7. Relay 原子生成 authority snapshot 与 ResolvedPlan
8. Relay 持久化 Run 后开始调度
9. DSH 订阅事件并展示流程图
10. Relay 按节点路由到 Herdr、DSH Agent 或 Process
11. blocked、Gate 失败或状态冲突形成持久 Attention
12. 用户可在 DSH 中稍后回答
13. Relay 保存 receipt 后继续
14. DSH 关闭或重启时 Run 保持
15. DSH 重连后从 Relay Store 重建界面
16. E11 通过后，E12/E13 由 Relay 控制的精确脚本执行
17. Run 终态后归档到业务仓 docs/relay
```

#### 方案 C 的故障边界

| 故障 | 处理方式 |
|---|---|
| 浏览器刷新 | Client Plugin 重新订阅并重建 |
| DSH Web 重启 | Relay Run 保持，Bridge 重连 |
| Relay Bridge 卸载 | 只断开客户端，不取消 Run |
| Relay Runtime 崩溃 | 从事件账和快照确定性恢复 |
| Herdr 或 Agent 进程消失 | 当前 attempt 进入中断或失败状态 |
| 模型默认值变化 | 已冻结节点继续使用 ResolvedPlan 中的 Profile |
| DevHarness 更新 | 旧 Run 固定旧 Contract，新 Run 重新验证 |
| DSH RC 升级 | 改动集中在 Bridge 兼容层 |

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

DSH UI 可以展示和操作 Relay，不能把 DSH Session、Job 或 Terminal 状态提升为 DevHarness 任务完成事实。

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

模型工具只公开允许模型使用的子集。E11 approval、E12 finalizer 和高权限 effect 不通过普通模型工具直接开放。

### 6.4 两种 Profile 必须区分

DSH 与 Relay 都使用 Profile 一词，职责不同：

| 名称 | 作用域 | 例子 |
|---|---|---|
| DSH Profile | 装配整个工作台的插件树 | `personal-workbench` |
| Relay Executor Profile | 决定某个节点由哪个产品、账号、后端和能力运行 | `herdr.codex.ninth` |

DSH Profile 决定工作台有哪些页面、服务和插件。Relay Executor Profile 决定某个节点具体怎样启动 Codex、Claude Code、DSH Agent 或脚本。

### 6.5 本机多账号 Executor Profile

当前已知本机入口包括：

```text
codex
codex-ninth
claude
claude-grok
claude5
```

建议形成独立 ID：

```yaml
executor_profiles:
  herdr.codex.default:
    backend: herdr
    product: codex
    command_alias: codex
    account_alias: codex
    capabilities:
      coding: true
      interactive: true
      continuable: true
      user_input: true

  herdr.codex.ninth:
    backend: herdr
    product: codex
    command_alias: codex-ninth
    account_alias: codex-ninth
    capabilities:
      coding: true
      interactive: true
      continuable: true
      user_input: true

  herdr.claude.default:
    backend: herdr
    product: claude-code
    command_alias: claude
    account_alias: claude
    capabilities:
      coding: true
      interactive: true
      continuable: true
      user_input: true

  herdr.claude.grok:
    backend: herdr
    product: claude-code
    command_alias: claude-grok
    account_alias: claude-grok
    capabilities:
      coding: true
      interactive: true
      continuable: true
      user_input: true

  herdr.claude.minimax:
    backend: herdr
    product: claude-code
    command_alias: claude5
    account_alias: claude5
    capabilities:
      coding: true
      interactive: true
      continuable: true
      user_input: true
```

这份示例只冻结逻辑身份，不宣称已经掌握本机真实配置。实际命令、配置目录、环境变量、身份探测、Herdr 创建参数、账号指纹和 quota 样本，需要由后续本机审计补齐。

计划和工件只引用 `executor_profile_id`。以下内容不得进入 ResolvedPlan 和 Git 留档：

```text
完整凭据
完整配置目录
任意 CLI 参数拼接
未经脱敏的环境变量
账号 Token
```

Launch Receipt 建议冻结：

```text
executor_profile_id
executor_kind
product
account_alias
config_fingerprint
capability_hash
host_ref
```

### 6.6 工作流角色默认值

DSH 工作台可以维护新 Run 的默认建议：

```yaml
workflow_defaults:
  dev-harness/task-standard:
    build: herdr.claude.default
    build_fallback:
      - herdr.codex.default
      - herdr.codex.ninth

    batch_review: dsh.review.codex-one-shot
    review_2: dsh.review.claude-one-shot
    replanner: dsh.replanner.strong
    diagnoser: dsh.diagnoser.readonly
```

这些是启动草稿。Run 建立后，ResolvedPlan 冻结实际选择。工作台默认值随后变化，只影响新 Run 和尚未签发 Receipt 的新节点。

## 7. IPC 与进程生命周期

### 7.1 验证期

首个 PoC 可以通过 DSH Subprocess 调用现有 Relay CLI，先实现只读命令：

```text
relay contracts --json
relay profiles --json
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

### 7.3 运行所有权

- DSH Bridge 拥有连接，不拥有 Run。
- Relay Runtime 拥有 Run、lease、attempt 和恢复。
- Runtime Adapter 拥有已发布的 Agent 或进程句柄。
- DSH 插件 dispose 只释放订阅和连接。
- 用户显式 `stop` 或 `cancel` 才能改变 Run 状态。

## 8. Agent 执行策略

### 8.1 DSH Native Agent

适合：

- 基础 Agent Task；
- 研究、总结、规划；
- 接力计划实例化；
- 重编排 Proposal；
- 复核汇总；
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
- 跨步骤可见和可重连的终端现场；
- 使用本机已有的 Codex、Claude Code 多账号入口。

采用 DSH 后，Herdr 的范围可能逐步缩小。是否完全移除，需要等 DSH 外部 Agent Provider 支持续接、进度、人工交互和稳定状态后重新评估。

### 8.4 Codex API 模型与 Codex 产品需要分开

通过反代 API 把 Codex 模型接入 DSH 后，实际运行的是：

```text
DSH Agent Loop
  + DSH 文件、Shell、LSP、Terminal 和权限工具
  + Codex 模型 API
```

这可以承担普通开发、规划、文档和可控编码。Codex CLI 自身的 app-server、线程、原生工具协议和产品交互不会随模型 API 自动进入 DSH。

实际 Codex 或 Claude Code 产品由 Herdr 或 DSH 官方 Subagent Provider 启动：

```text
Codex CLI / app-server
Claude Code / Claude Agent SDK
```

当前建议同时保留两条路线。

### 8.5 DevHarness 节点路由建议

| DevHarness 节点 | 首选方式 | 说明 |
|---|---|---|
| S0 建工作区 | Process | 确定性 Git 与文件操作 |
| S1 brief | DSH Native Agent | 理解任务和生成工件 |
| S2 task plan | DSH Native 强模型 | 高判断节点 |
| S3 长时间施工 | Herdr + Codex/Claude Code | 原生编码体验、可交互、可续接 |
| S3 小型施工 | DSH Native + Codex API | 范围清楚时可减少外部宿主切换 |
| 批次小审 | DSH One-shot Codex/Claude | Fresh Context |
| E0 机器体检 | Process | 测试、lint、dh-check |
| E1 DevHarness Gate | Gate Adapter | 领域机器规则 |
| E2 第二轮代码复核 | DSH One-shot Codex/Claude | 独立新会话 |
| E3 复核收敛 | DSH Native 强模型 | 汇总多路结果 |
| E4 需求复核 | DSH Native 或 One-shot | 读工件，可并行 |
| E5 教训复核 | DSH Native | 读取知识库 |
| E6 Miner | DSH Native 低成本模型 | 机械归纳为主 |
| E7 As-built | DSH Native | 读取实现和工件 |
| E8 证据挂接 | DSH Native + Gate | AI 填写，机器复验 |
| E9 交付汇报 | DSH UI + Action | 工作台展示 |
| E10 证据展示 | DSH UI | 用户直接查看 |
| E11 用户确认 | DSH UI + Relay Receipt | DSH 收集回答，Relay 持久授权 |
| E12 精确合入 | Privileged Process | 确定性执行 |
| E13 销户清理 | Finalizer Process | 确定性执行 |

### 8.6 未来的可继续 DSH Provider

DSH 的通用 Subagent seam 已有 continuable 机制，当前官方 Codex 与 Claude Code Provider 仍是 one-shot。未来可以开发：

```text
@personal/dsh-subagent-codex-continuable
@personal/dsh-subagent-claude-continuable
```

需要补齐产品会话持久化、续接、进度事件、Approval 桥接、AskUserQuestion 桥接、冷恢复、版本检测、Relay checkpoint 和进程清理。该工作放在 DSH Pilot 通过后评估。

## 9. DevHarness 的接入

04 文档中的 Workflow Contract 方案继续成立：

```text
DevHarness Skill 与节点图
        -> dev-harness/task-standard@N
        -> ResolvedPlan
        -> Relay Runtime
```

DSH 承担工作台、交互与部分执行提供方。DevHarness 的以下规则继续由 Contract 和 Gate Adapter 持有：

- S0~S3 与 E0~E13；
- 两轮独立复核；
- 需求复核与教训复核；
- releasePacket；
- H=0；
- 风险放行与不可豁免项；
- verify 与销户；
- 用户确认后的精确本地收口 effect。

受控图继续成立。DSH 的插件开放性不赋予 Planner 任意修改 DevHarness 主路径的权限。

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
- executor profile、账号别名和 fallback；
- attempt、checkpoint、result、gate 和证据；
- 重试、返工、暂停和恢复；
- 周报等外部 Action 状态。

#### Attention 与 Approval 页面

展示：

- Agent blocked；
- authority 失配；
- Gate 不通过；
- 诊断报告和允许的控制选项；
- 重编排前后图 Diff；
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

## 11. 接力计划、运行现场与文档落点

### 11.1 dh-relay 自身设计与开发计划

以下文件继续留在 dh-relay 仓库：

```text
docs/modules/dh-relay/design/02-完整流水-产品设计与验收.md
docs/modules/dh-relay/design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md
docs/modules/dh-relay/dev_plan/P2-完整流水-开发方案.md
```

它们描述 dh-relay 产品本身的目标、验收和建设计划。接入 DSH 不会把这些文件迁到 DSH Profile，也不会把它们改成 Cordis 配置。

05 经用户确认并进入正式设计输入后，P2 应做一次 A/B 调整，按新架构修订实施路径和验收。当前不直接改写 P2 任务表。

### 11.2 正在运行的接力计划

某个业务仓的一次真实 Run 继续落在：

```text
<repo>/.dh-relay/<run_id>/
```

这是 Relay v2 的运行真相根，不进 Git。旧路径：

```text
<repo>/.dh-runtime/relay/
```

继续只承担 legacy v1 的 discovery、status 和归档读取，不产生新写入，也不 resume。

DSH Home 不保存 Relay 计划的唯一副本。

### 11.3 建议的 Run 工件结构

```text
<repo>/.dh-relay/<run_id>/
  authority-snapshot.json

  plan/
    plan-proposal.json
    resolved-plan.json
    resolved-plan.md
    revisions/
      <revision_id>/
        proposal.json
        diff.json
        resolved-plan.json
        approval-request.json
        approval-receipt.json

  relay-state.json
  events.jsonl
  host-lease.json

  launches/
  attempts/
  requests/
  checkpoints/
  diagnostics/
  attentions/
  approvals/
  closeout/
  outbox/
  shots/
```

`resolved-plan.json` 是执行权威。`resolved-plan.md` 是面向人的可重建投影，便于仓外查看和归档，不能独立驱动执行。

现有 P2 已冻结的 events、state、launch、attempt、receipt、closeout journal、截图和 lease 语义继续保留。具体目录名需在正式 A/B 中统一冻结。

### 11.4 四类计划工件

#### Authority Snapshot

回答用户授权了什么：

- 哪些任务卡；
- 目标、验收和变更范围；
- DevPlan/design 的冻结来源；
- Workflow Contract；
- 可选 Executor Profile 集合；
- 允许和排除的 effect；
- 用户确认的证据指针。

只有 Relay Runtime 可以生成和锚定 Authority Snapshot。

#### Plan Proposal

由接力计划生成 Agent 或重编排 Agent提交。它可以填写卡片顺序、Profile、Optional Node、Hook 和合法参数，不能直接成为执行真相。

#### ResolvedPlan

Workflow Compiler 对 Proposal、Authority、Workflow Contract、Profile 能力和 effect 完成校验后生成。Relay Core 执行它，DSH Run 页面渲染它。

#### Plan Revision

每次重编排保留：

- 原计划 hash；
- 触发原因；
- Proposal；
- 节点和边 Diff；
- 影响面；
- 用户批准或拒绝；
- 生效后的新 ResolvedPlan。

根 `plan/resolved-plan.json` 指向或复制当前生效版本。

### 11.5 预运行授权请求

由于用户确认前还没有正式 Run，可以在仓级运行根下建立请求 Inbox：

```text
<repo>/.dh-relay/inbox/authorization/<request_id>.json
```

确认并建 Run 后，把请求固化到：

```text
<run>/requests/authorization-request.json
```

这是本评估新增的建议落点，正式实施前需要在 A/B 中冻结 schema、生命周期、清理和并发规则。

### 11.6 DSH Session 与 Relay Run 的关联

DSH 可以维护可删除、可重建的投影：

```text
dsh_session_id
canonical_repo
run_id
last_seen_event_seq
opened_node_id
```

用途包括恢复页面、记录当前打开节点和事件游标。这份投影丢失后，DSH 可以从 `~/.dh-relay/runs.json` 与业务仓 Run Store 重建。

节点宿主引用进入 Launch Receipt 或 HostObservation：

```json
{
  "executor_kind": "herdr",
  "executor_profile_id": "herdr.codex.ninth",
  "account_alias": "codex-ninth",
  "config_fingerprint": "sha256:...",
  "host_ref": {
    "session_id": "...",
    "pane_id": "..."
  }
}
```

DSH Native Agent 节点记录 DSH session id。Process 节点记录进程 receipt。DSH UI 通过统一字段展示，不直接解析各产品私有配置。

### 11.7 Run 结束后的 Git 留档

归档继续落在：

```text
<repo>/docs/relay/README.md
<repo>/docs/relay/runs/<run_id>/
```

建议包含：

```text
概览
最终 ResolvedPlan
实际执行时间线
每卡终态与 verify SHA
Executor Profile 与账号别名摘要
重编排记录
诊断记录
Attention 处理结果
Approval 摘要
Outbox Action 结果
Oracle 报告
精选证据和截图
archive-manifest
```

归档只记录脱敏信息：

```text
executor_profile_id
account_alias
config_fingerprint
executor_kind
```

不记录凭据值、完整配置目录、完整环境变量和未经筛选的终端转录。

### 11.8 四个存储位置的最终分工

```text
dh-relay 仓
  产品设计与开发计划

业务仓 .dh-relay
  正在运行的计划、事件和恢复现场

业务仓 docs/relay
  已完成 Run 的 Git 留档

DSH Home
  工作台插件配置、会话和可重建投影
```

## 12. 重编排 Agent 与诊断 Agent

### 12.1 重编排 Agent 继续支持

P2 已定义重编排 Agent：当某节点出现 `dependency_blocked` 时，一次性 Agent 判断缺失前置并提交 v2 Proposal。当前 P2 的边界继续保留：

- 只允许在当前卡内部增加前置棒；
- 不增加任务卡；
- 不修改其他卡；
- 不删除 DevHarness 硬节点；
- 不改变 Authority 中的目标、验收和 effect；
- 不直接写 active state；
- 不受影响的卡继续，依赖闭包按规则冻结。

DSH 下的运行方式：

```text
Relay 发现 dependency_blocked
  -> 创建 replan request
  -> 按 replanner_executor_profile_id 启动一次性 Agent
  -> Agent 只读 Authority、Contract、当前计划和现场
  -> 写 replan proposal
  -> Workflow Compiler 校验
  -> DSH 展示图 Diff 与影响面
  -> 用户批准或拒绝
  -> Relay 保存 receipt 并切换计划 revision
```

首选执行器可以是 DSH Native 强模型，因为该任务以结构化依赖推理和 Proposal 生成为主。Herdr + Codex/Claude 可作为 fallback。

重编排 Agent 只获得窄写入口：

```text
relay_submit_replan_proposal
```

它不能修改 `resolved-plan.json`、`relay-state.json`、Authority、DevPlan 或任意 CLI 配置。

### 12.2 诊断 Agent 继续支持

P2 已定义诊断 Agent：

- 一次性；
- 强制只读；
- 读取运行现场；
- 输出诊断事实；
- 提供预定义选项；
- 可以代表用户提交受限控制 candidate；
- 不能写代码、active state 或任意控制动作。

触发条件继续包括：

```text
interrupted_unknown
paused
closeout_blocked
quota 无可用 fallback
恢复时发现断棒
```

### 12.3 诊断计算与用户决策分离

DSH 方案建议把诊断拆成两段：

```text
第一段：诊断 Agent 读取现场，生成报告和合法选项，然后退出
第二段：Relay 持久化 Attention，DSH 展示，用户稍后选择
```

建议工件：

```text
<run>/diagnostics/<diagnosis_id>/
  report.json
  option-set.json
  evidence-refs.json

<run>/attentions/<attention_id>.json
<run>/requests/control/<request_id>.json
<run>/approvals/control/<receipt_id>.json
```

这样浏览器关闭、DSH 重启或用户隔天回来后，诊断问题仍然存在，诊断 Agent无需长期占据一个终端等待回答。

### 12.4 控制选项仍由 Relay 校验

一个选项需要冻结：

```text
option_id
action
params
target
expected_state_hash
nonce
expires_at
```

例如：

```json
{
  "option_id": "retry-with-profile",
  "action": "retry_with_profile",
  "params": {
    "executor_profile_id": "herdr.codex.ninth"
  },
  "target": {
    "run_id": "...",
    "card_id": "...",
    "node_id": "...",
    "attempt_id": "...",
    "launch_id": "...",
    "generation": 3
  },
  "expected_state_hash": "sha256:..."
}
```

Relay 检查选项来源、逐字段等值、Profile 能力、目标身份、状态 hash、nonce 和单次消费。DSH 只提供展示和提交入口。

### 12.5 为什么不直接依赖 DSH 普通问答

DSH `userQuestions` 和 Approval 都与活跃 Agent 轮次紧密绑定。Relay 的诊断可能发生在 Agent 已死亡、DSH 刚重启、用户隔天返回或没有活跃轮次的场景。

因此，重编排批准、诊断选择和 E11 继续使用 Relay 的持久 Attention/Approval 协议。DSH 提供 UI Provider，最终 receipt 落 Relay Store。

### 12.6 诊断 Profile

推荐顺序：

```text
首选：dsh.diagnoser.readonly
备选：Herdr + 能机器证明只读的 Codex/Claude Profile
```

日常施工 Profile 通常拥有写权限，不能直接用于 Diagnoser。后续本机审计需要逐个判断：

- 能否强制只读；
- 能否禁用通用 Shell 和 Git 写；
- 能否只开放 Relay 窄控制工具；
- 如何取得身份与配置指纹；
- 写入尝试能否被机器反例拦截。

无法证明只读的 Profile 不进入 Diagnoser allowlist。

## 13. Go 与 TypeScript 的技术决策

DeepSeek Harness 的出现会重新打开核心语言选择。

### 13.1 继续独立 Go Core

适合以下目标：

- DSH、agent-console 和 CLI 都能作为客户端；
- Relay Run 不随 UI 进程退出；
- Windows 与 Linux 交付单独二进制；
- 长期保持平台中立；
- 通过稳定 RPC 隔离 DSH RC 变化。

### 13.2 改为原生 TypeScript 插件

适合以下条件：

- DSH 已成为确定的唯一工作台；
- Cordis Service 与 UI API 趋于稳定；
- 原生接入 Agent、Subagent、Storage、Subprocess 和 Interaction 的收益明显高于双运行时成本；
- DSH 重启后的恢复语义经过验证；
- Windows 与 Linux 的真实任务均稳定运行。

### 13.3 当前裁决

在 DSH Pilot 完成前，暂停把 Go 当作不可逆的最终承诺。继续设计平台无关的 Relay 协议、Run Store、ResolvedPlan、Workflow Contract 和 Gate Contract。

Pilot 后按证据二选一：

- DSH 适配稳定，原生能力收益显著：评估 TypeScript Relay Service；
- DSH 变化快或独立运行价值明显：继续 Go sidecar。

无论最终选择哪种语言，DSH UI 与业务仓之间都只依赖 Relay 稳定协议。

## 14. 风险

### 14.1 上游兼容风险

当前只有 RC 标签，官方明确预告破坏性变更。需要：

- 固定 tag 和 commit；
- 为 DSH import 建立单一兼容层；
- Profile 单独使用 `$DSH_HOME`；
- 插件包锁定依赖；
- 每次升级先在测试 Profile 验证；
- Relay 数据格式不依赖 DSH 内部事件类型。

### 14.2 插件供应链风险

从 Git 安装 TypeScript 插件时可能执行 `prepare`，且安装构建脚本位于 Agent 沙箱之外。个人插件应优先使用：

- 本地可信 checkout；
- 固定 commit；
- 预构建 tarball；
- 受控私有 npm 包。

不允许模型自动安装未知插件或给未知 Git 包授权构建。

### 14.3 单进程与插件卸载风险

Cordis 会在依赖服务消失时 dispose 消费插件。Relay Bridge 必须把插件断开和 Run 取消分开。已经接受的 Run 由独立 Runtime 继续持有。

### 14.4 UI 扩展成本

外部 UI Bundle 已有公开示例，但 DSH Host/Client 分离、Remote API、类型生成和 Slot 组合仍有学习成本。PoC 必须提前验证完整的外部 Client Plugin 链路，避免只验证 Host 插件后误判工作台可行性。

### 14.5 Windows 与 Linux 成熟度

仓库已有 Windows 专项代码和检查，产品仍处于快速迭代期。必须分别验证：

- 安装与升级；
- Web UI；
- 子进程树清理；
- Named Pipe 或 Unix Socket；
- 工作区路径；
- Codex、Claude、Herdr 与 Git；
- DSH 重启和 Relay 重连。

### 14.6 本机多账号复杂度

本机多个 Codex、Claude Code 和代理入口可能通过别名、配置目录、环境变量、包装脚本或不同账号态实现。错误抽象可能导致身份串用、quota 误判和 fallback 误切。

必须通过本机审计冻结：

- 每个入口的真实命令；
- 配置来源；
- 账号身份探测；
- 能力位；
- quota 样本；
- fallback 允许关系；
- 不含凭据的 config fingerprint。

## 15. 技术验证计划

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

- 读取 contracts、executor profiles、run list、status、ResolvedPlan、Attention；
- 渲染一条 fake run 和一条历史真实 run；
- DSH 重启后重新连接并恢复相同展示；
- 删除 DSH 投影后能够从 Relay Store 重建；
- Relay CLI 独立运行不受插件影响。

### POC-3：多账号 Profile 与窄控制

- 由本机审计补齐 `codex`、`codex-ninth`、`claude`、`claude-grok`、`claude5`；
- 验证 Profile ID、account alias、config fingerprint 和 capability hash；
- 支持 validate、start、resume、stop；
- 验证默认配置变化不会改变已冻结 Run；
- 验证 quota fallback 只在预登记 Profile 间发生。

### POC-4：Agent Provider

- 使用 DSH Native Agent 完成一条 `basic-agent-task`；
- 使用 DSH Codex 或 Claude Provider 完成一条 fresh read-only review；
- 使用 Herdr 完成一条可交互施工节点；
- 三种 Provider 的 Result 统一进入 Relay 协议；
- Herdr Pane 能从 DSH Run 页面打开或聚焦。

### POC-5：重编排与诊断

- 注入 `dependency_blocked`，生成 Proposal、图 Diff 和新 revision；
- 验证越权删硬节点、加卡、改 effect 的 Proposal 被拒；
- 注入 `interrupted_unknown`，生成持久 Attention 和 option set；
- DSH 重启后仍能回答诊断问题；
- 过期 state hash、重复 nonce 和换 Profile 参数被拒。

### POC-6：DevHarness 实战

- 使用 `dev-harness/task-standard` 跑一张标准档任务；
- S3 使用 Herdr + Codex 或 Claude Code；
- E11 在 DSH UI 展示 releasePacket 和 effect；
- Relay 保存 approval receipt；
- E12/E13 只执行授权 effect；
- DSH 重启、插件重载和浏览器刷新均不改变 Run 真相；
- Windows 与 Linux 各跑一条代表性路径。

### POC-7：架构决策

根据证据选择：

```text
A. DSH 工作台 + Go Relay Runtime
B. DSH 原生 TypeScript Relay Service
C. 结束 DSH 路线，恢复 agent-console + 独立 Relay
```

## 16. 验收命题

### 16.1 插件与工作台

| ID | 验收命题 |
|---|---|
| W1 | Relay Bundle 可以通过 DSH Profile 安装、启用、禁用和卸载，不修改上游 DSH 源码 |
| W2 | Host 与 Client 插件均可在树外仓库构建和安装 |
| W3 | DSH UI 能展示项目、Run 图、Attention、证据、Profile 和 Action 状态 |
| W4 | DSH 版本升级产生的改动集中在兼容层，Relay 协议与 Run Store 不变化 |
| W5 | 禁用 Relay Bundle 后，独立 Relay CLI 仍能读取和恢复同一 Run |
| W6 | DSH 投影被删除后，可以从 Relay Store 完整重建 Run 页面 |

### 16.2 持久性与文档落点

| ID | 验收命题 |
|---|---|
| R1 | DSH Web 进程退出后，已接受 Run 继续存在或可由 Relay Runtime 确定性恢复 |
| R2 | DSH 重启后从 Relay Store 重建 RunState，不依赖旧浏览器内存 |
| R3 | DSH Job、Terminal 或 Session 状态不能直接把 Relay 节点或 DevHarness 任务改为完成 |
| R4 | Relay 与业务仓事实冲突时进入 Attention，不自动覆盖 DevPlan、review 或 Git |
| R5 | DSH 插件卸载不会取消已接受 Run，除非用户提交明确 control request |
| R6 | v2 新 Run 只写 `.dh-relay/`，legacy `.dh-runtime/relay/` 保持只读 |
| R7 | `docs/relay/runs/<run_id>/` 能从 Run Store 和 Oracle 重建，且不依赖 DSH 私有会话数据 |
| R8 | `resolved-plan.json` 与其 Markdown 投影 hash 对应，执行只信 JSON 权威 |

### 16.3 Executor Profile

| ID | 验收命题 |
|---|---|
| X1 | `codex`、`codex-ninth`、`claude`、`claude-grok`、`claude5` 各有唯一 Profile ID 和脱敏身份指纹 |
| X2 | ResolvedPlan 只引用 Profile ID，不出现任意命令、配置目录和凭据值 |
| X3 | Launch Receipt 记录实际 Profile、账号别名、capability hash 和 config fingerprint |
| X4 | Profile 默认值变化不影响已经签发 Receipt 的节点 |
| X5 | Profile 能力不足时在 launch 前拒绝，不静默降级 |
| X6 | Diagnoser 只使用机器证明 readonly 的 Profile |

### 16.4 编排、重编排与授权

| ID | 验收命题 |
|---|---|
| A1 | DSH 模型不能提交任意 workflow script 代替已发布 Workflow Contract |
| A2 | Planner 只能选择 Contract、参数、optional、assignment override 和合法 hook |
| A3 | E11 approval receipt 绑定 releasePacket hash、allowed effects 和 excluded effects |
| A4 | DSH 内置一次性 approval 不能绕过 Relay 的持久授权协议 |
| A5 | 动态 Cordis 包不能注册为 Relay Core、Gate Adapter 或 Finalizer |
| A6 | Replanner 只能提交 Proposal，不能直接写 ResolvedPlan 和 active state |
| A7 | Replan revision 保存原 hash、Diff、影响面和批准 receipt |
| A8 | 当前 P2 下，重编排不能加卡、改其他卡或删除硬节点 |

### 16.5 诊断与 Attention

| ID | 验收命题 |
|---|---|
| D1 | Diagnoser 只读生成 report 和 option set 后退出 |
| D2 | Attention 在没有活动 DSH Agent 轮次时仍可持久存在和回答 |
| D3 | 控制请求必须与 option payload、target 和 expected state 逐字段一致 |
| D4 | 过期 state、重复 nonce、换 action、换 Profile 参数均拒绝 |
| D5 | DSH 重启后可以继续处理同一 Attention |
| D6 | Diagnoser 无法取得强制只读 Profile 时拒绝启动 |

### 16.6 Agent 与跨平台

| ID | 验收命题 |
|---|---|
| P1 | DSH Native Agent、DSH One-shot Subagent、Herdr Agent 和 Process 节点均可映射为统一 Result |
| P2 | 需要人工交互或续接的节点不会被错误路由到 one-shot Codex/Claude Provider |
| P3 | Windows 与 Linux 均能安装 Profile、显示 UI、连接 Relay Runtime 和执行基础任务 |
| P4 | 子进程、PTY、Herdr 和 Relay Runtime 在取消与退出后有可证明的清理结果 |
| P5 | Herdr 主力施工节点可以从 DSH 页面查看状态并打开对应 Pane |
| P6 | Codex API 模型节点和实际 Codex 产品节点在 Receipt 中使用不同 executor kind |

## 17. 停止条件

命中以下任一情况时，停止大规模迁移，只保留实验插件：

- 外部 Client Plugin 必须长期 fork DSH 才能工作；
- 连续 RC 升级反复改变核心 UI 或 Service 合同，兼容层无法收束；
- DSH 重启会不可控地终止或污染 Relay Run；
- Windows 或 Linux 任一主平台无法稳定运行；
- E11/E12 授权无法保持 Relay 独立真相；
- 外部 Agent 交互能力不足，且 Herdr 无法通过插件方式共存；
- 插件安装和更新的供应链风险无法接受；
- 多账号身份无法稳定探测，导致 Profile 隔离不可证明；
- 重编排与诊断必须绕过 Relay 持久协议才能工作；
- 个人工作台体验未明显优于独立 agent-console。

## 18. 对现有项目的影响

### dh-relay

- 04 中的 Workflow Contract、Gate Adapter、受控图、Outbox、Herdr 和三类真相继续有效；
- Go 语言结论转为 Pilot 后决策；
- 下一步应先做 DSH 技术验证，不直接启动完整运行时重写；
- Relay 对外 JSON 协议的重要性提高；
- P2 现有 `.dh-relay/` 与 `docs/relay/` 落点继续保留；
- 接力计划生成、重编排、诊断和 Executor Profile 需要按本文做 B-adjust。

### DevHarness

- 继续作为独立方法论与领域规则源；
- 增加 DSH Bundle 时只提供 Contract、Gate、展示元数据和命令接线；
- DevPlan、workspace、review、verify 仍留业务仓；
- 不把 DevHarness 全文复制进 DSH 插件；
- 重编排不能越过 Contract 的硬节点和授权边界。

### agent-console

- 保留仓库和现有设计；
- Pilot 期间暂停建设与 DSH 重复的工作台能力；
- DSH 验证通过后，再决定缩成启动器、WebView 壳或停止开发。

### Herdr

- 继续作为外部交互式 Agent 主宿主；
- DSH 自有 Agent 和 one-shot Provider 可以分担规划、复核和窄任务；
- 本机多账号 CLI 通过 Relay Executor Profile 统一登记；
- 是否退出主路径由实测决定。

### P2 正式设计与开发计划

当前 `design/02` 与 `dev_plan/P2` 保持原状态。05 经确认后，需要：

1. 将 05 加入正式 design inputs；
2. 对 design/02 做定向 A 调整，补 DSH 工作台、Profile、计划工件和 Attention 边界；
3. 对 P2 开发方案做 B-adjust，重排 DSH Pilot、Herdr Adapter、多账号 Profile、Replanner 与 Diagnoser 的任务卡；
4. 已收口的 DHR_04 继续作为迁移 Oracle，不作废重做。

## 19. 最终建议

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

施工主力建议继续使用：

```text
Herdr + Codex CLI
Herdr + Claude Code
```

DSH Native Agent 负责主对话、规划、计划实例化、重编排、诊断、汇总和部分小型编码。DSH One-shot Codex/Claude Provider 负责 fresh review 和窄任务。Relay Runtime 负责计划、持久化、恢复和授权。

第一阶段应验证 DSH 能否成为稳定的外壳和 UI 平台。验证通过后，再决定 Relay Core 留在独立 Go Runtime，或迁入原生 TypeScript Cordis Service。

当前最重要的保护原则是：

> **DSH 可以替换工作台外壳，不能在验证前接管 Relay 的持久运行真相和 DevHarness 的领域真相。**

## 20. 官方资料基线

以下资料均固定到本次研究提交 `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`：

- [DeepSeek Harness README](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/README.zh.md)
- [架构与插件树](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/docs/architecture.zh.md)
- [第一个插件](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/docs/user/develop/basic/index.zh.md)
- [打包、Profile 与安装](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/docs/user/develop/basic/publish.zh.md)
- [包与能力总览](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/README.zh.md)
- [动态 Workflow seam](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/workflow/workflow/README.zh.md)
- [Subagent 总览](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/subagent/README.zh.md)
- [Subagent Service 与 continuable](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/subagent/subagent/README.zh.md)
- [Codex Provider](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/subagent/subagent-codex/README.zh.md)
- [Claude Code Provider](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/subagent/subagent-claude-code/README.zh.md)
- [持久 PTY](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/terminal/terminal/README.zh.md)
- [审批](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/interaction/user-approval/README.zh.md)
- [用户问答](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/interaction/user-questions/README.zh.md)
- [Storage](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/storage/README.zh.md)
- [Web Client 与 UI 插件](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/README.zh.md)
- [进程外 SDK](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/sdk/README.zh.md)
