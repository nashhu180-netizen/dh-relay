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

## 证据账本 (Evidence Ledger)

| 证据 ID | 内容 | 路径 | 命令 / 结论 |
|---|---|---|---|
| E-001 | grep 检查在基线上 FAIL（监工 3、残留 29、`[monitor]` 段头 1） | docs/modules/relay-light/workspace/RLT_30/evidence/grep-baseline.txt | `python3 docs/modules/relay-light/workspace/RLT_30/evidence/grep_check.py` → exit 1 |
| E-002 | RED：全量 294 用例 11 FAIL（全部为新口径断言失败，无导入/路径错误） | docs/modules/relay-light/workspace/RLT_30/evidence/red.txt | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest -v test_relay_log test_install_skill` → FAILED (failures=11) |
| E-003 | grep 三项 PASS（监工 0、残留 0、白名单 W1+W4/W2 三行、`[monitor]` 段头 0） | docs/modules/relay-light/workspace/RLT_30/evidence/grep-after.txt | `python3 docs/modules/relay-light/workspace/RLT_30/evidence/grep_check.py` → exit 0 |
| E-004 | GREEN：Python 全量 294 tests OK | docs/modules/relay-light/workspace/RLT_30/evidence/regression-python.txt | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log test_install_skill`（`tools/relay-light/`）→ OK，exit 0 |
| E-005 | pwsh 全仓回归 RELAY ALL PASS（SKIPPED: 1，与基线一致） | docs/modules/relay-light/workspace/RLT_30/evidence/regression-pwsh.txt | `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` → exit 0 |
| E-006 | 有效单测变异 M1（status 显示映射）/ M2（`_writer_label`）：施加后 2 / 3 条断言失败，还原哈希回到原值后全过 | docs/modules/relay-light/workspace/RLT_30/evidence/mutation.txt | 见文件内命令与 exit |
