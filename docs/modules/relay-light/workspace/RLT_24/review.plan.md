# RLT_24 W2 plan-review

## 结论

REVISE（P1 4，P2 0）。以下依据为 W1 计划与当前源码；尚未施工，未把计划中的预期测试当作已通过证据。

## 逐项判据

| # | 判据 | 结论 | 级别(P1/P2) | 依据（文件:行） | 整改动作 |
|---|---|---|---|---|---|
| 1 | 允许路径 | PASS | — | `task_plan.md:18,22,83,91`；DevPlan `P1-RelayLight-开发方案.md:455-458` | 无。四批代码、测试与取证均在闭集内，历史账本只读。 |
| 2 | 写入者边界 | PASS | — | `dispatch/README.md:47-63`；`task_plan.md:20,23,95-97`；`review.md:3-17` | 无。coder、checker、reviewer、编排的产出边界已登记。 |
| 3 | 批次边界 | PASS | — | `task_plan.md:25-27,52-56,65-67,79-83,95-97` | 无。A2/A155、A156、A158、A157 分别归 C1、C2、C3、C4；R/F 独立。 |
| 4a | A2 oracle 覆盖：20 个合法词 | FAIL | P1 | design/01 `01-RelayLight-产品设计与验收.md:1210` 要求 20 个合法词各在合法上下文和字段通过；`task_plan.md:35,48,50` 只明确词表 lexical 校验和新词一条合法 add。现有 `test_relay_log.py:990-994` 也只调用 `_validate_event`。 | 在 C1 列出 20 词逐个合法上下文、合法字段的可执行用例或逐词映射到保留的现有行为用例，并把该映射纳入完成判据；未知词退出 2 且字节不变继续保留。 |
| 4b | A155 object_id 取值 | FAIL | P1 | design/01 `01-RelayLight-产品设计与验收.md:312` 明定 worktree 用绝对路径；`task_plan.md:41-44` 只有绝对路径正例，没有相对路径反例。 | 在 C1 为相对 worktree 路径增加 add 与直接植入 lint 的退 2 用例和 add 字节不变断言；实现中明确校验解码后的路径。 |
| 4c | A155/A156/A157/A158 其余证明 | PASS | — | design/01 `01-RelayLight-产品设计与验收.md:1335-1338`；`task_plan.md:31,41-47,60-63,73-77,85-93` | 无。基础键、编码、归属、终态与重复、reason 五反例、旧实现状态比较、两类失败实跑/打桩及 seq/object_id 检索均有认领。 |
| 5 | wire format 与状态派生 | FAIL | P1 | design/01 `01-RelayLight-产品设计与验收.md:257,327-328` 允许新事件在 stage_close 后写且不改状态；`task_plan.md:11,32,47` 未点名 `relay_log.py:2664-2719` 的 `_ledger_warnings`，其中 `WRITER_BY_EVENT[event]` 两次直接索引（2675、2714），且 2707-2711 把任何 stage_close 后事件报为 A93 异常。 | 在 C1 的源码落点加入 `_ledger_warnings`：按已解码对象类别检查 owner，豁免合法 `resource_close` 的关后异常，并证明 pane/终端空间/worktree 合法行的 `status --json` 无新增错误或警告；旧事件 A85/A93 异常检查保持原样。 |
| 6 | RED、机械完成与回归 | FAIL | P1 | `task_plan.md:31,34,45` 要求非字符串 note 的直接植入 lint 退 2，同时要求通用行检查先行、原错误口径不变；当前 `relay_log.py:1541-1542,1572-1573` 对任何非字符串 note 在 `read_ledger` 已退出 4，尚未进入新事件语义校验。design/01 `01-RelayLight-产品设计与验收.md:318,323-328` 将非字符串 note 列为拒绝项，并要求新事件 lint 非法退出 2。 | 明确 `resource_close` 非字符串 note 的失败层级及退出码，调整 C1 fixture/helper 和校验顺序，使直接植入用例与设计、既有普通行错误合同同时一致；不得以尚未执行到的严格解析函数宣称覆盖。其余各批有效 RED 例外、命令、完成判据与全量回归已具备。 |
| 7 | 历史兼容与自由 note | PASS | — | `task_plan.md:33-34,65-77`；design/01 `01-RelayLight-产品设计与验收.md:221,301,1338` | 无。新解析限定于 resource_close，C3 从历史源复制 71 行并与 master 旧实现比较稳定状态字段。 |

## 范围外发现

无。

## 复审 r1

结论：PASS（上轮 P1 4/4 闭合；本轮新增 P1 0，P2 0）。复审范围仅为 commit `8b16065` 对 `task_plan.md` 的修订及其是否引入新 P1；这是计划结论，尚非施工或验收结果。

| 上轮项 | 结论 | 修订依据（`task_plan.md` 当前行） |
|---|---|---|
| P1 #4a：A2 20 词合法上下文 | 闭合 | 38、40–65、79、81：新增逐词合法 add 上下文、成功行与 seq 校验、`set(successful_events)==EVENTS` 汇总断言及独立运行命令；未知词字节不变保留。 |
| P1 #4b：worktree 相对路径 | 闭合 | 34、73：要求解码后绝对路径，并明确相对路径的 add/直接植入 lint 双入口退 2 与 add 字节不变。 |
| P1 #5：状态异常扫描 | 闭合 | 12、37、77–78、81：`_ledger_warnings` 加入源码落点，按解码对象类别判 owner；合法关后行不误报 A93，三类对象 `status --json errors=[]`，旧 A85/A93 warning 另有保留用例。 |
| P1 #6：非字符串 note 失败层级 | 闭合 | 36、75、81：明确新事件 lint `HC-RL-A155`/2、旧事件通用 `ledger`/4；非字符串仅直接植入 lint，不伪造 CLI add 反例，并要求 seq/note 错误信息。 |

修订差异只在本卡 `task_plan.md`；各新增要求仍归 C1，C2–C4 前置及 R/F 边界未变。未发现新 P1。施工者须按修订后的用例实际取得 RED/GREEN 和回归证据。
