# review.plan — RLT_29

## 范围与身份

- 身份：`plan-reviewer#1`，round=1；独立规划审核，不是 orchestrator、monitor、builder/coder 或施工后 reviewer。
- 范围：只审核 RLT_29 的 `brief.md`、`task_plan.md`、`execution_strategy.md`、`progress.md`、`findings.md`、`DONE.builder.md`，并对照 design/01 A13、§7.5、A159～A168、H19、evidence/13、DevPlan B09/RLT_29/第 8 批。
- 边界：未改规划输入、代码、DevPlan/design、progress/findings；未派 agent，未执行 commit/push/PR。

## 逐项矩阵

| 审核项 | 结论 | 证据与判断 |
|---|---|---|
| allowed paths 与每批 sole artifact writer、节点/批次边界 | FAIL | DevPlan 允许路径闭集存在（DevPlan L168-L179），但 `task_plan.md` L29-L34、L42-L47、L55-L61 未把每个 artifact 绑定到唯一 writer；C3/batch-3 又把未来 workflow-final/E2 多角色证据放进 coder 批内的 `evidence/**` 任务，越过批次边界。见 P1-02。 |
| 三批 zero-context 可执行；cwd、PYTHONPATH/相对路径、预期退出、完成信号 | FAIL | `task_plan.md` L36、L49、L63-L72 的命令没有冻结 repo-root cwd；L67 `cd tools/relay-light` 后 L68 的 repo-root 相对 PowerShell 路径失效；未明确逐命令 cwd/PYTHONPATH 选择、逐项预期退出、审计命令与精确信号。见 P1-03。 |
| 完整 relay 零回归；single-task 不创建/读写 plan/log 且不用 W/C/R/X/F | FAIL | plan 明确禁改 plan/log 与 `relay_log.py`（L8-L10），也安排全量回归（L61-L72）；但批次仍命名 `C1/C2/C3`，并生成 `check.C1.md`/`check.C2.md`（L25、L33、L38、L47、L51），与 design §7.5 L944、A159 的“不使用 W/C/R/X/F”及 single-task `phase=batch` 词汇不一致。见 P1-01。 |
| 一任务一 workspace、每实例独立 tab/pane、模型由用户选择并快照、不写死 | PASS | `brief.md` L25、`execution_strategy.md` L6-L18 与 `task_plan.md` L11、L44-L46均覆盖；`roles.toml` 默认零改动。 |
| monitor 为 progress 唯一运行写者；120 秒 wait；变化才通知；Enter 三条件与一次复验 | PASS | `task_plan.md` L12、L34、L45、L49，`execution_strategy.md` L22-L27，`progress.md` L20-L28覆盖唯一写者、恢复、静默与 Enter 规则。 |
| batch review 与 workflow-final 两道闸；plan/batch 最多整改 2 轮；final 每次整改 fresh | FAIL | 两道闸与 fresh 规则已写（`task_plan.md` L18-L23、L74-L81），但统一 `round≤2` 未区分“初审轮”与“最多两轮整改”；当前初审就是 round=1，按该上限只能容纳一次整改。见 P1-05。 |
| dev-harness E2 code_review 与 workflow-final 分层；E2 targeted 同 reviewer_session | PASS | `brief.md` L36-L41、`task_plan.md` L14-L23、L74、L81明确分层及 fresh/same-session 相斥条件。 |
| heavy 五路、有效单测、施工者不自审、适用 path PASS/可核 N/A、open P0/P1=0 | PASS | `task_plan.md` L23、L57-L59、L74与 `brief.md` L31、L41覆盖五路、RED→GREEN、非施工者、PASS/N/A 和零 open P0/P1。 |
| RELAY_RECEIPT fail closed、不清 RELAY_* | FAIL | 计划要求实现该合同（`task_plan.md` L31），但 Context Packet 与三批执行入口没有施工 worker 自身的启动前 preflight/阻断信号；generic signal 也未给 BLOCKED schema。见 P1-04。 |
| 恢复状态、durable DONE/BLOCKED、授权边界与 E10 后用户人验闸 | FAIL | 恢复与授权/人验边界齐全（`progress.md` L20-L28；`execution_strategy.md` L29-L31），但 `task_plan.md` L78 的 generic signal 名与本次实际 `DONE.plan-review.md` 合同不一致，且各批没有冻结精确 DONE/BLOCKED 文件名、必需字段与接收者。见 P1-04。 |
| 规划新增问题与存量 dh 噪声分开，存量失败不得掩盖新增 P0/P1 | FAIL | `task_plan.md` L61仅说存量失败如实登记，`DONE.builder.md` L4已记录 `dh relay-light rc=1`；计划未定义 baseline/new 分类表、允许的存量失败清单、diff 判据及“新增失败/open P0/P1 必须阻断”的命令级门。见 P1-06。 |
| 高危/版本动作授权边界 | PASS | `brief.md` L11-L14、L43-L47与 `execution_strategy.md` L29-L31保留 E10 后用户人验闸，未把批量授权扩张为当前 reviewer 的版本动作。 |

## Findings

### P0

无。

### P1

#### P1-01 — single-task 仍使用完整 relay 的 `C` 阶段词

- 精确证据：`task_plan.md` L25、L33、L38、L47、L51、L74使用 `C1/C2/C3`、`check.C1.md`、`check.C2.md`；design/01 L944与A159明确 single-task 不使用 W/C/R/X/F，L975冻结 `phase=batch`。
- 影响：结构验收可能直接失败；运行者也会把 single-task batch 与完整 relay C 阶段混淆。
- 整改：统一改为 `batch-1/2/3`（或 `batch=1/2/3`）及 `check.batch-<n>.md`，全文清除作为阶段标识的 W/C/R/X/F；保留“完整模式零回归”只作被测对象，不作 single-task 路由词。

#### P1-02 — 每批 artifact sole writer 与阶段归属未冻结

- 精确证据：`task_plan.md` L29-L34、L42-L47、L55-L61只列“改动文件/怎么改”，没有 path→writer 表；L46把 `execution_strategy.md` 写者写成“主会话/monitor”二选一；L59在 batch-3 内要求创建包含 workflow-final、E2、monitor/orchestrator 多角色产物的 `evidence/**`，但 L74又规定 workflow-final/E2 在 batch-3 PASS 后才开始。
- 影响：zero-context worker 无法判断谁能写哪个文件；coder 可能冒写 reviewer/monitor 证据，或 batch-3 因等待未来 final 产物无法发 DONE。
- 整改：为 plan、每个 batch、workflow-final 每路、E2 各列精确输入、输出、sole writer、只读路径和下一接收者；batch-3 只写本批 coder 产物，后续 reviewer 各写自己的 review/signal，monitor 只写 `progress.md`；明确 `execution_strategy.md` 的唯一写者及交接规则。

#### P1-03 — 命令不可从 zero-context 稳定复跑

- 精确证据：`task_plan.md` L36、L49、L63-L72；尤其 L67改变 cwd 后，L68仍用 repo-root 相对路径 `tools/tests/run-relay-tests.ps1`。命令未逐条声明 cwd，未明确采用 repo-root 相对路径还是设置 PYTHONPATH，也没有 plan/log 路径审计、允许路径审计的可执行命令与逐项预期退出。
- 影响：同一命令块顺序执行会在错误路径找 PowerShell runner；不同 pane 初始 cwd 下结果不确定，无法形成可核证 evidence。
- 整改：每批给可复制命令块，首行固定 `cd /home/nash/work/dh-relay/.dh-worktrees/RLT_29`（或等价显式 cwd），随后全用 repo-root 相对路径；明确 `PYTHONPATH` 是否无需设置及原因，或显式设置；每条命令写 expected exit/output、证据落点和成功后精确 DONE signal。补 single-task plan/log 不存在/未触碰审计及 allowed-path diff 审计命令。

#### P1-04 — durable signal 与 RELAY_RECEIPT 执行门不完整

- 精确证据：`task_plan.md` L31只要求实现 RELAY_RECEIPT 合同；L78只给 generic `DONE.single-task...`/`BLOCKED...`，未给字段 schema。本 plan-review 实际完成合同是 `DONE.plan-review.md`，与 L78不一致。
- 影响：orchestrator/monitor 无法仅凭计划机械发现精确文件并校验结果；施工 worker 若带 `RELAY_RECEIPT` 进入，没有明确的开工前 fail-closed 动作与 durable BLOCKED 结果。
- 整改：冻结各 phase/batch/role 的精确 DONE/BLOCKED 文件名、单行字段（task/phase/agent/batch/round/verdict或reason/evidence）、唯一写者与接收者；统一 plan-review 的实际命名。每个 worker 开工首步增加 RELAY_RECEIPT preflight：存在则零业务写入、不清任何 `RELAY_*`、按允许的 blocked signal 收口并停。

#### P1-05 — “最多整改 2 轮”的计数口径少一轮

- 精确证据：`task_plan.md` L78-L81统一写 `round≤2`；当前 plan-review 派单初审已是 `round=1`。design/01 L956、L958和A162要求 plan/batch“最多整改2轮”、workflow-final“最多返工2轮”。
- 影响：若 round 计入初审，则只能初审+一次整改，提前一轮交 decider；若不计入初审，现有 signal 又无法判定计数，恢复时会歧义。
- 整改：分开冻结 `review_round` 与 `remediation_count`：初审 `remediation_count=0`，最多允许 1、2 两次整改；plan/batch 始终回同 builder/coder+原 reviewer，workflow-final 每次整改复核均换 fresh reviewer；信号与 progress 同时记录两个计数，超限条件写成 `remediation_count > 2` 前不得自行再改。

#### P1-06 — 完整回归与存量噪声没有可机械区分的出口门

- 精确证据：`task_plan.md` L61、L65-L72；`DONE.builder.md` L4已有 `dh relay-light rc=1` 的混合解释。计划没有冻结存量失败 baseline、命令/退出码/失败项三元组，也没有 before/after 比较或新增失败阻断谓词。
- 影响：`dh` 非零和历史噪声可被笼统标成“存量”，掩盖本卡新增回归或 open P0/P1，无法证明“完整 relay 零回归”。
- 整改：施工前记录同基线命令的存量失败清单（命令、cwd、exit、稳定 failure IDs/摘要）；施工后同命令比较。新增/变化失败、RLT_29 验收失败或 open P0/P1 一律 BLOCKED；仅完全匹配 baseline 的存量噪声可单列不阻断。完整 relay Python/PowerShell/安装测试分别给 exit 预期和差异结论。

### P2

无。

## 结论

**FAIL** — P0=0，P1=6，P2=0。当前计划尚不足以让三批 zero-context worker 在不越权、不混阶段且可机械恢复的条件下执行；不得进入施工。

## 同一 builder 可执行整改清单

1. 将 `C1/C2/C3` 与 `check.C<n>` 全部改成 single-task `batch=1/2/3` 词汇。
2. 增加逐阶段 path→sole writer→只读输入→输出→下一接收者矩阵，并把 batch-3 与后续 workflow-final/E2 产物拆开。
3. 重写三批命令块：固定绝对 cwd、统一 repo-root 相对路径、明确 PYTHONPATH 选择、每命令 expected exit/output、plan/log 与 allowed-path 审计、精确成功信号。
4. 冻结 DONE/BLOCKED 文件名与字段 schema，统一 plan-review 信号；给每个 worker 增加 RELAY_RECEIPT 开工前 fail-closed 门。
5. 将初审轮与最多两次整改分开计数，并分别写清 plan/batch 原 reviewer、workflow-final fresh、E2 same-session targeted 的路由与超限条件。
6. 增加存量 baseline 与施工后对比门；任何新增失败或 open P0/P1 必须 BLOCKED，不能被 `dh` 存量噪声豁免。

---

## Targeted recheck — review_round=2 / remediation_count=1

### 身份与范围

- 同一 `plan-reviewer#1` 仅定向复核原 P1-01～P1-06；未扩大为新一轮泛审。
- 输入：原 `review.plan.md`、`DONE.plan-review.md`、`DONE.builder.plan-remediation-1.md`，以及整改后的 `brief.md`、`task_plan.md`、`execution_strategy.md`、`review.md`。
- 边界：未改规划输入、代码或 progress，未派 agent，未执行版本/远端动作。

### 原 findings 闭合矩阵

| finding | 结果 | 精确证据与判断 |
|---|---|---|
| P1-01 — single-task 使用完整 relay `C` 阶段词 | **CLOSED** | `task_plan.md` L30冻结 single-task phase 闭集和 `batch=1/2/3`；三批标题及路由已改为 `batch-1/2/3`（L172、L199、L221），review 文件为 `check.batch-<n>.md`（L54、L56、L58）。W/C/R/X/F 只在 L30 的“被回归测试合同”限制语境出现，不再作路由。 |
| P1-02 — sole writer 与阶段归属未冻结 | **CLOSED** | `task_plan.md` L47-L69给出 phase/batch/path 的 sole writer、只读输入、唯一输出和下一接收者；L57-L65拆开 batch-3、五路 workflow-final 与 E2；L223、L227明确 batch-3 不写后续 reviewer/E2/monitor 产物；`execution_strategy.md` L10冻结运行期 sole writer=monitor。 |
| P1-03 — zero-context 命令不可稳定复跑 | **CLOSED** | `task_plan.md` L6-L12冻结绝对 cwd、repo-root 相对路径与 `PYTHONPATH`；L110-L170给 baseline/allowlist 可复制命令及 expected；L181-L197、L208-L219、L232-L245分别给三批 cwd、命令、evidence、exit/output 与成功/失败 signal。原先 `cd tools/relay-light` 污染后续路径的问题已消除。 |
| P1-04 — durable signal 与 RELAY_RECEIPT 门不完整 | **OPEN** | preflight 已闭合（`task_plan.md` L14-L26），schema/table 也已补（L71-L91）；但落地合同仍自相矛盾：L73-L78要求所有 signal 含 `batch`、`path`、`review_round`、`remediation_count`，实际整改信号 `DONE.builder.plan-remediation-1.md` L1缺 `batch` 与 `path`；L52、L84、L91规定 targeted plan-review 继续写/更新 `DONE.plan-review.md`，而本轮派单要求 durable 新文件 `DONE.plan-review.round-2.md`。旧 `DONE.plan-review.md` L1仍是 round=1 且使用旧 schema。当前不能让 monitor 只按计划机械定位并校验本轮结果。 |
| P1-05 — 最多两次整改计数歧义 | **CLOSED** | `task_plan.md` L36-L45明确初审 `review_round=1/remediation_count=0`、两次整改 count=1/2、plan/batch 同 reviewer、workflow-final 每次 fresh、E2 same-session targeted 和超限路由；`execution_strategy.md` L27-L29一致。 |
| P1-06 — 存量噪声可能掩盖新增失败 | **CLOSED** | `task_plan.md` L93-L141冻结 baseline 命令/exit/failure IDs/classification、同命令 post 比较与 blocking predicate；L135-L141明确新增/变化 failure、RLT_29 failure 或 open P0/P1 一律 BLOCKED，只有集合及摘要完全匹配的 inherited noise 可单列。 |

### 新 P0/P1 检查

未发现本次整改引入的其它新 P0/P1。P1-04 是原 finding 的残留，不另行重复计数。

### Targeted 结论

**FAIL** — P0=0，P1=1。原 P1-01、P1-02、P1-03、P1-05、P1-06 已闭合；P1-04 仍 open。不得进入施工。

同一 builder 的最小整改：统一 plan-review 每轮 durable 文件策略并写入 §3/§4（建议保留不可覆盖历史的 `DONE.plan-review.round-<review_round>.md`），让矩阵、文件名表和派单一致；把 plan builder 整改 signal 补齐固定 schema 的 `batch=na path=na`，并说明历史 round-1 旧 signal 是保留输入而非当前 schema 合格样本。整改后由同一 plan-reviewer 做下一次 targeted recheck。

---

## Targeted recheck — review_round=3 / remediation_count=2

### 身份与范围

- 同一 `plan-reviewer#1` 最后一次 targeted recheck；仅复核残余 P1-04，并检查本次整改是否引入新 P0/P1。
- 未改规划输入、代码或 progress，未派 agent，未执行版本/远端动作。

### P1-04 复核

**OPEN**。

已闭合部分：

1. `task_plan.md` L51-L54 的 sole-writer 矩阵已按 round 2/3 分开，输出统一为不可覆盖的 `DONE|BLOCKED.plan-review.round-<review_round>.md`，round-3 FAIL 明确交 decider且不得再整改。
2. `task_plan.md` L75-L80 的新 schema 必含 `task/phase/agent/batch/path/review_round/remediation_count/verdict/evidence`，BLOCKED 另含 `reason`；L94冻结 plan 为 `batch=na path=na`。
3. `task_plan.md` L84-L94 的文件名表已统一逐轮不可覆盖策略；旧 `DONE.plan-review.md` 明确只作 round-1 历史输入、不是当前 schema 合格样本。
4. `DONE.builder.plan-remediation-1.md` L1和 `DONE.builder.plan-remediation-2.md` L1均已含 `batch=na path=na` 及新 schema 全部必需字段。

仍未闭合的精确残留：

- `task_plan.md` L94声明“自 round 2 起，每轮 plan-review 必须”服从新 schema；但已落盘且不可覆盖的 `DONE.plan-review.round-2.md` L1缺少必需的 `batch=na` 与 `path=na`。§3/§4只把无轮号的 `DONE.plan-review.md` 定义为历史旧 schema 输入，没有把 round-2 signal 定义为整改前历史例外。于是当前 durable 工件与新合同自相矛盾，monitor 仍不能按合同机械校验完整历史链。

### 新 P0/P1 检查

除上述 P1-04 残留外，未发现本次整改引入的其它新 P0/P1。

### Targeted 结论

**FAIL** — P0=0，P1=1。`remediation_count=2` 已达上限；按 `task_plan.md` L40、L54，必须交 decider，不得再让 builder 自行整改。decider 需裁定如何在“不覆盖 durable 历史”前提下消解 round-2 signal 与新 schema 的矛盾。

---

## Post-decision independent review — round=post-decision / remediation_count=2

### 身份、session 与输入

- reviewer：`plan-reviewer#2`（Codex 独立复核）；Codex session：`01a0c8bd-87f7-77c3-95a0-661a72ff7137`。
- 输入：`review.plan.md`、`decision.plan-round-3.md`、`DONE.decision.plan.md`、`DONE.plan-review.round-2.md`、`DONE.plan-review.round-3.md`；design/01 §7.5、`HC-RL-A160`、`HC-RL-H19`；design/evidence/13；DevPlan `RLT_29`；`brief.md`、`task_plan.md`、`execution_strategy.md`。
- 边界：仅审核并追加本节、写独立 post-decision signal；未改规划输入、代码或 progress，未派 agent，未执行版本动作，未增加 builder `remediation_count`。

### 核验矩阵

| 核验项 | 结论 | 证据与判断 |
|---|---|---|
| round-2 原字节、round-3 FAIL 与历史例外边界 | **PASS** | `sha256sum DONE.plan-review.round-2.md` 实测为 `9f6cf3a3b0d73f2060f2483d0d79342862cf0302b9bc687b57cf8dd7921ed62f`；其单行仍精确为旧字段集合。`DONE.plan-review.round-3.md` 仍为 `verdict=FAIL p0=0 p1=1`、`remediation_count=2`，当前 SHA-256 为 `393f7f0b810c183dcc87addb0e77879298cf7ae5c2b76830b825ace2cbed2c9b`，裁决未将其改写为 PASS。design/01 §7.5、task_plan §4 与 decision 仅以精确文件名 + 全部旧字段 + 固定 hash 接受这一个 round-2 历史例外；不匹配即阻断，自 round 3 起全部未来 DONE/BLOCKED 强制含 `batch/path` 的新 schema，明确不可类推。 |
| model-allocation gate | **PASS** | design/01 §7.5.1、A160，DevPlan RLT_29，brief 完成条件 2，task_plan §0.2 与 execution_strategy §操作模型一致要求：启动任何 agent 前由 orchestrator 展示全部拟启动角色/实例的模型与推理档并取得明确确认；允许逐角色修改；未确认零启动；默认只作提案；确认后先写 snapshot，启动 monitor 后由 monitor 接管运行期唯一写者；恢复仅复用未变确认，新增/换角色或实例、模型或推理档必须重问；最大权限不替代确认或其它授权。写者交接避免了“先启动 monitor 才能记录确认”的循环。 |
| skill/双 adapter、结构正反例与 H19 真实证据的实施/验收定位 | **PASS** | task_plan batch-1 要求 skill 实现 gate，batch-2 要求双 adapter 落同一启动合同，batch-3 要求结构测试覆盖正例及缺询问、先启动、未确认默认选择、变更免确认等反例，并要求真实询问→用户确认→Herdr workspace/tab/pane/model/推理档→monitor snapshot 的逐实例一致链；缺项或不一致阻断 A160/H19。design A160/H19、evidence/13、DevPlan 与 brief 均把这些写作未来实施/机器证/人验要求，未宣称已经实现或实跑通过。builder/plan-reviewer 的 Codex GPT-5.6 Sol medium 与 w41 说明只登记为局部用户来源事实，精确 tab/实际观察待 monitor 取证；decider 身份也未扩展成其它角色确认。 |
| 原 P1-01～P1-06 回归 | **PASS** | 六项保持 CLOSED：single-task 路由使用 batch 词汇且 W/C/R/X/F 仅作完整模式回归对象；phase/path→sole writer→输入/输出→接收者矩阵仍完整；固定 repo-root cwd、显式 `PYTHONPATH`、可复制命令、expected exit/output 仍成立；RELAY_RECEIPT preflight 与逐角色精确信号合同仍成立；`review_round`/`remediation_count` 分离且上限/接收者不变；baseline/post 同命令比较与新增/变化失败、RLT_29 failure、open P0/P1 阻断谓词仍成立。 |
| 新增 P0/P1 与静态完整性 | **PASS** | 未发现新增 P0/P1；`git diff --check` exit 0。裁决只消解原 P1-04 的历史兼容矛盾并加强模型确认门，没有削弱 zero-context、sole writer、命令、signal、计数或 baseline 门。 |

### P0

无。

### P1

无。

### Post-decision 结论

**PASS** — P0=0，P1=0。原 round-3 FAIL 作为历史记录保持不变；本独立审核确认 decider 的精确兼容裁决和 model-allocation gate 已使规划合同自洽，可由 monitor/orchestrator 按本轮独立 signal 处理。该 PASS 不宣称 skill/双 adapter 已实现，不代签 A160/H19 实跑、人验、verify 或任何版本动作。
