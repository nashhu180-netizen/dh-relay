<!-- dh:design-index:v1 -->
# DH Relay design 入口

## 拆计划依据

<!-- dh:design-inputs:start -->
- [产品设计与验收（P1 已实现基线）](./01-产品设计与验收.md)
- [完整流水 · 产品设计与验收（功能与安全需求基线）](./02-完整流水-产品设计与验收.md)
- [DeepSeek Harness 插件化与专属工作台：目标架构与阶段交付方案](./05-DeepSeek-Harness插件化与专属工作台-可行性评估.md)
- [多控制面、Headless 与 SSH 运行：设计补充](./06-多控制面与Headless-SSH运行-设计补充.md)
<!-- dh:design-inputs:end -->

> 阶段纪律：05 冻结 DSH 优先的工作台路线，06 冻结“DSH 可替换、Relay CLI 必备、Linux Headless/SSH 可运行”的硬约束。发生冲突时，控制面独立性和无头运行边界以 06 为准。P4→P9 继续按阶段闸推进；当前只有 P4 可以进入 fresh 审核，任何任务卡仍需用户另行授权。

## 现役主线

- [DeepSeek Harness 插件化与专属工作台：目标架构与阶段交付方案](./05-DeepSeek-Harness插件化与专属工作台-可行性评估.md)
- [多控制面、Headless 与 SSH 运行：设计补充](./06-多控制面与Headless-SSH运行-设计补充.md)
- [DSH 插件化：第三方裁决与阶段主线](./evidence/06-DSH插件化-第三方裁决与阶段主线.md)
- [DevPlan 阶段入口](../dev_plan/README.md)

## 基线与技术来源

- [产品设计与验收（P1）](./01-产品设计与验收.md)
- [完整流水 · 产品设计与验收（P2 功能需求）](./02-完整流水-产品设计与验收.md)
- [完整流水 · Herdr 底座研究（实施由 P6 接管）](./03-完整流水-Herdr底座-产品设计与验收.md)
- [跨平台运行时与可扩展编排（部分结论由 05/06 继承，Go 锁定和单一控制台结论已被取代）](./04-跨平台运行时与可扩展编排-技术方案评估与决策.md)

## 审核与证据

- [需求讨论与 A/B 交叉审核记录（P1）](./evidence/01-交叉审核记录-接力方案.md)
- [P2 完整流水 · A 交叉审核记录](./evidence/02-交叉审核记录-完整流水.md)
- [Herdr 底座 · preflight 实测与审核记录](./evidence/03-Herdr底座-preflight实测与审核记录.md)
- [流水引擎化 · Codex/Grok 两轮交叉审核记录](./evidence/04-流水引擎化-两轮交叉审核记录.md)
- [Claude 对 05 方案的交叉审核](./evidence/05-DSH插件化-对05方案的评估意见-待第三方评估.md)
- [对 Claude 审核的第三方裁决与阶段主线](./evidence/06-DSH插件化-第三方裁决与阶段主线.md)
- [Claude 对 P4～P8 阶段计划的评估 + pi 替代 DSH 评估（待第三方评估）](./evidence/07-P4至P8阶段计划评估与pi替代评估-待第三方评估.md)
- [Pi Agent 替代 DSH 的独立对比评估](./evidence/08-Pi-Agent替代DSH-独立对比评估.md)
- [P4～P9 阶段计划 · B 交叉审核记录](./evidence/09-P4至P9阶段计划-交叉审核记录.md)
- [P4 多控制面 Pilot 报告](./evidence/10-P4-多控制面Pilot报告.md)
- [CLI 优先编排与节点级双 Agent 监控 · 方向评估报告](./evidence/11-CLI优先编排与节点级双Agent监控-方向评估报告.md)

## 冻结说明

- 原 `P2-完整流水-开发方案.md` 已冻结。DHR_04 成果保留，其余旧任务停止生效。
- 原 `P3-可配置终端后端与Herdr底座-开发方案.md` 已冻结。Herdr 实施由新 P6 接管。
- 历史全文保留在 Git 历史中，旧任务 ID 不复用。
