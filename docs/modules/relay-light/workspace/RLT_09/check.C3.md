<!-- dh:v1 · check.C3.md -->
# check.C3 — RLT_09 B3 小审

- 候选：`75eb1a0`（B3 / A121）
- 范围：仅按 `audit.md` 模式 B 核 B3。
- 结论：**PASS**。

## task_plan 与 RLT-A-07 一致性

- 本批只新增 `RelayStatusProjectionTests.test_status_rereads_appended_stage_in_plan_order`，`relay_log.py` 零改动；现有 `_status_command` 每次经 `_runtime_plan` / `lint_plan` 重读计划，未引入缓存或固定阶段顺序。
- fixture 初始阶段顺序为 `W#1 → C#1 → X#1`，明确不是 WCRF；两次 `status --json` 之间只向同一 `relay_plan.md` 追加 `X2` 节点行及满足 A75/A24 所必需的 coder agent 行，符合 RLT-A-07 澄清口径。
- 用例对两次调用间的 `relay_log.py` 与 `relay_log.jsonl` 分别冻结 SHA-256；并冻结整个 fixture 目录文件名与逐文件 hash，断言唯一变化文件恰为 `relay_plan.md`。
- 第二次 status 的 `stages` 恰由 `[W#1,C#1,X#1]` 增为 `[W#1,C#1,X#1,X#2]`，旧前缀对象逐项不变；新增 X#2 为 pending、仅含节点 X2，顺序来自计划首次出现序。
- 追加无 active agent 的 F1 后，`status --json` 仍以 exit 3 / `HC-RL-A75` 拒绝。账本中的断言变异 RED 精确显示期待 F#1 时实际为 X#2；提交只保留最终正确断言，未伪称实现前行为失败。

## 路径与差异

- `git diff 75eb1a0^ 75eb1a0 --name-only` 共四项：`test_relay_log.py` 及 RLT_09 的 `progress.md`、`findings.md`、`lesson_candidates.md`，全部属于允许路径闭集。
- 未改 `relay_log.py`、`install_skill.py`、`tools/tests/**`、design 或 dev_plan；`git diff --check 75eb1a0^ 75eb1a0` 无输出。

## 复跑

- B3 定向：`python3 -m unittest -v tools.relay-light.test_relay_log.RelayStatusProjectionTests.test_status_rereads_appended_stage_in_plan_order`，exit 0，1 test 通过。
- Python 全量：146 tests，exit 0，`OK (skipped=2)`。
- PowerShell 全量：`pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`，exit 0，末行 `RELAY ALL PASS (SKIPPED: 1)`；包装段内 Python 146 与 install_skill 7 项通过。
- 测试生成的 `tools/relay-light/__pycache__/` 已删除。

本批未偏离 task_plan、未越允许路径，A121 行为与 RLT-A-07 澄清口径可复算，全量回归绿：**PASS**。
