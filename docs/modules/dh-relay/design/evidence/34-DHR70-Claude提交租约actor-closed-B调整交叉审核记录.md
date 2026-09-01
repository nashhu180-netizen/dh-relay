# DHR-B-34 · Claude Receipt 提交撞上已关闭的执行器 · B-调整交叉审核记录

> 本记录承载 `DHR-B-34` 的审核过程、主控裁决与用户理解对齐。**它不是设计输入，不参与拆计划。**
> 待审对象：[`drafts/DHR-B-34-Claude提交租约actor-closed-候选.md`](../../dev_plan/drafts/DHR-B-34-Claude提交租约actor-closed-候选.md)。

<a id="review-b34"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-34 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=review -->

> **本事件的复审总账**：三名 fresh 只读实例、两轮，**6 个独立议题：采纳 6 · 驳回 0**。§1 = 第一轮（`W-01`~`W-06`），§2 = 第二轮定向复审（`X-01`~`X-03`，PASS 无新增 P0/P1）。两轮均为机器强制只读（codex `--sandbox read-only`、`approval=never`），派出前后 git 基线一致证零写入。

## 1. 第一轮 fresh 只读审核

### 1.1 派出登记

| 复审者 | 形态 | 独立性 | 结论 |
|---|---|---|---|
| `b34rev1` | codex `gpt-5.6-terra` · `model_reasoning_effort=high` · `sandbox={"type":"read-only"}` · `approval_policy=never` · cwd=仓根 | fresh 实例，未参与起草，未继承主控会话 | **不通过**（4×P1 方案问题 + 2 条理解风险） |
| `b34rev2` | 同上，与 `b34rev1` 同批拉起、互不可见 | fresh 实例，未参与起草 | **不通过**（2×P1 方案问题 + 1 条理解风险） |

- **只读取证**：派出基线 `a940914`；两名均为 codex 沙盒 `read-only` 的**机器强制只读**（非侦测型降级），会话内无任何写工具调用；主控回收后核 `git status --porcelain` 为空、`HEAD` 仍为 `a940914` —— **零写入取证通过**。
- **brief**：[`drafts/DHR-B-34-review-brief.md`](../../dev_plan/drafts/DHR-B-34-review-brief.md)。
- **两名的第三段（需要用户决定的问题）均明确写「无」**，且都主动说明理由：缺口可由 design/12 已冻结的 gate/lease 合同收紧，不应包装成新的产品语义选择。故本事件**未新增决定点**，仍只有草案自带的 `D-B34-1`、`D-B34-2`。
- **独立取证**：两名各自打开了 `design/12`、`service.mjs:217`、`host.mjs:157`、`workflow-driver.mjs:93`；`b34rev1` 另在 DHR_35 独立 worktree 的 `c0aa1ef` 中读了 Claude/Codex 双路 `events.jsonl` 与 `state.json`；`b34rev2` 因该证据不在基线工作树内，改以 git 对象只读核对，并**独立核出 `host-lease.json` 的 `expires_at` 早于最后一条 `host_observation_changed`** —— 这条时间线是 v2 新增租约表的来源。

### 1.2 裁决总表

> 两名共 9 条，去重后 **6 个独立议题。采纳 6，驳回 0。**

| # | 议题 | 来源 | 级别 | 裁决 | 整改落点 |
|---|---|---|---|---|---|
| W-01 | **机器证 A 把「非终态」写成无条件必须补交成功，越过既有 lease 边界。** design/12 §3 明定「无 lease 不得接收」，P6-RI-A3 要求 lease-lost 不改账；而草案 v1 仅以「Attempt 非终态」要求 committed Ack。实证里 Claude 的 lease 已过期，不能把旧 actor 的提交权恢复为可写。 | rev1-一1 | **P1** | **采纳** —— 这是主控把「应该能交进去」直接写成了「必须无条件收下」，等于用修 bug 去换单写者/fencing 破损。 | 机器证 A 拆成三条：**A1**（lease 仍有效的晚交必须成功）/ **A2**（旧 actor 已结束或失租 → 合法新取 lease、新 actor、重建 gate 后提交唯一 Result，旧 actor 零 mutation）/ **A3**（无法合法取得当前 lease → 保持拒绝、零 mutation，禁止为修 `actor-closed` 放宽单写者） |
| W-02 | **H1 夹具不复现已报告的失败链，可能在现状代码上直接绿。** 现役 `service.mjs` 在 driver 结束但仍有 open submission gate 时会保留 driver，普通「idle 后提交」证不了已关闭 actor 的恢复；实证失败是 `actor-closed`，不是单纯等满 60 秒。 | rev1-一2 **与** rev2-一2（两名各自独立打开代码核出同一条） | **P1** | **采纳** | H1 与 A2 改为写死顺序：**先让旧 actor 因结束或失租拒绝**，再断言 service 为同一非终态 Run 新取 lease、新 actor、重建 gate，提交**恰好一个** Result；旧 actor 零 mutation；同 digest 重投幂等 |
| W-03 | **H3 口径两头都错。** ①草案 v1 要求「必须打到写了该 Receipt 的那一届」——但 design/12 要求 service 重启后由持久 Receipt + Store 重建 gate，现役 `submitExecutorResult` 也确实会从磁盘重建 actor/driver，照 v1 修会做成 endpoint/旧进程黏连，**反而打坏重启恢复**；②Windows endpoint 由 repo root 的 hash 决定，`DH_RELAY_CREDENTIAL_ROOT` / `DH_RELAY_INDEX_PATH` **不改变 pipe 身份**，只靠临时根 + 环境变量测试会漏掉同根陈旧 service 的路由问题，H3 可假绿。 | rev2-一1（①）+ rev1-一3（②） | **P1** | **采纳**（两半合并为一个议题） | H3 改写为「提交必须路由至**同一 Run 的当前 Receipt、当前持 lease 的 actor**」；验收显式对账 endpoint + descriptor generation，并**同时覆盖「原 service 仍活」与「service/actor 已换届」**；明写 `DH_RELAY_*` 不能单独当 H3 绿证 |
| W-04 | **`DHR_35` 的 `blocked-by:DHR_70` 没声明落点。** 草案要求改 DHR_35 依赖，却未说改在哪；而 DHR_70 的允许路径又（正确地）排除了 DHR_35 工作区，依赖关系可能只停在候选文字里。 | rev1-一4 | **P1** | **采纳** | 明写：依赖变更是 **B-adjust 落盘时**改 P6 DevPlan 任务表，**不是** DHR_70 的施工允许路径 |
| W-05 | **「另外开」不等于授权绕 lease，也不等于夹具通过即 Claude 真实闭环通过。** 用户原话只支持单列一张卡。 | rev1-二1 | 理解风险 | **采纳** | 卡面补死：DHR_70 只恢复提交链的机器证，**自己不跑真实 Agent**；补实录须用户**重新放行 DHR_35** |
| W-06 | **「补交成功（恢复或保持 gate）」把两种安全语义混在一句话里**——活 gate 的晚交，与 actor 已关闭后的合法恢复。用户可能读成「任意 `actor-closed` 都该强行成功」，或反过来读成「重启恢复被禁止」。 | rev1-二2 **与** rev2-二1 | 理解风险 | **采纳** | `D-B34-2` 改写为「**由当前持 lease 的 actor 补交成功**；旧 actor 已关或失租时先合法新取 lease 再建 gate，不是要求旧进程还活着，也不是绕过单写者」 |

### 1.3 本轮没有驳回项，两条 P1 是主控自己的边界失守

`W-01` 与 `W-03`① 都不是"复审吹毛求疵"：v1 里那两句照着落盘、照着施工，会分别造成**单写者闸门被放宽**和**重启恢复被做死**——都是拿新缺陷换旧缺陷，与 `DHR-B-33` 的 `W-01` 同类。`W-02` 更直接：v1 的 H1 夹具在现状代码上可能直接绿，DHR_70 会"通过但没修好"。

**教训沿用 B-33 的同一条**：写"某某路径会兜住"之前，先回去核那条路径的触发条件；这次是"写某某必须成功"之前，先回去核成功所依赖的那把锁还在不在。

### 1.4 本轮独立核过、未发现反例的事实（复审列举，主控登记）

- `pane_get=error` **不直接覆盖** `agent get` 的 idle —— 与现役观测实现一致，草案把它列为伴随信号、不当根因，判断成立。
- 草案未把 Codex 单路径成功（E-3525）写成 P6-RI-A4 已满足，这一点正确。
- 草案未改写任何 `design/12` 字段、reason code 或 Result 直写禁令，故「本次 B-adjust 不触发 A-full」的边界判断成立。
- **未见 P0，未见越界写入建议。**

## 2. 第二轮定向复审

<a id="review-b34-r2"></a>

### 2.1 派出登记

| 复审者 | 形态 | 独立性 | 结论 |
|---|---|---|---|
| `b34ver1` | codex `gpt-5.6-terra` · high · `sandbox={"type":"read-only"}` · `approval=never` · cwd=仓根 | fresh 实例，未参与起草，与第一轮两名互不可见 | **PASS**，无新增 P0/P1 |

- 基线 `78830c5`（v2）；复审者自报「当前工作区无未提交改动」，主控回核一致 —— 零写入取证通过。
- 定向范围只核三项（第一轮两条主 P1 是否闭合 + 依赖落点）：

| 核查项 | 结论 | 复审者证据 |
|---|---|---|
| `X-01` 提交目标 = 当前持 lease 的 actor + 可重建 gate；真 lease-lost 仍拒绝 | **PASS** | A1/A2/A3 已分开；不再把旧进程存活当修复目标 |
| `X-02` 夹具先让旧 actor 结束/失租再重建，不能只测 idle 后提交 | **PASS** | H1 与 A2 的顺序已写死，旧 actor 零 mutation + 唯一 Result + 同 digest 幂等 |
| `X-03` DHR_35 依赖改在 DevPlan、不进 DHR_70 施工路径 | **PASS** | 草案明写 B-adjust 落盘时改 P6 任务表；当前 P6 表尚未含 DHR_70，符合"候选未生效"的现状 |

- 复审者主动限定结论边界：**PASS 只表示"计划/验收约束完整"，不表示 DHR_70 已实施或 DHR_35 已获重新放行**。主控接受该限定并原样登记。
- 残余边界（复审者列，非 P1）：DHR_70 未开工，"新 actor / 新 lease / 新 gate"的运行时实现与测试结果此刻不可证。

### 2.2 主控在两轮之外自核的一条现场事实

`relay-core/runtime/service.mjs` 的 `submitExecutorResult` 先遍历 `drivers` map 试老 driver（`tryDriver`），**老 driver 抛出的 `actor-closed` 被 `throw withReason(error)` 直接抛出调用栈**，走不到下面那段"从 durable 事实重建 actor/driver"的兜底循环。这与 `H1` 描述的形状一致，登记为**施工时的起点线索**，不是验收项——DHR_70 仍须用夹具独立钉死根因，不得直接照抄本条当结论。

<a id="understanding-b34"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-34 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=understanding -->

## 3. 面向用户讲解与理解确认

### 3.1 讲解（四层）

- **全局地图**：relay 的写权是单写者——一个 Run 同时只有一个 HostSession actor 持 `host-lease.json`，所有写（含 Result）必须排进这个 actor 的串行队列；executor 干完活经 `submit-executor-result` 交回结果。
- **契约/定义**：design/12 的 receipt-bound 模式——service 先发 Receipt，executor 拿 Receipt 回交 Result，service 侧的 receiver gate 认这张 Receipt。§3 说的是「无 lease 不得接收」，**不是**「必须是原来那个进程」。
- **运作机制（本次为什么炸）**：`host.mjs:159` 在 actor `finished` **或失租**后拒绝一切 `submitControl`；lease 默认 TTL 15s，靠 host 循环每 tick 续。实证时间线对得上——Claude 租约 `02:43:35Z` 取得、`02:44:14Z` 过期（约 39s，没续），最后一条业务事件 `02:44:23Z` 已在过期之后；Codex 那边续到 `02:40:17Z`，Result 在过期前落地，所以通了。
- **承诺 / 验证 / 故障发现**：修完的承诺是「Run 非终态 + Receipt 仍 current 时，晚交一定落到当前持 lease 的 actor，写恰好一个 Result；真失租 / 非 current / 已终态仍拒且零 mutation」。验证全走机器证 A1/A2/A3/B/C/D，跑定向套件 + `git diff --name-only` 卡允许路径。失败面可见：Ack 非 committed，或事件流里出现第二条 Result（幂等破了）。

### 3.2 理解问题（一次一问）

**问**：按 v2 的机器证 A2，假设 DHR_70 修好后重跑那次 Claude 失败场景，`02:44:23` 那条晚交会怎么收场？

**用户答（2026-09-01 点选）**：**「service 重新取一次 lease、开新 actor 重建 gate，然后写入唯一 Result」** —— 与 A2 及 `D-B34-2` 口径一致，且正确排除了"让旧 actor 保活"与"放宽 `host.mjs` 拒绝条件"两条错解。

### 3.3 用户确认与授权边界

**用户 2026-09-01 点选确认落盘**：新增 `DHR_70`，**含 DHR_35 改为 `blocked-by:DHR_70`**（该取舍已在确认前单独列出：等于今天那次半截 Claude 实录之后，真实闭环再推迟一轮）。

两项决定点均与主控推荐一致：`D-B34-1` **DHR_35 等本卡**；`D-B34-2` **由当前持 lease 的 actor 补交成功**。

**本确认只授权**本次 DevPlan、审核工件与草案状态同步落盘；**不授权** DHR_70 D-start、任何生产代码改动、真实 Agent、DHR_35 重跑实录、用户级 registry / 凭据读写、verify、合并、推送、部署或环境操作。
