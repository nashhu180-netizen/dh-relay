<!-- progress.md — 施工日志 + 证据账本 -->
# progress — RLT_30

## 日志 (Log)

| 时间 | 事件 | 说明 |
|---|---|---|
| 2026-09-28 | D-start | 用户「确认开工」；worktree `/home/nash/work/dh-relay/.dh-worktrees/RLT_A_15`，branch `plan/RLT_A_15`；首个施工提交 SHA：`db103a8`（S1–S4 同一提交） |
| 2026-09-28 | S1 RED | 测试断言先改到新口径（A131 12 角色、§10.3 样张、A69/A85/A119 字面、九值集含 watcher、RELAY_RECEIPT/零写入改 watcher、新增 `test_rlt30_close_writer_messages_name_stage_lead_with_ledger_value`）；全量 294 用例 11 FAIL，均为预期断言失败 |
| 2026-09-28 | S2 | `relay_log.py` 显示层：`_writer_label` / `_writer_display_name` / `STAGE_LEAD_INSTANCE_LABEL`，七处字面 + status 文本；比较逻辑、事件名、JSON 键枚举零改动 |
| 2026-09-28 | S3 | SKILL.md、两 adapter、roles.toml（`[stage-lead]` + `[watcher]`）、dh-mapping.toml、AGENTS relay-light 两段、as-built single-task 快照；F-001 按「原名 monitor」落地 |
| 2026-09-28 | S4 | 全量回归两路绿；施工提交 `db103a8` |
| 2026-09-28 | S5 | 有效单测两处变异施加→断言失败→还原→绿 |
| 2026-09-28 | S6 | 三路 fresh 复核：code_review approved、需求 PASS、教训 LES-1 纠正后闭合；P3 登记 F-004～F-009；dh gate label-marker-mismatch 修卡格式（F-010） |
| 2026-09-28 | E10 | CI run 36378500616 三硬门 success；用户点选「已查看证据，认可收口」与 R30「认定为规划事件，不算越界」 |

## 证据账本 (Evidence Ledger)

| 证据 ID | 类型 | 内容 | 路径 | 命令 / 结论 |
|---|---|---|---|---|
| E-001 | check | grep 检查在基线上 FAIL（监工 3、残留 29、`[monitor]` 段头 1） | docs/modules/relay-light/workspace/RLT_30/evidence/grep-baseline.txt | `python3 docs/modules/relay-light/workspace/RLT_30/evidence/grep_check.py` → exit 1 |
| E-002 | test | RED：全量 294 用例 11 FAIL（全部为新口径断言失败，无导入/路径错误） | docs/modules/relay-light/workspace/RLT_30/evidence/red.txt | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest -v test_relay_log test_install_skill` → FAILED (failures=11) |
| E-003 | check | grep 三项 PASS（监工 0、残留 0、白名单 W1+W4/W2 三行、`[monitor]` 段头 0） | docs/modules/relay-light/workspace/RLT_30/evidence/grep-after.txt | `python3 docs/modules/relay-light/workspace/RLT_30/evidence/grep_check.py` → exit 0 |
| E-004 | test | GREEN：Python 全量 294 tests OK | docs/modules/relay-light/workspace/RLT_30/evidence/regression-python.txt | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log test_install_skill`（`tools/relay-light/`）→ OK，exit 0 |
| E-005 | test | pwsh 全仓回归 RELAY ALL PASS（SKIPPED: 1，与基线一致） | docs/modules/relay-light/workspace/RLT_30/evidence/regression-pwsh.txt | `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` → exit 0 |
| E-006 | test | 有效单测变异 M1（status 显示映射）/ M2（`_writer_label`）：施加后 2 / 3 条断言失败，还原哈希回到原值后全过 | docs/modules/relay-light/workspace/RLT_30/evidence/mutation.txt | 见文件内命令与 exit |
| E-007 | review | 需求方向复核 PASS：临时 HOME 安装副本 grep、fixture 实跑 status 文本 / `--json` 新旧 cmp、4 条写者错误、旧 `[monitor]` config 兼容 | docs/modules/relay-light/workspace/RLT_30/review.requirement.md | fresh subagent rlt30-requirement-1 |
| E-008 | review | E2 code_review attempt 1 approved（P0/P1=0，另加变异 M3 转红；全量 294 OK 复跑） | docs/modules/relay-light/workspace/RLT_30/review.code_review.attempt-1.md | fresh subagent rlt30-e2-review-1 |
| E-009 | review | 教训复核：LES-1 基线误记已纠正，新候选 L-01～L-03 | docs/modules/relay-light/workspace/RLT_30/review.lesson.md | fresh subagent rlt30-lesson-1 |
