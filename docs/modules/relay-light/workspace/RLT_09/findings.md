<!-- dh:v1 -->
# findings — RLT_09

> 只登记施工期发现的合同冲突、范围外事实与建议；worker 不自行改 design/dev_plan 或替 orchestrator/用户裁决。

## 登记项

| ID | 发现 | 影响 | 状态 |
|---|---|---|---|
| F-001 | design §4.5.2 原合同一方面把 planner-amend 可碰文件锁为 relay_plan、DevPlan、已有卡 task_plan 三类，并要求禁区命中时整份改动不落笔；另一方面又要求 planner-amend 在方案文件（`decision.<n>.md` 或 strategist 文件）写「超出范围」。方案文件通常位于 workspace 且不属于三类；HC-RL-A122 又要求 actual diff 是白名单闭集，二者形成 oracle 冲突。 | `decision.1` ①已选择 B，RLT-A-07 已同步 design/DevPlan：保留三类闭集；禁区命中时计划目标与输入方案文件零变化，planner-amend 的普通 `done.note` 承载结构化 out-of-scope 原因，monitor 写 `stage_result outcome=blocked`。B4 不再有该前置 BLOCKED。 | CLOSED — `decision.1` ①B + RLT-A-07 已闭合；发现事实保留作审计链 |

W4 盘点：F-001 已按 `decision.1` ①B + RLT-A-07 闭合。A122 可落在现有 `lint` 的 planner-amend 校验模式，不新增顶层子命令，当前未发现与 A135「命令集保持 add/status/lint 三个」的必然冲突。若施工证明该形态仍无法满足“禁区命中时整份不落笔”，须新增 F-ID 并 BLOCKED，不得自行改成第四个顶层子命令。

B1 注记（非冲突、不阻塞）：brief 判据「coder 写入 … exit 2 且 A119」按字面落成——非控制名（coder 等）写 `plan_amend` 在 `_authorize_agent` 报 `HC-RL-A119`；`orchestrator#<n>` 写 `plan_amend` 沿用既有 `HC-RL-A85` 写入者层（`test_writer_consistency_exits_two_for_every_frozen_owner` 冻结回归保持）。`plan_amend` 不进 agent 状态机：`_validate_stage_event` 对它照旧早退，A119 只做 note 形状校验（文件名 = 独立非 key token；`nodes=` 非空且逗号项逐项非空），节点号不做计划成员判定——既有 A93 反例 fixture `decision.9.md nodes=C9`（C9 不在计划内）保持 `HC-RL-A93` 语义不变。A123 挂在 `_validate_stage_event` 的 `stage_result` 分支、A112 之后，只查同阶段 `plan_amend` 历史；无 amend 时仅禁 `amend=`，不发明 `nodes=` 禁令。本批无新增冲突项。

B2 注记（非冲突、不阻塞）：A120 放宽按 task_plan「只识别表尾追加到一个既有 stage」落成——`stage_runs` 除末段外必须各自唯一，末段允许重现既有 `stage_id`；superseded 行照旧先滤除。两处既有 fixture 收窄：`test_stage_must_be_known_and_grouped_contiguously` 的 `C1→R1→C2` 尾追加例与 `test_structural_lint_precedes_the_recipe_check` 的同款 fixture 在放宽后不再触发 A129，按 dev_plan「仅变更其实际负责的规则断言」分别收窄为断言 A89（`C2.depends_on=R1` 回边 / 结构性规则仍先于 A116）。非表尾隔断（`C1→R1→C2→F1`）保持 A129 断言不变。本批无新增冲突项。
