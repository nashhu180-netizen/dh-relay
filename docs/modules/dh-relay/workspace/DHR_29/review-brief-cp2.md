# DHR_29 批次 2 只读复核 brief

## 身份与边界

你是第二轮批次检查点 fresh-context 复核 worker，不是主控。**只读检查，不得修改任何代码、契约、测试、DevPlan 或工作区文件**；在最终答复中按 P0–P3 列出事实、证据与结论。卡住或证据不足也要明确写出，不能把猜测当结论。你未参与实施、不继承任何实施会话上下文，光读本 brief 与仓库文件即可完成复核。

## 复核范围（批次 2 全部 diff）

- `relay-core/store/store.mjs`（重写：openStore / 串行写队列 / 写前 schema 校验 / 身份链 / 终态守卫）
- `relay-core/store/state.mjs`（重写：applyEvents 可折叠回放）
- `relay-core/test/store.test.mjs`（新增 6 组反例，共 10 组 Store 测试）
- `docs/modules/dh-relay/as-built/relay-core.md`（§3 目录树 + 新增 §3.5）
- `workspace/DHR_29/{progress.md,findings.md}`（E-009/E-010 与三条 finding 的处理列）

## 背景（只读指针，按需查证）

- 任务目标与验收口径：`docs/modules/dh-relay/dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md` §4.1 DHR_29
- 施工步骤：`workspace/DHR_29/task_plan.md`；批次 1 复核结论：`review.md` 第一轮 fresh-context-cp1 行 + `findings.md` F-002/F-003/F-004
- 本批证据：`progress.md` E-009（21/21 红转绿）、E-010（契约四闸只读全绿，capability_hash=4adfe6dc… 与 E-006 一致）
- 冻结契约：`relay-core/contracts/relay.event.v2.schema.json`、`reason-codes.md`（本批声称零契约触碰）

## 必查问题

1. **openStore 重建**：receipt/checkpoint/result 工件回装后幂等与冲突判定是否真的跨重启成立；事件完整性校验（半行 / JSON 坏行 / seq 断档 / 外来 run_id / schema 违规）是否全部 fail-closed；打开时无条件重写 state.json 的自愈设计会不会把「快照被外部篡改」这类真问题静默抹掉（这是否可接受、要不要留痕）。
2. **写前 schema 校验**：被拒事件是否确实不落盘、不进内存账；`loadAjv` 模块级缓存的时机与失败行为；store 层耦合 ajv（已在 dependencies）是否有更坏后果。
3. **身份链与终态语义**：checkpoint 拒识 / result 隔离的分野是否符合 reason-codes.md 对 `E_IDENTITY_MISMATCH` 的 B11 定义；终态按 receipt 记账后，「同 receipt 改 outcome/payload 必拒」「不同 receipt（fresh attempt）放行且状态由 seq 后者胜出」是否自洽、有没有写出既非幂等也非冲突的第三态；checkpoint 幂等判定提到身份校验之前，会不会让一份冒用身份的 checkpoint 借「同 key 同 digest」白拿 idempotent。
4. **并发串行化**：promise 链队列是否覆盖全部变更入口（appendEvent/registerReceipt/appendCheckpoint/appendResult）；某次 job 抛错后队列是否继续可用；readState 不排队是否存在读到中间态的窗口及其后果。
5. **回放等价性**：`applyEvents` 快照折叠与全量回放在空增量尾、单节点多 attempt、`updated_at`/`elapsed_seconds` 回退等边界是否仍逐字节一致；切点矩阵测试是否足以钉住。
6. **测试有效性与空绿**：抽查 2–3 条新测试做「改坏必红」思想实验（如把队列去掉、把守卫条件反转），断言会不会跟着红；红相证据（导入失败 + 幂等次序错 2 例）在 progress 里登记是否与实际相符。
7. **范围漂移与红线**：diff 是否越进 `runtime/`、RPC、CLI 或冻结契约；脱敏路径是否仍覆盖 accepted 与隔离两条落盘路；密钥/凭据值有无进入任何工件。

## 输出格式

- 结论：`approved` 或 `changes-requested`。
- 每项 finding：`P级 | 路径:行 | 事实 | 为什么影响验收 | 可复现命令/证据`。
- 无 finding 时也列出实际执行的检查和未覆盖边界。
