# review.plan.monitor-contract — RLT_29 user-adjust

## 身份与范围

- reviewer：`plan-reviewer#2`；review_round=`user-adjust`；remediation_count=`0`；Codex session=`01a0c8bd-87f7-77c3-95a0-661a72ff7137`。
- 输入：仓根 `AGENTS.md`、`DONE.builder.monitor-contract-adjust.md`，以及本次调整后的 design/01 §7.5、`HC-RL-A163`、`HC-RL-H19`、design/evidence/13、DevPlan `RLT_29`、`brief.md`、`task_plan.md`、`execution_strategy.md`、`progress.md`。
- 边界：只审核并写本 review/signal；未改规划、代码或 progress，未派 agent，未执行版本动作。

## 核验矩阵

| # | 必核项 | 结论 | 精确证据与判断 |
|---|---|---|---|
| 1 | monitor repo/workspace 完全只读 | **FAIL** | 主合同本身已明确只读：design/01 L971、A163 L1384，DevPlan L160/L183，brief L28/L47，task_plan L39/L77/L219，execution_strategy L29 均限制 monitor 只做 Herdr wait/get/read、变化时 prompt orchestrator 与安全 Enter，禁止 progress/execution_strategy/DONE/BLOCKED/轮询或通知日志。但 `task_plan.md` L6、L16-L26 又要求“每个 worker/每次派单”命中 `RELAY_RECEIPT` 时写 `BLOCKED.*.md`；同文件 L36 将 `monitor` 列入 phase 闭集。`brief.md` L50 与 `execution_strategy.md` L32 也对“所有/每个 worker”重复该写 signal 规则，未排除 monitor。故 monitor 的 fail-closed 路径仍被要求写 repo，和零写入硬约束直接矛盾。见 P1-01。 |
| 2 | durable 状态来源与 monitor 通知属性 | **PASS** | design/01 L967/L971、A163、DevPlan L154/L160/L183、brief L47-L48、task_plan L39-L41/L77、execution_strategy L8/L28-L31 一致规定 durable 状态来自实际 worker/reviewer/decider 自写 signals/reviews/decision；monitor prompt 通知非 durable，orchestrator 只读取并机械路由。除 P1-01 的 receipt 分支外未发现 monitor 被授权生成常规 durable 状态。 |
| 3 | progress 写者与内容闭集 | **PASS** | design/01 L967、A163，brief L28/L47，task_plan L40、L64/L66/L68/L82，execution_strategy L30-L31，progress L1-L16 一致规定：只有当前顺序执行的 batch coder 在自己 batch 追加一条简洁施工里程碑与证据引用；不得含 pane/agent 状态、轮询、通知、终端输出；reviewer/monitor/orchestrator 不写。 |
| 4 | execution_strategy 写者与 model-allocation gate | **PASS** | design/01 L949-L951、A160，DevPlan L158/L183，brief L25/L47，task_plan L28-L32/L38，execution_strategy L4-L24/L28-L31 明确仅 orchestrator 在用户确认、启动或变更角色/实例时机械维护确认分配与实际启动配置，monitor 只读；未确认零启动、逐角色修改、恢复复用未变确认、变更重问、默认仅提案及权限不替代确认均保留。 |
| 5 | 恢复权威 | **PASS** | design/01 L965-L971、A163，evidence/13 L79-L82，DevPlan L160/L183，brief L47-L48，task_plan L41，execution_strategy L8，progress L9 均冻结为 durable signals + 独立 review/decision + `execution_strategy.md` 配置 + Herdr 实态；`progress.md` 明确不是运行真相。 |
| 6 | SKILL/结构测试要求与 baseline B-01/B-02 | **PASS（受 P1-01 修订约束）** | task_plan L192、L219、L240 已要求 SKILL/双 adapter 和结构反例拒绝 monitor 对 repo/workspace 的任何写入；但应随 P1-01 增补 monitor 的 RELAY_RECEIPT 无落盘 fail-closed 反例。baseline 合同的 B-01/B-02 仍在 task_plan L116-L117/L130-L131，原始文件均存在：`evidence/baseline/B-01.txt` SHA-256=`27cec30d219f496e1addfb653a2e7edbbba3af5a0e99f545fc7b2906ca60eb80`，尾部为 `Ran 7 tests ... OK`；`B-02.txt` SHA-256=`55fbe28ad830d9fa9fbff48838b087170847f763283477c1ed8f816f46abb6fb`，尾部为 `Ran 228 tests ... OK`。本审核只确认原始输出未删且未被本调整伪改判；因未见独立 exit/summary，不把 raw `OK` 扩写成完整 baseline gate 已闭合。 |
| 7 | 现役文本一致性、历史 supersede、删除与 diff check | **FAIL** | evidence/13 L75-L83、DevPlan L183、brief L49、task_plan L42 已明确旧 monitor-writer 口径和旧 post-decision PASS 被 user-adjust 取代；`DONE.monitor.model-allocation.md` 当前不存在；`git diff --check` exit 0。除 P1-01 的通用 preflight 冲突外，未发现其它现役 monitor writer 残留。由于 P1-01 仍是现役文本内部矛盾，本项整体不能 PASS。 |

## Findings

### P0

无。

### P1

#### P1-01 — 通用 RELAY_RECEIPT preflight 仍要求 monitor 写 BLOCKED signal

- 精确证据：`task_plan.md` L6、L16-L26 对“每个 worker/每次派单”规定命中 receipt 后写 workspace `BLOCKED.*.md`；L36 的 single-task phase 闭集包含 `monitor`。`brief.md` L50 与 `execution_strategy.md` L32 同样写“所有/每个 worker”。与此同时 design/01 L971、A163、brief L47、task_plan L39/L77/L219、execution_strategy L29 明确禁止 monitor 写任何 repo/workspace 文档或 signal。
- 影响：zero-context monitor 无法同时遵守两条硬合同；一旦环境出现 `RELAY_RECEIPT`，按通用 preflight 会直接违反本次用户调整的核心要求。未来 SKILL/adapter 结构测试也可能错误接受 monitor 写 BLOCKED 的实现。
- 最小整改：在 design §7.5.5/A165、brief、task_plan §0.1、execution_strategy 及 batch-1/batch-3 结构测试要求中明确区分：实际产出型 worker/reviewer/decider 命中 receipt 时按精确信号 fail closed；monitor 命中时只通过 Herdr prompt 非 durable 通知 orchestrator并立即停止，零 repo/workspace 写入、不得写 BLOCKED。增加正反例，明确 monitor receipt 分支的 repo diff 必须为空。不得削弱其它角色既有 preflight。

### P2

无。

## 结论

**FAIL** — P0=0，P1=1，P2=0。monitor 零写入的主体合同已基本一致，`DONE.monitor.model-allocation.md` 已删除，B-01/B-02 原始 baseline 输出仍保留且 `git diff --check` 通过；但通用 RELAY_RECEIPT preflight 仍给 monitor 分配 workspace BLOCKED 写入权，属于现役合同自相矛盾。交 builder 做上述最小修订；本轮不放行 batch-1。

---

## Targeted recheck — review_round=user-adjust-2 / remediation_count=1

### 身份与范围

- 同一 `plan-reviewer#2`、同一 Codex session `01a0c8bd-87f7-77c3-95a0-661a72ff7137`；仅复核 P1-01 的闭合情况及本次整改后的新增/残留 P0/P1。
- 输入：`DONE.builder.monitor-contract-remediation-1.md`、本文件原 P1-01，以及修改后的 design/01 §7.5.5/A165、design/evidence/13、DevPlan `RLT_29`、`brief.md`、`task_plan.md`、`execution_strategy.md`。
- 未改规划、代码或 progress，未派 agent，未执行版本动作。

### P1-01 targeted 复核

**CLOSED**。

1. 产出型 builder/coder/reviewer/decider 的 receipt 分支仍完整：design/01 L981、A165 L1386，DevPlan L160，brief L50，task_plan L6/L16-L26，execution_strategy L32 均要求命中 `RELAY_RECEIPT` 时只写本角色精确 `BLOCKED.*.md` 后停，零其它业务写入且不清 `RELAY_*`。
2. monitor 分支已明确互斥：design/01 L981、A165，DevPlan L160，brief L50，task_plan L6/L28/L41，execution_strategy L32 均要求 repo/workspace 零写入，只用 Herdr prompt 非 durable 通知 orchestrator 后立即停止，不写 BLOCKED，不清 `RELAY_*`。
3. task_plan batch-1 L193-L194 与 batch-3 L242 已要求 SKILL/双 adapter/结构测试覆盖双方正反例：产出型角色的精确 BLOCKED 不得削弱；monitor receipt 分支 repo diff 必须为空、只有 Herdr prompt、不写 progress/execution_strategy/DONE/BLOCKED/轮询或通知日志。
4. 对现役 design/DevPlan/brief/task_plan/execution_strategy 扫描，未再发现“所有/每个 worker 写 BLOCKED”涵盖 monitor 的未限定表述；evidence/13 L87 的同类文字明确是首轮 finding 形成史，L88-L89 已记录整改后的互斥分流。

### 新增/残留 P0/P1 检查

#### P0

无。

#### P1

##### P1-02 — batch-3 出口仍把 workflow-final fan-out 交给 monitor

- 精确证据：`task_plan.md` L247 写“PASS 后 monitor 才 fan-out workflow-final”；同文件 L266 则规定 batch-3 review PASS 后由 orchestrator 读取 durable review signal并派 heavy 五路，monitor 只观察 Herdr 变化并 prompt 通知。design/01 L971、A163/A167，brief L47-L48，task_plan L41/L79，execution_strategy L28-L29 均把 monitor 动作闭集限定为 Herdr wait/get/read、变化通知与安全 Enter，把读取 durable 工件并机械路由/分发归 orchestrator。
- 影响：zero-context 运行者无法判断由谁启动 workflow-final；若按 L247 执行，monitor 会越过“只观察并通知”的角色边界，且与 L266 的 orchestrator 路由形成同文件现役矛盾。
- 最小整改：将 task_plan L247 的出口改为“PASS 后由 orchestrator 读取 reviewer durable signal 并 fan-out workflow-final；monitor 仅观察/通知”，与矩阵 L69、§10 L266 及正式设计一致；再扫描现役 RLT_29 规划文本，确保没有其它 single-task monitor 派发、路由或启动 agent 的残留。此修订不得改变已闭合的 receipt 双分支。

#### P2

无。

### 其它合同回归

- monitor repo/workspace 零写入、progress 仅当前 batch coder 写施工里程碑/证据引用、execution_strategy 仅 orchestrator 机械维护、恢复四类权威输入与 model-allocation gate 均未回归。
- `git diff --check` exit 0。

### Targeted 结论

**FAIL** — P0=0，P1=1，P2=0。原 P1-01 已闭合，但 task_plan 仍残留 monitor fan-out workflow-final 的现役矛盾，未满足“monitor 只做 wait/get/read、通知与安全 Enter”的 PASS 条件。交 builder 做最小修订；本轮仍不放行 batch-1。

---

## Final targeted recheck — review_round=user-adjust-3 / remediation_count=2

### 身份与范围

- 同一 `plan-reviewer#2`、同一 Codex session `01a0c8bd-87f7-77c3-95a0-661a72ff7137`；只复核上轮 P1-02 及本次整改后的新增 P0/P1。
- 输入：`DONE.builder.monitor-contract-remediation-2.md`、修改后的 `task_plan.md`、design/evidence/13；并按 PASS 条件扫描现役 RLT_29 design/DevPlan/brief/task_plan/execution_strategy 的 monitor 动作归属。
- 未改规划、代码或 progress，未派 agent，未执行版本动作。

### P1-02 targeted 复核

**CLOSED**。

1. `task_plan.md` L247 已明确：batch-3 reviewer durable PASS 后，由 orchestrator 读取该 signal 并分派 heavy 五路 workflow-final；monitor 只观察 Herdr 变化并 prompt 通知。
2. 同文件 sole-writer/接收者矩阵 L71、durable signal 接收者 L102-L104 与 workflow-final 入口 L266 一致把读取 durable 工件、机械路由和 fan-out 归 orchestrator。
3. L247 进一步明确 monitor 不读取 durable 工件、不路由、不分派或启动 agent；与 design/01 §7.5.4、A163/A167、DevPlan RLT_29、brief 和 execution_strategy 的 single-task 动作闭集一致。
4. evidence/13 L91-L95 如实登记 P1-02、remediation_count=2 的最小整改及扫描边界，没有把整改写成实现/测试已通过。

### 新增 P0/P1 检查

#### P0

无。

#### P1

无。

#### P2

无。

### 回归核验

- 现役 RLT_29 single-task design/DevPlan/brief/task_plan/execution_strategy 未发现其它 monitor 读取 durable signal、路由、分派或启动 agent 的残留。扫描中 design/01 §3～§6、A122 等处的 monitor 写账本/接手节点表述属于与 single-task 并列且互斥的完整 relay 模式合同；DevPlan 其它卡的 monitor 口径亦不属于 RLT_29 现役合同，不构成本次残留。
- 已闭合的 RELAY_RECEIPT 双分支未回归：产出型 builder/coder/reviewer/decider 仍只写精确 BLOCKED 后停；monitor 仍保持 repo/workspace 零写入，只用 Herdr prompt 非 durable 通知后停；均不清 `RELAY_*`。batch-1/batch-3 的 SKILL/adapter/结构测试正反例与 monitor repo diff 为空要求仍在。
- progress 仍仅由当前顺序执行的 batch coder 写简洁施工里程碑/证据引用；execution_strategy 仍仅由 orchestrator 在确认/启动/变更时机械维护；恢复四类权威输入和 model-allocation gate 均未回归。
- `git diff --check` exit 0。

### Final targeted 结论

**PASS** — P0=0，P1=0，P2=0。P1-01 与 P1-02 均已闭合，未发现本次整改引入的新 P0/P1；规划可由 orchestrator 按本轮 durable PASS signal 恢复 batch-1。该结论只放行规划，不宣称 SKILL/adapter 已实现或结构测试、H19、verify、人验已通过。
