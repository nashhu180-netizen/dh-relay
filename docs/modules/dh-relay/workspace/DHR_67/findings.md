<!-- dh:v1 -->
# DHR_67 · Findings

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-6701 | P1 | 初版将 Herdr list 对象 `agent`（类型）误作 rename target，fake 也掩盖真实形状。 | E-6708、E-6709；evidence/03:41-43；knowledge/herdr-派活操作.md 已登记 `agent rename <paneID> <名>` | 已改为同 pane 唯一 `agent === 'claude'`，rename target 固定新 pane；补非 Claude/延迟识别测试，fresh 两轮复验通过。 | resolved |
| F-6702 | P1 | `workflow-driver` 在 adapter launch 前已 `openAttempt`；与旧完成条件“失败不绑定 Attempt”字面冲突。 | E-6710；E-6722；`workflow-driver.mjs` 既有顺序 | 用户确认 B-30：收窄为 adapter 不额外创建 Attempt/Result；补 driver 回归证明既有 Attempt 进入人工处理且零 Result，不改 driver。 | resolved |
| F-6703 | P2 | 初版先过滤 `agent === 'claude'`，会将同 pane 的 Claude+其他类型对象误作唯一。 | E-6715 | 已改为先收集同 pane 全部对象、再要求唯一对象是 Claude；mixed-type 负例与两名 fresh 复验通过。 | resolved |
