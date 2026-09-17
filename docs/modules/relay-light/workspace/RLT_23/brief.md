# RLT_23 · 派活纪律与收口 checklist 回流

- GitHub Issue：#38（PR 关联 `Relates to #38`）；分支 `wt/RLT_23`；任务 worktree `/home/nash/work/dh-relay/.dh-worktrees/RLT_23`；基线 `7cee7ed`。
- 权威：DevPlan `P1-RelayLight-开发方案.md`「#### RLT_23」；设计 `01-RelayLight-产品设计与验收.md` §11 的 `HC-RL-A151`～`A154`、`A140`；来源 `workspace/RLT_11/findings.md` F-003/F-005/F-006/F-007。
- 目标：将通知投递确认、codex 启动档位的主控侧分叉、`agent_lost` 多来源判据、F 阶段删树确认写入现役 skill 与两侧 adapter 的对应模板。每条以设计 §11 的结构检查和静态反查验收。
- 档位与任务类型：轻、`task_type=light`；施工后必做独立教训和一致性两路复核。W1 只建工作区，不施工。

## 写入范围

闭集：`tools/relay-light/skill/**` 与 `docs/modules/relay-light/workspace/RLT_23/**`。具体施工文件与节见 `task_plan.md`。worker 不改设计、DevPlan、AGENTS、Python 程序/测试、其它卡工作区或两侧已安装 skill 副本。

## 验收靶子

| HC | 必须证明的行为与文本 |
|---|---|
| A151 | skill 派活纪律段与两 adapter 编排/监工模板三处逐字命中通知后读 pane、`queued` 补 Enter 并复核、未确认不可视为已通知；反查无「发出即送达」软表述。 |
| A152 | 两 adapter 各写 Claude 主控默认 sandbox 与 Codex 主控沿用既有 bypass 的条件分叉；skill 派活纪律也有同一条件；原有环境预检的 bypass 句按主控侧收窄，反查无全局无条件口径。 |
| A153 | 监工模板有 `Running tools` 计时器、该 agent 账本新行、Herdr `agent get` 非 working 三要素；pane `working → done` 不能单凭判死。保留 A140「三者均无变化才中断；任一仍在变化不得中断」原文。 |
| A154 | skill F 阶段模板有独立可勾选 checklist 行：先关终端空间，再确认对应 worktree 已删，使用 `git worktree list` / `git branch` 核对。 |

## 非目标与停线

不动账本 schema，不加新事件类型（归 RLT_24）；不改设计正文（§12 归 RLT-A-11）；不改 Herdr 或修 devin 排队行为；不追溯历史 workspace。任一验收要求必须越出闭集或与 A140 冲突，登记 `findings.md`、`progress.md` 并发 `BLOCKED`，交编排处理。
