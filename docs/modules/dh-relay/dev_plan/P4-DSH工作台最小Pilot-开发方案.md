# P4 DSH 工作台最小 Pilot 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:status
汇报: DSH 阶段主线第一阶段已落盘，待 fresh 交叉审核；未授权任何卡开工
现状: DHR_25~27 均未开始
进行到: P4 ▸ B 方案待审核
下一步: fresh reviewer 审核本计划，用户另行决定是否授权 DHR_25
看什么: design/05、design/evidence/05、design/evidence/06、dev_plan/README.md
阻塞: 无前置阶段；存在用户开工确认闸
-->

## 0. 定位

P4 只回答一个问题：DeepSeek Harness 能否在用户的 Windows 主机上，以树外插件方式承载 dh-relay 的工作台外壳，并且不要求 fork DSH、不污染 Relay 运行真相。

P4 是限时 Pilot，目标工作量按 2~3 个有效开发日控制。超出范围的能力必须停止并记入后续计划，不能为了展示完整产品而扩张 Pilot。

本计划承接：

- [design/05](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md)
- [Claude 交叉审核](../design/evidence/05-DSH插件化-对05方案的评估意见-待第三方评估.md)
- [第三方裁决](../design/evidence/06-DSH插件化-第三方裁决与阶段主线.md)

## 1. 交付范围

交付：

1. 固定 DSH `dsh-v0.1.0-rc.7@99f6f02` 的独立测试环境。
2. 一个树外 Bundle，包含最小 Host Plugin 与 Client Plugin。
3. DSH 页面中一个 Relay Pilot 面板。
4. 面板能够渲染一条 fake run 和一条现役 v1 历史 run 的只读投影。
5. DSH Native Agent 能生成一次非权威的接力计划 Proposal，证明它可以承担未来棒 0 的候选角色。
6. 一份 Pilot 报告，明确继续、调整或停止。

不交付：

- relay/v2 完整协议；
- Detached Relay Runtime；
- Workflow Contract、Executor Profile 正式实现；
- Herdr Adapter；
- DevHarness S0~E13；
- E11/E12/E13；
- Named Pipe 或 Unix Domain Socket；
- 完整工作台首页、项目管理、流程编辑器；
- Linux 完整闭环；
- agent-console 迁移或删除。

## 2. 实施边界

Pilot 代码放在 dh-relay 仓外的独立实验目录或独立树外插件仓。不得修改 DeepSeek Harness 上游源码。

建议结构：

```text
<experiment-root>/dsh-relay-pilot/
  package.json
  cordis.patch.yml
  src/host/
  src/client/
  testdata/
```

DSH 使用独立 Home：

```text
<experiment-root>/dsh-home/
```

Pilot 只读以下数据：

```text
fake run fixture
<repo>/.dh-runtime/relay/ 的 v1 历史现场
```

Pilot 不写 v1 现场，不创建 v2 Run，不改业务仓 DevPlan 和 workspace。

## 3. 任务表

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位 | 状态 | 依赖 | 工作区 | 验收时间 · verify SHA |
|---|---|---|---|---|---|---|
| DHR_25 | 冻结 DSH Pilot 环境与 Windows 基线 | 轻 | 未开始 | - | <开工时回填> | |
| DHR_26 | 建树外 Host/Client Plugin 并渲染 fake run | 标准 | 未开始 | DHR_25 | <开工时回填> | |
| DHR_27 | 接现役 v1 只读投影、试跑棒 0 Proposal 并完成 Pilot 裁决 | 标准 | 未开始 | DHR_26 | <开工时回填> | |

### DHR_25：Pilot 环境与基线

目标：

- 固定 DSH tag、commit、Node、pnpm 与独立 DSH Home。
- 记录 Windows 安装、启动、停止、资源占用和版本信息。
- 建立可重复执行的启动说明，不依赖用户日常 DSH 配置。

机器验收：

- `dsh --profile <pilot-profile>` 能启动 Web UI。
- Pilot Home 与日常 Home 物理分离。
- 配置中不出现真实凭据值。
- 停止 DSH 后无遗留 Pilot 子进程。

### DHR_26：树外插件与 fake run

目标：

- 提供最小 `ctx.relayPilot` Host Service。
- 通过 Client Plugin 和 UI Slot 增加一个 Relay Pilot 面板。
- Bundle 能安装、启用、禁用和卸载。
- 面板渲染固定 fake run 的节点、状态和 Attention 数量。

机器验收：

- 不修改 DSH 上游仓库即可加载 Host 与 Client Plugin。
- 插件卸载后服务、事件和 UI 注册均被清理。
- 浏览器刷新和 DSH 重启后，fake run 从 fixture 重新构建，结果一致。
- Host/Client 之间只传普通 JSON 数据，不传 Cordis 内部对象。

### DHR_27：v1 只读桥接与棒 0 试验

目标：

- 读取一条现役 v1 历史 run，投影为 Pilot 页面可展示的统一结构。
- 验证 DSH Native Agent 能读取冻结输入并输出结构化 `plan-proposal` fixture。
- 形成 Pilot 报告和下一阶段建议。

棒 0 试验只允许输出 Proposal：

```text
任务摘要
候选节点
建议执行角色
依赖
未决问题
```

它不得写 Relay state、业务仓工件或执行命令。

机器验收：

- v1 现场零写入，前后哈希一致。
- fake run 与 v1 run 使用同一 UI 读模型。
- DSH 重启后仍能重建 v1 展示。
- Proposal 满足 schema fixture，缺字段和多余执行字段被拒。

## 4. P4 阶段闸

### 机器闸 P4-M

以下项目全部通过：

| ID | 命题 |
|---|---|
| P4-M1 | Windows 上树外 Host 与 Client Plugin 均可加载 |
| P4-M2 | Bundle 可安装、禁用、卸载，资源清理可证明 |
| P4-M3 | fake run 可渲染，浏览器刷新与 DSH 重启后结果一致 |
| P4-M4 | v1 历史现场只读投影成功，零写入 |
| P4-M5 | DSH Native Agent 能生成受 schema 限制的非权威 Proposal |
| P4-M6 | 全程不 fork DSH，不引入 Relay 运行写权 |

### 人类闸 P4-H

用户实际查看页面和运行方式后判断：

1. DSH 作为个人工作台外壳是否值得继续。
2. 外部插件页面的交互和视觉是否达到可继续投入的最低线。
3. 启动、工作区选择和页面恢复是否可以接受。

### 解锁规则

只有 P4-M 全部通过、P4-H 有明确结论，并且用户在对话中明确同意进入 P5，`P5-Relay-v2持久内核与DSH桥接` 才解除阻塞。

Pilot 判否时：

- 保留实验记录；
- 不继续 P5~P9；
- 恢复独立 Relay + agent-console 路线的评估；
- 不把 Pilot 失败包装成局部通过。

## 5. 风险与止损

出现以下任一情况时停止扩张并进入 Pilot 裁决：

- 树外 Client Plugin 必须修改上游代码才能工作；
- Windows 下 Profile 或插件生命周期不稳定；
- 单个最小 UI 面板就要求大范围依赖 DSH 内部未公开模块；
- DSH 重启后无法从普通 JSON fixture 重建页面；
- 2~3 个有效开发日内仍没有可见面板。

## 6. 开工边界

本计划落盘不构成 DHR_25 开工授权。DHR_25 开工前仍需按 DevHarness 做档位、范围、验收、落点确认，并完成 fresh 交叉审核。
