<!-- dh:v1 · workspace/DHR_34/task_plan.md -->
# task_plan — DHR_34

## 要读的上下文（Context Packet）

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` §2.3、§3.2 DHR_61/DHR_34；`design/11` D1~D3 | DHR_61 的协议边界与 DHR_34 仅承接 D3 的验收口径。 |
| C-002 | `docs/modules/dh-relay/workspace/DHR_33/brief.md`、`findings.md` F-4/F-5 | 上游 registry 接点及移交边界。 |
| C-003 | DHR_61 的已验收 Receipt/pause/retry 接口 | DHR_34 只能消费该接口；未验收前不得施工。 |
| C-004 | `relay-core/runtime/workflow-driver.mjs` | D3 quota/fallback 编排的唯一接线点；不得在此卡重做 Receipt/Store/RPC 合同。 |
| C-005 | `relay-core/test/herdr-adapter.test.mjs`、`relay-core/test/agent-node.test.mjs` | 既有 Herdr Attempt、Result 和恢复语义的回归锚点。 |

## 施工步骤（当前仅完成 S0 准备；施工前由 Opus 预审冻结实现细节）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 1 | Test · `relay-core/test/identity-quota.test.mjs`（新） | 在 DHR_61 接口已验收后，先建立正负 quota 分类、合格 fallback 选择、fresh Attempt 编排与非额度错误不切换的失败用例；fixture 仅用脱敏 profile alias 和假事件。 | `node --test test/identity-quota.test.mjs` 初始断言失败，原因仅为 D3 编排未接入。 |
| 2 | Create · `relay-core/runtime/executors/identity/**`、`quota/**` | 以纯函数解析受控 quota 样本，显式返回 `quota_confirmed / not_quota / unknown`；只接受预登记且可用的 fallback，不推断账号或读取配置值。 | 定向测试正反样本全部通过；对普通、权限、网络错误断言 `not_quota` 或 `unknown`。 |
| 3 | Modify · `relay-core/runtime/workflow-driver.mjs` | 消费 DHR_61 的 Receipt/pause/retry 合同：quota_confirmed 时选择合格 fallback 并请求 fresh Attempt；无合法 fallback 只调用既有 pause/Attention 合同。 | 定向测试断言旧 / 新 Attempt ID、Receipt ID、profile 链均不同且可追溯；无 fallback 零自动切换。 |
| 4 | Modify/Test · 允许路径中的回归测试 | 只传递 DHR_61 已冻结、脱敏字段；补 DHR_33 语义回归，确认控制客户端变化不改 executor 身份链。 | `node --test test/identity-quota.test.mjs test/herdr-adapter.test.mjs test/agent-node.test.mjs` 终态全绿。 |
| 5 | Record · `progress.md`、`review.md` | 记录样本来源类型、测试终态、凭据扫描结果及阶段小审结论；不记录样本文本中的敏感值。 | `git diff --check`、`node tools/audit-contracts.mjs`，均须终态通过。 |

## 关键决策

- Worktree：是；分支 `wt/DHR_34`；目录 `.dh-worktrees/DHR_34`。
- 施工：尚未派发；先完成 Opus fresh 预审，预审不得改代码或注册表。
- 复核：Opus；heavy 配方为代码轮 1、fresh 代码轮 2、需求、教训、一致性五路，施工者不得复核本卡。
- TDD：适用；quota 分类和 fresh Attempt 身份链先红后绿。
