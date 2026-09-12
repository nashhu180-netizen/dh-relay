<!-- dh:v1 · heavy-requirement-devin.md -->
# RLT_05 heavy 复核 · 需求方向（fresh，未参与施工/未参加代码轮1）

- **复核者**：rlt05-hr-req-devin（需求方向，五路之一）
- **对象快照**：`/tmp/rlt05-hr-req.L1qX6w/repo`（一次性可写快照；基线 HEAD=`1bea79fe18271b3b0b45c8d5dc6cc8993bfbf57d`，实现为未提交 WIP）
- **范围**：DevPlan RLT_05 卡 + `brief.md` 25 条 HC-RL 验收项的逐条对齐；RLT_07/09/10/18 抢跑审查；A44 / Recipe·stages·limits·on_exceed / attempt·X 双计数 / `--config-dir` 四处语义审查
- **方法**：不采信批审/轮1证据文本；自行读 `relay_log.py`（1883 行）、`test_relay_log.py`（3306 行）、两份 TOML 全文、design/01 §3.4/§3.5/§5.2.1/§5.3/§6.2/§6.2.1/§6.3/§7.3/§9.3/§10/§11 与 DevPlan RLT_05 卡（P1 209-250）；在本快照**实跑** `python3 -m unittest test_relay_log` → **Ran 108 tests … OK（138s）**（本审自有动态证据，非转述）
- **对照工件**：workspace 全套（brief/task_plan/progress/findings/review/execution_strategy/lesson_candidates）+ reviews/ 全部 8 份（含 `heavy-code-r1-devin.md` 的 APPROVE/open=6 裁决）

---

## 1. 25 条逐项对齐表

判定列口径：`满足` = 实现落点存在、语义与 oracle 原文一致、有对应测试且本审实跑通过。行内行号为当前 `relay_log.py` / `test_relay_log.py` 实际行号。

| # | ID | 要求摘要 | 判定 | 实现落点（relay_log.py） | 对应测试名 | 证据 |
|---|---|---|---|---|---|---|
| 1 | HC-RL-A43 | status 六项齐并与 §10.3 样张一致 | 满足 | `render_status_text` 1795-1831（计划/卡/当班写入者/阶段·节点·agent 明细）；`derive_last_writer` 1328-1334；`_idle_seconds` 1435-1444 | `test_design_10_3_text_snapshot_is_reproduced_line_by_line`（常量 `STATUS_10_3_TEXT` 与 §10.3 逐字一致，本审逐行比对过）、`test_status_reports_the_last_writer_and_silence_without_driving_actions` | 动态：本审 108/108 |
| 2 | HC-RL-A44 | status 不做产出合格性判断 | 满足 | 文本模板 1795-1831 只转述账本事实（reasons 固定为「X 无终态事件」/「X 无 done 终态」1337-1362）；`derive_status` docstring 1461-1462 明示不判产出；`_status_command` 1834-1845 纯只读、永不拒 | `test_status_wording_carries_no_quality_judgement`（JUDGEMENT_WORDS 十词）、`test_status_is_read_only_and_never_rejects_ledger_problems`（坏 outcome 进 errors 且账本零改动） | 动态+静态 |
| 3 | HC-RL-A110 | 重复阶段实例结果独立 | 满足 | `latest_stage_result` 1042-1050 按实例过滤；`_stage_entries`/`_stage_of` 1029-1032/1313-1325；results 按 stage_id 分桶 1496-1503 | `test_repeated_stage_instances_stay_independent_and_alert_on_double_open`（R#1 failed / R#2 done，R#2 stage_close 被接受） | 动态 |
| 4 | HC-RL-A111 | open_stages 跨卡多个、同卡至多一 | 满足 | `open_ids` 1550 + `open_stages` 1608（started 未 closed 即 open）；同卡双 open 报警 `_ledger_warnings` 1422-1431；同卡串行由 lint A109 599-605 前置保证 | `test_open_stages_lists_cross_card_parallel_instances`（两卡 open、errors 空）、`test_repeated_stage_instances_stay_independent_and_alert_on_double_open`（同卡双 open 报 A111） | 动态 |
| 5 | HC-RL-A112 | 阶段收尾偏序非法即拒 | 满足 | `_validate_stage_event`：`stage_result` 早于末节点 `node_close` → 1092-1097；`stage_close` 无 result → 1126-1128、最新 outcome∉{done,cancelled} → 1132-1133 | `test_stage_result_and_close_preconditions_exit_two`（顺序颠倒/缺 result/关后补写三例+账本零增长断言） | 动态 |
| 6 | HC-RL-A105 | stage_result 四 outcome、可多写、最新生效 | 满足 | `STAGE_RESULT_OUTCOMES` 65；`_validate_stage_event` 1077-1098（stage_id= 必含且属活跃实例、outcome 四枚举）；无「已写过」分支即可多写；投影取最新 1496-1503/1042-1050 | `test_stage_result_and_close_preconditions_exit_two`（缺 stage_id/非法 outcome/未知实例）、`test_four_outcomes_drive_suggested_action_and_relaunch_count`（blocked→done 最新生效）、`test_blocked_and_cancelled_finales_follow_the_frozen_rules` | 动态 |
| 7 | HC-RL-A118 | blocked 后 done/cancelled 终局正确 | 满足 | `stage_close` 遇 blocked → 1130-1131；`cancelled` 的 note 必须含 `user_decision` → 1090-1091 | `test_blocked_and_cancelled_finales_follow_the_frozen_rules`（blocked 拒关、cancelled 缺引用拒、done/cancelled 两终局各被接受） | 动态 |
| 8 | HC-RL-A106 | 五枚举 suggested_action；failed 重拉至多一次 | 满足 | `_suggested_action` 1447-1455（done/cancelled→open_next_stage、blocked→wait_user、failed+count=0→relaunch_monitor、failed+count≥1→notify_user、None→none）；failed 窗口计数 1513-1517；current_stage 作用域 1567-1568 | `test_four_outcomes_drive_suggested_action_and_relaunch_count`（四 outcome + 二次 failed 转 notify_user）、`test_monitor_relaunch_count_counts_only_failed_caused_relaunches`（崩溃重拉不计数） | 动态 |
| 9 | HC-RL-A85 | 控制/agent 写者一致性守门 | 满足 | `CONTROL_WRITERS`+`WRITER_BY_EVENT` 70-84（19 词全有唯一法定写者）；`_validate_writer` 1009-1014（by 由 agent 前缀派生后与 owner 比）；`_writer_from_agent` 724-725；`_ledger_warnings` 1374-1381 镜像只读报警 | `test_writer_consistency_exits_two_for_every_frozen_owner`（逐 owner 反例）、`test_by_is_derived_from_agent_prefix_under_the_frozen_writer_contract`、`test_status_alerts_writer_and_handoff_violations_read_only` | 动态 |
| 10 | HC-RL-A93 | 编排与监工 seq 区间不交错 | 满足 | `_validate_writer_handoff` 1136-1164：monitor 属事件不得先于本实例 `stage_start`（1155-1158）、任何事件不得在 `stage_close` 后（1159-1164）、node 行不得借 `stage_id=` 冒名他实例（1147-1151）；stage 事件经 note 寻址 `STAGE_NOTE_EVENTS` 87-89 / `_stage_of` 1313-1325；`_ledger_warnings` 1382-1421 镜像 | `test_monitor_owned_events_need_their_instances_stage_start`、`test_writer_handoff_forbids_writes_after_the_instance_closed`、`test_node_scoped_events_cannot_claim_a_foreign_stage`、`test_status_mirrors_pre_start_and_attribution_warnings`、`test_design_10_2_sequence_is_accepted_in_order_with_writer_runs`（§10.2 分区 3/7/2 断言） | 动态 |
| 11 | HC-RL-A89 | 阶段级事件、关闭与跨阶段依赖时序 | 满足 | `plan_loaded` 唯一且居首 `_require_sole_plan_loaded` 1053-1056；`stage_start` 每实例一次且先于 `monitor_launch` 1105-1112；`monitor_launch` 须在 `stage_start` 后 1113-1116；`stage_close` 须 start+launch+全节点 closed+终态 result 1117-1133；lint 侧跨阶段依赖不得指向后面阶段 586-598 | `test_design_10_2_sequence_is_accepted_in_order_with_writer_runs`、`test_stage_result_and_close_preconditions_exit_two`、`test_stage_close_requires_a_monitor_launch`、`test_a89_lint_rejects_a_backward_cross_stage_dependency` | 动态 |
| 12 | HC-RL-A65 | 未触发 agent 不算悬空 | 满足 | `agents[]` 仅由 `agent_launch` 行派生 1573-1591；`_unclosable_reasons` 只列已拉起 agent 1346-1356；`_validate_node_close` 同样只看已拉起 955-963 | `test_unlaunched_agents_are_never_reported_as_dangling`（checker/scribe/decider 不进 agents）、`test_node_close_ignores_an_untriggered_agent` | 动态 |
| 13 | HC-RL-A61 | 当前节点与 pending/ready/open 派生 | 满足 | `node_states` 1536-1547（依赖未全闭→pending、有 node_start→open、否则 ready；空账本全 pending）；`current_node` 取节点表首个未关活跃节点 1556 | `test_current_node_and_node_states_follow_the_frozen_table`（pending/ready/open/closed 四态迁移）、`test_current_stage_prefers_the_open_instance_awaiting_close` | 动态（current_stage 的精化规则见 F-HRQ-01） |
| 14 | HC-RL-A81 | closed 只读 node_close，closable 独立 | 满足 | `closed` 唯一来源 `_node_closed` 766-767（state 派生 1539）；`closable` = 无 `_unclosable_reasons` 1600，不要求 node_start；`_validate_node_close` 952-968 为 add 侧守门 | `test_closed_reads_only_node_close_and_closable_is_independent`（done 未 close→open+closable；close→closed；无 start 的 close→closed+不可关） | 动态 |
| 15 | HC-RL-A62 | status JSON schema/排序/计数；plan.decision_mode | 满足 | `status_document` 1728-1779 恰好 13 顶层键；`plan`{marker,cards,decision_mode}；`stages[]`/`nodes[]`/`agents[]` 键集精确；顶层 `last_stage_result` 三键 `_last_result_document` 1717-1725，`stages[].result` 五键 `_result_document` 1704-1714；stages/nodes 按节点表序 1472-1474/1593-1604，agents 按 (node,首 launch seq) 1579；`decision_mode` 缺省派生 auto 446 | `test_status_json_schema_keys_types_and_order_are_exact`、`test_design_fixture_projects_the_complete_document`（全文档等值断言）、`test_stage_result_projection_carries_five_keys_with_and_without_amend`、`test_decision_mode_accepts_frozen_values_and_rejects_others`、`test_valid_plan_defaults_decision_mode_and_resolves_default_dependency` | 动态 |
| 16 | HC-RL-A73 | superseded 不进三列表；仅 superseded_ignored 差 | 满足 | 活跃过滤 `_active_node` 733-737 / `_active_node_map` 1025-1026 / `active_nodes` 1465；`superseded_ignored` = 节点+agent 合计 1615-1618；superseded/未知实例的 stage_result 不进投影 1489-1490 | `test_superseded_rows_only_change_the_ignored_count`（两投影 pop 计数后完全相等）、`test_status_and_lint_match_with_and_without_superseded_rows`、`test_empty_ledger_pending_nodes_exclude_superseded_rows` | 动态 |
| 17 | HC-RL-A107 | attempt 与 X 独立触发 strategist | 满足 | `LossStop` 1628-1648；`loss_stop` 1651-1701：attempts 按 `(node,agent名)` 数 `agent_launch`，exhausted 要求 count≥attempt_max 且最新行仍需重拉（agent_lost/cancelled 或之后 stage failed `_stage_failed_after` 770-781）；x_rounds 按卡取最高已开 X#k，exhausted 要求 k≥rework_max_rounds 且最新 result=failed；`triggered` 任一即真 | `test_attempt_and_x_loss_stops_trigger_independently`（只 attempt/只 X/皆未 三例）、`test_attempt_loss_stop_counts_stage_failed_relaunch_debt` | 动态 |
| 18 | HC-RL-A116 | recipe 三值 + 每 R 实例 reviewer 集合严格匹配 | 满足 | `RECIPE_TIERS` 63 闭集；`_lint_recipe_reviewers` 618-649（先验档位枚举 626-630、再查配置 631-633、再逐活跃 R 实例比对 role=reviewer 的 agent 名集合 634-649）；`recipe_reviewers` 174-178 | `test_each_recipe_tier_lints_a_matching_r_instance`、`test_recipe_reviewer_mismatch_is_rejected_as_a116`、`test_one_mismatched_r_instance_rejects_the_whole_plan`、`test_an_r_instance_without_reviewer_rows_is_exempt_from_a116`、`test_recipe_value_must_name_a_configured_tier`、`test_recipe_tiers_stay_within_the_frozen_three_value_enum`（配置加 strict 仍拒）、`test_a_config_without_one_frozen_tier_rejects_plans_using_it`（配置删 normal 仍拒）、`test_structural_lint_precedes_the_recipe_check` | 动态 |
| 19 | HC-RL-A131 | roles.toml 11 角色精确 + model/launch 可加载 | 满足 | 仓内 `skill/roles.toml` 43 行：键集={planner,orchestrator,monitor,builder,plan-reviewer,coder,scribe,checker,decider,reviewer,strategist}，与 §6.3 逐字一致（本审 diff 核对）；`_parse_roles` 243-255 强制每角色非空 model+launch；`load_config` 290-295 | `test_shipped_roles_toml_has_the_eleven_design_roles`、`test_broken_configuration_exits_three_with_the_frozen_rule_ids`（缺文件/缺 launch 均 A131 rc3） | 动态+静态 |
| 20 | HC-RL-A92 | 映射承载四类；E11/E12/E13 不进任何阶段 | 满足 | `skill/dh-mapping.toml` 34 行与 §6.3 逐字一致：W=[S0,S1,S2]、C=[S3]、R=[E0,E1,E2,E4,E5,E14,E6,E3]、X=[E2,E3]、F=[E7,E8,E9,E10]，无 E11/12/13；`_parse_mapping` 258-287 校验 stages/recipes 非空表+非空字符串列、limits 两整数、on_exceed.action 非空 | `test_shipped_dh_mapping_carries_the_four_frozen_content_classes`（键值全等断言，含顺序）、`test_broken_configuration_exits_three_with_the_frozen_rule_ids` | 动态+静态 |
| 21 | HC-RL-A115 | 三档 reviewer 集合对齐 dev-harness 节点表 | 满足 | `[recipes.heavy]`=[code-round2,requirement,lesson,consistency]、`normal`=[requirement,lesson]、`light`=[lesson,consistency]（dh-mapping.toml 14-21，注释写明 E2/E14 task_type 派生依据）；权威取值只在 TOML，§6.2 正文无复述（本审 grep §6.2 区间 688-734 零命中 reviewer 名） | `test_shipped_recipes_match_the_dev_harness_node_table`、`test_each_recipe_tier_lints_a_matching_r_instance` | 动态+静态（§6.2 不复述为本审自跑静态证） |
| 22 | HC-RL-A99 | 改 rework_max_rounds 不改代码即变 X 规划；无新公共子命令；配置走 §6.2.1 | 满足 | `XRound`/`plan_x_rounds` 298-320：内部接口，k=1..limits.rework_max_rounds、stage_id=`<card>:X#k`、dh_nodes 读 stages.X，不写文件不加 CLI；公开子命令仍 add/status/lint（argparse 1851-1864）；`plan_loaded.note` 双键 `_plan_loaded_note` 1171-1182 | `test_plan_x_rounds_length_and_ids_come_from_the_loaded_config`（两配置 2/3 轮 + 模块 sha256 三测等值 + `--help` 仍三子命令 + resolver 再喂 planner）、`test_help_lists_exactly_the_three_frozen_subcommands`、`test_plan_loaded_note_carries_config_dir_and_plan_keys` | 动态（A99 §11 的「git diff 为空」证法文字与实测口径差异见前轮 F-B4-R05，§5 处置） |
| 23 | HC-RL-A134 | 无 checker 的合法 plan 过 lint/status | 满足 | 代码无任何 checker 特判：lint 只查「每活跃节点至少一活跃 agent」558-561 与 close 目标 562-565；status 悬空判定只看已拉起者 | `test_plan_without_checker_passes_lint_and_status_without_a_dangling_agent`（close 空/改指 scribe 两形态 lint ok、status 无 checker 字样、reasons 正确） | 动态 |
| 24 | HC-RL-A135 | 三命令均接 --config-dir；五情形 resolver；~ 展开/绝对化/百分号编码入账 | 满足 | argparse 三命令各带 `--config-dir` 1857/1861/1864；`resolve_config_dir` 202-218（显式优先、缺失目录 rc3/A135；默认候选 .claude/.codex 恰一侧才自动选，双侧/零侧 rc3/A135）；`_expand_user` 190-195（`~`/`~/`/`~\`）；`_normalized_dir` 198-199（abspath+normpath）；`_encode_path` 1167-1168（os.sep→/ 后 quote safe="/:~-._"）；`_plan_loaded_note` 1171-1182 丢弃调用方伪造 token、以 resolver 事实重建 | `test_each_subcommand_help_exposes_config_dir`、`test_explicit_config_dir_is_normalized_and_percent_encoded`（非 ASCII+空格 home 的 `~/` 展开）、`test_default_config_dir_resolution_follows_the_five_cases`（五情形全动态）、`test_missing_explicit_config_dir_fails_closed`、`test_plan_loaded_provenance_is_rebuilt_from_the_real_resolver`（伪造/重复/冲突/缺失四例）、`test_plan_loaded_records_the_normalized_absolute_plan_dir`、`test_broken_configuration_exits_three_with_the_frozen_rule_ids` | 动态 |
| 25 | HC-RL-A97 | X 超限 lint 精确拒绝；strategist 链 resume/cancelled 必经 user_decision（auto 亦然） | 满足 | lint：`X#k` 的 k>rework_max_rounds → 606-613（在 A89/A109 之后、A116 之前，单违规精确报 A97）；add：`_validate_strategist_conclusion` 882-897（strategist 归属链的 resume/cancelled 要求最新事件为 user_decision，不查 decision_mode）；`_active_decision_owners` 835-847 | `test_x_rounds_beyond_the_configured_limit_are_rejected_as_a97`（stderr 恰一条 HC-RL-*、add/status 同步 rc3、上限内正例过、抬高配置后同一 plan 合法）、`test_strategist_chain_finales_require_a_user_decision_in_every_mode`（auto×consult × resume×cancelled 四格）、`test_strategist_chain_with_user_decision_runs_both_finales`、`test_decider_chain_resume_stays_gate_free_in_auto_mode`（对照链） | 动态 |

**逐项结论：25/25 满足，无 `缺口` 行。**

---

## 2. 范围审查（RLT_07/09/10/18 抢跑）

| 边界 | 本审实证 | 结论 |
|---|---|---|
| RLT_07 skill 模板消费 | `tools/relay-light/` 全树仅 `relay_log.py`、`test_relay_log.py`、`skill/roles.toml`、`skill/dh-mapping.toml` 四件（本审 `find` 列举）；无 `SKILL.md`、无 `references/adapter-*.md`、无 `install_skill.py`、无五阶段模板文件；`plan_x_rounds` docstring 311-312 自述「不写文件、不加子命令」且实读无文件写路径 | 无抢跑 |
| RLT_09 plan_amend 规则 | `plan_amend` 仅以三层合同允许形态出现：词表成员（36）、法定写者 monitor（79）、无阶段排序约束（1074 注释指明由 A93 覆盖窗口）；status 侧对缺 `nodes=` 的 `plan_amend` 行只加只读报警（1505-1506）；`amend=`/`nodes=` 仅作 `stage_result.note` 的只读投影进 `stages[].result`（1308/1500/1712）。**无** add 侧 A119 note 校验、无 A120 表尾追加放宽、无 A122 白名单、无 A123 amend= 必填 | 仅词表/归属/只读投影，合规 |
| RLT_10 lint --json 等 | `lint_parser` 仅 `--plan`+`--config-dir`（1862-1864）；无 `--json`、无 violations JSON 形态；`tools/tests/` 无 `relay-light-log.ps1` 薄壳，`run-relay-tests.ps1` 未登记 relay-light | 无抢跑 |
| RLT_18 watch | 源码 grep `watch`/`herdr`/`subprocess` 零命中；`EVENTS` 词表无 watch 事件；唯一 `open()` 为账本追加（1206） | 无抢跑 |
| 其他 | 无 Herdr 驱动、无 pane/终端操作、无除 `relay_log.jsonl` 外的文件写、无网络/子进程调用（纯标准库）；公开 CLI 精确三词 | 干净 |

## 3. 语义审查（四处重点）

**① A44（status 不判产出）**：通过。全部输出词汇为账本事实转述——节点态（pending/ready/open/closed）、`不可关：X 无终态事件`/`X 无 done 终态`、`可关`、`在场 agent：…最近 <event> @ <ts>（静默 hh:mm:ss）`、阶段 `result=<outcome>`；`suggested_action` 为 §3.5 明示的派生建议（非命令）且只进 JSON。设计「Herdr done 与账本 done 不同义」的边界在实现侧表现为：status 从不因产出内容断言「通过/合格」，`test_status_is_read_only_and_never_rejects_ledger_problems` 另证账本畸形也只报警不改写。

**② Recipe/stages/limits/on_exceed 对 §6.2/6.3**：通过。三档 Recipe 为代码内冻结闭集 `RECIPE_TIERS`（63）——配置既不能加档（strict 反例被拒）也不能删档（normal 反例被拒），取值权威仍在 TOML 的 per-档 reviewers 列表；stages/limits/on_exceed 与 §6.3 样例逐字相等；`on_exceed.action="strategist-then-user"` 被 `loss_stop`+`_validate_strategist_conclusion` 实现为「任一计数到顶→strategist→必经 user_decision」，note 段文字「不叠加、不互重置」与 `LossStop` 双字段语义一致。

**③ attempt/X 双计数对 §7.3/§9.3**：通过。attempt 键=(node, agent 名)、每节点 #1 起、仅 `agent_lost`/`cancelled`/阶段 failed 后重拉才 +1（`_validate_agent_transition` 919-928 与 `loss_stop` 1663-1672 同一组前因）、`checkpoint` 往返不增（只数 `agent_launch` 行）；X 按卡取最高已开 `X#k`、达 `rework_max_rounds` 且最新 result=failed 才 exhausted（§9.3「X2 仍不过→拉 strategist」的直接机械对应）；两计数互不进对方字段，`triggered` 为并集、出口同一条 strategist→user_decision 链。已知读法裁决：attempt 侧「计数达上限且仍需重拉才触发」、X 侧「仍不过才触发」——见前轮 F-B4-R02 已裁闭合，本审同意该读法（字面「拉起第 3 次即触发」会把 attempt_max=3 实际退化为 2）。

**④ `--config-dir` 对 §6.2.1**：通过。五情形齐备（显式优先；仅 claude/仅 codex 自动；双侧/零侧 fail-closed rc3）；`~` 展开→`abspath`→`normpath` 顺序正确且不解析符号链接；`plan=`/`config_dir=` 由 resolver 事实重建，调用方伪造 token 全部丢弃（四例动态证）；编码为 `quote(path, safe="/:~-._")` 与 §6.2.1 公式逐字一致；三命令共用同一 `load_config(resolve_config_dir(...))` 入口（1869-1872），无 `config=None` 绕过路径；选中目录内文件缺失/损坏按 A131/A92 分码 rc3（非 A135），与 §6.2.1 末段一致。

## 4. Findings（F-HRQ-*）

无 P0/P1/P2。以下 5 项均为 P3 级「合同文字 vs 实现口径」登记/结转事项，均不改本卡代码即可流转：

| ID | 级别 | 位置 | 事实与影响 | 处置建议 |
|---|---|---|---|---|
| F-HRQ-01 | P3 | `relay_log.py` 1556-1566 | `current_stage` 存在一处与 §3.5 字面「其 stage 为当前阶段」的受控偏差：当 `current_node` 所属实例从未 start 而存在 open 实例时，取最新 open 实例（先 awaiting-close）。该精化保住 A106 的可路由性（否则 C#1 已出 done、待 stage_close 的窗口会丢 `last_stage_result`/`suggested_action`），已被 `test_current_stage_prefers_the_open_instance_awaiting_close` 钉死；属 B3-F2 修复的既定形态 | 不阻断；建议 design §3.5「当前节点与 open 阶段派生」补一句该窗口的规则文字，使字面与实现对齐（设计文字修订事项） |
| F-HRQ-02 | P3 | `relay_log.py` 974-978, 985-988 | `plan_loaded` 的 `node` 未校验「第一个非 superseded 节点」（§3.4 表）——任一活跃节点均可填；因 `plan_loaded` 必居首且不在 `STAGE_NOTE_EVENTS`，仅影响该行自身的 stage 归属（读侧）。B3R1 批审「首节点未核」P3 注记的同一事实 | 不阻断；结转登记，归后续加固或 RLT_09 一并处理 |
| F-HRQ-03 | P3 | `relay_log.py` 1513-1517 | `monitor_relaunch_count` 把「failed 窗口内的崩溃重拉」同样计为 failed 因果重拉——账本词表无 cause 维度，两种 `monitor_launch` 机械上不可分；A106 oracle 只要求「重拉至多一次后转 notify_user」，现实现满足，但 §3.5「**因 failed** 重拉监工的次数」字面更严。F-B3-RELAUNCH-COUNT 修复后的已知残差 | 不阻断；词表级限制，若要在账本区分须在 §3.4 加 `monitor_launch` 的 cause= 语义（合同变更，非本卡） |
| F-HRQ-04 | P3 | `relay_log.py` 1489-1490, 1365-1421 | 指向**未知**（从未进计划）stage 实例的 `stage_result` 在 status 投影中被静默 `continue`，`errors` 不留条目；superseded 实例的同处理是 A73 明文要求，未知实例属合同沉默区。与 F-HR1-02（stage 事件 note 寻址、`--node` 不核实例节点集）同源 | 不阻断；可接受现状，或后续由设计决定是否在 errors 加只读提示（属合同增补，本卡不自扩） |
| F-HRQ-05 | P3 | `relay_log.py` 66 | `SUGGESTED_ACTIONS` 常量定义后无任何生产引用（测试侧 `test_relay_log.py:1866` 另有一份同名集合），路由表实际写字面量。结转 F-HR1-01 | 不阻断；删除该常量，或在 `_suggested_action` 返回值侧接防回归断言 |

## 5. 前轮 open 项处置（代码轮 1 的 open=6 复核意见）

| 前轮 ID | 需求方向裁决 |
|---|---|
| F-B4-R01（止损出口无产品消费方，P2→open） | 维持 open、移交主控/用户裁决。A107 oracle 仅要求「两套计数独立触发」的单测证据，`loss_stop` 已满足；「谁消费」是 RLT_07/RLT_18 归属问题，不构成 25 条缺口 |
| F-B4-R03（attempt_max 非硬闸，P3→open） | 维持 open 为产品设计裁决。A107/§7.3 未要求 add 侧拒超 attempt_max，与 X 侧 A97 硬闸的不对称逐字合规 |
| F-B4-R05（A99 证法文字「git diff 为空」在 WIP 期不可达，P3→open） | 维持 open 为 §11 文字修订事项。本审认可 hash 口径的等效证明力（`test_plan_x_rounds…` 三测等值），建议设计把证法文字改为「同一不变二进制按配置产出不同结构」 |
| F-B4-R06（XRound 仅骨架，RLT_07 消费时 agent 行需自拼，P3→open） | 维持 open 为 RLT_07 交接登记事项；本卡范围只要求内部规划等效体 |
| F-HR1-01（SUGGESTED_ACTIONS 死常量） | 结转为本审 F-HRQ-05 |
| F-HR1-02（stage 事件 note 寻址不核 `--node` 归属实例节点集，静默接受） | 维持结转；本审 F-HRQ-02/F-HRQ-04 记录同族另两个读/写侧静默点。处置同前轮：无 25 条内 oracle 要求该绑定，§8.2 已声明不做身份真伪校验 |

## 6. 证据与 NOT_RUN 台账

- **本审自跑动态证**：`python3 -m unittest test_relay_log -v` → `Ran 108 tests in 138.101s OK`（快照内、非转述）；25 条涉及的全部测试名均在此 108 例内。
- **本审自跑静态证**：两份 TOML vs §6.3 逐字比对；§6.2（688-734）grep 无 reviewer 名复述；`tools/relay-light/` 全树列举；`watch`/`herdr`/`subprocess`/文件写 grep；`--help` 三子命令（经测试断言复核）。
- **NOT_RUN**：无。本审所需全部判定点均取得自有动态或静态证据；历史「施工前状态」类比较不适用（本任务为现状复核）。

## 7. 结论

**APPROVE**。25/25 验收项在实现与测试两侧均有满足证据（本审实跑 108/108 全绿），范围审查无 RLT_07/09/10/18 抢跑，四处语义重点与 design §3.5/§6.2/§6.3/§7.3/§9.3 一致。open=5，全部为 P3 登记/结转事项（1 项设计文字对齐、1 项 plan_loaded 首节点校验残差、1 项词表级因果不可分残差、1 项未知实例静默点、1 项死常量），无阻断项；代码轮 1 遗留的 6 项 open 处置意见维持其「设计层裁决/交接登记」性质，其中 F-HR1-01/02 已分别结转进 F-HRQ-05/02/04。

DONE APPROVE open=5
