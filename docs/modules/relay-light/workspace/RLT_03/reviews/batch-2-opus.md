<!-- dh:v1 -->
# RLT_03 · batch 2 独立只读复核（JSONL 纯追加 + schema/CLI/退出码合同）

## 复核者登记

| 项 | 值 |
|---|---|
| 角色 | batch 2 **fresh 独立只读审核** worker（非主控、非施工者、非前两轮审核会话） |
| Session ID | `session_01GLoSNPnXyTjTh2edxTAYTw` |
| 启动形态（主控给定） | `claude --model opus`；pane `w15:p6` |
| 自报实际模型 | 系统提示自述为 **Opus 5 / `claude-opus-5`**（知识截止 2026-05）。此为**进程内自述**，本会话无法自外部核验；`--model opus` 的实际路由**待主控在 pane 侧核对**。 |
| 复核时间 | 2026-09-10 |
| 只读约束执行情况 | 未改任何代码 / DevPlan / `progress.md` / `findings.md` / `review.md`；**唯一写入 = 本文件**。所有探针与变异实验在会话 scratchpad 的**副本**上做（`$SCRATCH/p1`、`$SCRATCH/mut`），仓内两条 `.py` 字节未动。本复核自己跑测试生成的 `tools/relay-light/__pycache__/*.pyc` 已由本会话清除，工作树复原。 |
| 加载边界 | 只读 `AGENTS.md`、`brief.md`、`task_plan.md`、`progress.md`、`findings.md`、`reviews/batch-1-opus.md`、`reviews/batch-1-recheck-opus.md`、DevPlan §RLT_03 与归属表、design/01 §3 全段与 §11.1 / §14、两条 Python。**未加载 dev-harness skill、未派活、未回头问用户。** |

## 审阅基线与路径

| 项 | 值 |
|---|---|
| worktree | `/home/nash/work/dh-relay/.dh-worktrees/RLT_03` |
| 分支 / HEAD | `wt/RLT_03` @ `baf2aad6aa5cf5b8fc0941411bbb30a0ebac8a6b`（= baseline `master@baf2aad6`，本卡零提交） |
| 受审对象 | 未跟踪新增 `tools/relay-light/relay_log.py`（530 行）、`tools/relay-light/test_relay_log.py`（486 行） |
| 权威口径 | DevPlan §RLT_03 验收口径 ＞ `design/01-RelayLight-产品设计与验收.md` §3.1/§3.2/§3.5/§3.7/§11.1 ＞ `task_plan.md` |
| 本批范围 | task_plan「批 2 — JSONL append + schema/CLI/exit contract」；HC-RL-**A37/A38/A39/A40/A2/A41/A42/A5/A45/A84/A55/A51/A63/A56** 共 14 条 |
| 施工方自述 | `progress.md` E-012（行为红）/E-013（绿，23 tests）/E-014（静态与禁用 API）/E-015（pycache 卫生） |

---

## 复跑命令与实测结果（本复核亲自执行）

```bash
cd /home/nash/work/dh-relay/.dh-worktrees/RLT_03

git rev-parse HEAD                    # baf2aad6aa5cf5b8fc0941411bbb30a0ebac8a6b
git status --short                    # M DevPlan（主控预置）；?? workspace/RLT_03/；?? tools/relay-light/
git diff --name-only master...HEAD    # 空（本卡未提交）
git diff --check                      # exit 0

python3 -m unittest tools/relay-light/test_relay_log.py -v
#   → Ran 23 tests in 2.921s / OK / exit 0        ← 与 E-013 自述一致，23 条全绿

grep -nE "\.lower\(|\.casefold\(|\.upper\(|fcntl|msvcrt|filelock|flock|lockf|tempfile|mkstemp|os\.replace|os\.rename|shutil\.move|\.write_text" tools/relay-light/relay_log.py
#   → 无匹配
grep -n "open(" tools/relay-light/relay_log.py
#   → 全文唯一一处：open(ledger_path, "a", encoding="utf-8", newline="")

strace -f -e trace=openat,flock,fcntl,rename,unlink,ftruncate python3 tools/relay-light/relay_log.py add ...
#   → 仅两次 openat 同一账本：O_RDONLY（读）与 O_WRONLY|O_CREAT|O_APPEND（写）
#   → 无 flock / fcntl 加锁 / rename / unlink / ftruncate

grep -oE 'HC-RL-A[0-9]+' tools/relay-light/*.py | sort -u
#   → 生产 18 条 / 测试 17 条，逐条对 DevPlan 归属表核验：**全部归 RLT_03**，仍无 A89/A116/A120
```

### 行为探针（自建计划目录，起真 CLI 子进程）

| 探针 | 输入 | 实测 |
|---|---|---|
| **A37/A38/A39** 20 次纯追加 | 19 个合法事件词 + 1 次重复 `checkpoint` | `seq` 精确 `1..20`；**每一步都用前一轮的字节长度截取并 `cmp` 比对，20 次全等**（旧行逐字节不变）；文件恰 20 行 |
| **A39** 目录快照 | 每一轮 add 后逐轮清点目录 | 全程只多出 `relay_log.jsonl`，**零 `.tmp` / 零锁文件 / 零残留** |
| **A55/A51** 七键 | 20 行逐行 `set(row)` | 20 行键集合恒为 `{seq,ts,node,event,agent,by,note}`，无第八键；**全 20 行连同值层 grep `pane` 均无命中** |
| **A2/A41** 未知与大小写 | `unknown` / `NODE_START` / `Plan_Loaded` / `DONE` / `done_` / `"done "` / 空串 | **七例全部 `rc=2` + `error: HC-RL-A2 ...` + 账本文件根本未创建** |
| **A84** 首写 | 首条写 `node_start` / `stage_start` / `agent_launch` | 三例均 `rc=2` + `error: HC-RL-A84 first ledger event must be plan_loaded`，**且不落盘**；首条 `plan_loaded` → `rc=0` |
| **A84** 空账本 | 零字节 `relay_log.jsonl` | `status` / `status --json` / `lint` 均 `rc=0`、stderr 空；`--json` 给出 `current_stage:null`、`current_node:null` |
| **A45** 坏账本 | 8 种：非 JSON / 缺键 / 多键 / seq 不连续 / 非法 event / 非法 agent / 非法 by / 顶层数组 | **八例全部 `status rc=4`**、stdout 空、stderr `error: ledger line N: ...` |
| **A5** 三命令 × 四种坏计划 | 缺文件 / 坏 marker / 缺表头 / 节点号重复 | 缺文件·坏 marker·缺表头：`lint/status/add` **全 3**；节点号重复：`lint=2`（`lint:` 前缀）、`status/add=3`（`error:` 前缀）← 见 P2-3 |
| **A56** add 四态 | 正常 / 未知事件 / 缺计划 / 只读目录 | `0` / `2` / `3` / `4` 四态齐，均可复现 |
| **A63** stderr 通道 | 上述全部反例 | 错误**一律只进 stderr**，stdout 恒为空；格式恒为 `error: <code> <message>` |
| **A63** argparse 层 | 无参 / 缺必填 / 未知子命令 / 未知 flag | 四例均 `rc=2` + `error: arguments <message>`（**未泄漏 argparse 原生 usage 到 stdout**）← 见 P3-1 |
| **A55** 畸形 agent | `monitor` / `monitor#` / `#1` / `monitor#0` / `monitor#01` / `mon itor#1` / `a#1#2` / `monitor#1␣` | **八例全 `rc=2` + `error: HC-RL-A55`**；`monitor#999` 通过（本批不设上限，attempt 上限属批 3） |
| CLI 子命令集合 | `--help` | 恰为 `{add,status,lint}`，`rc=0`、stderr 空 |
| **注入面** | `--note` 里塞入一整行伪造 JSON（含真实换行） | `json.dumps` 转义为 `\n`，**只落一行**，无法伪造第二条记录；回读 `rc=0` |
| **尾行未换行** | 账本最后一行缺 `\n`，再 add 一条 | **`status` 先判其合法（rc=0）；add 成功（rc=0）后两条记录粘成一行，账本变成 1 行无效 JSON，此后 `status`/`add` 永久 `rc=4`** ← **P1-1** |
| `by` 归属 | `--event plan_loaded --agent monitor#1` | 落盘 `by=orchestrator`、`agent=monitor#1`（自相矛盾）；反过来 `--event agent_launch --agent orchestrator#1` → `by=monitor` ← **P2-1** |
| 并发事实 | 6 个 add 并发 | 本机实测未撞号（`seq 1..7`）。**设计本就是单写者 + 无锁（§3.7），此处仅作事实登记，不构成要求。** |

### 变异探针（有效性抽检 · 在 scratchpad 副本上做，仓内未改）

把两个文件复制到 `$SCRATCH/mut/` 后逐个改坏生产代码再跑同一份测试（基线 23/OK）。**17 个有效变异中 13 个转红、4 个存活**：

| 变异 | 结果 |
|---|---|
| 去掉「首条必须 plan_loaded」 | **FAILED (1)** ← A84 |
| 去掉事件白名单 | **FAILED (2)** ← A2/A41 |
| `agent` 正则放宽为 `.*` | **FAILED (1)** ← A55 |
| `seq` 恒为 1 | **FAILED (1)** ← A37 |
| `open(...,'a')` → `'w'` | **FAILED (1)** ← A38 |
| 账本错误 exit 4 → 2 | **FAILED (2)** ← A45 |
| 坏 JSON 行静默跳过 | **FAILED (1)** ← A45 |
| 未知事件只警告仍落盘 | **FAILED (2)** ← A2 |
| add 错误改走 stdout | **FAILED (5)** ← A63 |
| `error:` 前缀改成 `err:` | **FAILED (5)** ← A63 |
| 额外落一个 `.tmp` 旁文件 | **FAILED (1)** ← A39 |
| 多写第八键 `pane` | **FAILED (1)** ← A51/A55 |
| 空账本 status 返回 4 | **FAILED (1)** ← A84 |
| **删掉 `_runtime_plan` 的「lint 违反→3」重映射** | **OK（存活）** ← 见 P2-3 |
| **七键「精确相等」放宽为「超集即可」** | **OK（存活）** ← 见 P2-4 |
| **删掉 `seq` 连续性校验** | **OK（存活）** ← 见 P2-4 |
| **写入分支 exit 4 → 2** | **OK（存活）** ← 见 P2-2 |

还原后重跑：`Ran 23 tests / OK`。

---

## 逐条问题

### P0（阻塞发布 / 数据丢失 / 安全）：**0 条**

无。本批不触网、无凭据面、无删除或覆盖路径；`strace` 实证唯一写句柄是 `O_WRONLY|O_CREAT|O_APPEND`，无 `O_TRUNC`、无锁、无 rename/unlink。`--note` 的换行注入被 `json.dumps` 完整转义，无法伪造记录。工作区改动仅落在两条允许的 `tools/relay-light/*.py` 与本工作区。

---

### P1（阻塞任务目标）：**1 条**

#### P1-1 · 尾行未换行的账本被判为合法，下一次 `add` 把两条记录粘成一行，账本此后不可机读

`relay_log.py:426`（`read_ledger` 用 `text.splitlines()`）与 `:472-473`（`open(...,'a')` 后无条件 `write(json + "\n")`）之间没有「上一行是否已终止」这一道闸。

**实测复现**（探针，账本尾行缺 `\n`）：

```text
1) status --plan <dir>        → rc=0，"status: 1 ledger entries"        ← 判定这份账本合法
2) add ... --event node_start → rc=0                                     ← 追加成功
3) 文件内容：{"seq":1,...,"note":"seed"}{"seq":2,...}\n                   ← 两条记录同一行
4) wc -l                      → 1
5) status                     → rc=4，error: ledger line 1: invalid JSON  ← 从此永久不可读
6) add                        → rc=4（append_event 先读账本）             ← 工具侧无法再写入或自救
```

三处合同同时落空：

- **HC-RL-A38「无重复无覆盖、历史行逐字节不变」**：第 1 行的字节虽在，但它作为一条记录被**销毁**了——再也解析不回原来的那条。A38 的单测只比对「新文件是否以旧字节为前缀」，这条路径恰好满足前缀断言却毁掉了语义，**测试无法发现**。
- **HC-RL-A45「账本读取或解析失败时 status 退出 4」**：一份尾行未终止的 JSONL 恰恰是「解析上有问题的账本」，`status` 却先给 0 放行，等下一次 `add` 之后才变成 4——**fail-open 在前、破坏在后**，顺序正好反了。
- **§12 / HC-RL-H10**：账本是「复盘唯一证据」，且 §7.3 恢复协议本就假定进程会被打断重来。**触发前提就是这份设计明写要应对的场景**：写入被 kill / 磁盘写满 / 外部编辑器去掉了行尾换行。

**这条零测试**：本批 23 条测试没有任何一条构造未终止尾行。

**范围判定**：本条完全落在批 2 的 A37/A38/A45 之内，不需要批 3 的状态机，也不属 RLT_05。

**最小 fail-closed 修法（供施工方参考，本复核不代改）**：`read_ledger` 在 `if not text: return []` 之后加一句——`text` 非空且 `not text.endswith("\n")` 时抛 `_ledger_error("last ledger line is not newline-terminated")`。这样 `status` 立刻给出 A45 要求的 4、`add` 拒绝在损坏的账本上追加，破坏路径整条消失，且不引入锁 / 临时文件 / 覆盖写。配一条「尾行缺 `\n` → status rc=4 且 add 不落盘」的测试即可咬住。

---

### P2（质量 / 证据缺口）：**6 条**

#### P2-1 · `by` 由 **event 反推**而不是由 **agent 决定**，会写出自相矛盾的行，并把 RLT_05 的 A85/A93 提前架空

`relay_log.py:468`：

```python
"by": "orchestrator" if event in ORCHESTRATOR_EVENTS else "monitor",
```

**实测**：

| 命令 | 落盘结果 |
|---|---|
| `--event plan_loaded --agent monitor#1` | `agent=monitor#1`，`by=orchestrator` |
| `--event stage_start --agent monitor#1` | `agent=monitor#1`，`by=orchestrator` |
| `--event agent_launch --agent orchestrator#1` | `agent=orchestrator#1`，`by=monitor` |

design §3.2 把 `by` 定义为**写入者**（一个事实），不是「该事件按规矩应该由谁写」（一个规范）。当前实现把规范当事实写进账本，于是同一行里 `agent` 与 `by` 互相打脸。后果有三层：

1. **本批自己的测试 fixture 就是坏样本**：`test_add_is_append_only_with_twenty_fixed_schema_events` 用 `--agent monitor#1` 写完全部 20 个事件（含四个 orchestrator 事件），产出的账本在语义上是不成立的。A37/A38 只查 seq 与字节，所以照样绿。
2. **HC-RL-A85（RLT_05）当场变成不可实现**：它要求「监工写 `stage_start`」被拒并退 2。`by` 既然是从 event 推出来的，越权这件事在数据上**永远不会发生**，A85 的四个反例无从构造——除非先回改这一行。
3. **HC-RL-A93（RLT_05）失去依据**：它要按 `by` 划分编排/监工的写入区间，而合成出来的 `by` 与真实写入者无关。

CLI 签名（§3.1）确实没有 `--by`，所以「派生」本身没错；错在**派生源**。合乎设计的派生源是 `agent` 前缀（`orchestrator#<n>` → `by=orchestrator`，其余 → `by=monitor`），再由 A85 拿事件的法定写入者去校验它。本批可以只改派生源、把校验留给 RLT_05，代价一行。**建议本批就改**，否则批 3/RLT_05 会在一堆已写好的矛盾账本上返工。

#### P2-2 · A56 的 exit 4 是**读账本失败**证出来的，真正的**写入失败**分支零测试

`test_add_reports_write_failure_as_exit_four` 用 `(plan_dir/"relay_log.jsonl").mkdir()` 造 4。实测该例报的是 `error: ledger cannot read relay_log.jsonl: [Errno 21] Is a directory` ——命中的是 `read_ledger` 的读分支（`relay_log.py:421`），**不是** `append_event` 的写分支（`:475`）。

**变异实证**：把 `:475` 的 `_ledger_error(...)`（exit 4）改成 `_error(...)`（默认 exit 2），**23 条测试仍全绿**。

design §3.1 明写 add 的 `4` 是「**写入失败**」。真写入失败路径实测存在且正确（只读目录 → `rc=4` + `error: ledger cannot append ...`），但**没有任何断言保护它**。补一条只读目录（或不可写路径）的用例即可，测试名也该与它证的分支对上。

#### P2-3 · `_runtime_plan` 的「lint 违反 → 3」重映射零测试；同一份坏计划 lint 与 add/status 给不同退出码，R-P2-1 的口径分歧扩大了

`relay_log.py:399-406` 把非 3 的计划错误统一抬成 3，好让 add/status 满足 A5。**变异实证**：删掉这段重映射（`raise` 原样抛出），**23 条测试仍全绿**——因为现有 A5 用例只测「缺文件」，而缺文件本来就是 3，走不到重映射。

于是实测出现这一格（本复核探针，节点号重复的计划）：

| 命令 | 退出码 | stderr |
|---|---|---|
| `lint` | **2** | `lint: HC-RL-A46 line 7: duplicate node W1` |
| `status` | **3** | `error: HC-RL-A46 line 7: duplicate node W1` |
| `add` | **3** | `error: HC-RL-A46 line 7: duplicate node W1` |

这个分裂本身**是可辩护的**（§3.1 给 lint 的 2 与给 add/status 的 3 本就不同栏），也与 brief 完成条件 #12 自洽。但两件事仍悬着：

- **零回归网**：整条重映射没有测试，删掉不转红。至少补一条「lint 违反的计划 → add/status 退 3」的用例。
- **冻结文档自相矛盾仍未定**（batch-1 recheck R-P2-1 已提，至今 open）：HC-RL-A5（design L1116）把「**节点号重复**」列为「三个子命令均退出 3」的证明用例，而 HC-RL-A120（L1135）要求同一情形「断言**退出 2** 与编号」。当前实现对 lint 给 2、对另两个给 3，等于**同时满足两条互斥的验收文字**——纯属巧合，不是设计。建议主控就此定一次口径并回写 design，别留到 RLT_10 的 A80/A94 再撞。

#### P2-4 · 读侧的两条守卫（七键**精确**、`seq` **连续**）零测试，变异存活

`read_ledger` 里两条关键校验没有任何断言咬住：

| 变异 | 结果 |
|---|---|
| `set(entry) != LEDGER_FIELDS` → `not LEDGER_FIELDS <= set(entry)`（允许多余键） | **23/OK 存活** |
| `entry["seq"] != expected_seq` → `if False`（不查连续性） | **23/OK 存活** |

行为本身正确（本复核 8 种坏账本探针里，多余键与 seq 跳号都被判 4），但**判别力全靠探针，不靠测试**。这两条不是可有可无的装饰：`append_event` 的 `seq = len(entries) + 1` 之所以安全，前提就是读进来的账本 seq 已被证明连续；而「七键精确」正是 A55 在**读**侧的那一半。各补一条反例即可。

#### P2-5 · A40 / A42 / A51 与 A39 的**静态检查**那一半，测试套件里没有守卫

design §11.1 对这四条明写证明方式含「静态检查 / 静态 grep」：A39「静态检查无 `os.replace`」、A40「静态检查无 `fcntl` / `msvcrt` / `filelock`」、A42「静态 grep 无 `.lower()` / `.casefold()`」、A51「静态检查字段与样例」。

当前这部分证据**只存在于 `progress.md` E-014 记的一次性 grep**（本复核已独立复跑，全部无匹配，结论属实）。但套件里没有对应的守卫用例——**将来谁加一行 `fcntl.flock` 或 `.lower()`，23 条测试不会有任何一条转红**，而这两样恰恰是 §3.7 与教训库候选-5 点名要防的东西。

一条 `test_static_guards` 读自己模块的源码、断言禁用模式零命中，十几行就能把 A40/A42 与 A39/A51 的静态半条永久钉住。**本批不补也能过**（task_plan 步骤 5 的「怎么验」字面确实只要求一次 grep），但它是本卡最便宜的一处证据升级。

#### P2-6 · A84 只证了一半：「所有节点 `pending`」无断言，且 `status --json` 的三键 stub 与冻结键集不符

A84（design L1118）三件事：①空账本时 `status`/`lint` 退 0；②`current_stage` 与 `current_node` 为 `null`、**所有节点 `pending`**；③`add` 自动建文件且首条非 `plan_loaded` 退 2。

- ① ③ **已咬住**（测试 + 本复核探针，且变异「空账本 status 返 4」转红）。
- ② **只做了一半**：`_status_command`（`relay_log.py:494-497`）输出的是 `{"current_stage": null, "current_node": null, "ledger_entries": N}` —— 两个 `null` 在，**`pending` 那一半既没实现也没断言**；测试只断言 `rc=0` 与 stderr 空，连这两个 `null` 都没读。

另附一条**形状风险**：这个三键 stub 与 design §3.5 冻结的 13 个顶层键（`plan`/`open_stages`/`pending_nodes`/`superseded_ignored`/…）完全对不上，且多出一个合同里没有的 `ledger_entries`。完整结构归 HC-RL-A62（RLT_05），本批不必实现；**但 A84 的 `pending` 半条是 RLT_03 自己的**，且 stub 现在以「已实现」的姿态摆着，容易在批 4 的覆盖矩阵里被当成 A84 已闭合。建议：要么本卡补出 `pending_nodes` 与两个 `null` 的断言，要么在代码里显式标注该 stub 归 RLT_05/A62，并在 `findings.md` 登记 A84 的 ② 为部分完成。

---

### P3（后续不阻塞）：**5 条**

- **P3-1 · `error: <code>` 里有两个非 HC-ID 的 code**：argparse 层报 `error: arguments ...`，账本层报 `error: ledger ...`。A63 只要求 `error: <code> <message>` 的**格式**，所以本批合规；但 §3.5「规则编号即对应验收项 ID」的习惯在 `error:` 通道上就此出现两个例外，RLT_10 的 A94（「报出的编号存在于本验收表」）会来问。建议要么换成 A63/A45 之类的真编号，要么在 findings 里记一句「`error:` 通道的 code 不要求是验收 ID」由主控定。
- **P3-2 · A51 的测试断言偏弱**：`assertNotIn("pane", rows[-1])` 只查**最后一行**的**顶层键**。真正的强度来自旁边那条七键精确断言。本复核已独立复验全 20 行连同值层无 `pane`，结论成立；建议把断言改成对全部行、并覆盖值层，与 A51 的「字段与样例」措辞对齐。
- **P3-3 · 测试文件 docstring 过期**：首行仍是 `"""Batch-1 acceptance tests for the relay-light plan parser and linter."""`，而文件已含 batch 2 的账本用例。批 4 步骤 10 要按 test 名/文件做覆盖矩阵映射，这行会误导。
- **P3-4 · `__pycache__` 仍未 ignore（F-008 的收口硬提醒，第三次复述）**：`.gitignore` 复核确认仍无 `__pycache__` / `*.pyc` 条目，而 `tools/relay-light/` 整目录未跟踪——**收口时 `git add tools/relay-light/` 会把 `.pyc` 一并带进提交**。`.gitignore` 不在本卡允许路径内，需主控在收口前处理（补 ignore 或逐文件 add）。本复核自己跑测试生成的两条 `.pyc` 已清除。
- **P3-5 · 两条中性事实登记**（不构成要求）：①`ts` 用 `datetime.now().astimezone().isoformat()`，带微秒与偏移，符合 §3.2「ISO 8601 本地时区带偏移」；②6 个 `add` 并发实测未撞号（`seq 1..7`），但设计本就是单写者 + 无锁（§3.7），不应据此认为并发安全，也不应为此加锁。

---

## 正面确认（供主控参照，不构成放行）

- **23 条测试本复核亲自复跑通过**（`Ran 23 tests in 2.921s / OK / exit 0`），与 `progress.md` E-013 自述一致，**无夸大**。
- **A37/A38/A39 由本复核独立复算**，不依赖施工方的测试：20 次追加逐轮字节级前缀比对全等、目录逐轮清点零新增物、行数恰 20、`seq` 精确 `1..20`。
- **A39/A40 有 `strace` 级证据**：全程唯一写句柄 `O_WRONLY|O_CREAT|O_APPEND`，**无 `O_TRUNC`、无 `flock`/`fcntl` 加锁、无 `rename`/`unlink`/`ftruncate`**，全文只有一处 `open()`。这比静态 grep 强一档。
- **A42 静态守卫成立**：全文无 `.lower()` / `.casefold()` / `.upper()`；imports 仅 `argparse/json/re/sys/dataclasses/datetime/pathlib`，**全标准库**（A16 方向亦成立）。
- **A2/A41 fail closed 扎实**：19 词全过、7 种未知与大小写变体全拒，**且拒绝时账本文件根本不被创建**（不是先建再拒）。
- **A55 双向成立**：写侧 20 行键集合恒为七键；读侧对缺键/多键/非法 event/非法 agent/非法 by 一律判 4；8 种畸形 `agent` 全拒。
- **A63 通道纪律干净**：所有反例 stdout 恒空、错误恒在 stderr、格式恒为 `error: <code> <message>`；连 argparse 的原生 usage 都被 `RelayArgumentParser` 收进了同一合同（这一手比 batch-1 复核当时的建议做得更彻底）。
- **未偷做 batch 3**：生产代码里没有 attempt 分配、没有 `(node,agent)` 状态机、没有终态封口、没有 `node_start`/`agent_launch` 前置、没有 trigger 运行时校验；`on:done`/`on:blocked` 仅出现在批 1 的 lint 分支（`:360-369`）。批 3 的 12 条 HC-ID 在两个文件里零出现。**范围纪律成立。**
- **无 ID 漂移**：生产 18 条 / 测试 17 条 HC-ID 逐条对 DevPlan 归属表核验**全部归 RLT_03**；A89/A116/A120 仍确已移除（独立 grep，不依赖 E-010/E-014 自述）。
- **13/17 变异转红**：本批新增的核心规则（A84 首写、A2 白名单、A55 格式与七键、A37 seq、A38 追加语义、A45 exit 4 与坏行不跳过、A63 双要素、A39 无旁文件、A51 无第八键）都被至少一条断言真正咬住，不是「跟着实现写的绿」。存活的 4 个已分别写进 P2-2/P2-3/P2-4。
- **注入面干净**：`--note` 内的真实换行被 `json.dumps` 转义，无法在账本里伪造第二条记录。
- **边界干净**：本卡零提交，工作区改动仅在两条允许的 `tools/relay-light/*.py` 与 `workspace/RLT_03/**`；DevPlan 的 `M` 经 `git diff --stat` 核对为主控预置的状态行（6 增 6 删），本复核未触碰；`git diff --check` exit 0。

---

## 结论

**changes-requested**（针对 batch 2 的范围）

- **必须闭合：P1-1** —— 尾行未换行的账本被 `status` 放行、被下一次 `add` 粘坏、此后永久 `rc=4`。它同时打穿 A38 与 A45，零测试，修法是 `read_ledger` 里两行 fail-closed 判断加一条反例测试。
- **强烈建议在进入批 3 前一并处理：P2-1**（`by` 的派生源改成 `agent` 前缀——一行，不改就会让批 3/RLT_05 在一堆自相矛盾的账本上返工）、**P2-2 / P2-3 / P2-4**（三处变异存活的零测试守卫，各补一条反例即可）。
- **P2-5 / P2-6** 建议登记后由主控裁决：前者是本卡最便宜的一次证据升级（静态守卫进测试），后者需要明确 A84 的「所有节点 pending」这半条是本卡补齐还是随 A62 移交 RLT_05。
- **P3 五条**记入 `findings.md` 即可，其中 **P3-4（`__pycache__`）是收口前的硬提醒**，已是第三次复述。
- 遗留的 **R-P2-2**（A86 取严与 RLT_09/A120 的前向冲突）本批未触及，仍按 F-003 挂着。

本复核为 **代码轮 1 的 batch 2 独立只读小审**，只登记事实与级别，**不做验收裁决、不代签 verify、不勾人类签名区**。
