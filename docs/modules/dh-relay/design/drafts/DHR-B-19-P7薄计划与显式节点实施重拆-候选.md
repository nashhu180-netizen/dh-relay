# DHR-B-19 候选：P7 薄计划与显式节点实施重拆

> 状态：B-adjust 候选已获用户整版确认并晋升至正式 P7；本文保留为形成史。确认不创建任务 workspace、不授权开发，也不启用 `dh_relay/runtime/` 新根。

## 1. 唯一规划输入与调整边界

- 唯一 `designInputs[]`：[薄 RelayPlan、节点启动票据与显式阶段边界：产品设计与验收](../10-薄RelayPlan与显式节点边界-产品设计调整.md)。本候选不以旧 P7、records、evidence 或历史设计作为任务终点来源。
- 保留既有 DevPlan 的历史和已完成事实。P7 原 `DHR_36~40` 不删除、不复用编号；正式确认后拟保留原行并标为“已取消（被 DHR-B-19 替代）”。
- `DHR_53~60` 是本事件重新定义的新范围；其中 `DHR_55/DHR_56` 不继承任何旧候选或口头草案的同号范围，只认本候选经确认后写入的卡面。
- P7 阶段定位不变：仍在 P6 Gate 通过且用户放行后开工。P8 的多卡、卡内重编排、通用诊断、Hook/Outbox、run 级归档与外部 Oracle不提前；P9 的 Linux 双平台定型、发布升级和最终迁移不提前。
- 当前 `DHR_30` 继续只负责已经冻结的 Relay CLI、Read Model 与可选 Bridge 接缝。新任务以其稳定接口和收口结果为前置，不修改 `DHR_30` 卡面，也不进入其现有 worktree。
- 本候选只确定任务边界、依赖、验收、计划工作区和复核配方。每张卡的 `brief.md/task_plan.md` 与实际 workspace 只在该卡另行开工确认后创建。

## 2. 为什么旧五卡不能直接沿用

旧 P7 以“Contract/授权链/施工阶段/收口阶段/最终 verify”分五段，容易把新的承重对象混在大阶段里。正式设计现在要求分别冻结并验证：薄 Plan/Resolver、版本化 Ticket、Workflow/Actor 单写边界、外部 Launcher 与单 Node Pair、best-effort Role Relay、Review Batch、停滞恢复，以及最后的端到端接线。

若继续沿用旧范围，会出现三类风险：

1. Resolver、Workflow 和 DHR_30 actor 谁负责业务判断说不清，容易把新能力塞回 DHR_30。
2. 单节点启动、并行复核、恢复和普通聊天共用一张大卡，失败时无法判断是状态机、外部终端还是复核汇合出错。
3. 新 runtime 永久保留、Plan→Run→generation 关联与旧根只读迁移没有独立验收单元，可能在端到端阶段才发现审计历史不可追溯。

## 3. 八张新卡的业务地图

| 卡 | 用业务语言说做什么 | 解决的问题 | 做完后的可见效果 |
|---|---|---|---|
| `DHR_53` | 把一份很薄的接力路线确定性展开成这次真正要跑的步骤，并给每次运行钉住计划、任务和快照指纹 | 避免 Plan 复制 DevPlan，也避免运行结束后说不清“当时按哪份计划跑的” | 同一 Plan 可多次运行；每次 Run 可追溯、旧历史不被改写或自动删除；坏计划在启动前拒绝 |
| `DHR_54` | 冻结 Agent 每次接棒必须携带的 Ticket，以及 Result/Handoff/Attention/Approval 等正式回执格式 | 避免旧 Agent、错节点或伪造结果混进当前运行 | 每次接棒的身份、允许动作、停止点都可机判；字段缺失或错绑稳定拒绝 |
| `DHR_55` | 建立真正决定“现在能不能推进”的 Workflow Engine，并让 DHR_30 已有 actor 只按命令原子落账 | 避免 CLI、Launcher 或 Agent 各自改状态，造成半关闭、重复启动或越阶段 | 一次 `continue` 只产生一个合法下一步；结果、交接、关节点和下游 ready 同生同灭 |
| `DHR_56` | 把一个单节点安全地拉成“监督者 + 执行者”Pair，完成后关闭真实终端并释放容量 | 解决状态机已决定启动，但外部 Agent 重复拉起、关不干净或占槽位的问题 | 可以真实跑完一个施工/复核节点；旧终端没关完时不会冒险拉替代者，永久历史目录不占容量 |
| `DHR_57` | 让三类角色之间按当前身份即时转发普通消息，但不排队、不记业务账 | 解决需要沟通时只能猜 Pane 或直接敲终端，同时避免聊天变成第二套状态机 | 能向当前唯一角色发消息；离线、歧义、替换竞态都有明确结果，聊天永远不能推进节点 |
| `DHR_58` | 把代码轮2、需求、一致性、教训组成一个受控并行复核批次，并正确汇合 N/A、用户例外和取消 | 解决四路复核串行慢、漏一路仍误放行、Monitor 替换后结果串线的问题 | 一次控制动作形成一批独立 reviewer；只有全部必做路径合法收口后才出现下一步 |
| `DHR_59` | 识别“拉起但没接单、长时间没进展、在等人、宿主故障、真实退出”，并安全换新 Agent | 解决卡住时只看终端猜原因，以及旧 Agent 和替代者同时写结果的问题 | 系统能留下脱敏诊断、撤销旧身份、等容量释放后只恢复未完成部分；人在等待时不会被误杀 |
| `DHR_60` | 把前七卡接成一条真实 DevHarness 标准卡接力，并用现有 CLI/Read Model 验证启动、复核、恢复、历史查看与终态拒绝 | 解决各部件单测通过但整条业务链仍接不起来的问题 | 用户可看到一张真实卡按显式节点完成；成功/失败/取消历史永久可查但不可继续，P7 形成可签收的端到端结果 |

## 4. 依赖与分批

```text
DHR_30 稳定接口/收口 + P6 Gate
  -> DHR_53 -> DHR_54 -> DHR_55 -> DHR_56
                                      ├-> DHR_57 ───────┐
                                      └-> DHR_58 -> DHR_59
                                                        └-> DHR_60
```

- 批次 1：`DHR_53 → DHR_54`。先交付“计划能确定性展开、票据能稳定验真”的离线承重合同，不启动真实 Agent。
- 批次 2：`DHR_55 → DHR_56`。交付第一个端到端中间成果：一名 Monitor 与一名 Executor 可以安全完成一个显式 Node。
- 批次 3：`DHR_57` 与 `DHR_58` 在 `DHR_56` 后并行。普通消息不是 Review Batch 的业务依赖，两者不互相卡住。
- 批次 4：`DHR_59 → DHR_60`。先补单节点与 Review Batch 的恢复，再做真实标准卡整链验收。
- `DHR_59` 不依赖 `DHR_57`：恢复只能依据 Ticket、checkpoint、Host Observation 与 Store 事实，不能依赖普通聊天是否送达。

## 5. 任务卡候选

### DHR_53 · 薄 Plan、Resolver 与运行历史关联

- **目标**：冻结版本化 RelayPlan/Resolved Plan 合同；确定性读取 DevPlan 任务行、`task_type`、workspace 静态输入、Git/worktree 与 Profile registry，展开唯一 node/依赖/Recipe/applicability/mode；实现新旧根发现边界、Run 根不可变 `plan_id + task_id`、generation `resolved_plan_digest`、永久保留与 history/active 区分。新根 start 在本卡验收闭合前保持禁用。
- **非目标**：不实现 `continue`、Ticket 派发、外部 Agent 启动、Review Batch、删除/压缩/配额；不修改 DHR_30 卡或其 worktree。
- **机器证**：回连[正式设计](../10-薄RelayPlan与显式节点边界-产品设计调整.md) `HC-3AT-A19/A21/A23/A30/A31`：坏计划、缺 workspace、路径越界、Recipe 缺路/非法降级、错 Plan/Task 身份、错 digest、旧根写入、历史目录误计 active/容量、自动删除均有反例；同一 Plan 两次启动产生不同 Run，旧 generation 不被改写。
- **人判**：回连正式设计 `HC-3AT-H5/H10` 的计划与历史子集：展示薄 Plan 如何展开复核路径，以及成功/失败/取消历史为何“仍可查但不可继续”。
- **变更范围**：`relay-core/contracts/` 的 Plan/Resolved Plan/关联 schema；新建 `relay-core/resolver/`；`relay-core/runtime/` 的精确根发现与关联适配；对应 fixtures/tests；必要的精确 `.gitignore` 断言。
- **计划工作区**：`docs/modules/dh-relay/workspace/DHR_53/`（仅开工时创建）。
- **任务类型 / 复核配方**：`heavy` 重核；五路全要：代码轮1，随后代码轮2/需求/一致性/教训同一 Review Batch；有效单测必做，mode 由开工时冻结的 registry 决定且不得降级。
- **依赖**：P6 Gate 通过并经用户放行；DHR_30 的 CLI/Read Model 接口已收口并进入 master。

### DHR_54 · Ticket 与正式工件合同

- **目标**：冻结 Work Item Ticket、Monitor Ticket、`continue` request/Receipt、Orchestrator Lease、Result、Handoff、Report、Attention、Approval、Role Relay request/snapshot/result 与节点状态枚举的版本化 schema、JCS digest、完整身份链、能力、过期与停止点。
- **非目标**：不决定下一节点、不写 Store、不启动 Agent、不实现聊天投递。
- **机器证**：回连正式设计 `HC-3AT-A2/A7/A11`、`HC-P1-A1/A8` 及 `HC-3AT-A24` 的票据子命题：缺字段、未知字段、旧 generation、错 node/pair/attempt/agent/batch/revision、错 HEAD/digest、过期 Ticket/Lease、错 expected state、重复 request ID 冲突、凭据/原始聊天进入工件均 fail-closed；同一 `continue` request 重放只能引用同一 Receipt。
- **变更范围**：`relay-core/contracts/`、`relay-core/fixtures/`、独立 validator 与契约负例测试；不进入 workflow/launcher。
- **计划工作区**：`docs/modules/dh-relay/workspace/DHR_54/`（仅开工时创建）。
- **任务类型 / 复核配方**：`heavy` 重核；五路全要 + 有效单测，mode 按冻结 registry。
- **依赖**：DHR_53。

### DHR_55 · Workflow Engine 与 Actor 命令边界

- **目标**：实现确定性 Workflow Engine：从权威 Read Model 计算 `continue`、单节点收口、用户授权与稳定拒绝，消费 DHR_54 已冻结的 request/Receipt 合同并生成带 expected generation/state、幂等 request ID 和 guard 的业务命令；通过 DHR_30 所依赖的既有 Runtime HostSessionActor 物理单写接口原子落账。由 Runner 签发、续期、撤销和过期 run-scoped Orchestrator Lease，只有有效 Lease 能请求 Run 控制。先覆盖单 Node，不含 Review Batch。
- **非目标**：不直接拉终端，不让 CLI/Launcher/Agent 写 Store，不实现 Batch fan-out、Role Relay 或停滞探测。
- **机器证**：回连正式设计 `HC-3AT-A9/A10/A14/A15/A17`、`HC-P1-A2/A5` 及 `HC-3AT-A24/A31` 的状态转换子命题：`no_ready/ambiguous_ready/stale_generation`、并发/重放同 Receipt、Result/Handoff/node_closed/next_ready 原子同生同灭、无/过期/错 Run Orchestrator Lease 与 Worker 调 `continue` 均拒绝、Lease 撤销后控制能力立即失效、Plan/Task/digest 错绑拒绝、actor 不自行做业务裁决。
- **变更范围**：新建 `relay-core/workflow/`；扩展 `relay-core/runtime/` 的命令执行/actor 端口和 Store 事务测试；仅增加必要 RPC 装配，不改 DHR_30 历史任务范围。
- **计划工作区**：`docs/modules/dh-relay/workspace/DHR_55/`（仅开工时创建）。
- **任务类型 / 复核配方**：`heavy` 重核；五路全要 + 有效单测，mode 按冻结 registry。
- **依赖**：DHR_54。

### DHR_56 · Launcher 与单 Node Pair

- **目标**：消费 durable launch intent，做容量预检并通过 P6 Herdr Adapter 启动/确认一个 Monitor 与一个 Executor；签发各自 Ticket，绑定 Host Observation，处理 launch failure、正常退出、强停、Ticket 撤权和 `pair_release_pending/failed`，保证单 Node 每个角色至多一个 active 身份。
- **非目标**：不做多 Reviewer Batch、不做 Role Relay、不根据聊天/`done`推断完成、不实现超时后的替代恢复（DHR_59）。
- **机器证**：回连正式设计 `HC-3AT-A1/A4/A5/A12/A14/A27`、`HC-3AT-A24` 的 launcher 子命题与 `HC-CTRL-H4/H12`：容量不足零分配；重复 launch 不增 Pair；部分启动可恢复；旧身份迟到拒绝；final commit 后撤权再关终端；永久 runtime 不占容量，真实终端未释放才阻止 replacement。
- **人判**：回连正式设计 `HC-3AT-H1/H3/H6` 的单节点子集：用户能看到 Monitor/Executor 两种职责、Node 关掉后 Worker 不跨阶段、下一节点只 ready 不自启。
- **变更范围**：新建 `relay-core/launcher/`、`relay-core/pair/`；P6 Herdr Adapter 的窄调用层；Host/Store/RPC 测试与受控 fake adapter；不改 P6 Profile 业务口径。
- **计划工作区**：`docs/modules/dh-relay/workspace/DHR_56/`（仅开工时创建）。
- **任务类型 / 复核配方**：`heavy` 重核；五路全要 + 有效单测，mode 按冻结 registry。
- **依赖**：DHR_55；P6 Herdr/Profile 能力闸已通过。

### DHR_57 · best-effort Role Relay

- **目标**：从有效 Work Item Ticket 或 Orchestrator Lease 解析 source/target 身份，向唯一当前 Herdr Agent 即时 prompt，并只返回 `sent/target_offline/target_ambiguous/delivery_uncertain`；前后对账 Host generation 与 Agent identity。
- **非目标**：不排队、不重投、不保存普通聊天、不解释内容、不生成授权、不改变 Node/Run 状态、不开放直接 send-keys 绕过。
- **机器证**：回连正式设计 `HC-3AT-A3/A25`：多 Run 同名、裸 executor 多实例、目标 offline/ambiguous、目标 working/idle/blocked、过期 Ticket/Lease、替换竞态、`sent` 后无回复与直接 Herdr 调用均有稳定 oracle，且 Store 业务状态零变化。
- **人判**：回连正式设计 `HC-3AT-H1` 的转发子集：三类角色能交流，但普通消息与业务状态账清楚分开。
- **变更范围**：新建 `relay-core/role-relay/`；Herdr prompt 窄适配；RPC/CLI 窄入口及 fake adapter 测试。
- **计划工作区**：`docs/modules/dh-relay/workspace/DHR_57/`（仅开工时创建）。
- **任务类型 / 复核配方**：`normal` 常规；代码轮1、需求、教训三路 + 有效单测；不含代码轮2/一致性，除非用户在开工前改类。原因：本卡只做无权威副作用的 best-effort 投递，不改变 Host 身份模型或安全边界；若施工发现必须改变身份/权限合同，立即停下重定类为 `heavy`，不能现场自升级。
- **依赖**：DHR_56。

### DHR_58 · Review Batch、N/A 与用户例外

- **目标**：在代码轮1及整改闭合后，以一次 CAS 分配父 Batch、一个 Monitor 与全部适用 Reviewer intents；实现 Result+当前 Monitor Report 成对收口、N/A、`path_user_overridden`、整批取消、revision 失效、join 与 capacity guard。路径失联的恢复触发可用合成事件验证，真实检测/替代由 DHR_59 承接。
- **非目标**：不把 Monitor 当第五路结论，不允许删必做路径，不依赖 Role Relay 聊天，不实现停滞诊断。
- **机器证**：回连正式设计 `HC-3AT-A4/A5/A8/A26/A27/A28`：Batch 原子全有或全无；第一条/前三条完成不放行；N/A 缺依据拒绝；Result/Report 半份不 terminal；合法 override 只能产生 `proceeded_with_user_override`；cancel/join/Result/launch 竞态固定；新 revision 使旧批次失效；永久目录不计容量。
- **人判**：回连正式设计 `HC-3AT-H5/H7/H8`：用户看到一次控制动作形成并行批次、单路失败不丢已完成结果、缺路默认阻断，用户例外也不冒充通过。
- **变更范围**：新建 `relay-core/review-batch/`；扩展 workflow 命令、actor 事务与 launcher 的批次 intent 消费；Batch/Path/Approval fixtures 与竞态测试。
- **计划工作区**：`docs/modules/dh-relay/workspace/DHR_58/`（仅开工时创建）。
- **任务类型 / 复核配方**：`heavy` 重核；五路全要 + 有效单测，mode 按冻结 registry。
- **依赖**：DHR_56；与 DHR_57 可并行。

### DHR_59 · 停滞检测、诊断与安全恢复

- **目标**：冻结并执行 `start_deadline/checkpoint_deadline`；综合 `node_started`、checkpoint 与 Host Observation 区分未接单、正常长步骤、人等状态、宿主不可达、probe error、Pane/进程退出；生成白名单→脱敏→UTF-8 限长诊断，CAS 撤权旧 Attempt，等待旧 Pair 释放后为单 Node 或 Batch 未完成路径签发新 Attempt。
- **非目标**：不凭聊天、屏幕静默或 `done` 判完成；不自动输入；不重跑同 revision 已 terminal 的复核路径；不依赖 DHR_57 消息投递。
- **机器证**：回连正式设计 `HC-3AT-A6/A13/A18/A29`、`HC-P1-A6`、`HC-CTRL-H7/H12` 及 `HC-3AT-A26` 的恢复子命题：Result/recovery 单一 CAS 赢家；旧 Attempt 所有迟到写拒绝；人等状态暂停为短提醒；诊断泄密反例零原文；旧 Pair 未释放/容量不足无 replacement；Runtime/Host crash 只恢复一个合法身份；Batch 只恢复未完成路径。
- **人判**：回连正式设计 `HC-3AT-H4/H9`：用户能区分五类“看似没动”的情况，并看到替代前后的 Agent 身份和有限诊断。
- **变更范围**：新建 `relay-core/recovery/`、`relay-core/diagnostics/`；扩展 Host observation、workflow/actor/launcher 恢复端口；时间、竞态、脱敏与 crash fixtures。
- **计划工作区**：`docs/modules/dh-relay/workspace/DHR_59/`（仅开工时创建）。
- **任务类型 / 复核配方**：`heavy` 重核；五路全要 + 有效单测，mode 按冻结 registry。
- **依赖**：DHR_58；不依赖 DHR_57。

### DHR_60 · DevHarness 适配与 P7 端到端验收

- **目标**：以当前 dev-harness `task_type`/workspace 合同生成一份真实薄 Plan，接通现有 DHR_30 CLI/Read Model 与 DHR_53~59；用用户在本卡开工时另行选择的真实标准任务完成 construction→显式收口→Review Batch→必要恢复→最终交付/verify 的一条 Run，并另造失败、取消和终端历史查看场景。只有本卡前置全绿后才允许正式新根 start。
- **非目标**：不做 P8 多卡/重编排/通用 Diagnoser/Outbox/run 级归档与跨卡 Oracle；本卡仍须保留独立于被测实现的单卡 E2E oracle。不做 P9 Linux/发布定型，不重建 DHR_30 Read Model，不自动删除 runtime，不在 B-confirm 时预建真实卡 workspace。
- **机器证**：回连正式设计 `HC-3AT-A16` 与 `HC-3AT-H1~H10` 的整链机器前置；逐项重放 active 集合 `A1~A19、A21、A23~A31` 的跨组件反例，`A20/A22` 只验证其 superseded 语义不会被带回，不作为 active 通过项。重点验证：施工 Worker 不原地复核、Review Batch 一次分配、单路恢复、Role Relay 零业务副作用、用户 override 不冒充 pass、成功/失败/取消从 active 消失但永久可查且不可继续、Plan→Run→generation 关联可追溯。`HC-P1-A1/A2/A5/A6/A8` 及 `HC-CTRL-H1/H2/H3/H4/H6/H7/H8/H10/H11/H12` 由本卡做整链对证，不改变其前述分卡主承接。
- **人判**：按正式设计 `HC-3AT-H1~H10` 组织一份 5 分钟操作清单与证据索引，逐项向用户展示并等用户签收；UI/图形不是通过前置，既有 CLI/Read Model 是正式观察面。
- **变更范围**：新建 `relay-core/workflows/dev-harness/` 与端到端 fixture/oracle；扩展现有 CLI/RPC 的 `continue/attention/approve/role-relay` 窄装配；`relay-core/test/e2e/`；本卡独立证据目录。任何对 DHR_30 已冻结接口的必要变化必须在本卡明确登记兼容处置，不回写旧卡。
- **计划工作区**：`docs/modules/dh-relay/workspace/DHR_60/`（仅开工时创建；真实业务卡另由用户选择且另走其自身入口闸）。
- **任务类型 / 复核配方**：`heavy` 重核；五路全要 + 有效单测；代码轮1及整改闭合后，代码轮2/需求/一致性/教训按正式设计进入同一 Review Batch。
- **依赖**：DHR_57、DHR_59；DHR_30 已收口并进入 master；用户另行确认真实任务与验收环境。

## 6. 验收覆盖与阶段保留

- 新卡主承接：`DHR_53=A19/A21/A23/A30/A31`；`DHR_54=A2/A7/A11 + P1-A1/A8`；`DHR_55=A9/A10/A14/A15/A17 + A24/A31状态转换 + P1-A2/A5`；`DHR_56=A1/A4/A5/A12/A27单节点 + A24外部启动`；`DHR_57=A3/A25`；`DHR_58=A8/A26/A27批次/A28`；`DHR_59=A6/A13/A18/A29 + A26恢复 + P1-A6`；`DHR_60=A16及整链人验/回归对证`。
- `HC-3AT-A20/A22` 已在正式设计中 superseded，不给新卡伪造 active 承接。
- `HC-CTRL-H9` 的 Linux 无 GUI 全链继续由 P9 `DHR_46` 承接；DHR_60 只做当前 Windows/CLI POC，不提前宣称双平台完成。
- P8 `DHR_41~45` 与 P9 `DHR_46~48` 保持原阶段闸和任务身份；正式 B-adjust 只机械更新它们对“P7 Gate”的前置指针，不改变其范围、验收、档位或顺序。

旧 `P7-M1~M9` 与 `DHR_36~40` 一起保留为 `DHR-B-07` 历史口径，不再作为 active P7 Gate，也不得继续解锁 P8。新的 active Gate 使用未占用 ID：

| 新 Gate | 可机判终点 | 承接卡 |
|---|---|---|
| `P7-M10` | 薄 Plan/Resolver、task_type Recipe、新旧根边界、永久历史与 Plan→Run→generation 关联全部 fail-closed | DHR_53 |
| `P7-M11` | Ticket、`continue` request/Receipt、Orchestrator Lease 与全部正式工件 schema/身份/digest 负例通过 | DHR_54 |
| `P7-M12` | Workflow Engine 是唯一业务裁决者，HostSessionActor 只按 guard 原子落账；单 Node `continue`/收口幂等且无半状态 | DHR_55 |
| `P7-M13` | 单 Node Monitor+Executor Pair 可真实启动、收口、撤权与释放；永久目录不占容量 | DHR_56 |
| `P7-M14` | Role Relay 四结果枚举、身份对账与零业务副作用成立 | DHR_57 |
| `P7-M15` | Review Batch 原子分配、路径收口、N/A、用户例外、取消、revision 失效与 join 成立 | DHR_58 |
| `P7-M16` | 启动/进展时限、五类停滞辨识、脱敏诊断、单 Node/Batch 安全替代及竞态恢复成立 | DHR_59 |
| `P7-M17` | 一张真实标准卡跑通 active A/H 集合；成功/失败/取消历史永久可查不可继续；新根启用闸与独立 E2E oracle 通过 | DHR_60 |

新的 `P7 Gate = P7-M10~M17 全部通过 + 正式设计 H1~H10 用户签收 + 用户明确放行 P8`。正式落盘时，P8 的 `blocked-by-phase-gate:P7` 语义只机械改指这一新 Gate；不是沿用已取消任务对应的旧 M1~M9。

## 7. 拟向用户确认的理解问题

做到 `DHR_56` 时，系统已经能让“一名监督者 + 一名执行者”安全完成一个步骤，并在结束后释放真实终端；但并行复核、自动恢复和角色消息还没有接上。你是否接受先把这个“单步骤安全接力”作为一个独立中间验收，再继续做后面的并行复核与恢复？

如果接受，保持八卡拆分；如果不接受，应在正式落盘前把 `DHR_56` 与后续能力重新组合，而不是开工后临场改卡。

用户回答：“接受。”据此保持八卡拆分：`DHR_56` 的单 Node Pair 是独立中间验收，P7 完成仍须 `DHR_57~60` 及新 P7 Gate 全部闭合。

用户随后明文“确认”，授权将候选正式化、机械同步 P8 前置指针与索引并本地提交；不授权创建 DHR_53~60 workspace、启用新 runtime 根、开发、推送或部署。
