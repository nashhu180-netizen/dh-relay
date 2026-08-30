<!-- dh:v1 -->
# DHR_65 · runtime registry loader fail-closed — Brief

> 出处（唯一权威）：[P6 开发方案](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md) §3.2 DHR_65。本文件是只读副本；冲突以 DevPlan 为准。
> 档位：标准。任务类型：**normal**。
> 开工授权：用户 2026-08-30 明确「继续 DHR65，开worktree，一直到verify」。仅覆盖本卡独立 worktree、允许路径内的 loader/test、定向验证和自动收口；不覆盖真实 Agent、用户级 registry、Linux、DHR_35、push、部署或环境动作。

## 目标

让 runtime registry loader 对 alias 与 config 指纹规则执行与 formal validator 等价的 fail-closed 解析；完整正式 registry 的任一坏 alias/config 必须在 Workflow Driver 创建 Attempt、Agent、pane 或 Result 前被拒绝。

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_65 | P6 | DevPlan §3.2 DHR_65；design/12 P6-RI-A5 |

## 完成条件

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| 1 | 使用完整正式 registry 的结构等价测试副本，任一已登记 Profile 的坏 alias/config 都使 runtime loader 与 driver 在真实启动前 fail-closed；不得用仅含目标 Profile 的局部 registry 替代，工件不得落配置正文或凭据。 | machine | DevPlan DHR_65；design/12 P6-RI-A5 |
| 2 | 好 registry 仍可解析 `herdr.codex.main`、`herdr.claude.main`；坏 registry 不创建 Attempt、Agent、pane 或 Result。 | machine | DevPlan DHR_65 |
| 3 | 对 loader 的 alias-resolve 分支做实现级 mutation，指定测试必须断言失败后还原转绿。 | machine | DevPlan DHR_65 |

## 边界

- In scope：`relay-core/runtime/executors/herdr/profile-registry.mjs`、新建 `relay-core/test/dhr65-registry-loader.test.mjs`、`relay-core/package.json`（B-26 仅接入专属测试）、`knowledge/教训库-候选.md`（B-27 仅追加 miner 候选）、本工作区。
- Out of scope：用户级 registry、Agent 产品配置、凭据、身份/额度选择、Receipt/Store/RPC/Result bridge、DHR_35、Linux、`herdr-executor.mjs`、既有 Profile 校验器、现有测试、contracts/store/rpc/service/workflow-driver 和 CLI。
- 必须停止：若完成条件需要改动 driver/其他运行时文件，或要改变 design/12 契约，则停止并另走 A/B 调整。

## 触及子系统

- [as-built/relay-core.md](../../as-built/relay-core.md)
