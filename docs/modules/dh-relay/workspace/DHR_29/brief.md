<!-- dh:v1 -->
# brief — DHR_29 Store 事件账与确定性回放

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|---------|-------------|
| DHR_29 | P5 Relay v2 持久内核与 DSH 桥接 | DevPlan §3.2 DHR_29 |

## 目标 (Outcome)

以纯库形态交付单 Run 的唯一写者 Store：不可变工件、追加事件账、原子快照与确定性回放；完成本阶段唯一一次契约修订批次，并留下可复跑的机器证据。

## Zero-context 自查

执行者须先读本文件、`task_plan.md`、DevPlan DHR_29 卡、`relay-core/README.md`、`as-built/relay-core.md`、`contracts/OPEN-POINTS.md` 与 `contracts/v1-gap-disposition.md`。Store 不得创建进程、RPC、CLI 或客户端概念；任何协议改动必须同批重生成对应基线。

## 完成条件 ★必写

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|------|---------------|--------------------------------|
| 1 | 重复 checkpoint/result 幂等；冲突终态拒绝；迟到结果按 Receipt 身份链接受或隔离为 `late_result_quarantined`，并以 P1 迟到结果 fixture 证明 v2 判定不弱于 v1。 | AI | DHR_29；design/02 B6 / B11；compat-matrix §6 |
| 2 | 同一事件账独立回放 N 次的 `state_signature` 逐字节一致；快照加增量回放与从零全量回放逐字节一致。 | AI | DHR_29 加固断言 |
| 3 | `node_states` 覆盖 `relay.run/v2` 的全部 `nodes`；`progress.done <= total`；labels 依 key UTF-16 码元升序且 key 唯一；structured 按 v1 `relay-redaction.ps1` 口径脱敏；各有反例。 | AI | DHR_29；F-037/F-070/F-081；compat-matrix §6 |
| 4 | stale/rejected 只按单调 `seq` 判定，不依赖不透明 `attempt_id` 的字典序；反例的二者排序相反时仍按 `seq`。 | AI | DHR_29；OPEN-POINTS K-2 |
| 5 | 契约修订批次 1 一次完成：K-3 身份 token 去重、四个无对应事件值裁决、F-042/F-056 演进纪律、指名更正、done<=total 归属更正；同批重生成 fixture manifest、capability baseline、结构 token 基线，`npm test` 全绿。 | AI | DHR_29 契约修订批次 1 |
| 6 | 对 K-1 `waiting_human` 明确落账：本批新增事件产生者，回放可重建该状态，且测试覆盖产生与回放路径。 | AI | DHR_29；OPEN-POINTS K-1；用户 2026-08-21 授权裁决 |

## 边界 (Boundaries)

- In scope：`relay-core/store/`、`relay-core/test/`、`relay-core/contracts/`（仅批次 1）、`relay-core/fixtures/`、三份基线、`workspace/DHR_29/`。
- Out of scope：Detached 宿主/lease/恢复（DHR_51）、RPC 与能力握手（DHR_52）、CLI（DHR_30）、全链路 demo（DHR_31）、多卡、Herdr。
- 何时必须停下问人：P0/P1 三轮不收敛、范围外契约决策，或 E10 证据展示后的唯一 E11 本地收口确认。

## 触及子系统（收口时更新其 as-built）

- `relay-core`：更新 `docs/modules/dh-relay/as-built/relay-core.md`，说明 Store 现状与 DHR_51/52 边界。
