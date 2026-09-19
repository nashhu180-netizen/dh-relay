<!-- dh:v1 · progress.md — 施工日志 + 证据账本。🟢 边做边记；跑偏记这里，不回写 task_plan / DevPlan / design。 -->
# progress — RLT_22 复核触发改非终态「待复核」信号与节点内返工生命周期

> 本文件在 D 开工时只登记开工事实（D-001），**不预填任何运行记录**。所有 E-ID 由实际跑过命令的施工方/复核方追加。

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-15 | 编排派出的 workspace builder | D-001 建工作区七件套（见下「D-001 开工事实登记」）；未改任何程序、未跑任何验收命令、未做 git 写操作 | 本目录七个文件 | 编排核七件套 → 派 B1 施工 worker |
| 2026-09-16 | 编排 `orchestrator#1`（Claude Code 主控会话） | 取得用户当次明确授权后执行 skill 两侧重同步 `python tools/relay-light/install_skill.py --all`（源 = 主检出 master `72c6c4d`，工作区干净）：exit 0，源与 `.claude` / `.codex` 两副本五文件 sha256 三处一致，两份 manifest 已记。该动作闭合的是 **RLT_21 `review.md`「未做且需用户明确授权」中的「两侧用户级 skill 重同步」**一项；本卡尚未开工、未改任何程序 | E-001 | 编排核七件套 → 派 B1 施工 worker |
| 2026-09-16 | 编排 `orchestrator#1`（Claude Code 主控会话） | 按宪章#7 把 `wt/RLT_22` rebase 到 master `72c6c4d`（`git rebase --autostash master`，4 笔重放无冲突；本卡工作区内容与 rebase 前逐字节一致，`git diff e14bcd3 HEAD -- .../RLT_22` 为空），并以 `--force-with-lease` 覆盖远端（本条提交随该次推送上行）。**D-001「基线」一栏仍记 `544ccdb` 不改**——那是 D-start 当时的事实，不随 rebase 改写；施工 worker 进场无需再 rebase，但仍按铁律自查 | `git merge-base HEAD master` = `72c6c4d` | 编排核七件套 → 派 B1 施工 worker |
| 2026-09-19 | 施工 worker `exec#1`（Claude Code 主会话，用户手动派单「继续 RLT22 的开发」） | **B1 施工**（trigger 四态扩集 A150/A35/A71 + 送审写入合同 A145）。过程：进场 `git rebase --autostash master`（up to date）；先写新测试确认 RED（E-002），再最小实现转绿（E-003）。实现内容：①`lint_plan` 的 trigger 校验由 `on:done:` 单前缀改为 `{"on:done:", "on:review_ready:"}` 双前缀分流（A35/A71 语义与报错不变，`on:done` 分支文案经 `prefix[:-1]` 逐字保留）；②`_require_trigger` 在 `on:done:` removeprefix **之前**插入 `on:review_ready:` 分流占位（B1 不设前置，防串味误报 A70；A144 前置 B2 承接）；③新增 `JUDGE_ROLES` 闭集常量与 `_validate_review_ready_signal`（挂 `_validate_event_semantics` 的 checkpoint 分支、位于状态机校验之后）：仅当 note 含 `ready_for_review=` 时生效——原始串上计数恰一个、目标在本节点 agent 表、目标 role ∈ 闭集、写入者非判定角色；`_note_tokens` 零改动。**如实记两次返工**：第 1 版 A145 闸误把**所有** checkpoint 拿去验 token 数（oracle 是「note 含 token 时才管」），全量回归打挂既有 `test_a102_checkpoint_round_trips_do_not_burn_attempts` 与 `test_agent_launch_requires_node_start_and_terminal_agents_are_sealed`（后者按影响分类须保持原样、未被改，是它抓住了越界）；同批新 lint 测试的 `on:review_ready:nobody` 夹具漏了 C1 agent 行，A75 先于 A35 触发。修正（A145 空 token 早退 + 夹具补 C1 行）后 E-003/E-004 全绿。进度侧偏离：施工由主会话直做而非逐批派 headless worker（用户手动派单语境），fresh 小审仍逐批另派（check.B1.md），已按「跑偏只记 progress」登记 | E-002 / E-003 / E-004 / E-005 | 小审 check.B1.md → 编排核 → 派 B2 |
| 2026-09-19 | 施工 worker `exec#1`（Claude Code 主会话，用户手动派单「继续 RLT22 的开发」） | **B2 施工**（拉起前置 A144 + 封口配对闸 A146）。TDD：新测试先 RED（E-006），再实现转绿（E-007）。实现内容：①新增 `_current_instance`（按最大 attempt 取送审方当前实例全名——A49/A58 保证 attempt 严格 +1 串行，最大 attempt 即当前实例）与 `_require_review_ready`（四项前置：本节点存在信号、来自当前实例、`ready_for_review=` 恰等于本判定方、该信号是该实例最新 agent 事件——新鲜度严格用 `_latest_for_instance` 按实例判，不跨 attempt），接入 `_require_trigger` 的 `on:review_ready:` 分支（B1 占位转正）；②新增 `_validate_review_done_pairing` 挂 `_validate_event_semantics` 的 `done` 分支（状态机校验之后）：仅当本节点存在指向该判定方的 ready 信号时生效，校验 `reviewed=<S>#<a>` 与 `ready_seq=<n>`（事件须为本节点 checkpoint、agent 逐字等于 reviewed、token 等于判定方名、是该 (送审实例，判定方) 组合最新一条、送审方已 done）——不落 `_validate_node_close`；③**一处超出 B1 占位口径的最小结构调整（如实登记）**：`_validate_agent_transition` 的 `agent_launch` 分支把 attempt 形状（A58）与重拉资格（A49）检查移到 `_require_trigger` **之前**——否则「判定方 done 后重拉」会先撞 A144（送审方已 done、信号非最新）而不是 oracle 要求的 A49，编号会串；迁移表 `allowed` 字典与 `_require_trigger` 的 `on:done:` 分支一字未动，A70/A77 对全部既有场景的触发顺序与报错码不变（全量回归佐证）。过程返工两次（如实记）：测试夹具首次误用 B1 的空 trigger `W_AGENTS` 导致 A144 闸未参与（改为带 trigger 的 `A144_AGENTS`）；`ready_seq` 取值时机错放在 reviewer#1 launch 之后（取到 launch 行 seq，改为信号写入后即取） | E-006 / E-007 / E-008 / E-009 | 小审 check.B2.md → 编排核 → 派 B3 |
| 2026-09-19 | 施工 worker `exec#1`（Claude Code 主会话，用户手动派单「继续 RLT22 的开发」） | **B3 施工**（止损第三套投影 A147/A107 + 向后兼容 A148/A65 + 模板/adapter 同步 A149 + §3.5 映射表 tripwire——B1 小审 P2 整改）。TDD：先写测试确认 RED（E-010：8 条中 a147 投影 ERROR=LossStop 尚无 review_rounds、A149 四条 FAIL=模板未改；a147 无上限与 A148 两条为回归守卫、实现前即绿），再实现转绿（E-011/E-012/E-013）。实现内容：①`LossStop` 增加 `review_rounds[(node,判定方)]`（ready 信号条数，首轮计入）与 `review_exhausted`（条数 ≥ `limits.rework_max_rounds` 且该判定方在本节点无 `done`），`triggered` 纳入第三套；`loss_stop()` 只投影、`add` 不拒写；`Status`/`status_document` 零改动；docstring 两套→三套；②`SKILL.md`：W 模板 plan-reviewer trigger `on:done:builder`→`on:review_ready:builder`、X 模板 reviewer trigger `on:done:coder`→`on:review_ready:coder`、C 模板 prose 补封口纪律原文、硬规则段新增第 11 条（含 design/01 A149 原文逐字句），**R 模板一字未动**；③两份 adapter 在「派活 prompt 模板」段后各加「送审封口纪律（监工记账）」块（原文逐字同句）；④`dh-mapping.toml` `[limits.on_exceed].note` 「两套计数」→「三套计数」并补 review 一句，键名与取值零改动；⑤`SkillTemplateTests._close_w_stage` 换新 W 流（信号→拉起→送审方 done→配对 done）。测试返工三次（如实记）：`replace` 未按导入名 `dc_replace` 使用（NameError）；X 两路夹具最初依赖模板单 `<打回路>` 行（X1 无 lesson 行被 A145 拒，改为 `_assembled_plan` 后手工追加 lesson 行）；mixed 计数夹具 `[:-1]` 误裁第二条 ready 信号（改为全量保留、追加行 seq 顺延）。**B1 小审 P2 闭环**：`test_a149_template_sync_wcx` 内含 design/01 §3.5 映射表 `on:review_ready:` 两行（A35/A71）的存在断言。**范围外登记**：SKILL.md「账本用法」段第 139 行仍有「attempt 与 X 轮数两套计数」表述——不在本卡变更范围（SKILL.md 仅 W/C/X 模板与硬规则段），记 findings F-011 交编排；skill 改动后的两侧重同步按闸**未执行**（须用户当次明确授权），停在仓内验证 | E-010 / E-011 / E-012 / E-013 / E-014 | 小审 check.B3.md → 编排核 |

| 2026-09-19 | 施工 worker `exec#1`（同会话） | **复核前准备**（用户授权 commit/push/PR、skill 两侧重同步与「继续」后）：①补写教训候选 C-1~C-5（含 B1/B2/B3 分批登记位）；②按 normal 档有效单测要求做**变异点测试**——4 处生产代码语义变异（改条件）全部「改坏必红」（E-015）；③变异 M3 揭示 `test_a146_done_pairing_gate_rejections` 的「他人信号拼接」腿自身有取值缺陷：`ready_seq` 在 `done builder#1` 之后取值、指向 done 行而非 coder 信号行，该腿一直在错误原因上通过（与教训 C-3 同型）——已修（`coder_seq` 紧跟信号行取值），修复后未变异测试绿、变异重验转红；④`relay_log.py` 工作副本 EOL 曾被哈希脚本改为 LF，已重建 CRLF（内容逐字节等价，`git diff --stat` 260=232+28 与改前一致） | E-015 | CONSTRUCTION_DONE → 派 normal 三路复核 |

| 2026-09-19 | 施工 worker `exec#1`（同会话） | **重同步 + CONSTRUCTION_DONE + 派 normal 三路复核**（用户当次授权：①commit/push/PR ②skill 两侧重同步 ③继续）。提交 `7227da3`（feat：程序与 skill 交付）+ `f954ae2`（docs：工作区证据）后执行 `python tools/relay-light/install_skill.py --all`：exit 0，两副本 source_head=`f954ae2362d8`、source_dirty=False，五文件 sha256 三处一致，`roles.toml` 哈希与 E-001 相同（零改动佐证）。随后发 CONSTRUCTION_DONE 并按 normal Recipe 派三路 fresh 复核（code-round1 / requirement / lesson，互不相同、均非施工者与小审者；F-005 路数争议按仓根 AGENTS.md 宪章#5 三路执行，不降路不合路，F-005 源头对齐仍留编排） | E-016 / E-017 / E-018 / E-019 | 三路复核回报 → 整改/收口 |

## D-001 开工事实登记

**动作 D 开工 · 落户**（本登记不等于 verify、不等于验收，也不授权 push / PR / 合并）

| 项 | 值 |
|---|---|
| 任务卡 | `RLT_22` — 复核触发改非终态「待复核」信号与节点内返工生命周期 |
| 权威定义 | `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` 的 `#### RLT_22` 整段 + §3.1 RLT_22 行 |
| GitHub Issue | [dh-relay #24](https://github.com/nashhu180-netizen/dh-relay/issues/24)（OPEN，正文由卡正文生成） |
| worktree | `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_22` |
| branch | `wt/RLT_22` |
| 基线 | `544ccdb`（`docs(relay-light): RLT-A-09 晋级——复核触发改非终态「待复核」信号，续发 A144~A150 并新增 RLT_22`） |
| client | claude-code |
| 档位 / 任务类型 | 标准 / 常规（`dh:task-type:v1 task=RLT_22 type=normal`） |
| 规划来源 | `RLT-A-09`（2026-09-15 晋级） |
| 依赖 | `RLT_21`（第 1 批）。输入已全部落盘，**不以 RLT_12 验收为门** |

**用户 2026-09-15 对 F-008 的方向裁决（只有这三句，不多不少）**

1. 复核类 agent 的 trigger 不再要求被依赖方处于终态；改为承认一个**非终态的「待复核」信号**，施工者在整个复核—返工循环中保持 live。
2. 复核方同样留活口——**不判 PASS 不记 `done`**；PASS 后再依次记双方终态，节点方可关闭。
3. 轮次上限沿用 `limits.rework_max_rounds=2`，超限仍走 strategist → 用户闸。

**用户 2026-09-15 对候选稿六项开放项的逐条裁决**（出处：`design/evidence/10-交叉审核记录-RLT-A09-复核触发信号.md` §三；用户全部按候选稿倾向裁决，逐字采纳、不扩大）

| # | 开放项 | 裁决 | 对本卡的约束 |
|---|---|---|---|
| 1 | 信号名 | **复用 `checkpoint` + 类型化 token**，不新增事件词 | A2 的 19 词白名单一字不改 |
| 2 | W 阶段是否纳入 | **纳入** | 判定角色闭集含 `plan-reviewer`；适用范围 = W / C / X；A149 含 W 模板改动 |
| 3 | R 阶段收窄是否接受 | **接受** | R 模板一字不改；A146 对 R 不生效由「无信号即不设闸」保证 |
| 4 | C 的强制性残留是否接受 | **接受，不改 A95** | checker 仍留空 trigger；C 的封口顺序只在信号存在时受 A146 约束 |
| 5 | 第三套计数是否进 `status --json` | **只投影，不进** | A62 冻结 schema 一字不改 |
| 6 | 向后兼容是否强制迁移 | **不强制** | lint 不拒旧写法、不报「建议迁移」 |

**该裁决未授权的事项**（evidence/10 §三末段原文口径）：不含 D-start 之外的施工授权推定、不含 verify 或代签、不含 `RLT-B-08` 的卡号/批次/依赖决定。skill 两侧重同步（`install_skill.py --all`）须在施工当次另取用户明确授权。

## 证据账本 (Evidence Ledger)

<每条「完成」结论挂一条可复跑的命令 / grep / runtime 输出；不能空口说做完了。类型枚举含 `review-dispatch`（派 agent 复核）/ `session-run`（主控本会话直跑复核），大小写精确。派出证据用 `dh dispatch` 落账。>

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|---|---|---|---|---|
| E-001 | 机器证（skill 两侧重同步） | `python tools/relay-light/install_skill.py --all`（cwd=`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_22`；源=`D:\MyFiles\ai-workflow\dh-relay\tools\relay-light\skill` @ master `72c6c4d` clean；2026-09-16 08:30:23 +08:00） | pass（exit 0；五文件 sha256 三处逐字节一致） | 两个用户级副本与仓内 skill 源一致——闭合 RLT_21 收口遗留的两侧重同步项，并把后续实跑消费的副本对齐到已合并基线。原文见下「E-001 原文」 |
| E-002 | 机器证（B1 RED） | `python -m unittest tools.relay-light.test_relay_log.RelayReviewReadyTests tools.relay-light.test_relay_log.RelayPlanLintTests.test_a150_review_ready_trigger_four_states -v`（实现前；2026-09-19） | fail（符合预期：`Ran 5 tests, FAILED (failures=2, errors=1)`；四态正例被 `HC-RL-A35 line 12: invalid trigger on:review_ready:builder` 拦下、加载链 exit 3；A145 负例被放行 `2 != 0`） | 新测试先行且 RED 原因正确——证实 C-006 因果链（lint 不扩集则带新 trigger 的计划连加载都过不了）与 A145 写入闸缺失 |
| E-003 | 机器证（B1 全量单测） | `python -m unittest tools.relay-light.test_relay_log -v`（实现并两次返工后；2026-09-19，/tmp/rlt22-b1-full2.log） | pass（`Ran 186 tests ... OK`，exit 0） | B1 后全量 186 绿。第 1 次全量（/tmp/rlt22-b1-full.log）曾 3 失败——A145 首版误伤无 token 的普通 checkpoint（打挂 test_a102… 与 test_agent_launch_requires_node_start…）+ 新 lint 夹具 A75/A35 顺序错，均如实记于日志行并已修复复跑 |
| E-004 | 机器证（B1 仓测试入口） | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`（2026-09-19，/tmp/rlt22-b1-relaytests.log） | pass（`RELAY ALL PASS (SKIPPED: 1)`，exit 0；skip 为 psmux 实连套件，与本卡改动无关） | 17 个 pwsh 套件含 `relay-light-log.ps1` 全过 |
| E-005 | 机器证（B1 允许路径四集合 + diff --check） | `git status --short`、`git diff --check`、`git diff --name-only`（cwd=worktree，2026-09-19） | pass（`git diff --check` 无输出；改动集 = `tools/relay-light/relay_log.py` + `tools/relay-light/test_relay_log.py`，恰在允许路径闭集内；untracked 仅测试副产物 `tools/relay-light/__pycache__/`——RLT_10 F-002 已挂账的 .gitignore 缺口，不入库） | B1 无越界改动 |
| E-006 | 机器证（B2 RED） | `PYTHONDONTWRITEBYTECODE=1 python -m unittest tools.relay-light.test_relay_log.RelayReviewReadyTests`（实现前；2026-09-19） | fail（符合预期：`Ran 7 tests, FAILED (failures=2)`——A144 九条拒绝例被 B1 占位放行、A146 配对闸缺失；其余五用例（B1 四用例 + A146 不生效正例）保持绿） | A144/A146 新测试先行且 RED 原因正确 |
| E-007 | 机器证（B2 目标用例） | `PYTHONDONTWRITEBYTECODE=1 python -m unittest tools.relay-light.test_relay_log.RelayReviewReadyTests`（实现后；2026-09-19） | pass（`Ran 7 tests ... OK`） | A144 合法例 + 九拒绝例 + A58/A49 编号不串、A146 正序 + 七拒绝例 + 不生效正例 + 多路正例全绿 |
| E-008 | 机器证（B2 全量单测） | `PYTHONDONTWRITEBYTECODE=1 python -m unittest tools.relay-light.test_relay_log -v`（2026-09-19，/tmp/rlt22-b2-full.log） | pass（`Ran 189 tests ... OK`，exit 0） | B2 后全量 189 绿（含 launch 分支检查顺序重构后的全部既有回归） |
| E-009 | 机器证（B2 仓测试入口 + 允许路径） | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`（/tmp/rlt22-b2-relaytests.log）+ `git diff --check` + `git status --short` | pass（`RELAY ALL PASS (SKIPPED: 1)` exit 0；`git diff --check` 无输出；改动集仍仅 relay_log.py / test_relay_log.py / 本工作区 + check.B1.md 与 done.checker.B1.md） | B2 无越界改动 |
| E-010 | 机器证（B3 RED） | `PYTHONDONTWRITEBYTECODE=1 python -m unittest`（RelayReviewReadyTests a147×2 + a148×2 + SkillTemplateTests a149×4，实现前；2026-09-19） | fail（符合预期：`Ran 8 tests, FAILED (failures=4, errors=1)`——a147 投影 ERROR（LossStop 无 review_rounds）、A149 结构+三条序列 FAIL（模板未改）；a147 无上限与 A148 两条为回归守卫、实现前即绿） | A147/A149 新测试先行且 RED 原因正确 |
| E-011 | 机器证（B3 目标用例转绿） | 同上集合单跑复跑（实现后；2026-09-19） | pass（a147 投影 OK、a147 strategist 链 OK、a148 两条 OK、A149 结构与 W/C/X 三条序列 OK；中途三次夹具返工见 B3 日志行） | B3 全部目标用例绿 |
| E-012 | 机器证（B3 全量单测） | `PYTHONDONTWRITEBYTECODE=1 python -m unittest tools.relay-light.test_relay_log -v`（2026-09-19，/tmp/rlt22-b3-full.log） | pass（`Ran 197 tests ... OK`，exit 0——189 + B3 净增 8） | B3 后全量绿（含模板切换后的全部 SkillTemplateTests 既有回归） |
| E-013 | 机器证（B3 仓测试入口） | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`（/tmp/rlt22-b3-relaytests.log） | pass（`RELAY ALL PASS (SKIPPED: 1)`，exit 0；skip 为 psmux 实连套件） | 17 套件含 relay-light-log 全过 |
| E-016 | 机器证（skill 两侧重同步） | `python tools/relay-light/install_skill.py --all`（cwd=本 worktree；源=`tools/relay-light/skill` @ `f954ae2362d8` clean；2026-09-19）。授权链：上一轮对话已展示 `%USERPROFILE%` 两绝对目标（`C:/Users/nash/.claude/skills/relay-light`、`C:/Users/nash/.codex/skills/relay-light`）→ 用户本轮回复「授权」→ 执行，顺序合规 | pass（`installed:` 两行 + EXIT=0；两 manifest source_head=`f954ae2362d8`、source_dirty=False；五文件 SKILL.md=`8794845a30cf2944…`、adapter-claude-code=`f2829c667594fb42…`、adapter-codex=`eb919bc945ab734b…`、roles.toml=`61e55dc27660cb2d…`（与 E-001 相同）、dh-mapping.toml=`76ed5b6482831d16…` 三处逐字节一致） | 本卡 skill 改动后的两侧重同步（A32 闸口径），消费副本对齐到本卡交付 |
| E-017 | review-dispatch（code-round1） | fresh 子代理 `review#code-round1`，靶子=review.md 复核路径登记 code-round1 行六项 + 整卡 diff（`master...HEAD`） | dispatched（回报写 `review.code-round1.md` + `done.review.code-round1.md`） | normal Recipe 三路之一 |
| E-018 | review-dispatch（requirement） | fresh 子代理 `review#requirement`，靶子=design/01 §11 A144~A150 七条「怎么验」逐字对齐 + A35/A65/A71/A107 承接 + 非目标六条反向证据 + F-006 A102 显式证明 | dispatched（回报写 `review.requirement.md` + `done.review.requirement.md`） | normal Recipe 三路之二 |
| E-019 | review-dispatch（lesson） | fresh 子代理 `review#lesson`，靶子=lesson_candidates.md C-1~C-5 现场证据/去重/可复用性 + 分批登记位完整性 | dispatched（回报写 `review.lesson.md` + `done.review.lesson.md`） | normal Recipe 三路之三 |
| E-015 | 机器证（变异点·改坏必红） | 4 处语义变异逐一施加于 `tools/relay-light/relay_log.py`（sha256 基线/还原=`7f67882f40557aae5b512e8c41c225a609150e2fcec494a0a35ba868e596d433`）：M1 `relay_log.py:1767` A145 计数 `!=1`→`<1` 跑 `test_a145_ready_signal_write_contract`；M2 `relay_log.py:1705` A144 token 比对 name→target 跑 `test_a144_launch_requires_live_ready_signal`；M3 `relay_log.py:2197` A146 agent 逐字校验恒假跑 `test_a146_done_pairing_gate_rejections`（腿缺陷修复后重验）；M4 `relay_log.py:3034` A147 judge_done 恒真跑 `test_a147_review_loss_stop_projection_only` | pass（4/4 断言失败；applied sha256 依次=`e2af333a4b5b20124b0b03213346e61c82cc6b6779fe30002e2ffbd643457693`/`127639e3a8f516417711d9927b5684e0c2639ff34aadf993876fe44908796de5`/`f45f4b56c4c3db1d1e67258380fa33c188408aec81d1200bc2dc151467bf51aa`/`d0450db5aae291ffd1900d3bce315fe4d0e23dbcae74c7d668af048acd3ba47c`；每次还原后哈希=基线） | normal 档有效单测要求：改坏必红，登记表见 review.md 变异点登记 |
| E-014 | 机器证（B3 允许路径 + diff --check） | `git status --short`、`git diff --check`（cwd=worktree，2026-09-19） | pass（改动集 = relay_log.py / test_relay_log.py / `skill/SKILL.md` / `skill/references/adapter-*.md` ×2 / `skill/dh-mapping.toml` / 本工作区，恰在允许路径 `tools/relay-light/**` 与 `workspace/RLT_22/**` 闭集内；`git diff --check` 无输出） | B3 无越界改动；R 模板三行经 `test_a149_template_sync_wcx` 逐字断言未动 |

## E-001 原文（skill 两侧重同步 · 2026-09-16）

**授权链（如实记时序）**：用户 2026-09-16 在对话中明文「授权重装，然后提交推送」；AI 在执行前的同一轮回复中展示了 `%USERPROFILE%` 解析后的两个绝对目标（`C:\Users\nash\.claude\skills\relay-light`、`C:\Users\nash\.codex\skills\relay-light`）与待覆盖的差异范围。**用户的授权先于路径展示给出**，非「展示→授权→执行」的标准顺序，据实登记、不美化。该授权只覆盖本次重同步与本次 commit / push，不含 PR、CI、服务端合并、verify 与验收。

**执行前现状**：两侧 manifest 均为 `source_head=51d8062`（2026-09-14 23:30 装），五文件中 `SKILL.md`、`references/adapter-claude-code.md`、`references/adapter-codex.md`、`dh-mapping.toml` 四个与仓内源不一致，`roles.toml` 一致；差异内容 = RLT_21（PR #27）合入的 4 文件 45 行新增。

**命令与退出码**

```text
$ python D:/MyFiles/ai-workflow/dh-relay/tools/relay-light/install_skill.py --all
installed: C:\Users\nash\.claude\skills\relay-light
installed: C:\Users\nash\.codex\skills\relay-light
EXIT=0
```

**三处 sha256 比对（源 / `.claude` / `.codex`，逐文件一致）**

| 文件 | sha256（三处相同） |
|---|---|
| `SKILL.md` | `896e58e817d5ba56964525a59a618177b39ed23a09f8afcdfcba502a8b80e67f` |
| `references/adapter-claude-code.md` | `11c54a82cc6e6f7fcc4aec7ed6fa2b8501915fad88ce61185781724a4399a91b` |
| `references/adapter-codex.md` | `35b75eabe517b2e29b2ce604f531c0612da5f4ae87eb42b4660a0427e174d8b0` |
| `roles.toml` | `61e55dc27660cb2dd90106aca3f6e07aac2010721263d1573ca0067a52284861` |
| `dh-mapping.toml` | `7479f11ec214537c8e1835408bbd9db18aa01761c177b28cd9dd4505db74c787` |

另断言 `git diff --stat master..HEAD -- tools/relay-light/skill` 为空——本卡树内 skill 源与 master 逐字节相同，故以 master 为源与以本树为源等价。

**两份 manifest（安装器写出的当前状态）**

```json
// C:\Users\nash\.claude\skills\relay-light\manifest.json
{
  "source_head": "72c6c4d7aed299fd59ad49db1a3335b403147797",
  "source_dirty": false,
  "files": {
    "SKILL.md": "896e58e817d5ba56964525a59a618177b39ed23a09f8afcdfcba502a8b80e67f",
    "references/adapter-claude-code.md": "11c54a82cc6e6f7fcc4aec7ed6fa2b8501915fad88ce61185781724a4399a91b",
    "references/adapter-codex.md": "35b75eabe517b2e29b2ce604f531c0612da5f4ae87eb42b4660a0427e174d8b0",
    "roles.toml": "61e55dc27660cb2dd90106aca3f6e07aac2010721263d1573ca0067a52284861",
    "dh-mapping.toml": "7479f11ec214537c8e1835408bbd9db18aa01761c177b28cd9dd4505db74c787"
  },
  "installed_to": "C:\\Users\\nash\\.claude\\skills\\relay-light",
  "installed_at": "2026-09-16T00:30:23.506212+00:00"
}

// C:\Users\nash\.codex\skills\relay-light\manifest.json — files 五项与上表逐字相同
{
  "source_head": "72c6c4d7aed299fd59ad49db1a3335b403147797",
  "source_dirty": false,
  "installed_to": "C:\\Users\\nash\\.codex\\skills\\relay-light",
  "installed_at": "2026-09-16T00:30:23.896572+00:00"
}
```

**三条口径说明（防误读）**

1. **与 RLT_12 `E-001`（A32 基线）的关系**：RLT_12 的 A32 取证是 `51d8062` 时点的历史事实，其所属真计划 `rlt12-win-01` 已于 2026-09-15 17:12 全阶段闭合（账本 `seq=71` `stage_close … 计划 rlt12-win-01 全部阶段闭合`）。本次重同步发生在计划闭合之后，不触碰也不改写那条已取证的基线；RLT_12 `findings.md` F-004 所禁的是**实跑期间**中途重同步，本次不在其射程内。
2. **不预支 RLT_22 的那次同步**：本卡施工会改 `skill/**`（`SKILL.md` 的 W/C/X 模板、两份 adapter、`dh-mapping.toml` 说明文字），改完后的两侧重同步**须另取用户当次明确授权**；`brief.md`「补充边界」与 `task_plan.md` 3.8 的闸门不因本次执行而解除。
3. **RLT_21 那一行未回写**：`docs/modules/relay-light/workspace/RLT_21/**` 不在本卡 `dh:allowed-paths:v1`，故不在本分支勾销 RLT_21 `review.md`「未做且需用户明确授权」里的重同步行；该行的正式勾销留给 RLT_21 收口闸处理，凭据即本条 E-001。

## 信号

<每个角色完成本节点后在本节末追加独占一行；写完即停，不等 `node_closed`，不自行启动下一角色或阶段。>

```text
DONE task=RLT_22 role=<builder|exec|audit|decide|review> batch=<W|1|2|3|R> status=<W_READY|PASS|FAIL|READY_FOR_REVIEW|CONSTRUCTION_DONE|BLOCKED|APPROVE|APPROVE_WITH_NITS|REQUEST_CHANGES> evidence=<逗号分隔> next=orchestrator
```

DONE task=RLT_22 role=builder batch=W status=W_READY evidence=D-001 next=orchestrator
DONE task=RLT_22 role=exec batch=1 status=PASS evidence=E-002,E-003,E-004,E-005,check.B1.md next=orchestrator
DONE task=RLT_22 role=exec batch=2 status=PASS evidence=E-006,E-007,E-008,E-009,check.B2.md next=orchestrator
DONE task=RLT_22 role=exec batch=3 status=PASS evidence=E-010,E-011,E-012,E-013,E-014,check.B3.md next=orchestrator
DONE task=RLT_22 role=exec batch=3 status=CONSTRUCTION_DONE evidence=check.B1.md,check.B2.md,check.B3.md,E-015,E-016 next=orchestrator
