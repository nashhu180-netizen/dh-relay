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
- H11 人判：见 UD-4。

## UD-4 · H11 人判：接受后台 watch（2026-09-24）

- 用户原话：「H11 接受，后台 watch 可以」。
- 含义：监工忙时 watch 推送排队不丢的实测结论接受，不退回前台循环；F-008（多发）与 codex 首通 pane 不可见作为知悉项保留登记，不阻塞。
- 已逐字转录进 `evidence/batch-3/H11-claude.md`、`H11-codex.md`「人判结论」节。

## UD-5 · UD-3 整改计划待用户项裁决（2026-09-24）

用户对 `task_plan.md` §5.7 AskUserQuestion 点选：
- Q1 设计改动流程：**本卡同分支走 A-full（RLT-A-14）**——Issue #65 正文扩界、`design/drafts/A14/` 候选稿、fresh A 审核、用户整版确认后晋级 design/01，与代码同一 PR 收口。
- Q3 20 分钟 tick：**只取消存活检查**——程序 tick 与 §7.2 通用对账保留，程序零改动，A83 不改。
- Q2 watcher 粒度：**每终端空间一个**。
- Q4/Q5/Q6：**全部按推荐**——watcher 自身缺席由派活方对账时顺带重拉、不设二级兜底；watcher 低档、缺省沿用 roles.toml `[monitor]` 档、roles.toml 不改；H12 重演 = H12-A（阶段级载体被关）+ H12-B（编排级载体被关）并行，不缩短 10 分钟节拍，H12-① 引用 batch-3 既有证据，H12-C 不做。

## UD-6 · RLT-A-14 候选稿待用户项（2026-09-24）

用户对 `design/drafts/A14/brief.md`「待用户」AskUserQuestion 点选：
- U-1：**写明例外（纳入 C 组）**——§2.1、§7.1 写明「编排在自己终端空间拉起旁路 watcher」为拉取顺序唯一例外。
- U-2：**保留 H12，升为契约 v2**。

**Issue #65 正文扩界已完成**（orchestrator 2026-09-24，授权来源 UD-5 Q1 选项文本）：原正文一字未改；「范围」节末追加【扩界 2026-09-24 · RLT-A-14】子条；正文末追加「扩界记录（RLT-A-14，2026-09-24）」节（C 组行按 U-1 采纳落为第 8 行，H12 行去掉 U-2 备选括注）。改正文而非评论。
- 2026-09-24 追记：按 A-14 fresh-01 审核 P3-5，orchestrator 在 Issue #65「扩界记录」节补「取代关系」一句（本节取代正文「不改 design」与「H12 20 分钟兜底」两处）。A-14 fresh-01 P2-1 orchestrator 小决策选 (a)：候选稿「pane / tab」统一为「pane」，adapter 用 tab 的既有漂移登记 findings。

## UD-7 · RLT-A-14 用户整版确认（2026-09-24）

- orchestrator 主会话白话讲解候选稿 6 点后，AskUserQuestion 用户点选「确认晋级」。确认对象 `design/drafts/A14/A14-候选.md` @ `e7c127d`。已记入 `design/evidence/14-…` understanding 节。
- 后续：晋级 design/01（coder，照抄候选稿）→ 晋级复核（fresh）→ DevPlan RLT_18 H12 口径行 B-adjust（orchestrator）；U1 GREEN 前置已满足。
