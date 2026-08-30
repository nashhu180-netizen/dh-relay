<!-- dh:v1 -->
# DHR_64 · Findings

## F-064-001 · 既有 DHR_33/DHR_34 测试仍断言旧结果语义（非 DHR_64 阻塞）

- **现象**：`herdr-adapter.test.mjs` 与 `identity-quota.test.mjs` 合计 27 条，当前为 15 pass / 12 fail。失败项断言 DHR_33 的 pane/judge/capture、host-loss 或 stop 自动写 Result，以及 DHR_34 的 quota/fallback 自动开新 Attempt；这些行为已被 design/12 的 Receipt-bound 唯一提交路径取代。
- **证据**：`node --test relay-core/test/herdr-adapter.test.mjs relay-core/test/identity-quota.test.mjs` 终态 `tests 27 / pass 15 / fail 12`；DHR64 定向合同/Store/driver/service/CLI 测试独立终态 `7 pass / 0 fail`。
- **判定**：这是旧测试与 DHR64 冻结契约的已知兼容性差异，不是本卡 submission bridge 的失败；不恢复旧 judge/capture/quota/fallback Result 路径，不修改 DHR33/DHR34 测试或生产边界。
- **后续**：由主控在 DHR64 验收/后续独立卡中决定旧测试迁移；本卡仅保留事实记录。

## F-064-002 · 代码轮 1 的 Receipt bridge P1 整改与残余闭合

- **现象**：独立代码轮 1 在候选 `20df8a1` 发现 P1-1~P1-6：`attempt-retry.mjs` 越过本卡精确路径；Store lease 只在 job 入队时校验；早到 submission 不结束工作态 driver；service 启动部分恢复可能残留 actor/lease；终态 duplicate 快路未复用 event-log 完整性校验；Store 可从伪 Receipt 写 Result。
- **证据**：`review-code1-codex.md`；E-6401。
- **处理**：已撤回越界路径；Store 在 commit 前复验 guard，并在 bridge/result-ledger 只校验剥离内部 `issued_seq` 的完整 Attempt Receipt；driver 在每次 Herdr 观测前检查已提交结果；service 读取事件改复用 `readEventLog`，先校验全部恢复 gate、catch 清理 live worker/actor。
- **首轮复验**：Herdr fresh reviewer 的 `review-code1-reverify.md`（E-6405）确认 P1-1/2/3/5 关闭，但保留 P1-4：多 Run 预检并不验证完整 Receipt，较后 Run 的失败可能发生在较前 Run 已取得 lease 后；保留 P1-6：重启 terminal duplicate 未验证持久化 Attempt Receipt。
- **残余处理**：`service.mjs` 在任一 actor/lease 创建前，逐个解析并校验完整 Attempt Receipt（仅剥离内部 `issued_seq`）；不可读/伪造 Receipt 与不自洽 terminal Result 均固定失败为 `E_STORE_MUTATION_RECOVERY_FAILED`。新增“后续伪 Receipt 使启动失败而前序 Run 不得 `lease_acquired`”和“伪持久化 Receipt 的 terminal duplicate restart 拒绝”两例。
- **最终独立复验**：新的 Herdr reviewer `review-code1-final.md`（E-6408）实际运行 10/10 定向测试，并以 P0=0/P1=0 给出 PASS；P1-4/P1-6 已关闭。此 finding 仅记录整改链，后续仍须完成 frozen heavy Recipe 的代码轮 2、需求、教训、一致性复核及全量回归终态。

任何无法由冻结契约证明的 schema、恢复或原因码变化必须另行登记并停止，不能猜测或转嫁给 DHR_35。

## F-064-003 · v2 CLI 断连 waiter 与需求机器证矩阵

- **现象**：教训复核发现 `connectCliV2()` 在 socket close/error 时仅标记 closed，未结束 in-flight Receipt submission waiter；需求方向同时指出 DHR64 的拒绝矩阵等机器证尚不完整。
- **处理**：close/error 统一清 timer、删除 waiter并以 `E_TRANSPORT_CLOSED` reject；E-6412 对该收尾取得 1/1 终态。
- **状态**：断连 waiter 修复待 fresh 教训/一致性复验；拒绝矩阵 P1 仍开放，不得据此关闭需求方向或进入收口/verify。
