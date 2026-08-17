<!-- dh:v1 -->
# Pi Agent 替代 DeepSeek Harness：对比评估

> 状态：平行候选评估，未生效。本文不在 `design/README.md` 的 `designInputs[]` 白名单内，不改变 design/05 的 DSH 主线，不修改 P4~P9 阶段计划，也不授权任何任务卡开工。
>
> 评估日期：2026-08-18
>
> Pi 评估对象：`earendil-works/pi`，版本 `v0.84.2`，提交 `914cf1472e715297caa30db4b9535d534a9eb718`。
>
> DSH 对照基线：`deepseek-ai/deepseek-harness`，版本 `dsh-v0.1.0-rc.7`，提交 `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`。
>
> 当前产品主线：[design/05](../05-DeepSeek-Harness插件化与专属工作台-可行性评估.md)。本文回答一个新增问题：把 Personal Workbench 的 DSH 外壳改成 Pi Agent，整体方案会更好、相当或更差。

## 1. 评估结论

### 1.1 最终判断

当前不建议用 Pi Agent 直接替换 DSH 作为专属工作台主外壳。

Pi 更成熟的部分集中在 Agent 内核、Coding Agent TUI、会话树、SDK、RPC、模型接入和扩展 API。DSH 更符合当前缺口的部分集中在 Web 工作台、Workspace、设置、插件清单、Host/Client 插件、UI Slot、Approval、User Questions 和多功能页面装配。

用户已经确定复杂施工仍由：

```text
Relay -> Herdr -> Codex CLI / Claude Code
```

执行。此时工作台外壳的首要价值是跨项目展示、流程图、Attention、证据、审批、节点配置和本地应用联结。DSH 在这些方面有更接近成品的平台结构。Pi 的主要长处会与 Agent 执行平面重叠，对工作台外壳缺口的直接补足较少。

推荐定位：

```text
DSH
  继续作为 Personal Workbench 主外壳

Pi Agent
  作为 Relay 的可选 Native Agent Executor
  优先服务 planner、replanner、fresh review、轻量 coding
  diagnoser 仅在可证明的受限执行环境中启用

Herdr
  继续承载真实 Codex / Claude Code 的长时交互施工

Relay Runtime
  继续持有工作流、恢复、授权和运行真相
```

### 1.2 Pi 何时可能取代 DSH

满足下列前提时，Pi 可以成为主外壳候选：

1. 用户接受 TUI 作为主要工作台，Web 页面和完整图形化配置的优先级明显降低。
2. Relay Run 图、Attention、审批和项目切换可以在一个 Pi TUI 扩展中达到日常可用水平。
3. 多项目导航主要依靠命令、选择器和快捷键，无需浏览器式平台首页。
4. Pi 的无内置沙箱边界能够通过操作系统隔离、容器、微型虚拟机或自有工具白名单补齐。
5. 用户接受 Windows 上依赖 Git Bash、WSL、Cygwin 或 MSYS2 的 Bash 环境。

若仍坚持 Web 工作台、可视化节点、多个本地应用联结和后续平台化，Pi 需要搭配自建 Web 或桌面客户端。这会重新引入 agent-console 的大部分开发工作。

## 2. Pi Agent 当前形态

Pi 是一套 TypeScript Agent Harness，主要组成包括：

```text
pi-ai
  多提供方模型 API

pi-agent-core
  Agent loop、工具调用和状态管理

pi-coding-agent
  Coding Agent CLI、TUI、会话、扩展、SDK、RPC

pi-tui
  终端 UI 组件

pi-client / pi-server / pi-protocol
  实验中的远程会话客户端、服务端和 CBOR 协议

session-backends/sqlite-node
  SQLite 会话存储
```

`pi-coding-agent` 当前版本为 `0.84.2`，已经提供正式发布和 Windows、Linux、macOS 的构建产物。Coding Agent 支持 ChatGPT Plus/Pro Codex、Claude Pro/Max、GitHub Copilot、xAI 等订阅登录，也支持 DeepSeek、MiniMax、Kimi、OpenCode、Qwen、Xiaomi 等 API 路由。

Pi 会话以 JSONL 树保存，支持恢复、分支、fork、clone 和 compaction。SDK 可以在应用内创建 AgentSession，RPC 模式提供 JSONL stdin/stdout 协议，并支持 prompt、steer、follow-up、abort、会话切换、模型切换、工具事件和状态读取。

Pi 扩展可以：

- 注册模型工具；
- 拦截工具调用和生命周期事件；
- 注册命令、快捷键和参数；
- 持久化自定义会话条目；
- 注册 TUI Widget、Footer、Overlay 和自定义组件；
- 创建自定义模型 Provider；
- 覆盖文件、Shell 等内置工具；
- 通过 SDK 或 RPC 嵌入其他程序。

这些能力足以构建 Relay TUI、Relay 工具和 Pi Native Agent Executor。

## 3. Pi 与 DSH 的能力对照

| 维度 | Pi Agent | DeepSeek Harness | 对 dh-relay 的判断 |
|---|---|---|---|
| 核心定位 | Coding Agent、Agent SDK、TUI、RPC | 可组合 Agent Harness、Web 产品、插件平台 | 工作台外壳更偏 DSH |
| 当前版本成熟度 | 正式版本 `0.84.2`，发布节奏活跃 | `0.1.0-rc.7` 开发者预览 | Pi 的 Coding Agent 更成熟 |
| Web 工作台 | 官方核心未提供完整 Web Workbench | 已有 Web UI、Host/Client、Workspace、Settings | DSH 明显占优 |
| TUI | 完整、可扩展、自定义能力强 | 重点在 Web，另有外部 TUI 示例 | Pi 明显占优 |
| 插件模型 | Extension、Skill、Prompt、Theme、Pi Package | Cordis Plugin、Service、Bundle、Profile、UI Slot | 两者都强，DSH 更适合产品装配 |
| 自定义 UI | TUI Widget、Overlay、自定义组件 | React Client Plugin、UI Slot、远程 API | TUI 选 Pi，Web 选 DSH |
| SDK 嵌入 | AgentSession SDK 很完整 | 有进程外 SDK和 Cordis 服务 | Pi 的 Agent 嵌入更直接 |
| 进程协议 | Coding Agent RPC 已可用 | SDK JSON-RPC、ACP、Remote API | 两者均可接 Relay Adapter |
| 远程会话服务 | `pi-client/server/protocol` 已出现，但标记 Experimental | Web Host、Client 与 API 已组成产品 | 当前 DSH 更完整 |
| 会话持久化 | JSONL 树、恢复、fork、clone；另有 SQLite 后端 | Session 日志、查询、SQLite、continuable subagent | 两者都能持久会话 |
| 持久工作流 | 没有 Relay 级 ResolvedPlan、Attempt、Receipt、Outbox | 动态 Workflow 同样缺完整恢复 | 两者都不能替代 Relay Runtime |
| 外部 Codex/Claude 产品 | 可通过自定义扩展或进程调用，官方核心未提供同等产品 Provider 家族 | 已有 Codex、Claude Code、ACP Provider | DSH 当前接线更完整 |
| 多模型与订阅 | 覆盖广，Codex/Claude/Grok 登录成熟 | 可配置 DeepSeek、OpenAI、Anthropic、自定义网关 | Pi 略占优 |
| 权限与审批 | 项目信任存在；无内置沙箱，扩展拥有完整用户权限 | 有 Sandbox、Approval、Permission Preset、User Questions | DSH 更适合无人值守治理 |
| Windows | 有 Windows 构建；Coding Agent 要求 Bash | 有 Windows Profile、PowerShell 路径和 ACL Sandbox | 用户主机上 DSH 边界更贴合 |
| Linux | 原生 Bash 和发布包 | Node 运行，Linux 支持 | 两者都可用 |
| 多项目平台 | 需要自建选择器或客户端 | Workspace 和 Web 导航已存在 | DSH 占优 |
| 升级风险 | 核心版本较成熟；新 Server/Protocol 仍实验 | 整体仍是 RC，Client API 变化风险较高 | 风险分布不同 |

## 4. 关键差异

### 4.1 Pi 强在 Agent，DSH 强在工作台

Pi 的 SDK 和 Extension API 已经非常适合：

- 构建一个受控规划 Agent；
- 增加 Relay 工具；
- 监听 Agent 生命周期；
- 使用 TUI 显示当前 Run 状态；
- 通过 RPC 接入其他应用；
- 保存和恢复 Agent 会话；
- 快速更换模型与 Provider。

DSH 已经提供一套可继续扩展的产品外壳：

- Web UI；
- Workspace；
- 会话导航；
- 模型设置；
- 插件管理；
- Host 与 Client 分层；
- React UI Slot；
- Approval 和 User Questions；
- 后台 Jobs 和 Subagent 页面。

当前方案中，Relay 已负责流程，Herdr 已负责主要施工，最缺的恰好是工作台外壳。这个条件使 DSH 的优势更有价值。

### 4.2 Pi TUI 能做可视化，但产品形态不同

Pi Extension 可以实现：

```text
顶部 Run 摘要
节点状态 Widget
Attention Overlay
Profile 选择菜单
审批对话框
跳转 Herdr Pane 的命令
自定义 Footer 和快捷键
```

这可以形成高效率的终端工作台。它适合偏 CLI 的个人使用，并且开发面可能小于 DSH 的 Host/Client Web 插件。

它难以直接提供以下体验：

```text
多项目平台首页
大尺寸工作流图
多个 Run 并排观察
浏览器式证据页面
可视化节点编辑器
多个本地应用入口
长期运行的桌面通知中心
```

这些能力可以由 Pi SDK、RPC 或实验中的 Pi Server 构建自有客户端。此时需要自行开发客户端、传输、身份、项目管理和页面状态，项目会逐步接近 agent-console。

### 4.3 Pi Server 当前不能直接充当 Personal Workbench Server

Pi 已发布 `pi-client`、`pi-server` 和 `pi-protocol`：

- Client 与传输解耦；
- Protocol 使用长度前缀 CBOR；
- Session Snapshot 是权威状态；
- 支持 Session Lease 和所有权；
- Server 可以由应用提供 Session Service；
- SQLite Session Backend 已存在。

当前限制也很明确：

- `pi-server` 标记为 Experimental；
- API 可能变化或移除；
- 没有直接可运行的 Coding Agent Server CLI；
- 应用需要自己提供 `PiServerService`；
- 官方导出的现成传输是 Unix Domain Socket；
- Windows Named Pipe 或 WebSocket 需要自建 Transport；
- Protocol 明确没有兼容性保证；
- Client 不自动重连。

所以 Pi Server 可以成为未来自建工作台的技术基础，当前无法直接替换 DSH Web 产品。

### 4.4 安全边界差异很大

Pi 官方明确说明：

- 项目信任只控制项目本地资源是否加载；
- 项目信任不限制模型调用工具；
- 内置工具和扩展拥有启动进程用户的权限；
- Pi 没有内置 Sandbox；
- 强隔离需要容器、虚拟机、微型虚拟机或策略沙箱。

这会直接影响 Relay 的以下角色：

```text
diagnoser
  要求机器可证明只读

reviewer
  通常只读

planner / replanner
  只允许提交 Proposal

unattended coding
  需要路径和命令约束
```

Pi 可以通过以下方式接入：

1. 仅启用 Relay 自定义工具，关闭内置 write/edit/bash。
2. 覆盖内置工具并实施路径和命令白名单。
3. 使用 Gondolin、Docker、OpenShell 或独立低权限账号。
4. 让 Relay Runtime 继续控制 Authority、Receipt 和最终写入。

DSH 当前已经有更丰富的 Permission、Approval 和 Sandbox 结构，对无人值守和 Windows ACL 更有优势。

### 4.5 Windows 体验需要特别评估

Pi 有 Windows 发布物，Coding Agent 在 Windows 上仍要求 Bash。官方推荐 Git Bash，也支持 Cygwin、MSYS2 或 WSL。

用户当前的主力开发环境是原生 Windows，且本机存在多套 Codex、Claude Code 入口。引入 Pi 作为工作台会增加一层 Bash 依赖和路径语义。作为 planner、reviewer 等 Native Agent Executor 时，这个成本较可控；作为主工作台时，需要验证：

- Git Bash 与 Windows 路径的映射；
- worktree 路径；
- 终端剪贴板和中文输入；
- 外部 Herdr Pane 跳转；
- Bash 子进程树清理；
- 原生 Windows 脚本和 PowerShell Gate 调用；
- 扩展热加载和项目 Trust。

DSH 在 Windows 上同样需要 Pilot，但它已经把 PowerShell 执行和 ACL Sandbox 放入产品组合。

## 5. 四种 Pi 接入方案

### 5.1 方案 P-A：Pi TUI 替代 DSH 工作台

```text
Pi TUI
  + Relay Extension
  + Detached Relay Runtime
  + Herdr
```

Pi Extension 提供：

- Relay 命令；
- Run 列表；
- 当前节点 Widget；
- Attention Overlay；
- Approval 对话框；
- Herdr Pane 聚焦；
- Profile 选择；
- Relay 事件订阅。

优点：

- 技术栈简单；
- Extension API 成熟；
- TUI 交互效率高；
- Pi Agent 可直接承担 planner 和 replanner；
- 会话、模型和工具全部在一个进程中；
- 外壳开发量可能小于 DSH Web 插件。

成本：

- 丢失 Web 平台体验；
- 多项目和多 Run 总览需要自建；
- 图形化流程编辑能力弱；
- 桌面通知和本地应用平台能力有限；
- Windows 需要 Bash；
- 安全边界需要额外补齐。

结论：用户接受 TUI-first 时值得单独 Pilot。当前用户目标仍偏可视化平台，因此不替换 DSH 主线。

### 5.2 方案 P-B：Pi SDK + 自建 Web 或桌面工作台

```text
自建 Web / Desktop UI
  -> Pi SDK / Pi Client
  -> Relay Runtime
  -> Herdr
```

优点：

- Agent SDK 完整；
- UI 可以完全按个人需求设计；
- Pi Native Agent 与 Relay 页面可深度融合；
- 长期控制力最高。

成本：

- 需要重新建设 Workspace、Settings、Session、Plugin Inventory、Approval、Attention、项目导航；
- Pi Server 仍实验；
- Windows Transport 要自建；
- 客户端重连和权限要自建；
- 工作量接近 agent-console。

结论：不作为当前替代路线。DSH Pilot 失败且用户仍希望自建壳时，再与 agent-console 合并评估。

### 5.3 方案 P-C：Pi Server/Client 作为工作台底座

```text
Personal Client
  -> Pi Client / Protocol
  -> Pi Server
  -> Relay Runtime
```

优点：

- 已有 Session Lease、Snapshot 和 CBOR Protocol；
- 远程或多客户端架构有基础；
- SQLite Session Backend 可复用。

成本：

- Server 和 Protocol 都是 Experimental；
- 无现成 Coding Agent Server 应用；
- 缺 Windows Named Pipe Provider；
- 仍需自建全部业务 UI；
- Relay RPC 与 Pi Protocol 会形成两套状态协议。

结论：观察项。当前不承重。

### 5.4 方案 P-D：DSH 工作台 + Pi Executor

```text
DSH Personal Workbench
  -> Relay Bridge
  -> Relay Runtime
       +-> Pi Native Agent
       +-> Herdr Codex / Claude Code
       +-> Process / Gate
```

Pi 可以提供：

```text
pi.planner.strong
pi.replanner.strong
pi.review.readonly
pi.light-coding
pi.diagnoser.sandboxed
```

优点：

- 保留 DSH 工作台价值；
- 利用 Pi 更成熟的 Agent SDK 和多模型登录；
- Pi RPC 可以形成清晰 Adapter；
- Herdr 长时施工路径保持稳定；
- Pi 和 DSH 可以通过 Relay 协议解耦。

成本：

- 增加一个 Agent Runtime；
- 需要维护 Pi Profile 和资源目录；
- Diagnoser 和 Reviewer 的只读边界需要额外证明；
- DSH Native Agent 与 Pi Native Agent 存在功能重叠。

结论：推荐的 Pi 定位。先让真实任务证明 Pi 在某些节点上有明显优势，再决定是否扩大范围。

## 6. 对现有 P4~P9 的影响

### 6.1 当前不改阶段主线

当前主线继续为：

```text
P4 DSH 工作台最小 Pilot
P5 Relay v2 持久内核与 DSH Bridge
P6 Herdr 多账号执行底座
P7 DevHarness 单卡完整流水
P8 多卡编排与运行治理
P9 双平台定型与迁移
```

原因：

- 这条主线已经收束过一次；
- P4 的范围很小，可以快速验证 DSH 外壳；
- Pi 评估尚未包含用户真实 TUI 体验；
- 直接切换会再次冻结和重拆计划；
- Pi 作为 Executor 可以在 P5 之后按证据插入，不阻塞 P4。

### 6.2 Pi 的阶段落点

若后续需要正式接入，建议按以下位置处理：

| 阶段 | Pi 相关验证 |
|---|---|
| P4 | 不增加 Pi 范围，保持 DSH Pilot 的止损边界 |
| P5 | Relay Runtime 保留通用 Agent Adapter 接口，不写死 DSH Native Agent |
| P6 | 本机 Executor 审计时可新增 Pi 安装、模型和能力探测，不与 Herdr 卡合并承重 |
| P7 | 选择一个 planner、reviewer 或轻量节点试用 Pi，主施工仍走 Herdr |
| P8 | replanner 或 diagnoser 可进行 Pi 对照，diagnoser 必须有强制只读证据 |
| P9 | 根据实际体验决定 Pi 是正式 Executor、TUI 备用控制台或退出 |

### 6.3 不新建另一组 Pi 阶段计划

当前不建议新增 Pi-Pilot、Pi-P5、Pi-P6 等平行 DevPlan。这会重新产生已被 C1 指出的计划堆叠问题。

只有出现以下证据，才需要重新打开工作台外壳选择：

1. P4 的 DSH 树外 Client Plugin 失败；
2. DSH Web 的用户体验低于可接受底线；
3. DSH RC 升级导致兼容层无法收束；
4. 用户在真实使用 Pi TUI 后明确接受 TUI-first；
5. Pi TUI Extension 能以显著更低成本完成 Run、Attention、Approval 和 Profile 的核心体验。

## 7. Pi 作为 Relay Executor 的建议合同

建议使用独立 Executor Profile：

```yaml
executor_profiles:
  pi.planner.strong:
    backend: pi-rpc
    role: planner
    capabilities:
      structured_result: true
      session_resume: true
      user_input: true
      file_write: false
      shell: false

  pi.replanner.strong:
    backend: pi-rpc
    role: replanner
    capabilities:
      structured_result: true
      session_resume: true
      file_write: false
      shell: false

  pi.review.readonly:
    backend: pi-rpc
    role: reviewer
    capabilities:
      structured_result: true
      readonly: true
      file_write: false
      shell: restricted

  pi.light-coding:
    backend: pi-rpc
    role: build
    capabilities:
      coding: true
      session_resume: true
      file_write: true
      shell: true
```

具体模型、OAuth、API key、扩展目录和权限策略由本机审计确定。Relay 工件只保存：

```text
executor_profile_id
pi_version
provider_alias
model_id
resource_fingerprint
capability_hash
session_id
```

不保存 OAuth Token、API Key、`auth.json` 内容和完整敏感环境。

Pi RPC Adapter 至少要实现：

```text
launch
prompt
steer
follow_up
observe
abort
resume
collect_result
dispose
```

Pi 的 `agent_start/agent_end`、turn、tool、queue、retry 和 message 事件可以映射成 HostObservation。Relay 节点的 `succeeded` 仍需要合法结构化 Result，不能直接由 Pi idle 或 agent_end 推导。

## 8. 最小验证建议

当前不改变 P4。P4 结束并完成用户体验判断后，再决定是否做一张轻档 Pi Executor Spike。

该 Spike 只回答：

1. Pi RPC 能否在 Windows 上稳定启动和恢复一个 Session。
2. 能否关闭内置写工具，只暴露 Relay Proposal 工具。
3. 能否生成符合 schema 的 plan-proposal。
4. Pi 退出和重启后，Relay 能否重新关联 Session。
5. Pi 的模型登录和账号隔离是否适合用户本机环境。
6. TUI Widget 能否只读显示一条 Relay Run。

它不建设 Pi Web UI，不重写 P4，不替换 DSH，也不接 DevHarness 完整流水。

## 9. 决策闸

### 9.1 Pi 取代 DSH 的必要条件

以下全部成立后，才进入替换讨论：

| ID | 条件 |
|---|---|
| PI-S1 | 用户明确接受 TUI-first，或已有低成本成熟 Web Client |
| PI-S2 | 多项目、Run、Attention、Approval 的核心体验可用 |
| PI-S3 | Windows Bash、路径、进程和输入体验可接受 |
| PI-S4 | 权限和只读角色有机器可证明的隔离 |
| PI-S5 | Pi Extension 或 Client API 的升级成本低于 DSH Bridge |
| PI-S6 | 替换带来的开发量低于继续 P4~P9 |
| PI-S7 | Relay Runtime 独立真相和 DevHarness 领域真相保持不变 |

### 9.2 Pi 作为 Executor 的进入条件

| ID | 条件 |
|---|---|
| PI-E1 | 固定版本和资源指纹 |
| PI-E2 | Profile 不含凭据值 |
| PI-E3 | Result schema 和停止原因可确定映射 |
| PI-E4 | 取消、重启和 Session 恢复可实测 |
| PI-E5 | Reviewer/Diagnoser 的只读能力可以机器证明 |
| PI-E6 | 与 Herdr、DSH Native Agent 的能力重叠有明确收益 |

## 10. 风险

### 10.1 自建工作台范围膨胀

Pi SDK 很容易给人一种工作台已经具备大半基础的感觉。真正做成个人平台还需要项目、窗口、通知、设置、权限、页面、升级和打包。采用 Pi Web 路线时，必须防止 agent-console 以新技术名重新建设一遍。

### 10.2 安全感与真实权限不一致

Pi Extension 可以拦截工具，也可以覆盖内置工具。它仍运行在同一用户权限内。Prompt、UI 确认和工具白名单不能替代操作系统安全边界。Diagnoser、Finalizer 和高权限动作需要继续由 Relay 和独立 Process 权限主体控制。

### 10.3 两套 Agent 平面重叠

DSH Native Agent、Pi Agent、Herdr Codex/Claude Code 都能执行一定程度的任务。缺少明确路由会增加配置、复核和问题定位成本。

建议角色优先级：

```text
长时交互施工
  Herdr + Codex / Claude Code

工作台交互与 DSH 内页面协作
  DSH Native Agent

结构化规划、重编排、对照评审
  Pi Agent 候选

机器闸和 Finalizer
  Process / Gate Adapter
```

### 10.4 Pi 远程协议尚未稳定

Coding Agent RPC 已经可用。新 `pi-client/server/protocol` 仍明确标记实验且没有兼容保证。Relay 接 Pi 时优先使用受控的 Coding Agent RPC 或 SDK Adapter，不把 Relay Runtime 架到 Pi Server Protocol 上。

## 11. 最终建议

当前保持 design/05 和 P4~P9 不变。

Pi Agent 的最佳近期定位是：

```text
Relay 的可选 Native Agent Executor
```

优先验证 planner 或 replanner，因为这些角色：

- 需要强模型和结构化输出；
- 不需要完整 Coding Agent 产品会话；
- 可以关闭文件写入和 Shell；
- 与 DSH UI 解耦；
- 失败不会直接破坏业务仓；
- 能发挥 Pi SDK、RPC、多模型和会话恢复的优势。

Pi 作为工作台外壳的结论为：

```text
TUI-first 个人工作台
  有竞争力

Web-first 多项目平台工作台
  当前弱于 DSH，需要明显更多自建能力
```

因此，不替换 DSH 主线；保留 Pi 作为后续对照 Executor 和 DSH 失败后的备选外壳。

## 12. 官方资料基线

### Pi v0.84.2

- [Pi Agent Harness README](https://github.com/earendil-works/pi/blob/v0.84.2/README.md)
- [Coding Agent Quickstart](https://github.com/earendil-works/pi/blob/v0.84.2/packages/coding-agent/docs/quickstart.md)
- [Sessions](https://github.com/earendil-works/pi/blob/v0.84.2/packages/coding-agent/docs/sessions.md)
- [SDK](https://github.com/earendil-works/pi/blob/v0.84.2/packages/coding-agent/docs/sdk.md)
- [RPC Mode](https://github.com/earendil-works/pi/blob/v0.84.2/packages/coding-agent/docs/rpc.md)
- [Extensions](https://github.com/earendil-works/pi/blob/v0.84.2/packages/coding-agent/docs/extensions.md)
- [Pi Packages](https://github.com/earendil-works/pi/blob/v0.84.2/packages/coding-agent/docs/packages.md)
- [Providers](https://github.com/earendil-works/pi/blob/v0.84.2/packages/coding-agent/docs/providers.md)
- [Windows Setup](https://github.com/earendil-works/pi/blob/v0.84.2/packages/coding-agent/docs/windows.md)
- [Security](https://github.com/earendil-works/pi/blob/v0.84.2/packages/coding-agent/docs/security.md)
- [Pi Client](https://github.com/earendil-works/pi/blob/v0.84.2/packages/client/README.md)
- [Pi Server](https://github.com/earendil-works/pi/blob/v0.84.2/packages/server/README.md)
- [Pi Protocol](https://github.com/earendil-works/pi/blob/v0.84.2/packages/protocol/README.md)
- [SQLite Session Backend](https://github.com/earendil-works/pi/blob/v0.84.2/packages/session-backends/sqlite-node/README.md)

### DeepSeek Harness rc.7

- [DSH README](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/README.zh.md)
- [DSH Architecture](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/docs/architecture.zh.md)
- [DSH Package Overview](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/README.zh.md)
- [DSH Plugin Publishing](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/docs/user/develop/basic/publish.zh.md)
- [DSH Web Client](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/README.zh.md)
- [DSH Workflow Limitations](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/workflow/workflow/README.zh.md)
