<!-- dh:v1 · review.md — Issue #86 验收靶与复核登记。 -->
# review — Issue #86

> 本文件由文档 agent 代笔登记（用户例外）；各路复核结论由对应独立 reviewer 自写工件、本表只引用其结果与 signal，不代写结论、不预写 PASS。

## 最新采用决定（2026-09-29）

- **用户决定**：本轮对话明确「好的，那就不作为默认流程了」，随后要求更新文档。文档 agent 不作为默认流程，后续仅在用户明确指定试验时启用；常规文档由原责任方编写。
- **依据**：本次证明了分工可执行、缺证场景能停止，但尚未证明更快、更省或执行侧净减负；扩写范围、误记来源与重复副本漏改增加了核对成本。
- **对原评的修订**：下文 Codex 原评及原始证据保留为历史记录。其中「适合继续试用」不再作为当前建议；减少重复表格、按里程碑批量更新仅是待验证的改进假设，不足以支持默认采用。
- **验收边界**：此为采用方式的用户决定，不表示用户认可减负或 DA-08 通过，也不改变既有独立复核结论，不构成合并或安装完成的证据。下方表格与收口状态保留原记录时点，不据此推断当前远端状态。

## 验收靶

| # | 验收 | 类型 | 证据 | 结论 |
|---|---|---|---|---|
| 1 | 协议核心（SKILL）/ 双 adapter / AGENTS 三方一致，无互相矛盾的写者规则 | 机器证 | E-006/E-010：一致性复核四方核毕（写者闸/SYNCED≠PASS/RELAY_RECEIPT/watcher 零写/model gate/恢复权威） | 通过 |
| 2 | 本卡建卡与计划、一次施工回填、复核结果引用、收口回填均由文档 agent 实际完成 | 机器证 | 本目录七件 + document SYNCED signal 链（plan/batch/batch-review/workflow-final/human-acceptance 五棒） | 通过 |
| 3 | signal 与判断责任保留：durable signal / 复核结论由生产者自写 | 机器证 | SYNCED 从未被当 PASS 路由：batch-confirm-1.json objects_checked、final-consistency VF-5 实证链路 | 通过 |
| 4 | 缺证/冲突/过期输入不猜，报告待同步 | 机器证 | missing-source 缺证反例已实跑 BLOCKED（F-011，E-011 VF-7）；冲突/过期场景未实跑，不称全称 | 部分实证 |
| 5 | 文档检查 + 受影响现有测试 + PR 必需 CI | 机器证 | 19 tests 多方独立复跑绿（E-005/E-007/E-008/E-010/E-011）；**CI 待 PR 实际结果（pending）** | 部分达成（CI 未发生） |
| 6 | 用户判断过程文档委托是否减负可接受 | 人判 | Codex 效果原评已转录（E-009/E-012/E-015），非用户结论 | 待判（未代签） |

## 独立复核区（执行者 ≠ 复核者；light Recipe = 教训 + 一致性两路）

> 复核者均为独立 fresh 会话（Devin SWE-2 high），未参与建卡/施工；侦测型独立审核，非机器强制只读。各会话实态见 execution_strategy.md。

**plan-review**：reviewer `rlt86-plan-review`（w4K:t4/p4，fresh，未参与建卡）｜round-1 结论 READY_FOR_DOCUMENT（P0/P1=0）→ 责任方核对转录后 **PASS（可路由）**｜原始工件：[evidence/plan-review-1.json](evidence/plan-review-1.json) + `DONE.plan-review.reviewer-1.md`；转录确认：[evidence/plan-confirm-1.json](evidence/plan-confirm-1.json) + `DONE.plan-review.reviewer-confirmed-1.md`（mapping/收紧/来源区分核毕）｜findings：F-R1（P2，已采纳收紧闭合）；F-R2/F-R3（P3 审核信息项）｜后续已确认的同分工实例无需重复索权，变更模型才按 model-allocation gate 处理

**batch-review（batch=1）**：reviewer `rlt86-batch-review`（w4K:t5/p5，fresh，只审四产品文件 diff + 原始证据）｜round-1 READY_FOR_DOCUMENT（P0/P1=0）→ 责任方核对转录后 **PASS（可路由）**｜原始工件：[evidence/batch-review-1.json](evidence/batch-review-1.json) + `DONE.batch-review.reviewer-1.md`；转录确认：[evidence/batch-confirm-1.json](evidence/batch-confirm-1.json) + `DONE.batch-review.reviewer-confirmed-1.md`（F-B1 纯措辞修订核毕、修订候选复跑 19 tests OK、F-B3 事实纠正登记正确）｜findings：F-B1（P3，已修闭合）；F-B2/F-B3（P3 审核信息项，收口覆盖登记用）｜不据此标整卡 PASS

**workflow-final · 教训路**：reviewer `rlt86-final-lesson`（w4K:t7/p7，fresh）｜round-1 READY_FOR_DOCUMENT（P0/P1=0）→ 原 reviewer 核对转录后 **PASS（可路由）**｜原始工件：[evidence/final-lesson-1.json](evidence/final-lesson-1.json) + `DONE.workflow-final.lesson-1.md`；转录确认：[evidence/final-lesson-confirm-1.json](evidence/final-lesson-confirm-1.json) + `DONE.workflow-final.lesson-confirmed-1.md`｜教训重犯扫描：候选-34/11 家族复犯一次（首版 task.md 无依据扩写 + 错归因，草案尾注同文副本残留 F-L1，已追加更正并经确认核毕）；候选-40/87/89/49/68/12/44/52 与 RLT_11 F-005/F-007 应用未重犯｜findings：F-L1（P2，草案尾注更正已闭合）；F-L2（P3，relay-light 无模块 knowledge 目录如实记）；F-L3（P3 → lesson_candidates L-01）

**workflow-final · 一致性路**：reviewer `rlt86-final-consistency`（w4K:t6/p6，fresh）｜round-1 READY_FOR_DOCUMENT（P0/P1=0）→ 原 reviewer 核对转录后 **PASS（可路由）**｜原始工件：[evidence/final-consistency-1.json](evidence/final-consistency-1.json) + `DONE.workflow-final.consistency-1.md`；转录确认：[evidence/final-consistency-confirm-1.json](evidence/final-consistency-confirm-1.json) + `DONE.workflow-final.consistency-confirmed-1.md`｜四候选 hash 与修订证据逐字相符、19 tests 独立复跑绿、四方一致性核毕、docs-only 守住｜findings：F-C1（P2，adapter-codex pane/tab 单位不一致——主会话决定本轮保留**未修**，如实记为开放项，不冒充已闭合）

**E2 code_review**：N/A——本卡无运行代码改动（纯 skill 文档），按合同如实记 N/A，不虚构代码审核或变异测试。

**返工收敛**

| 路 | open P0/P1 | 处理 | 是否收敛 |
|---|---|---|---|
| plan-review | 0 | F-R1（P2）收紧闭合；F-R2/R3 信息项 | 是（PASS） |
| batch-review | 0 | F-B1（P3）措辞修订闭合；F-B2/B3 信息项 | 是（PASS） |
| lesson | 0（P2×1） | F-L1 草案尾注追加更正并确认闭合；F-L2/F-L3 登记 | 是（PASS） |
| consistency | 0（P2×1） | F-C1 主会话决定本轮保留**未修**，如实登记开放 | 是（PASS，遗留如实记） |

---

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：最弱处——① F-C1（P2，adapter-codex pane/tab 单位不一致）未修，仅如实登记；② document 转录路径在 e2-code-review/decision 上协议已定义但本卡未实证；③ 缺证反例只实跑 missing-source 一条，冲突/过期输入未实跑；④ 文档 agent 本卡曾两处事实错误（无依据扩写、错归因）且更正漏扫同文副本，准确性需持续核对；⑤ 计费用量不可得，不能据此判降本。

**完成条件逐条挂证据**：见上方「验收靶」六条逐行挂证据（1–3 通过；4/5 部分达成——冲突/过期未实跑、CI pending；6 人判待判）。

**风险放行账表**：F-C1（P2 未修，adapter-codex 措辞单位不一致；影响=Codex 侧操作员可能对 tab/pane 单位歧义；期限=留作后续修订轮；恢复=后续卡顺手收即可）——主会话已决定本轮保留。

**材料齐没齐**：[x] task / task_plan / execution_strategy / progress / findings / lesson_candidates / review + 全链路 signal 与原始 JSON

→ 当前状态：**全部复核路径 PASS（plan-review / batch-review / workflow-final 教训+一致性，P0/P1=0）**；收口回填完成。**未 commit/push**：PR #87 待主会话更新，CI pending，Issue #86 仍 open，用户减负人判待判——**不标整卡完成**。

---

## 原草案 DA-01～DA-08 覆盖登记（收口时如实填）

| DA | 本卡覆盖? | 说明 |
|---|---|---|
| DA-01 | 部分 | 过程文档委托实跑达成（建卡/计划/施工/复核引用/收口回填由 document 做）；产品文档仍由执行者写，非全类别 |
| DA-02 | 部分实证 | READY_FOR_DOCUMENT→SYNCED→原 reviewer 确认链路在 plan/batch/final 两路实跑；「故意改 FAIL→PASS」拒绝场景未演练 |
| DA-03 | 部分实证 | 每次派单精确路径+单写者实跑；越界写入/并写总表场景未演练 |
| DA-04 | 部分实证 | missing-source 缺证 BLOCKED 实跑（F-011）；冲突/过期输入未实跑，不称全称 |
| DA-05 | 部分 | document/复核/watcher 模型分配经 model-allocation gate 确认（swe-2-high，argv 核验）；能力预检/档位配置未涉 |
| DA-06 | 部分 | 受影响测试 19 项多方独立复跑绿；反例演练仅缺证一条；CI 待 PR 实际结果 |
| DA-07 | 部分 | 耗时/用量以可得值记录（建卡约 7 分 37 秒界面观察，非计费）；逐调用费用不可得记未知 |
| DA-08 | 人判待判 | 用户对减负可接受性未判；Codex 原评已转录（非用户结论） |

## 文档委托效果评价（Codex 主会话原评）

> 以下来自 `evidence/codex-record-effect.json`（producer=Codex main，2026-09-29），文档 agent 原样转录、不改写不补全。**这是 Codex 对本卡过程文档委托的评价，不是用户人判，也不构成文档 agent 对试跑成功与否的判断。** 原 scope：「本卡过程文档委托；非全部文档类别能力验收，非用户人验」。

| 维度 | 主会话原评（转录） |
|---|---|
| 准确性 | 修正后可用，但不能免核对。首版 task 无依据加入 roles.toml 条件写权；将 Codex 实施方案记作用户修正。主会话指出后由文档 agent 更正，原始记录和出处保留。 |
| 遗漏 | 建卡、计划、施工里程碑、复核引用已覆盖；空间迁移和模型/状态需由主会话提供真实来源。状态会随现场推进过期，不能从文档摘要推断 agent 仍在工作。 |
| 及时性 / 可接续性 | 首轮建卡可见终端耗时约 7 分 37 秒（界面观察，不是计费统计），后续短回填明显较短；串行回填和来源确认增加等待，本次没有可比单会话基线。 |
| 交接纠错负担 | 主会话少写了正式过程文档，但仍要给出路径/来源/决定并检查范围和归因。7 份过程工件某一时点共 278 行，存在重复；本次派单和模板选择也放大了开销，不能全部归因于模型。 |
| 证据边界（附） | 缺来源反例中 document 返回 BLOCKED reason=missing_evidence，未补造跨平台通过；这是强提示场景，只证明该场景，不证明对含糊输入有普遍保证。 |
| 可得耗时 / 用量 | 未获取逐调用计费/完整 token 统计；终端上下文占用不等于实际账单。不能宣称省钱或给出节省百分比。 |

**judgment（转录）**：技术分工可行，记录经核对后可用；本次尚未证明小型 skill 任务更快或更省。适合继续试用，但建议复用单文档会话、批量里程碑回填、减少重复模板；这些是后续建议，不在本卡擅改流程。

**not_claimed（转录）**：用户已认可减负 / 全部 DA-01 类别已实跑 / 尚未发生的最终复核、CI、合并通过——均未宣称。

**addendum（转录，`evidence/codex-record-effect-addendum.json`，2026-09-29）**：最终教训复核发现：来源归属纠正后，草案尾注仍残留同类错记。说明文档 agent 会漏掉重复副本，更正必须按引用/相同断言检查全部获授权落点。该发现加重准确性核对负担，不改变原评「可行但未证明小任务更快更省」。responsibility_note：本卡初建模板/多次交接由主会话组织，开销不能全部归因于便宜模型；独立复核耗时亦应与文档回填分开。

**转录确认（Codex 本人）**：原评与 addendum 转录经 Codex 主会话核对 MATCH（`evidence/codex-effect-confirm.json`、`codex-effect-addendum-confirm.json`）——仅证明其本人评价被忠实转录，非独立产品复核或用户验收。

## 人类签名区

待收口。DA-08 类用户判断未取得前不代签、不称全验收通过。

### 确认记录（append-only）

- 2026-09-28：用户确认——文档/复核/watcher 角色全部用 Devin SWE-2 high、按单卡流程执行；「放当前space不开新space」（w4S→w4K 迁移）。另：九 phase 沿用/document 为角色非 phase/path=document-<id>/verdict=SYNCED 为 **Codex 主会话提供的实施方案**（非用户原话），用户本轮冻结的是分工与模型。

- 2026-09-29：用户确认「好的，那就不作为默认流程了」，并要求「文档里更新下」。Codex 主会话据此直接补记上方「最新采用决定」；未委托文档 agent，未代签减负验收。
