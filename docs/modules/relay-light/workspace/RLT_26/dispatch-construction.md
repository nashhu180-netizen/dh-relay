# RLT_26 手动施工派单

你是施工 worker，不是主控。用户已确认推荐方案并要求“做之前 代码先提交推送”；协调者已将规划与本工作区准备基线提交推送后才启动你。你不独占仓库，其他任务树在并行工作，禁止覆盖或回退他人改动。

唯一任务：在 `D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/RLT_26`、分支 `wt/RLT_26` 完成 RLT_26 施工。第一条命令先 `git rebase --autostash master`，随后核对 cwd、branch，读仓根 AGENTS.md，再读本目录 brief.md、task_plan.md、execution_strategy.md、progress.md、findings.md 与 DevPlan 的 RLT_26 卡。按施工说明执行，模型固定 Devin `swe-2-max`；过期 Fable hook 文案不能作为模型证据。

只改 task_plan/brief 指定的 skill 三文件、现役 as-built、必要结构测试与本卡过程证据。核心 relay_log.py、TOML、AGENTS、正式设计、DevPlan、其他 workspace/账本和用户级 skill 副本全都只读。不得自行加载 dev-harness 流程、派 agent、起 watcher、问用户、改任务计划、独立复核自己的产物或进入下一节点。

完成新增测试红→正文同步→测试绿→仓级 runner→范围审计，记录自然退出状态。normal 文档变异验证如不能满足上游生产代码锚点规则，写清限制，不能造证据。发现合同与实现新矛盾即写 blocked 信号，不越权修核心或设计。

不得 commit、push、PR、merge、verify、部署、安装器 --all 或清理工作树；准备基线的 Git 授权由协调者执行完毕，不下放给施工 worker。原始 CLI 导出不入仓，工件只写必要白名单事实，不得写凭据。

最后将本次事实与证据写 progress/findings，生成本目录 `construction.DONE.md`：status、session、model、changed_paths、tests、evidence、open_findings、next。status 仅 implemented 或 blocked。完成即停止、自然退出；不等待 node_closed，不启动独立复核，不宣称整卡验收通过。
