---
name: relay-light
description: 轻量接力编排（relay-light / relay-lite / 简单版接力），两种模式：完整模式（relay_plan + relay_log.py 账本 + W/C/R/X/F 五阶段，多卡计划；2026-09-30 起冻结，仅在途计划继续，多卡改走卡级总表 + 逐卡 single-task 自动接续）与 single-task 单卡接力（编排只分发、builder/coder/审核/决策/复核分派、watcher 巡检，无账本）。触发：用户点名 relay-light/relay-lite/接力/简单版；或贴出多角色分工表（编排/施工/建 workspace 与 task_plan/审核/决策/复核/监督）让你「按分工开工 / 派活 / 拉 agent」；或要执行 relay_plan.md。交互型任务不进本 skill，走单会话。
---

# relay-light

> 版本：v1.4.1

relay-light 是一套接力编排协议，有两种互斥模式（选法见下节「模式选择」）：**完整模式**（2026-09-30 起冻结：新计划不再使用，在途计划按原合同跑完；合同正文与 `relay_log.py` 保留不删）由人拉起规划与编排，编排在每个阶段开一个终端空间并拉起 stage-lead，stage-lead 拉起该阶段所有 agent，全部状态只以 `relay_log.py` 账本为准；**`single-task` 单卡接力**由编排直接分派各角色、watcher 旁路巡检，不建账本（见文末同名一节）。本文件是协议核心；两侧运行时的派活/等待命令写法见 `references/adapter-claude-code.md` 与 `references/adapter-codex.md`。

## 模式选择（先定模式，再拉任何 agent）

只想记住跨模块任务的先后、等待事项和交棒去向时，使用 dh-relay 仓内的 `docs/relay/templates/card-chain.md` 单卡接力总表模板（路径相对 dh-relay 仓根，不相对安装后的 skill 目录）：一行一张卡，卡内仍按下面的规则选择执行方式。总表不是第三种执行模式，不传给 `relay_log.py`，无需账本或角色配置。它与完整执行计划一样放在 `docs/relay/<施工仓名>/<牵头模块>/<plan_id>/relay_plan.md`；跨模块只维护一份。总表的更新、证据核对与恢复规则见模板及下节「卡级总表维护与交棒核对」。

| 情形 | 走哪种 |
|---|---|
| 多张卡、要按依赖先后接力 | **卡级总表 + 逐卡 `single-task`**，卡间衔接按「自动接续」；完整模式（五阶段 + 账本）已冻结，只有 2026-09-30 前已开的在途计划继续 |
| 一张已落户的卡，用户给了多角色分工（编排只分发、建 workspace/task_plan、施工、审核、决策、复核、监督等），或说「简单版 / relay-lite / 单卡接力」 | **`single-task`** |
| 命中下方「交互型任务」任一信号 | 不进 relay-light，走单会话 |

- 用户没点名模式、上表又不能唯一判定时，**先问用户走哪种，再动手**；不得自行默认完整模式，也不得按记忆里的旧配方直接开跑。
- 用户贴出的多角色分工表就是 `single-task` 的角色与模型提案：照它进 `single-task` 的 model-allocation gate，派单用 `[relay-light:single-task]` 标头，不另起一套 `dispatch/*.md` brief + `progress.md` `DONE` 信号的手动派活流程（那是 `single-task` 正式化之前的临时做法，已由本模式取代）。
- 分工表里的「监督 / 监控 / monitor」对应 `single-task` 的 `phase=watcher`，即 watcher（只观察、只报信），不是完整模式的 stage-lead；这是自然语言别名映射，不是标头 phase 值。

## 卡级总表维护与交棒核对

本节适用于已关联的卡级衔接总表，不适用于完整模式的节点/agent 执行计划。两者虽都叫 `relay_plan.md`，必须按文档类型区分；总表不传给 `relay_log.py`。这是会话必做的流程检查，**没有程序自动同步或强制拦截**。

- **入口**：单卡 orchestrator 在首次启动/恢复时检查用户交接和已有 `execution_strategy.md`，关联已知总表并记录「总表：`dh-relay:<仓相对路径>`；维护会话：<唯一会话/恢复入口>」。交互单会话在已有进度工件记录，不为此新建工作区。确认没有关联总表的独立卡写「总表：无（独立单卡）」即可；交接提到总表却缺路径时标「总表待定位」，不猜路径、不静默记无。已有在途卡下次恢复时补登记，不重启角色或补造历史。
- **写入者**：每份总表只由登记的一个协调会话写；单卡时可以是原 orchestrator，交互任务可以是原主会话，不要求另拉常驻 agent。多卡并行时各卡在自己的既有交接工件提供行更新内容和证据指针，由该维护会话顺序汇总，不让多个 coder/orchestrator 并写总表。维护人更换先完成交接并同步关联记录（时机见下条「维护人卡收口前移交」）；worker/reviewer/decider/watcher 默认不写总表；single-task 显式启用文档 agent 时，登记维护会话可按下文顺序委托代笔，维护责任不转移，不扩大文件或消息发送权限。
- **触发**：首次关联与恢复时先核对原卡、workspace 证据及当前行；进入/解除等待、卡级结果改变（例如复核结束、合入、验收）、准备停下或交棒时，更新对应行的接力情况、下一步/去向、证据引用和核对日期。不抄批次日志，不把未发生的结果写成完成。
- **非维护卡通知**：关联了总表的非维护卡，在卡级事件（开工、进入/解除等待、卡级结果变化如复核结束/合入/验收、停下、交棒）发生并把待同步行写进自己的交接工件后，由该卡 orchestrator（交互单会话为主会话）向登记的维护会话发一行 Herdr prompt：`[relay-light] card-chain update <卡号> <交接工件仓相对路径>`（除卡号和路径外不加中文）。维护会话收到后先核原证据，再按顺序汇总更新对应行与核对日期；不因通知直接照抄。通知失败（维护会话不在线/不可达）时走下文「无法更新」出口报告“总表待同步”，不自行写总表。这只是 orchestrator 向维护会话的内部通知，不扩大 worker/reviewer/decider/watcher 的写权或消息权限，也不授予任何开工/合入权限。反方向由维护会话发给他卡的 `card-chain decision` 见「并行开卡」③，同样只是通信，不授予开工/合入权限。
- **维护人卡收口前移交**：维护会话所在的卡，在收口汇报（宣称整卡完成/交棒）前必须先移交维护权：默认交给下一张已开工且关联本表的卡的 orchestrator（多张时按总表行序取首张）；没有已开工卡时交回用户，标「维护会话：待指定（用户）」；用户可另行指定接收方。移交步骤：交出方用 Herdr prompt 通知接收方 orchestrator（`[relay-light] card-chain maintainer-handoff <总表仓相对路径>`，发后读 pane 末行确认投递）；接收方在自己的 execution_strategy.md（或进度工件）「卡级总表」登记为维护会话，并回一行确认；交出方收到确认后再改总表页头「维护会话」和自己的登记。交出方不写接收方的工件。接收方未确认/不可达时不算移交完成，按“交回用户”处理（页头写「维护会话：待指定（用户）」并报告用户）。未完成移交不算收口完成。
- **交棒核对**：关联总表的卡在对外报告“已交棒”或按总表接续下一卡前，逐项核对：①行状态与原卡证据一致；②等待原因/下一步清楚；③交接条件有证据指针，版本交接有提交 SHA；④本次核对日期已更新。普通停下可以报告等待，不要求强行完成。确认项写在原有交接/最终汇报的一行「总表已核对：<路径>；<卡号>；<日期>」，不另造 receipt 或运行账本。对外消息仍需原授权，核对本身不授予下一卡开工/合入/verify 等权限；下一卡开工授权只来自总表该卡行的「自动接续」栏（见下条）。
- **自动接续**（2026-09-30 用户裁决）：总表每行设「自动接续」栏，**只由用户写定**（或用户明确指示主会话代填，代填必须附用户消息指针，该指针即页头来源），维护会话与任何 orchestrator 只读、不得新增或修改该栏；页头记「自动接续授权：<用户消息/提交 SHA 指针>」，核对时追溯不到用户来源即按「否」。栏值以字面「是」开头才算是，其余（「否」、空白、待定）都按「否」。「是」必须同时写定下一卡 orchestrator 的模型与推理档，可再附其余角色分配；写定的分配视为该卡 model-allocation gate 的明确确认（gate 节的对应例外），下一卡 orchestrator 机械登记到自己的 `execution_strategy.md`，未附的角色由它启动后照 gate 向用户询问。「是」等同于 AGENTS.md 协作流程第 5 条对该卡的开工授权，范围、验收以原卡为准。执行者只有**维护会话**：本卡收口时在「维护人卡收口前移交」之前执行一次；收到非维护卡收口的 `card-chain update` 通知时，核完原证据后也按 ①–④ 对以该卡为前置的下一卡执行，这种情况不触发维护权移交；非收口时机的触发见下条「并行开卡」。非维护卡收口只发通知，不自行执行。对以收口卡为前置的每张下一卡按行序处理：①核对其「接棒条件」——条件必须写明以哪道闸为准（合入 SHA / verify 提交 / 人验结论），且全部前置卡（含其它链路的扇入前置）都有证据指针，任一缺证即不开；含人验的条件由主会话/用户在接力流程外给出结论，orchestrator 不代判；条件在本卡收口之后才满足的（如本卡 verify、人验），收口时只写「等待：<条件>」，收口卡不驻留等待，之后由用户人工放行或指示维护会话再判。②「是」且条件齐全时，按目标仓协作规则做开局准备且只做这五步：Issue 立户（正文取自原卡的目标/范围/验收/档位/风险/停止边界，原卡缺项即按 ④ 停；已有 Issue 则复用）、从目标远端 master 建任务分支与 worktree、开工提交推上去建 Draft MR/PR 并关联 Issue、新开一个 Herdr workspace、按 adapter 写法以写定的模型档拉起该卡 orchestrator；启动 prompt 给原卡路径、总表路径、Issue 号、分支名、worktree 路径、MR/PR 号与写定的分配，由它自己登记，本卡 orchestrator 不写它的工件；读 pane 末行确认投递。多张满足条件的「是」卡逐张全部拉起，维护权按「维护人卡收口前移交」交给行序首张。③「否」时只做到核对，行写「等待：用户放行开工」并报告用户，不建 Issue、不拉 agent。④任一步失败（Issue 建不成或原卡缺项、worktree 冲突、分配未写定、拉起不成或投递未确认）即停当前这张卡：行写「等待：<原因>」，其余「是」卡按行序继续；收口汇报带上失败原因和已建成的半成品（Issue 号、分支、Draft MR/PR 号、workspace），交用户接手或清理；不重试、不修环境、不向用户临时索要分配、不代做下一卡施工；维护权仍按「维护人卡收口前移交」默认规则处理，只是本次失败的卡不算已开工。自动接续不设跨卡常驻编排、不新增角色/账本/脚本；被拉起的 orchestrator 仍按 `single-task` 从入口登记开始执行，对未写定的角色自行走 gate。
- **并行开卡**（2026-10-06 用户裁决）：接棒条件互不依赖的多张「是」卡（彼此都不是对方的前置，接棒条件写「无」也算）可同时各开一个 Herdr workspace 并行推进，不必等前一张收口；允许路径重叠或改同一文件的卡视同有依赖，按行序串行，拿不准按有依赖处理；因此被串行的卡行写「等待：与 <卡> 路径重叠」，维护会话收到该冲突卡收口通知时，对它同样按 ①–④ 再判，不因它不以冲突卡为前置而漏判。除上条两种收口触发外，维护会话在首次关联/恢复核表时，以及用户新写定「是」后，对当时接棒条件已齐、行状态为「未开始」且尚无已登记 Issue/分支/workspace 的「是」卡按上条 ①–④ 各执行一次（已开工、已收口或留有半成品的卡一律不再拉起，半成品按 ④ 交用户）——这只是「自动接续」同一流程的另一触发点，不是新授权；非收口触发不移交维护权，维护会话照常留在原位。边界：①每张卡仍须本行「自动接续」为「是」且全部前置有证据，有依赖的卡仍等其前置，「否」的卡只核对报告；②维护权仍只一份，并行各卡的 orchestrator 只按「非维护卡通知」发 `card-chain update`，总表仍由维护会话顺序汇总；③询问者唯一：并行期间（同表有两张及以上卡在推进）各卡 orchestrator 不自行向用户发问，只按 single-task「小决策交 decider，问用户攒齐一次」先交 decider、把仍需用户决定的事项登记为本卡 findings D 项，作为「进入等待」卡级事件通知维护会话；维护会话在对应行写「等待：用户决定（<卡> findings D 项）」，在维护会话的最近自然停点把各卡待决项按卡分组一次问用户（命中停卡、安全、生产影响的立即问），再用 Herdr prompt `[relay-light] card-chain decision <卡号> <用户原始消息指针>`（如维护会话名 + 答复时间；只传指针，不在 prompt 里放答复原文）把每卡答复的来源转给该卡 orchestrator（读 pane 末行确认投递），由它在本卡 findings 登记来源（经维护会话转达的用户答复、时间）。维护会话不写他卡工件、不改写或代答；只剩一张卡在推进时恢复由本卡 orchestrator 自问；④并行不改变每卡的 model-allocation gate、Issue/分支/Draft MR/PR、一卡一 worktree 与收口规则，也不新增跨卡常驻编排。
- **无法更新**：路径不存在、维护会话不可用、无写权或文件冲突时，不创建替代表或覆盖他人修改；在本卡既有交接工件保留待更新的行内容及证据位置，并向用户报告「总表待同步」和原因。未核对前不能宣称已交棒、不能依赖旧摘要放行后续；不阻断无关的已授权卡内工作。恢复后先核原证据再补表，不能仅凭旧摘要恢复。

## 适用边界：交互型任务走单会话

relay-light 的 worker 不回头问用户，卡住只能写 `blocked` 交 decider / strategist。需要与用户高频交互的任务放进来只会反复 `blocked → escalate → resume`，还白开 checker / scribe 等角色，因此**不进 relay-light**（完整模式与 `single-task` 都不进），改由**单个 Agent 会话**按 dev-harness 与用户直接对话推进（2026-09-23 用户裁决，#63）。

判定信号，任一命中即走单会话：

- 需要用户在测试环境 / 跳板机 / 生产机上亲手执行命令或贴回输出；
- 需要用户输入凭据、扫码或做物理操作（凭据值仍按硬规则 1 不入任何工件）；
- 预计与用户来回确认 **≥3 次**；
- 下一步取决于上一步的现场输出，无法预先拆成批次与 `task_plan`。

单会话只替代「多 agent 施工」这一段：dev-harness 的入口闸、Recipe 复核（施工者不复核自己的卡）、verify、需求境证据照常生效；过程与证据由该会话写进任务工作区 `progress.md`。完整执行计划中混入一张交互卡时，本版不在节点表里建模：把该卡移出执行计划、单会话做完后再作为后续执行计划的前置条件（交互节点类型暂缓，见 #63）。卡级衔接总表可以保留这张卡，记录等待事项和恢复入口，不派发交互 worker。

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
| watcher（旁路） | 编排或 stage-lead | 一个终端空间 | 只观察、只报信给本空间派活方；不派活、不写账本、不改文件。完整 relay 模式：盯 agent 状态变化与 20 分钟 tick 由 `relay_log.py watch` 程序承担，watcher agent 每终端空间一个、每 10 分钟只读核本空间 watch 存活，缺席即报信本空间派活方（stage-lead/编排）重拉；`single-task` 模式无账本不接 ledger watch；`space_watch.py` 每 120 秒动态发现本 Herdr workspace 全部 agent（排除 watcher 自身和主编排）并机械比对状态，`phase=watcher` 只启动脚本与巡检存活 |

拉取顺序固定：**编排拉 stage-lead，stage-lead 拉其余**。编排不越级拉 agent；stage-lead 不跨阶段存活；规划不参与运行。checker / decider / strategist 都不写账本、不做复核、不改文件。

### 术语与判断分层

**判断分三档，stage-lead 只占最浅那一档**：

| 判什么 | 谁判 | 性质 |
|---|---|---|
| 产出内容合格不合格 | 判定方——plan-reviewer / checker / reviewer（节点表 `close=agent:<判定方>`） | 内容判定 |
| 批内卡住怎么绕 | decider（`on:blocked`），`decision_mode=consult` 时报用户 | 小决策 |
| 扩界 / 改计划 / 新增卡 / 停卡 | strategist 出方案 → `user_decision`（**永远出现、不看 mode**）→ 用户定 | 方向决策 |
| 谁该上场、投没投递到、是不是挂死、能不能关节点 | **stage-lead** | 程序性判定（全部有明文判据，无自由裁量） |

所以 stage-lead **不做内容判定、不做方向决策、不持有授权权**：越界、push / PR / 合并、超限停卡一律 `user_decision` 升给用户。例外：计划前言已预授权的闸后推送与 MR/PR 评论属于执行已有授权、不是持有授权，stage-lead 在收节点后执行，并在该节点 `node_close` 的 note 追加 `pushed=<SHA>`、`mr_note=<评论 ID 或 URL>`；合并仍按各仓授权。有判定方的节点（W/C/R/X）里 stage-lead 只读判定方的结论，不自己判内容；没有判定方的节点（F 的 scribe、decider 这类 `close` 就是自己）只做形式核——产出文件存在、非空、落在允许路径内。

**四个非角色概念**，不进角色表、不进账本 `agent` 字段：

| 概念 | 指什么 | 落在哪 |
|---|---|---|
| **agent kind** | `claude` / `codex` / `devin` / `omp`——每个 agent 一个属性，决定启动参数与「能不能结束回合靠推送叫醒」 | `roles.toml` 缺省 + 计划 agent 表 `launch` 列；两份 adapter 的差异本质就是编排/stage-lead 位上的 kind 不同 |
| **终端载体** | 管终端空间与标签页的那个工具，现在是 herdr | 命令写法只出现在两份 adapter 的载体小节，换载体只改那里；协议正文只用「终端空间 / 标签页」这两个抽象词 |
| **用户** | 裁决与授权：越界放行、push / PR / 合并、超限停卡 | 账本 `user_decision` 事件；`decision_mode=consult` |
| **开局准备** | 派计划前必须就位的东西：worktree、分支 `wt/<卡>`、基线 SHA、共享目录软链、本计划 `config/roles.toml`；2026-09-30 起新卡另含 Issue、首提交与 Draft MR/PR | 硬规则 12 + 计划前言，由用户在派计划前完成 |

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

**Issue 与 Draft MR/PR 时机**（2026-09-30 用户裁决，新卡起生效，在途卡按原合同继续）：W 前 Issue 立户；任务分支首个提交（开工提交，可为空提交）推上去即建 Draft MR（GitLab）/ Draft PR（GitHub）并关联 Issue，MR/PR 号写进计划前言（marker 可加 `mr=`/`pr=`）。完整模式下这三步属开局准备，由用户在派计划前完成（不是 W 阶段 builder 的提交）；运行中每道闸后的推送与评论须计划前言写明已获授权，未写明时仍按「push / PR / 合并一律 `user_decision` 升给用户」执行。分支基于目标远端 master（不是 relay master）。评论与收口见「F 阶段收口 checklist」。

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
- [ ] Issue 与 MR/PR 收口（2026-09-30 用户裁决，新卡起生效，在途卡按原合同继续）：
  - **建分支即开 Draft**：Issue 立户后建任务分支，首个提交推上去即建 Draft MR（GitLab，wf 仓须经 integrator 机）/ Draft PR（GitHub）并关联 Issue；号登记在计划前言。具体推送/建 MR 机制按各施工仓自己的协作规则，本 skill 只规定时机与评论，不覆盖各仓规则。
  - **闸门结论发评论**：plan-review、batch-review、workflow-final 各路、E2 code_review 及人验结论，由当班 stage-lead（完整模式，须计划前言已授权推送与评论）/ orchestrator（single-task）按判定方自写的结论发 MR/PR 评论，内容为闸门名 + verdict + 被审 SHA + P0～P3 计数 + 证据路径；只转述，不代判、不改写结论、不含凭据。评论属通信/协调工件，不构成授权。每道闸通过或返工提交后推送分支，更新 MR/PR。完整模式的闸门对照：W 的 plan-reviewer、每个 C 批次的 checker、R 每路 reviewer、X 再审路的结论，由对应阶段 stage-lead 在收节点时发；完整模式没有 E2，人验在接力流程外，由主会话或用户发。
  - **基线与合并**：任务分支基于目标远端 master（wf 仓为 GitLab master SHA，不用 relay master）；合并用平台 squash，不再做收口手工 squash 重建。F 阶段：解除 Draft、更新最终描述（改动/验证/风险/Issue），按各仓授权合并；合入/verify 仍按各仓授权。

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
7. **scribe 素材边界**：scribe 写 `progress.md` 的素材来源按优先级为 ① 账本事件与 note（事实层）② 本批 diff 与 coder 四行小结 ③ checker / decider / 用户裁决的方案文件名与结论；素材里没有的不得发明，且不碰 `findings.md` / `lesson_candidates.md`（A66）。 本条及第 5 条中的 findings/progress 写者规则仅属完整模式：其 progress 可摘录裁决来源与结论；single-task 按下文「决定落点」执行，不把完整模式的 scribe 写权迁入单卡。
8. **等待必须有接收者**：`wait` 是阻塞式 CLI，返回那一刻必须有接收者（watch 推送、前台阻塞循环、或后台退出唤醒三种之一）；有 watch 时允许结束回合、靠 prompt 唤醒，无 watch 时不得结束回合空等。
9. **不写死模型**：流程文档、模板、派活文案一律引用角色名与档位，模型取值只在本计划 `config/roles.toml`（用户提前定好；skill 副本里的 `roles.toml` 只是缺省模板）。
12. **建树前置**：编排在每个阶段实例开始前核该卡 worktree 存在、分支为 `wt/<卡>`、基线为计划前言的 SHA（指任务分支起点，即 `git merge-base HEAD <基线SHA>` 等于该 SHA；开工首提交与后续提交使 HEAD 前进不算不符），以及施工仓约定的共享目录软链已就位（wf-analytics-platform：v2 `.venv`、`frontend/node_modules`、`backend/data/datasets` 三条指向主仓）；缺任一即 `stage_result outcome=blocked` 交用户，编排不自行建树、不改软链。开局准备（建树与软链）由用户在派计划前完成并写进计划前言。
13. **决策模式按卡**：marker `decision_mode=` 是计划默认，`cards=` 里可按 `<卡>:<档>:<auto|consult>` 覆盖；不做批次级。
10. **模板无 kickoff / verify 签字类节点**：节点类型只有 `build` / `construction` / `review` / `rework` / `handoff`。
11. **判定方封口纪律**：判定方判定 PASS 前，送审方与判定方均不记 `done`；FAIL 走 live 判定方的 `checkpoint` 路由回同一送审方；PASS 后按送审方→判定方顺序记终态。

## `single-task` 单卡接力模式

`single-task` 与上方完整 relay 模式并列、互斥：用于一张已落户任务卡的规划、施工、复核与人验接力，**对完整模式执行计划，不创建或读写 `relay_plan.md` / `relay_log.jsonl`，不使用 W/C/R/X/F 阶段词**；本节不改写上方任何完整模式合同，五阶段模板与账本行为不回归。卡级总表由登记的维护会话按「卡级总表维护与交棒核对」维护；启用文档 agent 时按下文委托代笔，其余 worker 与 watcher 边界不变。

### 编排职责与执行边界

- orchestrator 只负责已授权的派发、通信、运行状态核对、既定信号路由及指定协调工件维护；担任维护会话的 orchestrator 另可按「卡级总表维护与交棒核对」的「自动接续」「并行开卡」授权（含本卡收口前、收到非维护卡收口通知时及并行开卡的非收口触发）执行下一卡的开局准备，限「自动接续」②写明的五步，不含下一卡的施工与测试；不自行运行测试、回归、复现、基线对照或业务证据复算，也不为这些工作自行建立临时测试目录/worktree、装配环境。不得以“只读”“临时”“交用户前自核”为例外。
- 测试和基线取证交当前获派的 coder；独立核验交发现问题的当前复核路径 reviewer（批次内为 batch-reviewer，workflow-final/E2 按下节对应路径），必要时复跑。编排发现缺证或矛盾，退回对应产出方补证，不代产证据、不代判 PASS；补证沿用现有 phase、signal、轮次与写者规则，不新增角色或绕过 model-allocation gate。
- 编排可读 signal、报告、Git 状态/SHA/diff，核对路径、身份、字段与既有结论是否一致；可解析 JSON 读取已有 verdict/证据引用。重新计算业务结果、判断验收或失败归因属于执行/复核：例如从 ops profile 计算 capability 增删、digest 差异或 manifest hash，或从测试输出推导“既有失败、可放行”，均应派给 coder/reviewer。是否越界按用途判断，不按命令名称或是否写文件判断。
- Draft MR/PR 与闸门评论（2026-09-30 用户裁决，新卡起生效，在途卡按原合同继续）：Issue 立户、任务分支首个提交推上去后即建 Draft MR（GitLab）/ Draft PR（GitHub）关联 Issue，号登记在 `execution_strategy.md`；分支基于目标远端 master，合并用平台 squash。plan-review、batch-review、workflow-final 各路、E2 code_review 与人验结论，由 orchestrator 按判定方自写结论发评论（闸门名 + verdict + 被审 SHA + P0～P3 计数 + 证据路径），只转述、不代判、不含凭据；每道闸通过或返工提交后推送分支更新 MR/PR。发评论属通信/协调职责，不改变「不代判 PASS」；推送/建 MR 的机制与合并授权仍按各仓协作规则，最终解除 Draft、更新描述并按授权合并。
- **小决策交 decider，问用户攒齐一次**（2026-10-05 AW_06 用户规则，10-06 重申）：编排遇到非方向性选择，既不自行拍板，也不逐项问用户，而是派 decider（`phase=decision`）出 `decision.<d>.md`。**交 decider 的白名单**：验证方法或环境细节（如本机测试用哪种临时实例）、派单纠正、卡内允许路径内的修法选择、诊断后的修复方式、已授权范围与额度内额外加一轮整改、不扩路径的兼容/实现路线选择。**仍问用户的闭集**：扩出卡上允许路径、新的真实外部调用或额度授权、停卡、合入（开工授权包已覆盖的按授权执行，不算新决策）、部署、改变验收口径，以及「生命周期与计数」一节的六类方向问题；拿不准归哪边按问用户处理；decider 结论若触及问用户闭集，编排不按其路由，改登记为 D 项问用户。decider 结论由 orchestrator 在 `findings.md` 登记摘要并注明 decision 文件，同时知会用户；知会不是征求同意，不等回复即按结论路由。需问用户的事项登记为 findings D 项、攒齐后在最近的自然停点（批次交界、等待、收口）**一次**询问，不分多次打断；命中停卡、安全或生产影响的立即问。并行开卡期间询问者改为维护会话，见「并行开卡」③。decider 若不在已确认分配内，其模型确认并入同一次询问。反例：AW_07 编排把「临时 PG 选型」「legacy 兼容默认（不扩路径）」问了用户，应交 decider。
- 用户对进行中动作提出原则性纠正时，不自动解释为立即终止或删除现场；停止发起新的同类动作，按明确指令处理在途工作。语义不清由主会话澄清并保留现场；明确要求立即停止或命中既有停止条件时立即执行。终止进程与删除现场分别判断，不以纠正分工为由一并清理证据。

### 范围外既有失败

- **取证与写者**（默认写者；启用文档 agent 时只委托人工落笔，原始取证责任不变）：coder 在首批或首次发现失败的复核路径取证，由对应 reviewer 独立审核。`findings.md` 中基线取证、归因及其关闭状态仅 coder 写；下文决定记录的追加权不扩大归因写权。reviewer 只写自己的 review/check 工件；reviewer 发现的基线问题由编排路由 coder 登记，编排不自行登记归因。测试明细放派单指定的证据文件，`progress.md` 仍只由当前 batch coder 在批末写一条里程碑和证据引用。
- **最小证据**：记录基线用途（整卡或批次）、完整 SHA 与选择依据、候选 SHA 及未提交差异标识、精确 cwd/解释器/完整命令、必要环境与依赖条件、实际收集范围和 passed/failed/error/skipped/deselected 数量、退出码、逐项测试标识与失败阶段/原因、证据路径。批次前基线不能冒充整卡开工基线；同一解释器不等于环境可比，缺少资源或导入了候选代码的对照不作有效基线。
- **临时现场**：由执行者按派单指定位置及权限准备隔离对照环境，优先考虑 `git archive <SHA>`，保留所需文档/配置/资源并核实实际导入路径；依赖 Git 元数据的测试不能强制使用 archive，替代方法须在派单允许范围内。不得修改共享依赖或借临时现场扩张权限。正式验证期间冻结影响被测现场的写入；可能互相污染的测试严格串行，每次取得退出码再继续。先保存白名单过滤后的有效证据，再按派单清理自己建立的临时现场。
- **归因与放行分开**：证据完整且独立审核通过，才可将归因记为 `closed-as-baseline`；它只表示归因闭合，不表示缺陷修复、验收豁免或 CI 通过。证据缺失/未审核保持待核，不先关闭后补。允许失败集合必须引用明确清单和审核证据，并符合既有验收合同；从“全绿”变为“无新增失败”若改变验收标准，交用户确认，不由编排/coder/reviewer 自行放宽。基线归因不自动降级 P0/P1，不覆盖必需 CI、独立复核、verify 或人验门。
- **批次内闭合时序**：首次送审时 coder 可在 findings 保留待核状态并提交完整证据。若 reviewer 确认基线归因、但 findings 尚待回写审核引用/关闭状态，须在自己的 review/check 记录归因结论及待补登记项，以本批 FAIL 按既有整改路径回同一 coder（计入原整改计数，不清上下文、不新增或重置轮次）。coder 仅按审核证据更新 findings/允许集合引用并重新送审，由原 reviewer 核对后才发 batch PASS；归因成立不等于整批 PASS。不得先 PASS/clear 再找编排代写；本批剩余整改额度不足时按既有超限路径处理。
- **最终复核/E2 首次发现**：留在发现问题的原 `phase/path`，不重开已 PASS/clear 的批次，也不借 batch-reviewer 替代当前路径 reviewer。缺证或归因未闭合由该 reviewer 在自己的工件与 signal 记录阻断项；编排按本路径现有整改合同派 coder 补证/回写 findings（派单沿用 `phase=workflow-final` 或 `phase=e2-code-review`、原 path，`batch=na`，精确产出和 signal 路径由派单指定）。coder 仅施工/补证并送审，不自审。workflow-final 每轮复审换 fresh reviewer、每 path 最多返工 2 轮；E2 仅初审有 open P0/P1 才进入同一 `reviewer_session_id` 的 targeted attempt 2，不发第三派。归因确认但 findings 待回写时同样作为未闭合项返回 coder，不能提前 PASS；下一次审核遵守该路径的换人/计数规则，不套用批次内“原 reviewer”规则。额度不足或不满足 E2 定向复查条件即按既有决策/用户路径停报，不新开 batch、重置计数或绕过未闭合项。补证结束由该路径 reviewer 的独立结论及 signal 恢复路由，不能用 coder DONE 代替。
- **逐项判定**：完整执行约定测试后，当前失败须属于有效允许集合，且同名失败阶段/原因无实质变化；本卡必需通过项全部通过。核对收集范围及跳过/排除原因，不能用漏收集、删测、skip、弱化断言制造子集。已按合同修复转绿的项由 coder 登记、reviewer 核验后移出允许集合，再失败不得沿用旧豁免。不得强求允许项继续失败来凑齐数量。
- **停止条件**：基线无法复现、环境不可比、测试中断、证据缺失或集合外失败，执行者写本角色 BLOCKED signal，由编排按既有规则路由；不自动补入基线、不顺手修范围外问题。审核未通过不得放行，coder 的 DONE 只表示送审就绪；最终路由仍依据 reviewer 自写的独立结论和 durable signal。

### 标头与 phase 闭集

- worker 派单 prompt 首行固定为 `[relay-light:single-task] worker · phase=<phase> · agent=<role>#<instance> · batch=<n|na> · round=<n> · workspace=<repo-relative-path>`；与完整 relay 的 `[relay-light] worker · node=...` 标头互斥，两套流水不交叉执行。
- phase 闭集：`plan` / `plan-review` / `batch` / `batch-review` / `workflow-final` / `e2-code-review` / `decision` / `watcher` / `human-acceptance`；`batch=1|2|3|na`。
- `RELAY_RECEIPT` fail closed 分流：进程环境存在 `RELAY_RECEIPT` 时，产出型 builder/coder/reviewer/decider（含已启用的 document）只写本角色精确 `BLOCKED.*.md` 单行 signal 后立即停止；watcher 保持 repo/workspace 零写入，只用 Herdr prompt 非 durable 通知 orchestrator 后立即停止，不写 `BLOCKED`。两个分支均不得清除任何 `RELAY_*` 环境变量。

### model-allocation gate（启动任何 agent 之前的硬闸）

- orchestrator 必须先向用户展示全部拟启动角色/实例的模型与推理档提案表，并明确询问确认；推荐默认仅是提案，不写死模型。用户可逐角色修改；**未获明确确认不得启动任何 agent**。唯一例外：卡级总表「自动接续」栏由用户写定的分配（见该节），视为对应角色的明确确认，其余角色仍照本条询问。
- 确认后由 orchestrator 机械地把确认来源、角色/实例、模型、推理档写入 `execution_strategy.md`；未启动的 tab/pane 标 pending，启动后补齐实际 Herdr workspace/tab/pane 与观察来源并逐项比对。默认由 orchestrator 维护 `execution_strategy.md`，watcher 与其它角色只读；启用 document 时按下文首次建卡/代笔合同登记，由 orchestrator 核对分配事实。授权与模型确认事实保留在此，业务决定只按下文「决定落点」引用 findings。
- 恢复时可沿用已有明确确认且分配未变的快照；新增/更换角色或实例、换模型或推理档必须再次询问确认。超时、静默或最大工具权限均不推定确认；最大工具权限不扩张 commit/push/PR/merge/deploy/verify/人验授权。

### 生命周期与计数

固定生命周期：任务工作区七件套与 `task_plan.md` → plan review → 分批开发 + batch review → 开发后按 `task_type` Recipe 展开的全量 workflow-final review → E2 code_review → 主会话人验。batch review 与 workflow-final 是**两道独立闸**，batch PASS 不替代 final。

- `review_round` 与 `remediation_count` 分开记：初审 `review_round=1 remediation_count=0`；plan/batch review 各最多整改 2 轮，FAIL 回同一 builder/coder、原 reviewer 复审；超限交 decider，六类方向问题（方向/范围/验收/数据语义/安全/生产影响）交用户；超限之外的非方向小决策同样交 decider，见「编排职责与执行边界」。
- workflow-final 每条适用 path 最多返工 2 轮，**每轮换 fresh reviewer**，不得复用上一轮实例冒充 fresh；E2 `code_review` 初审为完整 fresh，仅出现 open P0/P1 后由**同一 `reviewer_session_id`** 做 targeted attempt 2。两层证据分别登记身份/输入/finding/结论，条件相斥不得合并为一条。
- 完成谓词：全部适用 `task_type` Recipe path PASS 或有可核查 N/A，最终汇总无 open P0/P1；heavy 五路（code-round1/code-round2/requirement/consistency/lesson）一条不少；单一 final reviewer、batch PASS 或 E2 receipt 均不替代整套 Recipe。施工者不复核自己的施工。

### batch PASS 后会话清理闸

- 仅当该批 batch reviewer 的 durable signal 为 PASS **且**本批工件齐全（本批交付物、验证证据、coder signal、review 产物、reviewer durable PASS）后，orchestrator 对本批 coder 与 batch reviewer **各执行一次 `/clear`** 并分别复验已清理，之后才启动下一批。终端 idle/done 或 coder DONE 不替代此门。
- FAIL/整改期间禁止 `/clear`，保持原 coder/原 reviewer session，不借清理清零整改计数；清理失败或无法复验时不得启动下一批，也不盲目重复发送 `/clear`。watcher 常驻、不 clear；decider 按需拉起，不纳入每批固定 clear。

### durable signal 与写者边界

- 每个产出型 worker 的收口物是单行 signal：`DONE`/`BLOCKED` + `task phase agent batch path review_round remediation_count verdict evidence`（BLOCKED 另含 `reason=<snake_case>`），值无空白、证据为 repo 相对路径逗号分隔；写完即停，不等 `node_closed`，不碰完整模式 plan/log。
- sole writer（未启用文档 agent 时）：`execution_strategy.md` 仅 orchestrator 写；各 review/check/decision 工件由对应 reviewer/decider 自写；`lesson_candidates.md` 仅 coder 按派单追加；`progress.md` 仅由当前顺序执行的 batch coder 在自己 batch 完成时追加**一条**简洁施工里程碑 + 证据引用——不记决定、pane/agent 状态、轮询、通知或终端输出；reviewer/watcher/orchestrator 不写 progress。
- **决定落点**：`findings.md` 承载用户裁决（含点选/确认时间与原始来源，未知时间如实标未知）、decider 结论摘要及独立 decision 引用、D 项（待用户决定项）状态、范围外发现与 P3 遗留去处、给用户的知会。遗留须用户明确点头并标去处；未确认保持待决定，不把知会、沉默或编排摘要当作同意，不用记录代替解决。
- **findings 写者**：orchestrator 只追加已有裁决的来源、摘要、D 项状态、遗留去处和知会，不自行生成业务结论或基线归因；coder 按派单追加发现与证据，基线归因仍遵守上节专属写者及审核闭合流程。同文件由编排安排错开写入，每次派单注明精确章节与唯一写者；复核期间冻结相关候选内容，不并写或覆盖他人记录。仅启用 document 时可按原责任方确认代笔，不强制启用。
- **执行策略内容**：`execution_strategy.md` 只记编排事实：授权与停止线、角色/模型/实例、总表关联与维护人、派单与路由、批次流转与 clear 闸、提交/checkpoint SHA；业务决定处只放指向 findings 对应条目的指针，不放决定正文。模型确认事实不因此迁出，记录模型来源不等于扩大授权。
- **人验与恢复**：主会话人验后的用户选择及知会仍落 findings，并指回真实用户来源；decider 摘要不覆盖独立 decision，开工授权不冒充人验。缺来源或摘要与原件冲突时保留待核状态并回原责任方澄清，受影响动作不凭摘要放行；恢复按下文四类权威回查。
- watcher 对 repo/workspace **完全只读**：不写 signal/progress/execution_strategy/轮询日志/通知日志或任何文档；不路由、不分派、不启动 agent。

### 文档 agent（single-task 可选分工）

- **默认不启用**：不要求创建独立文档 agent、终端或标签页。文档由原责任方按既有写者规则直接编写；未启用 document 时，不登记 document 实例、不走代笔确认链，也不等待 document 的 SYNCED 信号。缺少 document 配置或信号不构成阻塞。
- **仅按用户明确要求试验**：用户明确指定本卡试验文档分工后，才适用以下代笔合同；在本卡既有任务/执行策略中登记 document 实例、模型档、获授权文件和内容责任方。默认建议低成本档，实际模型沿用 model-allocation gate；已有明确分配直接登记。未启用的卡沿用默认写者，不强制迁移在途卡，不影响完整模式 scribe。
- **范围**：建卡、设计/计划、进度、问题、复核/决策正式报告、使用说明、as-built、收口与总表均可在授权路径内委托。文档本身是产品交付物时，用户可指定由执行者编写，document 只记录过程；例如“Codex 改 skill，document 写 dev-harness 过程”不等于已验证所有文档类别。共享设计/计划/总表由登记维护方委托，不允许多卡并写。
- **责任**：执行者提供方案、实际结果和测试输出；reviewer/decider 提供最小结构化问题定位、级别、结论、证据与适用版本。document 直接读指定 diff、原始结果和目标文档，不要求其它角色先写正式报告。原始日志、工具产物与 durable signals 仍由生产者生成，document 不修改来源、不施工/测试、不代验收、不派活、不自行 commit/push/merge。
- **首次建卡**：工作区不存在时，主会话先在派单中给出 Issue/任务来源、已确认模型、精确创建路径、分工和验收输入，再派 document 在 plan 阶段创建任务文档及 execution_strategy。主会话核对登记后再启动依赖该配置的角色；不豁免模型确认或开工授权，不另建账本。
- **派单**：document 是角色，不是新 phase。沿用文档所属的现有 phase：建卡 plan、施工 batch、审核 plan-review/batch-review/workflow-final/e2-code-review、决策 decision、收口 human-acceptance；不使用 watcher phase，不改九值闭集或 batch 枚举。每次写明请求标识、原阶段/路径、候选版本或文件摘要、结论/证据、精确可写文件和待核责任方。document 的 path=document-<请求标识>，成功 verdict=SYNCED，仅表示已同步；缺证/冲突/过期写 BLOCKED 和 reason。信号文件用独立请求名，如 DONE.<phase>.document-<请求标识>.md；重试另取请求标识，不覆盖历史。SYNCED/READY 不能替代执行、复核或人验 PASS。
- **复核代笔**：reviewer 独立检查候选并生成原始结果，自写 verdict=READY_FOR_DOCUMENT 的阶段 signal，编排仅据此派文档。document 写报告并发 SYNCED 后，同一 reviewer 核对结论、级别、遗漏、证据和适用版本，再另写该路径确认 signal（不同文件名，原 signal 保留）。仅 reviewer 确认可用于原路径放行；原始 FAIL/REVISE 不得转成 PASS。代笔错误回 document，不重跑施工或重置计数；实质发现改变仍走原路径整改/轮次。文字来源确认不是新增复核轮，也不替代后续 fresh reviewer 独立审候选与原始证据。
- **其它记录**：机械进度按原始结果回填；方案、决定、模型配置与验收状态由原责任方确认再供后续消费。人验只引用用户真实判断，human-acceptance 不授予代签权；决定与知会写入 findings，执行策略只放对应指针，progress 不放决定。编排核身份、路径、版本和确认引用，不替 reviewer 判断内容。确认记录指向具体章节/结论与版本；无关章节追加不使旧确认失效，修改已确认内容则重新核对。
- **顺序与恢复**：明确委托的人工文档由 document 顺序写，原责任方不再同时写入这些文件；未委托文件保留原写者。可按需复用同一文档会话，写完本次 signal 即停，下次由编排派单，不常驻轮询。验证/复核期间冻结相关候选文件；并发修改、来源漂移、缺证或中断时保留事实及待同步项，不猜、不覆盖他人改动。恢复核原始来源、请求与当前文件，避免重复追加；必要记录未同步不宣称交棒、不清理现场。失联保留待同步，换实例沿用确认规则，不静默恢复多写者。
- **效果**：由实际执行侧评估准确性、遗漏、及时性/可接续性、交接纠错负担及可得耗时用量，document 只转录。费用未知写未知，无可比基线不声称省钱，不为评估新增台账。这些是可演练、可审计的协议约束，现有工具不提供沙箱隔离或自动阻断保证。
- **优先级**：仅覆盖 single-task 中明确委托文件的默认 sole writer、取证段中的人工落笔要求及总表代笔要求；决定权、取证、RELAY_RECEIPT、独立复核、授权和 watcher 零写入不变。四类恢复依据保留：原角色 signals、经责任方确认的报告及原始来源、经编排核对的执行策略、Herdr 实态；不能只凭文档摘要恢复。

### watcher 节拍与安全 Enter

本模式的常驻观察者是 **watcher**（`phase=watcher`），只启动固定观察脚本与巡检，只报信。角色表中的「监督 / 监控 / monitor」是它的自然语言别名。

- 监控范围固定（2026-10-07 用户修订）：所在 Herdr workspace 的其他 agent，每轮按 `workspace_id` 重新发现，新拉起的角色自动纳入；排除 watcher 自身和主编排，不按名字前缀或派单名单筛选。主编排始终只作通知对象，无论是否在这个 space；每轮 `get <编排名>` 解析 `--notify` 对应主编排的实际 pane 身份后排除该 pane，不靠模型猜角色，不静默排除其它角色。
- 固定脚本负责比对：`python3 <SPACE_WATCH> --workspace <Herdr_workspace_id> --notify <编排名> --self <watcher_Herdr名>`。`SPACE_WATCH` 在仓内为 `tools/relay-light/space_watch.py`，安装后为 `<skill目录>/space_watch.py`；Herdr workspace ID 与标头里的任务文档 workspace 路径分别填写，不能混用。第一轮成功快照建基线，随后每 120 秒 list 全部 agent、按 workspace_id 筛选并按 pane ID get 状态（`agent` 是 kind，不是名字；未命名成员同样按 pane 监控）；新增/离开、`agent_status` 或 `state_change_seq` 有变化即通知，无变化静默。通知只是即时提示，不是 durable signal。
- 投递确认由脚本执行 `herdr agent prompt --wait --until working --timeout 5000` 并核通知对象同 pane、最终 `working` 与 `state_change_seq` 推进（极快结束未捕获 working 也保守报未确认）；失败/超时/未确认不提交比较基线，输出固定 `SPACE_WATCH_BLOCKED reason=...`、仅白名单状态 diff 的 `UNCONFIRMED` 提示并非零退出，交 watcher 报信。脚本不读取/保存终端正文，不发送 Enter、不盲目重发。watcher 需人工核实际投递结果后由编排恢复，可能已送达的未知结果不得当成未发送再补发。
- watcher 常驻，对 repo/workspace **完全只读**：只拉起已批准的脚本子进程并巡检其存活，不再由模型自己目测比较状态；不写 signal/progress/execution_strategy/轮询日志/通知日志或任何文档，不路由、不分派、不启动 agent。快照仅在脚本内存，无日志文件，stdout/stderr 不重定向进仓或任务工作区。启动后立即核脚本进程，再每 120 秒核 PID/退出码；正常运行静默，退出则一次 Herdr prompt 通知 orchestrator 并核投递，无法送达明确报告 blocked 后停止，不自行重拉 agent 或无限重启。检查精确子进程 PID，不以包含脚本路径的 shell 命令文本作为存活证据。
- 启动前核 `HERDR_ENV=1` 与当前 watcher 身份；默认可按 `HERDR_PANE_ID` 自动定位，自填 `--self` 也必须在目标 workspace 且与已提供的 pane 身份一致。`RELAY_RECEIPT` 存在（含空值）时不启动脚本，watcher 只按既有 fail closed 规则通知并停止，不清除环境变量。
- 安全 Enter：仅当三条件**同时**成立才由 watcher 发一次并复验——①本次派单文本仍停在输入框（含 Devin queued 指令仍排队未发出）；②`state_change_seq` 未推进；③当前界面不是审批/确认 UI。任一不满足即不按；一次仍失败则通知 orchestrator 并交编排换 fresh 实例，禁止连按。脚本不承担安全 Enter 判断。

### 恢复依据

恢复权威只有四类：原角色自写的 durable signals、独立 review/decision 工件及其原始来源、由 orchestrator 核对的 `execution_strategy.md`、Herdr 实态。`progress.md` 只是施工证据索引、watcher 通知只是即时提示，二者都不是运行真相；恢复/重启时从四类权威重建，不依赖终端存活状态。 `findings.md` 是决定与遗留的检索入口，沿其来源引用回查上述独立工件及用户原始裁决，不新增第五类运行权威；摘要缺源、冲突或仍待用户决定时，不推进依赖该决定的动作。

## 放弃项

- 不做身份校验：账本 `by` 字段标称写入者但不验真伪，换取零启动成本。
- `status` 不判产出是否合格，只判账本完整性。
- 不设 `all_agents_done` 这类恒真枚举；节点关闭固定双条件合取。
- 不做原子写、回滚、历史 manifest（安装器侧同此约定）。
- 不做人肉盯屏：等完成由 `relay_log.py watch`（默认）或前台 `herdr agent wait --timeout 1200000` 承担；状态变化通知、30 秒 `get` 轮询、20 分钟 tick 由程序负责；watch 存活由 watcher 10 分钟只读巡检兜底，编排不做存活对账，程序不做停滞检测。
- 不允许编排做判断题：`stage_result.outcome` 机械分路，不越级拉 agent，不缓存计划。
