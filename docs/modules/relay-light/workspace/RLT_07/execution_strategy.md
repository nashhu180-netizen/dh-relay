<!-- dh:v1 -->
# execution_strategy — RLT_07

## 操作模型

本文件只冻结角色与节点边界，不派活。RLT_07 采用**手动派活**，三批严格串行但每批都是主控重新派发的独立 construction Node。worker 每批把结构化 DONE durable 追加到 `progress.md` 后立即停止；不等待 `node_closed`，不在原会话自行续批。主控另派小审并回送闭合结论后才开放下一批。**D-start 未授权**：本卡正式依赖 RLT_01 尚未交付（findings F-001），开工前须主控裁决依赖消解并单独授权。

## 角色授权模板（待主控实际派单时填写）

| 逻辑角色 | 写权限 | 禁止事项 | 实际身份/授权 |
|---|---|---|---|
| construction writer | `skill/**` 三件新文件、`test_relay_log.py`、RLT_07 workspace 中 progress/findings/lesson candidates | 不改 task_plan/review 结论；不改两 TOML/relay_log/安装器；不越批；不 commit/verify | 待主控填写 |
| batch checker | 只读本批 diff/测试证据；报告落主控指定独立路径 | 不修代码、不替代 heavy 复核 | 待主控填写 |
| scribe | 仅 `progress.md` | 不改代码/测试/计划/结论 | 待主控填写 |
| heavy reviewers | 按 `review.md` 的五条独立路径只读 | 施工者不得兼任；不得合并路径 | 待主控填写 |

## 批次同步点

`D-start 授权（待）→ B1 SKILL.md 核心+结构测试 → DONE/小审 → B2 五阶段模板+运行时合同 → DONE/小审 → B3 双 adapter+五件齐 → DONE/小审 → heavy review`

- 同一卡内不并行写；跨卡并行由主控决定。
- checker 只回答「本批是否偏离 task_plan」；heavy review 才回答整卡代码/需求/一致性/教训问题。
- durable signal 固定落 `progress.md`：`DONE task=RLT_07 batch=<n> status=<READY_FOR_REVIEW|BLOCKED|CONSTRUCTION_DONE> evidence=<...> next=main-controller`。
- 任一歧义命中 open 项即写 `BLOCKED` 后立即停止，不向用户提问、不自行裁决、不等待异步信号。

## 收尾铁律

- 无有效行为/结构红或全量绿，不得宣称该批 TDD 闭合。
- 无 batch 小审闭合不得越到下一批；无 heavy 五路闭合不得进入验收备料。
- 允许对既有正确行为补 late-added discriminator，但必须如实登记，不能伪造红。
- 当前未授权任何 Batch 施工；未授权复核、verify、merge 或 deploy。DevPlan 仍标「未开始」，本七件套建立不代表 D-start。

> 批注（2026-09-12）：本文件是 W 期冻结快照，按 RLT_05 先例不随施工推进改写；授权实况以 `progress.md` 日志为准（用户已明示授权开工、commit/push/PR 与复核合并链）。
