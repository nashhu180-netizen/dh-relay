# runtime 永久保留：交叉审核记录

> 状态：A-full 事件 `DHR-A-21` 的讨论与审核账。候选为 `design/drafts/DHR-A-21-runtime永久保留-候选.md`；用户已明文确认整版正式晋级，本事件不授权开发、新根启用或推送。

## 1. 需求理解对齐

- 用户追问 runtime 为什么需要删除、是否可以不删除，以及实际空间风险。
- 主会话说明：必须区分 Agent/Pair/终端的资源释放与 runtime 历史文件删除；前者影响并发容量，后者只影响磁盘。
- 当前仓只读统计：`.dh-runtime/relay/`、`.dh-relay/`、`dh_relay/runtime/` 均未创建，当前占用为 0；新设计尚无真实每 Run 样本。
- 用户最终决定：“暂时按照不删除的来吧。就当是永久保存好了。”
- 主会话理解：当前版本将 runtime 冻结为无到期日、无生命周期自动删除；未来改变必须重新修改正式设计。该决定不取消 terminal Run 的撤权、终端关闭和容量释放。

<a id="review-a21"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-21 artifact=design/10-薄RelayPlan与显式节点边界-产品设计调整.md kind=review -->
## 2. fresh-context 审核

审核实例：既有 fresh-context reviewer `b19_fast_review`，未参与 A-20 候选起草；只读检查候选、当前正式 design/10、acceptance mapping 与 DHR_30 边界。

结论：`changes-requested`，无 Blocker，2 High、2 Medium。

1. High：A22→A30 的正式矩阵、反例与决策记录落点需闭合；现有 legacy mapping 不含 A22/A30，不得伪造 mapping 变更。
2. High：H10 若新造 history Read Model 会扩大 DHR_30；应明确复用既有 Read Model/CLI，或延期。
3. Medium：旧文档的 `cleanup_failed/cleanup-pending` 同时指终端释放与文件删除，必须改成只描述 Agent/Pair/终端释放的明确状态。
4. Medium：runtime 缺失/半写不能只写“报告事实”；须沿稳定只读错误面 fail-closed，且不能误判为 active/可恢复。

审核同时确认：候选已覆盖成功/失败/取消、旧身份拒绝、缺盘/半写、安全脱敏反例；“永久”是本机留存而非 Git/跨机器备份。旧根是否同样不删须在人话层说明。

## 3. 主会话裁决与调整

四项全部采纳并修订候选：

- A22 在正式矩阵退役，A30 成为新 canonical；不改不存在该条目的 legacy mapping。
- 经只读核查，DHR_30 现有合同已冻结 `listRuns/inspectRun`、`RunSummary/RunDetail` 和 CLI `list/status/inspect`；H10 只复用这些入口，不新增 API/字段，不扩大 DHR_30。
- 资源释放状态统一拟命名为 `pair_release_pending` / `pair_release_failed`；runtime 永久留存不产生这两种状态，也不占 Agent 容量。
- 缺失/半写沿 DHR_30 既有只读错误/reason surface fail-closed，并排除 active/可恢复；不另造状态集。
- legacy `.dh-relay/`、`.dh-runtime/relay/` 继续只读发现、不原地改名或删除；永久不删不限于新根。

上述调整没有新增用户业务选择；需定向复审确认四项闭合。

### 定向复审

同一独立 reviewer 仅复核上一轮四项及 legacy 边界，结论：`approved`。

- A22→A30 与 mapping：closed；正式矩阵使用新 ID，legacy mapping 无对应条目、不改。
- H10 与 DHR_30：closed；只复用现有 Read Model/CLI，不增 API/字段。
- Pair 释放与容量：closed；`pair_release_pending/failed` 只描述真实终端资源，永久目录不占容量。
- missing/corrupt：closed；沿用既有错误面、排除 active/可恢复，不造第二套状态。
- legacy 永久不删：closed；旧根只读发现、不改名、迁移或删除，新根仍受 Resolver 启用闸约束。

未发现新增 Blocker/High/Medium。候选可进入整版讲解与用户确认；正式输入仍未修改。

<a id="understanding-a21"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-21 artifact=design/10-薄RelayPlan与显式节点边界-产品设计调整.md kind=understanding -->
## 4. 整版讲解、理解问题与确认

- 理解问题：一次任务已经结束、Agent 也全部关闭，但 runtime 目录还在；再次执行 `continue` 时，是否应拒绝并提示“这是历史记录”？
- 用户回答：“是的。”据此确认：保留目录不等于 Run 仍活跃或可继续，终态身份保持撤销，容量已经释放。
- 用户随后追问 runtime 目录对应接力计划还是某个运行记录。主会话解释并在候选补明一对多关系：`plans/<plan_id>` 是可重复使用的路线；`runtime/<run_id>` 是一次执行现场，内部冻结当次 Resolved Plan/generation 快照；同一 Plan 可产生多个互不改写的 Run 目录。
- 用户继续追问 Plan 与 runtime 如何关联，并在主会话提出硬合同“Run 根保存 `plan_id + task_id`、每个 generation 保存 `resolved_plan_digest`”后明确回答“可以”。候选据此新增 `HC-3AT-A31`：关联权威在 Run Store；Plan 不反写 `run_id`；Ticket 以 `run_id + generation + digest` 绑定精确快照；缺字段或错绑定 fail-closed。该新增合同不扩大当前 DHR_30 卡，交由后续承重 Plan/Resolver 与 Workflow/Actor 接线卡实现。
- A31 定向复审结论：`changes-requested`，0 Blocker、0 High、1 Medium。Plan 不反写 `run_id`、Ticket 快照关联与 DHR_30 边界均 closed；唯一缺口是未规定同 Run 新 generation 能否改变根部 `plan_id/task_id`，且缺对应反例。
- 主会话采纳并收紧：Run 根 `plan_id + task_id` 不可变；同 Run 新 generation 只能调整同一计划/任务的已授权内容，改变任一身份必须创建新 Run；`run_id + generation + digest` 只负责快照关联，不替代完整 Ticket 身份链。新增目标身份变化反例后进入极窄复审。
- 极窄复审结论：`approved`。同 Run 身份不可变、A31 反例、Ticket 三元组边界与 DHR_30 边界全部 closed，未发现新 Blocker/High/Medium。
- 整版正式确认：用户在主会话询问“是否按 A-20 候选整版更新正式设计，并继续后续 B-adjust”后明文回答“嗯，继续”。因仓内 `DHR-A-20` 已被 A-19 的决策记录事件占用，本事件按唯一编号规则顺延为 `DHR-A-21`；候选内容、审核与确认范围不变。该确认授权正式设计原子晋级并继续 B-adjust 草案，不授权开发、新根启用或推送。
- 正式稿重放后的只读窄复核结论：`approved`，Blocker/High/Medium 均为 0。永久保留、运行资源释放、Plan→Run→generation 关联、A22→A30、A31/H10、DHR_30 不扩边界及事件/锚点/索引均与候选一致，未发现冲突或遗漏。

<a id="review-a22"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-22 artifact=design/records/04-runtime永久保留与Plan-Run关联-决策记录.md kind=review -->
## 5. 决策记录闭合

`records/04` 只反向索引 A-21 已确认的永久保留、运行资源释放与 Plan→Run→generation 关联，不新增目标、范围、验收或任务拆分。其正式输入、审核记录和授权边界均指向本事件，结论为可作为 `DHR-A-22` 的 A-prime 留痕。

<a id="understanding-a22"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-22 artifact=design/records/04-runtime永久保留与Plan-Run关联-决策记录.md kind=understanding -->

用户对 A-21 整版正式晋级的“嗯，继续”覆盖候选明确列出的必要决策记录；该记录只保存为何采用此合同及正式事实指针，不产生 B-adjust 之外的新授权。
