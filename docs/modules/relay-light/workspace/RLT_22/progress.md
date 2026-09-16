<!-- dh:v1 · progress.md — 施工日志 + 证据账本。🟢 边做边记；跑偏记这里，不回写 task_plan / DevPlan / design。 -->
# progress — RLT_22 复核触发改非终态「待复核」信号与节点内返工生命周期

> 本文件在 D 开工时只登记开工事实（D-001），**不预填任何运行记录**。所有 E-ID 由实际跑过命令的施工方/复核方追加。

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-15 | 编排派出的 workspace builder | D-001 建工作区七件套（见下「D-001 开工事实登记」）；未改任何程序、未跑任何验收命令、未做 git 写操作 | 本目录七个文件 | 编排核七件套 → 派 B1 施工 worker |
| 2026-09-16 | 编排 `orchestrator#1`（Claude Code 主控会话） | 取得用户当次明确授权后执行 skill 两侧重同步 `python tools/relay-light/install_skill.py --all`（源 = 主检出 master `72c6c4d`，工作区干净）：exit 0，源与 `.claude` / `.codex` 两副本五文件 sha256 三处一致，两份 manifest 已记。该动作闭合的是 **RLT_21 `review.md`「未做且需用户明确授权」中的「两侧用户级 skill 重同步」**一项；本卡尚未开工、未改任何程序 | E-001 | 编排核七件套 → 派 B1 施工 worker |
| 2026-09-16 | 编排 `orchestrator#1`（Claude Code 主控会话） | 按宪章#7 把 `wt/RLT_22` rebase 到 master `72c6c4d`（`git rebase --autostash master`，4 笔重放无冲突；本卡工作区内容与 rebase 前逐字节一致，`git diff e14bcd3 HEAD -- .../RLT_22` 为空），并以 `--force-with-lease` 覆盖远端（本条提交随该次推送上行）。**D-001「基线」一栏仍记 `544ccdb` 不改**——那是 D-start 当时的事实，不随 rebase 改写；施工 worker 进场无需再 rebase，但仍按铁律自查 | `git merge-base HEAD master` = `72c6c4d` | 编排核七件套 → 派 B1 施工 worker |
| 2026-09-16 | 施工 `exec#1`（devin swe-2-max，rlt22-exec） | **B1 施工（A150 四态扩集 + A145 送审信号写入合同 + A144 fail-closed 占位）**：进场 `git rebase --autostash master` 无冲突、分支 `wt/RLT_22`。TDD 先 RED（6 例失败，全部 `HC-RL-A35 invalid trigger on:review_ready:`——lint 未扩集时 fixture 连加载都过不了，正是 task_plan 的因果链）后 GREEN。改动：`lint_plan` trigger 校验由单前缀 `on:done:` 改为 `{on:done:, on:review_ready:}` 双前缀共享 A35/A71；`_require_trigger` 在 `on:done:` 分支前新增 `on:review_ready:` 分流，一律退 2 报 A144（B1 占位，B2 以完整四项前置替换）；新增 `REVIEW_ROLES={plan-reviewer,checker,reviewer}` 与 `_validate_ready_signal`（原始 note 计数 `ready_for_review=` 恰一、目标须本节点判定角色、写入者不得是判定角色），挂进 `_validate_event_semantics` 的 AGENT_EVENTS 一线。`_note_tokens`、迁移表、`Status`/`status_document`、A49/A60/A70 均零改动 | E-002~E-006 | 编排派 fresh 小审只看本批 diff → check.B1.md |
| 2026-09-16 | 施工 `exec#1`（devin swe-2-max，rlt22-exec） | **B1 小审整改（check.B1.md P1-1：`test_a145_helper_scan_sees_decider_only` 假绿——`checkpoint` 不在 `DECISION_EVENTS`，端到端正例从未触达 `_decision_helper`/`_validate_decision_helper`）**：保留端到端 `run_add` 正例，同用例追加解析层断言（`_decision_helper(mixed)` 与 `_validate_decision_helper(mixed)` 均返回 `decider#1`；仅含 `ready_for_review=`/`reviewed=`/`ready_seq=` 的 note 返回 `None` / 报 A69）。先变异 RED（临时把三个新 token 混入两处 helper 扫描前缀，用例立即 ERROR：`got ['ready_for_review=plan-reviewer', 'decider=decider#1']`）再复原 GREEN——`relay_log.py` 净零改动 | E-007；E-003~E-005 整改后复跑 | 编排派 fresh 小审复裁 P1-1 |

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
| E-002 | 机器证（B1 TDD · RED） | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayPlanLintTests.test_trigger_values_and_same_node_done_references_are_checked test_relay_log.RelayPlanLintTests.test_a150_lint_mapping_table_binds_review_ready_rows test_relay_log.RelayPlanLintTests.test_runtime_trigger_and_dependency_gates test_relay_log.RelayReviewReadySignalTests -v`（2026-09-16，实现前） | fail（exit 1；7 例中 5 FAIL + 1 ERROR，全部为 `HC-RL-A35 line …: invalid trigger on:review_ready:…`——lint 未扩集时带新 trigger 的 fixture 计划连 `add` 的 `_runtime_plan` 加载都过不了（exit 3），正是 task_plan「为什么不按两批切」的因果链实证；`test_a150_lint_mapping_table_binds_review_ready_rows` 因 design/01 §3.5 已含两行而即绿——结构钉住既有合同，非本批 RED 对象） | 钉住 B1 期望行为的有效 RED：A150 四态合法值被 lint 误拒、A145 写入合同与 A144 占位均未实现 |
| E-003 | 机器证（B1 TDD · GREEN） | 同 E-002 命令（实现后；P1-1 整改后 2026-09-16 复跑） | pass（exit 0；7 例全 OK，整改后复跑仍 7 例全 OK、计数不变） | A150：四态正例过 lint、`on:review_ready:nobody`/`on:review-ready:`/空前缀报 A35、跨节点与 R 形态报 A71、§3.5 映射表两行绑定结构断言成立；A145：合法信号被接受、双 token/`ghost`/非判定角色目标/判定角色自写各退 2 报 A145、3 条连续信号（> `rework_max_rounds=2`）均被接受且 attempt 恒 1；A69 隔离（P1-1 整改后）：`decider=` 并存端到端正例 + 解析层断言——`_decision_helper(mixed)` 与 `_validate_decision_helper(mixed)` 均返回 `decider#1`，仅含 `ready_for_review=`/`reviewed=`/`ready_seq=` 的 note 返回 `None`/报 A69（非空转由 E-007 变异 RED 证明）；A144：`on:review_ready:` launch 在有无信号下均退 2 报 A144、stderr 不含 A70、被拒 launch 不落账（账本逐字节不变） |
| E-004 | 机器证（B1 全量回归） | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log -v` | pass（exit 0；186 例全 OK，无既有用例转红；P1-1 整改后复跑仍 186 例全 OK，300.589s） | 全量回归绿——`on:done:` 语义（A70）、状态机迁移表（A60）、attempt/重拉闸（A49/A58/A107）、status schema（A62）等既有合同均未削弱；`test_agent_launch_requires_node_start_and_terminal_agents_are_sealed` 原样保持绿 |
| E-005 | 机器证（B1 全量 runner） | `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`（cwd=仓根） | pass（exit 0；`RELAY ALL PASS (SKIPPED: 1)`；relay-light 段 186+7 例全 OK；P1-1 整改后复跑仍 `RELAY ALL PASS (SKIPPED: 1)`） | 仓级全量测试套件绿；`PYTHONDONTWRITEBYTECODE=1` 使 runner 不产生 `__pycache__` |
| E-006 | 机器证（B1 允许路径核对） | `git diff --check`；`git diff --name-only master...HEAD`；`git status --porcelain`；`git diff --name-only`；`git diff --cached --name-only` | pass（`diff --check` 无输出；master 差集仅含进场前已提交的本卡工作区文件；working tree 仅 `tools/relay-light/relay_log.py` 与 `tools/relay-light/test_relay_log.py` 两个 M；index 空；无本卡新增 untracked/`__pycache__`） | 四集合全部落在允许路径闭集内，无越界改动、无凭据、无 `__pycache__` 混入 |
| E-007 | 机器证（B1 整改 · 变异 RED） | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayReviewReadySignalTests.test_a145_helper_scan_sees_decider_only -v`（2026-09-16，在 `_decision_helper` 与 `_validate_decision_helper` 的扫描前缀临时混入 `ready_for_review=`/`reviewed=`/`ready_seq=` 的变异状态下运行，跑后即复原） | fail→pass（变异下 exit 1：`_validate_decision_helper` 对 `ready_for_review=plan-reviewer decider=decider#1` 报 `HC-RL-A69 ... got ['ready_for_review=plan-reviewer', 'decider=decider#1']`，`assertEqual("decider#1", …)` 失败；复原后同命令 exit 0 单例 OK） | 证明 P1-1 新增的解析层断言非空转——helper 扫描集若真含新 token，断言确实转红；变异已完全复原（`git diff tools/relay-light/relay_log.py` 为空） |

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
DONE task=RLT_22 role=audit batch=W status=FAIL evidence=review.plan.md next=orchestrator
DONE task=RLT_22 role=builder batch=W status=W_READY evidence=task_plan.md,d1e8630 next=orchestrator
DONE task=RLT_22 role=audit batch=W status=FAIL evidence=review.plan.md next=orchestrator
DONE task=RLT_22 role=builder batch=W status=W_READY evidence=task_plan.md,7b317b6 next=orchestrator
DONE task=RLT_22 role=audit batch=W status=PASS evidence=review.plan.md next=orchestrator
DONE task=RLT_22 role=exec batch=1 status=READY_FOR_REVIEW evidence=E-002,E-003,E-004,E-005,E-006,7d677bd next=orchestrator
DONE task=RLT_22 role=audit batch=1 status=FAIL evidence=check.B1.md next=orchestrator
DONE task=RLT_22 role=exec batch=1 status=READY_FOR_REVIEW evidence=E-003,E-004,E-005,E-007,e26ba55 next=orchestrator
DONE task=RLT_22 role=audit batch=1 status=PASS evidence=check.B1.md next=orchestrator
