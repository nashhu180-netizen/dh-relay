# P4 DSH 优先的多控制面最小 Pilot 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:status
汇报: 已按 design/06 重写为多控制面 Pilot；待 fresh 交叉审核，未授权任何卡开工
现状: DHR_25~27 均未开始
进行到: P4 ▸ B-adjust 后待审核
下一步: fresh reviewer 审核本计划；用户另行决定是否授权 DHR_25
看什么: design/05、design/06、design/evidence/07、design/evidence/08、dev_plan/README.md
阻塞: 无前置阶段；存在用户开工确认闸
-->

## 0. 定位

P4 回答两个问题：

1. dh-relay 的同一套只读状态能否在普通终端和 SSH 环境中显示，证明工作台不依赖 DSH。
2. DeepSeek Harness 能否在用户的 Windows 主机上，以树外插件方式提供更好的图形工作台体验。

P4 采用双轨 Pilot：

```text
基线轨：Relay Pilot CLI
  必须通过，证明任意终端可作为控制面

增强轨：DSH Host/Client Plugin
  优先验证；通过则成为首选桌面工作台
  判否不阻断 Relay Runtime 主线
```

Pi TUI 在本阶段只作为候选控制面登记，不要求建设正式 Pi Extension。P4 的目标工作量仍按 2~3 个有效开发日控制，DHR_25 记录实际开工时间，DHR_27 报告真实耗时。

本计划承接：

- [design/05](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md)
- [design/06](../design/06-多控制面与Headless-SSH运行-设计补充.md)
- [Claude 对阶段计划的评估](../design/evidence/07-P4至P8阶段计划评估与pi替代评估-待第三方评估.md)
- [Pi Agent 独立评估](../design/evidence/08-Pi-Agent替代DSH-独立对比评估.md)

## 1. 交付范围

交付：

1. 一份客户端中立的 `relay.pilot-read-model/v1` fixture。
2. 一个临时的 Relay Pilot CLI，可输出文本和 JSON。
3. 在 Windows 终端中渲染 fake run 和冻结的 v1 历史 run。
4. 在 Linux SSH 会话中渲染同一 fake fixture；条件允许时同时读取复制到 testdata 的 v1 fixture。
5. 一个树外 DSH Host Plugin。
6. 一个树外 DSH Client Plugin 和最小 Relay 面板；若 Client 构建链触发止损条件，诚实收口为判否。
7. DSH 页面与 CLI 对同一 Read Model 的一致性报告。
8. 可选的 DSH Native Agent 棒 0 Proposal 试验；该项不阻断 P5。
9. 一份 Pilot 报告，明确 DSH 继续、调整或退出，以及 P5 的默认控制面。

不交付：

- relay/v2 完整协议；
- Detached Relay Runtime；
- Workflow Contract、Executor Profile 正式实现；
- Herdr Adapter；
- DevHarness S0~E13；
- E11/E12/E13；
- Named Pipe 或 Unix Domain Socket；
- 正式 Pi Extension；
- 完整工作台首页、项目管理、流程编辑器；
- agent-console 迁移或删除。

## 2. 实施边界

Pilot 代码放在 dh-relay 仓外的独立实验目录或独立树外插件仓。不得修改 DeepSeek Harness 上游源码。

建议结构：

```text
<experiment-root>/relay-control-pilot/
  package.json
  src/read-model/
  src/cli/
  src/dsh-host/
  src/dsh-client/
  testdata/fake/
  testdata/v1/
  evidence/
```

DSH 使用独立 Home：

```text
<experiment-root>/dsh-home/
```

v1 现场先复制成冻结 fixture，Pilot 以 fixture 为主输入。最后再对一条活历史现场做只读演示。Pilot 不写 v1 现场、不创建 v2 Run、不改业务仓 DevPlan 和 workspace。

本阶段的 CLI 是一次性验证客户端，不锁定 P5 Runtime 的最终语言和正式命令实现。Read Model schema 与正反 fixture可以进入后续协议设计。

## 3. 任务表

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位 | 状态 | 依赖 | 工作区 | 验收时间 · verify SHA |
|---|---|---|---|---|---|---|
| DHR_25 | 冻结客户端中立 Read Model、fixture 与 Windows/SSH CLI 基线 | 轻 | 未开始 | - | <开工时回填> | |
| DHR_26 | 验证树外 DSH Host/Client Plugin 并渲染同一 Read Model | 标准 | 未开始 | DHR_25 | <开工时回填> | |
| DHR_27 | 接 v1 只读投影、做跨客户端对证并完成 Pilot 裁决 | 标准 | 未开始 | DHR_26 或 DHR_26 判否证据 | <开工时回填> | |

### DHR_25：Read Model 与终端基线

目标：

- 冻结 fake run 和 v1 run 的最小统一查询结构。
- 提供 `text` 与 `json` 两种 CLI 输出。
- 在 Windows 普通终端运行。
- 通过 SSH 在 Linux 笔记本运行同一 fake fixture。
- 记录操作系统、Shell、Node 或临时运行依赖，但不把它们提升为正式 Runtime 决策。

Read Model 至少包含：

```text
run_id
source_kind
workflow_name
run_status
nodes[]
attentions[]
updated_at
source_refs[]
```

机器验收：

- Windows 与 Linux SSH 对同一 fixture 输出相同 JSON 语义。
- 文本输出只由统一 Read Model 渲染，不另写一套状态推导。
- 未知字段、损坏 fixture 和非法状态给出明确错误。
- testdata 零凭据、零本机敏感路径。
- SSH 断开不改变 fixture 和任何远端持久状态。

### DHR_26：DSH 树外插件

目标：

- 提供最小 `ctx.relayPilot` Host Service。
- 找到并记录树外 Client Bundle 的可复现构建配方。
- 通过 Client Plugin 和 UI Slot 增加 Relay Pilot 面板。
- 面板渲染 DHR_25 的同一 fake Read Model。
- Bundle 可以安装和卸载；若上游提供显式启用/禁用机制则一并验证。

机器验收：

- 不修改 DSH 上游仓库即可加载 Host Plugin。
- Client Plugin 使用可重复构建产物加载。
- Host/Client 只传普通 JSON，不传 Cordis 活动对象。
- 浏览器刷新和 DSH 重启后，从 fixture 重建相同页面。
- 卸载后服务、事件和 UI 注册得到清理。

DSH 增强轨允许以下终态：

```text
passed
passed-with-constraints
stopped-by-pilot
```

`stopped-by-pilot` 必须写清阻塞事实，不包装为通过。只要 DHR_25 基线轨通过，DSH 判否不会阻止 DHR_27 完成控制面裁决。

### DHR_27：v1 只读、对证与裁决

目标：

- 读取一条冻结 v1 fixture，投影为统一 Read Model。
- 对活 v1 历史现场做一次零写入演示。
- 比较 CLI 与 DSH 对同一 Read Model 的节点、状态和 Attention。
- 形成 P4 报告，给出 P5 的默认控制面和增强控制面选择。
- 条件允许时，验证 DSH Native Agent 读取冻结输入并输出非权威 `plan-proposal` fixture；做不成只记未验证。

棒 0 Proposal 只允许包含：

```text
任务摘要
候选节点
建议执行角色
依赖
未决问题
```

它不得写 Relay state、业务仓工件或执行命令。

证据回流：

```text
docs/modules/dh-relay/design/evidence/09-P4-多控制面Pilot报告.md
```

报告至少包含真实截图或终端录屏/转录、fixture hash、CLI 输出、DSH 结果、版本、实耗和裁决。

## 4. P4 阶段闸

### 基线机器闸 P4-CM

以下全部通过，才证明 Relay 主线不依赖 DSH：

| ID | 命题 |
|---|---|
| P4-CM1 | 同一 fake Read Model 可由 Windows CLI 渲染文本和 JSON |
| P4-CM2 | 同一 fake fixture 可在 Linux SSH 终端读取，JSON 语义一致 |
| P4-CM3 | 冻结 v1 fixture 与活 v1 现场只读投影成功，源文件零写入 |
| P4-CM4 | CLI 和任何增强客户端均消费同一 Read Model |
| P4-CM5 | DSH 完全不启动时，P4 基线轨仍可完成 |
| P4-CM6 | 全程不引入 Relay 运行写权，不 fork DSH |

### DSH 增强轨 P4-DM

该组用于决定 DSH 是否成为首选桌面工作台，不作为 P5 内核主线的生死闸：

| ID | 命题 |
|---|---|
| P4-DM1 | Windows 上树外 Host Plugin 可加载 |
| P4-DM2 | 树外 Client Bundle 有可重复构建配方并可加载 |
| P4-DM3 | 最小面板可从统一 Read Model 重建 |
| P4-DM4 | 安装、卸载和资源清理有证据 |
| P4-DM5 | DSH RC 私有类型没有进入 Read Model |

### 非阻塞探索 P4-X

```text
DSH Native Agent 棒 0 Proposal
Pi TUI 读取同一 JSON
外部页面的视觉质量
```

这些探索失败不阻断 P5，只进入报告和后续路线选择。

### 人类闸 P4-H

用户判断：

1. 普通 CLI 与 SSH 路径是否足以作为可靠应急控制面。
2. DSH 页面若通过，是否值得成为 Windows 日常首选工作台。
3. DSH 若判否，是否选择 CLI-first，或在 P5 后增加 Pi TUI Adapter。
4. 当前启动、查看和恢复体验是否值得继续建设 Relay Runtime。

### 解锁规则

P5 解除阻塞必须满足：

1. P4-CM 全部通过。
2. DSH 增强轨已有明确 `passed / constrained / stopped` 结论。
3. 风险和未验证项已记录。
4. 用户明确同意进入 P5。

DSH 增强轨判否时，P5 以 Relay CLI 为默认控制面，DSH Bridge 转成可选或暂停项。P5~P9 不因 DSH 不可用整体终止。

## 5. 风险与止损

出现以下任一情况时停止 DSH 增强轨扩张并进入裁决：

- Client Bundle 只能在 DSH monorepo checkout 内构建，形成变相 fork；
- Windows 下 Profile 或插件生命周期不稳定；
- 单个最小面板要求大范围导入未公开内部模块；
- DSH 重启后无法从普通 JSON 重建页面；
- 2~3 个有效开发日内仍没有可见面板。

出现以下情况时 P4 整体不能通过：

- 通用 CLI 无法在 DSH 不启动时读取统一 Read Model；
- Windows 与 Linux SSH 对同一 fixture 得到冲突状态；
- Pilot 对 v1 现场产生写入；
- CLI 和 DSH 各自实现一套状态判断。

## 6. 开工边界

本计划重写后需要重新 fresh 审核。落盘不构成 DHR_25 开工授权；DHR_25 开工前仍需按 DevHarness 做档位、范围、验收、落点确认。
