# review — RLT_07 教训路（devin-sub, fresh）

> 独立复核路径 lesson；只读复核。verdict 与逐条发现如下。

```text
REVIEW verdict=APPROVE_WITH_NITS
path=lesson card=RLT_07
candidates=0（lesson_candidates.md 为空表「暂无候选」，无逐条可裁对象）
findings=P0:0 P1:0 P2:0 P3:3
```

## 复核范围与方法

- 复核对象：`docs/modules/relay-light/workspace/RLT_07/lesson_candidates.md`（空表）。
- 已读：七件套全文 + `reviews/code-round1-devin-sub.md`；git reflog 全链与 progress.md 逐条相符。
- 去重语料：`docs/modules/dh-relay/knowledge/教训库-候选.md` 全 87 条候选逐条扫过；RLT_01/03/05 lesson 工件与教训复核报告作判级与格式参照。
- NOT_RUN：无 shell 执行权限，未跑测试套件；提交链经 reflog 文件核实。

## lessons-absent 判定

`lessons-absent` 大体可核查成立但不完整：空表无伪造候选；但顺查出 2 项达登记门槛事项未进工件（P3-1/P3-2），1 项属一致性域的顺记（P3-3）。按 RLT_05 先例（漏登记=P3、由有权节点 clerical 闭合、不阻断），不推翻教训路结论；不构成 RLT_03 式同量级否决。

## 发现列表（严重级|位置|问题|建议）

| 严重级 | 位置 | 问题 | 建议 |
|---|---|---|---|
| P3 | lesson_candidates.md（漏登记） | `decision.<k>.md` 撞名缺陷达候选门槛未登记。事实链：code-round1 P2——C/X 模板用 `<k>`（阶段实例/返工轮次）命名 `decision.<k>.md`，而 design/01 的 `decision.<n>.md` 落卡级共享目录，同卡 C1/C2/X1 的 decider 同写 `decision.1.md` 撞名覆盖；rework 已整改为 `<d>`（卡内决策序号）。可迁移规则：「模板占位符生成共享目录文件名时，其序号作用域必须 ≥ 目录的唯一性作用域；节点级序号装进卡级目录会同名覆盖」。库内 87 条无此触发形。 | 由有权节点补登记（本报告措辞可直接采用）。 |
| P3 | lesson_candidates.md（漏登记/漏点名） | F-002 事件至少欠一条重蹈/近失点名，处置模式可选为新候选。事实链：task_plan C-011 断言「attempt/decision-chain 语义已实现」实测半假——consult 下 `decision` 后直接 `resume` rc=0、auto 下 `user_decision` 不拒；处置为两条 `@unittest.skip` 钉住负例腿且理由链到 F-002，正例照常交付，小审/轮1 如实记「9 ok + 2 skipped、去向=F-002」。判定：①「计划内实现状态断言错误」是候选-54（派工前预审）的近失实例；②skip 条数+去向记账是候选-74 的被遵守实例；③「oracle 负例腿需越界改实现才能满足 → skip 钉住 + findings 去向 + 不伪造绿不越界」处置模式库中无逐字对应，作新候选亦成立。 | 至少补候选-54 近失 + 候选-74 被遵守点名行；③由裁决定（本卡已按 ③独立成候选登记）。 |
| P3 | brief.md:57/:61（顺记，非教训路靶子） | F-001 裁决落盘后 task_plan 已改写为「向 RLT_01 骨架填业务内容」，但 brief 仍残留裁决前措辞：「新建 SKILL.md、两份 adapter」（实为向骨架填内容）与「正式依赖 RLT_01（未开始）」（已经 PR #13/`25bdbcb` 合入）。finding 行本身记了 resolved，属文档陈旧非阻断。 | 供一致性路核对；不阻断教训路。 |

## 已排除项（看过但低于门槛）

- F-001 裁决链：流程按既有合同正确执行（候选-14 族实践 + 入口闸正常运作），F 系列跟踪即正确层级。
- 轮 1 其余 P3 整改：候选-6/46「断言判别力」族薄实例，低于独立候选门槛。
- A21 分句转需求方向路终裁：oracle 解释分歧走正式路径，流程正确应用。
- late-added discriminator 登记：被遵守，RLT_05 F-HLS-04 已建议入册，本卡无增量。

## 给父 agent 的交接说明

- 两条 P3 漏登记的回填须由有权写 `lesson_candidates.md` 的节点执行；本报告措辞可直接采用。
- 若主控认为 P3-1/P3-2 均低于门槛，空表 N/A 即完全成立——但裁决须显式留下「为何无新增」的理由。
