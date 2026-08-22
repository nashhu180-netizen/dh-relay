# DHR_29 教训复核 + 一致性复核 brief（五路之教训路 + 第 4 路一致性）

## 身份与边界

你是教训复核与一致性复核实例，fresh-context、未参与实施。只读，不得修改任何文件；只写事实与级别，不替主控做验收裁决。一个实例完成两路，报告分两部分。

## 第一部分：教训复核

1. 读 `workspace/DHR_29/lesson_candidates.md`（L-001：`dh wt new` 从滞后 origin/master 起树）。判断：该教训是否真实成立（对照 `findings.md` F-001 与 dev-harness 已知行为）、措辞是否可沉淀进教训库、有没有本卡新产生但漏记的教训候选（例如：会话内 subagent 复核的沙箱 FS 限制与 hub 子进程绕法、契约 md 与指纹的关系、快照=派生缓存的取舍）。
2. 查 `docs/modules/dh-relay/knowledge/教训库-候选.md` 是否有本卡应命中却未命中的既有教训（如 F-062 原型污染、F-056 正则判据、空绿形态）。

输出：`过` / `跳过（库空）` / 命中条目清单 + 新候选建议（P 级）。

## 第二部分：一致性复核（横向口径横扫）

逐行列出扫了哪些同类路径，禁空表。本次动的口径 vs 同类路径既有定义：

| 建议比对对象 | 同类路径 |
|---|---|
| checkpoint 拒识不留痕 vs result 隔离留痕的分野 | `reason-codes.md` §四、`compat-matrix.md` §4b、as-built §3.5、`store.mjs` 实现、v1 `tools/runner/relay-store.ps1` 行为 |
| 迟到判定挂 seq（K-2） | `store.mjs` currentReceipt/issued_seq、`state.mjs` seq 排序、`relay.event/v2` seq 语义、v1 `attempt_id` 整数序 |
| 脱敏口径 | v1 `tools/contracts/relay-redaction.ps1`、`store.mjs` redactStructured、宪章#6、as-built §3.5 |
| 终态按 receipt 记账 / lifecycle 守卫 | `store.mjs` appendCheckpoint/appendResult/emitEvent 三处守卫是否同一套身份定义 |
| 错误码形态（E_SCHEMA_INVALID / E_EVENT_LOG_CORRUPT / E_STORE_CORRUPT） | `reason-codes.md` 全集（内部异常 vs 协议码的边界是否讲清） |
| §4b 四值裁决理由 | `OPEN-POINTS.md`、`v1-gap-disposition.md` 有无同题异答 |

输出：逐行 `一致 / 不一致` + `裁决`（无需处置 / 有意差异→文档#锚点 / 遗漏待修）+ 派出证据留空由主控填。

报告全文作为最终答复返回，不写任何文件。
