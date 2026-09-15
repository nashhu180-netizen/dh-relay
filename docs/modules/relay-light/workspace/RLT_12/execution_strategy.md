<!-- dh:v1 -->
# execution_strategy — RLT_12 Windows Claude 首个真计划端到端 demo

## 操作模型

**编排 + 派单**，不是 solo。本会话 Claude Code（Herdr pane `wA:p1`）担任 relay-light 的编排 `orchestrator#1`，**只做三件事**：重读计划并为阶段建终端空间拉监工；等监工；读 `stage_result` 按 `outcome` 机械分路。编排不越级拉 agent、不做判断题、不缓存计划（SKILL.md 角色表 + 硬规则 10 的「放弃项」）。

真计划 `rlt12-win-01` 内的所有业务动作由监工按阶段派出的 agent 完成；本卡自身的 dev-harness 复核（normal 三路）另行按 `review.md` 派独立 fresh 复核者，**施工者不复核自己的卡**（AGENTS 宪章#5）。

## 角色、后端与写权限

| relay-light 角色 | 后端（实际启动方式） | 写权限 | 禁止事项 |
|---|---|---|---|
| orchestrator#1 | 本会话 Claude Code（Herdr pane `wA:p1`） | 账本控制事件（`plan_loaded`/`stage_start`/`monitor_launch`/`stage_close`）；本卡工作区证据 | 不越级拉 agent、不施工、不复核、不代签 verify |
| monitor#n | codex（启动串显式 `-m` 钉模型） | 账本节点与 agent 事件（`node_start`/`node_close`/`stage_result`/`monitor_restart`/`plan_amend`） | 不跨阶段存活、不施工、不复核 |
| builder | devin `swe-2-max` | RLT_21 工作区七件套与 `task_plan.md` | 不改程序、不改 DevPlan/design、不复核、不派活 |
| plan-reviewer | codex `-m gpt-5.6-sol --sandbox workspace-write` | `review.plan.md` | 只审 `task_plan`，不施工 |
| coder | devin `swe-2-max` | RLT_21 allowed-paths 内代码与 `findings.md` / `lesson_candidates.md` 追加行 | 不写 `progress.md`（写入者是 scribe，A67）、不自审、不越批 |
| checker | codex `-m gpt-5.6-sol --sandbox workspace-write` | `check.C<n>.md` | 只核是否偏离 `task_plan`，**不做复核**、不改文件 |
| scribe | devin `swe-2-medium` | `progress.md`；R/F 阶段另跑脚本与汇总 `review.md` | 不碰 `findings.md` / `lesson_candidates.md`；素材外的不得发明（A66） |
| reviewer | codex `-m gpt-5.6-sol --sandbox workspace-write` | 各自 `review.<路>.md` | 只读代码；不合并、不降级路径、不替主控裁决 |
| decider | codex `-m gpt-6-astra` | `decision.<d>.md` | 不改任何文件；可提「需要改计划」但不自行改 |
| strategist | 按 `roles.toml`（高档） | 全局方案文件 | 不改文件；结论不等于用户裁决 |

**Windows 沙箱说明**：`roles.toml` 给 reviewer 的 `launch` 是 `codex --sandbox read-only`，但 Windows 上 read-only 形态**能读不能写**（PR #22 的 DR-W-001），reviewer 需要写自己的 `review.<路>.md`，故改用 `--sandbox workspace-write`，**只读约束由派活 prompt 承担**。`roles.toml` 不改，实际启动方式逐节点写在 `relay_plan.md` 的 `launch` 列（与 Linux 预演同法）。相关缺口见 `findings.md` F-002 / F-003。

## 终端空间拓扑

- 编排独占一个终端空间（`wA`）。
- **一个阶段实例 = 一个终端空间 + 一个监工**，cwd 指向该卡 worktree；空间内 agent 都是根 tab 里的 pane，tab 层不用；一般不超过 4 个同时在场。
- 「终端空间」（运行现场的终端拓扑）与「任务工作区」（磁盘上的七件套目录）**不是同一个东西，不得混用**（SKILL.md 拓扑布局）。
- 阶段结束**关整个终端空间**；全计划结束后**先关空间再删 worktree**。

## 阶段收尾顺序（硬顺序，顺序反了会留占用）

```text
node_close → stage_result → stage_close → 关终端空间 → 工作树收口
```

出处：DevPlan §RLT_12 实施提示（正式输入 §5.2.1、§12）。每阶段收尾都要留证据，这是完成条件 #5（`HC-RL-H13`）的展示材料之一。

## 止损

- `attempt_max = 3`（节点实例内同一 agent 名重拉上限）、`rework_max_rounds = 2`（X 阶段轮数上限）。
- 两套计数**独立、不叠加、不互相重置**；任一先到上限即停 → 监工拉 strategist → 输出全局方案或建议停卡 → **永远交用户裁决**。

## 收尾铁律

- 证据不全 / 有 P0–P1 未关闭前，不许标「待验收」。F-004 在实跑期间保持 open 并持续监控。
- 子 agent 默认无写权，写权限逐角色按上表授予，越界即停并登记 `findings.md`。
- **等待必须有接收者**：`wait` 返回那一刻必须有接收者（前台阻塞循环 / 后台退出唤醒 / 账本文件事件监听）；watch 未实现时不得结束回合空等（SKILL.md 硬规则 8）。
- **凭据红线**：密钥/凭据值永不进 prompt、note、工件、账本；pane 截图与窗口枚举类证据先按白名单过滤，不靠事后扫描兜底。
- 收口前 `verify(relay-light):` 由用户在对话中确认后才提交；AI 不得代签、不得勾人类签名区（AGENTS 宪章#2、#4）。
