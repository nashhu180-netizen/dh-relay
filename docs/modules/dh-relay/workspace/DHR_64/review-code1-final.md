<!-- dh:v1 -->
# DHR_64 · 代码轮 1 最终独立复核

## 身份、范围与方法

- 身份：fresh code round 1 final reviewer；非主控。
- 范围：只审 `99acbb9109c49b7b93d3c9c2de9e25bea044145a..4d7d0d66e88d92cc96119fe9d24537d4809336a1` 对原代码轮 1 P1-4、P1-6 的修复。冻结口径来自 DevPlan P6 §3.2 DHR_64：service ready 前必须恢复 receiver/actor/lease/driver gate，失败不得改账；仅当前完整 Attempt Receipt 可接受 submission，且仅 committed 同 digest terminal duplicate 可幂等。
- 方法：核对 DHR_64 brief/task_plan/progress/findings、原 `review-code1-codex.md` 与 `review-code1-reverify.md`；检查区间 diff、`service.mjs` 与定向测试源码；执行短定向命令 `cd relay-core; node --test --test-concurrency=1 test/dhr64-result-bridge.test.mjs`，终态为 10 pass / 0 fail / exit 0（14.488s）。未运行 npm test、长服务或真实 Agent；未修改生产代码，未暂存、commit、merge 或 verify。

## 原 P1-4 · 所有恢复候选先于任一 actor/lease 完整 fail-closed

**结论：已关闭。**

- `relay-core/runtime/service.mjs:406-412` 先遍历所有非 orphan Run 并收集每一个活动 Receipt-bound 恢复 gate；直到该阶段完成后，`:415-418` 才能调用 `ensureActor()` / `driveRun()`。
- `service.mjs:334-341` 对每一个由持久 `attempt_started` 事件定位的 Receipt，读取失败固定抛 `E_STORE_MUTATION_RECOVERY_FAILED`，并在 `assertAttemptReceiptContract()`（`:121-126`）中对完整 `relay.attempt-receipt/v1` 合同校验；所以任一较后的损坏/伪造恢复 Receipt 会在前序 Run 取得 lease 前中止启动。
- 新定向例 `relay-core/test/dhr64-result-bridge.test.mjs:325-361` 建立两个 Run，后一个持久 Receipt 缺失 Attempt Receipt 合同字段；断言 service bootstrap 以 `E_STORE_MUTATION_RECOVERY_FAILED` 拒绝，且前一个 `events.jsonl` 不含 `lease_acquired`。本轮执行的 10/10 定向测试覆盖并通过该例。

## 原 P1-6 · 重启 terminal duplicate 的持久 Attempt Receipt 完整 schema

**结论：已关闭。**

- 重启后的 lazy terminal 路径经 `service.mjs:459-466` 调用 `receiptBoundRun(..., { allowTerminal: true })`，并在读取持久 Receipt 后必经 `assertAttemptReceiptContract()`（`:334-341`）；无法再只靠 `result_submission_mode` 进入幂等 Ack。
- `service.mjs:367-402` 仍在同一路径校验 Result schema、Receipt/Run/Attempt/事件身份、固定 structured 形状及 payload digest，只有完整 ledger 的同 digest 才返回 idempotent Ack；校验失败固定为 `E_STORE_MUTATION_RECOVERY_FAILED` 且不创建 actor。
- 新定向例 `relay-core/test/dhr64-result-bridge.test.mjs:363-413` 先持久化正常 terminal Result，再删除 receipt 的 `protocol` 并重启 service；重复 submission 断言返回 `E_STORE_MUTATION_RECOVERY_FAILED`。本轮执行的 10/10 定向测试覆盖并通过该例。

## 新 P0/P1

无。未发现本修复区间新增的 P0 或 P1。

## RULING

**RULING: PASS。** 原 P1-4、P1-6 均已由实现与定向终态证据关闭。本结论仅为 DHR_64 fresh code round 1 final 的只读事实结论；不代替主控的后续 Review Batch、验收、verify、合并或发布裁决。
