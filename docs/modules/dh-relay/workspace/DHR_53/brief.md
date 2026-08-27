<!-- dh:v1 -->
# brief — DHR_53 PlanHome、TaskRef 与通用计划合同

> 状态：`superseded-by-DHR-A-23` 后的正式新卡面。旧 worktree 与 `wt/DHR_53` 分支已于 2026-08-27 删除，完整旧实现由 `archive/DHR_53/pre-A23-fec9ec1` 和 `archive/legacy-fec9ec1-path-blob-manifest.md` 保留审计；旧测试/review 不计入本卡新验收。当前未授权创建新 worktree、重建或恢复施工。

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_53 | P7 | `dev_plan/P7-DevHarness单卡完整流水-开发方案.md` §3.2 DHR_53 |

## 目标

冻结独立 PlanHome、全限定 TaskRef、可承载多个 TaskRef 的 RelayPlan/Resolved Plan、通用节点和 Run/generation 历史合同，并交付确定性 Resolver。Core 只执行 Plan 显式写出的节点，不读取 dev-harness `task_type`/Recipe，不维护施工/复核/返修等业务 `node_type`，也不建设 DevHarness workflow/adapter。

## 完成条件

| # | 条件 | 谁验 | 来源 |
|---|---|---|---|
| 1 | Plan source/archive/runtime/local 归独立 PlanHome；业务仓和 dh-relay 源码仓不是产品级 Plan 根。 | AI | design/10 `HC-3AT-A32` |
| 2 | TaskRef = `project_ref + devplan_ref + task_id`；同一 Plan 可含多个 TaskRef，task ID 重号、未知项目、registry/binding 漂移、任务/workspace 不存在或 locator 越界均 fail-closed。 | AI | design/10 `HC-3AT-A32` |
| 3 | 工作节点绑定精确 TaskRef，控制/join/Decision 节点绑定 canonical 非空 `subject_task_refs[]` 与 set digest；节点以 instruction、depends_on、executor binding 和允许 route 定义，不含业务 node_type。 | AI | design/10 `HC-3AT-A33` |
| 4 | Run 根只绑定 `plan_home_id + plan_id`；每 generation 保存完整 TaskRef set/digest 与 Resolved Plan digest；同一 Plan 可多 Run，旧 generation 不可变。 | AI | design/10 `HC-3AT-A32/A34` |
| 5 | Core 生产 Schema/Resolver/Workflow/Ticket/状态/测试零 `task_type`、Recipe、施工/复核/返修枚举、`workflows/dev-harness` 及换名等价层；合法 Herdr/Host/client adapter 保留。 | AI | design/10 `HC-3AT-A36` |
| 6 | terminal runtime 永久保留但不可 continue、不占 Agent/Pair 容量；目录存在不代表 live Agent；半写/缺失 fail-closed 且不删除其他历史。 | AI | design/10 `HC-3AT-A30` |
| 7 | 离线反例证明 schema/Resolver 没退回 repo-local、single task 或单项目假设；真实两项目同时调度留给 P8。 | AI | P7 DHR_53 分账；design/10 `HC-3AT-A32/A38` |
| 8 | 人判：5 分钟内从 PlanHome 展示 Plan、generation digest、TaskRef、registry/binding digest、workspace/HEAD 与 runtime/live 区别。 | 人 | design/10 `HC-3AT-H12` 的 P7 子集 |

## 边界

- **In scope**：`relay-core/contracts/`、`relay-core/resolver/`、`relay-core/runtime/` 的精确 PlanHome/关联适配、fixtures/tests、必要的 ignore 断言、DHR_53 workspace。
- **Out of scope**：真实跨项目调度、Workflow Effect/continue、Ticket 派发、Pair/Launcher、Review Batch、Role Relay、恢复、Decision 启动；P5/P6/DHR_30/DHR_31 卡面；正式 PlanHome 初始化；push/deploy。
- DevPlan 的 `task_type` 继续由 dev-harness 自身使用，不属于“删除”范围；禁止的是 dh-relay Core 消费它。
- 本文件与新 `task_plan.md` 是重建后的当前施工权威。主树中的旧 `execution_strategy.md`、`visual_map.md`、`review.md`、`decisions.md` 只保留历史形成事实；其旧版本也可由 archive tag 精确读取。待新施工授权后按新实现重新生成/回填，不得据其旧步骤施工。

## 当前停止点

旧现场退役已完成。P5/P6 前置 Gate、DHR_30 稳定接口和新施工授权满足前，只能维护计划与退场证据；不得创建新 worktree、实现代码、初始化 PlanHome 或继续旧批次。
