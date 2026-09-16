<!-- dh:v1 · D1 · 用户裁决记录（编排写入）；只记用户在对话中的点选，不代表晋级、verify、验收或远端动作授权之外的任何授权。 -->
# RLT-A-11 · decisions（D1）

- 日期：2026-09-16
- 收集方式：编排在 Claude Code 主会话用 AskUserQuestion 四问点选；用户全部选择推荐项（无偏离，按 task_plan D1 无需偏离推荐项定向复审，但裁决带来的候选改稿仍按 C1b → RV 流程复审）。
- 输入方案：`decision.1.md`（decider#1，C1-decision）；候选稿 `A11-候选.md` §5 开放项表。
- O-005 为本次新增开放项（承接 fresh-01 P1-2 的出口选择），由 coder 在 C1b-part2 补进候选稿 §5 表，旧文 / 新文对照见候选稿整改对照表。

DECISION O-001 status=CHOSEN option=A
- 问题：`HC-RL-H10` 命题列是否同步改
- 用户点选原文：「不改 H10，只加回链 (Recommended)」——H10 行一字不动，在职责分层段回链 H10
- 受影响 block：B-002（不变）；无 H10 替换 block

DECISION O-002 status=CHOSEN option=A
- 问题：职责分层段落位置
- 用户点选原文：「§12 末尾 (Recommended)」
- 受影响 block：B-002（保持 §12 末尾锚点）

DECISION O-003 status=CHOSEN option=A
- 问题：RLT_24 关闭动作的事件载体
- 用户点选原文：「完整 wire format (Recommended)」一问中含「独立第 20 词」——即独立第 20 个控制事件词 `resource_close`，不复用 `checkpoint`
- 受影响 block：B-003 的 A155～A158、B-010、B-011、B-013；新增 A2 / §0.1 / §3.2～§3.4 设计块（见 O-005）

DECISION O-004 status=CHOSEN option=A
- 问题：`resource_close` 字段合同
- 用户点选原文：「完整 wire format (Recommended)：独立第 20 词；object_type∈{workspace,pane,worktree}、object_id、outcome∈{ok,failed} 必填，failed 必带 reason、ok 禁带；空格分隔 key=value、百分号编码、禁重复/未知键；add 落盘前与 lint 同协议拒绝；pane 由监工记、workspace/worktree 由编排记。A155 管基础合同、A156 独管 reason 条件。」
- 采纳文本：以 `decision.1.md` §2（2.1 语法和字段、2.2 add/lint 拒绝时点、2.3 A155/A156 逐字提案、2.4 A157/A158 与 §12 连动）为准，替换候选稿原 O-004 选项 A 的较粗合同
- 受影响 block：B-003 的 A155～A158、§12 两类终端空间「删失败怎么办」单元格新 block、§3.4 wire format 新 block

DECISION O-005 status=CHOSEN option=A
- 问题：fresh-01 P1-2——第 20 事件词与现行 A2（19 词）/ Issue #37「只增不改、不动 schema」/ RLT_24 允许路径的冲突出口
- 用户点选原文：「出口 A：本事件扩界 (Recommended)——RLT-A-11 一并改 A2(19→20)、§0.1/§3.2~3.4、§12 两格取证路径，并改 RLT_24 卡目标/非目标句（允许路径不加 design/01）；Issue #37 边界同步更新（A2 为唯一旧行例外）。设计一次审清，RLT_24 只实现。」
- 采纳文本：以 `decision.1.md` §1「出口 A」1～6 条为准（含 A2 逐字行、§3.4 A09 段「仍是那 19 个词」改写口径、RLT_24 卡合同改写口径、R 批 A2 精确例外判据）
- 连带合同变更（编排执行）：①本事件允许路径扩到 design/01 §0.1/§3.2～§3.4/A2 行/§12，以及 DevPlan `#### RLT_24` 的目标/非目标/变更范围句（dispatch/README 已同步）；②Issue #37 边界（验收口径「只增不改」加 A2 唯一例外、非目标「不动账本 schema」改为仅允许 resource_close 事件白名单与 note 子协议的设计变更）——用户选项文本含「Issue #37 边界同步更新」；**编排已于 2026-09-16 直接更新 Issue #37 权威正文**（承接 W2 第 3 轮 #6：评论不足以改权威合同）——非目标与验收口径处加【扩界】子条、新增 RLT_24 卡合同同步条与「扩界记录」节，原文未删；`gh issue view 37` 可复核；③未选出口 B/C
- 受影响 block：新增 A2 替换 block、§0.1 / §3.2 / §3.3 / §3.4 设计块、§12 单元格块、B-010 与 RLT_24 卡句块；B-013 按 decision.1 §3 改为固定锚点片段

## 小决策（编排代执行，非用户裁决）

- fresh-01 P1-4 → 采纳 `decision.1.md` §3（B-013 固定锚点片段逐字 + 五节事实完整性校验），由 builder 在 W1c 落 task_plan，coder 在 C1b-part2 改 B-013。
- RV（`review.targeted-02.md`）N-002（P2，A85 写入者二分枚举不含 `resource_close`）→ 取选项 (a)：在 B-020（§3.4 末 wire format 段，属 O-005 已批准范围）新文补一句「A85 写入者枚举系 19 词时代口径、未含本事件，`resource_close` 法定写入者以 §3.4 表为准」；**不改 A85 行**，不扩大 A2 唯一旧行例外。A85/A68/A89 同族陈旧由 coder 登记 `findings.md`，留待后续规划事件。
- RV N-003（P2，DevPlan RLT_03/RLT_22 已完成卡句中的「19 词」）→ 按「不追溯改历史工件」原样保留，不加注；coder 登记 `findings.md` 备查。
- RV N-001（P1，B-011 误写「Issue 评论落记」）→ 非决策项，按审核整改动作由 coder 更正为「编排直接更新 Issue #37 权威正文（2026-09-16）」。

## 远端动作授权（用户对话原话）

- 2026-09-16 编排在汇报中列出收口动作「commit、push、开 PR、等 CI 三硬门、合并」后，用户回复原话：「我现在就授权给你」。据此授权范围 = 本事件分支 `plan/rlt-a11` 的 **commit、push、创建 PR（Relates to #37）、CI 三硬门通过后 GitHub 服务端 squash 合并**。执行时点仍在 C2-audit 与 R 开发后复核通过之后；CI 未全绿不合并。本授权**不含** verify 代签、验收、RLT_23/RLT_24 的 D-start。
