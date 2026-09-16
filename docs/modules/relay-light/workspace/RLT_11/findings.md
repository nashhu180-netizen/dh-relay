# RLT_11 · Findings

> 只登记事实与建议；状态变化由编排/主控裁决后回填，不由施工者自改。来源：C1 批真计划退场核对（详见 `as-built/持久化产物退场核对.md` §4）。

## 登记项

| ID | 级别 | 发现 | 证据 | 建议处置 | 状态 |
|---|---|---|---|---|---|
| F-001 | P2 | **设计 §12 六类枚举非穷举**：真计划 `rlt12-win-01` 另产出表内未点名的持久化产物——计划目录 `relay/rlt12-win-01/dispatch/monitor-{W1,C1,C2,R1,X1,F1}.md` 六份监工派单；RLT_21 工作区 `done.*.md`×15、`lesson_candidates.md`、`execution_strategy.md`、`brief.md`、`task_plan.md`；RLT_12 工作区 `evidence/`。它们按所在目录保留口径被正确保留，但 §12 表字面枚举不含它们 | §12 表（`design/01` 第 1321–1328 行）对比 `git ls-files docs/modules/relay-light/relay/rlt12-win-01/`、`workspace/RLT_21/`（`done.*.md` 实测 15 件）与 `workspace/RLT_12/`（含 `evidence/`）实际清单 | 供裁决：§12 表改「等」字口径或补一行兜底类；属设计措辞范围，本卡不动设计 | **已裁决** · 2026-09-16 用户「按建议走」→ §12 表补兜底类行，承接 **RLT-A-11**（Issue #37） |
| F-002 | P2 | **账本 note 内 `commit=<sha>` 在 squash 收口后悬空**：账本与 RLT_12 工件引用的 `ddfc21d/424807f/a80fcde/0e0f24a/4105da8/fc70185/435fad6/bbedb73/2ec9680`（账本内九个不同 SHA）及 verify `dd3ac3c` 在本仓 master 线上均不可解析（squash 合入只保留 `7981556`/`124a5c9` 等合并提交）。账本文本完整，但 commit 指针失效 | `git cat-file -t` 对上述十个 SHA 全部 MISSING；note 字段精确扫描（含 `commit=`/`commits=` token、不含 `signal_commit=` 误命中）：seq 1/6/10/11/16/19/21/28/31/32/33/34/48/49/50/51/56/61/62/63/68/69/70/71 共 24 条；另 seq 54/66 以「基线 \<sha\>」裸引用同悬空 | 供裁决：是否接受「commit 引用仅对 squash 前分支历史有效」为常态，或在收口纪律中要求记录 squash 合并提交号对照 | **已裁决** · 2026-09-16 用户澄清职责分层：账本复现**接力现场**、workspace+git+Issue 复现**施工现场**；`commit=` 属顺手旁注，失效**不构成契约破坏**，由「接受为常态」改判「按设计本就如此」。口径落盘承接 **RLT-A-11**（Issue #37） |
| F-003 | P2 | **「合入后删树」无机制保证、实际滞后**：观察时点本机 `.dh-worktrees/RLT_21`（`wt/RLT_21` @ `d81cb4a`，origin 同名分支亦在）与 `.dh-worktrees/dryrun-rlt12`（`dryrun/rlt12-linux`）仍存在，尽管 RLT_21/RLT_12 已分别经 PR #27/#25 squash 合入。与设计 §12「人 / 主 session」职责归属一致，但证明该步完全靠人记得 | `git worktree list`、`git branch -a`（2026-09-16 本机实测） | 供裁决：是否需要在收口 checklist 中显式列删树确认项；不属本卡范围 | **已裁决** · 2026-09-16 用户「按建议走」→ F 阶段收口 checklist 加删树确认项，承接 **RLT_23**（Issue #38） |
| F-004 | P2 | **关闭证据粒度缺口**：账本仅在 `stage_close` note 以文本记「终端空间 wX 关闭」；pane 级关闭不单独记账，Herdr 侧关空间的命令级证据未落盘（RLT_12 `progress.md` E-003 空槽、`evidence/win-real-run/` 未建立）。§12 两类终端空间的「删失败怎么办」因此永远只能「未实测」——失败既无独立事件也无持久证据位 | 账本 seq 11/34/51/63/71；RLT_12 `progress.md` E-003；`as-built/持久化产物退场核对.md` §1 | 供裁决：是否要为「关空间失败」定义账本记录方式；当前设计下该列注定只有人工口头证据 | **已裁决** · 2026-09-16 用户「按建议走」→ 定义 `resource_close` 独立事件位 + outcome，承接 **RLT_24**（Issue #39，标准档） |

## 编排侧过程发现（RLT_11 实跑，由编排登记，非施工者产出）

| ID | 级别 | 发现 | 证据 | 处置 | 状态 |
|---|---|---|---|---|---|
| F-005 | P2 | **`herdr agent prompt` 发给正在 running tools 的 devin 会排队不投递**：pane 底部出现 `1 queued · Press Enter to send queued messages now`，须补 `herdr pane send-keys <pane> enter` 才送达。monitor 处在 `sleep 120` 巡检循环时必然撞上，编排每次通知后都要确认 pane 末行 | 本卡实跑：编排向 rlt11-monitor 发「coder 上线」通知后排队未达，补回车后才收到 | 供裁决：是否写进 relay-light 派活纪律（编排发通知后必须确认投递） | **已裁决** · 2026-09-16 用户「按建议走」→ 编排发通知后必须确认投递，承接 **RLT_23**（Issue #38） |
| F-006 | P2 | **codex 的 `--dangerously-bypass-approvals-and-sandbox` 被本地 auto 模式分类器拦**（与 RLT_22 记录的 `gh pr merge`、改权限同类闸）。不带该 flag 起 codex 默认 sandbox 即可满足 worker 只在 worktree 内写文档的需要 | 本卡实跑：builder/plan-reviewer 两个 codex 实例均以默认 sandbox 正常完成 W1/W2/W1b/W2b | 供裁决：RLT_12 预演结论「codex 一律 bypass」在本机 Claude 主控下不成立，是否改口径 | **已裁决** · 2026-09-16 用户「按建议走」→ codex 启动档位口径按主控侧分叉，承接 **RLT_23**（Issue #38） |
| F-007 | P2 | **pane 监控报的 `working -> done` 不等于 agent 真收工**：devin 处于长 `sleep` 时也会被报 done。判活须看 pane 内 `Running tools · Nm` 计时器或账本 DONE 行，据 pane 状态重拉 agent 会造成误杀 | 本卡实跑：rlt11-monitor 在 `sleep 120` 中被报 done，实际仍在 9 分钟的巡检回合内 | 供裁决：监工模板的 agent_lost 判据是否要排除 pane 状态单一来源 | **已裁决** · 2026-09-16 用户「按建议走」→ `agent_lost` 判据禁止 pane 状态单一来源，承接 **RLT_23**（Issue #38） |

> 说明：F-005～F-007 是本卡执行**过程**产生的操作教训，不属于 RLT_11 的回流范围（§15 明列三条已由 C2 完成），按「范围外发现记 findings、不顺手做」处理，不写进教训库。R1 教训路复核附的范围外发现（W2 的 P1-1 模式可考虑入库）同此处置。

## 裁决落记（编排回填）

**2026-09-16**，用户对本卡七条转派项逐条裁决，全部立户：

| 承接项 | 内容 | Issue | 档位 |
|---|---|---|---|
| **RLT-A-11** 最小 A-adjust | F-001 §12 兜底类行；F-002 账本/workspace 职责分层口径；为下列两卡续发 `HC-RL-A151~` | #37 | 规划事件，走 A-adjust 原路 |
| **RLT_23** | F-003 删树确认项、F-005 通知投递确认、F-006 codex 档位口径按主控侧分叉、F-007 `agent_lost` 判据 | #38 | 轻 |
| **RLT_24** | F-004 `resource_close` 事件位 + outcome，使 §12「删失败怎么办」可实测 | #39 | 标准 |

三者构成 DevPlan 新增第 6 批；**RLT-A-11 落盘前 RLT_23 / RLT_24 不开工**（两卡验收 ID 由该事件续发）。

F-002 的裁决值得单独记一句：用户指出**账本复现的是「接力现场」，施工现场靠 workspace 文档 + git + Issue 恢复**。据此账本 note 内的 `commit=<sha>` 本就只是顺手旁注，不承担追溯施工现场的职责，其在 squash 后失效不构成契约破坏——该条从「缺陷·接受为常态」改判为「按设计本就如此」，但**这层职责分层此前从未写进设计**，故仍需由 RLT-A-11 落盘（否则后续做 `HC-RL-H10` 人判的人会拿错尺子）。
