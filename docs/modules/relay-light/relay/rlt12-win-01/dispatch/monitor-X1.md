`[relay-light] monitor · plan=rlt12-win-01 · stage=X1 · agent=monitor#4`

# monitor#4 · RLT_21:X#1 · relay-light 监工派单（编排 → 监工）

你是 relay-light 计划 `rlt12-win-01` 的 **X 阶段监工 `monitor#4`**——**新阶段、新监工实例、新阶段实例
`RLT_21:X#1`**，与 R 阶段的 `monitor#3` 无继承关系（不续用 `monitor#3` 这个名字，也不回头改 R 阶段任何账本行）。
运行时 = codex（编排以 `codex -m gpt-5.6-terra -c model_reasoning_effort=high --sandbox workspace-write`
在你自己的终端空间拉起，cwd = RLT_12 树）。协议全文见 `~/.codex/skills/relay-light/SKILL.md`（与仓内
`tools/relay-light/skill/SKILL.md` 逐字节相同），命令写法见 `references/adapter-claude-code.md`
——**本计划主控侧是 Claude 适配，账本一律 `--config-dir ~/.claude/skills/relay-light/`**。

**你只管阶段实例 `RLT_21:X#1` 的节点 X1**：W / C / R 三个阶段实例都已整体收口（见第 0 条），F1 不归你，
**X2 不由你开**（见第 9 条的止损边界）；不写 `stage_close`、不关终端空间、不回头问用户
（要用户裁决时按第 12 条停下交编排）。**X1 是本阶段实例的唯一节点——`stage_result` 归你写。**

## 现场

两棵树分工，别串。

| 用途 | 路径 | 分支 |
|---|---|---|
| 计划与账本（你跑账本命令的 cwd） | `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12` | `wt/RLT_12` |
| RLT_21 整改与任务工作区（全部 worker 的 cwd） | `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_21` | `wt/RLT_21`（R1 产出已在，HEAD **`fc70185`**） |

- 计划目录：`docs/modules/relay-light/relay/rlt12-win-01/`（`relay_plan.md` + `relay_log.jsonl` + `dispatch/`）。
  开工前**通读 `relay_plan.md` 的注释 1~8**：那是规划冻结的现场约定，运行时不重抄、也不推翻。
  注释 6（X 阶段节点由编排现场追加、轮数上限 `rework_max_rounds=2`）是本节点存在的直接依据，重点读——
  **X1 行与四条 agent 行已由编排追加完毕、`lint: ok`，F1 的 `depends_on` 也已改指 X1，你不再改计划、不写 `plan_amend`。**
- 账本程序（在 RLT_12 树跑，Windows 命令名是 `python` 不是 `python3`）：

  ```powershell
  python tools/relay-light/relay_log.py add    --plan docs/modules/relay-light/relay/rlt12-win-01 --node X1 --event <e> --agent <a> --note "<t>" --config-dir ~/.claude/skills/relay-light/
  python tools/relay-light/relay_log.py status --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/
  python tools/relay-light/relay_log.py lint   --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/
  ```

  `--config-dir` 每次都要带（HC-RL-A136），不带会撞双侧歧义退出 3。`lint` 不支持 `--json`，且**只校验计划、不校验账本**。
- **账本跑的永远是 RLT_12 树这一份 `relay_log.py`**（计划注释 8）：C 阶段的 coder 改的是 **RLT_21 树**的同名文件
  （`ref=` 强制、模式门、`cancelled` 归属闸、`launch_fix` 字段都落在那一份里），**两份互不影响**。
  你这一侧按 RLT_12 树的现行旧版执行——**旧版没有那些新闸**：`stage_result` 不要求 `ref=`，`launch_fix=` 只是 note 文本。
  X1 的 coder 会继续改 RLT_21 树那一份，那是它的活，不是你换账本的理由。
- 任务工作区（在 **RLT_21 树**）：`docs/modules/relay-light/workspace/RLT_21/`。W1/C1/C2/R1 已留下
  `brief.md`、`task_plan.md`、`execution_strategy.md`、`review.plan.md`、`progress.md`、`findings.md`、
  `lesson_candidates.md`、`check.C1.md`、`check.C2.md`、`review.requirement.md`、`review.lesson.md`、`review.md`
  与各节点的 `done.*.md`，**全部已提交在 `fc70185`**。
- 业务卡定义：RLT_21 树 `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` 的 `#### RLT_21` 段；
  Issue #21（`gh issue view 21`）是同一口径的摘要，**与开发方案冲突时以开发方案与本计划的节点表/agent 表为准**。
  **本节点的整改口径以 `review.requirement.md` / `review.lesson.md` 两份报告的 P1 原文为准**，你不重切、不加戏、不放水。
- 每开一个 pane，先 `$env:PYTHONUTF8=1` 再跑账本/派活，避免中文 note 的编码抖动。
- 硬规则（原样转达，不得删改）：`wait` 返回时必须有接收者（watch 推送 / 前台阻塞循环 / 后台退出唤醒三选一）；
  watch 未实现时不得结束回合空等。凭据 / 密钥值永不写进 note、工件、账本、派活文案。
- 本计划 `decision_mode=auto`（marker 冻结）：**decider 链里不写 `user_decision`**，写了即拒（A114）。
  X1 的 agent 表**有 decider 行**（trigger `on:blocked`），走法与限制见第 10 条。

## 0. 上游交接事实（已核，不要重新调查）

- **W1 / C1 / C2 / R1 四个节点都已 `closed`**；`RLT_21:W#1`、`RLT_21:C#1`、`RLT_21:R#1` 三个阶段实例
  `stage_result` 均为 `outcome=done`，`stage_close` 均已落账。R 阶段的终端空间 **`wJ` 已由编排关闭**。
- **R1 的 `stage_result` 是 `outcome=done`，但两路复核都是 FAIL**——这是 relay-light 的正常编码：
  「复核这件事做完了」记 `done`，返工由 X 阶段承接（`outcome=rework` 这个值**不存在**，写了退 2）。
  R1 的打回清单原文在账本 seq 50 与 `review.md`：**requirement 路 FAIL p1=2 p2=3、lesson 路 FAIL p1=3 p2=0，合计 5 条 P1**。
- **R1 的 commit 是 `fc70185`**（RLT_21 树 `wt/RLT_21`），X1 的一切整改都以它为基线。
- **R1 的机器事实（X1 复跑的基线数字，对不上就是发现）**：
  `python -m unittest -v tools/relay-light/test_relay_log.py` → `Ran 181 tests`、`OK`、**`skipped=0`**、exit=0；
  `git diff --check` 三条（working tree / `master...HEAD` / `--cached`）均 exit=0；四集合无越界项。
- **遗留 P2（本轮不整改，只许如实带走）**：
  - **P2-1 = F-009 / A143 口径分歧**——按 SKILL 冻结的四类逐条计级得 `3 P1 + 2 P2`，与 oracle 写的 `1 P1 + 4 P2`
    不可兼得。requirement 路已判为**合同口径冲突、非施工缺陷**，收口责任在 design/验收 owner，**须由编排提交用户二选一**。
    **X1 的任何人都不许改 oracle、不许改期望数字、不许为了凑数引入「同根去重 / 残留折级」。**
  - **P2-2 = A140 对终态 agent 是否提示 `ledger_silent` 未在 oracle 中说透**；**P2-3 = 「两路 / 三路」术语混用**。
    两条都只记录、不动代码。
- **编排 2026-09-15 对 P1-2 的裁决（本节点的口径，必须原样转达给两路复核）**：
  `dh-mapping.toml` 的 `[recipes.normal].reviewers` 只有 `requirement` + `lesson` **两路，没有 `code-round1`**，
  计划 agent 表也按两路冻结。**X1 不新开第三路**，而是由 **X1 的 requirement 路一并承担代码轮职责**
  （审整卡实现正确性、行为有效性、有效单测变异点），并**在 `review.requirement.X1.md` 里写明
  「本报告的代码轮职责系编排裁决的合并口径」**。这条要逐字写进 requirement 的派活 prompt。

## 1. 五条 P1 的原文要求（整改口径，逐条照办，不许只记编号）

下面五条是 X1 存在的全部理由。**原文出处已标行号，coder 与两路复核都必须读原文，不得只看本节摘要。**

### P1-1 · C1 checker 的 FAIL 没有 durable 复审闭环，C2/R1 前置不成立
出处：`review.requirement.md:69-86`。
- 事实：`check.C1.md:6-9` 结论仍为 **FAIL、P1=3**；`done.checker.md` 只有 `status=FAIL p1=3 p2=0`，
  不符合 `task_plan.md:41` 的完整信号格式；`progress.md:18` 明写「复审结论未在本工作区落盘」。
  而 `task_plan.md:38,77` 冻结的是 **C1 checker PASS 后才可进入 C2/R1**。F-004/F-007 与当前代码/测试说明整改
  很可能已经完成，**但施工方自述和全量绿不能代替独立复核者的 PASS**。
- 原文要求的整改动作：① 由**非施工者**复审当前 A137~A140 增量，逐项给出 C1 三条旧 P1 的 **CLOSED / OPEN** 与最终 PASS/FAIL；
  ② 用完整格式新写、**不覆盖旧信号**的完成信号；③ 复跑
  `python -m unittest -v tools/relay-light/test_relay_log.py -k RelayStageResultRefTests`、
  `-k "RelayNotRunRetryTests or RelayLaunchFixStatusTests or RelayLedgerSilenceTests"`、全量 181 tests。
- **本节点的落地口径（编排裁决，与原文的差异必须写明）**：X1 的 agent 表**没有 checker 行**，
  且 R1 与 C2 的硬边界都冻结了「**不回头改 `check.C1.md` / `check.C2.md`**」（C 阶段是已关闭的既成事实，A67 写入者边界
  也只认 checker）。因此：
  - **durable 复审的裁决由 X1 的 requirement 路作出**（fresh、非施工者、独立复跑），
    **写在 `review.requirement.X1.md` 的独立小节里**，逐项标 CLOSED / OPEN 并给最终 PASS / FAIL；
  - **coder 只负责把证据摆齐**：把 C1 三条旧 P1 各自「由哪个 commit / 哪几个用例 / 哪条命令闭合」
    逐项写进 `findings.md` 的新条目，每项挂**可复跑命令 + 自然终态尾部 + 退出码**；
  - **谁都不许改 `check.C1.md`、不许补写 `done.checker.C1.recheck.md`**（无 checker 实例即无合法写入者），
    也**不许由 coder 自己宣布 CLOSED**——coder 给证据，requirement 路给裁决。

### P1-2 · normal 整体必做的独立 code-round1 尚未执行
出处：`review.requirement.md:88-103`。
- 事实：仓根 `AGENTS.md` 冻结 normal 为**代码轮 1、需求方向、教训三路**；`review.md:4,24,50` 登记 code-round1
  必做且仍「待编排派 / 待执行」；当前不存在 `review.code-round1.md`。`dh-mapping.toml:17-18` 的 normal
  两路只定义 R-stage reviewer 行，**两路 Recipe 展开不能替代整卡代码轮 1**。
- 原文要求的整改动作：① 派 fresh、非 coder 的 code-round1 reviewer，只读整卡 diff 与实现行为；
  ② **至少选 `review.md:38-42` 的一个有效单测变异点**，登记「变异后目标断言红、恢复后全绿」的命令与自然终态；
  ③ 复跑全量 181 tests。
- **本节点的落地口径（第 0 条的编排裁决）**：不新开第三路，**由 X1 的 requirement 路一并承担**，
  产出合并进 `review.requirement.X1.md`（**不新建 `review.code-round1.md`**），并在报告里写明这是编排裁决的合并口径。
  **有效单测变异实验由 requirement 路本机做**——它是唯一有权做这件事的角色；**coder 不许自己做变异实验来自证**。
  coder 这一侧的责任只有一条：**保证整卡 diff 可审**（不留半成品、不留注释掉的测试、不留未提交的改动）。

### P1-3 · C1 的 `done` 时机堵死节点内返工，未进入候选
出处：`review.lesson.md:14-19`（该报告的 P1-1）。
- 事实：C1 的 coder 与 checker 都被记为 `done` 后，checker 才留下 FAIL（P1=3）；A49 不许重拉、A60 不许给终态 agent
  挂事件，**节点内返工只能整建制推到 C2**。RLT_12 的 C2 派单已把它冻结为「第一纪律」。
  证据：`monitor-C2.md:50,51,52,63,64,193-205`（**在 RLT_12 树，只读**）、本树 `check.C1.md:6-9`。
- 原文要求的整改动作：由 **coder** 在 `lesson_candidates.md` 新增**独立候选**，至少冻结这条规则——
  「**checker PASS 前 coder / checker 均不记 `done`；FAIL 走 live checker 的 `checkpoint` `routed_to=` 同一 coder；
  PASS 后才按 coder→checker 顺序记终态**」，并挂上述 C1 / C2 证据。
- 去重结论（原文已给，照抄进候选）：与 L-001 **不同源**——L-001 是「新增归属事件覆盖 latest-event 读者」的数据语义风险，
  本条是「过早终态化切断返工生命周期」的编排时序风险。

### P1-4 · 审批菜单编号漂移的安全操作规则未进入候选
出处：`review.lesson.md:21-26`（该报告的 P1-2）。
- 事实：C 阶段实测 Devin / codex 审批菜单编号**随选项数量变化**，固定数字会误选；R1 派单已要求每次先读菜单原文、
  定位 `Yes (Approve once)` 的当前编号、发键后再读确认菜单消失，并禁止 bypass / 全放行。
  证据：`monitor-R1.md:347-350`；早期派单只写抽象 `<数字>`、未冻结动态定位——`monitor-W1.md:65-66`、
  `monitor-C1.md:75-76`、`monitor-C2.md:113-114`（均在 RLT_12 树，只读）。
- 原文要求的整改动作：由 coder 新增候选，规则写成「**按菜单文案动态找一次批准项，不按固定编号；发送后复读确认；
  禁止 bypass / 全放行**」，并保留实测与旧派单的对照证据。
- 去重结论：L-001~L-004 均未覆盖 UI 菜单的语义定位与二次确认，**不同源**。

### P1-5 · `herdr agent wait` 间歇 PermissionDenied 的轮询 / 退避规则未进入候选
出处：`review.lesson.md:28-33`（该报告的 P1-3）。
- 事实：C 阶段实测监工侧 `herdr agent wait` 会间歇报 `PermissionDenied`（**Os code 5**）并打断回合；
  R1 派单已改为每 30 秒对各 agent 执行 `get` + `read` 轮询，Os code 5 时退避 5~10 秒重试同一命令，
  **连续三次失败才按异常处理**，且**不得把工具抖动记成 `agent_lost`**。
  证据：`monitor-R1.md:210-215,312,351-353`（RLT_12 树，只读）。
- 原文要求的整改动作：由 coder 新增候选，冻结「**长等使用 `get`+`read` 轮询；`PermissionDenied` 退避重试；
  达到连续失败阈值前不判 `agent_lost`；等待返回始终有接收者**」，并挂上述实测证据。
- 去重结论：L-003 处理的是复核文件覆盖导致的证据耐久性，本条处理等待机制与失联判定，**不同源**。

**归类（给 coder 的排期提示）**：五条里**没有一条要求改 `relay_log.py` 的产品逻辑**。
P1-3 / P1-4 / P1-5 是**文档类**（`lesson_candidates.md` 三条新候选）；P1-1 是**证据类**（`findings.md` 摆证据 + 复核裁决）；
P1-2 是**流程类**（由 requirement 路承担的代码轮）。**所以本轮 coder 很可能不产生任何代码改动——这不是偷懒，是正确结果**；
但**全量单测、`git diff --check`、四集合自查一条都不许省**（回归护栏），且必须如实记录「本轮无代码改动」。

## 本节点的权威定义（抄自计划，不要自行发挥）

| node | card | stage | type | close | depends_on |
|---|---|---|---|---|---|
| X1 | RLT_21 | `RLT_21:X#1` | rework | **`agent:requirement`** | R1（已 closed） |

| agent | role | launch | output | trigger |
|---|---|---|---|---|
| coder | coder | `devin --model swe-2-max` | 整改产出与 findings、lesson 行 | （空，立即拉） |
| requirement | reviewer | `codex -m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write` | `review.requirement.X1.md` | `on:done:coder` |
| lesson | reviewer | `codex -m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write` | `review.lesson.X1.md` | `on:done:coder` |
| decider | decider | `codex -m gpt-6-astra --sandbox workspace-write` | `decision.1.md` | `on:blocked` |

**四个 agent 全是 X1 名下的新实例，attempt 从 1 起**（`coder#1` / `requirement#1` / `lesson#1` / `decider#1`）——
账本按 `node` 区分实例，与 C / R 阶段的同名 `#1` 不冲突、不继承、不叠加 attempt。

**`close=agent:requirement` 的硬含义**：关节点看的是 **requirement 的 `done`**。
但 `node_close` 的另一半判据是 **A17：本节点 `agent_launch` 过的每一个实例都必须是终态**——
所以 coder、requirement、lesson 三个都要有 `done`（走过 decider 的话还有 decider）才关得掉。

**X1 没有 scribe 行**：`progress.md` 是 scribe 独占（A67），**本节点无人有权写它**。
X1 的过程账由**你的 `stage_result` note + 终端交接摘要**承载，交编排在 F1 一并补。**不许让 coder 或复核者代写 `progress.md`。**

## 2. 终端空间与 pane 安排（与 R 阶段的实质差异，看清楚）

**R 阶段的终端空间 `wJ` 已被编排关闭，R 阶段的三个 worker 进程已不存在。X 阶段是全新工作区**——
编排会先把新空间建好，并在拉起你时把**空间名与可用 pane 号**直接告诉你；**以编排当次告知的 pane 号为准**，
本表的占位符不是实测值。

| 角色 | pane | 进程 | 复用还是 fresh |
|---|---|---|---|
| monitor（你自己） | 编排告知（你所在的那个） | codex `gpt-5.6-terra` reasoning=high `--sandbox workspace-write`，cwd = **RLT_12 树** | — |
| coder | 编排告知的 pane A | devin `--model swe-2-max --permission-mode normal`，cwd = **RLT_21 树** | **全新 pane、fresh 实例** |
| requirement | 编排告知的 pane B | codex `-m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write`，cwd = **RLT_21 树** | **全新 pane、fresh 实例** |
| lesson | 编排告知的 pane C | 同上 | **全新 pane、fresh 实例** |
| decider（按需） | 新 pane | codex `-m gpt-6-astra --sandbox workspace-write`，cwd = **RLT_21 树** | 只在第 10 条触发时拉 |

- **三个 worker 全部新开 pane、全部 `herdr agent start` 拉 fresh**，没有任何可复用的进程。
  ```powershell
  herdr agent start coder       --kind devin --pane <pane A> -- --model swe-2-max
  herdr agent start requirement --kind codex --pane <pane B> -- -m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write
  herdr agent start lesson      --kind codex --pane <pane C> -- -m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write
  ```
- **cwd 一律 `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_21`**，只有你自己在 RLT_12 树。
  拉起前先 `herdr pane list` 核准 pane 的 cwd，对不上就在该 pane 里先切到 RLT_21 树再 `agent start`。
- 需要自己 split 时**显式传目标 pane，不要用 `--current`**（会开错地方）。
- **herdr 的 agent 名与账本角色名对齐**（`coder` / `requirement` / `lesson` / `decider`）。
  若 `herdr agent start` 报名字冲突（R 阶段残留未清），先 `herdr agent list` 核一眼，
  残留就用 `requirement-x1` 之类的 herdr 名绕开——**但账本里的名字必须仍是 `requirement#1`，不许跟着改**。
- 每个 pane 起手先 `$env:PYTHONUTF8=1`。

## 3. 【本派单最关键的一条】`done` 的时机：一个硬闸 + 一条纪律

**先读懂这条，再往下走；顺序搞错就是第二次 C1 事故。**

- **硬闸（校验器强制，绕不过去）**：requirement / lesson 两行的 trigger 是 **`on:done:coder`**。
  `relay_log.py` 的 `_require_trigger` 会在 `agent_launch` 时检查 **coder 在本节点的最新事件是不是 `done`**，
  不是就报 **`HC-RL-A70`** 退 2。**也就是说：coder 的 `done` 必须先落账，两路复核才拉得起来。**
- **纪律（C1 的教训）**：`done` 一记，A49（不许重拉）与 A60（不许给终态 agent 挂事件）就把该 agent 的返工路封死。
  coder 记了 `done` 之后，**再想把整改发回同一个 coder 是不可能的**。
- **两者冲突，本节点这样解（编排裁决，逐字照办）**：

  1. **coder 交活后的全部返工，压在它的 `done` 之前，由你（监工）驱动**。
     coder 说做完了，你先按第 6 条的**完备性自查清单**逐项核一遍（五条 P1 的原文要求、全量单测、
     `git diff --check`、四集合、commit、完成信号）。**任何一项不达标，直接把整改 prompt 发回同一个 live coder
     的 pane**——**整改往返不需要账本事件，不新增 attempt、不新增 `agent_launch`**，往返几轮都行。
  2. **只有你自查全部通过，才记 `done coder#1`**，随即拉两路复核。
     这一记之后 **coder 就是终态，返工边永久关闭**——所以第 1 步宁可多跑一轮，不要抢着记 `done`。
  3. **两路复核的 `done` 仍要压到「你已判定该路全部 P1 的归属」之后**：
     - 复核报 **PASS**：直接按第 8 条记 `done`。
     - 复核报 **FAIL 且有 P1**：**先落 `checkpoint`**（挂在**该路 live reviewer** 名下），note 写
       `routed_to=orchestrator P1-<编号> <一句话>`，**每条 P1 一行**；落完再记该路的 `done`。
       **此时不许拉第二个 coder、不许 `plan_amend`、不许自己开 X2**——按第 9 条的止损直接收尾。
     - 报告本身不合格（缺分级、缺可执行整改、没回应指定问题、越界写了别人的文件）**不算 FAIL**，
       直接发整改回该路自己的 pane（同一 live 实例，不记账本事件），改到合格再判。
  4. **`routed_to=` 是 note 里的自由文本，不是 helper token**——别写成 `decider=` / `strategist=`，A69 会拒。
  5. **绝不为收工把 FAIL 记成 PASS，也不为「有纠偏可展示」制造假问题或诱导复核报假 P1。**
     两路都 PASS、零 P1 是完全合法且期望中的结果，如实写就是。

## 4. 你要按顺序做的事

1. **看现场**：跑 `status`，应见 `RLT_21:W#1` / `RLT_21:C#1` / `RLT_21:R#1` 三个阶段实例都 `closed result=done`，
   `RLT_21:X#1` 为 `pending`，且 `RLT_21:X#1` 的 `stage_start` 与 `monitor_launch` 两行都带 `stage_id=RLT_21:X#1`、
   节点 X1 为 `ready`。**两行不全不要自己补**——那是编排的控制事件，写入者不符会被拒；
   按第 12 条打 `MONITOR_BLOCKED` 停下。顺手跑一次 `lint`，非 0 原样贴 stderr 并停。
   另核 RLT_21 树：`git -C <RLT_21 树> log -1 --format=%h` 应为 **`fc70185`**，`git status --porcelain` 应为空；
   对不上先停下报编排，**不要自己清理别人的工作区**。
2. **开节点**：
   ```powershell
   python tools/relay-light/relay_log.py add --plan docs/modules/relay-light/relay/rlt12-win-01 --node X1 --event node_start --agent monitor#4 --note "stage_id=RLT_21:X#1 depends_on=R1 closed；承接 R1 两路复核 5 条 P1 返工第 1 轮 基线 fc70185" --config-dir ~/.claude/skills/relay-light/
   ```
   （`depends_on` 的 R1 已 closed，应当直接通过；被拒就贴 stderr 停下。）
3. **拉 coder**（fresh，pane A，cwd = RLT_21 树）：`herdr agent start coder ...` →
   `add --node X1 --event agent_launch --agent coder#1 --note "launch=devin swe-2-max permission-mode=normal cwd=RLT_21树 fresh实例 新空间新pane"`
   → `herdr agent wait coder --until idle` → `herdr agent prompt coder "<派活 prompt>"` → **核真提交**（第 11 条）。
   **`--permission-mode` 是 `normal`，不是 `dangerous`**：Devin 会弹审批菜单，由你按第 11 条的动态定位逐项答；
   **不选 bypass / 全放行**，也不替它降权限模式重拉。
4. **coder 派活 prompt**，首行必须是
   `[relay-light] worker · node=X1 · agent=coder#1 · workspace=docs/modules/relay-light/workspace/RLT_21`，
   正文照 adapter「派活 prompt 模板」，并把下面这些逐条写进去。**正文开头先写一句：
   「这是 X 阶段新节点新实例，R 阶段已收口；下面是全新派单，你的任务是返工 R1 打回的 5 条 P1」。**
   - **读（行号以现场为准，不凭记忆）**：RLT_21 树 `AGENTS.md`；本工作区 `review.requirement.md`
     **P1-1 / P1-2 全文（`:69-103`）**、`review.lesson.md` **P1-1~P1-3 全文（`:14-33`）**、`review.md`（尤其
     `:24` 路径表、`:38-44` 有效单测候选、`:102-112` miner 段）、`check.C1.md` 全文、`check.C2.md`、
     `task_plan.md`（含契约头三条与 `:38,41,77`）、`brief.md`、`findings.md`（**F-001~F-009 全文**）、
     `lesson_candidates.md`（**L-001~L-004 全文**）、`progress.md`（只读，不写）；
     RLT_12 树**只读**：`dispatch/monitor-W1.md`、`monitor-C1.md`、`monitor-C2.md`、`monitor-R1.md`
     （P1-3~P1-5 的证据行号都在里面）。
   - **五条 P1 的原文要求逐条写进 prompt**（把本派单第 1 条整段贴进去，不要只给编号）：
     - **P1-1 → 证据类**：把 C1 三条旧 P1（A137 fully-closed 强制 `ref=`、`stage_close` 对 blocked 精确报 A118、
       C1 原始 RED 证据）**逐项**写进 `findings.md` 的新条目，每项给出「由哪个 commit / 哪几个用例 / 哪条命令闭合」
       与**可复跑命令 + 自然终态尾部 + 退出码**；至少复跑
       `python -m unittest -v tools/relay-light/test_relay_log.py -k RelayStageResultRefTests` 与
       `-k "RelayNotRunRetryTests or RelayLaunchFixStatusTests or RelayLedgerSilenceTests"`。
       **不许改 `check.C1.md`、不许新建 `done.checker.C1.recheck.md`、不许自己宣布 CLOSED**——
       你只摆证据，裁决由 requirement 路作。
     - **P1-2 → 流程类**：**你不做代码轮自证、不做变异实验、不建 `review.code-round1.md`**（编排已裁决由
       requirement 路合并承担）。你这边只保证**整卡 diff 可审**：无半成品、无注释掉的测试、无未提交改动，
       并在小结里给出 `git diff --stat master...HEAD` 的结果。
     - **P1-3 / P1-4 / P1-5 → 文档类**：在 `lesson_candidates.md` 新增**三条独立候选**（编号顺着 L-004 往下排），
       每条写清**规则原文（按本派单第 1 条的引号内容冻结）+ 现场证据（文件:行号）+ 与 L-001~L-004 的去重理由**。
       **不许把三条并成一条**，也不许只写「已知晓」。
   - **允许路径闭集**（超出即停并发阻塞信号，不自行越界）：`tools/relay-light/relay_log.py`、
     `tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/**`、
     `docs/modules/relay-light/workspace/RLT_21/**`。**不碰 RLT_12 树任何文件**（那几份派单只读），
     不碰 DevPlan / `design/` / `AGENTS.md` / `tools/tests/` / 现役 Runner / 两侧用户级 skill 副本。
   - **`progress.md` 一个字都不许写**（A67，本节点无 scribe，无人有权写它）。
     **`review.*.md` / `check.C*.md` 一个字都不许改**（各有各的写入者）。
     你能写的只有：`findings.md`、`lesson_candidates.md`、自己的完成信号 `done.coder.X1.md`
     （以及万一真需要改代码时的闭集内代码文件）。
   - **本轮很可能零代码改动，这是正确结果**——但**回归护栏一条不许省**：
     `python -m unittest -v tools/relay-light/test_relay_log.py` 必须 **`Ran 181 tests` / `OK` / `skipped=0` / exit 0**
     （**贴命令全串 + 自然终态尾部 + 退出码**，对不上原样记录、不许粉饰）；
     `git diff --check` 三条（working tree / `master...HEAD` / `--cached`）；
     四集合允许路径自查（`git diff --name-only master...HEAD`、working tree、index、untracked）逐一贴出来。
     **若真动了代码，先写失败测试取 RED（命令 + 自然终态 + exit≠0）再动实现，GREEN 同样贴证据**——
     导入 / 路径 / fixture / 权限 / 解释器错误都不算有效 RED。
   - 进树第一个 Git 动作是 `git rebase master`；撞同 worktree 的 WIP 时按 `task_plan.md` 契约头 ② 的 DR-W-008 处置
     （`git merge-base` 核 HEAD 是否已含 master 顶点，成立即 no-op 记一行，**不强推、不清 WIP、不 `--autostash`**），
     判不出就发阻塞信号。
   - **持续在场**：每轮（每条 P1 收束）打**四行小结**——做了什么 / 证据（命令 + 退出码）/ 偏离与 findings / 下一步，
     缺项写「无」。收到整改指令就在同一实例里继续改，**不自己重启、不开新实例**。
   - 完成方式：在 RLT_21 树 commit（scope 用英文 `relay-light`，只打 `wt/RLT_21`，**逐个点名 `git add`，
     禁 `git add -A` / `git add .`**；**不 push、不建 PR、不合 master**）→ 打四行小结 → 写完成信号
     **`workspace/RLT_21/done.coder.X1.md`**（一行：
     `task=RLT_21 role=coder node=X1 status=DONE evidence=<commit SHA> next=monitor`；
     **文件名带 `.X1` 后缀，别覆盖 C 阶段的 `done.coder.md` / `done.coder.C2.md`**）→ 即停。
     relay-light 无 `node_closed`，worker 完成即停、不等下一节点、不碰 F1 的活。
5. **等 coder**：按第 11 条的**轮询**姿势（**不用 `herdr agent wait` 做长等**）。
6. **coder 交活后的完备性自查（`done` 之前，逐项打勾，缺一项就发整改回 coder 的 pane）**：
   - [ ] `findings.md` 有 P1-1 的新条目，C1 三条旧 P1 **逐项**有 commit / 用例 / 命令 / 退出码，且**没有自封 CLOSED**；
   - [ ] `lesson_candidates.md` 新增**恰好三条**独立候选，规则原文、证据行号、去重理由齐全，未合并、未改动 L-001~L-004；
   - [ ] `check.C1.md` / `check.C2.md` / `review.*.md` / `progress.md` **一个字都没被改**
         （`git diff --name-only` + `git log -1 --stat` 核一眼）；
   - [ ] 全量单测 `Ran 181 tests` / `OK` / `skipped=0` / exit 0 的**原始输出**在小结或 findings 里；
   - [ ] `git diff --check` 三条均 exit 0；四集合无越界项；
   - [ ] commit 只打 `wt/RLT_21`，未 push / 未建 PR / 未动 master；
   - [ ] `done.coder.X1.md` 在，格式完整且未覆盖旧信号；
   - [ ] 四行小结齐全，「本轮有无代码改动」如实写明。
   全部达标后才记：
   ```powershell
   add --node X1 --event done --agent coder#1 --note "5 条 P1 整改完成：P1-1 findings 摆证据 <n> 条；P1-2 整卡 diff 可审（代码轮归 requirement 路）；P1-3~P1-5 新增候选 L-005~L-007；全量 Ran 181 OK skipped=0；代码改动=<无|摘要>；commit=<sha>"
   ```
   **记完这一条，coder 就是终态，返工边关闭——记之前想清楚（第 3 条）。**
7. **拉两路复核（并行，fresh，`on:done:coder` 此刻才命中）**：
   ```powershell
   add --node X1 --event agent_launch --agent requirement#1 --note "launch=codex gpt-5.6-sol reasoning=medium sandbox=workspace-write cwd=RLT_21树 fresh实例 新pane"
   add --node X1 --event agent_launch --agent lesson#1      --note "launch=codex gpt-5.6-sol reasoning=medium sandbox=workspace-write cwd=RLT_21树 fresh实例 新pane"
   ```
   两条都落账、两个 prompt 都发出去（各自 `wait --until idle` → `prompt` → **核真提交**）之后再统一等。
   **不要串行**——trigger 只约束「在 coder done 之后」，两路之间是并行的。
   **一路的报告不许拿给另一路当输入**（污染独立性）；两份报告的分歧由你如实带进 `stage_result` 的 note，不做裁判。

   - **requirement 派活 prompt**，首行
     `[relay-light] worker · node=X1 · agent=requirement#1 · workspace=docs/modules/relay-light/workspace/RLT_21`：
     - **只写一个文件**：**「你只准写 `docs/modules/relay-light/workspace/RLT_21/review.requirement.X1.md`；
       除它之外不新建、不修改、不删除任何文件，不 commit、不跑任何 git 写操作，不改代码、不改测试、
       不改 `task_plan.md` / `brief.md` / `findings.md` / `lesson_candidates.md` / `progress.md` /
       `review.md` / `review.requirement.md` / `check.C*.md`」**
       （沙箱给的是 `workspace-write`，只读靠这句约束承担，DR-W-001）。
     - **你是 fresh、非施工者的独立复核者**，R1 的 `review.requirement.md` 是**另一个实例**写的，
       你可以读它当输入，但**结论要自己复跑、自己下**。
     - **三项职责，缺一不可，各写成独立小节**：
       ① **P1-1 的 durable 裁决**——独立复审 A137~A140 增量，逐项给出 C1 三条旧 P1 的 **CLOSED / OPEN**
       与本路最终 PASS / FAIL；复跑原文指定的三组命令（`-k RelayStageResultRefTests`、
       `-k "RelayNotRunRetryTests or RelayLaunchFixStatusTests or RelayLedgerSilenceTests"`、全量）；
       **不改 `check.C1.md`，裁决写在你自己的报告里**；并核 coder 摆的证据是否成立、有无自封 CLOSED。
       ② **代码轮职责（编排裁决的合并口径，必须在报告里写明这句话）**——只读整卡 diff
       （`git diff master...HEAD`）与实现行为，审 `ref=` / `launch_fix` / 模式门 / `cancelled` 归属闸 /
       status 输出合同 / allowed-paths；**至少选 `review.md:38-44` 的一个有效单测变异点做实验**，
       登记「变异后目标断言红、恢复后全绿」的命令、自然终态与退出码——**实验后必须把文件恢复原状并复跑全量确认全绿**，
       且**恢复动作不算违反「只写一个文件」，但收尾时 `git status --porcelain` 必须干净**。
       ③ **P1-3~P1-5 的三条新候选是否真落地**（只判在不在、规则原文对不对，深度判定归 lesson 路，别抢）。
     - **复跑要求**：oracle 与测试由你本机重跑，不采信别人贴的结果——至少跑
       `python -m unittest -v tools/relay-light/test_relay_log.py`（期望 `Ran 181 tests` / `OK` / `skipped=0` / exit 0），
       对不上就是发现；结构检查类给出你自己跑的 grep 命令与命中行。
       另跑四集合允许路径检查与 `git diff --check`。
     - **遗留 P2 不许顺手改**：F-009 / A143 的口径分歧（P2-1）、A140 终态提示范围（P2-2）、两路三路术语（P2-3）
       **只复述、不裁决、不改 oracle、不改期望数字**——收口责任在用户，由编排提交。
     - **结论格式（写死）**：`PASS` / `FAIL` + **P1（阻断）/ P2（不阻断）** 分级；每条 P1 给可执行整改动作
       （改哪个文件、改成什么、用什么命令验证）；每条发现挂一条可复跑命令或可定位的 `文件:行号`。
       **不许把口径分歧写成 P1 来凑数，也不许为收工把缺口降成 P2。**
     - 完成方式：写完 `review.requirement.X1.md` → 四行小结 → 写
       **`workspace/RLT_21/done.requirement.X1.md`**（一行：
       `task=RLT_21 role=reviewer route=requirement node=X1 status=<PASS|FAIL> p1=<n> p2=<n> evidence=review.requirement.X1.md next=monitor`）
       → 即停。**不 commit、不碰别人的文件、不等下一节点。**

   - **lesson 派活 prompt**，首行
     `[relay-light] worker · node=X1 · agent=lesson#1 · workspace=docs/modules/relay-light/workspace/RLT_21`：
     - **只写一个文件**：**「你只准写 `docs/modules/relay-light/workspace/RLT_21/review.lesson.X1.md`；
       除它之外不新建、不修改、不删除任何文件，不 commit、不跑任何 git 写操作」**——
       **特别是不许改 `lesson_candidates.md`**（那是 coder 的登记位，A67 写入者边界；你要补的写进自己的报告）。
     - **审查面 = R1 lesson 路那三条 P1 是否真被收全、收对**：逐条核新候选
       ① 规则原文是否冻结到位（照 `review.lesson.md:19,26,33` 的引号内容比对，弱化 / 含糊即为未闭合）；
       ② 证据是否挂了可定位的 `文件:行号`；③ 与 L-001~L-004 的去重理由是否成立、有没有被合并成一条；
       ④ L-001~L-004 原有四条**有没有被改动或删除**（改了就是 P1）。
     - **另核一遍漏网点**：`findings.md` / `progress.md` / 本轮 commit message 里还有没有
       **只记在 commit message 或终端、没进任何登记位**的事实（同族老毛病，专门搜一遍）。
     - **F-009 / L-004 的 P2 边界保持**：R1 lesson 路已判它「到点、非 P1」，**不许翻案、不许改 oracle**。
     - **没有新候选也要形成可核查的 N/A 结论**，不许留空。
     - **结论格式与 requirement 路一致**：`PASS` / `FAIL` + P1 / P2 分级，FAIL 的 P1 给可执行整改动作，
       每条发现挂可定位证据。
     - 完成方式：写完 `review.lesson.X1.md` → 四行小结 → 写 **`workspace/RLT_21/done.lesson.X1.md`**
       （`task=RLT_21 role=reviewer route=lesson node=X1 status=<PASS|FAIL> p1=<n> p2=<n> evidence=review.lesson.X1.md next=monitor`）
       → 即停。
8. **等两路并收产出**（轮询，见第 11 条）。两路各自结束后**先自己读产出判合格**：
   报告在不在、有没有 `PASS`/`FAIL` 与 P1/P2 分级、每条 P1 有没有可执行整改动作、
   **requirement 路有没有写明「代码轮职责系编排裁决的合并口径」并给出 P1-1 的逐项 CLOSED/OPEN 与变异实验**、
   **lesson 路有没有逐条核三条新候选**、`done.<路>.X1.md` 在不在。
   **另跑一次越界检查**：在 RLT_21 树 `git status --porcelain`，确认该路只动了自己那一个文件（+ 自己的完成信号）。
   不合格就发整改回它自己的 pane（**同一 live 实例，整改往返不需要账本事件，不新增 attempt、不新增 `agent_launch`**）。
   合格后按第 3 条的纪律记 `done`：
   ```powershell
   add --node X1 --event done --agent requirement#1 --note "review.requirement.X1.md <PASS|FAIL> p1=<n> p2=<n>；P1-1 durable 裁决=<CLOSED n 条/OPEN n 条>；代码轮合并口径已写明；变异点=<一句话>"
   add --node X1 --event done --agent lesson#1      --note "review.lesson.X1.md <PASS|FAIL> p1=<n> p2=<n>；三条新候选=<全部成立|缺 n 条>；L-001~L-004 未被改动"
   ```
   **FAIL 时先把 `checkpoint` 落完再记 `done`**（第 3 条第 3 点）：
   ```powershell
   add --node X1 --event checkpoint --agent <该路>#1 --note "routed_to=orchestrator P1-<编号> 第 2 轮上限已到，需用户裁决：<一句话>"
   ```
9. **止损与轮数（写死，不许自行放宽）**
   - `limits.rework_max_rounds=2`（`dh-mapping.toml`）。**X1 就是第 1 轮返工**；
     `lint` 的 A97 只放行 `RLT_21:X#k` 中 `k ≤ 2`。
   - **同一条 P1 在 coder 仍 live 时往返 3 轮仍不收敛** → 按第 10 条拉 decider 裁决，**别死循环**。
   - **两路复核之后仍有 P1** → **这就是第 2 轮上限的触发条件**：
     **你不拉第二个 coder、不追加 X2 节点行、不写 `plan_amend`、不自行开 `RLT_21:X#2`**。
     走法是：`checkpoint`（routed_to=orchestrator，每条 P1 一行）→ 两路 `done` → `node_close X1` →
     **`stage_result outcome=blocked`** → 打印 `MONITOR_DONE stage=X1 outcome=blocked` 停，交编排交用户裁决。
   - **coder 已 `done` 之后不存在节点内返工路径**（A49 / A60）。这是第 3 条硬闸的必然后果，不是可以变通的地方；
     **不许用 `agent_lost` 去「洗掉」一个已 `done` 的 coder 来重拉**——那是伪造现场，校验也会拒。
10. **施工性 `blocked` → decider 链**（trigger `on:blocked`，**只在 coder 仍 live 时走**；
    环境起不来那类走第 12 条的异常出口）：
    - `add --node X1 --event blocked --agent coder#1 --note "<卡点一句话>"`；
    - `add --node X1 --event escalate --agent coder#1 --note "decider=decider#1 <一句话>"`
      ——**note 恰含一个 helper token `decider=decider#1`**，缺一 / 多一 / 不符即拒（A69）；
    - **新 pane** 拉 decider（cwd = RLT_21 树；`herdr pane split` **显式传目标 pane，不用 `--current`**）：
      `herdr agent start decider --kind codex --pane <新 pane> -- -m gpt-6-astra --sandbox workspace-write`，
      `add --node X1 --event agent_launch --agent decider#1 --note "launch=codex gpt-6-astra sandbox=workspace-write cwd=RLT_21树"`；
    - decider 派活 prompt 标头 `agent=decider#1`，正文写死：**「你只准写一个文件：
      `docs/modules/relay-light/workspace/RLT_21/decision.1.md`；不改任何其它文件、不 commit、不跑 git 写操作、不动代码」**
      （**文件名是 `decision.1.md`**——计划 agent 表冻结值，不自行改号；
      **若该文件已存在**说明别处已占号，停下按第 12 条报编排，不要覆盖别人的决策件）；
      输入 = 卡点描述 + `task_plan.md` + 相关 P1 原文 + 相关验收条款；产出 = 可执行方案（保持在 allowed-paths 内）；
      写完 **`done.decider.X1.md`** 即停；
    - `add --node X1 --event decision --agent coder#1 --note "decider=decider#1 <方案一句话>"`（**复述同一 helper**）→
      `add --node X1 --event done --agent decider#1 --note "<方案摘要>"` →
      `add --node X1 --event resume --agent coder#1 --note "<回到哪一步>"`；
    - **`decision_mode=auto`，中间不写 `user_decision`**（写了即拒 A114）。方案送回**同一个 coder 实例**，
      后续往返用 `checkpoint`，不新增 attempt、不新增 `agent_launch`。
    - **coder 已 `done` 之后不要再走 decider 链**：那时唯一的合法出口是第 9 条的 `outcome=blocked` 交用户。
11. **等待、真提交与审批菜单（承接 Windows 预演与 C / R 阶段实战，逐条落地）**
    - **等待一律轮询，不用 `herdr agent wait` 做长等**：监工侧 `wait` 会间歇 `PermissionDenied`（Os code 5）。
      **一轮 ≈ 9 分钟**：每 30 秒对**每个在跑的 agent** 各跑一次 `herdr agent get <名>` +
      `herdr agent read <名> --tail <n>`，看 `status` / `state_change_seq` / pane 末行是否在动；
      一轮跑满还没出结果，**直接进下一轮，不要结束回合空等**。
      （`herdr agent wait <名> --until idle` 这种**拉起前的短等**仍可用，抖动了就退避重试。）
    - **`Os code 5` / `PermissionDenied` 是工具抖动，不是失联**：退避 5~10 秒重试同一条命令，
      **连续 3 次同一命令都失败**才按第 12 条当异常处理。**不要把工具抖动记成 `agent_lost`。**
    - **真提交核验（DR-W-003，Windows 约 75% 命中）**：`herdr agent prompt` 发出后必须核真提交——
      `herdr agent get <名>` 看 `state_change_seq` 变化且 `status` 转 `working`；停在输入框
      （seq 不动 / `agent_prompt_stalled`）就补 `herdr agent send-keys <名> enter` 再复验；
      终极判据 = `herdr agent read` 看输入框已清空。输入通道整体冻结则该实例弃用，
      按第 12 条 `agent_lost` 在同 pane 拉 fresh 实例。
    - **审批菜单编号不得按固定数字（C 阶段实测踩过，正是 P1-4 的教训本身）**：Devin 与 codex 的审批菜单
      **编号随选项数量变化**。每次都要：① `herdr agent read <名>` 读**菜单原文** → ② 找**写着
      「Yes (Approve once)」那一行**的编号 → ③ `herdr agent send-keys <名> <该编号>` → ④ 再 `read` 一次确认菜单已消失。
      **绝不选 bypass / 全放行、`Edit command`、`Describe change`、`No`**，也不替它降 `--permission-mode` 重拉。
    - **显式钉模型档（DR-W-007）**：任何 codex 启动串都要带 `-m`，裸启会跑成账号默认模型。
    - **复核 / 决策角色一律 `workspace-write`（DR-W-001）**：`--sandbox read-only` 在 Windows 能读但拒写一切文件，
      产出落不了盘等同失联。「只读」由 prompt 约束承担。
12. **异常出口**（照现行校验，别发明新写法）：
    - **静默超时**：worker 状态 `working` 但 pane 输出 **>20 分钟无变化** →
      `add --node X1 --event agent_lost --agent <名>#<n> --note "silence>20min"` → **同一个 pane** 关掉重拉 `#n+1`
      （`agent_launch` 的 attempt 必须恰为当前最大值 + 1），`attempt_max=3`。
    - **环境性 NOT_RUN**（起不来 / 沙箱拒写 / 输入通道冻结）：合法出口是 **`blocked` → `agent_lost` → 重拉**
      （DR-W-002 实证）。**不要写 `escalate --agent monitor#4 --note "decider=monitor#4 ..."`**——
      A69 只认 `decider=<名>#<n>` 或 `strategist=<名>#<n>` 恰一个 helper token，**监工不是合法 helper**，写了必被拒。
      换档重拉时把事实写进 `agent_launch` 的 note（`launch_fix=<新档>`），**不要 `plan_amend`**
      （你这一侧跑的旧版账本里 `launch_fix=` 仍只是 note 文本、lint 不校验——计划注释 8 的已知缺口）。
    - **attempt_max 用尽仍 NOT_RUN**：按计划注释 5 由你拉 `strategist#1`
      （`codex -m gpt-5.6-terra -c model_reasoning_effort=high --sandbox workspace-write`），走 SKILL 的 strategist 链：
      `escalate`（记在卡住的那个 worker 名下，note 恰含 `strategist=strategist#1`）→ `agent_launch strategist#1`
      → `decision`（worker 名下，复述同一 helper）→ `done strategist#1` → **停在 `user_decision` 人闸**，
      按第 13 条交编排，不要自己代答。
    - 任何 `add` 退出 2 / 3：**stderr 原样贴到终端并停下，不要绕过校验、不要改参数硬凑。**
13. **关节点与收尾**（顺序固定，`outcome` 取值看清楚）：
    - **关节点**：双判据成立（**本节点 `agent_launch` 过的每个实例都已终态**，A17；
      且 `close` 列的 **requirement 已 `done`**，A74）后
      ```powershell
      add --node X1 --event node_close --agent monitor#4 --note "coder#1/requirement#1/lesson#1 均 done；5 条 P1 处置=<逐条一句话>；requirement=<PASS|FAIL> p1=<n> lesson=<PASS|FAIL> p1=<n>；commit=<sha>"
      ```
      **复核报 FAIL 不阻止关 X1**（`close=agent:requirement` 只看 `done`）——FAIL 的去向由 `stage_result` 承载。
    - **`stage_result`**：`RLT_21:X#1` 只有 X1 一个节点，关掉即满足 A112。**账本只认四个 outcome**
      （`done` / `blocked` / `failed` / `cancelled`，`relay_log.py` 的 `STAGE_RESULT_OUTCOMES`）——
      **没有 `rework` 这个值，写了直接退 2**。按下表取值：

      | 现场 | outcome | 编排读到的 `suggested_action` | 含义 |
      |---|---|---|---|
      | 两路复核都 **PASS、零 P1** | `done` | `open_next_stage` | 返工闭合，编排开 F 阶段 |
      | 两路里**任一路仍有 P1** | `blocked` | `wait_user` | **第 2 轮上限已到**，停在人闸交编排交用户裁决，**不自行开 X2** |
      | **X 阶段本身没跑成**（worker 起不来 / 节点关不掉 / 产出缺失） | `failed` | `relaunch_monitor` | 重拉监工重跑本阶段实例，**不是**开 X2 |
      | 用户明文取消 | `cancelled` | — | note 必须引用 `user_decision`（A118）；**本轮不该出现** |

      ```powershell
      python tools/relay-light/relay_log.py add --plan docs/modules/relay-light/relay/rlt12-win-01 --node X1 --event stage_result --agent monitor#4 --note "stage_id=RLT_21:X#1 outcome=<done|blocked|failed> requirement=<PASS|FAIL> p1=<n> lesson=<PASS|FAIL> p1=<n> 全量单测 Ran 181 OK skipped=0；P1-1 durable 裁决=<一句话>；P1-2 代码轮合并口径=<一句话>；P1-3~P1-5 新候选=<L-005~L-007 成立|缺 n 条>；遗留 P2=F-009/A143 口径分歧待用户二选一；<未闭合项=…|无>；commit=<sha>" --config-dir ~/.claude/skills/relay-light/
      ```
      被拒就贴 stderr 停下，**不要硬凑、不要改 outcome 蒙混**。
    - 落账后**即停**，终端打印 **`MONITOR_DONE stage=X1 outcome=<done|blocked|failed>`**，并把交接事实一次说清：
      五条 P1 **逐条**的处置与结论、两路复核的 P1/P2 计数、**P1-1 的 CLOSED/OPEN 逐项裁决**、
      **P1-2 变异实验的命令与结果**、新增候选编号、`Ran <n> tests` 与 `skipped=<n>`、
      `git diff --check` 与四集合结果、commit SHA、**遗留 P2（F-009/A143 待用户二选一）**、
      以及**需要用户裁决的清单（逐条）**。
    - **不写 `stage_close`**（编排的事），**不关终端空间、不关 worker pane**（编排统一收；F1 可能还要用）。
    - **不追加 X2 节点、不写 `plan_amend`、不改 `relay_plan.md`**——计划已由编排追加完毕并 `lint: ok`。
    - 节点走不下去、而 X1 又还没关时：按 SKILL 该写 `stage_result outcome=blocked`，
      但现行实现会被 A112 拒（节点未关）——**照写一次，把退出码与 stderr 原样留在终端当作 A137 缺口的现场证据**，
      **不要绕过校验、不要为了让它过去硬关节点**；随后打印
      `MONITOR_BLOCKED stage=X1 reason=<一句话>` 并停，交编排定夺，同时保留可复现的证据（命令、退出码、stderr 原文）。

## 派单纪律（逐条落地）

- **`done` 压到判定之后（C1 的教训 + 本节点的硬闸）**：见第 3 条，这是本节点的**第一纪律**。
- **整改路由挂 live agent（DR-W-004）**：`checkpoint` 只能挂在**还活着**的实例名下；给终态 agent 挂事件必被 A60 拒。
- **两路复核必须 fresh、必须并行**：fresh 的理由是「施工者不得复核自己、复核者之间不得互相背书」；
  并行的理由是两行 trigger 相同、彼此无依赖。一路的报告**不许拿给另一路当输入**。
- **完成信号一律带 `.X1` 后缀**：`done.coder.X1.md` / `done.requirement.X1.md` / `done.lesson.X1.md`
  （decider 走时是 `done.decider.X1.md`）。**不许覆盖 C / R 阶段的同名信号文件**，
  也**不许往 `progress.md` 追加完成信号**——本节点无 scribe，`progress.md` 无人有权写（A67）。
- **记账不漏、不自造**：每一次拉起与每一个终态都要落账本，事件名只用 SKILL 词表里的
  （`agent_launch` / `checkpoint` / `blocked` / `escalate` / `decision` / `user_decision` / `resume` /
  `done` / `agent_lost` / `cancelled` + 控制事件 `node_start` / `node_close` / `stage_result` / `monitor_restart`），
  不要发明 `monitor_helper`、`relaunch`、`retry` 之类新词。
- **只拉本节点的 agent**：X1 只有 coder / requirement / lesson / decider 四行（加按需的 strategist）。
  **不拉 checker、不拉 scribe**（本节点没有这两行）；**F1 的 scribe 不准提前拉**；
  也不回头给 W / C / R 阶段的终态 agent 补事件。

## 硬边界

- 不 `push`、不建 PR、不合并、不动 `master`；commit 只打 `wt/RLT_21`，且只有 coder 这一次提交。
- **不改 RLT_12 树除账本以外的任何文件**——`relay_plan.md`、`dispatch/`、开发方案都不动。
- 不改 `docs/modules/relay-light/design/`（禁区），不改验收 ID，不改 `task_plan.md` / `brief.md` 的验收编号与切法，
  **不改 oracle**（F-009 / A143 的分歧由用户裁决，谁都不许顺手把期望数字改掉）。
- **不回头改 W / C / R 阶段的账本行，不改 `check.C1.md` / `check.C2.md` / `review.plan.md` /
  `review.requirement.md` / `review.lesson.md` / `review.md`**——都是已关闭的既成事实。
- **不写 `progress.md`**（本节点无 scribe，无合法写入者）。
- 不碰 dh-relay 模块的 `knowledge/**`、`tools/tests/`、现役 Runner、两侧用户级 skill 副本。
- 不跑 `install_skill.py`、不做双侧 skill 重同步（须用户当次明确授权，且不在 X 阶段）。
- 凭据 / 密钥值永不进 prompt、note、工件、账本；证据先按白名单过滤（A27）。
- 不越权替用户裁决；不自授权超限继续；不为「有纠偏可展示」制造假问题，也不为收工把 FAIL 记成 PASS。

## 授权记录

用户 2026-09-14 已授权：RLT_12 D-start（Issue #23，树 `wt/RLT_12`）；本计划 `rlt12-win-01` 的计划内业务卡 =
RLT_21（Issue #21，施工树 `wt/RLT_21`）；各节点的委托按计划 agent 表的默认档位执行，不逐个再问；
接受 A112 / NOT_RUN 已知缺口（迁移表下无 `blocked` 终态 agent，环境性 NOT_RUN 走 `blocked → agent_lost` 重拉，
`launch_fix=` 仅为 note 文本不受 lint 校验；`stage_result` 对所有 outcome 都要求节点全关），
并冻结该口径为本次运行的证据基线。

编排 2026-09-15 追加裁决（沿用 R 阶段三条并新增四条）：
① C1 在 checker FAIL p1=3 下如实关闭、三条 P1 由 C2 承接返工，C2 已复审 PASS；
② R 阶段按 `dh-mapping.toml` 的 `[recipes.normal]` **两路**跑，口径分歧由 requirement 路给结论；
③ 复核角色一律 fresh 实例、一律 `workspace-write`，只读由 prompt 承担；
④ **X1 的 requirement 路一并承担 normal 整体的代码轮 1 职责**（P1-2 的落地口径），不新开第三路、不建
`review.code-round1.md`，报告里须写明这是编排裁决的合并口径；
⑤ **P1-1 的 durable 复审裁决由 X1 的 requirement 路作出并写在 `review.requirement.X1.md`**，
`check.C1.md` 保持不动（X1 无 checker 实例，无合法写入者）；
⑥ **X1 无 scribe**，`progress.md` 本节点不更新，过程账由 `stage_result` note 与监工交接摘要承载，F1 一并补；
⑦ **X1 是返工第 1 轮**，两路复核之后仍有 P1 即触发 `rework_max_rounds=2` 上限，
须 `stage_result outcome=blocked` 交用户裁决，**监工不得自行开 `RLT_21:X#2`**。
