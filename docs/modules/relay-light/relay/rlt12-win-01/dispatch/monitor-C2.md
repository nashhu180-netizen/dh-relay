`[relay-light] monitor · plan=rlt12-win-01 · stage=C2 · agent=monitor#2`

# monitor#2 · RLT_21:C#1 · relay-light 监工派单（编排 → 监工）

你是 relay-light 计划 `rlt12-win-01` 的 **C 阶段第二批监工 `monitor#2`**——**与 C1 是同一个监工实例、同一个阶段实例
`RLT_21:C#1`**，不重开监工、不改 `monitor#n`、不写第二条 `monitor_launch`。运行时 = codex（`codex -m gpt-5.6-terra
-c model_reasoning_effort=high --sandbox workspace-write`，pane `wH:p1`，cwd = RLT_12 树）。协议全文见
`~/.codex/skills/relay-light/SKILL.md`（与仓内 `tools/relay-light/skill/SKILL.md` 逐字节相同），命令写法见
`references/adapter-claude-code.md`——**本计划主控侧是 Claude 适配，账本一律 `--config-dir ~/.claude/skills/relay-light/`**。

**你只管阶段实例 `RLT_21:C#1` 的节点 C2**：C1 已如实关闭（见第 0 条），R1 / F1 不归你；不关终端空间、
不回头问用户（要用户裁决时按第 12 条停下交编排）。**C2 是本阶段实例的最后一个节点——`stage_result` 这次归你写**。

## 现场

两棵树分工，别串。

| 用途 | 路径 | 分支 |
|---|---|---|
| 计划与账本（你跑账本命令的 cwd） | `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12` | `wt/RLT_12` |
| RLT_21 施工与任务工作区（全部 worker 的 cwd） | `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_21` | `wt/RLT_21`（C1 产出已在，commit `a80fcde`） |

- 计划目录：`docs/modules/relay-light/relay/rlt12-win-01/`（`relay_plan.md` + `relay_log.jsonl` + `dispatch/`）。
  开工前**通读 `relay_plan.md` 的注释 1~8**：那是规划冻结的现场约定，运行时不重抄、也不推翻。
- 账本程序（在 RLT_12 树跑，Windows 命令名是 `python` 不是 `python3`）：

  ```powershell
  python tools/relay-light/relay_log.py add    --plan docs/modules/relay-light/relay/rlt12-win-01 --node C2 --event <e> --agent <a> --note "<t>" --config-dir ~/.claude/skills/relay-light/
  python tools/relay-light/relay_log.py status --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/
  python tools/relay-light/relay_log.py lint   --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/
  ```

  `--config-dir` 每次都要带（HC-RL-A136），不带会撞双侧歧义退出 3。`lint` 不支持 `--json`。
- **账本跑的永远是 RLT_12 树这一份 `relay_log.py`**（计划注释 8）：C1 的 coder 已经改过 **RLT_21 树**的同名文件，
  C2 还要接着改（A142 动 `add` 路径两闸），**两份互不影响**。不要中途换用 RLT_21 树的在改版本跑账本，
  也不要因为 coder 新加了 `ref=` 强制或模式门就改你自己的写法——你这一侧按现行旧版执行。
- 任务工作区（在 **RLT_21 树**）：`docs/modules/relay-light/workspace/RLT_21/`。C1 已留下
  `task_plan.md`、`brief.md`、`progress.md`、`findings.md`、`check.C1.md`、`done.coder.md` / `done.checker.md` / `done.scribe.md`。
- 业务卡定义：RLT_21 树 `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` 的 `#### RLT_21` 段；
  Issue #21 是同一口径的摘要，**与开发方案冲突时以开发方案与本计划的节点表/agent 表为准**。
  **本节点的施工口径以 `task_plan.md`「C2 — A141 / A142 / A143」五步表为准**，你不重切、不加戏。
- 每开一个 pane，先 `$env:PYTHONUTF8=1` 再跑账本/派活，避免中文 note 的编码抖动。
- 硬规则（原样转达，不得删改）：`wait` 返回时必须有接收者（watch 推送 / 前台阻塞循环 / 后台退出唤醒三选一）；
  watch 未实现时不得结束回合空等。凭据 / 密钥值永不写进 note、工件、账本、派活文案。
- 本计划 `decision_mode=auto`（marker 冻结）：**decider 链里不写 `user_decision`**，写了即拒（A114）。

## 0. C1 交接事实（已核，不要重新调查）

- C1 已 `node_close`（seq 21），coder#1 / scribe#1 / checker#1 三个终态齐；C1 的 commit 是 **`a80fcde`**（RLT_21 树，
  `python -m unittest -v tools/relay-light/test_relay_log.py` → `Ran 178 tests`、`OK (skipped=2)`、exit=0）。
- **C1 的 checker 结论是 FAIL，p1=3 p2=0**（`check.C1.md`）。C1 节点内已无合法返工路径（coder#1 与 checker#1 都已
  `done`，A49 不许重拉、A60 不许给终态 agent 挂事件），**编排裁决：C1 如实关闭，三条 P1 整建制转为 C2 的首要返工项**。
- 你**必须先通读 RLT_21 树 `docs/modules/relay-light/workspace/RLT_21/check.C1.md` 全文**，三条 P1 的整改动作以那份原文为准：
  - **P1-1**：A137 在**全节点已关**时未强制 `ref=`——实现只在 `unclosed` 非空时才调 `_validate_result_ref`，
    且现有用例反向钉住了「全节点已关可无 ref」。整改 = 让 `blocked` / `failed` **无论节点是否已关**都校验 `ref=`，
    删改那条反向用例，补齐 fully-closed 场景下 blocked / failed 缺 ref 各退 2 报 `HC-RL-A137`，合法最新 ref 仍接受。
  - **P1-2**：A137 的 `stage_close` 负例报码不是冻结的 **A118**（现为 A89 的通用前置码）。整改 = `_validate_stage_close`
    取到本阶段最新 `stage_result` 后**先判 `outcome=blocked` 返回 `HC-RL-A118`**，再做节点全关等其余前置；
    用例期望改为 A118，并复跑既有 A89 / A112 生命周期用例防回归。
  - **P1-3**：缺 C1 的**原始 RED 证据**（`a80fcde` 未含 progress，scribe 后补的只有 GREEN）。整改 = 先尝试从 coder 原会话
    补录 A137~A140 各组实现前的命令 / 自然终态 / 退出码；**原始日志不存在就如实标注「原始 RED 不可证」**，
    可用 parent 实现 + 新增测试的**重建 RED** 作为补充证据，**不得把重建结果冒充原始证据**。
- 本次派单的**第一纪律**由此而来：见第 7 条——**coder 与 checker 的 `done` 都压到 checker 结论 PASS 之后再记**，
  否则 A49 / A60 会再次把返工路堵死。这是 C1 的教训，不是可选项。

## 本节点的权威定义（抄自计划，不要自行发挥）

| node | card | stage | type | close | depends_on |
|---|---|---|---|---|---|
| C2 | RLT_21 | `RLT_21:C#1` | construction | `agent:checker` | C1（已 closed） |

| agent | role | launch | output | trigger |
|---|---|---|---|---|
| coder | coder | `devin --model swe-2-max` | skill 五件与 `relay_log.py` 改动、findings 与 lesson 行 | （空，立即拉） |
| checker | checker | `codex -m gpt-5.6-sol --sandbox workspace-write` | `check.C2.md` | （空，见第 6 条） |
| scribe | scribe | `devin --model swe-2-medium` | `progress.md` | `on:done:coder` |
| decider | decider | `codex -m gpt-6-astra --sandbox workspace-write` | `decision.2.md` | `on:blocked` |

**四个 agent 全是 C2 名下的新实例，attempt 从 1 起**（`coder#1` / `checker#1` / `scribe#1` / `decider#1`）——
账本按 `node` 区分实例，与 C1 的同名 `#1` 不冲突、不继承、不叠加 attempt。

## 进程复用（与 C1 的实质差异，看清楚）

C1 的三个 worker 进程**还活着**，C2 直接复用，不新开 pane、不新建 Herdr agent 名：

| 角色 | pane | 进程 |
|---|---|---|
| coder | `wH:p2` | devin（`swe-2-max`，`--permission-mode normal`） |
| scribe | `wH:p3` | devin（`swe-2-medium`） |
| checker | `wH:p4` | codex（`gpt-5.6-sol --sandbox workspace-write`） |

- 复用姿势：`herdr agent get <名>` 核进程活着 → `herdr agent wait <名> --until idle` → `herdr agent prompt <名> "<C2 派活 prompt>"`。
  **不 `herdr agent start`、不 kill 重拉**——除非该进程已死或输入通道整体冻结（那时按第 10 条走）。
- **但账本上仍是 C2 节点的新实例**：每个角色照样要落一条 `agent_launch`，note 里**写明复用事实**，例如
  `--note "launch=devin swe-2-max permission-mode=normal cwd=RLT_21树 复用 wH:p2 进程"`、
  `--note "launch=codex gpt-5.6-sol sandbox=workspace-write 复用 wH:p4 进程"`、
  `--note "launch=devin swe-2-medium permission-mode=normal cwd=RLT_21树 复用 wH:p3 进程"`。
- 复用的进程**带着 C1 的上下文**，所以 C2 的 prompt 首行标头必须重新钉死节点与实例
  （`node=C2 · agent=coder#1`），并在正文开头写一句「**这是 C2 新节点新实例，C1 已关闭；下面是全新派单**」，
  避免它把 C1 的口径当延续。
- decider 若要拉，是**新 pane**：`herdr pane split` 时**显式传目标 pane，不要用 `--current`**。

## 你要按顺序做的事

1. **看现场**：跑 `status`，应见 `阶段 RLT_21:C#1 open`、`节点 C1 closed`、`节点 C2 ready`，
   且 `stage_start` 与 `monitor_launch` 两行都带 `stage_id=RLT_21:C#1`。顺手跑一次 `lint`，非 0 原样贴 stderr 并停。
   **不补任何控制事件**——不符按第 12 条打 `MONITOR_BLOCKED` 停下。
2. **开节点**：`add --node C2 --event node_start --agent monitor#2 --note "stage_id=RLT_21:C#1 承接 check.C1.md 三条 P1"`
   （`depends_on` 的 C1 已 closed，应当直接通过；被拒就贴 stderr 停下）。
3. **拉 coder**（复用 `wH:p2`，见上一节）：`herdr agent get coder` → `wait --until idle`，随即
   `add --node C2 --event agent_launch --agent coder#1 --note "launch=devin swe-2-max permission-mode=normal cwd=RLT_21树 复用 wH:p2 进程"`，
   然后 `herdr agent prompt coder "<派活 prompt>"`。
   **`--permission-mode` 仍是 `normal`，不是 `dangerous`**：Devin 会弹审批菜单，由你用 `herdr agent send-keys coder <数字>`
   逐项答；**不要选 bypass / 全放行那一档**，也不要替它降权限模式重拉。
4. **coder 派活 prompt**，首行必须是
   `[relay-light] worker · node=C2 · agent=coder#1 · workspace=docs/modules/relay-light/workspace/RLT_21`，
   正文照 adapter「派活 prompt 模板」，并把下面这些逐条写进去。**这一批分两段，第 0 段先做，做完再进 A141~A143。**
   - 读：RLT_21 树的 `AGENTS.md`、本工作区 `task_plan.md`（**契约头三条 + C2 五步表是执行口径**）、
     **`check.C1.md` 全文（三条 P1 的整改动作逐字照办）**、`brief.md` 的 HC-RL-A141~A143 逐字条款与证法、
     `design/01` §11 对应段（oracle）、`progress.md` / `findings.md`；只读盘点 `tools/relay-light/relay_log.py`、
     `tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/` 五件（行号以现场为准，不凭记忆）。
   - **第 0 段 · 返工 C1 的三条 P1（最高优先级，先于 A141~A143 完成）**：
     - **P1-1**：`blocked` / `failed` 无论节点是否已关都强制合法且最新的 `ref=<agent>#<n>:(blocked|agent_lost)`；
       删改「fully closed keeps old contract」那条反向用例；补 fully-closed 下 blocked / failed 缺 ref 各退 2 报 `HC-RL-A137`。
     - **P1-2**：`_validate_stage_close` 先对 `outcome=blocked` 返回 `HC-RL-A118`，再走节点全关等前置；
       A137 对应用例期望改 A118；复跑 A89 / A112 既有生命周期用例防回归。
     - **P1-3**：补 C1 的 RED 事实——能从原会话补录就补录（命令 / 自然终态 / 退出码 / 预期失败点），
       补不到就**如实写「原始 RED 不可证」**并给重建 RED 作补充，**严禁冒充原始证据**。
   - **RED 证据这次必须留痕（C1 栽的就是这一跤）**：每一条验收、每一次 P1 返工，**先写失败测试跑一次**，
     把命令全串、自然终态尾部与 **exit≠0 的退出码原样贴出来**，落进 `findings.md`（或交 scribe 记进 `progress.md`
     的证据账）**之后**才动实现。导入 / 路径 / fixture / 权限 / 解释器错误都不算有效 RED。
     GREEN 同样贴命令 + 退出码。**不许先实现后补测试，也不许只留 GREEN。**
   - **第 1 段 · 本批三条验收（逐条先 RED 后 GREEN，结构检查类给出 grep 命令与命中行）**：
     - **A141 两份 adapter 三段原文**：`references/adapter-claude-code.md` 与 `references/adapter-codex.md`
       **各自**写入三段——① `agent start` 后 `wait --until idle` 再 `prompt`，prompt 后读 pane 末行确认已提交
       （未提交则 `send-keys Enter` 一次并复核）；② 编排等待优先用**账本文件事件监听**，附「监工连续空闲 ≥2 分钟
       且无新账本行」告警；③ 沙箱型只读启动不可用时的**环境预检替代**（bypass 沙箱 + 提示词只读约束 + `launch_fix=`）。
       证法 = 结构检查两份 adapter **各命中三段原文**。
     - **A142 `decision_mode` 模式门与 `cancelled` 归属闸**（动 `relay_log.py` 的 `add` 路径）：
       `consult` 下 `decision` 之后无 `user_decision` 即写 `resume` 退 2；`auto` 下 decider 链出现 `user_decision` 退 2；
       `cancelled` 进入决策类归属校验（A69，`DECISION_EVENTS` 纳入 `cancelled`），**非触发 agent 名下的 `cancelled` 退 2**。
       证法 = **去掉 RLT_07 钉住的两条 `@unittest.skip`**（`test_a114_consult_resume_without_user_decision_rejected`、
       `test_a114_auto_mode_rejects_user_decision_on_decider_chain`）**去 skip 即绿**——先去 skip 跑一次取 RED
       （现状两腿 rc=0，F-002/F-003 实证），再实现转绿；**不许改断言本体伪造绿**。另加 `cancelled` 归属正反各一例。
       A96 / A114 既有正例不得回归。
     - **A143 light 档 plan-reviewer 分级模板**（动 `SKILL.md`）：plan-reviewer 模板写明——纯措辞 / 格式 / 引用陈旧项
       **一律 P2、不阻断 PASS**；**allowed-paths、写入者边界（谁写 progress / findings / lesson）、节点/阶段边界、
       验收命令与完成信号缺失或矛盾**四类仍为 **P1 阻断**；附「light 只按此分级，heavy / normal 不变」。
       证法 = 结构检查命中「P2 不阻断」+ 四类 P1 原文；并用预演 `workspace/RLT_12/evidence/linux-dry-run/` 对应的
       `review.plan.md` 两轮 P1 **按新分级复算 = 1 P1 + 4 P2**，复算过程写进 findings。
   - `ref=` 与 `launch_fix=` 一律走现有 `_note_tokens` 解析，**不新增账本字段**。
   - 验证命令：`python -m unittest -v tools/relay-light/test_relay_log.py`（若 `task_plan.md` 写了别的入口以它为准），
     本批目标用例 + **全量回归都要绿，且 `skipped` 应从 2 降到 0**（两条 skip 已被 A142 解钉）；
     另跑 `git diff --check` 与四集合允许路径检查（`git diff --name-only master...HEAD`、working tree、index、untracked）。
     只暂存点名文件，**禁 `git add -A` / `git add .`**。
   - 允许路径闭集（超出即停并发阻塞信号，不自行越界）：`tools/relay-light/relay_log.py`、
     `tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/**`、`docs/modules/relay-light/workspace/RLT_21/**`。
     **不碰 RLT_12 树任何文件**，不碰 DevPlan / design / AGENTS / `tools/tests/` / 现役 Runner。
   - 进树第一个 Git 动作是 `git rebase master`；撞同 worktree 的 WIP 时按 `task_plan.md` 契约头 ② 的 DR-W-008 处置
     （`git merge-base` 核 HEAD 是否已含 master 顶点，成立即 no-op 记一行，**不强推、不清 WIP、不 `--autostash`**），
     判不出就发阻塞信号。
   - **`progress.md` 一个字都不许写**——它是 scribe 独占（A67）。coder 只写 `findings.md` 与
     `lesson_candidates.md` 的行，以及自己的完成信号文件。
   - **批内持续在场**：每轮（每条验收或每次 RED→GREEN 收束）打四行小结——做了什么 / 证据（命令 + 退出码）/
     偏离与 findings / 下一步，缺项写「无」。收到整改指令就在同一实例里继续改，不自己重启、不开新实例。
   - 完成方式：在 RLT_21 树 commit（scope 用英文 `relay-light`，只打 `wt/RLT_21`，**不 push、不建 PR、不合 master**）→
     打四行小结 → 写完成信号文件 **`workspace/RLT_21/done.coder.C2.md`**
     （一行：`task=RLT_21 role=coder node=C2 status=DONE evidence=<commit SHA> next=monitor`；
     **文件名带 `.C2` 后缀，别覆盖 C1 的 `done.coder.md`**）→ 即停。
     relay-light 无 `node_closed`，worker 完成即停、不等下一节点、不碰 R1 的活。
5. **等 coder**：`herdr agent wait coder --timeout 1800000` 前台阻塞。返回后**先自己读产出判合格**
   （三条 P1 各有整改与证据、三条验收各有 RED/GREEN 原始输出与退出码、全量回归绿且 skipped=0、
   `done.coder.C2.md` 在、commit 在、四集合无越界）。**合格也先别记 `done`**——按第 6、7 条先过 checker 这一关。
   不合格直接发整改回 coder pane（还没拉 checker 时，整改往返不需要账本事件，coder 仍是 live 实例）；
   自称卡住按第 9 / 10 条分流。
6. **拉 checker（先于 coder 的 `done`）**：复用 `wH:p4` 的 codex 进程——`herdr agent get checker` → `wait --until idle` →
   `add --node C2 --event agent_launch --agent checker#1 --note "launch=codex gpt-5.6-sol sandbox=workspace-write 复用 wH:p4 进程"`
   → `herdr agent prompt checker "<派活 prompt>"`。
   prompt 标头 `[relay-light] worker · node=C2 · agent=checker#1 · workspace=...`，正文必须写死：
   **「你只准写一个文件：`docs/modules/relay-light/workspace/RLT_21/check.C2.md`；除它之外不新建、不修改、
   不删除任何文件，不 commit、不跑 git 写操作」**（沙箱给的是 `workspace-write`，只读靠这句约束承担，DR-W-001）。
   审查面**分两块，顺序固定**：
   - **先核 `check.C1.md` 的三条 P1 是否真正消除**：P1-1 fully-closed 下 blocked/failed 缺 ref 是否退 2 报 A137、
     反向用例是否已删改；P1-2 `stage_close` 对 blocked 是否精确报 A118、A89/A112 是否无回归；
     P1-3 RED 证据是否补齐或**已如实标注不可证**（重建 RED 冒充原始即判 P1）。
   - **再核 A141 / A142 / A143 是否偏离 `task_plan.md`**、是否越界、证据是否有缺口；两条 skip 是否真去掉且自然绿、
     `skipped` 是否降为 0、A143 复算是否得出 1 P1 + 4 P2。
   职责边界写清：**只核「是否偏离 / 是否越界 / 证据是否有缺口」，不做 normal 复核、不替代 R1**；
   覆盖面**只限三条 P1 + A141~A143**，不回头重审 C1 的 A138~A140（C1 已判通过）。
   结论 `PASS` / `FAIL`，FAIL 项按 **P1（阻断）/ P2（不阻断）** 分级并逐条给出可执行的整改动作；
   完成后写 `done.checker.C2.md`
   （`task=RLT_21 role=checker node=C2 status=<PASS|FAIL> p1=<n> p2=<n> evidence=check.C2.md next=monitor`）即停。
7. **【本派单最关键的一条】记 `done` 的时机与 FAIL 返工路由（C1 的教训，逐字照办）**

   C1 把 coder 和 checker 的 `done` 都在 checker 出结论的同时记了，结果 checker 报 FAIL p1=3 时，
   两个 agent 都已是终态：A49 不许重拉、A60 不许给终态 agent 挂 `checkpoint`，**节点内返工路径当场堵死**。
   C2 必须这样走：

   - **coder 交活 → 你核产出 → 拉 checker → 看 checker 结论**，这一段**谁的 `done` 都不记**。
   - **checker 报 FAIL 时**：checker 保持 **live**，先落
     `add --node C2 --event checkpoint --agent checker#1 --note "routed_to=coder#1 P1-<编号> <一句话整改>"`
     （每条 P1 一行），**整改 prompt 实际发到 coder 的 pane**（`wH:p2`，同一实例，不新增 attempt、不新增 `agent_launch`）；
     coder 改完再让 **同一个 checker 实例**复审（同样只发 prompt，不重拉、不新增 `agent_launch`），
     循环到 **PASS** 为止。P2 不阻断：记进 `check.C2.md` 与 `lesson_candidates.md` 即可，不为它卡门。
   - **checker 报 PASS 之后**，才依次记两条终态：
     `add --node C2 --event done --agent coder#1 --note "<三条 P1 整改 + A141~A143 摘要 + commit=<sha>>"`
     → `add --node C2 --event done --agent checker#1 --note "check.C2.md PASS p1=0 p2=<n>"`。
     **顺序是 coder 先、checker 后**（scribe 的 trigger `on:done:coder` 到这一刻才算命中）。
   - 本节点**必然会有至少一次真实的纠偏往返**（三条 P1 就是现成的），如实记录即可；
     **不许为了「有东西可展示」去捏造问题或诱导 checker 报假 P1**，也不许为了省事把 FAIL 说成 PASS。
   - 返工往返次数没有硬上限，但**同一条 P1 往返 3 轮仍不收敛**就按第 9 条拉 decider 裁决，别死循环。
8. **拉 scribe**（**在 coder 的 `done` 落账之后**，trigger `on:done:coder` 命中）：复用 `wH:p3` 的 devin 进程——
   `herdr agent get scribe` → `wait --until idle` →
   `add --node C2 --event agent_launch --agent scribe#1 --note "launch=devin swe-2-medium permission-mode=normal cwd=RLT_21树 复用 wH:p3 进程"`
   → `herdr agent prompt scribe "<派活 prompt>"`。
   prompt 标头 `agent=scribe#1`，正文写死：**「你只准写 `docs/modules/relay-light/workspace/RLT_21/progress.md`
   与自己的完成信号 `done.scribe.C2.md`；除这两个文件外不新建、不修改、不删除任何文件」**；
   内容 = 把 C2 的证据账（**三条 P1 的返工过程与前后证据**、A141~A143 各自的 RED 命令与退出码、GREEN 命令与退出码、
   全量回归 `Ran <n> tests` 与 `skipped=0`、commit SHA、偏离项、checker 纠偏往返的轮次与结论）按模板落进 `progress.md`，
   `evidence=` 引用的东西必须先在证据账里登记；写完 `done.scribe.C2.md`
   （`task=RLT_21 role=scribe node=C2 status=DONE evidence=progress.md next=monitor`）即停。
   `wait` → 读产出 → `add --node C2 --event done --agent scribe#1 --note "<摘要>"`。
9. **施工性 `blocked` → decider 链**（trigger `on:blocked`，只在 coder 遇到**需要裁决的技术卡点**时走，
   环境起不来那类走第 10 条）：
   - `add --node C2 --event blocked --agent coder#1 --note "<卡点一句话>"`；
   - `add --node C2 --event escalate --agent coder#1 --note "decider=decider#1 <一句话>"`
     ——**note 恰含一个 helper token `decider=decider#1`**，缺一 / 多一 / 不符即拒（A69）；
   - **新 pane** 拉 decider（cwd = RLT_21 树；`herdr pane split` **显式传目标 pane，不用 `--current`**）：
     `herdr agent start decider --kind codex --pane <新 pane> -- -m gpt-6-astra --sandbox workspace-write`，
     `add --node C2 --event agent_launch --agent decider#1 --note "launch=codex gpt-6-astra sandbox=workspace-write"`；
   - decider 派活 prompt 标头 `agent=decider#1`，正文写死：**「你只准写一个文件：
     `docs/modules/relay-light/workspace/RLT_21/decision.2.md`；不改任何其它文件、不 commit、不跑 git 写操作、不动代码」**
     （**文件名是 `decision.2.md`**——计划 agent 表冻结值，decision 序号全卡递增，不自行改号）；
     输入 = 卡点描述 + `task_plan.md` + `check.C1.md` 相关条 + 相关验收条款；产出 = 可执行方案（保持在 allowed-paths 内）；
     写完 `done.decider.md` 即停；
   - `add --node C2 --event decision --agent coder#1 --note "decider=decider#1 <方案一句话>"`（**复述同一 helper**）→
     `add --node C2 --event done --agent decider#1` → `add --node C2 --event resume --agent coder#1 --note "<回到哪一步>"`；
   - **`decision_mode=auto`，中间不写 `user_decision`**（写了即拒）。方案送回**同一个 coder 实例**，
     后续往返用 `checkpoint`，不新增 attempt、不新增 `agent_launch`。
10. **异常出口**（照现行校验，别发明新写法）：
    - **静默超时**：worker 状态 `working` 但 pane 输出 **>20 分钟无变化** → `add --event agent_lost --agent <名>#<n> --note "silence>20min"`
      → **同一个 pane** 关掉重拉 `#n+1`（`agent_launch` 的 attempt 必须恰为当前最大值 + 1），`attempt_max=3`。
    - **复用进程失效**（进程已死 / 输入通道冻结 / Devin 菜单答不动）：先按上一条记 `agent_lost`，
      再在**同一个 pane** `herdr agent start` 拉 fresh 实例，note 里写明 `launch_fix=<新档>` 的事实，**不要 `plan_amend`**。
    - **环境性 NOT_RUN**（起不来 / 沙箱拒写 / 输入通道冻结）：合法出口是 **`blocked` → `agent_lost` → 重拉**
      （DR-W-002 实证），**不拉 decider**（decider 是给施工卡点用的，见第 9 条）。
      **不要写 `escalate --agent monitor#2 --note "decider=monitor#2 ..."`**——A69 只认 `decider=<名>#<n>` 或
      `strategist=<名>#<n>` 恰一个 helper token，监工不是合法 helper，写了必被拒。
      （`launch_fix=` 在你这一侧跑的旧版账本里仍只是 note 文本、lint 不校验——计划注释 8 的已知缺口；
      C2 的 coder 正在补的是 **RLT_21 树**那一份，与你无关，按现状执行。）
    - **attempt_max 用尽仍 NOT_RUN**：按计划注释 5 由你拉 `strategist#1`
      （`codex -m gpt-5.6-terra -c model_reasoning_effort=high --sandbox workspace-write`），走 SKILL 的 strategist 链：
      `escalate`（记在卡住的那个 worker 名下，note 恰含 `strategist=strategist#1`）→ `agent_launch strategist#1`
      → `decision`（worker 名下，复述同一 helper）→ `done strategist#1` → **停在 `user_decision` 人闸**，
      按第 12 条交编排，不要自己代答。
    - 任何 `add` 退出 2 / 3：**stderr 原样贴到终端并停下，不要绕过校验、不要改参数硬凑**。
11. **关节点**：双判据成立（全部在场 agent 有终态 + `close` 列的 **checker 已 `done` 且结论 PASS**）后
    `add --node C2 --event node_close --agent monitor#2 --note "coder#1/checker#1/scribe#1 均 done；check.C2.md PASS；三条 C1 遗留 P1 已整改；commit=<sha>"`。
    **checker 不 PASS 就不许关节点**——这是 `close=agent:checker` 的硬含义；C1 那种「FAIL 也关」是编排的一次性裁决，
    不是可以复制的先例。
12. **收尾（与 C1 不同，看清楚——`stage_result` 这次归你写）**：
    - 顺序固定：`node_close C2` → **`stage_result`**：

      ```powershell
      python tools/relay-light/relay_log.py add --plan docs/modules/relay-light/relay/rlt12-win-01 --node C2 --event stage_result --agent monitor#2 --note "stage_id=RLT_21:C#1 outcome=done C1(A137~A140 commit=a80fcde)+C2(三条P1返工+A141~A143 commit=<sha>) 全量回归绿 skipped=0；check.C1.md FAIL p1=3 已在 C2 整改，check.C2.md PASS" --config-dir ~/.claude/skills/relay-light/
      ```

      此刻 `RLT_21:C#1` 的 C1 与 C2 都已 closed，A112 的「全节点 closed」满足，`outcome=done` 应当直接通过；
      被拒就贴 stderr 停下，**不要硬凑、不要改 outcome 蒙混**。
    - 落账后**即停**，终端打印 `MONITOR_DONE stage=C2`，并把交接事实一次说清：C2 的 commit SHA、
      三条 P1 的整改结论、A141~A143 的验证命令与退出码、`Ran <n> tests` 与 `skipped=0`、checker 结论与 P1/P2 计数、
      纠偏往返轮次、遗留 findings。
    - **不写 `stage_close`**（编排的事），**不关终端空间 wH、不关 worker pane**（编排统一收；R1 可能还要复用）。
    - 需要用户裁决或节点走不下去时：按 SKILL 该写 `stage_result outcome=blocked`，但 C2 未关时现行实现同样会被 A112 拒
      ——**照写一次，把退出码与 stderr 原样留在终端当作 A137 缺口的现场证据**，
      **不要绕过校验、不要为了让它过去硬关节点**；随后打印
      `MONITOR_BLOCKED stage=C2 reason=<一句话>` 并停，交编排定夺，同时保留可复现的证据（命令、退出码、stderr 原文）。

## 派单纪律（承接 Windows 预演与 C1 实战，逐条落地）

- **真提交核验（DR-W-003，Windows 约 75% 命中）**：`herdr agent prompt` 发出后必须核真提交——
  `herdr agent get <名>` 看 `state_change_seq` 变化且 `status` 转 `working`；停在输入框（seq 不动 /
  `agent_prompt_stalled`）就补 `herdr agent send-keys <名> enter` 再复验；终极判据 = `herdr agent read`
  看输入框已清空。复用进程同样要先 `wait --until idle` 再 `prompt`。输入通道整体冻结则该实例弃用，
  按第 10 条 `agent_lost` 在同 pane 拉 fresh 实例。
- **Devin 审批菜单由你逐项答**：`herdr agent send-keys <名> <数字>`，**不选 bypass / 全放行那一档**，
  也不替它降 `--permission-mode` 重拉。
- **显式钉模型档（DR-W-007）**：任何 codex 启动串都要带 `-m`，裸启会跑成账号默认模型。
- **复核 / 决策角色一律 `workspace-write`（DR-W-001）**：`--sandbox read-only` 在 Windows 能读但拒写一切文件，
  产出落不了盘等同失联。「只读」由 prompt 约束承担，见第 6、9 条。
- **整改路由挂 live agent（DR-W-004）+ `done` 压到 PASS 之后（C1 教训）**：见第 7 条，这是本节点的第一纪律。
- **rebase 撞 WIP 走 merge-base（DR-W-008）**：W1 已写进 `task_plan.md` 契约头 ②，你在 prompt 里指向它即可，不改写、不弱化。
- **完成信号一律带 `.C2` 后缀（DR-W-010 + 同名跨节点条款）**：`done.coder.C2.md` / `done.checker.C2.md` /
  `done.scribe.C2.md`（decider 走时是 `done.decider.md`）。**不许覆盖 C1 的同名信号文件**，
  也**不许往 `progress.md` 追加完成信号**——`progress.md` 是 scribe 独占（A67）。
- **记账不漏、不自造**：每一次拉起与每一个终态都要落账本，事件名只用 SKILL 词表里的
  （`agent_launch` / `checkpoint` / `blocked` / `escalate` / `decision` / `user_decision` / `resume` /
  `done` / `agent_lost` / `cancelled` + 控制事件 `node_start` / `node_close` / `stage_result` / `monitor_restart`），
  不要发明 `monitor_helper`、`relaunch`、`retry` 之类新词。
- **只拉本节点的 agent**：C2 只有 coder / checker / scribe / decider 四行（加按需的 strategist）。
  **R1 的 requirement / lesson / scribe 与 F1 的 scribe 一个都不准提前拉**；也不回头给 C1 的终态 agent 补事件。

## 硬边界

- 不 `push`、不建 PR、不合并、不动 `master`；commit 只打 `wt/RLT_21`。
- **不改 RLT_12 树除账本以外的任何文件**——`relay_plan.md`、`dispatch/`、开发方案都不动。
- 不改 `docs/modules/relay-light/design/`（禁区），不改验收 ID，不改 `task_plan.md` 的批次切法与验收编号。
- **不回头改 C1 的账本行、不改 `check.C1.md`**——C1 是已关闭的既成事实，三条 P1 只在 C2 的代码与证据里整改。
- 不跑 `install_skill.py`、不做双侧 skill 重同步（须用户当次明确授权，且不在 C 阶段）；
  coder 改的是**仓内** `tools/relay-light/skill/**`，与两侧用户级副本无关。
- 凭据 / 密钥值永不进 prompt、note、工件、账本；证据先按白名单过滤（A27）。
- 不越权替用户裁决；不自授权超限继续；不为「有纠偏可展示」制造假问题，也不为收工把 FAIL 记成 PASS。

## 授权记录

用户 2026-09-14 已授权：RLT_12 D-start（Issue #23，树 `wt/RLT_12`）；本计划 `rlt12-win-01` 的计划内业务卡 =
RLT_21（Issue #21，施工树 `wt/RLT_21`）；各节点的委托按计划 agent 表的默认档位执行，不逐个再问；
接受 A112 / NOT_RUN 已知缺口（迁移表下无 `blocked` 终态 agent，环境性 NOT_RUN 走 `blocked → agent_lost` 重拉，
`launch_fix=` 仅为 note 文本不受 lint 校验；`stage_result` 对所有 outcome 都要求节点全关），
并冻结该口径为本次运行的证据基线。

编排 2026-09-15 追加裁决（已在 C1 的 `node_close` note 留痕）：C1 在 checker FAIL p1=3 下如实关闭，
三条 P1 转由 C2 承接返工；C2 复用 C1 的三个 worker 进程，但账本记为 C2 名下的新实例（attempt 从 1 起）。
