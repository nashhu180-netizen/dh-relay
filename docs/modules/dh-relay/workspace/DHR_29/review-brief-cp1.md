# DHR_29 批次 1 只读复核 brief

## 身份与边界

你是第一轮 fresh-context 复核 worker，不是主控。只读检查，**不得修改任何代码、契约、测试、DevPlan 或工作区文件**；在最终答复中按 P0–P3 列出事实、证据与结论。卡住或证据不足也要明确写出，不能把猜测当结论。

## 复核范围

- `relay-core/store/store.mjs`
- `relay-core/store/state.mjs`
- `relay-core/test/store.test.mjs`
- `relay-core/package.json`
- `relay-core/contracts/_shared/relay.common.v1.schema.json`
- `relay-core/contracts/relay.event.v2.schema.json`
- 本批修改的各 schema、三份基线与 `workspace/DHR_29/{brief,task_plan,progress,findings}.md`

## 必查问题

1. 事件账是否真只追加，重放是否由事件而非内存状态决定；快照是否能从全量账重建。
2. checkpoint/result 的幂等、冲突、Receipt 迟到隔离是否会错误改写终态；`attempt_id` 逆序时是否实质依赖 `seq`。
3. Store 写出的每个事件是否符合 `relay.event/v2`；`human_input_requested` 是否是 `waiting_human` 的明确且唯一产生者，同时没有提前冻结 P7 Attention。
4. `structured` 脱敏是否真的遵循 v1 Oracle 的核心口径，是否有明文凭据残留或测试绕过。
5. 契约批次是否遗漏 K-3 身份 pattern、副作用是否被 capability/manifest/token 基线正确捕捉；是否有范围漂移到 DHR_51/52。
6. 测试是否“改坏必红”，是否存在只验证实现细节而不验证需求的空绿。

## 输出格式

- 结论：`approved` 或 `changes-requested`。
- 每项 finding：`P级 | 路径:行 | 事实 | 为什么影响验收 | 可复现命令/证据`。
- 无 finding 时也列出实际执行的检查和未覆盖边界。
