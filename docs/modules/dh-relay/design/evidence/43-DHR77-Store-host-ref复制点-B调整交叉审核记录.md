<!-- dh:v1 -->
# DHR-B-44 · DHR_77 Store `host_ref` 复制点 B-adjust 交叉审核记录

> 状态：fresh 审核、主控裁决、用户理解回答与最终确认均已完成，`DHR-B-44` 已正式生效。本文只记录审核过程，不属于 resolver `designInputs[]`。本轮只扩 DHR_77 的一个生产路径并续做既有 construction Node；不授权复核、verify、合并、DHR_35、推送或部署。

<a id="review-b44"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-44 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=review -->
## 1. fresh-context 独立审核

- 原始需求：首轮 construction 因 `relay-core/store/store.mjs` 不在冻结 allowed paths 而 durable blocked；用户确认“回到最小 B-adjust，只把 `relay-core/store/store.mjs` 的事件字段复制点纳入范围，审核确认后续做”。
- 审核实例：Codex session `01a07558-8447-71e1-93e8-9de1624855f3`，未参与施工；静态检查 main 计划/brief、`wt/DHR_77@c4cee7f`、正式 `design/14`、Store 与 DHR_77 新测试。
- 只读边界：命令请求 `--sandbox read-only`，但启动横幅实际显示 `sandbox: danger-full-access`，故本审核只登记为“fresh 独立审核、非机器强制只读”。审核前后核对：主树仍为 `ce1f4b3` 且洁净，任务树仍为 `c4cee7f` 且洁净；未检测到仓内写入，但不声称写能力被机器阻断。

### 方案问题

无 P0/P1/P2/P3。

- 独立事实：`workflow-driver.mjs` 已向 Store 传入 `host_ref`，而 `store/store.mjs:439-457` 的封闭事件构造器未复制该字段。
- 裁定：同步在 DevPlan 与 brief 新增 `relay-core/store/store.mjs`，且只允许 `emitEvent` 复制 `input.host_ref`，是解除 F-7701 的最小充分调整。
- 测试：无需新增 `store.test.mjs`；`dhr77-host-ref.test.mjs` 已通过真实 `createStore` + driver 路径直接检查 replacement 与 lost 的持久化结果，`contracts.test.mjs` 已检查非观测事件禁带非空 ref。
- 不变项：目标、验收、依赖、任务类型与 `task_plan.md` 不变；本次调整不单独宣称 DHR_77 完成。

### 用户理解风险

唯一风险是把 `approved` 误读为 DHR_77 全卡完成或 Store 广泛修改授权。它只解除 F-7701，不证明 hash、read-model、CLI、全量测试、复核或人验完成，也不授权修改 `emitEvent` 以外的 Store 语义。

### 需要用户决定的问题

只需用户确认该精确 B-adjust，并决定是否让 `wt/DHR_77@c4cee7f` 按新范围续做 construction；没有额外产品岔路。

审核结论：`approved`；P0=0、P1=0、P2=0、P3=0。

## 2. 主控裁决与讲解

主控接受审核结论，无 finding 需驳回。事件从 driver 进入 Store，由 `emitEvent` 构造成封闭 event，Schema 在写盘前校验；本次只补齐已经存在于输入、却在构造时被漏掉的 `host_ref`。合法宿主观测可持久化标签，非宿主观测事件携带非空标签仍由 Schema 拒绝，失败在落盘前暴露。

<a id="understanding-b44"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-44 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=understanding -->
## 3. 用户理解、确认与权限

- 理解问题：如果一个非 `host_observation_changed` 事件携带非空 `host_ref`，方案应保存还是拒绝写入？
- 用户回答：“你觉得呢？似乎是拒绝。”主控确认该理解正确：`host_ref` 只表示 Herdr 宿主观测身份，混入其他事件会污染事件边界，必须在写盘前拒绝。
- 最终确认：主控询问是否“确认落盘这次最小 B-adjust，并让右侧 Luna 从 `c4cee7f` 继续 construction”，用户明文回复“确认落盘”。
- 权限：允许本次 B-adjust 原子落盘，并恢复同一右侧 Luna construction Node；不授权复核、verify、合并、DHR_35、push 或 deploy。
