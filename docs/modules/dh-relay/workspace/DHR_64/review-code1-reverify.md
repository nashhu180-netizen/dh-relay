# DHR_64 Code Round 1 Reverification

- status: started
- reviewer: fresh code round 1 remediation reverifier
- scope: `20df8a1..99acbb9`
- started_at: 2026-08-30 (Asia/Shanghai)

## 身份、范围与审查方式

- 身份：fresh 代码轮 1 整改复验 reviewer；非主控，只读。
- 范围：仅 `20df8a1fb0bdfee75399c48eca5e20a60ab78824..99acbb9109c49b7b93d3c9c2de9e25bea044145a`；核对 DHR_64 brief、task_plan、progress、findings、原代码轮 1 报告及 DevPlan P6 §3.2。
- 方法：检查 `git diff --name-status`、整改代码和定向测试源码；未运行 `npm test`、长服务或任何测试，未改生产代码，未暂存、commit、merge 或 verify。

## 整改逐项复验

### P1-1 · 范围

- 结论：**已关闭（P1 -> 无）**。
- 证据：区间差异删除 `relay-core/runtime/attempt-retry.mjs:47` 的 `result_submission_mode`；其余生产变更仅为 DHR_64 已授权的 Store、service、workflow driver 及其定向测试。未见新的 retry / quota / fallback 接线。

### P1-2 · lease fence

- 结论：**已关闭（P1 -> 无）**。
- 证据：`relay-core/store/store.mjs:366-376` 在同一串行 Store job 内、调用 `commitMutation()` 前再次执行 `writeGuard()`；guard 失败先于 journal/Result/event/state 目标落盘。`dhr64-result-bridge.test.mjs:118-143` 的源码负例把第三次 guard 设为 `E_LEASE_HELD:lease-lost`，并断言 Result 目录为空。

### P1-3 · early submission

- 结论：**已关闭（P1 -> 无）**。
- 证据：`relay-core/runtime/workflow-driver.mjs:289-294` 每次 Herdr 观测前检查已 committed 的 `submissionResults` 并返回；`dhr64-result-bridge.test.mjs:177-211` 将宿主固定为 `working` 后先提交、再等待 `driver.done`，断言无 pane read、无 missing-result Attention 且状态为 `succeeded`。Herdr CLI 默认单次调用有 10 秒 timeout（`executors/herdr/herdr-cli.mjs:26-32`），没有发现无限阻塞的观测调用。

### P1-4 · bootstrap cleanup

- 结论：**P1 仍存在，未关闭**。
- 证据：`relay-core/runtime/service.mjs:391-404` 的第一轮仅经 `receiptBoundRun()` 收集 gate；该函数对 Receipt 只检查 `result_submission_mode`（`:327-341`），不做 Attempt Receipt schema/语义验证。随后第二轮在已对前一 Run 调用 `ensureActor()` 后，才处理后一 Run（`:400-403`）。而 `ensureActor()` 的代码明确说明 actor 建立即取得 lease 并落 `lease_acquired`（`:210-233`）；host 实现也在 ready 前实际 `appendEvent({ kind: 'lease_acquired' })`（`runtime/host.mjs:60-70`）。
- 影响：若较后的恢复候选在 actor/driver 初始化时失败，较早 Run 已经产生 lease/事件账变更。catch 中的 `stopLiveWorkers()`（`service.mjs:471-475, 992-999`）只能随后停止和释放，不能回滚已写账，因此不满足 DHR_64 “ready 前恢复失败不得改账”的验收条件。
- 覆盖缺口：本卡八个定向测试中没有“多 Run、后一个恢复失败、前一个账本字节不变”的用例。

### P1-5 · 损坏 event log

- 结论：**已关闭（P1 -> 无）**。
- 证据：service 的 `readEventsFromDisk()` 改为调用 Store 同源的 `readEventLog()`（`relay-core/runtime/service.mjs:110-117`）；后者复用 `loadEvents()`，校验 event protocol、run 归属、连续 seq 与 schema（`store.mjs:920-932`）。terminal duplicate 重建 gate 前必经该读取（`service.mjs:304-315, 444-451`）；损坏/截断会抛出，不能返回幂等 Ack。

### P1-6 · 伪 Receipt

- 结论：**P1 仍存在，整改仅覆盖活跃 Store bridge，未覆盖重启后的 terminal duplicate**。
- 已修部分：`store.mjs:694-708` 对 bridge 取到的 Receipt 调用 `assertAttemptReceipt(attemptReceiptContract(receipt))`；定向测试 `dhr64-result-bridge.test.mjs:133-143` 覆盖不含 Attempt Receipt schema 的伪对象被拒绝，且不产生 Result。
- 残余证据：重启幂等快路的 `receiptBoundRun()` 仍直接解析 `receipts/<id>.json`，只要求 `result_submission_mode === 'receipt-bound/v1'`（`service.mjs:327-339`）；`terminalSubmissionAck()` 只复核若干关联字段及 Result schema/digest（`:352-387`），没有要求 `receipt.protocol === 'relay.attempt-receipt/v1'` 或执行 Attempt Receipt schema 验证。故损坏/伪造的 Receipt 只要配有可通过 event-log 校验、字段自洽的 terminal Result/event，重启后仍可被当作同 digest 幂等提交 Ack，绕过“仅 Attempt Receipt”边界。
- 覆盖缺口：现有 service restart 用例只验证正常 Receipt 的幂等（`dhr64-result-bridge.test.mjs:238-323`），没有伪 Receipt terminal ledger 的拒绝例。

## 新 P0/P1

- **新 P0：无。**
- **新增独立 P1：无。** P1-4 与 P1-6 是原六项的残余，未将其重复编号为新问题。

## Ruling

**RULING: changes requested / 不通过代码轮 1 整改复验。P0=0，P1=2（P1-4、P1-6）。**

在恢复预验证不产生 actor/lease/账本副作用、以及 terminal duplicate 对 Attempt Receipt 完整 schema fail-closed 前，不得进入代码轮 2、其他 Review Batch、验收、verify 或合并。本 ruling 仅为当前代码轮的事实结论，不代替主控裁决。
