<!-- dh:v1 · workspace/DHR_34/task_plan.md -->
# task_plan — DHR_34

## 要读的上下文（Context Packet）

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` §2.3、§3.2 DHR_34 | 身份字段闭集、fallback 规则与验收口径的唯一权威。 |
| C-002 | `docs/modules/dh-relay/workspace/DHR_33/brief.md`、`findings.md` F-4/F-5 | 上游 registry 接点及移交边界。 |
| C-003 | `relay-core/runtime/workflow-driver.mjs` | 当前 Attempt 由 `openAttempt` / `registerReceipt` 开立、终态经 `appendResult` 写入的唯一接线点。 |
| C-004 | `relay-core/runtime/executors/herdr/profile-registry.mjs`、`relay-core/profiles/validate-profiles.mjs` | 只读 registry 与既有无凭据校验约束。 |
| C-005 | `relay-core/test/herdr-adapter.test.mjs`、`relay-core/test/agent-node.test.mjs` | 既有 Herdr Attempt、Result 和恢复语义的回归锚点。 |

## 施工步骤（当前仅完成 S0 准备；施工前由 Opus 预审冻结实现细节）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 1 | Test · `relay-core/test/identity-quota.test.mjs`（新） | 先建立正负 quota 分类、fallback fresh Attempt、无 fallback Attention、非额度错误不切换的失败用例；fixture 仅用脱敏 profile alias 和假事件。 | `node --test test/identity-quota.test.mjs` 初始断言失败，原因仅为实现未接入。 |
| 2 | Create · `relay-core/runtime/executors/identity/**`、`quota/**` | 以纯函数解析受控 quota 样本，显式返回 `quota_confirmed / not_quota / unknown`；只接受预登记且可用的 fallback，不推断账号或读取配置值。 | 定向测试正反样本全部通过；对普通、权限、网络错误断言 `not_quota` 或 `unknown`。 |
| 3 | Modify · `relay-core/runtime/workflow-driver.mjs` | 在当前 receipt 开立前冻结 registry 的 profile / alias / fingerprint / capability 证据；quota_confirmed 时关闭旧尝试并为 fallback 新开 receipt + fresh attempt id；无合法 fallback 只写持久 Attention。 | 定向测试断言旧 / 新 Attempt ID、Receipt ID、profile 链均不同且可追溯；无 fallback 零自动切换。 |
| 4 | Modify/Test · 允许路径中的 registry bridge 与回归测试 | 只传递已冻结、脱敏字段；补 DHR_33 语义回归，确认控制客户端变化不改 executor 身份链。 | `node --test test/identity-quota.test.mjs test/herdr-adapter.test.mjs test/agent-node.test.mjs` 终态全绿。 |
| 5 | Record · `progress.md`、`review.md` | 记录样本来源类型、测试终态、凭据扫描结果及阶段小审结论；不记录样本文本中的敏感值。 | `git diff --check`、`node tools/audit-contracts.mjs`，均须终态通过。 |

## 关键决策

- Worktree：是；分支 `wt/DHR_34`；目录 `.dh-worktrees/DHR_34`。
- 施工：尚未派发；先完成 Opus fresh 预审，预审不得改代码或注册表。
- 复核：Opus；heavy 配方为代码轮 1、fresh 代码轮 2、需求、教训、一致性五路，施工者不得复核本卡。
- TDD：适用；quota 分类和 fresh Attempt 身份链先红后绿。
