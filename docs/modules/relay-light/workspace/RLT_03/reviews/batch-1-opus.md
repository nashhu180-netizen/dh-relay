<!-- dh:v1 -->
# RLT_03 · batch 1 独立只读复核（parser + structural lint）

## 复核者登记

| 项 | 值 |
|---|---|
| 角色 | batch 1 独立只读审核 worker（非主控、非施工者） |
| Session ID | `session_01HASh3oaGZB3Mm6aqcsLNyo` |
| 启动参数（主控给定形态） | `claude --model opus --permission-mode acceptEdits`；pane `w15:p3` |
| 自报实际模型 | 系统提示自述为 **Opus 5 / `claude-opus-5`**。此为进程内自述，本会话无法从外部核验；**启动形态 `--model opus` 待证**，如需强证据请由主控在 pane 侧核对实际路由模型。 |
| 复核时间 | 2026-09-10 |
| 只读约束执行情况 | 未改任何代码 / DevPlan / progress.md / findings.md / review.md；仅写入本文件。所有探针脚本落在会话 scratchpad（`/tmp/claude-1000/.../scratchpad`），未入仓。 |

## 审阅基线与路径

| 项 | 值 |
|---|---|
| worktree | `/home/nash/work/dh-relay/.dh-worktrees/RLT_03` |
| 分支 / HEAD | `wt/RLT_03` @ `baf2aad6aa5cf5b8fc0941411bbb30a0ebac8a6b`（= baseline master@baf2aad6，无本卡提交） |
| 受审 diff | 未跟踪新增：`tools/relay-light/relay_log.py`（363 行）、`tools/relay-light/test_relay_log.py`（243 行） |
| 权威口径 | DevPlan `P1-RelayLight-开发方案.md` §RLT_03（L136–193）＞ `design/01-RelayLight-产品设计与验收.md` §3.1/§3.5/§4.1–4.5/§11.1 ＞ `task_plan.md` |
| 本批范围 | task_plan「批 1 — plan parser + structural lint」；HC-RL-A24/A18/A90/A46/A47/A48/A72/A75/A86/A104/A109/A87/A88/A35/A71 共 15 条 |
| 施工方自述 | `progress.md` E-003（红）/E-004（绿，12 tests）/E-005（静态与 diff 边界） |

## 复跑命令与实测结果（本复核亲自执行）

```bash
cd /home/nash/work/dh-relay/.dh-worktrees/RLT_03

# 1) 测试复跑
python3 -m unittest tools/relay-light/test_relay_log.py -v
#   → Ran 12 tests in 0.016s / OK / exit 0   （与 E-004 一致）

# 2) diff 与边界
git rev-parse HEAD          # baf2aad6aa5cf5b8fc0941411bbb30a0ebac8a6b
git status --short          # M DevPlan（主控预置）；?? workspace/RLT_03/；?? tools/relay-light/
git diff --name-only master...HEAD   # 空（本卡未提交）
git diff --check            # exit 0，无 whitespace 报告
git diff -- docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md
#   → 仅 dh:status 段与任务表 RLT_02/RLT_03 状态行，属主控预置 WIP，非本批施工产物

# 3) CLI 实测
python3 tools/relay-light/relay_log.py lint --plan <合法计划目录>   # "lint: ok" / exit 0
python3 tools/relay-light/relay_log.py lint --plan /nonexistent
#   → stderr: "lint: HC-RL-A18 cannot read relay_plan.md: [Errno 2] ..." / exit 2   ← 见 P2-3
python3 tools/relay-light/relay_log.py --help                       # 子命令集合仅 {lint}
```

行为探针（scratchpad 内 `probe.py` / `probe2.py` / `probe3.py`，直接 import 生产模块，未改仓内文件）覆盖：表尾分组、marker 五字段、decision_mode 四态、recipe 非法、agent.node 缺失、同节点重名、缺表头、缺文件、stage_id 格式非法、superseded 变体、跨卡默认依赖、竖线+缺列、双表无空行相邻。关键输出已引用在下方各条。

---

## 逐条问题

### P0（阻塞发布 / 数据丢失 / 安全）：**0 条**

无。本批不触网、不写外部文件、无凭据面、无删除或覆盖路径；`relay_log.py` 只读计划文件，无任何写盘调用。

---

### P1（阻塞任务目标）：**2 条**

#### P1-1 · HC-RL-A86「同阶段节点分组连续」在**表尾位置漏检**，且判定式第二分支为死代码

`relay_log.py:260-267`：

```python
stage_runs: list[str] = []
for node in active_nodes:
    if not stage_runs or stage_runs[-1] != node.stage_id:
        stage_runs.append(node.stage_id)
if len(set(stage_runs[:-1])) != len(stage_runs[:-1]) or (
    stage_runs and stage_runs[-1] in stage_runs[:-1] and stage_runs.count(stage_runs[-1]) > 2
):
    raise _error("HC-RL-A86", "nodes for a stage instance are not grouped contiguously")
```

**实测漏检**（probe.py，`tail-interleave C1,R1,C2` → `PASS (no violation)`）：

```
| C1 | DHR_90 | DHR_90:C#1 | construction | | | |
| R1 | DHR_90 | DHR_90:R#1 | review | | C1 | |
| C2 | DHR_90 | DHR_90:C#1 | construction | | C1 | |     ← C#1 被 R#1 隔断，lint 通过
```

`stage_runs = [C#1, R#1, C#1]`：第一分支只查 `stage_runs[:-1]`（= `[C#1, R#1]`，唯一）→ 不报；第二分支要求 `count(last) > 2`（即 ≥3 段）→ 不报。

现有测试之所以绿，只是因为其反例 fixture（`test_stage_must_be_known_and_grouped_contiguously`，测试文件 L148-162）**尾部多了一行 F1**，把重复挤进了 `[:-1]`。**规则边界本身没有任何测试咬住。**

第二分支可证为死代码：`count(last) > 2` 蕴含 `last` 在 `[:-1]` 中出现 ≥2 次，则第一分支必已为真。即该 `or (...)` 永远不改变结果，作者意图无法从代码中被验证。

口径冲突需施工方显式表态（**两种读法都要求改动**）：
- 若表尾放宽是**有意**的（design §4.3「追加行落在表尾也通过」/§4.5.4 lint 放宽）：该放宽的验收项是 **HC-RL-A120，DevPlan 归属 RLT_09**（开发方案 L563），不在本卡 15 条之内；须补正例测试 + 注释显式声明，并删掉死分支。
- 若非有意：这是 HC-RL-A86 的 fail-open，验收表明写「同 stage 节点被另一 stage 隔断」必须被拒（design L1126），当前不成立。

**结论：brief 完成条件 #6「分组连续」在表尾场景下未成立，本批不能按「A86 已证」收口。**

#### P1-2 · HC-RL-A18 与 HC-RL-A90 被 progress 记为已覆盖，但测试文件里**没有对应断言**

`progress.md` E-003/E-004 声称本批 15 条 HC 已「先红后绿」。逐条比对测试文件后：

| HC-ID | 冻结验收要求的反/正例（design §11.1） | 测试文件实际 | 判定 |
|---|---|---|---|
| HC-RL-A18 | 缺 `skill`/`session`/`recipe`/`cards` **各一例被拒**；省略 `decision_mode` 的 plan 过 lint | **零测试**（`assert_rule("HC-RL-A18", ...)` 一次都没出现） | **未证** |
| HC-RL-A90 | 两个合法值各一例、非法值一例被拒、省略一例派生为 `auto` | 仅 `test_valid_plan_defaults_decision_mode...` 断言省略→`auto`；**无 consult 正例、无非法值反例** | **未证（1/4）** |

行为本身是存在的（本复核用探针实测：缺四字段各自报 `HC-RL-A18`，`AUTO`/`yes` 各报 `HC-RL-A90`，`consult` 通过），但**本卡验收口径要求的是单测**，heavy 档不能靠复核者的一次性探针替代。brief 完成条件 #8 直接点名这两条。

---

### P2（质量 / 证据缺口）：**6 条**

#### P2-1 · marker 强制要求 `generated=`，比冻结合同更严，会拒掉合法计划

`relay_log.py:87` 把 `generated` 列进必填集合。但 design §3.5 lint 映射表（L391）与 HC-RL-A18（L1146）**只列 `skill=` / `session=` / `recipe=` / `cards=` 四项必填**（`decision_mode=` 可省）。实测：去掉 `generated=` 的 marker 被拒为 `HC-RL-A18: marker missing generated=`。

fail-closed 方向的过严也是偏离——它让一份符合冻结合同的计划无法过 lint。要么按合同放开，要么在 design 侧增补必填项（但 design/ 是本卡禁区，只能记 finding 交用户）。

#### P2-2 · 目标范围漂移：实现并抛出别卡拥有的验收编号，且本卡无测试

| 编号 | DevPlan 归属 | 本批落地位置 |
|---|---|---|
| `HC-RL-A116`（recipe 值合法性） | **RLT_05**（开发方案 L561） | `relay_log.py:236-237` |
| `HC-RL-A89`（跨阶段依赖只指向前面阶段） | **RLT_05**（开发方案 L547） | `relay_log.py:278-285` |
| `HC-RL-A120`（表尾放宽） | **RLT_09**（开发方案 L563） | `relay_log.py:264-266`，见 P1-1 |

brief「Out of scope」明文含「RLT_05 所属完整 status/配置/Recipe/止损」。这三处都是**无本卡测试的活代码**，且会在 RLT_05/RLT_09 的验收里被重新认领——届时要么重复举证，要么被迫接受既成实现。建议：要么删回本卡范围，要么在 `findings.md` 显式登记「提前实现、留待 RLT_05/RLT_09 举证」，由主控裁决，不要静默留着。

#### P2-3 · 计划缺失 / 解析失败被当成「lint 规则违反」，退出码与错误前缀均与冻结合同相反

- design §3.1（L179）：`lint` 退出码 `0` 通过 / `2` 规则违反 / **`3` relay_plan 缺失或解析失败**；HC-RL-A5 同口径。
- design §3.5（L381、L383）：一般错误走 `error: <code> <message>`，lint 违反项才走 `lint: <规则编号> <message>`。

实测：`lint --plan /nonexistent` → stderr `lint: HC-RL-A18 cannot read relay_plan.md: ...`、**exit 2**。缺文件既不是 A18 语义（A18 是 marker 字段），也不该走 `lint:` 前缀，更不该退 2。

根因是分层被简化掉了：task_plan §施工原则要求 `RelayError(exit_code, code, message)`，实现只保留 `(code, message)`（`relay_log.py:21-27`），于是 `_lint_command`（L340-347）只能对所有异常一律返回 2。批 2 要补齐 0/2/3/4 时必须回改这个结构。A5 属批 2，本条不要求本批完成，但**已落的 CLI 行为与合同相反且零测试**，应在本批标注或就地修正，别让它以「已实现」的姿态过审。

#### P2-4 · `main()` / `_lint_command` 已落地但**零测试**

批 1 的 12 个测试全部直接 `import` 后调 `lint_plan()`，无一条经过 CLI。已交付的 argparse 装配、退出码映射、stderr 通道（HC-RL-A63 关注面）完全没有回归网。建议本批至少补一条 CLI smoke（合法计划 exit 0、违反 exit 非 0、错误只进 stderr）。

附带记录（不构成本批缺陷）：`lint --json` 与「违反项每条一行」（design §3.1/§3.5）尚未实现；其验收项 HC-RL-A80 归 RLT_10，四批 task_plan 均未安排，需主控确认由谁承接。

#### P2-5 · 红测证据是**导入错误红**，不是行为红

E-003 记录的红为 `ModuleNotFoundError: No module named 'relay_log'`、`Ran 1 test`——15 条 HC 的断言坍缩成一次导入失败，**没有任何一条规则被单独证明具有判别力**。

task_plan 批 1 步骤 1 字面只要求「因生产模块/行为缺失而断言红」，故不算违规；但 P1-1 已实证后果：测试全绿并不等于规则成立（A86 的反例 fixture 尾部多一行就换了触发路径，作者未察觉）。批 2/批 3 的 task_plan 明确要求「失败必须是行为断言，不是语法/导入错」，建议本批就把习惯建立起来：对每条新规则，先在生产模块已存在的状态下确认反例红。

#### P2-6 · HC-RL-A109 的「跨卡并行通过」正例并没有构造出并行结构

测试文件 L188-202 的正例：

```
| W1 | DHR_90 | DHR_90:W#1 | build | | | |
| W2 | DHR_91 | DHR_91:W#1 | build | | | |     ← depends_on 留空
```

`depends_on` 留空按「依赖前一个非 superseded 节点」解析，实测 `W2.depends_on = ('W1',)`——两张卡实际被**串**起来了，正例只证明了「串行不报错」，没证明「跨卡可并行」。design §11.1 HC-RL-A109 要求的是「跨卡两阶段**并列**通过」。

同时暴露一个待确认的语义：默认依赖会**跨卡**指过去。design §4.1 只写「留空 = 依赖前一节点」，未排除跨卡；若跨卡计划里前一行恰是另一张卡的节点，就会产生非预期的卡间串行。建议正例改为显式 `depends_on` 留空以外的写法（或第二张卡首节点显式留空但同时断言其 depends_on 为空），并把跨卡默认依赖的口径记进 `findings.md` 请主控确认。

---

### P3（后续不阻塞）：**5 条**

- **P3-1 · superseded 判定前缀过松且目标不校验**：节点行要求 `note.startswith("superseded-by:")`（L145），agent 行只要 `startswith("superseded")`（L180）。实测 agent note 写「supersededness unclear」即被判废弃，进而使该节点被判空节点（`HC-RL-A75`）——方向 fail-closed，但语义是错的。另 `superseded-by:`（空目标）被接受，且从不校验目标节点是否存在（design §4.4 要求 `superseded-by:<新节点号>` 单值指向）。
- **P3-2 · 「单元格禁竖线」与「列数不符」不可区分，且同时发生时会错位解析**：`_table_rows` 只按 `len(values) != len(header)+2` 判定（L108）。实测 `| W1 | DHR_90 | DHR_90:W#1 | build | | a|b |`（少一列 + 一个竖线）恰好凑成 7 格，被错位解析，最终以 `HC-RL-A48 unknown dependency a` 报错——侥幸 fail-closed，但编号与真因不符。
- **P3-3 · `tools/relay-light/__pycache__/*.pyc` 未被 `.gitignore` 覆盖**：本卡允许路径只有两个 `.py`，但 `git add tools/relay-light/` 会把 `.pyc` 一并带入。`.gitignore` 无 `__pycache__`/`*.pyc` 条目（已 grep 确认）。`.gitignore` 不在本卡允许路径内，建议记 `findings.md` 交主控。
- **P3-4 · HC-RL-A104 只测了前缀不符**：缺「格式非法」反例（实测 `W1stage` 会被拒，行为存在）与「合法例断言解析出 `card`/`stage`/`k` 三段」的正例断言，后者是 design L1127 明写的证明方式。
- **P3-5 · 冗余与小噪音**：`_error()`（L71-72）是无附加语义的纯转发；`print("lint: ok")` 走 stdout，合同未定义成功行（不影响 HC-RL-A63，因其只约束错误通道）；`lint_plan` 内两处 `next(i for i, candidate in ...)`（L282-283）在节点数增长时是 O(n²)，可用一次性索引字典替掉。

---

## 复核范围内的正面确认（供主控参照，不构成放行）

- **fail-closed 主干成立**：marker 不匹配即拒、找不到固定表头即拒、缺分隔行即拒、表格列数不符即拒，均不做猜测（design §4.1「找不到表头即报错，不猜」已落实）。
- **A46/A47/A48/A72/A75/A87/A88/A35/A71** 各有至少一条**行为红→绿**的反例测试，且本复核逐条探针复验行为与编号一致；A24 的「默认依赖 = 前一非 superseded 节点」有正例断言（测试文件 L84）。
- **纯解析、无副作用**：`relay_log.py` 全文无写文件、无 `lower()`/`casefold()`、无锁、无 tempfile、无 `os.replace`；只 `import argparse/re/sys/dataclasses/pathlib`，全标准库（HC-RL-A16/A42/A40 方向正确，正式举证在批 2）。
- **diff 边界干净**：`git diff --name-only master...HEAD` 为空，工作区改动仅落在两个允许的 `tools/relay-light/*.py`、`workspace/RLT_03/**`；DevPlan 的工作区改动经 diff 核对确属主控预置状态行，非本批施工产物；`git diff --check` exit 0。

---

## 结论

**changes-requested**

- 必须闭合：**P1-1**（A86 表尾漏检 / 死分支 / 口径表态）、**P1-2**（A18、A90 补齐单测）。
- 建议在进入批 2 前一并处理：**P2-1**（`generated=` 过严）、**P2-3**（lint 退出码 3 与 `error:` 前缀，含 `RelayError` 携带 exit_code 的结构回补）、**P2-6**（A109 正例）；**P2-2** 的范围漂移三处至少要在 `findings.md` 显式登记并由主控裁决。
- P2-4/P2-5 属过程质量，影响后续批次证据强度，建议就地建立习惯。
- P3 五条记入 `findings.md` 即可，不阻塞本批。

本复核为**代码轮 1 的 batch 1 小审**，只登记事实与级别，**不做验收裁决**，不代签 verify。
