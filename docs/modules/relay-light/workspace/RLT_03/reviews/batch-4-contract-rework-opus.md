<!-- dh:v1 -->
# RLT_03 · Batch 4 contract-rework=RLT-B-04 独立只读复核（fresh Opus）

## VERDICT

**VERDICT=CHANGES_REQUESTED**

| 级别 | open 数量 |
|---|---:|
| P0 | 0 |
| P1 | 0 |
| P2 | 2 |
| P3 | 4 |

本批的核心交付——`A64→A128`、`A86→A129`、`A88→A126`、`A90→A130` 的编号迁移与 A73 去标签——在**生产代码与测试内已完整、正确、可判别、无越界、无行为回归**，53 tests 独立复跑 exit 0，独立反向变异复现出 E-044 所称的恰好 5 处编号失配红。

不给 APPROVE 的原因是两项 P2 证据/口径缺口，均落在本卡允许路径的 workspace 工件内、均不需要改一行代码：
1. `findings.md` 仍有一条 **open** finding（F-003）以**活动口径**引用退役号 `A86`，与本批自述目标「清除退役编号」和 RLT-B-04 §2.9「全文检查不再以活动口径引用 A64/A86/A88/A90」直接冲突；
2. `progress.md` 矩阵收口句宣称 42 ID「全部闭合、无 partial」，但 A128 在正式 design 的取证方法要求「逐项覆盖四个例外」，其中第四个例外 A120（表尾放宽）经实测**未覆盖且当前实现为拒绝**，属被 RLT-B-04 明文授权的越界不做，但矩阵未如实标注。

两项修完即可 APPROVE。

---

## 复核基线与只读证明

- 分支 `wt/RLT_03`，HEAD `baf2aad6aa5cf5b8fc0941411bbb30a0ebac8a6b`，`git diff --name-only master...HEAD` 为空（未 commit）。
- 复核**前后**生产/测试 SHA-256 保持不变：
  - `tools/relay-light/relay_log.py` = `e62ba2a073b1008b7a6da21506c9de4baad80f1e7e045d5454612bd14637ee8d`
  - `tools/relay-light/test_relay_log.py` = `1fbf726d3df31a3e898e6833729a550ad681ca5845cf4f236ac57a79dd93ba16`
- 工作树入场即有的 `M design/01`、`M P1-开发方案`（主控 RLT-A-04/RLT-B-04 WIP，diffstat 仅两文档 55+/44-）与未跟踪 `workspace/RLT_03/`、`tools/relay-light/` 状态保持；本 reviewer 未改生产、测试、design、DevPlan、`brief.md`、`task_plan.md`、`progress.md`、`findings.md`、`review.md` 或既有 review。
- 唯一持久写入为本报告。所有变异只在 `<scratchpad>/mut1` 隔离副本内执行。
- 复核过程生成的 `tools/relay-light/__pycache__` 已按精确路径 `rm` + `rmdir` 清除；`find tools/relay-light -mindepth 1` 现仅两个 py 文件。
- 未 commit、未 verify、未改 DevPlan 状态列、未进入验收、未启动 RLT_05 或下一节点。

---

## 审核重点 1 — 新 owner 映射完整性与退役号活跃残留

### 1.1 映射本身：完整且语义正确 ✅

以正式 `design/01` §11 与 DevPlan §3.2 RLT_03 卡逐条比对，四条迁移全部落到语义对应的规则点：

| 迁移 | 生产落点 | 语义核对（design/01） |
|---|---|---|
| `A64 → A128` | 无错误码（正确）；`relay_log.py:751` 注释 + 测试 docstring `:283/:300/:656` | `:1129` A128 = 「parser/lint 派生活跃计划时忽略 superseded 行」，是**正向行为**而非拒绝规则，本就不该有 error code |
| `A86 → A129` | `relay_log.py:318`（stage 值非枚举）、`:329`（阶段实例分组不连续） | `:408/:409` 两行 lint 映射表均标 A129；`:1132` §11 取证方法一致 |
| `A88 → A126` | `relay_log.py:322`（禁止 node type） | `:413` lint 映射表标 A126；`:1150` §11 一致；原 A88 的映射禁项子句已由 A92(RLT_05)/A127(RLT_07) 承接 |
| `A90 → A130` | `relay_log.py:291`（decision_mode 非法值） | `:399` lint 映射表标 A130；`:462` 默认值 auto 段与 `:1156` §11 一致 |

**A64/A73 从未是 error code**：反向变异（见 §3.1）对 `relay_log.py` 只替换 A86/A88/A90 三串即得到干净 diff，证明当前文件内不存在任何 A64/A73 站点被「删除而非改名」的可能；`tools/relay-light/` 退役号 grep 零命中。

### 1.2 生产/测试内退役号残留：零 ✅

```text
grep -n "A64|A86|A88|A90|A73"  tools/relay-light/relay_log.py       → 0 hit
grep -n "A64|A86|A88|A90|A73"  tools/relay-light/test_relay_log.py  → 0 hit
```

`brief.md`、`task_plan.md`、`execution_strategy.md`、`review.md`、`lesson_candidates.md` 亦零活动残留（`task_plan.md:55` 出现的四个旧号是**迁移指令本身**，属必需引用）。

### 1.3 **P2-1 · `findings.md` F-003（open）仍以活动口径使用退役号 A86**

```text
findings.md:11 | F-003 | P2 | …其中严格 A86 与 RLT_09/A120 表尾放宽有前向冲突 |
              … | 已移除 A116、A89 与 A120 特判；本卡严格执行 A86。 | open |
```

这不是历史叙述（对比 F-004/F-029 中的旧号是「当时做了什么」的留痕，可接受），而是一条 **status=open** 的现行约束陈述：「本卡严格执行 A86」描述的是**当前生产代码此刻的行为**。RLT-B-04 §2.9 要求「全文检查不再以活动口径引用 A64/A86/A88/A90」，本批 progress 亦自述目标为「清除退役编号」，此处即最后一处活动残留。

进一步：**该冲突的性质在 RLT-A-04 后已经改变，F-003 的措辞也随之失准**。原措辞把它定为「本卡严格 A86 与 RLT_09/A120 的**前向**冲突」；但 RLT-A-04 之后，表尾豁免文本已经出现在**本卡自己拥有的 A129 规则行内**：

```text
design/01:409 | 同一阶段的节点未按 stage 分组连续（忽略 superseded 行；§4.5 的追加行落在表尾不算违规） | HC-RL-A129 |
design/01:1132 | HC-RL-A129 | …同一阶段的节点按 stage 分组连续（忽略 superseded 行） | 单测：…同 stage 节点被另一 stage 隔断各一例被拒… |
```

即 §3.5 lint 映射表的 A129 行**带** §4.5 表尾豁免，§11 的 A129 取证方法**不带**。当前实现按 §11 执行（隔断即拒），是可辩护的，但冲突已从「跨卡前向」变为「本卡 A129 的两处 design 文本自身分歧 + RLT_09/A120 兜底」。

**要求**：F-003 的问题/处理两列把 `A86` 改为 `A129`，并把冲突重述为「design §3.5(:409) 与 §11(:1132) 对 A129 是否含 §4.5 表尾豁免不一致；本卡按 §11 严格执行，放宽归 RLT_09/A120」。仅改 `findings.md`，不动代码。

---

## 审核重点 2 — A73 是否完全留给 RLT_05

**✅ 完全留出，未偷做完整 status。**

- `A73` 在 `relay_log.py` 与 `test_relay_log.py` 全文零命中；`_status_command`（`relay_log.py:748-757`）仍是 batch-2 最小 stub：空账本 `--json` 只输出 `{current_stage, current_node, pending_nodes}`，非空账本 `pending_nodes` 直接返回 `[]`、文本路径只打印 `status: N ledger entries`。
- **RLT_05 契约面零实现**：`open_stages` / `superseded_ignored` / `last_stage_result` / `suggested_action` / `monitor_relaunch_count` / `stages` / `nodes` / `agents` / `errors` / `plan.decision_mode` 在生产源码全部零命中；`roles.toml` / `dh-mapping` / Recipe / limits / on_exceed 零命中。（`relay_log.py:30` 的 `"stage_result"` 是 19 事件词表成员，`:111/:134/:243` 的 `recipe` 是 marker 必需字段，均非 RLT_05 面。）
- **相关测试口径诚实**：`test_status_and_lint_match_with_and_without_superseded_rows`（`:655-679`）docstring 写的是「superseded rows leave lint and **status observables** unchanged」，标 A128 而非 A73——正确地只承诺当前可观察面，未把 stub 差分冒充 A73 的完整投影差分等价。
- 与前轮相比这是实质进步：`batch-4-recheck-sol.md` 当时只能给「closed **within current RLT_03 observable surface**」的限定闭合，现在 owner 已正式归 RLT_05，限定语被正式合同取代。F-030/F-031/F-032 在 `findings.md:38-40` 均已 resolved 并指向正式 A/B 裁决——独立复核认可该闭合方式（是 owner 重划而非施工越界修复）。
- 未实现 RLT_07 模板、未实现 RLT_09 运行中改计划：`--help` 仅 `{add,status,lint}`，exit 0。

---

## 审核重点 3 — 53 tests 与 E-044/E-045 红绿是否足以判别

**✅ 判别力充分，且未把纯编号换名误称为行为扩展。**

### 3.1 独立反向变异（复现 E-044 的红）

在隔离副本对**生产文件**只做三串替换（`A130→A90`、`A129→A86`、`A126→A88`），先 `diff` 验证除这三串外**逐字节相同**，再跑未变异的测试：

```text
mutation-only-ids OK
Ran 53 tests in 25.186s
FAILED (failures=5)
exit=1
```

5 处失败全部是 `assert_rule` 的 `AssertionError: 'HC-RL-A129' != 'HC-RL-A86'` 一类**纯编号失配**，无异常、无次生 kill，与 E-044 逐字吻合（`test_decision_mode_accepts_frozen_values_and_rejects_others` ×1、`test_stage_must_be_known_and_grouped_contiguously` ×1、`test_card_and_node_type_are_limited` ×1、`test_forbidden_types_are_the_sole_violation_in_legal_plans` kickoff/verify-signoff ×2）。**结论：新 ID 断言对旧编号实现具备精确判别力，红是真红。**

### 3.2 绿（E-045 复现）

```text
python3 -m unittest tools/relay-light/test_relay_log.py
Ran 53 tests in 26.003s
OK
exit=0
```

无管道、无 `tee`、无 `|| true`。`python3 -m py_compile` 两文件 exit 0；`git diff --check` exit 0。

### 3.3 未误称行为扩展 ✅

- 测试数 **53 → 53**，本批未增删测试，与「纯编号迁移」自洽。
- `progress.md` 日志行写的是「先红后绿（**5 处规则编号失配红**→53 tests OK 绿）」，E-044 结论列明写「**仅编号归属迁移、行为与退出码不变，红全部为编号判别**」，F-036 处理列同样限定「先红（5 处规则编号失配，行为与退出码不变）」。三处口径一致且诚实，**没有**把重命名包装成新覆盖或新行为。这一点符合本卡自 F-004（ModuleNotFoundError 不算有效红）、F-029（late-added coverage 如实登记）以来建立的证据纪律。

### 3.4 无行为回归（独立真 CLI 对抗复跑）

不依赖仓内测试，另起真 CLI + `TemporaryDirectory` 复跑前几轮建立的关键闸：

| 场景 | 期望 | 实测 |
|---|---|---|
| A18 `plan_loaded` note `""` / `"skill="` / `"version=1"` | rc=2 A18 且不落行 | rc=2，`error: HC-RL-A18 …`，ledger 空 ✅ |
| A18 合法 `skill=0.1.0` | rc=0 | rc=0 ✅ |
| A2 `Plan_Loaded` / `node_started` / `NODE_START` | rc=2 A2 且不落行 | rc=2，字节不变 ✅ |
| A69 `escalate(note="")` | rc=2 A69 不落行 | rc=2 `decision note must carry exactly …` ✅ |
| A69 `escalate(decider=other#9)`（kind 与实例不匹配） | rc=2 A69 不落行 | rc=2 ✅ |
| A69 `escalate(decider=decider#1)` | rc=0 | rc=0 ✅ |
| A69 `decision(decider=decider#2)`（同 kind 异实例，F-035 判别器） | rc=2 A69 不落行 | rc=2 ✅ |
| A69 `decision(decider=decider#1 free text)` | rc=0 | rc=0 ✅ |
| A37/A38/A39 20 次 add | seq 1..20、前缀字节严格单调、目录集合前后相等 | 三项全 True ✅ |
| A55/A51 七字段键集合 | `(agent, by, event, node, note, seq, ts)` 精确、无 pane | 20 行唯一键集合即该七键 ✅ |
| A45 账本不可读（路径为目录） | status rc=4、stdout 空、stderr `error: ledger ` | ✅ |
| A5 缺计划 × add/status/lint | 三命令均 rc=3 | 三条全 rc=3 ✅ |
| A63 错误通道 | 仅 stderr、统一 `error: <code> <message>` | ✅ |

**结论：batch 1~3 与 batch 4 rework=1（含主控补洞 F-034、F-035）建立的全部行为闸在编号迁移后无一回归。**

### 3.5 静态守卫

`.lower(` / `.casefold(` / `flock` / `fcntl` / `LockFile` / `tempfile` / `NamedTemporary` / `os.replace` / `shutil.move` / `os.rename` / `pane` 在 `relay_log.py` **全部零命中**；追加仍只有一处 `open(ledger_path, "a", encoding="utf-8", newline="")`（`:726`）。A39/A40/A42/A51 静态面成立。

---

## 审核重点 4 — 42-ID 矩阵与正式 DevPlan 一致性

### 4.1 集合相等：✅ 精确一致

机械比对三方（脚本核算，非目视）：

| 来源 | 数量 | 结果 |
|---|---:|---|
| DevPlan §3.2 RLT_03 卡内 `HC-RL-A*` 去重 | 42 | 基准 |
| `progress.md` 收口句「RLT_03-owned 42 个 HC-ID」列表 | 42 | **与卡完全相等**（双向差集皆空） |
| DevPlan §6 owner 对照表中 owner=RLT_03 的 ID | 42 | **与卡完全相等** |

集合内容：`A2 A5 A17 A18 A24 A35 A37 A38 A39 A40 A41 A42 A45 A46 A47 A48 A49 A50 A51 A55 A56 A58 A59 A60 A63 A68 A69 A70 A71 A72 A74 A75 A77 A78 A84 A87 A104 A109 A126 A128 A129 A130`。

前批口径「43 个 HC-ID」→ 本批「42 个」的差额可整除核对：`43 − {A64,A86,A88,A90,A73} + {A126,A128,A129,A130} = 42` ✅。

### 4.2 §6 全表健康度：✅

- 全表 107 个 A 号，**无重复 owner**（Counter 检查 dups=∅），与正式口径 `107 A + 15 H = 122` 自洽。
- 退役号 `A64/A86/A88/A90` 在 §6 **零 owner** ✅。
- `A73 → RLT_05`（`:543`）、`A62 → RLT_05`（`:538`）、`A61 → RLT_05`（`:537`）、`A127 → RLT_07`（`:549`）、`A92 → RLT_05`（`:552`）、`A120 → RLT_09`（`:566`）——`progress.md` 收口句列出的「非本卡 owner 边界（A61/A62/A73/A85/A89/A92 归 RLT_05、A127 归 RLT_07、A120 归 RLT_09）」**逐条属实** ✅。
- `brief.md` 完成条件表（条件 4/6/7/8）已同步为 A128/A129/A126/A130，`task_plan.md` 批 1 覆盖清单同步 ✅ —— RLT-B-04 §2.8 的 workspace 合同同步项已落实。

### 4.3 **P2-2 · 矩阵对 A128 宣称「无 partial」与正式取证方法不符**

`progress.md` 收口句：

> 上表 16 组 brief 条件已与 42 个 ID 全部对应并闭合（E-044/E-045：先红后绿、53 tests OK）：矩阵无退役编号、**无 partial**、无 blocker。

但正式 design 对 A128 的取证方法是：

```text
design/01:1129 | HC-RL-A128 | …显式例外封闭为 A46 节点号占用、A72 禁止依赖 superseded、A75 空节点、A120 表尾/隔断放宽
                            | …；逐项覆盖四个例外 |
```

实测四个例外的当前状态（真 CLI，隔离目录）：

| 例外 | 要求 | 实测 | 覆盖测试 |
|---|---|---|---|
| A46 节点号占用（含 superseded） | 拒 | ✅ | `test_node_number_is_unique_even_when_superseded` |
| A72 依赖 superseded | 拒 | ✅ | `test_dependencies_cannot_target_superseded_nodes` |
| A75 空节点 / agent 全 superseded | 拒 | ✅ | `test_each_active_node_needs_an_active_agent` |
| A120 **被 superseded 行隔开**放宽 | 通过 | `rc=0 lint: ok` ✅（由 `active_nodes` 过滤天然成立） | 无指定断言 |
| A120 **同 stage 追加在表尾**放宽 | 通过 | **`rc=2 HC-RL-A129 nodes for a stage instance are not grouped contiguously`** ❌ | 无 |

对照组：真正的「中间隔断」反例（`W1,C1,W2,C2`）同样 `rc=2 A129` ✅ ——即当前实现**不区分**表尾追加与中间隔断，一律拒绝，比 A129 §11 要求更严。

这**不是**本批的越界或回归：RLT-B-04 §1 明文「A128 只证 parser/lint 行为，不提前实现 RLT_09 的运行中改计划机制」，F-003 亦已登记该严格执行决定。**问题只在矩阵的收口措辞**——它把「本卡授权范围内闭合」写成了无限定的「全部闭合、无 partial」，而 A128 的第四个冻结例外经实测有一半未成立且**必然**要由 RLT_09/A120 反转。这正是 `batch-4-recheck-sol.md` 当初对 A64 坚持写「closed **within current RLT_03 observable surface**」的同一条纪律。

**要求**：`progress.md` 矩阵行 4 或收口句加一句限定，例如：「A128 的四个封闭例外中 A46/A72/A75 已逐项取证并闭合；第四例外 A120（表尾/隔断放宽）按 RLT-B-04 归 RLT_09——其中『被 superseded 行隔开通过』当前已成立，『同 stage 追加在表尾通过』当前按 §11 严格拒绝，须由 RLT_09 显式反转（见 F-003）」。仅改 `progress.md`，不动代码。

---

## 审核重点 5 — 超范围与回归

**✅ 未发现超范围，未发现回归。**

| 检查 | 结果 |
|---|---|
| `git status --short` | 仅入场既有的 `M design/01`、`M P1-开发方案`（主控 RLT-A-04/RLT-B-04 WIP）+ 未跟踪 `design/drafts/A04-*`、`design/evidence/05-*`、`dev_plan/drafts/RLT-B-04-*`、`workspace/RLT_03/`、`tools/relay-light/` |
| `git diff --name-only` | 仅上述两份文档；diffstat 55+/44−，纯文档，无代码/工作区内容混入。E-045 所称「主控预置、本批未触碰」与工作树状态自洽 |
| `git diff --name-only master...HEAD` | 空——未 commit ✅ |
| `git diff --check` | exit 0 ✅ |
| 允许路径 | 变更只落在 `tools/relay-light/{relay_log,test_relay_log}.py` + `workspace/RLT_03/**`，与 DevPlan `dh:allowed-paths:v1 task=RLT_03` 三条一致 ✅ |
| `tools/relay-light/` 目录内容 | 仅两个 py 文件，无临时文件、无 `__pycache__`（A39）✅ |
| CLI 表面 | `--help` 仅 `{add,status,lint}`，exit 0；无第四子命令 ✅ |
| RLT_05/07/09 面偷跑 | 见重点 2，全部零命中 ✅ |
| `review.md` | 未被本批改动 ✅ |
| 状态列 / verify / commit / 下一卡 | 均未触碰 ✅ |
| 密钥红线 | 无凭据、无窗口枚举、无截图类工件 ✅ |

---

## P3（不阻塞，登记备查）

### P3-1 · 空账本 pending 注释仍并列 A61/A62 与 A128/A84

```python
relay_log.py:748  # Intentional RLT_05 placeholder (HC-RL-A61/A62): the full nonempty-ledger
            :749  # status lifecycle is deliberately NOT implemented in RLT_03. Only the
            :750  # empty-ledger pending_nodes projection required by HC-RL-A84 is live;
            :751  # superseded rows are excluded from it (HC-RL-A128/A84).
```

RLT-B-04 的指令是「空账本 pending 注释与对应测试**只保留 A128/A84**」。第 751 行确已只剩 A128/A84、A73 已去除 ✅；但 748 行的 A61/A62 仍在。核对 `findings.md:35` F-023 后判定：**A61/A62 是 F-023 明确要求的 RLT_05 占位声明**，与 A128/A84 的 pending 语义标注是两件事，二者共存不违约，且 A61/A62 归 RLT_05 属实（§6 `:537-538`）。仅建议后续把两句拆成两段注释，让「只保留 A128/A84」这句指令的适用面一眼可辨。**无需本轮处理。**

### P3-2 · 无法对基线做字节级 diff，"行为与退出码不变" 不可字节自证

`tools/relay-light/` 全程未跟踪，前轮基线 `relay_log.py = 3d6f2510…` 已被覆盖且不可复原（我尝试用「反向替换三串 ID + 还原注释」的四种候选重构，SHA 均不匹配）。因此本批「仅编号迁移、行为不变」这一断言**无法用 diff 直接证明**，只能靠 §3.1 反向变异 + §3.4 独立真 CLI 对抗复跑 + §3.5 静态扫描三路旁证（三路均通过，故不升级为 P2）。

**建议主控**：在下一次窄返工前，把两个 py 文件精确暂存或落一笔 WIP commit（或至少每批在 `progress.md` 登记文件 SHA-256），使后续复核可直接 diff。此项与 F-008（`.gitignore` 未覆盖 `__pycache__`、不在本卡写权限内）同属收口时需主控精确处理的暂存问题。

### P3-3 · F-004 / F-029 历史叙述保留退役号

`findings.md:12`（F-004，resolved）「以 E-006 的 A86 表尾反例…」与 `:37`（F-029，resolved）「A88 verify-signoff、A64 默认依赖跳过 superseded」保留旧号。二者均为 **resolved 的当时事实留痕**，与 P2-1 的 open/活动口径性质不同，按 AGENTS 留痕原则**应按原样保留、不做"修正"**。仅登记，避免后续有人 grep 到旧号后误改历史。（`progress.md:73` E-044 同理，且其结论列已显式写明"旧实现仍以退役编号…报错"，措辞正确。）

### P3-4 · F-003 之外的既有 open findings 未受本批影响

F-007（竖线与列数同时异常时的错误归因）、F-008（pycache ignore）、F-010（`_error` 转发 / stage 查询 O(n²)）、F-016（非语义 plan 错误的 2/3 分流张力）、F-017（`arguments`/`ledger` code 非 HC-ID 与 RLT_10/A94）、F-024（CRLF 兼容）保持 open 且本批未触及，符合「窄返工」边界。登记以确认 reviewer 已逐条核对，未遗漏未被本批掩盖。

---

## 逐条要求汇总（施工侧可闭合项）

| # | 级别 | 文件 | 动作 |
|---|---|---|---|
| 1 | P2-1 | `workspace/RLT_03/findings.md` | F-003 的问题列与处理列把 `A86` 改为 `A129`；冲突重述为「design §3.5(:409) 含 §4.5 表尾豁免、§11(:1132) 不含，本卡按 §11 严格执行，放宽归 RLT_09/A120」 |
| 2 | P2-2 | `workspace/RLT_03/progress.md` | 矩阵收口句为 A128 加限定：A46/A72/A75 三例外已逐项闭合；A120 表尾/隔断放宽归 RLT_09，其中「superseded 隔开通过」已成立、「表尾追加通过」当前按 §11 拒绝 |

两项**均不涉及生产代码或测试**，改完无需重跑红绿（建议仍复跑一次 53 tests 留证）。

---

## 收口结论

- **编号迁移交付：完整、正确、可判别、无越界、无回归。** A64→A128 / A86→A129 / A88→A126 / A90→A130 四条逐条与正式 design §11 语义对齐；生产与测试内退役号零残留；A73 完全留给 RLT_05，RLT_03 未偷做完整 status；42-ID 矩阵与 DevPlan 卡、§6 owner 表三方集合精确相等且无重复 owner；53 tests 独立绿，反向变异复现恰好 5 处编号失配红，前三批全部行为闸经独立真 CLI 对抗复跑无一回归。
- **未获 APPROVE 的两项 P2 均为 workspace 工件的口径准确性缺口**（一处 open finding 的退役号活动残留、一处矩阵闭合宣称超出 A128 实际取证范围），落在本卡允许路径内，不改一行代码即可闭合。
- 本报告只写事实与级别，不做验收裁决、不整改、不启动下一节点。

**VERDICT=CHANGES_REQUESTED**（P0=0 · P1=0 · P2=2 · P3=4）

REVIEW_DONE batch=4 contract-rework=RLT-B-04
