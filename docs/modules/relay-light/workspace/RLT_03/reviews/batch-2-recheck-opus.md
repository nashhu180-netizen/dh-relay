<!-- dh:v1 -->
# RLT_03 · batch 2 rework=1 独立只读复验

## 复验者登记

| 项 | 值 |
|---|---|
| 角色 | batch 2 **rework=1 独立只读复验** worker（非主控、非施工者） |
| Session ID | `session_01GLoSNPnXyTjTh2edxTAYTw`（与 `reviews/batch-2-opus.md` 同一会话，本轮为**同一审核者的返工复验**，非 fresh 换人；如需 fresh 独立性请由主控另开实例） |
| 启动形态（主控给定） | `claude --model opus`；pane `w15:p6` |
| 自报实际模型 | 系统提示自述为 **Opus 5 / `claude-opus-5`**。此为**进程内自述**，本会话无法自外部核验；`--model opus` 的实际路由**待主控在 pane 侧核对**。 |
| 复验时间 | 2026-09-10 |
| 复验范围 | **仅 batch 2 rework=1**。不复核 batch 3、不改生产代码、不改 DevPlan / `progress.md` / `findings.md` / `review.md`。**唯一写入 = 本文件**，未覆盖 `reviews/batch-2-opus.md`。 |
| 只读约束执行情况 | 探针与变异实验全部在会话 scratchpad 的**副本**（`$SCRATCH/rc`、`$SCRATCH/m2`）上做，仓内两条 `.py` 字节未动。本会话跑测试生成的 `tools/relay-light/__pycache__/*.pyc` 已清除，工作树复原。 |
| 加载边界 | `AGENTS.md`、`brief.md`、`task_plan.md`、`progress.md`、`findings.md`、`reviews/batch-2-opus.md`、DevPlan §RLT_03 与归属表、design/01 §3 / §11.1、两条 Python。**未加载 dev-harness skill、未派活、未回头问用户。** |

## 审阅基线

| 项 | 值 |
|---|---|
| worktree / 分支 | `/home/nash/work/dh-relay/.dh-worktrees/RLT_03` · `wt/RLT_03` |
| HEAD | `baf2aad6aa5cf5b8fc0941411bbb30a0ebac8a6b`（= baseline `master@baf2aad6`）；`git rev-list --count master..HEAD` = **0**（本卡零提交） |
| 受审对象 | `tools/relay-light/relay_log.py`（530 → **536** 行）、`tools/relay-light/test_relay_log.py`（486 → **609** 行），均未跟踪 |
| 施工方自述 | `progress.md` E-016~E-020；`findings.md` 新增 F-016~F-021 |
| 前轮结论 | `reviews/batch-2-opus.md` — changes-requested，P0=0 / **P1=1** / **P2=6** / P3=5 |

---

## 结论（先给）

# **approved**（针对 batch 2 rework=1 的范围）

| 计数 | 本轮 |
|---|---|
| 前轮 P1 闭合 | **1 / 1** |
| 前轮 P2 闭合 | **6 / 6**（其中 P2-3 的实现侧闭合，冻结文档自相矛盾按 F-016 挂账给主控） |
| 前轮 P3 处理 | 闭合 2（P3-2 / P3-3）、按授权边界登记 open 2（P3-1 / P3-4）、中性事实 1 无需动作 |
| 本轮新增 R-P0 | **0** |
| 本轮新增 R-P1 | **0** |
| 本轮新增 R-P2 | **0** |
| 本轮新增 R-P3 | **3** |

---

## 复跑命令与实测（本复验亲自执行）

```bash
cd /home/nash/work/dh-relay/.dh-worktrees/RLT_03

git rev-parse HEAD                    # baf2aad6...（零提交）
git status --short                    # M DevPlan（主控预置）；?? workspace/RLT_03/；?? tools/relay-light/
git diff --check                      # exit 0
python3 -m py_compile tools/relay-light/relay_log.py tools/relay-light/test_relay_log.py   # exit 0

python3 -m unittest tools/relay-light/test_relay_log.py -v
#   → Ran 29 tests in 3.739s / OK / exit 0        ← 与 E-018 自述一致（23 → 29，+6 条）

grep -oE 'HC-RL-A[0-9]+' tools/relay-light/*.py | sort -u
#   → 生产 18 / 测试 17，逐条对 DevPlan 归属表核验：**全部归 RLT_03**，无 A89/A116/A120

strace -f -e trace=openat,flock,fcntl,rename,unlink,ftruncate python3 .../relay_log.py add ...
#   → 仍只有两次 openat：O_RDONLY 与 O_WRONLY|O_CREAT|O_APPEND；无 flock/fcntl 锁、无 rename/unlink/ftruncate
```

### 新增的 6 条测试（23 → 29）

`test_by_is_derived_from_agent_prefix_without_event_ownership_validation`、`test_add_reports_genuine_append_failure_as_exit_four`、`test_non_newline_terminated_ledger_is_rejected_without_append`、`test_runtime_plan_semantic_errors_map_to_exit_three_while_lint_is_two`、`test_ledger_read_rejects_extra_keys_and_noncontinuous_seq`、`test_static_forbidden_primitive_and_pane_guards`；原 `test_add_reports_write_failure_as_exit_four` 已正名为 `..._ledger_read_failure_...`，两条分支现在**各有其名、各有其测**。

---

## 前轮 findings 逐条闭合表

| 前轮编号 | 级别 | 结论 | 本复验的独立证据 |
|---|---|---|---|
| **P1-1** 尾行未换行 → status 放行 → add 粘坏账本 → 永久不可读 | P1 | **已闭合** | `relay_log.py:421-422` 加入 `if not text.endswith("\n"): raise _ledger_error(...)`。实测同一份去掉行尾 `\n` 的账本：`status` / `status --json` / `add` **三者全 rc=4** + `error: ledger last ledger line is not newline-terminated`，stdout 空；**add 后文件 sha256 与字节数完全不变**（142 → 142 字节，未写入）。`lint` 不读账本、仍 rc=0，边界正确。两个变异（整段删除闸门 / 闸门改成 `pass`）**均转红**。修法与本审建议一致：fail-closed 在读侧，不引入锁 / 临时文件 / 覆盖写。 |
| **P2-1** `by` 由 event 反推、写出自相矛盾行、架空 RLT_05 的 A85/A93 | P2 | **已闭合** | 新增 `_writer_from_agent(agent)`（`:451-452`），`by` 改由 **agent 前缀**派生。实测六行：`plan_loaded`+`monitor#7`→`by=monitor`；`stage_start`+`orchestrator#1`→`orchestrator`；`checkpoint`+`orchestrator#2`→`orchestrator`；`done`+`builder#1`→`monitor`；**前缀必须精确带 `#`**——`orchestratorX#1` 与 `orchestrator-helper#1` 均→`monitor`（无误判）。行内 `agent` 与 `by` 不再互相打脸，A85「越权」在数据上重新可发生、可校验。两个变异（`by` 固定 monitor / 退回 event 派生）**均转红**。测试名明写 `without_event_ownership_validation`，**诚实声明未提前实现 A85**，与 F-020 一致。 |
| **P2-2** exit 4 只由「读账本失败」证出，真正的写入失败分支零测试 | P2 | **已闭合** | 新增 `test_add_reports_genuine_append_failure_as_exit_four`，用 `mock.patch("builtins.open")` 精确命中 `append_event` 的写句柄（`Path.read_text` 走 `io.open`，不受该 patch 影响，故计划读取仍正常）——断言 `rc=4`、`error: ledger cannot append relay_log.jsonl:`、**且账本文件未被创建**。本复验另用**不打桩的真实场景**（只读目录）独立复核到同一分支与同一消息，确认该测试不是靠 mock 造出来的假分支。变异「写入分支 exit 4 → 2」**转红**（前轮此变异存活）。读分支测试已正名并保留，两条 4 各有归属。 |
| **P2-3** `_runtime_plan` 的 3 重映射零测试；lint 2 与 add/status 3 分裂 | P2 | **实现侧已闭合；文档口径按 F-016 挂账** | 新增 `test_runtime_plan_semantic_errors_map_to_exit_three_while_lint_is_two`：节点号重复 → `lint` rc=2 + `lint: HC-RL-A46`，`status`/`add` rc=3 + `error: HC-RL-A46`。本复验另取一条**不同的** lint 规则复核（`close=all_agents_done`）：`add` rc=3 + `error: HC-RL-A47`，说明重映射是通用的、不是对 A46 特判。变异「删掉重映射」**转红**（前轮存活）。**HC-RL-A5（节点号重复→三命令退 3）与 HC-RL-A120（同情形断言退 2）的互斥文字仍未裁决**，施工方按边界记入 `findings.md` **F-016 (open)** 交主控/设计侧，**未擅自改设计**——这是正确处理。 |
| **P2-4** 读侧「七键精确」与「seq 连续」零测试、变异存活 | P2 | **已闭合** | 新增 `test_ledger_read_rejects_extra_keys_and_noncontinuous_seq`（两个 subTest：多一个 `pane` 键 / `seq=2` 起始），均断言 `status` rc=4 + `error: ledger line 1: `。两个变异（七键精确→超集 / 删 seq 连续性）**均转红**（前轮均存活）。本复验 8 种坏账本变体复跑：**8/8 → exit 4**。 |
| **P2-5** A40/A42/A51/A39 的静态检查只在 progress 的一次性 grep 里 | P2 | **已闭合** | 新增 `test_static_forbidden_primitive_and_pane_guards`：读自身模块源码，对 `.lower(` / `.casefold(` / `fcntl` / `msvcrt` / `filelock` / `flock` / `lockf` / `tempfile` / `mkstemp` / `os.replace` / `os.rename` / `shutil.move` / `.write_text` 逐条 subTest 断言零命中，另断言源码无 `"pane"`。**静态检查从此是可执行回归网，不是一次性命令。** 三个注入变异（`import fcntl` / `event.lower()` / `import os  # os.replace`）**全部转红**。`strace` 复核：全程仍只有 `O_RDONLY` 与 `O_WRONLY\|O_CREAT\|O_APPEND`，无锁、无 rename/unlink/ftruncate。 |
| **P2-6** A84 只证一半：「所有节点 pending」无实现无断言 | P2 | **已闭合（最小实现，未越界）** | `_status_command`（`:497-500`）在**账本为空**时输出 `pending_nodes` = 全部非 superseded 节点。实测：无账本文件 / 零字节文件均得 `{"current_stage": null, "current_node": null, "pending_nodes": ["W1","C1"]}`；含 superseded W1 的计划得 `["W2","C1"]`（正确排除）。测试断言三项齐（两个 `null` + `pending_nodes`）。变异「pending_nodes 恒为 []」**转红**。**未引入 batch 3 状态机**：生产代码里仍无 attempt、无 `(node,agent)` 状态机、无 `last_event` / `closable` / 终态封口，批 3 的 12 条 HC-ID 在两文件中零出现。 |
| **P3-1** `error:` 通道的 `arguments` / `ledger` 不是 HC-ID | P3 | **登记 open（F-017），行为未变** | 实测仍为 `error: arguments ...` / `error: ledger ...`。A63 只冻结**格式**，本批合规；编号来源问题按边界交主控/RLT_10 A94 裁决。**不擅改 code 命名是正确的收敛。** |
| **P3-2** A51 pane 断言只查最后一行顶层键 | P3 | **已闭合** | 20 行**逐行**对完整 JSON 文本断言无 `pane`（含值层），另加生产源码 `"pane"` 静态 guard。变异「多写第八键 pane」**转红（3 处断言同时失败）**。本复验独立复算 20 行含值层无 `pane`。 |
| **P3-3** 测试文件 docstring 仍写 Batch-1 | P3 | **已闭合** | 首行现为 `"""Batch-1 and batch-2 acceptance tests for relay-light plan and ledger contracts."""` |
| **P3-4** `__pycache__` 未 ignore | P3 | **仍 open（F-008），非本卡权限** | `.gitignore` 复核确认仍无 `__pycache__` / `*.pyc` 条目。**收口硬提醒不变**：`git add tools/relay-light/` 会带入 `.pyc`，需主控补 ignore 或逐文件 add。本复验自己生成的两条 `.pyc` 已清除。 |
| **P3-5** ts 微秒 / 并发未撞号（中性事实） | P3 | 无需动作 | 事实未变，设计本就单写者无锁。 |

---

## 本轮新发现

### R-P0（阻塞发布 / 数据丢失 / 安全）：**0 条**

无。返工只增了三处读侧闸门、一处 `by` 派生源、一处空账本 `pending_nodes` 与一条静态守卫测试；`strace` 复核写路径未变（仍是唯一 `O_APPEND` 句柄，无 `O_TRUNC` / 锁 / 临时文件 / rename）。`--note` 的换行注入仍被 `json.dumps` 完整转义（实测仍只落一行、回读 rc=0）。

### R-P1（阻塞任务目标）：**0 条**

**六项修复未引入任何回归。** 本复验把前轮全部通过项重跑了一遍：20 次追加 `seq` 精确 `1..20`、每步字节级前缀比对全等、目录只多出 `relay_log.jsonl`、20 行七键精确、未知与大小写事件 4/4 拒绝且不落盘、8/8 坏账本 → 4、三命令缺计划/坏 marker → 3、`add` 0/2/3/4 四态齐、CLI 子命令仍恰为 `{add,status,lint}`。**19 个变异中 18 个转红**（前轮 17 个中 13 红）——测试判别力较前轮有实质提升，且前轮四个存活变异**已全部转红**。

### R-P2（质量 / 证据缺口）：**0 条**

### R-P3（后续不阻塞）：**3 条**

- **R-P3-1 · `pending_nodes` 的 superseded 排除逻辑正确但零测试（唯一存活变异）**：把 `if not node.superseded` 去掉（让 superseded 节点也进 `pending_nodes`），**29 条测试仍全绿**。行为本身是对的（本复验探针实测 superseded 的 W1 确被排除），但没有断言咬住。这一条的实质其实是 **HC-RL-A73「superseded 不计入 closed 也不计入 pending」**——RLT_03 自己的验收项、brief 完成条件 #4 点名，只是不在 batch 2 的 14 条之内。**建议在批 4 的矩阵收口里补一条含 superseded 节点的空账本正例**，顺手把 A64/A73 的 status 侧也一并咬住。不阻塞本批。
- **R-P3-2 · 账本非空时 `pending_nodes` 恒为 `[]`，是一句会被误读的假话**：`:498` 的三元式在 `entries` 非空时直接给 `[]`。实测写入一条 `plan_loaded` 之后，W1/C1 明明都还没开始，输出却是 `pending_nodes: []`。完整派生属 **HC-RL-A61/A62（RLT_05）**，本批不做是对的；但这个键在返工里**从「不存在」变成了「存在且报空」**，而 `[]` 在 §3.5 的冻结词汇里正是「无 pending 节点」的正式取值。`current_stage`/`current_node` 恒 `null` 是同一性质的 stub，所以整体自洽、F-021 也已登记。**建议**：在 `_status_command` 上方加一行注释显式标注「非空账本分支属 RLT_05 / A61+A62，当前为占位」，免得 RLT_05 施工者把它当既成实现继承下去。
- **R-P3-3 · 中性事实：CRLF 结尾的账本会被接受**：`read_text` 的 universal-newline 会把 `\r\n` 折成 `\n`，故 CRLF 账本 `status` rc=0（实测）。写侧用 `newline=""` 不做转换，所以本程序自己永远写 LF。跨 Windows/Linux 双平台（design §11.2 的 H2/H3/H4 要跑四组合）时这是**宽松但安全**的方向，登记备查即可。另复核三种边界均 fail-closed：尾部多一个空行 → 4、中间空行 → 4、文件只有一个 `\n` → 4。

---

## 正面确认（供主控参照，不构成放行）

- **29 条测试本复验亲自复跑通过**（`Ran 29 tests in 3.739s / OK / exit 0`），与 E-018 自述一致，**无夸大**；`py_compile` 与 `git diff --check` 均 exit 0。
- **前轮 4 个存活变异全部转红**：写入分支 exit 4、runtime-plan 重映射、七键精确、seq 连续性——四处零测试的守卫现在都有回归网。
- **18/19 变异转红**，唯一存活项已写进 R-P3-1（且其行为正确、归属 A73/批 4）。
- **P1-1 的修法完全走在合同内**：fail-closed 落在读侧，`add` 在损坏账本上**不写一个字节**（sha256 与文件大小双重比对），没有引入锁、临时文件、覆盖写或自动修复——与 §3.7「不做临时文件替换、不加锁」和 §13「不做陈锁自动回收」一致。
- **`by` 的修法只改派生源、不越界**：没有顺手把 A85 的 event-ownership 校验一起做了，测试名与 F-020 都明写这一点。**范围纪律成立。**
- **静态检查升级为可执行测试**是本轮最实质的证据强度提升：A40/A42 与 A39/A51 的静态半条从「一次性 grep」变成「谁破坏谁转红」。
- **未偷做 batch 3**：生产代码无 attempt 分配、无 `(node,agent)` 状态机、无终态封口、无 `node_start`/`agent_launch` 前置、无 trigger 运行时校验；批 3 的 12 条 HC-ID（A50/A49/A58/A59/A60/A68/A69/A70/A77/A78/A17/A74）在两文件中**命中数为 0**。
- **无 ID 漂移**：生产 18 / 测试 17 条 HC-ID 逐条对 DevPlan 归属表核验**全部归 RLT_03**；A89/A116/A120 仍确已移除。
- **测试依赖仍是纯标准库**：新增 `io` / `contextlib.redirect_stderr` / `unittest.mock` 均在标准库内，未引入第三方依赖（A16 方向不受影响）。
- **边界干净**：本卡零提交；工作区改动仅在两条允许的 `tools/relay-light/*.py` 与 `workspace/RLT_03/**`；DevPlan 的 `M` 仍是主控预置，本复验未触碰；`tools/relay-light/` 下仍只有两个 `.py`（pyc 已清）。

---

## 遗留（不阻塞本批，交主控）

| 项 | 出处 | 状态 |
|---|---|---|
| HC-RL-A5 与 HC-RL-A120 对「节点号重复」的退出码文字互斥 | F-016 | open — 需主控/设计侧定一次口径并回写 design，别留到 RLT_10 的 A80/A94 |
| `error:` 通道的 `arguments` / `ledger` 非 HC-ID | F-017 | open — 需主控决定是否视为 A94 例外 |
| `.gitignore` 未覆盖 `__pycache__` / `*.pyc` | F-008 | open — **收口前硬提醒**，`git add tools/relay-light/` 会带入 `.pyc` |
| A86 取严与 RLT_09 / A120 表尾放宽的前向冲突 | F-003 | open — 本批未触及，仍挂账 |
| A73/A64 的 status 侧断言、`pending_nodes` 非空分支的占位标注 | R-P3-1 / R-P3-2 | 建议纳入批 4 矩阵收口 |

---

本复验为 **batch 2 rework=1 的独立只读复验**，只登记事实与级别，**不做验收裁决、不代签 verify、不勾人类签名区**。
