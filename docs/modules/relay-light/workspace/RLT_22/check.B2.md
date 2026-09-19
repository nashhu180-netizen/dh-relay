<!-- dh:v1 -->
# B2 checker — RLT_22（fresh 小审 · checker 角色）

## 结论

PASS

- P1：0
- P2：1
- 范围：仅审 B2 的未提交 working tree 改动中相对 check.B1.md 审过时点的增量——`_current_instance` / `_require_review_ready`（A144 拉起前置）、`_validate_review_done_pairing`（A146 封口配对闸）、`_validate_agent_transition` launch 分支检查顺序重构，及 `RelayReviewReadyTests` 三个新用例与 progress E-006~E-009；B1 部分（lint 四态、A145 写入合同）按 check.B1.md 已核结论承接，仅核对其零回归（行号平移 +43/+3 与 B2 插入量吻合，无回退）。**未审** B3（A147/A148/A149），不替代 normal Recipe 三路复核，不构成验收/verify 裁决。

## P1（阻断）

无

## P2（质量）

### P2-1 — E-006 结果栏的「B1 五用例保持绿」计数口径不实（B1 用例是四个，第五个绿的是 B2 用例）

`RelayReviewReadyTests` 共 7 个用例：B1 四个（`test_a145_ready_signal_write_contract` / `test_a145_no_round_cap_and_attempt_never_moves` / `test_a145_ready_token_is_not_a_decision_helper` / `test_review_ready_trigger_does_not_leak_into_done_branch`，`test_relay_log.py:3621/3678/3702/3715`）+ B2 三个（`:3745/3862/3939`）。E-006 记 `Ran 7 tests, FAILED (failures=2)`（`progress.md:63`），2 失败 = A144 拒绝例 + A146 配对闸拒绝例，则 5 绿 = **B1 四用例 + B2 的 `test_a146_gate_inactive_without_signals_and_multi_path`**（该用例断言的全是「被接受」，闸缺失时本就成立）。progress 写成「B1 五用例保持绿」把一个 B2 用例计进了 B1。硬事实（Ran 7、failures=2、两条 RED 原因）均准确，无结论性影响——属证据账本措辞精度问题。

可执行整改：把 `progress.md:63` 的「B1 五用例保持绿」改为「其余五用例（B1 四用例 + A146 不生效正例）保持绿」。

## 已核通过项

1. **A144 语义对照 oracle：pass**。九条拒绝例与 design/01 §11 `HC-RL-A144`（`design/01-RelayLight-产品设计与验收.md:1291`）「怎么验」列逐条对应，各断言退 2 报 `HC-RL-A144`：①只发普通 checkpoint（`test_relay_log.py:3762-3765`）②本节点无任何事件（:3766-3769）③已 done（:3770-3776）④agent_lost（:3777-3783）⑤cancelled（:3784-3790）⑥token 指向另一判定方——fixture 逐字用 oracle 的 `ready_for_review=requirement` 却拉 `lesson`（:3791-3804）⑦旧 attempt 重放（builder#1 信号→lost→#2 重拉 live 后旧信号拉不起判定方，:3805-3812；即 oracle 的 coder#1/#2 形状）⑧信号被普通 checkpoint 覆盖（:3813-3819）⑨信号后写 blocked（:3820-3826）；合法例 :3749-3755。实现按「当前实例 + 实例最新 agent 事件」判：`_require_review_ready`（`relay_log.py:1689-1710`）先 `_current_instance`（:1671-1686，按 (node, 名) 扫 agent 事件取最大 attempt）→ 再 `_latest_for_instance`（:1619-1625，`entry["agent"] == agent` 全串逐字比对，**不跨 attempt**）判最新事件是否为带 `ready_for_review=<判定方>` 的 checkpoint。**max-attempt 可靠性核实**：首拉必须 #1（:2042-2043）、重拉必须恰 +1（:2029-2030），非 launch 事件要求实例已 launch（A60 "has not launched"，:2050-2051）——attempt 因此处处 1..N 连续串行，最大 attempt 即当前实例；A60 迁移表（`checkpoint` 的合法前驱不含终态，`allowed` 字典）保证「最新事件是 checkpoint ⟺ 未终态」，oracle 第④项「由此必未终态」由结构保证。
2. **A58/A49 编号不串 + 重构等价性：pass**。重复 launch（同 attempt）报 A58（`test_relay_log.py:3827-3834`）、判定方 done 后重拉报 A49（:3835-3843），二者都不是 A144；后一例只有在 A58/A49 先于 `_require_trigger` 时才可能成立（旧顺序下 `_require_review_ready` 会因送审方 latest=done 抢报 A144），是重构必要性的直接回归证据。**等价性推演**：HEAD 顺序 = A78 → `_require_trigger` → A58(首拉)/A58(+1)/A49/budget（HEAD :1917-1946）；现顺序 = A78 → A58/A49 → `_require_trigger` → budget（:2016-2046）。被移动的每段检查代码逐字未改（A58 两条、A49 资格式含 A138 注释、budget 调用均在），两条路径（有/无 prior launch）执行的检查集合完全一致、接受当且仅当全部通过——**不存在由顺序改变导致的放行/误拒**，唯一可观测差异是「A58/A49 与 trigger 前置同时被违反」的复合违规角下报错码从 A70/A77 让位给 A58/A49；该让位正是 A144 oracle 明文要求（design/01:1291「由 A58/A49 拦下，编号不是 A144」），对 `on:done:`/`on:blocked` 的复合违规角无任何 oracle 行或既有用例钉住顺序，单违反场景报错码与 HEAD 一致，全量 189 绿 + pwsh 套件绿佐证无被钉行为破坏。`_require_trigger` 的 `on:done:` 分支（:1732-1735）与 `on:blocked` 分支（:1717-1725）在 diff 中均为上下文行（逐字未动）；迁移表 `allowed` 字典（:2060-2071）位于两 hunk 之间的未触碰区，一字未改。
3. **A146 语义对照 oracle：pass**。生效条件精确：`_validate_review_done_pairing`（`relay_log.py:2160-2222`）仅当本节点存在 `ready_for_review==<本判定方>` 的 checkpoint 时生效（:2174-2180），非判定角色/无信号节点直接 return；位点在 `_validate_event_semantics` 的 done 分支（:2156-2157），写 done 即验——`append_event` 先 `_validate_runtime_event` 后才打开账本追加（:2495-2518），被拒 done 结构上不可能落账。七条拒绝例全报 A146（`test_relay_log.py:3862-3937`）：缺 `reviewed=`（:3866-3867）/缺 `ready_seq=`（:3868-3872）/旧轮次信号（两条信号绑第一条，被 :2204-2216 的「其后同 (实例，判定方) 组合还有 ready 信号」扫描拦下，:3873-3882）/他人信号（signal.agent ≠ reviewed，:3883-3902）/跨实例拼接（builder#1 信号配 `reviewed=builder#2`，:3904-3918，即 oracle 的 coder#1/#2 形状）/送审方未终态（:3920-3927）/送审方 agent_lost（:3929-3937，`_latest_for_instance` 按实例取、lost≠done）。**「不落账、行数不变」被钉住**：`assert_rejected`（:3611-3619）对每条拒绝例断言 exit 2 + `^error: HC-RL-A146 ` + 账本字节逐位不变。`ready_seq=<n>` 用全局行号定位（:2191-2193）可靠：加载侧强制 seq 连续（`relay_log.py:1569`）、追加侧 `seq = len(entries)+1`（:2492）。送审方 `seq` 早于本条由「校验发生在追加前、被引事件必在既有行中」结构保证。
4. **不生效保证与既有闸：pass**。不生效正例：R 形态节点（requirement[reviewer 角色]+scribe，零信号）判定方裸 done 被接受（`test_relay_log.py:3942-3950`）；多路正例：一路两轮（requirement 绑第 2 轮 seq）一路一轮（lesson 绑第 1 轮 seq）互不串、两路 done 均被接受（:3951-3988）。`_validate_node_close`（:2082-2114）与迁移表零改动（均处 hunk 间未触碰区，diff 逐 hunk 头核实）。A49/A60/A70 未削弱：`test_agent_launch_requires_node_start_and_terminal_agents_are_sealed`（:1223-1237，不在 diff 两 hunk `@@ -691`/`@@ -3528` 内=保持原样）、`test_runtime_trigger_and_dependency_gates`、`test_node_close_ignores_an_untriggered_agent`、`test_attempts_are_per_node_and_only_relaunch_after_authorized_causes`、`test_relaunch_attempt_increment_is_exact_after_terminal_causes` 由本 checker 独立复跑 5 条全绿（20.7s）。
5. **硬约束：pass**。新增行 grep `_latest_by_name` 计 0——新校验只用 `_latest_for_instance`（`_require_review_ready`:1701、`_validate_review_done_pairing`:2217）+ `_current_instance` 的 max-attempt 扫描；既有 `on:done:` 分支对 `_latest_by_name` 的使用保持原样（:1733，上下文行）。未新增账本字段（`LEDGER_FIELDS`:29、`append_event` entry 形状不在 diff）；19 词事件白名单（`EVENTS`/`CONTROL_EVENTS`:30-56）不在 diff；`Status`/`status_document`/`LossStop`/`_note_tokens` 零改动（新增行 grep 全部 NONE）。
6. **测试质量与证据：pass（E-006 措辞见 P2-1）**。新用例全程经 `assert_rejected` 三重钉住（exit 2 + 精确报错码 + 账本字节）、正例断言 returncode 0，A144 用例另附 A58/A49 反编号断言，无只正向空洞。证据核对：E-008 日志 `/tmp/rlt22-b2-full.log` 实测 `Ran 189 tests in 520.044s OK`、E-009 `/tmp/rlt22-b2-relaytests.log` 实测 `RELAY ALL PASS (SKIPPED: 1)`，与 `progress.md:65-66` 一致；189 = B1 后 186 + B2 新增 3 用例，数目自洽。E-006/E-007 未留日志文件（按派单口径以 re-run 为准）：本 checker 复跑 `RelayReviewReadyTests` 7 条全绿（49.5s），与 E-007 `Ran 7 tests ... OK` 一致。两次返工如实登记于 progress B2 行（:14）：夹具误用空 trigger `W_AGENTS`→改为带 `on:review_ready:` 的 `A144_AGENTS`（:3736-3739）；`ready_seq` 取值时机错放在 launch 后→改为信号写入后即取（`_signal_seq` docstring :3741-3743 及 :3832/:3855/:3900/:3906/:3968/:3973 的调用位均紧随信号行）——登记与代码现状互相印证。B2 行同时如实登记了「超出 B1 占位口径的最小结构调整」及其理由，未美化。
7. **允许路径：pass**。`git status --short`：modified 仅 `tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`docs/modules/relay-light/workspace/RLT_22/progress.md`；untracked 仅 `check.B1.md`、`done.checker.B1.md`（本卡工作区）与 `tools/relay-light/__pycache__/`（RLT_10 F-002 已挂账的测试副产物）——全部在允许路径闭集内；`git diff --check` 无输出。skill/** 本批零改动（A149 属 B3）。
8. **抽查复跑：pass**。`PYTHONDONTWRITEBYTECODE=1 python -m unittest tools.relay-light.test_relay_log.RelayReviewReadyTests -v` → 7 tests OK；另加抽 5 条 A58/A49/A60/A77/A65 既有回归 → 5 tests OK。按派单口径未重跑 8 分钟全量（E-008/E-009 日志已核）。

**边界声明**：本 checker 独立 fresh 视角、与施工者无关；只读代码与证据，仅写本 `check.B2.md` 与 `done.checker.B2.md` 两文件；未改任何程序/测试/工件，未 commit，未做验收裁决。P2-1 不阻断 B3 开工与否由编排裁决。
