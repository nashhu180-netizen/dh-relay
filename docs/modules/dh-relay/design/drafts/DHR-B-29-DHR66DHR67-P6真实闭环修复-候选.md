<!-- dh:draft:v1 status=not-effective -->
# DHR-B-29 · P6 Windows 真实闭环修复（候选）

> 触发：用户明示“授权，都修正”；DHR35 E-3512 证明 Codex 身份投影在 Attempt 前 fail-closed，Claude 启动路径尚不满足 Windows shim 约束。本文不是正式设计输入、DevPlan 或施工授权。

## 拟议调整

保持 design/12 的 P6-RI-A4 及 Receipt-bound Result 原样；不新增 Result 来源、不把 Herdr `done`/pane 文本当结果。DHR35 从直接修复者改为两张前置卡的真实闭环消费者：

| 卡 | 目标 | 机器证 | 非目标 / 允许范围 |
|---|---|---|---|
| DHR_66 | 修复 `herdr.codex.main` 的用户级 registry **非敏感**身份投影，使 Attempt 能冻结既有 Receipt identity。 | 缺失 `/profiles` 指针的红测；修复后 Receipt 身份对象仍为 `executor_profile_id`、脱敏 `account_alias`、`config_fingerprint`、`executor_capability_hash` 四字段；投影值不输出、不落盘；坏指针仍在零 Attempt/Agent/pane/Result 前拒绝。 | 仅用户级 registry 中已声明 nonsecret 的 `/profiles` 元数据与 `workspace/DHR_66/**`；程序可读取该 pointer 以计算 hash/错误码/脱敏摘要，但不保存投影值或配置正文，不读/写凭据、不登录、不改 fallback、Store/RPC/Result。 |
| DHR_67 | 让 Claude Code 在 Windows 经 Herdr 走 `pane run` → 有界唯一自动识别 → `rename` 的受支持路径，并保持 Codex 的 `agent start` 路径不变。 | fake Herdr 测试固定调用、句柄和失败顺序：零/多个 agent、识别超时、rename 失败均关闭同一新 pane，且不得接入 Attempt；唯一 rename 成功后才交给现有 Attempt。真实启动仅在 DHR66 绿后、DSH-off 临时仓、Receipt submission 成功时由 DHR35 取证。 | `relay-core/runtime/executors/herdr/herdr-cli.mjs`、`relay-core/runtime/executors/herdr/herdr-executor.mjs`、`relay-core/test/herdr-adapter.test.mjs`、`relay-core/test/helpers/fake-herdr.mjs`、必要测试入口与 `workspace/DHR_67/**`；禁止 `profile-registry.mjs`、driver、Store、RPC、contracts 和 Result 语义。 |

## 依赖与验收

`DHR_34, DHR_63, DHR_64, DHR_65, DHR_66, DHR_67 → DHR_35`，其中 DHR66 与 DHR67 可并行。两卡均为标准档：DHR66 是 DHR63 后新增的 Codex projection 修复/复验，DHR67 是 Windows Claude Herdr 启动接线；DHR34、63、64、65 已完成范围保留且不重开。各自完成独立机器证、复核与人验后，DHR35 才重新跑两条真实 Windows 节点。Linux 继续 B-22 延后。

## 已知风险与停止条件

- 若 `/profiles` 未明确登记为 nonsecret 或安全投影不可证，DHR66 记录“不可证”并停，不猜路径、不读取不在规则内的字段。
- 若 Claude `pane run` 后出现零/多个 agent、超时或 rename 失败，DHR67 关闭同一新 pane 并 fail-closed，DHR35 不启动 Claude 实录。
- 任何凭据形态值进入工作区、截图或日志，立即停止、删除本卡刚产生的敏感证据并报告。

## 待 fresh 审核

审核至少核对：DHR66 是否把用户级 metadata 与产品配置值隔离；DHR67 是否只修启动宿主而未重引入 status→Result 推导；两卡依赖是否足以让 DHR35 无需扩大范围。
