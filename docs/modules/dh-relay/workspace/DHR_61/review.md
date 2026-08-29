<!-- dh:v1 -->
# review — DHR_61

## 独立复核区

### 代码轮 1（fresh）

| 复核者 | 范围 | 发现 | 派出证据 | 证据 |
|---|---|---|---|---|
| 待派 | 每批 diff、D1/D2 契约与定向证据 | 待复核 | 待派 | 待填 |

### 代码轮 2（fresh，实例须不同于轮 1）

| 复核者 | 范围 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|
| 待派 | 全程增量、轮 1 记录与变异点 | 待复核 | 待派 | 待填 |

### 需求、教训与一致性（均为独立实例）

| 路径 | 范围 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|
| 需求 | D1/D2 与 DHR_34 D3 边界 | 待复核 | 待派 | 待填 |
| 教训 | 在册教训及协议/凭据边界 | 待复核 | 待派 | 待填 |
| 一致性 | Receipt、event、Store、RPC 现役合同 | 待复核 | 待派 | 待填 |

### 有效单测·变异点登记

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人 | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| 待代码轮 2 选择 | 待收口 | 待收口 | 待收口 | 待收口 | 待收口 | 待收口 | 待派 fresh 轮2实例 | 待收口 |

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_61 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| Attempt/Receipt、pause/retry 与 attention 合同 | `contracts/**`、Store 回放、RPC v1/v2、Runtime 签发点 | 待复核 | 待复核 | 待派 |

## AI 提交区

### 需求对齐证据

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| P6-IQ-A1 | 构造脱敏 profile，开立/重放 Attempt Receipt 并读历史 launch receipt | E-001 | 待人验 |
| P6-IQ-A3 | 无 fallback 时写单条 pause，重放并尝试迟到 checkpoint/result、截断和冲突 detail | E-001 | 待人验 |
| P6-IQ-A5 | 用冻结 profile retry，再分别注入关闭 pause、快照不匹配与部分失败 | E-001 | 待人验 |

### 完成条件逐条挂证据

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | Attempt Receipt 在开立、持久化与重放中保有同一 `executor_identity`；`launch-receipt/v2` 历史形态仍可读，Receipt、事件、日志与测试样本零敏感值。 | machine | E-001 | 待验证 |
| 2 | 单条 canonical `fallback_pause_created` 原子重放 fence、`waiting_human` 与 Attention；重复、冲突、损坏、截断及 journal 强杀阶段均 fail-closed，迟到写入返回 `E_ATTEMPT_FENCED`，v1 不静默丢失 Attention。 | machine | E-001 | 待验证 |
| 3 | v2 `retry-with-profile` 仅接受冻结且仍匹配的 profile；同键幂等，关闭 pause、快照不匹配和部分失败均有定向反例，旧 Attempt 始终 fenced。 | machine | E-001 | 待验证 |

### 验收项元数据表

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态 | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| Attempt 身份快照一致且旧 launch receipt 可读 | schema + open/replay + fixture + 凭据扫描 | machine | P6-IQ-A1 | 无法取证 | 新旧正反例均通过且扫描零命中 | 待收口 | 待收口 | JSON schema / fixture | 真实产品闭环属 DHR_35 | 待收口 | test runner | AI 自动验收 |
| pause 原子性、fence、Attention 与 v1 可见失败 | Store 重放、损坏/截断/强杀反例、v1/v2 RPC 测试 | machine | P6-IQ-A3 | 无法取证 | 任一缺项或冲突 fail-closed，v1 不静默省略 | 待收口 | 待收口 | Store journal / RPC schema | D3 自动选择属 DHR_34 | 待收口 | test runner | AI 自动验收 |
| retry 仅接受冻结匹配 profile 且无部分提交 | v2 retry 正反例与幂等/恢复测试 | machine | P6-IQ-A5 | 无法取证 | 同键同结果，非法输入零写入 | 待收口 | 待收口 | Store transaction / RPC schema | UI 体验属 DHR_35 | 待收口 | test runner | AI 自动验收 |

### 业务化五段展示区

- 要证明啥：D1/D2 的持久协议安全，不包含人判体验项。
- 期望值：所有机器验收条件有可复跑证据，且 DHR_34 才可消费合同。
- 实际值：待收口。
- 差没差：待收口。
- 证据局限：真实产品体验和 D3 自动 fallback 不在本卡。

→ 当前状态：**进行中**

---

## 人类签名区

本卡无独立人判验收项；是否满足 H=0 放行条件仅在收口时由完整机器证、复核与放行资格共同推导，当前不得视为已验收。
