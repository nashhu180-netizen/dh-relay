# decisions — RLT_18（用户裁决登记，orchestrator 代记）

## UD-1 · F-007 watch 中途死亡的发现机制（2026-09-24）

- 触发：`BLOCKED.builder.plan-remediation-1.md`（needs_design_decision）→ `decision.f007-watch-death.md`（decider#1，CONSULT，推荐 B′）。
- 对话经过：用户先问 watch 指编排级还是任务内（答：两层都有，§3.6 同一程序）；用户提出「保留 watcher agent 定期检查程序」，orchestrator 提出 E1/E2 接法；用户指出「agent 已每 2 分钟巡检则程序多余，有点矛盾」——orchestrator 认同，撤回 E1 推荐，改为「让程序自己更难死」。
- **用户裁决（AskUserQuestion 点选）：选项 F = 自动重启 + B′ 兜底**：
  1. **自动重启**：watch 所在 pane 不直接跑 watch，而跑 shell 重启循环（watch 退出后短暂等待即重拉）；仍是 design 482「单独开一个 pane 运行」。进程崩溃/被杀由循环几秒内恢复，不引入 watcher agent。
  2. **B′ 兜底**：整个 pane/shell 被关时——阶段级 watch 由编排收到自己 watch 的 20 分钟 tick 做 §7.2 对账时发现（stage-lead idle、该 stage 有 pending 节点、worker 已 idle/done/blocked 而账本无终态 → prompt `[relay-light] stage-stalled <stage_id>`；lead 被唤醒先核 watch 存活，不在则重拉）；编排级 watch 的 pane 被关如实写「无自动发现，依赖人工，按 §7.3 恢复」。
  3. 完整 relay 模式**不**保留人肉 watcher agent；watch 仍只通知不写账，不做驱动器。
- 影响：task_plan D12、batch 2 adapter 死亡处置句与对应断言、batch 3 H12 探针（演示①kill watch 进程后自动恢复；②关闭阶段级 watch pane 后编排 tick 对账发现；需新增扮编排的探针实例，启动前另走 model-allocation gate）。

## UD-2 · SKILL.md 纳入本卡允许路径（2026-09-24）

- 用户点选「本卡扩允许路径顺手改」。orchestrator 按 relay-light 白名单追加改 DevPlan RLT_18 允许路径行，加入 `tools/relay-light/skill/SKILL.md`。
- 改动限于：SKILL.md 第 40 行 watcher 表述改为「完整 relay 模式由 `relay_log.py watch` 程序承担、人肉实例退役；`single-task` 无账本，`phase=monitor` 仍由人肉 watcher 按 adapter 120 秒节拍承担」；硬规则 8 与「放弃项」中「watch 未实现」的过时措辞同步（F-004 三处）。不改 SKILL 其它合同。
- 已知连带：skill 五文件哈希变化 → 收口时用户级副本同步（收口另行授权）；install/skill 相关测试若断言 SKILL 文本需同步核对。

## UD-3 · H12 人判：兜底改由 watcher agent 每 10 分钟检查 watch 程序（2026-09-24）

- 触发：人验环节 orchestrator 向用户展示 HC-RL-H12（watch 死亡后 20 分钟兜底是否接住、20 分钟是否可接受）实测结论（batch-3 H12 + rq1-redemo run-2 端到端跑通，关 pane 后约 19 分钟由编排 tick 发现）。
- **用户人判原话**：「还是加个 watch 的agent 10分钟检查一次。编排不做这个事情」。即 H12 当前兜底形态（B′：编排 20 分钟 tick 对账发现阶段级 watch 死亡）**不接受**。
- 后续 AskUserQuestion 点选：
  1. 放在哪做：**本卡继续改**（RLT_18 追加整改，改设计/实现/adapter/SKILL.md/测试后重新复核并重演 H12）。
  2. 谁来检查：用户答「我们术语改过了吧 monitor 改成了 watch 复用这个」——即**复用既有 watcher 角色**（角色表「watcher（旁路）」；single-task 中 `phase=monitor` 即它），不新增专职角色。
  3. 发现死后：**通知监工/编排去重拉**——watcher 保持只读、只报信；阶段级 watch 由 stage-lead、编排级 watch 由编排按 adapter 重拉。
- 取代关系：本条推翻 UD-1 第 2 点（B′ 编排 tick 对账兜底）与第 3 点「完整 relay 模式不保留人肉 watcher agent」；UD-1 第 1 点（pane 内 shell 自动重启循环）保留。编排不再承担 watch 存活对账。
- 待 builder 定稿的细节（小决策交 decider，方向问题回用户）：watcher 每层一个还是每终端空间一个；10 分钟节拍的实现（agent 自身定时 vs 程序给 watcher 发 tick）；watch 程序 20 分钟 tick 是否整体删除或仅不再驱动编排对账；设计文档改动走何流程与本卡允许路径扩展。
- H11 人判：尚未给出（待用户）。
