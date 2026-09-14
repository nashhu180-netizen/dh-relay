---
name: relay-light
description: 轻量接力编排——用 relay_log.py 账本把「规划→编排→监工→agent」的分工落到固定五阶段（W/C/R/X/F）上执行多卡任务。
---

# relay-light

relay-light 是一套接力编排协议：人拉起规划与编排，编排在每个阶段开一个终端空间并拉起监工，监工拉起该阶段所有 agent；全部状态只以 `relay_log.py` 账本为准。本文件是协议核心；两侧运行时的派活/等待命令写法见 `references/adapter-claude-code.md` 与 `references/adapter-codex.md`。

## 角色表

十一个角色。**模型档全部写在 `roles.toml`**，这里只写职责与拉取关系，不写死模型。

| 角色 | 谁拉起 | 生命周期 | 只做这些事 |
|---|---|---|---|
| 规划 planner | 人；改计划实例由当班监工拉起 | 一次性，产出计划后自行关闭 | 读任务卡、`dh-mapping.toml`，定档，生成 `relay_plan.md`；不参与运行 |
| 编排 orchestrator | 人 | 常驻整个计划，独占一个终端空间 | 只做三件事：重读计划并为阶段建终端空间拉监工；等监工；读 `stage_result` 按 `outcome` 机械分路 |
| 监工 monitor | 编排 | 按阶段实例独立，阶段结束随终端空间关闭 | 派本阶段所有 agent、盯人、路由、升级、写节点与 agent 事件 |
| builder | 监工 | 单节点 | W 阶段建任务工作区七件套与 `task_plan` |
| plan-reviewer | 监工 | 单节点 | W 阶段审 `task_plan` |
| coder | 监工 | 批内持续在场，本批 checker 通过后才收工 | 写代码、提交；自己在 `findings.md` / `lesson_candidates.md` 追加一两行；每轮写完打四行小结 |
| scribe | 监工 | 单节点 | 只写 `progress.md`；R/F 阶段还跑脚本与汇总 |
| checker 方向评估 | 监工 | 批内持续在场，与 coder 同生共死 | 核对本批是否偏离 `task_plan`；不做复核 |
| decider 决策 | 监工 | 按需 | 施工 `blocked` 时产出可落地方案；不改任何文件，可在方案文件提出「需要改计划」并写明改动内容（改计划工作流见「planner-amend 改计划模板」） |
| reviewer | 监工 | 单路 | R 阶段各路复核，路数由 Recipe 决定 |
| strategist 全局决策 | 监工 | 按需 | 返工到轮数上限仍不过时产出全局方案；不改任何文件，可同样提出「需要改计划」（见「planner-amend 改计划模板」） |

拉取顺序固定：**编排拉监工，监工拉其余**。编排不越级拉 agent；监工不跨阶段存活；规划不参与运行。checker / decider / strategist 都不写账本、不做复核、不改文件。

**批内不换人**：checker 与 decider 的方案都送回同一个 coder，账本记 `checkpoint`，不新增 attempt。只有节点级返工（X 阶段新节点）才开新实例。

## 五阶段模板

五阶段：W 建工作区 → C 施工 → R 复核 → X 返工 → F 收口备料。阶段实例 = 一个终端空间 + 一个监工；同一阶段可多次进入，用 `#k` 区分。

- **W**：builder 建七件套与 `task_plan`，plan-reviewer 审 `task_plan`。
- **C**：按 `task_plan` 批次拆 C1..Cn；每批 coder + checker + scribe，decider `on:blocked`。
- **R**：机器体检与四道闸（scribe 跑脚本）、按 Recipe 档位挂并行 reviewer、miner、收敛（scribe 汇总 `review.md`）。
- **X**：coder 修 + reviewer 再审；轮数上限读 `dh-mapping.toml`，超限停 → strategist → 用户。
- **F**：as-built、AI 提交区、交付汇报、证据展示区，全部由 scribe 备料。

模板占位符：`<card>` = 卡号；`<prev>` = 上一节点号（首节点留空）；`<n>` = 节点序号；`<k>` = 阶段实例/返工轮次；`<d>` = 卡内决策文件序号（`decision.<d>.md` 全卡递增）；`<reviewer>`/`<路>` = 按 recipe 展开的 reviewer 名与其路名；`<打回路>` = R 阶段打回的那条 reviewer 路名。

### W 阶段模板

```markdown
| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| W<n> | <card> | <card>:W#<k> | build | agent:plan-reviewer | <prev> | |

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| builder | W<n> | builder | | 七件套与 task_plan.md | | |
| plan-reviewer | W<n> | plan-reviewer | | review.plan.md | on:done:builder | |
```

### C 阶段模板

每个施工批次一个节点；coder 与 checker 批内同时在场（trigger 留空），scribe 等 coder done 后拉起，decider 仅在 blocked 时拉起；`close=agent:checker`（checker 通过才进下一批）。

```markdown
| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| C<n> | <card> | <card>:C#<k> | construction | agent:checker | <prev> | |

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| coder | C<n> | coder | | 代码与 findings/lesson 行 | | |
| checker | C<n> | checker | | check.C<n>.md | | |
| scribe | C<n> | scribe | | progress.md | on:done:coder | |
| decider | C<n> | decider | | decision.<d>.md | on:blocked | |
```

### R 阶段模板

reviewer 行数与名字由 marker `recipe=` 经 `dh-mapping.toml` 的 `[recipes.<档>]` 展开——三档集合不同，模板不写死；每路一行、trigger 留空并行。机器体检、四道闸脚本与 miner 汇总不独占 agent 行——由 scribe 在同一节点内按「先体检、后收敛」执行（§6.1 允许一个 R 实例内分节点展开，展开时各自拆成独立节点行）。scribe 在全部 reviewer `done` 后由监工拉起收敛 `review.md`。

```markdown
| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| R<n> | <card> | <card>:R#<k> | review | agent:scribe | <prev> | |

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| <reviewer> | R<n> | reviewer | | review.<路>.md | | 按 recipe 展开为并行多行 |
| scribe | R<n> | scribe | | review.md（含体检/四道闸脚本与 miner 汇总） | | 空 trigger 是约定例外——trigger 词表表达不了「等全员 done」：监工在全部 reviewer done 后按本 note 拉起 |
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
| <打回路> | X<n> | reviewer | | review.rework.<k>.md | on:done:coder | |
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

**attempt**：`--agent` 传完整 `<名字>#<attempt>`，由监工分配 = 该 `(node, 名字)` 已有最大 attempt + 1；`add` 校验 `agent_launch` 的 attempt 必须恰等于最大值 + 1，否则退出 2。只在 `agent_lost` / `cancelled` / 阶段 `failed` 后重拉时 +1，上限读 `dh-mapping.toml`。批内 `checkpoint` 往返不增；节点级返工是新实例、从 1 起。attempt 与 X 轮数两套计数独立、不叠加、不互相重置，任一先到上限即停 → strategist → 用户裁决。

事件状态机：

```text
agent_launch → checkpoint* → ( blocked → escalate → decision → [user_decision] → resume )* → (done | agent_lost | cancelled)
```

**控制事件**（`agent` 字段只写 `orchestrator#<n>` / `monitor#<n>`，不进状态机；写入者不符即拒）：

| 事件 | 写入者 | 时序与 note 强制 |
|---|---|---|
| `plan_loaded` | 编排 | 账本第 1 行且仅一次；`node` 填第一个非 superseded 节点号；`note` 必须含 `skill=`、`config_dir=<规范化并百分号编码的配置目录>` 与 `plan=<计划目录>` |
| `stage_start` | 编排 | 每阶段实例仅一次，先于该实例 `monitor_launch`；`note` 带 `stage_id=` |
| `monitor_launch` | 编排 | 每阶段实例至少一次（重拉监工可多次），在本实例 `stage_start` 后；`note` 带 `stage_id=` |
| `node_start` | 监工 | 每节点仅一次，先于该节点任何 `agent_launch`；`depends_on` 未全 `closed` 退出 2 |
| `node_close` | 监工 | 仅双判据成立才接受（全部在场 agent 有终态 + `close` 列 agent 已 `done`） |
| `stage_result` | 监工 | 每阶段实例可多次，`status` 只认最新一条；`note` 必须含 `stage_id=` 与 `outcome=done / blocked / failed / cancelled` 及原因，且在该实例全部节点 `closed` 之后；`outcome=cancelled` 的 `note` 须引用对应 `user_decision`；本阶段发生过 `plan_amend` 时另补 `amend=<方案文件名>` 与 `nodes=`（裸文件名会丢 status 的 `result.amend` 信号） |
| `stage_close` | 编排 | 每阶段实例一次；`note` 带 `stage_id=`；前置 = 已见本实例 `stage_start`/`monitor_launch`、全部节点 `closed` 且最新 `stage_result` 的 `outcome ∈ {done, cancelled}`，否则退出 2 |
| `monitor_restart` | 监工 | 任意位置不限次；`note` 列盘点结果 |
| `plan_amend` | 监工 | 运行中改计划完成后写；`note` 必须含方案文件名与 `nodes=<新节点号,…>`（改计划工作流本身见「planner-amend 改计划模板」，此处只冻结账本合同） |

**agent 事件归属**：`escalate` / `decision` / `user_decision` / `resume` / `cancelled`（决策类）记在**被阻塞/被触发的那个 agent** 名下，决策 agent 的标识写进 `note`——`escalate` 与 `decision` 的 `note` 必须**恰含一个** helper token `decider=<名>#<n>` 或 `strategist=<名>#<n>`，且 `decision` 必须复述同一 helper，缺一/多一/不符即拒。decider 与 strategist 自己的 `agent_launch` / `done` 记它们自己名下。`orchestrator#<n>` / `monitor#<n>` / `planner-amend#<n>` / `strategist#<n>` 四名豁免「agent 名在该节点 agent 表中」校验（其余 agent 名必须在表中）；改计划实例 `planner-amend#<n>` 的生命周期事件记它自己名下（工作流见「planner-amend 改计划模板」）。

**决策链两条，顺序固定**：

- **decider 链**（施工 `blocked` 触发）：`blocked` → `escalate` → `decision` → `resume`。`user_decision` 位置固定在 `decision` 与 `resume` 之间，有无由 `decision_mode` 决定——`auto` 没有（出现即拒），`consult` 必有（缺它写 `resume` 即拒）。
- **strategist 链**（监工的 attempt / 返工轮数计数触发，**无 `blocked` 起头**——`escalate` 直接作链首）：`escalate`（coder 名下）→ `agent_launch`（strategist 名下）→ `decision`（coder 名下，`note` 复述同一 helper）→ `done`（strategist 名下）→ `user_decision`（coder 名下，**永远出现、不看 mode**）→ `resume`（coder 名下，继续，不新增 attempt）或 `cancelled`（coder 名下，停卡）。

`checkpoint` 是批内往返的唯一载体：可重复任意次，不新增 attempt、不新增 `agent_launch`。

## planner-amend 改计划模板

改计划实例 `planner-amend#<n>` 由当班监工在过门后按需拉起，复用 planner 角色档，不发明新角色。输入恰四件：方案文件（decider / strategist 产出，**只读不改**）、当前 `relay_plan.md`、开发方案 `dev_plan/P<N>-*.md`、涉及的已有卡 `docs/modules/<模块>/workspace/<卡号>/task_plan.md`。

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

1. planner-amend 先从方案文件列出**完整** proposed paths；监工跑 `before` 做全量预检 + 原始工作树快照。
2. 预检不过（含命中 `design/` 禁区、新卡 task_plan、其它任何路径）：**任何文件都不改**——全部计划目标与输入方案文件零变化，planner-amend 只以普通 `done.note` 写 `outcome=out-of-scope proposal=<方案文件名> reason=<原因>` 后停止，由当班监工写 `stage_result outcome=blocked` 交用户。planner-amend 不写 `blocked` / `escalate` / `plan_amend`。
3. 预检通过才**一次改完**全部 proposed 目标。
4. 监工跑 `after`：before/after 原始快照精确 diff，成功唯一判据 `actual == proposed`；再核 HEAD/真实 index/object database 未变并跑普通 plan lint。任一失败即从仓外原始副本恢复 `actual ∪ proposed` 的 bytes/mode/symlink/存在性，planner-amend 最多修三次；第三次仍失败按同一条「零文件变化 + 结构化 done.note」路径收尾。

`--snapshot-dir` 是运行现场目录（0700/0600），不是 durable evidence，完成或验证恢复后由守门器安全删除。改计划实例不建新卡七件套；敏感 untracked 的正文、文件名与哈希不进入证据。

## 拓扑布局

**终端空间** = herdr workspace，一个阶段实例一个，cwd 指向该卡的 worktree；编排另独占一个。空间内 agent 都是根 tab 里的 pane，tab 层不使用；一般不超过 4 个同时在场。不同仓库各开各的具名 session，session 名写进 marker。阶段结束关整个终端空间；全计划结束后先关空间再删 worktree。

**任务工作区** = `docs/modules/<模块>/workspace/<卡>/` 下的七件套工件目录（brief / task_plan / progress / findings / lesson_candidates / review / execution_strategy）。

**「终端空间」与「任务工作区」不是同一个东西，不得混用**：前者是运行现场的终端拓扑，后者是磁盘上的工件目录。

## 硬规则

1. **凭据红线**：密钥 / 凭据值永不写入任何工件、账本、命令模板、派活文案或测试；证据先按白名单过滤。
2. **档位唯一来源**：Recipe 档位（`heavy` / `normal` / `light`）的唯一来源是 DevPlan 任务卡的 `任务类型`（`task_type`）字段，写进 marker 的 `recipe=`。字段缺失时规划必须停下问用户，不得自行默认（A117）。
3. **落点**：`relay_plan.md` 与账本一律落 `docs/modules/<模块>/relay/<plan_id>/`，不进任务工作区（A98）。
4. **Linux 直跑**：在 Linux 侧收口前必须直跑 python 测试，命令与输出原样记入 `progress.md`（A19）。
5. **写入者唯一**：`findings.md` / `lesson_candidates.md` 的写入者是 coder；`progress.md` 的写入者是 scribe；reviewer 各写各的 `review.<路>.md`。每份文件在一个节点内只有一个写入者（A67）。
6. **coder 四行小结**：coder 每轮写完在 pane 打固定四行小结（做了什么 / 证据 / 偏离与 findings / 下一步），缺项写「无」（A66）。
7. **scribe 素材边界**：scribe 写 `progress.md` 的素材来源按优先级为 ① 账本事件与 note（事实层）② 本批 diff 与 coder 四行小结 ③ checker / decider / 用户裁决的方案文件名与结论；素材里没有的不得发明，且不碰 `findings.md` / `lesson_candidates.md`（A66）。
8. **等待必须有接收者**：`wait` 是阻塞式 CLI，返回那一刻必须有接收者（watch 推送、前台阻塞循环、或后台退出唤醒三种之一）；watch 未实现时不得结束回合空等。
9. **不写死模型**：流程文档、模板、派活文案一律引用角色名与档位，模型取值只在 `roles.toml`。
10. **模板无 kickoff / verify 签字类节点**：节点类型只有 `build` / `construction` / `review` / `rework` / `handoff`。

## 放弃项

- 不做身份校验：账本 `by` 字段标称写入者但不验真伪，换取零启动成本。
- `status` 不判产出是否合格，只判账本完整性。
- 不设 `all_agents_done` 这类恒真枚举；节点关闭固定双条件合取。
- 不做原子写、回滚、历史 manifest（安装器侧同此约定）。
- 不做 watch 推送的实现；watch 未实现时一律走前台 `wait` 回退。
- 不允许编排做判断题：`stage_result.outcome` 机械分路，不越级拉 agent，不缓存计划。
