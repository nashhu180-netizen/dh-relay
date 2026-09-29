<!-- dh:v1 · task_plan.md -->
# task_plan — Issue #86 · 单卡一批

## 1. 要读的上下文 (Context Packet)

- 本目录 `task.md`（合同、授权原话、验收候选、边界）。
- 草案与审核：`docs/modules/relay-light/dev_plan/drafts/issue-86-document-agent.md`（末尾本轮范围调整注记）、`issue-86-document-agent-review.md`。
- 现役面：`tools/relay-light/skill/SKILL.md`「`single-task` 单卡接力模式」全节（标头与 phase 闭集、model-allocation gate、durable signal 与写者边界、watcher、恢复依据）；`references/adapter-claude-code.md` 与 `references/adapter-codex.md` 对应节；`AGENTS.md`「### single-task 单卡接力段」。
- 审核已核事实：现役 signal schema 无 document 确认字段、sole writer 仍分给 coder/reviewer/decider/orchestrator、恢复权威未登记文档 agent——实施必须把这些冲突写明为新协议内容，不得当成已具备。

## 2. 步骤（一批）

| # | 步骤 | 执行者 | 产出 / 判据 |
|---|---|---|---|
| S1 | plan：建卡七件套 + task_plan（本步已完成落盘） | builder#docs（本文档 agent） | 本目录 7 件 + DONE signal |
| S2 | plan-review：独立复核本卡与计划 | plan-reviewer `rlt86-plan-review`（fresh，swe-2-high） | round-1 READY_FOR_DOCUMENT → 转录确认 **PASS**（E-004）；F-R1 收紧闭合 |
| S3 | batch=1 施工：把 opt-in `document` 角色协议写入 SKILL.md + 双 adapter + AGENTS single-task 段；**不新增 phase**（九值闭集不动、不改测试代码），document 沿用文档所属现有 phase；默认写者模式不变 | 主会话（Codex，w4K:p1） | 三处一致；产品文档由主会话写，文档 agent 做过程回填 |
| S4 | batch=1 验证：文档一致性检查（三方写者规则无矛盾）+ 受影响现有测试（`test_install_skill.py` 九值闭集等结构测试回归，断言不因本卡改动） | 主会话 | 证据入 progress.md（文档 agent 回填引用） |
| S5 | batch-review：独立审核本批交付 | batch-reviewer `rlt86-batch-review`（fresh，swe-2-high） | round-1 READY_FOR_DOCUMENT → 转录确认 **PASS**（E-006/E-008）；F-B1 修订闭合 |
| S6 | workflow-final（light Recipe 两路）：教训复核 + 一致性复核 | `rlt86-final-lesson` + `rlt86-final-consistency`（各 fresh，swe-2-high） | 两路 round-1 READY_FOR_DOCUMENT → 转录确认均 **PASS**（E-010/E-011/E-013/E-014）；E2 code_review 如实 N/A |
| S7 | 收口回填：复核结果引用、验收挂证据、DA 覆盖/未覆盖如实登记；Codex 主会话效果原评（含 addendum）原样转录并经本人确认 MATCH（E-009/E-012/E-015）；远端 commit/push/PR 由主会话按单卡授权核对 | 文档 agent 回填；主会话远端 | review.md 收口区已回填；**远端未发生**（CI pending、Issue open） |

## 3. 施工内容要点（S3，主会话定稿）

- 新增 opt-in `document` **角色**（非 phase）：默认写者模式不变，仅在派单显式启用时接管获授权人工文档；不新增 document phase——九值 phase 闭集（plan/plan-review/batch/batch-review/workflow-final/e2-code-review/decision/watcher/human-acceptance）由 `test_install_skill.py` 冻结，本卡不改测试代码。
- phase 沿用规则：初建文档走 `plan`、施工记录走 `batch`、复核记录走 `batch-review`/`workflow-final`、收口走 `human-acceptance`；`path=document-<本次请求id>`。
- document 自有收口 verdict=`SYNCED`；`READY`/`SYNCED` 只表示文档处理完成，不能被路由当 PASS；责任 reviewer 核对转录后才发可路由 PASS。
- 写全：派单精确路径/来源版本/结论输入；同会话复用与独立 DONE；代笔错误回文档角色（不新增复核轮/attempt）；缺证/冲突/过期报「待同步」；协议约束不称程序硬门。
- 写全边界：原始日志、结构化结论、durable signal 仍归生产者；文档 agent 不施工/不测试/不验收/不派活；单写者与共享文档委托规则。
- AGENTS 与双 adapter 同步对齐，不留互相矛盾规则。

## 4. 关键决策

- 本卡是「过程文档委托」试跑：产品文档仍由实际执行者（主会话）写，过程文档由文档 agent 写——明确不宣称 DA-01 全类别通过。
- task_type=light 一批：无代码改动，E2 code_review 与有效单测变异记可核查 N/A，不虚构代码审核或测试。
- 复核者全部独立 fresh（plan-review / batch-review / 教训 / 一致性），施工者（主会话）与文档 agent 均不自审。
- 远端动作（commit/push/PR/merge/合入态复验）归主会话按 AGENTS 单卡授权执行；文档 agent 只按结果回填，不做远端操作。

## 5. 停止与升级

- 缺证、来源冲突、版本漂移：如实记 findings / 报「待同步」，不猜不补。
- 六类方向问题（方向/范围/验收/数据语义/安全/生产影响）或复核超限：经 decider / 用户路径停报，不擅自扩范围。
- 任何对运行代码、daemon、账本、在途卡迁移的需求出现即停，回用户确认。
