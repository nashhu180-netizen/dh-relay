<!-- dh:v1 -->
# lesson_candidates — RLT_07

## 候选（施工期追加，W 阶段不预判结论）

| ID | 触发现场 | 可复用规则候选 | 状态 |
|---|---|---|---|
| L-001 | RLT_07 代码轮1 P2：C/X 模板以 `<k>`（阶段实例/返工轮次）命名 `decision.<k>.md`，而 design/01 的 `decision.<n>.md` 落卡级共享目录——同卡 C1/C2/X1 的 decider 同写 `decision.1.md` 撞名覆盖、证据链断档；整改为 `<d>`（卡内决策序号） | 模板占位符生成共享目录文件名时，其序号作用域必须 ≥ 目录的唯一性作用域；节点级序号装进卡级目录会同名覆盖 | evidence-registered(reviews/code-round1-devin-sub.md P2, commit 51e3bc2) · 待裁决 |
| L-002 | RLT_07 Batch 2：task_plan C-011 断言「attempt/decision-chain 语义已实现」实测半假——`decision_mode` 模式门在 relay_log.py 未实现，consult 下 `decision` 后直接 `resume` rc=0、auto 下 `user_decision` 不拒（探针实证，oracle 要求退出 2）。处置 = 两条负例腿 `@unittest.skip` 钉住（理由链到 findings F-002）+ 正例照常交付 + 小审/轮1 如实记「9 ok + 2 skipped、去向=F-002」。**候选-54 近失实例**（计划内实现状态断言错误，靠施工中探针逮到）；**候选-74 被遵守实例**（skip 条数与去向写进结论，不宣称全绿） | oracle 负例腿需越界改实现才能满足时，处置 = skip 钉住该腿（理由链到 findings 编号 + 复现探针 + 期望退出码）+ 正例照常交付 + 结论如实记账；不伪造绿、不越界改实现、不静默删断言 | evidence-registered(findings F-002, test_relay_log.py 两条 skip 腿, task_plan C-011) · 待裁决 |
