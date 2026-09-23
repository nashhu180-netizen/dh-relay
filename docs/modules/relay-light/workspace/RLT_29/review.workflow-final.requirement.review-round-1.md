# review.workflow-final.requirement.review-round-1 — RLT_29 workflow-final 需求方向路

- 复核者：reviewer#requirement-r1（Devin SWE-2 Max，w41:tE/pE，实例 r29-wf-requirement-r1）；phase=workflow-final；path=requirement；review_round=1；remediation_count=0。
- 日期：2026-09-23。fresh reviewer，未参与 RLT_29 规划/施工/批次复核。本文件与 `DONE.workflow-final.requirement.review-round-1.md` 是本棒唯二业务写入；未改代码、合同、证据或其它工件。
- 输入：design/01 §7.5 与 §11 A159～A168/H19、brief.md 全部完成条件、DevPlan §3.2 RLT_29 卡、task_plan.md、review.md/progress.md/execution_strategy.md、三批 check + final code-round1 证据、实现 diff 与真实 Herdr 证据（`evidence/batch-3/herdr/`、`model-allocation.md`）。

## 0. RELAY_RECEIPT preflight

- `env | grep -E '^RELAY_'` → 无输出，未命中；走正常复核路径。未清除任何 `RELAY_*`。

## 1. 本 reviewer 独立自跑（非引用前人结论）

| 命令/观察（cwd=仓根） | 结果 |
|---|---|
| `git -c core.quotepath=false diff --stat 93d65cb` + untracked 清单 | tracked 7 件（AGENTS/design/DevPlan/SKILL/双 adapter/test_install_skill.py）+ untracked 三类（workspace/RLT_29、as-built 快照、design/evidence/13），全部落 DevPlan `dh:allowed-paths:v1 task=RLT_29` 闭集 |
| `git diff --exit-code 93d65cb -- tools/relay-light/relay_log.py docs/modules/relay-light/relay` | exit 0，禁改路径零 diff |
| `git diff --exit-code 93d65cb -- tools/relay-light/skill/roles.toml` | exit 0，roles.toml 字节未动 |
| workspace 内 `find` 扫 `relay_plan.md`/`relay_log.jsonl` | 0 命中 |
| `python3 -m unittest tools/relay-light/test_install_skill.py`（PYTHONPATH=tools/relay-light） | exit 0，`Ran 19 tests / OK` |
| `sha256sum DONE.plan-review.round-2.md` | `9f6cf3a3…ed62f`，与 §4 冻结历史例外逐字一致 |
| `herdr tab list --workspace w41`（只读实测） | 单 workspace w41、16 个具名 tab 各 1 pane：主会话/ builder/ monitor/ plan-review/ decider/ b1~b3 coder+reviewer/ wf-code1/code2/requirement/consistency/lesson-r1；monitor `working`，五路 wf reviewer 中 code1 `done`、其余四路 `working`（含本路 tE） |

## 2. 完成条件逐条映射（brief §完成条件 → design A159~A168/H19）

| # | 条件要点 | 验收 ID | 实际证据 | 覆盖判断 |
|---|---|---|---|---|
| 1 | single-task 与完整 relay 并列互斥；无 plan/log/WCRXF；完整模式零回归 | A159 | AGENTS `### single-task 单卡接力段`（双向互斥明写，full 段零字节改动）；SKILL `## single-task 单卡接力模式` 与双 adapter 同节（均声明确语义单源在 SKILL）；phase 九值闭集无 W/C/R/X/F；workspace 实测无 `relay_plan.md`/`relay_log.jsonl`；`relay_log.py`/`relay/**`/roles.toml 零 diff；19 tests OK（含 11 条 SingleTaskStructureTests 断言互斥与九值闭集并显式排除旧 5 值串）；批次复核自跑 240 tests 全绿 | **覆盖**（结构断言 + 实测无 plan/log + 禁改零 diff） |
| 2 | 一任务一 workspace、独立具名 tab/pane；启动前逐角色模型/推理档询问确认，未确认零启动；确认落 `execution_strategy.md`；恢复沿用未变确认、变更重问；权限不扩张授权 | A160 | `execution_strategy.md` 记录 2026-09-22 用户明文「嗯 确认」模型分配表、逐角色实例/模型/推理档/tab 行、确认来源列与 confirmed-observed/pending 状态机；`evidence/batch-3/model-allocation.md` + `herdr/*.json`/`pane-process-argv.txt` 逐实例 argv 与快照一致；本棒实测 w41 扩到 16 tab 后仍一任务一 workspace、一实例一具名 tab/pane，wf 五路 fresh 实例 argv 与「已确认 fresh reviewer=SWE-2 Max」行一致；gate 合同三文档齐备（提案表→询问→未确认零启动→逐角色可改→快照→变更重问→超时/静默/最大权限不推定确认），双 adapter 列四项明文违规反例，结构断言钉住 gate 先于拉起段 | **覆盖**（已启动实例询问→确认→实态一致链齐；未启动实例如实 pending 未预造） |
| 3 | 生命周期 workspace/task_plan→plan review→分批+batch review→按 task_type 展开 final→主会话人验；batch 与 final 两道独立闸 | A161 | 实际发生链：七件套+task_plan → plan-review round1/2/3 FAIL → 超限交 decider（`decision.plan-round-3.md` RESOLVED）→ user-adjust monitor-contract 复审（round-3 PASS）→ batch-1/2/3 各有独立 `check.batch-N.md` + durable PASS signal → batch-3 PASS+双 clear 后才 fan-out workflow-final（本棒即其中一路）→ 人验仍 pending。batch PASS 未被当作 final 替代 | **覆盖** |
| 4 | plan/batch review 各最多整改 2 轮、FAIL 回同 builder/coder+原 reviewer；workflow-final 每 path 最多返工 2 轮且每轮 fresh；超限分路 | A162 | plan 阶段 round1~3 同 plan-reviewer#1、remediation_count=2 超限交 decider，裁决后 user-adjust 链（builder#2/plan-reviewer#2）两轮整改内 PASS；batch 三批均 round-1 PASS 无整改；workflow-final 五路并发各派独立 fresh 实例（实测 tC~tG 五个不同 tab/实例），均 review_round=1 remediation_count=0；review.md 分层表登记 fresh vs E2 same-session 互斥条件 | **覆盖**（当前无超限、无冒充 fresh） |
| 5 | monitor 对 repo/workspace 完全只读、只 Herdr wait/get/read+prompt 通知；恢复四类权威；`progress.md` 仅当前 batch coder 写里程碑 | A163 | 三文档 monitor 零写枚举齐备；workspace 全部文件可归因到 builder/decider/coder/reviewer/orchestrator，无 monitor 署名工件、无轮询/通知日志；`progress.md` 恰三条 batch 里程碑（各批 coder 一条）+ 经 `decision.batch-3-b04-evidence-id.md` 限定授权的 ledger 附录；四类恢复权威在三文档同文 | **覆盖**（合同+零写事实；通知非 durable 属设计要求） |
| 6 | monitor 120s wait/get、无变化静默；Enter 三条件同时成立发一次并复验、失败换 fresh、禁止连按 | A164 | SKILL/双 adapter 逐句一致（120s、三条件、单次、复验、失败升级、禁连按；codex 侧补 TUI enter 复验判据为平台特化不削弱）；结构断言覆盖；运行时无 Enter 误触证据可落（按设计 monitor 不落盘），monitor 实例实测在场 `working` | **覆盖**（合同+断言层；运行期按设计无可落盘物） |
| 7 | 标头字段合法且与 full 标头互斥；产出型 DONE/BLOCKED 后即停；RELAY_RECEIPT 分角色 fail-closed；不清 RELAY_* | A165 | 本棒派单首行 `[relay-light:single-task] worker · phase=workflow-final · agent=reviewer#requirement-r1 · batch=na · round=1 · workspace=…` 与合同 schema 逐字吻合；AGENTS/SKILL/双 adapter/task_plan §0.1 四处 RELAY_RECEIPT 分流同文（产出型精确 BLOCKED vs monitor 零写+prompt-only）；全部已发生 signal 单行新 schema（除 §4 明列历史例外），各棒写完即停（文件时序与唯一写入可查） | **覆盖** |
| 8 | 全部适用 Recipe path PASS/可核 N/A、无 open P0/P1；单一 reviewer 不替代 Recipe | A166 | review.md 登记 heavy 五路 + E2 分层、Recipe 勾选未冒充；当前 code-round1 PASS（独立 review+signal），本路及其余三路在跑，E2 未派——结构正确、无单路冒充整套；三批 check 与 code-round1 均 P0=0/P1=0，findings.md 无 open 项 | **覆盖**（谓词与登记结构正确；五路闭合待其余四路，属正常在飞状态非缺口） |
| 9 | durable signal 路由不依赖终端状态；orchestrator 只分发/路由；monitor 只发非 durable prompt | A167 | signal 链完整可追溯（plan FAIL→decision RESOLVED→复审 PASS→batch READY/PASS→BLOCKED→decision→rerun READY→batch-3 PASS→wf fan-out）；orchestrator 仅维护 `execution_strategy.md` 与路由，无代写 review/check；monitor 无 repo signal | **覆盖** |
| 10 | 仓内单源、双 adapter、安装副本一致性、as-built 覆盖 single-task；roles.toml 不写死 | A168 | `install-consistency/` 临时 home 实跑 rc=0、五文件双副本 sha256 10/10 MATCH；roles.toml 源字节零 diff（本棒实测）；as-built `single-task-实现快照.md` 只写已实跑事实、§5 明列未发生项；双 adapter 声明语义单源在 SKILL | **覆盖** |
| 11 | 用户查看真实 Herdr heavy 自举证据并判断模式是否清楚可控（人验） | H19 | **证据已备且仍明确待用户**：`execution_strategy.md`（确认来源+实态快照）、`evidence/batch-3/model-allocation.md`+`herdr/` 原始捕获、w41 单 workspace/16 具名 tab 实态、durable signals 与独立 review/decision 链、progress 索引、无 plan/log 审计、as-built §5 诚实列未发生项；review.md 人验区 `[ ]` 未勾、条件 11 标「待人验」、verify SHA 待回填。无 AI 代签、无因待人验伪 FAIL | **证据备妥、待人验**（符合派单对本条件的检查口径） |

## 3. 方向性专项核对（派单点名项）

- **互斥与无 WCRXF**：两套标头在 AGENTS/SKILL/双 adapter 四处双向互斥；single-task phase 闭集九值、batch=1|2|3|na；无 plan/log 文件、无账本调用、无 W/C/R/X/F 作 phase。**成立。**
- **一 workspace/独立 tab**：实测 w41 单 workspace，16 具名 tab 各 1 pane，与 execution_strategy 快照一致；workflow-final 新增实例仍在同一 w41。**成立。**
- **启动前逐角色模型确认**：`execution_strategy.md` 记用户 2026-09-22 对全角色分配表明文确认，workflow-final fresh reviewer 行注明同一已确认分配；已启动实例 argv 逐项一致；未启动 E2 行仍 pending。确认先于启动的次序由快照+实态比对支撑。**成立**（询问原文不属 repo 工件，确认来源/时点已登记；H19 链条终判在用户侧）。
- **orchestrator 只分发**：`execution_strategy.md` 由 orchestrator 机械维护、未代写施工/复核工件；路由均经 durable signal。**成立。**
- **monitor 只读/120s/变化通知/安全 Enter**：合同三文档一致；workspace 无 monitor 写入；monitor 实测在场运行。**成立。**
- **三批+batch review**：三批各有独立 `check.batch-N.md` 与 durable PASS，与 final 是两道闸。**成立。**
- **heavy 五路与 E2 分层**：review.md 两区分离登记；五路 fresh 实例实测并发；E2 未派且保留 same-session targeted 条件。**成立。**
- **batch PASS 后双 clear**：execution_strategy 记 b1/b2/b3 各批 coder+reviewer durable PASS→工件齐全→各一次 `/clear`→复验（revision=5）；实测六实例 tab idle/done、workflow-final 在其后启动，次序符合 §1.1。**成立。**
- **权限与人验边界**：三文档与 decision 均写明最大工具权限不扩张 commit/push/PR/merge/deploy/verify/人验授权；review.md 人验未勾、verify SHA 未回填；无任何版本/远端动作工件。**成立。**

## 4. 伪完成 / 越界 / 证据缺失核查（P1 面）

- 无伪完成：历史 `BLOCKED.*` 原件保留未覆盖；`post/comparison.json`（verdict=fail）如实留痕；review.md 五路/E2/Recipe/人验/verify 全部 pending/未勾，无未来状态冒充。
- 无方向/范围/验收漂移：diff 全在允许路径闭集；目标（与 full relay 并列互斥的单卡接力）与实际交付（文档合同+结构测试+真实 Herdr 自举证据链）一致。
- 无 open P0/P1：三批 check、code-round1 review、findings.md 均无；本棒 fresh 复核亦未发现。
- B-04 链如实闭合：`BLOCKED.batch-3.coder.md` → 两份 decision → ledger READY → builder attempt-2 → targeted plan-review PASS → rerun READY → batch-3 review PASS；canonical inherited=59、RLT_29-owned=0（经 batch-3/code-round1 两路独立复算）。

## 5. findings

- **P0：无。P1：无。**
- **P2-1（沿用，归 plan/decider 收口）**：design/01 §7.5.5 标头示例枚举旧 5 值 `phase=<plan|batch|final|decision|monitor>`，与运行期 9 值闭集字面不齐；现役合同与结构测试均以 9 值为权威且显式排除该串，属陈旧示例，建议收口同步。与 batch-1/2/3、code-round1 登记同源，非新引入。
- **P2-2（新登记，收口备料建议）**：review.md「完成条件逐条挂证据」中条件 1/3/4/6/8/10 的证据单元格仍为「待 batch-3」「待 final」占位文字——batch-3 证据已交付、final 正在闭合，占位已陈旧；fresh `dh` 实测 0 条 RLT_29-owned，不构成合同失败，但建议收口/E10 备料时刷新为实际证据引用，避免快照被误读。
- **P2-3（观察项，E10 备料建议）**：模型分配「询问」原文为会话内动作，repo 工件只登记确认来源/时点（execution_strategy + model-allocation.md）；H19 终判本就在用户侧，建议 E10 展示时把提案表、确认时点与 herdr 实态截图/捕获并呈，使「询问→确认→实态一致」链对用户可直接核查。

## 6. 结论

P0=0、P1=0 → **PASS**。需求方向复核：single-task 与 full relay 并列互斥、无 plan/log/WCRXF；一 workspace/独立具名 tab/pane；启动前用户逐角色模型确认且实态一致；orchestrator 只分发/路由；monitor 只读+120s+变化通知+安全 Enter；三批各独立 batch review；heavy 五路按 fresh reviewer 并发展开、与 E2 same-session targeted 分层；batch PASS 后双 clear 复验；最大权限不扩张授权、H19/E10 证据已备且明确仍待用户。无方向偏移、无缺证据、无伪完成。本 PASS 仅为 workflow-final `requirement` 一路初审结论，不代表其余四路、E2、人验或任务收口。
