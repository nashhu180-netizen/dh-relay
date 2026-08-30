<!-- dh:v1 -->
# DHR_63 · 受限 registry 非敏感维护 — Brief

> 出处（唯一权威）：[P6 开发方案](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md) §3.2 DHR_63。本文件是只读副本；冲突以 DevPlan 为准。
> 档位：标准。任务类型：**light**（B-25 已确认；runtime production mutation 由 DHR_65 独立承接）。
> 开工授权：用户 2026-08-30 明确「启动63」并确认与 DHR_64 同时进行。仅覆盖本卡本地 worktree、已冻结 registry 非敏感维护、定向验证和自动收口准备；不覆盖 DHR_35、真实 Agent、Linux、凭据读取、verify、合并、推送、部署或环境动作。

## 目标

只维护用户级 `~/.dh-relay/executor-profiles.json` 中两个目标 Windows Executor Profile 的非敏感元数据，恢复 Codex 与 Claude CLI/config 指纹规则的可解析性。若该两个目标的现有引用指向 `herdr.codex.ninth`，仅可移除该引用 Profile 上不可展开的非敏感 `config_fingerprint_rule`，不把它作为第三个目标或可派 Profile。DHR_63 只提供 P6-RI-A5 的 registry 证据；runtime/driver 在真实启动前的 fail-closed 与 mutation 由 DHR_65 独立证明。

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_63 | P6 Herdr 多账号执行底座 | DevPlan §3.2 DHR_63 |

## 完成条件

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| 1 | 目标 Profile 不再返回 `E_UNRESOLVED_CONFIG` / `E_UNRESOLVED_ALIAS`，字段闭集、路径模板和命令解析均可复跑。 | AI | DevPlan DHR_63 |
| 2 | 完整 registry 的坏 alias/config 仍被 formal validator 拒绝；不得以局部测试 registry 绕过。与 DHR_65 的 runtime/mutation 证据共同闭合 P6-RI-A5。 | AI | design/12 P6-RI-A5 |
| 3 | 工件零配置正文、零凭据；身份不可证时明确写「不可证」。 | AI | DevPlan DHR_63 |

## 边界

- In scope：已冻结 Profile 条目的允许字段、DHR_63 脱敏证据、既有 registry 校验器的定向调用。
- Out of scope：schema/validator、任何 relay 生产代码、Agent 产品配置、凭据、Runtime、Store、RPC、Herdr、编排、DHR_35、真实 Agent 与 Linux。
- 必须停止：若需改 schema/validator、读取配置正文，或身份无法在允许边界证明，则记 findings「不可证」。
- 联合解锁：即使本卡证据全部通过，只要 DHR_65 未完成 runtime/mutation 机器证与复核，DHR_35 仍保持 `blocked-by:DHR_63,DHR_64,DHR_65`。

## 允许路径

- `~/.dh-relay/executor-profiles.json`（两个目标 Profile 的非敏感字段；其现有引用 Profile `herdr.codex.ninth` 仅限移除不可展开的 `config_fingerprint_rule`）
- `docs/modules/dh-relay/workspace/DHR_63/**`
