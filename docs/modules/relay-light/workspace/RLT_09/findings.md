<!-- dh:v1 -->
# findings — RLT_09

> 只登记施工期发现的合同冲突、范围外事实与建议；worker 不自行改 design/dev_plan 或替 orchestrator/用户裁决。

## 登记项

| ID | 发现 | 影响 | 状态 |
|---|---|---|---|
| F-001 | design §4.5.2 一方面把 planner-amend 可碰文件锁为 relay_plan、DevPlan、已有卡 task_plan 三类，并要求禁区命中时整份改动不落笔；另一方面又要求 planner-amend 在方案文件（`decision.<n>.md` 或 strategist 文件）写「超出范围」。方案文件通常位于 workspace 且不属于三类；HC-RL-A122 又要求用全仓 `git diff --name-only` 证明变更集合是白名单子集。 | B4 若照前句执行会少写规定的失败记录，照后句执行则 actual diff 出现第四类路径，无法同时满足现有逐字合同。两案均需用户/design 裁决：A 将“当前方案文件只追加超范围结果”纳入白名单；B 保持三类闭集并改为终端结构化输出，由 monitor 只写 stage_result blocked。builder 不选边。 | B4 动代码前 BLOCKED；待 decider/orchestrator 取得权威裁决 |

W 盘点：除 F-001 外，A122 可落在现有 `lint` 的 planner-amend 校验模式，不新增顶层子命令，当前未发现与 A135「命令集保持 add/status/lint 三个」的必然冲突。若施工证明该形态仍无法满足“禁区命中时整份不落笔”，须新增 F-ID 并 BLOCKED，不得自行改成第四个顶层子命令。
