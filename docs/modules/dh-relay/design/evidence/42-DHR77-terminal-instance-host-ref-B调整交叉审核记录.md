<!-- dh:v1 -->
# DHR-B-43 · DHR_77 terminal-instance `host_ref` B-adjust 交叉审核记录

> 状态：fresh 审核、主控裁决、用户理解回答与最终确认均已完成，`DHR-B-43` 已正式生效。本文是审核过程，不属于 resolver `designInputs[]`；用户另行把本轮权限扩到 DHR_77 S0～S2（建 workspace 与 task_plan），仍不授权生产代码、真实 Agent、DHR_35、verify、合并、推送或部署。

<a id="review-b43"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-43 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=review -->
## 1. fresh-context 只读审核

- 审核实例：`/root/b43_fresh_review`；fresh-context、未参与起草；按 review brief 只读核验，零文件写入。
- 原始需求：用户于 2026-09-06 说明 A-30 已正式晋升并提交，要求“继续”，同时明确尚未进入 B-adjust、DevPlan、建卡、代码、真实 Agent、DHR_35、verify、合并或推送。
- resolver：`state=new`、`mode=manifest`，7 份 `designInputs[]` 包含 `design/14` 的 `HC-HR-A1..A5/H1`；evidence/records/drafts 未作为规划输入。
- 独立代码事实：event/v0 尚无 `host_ref`；recovery 仍把 `pane_id` 充作 `terminal_id`；RPC v1 仍使用固定 hash；CLI `focus` 仍输出 `detail`。

### 方案问题

无 P0/P1/P2/P3。DHR_77 单张 heavy 卡覆盖正式六项验收，生产、测试与 fixture 候选范围覆盖已知落点。

### 用户理解风险

无分级 finding。须继续明确：B-adjust 确认只落计划与审核留痕；不授权 DHR_77 D-start、代码、真实 Agent、DHR_35 或 verify。`HC-HR-H1` 不替代 DHR_35 的 P6-M1。

### 需要用户决定的问题

无额外产品岔路。流程上仍需用户回答理解题，并最终确认是否按候选新增 DHR_77、把 DHR_35 改为 `blocked-by:DHR_77`。

审核结论：`approved`；P0=0、P1=0、P2=0、P3=0。证据限制：未运行测试、Herdr 或真实 Agent。

## 2. 主控裁决

无 finding 需采纳或驳回。主控接受审核结论：`DHR_72 → DHR_77 → DHR_35` 是最小无环顺序；DHR_77 改变 DHR_35 必须展示的正确 `host_ref` 版本，因此追加依赖是防止昂贵实录在协议合入后失效，不是混用两卡证据。

<a id="understanding-b43"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-43 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=understanding -->
## 3. 用户讲解、理解问答与确认

- 全局地图：Herdr 返回 `terminal_id` → Relay 生成脱敏 `host_ref` → 事件账保存 → read-model/RPC 投影 → CLI/受控 Herdr 对照面展示。
- 契约：一张 DHR_77 heavy 卡原子更新 event/v0、writer/recovery、v1/v2 hash、read-model/CLI；任何一段不能单独宣称兼容完成。
- 运作：相同 terminal ID 保持标签，不同 ID 更换；lost 只保留最后可信标签；无可信 ID fail closed；非观测事件禁带标签。
- 验证：A1~A5 用 schema/golden/replay/hash/CLI/变异测试；H1 由用户看 DSH-off 安全投影与受控 Herdr 对照标签。失败会由 schema、capability mismatch、回放/CLI 测试或人验证据暴露，不能 fallback 到 pane/agent/detail。
- 依赖：DHR_77 只解除 DHR_35 的计划阻塞；DHR_35 仍须单独 D-start 并自跑 Codex/Claude 两条 Receipt→Result 实录。
- 理解问题：DHR_77 将来收口后，是否会自动开始 DHR_35，还是只解除计划阻塞、DHR_35 仍须独立 D-start 并自跑两条真实闭环？
- 用户回答与解释：用户先答“不知道”；主控解释两道闸独立——DHR_77 只证明新版 `host_ref`，DHR_35 仍须独立 D-start。用户随后回复“好的明白了”。
- 最终确认与权限：主控询问是否“只落盘 B-adjust、仍不建 workspace/不改代码”，用户明确纠正为“**不，落盘，建workspace，建task-plan**”。据此，本轮授权包括正式 B-adjust 落盘和 DHR_77 的 S0～S2；不包括 S3 生产代码施工、真实 Agent、DHR_35、verify、合并、推送或部署。
