<!-- dh:v1 -->
# closeout code_round_1 — RLT_03 整卡第一轮独立代码复核

## 0. 身份与基线

| 项 | 值 |
|---|---|
| `review_path_id` | `code_round_1` |
| 复核者 herdr agent name | `rlt03-code1-opus` |
| pane / tab / workspace | `w15:pA` / `w15:t4` / `w15`（`HERDR_SESSION=kpi-agg`） |
| Claude session id | `934393db-73b7-4b1f-b726-c94da80c71f4`（`herdr agent list` 中 `agent=claude` 同值） |
| 自报实际模型 | Claude Opus 5（`claude-opus-5`），`CLAUDE_EFFORT=high` |
| 启动形态 | Herdr pane 内交互式 Claude Code CLI（`CLAUDE_CODE_ENTRYPOINT=cli`、`CLAUDE_CODE_CHILD_SESSION=1`），fresh context，未参与本卡任何批次小审、未参与施工 |
| 派出证据 | E-047 |
| worktree | `/home/nash/work/dh-relay/.dh-worktrees/RLT_03` |
| branch | `wt/RLT_03` |
| HEAD | `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc`（`e4b4cd6`） |
| 被审代码提交 | `b7f4ecc feat(relay-light): implement RLT_03 plan and ledger core`；`git diff HEAD -- tools/relay-light/` 为空，工作树代码 == HEAD |
| 进场工作树状态 | 仅 ` M docs/modules/relay-light/workspace/RLT_03/progress.md`（主控 E-047~E-051 派活登记），代码零未提交改动 |
| 只读承诺 | 未改一行生产/测试代码，未改 `review.md` / `progress.md` / `findings.md` / DevPlan / design，未 commit、未 push。全部对抗实验在 `TemporaryDirectory` 或 scratchpad 的副本上进行 |
| 唯一写入 | 本文件 |

**读取范围**：仓根 `AGENTS.md`；`workspace/RLT_03/` 的 `brief.md`、`task_plan.md`、`execution_strategy.md`、`progress.md`、`findings.md`、`review.md`、`lesson_candidates.md`；`reviews/` 下既有 11 份批次审核记录；DevPlan `P1-RelayLight-开发方案.md` §RLT_03 与 §6 owner 表；design/01 §3.1–3.8、§4.1–4.5、§5.1–5.3、§9.1–9.4、§10.1–10.4、§11.1；两条生产与测试 Python。**未读取**本轮其余四路（code_round_2 / 需求 / 一致性 / 教训）在本目录下同时落盘的报告，以保独立性。

---

## 1. 独立复跑：命令与退出码

全部在本 worktree 真实执行，未复用 `progress.md` 的任何既有记录。

| # | 命令 | 退出码 | 关键输出 |
|---|---|---|---|
| C-01 | `python3 --version` | 0 | `Python 3.12.3` |
| C-02 | `python3 -m unittest tools/relay-light/test_relay_log.py -v` | 0 | `Ran 53 tests in 28.027s` / `OK` |
| C-03 | `python3 tools/relay-light/relay_log.py --help` | 0 | `usage: relay_log.py [-h] {add,status,lint} ...`，只有三个子命令 |
| C-04 | `python3 -m py_compile tools/relay-light/relay_log.py tools/relay-light/test_relay_log.py` | 0 | 无输出 |
| C-05 | `git diff --check` | 0 | 无 whitespace 报告 |
| C-06 | `grep -nE "\.lower\(\|\.casefold\(\|flock\|fcntl\|msvcrt\|tempfile\|NamedTemporary\|os\.replace\|shutil\.move\|\bpane\b" tools/relay-light/relay_log.py` | 1（零命中） | 禁用原语在生产源码零出现 |
| C-07 | `grep -nE "HC-RL-A(64\|73\|86\|88\|90)\b" tools/relay-light/*.py` | 1（零命中） | 退役编号在两条代码路径零残留 |
| C-08 | `git log --oneline master..HEAD` + 逐提交 `--name-only` | 0 | 见 §5 P3-4 |
| C-09 | 42 个 owner ID 机械核算（Python 解析 DevPlan §6 表） | 0 | 见 §2 |
| C-10 | 7 组隔离变异 × 全量 53 tests | 见 §4 | 6 组存活、1 组转红 |

**卫生**：C-02/C-04 生成的 `tools/relay-light/__pycache__/*.pyc` 两条已按精确路径 `rm` 并 `rmdir`；复核结束时 `find tools/relay-light -type f` 仅余两个 `.py`。

---

## 2. 42 个当前 owner HC-ID 核算

机械解析 DevPlan §6「验收 ID → 任务卡对照」全表（122 对，无重号）：

- `RLT_03` owner 集合 = **42 条**，逐项 = `A2 A5 A17 A18 A24 A35 A37 A38 A39 A40 A41 A42 A45 A46 A47 A48 A49 A50 A51 A55 A56 A58 A59 A60 A63 A68 A69 A70 A71 A72 A74 A75 A77 A78 A84 A87 A104 A109 A126 A128 A129 A130`。
- 与 `progress.md:106` 声明的 42 条**集合精确相等**（missing=∅、extra=∅）。✅
- 与 DevPlan RLT_03 卡「验收口径」段落内出现的 42 个 ID **集合精确相等**、无重复。✅
- 生产源码内出现的非 owner ID：只有 `relay_log.py:748` 注释里的 `HC-RL-A61/A62`（F-023 要求的 RLT_05 占位声明），无实现。✅
- 测试文件内出现的非 owner ID：**零**。✅
- 退役号 A64/A86/A88/A90 与已划归 RLT_05 的 A73 在两条代码路径：**零命中**。✅

**范围边界抽核**（progress.md:106 的三条声明，逐条独立复验）：

| 声明 | 复验方法 | 结果 |
|---|---|---|
| 完整 status 生命周期（A61/A62/A73/A85/A89/A92）归 RLT_05，未实现 | 读 `_status_command`（`relay_log.py:741-757`）：非空账本只打印 `status: N ledger entries`；`--json` 只在空账本时给 `pending_nodes`，其余恒 `null`/`[]`；无 `open_stages`/`stages`/`nodes`/`agents`/`errors`/`suggested_action` 等 A62 冻结键 | 属实 ✅ |
| 五阶段模板（A127）归 RLT_07，未实现 | 无模板生成代码路径；CLI 子命令集合 = {add,status,lint}（C-03） | 属实 ✅ |
| 运行中改计划（A120）归 RLT_09，未实现 | 见 §4 的 A128 四例外实测 | 属实 ✅ |
| `by` 写入者一致性（A85）未实现 | `_writer_from_agent` 只按 agent 前缀派生，不校验事件法定写入者；A85 owner=RLT_05 | 属实、**属正确的范围边界**，非缺陷 ✅ |
| `lint --json` / 多条违反项逐行输出未实现 | design §3.1/§3.5 冻结了 `lint --plan <dir> [--json]` 与 `{"ok","violations":[…]}`，但该合同由 **A80 owner=RLT_10** 承接 | **属正确的范围边界**，非本卡缺陷 ✅ |
| `plan_loaded` 的 `config_dir=` / `plan=` 未强制 | design §3.4 要求，但取证归 **A99 owner=RLT_05**；本卡 A18 只要求 `plan_loaded` 带版本（`skill=`） | **属正确的范围边界** ✅ |
| `plan_loaded` 唯一且居首、stage_* 时序、decision_mode 两条链顺序未实现 | 分别归 A89（RLT_05）、A112/A105/A118（RLT_05）、A114/A96（RLT_07） | **属正确的范围边界** ✅ |

**结论：42 个 owner ID 的集合正确、无越界实现、无退役号残留。范围边界判断整体准确**——上面六条「没做」全部有 owner 表支撑，不构成 findings。

---

## 3. A128 四个封闭例外实测

`progress.md:106` 对 A128 的四例外限定声明，逐条真 CLI 复验（scratchpad 临时计划）：

| 例外 | 声明 | 实测 | 一致 |
|---|---|---|---|
| A46 节点号占用 | superseded 号仍占用、重复即拒 | 重复 `C1` → `lint: HC-RL-A46 line 6: duplicate node C1`，exit 2 | ✅ |
| A72 禁止依赖 superseded | 必拒 | 测试 `test_dependencies_cannot_target_superseded_nodes` 断言 A72；suite 绿 | ✅ |
| A75 空节点 | 必拒 | design §10.1 原样样张 → `lint: HC-RL-A75 line 9: node C2 has no active agent`，exit 2 | ✅ |
| A120 表尾/隔断放宽 | 「被 superseded 行隔开通过」已成立；「同 stage 追加在表尾」按 §11 严格拒绝，须 RLT_09 反转 | ① superseded 行隔开 → `lint: ok` exit 0；② `C1(C#1) / R1(R#1) / C2(C#1)` 表尾追加 → `lint: HC-RL-A129 nodes for a stage instance are not grouped contiguously` exit 2 | ✅ 两条声明**逐字属实** |

---

## 4. 有效单测判别力：7 组隔离变异

方法：把两条 `.py` 复制到 `tempfile.mkdtemp()`，只改生产文件一处，跑 `python3 -m unittest test_relay_log -q`，随后删除副本。仓内源码全程未被触碰（C-04/C-05 复跑仍 0）。

| 变异 | 锚点 | 全量 53 tests |
|---|---|---|
| M1 | **整块删除** `_validate_agent_transition` 的 A49 重拉资格闸（`relay_log.py:637-640`） | **rc=0 · Ran 53 · OK（存活）** |
| M2 | `HC-RL-A70` → `HC-RL-A77`（`relay_log.py:551`） | **rc=0 · OK（存活）** |
| M3 | `HC-RL-A74` → `HC-RL-A17`（`relay_log.py:680`） | **rc=0 · OK（存活）** |
| M4 | `HC-RL-A78`（node_start 依赖分支）→ `HC-RL-A68`（`relay_log.py:697`） | **rc=0 · OK（存活）** |
| M5 | `HC-RL-A68`（重复 node_close 分支）→ `HC-RL-A17`（`relay_log.py:666`） | **rc=0 · OK（存活）** |
| M6 | `HC-RL-A77` → `HC-RL-A70`（`relay_log.py:547`） | **rc=0 · OK（存活）** |
| M7 | `HC-RL-A59`（agent 不属本节点）→ `HC-RL-A69`（`relay_log.py:532`） | rc=1 · `FAILED (failures=1)`（被杀死 ✅） |

M1 的行为差分另做真 CLI 直证（同一副本机制）：

```
REAL   agent_launch coder#2 while coder#1 alive: rc=2  error: HC-RL-A49 agent coder is not eligible for relaunch
MUTANT agent_launch coder#2 while coder#1 alive: rc=0  （落行成功）
```

即：**A49 闸的真实行为正确，但它被整块删掉后 53 条测试无一转红**。

---

## 5. Findings

### P1-1 · A69「helper token 必填」把 design §9.3 / §9.4 的冻结样张链变成写不进去的账本

**事实**：`_validate_decision_ownership` → `_validate_decision_helper`（`relay_log.py:562-618`）要求 `escalate` / `decision` / `user_decision` 三者的 `note` 都**恰好携带一个** kind 与实例名一致的 helper token。design 的冻结样张里，`escalate` 与 `decision` 确实带 token，但 **`user_decision` 一律不带**：

- `design/01:943` `user_decision coder#1  note=用户裁决：继续，按 strategy.1.md 收窄本卡范围`
- `design/01:950` `user_decision coder#1  note=用户裁决：停卡，本卡转 backlog`
- `design/01:966` `user_decision coder#1  note=approve-amend: 用户同意 decision.2.md（含改计划）`
- `design/01:994` `user_decision coder#1  note=reject-amend: 不拆步，先按原 task_plan 用桩接口跑通再说`

且 `design/01:269`（§3.4「`user_decision` 的 `note` 写法约定」）与 `design/01:536`（§4.5.1）明文规定该 note **以 `approve-amend:` / `reject-amend:` 开头**，后接用户指示，并未给 helper token 留位置。

**真 CLI 复现**（按 §9.4 consult 场景逐行重放，前 8 行全 rc=0）：

```
decision      coder#1  note='decider=decider#1 decision.2.md 含「需要改计划」'   rc=0
user_decision coder#1  note='approve-amend: 用户同意 decision.2.md（含改计划）'   rc=2
        error: HC-RL-A69 decision note must carry exactly one helper token, got none
```

**为什么算 P1**：`design/01:239`「决策 agent 的标识写进 `note`」是一句可两读的概括，而 §9.2/§9.3/§9.4 的具体样张 + §3.4:269 + §4.5.1:536 三处一致地把 `user_decision` 排除在外。本卡把 token 强制扩展到 `user_decision`，直接后果是 **design 自己的三条冻结场景无法用 `add` 写出**；且 A114 / A96 / A97 / A118（RLT_05、RLT_07）都要求写 `user_decision`，本卡这条规则会在那些卡上把它们的正例卡死。这不是「多一道保险」，是把下游 owner 的合同提前改掉了。

`findings.md` 的 F-033 / F-034 / F-035 只记录了该规则的**实现与加固**，**没有任何一条记录它与 §9.3/§9.4/§4.5.1 的冲突**。

**建议闭合方向（不由本复核裁决）**：把 helper token 必填限定在 `escalate` 与 `decision` 两个事件（这两处与样张一致），`user_decision` 只做 owner 归属校验；或由主控把该扩展作为设计变更走正式 A/B，同步改 §9.3/§9.4/§4.5.1 与 A114/A96/A97/A118 的措辞。

### P1-2 · `add --note` 中的 U+2028 / U+2029 / U+0085 会把纯追加账本永久写坏

**事实**：写侧 `append_event`（`relay_log.py:727`）用 `json.dumps(..., ensure_ascii=False)`，这三个字符**不会被转义**，原样落进物理行；读侧 `read_ledger`（`relay_log.py:435`）用 `text.splitlines()`，而 Python 的 `splitlines()` 把 U+2028 / U+2029 / U+0085 也当行分隔符。于是一条写入的行在读回时被劈成两半。

**真 CLI 复现**（全新计划目录，第 2 条事件的 note 含 U+2028）：

```
add plan_loaded  orchestrator#1 --note 'skill=0.1.0'                rc=0
add node_start   monitor#1      --note 'skill=0.1.0 x<U+2028>y'     rc=0     ← 被接受
物理行数(b'\n') = 2 ；splitlines() = 3
status --plan …   → error: ledger line 2: invalid JSON     rc=4
add    --plan …   → error: ledger line 2: invalid JSON     rc=4
```

U+2029 与 U+0085 结果相同（均 add rc=0 / status rc=4）；`\x0b`/`\x0c`/`\x1c` 因 `json.dumps` 会转义控制字符而安全（add 0 / status 0）。

**为什么算 P1**：账本是本卡唯一持久状态，design §3.7 明文禁止锁、临时文件替换与整份覆盖，**程序内不存在任何修复路径**——一次合法的 `add` 之后该 run 的 `status` 与后续 `add` 全部 exit 4，只能人手改文件（而人手改文件本身违反纯追加合同）。按 `findings.md` 的级别定义，「数据丢失」是 P0 判据，主控若按该判据评级本条应升 P0；本报告按与既有先例一致的口径给 **P1**——F-019（末行无换行，且那还是外部造成的坏文件，不是本程序自己写出来的）当时由 batch-2 Opus 评为 P1 并强制返工，本条严格更重（自伤 + 相同 fail-closed 闸没覆盖）。

`findings.md` F-024 只登记了「`splitlines()` 接受 CRLF 是有意兼容」，**没有覆盖写/读不对称这一面**。

**建议闭合方向**：三选一——① `add` 入参校验拒绝 `note` 含 `  `（exit 2，不落行）；② 写侧改 `ensure_ascii=True`；③ 读侧改 `text.split("\n")` 并显式处理末尾空串。任一都需配一条会被变异杀死的回归。

### P2-1 · A49 重拉资格闸零覆盖：整块删除后 53 tests 全绿

**事实**：见 §4 M1 与其真 CLI 直证。`test_attempts_are_per_node_and_only_relaunch_after_authorized_causes`（`test_relay_log.py:774-796`）的所有反例都是 attempt **数值**不对（`coder#2` 作首次、重复 `coder#1`、跳到 `coder#3`），这些先被 A58 的 exact-increment 闸拦下；**从未构造「`coder#1` 仍在场（无 `agent_lost`/`cancelled`/stage failed）却拉 `coder#2`」这一 A49 专属场景**。`test_relaunch_attempt_increment_is_exact_after_terminal_causes` 同理，全部先建立合法终态前因。

design §3.2:200 把「只在 `agent_lost` / `cancelled` / 所属阶段 `failed` 之后重拉才 +1」写为 attempt 的冻结定义，brief 完成条件 13 明列「attempt 每节点分配/跳号/重号校验正确」，`progress.md` 矩阵第 13 行把 A49 标为已闭合。**该 ID 的核心守卫实际上没有任何判别性测试。**

这与 F-027（Sol batch-3 P2-1，「删除 exact increment 闸仍可被 A49 代为拒绝」）是**镜像的另一半**：F-027 修好了「A58 被 A49 顶替」，但没有人反向检查「A49 被 A58 顶替」。

**建议**：补一条 `node_start → agent_launch coder#1 → agent_launch coder#2` 的反例，断言 `rc=2` + `^error: HC-RL-A49 ` + 账本字节不变；并以 M1 变异证明其判别力。

### P2-2 · 五个 owner ID 的「编号 ↔ 守卫」绑定无回归，可任意对调而不转红

**事实**：见 §4 M2–M6。`A70`、`A74`、`A77`、`A78`(依赖分支)、`A68`(重复 node_close 分支) 五处生产错误编号可以互相换成别的 HC-ID，53 tests 全部保持 `OK`。根因是这些反例只断言 `returncode == 2`，不断言 stderr 里的编号：

- `test_runtime_trigger_and_dependency_gates`（`test_relay_log.py:894-935`）：A70 两例、A77 一例、A78 依赖一例，**全部只有 `assertEqual(2, ….returncode)`**。
- `test_node_close_requires_all_terminals_and_configured_agent_done`（`:938-962`）：A74 一例、A68 重复关闭一例，同样只断言 rc。

对照：A17、A58、A59、A60、A69、A78(agent_launch 分支)、A2、A55、A18 等处**都**有 `assertRegex(…, r"^error: HC-RL-Axx ")`，说明这是覆盖遗漏而非风格选择。

design §3.5:393 冻结「规则编号即对应验收项 ID」；E-044 本身就是靠「编号失配红」证明 RLT-B-04 迁移有效的，即本卡已经把编号级变异当作红的标准。这五处属于该标准下的空洞。

**建议**：给上述六个反例各补一条 `assertRegex(result.stderr, r"^error: HC-RL-Axx ")`，并用 M2–M6 复验转红。

### P2-3 · 空 agent 名逃过 A24，连带把 `close=agent:` 放行（A47 fail-open）

**事实**：`lint_plan` 对节点表有显式空值闸（`relay_log.py:294-295`，`node` 为空 → A24），**agent 表没有对称的闸**。一行 agent 名单元格为空时：

- 不触发 A24（`_table_rows` 只查列数与竖线，重名键 `f"{node}\0{agent}"` 对单条空名不冲突）；
- 该空名 agent 计入 `agents_by_node`，于是节点通过 A75；
- `close=agent:` 经 `partition(":")` 得 `name=""`，正好落在 `{agent.agent for …}` 里，**通过 A47**。

真 CLI 复现：一份含 `| C1 | K1 | K1:C#1 | construction | agent: | | |` 与 `|  | C1 | coder | | out.md | | |` 的计划 → `lint: ok`，exit 0。

design §11:1126 对 A47 的措辞是「`close` 为空或 `agent:<已存在 agent 名>`，**其它写法一律拒**」；`agent:` 不是任何已存在的 agent 名（账本侧 `AGENT_INSTANCE_RE` 也拒绝空名），所以这是一条 fail-open。运行期后果：该节点的 `node_close` 永远因 A74 被拒（`_latest_by_name(…, "")` 恒为 `None`），即 lint 放行了一份**结构上不可能收口**的计划——恰好违反 §4.3「正是这几条没放松，编排才能从计划无歧义地推出下一阶段」的意图。

与 F-007（竖线/列数同时异常时编号可能错位）**不是同一条**：F-007 说的是 fail-closed 但编号可能不准，这里是**直接放行**。findings.md 无对应条目。

**建议**：agent 表补空名闸（A24），或在 A47 里显式拒绝 `close` 的 `name` 为空。

### P2-4 · 矩阵「16 组条件与 42 ID 全部闭合、无 blocker」的措辞，与仍 open 的 F-016 / F-003 不自洽

**事实**：`progress.md:106` 写「上表 16 组 brief 条件已与 42 个 ID 全部对应并闭合（E-044/E-045：先红后绿、53 tests OK）：矩阵无退役编号、无 blocker」。但：

1. **A5 未按 §11 的取证方式闭合**。`design/01:1122` 的 A5 取证列明文是「单测：缺文件 / **缺表头** / **节点号重复**」，要求三个子命令**均退出 3**。实测：

   | 场景 | lint | status | add |
   |---|---|---|---|
   | 缺 `relay_plan.md` | **3** | 3 | 3 |
   | 节点号重复 | **2**（`lint: HC-RL-A46 …`） | 3 | 3 |

   即 `lint` 在「节点号重复」上给 2 而非 3。这是 design 内部矛盾（§3.1/§3.5 把它归为 lint 规则→2，§11:1122 把它列为解析失败→3），实现选了自洽的一读并由 `test_runtime_plan_semantic_errors_map_to_exit_three_while_lint_is_two` 钉住——**这个选择本身可辩护**，`findings.md` F-016 也如实登记为 **open**。问题只在于矩阵的收口句同时宣称「全部闭合、无 blocker」，读者据此会以为 A5 已按 §11 取证过。

2. **A129 同理**。F-003 仍 open，其内容正是 A129 在「表尾追加」上是否放宽的冲突；`progress.md:106` 已为 A128 加了四例外限定，但整句仍以「全部闭合」开头。

**建议**：把收口句改成「16 组条件全部有测试映射；其中 A5、A129 的取证口径受 open finding F-016 / F-003 限定，按 §3.1/§3.5 自洽读法执行」。不需要改代码。

### P3-1 · F-003 对冲突范围的描述偏窄（漏掉 §4.3 与 §4.5.4 这两处规范正文）

F-003 现在写的是「design §3.5(:409) 与 §11(:1132) 对 A129 是否含 §4.5 表尾豁免的文本分歧」。实际携带该豁免的有三处，且其中一处是**规范正文而非映射表**：

- `design/01:409` §3.5 lint 映射表（F-003 已引）
- `design/01:496` §4.3 正文：「忽略 superseded 行后…**追加行落在表尾也通过**」——这是 relay_plan 规范本身
- `design/01:583` §4.5.4：「lint 放宽：只放宽『同一阶段实例的节点连续』这一条…**允许追加行落在表尾**」

只有 `design/01:1132` §11 的 A129 取证行不含。RLT_09 交接时若按 F-003 的现状描述去查，会漏掉规范正文那一处。建议 F-003 补引 :496 与 :583。

### P3-2 · DevPlan RLT_03 卡对 A59 写「三类豁免」，design §11 与实现都是四类

- DevPlan `P1-RelayLight-开发方案.md` RLT_03 卡：「`HC-RL-A59`｜node/agent/event 入参与**三类豁免**正确」
- `design/01:1167` A59：「（`orchestrator#`/`monitor#`/**`planner-amend#`**/**`strategist#`** 豁免）」——四类
- `design/01:329` §3.5 同为四类
- 实现 `RELAUNCH_EXEMPT_AGENT_NAMES`（`relay_log.py:53-55`）= 四类；测试名 `test_agent_authorization_has_four_exempt_prefixes_and_active_nodes`

实现与 design 一致、与 brief 条件 14（未写数量）不冲突；只有 DevPlan 卡的文案是陈旧的。brief 的权威顺序是「DevPlan 验收口径 > design/01」，所以这处文案漂移在纸面上会指向错误结论。findings.md 未登记。建议主控在下一次 B-adjust 时把 DevPlan 该行改为「四类豁免」。

### P3-3 · design 指定的验收样品从未跑过实现

`task_plan.md` C-006 把 §10.1–10.3 列为「可解析的 plan/ledger 样例，**用于 test fixture**」，`design/01:1097` §10.4 又把 §10.1 映射到 A24/A46/A47/A87/A129/A130 六条 owner ID。实际上：

- 测试文件全部使用自建的 `DHR_90` fixture，**没有一处引用 §10.1 / §10.2 的样品**；
- 把 §10.1 原样喂给 `lint` → `lint: HC-RL-A75 line 9: node C2 has no active agent`，exit 2（因为它标注为「摘录」，agent 表只覆盖 W1/C1，C2/R1/F1 无 agent 行）。

不构成实现缺陷（样品是摘录，不是完整合法计划），但 §10.4 声称的「样品覆盖这六条验收项」在本卡没有被兑现，且没有任何 finding 说明为什么不兑现。建议要么补一份「§10.1 补全 agent 表后 lint 通过」的 fixture 测试，要么在 findings 里登记「§10.4 的样品对照留给 RLT_10 全量入口」。

### P3-4 · `b7f4ecc` 把 5 个越出 RLT_03 允许路径的 design/dev_plan 文件与本卡代码打进同一提交

DevPlan RLT_03 的 `dh:allowed-paths:v1` 只有三条：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`docs/modules/relay-light/workspace/RLT_03/**`。而 `b7f4ecc feat(relay-light): implement RLT_03 plan and ledger core` 的 name-only 里包含：

```
docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md
docs/modules/relay-light/design/drafts/A04-RLT03与RLT05验收边界修订候选.md
docs/modules/relay-light/design/evidence/05-交叉审核记录-RLT03与RLT05验收边界.md
docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md
docs/modules/relay-light/dev_plan/drafts/RLT-B-04-RLT03与RLT05验收边界-调整候选.md
```

施工侧的记录（E-045）是准确的——这五个文件是主控的 RLT-A-04/RLT-B-04 写入，施工者确实没碰、没提交；提交动作是主控做的（progress.md:27）。但结果是 **PR #4 的 diff 不是路径受限的本卡 diff**，复核者/合并者无法把「设计变更」与「卡内实现」分开看，也无法用允许路径做机械门禁。建议后续同类收口把设计变更单独成一笔提交。

### P3-5 · `RELAUNCH_EXEMPT_AGENT_NAMES` 名不副实

该常量（`relay_log.py:53-55`）唯一使用点是 `_authorize_agent`（`:529-530`），作用是「豁免『agent 名必须在本节点 agent 表中』」（A59），**与重拉（relaunch / attempt +1）毫无关系**——`_validate_agent_transition` 的重拉逻辑对这四个名字并不豁免。名字会误导后续 RLT_05/RLT_09 的维护者。建议改名为 `NODE_MEMBERSHIP_EXEMPT_AGENT_NAMES` 或等价。属 F-010 同类可读性噪音，不阻塞。

### P3-6 · `on:done:<自身>` 自引用被 lint 放行，运行期必死锁

`lint_plan` 的 trigger 校验（`relay_log.py:365-376`）只要求目标 agent 存在且同节点，没有排除「目标就是自己」。一份写 `| coder | C1 | coder | | out.md | on:done:coder | |` 的计划 lint 通过，但运行期 `_require_trigger` 会要求 `coder` 先 `done` 才能 `agent_launch coder`，永远无法启动。design §4.2/§11:1157 未明文禁止自引用，所以不算违约；登记为后续可收紧项。

### P3-7 · A104 与 A129 在「stage 值不在枚举内」上职责重叠

`design/01:1133` A104 的取证文字包含「`<stage>` **在枚举内**」，而 `design/01:408` §3.5 映射表把「`stage` 值不在阶段枚举内」判给 A129。实现按映射表走（`relay_log.py:317-318` 报 A129）。两处都是本卡 owner，行为不受影响，但 A104 的取证文字与实现的编号不完全对应。登记备查。

### P3-8 · `.gitignore` 仍未覆盖 `__pycache__` / `*.pyc`（F-008 复验：仍 open）

独立复验：`grep -nE "pycache|\*\.pyc" .gitignore` 零命中；`git status --short` 在我运行测试后确实出现过 `tools/relay-light/__pycache__/`（已按精确路径删除）。当前 HEAD 未提交任何 `.pyc`。F-008 的现状描述准确，处置（每次手动清）仍是人肉纪律。登记备查，主控决定是否单开小卡改 `.gitignore`。

---

## 6. 证据真实性抽核

对 `progress.md` 证据账本做抽样独立复算（不采信原记录，全部重跑或重算）：

| 证据 | 声明 | 独立复核结果 |
|---|---|---|
| E-045 | `Ran 53 tests`，OK；py_compile 0；diff --check 0；help 仅 `{add,status,lint}`；退役号零命中 | **全部复现**（C-02～C-07），逐项属实 ✅ |
| E-033 | A61/A62 仅出现在 `_status_command` 注释（:718-721）；其余 RLT_05/07/09 ID 零命中 | 行号已因后续改动漂移到 **:748-751**，内容属实；非 owner ID 只有注释内 A61/A62 ✅（行号漂移不作为 finding） |
| E-030 | help 仅列 `{add,status,lint}` | 复现 ✅ |
| E-019 / E-024 / E-029 / E-032 / E-036 / E-041 / E-042 / E-043 | 各批变异均使目标测试转红 | 未逐条重放历史变异（那是各批小审的职责，且已有独立 recheck 签收）；本轮改为**新设 7 组变异**做整卡判别力抽检，结果见 §4——**6 组存活**说明历史变异证据虽然真实，但覆盖面不足以支撑「整卡有效单测」结论 ⚠️ |
| E-047 | 本轮 code_round_1 派出 | 与本 pane 身份一致（`rlt03-code1-opus` / `w15:pA`）✅ |
| progress.md:106 的 42-ID 与 A128 四例外声明 | — | 机械核算 + 真 CLI 复验，**逐字属实** ✅（措辞问题见 P2-4） |
| progress.md:27 的 commit / PR 记录 | commit `b7f4ecc`、Draft PR #4、Issue #3 | commit 存在且内容与描述一致；PR/Issue 为外部 GitHub 资源，本复核**未联网核实**，不作结论 |

**未发现伪造证据。** 记录的失败与"late-added coverage / 不伪造红"的自陈（E-031、E-034、E-041 第 3 项）都与代码现状吻合，属实事求是的登记。E-041 甚至主动记录了「第 3 项变异的红是 IndexError 崩溃而非干净 rc 失配」这种对自己不利的细节——这一点值得肯定。

---

## 7. 对既有批次小审的闭合映射

批次链共 11 份记录，本轮逐条核对其 P0–P3 的当前状态（`✔` = 独立复验确认闭合；`open` = findings.md 仍标 open 且本轮复验现象仍在；`⚠` = 本轮认为闭合宣称不足）。

| 来源 | 原编号 | 级别 | 主题 | 当前状态 | 本轮独立依据 |
|---|---|---|---|---|---|
| batch-1-opus | P1-1/P1-2 | P1 | A86(→A129) 表尾/隔断 | ✔ | §3 表尾实测 exit 2、隔断 exit 0 |
| batch-1-opus | P2-1 | P2 | `generated=` 非必填 | ✔ (F-001) | `_parse_marker` 必填只有 skill/session/recipe/cards |
| batch-1-opus | P2-2 | P2 | A116/A89/A120 不得提前实现 | **open (F-003)** | 零命中；但 F-003 描述偏窄，见 P3-1 |
| batch-1-opus | P2-3 | P2 | lint CLI 缺/坏 plan 走 3 | ✔ (F-002) | 缺文件 lint exit 3 实测 |
| batch-1-opus | P2-4 | P2 | lint CLI 无回归网 | ✔ (F-006) | `test_lint_cli_smoke_…` 在 suite 内 |
| batch-1-opus | P2-5 | P2 | ModuleNotFoundError 不是有效红 | ✔ (F-004) | E-003 已标 invalid-TDD-red |
| batch-1-opus | P2-6 | P2 | A109 跨卡并行假正例 | ✔ (F-005) | `test_same_card_stages_are_serial_but_cards_can_be_parallel` |
| batch-1-opus | P3-2/3/4/5 | P3 | 竖线错位编号 / pycache / A104 覆盖 / 可读性 | F-007 **open**、F-008 **open**、F-009 ✔、F-010 **open** | 竖线实测 fail-closed(A24,3)；`.gitignore` 仍无 pycache（P3-8）；`_error` 转发与 O(n²) 仍在 |
| batch-1-recheck | R-P2-1 | P2 | `cards=,` 走 exit 3 | ✔ (F-011) | `_parse_marker`/`parse_plan:236` 抛 A18 exit 3 |
| batch-1-recheck | R-P3-1/2/3/5 | P3 | trigger 反例归位 / RecursionError / superseded 链 / 默认依赖 | F-012 ✔、F-013 ✔、F-014 ✔、F-015 ✔ | `_assert_acyclic` 已改迭代栈 + 1500 节点测试；superseded-by 指向 superseded 报 A24 |
| batch-2-opus | P1-1 | P1 | 末行无换行会粘行 | ✔ (F-019) | 实测 status/add 均 exit 4 且字节 149→149 不变。**但同类的 U+2028 写/读不对称未被覆盖 → P1-2** ⚠ |
| batch-2-opus | P2-1 | P2 | `by` 派生 | ✔ (F-020) | `_writer_from_agent` 按 agent 前缀 |
| batch-2-opus | P2-3 | P2 | lint 2 vs add/status 3 的张力 | **open (F-016)** | 实测确认；宣称问题见 P2-4 ⚠ |
| batch-2-opus | P2-6 | P2 | 空账本 A84 pending 最小实现 | ✔ (F-021) | `_status_command` 空账本分支 |
| batch-2-opus | P3-1 | P3 | `arguments`/`ledger` code 非 HC-ID | **open (F-017)** | 实测 `error: arguments …` / `error: ledger …` |
| batch-2-opus | P3-2/3 | P3 | A51 pane 断言偏弱 | ✔ (F-018) | 20 行逐行整条 JSON 断言 + 源码 guard |
| batch-2-recheck | R-P3-1 | P3 | pending 排除 superseded 需回归 | ✔ (F-022) | `test_empty_ledger_pending_nodes_exclude_superseded_rows` |
| batch-2-recheck | R-P3-2 | P3 | 非空 status 是 stub | ✔ (F-023) | `relay_log.py:748-751` 占位注释 |
| batch-2-recheck | R-P3-3 | P3 | `splitlines()` 接受 CRLF | **open (F-024)** | 复验成立；**但该 finding 只覆盖 CRLF 一侧，写/读不对称的 U+2028 一侧缺口 → P1-2** ⚠ |
| batch-3-sol | P1-1 | P1 | A69 决策归属可伪造 | ✔ (F-025) | `test_decider_and_strategist_escalations_…` 断言 A69 |
| batch-3-sol | P1-2 | P1 | `decision → done` 跳过 resume | ✔ (F-026) | `allowed["done"] = {agent_launch, checkpoint, resume}` |
| batch-3-sol | P2-1 | P2 | A58 跳号/重号未隔离前因 | ✔ (F-027) | `test_relaunch_attempt_increment_is_exact_…` 断言 A58。**其镜像的 A49 一侧仍空 → P2-1** ⚠ |
| batch-3-sol | P2-2 | P2 | A17 close-agent-done 反例 | ✔ (F-028) | `test_node_close_names_a_nonterminal_launched_agent_…` 断言 `^error: HC-RL-A17 .*coder#1` |
| batch-3-sol | P3-1 | P3 | pycache 手动清 | 同 F-008 **open** | 见 P3-8 |
| batch-4-sol | P1-1 | P1 | `plan_loaded` 版本 note | ✔ (F-033) | `test_plan_loaded_note_requires_non_empty_skill_token` |
| batch-4-sol | P1-2 | P1 | A69 helper 标识必填 | ✔ 就其字面而言 (F-033/F-034) | 实现成立；**但把 `user_decision` 一并纳入，与 §9.3/§9.4/§4.5.1 冲突 → P1-1** ⚠ |
| batch-4-sol | P1-3/P1-4 | P1 | A73 status 投影 / A88 映射 | ✔ 由 RLT-A-04/RLT-B-04 正式改判 (F-030~F-032) | DevPlan §6 现为 A73→RLT_05、A126/A127/A92 三分；owner 表机械核算通过 |
| batch-4-sol | P2-1/P2-2 | P2 | 四 ID 指定直证 / A88 隔离 fixture | ✔ | `test_unreadable_ledger_status_exits_four`、`…missing_and_zero_byte…`、`len(plan.cards)==2`、`test_forbidden_types_are_the_sole_violation_in_legal_plans` |
| batch-4-recheck-sol | P2-1 | P2 | A69 equality 精确变异存活 | ✔ (F-035) | `test_decision_events_carry_the_same_helper_token_as_the_escalate` 已含 `decider#2`/`strategist#2` 同 kind 反例 |
| batch-4-recheck-sol | P2-2/3/4 | P2 | F-030/031/032 合同冲突 | ✔ 由 RLT-B-04 关闭 | 同上 |
| 主控审计 | — | P1 | escalate 半边未真闭合 | ✔ (F-034) | `test_escalate_requires_exactly_one_matching_helper_token` 七类坏 note |
| batch-4-contract-rework-opus | P2-1 | P2 | F-003 活动口径用退役号 A86 | ✔ | F-003 现文已为 A129。**但冲突范围描述仍偏窄 → P3-1** ⚠ |
| batch-4-contract-rework-opus | P2-2 | P2 | 矩阵「无 partial」无限定宣称 | 部分 ✔ | A128 四例外限定已加且逐字属实；**整句仍以「全部闭合、无 blocker」开头 → P2-4** ⚠ |
| batch-4-contract-rework-opus | P3-1~P3-4 | P3 | 注释并列 ID / 无字节 diff / 历史旧号 / 其他 open findings | 登记备查，本轮无变化 | — |
| batch-4-contract-rework-recheck | — | — | APPROVE（P0=0/P1=0/P2=0/P3=4） | 该 APPROVE **只覆盖 RLT-B-04 编号迁移这一窄范围**，其自述基线即如此 | 本轮为整卡首次单次全范围复核，故新增 P1/P2 与之不矛盾 |

**闭合总账**：既有批审共提出 **P1×6、P2×20、P3×14**（含主控审计 1 条 P1）。其中 **P1 全部 6 条已闭合**（其 2 条的闭合方式衍生出本轮新 P1，见上表 ⚠ 行）；P2 中 **F-003、F-016、F-017、F-024 四条仍 open**（findings.md 如实标注，与本轮复验一致）；P3 中 F-007、F-008、F-010 仍 open。**未发现任何被宣称闭合但实际未闭合的历史条目**——本轮的新 P1/P2 是既有批审**范围之外**的空白，不是对既有结论的推翻。

---

## 8. 结论

**CHANGES_REQUESTED**

计数：**P0=0 · P1=2 · P2=4 · P3=8**

必须闭合（阻塞 code_round_1 通过）：

1. **P1-1** — A69 helper token 对 `user_decision` 的扩展与 design §9.3/§9.4 样张、§3.4:269、§4.5.1:536 冲突，使三条冻结场景写不进账本，并会卡住 A114/A96/A97/A118。要么收窄到 `escalate`+`decision`，要么由主控走正式设计变更同步四处文本与四个下游 ID。
2. **P1-2** — `add --note` 含 U+2028/U+2029/U+0085 时写侧不转义、读侧 `splitlines()` 劈行，一次合法 add 即永久写坏纯追加账本且程序内无修复路径。需加入参闸或改写/读任一侧，并配可被变异杀死的回归。
3. **P2-1** — A49 重拉资格闸零覆盖（整块删除后 53 tests 全绿）。
4. **P2-2** — A70/A74/A77/A78(依赖)/A68(重复关闭) 五处「编号 ↔ 守卫」绑定无回归，可任意对调而不转红。
5. **P2-3** — 空 agent 名逃过 A24 并连带放行 `close=agent:`（A47 fail-open），lint 会放行结构上不可能收口的计划。
6. **P2-4** — `progress.md:106` 的「全部闭合、无 blocker」措辞与仍 open 的 F-016(A5)/F-003(A129) 不自洽（纯文档，不改代码）。

P3-1~P3-8 登记备查，不阻塞。

**明确不构成 finding 的边界判断**（本轮独立确认为正确的范围收敛，供后续复核路径复用）：`lint --json` 与多行 violations（A80/RLT_10）、`by` 写入者一致性（A85/RLT_05）、`plan_loaded` 的 `config_dir=`/`plan=`（A99/RLT_05）与「唯一且居首」（A89/RLT_05）、stage_* 全部时序（A112/A105/A118/RLT_05）、decision_mode 两条链顺序（A114/A96/RLT_07）、attempt 上限 3 与止损（RLT_05）、完整 status 生命周期（A61/A62/A73/A92/RLT_05）、五阶段模板（A127/RLT_07）、运行中改计划放宽（A120/RLT_09）。以上九类在生产与测试中均**未实现且未越界声称**，是本卡做对的部分。

本报告只给事实与级别，不做验收裁决，不改任何被审文件。
