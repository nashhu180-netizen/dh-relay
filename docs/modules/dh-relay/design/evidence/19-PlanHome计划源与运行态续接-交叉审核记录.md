# PlanHome 计划源与运行态续接：交叉审核记录

> 事件：`DHR-A-24`（正式设计）与 `DHR-B-22-P7`（P7/DHR_53 承接）。
> 正式输入：[design/10](../10-薄RelayPlan与显式节点边界-产品设计调整.md)。本记录只保存审核、裁决、理解问答与确认；业务任务权威仍在各项目 DevPlan/workspace。

## 1. 用户目标与候选合同

用户要求把接力计划作为可跨项目、跨开发方案的独立 PlanHome 能力，而不是为本次 P5/P6 临时设计目录；允许 YAML 承载计划，并询问是否需要“涉及项目 / 引用开发方案”与 Markdown 状态续接。

候选合同为：

1. tracked `plans/<plan_id>/plan.yaml` 是唯一计划源；TaskRef 包含 `project_ref + devplan_ref + task_id`，项目和开发方案概览由其派生。
2. tracked `registry/projects.yaml` 保存项目身份、业务权威入口、policy 与 Authority 来源指针；它不是开工授权。
3. ignored `runtime/<run_id>/` 是 generation、Receipt、Ticket、Attempt、Result/Handoff 的唯一状态事实。Handoff 可为带身份链的 Markdown，但不是可手填的 `status.md`。
4. 主控真正拉终端前，依次核验 TaskRef、节点前置、local binding、项目 policy 与当次 Authority；计划只排顺序。

<a id="review-a24"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-24 artifact=design/10-薄RelayPlan与显式节点边界-产品设计调整.md kind=review -->
## 2. fresh review 与裁决

- reviewer：fresh-context 只读 Agent `/root/planhome_review`。
- 结论：`changes-requested`，P0 = 0；若把 tracked registry 本身实现成可自动授予 Authority，则升级为 P0。
- 主要 P1：registry 必须有版本/digest 与写入规则；generation 必须冻结完整 TaskRef set、registry/binding/Resolved Plan digest；控制节点的 subject TaskRef、instruction_ref 与 archive/runtime 均需 fail-closed 规则；项目/开发方案概览不得成为第二份手填真相。

主会话裁决：

| finding | 裁决 |
|---|---|
| registry 可能越权 | 接受。明确它仅是地址簿/policy/Authority 来源指针；Ticket 能力仍取节点请求、policy 与当次 Authority 的交集。 |
| projects/source-plans 重复计划源 | 接受。只从 TaskRef 派生展示；不新增手写 Markdown 清单。 |
| 需要状态 Markdown | 部分接受。允许 runtime 内的身份绑定 Handoff Markdown 供人读；拒绝额外 `status.md`，runtime 原子事实不被覆盖。 |
| 目录和源文件尚不够具体 | 接受。冻结 `plans/<plan_id>/plan.yaml` 与 `registry/projects.yaml`，同时保留 `archive/`、`runtime/`、`local/` 的既有边界。 |

<a id="understanding-a24"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-24 artifact=design/10-薄RelayPlan与显式节点边界-产品设计调整.md kind=understanding -->
## 3. 理解问答与整版确认

- **理解问题**：接力计划如何决定某个任务能否真的拉起施工终端？
- **主会话解释**：计划先定位 DHR_30；主控再检查任务仍待施工、前置完成、worktree/binding 匹配，以及本轮施工授权。计划决定“轮到谁”，任务自身状态与 Authority 决定“能不能开”。
- **用户回答**：`可以`。随后对“主控启动前仍按任务 DevPlan/workspace 授权判断”确认“对的”。
- **整版确认**：用户先明文“更新把”，后确认“嗯，好的”；授权把该合同写入正式 design/10，并将 P7/DHR_53 验收回链到它。

<a id="review-b22-p7"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-22-P7 artifact=dev_plan/P7-DevHarness单卡完整流水-开发方案.md kind=review -->
## 4. B-adjust 审核与裁决

- 复核范围：DHR_53 是否完整承接 A24，且是否误改 P5/P6、DHR_30~35 或提前初始化 PlanHome。
- 结论：`approved`。DHR_53 承担 YAML source、registry 指针、TaskRef 派生、开工核验和 runtime Handoff 边界；DHR_54~60 的既有职责不重排。
- 反例：缺 Authority 的 Ready Node 不得签发 Ticket；同一 TaskRef 衍生概览不一致、registry 越权、手填 Handoff 试图推进节点均拒绝。

<a id="understanding-b22-p7"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-22-P7 artifact=dev_plan/P7-DevHarness单卡完整流水-开发方案.md kind=understanding -->
## 5. B-adjust 确认与边界

用户确认“接力计划负责排队；主控负责开工判断”。因此 DHR_53 增加 `HC-3AT-A39/H13` 的验收回链和 P7-M10 覆盖；不新增任务、不改变 DHR_53 之后的依赖、也不改 P5/P6 或 DHR_30~35。

本次仅更新设计、开发方案与仓内入口口径。不创建 `D:/MyFiles/ai-workflow/02-agent-workspace/dh-relay-workspace` 下的目录，不启动 Run/终端，不创建 DHR_53 新 worktree，不提交或推送。
