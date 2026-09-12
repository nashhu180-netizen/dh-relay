<!-- dh:v1 -->
# review — RLT_05

> RLT_05 task_type=`heavy`。施工者不得复核自己的卡；先完成代码轮 1 及其必要整改，之后代码轮 2、需求方向、一致性、教训四条适用路径进入同一 Review Batch 并发。**五路已于 2026-09-12 全部闭合 APPROVE**（reviewer/E-ID/hash 见下表与 progress.md E-088～E-095）。

## Heavy Recipe 路径登记

| 路径 | 时序/独立性 | 必审靶子 | reviewer | 证据 | 状态 |
|---|---|---|---|---|---|
| code-round1 | construction 完成后的第一道代码复核；fresh，非施工者 | 四批整卡 diff、错误码/时序、配置无硬编码、25 ID test 映射、有效单测候选；另裁决 F-B4-R01～R06 与 findings 登记读法 | `rlt05-hr-devin` · Devin SWE-2 Max · fresh · 快照 `/tmp/rlt05-hr-r1.ssJyhI/repo`（E-088） | `reviews/heavy-code-r1-devin.md`（E-089）；108/108+21 探针；F-B4-R02/R04 闭合，R01/R03/R05/R06 转设计/交接，新登 F-HR1-01/02 | approved 2026-09-12 · open=6 全登记项 |
| code-round2 | code-round1 P0/P1 闭合后，与后四路 Review Batch 并发；fresh 且不复用 round1 | 核 round1 闭合、增量 diff、选择并执行有效 mutation，改坏必须行为红且还原全绿 | `rlt05-hr2-devin` · SWE-2 Max · fresh · 快照 `/tmp/rlt05-hr-r2.2ophD4/repo`（E-090） | `reviews/heavy-code-r2-devin.md`（E-093）；轮1闭合核对+双快照字节级零增量证明+两域有效 mutation 均行为红、还原 108 绿 | approved 2026-09-12 · open=6 全结转 |
| requirement | 同一 Review Batch 独立路径 | 逐字对齐 DevPlan 25 条；无 RLT_07/09/18 抢跑；status 不做质量判断；Recipe/止损/配置定位语义 | `rlt05-hr-req-devin` · SWE-2 Max · fresh · 快照 `/tmp/rlt05-hr-req.L1qX6w/repo`（E-090） | `reviews/heavy-requirement-devin.md`（E-094）；25/25 逐项对齐、无抢跑、语义一致；open=5 全 P3 登记/残差 | approved 2026-09-12 · open=5 登记项 |
| consistency | 同一 Review Batch 独立路径 | design §2/3/5/6/7/9/11 ↔ DevPlan ↔ TOML ↔ Python ↔ tests 的闭集比对；A62/A73 分域 | `rlt05-hr-cons-devin` · SWE-2 Max · fresh · 快照 `/tmp/rlt05-hr-cons.vuk3VN/repo`（E-090） | `reviews/heavy-consistency-devin.md`（E-095）；五方闭集 25 行零漂移、A62/A73 分域一致；open=10（新增 F-HCN-01~04 P3 + 结转 6） | approved 2026-09-12 · open=10 全登记项 |
| lesson | 同一 Review Batch 独立路径 | 核 `lesson_candidates.md` 的证据、去重与可复用性；若 absent 形成可核查 N/A，不拉 Pair、不要求 Binding | `rlt05-hr-les-devin` · SWE-2 Max · fresh · 快照 `/tmp/rlt05-hr-les.tCj1xu/repo`（E-090） | `reviews/heavy-lesson-devin.md`（E-092）；11 候选全成立、open=5 全 P3 clerical（F-HLS-01~05） | approved 2026-09-12 · open=5 登记项 |

## 有效单测·改坏必红（代码轮 2 必填）

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应测试 | 命令 | 施加 hash | 还原 hash | 行为红结果 | 状态 |
|---|---|---|---|---|---|---|---|---|
| `relay_log.py:1123` `_validate_stage_event` stage_close 分支（rlt05-hr2-devin 选定） | `unclosed = [node.node for node in instances[stage_id] if not _node_closed(entries, node.node)]` → `unclosed = []` | status-lifecycle | `test_stage_result_and_close_preconditions_exit_two`（`test_relay_log.py:2449→2381`） | `/tmp/rlt05-hr2-mut/repo` 隔离副本 `-k RelayLifecycleTests` + 全量 | `c8563fe56c46a8bd83919364a2addff940961e827cc0794a607a8c1096154089` | `90707b7e61a4aa0a6c1b22010c8ddddfa250f71da41bbb74105ac83c78527798` | `FAILED (failures=1)`：断言 `^error: HC-RL-A89 ` 未命中、误落 `HC-RL-A112`——行为断言红（AssertionError）；还原后全量 108/108 OK | done（E-093，明细 `reviews/heavy-code-r2-devin.md` §3.1） |
| `relay_log.py:644` `_lint_recipe_reviewers` per-R 实例集合比较（rlt05-hr2-devin 选定） | `if names != set(expected):` → `if names < set(expected):`（集合相等→严格子集才拒） | config-recipe | `test_recipe_reviewer_mismatch_is_rejected_as_a116`（`:1465`）+ `test_one_mismatched_r_instance_rejects_the_whole_plan`（`:1505`） | `/tmp/rlt05-hr2-mut/repo` 隔离副本 `-k RelayConfigTests` + 全量 | `51236fab1f15d665a6681881aa6a5bf595d5eb8299b27e306e93c0b634bb58a2` | `90707b7e61a4aa0a6c1b22010c8ddddfa250f71da41bbb74105ac83c78527798` | `FAILED (failures=2)`：超集与不相交 reviewer 集各被一条 `2 != 0` 断言咬住——配置驱动行为红；还原后全量 108/108 OK | done（E-093，明细 `reviews/heavy-code-r2-devin.md` §3.2） |

## 逐条机器证元数据（25/25 已回填，证据源以各独立审件为准）

| ID | Batch | 机器 oracle / 必审靶子 | 预期证元数据 | 实际证据/结论 |
|---|---:|---|---|---|
| HC-RL-A43 | 2 | §10.1+§10.2 → 完整 §10.3 逐行一致；六项只是子集，含 result 与当班写入者 | test 名、固定 now、完整 stdout snapshot、exit 0 | PASS（heavy-r1 §2 动态+静态+前证 E-032/E-033）：`test_design_10_3_text_snapshot_is_reproduced_line_by_line`，now=10:43:52 注入、逐行 == §10.3 |
| HC-RL-A44 | 2 | renderer 禁止质量判断词，只述账本事实 | 静态词表 test、扫描范围、零命中 | PASS（heavy-r1 动态+静态）：`test_status_wording_carries_no_quality_judgement` JSON/文本全量扫描零命中 |
| HC-RL-A110 | 3 | R#1 failed 与 R#2 done 独立，R#2 close 接受 | test 名、完整事件序列、rc | PASS（heavy-r1 动态+静态）：`test_repeated_stage_instances_stay_independent_and_alert_on_double_open`；`latest_stage_result` 按实例过滤 `:1042-1050` |
| HC-RL-A111 | 3 | 跨卡双 open；同卡双 open 报警 | 正反 test、JSON open_stages、HC-ID | PASS（heavy-r1 探针动态）：同卡双 open 接受+`errors` 报 A111；跨卡正例 `test_open_stages_lists_cross_card_parallel_instances` |
| HC-RL-A112 | 3 | node_close→stage_result→stage_close 偏序三反例 | test/subtest、rc=2、ledger bytes 不增 | PASS（heavy-r1 探针动态 + 轮2 mutation `relay_log.py:1123` 行为红）：`_validate_stage_event` `:1117-1133`；`test_stage_result_and_close_preconditions_exit_two` |
| HC-RL-A105 | 3 | 四 outcome；缺字段/非法拒；blocked→done 最新生效 | test、JSON latest result、HC-ID | PASS（heavy-r1 动态+静态）：`test_stage_result_and_close_preconditions_exit_two`/`test_four_outcomes…`；latest 取最新行 |
| HC-RL-A118 | 3 | blocked 不可 close；done/cancelled 可 close；cancelled 引 user_decision | 三序列、rc、note | PASS（heavy-r1 动态+静态）：`test_blocked_and_cancelled_finales_follow_the_frozen_rules`；`:1090-1091,1130-1133` |
| HC-RL-A106 | 3 | outcome→五 suggested_action；failed 只重拉一次 | 参数矩阵、relaunch count、精确枚举 | PASS（heavy-r1 动态+静态）：`test_four_outcomes_drive_suggested_action_and_relaunch_count`+`test_monitor_relaunch_count_counts_only_failed_relaunches`（因果计数 `1513-1517`） |
| HC-RL-A85 | 3 | 四类越权写者拒绝并由 status 报警；不验真伪 | test/subtest、rc=2、errors JSON | PASS（heavy-r1 动态+静态）：`WRITER_BY_EVENT` `70-84` 逐字=§3.4；`test_writer_consistency_exits_two_for_every_frozen_owner` 矩阵 |
| HC-RL-A93 | 3 | §10.2 合法区间与交错反例 | seq 列表、报警内容、HC-ID | PASS（heavy-r1 探针动态）：pre-start/伪 `stage_id=`/post-close 三反例全 rc2；`_validate_writer_handoff` `1136-1164` 双界 |
| HC-RL-A89 | 3 | 五条阶段事件/跨阶段依赖反例 | 五 subtest、rc=2、reason | PASS（heavy-r1 动态+静态）：`_validate_stage_event` `1069-1133` + `lint_plan` A89 行 `586-598`；`test_a89_lint_rejects_a_backward_cross_stage_dependency` |
| HC-RL-A65 | 2 | 未触发 scribe 不在 active agents/reasons | JSON agents/reasons 精确断言 | PASS（heavy-r1 动态+静态）：`test_unlaunched_agents_are_never_reported_as_dangling`/`test_node_close_ignores_an_untriggered_agent` |
| HC-RL-A61 | 2 | current node + pending/ready/open 三态 | 三 fixture、JSON exact values | PASS（heavy-r1 动态）：`test_current_node_and_node_states_follow_the_frozen_table` + 探针 `current_node=R1`；三态表 `1536-1547` |
| HC-RL-A81 | 2 | 无 node_close 时 open+closable true；有时 closed | 正反 JSON、test 名 | PASS（heavy-r1 动态+静态）：`test_closed_reads_only_node_close_and_closable_is_independent`；`_node_closed`/`_unclosable_reasons` 分域 |
| HC-RL-A62 | 2 | 顶层/嵌套精确 key set、类型、空值、排序、decision_mode；有/无 plan_amend 的 result 五键 | schema table test、key-set dump、三模式、两类 result fixture | PASS（heavy-r1 动态+静态）：`test_status_json_schema_keys_types_and_order_are_exact`+`test_stage_result_projection_carries_five_keys_with_and_without_amend`；`status_document` `1728-1779` 13/5/3 键精确 |
| HC-RL-A73 | 2 | 含/删 superseded 的规范化活跃投影相等，仅 ignored 变 | paired fixture、normalized diff | PASS（heavy-r1 动态+静态）：`test_status_and_lint_match_with_and_without_superseded_rows`/`test_superseded_rows_only_change_the_ignored_count` |
| HC-RL-A107 | 4 | only-attempt/only-X/neither 三例独立 | 参数矩阵、两个 count、trigger | PASS（heavy-r1 动态）：`test_attempt_and_x_loss_stops_trigger_independently`+`test_attempt_loss_stop_counts_stage_failed_relaunch_debt`；探针四断言复证独立/在飞豁免/X-done 不触发 |
| HC-RL-A116 | 1 | 每个活跃 R 实例取 `role=reviewer` 的 agent 名集合；无 R/零 reviewer 不触发；结构 lint 先报 | 三档/多实例/豁免/优先级 fixture、lint rc/HC-ID、fixture 对齐清单 | PASS（heavy-r1 动态+静态 + 轮2 mutation `relay_log.py:644` 行为红）：`RECIPE_TIERS` 闭集先验+per-R 集合比较 `626-649`；`test_recipe_reviewer_mismatch_is_rejected_as_a116`/`test_one_mismatched_r_instance_rejects_the_whole_plan` |
| HC-RL-A131 | 1 | roles.toml 角色键与 design §6.3 的 11 个角色精确相等；每个角色均有 model/launch | tomllib 加载、精确角色集合与键集合 | PASS（heavy-r1 tomllib 实测+静态）：`test_shipped_roles_toml_has_the_eleven_design_roles`；`_parse_roles` `243-255` A131 exit3 |
| HC-RL-A92 | 1 | stages/recipes/limits/on_exceed 四类；R 精确节点；无 E11/12/13 | key-set/value assertions | PASS（heavy-r1 tomllib 实测+静态）：`test_shipped_dh_mapping_carries_the_four_frozen_content_classes` 全键全值；`_parse_mapping` `258-287` A92 exit3 |
| HC-RL-A115 | 1 | heavy/normal/light 集合精确相等；§6.2 不复述具体集合 | 三集合断言、权威配置路径/hash；Batch 1 小审静态核对 §6.2 | PASS（heavy-r1 动态+静态）：`test_shipped_recipes_match_the_dev_harness_node_table` 三档精确集合；§6.2 确认不复述 |
| HC-RL-A99 | 4 | 2→3 内部 X 规划；两次运行核心 SHA-256 不变；help 三命令；配置来源只复算 Batch 1 的 §6.2.1 结果 | 生成结果、双 hash、help、plan_loaded 双键与配置来源复算 | PASS（heavy-r1 动态+前证 B4 双 hash `90707b7e…`×3）：`test_plan_x_rounds_length_and_ids_come_from_the_loaded_config` 2↔3 + `test_plan_loaded_note_carries_config_dir_and_plan_keys`；证法替换已追认（P2-2/F-B4-R05） |
| HC-RL-A134 | 2 | 结构合法的 C 计划删 checker、close 留空或指 scribe 后仍过 lint/status | 两份只差 checker/close 的合成 plan、lint/status rc | PASS（heavy-r1 动态 suite）：`test_plan_without_checker_passes_lint_and_status_without_a_dangling_agent` |
| HC-RL-A135 | 1 | 三 CLI `--config-dir`、显式优先、五情形、`~` 展开、绝对路径规范化与百分号编码；双侧/零侧拒绝且账本不增 | 三 help、五情形、空格/非 ASCII home、解码绝对路径、rc/HC-ID/ledger bytes | PASS（heavy-r1 动态+静态）：`resolve_config_dir` `202-218` 五情形；`test_default_config_dir_resolution_follows_the_five_cases`/`test_explicit_config_dir_is_normalized_and_percent_encoded`/`test_missing_explicit_config_dir_fails_closed` |
| HC-RL-A97 | 4 | 其它结构合法且唯一 X 超限时精确 HC-RL-A97；auto strategist 强制 user_decision；事件归属两类 | lint rc/精确 ID、两终局序列、agent columns | PASS（heavy-r1 动态 + B4 小审双半探针）：`test_x_rounds_beyond_the_configured_limit_are_rejected_as_a97`/`test_strategist_chain_finales_require_a_user_decision_in_every_mode`；A97 位于全部结构规则后 A116 前、无冒充 |

## 批次小审记录（不是 heavy 最终复核）

| Batch | reviewer | 输入 diff/E-ID | P0/P1 | 结论 | 状态 |
|---|---|---|---|---|---|
| 1 | `rlt05-b1-check-sol` · Codex gpt-5.6-sol · sandbox read-only · fresh | E-004～E-026；`reviews/batch1-review-sol.md` | R1 原 P1=2/P2=1 均 resolved；定向复审 open=0 | `APPROVE`；Batch 1 小审闭合；Batch 2 仍待独立授权 | approved-after-rework-r1 |
| 2 | `rlt05-b2-check-sol` / `rlt05-b2-check2-sol` · Codex gpt-5.6-sol · fresh | E-028～E-048；`reviews/batch2-review-sol.md` | R1 原 P1=1 resolved；定向复审 new P0/P1=0、open=0 | `APPROVE`：顶层三键 / 阶段五键已分离，主控复跑 1/12/84 全绿 | approved-after-rework-r1 |
| 3 | `rlt05-b3-review-devin`（R1）/ `rlt05-b3-r1-rereview-devin`（定向复审）· Devin SWE-2 Max · fresh | E-052～E-062；`reviews/batch3-review-devin.md`、`reviews/batch3-r1-rereview-devin.md` | R1 P1=1/P2=3 经 rework R1 全 resolved；复审 new P0/P1=0、open=0 | `APPROVE`（E-070/E-071） | approved-after-rework-r1 |
| 4 | `rlt05-b4-review-opus` · Claude opus · effort high · fresh · 可写隔离快照 | E-075～E-086；快照 `/tmp/rlt05-b4-review.Qu4zUa/repo`；产出 `reviews/batch4-review-opus.md` | P0=0、P1=0；P2=1、P3=5，open=6（F-B4-R01～R06 全部非阻塞待裁，转 heavy 复核） | `APPROVE`（E-087）；focused 8/8、全量 108/108、A97 双半/A99/A107 全动态复算 + M1–M4 定向变异证判别力 | approved 2026-09-12 |

## 需求境证据（验收闸备料 · 主控汇编 E-096）

> 口径：需求/人验项 + 场景操作路径 + 证据 ID + 结论。RLT_05 是内部工具卡，「场景」= 真实 CLI（`add`/`status`/`lint`）对合成 plan 的操作路径；全部证据已由各 fresh reviewer 在隔离快照中动态取得，非转述施工文本。

| 需求项 | 场景操作路径 | 证据 ID | 结论 |
|---|---|---|---|
| status 全量派生（A43/A44/A61/A62/A65/A73/A81） | `add plan_loaded+事件链` → `status`（text/JSON）对 §10.3 样张逐行 + schema 键集/排序/superseded 差分 | E-032/E-033；`heavy-code-r1-devin.md` §2；`heavy-requirement-devin.md` 25 行表 | 满足 |
| 阶段生命周期与写者闸（A85/A89/A93/A105/A106/A110/A111/A112/A118） | 合成账本逐类写入（合法+越权+时序反例）→ `add` rc2 + `status.errors` 报警 + `suggested_action` 五枚举 | E-055～E-068；heavy-r1 21 探针；轮2 mutation `:1123` | 满足 |
| 配置/Recipe（A92/A115/A116/A131/A134/A135） | 三 CLI `--config-dir` 五情形 + 替换/损坏 TOML + 合成 HOME + 无 checker plan | E-008/E-010/E-011/E-012/E-017～E-022；heavy-r1 tomllib 实测；轮2 mutation `:644` | 满足 |
| 止损与内部 X 规划（A97/A99/A107） | 双配置 `plan_x_rounds` 同 hash 探针 + A97 超限 lint/status/add 三路 + strategist 四终局 + `loss_stop` 五场景 | E-078～E-084；`batch4-review-opus.md` M1–M4；heavy-r1 §1 探针 | 满足 |
| 边界/卫生 | `git status --porcelain` + `git diff --check` + `--help` 闭集 + 死代码/越界 grep | E-084/E-085；heavy-r1 §6；heavy-consistency §闭集表 | 满足 |
| 双域有效单测 | 隔离副本 `/tmp/rlt05-hr2-mut/repo` 施加定向变异 → focused 行为红 → 还原 → 全量 108 绿 | `heavy-code-r2-devin.md` §3.1/§3.2（hash 已回填上表） | 满足 |

**未覆盖/如实标注**：E-076 实现前红不可原样复现（以 B4 小审 M1–M4 + 轮2 双域 mutation 替代）；B1/B2 批审 reviewer 沙盒内动态项原环境 NOT_RUN，已由主控源 worktree 复跑补齐（E-026/E-047/E-048）。无伪证。

## AI 提交区 ⚠️ This is not human approval

**当前状态**：RLT-A-06/RLT-B-06 已正式闭合；Batch 1–4 施工与小审均 `APPROVE`；heavy 五路全部闭合——代码轮1（E-089）/轮2（E-093，双域有效 mutation 已执行并回填上表）/需求（E-094）/一致性（E-095）/教训（E-092）全 `APPROVE`。decider 二轮裁决（E-097）唯一代码 rework 项 F-HR1-01/F-HRQ-05 已执行并经 fresh 定向复审 APPROVE open=0（E-098/E-099，`reviews/rework-fhr1-rereview-devin.md`）。open 项全部为登记/设计裁决/交接事项（明细见各审件与 findings.md「heavy 复核处置裁决登记」），**代码侧与复核侧无任何未闭合项**。需求境证据已汇编（上节）；as-built 快照已落盘（`as-built/RLT_05-实现快照.md`）。用户「1 2 3 都授权」（E-101）后：PR #9 三硬门 CI 全绿并 squash 合入 master（`a7ce13c`，E-102），master 集成复验 108/108 OK，`verify(relay-light)` 提交随本次落盘、真实 SHA 由随后 docs 回填补齐；人工验收依用户明文授权记录于下方签名区。

**材料齐没齐**：[x] 4 场批审 + heavy 五路 + rework 定向复审共 10 份审件在 `reviews/`；25 行 oracle 表 PASS、需求境证据、mutation 双域记录、findings 处置登记、lesson 候选更新全部就位（E-085~E-099）

**as-built 更新了没**：[x] `docs/modules/relay-light/as-built/RLT_05-实现快照.md` 已落盘（E-101 用户授权后由独立节点编写，代码为事实源）

---

## 人类签名区 ✅ 仅凭用户对话确认解锁

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| RLT_05 机器证可支撑收口 | 查看 25 ID、heavy 五路、有效变异与边界证据 | 五路收敛、有效单测改坏必红、全部机器项等价 pass | [x] 用户 2026-09-12 对话明文「1 2 3 都授权」（E-101）：认可机器证据、授权收口包含 verify 与人验 |
