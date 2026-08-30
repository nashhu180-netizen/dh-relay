<!-- dh:v1 -->
# DHR_64 · 需求方向 P1 整改复验（Herdr）

## 身份、范围与方法

- 身份：DHR_64 需求方向 P1 整改复验 reviewer；非主控，只读。
- 范围：仅审 `e0d92f4..5efd2af` 对 `review-req-herdr.md` 原 P1 的整改：旧/非当前 Receipt、canonical fallback fence、v2 close/error 的 in-flight waiter、done/idle/host loss 零 Result。
- 方法：检查区间 diff、`client.mjs`、两份新定向测试源码及 workspace 账本；只执行无真实 Agent、无长服务的精确定向入口。没有运行 npm test、全量测试或服务型未收尾测试；未暂存、commit、merge 或 verify。

## 原 P1 逐项复验

### 旧 / 非当前 Receipt

**已关闭。** `relay-core/test/dhr64-store-reject-matrix.test.mjs:35-48` 先登记旧 Attempt Receipt、再登记当前 Receipt，提交旧 Receipt 固定得到 `E_IDENTITY_MISMATCH`，并断言 `results/` 为空。这是对同 node 的非当前（旧）Receipt 的真实 Store 路径，而非 mock reason。

本轮命令 `cd relay-core; node --test --test-concurrency=1 test/dhr64-store-reject-matrix.test.mjs` 取得完整终态：2 pass / 0 fail / exit 0（1.311s）。

### canonical fallback fence

**已关闭。** 同一测试 `:50-61` 使用生产 `buildFallbackPause()` 构造 canonical pause，再经 `store.appendFallbackPause()` 持久化 fence；对该 Receipt 的 submission 固定返回 `E_ATTEMPT_FENCED`，且 `results/` 为空。该测试验证的是真实 pause→fence→Store bridge 链，而不是手工写入内部 fenced set。

上述 2/2 完整终态同时覆盖此项。

### v2 close / error 的 in-flight waiter

**已关闭。** `relay-core/cli/client.mjs:329-345` 的 `onClose` 与 `onSocketError` 共同调用 `rejectPending()`；该函数委托 `rejectPendingTransportWaiters()`，逐个删除 waiter、清 timer，并以 `E_TRANSPORT_CLOSED` reject。`dhr64-store-reject-matrix.test.mjs:63-70` 对实际 waiter record 执行该收尾，断言 promise 立即以该稳定 reason 结束且 Map 清空；其终态已在上述 2/2 中取得。

该定向测试刻意不持有 Runtime service，故不存在此前“服务型测试未退出”被误报为绿色的问题。close 与 socket-error 在生产代码中没有分叉，均进入同一个已验证收尾函数。

### done / idle / host loss 零 Result

**已关闭。** `relay-core/test/dhr64-driver-observation.test.mjs` 用 fake Herdr 启动真实 workflow driver：

- `:45-58` 分别覆盖 `done` 和 `idle`：等待 driver `done` 后断言 Result 目录为空、没有 pane capture（`agentReads === 0`），并存在 `human_input_requested:E_EXECUTOR_RESULT_MISSING`。
- `:61-67` 覆盖 host loss：等待 driver 收口后断言 Result 目录为空，且存在 `human_input_requested:E_EXECUTOR_HOST_LOST`。

本轮命令 `cd relay-core; node --test --test-concurrency=1 test/dhr64-driver-observation.test.mjs` 取得完整终态：3 pass / 0 fail / exit 0（11.400s）。该入口只使用 fake Herdr 与临时目录，未启动真实 Agent 或长服务。

## 覆盖与结论

原 P1 点名的四类缺口均已有可复跑定向负例和本轮完整终态；旧 Receipt、pause fence、transport waiter、三种 observation 不再依赖未得终态的全量/服务型运行作为绿色依据。整改 diff 仅涉及 v2 CLI waiter、DHR_64 定向测试、默认测试清单及 workspace 记录，未见 scope drift。

## P0/P1

- **P0：无。**
- **P1：无。** 原 `review-req-herdr.md` 的 P1 已关闭。

## RULING

**RULING: PASS。** 本结论仅关闭 DHR_64 需求方向原 P1 的整改复验，不代替主控的后续一致性复核、验收、verify、合并或发布裁决。
