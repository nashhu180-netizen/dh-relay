<!-- progress.md — 施工日志 + 证据账本。边做边记；跑偏记这里，不回写计划文档。 -->
# progress — DHR_70

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-01 | 主会话 | D-start：用户「开工授权」+ 点选开树 / 本会话自干 / 委托沿用默认；主树建 v2 七件套骨架、冻结施工合同 | — | 切 `wt/DHR_70`，按 task_plan 第 1 步只读侦察 |

## 证据账本 (Evidence Ledger)

<每条"完成"结论挂一条可复跑的命令 / grep / runtime 输出。类型枚举含 `review-dispatch` / `session-run`（大小写精确）。>

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|---|---|---|---|---|
| E-7001 | | | | |
| E-7002 | test | `node --test relay-core/test/dhr70-submission-gate.test.mjs`（A1/A2 用例） | 待跑 | 非终态 + current Receipt 的晚交能落地（P6-RI-A1） |
| E-7003 | test | 同上（A3 三条负例：真 lease-lost / 非 current Receipt / 已终态） | 待跑 | 无合法 lease 一律拒绝且零 mutation（P6-RI-A3） |
| E-7004 | test | 同上（C 用例：agent idle ∧ paneGet 失败） | 待跑 | `pane_get=error` 不单独判死 Attempt |
