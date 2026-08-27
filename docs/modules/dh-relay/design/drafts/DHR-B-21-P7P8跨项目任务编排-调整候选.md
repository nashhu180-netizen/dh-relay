# DHR-B-21：P7/P8 通用节点与跨项目任务编排调整候选

> 状态：B-adjust 草案 · 未生效。`DHR-A-23`已获用户整版确认并晋升正式`design/10`，该正式输入现可作为本次B-adjust的唯一planning input；本文件仍须独立完成B-review、理解确认和整版确认。当前不得据此修改P7/P8、清理DHR_53、初始化PlanHome结构、施工、提交或推送。

## 1. 为什么 P7 和 P8 必须一起调整

最新产品口径不是“单卡 Run 增加返修”，而是：一份 RelayPlan 可以承载多个 DevPlan 业务任务，任务可以跨 DevPlan、跨项目；节点绑定全限定 TaskRef；任务拆分后，编排 Agent先执行外部 B-adjust，再决定新任务是否加入当前 RelayPlan；只冻结受影响任务及依赖闭包，其他 Ready/active 节点继续。

因此不能只改 P7：

- P7 要先建立不排斥多任务/跨项目的承重合同、独立 PlanHome、TaskRef、通用节点和 generation 更新语义，并用一张真实任务跑通基础接力。
- P8 才实现同一 RelayPlan 内真实多任务/跨项目调度、影响闭包重编排、诊断选择和跨项目 E2E。
- P8 现有“不做跨仓 Run”“重编排不许加卡/换卡”与新口径直接冲突，必须由同一次 B-adjust 改写，不能只做文字解释。

阶段边界仍保持简单：P7 冻结可扩展合同并完成单任务真实链；P8 消费该合同完成真实多任务与跨项目能力。P7 不提前吞并 P8 调度器，P8 不再重新发明第二套 Plan/Task 身份。

## 2. DHR_53 现役施工如何处理

DHR_53 工作树当前 HEAD `fec9ec1bbbab90813d7d3f3aad1dc847c317ca81`，候选复核时 master 为 `eec59620b45caaec3123ebab840b2684ef4e2c1b`；其中 `b619e4a/cb8a911` 等提交实现了单业务仓、单 `task_id` Run Binding、`task_type` Recipe 与 `construction/review/rework` 业务 `node_type`。这些内容与 A23 候选冲突。

正式 A/B 生效后按以下顺序处理：

1. 固定上述完整 SHA 及相关提交、fixture、测试、review、workspace 的审计事实；正式重做前为 DHR_53 HEAD 建不可变 archive ref，生成 tree/file manifest，并登记实际采用的精确 master SHA，不能用“latest master”作重建基线。
2. 将冲突内容标记 `superseded-by-DHR-A-23`；旧通过数和旧 review 不计入新验收。
3. 对 locator、canonical digest、history 等可能通用的能力逐项重验；能证明符合新卡面才复用，不能整批继承。
4. 先由正式 P7 更新 DHR_53 的 brief/task_plan/progress/findings，再从已登记的精确 master SHA 重建任务工作现场；后续跟进新 master 作为独立 rebase/基线切换留痕，不使用 destructive reset 抹掉历史。
5. 在 workspace 同步前，DHR_53 不恢复施工、不进入下一轮复核、不启用新 runtime 根。

这仍是原 DHR_53 返修重做，不新增一张“补丁卡”掩盖需求变化。

## 3. P7 八卡的最小调整

P7 的目标改为“冻结通用、可承载多 TaskRef 的基础合同，并用一张真实 DevHarness 任务跑通”。单任务 E2E 只是本阶段测试样本，不是 schema 的单任务限制。

| 任务 | 调整后的唯一承接 | 明确不做 |
|---|---|---|
| DHR_53 | 独立 PlanHome 发现与安全边界；`project_ref + devplan_ref + task_id` TaskRef；可含多个 TaskRef 的 RelayPlan/Resolved Plan schema；通用节点图与执行绑定；Run 根 `plan_home_id + plan_id`；generation 的完整 TaskRef set/digest、Resolved Plan digest 与永久历史 | 不读 task_type/Recipe；不定义业务 node_type；不实现真实跨项目并行调度 |
| DHR_54 | Ticket/Receipt/Result/Handoff/Report 的通用身份封套；每个工作节点绑定一个 TaskRef，控制/决策节点统一绑定 canonical 非空 `subject_task_refs[]` 与 set digest；外部 Authority/B-adjust receipt 只作引用；账号、模型、推理、权限和 fresh 绑定可机判 | Result 不携带 Plan patch；Decision Executor 不修改 DevPlan/Plan |
| DHR_55 | Workflow Engine 的通用 route 效果、节点收口、generation 激活与显式 `continue`；parent digest/CAS/request ID；新增 TaskRef/Node、未启动节点追加式 supersede、closed/active 不变；按显式下游依赖唯一计算受影响闭包并保持无关节点状态 | 激活不自动 launch；程序不自动编写业务计划或执行 B-adjust |
| DHR_56 | 对任意显式节点启动、关闭并释放 Monitor+Executor Pair；包括施工、复核、回归和 fresh 决策节点 | 不新增 Decision 逻辑角色；不把施工会话变复核会话 |
| DHR_57 | 继续作为当前身份的 best-effort Role Relay | 不承担 Plan 更新、业务授权或状态推进 |
| DHR_58 | 通用 launch group/Review Batch；路径、candidate revision、绑定和 join 都来自 Plan；N/A、override、cancel 与恢复边界保持 | 不读取 DevHarness Recipe；不维护 review path 业务闭集 |
| DHR_59 | 节点/Batch/TaskRef set 作用域的停滞识别与恢复；区分某影响闭包等待编排动作和整 Run 停止；Decision 节点 durable 关闭后不保留 Worker | 不把一个任务等待误判为整个 Run 无事可做；不自动启动诊断/决策 Agent |
| DHR_60 | “DevHarness 实卡接力与 P7 端到端验收”：用独立 PlanHome 和一张真实任务验证显式 Plan、通用 Result、Pair、Review Batch、恢复、决策关闭、generation 激活与另一次 continue；生产面扫描证明零 Adapter/业务 node_type | 不建设 `relay-core/workflows/dev-harness/`；不以单任务样本限制多 TaskRef schema |

DHR_53→60 的依赖骨架和 P7-M10~M17 编号可保留，避免无必要重排；每个 Gate 的文字与反例按新职责重写。DHR_57 与 DHR_58 仍可在 DHR_56 后并行。

## 4. P7 工程切分与机器闸改写

P7 的代码边界按现有通用模块演进，不新增 DevHarness Adapter 层：

- Plan/Resolver：TaskRef、PlanHome、受信项目注册表/local binding 的 revision/digest、通用节点、Resolved Plan、canonical digest、generation snapshot。
- Contracts：Ticket/Attempt/Pair、Result/Handoff/Report、route、canonical subject TaskRef set/digest、外部 B-adjust receipt/result 与 Authority ref。
- Workflow：节点收口、显式下游影响闭包、追加式 supersede、B-adjust 部分失败/幂等重试、Plan source change 校验、generation 激活、显式 `continue`。
- Launcher/Pair、Role Relay、Review Batch、Recovery：只消费通用合同。
- E2E：放通用 `relay-core/test/e2e/` 和受控外部项目 fixture；不得出现 `workflows/dev-harness/` 或换名适配层。

P7-M10~M17 的候选终点：

| Gate | 改写后的终点 |
|---|---|
| P7-M10 | 独立 PlanHome、受信 project registry/local binding、全限定 TaskRef、多 TaskRef schema、通用节点、Run/generation/digest/history 全部 fail-closed |
| P7-M11 | Ticket/Receipt/Result/Handoff/Report 的 Run/generation/node/TaskRef/Attempt/Pair 身份与错误绑定反例通过 |
| P7-M12 | Workflow Engine 唯一裁决；显式下游影响闭包、追加式未启动 supersede、active/closed 不变、B-adjust receipt 与重试、generation 激活和显式 continue 幂等且无半状态 |
| P7-M13 | 任意单 Node Pair 可真实启动、durable 收口、撤权与释放，永久目录不冒充 live Agent |
| P7-M14 | Role Relay 四结果、身份对账和零业务副作用成立 |
| P7-M15 | 通用 Review Batch 的显式 path set、revision、N/A、override、cancel、join 与恢复成立 |
| P7-M16 | 节点/Batch/TaskRef 作用域的停滞、等待、诊断、替代与迟到写拒绝成立 |
| P7-M17 | 一张真实任务从显式 Plan 跑通；Decision Executor 可 durable 关闭；更新 generation 后另一次 continue；PlanHome 新根启用闸、独立 Oracle 与零 Adapter 扫描通过 |

P7 的真实任务必须补一组离线跨项目解析反例，证明 schema 和 Resolver 没有偷偷退回单 repo/single task；真实两个项目同时调度仍留 P8。

## 5. P8 五卡的必要调整

P8 的目标改为“同一 RelayPlan 的真实多任务、跨项目调度与受控重编排”。现有 DHR_41~45 编号和顺序可保留，但卡面必须发生实质变化：

| 任务 | 调整后的唯一承接 | 取代的旧限制 |
|---|---|---|
| DHR_41 | 同一 Plan/Run 内 2~3 个 TaskRef 的依赖、并行、路径重叠、同仓 Finalizer 串行和跨项目隔离；一个 TaskRef 失败只冻结影响闭包 | 删除“不做跨仓 Run”；不再假设所有卡来自一个 repo |
| DHR_42 | 编排 Agent驱动的受控 replan：接收 Decision/Handoff 和逐项目外部 B-adjust receipt/result，提案新增或不新增 TaskRef，新增 Node、追加式 supersede 未启动节点；生成 canonical diff/receipt，激活新 generation | 删除“只许卡内、不许加卡/换卡”；Replanner/Compiler 仅是 orchestrator 侧确定性服务，不能直接发布 Plan |
| DHR_43 | fresh 只读诊断/决策 Executor、持久 Attention 与多客户端 Authority；统一绑定 subject TaskRef set/digest 和依赖闭包，用户离线时无关 Ready 节点仍可继续 | 删除“一处待决定等于整个 Run 停住”的隐含模型；不新增 Diagnoser/Decision 逻辑角色 |
| DHR_44 | 通用 Hook/Outbox，事件与 Action 请求绑定 plan/run/generation/node/TaskRef；跨项目写入逐目标授权、幂等和隔离 | 不把 PlanHome 身份或一个项目权限复用到另一项目 |
| DHR_45 | 独立 PlanHome 的 run/task-level 归档索引、宿主外 Oracle 和真实跨项目 2~3 任务 E2E；逐 TaskRef 重算部分成功/等待/失败，演示拆分任务加入与不加入当前 Plan | 删除“不做跨仓 Run”；一个总 success 不能掩盖子任务失败 |

P8 的 `DHR_41 → DHR_42 → DHR_43 → DHR_44 → DHR_45` 单链可保留；DHR_41 仍依赖完整 P7 Gate。跨项目真实样本、外部周报写入目标和权限继续由开工时用户另行确认，不因 A/B 设计确认自动取得。

## 6. P8 机器闸改写

| Gate | 改写后的终点 |
|---|---|
| P8-M1 | 同一 RelayPlan 的 2~3 个跨项目 TaskRef 按显式依赖与重叠正确串并行，客户端离线不影响无关 Ready 节点 |
| P8-M2 | 每项目 worktree/Finalizer/基线刷新相互隔离；同仓合入串行，跨项目失败不污染其他项目 |
| P8-M3 | Replan 只能在逐项目 B-adjust receipt/Authority 生效后新增 TaskRef；相同 request ID 幂等，可选择加入或不加入当前 Plan；部分失败、已 B-adjust 但激活失败、越权、未生效任务、active/closed 改写均按合同处理或拒绝 |
| P8-M4 | canonical Plan Diff/Receipt 展示 TaskRef set、影响闭包、supersede 与 generation；DSH 不可用时仍可从 CLI 完成授权路径 |
| P8-M5 | Diagnoser/Decision Executor 强制只读并 durable 关闭；Attention 绑定 subject TaskRef set，其他无关节点可继续 |
| P8-M6 | Hook/Outbox 请求绑定完整跨项目身份，目标权限独立，重放与串项目写入反例稳定拒绝 |
| P8-M7 | PlanHome archive/run summary 逐 TaskRef 单写、幂等并与事件账一致；各项目 release manifest 不被混写 |
| P8-M8 | 外部 Oracle 对真实跨项目 Run 独立重算依赖、部分结果、generation 和资源关闭均通过 |
| P8-M9 | DSH、Pi、CLI 对同一 Plan/Run/TaskRef/Attention 读取相同 Read Model 与终态 |

## 7. DHR-A-23 验收映射候选

| 设计验收 | P7 主承接 | P8 主承接 |
|---|---|---|
| HC-3AT-A32 独立 PlanHome 与全限定 TaskRef | DHR_53、DHR_60 | DHR_41、DHR_45 |
| HC-3AT-A33 通用节点、执行绑定与 Result route | DHR_53、DHR_54、DHR_55 | DHR_42 |
| HC-3AT-A34 影响闭包与 generation | DHR_55、DHR_59 | DHR_41、DHR_42 |
| HC-3AT-A35 三轮止损与 fresh Decision Executor | DHR_54、DHR_56、DHR_59、DHR_60 | DHR_43 |
| HC-3AT-A36 零 DevHarness runtime Adapter | DHR_53、DHR_58、DHR_60 | 回归守护 |
| HC-3AT-A37 通用 Review Batch | DHR_54、DHR_58 | 多任务并发回归 |
| HC-3AT-A38 跨项目隔离与部分失败 | 离线 schema/解析反例 | DHR_41、DHR_45 |
| HC-3AT-H11 拆分后的编排选择 | 单任务动作分层演示 | DHR_42、DHR_43、DHR_45 |
| HC-3AT-H12 PlanHome 与跨项目追溯 | PlanHome 基础追溯 | DHR_45 |

## 8. 不变项和明确非目标

- Core 逻辑角色仍只有 orchestrator、monitor、executor；Diagnoser/Decision 是 fresh Executor 节点，Replanner/Compiler 是 orchestrator 侧确定性服务，均不新增 Agent/Lease 类型或第二 Plan 发布者。
- `task_id` 始终是所属 DevPlan 的业务任务卡 ID；Plan/Run/Node 各有独立身份。
- 业务 B-adjust 与 RelayPlan generation 更新是两个动作；程序校验/激活 Plan，不代替编排 Agent修改 DevPlan 或选择任务。
- 不为每个 generation 新建 Plan 目录；source 保留旧定义并追加变更，runtime 保存完整不可变快照。
- 跨项目 Run 不承诺跨 Git 仓原子提交；每个项目保留自己的权限、worktree、Finalizer、verify 与收口合同。
- 不启用 PlanHome 新根，不自动创建/提交 `plans/archive/runtime/local`，不清理 DHR_53，不扩大 DHR_30/P6 范围。

## 9. B-adjust 生效顺序

```text
DHR-A-23 用户整版确认并晋升正式 design/10
→ 以正式 design/10 为唯一 planning input 更新本 B 候选
→ fresh B-review + 主会话裁决
→ 用户回答 B 理解问题并整版确认
→ 正式更新 P7/P8 与映射/审核留痕
→ 同步 DHR_53 workspace，完成旧实现审计与重建准备
→ 用户另行授权后才恢复开发
```

设计 A 的确认、B-adjust 的确认、DHR_53 恢复施工是三个不同闸门。
