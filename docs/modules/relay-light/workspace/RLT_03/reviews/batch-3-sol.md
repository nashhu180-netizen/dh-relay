<!-- dh:v1 -->
# RLT_03 · Batch 3 独立只读复核（Codex）

## 结论

**verdict: changes-requested**

| 级别 | 数量 |
|---|---:|
| P0 | 0 |
| P1 | 2 |
| P2 | 2 |
| P3 | 1 |

Batch 3 的 attempt、四个豁免名、trigger/dependency、node start/close 主干行为大部分正确，但 `HC-RL-A60/A69` 仍有两个可复现的 fail-open：决策类事件可以错记到 decider/strategist 自身，且被阻塞 agent 可在 `decision` 后跳过 `resume` 直接 `done`。因此本批不能批准。

## 复核基线与边界

| 项 | 实测 |
|---|---|
| worktree | `/home/nash/work/dh-relay/.dh-worktrees/RLT_03` |
| branch / HEAD | `wt/RLT_03` / `baf2aad6aa5cf5b8fc0941411bbb30a0ebac8a6b` |
| 权威口径 | DevPlan `RLT_03` > design/01 §3.1–3.5、§5.1–5.3、§9.1–9.4、§14 RLT_03 验收表 > workspace `task_plan.md` |
| 受审生产路径 | `tools/relay-light/relay_log.py` |
| 受审测试路径 | `tools/relay-light/test_relay_log.py` |
| 唯一写入 | 本报告 `reviews/batch-3-sol.md` |
| 已保持的边界 | 未改生产代码、测试、DevPlan、progress/findings/review；未 commit、未派活、未进 Batch 4 / RLT_05 |

早期 Batch 1/2 报告只用于确认旧 finding 与范围边界；本结论由当前源码、冻结设计、独立复跑、对抗序列和变异实验得出。

## P1 问题

### P1-1 · HC-RL-A69 决策事件归属可被伪造成 decider/strategist 自身

design/01 §3.4 冻结：`escalate` / `decision` / `user_decision` 必须记在被阻塞/触发的 agent 名下，决策 agent 只写进 `note`；strategist 链的决策类事件同样归最后一个 X 阶段 coder。

当前实现只按每个 `(node, agent instance)` 局部检查前一事件（`relay_log.py:552-592`），没有把该链绑定到原始 coder，也没有验证决策者标识与事件归属。现有 `test_decider_and_strategist_escalations_stay_with_the_triggering_agent` 的 wrong-owner 反例是因 `decider#1` **未 launch** 而被 A60 拒绝，并未真正证明 A69 ownership。

独立对抗序列（均为真 CLI `add`）：

```text
plan_loaded -> node_start
coder#1 agent_launch -> blocked -> escalate(note=decider=decider#1)
decider#1 agent_launch -> escalate(note=decider=decider#1) -> decision decider#1
实测：decision rc=0（应拒绝，decision 应归 coder#1）

plan_loaded -> node_start
coder#1 agent_launch -> escalate(note=strategist=strategist#1)
strategist#1 agent_launch -> escalate(note=strategist=strategist#1) -> decision strategist#1
实测：decision rc=0（应拒绝，decision 应归触发 coder#1）
```

这不是 RLT_05/A114 的 `decision_mode` 完整链路实现请求；它是 RLT_03 已归属的 A69 事件 owner 约束未成立。

**必须修复**：在不引入 A85/A114 或完整 RLT_05 状态的前提下，将决策类事件绑到原始被阻塞/触发 agent，并增加“decider/strategist 已 launch 后仍尝试在自身名下写 decision”的真 wrong-owner 反例。

### P1-2 · HC-RL-A60 允许 `decision -> done` 跳过 `resume`

design/01 §3.4 冻结的 agent 图是：

```text
agent_launch -> checkpoint* ->
(blocked -> escalate -> decision -> [user_decision] -> resume)* ->
(done | agent_lost | cancelled)
```

当前 transition 表把 `decision` 和 `user_decision` 列为 `done` 的合法直接前驱（`relay_log.py:580-592`）。对抗序列 `agent_launch -> blocked -> escalate -> decision -> done` 实测整链 **rc=0**，跳过了必需的 `resume`。这会把“方案已决策”错记成“原 agent 已交付”。

decider/strategist 自身的生命周期 `done` 仍可以从其 `agent_launch` 合法进入；因此修复不需要实现 A114，只需禁止原触发 agent 从 `decision` / `user_decision` 直达 `done`。

**必须修复**：收紧 `done` 转移，补 `decision -> done` 与 `user_decision -> done` 反例，并保留 `... -> resume -> done` 正例以及 decider/strategist 生命周期的 `agent_launch -> done` 正例。

## P2 问题

### P2-1 · HC-RL-A58 的跳号/重号测试未隔离“不具备重拉前因”条件

当前实现正确：在 `coder#1 -> agent_lost` 后，独立实测 `coder#1` 重号和 `coder#3` 跳号均以 `HC-RL-A58` / rc=2 拒绝，`coder#2` rc=0。

但现有测试把重号/跳号都放在 `coder#1` 尚未终态时尝试；删除 `if attempt != prior_attempt + 1` 的变异后，`test_attempts_are_per_node_and_only_relaunch_after_authorized_causes` 仍 **OK**，因为 A49 的“不可重拉”闸仍会拒绝它们。这不足以证明 A58 的独立判别力。

**要求**：在 `agent_lost` 或 `cancelled` 这类合法重拉前因后，分别断言重号、跳号被 A58 拒绝且精确 `+1` 被接受；删除精确递增闸的变异必须转红。

### P2-2 · HC-RL-A17 “close agent 已 done，其他已 launch agent 未终态”的指定反例未被单测咬住

当前实现正确：`checker#1 done` 但已 launch 的 `coder#1` 仍 open 时，`node_close` 以 `HC-RL-A17` / rc=2 拒绝，并点名 `coder#1`。未 launch 的非 close agent 不计入条件 1，独立正例 rc=0；配置的 close agent 未 done 仍由 A74 拒绝。

但现有 `test_node_close_requires_all_terminals_and_configured_agent_done` 第一次 close 时恰好是 close agent 自身未终态，第二次是 close agent `agent_lost`，两次都可由 A74 单独拒绝。把 `for launched_agent in launched_agents` 换成空集后，该测试仍 **OK**。

**要求**：补冻结验收文字指定的 A17 反例：close agent 已 `done`，另一已 launch agent 无终态，断言 close 被拒绝并列出该 agent；禁用条件 1 的变异必须转红。

## P3 问题

### P3-1 · pycache 仍依赖手动清理

`.gitignore` 仍未覆盖 `tools/relay-light/__pycache__/` / `*.pyc`，每次 unittest/py_compile 会产生两个未跟踪文件。本复核已精确删除自己生成的两个 `.pyc` 及空目录，最终 `find tools/relay-light -name __pycache__ -o -name '*.pyc'` 为空。`.gitignore` 不在 RLT_03 允许路径，本 worker 不修；主控后续必须精确暂存两个 `.py` 或在另有授权下处理 ignore，不得把 pycache 带入提交。

## 逐项核验摘要

| 审核面 | 结果 | 证据 |
|---|---|---|
| A50/A49/A58 per-`(node,name)` attempt | 实现主干正确，A58 单测判别力不足 | 跨 W1/C1 同名均从 `#1`；同节点 loss 后只接受 `#2`；M1 存活，见 P2-1 |
| A59 四个 launch 豁免 | 通过 | 精确集合 `{orchestrator, monitor, planner-amend, strategist}`；加第五个 `outsider` 的 M2 使目标测试转红 |
| A60 agent 矩阵/终态封口 | **失败** | 终态后 checkpoint 被拒；绕过终态双层守卫的 M3 转红；但 `decision -> done` 实测错误放行，见 P1-2 |
| A68 node_start/node_close/monitor_restart | 通过 | node_start 重复拒绝；launch 前置成立；node_close 重复拒绝；monitor_restart 在 node_start 前与 close 后均接受 |
| A69 控制事件分类/升级归属 | **失败** | 普通 agent 写控制事件会被拒；但已 launch decider/strategist 可在自身名下写 decision，见 P1-1 |
| A70/A77 trigger | 通过 | on:done 只认最新 `done`；on:blocked 在无阻塞现场与 resume 后拒绝；禁用 trigger 闸的 M5 转红 |
| A78 dependency/node-start | 通过 | 依赖未 close 拒绝 node_start；无 node_start 拒绝 launch；M6/M7 均转红 |
| A17/A74 node_close | 实现行为正确，A17 单测判别力不足 | 只纳入已 launch instances；忽略未触发非 close agent；close agent 只认 done；M4 存活，见 P2-2 |

## 独立复跑与变异证据

### E-B3-SOL-01 · focused suite

```text
python3 -m unittest tools/relay-light/test_relay_log.py -v
Ran 39 tests in 14.293s
OK
exit 0
```

`python3 -m py_compile tools/relay-light/relay_log.py tools/relay-light/test_relay_log.py` 与 `git diff --check` 均 exit 0。

### E-B3-SOL-02 · 有效变异

| 变异 | 目标测试 | 结果 |
|---|---|---|
| M1 删除“prior attempt + 1”精确检查 | attempt 测试 | **存活 / OK** — P2-1 |
| M2 把 `outsider` 加入豁免集 | 四豁免测试 | **转红** |
| M3 同时绕过终态显式闸和后继矩阵冗余闸 | 终态封口测试 | **转红** |
| M4 禁用“所有已 launch agent 终态”循环 | close 双条件测试 | **存活 / OK** — P2-2 |
| M5 禁用 trigger 闸 | trigger/dependency 测试 | **转红** |
| M6 禁用 dependency 闸 | trigger/dependency 测试 | **转红** |
| M7 禁用 launch 的 node_start 前置 | node-start 测试 | **转红** |

所有变异只在 `/tmp/rlt03-b3-review*` 副本执行，临时目录已删除，仓内源文件未改。

### E-B3-SOL-03 · append-only / no-lock / no-temp / no-pane / 范围

- `relay_log.py:653-654` 仅以 `open(..., "a", encoding="utf-8", newline="")` 追加单行 JSON + `\n`；读侧在追加前 fail closed。
- 生产源码对 `.lower(` / `.casefold(` / `fcntl` / `msvcrt` / `filelock` / `flock` / `lockf` / `tempfile` / `mkstemp` / replace/rename/move / `pane` 精确扫描零命中；import 仅为 Python 标准库。
- 生产与测试中无 RLT_05/Batch 4 的 A43/A44/A61/A62/A65/A80/A81/A85/A89/A93/A94/A96/A97/A102/A103/A105–A108/A110–A114/A116/A118–A123 实现或验收 ID；非空账本 `status` 仍是已登记的最小 stub，本复核未要求扩展。
- 本批代码层面仍只涉及两条允许的 `tools/relay-light/*.py`；DevPlan WIP 与整个 RLT_03 workspace 均为入场前候选材料，本 reviewer 只新增本报告。

## 可执行的 rework 清单

1. 修复 P1-1：对 decider/strategist 决策类事件做真正的 triggering-agent ownership 校验，补“决策 agent 已 launch”的 wrong-owner 反例，不得靠“未 launch”错误代替 A69。
2. 修复 P1-2：禁止触发 agent 从 `decision` / `user_decision` 直接 `done`，用负例和 `resume -> done` 正例咬住，不扩展到 A114 decision-mode 完整链路。
3. 修复 P2-1 证据：在合法重拉前因后单独测重号/跳号/精确 +1，使 M1 转红。
4. 修复 P2-2 证据：增加 close agent done + 另一 launched agent open 的 A17 指定反例，使 M4 转红。
5. 复跑 39+ 全量 focused suite、上述对抗序列和变异；精确清理 pycache；仍只停在 Batch 3 rework/recheck，不得进 Batch 4 或 RLT_05。

本报告只登记 Batch 3 事实与级别，不代替主控验收裁决，不代签 verify。
