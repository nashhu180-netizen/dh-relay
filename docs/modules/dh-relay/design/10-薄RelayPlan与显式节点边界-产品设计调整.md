# 薄 RelayPlan、节点启动票据与显式阶段边界：产品设计与验收
<!-- dh:planning-event:v1 id=DHR-A-17 stage=A-full artifact=design/10-薄RelayPlan与显式节点边界-产品设计调整.md review=evidence/13-薄计划与显式节点边界-交叉审核记录.md#review-a17 understanding=evidence/13-薄计划与显式节点边界-交叉审核记录.md#understanding-a17 -->

> 状态：当前唯一正式 `designInputs[]`，事件 `DHR-A-17`。本文经用户整版确认后取代现已移入`design/archive/`的09形成稿，作为后续拆计划的产品权威输入；不修改DevPlan、DHR_30或现役运行合同，也不授权开发。
>
> 起因：用户确认第一版收缩为“薄 RelayPlan + Worker 自读 workspace + 最小节点启动票据 + best-effort Herdr 角色转发”，并要求施工、复核等步骤具有硬边界，施工 Worker 写完代码后不得自行进入复核。

## 1. 调整目标

上一版正式形成稿（现归档于`design/archive/09-...`）为了零上下文派发、崩溃恢复和旧实例隔离，把RelayPlan、Contract Brief与Message Router设计得过重，重复承载了DevPlan/workspace已有的业务信息，也把非权威聊天提升成接近可靠消息队列的复杂度。

本次调整只保留支撑三 Agent 接力所需的最小机制：

1. `dh_relay/plans/` 只保存薄编排索引，不复制 DevPlan、workspace 或任务 Brief；
2. 编排 Agent调用 `continue`，Runner确定性生成当前节点的 Work Item Ticket；
3. Worker依据票据进入精确 worktree，自行读取 AGENTS 与指定 workspace；
4. 施工、复核、验证、诊断是不同 Node，节点完成后硬停止，不允许同一 Worker跨阶段；
5. 普通 Agent交流走 best-effort 角色转发，不建设消息队列和聊天可靠性协议；
6. Result、Handoff、Attention、Approval 等权威工件仍保留原有持久性和身份隔离。
7. 重核卡在代码复核轮1及其整改闭合后，以一个受限Review Batch同时启动代码轮2、需求、一致性、教训四条适用路径；一个Monitor监督多个Reviewer Executor。

## 2. 三层信息归属

| 层 | 权威内容 | 明确不放 |
|---|---|---|
| DevPlan + `workspace/<task>/` | 任务目标、范围、验收、允许路径、施工计划、进度、发现、复核和签收证据 | Run 状态、Agent/Pane、消息队列 |
| `dh_relay/plans/` | `task_id`、workspace locator、节点顺序/依赖、节点类型、必要的 Profile/Review Mode 覆盖 | 重抄目标/验收/task_plan、运行 Receipt、聊天、凭据 |
| `dh_relay/runtime/<run_id>/` | 本次解析快照、Git/workspace 摘要、Ticket、Attempt/Pair、Result/Handoff、Attention/Approval、恢复事实 | 可人工编辑的计划源、普通聊天正文 |

`plans/` 不是第二套 DevPlan。计划源发生 Git 变化也不直接改变 active Run；重新解析并激活后才形成新的运行 generation。

## 3. 薄 RelayPlan

### 3.1 最小语义

每份计划源只回答：跑哪张任务卡、去哪个 workspace、节点怎样接力、哪些节点需要显式 Profile/Mode 覆盖。

```yaml
plan_id: DHR_60-default
task_id: DHR_60
workspace: docs/modules/dh-relay/workspace/DHR_60

flow:
  - construction
  - review_recipe

review_recipe:
  source: task_type_registry

profile_overrides:
  code_round_2: reviewer-codex
  requirement_direction: reviewer-claude
```

上例只表达语义，不冻结 YAML、文件名或字段拼写。`flow` 只能表达大阶段和依赖提示，不能手写删除 Review Recipe 的必做路径，也不能把上游要求 dedicated/fresh 的路径降为 inline。Resolver根据 `task_type` 展开唯一 `node_id`、依赖、applicability、execution mode和Review Work Item；缺路径、无N/A依据或非法降级时fail-closed。第一张承重契约卡再冻结物理Schema；不得在开发时扩回完整业务副本。

### 3.2 解析时才冻结的内容

Run启动时由确定性 resolver 读取：

- DevPlan任务行及 `task_type`；
- workspace精确路径和存在性；
- workspace中的 `brief.md`、`task_plan.md` 等静态合同输入；
- 当前 Git/worktree事实；
- Review Recipe与适用性；
- 安全的 Profile registry及计划覆盖。

Workflow Engine产生“激活Resolved Plan”的业务转换命令，由Runtime `HostSessionActor`（DHR_30合同中的物理单写者）串行落入runtime Store；Workflow Engine、CLI、Launcher均不直接打开Store写句柄。编排 Agent不手工拼这些字段，Runner也不推理业务内容。Resolved Plan冻结Plan、Recipe、applicability/mode、Review Batch的launch group/join规则、静态workspace输入和精确worktree HEAD的摘要；`progress.md`、`findings.md`等节点运行中允许追加的工件只按各自写入合同管理，不被误当成必须保持不变的静态输入。

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

零Ready返回`no_ready`；多个互不属于同一已解析launch group的Ready Node返回`ambiguous_ready`；同一Review Batch中的多条Ready路径是一个合法Ready Unit；旧generation返回`stale_generation`。相同request重复调用返回同一单Node或Batch Receipt，不创建第二组Attempt/Pair。Worker Profile不具备`continue/start/stop/launch`控制能力，Worker永远不会收到“继续整张卡”的授权，只收到“执行当前节点”的票据。

### 4.2 最小票据

施工节点示意：

```yaml
action: execute_node
ticket_id: <ticket_id>
ticket_digest: <sha256>
ticket_receipt_id: <receipt_id>
run_id: <run_id>
generation: <generation>
task_id: DHR_60
node_id: construction-1
node_type: construction
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
result_contract: construction-result/v1
stop_after: node_closed
expires_at: <timestamp>
```

复核节点示意：

```yaml
action: execute_node
ticket_id: <ticket_id>
ticket_digest: <sha256>
ticket_receipt_id: <receipt_id>
run_id: <run_id>
generation: <generation>
task_id: DHR_60
node_id: review-code-round-2
node_type: review
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
result_contract: review-result/v1
stop_after: node_closed
expires_at: <timestamp>
```

以上字段冻结产品语义，不提前冻结物理序列化格式；第一张承重合同卡必须将其落成版本化Schema并通过负向测试。对Worker可读的业务核心仍只有task/node、精确现场、输入引用、输出合同和停止点；其余身份封套全部由Runner自动生成，不增加编排Agent负担。Ticket按JCS摘要并绑定Receipt；单Node的Monitor得到独立Monitor Ticket。Review Batch采用父Batch/子Pair身份：父Batch任一时刻最多一张active batch-scoped Monitor Ticket；每个Reviewer子项有独立Ticket、Attempt和Pair，并共同指向父`batch_id`。Monitor不得复用Executor身份。Result/Report必须回带Ticket身份链，旧Ticket、过期Ticket、错HEAD、错Pair/Attempt/Agent、错Batch/revision或摘要不符均拒绝推进。

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
  -> 只执行 node_type 对应工作
  -> 按当前节点合同提交candidate/Report/Result中的合法工件
  -> 收到node_closed后停止
```

Ticket只负责定位和隔离，不重抄workspace全文。路径缺失、task/worktree不一致、静态输入摘要漂移、HEAD不符或节点类型不合法时fail-closed，不能让Worker自行猜现场。任何承重实现开始前必须先冻结Plan、Resolved Plan、Ticket、Result/Report、`continue` request/Receipt、Role Relay request/snapshot/result和Node状态枚举的Schema；“字段名候选”不能带入开发完成判定。

## 5. 显式阶段边界

### 5.1 施工完成不等于进入复核

施工节点的合法尾部只有：

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

### 5.3 受限并行复核批次

重核卡的顺序冻结为：

```text
施工关闭
  -> 代码复核轮1 Worker启动、只读出结论并退出
  -> 若有finding，另启construction/rework Worker整改，再重新跑代码轮1
  -> 代码轮1对当前candidate revision闭合
  -> 四路Review Batch进入ready
  -> 编排Agent一次continue
  -> 一个Monitor + 最多四条适用路径的Reviewer Executor同时启动
     - code_round_2
     - requirement_direction
     - consistency
     - lessons
  -> 每条路径独立提交结果并退出
  -> 全部必做路径terminal后，Batch才允许关闭
```

“同时启动”指Runner以一次CAS消费同一`batch_id`，创建同一批次的启动集合；不是编排Agent连续手工执行四次continue。四条路径必须读取同一个只读candidate revision、worktree HEAD和输入摘要，Reviewer不得改代码。若Recipe在启动前已把某条路径合法解析为N/A，该路径直接以带依据的terminal结果参加join，不启动空Worker；其余适用路径仍同时启动。

“创建启动集合”和“外部终端都已启动”必须分开。Runner先做容量预检，再由Workflow Engine生成带guard的`batch_allocated`命令，HostSessionActor以一次原子转换全有或全无地持久化Batch Receipt、Monitor Ticket intent、全部适用Reviewer Ticket/Attempt/Pair intent和N/A终态；崩溃恢复时不得出现Store里只分配了半批。随后Host先启动并确认Monitor ready，再并发fan-out全部Reviewer。预检失败不分配Batch；分配后某个外部终端启动失败时，Batch Receipt记录逐项结果，成功路径继续，失败路径按同一Batch恢复，不回滚或重复成功路径。

这是“三类逻辑角色、多实例”，不是“固定三个Agent终端”。Review Batch高峰为一个编排Agent、一个Monitor和最多四个Reviewer Executor；“最多六个”按该Run当前真实存活的Agent终端计数，不只是逻辑active身份。已撤权但尚在退出宽限期或`cleanup_failed`的旧终端仍占容量；Host容量预检不足时返回`capacity_wait`，不得启动新Batch或replacement。下游可以已是ready，但只有旧Pair确认关闭并释放足够槽位后才可launch。其他Run占用的终端另受Host全局容量限制，不改变本Run上限。

一个Reviewer失联时，已完成路径的Result保留，只为失败路径创建新Attempt；如果旧终端尚未物理关闭，replacement先等待容量。Monitor失联时撤销旧Monitor和全部未完成子Pair，由新Monitor从durable父Batch状态接管并为未完成路径创建新Attempt/Pair；已完成Reviewer不重跑，旧Monitor/Pair未释放容量前不启动替代实例。

所有路径结果都绑定candidate revision。只要整改造成代码或受审合同形成新revision，旧批次结果全部失效：新revision重新经过代码轮1闭合，再同时启动四路Batch。第一版不做“只猜哪些复核受影响”的增量复用；revision不变时，已完成结果不因单路重试而作废。

适用复核路径的合法尾部为：Reviewer提交`review_candidate`，当前Monitor提交绑定同一batch/path/pair/revision的Report，Reviewer再提交引用该Report的final Result；Workflow Engine校验Result与当前有效Report成对后生成带guard的路径收口命令，HostSessionActor以一次原子转换写入两者和`path_terminal`。不得先把Result记成terminal再等待Report。Monitor在路径terminal前失联时，该未完成子Pair按前述规则撤销并重建，不把半份candidate/Report冒充完成结果。

N/A是独立等价终态：Resolver必须在`batch_allocated`时提供`applicability=N/A`、`evidence_ref`和resolver digest，Workflow Engine据此生成命令，由HostSessionActor写入`path_na_terminal`；N/A不创建Worker，也不伪造Reviewer Result或Monitor Report。Batch join只接受同revision的`path_terminal`、合法`path_na_terminal`，或§5.5定义的、仍由有效同revision Approval支撑的`path_user_overridden`；第三种只允许`proceeded_with_user_override`，不得改写为通过。

单个Reviewer的路径终态绝不产生整个流程的`next_ready`。当且仅当全部必做路径各自形成同revision的`path_terminal`、`path_na_terminal`或有效`path_user_overridden`后，Workflow Engine才生成带guard的join命令，由HostSessionActor一次原子写入`batch_joined`、Batch Join Result和下游`next_ready`。存在任一`path_user_overridden`时Join Result固定为`proceeded_with_user_override`并携带§4.2要求的逐路引用；第一条或前三条路径完成时，下游都必须保持不可启动。

### 5.4 Worker退出合同

Worker退出由Runner/Host驱动，不以Worker说“我做完了”或自然退出作为成功依据：

```text
Worker提交final Result/Handoff
  -> Workflow Engine生成带guard的收口命令，HostSessionActor完成durable原子转换
  -> Runner返回final_result_committed
  -> Ticket能力立即撤销，Node进入node_closed
  -> Host请求Agent正常结束
  -> 宽限期后仍未退出则强制停用Pair/终端，并记录cleanup_failed或Attention
```

四种结果必须区分：

- 正常完成：durable commit后撤权，再正常退出；退出失败不推翻已提交结果，但必须留下清理告警。
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
  -> 返回sent / target_busy / target_offline / target_ambiguous / delivery_uncertain
```

Sender Context只有两类：Agent Worker使用Runner签发的有效Work Item Ticket，Batch Monitor Ticket是其中绑定`role=monitor`和父`batch_id`的明确子类型；编排Agent使用Runner签发的run-scoped Orchestrator Lease。Lease绑定`run_id/generation/orchestrator_instance_id/host_generation/expires_at`，只能用于已批准Run的控制与普通角色转发，不把业务授权编码进聊天。两类Context均由CLI自动读取，用户和编排Agent不手填身份封套。

Herdr 0.8.2不提供“按Agent identity原子compare-and-send”的传输原语，因此第一版不承诺零误投。前检查失败分别返回`target_busy`、`target_offline`或`target_ambiguous`；调用Herdr后若发现Host generation或目标实例变化，返回`delivery_uncertain`：旧实例可能已收到普通聊天，系统不会伪称未投递或尝试撤回。安全边界来自普通消息无业务权威，以及旧Ticket/Lease失效后无法提交Result、Handoff或控制命令；需要零误投的能力留待Herdr提供原子目标令牌后另行设计。

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

目标忙碌、离线或不唯一时直接失败。`sent`只表示投递前后对账均未观察到身份变化且Host接受了本次prompt请求，不代表目标Agent已阅读、回复或业务同意；`delivery_uncertain`表示投递窗口内发生替换或无法完成后对账，消息可能已到旧实例。不能丢的信息必须写checkpoint、Result、Handoff、Attention或Approval，不得靠普通聊天保真。

### 6.2 它不是业务裁决者

Role Relay只负责“把这句话尽力送到当前角色”。它不解释内容、不修改Plan、不生成授权，也不根据聊天推进Node。

并行Batch内裸`executor`不再是唯一目标，必须使用当前Pair自动解析对端，或显式使用`reviewer:<review_path_id>`；裸角色有多个实例时返回`target_ambiguous`。Reviewer发送`monitor`仍解析到该Batch唯一Monitor。

## 7. 当前完整架构边界

本文不是只描述三个局部改动；以下约束与前述薄计划、Ticket、Review Batch、Role Relay共同构成当前完整产品合同。

| 主题 | 当前权威口径 |
|---|---|
| 角色拓扑 | 只有orchestrator、monitor、executor三类逻辑Agent角色，Runner是确定性程序而不是第四Agent。单节点通常是一名Monitor加一名Executor；Review Batch允许一名Monitor加多名Reviewer Executor，所以实例数不固定为三个。 |
| 编排权威 | 编排Agent面向用户、解释Read Model并发出显式控制意图；Workflow Engine是唯一业务转换裁决者；Runtime `HostSessionActor`是唯一物理Store写者，只执行Schema、身份、guard与CAS，不自行判断业务。 |
| Worker边界 | Worker只执行Ticket指向的一个Node，不拥有Run控制权；施工者不复核自己的卡，任何跨阶段都必须由新Ticket、新Attempt和新的显式`continue`产生。 |
| 真相与恢复 | Git中的Plan/DevPlan/workspace是计划与任务源，runtime Store保存本Run解析快照和业务事实，Herdr/终端只提供Host Observation。终端退出、`done`文本和聊天均不能投影业务完成；旧generation/Pair/Attempt/Agent迟到输入只能拒绝或审计。 |
| 计划变化 | tracked Plan变化不修改active generation。当前授权内的修订仍须发布新Resolved Plan；目标、范围、验收、权限、节点结构或永久治理规则变化，没有持久用户授权时fail-closed。 |
| Review Recipe | 启动时按`task_type`冻结必做路径、applicability和execution mode；Binding只能选择执行者，不能删路径或把fresh/dedicated降级。`lessons-absent`只形成带依据N/A。Monitor监督过程与工件，不计作任何一路复核结论。 |
| CLI与Read Model | CLI、三个角色终端及未来客户端读取同一Read Model；控制请求产生不可变Receipt。当前优先交CLI与Herdr终端，DSH/Pi/Linux Headless等兼容客户端另按阶段验证，不反向改变Authority、Resolved Plan、Gate、Result或Verify语义。 |
| 目录与保留 | 新repo-local根为tracked `dh_relay/plans/`、`dh_relay/archive/`和ignored `dh_relay/runtime/`。旧`.dh-relay/`、`.dh-runtime/relay/`只按迁移合同发现/恢复，不原地改名；用户级`~/.dh-relay/`不变。Resolver迁移验收前禁止新根start。 |
| 清理 | Runner不自动删除plans/archive；终态Run仅在archive/export与保留期满足后精确清理自己的runtime目录。失败时保留原目录并产生`cleanup_failed` Attention，cleanup-pending实体继续计入容量。 |
| 安全 | 坏Schema、半写、probe失败、身份不明、Receipt冲突、证据缺失和能力不足都fail-closed。Plan/Profile/Receipt/事件/终端证据不保存凭据值；用户人验、Approval与verify不能由Agent代签。 |
| DHR_30 | DHR_30继续只负责Runtime service、RPC、Read Model和持久操作Receipt；不得把Workflow、Pair、Launcher、Review Batch、Role Relay或目录迁移塞回其当前卡。 |

归档09只保留历史形成事实。它的自包含Contract Brief、可靠Message Router、固定三个实例和串行专用复核路径不再生效；其中未冲突的身份、双维状态、恢复、安全和legacy验收均已在本文重新承载。`HC-3AT-A20`标记为`superseded`，其working队列、TTL/预算、三阶段送达与correlation语义不进入当前主线；`HC-3AT-A25`是best-effort Role Relay的唯一replacement。

本次正式晋升只更新设计权威、索引、映射和仓库入口。下一步若要调整DevPlan，必须另行执行B-adjust并经用户确认；当前不修改DHR_30、不创建开发卡，也不启用`dh_relay/runtime/`新根。

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
| HC-3AT-A7 | candidate、Monitor Report、final Result与Handoff按revision和完整身份不可变；替换只新增revision/Attempt和明确supersede关系 |
| HC-3AT-A8 | Review Recipe按`task_type`保留所有必做Work Item；施工者不复核自己，fresh/dedicated路径使用独立实例/会话，Monitor不计入复核 |
| HC-3AT-A9 | 只有有效Orchestrator Lease可调用Run控制CLI；Runner和Worker不能自行扮演编排Agent，所有终端读取同一Read Model |
| HC-3AT-A10 | detach不改变Run；编排Agent退出时当前Node可按合同收口，但下一Ready Unit不自动启动；恢复与重复continue最多产生一个有效启动Receipt |
| HC-3AT-A11 | Worker可在节点授权内维护progress/findings并提出修改建议；Plan、目标、范围、验收、权限或节点结构变化必须交编排Agent并按授权发布，不能由聊天静默生效 |
| HC-3AT-A12 | 收口按精确run/generation/node/batch/pair/attempt/agent身份撤权和清理，不影响其他Run或实例；cleanup失败显式留痕 |
| HC-3AT-A13 | 深度诊断只能是显式Node，不存在常驻第四Diagnoser Agent |
| HC-3AT-A14 | Host Observation与业务状态分维；Host `done`、终端退出、聊天文本或客户端断开都不能单独改变Node/Batch/Task终态 |
| HC-3AT-A15 | Workflow Engine唯一生成业务命令，HostSessionActor唯一执行物理Store写入；CLI、Launcher、Role Relay及其他组件不能绕actor直写；DHR_30范围不被反向扩大 |
| HC-3AT-A16 | `designInputs[]`只包含本文；所有active legacy acceptance在§10出现且mapping唯一指向本文，历史/superseded ID不混入active mapping |
| HC-3AT-A17 | 已批准计划内的显式continue与新计划、重排、扩权、人验边界可机判；后四类无持久用户授权时fail-closed，普通聊天不构成授权 |
| HC-3AT-A18 | 模拟Herdr/Host共同故障和Runtime同时重启：恢复先对账旧Host/Receipt，只恢复一个编排Agent并展示持久摘要；旧Pair/Batch不误判完成，重复恢复不产生重复实例，也不自动启动下一节点 |
| HC-3AT-A19 | 新根的plans/archive可被Git跟踪、runtime按Git语义忽略；tracked Plan变化不改active generation；旧根只按迁移合同发现且用户级索引不变 |
| HC-3AT-A21 | Adapter对heavy/normal/light解析冻结Recipe、applicability、mode和源摘要；N/A、inline、dedicated、Profile Binding和有效单测均按上游合同执行，缺能力或非法降级fail-closed |
| HC-3AT-A22 | plans/archive不被自动删除；runtime只有满足归档/导出与保留期才精确清理；半清理可恢复，删除失败保留目录并产生`cleanup_failed` Attention |

`HC-3AT-A20`已由`HC-3AT-A25`取代，不再是active验收。

### 8.2 延续并按本设计修订的人类验收

| ID | 5分钟内操作 | 人验判断 |
|---|---|---|
| HC-3AT-H1 | 启动一个单节点Run，分别attach编排、Monitor、Executor终端，向三者发无副作用询问并做一次Role Relay | 用户能区分三类职责；普通交流不污染业务账；Runner没有第四终端 |
| HC-3AT-H2 | 编排Agent退出期间让Worker发现Plan/workspace问题，随后恢复编排终端 | 建议保留在progress/findings或Attention中而不是聊天保真；未经授权不改Plan，恢复后用户能看到待处理变化且下一Node未自动启动 |
| HC-3AT-H3 | 观察施工candidate、Monitor Report、final Result/Handoff、node_closed、Worker退出和下一Node ready | 用户能区分候选、节点收口、Worker退出、复核待启动和整卡完成，施工Worker没有原地进入复核 |
| HC-3AT-H4 | 工作中停止Herdr/终端宿主并恢复 | 系统只依据持久事实恢复；不虚构离线聊天或完成，不重复拉起旧Pair/Batch，不擅自启动下一Node |
| HC-3AT-H5 | 展示包含dedicated、inline和lessons-absent N/A的Recipe，并为不同复核路径绑定不同Agent/Profile | 必做路径没有因Binding或N/A被删除；fresh路径使用独立实例，Monitor只监督而不充当复核者 |

### 8.3 本轮新增验收

| ID | 可机判命题 |
|---|---|
| HC-3AT-A23 | `plans/`中的计划源只含任务/workspace locator、大阶段flow和必要覆盖；目标、验收、allowlist与task_plan只引用DevPlan/workspace，不维护可漂移副本；Resolver必须从`task_type`保留全部必做Review Work Item并冻结唯一node ID、依赖、Recipe/applicability/mode摘要，缺路径、非法降级、缺N/A依据、坏计划、缺workspace、路径/静态输入漂移均fail-closed；tracked Plan改变不影响active generation |
| HC-3AT-A24 | 编排控制使用带expected generation/state和幂等request ID的`continue`，Worker Ticket使用`execute_node`；Runner自动封装完整Ticket/Pair/Attempt/Agent/Profile/Receipt/Plan/workspace/worktree身份并按摘要校验；合法轨迹严格为`candidate_accepted→monitor_report→handoff_ready→原子持久化final Result/Handoff/node_closed/next_ready→final_result_committed`，Worker无Run控制能力且node_closed后能力撤销；重复/并发continue、错node/generation、Result拒绝/重放/迟到、Worker越阶段和编排Agent离线均不能创建Ready Unit定义之外的Pair |
| HC-3AT-A25 | Role Relay从有效Work Item Ticket或Orchestrator Lease自动绑定run/generation/source/target及可用的node/pair，只做当前逻辑角色到唯一Herdr Agent的即时best-effort投递；唯一返回枚举为`sent/target_busy/target_offline/target_ambiguous/delivery_uncertain`；替换竞态允许普通聊天误达但必须返回`delivery_uncertain`，旧身份不能借此写权威工件或控制Run；不排队、不重投、不保存普通聊天、不产生业务授权；多Run歧义和直接Herdr prompt/send-keys均有拒绝用例 |
| HC-3AT-A26 | 重核卡在代码轮1及必要整改对当前revision闭合后，把代码轮2、需求、一致性、教训解析为一个父Review Batch和路径级子Pair；一次continue以`batch_allocated`原子转换全有或全无地创建Batch Receipt、一个Monitor intent及所有适用Reviewer的独立Ticket/Attempt/Pair intent；适用路径只有final Result与当前Monitor Report成对durable才产生`path_terminal`，N/A只有带applicability/evidence/resolver digest的`path_na_terminal`，用户例外只有有效同revision Approval才产生`path_user_overridden`；全部必做路径满足三类合法终态之一后才能原子产生`batch_joined`和`next_ready`，含override时Join固定为`proceeded_with_user_override`并持久引用Approval/缺失路径；单路失联只重试该路，Monitor失联重建未完成子Pair，新revision使整批失效并重新经过代码轮1和四路Batch；本Run真实存活Agent终端不超过六个，cleanup-pending也计入容量 |
| HC-3AT-A27 | Worker只有在final Result及节点合同要求的Handoff原子durable后才算正常完成；随后Ticket撤权并由Host正常结束或超时强制停用；提前退出进入recovery_pending且不放行下游，commit后写入拒绝；单Node取消先durable再撤权，Review Batch只允许带CAS/幂等Receipt的整批原子取消，已terminal结果保留但排除join，不能删除一条必做路径后join；cancel与Result/join/launch的业务命令由Workflow Engine唯一生成，actor只按guard执行物理CAS；Batch Monitor在全部必做路径terminal并持久化Batch结论后退出 |
| HC-3AT-A28 | 必做复核缺失默认阻断Batch join；只有绑定run/generation/batch/revision/path/scope的持久用户Approval可原子产生`path_user_overridden`并允许`proceeded_with_user_override`继续，普通聊天和Agent不能代签；override撤销旧Ticket且新revision自动失效，迟到Result/launch/recovery、重复Approval及与cancel/join的先后均按固定CAS结果裁决；已terminal/N/A路径拒绝override；该状态不得冒充pass/N/A，最终release/verify仍按治理红线独立裁决 |

| ID | 5分钟内操作 | 人验判断 |
|---|---|---|
| HC-3AT-H6 | 启动一张施工后接代码复核的任务；观察施工Worker读取workspace完成Result并停止；保持编排Agent离线并尝试让旧Worker越阶段，确认复核仍只ready且调用被拒；再恢复编排Agent单独continue拉起新的复核实例 | 用户能明显看到“代码写完”和“开始复核”是两个Node、两次启动、两个身份；施工Worker没有原地转成reviewer，测试通过、旧Worker越权或编排Agent离线都不会自动启动复核 |
| HC-3AT-H7 | 在重核卡代码轮1闭合后执行一次continue，观察一次Store原子分配同一launch set、Monitor先ready、随后四条适用Reviewer被并发fan-out；让其中一路失联并让另一路先完成，再恢复失败路径；随后制造新candidate revision | 用户能看到一次控制动作形成一个并行批次，而不是误以为外部进程原子同时出现；各Reviewer独立退出且成功结果不因单路恢复丢失；新revision产生后旧批次明确失效并重新走代码轮1，不把旧结论冒充新代码的复核 |
| HC-3AT-H8 | 让四路中一路失联，先观察默认阻断；再由用户授权该精确batch/revision/path带缺口推进，最后查看Batch与release状态 | 用户能看到授权前不推进，授权后流程可以继续但明确显示`proceeded_with_user_override`及缺失路径；界面和汇报不把它写成复核通过，治理红线仍在最终收口处生效 |

### 8.4 最小反例矩阵

| 验收 | 必测反例 |
|---|---|
| `A23` | 坏计划、缺workspace、locator越界、静态输入digest漂移、tracked Plan在Run中修改、flow试图删除必做复核或降级fresh/dedicated |
| `A24` | 无Ready→`no_ready`；多个互不属于同一launch group的Ready→`ambiguous_ready`，同一Review Batch的多Ready→一个合法Ready Unit；并发/重复continue→同一Receipt且不产生Ready Unit定义之外的新Pair；旧generation→`stale_generation`；错node/Pair/Attempt/Agent、Result reject/迟到、commit后继续写→拒绝且Store不推进；响应丢失/重放→同一durable Receipt；final Result原子转换前崩溃→整笔未提交且当前节点不关闭，转换后崩溃→Result/Handoff/node_closed/next_ready全存在；launch失败→失败Attempt关闭、Node退回ready、产生`launch_failed` Receipt/Attention且无working Pair；Executor或Monitor在原子收口前丢失→当前Attempt进入`recovery_pending`、当前Node不关闭、下一Node不ready；Host/Runtime crash恢复→只允许上述原子转换前或后两种durable投影，不出现部分收口；Worker自行调用continue、编排Agent离线→无新Pair |
| `A25` | 多Run同名角色→按Sender Context唯一Run解析或`target_ambiguous`；目标busy/offline/ambiguous→对应`target_*`；Batch Monitor凭Monitor Ticket向`reviewer:<review_path_id>`发送→只解析到同batch/path的当前Agent，裸`executor`多实例→`target_ambiguous`；校验后Agent替换或后对账失败→`delivery_uncertain`；过期Ticket/Lease、直接Herdr prompt/send-keys→拒绝；`sent`后无回复→不重投、不推进业务状态 |
| `A26` | `batch_allocated`前崩溃→无Batch子项，转换后崩溃→Batch Receipt、Monitor及全部适用Reviewer intent全存在；同一Batch并发/重放continue→同一Batch Receipt且每条路径至多一个active Attempt；Result已提交但Report未提交、Report已提交但Result未提交、Monitor在两者之间失联→路径均不terminal且重建未完成Pair；Result+当前Report匹配→一次path terminal；N/A缺applicability/evidence/digest→fail-closed；第一条/前三条路径terminal→下游仍不ready，全部必做路径terminal且身份匹配→一次`batch_joined`产生next_ready；四路必须绑定相同candidate revision/HEAD/digest；单路失联→只该路新Attempt；Monitor失联→旧Monitor迟到Report拒绝、未完成子Pair撤销并由新Monitor重建、已完成路径保留；revision变化→旧四路结果全部invalid且不得join新批次；旧终端cleanup-pending造成容量不足→`capacity_wait`且本Run真实存活终端始终不超过六个 |
| `A27` | Worker自然退出但无final commit→`recovery_pending`且下游不ready；final commit后Agent不退出→Ticket写入拒绝、宽限期后强制停用并留清理告警；Batch cancel响应丢失/重放→同一durable Receipt；cancel先于Result/join/launch→后到动作返回`batch_cancelled`且无next_ready；join先于cancel→cancel返回`already_joined`；路径terminal后、join前取消→结果保留并标`excluded_by_batch_cancel`；尝试只取消一条必做路径并join→拒绝；已关闭Worker继续发送Result/控制调用→拒绝且Store不推进 |
| `A28` | 无Approval、聊天授权、错run/generation/batch/revision/path/scope→override拒绝且Batch不join；已terminal/N/A路径→`path_already_terminal`且不改状态；合法Approval→一次`path_user_overridden`、旧Ticket撤权，迟到Result/launch/recovery→`path_user_overridden`；join先落账→override返回`already_joined`，cancel先落账→override返回`batch_cancelled`，override先落账→Join Result=`proceeded_with_user_override`且逐路引用Approval/缺失路径；重复Approval/响应丢失→同一Receipt；新revision→旧Approval失效；缺代码轮2或其他不可豁免证据时最终全验收/verify仍拒绝 |

测试必须使用独立oracle从事件/Receipt/Host Observation重算“是否创建了新Pair、是否发生Store业务转换、消息是否只投向精确实例”；不能只断言CLI返回文本。

## 9. 已确认的用户决策

用户确认：“代码轮2、需求、一致性、教训同时启动。”因此本设计采用受限Review Batch：代码轮1及其必要整改闭合后，由一次continue启动一个Monitor和四条适用Reviewer Executor；四路独立退出，全部必做路径terminal后才join。

该决定把“三Agent”从固定三个实例改成三类逻辑角色；并行高峰最多六个Agent终端。其代价是更高的并发资源消耗，以及candidate revision变化时整批复核重跑；收益是四条独立复核路径缩短为一个并行等待窗口。

用户对“必做路径缺失是否允许继续”的理解是“除非用户授权”。本文据此冻结§5.5：授权只能针对精确Run/Batch/revision/path形成持久Approval；它允许编排带缺口继续，但不能把缺失路径改写成pass/N/A，也不能代替最终治理验收。

用户随后明确表示“改完没问题了，设计方案更新下”，构成事件`DHR-A-17`的整版确认与正式晋升授权；不构成B-adjust、开发、提交、推送或启用新目录授权。

## 10. 旧验收承接与正式晋升边界

以下旧canonical ID继续生效，`acceptance-id-mapping.json`唯一指向本文。它们保留原语义；适用阶段说明只决定何时取证，不降低约束。

| ID | 当前仍需满足的原语义 | 适用阶段 |
|---|---|---|
| HC-P1-A1 | Plan/Resolved Plan、状态、Result、Handoff、Event及合法转换有版本化Schema，未知字段与非法边失败 | 当前 |
| HC-P1-A2 | CAS、generation、Receipt和完整身份链拒绝迟到、重复与错绑定结果 | 当前 |
| HC-P1-A5 | Node succeeded不被Runner直接投影为整张任务完成 | 当前 |
| HC-P1-A6 | 无结果退出、probe error、半写、坏JSON、无进展和能力耗尽均fail-closed | 当前 |
| HC-P1-A8 | Handoff足以让下一Worker恢复，且所有最终工件不泄漏凭据值 | 当前 |
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

旧P1/P2/CTRL验收中未列入上表者维持归档09与决策记录中的`historical/superseded/deferred`去向。特别地，原`HC-P1-A4`、`HC-P1-A7`中可靠Message Router的replacement更新为`HC-3AT-A25`，原`HC-3AT-A20`本身也标记`superseded`；不得再由旧映射把队列、TTL、预算或三阶段聊天送达带回当前主线。

本次晋升同步满足以下文档闸：

1. `design/README.md`的唯一`designInputs[]`为本文，上一版09已移入`design/archive/`；
2. active legacy mapping改指本文，并新增`records/02`记录replacement与实施边界；
3. AGENTS明确三类角色、多实例、薄Ticket自读workspace和Worker不得跨Node；
4. `.gitignore`继续使用精确`/dh_relay/runtime/`规则，不忽略整个`dh_relay/`，因此plans/archive未来可跟踪；
5. Resolver迁移卡完成旧根发现/恢复、新根解析、保留与清理验收前，不创建正式新根目录、不启用新根start。

下一步只能在用户另行授权后执行B-adjust：重新拆分薄Plan/Resolver、Workflow/Actor边界、Launcher、Role Relay、单Node Pair、Review Batch、恢复和端到端验收卡。B-adjust确认前不得沿用旧DHR_55/DHR_56范围直接施工，也不得把这些能力塞入DHR_30。
