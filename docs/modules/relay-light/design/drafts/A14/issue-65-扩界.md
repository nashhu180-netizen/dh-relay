<!-- dh:v1 · RLT-A-14 · Issue #65 正文扩界拟文（未生效；由 orchestrator 编辑 Issue，builder 不碰 gh） -->
# Issue #65 正文扩界拟文（RLT-A-14）

**使用说明（给 orchestrator）**：

1. 授权：UD-5 Q1 用户点选的选项文本含「Issue #65 正文扩界」——只授权**编辑 Issue #65 正文**这一项远端动作，不外推到 push / PR / 合并。
2. 先 `gh issue view 65` 取当前正文，**原有文字一字不改**；把下面「拟追加 ①」插到正文「目标 / 范围」类小节末尾（作为该节最后一条子条），把「拟追加 ②」作为独立小节追加在正文末尾。若原正文没有可挂靠的「目标 / 范围」节，① 也放进 ② 之前单列。
3. 必须改**正文**，不得用评论代替（先例：RLT-A-11 / Issue #37，评论不算改合同）。
4. 若用户对 brief「待用户」U-1 选「纳入 C 组」，把 ① 与 ② 中标注〔C 组〕的括注去掉括号保留内容；选「不纳入」则整句删除该括注。U-2 若改选「退役 H12 + 续发 H20」，按 ② 表格末行括注替换。
5. 编辑后把 Issue 正文扩界完成情况回写 `workspace/RLT_18/decisions.md` 或 execution 记录（由 orchestrator 定），供 fresh A 审核核对。

---

## 拟追加 ①：【扩界】子条（挂在目标 / 范围节末）

```markdown
- 【扩界 2026-09-24 · RLT-A-14】RLT_18 人验 HC-RL-H12 时用户不接受「编排 20 分钟 tick 对账兜底 watch 死亡」（workspace/RLT_18/decisions.md UD-3），并选择在本 Issue、本分支 `wt/RLT_18` 走 A-full 规划事件 **RLT-A-14**（UD-5 Q1），与 RLT_18 代码同一 PR 收口。设计改为：watch 进程级死亡由 pane 内 shell 重启循环自拉；watch 载体（pane/tab）被关由**每终端空间一个的旁路 watcher** 每 10 分钟只读巡检发现，报 `[relay-light] watch-down …` 给本空间派活方（监工/编排）重拉；**编排不承担 watch 存活对账**；watch 程序与 20 分钟 tick、§7.2 通用对账不变。HC-RL-H12 保号、升契约 v2；A82/A83/A101 不改。详见下文「扩界记录（RLT-A-14）」。
```

## 拟追加 ②：扩界记录节（追加在正文末尾）

```markdown
## 扩界记录（RLT-A-14，2026-09-24）

**来源**：RLT_18 `decisions.md` UD-3（用户人判原话「还是加个 watch 的agent 10分钟检查一次。编排不做这个事情」）、UD-5 Q1–Q6（用户点选）。本节为 Issue 正文的一部分，是本 Issue 设计范围扩展的权威记录。

**事件身份**：规划事件 RLT-A-14，stage = A-full；目标文档 `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md`；在 `wt/RLT_18` 同分支进行，与 RLT_18 代码同一 PR 收口。

**设计改动清单**（逐字候选稿：`docs/modules/relay-light/design/drafts/A14/A14-候选.md`）：

| # | 位置 | 改动 |
|---|---|---|
| 1 | §2 角色层 | 表头「十一个角色」→「十二个角色（含旁路 watcher）」；角色表新增 watcher 行（编排或监工在各自终端空间拉起、每终端空间一个、10 分钟只读巡检本空间 watch、缺席报信本空间派活方；不派活/不写账/不改文件/不入账本） |
| 2 | §3.6 watch | 末尾补「watch 自身存活由谁兜」：进程级由 shell 重启循环、载体级由本空间 watcher；tick 不承担存活判定 |
| 3 | §7.2 等待与节奏 | 补「tick 对账是通用对账，不含 watch 存活判定」 |
| 4 | §7.3 恢复协议 | 新增「watch 挂掉」三层：进程级自拉 / 载体级 watcher 报 `watch-down` → 派活方重拉 / watcher 自身缺席由派活方对账时顺带重拉 |
| 5 | §11.2 HC-RL-H12 | 保号、升契约 v2：判「watcher 10 分钟巡检是否接住、10 分钟是否可接受」〔U-2 若改选：退役 H12、续发 HC-RL-H20，总账不变〕 |
| 6 | §13 不做 | 「watch 推送 + 20 分钟兜底」→「watch 推送 + 20 分钟 tick 对账 + watcher 10 分钟存活巡检」 |
| 7 | 文件头 / §11 / §15 | 活动声明换 `RLT-A-14`、RLT-A-13 转历史索引、增补说明行；总账说明与验收 ID 稳定性登记「修订既有行 H12」 |
| 〔C 组〕 | §2.1 / §7.1 | 〔若用户采纳 U-1：写明「编排在自己终端空间拉起旁路 watcher」为拉取顺序的唯一例外〕 |

**明确不改**：HC-RL-A82 / A83 / A101；`relay_log.py`（程序零改动）；`roles.toml`；§7.5 single-task；HC-RL-H11（UD-4 已接受）。验收 ID 不新增、不退役、不改号，活动总账仍 159。

**允许路径追加**（仅 RLT-A-14 事件节点可写，RLT_18 U1/U2 coder 不碰；路径审计基点 `5ab3bba`）：
- `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md`（仅 RLT-A-14 晋级改动）
- `docs/modules/relay-light/design/drafts/A14/**`
- `docs/modules/relay-light/design/evidence/14-交叉审核记录-RLT-A14-watch兜底watcher巡检.md`
- `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md`（仅 RLT_18 段 H12 口径行，B-adjust，晋级之后）

另：`tools/relay-light/skill/SKILL.md` 的 RLT_18 注记由「UD-2 两处」扩为「UD-2 两处 + UD-3 watch 兜底表述（第 40 行 watcher 行、放弃项第 5 条）」（属 RLT_18 U1 施工面，不属本设计事件）。

**流程闸**（顺序执行，互不推定）：本 Issue 正文扩界 → `drafts/A14/` 候选稿（未生效）→ fresh A 审核（证据 `design/evidence/14-…`）→ 主会话讲解与理解对齐 → **用户整版确认** → 原子晋级 design/01 → B-adjust DevPlan RLT_18 H12 口径行。RLT_18 U1 的 GREEN 提交以用户整版确认为前置；U2（H12 契约 v2 重演）在晋级之后。

**档位 / 风险**：沿用本 Issue 标准档 · 高危（组件接线）；本扩界改变一条人验契约（H12）与角色层（新增 watcher 行），不改任何机器验收与程序行为。

**停止边界**：本扩界不授权 push、PR、合并、verify、验收或用户级 skill 副本同步；不夹带术语改名（design「监工」→ SKILL「stage-lead」）或其它设计改动。PR 仍写 `Relates to #65`，出口闸闭合前不关 Issue。
```
