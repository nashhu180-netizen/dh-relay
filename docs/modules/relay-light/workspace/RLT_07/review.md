<!-- dh:v1 -->
# review — RLT_07

> RLT_07 task_type=`heavy`。施工者不得复核自己的卡；先完成代码轮 1 及其必要整改，之后代码轮 2、需求方向、一致性、教训四条适用路径进入同一 Review Batch 并发。

## Heavy Recipe 路径登记

| 路径 | 时序/独立性 | 必审靶子 | reviewer | 证据 | 状态 |
|---|---|---|---|---|---|
| code-round1 | construction 完成后的第一道代码复核；fresh，非施工者 | 三批整卡 diff、A132 模型名扫描、A100 术语分域、模板与 lint/账本合同一致、20 ID test 映射、有效单测候选 | devin-sub（explore，fresh） | `reviews/code-round1-devin-sub.md`；P2×1+P3×9 全部整改或转需求路；tests_effective=yes | APPROVE_WITH_NITS（2026-09-12，整改已闭合） |
| code-round2 | code-round1 P0/P1 闭合后，与后四路 Review Batch 并发；fresh 且不复用 round1 | 核 round1 闭合、增量 diff、选择并执行有效 mutation，改坏必须行为红且还原全绿 | 待主控指派 | — | 未开始 |
| requirement | 同一 Review Batch 独立路径 | 逐字对齐 DevPlan 20 条；无 RLT_01/08/09/10/18 抢跑；术语与职责边界语义 | 待主控指派 | — | 未开始 |
| consistency | 同一 Review Batch 独立路径 | design ↔ DevPlan ↔ TOML ↔ SKILL.md/双 adapter ↔ tests 的闭集比对 | 待主控指派 | — | 未开始 |
| lesson | 同一 Review Batch 独立路径 | 核 `lesson_candidates.md` 证据、去重与可复用性；若 absent 形成可核查 N/A | 待主控指派 | — | 未开始 |

## 批次小审登记

| Batch | 小审 reviewer | 结论 | 证据 | 状态 |
|---|---|---|---|---|
| 1 | 主控 | PASS | focused 红→绿、全量 119 OK、diff 边界干净 | 闭合 |
| 2 | 主控 | PASS（带 F-002 open） | focused 9 ok + 2 skipped、全量 130 OK、diff 边界干净 | 闭合 |
| 3 | 主控 | PASS | focused 6/6、全量 136 OK、diff 边界干净 | 闭合 |

## 有效单测·改坏必红（代码轮 2 必填）

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应测试 | 命令 | 施加 hash | 还原 hash | 行为红结果 | 状态 |
|---|---|---|---|---|---|---|---|---|
| 待代码轮 2 填写 | — | — | — | — | — | — | — | 未开始 |
