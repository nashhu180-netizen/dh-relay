<!-- dh:v1 -->
# review.requirement — RLT_22 独立复核记录（需求方向）

> 复核者：Devin SWE-2 Max（`rlt22-review2`），fresh 实例，未参与 RLT_22 施工、批次小审、编排与 code-round1 复核。
> 现场：`/home/nash/work/dh-relay/.dh-worktrees/RLT_22`，分支 `wt/RLT_22`，HEAD `fc0d05f`，基线 master `72c6c4d`（生产/测试代码自 `776b020` 起未变，其后均为 docs 提交）。
> 复核对象：design/01 §11 `HC-RL-A144`~`A150` 七条 oracle「怎么验」逐条对齐（命中/部分/未命中）；A35/A65/A71/A107 四条修订承接证据；卡「非目标」六条 + A2/A49/A60/A62/A69/A70/A95/A102 零改动（diff 证）；F-006 要求的 A102 显式正例；允许路径闭集；R 模板三行逐字。
> 时间：2026-09-16。

## 结论

**APPROVE_WITH_NITS　·　P0 = 0　·　P1 = 0　·　P2 = 1　·　P3 = 3**

七条 HC 的 oracle 枚举正反例全部命中且为真断言（退出码 + 规则编号 + 账本不落行/逐字节断言）；四条修订承接证据到位；「不改」清单逐项由 `git diff` 证零改动；A102 有显式正例（F-006 闭合）；允许路径闭集成立；R 模板三行逐字未变。唯一实质项 P2-1 与 code-round1 的 P2-1 同源：`ready_seq` 畸形 Unicode 数字走未捕获 `ValueError` 退 1 + traceback，破 `add` 的退出码合同——闸门仍 fail-closed（不落账），不削弱 oracle 任一枚举反例；评审时点该修复已在工作区在飞（未提交），不阻塞本路结论。本路只登记事实与级别，不做验收裁决。

## 输入清单

`dispatch/README.md`、`dispatch/review.md`、`brief.md`、`task_plan.md`、`progress.md`（E-001~E-021 与信号段）、`findings.md`（F-001~F-009）、`check.B1.md`/`check.B2.md`/`check.B3.md`、`review.code-round1.md`、`lesson_candidates.md`、`git diff master...HEAD`（26 文件）、`git show master:`/`HEAD:` 逐段比对、design/01 §11 `HC-RL-A144`~`A150` 与 A35/A65/A71/A107 原文、「不改」清单、DevPlan §RLT_22 卡正文（`P1-RelayLight-开发方案.md:409`-`:429`）、本机复跑两轮。

## 七条 HC 逐条对齐

| oracle | 结论 | 实现落点（committed `fc0d05f`） | 「怎么验」证据（committed `test_relay_log.py`） |
|---|---|---|---|
| **A144** `on:review_ready:<S>` 拉起前置 | **命中** | `_require_trigger` `relay_log.py:1685`-`:1713`：`sender` 取 trigger 后缀，attempts 取该 sender 在本节点 `agent_launch` 最大号，`_latest_for_instance` 取**当前实例**最新 agent 事件，须为 `checkpoint` 且 `ready_for_review=` 恰等于被拉起 agent 名；否则退 2 报 A144 | `test_a144_launch_gate_replaces_b1_placeholder`（`:1725`，正例 + 重复 `agent_launch` 仍报 A58/A49 且 `assertNotIn A144`）；`test_a144_rejects_without_a_current_instance_signal`（`:1761`，九拒绝例各退 2 报 A144、`assertNotIn A70`、被拒后账本逐字节不变——覆盖 oracle 枚举的无信号/指向另一判定方/旧 attempt 信号/被普通 `checkpoint` 覆盖/`blocked` 之后/`<S>` 已终态并加 `agent_lost`/`cancelled`） |
| **A145** 送审信号写入合同 | **命中** | `_validate_ready_signal` `relay_log.py:1949`-`:1984`：对**原始 note** 计 `ready_for_review=` 前缀 token，恰一否则退 2（绕开 `_note_tokens` 首键胜出）；目标须在本节点 agent 表且 `role ∈ REVIEW_ROLES`（`:67` `{plan-reviewer, checker, reviewer}`）；写入者自身属判定角色即退 2 | `test_a145_ready_signal_write_contract`（`:1847`）：合法例接受；双 token / 目标不在节点表 / 目标非判定角色 / 判定角色自写各退 2 报 A145。`test_a145_signals_burn_no_attempt_and_have_no_add_cap`（`:1878`）：3 条连续信号（>`rework_max_rounds=2`）全被接受（无 `add` 硬上限）、`agent_launch` 仅 `builder#1` 一条 attempt 不变、lost 后重拉恰为 `#2`——即 oracle「不伴随 `agent_launch`、attempt 不变、add 层不设轮次硬上限」。`test_a145_helper_scan_sees_decider_only`（`:2158`）：B1 整改后直钉 `_decision_helper`/`_validate_decision_helper` 返回值 + 负断言，B1 变异证据 E-007 证非空转 |
| **A146** 判定方封口配对闸 | **命中**（附 P2-1） | `_validate_review_pairing` `relay_log.py:1987`-`:2057`，经 `_validate_event_semantics` `:2208` 在 `AGENT_EVENTS` 分支调用——执行位点是 `done` 写入语义校验，不落 `_validate_node_close`；`_validate_agent_transition`（`:2207`）先于它，终态 agent 仍先撞 A60。闸仅在节点存在指向本 agent 的 ready 信号时生效（`:2007`-`:2013`），生效时须 `reviewed=<S>#<a>` 实例形 + `ready_seq=<n>` 指向该组合下**最新** ready 信号且 `<S>#<a>` 已 `done` 且 seq 更早；被拒 `done` 无落账路径 | `test_a146_pairing_done_accepted_in_order`（`:1949`，送审方先封、判定方后封正序）；`test_a146_pairing_gate_rejections`（`:1972`，缺 `reviewed=`/缺 `ready_seq=`/非实例形/裸 note/旧轮次 seq/他人信号 seq/非 checkpoint seq/跨实例拼接/送审方未终态/送审方 lost 各退 2 报 A146——oracle 枚举全覆盖且超集）；`test_a146_rejects_at_done_write_time`（`:2134`，被拒时账本**逐字节**不变、改正后可写）；`test_a146_gate_is_inert_without_a_signal_for_this_agent`（`:2079`，R 形态/无信号不误闸）；`test_a146_two_lanes_bind_their_own_ready_seq`（`:2092`，X 双判定方各绑各 `ready_seq`） |
| **A147** 第三套止损计数只投影 | **命中** | `LossStop.review_rounds`/`review_exhausted`/`triggered`（`relay_log.py:2965`-`:2973`）；`loss_stop()` `:3027`-`:3053` 按 `(node, reviewer)` 计 ready 信号条数（首轮计入），耗尽条件 = 条数 ≥ `limits.rework_max_rounds` 且该判定方在本节点仍无 `done`；`add` 路径不读 `loss_stop`——只投影不拒写 | `test_a147_review_rounds_is_a_projection_never_a_write_gate`（`:4504`）：`rework_max_rounds` 取 2 与 3 由**同一实现**得出各自耗尽点；超限后第 N+1 条 ready 仍被 `add` 接受且账本 +1 行；耗尽后 `escalate` 起头的 strategist 链（`decision`/`done`/`user_decision`/`resume`）完整跑通——A97/A114 出口不变；PASS 后 `review_exhausted` 清空而 `review_rounds` 计数保留。`test_attempt_and_x_loss_stops_trigger_independently`（`:4410`）三处补 `review_rounds == {}`/`review_exhausted == ()`，既有 attempt/X 断言未删——三套互不叠加、互不重置 |
| **A148** 向后兼容与同节点混用 | **命中** | `on:done:` 分支 `relay_log.py:1714`-`:1717` 与 master 逐字一致（diff 仅在前面插入 `on:review_ready:` 分流）；lint 的 A71 文案经 `prefix[:-1]` 对 `on:done:` 仍产出原文；无迁移警告、无强制迁移路径 | `test_a148_rlt12_win_01_plan_lints_clean`（`:2203`，RLT_12 冻结计划原样过 lint 退 0）；`test_a148_rlt12_win_01_ledger_replays_verbatim`（`:2211`，71 行账本逐条 `add` 全接受、重放后行数与 node/event/agent/note 逐字一致）；`test_a148_mixed_trigger_lanes_judge_independently`（`:2271`，同节点 `on:done:` 与 `on:review_ready:` 混用各按各闸，编号互不串）。fixture 已复制进 `workspace/RLT_22/fixtures/rlt12-win-01/`（plan + 71 行 ledger 两件），测试经 `Path(__file__).parents[2]` 仓内相对路径读取、无跨树绝对路径——闭合 F-001 的取证边界；code-round1 以 `git show master:` 逐字节比对一致（review.code-round1.md §A148） |
| **A149** 模板与 adapter 同步 | **命中** | `SKILL.md`：W 模板 `plan-reviewer` trigger → `on:review_ready:builder`；X 模板被打回路 trigger → `on:review_ready:coder`；C 模板 trigger 列不动、补纪律原文；**R 模板区在 diff 中无任何 hunk（三行逐字未变）**。`SKILL.md` 硬规则段与 `references/adapter-claude-code.md`、`adapter-codex.md` 三处含同段 oracle 原文「判定方判定 PASS 前，送审方与判定方均不记 `done`；FAIL 走 live 判定方的 `checkpoint` 路由回同一送审方；PASS 后按送审方→判定方顺序记终态」。`dh-mapping.toml` 仅 `[limits.on_exceed].note` 两行文本（「两套」→「三套」并点名三计数），键与取值零改动 | `test_a149_w_and_x_triggers_switch_r_template_verbatim`（`:5698`，W/X 换 trigger + R 三行逐字断言）；`test_a149_review_sealing_discipline_verbatim`（`:5727`，三处原文逐字）；`test_a149_dh_mapping_note_names_three_counters`（`:5744`）；W/C/X 三条最小账本序列 `test_a149_w_minimal_ledger_relaunch_reconsumes_fresh_signal`（`:5919`，A49 合法重拉消费新信号）、`test_a149_c_minimal_ledger_fail_reviews_same_instance`（`:5972`，checker 同实例 FAIL→PASS 无第二条 `agent_launch`）、`test_a149_x_minimal_ledger_one_lane_fails_one_passes`（`:6029`，两路一 FAIL 一 PASS 互不干扰） |
| **A150** lint 四态 | **命中** | `relay_log.py:611` 一带 trigger 合法集扩为四态（空 / `on:blocked` / `on:done:<名字>` / `on:review_ready:<名字>`）；非法值与不存在 agent 名由 A35 承接，跨节点引用由 A71 承接 | `test_trigger_values_and_same_node_done_references_are_checked`（`:668`，四态正例 + `on:review_ready:nobody` / `on:review-ready:` / 空前缀报 A35 + 跨节点与 R 形态 `on:review_ready:` 报 A71——R 不适用本修订的机械证据）；`test_a150_lint_mapping_table_binds_review_ready_rows`（`:743`，§3.5 映射表两行结构断言） |

## 四条修订承接（owner 不变）

| 条目 | 承接证据 | 结论 |
|---|---|---|
| A35（非法 trigger / 不存在 agent 名） | A150 测试组中 `on:review_ready:nobody`、`on:review-ready:`、`on:review_ready:`（空前缀）各报 A35 | 到位 |
| A65（未触发不挡关） | 补例 `test_relay_log.py:1539`-`:1553`：`on:review_ready:` agent 信号从未来，节点照常 `node_close` | 到位 |
| A71（同节点约束，含 R 形态） | A150 测试组中跨节点引用与 R 形态节点写 `on:review_ready:coder` 各报 A71 | 到位 |
| A107（计数独立性） | `test_attempt_and_x_loss_stops_trigger_independently` 三场景均补第三套空断言；`test_a147` 证三套互不叠加 | 到位 |

## 「非目标」与不改清单（diff 证）

| 项 | 证据 | 结论 |
|---|---|---|
| A2（19 词事件白名单） | `git diff master...HEAD` 对 `EVENTS`/`CONTROL_EVENTS`/`AGENT_EVENTS`/`DECISION_EVENTS`（`relay_log.py:33`-`:63`）无 hunk；新信号复用 `checkpoint` + 类型化 token，未加事件 | 零改动 |
| A49（重拉规则） | `_validate_agent_transition` 迁移表（`relay_log.py:2060` 起）不在本卡 diff | 零改动 |
| A60（终态规则） | 同上；`_validate_review_pairing` 调用于 `:2208`，在 `_validate_agent_transition`（`:2207`）之后——终态 agent 的 `done` 先报 A60 不进 A146 | 零改动且语义不豁免 |
| A62（`status --json` schema） | `Status`（`relay_log.py:2558` 起）与 `status_document`（`:3081` 起）零 diff；第三套计数只进 `loss_stop()` 投影不进 status | 零改动 |
| A69（决策 helper 扫描） | `DECISION_EVENTS`、`_decision_helper`（`:1720`）、`_validate_decision_helper`（`:1728`）零 diff；`ready_for_review=`/`reviewed=`/`ready_seq=` 不在 helper 前缀集 | 零改动 |
| A70（`on:done:` 行为） | `relay_log.py:1714`-`:1717` 与 master 逐字一致；混用测试中 `on:done:` 路仍报 A70 不串 A144 | 逐字保留 |
| A95（C checker 空 trigger） | `SKILL.md` C 模板 diff 无 trigger 列改动（仅补纪律原文）；`test_a95_a133_c_template_shape` 随全量绿 | 零改动 |
| A102（往返不耗 attempt） | **显式正例存在**：`test_a145_signals_burn_no_attempt_and_have_no_add_cap`（`:1878`）+ `test_a102_checkpoint_round_trips_do_not_burn_attempts`（`:5760`，lost 后重拉恰为 `#2`）——F-006 闭合 | 已显式证明 |
| R 模板三行 | `git diff` 对 `SKILL.md` R 模板区无 hunk；`test_a149_w_and_x_triggers_switch_r_template_verbatim` 逐字断言三行 | 逐字未变 |
| 不强制迁移 | 旧计划原样过 lint 退 0 且无警告（`test_a148_rlt12_win_01_plan_lints_clean`）；lint 对 `on:done:` 不报迁移建议 | 无迁移路径 |
| `roles.toml` | 不在 diff 名单内（零触碰） | 零改动 |
| `dh-mapping.toml` 键值 | 仅 `[limits.on_exceed].note` 文本两行；`rework_max_rounds=2`/`attempt_max=3`/`action` 未动且被 `:5744` 机器断言 | 键值零改动 |

## 允许路径闭集

`git diff --name-only master...HEAD` 共 26 文件，全部落在 `dh:allowed-paths:v1` 闭集：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/**`（SKILL.md、dh-mapping.toml、两份 adapter）、`docs/modules/relay-light/workspace/RLT_22/**`（含 fixtures 两件）。`tools/tests/**`、`install_skill.py`、design、DevPlan、AGENTS.md、其它卡工作区零触碰。`git diff --check` 干净。

## 独立复跑（本机 · `PYTHONDONTWRITEBYTECODE=1` · HEAD `fc0d05f`）

| 命令 | 结果 |
|---|---|
| `cd tools/relay-light && python3 -m unittest test_relay_log.RelayReviewReadySignalTests -v` | exit 0；`Ran 10 tests in 48.655s`，`OK` |
| `python3 -m unittest test_relay_log.RelayReviewReadySignalTests test_relay_log.RelayBackwardCompatTests test_relay_log.RelayPlanLintTests test_relay_log.SkillTemplateTests test_relay_log.RelayLimitsTests -v` | exit 0；`Ran 100 tests in 239.611s`，`OK`（五个类全量，覆盖本卡全部新增/扩写用例） |

复跑后 `git status` 除他人未提交整改外无新增变更，无 `__pycache__` 落入仓内。

## 逐条明细

### P0

无。

### P1

无。

### P2-1　`ready_seq` 畸形 Unicode 数字以未捕获异常崩溃（与 code-round1 P2-1 同源）

**事实**（committed `fc0d05f`）：`relay_log.py:2022` 以 `ready_seq.isdigit()` 作守卫，`:2028` 紧接 `int(ready_seq)`。`str.isdigit()` 对 `²`/`四`/`½`/`①` 等非 ASCII 数字返回 `True`，而 `int()` 只接受十进制 → `ValueError` 穿透（`_fail` 只接 `RelayError`）直出 traceback，exit 1 而非合同要求的 exit 2 + `HC-RL-A146`。闸门仍 fail-closed（异常先于 append，`done` 不落账），oracle 枚举反例无一被削弱；破的是 `add` 的退出码合同（0/2/3/4）——下游按「非预期崩溃」而非「合同拒绝」分流。

**在飞状态**：评审时点工作区已有**未提交**整改：`relay_log.py:2022` 改 `ready_seq.isascii() and ready_seq.isdigit()`，并新增 `test_a146_malformed_ready_seq_exits_two_not_crash`（六个畸形输入各断言退 2 + A146 + 账本逐字节不变）。该整改不属本复核 commit 范围；本路以 committed 态登记发现，建议整改落账并复跑后由编排闭合。

### P3-1　DevPlan/task_plan 引述的纪律句与 oracle 原文存在措辞差（实现按 oracle 落地，信息项）

DevPlan 卡正文（`P1-RelayLight-开发方案.md:419`）与 `task_plan.md` 3.4 引述为「PASS 前双方均不记 `done`…」，oracle（design/01 §11 A149）原文为「判定方判定 PASS 前，送审方与判定方均不记 `done`…」。实现与 `test_a149_review_sealing_discipline_verbatim` 均按 oracle 逐字落地——实现无缺陷，仅上游转述与 oracle 原文不逐字。登记以备后续文档对齐参考。

### P3-2　复核期间一次后台复跑与 code-round1 变异实验并发产生假红（环境项，非代码缺陷）

本复核早先一次后台定向复跑（21 例新增用例）出现 6 个 FAIL，全部落在「信号后 `agent_launch` 报 A144」与「合法配对 `done` 报 A146 须指向最新」两种形态。经对 `review.code-round1.md` 变异登记表与 `review.md`「有效单测·变异点登记」核对：code-round1 复核在**共享工作树**上对 `relay_log.py:1706`（`checkpoint`→`done`）与 `:2043`（`!=`→`==`）施加的瞬时变异，其效应与本批 FAIL 签名逐一吻合（前者使合法信号不再武装 launch → A144；后者使合法配对 `done` 误报「须指向最新」）。变异已按登记还原；本复核两次复跑（10 + 100 例）与 B1/B2/B3 三批小审、code-round1 全量复跑（202 例）在相同已提交代码上全绿。结论：该次 FAIL 为并发变异窗口下的证据污染，不构成代码缺陷。流程提示：共享工作树上的活体变异实验会使并发测试证据失效——后续复核宜错峰或在独立 clone 做变异。

### P3-3　`test_relay_log.py` 注释残留「B1 placeholder」措辞（code-round1 P3-1 同源）

committed 态 `test_relay_log.py:1433` 注释仍写 "the B1 placeholder"——断言正确（exit 2 + A144），仅措辞陈旧。在飞整改已一并改写该注释（未提交）。

## 范围与边界

- 本路只读未改任何代码/测试/skill 文件；本复核新增文件仅 `review.requirement.md` 与 `review.md`、`progress.md` 的登记/信号行。
- 复核对象为 committed `fc0d05f`；工作区内的未提交整改（P2-1/P3-1 修复）仅作事实记录，未计入命中判定、未被我提交。
- 凭据红线：未向任何文件写入密钥/凭据；复跑与 diff 输出无凭据内容。
- F-003（A149 最小序列是否含 W 的口径差）与 F-005（normal Recipe 路数来源分歧）为卡内已登记的开放 findings，由编排/用户裁决，不在本路射程内；F-001/F-002/F-006 已由证据闭合。

## 裁决

**APPROVE_WITH_NITS**。七条 HC 全命中、四条修订承接到位、「不改」清单逐项零改动、A102 显式正例闭合 F-006、允许路径闭集成立、R 模板逐字未变。P2-1 为退出码合同边缘缺陷（fail-closed、已有在飞修复），P3 三项为信息级。本结论仅为需求方向一路的事实登记，不替编排做验收裁决。
