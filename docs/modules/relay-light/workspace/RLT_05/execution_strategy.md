<!-- dh:v1 -->
# execution_strategy — RLT_05

## 操作模型

本文件只冻结角色与节点边界，不派活。RLT_05 采用**手动派活**，四批严格串行但每批都是主控重新派发的独立 construction Node。worker 每批把结构化 DONE durable 追加到 `progress.md` 后立即停止；不等待 `node_closed`，不在原会话自行续批。主控另派小审并回送闭合结论后才开放下一批。RLT-A-06/RLT-B-06 已闭合；用户已独立授权 D-start，当前只开放 Batch 1。

## 角色授权模板（待主控实际派单时填写）

| 逻辑角色 | 写权限 | 禁止事项 | 实际身份/授权 |
|---|---|---|---|
| construction writer | 两 Python、两 TOML、RLT_05 workspace 中 progress/findings/lesson candidates | 不改 task_plan/review 结论；不越批；不 commit/verify | 待主控填写 |
| batch checker | 只读本批 diff/测试证据；报告落主控指定独立路径 | 不修代码、不替代 heavy 复核 | 待主控填写 |
| scribe | 仅 `progress.md` | 不改代码/测试/计划/结论 | 待主控填写 |
| heavy reviewers | 按 `review.md` 的五条独立路径只读 | 施工者不得兼任；不得合并路径 | 待主控填写 |

## 批次同步点

`B06 落盘 → 用户独立 D-start 授权（已完成） → B1 config/resolver/Recipe → DONE/小审 → B2 full read-status → DONE/小审 → B3 add-lifecycle/A89 → DONE/小审 → B4 limits/X planner → DONE/小审 → heavy review`

- 同一卡内不并行写；跨卡并行由主控决定。
- checker 只回答“本批是否偏离 task_plan”；heavy review 才回答整卡代码/需求/一致性/教训问题。
- durable signal 固定落 `progress.md`：`DONE task=RLT_05 batch=<n> status=<READY_FOR_REVIEW|BLOCKED|CONSTRUCTION_DONE> evidence=<...> next=main-controller`。
- 任一歧义命中 open 项即写 `BLOCKED` 后立即停止，不向用户提问、不自行裁决、不等待异步信号。

## 收尾铁律

- 无有效行为红或全量绿，不得宣称该批 TDD 闭合。
- 无 batch 小审闭合不得越到下一批；无 heavy 五路闭合不得进入验收备料。
- 允许对既有正确行为补 late-added discriminator，但必须如实登记，不能伪造红。
- 本轮已授权 Batch 1 施工；未授权后续 Batch、复核、commit、verify、merge、push 或 deploy。DevPlan 仅机械回填 RLT_05 为“进行中”，不代表施工完成。
