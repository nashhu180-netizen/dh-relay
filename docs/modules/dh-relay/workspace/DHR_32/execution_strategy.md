<!-- dh:v1 -->
# DHR_32 · 执行策略

- **派发形态**（`DHR-B-22` 调整③）：施工 = codex `gpt-5.6-terra` + reasoning high，Herdr 交互终端（`agent start --kind codex`），worktree `wt/DHR_32`（`.dh-worktrees/DHR_32`）；主控 `agent wait` 后台监控，`blocked` 时读 pane 裁决。
- **复核**：任务类型 normal → 代码轮 1 + 需求方向 + 教训三路 + 有效单测；复核 worker = claude opus 经 Herdr `pane run` 拉起，侦测型只读（提示词硬约束 + 主控回收后 `git status` 核对零改动），形态如实登记进 review.md。
- **不分批**：本卡单一验收单元（审计 + 注册表一体），做完一次性收口复核。
- **风险预置**：worker 审计凭据目录属敏感操作——白名单已在 brief 冻结；主控收货时先跑一遍凭据扫描再看内容。
- **收口边界**（用户外出）：复核收敛后停在「待人验/待追认」；squash 合入主树按用户 2026-08-29 委托由主控执行并落账；verify 与人类签名区留待用户回归。
