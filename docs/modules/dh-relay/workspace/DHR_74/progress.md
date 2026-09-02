<!-- progress.md — DHR_74 施工日志 + 证据账本。construction.DONE 在施工 Node 收口时才写，不预置占位。 -->
# progress — DHR_74

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-03 | 主会话 | 立项：用户对话确认按标准档为 DHR-BL-17 立 DHR_74 专卡（范围=诊断并修复 Store 持久化/测试临时目录争用，修后重跑 DHR_71 门禁）。主控侦察写链（actor 队列 → Store 写队列 → `writeAtomic`）与 DHR_72/73 归属冻结，落 backlog 补录 + DevPlan §3.1/§3.2/卡规格 + 本工作区；开树 `wt/DHR_74` | backlog DHR-BL-17、DevPlan §3.2 DHR_74 | 步骤 1 基线 |
| 2026-09-03 | 主会话 | **派工偏差登记**：本会话 `HERDR_ENV` 为空（不在 Herdr pane），按 `knowledge/herdr-派活操作.md` 前置检查不得从外部调度 herdr——施工由主会话按 brief 边界亲自执行，复核仍 fresh 换人另派；已在 DevPlan 状态行同步登记 | DevPlan §3.1 状态行 | 步骤 1 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 操作 | 退出码 / 结果 | 落点 |
|---|---|---|---|---|
| — | — | （步骤 1 起填） | — | — |
