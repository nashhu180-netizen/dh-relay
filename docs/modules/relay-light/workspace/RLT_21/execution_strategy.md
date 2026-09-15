<!-- dh:v1 -->
# execution_strategy — RLT_21

## 操作模型

RLT_21 跑在接力计划 `rlt12-win-01`（计划与账本物理位于 **RLT_12 树** `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12`，分支 `wt/RLT_12`）下，五节点 W1 → C1 → C2 → R1 → F1 串行，每节点由当班监工派 worker 执行。**两树分工**：账本与计划仅 RLT_12 树，代码与本工作区仅 RLT_21 树（`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_21`，分支 `wt/RLT_21`，基线 master `6094887`）；任何 worker 不越树写文件、不调账本命令。本 builder 节点（W1）只产出七件套与本计划；施工、复核、收口由后续节点按 agent 表逐棒执行。

## 角色、写权限与禁止事项

| 角色（计划 agent 表） | 节点 / 职责 | 写权限 | 禁止事项 |
|---|---|---|---|
| builder#1（devin） | W1：七件套 + task_plan | `workspace/RLT_21/**` 七件套 | 不改 `tools/`、DevPlan/design；不施工、复核或派活 |
| plan-reviewer#1（codex） | W1：计划分级审核 → `review.plan.md` | 仅该输出文件（只读约束由 prompt 承担，DR-W-001） | 不改任何其他文件；light 措辞口径不适用——本卡 normal，P1/P2 分级按全量 |
| coder#1（devin） | C1：A137~A140 程序+模板施工 | allowed-paths 内代码/skill/test + findings/lesson 行 | 不写 progress（scribe 单写者）；不越批、不自审 |
| checker#1（codex） | C1：小审 → `check.C1.md`（只核 A137~A140） | 仅该输出文件 | 不替代 normal 复核，不修代码；P1 整改挂 live agent 名下 `routed_to=`（DR-W-004） |
| scribe#1（devin） | C1：`progress.md` 单一写入者 | `progress.md` | 不改代码/其他工作区文件 |
| decider#1（codex） | C1：on:blocked 裁决 → `decision.1.md` | 仅该输出文件 | 不改任何文件；不顺手扩 allowed-paths |
| coder/checker/scribe/decider C2 实例 | C2：A141~A143（同上分工；decision 序号全卡递增 → `decision.2.md`、`check.C2.md`） | 同上 | 同上 |
| requirement / lesson（codex） | R1：normal 双路独立复核 → `review.requirement.md` / `review.lesson.md` | 仅各自输出文件 | 只读复核，不改代码；不替编排做验收裁决 |
| scribe（devin） | R1/F1：机器体检+四道闸脚本+miner 汇总进 `review.md`；F1 收口备料 | `review.md` 指定区、as-built/交付汇报 | 不伪造复核结论；skill 重同步未获用户当次授权不动 |

## 批次同步点

```text
W1 builder done.builder.md(W_READY)
  → plan-reviewer → review.plan.md（W 审）
  → C1 coder 施工（A137~A140）→ scribe 记 progress → checker 小审 check.C1.md
      ├─ BLOCKED → decider decision.1.md → 编排重派
      └─ PASS
  → C2 coder 施工（A141~A143）→ scribe 记 progress → checker 小审 check.C2.md
      ├─ BLOCKED → decider decision.2.md → 编排重派
      └─ PASS
  → R1 requirement + lesson 双路 + scribe 体检汇总 → review.md
  → F1 scribe 收口备料（as-built / AI 提交区 / 交付汇报 / 证据展示）
```

- checker 未 PASS 不得开下一批；BLOCKED 未裁决不得绕行。
- X 阶段不在计划预留，由当班监工在 R1 打回后按 SKILL X 模板与 §4.4 追加规则现场追加（rework_max_rounds=2，超限 → strategist → 用户）。
- W_READY 不是 D-start；节点完成信号不是复核、verify、验收、push、PR、CI 或 merge。

## 结构化信号

每个角色完成时在本目录写 `done.<role>.md` 独立文件（跨节点同名角色用 `done.<role>.<node>.md`；派单另有指定时以派单为准），内容一行：

```text
task=RLT_21 role=<role> node=<node> status=<DONE|PASS|FAIL|BLOCKED|W_READY|...> evidence=<commit SHA 或文件名> next=monitor
```

写完信号立即停止，不等 `node_closed`，不自行启动下一角色或阶段。阻塞写 `status=BLOCKED`，并在 progress/decision 素材写明阻塞点、已试路径与需要的裁决。

## 现场约定（承计划冻结项）

- **DR-W-008**：`git rebase master` 被同 worktree WIP 拒绝时，`git merge-base HEAD master` + `git rev-parse master` 核查 HEAD 是否已含 master 顶点；成立则 no-op 并记一行，**不强推、不清 WIP、不 `--autostash`**。
- Windows 命令名 `python`；账本命令由监工在 RLT_12 树执行并显式 `--config-dir ~/.claude/skills/relay-light/`。
- codex 复核/决策类 `--sandbox workspace-write`，「只读」约束由派活 prompt 承担（DR-W-001）；codex 启动串显式钉 `-m`（DR-W-007）。
- 已知缺口按 Issue #23 口径运行期按现状执行（A112 无 blocked 终态 agent；NOT_RUN 走 `blocked → agent_lost` 重拉；`launch_fix=` 目前只是 note 文本）——本卡正是来补这三处的。
