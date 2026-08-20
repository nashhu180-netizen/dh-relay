<!-- dh:v1 · brief.md — 工作区封面。🔵 前置填。写"终点"，不写路线。完成条件 = 任务卡验收口径的逐字复制 + 出处回链；DevPlan 是唯一权威定义，本文件是施工现场的只读副本，口径变更以 DevPlan 为准、本文件跟改并在 progress 记一笔。 -->
# brief — DHR_27 接 v1 只读投影并完成 CLI 控制面收口与 P4 主报告

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|---------|-------------|
| DHR_27 | P4 | [DevPlan §3.2 任务卡](../../dev_plan/P4-DSH工作台最小Pilot-开发方案.md)「#### DHR_27（必备控制面轨 · CLI 收口，B-11 缩范围）」 |

## 目标 (Outcome)

把冻结的 v1 fixture 与一条活 v1 历史现场（零写入）投影为统一 Read Model 并由 Pilot CLI 渲染，完成 CLI 必备控制面收口；落盘 P4 主报告（CM 结论 + 截至本卡的 DM 事实登记 + CM4/三态收敛「延后（DHR_50）」显式登记），并向用户交出 P4-H1 / P4-H4 两问的人判材料。

## Zero-context 自查

新 agent 只读本 brief + DevPlan DHR_27 任务卡即可开工：终点、边界、五条完成条件与谁验都已写死在下表。两个关键隐含事实必须先知道：①v1 真实现场在 `D:\MyFiles\ai-workflow\dh-crew\.dh-runtime\relay\`（三条 `RELAY-IHSR05-*` run，2026-08-16 产生），主投影对象选 `RELAY-IHSR05-RW-20260816113004`，该现场只读、投影前后须 hash 对证；②Pilot 代码仓不在 dh-relay 本仓，而在仓外实验根 `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\`（DHR_25 已交付 read-model / cli / render 与 fake fixture，本卡在其上加 v1 投影与 `testdata/v1/`）。

## 完成条件 ★必写（= 覆盖任务验收口径的并集，标好谁验）

以下条件逐字复制自 DevPlan §3.2 DHR_27 任务卡「验收口径」（含链接文字原样保留；条件内相对链接以 DevPlan 所在 `dev_plan/` 目录为基准，从本工作区读时需自行加一层 `../`）。

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|------|---------------|--------------------------------|
| 1 | **机器证**：[design/06 §10 P4](../design/06-多控制面与Headless-SSH运行-设计补充.md#10-阶段计划调整) · P4-CM3：冻结 v1 fixture 与活 v1 现场只读投影成功，源文件零写入（前后 hash 对证）。 | AI | DHR_27 · P4-CM3 |
| 2 | **机器证**：P4-CM6a（B-11 由 CM6 拆分）：截至本卡收口，CLI 主线全程不引入 Relay 运行写权、不 fork DSH；审计范围 = DHR_25 / DHR_27 变更范围（`src/cli/`、`src/read-model/`、`src/render/`、`testdata/`）（§4.1）。 | AI | DHR_27 · P4-CM6a |
| 3 | **机器证**：[design/02 B1 子集](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)（只取「legacy 根只读、零新写」子命题，B1 全项不在 P4 关闭）：`.dh-runtime/relay/` 零新写。 | AI | DHR_27 · design/02 B1 子集 |
| 4 | **机器证 · 延后登记**：主报告中 CM4 显式登记为「延后（DHR_50）」、DM 组登记为「事实截至本卡、三态未收敛」；不得写成通过、N/A 或省略（延后不得掩盖失败，§4.5）。**主报告必须含可 grep 锚点 `DM-deferred-facts:`**，其值三选一并附清单：`dm-failures-present`（已有 DM 失败 / 止损命中，逐条列出）/ `stoploss-not-triggered`（已有 DM 事实、止损未命中）/ `no-dm-facts-yet`（桌面轨尚无事实）。（B-11 复审回写） | AI | DHR_27 · DM-deferred-facts 延后登记 |
| 5 | **人判**：[design/05 §14 专属工作台产品面](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#14-专属工作台产品面) · P4-H1 / P4-H4：向用户展示真实终端转录、fixture hash、CLI 输出、版本与实耗；用户判断 ①CLI+SSH 是否足以作为一条独立、正式的控制面（与 DSH 并行、可配置替换，不是保底） ④当前体验是否值得继续建 Relay Runtime。（H2 / H3 涉 DSH，归 DHR_50。） | 人 | DHR_27 · P4-H1+H4 |

## 边界 (Boundaries)

- In scope（= 任务卡「变更范围」逐条）：
  - `src/read-model/`（v1 投影）——位于仓外实验根下 `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\`（`<experiment-root>` = `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\`）
  - `testdata/v1/`——同上，仓外 Pilot 代码仓内
  - `evidence/`——仓外**实验根**下 `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\evidence\`（与 DHR_25 先例一致；E4 需求复核纠正原「Pilot 代码仓内」误标，2026-08-20，见 progress）
  - `docs/modules/dh-relay/design/evidence/10-P4-多控制面Pilot报告.md`（主报告）——dh-relay 仓内
  - 本卡 `workspace/DHR_27/`——dh-relay 仓内
- Out of scope（= 任务卡「非目标」逐条）：
  - 不做 CLI↔DSH 对证（归 DHR_50）
  - 不收敛 DSH 三态（归 DHR_50）
  - 不做棒 0 Proposal（B-11 起归 DHR_50 可选）
  - 不 resume 任何 v1 run
  - 不创建 v2 Run
  - 不改业务仓 DevPlan / workspace
- 何时必须停下问人：（默认只有 E11 一次性确认本地收口授权包、复核降级请求、P0/P1 三轮不收敛或需人裁决；E12/E13 包内机械步骤不重复索权，"待复核 / 待收口"不是停工理由）
  - 补充：v1 活现场投影演示前（触碰 dh-crew 仓真实历史现场，虽只读仍先展示计划的命令）

## 触及子系统（收口时更新其 as-built）

- 无（Pilot 为仓外一次性验证代码，不动 dh-relay 本仓 tools/ 子系统现状；主报告属 design evidence，不属 as-built）
