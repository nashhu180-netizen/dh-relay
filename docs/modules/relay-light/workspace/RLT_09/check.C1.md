<!-- dh:v1 · check.C1.md -->
# check.C1 — RLT_09 B1 小审

- 候选：`6edb32e`（B1 / A119 + A123）
- 范围：仅按 `audit.md` 模式 B 核 B1，不复审其他批次。
- 结论：**PASS**。

## task_plan 一致性

- A119：`_validate_event_semantics` 的控制事件分支对 `plan_amend` 调用专用 note 校验；非控制名写者精确报 A119，note 要有独立非 key 方案文件 token，且 `nodes=` 非空、逗号项逐项非空。`plan_amend` 未被纳入 `AGENT_EVENTS`，`_validate_stage_event` 仍不对它施加 stage 生命周期或 agent 状态转换；同一 monitor 连续写入不改变状态投影。
- A123：`stage_result` 依据其 `stage_id` 经 `_stage_entries` 只查询同阶段实例历史；有 `plan_amend` 时要求非空 `amend=` 与合法非空 `nodes=`，无 amend 历史时仅禁止 `amend=`，没有新增“无 amend 时禁止独立 `nodes=`”条件。
- 新增两条用例覆盖 task_plan 的 A119/A123 矩阵；既有 writer consistency、stage-result 投影与全量回归保持通过。未发现偏离 B1 task_plan。

## 路径与差异

- `git diff 6edb32e^ 6edb32e --name-only`：两份 Python 文件及 RLT_09 workspace 的 `progress.md`、`findings.md`、`lesson_candidates.md`，全部属于冻结允许路径。
- 本批未改 `install_skill.py`、`tools/tests/**`、design 或 dev_plan；`git diff 6edb32e^ 6edb32e --check` 无输出。
- `relay_log.py` 的 37 行新增仅涉及 `plan_amend` 写者/note 校验与 `stage_result` 的 A123 同阶段历史校验，无旁支行为改动。

## 独立复跑

- 定向：task_plan 原命令，exit 0，`Ran 2 tests in 8.188s`，`OK`。
- Python 全量：`python3 -m unittest tools/relay-light/test_relay_log.py`，exit 0，`Ran 143 tests in 169.850s`，`OK (skipped=2)`；skipped 数与施工账本基线一致。
- PowerShell 全量：`pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`，exit 0，末行 `RELAY ALL PASS (SKIPPED: 1)`；其中 relay-light Python 143 与 install-skill 7 项均通过。
- 复跑生成的 `tools/relay-light/__pycache__/` 已删除。

## 裁决

本批未偏离 task_plan、未越允许路径，目标用例与全量回归均可复算为绿：**PASS**。
