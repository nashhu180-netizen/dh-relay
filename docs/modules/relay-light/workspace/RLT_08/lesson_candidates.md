<!-- dh:v1 -->
# lesson_candidates — RLT_08

> 仅在施工/复核出现有证据且可复用的现场时追加；W 阶段不预判教训结论。

## 候选

| ID | 触发现场 | 可复用规则候选 | 状态 |
|---|---|---|---|
| LC-1 | B1 红命令在 Linux worktree 首次执行时 `rg: 未找到命令`（环境错误不算 RED） | oracle 机检脚本假定 `rg` 在 PATH；worker 环境缺失时先免 root 补装（`apt download ripgrep && dpkg -x` → `~/.local/bin`），再重跑取红 | 候选 |
