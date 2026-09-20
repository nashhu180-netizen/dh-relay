# R1 consistency review — RLT_27 retry02

## Verdict

**PASS**

guide、retry02 plan、冻结 config 与 retry02 实际证据在本次限定范围内一致。未发现阻断 R1 consistency 路的边界冲突；本结论不代表 R1/F1 已完成，也不代替 monitor 的账本终态、节点关闭或用户验收。

## P1（阻断）

- 无。

## P2（不阻断）

- 无。

## 一致性证据

- **retry 与路径**：`relay_plan.md`、`dispatch.md` 和 guide 均指向 `retry02` workspace，以及精确 plan-dir `docs/modules/relay-light/relay/rlt27-linux-codex-01/retry02`；当前 `status --json` 读取的也是该计划，未使用外层旧 plan 路径。
- **light recipe**：retry02 marker 为 `recipe=light`；冻结 `dh-mapping.toml` 的 light reviewer 集合恰为 `lesson`、`consistency`；retry02 agent 表也恰有这两路 reviewer，没有把 normal/heavy 路径混入本次 R1。
- **fresh 独立实例**：retry02 账本 seq 31 冻结 `reviewers=lesson,consistency`；seq 32/33 分别启动 `lesson#1` 与 `consistency#1`，均记录 `independent=fresh`，实例名为 `r27b-r-lesson` 与 `r27b-r-consistency`，位于不同 pane `w5:p2` / `w5:p3`。现场只读查询同时确认本 consistency 实例名、pane、cwd 与派单一致；该终端状态仅作身份佐证。
- **R FAIL 边界**：修正后的 `task_plan.md` 与 retry02 `dispatch.md` 都要求任一路 FAIL 后形成真实 `blocked`、停止并交回主会话，不回送已退场 C coder、不自动建立 X、不运行时改计划。retry02 节点链只有 W1/C1/R1/F1，没有 X 节点；`relay_plan.md` 也明确本次不作 runtime plan amendment。冻结 config 允许 `stage_result outcome=blocked`，且 `stage_close` 只接受 `done`/`cancelled`，与 FAIL 后不进 F 的停止边界相容。
- **intervention 与旧尝试**：retry02 plan、dispatch、guide、W/C durable evidence 与账本均明确 `coordinator_intervention=1` / `intervention=1`，没有宣称零干预。外层 attempt01 账本仍保留 seq 1–12，末态仍为 W1 `outcome=blocked`；retry02 使用新账本与 `r27b-` 实例，没有 resume 或覆盖旧尝试。因此 `attempt01=preserved` 与现证一致。
- **durable completion**：guide、checker 结论、findings/lesson candidate 和冻结 adapter 都明确 Herdr `idle` / `done` / `blocked` 只是检测状态或唤醒线索，不能替代角色产物、唯一完成信号与 monitor 账本闭合。当前 retry02 `status --json` 显示 R1 仍为 `open`，lesson#1 与 consistency#1 尚无账本终态，F1 仍 `pending`；故未把现场 `working` 或本 review 文件本身误报为 R1 durable completion。
- **既有阶段证据**：当前 retry02 lint 为 `lint: ok`；W1/C1 已在 retry02 账本内闭合，C1 guide 和独立 checker 均限制其结论，不外推 R/F、restricted sandbox、verify 或完整闭环。

## 边界结论

本 consistency 路仅确认上述文档、计划、冻结配置与实际 retry02 证据互相吻合。`retry02`、`intervention=1`、`attempt01=preserved` 均成立。下一步只允许 R1 monitor 消费本 review 与唯一完成信号，并等待 lesson 路；若任一路 FAIL，必须按既定 `blocked/stop/no X` 边界收口。
