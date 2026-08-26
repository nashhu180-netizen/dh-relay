# P7-DevHarness 单卡显式接力 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:planning-event:v1 id=DHR-B-19 stage=B-adjust artifact=dev_plan/P7-DevHarness单卡完整流水-开发方案.md review=../design/evidence/16-P7薄计划与显式节点实施重拆-交叉审核记录.md#review-b19 understanding=../design/evidence/16-P7薄计划与显式节点实施重拆-交叉审核记录.md#understanding-b19 -->
<!-- dh:status
汇报: P7 已按 design/10 重拆为薄 Plan/Resolver、Ticket 合同、Workflow/Actor、单 Node Pair、Role Relay、Review Batch、恢复与端到端八张卡；旧 DHR_36~40 保留历史并取消
现状: DHR_36~40 已取消（被 DHR-B-19 替代）；DHR_53~60 均未开始；未创建新卡 workspace，未启用 dh_relay/runtime 新根
进行到: P7 ▸ B-adjust 已确认并落盘，等待 P6 Gate、DHR_30 稳定接口进入 master 与逐卡开工确认
下一步: 前置满足后单独分流 DHR_53；每张卡仍须独立确认，不因本计划确认自动开工
看什么: design/10、design/evidence/16、P6 Gate 证据、DHR_30 收口后的 CLI/Read Model 接口
阻塞: P6 Gate 未通过；DHR_30 尚未在 master 收口；DHR_53 尚未取得开工确认
-->

## 0. B 方案审核与理解确认

### 0.1 白话说明：这个阶段做啥、解决啥、做完得到啥

P7 不再按“施工阶段、收口阶段”各包一大坨能力，而是把真正承担风险的八个对象逐个做实。这样出问题时能明确判断是计划解析、票据身份、状态推进、终端启动、普通消息、并行复核还是恢复出了错，也不会把新业务判断塞回 DHR_30。

| 任务 | 用业务语言说在做啥 | 解决什么问题 | 做完预期效果 |
|---|---|---|---|
| DHR_53 | 把一份很薄的接力路线展开成这次真正要跑的步骤，并钉住 Plan、任务与快照指纹 | Plan 不复制 DevPlan，运行结束后仍能说清当时按哪份计划跑 | 同一 Plan 可多次运行；每个 Run 可追溯，历史不改写、不自动删除 |
| DHR_54 | 冻结 Ticket、控制回执及 Result/Handoff/Attention/Approval 等正式工件 | 防止旧 Agent、错节点、错运行或伪造结果混入 | 每次接棒的身份、权限和停止点都能机判，错绑稳定拒绝 |
| DHR_55 | 建立唯一决定“现在能不能推进”的 Workflow Engine，并让 actor 只按命令原子落账 | 避免 CLI、Launcher、Agent 各自改状态，出现半关闭或重复启动 | 一次 `continue` 只产生一个合法下一步，节点收口事实同生同灭 |
| DHR_56 | 把一个步骤安全拉成“一名监督者 + 一名执行者”，完成后关闭终端并释放容量 | 解决外部 Agent 重复拉起、关不干净或占槽位 | 能真实完成一个显式 Node；永久历史目录不会冒充活 Agent 占容量 |
| DHR_57 | 按当前身份即时转发三类角色的普通消息 | 避免猜 Pane，同时避免聊天变成第二套状态机 | 消息只有四种明确结果，永远不能直接推进 Run |
| DHR_58 | 一次启动代码轮2、需求、一致性、教训四路复核并正确汇合 | 解决串行慢、漏一路误放行、Monitor 替换后串线 | 全部必做路径合法结束后才出现下一步，用户例外不冒充通过 |
| DHR_59 | 区分未接单、正常长步骤、等人、宿主故障和真实退出，再安全换新 Agent | 解决卡住时只能看终端猜原因、旧新 Agent 同时写结果 | 留下脱敏诊断，只恢复未完成部分，旧身份迟到写入被拒绝 |
| DHR_60 | 把前七卡接成一张真实 DevHarness 标准卡 | 解决各组件单测通过但整条业务链仍接不起来 | 显式节点、并行复核、恢复、角色消息和永久历史形成可签收的 P7 结果 |

### 0.2 审核、问答与确认

- **事件**：`DHR-B-19`。唯一规划输入为 [design/10](../design/10-薄RelayPlan与显式节点边界-产品设计调整.md)，不把旧 P7、records、evidence 或历史设计当任务终点来源。
- **fresh 审核**：首轮 `changes-requested`，0 Blocker、2 High、2 Medium、1 Low；主会话全部采纳。补齐 `continue` request/Receipt、Orchestrator Lease、active P7 Gate、A20/A22 superseded 边界及两类 Oracle 区分后，定向复审为 `approved`，0 Blocker/High/Medium。完整记录见 [evidence/16](../design/evidence/16-P7薄计划与显式节点实施重拆-交叉审核记录.md#review-b19)。
- **理解问题**：DHR_56 做完时只有“单步骤安全接力”，尚无并行复核、自动恢复和角色消息，是否接受先作为独立中间验收？
- **用户回答**：“接受。”因此保持八卡拆分；DHR_56 可独立验收，但不等于 P7 完成。
- **最终确认**：用户随后明文“确认”，授权按本方案更新 P7、索引和 P8 前置指针并本地提交；不授权创建 DHR_53~60 workspace、启用新 runtime 根、开发、推送或部署。

## 1. 范围、依赖与批次

- **交付**：薄 Plan/Resolver；Plan→Run→generation 关联；永久 runtime 历史；Ticket/Receipt/Lease 和正式工件合同；Workflow/Actor 单写边界；单 Node Pair；best-effort Role Relay；Review Batch；停滞恢复；一张真实标准卡端到端验收。
- **不含**：P8 的多卡、卡内重编排、通用 Diagnoser、Hook/Outbox、run 级归档与跨卡 Oracle；P9 的 Linux 双平台定型、发布升级和最终迁移；自动删除/压缩/配额；扩写 DHR_30 当前卡。
- **前置**：P6 Gate 通过并经用户放行；DHR_30 的 CLI/Read Model 稳定接口收口并进入 master；每张新卡另行完成入口分流与用户确认。
- **新根闸**：DHR_53 只在 fixture/受控测试中实现新根与 Resolver；DHR_60 前置全绿前，禁止正式 `dh_relay/runtime/` start。

```text
DHR_30 稳定接口/收口 + P6 Gate
  -> DHR_53 -> DHR_54 -> DHR_55 -> DHR_56
                                      ├-> DHR_57 ───────┐
                                      └-> DHR_58 -> DHR_59
                                                        └-> DHR_60
```

- **批次 1**：DHR_53→54，交付“计划可确定性展开、票据可稳定验真”的离线合同，不启动真实 Agent。
- **批次 2**：DHR_55→56，交付第一个可演示中间成果——单 Node Monitor+Executor Pair 安全接力。
- **批次 3**：DHR_57 与 DHR_58 在 DHR_56 后并行；普通消息不是 Review Batch 的业务依赖。
- **批次 4**：DHR_59→60；恢复不依赖普通聊天，最后再开放真实新根并跑标准卡整链。

## 2. 工程切分与硬边界

| 实现单元 | 职责 | 主要落点 | 任务 |
|---|---|---|---|
| plan-resolver | 薄 Plan/Resolved Plan、task_type Recipe、根发现、Plan/Run/generation 关联 | `relay-core/contracts/`、`relay-core/resolver/`、`relay-core/runtime/` 窄适配 | DHR_53 |
| work-item-contracts | Ticket、`continue` Receipt、Orchestrator Lease、Result/Handoff/Report/Attention/Approval/Role Relay schema | `relay-core/contracts/`、`relay-core/fixtures/` | DHR_54 |
| workflow-engine | 唯一业务转换、guard、CAS、单 Node continue/收口、Lease 生命周期 | `relay-core/workflow/`、Runtime actor 端口 | DHR_55 |
| launcher-pair | 外部终端启动、Monitor/Executor Pair、容量与资源释放 | `relay-core/launcher/`、`relay-core/pair/` | DHR_56 |
| role-relay | 当前身份解析与 Herdr prompt best-effort 转发 | `relay-core/role-relay/` | DHR_57 |
| review-batch | Batch 分配、路径结果、N/A、Approval override、取消、join、revision | `relay-core/review-batch/` | DHR_58 |
| recovery | deadline、checkpoint、Host Observation、脱敏诊断、Attempt 替代 | `relay-core/recovery/`、`relay-core/diagnostics/` | DHR_59 |
| devharness-e2e | workspace/task_type 适配、CLI/RPC 窄装配、独立单卡 oracle 与真实证据 | `relay-core/workflows/dev-harness/`、`relay-core/test/e2e/` | DHR_60 |

硬边界：

1. DHR_30 继续只负责其既有 CLI、客户端中立 Read Model 与可选 Bridge 接缝；新卡只消费稳定接口。若后续需要兼容变化，由对应新卡记录，不回写或扩大旧卡。
2. Workflow Engine 唯一判断业务转换；HostSessionActor 只做 schema/身份/guard/CAS 与物理持久化；CLI、Launcher、Role Relay 不直写 Store。
3. DHR_59 只做节点级停滞检测与恢复，不提前实现 P8 的通用诊断 Agent、选项治理或自动修复。
4. DHR_60 的单卡独立 E2E oracle 必做；它不同于 P8 的跨卡、归档、Outbox Oracle。
5. `DHR_55/DHR_56` 是本事件重新定义的新范围，不继承旧候选或口头草案中的同号范围。

## 3. 任务表

### 3.1 索引

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位 | task_type | 状态 | 依赖 | 计划工作区 | 验收时间 / verify SHA | 备注 |
|---|---|---|---|---|---|---|---|---|
| DHR_36 | 历史：DevHarness Contract 与 Gate Adapter | 标准 | 存量未冻结 | 已取消 | | 未创建 | | DHR-B-07 历史；被 DHR-B-19 替代 |
| DHR_37 | 历史：授权、Authority Snapshot 与 Proposal | 标准 | 存量未冻结 | 已取消 | | 未创建 | | DHR-B-07 历史；被 DHR-B-19 替代 |
| DHR_38 | 历史：S0~S3 施工路径 | 标准 | 存量未冻结 | 已取消 | | 未创建 | | DHR-B-07 历史；被 DHR-B-19 替代 |
| DHR_39 | 历史：E0~E10 收口路径 | 标准 | 存量未冻结 | 已取消 | | 未创建 | | DHR-B-07 历史；被 DHR-B-19 替代 |
| DHR_40 | 历史：E11~E13 与真实卡 verify | 标准 | 存量未冻结 | 已取消 | | 未创建 | | DHR-B-07 历史；被 DHR-B-19 替代 |
| DHR_53 | 薄 Plan/Resolver、永久历史与 Plan-Run 关联 | 标准 | heavy | 未开始 | P6 Gate；DHR_30 稳定接口进入 master | `workspace/DHR_53/`（开工时创建） | | blocked-by-phase-gate:P6；新根 start 禁用 |
| DHR_54 | Ticket、控制回执、Lease 与正式工件合同 | 标准 | heavy | 未开始 | DHR_53 | `workspace/DHR_54/`（开工时创建） | | 不实现业务推进 |
| DHR_55 | Workflow Engine、Lease 生命周期与 Actor 命令边界 | 标准 | heavy | 未开始 | DHR_54 | `workspace/DHR_55/`（开工时创建） | | 新窄范围，不继承旧候选 |
| DHR_56 | Launcher 与单 Node Monitor+Executor Pair | 标准 | heavy | 未开始 | DHR_55；P6 Herdr/Profile 闸 | `workspace/DHR_56/`（开工时创建） | | P7 第一个真实中间 demo |
| DHR_57 | best-effort Role Relay | 标准 | normal | 未开始 | DHR_56 | `workspace/DHR_57/`（开工时创建） | | 可与 DHR_58 并行；触及身份/权限则停下重定类 |
| DHR_58 | Review Batch、N/A、用户例外、取消与 join | 标准 | heavy | 未开始 | DHR_56 | `workspace/DHR_58/`（开工时创建） | | 可与 DHR_57 并行 |
| DHR_59 | 停滞检测、脱敏诊断与安全恢复 | 标准 | heavy | 未开始 | DHR_58 | `workspace/DHR_59/`（开工时创建） | | 不依赖 Role Relay |
| DHR_60 | DevHarness 适配与 P7 端到端验收 | 标准 | heavy | 未开始 | DHR_57、DHR_59；用户确认真实任务与环境 | `workspace/DHR_60/`（开工时创建） | | 前置全绿后才允许正式新根 start |

> 本表只创建计划卡身份，不创建目录。状态列只用五枚举；阶段闸与说明只写备注。每张卡开工时把计划工作区改为真实链接。

### 3.2 任务卡

#### DHR_53 · 薄 Plan、Resolver 与运行历史关联

- **目标**：冻结版本化 RelayPlan/Resolved Plan；确定性读取 DevPlan 任务行、`task_type`、workspace 静态输入、Git/worktree 与 Profile registry，展开唯一 node/依赖/Recipe/applicability/mode；消费 DHR_30 稳定的旧根只读发现/Read Model 接缝，增加新根路由、Run 根不可变 `plan_id + task_id`、generation `resolved_plan_digest`、永久保留与 history/active 区分。
- **非目标**：不实现 `continue`、Ticket 派发、外部 Agent、Review Batch、删除/压缩/配额；不修改 DHR_30 卡或 worktree。
- **验收**：机器证回连 [design/10](../design/10-薄RelayPlan与显式节点边界-产品设计调整.md) `HC-3AT-A19/A21/A23/A30/A31`；坏计划、缺 workspace、路径越界、Recipe 缺路/非法降级、错 Plan/Task/digest、旧根写入、历史误计 active/容量、自动删除均有反例。同一 Plan 两次运行产生不同 Run，旧 generation 不改写。人判承接 `HC-3AT-H5/H10` 的计划与历史子集。
- **范围**：`relay-core/contracts/` 的 Plan/Resolved Plan/关联 schema；新建 `relay-core/resolver/`；`relay-core/runtime/` 精确根与关联适配；fixtures/tests；必要的 `.gitignore` 断言。
- **档位 / 工作区**：标准；`workspace/DHR_53/`。
- **任务类型**：重核 <!-- dh:task-type:v1 task=DHR_53 type=heavy -->

#### DHR_54 · Ticket 与正式工件合同

- **目标**：冻结 Work Item/Monitor Ticket、`continue` request/Receipt、Orchestrator Lease、Result、Handoff、Report、Attention、Approval、Role Relay request/snapshot/result 与节点状态枚举的版本化 schema、JCS digest、身份链、能力、过期和停止点。
- **非目标**：不决定下一节点、不写 Store、不启动 Agent、不投递聊天。
- **验收**：机器证回连 design/10 `HC-3AT-A2/A7/A11`、`HC-P1-A1/A8` 与 `HC-3AT-A24` 票据子命题；缺/未知字段、旧 generation、错 node/pair/attempt/agent/batch/revision/HEAD/digest、过期 Ticket/Lease、错 expected state、request ID 冲突、凭据/原始聊天入工件均拒绝；同一 `continue` 重放只引用同一 Receipt。
- **范围**：`relay-core/contracts/`、`relay-core/fixtures/`、独立 validator 与契约负例测试。
- **档位 / 工作区**：标准；`workspace/DHR_54/`。
- **任务类型**：重核 <!-- dh:task-type:v1 task=DHR_54 type=heavy -->

#### DHR_55 · Workflow Engine 与 Actor 命令边界

- **目标**：从权威 Read Model 计算 `continue`、单 Node 收口、授权与稳定拒绝，消费 DHR_54 合同，生成带 expected generation/state、幂等 request ID 和 guard 的业务命令；通过既有 Runtime HostSessionActor 原子落账；由 Runner 管理 run-scoped Orchestrator Lease 生命周期。
- **非目标**：不拉终端、不让 CLI/Launcher/Agent 写 Store，不实现 Batch、Role Relay 或停滞探测。
- **验收**：机器证回连 design/10 `HC-3AT-A9/A10/A14/A15/A17`、`HC-P1-A2/A5` 与 `HC-3AT-A24/A31` 状态转换子命题；`no_ready/ambiguous_ready/stale_generation`、重放同 Receipt、final Result/Handoff/node_closed/next_ready 原子同生同灭、无效 Lease/Worker continue、Plan/Task/digest 错绑均拒绝，actor 不自行作业务裁决。
- **范围**：新建 `relay-core/workflow/`；Runtime 命令/actor 端口和 Store 事务测试；必要 RPC 装配。
- **档位 / 工作区**：标准；`workspace/DHR_55/`。
- **任务类型**：重核 <!-- dh:task-type:v1 task=DHR_55 type=heavy -->

#### DHR_56 · Launcher 与单 Node Pair

- **目标**：消费 durable launch intent，容量预检后经 P6 Herdr Adapter 启动/确认一个 Monitor 与一个 Executor；签发 Ticket，绑定 Host Observation，处理 launch failure、正常退出、强停、撤权和 `pair_release_pending/failed`，确保每个角色至多一个 active 身份。
- **非目标**：不做多 Reviewer Batch、Role Relay、聊天/`done`完成推断或超时替代恢复。
- **验收**：机器证回连 design/10 `HC-3AT-A1/A4/A5/A12/A14/A27`、`HC-3AT-A24` launcher 子命题与 `HC-CTRL-H4/H12`；容量不足零分配、重复 launch 不增 Pair、部分启动可恢复、旧身份迟到拒绝、final commit 后撤权再关终端、永久 runtime 不占容量。人判承接 `HC-3AT-H1/H3/H6` 单节点子集。
- **范围**：新建 `relay-core/launcher/`、`relay-core/pair/`；P6 Herdr 窄调用层；Host/Store/RPC 与 fake adapter 测试。
- **档位 / 工作区**：标准；`workspace/DHR_56/`。
- **任务类型**：重核 <!-- dh:task-type:v1 task=DHR_56 type=heavy -->

#### DHR_57 · best-effort Role Relay

- **目标**：从有效 Ticket 或 Orchestrator Lease 解析 source/target，向唯一当前 Herdr Agent 即时 prompt，只返回 `sent/target_offline/target_ambiguous/delivery_uncertain`，前后对账 Host generation 与 Agent identity。
- **非目标**：不排队、重投、保存普通聊天、解释内容、生成授权、改变业务状态或开放 send-keys 绕过。
- **验收**：机器证回连 design/10 `HC-3AT-A3/A25`；多 Run 同名、裸 executor 多实例、offline/ambiguous、working/idle/blocked、过期 Ticket/Lease、替换竞态、`sent` 无回复与直接 Herdr 调用均有 oracle，Store 业务状态零变化。人判承接 `HC-3AT-H1` 转发子集。
- **范围**：新建 `relay-core/role-relay/`；Herdr prompt 窄适配；RPC/CLI 窄入口与 fake adapter 测试。
- **档位 / 工作区**：标准；`workspace/DHR_57/`。
- **任务类型**：常规 <!-- dh:task-type:v1 task=DHR_57 type=normal -->
- **复核配方边界**：代码轮1、需求、教训三路 + 有效单测；若施工发现必须改变身份/权限合同，立即停下由用户重定类为 heavy，不能现场自升级。

#### DHR_58 · Review Batch、N/A 与用户例外

- **目标**：代码轮1及整改闭合后，以一次 CAS 分配父 Batch、一个 Monitor 与全部适用 Reviewer intents；实现 Result+Report 成对收口、N/A、`path_user_overridden`、整批取消、revision 失效、join 与 capacity guard。真实停滞检测/替代由 DHR_59 承接。
- **非目标**：不把 Monitor 当第五路结论、不删必做路径、不依赖 Role Relay、不做停滞诊断。
- **验收**：机器证回连 design/10 `HC-3AT-A4/A5/A8/A26/A27/A28`；Batch 全有或全无、部分路径不放行、N/A 缺依据拒绝、Result/Report 半份不 terminal、override 只产生 `proceeded_with_user_override`、cancel/join/Result/launch 竞态固定、新 revision 使旧批次失效。人判承接 `HC-3AT-H5/H7/H8`。
- **范围**：新建 `relay-core/review-batch/`；扩展 workflow 命令、actor 事务与 launcher Batch intents；Batch/Path/Approval fixtures 和竞态测试。
- **档位 / 工作区**：标准；`workspace/DHR_58/`。
- **任务类型**：重核 <!-- dh:task-type:v1 task=DHR_58 type=heavy -->

#### DHR_59 · 停滞检测、诊断与安全恢复

- **目标**：执行 `start_deadline/checkpoint_deadline`；综合 `node_started`、checkpoint、Host Observation 区分未接单、长步骤、人等、宿主不可达、probe error 与真实退出；生成白名单→脱敏→UTF-8 限长诊断，CAS 撤权旧 Attempt，等 Pair 释放后为单 Node 或 Batch 未完成路径签发新 Attempt。
- **非目标**：不凭聊天/屏幕静默/`done`判完成，不自动输入，不重跑已 terminal 路径，不依赖 Role Relay，不做 P8 通用 Diagnoser。
- **验收**：机器证回连 design/10 `HC-3AT-A6/A13/A18/A29`、`HC-P1-A6`、`HC-CTRL-H7/H12` 与 `HC-3AT-A26` 恢复子命题；Result/recovery 只有一个 CAS 赢家、人等暂停、泄密反例零原文、旧 Pair 未释放无 replacement、Crash 后只恢复一个合法身份、Batch 只恢复未完成路径。人判承接 `HC-3AT-H4/H9`。
- **范围**：新建 `relay-core/recovery/`、`relay-core/diagnostics/`；Host observation、workflow/actor/launcher 恢复端口；时间、竞态、脱敏与 crash fixtures。
- **档位 / 工作区**：标准；`workspace/DHR_59/`。
- **任务类型**：重核 <!-- dh:task-type:v1 task=DHR_59 type=heavy -->

#### DHR_60 · DevHarness 适配与 P7 端到端验收

- **目标**：以当前 dev-harness `task_type`/workspace 合同生成真实薄 Plan，接通现有 DHR_30 CLI/Read Model 与 DHR_53~59；用用户开工时另选的真实标准任务完成 construction→显式收口→Review Batch→必要恢复→最终交付/verify，并另造失败、取消和终态历史场景。前置全绿后才允许正式新根 start。
- **非目标**：不做 P8/P9 能力，不重建 DHR_30 Read Model，不自动删除 runtime，不在本计划确认时预建真实任务 workspace。
- **验收**：回连 design/10 `HC-3AT-A16` 与 `HC-3AT-H1~H10` 的整链前置；重放 active `A1~A19、A21、A23~A31`，A20/A22 只证 superseded 语义不回流。整链对证 `HC-P1-A1/A2/A5/A6/A8` 与 `HC-CTRL-H1/H2/H3/H4/H6/H7/H8/H10/H11/H12`，不改变分卡主承接；`HC-CTRL-H9` 留 P9 DHR_46。人判按 H1~H10 逐项展示并等用户签收。
- **范围**：新建 `relay-core/workflows/dev-harness/` 与独立 E2E fixture/oracle；扩展现有 CLI/RPC 的 `continue/attention/approve/role-relay` 窄装配；`relay-core/test/e2e/` 与本卡证据目录。
- **档位 / 工作区**：标准；`workspace/DHR_60/`。
- **任务类型**：重核 <!-- dh:task-type:v1 task=DHR_60 type=heavy -->

### 3.3 新卡共同收口条件

- heavy：代码轮1及必要整改闭合后，代码轮2、需求、一致性、教训进入同一 Review Batch；有效单测必做。normal：代码轮1、需求、教训三路 + 有效单测。具体 execution mode 由开工时冻结的 registry 决定，不能降级或删路径。
- 每卡一个独立 worktree；workspace 只在该卡逐卡确认开工后创建。施工者不复核自己的卡。
- 标准档进入待验收前须有需求境证据；真实 Agent/CLI/终端交互必须提供可复查操作路径与证据，不能只报单测。
- 高危性质的组件接线、迁移、新根启用在“完成”前必须有 `verify(dh-relay):`；用户不得由 Agent 代签。
- 密钥、凭据、普通聊天和原始 Pane 文本不得进入工件；诊断证据先白名单、脱敏、限长。

## 4. P7 新阶段闸

### 4.1 核心机器闸

| ID | 可机判终点 | 承接卡 |
|---|---|---|
| P7-M10 | 薄 Plan/Resolver、task_type Recipe、新旧根、永久历史与 Plan→Run→generation 关联全部 fail-closed | DHR_53 |
| P7-M11 | Ticket、`continue` request/Receipt、Orchestrator Lease 与正式工件 schema/身份/digest 负例通过 | DHR_54 |
| P7-M12 | Workflow Engine 唯一裁决、actor 只按 guard 落账；单 Node `continue`/收口幂等且无半状态 | DHR_55 |
| P7-M13 | 单 Node Pair 可真实启动、收口、撤权与释放；永久目录不占容量 | DHR_56 |
| P7-M14 | Role Relay 四结果枚举、身份对账与零业务副作用成立 | DHR_57 |
| P7-M15 | Review Batch 原子分配、路径收口、N/A、用户例外、取消、revision 与 join 成立 | DHR_58 |
| P7-M16 | 启动/进展时限、五类停滞、脱敏诊断、单 Node/Batch 安全替代及竞态恢复成立 | DHR_59 |
| P7-M17 | 一张真实标准卡跑通 active A/H；三类终态历史永久可查不可继续；新根启用闸和独立 E2E oracle 通过 | DHR_60 |

### 4.2 人类闸与解锁 P8

- DHR_60 按 design/10 `HC-3AT-H1~H10` 提供一份逐项操作与证据索引，用户逐项签收。
- `P7 Gate = P7-M10~M17 全部通过 + H1~H10 用户签收 + 用户明确放行 P8`。
- P7 Gate 通过前，P8 `DHR_41~45` 继续保持 `blocked-by-phase-gate:P7`。

## 5. 历史保留与后续阶段

- `DHR_36~40` 与 `P7-M1~M9` 是 `DHR-B-07` 的历史路线，状态为已取消，不删除、不复用、不再解锁 P8。其完整旧卡面仍可由 Git 历史恢复。
- P8 `DHR_41~45` 的多卡、重编排、通用诊断、Outbox、归档/Oracle范围不变；只把 P7 前置明确指向本计划新 Gate。
- P9 `DHR_46~48` 范围、顺序和阶段闸不变；`HC-CTRL-H9` Linux 无 GUI 全链仍由 DHR_46 承接。
- DHR_30 当前 worktree、卡面和验收不因本计划改变；新卡不得把 Workflow、Pair、Launcher、Review Batch、Role Relay、Resolver 或恢复塞回 DHR_30。

## 6. 覆盖、颗粒度与依赖查漏

| 检查 | 结论 |
|---|---|
| 覆盖 | DHR_53=A19/A21/A23/A30/A31；DHR_54=A2/A7/A11+P1-A1/A8；DHR_55=A9/A10/A14/A15/A17+A24/A31状态转换+P1-A2/A5；DHR_56=A1/A4/A5/A12/A27单节点+A24启动；DHR_57=A3/A25；DHR_58=A8/A26/A27批次/A28；DHR_59=A6/A13/A18/A29+A26恢复+P1-A6；DHR_60=A16及整链人验/回归。A20/A22 不作 active 承接，CTRL-H9 留 P9。 |
| 颗粒度 | 每张卡对应一个可独立制造反例和签收的承重对象；DHR_60 只做适配/整链，不吞回前七卡实现。 |
| 依赖 | `53→54→55→56` 后 `57∥58→59`，最终 `57+59→60`，无环；59 不依赖普通聊天；P8/P9 边界不前移。 |

## 7. 计划完工

- [ ] DHR_53~60 全部销户；DHR_36~40 历史取消事实保持。
- [ ] P7-M10~M17 全部有独立机器证，active A/H 与 legacy 分阶段验收无漏项。
- [ ] 一张真实标准卡完成显式节点、Review Batch、恢复、Role Relay 和最终 verify；成功/失败/取消历史均永久可查、不可继续。
- [ ] H1~H10 已向用户逐项展示并签收；P8 是否解锁由用户另行明确表态。
- [ ] `dev_plan/README.md` 与 P8 前置指针已同步；未授权的 workspace/runtime/开发动作未提前发生。
