# RLT-A-11 · W1 业务合同

- 身份：规划事件，最小 A-adjust，Issue [#37](https://github.com/nashhu180-netizen/dh-relay/issues/37)；工作树 `plan/rlt-a11`。Issue #37「这是什么」「档位 / 风险」及 `dispatch/README.md`「身份与合同」为来源。
- 基线：派活指定 `bd118f6` = `origin/master`；本节点实测 `git show origin/master:docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md | rg -o 'HC-RL-A[0-9]+' | sort -Vu | tail -1` 为 `HC-RL-A150`。设计 §11.1 表尾 `HC-RL-A144`～`A150`，DevPlan 第 49 行同证。

## 目标与来源

1. **F-001**：在设计 §12 表尾补一行兜底类，说明计划目录或任务工作区目录内、前六类未点名的持久化产物随所在目录同口径保留。这是枚举措辞缺口，既有产物已被正确保留。来源：Issue #37「目标」第 1 条；`workspace/RLT_11/findings.md:9`；设计 §12（现第 1319～1330 行）。
2. **F-002**：显式区分账本复现「接力现场」（交棒人、时间、阶段/节点流转、阻塞点）与 workspace 文档 + git + Issue 复现「施工现场」（改了什么、为什么），并回链 `HC-RL-H10`。账本 note 的 `commit=<sha>` 为顺手旁注，squash 后失效不构成契约破坏；`HC-RL-H10` 的人判须据此拿对尺子。来源：Issue #37「目标」第 2 条所载裁决要点；`workspace/RLT_11/findings.md:10,34`；设计 §11.2 `HC-RL-H10`（现第 1315 行）。落点在候选稿提案，是否动 H10 命题列列为开放项。
3. **续发 ID**：从实测最大 `HC-RL-A150` 后的 `A151` 起，为 RLT_23 四条纪律（F-003/F-005/F-006/F-007）与 RLT_24 事件 schema、failed 分校验、§12 取证、历史账本兼容续发原子条目；只续号，不退役、不改号、不复用。来源：Issue #37「目标」第 3 条；`workspace/RLT_11/findings.md:11-12,18-20,26-34`；DevPlan `RLT_23`/`RLT_24` 卡（第 434～462 行）；设计 §15「验收 ID 稳定性」（现第 1383 行）。
4. **O-005 出口 A 扩界（2026-09-16 用户点选 A）**：本规划事件在 design/01 冻结独立第 20 个控制事件词 `resource_close` 及 note 子协议：§0.1、§3.2～§3.4、§12 两类终端空间失败取证列与 `HC-RL-A2` 行同步；`A2` 是**唯一允许改动的既有验收 ID 行**，其余旧行（含 H10）逐字不变。DevPlan 同步 RLT_24 的目标、非目标、变更范围三句，明确该卡只实现并验证已冻结设计，不自行改设计正文。**本事件不实现新事件能力；实现与取证归 RLT_24。**来源：`decisions.md` O-005（2026-09-16）、`decision.1.md` §1 出口 A、`dispatch/README.md`「允许路径」「停止边界」。

## Issue #37 验收口径（逐条原文）

> - §12 表含兜底类行，且与真计划实际产出清单对照无遗漏类别
> - 职责分层口径落盘并回链 `HC-RL-H10`，措辞能让后续做 H10 人判的人拿对尺子
> - A151~ 续发的验收 ID 在包内唯一、无复用，且被 RLT_23 / RLT_24 卡片正确引用
> - 文件头新增可解析的 `dh:planning-event:v1 id=RLT-A-11 stage=A-adjust` 声明并附审核回链
> - 机械核验：验收 ID 行集合相对 master 只增不改

以上保留 Issue #37 原验收口径逐字文本。**2026-09-16 O-005 出口 A 扩界**：第 5 条的「只增不改」现改按 A2 精确例外核验——原 A2 须与 master 基线逐字相同，新 A2 须与 `decision.1.md` §1.3 用户批准的逐字行相同，其余旧验收 ID 行逐字不变；§0.1 / §3.3 / §3.4 / A2 的 20 词口径一致，§3.2 note 子协议、§12 两格取证路径和 RLT_24 卡分工同时落盘。来源：`decisions.md` O-005（2026-09-16）、`decision.1.md` §1.1～§1.4；执行核验见 `task_plan.md` C2 与 R 批。Issue #37 扩界由编排按 `decisions.md` 的记录同步，不把原 Issue 文字伪装成已改原文。

## 允许路径与依赖

- W1 原节点只写 `docs/modules/relay-light/design/drafts/A11/{brief.md,task_plan.md,progress.md,findings.md}`；W1d 仅修本 brief、task_plan 并追加 progress。后续事件全程允许 `design/drafts/A11/**`；**仅晋级批**可写 `design/01-RelayLight-产品设计与验收.md`、新建 `design/evidence/11-*.md`、修改 DevPlan `P1-RelayLight-开发方案.md` 的限定句。设计晋级范围含原 §11/§12/§15/文件头及出口 A 新增的 §0.1、§3.2～§3.4、A2 行、§12 两类终端空间「删失败怎么办」单元格；DevPlan 限 RLT_23/RLT_24「验收口径」行、RLT-A-11 条、顶部相关句及 **RLT_24 目标/非目标/变更范围三句**，RLT_24 allowed-paths 行不改。来源：`dispatch/README.md`「允许路径」2026-09-16 扩展、`decisions.md` O-005。
- **RLT-A-11 正式落盘前，RLT_23/RLT_24 不开工**；两卡依赖本事件续发 ID 与 §12 口径。来源：`workspace/RLT_11/findings.md:34`；DevPlan 第 49、597 行；Issue #37「收口」。
- 候选稿与复核记录留在 drafts 作形成史，不纳入正式 design input；设计的审核证据落 `evidence/11-*.md` 并以 `dh:planning-evidence:v1` 锚定。来源：A09 先例 `design/drafts/A09-复核触发信号与返工生命周期修订候选.md`、`design/evidence/10-交叉审核记录-RLT-A09-复核触发信号.md:10-15`。

## 风险与停止边界

- 原 Issue #37 风险说明为“纯设计措辞与 ID 续发、无行为变更”；O-005 出口 A 将**设计合同**扩到第 20 事件词和 note 子协议，需重审 A2 唯一例外、四处词数口径和 RLT_24 分工。当前代码仍是 19 词，新能力未交付，历史账本兼容仍是独立验收。来源：Issue #37「档位 / 风险」原文；`decision.1.md` §1.1、§1.5～§1.6；`decisions.md` O-005（2026-09-16）。
- 不改实现代码、运行账本、herdr、dev-harness、skill 或 AGENTS.md；只允许 `resource_close` 事件白名单与 note 子协议的**设计**变更，实现在 RLT_24。不追溯改历史失效 SHA；不夹带 RLT_22 F-005/F-010 等其他设计改动。来源：Issue #37 原「非目标」及 `decisions.md` O-005（2026-09-16）扩界、`dispatch/README.md`「停止边界」。
- W1 不写候选稿或正式设计/DevPlan，不提交、不推送、不推进下一节点。来源：`dispatch/W1-builder.md`「硬约束」；`dispatch/README.md`「worker 铁律」。
- Issue #37 规定候选稿经 fresh 审核、裁决改稿、用户点选产品决定、必要定向复审，之后才可晋级与走 PR/CI/合并；本 W1 只制定可执行计划，后续授权与实际结论由对应节点和编排承接。来源：Issue #37「档位 / 风险」；`dispatch/W1-builder.md`「流程必须符合先例配方」。
