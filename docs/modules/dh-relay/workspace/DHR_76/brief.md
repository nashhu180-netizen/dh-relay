<!-- dh:v1 -->
<!-- dh:workspace-contract:v2 -->
# brief — DHR_76 完整 Profile 校验非阻塞化

## 授权与现场

2026-09-05 用户对已展示的标准、高危、heavy 开工范围明文“确认”，授权独立 worktree 施工、机器证 A~F 和自动五路复核至 E10。本地合入、verify、清理仍待 E11；不启动下一卡。
基线 master@3243087；worktree=D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_76；branch=wt/DHR_76；client=codex-cli。

## 覆盖任务

DHR_76；唯一权威为 dev_plan/P6-Herdr多账号执行底座-开发方案.md § DHR_76，B-41 已确认。

## 完成条件

| # | 条件 | 谁验（AI / 人） | 出处 |
|---|---|---|---|
| 1 | **机器证 A（全表严格性）**：保留 5 个正式 Profile 与 fallback 关系的结构等价副本；任一 Profile 的 alias/config 失效都在 Attempt、Agent、pane、Result 前以现役错误面 fail-closed。保留非目标坏项，再变异生产代码使其跳过该项、只传目标 Profile 或跳过 fallback 关系时，原测试必须因错误接受而断言失败。 | AI | DHR_76 / B-41 |
| 2 | **机器证 B（调度不饿死）**：默认 TTL 仍为 15,000ms；同一 Host actor 事件循环中，覆盖全部 5 个 Profile 的真实异步子进程探针总时长超过 15 秒，期间 lease 至少续租 2 次、expiry 单调前移、独立 contender 始终得到 `E_LEASE_HELD`。恢复同步等待或只拉长 TTL 的对照变异必须变红。 | AI | DHR_76 / B-41 |
| 3 | **机器证 C（先校验后启动）**：全表校验完成前 Attempt/Agent/pane/Result 全 0；成功后仍解析两个指定 Profile 并只启动所选 Profile。单 alias 子进程/整轮/清理宽限/测试外层上限分别冻结为 15s/60s/10s/120s；spawn error、非零、signal、超时或空结果保持 `E_BAD_VALUE:PROFILE_REGISTRY`，detail 含 `E_UNRESOLVED_ALIAS`，无部分启动。 | AI | DHR_76 / B-41 |
| 4 | **机器证 D（fencing、停止竞态与清理）**：校验期间发生 epoch 接管时旧 actor 后续结果与启动动作均拒绝、零双写；`driver.stop()` 在 await 期间发生时，校验返回后、`openAttempt()` 前复查 stopping，Attempt/Agent/pane/Result 全 0。探针自身超时后等待 child close，Windows 子进程及后代无残留；不新增 stop 取消启动前探针语义。 | AI | DHR_76 / B-41 |
| 5 | **机器证 E（直接回归与有效单测）**：profiles validator、DHR_65 loader、identity/profile、Host lease、DHR_75 专项和 Herdr adapter 定向回归均有终态，禁止改断言迁就实现；第二轮 fresh reviewer 选生产变异点，登记锚点、命令、前后/还原 hash、红绿退出码和失败摘要。 | AI | DHR_76 / B-41 |
| 6 | **机器证 F（真实产品边界）**：本卡自己的 DSH-off Windows 基线上，用完整真实 registry 和冻结 Codex Profile 跑一次；`attempt_started` 时 lease 未过期且随后出现首条 `host_observation_changed`，证据脱敏、零凭据。不得替代 DHR_75 吸收后的重跑或 DHR_72/DHR_35 专属实录。 | AI | DHR_76 / B-41 |

## 任务合同逐字副本


- **目标**：完整 Executor Profile registry 的 alias/config 严格校验仍在真实启动前 fail-closed，但 alias 探针不得以同步子进程阻塞 Host lease 调度；合法慢探针期间唯一写者持续持有新鲜 lease，校验成功后才可进入 Attempt/Agent/pane 链。
- **非目标**：不延长默认 15,000ms lease TTL，不放宽 `writeGuard`、epoch fencing 或接管条件；不改 registry schema、Profile 字段、fallback 图、Receipt/Result/Event/RPC/reason code；不只校验目标 Profile、不复用未经本次完整验证的陈旧成功、不把坏项降级成 warning；不改用户级 registry、产品配置或凭据；不改 DHR_75 Herdr CLI、DHR_72 持续观察、DHR_73 调查或 DHR_35 闭环；不跑 Linux/SSH。
- **验收口径**：
  - **机器证 A（全表严格性）**：保留 5 个正式 Profile 与 fallback 关系的结构等价副本；任一 Profile 的 alias/config 失效都在 Attempt、Agent、pane、Result 前以现役错误面 fail-closed。保留非目标坏项，再变异生产代码使其跳过该项、只传目标 Profile 或跳过 fallback 关系时，原测试必须因错误接受而断言失败。
  - **机器证 B（调度不饿死）**：默认 TTL 仍为 15,000ms；同一 Host actor 事件循环中，覆盖全部 5 个 Profile 的真实异步子进程探针总时长超过 15 秒，期间 lease 至少续租 2 次、expiry 单调前移、独立 contender 始终得到 `E_LEASE_HELD`。恢复同步等待或只拉长 TTL 的对照变异必须变红。
  - **机器证 C（先校验后启动）**：全表校验完成前 Attempt/Agent/pane/Result 全 0；成功后仍解析两个指定 Profile 并只启动所选 Profile。单 alias 子进程/整轮/清理宽限/测试外层上限分别冻结为 15s/60s/10s/120s；spawn error、非零、signal、超时或空结果保持 `E_BAD_VALUE:PROFILE_REGISTRY`，detail 含 `E_UNRESOLVED_ALIAS`，无部分启动。
  - **机器证 D（fencing、停止竞态与清理）**：校验期间发生 epoch 接管时旧 actor 后续结果与启动动作均拒绝、零双写；`driver.stop()` 在 await 期间发生时，校验返回后、`openAttempt()` 前复查 stopping，Attempt/Agent/pane/Result 全 0。探针自身超时后等待 child close，Windows 子进程及后代无残留；不新增 stop 取消启动前探针语义。
  - **机器证 E（直接回归与有效单测）**：profiles validator、DHR_65 loader、identity/profile、Host lease、DHR_75 专项和 Herdr adapter 定向回归均有终态，禁止改断言迁就实现；第二轮 fresh reviewer 选生产变异点，登记锚点、命令、前后/还原 hash、红绿退出码和失败摘要。
  - **机器证 F（真实产品边界）**：本卡自己的 DSH-off Windows 基线上，用完整真实 registry 和冻结 Codex Profile 跑一次；`attempt_started` 时 lease 未过期且随后出现首条 `host_observation_changed`，证据脱敏、零凭据。不得替代 DHR_75 吸收后的重跑或 DHR_72/DHR_35 专属实录。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_76 -->
  - `relay-core/profiles/validate-profiles.mjs`
  - `relay-core/runtime/executors/herdr/profile-registry.mjs`
  - `relay-core/runtime/workflow-driver.mjs`
  - `relay-core/test/dhr76-profile-validation-lease.test.mjs`
  - `relay-core/test/dhr65-registry-loader.test.mjs`
  - `relay-core/test/profiles.test.mjs`
  - `relay-core/package.json`
  - `docs/modules/dh-relay/workspace/DHR_76/**`
  - `docs/modules/dh-relay/as-built/relay-core.md`
  - `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`
  - `docs/modules/dh-relay/dev_plan/README.md`

  **限定**：runtime 只改为非阻塞、自身有界的完整 registry 校验，保留 CLI/静态入口兼容，校验不得挪到 Attempt 之后。`workflow-driver.mjs` 只允许在 loader await 后、`openAttempt()` 前复查既有 `stopping`；禁止向探针传取消信号，禁止改轮询、Result、lease、recovery 或其它启动语义。`host.mjs`、`lease.mjs`、`herdr-cli.mjs`、`herdr-executor.mjs`、`service.mjs`、`launcher.mjs`、`store/**`、`contracts/**`、用户级 registry 均只读；若必须扩大，停止并重新 B-adjust。
- **档位**：标准（Runtime/Profile 安全前置与 Host lease 组件接线，高危）。
- **任务类型**：重核<!-- dh:task-type:v1 task=DHR_76 type=heavy -->
- **依赖**：DHR_65、DHR_70（均已完成）。须另行 D-start；本次 B-adjust 不授权施工、真实 Agent、E11/verify 或合入。


