<!-- dh:v1 -->
# RLT-A-07 交叉审核记录 — RLT_09 oracle 澄清

- 日期：2026-09-13
- 任务 / Issue：RLT_09 / GitHub #18
- 性质：用户授权的最小 A-adjust；不是 D-start、施工验收、verify、push、PR、合并或发布授权
- 权威产物：`design/01-RelayLight-产品设计与验收.md`
- 输入：`workspace/RLT_09/review.plan.md` P1-01/P1-03、`workspace/RLT_09/findings.md` F-001、`workspace/RLT_09/decision.1.md`

<a id="review-rlt-a07"></a>
## Review RLT-A-07

### 冲突来源与审核结论

| 来源 | 冲突 | 原审核结论 | 本次闭合 |
|---|---|---|---|
| `review.plan.md` P1-01 / `findings.md` F-001 | A122 一面限定 planner-amend 只改 relay_plan、DevPlan、改前 cards 已登记卡 task_plan 三类路径，一面又要求禁区失败时回写输入方案文件；全仓实际 diff 因此出现第四类路径 | W plan-review FAIL；B4 不可施工 | 用户选 decision.1 ①B：保留三类闭集，计划目标与输入方案文件均零变化；失败原因改记 planner-amend 普通 `done.note`，monitor 记 blocked `stage_result` |
| `review.plan.md` P1-03 | A121 字面只许追加新阶段节点行，但 status 先跑 lint，A75 拒绝没有 active agent 的新节点 | W plan-review FAIL；B3 的“节点 + agent”fixture 不能冒充原文 | 用户选 decision.1 ②A：澄清为只修改同一计划文件，追加新阶段节点行及保持计划合法所必需的对应 agent 行；两次 status 间不改代码、不改账本 |

本记录沿用 `rlt09-audit` 已完成的独立 plan-review 事实，不冒充新增 fresh review。P1-02 的 before/after 快照问题由 builder W2 独立修订，RLT-A-07 不改变其技术裁决。

### decision.1 三组选项

| 决策题 | A | B | C | 用户选择 |
|---|---|---|---|---|
| ① F-001 / P1-01 | 受限增加失败方案文件例外 | 保留三类闭集，失败原因走完成记录 | 单次豁免或继续 BLOCKED | **B** |
| ② P1-03 / A121 | 澄清为节点行 + 合法所需 agent 行 | 改运行时容忍无 agent 节点 | 单次豁免或继续找 fixture | **A** |
| ③ 是否执行正式同步 | 最小 A-adjust | 单次豁免 | 暂停 | **A：最小 A-adjust** |

用户于 2026-09-13 在 RLT_09 编排会话明确点选 **B / A**，并授权在 `wt/RLT_09` 分支执行最小 A-adjust。该授权只覆盖本记录、design/01 指定句和 DevPlan §RLT_09 的机械同步；验收 ID 不新增、不删除、不改号。

### 修改前后原文对照

| 位置 | 修改前 | 修改后 |
|---|---|---|
| §4.5.2 不进 blocked 链 | 做不到时“在方案文件里写清原因、收工，stage_result 记 blocked” | 计划目标与输入方案文件均不改；planner-amend 不写 blocked/escalate/plan_amend，只以普通 `done.note` 写 `outcome=out-of-scope proposal=... reason=...`，monitor 再写 blocked `stage_result` |
| §4.5.2 碰禁区 | “在方案文件里写『超出范围』并说明要改什么” | proposed 预检命中禁区即整份拒绝，全部计划目标与输入方案文件零变化；失败原因由 done.note 关联原方案 |
| §4.5.3 设计/验收分支 | “不改；在方案文件写『超出范围』后收工” | 目标与方案文件均不改；planner-amend done.note 记录原因，monitor 写 blocked stage_result |
| §9.4 超出范围分支 | “不改任何文件，在方案文件里写『超出范围』后收工” | 明确计划目标与输入方案文件零变化；账本只出现 planner-amend done 与 monitor blocked stage_result，不出现 planner-amend blocked/escalate/plan_amend |
| §11 HC-RL-A121 | “不修改 relay_log.py，仅向计划文件追加新阶段节点行” | 两次 status 之间不改代码、不改账本，只修改同一计划文件，追加节点行及通过 A75 所必需的对应 agent 行 |
| §11 HC-RL-A122 | 三类白名单 + design 禁区 + 整份不落笔，反例只证白名单文件不变 | 保留三类闭集；混合反例证所有计划目标和输入方案文件零变化；失败用 planner-amend done.note，monitor 写 blocked stage_result |
| §14 第 6 项 | 模板要求“碰禁区写『超出范围』”，白名单实现形式待开发方案定 | 模板要求目标与方案零变化、done.note 结构化原因、monitor blocked；精确变更集取自紧邻动作的 before/after 快照 |
| DevPlan §RLT_09 | A121 简写“仅追加计划”；A122 简写“三类白名单、design 禁区与全有全无”；长期 tree-ish diff 未消除既有 dirty 归因 | 同步 A121 合法追加、A122 选择 B 与 W2 before/after tree 算法；增加 RLT-A-07 两文件的单次 allowed-paths 括注 |

### 闭集与 ID 声明

- 本次只调整 HC-RL-A121、HC-RL-A122 的描述与证明方式，ID 本身保留。
- 修改前后 §11 的唯一 AI 验收 ID 集合不增、不减、不重编号；人验 ID 不变。
- 其它 HC-RL-A/H 条目、任务状态、依赖、档位、task_type 均不因本次 A-adjust 改变。
- A122 的成功分支仍只有三类计划文件；账本是失败事实证据，不是白名单第四类计划目标。

<a id="understanding-rlt-a07"></a>
## Understanding RLT-A-07

用户选择可复述为两句可执行判据：

1. 禁区混合请求在 planner-amend 动笔前整体拒绝；relay_plan、DevPlan、task_plan 与输入 decision/strategist 方案文件全部保持原 bytes。planner-amend 自己正常 `done`，其 `note` 结构化写超范围原因；它不写 `blocked` / `escalate` / `plan_amend`。monitor 随后写 `stage_result outcome=blocked`，由编排转交用户。
2. A121 要证明的是 status 重新读取同一份合法计划，而不是放宽 A75。第一次 status 后，只向该 `relay_plan.md` 追加新阶段节点行及让这些节点合法所必需的 agent 行；不改 `relay_log.py` 或其它代码，不改账本，再调用第二次 status。

理解校验结论：上述复述与用户 2026-09-13 点选的 **①B / ②A / ③最小 A-adjust** 一致；没有把 A-adjust 扩张成 D-start、程序施工、验收或远端动作授权。
