# review.workflow-final.lesson.review-round-1 — RLT_29 workflow-final 教训路

- 复核者：reviewer#lesson-r1（Devin SWE-2 Max，w41:tG/pG，实例 r29-wf-lesson-r1）；phase=workflow-final；path=lesson；review_round=1；remediation_count=0。
- 日期：2026-09-23。fresh reviewer，未参与 RLT_29 施工/规划/批次复核/decision。本文件与 `DONE.workflow-final.lesson.review-round-1.md` 是本棒唯二业务写入；未改 lesson_candidates.md、findings.md、代码或任何其它工件。

## 0. RELAY_RECEIPT preflight

- `RELAY_RECEIPT` 未设置（`env | grep '^RELAY_'` 无输出），未命中；走正常复核路径。未清除任何 `RELAY_*`。

## 1. 输入

只读核验：brief.md、task_plan.md、lesson_candidates.md（空表）、findings.md（空表）、check.batch-1/2/3.md、review.plan.md（初审 + 两轮 targeted + post-decision）、review.plan.monitor-contract.md（user-adjust 三轮）、review.plan.batch-3-b04.md、decision.plan-round-3.md、decision.batch-1.quotepath.md、decision.batch-3-b04.md、decision.batch-3-b04-evidence-id.md、review.workflow-final.code-round1.review-round-1.md、progress.md（含 Evidence Ledger）、review.md、execution_strategy.md、全部 DONE/BLOCKED signal、`docs/modules/dh-relay/knowledge/教训库-候选.md` 全 90 条候选（逐条对照触发场景去重）、RLT_12/RLT_21 等工作区 lesson_candidates 参照、完整 diff（`git -c core.quotepath=false diff 93d65cb`，tracked 7 件 +462/-26 + untracked 清单）。

## 2. 判据

教训候选的可登记判据（沿用 RLT_24/RLT_12 范式与库内字段）：①有实发现场（非预判）；②可迁移规则能写成「下次怎么做」；③库内 90 条候选无同触发场景覆盖（撞车则只作佐证）；④不是运行日志细节复述——须是抽象一层后仍成立的陷阱/纪律；⑤不含凭据/密钥值。

## 3. 逐项判定（派单点名六主题 + 复核中另识别项）

| # | 主题 | 实发现场 | 判定 | 依据 |
|---|---|---|---|---|
| A | 中文路径 Git quotepath 假阻断 | 实发：§6 allowed-path audit 对 `git diff`/`ls-files` 原文比对，`core.quotepath` 默认把非 ASCII 路径渲染成带引号八进制转义 → 3 条 allowlist 内中文路径误报越界 → `BLOCKED.batch-1.coder.md`（reason=allowed_path_audit_quotepath_env）→ decision.batch-1.quotepath.md RESOLVED → verbatim 重跑 PASS | **应登记（P1-01）**。本仓中文文件名普遍存在，凡按行比对 git 路径输出与路径清单的脚本必复发；解法（命令级 `-c core.quotepath=false`、不动全局配置、不放宽 allowlist、保留原 FAIL/diagnostic 历史、修订命令 verbatim 重跑）非显而易见且含正确的安全取向。库内无覆盖（grep 无 quotepath；候选-30 是 symlink/realpath 逃逸，不同面） | check.batch-1.md §3项8；decision.batch-1.quotepath.md；evidence/baseline/B-06*.txt |
| B | Devin queued / 输入框排队的安全 Enter | 合同规则：三条件同时成立（文本仍停输入框含 queued 未发出 + `state_change_seq` 未推进 + 非审批 UI）才发一次并复验，失败通知 orchestrator 换 fresh、禁连按；codex 侧 Enter 可被吞成换行 | **建议登记（P2-01）**。机制真实且复用面在 Herdr 终端派活族内高；与库候选-82（「回显≠已提交」+ 有界 Enter 回退）同族但有新增面：输入框 queued 态检测、`state_change_seq` 未推进判据、Enter 被吞成换行的平台差异。可作候选-82 增补或独立候选，由裁决定 | SKILL.md「monitor 节拍与安全 Enter」；两 adapter 同节；check.batch-2.md 项5 |
| C | monitor 零文档写/只通知 × 全局 RELAY_RECEIPT 义务 | 实发两次：P1-01「每个 worker 命中 receipt 写 BLOCKED」与「monitor repo 零写入」现役文本直接矛盾（FAIL）；整改后 P1-02 又逮到 task_plan L247 残留「monitor fan-out workflow-final」（FAIL）；第三轮方 PASS | **应登记（P1-02）**。设计陷阱：全局 fail-closed/义务规则叠到受限写面角色上必然自撞；同一合同在本卡连发两例证明这是系统性强项而非笔误。可迁移规则：每条全局规则必须按角色分流落字，只读角色的 fail-closed 出口只能是其既有允许通道（Herdr prompt）；整改后须全库扫「该角色被多赋动作」残留。库内无覆盖 | review.plan.monitor-contract.md P1-01/P1-02 及三轮 targeted |
| D | B-04 动态诊断归一化 | 实发：baseline↔post 失败清单逐字比对被 RLT_27 R30 行内的动态路径清单 L 漂移干扰（恰 1 删 1 增同 rule）；`BLOCKED.batch-3.coder.md` → decision.batch-3-b04.md 立 `rlt29-b04-r30-paths-v1` oracle → targeted PASS → rerun | **应登记（P1-04）**。验收陷阱：R30 类诊断把「本卡实际改动路径」嵌进失败正文，**每张卡**做 baseline/post 比对都会命中同型漂移——确定性复发。可迁移面：失败条目含动态字段时先显式修比较 oracle（严格解析计数、owned 先分离且必须清零、P/S 逐字锚定、动态段闭集 ⊆ D 且过 allowlist、canonical Counter 多重集比对、其余一律阻断），并由 builder 修 oracle + 独立 reviewer 反例核验后 coder 才重跑——coder 不得私下换规则。与候选-62（比集合不比数、先量再改）相邻但新增「条目内动态字段归一化 + fail-closed 授权边界」一层，不重复 | decision.batch-3-b04.md §三；review.plan.batch-3-b04.md §4-5；check.batch-3.md 项5 |
| E | R8/R12 Evidence Ledger 写者循环 | 实发死锁：R12 要求 review.md 需求表引用已登记 E-ID；账本在 progress.md，sole writer=当前 batch coder；builder 禁写 progress → `BLOCKED.builder.batch-3-b04-contract.md`（reason=r12_requires_registered_evidence_id_but_progress_write_forbidden）→ decision.batch-3-b04-evidence-id.md 裁「coder 先补登记限定附录 → builder 再引用」 | **应登记（P1-03）**。设计陷阱：两条各自正确的 sole-writer 边界组合成死锁（A 的产物依赖 B 先登记、B 又不能写 A 的文件）。可迁移规则：写者矩阵设计必须画出「登记→引用」依赖链并显式给顺序与限定通道；解法是限定用途附录+顺序裁决，不是放开写者权、更不能让引用方伪造 ID 凑行。库内无覆盖 | decision.batch-3-b04-evidence-id.md；review.plan.batch-3-b04.md §3 |
| F | batch PASS 后 clear 顺序 | 用户追加规则，执行无事故；execution_strategy 记录 b1/b2/b3 均 confirmed-observed-cleared | **不判为必修教训**。该规则是用户明文追加的合同条款，不是从失败/事故中学到的坑；规则已由 task_plan §1.1 + SKILL「batch PASS 后会话清理闸」完整承载，「clear 销毁上下文/整改计数故须 PASS+齐全+单次+复验」的说理已随规则落档。登记价值低；若裁决认为「会话销毁类操作的排序纪律」值得成条，可并入 B/C 族一并写 | decision.batch-1.quotepath.md 用户追加裁决；execution_strategy.md；check.batch-2.md §1.1 前置链 |
| G | schema 演进 × 不可覆盖 durable 工件 | 实发：新 signal schema 「自 round 2 起」生效，但不可覆盖的 `DONE.plan-review.round-2.md` 缺 batch/path → plan round-3 仍 FAIL → decider 裁历史例外（精确文件名+全部旧字段+SHA-256 三重匹配、不可类推） | **建议登记（P2-02）**。行为流程：任何 durable signal/合同格式演进都会撞上「已落盘工件不满足新 schema」；冻结式例外登记法（不回写、不改结论、三重匹配、不类推）是可复用处置模板。与候选-10（append+superseded）相邻但面向 signal schema 兼容判定，不重复 | decision.plan-round-3.md；review.plan.md post-decision 节 |
| H | design/01 §7.5.5 陈旧 5 值 phase 枚举 | 三批 check 与代码轮1均登记为 P2 | **不另立教训**：属文档陈旧示例漂移，已有 P2 通道处理且结构测试已钉死（`test_phase_closed_set_is_nine_phases_not_legacy_five`）；与库内「文档传导/口径对齐」族（候选-14/42/66）同族，无新增机制 | check.batch-1/2/3 P2-1；code-round1 P2-1 |
| I | evidence/13 §二.6 保留被 supersede 旧文无回链 | 代码轮1 P2-6 已登记 | 候选-10（append+superseded）已覆盖，不重复 | code-round1 P2-6 |
| J | presence-based 断言挡不住追加型违反 | 代码轮1 P2-4 已登记为测试局限 | 与候选-37/46（断言咬合/判别力）同族，已在复核工件留痕，不构成独立新教训缺口 | code-round1 §2.3/P2-4 |
| K | user-adjust 轮次 `review_round=user-adjust[-N]` 非数字 | 已裁决历史（P2-3 沿用登记） | 并入 G 的「schema 生效边界与历史例外」一条，不单列 | check.batch-3 P2-3；decision.plan-round-3.md |

## 4. findings

lesson_candidates.md 空表**不构成可核 N/A**：A/C/D/E 四条均有实发 BLOCKED/FAIL 链佐证的高复用教训，属「应沉淀但未登记」。按派单口径本路判 **FAIL**。

### P1

- **P1-01 — 漏登记：Git 非 ASCII 路径的 quotepath 显示编码 ≠ 路径身份（工具链陷阱）**。现象：按行比对 `git diff`/`ls-files` 输出与路径清单时，`core.quotepath` 默认把非 ASCII 路径渲染成 `"…\345…"` 转义串，allowlist 内合法路径被误报越界，本卡实测造成一次假 BLOCK。建议落点：`lesson_candidates.md` 追加候选——现象=上；可迁移规则=凡以 git 路径输出做清单比对/审计，命令级固定 `-c core.quotepath=false`（不改全局配置）；裁决取向=修路径表示、绝不放宽 allowlist 或豁免真实越界，原 FAIL 与诊断留痕不覆盖，修订命令 verbatim 重跑取证。升格去向：`docs/modules/dh-relay/knowledge/教训库-候选.md`（建议分类：工具链陷阱）。
- **P1-02 — 漏登记：全局 fail-closed/义务规则叠到受限写面角色必然自撞，须按角色分流且整改后扫残留（设计陷阱）**。现象：通用「每个 worker 命中 RELAY_RECEIPT 写 BLOCKED」与「monitor repo 零写入」同文件并存成现役矛盾（P1-01 FAIL）；修后仍残留「monitor fan-out workflow-final」（P1-02 FAIL），两轮才清。建议落点：候选条——规则=给零写入/受限角色设计时，每条全局义务规则必须显式按角色分流；只读角色的 fail-closed 出口只能是其既有允许通道（非 durable Herdr prompt），不得分配任何 repo 写入；修订后须全文扫描「该角色被多赋动作」的残留表述（本卡 L247 即漏网）。升格去向同上（建议分类：设计陷阱）。
- **P1-03 — 漏登记：sole-writer 边界两两正确也会组合成「登记→引用」死锁（设计陷阱/行为流程）**。现象：R12 要求 review 引用已登记 E-ID、E-ID 账本 sole-writer 是 batch coder、builder 禁写 progress——三方各自守规仍死锁，需 decider 裁顺序。建议落点：候选条——规则=写者矩阵设计时先画「谁登记、谁引用」依赖链并显式定顺序与限定通道；解法是给限定用途附录（保留既有字节）+ 顺序裁决，不是放开写者权或让引用方写占位 ID 骗过检查。升格去向同上（建议分类：设计陷阱）。
- **P1-04 — 漏登记：诊断失败清单含动态字段时必须先修比较 oracle 再比对，归一化授权闭集化且 fail-closed（验收陷阱）**。现象：R30 类诊断把本卡改动路径嵌进失败正文，baseline/post 逐字比对确定性漂移；本卡靠显式归一化算法（严格解析计数、owned 先分离须为 0、P/S 逐字锚、动态段闭集 ⊆ D、canonical Counter 比对、其余全阻断）收敛。建议落点：候选条——规则=凡对含动态字段的诊断输出做 baseline gating，先由合同层显式修比较 oracle 并经独立核验（含注入反例），coder 不得私下换比较规则；归一化只替换被闭集授权的动态段，任何新 rule/task/owned/未知路径/计数不符继续阻断。与候选-62 互引（62=比集合不比数，本条=条目内动态字段归一化）。升格去向同上（建议分类：验收陷阱）。

### P2

- **P2-01 — 建议登记：交互终端「输入框 queued 未发出」的安全 Enter 三条件单次复验**。与库候选-82「回显≠已提交」同族但新增面：Devin/Codex TUI 的派单文本可停在输入框排队态、Enter 可被吞成换行；规则=三条件同真（文本仍在框 + `state_change_seq` 未推进 + 非审批 UI）→ 单次发送 → 复验 → 失败通知并换 fresh、禁连按。可作候选-82 增补注记或独立候选，由裁决定。
- **P2-02 — 建议登记：durable signal/合同 schema 演进遇不可覆盖历史工件时的「冻结式例外」处置**。规则=新 schema 生效边界写死起始轮次；已落盘且不可覆盖的旧工件以「精确文件名+全部旧字段+SHA-256」三重匹配登记为唯一历史例外，不回写、不改结论、不可类推；未来工件强制新 schema。

## 5. 不构成本次缺口的事项

- 上述 F/H/I/J/K 五项逐条给出「不登记」理由，证明 lessons-absent 主张不成立也不需靠凑条目豁免。
- 密钥红线：本次复核未在任何工件/diff 中发现凭据值；本报告不含任何密钥。
- 运行日志细节（mtime 序列、tab/pane 编号、具体 SHA 值等）仅作证据引用，不作为教训本体。

## 6. 结论

**FAIL** — P0=0、P1=4、P2=2。本任务确有高复用教训未登记：P1-01 quotepath、P1-02 受限角色×全局规则、P1-03 sole-writer 死锁、P1-04 动态诊断归一化 oracle；另有 P2-01/P2-02 两条建议登记。整改路径：由获授权角色按 §4 建议落点在 `lesson_candidates.md` 追加候选（本 reviewer 依边界不改候选库）；升格进 `docs/modules/dh-relay/knowledge/教训库-候选.md` 是单独的人裁决动作。本 FAIL 仅针对 lesson 路，不代表其余四路、E2、人验或收口结论。
