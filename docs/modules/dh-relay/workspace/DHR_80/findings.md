<!-- dh:v1 -->
# findings — DHR_80

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|----|------|------|------|------|------|
| F-8000 | P3 | DHR_79 的独立 worktree/分支仍在，且其最终收口等待 DHR_80；两卡不得共享工作树或混合 staging。 | `git worktree list --porcelain`；DevPlan DHR_80 依赖说明 | DHR_80 使用独立 `wt/DHR_80`；每批审计精确路径，DHR_79 仅作并行边界。 | open |
