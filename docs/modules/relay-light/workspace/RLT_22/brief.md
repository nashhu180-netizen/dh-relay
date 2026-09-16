<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_22 复核触发改非终态「待复核」信号与节点内返工生命周期

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| RLT_22 | P1-RelayLight-开发方案 | [DevPlan §RLT_22](../../dev_plan/P1-RelayLight-开发方案.md#rlt_22--复核触发改非终态待复核信号与节点内返工生命周期) |

- **GitHub Issue**：[dh-relay #24](https://github.com/nashhu180-netizen/dh-relay/issues/24)（正文由本卡卡正文生成）
- **规划来源**：`RLT-A-09`（2026-09-15 晋级，续发 `HC-RL-A144`~`A150`、修订 A35/A65/A71/A107）。晋级记录 [`design/evidence/10-交叉审核记录-RLT-A09-复核触发信号.md`](../../design/evidence/10-交叉审核记录-RLT-A09-复核触发信号.md)；候选稿与三轮复核记录留在 [`design/drafts/`](../../design/drafts/)（不属 `designInputs[]`，不作施工 oracle）。
- **施工现场**：`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_22`，分支 `wt/RLT_22`，基线 `544ccdb`。
- **档位**：标准。**任务类型**：常规（`dh:task-type:v1 task=RLT_22 type=normal`）。
- **依赖**：`RLT_21`（DevPlan §3.1，第 1 批）。RLT_22 输入（F-008 与 `rlt12-win-01` 账本）已全部落盘，**不以 RLT_12 验收为门**（DevPlan §批次表第 1 批出口条件原文）。

## 目标 (Outcome)

把 RLT-A-09 裁定的修法落成程序与协议：在送审方与判定方同处一个节点的形态（W/C/X）里，把判定方的触发条件从终态 `done` 换成非终态的「待复核」信号——`on:review_ready:<送审方>` trigger 前置（A144）、`ready_for_review=` 送审信号的写入即校验合同（A145）、判定方封口的即时配对闸（A146）、`loss_stop()` 的第三套只投影计数（A147）、向后兼容与同节点混用（A148）、W/C/X 模板与两份 adapter 的封口纪律原文（A149）、lint 的 trigger 三态扩四态（A150）。判定角色闭集取 `{plan-reviewer, checker, reviewer}`。

## Zero-context 自查

施工 worker 进入本 worktree 后第一个 Git 动作执行 `git rebase --autostash master`，再读仓根 `AGENTS.md`、本文件、`task_plan.md`、`progress.md`、`findings.md`，以及 DevPlan §RLT_22 与 design/01 §11 的 `HC-RL-A144`~`A150`（oracle 逐字口径）。`task_plan.md` 的 Context Packet 列全了要读的来源与理由。DevPlan 决定允许路径与 normal Recipe，design/01 §11 是唯一 oracle；卡正文与 design/01 不一致时**不自行选边**，登记 `findings.md` 并停下交编排裁决（已知一处，见 findings F-003）。

## 完成条件 ★必写（逐字抄 DevPlan §RLT_22「验收口径」七条，本文件是只读副本）

> 口径权威在 DevPlan；本表逐字复制，口径变更以 DevPlan 为准、本文件跟改并在 `progress.md` 记一笔。七条**全部为机器证**，本卡无人判结果项。

| # | 完成条件（逐字） | 谁验 | 出处 |
|---|---|---|---|
| 1 | **机器证**｜来源：design/01 + `HC-RL-A144`｜`on:review_ready:<S>` 的拉起前置：写 `agent_launch <Rv>#<n>` 时本节点须存在一条 `checkpoint`，其 `agent` 为 `<S>` 的**当前实例** `<S>#<a>`、`ready_for_review=` 值**恰等于** `<Rv>`，且该 `checkpoint` 是该实例的**最新 agent 事件**；无信号、路由指向另一判定方、旧 attempt 的信号、被普通 `checkpoint` 覆盖、`blocked` 之后、`<S>` 已终态各一反例退 2 报 A144；重复 `agent_launch` 仍由 A58/A49 拦下，编号不串。 | AI | RLT_22 / [DevPlan §RLT_22](../../dev_plan/P1-RelayLight-开发方案.md#rlt_22--复核触发改非终态待复核信号与节点内返工生命周期) · [design/01 §11 `HC-RL-A144`](../../design/01-RelayLight-产品设计与验收.md) |
| 2 | **机器证**｜来源：design/01 + `HC-RL-A145`｜送审信号写入合同：`checkpoint` 的 `note` 含 `ready_for_review=` 时该前缀 token **恰好一个**（≥2 退 2，防 `_note_tokens` 静默保留首个）；`<Rv>` 须在**本节点** agent 表中且 `role` ∈ 判定角色闭集；写入者自身不得是判定角色；该 `checkpoint` 不伴随 `agent_launch`、attempt 不变；`add` 层**不设轮次硬上限**；`ready_for_review=` 不被 A69 的 helper token 扫描误命中。 | AI | RLT_22 / DevPlan §RLT_22 · design/01 §11 `HC-RL-A145` |
| 3 | **机器证**｜来源：design/01 + `HC-RL-A146`｜判定方封口配对闸，**执行位点是 agent `done` 的语义校验，不是 `node_close` 兜底**：当且仅当本节点存在指向该判定方的 ready 信号时生效；生效时 `done` 的 `note` 须含 `reviewed=<S>#<a>` 与 `ready_seq=<n>`，`<n>` 指向的事件须是 `checkpoint` 且其 `agent` **逐字等于** `<S>#<a>`、`ready_for_review=` 等于 `<Rv>`、为该组合下**最新**一条，且 `<S>#<a>` 已 `done` 且其 `seq` 早于本条；跨实例拼接、引用旧轮次、送审方未终态各一反例退 2 报 A146，且该 `done` 不落账。 | AI | RLT_22 / DevPlan §RLT_22 · design/01 §11 `HC-RL-A146` |
| 4 | **机器证**｜来源：design/01 + `HC-RL-A147`｜第三套止损计数**只投影、不拒写**：`loss_stop()` 新增 `review_rounds[(node, reviewer)]`（该组合下的 ready 信号条数，首轮计入）与 `review_exhausted`（条数 ≥ `limits.rework_max_rounds` 且该判定方在本节点仍无 `done`）；耗尽时 `LossStop.triggered` 为真，出口仍是 strategist 链 → 用户闸（A97/A114 不变）；超限后第 N+1 条 ready 仍被 `add` 接受且账本增行；`rework_max_rounds` 取 2 与 3 由**同一实现**得出正确停止点；三套计数互不叠加、互不重置。 | AI | RLT_22 / DevPlan §RLT_22 · design/01 §11 `HC-RL-A147` |
| 5 | **机器证**｜来源：design/01 + `HC-RL-A148`｜向后兼容：`on:done:<X>` 的 lint 与运行时语义与 A70 **逐字一致**，旧计划原样过 lint、旧账本原样重放逐条被接受；**R 模板与一切无 ready 信号的节点不受 A146 影响**（判定方直接写 `done` 被接受）；同一节点内混用 `on:done:` 与 `on:review_ready:` 两种 trigger 均被接受，两路各按自己的前置校验，反例编号不串。 | AI | RLT_22 / DevPlan §RLT_22 · design/01 §11 `HC-RL-A148` |
| 6 | **机器证**｜来源：design/01 + `HC-RL-A149`｜模板与 adapter 同步：`SKILL.md` 的 **X 模板**被打回那路 reviewer 的 trigger 由 `on:done:coder` 改为 `on:review_ready:coder`，**W 模板**按用户裁决同改（`plan-reviewer` 纳入判定角色闭集），**C 模板** trigger 列不改但补「PASS 前不记 `done`」纪律原文，**R 模板三行与现状逐字一致**；`SKILL.md` 硬规则段与两份 adapter 的监工模板各含「PASS 前双方均不记 `done`；FAIL 走 live 判定方的 `checkpoint` 路由回同一送审方；PASS 后按送审方→判定方顺序记终态」原文；另对 C 与 X 各跑最小账本序列，覆盖判定方 `agent_lost` 后按 A49 合法重拉并消费新信号、同实例 FAIL→PASS 无第二条 `agent_launch`、两路一 FAIL 一 PASS 互不干扰三种情形。 | AI | RLT_22 / DevPlan §RLT_22 · design/01 §11 `HC-RL-A149`（**两处措辞不一致，见 findings F-003，施工前须裁决**） |
| 7 | **机器证**｜来源：design/01 + `HC-RL-A150`｜lint 覆盖新 trigger：`trigger` 由三态扩为**四态**（空 / `on:blocked` / `on:done:<名字>` / `on:review_ready:<名字>`），非法值与引用不存在的 agent 名由 **A35 承接**拒绝，跨节点引用由 **A71 承接**拒绝；给没有同节点送审方的节点（R 形态）的 reviewer 写 `on:review_ready:coder` 被 A71 拒——这是 R 不适用本修订的机械证据。 | AI | RLT_22 / DevPlan §RLT_22 · design/01 §11 `HC-RL-A150` |

**同批承接的四条现有验收**（卡「实施提示」原文，owner 不变、不单列为完成条件）：A150 承接 A35/A71 的扩集与同节点约束；A147 承接 A107 的「两套→三套」；A65 命题不变、补一个 `on:review_ready:` 未触发的同款正例。

## 变更范围（逐字抄卡正文）

`relay_log.py` 的 `_require_trigger`（新增 `on:review_ready:` 分支，`on:done:` 分支不动）、lint 的 trigger 校验、`checkpoint` 与 agent `done` 的语义校验、`loss_stop`/`LossStop` 与按 `role` 取判定角色闭集的读取；`test_relay_log.py`；skill 五件中的 `SKILL.md`（W/C/X 模板与硬规则段）、两份 adapter、`dh-mapping.toml` 的 `[limits.on_exceed].note` 说明文字（「两套计数」改「三套」，键与取值不变）；本卡工作区。

## 允许路径（与卡 `dh:allowed-paths:v1 task=RLT_22` 逐条一致）

- `tools/relay-light/relay_log.py`
- `tools/relay-light/test_relay_log.py`
- `tools/relay-light/skill/**`
- `docs/modules/relay-light/workspace/RLT_22/**`

## 边界 (Boundaries)

**非目标（逐字抄卡正文）**：**不改 A2**（事件层 19 词白名单不动，信号复用 `checkpoint` + 类型化 token）；**不改 A62**（`status --json` 冻结 schema 不动，第三套计数只投影、不进 status）；**不改 A95**（C 的 checker 仍留空 trigger）；**不改 A102**（批内往返不加 attempt，其在新模型下成立由 A145 正例证明，不假定自动继承）。**不动 R 阶段模板**与 R 的复核收敛形态。不实现 `watch`（RLT_18）；不改 dev-harness；不改现役 Runner；**不对旧计划强制迁移**（lint 不对 `on:done:<X>` 报错、也不报建议迁移）。不豁免、不削弱 A49/A60/A70 中的任何一条：A49 与 A60 一字不改，A70 保号且语义不改，新前置另立 A144。不改 `roles.toml` 的角色表与模型绑定，不改 `dh-mapping.toml` 的键名与取值。

**补充边界（不覆盖卡正文，只写卡已蕴含的操作口径）**：

- `dh-mapping.toml` 只改 `[limits.on_exceed].note` 的说明文字，键与取值不动；`roles.toml` 零改动。
- 不改 `design/01`、DevPlan、`design/drafts/**`、`design/evidence/**`、其它卡工作区、`tools/tests/**` 与仓根入口文件。
- 不重跑真计划 `rlt12-win-01`；F-008 与账本只作**只读事实来源**，且它们目前在未合并分支 `wt/RLT_12` 上（见 findings F-001）。
- skill 改动后的**两侧重同步**（`python tools/relay-light/install_skill.py --all`）须先展示 `%USERPROFILE%` 解析后的两个绝对目标并取得**用户当次明确授权**，再执行，并记录命令、退出码、哈希与两份 manifest；未授权则停在仓内验证（A32 仍由 RLT_12 首步正式取证）。
- 何时必须停下问人：install_skill 两侧同步授权；卡正文与 design/01 冲突（findings F-003）；复核降级请求；P0/P1 三轮不收敛；E11 一次性本地收口授权包。测试绿、批次小审 PASS、复核 APPROVE 均不等于验收、verify、push、PR、CI 或合并。

## 触及子系统（收口时更新其 as-built）

- `parity-ledger`（`relay_log.py` 的 trigger 前置、事件语义校验、止损投影）
- `relay-light skill 协议`（`SKILL.md` W/C/X 模板与硬规则段、两份 adapter 监工模板、`dh-mapping.toml` 说明文字）
