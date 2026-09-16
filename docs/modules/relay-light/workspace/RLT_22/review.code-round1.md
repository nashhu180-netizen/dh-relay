<!-- dh:v1 -->
# review.code-round1 — RLT_22 独立复核记录（代码轮 1）

> 复核者：Devin SWE-2 Max（`rlt22-review`），fresh 实例，未参与 RLT_22 施工、批次小审与编排。
> 现场：`/home/nash/work/dh-relay/.dh-worktrees/RLT_22`，分支 `wt/RLT_22`，HEAD `d752627`，基线 master `72c6c4d`。
> 复核对象：`review.md`「复核路径登记」code-round1 行的六个必审靶子 + `dispatch/review.md` 指定的本路核查项（七条 HC 断言强度、反例编号串条、`_latest_for_instance` 绑定、三套计数互不叠加、fixture 落树、「改坏必红」变异、全量复跑）。
> 时间：2026-09-16。

## 结论

**APPROVE_WITH_NITS　·　P0 = 0　·　P1 = 0　·　P2 = 1　·　P3 = 1**

机器侧实体扎实：六个必审靶子逐条核实成立；七条 HC 的正/反例均为真断言（退出码 + 编号 + 账本行数/字节级断言），未发现弱断言或空转断言；反例编号不串；三处变异点全部「改坏必红」并已复原，工作区 `git status` 干净；全量单测与仓级 runner 本机复跑全绿。唯一实质问题是一条 P2：`_validate_review_pairing` 对畸形 `ready_seq`（Unicode 数字）以未捕获 `ValueError` 崩溃收场（exit 1 + traceback），违反「任一不成立退出 2 并报 HC-RL-A146」的错误路径合同——闸门仍 fail-closed（写入被拒绝、不落账），不削弱任何 oracle 枚举情形，属错误路径质量问题，非放行阻塞项。

## 输入清单

`dispatch/README.md`、`dispatch/review.md`、`brief.md`、`task_plan.md`、`progress.md`（E-001~E-021）、`findings.md`（F-001~F-009）、`check.B1~B3.md`、`lesson_candidates.md`、`git diff master...HEAD`（26 文件，+2598/-16）、design/01 §11 `HC-RL-A144`~`A150` 与 A35/A65/A71/A107 原文、「不改」清单 A2/A49/A60/A62/A69/A70/A95/A102、本机复跑命令与三处变异实验。

## 六个必审靶子核查

| # | 靶子 | 结论 | 证据 |
|---|---|---|---|
| ① | A146 执行位点在 agent `done` 语义校验一线，非 `_validate_node_close` | 成立 | `_validate_review_pairing` 于 `relay_log.py:2208` 在 `_validate_event_semantics` 的 `AGENT_EVENTS` 分支内被调（`done` 写入时）；`_validate_node_close`（`:2135`-`:2151`）不在本卡 diff；`append_event`（`:2472`）先 `_validate_runtime_event` 再打开账本 append——被拒 `done` 无落账路径，`test_a146_rejects_at_done_write_time` 以账本逐字节不变 + 改正后可写钉住 |
| ② | 新校验一律 `_latest_for_instance`，无一处沿用 `_latest_by_name` | 成立 | 新代码 `_latest_for_instance` 使用点 `:1700`（A144 当前实例最新事件）、`:2052`（A146 被审实例须已 done）；`_latest_by_name` 全部现存点（`:1680` on:blocked、`:1715` on:done:、`:2149`/`:2643`/`:2648`/`:2653`/`:2887`/`:2993`）均为 master 既有调用，逐一与 `git show master` 比对同源 |
| ③ | `_note_tokens`「首个同名 key 胜出」未改，重复 token 拒在写入侧 | 成立 | `_note_tokens`（`:2578`-`:2585`）不在本卡 diff；A145 在 `_validate_ready_signal`（`:1959`-`:1968`）对**原始 note** 计数 `ready_for_review=` 前缀 token，`!= 1` 即退 2——正是为绕过 `_note_tokens` 只留首个的静默丢失 |
| ④ | 迁移表 / `Status` / `status_document` / `roles.toml` / `dh-mapping.toml` 键与取值零改动 | 成立 | `_validate_agent_transition` 的 `allowed` 表（`:2113`-`:2123`）不在 diff；`Status`（`:2558` 起）与 `status_document`（`:3081`）零改动（`RelayStatusProjectionTests` 精确键集断言随全量绿）；`roles.toml` diff 为空（0 行）；`dh-mapping.toml` diff 仅 `[limits.on_exceed].note` 两行文本，`rework_max_rounds=2`/`attempt_max=3`/`action` 键值未动且被 `test_a149_dh_mapping_note_names_three_counters` 机器断言 |
| ⑤ | `on:done:` 分支与 A70 逐字一致 | 成立 | `_require_trigger` 的 `on:done:` 尾支（`:1714`-`:1717`）与 master 逐字相同，diff 仅在其前插入 `on:review_ready:` 分流；lint 的 A71 文案经 `prefix[:-1]` 对 `on:done:` 前缀仍产出 `on:done must reference the same node` 原文 |
| ⑥ | 反例编号不串（重复 `agent_launch` 报 A58/A49，终态后挂事件报 A60） | 成立 | `test_a144_launch_gate_replaces_b1_placeholder` 断言重复 launch 报 A58 / A49 且 `assertNotIn("HC-RL-A144")`；`_validate_agent_transition` 先于 `_validate_review_pairing` 调用（`:2207` vs `:2208`），终态 agent 的 `done` 先撞 A60；A144 九反例均 `assertNotIn("HC-RL-A70")`；混用路 `test_a148_mixed_trigger_lanes_judge_independently` 双向断言 A144 路不串 A70、A70 路不串 A144；A150 反例断言精确落在 A35/A71 |

## 七条 HC 断言强度核查

- **A144**（九拒绝例 + 正例 + 编号钉）：`test_a144_launch_gate_replaces_b1_placeholder` 与 `test_a144_rejects_without_a_current_instance_signal`——每条反例断言 `returncode == 2` + `^error: HC-RL-A144 ` + 不含 A70；被拒 launch 账本**逐字节**不变；旧 attempt 重放单独成段（`builder#1` 信号 → `agent_lost` → `builder#2` live → 旧信号不可复用）。
- **A145**（写入合同）：`test_a145_ready_signal_write_contract`——合法例接受；双 token / ghost / 非判定角色目标 / 判定角色自写各退 2 报 A145；`test_a145_signals_burn_no_attempt_and_have_no_add_cap` 断言 3 条连续信号（> `rework_max_rounds=2`）全被接受、`agent_launch` 仅 `builder#1` 一条、lost 后重拉恰为 `#2`（A102 显式正例，闭合 F-006）；`test_a145_helper_scan_sees_decider_only` 经 B1 整改后直钉 `_decision_helper`/`_validate_decision_helper` 返回值，且 B1 已用变异证明非空转（E-007）。
- **A146**（配对闸）：`test_a146_pairing_done_accepted_in_order` / `..._rejections` / `..._rejects_at_done_write_time` / `..._inert_without_a_signal` / `..._two_lanes_bind_their_own_ready_seq`——覆盖 oracle 全部枚举：缺 `reviewed=`/缺 `ready_seq=`/非实例形/裸 note/旧轮次 seq/他人信号 seq/非 checkpoint seq/跨实例拼接/送审方未终态/送审方 lost，各退 2 报 A146；无信号与「只有指向他人的信号」两态闸不生效；X 双路各绑各 `ready_seq`；位点证明含账本逐字节断言。
- **A147**（第三套只投影）：`test_a147_review_rounds_is_a_projection_never_a_write_gate`——limit 2 与 3 同一实现各自断言耗尽点；第 N+1 条信号仍被 `add` 接受且账本行数 +1；耗尽后 `escalate` 起头的 strategist 链完整跑通；PASS 后 `review_exhausted` 清空而 `review_rounds` 计数保留；`test_attempt_and_x_loss_stops_trigger_independently` 三处只补第三套断言（`review_rounds == {}`、`review_exhausted == ()`），既有断言未删。
- **A148**（向后兼容）：`test_a148_rlt12_win_01_plan_lints_clean`（lint exit 0、`lint: ok\n`）、`..._ledger_replays_verbatim`（71 行逐条 `add` 全接受、重放后 71 行、node/event/agent/by 与 note 逐字一致——`plan_loaded` 的 provenance 按 §6.2.1 合同重建属预期）、`..._mixed_trigger_lanes_judge_independently`（混用两路各自判、编号不串）。fixture `workspace/RLT_22/fixtures/rlt12-win-01/` 已复制进本树——本复核以 `git show master:.../rlt12-win-01/<f>` 与树内副本 `diff` 逐字节一致核实，测试只经 `Path(__file__).parents[2]` 仓内相对路径读取，无跨树绝对路径。
- **A149**（模板与 adapter）：`test_a149_w_and_x_triggers_switch_r_template_verbatim`（W/X 换 trigger、C trigger 列原样、R 三行逐字）、`test_a149_review_sealing_discipline_verbatim`（SKILL.md 硬规则段 + 两份 adapter 三处命中同段原文）、`test_a149_dh_mapping_note_names_three_counters`（「三套」+键值不动）、W/C/X 三条最小账本序列（A49 重拉消费新信号、checker 同实例 FAIL→PASS 无第二条 launch、X 两路一 FAIL 一 PASS 互不提前封口）。
- **A150**（lint 四态）：`test_trigger_values_and_same_node_done_references_are_checked` 扩四态正例 + `on:review_ready:nobody`/`on:review-ready:`/空前缀报 A35、跨节点与 R 形态报 A71；`test_a150_lint_mapping_table_binds_review_ready_rows` 以结构断言咬住 design/01 §3.5 映射表两行。

## 独立复跑（本机 · `PYTHONDONTWRITEBYTECODE=1`）

| 命令 | 结果 |
|---|---|
| `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log` | exit 0；`Ran 202 tests in 401.334s`，`OK`——与 E-019 计数一致 |
| `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`（仓根） | exit 0；`RELAY ALL PASS (SKIPPED: 1)`；relay-light 段 202 例 `test_relay_log` + 7 例 `test_install_skill` 全 OK——与 E-020 一致 |

复跑后 `find . -name __pycache__` 无命中，`git status --porcelain` 为空。

## 「改坏必红」变异点（3 处，全部断言失败且已复原）

| 锚点 | 原值→变异值 | 类别 | 命中测试 | 施加 hash | 还原 hash | 施加后结果 |
|---|---|---|---|---|---|---|
| `relay_log.py:1706` | `latest["event"] == "checkpoint"` → `== "done"` | 改条件 | `test_a144_launch_gate_replaces_b1_placeholder`、`test_a146_pairing_done_accepted_in_order` | `df59161fff69879f1674787cf8ef5fecd411cb18` | `5174ea1b5b3076485bcf409b6f08f5c11f502df8` | 断言失败（exit 1；合法信号不再武装 launch，`0 != 2`） |
| `relay_log.py:2043` | `.get("ready_for_review") != name` → `== name` | 改条件 | `test_a146_pairing_done_accepted_in_order`、`test_a146_two_lanes_bind_their_own_ready_seq` | `431c150384085a234d8b2ee8158bf0eff5c30109` | `5174ea1b5b3076485bcf409b6f08f5c11f502df8` | 断言失败（exit 1；合法配对 `done` 被误报 A146，`0 != 2`） |
| `relay_log.py:3039` | `review_rounds[combo] >= config.limits.rework_max_rounds` → `>` | 改边界 | `test_a147_review_rounds_is_a_projection_never_a_write_gate` | `e5f6fe41f78f2db7d0dfaba1da8817ccfa264f83` | `5174ea1b5b3076485bcf409b6f08f5c11f502df8` | 断言失败（exit 1；limit 2 与 3 两个 subTest 的 `review_exhausted` 均为 `()` 而非目标组合） |

施加/还原 hash 为 `git hash-object tools/relay-light/relay_log.py`；三处复原后 blob 均回到 `5174ea1…`（HEAD 基线值），`git status` 干净。

## 逐条明细

### P0

无。

### P1

无。

### P2-1　`_validate_review_pairing` 对 Unicode 数字 `ready_seq` 以未捕获异常崩溃

**事实**：`relay_log.py:2022` 用 `ready_seq.isdigit()` 作数值守卫，`:2028` 紧接 `int(ready_seq)`。`str.isdigit()` 对非 ASCII 数字字符（如 `²`、`①`、全角数字等 No/Nl 类）返回 `True`，而 `int()` 只接受十进制数字——`int("²")` 抛 `ValueError`，向上穿透 `_fail`（只接 `RelayError`）直出 traceback。

**本机复现**（合成 plan：builder 信号 → 拉起 plan-reviewer → builder done，随后判定方 `done` 带 `ready_seq=²`）：

```text
ValueError: invalid literal for int() with base 10: '²'
（_validate_review_pairing → <genexpr> → int(ready_seq)）
EXIT=1
```

**判读**：oracle 要求「任一不成立退出 2 并报 `HC-RL-A146`」；此处退出 1 + traceback、无规则号。闸门仍 fail-closed（异常先于 append，`done` 不落账），不削弱任何枚举反例；但 `add` 的退出码合同（0/2/3/4）在畸形输入上被破，下游 watcher/脚本见到 exit 1 会按「非预期崩溃」而非「合同拒绝」分流。修法一行量级：守卫改 `ready_seq.isascii() and ready_seq.isdigit()`，或 `int()` 收进 try 归并到 A146 拒绝。**不阻塞本路结论**，建议整改后进全量回归。

### P3-1　`test_relay_log.py:1433` 注释残留「B1 placeholder」措辞

`test_runtime_trigger_and_dependency_gates` 内注释仍写 "the B1 placeholder"——B2 已用完整 A144 前置替换占位，该处拒绝由真闸给出（`checker` 的 `on:review_ready:coder` 无信号）；断言本身正确（exit 2 + A144），仅措辞陈旧。

## 范围与边界核对

- `git diff --name-only master...HEAD` 全部落在允许路径闭集（`relay_log.py` / `test_relay_log.py` / `skill/**` / 本卡 workspace）；`tools/tests/**`、`install_skill.py`、design、DevPlan、AGENTS.md、其它卡工作区零触碰。
- 事件层 19 词白名单、迁移表、`Status`/`status_document`、`roles.toml` 与 `dh-mapping.toml` 键值逐一核实零改动；`on:done:` 运行时语义与 lint 文案逐字保留。
- 凭据红线：本路复核未向任何文件写入密钥/凭据值；变异实验与复跑输出无凭据内容。

## 裁决

**APPROVE_WITH_NITS**。六个必审靶子与七条 HC 断言强度逐条闭合，独立复跑与变异实验佐证「改坏必红」；遗留 P2-1（`ready_seq` 畸形输入的退出码合同）与 P3-1（陈旧注释）建议整改但不阻塞。本结论仅为代码轮 1 一路的事实登记，不替编排做验收裁决。

---

## X1 复看（2026-09-16 · 整改提交 `2a8f7e6`）

> 复看者：rlt22-review（devin swe-2-max），同 R 批 code-round1 复核者。范围只限 X1 整改（`git show 2a8f7e6`：`relay_log.py` 一行守卫、`test_relay_log.py` 新用例 + 注释措辞、`progress.md` 证据）与全量复跑；只读不改代码（变异实验跑后已复原）。

### P2-1 — CLOSED

- 守卫 `relay_log.py:2022` 已由 `not ready_seq.isdigit()` 改为 `not (ready_seq.isascii() and ready_seq.isdigit())`——ASCII 域内 `isdigit()` 等价于全 `0-9`，`int()` 不再可能逃逸成未捕获 `ValueError`；空串、`+3`、`1,000` 等仍走原 A146 拒绝路径。
- 本机复现翻转：`add done --agent plan-reviewer#1 --note "reviewed=builder#1 ready_seq=² PASS"` → `error: HC-RL-A146 review pairing done requires ready_seq=<n>, got ²`，**EXIT=2**（X1 前为 EXIT=1 + traceback），账本行数不变（探针账本 8 行前后一致，被拒 `done` 不落行）。
- 新增用例 `test_a146_malformed_ready_seq_exits_two_not_crash`：六个畸形值（`²`/`四`/`½`/`①`/`{seq}²`/`1,000`）各断言 `returncode == 2` + `^error: HC-RL-A146 `，循环后断言账本**逐字节**不变——畸形输入反例 + 不落行两条要求均以真断言承接。
- 「改坏必红」复证：把守卫临时还原为 `not ready_seq.isdigit()`（施加 hash `5174ea1b…`，即 X1 前 blob），该用例 FAILED（failures=3，`²`/`①`/`{seq}²` 各 `2 != 1`，stderr 为 ValueError traceback）；复原后（还原 hash `f6e22a85…`，HEAD blob）用例转绿、`git status` 干净。

### P3-1 — CLOSED

`test_relay_log.py:1433` 注释已改为「fail-closed without a ready_for_review signal — never the A70 on:done: branch.」，如实描述现行 A144 闸，「B1 placeholder」残留措辞已清。

### 新引入问题

无。X1 diff 仅一行守卫加严 + 一处注释 + 一个测试方法，全部落在允许路径闭集；未触碰 `review.*.md`、迁移表、`Status`/`status_document` 或任何既有合同面。

### X1 复跑证据（本机 · `PYTHONDONTWRITEBYTECODE=1`）

| 命令 | 结果 |
|---|---|
| `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log` | exit 0；`Ran 203 tests in 570.592s`，`OK`（202 + 新增 1 例）——与 E-024 一致 |
| `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`（仓根） | exit 0；`RELAY ALL PASS (SKIPPED: 1)`；relay-light 段 203 例 `test_relay_log` + 7 例 `test_install_skill` 全 OK——与 E-025 一致 |

### X1 复看裁决

**APPROVE**。P2-1、P3-1 均以「实现修复 + 真断言 + 变异复证」闭合，无新增问题；R 批 code-round1 结论由 APPROVE_WITH_NITS 转为 **APPROVE**。
