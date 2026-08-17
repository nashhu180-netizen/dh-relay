# P6 Herdr 多账号执行底座 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:status
汇报: 路线计划已落盘，等待 P5 阶段闸
现状: DHR_32~35 均未开始
进行到: blocked-by-phase-gate:P5
下一步: P5 通过并经用户放行后，由 Codex 审计本机入口并回流真实配置
看什么: design/05、P5、旧 P3、Herdr preflight evidence
阻塞: P5 Gate 未通过；本机多账号真实配置尚未审计
-->

## 0. 定位

P6 把用户真实的 Codex、Claude Code 多账号环境接入 Relay Executor Profile，并让 Herdr 成为长时间施工的首选宿主。

当前已知入口：

```text
codex
codex-ninth
claude
claude-grok
claude5
```

这些名称只表示用户已知别名。真实命令、配置目录、认证来源、身份探测、配额样本和 Herdr 启动方式必须由本机审计取得，本文不猜测。

## 1. 前置条件

- P5 Gate 通过；
- Relay Runtime、RPC、Store 和 basic-agent-task 已稳定；
- 用户明确放行 P6；
- 本机审计任务已按安全边界确认；
- 不把凭据值写入任何工件。

## 2. 交付范围

交付：

1. Executor Profile Registry。
2. 本机五类入口的可证配置映射。
3. Herdr Runtime Adapter 与状态对账。
4. 身份指纹、能力位、quota 样本和 fallback 关系。
5. 一条真实长时间施工节点。
6. DSH 中的状态展示与 Herdr pane 聚焦。

不交付：

- DevHarness 完整单卡；
- 多卡调度；
- 自由账号切换；
- 计划内任意 CLI 参数；
- 凭据管理器；
- 自动登录；
- 通用远程 Agent；
- Linux 完整验收。

## 3. Executor Profile 模型

计划只引用稳定 ID，例如：

```text
herdr.codex.default
herdr.codex.ninth
herdr.claude.default
herdr.claude.grok
herdr.claude.minimax
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
```

注册表不能保存：

```text
Token
API Key
Cookie
完整敏感环境
可直接复用的认证材料
```

## 4. 任务表

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位 | 状态 | 依赖 | 工作区 | 验收时间 · verify SHA |
|---|---|---|---|---|---|---|
| DHR_32 | 审计本机 Codex/Claude 多账号并冻结 Executor Profile | 标准 | blocked-by-phase-gate:P5 | P5 Gate | <开工时回填> | |
| DHR_33 | 实现 Herdr Adapter、能力探测与状态对账 | 标准 | blocked-by-phase-gate:P5 | DHR_32 | <开工时回填> | |
| DHR_34 | 接通身份、quota 与预登记 fallback | 标准 | blocked-by-phase-gate:P5 | DHR_33 | <开工时回填> | |
| DHR_35 | 用 Codex 与 Claude Code 跑真实施工闭环 | 标准 | blocked-by-phase-gate:P5 | DHR_34 | <开工时回填> | |

### DHR_32：本机配置审计

目标：由能够读取本机环境的 Codex 会话完成事实审计，输出脱敏注册表候选。

逐入口核对：

- 实际可执行命令；
- 配置来源和工作目录规则；
- 账号身份可观测信号；
- 模型和产品类型；
- 是否支持交互、续接、只读、用户输入和结构化结果；
- quota 错误正反样本；
- 允许的 fallback；
- Herdr 创建和聚焦方式。

机器验收：

- 每个启用 Profile 有可重复的身份探测或明确标记不可证。
- 不可证身份的 Profile 不用于要求账号身份的验收。
- 审计工件零凭据。
- 路径和环境输出经过白名单脱敏。

### DHR_33：Herdr Adapter

Adapter 提供：

```text
launch
observe
capture
focus
send
stop
reconcile
```

映射 Herdr 状态：

```text
working -> Relay running
blocked -> Attention
 done   -> awaiting_result
idle    -> 结合阶段和 result 对账
unknown -> snapshot + process reconcile
```

Herdr `done` 不得直接产生 Relay `succeeded`。

机器验收：

- 事件快路与 snapshot 慢路均可工作。
- 漏事件、Herdr 重启、pane 消失和进程退出均有明确结果。
- 启动信任弹窗等盲区进入 Attention 或启动失败。
- HostObservation 记录 Herdr 版本、能力 hash 和 pane 句柄。

### DHR_34：身份、quota 与 fallback

目标：

- Receipt 冻结 profile、account_alias、config_fingerprint 和 capability hash。
- 只在高置信 quota 样本命中时切到预登记 fallback。
- 普通错误、权限错误和网络错误不能误判为额度耗尽。

机器验收：

- `codex` 与 `codex-ninth` 身份不会串用。
- `claude`、`claude-grok`、`claude5` 的配置边界可观察。
- fallback 产生 fresh attempt，不续用旧身份链。
- 无合法 fallback 时进入 paused 并生成 Attention。

### DHR_35：真实施工闭环

至少跑两条真实节点：

1. Herdr + 一个 Codex Profile。
2. Herdr + 一个 Claude Code Profile。

闭环包含：

```text
Relay 签发 receipt
  -> Herdr 启动产品 Agent
  -> working/blocked/done 观测
  -> checkpoint
  -> result
  -> Relay 终结节点
  -> DSH 展示并可聚焦 pane
```

任务应使用临时仓或用户批准的低风险真实卡，不进入 DevHarness 全收口。

## 5. P6 阶段闸

### 机器闸 P6-M

| ID | 命题 |
|---|---|
| P6-M1 | 至少一个 Codex 和一个 Claude Profile 完成真实节点 |
| P6-M2 | 身份、配置和 Receipt 可证且零凭据泄露 |
| P6-M3 | working、blocked、done、unknown 均有真实或受控证据 |
| P6-M4 | quota 正反样本和 fallback 行为正确 |
| P6-M5 | DSH 可以显示状态并聚焦正确 Herdr pane |
| P6-M6 | DSH 重启不丢 Relay 节点与 Herdr host_ref |

### 人类闸 P6-H

用户判断：

- Herdr + Codex/Claude Code 是否适合作为后续施工主力；
- 多账号选择和 fallback 展示是否清楚；
- DSH 到 Herdr 的跳转是否足够自然。

### 解锁规则

P6-M 全部通过、P6-H 明确、用户同意进入 P7 后，P7 才解除阻塞。

## 6. 与旧 P3 的关系

旧 P3 的 Herdr 研究证据继续复用。以下实施前提废弃：

- 先在 PowerShell 中抽象 psmux 六动词；
- psmux 继续作为默认生产宿主；
- Herdr 只作为平行候选。

新主线中 Herdr 是首选交互宿主，psmux 只保留 legacy 回退，具体实现依赖 P5 的 Runtime Adapter 接口。

## 7. 开工边界

P5 未通过时，DHR_32~35 均不得开工。用户指定 Codex 审计本机配置也需要单独确认读取范围和脱敏要求。
