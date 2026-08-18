<!-- dh:v1 -->
# 多控制面、Headless 与 SSH 运行：设计补充

> 状态：正式设计补充，按阶段闸生效。本文补充并修正 `design/05` 的控制面边界，可以作为 P4～P9 拆计划与 B-adjust 输入；本文不授权任何任务卡直接开工。
>
> 用户方向：2026-08-18。dh-relay 必须在 DeepSeek Harness 不存在、不可启动、升级失败或主动不用时继续运行；Linux 笔记本只通过 SSH 和终端使用，也必须完成同一套受控流水。
>
> 关联设计：[05-DeepSeek Harness 插件化与专属工作台](./05-DeepSeek-Harness插件化与专属工作台-可行性评估.md)、[02-完整流水产品设计](./02-完整流水-产品设计与验收.md)。
>
> 冲突规则：05 中关于 Workflow Contract、Relay Runtime、Herdr、Outbox、三类真相和 DSH Bridge 的设计继续有效；凡是把 DSH 写成唯一工作台、唯一交互入口、必经执行器或整条主线生存前提的表述，以本文为准。

## 1. 设计结论

最终结构调整为：

```text
可替换控制面
  ├─ DSH Web Workbench            首选桌面工作台
  ├─ Relay CLI                    必须存在的参考客户端
  ├─ Pi Extension / Pi TUI        可选终端工作台
  └─ 其他 CLI 包装                通过稳定 CLI / RPC 接入
              |
              | relay.rpc/v1 / relay CLI
              v
Detached Relay Runtime
  ├─ Workflow Compiler / ResolvedPlan
  ├─ Engine / Authority / Store / Replay
  ├─ Attention / Approval / Outbox
  └─ Runtime Adapters
       ├─ Herdr
       ├─ Pi Native Agent
       ├─ DSH Native Agent
       ├─ Process / Gate / Finalizer
       └─ Fake
              |
              v
业务仓 Git / DevPlan / Workspace / Review / Verify
```

DSH 继续作为 Windows 桌面环境下的首选工作台，提供 Web 页面、流程图、项目导航、Attention、审批和配置体验。它属于可替换控制面，不属于 Relay Runtime 的生存依赖，也不承担从头到尾运行的常驻 AI 主控。

Relay CLI 是必须交付的参考客户端。任何能运行该命令的终端，包括 Windows Terminal、PowerShell、Git Bash、Linux shell、SSH 会话，都可以查询和控制同一 Run。Pi 可以在此基础上提供更丰富的 TUI 和 Agent 能力。

## 2. “任意 CLI 终端”的准确含义

终端本身只提供输入输出环境。真正的客户端是：

```text
relay CLI
或
实现 relay.rpc/v1 的客户端
```

因此，“任意 CLI 终端可代替 DSH”表示：只要该终端能够启动 `relay`，就能完成基线控制能力。第三方终端无需理解 DevHarness，也无需解析 `.dh-relay` 内部文件。

参考 CLI 至少提供：

```text
relay list [--json]
relay status <run_id> [--json]
relay inspect <run_id> [--json]
relay events <run_id> --follow [--json]
relay start --request <file>
relay stop <run_id>
relay resume <run_id>
relay attention list [--run <run_id>]
relay attention show <attention_id>
relay attention answer <attention_id> --option <option_id>
relay plan show <run_id>
relay plan diff <run_id> <revision_id>
relay approve <approval_id> --decision approve|reject
relay focus <run_id> <node_id>
```

文本输出面向人，`--json` 面向 Pi、DSH Bridge、脚本和其他客户端。两种输出读取同一套查询投影和控制合同。

## 3. 硬约束

以下约束从 P4 起进入机器验收：

1. **Relay Runtime 不 import DSH 类型，也不要求 DSH 进程存在。**
2. **客户端断开、浏览器关闭、DSH 插件卸载不能隐式取消 Run。**
3. **所有必经 Workflow 角色都必须有至少一个非 DSH-only 的合法 Executor Profile。** DSH Native Agent 可以是首选或候选，不能成为不可替代的硬依赖。
4. **Start、Attention、重编排确认和 E11 Approval 都由 Relay 保存持久请求与 Receipt。** DSH、Pi 和 CLI 只负责展示与提交。
5. **没有任何控制客户端在线时，Relay 继续运行所有无需人类输入的节点。** 到达 Attention 或 Approval 时安全暂停，等待任一客户端稍后处理。
6. **控制面变化不能修改 Authority、ResolvedPlan、Result、Gate 和 Verify 语义。**
7. **DSH、Pi 与 CLI 对同一状态的查询必须来自同一 Read Model。** 客户端不能各自解释事件账并形成不同结论。
8. **GUI 能力只作为展示增强。** 流程完成条件不能依赖浏览器内存、页面组件或点击事件本身。

## 4. 控制客户端与执行器必须分开

DSH 和 Pi 都可能同时扮演两种角色：

| 对象 | 控制客户端角色 | Agent 执行器角色 |
|---|---|---|
| DSH | 展示 Run、提交 Start/Attention/Approval | `dsh-agent` 或 one-shot Subagent 执行节点 |
| Pi | TUI 展示、命令和审批入口 | `pi-agent` 通过 SDK/RPC 执行规划、复核等节点 |
| Relay CLI | 基线查询与控制 | 不自动成为 AI 执行器 |
| Herdr | 可由 CLI 聚焦和附着 | 承载 Codex CLI、Claude Code 等产品 Agent |

控制客户端替换通常不改变实现结果。执行器替换可能改变模型输出、工具轨迹和代码细节，因此必须重新生成 Attempt、Receipt 和 Result，并继续经过同一 Workflow Contract、机器闸和复核链。

禁止把以下两种情况混为一谈：

```text
DSH 页面关闭
  只是控制客户端离线

正在运行的 dsh-agent 进程消失
  是某个 Executor Attempt 丢失
```

第一种不影响 Run。第二种只影响对应 Attempt，Relay 按 `executor_lost` 或 `interrupted_unknown` 处理，使用预登记 fallback 新建 Attempt或暂停，不得把整个 Run 静默判失败或成功。

## 5. Linux Headless 与 SSH 拓扑

Linux 笔记本不需要安装图形桌面，也不要求运行 DSH Web UI。推荐拓扑：

```text
Linux Laptop
  ├─ Detached Relay Runtime
  ├─ Unix Domain Socket
  ├─ <repo>/.dh-relay/<run_id>/
  ├─ relay CLI
  ├─ Herdr Server
  ├─ Codex / Claude Code / Pi
  └─ Process / Gate / Finalizer
          ^
          |
      SSH Terminal
```

典型操作：

```text
ssh <linux-host>
relay list
relay status <run_id>
relay events <run_id> --follow
relay attention list
herdr
herdr agent attach <agent_name>
```

Herdr 官方支持在远程主机上通过普通 SSH 启动、detach 和重新 attach。SSH 断开后，Herdr server、pane 与 Agent 可以继续在远程主机运行。Relay Runtime 也必须采用相同的独立生命周期语义。

SSH 连接丢失时：

- Relay Runtime 继续运行；
- Herdr 中的 Agent 继续运行；
- Process、Gate、Finalizer 按自身状态继续；
- 到达需要用户回答的节点时生成 Attention 并暂停；
- 用户重新 SSH 登录后用 Relay CLI 或 Herdr 继续；
- SSH 客户端退出不能被解释为 Run cancel。

当前不要求 Windows 上的 DSH 远程控制 Linux Runtime。用户可以直接 SSH 到 Linux 使用 CLI。未来需要跨机器统一看板时，再增加经认证的远程传输或 SSH 隧道，不在本阶段提前建设分布式控制面。

## 6. Headless 下的人机交互与 Approval

所有需要用户输入的节点先形成持久对象：

```text
Attention
Approval Request
Replan Approval
Human Verdict Request
```

对象至少冻结：

```text
request_id
run_id
node_id
attempt_id
request_hash
summary
evidence_refs
allowed_options
expected_state_hash
expires_at
```

客户端提交回答后，Relay 生成不可变 Receipt。DSH UI、Pi TUI 和 CLI 使用同一 request id、option id 和 hash。

E11 在终端中的形态可以是：

```text
relay attention show <approval_id>
relay approve <approval_id> --decision approve
```

CLI 必须先展示 releasePacket 摘要、完整证据入口、allowed effects、excluded effects 和 request hash。Receipt 绑定的内容与 DSH 页面提交完全相同。

因此，图形化按钮和终端命令只影响交互方式，不改变授权对象和最终收口权限。

## 7. 证据模型与无 GUI 场景

证据需要区分语义与载体：

```text
evidence_kind
  machine_receipt
  terminal_transcript
  ui_capture
  human_verdict
  artifact_hash
  process_observation
```

以下证据可以在 Headless 环境中等价取得：

- 进程身份、退出码和时间戳；
- Herdr pane、Agent 状态和 session 句柄；
- CLI 显示内容和终端转录；
- request/receipt hash；
- Git、文件、Gate、Manifest 和 Verify；
- 用户在 CLI 中提交的原文 verdict。

以下场景不能静默用终端证据替代：

- 产品功能本身需要浏览器或桌面视觉验收；
- 验收明确要求窗口布局、图表、图像或交互体验；
- 目标平台只能在 GUI 中复现问题；
- 安全要求明确指定某类强证据，而当前主机无法提供。

这类节点必须声明 `required_capabilities`。Headless 主机缺少能力时，Workflow Compiler 在启动前拒绝该节点、路由到具备能力的主机，或生成需要用户带外取证的 Attention。禁止把无法验证写成通过。

旧 psmux 方案中用于证明“用户看到了哪个窗口”的截图护栏，不继续作为唯一授权依据。新方案以 Relay Approval Request/Receipt 的 hash、目标身份、状态 hash 和单次消费为权威；GUI 截图可以作为辅助证据。

## 8. 更换终端对流程和结果的影响

| 变化 | 对流程语义 | 对实现结果 |
|---|---|---|
| DSH UI 换 Relay CLI | 无变化，使用同一 Run、计划和 Receipt | 应保持一致 |
| DSH UI 换 Pi TUI | 无变化，Pi 只做客户端时 | 应保持一致 |
| DSH Native Agent 换 Pi Agent | 节点合同不变，产生新 Attempt | 文本、代码细节可能变化，需要重新过 Gate 和复核 |
| DSH Native Agent 换 Herdr Codex/Claude | 节点合同不变，产生新 Attempt | 结果可能变化，以验收和证据为准 |
| Windows 换 Linux | Workflow Contract 不变，平台能力和路径实现变化 | 跨平台项目应满足同一验收；平台专属任务可能不适用 |
| 图形界面换 SSH | 状态、授权和结果协议不变 | 无 GUI 证据的任务需路由或暂停 |
| SSH 中断 | Run 不取消 | 只增加用户响应延迟 |

核心结论：

> **控制面替换不应改变业务结果；执行器或操作系统替换可能改变实现细节，必须靠同一 Contract、Gate、复核和 Verify 收敛。**

不要求不同 Agent 生成逐字节相同代码。要求的是：Authority、必经节点、验收、effect、机器证和最终 Verify 具有相同含义。

## 9. Fallback 规则

### DSH 不可用

```text
DSH unavailable
  -> Relay Runtime 保持运行
  -> Relay CLI 成为基线控制面
  -> Pi TUI 可作为增强控制面
  -> DSH-only Attempt 进入 executor_lost
  -> 按预登记 fallback 新建 Attempt 或暂停
```

### Pi 不可用

Relay CLI 继续工作。Pi 不能成为唯一审批、恢复或诊断入口。

### CLI 客户端全部离线

Relay 继续运行自动节点，到 Attention 时暂停。用户重新连接后继续。

### Herdr 不可用

只有节点合同允许其他 Executor 且能力匹配时才切换到 Pi、DSH Native 或 Process。需要真实 Codex/Claude Code 产品语义的节点不能静默换成模型 API Agent。

## 10. 阶段计划调整

### P4

从“DSH 成败决定整条路线”改为“多控制面最小 Pilot，DSH 优先”。必须先证明同一 fake/v1 Read Model 可由通用 CLI 在 Windows 和 SSH 终端读取；DSH 是并行的首选 UI Pilot。DSH Pilot 判否时，P5 仍可在 CLI 控制面下继续。

### P5

Relay Runtime、Run Store、RPC 和参考 CLI 是承重交付。DSH Bridge、Pi Client 属于可替换 Adapter。`basic-agent-task` 先用 Process 执行器证明内核闭环，再接入任一 Agent Executor。

### P6

Herdr 闭环必须提供 CLI/SSH 观察和附着路径。DSH 状态页与 pane 聚焦属于增强验收。增加一次 Linux Headless SSH smoke，完整双平台定型仍放 P9。

### P7

单卡完整流水必须在 DSH 关闭状态下完成一次核心路径。Start Preview、Attention、重编排和 E11 Approval 均可由 Relay CLI 完成。DSH 可以在同一 Run 中作为并行只读或增强控制面。

### P8

重编排 Diff、诊断报告、Attention 和 Outbox 状态必须有规范 JSON 与文本投影。DSH 图形展示不能成为批准和恢复的唯一入口。

### P9

Windows 验证 DSH 首选工作台和 CLI 回退；Linux 验证 SSH + Relay CLI/Pi TUI + Herdr 的 Headless 路径。最终发布必须包含无 DSH 运行手册。

## 11. 验收命题

| ID | 验收命题 |
|---|---|
| H1 | DSH 未安装或完全停止时，Relay Runtime 可以启动、查询、运行和恢复 |
| H2 | Relay CLI 能完成 list/status/inspect/watch/start/stop/resume/attention/approve 的基线控制 |
| H3 | DSH、Pi 与 CLI 读取同一 Read Model，对同一 Run 的状态和终态一致 |
| H4 | 客户端断开、DSH 插件卸载和 SSH 断开均不隐式取消 Run |
| H5 | 没有客户端在线时，自动节点继续；需要人类输入时安全暂停并留下持久 Attention |
| H6 | 任一必经 Workflow 角色至少存在一个非 DSH-only 合法 Executor Profile |
| H7 | DSH-only Executor 丢失只影响对应 Attempt，不能污染其他节点或 Run 真相 |
| H8 | 同一 Approval Request 经 DSH 或 CLI 提交后生成语义相同、hash 绑定的 Receipt |
| H9 | Linux 无 GUI、仅 SSH 时，可以运行 Runtime、CLI、Herdr 和一条代表性工作流 |
| H10 | Headless 缺少强证据能力时，启动前拒绝、路由或暂停，不静默降级 |
| H11 | 更换控制客户端不改变 Authority、ResolvedPlan、Gate、Result 和 Verify |
| H12 | 更换 Agent Executor 时产生 fresh Attempt，并重新经过相同质量链 |

## 12. 当前不做

- 远程公网 Relay 服务；
- 多主机分布式调度；
- 在 Windows DSH 中直接远控 Linux Runtime；
- 为每一种终端单独实现业务状态机；
- 让 Pi 或 DSH 保存第二份 Run 真相；
- 让 CLI 直接编辑 `.dh-relay` 文件；
- 把所有 GUI 验收自动改写成终端验收；
- 在没有真实需求前建设通用 WebSocket 控制平台。

## 13. 资料基线

Headless 与 SSH 路径参考 Herdr 官方文档：

- `https://herdr.dev/docs/how-to-work/`
- `https://herdr.dev/docs/agent-automation/`
- `https://herdr.dev/docs/cli-reference/`

Pi 作为可选客户端与执行器的依据见：

- [Pi Agent 替代 DSH 的独立对比评估](./evidence/08-Pi-Agent替代DSH-独立对比评估.md)
