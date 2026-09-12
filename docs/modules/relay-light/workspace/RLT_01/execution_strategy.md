<!-- dh:v1 -->
# execution_strategy — RLT_01

## 操作模型

本文件只冻结角色与节点边界，不派活。RLT_01 采用**手动派活**，单批交付：worker 把结构化 DONE durable 追加到 `progress.md` 后立即停止；不等待 `node_closed`，不在原会话自行续做。主控另派 normal 三路复核。

## 角色授权模板（待主控实际派单时填写）

| 逻辑角色 | 写权限 | 禁止事项 | 实际身份/授权 |
|---|---|---|---|
| construction writer | `skill/**` 三件骨架、`install_skill.py`、`test_install_skill.py`、RLT_01 workspace 中 progress/findings/lesson candidates | 不改 task_plan/review 结论；不写业务内容；不改 TOML/relay_log；不 verify | 待主控填写 |
| batch checker | 只读 diff/测试证据；报告落主控指定独立路径 | 不修代码、不替代 normal 三路复核 | 待主控填写 |
| scribe | 仅 `progress.md` | 不改代码/测试/计划/结论 | 待主控填写 |
| normal reviewers | 按 `review.md` 三条独立路径只读 | 施工者不得兼任；不得合并路径 | 待主控填写 |

## 批次同步点

`D-start 授权 → B1 骨架+安装器+测试 → DONE/小审 → normal 三路复核`

- durable signal 固定落 `progress.md`：`DONE task=RLT_01 batch=1 status=<READY_FOR_REVIEW|BLOCKED|CONSTRUCTION_DONE> evidence=<...> next=main-controller`。
- 任一歧义命中 open 项即写 `BLOCKED` 后立即停止，不向用户提问、不自行裁决、不等待异步信号。

## 收尾铁律

- 无有效行为红或全量绿，不得宣称 TDD 闭合。
- 无 normal 三路闭合不得进入验收备料。
- 允许对既有正确行为补 late-added discriminator，但必须如实登记，不能伪造红。
- 未授权复核、verify、merge 或 deploy。DevPlan 仍标「未开始」，本七件套建立不代表 D-start。
