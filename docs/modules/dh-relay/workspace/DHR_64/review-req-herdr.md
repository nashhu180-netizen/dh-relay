<!-- dh:v1 -->
# DHR_64 · 需求方向 fresh 复核

## 身份、范围与方法

- 身份：DHR_64 需求方向 fresh reviewer；非主控，只做只读复核。
- 范围：以 DevPlan P6 §3.2 DHR_64、brief 与 task_plan 的五个冻结验收靶子为准，审 D-start 基线 `880a30f..4d7d0d6` 的候选实现和唯一 DHR_64 定向测试 `relay-core/test/dhr64-result-bridge.test.mjs`（全部源码）。同时阅读 `review.md`、progress、findings 及代码轮 1 记录。
- 方法：逐条将冻结靶子映射到 contracts、Store、v2 RPC/CLI、service、driver 和 Herdr completion；检查候选变更路径、定向测试的断言及已有账本证据。未运行 npm test、长服务或真实 Agent；未操作 registry/DHR_35；未修改生产代码、暂存、commit、merge 或 verify。

## 冻结验收靶子逐条结论

### 1. Receipt 是唯一 Result 成功入口，且拒绝矩阵不改账

**实现方向：符合；证据：不足，见 P1。**

- `relay.executor-result-submission/v1` 是 closed schema，禁止自由 structured，failed 固定为 `E_EXECUTOR_REPORTED_FAILURE`（`relay-core/contracts/relay.executor-result-submission.v1.schema.json:4-38`）。
- Store 从当前持久 Attempt Receipt 派生 Result 身份和固定 structured；校验当前 Receipt、fence、Herdr kind、终态和同 digest 幂等（`relay-core/store/store.mjs:690-762`）。service 只经 driver → actor → Store 路由，重启 terminal duplicate 仍复核持久 Receipt/Result/event ledger（`relay-core/runtime/service.mjs:422-475`）。
- 定向测试已覆盖正常提交、同 digest 幂等、终态冲突、未知 Receipt、lease-lost、伪 Receipt 与重启伪持久 Receipt（`dhr64-result-bridge.test.mjs:65-143,238-413`），但未覆盖完整 P6-RI-A3 矩阵，故不能据此确认本靶的机器证完整。

### 2. Result、事件和 Attempt 状态同一 recovery journal 原子提交

**实现方向：符合；证据：不足，见 P1。**

- `submitExecutorResult()` 将 Result、attempt terminal event 和 replay 后的 `state.json` 作为同一 `commitStoreMutation()` 的 targets，之后才更新内存、发布订阅并返回成功（`relay-core/store/store.mjs:725-762`）；mutation 边界前再次检查 writeGuard（`:366-376`）。
- 定向测试覆盖 prepared marker 缺失时的恢复、Result/event/state 重建和 result staging blob 损坏的 fail-closed（`dhr64-result-bridge.test.mjs:145-184`）。但它只构造“全部三个目标撤回”的单一恢复形态，未逐个证明 Result、events、state 任一部分已落盘时的各 prepared 强杀点均无孤儿/矛盾，也未直接证明 Ack 不早于 committed。

### 3. ready 前恢复 gate，失败不残留 actor/lease 或绕过 driver

**实现方向与现有关键证据：符合。**

- `restoreReceiptBoundDrivers()` 先收集并校验所有活动 Receipt-bound candidate，随后才取得任何 actor/lease（`relay-core/runtime/service.mjs:405-419`）；Receipt 不可读或合同无效固定为 `E_STORE_MUTATION_RECOVERY_FAILED`（`:334-341`）。
- `submit-executor-result` 由 live/recovered driver 调用 `actor.submitControl(store => store.submitExecutorResult(...))`，无 service 直写 Store 支路（`service.mjs:422-475`、`workflow-driver.mjs:92-101`）。
- 多 Run 场景中后续伪 Receipt 会在前序 Run 获 lease 前使 bootstrap 失败的断言位于 `dhr64-result-bridge.test.mjs:325-361`；重启 terminal duplicate 不重新取得 actor/lease 的断言位于 `:291-321`。

### 4. Herdr done/judge/capture/pane/host/exit 不得直接生成 Result

**实现方向：符合；证据：不足，见 P1。**

- Herdr completion instruction 只传固定 argv 的 Receipt submission，明确排除 pane/log/exit code 作为结果通道（`relay-core/runtime/executors/herdr/herdr-executor.mjs:91-103`）。
- Herdr driver 对 working 只写 checkpoint，对 blocked/host 情况只写 Attention/observation；done/idle 仅等待 submission，超时写 `human_input_requested:E_EXECUTOR_RESULT_MISSING`，不调用 `recordResult`（`relay-core/runtime/workflow-driver.mjs:289-343`）。
- 测试覆盖 working 时早到 submission（无 pane read）和 idle 缺 submission（零 Result、waiting_human）（`dhr64-result-bridge.test.mjs:186-236`），但没有 done、judge/capture、pane、host status、exit code 的各项负例机器证。

### 5. v1 Attention 兼容；v2 不降级；失败 reason 固定

**实现方向：符合；证据：不足，见 P1。**

- v2 CLI 明确完成 v1 descriptor/capability 回证后连接 v2，注释及实现均拒绝 silent fallback（`relay-core/cli/client.mjs:290-360`）；`submit-result` 的 argv/reason 固定（`relay-core/cli/main.mjs:181-199`）。
- schema 测试验证成功/失败的固定 reason 与禁止自由 structured（`dhr64-result-bridge.test.mjs:51-63`），CLI 定向例验证显式 v2 连接且未知 Receipt 返回拒绝（`:415-433`）。
- 该文件没有 v1 Read Model 遇到 open Attention 的兼容性断言，因而不能把既有 v1 语义不回归作为本卡充分机器证。

## Scope drift

**未发现 scope drift。** 候选生产变更只在 DevPlan 明列的 contracts、Store、v2 RPC/CLI、service、workflow driver 与 Herdr completion instruction；其余为对应定向测试、contract capability/audit 同步和 DHR_64 工作区记录。未见用户级 registry、真实 Agent、Linux、DHR_35 或 quota/fallback 重接线的候选改动；先前越界的 `attempt-retry.mjs` 不在最终范围。

## P0/P1

- **P0：无。**
- **P1 · 冻结验收所需的机器证矩阵未闭合。** DHR_64 唯一定向文件只有 10 个测试，未为 DevPlan §3.2 / design/12 P6-RI-A1~A3 的全部枚举提供可复跑断言：至少缺少旧/非当前 Receipt、真实 fallback pause 后 fenced submission、未认证 RPC、service/driver 恢复未完成；prepared mutation 的 Result/event/state 各部分已落盘的强杀恢复；done、judge/capture、pane、host status、exit code 的无 Result 负例；以及 v1 Attention 兼容。当前静态实现显示这些路径大多有守卫，但验收要求的是机器证，不能以代码阅读代替。应补齐这些定向负例及终态证据后再作需求方向通过裁决。

## Ruling

**RULING: changes requested。** P0=0，P1=1。实现方向和范围符合 DHR_64 冻结合同，但五个验收靶子尚未具备充分、逐项可复跑的机器证。本 ruling 只覆盖需求方向复核，不代替主控的 Review Batch、验收、verify、合并或发布裁决。
