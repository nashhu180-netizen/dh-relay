<!-- progress.md — 施工日志 + 证据账本。🟢 边做边记。 -->
# progress — DHR_03 接真实可见 psmux 并完成阻塞接力 dogfood

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|------|----|---------|------|--------|
| 2026-08-15 | 主控(Claude) | 用户对话"继续DHR3"= 开工授权；主控 Code Scout（读 design/01、as-built、runner/adapter/schema 源码、dispatch-launch psmux helper）+ **本机 psmux/orca 原语实测**（S1～S6：精确匹配、`kill-session -t =name` 静默无效坑、set-titles+attach 可见窗口 EnumWindows 可证、orca 运行时在线）；建工作区 8 件套，task_plan 写到 worker 可照做粒度（批0～批E + K-1～K-15）；DevPlan 回填进行中 | 本工作区文件 + 落户 commit | 建 worktree wt/DHR_03 → 批0 preflight 主控亲跑 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|----|------|-----------|------|------|
| E-001 | test | `pwsh tools/relay/tests/run-relay-tests.ps1`（master ef73aea·开工前基线，落户后主控亲跑） | （待跑） | DHR_01/02 11 套件基线全绿，本卡不得回归 |
| E-002 | observed | 主控 psmux 原语实测（临时会话 RELAY-PF-PROBE-1/2，已清理）：`list-sessions -F` 三段/`list-panes -F` 八段可解析；`has-session -t <前缀>` exit 1；**`kill-session -t =<name>` exit 0 但会话仍在**；裸名 kill 后 has-session exit 1、pane 进程消失、attach 客户端进程退出；`set-titles-string RELAY:#S` + `Start-Process psmux attach` → EnumWindows 找到标题全等可见窗口（owner=WindowsTerminal）、attached=1、list-clients 有行 | observed | task_plan「主控 Code Scout 实测事实」S1～S5 |
