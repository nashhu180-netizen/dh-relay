# P6 Herdr 多账号与 Headless 执行底座 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:status
汇报: 已按 design/06 补入 CLI/SSH 与无 DSH 运行边界；等待 P5 阶段闸
现状: DHR_32~35 均未开始
进行到: blocked-by-phase-gate:P5
下一步: P5 通过并经用户放行后，由 Codex 审计本机入口并回流真实配置
看什么: design/05、design/06、P5、旧 P3、Herdr preflight evidence
阻塞: P5 Gate 未通过；本机多账号真实配置尚未审计
-->

## 0. 定位

P6 把用户真实的 Codex、Claude Code 多账号环境接入 Relay Executor Profile，让 Herdr 成为长时间施工的首选宿主，并证明这条施工链在 DSH 不运行、Linux 只通过 SSH 使用时仍可观察、交互和恢复。

当前已知入口：

```text
codex
codex-ninth
claude
claude-grok
claude5
```

这些名称只表示用户已知别名。真实命令、配置目录、认证来源、身份探测、配额样本和 Herdr 启动方式必须由本机审计取得，本文不猜测。

P6 的最早可用结果：

```text
Relay CLI
  -> Relay Runtime
  -> Herdr
  -> Codex CLI / Claude Code
```

DSH 页面、Pi TUI 和 pane 聚焦按钮属于增强控制面。基线控制路径是 Relay CLI + Herdr CLI。

## 1. 前置条件

- P5 核心 Gate 通过；
- Relay Runtime、RPC、Store、参考 CLI 和 basic-agent-task 已稳定；
- 用户明确放行 P6；
- 本机审计任务已按安全边界确认；
- 不把凭据值写入任何工件；
- Linux 笔记本能够通过 SSH 登录；若当时机器不可达，DHR_33 先冻结 Headless fixture，DHR_35 收口前必须补真实 SSH smoke。

## 2. 交付范围

交付：

1. Executor Profile Registry。
2. 本机五类入口的可证配置映射。
3. Herdr Runtime Adapter 与状态对账。
4. Relay CLI 中的 Herdr 状态、host_ref 和附着入口。
5. 身份指纹、能力位、quota 样本和 fallback 关系。
6. Windows 上至少一条 Codex 与一条 Claude Code 真实节点。
7. Linux Headless/SSH 上至少一条 Herdr 持久会话 smoke。
8. 关闭 DSH 后完整完成一次 Herdr 节点观察和 Result 回收。
9. DSH 或 Pi 可用时，作为增强客户端显示同一状态；该项不阻断核心闭环。

不交付：

- DevHarness 完整单卡；
- 多卡调度；
- 自由账号切换；
- 计划内任意 CLI 参数；
- 凭据管理器；
- 自动登录；
- 跨机器 Relay 调度；
- Linux 完整 DevHarness 收口；
- 让 Pi 模型 API Agent 冒充 Codex/Claude Code 产品 Agent。

## 3. Executor Profile 模型

计划只引用稳定 ID。具体名称由 DHR_32 审计后冻结，当前只使用占位结构：

```text
herdr.codex.<alias>
herdr.claude.<alias>
```

注册表可以保存：

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
supported_platforms
headless_supported
```

注册表不能保存：

```text
Token
API Key
Cookie
完整敏感环境
可直接复用的认证材料
```

角色选择必须区分：

```text
control_client_profile
  dsh / pi / relay-cli

executor_profile
  herdr.codex.* / herdr.claude.* / pi-agent.* / process.*
```

控制客户端切换不能改变已经冻结的 Executor Profile。

## 4. Herdr 与 SSH 运行语义

Linux Headless 拓扑：

```text
SSH Client
  -> relay CLI
  -> herdr / herdr agent attach

Linux Host
  -> Relay Runtime
  -> Unix Domain Socket
  -> Herdr Server
  -> Codex / Claude Code / Pi
```

必须验证：

- `ssh` 会话断开后 Herdr Server 和 pane 继续存在；
- 重新 SSH 后 `herdr` 或 `herdr agent attach` 能接回；
- Relay Runtime 不把 SSH 客户端离线解释成 Agent 或 Run 退出；
- Herdr `blocked` 进入持久 Attention，用户可以通过 CLI 查看；
- Herdr `done` 只进入 `awaiting_result`，不能直接 `succeeded`；
- DSH 完全关闭时，Relay CLI 仍能显示 host_ref 和最后观测状态。

## 5. 任务表

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位 | 状态 | 依赖 | 工作区 | 验收时间 · verify SHA |
|---|---|---|---|---|---|---|
| DHR_32 | 审计本机 Codex/Claude 多账号并冻结 Executor Profile | 标准 | blocked-by-phase-gate:P5 | P5 Gate | <开工时回填> | |
| DHR_33 | 实现 Herdr Adapter、CLI/SSH 能力探测与状态对账 | 标准 | blocked-by-phase-gate:P5 | DHR_32 | <开工时回填> | |
| DHR_34 | 接通身份、quota 与预登记 fallback | 标准 | blocked-by-phase-gate:P5 | DHR_33 | <开工时回填> | |
| DHR_35 | 用 Codex、Claude Code 和 Linux SSH 跑真实执行闭环 | 标准 | blocked-by-phase-gate:P5 | DHR_33；DHR_34 可并行收口 | <开工时回填> | |

DHR_34 的完整 quota/fallback 不是 P7 单卡开工的绝对前提。P6 阶段闸中，P6-M4 可以登记为 `passed / constrained`；只要固定 Profile 的身份、Herdr 闭环和无 DSH 路径成立，用户可以决定先进入 P7，把完整自动 fallback 延后到 P8。权限和身份红线不能因此降级。

### DHR_32：本机配置审计

目标：由能够读取本机环境的 Codex 会话完成事实审计，输出脱敏注册表候选。

逐入口核对：

- 实际可执行命令；
- 配置来源和工作目录规则；
- 账号身份可观测信号；
- 模型和产品类型；
- 支持的平台；
- 是否支持交互、续接、只读、用户输入和结构化结果；
- quota 错误正反样本；
- 允许的 fallback；
- Herdr 创建、附着和聚焦方式；
- Linux 主机是否存在对应入口。

机器验收：

- 每个启用 Profile 有可重复的身份探测或明确标记不可证。
- 不可证身份的 Profile 不用于要求账号身份的验收。
- 审计工件零凭据。
- 路径和环境输出经过白名单脱敏。
- `claude5` 等别名的产品和模型归属由证据决定，不提前写死 Profile 名称。

### DHR_33：Herdr Adapter、CLI 与 SSH

Adapter 提供：

```text
launch
observe
capture
focus
attach
send
stop
reconcile
```

映射 Herdr 状态：

```text
working -> Relay running
blocked -> persistent Attention
 done   -> awaiting_result
idle    -> 结合阶段和 result 对账
unknown -> snapshot + process reconcile
```

Relay CLI 增加或接通：

```text
relay status <run_id>
relay inspect <run_id>
relay events <run_id> --follow
relay focus <run_id> <node_id>
```

`relay focus` 在 DSH 存在时可以请求图形聚焦；在普通终端中输出安全的 Herdr attach 指令或直接调用已注册附着动作。计划内不能保存任意拼接命令。

机器验收：

- 事件快路与 snapshot 慢路均可工作。
- 漏事件、Herdr 重启、pane 消失和进程退出均有明确结果。
- 启动信任弹窗等盲区进入 Attention 或启动失败。
- HostObservation 记录 Herdr 版本、能力 hash 和 pane 句柄。
- Linux 通过 SSH 启动 Herdr、detach、断开、重连后，pane 与状态可恢复观察。
- DSH 不启动时 CLI 可完成查询和附着。

### DHR_34：身份、quota 与 fallback

目标：

- Receipt 冻结 profile、account_alias、config_fingerprint 和 capability hash。
- 只在高置信 quota 样本命中时切到预登记 fallback。
- 普通错误、权限错误和网络错误不能误判为额度耗尽。

机器验收：

- Codex 多账号身份不会串用。
- Claude 多入口的配置边界可观察。
- fallback 产生 fresh Attempt，不续用旧身份链。
- 无合法 fallback 时进入 paused 并生成持久 Attention。
- 客户端离线时不自动选择未经授权的账号。

### DHR_35：真实执行闭环

Windows 主机至少跑：

1. Herdr + 一个 Codex Profile。
2. Herdr + 一个 Claude Code Profile。

Linux 笔记本至少跑：

```text
SSH 登录
  -> 启动或连接 Herdr
  -> 启动一个低风险 Agent 或受控 shell fixture
  -> detach 并断开 SSH
  -> 重新 SSH
  -> Relay CLI 与 Herdr 恢复观察
  -> 提交 checkpoint/result
```

Windows 闭环包含：

```text
Relay 签发 Receipt
  -> Herdr 启动产品 Agent
  -> working/blocked/done 观测
  -> checkpoint
  -> result
  -> Relay 终结节点
  -> CLI 展示并可附着 pane
```

DSH 关闭状态是必测路径。DSH 可用时，再作为增强客户端连接同一 Run，验证它没有第二份状态判断。

任务使用临时仓或用户批准的低风险真实卡，不进入 DevHarness 全收口。

## 6. P6 阶段闸

### 核心机器闸 P6-M

| ID | 命题 |
|---|---|
| P6-M1 | 至少一个 Codex 和一个 Claude Profile 完成真实节点 |
| P6-M2 | 身份、配置和 Receipt 可证且零凭据泄露 |
| P6-M3 | working、blocked、done、unknown 均有真实或受控证据 |
| P6-M4 | quota 正反样本和 fallback 有明确通过或受限结论 |
| P6-M5 | DSH 关闭时，CLI 能显示状态、Attention 和正确 Herdr host_ref |
| P6-M6 | Linux SSH 断开/重连不丢 Herdr 会话和 Relay Run 真相 |
| P6-M7 | 客户端变化不改变 Executor Profile、Attempt 和 Result 身份链 |

### 增强验收 P6-X

```text
DSH 页面显示状态并聚焦 Herdr pane
Pi TUI 显示同一 HostObservation
本机自动 fallback 完整体验
```

这些增强项影响默认工作台体验，不影响已通过的 Headless 基线。

### 人类闸 P6-H

用户判断：

- Herdr + Codex/Claude Code 是否适合作为后续施工主力；
- 多账号选择和 fallback 是否清楚；
- Windows 上 Herdr pane 的交互延迟是否可接受；
- Linux SSH 下 detach、重连和附着是否适合日常使用；
- DSH 到 Herdr 的跳转若可用，是否足够自然。

### 解锁规则

P6-M1、M2、M3、M5、M6、M7 必须通过。P6-M4 可以是通过或用户明确接受的受限状态。P6-H 有结论且用户同意进入 P7 后，P7 才解除阻塞。

## 7. 与旧 P3 的关系

旧 P3 的 Herdr 研究证据继续复用。以下实施前提废弃：

- 先在 PowerShell 中抽象 psmux 六动词；
- psmux 继续作为默认生产宿主；
- Herdr 只作为平行候选。

新主线中 Herdr 是首选交互宿主，psmux 只保留 legacy 回退。Herdr 官方支持 Linux 终端和普通 SSH，P6 将其提升为正式验收场景。

## 8. 开工边界

P5 未通过时，DHR_32~35 均不得开工。用户指定 Codex 审计本机配置也需要单独确认读取范围和脱敏要求。本计划重写后需要 fresh 审核。
