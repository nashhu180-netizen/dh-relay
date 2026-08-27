# DHR-B-21：P7/P8 通用节点与跨项目任务编排调整候选

> 状态：历史候选 · 已于 2026-08-27 经用户明文“更新”完成整版确认并晋升正式 DevPlan。正式权威现为 P7、P8、`dev_plan/README.md` 与 DHR_53 workspace 卡面；本文件保留提案和裁决历史。首轮 fresh B-review 的问题已修订，两次定向复审及 P5/P6 兼容边界窄审最终 `approved`（P0=0、P1=0），用户理解问答已通过。该确认不授权创建 archive ref、清理或重建 DHR_53、初始化 PlanHome、施工、提交或推送。

## 1. 为什么 P7 和 P8 必须一起调整

最新产品口径不是“单卡 Run 增加返修”，而是：一份 RelayPlan 可以承载多个 DevPlan 业务任务，任务可以跨 DevPlan、跨项目；节点绑定全限定 TaskRef；任务拆分后，编排 Agent先执行外部 B-adjust，再决定新任务是否加入当前 RelayPlan；只冻结受影响任务及依赖闭包，其他 Ready/active 节点继续。

因此不能只改 P7：

- P7 要先建立不排斥多任务/跨项目的承重合同、独立 PlanHome、TaskRef、通用节点和 generation 更新语义，并用一张真实任务跑通基础接力。
- P8 才实现同一 RelayPlan 内真实多任务/跨项目调度、影响闭包重编排、诊断选择和跨项目 E2E。
- P8 现有“不做跨仓 Run”“重编排不许加卡/换卡”与新口径直接冲突，必须由同一次 B-adjust 改写，不能只做文字解释。

阶段边界仍保持简单：P7 冻结可扩展合同并完成单任务真实链；P8 消费该合同完成真实多任务与跨项目能力。P7 不提前吞并 P8 调度器，P8 不再重新发明第二套 Plan/Task 身份。

### 1.1 P5/P6 与 DHR_30/DHR_31 的影响边界

本次 B-adjust 不修改 P5/P6 的任务拆分、目标、验收、依赖、状态或开工授权：DHR_30 继续在既有授权内施工，DHR_31 仍未开始；P6 的 DHR_32~35 仍受 P5 阶段闸阻塞。P7 继续依赖 P6 Gate 和 DHR_30 稳定接口，A23/B21 不反向解锁任何前置任务。

它们不是“毫无关系”，而是受以下兼容边界约束：

- DHR_30 只冻结 Runtime service/RPC、客户端中立 Read Model、控制 Receipt 与 CLI/Bridge；不得承接 PlanHome、Resolver、Workflow Effect、Pair、Review Batch、Role Relay 或 DevHarness 业务语义。现场扫描未发现 `task_id`、`task_type`、业务 `node_type` 或 `workflows/dev-harness` 进入 `relay-core` 生产合同；示例里的 `review3` 只是自由 node_id，不是 Core 枚举。
- DHR_31 只用无 DevHarness 的 `basic-agent-task` 行使 P5 通用 Runtime/图校验与 Process 闭环；不冻结 P7 的 RelayPlan、TaskRef、generation 更新或节点 route 语义。
- P6 只提供 Profile、Herdr Executor、身份/额度和 HostObservation；宿主观测不得成为节点业务完成事实，也不得根据施工/复核等工作内容派生 Core 类型。
- 若施工/收口发现 P5/P6 的既有验收必须改变，须单独走相应 B-adjust；本事件不能静默改写前置计划。

## 2. DHR_53 现役施工如何处理

首轮 B-review 复核时的现场事实为：master HEAD `d6d65d63e1619140f68c0087c394ad1baf61127f`；DHR_53 worktree 分支 `wt/DHR_53`，HEAD `fec9ec1bbbab90813d7d3f3aad1dc847c317ca81`，tree `6452aebbab080ea6002ddd749b6cbc8061352744`，`git status --porcelain=v1 --untracked-files=all` 为空。其中 `b619e4ae72e3f910b8dcda4908e71e6c927200af`、`cb8a91136ab7ebcbe2f67e9085178c16ceaffcc3` 等提交实现了单业务仓、单 `task_id` Run Binding、DevHarness `task_type` Recipe 与 `construction/review/rework` 业务 `node_type`，与正式 A23 冲突。

处理分为两个授权层次：

1. **本次 B-adjust 获整版确认后**：只更新正式 P7/P8、`dev_plan/README.md`、B 审核留痕，并机械同步 DHR_53 的 brief/task_plan/progress/findings，使工作区明确标记 `superseded-by-DHR-A-23` 和新的验收边界；不创建 Git ref、不动旧工作树、不恢复施工。
2. **以后取得 DHR_53 恢复/重建授权后**：
   - 再次记录旧 worktree 的 branch、完整 HEAD、tree、clean/untracked 状态，生成确定性的 path/blob manifest，并列出旧 fixture、测试、review、evidence 与 workspace 指针；
   - 为旧 HEAD 创建受保护且可验证 peeled commit 的 archive ref/tag，复核 ref、tag object、commit 与 manifest 一致后，将旧 worktree 隔离为只读审计现场；
   - 明确记录重建采用的精确 master SHA；不得写“latest master”，也不得用 destructive reset 改造旧树；
   - 从该精确 SHA 新建 DHR_53 施工现场。locator、canonical digest、history 等能力只能逐项证明后复用，旧通过数和旧 review 不计入新验收；
   - 新现场验证完成且另有清理授权后，才可退役旧 worktree。archive ref 与 manifest 继续保留。

这仍是原 DHR_53 返修重做，不新增“补丁卡”掩盖需求变化；B-adjust 确认本身不等于上述 Git 操作或开发重启授权。

## 3. P7 八卡的最小调整

P7 的目标改为“冻结通用、可承载多 TaskRef 的基础合同，并用一张真实 DevHarness 任务跑通”。单任务 E2E 只是本阶段测试样本，不是 schema 的单任务限制。

| 任务 | 调整后的唯一承接 | 明确不做 |
|---|---|---|
| DHR_53 | 独立 PlanHome 发现与安全边界；`project_ref + devplan_ref + task_id` TaskRef；可含多个 TaskRef 的 RelayPlan/Resolved Plan schema；通用节点图与执行绑定；Run 根 `plan_home_id + plan_id`；generation 的完整 TaskRef set/digest、Resolved Plan digest 与永久历史 | 不读 task_type/Recipe；不定义业务 node_type；不实现真实跨项目并行调度 |
| DHR_54 | Ticket/Receipt/Result/Handoff/Report 的通用身份封套；每个工作节点绑定一个 TaskRef，控制/决策节点统一绑定 canonical 非空 `subject_task_refs[]` 与 set digest；外部 Authority/B-adjust receipt 只作引用；账号、模型、推理、权限和 fresh 绑定可机判 | Result 不携带 Plan patch；Decision Executor 不修改 DevPlan/Plan |
| DHR_55 | Workflow Engine 的通用 route 效果、节点收口、generation 激活与显式 `continue`；校验外部逐项目 B-adjust receipt/result 与 Authority ref；以 parent digest/CAS/request ID 追加 TaskRef/Node、supersede 未启动节点并保持 closed/active 不变；按显式下游依赖唯一计算受影响闭包并保持无关节点状态 | 激活不自动 launch；程序不执行外部 B-adjust，也不替编排 Agent选择业务任务 |
| DHR_56 | 对任意显式节点启动、关闭并释放 Monitor+Executor Pair；包括施工、复核、回归和 fresh 决策节点 | 不新增 Decision 逻辑角色；不把施工会话变复核会话 |
| DHR_57 | 继续作为当前身份的 best-effort Role Relay | 不承担 Plan 更新、业务授权或状态推进 |
| DHR_58 | 通用 launch group/Review Batch；路径、candidate revision、绑定和 join 都来自 Plan；N/A、override、cancel 与恢复边界保持 | 不读取 DevHarness Recipe；不维护 review path 业务闭集 |
| DHR_59 | 节点/Batch/TaskRef set 作用域的停滞识别与恢复；区分某影响闭包等待编排动作和整 Run 停止；Decision 节点 durable 关闭后不保留 Worker | 不把一个任务等待误判为整个 Run 无事可做；不自动启动诊断/决策 Agent |
| DHR_60 | “外部项目实卡接力与 P7 端到端验收”：用独立 PlanHome、通用 Plan fixture 和一张真实 DevHarness 任务验证显式 Plan、通用 Result、Pair、Review Batch、恢复、决策关闭、generation 激活与另一次 continue；生产面扫描证明零 DevHarness workflow/adapter、零业务 node_type | 不建设 `relay-core/workflows/dev-harness/` 或换名等价层；不禁止 Herdr/Host/client 等合法边界 adapter；不以单任务样本限制多 TaskRef schema |

DHR_53→60 的依赖骨架和 P7-M10~M17 编号可保留，避免无必要重排；每个 Gate 的文字与反例按新职责重写。DHR_57 与 DHR_58 仍可在 DHR_56 后并行。

## 4. P7 工程切分与机器闸改写

P7 的代码边界按现有通用模块演进，不新增 DevHarness Adapter 层：

- Plan/Resolver：TaskRef、PlanHome、受信项目注册表/local binding 的 revision/digest、通用节点、Resolved Plan、canonical digest、generation snapshot。
- Contracts：Ticket/Attempt/Pair、Result/Handoff/Report、route、canonical subject TaskRef set/digest、外部 B-adjust receipt/result 与 Authority ref。
- Workflow：节点收口、显式下游影响闭包、追加式 supersede、B-adjust 部分失败/幂等重试、Plan source change 校验、generation 激活、显式 `continue`。
- Launcher/Pair、Role Relay、Review Batch、Recovery：只消费通用合同。
- E2E：放通用 `relay-core/test/e2e/` 和受控外部项目 fixture；不得出现 `workflows/dev-harness/` 或换名等价的 DevHarness 流程适配层。Herdr/Host/client 等协议边界 adapter 不在禁用范围。

旧实现到新合同的清理矩阵必须进入 DHR_53 卡面和机器扫描，避免只改名不改语义：

| 旧实现 | 新合同 | 验收处理 |
|---|---|---|
| RelayPlan/Run 只含一个 `task_id` | RelayPlan 含 `task_refs[]`；节点绑定全限定 TaskRef/subject set | 删除单任务必填假设；多 TaskRef 正反例 |
| Run Binding 以业务仓/`task_id` 定位 | `plan_home_id + plan_id` 定位 Plan/Run，project binding 独立受信 | 旧字段不得参与 canonical 身份 |
| Core 读取 DevHarness `task_type`/Recipe | Plan 显式节点、路径集合、instruction/route | 生产面静态扫描与运行反例 |
| `construction/review/rework` 业务 `node_type` 枚举 | 通用 node + executor binding + result route | 未知业务动作不要求 Core 加枚举 |
| `relay-core/workflows/dev-harness/` | 通用 engine/test/e2e + 外部 Plan fixture | 目录、import、配置键及换名等价扫描均为零 |
| Herdr/Host/client adapter | 保留协议边界适配 | 不得被“零 Adapter”误删 |

P7-M10~M17 的候选终点：

| Gate | 改写后的终点 |
|---|---|
| P7-M10 | 独立 PlanHome、受信 project registry/local binding、全限定 TaskRef、多 TaskRef schema、通用节点、Run/generation/digest/history 全部 fail-closed |
| P7-M11 | Ticket/Receipt/Result/Handoff/Report 的 Run/generation/node/TaskRef/Attempt/Pair 身份与错误绑定反例通过 |
| P7-M12 | Workflow Engine 唯一裁决；Decision Result/Handoff → 外部逐项目 B-adjust receipt/result → 编排 Agent选定 Plan change → 单次 generation 激活 → 另一次显式 continue 的边界成立；激活失败不回滚外部 B-adjust、不改变旧 generation、不自动 launch；重试幂等且无半状态 |
| P7-M13 | 任意单 Node Pair 可真实启动、durable 收口、撤权与释放，永久目录不冒充 live Agent |
| P7-M14 | Role Relay 四结果、身份对账和零业务副作用成立 |
| P7-M15 | 通用 Review Batch 的显式 path set、revision、N/A、override、cancel、join 与恢复成立 |
| P7-M16 | 节点/Batch/TaskRef 作用域的停滞、等待、诊断、替代与迟到写拒绝成立 |
| P7-M17 | 一张真实任务从显式 Plan 跑通；Decision Executor 可 durable 关闭；更新 generation 后另一次 continue；PlanHome 新根启用闸、独立 Oracle 与零 DevHarness workflow/adapter 扫描通过 |

P7 的真实任务必须补一组离线跨项目解析反例，证明 schema 和 Resolver 没有偷偷退回单 repo/single task；真实两个项目同时调度仍留 P8。

## 5. P8 五卡的必要调整

P8 的目标改为“同一 RelayPlan 的真实多任务、跨项目调度与受控重编排”。现有 DHR_41~45 编号和顺序可保留，但卡面必须发生实质变化：

| 任务 | 调整后的唯一承接 | 取代的旧限制 |
|---|---|---|
| DHR_41 | 同一 Plan/Run 内 2~3 个跨项目 TaskRef 的 project registry/local binding、显式依赖、并行、共享消费者、同仓 Finalizer 串行和跨项目 workspace/权限隔离；一个 TaskRef 失败只冻结它及显式下游闭包 | 删除“不做跨仓 Run”；路径重叠或容量互斥不自动成为业务依赖 |
| DHR_42 | 编排 Agent驱动的受控 Plan change：消费 Decision Result/Handoff 与逐项目外部 B-adjust receipt/result，由编排 Agent选择新增或不新增 TaskRef；加入时，确定性命令校验 Authority、生成 canonical diff/receipt、追加 Node/未启动 supersede 并激活一个 generation；不加入时，当前 Plan 只登记外部处置引用 | 删除“只许卡内、不许加卡/换卡”；不执行业务 B-adjust、不直接 launch、不自动创建或切换另一 Plan/Run、不设置第二发布者 |
| DHR_43 | fresh 只读诊断/决策 Executor、持久 Attention 与多客户端 Authority；统一绑定 subject TaskRef set/digest 和依赖闭包，durable Result/Handoff/Monitor Report 后关闭并释放；用户离线时无关 Ready 节点仍可继续 | 删除“一处待决定等于整个 Run 停住”的隐含模型；不新增 Diagnoser/Decision 逻辑角色 |
| DHR_44 | **取消并保留历史卡面**：旧 Hook/Outbox、外部周报和业务仓 `docs/relay` 归档来自已冻结的历史设计，不属于正式 `design/10` 输入 | 以后若需要，先做新的 A-full，再单独 B-adjust；不得把 DHR_44 静默改造成无关新任务 |
| DHR_45 | 独立 PlanHome 的 archive/run summary、宿主外 Oracle 和真实跨项目 2~3 任务 E2E；逐 TaskRef 重算部分成功/等待/失败，演示拆分任务加入与不加入当前 Plan，并追溯每项目 workspace/HEAD | 不写业务仓 `docs/relay`，不依赖 Hook/Outbox/周报；一个总 success 不能掩盖子任务失败 |

活动依赖链改为 `DHR_41 → DHR_42 → DHR_43 → DHR_45`；DHR_44 从活动链移除并保留 `cancelled/superseded-by-DHR-A-23` 历史。DHR_41 仍依赖完整 P7 Gate。跨项目真实样本和各项目权限由开工时用户另行确认，不因 A/B 设计确认自动取得。

## 6. P8 机器闸改写

| Gate | 改写后的终点 |
|---|---|
| P8-M1 | 同一 RelayPlan 的 2~3 个跨项目 TaskRef 按显式业务依赖正确串并行；受影响集 = 问题 seed + 显式下游 + 共享消费者，路径重叠/容量互斥只约束调度、不扩张业务闭包；客户端离线不影响无关 Ready 节点 |
| P8-M2 | 每项目 worktree/Finalizer/基线刷新相互隔离；同仓合入串行，跨项目失败不污染其他项目 |
| P8-M3 | Plan change 只能在逐项目 B-adjust receipt/Authority 生效后新增 TaskRef；相同 request ID 幂等。加入当前 Plan 时才追加对象并激活 generation；不加入时只登记外部处置引用，当前 `plan_id + generation`、TaskRef/Node 图和 Run 身份均不变，新任务留在外部 DevPlan，供以后另行选择的其他 RelayPlan/Run 承接。部分失败、已 B-adjust 但激活失败、越权、未生效任务、active/closed 改写均按合同处理或拒绝。各项目 B-adjust 与 Plan activation 使用独立 Receipt，不能互相冒充成功 |
| P8-M4 | canonical Plan Diff/Receipt 展示 TaskRef set、影响闭包、supersede 与 generation；DSH 不可用时仍可从 CLI 完成授权路径 |
| P8-M5 | Diagnoser/Decision Executor 强制只读并 durable 关闭；Attention 绑定 subject TaskRef set，其他无关节点可继续 |
| P8-M6 | 受信 project registry/local binding、逐项目 Authority、workspace 与 Finalizer 隔离；绑定漂移、跨项目借权、错误仓写入和跨仓 Finalizer 串接稳定拒绝（旧 Hook/Outbox M6 被本次 B-adjust 明确取代） |
| P8-M7 | PlanHome archive/run summary 逐 TaskRef 单写、幂等并与事件账一致；各项目 release manifest 不被混写；不向业务仓写 `docs/relay` |
| P8-M8 | 外部 Oracle 对真实跨项目 Run 独立重算依赖、部分结果、generation 和资源关闭均通过 |
| P8-M9 | DSH、Pi、CLI 对同一 Plan/Run/TaskRef/Attention 读取相同 Read Model 与终态 |

## 7. DHR-A-23 验收映射候选

| 设计验收 | P7 主承接 | P8 主承接 |
|---|---|---|
| HC-3AT-A32 独立 PlanHome 与全限定 TaskRef | DHR_53、DHR_60；拒绝相对 task、业务仓内 Plan 根和单 task Run 身份 | DHR_41、DHR_45；拒绝 registry/binding 漂移 |
| HC-3AT-A33 通用节点、执行绑定与 Result route | DHR_53、DHR_54、DHR_55；拒绝业务 node_type、错 TaskRef/Attempt/Pair、Result 越权改 Plan | DHR_42；拒绝 Decision 直接发布 Plan |
| HC-3AT-A34 影响闭包与 generation | DHR_55、DHR_59；拒绝改写 active/closed、把路径重叠当业务依赖、activation 自动 launch | DHR_41、DHR_42；拒绝全 Run 无差别冻结和 receipt 混用 |
| HC-3AT-A35 三轮止损与 fresh Decision Executor | DHR_54、DHR_56、DHR_59、DHR_60；拒绝复用 reviewer/施工会话、第四轮自动继续、Decision 常驻 | DHR_43；拒绝无 durable Result/Handoff 即释放或推进 |
| HC-3AT-A36 零 DevHarness runtime Adapter | DHR_53、DHR_58、DHR_60；扫描 `task_type`/Recipe/业务 node_type/workflow 及换名等价层 | 回归守护；不得误伤 Herdr/Host/client adapter |
| HC-3AT-A37 通用 Review Batch | DHR_54、DHR_58；拒绝 Core 推导 DevHarness review path、错误 candidate revision/join | 多任务并发回归；路径只能来自 Plan |
| HC-3AT-A38 跨项目隔离与部分失败 | 离线 schema/解析反例；拒绝跨项目借权、一个 Finalizer 管多仓 | DHR_41、DHR_45；拒绝总 success 掩盖子任务失败和 workspace/HEAD 混写 |
| HC-3AT-H11 拆分后的编排选择 | 单任务演示“Decision 只建议、B-adjust 与 Plan activation 分开、activation 不启动” | DHR_42、DHR_43、DHR_45：5 分钟内分别演示两条分支。加入：Decision Result → 外部 B-adjust receipts → 追加对象并 activation → 另一次 continue。不加入：外部 B-adjust 后仅登记处置引用，当前 `plan_id + generation` 和图不变，新任务显示为留给其他 RelayPlan/Run，显式 continue 当前 Run 的无关 Ready 节点；不得自动创建/切换其他 Plan/Run。失败例为外部调整已生效但 activation 失败时旧 generation 不变且无 Worker 被拉起 |
| HC-3AT-H12 PlanHome 与跨项目追溯 | 5 分钟内从 PlanHome 展示 plan source、generation digest、archive/runtime/local 边界，runtime 目录不得冒充 live Agent | DHR_45：同屏/同命令链追溯两个 TaskRef 的 registry/binding digest、各 generation digest、每项目 workspace/HEAD 与部分结果；错误项目绑定或 HEAD 不一致时 fail-closed |

## 8. 不变项和明确非目标

- Core 逻辑角色仍只有 orchestrator、monitor、executor；Diagnoser/Decision 是 fresh Executor 节点，Replanner/Compiler 是 orchestrator 侧确定性服务，均不新增 Agent/Lease 类型或第二 Plan 发布者。
- `task_id` 始终是所属 DevPlan 的业务任务卡 ID；Plan/Run/Node 各有独立身份。
- 加入当前 Plan 的四步边界固定为：Decision Executor 只产出 durable Result/Handoff 并关闭 → 编排 Agent取得逐项目 Authority 并在外部执行 B-adjust → 编排 Agent选择加入并调用确定性命令激活一个 generation → 另一次显式 `continue` 才可启动节点。四步各有独立 Receipt/证据，不能合并成一次“自动重规划”。
- 不加入当前 Plan 时，当前 Plan 只登记外部处置引用，`plan_id + generation`、TaskRef/Node 图和 Run 身份不变；拆出的任务留在外部 DevPlan，供以后另行选择的其他 RelayPlan/Run 承接。本次动作不自动创建或切换另一 Plan/Run，编排 Agent只对当前 Run 的无关 Ready 节点另发显式 `continue`。
- 外部 B-adjust 已成功而 Plan activation 失败时，业务计划调整仍然有效；旧 generation 保持不变，不自动 launch。修正 Plan change 后用同一 request identity 幂等重试。
- 不为每个 generation 新建 Plan 目录；source 保留旧定义并追加变更，runtime 保存完整不可变快照。
- 跨项目 Run 不承诺跨 Git 仓原子提交；每个项目保留自己的权限、worktree、Finalizer、verify 与收口合同。
- 不启用 PlanHome 新根，不自动创建/提交 `plans/archive/runtime/local`，不清理 DHR_53，不扩大 P5/P6 或 DHR_30/DHR_31 范围，也不改变其状态与授权。

## 9. B-adjust 生效顺序

```text
DHR-A-23 用户整版确认并晋升正式 design/10
→ 以正式 design/10 为唯一 planning input 更新本 B 候选
→ fresh B-review + 主会话裁决
→ 用户回答 B 理解问题并整版确认
→ 正式更新 P7/P8、dev_plan/README 与映射/审核留痕
→ 机械同步 DHR_53 workspace 的新卡面与 superseded 说明（不创建 ref、不重建）
→ 用户另行授权后，才执行 archive/manifest、重建工作树并恢复开发
```

设计 A 的确认、B-adjust 的确认、DHR_53 恢复施工是三个不同闸门。

## 10. 晋升结果

- `DHR-B-21` 已机械落入正式 P7、P8、`dev_plan/README.md` 与 DHR_53 的 `brief.md`、`task_plan.md`、`progress.md`、`findings.md`。
- DevPlan 的 `task_type` 继续属于 dev-harness，用于冻结复核 Recipe；只禁止 dh-relay Core 读取或解释它。
- P5/P6、DHR_30/DHR_31 的任务、状态、依赖和授权未改；P8 已纳入后续活动阶段，但仍受完整 P7 Gate 阻塞且未获开工授权。
- 本次没有执行 Git archive/ref、worktree 重建、PlanHome 初始化、开发、提交或推送。
