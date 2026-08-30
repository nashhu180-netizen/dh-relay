<!-- dh:v1 -->
# DHR_64 · 执行策略

- worker 只在 `.dh-worktrees/DHR_64` 施工，先读仓根 `AGENTS.md`、本 brief、task_plan 与 DevPlan，按先红后绿推进。
- DHR_64 与 DHR_63 并行但不读取、修改或借用用户级 registry；DHR_63 不得接触生产代码。
- 每个独立功能点后跑定向测试、写 progress，安排 fresh 小审；范围外契约问题只写 findings。
- 不运行真实 Agent 或 Windows 实录；未获后续人验授权，不合并、不 verify。
