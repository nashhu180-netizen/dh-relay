<!-- dh:v1 -->
# review — DRILL_02

> DRILL_02 task_type=`light`（演习卡 stub 冻结）。施工者不得复核自己的卡；light Recipe 的 R 阶段 = 教训 + 一致性两路，由独立 reviewer 只读执行。

## 预测变更面

<!-- dh:change-surface:v1 task=DRILL_02 phase=predict -->

| 变更面 | 预测改动 | 下游消费者 / 风险 | 预定复核证据 |
|---|---|---|---|
| 仓根 `.gitignore` | 末尾追加 `__pycache__/` 与 `*.pyc` 忽略段（不动既有行） | `git status` 干净度、CI checkout、所有跑 Python 测试的 worktree；风险=规则行写错致 AC-1 不命中，或误改既有行波及其他忽略 | `check-ignore -v` 命中行 verbatim；`.gitignore` 纯追加 diff；测试后 `git status --short` 全量 |

## Light Recipe 路径登记

| 路径 | 时序 / 独立性 | 必审靶子 | reviewer | 证据 | 状态 |
|---|---|---|---|---|---|
| lesson | R1；C1 闭合后；fresh，非施工者 | lesson_candidates 候选的现场证据、去重、可复用性；若 absent 形成可核查 N/A | 监工按 relay_plan 拉（codex read-only） | `review.lesson.md` | 待执行 |
| consistency | R1；与 lesson 同批并发；fresh，非施工者 | 计划↔施工↔验收一致性：`.gitignore` diff 是否恰为计划追加段、证据账是否悬空、信号/账本一致 | 监工按 relay_plan 拉（codex read-only） | `review.consistency.md` | 待执行 |

## 批次小审登记

| Batch | 小审角色 | 结论 | 证据 | 状态 |
|---|---|---|---|---|
| W | plan-reviewer#1 | 待执行 | `review.plan.md` | 待执行 |
| C1 | checker | 待执行 | `check.C1.md` | 待执行 |

## 有效单测候选

light Recipe 无强制有效单测要求；本卡验收由 AC-1（check-ignore 命中）与 AC-2（实测套件 + status 无 `__pycache__`）两条行为判据承载。

## 独立复核区（执行者 ≠ 复核者；light Recipe 两路）

| 路径 | 复核者（自报身份 / 模型） | 结论 | 发现级别 | 报告 |
|---|---|---|---|---|
| lesson | 待执行 | | | `review.lesson.md` |
| consistency | 待执行 | | | `review.consistency.md` |

## R1 汇总（scribe#1）

两路复核均 PASS，R1 无 P1 阻断项。

| 路 | 结论 | P1 | P2 | 处置 |
|---|---|---|---|---|
| lesson | PASS | 0 | 1 | 候选裁决：L-DRILL-02-1 **采纳**——W/C1 两次独立复现合并为一条，但收编必须带完整条件链（先按合同尝试 `git rebase master`；仅当其因已识别的他人 WIP 被拒时，才核 `merge-base(HEAD, master) == master`；等值只证拓扑 no-op，不授权 stash/清理/提交他人文件）。L-DRILL-02-2 **合并**——并入 RLT_10 F-002 / RLT_03 F-008 既有 Python 副产品教训链，作机制化闭合证据，不另建平行教训。唯一 P2-1（候选原句省略触发前提）已转记 `findings.md` |
| consistency | PASS | 0 | 0 | 无发现。`.gitignore` 纯追加与计划钉死段一致；四集合/allowed-paths 闭集满足（`tools/` 零 diff，他人 WIP 未暂存未删）；task_plan 七步对账全 PASS；progress 与账本状态一致 |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：本卡为非正式预演卡；任何测试绿、checker PASS 或 reviewer 结论都不等于用户验收、verify、push、PR、CI、merge 或发布，也不计入 RLT_12 状态。

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| AC-1：`git check-ignore -v tools/relay-light/__pycache__/x.pyc` 命中 `.gitignore` | C1 追加后复跑，输出须含 `.gitignore:<行号>:<pattern>` 命中行 | 待 C1 登记 E-ID | 待验 |
| AC-2：`pwsh tools/tests/relay-light-log.ps1` 后 `git status --short` 无 `__pycache__` | 套件实跑到底 + 随后 status 全量输出 | 待 C1 登记 E-ID | 待验 |

**材料齐没齐**：[ ]（七件套已建；C1 施工、小审、R1 两路、F1 收口均未发生）

---

## 人类签名区　✅ 仅凭用户对话确认解锁

本卡为预演卡，无业务人判项；收口展示两条机器证与两路复核即可。AI 不得预勾。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| 整卡收口 | 查看 AC-1/AC-2 证据、小审与两路复核后对话确认 | 用户明文确认 | |
