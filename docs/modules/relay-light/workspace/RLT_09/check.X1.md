<!-- dh:v1 · check.X1.md -->
# check.X1 — RLT_09 X1 小审

- 候选：`258a9be`（X1 复核整改；当前 HEAD 另含 exec 信号提交 `334f8fb`）。
- 范围：仅按 `audit.md` 模式 B 核 X1。
- 结论：**PASS**。

## A123 孤儿化修复与 RED → GREEN

- 在仓外临时目录以 `258a9be^` 的实现搭配候选新增用例，独立复现 exit 1、`FAILED (failures=1)`、`AssertionError: 2 != 0`：承载 `plan_amend` 的 C1 被 `superseded-by:C3` 后，无 `amend=` 的 `stage_result` 被错误接受（rc=0）。与 E-X1-01 的故障形态和原始结论一致。
- 候选下复跑新增 A123 用例、既有 A123 矩阵和 A119 重复写入合同共 3 项：exit 0，`Ran 3 tests in 15.415s`，`OK`，与 E-X1-02 一致。
- 实现只把 `_validate_stage_event` 内 `stage_amends` 的节点归因从活跃节点表改为全计划节点表；superseded 行继续提供原 `stage_id`，节点号仍受 A46 全表唯一约束。其它状态投影、告警、loss-stop 与 writer-handoff 的活跃节点口径未动，改动足够且未扩大语义面。

## 同步工件与允许路径

- `git diff 258a9be^ 258a9be --name-only` 共 7 项：两份 Python、RLT_09 的 `progress.md` / `findings.md` / `lesson_candidates.md` / `review.md`，以及 DevPlan。Python 与 workspace 均在本卡允许路径内；DevPlan 仅两处 RLT_09 的“Git tree 快照”措辞同步为“仓外原始工作树快照（raw bytes/mode/symlink）+ 只读 Git status”，属于用户明确确认的 RLT-A-07 同步范围，无第三处 DevPlan 改动。
- `lesson_candidates.md` 仅补 L-R-01/L-R-02 两条已发生现场；`review.md` 回填五路结论、批次小审和证据映射，并明确 X1 尚待复看、AI 结果不等于人验或 verify，未越权代签。
- `git diff master...258a9be --name-only` 的整卡集合仍限设计及 evidence/08、DevPlan、RLT_09 workspace、两份 Python、skill 与两 adapter；与 task_plan 冻结四集合及 RLT-A-07 授权项一致。`git diff --check 258a9be^ 258a9be` 无输出。

## 全量复算与证据账本

- Python 全量：exit 0，`Ran 163 tests in 254.783s`，`OK (skipped=2)`；测试数、退出状态与 E-X1-03 一致。
- PowerShell 全量：exit 0；包装段 Python `Ran 163 tests in 280.411s`、`OK (skipped=2)`，install_skill `Ran 7 tests`、`OK`，末行 `RELAY ALL PASS (SKIPPED: 1)`；与 E-X1-04 一致。
- E-X1-01..05 的命令、退出状态、测试数量、RED 症状、GREEN 结论及允许路径摘要均与本次独立复算/候选 diff 相符；运行耗时差异不影响判据。
- 测试生成的 `tools/relay-light/__pycache__/` 已删除。

X1 未偏离整改目标、未越允许路径；A123 supersede 载体孤儿化已由目标 RED 和候选 GREEN 咬住，两套全量回归绿，证据账本可复算：**PASS**。
