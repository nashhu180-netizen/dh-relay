# decision.f007-watch-death — F-007「watch 中途死亡由谁、怎样发现」（decider#1 · round 1）

- 触发：`BLOCKED.builder.plan-remediation-1.md`（reason=needs_design_decision），task_plan D12 待裁决，batch 2 第 3 项与 R-A83-8 断言依赖本条。
- RELAY_RECEIPT preflight：`env | grep -c '^RELAY_RECEIPT='` = 0，正常流程。
- 只读输入：design/01 §3.6（480–491）、§7.2（894–908）、第 140/1436–1440 行、A82/A83/A101（1351–1353）、H12（1409）；DevPlan「#### RLT_18」（目标/非目标/验收口径）；`review.plan.md` P1-3/P1-4；`findings.md` F-004/F-007 及「F-007 裁决选项」；`task_plan.md` D2/D3/D10/D12、batch 2/3；两份 adapter「等待与接收者」「编排等待纪律」「single-task」段；`SKILL.md:40/287/331/347`。未改任何被审文件。

## 1. 结论一句话

**verdict=CONSULT**。F-007 属方向决策（改 adapter 角色义务、决定 H12 的验收预期、可能触及 design 语义），本棒只给选项 + 推荐 + 代价，不拍板。**推荐 B′（编排级 tick 对账兜底 + 顶层如实无机制）**，次选 D；不推荐 A、C。F-004 **不影响本卡**，建议独立路由（§5）。batch 1 不依赖 D12，可先开工。

## 2. 事实清单（裁决依据，均为字面）

| # | 事实 | 出处 |
|---|---|---|
| E1 | watch「在当前阶段的终端空间里单独开一个 pane 运行；编排层用同一程序、`--notify` 指向编排」 | design 482 |
| E2 | 「有 watch 时允许结束回合、靠 prompt 唤醒；无 watch 时不得结束回合」；收到 tick「就跑 `status` 与 `herdr agent list` 对账」 | design 896、898 |
| E3 | 「wait 返回时必须有接收者」三种方式之一：Claude 侧 `run_in_background` 退出会唤醒 session；Codex 侧无此机制 | design 908；adapter-codex 93 |
| E4 | H12 是**人判**：「杀掉 watch → 展示下一次例行查看的时刻与发现 → 兜底是否兜得住，20 分钟是否可接受」。design 没有断言兜底一定接住，而是把它列为待用户判断的问题 | design 1409；DevPlan RLT_18 验收口径 |
| E5 | 编排层 watch 盯 open stage 的 stage-lead（`monitor_launch`），末阶段 `stage_close` 后退出；tick 由每层 watch 各自维持、各发各的 `--notify` | design 488–490；task_plan D3/D10 |
| E6 | 两份 adapter 现行「编排等待纪律」已登记：**后台 wait/轮询进程「会被系统回收丢唤醒」**，编排侧不得依赖 | adapter-claude-code 95；adapter-codex 97 |
| E7 | 放弃项：「程序侧停滞检测」不做；「实时监控：watch 推送 + 20 分钟兜底，不做秒级盯屏」；「Herdr tab 这一层：不使用」 | design 1437–1440 |
| E8 | DevPlan 非目标：「不把 watch 变成驱动器或写者；不做秒级监控」；目标是「验证……watch 死亡兜底」而非新建机制 | DevPlan RLT_18 |
| E9 | 编排「不越级拉 agent」；编排 prompt 自己拉起的 stage-lead 不是越级 | design 892；SKILL 拉取顺序 |

推论：design 对「watch 死后谁发现」确实**留白**（E2 只覆盖有/无 watch 两态，不覆盖「曾有、现无」）。E4 表明这个留白是有意交给 H12 人判的，所以任何「补机制」都在替用户预设 H12 的答案；这就是它必须 CONSULT 的原因。

## 3. 分类

**方向决策**（decision.md 第 2 条「方向/范围/验收」）。三个判据任一命中即够：①改 adapter 里通知方的义务（是否可结束回合、是否要对账后 prompt 下层）；②决定 H12 的观察对象与预期结果，即改验收预期；③B/C 触及 design §2/§7.2/482 语义。**不是**小决策：与函数落点、打桩、用例组织无关。

## 4. 选项（含 builder 原 A–D 与本棒补的 B′）

| 选项 | 机制 | 发现时延 | 与 design 字面 | 主要代价 / 风险 |
|---|---|---|---|---|
| **A** 通知方自设 dead-man | Claude：结束回合前 `run_in_background` 挂 ≤20 分钟检查；Codex：**有 watch 也不结束回合**，前台 `wait --timeout 1200000` 循环，watch 只作加速 | Claude ≤20 min；Codex 立即 | 不改 §3.6；对 Codex 只用了 §7.2 的「允许」不是「必须」，字面可容 | Codex 侧 watch 失去「可结束回合」价值，违背 design 140「编排层也用 watch，不前台刷」的意图；Claude 侧后台检查与 E6「后台进程会被系统回收」既有登记相抵，可靠性未证；两侧 adapter 口径不对称 |
| **B′**（推荐）上一层 tick 对账兜底 + 顶层如实 | 编排收到自己 watch 的 tick 后做 §7.2 已规定的对账，**把对账判据写实**：某 open stage 的 stage-lead 为 `idle` 且该 stage 有 pending 节点、其 worker 已 `idle/done/blocked` 而账本无对应终态 → 判 stage 停滞 → `herdr agent prompt <stage-lead> "[relay-light] stage-stalled <stage_id>"`；可选同机 `pgrep -f 'relay_log.py watch --plan <dir>'` 直接核 watch 进程。stage-lead 被任何 prompt 唤醒时先核 watch 存活，死了重拉或切前台 wait。**编排自己的 watch 死亡：如实写「无自动发现，依赖人工，按 §7.3 恢复」** | 阶段级 ≤20 min（编排 tick）；编排级无 | 不新增事件、不写账、不改 §3.6；「对账后 prompt 下层」是对 E2「对账」的写实，reviewer 认为属语义扩展，故仍需用户认可 | 兜底只覆盖阶段级；H12 探针要加一个编排探针与一个 `--level plan` watch（见 §6）；Claude/Codex 对称 |
| **B** builder 原案 | 同 B′，但顶层用 A 兜 | 同上 | 同上 | 叠加 A 的全部代价 |
| **C** Claude 后台跑 watch | Claude 通知方 `run_in_background` 起 watch，进程退出即唤醒；Codex 同 A | Claude 即时；Codex 立即 | **冲突** design 482「单独开一个 pane」，需 A-adjust | 必须先改 design，本卡停摆；E6 的后台回收风险同样适用于长命 watch 进程；两侧载体不同 |
| **D** 如实不设机制 | adapter 明写「watch 中途死亡无自动发现，依赖人工或下一次外部 prompt；任何唤醒先核 watch 存活」 | 无 | 不改 design；与 E4「人判」最贴 | H12 大概率观察到「25 分钟内未发生」，由用户判是否可接受；接受则等于把 watch 存活列为运维前提 |

**推荐 B′ 的理由**：①它是 design 已经要求的动作（tick → 对账）的具体化，不加角色、不加事件、不改 pane 载体；②两侧 adapter 对称，Codex 保住 watch 的核心收益；③不依赖 E6 已登记不可靠的后台进程；④顶层留白如实交代，与 E4 人判精神一致。**次选 D**：零改动、零风险，只是把问题原样交给 H12。

**不推荐 A/C**：都要靠 Claude 后台进程唤醒，而 E6 是本仓实测登记的反证；C 另需改 design。

## 5. F-004 是否影响本卡：不影响

- F-004 = `SKILL.md:40`「程序落地后人肉 watcher 退役；single-task 的 `phase=monitor` 就是它」与「watch 以 `--plan`+账本为输入、single-task 无账本」冲突。
- 本卡允许路径不含 `SKILL.md`；task_plan 整改 1 已删 batch 2 adapter 第 5 项，两份 adapter 的 single-task 段与「编排等待纪律」本卡不动；R-A83-8 结构断言不涉及 single-task 段。本卡（H19 自举）自己的 monitor 就是人肉 watcher 按 120 秒节拍跑，与 watch 程序无关。**三批与 workflow-final 均不被 F-004 阻塞。**
- 路由建议（orchestrator 记 findings 处理列即可）：另立 SKILL.md 修订项（backlog 或新 Issue），措辞候选：「`relay_log.py watch` 程序落地后，**完整 relay** 的人肉 watcher 退役；`single-task` 无账本，`phase=monitor` 仍由人肉 watcher 按 adapter 120 秒节拍承担」，同步修 SKILL 硬规则 8 与「放弃项」第 5 条的「watch 未实现」措辞。不在 RLT_18 内做。

## 6. 无论选哪项都成立的落地约束（供 orchestrator 派回 builder）

1. **batch 1 不依赖 D12**，可立即派工；只有 batch 2 第 3 项、R-A83-8「死亡处置句」断言与 batch 3 H12 依赖裁决。
2. H12 探针「kill 后零提示原样观察 + 操作者介入节」不变。
3. adapter 落字草案（builder 按裁决原文抄进 task_plan D12 与 batch 2 第 3 项，R-A83-8 据此定断言关键词）：
   - **B′ / stage-lead 段**（两份 adapter 同句）：「watch 中途死亡：本层无自动发现，由编排层 tick 对账兜底（最长 20 分钟）。收到 `[relay-light] stage-stalled <stage_id>` 或任何唤醒时，先核 watch 进程存活（`pgrep -f 'relay_log.py watch --plan <plan_dir>'`，Windows 用 `Get-Process`），不在则重拉 watch 或改前台 `herdr agent wait <agent> --timeout 1200000`。」
   - **B′ / 编排段**：「收到 `[relay-light] tick`：跑 `status --json` 与 `herdr agent list` 对账；某 open stage 的 stage-lead 为 idle、该 stage 有 pending 节点且其 worker 已 idle/done/blocked 而账本无对应终态 → `herdr agent prompt <stage-lead> "[relay-light] stage-stalled <stage_id>"`。编排自己的 watch 死亡无自动发现，依赖人工，按 §7.3 恢复。」R-A83-8 断言关键词：`stage-stalled`、`pgrep -f 'relay_log.py watch`。
   - **D**：「watch 中途死亡无自动发现，本 adapter 不设 dead-man；依赖人工或下一次外部 prompt。任何唤醒时先核 watch 存活，不在则重拉或改前台 wait。」R-A83-8 关键词：`无自动发现`。
   - **A**：Codex 段改「Codex 侧即使有 watch 也不结束回合，前台 `wait --timeout 1200000` 循环维持节拍，watch 推送只作加速」；Claude 段加「结束回合前 `run_in_background` 挂 `sleep 1200 && pgrep -f 'relay_log.py watch'` 作 dead-man」。须同时在 adapter 「编排等待纪律」旁注明与 E6 的关系。
4. **H12 探针按选项调整**（batch 3）：
   - D / A：按 task_plan 现文，不加探针。
   - B′ / B：fixture 账本加 `monitor_launch note=herdr=rlt18-probe-orch stage_id=<s1>`；多开 `rlt18-probe-orch`（claude kind，扮编排，按 adapter 编排段派单）与一个 `--level plan --notify rlt18-probe-orch` 的 watch pane；kill **阶段级** watch 后零提示观察 ≤25 分钟，记录编排下一次 tick 时刻、对账输出摘录、是否发出 `stage-stalled`、lead 收到后的动作时刻。探针模型属新增实例，走 model-allocation gate。
   - C：先走 A-adjust，本卡停在 batch 2 前。

## 7. 给 orchestrator 转交用户的问题（可直接贴）

> RLT_18 F-007：design 没规定 watch 进程中途死了由谁发现。四个选项：
> **B′（推荐）** 编排层收到自己的 20 分钟 tick 做对账时，发现某阶段 lead 空闲而 worker 已停、账本没收口，就 prompt 该 lead；编排自己的 watch 死了如实写「无自动发现、靠人」。不改 design，Claude/Codex 一致，H12 要多拉一个编排探针。
> **D** adapter 如实写「无自动发现」，H12 原样观察，大概率得到「未接住」，由你判是否可接受。零改动。
> **A** Codex 侧有 watch 也不许结束回合（前台循环），Claude 侧后台 dead-man；Codex 的 watch 收益没了，且后台唤醒本仓已登记不可靠。
> **C** Claude 侧后台跑 watch，进程退出即唤醒；需先改 design 482「单独开一个 pane」，本卡停摆。
> 请选一项；batch 1 不受影响可先开工。
