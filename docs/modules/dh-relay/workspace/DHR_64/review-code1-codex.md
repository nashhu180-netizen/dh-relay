<!-- dh:v1 -->
# DHR_64 · 代码轮 1 独立复核（Codex）

## 复核身份、范围与基线

- 本轮是 fresh、独立的代码轮 1；只读检查候选提交 `20df8a1fb0bdfee75399c48eca5e20a60ab78824`，父提交为 `880a30f8b377962a34d72aa2eb8a8fee78642bf7`。
- DHR64 的现役 B-25 合同以 master `f66ea1e` 为准（`dev_plan/P6-Herdr多账号执行底座-开发方案.md` §3.2）：除列出的宽路径外，Herdr/CLI/测试路径是精确白名单；DHR65 只拥有 `profile-registry.mjs`、DHR65 测试及其 workspace。
- 本轮只新增本文件；没有修改生产代码、既有工件，没有 `git add`、commit、verify、merge 或 push。
- `git diff --name-status 880a30f..20df8a1` 显示候选变更 21 个路径；其中 `relay-core/runtime/attempt-retry.mjs` 是下面的越界路径。

## P0

无。

## P1

### P1-1 · 变更越过现役 DHR64/DHR65 path ownership

**位置**：`relay-core/runtime/attempt-retry.mjs:47`。

候选在 fallback pause retry 的 Attempt Receipt 上加入 `result_submission_mode`。现役合同 `f66ea1e` 的 DHR64 允许路径列在 `dev_plan/P6-Herdr多账号执行底座-开发方案.md:223-237`：runtime 只允许 `service.mjs`、`workflow-driver.mjs` 和精确的 Herdr executor；DHR65 的白名单在同文件 `:239-254`，也不包括 `attempt-retry.mjs`。因此这不是 DHR64 获得的写权限，且 DHR64 明确不得把 pause/fallback 变更带入本卡。即使字段本身看似与 Receipt 合同相关，也不能随候选提交落地；应移除该路径，或由 owner 另开合同/任务后再改。

**证据**：`git diff --name-status 880a30f..20df8a1` 的确列出该路径为 `M`；与 master `f66ea1e` 现役精确白名单逐项比对未命中。此项单独阻断本候选按 DHR64 合同通过。

### P1-2 · lease guard 只在 job 开始检查，租约丢失后仍可提交 mutation

**位置**：`relay-core/store/store.mjs:353-358`（`guardedJob`），`relay-core/store/store.mjs:680-747`（`submitExecutorResult`）。

`runWrite()` 只在排队 job 进入时调用一次 `writeGuard()`，随后 bridge job 继续构造 Result/event/state 并异步调用 `commitStoreMutation()`。提交 prepared journal、目标文件及 committed marker 前没有第二次 lease/fencing 检查，也没有把本次写入绑定到 guard 返回的 fencing token。租约可在第一次检查返回后、真实 mutation 写入前被另一 actor 接管，违反现役验收“lease-lost 不改账”。

**具体复现**：临时目录创建 Herdr Receipt；`writeGuard` 第一次（注册 Receipt）正常返回，第二次（bridge）返回后用 `queueMicrotask` 将 `leaseValid=false`，而不阻塞其后的 commit。调用 `store.submitExecutorResult` 的终态输出为：

```text
{ ackOk: true, guardCalls: 2, leaseValid: false,
  resultFiles: [ 'rcpt-race.json' ], eventLines: 2 }
```

即 guard 已失效仍收到成功 Ack，Result 与 attempt event 已落盘。必须让 lease/fencing 检查覆盖实际提交边界（或使用能在 Store mutation 中拒绝 stale token 的原子机制），并补充 lease-lost race 的负例。

### P1-3 · 已接受的 submission 无 waiter 时不能唤醒/结束工作中的 driver

**位置**：`relay-core/runtime/workflow-driver.mjs:92-100`，工作循环 `:317-345`。

`submitExecutorResult()` 成功后只写 `submissionResults`、删除 gate，并调用 `resolveSubmissionWaiter()`；如果 driver 当前仍处于 `working`/blocked 分支，尚未进入 `waitForExecutorResult()`，就没有 waiter 可唤醒。工作循环不会检查 `submissionResults`，也没有停止/转移当前 Herdr poll loop 的动作，导致成功 Result 已提交但 driver 不结束，后继节点无法推进。

**具体复现**：fake Herdr 始终返回 `working`；启动 driver，先等 gate，再提交同一个合法 Receipt-bound submission，并等待 100ms。输出：

```text
{ ackOk: true, driverFinished: false, state: 'succeeded',
  eventKinds: [ 'node_started', 'attempt_started',
    'host_observation_changed', 'attempt_succeeded' ], checkpoints: 0 }
```

该结果表明账面 Result 已成功但 driver 仍活着（fake 的 checkpoint 冲突也被工作循环忽略）。提交路径必须能终止/唤醒当前 driver，且要有“submission 先到、观察尚未 done/idle”的测试。

### P1-4 · service ready 前部分恢复失败会泄漏已创建的 actor/lease

**位置**：`relay-core/runtime/service.mjs:390-400`、`:960-986`。

启动时 `restoreReceiptBoundDrivers()` 按已知 run roots 逐个 `ensureActor()`/`driveRun()`。若前一个 run 已创建 actor、取得 lease，后一个 run 在恢复时因 schema/receipt 错误失败，启动 catch 只关闭 RPC handles，没有停止已创建 actor/driver、释放 lease 或清理恢复现场。于是 service 未 ready 却留下第一届的 `host-lease.json`，后续启动/接管可能被错误阻塞；这也违背“ready 前恢复失败不得留下 actor/lease”的闭环条件。

**具体复现**：临时创建两个带合法 `relay.attempt-receipt/v1`、`result_submission_mode:'receipt-bound/v1'` 的 active run roots；第二个 receipt 改为 schema-invalid 的 alias，调用 `startRuntimeService`。输出：

```text
{ error: 'E_SCHEMA_INVALID:E_BAD_VALUE',
  validRunLeaseAfterFailedStart: true }
```

应在启动失败路径按已创建资源逆序停止 actor/driver 并释放 lease，且对这一路径加断言“无新增 Receipt/Agent/fallback、无残留 lease”。

### P1-5 · 损坏 event log 可绕过 Store 校验，终态重复 submission 仍被判幂等成功

**位置**：`relay-core/runtime/service.mjs:111-117`、`:304-339`、`:352-383`。

service 的 `readEventsFromDisk()` 只 JSON.parse 每行，不验证 protocol、run identity、连续 seq、event schema 或 Result/Receipt ledger；`terminalSubmissionAck()` 直接据文件中的终态 event/result 做 digest/idempotence 判断。正常 `openStore()` 的 `loadEvents()` 会拒绝 seq 损坏，但 service 的 terminal duplicate 快路没有经过 `openStore()` 的完整校验。因此日志被截断/改 seq 后，服务仍可能返回成功 Ack，违反“损坏/截断不改账”和“只有 committed、同 digest 才可幂等”。

**具体复现**：先完成一次合法 bridge；随后把 `events.jsonl` 第二行的 `seq` 从 `1` 改成 `99`（仍是合法 JSON），在同一运行 service 上用原 submission 重复调用 v2。输出包含：

```text
{ jsonrpc: '2.0', id: 2,
  result: { ok: true, idempotent: true, result: { /* relay.result/v2 */ } } }
```

需要让 terminal duplicate 复用 Store 的 fail-closed ledger/recovery 校验，或在 service 读取路径执行等价完整校验；至少应覆盖 corrupt/truncated/seq-gap 后 Ack 必须拒绝且账不变。

### P1-6 · Store 的 bridge 可接受非 Attempt Receipt 的“伪 Receipt”

**位置**：`relay-core/store/store.mjs:474-490`、`:684-687`。

`registerReceipt()` 这一通用注册入口没有校验 `relay.attempt-receipt/v1` schema；bridge 只检查 `receipt.result_submission_mode === 'receipt-bound/v1'`，没有要求 `receipt.protocol` 为 Attempt Receipt、也没有重新验证 Receipt schema。一个仅带合法身份字段和 mode 的非 Receipt 文档即可注册，然后通过 bridge 写入正式 `relay.result/v2`，绕过“仅当前 Attempt Receipt 接受 submission”的边界。

**具体复现**：临时目录用 `registerReceipt()` 注册一个没有 `protocol`、但含同 run/node/attempt、合法 `executor_kind:'herdr-agent'`、`result_submission_mode:'receipt-bound/v1'` 的对象，再调用 `submitExecutorResult`：

```text
registerReceipt { ok: true, idempotent: false }
submit { ok: true, idempotent: false,
  result: { protocol: 'relay.result/v2', executor_kind: 'herdr-agent', ... } }
```

重新打开 Store 仍接受该 ledger。Store 是唯一 mutation authority，不能只依赖正常 driver 调用 `registerAttemptReceipt()`；应在注册和 bridge 两侧都强制完整 Attempt Receipt schema/protocol/current receipt 约束，并为 generic/old/pause receipt 加负例。

## P2

无另列项。上面的 receipt 身份绕过、corrupt terminal 快路、lease race 和恢复泄漏均已达到会造成错误 Ack、残留 lease 或错误推进的 P1，不降为单纯覆盖率问题。

## 已核对的清项

- **唯一 Result 语义方向正确**：driver/service 中未发现把 pane、process exit、judge、capture、host status、done/idle 或 quota/fallback 直接变成 Result 的新支路；缺 Result 的 done/idle 路径进入 `human_input_requested:E_EXECUTOR_RESULT_MISSING`，失败 submission 使用固定 `E_EXECUTOR_REPORTED_FAILURE`。没有建议恢复 DHR33/DHR34 的旧 judge/capture/host-loss 判定；候选 workspace 中已有的旧测试失败属于该语义迁移记录，不是本轮把旧判定塞回去的理由。
- **Result 形状与身份**：submission schema、Result schema、v2 RPC schema 是 closed/固定 protocol；server 从 Receipt 派生 Result，structured 固定为 `source:'receipt-bound-submission/v1'`，digest 排除 `finished_at`。正常路径的 Result/event/state 目标由同一次 recovery journal 提交，Ack 在 commit 返回后才发出。
- **v2 CLI/RPC**：CLI 使用显式 v2 capability/handshake；未见静默 v1 downgrade，`submit-executor-result` 方法与成功/拒绝形状已注册。
- **结构性检查**：`node relay-core/tools/audit-contracts.mjs` 终态通过（24 schemas/shapes、unregistered openings 0、vendor tokens 0、refs 227/0、conditions 0、naming 0、tokens 0）；`node relay-core/tools/capability-baseline.mjs` 通过（20 contracts）；`node relay-core/tools/validate.mjs --selftest --json` 终态 `57 pass / 0 fail`；所有候选 `.mjs` `node --check` 通过；`git diff --check 880a30f..20df8a1` 通过。
- **定向测试**：`node --test --test-concurrency=1 relay-core/test/dhr64-result-bridge.test.mjs` 终态 `7 pass / 0 fail`。这组测试尚未覆盖本报告的 lease race、早到 submission、启动部分恢复失败、损坏 terminal 快路和伪 Receipt；因此不能用 7/7 清除上述 P1。一次混合旧 DHR33/DHR34 测试运行未得到完整终态，不作全量绿色证据。
- **DHR63/DHR65 ownership**：候选没有修改 `profile-registry.mjs` 或 DHR65 新测试；除 `attempt-retry.mjs` 外，所列生产/测试路径均落在现役 DHR64 白名单或宽路径内。`attempt-retry.mjs` 仍须单独清除/转卡。

## 明确 ruling

**RULING：changes requested / 不通过代码轮 1。** P0=0，P1=6。当前候选不能进入需求验收、verify 或合并；至少需关闭 P1-1 至 P1-6，并补跑同一 Receipt-bound 负例矩阵（lease-lost、早到 submission、部分恢复失败、损坏/截断、非 Attempt Receipt、旧/fenced/终态冲突），再由下一独立复核确认。此 ruling 仅为代码轮 1 事实结论，不代替主控验收、verify 或 release 决策。
