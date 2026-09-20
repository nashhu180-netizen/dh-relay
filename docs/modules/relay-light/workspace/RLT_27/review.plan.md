# RLT_27 W1 plan review

## 结论

FAIL。

## P1 findings

1. **R 阶段 FAIL 路由与冻结协议矛盾，且现有节点无法执行所写回路。** `task_plan.md:6` 规定 R 阶段 reviewer FAIL 后“同一 live 送审/判定方 checkpoint 往返”；但 R1 的 agent 只有 `lesson`、`consistency` 与 `scribe`（`relay_plan.md:23-25`），被审材料的 C1 coder 已不在本阶段，因而不存在可回送的同一 live 送审方。专用 `config/SKILL.md:99-112` 明确把复核后的节点级返工定义为 X 阶段：新 coder 修复，再由被打回路 reviewer 复审。当前计划节点表只有 W1/C1/R1/F1（`relay_plan.md:11-14`），同时禁止 runtime plan amendments（`relay_plan.md:28`），所以 R1 FAIL 时既不能按 `task_plan.md` 执行 live checkpoint，也没有 X 节点可承接返工。这属于节点/阶段边界矛盾并缺失可执行的失败路径，阻断 PASS。

## P2 findings

无。

## 其余核对与证据

- allowed-paths：生产代码、全局 Skill、Git/远端动作和清理均被禁止；worker 输出与唯一 completion signal 在 `relay_plan.md:7,18-28` 有界，未发现额外越界授权。
- 写入者边界：`task_plan.md:9` 与 `config/SKILL.md:230-232` 对 coder、scribe、reviewer 的写入职责一致；未发现 P1。
- W/C/R/F 主链、W1 close/trigger 与 light 的 lesson/consistency 两路在 `relay_plan.md:11-25` 可核对；除上述 R FAIL 路由外未见节点边界 P1。
- 验收与完成信号：F1 明示收拢 status/lint、工件与前置测试证据，`relay_plan.md:28` 规定每个 worker 的唯一 done 信号；未见单独 P1。
- 只读执行计划 lint，命令使用 `relay_plan.md:5` 声明的绝对 plan-dir/config-dir，并设置 `PYTHONDONTWRITEBYTECODE=1`；退出码 0，输出 `lint: ok`。该结果只证明结构 lint 通过，不覆盖上述内容合同矛盾。

## 回送要求

由 monitor 按 FAIL 路径 checkpoint 回同一 live builder。builder 需让 R 阶段失败处理与专用 Skill 的 X 返工边界一致，并为实际计划补齐可执行路由；不得直接封口 W1。

## Coordinator intervention 与原 P1 复查（2026-09-20）

- 保留以上初审 FAIL/P1 作为当时事实。`evidence/coordinator-W1-correction.md:3-5` 记录：原文作者主会话承认 `task_plan.md` 的 R FAIL 回路错误并实施文档修正；这是协调者干预，不是无人干预跑通，且未改 relay plan、账本、生产程序或全局 Skill。
- 当前 `task_plan.md:6` 已明确区分边界：W/C 同节点失败才由同一 live 送审/判定方 checkpoint 往返；R 任一路 FAIL 则记录真实阻塞并停止交主会话，不回送已退场的 C coder，也不自动建立 X 或改计划。
- 上述 R 路径与已授权 `dispatch-monitor.md:13` 一致：R reviewer FAIL 时不得声称 PASS、不得启动未计划 X，只记录 blocked 并说明。`relay_plan.md:11-14,23-28` 仍保持最小 W/C/R/F 节点与无 runtime plan amendments，现不再与修订后的 `task_plan.md` 矛盾。
- `config/SKILL.md:99-112` 的 X 模板定义的是实际进入节点级返工时的合同；修订后的计划没有宣称在当前最小授权内执行返工，而是于 R FAIL 处停止，因此不再缺失一个被计划承诺执行的 X 路径。
- 本次按派单仅复查原 P1，不扩大审查范围，不判断账本能否恢复。

### 当前结论

PASS。原 P1 已由已授权的 R FAIL blocked/stop 路径闭合；本次复查未产生新 P1/P2。
