<!-- dh:v1 -->
<!-- dh:workspace-contract:v2 -->
# brief — DHR_80 人工重试 Receipt-bound 结果提交闭环

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|----------|-------------|
| DHR_80 | P6 | [DevPlan DHR_80](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md#dhr_80) |

## 目标 (Outcome)

人工选择冻结且仍匹配的 profile 后，fresh Attempt 能通过现役 v2 入口与合法 actor/gate 接收符合合同的外部结果提交，形成唯一 committed Result；服务重启后仍能按同一 Receipt 恢复接收。

## Zero-context 自查

执行者只读本文件、`task_plan.md` 与 DevPlan DHR_80 卡面，即可获知六条验收、精确允许路径、分批停止信号与禁止启动 Agent 的边界。任何需要公开协议、Store 原子性、历史 Receipt backfill 或新启动语义的方案必须记入 `findings.md` 并停止，不得自行扩围。

## 完成条件 ★必写

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|------|----------------|------------------------------------------|
| 1 | 机器证（design/11 P6-IQ-A5；design/12 P6-RI-A1）：最小失败复现使用当前 v2 retry-with-profile 与 submit-executor-result 入口；修复后 fresh Receipt 持久带正确模式，成功与失败提交均由新 Receipt 派生身份，经 actor/gate 返回 committed Ack，Result/event/state 一致。不得用直接 appendResult 或 helper-only 测试代替入口集成。 | AI | DHR_80 / design/11 P6-IQ-A5；design/12 P6-RI-A1 |
| 2 | 机器证（design/12 P6-RI-A1/A3）：服务重启后从同一新 Receipt 恢复 gate，不开第二个 Attempt、不启动 Agent；重复同结果仅在 committed 后幂等，冲突终态拒绝。既有缺 mode 的历史 Receipt 保持不可提交，不因修复原地升级。 | AI | DHR_80 / design/12 P6-RI-A1/A3 |
| 3 | 机器证（design/11 P6-IQ-A5；design/12 P6-RI-A3）：非冻结 profile、快照漂移、pause 已关闭/同键冲突拒绝且无新增重试事实；同键合法重放保持同一新 Receipt。旧 Attempt 始终 fenced，旧 Receipt 提交不污染新结果；失租/未认证/未知或非当前 Receipt 继续拒绝。 | AI | DHR_80 / design/11 P6-IQ-A5；design/12 P6-RI-A3 |
| 4 | 机器证（design/12 P6-RI-A2）：done/idle 无正式提交仍不产生 Result 或自动 fallback；使用 fake adapter 验证本次重试结果修复不会新增 Agent 启动/指令发送。 | AI | DHR_80 / design/12 P6-RI-A2 |
| 5 | 证据门槛：专项与受影响回归自然终态、退出码及版本落账；heavy 五路独立复核，轮2选点的变异红/恢复绿。未终态不记通过，既有全量回归债不靠定向绿抵扣。 | AI | DHR_80 / heavy Recipe |
| 6 | 人判：无新增业务选择；收口仍展示上述机器证据并取得本地收口确认，不代替 DHR_35 真实产品验收。 | 人 | DHR_80 / 本地收口确认 |

## 边界 (Boundaries)

- In scope：DevPlan DHR_80 `dh:allowed-paths:v1` 的精确路径；优先复用现有 gate 恢复与单写队列。
- Out of scope：自动 fallback、Agent 自动启动、quota 来源、公开协议、Store 事务算法、用户配置、历史 immutable Receipt 迁移/覆写、真实 Agent、DHR_35、DHR_79 实现、push/deploy。
- 何时必须停下问人：需改变公开协议、Store 原子性、历史 Receipt、启动产品语义或允许路径；P0/P1 三轮不收敛；E11 本地收口确认。

## 触及子系统（收口时更新其 as-built）

- `relay-core`

## DHR-B-50 运行解释（2026-09-07）

完成条件 1~6、design/11、design/12 与任务范围不变。B-50 只覆盖 `task_plan.md` 批次 3 的默认完整 `npm test` 绿色门槛：本次 E-8029 仍明确为 exit 1，不计通过；E-8021 37/37、E-8018 21/21 及治理检查只足以把施工状态记为 `BATCH_3_CONSTRAINED` 并送 heavy fresh review。该状态不等于全量健康、待验收、verify 或可合并；CLI、DHR_69/F、DHR_76/B 保持未证明基线同形，DHR_76/C 与 `identity-quota` 仅按既有证据记历史同形。
