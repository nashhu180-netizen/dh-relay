<!-- dh:v1 -->
# task_plan — DHR_63

## 要读的上下文（Context Packet）

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | DevPlan §2.3、§3.2 DHR_63；design/12 P6-RI-A5 | 冻结字段、验收和 fail-closed 边界。 |
| C-002 | `relay-core/profiles/validate-profiles.mjs` 与相关测试 | 只调用既有校验器，不修改。 |
| C-003 | `~/.dh-relay/executor-profiles.json` 的字段名与结构 | 只维护允许字段，绝不读取或记录配置正文/凭据。 |

## 施工步骤

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 1 | Inspect · 用户级 registry、既有校验器 | 只记录目标 Profile 的字段名、分类和错误码；不输出值或配置正文。 | 零注入整体 registry 校验，记录脱敏错误码。 |
| 2 | Modify · `~/.dh-relay/executor-profiles.json` | 仅修复 `command_alias`、`config_fingerprint_rule` 或字段闭集内的非敏感元数据；不扩 schema。 | 目标 Profile 不再出现两种 unresolved 错误。 |
| 3 | Test · 既有 registry 校验器 | 用正式整体 registry 验证已登记坏条目；禁止局部 registry 绕过。 | 正常整体 registry 通过，坏条目整体拒绝。 |
| 4 | Record · workspace 账本 | 仅记录命令、退出码、错误码、字段名、脱敏摘要和扫描结果。 | `git diff --check` 与凭据模式扫描终态通过。 |

## 关键决策

- Worktree：是；`wt/DHR_63`，`.dh-worktrees/DHR_63`，基线 `33219fe`。
- 派子 agent：是；只执行本 task_plan。
- Review：normal 配方为代码轮 1、需求、教训三路与有效单测；不启用代码轮 2/一致性路径。
