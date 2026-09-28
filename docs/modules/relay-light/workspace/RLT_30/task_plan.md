<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_30

## 1. 要读的上下文 (Context Packet)

- design/01：RLT-A-15 声明、§0.2 术语、角色表、§6.3（`[stage-lead]`/`[watcher]` 与兼容句）、§7.5（九值 phase、§7.5.4 watcher 节拍）、§10.3 样张。
- DevPlan §3.2 `RLT_30` 卡（验收、允许路径、停止边界）。
- 现役面：`tools/relay-light/skill/`（SKILL.md、roles.toml、dh-mapping.toml、references/adapter-*.md）、AGENTS.md「relay-light 编排协议段」及其 `### single-task` 子段、`relay_log.py` 显示层、两份测试、`as-built/single-task-实现快照.md`。

## 2. 施工步骤 (Steps)

| # | 步骤 | 产出 / 判据 |
|---|---|---|
| S1 | RED：改测试断言到新口径——A131 12 角色；§10.3 样张 `当班写入者：stage-lead（DHR_90:C#1）`（`last_writer` 仍断言 `monitor`）；A85 errors 字面；新增 A69/A119/resource_close A85 字面断言；`NINE_PHASE_SET` 含 `watcher`；RELAY_RECEIPT 正则与零写入测试改 watcher；新增「九值集不含 `/ \`monitor\` /`」断言 | 跑测试见 RED，存 `evidence/red.txt` |
| S2 | `relay_log.py` 显示层：新增显示映射，只在 status 文本与报错字面把 `monitor` 显示为 stage-lead；不改 `derive_last_writer`、`WRITER_BY_EVENT`、`CONTROL_AGENT_NAMES`、JSON 键/枚举、事件名 | §4 字面表逐条落地 |
| S3 | skill 五件 + AGENTS 两段 + as-built 现役行改名（§5 清单） | `evidence/grep_check.py` PASS |
| S4 | GREEN：全量 Python 单测 + pwsh 全仓回归 | 存 `evidence/green.txt`、`regression-*.txt` |
| S5 | 有效单测两处变异（§6）施加→断言失败→还原 | 存 `evidence/mutation.txt` |
| S6 | 复核三路（code_review / 需求 / 教训）fresh subagent；整改；review.md 回填；DevPlan 状态回填 | review.md 登记齐 |

## 3. grep 内容锚定白名单（完成条件 5②）

判定：行内去掉 promotion-check 冻结词正则后仍含 `monitor`，且**同时**含下列某条全部锚点子串，才算白名单行；其余残留 = 0。脚本 `evidence/grep_check.py` 以此表为准。

| 编号 | 类别 | 锚点子串（全部须出现） | 预期落点 |
|---|---|---|---|
| W1 | stage-lead 账本标识说明句 | `账本标识` + `monitor#` | AGENTS.md relay-light 段引言句 |
| W2 | 「监督 / 监控 / monitor」别名句 | `监督 / 监控 / monitor` | SKILL.md 模式选择节别名句；§ watcher 节拍节别名句 |
| W3 | `[monitor]` 旧名兼容句 | `` `[monitor]` `` + `兼容` | 两 adapter「角色 → launch」查表句；roles.toml 注释 |
| W4 | AGENTS 更名说明句 | `原名 monitor` + `更名` | AGENTS.md relay-light 段引言句（F-001：删「监工」二字） |

## 4. 报错 / 显示字面表（完成条件 3、4；三条规矩：主语 stage-lead、括号带账本原值、错误码与退出码不变）

显示映射：`_writer_label("monitor") = "stage-lead (by=monitor)"`，其它写者原样；status 文本用 `stage-lead`（样张逐字，括号为 stage_id）。

| 位置 | 错误码 | 旧字面 | 新字面 |
|---|---|---|---|
| `_authorize_agent`（plan_amend） | A119 | `plan_amend must be written by monitor#<n>: {agent}` | `plan_amend must be written by stage-lead (monitor#<n>): {agent}` |
| `_authorize_agent`（控制事件） | A69 | `control event requires orchestrator or monitor: {event}` | `control event requires orchestrator or stage-lead (monitor#<n>): {event}` |
| `validate_resource_close`（add） | A85 | `resource_close object_type=pane must be written by monitor, not orchestrator` | `… must be written by stage-lead (by=monitor), not orchestrator`（双向均经 `_writer_label`） |
| `_validate_writer`（add） | A85 | `{event} must be written by monitor, not orchestrator` | `{event} must be written by stage-lead (by=monitor), not orchestrator`（双向均经 `_writer_label`） |
| lint/status 告警（resource_close 非控制写者） | A69 | `seq N: HC-RL-A69 resource_close requires orchestrator or monitor agent: {agent}` | `seq N: HC-RL-A69 resource_close requires orchestrator or stage-lead (monitor#<n>) agent: {agent}` |
| lint/status 告警（resource_close 写者） | A85 | `… must be written by monitor, not {by}` | 双向经 `_writer_label` |
| lint/status 告警（事件写者） | A85 | `seq 4: HC-RL-A85 node_start must be written by monitor, not orchestrator` | `seq 4: HC-RL-A85 node_start must be written by stage-lead (by=monitor), not orchestrator` |
| status 文本 | — | `当班写入者：monitor（DHR_90:C#1）` | `当班写入者：stage-lead（DHR_90:C#1）` |

不改：含事件名 `monitor_launch` / `monitor_restart` 的报错（A89/A93 顺序类）、`invalid by` 账本解析错误、watch 通知 `{agent}`、`status --json` 的 `last_writer` 值与 `suggested_action` 枚举。

## 5. 文档改名清单

- SKILL.md：别名句 `phase=monitor` → `phase=watcher`（保留 W2 别名）；phase 闭集；RELAY_RECEIPT 分流、execution_strategy、clear、sole writer、只读、节拍节标题与正文、恢复权威行中的 single-task 观察者 → watcher；删「`phase=monitor` 这个词沿用历史合同不改」；冻结事件名（215、220–226 行附近）不动。
- 两 adapter：single-task 节同上；watcher 档位缺省改读 `[watcher]`，缺则依次退 `[stage-lead]`、`[monitor]`（W3）；角色 → launch 查表补 `[stage-lead]` 与旧 `[monitor]` 兼容句（W3）。
- roles.toml：`[monitor]` → `[stage-lead]`（原 model/launch）；新增 `[watcher]` `model = "codex luna medium"`、`launch = "codex -m gpt-5.6-luna -c model_reasoning_effort=medium --dangerously-bypass-approvals-and-sandbox"`；注释说明旧 `[monitor]` 兼容（W3）。
- dh-mapping.toml：两处「监工」→ stage-lead。
- AGENTS.md：仅 relay-light 两段（42、51、52 行）。
- as-built `single-task-实现快照.md`：12–15 行现役合同改 watcher 与新测试名；34–36 历史行只加「当时 phase 名为 monitor，现 watcher」注。

## 6. 有效单测变异点

1. `render_status_text` 显示映射行：把 `stage-lead` 映射退回原值 → `test_status_text_matches_10_3_sample`（§10.3 逐字）与 A43 测试必须断言失败。
2. `_writer_label`：`monitor` 映射退回 `monitor` → A85 字面测试必须断言失败。

## 7. 关键决策

- 错误字面英文句式保持原样，只替换写者名为 `stage-lead (by=monitor)` / `stage-lead (monitor#<n>)`：最小改动、括号内即账本原值（用户三条规矩）。
- `_writer_label` 只供显示；所有比较仍用账本原值。
