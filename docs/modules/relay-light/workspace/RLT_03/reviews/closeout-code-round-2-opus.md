<!-- dh:v1 -->
# closeout-code-round-2-opus — RLT_03 heavy 代码轮 2 · fresh-context 独立复核

## 0. 本轮身份与运行环境

| 项 | 值 |
|---|---|
| `review_path_id` | `code_round_2` |
| 派出证据 | E-048（`progress.md`：`rlt03-code2-opus｜RLT_03 heavy code_round_2 fresh-context independent incremental review and mutation selection`） |
| pane / session | `TMUX_PANE` 未设置、`TMUX` 未设置（非 tmux/psmux pane 内进程）；Claude Code 会话 `session_01K5mNjEgj4A5nKWhkEpMdvn`；`HERDR_AGENT` / `RELAY_RECEIPT` 均未注入本进程环境，故无法自证 Herdr pane 归属，只按派活方名义登记为 `rlt03-code2-opus` |
| 自报实际模型 | Claude Opus 5（模型 ID `claude-opus-5`），非 Sonnet/Haiku 代跑 |
| 自报启动形态 | Claude Code CLI worker 实例，fresh context：本会话未参与任何批次施工与批次小审，未继承 code round 1 会话结论；未加载 dev-harness skill、未派子 agent、未询问用户 |
| branch / HEAD | `wt/RLT_03` / `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc` |
| 进场工作树状态 | `M docs/modules/relay-light/workspace/RLT_03/progress.md`（主控预置 E-047~E-051 派出登记）；`tools/relay-light/` 无未提交改动 |
| 运行环境 | Linux worktree `/home/nash/work/dh-relay/.dh-worktrees/RLT_03`，Python 3.12.3 |
| 读过的权威件 | 仓根 `AGENTS.md`；`workspace/RLT_03/brief.md`、`task_plan.md`、`execution_strategy.md`、`progress.md`、`findings.md`、`review.md`；`dev_plan/P1-RelayLight-开发方案.md` §RLT_03 与 §6 ID→卡对照；`design/01` §3.1–3.8、§4.1–4.5、§5.1–5.3、§11.1；`tools/relay-light/relay_log.py`、`test_relay_log.py` 全文 |
| 本轮写权限 | 仅本文件。未改任何生产/测试代码、`review.md`、`progress.md`、`findings.md`、DevPlan、design；未 commit、未 push |

**独立性声明**：本轮不把 batch-1~batch-4 任何一份 review 的 `APPROVE` 当作证据，只把它们当作「已落账的历史事实与待核清单」。下列结论全部由本轮自行跑命令、自行读设计条款得出。

## 1. 命令与退出码（本轮亲自执行）

| # | 命令 | 退出码 | 关键输出 |
|---|---|---|---|
| C-01 | `git rev-parse --abbrev-ref HEAD` / `git rev-parse HEAD` / `git status --porcelain` | 0 | `wt/RLT_03` / `e4b4cd6...` / 仅 `M progress.md` |
| C-02 | `python3 -m unittest tools/relay-light/test_relay_log.py`（进场基线） | 0 | `Ran 53 tests in 28.125s` / `OK` |
| C-03 | `python3 tools/relay-light/relay_log.py --help` | 0 | 子命令集合恰为 `{add,status,lint}` |
| C-04 | `grep -nE "\.lower\(\|\.casefold\(\|fcntl\|msvcrt\|filelock\|flock\|tempfile\|os\.replace\|shutil\.move\|pane" tools/relay-light/relay_log.py` | 1（零命中） | A39/A40/A41/A42/A51 静态守卫成立 |
| C-05 | `grep -n "open(" tools/relay-light/relay_log.py` | 0 | 唯一一处 `open(ledger_path, "a", encoding="utf-8", newline="")`，纯追加成立 |
| C-06 | 20 次真 CLI `add` + 每次前缀 md5 比对（scratchpad 隔离目录） | 全 0 | `lines=20`；`seq==[1..20]` 为 `True`；每次追加后旧字节前缀 md5 不变；目录只余 `relay_plan.md` + `relay_log.jsonl`，无临时文件 |
| C-07 | `add --node NOPE --event done --agent x#1`，stdout/stderr 分离捕获 | 2 | stdout 为空；stderr `error: HC-RL-A59 unknown or superseded node: NOPE` |
| C-08 | 变异副本目标测试（见 §3） | 1 | `AssertionError: 2 != 0`（行为断言红） |
| C-09 | 变异副本全量 53 tests | 1 | `FAILED (failures=1)`，仅目标测试红 |
| C-10 | `python3 -m unittest tools/relay-light/test_relay_log.py`（真实树复验） | 0 | `Ran 53 tests in 28.374s` / `OK` |
| C-11 | `git status --porcelain` / `git diff --stat tools/relay-light/` （收尾） | 0 | 生产与测试文件零改动；本轮只新增本文件 |
| C-12 | `git diff --name-only master...HEAD` / `git log --oneline master..HEAD -- .../design .../dev_plan` / `git diff --check` | 0 | 23 个文件，其中 **5 个在 RLT_03 允许路径之外**（design/dev_plan，全部来自施工提交 `b7f4ecc`）；`diff --check` 零告警 —— 见 R2-P2-3 |

**结论（可复算部分）**：brief 完成条件 10（20 次 add / seq 连续 / 旧行字节不变 / 无临时文件 / 无锁）、11（19 词表、大小写严格、无 lower/casefold）、16（错误仅进 stderr、统一 `error: <code> <message>`、add 0/2/3/4 可复现）本轮亲自复现成立。

## 2. Findings

> 级别沿用 `findings.md`：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞。
> 「新/旧」列标注本轮是否为**新增未落账**发现。

### R2-P1-1（新）｜`add` 可以以退出码 0 写出一条让账本永久不可读的行

**事实**：`append_event()` 用 `json.dumps(entry, ensure_ascii=False, ...)` 序列化，`read_ledger()` 用 `text.splitlines()` 切行。`ensure_ascii=False` 只转义 `< U+0020` 的控制字符，**不转义 `U+0085`(NEL) / `U+2028`(LS) / `U+2029`(PS)**；而 `str.splitlines()` **把这三个字符当行边界**。两者口径不一致。

**本轮实证**（scratchpad 隔离目录，真 CLI，`relay_log.py` 未改）：

| `--note` 中的字符 | `add` 退出码 | 落盘物理换行数 | 之后 `status` 退出码 | stderr |
|---|---|---|---|---|
| `U+0085` NEL | **0** | 2 | **4** | `error: ledger line 2: invalid JSON` |
| `U+2028` LS | **0** | 2 | **4** | `error: ledger line 2: invalid JSON` |
| `U+2029` PS | **0** | 2 | **4** | `error: ledger line 2: invalid JSON` |
| `U+000B` / `U+000C` / `U+001C`（对照组） | 0 | 2 | 0 | —（json 已转义，不受影响） |

`od -c` 复核：`"note":"before<342 200 250>after"` —— U+2028 以原始三字节写进了 JSON 字符串体内。写入后**后续每一次 `add` 也一律退出 4**（`read_ledger` 在追加前先读），即该计划目录的账本此后**只读不可写、且读也失败**。

**为什么是 P1 而不是 P3**：
1. 这与 `findings.md` F-019（末行无换行 → 追加粘行 → 永久损坏账本）**是同一失效类**，F-019 被 batch-2 复核定级 P1 并已修复（`read_ledger` 先拒非换行终止）；本变体是该修复**没覆盖到的另一半**——损坏不是来自外部脏账本，而是**本程序自己一次退出 0 的成功写入**。
2. 直接冲突的冻结口径：§3.7「任一时刻单写者 + 纯追加」与 A38「20 次 add 后行数恰为 20」——一次成功 `add` 使物理行数 +2 而 `seq` 只 +1，`seq = 读文件行数 + 1` 的不变式当场破裂；A56 的「退出 0 = 成功」语义也被破坏。
3. 账本是纯追加、无 rewrite/替换路径的设计（§3.7 明确不做临时文件替换），程序本身**没有任何修复入口**，实际后果等价于该 run 的账本数据丢失。
4. `note` 是 agent 自由文本（`checkpoint` 轮次、决策文件名、`stage_result` 原因摘要），由 LLM 生成或从网页/文档粘贴而来，含 `U+2028`/`U+0085` 并非臆造场景。

**修复方向（不由本轮实施）**：二选一即可闭合——(a) `append_event` 序列化后拒绝含 `U+0085`/`U+2028`/`U+2029` 的行并按 A63 退出 2 不落盘（与 F-019 的 fail-closed 姿势一致）；(b) 序列化改 `ensure_ascii=True`，或 `read_ledger` 改 `text.split("\n")` 使切行口径与写入口径严格对齐。任一方案都要补一条真 CLI 反例测试。

### R2-P2-1（新）｜A58「重号」闸在 stage-`failed` 重拉路径上 fail-open，同一 `(node, agent)` 可出现两条 `agent_launch`

**事实**：`_validate_agent_transition()` 取 attempt 基线用的是 `_latest_by_name()`——**该 agent 名在本节点的「最近一条事件」**，而 §3.5 冻结的是「该 `(node, 名字)` **已有最大 attempt** + 1」。两者只在「旧实例在新实例启动后仍写事件」时分叉；而 stage-`failed` 重拉路径**恰好允许旧实例停在非终态**（`agent_lost`/`cancelled` 会封口，`failed` 不会），于是分叉可达。

**本轮实证**（真 CLI，单节点 `C1`，agent 表只有 `coder`）：

```
plan_loaded   orchestrator#1  note=skill=0.1.0                        rc=0
node_start    monitor#1                                               rc=0
agent_launch  coder#1                                                 rc=0
checkpoint    coder#1                                                 rc=0
stage_result  monitor#1  note=stage_id=DHR_90:C#1 outcome=failed first rc=0
agent_launch  coder#2                                                 rc=0   <- 合法重拉
checkpoint    coder#1                                                 rc=0   <- 旧实例未封口，仍可写
stage_result  monitor#1  note=stage_id=DHR_90:C#1 outcome=failed second rc=0
agent_launch  coder#2                                                 rc=0   <- 重号被接受
```

落盘核对：`grep -o '"event":"agent_launch","agent":"[^"]*"'` → `coder#1` / `coder#2` / **`coder#2`**。

**违反哪条**：A58「`agent_launch` 的 attempt 必须恰为最大值 + 1，否则退出 2」（重号必拒）；连带 A50「配对键为 `(node, agent)`」——同一配对键出现两条 `agent_launch` 后，终态事件与哪一条配对不再唯一，`_validate_node_close` 的条件 1 也随之在同一 key 上重复判定。brief 完成条件 13 的「重号校验正确」因此**未真正成立**。

**测试侧同源缺口**：`test_relaunch_attempt_increment_is_exact_after_terminal_causes` 只走 `agent_lost`/`cancelled` 两条**会封口**的路径，此时 latest ≡ max，判别不出本缺陷；`test_attempts_are_per_node_and_only_relaunch_after_authorized_causes` 的 stage-`failed` 半段在**第一次** `coder#2` 成功后即结束，没有再探一次重号。即：把 `_latest_by_name` 换成「最大 attempt」或反之，现有 53 tests 都不会红。

**修复方向（不由本轮实施）**：attempt 基线改为对 `(node, name)` 的**全部 `agent_launch` 取 max(attempt)**；并补一条走 stage-`failed` 路径的重号反例（断言 rc=2 且 `error: HC-RL-A58 `、账本不增行）。是否同时对「旧实例在新实例启动后继续写事件」封口，属 §3.4 终态封口条款的解释边界，建议交主控/设计裁决，不要本卡顺手扩。

### R2-P3-1（新）｜`node_close` 不要求本节点有过 `node_start`，`node_start` 也可写在 `node_close` 之后

**事实**：`_validate_runtime_event` 的 `node_close` 分支只查「是否已 closed」+ 双判据；双判据在**零 `agent_launch`** 时空真。`node_start` 分支只查「是否已 start / 是否已有 agent_launch / 依赖是否全 closed」，不查是否已 closed。

**本轮实证**：`close` 列留空的节点 `C1`，在 `plan_loaded` 之后**直接** `node_close` → rc=0 落盘；另一例 `node_close` 之后再写 `node_start` → rc=0。

**定性**：§3.4/§5.3 的字面只写「`node_close` 仅在双判据成立时接受，每节点一次」，未把 `node_start` 列为前置，故**不构成对冻结条款的违反**；但它是一个 fail-open 口子——凭空 `node_close` 会直接满足下游 A78 的 `depends_on` 闭合闸。建议登记为设计补洞候选交 RLT_05（节点生命周期 owner），本卡不改。

### R2-P2-2（复核既有 open 项，非新增）｜A5 与 lint 退出码分流仍未裁决

A5 的「怎么证明」明文把**节点号重复**列为「解析失败 → 三个子命令均退出 3」的取证例；现实现对 `lint` 走 `lint: HC-RL-A46` + 退出 2（`test_runtime_plan_semantic_errors_map_to_exit_three_while_lint_is_two` 把这一取舍钉死），只有 `add`/`status` 退 3。这与 §3.1「lint：2 规则违反」和 §3.5 lint 映射表自洽，但与 A5 取证文字直接冲突。`findings.md` F-016 已登记该张力且状态 **open**。本轮独立复核确认：**A5 作为 RLT_03-owned 验收项，其取证文字至今没有被满足，也没有被正式改写**。收口前需要主控/设计给出裁决（改 A5 文字 或 改 lint 行为），不能以「已登记」直接算闭合。

### R2-P2-3（新）｜施工提交 `b7f4ecc` 把 5 个 `dh:allowed-paths` 之外的 design/dev_plan 文件打进了 `feat` 提交

**事实**：DevPlan 的 `<!-- dh:allowed-paths:v1 task=RLT_03 -->` 只授权三条路径（`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`docs/modules/relay-light/workspace/RLT_03/**`）。本轮 `git log --oneline master..HEAD -- docs/modules/relay-light/design docs/modules/relay-light/dev_plan` 显示，唯一触碰这两棵树的提交就是施工提交 `b7f4ecc feat(relay-light): implement RLT_03 plan and ledger core`，其中包含：

```
docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md            (+43/-…)
docs/modules/relay-light/design/drafts/A04-RLT03与RLT05验收边界修订候选.md   (新增 117 行)
docs/modules/relay-light/design/evidence/05-交叉审核记录-RLT03与RLT05验收边界.md (新增 87 行)
docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md                (+56/-…)
docs/modules/relay-light/dev_plan/drafts/RLT-B-04-RLT03与RLT05验收边界-调整候选.md (新增 77 行)
```

**与已落账自述的出入**：`progress.md` E-045 写「design/DevPlan 的 `M` 为主控预置 RLT-B-04 WIP，**本批未触碰、未 commit**」。「本批未触碰」这一半本轮无法证伪也无法证实（全卡只有一笔代码提交）；但「未 commit」这一半与仓库事实不符——这些改动确实随 `b7f4ecc` 一起进了历史。

**定性与建议**：RLT-A-04/RLT-B-04 的内容变更本身是**用户 2026-09-10 明文授权**的（DevPlan §「RLT-B-04 调整」），所以这不是未授权改设计；问题在于**打包方式**：越界文件被塞进一条 `feat(relay-light): implement RLT_03 plan and ledger core` 的提交里，使得 (a) 允许路径闸在 commit 层面失效，(b) 收口 squash 合并时 RLT_03 的代码变更与 RLT-B-04 的设计变更无法分账，(c) 后续按卡回溯 design/01 的改动会指向一条 `feat` 施工提交。建议主控在收口 squash 前**把这 5 个文件拆成独立的 `docs(relay-light): RLT-A-04/RLT-B-04 …` 提交**，或在收口说明里显式登记该合并事实。本轮只报事实，不动 git 历史。

### R2-P3-2（复核既有 open 项，非新增）｜`__pycache__` 仍未被 ignore

本轮跑一次 `python3 -m unittest tools/relay-light/test_relay_log.py` 后，`git status --porcelain` 立即出现 `?? tools/relay-light/__pycache__/`，`git check-ignore` 返回 1（未被忽略）。与 F-008 描述一致，仍 open。本轮已精确删除该目录，收尾 `git status` 中 `tools/` 干净。属收口卫生项，不阻塞代码结论。

### 本轮**没有**判为问题的项（避免下轮重复劳动）

- **完整 `status` 生命周期缺失**（A61/A62/A73/A85/A89/A92）：DevPlan §6 ID→卡对照明确归 RLT_05，`_status_command` 已有显式占位注释，本卡不实现是对的。
- **`decision_mode` 运行期分路、strategist 链全序、`user_decision` 必需性**：A114/A96 归 RLT_07、A97 归 RLT_05，本卡不实现是对的。
- **控制事件 `by` 法定写入者校验**：A85 归 RLT_05；现实现由 agent 前缀派生 `by`（F-020 已裁决），本卡不实现是对的。
- **`plan_loaded` 的 `config_dir=` / `plan=` 必填**：属 A99（RLT_05）；A18 在 RLT_03 只要求 `skill=`，现实现与 A18 取证文字一致。
- **attempt 上限 3、X 轮数止损**：归 RLT_05，本卡不实现是对的。
- **`plan_amend` 的 agent/note 校验**：归 RLT_09，本卡不实现是对的。
- **A24/A46/A47/A48/A72/A75/A87/A104/A109/A126/A128/A129/A130 lint 族**：本轮逐条对照 §4.1–4.4 与 §3.5 映射表读码，未发现规则缺失或编号错挂；退役编号 A64/A86/A88/A90 在 `tools/relay-light/` 零残留。
- **A69 决策链归属与 helper token**：`_validate_decision_helper` 的「恰好一个 token + 格式合法 + kind==实例名」三重校验与 §3.4 一致，反例覆盖充分。

## 3. 有效单测·变异点（九字段登记）

| 字段 | 值 |
|---|---|
| **1. 变异点锚点** | `tools/relay-light/relay_log.py:679`，函数 `_validate_node_close()` 的 `close` 分支（HC-RL-A74 判据）——**注意**同函数第 674 行存在形近的条件 1 判据，本次只动 679 行 |
| **2. 原值 → 变异值** | `if latest is None or latest["event"] != "done":` → `if latest is None or latest["event"] not in TERMINAL_EVENTS:` |
| **3. 语义类别** | **语义型 · 判据放宽**：把「关闭条件 2 只认 `done`」放宽为「任意终态（`done`/`agent_lost`/`cancelled`）皆可」，正是 §5.3「条件 2 只认 done，`agent_lost`/`cancelled` 不满足」与 A74 唯一咬住的那一点。非 fixture、非 setup、非 import、非语法变异；变异后模块可正常导入并执行到行为分叉点 |
| **4. 对应测试 ID** | `test_relay_log.RelayPlanLintTests.test_node_close_requires_all_terminals_and_configured_agent_done`（`test_relay_log.py:938`，红点在 `:951`） |
| **5. 运行命令** | 施加：隔离副本 `scratchpad/mut/` 下 `python3 -m unittest test_relay_log.RelayPlanLintTests.test_node_close_requires_all_terminals_and_configured_agent_done -v`，再 `python3 -m unittest test_relay_log.py`；还原：真实树 `python3 -m unittest tools/relay-light/test_relay_log.py` |
| **6. 施加 hash** | 变异副本 `relay_log.py` sha256 `808d05e14a76bd1907c9adc03df71f2e87752b9fe0fb6210af486c6c74626ba7`（测试文件未改，sha256 `1fbf726d3df31a3e898e6833729a550ad681ca5845cf4f236ac57a79dd93ba16`）；`diff -u` 对真实文件仅 1 行差异 |
| **7. 还原 hash** | 真实树 `relay_log.py` sha256 `e62ba2a073b1008b7a6da21506c9de4baad80f1e7e045d5454612bd14637ee8d`，全程未变（`git diff --stat tools/relay-light/` 为空）——**变异只施加在 scratchpad 临时隔离副本上，真实树自始至终未被写过**，故「还原」= 真实树哈希与进场一致，无需回滚动作 |
| **8. 登记人** | `rlt03-code2-opus`（Claude Opus 5，fresh context，`review_path_id=code_round_2`，派出证据 E-048） |
| **9. 施加后结果** | 目标测试 **exit 1**：`FAIL ... AssertionError: 2 != 0`，位置 `test_relay_log.py:951` `self.assertEqual(2, self.run_add("node_close", agent="monitor#1").returncode)`——即 `close=agent:checker` 而 `checker#1` 为 `agent_lost` 时，变异实现错误地放行 `node_close`（返回 0，应为 2）。**红因是行为断言（退出码失配），不是 fixture / setup / import / TypeError / 崩溃**。全量 53 tests 在变异副本上 **exit 1、`FAILED (failures=1)`，仅该项红**，无次生误杀。真实树复跑全量 **exit 0、`Ran 53 tests in 28.374s`、`OK`** |

**判别力结论**：A74（关闭条件 2 只认 `done`）这一条冻结判据被现有单测**真实咬住**，改坏必红、恢复即绿。

## 4. 全程与收口增量核对小结

| 核什么 | 本轮独立结论 |
|---|---|
| 允许路径纪律 | **不成立，见 R2-P2-3**：`git diff --name-only master...HEAD` 含 5 个 RLT_03 `dh:allowed-paths` 之外的 design/dev_plan 文件；工作树侧改动则均在允许路径内 |
| 施工者未自审 / 未 commit 越权 | 分支上仅 `b7f4ecc`（施工）与 `e4b4cd6`（draft PR 登记）两笔；`review.md` 全部仍为「待填/待审」，施工者未代填复核结论 —— 符合宪章 #4/#5 |
| 收口增量（batch-4 + RLT-B-04 窄返工 + P2 闭合） | E-044/E-045/E-046 记录的编号迁移（A64→A128、A86→A129、A88→A126、A90→A130）本轮 grep 复核：退役编号在 `tools/relay-light/` 零命中；空账本 pending 注释只余 A128/A84。**注**：全卡代码只有 `b7f4ecc` 一笔提交，按批的 diff 无法从 git 侧分离复核，E-046「本批零代码改动」只能按 `progress.md` 自述采信 |
| brief 16 组完成条件 | 条件 1~9、11、12、14、15、16 本轮读码 + 抽样 CLI 复核成立；**条件 10 成立但被 R2-P1-1 从另一侧击穿**（一次退出 0 的 add 可使物理行数与 seq 失配）；**条件 13 的「重号校验正确」不成立**（R2-P2-1）；条件 12 中 A5 的 lint 分支仍是 open 张力（R2-P2-2） |
| 「已落账 review 事实」复核 | F-019/F-025/F-026/F-027/F-028/F-033/F-034/F-035 声称的修复本轮抽查均在现码中实际存在（`read_ledger` 换行终止闸、`_validate_decision_helper`、`done` 前驱收紧、A17 点名反例），不是纸面闭合；F-003/F-007/F-008/F-010/F-016/F-017/F-024 仍 open，其中 F-016 与 F-008 本轮复现确认 |

## 5. 结论

**CHANGES_REQUESTED**

阻塞项（须闭合后方可进收口/待验收）：

1. **R2-P1-1**（P1）：`--note` 含 `U+0085`/`U+2028`/`U+2029` 时 `add` 退出 0 却把账本写成永久不可读（其后 `status`/`add` 恒退 4，纯追加设计无修复入口）。与已定级 P1 的 F-019 同类，须按 fail-closed 姿势补闸 + 补真 CLI 反例测试。
2. **R2-P2-1**（P2，但直接使 brief 完成条件 13 不成立）：stage-`failed` 重拉路径下同一 `(node, agent)` 可落两条 `agent_launch`，A58 重号闸 fail-open；须把 attempt 基线由「最近事件」改为「最大 attempt」，并补该路径的重号反例。
3. **R2-P2-2**（P2，需裁决而非编码）：A5 取证文字（节点号重复 → 三命令均退 3）与现实现 lint 退 2 仍冲突，F-016 至今 open；收口前需主控/设计明确改哪一边，不能以「已登记」当闭合。

4. **R2-P2-3**（P2，属流程/打包而非代码）：施工提交 `b7f4ecc` 把 5 个允许路径之外的 design/dev_plan 文件打进了 `feat` 提交，与 `progress.md` E-045「未 commit」的自述不符；建议收口 squash 前拆分提交或显式登记。

非阻塞项：R2-P3-1（`node_close` 无 `node_start` 前置，建议交 RLT_05 补洞）、R2-P3-2（`__pycache__` 未 ignore，收口卫生）。

有效单测要求：**已满足**——变异点 `relay_log.py:679`（A74 判据放宽）在隔离副本上使 `test_node_close_requires_all_terminals_and_configured_agent_done` 因行为断言 `2 != 0` 转红（目标测试与全量均 exit 1，仅该项红），真实树复跑 53 tests exit 0 `OK`。

本轮未改任何代码与工件，唯一写入为本文件。
