<!-- dh:v1 -->
# B1 checker — RLT_22（fresh 小审 · checker 角色）

## 结论

PASS

- P1：0
- P2：1
- 范围：仅审 B1 的未提交 working tree 改动（`git diff --stat`：`tools/relay-light/relay_log.py` +66/−3、`tools/relay-light/test_relay_log.py` +204、`docs/modules/relay-light/workspace/RLT_22/progress.md` +5），即 A150 lint 四态扩集、`_require_trigger` 分流占位、A145 送审写入合同及其测试与证据；**未审** B2（A144/A146）与 B3（A147/A148/A149），不替代 normal Recipe 三路复核，不构成验收/verify 裁决。

## P1（阻断）

无

## P2（质量）

### P2-1 — A150 验证列要求的「§3.5 映射表两行存在」断言，在 B1 与 task_plan 全部三批均未排期

design/01 §11 `HC-RL-A150` 的「怎么验」列末句要求：「另断言 §3.5 的 lint 规则映射表中 `on:review_ready:` 的两行（分别咬 A35 与 A71）存在」。核实：`test_relay_log.py` 全文件没有对 design/01 的只读内容断言（`test_relay_log.py:4150` 的 `DESIGN` 常量属 A122 合成仓 fixture，与此无关）；`task_plan.md` 批次步骤 1.1/2.x/3.x 也均未排期该断言。事实层面两行当前确实存在（`docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md:434-435`，逐字含 `on:review-ready:` 拼写变体与 R 形态归 A71），无行为风险——属 oracle 覆盖缺口，不是实现缺陷。

可执行整改（二择一，不需阻断 B2）：①在 `RelayPlanLintTests` 补一条只读 tripwire 用例，以仓根相对路径读 design/01 并断言该两行原文存在；②由编排裁决豁免该断言（以本 check 的逐字核对代替），并在 `findings.md` 记一笔豁免依据。

## 已核通过项

1. **改动面：pass**。`git status --short`：M 仅 `progress.md` / `relay_log.py` / `test_relay_log.py`，全部落在允许路径闭集（`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`docs/modules/relay-light/workspace/RLT_22/**`）内；untracked 仅 `tools/relay-light/__pycache__/`（测试副产物，E-005 已按 RLT_10 F-002 挂账、不入库）。`git diff --check` exit 0 无输出。`skill/**` 本批零改动（A149 属 B3，未提前动）；`findings.md` / `lesson_candidates.md` 未动（允许但未用，不越界）。
2. **A150 lint 四态：pass**。四态正例齐于一夹具（空 trigger=builder / `on:blocked`=decider / `on:done:coder`=scribe / `on:review_ready:builder`=plan-reviewer，`test_relay_log.py:697-707`）；反例四条：`on:review_ready:nobody`→A35（:709-717）、拼写变体 `on:review-ready:`→A35（:718-727）、跨节点引用→A71（:728-737）、R 形态（requirement 在 R1、coder 在 C1）→A71（:738-747）。实现 `relay_log.py:607-628` 与 §3.5 映射两行（design/01:434-435）一致：前缀不命中或名字段空→A35 invalid trigger（:617）；目标不在任意节点表→A35 unknown trigger agent（:620）；不在本节点→A71（:622-626）。**`on:done:` 原报错文案逐字保留**：HEAD 版 `f"line {agent.line}: on:done must reference the same node"`，现版经 `prefix[:-1]`（prefix=`"on:done:"` → `"on:done"`）对 `on:done:` 前缀输出逐字同串（`relay_log.py:624` vs `git show HEAD:tools/relay-light/relay_log.py` 第 610 行）。
3. **`_require_trigger` 分流：pass**。`on:review_ready:` 分支在 `relay_log.py:1684-1688`，位于 `target = spec.trigger.removeprefix("on:done:")`（:1689）之前，识别前缀后直接 return（B1 占位，注释明示 A144 由 B2 承接）；其后 `on:done:` 分支（:1689-1692，`_latest_by_name` + A70 报错）一行未动（diff 中该函数仅新增 5 行、无删改行）。
4. **A145 写入合同：pass**。
   - 闸只在 note 含 token 时生效：`_validate_review_ready_signal`（`relay_log.py:1715-1750`）首步 `if not tokens: return`（:1727）——普通 checkpoint 零影响。这正是施工第 1 版犯过的错：progress B1 行如实登记全量曾 3 失败，`/tmp/rlt22-b1-full.log` 复核确认 `test_agent_launch_requires_node_start_and_terminal_agents_are_sealed` 与 `test_a102_checkpoint_round_trips_do_not_burn_attempts` 均因 `must carry exactly one ready_for_review= token, got 0` 被误伤；修复后两用例保持原样且绿，回归网真实起了作用。
   - 计数在原始 note 串上做：:1726 对 `note.split()` 直接过滤 `ready_for_review=` 前缀，≥2 → A145（:1727-1731），防 `_note_tokens`（:2480-2487，**零改动**，首个同名 key 胜出）静默丢失。
   - 四拒绝路径各有着落且报 `HC-RL-A145`：≥2 token（:1728）/目标不在本节点表（`judge is None`，:1734-1738）/目标 role 不在闭集 `JUDGE_ROLES`（:1739-1743）/写入者是判定角色（:1744-1749）；`test_a145_ready_signal_write_contract`（`test_relay_log.py:3621-3676`）逐条覆盖，另加空 token（`ready_for_review=`）反例。
   - `add` 层未设轮次上限：实现无任何计数封顶；`test_a145_no_round_cap_and_attempt_never_moves`（:3678-3700）连发 3 条（>`rework_max_rounds`=2）全被接受，并断言 `agent_launch` 仅一条、lost 后重拉才升 attempt（A102 / findings F-006 要求的显式正例；F-006 指针真实，`findings.md:17`）。
   - 三个新 token 不误入 A69：`DECISION_HELPER_NAMES` / `_decision_helper`（:1695-1700）/ `_validate_decision_helper`（:1703-1712）零改动，只匹配 `decider=` / `strategist=`；`ready_for_review=` / `reviewed=` / `ready_seq=` 不会命中。`test_a145_ready_token_is_not_a_decision_helper`（:3702-3713）钉住 escalate 双 token 并存仍被接受；checkpoint 带 `decider=` 的正例（:3646-3652）同时证明 A69 不扫 checkpoint（`_active_decision_owners` 只读 `escalate` 行）。
5. **硬约束：pass**。未新增账本字段（diff 无任何 dataclass/字段变更）；19 词事件白名单（`relay_log.py:30-57`）不在 diff；`_validate_agent_transition`（:1962）迁移表零改动；`Status`（:2460）/ `status_document`（:2949）/ `_validate_node_close`（:2037）零改动；新校验**未用** `_latest_by_name` / `_latest_for_instance`（`_validate_review_ready_signal` 不做任何账本回看——B1 无实例级校验，无越批）；既有 `on:done:` 分支对 `_latest_by_name` 的使用保持原样、未顺手统一。挂点在 `_validate_event_semantics` 的 checkpoint 分支、位于 `_validate_agent_transition` 之后（:2108-2110），与施工自报一致。
6. **测试质量：pass**。`assert_rejected`（`test_relay_log.py:3611-3619`）三重钉住 oracle：exit 2 + `^error: HC-RL-A145 ` + **账本字节不变**（add 拒绝位即证「不落账」）；lint 侧 `assert_rule` 断言精确报错码。无只正向空洞：A145 类 5 个拒绝断言 + 3 个正例 + 1 个无上限/attempt 正例；A150 四正例四反例。`test_review_ready_trigger_does_not_leak_into_done_branch`（:3715-3736）对 B2 仍有效：该 fixture（信号是 builder#1 当前实例最新事件、值恰等于 plan-reviewer、builder#1 未终态）在 A144 实现后本就满足前置，launch 被接受、stderr 无 A70，断言仍绿；且它只断言 NotRegex A70，A144 拒绝路径由 B2 新用例承接，互不冲突。
7. **证据真实性：pass**。E-002/E-003/E-004 三份日志均在 /tmp 且与 progress 记载一致：`rlt22-b1-full2.log` = `Ran 186 tests ... OK`；`rlt22-b1-full.log` = `FAILED (failures=3)`，三处失败恰为登记的两次返工（A145 首版误伤两用例 + lint 夹具 `'HC-RL-A35' != 'HC-RL-A75'` 顺序错）；`rlt22-b1-relaytests.log` = `RELAY ALL PASS (SKIPPED: 1)`。E-005 经本 checker 独立复核：`git diff --check` exit 0、改动集恰三点、untracked 仅 `__pycache__`。本 checker 抽查复跑 `PYTHONDONTWRITEBYTECODE=1 python -m unittest tools.relay-light.test_relay_log.RelayReviewReadyTests tools.relay-light.test_relay_log.RelayPlanLintTests.test_a150_review_ready_trigger_four_states -v` → `Ran 5 tests in 8.193s, OK`（与 E-003 目标用例集一致；按派单口径未重跑 8 分钟全量，E-003/E-004 日志已核）。
8. **进度侧偏离登记：pass**。progress.md B1 行（2026-09-19）明确登记「施工由主会话直做而非逐批派 headless worker（用户手动派单语境），fresh 小审仍逐批另派（check.B1.md），已按『跑偏只记 progress』登记」；两次返工同Row如实记录，无美化。

**边界声明**：本 checker 只读代码与证据，仅写本 `check.B1.md` 与 `done.checker.B1.md` 两文件；未改任何程序/测试/工件，未 commit，未跑 install_skill，未做验收裁决。P2-1 不阻断 B2 开工与否由编排裁决。
