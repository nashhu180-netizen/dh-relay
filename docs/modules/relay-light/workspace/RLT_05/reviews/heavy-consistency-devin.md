<!-- dh:v1 · heavy review · consistency -->
# RLT_05 heavy 复核 · 一致性 — rlt05-hr-cons-devin

- reviewer：`rlt05-hr-cons-devin`（Devin CLI · SWE-2 Max），fresh session，未参与 RLT_05 任何批次施工/批审/代码轮 1
- 快照：`/tmp/rlt05-hr-cons.vuk3VN/repo`（可写一次性快照）；未触碰 `/home/nash/work/dh-relay` 及其 `.dh-worktrees`
- 对象（五方）：`design/01`（§2/§3.1–3.5/§5/§6.2–6.3/§7.3/§9/§11）↔ DevPlan RLT_05 卡 + §6 owner 表 ↔ `tools/relay-light/skill/{roles.toml,dh-mapping.toml}` ↔ `relay_log.py` ↔ `test_relay_log.py`；外加 `workspace/RLT_05/` 全套与 `reviews/` 全部 8 份审件
- 方法：逐节对读 + 机械提取比对（DevPlan §6 owner 行、design §11 oracle ID 集、TOML 与 §6.3 样例逐字节比对、测试断言常量、HC-RL 编号集合）。**本审未执行动态命令**；动态证据一律引用既有 E-ID/审件并标注，未冒充本审所跑。

## 0. 结论

**APPROVE**。五方闭集在全部合同维度逐项**一致**，未发现需要返工的跨工件漂移。检出 4 条本审新增 P3 登记项（均为工作区台账滞后/文档注记层面），结转 6 条既有 open 项（F-B4-R01 为 P2，其余 P3），合计 open=10；全部为非代码、非本卡可自闭合的登记/裁决/交接事项。A62/A73 分域核对一致。

## 1. 五方闭集比对表

标注：**一致**＝五方（design/DevPlan/TOML/实现/测试）口径相同；**漂移**＝存在相互矛盾。design §行号为 `01-RelayLight-产品设计与验收.md` 实测行号；实现行号为 `relay_log.py`；测试行号为 `test_relay_log.py`。

| # | 合同点 | design/01 | DevPlan RLT_05 | TOML | relay_log.py | test_relay_log.py | 判定 |
|---|---|---|---|---|---|---|---|
| 1 | **HC-ID 集合** | §11 含全部 25 个 oracle 行，各一次（机械核对 111 行中 25/25 命中且唯一） | §6 owner 表恰 25 行 →RLT_05，各一次；A91/A108 不出现在 owner 表（退役），A117→RLT_07 | — | 25 条均有实现/拒绝路径（含继承 RLT_03 的编号，无杜撰） | 25 条均有断言锚点 | **一致** |
| 2 | **角色集 11 个** | §6.3 roles.toml 样例 11 角色 | A131 归 RLT_05 | 与 §6.3 样例**逐字节相同**（builder/checker/coder/decider/monitor/orchestrator/plan-reviewer/planner/reviewer/scribe/strategist，各含 `model`+`launch`） | `_parse_roles` 只做结构校验，不写死名（243–255） | `test_shipped_roles_toml_has_the_eleven_design_roles` 精确集合+键集（1405–1420） | **一致** |
| 3 | **stages 映射** | §6.3：W=[S0,S1,S2] C=[S3] R=[E0,E1,E2,E4,E5,E14,E6,E3] X=[E2,E3] F=[E7,E8,E9,E10] | A92 归 RLT_05 | 与 §6.3 **逐字节相同** | `_parse_mapping` 结构校验（258–287） | `test_shipped_dh_mapping_...` 全键全值含 R 顺序精确断言+E11/12/13 缺席（1422–1442） | **一致** |
| 4 | **recipes 三档** | §6.3：heavy=[code-round2,requirement,lesson,consistency]、normal=[requirement,lesson]、light=[lesson,consistency] | A115 归 RLT_05 | 同 §6.3 | 档位名闭集 `RECIPE_TIERS`（63）+ 集合从配置读（631–649） | `test_shipped_recipes_match_...` 三档精确集合（1444–1450） | **一致** |
| 5 | **limits/on_exceed** | §6.3：`rework_max_rounds=2`、`attempt_max=3`、`on_exceed.action="strategist-then-user"`（+note） | 归 A92/A99/A107 | 同 §6.3 | `RelayLimits`（157–162）+ `_parse_mapping` int/非空校验 | 断言 2/3/action/note 非空（1439–1442） | **一致** |
| 6 | **status 顶层 13 键** | §3.5 表（341–355）+ A62 行（1206）逐字枚举 | A62 归 RLT_05 | — | `status_document` 恰 13 键（1728–1779） | `STATUS_TOP_LEVEL_KEYS` 精确集合+逐键断言（1853–1857, 1979–1992） | **一致** |
| 7 | **`last_stage_result` 3 键** | §3.5（345）：`{stage_id, outcome, note}` | 同 A62 | — | `_last_result_document` 恰 3 键（1717–1725） | `STATUS_LAST_RESULT_KEYS`+取值断言（1863, 2209–2230） | **一致** |
| 8 | **`stages[].result` 5 键** | §3.5/A62：`{stage_id, outcome, note, amend, nodes}` | 同 A62 | — | `_result_document` 恰 5 键（1704–1714），与顶层序列化器分离 | `STATUS_RESULT_KEYS`+有/无 amend 两例（1860, 2200–2213） | **一致** |
| 9 | **其余嵌套键集** | §3.5：`plan`{marker,cards,decision_mode}、`stages[]`{stage_id,stage,card,k,state,nodes,result}、`nodes[]`{node,card,stage,type,state,closable,reasons}、`agents[]`{node,agent,last_event,last_ts,idle_seconds} | 同 A62 | — | 逐字段对应（1731–1777） | 四个嵌套常量全部精确断言（1858–1865, 2005–2019） | **一致** |
| 10 | **事件词表 19** | §3.4：9 控制 + 10 agent 事件 | RLT_03 继承（A2 归 RLT_03） | — | `EVENTS`=CONTROL(9)+AGENT(10)（26–53） | `test_all_nineteen_event_words_...` 断言 `len(EVENTS)==19`（636–640） | **一致** |
| 11 | **写者表** | §3.4 写者列：编排 4 事件、监工 5 事件+全部 agent 事件 | A85 归 RLT_05 | — | `CONTROL_WRITERS`/`WRITER_BY_EVENT` 逐字等于 §3.4（70–84） | 写者矩阵测试（657–680 起） | **一致** |
| 12 | **退出码分域** | §3.1/A5（197）：解析级 3（三命令）；lint 规则 2（仅 lint）；add 入参/语义 2；A45 账本 4 | A5/A45/A56 归 RLT_03，本卡复用 | — | `_lint_command` 2→`lint:`、3→`error:`（652–661）；`_runtime_plan` 2→3 重映射（664–671）；`_ledger_error`=4（674）；argparse→`error: arguments` rc2（102–106） | `test_runtime_plan_semantic_errors_map_to_exit_three_while_lint_is_two`（819–842）、`test_ledger_read_...` rc4（844–868）、`test_lint_cli_smoke_...`（569–585） | **一致** |
| 13 | **输出前缀** | §3.5（402/404）：`error:`/`lint:`；`lint: ok` | — | — | `_fail`=`error: <code> <msg>`（185–187）；`lint: <code> <msg>`/`lint: ok`（658–660） | 全程 `assertRegex(r"^lint: HC-RL-..."/r"^error: ...")` | **一致** |
| 14 | **阶段偏序 §5** | stage_start 每实例一次且先于 monitor_launch；stage_result 晚于末节点 node_close；stage_close 要求 start+monitor_launch+全节点 closed+最新 outcome∈{done,cancelled} | A89/A105/A112/A118 归 RLT_05 | — | `_validate_stage_event`（1069–1133）逐字实现；blocked→A118、failed/无 result→A112 | 偏序三反例+终局矩阵测试 | **一致** |
| 15 | **current_stage/current_node §3.5** | 首个非 superseded 未 node_close 节点；open 实例兜底窗口由 B3-F2/B3R1 登记 | A61 归 RLT_05 | — | `derive_status`（1536–1566）：当前节点实例已 start→取该实例；否则 awaiting_close→最新 open；无 open→字面兜底 | `test_current_node_and_node_states_follow_the_frozen_table`（2038–2082） | **一致**（收敛读法已登记并复审闭合） |
| 16 | **suggested_action 分路** | §3.5（398）：done/cancelled→open_next_stage；blocked→wait_user；failed+0 重拉→relaunch_monitor；failed+已重拉→notify_user；其余→none | A106 归 RLT_05 | — | `_suggested_action` 逐字五路（1447–1455） | 四 outcome+计数翻转断言 | **一致** |
| 17 | **monitor_relaunch_count** | §3.5（347）：当前实例内因 failed 重拉次数 | A106 归 RLT_05 | — | 因果计数：仅 `latest_outcome==failed` 窗口内 monitor_launch 计入（1513–1517） | 因果计数测试（`test_monitor_relaunch_count_counts_only_failed_caused_relaunches`） | **一致**（failed 窗口内崩溃恢复亦计入＝已登记残差，见 §3） |
| 18 | **A73 superseded 投影** | §3.5（394/396）+ A73 行（1157）：不进三列表、仅 `superseded_ignored` 变 | A73 归 RLT_05 | — | 全路径走 `active_nodes`/`_stage_instances`/`_node_agents`；`superseded_ignored`=节点+agent 表合计（1615–1618） | 双对照 fixture：整文档相等仅差计数（769–799, 2116–2157） | **一致** |
| 19 | **止损双计数 §7.3** | attempt（节点内同名 agent）与 X 轮数（卡内）独立；任一先到上限→strategist；auto 亦须 user_decision | A97/A99/A107 归 RLT_05 | limits 提供上限 | `loss_stop`（1651–1701）+ `_validate_strategist_conclusion`（882–897）+ `plan_x_rounds`（308–320） | `RelayLimitsTests` 8 条：only-attempt/only-X/neither/双终局矩阵/双配置 | **一致**（触发时点收敛读法经 B4-F1/F2 登记、F-B4-R02 裁决接受） |
| 20 | **A97 lint 映射** | §3.5 表末行（429）：`X#k` 超限→A97 | H4 已闭合 | — | A97 块位于全部结构规则之后、A116 之前（606–613） | `test_x_rounds_beyond_the_configured_limit_are_rejected_as_a97` | **一致** |
| 21 | **A135 resolver** | §6.2.1：显式优先+`~`展开+规范化+百分号编码；单侧自动、双侧/零侧 exit 3；plan_loaded note 含 `config_dir=`/`plan=` | A135 归 RLT_05 | — | `resolve_config_dir`（202–218）+`_expand_user`/`_normalized_dir`/`_encode_path`/`_plan_loaded_note` 无条件重建（190–199, 1167–1182） | 五情形/编码/双键各一次测试 | **一致** |
| 22 | **Recipe 运行时校验 A116** | §11 A116：三值+实际 reviewer 集合严格匹配配置 | H1/H2 已闭合 | recipes 节 | `_lint_recipe_reviewers`：闭集先验→配置查询→每活跃 R 实例集合相等；零 reviewer 豁免（618–649） | 三档/错配/多实例/豁免/优先级/闭集扩张拒绝全覆盖（1452–1583） | **一致** |
| 23 | **A134 无 checker** | §9/§11：无 checker 合法 plan 过 lint/status | A134 归 RLT_05 | — | lint/status 不要求 checker 行 | `test_plan_without_checker_passes_lint_and_status_without_a_dangling_agent` 三例（2232–2281） | **一致** |
| 24 | **公共 CLI 闭集** | §3.1：add/status/lint；A99「不新增公共子命令」 | 三命令 | — | argparse 恰三个 subparser，各含 `--config-dir`；`status` 有 `--json`；`lint` 无 `--json`（其合同 A80→RLT_10，见 §6 表 563 行） | `test_help_lists_exactly_the_three_frozen_subcommands`+`test_each_subcommand_help_exposes_config_dir` | **一致** |
| 25 | **§10.3 样张** | §10.1+§10.2 fixture→§10.3 逐行 | A43 归 RLT_05 | — | `render_status_text` 逐行结构（1795–1831）；B2-F1/F2 登记摘录补齐 6 行+续写 3 行 | `test_design_10_3_text_snapshot_is_reproduced_line_by_line` 逐字节 `==` | **一致** |

**结论**：25 行全部一致，无漂移行。

## 2. A62/A73 分域核对

### A62（schema 冻结键集与规范化）

| 分域 | design §3.5/§11 | 实现 | 测试 | 判定 |
|---|---|---|---|---|
| 顶层键集 | 13 键逐字枚举（341–355, 1206） | `status_document` 恰 13 键 | `STATUS_TOP_LEVEL_KEYS` 精确等值 | 一致 |
| `plan` 嵌套 | {marker, cards, decision_mode}；decision_mode∈{auto,consult} | 1731–1735；parser 缺省 `auto`（446） | 三例（显式两值+省略默认） | 一致 |
| `stages[]`/`nodes[]`/`agents[]` 键集与排序 | 键集冻结；stages/nodes 按节点表序、agents 按 (node,首次 launch seq)（400） | 逐字段+排序实现（1519–1604） | 逐层精确键集+排序断言（1993–2027） | 一致 |
| `stages[].result` 五键 | {stage_id,outcome,note,amend,nodes}；非 null 时恒五键 | `_result_document`（1704–1714） | 有/无 amend 两例精确断言 | 一致 |
| 顶层 `last_stage_result` 三键 | {stage_id,outcome,note}（345） | `_last_result_document`（1717–1725），与阶段层分函数 | `STATUS_LAST_RESULT_KEYS` 精确断言 | 一致 |
| 空值/类型 | 逐列空值表；`suggested_action` 空值为 `none` 非 null；`errors` 字符串列表 | 逐列对应 | 类型断言含 `idle_seconds` 非 bool（2018–2019） | 一致 |
| 规范化边界 | `superseded_ignored` 计数结构属 A62，差分等价归 A73（396） | 计数=节点表+agent 表 superseded 行合计（1615–1618） | 计数断言落在 A62 域，等价断言落在 A73 域，互不越界 | 一致 |

### A73（superseded 投影语义）

| 分域 | design | 实现 | 测试 | 判定 |
|---|---|---|---|---|
| 不产生状态 | §3.5（394）：superseded 行不出现在 stages/nodes/agents | `active_nodes` 过滤贯穿 `derive_status`/`_stage_instances`/`_node_agents`/`_active_node` | 投影不含 `W0`/`builder-old` 断言（2156–2157） | 一致 |
| 不进三列表 | 同上；§11 A73 行（1157） | 同上 | 同上 | 一致 |
| 差分等价 | 唯一允许差异 `superseded_ignored` | 派生只读活跃集 | 双 paired fixture：0→1、0→2 两例整文档相等（769–799, 2116–2157） | 一致 |
| lint 域分工 | A128 归 RLT_03；A73 独占 status 差分 | lint 侧 superseded 过滤独立于 status 侧 | `test_status_and_lint_match_...` 同时覆盖 lint 与 status 两侧（769–799） | 一致 |
| 历史缺陷 | — | 旧 fixture 曾掩盖 close/depends_on 差异（B2-F8），已对齐为「仅差一行」 | 修正后断言更强（先核对计数再比其余字段） | 一致（已闭合） |

## 3. 工件间矛盾清单（progress/findings/review/reviews 互核）

| # | 矛盾/滞后 | 涉及工件 | 事实 | 级别 | 关联 finding |
|---|---|---|---|---|---|
| C1 | 代码轮 1 结果未回台账 | `review.md`（10 行）+ `progress.md`（止于 E-088） vs `reviews/heavy-code-r1-devin.md` | 台账仍记「dispatched 2026-09-12 / 产出待回填」，无 review-result E 行；审件已存在且结论 `DONE APPROVE open=6` | P3（滞后，非 verdict 冲突） | F-HCN-01 |
| C2 | 25 行机器证表全 `not-run` 未回填 | `review.md`（27–51） vs `reviews/*` | 表头明示「预填靶子，不代表已执行」「由实际执行者回填」；四批小审与代码轮 1 均以独立审件产出结论，未回填此表。不构成事实矛盾（有免责声明），但单读 review.md 会得到「25 条均未执行」的失真印象 | P3 | F-HCN-01 |
| C3 | findings.md 缺 Batch 4 fresh 小审登记节 | `findings.md`（202–211 止于 B4-F4） vs `reviews/batch4-review-opus.md`/`review.md`（60 行） | B1–B3 各有「fresh 小审」节登记 P 级项；B4 的 F-B4-R01..R06 只存在于审件与 review.md 批行（「open=6…转 heavy」），findings.md 未按惯例开节。数据未丢失，格式惯例断档 | P3 | F-HCN-02 |
| C4 | `lint --json` 缺阶段性交付注记 | design §3.1（186）/§3.5（404） vs DevPlan §6（563） | 签名块与输出描述给出 `lint --json` 终态，但 A80→RLT_10；对比 watch（§3.6 行 433「第 5 批」、行 179）与 A129（行 424/431/516/604/1159 注记）均有显式阶段注记，`lint --json` 无注记。owner 表本身无歧义，不构成合同冲突 | P3（文档注记不对称） | F-HCN-03 |
| C5 | 「决策类事件」枚举 5 枚 vs `DECISION_EVENTS` 4 枚 | design §3.4（264）/§11 A97·A114 行（1224/1226） vs `relay_log.py:59` | 设计把 `cancelled` 列入决策类事件（记在链属主 coder 名下）；实现 `DECISION_EVENTS` 不含 `cancelled`，其归属靠 `_validate_strategist_conclusion`+状态机处理。挂载位置已由 B4-F3 登记、F-B4-R04 裁决接受窄读法（链止于 resume/cancelled）；但枚举差未单独登记，helper 名下 `cancelled`（中链）仍走普通终态语义 | P3（命名域差，窄读法已裁） | F-HCN-04 |
| C6 | §11 A99 证法文字与已执行证法不一致 | design §11 A99 行（1215：「`git diff` 对 `relay_log.py` 为空」） vs task_plan Batch 4（139 行：双运行 sha256）/E-081/B4 小审/heavy-code-r1 | 整卡为未提交 WIP，字面证法不可达；task_plan 已冻结替代证法并被三方复算同 hash `90707b7e…`；F-B4-R05 已裁决「追认+建议 A 侧改 §11 文字」。**design 文本至今未改**，是跨工件文字漂移的残存一半 | P3（design 文字待修，证法等效已裁） | 结转 F-B4-R05 |
| C7 | stage 级事件 `--node` 不核实例节点集且静默 | design §3.4 vs `relay_log.py:1069–1133, 1313–1325` | E-062 P3 注记→B3R1-F1「未动」→F-HR1-02 实证「既被接受又无报警」。三处登记链完整一致，残差仍在 | P3（已登记残差） | 结转 F-HR1-02 |
| C8 | `SUGGESTED_ACTIONS` 死常量 | `relay_log.py:66` vs `test_relay_log.py:1866` | F-HR1-01 已登记；本审复核：实现侧常量仍无引用（测试侧同名集合独立存在），取值与 §3.5 五枚举逐字一致——无语义漂移，仅死代码 | P3 | 结转 F-HR1-01 |
| C9 | failed 窗口内崩溃恢复拉计入重拉数 | design §3.5（347）/§7.3 vs `relay_log.py:1513–1517` | B3 rework R1 已登记为账本不可分残差；实现如实计数。三处口径一致（设计未承诺区分起因） | P3（已登记残差，不计入 open） | — |

**历史结论互核（无冲突）**：四份批审 verdict（B1/B2 approved-after-rework-r1、B3 R1 CHANGES_REQUIRED→定向复审 APPROVE、B4 APPROVE open=6）与 `review.md` 批行、`progress.md` E-070/E-071/E-086/E-087、`findings.md` 各节一一对应；`findings.md` 中每条 resolved 引用 E-ID（E-017/E-020～E-023、E-042～E-048、E-063～E-071）均存在于 `progress.md` 台账；`heavy-code-r1-devin.md` 的 25/25 覆盖表与本审逐条复核一致。**未发现 verdict 级矛盾**。

## 4. 本审新增 findings（F-HCN-*）

| ID | 级别 | 位置 | 事实 | 期望处置 |
|---|---|---|---|---|
| F-HCN-01 | P3 | `review.md` 10/27–51 行、`progress.md` E-台账尾部 | 代码轮 1 已有正式产出（APPROVE open=6），但路径行仍「dispatched/待回填」、无对应 review-result E 行，且 25 行机器证表保持全 `not-run` 预填。台账滞后于已存在工件 | 主控回填 review.md 路径行与 E-台账（E-089 review-result），并按既有分工决定是否回填 25 行表（或以「以独立审件为准」注记一次性关闭预填表） |
| F-HCN-02 | P3 | `findings.md` 尾部 | 缺「Batch 4 fresh 小审」登记节；F-B4-R01..R06 仅见 `reviews/batch4-review-opus.md`、`review.md` 批行与 `heavy-code-r1-devin.md` §4 | 主控按 B1–B3 惯例补开 B4 小审节，或明文登记「B4 open 项直转 heavy 复核裁决、不再重复登记」 |
| F-HCN-03 | P3 | design §3.1 行 186、§3.5 行 404 | `lint --json` 终态签名/输出无阶段性注记；其合同 A80 归 RLT_10（DevPlan §6）。对比 watch/A129 均有显式注记，单读 §3.1 可能误读为本卡范围 | 建议 design 在 §3.1 签名块或 §3.5 `lint` 段补一行阶段性注记（A80/RLT_10 承接）；非阻断 |
| F-HCN-04 | P3 | design §3.4 行 264/§11 行 1224/1226 vs `relay_log.py:59` | 「决策类事件」枚举含 `cancelled`（5 枚）而 `DECISION_EVENTS` 为 4 枚；`cancelled` 不经 `_validate_decision_ownership` 的属主校验，helper 名下中链 `cancelled` 按普通终态处理。窄读法（链内决策事件记 coder）已由 F-B4-R04 裁决接受，但枚举差本身未登记 | 登记即闭合：或主控确认「`cancelled` 在归属校验域外、仅入状态机+strategist 闸」为正式读法，或 design 把「决策类事件」措辞收窄为四枚 |

## 5. 结转 open 项（保留原 ID，本审核认仍未闭合）

| 原 ID | 级别 | 状态 | 与本审关系 |
|---|---|---|---|
| F-B4-R01 | P2 | open（heavy 裁决 ESCALATE） | `loss_stop`/`plan_x_rounds` 无产品侧消费出口；跨卡第二真值风险，出口归属待主控/用户裁决。非本卡违约 |
| F-B4-R03 | P3 | open | `attempt_max` 无 add 硬闸、与 X 侧 A97 不对称；产品裁决事项 |
| F-B4-R05 | P3 | open | 即 §3 C6 的 design 文字侧：§11 A99 证法文字待改为 hash 口径 |
| F-B4-R06 | P3 | open | `XRound` 不承载「coder 修+reviewer 再审」；RLT_07 交接点名事项 |
| F-HR1-01 | P3 | open | 死常量 `SUGGESTED_ACTIONS`（本审复核仍存在，无引用、值与合同一致） |
| F-HR1-02 | P3 | open | stage 级事件 `--node` 归属残差（本审复核仍静默接受） |

另有已登记残差一条（failed 窗口内崩溃恢复拉计入 `monitor_relaunch_count`，B3R1 复审登记为账本不可分），口径三处一致、不计入 open。

## 6. NOT_RUN（如实标注）

| 事项 | 状态 | 说明 |
|---|---|---|
| 全量/focused unittest 本审重跑 | NOT_RUN | 一致性复核为静态跨工件比对；108 绿证据引用 E-079/E-085、`batch4-review-opus.md`、`heavy-code-r1-devin.md`，非本审所跑 |
| 本审自建 CLI/库探针 | NOT_RUN | 未执行；动态结论均以「静态对读 + 引用既有审件实测」给出 |
| review.md 两条有效 mutation | NOT_RUN | 属代码轮 2 靶子，非本路径 |
| E-076 实现前红、E-075 rebase | NOT_RUN | 历史动作不可复现；沿用 B4 小审 M1–M4 变异替代与 heavy-code-r1 核对结论 |
| B1/B2 批审 reviewer 动态项 | 前证受限 | 原环境 `bwrap RTM_NEWADDR` 为 NOT_RUN，已由主控源 worktree 复跑补齐（E-026/E-047 等）；本审静态核对结论文本一致 |

## 7. Verdict

`APPROVE`。五方闭集 25 行逐项一致、A62/A73 分域无漂移、无 verdict 级工件矛盾。open=10：本审新增 4 条 P3（台账滞后×2、design 注记×1、枚举域差×1）+ 结转 6 条（P2×1：止损出口归属；P3×5：attempt 硬上限裁决、A99 证法文字、RLT_07 交接、死常量、stage 事件归属残差）。全部为非代码返工事项，建议主控汇总：F-HCN-01/02 回填即可闭合；F-HCN-03/04 与 F-B4-R05 归 design 文字侧修订；F-B4-R01/R03 待用户/主控裁决；F-B4-R06/F-HR1-01/02 转交接或后续卡。

DONE APPROVE open=10
