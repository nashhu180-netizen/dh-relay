<!-- dh:v1 -->
<!-- dh:workspace-contract:v2 -->
# brief — DHR_75 Herdr 异步调用与 Host Lease 续租

## 授权与现场

- 用户于 2026-09-04 对话明文“那请你继续开发”，授权 DHR_75 D-start、独立 worktree 施工及自动收口至 E10。
- 不含：E11 人验裁决、verify、squash/合入、worktree 清理、push、部署、DHR_72 恢复施工或 DHR_35 重跑。
- 计划 worktree：`D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_75`；基线：`master@14008bd`。

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_75 | P6 Herdr 多账号执行底座 | DevPlan §3.2 DHR_75；DHR-B-40；design/12 P6-RI-A3/A4；design/10 HC-3AT-A29、HC-P1-A6、HC-CTRL-H1 |

## 目标 (Outcome)

Herdr CLI 的启动、观察、提示与停止调用保持现有有界失败语义，但不得阻塞 Host lease 续租；合法慢启动期间唯一写者持续持有新鲜 lease，随后能落首条 Host Observation 与 checkpoint。

## Zero-context 自查

执行者只读本文件、`task_plan.md` 与 DevPlan DHR_75 卡即可知道目标、逐项机器证、允许路径、并行 DHR_72 的禁改边界与停止条件；无需依赖对话补全业务合同。

## 完成条件 ★必写

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|---|---|---|
| 1 | **机器证 A（续租不饿死）**：静态与运行时断言生产默认 TTL 仍为 **15,000ms**；在持有 Host actor 的同一 Node 事件循环中注入短 TTL 与真实慢子进程，单次 Herdr CLI 调用跨过至少两个 renew tick。逐次记录调用区间、renew 前后 expiry、竞争取 lease 与首条 observation 的时间线；期间 lease 至少成功续租 2 次，独立 contender 取得同一 Run lease稳定返回 `E_LEASE_HELD`。仅把 TTL 拉长、保留同步阻塞的对照变异不能通过。 | AI | DHR_75 / design/12 P6-RI-A3 |
| 2 | **机器证 B（链路继续）**：同一夹具在慢调用返回后依次落 `host_observation_changed(alive)` 与至少一条 `checkpoint_recorded`；修前对照稳定表现为 lease 过期/无 Host Observation，修后转绿。 | AI | DHR_75 / design/12 P6-RI-A4 前置 |
| 3 | **机器证 C（fencing 不退化）**：由独立 contender 接管并写入新 epoch，或等价地使旧 lease真正失效；旧 actor 的 Host Observation、checkpoint、Result 全部被拒，事件账零双写、零重复 seq，actor 终态为 `lost_lease` 或等价现役拒绝语义。 | AI | DHR_75 / design/12 P6-RI-A3 |
| 4 | **机器证 D（CLI 兼容）**：Herdr 成功、非零退出、超时、signal/启动失败、空 stdout、JSON stderr 错误映射保持现役返回形状与 reason/detail；async spawn 超时后等待 child `close`，并在 Windows 验证该子进程及其后代无残留。 | AI | DHR_75 / 现役 CLI 合同 |
| 5 | **机器证 E（直接回归）**：现役 lease/host、Herdr adapter、DHR_70 submission gate 与 DHR_72 冻结五文件定向回归均有终态；不把 `identity-quota.test.mjs` 的 B-38 旧合同阻塞算成本卡失败或顺手改写。 | AI | DHR_75 / DHR-B-40 |
| 6 | **机器证 F（真实产品边界）**：DSH-off Windows、一个冻结 Codex Profile，至少一次运行在 `attempt_started` 后产生首条 `host_observation_changed`，且该时点 lease 未过期；若进一步取得 checkpoint 只记为本卡佐证，DHR_72 仍须在吸收本卡后独立重跑机器证 F。 | AI | DHR_75 / design/12 P6-RI-A4 前置 |
| 7 | **有效单测**：由第二轮 fresh reviewer 从生产改动选择变异点；登记 reviewer 独立身份、生产代码锚点、指定测试命令、施加前/后/还原后 hash、红/绿退出码与失败摘要。恢复同步阻塞、漏 `await`、或破坏超时清理之一必须使指定测试以断言失败变红。 | AI | DHR_75 / heavy 配方 |

## 边界 (Boundaries)

<!-- dh:allowed-paths:v1 task=DHR_75 -->
- `relay-core/runtime/executors/herdr/herdr-cli.mjs`
- `relay-core/runtime/executors/herdr/herdr-executor.mjs`
- `relay-core/test/dhr75-host-lease-during-herdr.test.mjs`
- `relay-core/test/herdr-adapter.test.mjs`
- `relay-core/test/helpers/fake-herdr-bin.mjs`
- `relay-core/package.json`
- `docs/modules/dh-relay/workspace/DHR_75/**`
- `docs/modules/dh-relay/as-built/relay-core.md`
- `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`
- `docs/modules/dh-relay/dev_plan/README.md`

- In scope：Herdr CLI/adapter 的异步有界调用、Promise 传播、超时清理、续租/fencing/兼容机器证，以及本卡工作区、as-built 与机械状态回填。
- Out of scope：`workflow-driver.mjs`、`host.mjs`、`lease.mjs`、`service.mjs`、`launcher.mjs`、`store/**`、`contracts/**`；DHR_72 的 S1~S4、`:305`、`blocked→done` 语义；quota/fallback、Linux/SSH、用户级配置。
- 何时必须停下问人：实现必须修改禁改路径或产品合同；P0/P1 三轮不收敛；真实运行出现新的安全/权限问题；到达 E10 后等待 E11。

## 触及子系统（收口时更新其 as-built）

- `as-built/relay-core.md`：Herdr CLI 调用边界与超时/清理现状。
