<!-- dh:v1 -->
# lesson review — RLT_21 X1

## 结论

PASS

- P1：0
- P2：0
- 范围：仅复审 R1 lesson 路三条 P1 的整改闭环、L-001～L-004 完整性，以及 `findings.md` / `progress.md` / X1 commit message 的漏网事实；未修改候选、既有复核、进度、实现、计划或 Git 状态。

## R1 三条 P1 闭环

### L-005 — CLOSED

- 规则原文：`lesson_candidates.md:14` 已冻结 checker PASS 前的完整生命周期：结论前 coder/checker 均不记 `done`；FAIL 时保持 live，每条 P1 以 `checkpoint` 且 `routed_to=<同一 coder 实例>` 回送，同一 coder 与 checker 实例继续整改/复审，不新增 attempt 或 `agent_launch`；PASS 后按 coder→checker 顺序记终态。该内容完整覆盖 `review.lesson.md:19`，没有弱化为泛泛的“晚点 done”。
- 证据：候选挂有 RLT_12 树 `dispatch/monitor-C2.md:51-52`、`:63-64`、`:193-211`，并挂本树 `check.C1.md:6-9`、`check.C2.md:6-11`；原始派单对应位置确实分别记录 C1 返工边被终态切断及 C2 的 live checkpoint/同实例复审/PASS 后终态顺序。
- 去重：候选明确区分 L-001 的 latest-event 数据语义风险与本条过早终态化造成的编排时序风险；成因、失效面和整改动作均不同，独立保留成立。

### L-006 — CLOSED

- 规则原文：`lesson_candidates.md:15` 已冻结按菜单文案动态定位 `Yes (Approve once)`、不得按固定编号、发送后复读确认菜单消失，并禁止 bypass/全放行；同时保留不得降低 permission mode 的安全边界。完整覆盖 `review.lesson.md:26`。
- 证据：候选挂有 RLT_12 树 `dispatch/monitor-R1.md:347-350`，该处逐步写明 read→按文案找编号→send-keys→复读；并以 `monitor-W1.md:65-66`、`monitor-C1.md:75-76`、`monitor-C2.md:113-114` 证明旧派单仅写抽象 `<数字>`。
- 去重：L-001～L-004 分别是 latest-event、oracle 句读、复核证据耐久和计级口径；均不覆盖 UI 菜单语义定位与发送后二次确认，独立保留成立。

### L-007 — CLOSED

- 规则原文：`lesson_candidates.md:16` 已冻结长等用 `get`+`read` 轮询、不依赖 `herdr agent wait` 长阻塞；`PermissionDenied`/Os code 5 退避 5～10 秒重试同一命令；连续 3 次阈值前不得判 `agent_lost`；等待返回始终有接收者，watch 未实现不得结束回合空等。完整覆盖 `review.lesson.md:33`，阈值和接收者要求均未含糊化。
- 证据：候选挂有 RLT_12 树 `dispatch/monitor-R1.md:210-215`、`:312`、`:351-353`，以及接收者约束 `:49-50`、轮询不空等 `:213`；这些位置分别证明轮询、退避、连续失败阈值、不误判失联和等待接收者。
- 去重：L-003 处理多轮复核工件覆盖导致的证据耐久性；L-007 处理等待机制和工具抖动下的失联判定，独立保留成立。

## L-001～L-004 完整性

- `lesson_candidates.md:10-13` 的四条原候选均仍存在；只读比较 `fc70185` 与当前 `435fad6` 对应四行无差异。
- `git show --stat 435fad6` 显示 X1 commit 对 `lesson_candidates.md` 仅追加 3 行；未修改、删除或合并 L-001～L-004。P1=0。

## 漏网事实反查

- `findings.md:20-22` 已把 X1 对 C1 三条旧 P1 的 commit、实现/用例位置、可复跑命令、自然终态与退出码分别登记为 F-010～F-012；没有只留在提交说明中的整改事实。
- X1 commit `435fad6` 的正文另记全量 181 tests、三组 `diff --check` 与四集合边界。这些是回归/边界证据，不是新的可复用 lesson；RLT_12 `dispatch/monitor-X1.md:171-172`、`:537` 明确 X1 无 scribe、不得更新 `progress.md`，过程账由监工 `stage_result` 与终端交接承载并在 F1 补录。因此当前不把它误报为漏登记 lesson。
- 对 `findings.md`、`progress.md` 和本轮 commit message 的交叉检查未发现新的、仅存终端或提交说明而应登记到 `lesson_candidates.md` 的候选。新候选：N/A（可核查结论）。

## F-009 / L-004 边界

`findings.md:19`、`lesson_candidates.md:13` 与 `check.C2.md:27-37` 仍将 A143 的 `3 P1 + 2 P2` 对 `1 P1 + 4 P2` 归为未冻结去重口径造成的合同分歧；本复审不翻案、不改 oracle，也不把该既有 P2 计入本轮新增 P2。边界保持。

## 四行小结

做了什么：逐条复审 L-005～L-007 的规则原文、证据、去重，并核 L-001～L-004 完整性与漏网事实。
证据：`lesson_candidates.md:10-16`、`review.lesson.md:14-33`、`findings.md:19-22`、RLT_12 `dispatch/monitor-X1.md:358-375` 及其引用的 monitor 行号。
偏离与 findings：PASS，P1=0，P2=0；新候选 N/A；F-009/L-004 原 P2 边界保持。
下一步：交 monitor 按 X1 节点规则收取本路 PASS，不进入下一节点。
