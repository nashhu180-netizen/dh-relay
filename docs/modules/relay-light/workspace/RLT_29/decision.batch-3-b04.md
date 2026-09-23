# RLT_29 batch-3 B-04 blocker 裁决

- 日期：2026-09-23；decider#1；batch=3；review_round=1；remediation_count=0。
- 结论：**RESOLVED（修复路径已裁定，batch-3 仍未放行）**。属于已确认合同的自洽修复，不改变产品目标、代码范围、验收语义或用户人验闸。
- 本棒 RELAY_RECEIPT 未命中；只读指定合同、原始诊断和前两批 PASS。未改任何代码、review、task_plan、progress、历史 signal 或 evidence，未启动 agent、未 clear。

## 一、核实的问题与证据

1. baseline/summary.json 的 B-04 为 66 failures（59 inherited + 7 RLT_29-owned）、36 warnings；post/comparison.json 与 post/B-04.txt 同为 66/36。直接从两个原始 B-04.txt 的失败区提取并按多重集比较，只有 1 条删除 + 1 条新增，均为 workspace/RLT_27 R30 同一诊断的路径列表变化；不是新 rule/task。
2. 本卡 7 条完全保留：R12 空需求对齐证据表；R17 完成条件 2、5、7、9、11 未同步共 5 条；R17 人验项覆盖缺失 1 条。review.md 条件 5 仍声称 progress 是唯一真相且 monitor 写，需求表下注还让 monitor 登记 Evidence ID，人验操作列仍写 monitor progress。这些与当前 brief、task_plan、execution_strategy 的 monitor 全仓只读合同相反。
3. review.md 的 workflow-final 五路、E2、Recipe 勾选、用户确认均仍 pending/未勾选。修正预填和引用已发生证据，不等于完成这些未来工作。
4. 前两批 DONE.batch-1.review.md / DONE.batch-2.review.md 均 durable PASS；check.batch-1.md、check.batch-2.md 有独立检查和实际命令证据，后者明确恢复四类权威、monitor 零写入与 batch-1 清理链。只能按其真实覆盖范围引用，不能外推 H19 整体通过。
5. 当前 execution_strategy 定位：原 builder 为 r29-builder，w41:t2/p2；原 plan-reviewer 为 r29-plan-reviewer，w41:t4/p4。最近 monitor 合同调整 signal 使用 builder#2 / plan-reviewer#2，后者 user-adjust-3、remediation_count=2、PASS；不是另找新人。batch-3 coder 为 coder#b3 / r29-b3-coder，w41:tA/pA；batch-3 reviewer 为 r29-b3-reviewer，w41:tB/pB。这些是配置工件记录，实际恢复由 orchestrator 核对，不能冒称本 decider 已实时观察 Herdr。

## 二、review.md 的 targeted 修订归属

由 **原 builder 物理实例 r29-builder（当前派单身份沿用 builder#2，w41:t2/p2）** 做一次限定的合同/证据预填同步。依据是 task_plan §3 既有 builder 对 review.md 合同修订的职责，加本次裁决限定新的修订包；不是 coder 越界、不是 builder 自审，也不是把已耗尽的旧 plan 整改次数重置再跑第三次整改。

本修订包业务允许路径仅以下两件（均以本工作区为根）：

- `review.md`：仅「完成条件逐条挂证据」中 2/5/7/9/11 的条件文本及对应证据引用；「需求对齐证据」表与其下注；「人类签名区」的 H19 验什么/做什么/通过标准预填文字，以及当前状态说明。其余条件不改定义。五条条件逐字同步现行 brief，尤其条件 5 的四类恢复依据和 monitor 只读。人验操作列去除 monitor progress 旧说法，保持结果未勾选、确认待 E10、verify SHA 未填写。
- `task_plan.md`：仅 §5.3 B-04 比较 oracle 及 §9/验证块紧邻说明中直接引用该谓词的文字；另在 §3/§4 附加本修订包 sole-writer/精确输出/顺序说明。不改原批次职责、allowlist、模型或清理闸，不改其它验收及代码路径。

builder 独占新输出 `DONE.builder.batch-3-b04-contract.md`（READY）或 `BLOCKED.builder.batch-3-b04-contract.md`；evidence 指向上述两件及本裁决。不得覆盖旧 builder signal。

需求表可登记已发生且能逐项查到原件的场景：例如 check.batch-2.md 的恢复依据核验、真实命令与双 adapter 检查；必须写明需求/人验项、具体场景与操作路径、未占用的可解析 E-编号、原证据路径和有限结论。编号只给现有证据索引，不代表新场景已经执行。builder 必须亲自核对所引用原件；无真实支持则保留待补并 BLOCKED，不写占位假证据骗过 R12。这里只允许引用/整理，不授权 builder 执行新的 Herdr 演示或测试施工。

本次整理结论限定为“该已发生场景满足”，H19 整体仍待人验；不得将部分结构/命令证据冒充真实端到端演示。禁止改写或签署独立复核区、E2 结论/session/receipt、Recipe 勾选、final 五路 PASS、batch-3 review PASS、E10 已展示、用户签名或 verify 事实。不得写 progress、改历史 evidence 或让 monitor 补证。

## 三、RLT_27 R30：允许精确动态字段归一化，必须先修比较 oracle

这不是豁免 R30，也不是解决 RLT_27 的旧问题：该条仍计入 inherited failure，多重集数量仍保留 1。现有 §5.3 全摘要逐字相等在已知动态路径字段上失真，故先由 builder 显式修订 oracle，再由原 plan-reviewer targeted 核验；coder 不能私下换比较规则。

### 归一化算法（版本 rlt29-b04-r30-paths-v1）

1. 从 B-04 原始输出的 `❌ 失败 N:` 区提取全部失败行，只去掉格式缩进及行终止符；不要 trim/替换正文，不把警告混入。解析出的数量必须等于 N 及原输出合计；无法解析、缺行、重复丢失均阻断。baseline 必须同时与原 summary.json 的 59 inherited + 7 owned 多重集一致。用 Counter/多重集，不用 set，保留重复次数。
2. 先按诊断 subject/task 划分 owned。subject 为 workspace/RLT_29 或其子路径、或明确 task=RLT_29 的失败均为 owned；baseline 未知的新失败不能默认归 inherited。subject/task 解析不清或矛盾即阻断。任何 RLT_29-owned（包含新 rule，不限原 7 条）在重跑 post 必须为 0，绝不归一化或转为 inherited。
3. 唯一可归一化的 inherited 行必须逐字匹配下列前缀 P 与后缀 S，且两端之间只是一段路径清单 L：

```text
P = workspace/RLT_27　R30 任务「RLT_27」类型=light 的实际改动超出任务卡登记的允许路径：
S = ——**停下，由用户重新定类**（非自动升级、非自动放行）；若属登记遗漏，先补进任务卡「变更范围」再继续
```

baseline 和 post 都必须恰好出现一条该行；rule、subject、task、light、停止结论或任何 P/S 字节变化、条数变化都不适用归一化，保持阻断。
4. 将 L 以中文顿号 `、` 分割，须为非空、不重复的精确 repo 相对路径；不得做宽泛 substring 删除、路径解码猜测或吞掉未知字段。baseline 的 L 必须恰为 `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md`。本次批准的 post 动态路径闭集 D 仅为：

```text
AGENTS.md
docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md
tools/relay-light/skill/SKILL.md
tools/relay-light/skill/references/adapter-claude-code.md
tools/relay-light/skill/references/adapter-codex.md
tools/relay-light/test_install_skill.py
```

post L 必须非空且为 D 的子集；D 是本次已观察的诊断字段范围，不是新增代码 allowlist。每个 post L 路径还必须存在于该次 B-04 前后未变化的 tracked diff 名单（`git -c core.quotepath=false diff --name-only 93d65cb --`）中，并通过 task_plan §6 实际允许路径检查及任务归属核对。前后快照不一致则重新采集；未知路径即使可能合法，也不在本次归一化授权内，继续阻断交 decider。原 baseline 单路径按原始证据核验，不用当前 diff 伪造当时快照。
5. 满足以上守卫后只将 L 替换为固定标记 `<RLT29_APPROVED_DYNAMIC_PATHS>`，即 canonical=P+标记+S；原文、raw 差异、被替换的路径列表、归一化原因及本裁决引用全部保存。其余所有 inherited 失败正文逐字不变。
6. 比较 canonical inherited Counter，必须与 baseline 完全相等（本基线 59 条）；新增/缺失 rule/task/failure、重复数变化、其它正文变化一律阻断。新的 owned failure 仍阻断，不能用总数抵消。原始 66 仅是旧结果，修复 7 owned 后在 inherited 不变时预计为 59，不能硬要求维持 66。dh exit=1 可由这 59 条存量解释，但退出码本身不构成 PASS；异常退出、截断和未分类失败仍阻断。
7. 同时保留 §5.3 其它门：B-01/B-02/B-03、真实 scope 审计、forbidden diff、open P0/P1、diff-check；此归一化不更改 dev-harness、旧卡、DevPlan 或 design。

## 四、执行顺序、唯一写者和精确输出

所有以下新路径以 `docs/modules/relay-light/workspace/RLT_29/` 为根；现有同名文件不得覆盖，若已存在由 orchestrator 冻结新的尝试后缀再派单，不擅自复用历史结果。本裁决仅定义后续职责，本棒不发起以下动作。

1. **orchestrator** 核对本 decision 与 RESOLVED signal，向原 builder 派限定修订包；batch-3 coder 保留当前 session 等待，batch-3 reviewer 不提前出结论；monitor 仍只读。orchestrator 不代写 builder/reviewer 产物。
2. **原 builder#2 / r29-builder** 按 §二修 `review.md` 指定段及 `task_plan.md` 指定段，写 `DONE.builder.batch-3-b04-contract.md` 或对应 BLOCKED 后停；不写 comparison 或测试代码。旧 plan/user-adjust 轮次与已 PASS 记录原样保留；这个后发现 blocker 的定向合同修复包单独登记，不能以新命名规避任何未来超限。
3. **原 plan-reviewer#2 / r29-plan-reviewer** 必须 targeted 核验两件修订：只读输入，写新 `review.plan.batch-3-b04.md` 及 `DONE.plan-review.batch-3-b04.md`（PASS/FAIL）或 `BLOCKED.plan-review.batch-3-b04.md`。核验精确预填、真实证据来源、未来验收未伪造、sole-writer 和 oracle 守卫。用历史两份 B-04 验证只消除已知 raw drift；以只读内存反例验证新 rule/task、P/S 改动、未知路径、重复 failure、owned 新增各自被阻断，不能只测试当前正例。报告须记录实际核验输入与结论。FAIL 仍阻断并交 decider，不自动增加旧计划整改轮或改由他人代签。
4. **batch-3 原 coder#b3 / r29-b3-coder（w41:tA/pA 原会话）** 仅在上述 durable targeted PASS 后恢复。只写其既有 `evidence/batch-3/**` 和自己的新 signal；不改 review.md/task_plan。新建 `evidence/batch-3/post-b04-rerun-1/`：`B-04.txt`、`B-04.exit`、`tracked-before.txt`、`tracked-after.txt`、`B-06.txt`、`B-06.exit`、`diff-check.txt`、`diff-check.exit`、`comparison.json`。其中 comparison 保存 baseline/post 原始引用及哈希、命令/cwd/时间、raw 与 canonical failures/多重集差异、路径守卫结果、owned 计数、归一化版本和所有门结论。旧 post/comparison.json 及旧 B-04 不覆盖。
5. coder 从固定仓根重新执行 `dh relay-light`、§6 allowed-path audit、`git diff --check` 并记录真实退出。B-04 前后捕获上述 tracked 名单以验证稳定性；原 B-01/B-02/B-03/B-05 已通过可在新 comparison 按原路径/哈希引用，注明未重跑；若修订触及其被测代码/命令/环境或证据失效，则按原合同重跑并写新文件，不能伪称全部已重新执行。RLT_29-owned 非零、canonical inherited 不等、归一化守卫失败或其它门失败时写新 `BLOCKED.batch-3.coder.b04-rerun-1.md`，保留原 BLOCKED；全部批内条件真实满足才写新 `DONE.batch-3.coder.b04-rerun-1.md`（READY），evidence 指向新 comparison 及所需本批证据。若其它场景证据仍缺，本裁决不予豁免。
6. **既有 batch-3 reviewer / r29-b3-reviewer（w41:tB/pB）** 对 coder 新证据和本批全部产物做正常 batch review，独立核验原始输出、归一化仅限上述一条、本卡失败清零及全部批次门，按原合同写 `check.batch-3.md` 与 `DONE.batch-3.review.md`/对应 BLOCKED；plan-review targeted PASS 不能替代 batch PASS。

本棒不授权任何 clear。后续只有真实 batch reviewer durable PASS 且工件齐全才由 orchestrator 按既有 clear 闸处理；FAIL/整改保留原 coder/reviewer session，monitor 常驻。final/E2/人验的身份、次序和确认闸不变。

## 五、停止边界与结果含义

若真实证据不足、必须改既定目标/范围/验收/数据语义/安全/生产影响，停止并交用户；若发现不符合本算法守卫的诊断变化，继续 BLOCKED 交 decider，不扩大归一化。RESOLVED 仅说明这两项合同冲突有合法收敛路径；不表示 review 已修、7 failures 已清零、post 已绿或 batch-3 已 PASS。
