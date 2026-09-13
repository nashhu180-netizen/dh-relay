<!-- dh:v1 -->
# findings — RLT_07

> 只登记事实与建议；状态变化由主控裁决后回填，不由施工者自改。

## 登记项

| ID | 发现 | 影响 | 状态 |
|---|---|---|---|
| F-001 | 正式依赖 RLT_01（仓内 skill 骨架 + 安装器）在 DevPlan 仍标「未开始」；`tools/relay-light/skill/` 目前仅有 RLT_05 交付的 `roles.toml`/`dh-mapping.toml`，无 `install_skill.py` | 2026-09-12 用户裁决「那就先做01」：RLT_01 先开（Issue #12 / PR #13 / `wt/RLT_01`），本卡待其合入后 rebase 再 D-start；骨架三件由 RLT_01 建，本卡填业务内容不覆盖 | resolved · 2026-09-12 用户裁决 |
| F-002 | task_plan C-011 假设「decision-chain 语义已实现」不完全成立：`decision_mode` 的**模式门**未在 `relay_log.py` 实现——实测 consult 模式下 `decision` 后直接 `resume`（缺 `user_decision`）rc=0、auto 模式下 `decision` 后写 `user_decision` 同样不拒；而 A96/A114 oracle 要求这两腿退出 2。复现探针（worktree 内去 `@unittest.skip` 即红）：`python3 tools/relay-light/test_relay_log.py SkillTemplateTests.test_a114_consult_resume_without_user_decision_rejected SkillTemplateTests.test_a114_auto_mode_rejects_user_decision_on_decider_chain -v`——两腿断言 `exit 2`、实测被探事件 `rc=0` | A96/A114 的**负例腿**只能越界（改 `relay_log.py`）满足；本卡在 `test_relay_log.py` 以 `@unittest.skip` 落两条钉住的负例（F-002 引用），正例腿与其余行为断言照常交付。建议后续卡补 `add` 路径的 mode 分支：consult 时 `resume` 前置必须 `user_decision`、auto 时 decider 链出现 `user_decision` 即拒 | open → **主控裁决：排后续卡**（2026-09-12）——改 `relay_log.py` 超出本卡 allowed-paths；oracle 不动、负例腿保持 skip 钉住不伪造绿；后续卡补 `add` 路径 mode 分支后去 skip 即活 |
| F-003 | `cancelled` 不在 `relay_log.py` 的 `DECISION_EVENTS`（:59）中：`cancelled --agent strategist#<n>` 不会命中 A69 决策归属闸（仅靠终态/转移闸兜底），与 SKILL.md 决策归属段「cancelled（决策类）记触发 agent 名下」的写者合同存在实现层空隙——design §3.4:264 同源，文档忠实设计、属实现缺口而非文档错 | 与 F-002 同类：oracle/实现缺口挂账，不阻塞本卡交付；建议并入「decision_mode/决策类归属闸」后续卡的实现范围一并评估 | open → **主控裁决：随 F-002 排后续卡**（2026-09-12）——同属决策类归属闸实现缺口，与 mode 分支一并评估 |
