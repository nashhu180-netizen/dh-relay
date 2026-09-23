# review.workflow-final.lesson.review-round-2 — RLT_29 workflow-final 教训路（整改后复审）

- 复核者：reviewer#lesson-r2（Devin SWE-2 Max，w41:tH/pH，实例 r29-wf-lesson-r2）；phase=workflow-final；path=lesson；review_round=2；remediation_count=1。
- 日期：2026-09-23。**fresh reviewer**，未参与 RLT_29 施工/规划/批次复核/decision，也不是 round-1 lesson reviewer（r29-wf-lesson-r1 为另一实例）。本文件与 `DONE.workflow-final.lesson.review-round-2.md` 是本棒唯二业务写入；未改 lesson_candidates.md、findings.md、代码或任何其它工件。

## 0. RELAY_RECEIPT preflight

- `RELAY_RECEIPT` 未设置（`env | grep '^RELAY_'` 无输出），未命中；走正常复核路径。未清除任何 `RELAY_*`。

## 1. 复核范围与输入

- 范围：核验 round-1 lesson 复核 FAIL 的 P1-01～P1-04 四条整改义务是否已在 `lesson_candidates.md` 落实为具体、有证据、repo-relative、无密钥的候选；P2 建议项是否明确标注且不冒充 P1；与库内既有 90 条候选无重复覆盖；候选不依赖运行日志细节、不含虚假完成声明。本轮不要求升格进 `docs/modules/dh-relay/knowledge/教训库-候选.md`（升格是单独的人裁决动作）。
- 只读核验输入：AGENTS.md；`brief.md`、`task_plan.md`、`review.md`、`execution_strategy.md`；`review.workflow-final.lesson.review-round-1.md` + `DONE.workflow-final.lesson.review-round-1.md`（FAIL，P1=4/P2=2）；`DONE.workflow-final.lesson.coder-remediation-1.md`（READY）；`lesson_candidates.md`（现 6 条：RLT29-L01～L06）；被引用的全部证据原件：`BLOCKED.batch-1.coder.md`、`decision.batch-1.quotepath.md`、`check.batch-1.md`（§3 项 8、项 7）、`evidence/baseline/B-06*.txt`、`summary-rerun-quotepath.json`、`review.plan.monitor-contract.md`（P1-01/P1-02 及两轮 targeted）、`task_plan.md` §0.1/§4/§5.3/§6、`BLOCKED.builder.batch-3-b04-contract.md`、`decision.batch-3-b04-evidence-id.md` §一/§二/§三、`BLOCKED.batch-3.coder.md`、`decision.batch-3-b04.md` §三、`review.plan.batch-3-b04.md`、`check.batch-3.md`（项 4/5、P2-3）、`tools/relay-light/skill/SKILL.md`「monitor 节拍与安全 Enter」、`adapter-claude-code.md`/`adapter-codex.md` 同节、`decision.plan-round-3.md`、`review.plan.md` post-decision 节；`docs/modules/dh-relay/knowledge/教训库-候选.md` 全 90 条候选去重核对（重点：候选-10/30/62/82 及 quotepath 关键字检索）。

## 2. 判据

沿用 round-1 判据：①实发现场而非预判；②可迁移规则写成「下次怎么做」的持久防再发规则；③库内无同触发场景覆盖；④抽象一层仍成立，非运行日志复述；⑤不含凭据/密钥值。整改义务 = 四条 P1 全部登记为候选；P2 仅建议登记、须明确标注级别。

## 3. 逐项处置（L01～L06）

| ID | 对应 round-1 finding | 严重度 | 证据核验 | 判定 |
|---|---|---|---|---|
| RLT29-L01 | P1-01 quotepath | P1（必修） | `BLOCKED.batch-1.coder.md` reason=`allowed_path_audit_quotepath_env` 实测一致；`decision.batch-1.quotepath.md` 载命令级 `-c core.quotepath=false` 裁决；`task_plan.md` §6 L215-216 现行命令确已固定该参数；`check.batch-1.md` 项 8/裁决链与 `evidence/baseline/B-06*.txt`、`summary-rerun-quotepath.json` 均在且为独立新证据（原 FAIL 未覆盖）。规则含「不放宽 allowlist、verbatim 重跑取证」的安全取向，是持久防再发规则而非摘要 | **满足** |
| RLT29-L02 | P1-02 受限角色×全局规则 | P1（必修） | `review.plan.monitor-contract.md` 逐字记载两连发：P1-01（通用 RELAY_RECEIPT 写 BLOCKED 义务 vs monitor 零写入现役矛盾）与 P1-02（task_plan L247 残留 monitor fan-out），两轮 targeted 后方 PASS；现行 `task_plan.md` §0.1 L28 已按角色分流落字（monitor 命中时 repo 零写、仅 Herdr prompt）。规则「每条全局义务按角色分流 + 整改后全库扫残留」为可迁移设计纪律 | **满足** |
| RLT29-L03 | P1-03 sole-writer 死锁 | P1（必修） | `BLOCKED.builder.batch-3-b04-contract.md` reason=`r12_requires_registered_evidence_id_but_progress_write_forbidden` 实测一致；`decision.batch-3-b04-evidence-id.md` §一限定附录边界、§二 ID 闭集（E-301～E-304）、§三顺序裁决均与候选描述吻合；规则「先画登记→引用依赖链、限定附录+顺序裁决、禁止伪造 ID」为持久规则 | **满足** |
| RLT29-L04 | P1-04 动态诊断归一化 oracle | P1（必修） | `BLOCKED.batch-3.coder.md` 存在；`decision.batch-3-b04.md` §三 oracle `rlt29-b04-r30-paths-v1` 含候选所列全部守卫（严格解析计数、owned 清零、P/S 逐字锚、D 闭集⊆授权、canonical Counter、其余阻断）；`check.batch-3.md` 项 5 载独立复算 + 10/10 内存反例注入全阻断；`task_plan.md` §5.3 现行 oracle 在案。与候选-62 互引关系属实（62=比集合不比数，本条=条目内动态字段归一化+fail-closed 授权），非重复 | **满足** |
| RLT29-L05 | P2-01 安全 Enter | P2（建议） | 表格与 §级别说明均明确标注「P2 建议，非本次 P1」，未冒充 P1 阻断项；`SKILL.md` L279-282「monitor 节拍与安全 Enter」三条件原文在案，双 adapter 同节均含 queued/`state_change_seq` 判据；与候选-82「回显≠已提交」同族而新增面（queued 态检测、seq 未推进、Enter 被吞成换行）属实 | **满足（建议项，不卡 PASS）** |
| RLT29-L06 | P2-02 冻结式例外 | P2（建议） | 同样明确标注 P2；`decision.plan-round-3.md` 载「精确文件名+全部旧字段+SHA-256」三重匹配、不回写/不改结论/不可类推；round-2 SHA-256 `9f6cf3a3…ed62f` 与 `check.batch-1.md` 项 7 实测值逐字一致；`check.batch-3.md` P2-3 user-adjust 轮次备查在案；与候选-10（append+superseded）相邻而不同面属实 | **满足（建议项，不卡 PASS）** |

## 4. 横向检查

- **去重**：库内 90 条候选逐一核对——quotepath/非 ASCII/八进制关键字零命中（L01 无覆盖）；候选-30 为 symlink/realpath 逃逸（真实落点 vs 本条显示编码，不同面）；L02/L03 无同族覆盖；L04/L05/L06 的互引声明均与库内原文一致。无重复登记。
- **证据质量**：全部引用为 repo-relative 路径且实测存在；无 pane/mtime/SHA 值充当教训本体（运行细节仅作证据定位）；候选均为「现象+可迁移规则」结构，非日志复述。
- **无虚假完成声明**：六条状态均为「待升格」，未宣称已入库/已验收/已 PASS 其它路径；文件头注明升格是单独人裁决动作。
- **密钥红线**：候选文件及所引证据无凭据值（secret 模式扫描零命中）。
- **残留检查**：round-1 的 F/H/I/J/K 五条「不登记」判定与候选库无冲突，本轮未发现应登记而未登记的新缺口；整改未引入新 P0/P1。

## 5. 结论

**PASS** — P0=0、P1=0（整改义务全部闭合）、P2=0 新增（L05/L06 为已标注建议项）。四条 P1 漏登记项已落实为具体、有实发证据链、repo-relative、无密钥、含持久防再发规则的候选；P2 建议项标注清晰；与库内 90 条候选无重复。本 PASS 仅代表 lesson 路 workflow-final round-2 复审通过，不代表其余四路、E2、人验、verify、PR/Issue 或收口结论；升格进教训库是单独的人裁决动作。
