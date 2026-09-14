<!-- dh:v1 -->
# findings — RLT_21

> 只记事实、影响与可选方案；builder 不替 decider/orchestrator 选边。

## 登记项

| ID | 发现 | 影响 | 方案 / 状态 |
|---|---|---|---|
| F-001 | A138 要求在连续 NOT_RUN 的 blocked 出口后，由监工在同一 agent 名下记 `user_decision launch_fix=<token>`；现状 `_validate_agent_transition` 只允许 `user_decision` 跟 `decision`，`_validate_decision_ownership` 又按 A69/A114 active decision owner 约束，而此授权明确允许无 `blocked→escalate→decision` 起头 | 直接“豁免所有带 launch_fix 的 user_decision”会削弱 A69/A114；强造 decider 链又改变 A138 的 oracle | 案 A：新增仅在该 `(node, agent)` 已连续 `attempt_max` 条 NOT_RUN 且已有合法 blocked stage_result 时成立的窄授权分支，仍走同一事件归属闸；案 B：把 launch-fix 授权建成独立 helper/谓词但仍复用 `user_decision` 事件和 A69 owner 检查。B2 先用行为测试证明张力；无唯一解释则 `BLOCKED`，不选边 |
| F-002 | A139 定义 `launch_fix=` 为运行事实，不触发 `plan_amend`、lint 不校验；A121/A123 只在真实 `plan_amend` 发生时要求重读/摘要 | 若复用 plan launch 一致性或 amend history 校验，会误触 A121/A123；若完全忽略 token，又无法满足 A138 预算与 status | B2 将 token 解析限定在 agent launch/预算/status 投影，不写计划、不制造 `plan_amend`；保留 A121/A123 原测试。若现状存在隐式耦合则登记证据后 BLOCKED |
| F-003 | A140 的账本静默默认 30 分钟与 A83 的 wait/tick 20 分钟节拍数值不同 | 把两者合并会把提示误作挂死，或改变既有接收者兜底 | B3 明写两者并存：20 分钟只唤醒对账；30 分钟只标 `ledger_silent`，仍须三处核验 |
