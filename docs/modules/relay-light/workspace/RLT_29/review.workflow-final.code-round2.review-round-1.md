# RLT_29 · workflow-final / code-round2 · review_round=1

- 审核者：`reviewer#code-round2-r1`（fresh 实例 `r29-wf-code2-r1`，w41:tD/pD；独立于全部施工者与 code-round1 reviewer `r29-wf-code1-r1`）
- 日期：2026-09-22；基线：`master@93d65cb`；分支：`wt/RLT_29`
- 范围：全量 diff（tracked + untracked）、brief/task_plan/review、三批 checks、code-round1 review、B-04 完整裁决链、并发 final 路信号与工件（仅作上下文，不接管其结论）
- 结论：**PASS（P0=0，P1=0，P2=8）**

## 0. Preflight

- `env | grep -E '^RELAY_'`：无输出、exit 1 → 无 `RELAY_RECEIPT`，按正常复核路径执行；未清除任何 `RELAY_*`。
- 本棒只写本文件与 `DONE.workflow-final.code-round2.review-round-1.md`，不改实现/合同/既有 review/证据/其它 signal。

## 1. 独立执行的验证（全部本棒亲跑）

| 项 | 结果 |
|---|---|
| `python3 -m unittest tools/relay-light/test_install_skill.py` | exit 0，19 tests OK |
| `python3 -m unittest discover -s tools/relay-light -p 'test*.py'` | exit 0，240 tests OK |
| `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | exit 0，`RELAY ALL PASS (SKIPPED: 1)` |
| 禁改 diff：`relay_log.py` + `docs/modules/relay-light/relay/**` | 无差异，exit 0 |
| `roles.toml` diff | 无差异，exit 0 |
| `git diff --check` | exit 0，无输出 |
| §6 allowed-path 审计（双侧 `git -c core.quotepath=false`） | PASS，全部变更在允许清单内 |
| 任务工作区 `relay_plan.md`/`relay_log.jsonl` 扫描 | 不存在，PASS |
| fresh `dh relay-light` | exit 1，59 inherited failures + 35 warnings；与 `post-b04-rerun-1/dh-output.txt` **逐字节一致**；RLT_29-owned failure=0；两条 RLT_29 R14 brief 警告基线已存在 |
| RED 快照保真：`evidence/batch-3/red/baseline-skill-93d65cb/` 五文件 vs `git show 93d65cb:` | 全部 byte-identical |
| Herdr 实态证据（tab-list/agent-list/workspace-list/pane-argv） | 存在且与 execution_strategy 快照一致，本实例登记为 confirmed-observed |
| B-04 rerun `comparison.json` | canonical inherited Counter=59 与 baseline 相等，RLT_29-owned=0，动态 R30 路径集闭合归一 |

## 2. 第二视角语义核查（逐项结论）

### 2.1 cross-platform Herdr 命令 — 无冲突

- Claude adapter：`herdr tab create --workspace <ws> --cwd <wt> --label <role> --no-focus` + `root_pane.pane_id`，与既有段（adapter 37–43 行）命令形态一致；`claude` kind Linux 直启 `-- --model --effort --dangerously-skip-permissions` 与原文一致；Windows `pane run`+`agent rename` shim 路径保留。
- Codex adapter：`pane split --current --direction right --cwd <wt> --no-focus`、后续 split 显式指定目标 pane（不复用 `--current`）、`Codex 侧无 run_in_background` 与 adapter 既有 88 行约定一致；`agent wait --timeout 120000` 阻塞式节拍与 SKILL「每 120 秒一轮——wait 返回后 get+read 核对」语义闭合。
- monitor Enter 三条件（派单仍在输入框含 Devin queued、`state_change_seq` 未推进、非审批 UI）在 SKILL/双 adapter/design §7.5.4 四处逐词一致，「只发一次+复验+失败换 fresh 不连按」一致。

### 2.2 恢复/信号/清理/权限边界 — 无漏洞

- RELAY_RECEIPT 双分支 fail-closed（产出型写本角色精确 BLOCKED；monitor 零写只发非 durable prompt）在 AGENTS/SKILL/双 adapter 四处一致，且与 plan-review monitor-contract round-1 P1-01 整改记录吻合；两分支均禁止清 `RELAY_*`。
- durable 真相集（signals + 独立 review/decision + execution_strategy + Herdr 实态）与 progress.md「仅证据索引、非运行真相」在全部合同文档一致；monitor 通知显式非 durable。
- 清理闸（§49）：PASS+工件齐全→orchestrator 对 coder+reviewer 各一次 `/clear`+复验→才启动下一批；FAIL/整改期禁止 clear；monitor 常驻不 clear；失败不盲目重发。无「清掉整改计数」路径。
- 权限边界：模型闸「最大工具权限不扩张 commit/push/PR/merge/deploy/verify/人验授权」与 execution_strategy 快照比对、恢复复用/变更重问规则一致。

### 2.3 durable signal schema — 一致，两处卫生观察见 §4

- 新 schema 九字段 + BLOCKED `reason` 在 task_plan §101–102、双 adapter、design §7.5 一致；`verdict` 闭集含 `READY|PASS|FAIL|RESOLVED`（lesson 整改 signal 的 `verdict=READY` 合法）。
- round-2 历史例外：decision.plan-round-3 + task_plan §122 以精确文件名+旧字段+SHA-256 三重匹配冻结，不回写不改 FAIL，不类推例外——机制自洽。

### 2.4 安装副本 / roles / full-relay 回归 — 无

- `install_skill.py` 未改；唯一可执行变更在 `test_install_skill.py`（roles.toml 安装侧字节相等断言 + 11 个 `SingleTaskStructureTests` + `RELAY_LIGHT_SKILL_DIR` 重定向）。
- `roles.toml` 与 `docs/modules/relay-light/relay/**` 零 diff；完整 relay 测试套件全绿。
- 240 tests OK 中含安装一致性用例；仓内源与安装副本由 `--all` 单向覆盖合同维持。

### 2.5 B-04 归一化 — 成立

- 初跑 66 failures（59 inherited + 7 RLT_29-owned stale review.md + 1 动态路径 R30 诊断）经 decision.batch-3-b04 → evidence-id 登记 → rerun 后归零；归一化仅作用于显式批准的闭合路径集，fresh 输出与捕获证据逐字节一致；未把 inherited 失败误当 PASS。

### 2.6 当前工件无虚假完成声明

- `review.md` 中 workflow-final 汇总、E2、Recipe 闭合、人验、verify SHA 仍标注 pending/未来态，与真实状态一致；无任何工件宣称人验/merge/verify 已完成。
- 并发路状态：requirement round-1 PASS；lesson round-1 FAIL（P1=4）已走 `coder-remediation-1`（`verdict=READY`）整改，`lesson_candidates.md` 已落 L01–L06，待 fresh round-2 复审——属 lesson 路自身收口，不影响本路判级但记录在此。

## 3. 变异负例（/tmp 只读构造，RELAY_LIGHT_SKILL_DIR 重定向，11 个结构测试）

| 变异 | 结果 | 含义 |
|---|---|---|
| mutA：monitor 只读行**之后**追加矛盾句「monitor 也可以把轮询日志写进 workspace」 | **11/11 PASS** | 追加型矛盾不可见（→P2-4） |
| mutB：在真行**之前**插弱化「完全只读」行 | FAIL | first-match 对前置弱化 fail-loud |
| mutC：adapter gate 与拓扑节互换 | FAIL | 顺序断言有效 |
| mutD：`不得清除任何 RELAY_*` 弱化措辞 | FAIL | 正则缺失即挂 |
| mutE：schema 行删 `review_round` | FAIL | 字段缺失即挂 |
| mutF：AGENTS.md single-task 段 monitor 条款反转 | **11/11 PASS** | AGENTS 零覆盖（→P2-5） |

套件对「删除/弱化/重排/丢字段」全部 fail-loud；盲区精确限定为「已满足节内追加矛盾」与「AGENTS.md 不在文档集」两类。

## 4. Findings（全部 P2；无一阻断）

- **P2-1** `design/01` §7.5.5（978 行）标头枚举滞留 `phase=<plan|batch|final|decision|monitor>`，与 task_plan §38 九阶段闭集（`workflow-final`/`e2-code-review`/`plan-review`/`batch-review`/`human-acceptance`）矛盾；§7.5 其它处（960/963 行）与全部运行期合同（SKILL/adapter/AGENTS/task_plan 用通用 `phase=<phase>`）正确，运行无实害。建议收口时把该枚举改为通用占位或同步九值。
- **P2-2** DevPlan §14 对照表（747–756 行）行号为 1–7、9，**缺第 8 项**，而 877 行称「九个同步项均有 owner」。建议补第 8 行或改述为「明列八项+第 9 项」。
- **P2-3** as-built §4 B-04 行仍记初跑 66 未过，rerun 证据在 `post-b04-rerun-1/` 另册；事实为真但汇总行易误读。建议该行加 rerun 指针。
- **P2-4** 结构测试对已满足节内**追加型矛盾**不可见（mutA 实证 11/11 PASS）；删除/弱化/重排/丢字段均 fail-loud。与 round-1 P2-4 同向，补了具体复现。建议在收口或后续卡中补「禁止句」反例断言或文档级 diff 哨兵。
- **P2-5**（本路新发现）`ALL_SINGLE_TASK_DOCS` 仅含 SKILL+双 adapter，**AGENTS.md single-task 段零结构覆盖**（mutF 反转 monitor 条款仍 11/11 PASS）。§9.1 文档集本就如此约定，故非违约，但 AGENTS 是 worker 首读宪章级入口，反转不会被 CI 发现。建议把 AGENTS single-task 段纳入文档集或在任务卡/设计里显式登记该排除。
- **P2-6**（本路新发现）验收 oracle 与断言面不齐：A161/A162/A164 oracle 声称「adapter 结构测试逐句命中」生命周期顺序/轮次上限/Enter 三条件，实测全部测试文件中对 `120`/`Enter`/`state_change_seq`/`e2-code-review`/`human-acceptance` 无任何断言；requirement review 对 A164 的「结构断言覆盖」表述不准确。这些条款目前由文本核查+真实运行取证覆盖。建议 E10/收口时二选一：补断言，或登记「该等条款以文本核对+实跑证据满足」的解释记录。
- **P2-7** `evidence/13` §二.6 保留被 §七明确判为「错误合同」的旧 monitor 合同（progress 唯一真相且仅 monitor 写），节内无指向 §七的回链；§七本身已更正，属形成史留痕而非现行合同。建议 §二.6 加一句「本节第 6 条已被 §七更正」。
- **P2-8**（本路新发现）signal schema 卫生：lesson round-1 signal 附带 schema 外 `p0=0 p1=4 p2=2` 字段（先例：plan-review monitor-contract round-3 同样带 p0/p1）；`DONE.workflow-final.lesson.coder-remediation-1.md` 文件名落在 §117 文件名矩阵之外（矩阵只定义 `...review-round-<n>`，未定义 workflow-final 整改 signal 名）。两者均被正确消费、无路由实害；建议后续合同把「额外字段容忍度」与「workflow-final 整改 signal 命名」写明。

## 5. 复核声明

- 与 code-round1 结论独立核对：其 6 项 P2 中 5 项（P2-1/2/3/4/6）经本棒独立复现确认；其 P2-5（历史 signal schema 例外）经 decision.plan-round-3 冻结机制核查自洽。
- 本路不接管 lesson/requirement 路结论；lesson 路 FAIL 整改在该路内闭环。
- 未执行 verify/人验/commit/push/PR；本 PASS 仅为 workflow-final 五路之一 code-round2 的结论，不等于 Recipe 闭合或任务完成。
