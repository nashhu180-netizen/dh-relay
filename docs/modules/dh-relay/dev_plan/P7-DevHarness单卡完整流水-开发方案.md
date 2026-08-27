# P7-通用显式接力基础与单任务实卡 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:planning-event:v1 id=DHR-B-22-P7 stage=B-adjust artifact=dev_plan/P7-DevHarness单卡完整流水-开发方案.md review=../design/evidence/19-PlanHome计划源与运行态续接-交叉审核记录.md#review-b22-p7 understanding=../design/evidence/19-PlanHome计划源与运行态续接-交叉审核记录.md#understanding-b22-p7 -->
<!-- dh:status
汇报: P7 已按 DHR-A-24 / DHR-B-22 调整为独立 PlanHome、YAML RelayPlan 源、受信项目注册、全限定 TaskRef、通用节点与 Result、generation 更新、Pair、Role Relay、Review Batch、恢复和单任务真实链；Core 不读取 DevHarness task_type/Recipe，不建设 DevHarness workflow/adapter
现状: DHR_36~40 已取消；DHR_53 保持进行中，旧实现已由 archive tag/manifest 保留并删除旧 worktree/branch，当前暂停；DHR_54~60 未开始
进行到: P7 ▸ DHR_53 旧现场已退役，等待 P5/P6 前置 Gate、DHR_30 稳定接口和新施工授权
下一步: 项目主线先完成 DHR_30→DHR_31→P6 DHR_32~35；P6 Gate 放行后，从届时精确 master SHA 新建 DHR_53 施工树
看什么: design/10、design/evidence/19、workspace/DHR_53/brief.md、workspace/DHR_53/progress.md
阻塞: P5 尚在 DHR_30、P6 Gate 未通过、DHR_30 稳定接口未进入 master，且 DHR_53 新施工未授权；不得启用 PlanHome 新根
-->

## 0. B 方案审核、理解与确认

### 0.1 这阶段交付什么

P7 先把 dh-relay 的通用承重合同做实，再用一张真实 DevHarness 任务验通。真实任务只是样本，不把 Core 变成 DevHarness 专用执行器，也不把 schema 限制为单任务。

| 任务 | 唯一承接 | 明确不做 |
|---|---|---|
| DHR_53 | 独立 PlanHome、受信项目注册表/local binding、全限定 TaskRef、多 TaskRef RelayPlan/Resolved Plan、通用节点、Run/generation/digest/history | 不读 task_type/Recipe；不做真实跨项目调度 |
| DHR_54 | 通用 Ticket/Receipt/Result/Handoff/Report 与 TaskRef/Attempt/Pair 身份链 | Result 不携带 Plan patch；Decision 不改计划 |
| DHR_55 | Workflow Effect、受影响闭包、外部 B-adjust receipt 校验、generation 激活与显式 `continue` | 不执行业务 B-adjust；activation 不自动 launch |
| DHR_56 | 任意显式节点的 Monitor+Executor Pair 启动、关闭与释放 | 不新增 Decision 角色；不让 Worker 跨节点 |
| DHR_57 | 当前身份的 best-effort Role Relay | 不承担状态推进或授权 |
| DHR_58 | Plan 显式 path set 驱动的通用 Review Batch | 不读取 DevHarness Recipe、不维护业务复核闭集 |
| DHR_59 | Node/Batch/TaskRef set 作用域的停滞、诊断与恢复 | 不自动启动 Decision、不把局部等待当整 Run 停止 |
| DHR_60 | 通用 Plan fixture + 一张真实外部任务的 P7 E2E | 不建 DevHarness workflow/adapter 或换名等价层 |

### 0.2 当前事件

- `DHR-B-19` 的八卡身份与 `DHR_36~40` 取消历史继续保留；与 A23 冲突的单任务、task_type Recipe、业务 node_type 和 DevHarness Adapter 卡面由本事件取代。
- `DHR-B-21` 的唯一 planning input 是 [design/10](../design/10-薄RelayPlan与显式节点边界-产品设计调整.md)。首轮 fresh review 为 `changes-requested`（P0=0、P1=6、P2=3）；修订及三次定向/窄域复审后最终 `approved`（P0=0、P1=0）。完整记录见 [evidence/18](../design/evidence/18-P7P8通用节点与跨项目任务编排-交叉审核记录.md#review-b21-p7)。
- 理解问题中，用户正确回答：不把拆出的 A1/A2 加入当前 RelayPlan 时，当前 generation 不变，A1/A2 不纳入，不受影响的节点继续运行。见 [evidence/18](../design/evidence/18-P7P8通用节点与跨项目任务编排-交叉审核记录.md#understanding-b21-p7)。
- 用户随后明文“更新”，构成 `DHR-B-21` 整版确认，授权更新 P7/P8/README 与 DHR_53 卡面；不授权 DHR_53 archive/ref、重建、施工、PlanHome 初始化、提交或推送。
- 用户随后于 2026-08-27 明文“DHR53 旧实施可以删除了”，单独授权旧现场退役；主会话建立 archive tag/manifest 后删除旧 worktree/branch。该授权不启动新施工。
- `DHR-B-22` 只承接 `DHR-A-24`：DHR_53 冻结 `plans/<plan_id>/plan.yaml` 为唯一计划源、`registry/projects.yaml` 为项目地址簿/policy 指针，涉及项目与引用 DevPlan 均由 TaskRef 派生；runtime 是唯一状态事实，身份绑定 Handoff 可作可读 Markdown 但不另设状态真相。fresh review 无 P0；用户确认主控必须在每次真正拉终端前核验节点前置、binding、policy 与当次 Authority。记录见 [evidence/19](../design/evidence/19-PlanHome计划源与运行态续接-交叉审核记录.md#review-b22-p7)。

## 1. 范围、依赖与批次

- **交付**：独立 PlanHome；`plans/<plan_id>/plan.yaml` 计划源与 `registry/projects.yaml` 受信项目注册；可承载多个 TaskRef 的通用 Plan/Resolved Plan；通用节点与 Result；Plan→Run→generation 不可变历史；Ticket/Pair；Workflow Effect；Role Relay；Review Batch；恢复；一张真实外部任务 E2E。
- **不含**：P8 的真实多任务/跨项目调度与受控 Plan change；P9 的发布迁移；Hook/Outbox/周报；业务仓 `docs/relay`；自动删除/压缩/配额；扩写 P5/P6 或 DHR_30/DHR_31。
- **前置**：P6 Gate 通过并经用户放行；DHR_30 稳定接口进入 master；每卡另行完成开工确认。A23/B21 不反向解锁前置任务。
- **新根闸**：Resolver 迁移验收前，禁止正式 PlanHome start；本计划确认不创建 `plans/registry/archive/runtime/local`。

```text
DHR_30 稳定接口 + P6 Gate
  -> DHR_53 -> DHR_54 -> DHR_55 -> DHR_56
                                      ├-> DHR_57 ───────┐
                                      └-> DHR_58 -> DHR_59
                                                        └-> DHR_60
```

- 批次 1：DHR_53→54，冻结通用 Plan/TaskRef/工件身份合同。
- 批次 2：DHR_55→56，交付第一个真实单 Node Pair。
- 批次 3：DHR_57 与 DHR_58 在 DHR_56 后并行。
- 批次 4：DHR_59→60，完成恢复与单任务实卡 E2E。

## 2. 工程切分与迁移边界

| 单元 | 职责 | 主要落点 | 任务 |
|---|---|---|---|
| plan-resolver | PlanHome、registry/binding、TaskRef、通用 Plan/Resolved Plan、generation snapshot | `relay-core/contracts/`、`relay-core/resolver/`、`relay-core/runtime/` | DHR_53 |
| work-item-contracts | Ticket/Attempt/Pair、Result/Handoff/Report、subject TaskRef set、外部 Authority/B-adjust refs | `relay-core/contracts/`、`relay-core/fixtures/` | DHR_54 |
| workflow-engine | route effect、影响闭包、追加式 supersede、generation activation、显式 continue | `relay-core/workflow/`、Runtime actor 端口 | DHR_55 |
| launcher-pair | 任意 Node 的 Monitor/Executor Pair 与容量释放 | `relay-core/launcher/`、`relay-core/pair/` | DHR_56 |
| role-relay | 当前身份解析与 best-effort prompt | `relay-core/role-relay/` | DHR_57 |
| review-batch | Plan 显式路径、candidate revision、N/A、override、cancel、join | `relay-core/review-batch/` | DHR_58 |
| recovery | deadline、checkpoint、Host Observation、脱敏诊断与替代 Attempt | `relay-core/recovery/`、`relay-core/diagnostics/` | DHR_59 |
| generic-e2e | 通用 Plan fixture、外部项目实卡与独立 Oracle | `relay-core/test/e2e/`、受控外部 fixture | DHR_60 |

旧实现必须按下表清理，不能只换名：

| 旧实现 | 新合同 | 机器闸 |
|---|---|---|
| Run 绑定单一 `task_id` | Run 根绑定 `plan_home_id + plan_id`，generation 保存完整 TaskRef set/digest | 单/多 TaskRef 正反例 |
| Core 读取 task_type/Recipe | Plan 显式 node/path/instruction/route | 生产面静态扫描 + E2E |
| `construction/review/rework` 业务 node_type | 通用 Node + executor binding + result route | 未知业务动作不要求加枚举 |
| `workflows/dev-harness/` | 通用 engine/test/e2e + 外部 Plan fixture | 目录/import/配置键/换名等价扫描为零 |
| Herdr/Host/client adapter | 保留协议边界 adapter | 不得被“零 Adapter”误删 |

P5/P6、DHR_30/DHR_31 的卡面、状态和授权不由本计划改变。DHR_30 只提供 Runtime/RPC/Read Model/Receipt/CLI；DHR_31 只行使 generic `basic-agent-task`；P6 只提供 Profile/Herdr/HostObservation。它们不得倒灌 P7 业务语义。

## 3. 任务表

### 3.1 索引

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位 | task_type | 状态 | 依赖 | 工作区 | 验收时间 / verify SHA | 备注 |
|---|---|---|---|---|---|---|---|---|
| DHR_36 | 历史：DevHarness Contract 与 Gate Adapter | 标准 | 存量未冻结 | 已取消 | | 未创建 | | DHR-B-07 历史；被 DHR-B-19 替代 |
| DHR_37 | 历史：授权、Authority Snapshot 与 Proposal | 标准 | 存量未冻结 | 已取消 | | 未创建 | | DHR-B-07 历史；被 DHR-B-19 替代 |
| DHR_38 | 历史：S0~S3 施工路径 | 标准 | 存量未冻结 | 已取消 | | 未创建 | | DHR-B-07 历史；被 DHR-B-19 替代 |
| DHR_39 | 历史：E0~E10 收口路径 | 标准 | 存量未冻结 | 已取消 | | 未创建 | | DHR-B-07 历史；被 DHR-B-19 替代 |
| DHR_40 | 历史：E11~E13 与真实卡 verify | 标准 | 存量未冻结 | 已取消 | | 未创建 | | DHR-B-07 历史；被 DHR-B-19 替代 |
| DHR_53 | PlanHome、TaskRef、通用 Plan/Node 与 generation 历史 | 标准 | heavy | 进行中 | P6 Gate；DHR_30 稳定接口进入 master；新施工授权 | [`workspace/DHR_53/`](../workspace/DHR_53/) | | 旧实现已归档并删除 worktree/branch；当前未启动新施工 |
| DHR_54 | 通用 Ticket、Receipt、Result/Handoff/Report 身份合同 | 标准 | heavy | 未开始 | DHR_53 | `workspace/DHR_54/`（开工时创建） | | Result/Decision 不改 Plan |
| DHR_55 | Workflow Effect、影响闭包、generation activation 与 continue | 标准 | heavy | 未开始 | DHR_54 | `workspace/DHR_55/`（开工时创建） | | activation 不自动 launch |
| DHR_56 | 任意 Node 的 Monitor+Executor Pair | 标准 | heavy | 未开始 | DHR_55；P6 Herdr/Profile Gate | `workspace/DHR_56/`（开工时创建） | | 第一个真实中间 demo |
| DHR_57 | best-effort Role Relay | 标准 | normal | 未开始 | DHR_56 | `workspace/DHR_57/`（开工时创建） | | 可与 DHR_58 并行 |
| DHR_58 | Plan 驱动的通用 Review Batch | 标准 | heavy | 未开始 | DHR_56 | `workspace/DHR_58/`（开工时创建） | | Core 不读取 Recipe |
| DHR_59 | Node/Batch/TaskRef set 停滞与安全恢复 | 标准 | heavy | 未开始 | DHR_58 | `workspace/DHR_59/`（开工时创建） | | 不自动启动 Decision |
| DHR_60 | 外部项目实卡与 P7 通用 E2E | 标准 | heavy | 未开始 | DHR_57、DHR_59；用户确认真实任务/环境 | `workspace/DHR_60/`（开工时创建） | | 前置全绿后才允许正式新根 start |

> DevPlan 的 `task_type` 只决定 dev-harness 复核配方，不是 dh-relay Core 输入。状态列只使用五枚举；本表不创建目录或授权开工。

### 3.2 任务卡

#### DHR_53 · PlanHome、TaskRef 与通用计划合同

- **目标**：冻结独立 PlanHome、唯一 YAML 计划源 `plans/<plan_id>/plan.yaml`、受信 `registry/projects.yaml`/local binding、`project_ref + devplan_ref + task_id` TaskRef、可含多个 TaskRef 的 RelayPlan/Resolved Plan、通用节点图、`plan_home_id + plan_id` Run 绑定，以及每 generation 的完整 TaskRef set/digest、Resolved Plan digest 与永久历史；项目/DevPlan 概览由 TaskRef 派生，runtime Handoff 仅为身份绑定的可读续接说明。
- **非目标**：不读取 DevHarness task_type/Recipe；不定义业务 node_type；不实现真实跨项目并行调度；不创建正式新根。
- **验收**：**机器证**回连 [design/10](../design/10-薄RelayPlan与显式节点边界-产品设计调整.md) `HC-3AT-A30/A32/A33/A36/A39`：重号 task、未知项目、registry/binding 漂移、workspace 缺失、locator 越界、单 task Run 身份、计划源/派生索引不一致、registry 越权、缺前置/binding/policy/Authority、业务 node_type、task_type/Recipe/workflow 换名适配、历史误计 active/容量均拒绝。**人判**承接 `HC-3AT-H12/H13` 的 PlanHome 基础追溯子集。
- **范围**：`relay-core/contracts/`、`relay-core/resolver/`、`relay-core/runtime/` 精确适配、fixtures/tests；DHR_53 workspace。
- **档位 / 任务类型**：标准 / 重核。<!-- dh:task-type:v1 task=DHR_53 type=heavy -->

#### DHR_54 · 通用 Work Item 与结果合同

- **目标**：冻结 Ticket/Attempt/Pair、`continue` Receipt、Result/Handoff/Report/Attention/Approval 的通用外壳；工作节点绑定一个 TaskRef，控制/决策节点绑定 canonical 非空 `subject_task_refs[]` 与 set digest；账号、模型、推理、权限、fresh 与 route 可机判。
- **非目标**：Result 不携带 Plan patch；Decision Executor 不修改 DevPlan/RelayPlan。
- **验收**：**机器证**回连 design/10 `HC-3AT-A33/A35/A37` 及延续的 `HC-P1-A1/A8`：错 TaskRef/subject set/generation/Attempt/Pair/revision/route、旧身份重放、凭据落盘、Decision 越权均拒绝。
- **范围**：`relay-core/contracts/`、`relay-core/fixtures/`、validator 与负例测试。
- **档位 / 任务类型**：标准 / 重核。<!-- dh:task-type:v1 task=DHR_54 type=heavy -->

#### DHR_55 · Workflow Effect、generation 与显式 continue

- **目标**：由 Workflow Engine 唯一裁决 route effect、节点收口、问题 seed + 显式下游 + 共享消费者的影响闭包、未启动对象追加式 supersede、外部逐项目 B-adjust receipt/result 校验、单次 generation activation 和另一次显式 `continue`。
- **非目标**：不执行业务 B-adjust，不替编排 Agent选择任务，不自动 launch，不改写 active/closed 定义。
- **验收**：**机器证**回连 design/10 `HC-3AT-A34` 及延续的 `HC-3AT-A9/A10/A14/A15/A17`：路径重叠/容量互斥不扩大业务闭包；错 parent digest/CAS/Authority/receipt、并发重放、改 active/closed 均拒绝；外部 B-adjust 成功而 activation 失败时旧 generation 不变、无 Worker 启动、同 request 幂等重试。
- **范围**：`relay-core/workflow/`、Runtime actor 端口、Store 事务和 RPC 窄装配。
- **档位 / 任务类型**：标准 / 重核。<!-- dh:task-type:v1 task=DHR_55 type=heavy -->

#### DHR_56 · 通用 Node Pair

- **目标**：对 Plan 中任意显式节点，经容量预检启动一名 Monitor 与一名 Executor，签发身份票据，durable 收口后撤权、关终端并释放容量；施工、复核、回归、fresh Decision 都使用同一通用机制。
- **非目标**：不新增 Decision Agent 类型；不让 Worker 跨 Node；不凭聊天或 `done` 判完成。
- **验收**：**机器证**回连 design/10 `HC-3AT-A35` 与延续的 `HC-3AT-A1/A4/A5/A12/A27`：重复/部分启动、旧身份迟到、Pair 释放失败、永久目录冒充 live Agent 均按合同处理。**人判**承接 `HC-3AT-H1/H3/H6` 单节点子集。
- **范围**：`relay-core/launcher/`、`relay-core/pair/`、P6 Herdr 窄调用层与 fake adapter 测试。
- **档位 / 任务类型**：标准 / 重核。<!-- dh:task-type:v1 task=DHR_56 type=heavy -->

#### DHR_57 · best-effort Role Relay

- **目标**：按当前有效身份向唯一 Herdr Agent即时转发普通消息，只返回 `sent/target_offline/target_ambiguous/delivery_uncertain`。
- **非目标**：不排队/重投/保存聊天，不生成授权，不改变业务状态。
- **验收**：**机器证**回连 design/10 `HC-3AT-A25`：多 Run 同名、目标替换竞态、offline/ambiguous、sent 无回复和直接 Herdr 调用均不推进 Store。**人判**承接 `HC-3AT-H1` 转发子集。
- **范围**：`relay-core/role-relay/`、Herdr prompt 窄适配、RPC/CLI 与 fake adapter 测试。
- **档位 / 任务类型**：标准 / 常规。<!-- dh:task-type:v1 task=DHR_57 type=normal -->

#### DHR_58 · 通用 Review Batch

- **目标**：只消费 Plan 显式 path set、candidate revision、Executor binding、N/A 依据、override 与 join 规则，原子分配 Batch 并收口路径。
- **非目标**：不读取 task_type/Recipe，不维护 DevHarness 复核路径闭集，不让 Monitor 冒充 reviewer。
- **验收**：**机器证**回连 design/10 `HC-3AT-A37` 及延续的 `HC-3AT-A8/A26/A27/A28`：缺路径、错 revision、施工者自审、Binding 删除路径、fresh 降级、N/A/override 缺依据、半份 Result/Report 均拒绝。**人判**承接 `HC-3AT-H5/H7/H8`。
- **范围**：`relay-core/review-batch/`、workflow/actor/launcher Batch 端口、fixtures 与竞态测试。
- **档位 / 任务类型**：标准 / 重核。<!-- dh:task-type:v1 task=DHR_58 type=heavy -->

#### DHR_59 · 停滞、诊断与安全恢复

- **目标**：按 Node/Batch/TaskRef set 识别未接单、长步骤、人等、宿主故障与真实退出，生成脱敏诊断，CAS 撤权旧 Attempt，Pair 释放后只替代未完成路径；Decision 节点 durable 关闭后不保留 Worker。
- **非目标**：不自动启动 Decision/诊断 Executor，不自动输入，不把一个影响闭包等待误判为整 Run 停止。
- **验收**：**机器证**回连 design/10 `HC-3AT-A34/A35` 及延续的 `HC-3AT-A6/A13/A18/A29`：Result/recovery 单一 CAS 赢家、泄密反例零原文、旧 Pair 未释放无 replacement、无关 Ready 状态不变。**人判**承接 `HC-3AT-H4/H9`。
- **范围**：`relay-core/recovery/`、`relay-core/diagnostics/` 与 Host/workflow/launcher 恢复端口。
- **档位 / 任务类型**：标准 / 重核。<!-- dh:task-type:v1 task=DHR_59 type=heavy -->

#### DHR_60 · 外部项目实卡与 P7 E2E

- **目标**：用通用 Plan fixture 和一张真实 DevHarness 任务跑通显式 Plan、通用 Result、Pair、Review Batch、恢复、fresh Decision 关闭、generation activation 与另一次 continue；补离线跨项目解析反例，并由独立 Oracle 重算。
- **非目标**：不建设 `relay-core/workflows/dev-harness/` 或换名等价层；不禁止合法 Herdr/Host/client adapter；不实现真实两项目同时调度。
- **验收**：**机器证**回连 design/10 `HC-3AT-A32~A37`：移除 DevHarness 仍能执行显式 Plan；生产面零 task_type/Recipe/业务 node_type/DevHarness workflow；Decision durable 关闭；activation 成功未 continue 时零新 Pair。**人判**承接 `HC-3AT-H1~H10` 及 `H11/H12` 的 P7 基础子命题。
- **范围**：`relay-core/test/e2e/`、通用 Plan fixtures、独立 Oracle、现有 CLI/RPC 窄装配与证据目录。
- **档位 / 任务类型**：标准 / 重核。<!-- dh:task-type:v1 task=DHR_60 type=heavy -->

### 3.3 共同收口条件

- `task_type` 仅由 dev-harness 用于复核配方：heavy 五路 + 有效单测，normal 三路 + 有效单测；Core 不得消费。
- 每卡独立 worktree，开工后 worker 先 rebase master；施工者不复核自己的卡。
- 标准档进入待验收前须有需求境证据；高危接线/迁移/新根启用标完成前必须有 `verify(dh-relay):`。
- 密钥、凭据、普通聊天和原始 Pane 文本不得进入工件。

## 4. P7 阶段闸

| ID | 可机判终点 | 承接卡 |
|---|---|---|
| P7-M10 | PlanHome、唯一 YAML 计划源、registry/binding、TaskRef 派生索引、多 TaskRef schema、通用 Node、Run/generation/digest/history，以及开工核验 fail-closed | DHR_53 |
| P7-M11 | 通用 Ticket/Receipt/Result/Handoff/Report 的 TaskRef/Attempt/Pair 身份负例通过 | DHR_54 |
| P7-M12 | 影响闭包、外部 receipt、generation activation 与显式 continue 分责、幂等、无半状态 | DHR_55 |
| P7-M13 | 任意单 Node Pair 可启动、durable 收口、撤权与释放 | DHR_56 |
| P7-M14 | Role Relay 四结果、身份对账与零业务副作用 | DHR_57 |
| P7-M15 | Plan 驱动的通用 Review Batch、revision、N/A、override、cancel、join | DHR_58 |
| P7-M16 | Node/Batch/TaskRef set 停滞、等待、诊断、替代与迟到写拒绝 | DHR_59 |
| P7-M17 | 外部实卡跑通，Decision 关闭，activation 后另一次 continue，新根闸、Oracle 与零 DevHarness workflow/adapter 扫描通过 | DHR_60 |

`P7 Gate = P7-M10~M17 全部通过 + H1~H10 用户签收 + H11~H13 的 P7 基础子命题通过 + 用户明确放行 P8`。P7 Gate 只解除 P8 阶段阻塞，不自动开工 P8。

## 5. DHR_53 旧现场处理

2026-08-27 用户单独授权删除旧实施后，已完成：

1. 重验旧 worktree branch/HEAD/tree/clean/untracked，生成 61 路径 path/blob manifest 和旧 evidence 指针。
2. 为旧 HEAD 建 annotated archive tag并验证 tag object、peeled commit 与 tree。
3. 删除旧 `.dh-worktrees/DHR_53` 和 `wt/DHR_53` 分支；archive tag/manifest 保留，可恢复审计。

以后取得新施工授权且 P5/P6 前置满足后，登记届时精确 master SHA，从该 SHA 新建施工现场；不得写 latest、不得 destructive reset、不得从 archive tag 恢复旧实现继续施工。locator/canonical digest/history 等只能逐项证明后复用，旧通过数和 review 不进入新验收。

## 6. 覆盖、颗粒度与依赖查漏

| 检查 | 结论 |
|---|---|
| 覆盖 | A32/A39→DHR_53/60；A33→DHR_53/54/55；A34→DHR_55/59；A35→DHR_54/56/59/60；A36→DHR_53/58/60；A37→DHR_54/58；A38 在 P7 只做 schema/解析负例，真实跨项目归 P8。H11~H13 先证基础动作分层、PlanHome 追溯与“计划排队、授权开工”，完整跨项目场景归 P8。 |
| 颗粒度 | 每卡一个可独立制造反例和签收的通用承重对象；DHR_60 只做通用装配和 E2E，不吞回前七卡。 |
| 依赖 | `53→54→55→56` 后 `57∥58→59`，最终 `57+59→60`，无环；P5/P6 卡面和授权不变。 |

## 7. 计划完工

- [ ] DHR_53~60 全部销户；DHR_36~40 与旧 DHR_53 实现的 superseded 历史可追溯。
- [ ] P7-M10~M17 及 design/10 的 P7 分账有独立机器证与反例。
- [ ] 一张真实任务完成通用节点、Review Batch、恢复、Decision 关闭与 generation/continue 分层；成功/失败/取消历史永久可查、不可继续。
- [ ] 人验项已展示并签收；P8 是否开工由用户另行明确表态。
- [ ] `dev_plan/README.md` 与 P8 前置指针同步；旧现场退役证据可追溯，未授权的新 worktree/PlanHome/开发动作未提前发生。
