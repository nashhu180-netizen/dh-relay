<!-- dh:v1 -->
# task_plan — DHR_29

## 要读的上下文 (Context Packet) ★前置

| ID | 来源 (path / url) | 为什么 |
|----|------------------|--------|
| C-001 | `docs/modules/dh-relay/dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md#dhr_29` | 唯一目标、验收、范围与 K-1 裁决。 |
| C-002 | `relay-core/README.md`、`docs/modules/dh-relay/as-built/relay-core.md` | 代码根、目录归属、冻结契约与 DHR_51/52 边界。 |
| C-003 | `relay-core/contracts/{OPEN-POINTS.md,compat-matrix.md,v1-gap-disposition.md,CANONICALIZATION.md,reason-codes.md}` | K-1/K-2/K-3、v1 Oracle、基线重生成与 reason-code 纪律。 |
| C-004 | `relay-core/contracts/{relay.event.v2.schema.json,relay.run.v2.schema.json,relay.run-state.v1.schema.json}` | Store 可消费的唯一 v2 契约，含 event `seq` 和状态聚合语义。 |
| C-005 | `tools/{runner/relay-store.ps1,runner/relay-replay.ps1,contracts/relay-redaction.ps1,contracts/relay-identity.ps1}` | v1 行为 Oracle；只读，不迁移文件或实现。 |
| C-006 | `relay-core/{tools/validate.mjs,tools/audit-contracts.mjs,tools/fixture-manifest.mjs,tools/capability-baseline.mjs,test/contracts.test.mjs}` | 现有 schema/基线闸；扩展测试不得把 Store 接入客户端或 Runtime。 |

## 施工步骤 (Steps)

| # | 改动文件（Create/Modify/Test + 路径:行） | 怎么改（代码片 / 签名） | 怎么验（命令 → 预期输出） |
|---|------------------------------------------|----------------------|--------------------------|
| 1 | Test · `relay-core/test/store.test.mjs`（Create）；Modify · `relay-core/package.json`、`test/contracts.test.mjs` | 先用 Node `node:test` 建临时 run root；写 red tests 钉 `createStore/openStore/appendCheckpoint/appendResult/replayRun` API 的不可变工件、JSONL 只追加、相同 checkpoint/result 幂等、冲突终态/receipt 不符隔离、事件重放签名。`package.json` 的 test 脚本纳入该文件并断言至少两套 test 文件。 | `npm test` → Store 模块缺失而红；记录 E-003。 |
| 2 | Create · `relay-core/store/store.mjs`、`relay-core/store/state.mjs` | 最小纯库实现：使用 `fs` 仅操作传入 run root；`run.json` 与 receipt 工件 create-new 不改写；`events.jsonl` 以生成的连续 `seq` 追加；`state.json` 用临时文件+rename 原子替换。`replayRun(events, run)` 是无 I/O 的确定函数，输出 canonical `state_signature`。 | `npm test -- --test-name-pattern="Store"` → 基础创建/回放转绿。 |
| 3 | Modify · `relay-core/store/{store,state}.mjs`；Test · `relay-core/test/store.test.mjs` | 实现 checkpoint/result ingest：以 `(receipt_id, checkpoint_id, payload_digest)` 判幂等与 `E_CHECKPOINT_CONFLICT`；result 的当前 receipt、已定终态、`seq` 先后关系决定 accepted 或 `late_result_quarantined`，不污染终态。以 v1 P1 fixture 的身份链等价用例做独立回归。 | 定向测试 → 幂等、冲突、隔离、`seq` 逆序 attempt-id 反例均绿；先跑红、后跑绿各落账。 |
| 4 | Modify · `relay-core/store/state.mjs`；Test · `relay-core/test/store.test.mjs` | 由 `relay.run/v2` 节点全集产生 `node_states`，执行 `done <= total`、labels UTF-16 排序/唯一性与 `structured` 按 v1 redaction Oracle 脱敏。`waiting_human` 采用新 `human_input_requested` 事件产生，事件回放将目标节点投影该状态；不可用自由 phase 或内存标志绕过事件账。 | 定向测试 → 四项约束各一反例，N 次重放、快照+增量与全量签名逐字节相等。 |
| 5 | Modify · `relay-core/contracts/_shared/relay.common.v1.schema.json`、七份契约及 `v0-shapes/`；Modify · `reason-codes.md`、`compat-matrix.md`、`v1-gap-disposition.md`；Test/fixture · `fixtures/**`、`test/contracts.test.mjs` | **仅一次批量**：共享 `$defs/identifier`，所有 `*_id` 属性引用它；以 audit 节点遍历阻止内联 identity/locator pattern；为 K-1 增 `human_input_requested` event kind 和结构约束；四个无对应 v1 event 逐项裁决；合并 F-042 meta-schema 规则；更正 DHR 卡号和 done<=total 归属。所有 schema 描述/注释的指纹改动在本步一次完成。 | 先对新增 event/结构规则加 golden/negative fixture 并跑红；同批跑 `node tools/fixture-manifest.mjs --write`、`node tools/capability-baseline.mjs --write`、`node tools/audit-contracts.mjs --write-tokens`，随后 `npm test`、`validate --selftest`、`audit-contracts` 全绿。 |
| 6 | Modify · `docs/modules/dh-relay/as-built/relay-core.md`、`workspace/DHR_29/{progress,visual_map,findings,review,lesson_candidates}.md` | 按实际 diff 记录 API、文件布局、回放/快照语义与 DHR_51/52 边界；不回写 task_plan。每批完成先跑检查、派 fresh 小审；施工完自动进入 E0–E10。 | `git diff --check`、`dh dh-relay` 与全部 Relay Core 闸；证据逐条写 progress/review。 |

## 关键决策（一句话各一行）

- Worktree：是，分支 = `wt/DHR_29`，目录 = `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\DHR_29`；已 rebase `master@c44d392`。
- K-1：本批新增 `human_input_requested` 事件产生者，Store 只能经该事件投影 `waiting_human`；不冻结 P7 Attention 对象。
- 派子 agent：仅自动收口所需 fresh 只读复核；施工保持主会话。
- Review：存量无 `task_type` 字段，按标准档走两轮独立代码复核，另做需求、教训与一致性复核。
