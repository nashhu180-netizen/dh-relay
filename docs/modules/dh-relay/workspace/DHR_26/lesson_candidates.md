# lesson_candidates · DHR_26

| ID | 候选教训 | 证据 | 状态 |
|---|---|---|---|
| LC-DHR26-01 | 版本锁定必须按包逐一核对，不能把应用 rc 版本复制给 vendor 依赖。 | 草案把 Cordis 4.0.1、Schemastery 3.18.1 误写成 rc.7，安装必失败。 | 待收口复核 |
| LC-DHR26-02 | DSH profile 插件是否会生效由 `dsh.bundle.patch` 决定，只有可安装的 package 仍可能只是普通依赖。 | 上游 `apps/cli/src/plugin.ts` 的 installed-state reconcile。 | 待收口复核 |
| LC-DHR26-03 | DSH one-shot 自动取证应使用 `ctx.appExit`，避免直接 `process.exit` 跳过清理，也避免 watcher 让脚本挂起。 | 上游 `profile-boot.ts` 与 `dsh-cmdline`。 | 待收口复核 |
| LC-DHR26-04 | 连接器环境可以交付可执行施工包和预检，不能代替用户机器的版本、GUI/CLI 与生命周期机器证。 | 当前环境无 dsh、pnpm、PowerShell 和 Windows 实验根。 | 待收口复核 |
