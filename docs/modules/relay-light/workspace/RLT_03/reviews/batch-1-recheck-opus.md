<!-- dh:v1 -->
# RLT_03 · batch 1 rework=1 独立只读复验（fresh worker）

## 复验者登记

| 项 | 值 |
|---|---|
| 角色 | batch 1 rework=1 **fresh 独立只读复验** worker（非主控、非施工者、非原批审会话） |
| Session ID | `session_01KvXM8XBniTHeiqx6za6MqQ` |
| 启动形态（主控给定） | `claude --model opus`；pane `w15:p5` |
| 自报实际模型 | 系统提示自述为 **Opus 5 / `claude-opus-5`**（知识截止 2026-05）。此为**进程内自述**，本会话无法自外部核验；`--model opus` 的实际路由**待主控在 pane 侧核对**。 |
| 复验时间 | 2026-09-10 |
| 只读约束执行情况 | 未改任何代码 / DevPlan / `progress.md` / `findings.md` / `review.md`；**唯一写入 = 本文件**。探针与变异实验全部在会话 scratchpad 的**副本**上做（`$SCRATCH/mut/`），仓内文件字节未动。 |
| 加载边界 | 只读 `AGENTS.md`、`brief.md`、`task_plan.md`、`progress.md`、`findings.md`、`reviews/batch-1-opus.md`、`review.md`、design/01 与 DevPlan 的定点段落、两条代码路径。**未加载 dev-harness skill、未派活、未回头问用户。** |

## 审阅基线与路径

| 项 | 值 |
|---|---|
| worktree | `/home/nash/work/dh-relay/.dh-worktrees/RLT_03` |
| 分支 / HEAD | `wt/RLT_03` @ `baf2aad6aa5cf5b8fc0941411bbb30a0ebac8a6b`（= baseline `master@baf2aad6`，本卡零提交） |
| 受审对象 | 未跟踪新增 `tools/relay-light/relay_log.py`（366 行）、`tools/relay-light/test_relay_log.py`（363 行） |
| 权威口径 | DevPlan §RLT_03 验收口径 ＞ `design/01-RelayLight-产品设计与验收.md` ＞ `task_plan.md` |
| 复验目标 | ①原 P1-1 / P1-2 是否闭合；②主控采纳的 P2/P3 修复是否引入新 P0/P1 |

---

## 复跑命令与实测结果（本复验亲自执行）

```bash
cd /home/nash/work/dh-relay/.dh-worktrees/RLT_03

git rev-parse HEAD              # baf2aad6aa5cf5b8fc0941411bbb30a0ebac8a6b
git status --short              # M DevPlan（主控预置）；?? workspace/RLT_03/；?? tools/relay-light/
git diff --name-only master...HEAD   # 空（本卡未提交）
git diff --check                # exit 0

python3 -m unittest tools/relay-light/test_relay_log.py -v
#   → Ran 16 tests in 0.268s / OK / exit 0        ← 与 E-007 自述一致，16 条全绿

grep -oE 'HC-RL-A[0-9]+' tools/relay-light/relay_log.py | sort -u
grep -oE 'HC-RL-A[0-9]+' tools/relay-light/test_relay_log.py | sort -u
#   → 两侧集合完全相同，且恰为本批 15 条：A18/A24/A35/A46/A47/A48/A71/A72/A75/A86/A87/A88/A90/A104/A109
#   → 逐条对 DevPlan L537-563 归属表核验：15 条全部归 RLT_03，无 A89/A116/A120

grep -nE "lower\(|casefold|flock|tempfile|os\.replace|open\(.*['\"]w" tools/relay-light/relay_log.py
#   → 无匹配（批 1 仍是纯解析、无写盘、无枚举归一）

git check-ignore -v tools/relay-light/__pycache__/relay_log.cpython-312.pyc
#   → 未被忽略（F-008 仍 open，见 R-P3-4）
```

### 变异探针（有效性抽检 · 在 scratchpad 副本上做，仓内未改）

把两个文件复制到 `$SCRATCH/mut/` 后逐个改坏生产代码再跑同一份测试，验证测试**是否真有判别力**（基线 16/OK）：

| 变异 | 改法 | 结果 |
|---|---|---|
| M1 | `if len(stage_runs) != len(set(stage_runs)):` → `if False:` | **FAILED (failures=1)** ← A86 分组连续 |
| M2 | `if plan.decision_mode not in {"auto","consult"}:` → `if False:` | **FAILED (failures=1)** ← A90 |
| M3 | marker 必填集合 `("skill","session","recipe","cards")` → `("skill",)` | **FAILED (errors=3)** ← A18 |
| M4 | `(?P<k>[1-9][0-9]*)` → `(?P<k>[0-9]+)` | **FAILED (failures=1)** ← A104 |
| M5 | A109 同卡串行判定 → `if False:` | **FAILED (failures=1)** ← A109 |
| M6 | `_lint_command` 的 `if exc.exit_code == 3:` → `if False:` | **FAILED (failures=1)** ← CLI 退出码合同 |
| — | 还原后重跑 | Ran 16 / **OK** |

**六点全红**：本批新增/返工的关键规则均被至少一条断言咬住，不是「顺带绿」。

### 行为探针（直接 import 生产模块 / 起 CLI 子进程）

| 探针 | 输入 | 实测 |
|---|---|---|
| A86 表尾重现 | `C1(C#1), R1(R#1), C2(C#1)` | `REJECT exit=2 code=HC-RL-A86 nodes for a stage instance are not grouped contiguously` |
| superseded 行隔开同 stage | `C1(C#1), R1(R#1, superseded-by:C2), C2(C#1)` | `PASS`（忽略 superseded 后连续，符合 design §4.3） |
| A18 四必填缺失（CLI） | 分别删 `skill/session/recipe/cards` | 四例均 `exit=3` + stderr `error: HC-RL-A18 marker missing <字段>=` |
| A18 `cards=,` | 空卡列表 | `exit=2` + stderr **`lint: HC-RL-A18 ...`** ← 见 R-P2-1 |
| 纯 lint 规则违反（CLI） | `close=all_agents_done` | `exit=2` + stderr `lint: HC-RL-A47 line 6: invalid close value all_agents_done` |
| 合法计划（CLI） | 最小合法样本 | `exit=0`、stdout `lint: ok\n`、stderr 空 |
| `--plan` 指到文件而非目录 | `.../relay_plan.md` | `exit=3` + `error: HC-RL-A18 cannot read relay_plan.md: [Errno 20] ...`（fail closed） |
| 同节点 agent 重名 | 两行 `a | W1` | `REJECT HC-RL-A24 duplicate agent a in W1` |
| close 指向 superseded agent | `close=agent:ghost`，ghost 行 note=`superseded` | `REJECT HC-RL-A47` |
| agent note 大小写 | `Superseded` | 不判废弃 → `PASS`（大小写严格，方向正确） |
| `superseded-by:` 链 | W1→W2，W2 自身也 superseded | `PASS` ← 见 R-P3-3 |
| A109 同卡跨阶段跳级 | `R#1` 只依赖 `W#1`（越过 `C#1`） | `REJECT HC-RL-A109 card DHR_90 stage DHR_90:R#1 is parallel with DHR_90:C#1` |
| 跨卡默认依赖 | 两卡各首节点，`depends_on` 留空 | `W2.depends_on = ('W1',)` — 跨卡默认依赖**仍会串起来**（语义未变，见 R-P3-5） |
| 深依赖链 1500 节点（逆序） | `N0→N1→…→N1499` | **`exit=1` + 未捕获 `RecursionError` traceback** ← 见 R-P3-2 |

---

## 原 findings 逐条结论

### 原 P1

| 原编号 | 结论 | 证据 |
|---|---|---|
| **P1-1** A86 表尾漏检 / 第二分支死代码 / 口径表态 | **已闭合** | `relay_log.py:271-276` 判定式改为 `len(stage_runs) != len(set(stage_runs))`，原 `or (... count(last) > 2)` 死分支已删；测试文件 L236-248 新增**不带尾行 F1** 的 `C1,R1,C2` 反例（正是原漏检形状）；本复验探针实测 REJECT；变异 M1 令该断言转红 → 规则边界被真正咬住。口径侧按主控裁决取「严格拒绝、不提前实现 A120 放宽」，并已记 `findings.md` F-003。**遗留前向冲突见 R-P2-2。** |
| **P1-2** A18 / A90 无对应断言 | **已闭合** | A18：`test_marker_requires_only_frozen_fields_and_allows_missing_generated`（L101-122）以 subTest 覆盖缺 `skill/session/recipe/cards` **各一例被拒**，并断言省略 `generated=` 的计划过 lint 且 `plan.generated == ""`。A90：`test_decision_mode_accepts_frozen_values_and_rejects_others`（L124-140）覆盖 `auto`/`consult` **两个合法值正例** + `manual` 非法值反例；省略派生 `auto` 由 L83-93 断言 → design L1149 要求的 4 个形态齐了。变异 M2/M3 均转红。 |

### 原 P2

| 原编号 | 结论 | 证据 |
|---|---|---|
| **P2-1** `generated=` 过严 | **已闭合** | `relay_log.py:88` 必填集合只剩 `skill/session/recipe/cards`，`generated` 走 `fields.get(...,"")`；测试有无 `generated` 的正例断言。 |
| **P2-2** 范围漂移（A116 / A89 / A120） | **已闭合（本复验独立核过，不只信 E-010）** | 生产与测试的 HC-ID 集合完全相同且恰为 15 条，逐条比对 DevPlan 归属表全部归 RLT_03；`_ancestors` 现在只服务 A109，A89 的「跨阶段只指向前面阶段」检查已整体移除。 |
| **P2-3** 缺/坏计划的退出码与前缀 | **已闭合（主干），但引入新的一致性缺口** | `RelayError(exit_code, code, message)` 已落地（L21-28）；解析层（marker、表头、单元格结构、读文件失败）统一 `exit_code=3` 并由 `_lint_command` 走 `error:` 前缀；lint 规则层退 2 走 `lint:` 前缀，与 design §3.1/§3.5 一致。变异 M6 转红。**但同一个 A18 现在跨两条通道，见 R-P2-1。** |
| **P2-4** CLI 零测试 | **已闭合** | `test_lint_cli_smoke_uses_success_and_plan_error_contracts`（L327-343）用 `subprocess` 起真进程，断言合法→0/`lint: ok`/stderr 空、缺计划→3/`error:`、坏 marker→3/`error:`。argparse 层错误仍是 argparse 原生格式（见 R-P3-5，属批 2/A63 范围）。 |
| **P2-5** 红证据是导入错误红 | **程序上已闭合** | E-003 改标 `invalid-TDD-red`，E-006 为真正的行为红（`AssertionError: RelayError not raised`，A86 表尾反例）。A18/A90 的新覆盖属 late-added coverage、施工方在 E-007 明写「直接绿、不伪造红」——**诚实登记，可接受**；其判别力已由本复验的 M2/M3 变异独立补证。 |
| **P2-6** A109 正例没构造出并行 | **已闭合** | 新正例（L281-304）让两卡的 C 阶段各自依赖**本卡** W 阶段，并断言 `dependencies["C1"]==("W1",)`、`dependencies["C2"]==("W2",)` 且互不出现在对方依赖里；变异 M5 转红。跨卡默认依赖语义本身未变，见 R-P3-5。 |

### 原 P3

| 原编号 | 结论 | 证据 |
|---|---|---|
| **P3-1** superseded 前缀过松 / 目标不校验 | **基本闭合** | agent 行改为**精确等值** `cells[6] == "superseded"`（L185），探针实测 `supersededness unclear` / `Superseded` 均不再误判；节点行新增目标校验（L249-256）：空目标、含空白、指向不存在节点均拒（A24），测试 L189-206 覆盖。**残留**：`superseded-by:` 指向另一个 superseded 节点仍通过（R-P3-3）。 |
| **P3-2** 竖线 vs 列数不可区分 | **仍 open，已登记** | `findings.md` F-007 明写「精确区分不在本批授权，留后续卡」；现状仍 fail-closed。可接受。 |
| **P3-3** `__pycache__` 未 ignore | **仍 open，已登记** | F-008；本复验 `git check-ignore` 复核确认仍未被忽略，`tools/relay-light/__pycache__/*.pyc` 实际存在。**提交前必须由主控处理**（见 R-P3-4）。 |
| **P3-4** A104 覆盖不足 | **已闭合** | 新增 `DHR_90:W#0` 格式非法反例 + 前缀不符反例 + 合法例断言 `(card, stage, k) == ("DHR_90","W",1)` 三段解析（L250-261），正是 design L1127 指定的证明方式；变异 M4 转红。 |
| **P3-5** 冗余与小噪音 | **部分处理，已登记** | 原 L282-283 的 `next(i for i, candidate ...)` 已随 A89 移除消失；`_error()` 现在承载 `exit_code` 默认值，不再是纯转发；`print("lint: ok")` 仍走 stdout（不违反 A63，A63 只约束错误通道）；`stages_by_card` 循环内仍有 O(n²) 扫描（L332-334）。F-010 记为 open。可接受。 |

**小结：原 2 条 P1 全部闭合且有变异证据；原 6 条 P2 中 5 条闭合、1 条（P2-3）主干闭合但留下一致性缺口；原 5 条 P3 中 2 条闭合、3 条按授权边界登记为 open。**

---

## 本轮新发现

### R-P0（阻塞发布 / 数据丢失 / 安全）：**0 条**

无。批 1 仍是纯解析：不触网、无写盘调用、无锁 / 临时文件 / 覆盖路径、无凭据面；`grep` 复核确认生产文件无 `lower/casefold/flock/tempfile/os.replace/open(...,'w')`。工作区 diff 仅落在两条允许的 `tools/relay-light/*.py` 与本工作区，`master...HEAD` 为空，`git diff --check` exit 0。

### R-P1（阻塞任务目标）：**0 条**

**主控采纳的 P2/P3 修复没有引入新的 P0/P1。** 逐项对返工触及面做了回归探针：A86 收紧后 superseded 隔开的合法形态仍通过、A104/A87/A88/A47/A48/A72/A75/A35/A71 的原有反例仍按原编号拒绝、A109 的同卡跳级 fork 仍被拒、CLI 合法路径仍 0/`lint: ok`/stderr 空，未见 fail-open 回归或误拒合法计划。

### R-P2（质量 / 证据缺口）：**2 条**

#### R-P2-1 · P2-3 的修复留下裂缝：**同一个 HC-RL-A18 现在有两套退出码与两套前缀**

- marker 缺 `skill=`/`session=`/`recipe=`/`cards=` → `exit 3` + `error: HC-RL-A18 marker missing <字段>=`（`relay_log.py:88-90`，`exit_code=3`）。
- marker 写了 `cards=,`（值非空但切分后无有效卡号）→ `exit 2` + **`lint: HC-RL-A18 marker cards= must contain at least one card`**（`relay_log.py:189-191`，**漏带 `exit_code=3`，落回默认 2**）。

两条都是「marker `cards` 不合法」，却分别走解析通道和 lint 通道。这正是原 P2-3 要消灭的那类分层不一致，返工时**新代码路径没跟上**。现在无害（都 fail closed），但 RLT_10 的 HC-RL-A80 要「三种退出码各一例」并断言行格式与编号，届时 A18 会给出不确定答案。

顺带记一条**口径本身的模糊**（不是实现缺陷，需主控/用户表态）：design §3.5 的「lint 规则 → 验收项 ID 映射」表（L391）把「缺 marker 或 marker 缺四字段」列为 **lint 规则**（按 §3.1 应退 2 + `lint:` 前缀），而 HC-RL-A5（L1116）把「缺表头」列为 **退 3**、design §3.1 又把「解析失败」归 3；A5 的测试清单里还把「节点号重复」算作退 3，而 HC-RL-A120（L1135）明写节点号重复要「断言**退出 2** 与编号」。**冻结文档内部本就打架。** 当前实现选的是「解析层→3 / 规则层→2」，与 brief 完成条件 #12「坏/缺计划三命令退出 3」自洽，是可辩护的一种读法——建议主控就此定一次口径并回写 design，别留到 RLT_10 再撞。

#### R-P2-2 · A86 取严的**前向冲突**已入 findings，但没入代码/测试，RLT_09 会撞上

design 有三处明写表尾放宽：§3.5 L403「§4.5 的追加行落在表尾不算违规」、§4.3 L490「同一 `stage_id` 的非 superseded 节点构成一段连续区间即算通过，**追加行落在表尾也通过**」、§4.5.4 L578。而 HC-RL-A120（RLT_09，design L1135）要求「同一 stage 的节点**追加在表尾**通过」**作为正例**。

本卡按主控裁决取严，测试文件 L236-248 现在把**恰好是 A120 正例形状**的 `C1,R1,C2` 钉成了「必须被拒」。裁决本身在权威顺序上站得住（DevPlan 的 A86 归属 RLT_03、A120 归属 RLT_09，且 §4.3 是 C-004 上下文而非本卡验收口径），`findings.md` F-003 也登记了。**缺口在于**：RLT_09 施工者读到的是一条全绿的测试，它断言的恰好是自己要推翻的行为，findings 里那一行不会自动出现在他眼前。

建议（本复验只读，交主控裁决）：在 RLT_09 卡片或 DevPlan 依赖栏显式写「RLT_09 必须反转 `test_stage_must_be_known_and_grouped_contiguously` 的第三个 case」，或在收口时把这条冲突写进 as-built。**不阻塞批 1。**

### R-P3（后续不阻塞）：**5 条**

- **R-P3-1 · 测试归位错误**：A35 的 `on:done:nobody` 与 A71 的跨节点引用两条反例被放在 `test_lint_cli_smoke_uses_success_and_plan_error_contracts` 里（测试文件 L344-359），而不是同名的 `test_trigger_values_and_same_node_done_references_are_checked`（L317-325，只剩 `on:later:builder` 一例）。断言仍会跑，但一旦 CLI smoke 前半段先失败，这两条 trigger 覆盖会被**一并遮蔽**，且按测试名做覆盖矩阵映射（批 4 步骤 10 要做的事）会数错。建议返工时搬回去。
- **R-P3-2 · `_assert_acyclic` 递归深度无护栏**：`relay_log.py:217-233` 用递归 DFS。1500 节点的逆序依赖链实测 **exit 1 + 未捕获 `RecursionError` traceback**，落在 `0/2/3` 合同之外。真实计划规模（几十节点）够不着，故不阻塞；批 2/批 4 收敛可读性时改成迭代栈即可（`_ancestors` 已经是迭代版，照抄即可）。
- **R-P3-3 · `superseded-by:` 链不校验目标是否也已 superseded**：探针 `W1→W2(superseded-by:W3)→W3` 通过。design §4.5 L498 要求 `superseded-by` 单值指向「承接依赖关系的那一个」新节点，指向一个同样作废的节点属于计划自相矛盾。fail-open 但影响面小（下游依赖仍受 A72 拦），记为后续。
- **R-P3-4 · `__pycache__` 提交风险仍在（F-008 的操作提醒）**：`git check-ignore` 确认 `tools/relay-light/__pycache__/*.pyc` 未被忽略，而 `git status` 里 `tools/relay-light/` 整目录未跟踪——**收口时 `git add tools/relay-light/` 会把 `.pyc` 一并带进提交**。`.gitignore` 不在本卡允许路径内，需主控在收口前处理（补 ignore 或逐文件 add）。
- **R-P3-5 · 跨卡默认依赖语义仍未定，且未入 findings**：`depends_on` 留空解析为「前一个非 superseded 节点」，**会跨卡**（探针：两卡各自首节点、第二卡 `depends_on` 留空 → `('W1',)`，两卡被静默串起来）。design §4.1 只写「留空 = 依赖前一节点」，未排除跨卡。原 P2-6 曾建议把这条口径记进 `findings.md`，F-005 只记了正例修复、**没记这条语义待确认**。建议补记一行交主控。

---

## 正面确认（供主控参照，不构成放行）

- **16 条测试本复验亲自复跑通过**（`Ran 16 tests in 0.268s / OK / exit 0`），与 `progress.md` E-007 自述一致，无夸大。
- **返工没有偷偷扩范围**：HC-ID 集合精确收敛到本批 15 条，A89/A116/A120 特判确已移除（独立 grep + DevPlan 归属表逐条核过，不依赖 E-010 自述）。
- **六点变异全红**，说明本批测试不是「跟着实现写的绿」；这一点比原批审时的证据强度有实质提升。
- **fail-closed 主干仍成立**：marker 不匹配、表头缺失/重复、分隔行缺失、列数不符、单元格结构异常一律拒且不猜。
- **边界干净**：本卡零提交，工作区改动仅在两条允许的 `tools/relay-light/*.py` 与 `workspace/RLT_03/**`；DevPlan 的 `M` 属主控预置，本复验未触碰。

---

## 结论

**approved**（针对 batch 1 rework=1 的范围）

- 原 **P1-1 / P1-2 均已闭合**，且各自有变异实验证明断言具备判别力。
- 主控采纳的 **P2-1 / P2-2 / P2-3 / P2-4 / P2-5 / P2-6 与 P3-1 / P3-4 修复未引入任何新 P0/P1**；本轮新增 **R-P0 = 0、R-P1 = 0**。
- 遗留 **R-P2 两条**（A18 双通道退出码裂缝；A86 取严与 RLT_09/A120 的前向冲突提示）与 **R-P3 五条**，均不阻塞批 1，建议在进入批 2 前顺手处理 R-P2-1 与 R-P3-1（都是几行的事），其余记 `findings.md` 由主控裁决。
- **R-P3-4 是收口前的硬提醒**：`git add tools/relay-light/` 会带入 `.pyc`。

本复验为 **batch 1 rework=1 的独立只读复验**，只登记事实与级别，**不做验收裁决、不代签 verify、不勾人类签名区**。
