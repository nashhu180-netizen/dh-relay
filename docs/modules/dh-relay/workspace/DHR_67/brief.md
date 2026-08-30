<!-- dh:v1 -->
# DHR_67 · Windows Claude supported Herdr launch — Brief

> 出处（唯一权威）：[P6 开发方案](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md) §3.2 DHR_67。本文件是只读副本；冲突以 DevPlan 为准。
> 档位：标准。任务类型：**heavy**。
> 开工授权：用户 2026-08-30 明确确认同时启动 DHR66/DHR67，授权至各自 E10 人验准备；不含 verify、合并、推送或部署。

## 目标

让 Windows Claude Code 经 Herdr 使用受支持的 `pane run → 有界唯一自动识别 → agent rename → 交给既有 Attempt` 启动路径；Codex 继续使用既有 `agent start` 路径。

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_67 | P6 Herdr 多账号执行底座 | DevPlan §3.2 DHR_67；design/12 P6-RI-A4 |

## 完成条件

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| 1 | fake Herdr 证明 Claude 调用顺序、唯一命名与返回 handle 是 `pane run → 唯一识别 → rename`，Codex `agent start` 调用不变。 | machine | DHR_67；P6-RI-A4 |
| 2 | 识别到零/多个对象、识别超时或 rename 失败时，仅关闭本卡创建的同一新 pane，不绑定 Attempt、不创建 Result。 | machine | DHR_67 |
| 3 | 工件、测试夹具与日志不泄露配置正文或凭据；Herdr observation 不生成 Result。 | machine | DHR_67 |

## 边界

- In scope：`herdr-cli.mjs`、`herdr-executor.mjs`、Herdr adapter/fake helper 测试、`relay-core/package.json` 及本工作区，且仅限 DevPlan 的精确允许路径。
- Out of scope：用户 registry、产品配置与凭据；profile registry、workflow driver、Store、RPC、contracts、Receipt/Result 语义；DHR35 真实 Agent 与 Linux。
- 必须停止：无法由受支持 CLI 在有界时间内唯一识别、rename 或关闭同一新 pane；或需要引入 status/pane 文本/exit code → Result 推导、扩大到 driver/Store/RPC/contracts。

## 触及子系统

- [as-built/relay-core.md](../../as-built/relay-core.md)
