<!-- dh:v1 -->
# lesson review — RLT_21 R1

## 结论

FAIL

- P1：3
- P2：0
- 范围：仅审查 `findings.md` F-001～F-009、`lesson_candidates.md` L-001～L-004、C1/C2 小审与进度账，以及 RLT_12 指定 dispatch / DR-W 证据；不修改候选、实现、计划或账本。

## P1（阻断）

### P1-1 — C1 的 `done` 时机堵死节点内返工，未进入候选

- 事实：C1 的 coder 与 checker 都被记为 `done` 后，checker 才留下 FAIL（P1=3）；A49 不许重拉、A60 不许给终态 agent 挂事件，节点内返工只能整建制推到 C2。RLT_12 的 C2 派单把它冻结为“第一纪律”：checker PASS 前两者都保持 live，FAIL 时把 `checkpoint` 挂在 live checker、实际整改发回同一 coder；PASS 后才按 coder→checker 顺序记终态。证据：`D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/RLT_12/docs/modules/relay-light/relay/rlt12-win-01/dispatch/monitor-C2.md:50`、`:51`、`:52`、`:63`、`:64`、`:193`～`:205`；本树 `check.C1.md:6`～`:9`。
- 判定：可迁移的协议级教训，不是本卡一次性事故；`done` 是状态机终态，落账时机直接决定返工边是否仍存在。
- 去重：与 L-001 不同源。L-001 是“新增归属事件覆盖 latest-event 读者”的数据语义风险；本条是“过早终态化切断返工生命周期”的编排时序风险，虽都触及 A49，成因与整改均不同。
- 整改：由 coder 在 `lesson_candidates.md` 新增独立候选，至少冻结“checker PASS 前 coder/checker 均不记 done；FAIL 走 live checker checkpoint routed_to 同一 coder；PASS 后 coder→checker 终态”的规则，并挂上述 C1/C2 证据。

### P1-2 — 审批菜单编号漂移的安全操作规则未进入候选

- 事实：C 阶段实测 Devin/codex 审批菜单编号随选项数量变化，固定数字会误选；现有运行派单已要求每次先读菜单原文，定位 `Yes (Approve once)` 当前编号，发键后再读确认菜单消失，并禁止 bypass/全放行等选项。证据：`D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/RLT_12/docs/modules/relay-light/relay/rlt12-win-01/dispatch/monitor-R1.md:347`～`:350`。早期派单只写抽象 `<数字>`，未冻结动态定位：同树 `dispatch/monitor-W1.md:65`～`:66`、`dispatch/monitor-C1.md:75`～`:76`、`dispatch/monitor-C2.md:113`～`:114`。
- 判定：可迁移的人机交互安全规则；菜单编号属于易漂移 UI 状态，固定编号可能把一次批准误变成其他动作。
- 去重：L-001～L-004 均未覆盖 UI 菜单的语义定位与二次确认，不同源。
- 整改：由 coder 新增候选，规则写成“按菜单文案动态找一次批准项，不按固定编号；发送后复读确认；禁止 bypass/全放行”，并保留实测与旧派单对照证据。

### P1-3 — `herdr agent wait` 间歇 PermissionDenied 的轮询/退避规则未进入候选

- 事实：C 阶段实测监工侧 `herdr agent wait` 会间歇报 `PermissionDenied`（Os code 5）并打断回合；R1 派单已改为每 30 秒对各 agent 执行 `get` + `read` 轮询，Os code 5 时退避 5～10 秒重试同一命令，连续三次失败才按异常处理，且不得把工具抖动记成 `agent_lost`。证据：`D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/RLT_12/docs/modules/relay-light/relay/rlt12-win-01/dispatch/monitor-R1.md:210`～`:215`、`:312`、`:351`～`:353`。
- 判定：可迁移的 Windows/Herdr 监控韧性规则；它区分控制工具瞬态失败与 agent 真实失联。
- 去重：L-003 虽也涉及运行证据耐久性，但处理的是复核文件覆盖；本条处理等待机制与失联判定，不同源。
- 整改：由 coder 新增候选，冻结“长等使用 get+read 轮询；PermissionDenied 退避重试；达到连续失败阈值前不判 agent_lost；等待返回始终有接收者”的规则，并挂上述实测证据。

## 既有候选逐项判定与去重

| 候选 | 一次性 / 可迁移 | 同源与去重结论 | 结论 |
|---|---|---|---|
| L-001 | 可迁移 | 与 F-005 同源（`findings.md:14`、`lesson_candidates.md:10`）；聚焦“归属事件改变 latest event 后必须复审所有 latest-event 读者”，与本轮新增 P1-1 不重复 | 保留 |
| L-002 | 可迁移 | 与 F-004 同源（`findings.md:13`、`lesson_candidates.md:11`）；聚焦 oracle 连接句的独立约束/条件绑定误读，不与 L-004 的计数归并口径重复 | 保留 |
| L-003 | 可迁移 | 与 F-009 的历史复算取证现场同源（`findings.md:19`、`lesson_candidates.md:12`），但提炼的是“多轮复核不可覆盖历史轮”；与 L-004 的计级口径冻结不同 | 保留 |
| L-004 | 可迁移 | 与 F-009 同源（`findings.md:19`、`lesson_candidates.md:13`）；准确提炼“期望计数依赖归并/去重时须先冻结可执行口径” | 保留，到点 |

L-001～L-004 之间未发现应合并的重复项；同源不等于同一教训，L-003/L-004 分别覆盖证据留存与计级口径。

## F-009 正面结论

F-009 的登记诚实且级别边界正确：按已冻结的四类逐条计级只能得到 `3 P1 + 2 P2`；要得到 oracle 的 `1 P1 + 4 P2`，必须额外引入未冻结的“同根去重/残留折级”。`check.C2.md:27`～`:37` 已明确把它裁为非施工缺陷的 P2 合同口径分歧并交编排/用户选择，未篡改 oracle，也未为了收工凑数。L-004 正好提炼了这一根因，因此 F-009/L-004 不构成本轮 P1，原 P2 边界应保持。

## commit / 终端事实反查

- 命令：`git log --format='%h%x09%s%n%b' master..HEAD`。四个提交的信息均可在 F-004～F-009 与 progress E2/E10/E12 中找到对应登记；未发现新的、只存在 commit message 而未登记的 A137～A143 施工事实。
- `findings.md:16` 已明确登记 C1 原始 RED 的逐字终端输出不可证、四行小结笔误与重建 RED 边界，没有把重建证据冒充原始证据。
- 但上述三条运行事实只在 RLT_12 派单中形成耐久证据，未进入本树 `findings.md`、`progress.md` 或 `lesson_candidates.md`；这正是 P1-1～P1-3 的教训收集缺口，不可用“终端里发生过”代替候选登记。

## 四行小结

做了什么：核完 F-001～F-009、L-001～L-004、C1/C2 小审与 RLT_12 指定事实，结论 FAIL。
证据：F-009/L-004 到点；C1 done 时机、审批菜单编号漂移、PermissionDenied 轮询三条均有文件行号实证。
偏离与 findings：P1=3、P2=0；未改候选、实现、计划、账本或 Git 状态。
下一步：coder 补三条独立候选后，重派 lesson 路复审。
