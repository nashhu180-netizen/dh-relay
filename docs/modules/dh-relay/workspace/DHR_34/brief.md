<!-- dh:v1 · workspace/DHR_34/brief.md -->
# DHR_34 · quota 与预登记 fallback 编排 — Brief

> 出处（唯一权威）：[P6 开发方案](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md) §3.2 DHR_34。本文件是只读副本；口径冲突以 DevPlan 为准。
> 档位：标准。任务类型：**heavy**（身份链与权限红线相邻；代码两轮换人 + 五路复核 + 有效单测）。
> 开工授权：用户 2026-08-29 明确「继续 DHR_34，开 worktree，复核用 opus」。本授权仅覆盖本地工作区准备与后续施工；不覆盖人验、verify、push、部署、自动登录或凭据操作。

## 目标（一句话）

仅消费 DHR_61 已冻结的 Receipt、pause/retry 与 Store/RPC 契约：高置信 quota 样本才选择合格 fallback 并编排 fresh Attempt；非额度错误不得误切；没有合法 fallback 时调用既有 `waiting_human/needs_you` 的 pause/Attention 合同。

## 覆盖任务

- 覆盖 DevPlan 的 DHR_34 quota 分类、合格 fallback 选择、fresh Attempt 编排与集成回归；不覆盖 DHR_61 的身份链、Receipt schema、Store、RPC、事件或 registry 合同，不覆盖 DHR_33 的 Herdr Adapter 收口，也不覆盖 DHR_35 的真实产品闭环。

## 完成条件（验收口径逐字复制自 DevPlan §3.2 DHR_34）

1. **机器证**：[design/11 P6-IQ-A2](../../design/11-P6身份与额度治理契约调整.md#3-验收清单) + [design/02 B5](../../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) · P6-M4：高置信 quota → 合格 fallback fresh Attempt；非额度错误 → 不判 quota；无合法 fallback 不自动切换。
2. **机器证**：[design/11 P6-IQ-A4](../../design/11-P6身份与额度治理契约调整.md#3-验收清单) + [design/02 B4](../../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) · P6-M2/M7：客户端变化不改变已冻结的 Executor Profile / Attempt / Result 身份链。
3. **机器证**：[design/06 H12](../../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)：fallback 产生 fresh Attempt，不续用旧身份链。

## 已知依赖与当前边界

- DHR_33 已以 squash `66dd16a` 合入 `master`，但 DHR_61 才拥有 profile registry、Receipt、Store 与 RPC 的契约扩展责任；DHR_61 未完成并验收前，本卡保持 `blocked-by:DHR_61`，不得施工。
- DHR_33 F-4/F-5 中属于契约扩展的部分移交 DHR_61；本卡只承接其既有合同上的 D3 编排与集成回归。范围外发现只登记 findings。
- 不做自由账号切换、凭据管理、自动登录，或客户端离线时自动选择未授权账号。
- 本机 AI 配置和用户级注册表只读；任何凭据值、完整敏感环境、cookie、token 或 API key 均不得读取、输出或写入工件。

## 允许路径（施工前冻结；侦察若证明不足，停下修订本 brief）

- `relay-core/runtime/executors/identity/**`（新建）
- `relay-core/runtime/executors/quota/**`（新建）
- `relay-core/runtime/workflow-driver.mjs`（仅 Attempt/Receipt 身份链与 fallback 编排接线）
- `relay-core/test/identity-quota.test.mjs`（新建）
- `relay-core/test/herdr-adapter.test.mjs`、`relay-core/test/agent-node.test.mjs`（仅 DHR_34 身份链 / fresh Attempt 回归）
- `docs/modules/dh-relay/workspace/DHR_34/**`

## 禁改边界

- `relay-core/contracts/**`、`relay-core/fixtures/**`、`relay-core/profiles/**`、`relay-core/store/**`、`relay-core/rpc/**`、Receipt 签发服务：均由 DHR_61 承接，本卡不得改动。
- 用户级注册表及 Codex / Claude 配置目录：只读；不得写入或改变账号状态。
- 禁止 push、部署、环境操作、自动登录、读取或记录任何凭据值。
