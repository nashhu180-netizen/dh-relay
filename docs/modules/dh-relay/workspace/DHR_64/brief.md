<!-- dh:v1 -->
# DHR_64 · Receipt 绑定 Result bridge — Brief

> 出处（唯一权威）：[P6 开发方案](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md) §3.2 DHR_64。本文件是只读副本；冲突以 DevPlan 为准。
> 档位：标准。任务类型：**heavy**。
> 开工授权：用户 2026-08-30 明确确认 DHR64 与 DHR63 同时进行。仅覆盖本卡本地 worktree、生产 bridge、定向测试和自动收口准备；不覆盖用户级 Agent/registry 配置、真实 Agent、Linux、verify、合并、推送、部署或环境操作。

## 目标

实现唯一 Result 成功路径：Receipt 绑定的 `relay.executor-result-submission/v1` 经 v2 `submit-executor-result`、受控 service actor 与可恢复 Store mutation 提交；driver 只等待该提交，缺失时进入 `human_input_requested:E_EXECUTOR_RESULT_MISSING` 与 `waiting_human/needs_you`。

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_64 | P6 Herdr 多账号执行底座 | DevPlan §3.2 DHR_64 |

## 完成条件

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| 1 | 仅当前 Attempt Receipt 接受 submission；仅 committed 同 digest 重复可幂等；其余重复、冲突、旧/fenced/pause/终态/未认证/lease-lost/损坏/截断均不改账。 | AI | design/12 P6-RI-A1/A3 |
| 2 | Result file、事件与 Attempt 状态由同一 recovery journal 原子提交；prepared 强杀点恢复无孤儿/矛盾，Ack 在 committed 后返回。 | AI | DevPlan DHR_64 |
| 3 | service ready 前恢复 receiver/actor/lease/driver gate；失败不得改账或新开 Receipt/Agent/fallback，service 不得绕过 driver gate 直写 Result。 | AI | DevPlan DHR_64 |
| 4 | done、judge、capture、pane、host status、exit code 均不直写结果或触发 quota/fallback；Herdr completion instruction 仅承载 Receipt submission，缺失进入人工等待。 | AI | design/12 P6-RI-A2 |
| 5 | v1 保持 Attention 语义，v2 不静默降级；失败 reason 固定 `E_EXECUTOR_REPORTED_FAILURE`。 | AI | DevPlan DHR_64 |

## 边界

- In scope：既有 `relay-core/contracts/**`、`store/**`、`rpc/**`、service/driver；Herdr completion instruction 仅 `relay-core/runtime/executors/herdr/herdr-executor.mjs`；CLI 仅 `relay-core/cli/client.mjs`、`relay-core/cli/main.mjs`；定向测试/基线仅 `relay-core/test/dhr64-result-bridge.test.mjs`、`relay-core/test/contracts.test.mjs`、`relay-core/package.json`、`relay-core/capability-baseline.json`、`relay-core/tools/capability-baseline.mjs`、`relay-core/tools/structural-tokens.txt` 和本工作区。
- DHR_64 不得改 `relay-core/runtime/executors/herdr/profile-registry.mjs` 或 DHR_65 新测试；未列的 Herdr/CLI/测试路径不因本卡获得写入权限。
- Out of scope：用户级 Agent/registry 配置、真实 Agent、Linux、quota/fallback 重新接线、DHR_35。
- 必须停止：schema、恢复或原因码需要改变设计契约且无法由现有设计证明时，写 findings 并新开设计调整。
