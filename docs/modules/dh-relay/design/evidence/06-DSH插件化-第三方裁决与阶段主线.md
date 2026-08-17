<!-- dh:v1 -->
# DSH 插件化：第三方裁决与阶段主线

> 状态：设计裁决记录。本文记录对 Claude 交叉审核的逐条判断，以及用户 2026-08-18 对主线的最新选择。本文只授权文档收束，不授权任何生产代码任务开工。
>
> 审核对象：[05-DeepSeek Harness 插件化与专属工作台](../05-DeepSeek-Harness插件化与专属工作台-可行性评估.md)
>
> 交叉审核：[05-DSH插件化-对05方案的评估意见](./05-DSH插件化-对05方案的评估意见-待第三方评估.md)
>
> 用户方向：将 DSH 路线作为目标方案，采用分阶段交付。上一阶段真实跑通并经用户放行，是下一阶段解除阻塞的必要条件。原 P2 冻结，后续能力拆成多份 DevPlan。

## 1. 总裁决

采用以下主线：

```text
DeepSeek Harness
  承担专属工作台、插件平台、交互与可视化

Relay Bridge
  承担 DSH 与独立 Relay Runtime 的协议适配

Detached Relay Runtime
  承担持久工作流、恢复、授权、状态、Outbox 与确定性执行

DevHarness
  承担开发领域 Workflow Contract、Gate 和业务仓工件规则

Herdr
  承担 Codex、Claude Code 等外部交互式施工 Agent
```

第一阶段采用 design/05 的方案 C。DSH 是目标产品外壳，Relay Runtime 在阶段验证期间保持独立。原生 TypeScript Relay Service 保留为后续证据触发的候选，不作为当前起步点。

交付方式从一份大型 P2 改为六份阶段计划：

```text
P4 DSH 工作台最小 Pilot
  ↓ 通过阶段闸并由用户放行
P5 Relay v2 持久内核与 DSH Bridge
  ↓
P6 Herdr 多账号执行底座
  ↓
P7 DevHarness 单卡完整流水
  ↓
P8 多卡编排与运行治理
  ↓
P9 双平台定型与迁移
```

任何后续计划即使已经落盘，在前置阶段未通过时仍处于 `blocked-by-phase-gate`，不能开工。

## 2. 对 Claude C1 至 C7 的裁决

| 编号 | 裁决 | 处理 |
|---|---|---|
| C1 计划堆叠、交付为零 | 采纳 | 冻结旧 P2/P3，停止并列推进。新主线分成六个阶段，每阶段交付可运行结果并设置硬闸。 |
| C2 POC-2 前置被低估 | 采纳 | 拆成 P4 的 v1/fake 只读桥接，以及 P5 的 v2 Contract/Profile/ResolvedPlan。Pilot 不等待完整 P2。 |
| C3 当前更缺流水 | 采纳 | P4 UI 只做最小面板和读模型，不建设完整工作台首页。P5 起优先建设持久 Runtime，再扩 UI。 |
| C4 continuable 子 Agent 被低估 | 部分采纳 | 该能力提高原生 TypeScript 方案的长期价值，也可服务规划、诊断等 DSH Native 节点。它仍缺少整张受控图的检查点、Authority、Attempt、迟到结果隔离、Outbox 与 Finalizer 恢复，当前不足以取代 Relay Runtime。 |
| C5 Windows 树外插件风险 | 采纳 | P4 以 Windows 为第一主平台，先验证树外 Host/Client Plugin、Profile、重启和卸载。Linux 完整闭环放到 P9，P6 可提前做 Herdr 能力探测。 |
| C6 Client UI 易被 RC 打碎 | 采纳 | 所有 DSH import 集中在 Bridge 兼容层；P4 必须使用树外插件；P9 必须实际跨一个 DSH 版本做兼容复验。 |
| C7 04 与 05 主线冲突 | 采纳 | 05 升为目标架构。04 中 Workflow Contract、受控图、Gate Adapter、Herdr、Outbox、三类真相继续有效；Go 锁定和 agent-console 主控制台两项由 05 取代。 |

## 3. 对 Claude 建议顺序的调整

Claude 建议先做 Pilot，再单独完成旧 `DHR_05`。这里做一项调整：

- 不恢复旧 P2 的 `DHR_05` 为独立主线任务。
- `relay/v2` 中对所有路线都有价值的最小身份链、JSON 协议和只读投影，吸收到新 P5。
- Pilot 只消费现役 v1 现场和 fake run，避免为了接 UI 先完成一截完整流水。
- P5 在 P4 通过后建设平台无关协议和持久 Runtime，避免把旧 PowerShell 文件切分直接搬进新架构。

这样保留了 Claude 提醒的协议先行价值，同时避免重新激活已经与 DSH 主线不一致的旧计划。

## 4. 旧计划处置

### P2

`P2-完整流水-开发方案.md` 冻结为历史基线：

- `DHR_04` 已完成成果继续有效，作为策略和迁移 Oracle。
- 其余未开工卡停止生效，不再按原依赖链开工。
- 旧任务 ID 不复用。
- 旧计划中的功能要求按责任映射进入 P5 至 P8。

### P3

`P3-可配置终端后端与Herdr底座-开发方案.md` 同步冻结：

- Herdr 方向继续采用。
- 原三卡 PowerShell/psmux 前提不再作为实施主线。
- Herdr Adapter、Profile、状态观测和真实施工验证由新 P6 接管。
- 旧任务 ID 不复用。

## 5. 阶段闸纪律

每个计划必须同时满足四个条件，下一计划才可解除阻塞：

1. 计划自己的机器验收全部通过。
2. 计划要求的人类体验或方向判断已经记录。
3. 失败、风险和未验证项已诚实列出，不用后续计划掩盖当前缺口。
4. 用户在对话中明确同意进入下一阶段。

阶段闸不允许以下做法：

- 以前置阶段基本可用为理由，提前并行开发后续承重能力。
- 把后续计划的实现反向塞入当前阶段，让 Pilot 失去限时和止损意义。
- 只通过 fake 或静态文档即宣称真实体验闸通过。
- 因用户已经选择 DSH 总方向，就默认所有 P4 至 P9 均已授权开工。

## 6. 当前唯一可进入审核的计划

当前只有 `P4-DSH工作台最小Pilot-开发方案.md` 可以进入 fresh 交叉审核。它仍需用户另行授权具体任务卡开工。

P5 至 P9 可以作为路线图和后续计划预先落盘，但状态必须为 `blocked-by-phase-gate`。它们的任务内容允许在前一阶段回流证据后做 B-adjust，不能把预写计划当成不可修改承诺。

## 7. 对设计文件的影响

- design/05 成为目标架构与阶段主线。
- design/01 继续作为 P1 已实现基线。
- design/02 继续作为完整流水的功能与安全需求来源，原实现切分不再绑定新计划。
- design/03 降为 Herdr 研究和机器证据来源，其实施由 P6 重新承接。
- design/04 降为技术决策来源，保留被 05 明确继承的部分。

## 8. 本次裁决未决定的事项

以下事项继续由阶段证据决定：

- Detached Relay Runtime 最终使用 Go 还是独立 TypeScript 进程。
- DSH continuable Agent 能承担多少规划、诊断和轻量执行节点。
- Herdr 在 Linux 与 Windows 上的最终能力差异。
- agent-console 最终缩为启动器、WebView 壳，或停止开发。
- DSH 上游接口能否在连续版本升级后由兼容层稳定收束。

这些不确定项都有明确阶段落点，不阻塞 P4。
