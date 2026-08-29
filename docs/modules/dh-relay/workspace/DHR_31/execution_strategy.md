<!-- dh:v1 · execution_strategy.md — 分工。🟡 开工时定一次。solo 任务可只填操作模型一行。 -->
# execution_strategy — DHR_31 basic-agent-task 端到端闭环

## 操作模型

派子 agent：批 1 派 codex headless worker（zcode 额度已尽，用户 2026-08-28 对话确认；实际执行中 codex 沙箱不能写 Git 元数据，提交由主会话代打，见 F-004）；**批 2 起施工改派 Opus subagent（用户 2026-08-28 追加指示「codex 当前工作完成后，后续你让 opus 施工」）**。主会话留计划层——写施工步骤、收敛复核、跑收口。DSH 插件改造 + 真实渲染截图批 5 也按 Opus 派；若截图取证 worker 做不到，缺口登记 findings 回落用户，不静默跳过。

## 子 agent 授权（若派单）

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---------|---------------------------|--------|
| codex 施工 worker | 可写：`relay-core/`（workflows / runtime validate / e2e 及其测试）、树外 DSH Host Plugin（仅 DHR_49 面板数据源改 Bridge 承接项）、本工作区 `progress.md` / `findings.md`；禁改冻结契约（除非按契约批次流程）、禁写 Store 旁路 | hyf（2026-08-28 开工确认） |
| 复核 subagent / codex 只读 | 只读全仓；结论写 `review.md` 对应轮次区 | 委托确认（按默认） |
| E4/E5/E14/E6/E7 委托 subagent | 只读 + 各自结论登记位 | 委托确认（按默认） |

## 收尾铁律

- 证据不全 / 有 P0–P1 未关闭前，不许标"待验收"。
- 子 agent 默认无写权，要人批准。
