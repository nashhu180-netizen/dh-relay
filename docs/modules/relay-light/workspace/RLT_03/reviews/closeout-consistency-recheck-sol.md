<!-- dh:v1 -->
# RLT_03 · consistency_review 同路径复验

## VERDICT

**CHANGES_REQUESTED**

初审 P1-1 已闭合；初审 P1-2、P2-1 仍原样存在，且修订目标分别是 as-built 与正式 DevPlan，均越出 RLT_03 allowed paths。另行核对的 A5、A128、A129 三条活动合同仍各有正式文本互斥，不能把当前实现全绿等同为这三条可签署。

| 状态 | P1 | P2 |
|---|---:|---:|
| 本次确认已闭合 | 1 | 0 |
| 当前剩余 | 4 | 1 |

## Reviewer / session

| 项 | 实际值 |
|---|---|
| review_path_id | `consistency_review` |
| 角色 | RLT_03 heavy Recipe consistency_review 同路径独立复验 worker；非主控、非施工者 |
| Herdr workspace / tab / pane | `w15` / `w15:t1` / `w15:pE` |
| Herdr session | `kpi-agg` |
| Codex session | `01a08a6f-9bc8-7ae0-910c-72642a9bac90` |
| 实际模型配置 | `codex --model gpt-5.6-sol -c model_reasoning_effort=medium --no-alt-screen` |
| branch / HEAD | `wt/RLT_03` / `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc` |
| 唯一允许并实际写入 | `docs/modules/relay-light/workspace/RLT_03/reviews/closeout-consistency-recheck-sol.md` |

## 复验闭集与逐成员映射

本轮只复验指定问题，不重做初审全量枚举。活动比较面为：`brief.md`、`task_plan.md`、`review.md`、初审报告、正式 design/01、正式 DevPlan、as-built、两条 Python，共 9 个物理成员；`progress.md` / `findings.md` 只用于核对整改与 open 记录，不提升为合同源。

| 维度 | 找到几处 | 逐成员映射 | 裁决 |
|---|---:|---|---|
| 初审 P1-1：`review.md` 旧完成条件 | 当前完成条件 16 行；初审点名的旧子句 4 组 | `review.md:64-79` 已与 `brief.md:23-38` 对齐：#4 改为 parser/lint + 四例外，#6 去掉 status `stages` 顺序，#7 去掉映射 E11-E13，#8 改四必需字段及 parser/default；#12 明示 A5 待裁决。`review.md:85` 也不再声称全部完成 | **已闭合**。这是允许路径 `workspace/RLT_03/**` 内的合法整改 |
| 初审 P1-2：as-built 状态词 | 2 处 | as-built `:17,:42` 仍写五词 `pending/ready/open/closed/superseded`；design `:211-213` 明确节点状态只有前四词，`superseded` 是计划行标记，不是状态值；design A73 `:1130` 同样排除其状态投影 | **仍存在，P1** |
| 初审 P1-2：as-built owner | `RLT_04` 10 处；`RLT_06` 6 处 | `:9` 总括仍把账本/agent 状态机给 RLT_04、角色配置给 RLT_06；`:18,33,41,43-46,48,57` 的 RLT_04 应按当前分卡映射为 RLT_03（保留原并列后继卡）；`:25,28,31,34,35` 的 RLT_06 应映射为 RLT_05。DevPlan `:138-194,196-...` 与 `:498` 已取消 RLT_04/RLT_06 | **仍存在，P1** |
| 初审 P2-1：A59 豁免数量 | 6 个带数量/成员的活动定义 | design §3.5 `:279-280`、design A59 `:1167`、`task_plan.md:49`、生产常量 `relay_log.py:53-55`、测试 `test_relay_log.py:924-936` 均为四个前缀；DevPlan RLT_03 `:176` 单独写“三类豁免”。`brief.md:36` 只写“豁免”，不参与数量冲突 | **仍存在，P2** |

## 已闭合

### C-1 · 初审 P1-1 CLOSED

`review.md` 的 16 条完成条件已同步现行 brief；初审指出的四组 RLT_05/RLT_07 旧语义均已移除。当前 #4/#6/#12 分别保留 A128/A129/A5 的“实现通过、合同待裁决”状态，没有越权代签。该整改闭合的是 **review 工件过期**，不等于 A5/A128/A129 合同冲突也已闭合。

## 剩余 blocker

### R-P1-1（P1）· as-built owner/status 仍过期，且越出本卡 allowed paths

现役 Runner 对照仍有 `superseded` 状态 2 处、RLT_04 owner 10 处、RLT_06 owner 6 处；`git diff --name-only -- <as-built> <DevPlan>` 为空，说明初审后两份目标文件均未整改。DevPlan `:188-191` 冻结的 RLT_03 allowed paths 只有两条 Python 与 `workspace/RLT_03/**`，as-built 不在其中。因此本卡内不得为闭合此项越界修改；需由主控取得相应范围授权或另卡修订后再复验。

### R-P1-2（P1）· A5 活动合同仍互斥

- design §3.1 `:178-182` 与 A80 `:1181`：lint 规则违反应 rc=2 / `lint:`，解析失败才 rc=3。
- design A5 `:1122`、DevPlan `:168`、brief `:34`：坏/缺计划三个子命令均 rc=3；A5 取证还把“节点号重复”列为例子。
- 生产 `_lint_command` / `_runtime_plan`（`relay_log.py:395,408`）及判别测试 `test_relay_log.py:728` 选择前一口径：重复节点 lint=2，add/status=3。

故 A5 的缺文件、缺表头两例一致，但“节点号重复”在 lint 上无法同时满足 A5 与 §3.1/A80。`findings.md` F-016 仍为 open；这是正式 design/DevPlan 的裁决事项，越出本卡 allowed paths。

### R-P1-3（P1）· A128 第四例外跨 owner，仍不能在 RLT_03 逐项签署

design A128 `:1129` 要求逐项覆盖 A46/A72/A75/A120 四个封闭例外；DevPlan owner 表 `:550` 将 A128 给 RLT_03，而 A120 给 RLT_09。当前本卡仅实现并证明前三项，且按 A129 严格拒绝 A120 将来要放宽的表尾场景。`review.md:67` 已正确降为“实现通过；A128 第四例外归属待裁决”，但正式 design/DevPlan 未分域，因此该条仍不可整体签署。

### R-P1-4（P1）· A129 正文与验收表仍相反

design §3.5 `:409`、§4.3 `:496` 及运行中改计划说明 `:584` 均说同 stage 追加行在表尾通过；design A129 `:1132` 却要求被另一 stage 隔断的同 stage 节点拒绝，未给表尾例外。生产 `relay_log.py:324-329` 与测试 `test_relay_log.py:346` 当前按 A129 严格拒绝，A120 `:1141` 又要求 RLT_09 后续放宽。`findings.md` F-003 仍为 open。当前行为选择有记录，但不能替代正式合同一致化。

### R-P2-1（P2）· DevPlan A59 “三类豁免”仍在，且越出本卡 allowed paths

唯一数量异文仍是 DevPlan `:176`；其余五个明确成员面均为 `orchestrator`、`monitor`、`planner-amend`、`strategist` 四项，生产与测试也一致实现四项。故这是文案数量遗漏，不是代码行为缺陷。DevPlan 不在 `:188-191` 的 allowed paths 内，本卡不可越界修正。

## 范围裁决

| 项 | 当前事实 | 本卡可否自行修 |
|---|---|---|
| `review.md` 旧完成条件 | 已同步 | 可以，且已闭合 |
| as-built 状态/owner | 仍旧 | 不可；目标路径越界 |
| DevPlan A59 数量 | 仍旧 | 不可；目标路径越界 |
| A5/A128/A129 正式合同 | 仍互斥 | 不可；至少需改 design/DevPlan 或由有权主控落盘正式裁决 |

## 复验结论

**CHANGES_REQUESTED**。P1-1 的 workspace 整改有效；剩余阻塞均不是要求 RLT_03 继续改 Python，而是需要在本卡 allowed paths 之外修正 as-built / DevPlan / design 的活动合同，再做同路径复验。本报告不代主控验收、verify、合并或扩大路径授权。
