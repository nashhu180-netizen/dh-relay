# RLT_24 C1 checker — commit 2dd5d77

## 结论

FAIL（P1 1，P2 0）。C1 定向测试与两项全量回归均通过，但计划列明的“编排终端空间只能指向 F 阶段首个有效节点”没有实现或反例证明；当前 `add` 接受了可辨识为编排空间却记在 C1 的关闭行。本结论只针对 C1，不裁决 C2–C4 或正式复核。

## 逐项核验

| # | 判据 | 结论 | 依据 | 整改动作 |
|---|---|---|---|---|
| 1 | C1 计划、RED 与用例 | FAIL（P1） | `task_plan.md:34,76` 明列编排空间非 F 首节点须 add/lint 退 2；`test_relay_log.py:7210-7239` 仅测阶段空间 C2 和 worktree 非 F，未测编排空间放 C1。`relay_log.py:2290-2328` 对所有 `workspace` 一律只检查所在阶段首有效节点。独立临时 fixture 实跑 `resource_close --node C1 --agent orchestrator#1 --note 'object_type=workspace object_id=orchestrator-ws outcome=ok'`：`add rc=0`，落入 seq 2；按计划此编排空间应指向 F1。C1 RED 记录在 `progress.md` E-C1-01（10 tests，62 assertion failures，非收集故障），GREEN 在 E-C1-02/03；其余清单用例已落地。 | 补齐编排空间非 F 首节点的 add 与直接植入 lint 反例、add 前后字节一致断言，并使实际校验拒绝该行。如果冻结的 `object_type=workspace` wire format 无法区分阶段空间和编排空间，按派单 BLOCKED 交 decider/编排裁定合同，不以 object_id 命名猜测或删除该计划判据代替整改。 |
| 2 | 允许路径与历史账本 | PASS | `git diff master --name-only` 仅两份 `tools/relay-light/` 文件与本卡工作区；`git status --porcelain` 干净，`rg --files -g '__pycache__/**'` 未报新增缓存；`git diff master --stat -- docs/modules/relay-light/relay/` 为空。历史 `rlt12-win-01/relay_log.jsonl` 当前与 `git show master:` 的 SHA-256 均为 `3cd08fdc88e9d51be16997ad9dc1bd92fc89f3c00796345e0a0b3a229a5ed40b`。 | 无。 |
| 3 | C1 完成判据独立复跑 | PASS（已覆盖部分） | 仓内 `tools/relay-light` 执行 `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseTests test_relay_log.RelayPlanLintTests.test_all_twenty_event_words_pass_lexical_validation test_relay_log.RelayPlanLintTests.test_add_rejects_unknown_and_case_changed_events_without_writing`：exit 0，11/11 OK。含 A2 二十词合法上下文、三类关闭正例、双入口非法 note/归属、终态与重复尝试、旧 A85/A93 warning 用例；第 1 行缺口不被这组现有用例检出。 | 第 1 项闭合后重跑新增负例与本组。 |
| 4 | 两项全量回归 | PASS | 独立执行 `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log`：exit 0，212/212 OK。仓根 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`：exit 0，`RELAY ALL PASS (SKIPPED: 1)`。`git diff --check` 通过。 | 第 1 项整改后重跑。 |
| 5 | §3.4 wire format 与既有合同 | PASS（第 1 项除外） | `relay_log.py:2210-2347,2356-2367,2874-2919` 新增独立 note 解码/解析、按 object_type 归属、共用 `_validate_close_row`、关后 A93 豁免；`_lint_ledger` 只对 `resource_close` 执行严格语义。`git diff master -- tools/relay-light/test_relay_log.py` 仅将 19 词旧断言改为 20 词并增测试，未删除其它断言。旧事件自由 note 保持通用路径，非字符串 note 仍 ledger/4。 | 保留上述边界，仅处理第 1 项。 |

## 范围外发现

无。
