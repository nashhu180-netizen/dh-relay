# RLT_29 · B-04 Evidence ID 前置缺口裁决

- 日期：2026-09-23；decider#1；batch=3；review_round=2；remediation_count=1。
- **RESOLVED：先由原 batch-3 coder 登记真实证据索引，再恢复原 builder 修订包。** 这是前置顺序和索引结构的自洽补齐，不改变目标、验收语义或代码范围；batch-3 仍未放行。
- 本棒 RELAY_RECEIPT 未命中，仅写本 decision 与对应 signal；不修改业务文件、不派 agent、不清会话。

## 问题与可核证依据

`BLOCKED.builder.batch-3-b04-contract.md` 明确 reason=r12_requires_registered_evidence_id_but_progress_write_forbidden。当前 progress.md 只有三条施工里程碑，没有 Evidence Ledger；batch-3 行仍为 BLOCKED。review.md 需求对齐表为空，旧下注还要求 monitor 登记 ID。builder 未越权写 progress，正确阻断，不能因其停下而换人或清 session。

只读核对本机实现：

- `/home/nash/work/dev-harness/tools/dh-check.mjs` R12（L274–285）要求非空需求表、可解析 `E-数字` 和满足/不满足/待人验结论；语义仍要求真实场景，不能靠凑行通过。
- 同文件 R8（L664–680）从 review 证据引用核对 progress 登记；空账本仅 warn 是实现容错，不是允许未登记 ID 的授权。
- `/home/nash/work/dev-harness/tools/dh-core.mjs` L1685–1742：唯一“证据账本 / Evidence Ledger”标题、唯一含 ID/编号与类型/type 列的表；严格 ID 为 `^E-\d{2,}$`。新账本采用严格结构，不利用 legacy fallback。

本裁决不修改上述解析器，不削弱 R8/R12，也不凭已有里程碑摘要宣称已亲自核查全部原证据。

## 一、progress 的唯一写者与精确写入边界

允许 **原 coder#b3 / r29-b3-coder，原物理实例及原会话** 执行一次 evidence-index-only 前置动作。既有原则仍为：仅当前顺序 batch coder 写施工证据索引，monitor 永远零写，builder/reviewer/orchestrator 都不能写 progress。

唯一业务写入是 `docs/modules/relay-light/workspace/RLT_29/progress.md` 的文件末尾新附录：

```markdown
## 证据账本（Evidence Ledger）

| ID | 类型 | command/scenario | result | path | 登记来源与范围 |
|---|---|---|---|---|---|
```

附录内可加一段说明：本次按本裁决由当前 coder#b3 补登记既有证据，原执行者/原采集时间与本次核对登记者/登记时间分开，账本只作证据索引、不作运行真相。命令列写可定位的原命令与 cwd，场景列写实际操作路径及限定覆盖面；result 写真实结果和限制，path 写原件精确 repo 相对路径，可带 SHA-256；不贴原始终端输出。

这是对原“一条里程碑/证据引用”格式的**限定附录补齐**，不是新增第二条 batch-3 里程碑，更不是赋予通用状态写入权。本裁决直接授权此前置索引动作，不能再要求 builder 先完成依赖该索引的修订而形成循环。现有写入合同头、三条里程碑、batch-3 BLOCKED 及其证据引用全部保留原字节；不能把 BLOCKED 改成已验证。附录必须只有一个合法标题和一张索引表，不能出现空占位行、重复 ID 或重复账本。

不得写 pane/agent 当前状态、排队/轮询/通知、运行快照、下一接收者、最终审批状态；不得把过去来源证据中的操作信息复制成“当前运行状态”。本动作不改 review/task_plan、代码、历史 evidence、已有 signals，也不执行新的演示以补造过去事实。

## 二、ID 闭集与来源

以下路径均相对 `docs/modules/relay-light/workspace/RLT_29/`。本次只准使用闭集 **E-301、E-302、E-303、E-304**，每个 ID 固定绑定下列来源；不是四个占位承诺。coder 必须逐件亲自只读核对后才写行，未核实项不登记、不引用。登记前确认工作区已有登记/引用无冲突；若冲突或来源缺失不擅自改号、换来源或扩范围，写 BLOCKED。

| ID | 类型 | 精确来源 | 可登记的有限事实 |
|---|---|---|---|
| E-301 | test | `evidence/batch-3/post/B-01.txt`、`evidence/batch-3/post/B-01.exit` | 原 install/结构测试的实际命令、退出与测试结果；是测试证据，不等于需求场景或本次重跑 |
| E-302 | diagnostic | `evidence/batch-3/post/B-04.txt`、`evidence/batch-3/post/comparison.json` | 原 B-04 失败与阻断事实；结果必须保留失败/未收敛，不写通过 |
| E-303 | scenario | `evidence/batch-3/model-allocation.md` | 仅其真实来源支持的模型分配询问/确认/实际配置核对场景；若缺链须如实写局部或不足，不外推全角色、后续实例或 H19 通过 |
| E-304 | review | `check.batch-2.md`、`DONE.batch-2.review.md` | 前批原 reviewer 已形成的独立核验及其覆盖场景；明确是 coder 本次核对原件后的引用登记，不冒称 coder 是原执行者，不凭文字结构检查推导真实端到端演示 |

这是允许登记的最大闭集，不要求为凑数全填。成功前至少有一条能供 R12 使用的真实需求场景索引：E-303 或 E-304 中可定位到实际发生操作和相应证据的有限场景；E-301 测试绿或 E-302 失败列表不能单独替代需求场景。若两个来源都不足以支撑任何真实场景，则 coder 写 BLOCKED，交 decider/用户决定补证，不伪造 ID 或满足结论。本 decider 未读取上述来源原件，来源内容与可用性由 coder 实核，不能把本 ID 表当已核验事实。

账本的 result 可如实表示局部满足、不满足、待人验；builder 在 review 中按相同覆盖范围写需求/人验项、操作路径、已登记 E-ID、原件路径和结论。H19 整体仍待人验。严禁用这些 ID 证明 E10 已展示、final/E2 已通过、batch-3 review 已 PASS、verify 已执行或用户已签字。

## 三、顺序、信号及同实例新 attempt

所有文件名均位于本 workspace。新文件必须新建且不可覆盖；若存在同名结果先停止核对，不重复覆盖或自动清轮次。所有 signal 遵守完整 task/phase/agent/batch/path/review_round/remediation_count/verdict/evidence schema。

1. **coder ledger 前置**：orchestrator 仅向原 coder#b3 原会话投递本有限动作（本棒不派单）。coder 核对并追加上述 ledger，读入 `locateEvidenceLedger`、`definedEvidenceIds` 或等价严格解析检查唯一结构、合法/不重复 ID、所有 path 存在及事实相符；可只读验证，不改解析器。完成只写新 `DONE.batch-3.coder.evidence-ledger.attempt-1.md`，phase=batch、agent=coder#b3、batch=3、path=na、review_round=1、remediation_count=0、verdict=READY，evidence 指向 progress.md 与本裁决。失败写 `BLOCKED.batch-3.coder.evidence-ledger.attempt-1.md`，同身份字段、verdict=BLOCKED、精确 reason。此 READY 仅表示索引就绪，不触发 batch reviewer 或 clear，不替代整批 coder READY。
2. **builder 原修订包 attempt-2**：先读 ledger READY 并自行核对 ID/原件，然后继续原 builder#2 / r29-builder 同物理实例、同会话；不是新 builder，不覆盖 `BLOCKED.builder.batch-3-b04-contract.md`。使用新 `DONE.builder.batch-3-b04-contract.attempt-2.md` 或 `BLOCKED.builder.batch-3-b04-contract.attempt-2.md`；phase=plan、agent=builder#2、batch=3、path=na、review_round=2、remediation_count=1，DONE verdict=READY。这里计数只表示本 B-04 修订包第二次执行，不能重置或扩展旧 plan/user-adjust 的已冻结上限。
3. builder 的业务路径仍只有原裁决限定的 review.md 与 task_plan.md。review 只能引用 ledger 中实际存在且核实的 ID；修掉 monitor 登记旧说法，改为当前 batch coder 登记、builder 只读引用。task_plan 可在原允许的修订包 §3/§4 说明以及 §1 progress 边界/§9 直接相关写者文字补明本次限定 ledger 附录、保留里程碑、此顺序与新 signal 文件名；§5.3 R30 oracle 仍严格按原裁决。builder 不写 progress 或 evidence，不把原 verdict 或轮次历史改掉；review 的 final/E2/人验区保护范围不变。
4. **原 plan-reviewer targeted**：在 builder attempt-2 READY 后，仍由原 plan-reviewer#2 / r29-plan-reviewer 核验；使用原裁决尚未生成的 `review.plan.batch-3-b04.md` 及 `DONE.plan-review.batch-3-b04.md` / `BLOCKED.plan-review.batch-3-b04.md`，不换实例不代签。除原 oracle/合同核验外，必须只读验证 ledger 解析唯一、ID/类型/路径闭合、真实来源与有限场景结论、里程碑历史未动、review 无未登记 ID、builder 未越权。需实际核对原件，不能仅信 coder READY。该 targeted 核验尚未执行，不把 builder attempt-2 误算为 reviewer 第二轮；仍按原合同登记其初次核验身份及计数。FAIL 按原裁决停回 decider，不自动加轮。reviewer 不补写 ledger。
5. **coder B04 rerun**：targeted durable PASS 后，恢复同一 coder#b3 原会话，执行原裁决的 B04/§6/diff-check 重跑，输出仍为新 `evidence/batch-3/post-b04-rerun-1/` 与 `DONE|BLOCKED.batch-3.coder.b04-rerun-1.md`；保留旧原件。comparison 必须明确本卡 R8/R12/R17 均无残留失败，且不能接受未登记 ID 的 R8 warning；原 R30 精确归一化守卫和所有 batch 门不变。新增 ledger 可能消除 R16 warning，按真实结果记账，不拿 warning 总数变化冒充新 failure，也不把任何 owned failure 归 inherited。
6. **batch reviewer**：仅整批 coder READY 后才由既有 batch-3 reviewer 对全部产物按原合同复核，写 check.batch-3.md 与独立 batch-review signal。索引 READY、builder READY、targeted PASS 均不能替代 batch PASS。后续 clear 仍只按既有 batch PASS + 工件齐全闸；本棒及前置索引动作均不得 clear。

## 四、裁决边界与停止点

本裁决优先补充原 decision 的“先修 builder”顺序，原 decision 文件与历史 BLOCKED 原样保留。progress 的写者没有扩大，仍不是运行真相；ledger 属当前 coder 的施工证据索引附录，不是 monitor 状态表或审批账本。builder 仍不写 progress，reviewer/orchestrator/monitor 永远不得借此补写。

若需要新的目标、范围、验收、数据语义、安全或生产影响决策，BLOCKED 交用户；证据不足、ID 冲突或解析失败时先写精确 BLOCKED，不为赶走 R8/R12 伪造事实。RESOLVED 仅代表合法顺序已补齐，不代表 ledger 已建立、builder 已修完、B04 已通过或最终验收成立。
