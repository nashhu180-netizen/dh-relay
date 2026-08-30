<!-- dh:v1 -->
# DHR_66 · Codex nonsecret /profiles projection — Brief

> 出处（唯一权威）：[P6 开发方案](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md) §3.2 DHR_66。本文件是只读副本；冲突以 DevPlan 为准。
> 档位：标准。任务类型：**light**。
> 开工授权：用户 2026-08-30 明确确认同时启动 DHR66/DHR67，授权至各自 E10 人验准备；不含 verify、合并、推送或部署。

## 目标

仅补齐 `herdr.codex.main` 用户级 registry 已声明为 nonsecret 的 `/profiles` 身份投影，使真实 Attempt 前的 `freezeProfileIdentity` 能冻结既有 Receipt 四字段，不扩大身份合同，也不保存投影值。

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_66 | P6 Herdr 多账号执行底座 | DevPlan §3.2 DHR_66；design/12 P6-RI-A5 |

## 完成条件

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| 1 | 缺失 `/profiles` 时在 Attempt、Agent、pane、Result 前拒绝；修复后 `freezeProfileIdentity` 仍产生 `executor_profile_id`、脱敏 `account_alias`、`config_fingerprint`、`executor_capability_hash` 四字段，工件仅含 hash、错误码与脱敏摘要。 | machine | DHR_66；P6-RI-A5 |
| 2 | `/profiles` 未声明 nonsecret、pointer 坏/不安全或值不可证时 fail-closed。 | machine | DHR_66 |
| 3 | 投影值、配置正文与凭据零进入工件。 | machine | DHR_66 |

## 边界

- In scope：`~/.dh-relay/executor-profiles.json` 中已经声明 nonsecret 的 `/profiles` 元数据，以及本工作区。
- Out of scope：凭据、Token、Cookie、产品配置正文或投影值；登录；registry schema/validator；仓内生产代码、fallback、Runtime、Store、RPC、Result、Herdr、DHR35 与真实 Agent。
- 必须停止：`/profiles` 未声明 nonsecret、pointer 不安全/不可证，或完成条件需要改变 schema、validator、Receipt 四字段或仓内生产代码。

## 触及子系统

无；本卡只维护仓外已有 registry 的已声明 nonsecret 元数据，未改变仓内子系统实现或设计契约。
