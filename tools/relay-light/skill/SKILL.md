---
name: relay-light
description: 轻量接力编排——用 relay_log.py 账本把「规划→编排→stage-lead→agent」的分工落到固定五阶段（W/C/R/X/F）上执行多卡任务。
---

# relay-light

relay-light 是一套接力编排协议：人拉起规划与编排，编排在每个阶段开一个终端空间并拉起 stage-lead，stage-lead 拉起该阶段所有 agent；全部状态只以 `relay_log.py` 账本为准。本文件是协议核心；两侧运行时的派活/等待命令写法见 `references/adapter-claude-code.md` 与 `references/adapter-codex.md`。

## 适用边界：交互型任务走单会话

relay-light 的 worker 不回头问用户，卡住只能写 `blocked` 交 decider / strategist。需要与用户高频交互的任务放进来只会反复 `blocked → escalate → resume`，还白开 checker / scribe 等角色，因此**不进 relay-light**（完整模式与 `single-task` 都不进），改由**单个 Agent 会话**按 dev-harness 与用户直接对话推进（2026-09-23 用户裁决，#63）。

判定信号，任一命中即走单会话：

- 需要用户在测试环境 / 跳板机 / 生产机上亲手执行命令或贴回输出；
- 需要用户输入凭据、扫码或做物理操作（凭据值仍按硬规则 1 不入任何工件）；
- 预计与用户来回确认 **≥3 次**；
- 下一步取决于上一步的现场输出，无法预先拆成批次与 `task_plan`。

单会话只替代「多 agent 施工」这一段：dev-harness 的入口闸、Recipe 复核（施工者不复核自己的卡）、verify、需求境证据照常生效；过程与证据由该会话写进任务工作区 `progress.md`。多卡计划中混入一张交互卡时，本版不在节点表里建模：把该卡移出本计划、单会话做完后再作为后续计划的前置条件（交互节点类型暂缓，见 #63）。

## 角色表

十二个角色（含旁路 watcher）。**模型档全部写在 `roles.toml`**，这里只写职责与拉取关系，不写死模型。

| 角色 | 谁拉起 | 生命周期 | 只做这些事 |
|---|---|---|---|
| 规划 planner | 人；改计划实例由当班 stage-lead 拉起 | 一次性，产出计划后自行关闭 | 读任务卡、`dh-mapping.toml`，定档，生成 `relay_plan.md`；不参与运行 |
| 编排 orchestrator | 人 | 常驻整个计划，独占一个终端空间 | 只做三件事：重读计划并为阶段建终端空间拉 stage-lead；等 stage-lead；读 `stage_result` 按 `outcome` 机械分路 |
| **stage-lead**（阶段主管） | 编排 | 按阶段实例独立，阶段结束随终端空间关闭 | **任务派发与沟通**：派本阶段所有 agent、确认派单投递、按明文判据判活、把判定方 FAIL 结论路由回同一送审方、按 trigger 触发升级、写节点与阶段事件。账本 `agent` 标识沿用 `monitor#<n>`（历史兼容，见「术语与判断分层」） |
| builder | stage-lead | 单节点 | W 阶段建任务工作区七件套与 `task_plan` |
| plan-reviewer | stage-lead | 单节点 | W 阶段审 `task_plan` |
| coder | stage-lead | 批内持续在场，本批 checker 通过后才收工 | 写代码、提交；自己在 `findings.md` / `lesson_candidates.md` 追加一两行；每轮写完打四行小结 |
| scribe | stage-lead | 单节点 | 只写 `progress.md`；R/F 阶段还跑脚本与汇总 |
| checker 方向评估 | stage-lead | 批内持续在场，与 coder 同生共死 | 核对本批是否偏离 `task_plan`；不做复核 |
| decider 决策 | stage-lead | 按需 | 施工 `blocked` 时产出可落地方案；不改任何文件，可在方案文件提出「需要改计划」并写明改动内容（改计划工作流见「planner-amend 改计划模板」） |
| reviewer | stage-lead | 单路 | R 阶段各路复核，路数由 Recipe 决定 |
| strategist 全局决策 | stage-lead | 按需 | 返工到轮数上限仍不过时产出全局方案；不改任何文件，可同样提出「需要改计划」（见「planner-amend 改计划模板」） |
| watcher（旁路） | 编排或 stage-lead | 一个终端空间 | 只盯 agent 状态变化、只报信给本空间派活方；不派活、不写账本、不改文件。`relay_log.py watch` 程序落地后由程序承担、人肉实例退役；`single-task` 模式里的 `phase=monitor` 角色就是它 |

拉取顺序固定：**编排拉 stage-lead，stage-lead 拉其余**。编排不越级拉 agent；stage-lead 不跨阶段存活；规划不参与运行。checker / decider / strategist 都不写账本、不做复核、不改文件。

### 术语与判断分层

**判断分三档，stage-lead 只占最浅那一档**：

| 判什么 | 谁判 | 性质 |
|---|---|---|
| 产出内容合格不合格 | 判定方——plan-reviewer / checker / reviewer（节点表 `close=agent:<判定方>`） | 内容判定 |
| 批内卡住怎么绕 | decider（`on:blocked`），`decision_mode=consult` 时报用户 | 小决策 |
| 扩界 / 改计划 / 新增卡 / 停卡 | strategist 出方案 → `user_decision`（**永远出现、不看 mode**）→ 用户定 | 方向决策 |
| 谁该上场、投没投递到、是不是挂死、能不能关节点 | **stage-lead** | 程序性判定（全部有明文判据，无自由裁量） |

所以 stage-lead **不做内容判定、不做方向决策、不持有授权权**：越界、push / PR / 合并、超限停卡一律 `user_decision` 升给用户。有判定方的节点（W/C/R/X）里 stage-lead 只读判定方的结论，不自己判内容；没有判定方的节点（F 的 scribe、decider 这类 `close` 就是自己）只做形式核——产出文件存在、非空、落在允许路径内。

**四个非角色概念**，不进角色表、不进账本 `agent` 字段：

| 概念 | 指什么 | 落在哪 |
|---|---|---|
| **agent kind** | `claude` / `codex` / `devin` / `omp`——每个 agent 一个属性，决定启动参数与「能不能结束回合靠推送叫醒」 | `roles.toml` 缺省 + 计划 agent 表 `launch` 列；两份 adapter 的差异本质就是编排/stage-lead 位上的 kind 不同 |
| **终端载体** | 管终端空间与标签页的那个工具，现在是 herdr | 命令写法只出现在两份 adapter 的载体小节，换载体只改那里；协议正文只用「终端空间 / 标签页」这两个抽象词 |
| **用户** | 裁决与授权：越界放行、push / PR / 合并、超限停卡 | 账本 `user_decision` 事件；`decision_mode=consult` |
| **开局准备** | 派计划前必须就位的东西：worktree、分支 `wt/<卡>`、基线 SHA、共享目录软链、本计划 `config/roles.toml` | 硬规则 12 + 计划前言，由用户在派计划前完成 |

`主控` 一词在 relay-light 里**已退役**——它以前同时背「哪个 kind 在跑」「谁有授权权」「谁做开局准备」三个意思，现已分别落到上表的 agent kind / 用户 / 开局准备。

**送审信号的账本写法**：agent 表里 `trigger=on:review_ready:<送审方>` 的判定方，只有在送审方**当前实例**最新一条事件是 `checkpoint` 且 note 含 `ready_for_review=<判定方名>` 时才能 `agent_launch`（HC-RL-A144）。送审方交稿时 stage-lead 写的是 `checkpoint --note ready_for_review=plan-reviewer`，**不是 `done`**；`done` 是终态，写了之后判定方拉不起来、送审方也不能重拉（A60/A49），本阶段实例就没有合约内出路，只能 plan_amend 加新实例（2026-09-21 p21-normal 首跑 W1 即此死锁）。硬规则 11 的「判定 PASS 前送审方不记 done」在账本上就是这一条。

**批内不换人**：checker 与 decider 的方案都送回同一个 coder，账本记 `checkpoint`，不新增 attempt。只有节点级返工（X 阶段新节点）才开新实例。

## 派活纪律与 stage-lead 判活

**派活通知投递确认**：向 agent 发通知后必须读 pane 末行确认实际投递；pane 出现 `queued` 排队提示时补 `send-keys enter` 并复核送达；未确认投递不得当作已通知。

**批次收口后清上下文**：C 阶段某批 `node_close` 之后、拉下一批之前，stage-lead 可对本批 coder 与 checker 各执行一次上下文清理并复验已清理；清理的是同一实例的上下文，**不新增 attempt、不算换人**。FAIL / 整改期间禁止清理（不得借清理清零 `checkpoint` 往返计数）；清理失败或无法复验时不得拉下一批，也不盲目重复发送。`single-task` 模式的同名闸更严（见该节「batch PASS 后会话清理闸」）。

**`agent_lost` 判活**：pane 的 `working → done` 不等于 agent 收工（长 `sleep` 中也会被报 `done`）；判 `agent_lost` 前必须同时确认 pane 无 `Running tools` 计时器在走、账本无该 agent 新行、Herdr `agent get` 状态非 working；不得单凭 pane 状态判死重拉。`ledger_silent` 仍按 A140 核 Herdr 状态 + pane 末行 + 允许路径产出：三者均无变化才中断；任一仍在变化不得中断。

**codex 启动档位按机器分叉**：沙箱可用的机器上 codex worker 以默认 sandbox 启动；沙箱撞 bwrap 的机器（ThinkPad Linux，任何 `--sandbox` 都跑不了 shell）一律 `--dangerously-bypass-approvals-and-sandbox` 启动，只读约束由派单 prompt 承担，`agent_launch.note` 记 `launch_fix=codex_bypass_bwrap`（2026-09-21 用户裁决）。编排/stage-lead 位为 codex kind 时沿用既有 bypass 结论；仅在该侧的沙箱型只读启动不可用且账本连续 `NOT_RUN` 时，按环境预检改用 bypass 沙箱启动，提示词明确只读约束，并在 `agent_launch.note` 记录 `launch_fix=<token>`；不得把 bypass 写成无条件全局口径。

## 五阶段模板

五阶段：W 建工作区 → C 施工 → R 复核 → X 返工 → F 收口备料。阶段实例 = 一个终端空间 + 一个 stage-lead；同一阶段可多次进入，用 `#k` 区分。

- **W**：builder 建七件套与 `task_plan`；卡文允许路径写着「实施代码路径开工时另行登记」的，builder 同时把精确代码路径写进 DevPlan 该卡的 `dh:allowed-paths` 块（用户 2026-09-21 裁决：路径登记不需逐次确认），plan-reviewer 审 `task_plan` 并核登记未越出卡文变更范围（越出为 P1）。
- **W 可省的两种情形**（2026-09-21 用户裁决）：①卡的工作区与 `task_plan` 已预建且基线未变，节点表可不放 W，首个 C 节点 `depends_on` 留空，其批次 0 由 coder 核基线 / 允许路径 / 复现命令；②light 卡可不写 `task_plan`，批次内容、验证命令与停止条件写在该 C 节点的 note 里，checker 以节点 note 为对照。normal / heavy 卡必须有 `task_plan`（checker 的对照物、dh 体检的必查项）。
- **C**：按 `task_plan` 批次拆 C1..Cn；每批 coder + checker + scribe，decider `on:blocked`。
- **R**：机器体检与四道闸（scribe 跑脚本）、按 Recipe 档位挂并行 reviewer、miner、收敛（scribe 汇总 `review.md`）。
- **X**：coder 修 + reviewer 再审；轮数上限读 `dh-mapping.toml`，超限停 → strategist → 用户。**X 节点必须由规划预先放进节点表**（每卡 R 后一个 `X<n>`，`close=agent:<打回路>`，F 依赖 X），R 无返工时编排按 `stage_result` 直接跳过不开该节点；不预置则 R 打回后编排无处可去只能停（2026-09-21 p21-normal 首跑教训）。
- **F**：as-built、AI 提交区、交付汇报、证据展示区，全部由 scribe 备料。

模板占位符：`<card>` = 卡号；`<prev>` = 上一节点号（首节点留空）；`<n>` = 节点序号；`<k>` = 阶段实例/返工轮次；`<d>` = 卡内决策文件序号（`decision.<d>.md` 全卡递增）；`<reviewer>`/`<路>` = 按 recipe 展开的 reviewer 名与其路名；`<打回路>` = R 阶段打回的那条 reviewer 路名。

### W 阶段模板

```markdown
| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| W<n> | <card> | <card>:W#<k> | build | agent:plan-reviewer | <prev> | |

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| builder | W<n> | builder | | 七件套与 task_plan.md | | 交稿记 `checkpoint ready_for_review=plan-reviewer`，PASS 后才记 done |
| plan-reviewer | W<n> | plan-reviewer | | review.plan.md | on:review_ready:builder | |
```

**plan-reviewer 分级（light 档）**：light 卡的 `task_plan` 审查按两级严重度分类——纯措辞、格式、引用陈旧项一律 P2 不阻断 PASS；以下四类仍 P1 阻断：allowed-paths 越界；写入者边界（谁写 `progress`/`findings`/`lesson`）；节点/阶段边界缺漏或矛盾；验收命令与完成信号缺失或矛盾。**light 只按此分级，heavy/normal 不变。**

### C 阶段模板

每个施工批次一个节点；coder 与 checker 批内同时在场（trigger 留空），scribe 等 coder done 后拉起，decider 仅在 blocked 时拉起；`close=agent:checker`（checker 通过才进下一批）。判定方判定 PASS 前，送审方与判定方均不记 `done`；FAIL 走 live 判定方的 `checkpoint` 路由回同一送审方；PASS 后按送审方→判定方顺序记终态。

```markdown
| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| C<n> | <card> | <card>:C#<k> | construction | agent:checker | <prev> | |

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| coder | C<n> | coder | | 代码与 findings/lesson 行 | | 每批交稿记 `checkpoint ready_for_review=checker`，PASS 后才记 done |
| checker | C<n> | checker | | check.C<n>.md | | |
| scribe | C<n> | scribe | | progress.md | on:done:coder | |
| decider | C<n> | decider | | decision.<d>.md | on:blocked | |
```

### R 阶段模板

reviewer 行数与名字由 marker `recipe=` 经 `dh-mapping.toml` 的 `[recipes.<档>]` 展开——三档集合不同，模板不写死；每路一行、trigger 留空并行。机器体检、四道闸脚本与 miner 汇总不独占 agent 行——由 scribe 在同一节点内按「先体检、后收敛」执行（§6.1 允许一个 R 实例内分节点展开，展开时各自拆成独立节点行）。scribe 在全部 reviewer `done` 后由 stage-lead 拉起收敛 `review.md`。

```markdown
| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| R<n> | <card> | <card>:R#<k> | review | agent:scribe | <prev> | |

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| <reviewer> | R<n> | reviewer | | review.<路>.md | | 按 recipe 展开为并行多行 |
| scribe | R<n> | scribe | | review.md（含体检/四道闸脚本与 miner 汇总） | | 空 trigger 是约定例外——trigger 词表表达不了「等全员 done」：stage-lead 在全部 reviewer done 后按本 note 拉起 |
```

### X 阶段模板

节点级返工：开新的 coder 实例（attempt 从该节点 1 起），由被打回的那路 reviewer 再审。

```markdown
| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| X<n> | <card> | <card>:X#<k> | rework | agent:<打回路> | <prev> | |

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| coder | X<n> | coder | | rework.<k>.md | | 新实例，attempt 从 1 起 |
| <打回路> | X<n> | reviewer | | review.rework.<k>.md | on:review_ready:coder | |
| decider | X<n> | decider | | decision.<d>.md | on:blocked | |
```

### F 阶段模板

```markdown
| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| F<n> | <card> | <card>:F#<k> | handoff | agent:scribe | <prev> | |

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| scribe | F<n> | scribe | | as-built、提交区、汇报与证据区 | | |
```

**F 阶段收口 checklist**

- [ ] 确认对应 worktree 已删（`git worktree list` / `git branch` 核对），先关终端空间再删树。
- [ ] Issue 与 MR/PR 收口（2026-09-21 用户要求，实施细节待后续卡）：计划前言登记 Issue 号；F 阶段把分支推到远端并建 MR（GitLab，wf 仓须经 integrator 机）或 PR（GitHub），链接回填 review.md 提交区；合入/verify 仍按各仓授权。

## 账本用法

计划与账本落在 **`docs/modules/<模块>/relay/<plan_id>/`**，不进任务工作区（A98）。计划文件名固定 `relay_plan.md`，第一行是 marker（`skill=` / `session=` / `recipe=` / `cards=` 等），正文为节点表与 agent 表两张固定表头的 markdown 表。

三个子命令：

```text
relay_log.py add    --plan <dir> --node <n> --event <e> --agent <a> [--note <text>] [--config-dir <dir>]
relay_log.py status --plan <dir> [--json] [--config-dir <dir>]
relay_log.py lint   --plan <dir> [--config-dir <dir>]
```

`lint` 的 `--json` 输出结构（`{"ok","violations":[…]}`）随 RLT_10 落地——当前只 `status` 实现 `--json`，给 lint 传 `--json` 会报参数错。

账本行固定七字段：`seq` / `ts` / `node` / `event` / `agent`（`<名字>#<attempt>`）/ `by` / `note`。

- `add`：写入一行，校验词表与时序。
- `status`：派生当前阶段、节点状态、在场 agent 与可关闭判定；不判产出合格，只判账本完整性。
- `lint`：校验计划硬约束（表头、节点号唯一、stage_id 合法、同卡串行、depends_on 合法等）。

**attempt**：`--agent` 传完整 `<名字>#<attempt>`，由 stage-lead 分配 = 该 `(node, 名字)` 已有最大 attempt + 1；`add` 校验 `agent_launch` 的 attempt 必须恰等于最大值 + 1，否则退出 2。只在 `agent_lost` / `cancelled` / 阶段 `failed` 后重拉时 +1，上限读 `dh-mapping.toml`。批内 `checkpoint` 往返不增；节点级返工是新实例、从 1 起。attempt 与 X 轮数两套计数独立、不叠加、不互相重置，任一先到上限即停 → strategist → 用户裁决。

事件状态机：

```text
agent_launch → checkpoint* → ( blocked → escalate → decision → [user_decision] → resume )* → (done | agent_lost | cancelled)
```

**控制事件**（`agent` 字段只写 `orchestrator#<n>` / `monitor#<n>`，不进状态机；写入者不符即拒）：

| 事件 | 写入者 | 时序与 note 强制 |
|---|---|---|
| `plan_loaded` | 编排 | 账本第 1 行且仅一次；`node` 填第一个非 superseded 节点号；`note` 必须含 `skill=`、`config_dir=<规范化并百分号编码的配置目录>` 与 `plan=<计划目录>` |
| `stage_start` | 编排 | 每阶段实例仅一次，先于该实例 `monitor_launch`；`note` 带 `stage_id=` |
| `monitor_launch` | 编排 | 每阶段实例至少一次（重拉 stage-lead 可多次），在本实例 `stage_start` 后；`note` 带 `stage_id=` |
| `node_start` | stage-lead | 每节点仅一次，先于该节点任何 `agent_launch`；`depends_on` 未全 `closed` 退出 2 |
| `node_close` | stage-lead | 仅双判据成立才接受（全部在场 agent 有终态 + `close` 列 agent 已 `done`） |
| `stage_result` | stage-lead | 每阶段实例可多次，`status` 只认最新一条；`note` 必须含 `stage_id=` 与 `outcome=done / blocked / failed / cancelled` 及原因，且在该实例全部节点 `closed` 之后；`outcome=cancelled` 的 `note` 须引用对应 `user_decision`；本阶段发生过 `plan_amend` 时另补 `amend=<方案文件名>` 与 `nodes=`（裸文件名会丢 status 的 `result.amend` 信号） |
| `stage_close` | 编排 | 每阶段实例一次；`note` 带 `stage_id=`；前置 = 已见本实例 `stage_start`/`monitor_launch`、全部节点 `closed` 且最新 `stage_result` 的 `outcome ∈ {done, cancelled}`，否则退出 2 |
| `monitor_restart` | stage-lead | 任意位置不限次；`note` 列盘点结果 |
| `plan_amend` | stage-lead | 运行中改计划完成后写；`note` 必须含方案文件名与 `nodes=<新节点号,…>`（改计划工作流本身见「planner-amend 改计划模板」，此处只冻结账本合同） |

**agent 事件归属**：`escalate` / `decision` / `user_decision` / `resume` / `cancelled`（决策类）记在**被阻塞/被触发的那个 agent** 名下，决策 agent 的标识写进 `note`——`escalate` 与 `decision` 的 `note` 必须**恰含一个** helper token `decider=<名>#<n>` 或 `strategist=<名>#<n>`，且 `decision` 必须复述同一 helper，缺一/多一/不符即拒。decider 与 strategist 自己的 `agent_launch` / `done` 记它们自己名下。`orchestrator#<n>` / `monitor#<n>` / `planner-amend#<n>` / `strategist#<n>` 四名豁免「agent 名在该节点 agent 表中」校验（其余 agent 名必须在表中）；改计划实例 `planner-amend#<n>` 的生命周期事件记它自己名下（工作流见「planner-amend 改计划模板」）。

**决策链两条，顺序固定**：

- **decider 链**（施工 `blocked` 触发）：`blocked` → `escalate` → `decision` → `resume`。`user_decision` 位置固定在 `decision` 与 `resume` 之间，有无由 `decision_mode` 决定——`auto` 没有（出现即拒），`consult` 必有（缺它写 `resume` 即拒）。
- **strategist 链**（stage-lead 的 attempt / 返工轮数计数触发，**无 `blocked` 起头**——`escalate` 直接作链首）：`escalate`（coder 名下）→ `agent_launch`（strategist 名下）→ `decision`（coder 名下，`note` 复述同一 helper）→ `done`（strategist 名下）→ `user_decision`（coder 名下，**永远出现、不看 mode**）→ `resume`（coder 名下，继续，不新增 attempt）或 `cancelled`（coder 名下，停卡）。

`checkpoint` 是批内往返的唯一载体：可重复任意次，不新增 attempt、不新增 `agent_launch`。

**`ledger_silent` 处置**：`status` 按账本最近事件计算静默，超过 `dh-mapping.toml` 的 `limits.silence_timeout_min`（默认 30 分钟）的在场 agent 标 `ledger_silent`——这是提示、不是挂死判定。处置原文：

```text
ledger_silent → 核 Herdr 状态 + pane 末行 + 允许路径产出 三者是否也无变化 → 三者均无变化才中断并记 agent_lost silent_timeout → 同 pane 重拉 #n+1；任一仍在变化不得中断。
```

## planner-amend 改计划模板

改计划实例 `planner-amend#<n>` 由当班 stage-lead 在过门后按需拉起，复用 planner 角色档，不发明新角色。输入恰四件：方案文件（decider / strategist 产出，**只读不改**）、当前 `relay_plan.md`、开发方案 `dev_plan/P<N>-*.md`、涉及的已有卡 `docs/modules/<模块>/workspace/<卡号>/task_plan.md`。

**白名单三类闭集**（一律仓相对 POSIX 路径）：

1. 本计划的 `docs/modules/<模块>/relay/<plan_id>/relay_plan.md`（含 marker `cards=`）；
2. 同模块 `docs/modules/<模块>/dev_plan/P<N>-*.md`；
3. 改动前 marker `cards=` **已存在**卡的 `docs/modules/<模块>/workspace/<卡号>/task_plan.md`——新卡的 task_plan 由该卡 W 阶段 builder 建，改计划实例写它即判失败，不得在改计划里反向授权。

`docs/modules/<模块>/design/` 整个目录是禁区；禁区或其它路径命中即整份拒绝，**不做部分执行**。

**执行流**（守门挂在现有 `lint` 子命令下，不新增顶层子命令）：

```text
relay_log.py lint --plan <plan_dir> --amend-check before --repo <repo> \
    --snapshot-dir <运行现场新目录（绝对路径，仓与 .git 之外）> \
    --proposed-path <仓相对路径> [--proposed-path <仓相对路径> ...]
relay_log.py lint --plan <plan_dir> --amend-check after  --repo <repo> --snapshot-dir <同一目录>
```

1. planner-amend 先从方案文件列出**完整** proposed paths；stage-lead 跑 `before` 做全量预检 + 原始工作树快照。
2. 预检不过（含命中 `design/` 禁区、新卡 task_plan、其它任何路径）：**任何文件都不改**——全部计划目标与输入方案文件零变化，planner-amend 只以普通 `done.note` 写 `outcome=out-of-scope proposal=<方案文件名> reason=<原因>` 后停止，由当班 stage-lead 写 `stage_result outcome=blocked` 交用户。planner-amend 不写 `blocked` / `escalate` / `plan_amend`。
3. 预检通过才**一次改完**全部 proposed 目标。
4. stage-lead 跑 `after`：before/after 原始快照精确 diff，成功唯一判据 `actual == proposed`；再核 HEAD/真实 index/object database 未变并跑普通 plan lint。任一失败即从仓外原始副本恢复 `actual ∪ proposed` 的 bytes/mode/symlink/存在性，planner-amend 最多修三次；第三次仍失败按同一条「零文件变化 + 结构化 done.note」路径收尾。

`--snapshot-dir` 是运行现场目录（0700/0600），不是 durable evidence，完成或验证恢复后由守门器安全删除。改计划实例不建新卡七件套；敏感 untracked 的正文、文件名与哈希不进入证据。

## 拓扑布局

**终端空间** = 载体侧的 workspace（当前载体 herdr），一个阶段实例一个，cwd 指向该卡的 worktree；编排另独占一个。空间内**一个 agent 一个标签页**，不在同一标签页里 split；一般不超过 4 个同时在场。不同仓库各开各的具名 session，session 名写进 marker。阶段结束关整个终端空间；全计划结束后先关空间再删 worktree。具体建空间 / 建标签页 / 拉 agent 的命令写法只在两份 adapter 的载体小节，协议正文不写载体命令。

**命名规范**（不规范就找不着，多卡并跑时尤甚）：

| 对象 | 命名 | 例 |
|---|---|---|
| 编排空间 | `<plan_id>-orch` | `p21-orch` |
| 阶段实例空间 | `<plan_id>-<卡尾号>-<阶段><k>` | `p21-29-C1`、`p21-29-R2`、`p21-30-W1` |
| 标签页 | 角色名，重拉带 attempt | `coder`、`reviewer-consistency`、`coder#2` |

空间名与 `stage_id` 一一对应（`p21-29-C1` ↔ `RLT_29:C#1`），出事时用 `stage_id` 反查是哪个空间。空间名里用 `-` 不用 `#`，`#` 只在标签页表 attempt。

**任务工作区** = `docs/modules/<模块>/workspace/<卡>/` 下的七件套工件目录（brief / task_plan / progress / findings / lesson_candidates / review / execution_strategy）。

**「终端空间」与「任务工作区」不是同一个东西，不得混用**：前者是运行现场的终端拓扑，后者是磁盘上的工件目录。

## 硬规则

1. **凭据红线**：密钥 / 凭据值永不写入任何工件、账本、命令模板、派活文案或测试；证据先按白名单过滤。
2. **档位来源**：Recipe 档位（`heavy` / `normal` / `light`）按卡取自 DevPlan 任务卡的 `任务类型`（`task_type`）字段；marker `recipe=` 是计划默认档，卡与默认不同时在 `cards=` 里按 `<卡>:<档>` 覆盖（多卡计划允许不同档位混排，R 节点 reviewer 集按该卡档位展开）。字段缺失按 `normal` 处理，并在计划前言写明「task_type 缺失，按 normal 起草」（2026-09-21 用户裁决，取代 A117 的停下问用户）。
3. **落点**：`relay_plan.md`、账本与本计划 `config/`（`roles.toml` + `dh-mapping.toml`）一律落 dh-relay 仓 `docs/relay/<施工仓名>/<模块>/<plan_id>/`，不进施工仓、不进任务工作区（2026-09-21 用户裁决，取代 A98 的施工仓内 `docs/modules/<模块>/relay/`）。计划正文引用施工仓文件用 `<施工仓名>:<仓相对路径>` 前缀。每条 `relay_log.py` 调用的 `--config-dir` 指向该计划的 `config/`；`config/roles.toml` 由用户在派单前定好，是本计划角色启动方式的唯一来源。
4. **Linux 直跑**：在 Linux 侧收口前必须直跑 python 测试，命令与输出原样记入 `progress.md`（A19）。
5. **写入者唯一**：`findings.md` / `lesson_candidates.md` 的写入者是 coder；`progress.md` 的写入者是 scribe；reviewer 各写各的 `review.<路>.md`。每份文件在一个节点内只有一个写入者（A67）。
6. **coder 四行小结**：coder 每轮写完在 pane 打固定四行小结（做了什么 / 证据 / 偏离与 findings / 下一步），缺项写「无」（A66）。
7. **scribe 素材边界**：scribe 写 `progress.md` 的素材来源按优先级为 ① 账本事件与 note（事实层）② 本批 diff 与 coder 四行小结 ③ checker / decider / 用户裁决的方案文件名与结论；素材里没有的不得发明，且不碰 `findings.md` / `lesson_candidates.md`（A66）。
8. **等待必须有接收者**：`wait` 是阻塞式 CLI，返回那一刻必须有接收者（watch 推送、前台阻塞循环、或后台退出唤醒三种之一）；watch 未实现时不得结束回合空等。
9. **不写死模型**：流程文档、模板、派活文案一律引用角色名与档位，模型取值只在本计划 `config/roles.toml`（用户提前定好；skill 副本里的 `roles.toml` 只是缺省模板）。
12. **建树前置**：编排在每个阶段实例开始前核该卡 worktree 存在、分支为 `wt/<卡>`、基线为计划前言的 SHA，以及施工仓约定的共享目录软链已就位（wf-analytics-platform：v2 `.venv`、`frontend/node_modules`、`backend/data/datasets` 三条指向主仓）；缺任一即 `stage_result outcome=blocked` 交用户，编排不自行建树、不改软链。开局准备（建树与软链）由用户在派计划前完成并写进计划前言。
13. **决策模式按卡**：marker `decision_mode=` 是计划默认，`cards=` 里可按 `<卡>:<档>:<auto|consult>` 覆盖；不做批次级。
10. **模板无 kickoff / verify 签字类节点**：节点类型只有 `build` / `construction` / `review` / `rework` / `handoff`。
11. **判定方封口纪律**：判定方判定 PASS 前，送审方与判定方均不记 `done`；FAIL 走 live 判定方的 `checkpoint` 路由回同一送审方；PASS 后按送审方→判定方顺序记终态。

## `single-task` 单卡接力模式

`single-task` 与上方完整 relay 模式并列、互斥：用于一张已落户任务卡的规划、施工、复核与人验接力，**不创建或读写 `relay_plan.md` / `relay_log.jsonl`，不使用 W/C/R/X/F 阶段词**；本节不改写上方任何完整模式合同，五阶段模板与账本行为不回归。

### 标头与 phase 闭集

- worker 派单 prompt 首行固定为 `[relay-light:single-task] worker · phase=<phase> · agent=<role>#<instance> · batch=<n|na> · round=<n> · workspace=<repo-relative-path>`；与完整 relay 的 `[relay-light] worker · node=...` 标头互斥，两套流水不交叉执行。
- phase 闭集：`plan` / `plan-review` / `batch` / `batch-review` / `workflow-final` / `e2-code-review` / `decision` / `monitor` / `human-acceptance`；`batch=1|2|3|na`。
- `RELAY_RECEIPT` fail closed 分流：进程环境存在 `RELAY_RECEIPT` 时，产出型 builder/coder/reviewer/decider 只写本角色精确 `BLOCKED.*.md` 单行 signal 后立即停止；monitor 保持 repo/workspace 零写入，只用 Herdr prompt 非 durable 通知 orchestrator 后立即停止，不写 `BLOCKED`。两个分支均不得清除任何 `RELAY_*` 环境变量。

### model-allocation gate（启动任何 agent 之前的硬闸）

- orchestrator 必须先向用户展示全部拟启动角色/实例的模型与推理档提案表，并明确询问确认；推荐默认仅是提案，不写死模型。用户可逐角色修改；**未获明确确认不得启动任何 agent**。
- 确认后由 orchestrator 机械地把确认来源、角色/实例、模型、推理档写入 `execution_strategy.md`；未启动的 tab/pane 标 pending，启动后补齐实际 Herdr workspace/tab/pane 与观察来源并逐项比对。`execution_strategy.md` 由 orchestrator 在启动/更换角色时维护，monitor 与其它角色只读。
- 恢复时可沿用已有明确确认且分配未变的快照；新增/更换角色或实例、换模型或推理档必须再次询问确认。超时、静默或最大工具权限均不推定确认；最大工具权限不扩张 commit/push/PR/merge/deploy/verify/人验授权。

### 生命周期与计数

固定生命周期：任务工作区七件套与 `task_plan.md` → plan review → 分批开发 + batch review → 开发后按 `task_type` Recipe 展开的全量 workflow-final review → E2 code_review → 主会话人验。batch review 与 workflow-final 是**两道独立闸**，batch PASS 不替代 final。

- `review_round` 与 `remediation_count` 分开记：初审 `review_round=1 remediation_count=0`；plan/batch review 各最多整改 2 轮，FAIL 回同一 builder/coder、原 reviewer 复审；超限交 decider，六类方向问题（方向/范围/验收/数据语义/安全/生产影响）交用户。
- workflow-final 每条适用 path 最多返工 2 轮，**每轮换 fresh reviewer**，不得复用上一轮实例冒充 fresh；E2 `code_review` 初审为完整 fresh，仅出现 open P0/P1 后由**同一 `reviewer_session_id`** 做 targeted attempt 2。两层证据分别登记身份/输入/finding/结论，条件相斥不得合并为一条。
- 完成谓词：全部适用 `task_type` Recipe path PASS 或有可核查 N/A，最终汇总无 open P0/P1；heavy 五路（code-round1/code-round2/requirement/consistency/lesson）一条不少；单一 final reviewer、batch PASS 或 E2 receipt 均不替代整套 Recipe。施工者不复核自己的施工。

### batch PASS 后会话清理闸

- 仅当该批 batch reviewer 的 durable signal 为 PASS **且**本批工件齐全（本批交付物、验证证据、coder signal、review 产物、reviewer durable PASS）后，orchestrator 对本批 coder 与 batch reviewer **各执行一次 `/clear`** 并分别复验已清理，之后才启动下一批。终端 idle/done 或 coder DONE 不替代此门。
- FAIL/整改期间禁止 `/clear`，保持原 coder/原 reviewer session，不借清理清零整改计数；清理失败或无法复验时不得启动下一批，也不盲目重复发送 `/clear`。monitor 常驻、不 clear；decider 按需拉起，不纳入每批固定 clear。

### durable signal 与写者边界

- 每个产出型 worker 的收口物是单行 signal：`DONE`/`BLOCKED` + `task phase agent batch path review_round remediation_count verdict evidence`（BLOCKED 另含 `reason=<snake_case>`），值无空白、证据为 repo 相对路径逗号分隔；写完即停，不等 `node_closed`，不碰完整模式 plan/log。
- sole writer：`execution_strategy.md` 仅 orchestrator 写；各 review/check/decision 工件由对应 reviewer/decider 自写；`progress.md` 仅由当前顺序执行的 batch coder 在自己 batch 完成时追加**一条**简洁施工里程碑 + 证据引用——不记 pane/agent 状态、轮询、通知或终端输出；reviewer/monitor/orchestrator 不写 progress。
- monitor 对 repo/workspace **完全只读**：不写 signal/progress/execution_strategy/轮询日志/通知日志或任何文档；不路由、不分派、不启动 agent。

### monitor 节拍与安全 Enter

本模式的 `monitor` 角色就是角色表里的 **watcher**——只观察、只报信，与完整模式的 stage-lead 不是同一角色，也与账本控制事件里的 `monitor#<n>` 无关（本模式不写账本）。`phase=monitor` 这个词沿用历史合同不改。

- monitor 常驻，只做 Herdr wait/get/read：每 120 秒观察一次，无状态变化静默，有变化即时用 Herdr prompt 通知 orchestrator（通知不是 durable artifact）。
- 安全 Enter：仅当三条件**同时**成立才发送一次并复验——①本次派单文本仍停在输入框（含 Devin queued 指令仍排队未发出）；②`state_change_seq` 未推进；③当前界面不是审批/确认 UI。任一不满足即不按；一次仍失败则通知 orchestrator 并换 fresh 实例，禁止连按。
- monitor 命中 `RELAY_RECEIPT` 时同样 repo 零写入，只 prompt 通知 orchestrator 后停止。

### 恢复依据

恢复权威只有四类：worker/reviewer/decider 自写的 durable signals、独立 review/decision 工件、orchestrator 维护的 `execution_strategy.md`、Herdr 实态。`progress.md` 只是施工证据索引、monitor 通知只是即时提示，二者都不是运行真相；恢复/重启时从四类权威重建，不依赖终端存活状态。

## 放弃项

- 不做身份校验：账本 `by` 字段标称写入者但不验真伪，换取零启动成本。
- `status` 不判产出是否合格，只判账本完整性。
- 不设 `all_agents_done` 这类恒真枚举；节点关闭固定双条件合取。
- 不做原子写、回滚、历史 manifest（安装器侧同此约定）。
- 不做 watch 推送的实现；watch 未实现时一律走前台 `wait` 回退。
- 不允许编排做判断题：`stage_result.outcome` 机械分路，不越级拉 agent，不缓存计划。
