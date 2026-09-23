# review.workflow-final.consistency.review-round-1 — RLT_29 workflow-final 一致性路

- 复核者：reviewer#consistency-r1（Devin SWE-2 Max，w41:tF/pF，实例 r29-wf-consistency-r1）；phase=workflow-final；path=consistency；review_round=1；remediation_count=0。
- 日期：2026-09-23。fresh reviewer，未参与 RLT_29 规划/施工/批次复核/decision/其余 final 路。本文件与 `DONE.workflow-final.consistency.review-round-1.md` 是本棒唯二业务写入；未改代码、合同、证据、lesson_candidates.md 或任何其它工件，未清除任何 `RELAY_*`。

## 0. RELAY_RECEIPT preflight

- `env | grep -E '^RELAY_'` → 无输出（复核开始与收尾各查一次），未命中；走正常复核路径。

## 1. 输入与本 reviewer 独立自跑

只读核验：AGENTS.md、design/01（§7.5、§11 A159～A168/H19、§14、§15）、design/evidence/13 全文、DevPlan P1（§3.2 RLT_29 卡、§5「§14 同步项对照」、§3 汇总行）、brief/task_plan/review/progress/findings/lesson_candidates/execution_strategy、SKILL.md `single-task` 节、双 adapter 同节、test_install_skill.py、as-built 快照、workspace 全部 32 件 DONE/BLOCKED signal、check.batch-1/2/3、四份 decision、review.plan.* 三份、review.workflow-final.{code-round1,requirement,lesson} 三件、evidence/{baseline,batch-1,batch-2,batch-3}/**（含 post-b04-rerun-1/comparison.json 全文）。

| 本棒独立执行（cwd=仓根） | 结果 |
|---|---|
| `python3 -m unittest tools/relay-light/test_install_skill.py`（PYTHONPATH=tools/relay-light，PYTHONDONTWRITEBYTECODE=1） | `Ran 19 tests / OK` |
| `python3 -m unittest discover -s tools/relay-light -p 'test*.py'` | `Ran 240 tests in 1026.415s / OK` |
| `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | `RELAY ALL PASS (SKIPPED: 1)` |
| `dh relay-light` 新鲜实跑 | 59 失败 / 35 警告，与 `post-b04-rerun-1/B-04.txt` 同口径（59/35）；`workspace/RLT_29/brief.md R14` 一条在 baseline 与 post 中均存在，属 inherited |
| `find workspace/RLT_29 -name 'relay_plan.md' -o -name 'relay_log.jsonl'` | 0 命中 |
| `git diff --exit-code 93d65cb -- tools/relay-light/relay_log.py docs/modules/relay-light/relay tools/relay-light/skill/roles.toml` | 禁改路径与 roles.toml 均零 diff |
| `git -c core.quotepath=false diff --stat 93d65cb` + untracked 清单 | tracked 7 件 + untracked 三类，全部在 DevPlan `dh:allowed-paths:v1 task=RLT_29` 闭集内 |
| `sha256sum DONE.plan-review.round-2.md` | `9f6cf3a3…ed62f`，与 task_plan §4 冻结例外逐字一致 |
| `herdr tab list --workspace w41` / `herdr agent list` | 单 workspace w41、16 具名 tab 各 1 pane，与 execution_strategy 行逐项一致；本棒 tF/pF `devin --model swe-2-max --permission-mode dangerous` 与快照行一致 |
| 全部 32 件 signal 字段计数核验 | 新 schema 9~12 字段（FAIL 带 p0/p1/p2，BLOCKED 带 snake_case reason）；历史例外 3 件（builder 旧多行、plan-review round-1 旧 schema、round-2 冻结例外） |

## 2. 跨工件一致性矩阵（派单点名逐项）

| 核对面 | 结论 | 依据 |
|---|---|---|
| 9 phase 闭集 | **一致（一处陈旧示例 → P2-1）**。运行期权威 `plan/plan-review/batch/batch-review/workflow-final/e2-code-review/decision/monitor/human-acceptance` 在 task_plan §1、SKILL L251、双 adapter（claude L134 / codex L136）逐字同文；`test_phase_closed_set_is_nine_phases_not_legacy_five` 显式排除旧 5 值串。残留仅两处：design/01 §7.5.5（L978）旧 5 值示例、evidence/13 §二.8 原始确认合同（形成史忠实登记） | SKILL/adapter/task_plan/test/design/evidence 六处比对 |
| 标头与互斥 | **一致**。`[relay-light:single-task] worker · phase=… · agent=… · batch=… · round=… · workspace=…` 与 `[relay-light] worker · node=…` 在 AGENTS/SKILL/双 adapter 四处双向互斥；本棒派单首行逐字吻合；`batch=1\|2\|3\|na` | 四文档同文 + 派单实样 |
| signal schema | **一致**。单行 `DONE\|BLOCKED task phase agent batch path review_round remediation_count verdict evidence`（BLOCKED 加 `reason=<snake_case>`）；32 件实存 signal 全部可解析，值无空白、evidence 为 repo 相对路径；历史例外三件的豁免规则（精确文件名+旧字段+SHA-256 三重匹配）实测 round-2 hash 一致 | §4 表 + 全量实测 |
| role-writer 边界 | **一致**。workspace 全部文件可归因：builder→brief/task_plan/review/findings/七件套；orchestrator→execution_strategy；batch coder→progress 三条里程碑 + 经 `decision.batch-3-b04-evidence-id.md` 限权附录；batch reviewer→check.*；reviewer→review.*；decider→decision.*；产出型→各自 signal。无 monitor 署名工件、无轮询/通知日志 | 全量文件归因 |
| RELAY_RECEIPT 分流 | **一致**。产出型精确 `BLOCKED.*.md` vs monitor 零写+prompt-only 的分流在 AGENTS、SKILL L252/L283、双 adapter、task_plan §0.1、execution_strategy 五处同文；两分支均不清 `RELAY_*`；monitor 不写 BLOCKED | 五文档同文 + 本棒实测未命中 |
| 模型确认闸 | **一致**。execution_strategy 记 2026-09-22 用户明文确认 + confirmed-observed/-cleared/-pending 状态机；`model-allocation.md` + `herdr/` 捕获与实态逐项一致；wf 五路 fresh 实例 argv 均为 `devin --model swe-2-max`；未启动项（wf 后续轮、E2）如实 pending 未预造 | execution_strategy vs live Herdr |
| monitor 零写 + 安全 Enter | **一致（一项运行态观察 → P2-7）**。三条件同真→单次→复验→失败换 fresh 禁连按在四文档同文，codex 侧 `agent read` 输入框清空判据为平台特化补强；workspace 无任何 monitor 写入。观察：复核时点 monitor（t3/p3）`agent_status=done`，而 lesson round-2/E2 仍在飞——合同预期常驻，属 orchestrator 运行态事项，不构成工件矛盾 | 四文档 + 文件归因 + live Herdr |
| batch clear | **一致**。b1/b2/b3 各批 durable reviewer PASS→工件齐全→coder/reviewer 各一次 `/clear`→复验（revision=5）均有 execution_strategy 记录，FAIL/整改期无 clear，monitor 未 clear | execution_strategy + check.batch-2 §1.1 前置链 |
| 恢复真相 | **一致**。四类权威（durable signals、独立 review/decision、execution_strategy、Herdr 实态）在 SKILL L287、双 adapter、execution_strategy L8 同文；`progress.md` 与 monitor 通知明确非真相 | 三文档同文 |
| heavy 五路 fresh | **一致**。五路各派独立 fresh 实例（tC~tG 五个不同 tab/argv），均 review_round=1 remediation_count=0；无复用冒充 | live Herdr + signals |
| E2 same-session | **一致且分层正确**。E2 初审 fresh、仅 open P0/P1 时同 `reviewer_session_id` targeted attempt 2，与 wf「每轮 fresh」条件相斥分别登记（SKILL L265、task_plan §2、review.md 分层表、execution_strategy pending 行）；E2 未派，无冒充 | 四文档 + review.md 分层 |
| 计数与信号文件名 | **基本一致（一处合同空隙 → P2-4）**。§4 冻结文件名全部命中；lesson 路 FAIL→整改 READY 链合法，但 `DONE.workflow-final.lesson.coder-remediation-1.md` 不在 §4 冻结表（§4 只冻 reviewer 侧 `review-round-<n>`），且 `agent=coder#lesson-remediation-1` 用派单别名而非稳定实例名（先例：`builder#1`/`coder#b3` 整改 signal 均保持原名），execution_strategy 无该别名行 | §4 表 vs 实存 signal |
| 实际 Herdr snapshot | **一致**。16 具名 tab 各 1 pane、角色/模型/状态与 execution_strategy 行逐项对应；b1~b3 coder/reviewer 已 clear 复验（rev=5）；wf 五路实例 confirmed-observed | tab list + agent list 实测 |
| B-04 最终状态 | **一致**。`post-b04-rerun-1/comparison.json`：owned=0、canonical inherited Counter==baseline 59、全部 guards ok；本棒新鲜 `dh` 实跑 59/35 同口径；原 `post/` FAIL 原件保留未覆盖 | comparison.json + 自跑 |
| as-built vs review 当前状态 | **一致但有陈旧行 → P2-2**。as-built 头部明标「记录时点：batch-3 施工结束点」，§4 B-04 行如实对应原 `post/`（66 失败/7 owned 未过），§5 如实列未发生项；但无指向 `post-b04-rerun-1/` 解决链的前向回链，E10 读者单读 as-built 可能误读 B-04 仍失败 | as-built 全文 + rerun 证据 |
| full relay 零回归 | **一致**。pwsh 套件 ALL PASS（SKIP 1）、py discover 240 OK、`relay_log.py`/`relay/**`/roles.toml 零 diff、无 plan/log 文件 | 本棒自跑 + diff 实测 |
| allowed paths | **一致**。allowed-path audit PASS；tracked/untracked 变更全在 `dh:allowed-paths:v1` 闭集 | B-06 + diff 实测 |

## 3. 派单点名三处重定级

- **design §7.5.5 旧 5 值 phase 枚举 → 维持 P2（陈旧示例，非现役矛盾）**。依据：①运行期权威闭集 9 值在 task_plan/SKILL/双 adapter/结构测试四处钉死，`test_phase_closed_set_is_nine_phases_not_legacy_five` 显式把该 5 值串断言为「不得出现在合同文档」之外的 oracle；②本棒与全部实发派单均用 9 值之一，无一处按 5 值路由；③A165 验收口径是「标头字段合法+互斥」，不以该枚举为定义；④同串在 evidence/13 §二.8 是原始确认合同的忠实登记，属形成史。误导读者的现实风险低，但收口阶段应同步 design 该行，故列 P2 不升级。
- **as-built §4 B-04「66 失败·未过」→ 维持 P2（时点标注合格，缺前向回链）**。该文件头部「记录时点：batch-3 施工结束点」+ §5「未发生（不预造）」构成合格的时点快照框架，B-04 行如实对应 `post/` 原始运行——不是伪造或误报。缺口仅在：rerun 裁决限定写范围为 evidence+signal，as-built 未回刷也无指向 `post-b04-rerun-1/` 的指针。收口/E10 备料时须并列呈现 rerun comparison 或在 as-built 补一行带日期的 supersede 注记（沿用 check.batch-3 P2-2 建议），不构成放行阻断。
- **DevPlan §5「§14 同步项对照」缺第 8 行 → 确认属实，P2**。表内实存行 1~7、9 共八行；第 8 项「Linux 预演回流（RLT-A-08）→ RLT_21」（design §14.8）缺失，而 DevPlan L877 声称「§14 九个同步项均有 owner」。文本-表格自相矛盾属实，但缺项归属 RLT_21 非本卡范围，RLT_29 承接的第 9 项在表且行内证据链完整；不误导本卡执行/验收，建议收口补齐第 8 行或修正汇总行措辞。

## 4. findings

- **P0：无。P1：无。**
- **P2-1**：design/01 §7.5.5 标头示例枚举旧 5 值 phase（详见 §3），建议收口由 decider/orchestrator 同步为 9 值或泛指。
- **P2-2**：as-built §4 B-04 行缺指向 `post-b04-rerun-1/` 解决链的回链，E10 展示须并列 rerun comparison（详见 §3）。
- **P2-3**：DevPlan §5 同步项表缺第 8 行（RLT_21 项），与「九个同步项均有 owner」汇总行矛盾（详见 §3）。
- **P2-4**：workflow-final coder 整改 signal 未入 §4 冻结文件名表，`agent=coder#lesson-remediation-1` 别名偏离稳定实例命名先例且未登记 execution_strategy（物理实例实为 r29-b3-coder tA/pA 同 session 复用，满足「同 coder」实质）。建议收口在合同层钉 wf 整改 signal 命名（如 `DONE.workflow-final.<path>.coder-remediation-<n>.md` 沿用现名即可）并在 execution_strategy 补别名/实例映射注记。
- **P2-5**：`DONE.decision.batch-clear.md` 无同名 decision 文档——裁决正文以节形式落在 `decision.batch-1.quotepath.md`（signal evidence 指 task_plan.md），可溯源但命名粒度不齐，备查。
- **P2-6**：evidence/13 §二.6（monitor 写 progress/唯一真相）与 §二.8（5 值标头）保留被 §七 显式 supersede 的旧文且无行内回链；§七本身已明记更正前后合同，形成史定位合格，与 code-round1 P2-6 同源确认。
- **P2-7（运行态观察）**：复核时点 monitor 实例 `agent_status=done`（t3/p3），合同预期常驻至收口；剩余 wf round-2/E2 派发期间的状态变化提示将缺一环。monitor 零写 by design，无工件受损；提示 orchestrator 评估是否需补拉起，不构成本路阻断。
- **P2-8（沿用 requirement-r1 P2-2 确认属实）**：review.md 完成条件表 1/3/4/6/8/10 行证据格仍为「待 batch-3」「待 final」占位，batch-3 证据已交付、final 正在闭合，收口/E10 备料时应刷新为实际 E-ID/工件引用。

## 5. 不属于本路缺口的事项

- lesson 路 P1×4（L01~L04 漏登记）已由 lesson-r1 FAIL 触发整改，`coder#lesson-remediation-1` READY（02:51）+ fresh round-2 待派——按合同流转中，不是一致性缺陷。
- `DONE.plan-review.post-decision.md`（agent=plan-reviewer#2）与 decision.plan-round-3 §32「交原 plan-reviewer」的字面差：review.plan.md L156 自证 #2 执行 post-decision 独立核验，且该 PASS 已被 user-adjust 显式取代（task_plan §0.1），属已裁决历史。
- decision.plan-round-3 §36「运行期 sole writer 仍为 monitor」为裁决时点旧合同表述，随后被用户更正（evidence/13 §七）；durable decision 不回写是正确行为，现役合同五处均已为 orchestrator 写者。
- `DONE.batch-3.coder.md` 不存在非缺口：batch-3 coder 的收口 signal 按 §4 冻结行路由为 `DONE.batch-3.coder.b04-rerun-1.md`（READY 01:41），泛用行仅覆盖无 B-04 链的普通路径。
- full relay 侧 `relay_plan.md`/`relay_log.jsonl`/W/C/R/X/F 引用全部位于完整模式合同段与测试内，与 single-task 互斥段明确分离，零回归已由本棒自跑证实。

## 6. 结论

P0=0、P1=0 → **PASS**。跨工件一致性：9 phase 闭集、标头互斥、signal schema、sole-writer、RELAY_RECEIPT 分流、模型确认→实态链、monitor 零写+安全 Enter、batch clear 闸、四类恢复权威、heavy 五路 fresh 与 E2 same-session 分层、计数与文件名、Herdr 实态、B-04 终态（owned=0）、full relay 零回归、allowed paths 全部一致或在合同中如实分层。八条 P2 均为收口建议级，无一条会误导执行或验收；其中 §7.5.5 旧枚举、as-built B-04 行、DevPlan §14 缺行三处点名项维持 P2 定级（理由见 §3）。本 PASS 仅为 workflow-final `consistency` 一路初审结论，不代表其余四路、lesson round-2、E2、人验或任务收口。
