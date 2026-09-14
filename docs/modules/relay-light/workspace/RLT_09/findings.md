<!-- dh:v1 -->
# findings — RLT_09

> 只登记施工期发现的合同冲突、范围外事实与建议；worker 不自行改 design/dev_plan 或替 orchestrator/用户裁决。

## 登记项

| ID | 发现 | 影响 | 状态 |
|---|---|---|---|
| F-001 | design §4.5.2 原合同一方面把 planner-amend 可碰文件锁为 relay_plan、DevPlan、已有卡 task_plan 三类，并要求禁区命中时整份改动不落笔；另一方面又要求 planner-amend 在方案文件（`decision.<n>.md` 或 strategist 文件）写「超出范围」。方案文件通常位于 workspace 且不属于三类；HC-RL-A122 又要求 actual diff 是白名单闭集，二者形成 oracle 冲突。 | `decision.1` ①已选择 B，RLT-A-07 已同步 design/DevPlan：保留三类闭集；禁区命中时计划目标与输入方案文件零变化，planner-amend 的普通 `done.note` 承载结构化 out-of-scope 原因，monitor 写 `stage_result outcome=blocked`。B4 不再有该前置 BLOCKED。 | CLOSED — `decision.1` ①B + RLT-A-07 已闭合；发现事实保留作审计链 |

W4 盘点：F-001 已按 `decision.1` ①B + RLT-A-07 闭合。A122 可落在现有 `lint` 的 planner-amend 校验模式，不新增顶层子命令，当前未发现与 A135「命令集保持 add/status/lint 三个」的必然冲突。若施工证明该形态仍无法满足“禁区命中时整份不落笔”，须新增 F-ID 并 BLOCKED，不得自行改成第四个顶层子命令。
