<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_21 Linux 预演回流

## Context Packet ★前置

> 你是 RLT_21 construction worker，只执行派单点名的一个 Batch。进入 `/home/nash/work/dh-relay/.dh-worktrees/RLT_21` 后先 `git rebase --autostash master`，读 `AGENTS.md`、`brief.md`、本文件、`progress.md`、`findings.md` 与 dispatch/exec.md。禁止自行续批、复核、改计划、安装 skill、push/PR/merge/verify。

| ID | 来源 | 用途 |
|---|---|---|
| C-001 | DevPlan §RLT_21；design/01 §3.4、§4.2、§5.2.1、§7.3、§11.1 A69/A96/A107/A112/A113/A114/A137～A143、§14.8 | 唯一 oracle |
| C-002 | `workspace/RLT_12/evidence/linux-dry-run/README.md` DR-F-001～006；`git show dryrun/rlt12-linux:.../review.plan.md` | 不重跑的预演事实与 A143 复算 |
| C-003 | `workspace/RLT_07/findings.md` F-002/F-003 | 两条 skip 与 cancelled 缺口来源 |
| C-004 | `relay_log.py` 的 `RelayLimits`/`_parse_mapping`、`_validate_agent_transition`、`_validate_decision_ownership`、`_validate_stage_event`、`_note_tokens`、`derive_status`/`_idle_seconds`/`_unclosable_reasons`、`loss_stop` | 现状改点 |
| C-005 | `test_relay_log.py` 的 `RelayLifecycleTests`、`RelayStatusProjectionTests`、`RelayLimitsTests`、`RelayConfigTests`、`SkillCoreDocTests`、`SkillTemplateTests`、`SkillAdapterTests` | 既有 fixture 与用例风格 |
| C-006 | skill 核心、两份 adapter、`dh-mapping.toml` | 文档/配置落点 |

## 全程允许路径与信号

只允许修改：

- `tools/relay-light/relay_log.py`
- `tools/relay-light/test_relay_log.py`
- `tools/relay-light/skill/**`
- `docs/modules/relay-light/workspace/RLT_21/**`

每批只暂存点名文件，禁止 `git add -A`/`git add .`；删掉 `tools/relay-light/__pycache__/`。每批提交后在 `progress.md` 登记 E-ID，再发：

```text
DONE task=RLT_21 role=exec batch=<1|2|3|4|5> status=<READY_FOR_REVIEW|BLOCKED> evidence=<E-ID,...,commit=SHA> next=orchestrator
```

严格 B1 → audit PASS → B2 → audit PASS → B3 → audit PASS → B4 → audit PASS → B5 → audit PASS。只有 orchestrator 在 B5 小审后另派收束，才发 `CONSTRUCTION_DONE`。

## 共通 RED→GREEN 与批出口

- 先增加目标行为断言并运行得到有效 RED；RED 必须因 oracle 所述行为不满足，未知方法/参数、TypeError、fixture、路径、权限、配置或 sandbox 启动错误无效。
- 最小实现后跑点名 GREEN；不得通过放宽断言、吞错误或伪造账本行转绿。
- 每批都执行：

```bash
python3 -m unittest tools/relay-light/test_relay_log.py
pwsh -NoProfile -File tools/tests/run-relay-tests.ps1
git diff --check
git diff --name-only master...HEAD
git diff --name-only
git diff --cached --name-only
git ls-files --others --exclude-standard
```

四个路径集合逐一反选 allowed-paths；全量若失败，以相同命令在核对过的 master 基线按测试名比较，不用“已有失败”笼统带过。audit 输入固定含本批 diff、测试名清单、有效 RED/GREEN 原始摘要与 exit、两份全量、四集合、findings/裁决（如有）、commit SHA。

## Batch 1 — A137 + A112 收窄

**改动**：`relay_log.py::_validate_stage_event`，必要时增加只读 ref helper；`test_relay_log.py::RelayLifecycleTests`。

1. 新增 `test_a137_stage_result_validates_outcome_and_latest_ref`：同一 stage 未关节点下构造 `blocked ref=coder#1:blocked` 与 `failed ref=coder#1:agent_lost` 正例；三种非法 ref 分别为缺 token、引用不存在、引用事件已被 `resume` 或终态覆盖，均断言 A137。
2. 把既有 `test_stage_result_and_close_preconditions_exit_two` 的 A112 反例冻结为 `outcome=done` 顺序颠倒，不再让 blocked/failed 命中 A112；保留缺 result 与 blocked `stage_close` 分别命中 A112/A118。
3. 实现按 outcome 分支：done/cancelled 才检查所有节点 closed；blocked/failed 用 `_note_tokens` 解析唯一 `ref=` 形态，限定本 stage、实例存在、事件为 blocked/agent_lost 且是该 agent 最新事件。
4. 不改 A105、A118、A123；合法 blocked 后 `stage_close` 仍拒 A118。

**RED 命令**：

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayLifecycleTests.test_a137_stage_result_validates_outcome_and_latest_ref \
  tools.relay-light.test_relay_log.RelayLifecycleTests.test_stage_result_and_close_preconditions_exit_two
```

RED：合法 blocked/failed 尚被 A112 拒或非法 ref 未报 A137。GREEN：正反例与既有 A112/A118 全过。

**audit 特别输入**：outcome×节点关闭×ref 矩阵；三种非法 ref 的 stderr code；A112/A118 未漂移证据。

## Batch 2 — A138 + A139

**改动**：`RelayLimits`/NOT_RUN 与 launch-fix helpers、`_validate_agent_transition`、`loss_stop`/`_unclosable_reasons`、`AgentState` 与 status JSON 序列化；`test_relay_log.py`。本批不改 skill 文档或计划 `launch` lint。

1. 新增 `test_a138_not_run_budget_and_launch_fix_authorization`，用配置的 `attempt_max` 构造连续 NOT_RUN：第 `max+1` 次无授权拒；A137 blocked ref 合法；该 agent 名下 `user_decision launch_fix=bypass_sandbox` 后同 token `#4` 接受，异 token与无 token拒；第一 fix 组满额后第二条授权/第二 token 均拒。
2. 增 `test_a138_not_run_unclosable_reason_reports_count_and_fix_group`：node reasons 明示基线组 NOT_RUN `n/attempt_max` 与当前 fix token 组计数；禁止泄露 note 其他正文。
3. 增 `test_a139_status_exposes_launch_fix_or_null`：`AgentState`/JSON 精确键集合同步增加 `launch_fix`，每个 attempt 从自己的 launch note 投影字符串或 null。
4. 增 `test_a139_launch_fix_does_not_require_plan_amend_or_lint_match`：账本 token 与 plan `launch` 不同仍 add/lint，且没有 `plan_amend`。
5. 止损按 `(node, agent-name, launch_fix-group)` 计算连续 NOT_RUN；只允许一次 fix 组，总启动预算 `≤2*attempt_max`。一般 A113 的 lost/cancelled/failed 前因保持。

**必须停下的合同张力**：现状 `user_decision` 只允许跟在 `decision` 后且 A69 owner 来自 active decision chain；A138 又要求无 blocked 起头、监工代记的 launch-fix 授权。实现前先看 findings F-001 的两案；若 oracle 无法在不破坏 A69/A114 下唯一落地，记录行为 RED 与 `BLOCKED`，不自行选案。

**RED/GREEN 命令**：

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayLifecycleTests.test_a138_not_run_budget_and_launch_fix_authorization \
  tools.relay-light.test_relay_log.RelayStatusProjectionTests.test_a138_not_run_unclosable_reason_reports_count_and_fix_group \
  tools.relay-light.test_relay_log.RelayStatusProjectionTests.test_a139_status_exposes_launch_fix_or_null \
  tools.relay-light.test_relay_log.RelayPlanLintTests.test_a139_launch_fix_does_not_require_plan_amend_or_lint_match
```

RED：第四次无授权仍接受、合法授权链不通、status 缺字段/计数。GREEN：预算矩阵全过且旧 A107/A113 用例不回归。

**audit 特别输入**：逐事件账本序列；两组计数表；status 精确 schema；无 `plan_amend`/lint 不比对证明；A69/A114 张力裁决（如有）。

## Batch 3 — A140 静默超时

**改动**：`RelayLimits`、`_parse_mapping`、`derive_status`/`AgentState`、status JSON；`dh-mapping.toml`；SKILL.md 监工段与两 adapter；测试。

1. `RelayLimits` 增 `silence_timeout_min`，`_parse_mapping` 缺项取默认 30、显式项须为正整数；仓内 mapping 显式写 30。
2. `AgentState` 增 `ledger_silent: bool`；使用已注入 `now` 和该 agent 最新账本事件的 `idle_seconds`，严格超过 `minutes*60` 才 true。它只是字段提示，不写 errors、不改变 closable/loss_stop/attempt。
3. SKILL 与两 adapter 三处加入同一语义原文：`ledger_silent` 后核 Herdr 状态、pane 末行、允许路径产出；三者均无变化才先中断让 wait 返回、记 `agent_lost` note 含 `silent_timeout`、同 pane 重拉 `#n+1` 并提示检查已有产物；任一变化不得中断。
4. 明写 A83 的 20 分钟 wait/tick 是接收者兜底节拍，A140 默认 30 分钟是账本静默提示，两者并存且互不替代。

**用例**：`test_a140_silence_timeout_default_and_load`、`test_a140_ledger_silent_uses_injected_clock`、`test_a140_silence_timeout_protocol_in_three_templates`；同步既有 status 精确键断言。

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayConfigTests.test_a140_silence_timeout_default_and_load \
  tools.relay-light.test_relay_log.RelayStatusProjectionTests.test_a140_ledger_silent_uses_injected_clock \
  tools.relay-light.test_relay_log.SkillAdapterTests.test_a140_silence_timeout_protocol_in_three_templates
```

RED：缺配置/字段/模板句。GREEN：阈值前后与三模板结构全绿，A83 现有等待用例保持。

**audit 特别输入**：默认/显式/非法配置矩阵；打桩时间值；三文件命中位置；`ledger_silent` 不改变状态机证明；20/30 分钟并存说明。

## Batch 4 — A141 + A143 文档批

**改动**：两份 adapter、SKILL.md 的 plan-reviewer 模板、结构测试；不动运行时代码。

1. 两 adapter 加三段并保持语义同构：
   - `agent start` → `wait --until idle` → `prompt` → 读 pane 末行；未提交只 `send-keys Enter` 一次并复核；仍失败走 `agent_lost`，不得连续盲补 Enter。
   - 编排优先监听 `relay_log.jsonl` 文件事件；“监工连续空闲 ≥2 分钟且无新账本行”才告警，告警不是写账或 agent_lost。
   - 环境预检发现沙箱型只读不可用时，使用 bypass 沙箱 + prompt 只读约束，并以已获 A138 用户授权的 `launch_fix=` 记账；不得把替代启动写回 plan `launch`。
2. SKILL plan-reviewer 模板增加 A143：light 下纯措辞/格式/引用陈旧项 P2、不阻断 PASS；仅 allowed-paths、写入者边界、节点/阶段边界、验收命令与完成信号缺失/矛盾为 P1；heavy/normal 维持既有严格度和路径数。
3. 新增 `test_a141_dispatch_wait_event_listener_and_sandbox_preflight` 与 `test_a143_light_plan_review_severity_contract`；检查两 adapter 三段、核心模板两句/四类/档位不变。
4. 只读复算 `git show dryrun/rlt12-linux:docs/modules/relay-light/workspace/DRILL_01/review.plan.md` 及历史首轮版本；把重复的 progress/lesson 写入权问题归并为一个写入者边界 P1，其余四项按新模板为 P2，登记 E-ID，结果必须可复算为 `1 P1 + 4 P2`。

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.SkillAdapterTests.test_a141_dispatch_wait_event_listener_and_sandbox_preflight \
  tools.relay-light.test_relay_log.SkillCoreDocTests.test_a143_light_plan_review_severity_contract
```

RED：当前模板缺三段与分级。GREEN：结构命中、adapter 同构、复算 1+4；不以改预演分支取绿。

**audit 特别输入**：两 adapter 对照片段；Enter 一次上限；事件监听告警条件；sandbox 替代三件；A143 五项复算表与源 commit；heavy/normal 未变。

## Batch 5 — A142 决策模式门与 cancelled 归属

**改动**：`DECISION_EVENTS`、`_validate_decision_ownership`/新的 mode helper、`_validate_event_semantics`；测试。

1. 删除两条 `test_a114_*` 上的 `@unittest.skip`，保持方法名与断言：consult 缺 `user_decision` 写 resume 拒，auto decider 链出现 `user_decision` 拒。
2. mode 判断只作用于 decider 链：根据 active helper 为 `decider#n` 且当前事件位置判定；strategist 链仍在 auto/consult 都必须 user_decision（A114/A97）。
3. 把 `cancelled` 加入 `DECISION_EVENTS`，新增 `test_a142_cancelled_decision_ownership_positive_and_negative`：触发 coder 名下合法；helper 或其他 agent 名下报 A69。同步检查一般非决策取消仍可按 A113 成为重拉前因，不得误伤。
4. 保持 A96 两模式 resume 不新增 launch、A114 strategist 无 blocked 起头、A69 helper token 规则。

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.SkillTemplateTests.test_a114_consult_resume_without_user_decision_rejected \
  tools.relay-light.test_relay_log.SkillTemplateTests.test_a114_auto_mode_rejects_user_decision_on_decider_chain \
  tools.relay-light.test_relay_log.SkillTemplateTests.test_a142_cancelled_decision_ownership_positive_and_negative \
  tools.relay-light.test_relay_log.SkillTemplateTests.test_a96_a114_decider_chain_positive_legs \
  tools.relay-light.test_relay_log.SkillTemplateTests.test_a114_strategist_chain_on_rework_template \
  tools.relay-light.test_relay_log.SkillTemplateTests.test_a114_strategist_chain_cancelled_finale \
  tools.relay-light.test_relay_log.SkillTemplateTests.test_a113_attempt_only_after_lost_or_cancelled
```

RED：两条去 skip 后目标断言失败、错误归属 cancelled 未报 A69。GREEN：点名正反例全过且 decider/strategist/一般 cancelled 三种语境不串线。

**audit 特别输入**：去 skip diff；mode×helper×事件矩阵；cancelled 正反账本；A96/A97/A113/A114 保持证据。

## 整卡收束（B5 audit PASS 后另派）

复跑 brief 七条精确命令、Python 与 PowerShell 全量、`git diff --check`、四集合；确认 B1～B5 小审均 PASS、证据 ID 无悬空、findings 已裁决或明确非阻塞。只发施工完成信号，不进入 normal 三路复核：

```text
DONE task=RLT_21 role=exec batch=5 status=CONSTRUCTION_DONE evidence=<E-ID范围,commits> next=orchestrator
```
