<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_22 复核触发改非终态「待复核」信号与节点内返工生命周期

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：你是 RLT_22 的 construction worker，只处理本次派单指定的一个 Batch。进入 `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_22` 后第一个 Git 动作是 `git rebase --autostash master`；先读仓根 `AGENTS.md`、本文件、`brief.md`、`progress.md`、`findings.md` 与派单指定 oracle。只在 RLT_22 允许路径闭集内修改；跑偏只记 `progress.md` / `findings.md`，**不回头改本文件**，不改 DevPlan / design / drafts / evidence / 其它卡工作区，不自行复核、verify、push、PR、merge 或部署。

| ID | 来源 (path) | 为什么 |
|---|---|---|
| C-001 | 仓根 `AGENTS.md` | 七条宪章、worker 铁律、允许路径/复核/凭据边界；`relay-light 编排协议段`与 Runner 段互不交叉 |
| C-002 | `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` §RLT_22、§3.1 RLT_22 行、§批次表第 1 批 | 允许路径、任务类型 normal、依赖 RLT_21、实施提示（三个 token / 位点 / `_latest_for_instance` 三条硬约束） |
| C-003 | `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` §11 的 `HC-RL-A144`~`A150` | **唯一 oracle**：七条的命题与「怎么验」列逐字口径 |
| C-004 | 同上 §11 的 `HC-RL-A35` / `A65` / `A71` / `A107` 修订后原文 | 同批承接的四条；A150 承接 A35/A71，A147 承接 A107，A65 只补正例 |
| C-005 | 同上 §11 的 `HC-RL-A2` / `A49` / `A60` / `A62` / `A69` / `A70` / `A95` / `A102` / `A58` / `A97` / `A114` | 明确**不改**的边界与必须仍然生效的既有闸；反例要断言编号落在这些条上而不是新条 |
| C-006 | `tools/relay-light/relay_log.py` 的 `lint_plan`（`:509` 起，trigger 校验在 `:591`-`:603`）、`_runtime_plan`（`:1508`-`:1515`）、`append_event`（`:2097`-`:2105`） | **因果链关键**：`add` 经 `_runtime_plan` 走整份 `lint_plan`，lint 拒 = `add` 直接退 3。不先扩 lint 合法值集，带 `on:review_ready:` 的 fixture 计划连加载都过不了 |
| C-007 | 同文件 `_require_trigger`（`:1649`-`:1666`）、`_latest_by_name`（`:1588`）、`_latest_for_instance`（`:1597`） | 新分支落点；注意现行末两行是无守卫的 `spec.trigger.removeprefix("on:done:")`，新 trigger 若不先分流会**串进 on:done: 分支并误报 A70** |
| C-008 | 同文件 `_validate_runtime_event`（`:1854`）/ `_validate_event_semantics`（`:1864`）/ `_validate_agent_transition`（`:1783`）/ `_validate_node_close`（`:1835`） | A145/A146 的落点在前两者；迁移表（`:1821` 附近 `allowed`）与 `_validate_node_close` **不改** |
| C-009 | 同文件 `_note_tokens`（`:2203`-`:2213`）、`_decision_helper` / `_validate_decision_helper`（`:1668` 起） | 「首个同名 key 胜出」行为不改；三个新 token 不得进 A69 的 helper 扫描集 |
| C-010 | 同文件 `LossStop`（`:2541`-`:2560`）与 `loss_stop()`（`:2563`-`:2613`）；`Status` / `status_document`（`:2186` / `:2640` 起） | 第三套计数加在前者；后两者**零改动**（A62 冻结 schema） |
| C-011 | 同文件 `AgentSpec.role`（`:131`、`:446`） | 判定角色闭集是对 `roles.toml` 现有键的**引用**，按 `role` 列读取，不新增角色 |
| C-012 | `tools/relay-light/skill/SKILL.md`：W 模板 `:44`-`:56`、C 模板 `:57`-`:73`、R 模板 `:74`-`:88`、X 模板 `:89`-`:104`、硬规则段 `:204` 起 | A149 的改点与「R 三行逐字不变」的断言对象 |
| C-013 | `tools/relay-light/skill/references/adapter-claude-code.md`、`adapter-codex.md` | A149 要求两份 adapter 的监工模板各含同一段纪律原文 |
| C-014 | `tools/relay-light/skill/dh-mapping.toml` `[recipes.*]`（`:14`-`:21`）与 `[limits]` / `[limits.on_exceed]`（`:23`-`:33`） | `rework_max_rounds=2`；`[limits.on_exceed].note` 的「两套计数」改「三套」，**键与取值不动** |
| C-015 | `tools/relay-light/skill/roles.toml` | 判定角色闭集 `{plan-reviewer, checker, reviewer}` 的存在性依据；本文件**零改动** |
| C-016 | `tools/relay-light/test_relay_log.py` 的 `SkillTemplateTests`、`test_attempt_and_x_loss_stops_trigger_independently`、`test_trigger_values_and_same_node_done_references_are_checked`、`test_runtime_trigger_and_dependency_gates`、`test_node_close_ignores_an_untriggered_agent`、`test_a102_checkpoint_round_trips_do_not_burn_attempts`、`test_agent_launch_requires_node_start_and_terminal_agents_are_sealed` | 现有用例的影响分类（见下「现有用例影响分类」）；最后一条**保持原样**，它正是「未削弱 A60/A78」的回归证据 |
| C-017 | **只读事实来源（在未合并分支 `wt/RLT_12` 上，禁止修改）**：`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12\docs\modules\relay-light\workspace\RLT_12\findings.md` 的 **F-008**；同树 `docs/modules/relay-light/relay/rlt12-win-01/relay_log.jsonl` 的 seq **16 / 19 / 20 / 21**（C1：coder#1 done → scribe#1 done → checker#1 done 且结论 FAIL p1=3 → node_close 记「节点内无合法返工路径」）与 seq **25 / 26 / 27 / 29**（C2：live checker#1 三条 `routed_to=coder#1` 的 `checkpoint` 路由返工 → PASS） | 三规则互锁的实证与「PASS 前谁都不记 done」绕法的实证；**不重跑真计划**，只读引用。A148 的旧账本重放正例即取自该账本 |
| C-018 | `docs/modules/relay-light/design/drafts/A09-复核触发信号与返工生命周期修订候选.md`（v3）§3.5/§3.6/§3.7/§5.3/§7 与 `A09-复核记录-fresh-01.md` | **背景读物，非 oracle**（不属 `designInputs[]`）。价值在「复核驳回过哪些思路」——见下「别重走的弯路」 |
| C-019 | `docs/modules/relay-light/design/evidence/10-交叉审核记录-RLT-A09-复核触发信号.md` | 用户 2026-09-15 的六项裁决原文与「裁决之外一律未授权」的停止线 |
| C-020 | `docs/modules/relay-light/workspace/RLT_10/`（已合入标准档样式） | 七件套写法、证据账本 E-ID 文法、批次小审 check 文件形态 |

## 全程允许路径闭集与禁改项

只允许修改：

- `tools/relay-light/relay_log.py`
- `tools/relay-light/test_relay_log.py`
- `tools/relay-light/skill/**`
- `docs/modules/relay-light/workspace/RLT_22/**`

禁止修改 `design/**`（含 drafts、evidence）、DevPlan、`AGENTS.md`/`CLAUDE.md`、`tools/tests/**`、`tools/relay-light/install_skill.py`、其它任何卡的工作区、RLT_12 工作树内的任何文件。若 oracle 要求的行为必须改禁改路径才能满足，**登记 finding 并发 `BLOCKED`，不得自行选边**。

## 六条必须照做的实现硬约束（卡「实施提示」+ design/01 原文，逐条不得改写）

1. **三个 token 沿用 `_note_tokens` 解析**：`ready_for_review=` / `reviewed=` / `ready_seq=` 都是 note token，**不新增账本字段、不动事件层 19 词白名单（A2）、不动 `_validate_agent_transition` 的迁移表**。事件名仍是 `checkpoint` 与 `done`。
2. **A146 落在 agent `done` 的语义校验一线**（`_validate_runtime_event` / `_validate_event_semantics`），**不落 `_validate_node_close`**——后者只在关节点兜底，实现不了即时拒绝。A146 的「位点证明」验收要求：错误在写 `done` 时返回，且该 `done` 不落账、账本行数不变。
3. **新校验一律用 `_latest_for_instance`，不得用按名跨 attempt 的 `_latest_by_name`**——这是复核 attempt 2 的 P1-2 病根（旧 attempt 重放、被普通 `checkpoint` 覆盖、`blocked` 之后三种序列都会被误放行）。既有 `on:done:` 分支里对 `_latest_by_name` 的使用**保持原样**，不顺手统一。
4. **`_note_tokens` 的「首个同名 key 胜出」行为不改**，改为在**写入侧**禁止重复 token（A145：`ready_for_review=` 前缀 token ≥2 直接退 2），避免静默丢失。
5. **A62 / A95 / A102 / A2 零改动**：不给 `status --json` 加字段、不给 C 的 checker 加 trigger、不动批内往返的 attempt 语义、不动事件词表。A102 在新模型下成立**由 A145 的正例显式证明，不得假定自动继承**。
6. **A49 / A60 / A70 不豁免不削弱**：A49、A60 一字不改；A70 保号且 `on:done:` 分支语义一字不动，新前置另立 A144。反例要断言编号**不串**（重复 `agent_launch` 报 A58/A49 而非 A144；终态后挂事件仍报 A60）。

## 别重走的弯路（复核已驳回，附理由）

| 被驳回的思路 | 驳回理由（来源） |
|---|---|
| 新增第 20 个事件词 `ready_for_review` | 用户裁决 1：复用 `checkpoint` + 类型化 token；改事件词要同批改 A2 与其单测，改动半径大得多 |
| 用节点 `close` 列指向的 agent 当判定方 | fresh-01 P1-1：R 的 `close=agent:scribe` 是收敛者、C 的 `close=agent:checker` 又与空 trigger 并存，配对键不成立；**改按 `role` 列判定** |
| A146 放进 `_validate_node_close` 兜底 | fresh-01 P1-1：`node_close` 无法即时拒绝一条错误的 `done`，位点不成立 |
| 把 R 的 reviewer 改成 `on:review_ready:coder` / 在 R 节点写 `checkpoint coder#1` | attempt 2 P1-1：R 模板只有多路 reviewer + scribe，无同节点 coder；会被 A71（跨节点引用）与 A59（agent 不在本节点表）两道现成闸直接拒。**R 模板一字不改**，这条反而是 A150 要断言的机械证据 |
| A144 只要求「本节点存在一条匹配 ready 信号」 | attempt 2 P1-2：`_latest_by_name` 跨 attempt 取最新，三种序列会被误放行。**必须绑定当前实例 + 该实例最新 agent 事件** |
| A147 在第 N+1 条 ready 处拒写 / 断言 `git diff` 对 `relay_log.py` 为空 | fresh-01 P1-3：与 A145「`add` 不设硬上限」自相矛盾；且本条本身就要改该程序，空 diff 断言不可能成立。**只投影、不拒写** |
| 把 ready 集合暴露进 `status --json`（新增 `review_ready` 字段） | fresh-01 P2-3 + attempt 2 CLOSED：现有两套计数同样不进冻结 schema，单给第三套开通道是「伪半实现」；A62 保持不变 |
| 把「现有用例会失效」清单整体当「必失败」 | fresh-01 P2-1：给 `LossStop` **增加**字段不会让 `test_attempt_and_x_loss_stops_trigger_independently` 的既有属性断言失败，那条只需**补第三计数断言** |

## 现有用例影响分类（`tools/relay-light/test_relay_log.py`）

| 用例 / 用例组 | 分类 | 说明 |
|---|---|---|
| `SkillTemplateTests` 的模板精确 trigger fixture | **断言将失败** | W 与 X 模板的 trigger 默认值确实改了；C 的 trigger 列与 R 三行不动，其断言应保持绿 |
| `test_attempt_and_x_loss_stops_trigger_independently` | **仅补第三计数断言** | 增加 `LossStop` 字段不破坏既有属性断言；与 A107 共用 fixture |
| `test_trigger_values_and_same_node_done_references_are_checked` | 仅补正反例 | 扩集后旧断言仍成立，补四态正例与新反例 |
| `test_runtime_trigger_and_dependency_gates` | 仅补正反例 | 新增 `on:review_ready:` 分支覆盖 |
| `test_node_close_ignores_an_untriggered_agent` | 仅补正例 | A65 命题不变，补 `on:review_ready:` 未触发的同款 |
| `test_a102_checkpoint_round_trips_do_not_burn_attempts` | 仅补正例 | 扩一个带 `ready_for_review=` token 的往返正例，命题不改 |
| `RelayStatusProjectionTests` 的精确 key 集合断言 | **不受影响** | A62 schema 不动；若它变红说明误改了 status，属实现越界 |
| `test_agent_launch_requires_node_start_and_terminal_agents_are_sealed` | **保持原样** | A60/A78 的回归证据，正是用来证明本次未削弱终态封口 |

## 批次切法（本卡提案：3 批，按程序行为的因果链切，不按条数平分）

> 原则：一个可独立验证的功能点 = 一批；本卡派 headless worker，过程不可见，分批检查点有真实价值。每批结束先跑本批测试与全量回归，再派 fresh 小审只看本批 diff，findings/progress 记问题与证据后才进下一批。

| 批 | 承接验收编号 | 一句话功能点 | 对应 check 文件 |
|---|---|---|---|
| **B1** | `A150`（承接 `A35` / `A71`） + `A145` | trigger 词表扩为四态并让 lint/加载链接受新前缀；`checkpoint` 送审信号的**写入侧**合同成立 | `check.B1.md` |
| **B2** | `A144` + `A146` | 死锁解法的两端：**拉起前置**（launch-time）与**封口配对闸**（done-write-time） | `check.B2.md` |
| **B3** | `A147`（承接 `A107`） + `A148` + `A149`（附 `A65` 补例） | 止损第三套只读投影 + 向后兼容与混用回归 + 模板/adapter/说明文字同步 | `check.B3.md` |

**为什么不按「程序侧 A144~A147 / 模板与 lint 侧 A148~A150」两批切**——两条具体理由：

1. **会造成循环依赖。** `add` 经 `_runtime_plan()` 跑整份 `lint_plan()`，lint 报错即 `add` 退 3（`relay_log.py:1508`-`:1515`、`:2097`-`:2105`）。A150 的四态扩集若排在第二批，第一批 A144 的任何 fixture 计划（agent 表里写着 `on:review_ready:coder`）在**加载阶段**就被 A35 拒，A144 的正例根本跑不起来。lint 扩集必须在最前。
2. **会把 F-008 的解法劈成半成品中间态。** A144 只解「拉得起来」，A146 才解「封得了口」。两者分批会留下一个可提交的中间版本：判定方能被非终态信号拉起，但封口仍无配对约束，送审方与判定方的终态顺序无人管——这正是 F-008 想根治的那类不变量缺口。它们是同一功能点的两端，必须同批。

**A148/A149 为什么必须垫底**：A148 的旧账本 71 行原样重放、A149 的 C/X 最小账本序列，都要跑在 A144~A147 全部到位之后才产生有效证据；提前跑只能证明「当前实现没变」。

## 施工步骤 (Steps)

### Batch 1 — trigger 四态扩集 + 送审信号写入合同（A150 / A145，承接 A35、A71）

**改动文件**：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`，以及本卡 `progress.md` / `findings.md` / `lesson_candidates.md`。

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 1.1 | Test · `test_relay_log.py` | 在 `RelayPlanLintTests` 扩 `test_trigger_values_and_same_node_done_references_are_checked`（或并列新方法）：四态各一正例（空 / `on:blocked` / `on:done:<名> `/ `on:review_ready:<名>`）；反例 `on:review_ready:nobody` 断言 A35、跨节点引用断言 A71、拼写变体 `on:review-ready:` 断言 A35；**R 形态反例**——给一个没有同节点送审方的节点的 reviewer 写 `on:review_ready:coder`，断言被 **A71** 拒 | `python -m unittest -v tools.relay-light.test_relay_log.RelayPlanLintTests` → 新增用例 RED（正例报 A35「invalid trigger」） |
| 1.2 | Modify · `relay_log.py:591`-`:603` | 把 `prefix = "on:done:"` 的单前缀判断改为四态分流：合法前缀集合 `{"on:done:", "on:review_ready:"}`，任一前缀的**名字段非空**；`unknown trigger agent` 仍报 A35；同节点约束（现 `on:done must reference the same node`）覆盖两种前缀、仍报 A71。**空 / `on:blocked` 分支与 A35/A71 的既有报错文案语义不变** | 同 1.1 命令 → GREEN；另跑 `python -m unittest tools.relay-light.test_relay_log` 全量，断言无既有用例转红 |
| 1.3 | Modify · `relay_log.py:1649`-`:1666` `_require_trigger` | **在** `target = spec.trigger.removeprefix("on:done:")` **之前**插入 `on:review_ready:` 分支的分流入口（本批只做分流占位：识别前缀后暂按「该 trigger 的前置由 B2 的 A144 承接」处理，不得让它掉进 `on:done:` 分支）。`on:done:` 分支**一行不动** | 构造一个带 `on:review_ready:` 的合成 plan 跑 `add`，断言**不再**出现 `HC-RL-A70 agent <名> requires done:on:review_ready:<名>` 这类串味报错 |
| 1.4 | Test · `test_relay_log.py` | A145 合同用例：合法一例被接受；四反例各退 2 报 **A145**——同一 note 两个 `ready_for_review=` token、`<Rv>` 不在本节点 agent 表、`<Rv>` 的 `role` 不在判定角色闭集、判定角色给自己送审；正例断言该 `checkpoint` **不伴随 `agent_launch`、attempt 恒为 1**；连续 N 条信号（N > `rework_max_rounds`）均被 `add` 接受（`add` 层不设硬上限）；同 note 内 `ready_for_review=` 与 `decider=` 并存时断言 **A69 只认后者** | `python -m unittest -v tools.relay-light.test_relay_log` → 新增用例 RED |
| 1.5 | Modify · `relay_log.py` `_validate_event_semantics`（`:1864` 一线） | 新增 `checkpoint` 的 ready 信号写入校验：按 `_note_tokens` **之外**再做一次原始 note 的 `ready_for_review=` 前缀 token 计数（因为 `_note_tokens` 只留首个，计数必须在原始串上做）；读 `AgentSpec.role` 判定 `<Rv>` 与写入者是否属闭集 `{plan-reviewer, checker, reviewer}`。**`_note_tokens` 本身零改动** | 同 1.4 命令 → GREEN；全量回归绿 |
| 1.6 | Record · `progress.md` | 每条结论登记 E-ID（命令 + 退出码 + 关键输出）；跑 `git diff --check`、四集合允许路径核对（`git diff --name-only master...HEAD`、working tree、index、untracked），只暂存点名文件，commit scope 用英文 `relay-light` | `git diff --check` 无输出；四集合反选允许路径无越界 |

**批次检查点 B1**：跑 `python -m unittest tools.relay-light.test_relay_log`（全量）+ `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`，派 fresh 小审只看本批 diff，结论写 `check.B1.md`，问题按 P 级进 `findings.md`。未 PASS 不得开 B2。

### Batch 2 — 拉起前置 + 封口配对闸（A144 / A146）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 2.1 | Test · `test_relay_log.py` | A144：合法一例被接受；**九条拒绝例**各断言退 2 且编号为 A144——`<S>` 只有不带 token 的普通 `checkpoint`／`<S>` 在本节点无任何事件／`<S>` 已 `done`／已 `agent_lost`／已 `cancelled`／token 指向另一判定方（`ready_for_review=requirement` 却拉 `lesson`）／旧 attempt 重放（`coder#1` 发信号后 `agent_lost`，`coder#2` 重拉 live，用旧信号拉起）／信号被后续普通 `checkpoint` 覆盖／信号之后写了 `blocked`。另断言同一 `<Rv>` 的重复 `agent_launch` 由 **A58/A49** 拦下，编号**不是** A144 | `python -m unittest -v tools.relay-light.test_relay_log` → RED |
| 2.2 | Modify · `relay_log.py` `_require_trigger` 的 `on:review_ready:` 分支 | 实现四项前置：①本节点存在一条 `checkpoint`，其 `agent` 为某完整实例 `<S>#<a>`、note 的 `ready_for_review=` 值**恰等于** `<Rv>`；②`<S>#<a>` 是 `<S>` 在本节点的**当前实例**（该名下最大 attempt）；③该 `checkpoint` 是 `<S>#<a>` **这个实例的最新 agent 事件**——**用 `_latest_for_instance`，禁用 `_latest_by_name`**；④由③得 `<S>#<a>` 未终态，仍显式声明。任一不成立 `raise _error("HC-RL-A144", ...)` | 同 2.1 → GREEN；全量回归绿 |
| 2.3 | Test · `test_relay_log.py` | A146：正序一例被接受；**七条反例**各退 2 报 A146——缺 `reviewed=`／缺 `ready_seq=`／`ready_seq` 指向旧轮次信号／指向他人信号／跨实例拼接（`ready_seq` 指向 `coder#1` 的信号而 `reviewed=coder#2`）／`<S>#<a>` 尚未终态／`<S>#<a>` 为 `agent_lost`；**不生效正例**：节点内无任何指向该 reviewer 的信号时 reviewer 直接写 `done` 被接受；**多路正例**：X 节点两路各绑各的 `ready_seq`，一路两轮一路一轮，两路 `done` 均被接受；**位点证明**：断言错误在写 `done` 时返回而非等到 `node_close`，且该 `done` 不落账、**账本行数不变** | 同上 → RED |
| 2.4 | Modify · `relay_log.py` `_validate_event_semantics`（agent `done` 一线） | 实现配对闸：**生效条件**=本节点存在至少一条指向该判定方的 `ready_for_review=` 信号（无信号则完全不设闸）；生效时校验 `note` 含 `reviewed=<S>#<a>` 与 `ready_seq=<n>`，`<n>` 指向的事件是 `checkpoint` 且其 `agent` 字段**逐字等于** `<S>#<a>`、`ready_for_review=` 等于 `<Rv>`、是 `(node, <S>#<a>, <Rv>)` 组合下最新一条，且 `<S>#<a>` 已 `done` 且 `seq` 早于本条。**落点不得是 `_validate_node_close`**；`_validate_node_close` 与 `_validate_agent_transition` 的迁移表零改动 | 同 2.3 → GREEN；全量回归绿 |
| 2.5 | Record · `progress.md` | 同 1.6 | 同 1.6 |

**批次检查点 B2**：同 B1，结论写 `check.B2.md`。本批是 F-008 的实际解法，小审重点核「反例编号不串」「位点在 done-write-time」「实例绑定用 `_latest_for_instance`」三项。

### Batch 3 — 止损第三套投影 + 向后兼容 + 模板/adapter 同步（A147 / A148 / A149，附 A65 补例）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 3.1 | Test · `test_relay_log.py` | A147：`rework_max_rounds` 取 **2 与 3** 两种配置，**同一实现**分别断言耗尽发生在第 2 条与第 3 条未通过的信号处；断言超限后第 N+1 条 ready 仍被 `add` 接受且**账本增行**；断言耗尽后 strategist 链可正常以 `escalate` 起头；断言三套计数互不叠加、互不重置（与 A107 共用 fixture）。另在 `test_attempt_and_x_loss_stops_trigger_independently` **只补**第三计数断言 | `python -m unittest -v tools.relay-light.test_relay_log` → RED |
| 3.2 | Modify · `relay_log.py:2541`-`:2613` | `LossStop` 加 `review_rounds: dict[tuple[str, str], int]`（或等价可比较键）与 `review_exhausted: tuple[...]`；`loss_stop()` 统计该组合下 ready 信号条数（**首轮计入**），耗尽判据=条数 ≥ `limits.rework_max_rounds` **且**该判定方在本节点仍无 `done`；`triggered` 纳入第三套。**`Status` 与 `status_document` 零改动**，不新增配置键、不改取值 | 同 3.1 → GREEN；另跑 `RelayStatusProjectionTests` 断言 `status --json` 顶层键集合**未变** |
| 3.3 | Test · `test_relay_log.py` | A148：`rlt12-win-01` 的 `relay_plan.md` 原样过 lint 且退 0；该计划账本 **71 行原样重放**，断言逐条被接受、R 段不触发 A146；一份**混用**两种 trigger 的合成 plan 过 lint 并跑通一条完整账本，`on:done:` 那路按 A70 判、`on:review_ready:` 那路按 A144 判，各构造一个反例断言**编号不串**。另 A65 补例：`on:review_ready:` 未触发的 agent 不算悬空 | 同上 → RED → GREEN |
| 3.4 | Modify · `skill/SKILL.md` | **X 模板**（`:89`-`:104`）被打回那路 reviewer 的 trigger `on:done:coder` → `on:review_ready:coder`；**W 模板**（`:44`-`:56`）plan-reviewer 的 `on:done:builder` → `on:review_ready:builder`；**C 模板**（`:57`-`:73`）trigger 列**不改**，补「PASS 前不记 `done`」纪律原文；**R 模板（`:74`-`:88`）一字不改**；硬规则段（`:204` 起）加原文「PASS 前双方均不记 `done`；FAIL 走 live 判定方的 `checkpoint` 路由回同一送审方；PASS 后按送审方→判定方顺序记终态」 | `SkillTemplateTests` 由 RED 转 GREEN；**单独断言 R 三行与改前逐字一致**（`git diff` 对 R 段为空） |
| 3.5 | Modify · `skill/references/adapter-claude-code.md`、`adapter-codex.md` | 两份 adapter 的监工模板各补同一段纪律原文（与 3.4 逐字同一段） | 结构检查用例断言三处（SKILL.md 硬规则段 + 两份 adapter）各命中该段原文 |
| 3.6 | Modify · `skill/dh-mapping.toml` `[limits.on_exceed].note` | 说明文字「两套计数」改「三套」并补第三套一句；**键名与取值（`rework_max_rounds=2`、`attempt_max=3`、`action`）一字不动**；`roles.toml` 零改动 | `git diff tools/relay-light/skill/dh-mapping.toml` 只落在 note 文本行；配置加载用例全绿 |
| 3.7 | Test · `test_relay_log.py` | A149 ②最小账本序列：对 **C 与 X**（卡正文口径；design/01 另写 W/C/X，**以 findings F-003 的裁决为准**）各跑一条合成账本，覆盖——判定方 `agent_lost` 后按 A49 合法重拉并消费新信号；同一实例 FAIL→PASS，断言**无第二条 `agent_launch`**；X 两路一 FAIL 一 PASS，另一路不被重拉也不被提前封口 | 同上 → GREEN |
| 3.8 | Record · `progress.md` | 同 1.6；另按卡「实施提示」处理 skill 两侧重同步：**先展示 `%USERPROFILE%` 解析后的两个绝对目标并取得用户当次明确授权**，再 `python tools/relay-light/install_skill.py --all`，记录命令、退出码、最终哈希与两份 manifest；**未授权则停在仓内验证**，不得自行执行 | 授权链与命令输出逐条入 `progress.md` 证据账本 |

**批次检查点 B3**：全量 `python -m unittest tools.relay-light.test_relay_log` + `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`，结论写 `check.B3.md`。三批小审全闭合且编排明确重派后，才发 `CONSTRUCTION_DONE`，进 normal Recipe 复核。

## 每批共通约束

- 先写会失败的测试钉住期望行为，再最小实现转绿；导入失败、路径错误、fixture 错误、解释器缺失都**不是**有效 RED。
- 每个证据先登记 `progress.md` 证据账本再被引用，禁止悬空描述符。
- 每批跑：本批目标用例 → 全量 `test_relay_log.py` → `run-relay-tests.ps1` → `git diff --check` → 四集合允许路径核对。
- 每批只暂存点名文件，禁止 `git add -A` / `git add .`。
- 小审只读检查本批 diff 与证据并写独立 `check.B*.md`；施工方不得修改小审结论或 `review.md` 的复核结论。
- 密钥/凭据值不入任何工件；两侧同步的目标路径展示按白名单口径给绝对路径，不贴环境变量转储。

## 关键决策（一句话各一行）

- Worktree：是，分支 `wt/RLT_22`，目录 `.dh-worktrees/RLT_22`，基线 `544ccdb`。
- 派子 agent：是——施工按 B1/B2/B3 逐批派 headless worker；每批另派 fresh 小审；normal Recipe 三路复核另派，施工者不复核自己的卡。
- Review：normal Recipe 三路（代码轮 1 / 需求方向 / 教训）+ 模板要求的一致性路；本卡**不带** `dh:review-policy:v1` 与 `dh:review-scope:v1` marker，故代码复核按存量路径走，路数口径争议见 `findings.md` F-005，由编排/用户裁决，施工方不自行降路。
- TDD：适用且强制（程序 + 测试任务），每批五拍循环；模板/adapter 的纯文本改动以结构检查用例承接，不豁免。
