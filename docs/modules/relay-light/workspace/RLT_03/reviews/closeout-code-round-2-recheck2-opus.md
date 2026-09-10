<!-- dh:v1 -->
# closeout-code-round-2-recheck2-opus — RLT_03 heavy 代码轮 2 · F-043 与最终字节有效性 fresh 复核

## 0. 本轮身份与范围

| 项 | 值 |
|---|---|
| `review_path_id` | `code_round_2`（同路径 **fresh 独立** 复核，非新路径） |
| 派出证据 | E-058（`progress.md`：`rlt03-code2b-opus｜RLT_03 F-043 trailing-space no-LF guard and final-byte mutation recheck`） |
| pane / session | `TMUX_PANE` / `TMUX` 未设置；Claude Code 会话 `session_01T9W9SPPXGjdcDucRXeTtsK`；`HERDR_AGENT` / `RELAY_RECEIPT` 未注入本进程环境 |
| 自报实际模型 | Claude Opus 5（`claude-opus-5`） |
| 自报启动形态 | Claude Code CLI worker，**fresh context**（未继承 `closeout-code-round-2-opus.md` / `-recheck-opus.md` 的会话）；未加载 skill、未派子 agent、未询问用户 |
| branch / HEAD | `wt/RLT_03` / `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc`（无新提交） |
| 工作树 | `/home/nash/work/dh-relay/.dh-worktrees/RLT_03` |
| 复核对象 | 工作树两条 Python 的**最终字节**；`findings.md` F-043（`resolved-pending-recheck`）；`progress.md` E-057 |
| 复核范围（仅此三问） | ① F-043 新增「trailing-space + no-LF」子场景是否真能杀死删/坏 guard，且红在行为断言；② 原代码轮 2 的 A74 有效 mutation 在**当前最终字节**上是否仍被杀死；③ 真实树全量 54 tests 是否绿 |
| 本轮写权限 | 仅本文件。未改生产代码 / 测试 / `findings.md` / `progress.md` / `review.md` / 既有 review；未 commit、未 push |
| 隔离目录（保留供主控后验，本轮未清理） | `/tmp/rlt03-code2-final.qSAu1u/`（`mutA/` `mutB/` `mutC/` `probe/` `probe_guard.py` `probe_guard_nodestart.py`） |
| 运行环境 | Python 3.12.3；全部命令带 `PYTHONDONTWRITEBYTECODE=1`，未生成 `__pycache__` |

**证据姿势**：`findings.md` F-043 的处理栏、`progress.md` E-057 一律**只当待验命题**，不当闭合证据。下列结论全部由本轮在隔离副本上自行施加变异 + 真 CLI 复算得到。

### 0.1 最终字节 SHA256（本轮全部结论所锚定的版本）

| 文件 | SHA256 | 大小 |
|---|---|---|
| `tools/relay-light/relay_log.py` | `f484ffba38504424d5be3c3080b71d83186e31c0d5c6b6e5ed01cbbf117ceb1e` | 32653 B |
| `tools/relay-light/test_relay_log.py` | `8c2098fcb0e59bb18dcaa9a6912da2373d71b315252fa32a85c531a7e2300dbd` | 59420 B |

两个 hash 在本轮**全量测试前后各取一次、完全一致**，说明本轮跑的就是这份最终字节，且本轮全程未写过这两个文件。

> **进场时观察到的并发写入（记录，不裁决）**：本轮进场首测 `test_relay_log.py` 为 `263b168fd13bd94c07ef148611d8341c810fa41aa8b81be981cecc956a76af01`（`mtime 18:25:54` 之前）；随后该文件被本轮以外的写入者更新为上表的 `8c2098f…`，新增两处 detail 解绑（`:178` `^error: HC-RL-A18 marker cards=` → `^error: HC-RL-A18 `；`:746` `^error: ledger line 1: ` → `^error: ledger ` 且**新增零写入断言**）。本轮所有裁决均基于 `8c2098f…` 这份最终字节。`relay_log.py` 自始至终为 `f484ffb…`，未被改动。

## 1. 命令与退出码（本轮亲自执行，逐条可复现）

| # | 命令（工作目录） | 退出码 | 关键输出 |
|---|---|---|---|
| N-01 | `git rev-parse --abbrev-ref HEAD` / `HEAD` / `git status --porcelain` / `git diff --stat`（worktree） | 0 | `wt/RLT_03` / `e4b4cd6…`；`tools/` 下仅两条 py 改动 |
| N-02 | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py`（进场基线，worktree） | **0** | `Ran 54 tests in 39.374s` / `OK` |
| N-03 | 建 `mutA/ mutB/ mutC/` 三份隔离副本并施加变异（`/tmp/rlt03-code2-final.qSAu1u`） | 0 | 三份 anchor 断言均命中且唯一；`diff -u` 对真实文件各恰 1 处差异 |
| N-04 | mutA 目标测试 `…test_non_newline_terminated_ledger_is_rejected_without_append -v` | **1** | `FAILED (failures=1)`，`AssertionError: 4 != 0` @ `test_relay_log.py:666`，子场景 `trailing_bytes=b' '` |
| N-05 | mutA 全量 `python3 -m unittest test_relay_log.py` | **1** | `Ran 54 tests in 28.394s` / `FAILED (failures=1)`，仅目标测试红 |
| N-06 | mutB 目标测试（同上） | **1** | `FAILED (failures=2)`，两个子场景 `b''` 与 `b' '` 均 `AssertionError: 4 != 0` @ `:666` |
| N-07 | mutC 目标测试 `…test_node_close_requires_all_terminals_and_configured_agent_done -v` | **1** | `AssertionError: 2 != 0` @ `test_relay_log.py:1011` |
| N-08 | mutC 全量 `python3 -m unittest test_relay_log.py` | **1** | `Ran 54 tests in 27.486s` / `FAILED (failures=1)`，仅目标测试红 |
| N-09 | 真 CLI PROBE：真实树 / mutA / mutB × 两种末行形态 × 合法与非法后继事件（`probe_guard.py`、`probe_guard_nodestart.py`） | 0（脚本自身） | 见 §2.2 |
| N-10 | 真实树全量复跑（还原验证，worktree） | **0** | `Ran 54 tests in 28.058s` / `OK` |
| N-11 | `sha256sum` 两条 py（N-10 前后各一次）；`ls -a tools/relay-light/`；`git status --porcelain -uall tools/` | 0 | 两次 hash 一致；目录仅两个 py；无 `__pycache__`、无新增未跟踪物 |

## 2. F-043 裁决 —— **成立，可置 `resolved`**

### 2.1 变异 1（mutA）：**删除**末行换行 guard

变异体（对 `relay_log.py:433-434` 整段删除，隔离副本 sha256 `07a875de2ddc2539facbe0125df442965cfa5b6ce1022f2ffee2a10803f8b93d`）：

```diff
     if not text:
         return []
-    if not text.endswith("\n"):
-        raise _ledger_error("last ledger line is not newline-terminated")
```

结果：目标测试 **exit 1**，红点

```
FAIL: test_non_newline_terminated_ledger_is_rejected_without_append (trailing_bytes=b' ')
  File ".../test_relay_log.py", line 666, in ...
    self.assertEqual(4, status.returncode)
AssertionError: 4 != 0
```

- **红因类别**：`status` 子进程**退出码失配**的行为断言（期望 4，实得 0）。**不是** fixture 缺失、不是 `setUp` 崩、不是 `ImportError` / `ModuleNotFoundError`、不是 `TypeError`/`AttributeError`、不是语法错误——变异体正常导入并完整走完真 CLI 往返，只是在行为分叉点给出了错误结论。
- **判别力来源正是 F-043 新增的子场景**：`trailing_bytes=b''`（F-019 原形态）在 mutA 上**仍然 exit 4、依旧存活**（`text[:-1]` 砍掉末尾 `}` → JSON 变坏 → 仍退 4），只有新增的 `trailing_bytes=b' '` 把这条闸抓了出来。这与 R2R-P2-1 的诊断完全一致，且证明整改选的场景是**唯一有效**的那个。
- 全量 54 tests 在 mutA 上 **exit 1、仅此一红**，无次生误杀。

### 2.2 变异 2（mutB）：**破坏**（不删除）guard —— 改为静默补 LF

变异体（隔离副本 sha256 `2e49166189a6a898518153fa1b1cb59ab88a1114080d75e35f7078dfaf7fbc51`）：

```diff
     if not text.endswith("\n"):
-        raise _ledger_error("last ledger line is not newline-terminated")
+        text += "\n"
```

这是比整段删除更像真实重构的形态（"顺手容错"）。结果：目标测试 **exit 1**，**两个子场景同时红**，均为 `AssertionError: 4 != 0` @ `:666`（行为断言）。即该测试对"闸被弱化"也具判别力，不止对"闸被删除"。

### 2.3 这条闸确实承重（真 CLI 直接复现 F-019 的账本损坏）

`probe_guard_nodestart.py`：同一份合法 plan fixture，先写入一条 `plan_loaded`，人为去掉尾 LF（可选再加一个尾随空格），再跑 `status` 与一次**合法后继事件** `node_start`：

| 实现 | 末行形态（均无尾 LF） | `status` | `add(node_start)` | 物理行数 | 实际追加 | 两条记录粘死 |
|---|---|---|---|---|---|---|
| 真实树（闸在） | `…}` | **4** | **4** | 1 | 否 | 否 |
| 真实树（闸在） | `…} `（尾随空格） | **4** | **4** | 1 | 否 | 否 |
| mutA（删闸） | `…}` | 4 | 4 | 1 | 否 | 否 |
| mutA（删闸） | `…} `（尾随空格） | **0** | **0** | **1** | **是** | **是** |
| mutB（坏闸） | `…}` | **0** | **0** | **1** | **是** | **是** |
| mutB（坏闸） | `…} `（尾随空格） | **0** | **0** | **1** | **是** | **是** |

即：**当前发布的实现四种形态全部 fail-closed 且零写入**；一旦删/坏这条闸，F-043 描述的粘行损坏就在真 CLI 上原样复现（一次 `add` 退 0，两条 JSON 记录被写进同一物理行）。

> 附带更正一处细节（不影响任何结论）：`closeout-code-round-2-recheck-opus.md` §4 的对照表把删闸副本记为「`add` 退 0」。本轮实测，若后继事件是该测试实际使用的 `checkpoint`，删闸副本会先被 A60 状态机以 **exit 2** 拒绝，粘行不发生；只有换成**合法**后继事件（如 `node_start`）才 exit 0 并粘行。结论方向一致——闸承重、损坏可复现——只是触发它需要一条状态机允许的事件。**这不影响 F-043 整改的有效性**：该测试的红点落在更靠前、且不依赖后继事件合法性的 `status` 断言上（`4 != 0`）。

### 2.4 断言稳定性（与 F-042 方向不冲突）

新增子场景只冻结了三样东西：`status` / `add` 退 4、`stdout` 为空、`stderr` 匹配宽前缀 `^error: ledger `、以及**账本字节完全不变**。未绑定任何未冻结的诊断 detail 文案，因此合法改写 message 不会造假红，与 F-042 的收窄方向一致而非回退。

**F-043 裁决：整改有效，可由 `resolved-pending-recheck` 置为 `resolved`。** 本轮不代改 `findings.md`。

## 3. 有效单测·变异登记（九字段 · 对当前最终字节 `8c2098f…` 复验）

| 字段 | 值 |
|---|---|
| **1. 变异点锚点** | `tools/relay-light/relay_log.py:693`，`_validate_node_close()` 的 `if node.close:` 分支（HC-RL-A74 判据）。与原代码轮 2 登记的**同一目标、同一语句**；`relay_log.py` 自上轮以来字节未变，故锚点行号 `:693` 亦未位移。同函数 `:688` 的 A17 判据形近，本轮仍只动 `:693` |
| **2. 原值 → 变异值** | `if latest is None or latest["event"] != "done":` → `if latest is None or latest["event"] not in TERMINAL_EVENTS:` |
| **3. 语义类别** | 语义型 · 判据放宽：把 design §5.3「关闭条件 2 只认 `done`，`agent_lost`/`cancelled` 不满足」放宽成「任意终态皆可」。**非** fixture / setup / import / 语法变异；变异体正常导入并执行到行为分叉点 |
| **4. 对应测试 ID** | `test_relay_log.RelayPlanLintTests.test_node_close_requires_all_terminals_and_configured_agent_done`（红点 `test_relay_log.py:1011`，即 `self.assertEqual(2, lost_close_agent.returncode)`；其旁另有 `^error: HC-RL-A74 ` 直证断言） |
| **5. 运行命令** | 施加：`cd /tmp/rlt03-code2-final.qSAu1u/mutC && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayPlanLintTests.test_node_close_requires_all_terminals_and_configured_agent_done -v`，再 `… -m unittest test_relay_log.py`；还原：worktree 内 `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py` |
| **6. 施加 hash** | 变异副本 `relay_log.py` sha256 `1c0b66b9c1800b0ec0569e9751d57ca4f96f41ac31e2e794e19674e3a8556c25`（与上一轮同一变异的 hash 一致，佐证 `relay_log.py` 字节未变）；同副本 `test_relay_log.py` sha256 `8c2098fcb0e59bb18dcaa9a6912da2373d71b315252fa32a85c531a7e2300dbd`（= 最终字节，未改）；`diff -u` 对真实文件恰 1 行差异 |
| **7. 还原 hash** | 真实树 `relay_log.py` `f484ffba38504424d5be3c3080b71d83186e31c0d5c6b6e5ed01cbbf117ceb1e` / `test_relay_log.py` `8c2098fcb0e59bb18dcaa9a6912da2373d71b315252fa32a85c531a7e2300dbd`，本轮全程未被写过（变异只落在 `/tmp/rlt03-code2-final.qSAu1u/mutC/` 隔离副本）；还原验证 = 真实树全量 54 tests **exit 0 / `OK`**，且测试前后 hash 一致 |
| **8. 登记人** | `rlt03-code2b-opus`（Claude Opus 5，`review_path_id=code_round_2`，fresh context，派出证据 E-058） |
| **9. 施加后结果** | 目标测试 **exit 1**：`AssertionError: 2 != 0` @ `test_relay_log.py:1011`——close agent 处于 `agent_lost` 时变异实现错误放行 `node_close`。**红因是行为断言（子进程退出码失配），非 fixture/setup/import/TypeError/崩溃**。全量 54 tests 在变异副本上 **exit 1 / `FAILED (failures=1)` / 仅该项红**，无次生误杀；真实树复跑 **exit 0 / `Ran 54 tests in 28.058s` / `OK`** |

**结论**：A74 有效变异在**当前最终字节**上依旧成立——改坏必红、红在行为断言、还原即绿。测试文件在两次 recheck 之间发生过改动（`4c5a58c…` → `263b168…` → `8c2098f…`），该变异的判别力未被这些改动带走。

### 3.1 附加变异登记（F-043 专项，与上表并列）

| 字段 | mutA | mutB |
|---|---|---|
| 锚点 | `relay_log.py:433-434`（`read_ledger` 末行换行 guard） | 同上 |
| 原值 → 变异值 | 整段删除 | `raise _ledger_error(...)` → `text += "\n"`（静默补 LF） |
| 语义类别 | 语义型 · 删除 fail-closed 闸 | 语义型 · 闸弱化为容错 |
| 对应测试 | `test_non_newline_terminated_ledger_is_rejected_without_append` | 同左 |
| 施加 hash | `07a875de2ddc2539facbe0125df442965cfa5b6ce1022f2ffee2a10803f8b93d` | `2e49166189a6a898518153fa1b1cb59ab88a1114080d75e35f7078dfaf7fbc51` |
| 施加后结果 | 目标测试 exit 1，`AssertionError: 4 != 0` @ `:666`（子场景 `b' '`）；全量 54 exit 1，仅此一红 | 目标测试 exit 1，`4 != 0` ×2（`b''` 与 `b' '` 两子场景） |
| 红因类别 | 行为断言（退出码） | 行为断言（退出码） |
| 还原 | 真实树全量 54 tests exit 0 / `OK` | 同左 |

## 4. 真实树全量红绿摘要

| 项 | 结果 |
|---|---|
| 进场基线（N-02） | `Ran 54 tests in 39.374s` / `OK` / **exit 0** |
| 收尾还原（N-10） | `Ran 54 tests in 28.058s` / `OK` / **exit 0** |
| 变异体对照 | mutA 54/1 红、mutB 目标 2 子场景红、mutC 54/1 红——三者**均为行为断言红**，且**均只红目标测试** |
| 副作用 | 无 `__pycache__` 生成；`tools/` 未跟踪物为空；两条 py 的 hash 全程未变 |

## 5. 本轮新增 finding

**无。0 个 P0 / 0 个 P1 / 0 个 P2 / 0 个 P3。**

### 观察项（不计 finding，供主控知悉）

- **O-1｜复核期间测试文件被并发改动**：见 §0.1。两处新增改动（`:178`、`:746`）都是 detail 解绑方向，其中 `:746` 还补了零写入断言，未削弱 HC-ID + 退出码绑定；本轮全量绿即建立在这份最终字节上。但"复核进行中被写"本身不是好姿势——若收口前还有写入，本报告锚定的 `8c2098f…` 就不再是最终字节，需重跑一次。**建议主控在 squash 前用 §0.1 的两个 hash 做一次一致性核对。**
- **O-2｜上一份 recheck 报告 §4 的对照表有一处细节偏差**，已在 §2.3 更正；不影响其 R2R-P2-1 的结论方向，也不影响本轮裁决。
- **O-3｜前轮遗留的 non-code blocker（NB-1 A5 取证文字冲突 / NB-2 A129 §3.5 vs §11 分歧 / NB-3 打包越界 / NB-4 `.gitignore` 未覆盖 `__pycache__`）本轮范围外，未复核、未改变状态。**
- **O-4｜隔离目录按主控要求保留未清理**：`/tmp/rlt03-code2-final.qSAu1u/`，含三份变异副本、两份 probe 脚本与 probe 产生的 6 个临时 plan/ledger 目录，供后验。工作树内零残留。

## 6. 结论

**代码轮 2（同路径 fresh 复核）：APPROVE**

1. **F-043 可置 `resolved`**：新增的「末行尾随空格 + 无 LF」子场景对「删闸」与「坏闸」两种变异**都能杀死**，红点是 `status` 退出码失配的**行为断言**（`4 != 0`），非 fixture/setup/import/TypeError；且真 CLI 直接复现了闸失效后的 F-019 粘行损坏，证明这条闸承重、现在确有回归网。断言不绑定未冻结 detail 文案，与 F-042 方向一致。
2. **原 A74 有效变异在当前最终字节上仍被杀死**：目标测试 exit 1（`2 != 0` @ `:1011`），全量 54 tests 仅此一红，还原即全绿。
3. **真实树全量 54 tests 绿**（进场、收尾各一次，exit 0 / `OK`），实现与测试文件 SHA256 全程未变，见 §0.1。
4. **本轮新增 0 个 P0 / P1 / P2 / P3**；唯一需要主控动作的是 O-1 的收口前 hash 一致性核对。

本轮未改任何代码、测试与既有工件，唯一写入为本文件。
