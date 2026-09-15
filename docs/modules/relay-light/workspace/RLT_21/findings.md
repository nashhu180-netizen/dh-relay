<!-- dh:v1 -->
# findings — RLT_21

> 只登记事实与建议；状态变化由编排/主控裁决后回填，不由施工者自改。

## 登记项

| ID | 发现 | 影响 | 状态 |
|---|---|---|---|
| F-001 | 承接 RLT_07 findings F-002：`decision_mode` 模式门未在 `relay_log.py` 实现——consult 下 `decision` 后直接 `resume`（缺 `user_decision`）rc=0、auto 下 decider 链出现 `user_decision` 不拒，A96/A114 负例腿要求 exit 2；`test_relay_log.py` 两条 `@unittest.skip` 钉住负例（`test_a114_consult_resume_without_user_decision_rejected` / `test_a114_auto_mode_rejects_user_decision_on_decider_chain`） | 由本卡 A142 在 `add` 路径补 mode 分支并去 skip 后关闭；RLT_07 原条目保持原状不改写 | 承接中 · 关闭归属=A142 |
| F-002 | 承接 RLT_07 findings F-003：`cancelled` 不在 `relay_log.py` `DECISION_EVENTS`（:59）中，不命中 A69 决策归属闸，与 SKILL.md 决策归属合同存在实现层空隙 | 由本卡 A142 一并实现 `cancelled` 归属校验后关闭 | 承接中 · 关闭归属=A142 |
| F-003 | 仓根无 `.gitignore` 忽略 `__pycache__/`（RLT_10 findings F-002 挂账，DRILL_01 已在预演分支交付）；`.gitignore` 不在本卡 allowed-paths 内 | Python 测试副产品有再入树风险；建议由编排裁决归属（预演分支 cherry-pick 或另卡承接） | 已登记 · 待裁决归属 |
| F-004 | A137 实现语义：`ref=` 是「节点未关」条件下的兜底——blocked/failed 仅在仍有未关节点时才强制 `ref=<agent>#<n>:(blocked\|agent_lost)` 且须为本实例该 agent 最新事件；全节点已关后 blocked/failed 无 ref 沿用旧合同（与 RLT_07 冻结 A118 用例一致）。另：`stage_close` 的节点全关检查先于 outcome 检查，故节点未关场景实际先报 A89 而非 A118 | C1 按 design L246 条件读实现并在用例中钉住两种报码路径；若复核判定应为「blocked/failed 恒需 ref=」需改实现与用例 | 已实现 · 待复核确认 |
| F-005 | A138 实现语义：授权的 `user_decision` 记在被止损实例名下后，该实例最新事件即变为 `user_decision`——A49 重拉资格为此放宽「带 `launch_fix=` 的 `user_decision` 视同可重拉」；oracle 未钉码的三种拒法（未止损授权、token 不一致/缺失、第二个 fix 组）统一报 `HC-RL-A107` | 决策类事件落在终端实例名下是账本既有归属规则的边缘情形，资格放宽是必要伴随改动；拒码选择待复核确认 | 已实现 · 待复核确认 |
| F-006 | A140 实现语义：`ledger_silent` 只标「最近事件非终态」的在场 agent——已 `done`/`agent_lost`/`cancelled` 的实例久置不标（否则每个已关节点的历史 agent 都会刷屏）；阈值比较为严格大于 `silence_timeout_min` | oracle 字面为「超过阈值的 agent」，收窄到非终态是降噪读法；若复核要求终态也标需改实现 | 已实现 · 待复核确认 |
