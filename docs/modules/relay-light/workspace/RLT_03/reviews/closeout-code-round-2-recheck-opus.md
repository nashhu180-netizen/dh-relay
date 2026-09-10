<!-- dh:v1 -->
# closeout-code-round-2-recheck-opus — RLT_03 heavy 代码轮 2 · closeout-rework=1 定向复验

## 0. 本轮身份与范围

| 项 | 值 |
|---|---|
| `review_path_id` | `code_round_2`（同一路径的 recheck，不是新路径） |
| 派出证据 | E-056（`progress.md`：`rlt03-code2-opus｜RLT_03 closeout rework=1 code_round_2 recheck including final mutation validity`） |
| pane / session | `TMUX_PANE` / `TMUX` 未设置；Claude Code 会话 `session_01K5mNjEgj4A5nKWhkEpMdvn`；`HERDR_AGENT` / `RELAY_RECEIPT` 未注入本进程环境 |
| 自报实际模型 | Claude Opus 5（`claude-opus-5`） |
| 自报启动形态 | Claude Code CLI worker；延续 `closeout-code-round-2-opus.md` 的同一会话（本轮为**同路径定向复验**，非 fresh 轮）；未加载 skill、未派子 agent、未询问用户 |
| branch / HEAD | `wt/RLT_03` / `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc`（无新提交） |
| 复验对象 | `progress.md` E-052~E-056；`findings.md` F-037~F-042；工作树两条 Python diff（`relay_log.py` +24/-… 、`test_relay_log.py` +98/-…） |
| 复验范围 | 只裁决上一份报告的 R2-P1-1 / R2-P2-1 是否闭合、原变异九字段在**当前最终字节**是否仍为行为断言红、以及 user_decision / 空 agent / A49 / 编号 / detail-only 五项顺带回归 |
| 本轮写权限 | 仅本文件。未改代码、未改既有报告、未改 `review.md` / `progress.md` / `findings.md` / DevPlan / design；未 commit、未 push |
| 复验后真实树字节 | `relay_log.py` sha256 `f484ffba38504424d5be3c3080b71d83186e31c0d5c6b6e5ed01cbbf117ceb1e`；`test_relay_log.py` sha256 `4c5a58c7efe4848172655457a75507f23b61894dac2d15401a82161ce714da73`（全程未被本轮写过） |

**证据姿势**：整改方自述（E-052/E-053/E-054、F-037~F-042）本轮一律**不当作闭合证据**，只当作待验命题；下列每条都由本轮自跑真 CLI / 隔离副本变异复算。

## 1. 命令与退出码（本轮亲自执行）

| # | 命令 | 退出码 | 关键输出 |
|---|---|---|---|
| K-01 | `git rev-parse --abbrev-ref HEAD` / `HEAD` / `git status --porcelain` / `git diff --stat` | 0 | `wt/RLT_03` / `e4b4cd6…`；改动仅 5 个文件（2 py + 3 workspace） |
| K-02 | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py`（进场） | **0** | `Ran 54 tests in 29.541s` / `OK` |
| K-03 | 真 CLI PROBE A：U+0085 / U+2028 / U+2029 往返 | 全 0 | 见 §2.1 |
| K-04 | 真 CLI PROBE B：上一轮重号 exploit 原序列重放 | 见 §2.2 | 重复 `coder#2` → **2** |
| K-05 | 真 CLI PROBE C：账本读侧 fail-closed 回归四例 | 见 §2.3 | 无回归 |
| K-06 | 真 CLI PROBE D：空 agent 名 lint | **2** | `lint: HC-RL-A24 line 11: agent is empty` |
| K-07 | 真 CLI PROBE E：`user_decision` 三种冻结样张 note + 越权写入者 | 见 §2.5 | 样张全 0；越权 2 且零写入 |
| K-08 | 变异副本目标测试（九字段，当前最终字节） | **1** | `AssertionError: 2 != 0`（`test_relay_log.py:1001`） |
| K-09 | 变异副本全量 54 tests | **1** | `FAILED (failures=1)`，仅目标测试红 |
| K-10 | 真实树全量复跑（还原验证） | **0** | `Ran 54 tests in 28.235s` / `OK` |
| K-11 | 隔离副本 PROBE F/G/H/I：detail-only、守卫删除、helper equality、两处新修复 | 见 §3 | 其中 **PROBE G 意外为 GREEN**，形成新 P2 |
| K-12 | `git diff --check`；`ls tools/relay-light/`；`git status --porcelain tools/` | 0 | 无 whitespace 告警；目录仅两个 py；本轮生成的 `__pycache__` 已精确删除 |

## 2. 逐条裁决

### 2.1 R2-P1-1（P1，Unicode 行分隔符使账本永久不可读）→ **闭合**

`read_ledger` 的切行口径由 `text.splitlines()` 改为 `text[:-1].split("\n")`（前置的「末行必须换行终止」闸保证 `text[:-1]` 只吃掉真正的尾 LF），写侧 `ensure_ascii=False` 保持不变。本轮真 CLI 往返：

| `--note` 含 | `add` | `status` | 可读记录数 | note 逐字保留 | 物理 LF | 裁决 |
|---|---|---|---|---|---|---|
| `U+0085` | 0 | **0** | 2 | 是 | 2 | 闭合 |
| `U+2028` | 0 | **0** | 2 | 是 | 2 | 闭合 |
| `U+2029` | 0 | **0** | 2 | 是 | 2 | 闭合 |

对照上一轮实测（三者 `status` 均退 4、`error: ledger line 2: invalid JSON`、其后每次 `add` 恒退 4）——失效路径已消失，`seq` 与物理行数重新一一对应，A38 / A56 的不变式恢复。判别力另由 PROBE I 证明：把切行改回 `splitlines()`，`test_unicode_line_separators_round_trip_as_json_string_content` 立即 exit 1（`AssertionError: 0 != 4`，行为断言）。**R2-P1-1 关闭。**

### 2.2 R2-P2-1（P2，stage-`failed` 重拉路径下 A58 重号 fail-open）→ **闭合**

attempt 基线由「该名字最近一条事件」改为「该 `(node, name)` 全部 `agent_launch` 的最大 attempt」，再取**最大实例**的最新状态判重拉资格。本轮把上一份报告的 exploit 原序列**逐条重放**（真 CLI，无改动）：

```
plan_loaded/node_start/agent_launch coder#1/checkpoint coder#1        rc=0
stage_result monitor#1  outcome=failed first                          rc=0
agent_launch coder#2                                                  rc=0   <- 合法重拉
checkpoint   coder#1                                                  rc=0
stage_result monitor#1  outcome=failed second                         rc=0
agent_launch coder#2  (重号)  rc=2  error: HC-RL-A58 attempt for coder must increment by one
                              账本字节完全不变；launches == ['coder#1','coder#2']
agent_launch coder#3  (合法)  rc=0                                             <- 未过度收紧
```

上一轮同序列的结果是 `rc=0` 且落盘出现两条 `coder#2`。现已按 A58 拒绝、零写入，且合法的下一号 `coder#3` 仍被接受，说明修复没有把正常重拉一并堵死。判别力另由 PROBE I 证明：把基线改回「最新事件」，`test_attempts_are_per_node_and_only_relaunch_after_authorized_causes` 立即 exit 1（`2 != 0`）。**R2-P2-1 关闭。**

### 2.3 账本读侧无回归

| 场景 | `status` | `add` | 期望 | 结论 |
|---|---|---|---|---|
| 末行无换行（F-019 原场景） | 4 | 4 | 4 / 4 且不追加 | 无回归 |
| CRLF 账本（F-024 有意兼容） | **0** | — | 0 | 兼容保持，未擅自收紧 |
| 含坏 JSON 行 | 4 | 4 | 4 | 无回归 |
| 末尾多一空行 | 4 | — | fail-closed | 无回归 |

### 2.4 空 agent（F-040）/ A49（F-041）/ 编号断言 → **成立**

- **空 agent**：`lint` 对 `|  | W1 | coder | … |` 退 2、`lint: HC-RL-A24 line 11: agent is empty`；不再落到 A47 或被 `close=agent:` 误配。新守卫置于既有 `agent.node not in all_nodes` 同一位置，未改变 superseded 行的忽略语义。
- **A49**：新增「`coder#1` 仍活跃时启动 `coder#2`」反例，断言 `error: HC-RL-A49 ` 且账本字节不变；本轮读码确认新实现的判序为「先 A58 号次、后 A49 资格」，故该反例确实落在 A49 分支而非被 A58 代杀。
- **编号断言**：A68（重复 `node_close`）、A70（`on:done` 未满足，两处）、A74（close agent 为 `agent_lost`）、A77（无阻塞现场）、A78（依赖未闭合）各自补了唯一负责的 `^error: HC-RL-Axx ` 断言；本轮 K-08/K-09 的变异即验证了 A74 一支的判别力。

### 2.5 `user_decision`（F-039）→ **成立且方向正确**

helper token 强制校验由 `{decision, user_decision}` 收回到 `decision` 单事件。本轮回到 design 原文核对，确认这是**修正而非放水**：

| design 出处 | 冻结样张 | 是否带 helper token |
|---|---|---|
| §9.3 strategist 链 | `user_decision coder#1 note=用户裁决：继续，按 strategy.1.md 收窄本卡范围` | **否** |
| §9.4 改计划同意 | `user_decision coder#1 note=approve-amend: 用户同意 decision.2.md（含改计划）` | **否** |
| §9.4 改计划否决 | `user_decision coder#1 note=reject-amend: 不拆步，先按原 task_plan …` | **否** |

即：旧实现会让 design 自己的三张冻结样张全部退出 2。本轮真 CLI 复核三种样张 note 均 `rc=0`，随后 `resume` 亦 `rc=0`；同时**归属闸仍在**——用 `decider#1` 冒写 `user_decision` 一律 `rc=2 error: HC-RL-A69` 且零写入。A69 的「怎么证明」只要求「升级链断言三条事件的 `agent` 字段」，该要求未被削弱。另由 PROBE H 证明 F-035 的判别器未被此次放宽带走：把 `decision` 的 helper equality 比较失效后，`test_decision_repeats_helper_while_user_decision_uses_frozen_note_shape` 仍 exit 1（`2 != 0` ×2）。

### 2.6 detail-only 回归（F-042）→ **正向成立，但见 §4 新增 P2**

隔离副本上只改 4 处非冻结诊断文案（`cannot read relay_plan.md` / `first line must be…` / `last ledger line is not newline-terminated` / `cannot append relay_log.jsonl`），三个目标测试仍 **exit 0**——合法改写 message 不再造假红，教训候选闭合方向正确。

## 3. 有效单测·变异点（九字段 · 对当前最终字节复验）

| 字段 | 值 |
|---|---|
| **1. 变异点锚点** | `tools/relay-light/relay_log.py:693`，`_validate_node_close()` 的 `close` 分支（HC-RL-A74 判据）。**锚点随本次返工由 :679 位移到 :693，语句本身逐字未变**；同函数 :688 的条件 1 判据形近，本次仍只动 :693 |
| **2. 原值 → 变异值** | `if latest is None or latest["event"] != "done":` → `if latest is None or latest["event"] not in TERMINAL_EVENTS:` |
| **3. 语义类别** | 语义型 · 判据放宽：把 §5.3「条件 2 只认 `done`，`agent_lost`/`cancelled` 不满足」放宽为「任意终态皆可」。非 fixture / 非 setup / 非 import / 非语法变异；变异后模块正常导入并执行到行为分叉点 |
| **4. 对应测试 ID** | `test_relay_log.RelayPlanLintTests.test_node_close_requires_all_terminals_and_configured_agent_done`（红点 `test_relay_log.py:1001`，本次返工后该断言旁另加了 `^error: HC-RL-A74 ` 直证） |
| **5. 运行命令** | 施加：`scratchpad/mut2/` 下 `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayPlanLintTests.test_node_close_requires_all_terminals_and_configured_agent_done -v`，再 `… -m unittest test_relay_log.py`；还原：真实树 `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py` |
| **6. 施加 hash** | 变异副本 `relay_log.py` sha256 `1c0b66b9c1800b0ec0569e9751d57ca4f96f41ac31e2e794e19674e3a8556c25`；测试文件未改（sha256 `4c5a58c7efe4848172655457a75507f23b61894dac2d15401a82161ce714da73`）；`diff -u` 对真实文件恰 1 行差异 |
| **7. 还原 hash** | 真实树 `relay_log.py` sha256 `f484ffba38504424d5be3c3080b71d83186e31c0d5c6b6e5ed01cbbf117ceb1e`，本轮全程未被写过（变异只施加在 scratchpad 隔离副本）；还原验证 = 真实树全量 54 tests **exit 0 / `OK`** |
| **8. 登记人** | `rlt03-code2-opus`（Claude Opus 5，`review_path_id=code_round_2`，派出证据 E-056） |
| **9. 施加后结果** | 目标测试 **exit 1**：`AssertionError: 2 != 0` @ `test_relay_log.py:1001` `self.assertEqual(2, lost_close_agent.returncode)`——close agent 为 `agent_lost` 时变异实现错误放行 `node_close`。**红因是行为断言（退出码失配），非 fixture/setup/import/TypeError/崩溃**。全量 54 tests 在变异副本上 **exit 1、`FAILED (failures=1)`，仅该项红**，无次生误杀；真实树复跑 **exit 0 / `Ran 54 tests in 28.235s` / `OK`** |

**结论**：原九字段变异点在**当前最终字节**上仍然成立——改坏必红、且红在行为断言；还原即绿。

## 4. 本轮新增 finding

### R2R-P2-1（新，测试网缺口，非代码缺陷）｜F-019 的「末行必须换行终止」闸现在**没有任何测试能杀死它**

**事实**：本轮把该闸整段删除后跑**全量 54 tests → exit 0 / `OK`**，无一红。

**为什么会退化**：本次返工两处改动叠加造成——
1. F-037 把读侧改成 `text[:-1].split("\n")`。删掉闸之后，未换行终止的账本会被 `text[:-1]` **吃掉最后一个字符**，末行多半随之变成坏 JSON，于是仍然退 4；**返回码不再具判别力**（旧实现用 `splitlines()` 时删闸会让它退 0，返回码本身就能杀）。
2. F-042 把该测试的 stderr 断言由精确文案收窄为 `r"^error: ledger "`；两条 4 号错误共用同一前缀，**消息也不再具判别力**。

**这个闸是真承重的**（本轮实证，隔离副本对比）：

| 生产版本 | 账本末行形态（均无尾 LF） | `add` | 物理行 | 两条记录被粘在一行 |
|---|---|---|---|---|
| 真实树（闸在） | `…}` | 4 | 1 | 否 |
| 真实树（闸在） | `…} `（尾随空格） | 4 | 1 | 否 |
| 删闸副本 | `…}` | 4 | 1 | 否 |
| 删闸副本 | `…} `（尾随空格） | **0** | **1** | **是 —— F-019 的粘行损坏原样复现** |

即：末行以空白结尾时，`text[:-1]` 砍掉的是空格、JSON 依然合法 → 读通过 → 追加落在同一行尾 → 两条记录粘死。**当前发布的代码是正确的**（闸在，四种形态全部退 4），所以这不是新的 P0/P1 代码缺陷；但一条 P1 级修复（F-019）目前**零回归保护**，后续任何人重构 `read_ledger` 都不会被测试拦住。

**建议闭合方式（不由本轮实施，成本极低）**：在 `test_non_newline_terminated_ledger_is_rejected_without_append` 中恢复一处**稳定语义**断言——例如断言 stderr 含 `newline`，或增加「末行以空格结尾且无 LF」这一形态并断言 `add` 退 4 且账本字节不变（后者不依赖任何 detail 文案，与 F-042 的收窄方向不冲突）。

**级别**：P2（质量 / 证据缺口）。按本轮准入口径「无新增 P0/P1 才可批准」，**不构成阻塞**。

### 观察项（不计 finding）

- `_validate_agent_transition` 中新增了一行 `assert prior is not None`。本轮核过：`prior_attempt` 取自已存在的 `agent_launch`，`_latest_for_instance` 必然至少命中该行，故 `prior` 恒非 `None`；`python -O` 剥离该 assert 也不改变行为。属防御性写法，不影响合同。
- 空 agent 名的新闸位于 `agent.node not in all_nodes` 同一段落（superseded **行**已在其前 `continue`），未新增对 superseded 行的敏感性，A128 四例外口径不受影响。

## 5. 结论

**代码轮 2：APPROVE（closeout-rework=1 通过）**

- 上一份报告的 **R2-P1-1（P1）闭合**、**R2-P2-1（P2）闭合**，两者均由本轮真 CLI 原序列重放与定向变异独立复算，不采信自述。
- 顺带回归五项（`user_decision` 冻结样张 / 空 agent / A49 / 编号断言 / detail-only）**全部成立**，且 F-035 判别器未被 `user_decision` 放宽带走。
- 原有效单测九字段在**当前最终字节**仍为**行为断言红**（`2 != 0`，全量仅此一红），真实树还原**全量 54 tests exit 0 / OK**。
- 本轮**新增 0 个 P0 / 0 个 P1**；唯一新增为 R2R-P2-1（P2 测试网缺口，建议随后补一条不依赖 detail 文案的断言）。

### 另列：non-code blocker（**不计入代码轮 2 失败**，需主控/用户在流程侧裁决）

> 以下三项都不是 `relay_log.py` / `test_relay_log.py` 的行为缺陷，本轮不将其混入代码结论；但它们在本卡收口前仍未消解。

| # | 事项 | 性质 | 现状 |
|---|---|---|---|
| NB-1 | **HC-RL-A5 取证文字 vs `lint` 退出码** —— A5 明文把「节点号重复」列为「解析失败 → 三命令均退 3」的取证例，实现按 §3.1/§3.5 让 `lint` 走 `lint: HC-RL-A46` + 退 2 | **设计文本自相矛盾**，须改 A5 文字或改 lint 行为，二选一 | `findings.md` F-016 仍 open；本轮复核确认 A5 作为 RLT_03-owned 项其取证文字至今未被满足、也未被正式改写 |
| NB-2 | **design §3.5 与 §11 对 A129 是否含 §4.5 表尾豁免的文本分歧** | 设计文本分歧，放宽归 RLT_09/A120 | F-003 仍 open；本卡按 §11 严格执行，须 RLT_09 显式反转 |
| NB-3 | **打包越界**：施工提交 `b7f4ecc` 把 5 个 `dh:allowed-paths` 之外的 design/dev_plan 文件打进 `feat(relay-light): implement RLT_03 plan and ledger core` | 流程 / 提交组织，非代码 | 内容变更本身为用户 2026-09-10 明文授权（RLT-A-04/RLT-B-04）；建议收口 squash 前拆成独立 `docs(relay-light):` 提交或在收口说明显式登记 |
| NB-4 | `.gitignore` 未覆盖 `__pycache__`（F-008） | 收口卫生 | 本轮复现：跑一次测试即出现 `?? tools/relay-light/__pycache__/`，`git check-ignore` 返回 1；本轮已精确删除，收尾 `git status` 中 `tools/` 仅两个 py 文件的既有改动 |

本轮未改任何代码与既有工件，唯一写入为本文件。
