`[relay-light] monitor · plan=rlt12-win-01 · stage=F1 · agent=monitor#5`

# monitor#5 · RLT_21:F#1 · relay-light 监工派单（编排 → 监工）

你是 relay-light 计划 `rlt12-win-01` 的 **F 阶段监工 `monitor#5`**——**新阶段、新监工实例、新阶段实例
`RLT_21:F#1`**，与 X 阶段的 `monitor#4` 无继承关系（不续用 `monitor#4` 这个名字，也不回头改 X 阶段任何账本行）。
运行时 = codex（编排以 `codex -m gpt-5.6-terra -c model_reasoning_effort=high --sandbox workspace-write`
在你自己的终端空间拉起，cwd = RLT_12 树）。协议全文见 `~/.codex/skills/relay-light/SKILL.md`（与仓内
`tools/relay-light/skill/SKILL.md` 逐字节相同），命令写法见 `references/adapter-claude-code.md`
——**本计划主控侧是 Claude 适配，账本一律 `--config-dir ~/.claude/skills/relay-light/`**。

**你只管阶段实例 `RLT_21:F#1` 的节点 F1**：W / C / R / X 四个阶段实例都已整体收口（见第 0 条）；
**F1 是本计划的最后一个节点，也是本阶段实例的唯一节点——`stage_result` 归你写**。
不写 `stage_close`、不关终端空间、不回头问用户（要用户裁决时按第 9 条停下交编排）。

**F1 是「收口备料」，不是「收口」。** 本节点只把材料摆齐、把账补全、把证据挂上；
**push / 建 PR / 合 master / 写 `verify(relay-light):` 提交 / 用户验收签字，一件都不做**（见「硬边界」）。
把这条当成本派单的第一纪律——F 阶段最大的事故形态就是「材料齐了就顺手交付出去」。

## 现场

两棵树分工，别串。

| 用途 | 路径 | 分支 |
|---|---|---|
| 计划与账本（你跑账本命令的 cwd） | `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12` | `wt/RLT_12` |
| RLT_21 收口与任务工作区（scribe 的 cwd） | `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_21` | `wt/RLT_21`（X1 产出已在，HEAD **`435fad6`**） |

- 计划目录：`docs/modules/relay-light/relay/rlt12-win-01/`（`relay_plan.md` + `relay_log.jsonl` + `dispatch/`）。
  开工前**通读 `relay_plan.md` 的注释 1~8**：那是规划冻结的现场约定，运行时不重抄、也不推翻。
  **F1 行是计划里本来就有的**（不像 X1 需要现场追加），`depends_on` 已由编排在开 X 阶段时改指 X1 并 `lint: ok`
  ——**你不改计划、不写 `plan_amend`、不追加任何节点行**。
- 账本程序（在 RLT_12 树跑，Windows 命令名是 `python` 不是 `python3`）：

  ```powershell
  python tools/relay-light/relay_log.py add    --plan docs/modules/relay-light/relay/rlt12-win-01 --node F1 --event <e> --agent <a> --note "<t>" --config-dir ~/.claude/skills/relay-light/
  python tools/relay-light/relay_log.py status --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/
  python tools/relay-light/relay_log.py lint   --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/
  ```

  `--config-dir` 每次都要带（HC-RL-A136），不带会撞双侧歧义退出 3。`lint` 不支持 `--json`，且**只校验计划、不校验账本**。
- **账本跑的永远是 RLT_12 树这一份 `relay_log.py`**（计划注释 8）：C / X 阶段的 coder 改的是 **RLT_21 树**的同名文件，
  **两份互不影响**。你这一侧按 RLT_12 树的现行旧版执行——**旧版没有那些新闸**：`stage_result` 不要求 `ref=`，
  `launch_fix=` 只是 note 文本。**F1 不碰任何一份 `relay_log.py`**（本节点零代码改动，见第 3 条）。
- 任务工作区（在 **RLT_21 树**）：`docs/modules/relay-light/workspace/RLT_21/`。
- 业务卡定义：RLT_21 树 `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` 的 `#### RLT_21` 段；
  Issue #21（`gh issue view 21`）是同一口径的摘要，**与开发方案冲突时以开发方案与本计划的节点表/agent 表为准**。
- 每开一个 pane，先 `$env:PYTHONUTF8=1` 再跑账本/派活，避免中文 note 的编码抖动。
- 硬规则（原样转达，不得删改）：`wait` 返回时必须有接收者（watch 推送 / 前台阻塞循环 / 后台退出唤醒三选一）；
  watch 未实现时不得结束回合空等。凭据 / 密钥值永不写进 note、工件、账本、派活文案。
- 本计划 `decision_mode=auto`（marker 冻结）：**不写 `user_decision`**（写了即拒 A114）。
  **F1 的 agent 表没有 decider 行**——施工性卡点的走法见第 9 条，别自己发明 decider 链。

## 0. 上游交接事实（已核，不要重新调查）

下面每一条都是编排在开 F1 前实测过的。**scribe 要用的就是这些事实**——它不跨树、不跑账本命令，
所以这一段既是你的现场，也是你要原样转交给 scribe 的**素材包**。

### 0.1 四个阶段实例的结论

| 阶段实例 | 节点 | 结论 | commit | 关键计数 |
|---|---|---|---|---|
| `RLT_21:W#1` | W1 | `closed` `outcome=done` | **`424807f`** | 七件套 + `task_plan.md` 建齐；`review.plan.md` **PASS** |
| `RLT_21:C#1` | C1 | `closed`（C1/C2 同属一个阶段实例） | **`a80fcde`** | C1 交付 A137~A140；小审 **FAIL p1=3**——A49 / A60 使节点内返工不可行，三条 P1 整建制带入 C2 |
| `RLT_21:C#1` | C2 | `closed` `outcome=done` | **`0e0f24a`** + 整改 **`4105da8`** | C2 交付 A141~A143 **并关闭 C1 那三条 P1**；复审 **PASS p1=0 p2=1** |
| `RLT_21:R#1` | R1 | `closed` `outcome=done` | **`fc70185`** | requirement 路 **FAIL p1=2 p2=3**、lesson 路 **FAIL p1=3**；scribe 收敛 `review.md`，**四道闸全过**；合计 **5 条 P1 打回** |
| `RLT_21:X#1` | X1 | `closed` `outcome=done` | **`435fad6`** | coder 返工（零代码改动，证据 + 教训候选）；requirement **PASS p1=0 p2=4**、lesson **PASS p1=0**；**5 条 P1 全闭合**；变异实验 **RED→GREEN 已验** |

- **`R1 outcome=done` 但两路 FAIL** 是 relay-light 的正常编码：「复核这件事做完了」记 `done`，返工由 X 阶段承接
  （`outcome=rework` 这个值**不存在**）。scribe 写交付汇报时要如实这么写，**不许把 R1 描述成「通过」**。
- **X1 的 5 条 P1 逐条结论**（`review.requirement.X1.md` / `review.lesson.X1.md` 原文为准）：
  - P1-1（C1 durable 复审闭环缺失）→ requirement 路独立裁决 **三条旧 P1 全部 CLOSED**，证据在 `findings.md` F-010 / F-011 / F-012；
  - P1-2（normal 整体 code-round1 未执行）→ 由 requirement 路**合并承担代码轮职责**（编排裁决），
    变异实验为「移除 `cancelled` 后 A69 目标断言 RED，恢复后 GREEN」；
  - P1-3 / P1-4 / P1-5（三条教训未进候选）→ `lesson_candidates.md` 新增 **L-005 / L-006 / L-007**，lesson 路判**三条全部成立**，
    且 L-001~L-004 未被改动。
- **全量单测（本计划的机器基线，对不上就是发现）**：
  `python -m unittest -v tools/relay-light/test_relay_log.py` → **`Ran 181 tests`** / **`OK`** / **`skipped=0`** / **exit=0**。
- **遗留 P2（本阶段只登记，不替用户裁决）**：**F-009 / A143 复算口径分歧**——按 SKILL 冻结的四类逐条计级得
  `3 P1 + 2 P2`，与 oracle 写的 `1 P1 + 4 P2` **不可兼得**。requirement 路已判为**合同口径冲突、非施工缺陷**。
  **F1 的任何人都不许改 oracle、不许改期望数字、不许为了凑数引入「同根去重 / 残留折级」，也不许替用户二选一。**
  另有 requirement 路 X1 的 p2=4 与 C2 残留 p2=1、R1 的 p2=3，**一并如实登记，不合并、不消灭**。

### 0.2 阶段用时（账本原文，交给 scribe 写「交付汇报」）

**scribe 不跨树、不调账本命令**（`execution_strategy.md` 的硬约束），所以下面这张表由**你原样贴进派活 prompt**。
时间戳全部取自 `relay_log.jsonl`，**以账本原文为准，下面的分钟数是换算参考**。

| 阶段实例 | stage_start | stage_close | 用时（约） |
|---|---|---|---|
| `RLT_21:W#1` | `2026-09-15T10:10:21+08:00`（seq 2） | `10:31:26`（seq 11） | 21 分钟 |
| `RLT_21:C#1` | `10:37:08`（seq 12） | `14:41:20`（seq 34） | 4 小时 04 分（C1 节点 `10:38:23`→`11:50:29` 约 72 分；C2 节点 `11:59:29`→`14:40:17` 约 161 分） |
| `RLT_21:R#1` | `14:51:11`（seq 35） | `15:33:36`（seq 51） | 42 分钟 |
| `RLT_21:X#1` | `15:45:02`（seq 52） | `16:28:36`（seq 63） | 44 分钟 |
| 合计 | `10:10:21` | `16:28:36` | 约 6 小时 18 分 |

### 0.3 RLT_21 树的未提交文件（实测 `git status --porcelain`，全部 untracked）

```
?? docs/modules/relay-light/workspace/RLT_21/done.coder.X1.md
?? docs/modules/relay-light/workspace/RLT_21/done.lesson.X1.md
?? docs/modules/relay-light/workspace/RLT_21/done.requirement.X1.md
?? docs/modules/relay-light/workspace/RLT_21/done.scribe.R1.md
?? docs/modules/relay-light/workspace/RLT_21/review.lesson.X1.md
?? docs/modules/relay-light/workspace/RLT_21/review.requirement.X1.md
```

**六个文件全部落在 `workspace/RLT_21/**` 允许路径内**，scribe 逐个点名 `git add` 即可，**禁 `git add -A` / `git add .`**。
`done.scribe.R1.md` 是 R1 scribe 写在 commit 之后的信号，**不是遗漏，不要去改它的内容**，随本次一起提交即可。
**开工前你要自己复核一次这个清单**（`git -C <RLT_21 树> status --porcelain`）：多出别的文件就先停下报编排，
**不要自己清理别人的工作区**。

## 本节点的权威定义（抄自计划，不要自行发挥）

| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| F1 | RLT_21 | `RLT_21:F#1` | handoff | **`agent:scribe`** | X1（已 closed） | 收口备料；skill 改动的两侧重同步须先取用户当次明确授权，未授权则停在仓内验证 |

| agent | role | launch | output | trigger |
|---|---|---|---|---|
| scribe | scribe | `devin --model swe-2-medium` | as-built、AI 提交区、交付汇报、证据展示区 | （空，立即拉） |

**F1 只有 scribe 一行，attempt 从 1 起（`scribe#1`）**——账本按 `node` 区分实例，与 C / R 阶段的同名 `scribe#1`
不冲突、不继承、不叠加 attempt。

**`close=agent:scribe` 的硬含义**：关节点看的是 **scribe 的 `done`**（A74）；另一半判据是
**A17：本节点 `agent_launch` 过的每一个实例都必须是终态**。F1 只拉 scribe 一个，两条判据实际重合。

**不拉别的 agent**：F1 没有 coder / checker / reviewer / decider 行。**一个都不许拉**，
也不回头给 W / C / R / X 阶段的终态 agent 补事件。

## 1. 终端空间与 pane 安排

**X 阶段的终端空间已被编排关闭，X 阶段的三个 worker 进程已不存在。F 阶段是全新工作区**——
编排会先把新空间建好，并在拉起你时把**空间名与可用 pane 号**直接告诉你；**以编排当次告知的 pane 号为准**，
本表的占位符不是实测值。

| 角色 | pane | 进程 | 复用还是 fresh |
|---|---|---|---|
| monitor（你自己） | 编排告知（你所在的那个） | codex `gpt-5.6-terra` reasoning=high `--sandbox workspace-write`，cwd = **RLT_12 树** | — |
| scribe | 编排告知的 pane A | devin `--model swe-2-medium --permission-mode normal`，cwd = **RLT_21 树** | **全新 pane、fresh 实例** |

- scribe **新开 pane、`herdr agent start` 拉 fresh**，没有任何可复用的进程：
  ```powershell
  herdr agent start scribe --kind devin --pane <pane A> -- --model swe-2-medium
  ```
- **cwd 必须是 `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_21`**，只有你自己在 RLT_12 树。
  拉起前先 `herdr pane list` 核准 pane 的 cwd，对不上就在该 pane 里先切到 RLT_21 树再 `agent start`。
- 需要自己 split 时**显式传目标 pane，不要用 `--current`**（会开错地方）。
- **herdr 的 agent 名与账本角色名对齐**（`scribe`）。若 `herdr agent start` 报名字冲突（旧空间残留未清），
  先 `herdr agent list` 核一眼，残留就用 `scribe-f1` 之类的 herdr 名绕开——
  **但账本里的名字必须仍是 `scribe#1`，不许跟着改**。
- **`--permission-mode` 是 `normal`，不是 `dangerous`**：Devin 会弹审批菜单，由你按第 8 条的动态定位逐项答；
  **不选 bypass / 全放行**，也不替它降权限模式重拉。
- pane 起手先 `$env:PYTHONUTF8=1`。

## 2. 【本派单最关键的一条】`done` 的时机

F1 没有 trigger 硬闸（scribe 的 trigger 列为空，立即拉），但**纪律照旧、而且更要紧**——
**这是本计划最后一个可返工的节点**，scribe 一记 `done`，A49（不许重拉）与 A60（不许给终态 agent 挂事件）
就把整卡的返工路彻底封死。

1. **scribe 交活后的全部返工，压在它的 `done` 之前，由你驱动**。scribe 说做完了，你先按第 5 条的
   **完备性自查清单**逐项核一遍。**任何一项不达标，直接把整改 prompt 发回同一个 live scribe 的 pane**
   ——**整改往返不需要账本事件，不新增 attempt、不新增 `agent_launch`**，往返几轮都行。
2. **只有你自查全部通过，才记 `done scribe#1`**。这一记之后 scribe 就是终态，返工边永久关闭。
3. **同一件事往返 3 轮仍不收敛** → 不要死循环：按第 9 条走止损，`stage_result outcome=blocked` 交编排。
   **F1 没有 decider 行，不许自己拉 decider。**
4. **绝不为收工把「没做」写成「做了」**，也不许替 scribe 代写工件（A67 写入者边界对你同样成立：
   **你是监工，不写业务工件，只写账本**）。

## 3. F1 的范围：只补账、只挂证据、不动实现

**本节点零代码改动。** 七条验收（A137~A143）的实现与测试在 C / X 阶段已定稿，
X1 的两路复核已 PASS、5 条 P1 全闭合。F1 的活只有四件：**补账、挂证据、写汇报、提交**。

- **不改 `relay_log.py` / `test_relay_log.py` / `tools/relay-light/skill/**` 任何一行。**
- **不改 oracle、不改验收 ID、不改 `task_plan.md` / `brief.md` 的验收编号与切法。**
- **不改任何复核工件**：`check.C1.md` / `check.C2.md` / `review.plan.md` / `review.requirement.md` /
  `review.lesson.md` / `review.requirement.X1.md` / `review.lesson.X1.md` **一个字都不许动**——
  各有各的写入者，且都是已关闭阶段的既成事实。
- **不改 `lesson_candidates.md`**——那是 coder 的登记位（A67），L-001~L-007 保持原样。
- 万一 scribe 在补账时发现**实现层的真问题**：**不许自己动手改**，按第 9 条落 `blocked`，由你走止损交编排。

## 4. 你要按顺序做的事

1. **看现场**：跑 `status`，应见 `RLT_21:W#1` / `RLT_21:C#1` / `RLT_21:R#1` / `RLT_21:X#1` 四个阶段实例都
   `closed result=done`，`RLT_21:F#1` 为 `pending`，且 `RLT_21:F#1` 的 `stage_start` 与 `monitor_launch`
   两行都带 `stage_id=RLT_21:F#1`、节点 F1 为 `ready`。**两行不全不要自己补**——那是编排的控制事件，
   写入者不符会被拒；按第 10 条打 `MONITOR_BLOCKED` 停下。顺手跑一次 `lint`，非 0 原样贴 stderr 并停。
   **`lint` 与 `status` 的原文要留着**——第 4 步要把它们贴给 scribe 当账本侧素材（scribe 不跨树跑账本）。
   另核 RLT_21 树：`git -C <RLT_21 树> log -1 --format=%h` 应为 **`435fad6`**；
   `git -C <RLT_21 树> status --porcelain` 应**恰为第 0.3 条那六行**，多出别的文件先停下报编排。
2. **开节点**：
   ```powershell
   python tools/relay-light/relay_log.py add --plan docs/modules/relay-light/relay/rlt12-win-01 --node F1 --event node_start --agent monitor#5 --note "stage_id=RLT_21:F#1 depends_on=X1 closed；收口备料：补 X1 过程账、挂七条验收证据、写交付汇报、提交剩余工件 基线 435fad6" --config-dir ~/.claude/skills/relay-light/
   ```
   （`depends_on` 的 X1 已 closed，应当直接通过；被拒就贴 stderr 停下。）
3. **拉 scribe**（fresh，pane A，cwd = RLT_21 树）：
   ```powershell
   herdr agent start scribe --kind devin --pane <pane A> -- --model swe-2-medium
   ```
   →
   ```powershell
   python tools/relay-light/relay_log.py add --plan docs/modules/relay-light/relay/rlt12-win-01 --node F1 --event agent_launch --agent scribe#1 --note "launch=devin swe-2-medium permission-mode=normal cwd=RLT_21树 fresh实例 新空间新pane" --config-dir ~/.claude/skills/relay-light/
   ```
   → `herdr agent wait scribe --until idle` → `herdr agent prompt scribe "<派活 prompt>"` → **核真提交**（第 8 条）。
4. **scribe 派活 prompt**，首行必须是
   `[relay-light] worker · node=F1 · agent=scribe#1 · workspace=docs/modules/relay-light/workspace/RLT_21`，
   正文照 adapter「派活 prompt 模板」，并把下面这些逐条写进去。**正文开头先写一句：
   「这是 F 阶段新节点新实例，W/C/R/X 四个阶段实例已全部收口；下面是全新派单，你的任务是收口备料——
   补账、挂证据、写交付汇报、提交剩余工件，不做任何交付动作」。**

   - **允许写的文件恰好四个**（超出即停并发阻塞信号，不自行越界）：
     `docs/modules/relay-light/workspace/RLT_21/progress.md`、同目录 `review.md`、
     同目录 `findings.md`（**仅限第 ④ 项那一处登记**，见下）、
     自己的完成信号 `docs/modules/relay-light/workspace/RLT_21/done.scribe.F1.md`。
     **除这四个之外不新建、不修改、不删除任何文件**——特别是 **不许改 `lesson_candidates.md`、
     `check.C1.md`、`check.C2.md`、`review.plan.md`、`review.requirement.md`、`review.lesson.md`、
     `review.requirement.X1.md`、`review.lesson.X1.md`、`task_plan.md`、`brief.md`、`execution_strategy.md`**，
     **更不许碰 `tools/relay-light/**` 任何代码、测试或 skill 文本**。
   - **① 补 `progress.md` 的全程运行账（as-built）**。重点是 **X1 那一段**——
     **X1 阶段没有 scribe，那段过程账只存在于账本 `stage_result` 的 note 与监工交接摘要里，必须在这里补录**。
     按 `progress.md` 现有分区追加，**不重排版、不删既有行、不改既有 E-ID 的内容**：
     - 「日志 (Log)」补 X1 与 F1 两段：X1 的 coder 拉起与零代码改动结论、两路复核 PASS 的 P1/P2 计数、
       5 条 P1 的逐条处置；F1 的拉起与收口动作。
     - 「证据账本 (Evidence Ledger)」按现有 E 编号往下续（当前最大 **E18**，**从 E19 起排，不许重号、不许插号**），
       至少登记：X1 commit `435fad6` 的 diff 摘要、X1 的全量单测复跑（命令 + `Ran 181 tests` / `OK` /
       `skipped=0` / exit=0）、requirement 路的**变异实验**（命令 + RED 自然终态 + 恢复后 GREEN + 退出码）、
       `git diff --check` 三条与四集合检查、F1 本次 commit 的 SHA 与文件清单。
     - 新增一段 **「X1 偏离项（真实登记）」**（体例照现有「C1 偏离项」「C2 偏离项」）：
       写明「本轮零代码改动」是正确结果、P1-1 的裁决由 requirement 路作出而 `check.C1.md` 保持不动、
       P1-2 的代码轮由 requirement 路合并承担而未新建 `review.code-round1.md`——**这三条都是编排裁决，要留痕**。
     - **`evidence=` 引用的东西必须先在证据账里登记**；引用不到的就如实写「不可证」，**不许粉饰**。
   - **② `review.md` 的「AI 提交区」逐条挂证据**。七条验收 **A137 / A138 / A139 / A140 / A141 / A142 / A143**
     在「需求对齐证据」与「完成条件逐条挂证据」两张表里**各自挂到「哪个 commit / 哪几个用例 / 哪条命令」**
     ——现有表里已有 E-ID，**要补的是可复跑粒度**：
     - commit：A137~A140 → `a80fcde`（C1）；A141~A143 → `0e0f24a` + 整改 `4105da8`（C2）；
       R1 收敛 → `fc70185`；X1 证据与教训 → `435fad6`。**逐条对上，不许一句「见 C 阶段」带过。**
     - 用例：给出可定位的测试类 / 用例名（例如 `RelayStageResultRefTests`、`RelayNotRunRetryTests`、
       `RelayLaunchFixStatusTests`、`RelayLedgerSilenceTests` 及 A141/A142/A143 的结构检查用例），
       **以工作区现有报告与 `findings.md` 的原文为准，不凭记忆写用例名**。
     - 命令：每条给**可复跑命令 + 自然终态尾部 + 退出码**。
     - **`Confidence Challenge` 段要按 X1 结果重写**：现文写的是 R1 两路 FAIL 的旧现场，
       要改成 X1 两路 PASS、5 条 P1 全闭合的现状，**同时保留那句「任何测试绿、check 小审 PASS 或 review 结论
       都不等于用户验收、verify、push、PR、CI、merge 或发布」**，并写明 **F-009 / A143 口径分歧仍待用户裁决**。
     - **「材料齐没齐」可以改勾**，但措辞必须写死为**「AI 侧材料齐备」**，并在同一行注明
       「**用户验收未做；F-009/A143 口径分歧待裁决**」。**这不是验收，不许写成「已通过」「可交付」。**
     - **「人类签名区」的「结果」列一律留空，一个字都不许填，不许预勾、不许写「待确认」以外的任何结论**
       ——这是本派单的红线，`⚠️ This is not human approval` 与 `✅ 仅凭用户对话确认解锁` 两句原文保持不动。
   - **③ 写「交付汇报」与「证据展示区」**（在 `review.md` 末尾、**人类签名区之前**新增两段，
     标题写成 `## 交付汇报（F1 收口备料）` 与 `## 证据展示区（F1 收口备料）`，不打乱既有分区顺序）：
     - **四阶段用时**：按监工给你的账本时间戳表如实写（W#1 约 21 分、C#1 约 4 小时 04 分、R#1 约 42 分、
       X#1 约 44 分，合计约 6 小时 18 分；**以账本原文为准**）。
     - **两轮小审的打回与闭合**：C1 小审 **FAIL p1=3** → 因 A49 / A60 节点内返工不可行 → 三条整建制带入 C2 →
       C2 复审 **PASS p1=0 p2=1**；R1 两路复核 **FAIL 合计 5 条 P1** → X1 返工 → 两路 **PASS p1=0**（requirement p2=4）。
       **FAIL 要原样写出来，不许美化成「一次通过」。**
     - **变异实验证据**：requirement 路在 X1 做的「移除 `cancelled` 后 A69 目标断言 RED，恢复后 GREEN」
       ——给出命令、自然终态尾部与退出码，并写明**实验后文件已恢复、全量复绿**。
     - **181 tests**：`python -m unittest -v tools/relay-light/test_relay_log.py` → `Ran 181 tests` / `OK` /
       `skipped=0` / exit=0，**贴命令全串与自然终态尾部**。
     - **账本侧素材由监工提供**（`lint` 与 `status` 的原文我会贴给你）——**你不跨树、不调账本命令**
       （`execution_strategy.md` 硬约束），按监工给的原文登记即可，并注明「账本口径由监工在 RLT_12 树核验」。
     - **遗留项清单**：F-009 / A143 口径分歧（待用户二选一）、requirement 路 X1 的 4 条 P2、
       R1 的 3 条 P2、C2 的 1 条 P2、`findings.md` F-003（`.gitignore` 归属待裁决）——**逐条列，不合并、不消灭**。
     - **「下一步需要用户授权的动作」单独列一段**：push、建 PR、合 master、写 `verify(relay-light):` 提交、
       双侧 skill 重同步、用户验收签字——**写明这些在 F1 一律未做，各需用户另行明确授权**。
   - **④ 在 `findings.md` 登记遗留 P2**：把 **F-009** 的「状态」列更新为 **「卡点 · 待用户裁决（F1 收口登记）」**，
     并在该条目的影响/去向列补一句「X1 requirement 路复核维持原判：合同口径冲突、非施工缺陷，收口责任在用户」。
     **只动 F-009 这一条的状态与去向文字**，F-001~F-008a、F-010~F-012 **一个字都不许改**。
     **不许替用户二选一、不许改 oracle、不许改期望数字、不许引入「同根去重 / 残留折级」口径。**
     > **写入者边界的例外说明（编排裁决，必须在 `findings.md` 的该条目里留一句痕）**：`findings.md` 常规写入者是 coder（A67），
     > **但 F1 没有 coder 实例，收口登记无其它合法写入者**，故由编排裁决交 scribe 承担，**范围严格限于 F-009 这一条的状态与去向**。
     > 留痕写法：在该条目末尾加「（F1 由 scribe 按编排裁决登记状态，未改事实与计级）」。
   - **⑤ 提交剩余工件**：在 RLT_21 树把第 0.3 条那六个 untracked 文件 + 本节点新产出
     （`progress.md`、`review.md`、`findings.md`、`done.scribe.F1.md`）**逐个点名 `git add` 后 commit 到 `wt/RLT_21`**
     （scope 用英文 `relay-light`；**禁 `git add -A` / `git add .`**）。
     commit 前跑一次 `git status --porcelain` 与四集合检查（`git diff --name-only master...HEAD`、working tree、
     index、untracked），确认**无越界文件被捎带**。
     **不 push、不建 PR、不合 master、不写 `verify(relay-light):` 提交**（见硬边界）。
   - **回归护栏一条不许省**（即使本轮零代码改动）：
     `python -m unittest -v tools/relay-light/test_relay_log.py` 必须 **`Ran 181 tests` / `OK` / `skipped=0` / exit 0**
     （**贴命令全串 + 自然终态尾部 + 退出码**，对不上原样记录、不许粉饰）；
     `git diff --check` 三条（working tree / `master...HEAD` / `--cached`）；四集合允许路径自查逐一贴出来。
   - 进树第一个 Git 动作是 `git rebase master`；撞同 worktree 的 WIP 时按 `task_plan.md` 契约头 ② 的 DR-W-008 处置
     （`git merge-base` 核 HEAD 是否已含 master 顶点，成立即 no-op 记一行，**不强推、不清 WIP、不 `--autostash`**），
     判不出就发阻塞信号。
   - **持续在场**：每完成一件（①~⑤ 各算一件）打**四行小结**——做了什么 / 证据（命令 + 退出码）/ 偏离与登记 / 下一步，
     缺项写「无」。收到整改指令就在同一实例里继续改，**不自己重启、不开新实例**。
   - 完成方式：四行小结 → 写完成信号 **`workspace/RLT_21/done.scribe.F1.md`**
     （一行：`task=RLT_21 role=scribe node=F1 status=DONE evidence=<commit SHA> next=monitor`；
     **文件名带 `.F1` 后缀，别覆盖 `done.scribe.md` / `done.scribe.C2.md` / `done.scribe.R1.md`**）→ 即停。
     relay-light 无 `node_closed`，worker 完成即停、不等下一节点、**不做任何交付动作**。
   - **把第 0 条整段素材（0.1 / 0.2 / 0.3 三张表与结论）连同你跑的 `lint` / `status` 原文一起贴进 prompt**
     ——scribe 不跨树、不跑账本，这些是它唯一的账本口径来源。
5. **等 scribe 并收产出**：按第 8 条的**轮询**姿势（**不用 `herdr agent wait` 做长等**）。
   返回后**先自己读产出判合格**，逐项打勾，缺一项就发整改回 scribe 的 pane：
   - [ ] `progress.md` 的 X1 段补齐（拉起、零代码改动、两路 PASS 的 P1/P2 计数、5 条 P1 逐条处置），F1 段也在；
   - [ ] 证据账从 **E19** 起续号，无重号无插号；变异实验的命令 / 自然终态 / 退出码原样在；
   - [ ] 新增「X1 偏离项」段，三条编排裁决都留了痕；
   - [ ] `review.md` 七条验收**逐条**挂到 commit / 用例 / 命令，没有「见 C 阶段」这类含糊挂法；
   - [ ] `Confidence Challenge` 已按 X1 现状重写，且**「不等于用户验收 / verify / push / PR / CI / merge / 发布」那句原文还在**；
   - [ ] 「材料齐没齐」措辞是「AI 侧材料齐备」且标注了用户验收未做与 F-009 待裁决；
   - [ ] **「人类签名区」结果列全空**（`git diff` 核一眼该段有没有被动过，**被预勾就是 P1 级返工**）；
   - [ ] 「交付汇报」「证据展示区」两段在，四阶段用时、两轮小审打回与闭合、变异实验、181 tests 齐；
         「下一步需要用户授权的动作」单独成段且逐条列全；
   - [ ] 遗留项清单逐条列出（F-009、X1 p2=4、R1 p2=3、C2 p2=1、F-003），未合并未消灭；
   - [ ] `findings.md` **只有 F-009 一条被动过**，状态改为「待用户裁决」，留痕句在，其余条目零改动
         （`git diff docs/modules/relay-light/workspace/RLT_21/findings.md` 核一眼）；
   - [ ] `lesson_candidates.md` / `check.C*.md` / `review.plan.md` / `review.requirement*.md` / `review.lesson*.md` /
         `task_plan.md` / `brief.md` / `execution_strategy.md` **一个字都没被改**；
   - [ ] `tools/relay-light/**` **零改动**（本节点不动代码、不动测试、不动 skill 文本）；
   - [ ] 全量单测 `Ran 181 tests` / `OK` / `skipped=0` / exit 0 的**原始输出**在小结或证据账里；
   - [ ] `git diff --check` 三条均 exit 0；四集合无越界项；
   - [ ] commit 只打 `wt/RLT_21`，**未 push / 未建 PR / 未动 master / 无 `verify(relay-light):` 提交**；
   - [ ] 第 0.3 条那六个文件**全部已入库**，`git status --porcelain` 干净；
   - [ ] `done.scribe.F1.md` 在，格式完整且未覆盖旧信号；
   - [ ] 四行小结齐全。
   全部达标后才记：
   ```powershell
   python tools/relay-light/relay_log.py add --plan docs/modules/relay-light/relay/rlt12-win-01 --node F1 --event done --agent scribe#1 --note "收口备料完成：progress 补 X1 全程账（E19~E<n>）；review.md 七条验收逐条挂证据、交付汇报与证据展示区已写；人类签名区留空未预勾；findings F-009 登记为待用户裁决；全量 Ran 181 OK skipped=0；剩余 6 件工件已入库；commit=<sha>" --config-dir ~/.claude/skills/relay-light/
   ```
   **记完这一条，scribe 就是终态，返工边关闭——记之前想清楚（第 2 条）。**

## 5. 关节点与收尾（顺序固定，`outcome` 取值看清楚）

- **关节点**：双判据成立（**本节点 `agent_launch` 过的每个实例都已终态**，A17；且 `close` 列的 **scribe 已 `done`**，A74）后
  ```powershell
  python tools/relay-light/relay_log.py add --plan docs/modules/relay-light/relay/rlt12-win-01 --node F1 --event node_close --agent monitor#5 --note "scribe#1 done；progress 补齐 X1 全程账；review.md 七条验收挂证据、交付汇报与证据展示区已写、人类签名区留空；findings F-009=待用户裁决；剩余工件已入库；commit=<sha>" --config-dir ~/.claude/skills/relay-light/
  ```
- **`stage_result`**：`RLT_21:F#1` 只有 F1 一个节点，关掉即满足 A112。**账本只认四个 outcome**
  （`done` / `blocked` / `failed` / `cancelled`，`relay_log.py` 的 `STAGE_RESULT_OUTCOMES`）——
  **没有 `rework`、没有 `handoff`、没有 `closed` 这些值，写了直接退 2**。按下表取值：

  | 现场 | outcome | 编排读到的 `suggested_action` | 含义 |
  |---|---|---|---|
  | 收口备料齐备（清单全勾、工件已入库） | `done` | — | 本计划节点全部走完，交编排向用户汇报并请授权后续动作 |
  | 备料过程中撞到需用户裁决的卡点（且 F1 已关得掉） | `blocked` | `wait_user` | 停在人闸交编排交用户，**不自行做任何交付动作** |
  | **F 阶段本身没跑成**（scribe 起不来 / 节点关不掉 / 产出缺失） | `failed` | `relaunch_monitor` | 重拉监工重跑本阶段实例 |
  | 用户明文取消 | `cancelled` | — | note 必须引用 `user_decision`（A118）；**本轮不该出现** |

  **注意**：F-009 是**早已登记的遗留 P2**，X1 已按 `outcome=done` 带走，**它本身不构成 F1 的 `blocked`**
  ——F1 只负责把它如实登记并列进「需用户裁决」清单，**清单里有待裁决项不等于本阶段 blocked**。

  ```powershell
  python tools/relay-light/relay_log.py add --plan docs/modules/relay-light/relay/rlt12-win-01 --node F1 --event stage_result --agent monitor#5 --note "stage_id=RLT_21:F#1 outcome=<done|blocked|failed> 收口备料齐备：progress 补 X1 全程账、review.md 七条验收逐条挂证据、交付汇报与证据展示区已写、人类签名区留空未预勾；全量单测 Ran 181 OK skipped=0；四阶段用时 W21m/C4h04m/R42m/X44m 合计约6h18m；两轮小审=C1 FAIL p1=3 转 C2 PASS、R1 FAIL 5P1 转 X1 两路 PASS；变异实验 RED→GREEN 已验；遗留=F-009/A143 口径分歧待用户二选一、P2 合计 <n> 条、F-003 归属待裁决；未做=push/PR/合并/verify/双侧skill重同步/用户验收；<未闭合项=…|无>；commit=<sha>" --config-dir ~/.claude/skills/relay-light/
  ```
  被拒就贴 stderr 停下，**不要硬凑、不要改 outcome 蒙混**。
- 落账后**即停**，终端打印 **`MONITOR_DONE stage=F1 outcome=<done|blocked|failed>`**，并把交接事实一次说清：
  收口备料的五件事逐件结论、`progress.md` 新增的 E 编号区间、七条验收的挂证据结论、
  四阶段用时、两轮小审的打回与闭合、变异实验的命令与结果、`Ran <n> tests` 与 `skipped=<n>`、
  `git diff --check` 与四集合结果、**F1 的 commit SHA**、
  **遗留清单（F-009/A143 待用户二选一、各阶段 P2 计数、F-003 归属）**，
  以及 **「需用户另行明确授权才能做的动作」逐条**（push / 建 PR / 合 master / `verify(relay-light):` 提交 /
  双侧 skill 重同步 / 用户验收签字）。
- **不写 `stage_close`**（编排的事），**不关终端空间、不关 scribe pane**（编排统一收）。
- **不改 `relay_plan.md`、不写 `plan_amend`、不追加任何节点行。**

## 6. 止损（写死，不许自行放宽）

- **F1 没有 decider 行、没有 reviewer 行**：施工性卡点**不走 decider 链**（`escalate --note "decider=..."` 会因
  本节点无 decider 实例而落空）。走法是：`blocked`（挂 live scribe 名下）→ 你判定不可现场收敛 →
  `node_close F1` → **`stage_result outcome=blocked`** → 打印 `MONITOR_DONE stage=F1 outcome=blocked` 停，交编排交用户。
- **同一件事在 scribe 仍 live 时往返 3 轮仍不收敛** → 同上止损，**别死循环**。
- **scribe 已 `done` 之后不存在节点内返工路径**（A49 / A60）——
  **不许用 `agent_lost` 去「洗掉」一个已 `done` 的 scribe 来重拉**，那是伪造现场，校验也会拒。
- **不许为了让 `stage_result` 好看而跳过自查项**，也不许把「没做」记成「做了」。

## 7. 异常出口（照现行校验，别发明新写法）

- **静默超时**：worker 状态 `working` 但 pane 输出 **>20 分钟无变化** →
  `add --node F1 --event agent_lost --agent scribe#<n> --note "silence>20min"` → **同一个 pane** 关掉重拉 `#n+1`
  （`agent_launch` 的 attempt 必须恰为当前最大值 + 1），`attempt_max=3`。
- **环境性 NOT_RUN**（起不来 / 沙箱拒写 / 输入通道冻结）：合法出口是 **`blocked` → `agent_lost` → 重拉**
  （DR-W-002 实证）。**不要写 `escalate --agent monitor#5 --note "decider=monitor#5 ..."`**——
  A69 只认 `decider=<名>#<n>` 或 `strategist=<名>#<n>` 恰一个 helper token，**监工不是合法 helper**，写了必被拒。
  换档重拉时把事实写进 `agent_launch` 的 note（`launch_fix=<新档>`），**不要 `plan_amend`**
  （你这一侧跑的旧版账本里 `launch_fix=` 仍只是 note 文本、lint 不校验——计划注释 8 的已知缺口）。
- **attempt_max 用尽仍 NOT_RUN**：按计划注释 5 由你拉 `strategist#1`
  （`codex -m gpt-5.6-terra -c model_reasoning_effort=high --sandbox workspace-write`），走 SKILL 的 strategist 链：
  `escalate`（记在卡住的 scribe 名下，note 恰含 `strategist=strategist#1`）→ `agent_launch strategist#1`
  → `decision`（scribe 名下，复述同一 helper）→ `done strategist#1` → **停在 `user_decision` 人闸**，
  交编排，不要自己代答。
- 任何 `add` 退出 2 / 3：**stderr 原样贴到终端并停下，不要绕过校验、不要改参数硬凑。**
- 节点走不下去、而 F1 又还没关时：按 SKILL 该写 `stage_result outcome=blocked`，但现行实现会被 A112 拒（节点未关）
  ——**照写一次，把退出码与 stderr 原样留在终端当作 A137 缺口的现场证据**，**不要绕过校验、不要为了让它过去硬关节点**；
  随后打印 `MONITOR_BLOCKED stage=F1 reason=<一句话>` 并停，交编排定夺，同时保留可复现的证据（命令、退出码、stderr 原文）。

## 8. 等待、真提交与审批菜单（承接 Windows 预演与 C / R / X 阶段实战，逐条落地）

- **等待一律轮询，不用 `herdr agent wait` 做长等**：监工侧 `wait` 会间歇 `PermissionDenied`（Os code 5）。
  **一轮 ≈ 9 分钟**：每 **30 秒**对在跑的 scribe 跑一次 `herdr agent get scribe` + `herdr agent read scribe --tail <n>`，
  看 `status` / `state_change_seq` / pane 末行是否在动；一轮跑满还没出结果，**直接进下一轮，不要结束回合空等**。
  （`herdr agent wait scribe --until idle` 这种**拉起前的短等**仍可用，抖动了就退避重试。）
- **`Os code 5` / `PermissionDenied` 是工具抖动，不是失联**：退避 5~10 秒重试同一条命令，
  **连续 3 次同一命令都失败**才按第 7 条当异常处理。**不要把工具抖动记成 `agent_lost`。**
- **真提交核验（DR-W-003，Windows 约 75% 命中）**：`herdr agent prompt` 发出后必须核真提交——
  `herdr agent get scribe` 看 `state_change_seq` 变化且 `status` 转 `working`；停在输入框
  （seq 不动 / `agent_prompt_stalled`）就补 `herdr agent send-keys scribe enter` 再复验；
  终极判据 = `herdr agent read` 看输入框已清空。输入通道整体冻结则该实例弃用，
  按第 7 条 `agent_lost` 在同 pane 拉 fresh 实例。
- **审批菜单编号不得按固定数字**（C 阶段实测踩过，已冻结为教训候选 L-006）：Devin 与 codex 的审批菜单
  **编号随选项数量变化**。每次都要：① `herdr agent read scribe` 读**菜单原文** → ② 找**写着
  「Yes (Approve once)」那一行**的编号 → ③ `herdr agent send-keys scribe <该编号>` → ④ 再 `read` 一次确认菜单已消失。
  **绝不选 bypass / 全放行、`Edit command`、`Describe change`、`No`**，也不替它降 `--permission-mode` 重拉。
- **显式钉模型档（DR-W-007）**：任何 codex 启动串都要带 `-m`，裸启会跑成账号默认模型。
- **复核 / 决策角色一律 `workspace-write`（DR-W-001）**：`--sandbox read-only` 在 Windows 能读但拒写一切文件，
  产出落不了盘等同失联。本节点只有 devin 的 scribe，这条用于你万一要拉 strategist 时照办。

## 派单纪律（逐条落地）

- **F1 是收口备料，不是收口**：见抬头与硬边界，这是本节点的**第一纪律**。材料齐 ≠ 可交付。
- **`done` 压到自查之后**：见第 2 条。这是整卡最后一道返工边，记早了就再也回不去。
- **人类签名区一律留空**：AI 不得预勾，`✅ 仅凭用户对话确认解锁` 是硬约定。scribe 预勾了就发回整改，**不许放行**。
- **只拉本节点的 agent**：F1 只有 scribe 一行（加异常时按需的 strategist）。
  **不拉 coder、不拉 checker、不拉 reviewer、不拉 decider**；也不回头给 W / C / R / X 阶段的终态 agent 补事件。
- **完成信号带 `.F1` 后缀**：`done.scribe.F1.md`。**不许覆盖 `done.scribe.md` / `done.scribe.C2.md` / `done.scribe.R1.md`**。
- **记账不漏、不自造**：每一次拉起与每一个终态都要落账本，事件名只用 SKILL 词表里的
  （`agent_launch` / `checkpoint` / `blocked` / `escalate` / `decision` / `user_decision` / `resume` /
  `done` / `agent_lost` / `cancelled` + 控制事件 `node_start` / `node_close` / `stage_result` / `monitor_restart`），
  不要发明 `handoff`、`finalize`、`deliver` 之类新词。
- **监工不写业务工件**：A67 的写入者边界对你同样成立——你只写账本，`progress.md` / `review.md` / `findings.md`
  一律由 scribe 写，**不许你代笔**。

## 硬边界

- **不 `push`、不建 PR、不合并、不动 `master`**；commit 只打 `wt/RLT_21`，且只有 scribe 这一次提交。
- **不写 `verify(relay-light):` 提交**——verify 是用户验收签字后才做的动作，**F1 一律不做、也不预写**。
- **不做双侧 skill 重同步、不跑 `install_skill.py`、不改两侧用户级 skill 安装副本**
  ——**skill 改动的两侧重同步须用户当次明确授权；未授权则停在仓内验证**（计划 F1 行的 note 原文）。
  仓内 `tools/relay-light/skill/**` 在 F1 也**零改动**（第 3 条）。
- **不动 RLT_12 树任何文件**（除账本 `relay_log.jsonl` 由你 `add` 追加）——`relay_plan.md`、`dispatch/`、
  开发方案都不动；那几份派单对 scribe 是**只读素材**。
- **不改 `docs/modules/relay-light/design/`（禁区）**，不改验收 ID，不改 `task_plan.md` / `brief.md` 的验收编号与切法，
  **不改 oracle**（F-009 / A143 的分歧由用户裁决，谁都不许顺手把期望数字改掉）。
- **不回头改 W / C / R / X 阶段的账本行**，不改 `check.C1.md` / `check.C2.md` / `review.plan.md` /
  `review.requirement.md` / `review.lesson.md` / `review.requirement.X1.md` / `review.lesson.X1.md` / `review.md`
  的**复核结论段**——都是已关闭阶段的既成事实（`review.md` 只许按第 4 步 ② ③ 增补收口内容）。
- **不改 `lesson_candidates.md`**（coder 的登记位，L-001~L-007 保持原样）。
- **`findings.md` 只许动 F-009 一条**（状态与去向），其余条目零改动，且必须留下编排裁决的痕。
- **不改任何代码与测试**：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py` 零改动。
- 不碰 dh-relay 模块的 `knowledge/**`、`tools/tests/`、现役 Runner。
- 凭据 / 密钥值永不进 prompt、note、工件、账本；证据先按白名单过滤（A27）。
- **不越权替用户裁决**（F-009 二选一是用户的事）；不自授权超限继续；
  不为「有纠偏可展示」制造假问题，也不为收工把未完成写成已完成。

## 授权记录

用户 2026-09-14 已授权：RLT_12 D-start（Issue #23，树 `wt/RLT_12`）；本计划 `rlt12-win-01` 的计划内业务卡 =
RLT_21（Issue #21，施工树 `wt/RLT_21`）；各节点的委托按计划 agent 表的默认档位执行，不逐个再问；
接受 A112 / NOT_RUN 已知缺口（迁移表下无 `blocked` 终态 agent，环境性 NOT_RUN 走 `blocked → agent_lost` 重拉，
`launch_fix=` 仅为 note 文本不受 lint 校验；`stage_result` 对所有 outcome 都要求节点全关），
并冻结该口径为本次运行的证据基线。

编排 2026-09-15 裁决（沿用 X 阶段七条，并为 F1 追加三条）：
① C1 在 checker FAIL p1=3 下如实关闭、三条 P1 由 C2 承接返工，C2 已复审 PASS；
② R 阶段按 `dh-mapping.toml` 的 `[recipes.normal]` **两路**跑，口径分歧由 requirement 路给结论；
③ 复核角色一律 fresh 实例、一律 `workspace-write`，只读由 prompt 承担；
④ X1 的 requirement 路一并承担 normal 整体的代码轮 1 职责，不新开第三路、不建 `review.code-round1.md`；
⑤ P1-1 的 durable 复审裁决由 X1 的 requirement 路作出并写在 `review.requirement.X1.md`，`check.C1.md` 保持不动；
⑥ X1 无 scribe，`progress.md` 在 X 阶段不更新，**过程账由 F1 的 scribe 一并补录**（本派单第 4 步 ①）；
⑦ X1 是返工第 1 轮且两路 PASS，`rework_max_rounds=2` 未触发，按 `outcome=done` 进 F 阶段；
⑧ **F1 的 `findings.md` F-009 收口登记由 scribe 承担**（本节点无 coder 实例，A67 无其它合法写入者），
范围严格限于该条目的状态与去向文字，须在条目内留痕；
⑨ **F1 的 scribe 不跨树、不调账本命令**，账本侧素材（`lint` / `status` 原文、阶段时间戳）由监工在 RLT_12 树核验后
原样贴进派活 prompt；
⑩ **F1 只做收口备料**：push、建 PR、合 master、写 `verify(relay-light):` 提交、双侧 skill 重同步、用户验收签字
**各需用户另行明确授权，本阶段一律不做**——监工在 `MONITOR_DONE` 的交接里把这份清单逐条交出去，由编排提请用户。
