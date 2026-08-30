<!-- dh:v1 -->
# task_plan — DHR_66

## 要读的上下文（Context Packet）

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | DevPlan §3.2 DHR_66；design/12 P6-RI-A5 | 冻结 `/profiles` 的最小 nonsecret 边界、Receipt 四字段及 fail-closed 验收。 |
| C-002 | `relay-core/profiles/profile-identity.mjs`、`relay-core/test/profile-identity.test.mjs` | 确认 `freezeProfileIdentity` 的真实入口、四字段与可复跑测试命令；只读，不改仓内代码。 |
| C-003 | `~/.dh-relay/executor-profiles.json` 的 schema 声明与 `readNonsecretProfileProjection` 既有读取规则 | 只确认 `/profiles` 已被声明为 nonsecret，写入前后绝不回显值、配置正文或凭据。 |

## 施工步骤

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 1 | Inspect · `~/.dh-relay/executor-profiles.json` | 仅读取 `herdr.codex.main` 的 declared nonsecret pointer 元数据与 `/profiles` 的可证明存在性；输出严格限于字段名、classification、hash/错误码和脱敏摘要。 | 运行既有 identity 专项，记录缺失投影的 `E_NONSECRET_PROJECTION_MISSING:/profiles` 或等价 fail-closed 错误码；不得回显投影值。 |
| 2 | Modify · `~/.dh-relay/executor-profiles.json` | 仅补齐已声明 nonsecret 的 `/profiles` 元数据，使它可由既有 reader 读取；不改 schema、其他 profile 或任意配置正文。 | `freezeProfileIdentity` 成功且 Receipt 仅保留四字段。 |
| 3 | Test · identity/profile tests | 对未声明、坏 pointer、不安全 pointer 与不可证值执行负例；确认均在 Attempt/Agent/pane/Result 前停止。 | 定向 Node 测试取得终态；负例为 fail-closed，且无副作用。 |
| 4 | Record · `workspace/DHR_66/**` | 记录命令、退出码、错误码、hash、字段名和脱敏摘要；运行凭据模式扫描。 | `git diff --check`、工件凭据扫描与 `dh dh-relay` 均有终态。 |

## 关键决策

- Worktree：是；分支 `wt/DHR_66`，目录 `.dh-worktrees/DHR_66`，基线为 B-29 已落主干的 `7bb423f`。
- 派子 agent：否；本会话施工。若后续复核，施工者不复核自己的卡。
- Review：light 配方只做教训与一致性两路；不宣称代码轮次或实现级 mutation。
