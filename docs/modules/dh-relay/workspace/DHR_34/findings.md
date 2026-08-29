<!-- dh:v1 -->
# DHR_34 · Findings

| ID | 级别 | 状态 | 描述 | 处置 |
|---|---|---|---|---|
| F-001 | P2 | open | Receipt 的身份字段是否能在既有 contracts 零 diff 约束下承载，尚未完成 fresh 预审。 | 预审先核对 schema、store 与 runtime 写入点；若需契约扩展则 BLOCKED，不越过 allowed paths。 |
| F-002 | P2 | open | quota 高置信样本的稳定、脱敏形态尚未冻结。 | 仅在假样本/已批准脱敏证据上定义分类器；普通、权限、网络错误必须保留负例。 |
| F-003 | P0 | open | `launch-receipt.v2` 未含身份四件套，实际签发点 `service.mjs` 又不在允许路径；DevPlan 的 Receipt schema 扩展与 brief 的 `contracts/**` 禁改边界冲突。 | 用户决定另开契约卡，或走正式计划调整后重冻范围；施工前不得越界。 |
| F-004 | P0 | open | 验收要求「无 fallback → paused + Attention」，但 run-state 枚举无 `paused` 且全仓零实现，字面口径不可实现。 | 用户裁决补协议状态、明确既有状态的等价语义，或修订验收口径；施工前不得猜测。 |
| F-005 | P2 | open | 启动屏显示 `Opus 5 with high effort`，实例自报 SessionStart 为 `claude-fable-5`；实际模型身份不可证。 | 保留两条形态证据；不得将本次预审标成「已核验 Opus」。 |
