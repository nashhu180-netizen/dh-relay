<!-- dh:v1 -->
# RLT_05 heavy 复核 · 代码轮 1 — rlt05-hr-devin

- reviewer：`rlt05-hr-devin`（Devin CLI · SWE-2 Max），fresh session，未参与 RLT_05 任何批次施工/批审
- 快照：`/tmp/rlt05-hr-r1.ssJyhI/repo`（真实 worktree 字节副本，`.git` 指向真仓）；基线 master `1bea79fe18271b3b0b45c8d5dc6cc8993bfbf57d`（快照 `HEAD` 实测同值）；未触碰 `/home/nash/work/dh-relay` 及其 `.dh-worktrees`
- 对象：RLT_05 整卡增量（`tools/relay-light/relay_log.py` +1138、`tools/relay-light/test_relay_log.py` +2166、新建 `tools/relay-light/skill/{roles,dh-mapping}.toml`、workspace 全部证据）；合同：`design/01` §2/§3.1–3.5/§5/§6.2–6.3/§7.3/§9/§11 与 DevPlan RLT_05 卡
- 方法：合同对读 + 全文件重读 + 本审**自行动态复算**（全量 unittest、自建 21 项 CLI/库探针、`--help`、tomllib 加载、git 边界核对）。施工方与批审的既有证据只作线索，凡结论均自验或标注采信来源

## 0. 结论

**APPROVE**。25/25 oracle 均有有效覆盖（动态为主），无 P0/P1/P2 返工项。Batch 4 小审的 6 项 open 已全部裁决：2 项确认闭合、4 项转为设计层/交接事项（其中 F-B4-R01 需主控裁决止损计数的正式出口）。本审新增 2 项 P3 登记（死常量、已登记残差的实证补强）。open=6 全部为不改代码即可流转的登记/裁决事项，不阻断代码轮 1 闭合。

## 1. 本审动态复算（一手证据，非转述）

| 项 | 命令/构造 | 实测 |
|---|---|---|
| 全量回归 | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py` | `Ran 108 tests in 122.967s … OK`（与 E-079/E-085/B4 小审 108 绿一致） |
| CLI 闭集 | `--help` + 三子命令 `--help` | 顶层恰 `{add,status,lint}`；三者各显 `--config-dir`；`status` 有 `--json`，`lint` 无（`--json` 合同属 RLT_10 的 HC-RL-A80，见 DevPlan §6 表） |
| 自建探针 `/tmp/rlt05-hr1-probe.py` | 6 场景 21 断言，全部经真实 `add`/`status`/`lint` 子进程与库函数 | **21/21 PASS**（明细见 §3 各 oracle 行） |
| 配置事实 | `tomllib` 直接加载两 shipped TOML | `roles.toml` 恰 11 角色（builder/checker/coder/decider/monitor/orchestrator/plan-reviewer/planner/reviewer/scribe/strategist）；`dh-mapping.toml` 四类齐备：`stages` W/C/R/X/F 全值、三档 recipes、`rework_max_rounds=2`、`attempt_max=3`、`on_exceed.action`；E11/E12/E13 不出现在任何阶段 |
| 边界 | `git status --porcelain`、`git diff --check`、`find __pycache__` | 实现增量仅两 `.py` + `skill/` + `workspace/RLT_05/`；其余 `M`/`??` 为 B06 既有 WIP（AGENTS/design×2/dev_plan + 三处 drafts，mtime 佐证）；`diff --check` exit 0；无 pycache/pyc |

### 探针关键实测（本审自建，均有合同依据）

- **A93 下界**：`node_start` 先于 `stage_start` → `rc2 HC-RL-A93 … cannot precede stage_start of DHR_90:W#1`；`monitor_restart` 携带伪 `stage_id=` → `rc2 HC-RL-A93 … belongs to DHR_90:W#1; note names DHR_90:C#1`；`stage_close` 后任何写入 → `rc2 HC-RL-A93 … was closed at seq 22`。
- **A112**：实例尚有未 `node_close` 节点时 `stage_result` → `rc2 HC-RL-A112 … still open: ['C1','C2']`。
- **A111**：同卡第二实例 `stage_start` **被接受**（rc0），`status.errors` 报 `HC-RL-A111 card DHR_90 has 2 open stage instances: [...]`——与 A111「报警」字面一致。
- **current_stage mid-plan（§3.4 逐字）**：首个未关节点 R1 所属实例 R#1 已 start → `current_stage=DHR_90:R#1`、`current_node=R1`、`last_stage_result=null`、`suggested_action=none`（R#1 尚无 result →「其余 → none」）。
- **A97 strategist 闸（auto）**：`escalate(strategist=…)→agent_launch strategist#1→decision→done strategist#1` 后，`resume`/`cancelled` 均 `rc2 HC-RL-A97 … requires a user_decision on the strategist chain`；补 `user_decision` 后 `resume` rc0；其后 `cancelled` rc0（B4-F3/F-B4-R04 窄读法实证）。
- **A107**：`coder#1..#3` 全 `agent_lost` → `attempts={(C1,coder):3}`、`attempt_exhausted=((C1,coder),)`、`x_exhausted=()`；第 4 次 `agent_launch coder#4` `add` **rc0**（无硬闸，F-B4-R03 实证）；在飞态下不触发；`coder#4 agent_lost` 后再触发。X 侧：`X#2 outcome=done` 时 `x_rounds={DHR_90:2}` 但 `x_exhausted=()`；改写 `outcome=failed` 后 `x_exhausted=(DHR_90,)`，attempts 不受影响——两计数完全独立。
- **A97 lint 排序**：plan 同时含 `X#3` 超限与 F9 空节点 → 实报 `HC-RL-A75`（结构先于 A97）；去掉结构错误后恰报一条 `HC-RL-A97 … X#3 exceeds rework_max_rounds=2`，无他编号冒充。

## 2. 25 条 oracle 覆盖清单

证据标签：**动态**=本审一手命令/探针；**静态**=本审源码/配置/合同对读；**采信前证**=批审或 E 台账中已由 fresh reviewer/主控复算、本审核对一致的动态证据（未冒充本审所跑）。

| oracle | 合同要点（§11 原文缩写） | 本审证据 | 证据 | 结论 |
|---|---|---|---|---|
| A43 | status 六项齐并与 §10.3 样张一致 | `test_design_10_3_text_snapshot_is_reproduced_line_by_line`（B2-F1 登记了 §10.2 逐字+3 行最小续写与 `now=10:43:52` 注入）；本审静态核对 `render_status_text` 逐行结构与 §10.3 样张（含「当班写入者：monitor（DHR_90:C#1）」） | 动态(suite)+静态+前证(E-032/E-033) | PASS |
| A44 | status 不含产出合格性判断 | `test_status_wording_carries_no_quality_judgement` 对 JSON 与文本全量扫描；输出词表为封闭枚举，无质量判断词路径 | 动态(suite)+静态 | PASS |
| A110 | 重复阶段实例结果独立 | `test_repeated_stage_instances_stay_independent_and_alert_on_double_open`；`latest_stage_result` 按实例过滤（`relay_log.py:1042-1050`） | 动态(suite)+静态 | PASS |
| A111 | open_stages 跨卡可多、同卡至多一（复开报警） | 本审探针：同卡双 open 被接受且 `errors` 报 A111；跨卡正例 `test_open_stages_lists_cross_card_parallel_instances` | 动态 | PASS |
| A112 | 阶段收尾偏序非法即拒 | 本审探针 result-before-last-node_close 拒；`_validate_stage_event` 同时把关 stage_close 全节点 closed（`relay_log.py:1117-1133`） | 动态 | PASS |
| A105 | stage_result 四 outcome、可多写、最新生效 | `test_stage_result_and_close_preconditions_exit_two`/`test_four_outcomes…`；`latest_stage_result` 取最新行 | 动态(suite)+静态 | PASS |
| A118 | blocked 不可 close；done/cancelled 可；cancelled 引 user_decision | `test_blocked_and_cancelled_finales_follow_the_frozen_rules`；`relay_log.py:1090-1091,1130-1133`（blocked 禁 close、cancelled 需 note 引 `user_decision`、终局须 done/cancelled） | 动态(suite)+静态 | PASS |
| A106 | `last_stage_result.outcome` 派生五枚举；failed 最多重拉一次 | `test_four_outcomes_drive_suggested_action_and_relaunch_count`+`test_monitor_relaunch_count_counts_only_failed_caused_relaunches`；`_suggested_action`(`1447-1455`) 五枚举逐字对应 §3.5 分路表；因果计数 `1513-1517` 只计 failed 窗口内 monitor_launch；本审探针 none 兜底 | 动态+静态 | PASS |
| A85 | 控制/agent 事件写入者一致性守门 | `WRITER_BY_EVENT`（`70-84`）逐字等于 §3.4 写者表；`_validate_writer`(`1009-1014`) 拒越权；`test_writer_consistency_exits_two_for_every_frozen_owner` 矩阵；`_ledger_warnings` 只读镜像 | 动态(suite)+静态 | PASS |
| A93 | 编排与监工 seq 区间不交错 | 本审探针三断言（pre-start/伪标/post-close 全拒）；`_validate_writer_handoff`(`1136-1164`) 双界 + 非 stage 事件伪 `stage_id=` 拒；`_ledger_warnings` 三类镜像 | 动态 | PASS |
| A89 | 阶段级事件/关闭/跨阶段依赖时序 | `_validate_stage_event`(`1069-1133`) 管 stage_start/monitor_launch/stage_result/stage_close 时序；`lint_plan` A89 行(`586-598`) 拒同卡跨阶段前向依赖，`test_a89_lint_rejects_a_backward_cross_stage_dependency` 精确编号 | 动态(suite)+静态 | PASS |
| A65 | 未触发 agent 不算悬空 | `test_unlaunched_agents_are_never_reported_as_dangling`/`test_node_close_ignores_an_untriggered_agent`；`agents[]` 只收有 `agent_launch` 行者（`1573-1591`） | 动态(suite)+静态 | PASS |
| A61 | 当前节点与 pending/ready/open 派生 | `test_current_node_and_node_states_follow_the_frozen_table`；本审探针 `current_node=R1`；三态表 `1536-1547` 逐字按 §3.4 | 动态 | PASS |
| A81 | closed 只读 node_close；closable 独立算 | `test_closed_reads_only_node_close_and_closable_is_independent`；`_node_closed`(`766`)/`_unclosable_reasons`(`1337-1362`) 分域 | 动态(suite)+静态 | PASS |
| A62 | §3.5 精确键/类型/空值/排序；result 五键 | `test_status_json_schema_keys_types_and_order_are_exact`+`test_stage_result_projection_carries_five_keys_with_and_without_amend`；`status_document`(`1728-1779`) 顶层恰 13 键、`stages[].result` 恰 5 键、顶层 `last_stage_result` 恰 3 键（F-B2 整改后 `_last_result_document`/`_result_document` 分函数） | 动态+静态 | PASS |
| A73 | superseded 差分等价、仅 ignored 变 | `test_status_and_lint_match_with_and_without_superseded_rows`/`test_superseded_rows_only_change_the_ignored_count`（B2-F8 修正 fixture 为「仅差一行」）；投影全路径走 `active_nodes` | 动态(suite)+静态 | PASS |
| A107 | attempt 与 X 轮数独立触发 strategist | `test_attempt_and_x_loss_stops_trigger_independently`（only-attempt/only-X/neither 三例）+`test_attempt_loss_stop_counts_stage_failed_relaunch_debt`；本审探针四断言复证独立性、在飞豁免、X-done 不触发 | 动态 | PASS |
| A116 | recipe 三值及实际 reviewer 集合严格匹配配置 | `RECIPE_TIERS`(`63`) 闭集先验 + 每活跃 R 实例 `role=reviewer` 集合比较（`626-649`）；`test_recipe_tiers_stay_within_the_frozen_three_value_enum`/`test_recipe_reviewer_mismatch_is_rejected_as_a116`/`test_one_mismatched_r_instance_rejects_the_whole_plan`/豁免与优先级用例 | 动态(suite)+静态 | PASS |
| A131 | roles.toml 角色键=§6.3 十一角色且 model/launch 可加载 | 本审 tomllib 实测 11 角色；`_parse_roles`(`243-255`) A131 exit3；`test_shipped_roles_toml_has_the_eleven_design_roles` | 动态+静态 | PASS |
| A92 | 映射四类承载；E11/12/13 不出现 | 本审 tomllib 实测四类与全值；`_parse_mapping`(`258-287`) A92 exit3；`test_shipped_dh_mapping_carries_the_four_frozen_content_classes` 全键全值精确等值（F-A92-COVERAGE 整改后） | 动态+静态 | PASS |
| A115 | 三档 reviewer 集合对齐 dev-harness 节点表；§6.2 不复述具体集合 | `test_shipped_recipes_match_the_dev_harness_node_table` 三档精确集合；本审对读 §6.2 确认其不列具体 reviewer 集合（集合只在 §6.3 与 TOML） | 动态(suite)+静态 | PASS |
| A99 | 改配置即改 X 规划、源码不变；内部实现不增子命令；`--config-dir` 优先；plan_loaded 双键 | `test_plan_x_rounds_length_and_ids_come_from_the_loaded_config`（同 hash ×3、2↔3、stage_id/`dh_nodes` 精确）；`plan_x_rounds`(`308-319`) 纯内部、不入 argparse；本审 `--help` 闭集；`test_plan_loaded_note_carries_config_dir_and_plan_keys` 双键各一 | 动态+前证(B4 双 hash) | PASS |
| A134 | 无 checker 合法 plan 过 lint/status | `test_plan_without_checker_passes_lint_and_status_without_a_dangling_agent` | 动态(suite) | PASS |
| A135 | 三 CLI 接 `--config-dir`；显式优先、`~` 展开、规范化+编码；五情形 fail closed | `resolve_config_dir`(`202-218`) 五情形逐字；本审 `--help` 三命令 flag；`test_default_config_dir_resolution_follows_the_five_cases`/`test_explicit_config_dir_is_normalized_and_percent_encoded`/`test_missing_explicit_config_dir_fails_closed`；`_plan_loaded_note`(`1171-1182`) 无条件重建 | 动态+静态 | PASS |
| A97 | 唯一 X 超限被 lint 精确拒；strategist 链终局须 user_decision（auto 亦然） | `lint_plan` A97 块(`606-613`) 位于全部结构规则后、A116 前；本审探针：A75 先于 A97、净 plan 恰一条 A97、strategist 两终局 auto 拒+补键后过；`test_x_rounds_beyond_the_configured_limit_are_rejected_as_a97`/`test_strategist_chain_finales_require_a_user_decision_in_every_mode` | 动态 | PASS |

## 3. 本审新增 findings（F-HR1-*）

| ID | 级别 | 位置 | 事实 | 处置 |
|---|---|---|---|---|
| F-HR1-01 | P3 | `relay_log.py:66` | `SUGGESTED_ACTIONS` 常量定义后无任何引用（测试文件在 `test_relay_log.py:1866` 自有一份同名集合）；合同枚举的命名锚点，但属死常量 | 不阻断；建议在 `_suggested_action` 返回前以该集合做防回归断言，或删除 |
| F-HR1-02 | P3 | `relay_log.py:1069-1133,1136-1164,1313-1325` | stage 级事件（`stage_start`/`monitor_launch`/`stage_result`/`stage_close`）按 note `stage_id=` 寻址（B3R1-F1 既定设计），**承载 `--node` 不与目标实例节点集核对**。本审实证：`add --node R1 --event stage_start --note stage_id=DHR_90:C#1` → rc0，且 `status.errors=[]`、`current_stage` 被投影为 `DHR_90:C#1`——既被接受又**静默**（无任何报警）。与 E-062 P3 注记/B3R1-F1「未动」属同一残差，本审补充「无警告」这一更强事实 | 接受现状（无 25 条内 oracle 要求该校验；写者本身受 A85 管）；建议主控在 design 留跨卡指针（RLT_07 文档注记或新增规则→ID 行），或最小化为 status 增一条只读报警——后者属合同增补，不由本卡自行扩 |

无 P0/P1/P2。其余可疑点经逐项排查均排除：RLT_03 继承的 agent FSM/decision-ownership 与基线逐字节相同（`git diff 1bea79f` 已核），未误归 RLT_05；`lint` 无 `--json` 属 RLT_10 的 A80 范围（DevPlan §6 owner 表）非本卡缺口。

## 4. F-B4-R01..R06 逐项裁决

| ID | 级别 | 本审裁决 | 依据 |
|---|---|---|---|
| F-B4-R01 | P2 | **ESCALATE（接受本卡现状，出口归属需主控/用户裁决）** | 本审 grep+读码确认 `loss_stop`/`LossStop`/`plan_x_rounds`/`XRound` 无产品侧调用点，仅测试消费。A107 §11 证法只要求单测、A62 冻结 13 键 schema——**不构成本卡违约**；但「先到上限→拉 strategist」确实没有可被编排机械消费的出口，RLT_07/RLT_18 若各自重写计数即产生第二真值。处置建议：由主控决定出口归属（RLT_07 skill 内部消费 / RLT_18 watch 提示 / status schema 增补须合同先行），并在 as-built 或后续卡登记；**不应回本卡扩 A62**。open |
| F-B4-R02 | P3 | **接受（确认该收敛读法，建议但不强制 §7.3 补一句澄清）** | 本审探针实证两读法：attempt 侧「计数≥max 且最新行仍需重拉」（in-flight 不触发、再 lost 触发）；X 侧「最高 k≥max 且最新 result=failed」（X#2 done 不触发）。X 侧有 §9.3「X2 仍不过→拉 strategist」直接支撑；attempt 侧若按字面「拉起第 3 次即触发」会把 attempt_max=3 实际退化为 2，实现读法更合理。B4-F1/B4-F2 已登记，未偷改合同。closed |
| F-B4-R03 | P3 | **接受 + ESCALATE-lite（是否硬上限属产品设计裁决）** | 本审实证 `agent_launch coder#4` rc0（A58/A49 照常校验，不比 `limits.attempt_max`）。§11 无 oracle 要求 add 拒超 attempt_max，X 侧硬闸因 §3.5 有 A97 映射行——不对称但逐字合规。若产品意图为硬上限，须 design 补规则→ID 映射后另行派卡；本卡不自行扩边界。open（设计裁决事项，非代码缺陷） |
| F-B4-R04 | P3 | **接受（窄读法与 §3.4/§9.3 链定义一致）** | 本审实证：链 `resume` 落地后 `_active_decision_owners` 失效，后续 `cancelled` rc0。§9.3 的链止于 resume/cancelled 二选一；「strategist 介入过的卡此后一切停卡都要 user_decision」无合同依据。closed |
| F-B4-R05 | P3 | **追认证法替换 + ESCALATE-lite（建议 A 侧改 §11 A99 行证法文字）** | 「`git diff` 对 relay_log.py 为空」在整卡 WIP 未 commit 期间字面不可达；task_plan 冻结的「两运行间 sha256 相同」已被施工方与 B4 小审各取同一 hash `90707b7e…`、本审核对 `test_plan_x_rounds…` 三次取 hash 断言——证明力不弱于原证法（同一不变二进制按配置产出不同结构）。建议 design §11 A99 证法文字更新为 hash 口径，避免收口被当缺证。open（设计文字修订） |
| F-B4-R06 | P3 | **接受 + 交接指针** | `XRound` 仅 `stage_id/card/k/dh_nodes`（`298-305`），「coder 修+reviewer 再审」只存于 docstring。对 A99 验收无影响；RLT_07 消费模板时 agent 行需自拼。建议在 RLT_07 交接/as-built 点名，防 RLT_07 反向硬编码。open（交接登记事项） |

## 5. findings.md 全部登记项裁决

### 5.1 合同缺口 H1–H4（RLT-A-06/B-06）

四项均由正式 A06/B06 闭合：本审对读 DevPlan/§3.1/§3.5/§6.2.1/§6.3/§11 差异确认——A117→RLT_07、A91/A108 退役并原子化 A131–A134、五情形 resolver 与三 CLI flag 冻结、A97 映射行已补（§3.5 表末行 `X#k 的 k 超过 limits.rework_max_rounds → HC-RL-A97`）。**确认 resolved**，本卡实现与之逐字一致。

### 5.2 task-plan 两审（Opus P1-1..P3-3 / Fable F-001..D6）

主控裁决逐条落实核对：`P1-1`（B2 已含 result/last-writer 只读投影）✓；`P1-2`（per-R 实例、agent 列、豁免、结构优先，`618-649`）✓；`P1-3`/`P1-5`（`_runtime_plan` 三命令共用 config、禁 `config=None`，`664-671`+`1869-1872`）✓；`P1-4`（A89 lint 行+精确编号，`586-598`）✓；`P1-6`（手动派活、progress durable DONE 已落 E-台账）✓；`P2-2`（双 hash 证法）✓；`P2-3`（A97 映射行）✓；`P2-4`（写者表全列 `70-84`）✓；`P2-5`（late-added 判别器登记在 E-076/E-058 等）✓；`P2-6`（review.md 两域 mutation 锚点，执行归代码轮 2）✓；`P2-7`+`D6`（跨卡守恒、驳回新依赖）✓；`P3-1`（基线 SHA 已补全，本审实测 HEAD=`1bea79fe18271b3b0b45c8d5dc6cc8993bfbf57d`）✓；`P3-2`/`P3-3`（权威分工、A115 静态核对落 B1 小审）✓。**全部确认按裁决落实**，无驳回项。

### 5.3 冻结边界 F-004..F-008

F-004（集合只在 §6.3/TOML）✓、F-005（`[limits]`+`[limits.on_exceed]`，`rework_max_rounds`）✓、F-006（amend/nodes 仅只读投影）✓、F-007（A62/A73 分域）✓、F-008（RLT_05 先建两 TOML、RLT_01 不得覆盖）✓——**全部确认遵守**。

### 5.4 Batch 施工事实登记（B1-F*/B2-F*/B3-F*/B3R1-F*/B4-F*）

- **B1-F1→R1**：`RECIPE_TIERS` 闭集先于配置查询（`626-633`）；扩展配置加 `[recipes.strict]` 仍拒。**确认 resolved。**
- **B1-F2→R1**：`_plan_loaded_note` 无条件重建 `config_dir=`/`plan=`（`1177-1182`），调用方同名 token 全弃。**确认 resolved**；本审 `test_plan_loaded_note_carries_config_dir_and_plan_keys` 断言两键各恰一次。
- **B1-F3**：`load_config`/`read_ledger` 走 `Path.read_text`（`223,684`），`builtins.open` 只用于账本 append（`1206`）——保住 RLT_03 append-failure fixture 语义。**确认。**
- **B1-F4**：`plan=` 同样百分号编码+规范化（`1180`）。**确认。**
- **B1-F5**：除 `RECIPE_TIERS`（§11 冻结枚举）外无集合/limits 写死。**确认。**
- **B1-F6**：两 TOML 逐值=§6.3（本审 tomllib 实测）。**确认。**
- **B1-F7/F8**：状态为「本批未实现 X/Y/Z」与「M 文件系 B06 WIP」——前者已被 B2–B4 交付消化，后者经 `git status`+mtime 复核属实。**确认。**
- **F-B1-RECIPE-ENUM / F-B1-PLAN-LOADED-PROVENANCE / F-A92-COVERAGE**：三项 R1 整改实现与判别器均在树内（见上 B1-F1-R1/F2-R1 与 `test_shipped_dh_mapping…` 全值断言）。**确认 resolved。**
- **B2-F1..F10**：fixture 补齐（§10.1+6 agent 行、§10.2+3 行续写）、单原因列出顺序、`closable` 字面判据、pending 阶段不打 `result=`、空账本特例、四类只读 errors、A73 fixture 对齐、无抢跑、A44 判别器如实登记——逐项与实现/测试核对一致。**全部确认**（含 B2-F5 的 `closable` 不要求 `node_start`：与 `_validate_node_close` 实际判据一致）。
- **F-B2-LAST-RESULT-SCHEMA**：`_last_result_document`（顶层 3 键）与 `_result_document`（stage 5 键）已分离（`1704-1725`）。**确认 resolved。**
- **B3-F1**：`monitor_restart`/`plan_amend` 无阶段时序约束、仅受 A93 窗口管（`1073-1074` 注释明确）——「任意位置」与「关窗后不得写」并列读法成立。**确认。**
- **B3-F2→R1**：`current_stage` 规则改为「当前节点实例已 start→取该实例；否则 open 实例中先等关者、再最新 start；无 open→当前节点 stage」（`1550-1566`）。本审探针 R#1 情形与 B3r1 探针 C#1-awaiting-close 情形两侧覆盖。**确认 resolved。**
- **B3-F3**：A111 报警不加 add 拒——本审实证。**确认。**
- **B3-F4**：A112「全部节点 closed」判据——本审实证 `still open: ['C1','C2']`。**确认。**
- **B3-F5**：A118 字面 substring `user_decision`（`1090-1091`），与 §9.3 样例 note 一致。**确认。**
- **B3-F6→R1**：`monitor_relaunch_count` 改因果计数（`1513-1517`），仅 failed 窗口内 monitor_launch 计入；残留「failed 窗口内崩溃恢复拉亦计入」已在 B3R1 复审登记为账本不可分残差。**确认 resolved + 残差登记。**
- **B3-F7**：`plan_amend` 写者受 A85 管（`79`）、note 内容校验属 A119/RLT_09、status 侧 `nodes=` 缺失只读报警（`1505-1506`）。**确认（边界正确）。**
- **B3-F8**：三条旧 fixture 按新合同重写、原 HC-ID 断言保留。**确认。**
- **B3-F9**：B3 未实现 B4 项——历史陈述，已由 B4 交付消化。**确认。**
- **F-B3-PRESTART-INTERVAL / F-B3-CURRENT-STAGE-MIDPLAN / F-B3-RELAUNCH-COUNT / F-B3-A89-BRANCH-EVIDENCE**：R1 复审 APPROVE；本审独立探针复证 A93 双界与 mid-plan 路由。**确认 resolved。**
- **B3R1-F1**：stage 事件 note 寻址——确认；其「node 未核属实例」残差本审以 F-HR1-02 补强（实证静默）。**确认 + 残差结转。**
- **B3R1-F2**：monitor 写入下界=stage_start 而非 monitor_launch——与 §3.4「monitor_launch 是 stage_close 前置」合读一致。**确认。**
- **B3R1-F3**：current_stage/current_node 在 mid-plan 可分叉——合同逐字派生。**确认。**
- **B3R1-F4**：`start_ledger` 三行合法开场等 7 处 fixture 对齐——明细在 progress fixture 表 #14–#20。**确认。**
- **B4-F1..F4**：触发时点收敛读法、strategist 闸挂载位置（先于状态机、`cancelled` 不入 DECISION_EVENTS）、两函数纯内部——本审探针全部实证。**确认。**

### 5.5 批审 P3 备注结转

B3 小审的 P3 注记（`_open_stage_ids` 不含 monitor_launch 分支不可达、note-first 归属绕过、首节点未核、A85 矩阵缺 monitor→stage_close/monitor_launch 两格、A89 同字母跨实例依赖歧义）与 B3R1 复审三注记（plan_loaded 伪 stage_id 被拒、legacy 重复 stage 行不报警、首节点未核）：`_open_stage_ids` 项已由 `_stage_lifecycle_events` 收 monitor_launch 解决；A85 矩阵两格经读码确认走同一 `_validate_writer` 分支（`1009-1014`），属覆盖完整性备注而非缺口；其余即 F-HR1-02 残差族。**均已登记/结转，无隐藏未裁项。**

## 6. 边界、死代码与越界检查

- **allowed-paths 闭集**：`git status --porcelain` 共 11 项——`M` 两份 `.py`（允许）+ 4 份文档（AGENTS/design 01/README/dev_plan，B06 既有 WIP，mtime `08:59` 早于各批编辑，内容经 diff 核对为合同修订而非施工）+ `??` 为 `skill/`（两 TOML）、`workspace/RLT_05/`、三份 B06 drafts。**无越界改动。**
- **禁改项**：无 `SKILL.md`/adapter/模板/watch/`plan_amend` 白名单/新子命令/依赖/锁；两 TOML 为唯一 skill 文件；`plan_amend` 在实现中仅作词表项、写者归属与只读 `nodes=` 报警，未实现 RLT_09 规则。**无偷渡。**
- **死代码**：`SUGGESTED_ACTIONS`（`66`）无引用 → F-HR1-01；其余常量全部有引用（`DEFAULT_CONFIG_DIRS`/`CONFIG_PATH_SAFE`/`RECIPE_TIERS`/`PROVENANCE_KEYS`/`STAGE_RESULT_OUTCOMES`/`TERMINAL_RESULT_OUTCOMES`/`STAGE_NOTE_EVENTS`/`CONTROL_AGENT_NAMES`/`RELAUNCH_EXEMPT_AGENT_NAMES`/`DECISION_*` 均已核）。无未定义符号、无 dead 函数（`plan_x_rounds`/`loss_stop` 无产品调用点属 F-B4-R01 已裁事项，非死代码——它们就是 A99/A107 的合同载体）。
- **命名/错误码合同一致**：stderr 前缀 `lint:`（lint 规则）/`error:`（add/status 与 lint 的输入侧失败）与 §3.5 输出合同一致；所有 HC-RL-ID 与 §3.5 映射表、§11 oracle 行逐字对应（本审对全量 43 个 impl ID 与 57 个 test ID 做了集合核对，无杜撰编号）；退出码 0/2/3/4 分域与 §3.1 一致（argparse 经 `RelayArgumentParser.error` 收口为 rc2，`102-106`）。
- **卫生**：无 `__pycache__`/`.pyc` 残留；`git diff --check` 干净；`read_ledger` 用 LF 切分保 Unicode 行分隔符（`696` 注释与 `test_unicode_line_separators_round_trip`）；append 用 `open('a', newline='')` 无临时文件替换（§3.7 单写者追加）。

## 7. 测试质量

108 条用例全部为**行为断言**而非重言：拒绝类同时断言 rc、精确 HC-ID、stderr 格式与账本字节不增；投影类逐键断言 schema/排序/空值；A99 以「换输入配置+三次 sha256」证明配置驱动（L-001 落实）；E-076 的五条有效红经 B4 小审 M1–M4 定向变异独立复证判别力；旧断言删除仅 1 例且由 E-058 改名登记承接。fixture 对齐全部逐条登记（progress fixture 表 #1–#20）。**无「断言实现自身」型伪测试。**

## 8. NOT_RUN（不冒充已验证）

| 事项 | 状态 | 说明 |
|---|---|---|
| E-076 实现前红原样重跑 | NOT_RUN | 实现已在树内不可原样复现；B4 小审以 M1–M4 变异替代验证（改坏即红、还原复绿），本审核对变异点与断言对应关系成立 |
| E-075 `git rebase --autostash` 过程 | NOT_RUN | 一次性历史动作；以 HEAD=基线 SHA、WIP 完整、mtime 分层间接佐证 |
| review.md 两条有效 mutation | NOT_RUN | 属 heavy **代码轮 2** 的必做靶子，本轮（轮 1）不执行；锚点已预填待轮 2 fresh reviewer 选取 |
| B1/B2 批审的 reviewer 动态项 | 前证受限 | 其环境 `bwrap RTM_NEWADDR` 致 reviewer 动态 NOT_RUN，由主控源 worktree 复跑补齐（E-026/E-047 等）；本审已在可执行环境独立取得全部动态证据，不留盲区 |

## 9. Verdict

`APPROVE`。25/25 oracle 覆盖成立、整卡无 P0/P1/P2 代码返工项；`F-B4-R02`/`F-B4-R04` 确认闭合，`F-B4-R01`/`F-B4-R03`/`F-B4-R05`/`F-B4-R06` 转设计层裁决或交接登记，`F-HR1-01`/`F-HR1-02` 为 P3 登记项。open=6 均为不改本卡代码的流转事项（止损出口归属、attempt 硬上限产品裁决、§11 A99 证法文字、RLT_07 交接点名、死常量、stage 事件 node 归属残差），建议由主控汇总转用户/后续卡，不阻断代码轮 1 闭合与轮 2 及后四路并发。

DONE APPROVE open=6
