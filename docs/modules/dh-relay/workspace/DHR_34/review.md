<!-- dh:v1 -->
# DHR_34 · Review

## S1 开工预审（fresh Claude 实例；只读）

- 派发：Herdr pane `w1:pQ`，实例 `opus_kickoff_dhr34_r2`，cwd=`.dh-worktrees/DHR_34`；启动命令为 `claude --model opus`。
- 身份证据：启动屏显示 `Opus 5 with high effort`；实例自报 SessionStart `claude-fable-5`。来源互相矛盾，结论为**形态待证**，不登记为已核验 Opus。
- 只读边界：实例仅执行读取命令；主控回收后 `git status --short` 与 `git diff --check` 均无输出。
- 结论：**BLOCKED，不可派施工**。
  - P0-1：`launch-receipt.v2` 不含身份四件套，签发点 `service.mjs` 不在允许路径；DevPlan 要求扩 Receipt schema，而 brief 禁改 `contracts/**`。
  - P0-2：run-state 无 `paused`，全仓零命中；「无 fallback → paused + Attention」字面不可实现。
  - P2：控制通道在 `rpc/cli` 禁改路径，身份展示只能依既有 event.detail 或 result.structured 的脱敏承载，不能借预审扩线。
  - P3：registry 不可用与无 fallback 必须分作负例；可用 `attempt_id` 派生 agent 名作为 H12 的附加断言点。
- 最小 TDD（仅待范围/语义裁决后执行）：quota 分类器正反样本 → 身份冻结纯函数 → driver fallback fresh Attempt → 非额度不切换 → 无 fallback 的已裁决状态/Attention → M7 两份回归断言 → `audit-contracts` 证明 contracts 零 diff（若裁决保持禁改）。

## 独立复核区

### 代码轮 1（Opus · fresh）

| 复核者 | 范围 | 发现 | 派出证据 | 证据 |
|---|---|---|---|---|
| 待派 | 开工前任务包与实施 diff | 待复核 | 待派 | 待填 |

### 代码轮 2（Opus · fresh，实例须不同于轮 1）

| 复核者 | 范围 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|
| 待派 | 全程与收口增量 | 待复核 | 待派 | 待填 |

### 需求、教训与一致性（均为 Opus 独立实例）

| 路径 | 范围 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|
| 需求 | 完成条件与身份/quota边界 | 待复核 | 待派 | 待填 |
| 教训 | 在册教训与候选 | 待复核 | 待派 | 待填 |
| 一致性 | 同类 Attempt/Receipt 路径 | 待复核 | 待派 | 待填 |

## AI 提交区

### 需求对齐证据

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| P6-M4：误判不切换 | 以受控假样本依次注入 quota、权限、网络和普通失败 | E-002 | 待人验 |
| P6-M2/M7：身份链不串用 | 对同一节点的原 profile 与 fallback profile 对比 Receipt / Attempt / Result | E-002 | 待人验 |

### 完成条件逐条挂证据

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | 高置信 quota 才 fallback；非 quota 不切；无 fallback 暂停并 Attention | machine | 待收口 | 待验证 |
| 2 | 身份链可证且客户端变化不串用 | machine | 待收口 | 待验证 |
| 3 | fallback 为 fresh Attempt | machine | 待收口 | 待验证 |

## 人类签名区

> 未经用户在对话中明确确认，不填写本区、不代签 verify。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| P6-M4 的产品语义 | 查看脱敏正反样本与 Attention 展示 | 认可额度误判和无 fallback 时均不自动切号 | [ ] |
