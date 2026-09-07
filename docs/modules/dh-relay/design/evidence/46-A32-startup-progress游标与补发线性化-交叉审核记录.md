<!-- dh:v1 -->
# DHR-A-32 · startup progress 游标与补发线性化交叉审核记录

> 正式对象：[`design/15`](../15-Herdr-Agent单一启动内容与有限重发.md)（候选形成史：[`design/drafts/DHR-A-32-startup-progress游标与补发线性化-候选.md`](../drafts/DHR-A-32-startup-progress游标与补发线性化-候选.md)）。本文记录 A-full 现场校准、fresh 审核、主控裁决、定向复审与整版确认；不授权 B-adjust、任务卡、代码或真实 Agent。

<a id="review-a32"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-32 artifact=design/15-Herdr-Agent单一启动内容与有限重发.md kind=review -->

## 1. 需求理解与现场校准

A31 已确认“第一次请求 accepted 后，在有限窗口内无持久进展才向同一身份 Agent 原样补发一次”。用户要求不要因材料可读就停在不可证，并让主控结合现场决定窗口；主控只读核对五条真实/实录形状样本，Host observation 到首 checkpoint 分别约 1.743、3.712、4.963、11.939、17.721 秒，因此选择固定 60 秒，约为最大样本的 3.4 倍。该样本只用于设计缓冲，不等于真实 Agent 或业务验收证据。

现役代码与 DHR_35 脱敏实录还证明：`workflow-driver.mjs::openAttempt()` 在 prompt 前写 `node_started`，且该事件没有 `attempt_id`。若照 A31 的“已有同 Attempt node_started”全历史判断，ordinal 2 永远不可达。Store CAS 与外部 Herdr prompt 又不能组成原子事务，故设计必须冻结进展游标、持久 mutation 与唯一线性化点。

## 2. fresh-context 初审与主控裁决

审核实例：`/root/a32_progress_cursor_review`。fresh、只读、未参与起草；读取 AGENTS、A32 候选、正式 design/15、现役 Store/driver 相关实现及指定 DHR_35 脱敏事件；前后 HEAD 均为 `5b6f73fe2128ec0afe578e8bac803d9a8205299b`，status 仅两个未跟踪候选；未写文件、未运行测试或真实 Agent。

初审结论 `CHANGES_REQUESTED`，无 P0，主要问题与裁决如下：

| # | 发现 | 主控裁决与调整 |
|---|---|---|
| R1 | `node_started` 无 Attempt 身份，不能作为发送后进展。 | 采纳。只认精确身份链 checkpoint 与 committed Result；发送前调度事实不阻止补发。 |
| R2 | A31 v1/A5/H1 若直接换语义会复用稳定 ID。 | 采纳。v1 作为未实施设计退役并拒绝读取；升为 v2，新建 HC-SD-A8/H2，A5/H1 标记 `superseded-before-implementation`。 |
| R3 | slot、accepted 与崩溃恢复缺少 Store 内部原子 mutation。 | 采纳。冻结 `reserve_delivery`、`record_delivery_outcome`、prepared/committed journal、epoch/digest CAS 与恢复表。 |
| R4 | 60 秒起算、UTC 回拨与安全投影未封闭。 | 采纳。由 outcome commit 的 `accepted_at` 起算，`last_runtime_at` 单调不减；时间回拨 fail closed；timeline/v2 使用字段和枚举闭集。 |
| R5 | ordinal 2 CAS 后、Herdr 调用前出现 checkpoint 的行为需要用户决定。 | 交用户裁决；见 §3。 |

## 3. 用户取舍与第一轮定向复审

主控向用户给出两案：A 为 ordinal 2 CAS 成功即形成不可撤销发送授权，CAS 后进展只诚实展示；B 为调用前 best-effort 再查，但仍不能消除最后检查与外部调用间竞态。用户明确选择“**A**”。

据此修订后，审核确认 CAS 线性化、checkpoint 谓词、v2/新 ID、原子 delivery mutation、60 秒时钟与 DHR_35 时间证据均到位，但留下两项 P1：checkpoint 工件与事件非原子可能形成孤立进展；timeline 的字段类型、枚举与生产者尚未完全封闭。结论 `CHANGES_REQUESTED`，无新 P0。

主控全部采纳：checkpoint/Result owning Store mutation 必须原子提交工件、event/连续 seq 与 timeline；恢复遇孤立工件立即 `waiting_human` 且禁止 reserve。timeline 封闭 ordinal、Runtime UTC timestamp、outcome、kind/outcome 组合，并由 reservation/progress seq 全序在同一 journal 生成。

## 4. 最终定向复审

同一审核实例只读核对最后两项 P1，结论 `PASS`：孤立 checkpoint/Result 崩溃窗口已 fail closed；timeline schema、生产者与恢复重放闭合；`last_runtime_at` 精确定义且回拨拒绝。未发现新的 P0/P1。复审前后 HEAD/status 不变，未写文件、未运行测试或真实 Agent。

<a id="understanding-a32"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-32 artifact=design/15-Herdr-Agent单一启动内容与有限重发.md kind=understanding -->

## 5. 用户理解对齐与整版确认

面向用户的整版说明覆盖：60 秒窗口、只认 checkpoint/committed Result、孤立持久进展 fail closed、ordinal 2 CAS 不可撤销授权、CAS 后进展诚实投影、最多两发、v2 拒绝 v1，以及 timeline 字段/枚举闭集。

用户先明确选择方案 A，随后于 2026-09-07 在整版确认口回复“确认”。该确认只授权将 DHR-A-32 修订写入正式 `design/15`、登记本审核证据与候选形成史；不授权 B-adjust、DevPlan/任务卡、代码、真实 Agent、DHR_35 重跑、Linux、verify、合并、推送或部署。
