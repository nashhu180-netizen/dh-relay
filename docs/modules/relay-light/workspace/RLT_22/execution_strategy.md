<!-- dh:v1 · execution_strategy.md — 分工。🟡 开工时定一次。 -->
# execution_strategy — RLT_22

## 操作模型

派子 agent，不 solo。本卡是程序 + 协议改动，三批串行（B1 → B2 → B3，切法与理由见 `task_plan.md`「批次切法」）：每批派一个零上下文 headless 施工 worker 只做本批，批末先跑本批目标用例与全量回归，再派一个 **fresh 小审**只看本批 diff 与证据、写独立 `check.B<n>.md`；小审 PASS 才开下一批。三批闭合且编排明确重派后，施工方才发 `CONSTRUCTION_DONE`，再拉 normal Recipe 的独立复核路径。监工只管本阶段节点的边界、信号与停棒，不替代任何业务角色。

**施工者不复核自己的卡**（宪章#5）：批次小审者与三路复核者均须是未参与本批实施的独立实例；复核路径不得由施工 worker 兼任。

## 角色后端与写权限表

| 角色 | 职责 | 后端（建议，由编排当次确认） | 可写 | 禁止 |
|---|---|---|---|---|
| orchestrator（编排） | 定批次顺序、裁决 `BLOCKED`、派活与重派、状态回填 | 主 session | 本卡工作区全部；DevPlan 回填由编排统一做 | 不亲自施工、不代签 verify、不替用户勾人验区 |
| monitor（监工） | 本阶段节点的信号、边界、静默与停棒 | Herdr pane 拉交互式终端 | 账本事件与监工派单记录 | 不施工、不审核、不裁决、不改 `review.md` 结论 |
| exec（施工 worker） | 按 `task_plan.md` 逐批施工 | headless coding agent（每批一个新实例） | `relay_log.py`、`test_relay_log.py`、`skill/**`、本卡工作区的 `progress.md` / `findings.md` / `lesson_candidates.md` | 不改 `design/**`、DevPlan、`AGENTS.md`、`tools/tests/**`、`install_skill.py`、其它卡工作区、RLT_12 工作树；不越批、不自审、不改 `task_plan.md`、不改 `review.md` 结论 |
| audit（批次小审） | 每批 fresh 小审，只看本批 diff 与证据 | 独立实例，与本批 exec 不同 | `check.B<n>.md` 与指定信号 | 不改代码/测试、不代替 exec 修问题、不把小审当 normal 复核 |
| decide（裁决） | 任一 `BLOCKED` 的独立裁决（尤其 findings F-002 / F-003） | 独立实例 | 指定 decision 记录与信号 | 不顺手扩允许路径、不改程序、不越过用户闸 |
| review（复核） | `CONSTRUCTION_DONE` 后按 normal Recipe 独立复核 | 独立实例，非施工者、非小审者 | 各路独立复核记录与 `review.md` 的对应登记位 | 只读代码；不合并、不降级路径、不替编排做验收裁决 |

**写权限硬边界**：允许路径闭集 = `tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/**`、`docs/modules/relay-light/workspace/RLT_22/**`。四集合核对（`git diff --name-only master...HEAD`、working tree、index、untracked）逐集合反选，任何越界即批次失败。子 agent 默认无写权，写权按上表由编排逐个授予。

## 终端空间拓扑

- **主控占左 pane**，worker 在右侧上下分屏（第二次 split 显式传目标 pane，不用 `--current`）。
- 派活默认走 Herdr 拉交互式终端；`claude` kind 用 `pane run` 绕 PATH shim。中文提示词走文件 / stdin，**不走 argv**。
- 每个 worker 的 `cwd` 必须是 `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_22`（任务树根），换 CLI 继续时先核对 `pwd`、`git branch --show-current`、`git worktree list` 三项一致。
- 交接字段固定登记：`worktree=D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_22`、`branch=wt/RLT_22`、`client=claude-code`、`baseline=544ccdb`。
- **只读取证**（读 RLT_12 树的 F-008 与账本）另开只读实例，不与施工 worker 混用同一 pane，避免误写另一棵树。

## 结构化信号

每个角色完成本节点后，在 `progress.md`「信号」节末追加独占一行，写完立即停止，不等 `node_closed`、不自行启动下一角色或阶段：

```text
DONE task=RLT_22 role=<builder|exec|audit|decide|review> batch=<W|1|2|3|R> status=<W_READY|PASS|FAIL|READY_FOR_REVIEW|CONSTRUCTION_DONE|BLOCKED|APPROVE|APPROVE_WITH_NITS|REQUEST_CHANGES> evidence=<逗号分隔> next=orchestrator
```

`W_READY` 不是 D-start 确认；`CONSTRUCTION_DONE` 不是复核、verify、验收、push、PR、CI 或 merge。

## 止损线

| # | 触发信号 | 立即动作 |
|---|---|---|
| 1 | 同一条 finding **连续 2 轮**「修完引入新问题」 | 不等第 3 轮，立即换人或编排直修；换人不重置轮次计数 |
| 2 | 返工已 **3 轮**仍有 open P0/P1 | 停下摆给用户裁决，禁止硬收口或无限循环 |
| 3 | 某批小审连续两次 FAIL 且问题同源 | 停批，回 `task_plan.md` 的批次假设复盘，由编排决定重切批次还是改派 |
| 4 | oracle（design/01 §11）与卡正文冲突，或必须改禁改路径才能满足验收 | 登记 finding + 证据，发 `BLOCKED`，交 decide/编排；**worker 不自行选边**（已知两处：findings F-003、F-004） |
| 5 | rebase 后基线出现 RLT_21 交付并与本卡改动冲突 | 停手记 `progress.md`，交编排裁决顺序（findings F-002），不硬解冲突 |
| 6 | 需要执行 `install_skill.py --all` 做两侧同步 | **停下取用户当次明确授权**：先展示 `%USERPROFILE%` 解析后的两个绝对目标；未授权则停在仓内验证，不得自行执行 |
| 7 | 任一工件将要写入密钥/凭据值 | 立即停止并改写为「步骤 + 值带外」；密钥值永不进 findings / progress / 设计验收契约 / 测试 / 日志 / commit message |

## 收尾铁律

- 证据不全 / 有 P0–P1 未关闭前，不许标「待验收」。
- 子 agent 默认无写权，要编排批准。
- 测试绿、小审 PASS、复核 APPROVE 都**不等于**用户验收、verify、push、PR、CI、merge 或发布。
- 没有用户在对话里的明确确认，AI 不得代签 `verify(relay-light):`、不得勾 `review.md` 的人类签名区。
