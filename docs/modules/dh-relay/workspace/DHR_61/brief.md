<!-- dh:v1 -->
# brief — DHR_61 Attempt 身份与暂停重试契约

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|---------|-------------|
| DHR_61 | P6-Herdr 多账号与 Headless 执行底座 | DevPlan §3.2 DHR_61 |

## 目标 (Outcome)

冻结可重放的 Attempt 身份、无 fallback 的持久等待事实，以及兼容 v1 的人工 retry 协议，使 DHR_34 能只消费 D3 编排合同。

## Zero-context 自查

本卡实现 design/11 D1/D2，不实现 quota 分类或自动 fallback；任何需要扩大 D3、读取凭据或改变既有 v1 成功载荷的方案都必须停止并回到设计调整。

## 完成条件 ★必写

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|------|---------------|--------------------------------|
| 1 | Attempt Receipt 在开立、持久化与重放中保有同一 `executor_identity`；`launch-receipt/v2` 历史形态仍可读，Receipt、事件、日志与测试样本零敏感值。 | AI | DHR_61 / design/11 P6-IQ-A1 |
| 2 | 单条 canonical `fallback_pause_created` 原子重放 fence、`waiting_human` 与 Attention；重复、冲突、损坏、截断及 journal 强杀阶段均 fail-closed，迟到写入返回 `E_ATTEMPT_FENCED`，v1 不静默丢失 Attention。 | AI | DHR_61 / design/11 P6-IQ-A3 |
| 3 | v2 `retry-with-profile` 仅接受冻结且仍匹配的 profile；同键幂等，关闭 pause、快照不匹配和部分失败均有定向反例，旧 Attempt 始终 fenced。 | AI | DHR_61 / design/11 P6-IQ-A5 |

## 边界 (Boundaries)

- In scope：`relay-core/contracts/**`、`relay-core/store/**`、`relay-core/rpc/**`、`relay-core/profiles/**`、必要的 Runtime Receipt 签发接点、定向测试与本工作区。
- Out of scope：quota 分类、自动 fallback 选择、DHR_34 D3 编排、真实产品闭环、用户级账号配置、凭据读写、自动登录。
- 何时必须停下问人：出现不能兼容 v1、不能保证脱敏/容量、须新增未设计状态枚举，或 P0/P1 三轮不收敛时。

## 触及子系统（收口时更新其 as-built）

- contracts、store、rpc、profiles、runtime workflow/Receipt 签发接点。
