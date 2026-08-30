<!-- dh:v1 -->
# task_plan — DHR_64

## 要读的上下文（Context Packet）

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | DevPlan §3.2 DHR_64；design/12 P6-RI-A1~A3 | Receipt→Result 唯一成功路径和负向边界。 |
| C-002 | DHR_61 contracts/store/rpc 的已合入实现与 workspace evidence | 在冻结协议上扩展，禁止重做身份/pause/retry/recovery 基线。 |
| C-003 | `relay-core/runtime/service.mjs`、`workflow-driver.mjs`、`executors/herdr/herdr-executor.mjs` | 找唯一 gate 并切断宿主观测/judge 直写结果支路；不得触及 DHR_65 的 `profile-registry.mjs`。 |
| C-004 | contracts/store/rpc/runtime 相关测试 | 先红后绿并覆盖 prepared 恢复。 |

## 施工步骤

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 1 | Test · `relay-core/test/dhr64-result-bridge.test.mjs`、`relay-core/test/contracts.test.mjs` | 先写 Receipt mismatch、重复、缺失、v1/v2、prepared recovery 与宿主观测不直写 Result 的失败用例。 | `node --test ...` 先红，失败仅因 bridge 未实现。 |
| 2 | Modify · `relay-core/contracts/**`、`rpc/**` | 实现 Receipt-bound submission 与 v2 RPC，固定拒绝与失败原因，v1 Attention 不降级。 | contracts/RPC 定向测试转绿。 |
| 3 | Modify · `relay-core/store/**`、`runtime/service.mjs` | 一个 journal 原子落 Result、事件、Attempt；committed 后 Ack；恢复 actor/lease/receiver gate。 | prepared 强杀点恢复，无孤儿/矛盾。 |
| 4 | Modify · `workflow-driver.mjs`、`executors/herdr/herdr-executor.mjs`、精确 CLI 路径 | driver 只等待 submission；completion 仅传 submission；封堵 host/judge/capture 直写和 quota/fallback 支路。 | 负例进入人工等待，零 Result 写入。 |
| 5 | Test/Record · 定向测试、workspace 账本 | 跑回归，记录红绿、恢复、扫描和批次小审。 | `git diff --check`、contract audit、测试终态通过。 |

## 关键决策

- Worktree：是；`wt/DHR_64`，`.dh-worktrees/DHR_64`，基线 `33219fe`。
- 派子 agent：是；只执行本 task_plan，不能操作 registry、真实 Agent、Linux 或 DHR_35。
- Review：heavy 的代码轮 1、fresh 代码轮 2、需求、教训、一致性五路；变异点由独立轮 2 选择。
