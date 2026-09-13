<!-- dh:v1 -->
# review — RLT_08

> RLT_08 task_type=`normal`。施工者不得复核自己的卡；CONSTRUCTION_DONE 且批次小审闭合后，代码轮 1、需求方向、教训三路按冻结 Recipe 独立执行。

## 预测变更面

<!-- dh:change-surface:v1 task=RLT_08 phase=predict -->

| 变更面 | 预测改动 | 下游消费者 / 风险 | 预定复核证据 |
|---|---|---|---|
| 仓库模块身份 | `AGENTS.md` 项目概况、落点/slug、`dh` 命令三处从单模块改双模块 | `dh` 使用者；错误保留自动选中叙述会误导入口 | 旧句零命中；slug/路径/scope 四项命中；`dh relay-light` 模块标头 |
| worker 流水分流 | 新增 relay-light 标头判定与完成即停；Runner 铁律只加 receipt 冻结边界 | relay-light worker 与 Runner worker；误判会造成等待死锁或双流水同时执行 | A34 原文 grep；adapter 两标头同构；Runner 原铁律保留 diff |
| 运行中计划政策 | 明记有意绕过 B-adjust 的白名单窄例外 | planner-amend / orchestrator；例外外溢到 design/验收会绕开用户闸 | 两句必备原文 + 三项白名单与两项禁区语义审查 |
| 仓内权威索引 | 阅读矩阵新增 relay-light skill/adapter 行 | 后续 planner/orchestrator/monitor/worker；错链接会读到派生副本或无关流程 | 矩阵内精确一行，指向 `tools/relay-light/skill/SKILL.md` |
| 外部不变量 | dev-harness 必须零新改动；skill/adapter 只读 | 上游 dev-harness 和 RLT_07 已交付合同 | 进场前后 status/diff 对比；本卡 name-only 闭集 |

## Normal Recipe 路径登记

| 路径 | 时序 / 独立性 | 必审靶子 | reviewer | 证据 | 状态 |
|---|---|---|---|---|---|
| code-round1 | construction 与批次小审闭合后；fresh，非施工者 | 整卡 diff；三批插入位置；旧 Runner 条款未被弱化；grep/结构脚本是否能真防回归；allowed-paths | 待 orchestrator 派 fresh reviewer | 待填 | 未开始 |
| requirement | 与 normal Review Batch 独立执行 | 逐字对齐 HC-RL-A28/A29/A33/A34；B-adjust 例外不外溢；双模块语义与 `dh` 实际行为一致 | 待 orchestrator 派 fresh reviewer | 待填 | 未开始 |
| lesson | 与 normal Review Batch 独立执行 | 核 `lesson_candidates.md` 的现场证据、去重与可复用性；若 absent，形成可核查 N/A | 待 orchestrator 派 fresh reviewer | 待填 | 未开始 |

## 批次小审登记

| Batch | audit reviewer | 结论 | 证据 | 状态 |
|---|---|---|---|---|
| W | `rlt08-audit` | 待审 | 七件套闭集、四条 oracle、分批粒度、信号契约 | 未开始 |
| 1 | `rlt08-audit` | 待审 | B1 RED/GREEN、双模块身份、diff 边界 | 未开始 |
| 2 | `rlt08-audit` | 待审 | B2 RED/GREEN、A34 标头、Runner 冻结、B-adjust 窄例外 | 未开始 |
| 3 | `rlt08-audit` | 待审 | B3 RED/GREEN、整卡机检、`dh relay-light`、dev-harness 无新改动 | 未开始 |

## 有效单测候选（normal 复核核对）

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应检查 | 行为红预期 | 状态 |
|---|---|---|---|---|---|
| A34 判定句 `RELAY_RECEIPT` | `即冻结`→`不冻结` | 流水分流 | 整卡 `rg -F` 原文检查 | 原文命中失败 | 待复核实施 |
| relay-light verify scope | `relay-light`→`relay_light` | 模块身份 | scope 精确 grep | 英文 scope 检查失败 | 待复核实施 |
