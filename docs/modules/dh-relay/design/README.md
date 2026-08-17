<!-- dh:design-index:v1 -->
# DH Relay design 入口

## 拆计划依据

<!-- dh:design-inputs:start -->
- [产品设计与验收（P1 已实现基线）](./01-产品设计与验收.md)
- [完整流水 · 产品设计与验收（功能与安全需求基线）](./02-完整流水-产品设计与验收.md)
- [DeepSeek Harness 插件化与专属工作台：目标架构与阶段交付方案](./05-DeepSeek-Harness插件化与专属工作台-可行性评估.md)
<!-- dh:design-inputs:end -->

> 阶段纪律：05 已成为目标架构输入，但只允许按 P4→P9 阶段闸推进。当前只有 P4 可以进入 fresh 审核；P5~P9 在前置阶段未通过且用户未明确放行时禁止开工。现役计划入口见 [dev_plan/README.md](../dev_plan/README.md)。

## 现役主线

- [DeepSeek Harness 插件化与专属工作台：目标架构与阶段交付方案](./05-DeepSeek-Harness插件化与专属工作台-可行性评估.md)
- [DSH 插件化：第三方裁决与阶段主线](./evidence/06-DSH插件化-第三方裁决与阶段主线.md)
- [DevPlan 阶段入口](../dev_plan/README.md)

## 基线与技术来源

- [产品设计与验收（P1）](./01-产品设计与验收.md)
- [完整流水 · 产品设计与验收（P2 功能需求）](./02-完整流水-产品设计与验收.md)
- [完整流水 · Herdr 底座研究（实施由 P6 接管）](./03-完整流水-Herdr底座-产品设计与验收.md)
- [跨平台运行时与可扩展编排（部分结论由 05 继承，Go 锁定和 agent-console 主控制台结论已被取代）](./04-跨平台运行时与可扩展编排-技术方案评估与决策.md)

## 审核与证据

- [需求讨论与 A/B 交叉审核记录（P1）](./evidence/01-交叉审核记录-接力方案.md)
- [P2 完整流水 · A 交叉审核记录](./evidence/02-交叉审核记录-完整流水.md)
- [Herdr 底座 · preflight 实测与审核记录](./evidence/03-Herdr底座-preflight实测与审核记录.md)
- [流水引擎化 · Codex/Grok 两轮交叉审核记录](./evidence/04-流水引擎化-两轮交叉审核记录.md)
- [Claude 对 05 方案的交叉审核](./evidence/05-DSH插件化-对05方案的评估意见-待第三方评估.md)
- [对 Claude 审核的第三方裁决与阶段主线](./evidence/06-DSH插件化-第三方裁决与阶段主线.md)

## 冻结说明

- 原 `P2-完整流水-开发方案.md` 已冻结。DHR_04 成果保留，其余旧任务停止生效。
- 原 `P3-可配置终端后端与Herdr底座-开发方案.md` 已冻结。Herdr 实施由新 P6 接管。
- 历史全文保留在 Git 历史中，旧任务 ID 不复用。
