<!-- dh:v1 -->
# lesson_candidates — RLT_21

> 仅在施工/复核出现有证据且可复用的现场时追加；W 阶段不预判教训结论。

## 候选

| ID | 触发现场 | 可复用规则候选 | 状态 |
|---|---|---|---|
| L-001 | A138 施工：`user_decision launch_fix=` 按归属规则记在被止损 agent 实例名下后，该实例「最新事件」从 `agent_lost` 被顶成 `user_decision`，下游 A49 重拉资格检查直接拒掉合法重拉 | 账本语义里「记在某实例名下」的事件会改变该实例最新事件——凡新增记在既有实例名下的簿记/授权事件，必须同时审一遍所有读「最新事件」的判定（终态、重拉资格、ref= 引用、不可关归因），要么豁免该事件要么显式放行 | 候选 · 待复核 |
| L-002 | C2 返工：C1 对 oracle 里「`blocked`/`failed` 允许节点未关，但 note 必含 ref=」取了「ref= 仅在节点未关时兜底」的条件读，checker 判偏离——oracle 的分号句是「允许未关」与「必含 ref=」两个独立放宽/加严，不是条件绑定 | 读 oracle 的「但/且」连接句时默认两子句独立生效；条件读须先在 findings 显式登记并等复核确认再实现，同一现象级测试（既有用例被新规则打破）要跟着改夹具而不是改断言 | 候选 · 待复核 |
| L-003 | A143 复算：预演 `review.plan.md` 的最终 PASS 版把前两轮 FAIL 文本覆盖（R2 FAIL 只剩账本 `P1=P1-03R,P1-04` 与 PASS 闭合表可追）——单文件 review 工件按轮覆盖导致历史轮证据只能靠 git 历史/账本补回 | 复核工件如需多轮留痕，按轮落独立文件名（`review.plan.r1.md` 等）或在同文件追加轮次段而不是整篇覆盖；账本 checkpoint 的 `P1=<ids>` 行是兜底的发现清单 | 候选 · 待复核 |
| L-004 | A143 整改：oracle 证法写「复算 = 1 P1 + 4 P2」，但该数字只在「同根残留去重」口径下成立，而口径本身没冻结——checker 按「逐条可追溯」判 FAIL，worker 才发现 oracle 期望与冻结四类逐条计级不可兼得 | oracle/证法里的期望计数若依赖归并、去重或权重口径，立项时须把该口径一并冻结成可执行的判定规则；否则验收只能给出与冻结规则矛盾的期望数 | 候选 · 待复核 |
| L-005 | C1 收口事故：checker 结论未出前 coder#1 与 checker#1 都已记 `done`，checker 报 FAIL p1=3 时 A49 不许重拉、A60 不许给终态 agent 挂事件，节点内返工路当场堵死，三条 P1 只能整建制推到 C2 返工（RLT_12 树 `dispatch/monitor-C2.md:51-52` 事实段、`:63-64` 第一纪律、`:193-211` 冻结路由；本树 `check.C1.md:6-9`）。C2 按该纪律执行后 PASS（`check.C2.md:6-11`） | 冻结规则：「checker 出结论前 coder 与 checker 均不记 `done`；checker 报 FAIL 时保持 live，每条 P1 落一行 `checkpoint`（note 含 `routed_to=<同一 coder 实例>`），整改 prompt 发回同一 coder pane、复审也走同一 checker 实例，不新增 attempt、不新增 `agent_launch`；PASS 后才按 coder→checker 顺序记终态」——`done` 是状态机终态，落账时机决定返工边是否还存在。去重：与 L-001 不同源——L-001 是「归属事件顶掉 latest-event 读者」的数据语义风险，本条是「过早终态化切断返工生命周期」的编排时序风险，虽都触及 A49，成因与整改均不同 | 候选 · 待复核 |
| L-006 | C 阶段实测 Devin/codex 审批菜单**编号随选项数量变化**，按固定数字发键会误选；R1 派单已冻结「`read` 读菜单原文 → 找写着 `Yes (Approve once)` 那一行的编号 → `send-keys` 该编号 → 再 `read` 确认菜单消失」，并绝不选 bypass/全放行/`Edit command`/`Describe change`/`No`（RLT_12 树 `dispatch/monitor-R1.md:347-350`）。旧派单只写抽象 `<数字>` 未冻结动态定位（同树 `monitor-W1.md:65-66`、`monitor-C1.md:75-76`、`monitor-C2.md:113-114`） | 冻结规则：「审批菜单按菜单文案动态定位一次批准项 `Yes (Approve once)`，不按固定编号；发送后复读确认菜单已消失；绝不选 bypass / 全放行等选项，也不降 `--permission-mode` 重拉」——菜单编号属易漂移 UI 状态，固定编号可能把一次批准误变成其他动作。去重：L-001~L-004 分别覆盖 latest-event 数据语义、oracle 句读、复核工件耐久、计级口径冻结，均未覆盖 UI 语义定位与发送后二次确认 | 候选 · 待复核 |
| L-007 | C 阶段实测监工侧 `herdr agent wait` 间歇报 `PermissionDenied`（Os code 5）并打断回合；R1 派单改为每 30 秒对各 agent 跑 `get`+`read` 轮询（一轮≈9 分钟、未完进下一轮不空等）、Os code 5 退避 5~10 秒重试同一命令、连续 3 次失败才按异常处理、不得把工具抖动记 `agent_lost`（RLT_12 树 `dispatch/monitor-R1.md:210-215`、`:312`、`:351-353`；拉起前短等 `--until idle` 仍可用、抖动退避 `:353`）；`wait` 返回必须有接收者 `:49-50`、`:213` | 冻结规则：「长等一律 `get`+`read` 轮询，不靠 `herdr agent wait` 长阻塞；`PermissionDenied`/Os code 5 退避 5~10 秒重试同一命令；未达连续失败阈值（实测口径 3 次）不判 `agent_lost`——工具抖动≠失联；等待返回始终有接收者（推送/前台阻塞/退出唤醒三选一），watch 未实现不得结束回合空等」。去重：与 L-003 不同源——L-003 处理复核工件按轮覆盖的证据耐久性，本条处理等待机制与失联判定 | 候选 · 待复核 |
