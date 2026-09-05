# E-7529 DHR_75 真实机器证 F 判定

- 环境：Windows、Herdr 0.8.2、`HERDR_ENV=1`、DSH-off、冻结 Profile `herdr.codex.main`、候选 `wt/DHR_75@e835edb`。
- 真实入口：复用 DHR_72 已审计的 `run-windows-checkpoint.ps1`，仅把 Relay 代码根改指 DHR_75 worktree；未 mock Herdr、Profile、Host lease 或 Store。
- 结果：**fail**。事件账只有 `run_created → lease_acquired → operation_committed → node_started → attempt_started`，`host_observation_changed` 为 0。
- 时间线：`lease_acquired=2026-09-04T18:08:46.739Z`；`lease_expires_at=2026-09-04T18:09:01.713Z`；`attempt_started=2026-09-04T18:09:07.076Z`。取得 lease 到 attempt 为 20,337ms；attempt 发生时 lease 已过期 5,363ms。
- 定向诊断：在同一候选上单独执行 `loadExecutorProfiles()` 两次，分别耗时 19,676ms、19,768ms；均 `ok=true`、登记 Profile 数=5。代码路径显示全表 `validateProfiles(..., resolveAlias:true)` 在 Herdr `launchHerdrAgent()` 之前逐项同步执行 `spawnSync('where.exe', ...)`，所以本次失租发生在 DHR_75 已异步化的 Herdr CLI 被调用之前。
- 覆盖结论：DHR75-F=`不满足`。这份真实失败不能被 A~E 的子进程证据替代，也不能替代 DHR_72/DHR_35 的真实实录。
- 清理：受控 runner 已关闭新 pane、停止临时 service、清空 fixture 内容；复核时 `dsh_process_count=0`、`fixture_service_count=0`、`live_fixture_agent_count=0`。
- 脱敏：Receipt/Attempt 原值已用不可逆 12 位摘要关联符替换；redactor 再跑为 `distinct_ids_redacted=0`，凭据样式扫描为 0。清单见相邻 `../redaction-manifest.json`。

## 恢复条件

当前冻结允许路径不含 `relay-core/profiles/validate-profiles.mjs` 或 `relay-core/runtime/executors/herdr/profile-registry.mjs`。须先经 B-adjust 明确由哪张卡消除“全表同步 alias 校验饿死 15s Host lease”，再用同一真实入口重跑；不得用延长 TTL、修改用户 registry 或单 Profile mock 冒充通过。
