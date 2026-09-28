<!-- RLT_30 E2 code_review attempt 1 · kind=full · reviewer=fresh subagent（Claude Code Agent general-purpose，会话 rlt30-e2-review-1，未参与施工，只读）· 主会话按复核者回复原样摘录落账 -->
# RLT_30 code_review attempt 1

- 范围：`git diff 18540c7 7f72f14`（施工 `db103a8` + 证据 `7f72f14`）；25 文件均在允许路径闭集内。
- 结论：**approved**；P0/P1 = 0。
- 逐项：`relay_log.py` 只增 `STAGE_LEAD_INSTANCE_LABEL` / `_writer_label` / `_writer_display_name` 并用于 7 处报错/告警字面 + status 文本一行；`derive_last_writer`、`WRITER_BY_EVENT`、`CONTROL_AGENT_NAMES`、`_writer_from_agent`、`invalid by`、事件名、`SUGGESTED_ACTIONS`、`status --json` 键、错误码与退出码 2 零改动。task_plan §4 八行与代码逐行一致；A89/A93 含事件名报错未改；非注释 `monitor` 行全扫无漏改。§10.3 样张逐字一致且仍断言 `last_writer == "monitor"`。九值闭集、watcher 回退链、stage-lead 旧名兼容、roles.toml 12 角色、dh-mapping 两处、AGENTS 仅 42/51/52 行、as-built 历史行只加注——均成立。`grep_check.py` 冻结正则与 A15 promotion-check 一致，AGENTS 段截取第 40～53 行正确。变异 M1/M2 哈希可信；复核者另加 M3（`STAGE_LEAD_INSTANCE_LABEL` 退回 `"monitor#<n>"`）→ 3 条断言失败。F-001 处理合理。
- 复跑：grep_check PASS；`PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log test_install_skill` → Ran 294 OK（约 813 s）。

| ID | 级别 | 事实 | 处置 |
|---|---|---|---|
| CR-1 | P3 | task_plan §6 测试名、S4 证据文件名笔误 | 已改（F-004） |
| CR-2 | P3 | adapter 回退链/兼容句、AGENTS watcher 措辞无结构测试守护 | 后续项（F-005） |
| CR-3 | P3 | 既有：A85 close 告警在 by 合规、agent 不合规时同义反复 | 后续项（F-006） |
| CR-4 | P3 | grep 白名单整行放行 | 接受（F-007、L-01） |
