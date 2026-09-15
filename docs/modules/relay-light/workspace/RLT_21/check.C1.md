<!-- dh:v1 -->
# C1 checker — RLT_21

## 结论

FAIL

- P1：3
- P2：0
- 范围：仅 A137 / A138 / A139 / A140；未审 A141～A143，不替代 normal Recipe 的 R1 复核。

## P1（阻断）

### P1-1 — A137 在全节点已关时未强制 `ref=`

`brief.md` / `task_plan.md` 冻结口径是 `blocked` / `failed` 允许节点未关，但 `note` 必须含合法且最新的 `ref=<agent>#<n>:(blocked|agent_lost)`；C1 施工步骤 2 也写明两种 outcome “免节点关闭但强制 ref”。当前 `relay_log.py:2159-2168` 只在 `unclosed` 非空时调用 `_validate_result_ref`，并由 `test_relay_log.py:5224` 起的用例主动钉住“全节点已关可无 ref”的相反合同。因此 E5 所称“A137 与 oracle 一致”不成立。

可执行整改：令 `blocked` / `failed` 无论节点是否已关都执行 `_validate_result_ref`；删除或改写“fully closed keeps old contract”用例，补齐 fully-closed 的 blocked、failed 缺 ref 均 exit=2 且报 `HC-RL-A137`，合法最新 ref 保持接受。

### P1-2 — A137 的 `stage_close` 负例报码不是冻结的 A118

`task_plan.md` 与 `brief.md` 的 A137 证法明确要求“`stage_close` 对 `blocked` 仍拒 A118”。当前 `_validate_stage_close` 在 `relay_log.py:2219-2227` 先以未关节点报通用前置码，之后才检查 blocked；对应测试 `test_relay_log.py:5209-5221` 明确期待 `HC-RL-A89`。这证明拒绝动作存在，但精确 oracle 未满足。

可执行整改：在 `_validate_stage_close` 中取得本阶段最新 `stage_result` 后，先对 `outcome=blocked` 返回 `HC-RL-A118`，再执行节点全关等其余前置检查；把 A137 对应用例期望改为 A118，并复跑相关既有 A89/A112 生命周期用例防回归。

### P1-3 — 缺少 C1 原始 RED 证据，无法确认测试先失败

`done.coder.md` 仅登记 commit `a80fcde`；commit 未包含 `progress.md`，并发 scribe 后补的 E1～E6 只保存 GREEN（178 tests）、提交、diff 与静态核对，没有 A137～A140 各组在实现前的原始 RED 命令、摘要和退出码。`a80fcde^` 中也不存在这些新增测试类，故仅凭提交历史不能还原“先写测试并得到预期 RED”的原始运行事实。

可执行整改：优先从 coder 原会话/终端日志补录 A137～A140 各组实现前的命令、自然终态、退出码与预期失败点；若原始日志不存在，必须如实标记“原始 RED 不可证”，可另做 parent 实现 + 新增测试的重建 RED 作为补充证据，但不得把重建结果冒充原始证据。

## 已核通过项

- A137 的合法 ref、本阶段实例归属、最新事件约束，以及缺失/不存在/被 resume 或终态覆盖的拒绝路径已有测试且当前 GREEN；但不抵消上述两项 oracle 偏离。
- A138：NOT_RUN 连续计数、A107 止损、唯一 `launch_fix` 授权组、token 匹配、组内重新计数、第二组拒绝及 status 原因均有实现和用例，本轮通过。
- A139：`agent_launch.note` 的 `launch_fix` 为 note token，不要求 `plan_amend`；`status --json` 对有值/无值输出字符串/null，lint 不因计划 launch 不同而失败，本轮通过。
- A140：`dh-mapping.toml` 默认 30、缺键回退 30、覆盖值加载、按账本最新事件计算的 `ledger_silent` 提示均有用例；SKILL.md 与两份 adapter 均命中“三者均无变化”及“不得中断”原文，本轮通过。
- GREEN：本 checker 以 `PYTHONDONTWRITEBYTECODE=1` 运行 `python -m unittest -v tools/relay-light/test_relay_log.py`，自然终态为 `Ran 178 tests in 457.884s`、`OK (skipped=2)`、exit=0。两条 skip 属 C2/A142，未越界审查。
- 差异检查：`git diff --check a80fcde^ a80fcde`、当前 working tree `git diff --check`、index `git diff --cached --check` 均 exit=0。
- 边界：`a80fcde` 的 8 个改动文件全部位于 C1 允许闭集；`master...a80fcde` 的累计任务差异也仅位于 `tools/relay-light/{relay_log.py,test_relay_log.py,skill/**}` 与本工作区。当前额外 working-tree/untracked 项均为本工作区内的并发 W1/C1 工件或完成信号；未见 allowed-paths 外写入。

## 停止线

本节点只给 C1 小审事实与整改动作；不修改实现、不审 C2、不进入 R1、不作 verify/验收/远端动作。
