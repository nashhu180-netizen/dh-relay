# RLT_24 C2 checker — commit 5f7a45d

## 结论

PASS（P1 0，P2 0）。C2 的 A156 reason 条件、五反例双入口、合法失败事实检索和状态字段冻结均与本批计划一致；独立定向及两项全量回归通过。本结论只覆盖 C2，不代替 C3/C4、正式复核或验收。

## 逐项核验

| # | 判据 | 结论 | 依据 | 整改动作 |
|---|---|---|---|---|
| 1 | C2 计划、RED 与 oracle | PASS | `task_plan.md:84-95` 的两个用例均新增于 `test_relay_log.py:7435-7567`。五反例（failed 缺 reason、空值、解码后纯空白；ok 带非空或空 reason）各通过 `assert_close_rejected_both` 真正执行 add 与直接植入 lint，断言退 A156/2、seq/字段错误与账本字节不变。有效 RED 见 `progress.md` E-C2-01：2 tests、6 个行为断言失败、无收集故障；GREEN 见 E-C2-02。合法 failed 行按 seq 与解码 object_id 从 JSONL 查回，lint 0，reason 原行可读；状态 JSON 各层键路径相同，阶段保持 open。 | 无。 |
| 2 | 允许路径与历史账本 | PASS | `git diff master --name-only` 只列两份允许的代码文件及本卡工作区；`git diff master --stat -- docs/modules/relay-light/relay/` 为空，历史 `rlt12-win-01/relay_log.jsonl` 与 master 的 SHA-256 均为 `3cd08fdc88e9d51be16997ad9dc1bd92fc89f3c00796345e0a0b3a229a5ed40b`。`rg --files -g '__pycache__/**'` 无新增缓存；`git diff --check` 通过。入场时 `progress.md` 已有未提交的 C2 信号顺序调整，checker 保留该改动。 | 无。 |
| 3 | 本批完成判据独立复跑 | PASS | 在 `tools/relay-light` 执行 `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseTests.test_a156_five_reason_rejections_add_and_injected_lint test_relay_log.RelayResourceCloseTests.test_a156_failed_reason_search_and_status_schema`：exit 0，2/2 OK。 | 无。 |
| 4 | 两项全量回归 | PASS | 独立执行 `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log`：exit 0，214/214 OK；仓根 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`：exit 0，`RELAY ALL PASS (SKIPPED: 1)`。 | 无。 |
| 5 | §3.4 wire format 与既有断言 | PASS | `relay_log.py:2254-2313` 仅在 C1 共用 `_close_note_fields` 内让空 `reason=` 进入 outcome 条件层；failed 的缺/空/纯空白 reason 与 ok 的任何 reason 均报 A156。其它键空值和非法编码仍由 A155 拒绝；add/lint 继续共用 `_validate_close_row`。`git show 5f7a45d -- tools/relay-light/test_relay_log.py` 仅新增测试/helper并改测试类说明，未删除既有断言；旧事件自由 note 未进入关闭解析。 | 无。 |

## 范围外发现

无。
