# RLT_29 batch-3 B-04 定向合同修订 plan-review

- reviewer：plan-reviewer#2（Codex session `01a0c8bd-87f7-77c3-95a0-661a72ff7137`，原 `r29-plan-reviewer`）
- phase/batch/review_round/remediation_count：`plan-review / 3 / 1 / 0`
- 日期：2026-09-23
- RELAY_RECEIPT preflight：未命中；未清除任何 `RELAY_*`。
- 结论：**PASS**。P0=0，P1=0，P2=0。本结论只放行原 coder#b3 执行 B-04 rerun，不等于整批 coder READY、batch-3 review PASS、workflow-final/E2/H19/verify 或用户确认。

## 1. 实际输入与写入边界

只读核验了：

- `AGENTS.md`；
- `decision.batch-3-b04.md`、`decision.batch-3-b04-evidence-id.md`；
- `DONE.batch-3.coder.evidence-ledger.attempt-1.md`、`DONE.builder.batch-3-b04-contract.attempt-2.md`；
- `brief.md`、`task_plan.md`、`progress.md`、`review.md`；
- E-301 原件：`evidence/batch-3/post/B-01.txt`、`B-01.exit`；
- E-302 原件：`evidence/batch-3/post/B-04.txt`、`comparison.json`；
- E-303 原件：`evidence/batch-3/model-allocation.md` 及其引用的 `evidence/batch-3/herdr/*` 原始捕获；
- E-304 原件：`check.batch-2.md`、`DONE.batch-2.review.md`；
- baseline/post B-04：`evidence/baseline/B-04.txt`、`B-04.exit`、`summary.json` 与上述 post 原件。

本棒除本报告与 `DONE.plan-review.batch-3-b04.md` 外未写业务文件，未修改被审文件、代码、progress 或 evidence，未派发/恢复任何 agent，未 clear 会话。

## 2. review.md 定向修订

1. 用脚本逐格比较 `brief.md` 与 `review.md` 的完成条件 2/5/7/9/11，五项均为逐字相等；条件 5 已是 monitor repo/workspace 完全只读、四类恢复权威、progress 仅当前 batch coder 写的现行口径。
2. `review.md` 未检出旧的“monitor 写/登记 progress”口径。需求表两行分别给出真实操作路径、可解析的 E-303/E-304、原件路径与明确的“局部满足”边界。
3. review 中出现的 Evidence ID 闭集恰为 E-303/E-304，均已在 progress 严格账本登记；没有未登记 ID。
4. workflow-final 五路仍全为 `pending`；Recipe 五项仍全部未勾选；E2 attempt 1 为 pending、attempt 2 为 not-dispatched；人验结果仍 `[ ]`；确认记录仍待 E10；verify SHA 仍待授权后实际执行。batch-3 review、E10、用户确认、H19 整体通过均未伪造。
5. 人类签名区明确要求 E10 查看完整链，缺 workflow-final/E2/E10 或用户明确确认即不通过；当前状态仍为施工中。

## 3. progress Evidence Ledger

1. `## 证据账本（Evidence Ledger）` 标题恰 1 个、表恰 1 张；严格 ID 恰为 E-301、E-302、E-303、E-304，无重复、无空占位；类型依次为 `test/diagnostic/scenario/review`。
2. 路径全部存在，登记 SHA-256 与原件实算完全一致：
   - E-301：`e5fb50b1f6dae3d6ca02b40af7aea213ac8644a1ac56137777aa13fa949f25c5`、`9a271f2a916b0b6ee6cecb2426f0b3206ef074578be55d9bc94f6f3fe3ab86aa`；
   - E-302：`50d91639ad52f82e5b9075124ca7887decde820f760aca6079dabdebbc409664`、`0167aadc91c61b86bc98bcec26db51318c43e7c82017e993ad05e0344ef2df2d`；
   - E-303：`b10e4b806afe0d4cc9146b35e8dff4fe135571c656ebdbca976644bd16e8e622`；
   - E-304：`9cdee4d4ed772fadcc0256a1f45f8ef445d3de3e8b7670916a14b45774a0e430`、`ae89bd3a6b6bcc8fec1f448e6ffba980113dfe539d1e9ee08e47244f2e36ab71`。
3. 有限事实与原件闭合：E-301 仅证明 19 tests/exit 0；E-302 如实登记 66 failures、36 warnings 与 BLOCKED；E-303 只覆盖已启动实例的模型分配/确认/Herdr 实态，不外推未启动的 workflow-final/E2/H19；E-304 只引用 batch-2 reviewer 的独立 PASS，不冒称 coder 为原执行者或 batch-3 已复核。
4. ledger 前的三条既有里程碑仍完整，batch-3 仍为 `BLOCKED`，ledger 从其后追加；当前前 20 行 SHA-256 为 `10a66a2e0308892bc709f1ee59bd0a80fdf9a0ab0a62578de53e626ea6c7836c`。正文不含 pane/agent 当前状态、轮询、通知、下一接收者或审批状态，且明确 progress 不是运行真相。
5. 以 ledger READY 到 builder attempt-2 READY 的 mtime 窗口检查全树，窗口内只有 `review.md`、`task_plan.md` 和 builder signal；没有 progress、evidence 或代码写入。sole-writer 未扩张。

## 4. task_plan 与 `rlt29-b04-r30-paths-v1`

定向修订只落在两份 decision 授权的位置：§1 的限定 ledger 附录边界、§3/§4 的 sole-writer/顺序/精确信号、§5.3 B-04 oracle，以及 §9 直接引用该 oracle 的 rerun 说明。原 batch 职责、signal 顺序、allowlist、模型闸、清理闸、其它测试/scope/open-P0P1/diff-check 门未削弱。

oracle 逐项成立：

- 从 `❌ 失败 N:` 区严格解析，声明数与实得数必须相等；使用 `Counter`/多重集，保留重复次数；
- 先按 subject/task 分 owned，解析不清或矛盾即阻断；post 的任何 RLT_29-owned 必须为 0；
- 唯一 RLT_27 R30 行必须逐字匹配固定 P/S，baseline/post 均恰 1 条；
- baseline L 必须是设计文档精确单路径；post L 必须非空、无重复、为 D 子集，且每项同时存在于稳定的 tracked-before/after、通过 §6 allowlist 与任务归属；
- 只有 L 可替换为固定 marker `<RLT29_APPROVED_DYNAMIC_PATHS>`，其余 inherited 正文逐字不变；canonical inherited Counter 必须等于 baseline 59；
- 新 rule/task、P/S 变化、未知路径、重复次数变化、owned 新增、解析数量不符均明确阻断。

## 5. 历史正例与只读内存反例

对 baseline/post 两份历史 B-04 原文实测：

- 两边均解析 `66/66`；各含 7 条 RLT_29-owned；
- raw Counter 恰 1 条删除 + 1 条新增，两条都是同一个 RLT_27 R30 诊断，唯一区别是 L；
- baseline L 为设计文档单路径；post L 为 D 中六路径；canonical 后 inherited Counter 完全相等，计数 59；
- 因历史 post 仍有 7 条 owned，该历史整体仍是 BLOCKED；归一化只消除了这一条 raw 路径漂移，没有把 owned 或其它差异放行。

以内存构造的干净 post 正例验证为 PASS（inherited=59、owned=0）。随后每个反例都从该干净正例独立注入，实际结果：

| 反例 | 实际结果 |
|---|---|
| 新 rule/task | BLOCK：canonical inherited Counter mismatch |
| P/S 字节变化 | BLOCK：P/S mismatch |
| L 增未知路径 | BLOCK：unknown path |
| 重复一条 inherited failure | BLOCK：canonical inherited Counter mismatch |
| 新增 RLT_29-owned | BLOCK：post owned=1 |
| 声明解析数量不符 | BLOCK：post parse-count mismatch |

## 6. 实跑命令与结果

cwd 均为 `/home/nash/work/dh-relay/.dh-worktrees/RLT_29`，且未把输出写入 evidence：

1. `dh relay-light`：exit 1；`59 失败, 35 警告`。定向筛查 `workspace/RLT_29.*R(8|12|17)` 无输出，说明当前 R8/R12/R17 无 RLT_29 残留；exit 1 由存量 inherited failures 解释，不被当作 PASS 本身。
2. B-04 前后各执行 `git -c core.quotepath=false diff --name-only 93d65cb --`：两次 SHA-256 均为 `b9a9195836cca9d36324962ed9b24d444aa96c17224d1a0318edc721e4ec78db`，列表稳定。post L 的六路径全部在该 tracked 列表中。
3. task_plan §6 allowlist 脚本原样只读运行：`allowed-path audit: PASS`，exit 0。
4. `git diff --check`：exit 0，无输出。

## 7. 顺序与最终判断

- ledger READY 只表示证据索引就绪；builder attempt-2 READY 只表示定向合同修订交审；两者都不等于整批 READY。
- 本 targeted PASS 的唯一下一步是 orchestrator 读取 durable signal 后恢复原 coder#b3，按合同生成不覆盖旧件的 `post-b04-rerun-1/**`。
- 只有后续整批 coder READY 才可交原 batch-3 reviewer；本报告不恢复 coder、不派 reviewer、不 clear 会话。

P0=0，P1=0，故 verdict=PASS。
