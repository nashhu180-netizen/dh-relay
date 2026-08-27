# DHR-A-23：通用节点、跨项目任务编排与运行中续接候选

> 状态：形成留痕 · 已由用户明文“确认A23整版”，内容已晋升正式`design/10-薄RelayPlan与显式节点边界-产品设计调整.md`。正式设计以design/10为准；本文不再作为planning input，也不授权修改DevPlan、清理DHR_53、初始化/启用PlanHome、开发、提交或推送。

## 1. 人话目标与核心决定

dh-relay 的 RelayPlan 是一份独立的接力执行计划，可以同时承载多张业务任务卡；任务可以来自同一 DevPlan、不同 DevPlan，甚至不同项目。dh-relay 负责可靠地运行这份计划，不替 DevHarness 定义每张任务卡要做什么。

本轮冻结的产品方向：

1. 逻辑角色仍只有 orchestrator、monitor、executor。施工、复核、回归、决策只是不同节点中的 Executor 工作，不是 Core 业务 `node_type`。
2. RelayPlan 不绑定单一 `task_id`，而是引用一个 TaskRef 集合；每个业务节点绑定一个全限定 TaskRef。控制节点可以绑定受影响 TaskRef 集合。
3. TaskRef 至少区分 `project_ref + devplan_ref + task_id`。`task_id` 是 DevPlan 业务任务卡 ID，不是 Plan ID、Node ID 或 Run ID。
4. Plan 与 Runtime 不寄生在任一业务项目仓。它们归独立 PlanHome；本次自举 PlanHome 选定为 `D:/MyFiles/ai-workflow/02-agent-workspace/dh-relay-workspace`，但产品合同不得硬编码该机器路径。
5. DevHarness/人工/编排 Agent把已拆好的工作步骤写进 RelayPlan；dh-relay 不读取 `task_type` 自动推导施工、复核或返修，也不建设 DevHarness runtime Adapter。
6. 复核发现问题时才加入返修、定向回归、定向复核和全面复核节点。三轮仍未闭合时，另起 fresh 决策 Executor；不复用第三轮 Reviewer，也不新增第四种逻辑角色。
7. 决策 Executor 对受影响业务任务给出结构化处置结论并关闭。编排 Agent接收结论，负责按外部业务治理执行 B-adjust、更新或不更新当前 RelayPlan，并显式选择不受阻塞的 Ready 节点继续。
8. Plan 更新只冻结受影响任务及其依赖闭包；其他无依赖关系的任务和节点不得被一刀切暂停。
9. DHR_53 的单仓、单任务、task_type Recipe 和业务 `node_type` 实现与本候选冲突。候选晋升并完成 B-adjust 后，旧事实留档、冲突实现清理重做。

## 2. 四层对象与身份关系

| 对象 | 含义 | 权威位置 |
|---|---|---|
| DevPlan 业务任务 | 业务计划中的一张任务卡；`task_id` 由所属模块 DevPlan 唯一发号 | 各业务项目的 DevPlan/workspace |
| TaskRef | 跨项目唯一定位业务任务的引用，至少含 project、DevPlan、task ID | RelayPlan source 与 Resolved Plan |
| RelayPlan | 跨任务、跨计划、跨项目的接力编排；`plan_id` 标识计划 | 独立 PlanHome 的 tracked `plans/` |
| Run / generation | 某 RelayPlan 的一次执行及其中一次激活快照；`run_id` 标识运行 | PlanHome 的 ignored `runtime/` |
| Node | RelayPlan 中一个有边界的执行步骤；`node_id` 在 Plan 内唯一 | RelayPlan/Resolved Plan/Runtime |

关系是：

```text
PlanHome
└─ RelayPlan(plan_id)
   ├─ TaskRef(project-A / plan-P1 / task-A01)
   │  ├─ Node: implementation
   │  └─ Node: review
   ├─ TaskRef(project-A / plan-P2 / task-A23)
   └─ TaskRef(project-B / plan-P4 / task-B08)

同一 RelayPlan → 可产生多个 Run
同一 Run → 可激活多个 generation
每个 generation → 保存完整不可变 Resolved Plan 快照
```

Run 根不可变保存 `plan_home_id + plan_id`；不再保存单一 `task_id` 作为 Run 身份。每个 generation 保存完整 `task_refs`、`task_set_digest`、`resolved_plan_digest` 和节点图。Node/Ticket/Result 再绑定精确 TaskRef 或受影响 TaskRef 集合。

## 3. 独立 PlanHome

PlanHome 是接力计划及其运行历史的独立工作仓库，不是 dh-relay 源码仓，也不是某个业务项目仓。通用逻辑结构：

```text
<plan_home>/
├─ plans/       # tracked：RelayPlan source
├─ archive/     # tracked：归档与审计索引
├─ runtime/     # ignored：Run/generation/Ticket/Result 等运行事实
└─ local/       # ignored：本机 project_ref → checkout 路径等解析配置
```

本次用户已授权并创建空 Git 仓库 `D:/MyFiles/ai-workflow/02-agent-workspace/dh-relay-workspace`，分支为 `master`、尚无 commit；它只证明选址，不代表 PlanHome schema、目录或 runtime 已启用。正式设计与对应实现卡完成前不得把空仓库当作可运行新根。

用户级 `~/.dh-relay/` 只保存 PlanHome/Run 的定位索引，不保存计划正文或代替 Runtime Store。tracked Plan 只写逻辑 `project_ref`；本机 checkout 绝对路径放 ignored local binding，Resolved Plan 冻结当次解析出的 repo/worktree/workspace、Git HEAD 与输入摘要。凭据值永不进入 PlanHome tracked/runtime 工件。

`project_ref` 不是 Plan 作者随手起名即可取得的权限。PlanHome 必须有一个受信项目注册表，由 PlanHome 所有者/编排控制面管理，至少钉住 canonical repository identity、业务权威入口、允许的 binding policy、allowed-path/Finalizer policy 和 Authority 来源；本机 local binding 只把已登记项目解析到具体 checkout/worktree，并带独立 revision/digest。Resolver 冻结 registry revision 与 binding digest；注册或 binding 漂移必须重新解析并激活 generation。Plan、registry 或 local binding 都不能自行授予权限，Ticket 的有效能力必须是“节点请求 ∩ 项目 policy ∩ 当次 Authority”的交集。

Plan、Archive 和 Runtime 按既有决定永久保留，不由 Runner 自动删除；Node/Run 收口仍必须撤销 Ticket、关闭 Agent/Pair/终端并释放容量。PlanHome 仓库自身的备份、远端推送和磁盘配额不在本候选自动承诺范围内。

## 4. 通用 RelayPlan 与 TaskRef

概念示例只冻结语义，不冻结字段拼写：

```yaml
plan_id: delivery-wave-2026-08
plan_home_id: local-agent-workspace

tasks:
  - task_ref: project-a/p7/DHR_53
    project_ref: project-a
    devplan_ref: docs/modules/dh-relay/dev_plan/P7-DevHarness单卡完整流水-开发方案.md
    task_id: DHR_53
  - task_ref: project-b/p4/BI_140
    project_ref: project-b
    devplan_ref: docs/modules/bi/dev_plan/P4-开发方案.md
    task_id: BI_140

nodes:
  - node_id: dhr53-implementation
    task_ref: project-a/p7/DHR_53
    depends_on: []
    instruction_ref: workspace/DHR_53/task_plan.md#implementation
    executor:
      account: omp
      model: deepseek-v4-flash
      reasoning: high
      permissions: workspace-write
      session: fresh
    routes:
      completed: {next: dhr53-review}
      blocked: {wait: plan_update_required}

  - node_id: split-decision
    subject_task_refs: [project-a/p7/DHR_53]
    depends_on: [dhr53-review-round-3]
    instruction_ref: runtime-policy/decision-after-three-rounds
    executor:
      account: codex-ninth
      model: terra
      reasoning: high
      permissions: read-only
      session: fresh
    routes:
      decided: {wait: orchestration_action_required}
```

节点做什么由 `instruction_ref` 与对应项目 workspace 合同决定；能力由账号、模型、推理强度、权限和 fresh 约束决定。Runner 只校验 PlanHome、TaskRef、依赖、执行绑定、身份、结果路线和停止点，不按业务标签改变 Agent 行为。

TaskRef 必须解析到唯一项目、唯一 DevPlan 任务行和唯一 workspace；重号、引用漂移、项目未登记、registry/binding digest 错配、checkout/workspace 不存在、越界 locator 或输入摘要变化均 fail-closed。跨项目并不扩大权限：每个节点只能取得其 TaskRef 和 Ticket 明示的项目、worktree、路径与工具能力；Plan 中出现一个 `project_ref` 不等于该 Run 已取得该项目 Authority。

## 5. 通用 Result、路线与显式继续

所有 Executor 使用同一个通用 Result 外壳。`outcome` 表示节点执行是否正常完成；`structured.route` 选择当前节点在 Resolved Plan 已声明的路线：

```json
{
  "protocol": "relay.result/v2",
  "outcome": "succeeded",
  "structured": {
    "route": "changes_requested",
    "task_ref": "project-a/p7/DHR_53",
    "artifact_refs": ["review.md#round-3"],
    "candidate_revision": "rev-3"
  }
}
```

Core 不理解 `passed/changes_requested/decided` 等标签的业务含义，只执行 Plan 冻结的通用效果：

- `next: <node_id>`：关闭当前节点并使依赖满足的既有节点 Ready；不自动 launch。
- `wait: plan_update_required`：关闭当前节点，冻结受影响 TaskRef 依赖闭包，等待编排 Agent动作。
- `wait: orchestration_action_required`：决策节点关闭并交付结论，等待编排 Agent执行外部治理和 Plan 选择。
- `terminal: <allowed outcome>`：按已有终态合同关闭指定作用域或 Run。

Result 不能夹带新状态效果、目标节点或 Plan patch。未知 route、旧 generation/Attempt 重放、非成功 outcome 携带成功路线、TaskRef/subject scope 错配均拒绝。

计划激活与节点启动严格分开。编排 Agent激活新 generation 后，仍须另一次显式 `continue`，并指定或选择当前 Ready 集合；Runner 只启动依赖满足、权限有效、容量允许且未处于受影响闭包的节点。

## 6. 三轮返修与 fresh 决策 Executor

某业务任务复核发现问题后，编排 Agent可在同一 Plan 中为该 TaskRef 增加一轮：

```text
返修并定向回归
→ fresh 定向复核
→ fresh 全面复核/Review Batch
```

每轮使用新 Node、Ticket、Attempt/Pair；施工 Executor 不原地变成 Reviewer。“三轮”是 DevHarness/业务治理规则，不是 Core 的返修枚举。

第三轮仍未闭合时，编排 Agent为受影响 TaskRef 启动 fresh 决策 Executor。完整关闭顺序：Result/Handoff 与 Monitor Report durable → 决策节点关闭 → Ticket 撤销 → Pair/终端释放。决策 Executor不直接修改 DevPlan或RelayPlan、不调用 `continue`，只输出一个结构化结论；结论必须绑定非空、canonical 排序的 `subject_task_refs[]` 及其 `subject_task_set_digest`，同时绑定候选版本、证据和允许动作。单任务只是单元素集合，不另设单数字段。该集合贯穿 Decision Ticket、Result/Handoff、Attention、外部 B-adjust 和后续 Plan update，任一处集合或摘要不一致均拒绝。

结论可为原任务继续、拆分业务任务、请求允许的降级或终止。用户已确认：Decision Executor 的 durable 结论本身不授权外部 B-adjust；编排 Agent仍须取得对应项目 DevHarness 要求的用户确认或既有 Authority，才能修改业务计划。dh-relay Core 不把“模型说拆分”自动等价为业务计划已经修改，也不重复定义 DevHarness 用户确认规则。

## 7. 编排 Agent收到“拆分业务任务”后的处理

若决策结论要求把业务任务 A 拆为 A1/A2：

1. 编排 Agent读取结论和 Handoff，定位受影响 `project_ref + devplan_ref + task_id`。
2. 编排 Agent按该项目 DevHarness 治理执行 B-adjust，使 A1/A2 成为正式 DevPlan 任务卡；跨多个项目时分别遵守各项目权威与权限。
3. 编排 Agent选择当前 RelayPlan 是否承载 A1/A2：
   - **加入**：在原 Plan 追加新 TaskRef、新节点和旧未启动节点的 supersede 记录，激活新 generation。
   - **不加入**：A1/A2 留在业务计划中，等待其他 Plan/Run；当前 Plan 只记录外部处置引用，不强造 `split_from` Core 字段。
4. 编排 Agent从当前 Ready 集合选取不依赖 A、A1、A2 的节点继续；依赖闭包继续等待。

业务 B-adjust 与 RelayPlan 更新不是同一动作。B-adjust 修改任务权威；RelayPlan 更新只决定这次 Run 是否以及怎样继续承载这些任务。每个涉及的业务项目都必须产生 durable 外部 B-adjust receipt/result，至少绑定 request ID、项目 Authority、变更前后 task-set digest、实际新增/替换 TaskRef、结果与证据引用。相同 request ID 重试必须幂等，不得重复建卡；dh-relay 不承诺跨项目自动回滚。

只有本次选择加入当前 Plan 的全部新 TaskRef 都有有效 receipt、能从正式业务权威重新解析，才允许激活新 generation。某项目 B-adjust 失败时，其影响闭包保持 `orchestration_action_required`，其他项目/任务可继续；若业务 B-adjust 已成功但 Plan 更新/激活失败，业务计划保持已生效，旧 generation 不变，编排 Agent以相同 request ID 修正或重试 Plan 动作，不能反向伪称业务卡未创建。

## 8. 同一 Plan 的 generation 更新

不为每次调整创建新的 Plan 目录。原 tracked Plan 保留既有 TaskRef/Node 定义，并在同一文件追加变更记录：

- 新增 TaskRef/Node；
- 将**从未启动**的旧 TaskRef/Node 标记为 superseded；
- 记录 parent plan digest、author、reason、source Result/Handoff、外部 B-adjust/Authority 引用和 request ID。

已 `node_started`、已关闭或存在 active Ticket/Pair 的节点定义不可修改或 supersede。若受影响节点仍 active，必须先按节点合同收口/取消；无关 active 节点可以继续，Plan 更新不得要求整个 Run 全停。

影响闭包的最小确定性定义是：以受影响 TaskRef 绑定节点、明确消费其将被替换输出的节点以及 subject 集合相交的控制/join 节点为 seed，沿显式 `depends_on` 的下游方向求闭包；共享节点只要消费任一受影响输入即进入闭包。路径重叠/容量冲突只限制同时 launch，不自动形成业务依赖闭包。旧 Node/TaskRef 定义永久不可改，supersede 只能用追加记录表达并只命中从未启动对象；新 generation 据此计算 effective graph。

Resolver 以当前 generation 为基线校验：

1. 所有 closed/active 节点定义和身份逐项相同；
2. supersede 只命中未启动节点，且受影响依赖闭包计算稳定；
3. 新 TaskRef 全部能解析到已正式生效的业务任务，所需外部 B-adjust receipt/result 的 request ID、Authority 与 task-set digest 均匹配；
4. registry revision、local binding digest、expected generation/state/parent digest/request ID、Orchestrator Lease 与必要 Authority 均匹配；
5. 影响闭包按上述唯一算法可重算，且无关 active/Ready 状态未被擅改；
6. 新 generation 保存完整不可变 Resolved Plan、TaskRef 集合和两个 digest。

tracked Plan 文件改变本身不改变 Run。激活失败时旧 generation、active/Ready 状态均不变，只产生可观察的 source-changed 提示；成功激活也不自动启动节点。CAS 和 parent digest 拒绝并发丢更新与旧请求重放。

## 9. 跨项目运行边界

跨项目 RelayPlan 不是跨仓 Git 原子事务。每个项目保留自己的：

- DevPlan/workspace 权威；
- worktree、Git HEAD、allowed paths 与 Finalizer；
- 权限、Approval、verify 和收口规则；
- Result/Handoff 引用与项目内证据写入。

一个项目解析失败、权限不足或 B-adjust 未生效，只阻塞它及其依赖闭包；不得污染其他项目 Store、worktree 或任务状态。跨项目节点依赖只有在 Plan 显式声明时成立，Core 不从相似文件名、task ID 或聊天推导隐式依赖。

PlanHome Runtime 是整份 Run 的时间线权威，但不替代各项目 DevPlan 状态。跨项目最终收口允许出现部分任务已完成、部分任务等待/失败；Run 终态和归档必须逐 TaskRef 列出结果，不能用一个总 success 掩盖子任务失败。

## 10. DevHarness 与 dh-relay 的边界

DevHarness 决定业务任务、B-adjust、workspace、施工步骤、复核配方、三轮止损、人验与 verify。编排 Agent依据这些权威编写/更新 RelayPlan。dh-relay 只提供 PlanHome、TaskRef、节点依赖、执行绑定、Ticket/Attempt/Pair、Result/Handoff/Report、路线、generation、显式 `continue`、恢复和历史。

Core schema、Ticket、状态合同、Resolver、Workflow 与生产测试不得出现 DevHarness `task_type`、Recipe 或 `construction/review/rework` 业务节点枚举；不得存在 `relay-core/workflows/dev-harness/` 或换名 Adapter。Review Batch 只消费 Plan 已显式列出的 path set、绑定与 join 规则，Core 不维护 DevHarness review path 闭集。Replanner/Compiler 若保留，只能是 orchestrator 侧的确定性提案/校验服务；Diagnoser/Decision 若由 Agent执行，只能作为 `role=executor` 的普通节点，均不得新增逻辑角色、Lease 类型或第二个 Plan 发布者。

## 11. 对现有设计、P7/P8 与 DHR_53 的 replacement

| 现有口径 | 新口径 |
|---|---|
| repo-local `dh_relay/plans/runtime/archive` | 独立 PlanHome；业务项目只被 TaskRef 引用 |
| Run 根 `plan_id + task_id` | Run 根 `plan_home_id + plan_id`；generation 保存 TaskRef set/digest |
| Plan 只能承载一张任务卡 | Plan 可跨任务、跨 DevPlan、跨项目 |
| Plan 更新必须全 Run 无 Worker且只能追加节点 | 只冻结影响闭包；保留旧定义，追加新 TaskRef/Node 与未启动节点 supersede 记录 |
| 拆任务后关闭原 Run并新建两个 Plan/Run | 编排 Agent先做业务 B-adjust，再选择新任务加入当前 Plan或留给其他 Plan；无关任务继续 |
| P8“不做跨仓 Run” | superseded；P8 承接真实多任务/跨项目调度和重编排 |
| Plan `task_type Recipe` / 业务 `node_type` | 删除；Plan 直接列实际通用节点与执行绑定 |
| DHR_60 DevHarness Adapter | 改为真实 DevHarness 接力验收，不建设 runtime Adapter |

`HC-3AT-A19` 的 repo-local 新根、`HC-3AT-A31` 的单 `task_id` Run 身份及其反例标记为 superseded；旧验收中依赖 task_type Recipe/业务 `node_type` 的部分同样由本轮新验收替代。运行历史永久保留、Ticket/Pair 身份链、显式 `continue`、HostSessionActor 物理单写者等不冲突语义继续有效。

## 12. 拟新增验收

### `HC-3AT-A32` · 独立 PlanHome 与全限定 TaskRef

Plan source、archive 和 runtime 归独立 PlanHome；Plan 可引用多个 `project_ref + devplan_ref + task_id`。受信项目注册表钉住 canonical repo identity、policy 与 Authority 来源，ignored local binding 只解析 checkout 且有 revision/digest，不能授予权限。task ID 重号、未知项目、registry/binding 错配、任务/workspace 不存在、locator 越界或输入摘要漂移均 fail-closed。Run 根不含单一 task ID；generation 保存完整 TaskRef set/digest 与 Resolved Plan digest。

### `HC-3AT-A33` · 通用节点、执行绑定与 Result 路线

Core 无业务 `node_type`；节点以 TaskRef/subject set、instruction、依赖、精确 Executor 绑定和允许路线界定工作。所有 Executor 使用通用 Result 外壳；Result 不能携带 Plan patch或新状态效果，错 TaskRef/route/generation/Attempt 均拒绝。

### `HC-3AT-A34` · 影响闭包重编排与 generation

编排 Agent可在原 Plan 追加 TaskRef/Node 和未启动节点 supersede 记录；closed/active 节点不可修改。Plan 激活只冻结受影响依赖闭包，无关 active/Ready 节点保持可运行。校验 parent digest/CAS/Authority 后形成完整不可变 generation，但不自动 launch；失败、并发、重放均不产生半激活。

### `HC-3AT-A35` · 三轮止损与 fresh 决策 Executor

三轮仍未闭合时由独立 Ticket 启动 fresh 决策 Executor；其 Result/Handoff/Monitor Report durable 后关闭并释放 Pair。结论绑定 canonical 非空 `subject_task_refs[]`、集合摘要和候选版本，只交给编排 Agent处理，不由 Decision Executor 修改 DevPlan/Plan或调用 `continue`。

### `HC-3AT-A36` · 无 DevHarness runtime Adapter

Core 不读取 task_type/Recipe、不包含业务节点枚举或 DevHarness workflow 目录，也能执行由外部编排 Agent写好的显式 Plan。机器扫描和真实 E2E 同时证明不存在换名 Adapter。

### `HC-3AT-A37` · 通用 Review Batch

Batch 只使用 Plan 显式 path set、candidate revision、执行绑定和 join 规则；缺路径、错 revision、错权限、施工者自审或用户例外缺 Authority 均拒绝，Core 不推导 DevHarness review path。

### `HC-3AT-A38` · 跨项目隔离与部分失败

至少两个项目的 TaskRef 在同一 Plan 中运行；每项目保留独立 registry/binding、worktree、权限、DevPlan、B-adjust receipt 与 Finalizer。一个项目解析、权限、B-adjust或执行失败只冻结按唯一算法重算出的影响闭包，另一项目无依赖 Ready 节点可由显式 `continue` 启动；Run 汇总逐 TaskRef 如实列出部分结果。B-adjust 成功而 Plan 激活失败、相同 request ID 重试、跨项目无自动回滚均有反例。

### `HC-3AT-H11` · 拆分业务任务后的编排选择

用户观察某任务三轮失败后 Decision Executor给出拆分结论并关闭；编排 Agent完成业务 B-adjust，然后演示“新任务加入当前 Plan”和“不加入当前 Plan”两种合法选择，并继续一个不受阻塞的其他项目任务。用户能区分业务任务调整、Plan generation 激活和节点启动三个动作。

### `HC-3AT-H12` · PlanHome 与跨项目追溯

展示独立 PlanHome 中的 tracked Plan、ignored runtime、两个项目的 TaskRef、每 generation 完整摘要和各项目 workspace/HEAD 证据。用户能从一个 Run 追到各业务任务，又不会把 PlanHome 当成项目 DevPlan 或把 runtime 目录存在误判为 Agent仍存活。

## 13. DHR_53 冲突施工的审计与重做

正式 A/B 生效后才处理：

1. 候选复核基线固定为 master `eec59620b45caaec3123ebab840b2684ef4e2c1b`、`wt/DHR_53` HEAD `fec9ec1bbbab90813d7d3f3aad1dc847c317ca81` 及前置提交 `b619e4a/cb8a911`。正式重做前再将 DHR_53 HEAD 固定到不可变 archive ref，生成 tree/file manifest，并把当时选定的 master 完整 SHA 作为重建基线写入 workspace；不得用会漂移的“latest master”代替 SHA。
2. 旧 `task_type/Recipe/node_type`、单 repoRoot、单 `task_id` Run Binding 和 repo-local 新根证据标记 `superseded-by-DHR-A-23`；旧通过数不计入新验收。
3. 通用 digest/history/JCS 等能力逐项重验后才可复用；不能整体继承。
4. 保留 archive ref/提交和 manifest 可回读，先从已登记的精确 master SHA 重建 DHR_53 工作现场；若之后需要跟进更新的 master，作为独立 rebase/基线切换留痕，不用 destructive reset 覆盖历史。

## 14. 不变边界与已确认授权点

- 三类逻辑角色、Ticket/Attempt/Pair、Worker 不拥有 Run 控制权、节点关闭后撤权、显式 `continue`、Workflow Engine/HostSessionActor 单写边界不变。
- 本候选不冻结具体 YAML/JSON 字段名，不授权初始化 PlanHome 目录结构或运行新根。
- 用户已在理解确认中选择：决策 Executor的“确定拆分”不能直接成为 B-adjust 的业务授权；编排 Agent必须先取得对应项目既有 DevHarness Authority/用户确认，未取得时 fail-closed。
- A23 已正式晋升；仍需独立 B-adjust 才能修改 P7/P8 和 DHR_53 卡面，设计确认不等于开发开工。
