# 兼容矩阵 — relay/v1 ↔ relay v2

> **v1 侧事实来源**：本仓 `tools/contracts/`（P1 现役 PowerShell 契约）**实读**，非凭记忆——`relay-params.psd1`（`SchemaVersion = 'relay/v1'`）、`relay-schema.ps1`（字段白名单）、`transition-matrix.json`（状态机与终态）、`relay-identity.ps1`、`relay-redaction.ps1`、`README.md`。
>
> **v1 只读**：`tools/` 与 `.dh-runtime/relay/` 只作 Oracle，零迁移、零新写（DevPlan §2.2）。本矩阵是**对照表**，不是迁移脚本。
>
> **标记**：`保留` = 字段名与语义都不变；`改名` = 语义等价、名字变；`改型` = 名字或语义变了形状/类型/约束；`新增` = v2 才有；`弃用` = v2 不再有。

## 0. 顶层判断

v1 的 `schema_version` 是**单一全局版本串** `relay/v1`，一份契约管所有工件（plan / authority / receipt / result / checkpoint / event）。v2 改为**按协议分别版本化**（`relay.run/v2`、`relay.event/v2`、…），每份工件自带 `protocol` 常量。

| | 保留 | 改名 | 改型 | 新增 | 弃用 | 合计 |
|---|---|---|---|---|---|---|
| 计数 | 2 | 4 | 24 | 10 | 4 | 44 |

> 计数由脚本按下方各表「标记」列精确统计得出，非估计。复算方式：取本文件所有 `|` 起头的表格行，切出第 3 列、去除 `**`/`~~` 与括注后按五枚举计数（§4b 的逐值对照表只有 3 列，不参与计数）。**2026-08-21 复算**：批次检查点 2 小审 D-6 把 `proposed_by/proposed_at` 一行拆成两行（`proposed_at` 仍为改名、`proposed_by` 改判改型），故较前值 43 增 1。**2026-08-21 二次复算**：E14 一致性复核 F-E14-1 把 `plan_hash` 由改名改判改型，改名 5→4、改型 23→24，合计仍 44。（⚠️ **改判要连计数一起改**——这大概就是当初没改的原因，教训见 lesson_candidates。） ⚠️ **44 是「已列行」的精确计数，不是「v1 字段全集」**（E14 一致性复核 F-E14-9）：抽验发现至少 4 个 v1 字段没有对应行——receipt 的 `role`（`relay-schema.ps1:184`）、result 的 `next_action`（`:210`，与 node 的 `next_action` 是两个字段）、plan-pointer / authority 的 `activated_at` / `granted_at`（`:151` / `:161`）；v2 侧 `payload_digest` 也没有「新增」行（`request_digest` / `capability_hash` / `state_signature` 都有）。**别拿 44 当「v1 字段都过了一遍」用**——补全字段全集的对照属 DHR_29 迁移期工作，本卡只把这个边界写明。**改型占一半以上（23/44）不是失控**——v2 的主要工作正是把 v1 里"名字误导 / 混在一个字段里 / 缺约束"的东西拆开并加严，逐条理由见各行说明。

## 1. 版本与身份链

| v1 字段（实读出处） | v2 落点 | 标记 | 说明 / 迁移 |
|---|---|---|---|
| `schema_version`（全局 `relay/v1`，`relay-schema.ps1:Test-RelaySchemaVersion` 大小写敏感精确匹配） | 各协议的 `protocol` 常量 + `relay.rpc/v1` 握手的 `protocol_version` | 改型 | 从"一个版本管全部"改为"每份协议独立版本"。**弃用项**：不再有跨工件的单一版本串 |
| `plan_version`（正整数） | `relay.resolved-plan/v1` 的 `plan_digest`（v0 形状，P6/P7 冻结） | 改型 | v1 用递增整数标识计划代次；v2 用内容摘要。理由：摘要天然满足 design/06 **H11**「更换控制客户端不改变 ResolvedPlan」，整数需要额外协调才能保证同一性 |
| `plan_hash`（sha256） | `relay.resolved-plan/v1` 的 `plan_digest` | **改型** | ⚠️ **本行原标「改名 · 语义等价」，经 E14 一致性复核 F-E14-1 更正**：`CANONICALIZATION.md` §一与 §四**两处**都写着「v1 与 v2 的摘要**不可互认**，兼容矩阵按**改型**处理」，本表与它直接矛盾。实质也不等价——v1 是 PowerShell `Sort-Object`（受实现与文化影响）+ `ConvertTo-Json -Depth 50`，v2 是 RFC 8785 JCS（键序按 UTF-16 码元、数字按 ECMAScript `Number::toString`、无深度上限），**同一份计划算不出同一个值**。故 v1 的 `plan_hash` 值**不可直接充当** v2 的 `plan_digest`，迁移时须按 v2 口径重算 |
| `authority_generation`（正整数） | — | **弃用** | v1 用它表达"权威代次"；v2 的唯一写者由 **lease** 保证（`E_LEASE_HELD`，DHR_29 承接），不再靠代次比大小。**这是 v1→v2 语义变化最大的一处**，DHR_29 施工时须复核 P1 的恢复锁/CAS 用例是否仍被 lease 语义完整覆盖 |
| `run_id`（自由字符串） | `relay.run/v2` 的 `run_id`（`^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`） | 改型 | 加了规范化约束（design/02 B7 D23 · `E_RUN_ID_INVALID`）。v1 的历史 run id 形如 `RELAY-IHSR05-RW-20260816113004`，**符合新约束**（P4 实测样本已核） |
| `node_id`（自由字符串） | `relay.run/v2` 节点的 `node_id`（同上 pattern） | 改型 | 同上 |
| `attempt_id`（**正整数**，`Test-RelayPositiveInteger`） | `attempt_id`（**字符串** pattern） | **改型** | ⚠️ 类型变了。v1 用递增整数；v2 用不透明字符串，因为 design/06 **H12** 要求"换 Executor 产生 fresh Attempt"，字符串能承载不可复用的唯一 id，整数递增容易被实现误当作"重试次数"。**注意与 `relay.run/v2` 的 `attempt`（run 级、可空整数、G4）不是一回事** |
| `launch_id` + `session_id`（两个字符串） | `relay.launch-receipt/v2` 的 `receipt_id` + `issued_by_runtime` | 改型 | v1 的 7 段身份链（`plan_version`+`plan_hash`+`authority_generation`+`node_id`+`attempt_id`+`launch_id`+`session_id`）在 v2 收敛为 `receipt_id` 一个锚点 + `run_id`/`node_id`/`attempt_id` 三段定位。**迁移风险**：v1 的迟到结果判定依赖全 7 段比对（`relay-identity.ps1`），v2 依赖 `receipt_id` 单锚点 —— DHR_29 须用 P1 的迟到结果 fixture 复验 v2 判定不弱于 v1 |
| — | `request_id`（幂等键） | 新增 | v1 无客户端侧幂等键；v2 由 RPC 握手强制（design/02 B1 · P5-M2） |
| — | `request_digest` | 新增 | 配合 `E_REQUEST_CONFLICT`：同 id 异 digest 拒绝，不静默覆盖 |
| — | `capability_hash` | 新增 | fail-closed 三条之一 |

## 2. 计划与节点

| v1 字段 | v2 落点 | 标记 | 说明 |
|---|---|---|---|
| plan 的 `proposed_at` | `relay.run/v2` 的 `created_at` | 改名 | 语义等价 |
| plan 的 `proposed_by`（**枚举** `orchestrator`/`replanner`，`relay-schema.ps1:121`） | `relay.run/v2` 的 `trigger_by`（**自由字符串**，`trigger=human` 时必填） | **改型** | ⚠️ 原判「改名·语义等价」是**错的**（批次检查点 2 小审 D-6，findings F-016）。类型、取值域、主体三者全变：v1 记的是**哪个机器角色提出了计划**（编排器还是重规划器），v2 记的是**哪个自然人触发了 Run**——不是同一件事。**v1 的 `orchestrator`/`replanner` 概念在 v2 无对应落点**：v2 的 `trigger` 枚举用 `system` 覆盖"机器发起"这一类，但不区分是哪个机器组件；若 P8 的重编排 Agent 需要区分，应在 `relay.resolved-plan/v1`（P6/P7 冻结）里表达"这版计划由谁产出"，而不是塞回 `trigger_by` |
| — | `workflow_name` / `summary` / `trigger` | **新增（必填）** | 承接 **G1**：v1 完全不记，P4 投影时被迫让操作员补供 |
| node `role`（枚举 `worker`/`reviewer`/`replanner`） | node `role`（**自由字符串**） | **改型** | ⚠️ 放开枚举。理由：`worker/reviewer/replanner` 隐含了一种特定工作流形状，而 v2 协议须**业务域无关**（design/05 §6.2）。约束改由 Workflow 定义层承担 |
| node `brief_ref`（自由字符串，v1 实测携带主机绝对路径） | `relay.locator` 约束下的 locator 类字段 | **改型** | 承接 **G5**：pattern 拒绝绝对路径（`E_ABSOLUTE_LOCATOR`）。且 v2 把约束**扩到全域** locator，不止 `brief_ref` 一个字段 |
| node `depends_on`（字符串数组） | node `depends_on` | 保留 | |
| node `next_action`（枚举 `review`/`next_stage`/`none`） | — | **弃用** | v1 在节点上编码"下一步做什么"；v2 由 `depends_on` 图 + Runtime 调度决定，节点不自带流程指令 |
| node `resume_from`（`node_id`+`attempt_id`） | — | **弃用** | v2 的恢复由事件账回放 + lease 决定（DHR_29），不在计划里写死恢复点 |
| — | node `title` | **新增（必填）** | 承接 **G3**：v1 无节点人话标题，P4 只能 `title = node_id` 1:1 降级 |
| — | node `required` + `executor_profiles` | **新增** | H6 契约断言的载体：必经角色不得只声明 `dsh-agent` |
| — | `relay.run/v2` 的 `attempt`（run 级、可空） | **新增** | 承接 **G4**，且「缺省≠1」入协议 |

## 3. 状态：v1 两维 → v2 三层

**v1 已经把两件事分成两个状态机维度**（`transition-matrix.json` 实读）：

- `terminal_state`：`launching / running / idle / stopped / exited / unknown`，终态 `exited` —— 这是 **psmux 会话观测态**
- `result_status`：`working / decision_required / succeeded / dependency_blocked / interrupted_unknown / quota_exhausted` —— 这是**任务结果**

**G6 的真实含义因此要精确说**：v1 的问题**不是"没分开"，而是"分开了但命名误导 + 缺 run 级"**——`terminal_state` 这个名字让人以为是"最终状态"，实际是会话观测；且两维都在**节点/会话级**，没有 run 级聚合。

| v1 | v2 落点 | 标记 | 说明 |
|---|---|---|---|
| `terminal_state`（6 态，会话观测） | `relay.host-observation/v1` 的 `observation_status`（`alive` / `observation_lost`，v0 形状） | **改型** | 名字改掉（消除"终态"误导），态收敛为 2 个。v1 的 `launching/running/idle/stopped` 属"还看得见"→ `alive`；`unknown` → `observation_lost`；`exited` 是**确认宿主已退**，v2 归入 `relay.result/v2` 的 `orphaned` 判定输入，**不再是观测态** |
| `result_status: succeeded` | `relay.result/v2` `outcome: succeeded` | 保留 | |
| `result_status: dependency_blocked` | `relay.result/v2` `outcome: failed` + `reason` | 改型 | v2 把"为什么失败"统一收进 reason code，不再用 outcome 枚举区分失败原因 |
| `result_status: interrupted_unknown` | `outcome: orphaned` + `E_EXECUTOR_ORPHANED` | 改型 | ⚠️ **本行原写「同上」，经 E14 一致性复核 F-E14-4 补全**：v1 的 `interrupted_unknown` 由三个产生器共同写入（`Get-RelayProbeVerdict` / `Get-RelayStallVerdict` / `Get-RelayExitWithoutResultVerdict`），**前两个是「探活丢了 / 卡住了」= 观测中断，第三个才是「确认退出且无终态结果」**——v1 把两件事混在一个值里。v2 按 **G6** 拆开：观测中断走 `relay.host-observation/v1` 的 `observation_status`，**不判死、不产生 reason code**；只有「确认退出且无 final result」这一路才落 `outcome: orphaned` + `E_EXECUTOR_ORPHANED`。**DHR_29 注意**：照本行原来的「同上」实现，会在探活失败时直接写 orphaned 终态，撞穿 G6 |
| `result_status: quota_exhausted` | `outcome: failed` + reason（P6 增补配额码） | 改型 | v1 已标 `p1: false`（非 P1 边） |
| `result_status: working` / `decision_required` | `relay.checkpoint/v2` 的 `phase` | 改型 | v1 把"中途态"和"终态"塞在同一枚举里，并靠 `illegal-final-status` 拦截把中途态写成终态。**v2 从结构上杜绝**：checkpoint 与 result 是两份协议，中途态根本没有渠道成为终态 |
| `interruption_reason`（`stopped_by_user`/`host_lost`/`unknown`） | reason code | 改名 | ⭐ v1 已有 `host_lost`。v2 的 `E_EXECUTOR_HOST_LOST` 是其**语义收窄版**——v1 的 `host_lost` 混合了"会话没了"与"执行方没了"，v2 按 G6 拆开：只有确认 Executor 消失才用本码，观测中断走 `observation_lost` 且**不判死** |
| — | `relay.run-state/v1` 的 `run_status` + `group` | **新增** | 承接 **G2**：v1 无 run 级状态；v2 源头记 **且** 冻结聚合语义。⚠️ **本行原写四档口径（`failed > running > waiting_human > succeeded`，表外一律 `unknown`），已按 E14 一致性复核 F-E14-2 更正**——那是批次检查点 2 小审 **D-19 之前**的版本。现行为**七档**（见 `relay.run-state.v1.schema.json` 的 `run_status.description`，且①~⑥已由 `allOf` 机器强制）：①任一 `failed` 或 `orphaned` → `failed`；②否则任一 `running` → `running`；③否则任一 `waiting_human` → `waiting_human`；④否则任一 `unknown` → `unknown`；⑤否则任一 `pending` → `pending`；⑥否则全 `succeeded` → `succeeded`；⑦空集合 → `pending`（`minItems:1` 下不可达，为计算期防御档）。**`pending` 走 `group=running` 而不是 `needs_you`**——D-19 的整条裁决就是为了不让「刚创建的 Run」和「节点之间的空档」被强制浮顶成报警噪音 |
| — | `progress` / `elapsed_seconds`（源头计量） | 新增 | 客户端不读时钟、不自行折算 |
| — | `state_signature` | 新增 | 支撑 P5-M3「强杀后重建相同状态签名」 |

## 4. Receipt / Result / Checkpoint / Event 字段级

| v1 | v2 | 标记 | 说明 |
|---|---|---|---|
| receipt `backend`（枚举 `fake`/`psmux`） | `executor_kind`（`process`/`pi-agent`/`dsh-agent`/`herdr-agent`） | **改型** | v1 的 backend 是**终端后端**（psmux），v2 的 executor_kind 是**执行方宿主归属**（ADR-002）。两者不是同一层概念——psmux 在 v2 里属于 process executor 的一种实现细节，不进协议 |
| receipt `issued_at` / `launch_deadline_at` | `issued_at`（保留）/ — | 改型 | deadline 不进协议：超时策略属 Runtime 配置，不是契约 |
| result `summary` / `handoff_ref` | `relay.result/v2` `structured` + `log_locator` | 改型 | v1 的 `handoff_ref` 是自由字符串，v2 归 locator 约束 |
| result `changed_paths` / `tests_run` / `git_snapshot`（`commit`+`changed_paths`+`diff_stat`） | `structured`（通用载荷） | **改型** | ⚠️ v1 把 git 快照写进了**契约必填**。v2 认为这是**领域特定**的（假设了"任务=改代码"），与"协议业务域无关"冲突，故降为 `structured` 内的自由载荷。**取舍如实登记**：v2 因此不再对 git 证据做结构校验，该校验责任移交 Workflow 层 |
| checkpoint `status` / `progress_note` / `tried` | `phase` / `structured` | 改型 | |
| checkpoint `question` + `options`（`status=decision_required` 时必填） | `relay.attention/v1`（v0 形状，P7 冻结） | 改型 | v1 把"要人决策"塞在 checkpoint 里；v2 单立 Attention 协议，因为 design/06 **H5** 要求它**持久**、不依赖任何客户端在线 |
| event `event_id` / `kind` / `occurred_at` | `seq` / `kind` / `at` | 改型 | v2 用单调 `seq` 保证回放确定性；v1 的 `event_id` 是字符串、不保证序 |
| event `kind` 12 值 | v2 16 值（批次 1 K-1 补 `human_input_requested` 后） | 改型 | ⚠️ 原写法只说"新增 6、弃用 3"，`12−3+6=15` 数字凑巧对上，**掩盖了实际 churn**（批次检查点 2 小审 D-8，findings F-017）。逐值对照见 §4b |
| event `observation` kind 携带 `terminal_state` | `host_observation_changed` 携带 `observation_status` | 改名 | G6 的事件侧落地 |
| event `control` kind 的 `actor`/`source`/`nonce` | `relay.rpc/v1` 握手的 `client_id`/`request_id` | 改型 | |
| `SessionTailMaxBytes = 65536` + `relay-redaction.ps1` | — | **弃用（本卡范围内）** | ⚠️ v1 有"截取会话尾巴 + 凭据形态脱敏 + 残留检测"的完整机制。v2 协议层不承载会话尾巴（`log_locator` 只给指针）。**但 AGENTS 宪章#6 的密钥红线依然生效**——DHR_29 实现 Store 落盘时须复用 v1 的 redaction 口径作 Oracle，本条**留给 DHR_29，不在本卡关闭** |

### 4b. event `kind` 逐值对照（D-8 要求：不许用数字凑账）

> **本表不参与 §0 计数**：它只有 3 列（v1 kind / v2 去向 / 说明），没有「标记」列。§0 的复算脚本只统计 4 列及以上表格的第 3 列。

v1 共 12 值（`relay-schema.ps1:246` `$allowedKinds` 实读），v2 共 **16 值**（DHR_28 冻结时 15 + 批次 1 K-1 补 `human_input_requested`）。逐值去向：

| v1 kind | v2 去向 | 说明 |
|---|---|---|
| `plan_proposed` | **弃用** | 归 `relay.resolved-plan/v1`（v0 形状，P6/P7 冻结），不再走事件账 |
| `plan_activated` | **弃用** | 同上 |
| `launch_receipt` | **裁决：显式不补（DHR_29，2026-08-22）** | 原缺口描述成立过：小审判为可能的遗漏、移交 DHR_29 判定。**实现期裁决**：v2 的回执签发已双载体可回放——receipt 工件 create-new 落盘（文件名=`receipt_id`，内容含 `issued_seq` 锚点）+ 同拍 `attempt_started` 事件（`detail: "receipt:<id>"`）；幂等重投不产生新 seq。"何时签发了哪份回执"由工件+事件配对承载，补 `receipt_issued` 是冗余 |
| `launch_failed` | **裁决：显式不补（DHR_29，2026-08-22）** | 原登记的"语义损失"由层级拆分消解而非合并：start 前置失败（`E_GITIGNORE_MISSING` / `E_RUN_ID_INVALID` 等）发生在 Run Store 存在之前——run root 尚未创建、无处落账，由调用方同步错误信封承载（归宿主层 DHR_51）；Attempt 成立后的失败已由 `attempt_failed` + reason code 全量覆盖。两者本就不是同一层的事件 |
| `checkpoint_accepted` | `checkpoint_recorded` | 同义更名 |
| `checkpoint_rejected` | **裁决：显式不补（DHR_29，2026-08-22）** | 与批次 2 实现一致：拒绝是"未发生的写入"，不改变状态迁移集，同步返回信封（`E_CHECKPOINT_CONFLICT` / `E_IDENTITY_MISMATCH` / `E_TERMINAL_STATE_CONFLICT`）不留痕。原登记的审计盲区（反复投递冲突在账上不可见）**明知接受**；P8 审计若需要再走契约批次按 CANONICALIZATION 纪律批量补值 |
| `result_accepted` | `result_recorded` | 同义更名 |
| `result_stale` | `late_result_quarantined` | 合并 |
| `result_rejected` | `late_result_quarantined` | 合并（与上一行同去向，v2 不区分"陈旧"与"被拒"，统一为"进隔离区"） |
| `observation` | `host_observation_changed` | 同义更名 + G6 语义澄清 |
| `control` | **裁决：显式不补（DHR_29，2026-08-22）** | v2 控制面动作 = `relay.rpc/v1` 方法 + lease 事件（`lease_acquired` / `lease_expired` 已在新增 12 值内）+ `run_finished`；start/stop/resume 的签发凭证在 launch-receipt 工件。控制动作逐笔回放留痕的需求归 DHR_52 服务端落地时评估，本卡不预留总类 kind |
| `diagnosis` | **弃用** | 归 P8 诊断 Agent |
| — | `run_created` / `node_started` / `attempt_started` / `attempt_succeeded` / `attempt_failed` / `attempt_orphaned` / `human_input_requested`（批次 1 K-1 补）/ `client_connected` / `client_disconnected` / `lease_acquired` / `lease_expired` / `run_finished` | **新增 12** |

**账**：v1 12 值 → 弃用 3（`plan_proposed` / `plan_activated` / `diagnosis`）+ 改名 3（`checkpoint_accepted`→`checkpoint_recorded` / `result_accepted`→`result_recorded` / `observation`→`host_observation_changed`）+ 合并 2→1（`result_stale` + `result_rejected` → `late_result_quarantined`）+ **无对应 4**（`launch_receipt` / `launch_failed` / `checkpoint_rejected` / `control`）；v2 另新增 12（含批次 1 K-1 补的 `human_input_requested`）。3+3+1+0+12 = v2 现值 **16**，与 `relay.event.v2.schema.json` 的 kind enum 逐一对得上。**4 个无对应值全部登记为待 DHR_29 判定的缺口，不用"数字对得上"掩盖。**

**DHR_29 裁决结账（2026-08-22，批次 2 收敛批落账）**：4 个无对应值**全部显式不补**，理由逐行见上表；无一静默带过。依据：Store 批次 2 实现（`relay-core/store/store.mjs`）与 `workspace/DHR_29/progress.md` E-009/E-013。若后续卡需要翻案（补值），按 CANONICALIZATION 纪律走新的契约修订批次并同批重生成三份基线。

## 5. fail-closed 口径对照

| v1 拒绝形态（`relay-schema.ps1` 实读） | v2 reason code |
|---|---|
| `unknown-field:<key>` | `E_UNKNOWN_FIELD` |
| `missing-field:<key>` | `E_MISSING_FIELD` |
| `bad-type:<key>` | `E_BAD_TYPE` |
| `bad-value:<key>` | `E_BAD_VALUE` |
| `unknown-enum:<key>` | `E_UNKNOWN_ENUM` |
| `illegal-final-status:<v>` | — （v2 从结构上杜绝，见 §3） |
| `schema_version` 精确匹配失败 | `E_UNSUPPORTED_VERSION` |

**结论**：v1 本就是 fail-closed 白名单口径，v2 继承并加严（**除 `OPEN-POINTS.md` 登记的 3 处有意开放点外**全域 `additionalProperties: false`，+ 能力握手 + locator 约束）。**没有任何一条 v1 的拒绝在 v2 里变成放行。**

## 6. 移交给下游的三条

| 条 | 移交给 | 为什么 |
|---|---|---|
| `authority_generation` → lease 的语义等价性复核 | DHR_29 | v1 的权威代次机制被 lease 取代，须用 P1 恢复锁/CAS 用例复验不弱于 v1 |
| 7 段身份链 → `receipt_id` 单锚点的迟到结果判定 | DHR_29 | 须用 P1 迟到结果 fixture 复验 v2 判定不弱于 v1 |
| 会话尾巴脱敏（`SessionTailMaxBytes` + redaction） | DHR_29 | 协议层不承载，但落盘时红线仍在，须复用 v1 redaction 口径作 Oracle |
