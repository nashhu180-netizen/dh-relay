<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_05 status/生命周期与配置/Recipe/止损

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：你是 RLT_05 手动派活的 construction worker，只处理本次派单指定的一个 Batch。进入主控给定的精确 RLT_05 worktree 后，第一个 Git 动作是 `git rebase --autostash master`，并核对基线包含 RLT_03 完成提交。先读本文件、`brief.md`、`progress.md`、`findings.md`、DevPlan RLT_05 卡和下列 Context。RLT-A-06/RLT-B-06 已正式闭合，2026-09-11 用户已另行授权 D-start；**本次只开放 Batch 1**。路线偏离只记 `progress.md`，不回写本文件。不改 DevPlan 状态，不自行复核、验证、验收、commit、merge、push 或 deploy。

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `AGENTS.md` | 手动 worker、durable signal、密钥与 worktree 纪律 |
| C-002 | `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` §RLT_01/05/07、§4、§8.3 | DevPlan 权威决定 owner、任务边界、依赖、allowed-paths、heavy 与跨卡守恒 |
| C-003 | `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` §2–§2.3 | roles、机械分路、Recipe 来源与角色边界 |
| C-004 | 同上 §3.1–§3.5 | CLI、事件、阶段结果、status schema、排序、错误与 lint 映射 |
| C-005 | 同上 §5.1–§5.3 | 阶段实例、同卡串行/跨卡并行、收尾偏序与 closable |
| C-006 | 同上 §6.1–§6.3 | 配置定位、TOML 完整样例、Recipe/limits 权威值 |
| C-007 | 同上 §7.3、§9.1–§9.3 | attempt/X 独立止损、checker 可选、blocked/strategist 场景 |
| C-008 | 同上 §10.1–§10.3 | 完整 plan/ledger/status 样张；A43 必须逐行对齐完整 §10.3，不只核六项子集 |
| C-009 | 同上 §11 中 RLT_05 当前 25 个 HC-RL 行 | design §11 是逐条 oracle 原文与证法；DevPlan 只定 owner 与边界 |
| C-010 | `docs/modules/relay-light/workspace/RLT_03/` 七件套 | 已完成基线、placeholder 交接、有效红与 worker 边界格式 |
| C-011 | `tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py` | 当前接口；`_status_command()` 是 RLT_05 明示 placeholder |
| C-012 | `workspace/RLT_05/reviews/task-plan-review-opus.md`、`task-plan-decisions-fable.md` | 只读审查输入；结论仅在本轮主控裁决明确接受/驳回后才进入本计划 |

## RLT-A-06 / RLT-B-06 合同闭合

| 原缺口 | 正式结论 | 施工归属 |
|---|---|---|
| H1 | A117 owner 已转 RLT_07；本卡保留 A116 的运行时 reviewer 集合校验 | RLT_05 不实现 SKILL.md 来源规则 |
| H2 | A91/A108 已退役并拆分 A131～A134 | A131→Batch 1；A134→Batch 2；A132/A133→RLT_07 |
| H3 | 三 CLI 均接 `--config-dir`；显式优先，无显式值走单侧自动、双侧/零侧 exit 3；路径规范化并百分号编码入账 | A135→Batch 1；A99→Batch 4 只复算 |
| H4 | 其它结构合法、唯一 X 超限时 lint 精确报 A97 | A97→Batch 4 |

B06 落盘后曾处于 `blocked-by-D-start-authorization`；用户随后在对话中明确回复“后者，继续”，独立 D-start 闸已解除。此授权只开放 Batch 1，不授权后续 Batch、复核、commit、verify、merge、push 或 deploy。

## 全程允许路径闭集与禁改项

允许修改/创建且仅允许以下路径：

1. `tools/relay-light/relay_log.py`
2. `tools/relay-light/test_relay_log.py`
3. `tools/relay-light/skill/roles.toml`
4. `tools/relay-light/skill/dh-mapping.toml`
5. `docs/modules/relay-light/workspace/RLT_05/**`

禁止修改 DevPlan、design、as-built、AGENTS、安装器、测试薄壳、用户级 skill 副本与其他卡工作区。禁止创建 `SKILL.md`、adapter、阶段模板、watch、plan-amend 白名单实现；禁止新增公共 CLI 子命令、依赖、锁、临时替换或 Herdr 控制。若正式 oracle 只能越界满足，写 findings 与结构化 `DONE status=BLOCKED` 后立即停止。

## 基线、依赖与跨卡守恒

- 当前任务 worktree 基点为完整 SHA `1bea79fe18271b3b0b45c8d5dc6cc8993bfbf57d`；RLT-A-06/RLT-B-06 正式工件是该基点之上的未提交 WIP，施工时必须重新审计 master，不把基点 SHA 误称为包含本轮 WIP 的提交。
- 正式依赖维持 RLT_05 仅依赖 RLT_03；**驳回** Fable D6“RLT_05 增依赖 RLT_01”。DevPlan 已写“下一步 RLT_05”且批 1 可独立，RLT_05 allowed-paths 明确允许两 TOML，RLT_01 非目标是不写业务内容。
- 跨卡守恒：RLT_05 先创建两 TOML；RLT_01 后开时先 rebase 已完成的 RLT_05，只补 `SKILL.md`、两 adapter、安装器与测试，不覆盖、不回退两 TOML；RLT_07 等 RLT_01/RLT_05 后写齐业务 skill。
- 卡内 Batch 1 → 2 → 3 → 4 严格串行。每批是新的手动派单；每批内部固定“行为断言红 → 最小实现 → 批内绿 → diff 边界 → progress 结构化 DONE → 立即停止”。批次小审由主控在 worker 停止后另派并决定是否开放下一批。

## 手动派活 durable signal（四批统一）

每批 worker 在 `progress.md` 日志表追加一行，并在证据账本追加对应 E-ID；日志“下一步”字段使用以下固定结构，随后立即停止，不等待 `node_closed`：

```text
DONE task=RLT_05 batch=<1|2|3|4> status=<READY_FOR_REVIEW|BLOCKED|CONSTRUCTION_DONE> evidence=<E-ID,...> next=main-controller
```

- Batch 1–3 正常完成用 `READY_FOR_REVIEW`；Batch 4 正常完成用 `CONSTRUCTION_DONE`；阻塞用 `BLOCKED` 并写 reason/finding。
- 小审者只回填 `review.md` 的对应批次行与独立报告，不修代码。后续 Batch 必须由主控重新派发，原 worker 不持续等待、不自行续做。

## 施工共通约束

- Python ≥3.11、仅标准库 `tomllib`；沿用现有类型与公开调用，可增内部 dataclass/helper，函数名只作建议、不锁死。
- 三个现有子命令 `add` / `status` / `lint` **各有**同名可选 `--config-dir <dir>`，三者共用 resolver 与 `load_config`；子命令集合仍精确为三项。
- `lint_plan`/runtime 路径必须收到已加载配置；禁止 `config=None` 静默跳过 A116/A97。默认目录严格按 design §6.2.1 五情形实现；显式 `~/...` 必须展开、规范化为绝对路径，并在 `plan_loaded.note` 中百分号编码记录。
- status 每次从当前 plan + 完整 ledger 重新派生，不缓存、不写账、不驱动动作；`suggested_action` 只是建议。
- 拒绝测试同时断言 exit code、稳定 HC-ID、stderr/stdout 与 ledger 字节不增。有效红必须命中行为断言；import/fixture/setup/TypeError/语法错误不算。
- 既有行为已正确时允许登记 `late-added discriminator`，必须写清旧行为、实际拒绝编号和新断言的判别对象，不伪造红。
- 每批都跑 focused 与全文件 unittest，保留 RLT_03 回归；每批更新 `progress.md`，coder 只在 `findings.md` / `lesson_candidates.md` 追加事实。

## 施工步骤 (Steps)

### Batch 1 — 配置解析/定位 + 三 CLI 接线 + per-R Recipe lint（A131/A135/A92/A115/A116）

**功能单元**：建立两份协作配置，三个 CLI 通过同一 resolver/load_config 获取配置，结构 lint 之后按每个活跃 R 实例核对 reviewer 集合。

| 项 | 冻结内容 |
|---|---|
| Modify/Create/Test | Modify `tools/relay-light/test_relay_log.py`、`tools/relay-light/relay_log.py`；Create `tools/relay-light/skill/roles.toml`、`dh-mapping.toml`；Record RLT_05 workspace。 |
| 目标接口/结构 | 建议但不锁名：`RelayConfig(roles, stages, recipes, limits, config_dir)`、`load_config(config_dir)`、`resolve_config_dir(explicit, home)`；add/status/lint argparse 各接 `--config-dir`，共用加载结果。TOML 值逐字采用 design §6.3。 |
| resolver 合同 | 显式路径优先并展开 `~`，规范化为绝对路径；默认分支只存在 Claude/Codex 一侧目录时取该侧，两侧均有或均无时 exit 3、错误 A135 且账本不增；不合并、不跨目录比较、不读仓内源作默认。实际目录在 `plan_loaded.note` 百分号编码。显式目录缺失/坏配置 fail closed。 |
| A116 合同 | 对**每个活跃 R stage_id**分别取其节点上 `role == "reviewer"` 的 agent 行，reviewer 路径名唯一取 `agent` 列。plan 无 R 实例，或某 R 实例 reviewer 数为 0，均不触发 A116；一旦 ≥1，集合必须精确等于 recipe 配置。结构 lint（A24/A104/A129/A87/A75/A47/A35 等）先于 A116。 |
| 旧 fixture 对齐 | `run_cli`/`run_add` 等 helper 逐条显式带受控 `--config-dir`；因 A116 新增而需改 recipe/reviewer 行的 fixture 每条在 progress 登记旧用途、改动和预期原 HC-ID。A129 负例的 `agent=reviewer` 政名为 `requirement`；A43 的 §10.1 摘录 fixture 补 normal 的 `requirement`/`lesson` 两行。不得笼统写“fixture 修正”。 |
| 先红断言 | 三 CLI 尚不接受 flag；显式优先与五情形未实现；含空格/非 ASCII HOME/USERPROFILE 的 `~/...` 未规范化编码；两 TOML/loader 缺失；三档每 R 实例集合不能校验；normal 多挂 code-round2 未报 A116；两个 R 实例中只一实例错配未拒；结构错误被 A116 抢先报错。至少 A131/A135/A92/A115/A116 各有判别性覆盖。 |
| 实现约束 | reviewer/limits/角色集合不写死进 Python；配置失败不降级。无 R/零 reviewer 的豁免不扩为跳过其他 lint。A131 只验 roles.toml 的 11 个角色与 model/launch；模板无硬编码模型的 A132 归 RLT_07。 |
| 命令与预期 | focused 红：exit 1 且命中行为断言；实现后 `python3 -m unittest tools/relay-light/test_relay_log.py -v` exit 0。两 TOML 用 `tomllib` 解析 exit 0。顶层 help 仍仅 `{add,status,lint}`，三个子命令 help 各显示 `--config-dir`。 |
| 边界 diff | 仅两 Python、两 TOML、RLT_05 workspace；不得含 status 投影、add 阶段偏序、X planner、模板/watch/plan-amend。`git diff --check` exit 0。 |
| 小审输入/靶子 | Batch 1 diff、红绿 E-ID、所有 fixture 对齐明细、三 CLI help、resolver 四象限、per-R 集合矩阵、TOML 全文；**小审人工核对 design §6.2 未复述 reviewer 具体集合，结果写 review Batch 1 行**（A115 后半）。 |
| 退出条件 | 获调整后本批 owner 原子项有证、旧测试全绿、无 P0/P1；progress 追加 `DONE ... batch=1 status=READY_FOR_REVIEW ...` 后立即停止。 |

### Batch 2 — 完整只读 status：node/agent/stage/result/last-writer（A43/A44/A61/A62/A65/A73/A81/A134）

**功能单元**：替换 `_status_command()` placeholder，完成不改变 ledger 的全量 status 投影；只读解析覆盖 stage/result/last-writer，Batch 3 才加 add 侧守门。

| 项 | 冻结内容 |
|---|---|
| Modify/Test | Modify 两 Python；只读 Batch 1 两 TOML；Record workspace。 |
| 目标接口/结构 | 建议但不锁名：`StageState`/`NodeState`/`AgentState`、`derive_status(plan, entries, now=...)`、`render_status_text(status)`、只读 `parse_stage_result_note` 与 `derive_last_writer`。`now` 可注入。 |
| 完整 JSON oracle | 顶层精确 13 键；所有嵌套精确键/类型/空值/排序按 design §3.5。`stages[].result` 非 null 时必须精确 `{stage_id,outcome,note,amend,nodes}`；有/无 `plan_amend` 各测。`last_stage_result` 取当前实例最新结果；只读侧允许投影 ledger 事实，不在本批决定 add 是否应接受该序列。 |
| 完整文本 oracle | 对 design §10.1+§10.2 fixture，逐行核 §10.3：计划/skill/session、cards/decision_mode、**当班写入者**、每阶段 state/result、节点 state、不可关原因、在场 agent 最近事件与静默时间。六项只是子集，不得替代整份样张。 |
| 状态合同 | closed 只读 node_close；closable 独立算双判据。current node 是首个 active 未 close 节点；依赖未闭合=pending，已 node_start=open，否则 ready。active agents 按首次 launch seq；未触发 agent 不出现。superseded 从三列表排除，只改变 ignored 计数。 |
| 先红断言 | 当前非空 placeholder 缺 13 键、result 五键、完整 10.3、last-writer；open+closable true 与 closed 分域；未触发 scribe；superseded 规范化差分；两份只差 checker/close 的合法合成 plan 均未稳定通过 lint/status。至少 A43/A61/A62/A73/A81/A134 直接行为红；旧行为正确可记 late-added discriminator。 |
| 实现约束 | 不做质量判断，不补写事件，不在本批拒绝 stage lifecycle。A62 的 amend/nodes 只是结果投影兼容，不实现 RLT_09 plan-amend 规则。A133 的正式模板默认 checker 归 RLT_07；本批只签 A134 的无 checker 合成 plan 行为，不得创建模板。 |
| 命令与预期 | focused status 红后绿；全文件 unittest exit 0；真实 CLI `status --json --config-dir <fixture>` 可 `json.loads`；文本 snapshot 使用固定 now。 |
| 边界 diff | 仅 status/read projection/renderer；不得加入 add 控制时序、A89 lint、limits/X、模板/watch/plan-amend。`git diff --check` exit 0。 |
| 小审输入/靶子 | Batch 2 增量、完整 10.3 snapshot、result 五键两例、last-writer、schema key set、superseded diff、checker 原子项、红绿 E-ID。 |
| 退出条件 | 获调整后本批 owner 原子项可复算、全量绿、无 P0/P1；progress 追加 `DONE ... batch=2 status=READY_FOR_REVIEW ...` 后立即停止。 |

### Batch 3 — add 侧阶段生命周期/偏序/写者 + status 联动 + A89 lint（A110/A111/A112/A105/A118/A106/A85/A93/A89）

**功能单元**：让 add 对阶段实例、写者交接、结果与关闭 fail closed，并把合法结果联动到 Batch 2 status；补 plan 层 A89 精确 lint。

| 项 | 冻结内容 |
|---|---|
| Modify/Test | Modify 两 Python；Record workspace；本批不改 TOML。 |
| 目标接口/结构 | 建议但不锁名：`validate_control_event`、`writer_intervals`、`latest_stage_result`；接入 `_validate_runtime_event()` 与 Batch 2 status。`lint_plan(..., config)` 增 A89“跨阶段 depends_on 只能指向前面阶段”这一条。 |
| 写者全集 | orchestrator：`stage_start`、`stage_close`、`plan_loaded`、`monitor_launch`。monitor：`node_start`、`node_close`、`monitor_restart`、`stage_result`、`plan_amend` 与**全部 agent 事件**。不得用“等”省略。A85 验一致性、不验身份真伪。 |
| 生命周期合同 | 每实例 `stage_start` 一次且先于 monitor_launch；stage_result 必须晚于该实例末节点 node_close，可多写且最新生效；stage_close 要求**该实例全部节点 closed**，且最新 outcome 为 done/cancelled。blocked→done/cancelled 正确，cancelled note 引 user_decision。R#1/R#2 独立；跨卡可双 open，同卡至多一实例 open。 |
| A89 精确 lint | 构造其余结构均合法、唯一违规为后阶段节点被前阶段 depends_on 的 fixture；`lint` 必须 rc=2 且 stderr 编号精确 `HC-RL-A89`，不得以 A109 或其他编号拒绝冒充。另测 stage_close 时实例仍有未 closed 节点，必须拒绝。 |
| 先红/判别器 | 重复 plan_loaded/stage_start、launch 早于 start、result 早于末 node_close、缺 result/blocked close、cancelled 缺引用、同卡双 open、写者交错、四 outcome/failed 重拉、A89 精确编号、未全 closed stage_close。旧实现错误接受者取行为红；若已拒但编号/原因正确，允许登记 late-added discriminator，写明实际旧编号与判别对象，不强造红。 |
| status 联动 | Batch 2 已投影所有只读字段；本批只证明经 add 接受的四 outcome、重复实例和 writer 交接能产生正确 `last_stage_result`、`open_stages`、`suggested_action`、`monitor_relaunch_count`、errors/last-writer。 |
| 命令与预期 | focused lifecycle/lint 红后绿；全文件 unittest exit 0；§10.2 真 CLI 顺序全 0，交换行/未关节点/唯一 A89 lint 反例为 2 且 ledger bytes 不增。 |
| 边界 diff | 仅 add 生命周期、writer/A89 lint 与 status 联动；不得改 TOML、X planner、CLI 集合、RLT_09/18。`git diff --check` exit 0。 |
| 小审输入/靶子 | Batch 3 增量；四步偏序、未全 closed、R#1/R#2、跨/同卡 open、完整 writer 集合、五分路、A89 独立 fixture 与精确编号、late-added 明细、红绿 E-ID。 |
| 退出条件 | 九 ID 有证、全量绿、无 P0/P1；progress 追加 `DONE ... batch=3 status=READY_FOR_REVIEW ...` 后立即停止。 |

### Batch 4 — 配置上限驱动的 X 规划与两套止损（A99/A107/A97；A99 只复算配置来源）

**功能单元**：纯内部 X-round 规划与 A97 lint 共用配置上限，attempt/X 独立触发 strategist；不生成文件或新子命令。

| 项 | 冻结内容 |
|---|---|
| Modify/Test | Modify 两 Python；必要时仅修正 `dh-mapping.toml` 已冻结值；Record workspace。不得创建 SKILL/template。 |
| 内部等价接口 | 实现纯内部函数（`plan_x_rounds` 仅建议名，不锁死）：输入 card + 已加载 config，输出长度等于 `limits.rework_max_rounds` 的最小 X-round 结构，stage_id 为 `<card>:X#k`，语义是 coder 修 + reviewer 再审，dh_nodes 取 `stages.X`；不写文件、不进 argparse。RLT_07 后续模板消费同一语义，不硬编码 2。 |
| 共用上限 | A97 lint 与内部 X 规划读取同一个配置字段。构造其它结构均合法、唯一违规为 `X#k` 超过上限的合成 plan，必须精确报 `HC-RL-A97`。attempt 范围 `(node,agent-name)`，X 按阶段实例计数；一方递增不影响另一方。超限均走 strategist，auto 也必须 user_decision 才 resume/cancelled。 |
| A99 配置驱动证据 | 用两份完整临时配置分别令上限 2/3，各运行一次内部规划；记录两次运行之间 `relay_log.py` 的 SHA-256 **相同**，同时 X 结构长度/序列不同。不得用工作树 diff 为空证明，也不得 commit/stash。plan_loaded note 必含 `config_dir=` 与 `plan=`。 |
| 先红断言 | 2/3 配置不能改变内部结果；只 attempt 达限、只 X 达限、均未达三例无独立结果；X3 未以 A97 拒；auto strategist 缺 user_decision 的 resume/cancelled 被接受；plan_loaded 缺两个键被接受。H3 默认目录反例已在 Batch 1 完成，本批只复算。 |
| 实现约束 | 不新增 generate/watch 子命令，不生成模板/文件，不解析 DevPlan 猜 recipe。A117 已归 RLT_07，不用 A18/A116 支撑证据冒充它。函数名可调整，语义不可分叉。 |
| 命令与预期 | focused limits/config 红后绿；全文件 unittest exit 0；help 三子命令。对两次内部规划前后分别运行 `sha256sum tools/relay-light/relay_log.py`，两个 hash 相同，返回长度 2/3。 |
| 边界 diff | 最终仅 allowed-paths；无 SKILL/adapters/templates/watch/plan-amend/dev-harness。`git diff --check` exit 0。 |
| 小审输入/靶子 | Batch 4 与整卡 diff；2/3 配置及双 hash、X 序列、三种独立计数、A97 精确编号、strategist 两终局、plan_loaded 双键、A99 对 Batch 1 配置来源只复算不重复实现。 |
| 退出条件 | 获正式调整后当前 owner 项有证，25/25 当前表的每一行已依法闭合或按调整更新 owner/count，全量绿、无 P0/P1；progress 追加 `DONE ... batch=4 status=CONSTRUCTION_DONE ...` 后立即停止。不得自行进入 review/verify。 |

## 最终施工交接清单（不等于复核或验收）

1. `progress.md` 有每批有效红或 late-added 判别器、绿、全量回归、fixture 逐条对齐、diff 边界、小审结论与 E-ID。
2. `review.md` 保持 RLT-B-06 正式同步后的 25 条 owner 闭集；不得恢复 A117/A91/A108 或把 A132/A133/A136 抢入本卡。
3. `git status --short` 与 `git diff --name-only` 仅 allowed-paths；不使用 `git add -A`/`.`，construction Node 不 commit。
4. 至少两域有效 mutation：status-lifecycle 与 config-recipe；均须行为红、还原全绿及施加/还原 hash。
5. Batch 4 结构化 DONE 后立即停止；heavy review 由主控另派，施工者不得自审。
