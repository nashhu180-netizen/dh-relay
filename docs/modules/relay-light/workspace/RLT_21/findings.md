<!-- dh:v1 -->
# findings — RLT_21

> 只登记事实与建议；状态变化由编排/主控裁决后回填，不由施工者自改。

## 登记项

| ID | 发现 | 影响 | 状态 |
|---|---|---|---|
| F-001 | 承接 RLT_07 findings F-002：`decision_mode` 模式门未在 `relay_log.py` 实现——consult 下 `decision` 后直接 `resume`（缺 `user_decision`）rc=0、auto 下 decider 链出现 `user_decision` 不拒，A96/A114 负例腿要求 exit 2；`test_relay_log.py` 两条 `@unittest.skip` 钉住负例（`test_a114_consult_resume_without_user_decision_rejected` / `test_a114_auto_mode_rejects_user_decision_on_decider_chain`） | 由本卡 A142 在 `add` 路径补 mode 分支并去 skip 后关闭；RLT_07 原条目保持原状不改写 | 承接中 · 关闭归属=A142 |
| F-002 | 承接 RLT_07 findings F-003：`cancelled` 不在 `relay_log.py` `DECISION_EVENTS`（:59）中，不命中 A69 决策归属闸，与 SKILL.md 决策归属合同存在实现层空隙 | 由本卡 A142 一并实现 `cancelled` 归属校验后关闭 | 承接中 · 关闭归属=A142 |
| F-003 | 仓根无 `.gitignore` 忽略 `__pycache__/`（RLT_10 findings F-002 挂账，DRILL_01 已在预演分支交付）；`.gitignore` 不在本卡 allowed-paths 内 | Python 测试副产品有再入树风险；建议由编排裁决归属（预演分支 cherry-pick 或另卡承接） | 已登记 · 待裁决归属 |
