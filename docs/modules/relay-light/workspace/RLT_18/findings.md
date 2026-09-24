<!-- findings.md — RLT_18 问题清单；范围外发现只登记，不顺手修改。 -->
# findings — RLT_18

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-001 | 风险（前置豁免） | 用户 2026-09-23 豁免 RLT_13/RLT_17 前置：RLT_17（Linux 双主控取证）将在带 watch 的 adapter 上跑，而非 DevPlan 原排序「前四批先证无 watch 前台回退」。 | DevPlan RLT_18 任务行备注、「实施提示」末句；`dispatch/README.md` D-start 条 | 本卡 adapter 保留并写明无 watch 回退（batch 2 R-A83-8）；RLT_17 开跑时需知悉 | 已登记 |
| F-002 | 挂起（前置豁免） | 本机只有 Linux：Windows 两副本（`%USERPROFILE%/.claude|.codex/skills/relay-light/**`）同步与 `HC-RL-A125` 终局回归（两机 `--all` 四目标哈希一致）无法在本卡完成。 | DevPlan RLT_18「实施提示」；design/01 A125 | 挂起待 Windows 机；Linux 两副本由 orchestrator 收口时另取用户授权同步 | 挂起 |
| F-003 | 风险（前置豁免） | `verify(relay-light):` 可能被 dev-harness 模块级钩子拦截（同 RLT_27 F-001）→ 本卡最多到「待验收」。 | `dispatch/README.md` D-start 条 | 收口时如实记录，不绕过钩子 | 已登记 |
| F-004 | P2（范围外） | `tools/relay-light/skill/SKILL.md` 三处在 watch 落地后与现实冲突或过期，SKILL.md 不在 RLT_18 允许路径：① 硬规则 8「watch 未实现时不得结束回合空等」；② 「放弃项」「不做 watch 推送的实现；watch 未实现时一律走前台 `wait` 回退」；③ **第 40 行** watcher「`relay_log.py watch` 程序落地后由程序承担、人肉实例退役；`single-task` 模式里的 `phase=monitor` 角色就是它」——但 watch 以 `--plan` 与账本为输入，single-task 无账本，程序无法承担 single-task 的 watcher（整改 1 按 plan-review P1-4 并入）。 | SKILL.md:40、硬规则 8、「放弃项」第 5 条；`review.plan.md` P1-4 | 不在本卡改；本卡 adapter 不对 single-task watcher 退役给出任何结论（task_plan batch 2 第 5 项已删）；交 orchestrator/decider 路由。**2026-09-24 已裁决**（`decisions.md` UD-2）：用户选「本卡扩允许路径顺手改」，SKILL.md 三处（第 40 行 watcher、硬规则 8、放弃项）排入 batch 2，仅限这三处（task_plan batch 2 `SKILL.md` 项、R-A83-13） | 已裁决 |
| F-005 | 信息 | 现有 `test_relay_log.py::test_a21_wait_receiver_and_three_methods` 断言 adapter 含「未实现」；batch 2 改写 adapter 后该断言语义过期，计划内替换为不弱于原意的新断言（task_plan R-A83-9）。 | test_relay_log.py 约第 6293–6307 行 | batch 2 承接 | 计划内 |

| F-006 | 信息（范围外，既有偏离） | design/01:482「在当前阶段的终端空间里单独开一个 pane 运行」与 1440「Herdr tab 这一层：不使用」，同 claude adapter 现行「一 agent 一 tab」（adapter-claude-code.md:42、125）不一致；偏离早于本卡。batch 2 watch 启动写法沿用本侧 adapter 既有载体约定，不在本卡调和。 | `review.plan.md` P2-1 与范围外发现 | 只登记 | 已登记 |
| F-008 | P2（待复核） | batch 3 实测中 lead-claude 转写出现两条 `❯ [relay-light] coder#1 -> done`（raw/pane-lead-claude-t3.txt 第 23、27 行）；其中一条可由 h11-claude watch 的 post-working 通知解释，**第二条来源未定**——候选：未被 20s 进程轮询采到的短命 h12-stage 重拉、`watch` 去重缺口（如 worker done→working→done 采样间闪变触发二次通知）、或其它来源。check.batch-3 F-1 要求登记待复核，不下结论。同类未解项：lead-claude 08:09 应答引用的 `pid 3779796`、codex 侧另见第二条 `› [relay-light]`（pane 原文未保存）。 | raw/pane-lead-claude-t3.txt:23/27；raw/agent-status-poll.log；evidence/batch-3/H11-claude.md、H11-codex.md、H12.md；check.batch-3.md F-1 | 登记待复核（reviewer/decider 复核），不修改实现。**2026-09-25 追记**（code-round1 整改 1）：进程内重发候选已闭合——`_watch_agent_loop` 去重态改共享 `notified_shared`，agent 线程异常重生后继承已通知态（review C1-2；`test_c1_2_thread_respawn_inherits_dedup` 钉住「重生不重发」+ 异常屏障 stderr 留痕）；batch-3 观测的第二条通知来源仍未定（短命重拉未被 20s 轮询采到等候选仍在），不以此结案 | 待复核 |
| F-007 | P1（需设计裁决） | watch 进程中途死亡时由谁、怎样发现未被 design 规定：§7.2 只规定「有 watch 允许结束回合、无 watch 不得结束回合」；watch 死后 tick 与状态推送都停，已结束回合的 lead/编排没有机制得知。Codex 侧无后台退出唤醒；Claude 侧可 `run_in_background` 但与 design 482「单独开一个 pane」有张力。H12 验的正是这件事。 | `review.plan.md` P1-3；design/01:482、898、902、1409 | task_plan D12 登记为待裁决；builder 写 `BLOCKED.builder.plan-remediation-1.md`（reason=needs_design_decision）列选项；batch 2 裁决前不开工。**2026-09-24 已裁决**（`decisions.md` UD-1，decider 见 `decision.f007-watch-death.md`）：用户选 F = pane 内 shell 重启循环自动恢复 + B′ 编排 tick 对账发 `stage-stalled` 兜底 + 编排级 pane 被关如实依赖人工；落 task_plan D12/D13、batch 2 第 3a 项与 R-A83-8/12、batch 3 H12-①② | 已裁决 |
| F-009 | 信息（RQ-1 复演留痕） | RQ-1 复演已端到端跑通恢复半段（`evidence/rq1-redemo/H12-redemo.md`，只取证不判）。两条范围外观察：①「任何唤醒先核存活」使兜底**不**只依赖 stage-stalled——run-1 中 lead 被关 pane 前排队的 `coder#1 -> idle` 提前唤醒，存活核判死即重拉，stall 在编排 tick 前消解；run-2 靠「阶段级 watch 对 working worker 静默（wait 不匹配 working、零通知）」才走到 stage-stalled。②driver 清理时 `pkill -f <pattern>` 命中自身命令行（与 pgrep -f 自匹配同机制），命令行模式匹配类操作在包装壳下均需排己。 | evidence/rq1-redemo/（pane-lead-full.txt:171-204、pane-lead-t4r.txt:256-296、cleanup-verify.txt） | 只登记；复演证据待人判 | 已登记 |

## design 解读（待 plan-review 确认）

task_plan §2 D1～D11 为本计划对 design §3.6 未冻结机制的解读，不改 design；D12（watch 死亡发现）已按 UD-1 裁决落字，D13 为其退出码合同。

## F-007 裁决选项（builder#1 整改 1 · 供 decider/用户取舍，builder 不自选）

问题：watch 进程在阶段中途死亡时，谁在多久内发现、发现后做什么。design §7.2 没有规定；H12 的问题是「杀掉 watch 后 20 分钟兜底能不能接住」。

| 选项 | 机制 | 与 design 字面 | 代价 / 风险 |
|---|---|---|---|
| A | 通知方（stage-lead/编排）结束回合前**自设 dead-man**：Claude 侧 `run_in_background` 挂一个 ≤20 分钟的检查（到点核 watch 进程与最近一次 tick）；Codex 侧没有后台唤醒 → Codex 通知方**有 watch 也不得结束回合**，改为前台 `wait --timeout 1200000` 循环，watch 推送只作加速 | 不改 §3.6；对 Codex 收窄 §7.2 的「有 watch 允许结束回合」 | Codex 侧 watch 的「可结束回合」收益没了；adapter 两侧口径不对称 |
| B | **上一层兜底**：编排级 watch 的 20 分钟 tick 触发编排对账时，一并核查各 open stage 的 watch 载体是否还活着；死了就 prompt 该 stage-lead，让它重拉 watch 或切前台循环。编排自己的 watch 死了，则由人或编排侧按 A 的方式兜 | 给编排的「三件事」加一项对账内容，属 design §2/§7.2 语义扩展 | 最长约 20 分钟发现；编排层的 watch 死亡仍需 A |
| C | **watch 自己盯自己不可行，改由 Claude 侧后台运行 watch**：Claude 通知方用 `run_in_background` 起 watch，进程一退出就唤醒 session（§7.2 902 已承认后台退出会唤醒）；Codex 侧同 A，前台循环 | 与 design 482「单独开一个 pane 运行」冲突，需 A-adjust | 需要改 design；两侧载体不同 |
| D | **如实不设机制**：adapter 明写「watch 中途死亡无自动发现，依赖人工或下一次外部 prompt」；H12 原样观察，大概率得到「未接住」，交用户判是否可接受 | 不改 design | 等于把 H12 预设为可能不通过；风险交给用户 |

builder 观察（不是裁决）：A 和 D 不改 design 字面；B、C 属设计语义变更，需走 A-adjust 或用户确认。无论选哪项，task_plan 的 H12 探针（kill 后零提示原样观察）都不变。

> 2026-09-24 追记：上方「F-007 裁决选项」表为裁决前的候选留痕，不回写；实际裁决为 UD-1 选项 F（自动重启 + B′），不在原 A–D 之列。

## UD-3 整改计划新增（2026-09-24 builder#ud3）

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-010 | 信息（范围外） | AGENTS.md「relay-light 编排协议段」只定义 worker 派单标头 `[relay-light] worker · node=…`；UD-3 在完整 relay 重新引入常驻 watcher agent，其派单首行（task_plan D23 `[relay-light] watcher · space=… · notify=… · plan=…`）无宪章层判定条款。 | AGENTS.md relay-light 段；task_plan §5.2 D23 | AGENTS.md 不在允许路径，本卡不改；随 RLT-A-14 或后续宪章维护处理 | 已登记 |
| F-011 | 信息（范围外，既有缺口） | design/01 §2 角色表 11 角色无 watcher，SKILL 角色表自 #62 起有 watcher 行（12 角色）；SKILL 第 25 行「模型档全部写在 `roles.toml`」而 roles.toml 无 `[watcher]` 段。UD-3 让 watcher 在完整 relay 常驻，缺口由潜在变为实际。 | design/01 约 121–135；SKILL.md:25、:40；roles.toml | design 侧并入 RLT-A-14（task_plan §5.3）；模型档交用户（§5.7 Q5） | 已登记 |
