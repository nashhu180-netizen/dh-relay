<!-- dh:v1 · task.md -->
# task — Issue #86 · single-task 文档 agent 分工入协议 + 本卡试跑

- Issue：<https://github.com/nashhu180-netizen/dh-relay/issues/86>；规划 PR：#87（`Relates to #86`，规划草案未合并、未实现是历史边界；本轮用户已另行授权开发）。
- 档位：轻档；task_type=light；一批（batch=1）；复核 Recipe=教训 + 一致性两路；E2 code_review 因本卡无运行代码改动如实记 N/A。
- 任务来源：草案 [dev_plan/drafts/issue-86-document-agent.md](../../dev_plan/drafts/issue-86-document-agent.md) 及独立审核记录 [issue-86-document-agent-review.md](../../dev_plan/drafts/issue-86-document-agent-review.md)；草案末尾有本轮范围调整注记。
- 基线：`e92b5356df0026be28abd84176a621870fb562c7`（branch `docs/issue-86-document-agent`，主会话进场已 rebase master 并合并保留已发布历史；不再 rebase 改写已发布历史）。
- worktree：`.dh-worktrees/issue-86-document-agent`；session=kpi-agg；space=w4K。

## 用户授权与原话（2026-09-28）

- 「不如就用这个任务测试下。这还不是代码任务，纯skill文档更新。skill 还是你来，但是devhainrness 接力计划 过程文档交给独立的 ahgent进行，可以用 devin swe-2 high 进行 放标签页执行。说错了，按照单卡接力的方式吧」
- 「全部用 Devin SWE-2 high，按单卡流程执行」（含文档、独立计划/批次/最终复核和 watcher）。
- 迁移纠正：「放当前space，不开新space」——会话已原地迁移至 w4K（见 execution_strategy）。

## 本次合同（写者分工 = 用户本卡明确例外，不冒充旧协议本来如此）

- **产品内容**（仓内 SKILL.md、Claude/Codex 双 adapter、AGENTS.md 相关段）：由 Codex 主会话（编排兼实施，w4K:p1）撰写——用户明确例外。
- **dev-harness 单卡过程工件**（本目录 task/task_plan/execution_strategy/progress/findings/review/lesson_candidates 及施工/复核/收口回填）：由文档 agent `builder#docs`（Devin SWE-2 high，w4K:t2/p2）撰写——本次「过程文档委托」试跑对象。
- 原始日志、结构化复核结论、独立 durable signal 仍由实际生产者各自生成，不由文档 agent 代写。

## 目标

1. 将 single-task 文档 agent 分工写入 skill 协议：主会话方案为新增 **opt-in `document` 角色**（沿用现有 phase，不新增 phase；默认写者模式不变）；本卡通过用户明确例外提前试跑该分工。
2. 试跑边界：产品文档由实际执行者写、过程文档由文档 agent 写；**不是** DA-01 所有文档类别最终通过。原草案 DA-01～DA-08 覆盖/未覆盖情况在收口时如实登记。
3. 未来其它卡可在已批准路径内将全部人工文档交文档 agent；本卡 skill 本体作为交付物保留给主会话。

## 协议要点（写入 skill 的候选内容，施工时定稿）

- 新增 **opt-in `document` 角色**（默认写者模式不变），**不新增 phase**——现役 `test_install_skill.py` 冻结九值 phase 闭集，本卡不改测试代码。document 角色沿用文档所属的现有 phase：初建=`plan`、施工记录=`batch`、复核记录=`batch-review`/`workflow-final`、收口=`human-acceptance`。
- document 派单 `path=document-<本次请求id>`；自有收口 verdict=`SYNCED`；`READY`/`SYNCED` 仅表示文档处理完成，**不能当 PASS** 路由消费。
- 每次派单给出精确路径、来源版本及结论；文档按需同会话复用/顺序写/独立 DONE。
- 责任 reviewer 核对转录后发可路由 PASS；文档错误回文档角色更正，不冒充新复核轮、不新增 attempt。
- 缺证/冲突/过期输入报告「待同步」，协议约束不假称程序硬门。
- 单写者、来源确认、失败/恢复、首次建卡与交棒边界在 AGENTS 与双 adapter 间保持一致。

## 验收候选（复核按此逐条挂证据，不预写结论）

| # | 验收 | 类型 |
|---|---|---|
| 1 | 协议核心（SKILL）/ 双 adapter / AGENTS 三方一致，无互相矛盾的写者规则 | 机器证（文档检查 + 受影响现有测试） |
| 2 | 本卡建卡与计划、一次施工回填、复核结果引用、收口回填均由文档 agent 实际完成 | 机器证（本目录工件与 signal 记录） |
| 3 | signal 与判断责任保留：durable signal / 复核结论由生产者自写，文档 agent 不代签 | 机器证 |
| 4 | 缺证/冲突/过期输入不猜，报告待同步 | 机器证（试跑中实际出现则记录，未出现如实 N/A） |
| 5 | 文档检查 + 受影响现有测试 + PR 必需 CI（relay-tests-pwsh Windows/Ubuntu、relay-light-python；relay-core 观测） | 机器证 |
| 6 | 用户判断过程文档委托是否减负可接受 | 人判（未判断不代签，不称全验收通过） |

收口必备输入：Codex 主会话对本次过程文档委托的**效果原评**，覆盖五个维度——准确性、遗漏、及时性/可接续性、交接纠错负担、可得耗时用量。文档 agent 只原样转录主会话评价（落 review.md 预留区），不自行判试跑成功；用户人判不预签。

## 范围与停止边界

- 不改运行代码 / 配置 / 测试代码；不新建 daemon / 完整 relay_plan / relay_log 账本；不迁移在途卡；不批量关闭旧卡。
- 文档 agent 不做远端操作（commit/push/PR/merge 由主会话按 AGENTS 单卡授权核对执行）；不派活、不问用户、不自行续阶段。
- 实施精确路径：SKILL.md、`references/adapter-claude-code.md`、`references/adapter-codex.md`、AGENTS.md single-task 段；roles.toml 不动；本卡不改任何配置或测试代码。

## 状态

- 全部复核路径 PASS（plan-review / batch-review / workflow-final 教训+一致性两路径，P0/P1=0；F-C1 P2 未修保留为开放项）。
- 过程文档收口回填完成；**未 commit/push**——实现 PR 待主会话更新（`Relates to #86`），CI pending，Issue #86 open，PR 保持未合并。
- 用户减负人判待判（review.md 签名区不预签）；总表无（独立单卡），保留现场；本卡不自动安装技能。
