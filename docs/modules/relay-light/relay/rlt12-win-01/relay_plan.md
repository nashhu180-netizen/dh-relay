<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-14 session=rlt12-win-01 decision_mode=auto recipe=normal cards=RLT_21 -->

<!--
现场约定（规划冻结，运行时不重抄）

1. 主控侧：Claude Code 适配（references/adapter-claude-code.md）。Windows 命令名 `python`，不是 `python3`。
2. 账本程序：本树 `tools/relay-light/relay_log.py`；每一次 add / status / lint 都显式带
   `--config-dir ~/.claude/skills/relay-light/`（HC-RL-A136），不带会撞双侧歧义退出 3。
3. 两棵树分工：计划与账本落本树 RLT_12（D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12，
   分支 wt/RLT_12）；**业务卡 RLT_21 的全部 worker（builder / coder / checker /
   plan-reviewer / reviewer / scribe / decider）cwd 一律在另一棵树**
   D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_21（分支 wt/RLT_21，基线 master 6094887）。
   任务工作区 = RLT_21 树的 docs/modules/relay-light/workspace/RLT_21/。派活 prompt 的
   workspace 字段与 pane cwd 都指 RLT_21 树；只有监工跑账本命令时 --plan 指向本树的计划目录。
4. launch 列取值来自 Windows 预演实证（DR-W-001 / DR-W-007），不是 roles.toml 默认：
   codex 的 `--sandbox read-only` 在 Windows 能读但**拒写一切文件**，复核角色的产出落不了盘，
   故复核 / 决策类一律 `--sandbox workspace-write`，「只读」约束由派活 prompt 承担；
   监工裸启会跑成账号默认模型，故所有 codex 启动串显式钉 `-m`。
5. strategist 不进 agent 表（模板无此行，账本对 `strategist#<n>` 豁免「名字须在表中」校验），
   由当班监工按需拉起，档位冻结为 `codex -m gpt-5.6-terra -c model_reasoning_effort=high --sandbox workspace-write`。
   监工同理不进 agent 表，由编排拉起。
6. X 阶段**不在本表预留节点行**，由当班监工在 R1 打回后按 SKILL 的 X 阶段模板与 §4.4 追加规则
   现场追加（HC-RL-A121 正是这条：编排开阶段前重读计划，只追加节点行与必需的 agent 行）。
   理由：lint 的 HC-RL-A109 要求同卡后一阶段必须以前一阶段为祖先，预留 X1 就会逼出
   `F1 depends_on X1`；而 `node_start` 又要求 depends_on 全部 closed——于是「没有返工」这条
   正常路径反而会把 F1 永久卡死，或者被迫空跑一轮 X。追加时的模板：节点行
   `X1 / RLT_21 / RLT_21:X#1 / rework / agent:<打回路> / R1 / <理由>`，agent 行为新 coder 实例
   （attempt 从 1 起）、被打回的那一路 reviewer（trigger `on:done:coder`）、decider（`on:blocked`）；
   同时把 F1 的 depends_on 改指 X1。轮数上限 rework_max_rounds=2，超限停 → strategist → 用户。
7. C 阶段两批，按 RLT_21 的七条验收切：C1 = A137 / A138 / A139 / A140，C2 = A141 / A142 / A143。
   两批都同时碰程序与 skill 文本（A140 要 dh-mapping.toml 新键与三处监工模板原文，A142 要
   relay_log.py 的 add 路径两闸），**不存在「纯代码 / 纯文档」的干净切法**；按验收编号切至少让
   task_plan 与 check.C<n>.md 能一一对上。C1 收口后 relay_log.py 的校验主线已定，C2 再动模板
   与两闸不会回头改 C1 的断言。
8. 已知缺口按 Issue #23 口径：A112 迁移表下没有 blocked 终态 agent；环境性 NOT_RUN 只能走
   `blocked → agent_lost` 重拉（DR-W-002 实证，别发明 monitor helper）；`launch_fix=` 目前只是
   note 文本，lint 不校验、不触发 plan_amend。RLT_21 本身就是来补这三处的，运行期间按现状执行。
-->

## 节点表

| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| W1 | RLT_21 | RLT_21:W#1 | build | agent:plan-reviewer | | 七件套建在 RLT_21 树的 workspace/RLT_21/；task_plan 须写入两树分工与 rebase 撞 WIP 的 merge-base 等价处置（DR-W-008） |
| C1 | RLT_21 | RLT_21:C#1 | construction | agent:checker | W1 | 批 1：A137 stage_result 分校验与 ref=、A138 NOT_RUN 出口与 launch_fix 计数、A139 launch_fix 不触发 plan_amend 且 status --json 暴露、A140 silence_timeout_min 与静默超时模板 |
| C2 | RLT_21 | RLT_21:C#1 | construction | agent:checker | C1 | 批 2：A141 两份 adapter 三段原文、A142 decision_mode 模式门与 cancelled 归属闸并去 RLT_07 两条 skip、A143 light 档 plan-reviewer 分级模板 |
| R1 | RLT_21 | RLT_21:R#1 | review | agent:scribe | C2 | normal Recipe 双路并行：requirement + lesson；机器体检与四道闸脚本、miner 汇总由 scribe 在本节点内先体检后收敛 |
| X1 | RLT_21 | RLT_21:X#1 | rework | agent:requirement | R1 | 第 1 轮返工：R1 两路复核均 FAIL、合计 5 条 P1（requirement 路 P1-1 C1 durable 复审闭环缺失、P1-2 code-round1 未执行；lesson 路 P1-3 done 时机堵死返工、P1-4 审批菜单编号漂移、P1-5 herdr PermissionDenied 轮询退避三条教训未进候选），基线 commit fc70185 |
| F1 | RLT_21 | RLT_21:F#1 | handoff | agent:scribe | X1 | 收口备料；skill 改动的两侧重同步须先取用户当次明确授权，未授权则停在仓内验证 |

## agent 表

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| builder | W1 | builder | devin --model swe-2-max | 七件套与 task_plan.md | | cwd = RLT_21 树 |
| plan-reviewer | W1 | plan-reviewer | codex -m gpt-5.6-sol --sandbox workspace-write | review.plan.md | on:done:builder | 只读约束由 prompt 承担：只准写本行 output 列这一个文件（DR-W-001） |
| coder | C1 | coder | devin --model swe-2-max | relay_log.py 与 test_relay_log.py 改动、findings 与 lesson 行 | | 批内持续在场；每轮打四行小结 |
| checker | C1 | checker | codex -m gpt-5.6-sol --sandbox workspace-write | check.C1.md | | 只核是否偏离 task_plan，不做复核；P1 整改挂 live agent 名下 routed_to=（DR-W-004） |
| scribe | C1 | scribe | devin --model swe-2-medium | progress.md | on:done:coder | progress.md 单一写入者 |
| decider | C1 | decider | codex -m gpt-6-astra --sandbox workspace-write | decision.1.md | on:blocked | 不改任何文件；方案送回同一个 coder 记 checkpoint |
| coder | C2 | coder | devin --model swe-2-max | skill 五件与 relay_log.py 改动、findings 与 lesson 行 | | 新节点新实例，attempt 从 1 起 |
| checker | C2 | checker | codex -m gpt-5.6-sol --sandbox workspace-write | check.C2.md | | |
| scribe | C2 | scribe | devin --model swe-2-medium | progress.md | on:done:coder | |
| decider | C2 | decider | codex -m gpt-6-astra --sandbox workspace-write | decision.2.md | on:blocked | decision 文件序号全卡递增 |
| requirement | R1 | reviewer | codex -m gpt-5.6-sol --sandbox workspace-write | review.requirement.md | | normal Recipe 路 1 |
| lesson | R1 | reviewer | codex -m gpt-5.6-sol --sandbox workspace-write | review.lesson.md | | normal Recipe 路 2 |
| scribe | R1 | scribe | devin --model swe-2-medium | review.md 含体检与四道闸脚本及 miner 汇总 | | 空 trigger 是模板约定例外：监工在全部 reviewer done 后按本 note 拉起 |
| coder | X1 | coder | devin --model swe-2-max | 整改产出与 findings、lesson 行 | | 新节点新实例，attempt 从 1 起；cwd = RLT_21 树；只写 findings.md、lesson_candidates.md 与自己的完成信号，progress.md 不碰（A67） |
| requirement | X1 | reviewer | codex -m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write | review.requirement.X1.md | on:done:coder | cwd = RLT_21 树；fresh 实例；沙箱给 workspace-write，「只读」约束由 prompt 承担——只准写本行 output 这一个文件（DR-W-001） |
| lesson | X1 | reviewer | codex -m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write | review.lesson.X1.md | on:done:coder | cwd = RLT_21 树；fresh 实例；只读约束同上，只准写本行 output；不许改 lesson_candidates.md（coder 的登记位） |
| decider | X1 | decider | codex -m gpt-6-astra --sandbox workspace-write | decision.1.md | on:blocked | cwd = RLT_21 树；只读约束由 prompt 承担，只写本行 output；不改代码、不 commit；方案送回同一个 coder 记 checkpoint |
| scribe | F1 | scribe | devin --model swe-2-medium | as-built、AI 提交区、交付汇报、证据展示区 | | |
