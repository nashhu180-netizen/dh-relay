<!-- dh:v1 -->
# DHR_64 · 一致性 Fresh Review（Herdr）

## 身份、范围与方法

- 身份：DHR_64 一致性 fresh reviewer；非主控，未参与本卡实现或此前代码/需求/教训复核。
- 候选：以冻结基线 `33219fe` 对比当前 `5efd2af`，包含 `e0d92f4` 的 v2 close/error waiter 修复及后续拒绝/观测证据。
- 读取：仓根 `AGENTS.md`、DevPlan P6 §3.2、DHR_64 的全部 `review*`、`progress.md` 与 `findings.md`。
- 方法：只比对 contracts、Store、v2 RPC/CLI、service、workflow driver 与 Herdr completion 的 Receipt→Result 数据流；检查 Result 唯一入口、reason/identity/fence/terminal、recovery 和 close/error waiter 终态。未修改生产代码，未运行 `npm test`、长服务、真实 Agent/registry/DHR_35，未暂存、commit、merge 或 verify。

## 跨层比对

| 主题 | contracts / CLI / service / driver / Store 对齐结论 |
|---|---|
| 唯一 Result 入口 | submission schema 闭集且只含 Receipt/outcome/fixed reason；CLI 固定构造该形状；v2 service 只能路由到 matching driver gate；driver 再经 actor 调 Store；Store 从当前 Attempt Receipt 派生完整 Result、event 与 state。Herdr done/idle、judge/capture、pane、host status、exit code 没有 Result 写入支路。 |
| reason 与身份 | 成功只能 `reason:null`，失败只能 `E_EXECUTOR_REPORTED_FAILURE`；Store 要求完整当前 Attempt Receipt、同 run/node/attempt、`herdr-agent` profile，并固定 Result structured/digest。未知/旧/非当前为 `E_IDENTITY_MISMATCH`，fenced 为 `E_ATTEMPT_FENCED`，冲突终态为 `E_TERMINAL_STATE_CONFLICT`。 |
| terminal / retry | 同 Receipt、同 digest 且已 committed 才可 idempotent；live driver 不再有 gate 时，service 从持久 terminal ledger 复核并返回同一 Ack，避免重新获取 lease 或追加事件。不同 outcome/reason 不会被误认成重试成功。 |
| recovery | prepared mutation 在 Store load 前恢复，Receipt/Result/event ledger 任一不自洽即 fail-closed。service 先验证所有恢复 candidate 才创建任一 actor/lease；恢复写 observation/Attention 时在 actor 内复查 Attempt 仍开放，不能在提交 Result 后追加相互矛盾的事件。 |
| close/error waiter | `connectCliV2()` 的 socket close/error 统一清 timer、删除所有 waiter 并 reject `E_TRANSPORT_CLOSED`；同一 waiter 若已收到 frame 先清 timer 再 resolve，重复 close/error 因 map 已清空而无副作用。传输的 `destroy()` 会发出 close 事件，故公开 `close()` 与 socket error/close 不会留下 120 秒悬挂 waiter。 |

## 定向终态证据

- `node --test --test-concurrency=1 test/dhr64-store-reject-matrix.test.mjs test/dhr64-driver-observation.test.mjs`：`5 pass / 0 fail / exit 0`。覆盖旧 Receipt、fallback fence、v2 waiter close、done、idle 与 host loss 的零 Result/Attention 语义。
- `node --test --test-concurrency=1 --test-name-pattern "transport close rejects" test/dhr64-result-bridge.test.mjs`：`1 pass / 0 fail / exit 0`。
- 已知 `npm test` / 全量 Node 回归此前未得完整终态；本报告不把它们计作绿色证据。

## P0/P1

- **P0：无。**
- **P1：无。** 未发现 Receipt、reason、identity/fence、terminal、recovery 或 close/error waiter 在相邻层之间产生可导致错误 Result、错误 Ack、账本矛盾或无终态等待的冲突。

## RULING

**RULING: PASS。** 本结论只覆盖 DHR_64 一致性 fresh review；不代替主控的需求验收、全量回归、verify、合并、发布或环境操作裁决。
