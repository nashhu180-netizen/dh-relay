<!-- progress.md — 施工日志 + 证据账本。🟢 边做边记。 -->
# progress — DHR_02 实现最小 Runner 与确定性 fake replay

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|------|----|---------|------|--------|
| 2026-08-15 | 主控(Claude) | 用户"开"授权 DHR_02 开工；主控 Code Scout（读 design/01 §3～§4、as-built、contracts 源码与 DHR_01 夹具）后建工作区 8 件套，task_plan 写到 codex 可照做粒度（批A~批D + K-1～K-10 决策 + 数据形状）；DevPlan 回填进行中 | 本工作区文件 + 落户 commit | 建 worktree wt/DHR_02，派 codex 施工 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|----|------|-----------|------|------|
| E-001 | test | `pwsh tools/relay/tests/run-relay-tests.ps1`（master b991b72·开工前主控亲跑） | pass：6 套件 SUITE PASS + `RELAY ALL PASS` exit 0 | DHR_01 基线全绿，本卡不得回归 |
