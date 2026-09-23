<!-- lesson_candidates.md — RLT_29 教训候选。 -->
# lesson_candidates — RLT_29

## 教训候选

| ID | 一句话教训 | 状态 |
|---|---|---|
| RLT29-L01 | Git 非 ASCII 路径的 quotepath 显示编码 ≠ 路径身份：凡以 git 路径输出做清单比对/审计，命令级固定 `-c core.quotepath=false`，不改全局、不放宽 allowlist，保留原 FAIL 并以修订命令 verbatim 重跑取证 | 待升格 |
| RLT29-L02 | 全局 fail-closed/义务规则叠到受限写面角色必然自撞：每条全局规则必须按角色分流落字，只读角色的 fail-closed 出口只能是其既有允许通道（非 durable Herdr prompt），整改后须全文扫「该角色被多赋动作」残留 | 待升格 |
| RLT29-L03 | sole-writer 边界两两正确也会组合成「登记→引用」死锁：写者矩阵设计先画「谁登记、谁引用」依赖链并显式定顺序与限定通道；解法是限定附录+顺序裁决，不是放开写者权或伪造 ID | 待升格 |
| RLT29-L04 | 诊断失败清单含动态字段时必须先修比较 oracle 再比对：归一化授权闭集化且 fail-closed，owned 先分离且必须清零，独立反例核验后 coder 才重跑，coder 不得私下换比较规则 | 待升格 |
| RLT29-L05 | （P2 建议，非本次 P1）交互终端「输入框 queued 未发出」的安全 Enter：三条件同真（文本仍在框 + `state_change_seq` 未推进 + 非审批 UI）→ 单次发送 → 复验 → 失败通知并换 fresh、禁连按 | 待升格 |
| RLT29-L06 | （P2 建议，非本次 P1）durable signal/合同 schema 演进遇不可覆盖历史工件时用「冻结式例外」：生效边界写死起始轮次，旧工件以精确文件名+全部旧字段+SHA-256 三重匹配登记，不回写、不改结论、不可类推 | 待升格 |

> 字段口径：候选 ID、触发现场/证据路径、下一次可执行规则、分类、状态；证据一律 repo-relative，不抄 pane/mtime/运行日志细节，不含凭据。升格进 `docs/modules/dh-relay/knowledge/教训库-候选.md` 是单独的人裁决动作。库内去重已对照既有 90 条候选（截至 2026-09-23）。

### RLT29-L01 · Git 非 ASCII 路径的 quotepath 显示编码 ≠ 路径身份（工具链陷阱）

- 分类：工具链陷阱
- 触发现场：task_plan §6 allowed-path audit 按行比对 `git diff`/`git ls-files` 的路径输出与 allowlist；`core.quotepath` 默认开启时 Git 把非 ASCII 路径渲染成带引号八进制转义串，3 条 allowlist 内中文路径（design/01、design/evidence/13、DevPlan P1）被误报越界，造成一次假 BLOCK。处置链：coder BLOCKED → decider 裁决在 git 调用上加命令级 `-c core.quotepath=false` → verbatim 重跑 PASS 后恢复施工。本仓中文文件名普遍存在，凡按行比对 git 路径输出与路径清单的脚本必复发。
- 证据（repo-relative）：`docs/modules/relay-light/workspace/RLT_29/BLOCKED.batch-1.coder.md`（reason=allowed_path_audit_quotepath_env）；`docs/modules/relay-light/workspace/RLT_29/decision.batch-1.quotepath.md`；`docs/modules/relay-light/workspace/RLT_29/check.batch-1.md` §3 项 8；`docs/modules/relay-light/workspace/RLT_29/evidence/baseline/B-06.txt`（原 FAIL 保留）；`docs/modules/relay-light/workspace/RLT_29/evidence/baseline/B-06-diagnostic.txt`；`docs/modules/relay-light/workspace/RLT_29/evidence/baseline/B-06-rerun-quotepath.txt`；`docs/modules/relay-light/workspace/RLT_29/evidence/baseline/summary-rerun-quotepath.json`；现行命令文本见 `docs/modules/relay-light/workspace/RLT_29/task_plan.md` §6。
- 下一次可执行规则：凡以 git 路径输出做清单比对/审计，git 调用一律命令级 `-c core.quotepath=false`，不依赖也不修改机器全局/仓库 Git 配置；绝不放宽 allowlist 或豁免真实越界；原 FAIL 与诊断留痕不覆盖不改写，修订命令 verbatim 重跑、另存新证据并回引原记录与裁决。
- 库内去重：既有候选无 quotepath 覆盖；候选-30 是 symlink/realpath 逃逸（不同面：词法 vs 真实落点），本条是显示编码 vs 路径身份。
- 状态：待升格

### RLT29-L02 · 全局 fail-closed/义务规则叠到受限写面角色必然自撞，须按角色分流且整改后扫残留（设计陷阱）

- 分类：设计陷阱
- 触发现场：同一合同在本卡连发两例。其一：通用「每个 worker 命中 `RELAY_RECEIPT` 写 `BLOCKED.*.md`」与「monitor 对 repo/workspace 零写入」在现役文本中直接矛盾（P1-01 FAIL）；其二：整改后复核又逮到 task_plan 残留「PASS 后 monitor fan-out workflow-final」（P1-02 FAIL），第三轮 targeted 方 PASS。两例证明这是设计层面的系统性陷阱，不是单笔误。
- 证据（repo-relative）：`docs/modules/relay-light/workspace/RLT_29/review.plan.monitor-contract.md`（P1-01、P1-02 及 user-adjust-2/3 两轮 targeted）；分流落字后的现行文本见 `docs/modules/relay-light/workspace/RLT_29/task_plan.md` §0.1、`docs/modules/relay-light/workspace/RLT_29/brief.md` 运行合同摘要段。
- 下一次可执行规则：给零写入/受限写面角色设计合同时，每条全局义务规则必须显式按角色分流落字，不接受「所有 worker 一律……」的未限定表述；只读角色的 fail-closed 出口只能是其既有允许通道（本卡 = 非 durable Herdr prompt 通知 orchestrator），不得分配任何 repo 写入或 durable signal；修订后必须全文扫描「该角色被多赋动作」的残留表述（本卡漏网处即 fan-out 一句），并把正反例钉进结构测试。
- 库内去重：既有候选无覆盖。
- 状态：待升格

### RLT29-L03 · sole-writer 边界两两正确也会组合成「登记→引用」死锁（设计陷阱/行为流程）

- 分类：设计陷阱（兼行为流程）
- 触发现场：R12 要求 review.md 需求表引用已登记 E-ID；证据账本在 progress.md，sole writer 是当前 batch coder；builder 禁写 progress——三方各自守规仍死锁：builder 要引用 ID 须先有登记，能写登记的人又不是 builder。builder 正确阻断而非越权，decider 裁「原 coder 先补登记限定附录（保留既有字节）→ builder 再引用」的顺序解法。
- 证据（repo-relative）：`docs/modules/relay-light/workspace/RLT_29/BLOCKED.builder.batch-3-b04-contract.md`（reason=r12_requires_registered_evidence_id_but_progress_write_forbidden）；`docs/modules/relay-light/workspace/RLT_29/decision.batch-3-b04-evidence-id.md`（§一 限定附录边界、§二 ID 闭集、§三 顺序）；`docs/modules/relay-light/workspace/RLT_29/review.plan.batch-3-b04.md` §3（ledger 唯一性/ID/hash/有限结论核验）；`docs/modules/relay-light/workspace/RLT_29/check.batch-3.md` 项 4。
- 下一次可执行规则：写者矩阵设计时先画出「谁登记、谁引用」依赖链，对每个「引用方」确认其所引对象的登记方有权且先于其落字，并显式定顺序与限定通道；解法是限定用途附录+顺序裁决，不是放开写者权，更不能让引用方写占位 ID 骗过检查；无真实支持时 BLOCKED 交裁决，禁止伪造 ID 或满足结论。
- 库内去重：既有候选无覆盖。
- 状态：待升格

### RLT29-L04 · 诊断失败清单含动态字段时必须先修比较 oracle 再比对，归一化授权闭集化且 fail-closed（验收陷阱）

- 分类：验收陷阱
- 触发现场：R30 类诊断把「本卡实际改动路径」嵌进失败正文，baseline↔post 逐字比对被动态路径清单漂移确定性干扰（恰 1 删 1 增同 rule）；coder BLOCKED → decider 立 `rlt29-b04-r30-paths-v1` oracle → 独立 plan-reviewer targeted 核验（含内存反例注入全阻断）→ coder 才重跑。此类诊断每张卡做 baseline/post 比对都会命中同型漂移，确定性复发。
- 证据（repo-relative）：`docs/modules/relay-light/workspace/RLT_29/BLOCKED.batch-3.coder.md`；`docs/modules/relay-light/workspace/RLT_29/decision.batch-3-b04.md` §三；`docs/modules/relay-light/workspace/RLT_29/review.plan.batch-3-b04.md` §4-5（正例+反例核验）；`docs/modules/relay-light/workspace/RLT_29/check.batch-3.md` 项 5（独立复算与 10 反例全阻断）；现行 oracle 文本见 `docs/modules/relay-light/workspace/RLT_29/task_plan.md` §5.3。
- 下一次可执行规则：凡对含动态字段的诊断输出做 baseline gating，先由合同层显式修比较 oracle：严格解析计数（声明数=实得数）、owned 先分离且 post 必须清零（绝不归一化或转 inherited）、P/S 逐字锚定、动态段闭集 ⊆ 授权集 D 且逐项过 allowlist 与任务归属、canonical Counter 多重集比对、其余一律阻断；oracle 由获授权角色修订、独立 reviewer 注入反例核验后 coder 才重跑——coder 不得私下换比较规则。
- 库内去重：与候选-62（比集合不比数、先量再改）互引——本条新增「条目内动态字段归一化 + fail-closed 授权边界」一层，不重复。
- 状态：待升格

### RLT29-L05 ·（P2 建议）交互终端「输入框 queued 未发出」的安全 Enter 三条件单次复验（行为流程/工具链陷阱）

- 分类：行为流程（兼工具链陷阱）
- 级别说明：本条是 reviewer 的 P2-01 建议登记项，不是本次 lesson 路 FAIL 的 P1 必修项。
- 触发现场：single-task monitor 安全 Enter 合同实发形成——Devin/Codex TUI 的派单文本可停在输入框 queued 态未真正发出，Enter 在 codex 侧可被吞成多行换行；合同规定三条件同时成立才发一次并复验：①派单文本仍停输入框（含 Devin queued 指令仍排队未发出）②`state_change_seq` 未推进 ③非审批/确认 UI；任一不满足即不按，一次仍失败通知 orchestrator 并换 fresh 实例、禁止连按；codex 侧以 `agent read` 输入框清空为终极复验判据。
- 证据（repo-relative）：`tools/relay-light/skill/SKILL.md`「monitor 节拍与安全 Enter」节；`tools/relay-light/skill/references/adapter-claude-code.md` 与 `tools/relay-light/skill/references/adapter-codex.md` 同节；`docs/modules/relay-light/workspace/RLT_29/check.batch-2.md` 项 5；`docs/modules/relay-light/workspace/RLT_29/check.batch-1.md` 项 4。
- 下一次可执行规则：向交互终端 agent 发键补投递前必须先判定 queued 态——三条件同真 → 单次 `send-keys enter` → 复验真实工作态/输入框清空；失败通知 orchestrator 换 fresh，禁止连按；回显、退出码与真实提交是三个不同事实。
- 库内去重：与候选-82（「回显≠已提交」+ 有界 Enter 回退）同族；新增面 = 输入框 queued 态检测、`state_change_seq` 未推进判据、Enter 被吞成换行的平台差异。可作候选-82 增补注记或独立候选，由人裁决定。
- 状态：待升格

### RLT29-L06 ·（P2 建议）durable signal/合同 schema 演进遇不可覆盖历史工件时的「冻结式例外」处置（行为流程）

- 分类：行为流程
- 级别说明：本条是 reviewer 的 P2-02 建议登记项，不是本次 lesson 路 FAIL 的 P1 必修项。
- 触发现场：新 signal schema「自 round 2 起」生效，但不可覆盖的 `DONE.plan-review.round-2.md` 缺 batch/path 字段，plan round-3 仍 FAIL 且 remediation_count 已到上限；decider 裁历史例外——以精确文件名+全部旧字段+SHA-256 三重匹配识别该次历史 FAIL，不回写、不改结论、不可类推，round 3 及未来全部 signal 强制新 schema。
- 证据（repo-relative）：`docs/modules/relay-light/workspace/RLT_29/decision.plan-round-3.md`；`docs/modules/relay-light/workspace/RLT_29/task_plan.md` §4 历史例外段；`docs/modules/relay-light/workspace/RLT_29/review.plan.md` post-decision 节（round-2 原字节/hash 实测核验）；`docs/modules/relay-light/workspace/RLT_29/check.batch-1.md` 项 7（SHA-256 实测一致）；`docs/modules/relay-light/workspace/RLT_29/check.batch-3.md` P2-3（user-adjust 轮次取值备查）。
- 下一次可执行规则：durable signal/合同格式演进时把新 schema 生效边界写死起始轮次；已落盘且不可覆盖的旧工件以「精确文件名+全部旧字段+SHA-256」三重匹配登记为唯一历史例外——不回写、不改结论、读取层仅解释不适用字段、不匹配即阻断、不可类推；未来工件强制新 schema。
- 库内去重：与候选-10（append+superseded）相邻但面向 signal schema 兼容判定（历史工件不回写、例外三重匹配），不重复。
- 状态：待升格
