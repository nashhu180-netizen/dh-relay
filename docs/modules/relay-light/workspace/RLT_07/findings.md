<!-- dh:v1 -->
# findings — RLT_07

> 只登记事实与建议；状态变化由主控裁决后回填，不由施工者自改。

## 登记项

| ID | 发现 | 影响 | 状态 |
|---|---|---|---|
| F-001 | 正式依赖 RLT_01（仓内 skill 骨架 + 安装器）在 DevPlan 仍标「未开始」；`tools/relay-light/skill/` 目前仅有 RLT_05 交付的 `roles.toml`/`dh-mapping.toml`，无 `install_skill.py` | 2026-09-12 用户裁决「那就先做01」：RLT_01 先开（Issue #12 / PR #13 / `wt/RLT_01`），本卡待其合入后 rebase 再 D-start；骨架三件由 RLT_01 建，本卡填业务内容不覆盖 | resolved · 2026-09-12 用户裁决 |
| F-002 | task_plan C-011 假设「decision-chain 语义已实现」不完全成立：`decision_mode` 的**模式门**未在 `relay_log.py` 实现——实测 consult 模式下 `decision` 后直接 `resume`（缺 `user_decision`）rc=0、auto 模式下 `decision` 后写 `user_decision` 同样不拒；而 A96/A114 oracle 要求这两腿退出 2。复现探针（worktree 内去 `@unittest.skip` 即红）：`python3 tools/relay-light/test_relay_log.py SkillTemplateTests.test_a114_consult_resume_without_user_decision_rejected SkillTemplateTests.test_a114_auto_mode_rejects_user_decision_on_decider_chain -v`——两腿断言 `exit 2`、实测被探事件 `rc=0` | A96/A114 的**负例腿**只能越界（改 `relay_log.py`）满足；本卡在 `test_relay_log.py` 以 `@unittest.skip` 落两条钉住的负例（F-002 引用），正例腿与其余行为断言照常交付。建议后续卡补 `add` 路径的 mode 分支：consult 时 `resume` 前置必须 `user_decision`、auto 时 decider 链出现 `user_decision` 即拒 | open · 2026-09-12，待主控裁决（改实现 or 改 oracle or 排后续卡） |
