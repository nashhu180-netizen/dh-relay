# DHR-B-30 · DHR67 Attempt 边界澄清 — 审核与确认

> 事件性质：B-adjust。只澄清 DHR67 adapter 的验收边界；不改正式设计输入、driver、Store、Receipt/Result 合同、任务类型、允许路径、依赖或 DHR35 真实闭环责任。

<a id="review-b30"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-30 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=review -->

## 触发与审核

需求复核发现既有 `workflow-driver` 在调用 `launchHerdrAgent` 前已创建并持久化 Attempt/Receipt。旧文字“启动失败不绑定 Attempt”若按字面执行，必须扩大到 driver 并重排 Receipt 生命周期，超出 DHR67 边界。

fresh 独立审核核对 `workflow-driver.mjs`、Store 的 Receipt 登记、design/12 P6-RI-A4 和 B-29 记录后结论：P0=0；旧工件未同步是 P1；失败范围措辞和 driver 机器证是 P2。采纳的最小调整为：adapter 启动失败不额外创建 Attempt/Result，已创建 pane 时只关闭同一 pane；既有 Attempt 仍由 driver 写入人工处理。补 DHR67 driver 回归证明 `waiting_human`、既有 Attempt 与零 Result。

## 用户理解与确认

<a id="understanding-b30"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-30 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=understanding -->

- 讲解：Attempt 是 driver 先创建的可追踪执行记录，不是 Claude 进程或 Result；DHR67 只负责安全启动、唯一识别、rename 与同 pane 清理。
- 理解问答：用户询问“没懂，再讲解下”；主控说明“完全没有 Attempt”将要求改 driver，而推荐语义保留既有 Attempt 用于人工处理。
- 最终确认：2026-08-30，用户明文“按你推荐的来”。
- 生效边界：只授权本 B-adjust 工件同步和已允许 DHR67 测试；不授权 driver/Store/Receipt/Result 改动、真实 Agent、verify、合并、推送、部署或环境动作。
