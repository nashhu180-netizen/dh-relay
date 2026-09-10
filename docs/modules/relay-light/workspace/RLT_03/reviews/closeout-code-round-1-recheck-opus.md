<!-- dh:v1 -->
# closeout code_round_1 recheck — RLT_03 closeout-rework=1 定向复验

## 0. 身份与基线

| 项 | 值 |
|---|---|
| `review_path_id` | `code_round_1`（同一路径的 rework=1 定向复验，非新路径） |
| 复核者 herdr agent name | `rlt03-code1-opus` |
| pane / tab / workspace | `w15:pA` / `w15:t1` / `w15`（`HERDR_SESSION=kpi-agg`） |
| Claude session id | `934393db-73b7-4b1f-b726-c94da80c71f4` |
| 自报实际模型 | Claude Opus 5（`claude-opus-5`），`CLAUDE_EFFORT=high` |
| 启动形态 | Herdr pane 内交互式 Claude Code CLI，**与首轮同一会话**（首轮 `closeout-code-round-1-opus.md` 由本 pane 出具，故本轮为同路径复验而非独立第二意见） |
| 派出证据 | E-055 |
| branch / HEAD | `wt/RLT_03` / `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc`（HEAD 未动，整改在工作树） |
| 被复验的改动 | 工作树 `M tools/relay-light/relay_log.py`（+24/-6）、`M tools/relay-light/test_relay_log.py`（+98/-31）、`M progress.md`、`M findings.md`、`M lesson_candidates.md` |
| 只读承诺 | 未改一行生产/测试代码，未改 `progress.md` / `findings.md` / `lesson_candidates.md` / `review.md` / DevPlan / design，未改任何既有 review 报告，未 commit、未 push。全部变异在 `tempfile.mkdtemp()` 副本上进行并即时删除 |
| 唯一写入 | 本文件 |

**读取范围**：`progress.md` E-052~E-056 与更新后的矩阵收口句、`findings.md` F-037~F-042、`lesson_candidates.md` L-001~L-003、两条 Python 的完整 `git diff`。**未读取**本目录下 code_round_2 / 需求 / 一致性 / 教训四路的报告。

**卫生**：本轮 `py_compile` 生成的两条 `.pyc` 已按精确路径 `rm` + `rmdir` 清除；结束时 `find tools/relay-light -type f` 仅余两个 `.py`。

---

## 1. 独立复跑：命令与退出码

| # | 命令 | 退出码 | 关键输出 |
|---|---|---|---|
| R-01 | `PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile tools/relay-light/{relay_log,test_relay_log}.py` | 0 | — |
| R-02 | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py` | **0** | `Ran 54 tests in 30.694s` / `OK`（`grep -c "def test_"` = 54，与之相符） |
| R-03 | `python3 tools/relay-light/relay_log.py --help` | 0 | `{add,status,lint}`，仍为三子命令 |
| R-04 | `git diff --check` | 0 | 无 whitespace 报告 |
| R-05 | 禁用原语 grep（`.lower(`/`.casefold(`/`fcntl`/`msvcrt`/`flock`/`tempfile`/`os.replace`/`shutil.move`/`pane`） | 0（有命中，见右） | 仅两处 `splitlines`：`relay_log.py:179`（**计划文件**读取，账本侧已无）与 `:437` 注释文字。锁/临时文件/覆盖写/pane 仍零命中 |
| R-06 | `grep -nE "HC-RL-A(64\|73\|86\|88\|90)\b" tools/relay-light/*.py` | 1（零命中） | 退役编号仍零残留 |
| R-07 | `git diff --name-only` + 允许路径逐条判定 | — | **5 条改动全部落在 RLT_03 允许路径内**（2 条 tools + 3 条 workspace） |
| R-08 | E-052 独立回放（`git show HEAD:…/relay_log.py` + 当前测试文件） | 1 | `Ran 54 tests` / `FAILED (failures=8)` |
| R-09 | 14 组隔离变异 × 全量 54 tests | 见 §3 | 12 组转红、2 组存活（其中 1 组为 detail-only 探针，属预期存活） |
| R-10 | 真 CLI 场景复验（design §9.3/§9.4 四条链、Unicode 三字符、A49/A58、空 agent、合同冲突三例） | 见 §2 | — |

### E-052 先红证据独立回放（R-08）

把 `HEAD` 版 `relay_log.py` 与**当前**测试文件放进临时目录跑全量：

```
Ran 54 tests · FAILED (failures=8) · rc=1
  FAIL test_agent_rows_reference_existing_nodes_with_unique_names              AssertionError: RelayError not raised
  FAIL test_attempts_are_per_node_and_only_relaunch_after_authorized_causes    AssertionError: 2 != 0
  FAIL test_decision_and_user_decision_must_resume_… (name='user_decision')    AssertionError: 0 != 2
  FAIL test_decision_repeats_helper_… (helper='decider#1')                     AssertionError: 0 != 2
  FAIL test_decision_repeats_helper_… (helper='strategist#1')                  AssertionError: 0 != 2
  FAIL test_unicode_line_separators_… (separator='U+0085')                     AssertionError: 0 != 4 : error: ledger line 2: invalid JSON
  FAIL test_unicode_line_separators_… (separator='U+2028')                     AssertionError: 0 != 4 : error: ledger line 2: invalid JSON
  FAIL test_unicode_line_separators_… (separator='U+2029')                     AssertionError: 0 != 4 : error: ledger line 2: invalid JSON
```

8 个红点数量与 E-052 记录**精确一致**，且断言消息全部是行为断言（`RelayError not raised` / `2 != 0` / `0 != 2` / `0 != 4`），**无一条是 import / fixture / TypeError / loader 噪音**。E-052 的「先红」成立。E-053 的「54 tests OK」由 R-02 独立复现。

---

## 2. 六条首轮 finding 的逐条裁决

### P1-1 — A69 helper token 扩展到 `user_decision`，堵死 design §9.3/§9.4 冻结样张 → **CLOSED**

**改动**：`relay_log.py:618` 由 `if event in {"decision", "user_decision"} and agent in owners:` 收窄为 `if event == "decision" and agent in owners:`；测试重命名为 `test_decision_repeats_helper_while_user_decision_uses_frozen_note_shape`（`:1098`），把 `user_decision` 的四条 token 反例换成正例 `approve-amend: 用户同意 decision.md`。findings 记为 F-039。

**真 CLI 全链回放**（四条冻结样张，逐条 `add`）：

| design 样张 | 事件数 | 结果 |
|---|---|---|
| §9.4 consult decider 链 + `approve-amend:` + `planner-amend#1` + `plan_amend` + `resume`（:966 那一行在内） | 13 | **全部 rc=0** |
| §9.4「用户否决」分支 + `reject-amend:`（:994） | 10 | **全部 rc=0** |
| §9.3 strategist 链 → `resume` 终局（:943） | 9 | **全部 rc=0** |
| §9.3 strategist 链 → `cancelled` 终局（:950） | 9 | **全部 rc=0** |

首轮那条被卡死的 `user_decision coder#1 note='approve-amend: 用户同意 decision.2.md（含改计划）'` 现为 **rc=0**。

**无回归**（收窄是否把闸门一起松掉——逐条对抗验证）：

- **F-034（escalate 必须恰好一个 kind 一致 token）**：7 条坏 note（空 / 纯自由文本 / `decider=` / `decider=other#9` / `strategist=decider#1` / 双不同 token / 双相同 token）**全部 rc=2 + `HC-RL-A69`，账本行数 4→4 不变**。
- **F-035（decision 必须重复同一 helper 实例）**：5 条坏 note（空 / 自由文本 / `decider=` / `decider=other#9` / **`decider=decider#2`**）**全部 rc=2 + A69，行数 5→5 不变**；`decider#2` 那条报 `decision event decision must carry helper decider#1 in note`，正是 F-035 要钉的 equality。
- **F-025（helper 不得自持决策事件）**：`decision decider#1` → rc=2 A69。
- **`user_decision` 的 owner 闸仍在**（只掉 token，没掉归属）：`user_decision other#1` → rc=2 A69；`user_decision decider#1` → rc=2 A69。
- **F-026（必须先 resume 才能 done）**：`user_decision` 后直接 `done` → rc=2 A60。

**变异佐证**：M12「把 helper token 重新扩到 `user_decision`」→ 54 tests **FAILED (failures=3)**，即当前样张形态被回归网锁住，不会被悄悄改回去。

### P1-2 — U+2028/U+2029/U+0085 写入后永久写坏纯追加账本 → **CLOSED**

**改动**：`relay_log.py:440` 由 `text.splitlines()` 改为 `text[:-1].split("\n")`，并在 `:437-439` 写明理由（JSONL 记录以 LF 为界，`splitlines()` 会切开合法 JSON 字符串内容）。findings 记为 F-037。

**真 CLI 往返**（每字符独立目录，`add` 后立刻 `status` / `status --json` / 再 `add`）：

| 字符 | add | status | 行数 | note 原样回读 | 后续 add | `status --json` | 物理 LF | `py splitlines()` |
|---|---|---|---|---|---|---|---|---|
| U+0085 | 0 | **0** | 2 | **True** | **0** | 0 | 2 | 3 |
| U+2028 | 0 | **0** | 2 | **True** | **0** | 0 | 2 | 3 |
| U+2029 | 0 | **0** | 2 | **True** | **0** | 0 | 2 | 3 |

`物理 LF=2` 而 `splitlines()=3` 这一对数字正是本条 bug 的判据：读侧已只认 LF，账本保持可读且**可继续追加**（首轮该场景是 status/add 双 4、无修复路径）。

**无回归**：

- `note` 内嵌 `\n` / `\t` / `\r` 仍被 `json.dumps` 转义 → add 0、status 0、物理 LF=2、行数 2。
- **F-019（末行无换行）仍 fail-closed**：status rc=4、add rc=4、`bytes 283→283` 不变。
- **F-024（CRLF 账本容忍）语义未变**：CRLF 账本 status rc=0、`status: 1 ledger entries`。
- **计划侧仍 fail-closed**：`relay_log.py:179` 的 `splitlines()` 保留，把 U+2028 塞进 agent 表单元格 → `lint rc=3 error: HC-RL-A24 line 9: invalid table cell structure`（见 §4 P3-5）。

**变异佐证**：M10「把 LF 切分改回 `splitlines()`」→ 54 tests **FAILED (failures=3)**，三个 Unicode subtest 各自转红。判别力成立。

### P2-1 — A49 重拉资格闸零覆盖（整块删除后全绿） → **CLOSED**

**改动**：`test_relay_log.py:800-807` 在 `coder#1` 仍在场时补 `agent_launch coder#2` 反例，断言 `rc=2` + `^error: HC-RL-A49 ` + **账本字节不变**；生产侧另把 launch 基线从「按名字最新事件」改为「全部 `agent_launch` 的最大 attempt」（`:634-645`，F-038）。findings 记为 F-041 / F-038。

**真 CLI**：`node_start → agent_launch coder#1 → agent_launch coder#2` → `rc=2 error: HC-RL-A49 agent coder is not eligible for relaunch`，字节不变。

**变异佐证**：

- **M1「整块删除 A49 闸」→ 由首轮的 `rc=0 OK（存活）` 变为 `FAILED (failures=1)`**，命中 `test_attempts_are_per_node_and_only_relaunch_after_authorized_causes`。首轮该条正是唯一的行为级存活项，现已被杀死。
- M11「把最大 attempt 基线改回 latest-by-name」→ `FAILED (failures=1)`，F-038 亦有判别力。

**F-038 本身独立复验**（stage failed 后重拉、旧实例继续写事件，再次拉同号）：

```
agent_launch coder#1  0 → stage_result outcome=failed 0 → agent_launch coder#2 0
checkpoint coder#1 0 → stage_result outcome=failed 0
agent_launch coder#2  → rc=2  error: HC-RL-A58 attempt for coder must increment by one   bytes 988→988 不变
agent_launch coder#3  → rc=0
```

即重号被 A58 拒绝且零写入，合法 +1 仍放行。**这是 code round 2 发现的真实缺陷，本轮确认已闭合**。

### P2-2 — 五个 owner ID 的「编号 ↔ 守卫」绑定可任意对调而不转红 → **CLOSED**

**改动**：`test_relay_log.py` 为六个反例补 `assertRegex(…, r"^error: HC-RL-Axx ")` —— A70×2（`:945`/`:949`）、A77（`:959`）、A78 依赖分支（`:977`）、A17（`:998`）、A74（`:1002`）、A68 重复关闭（`:1014`）。findings 记为 F-041。

**变异佐证**（首轮存活 → 本轮全部转红）：

| 变异 | 首轮（53 tests） | 本轮（54 tests） |
|---|---|---|
| M2 `A70 → A77` | 存活 OK | **KILLED** `test_runtime_trigger_and_dependency_gates` |
| M3 `A74 → A17` | 存活 OK | **KILLED** `test_node_close_requires_all_terminals_and_configured_agent_done` |
| M4 `A78`(依赖) → `A68` | 存活 OK | **KILLED** `test_runtime_trigger_and_dependency_gates` |
| M5 `A68`(重复关闭) → `A17` | 存活 OK | **KILLED** `test_node_close_requires_all_terminals_and_configured_agent_done` |
| M6 `A77 → A70` | 存活 OK | **KILLED** `test_runtime_trigger_and_dependency_gates` |
| M7 `A59 → A69` | 已 KILLED | **KILLED**（未退化） |

五处全部补齐，无一遗留。

### P2-3 — 空 agent 名逃过 A24 并连带放行 `close=agent:` → **CLOSED**

**改动**：`relay_log.py:345-346` 在活跃 agent 循环最前加 `if not agent.agent: raise _error("HC-RL-A24", …)`。findings 记为 F-040。

**真 CLI 四象限**：

| 计划形态 | 结果 |
|---|---|
| 空 agent 名 + `close=agent:` | `lint rc=2 · lint: HC-RL-A24 line 9: agent is empty` |
| 空 agent 名 + `close` 留空 | `lint rc=2 · HC-RL-A24`（不依赖 close 才发现） |
| `close=agent:` + 正常 agent 名 | `lint rc=2 · lint: HC-RL-A47 line 5: invalid close value agent:` |
| 空名但该行标 `superseded` | `lint rc=0 · lint: ok`（superseded 行仍被忽略，符合 A128） |
| 合法对照计划 | `lint rc=0 · lint: ok` |

首轮的 fail-open（`lint: ok` exit 0）已消失，**两条通路（A24 与 A47）各自独立生效**，且没有把 A128 的 superseded 忽略语义一起收紧。

**变异佐证**：M8「删除空 agent 闸」→ `FAILED (failures=1)`；M9「把该闸编号改成 A75」→ `FAILED (failures=1)`。行为与编号双向锁住。

### P2-4 — 矩阵「全部闭合、无 blocker」措辞与 open finding 不自洽 → **CLOSED**

`progress.md` 收口句已改写为：

> 上表 16 组 brief 条件已与 42 个 ID 全部**建立测试映射**；E-052~E-054 又闭合收口复核发现的实现与判别力缺口。**当前不能写「全部闭合」**：A5 受 F-016 的 lint 2 / add-status 3 文本冲突限定，A128/A129 受 F-003 的 RLT_09 表尾放宽交接限定，须先完成正式合同裁决。

「无 blocker」已删除，A5 与 A128/A129 被点名限定，且与 F-016 / F-003 的 open 状态一致。首轮 P2-4 要求的正是这一条，**措辞问题已闭合**。

---

## 3. 变异矩阵总表（14 组，全量 54 tests）

| 变异 | 类别 | 结果 |
|---|---|---|
| M1 删除 A49 重拉资格闸 | 行为 | **KILLED**（首轮存活） |
| M2 `A70 → A77` | 编号 | **KILLED**（首轮存活） |
| M3 `A74 → A17` | 编号 | **KILLED**（首轮存活） |
| M4 `A78`(依赖) `→ A68` | 编号 | **KILLED**（首轮存活） |
| M5 `A68`(重复关闭) `→ A17` | 编号 | **KILLED**（首轮存活） |
| M6 `A77 → A70` | 编号 | **KILLED**（首轮存活） |
| M7 `A59 → A69` | 编号 | KILLED（首轮已 KILLED） |
| M8 删除空 agent A24 闸 | 行为 | **KILLED** |
| M9 空 agent 闸 `A24 → A75` | 编号 | **KILLED** |
| M10 LF 切分改回 `splitlines()` | 行为 | **KILLED**（3 个 subtest） |
| M11 最大 attempt 基线改回 latest-by-name | 行为 | **KILLED** |
| M12 helper token 重新扩到 `user_decision` | 行为 | **KILLED**（3 个 subtest） |
| M13 删除末行换行守卫 | 行为 | **SURVIVED** → 见 §4 P3-1（已证明行为等价） |
| D1 detail-only：4 处诊断文案改写 | detail | **SURVIVED（预期）** → 见下 |

### detail-only 探针（D1）独立复验 —— F-042 的主张成立

首轮之后，测试把四条断言从「绑定诊断文案」放宽为「只绑定 code」：

| 位置 | 原断言 | 现断言 |
|---|---|---|
| `test_lint_cli_smoke_…` 缺文件 | `^error: HC-RL-A18 cannot read relay_plan\.md:` | `^error: HC-RL-A18 ` |
| `test_lint_cli_smoke_…` 坏 marker | `^error: HC-RL-A18 first line must be` | `^error: HC-RL-A18 ` |
| `test_add_reports_genuine_append_failure_…` | `^error: ledger cannot append relay_log\.jsonl:` | `^error: ledger ` |
| `test_non_newline_terminated_ledger_…` | `^error: ledger last ledger line is not newline-terminated` | `^error: ledger ` |

我在隔离副本里**只改这四处 message 文案**（`cannot read relay_plan.md: {exc}` → `relay_plan.md unreadable ({exc})` 等），code、退出码、写入行为一律不动 → 全量 54 tests **rc=0 OK**。

裁决：**放宽是正当的**。design §11 A63 只冻结 `error: <code> <message>` 这个**格式**与 code 取值，message 文本从未进入任何冻结合同；把未冻结文本写进断言会在合法改写时产生假红。F-042 与 L-003（复用候选-61）的判断与证据一致。**唯一的副作用是 M13**，单列为 P3-1 并已证明其行为等价。

---

## 4. 本轮新增 findings（全部 P3，不阻塞）

### P3-1 · 末行换行守卫已成冗余，其存在与否无法被测试区分（M13 存活）

`relay_log.py:433-434` 的 `if not text.endswith("\n"): raise _ledger_error(...)` 在 `:440` 改为 `text[:-1].split("\n")` 之后已**逻辑冗余**——任何合法 JSON 行都以 `}` 收尾，`text[:-1]` 必定破坏最后一条记录。隔离副本删除该守卫后跑全量：**54 tests OK（存活）**。

行为等价性我做了直证，**没有把它当成回归**：

| | status | add | 字节 |
|---|---|---|---|
| 真实（有守卫）·多行 | rc=4 `last ledger line is not newline-terminated` | rc=4 | 283→283 不变 |
| 变异（无守卫）·多行 | rc=4 `line 2: invalid JSON` | rc=4 | 283→283 不变 |
| 真实（有守卫）·单行 | rc=4 `last ledger line is not newline-terminated` | — | — |
| 变异（无守卫）·单行 | rc=4 `line 1: invalid JSON` | — | — |

即 **F-019 的合同（fail-closed 退 4、不追加、字节不变）在两种形态下都成立**，差异只在诊断文案——而文案按 §11 A63 本就不冻结。所以 M13 存活是 P3-1「显式守卫已冗余、只剩可读性价值」，不是 P2「回归网破洞」。

建议（不阻塞，可留给 RLT_10 全量入口）：要么在守卫上加注释说明它现在只负责给出更准确的诊断、要么在测试里额外断言 `line`/`newline` 二选一的诊断族。

### P3-2 · `progress.md:109` 矩阵第 15 行仍引用已被重命名的测试

矩阵仍写 `test_decision_events_carry_the_same_helper_token_as_the_escalate`（A69 helper note 必填），而该测试已在 `test_relay_log.py:1098` 更名为 `test_decision_repeats_helper_while_user_decision_uses_frozen_note_shape`，且语义也从「三事件都要 token」变成「decision 要、user_decision 用冻结样张形态」。矩阵是活文档，指向不存在的测试名会让下一位复核者查空。

（`progress.md:75` 的 E-042 同样出现旧名，但那是历史证据行，按本卡既定惯例「历史记录按原样保留」，**不算问题**。）

### P3-3 · 生产代码出现 `assert`（`relay_log.py:650`）

`prior = _latest_for_instance(...)` 之后写 `assert prior is not None`。由构造可知 `prior_attempt` 来自某条 `agent_launch`，该实例至少有那一条事件，所以恒不为 `None`；但 `python -O` 会剥掉 `assert`，此时若不变式被后续改动破坏就会以 `TypeError` 而非 `RelayError` 冒出来，和本卡通篇的 fail-closed + 统一 `error: <code> <message>` 纪律不一致。建议改成显式 `raise _error(...)` 或直接用 launch 条目本身。

### P3-4 · E-052 对红点的分类描述少记一条

E-052 写「空 agent 为 `RelayError not raised`、重复 attempt 为 `2 != 0`、**两条** `user_decision` 路径为 `0 != 2`、U+0085/U+2028/U+2029 三路为 `status 0 != 4`」= 1+1+2+3 = 7，而同一行又写 `8 failures`。我的独立回放（R-08）显示 `user_decision` 形态的红其实是**三条**：`test_decision_and_user_decision_must_resume_before_original_agent_done (name='user_decision')` 一条 + `test_decision_repeats_helper_…` 的 decider/strategist 两个 subtest。总数 8 无误，只是分类计数写少了一条。属证据描述精度问题，非伪造。

### P3-5 · 计划文件仍用 `splitlines()`（`relay_log.py:179`），LF-only 理由未延伸到该侧

账本侧的注释（`:437-439`）把「记录边界只能是 LF」讲清楚了，但计划读取仍是 `read_text().splitlines()`，对 U+2028 等字符沿用宽分隔符语义。我实测该侧是 **fail-closed** 的（U+2028 落进单元格 → `lint rc=3 HC-RL-A24 invalid table cell structure`），所以当前不构成缺陷。登记原因是 RLT_09 的 `planner-amend` 会**写** `relay_plan.md`，届时若写入端引入这类字符，诊断会以「表结构非法」的形式出现而非「非法字符」，排障成本高。留给 RLT_09 决定是否收紧。

---

## 5. 明确保持 separate blocked 的事项（本轮不裁决、不因之否定整改）

以下三类与本轮代码整改**无因果关系**，其现状我做了不变性复验，仅作事实登记：

| 事项 | 复验事实 | 归属 |
|---|---|---|
| **A5 合同冲突**（F-016，open） | 节点号重复 → `lint rc=2 HC-RL-A46` / `status rc=3` / `add rc=3`；design §11:1122 字面要求三命令均 3，§3.1/§3.5 要求 lint 规则违反为 2 | 正式合同裁决，非本卡代码问题 |
| **A128/A129 表尾放宽冲突**（F-003，open） | 表尾追加 → `lint rc=2 HC-RL-A129`；superseded 行隔开 → `lint rc=0 lint: ok`；design §3.5:409 / §4.3:496 / §4.5.4:583 含豁免，§11:1132 不含，A120 已归 RLT_09 | 正式合同裁决 + RLT_09 交接 |
| **`b7f4ecc` 越界打包**（首轮 P3-4） | 该提交仍含 5 个 design/dev_plan 文件；但**本轮工作树改动 5 条全部落在允许路径内**（R-07），未叠加新的越界 | 主控提交纪律，非本卡代码问题 |

首轮其余 P3 中，P3-1（F-003 冲突范围描述偏窄）、P3-2（DevPlan 卡「三类豁免」文案）、P3-3（§10.1 样品未做 fixture）、P3-5（`RELAUNCH_EXEMPT_AGENT_NAMES` 名不副实）、P3-7（`on:done:<自身>` 自引用）、P3-8（`.gitignore` 无 `__pycache__`）本轮均未变动，继续登记备查——它们全部落在 P3，不阻塞本次裁决。

---

## 6. 结论

**APPROVE**（针对 `closeout-rework=1` 的代码整改范围）

计数：**P0=0 · P1=0 · P2=0 · P3=5（新增）**

逐条裁决：

| 首轮 finding | 级别 | 裁决 | 核心证据 |
|---|---|---|---|
| P1-1 A69 token 堵死 §9.3/§9.4 样张 | P1 | **CLOSED** | 四条冻结链共 41 个事件全部 rc=0；F-025/026/034/035 反例 17 条全部仍 rc=2 A69 且零写入；M12 转红 |
| P1-2 Unicode 三字符写坏账本 | P1 | **CLOSED** | 三字符 add 0 / status 0 / 可继续 add / note 原样回读；物理 LF=2 vs `splitlines()`=3；F-019 与 F-024 均未回归；M10 转红 |
| P2-1 A49 闸零覆盖 | P2 | **CLOSED** | 真 CLI rc=2 A49 零写入；**M1 由存活转为 KILLED** |
| P2-2 五处编号绑定无回归 | P2 | **CLOSED** | 六条 `assertRegex` 补齐；**M2–M6 五组全部由存活转为 KILLED** |
| P2-3 空 agent + `close=agent:` fail-open | P2 | **CLOSED** | 四象限真 CLI 全部 fail-closed 且 superseded 语义未误伤；M8/M9 转红 |
| P2-4 矩阵闭合宣称不自洽 | P2 | **CLOSED** | 收口句已删「无 blocker」并点名 A5/F-016 与 A128-A129/F-003 限定 |

附带确认：code round 2 提出的 F-038（stage-failed 后重号）经独立真 CLI 复验确已闭合；lessons 路径提出的 F-042（detail-only 断言放宽）经 D1 探针独立验证主张成立、无假红，其唯一副作用 M13 已证明为行为等价的冗余守卫（P3-1）。

新增 5 条 P3 均不阻塞，建议留给主控按需分派或转入 backlog / RLT_09 / RLT_10。

本报告只给事实与级别，不做验收裁决，不改任何被审文件；A5 / A128 / A129 的正式合同冲突与 `b7f4ecc` 的越界打包按主控指示保持 separate blocked，不影响本轮对代码整改事实的 APPROVE。
