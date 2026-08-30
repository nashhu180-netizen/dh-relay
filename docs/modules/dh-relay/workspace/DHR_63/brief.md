<!-- dh:v1 -->
# DHR_63 · 受限 registry 非敏感维护 — Brief

> 出处（唯一权威）：[P6 开发方案](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md) §3.2 DHR_63。本文件是只读副本；冲突以 DevPlan 为准。
> 档位：标准。任务类型：**normal**。
> 开工授权：用户 2026-08-30 明确「启动63」并确认与 DHR_64 同时进行。仅覆盖本卡本地 worktree、已冻结 registry 非敏感维护、定向验证和自动收口准备；不覆盖 DHR_35、真实 Agent、Linux、凭据读取、verify、合并、推送、部署或环境动作。

## 目标

只维护用户级 `~/.dh-relay/executor-profiles.json` 中两个已冻结 Windows Executor Profile 的非敏感元数据，恢复 Codex 与 Claude CLI/config 指纹规则的可解析性，并证明任一坏条目仍使整个 registry fail-closed。

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_63 | P6 Herdr 多账号执行底座 | DevPlan §3.2 DHR_63 |

## 完成条件

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| 1 | 目标 Profile 不再返回 `E_UNRESOLVED_CONFIG` / `E_UNRESOLVED_ALIAS`，字段闭集、路径模板和命令解析均可复跑。 | AI | DevPlan DHR_63 |
| 2 | 任一已登记坏条目仍使整体 registry fail-closed 并拒绝真实启动；不得以局部测试 registry 绕过。 | AI | design/12 P6-RI-A5 |
| 3 | 工件零配置正文、零凭据；身份不可证时明确写「不可证」。 | AI | DevPlan DHR_63 |

## 边界

- In scope：已冻结 Profile 条目的允许字段、DHR_63 脱敏证据、既有 registry 校验器的定向调用。
- Out of scope：schema/validator、任何 relay 生产代码、Agent 产品配置、凭据、Runtime、Store、RPC、Herdr、编排、DHR_35、真实 Agent 与 Linux。
- 必须停止：若需改 schema/validator、读取配置正文，或身份无法在允许边界证明，则记 findings「不可证」。

## 允许路径

- `~/.dh-relay/executor-profiles.json`（仅两个已冻结 Profile 的非敏感字段）
- `docs/modules/dh-relay/workspace/DHR_63/**`
