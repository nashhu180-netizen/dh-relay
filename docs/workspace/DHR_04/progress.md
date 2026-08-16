<!-- progress.md — 施工日志 + 证据账本。🟢 边做边记。这是"实际发生了啥"，容忍跑偏——路径偏了记这里，不回写任何计划文档。 -->
# progress — DHR_04 隔离/禁改/落点守卫

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|------|----|---------|------|--------|
| 2026-08-16 | 主控(Claude) | 用户对话授权「用 relay 的方法做 P2 开发，写代码让 grok 进行」；本卡定为 stage0 自举第一张试水卡（只新建独立目录、不碰驱动器本体）。`dh wt new DHR_04` 建树 `.dh-worktrees/DHR_04`（branch `wt/DHR_04`）。 | E-001 | 建 stage0 冻结驱动器 |
| 2026-08-16 | 主控(Claude) | 把 `tools/relay/` @ `34df46a` 整份冻结到 `D:\relay-stage0\`（附 `STAGE0.md` 说明"永不手改"），从冻结副本跑 P1 全量套件验活。 | E-002 | 写接力计划与三份 brief，起 relay 宿主 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|----|------|-----------|------|------|
| E-001 | command | `dh wt new DHR_04` | pass | 任务树 `.dh-worktrees/DHR_04` + 分支 `wt/DHR_04` 起于 master `34df46a` |
| E-002 | command | `pwsh -NoProfile -File D:\relay-stage0\tests\run-relay-tests.ps1` | pass | 冻结驱动器可独立运行：`RELAY ALL PASS (SKIPPED: 1)`；跑的代码与被改的代码物理分离 |
