<!-- RLT_30 教训复核 · reviewer=fresh subagent（会话 rlt30-lesson-1，未参与施工，只读）· 主会话按复核者回复摘录落账 -->
# RLT_30 教训复核

- 结论：**FAIL → 整改后闭合**。唯一重犯：候选-34/65（brief 基线 `master@7147bca` 手抄自会话快照、非 HEAD 祖先）→ LES-1 P2，主会话已改为 `724506c`（`git merge-base HEAD origin/master`，`--is-ancestor` 核验 7147bca 返回 1），见 F-002。该项为一行文档事实纠正，不涉代码，按 P2 不触发复查。
- 其余在册教训未重犯（先码后补、`__pycache__`、改过头、漏改、历史证据改写、只钉旧字面、变异不咬、新测试未入默认命令）。
- 新候选 L-01～L-03 → `lesson_candidates.md`。

| ID | 级别 | 事实 | 处置 |
|---|---|---|---|
| LES-1 | P2 | brief 基线误记 | 已改（F-002） |
| LES-2 | P3 | 白名单 W3 死条目未说明 | task_plan §3 已注（F-003） |
| LES-3 | P3 | red/grep 原始文件未含命令与 exit 行（命令登记在 progress） | 接受；后续证据统一脚本落「命令+输出+exit」 |
| LES-4 | P3 | 若返工改 relay_log/测试须重取变异与回归 | 本卡代码未返工，证据仍对应 `716329a` blob |
