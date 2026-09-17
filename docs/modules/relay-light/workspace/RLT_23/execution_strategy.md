# RLT_23 · W1 执行策略

两批串行：C1 写派活通知与 `agent_lost` 监工判据；C2 写主控侧启动分叉与 F 收口项。两批均会触及 skill/adapter，C2 以 C1 checker PASS 为前置，只读最新文本再插入，不覆盖前批。按 `task_plan.md` 各自独立核验各 HC；同一 coder 回合一次只做一批。W2 先审计划，施工和两路复核由编排另行派发；worker 写完成信号即停。

| 角色 | 本卡职责与写入边界 |
|---|---|
| builder | W1 七件套及计划；不改 skill。 |
| plan-reviewer/checker | 只读核对并写各自检查结论、信号；不施工。 |
| coder | 每次一批，仅改当批 skill 文本和本卡进度/发现/教训候选；四行小结、测试与证据后停。 |
| reviewer-lesson/reviewer-consistency | 施工后独立两路复核，只写各自产出与信号；不代签。 |
| orchestrator | 派发、阶段与 F 收口；合并后从 master 主检出执行两侧 skill 重同步和逐文件 sha256 比对。 |

本卡 W1 的 Issue #38、worktree 和 D-start 来源见 `dispatch/README.md`；W1 commit 仅表示计划已落盘。任何测试绿或 review PASS 都不代表 verify、人工验收、PR/CI/合并。
