# 薄 RelayPlan、跨项目任务编排与显式节点边界：产品设计与验收
<!-- dh:planning-event:v1 id=DHR-A-23 stage=A-full artifact=design/10-薄RelayPlan与显式节点边界-产品设计调整.md review=evidence/17-通用节点与运行中计划续接-交叉审核记录.md#review-a23 understanding=evidence/17-通用节点与运行中计划续接-交叉审核记录.md#understanding-a23 -->

> 状态：当前唯一正式 `designInputs[]`，先后经历 `DHR-A-17`、`DHR-A-19`、`DHR-A-21`、`DHR-A-23` 四次 A-full 确认。`DHR-A-23` 经用户明文“确认A23整版”晋升，取代本文此前的 repo-local、单任务、task_type Recipe 与业务 `node_type` 口径；不修改 DevPlan、DHR_30、DHR_53 工作现场，不初始化/启用 PlanHome，也不授权 B-adjust、开发、提交或推送。
>
> 起因：用户确认第一版收缩为“薄 RelayPlan + Worker 自读 workspace + 最小节点启动票据 + best-effort Herdr 角色转发”，并要求施工、复核等步骤具有硬边界，施工 Worker 写完代码后不得自行进入复核。
>
> `DHR-A-23` 当前冻结：RelayPlan 是独立的多任务接力计划，可跨 DevPlan、跨项目；Run 根保存 `plan_home_id + plan_id`，generation 保存完整 TaskRef set/digest 与 `resolved_plan_digest`。三类角色、Ticket/Pair、显式 `continue`、恢复、Role Relay、运行资源释放和 runtime 永久保留等不冲突合同继续有效。

## 0. 阅读约定与核心术语

本文中英文代码名均是尚待实现卡冻结的产品语义，不是可直接调用的现有命令。每段后的“术语说明”只解释该段新出现的词；同一含义不反复堆砌。`Run`（一次接力执行）、`Node`（Run 中不可跨越的一个步骤）、`Attempt`（某 Node 的一次执行尝试）、`Ticket`（Runner 签发给该 Attempt 的最小授权票据）是理解后文的四个基础词。

> 术语说明：**持久**指已由 Runtime Store 原子落账、崩溃后可恢复；**权威工件**指可改变业务状态的 Result、Handoff、Attention、Approval 或控制 Receipt，普通聊天和终端文本不属于它。`PlanHome` 是独立保存 RelayPlan 与运行历史的工作仓库；`TaskRef` 是 `project_ref + devplan_ref + task_id` 组成的跨项目业务任务引用；`generation` 是一个 Run 的完整不可变 Resolved Plan 快照。

## 1. DHR-A-23 当前产品合同

dh-relay 的 RelayPlan 是一份独立接力执行计划，可以同时承载多张 DevPlan 业务任务卡；任务可来自同一或不同 DevPlan，甚至不同项目。dh-relay 负责可靠运行这份计划，不替 DevHarness 规定每张任务卡的业务步骤。

1. 逻辑角色只有 orchestrator、monitor、executor。施工、复核、回归、诊断和决策只是不同节点中的 Executor 工作，不是 Core 业务 `node_type`。
2. RelayPlan 引用一个 TaskRef 集合；工作节点绑定精确 TaskRef，控制/join/决策节点绑定 canonical 非空 `subject_task_refs[]` 及集合摘要。
3. `task_id` 只表示所属 DevPlan 的业务任务卡 ID，不是 Plan、Run 或 Node 身份。
4. Plan 与 Runtime 归独立 PlanHome，不寄生在 dh-relay 源码仓或任一业务项目仓。
5. DevHarness、人工或编排 Agent把已拆好的步骤写进 Plan；Core 不读取 `task_type` 推导业务流程，不建设 DevHarness runtime Adapter。
6. 复核发现问题后才增加返修/回归/复核节点。三轮未闭合时启动 fresh Decision Executor，交付结论后关闭。
7. Decision 结论不自动授权 B-adjust。编排 Agent取得对应项目 Authority 后执行业务 B-adjust，并决定新任务加入或不加入当前 Plan。
8. Plan 更新只冻结受影响 TaskRef 及显式下游依赖闭包；无关 active/Ready 节点可继续。

### 1.1 对象身份与信息归属

| 对象/层 | 当前权威内容 | 明确不承担 |
|---|---|---|
| 各项目 DevPlan + workspace | 业务任务、目标、范围、验收、allowed paths、施工步骤、复核配方、进度与签收 | Plan/Run 状态、跨项目编排 |
| TaskRef | 唯一定位 `project_ref + devplan_ref + task_id` | 不复制业务任务全文，不授予项目权限 |
| tracked PlanHome `plans/` | TaskRef 集合、通用 Node、依赖、instruction_ref、Executor 绑定、允许 route | 不重抄 DevPlan/workspace，不保存凭据或运行 Receipt |
| ignored PlanHome `runtime/<run_id>/` | Resolved Plan、generation、Ticket/Attempt/Pair、Result/Handoff/Report、Attention/Approval、恢复事实 | 不保存可人工编辑的计划源或普通聊天正文 |
| tracked PlanHome `archive/` | 归档与审计索引 | 不冒充 live Run |
| ignored PlanHome `local/` | 本机 project_ref 到 checkout/worktree 的解析 binding | 不授予权限，不进入通用产品路径 |

一份 RelayPlan 可引用多个 TaskRef 并产生多个 Run；一个 Run 可激活多个 generation。Run 根不可变保存 `plan_home_id + plan_id`，不再以单一 `task_id` 作为 Run 身份；每个 generation 保存完整不可变 Resolved Plan、`task_refs`、`task_set_digest` 与 `resolved_plan_digest`。Node/Ticket/Result 再绑定精确 TaskRef 或 subject 集合。

### 1.2 独立 PlanHome 与项目权限

PlanHome 是独立工作仓库。当前自举选址为 `D:/MyFiles/ai-workflow/02-agent-workspace/dh-relay-workspace`，但该绝对路径不是产品合同；空仓库存在不代表目录 Schema 或新根已启用。通用结构为：

```text
<plan_home>/
├─ plans/       # tracked：RelayPlan source
├─ archive/     # tracked：归档与审计索引
├─ runtime/     # ignored：运行事实
└─ local/       # ignored：本机项目绑定
```

用户级 `~/.dh-relay/` 只保存 PlanHome/Run 定位索引。Plan、Archive、Runtime 按既有决定永久保留，不由 Runner 自动删除；Node/Run 收口仍须撤销 Ticket、关闭 Agent/Pair/终端并释放容量。PlanHome 备份、远端推送和配额不在本设计自动承诺范围内。

`project_ref` 必须来自 PlanHome 所有者/编排控制面维护的受信项目注册表，注册表至少钉住 canonical repository identity、业务权威入口、binding policy、allowed-path/Finalizer policy 与 Authority 来源。本机 local binding 只把已登记项目解析到 checkout/worktree，并带 revision/digest。Resolver 冻结 registry revision 与 binding digest；Ticket 有效能力是“节点请求 ∩ 项目 policy ∩ 当次 Authority”的交集。Plan、registry、binding 任一项都不能自行授予权限。

### 1.3 通用 RelayPlan

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

节点做什么由 `instruction_ref` 与对应项目 workspace 合同决定；能力由账号、模型、推理强度、权限和 fresh 约束决定。Runner只校验 PlanHome、TaskRef、依赖、执行绑定、身份、结果路线和停止点，不按业务标签改变 Agent 行为。TaskRef必须解析到唯一项目、唯一DevPlan任务行和唯一workspace；重号、引用漂移、项目未登记、registry/binding digest错配、checkout/workspace不存在、locator越界或输入摘要变化均fail-closed。

禁止把目标/验收、allowed paths、task_plan、普通聊天、凭据、Pane/Attempt/Receipt等业务或运行全文复制回Plan。Core Schema、Ticket、状态合同、Resolver、Workflow和生产测试不得出现DevHarness `task_type`、Recipe或`construction/review/rework`业务节点枚举；不得存在`relay-core/workflows/dev-harness/`或换名Adapter。

### 1.4 通用 Result 与显式路线

所有 Executor 使用同一个通用 Result 外壳；`outcome` 表示节点是否正常执行，`structured.route` 只能选择当前 Resolved Plan 已声明的路线：

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

Core不解释`passed/changes_requested/decided`等业务标签，只执行Plan冻结的通用效果：`next:<node>`使依赖满足的既有节点Ready但不自动launch；`wait:plan_update_required`或`wait:orchestration_action_required`关闭当前节点并冻结对应影响闭包；`terminal:<allowed outcome>`关闭Plan允许的作用域或Run。Result不能携带Plan patch、新状态效果或任意目标节点；错route、TaskRef、generation、Attempt或旧身份重放均拒绝。

计划激活与节点启动严格分开。编排Agent激活新generation后，仍须另一次显式`continue`选择当前Ready Unit；Runner只启动依赖满足、权限有效、容量允许且不处于受影响闭包的节点。

### 1.5 generation 更新与影响闭包

不为每次调整新建Plan目录。tracked Plan保留旧TaskRef/Node定义并追加新TaskRef/Node、变更记录，以及只命中从未启动对象的supersede记录；已`node_started`、已关闭或存在active Ticket/Pair的定义不可修改或supersede。若受影响节点active，先按节点合同收口/取消；无关active节点可继续。

影响闭包以受影响TaskRef绑定节点、明确消费其被替换输出的节点，以及subject集合相交的控制/join节点为seed，沿显式`depends_on`下游方向求闭包；共享节点消费任一受影响输入即进入闭包。路径重叠/容量冲突只限制同时launch，不自动形成业务依赖。旧定义不可改，supersede只能是追加记录；新generation据此计算effective graph。

Resolver以当前generation为基线校验：closed/active身份与定义不变；supersede只命中未启动对象；新TaskRef已在正式业务权威生效；逐项目B-adjust receipt/result的request ID、Authority与task-set digest匹配；registry/binding digest、expected generation/state、parent digest、Orchestrator Lease和CAS匹配；影响闭包可重算且无关active/Ready状态未被改写。成功后保存完整不可变Resolved Plan、TaskRef set/digest和Plan digest；失败时旧generation不变，只产生可观察提示；成功也不自动launch。

### 1.6 跨项目与 B-adjust 边界

跨项目RelayPlan不是跨仓Git原子事务。每个项目保留自己的DevPlan/workspace权威、worktree/HEAD、allowed paths、Finalizer、Authority、verify和收口规则。一个项目失败只阻塞它及显式下游闭包；跨项目依赖只有Plan明示时成立；Run汇总逐TaskRef列出成功、等待或失败，不能以一个总success掩盖子任务失败。

业务B-adjust与RelayPlan更新是两个动作。每个涉及项目必须产生durable外部B-adjust receipt/result，绑定request ID、项目Authority、变更前后task-set digest、实际新增/替换TaskRef和证据。相同request ID重试幂等，不得重复建卡；dh-relay不承诺跨项目自动回滚。只有准备加入当前Plan的全部新TaskRef都有有效receipt并可从正式业务权威重新解析，才允许激活generation。B-adjust失败时影响闭包等待、无关节点继续；B-adjust已成功但Plan激活失败时业务计划保持生效、旧generation不变，编排Agent以相同request ID修正或重试Plan动作。

## A. DHR-A-21 及更早形成史（DHR-A-23 已替换冲突部分）

> 本节至旧§3只保留此前“薄 Plan”形成理由与历史样例，不再是当前 PlanHome、Run/Task身份、Resolver或节点业务分类合同。凡出现 repo-local `dh_relay/`、单一`task_id` Run根、`task_type` Recipe、业务`node_type`或DevHarness Adapter，均由当前§1及`HC-3AT-A32~A38`取代；后续B-adjust不得把这些历史样例当规划输入。

### A.1 历史调整目标

上一版正式形成稿（现归档于`design/archive/09-...`）为了零上下文派发、崩溃恢复和旧实例隔离，把RelayPlan、Contract Brief与Message Router设计得过重，重复承载了DevPlan/workspace已有的业务信息，也把非权威聊天提升成接近可靠消息队列的复杂度。

本次调整只保留支撑三 Agent 接力所需的最小机制：

1. `dh_relay/plans/` 只保存薄编排索引，不复制 DevPlan、workspace 或任务 Brief；
2. 编排 Agent调用 `continue`，Runner确定性生成当前节点的 Work Item Ticket；
3. Worker依据票据进入精确 worktree，自行读取 AGENTS 与指定 workspace；
4. 施工、复核、验证、诊断是不同 Node，节点完成后硬停止，不允许同一 Worker跨阶段；
5. 普通 Agent交流走 best-effort 角色转发，不建设消息队列和聊天可靠性协议；
6. Result、Handoff、Attention、Approval 等权威工件仍保留原有持久性和身份隔离。
7. 重核卡在代码复核轮1及其整改闭合后，以一个受限Review Batch同时启动代码轮2、需求、一致性、教训四条适用路径；一个Monitor监督多个Reviewer Executor。

### A.2 历史三层信息归属（已被§1.1~§1.2替换）

| 层 | 权威内容 | 明确不放 |
|---|---|---|
| DevPlan + `workspace/<task>/` | 任务目标、范围、验收、允许路径、施工计划、进度、发现、复核和签收证据 | Run 状态、Agent/Pane、消息队列 |
| `dh_relay/plans/` | `task_id`、workspace locator、节点顺序/依赖、节点类型、必要的 Profile/Review Mode 覆盖 | 重抄目标/验收/task_plan、运行 Receipt、聊天、凭据 |
| `dh_relay/runtime/<run_id>/` | 本次解析快照、Git/workspace 摘要、Ticket、Attempt/Pair、Result/Handoff、Attention/Approval、恢复事实 | 可人工编辑的计划源、普通聊天正文 |

`plans/` 不是第二套 DevPlan。计划源发生 Git 变化也不直接改变 active Run；重新解析并激活后才形成新的运行 generation。

Plan 与 Run 是一对多关系：`plans/<plan_id>` 是可重复使用的路线，`runtime/<run_id>` 是一次实际执行现场。同一 Plan 可以产生多个 Run；每个 Run 根必须不可变保存 `plan_id + task_id`，每个被激活的 generation 必须保存当次 `resolved_plan_digest`（运行计划快照指纹）。关联权威在 runtime 一侧，Plan 文件不因 Run 创建或结束而反写 `run_id`。同一 Run 的新 generation 不得改变 `plan_id` 或 `task_id`；若需要改变任一身份，必须创建新 Run。

### A.3 历史单任务 RelayPlan（已被§1.3~§1.6替换）

#### A.3.1 历史最小语义

每份计划源只回答：跑哪张任务卡、去哪个 workspace、节点怎样接力、哪些节点需要显式 Profile/Mode 覆盖。

```yaml
plan_id: DHR_60-default # 计划唯一名称：DHR_60 的默认接力编排
task_id: DHR_60 # 对应的 DevPlan 任务卡 ID
workspace: docs/modules/dh-relay/workspace/DHR_60 # Worker 要自行读取的任务现场

flow: # 大阶段顺序；不是完整业务说明书
  - construction # 施工：实现当前任务
  - review_recipe # 按复核配方展开复核节点

review_recipe: # 复核路径从任务类型配方解析，而非手写删除
  source: task_type_registry # 读取 task_type 对应的必做复核路径

profile_overrides: # 仅指定路径的执行 Profile，不能删减或降级路径
  code_round_2: reviewer-codex # 代码复核第 2 轮使用 Codex reviewer
  requirement_direction: reviewer-claude # 需求方向复核使用 Claude reviewer
```

上例只表达语义，不冻结 YAML、文件名或字段拼写。`flow` 只能表达大阶段和依赖提示，不能手写删除 Review Recipe 的必做路径，也不能把上游要求 dedicated/fresh 的路径降为 inline。Resolver根据 `task_type` 展开唯一 `node_id`、依赖、applicability、execution mode和Review Work Item；缺路径、无N/A依据或非法降级时fail-closed。第一张承重契约卡再冻结物理Schema；不得在开发时扩回完整业务副本。

> 术语说明：**Resolver（解析器）**把薄计划和任务类型展开为实际节点；**dedicated/fresh**表示必须使用独立、未参与施工的复核实例；**fail-closed（失败即阻断）**表示信息不全时不猜测、不启动。

#### A.3.2 历史解析语义

Run启动时由确定性 resolver 读取：

- DevPlan任务行及 `task_type`；
- workspace精确路径和存在性；
- workspace中的 `brief.md`、`task_plan.md` 等静态合同输入；
- 当前 Git/worktree事实；
- Review Recipe与适用性；
- 安全的 Profile registry及计划覆盖。

Workflow Engine产生“激活Resolved Plan”的业务转换命令，由Runtime `HostSessionActor`（DHR_30合同中的物理单写者）串行落入runtime Store；Workflow Engine、CLI、Launcher均不直接打开Store写句柄。编排 Agent不手工拼这些字段，Runner也不推理业务内容。激活命令必须绑定 Run 根已冻结的 `plan_id + task_id`，并为本 generation 写入 `resolved_plan_digest`；身份不一致、字段缺失或摘要错配时 fail-closed。Resolved Plan冻结Plan、Recipe、applicability/mode、Review Batch的launch group/join规则、静态workspace输入和精确worktree HEAD的摘要；`progress.md`、`findings.md`等节点运行中允许追加的工件只按各自写入合同管理，不被误当成必须保持不变的静态输入。

## 4. Work Item Ticket：节点启动票据

### 4.1 `continue` 与 Worker动作分离

`continue` 只属于编排 Agent到Runner的控制面：

```text
编排 Agent：dh run continue <run_id> --expected-generation <g> --expected-state <s> --request-id <id>
  -> Runner以CAS校验caller、generation和state
  -> Runner选择唯一Ready Unit（单Node或一个已解析Review Batch）
  -> 单Node生成一张action=execute_node的Ticket
  -> Review Batch生成一张Monitor Ticket和每条适用路径各一张Worker Ticket
  -> Launcher启动该Ready Unit
```

零Ready返回`no_ready`；多个互不属于同一已解析launch group的Ready Node返回`ambiguous_ready`；同一Review Batch中的多条Ready路径是一个合法Ready Unit；旧generation返回`stale_generation`。相同request重复调用返回同一单Node或Batch Receipt，不创建第二组Attempt/Pair。Worker Profile不具备`continue/start/stop/launch`控制能力，Worker永远不会收到“继续整份Plan”的授权，只收到“执行当前节点”的票据。

### 4.2 最小票据

普通工作节点示意：

```yaml
action: execute_node
ticket_id: <ticket_id>
ticket_digest: <sha256>
ticket_receipt_id: <receipt_id>
run_id: <run_id>
generation: <generation>
task_ref: project-a/p7/DHR_60
node_id: dhr60-implementation
instruction_ref: workspace/DHR_60/task_plan.md#implementation
pair_id: <pair_id>
executor_attempt_id: <attempt_id>
agent_instance_id: <agent_instance_id>
role: executor
profile_id: <profile_id>
workspace: docs/modules/dh-relay/workspace/DHR_60
worktree: D:/.../.dh-worktrees/DHR_60
worktree_head: <git_sha>
resolved_plan_digest: <sha256>
workspace_input_digest: <sha256>
handoff_ref: runtime/.../handoff.json
result_contract: relay.result/v2
stop_after: node_closed
expires_at: <timestamp>
```

Plan 显式列出的复核路径节点示意：

```yaml
action: execute_node
ticket_id: <ticket_id>
ticket_digest: <sha256>
ticket_receipt_id: <receipt_id>
run_id: <run_id>
generation: <generation>
task_ref: project-a/p7/DHR_60
node_id: review-code-round-2
instruction_ref: workspace/DHR_60/review.md#code-round-2
review_path_id: code_round_2
batch_id: <review_batch_id>
batch_revision: <batch_revision>
candidate_revision: <revision>
pair_id: <pair_id>
executor_attempt_id: <attempt_id>
monitor_attempt_id: <monitor_attempt_id>
agent_instance_id: <agent_instance_id>
role: executor
profile_id: <profile_id>
workspace: docs/modules/dh-relay/workspace/DHR_60
worktree: D:/.../.dh-worktrees/DHR_60
worktree_head: <git_sha>
resolved_plan_digest: <sha256>
workspace_input_digest: <sha256>
candidate_ref: runtime/.../candidate.json
result_contract: relay.result/v2
stop_after: node_closed
expires_at: <timestamp>
```

以上字段冻结产品语义，不提前冻结物理序列化格式；第一张承重合同卡必须将其落成版本化Schema并通过负向测试。`handoff_ref`、`candidate_ref`与Batch字段只在当前节点合同声明需要时出现，不是所有通用节点的固定业务字段。对Worker可读的业务核心只有TaskRef/Node、instruction、精确现场、输入引用、通用Result合同和停止点；其余身份封套全部由Runner自动生成，不增加编排Agent负担。Ticket按JCS摘要并绑定Receipt；单Node的Monitor得到独立Monitor Ticket。Review Batch采用父Batch/子Pair身份：父Batch任一时刻最多一张active batch-scoped Monitor Ticket；每个Reviewer子项有独立Ticket、Attempt和Pair，并共同指向父`batch_id`。Monitor不得复用Executor身份。Result/Report必须回带Ticket身份链，旧Ticket、过期Ticket、错TaskRef/HEAD、错Pair/Attempt/Agent、错Batch/revision或摘要不符均拒绝推进。

Batch专属Schema至少冻结以下必填关系：

- Batch Monitor Ticket：`batch_id/batch_revision/candidate_revision/expected_path_set/path_set_digest/monitor_attempt_id/monitor_instance_id`；
- Reviewer Ticket：`batch_id/review_path_id/pair_id/candidate_revision/monitor_attempt_id`；
- 路径级Monitor Report：`batch_id/review_path_id/pair_id/candidate_revision/monitor_attempt_id/monitor_instance_id/verdict`；
- Batch Join Result：`batch_id/batch_revision/candidate_revision/path_outcome_refs/join_verdict`。`path_outcome_refs[]`逐路绑定`review_path_id/outcome_type`；`outcome_type=reviewed`必须带`result_ref/report_ref`，`outcome_type=na`必须带`applicability/evidence_ref/resolver_digest`，`outcome_type=user_overridden`必须带`approval_ref/approver_receipt_id/missing_path_id/reason/advance_scope`。缺少对应类型必填引用时Join fail-closed。

旧Monitor被替换时，其Ticket与尚未提交的Report能力立即撤销，迟到Report拒绝。已经durable接受的路径Result/Report继续有效；新Monitor只接管父Batch和未完成路径。为避免把旧Monitor身份动态塞回正在工作的Pair，替换时撤销所有未完成子Pair，为这些路径创建新Attempt/Pair；已完成路径不重跑。

`stop_after`不是提示语。Runner在`node_closed`后撤销该Ticket对应的结果提交与Router发送能力，Host Adapter精确停用/关闭Pair；任何ack后写入、迟到Result或Worker自发控制调用只记诊断或返回稳定拒绝码，不能改变Node或下一节点。

### 4.3 Worker如何恢复现场

Worker收到Ticket后按固定入口工作：

```text
进入 Ticket.worktree
  -> 读取仓根 AGENTS
  -> 读取 Ticket.workspace 下的 brief/task_plan/progress/findings
  -> 读取 Handoff 或 candidate_ref
  -> 只执行 instruction_ref 与当前Node边界内的工作
  -> 按当前节点合同提交candidate/Report/Result中的合法工件
  -> 收到node_closed后停止
```

Ticket只负责定位和隔离，不重抄workspace全文。路径缺失、TaskRef/registry/binding/worktree不一致、静态输入摘要漂移、HEAD不符、instruction越界或执行绑定不合法时fail-closed，不能让Worker自行猜现场。任何承重实现开始前必须先冻结Plan、Resolved Plan、Ticket、Result/Report、`continue` request/Receipt、Role Relay request/snapshot/result和Node状态枚举的Schema；“字段名候选”不能带入开发完成判定。

## 5. 显式阶段边界

### 5.1 当前节点完成不等于下一节点启动

以下用 DevHarness 在 Plan 中明确列出的施工节点举例；“施工”来自 instruction/workspace，不是 Core `node_type`。该节点的合法尾部只有：

```text
施工Executor提交delivery_candidate
  -> Runner返回candidate_accepted
  -> Monitor检查该candidate并提交Monitor Report
  -> Report结论为handoff_ready
  -> Executor提交引用candidate/report的唯一final Result与Handoff候选
  -> Workflow Engine生成带guard的收口命令，HostSessionActor原子持久化final Result、Handoff、node_closed与next_ready
  -> Runner只在该转换durable后返回final_result_committed
  -> 精确关闭施工Pair并撤销Ticket能力
  -> 下一复核节点保持ready，等待新的continue
```

`candidate_accepted`不等于最终Result提交；`final_result_committed`只表示final Result、Handoff、`node_closed`和`next_ready`已经由单写者原子持久化，仍不等于下一节点启动。提交期间Runner/Runtime崩溃时只有两种可恢复结果：整笔未提交，重试原Receipt后重新执行；或整笔已提交，重试返回同一`final_result_committed` Receipt。不得出现“已回成功但Handoff/节点终态缺失”的第三种状态。candidate被要求返工时只产生新revision；Result拒绝、响应丢失/重放、旧Attempt迟到和commit后继续提交均按当前identity/Receipt幂等或拒绝，不得跳过上述任一状态。

以下行为全部禁止：

- 施工 Worker在原会话里开始自审；
- 施工 Worker自行启动 reviewer；
- Runner把 `result_acked` 直接投影成下一节点 `working`；
- 复用施工 Attempt、Pair或会话作为代码轮1；
- 把“测试通过”解释为复核已开始或已完成。

### 5.2 下一节点如何启动

编排Agent读取Handoff和下一Ready Unit后，另行调用一次带expected generation/state和幂等request ID的`dh run continue`。Runner以CAS消费该ready状态：单Node创建一组Ticket/Attempt/Pair；Review Batch按冻结launch group创建一个Monitor和所有适用Reviewer的启动集合。只要下一Ready Unit仍在已批准计划内，这次`continue`不要求用户重复确认；但它必须是独立控制动作，不能由前一Worker隐式触发。并发或重复continue最多命中同一Receipt；零Ready、多个不属于同一launch group的Ready、旧generation或状态已变化都返回稳定拒绝原因。

如果编排 Agent离线，当前节点可以完成并关闭，但下一节点保持 `ready`，不得启动。

### 5.3 通用 Review Batch

Review Batch只消费RelayPlan显式列出的`path set + candidate revision + Executor绑定 + launch group + join规则`。DevHarness可以在编写Plan时把代码轮2、需求、一致性、教训等必做路径列入同一Batch，但Core不读取`task_type`、不维护这些业务路径的闭集，也不自行增删路径。

```text
前置节点对当前candidate revision闭合
  -> Plan显式Review Batch进入ready
  -> 编排Agent一次continue
  -> 一个Monitor + Plan列出的全部适用Reviewer Executor启动
  -> 每条路径独立提交结果并退出
  -> 全部显式必做路径terminal后，Batch才允许关闭
```

“同时启动”指Runner以一次CAS消费同一`batch_id`，创建同一批次的启动集合；不是编排Agent连续手工执行多次continue。全部路径必须读取同一个只读candidate revision、worktree HEAD和输入摘要，Reviewer不得改代码。若Plan在激活前已为某条路径提供合法N/A依据，该路径直接以带依据的terminal结果参加join，不启动空Worker；其余适用路径仍同时启动。施工者自审、错revision、缺路径、N/A缺依据、用户例外缺Authority或执行权限不符均fail-closed。

“创建启动集合”和“外部终端都已启动”必须分开。Runner先做容量预检，再由Workflow Engine生成带guard的`batch_allocated`命令，HostSessionActor以一次原子转换全有或全无地持久化Batch Receipt、Monitor Ticket intent、全部适用Reviewer Ticket/Attempt/Pair intent和N/A终态；崩溃恢复时不得出现Store里只分配了半批。随后Host先启动并确认Monitor ready，再并发fan-out全部Reviewer。预检失败不分配Batch；分配后某个外部终端启动失败时，Batch Receipt记录逐项结果，成功路径继续，失败路径按同一Batch恢复，不回滚或重复成功路径。

这是“三类逻辑角色、多实例”，不是“固定三个Agent终端”。Review Batch高峰为一个编排Agent、一个Monitor和最多四个Reviewer Executor；“最多六个”按该Run当前真实存活的Agent终端计数，不只是逻辑active身份。已撤权但尚在退出宽限期或处于`pair_release_pending`/`pair_release_failed`的旧终端仍占容量；Host容量预检不足时返回`capacity_wait`，不得启动新Batch或replacement。永久保留的runtime目录不计入Agent/Pair容量。下游可以已是ready，但只有旧Pair确认关闭并释放足够槽位后才可launch。其他Run占用的终端另受Host全局容量限制，不改变本Run上限。

一个Reviewer失联时，已完成路径的Result保留，只为失败路径创建新Attempt；如果旧终端尚未物理关闭，replacement先等待容量。Monitor失联时撤销旧Monitor和全部未完成子Pair，由新Monitor从durable父Batch状态接管并为未完成路径创建新Attempt/Pair；已完成Reviewer不重跑，旧Monitor/Pair未释放容量前不启动替代实例。

所有路径结果都绑定candidate revision。只要整改造成代码或受审合同形成新revision，旧批次结果全部失效；新revision接下来经过哪些前置复核、再进入哪些Batch，由更新后的Plan显式声明，Core不硬编码“代码轮1/四路”等业务顺序。第一版不猜测哪些复核可跨revision复用；revision不变时，已完成结果不因单路重试而作废。

适用复核路径的合法尾部为：Reviewer提交`review_candidate`，当前Monitor提交绑定同一batch/path/pair/revision的Report，Reviewer再提交引用该Report的final Result；Workflow Engine校验Result与当前有效Report成对后生成带guard的路径收口命令，HostSessionActor以一次原子转换写入两者和`path_terminal`。不得先把Result记成terminal再等待Report。Monitor在路径terminal前失联时，该未完成子Pair按前述规则撤销并重建，不把半份candidate/Report冒充完成结果。

N/A是独立等价终态：Resolver必须在`batch_allocated`时提供`applicability=N/A`、`evidence_ref`和resolver digest，Workflow Engine据此生成命令，由HostSessionActor写入`path_na_terminal`；N/A不创建Worker，也不伪造Reviewer Result或Monitor Report。Batch join只接受同revision的`path_terminal`、合法`path_na_terminal`，或§5.5定义的、仍由有效同revision Approval支撑的`path_user_overridden`；第三种只允许`proceeded_with_user_override`，不得改写为通过。

单个Reviewer的路径终态绝不产生整个流程的`next_ready`。当且仅当全部必做路径各自形成同revision的`path_terminal`、`path_na_terminal`或有效`path_user_overridden`后，Workflow Engine才生成带guard的join命令，由HostSessionActor一次原子写入`batch_joined`、Batch Join Result和下游`next_ready`。存在任一`path_user_overridden`时Join Result固定为`proceeded_with_user_override`并携带§4.2要求的逐路引用；第一条或前三条路径完成时，下游都必须保持不可启动。

### 5.4 Worker退出合同

Worker退出由Runner/Host驱动，不以Worker说“我做完了”或自然退出作为成功依据：

```text
Worker提交final Result及节点合同要求的工件引用
  -> Workflow Engine生成带guard的收口命令，HostSessionActor完成durable原子转换
  -> Runner返回final_result_committed
  -> Ticket能力立即撤销，Node进入node_closed
  -> Host请求Agent正常结束
  -> 宽限期后仍未退出则强制停用Pair/终端，并记录pair_release_failed或Attention
```

> 术语说明：**final Result** 是节点最终结论；**Handoff** 是节点合同需要下一位 Worker 恢复现场时使用的正式交接；**Pair** 是一张 Ticket 对应的受控 Agent 终端组合。final Result与当前节点声明需要的Handoff/Report等引用完成原子持久化后，节点才算完成；未声明的业务工件不补造。

### 5.4.1 已拉起但不推进：检测、诊断与恢复

每个 Node 必须在 Resolved Plan 中冻结 `start_deadline`（启动确认时限）和 `checkpoint_deadline`（持久进展时限）；缺任一时限不得 launch。Worker 读取 Ticket 指定的 worktree、仓根 AGENTS 与 workspace 合同后，必须提交身份绑定的持久 `node_started`；正在运行的长步骤须在 `checkpoint_deadline` 内提交同一 Attempt 的 checkpoint。`node_started` 只证明已正确接单，checkpoint 只证明存在可恢复进展，二者都不证明质量或完成。

> 术语说明：**Resolved Plan** 是本次 Run 已冻结的计划快照；**checkpoint（进度锚点）**是可恢复的持久进展记录；**身份绑定**指记录带 run/generation/node/pair/attempt/agent 等身份链，不能被别的实例冒用。

Monitor 只能综合 Host Observation、`node_started`、checkpoint 和最终工件判断“未接单、停滞或失联”，不能由聊天文本、`done`、自然退出或屏幕静默判断质量或完成。`blocked`、`awaiting_input` 或 `decision_required` 表示正在等待人或决策：进展时钟暂停为短提醒，不得因无 checkpoint 自动撤权、自动输入或拉起替代 Worker。只有处于可运行状态且未见合法进展时，才触发停滞判定。

> 术语说明：**Host Observation** 是 Herdr/宿主观察到的终端事实，不是业务结论；**blocked/awaiting_input** 是等待人类输入；**decision_required** 是 Worker 已把问题持久化、等待合法决策的状态。

Host 不可达、probe error、Pane 消失和 Agent/进程确实退出必须分开记。只有当前 Ticket 所绑 Pane 与其进程都经宿主确认消失，才能记为 `exited`；宿主暂不可达或探测失败只产生 `host_unavailable`/`probe_error` Attention，并按有界重试与恢复合同处理，不能伪装成 Agent 已退出。

> 术语说明：**probe** 是宿主对已登记终端的一次状态探测；**Pane** 是 Herdr 中承载一个终端的精确位置；**Attention** 是需编排者或用户关注的持久告警，不推进业务节点。

命中启动/进展时限或失联时，Host 只读取当前身份匹配 Agent 的有限诊断快照：生命周期状态、退出/错误码、最后活跃时间，以及经字段白名单、脱敏、UTF-8 字节限长后的末段输出。先白名单、再脱敏、再限长；任一步失败就不落原文，只写不含原文的诊断码。原始 Pane 文本、普通聊天、临时文件、异常字符串和凭据值均不得进入 Attention、事件、Receipt 或证据。

> 术语说明：**诊断快照**只服务恢复定位；**白名单**是允许保存的有限字段集合；**脱敏**在任何落盘前删除密钥、令牌、密码等值；**Receipt**是一次控制动作的不可变回执。

停滞恢复必须由带 `expected generation/state` 与幂等 `recovery_request_id` 的业务命令完成：Workflow Engine 只生成该命令，HostSessionActor 按当前身份链和 CAS 原子写入 Attention、撤销旧 Ticket 能力并把旧 Attempt 标为 `recovery_pending`。同一时刻到达的 final Result 与 recovery 命令由这一次 CAS 裁决：final Result 先落账则恢复返回已关闭；恢复先落账则旧 Attempt 的迟到 checkpoint、Result 和 Role Relay 一律拒绝。旧 Pair 先获正常退出请求，宽限期后才强停；未确认释放或容量不足时保持 `capacity_wait`，不得启动替代者。

> 术语说明：**CAS** 是“状态仍为预期值才写入”的原子比较写入；**幂等**指同一请求重试只返回同一 Receipt；**recovery_pending** 表示当前尝试已失效、等待安全恢复，不是节点完成。

旧 Pair 确认关闭且容量足够后，Runner 才能签发新 Ticket、新 Attempt 与带 `source_attempt_id`、身份链和诊断摘要 digest 的恢复引用。新 Agent 从 workspace、合法 Handoff、旧 checkpoint 与诊断摘要恢复；这些都是只读历史输入，不能被当作新 Attempt 的当前写入。节点仍未关闭、下游仍未 ready。Review Batch 只恢复停滞或失联的未完成路径；同一 candidate revision 的已 terminal 路径保留，Monitor 失联仍按既有规则重建未完成子 Pair。

> 术语说明：**digest（摘要）**是内容完整性校验值；**candidate revision** 是被复核代码/合同的版本；**terminal** 表示某条路径已经合法结束。

四种结果必须区分：

- 正常完成：durable commit后撤权，再正常退出；退出失败不推翻已提交结果，但必须留下运行资源释放告警。
- 提前退出/失联：没有durable final Result就不得关闭Node或放行下游；Attempt进入`recovery_pending`，由Runner签发新Ticket恢复。
- 主动取消：单Node先持久化cancel Receipt并撤权，再停止Agent；Node进入cancelled，不能生成下游ready。Review Batch第一版只允许整批取消：请求带expected generation/batch revision和幂等request ID，由Workflow Engine生成带guard命令，HostSessionActor一次原子写入`batch_cancelled` Receipt并撤销所有active子Ticket/Pair，再分别停止终端；不允许取消一条必做路径后让其余路径join通过。已经terminal的路径Result/Report保留为历史证据但标记`excluded_by_batch_cancel`，不能再参与join。
- 完成后继续说话或写入：旧Ticket已失效，只能得到稳定拒绝或诊断记录，不能改状态。

Review Batch里每个Reviewer按上述规则独立退出；单路卡死或失联走Attempt recovery/supersede，不叫产品级取消，也不能删除该必做路径。Monitor在全部必做路径terminal并持久化Batch结论后退出。Monitor是监督者和结果收集者，不是第五个复核结论来源。

Batch取消、路径Result、join与launch intent的业务合法性只由Workflow Engine按同一权威Read Model计算，并生成带expected generation/batch revision/state guard的业务命令。HostSessionActor只做Schema/身份校验、按guard执行物理CAS和持久化，以提交先后落实竞态顺序，不自行决定某次cancel/join/launch在业务上是否合法：`batch_joined`命令先成功落账时，后到cancel命令因guard失配返回`already_joined`；`batch_cancelled`命令先成功落账时，后到Result/join/launch命令返回`batch_cancelled`。若路径已terminal但尚未join，Workflow Engine仍可授权整批cancel，该路径结果按上段保留但排除。取消响应丢失后以同一request ID重试，只返回同一durable Receipt。

### 5.5 用户授权的带缺口推进

默认规则不变：任一必做路径未形成`path_terminal/path_na_terminal`，Batch不得join或进入下一阶段。唯一例外是用户通过持久Approval明确授权该路径“带缺口推进”。普通聊天、Agent建议、Monitor Report或编排Agent自行判断都不能代签。

Approval至少绑定`run_id/generation/batch_id/batch_revision/candidate_revision/review_path_id/reason/advance_scope/approver_receipt_id`。只有同revision、尚未形成`path_terminal/path_na_terminal`且Batch未join/cancel的必做路径可以被override；已terminal/N/A路径返回`path_already_terminal`且不改状态。Workflow Engine校验后生成带guard命令，撤销该路径active Ticket/Pair并写入`path_user_overridden`；新candidate revision使旧Approval自动失效。

Result、override、cancel、join、launch和recovery的先后由同一CAS序列固定：`batch_joined`先落账时后到override返回`already_joined`；`batch_cancelled`先落账时后到override返回`batch_cancelled`；override先落账时，该路径后到Result、launch或recovery均返回`path_user_overridden`，旧Ticket/Attempt不得复活，Batch只可按带缺口语义join；override响应丢失后以同一request ID重试只返回同一Receipt。后到动作不得覆盖先成功的持久状态。

`path_user_overridden`只是一种“允许编排继续”的路径终态，不是复核通过、N/A或风险消失。Batch Join Result必须标为`proceeded_with_user_override`并永久引用Approval和缺失路径；下游与最终release gate继续读取该缺口。现行治理判为不可豁免的两轮复核、P0/P1、生产/迁移/上线硬证据、权限安全或流程完整性，不能仅靠本Approval伪装成全验收通过或verify完成；若用户要永久改变这些治理要求，应另行修改正式设计/计划，而不是复用一次Run授权。

### 5.6 三轮返修止损与 fresh Decision Executor

复核发现问题时，编排Agent可为受影响TaskRef在同一Plan追加一轮显式节点：

```text
返修并定向回归
→ fresh 定向复核
→ fresh 全面复核或Review Batch
```

每轮使用新Node、Ticket、Attempt/Pair；施工Executor不原地变成Reviewer。“三轮”属于DevHarness/业务治理，Core只执行Plan显式节点，不维护返修枚举。

第三轮仍未闭合时，编排Agent为受影响TaskRef启动fresh Decision Executor。Result/Handoff与Monitor Report durable后，决策节点关闭、Ticket撤销、Pair/终端释放。Decision不得修改DevPlan/RelayPlan、不得调用`continue`；它只输出绑定canonical非空`subject_task_refs[]`、`subject_task_set_digest`、candidate revision、证据和允许动作的结构化结论。单任务是单元素集合，不另设单数字段。

结论可以建议原任务继续、拆分业务任务、请求允许的降级或终止。用户已确认：Decision结论本身不授权B-adjust；编排Agent必须先取得各项目DevHarness要求的用户确认或既有Authority。随后由编排Agent执行B-adjust，并选择拆出的新任务加入当前Plan，或留给其他Plan/Run；无论是否加入，都可显式`continue`当前Plan中不属于受影响闭包的Ready节点。

若业务任务A拆为A1/A2，逐项目B-adjust先产生§1.6定义的receipt/result；加入当前Plan时追加新TaskRef/Node和旧未启动对象的supersede记录并激活新generation，不加入时只记录外部处置引用。不得强制关闭整份Run、强制为每个子任务创建独立Plan/Run，或让原Run永久停住无关任务。

## 6. 最小角色转发

### 6.1 第一版只做什么

第一版不建设完整 Message Router，只提供薄 `Role Relay`：

```text
dh tell <logical-role> <message>  # 作用域/发送者由当前Sender Context自动带入
  -> 从Sender Context生成一次不可变消息快照
  -> 将角色解析为当前唯一 Herdr Agent
  -> 绑定source/target的run/generation/agent_instance及可用的node/pair
  -> Host Adapter在投递前复核精确实例并调用Herdr agent prompt
  -> 投递后再次对账Host generation/Agent identity
  -> 返回sent / target_offline / target_ambiguous / delivery_uncertain
```

> 术语说明：**Role Relay（角色转发）**相当于“尝试给当前正确角色发一句普通话”；它不是可靠消息队列。**best-effort（尽力而为）**指尽量准确投递，但明确暴露失败或不确定，不承诺必达、已读、回复或执行。

Sender Context只有两类：Agent Worker使用Runner签发的有效Work Item Ticket，Batch Monitor Ticket是其中绑定`role=monitor`和父`batch_id`的明确子类型；编排Agent使用Runner签发的run-scoped Orchestrator Lease。Lease绑定`run_id/generation/orchestrator_instance_id/host_generation/expires_at`，只能用于已批准Run的控制与普通角色转发，不把业务授权编码进聊天。两类Context均由CLI自动读取，用户和编排Agent不手填身份封套。

Herdr 提供 Agent 状态/输出查询与 prompt 请求，足以作为一次普通交互的宿主能力；但它不提供“按 Agent identity 原子 compare-and-send（比较身份并发送）”原语，因此第一版不承诺零误投。Role Relay 先以 Sender Context 指定的 Run、session、host generation、node/pair、attempt 与 `agent_instance_id` 解析目标，再以唯一 live agent name 查询并用 Pane ID 回读校验；零目标、多目标、跨 Run/Session、身份不符、焦点或 Pane 顺序猜测均拒绝。目标处于 `working`、`idle` 或 `blocked` 都不是拒发条件：Host 一律直接尝试 prompt。调用 Herdr 前后只要 Host generation 或目标实例变化，就返回 `delivery_uncertain`：旧实例可能已收到普通聊天，系统不会伪称未投递或尝试撤回。

> 术语说明：**live agent name** 是 Herdr 当前存活 Agent 的唯一名称；**agent_instance_id** 是 Relay 为该实例绑定的身份；**working** 只表示 Agent 正在处理一轮工作，不阻止普通消息投递；**compare-and-send** 缺失意味着“查到是谁”和“把话送出”之间仍可能发生替换。

保留：

- 逻辑角色寻址；
- 当前实例前后校验，并显式暴露替换竞态的不确定结果；
- 来源标签；
- 受控Herdr投递；
- 普通消息不进Run Store；
- Agent不直接枚举Pane或调用任意prompt/send-keys。

第一版不做：

- working队列与自动重投；
- TTL、速率和往返预算；
- `accepted/delivered/replied`三阶段；
- `correlation_id`会话协议；
- 普通聊天恢复或审计。

Role Relay 不存在 `target_busy`：目标正在工作时也直接尝试 prompt，以便发送补充或新的普通指令。`sent`只表示前后对账未观察到身份变化且Host接受了本次 prompt 请求，不代表目标Agent已阅读、回复或业务同意。普通消息可以补充当前 Node 的做法；如果意图是撤销当前 Ticket、停止 Agent、替换 Attempt、改变目标/范围/验收或启动下一 Node，仍必须走显式控制面，聊天不能绕过该边界。不能丢的信息必须写checkpoint、Result、Handoff、Attention或Approval，不得靠普通聊天保真。

> 术语说明：**prompt 请求**是 Host 向 Herdr 请求把文字交给 Agent 的调用；**显式控制面**是 `continue`、取消、恢复等会改变节点状态的受控命令；**delivery_uncertain**是投递窗口有竞态，消息可能到旧实例也可能未到。

### 6.2 它不是业务裁决者

Role Relay只负责“把这句话尽力送到当前角色”。它不解释内容、不修改Plan、不生成授权，也不根据聊天推进Node。

并行Batch内裸`executor`不再是唯一目标，必须使用当前Pair自动解析对端，或显式使用`reviewer:<review_path_id>`；裸角色有多个实例时返回`target_ambiguous`。Reviewer发送`monitor`仍解析到该Batch唯一Monitor。

## 7. 当前完整架构边界

本文不是只描述三个局部改动；以下约束与前述薄计划、Ticket、Review Batch、Role Relay共同构成当前完整产品合同。

| 主题 | 当前权威口径 |
|---|---|
| 角色拓扑 | 只有orchestrator、monitor、executor三类逻辑Agent角色，Runner是确定性程序而不是第四Agent。单节点通常是一名Monitor加一名Executor；Review Batch允许一名Monitor加多名Reviewer Executor，所以实例数不固定为三个。 |
| 编排权威 | 编排Agent面向用户、解释Read Model并发出显式控制意图；Workflow Engine是唯一业务转换裁决者；Runtime `HostSessionActor`是唯一物理Store写者，只执行Schema、身份、guard与CAS，不自行判断业务。 |
| Worker边界 | Worker只执行Ticket指向的一个Node，不拥有Run控制权；是否施工、复核、回归或决策由instruction/workspace决定，任何跨Node都必须由新Ticket、新Attempt和新的显式`continue`产生。施工者不复核自己的业务任务。 |
| 停滞与恢复 | 终端拉起不等于接单或完成。启动确认、checkpoint和Host Observation共同发现未接单/停滞/失联；人等状态不自动恢复。恢复先由CAS撤销旧身份、确认旧Pair关闭与容量，再签发新Attempt；Host诊断仅供定位，不能单独改变业务节点。 |
| 真相与恢复 | PlanHome tracked Plan是跨项目编排源；各项目DevPlan/workspace是业务任务源；PlanHome runtime Store保存本Run解析快照和业务事实；Herdr/终端只提供Host Observation。终端退出、`done`文本和聊天均不能投影业务完成；旧generation/Pair/Attempt/Agent迟到输入只能拒绝或审计。 |
| 计划变化 | tracked Plan变化不修改active generation。编排Agent在外部B-adjust/Authority生效后追加TaskRef/Node或未启动对象supersede记录，Resolver按parent digest/CAS激活完整新generation；只冻结受影响下游闭包，无关active/Ready节点保持可运行。目标、范围、验收、权限或永久治理规则变化仍须走其外部权威，不由Result/聊天静默生效。 |
| Review Batch | Core只消费Plan显式path set、candidate revision、Executor绑定、N/A依据和join规则；不读取`task_type`或维护DevHarness路径闭集。Binding不能删Plan路径、降级fresh约束或让施工者自审。Monitor监督过程与工件，不计作任何一路复核结论。 |
| CLI与Read Model | CLI、三个角色终端及未来客户端读取同一Read Model；控制请求产生不可变Receipt。当前优先交CLI与Herdr终端，DSH/Pi/Linux Headless等兼容客户端另按阶段验证，不反向改变Authority、Resolved Plan、Gate、Result或Verify语义。 |
| 目录与保留 | 正式新根归独立PlanHome：tracked `plans/`、`archive/`，ignored `runtime/`、`local/`。Runner不自动删除plans/archive/runtime；成功、失败、取消及归档后的Run目录均永久保留。业务仓旧`.dh-relay/`、`.dh-runtime/relay/`与repo-local `dh_relay/`只按迁移合同读取，不原地迁移或删除；用户级`~/.dh-relay/`仅作定位索引。Resolver迁移验收前禁止新PlanHome start。永久保留不等于Git或跨机器备份。 |
| 运行资源收口 | Node或Run收口后仍必须撤销Ticket，关闭Agent/Pair/终端并释放并发容量；退出宽限期或关闭失败分别记`pair_release_pending`/`pair_release_failed`并继续占容量。永久保留的runtime目录不代表Run可继续，也不计入Agent/Pair容量。 |
| 安全 | 坏Schema、半写、probe失败、身份不明、registry/binding错配、Receipt冲突、证据缺失和能力不足都fail-closed。跨项目Ticket权限取节点请求、项目policy与当次Authority交集；Plan/Profile/Receipt/事件/终端证据不保存凭据值；用户人验、Approval、B-adjust与verify不能由Agent代签。 |
| DHR_30 | DHR_30继续只负责Runtime service、RPC、Read Model和持久操作Receipt；不得把Workflow、Pair、Launcher、Review Batch、Role Relay或目录迁移塞回其当前卡。 |

归档09只保留历史形成事实。它的自包含Contract Brief、可靠Message Router、固定三个实例和串行专用复核路径不再生效；其中未冲突的身份、双维状态、恢复、安全和legacy验收均已在本文重新承载。`HC-3AT-A20`标记为`superseded`，其working队列、TTL/预算、三阶段送达与correlation语义不进入当前主线；`HC-3AT-A25`是best-effort Role Relay的唯一replacement。原`HC-3AT-A22`的按保留期删除语义同样标记为`superseded`，由永久保留验收`HC-3AT-A30`取代。

`DHR-A-23`正式晋升只更新设计权威与审核留痕。下一步若要调整P7/P8 DevPlan，必须另行执行B-adjust并经用户确认；当前不修改DHR_30、不清理或恢复DHR_53、不初始化PlanHome目录，也不启用任何新runtime根。

## 8. 正式验收

### 8.1 延续并按本设计修订的机器验收

| ID | 可机判命题 |
|---|---|
| HC-3AT-A1 | 一个Run只出现orchestrator/monitor/executor三类逻辑Agent身份；Runner不是Agent；实例数按单Node或Review Batch展开，Schema中不存在第四常驻角色 |
| HC-3AT-A2 | Executor、Reviewer与Monitor各有独立Ticket/Receipt/Attempt/Instance身份；旧generation、旧Pair、旧Attempt和旧Agent迟到信号不能推进当前Node或Batch |
| HC-3AT-A3 | 三类终端均可attach和交流；普通用户聊天与Agent间Role Relay不产生业务事件，只有Result/Handoff/Attention/Approval等权威工件可改变业务状态 |
| HC-3AT-A4 | 单Node Pair与Review Batch父子Pair均有可恢复状态；部分启动、单路丢失、Monitor替换和旧实例迟到不会形成重复active身份或误关Node |
| HC-3AT-A5 | Monitor只能读取冻结合同、Host Observation与工件完整性，不能写业务文件、代替Reviewer或直接推进状态 |
| HC-3AT-A6 | Monitor对停滞、显性跑偏、缺工件与身份异常产生有界提醒或Report；不得把推测、聊天或进程退出写成质量结论 |
| HC-3AT-A7 | 节点合同声明需要的candidate、Monitor Report、final Result与Handoff按revision和完整身份不可变；未声明的业务工件不由Core强制补造，替换只新增revision/Attempt和明确supersede关系 |
| HC-3AT-A8 | **superseded by `HC-3AT-A37`**：原按`task_type`推导Review Recipe的语义不再生效；施工者不自审、fresh路径使用独立实例、Monitor不计作复核结论的安全子句由A37继续承接 |
| HC-3AT-A9 | 只有有效Orchestrator Lease可调用Run控制CLI；Runner和Worker不能自行扮演编排Agent，所有终端读取同一Read Model |
| HC-3AT-A10 | detach不改变Run；编排Agent退出时当前Node可按合同收口，但下一Ready Unit不自动启动；恢复与重复continue最多产生一个有效启动Receipt |
| HC-3AT-A11 | Worker可在节点授权内维护progress/findings并提出修改建议；Plan、目标、范围、验收、权限或节点结构变化必须交编排Agent并按授权发布，不能由聊天静默生效 |
| HC-3AT-A12 | 收口按精确run/generation/node/batch/pair/attempt/agent身份撤权并释放Agent/Pair/终端资源，不影响其他Run或实例；资源释放等待或失败分别以`pair_release_pending`/`pair_release_failed`显式留痕，永久保留的runtime目录不属于资源释放失败 |
| HC-3AT-A13 | 深度诊断只能是显式Node，不存在常驻第四Diagnoser Agent |
| HC-3AT-A14 | Host Observation与业务状态分维；Host `done`、终端退出、聊天文本或客户端断开都不能单独改变Node/Batch/Task终态 |
| HC-3AT-A15 | Workflow Engine唯一生成业务命令，HostSessionActor唯一执行物理Store写入；CLI、Launcher、Role Relay及其他组件不能绕actor直写；DHR_30范围不被反向扩大 |
| HC-3AT-A16 | `designInputs[]`只包含本文；所有active legacy acceptance在§10出现且mapping唯一指向本文，历史/superseded ID不混入active mapping |
| HC-3AT-A17 | 已批准计划内的显式continue与新计划、重排、扩权、人验边界可机判；后四类无持久用户授权时fail-closed，普通聊天不构成授权 |
| HC-3AT-A18 | 模拟Herdr/Host共同故障和Runtime同时重启：恢复先对账旧Host/Receipt，只恢复一个编排Agent并展示持久摘要；旧Pair/Batch不误判完成，重复恢复不产生重复实例，也不自动启动下一节点 |
| HC-3AT-A19 | **superseded by `HC-3AT-A32`**：原repo-local新根不再生效；tracked/ignored、历史保留与旧根只读发现的安全子句由独立PlanHome合同继续承接 |
| HC-3AT-A21 | **superseded by `HC-3AT-A36/A37`**：不再建设heavy/normal/light Adapter或Recipe推导；N/A依据、fresh约束、执行绑定与路径完整性由显式Plan和通用Batch承接 |
| HC-3AT-A22 | **superseded**：原“满足保留期后删除runtime”语义不再生效，由`HC-3AT-A30`取代 |

`HC-3AT-A8/A19/A21`由本轮新验收取代；`HC-3AT-A20`已由`HC-3AT-A25`取代，`HC-3AT-A22`已由`HC-3AT-A30`取代；这些旧语义均不再是active验收。

### 8.2 延续并按本设计修订的人类验收

| ID | 5分钟内操作 | 人验判断 |
|---|---|---|
| HC-3AT-H1 | 启动一个单节点Run，分别attach编排、Monitor、Executor终端，向三者发无副作用询问并做一次Role Relay | 用户能区分三类职责；普通交流不污染业务账；Runner没有第四终端 |
| HC-3AT-H2 | 编排Agent退出期间让Worker发现Plan/workspace问题，随后恢复编排终端 | 建议保留在progress/findings或Attention中而不是聊天保真；未经授权不改Plan，恢复后用户能看到待处理变化且下一Node未自动启动 |
| HC-3AT-H3 | 观察施工candidate、Monitor Report、final Result/Handoff、node_closed、Worker退出和下一Node ready | 用户能区分候选、节点收口、Worker退出、复核待启动和整卡完成，施工Worker没有原地进入复核 |
| HC-3AT-H4 | 工作中停止Herdr/终端宿主并恢复 | 系统只依据持久事实恢复；不虚构离线聊天或完成，不重复拉起旧Pair/Batch，不擅自启动下一Node |
| HC-3AT-H5 | 展示Plan显式列出的多条复核路径、fresh/inline约束和带依据N/A，并为不同路径绑定不同Agent/Profile | 路径没有因Binding或N/A被删除；fresh路径使用独立实例，Monitor只监督而不充当复核者；Core未读取task_type/Recipe |

### 8.3 本轮新增验收

| ID | 可机判命题 |
|---|---|
| HC-3AT-A23 | **superseded by `HC-3AT-A32/A33/A36`**：保留薄Plan不复制业务全文、静态输入漂移fail-closed等安全意图；删除单任务、task_type Recipe与业务flow推导语义 |
| HC-3AT-A24 | 编排控制使用带expected generation/state和幂等request ID的`continue`，Worker Ticket使用`execute_node`；Runner自动封装完整Ticket/Pair/Attempt/Agent/Profile/Receipt/Plan/TaskRef/workspace/worktree身份并按摘要校验。通用合法轨迹为“按节点合同接受所需candidate/Report/Handoff→原子持久化final Result、所需引用、node_closed与Plan声明的next/wait/terminal效果→final_result_committed”；未声明的业务工件不补造。Worker无Run控制能力且node_closed后能力撤销；重复/并发continue、错node/generation/TaskRef、Result拒绝/重放/迟到、Worker越Node和编排Agent离线均不能创建Ready Unit定义之外的Pair |
| HC-3AT-A25 | Role Relay从有效Work Item Ticket或Orchestrator Lease自动绑定run/generation/source/target及可用的node/pair，只做当前逻辑角色到唯一Herdr Agent的即时best-effort投递；唯一返回枚举为`sent/target_offline/target_ambiguous/delivery_uncertain`；目标`working`/`idle`/`blocked`均直接尝试prompt，替换竞态允许普通聊天误达但必须返回`delivery_uncertain`，旧身份不能借此写权威工件或控制Run；不排队、不重投、不保存普通聊天、不产生业务授权；多Run歧义和直接Herdr prompt/send-keys均有拒绝用例 |
| HC-3AT-A26 | Plan显式path set对当前revision满足前置条件后形成一个父Review Batch和路径级子Pair；一次continue以`batch_allocated`原子转换全有或全无地创建Batch Receipt、一个Monitor intent及全部显式适用Reviewer的独立Ticket/Attempt/Pair intent；路径只有final Result与当前Monitor Report成对durable才产生`path_terminal`，N/A只有带applicability/evidence/resolver digest的`path_na_terminal`，用户例外只有有效同revision Approval才产生`path_user_overridden`；全部Plan必做路径满足三类合法终态之一后才能原子产生`batch_joined`和`next_ready`，含override时Join固定为`proceeded_with_user_override`并持久引用Approval/缺失路径；单路失联只重试该路，Monitor失联重建未完成子Pair，新revision使整批失效并按新Plan重新执行；真实存活终端按Plan/Host容量约束，`pair_release_pending`/`pair_release_failed`仍计入容量，永久历史目录不计入容量 |
| HC-3AT-A27 | Worker只有在final Result及节点合同要求的Handoff原子durable后才算正常完成；随后Ticket撤权并由Host正常结束或超时强制停用；提前退出进入recovery_pending且不放行下游，commit后写入拒绝；单Node取消先durable再撤权，Review Batch只允许带CAS/幂等Receipt的整批原子取消，已terminal结果保留但排除join，不能删除一条必做路径后join；cancel与Result/join/launch的业务命令由Workflow Engine唯一生成，actor只按guard执行物理CAS；Batch Monitor在全部必做路径terminal并持久化Batch结论后退出 |
| HC-3AT-A28 | 必做复核缺失默认阻断Batch join；只有绑定run/generation/batch/revision/path/scope的持久用户Approval可原子产生`path_user_overridden`并允许`proceeded_with_user_override`继续，普通聊天和Agent不能代签；override撤销旧Ticket且新revision自动失效，迟到Result/launch/recovery、重复Approval及与cancel/join的先后均按固定CAS结果裁决；已terminal/N/A路径拒绝override；该状态不得冒充pass/N/A，最终release/verify仍按治理红线独立裁决 |
| HC-3AT-A29 | 每个可启动Node在Resolved Plan中冻结启动与进展时限；`node_started`、checkpoint、Attention诊断快照和恢复引用均先冻结版本化Schema、完整身份链、幂等键与digest。缺启动确认、运行态进展超时、Host不可达、probe error、Pane消失与进程退出严格区分；合法人等状态暂停为短提醒。停滞恢复仅由带expected generation/state与recovery request ID的Workflow命令经HostSessionActor CAS 原子撤权并落`recovery_pending`；Result/recovery竞态只有一个赢家，旧Attempt迟到输入拒绝，旧Pair确认关闭及容量足够前不启动替代者。诊断快照只准白名单→脱敏→UTF-8限长后落盘，任一步失败不存原文；Review Batch只恢复未完成停滞路径，保留同revision已terminal路径。 |
| HC-3AT-A30 | Run成功、失败或取消进入terminal后，其精确`runtime/<run_id>/`目录及持久工件不因生命周期事件、归档完成、时间经过或容量预检被Runner删除；terminal runtime可由既有history Read Model定位，但从active/可恢复集合排除，目录存在不能复活Run、Ticket、Lease、Pair或Attempt；永久保留目录不计入Agent/Pair容量，只有真实未退出或关闭失败的Agent/Pair进入`pair_release_pending`/`pair_release_failed`；runtime缺失、半写或存储失败沿既有只读错误/reason surface fail-closed，且不得自动删除其他历史Run；新旧根只读发现、不原地删除或改名，Resolver迁移验收前仍禁止新根start |
| HC-3AT-A31 | **superseded by `HC-3AT-A32/A34`**：Run不再绑定单一task_id；同一Plan多Run、既有generation不可变、Plan不反写run_id、Ticket完整身份链和DHR_30不扩张继续有效 |

| ID | 5分钟内操作 | 人验判断 |
|---|---|---|
| HC-3AT-H6 | 启动一张施工后接代码复核的任务；观察施工Worker读取workspace完成Result并停止；保持编排Agent离线并尝试让旧Worker越阶段，确认复核仍只ready且调用被拒；再恢复编排Agent单独continue拉起新的复核实例 | 用户能明显看到“代码写完”和“开始复核”是两个Node、两次启动、两个身份；施工Worker没有原地转成reviewer，测试通过、旧Worker越权或编排Agent离线都不会自动启动复核 |
| HC-3AT-H7 | 让Plan显式Review Batch进入ready后执行一次continue，观察Store原子分配同一launch set、Monitor先ready、随后全部显式Reviewer并发fan-out；让一路失联、另一路先完成，再恢复失败路径；随后制造新candidate revision | 用户能看到一次控制动作形成一个并行批次；各Reviewer独立退出且成功结果不因单路恢复丢失；新revision使旧批次明确失效并按新Plan重新执行，不把旧结论冒充新候选复核 |
| HC-3AT-H8 | 让四路中一路失联，先观察默认阻断；再由用户授权该精确batch/revision/path带缺口推进，最后查看Batch与release状态 | 用户能看到授权前不推进，授权后流程可以继续但明确显示`proceeded_with_user_override`及缺失路径；界面和汇报不把它写成复核通过，治理红线仍在最终收口处生效 |
| HC-3AT-H9 | 启动一个节点后分别制造未写`node_started`、正常长步骤checkpoint、等待用户输入、Herdr探测失败和终端/进程都退出；查看Attention及恢复前后的Agent身份 | 用户能区分“已启动但未接单”“正常进展”“在等人”“宿主探测故障”“确实退出”；恢复信息足以定位但不泄漏原始终端文本或凭据；旧Agent不能在替代者启动后再写结果 |
| HC-3AT-H10 | 分别结束一个成功、失败和取消的Run，通过既有`list/status/inspect`查看状态，并让其中一个终端短暂处于退出宽限期 | 宽限期内只有该真实终端以`pair_release_pending`占容量；释放后，三类Run均从active消失、仍可检查，继续旧Run被拒；永久保留目录不占Agent容量，文件未被Runner自动删除 |

### 8.3.1 DHR-A-23 新增验收

| ID | 可机判命题 |
|---|---|
| HC-3AT-A32 | Plan source、archive和runtime归独立PlanHome；Plan可引用多个`project_ref + devplan_ref + task_id`。受信项目注册表钉住canonical repo identity、policy与Authority来源，ignored local binding只解析checkout且有revision/digest，不能授予权限。task ID重号、未知项目、registry/binding错配、任务/workspace不存在、locator越界或输入摘要漂移均fail-closed。Run根不含单一task_id；generation保存完整TaskRef set/digest与Resolved Plan digest。 |
| HC-3AT-A33 | Core无业务`node_type`；节点以TaskRef/subject set、instruction、依赖、精确Executor绑定和允许route界定工作。所有Executor使用通用Result外壳；Result不能携带Plan patch或新状态效果，错TaskRef/route/generation/Attempt均拒绝。 |
| HC-3AT-A34 | 编排Agent可在原Plan追加TaskRef/Node和未启动对象supersede记录；closed/active定义不可修改。Plan激活只冻结按唯一算法重算出的影响闭包，无关active/Ready节点保持可运行。校验parent digest/CAS/Authority与逐项目B-adjust receipt后形成完整不可变generation，但不自动launch；失败、并发、重放及B-adjust已成功而激活失败均不产生半激活或重复建卡。 |
| HC-3AT-A35 | 三轮仍未闭合时由独立Ticket启动fresh Decision Executor；其Result/Handoff/Monitor Report durable后关闭并释放Pair。结论绑定canonical非空`subject_task_refs[]`、集合摘要和候选版本，只交给编排Agent处理，不由Decision修改DevPlan/Plan或调用`continue`，也不自动授权B-adjust。 |
| HC-3AT-A36 | Core不读取task_type/Recipe、不包含业务节点枚举或DevHarness workflow目录，也能执行外部编排Agent写好的显式Plan；机器扫描与真实E2E同时证明不存在换名Adapter。 |
| HC-3AT-A37 | Review Batch只使用Plan显式path set、candidate revision、执行绑定和join规则；缺路径、错revision、错权限、施工者自审或用户例外缺Authority均拒绝，Core不推导DevHarness review path。 |
| HC-3AT-A38 | 至少两个项目的TaskRef在同一Plan中运行；每项目保留独立registry/binding、worktree、权限、DevPlan、B-adjust receipt与Finalizer。一个项目解析、权限、B-adjust或执行失败只冻结影响闭包，另一项目无依赖Ready节点可由显式`continue`启动；Run逐TaskRef列出部分结果。B-adjust成功而Plan激活失败、相同request ID重试、跨项目无自动回滚均有反例。 |

| ID | 5分钟内操作 | 人验判断 |
|---|---|---|
| HC-3AT-H11 | 某任务三轮失败后观察Decision Executor提交拆分结论并关闭；编排Agent取得Authority并完成业务B-adjust，然后分别演示“新任务加入当前Plan”和“不加入当前Plan”，同时继续一个不受阻塞的其他项目任务 | 用户能区分Decision建议、业务任务调整、Plan generation激活和节点启动四个动作；Decision没有自动改计划，无关任务没有被整Run暂停 |
| HC-3AT-H12 | 展示独立PlanHome中的tracked Plan、ignored runtime、两个项目TaskRef、registry/binding摘要、每generation完整摘要和各项目workspace/HEAD证据 | 用户能从一个Run追到各业务任务，又不会把PlanHome当成项目DevPlan、把绝对路径当产品合同或把runtime目录存在误判为Agent仍存活 |

### 8.4 最小反例矩阵

| 验收 | 必测反例 |
|---|---|
| `A23` | superseded；反例分别迁入A32/A33/A36，不再测试task_type Recipe或业务flow推导 |
| `A24` | 无Ready→`no_ready`；多个互不属于同一launch group的Ready→`ambiguous_ready`，同一Review Batch的多Ready→一个合法Ready Unit；并发/重复continue→同一Receipt且不产生定义外新Pair；旧generation→`stale_generation`；错node/TaskRef/Pair/Attempt/Agent、Result reject/迟到、commit后继续写→拒绝且Store不推进；响应丢失/重放→同一durable Receipt；final Result原子转换前崩溃→整笔未提交且Node不关闭，转换后崩溃→Result、节点合同要求的引用、node_closed与Plan声明效果全存在；未要求Handoff/Report的节点→不得补造业务工件；launch失败→Attempt关闭、Node退回ready、产生`launch_failed` Receipt/Attention且无working Pair；Executor或Monitor在原子收口前丢失→Attempt进入`recovery_pending`且下游不ready；Host/Runtime crash恢复→只允许原子转换前或后两种投影；Worker自行continue、编排Agent离线→无新Pair |
| `A25` | 多Run同名角色→按Sender Context唯一Run解析或`target_ambiguous`；目标offline/ambiguous→对应`target_*`；目标`working`、`idle`、`blocked`均调用prompt且不得返回`target_busy`；Batch Monitor凭Monitor Ticket向`reviewer:<review_path_id>`发送→只解析到同batch/path的当前Agent，裸`executor`多实例→`target_ambiguous`；校验后Agent替换或后对账失败→`delivery_uncertain`；过期Ticket/Lease、直接Herdr prompt/send-keys→拒绝；`sent`后无回复→不重投、不推进业务状态 |
| `A26` | `batch_allocated`前崩溃→无Batch子项，转换后崩溃→Batch Receipt、Monitor及全部Plan显式Reviewer intent全存在；并发/重放continue→同一Receipt且每路径至多一个active Attempt；Result/Report任一缺失→路径不terminal，二者同身份匹配→一次path terminal；N/A缺applicability/evidence/digest→拒绝；任一必做路径未terminal→下游不ready，全部显式路径满足合法终态→一次`batch_joined`；全部路径绑定同candidate revision/HEAD/digest；单路或Monitor失联只重建未完成路径，已完成路径保留；revision变化→旧结果invalid并按新Plan执行；真实未释放终端仍计容量，永久历史目录不计容量 |
| `A27` | Worker自然退出但无final commit→`recovery_pending`且下游不ready；final commit后Agent不退出→Ticket写入拒绝、宽限期后强制停用并留运行资源释放告警；Batch cancel响应丢失/重放→同一durable Receipt；cancel先于Result/join/launch→后到动作返回`batch_cancelled`且无next_ready；join先于cancel→cancel返回`already_joined`；路径terminal后、join前取消→结果保留并标`excluded_by_batch_cancel`；尝试只取消一条必做路径并join→拒绝；已关闭Worker继续发送Result/控制调用→拒绝且Store不推进 |
| `A28` | 无Approval、聊天授权、错run/generation/batch/revision/path/scope→override拒绝且Batch不join；已terminal/N/A路径→`path_already_terminal`且不改状态；合法Approval→一次`path_user_overridden`、旧Ticket撤权，迟到Result/launch/recovery→`path_user_overridden`；join先落账→override返回`already_joined`，cancel先落账→override返回`batch_cancelled`，override先落账→Join Result=`proceeded_with_user_override`且逐路引用Approval/缺失路径；重复Approval/响应丢失→同一Receipt；新revision→旧Approval失效；缺代码轮2或其他不可豁免证据时最终全验收/verify仍拒绝 |
| `A29` | 缺deadline/Schema/身份字段→拒绝launch；未写`node_started`、运行态checkpoint超时→同一身份Attention且Node不关/下游不ready；`blocked/awaiting_input/decision_required`→短提醒、不自动撤权/输入/恢复；Host不可达、probe error、Pane消失但进程活→不得记exited；Pane与进程都消失→仅此时可记exited；`sk-`、PEM、password、bearer、环境值和屏幕回显进入诊断→先白名单、脱敏、限长，任一失败零原文落盘；final Result与recovery并发→单一CAS赢家，恢复先赢则旧Attempt所有迟到写入拒绝，Result先赢则恢复返回已关闭；重复recovery→同一Receipt；旧Pair未关闭/容量不足→`capacity_wait`且无新Attempt；Runtime/Host crash、Monitor替换、多Run同名角色、目标working/idle/blocked下的直接prompt、替换竞态和`sent`后无回复均不得越权或推进；Batch只新建停滞未完成路径，新revision仍使旧Batch结果失效。 |
| `A30` | 成功/失败/取消/归档/经过任意时间/容量不足→Runner均不删除runtime；terminal目录仍在→Run不active、不可continue、不复活Ticket/Lease/Pair/Attempt且不占容量；真实终端未退出→仅该终端进入`pair_release_pending`/`pair_release_failed`并阻止替代实例；目录缺失/半写/存储失败→既有错误面fail-closed、排除active/可恢复且不删除其他历史Run；legacy发现→只读、不改名、不迁移、不删除 |
| `A31` | superseded；单task_id Run身份反例删除，同一Plan多Run、既有generation不可变、Plan不反写run_id和完整Ticket身份链反例迁入A32/A34 |
| `A32` | 两项目task_id重号、未知project_ref、canonical repo identity错配、registry/binding漂移、checkout/workspace缺失、locator越界、Plan伪造权限→拒绝；同一Plan多TaskRef、多Run→Run根只绑定plan_home_id+plan_id且generation保存完整TaskRef set/digest；repo-local新根start→迁移闸前拒绝 |
| `A33` | Plan含业务node_type、Result携带Plan patch/任意next、未知route、错TaskRef/subject set、旧generation/Attempt重放、非成功outcome携带成功route→拒绝；仅改instruction不激活generation→当前Run不变；激活成功但未continue→无新Pair |
| `A34` | 改写closed/active定义、supersede已启动对象、闭包方向不一致、把资源冲突当业务依赖、遗漏共享消费者、parent digest/CAS/Authority错配、并发或重复request→拒绝且旧generation不变；无关Ready/active被整体冻结→Oracle判错；B-adjust已成功而Plan激活失败→业务任务保留、旧generation不变、同request重试不重复建卡 |
| `A35` | 第三轮后复用Reviewer会话、Decision缺fresh/subject set digest/候选版本、Decision直接修改DevPlan/Plan或调用continue、Result未durable就撤权、Pair关闭失败却释放容量、无Authority自动B-adjust→拒绝或保持等待；合法Decision关闭后无Decision Worker存活 |
| `A36` | Core生产Schema/Resolver/Workflow/Ticket/状态/测试出现task_type、Recipe、construction/review/rework枚举、`workflows/dev-harness`或换名Adapter→机器扫描失败；移除DevHarness后通用显式Plan仍可执行 |
| `A37` | path set缺失/被Binding删除、错candidate revision、施工者自审、fresh路径复用会话、N/A缺依据、override缺精确Authority、Monitor冒充reviewer→拒绝；Plan显式路径全部合法terminal才join |
| `A38` | 项目A解析/B-adjust/权限/执行失败→只A及下游闭包等待，项目B无依赖Ready仍可continue；A的binding/Authority写入B项目、跨项目隐式依赖、总success掩盖子任务失败、B-adjust重试重复建卡或试图自动回滚其他项目→拒绝或Oracle判错 |

测试必须使用独立oracle从事件/Receipt/Host Observation重算“是否创建了新Pair、是否发生Store业务转换、消息是否只投向精确实例”；不能只断言CLI返回文本。

## 9. 已确认的用户决策

用户确认：“代码轮2、需求、一致性、教训同时启动。”因此本设计采用受限Review Batch：代码轮1及其必要整改闭合后，由一次continue启动一个Monitor和四条适用Reviewer Executor；四路独立退出，全部必做路径terminal后才join。

该决定把“三Agent”从固定三个实例改成三类逻辑角色；并行高峰最多六个Agent终端。其代价是更高的并发资源消耗，以及candidate revision变化时整批复核重跑；收益是四条独立复核路径缩短为一个并行等待窗口。

用户对“必做路径缺失是否允许继续”的理解是“除非用户授权”。本文据此冻结§5.5：授权只能针对精确Run/Batch/revision/path形成持久Approval；它允许编排带缺口继续，但不能把缺失路径改写成pass/N/A，也不能代替最终治理验收。

用户随后确认“终端已拉起但未接单/无进展”应自动进入可恢复处置：以持久`node_started`、checkpoint与Herdr Host Observation识别，先保存经脱敏的有限诊断、撤销旧Ticket并确认旧Pair关闭，再签发新Attempt；终端状态和聊天不构成完成证据。用户同时要求为英文术语补就地中文说明，并把 YAML 示例逐字段加中文解释。

用户随后明确表示“改完没问题了，设计方案更新下”，构成事件`DHR-A-17`的整版确认与正式晋升授权；不构成B-adjust、开发、提交、推送或启用新目录授权。

用户随后决定“暂时按照不删除的来吧。就当是永久保存好了”，并确认终态Run即使目录仍在也必须拒绝`continue`。本文据此冻结：成功、失败、取消及归档后的新旧runtime目录均不由Runner自动删除；节点或Run收口仍须撤权并关闭Agent/Pair/终端，只有真实未释放的运行资源占容量。永久保留指当前业务仓本机留存，不等于Git或跨机器备份；未来若改为删除、压缩、迁移或配额治理，必须重新走A-full/B-adjust。

用户进一步确认Plan与runtime的硬关联：Run根不可变保存`plan_id + task_id`，每个generation保存`resolved_plan_digest`；同一Plan可有多个Run，Plan不反写`run_id`，同一Run不得在新generation更换计划或任务身份。用户以“嗯，继续”确认`DHR-A-21`候选整版晋升并继续后续B-adjust草案；该确认不授权开发、新根启用或推送。该段保留A21历史决定，其中“单task_id作为Run身份”已由下述A23决定取代。

用户在`DHR-A-23`讨论中进一步冻结：`task_id`是DevPlan业务任务卡ID；RelayPlan可以承载多个任务并跨DevPlan、跨项目；PlanHome独立于源码仓和业务仓；施工、复核、回归和决策都是Executor在通用节点内的工作，不是Core业务`node_type`；Core不建设DevHarness Adapter。

用户确认复核后返修按Plan显式追加“返修并定向回归→fresh定向复核→fresh全面复核”，三轮仍未闭合则启动fresh Decision Executor并在交付结论后关闭。Decision将拆分等结论交给编排Agent；编排Agent取得对应项目Authority后执行B-adjust，决定新任务加入或不加入当前RelayPlan，并继续不受影响的Ready节点。用户另行明文确认Decision结论本身不自动授权B-adjust。

用户选择`D:/MyFiles/ai-workflow/02-agent-workspace/dh-relay-workspace`作为当前自举PlanHome空仓库选址，但产品合同不硬编码该路径，正式实现前不初始化或启用新根。用户最终以“确认A23整版”完成本次设计整版确认；该确认只授权正式设计晋级，不授权P7/P8 B-adjust、DHR_53清理重做、开发、提交、推送或运行现场变更。

## 10. 旧验收承接与正式晋升边界

以下旧canonical ID继续生效，`acceptance-id-mapping.json`唯一指向本文。它们保留原语义；适用阶段说明只决定何时取证，不降低约束。

| ID | 当前仍需满足的原语义 | 适用阶段 |
|---|---|---|
| HC-P1-A1 | Plan/Resolved Plan、状态、Result、Handoff、Event及合法转换有版本化Schema，未知字段与非法边失败 | 当前 |
| HC-P1-A2 | CAS、generation、Receipt和完整身份链拒绝迟到、重复与错绑定结果 | 当前 |
| HC-P1-A5 | Node succeeded不被Runner直接投影为整张任务完成 | 当前 |
| HC-P1-A6 | 无结果退出、probe error、半写、坏JSON、无进展和能力耗尽均fail-closed | 当前 |
| HC-P1-A8 | 需要Handoff的节点，其交接足以让下一Worker恢复；所有最终工件均不泄漏凭据值 | 当前 |
| HC-CTRL-H1 | DSH未安装或完全停止时，Relay Runtime可启动、查询、运行和恢复 | 当前 |
| HC-CTRL-H2 | Relay CLI分阶段提供list/status/inspect/watch/start/stop/resume/attention/approve控制面 | Runtime基础与后续Workflow分阶段 |
| HC-CTRL-H3 | DSH、Pi、CLI及角色终端读取同一Read Model，对同一Run状态和终态一致 | 当前先验角色终端；兼容客户端接入时补验 |
| HC-CTRL-H4 | 客户端断开、插件卸载和SSH断开不隐式取消Run | 当前 |
| HC-CTRL-H6 | 任一必经Workflow角色至少有一个非DSH-only合法Profile | Profile切片 |
| HC-CTRL-H7 | DSH-only Executor丢失只影响对应Attempt，不污染其他Node或Run真相 | Pair隔离当前验证；DSH接入时补验 |
| HC-CTRL-H8 | 同一Approval Request经任一客户端提交都形成语义相同且hash绑定的Receipt | Approval切片 |
| HC-CTRL-H9 | Linux无GUI、仅SSH时可运行Runtime、CLI、Herdr及代表性工作流 | 后续双平台阶段，不阻塞Windows POC |
| HC-CTRL-H10 | Headless缺少强证据能力时启动前拒绝、路由或暂停，不静默降级 | 当前不变量 |
| HC-CTRL-H11 | 更换控制客户端不改变Authority、Resolved Plan、Gate、Result和Verify | 当前不变量 |
| HC-CTRL-H12 | 更换Agent Executor产生fresh Attempt，并重新经过相同质量链 | 当前 |

旧P1/P2/CTRL验收中未列入上表者维持归档09与决策记录中的`historical/superseded/deferred`去向。特别地，原`HC-P1-A4`、`HC-P1-A7`中可靠Message Router的replacement更新为`HC-3AT-A25`，原`HC-3AT-A20`本身也标记`superseded`；不得再由旧映射把队列、TTL、预算或三阶段聊天送达带回当前主线。原`HC-3AT-A22`的保留期删除语义由`HC-3AT-A30`取代；`HC-3AT-A8/A19/A21/A23/A31`的冲突部分由`A32~A38`取代。现有legacy mapping不包含这些新ID，不伪造映射变化。

本次晋升同步满足以下文档闸：

1. `design/README.md`的唯一`designInputs[]`为本文，上一版09已移入`design/archive/`；
2. active legacy mapping改指本文，并新增`records/02`记录replacement与实施边界；
3. AGENTS明确三类角色、多实例、薄Ticket自读workspace和Worker不得跨Node；
4. 旧业务仓`.gitignore`与repo-local `dh_relay/`只作为尚未迁移的现役/历史事实；新正式根归独立PlanHome，tracked/ignored规则由后续承重实现卡冻结，不在本次初始化；
5. Resolver迁移卡完成PlanHome发现、受信registry/local binding、新旧根只读发现、永久保留、历史识别与运行资源释放验收前，不创建正式目录结构、不启用新PlanHome start。

下一步只能在用户另行授权后执行P7/P8 B-adjust：P7冻结PlanHome/TaskRef/通用节点/Result/generation基础合同并完成单任务真实链，P8承接真实多任务、跨项目调度与影响闭包重编排。B-adjust确认前不得修改P7/P8卡面、清理或恢复DHR_53施工、初始化PlanHome目录，也不得把Workflow、Pair、Launcher、Review Batch或Role Relay塞入DHR_30。
