# 现役 Runner 一致性对照

> 本文档是 RLT_02 的只读对照产物，不改变 relay-light 或现役 Runner 的任何实现。现役 Runner 指 `tools/contracts/`、`tools/runner/`、`tools/host/` 中的 `relay/v1` PowerShell 实现；其 as-built 快照只作定位，代码优先。

## 口径与汇总

- 裁决只使用 **有意差异** 或 **遗漏**。这里的“有意差异”指 relay-light 正式设计已明确选择另一套语义，不是将来可以无说明地照搬或改写现役 Runner。
- 本次共 29 条：节点 5、角色 11、事件 8、关闭 5；有意差异 29，遗漏 0。
- 后续实现卡应以本表固定的 relay-light 语义为边界：计划解析由 RLT_03、账本及 agent 状态机由 RLT_04、阶段生命周期及关闭由 RLT_05、角色配置由 RLT_06 承接；不改动现役 Runner。

## 1. 节点

| # | relay-light 侧定义（出处） | 现役 Runner 侧定义（出处） | 差异描述 | 裁决 | 裁决理由 |
|---:|---|---|---|---|---|
| 1 | 节点是阶段内不可跨越的顺序步骤；节点表以 `node/card/stage/type/close/depends_on/note` 表达身份与边界。`stage` 是 `<card>:<stage>#<k>`，阶段取 W/C/R/X/F。〔`design/01` §0.2、§4.1、§5.1〕 | 计划节点是 JSON `node_id/role/brief_ref/depends_on/next_action/resume_from`；schema 只要求 DAG 节点身份和依赖。〔`tools/contracts/relay-schema.ps1:90-109`〕 | relay-light 把任务卡与阶段实例作为节点身份；现役 v1 是不带 card/stage 的通用计划节点。 | 有意差异 | relay-light 要让阶段、工作区与 dev-harness 节点可机械追溯；RLT_03 应实现该独立表合同，而非扩写现役 JSON schema。 |
| 2 | 同一卡的阶段实例及阶段内节点串行；只允许跨卡并行，`depends_on` 留空默认前一节点。〔`design/01` §4.1、§5.1〕 | 任何依赖都成功后节点即 ready，`Get-RelayReadyNodes` 可返回多个节点。〔`tools/runner/relay-runner.ps1:95-107`〕 | relay-light 将并发边界收窄到跨卡；现役 v1 是一般 DAG ready 调度。 | 有意差异 | 这是以终端空间和单卡交棒纪律换取可解释性的产品选择；RLT_03 负责校验同卡串行与跨卡边界。 |
| 3 | 节点状态为派生且不落盘的 `pending/ready/open/closed/superseded`。〔`design/01` §3.3、§3.5〕 | 每节点持久保存 `task_state`、`scheduling`、终端状态、结果状态及冻结信息；`scheduling` 为 `waiting/launched/succeeded/blocked/paused`。〔`tools/runner/relay-store.ps1:95-108`；`tools/runner/relay-runner.ps1:4-9`〕 | 两者均由运行记录推导进度，但状态词表、存储位置和粒度不同。 | 有意差异 | relay-light 的 `status` 只从追加账本派生、避免另一个可写状态投影；RLT_05 承接该派生合同。 |
| 4 | 节点可挂多个 agent；agent 的 attempt 按同一节点实例、同一 agent 的重拉计数，节点级返工是新节点实例。〔`design/01` §3.2、§3.4、§5.2〕 | 每个计划节点持一个 `attempt_id`，启动时生成 `launch_id/session_id` 与 receipt。〔`tools/runner/relay-runner.ps1:109-131`〕 | relay-light 的 attempt 是多-agent 账本概念；现役 v1 的 attempt 是单节点 launch receipt 身份链。 | 有意差异 | relay-light 要表达一个节点内的多角色协作和返工节点；RLT_04 按账本合同实现，不复用 Receipt 模型。 |
| 5 | `close` 是节点表的可选第二判据，且节点类型限定为 build/construction/review/rework/handoff，不含 kickoff 或 verify-signoff。〔`design/01` §4.1〕 | 计划节点没有 `close/type/stage` 字段，只有最终 result 的 `next_action`。〔`tools/contracts/relay-schema.ps1:90-109`；`tools/contracts/relay-schema.ps1:200-222`〕 | relay-light 在计划层声明节点关闭要求和任务类型；现役 v1 将完成语义留给结果摄入。 | 有意差异 | 关闭判据须被 relay-light 的账本与 `status` 机械验证；RLT_03/RLT_05 分别承接表校验与关闭派生。 |

## 2. 角色

| # | relay-light 侧定义（出处） | 现役 Runner 侧定义（出处） | 差异描述 | 裁决 | 裁决理由 |
|---:|---|---|---|---|---|
| 1 | planner：一次性定档并生成计划；改计划实例只走白名单后关闭。〔`design/01` §2〕 | 计划提案人枚举只有 `orchestrator/replanner`。〔`tools/contracts/relay-schema.ps1:112-147`〕 | planner 是显式业务角色，不等同于现役提案人字段。 | 有意差异 | relay-light 将规划产物、生命周期和改计划职责公开化；RLT_06/RLT_07 承接角色配置与提示词。 |
| 2 | orchestrator：常驻全计划，只负责建阶段空间、等 monitor、读取 `stage_result` 分路。〔`design/01` §2、§2.1〕 | `orchestrator` 只作为首份 proposal 的合法 `proposed_by`；运行调度由 Runner/host 函数完成。〔`tools/contracts/relay-schema.ps1:112-122`；`tools/host/relay-host.ps1:81-101`〕 | relay-light 把编排者设为常驻逻辑角色；现役 v1 只以提案身份和宿主循环体现。 | 有意差异 | relay-light 需要可见的阶段交棒者；不把现役 host 调度器伪装成 agent。 |
| 3 | monitor：每阶段独立，派本阶段 agent、盯人、路由、写节点与 agent 事件。〔`design/01` §2〕 | host 摄入文件、tick、启动 ready 节点；Runner 是状态、receipt、final result 和事件唯一写者。〔`tools/host/README.md:4-16`；`tools/runner/relay-runner.ps1:186-215`〕 | monitor 是有明确写账权限的 agent；现役 host/Runner 是程序组件。 | 有意差异 | relay-light 故意以人机角色承接阶段内判断，而不是改写 v1 的唯一写者边界。 |
| 4 | builder：仅在 W 阶段建立任务工作区七件套和 `task_plan`。〔`design/01` §2〕 | `worker` 是唯一通用施工角色，没有 W 阶段 builder 枚举。〔`tools/contracts/relay-schema.ps1:90-97`；`tools/contracts/relay-schema.ps1:178-187`〕 | relay-light 将建工作区从泛 worker 中拆出。 | 有意差异 | 该职责要有独立节点与产物边界；RLT_06/RLT_07 配置它，不改 v1 role 枚举。 |
| 5 | plan-reviewer：单节点审 `task_plan`。〔`design/01` §2〕 | `reviewer` 只是通用 receipt/plan role，不区分计划审或代码审。〔`tools/contracts/relay-schema.ps1:96-97`；`tools/contracts/relay-schema.ps1:178-185`〕 | relay-light 将计划评审从通用 reviewer 细分。 | 有意差异 | W 阶段的计划审有固定输入、输出和时机；由 relay-light 角色配置承担。 |
| 6 | coder：批内持续在场，写代码、提交并记录少量 findings/lesson。〔`design/01` §2〕 | `worker` 是一般执行节点 role；结果用 `result_status/next_action` 回传。〔`tools/contracts/relay-schema.ps1:90-109`；`tools/host/relay-agent-tool.ps1:93-101`〕 | relay-light 的 coder 有批内常驻与工作区写入纪律；现役 worker 只是一条 receipt 身份。 | 有意差异 | relay-light 要约束施工交棒行为；RLT_07 用 skill 合同表达，不能移植现役 agent 工具实现。 |
| 7 | scribe：只写 `progress.md`，R/F 阶段另跑脚本和汇总。〔`design/01` §2〕 | 没有 scribe role；host 只摄入 checkpoint/result，worker 自己生成 handoff/result。〔`tools/host/relay-host.ps1:60-78`；`tools/host/relay-agent-tool.ps1:59-101`〕 | relay-light 将过程记录与施工者拆开；现役 v1 不设独立记录者。 | 有意差异 | 单写者纪律是 relay-light 账本/工作区设计的一部分；由 RLT_06/RLT_07 落地。 |
| 8 | checker：施工每轮后的方向评估，不做复核，给同一 coder 纠偏方案。〔`design/01` §2、§2.2〕 | 无 checker role；只有 `worker/reviewer/replanner`。〔`tools/contracts/relay-schema.ps1:90-97`〕 | relay-light 新增早期方向评估角色。 | 有意差异 | 它与终局 reviewer 的时机不同，设计明确允许职责重叠；RLT_07 承接其 prompt/模板。 |
| 9 | decider：施工 blocked 时按需给可落地方案，自己不改文件。〔`design/01` §2、§2.2〕 | 无 decider receipt role；agent 只能提交 `decision_required` checkpoint，Runner 冻结依赖。〔`tools/contracts/relay-schema.ps1:225-241`；`tools/runner/relay-runner.ps1:253-274`〕 | relay-light 以独立决策 agent 和账本链表达 blocked；现役 v1 以 checkpoint 状态表达。 | 有意差异 | relay-light 要显式区分方案作者与被阻塞 worker；RLT_04/RLT_07 承接其事件链与提示词。 |
| 10 | reviewer：R 阶段各路复核，路数由 Recipe 决定。〔`design/01` §2〕 | `reviewer` 是现役计划和 receipt 的合法 role。〔`tools/contracts/relay-schema.ps1:90-97`；`tools/contracts/relay-schema.ps1:178-185`〕 | 名称相同，但 relay-light 附加 Recipe 路数、阶段和独立产物规则。 | 有意差异 | 只借名称，不继承 v1 单节点 receipt 语义；RLT_06/RLT_07 固定配方和复核工作流。 |
| 11 | strategist：返工到上限时给全局方案或建议停卡，永远交用户裁决。〔`design/01` §2、§2.2〕 | 无 strategist role；现役 v1 只有 `dependency_blocked` 触发 replan_required。〔`tools/contracts/relay-schema.ps1:200-210`；`tools/runner/relay-runner.ps1:240-249`〕 | relay-light 增加人工闸前的全局策略角色。 | 有意差异 | 复核止损和用户裁决是 relay-light 的产品合同；RLT_06/RLT_07 及 RLT_15 依其设计承接。 |

## 3. 事件

| # | relay-light 侧定义（出处） | 现役 Runner 侧定义（出处） | 差异描述 | 裁决 | 裁决理由 |
|---:|---|---|---|---|---|
| 1 | Herdr 状态层为 `working/idle/done/blocked/unknown`，只来自 `herdr agent wait`。〔`design/01` §3.3〕 | 宿主观测的 terminal_state 为 `launching/running/idle/stopped/exited/unknown`。〔`tools/contracts/relay-schema.ps1:244-283`〕 | 一方记录 agent wait 返回，一方记录终端宿主状态；同名 `idle/unknown` 也不应混用。 | 有意差异 | 设计明确三层词表分离；RLT_04 不借用 v1 terminal-state 枚举。 |
| 2 | 节点状态层为 `pending/ready/open/closed/superseded`，由 `status` 派生、不落盘。〔`design/01` §3.3、§3.5〕 | 事件 schema 不以节点状态作为 event kind；Runner 的持久投影另有 `scheduling/task_state`。〔`tools/contracts/relay-schema.ps1:244-283`；`tools/runner/relay-store.ps1:95-108`〕 | relay-light 的节点状态是账本视图，非现役 v1 event 或 state 字段。 | 有意差异 | 状态投影不应被误当作事件词；RLT_05 以账本派生实现。 |
| 3 | 控制事件包括 `plan_loaded/stage_start/monitor_launch/node_start/node_close/stage_result/stage_close/monitor_restart/plan_amend`，不进入 agent 状态机。〔`design/01` §3.4〕 | v1 event kind 是 `plan_proposed/plan_activated/launch_receipt/observation/.../control/...`，`control` 另有 actor/source/nonce。〔`tools/contracts/relay-schema.ps1:244-283`〕 | relay-light 的 9 个控制事件面向阶段交接；现役 v1 的事件面向 plan authority、receipt 和宿主摄入。 | 有意差异 | 事件名只在各自账本内有效；RLT_04 采用 relay-light 白名单，不扩充 v1。 |
| 4 | agent 生命周期事件为 `agent_launch/checkpoint/done/agent_lost/cancelled`，终态后同一 `(node,agent)` 禁止继续写。〔`design/01` §3.4〕 | v1 以 `launch_receipt/checkpoint_accepted/result_accepted/result_rejected/result_stale` 记录摄入结果，身份键为 plan/attempt/launch/session。〔`tools/contracts/relay-schema.ps1:244-283`；`tools/runner/relay-runner.ps1:217-250`〕 | relay-light 记协作生命周期；现役 v1 记 receipt 绑定工件的接收判定。 | 有意差异 | 两者的唯一性和信任边界不同；RLT_04 只实现设计指定的 `(node,agent)` 状态机。 |
| 5 | decider 链是 `blocked → escalate → decision → [user_decision] → resume`，是否有 `user_decision` 取决于 `decision_mode`。〔`design/01` §3.4〕 | `decision_required` 是 checkpoint status，Runner 计算冻结集；没有上述事件链。〔`tools/contracts/relay-schema.ps1:225-241`；`tools/runner/relay-runner.ps1:253-274`〕 | relay-light 将决策过程作为可审计事件序列；v1 是状态转换。 | 有意差异 | 这是 relay-light 的明确可追溯性选择；RLT_04 实现该链的顺序守门。 |
| 6 | strategist 链从 `escalate` 开始，strategist 自身有 `agent_launch/done`，被触发 coder 承载决策事件，且必有 `user_decision`。〔`design/01` §3.4〕 | v1 没有 strategist 链；`dependency_blocked` 结果会令节点 blocked 并置 `replan_required`。〔`tools/runner/relay-runner.ps1:240-249`〕 | relay-light 对复核止损规定了独立事件归属和人工闸；v1 只给 replan 信号。 | 有意差异 | 人工裁决不可降格为自动 replan；实现及实跑分别由 RLT_04 与 RLT_15 承接。 |
| 7 | `plan_amend` 是 monitor 写入的账本事实，编排只经 `stage_result.note` 的摘要在下一阶段前重读计划。〔`design/01` §2.1、§3.4、§5.2.1〕 | v1 `Submit-RelayProposal` 以 authority generation/CAS 激活新 plan，并写 `plan_proposed/plan_activated`。〔`tools/runner/relay-runner.ps1:53-92`〕 | relay-light 的运行中改计划是阶段内追加和交接摘要；v1 是不可变 proposal 晋级。 | 有意差异 | relay-light 不迁移 v1 authority/CAS 模型；RLT_09 承接其白名单和追加合同。 |
| 8 | 每条 relay-light 账本行固定七字段、只追加；`status` 只判账本完整性，不判产出质量。〔`design/01` §3.1、§3.2、§3.5〕 | v1 事件含 `schema_version/event_id/kind/occurred_at` 及可选 identity/reason，且 Runner 在接收时校验并更新 state。〔`tools/contracts/relay-schema.ps1:244-283`；`tools/runner/relay-store.ps1:95-125`〕 | 账本数据形状、写者和状态更新方式均不同。 | 有意差异 | relay-light 的纯追加 ledger 是独立实现单元；RLT_04/RLT_05 应保持该边界。 |

## 4. 关闭

| # | relay-light 侧定义（出处） | 现役 Runner 侧定义（出处） | 差异描述 | 裁决 | 裁决理由 |
|---:|---|---|---|---|---|
| 1 | 节点关闭须同时满足：所有已 launch agent 均有 `done/agent_lost/cancelled` 终态；若 `close=agent:<name>`，该 agent 必须 `done`。〔`design/01` §5.3〕 | 接受 final result 后，`succeeded` 将节点 scheduling 置为 succeeded；其他 final status 置 blocked/paused 等。〔`tools/runner/relay-runner.ps1:217-250`〕 | relay-light 是多-agent 双条件关闭；v1 是单节点 receipt final-result 投影。 | 有意差异 | 不能把 v1 的 `succeeded` 当作 relay-light `node_close`；RLT_05 实现双条件守门。 |
| 2 | 阶段收尾固定为末节点 `node_close → stage_result → stage_close →` 关终端空间，顺序逐条校验。〔`design/01` §5.2.1〕 | v1 没有 stage/stage_result/stage_close；host 每 tick 启动 ready 节点并根据全部节点结果判运行结局。〔`tools/host/relay-host.ps1:81-101`〕 | relay-light 有阶段级写者交接，现役 v1 无阶段对象。 | 有意差异 | 终端空间关闭必须落在阶段合同中；RLT_05 承接顺序与状态派生。 |
| 3 | `stage_result` 可多次写；blocked 后在同一阶段实例等待用户决定，终局 done/cancelled 后才能 `stage_close`。〔`design/01` §2.1、§5.2.1〕 | `dependency_blocked` final result 立即令节点 blocked、要求 replan 并尝试 stop session。〔`tools/runner/relay-runner.ps1:240-249`〕 | relay-light 的 blocked 是阶段结果分路；v1 的 blocked 是节点调度状态。 | 有意差异 | 二者名称相同但业务层级不同；RLT_05/RLT_07 依 relay-light 语义落地。 |
| 4 | agent 关闭由账本终态事件与 `(node,agent)` 状态机决定；Herdr `done` 仅触发 monitor 读取产出，不等于账本 `done`。〔`design/01` §3.3、§3.4〕 | 终端 `exited` 且无 final result 会投影为 `interrupted_unknown` 并 pause；终端转换由矩阵守门。〔`tools/runner/relay-runner.ps1:152-183`；`tools/contracts/relay-transitions.ps1:20-68`〕 | relay-light 分离宿主停止与业务确认；v1 以 terminal/result 双维状态处理。 | 有意差异 | relay-light 仍要监工确认产出，不能把宿主事件直接当作关闭；RLT_04/RLT_05 承接账本终态与关闭。 |
| 5 | 关闭以账本完整性和固定判据为限，`status` 不判产出质量。〔`design/01` §3.1、§5.3〕 | result/checkpoint 都由 7 字段 Receipt 身份链、schema 和 transition 判定；final result 不可覆盖。〔`tools/contracts/relay-schema.ps1:171-241`；`tools/runner/relay-runner.ps1:217-250`〕 | v1 的关闭还依赖强身份、不可变文件与结果转换；relay-light 首版选择不同的账本守门。 | 有意差异 | 这是两套运行模型的边界，不是 RLT_02 可迁移的缺项；后续 relay-light 卡只实现其正式设计，不复用现役 PowerShell。 |

## 结论

四类对照已无未裁决项。29 条均为正式设计已声明或为其直接实现边界所必需的有意差异，未发现需要以“遗漏”移交后续任务的条目。现役 Runner 的 `relay/v1` schema、Receipt、CAS、状态投影和 host 机制继续只读；relay-light 后续卡据本表分别实现自己的计划、账本、关闭和角色合同。
