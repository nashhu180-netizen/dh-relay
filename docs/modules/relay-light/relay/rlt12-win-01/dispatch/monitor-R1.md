`[relay-light] monitor · plan=rlt12-win-01 · stage=R1 · agent=monitor#3`

# monitor#3 · RLT_21:R#1 · relay-light 监工派单（编排 → 监工）

你是 relay-light 计划 `rlt12-win-01` 的 **R 阶段监工 `monitor#3`**——**新阶段、新监工实例、新阶段实例
`RLT_21:R#1`**，与 C 阶段的 `monitor#2` 无继承关系（不续用 `monitor#2` 这个名字，也不回头改 C 阶段任何账本行）。
运行时 = codex（编排以 `codex -m gpt-5.6-terra -c model_reasoning_effort=high --sandbox workspace-write`
在你自己的终端空间拉起，cwd = RLT_12 树）。协议全文见 `~/.codex/skills/relay-light/SKILL.md`（与仓内
`tools/relay-light/skill/SKILL.md` 逐字节相同），命令写法见 `references/adapter-claude-code.md`
——**本计划主控侧是 Claude 适配，账本一律 `--config-dir ~/.claude/skills/relay-light/`**。

**你只管阶段实例 `RLT_21:R#1` 的节点 R1**：C 阶段已整体收口（见第 0 条），F1 不归你，**X 阶段不由你开**
（见第 8 条的路由边界）；不写 `stage_close`、不关终端空间、不回头问用户（要用户裁决时按第 12 条停下交编排）。
**R1 是本阶段实例的唯一节点——`stage_result` 归你写。**

## 现场

两棵树分工，别串。

| 用途 | 路径 | 分支 |
|---|---|---|
| 计划与账本（你跑账本命令的 cwd） | `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12` | `wt/RLT_12` |
| RLT_21 复核与任务工作区（全部 worker 的 cwd） | `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_21` | `wt/RLT_21`（C2 产出已在，HEAD `4105da8`） |

- 计划目录：`docs/modules/relay-light/relay/rlt12-win-01/`（`relay_plan.md` + `relay_log.jsonl` + `dispatch/`）。
  开工前**通读 `relay_plan.md` 的注释 1~8**：那是规划冻结的现场约定，运行时不重抄、也不推翻。
  注释 6（X 阶段不预留节点行）是本节点收尾路由的直接依据，重点读。
- 账本程序（在 RLT_12 树跑，Windows 命令名是 `python` 不是 `python3`）：

  ```powershell
  python tools/relay-light/relay_log.py add    --plan docs/modules/relay-light/relay/rlt12-win-01 --node R1 --event <e> --agent <a> --note "<t>" --config-dir ~/.claude/skills/relay-light/
  python tools/relay-light/relay_log.py status --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/
  python tools/relay-light/relay_log.py lint   --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/
  ```

  `--config-dir` 每次都要带（HC-RL-A136），不带会撞双侧歧义退出 3。`lint` 不支持 `--json`。
- **账本跑的永远是 RLT_12 树这一份 `relay_log.py`**（计划注释 8）：C1 / C2 的 coder 改的是 **RLT_21 树**的同名文件
  （`ref=` 强制、模式门、`cancelled` 归属闸、`launch_fix` 字段都已落在那一份里），**两份互不影响**。
  你这一侧按 RLT_12 树的现行旧版执行——**旧版没有那些新闸**，别按新语义写 note，也别因为新版更严就改自己的写法。
  这一条在 R1 尤其要紧：reviewer 会在 RLT_21 树复跑新版测试，那是它们的活，不是你换账本的理由。
- 任务工作区（在 **RLT_21 树**）：`docs/modules/relay-light/workspace/RLT_21/`。W1/C1/C2 已留下
  `brief.md`、`task_plan.md`、`execution_strategy.md`、`review.plan.md`、`progress.md`、`findings.md`、
  `lesson_candidates.md`、`check.C1.md`、`check.C2.md`、`review.md`（W1 建的骨架，R1 由 scribe 填）
  与各节点的 `done.*.md`。
- 业务卡定义：RLT_21 树 `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` 的 `#### RLT_21` 段；
  Issue #21（`gh issue view 21`）是同一口径的摘要，**与开发方案冲突时以开发方案与本计划的节点表/agent 表为准**。
  **本节点的复核口径以 `task_plan.md` 的「R1」行与 `review.md` 已登记的路径表为准**，你不重切、不加戏。
- 每开一个 pane，先 `$env:PYTHONUTF8=1` 再跑账本/派活，避免中文 note 的编码抖动。
- 硬规则（原样转达，不得删改）：`wait` 返回时必须有接收者（watch 推送 / 前台阻塞循环 / 后台退出唤醒三选一）；
  watch 未实现时不得结束回合空等。凭据 / 密钥值永不写进 note、工件、账本、派活文案。
- 本计划 `decision_mode=auto`（marker 冻结）：**decider 链里不写 `user_decision`**，写了即拒（A114）。
  R1 的 agent 表**没有 decider 行**——本节点不拉 decider（施工卡点在 C 阶段已收口，见第 11 条的异常出口）。

## 0. 上游交接事实（已核，不要重新调查）

- **W1 已 closed**：七件套 + `task_plan.md` 建在 RLT_21 树，`review.plan.md` PASS（p1=0 p2=0），
  该节点的 commit 是 **`424807f`**。
- **C 阶段已整体收口**：阶段实例 `RLT_21:C#1` 的 `stage_result` 为 `outcome=done`（result=done，C1 与 C2 均 closed）。
  - **C1**（commit **`a80fcde`**，验收 A137~A140）：checker 结论 **FAIL p1=3**（`check.C1.md`），
    因 coder#1 与 checker#1 都已记 `done`（A49 不许重拉、A60 不许给终态 agent 挂事件），**节点内无返工路径**，
    编排裁决 C1 如实关闭，三条 P1 整建制转 C2 返工。
  - **C2**（commit **`0e0f24a`** + 整改 **`4105da8`**，验收 A141~A143）：C1 三条 P1 **全部 CLOSED**，
    checker 复审 **PASS，p1=0 p2=1**（`check.C2.md`）。
- **全量单测事实**（RLT_21 树）：`python -m unittest -v tools/relay-light/test_relay_log.py`
  → `Ran 181 tests`、`OK`、**`skipped=0`**、exit=0。skipped 由 2 降为 0 —— A142 解钉了 RLT_07 那两条
  `@unittest.skip`（`test_a114_consult_resume_without_user_decision_rejected`、
  `test_a114_auto_mode_rejects_user_decision_on_decider_chain`）。**这是 R1 复跑的基线数字，对不上就是发现。**
- **遗留 P2 一条 + coder 登记的技术卡点**：RLT_21 树 `workspace/RLT_21/findings.md` 的 **F-009**
  ——A143 复算按 SKILL 冻结的四类逐条计级得 **3 P1 + 2 P2**，与 oracle 写的期望 **1 P1 + 4 P2** 不可兼得；
  只有引入「同根去重 / 残留折级」这条**未冻结口径**才能凑到 oracle 的数，而 C2 整改已明确禁止该口径。
  checker 判为**口径分歧、非施工缺陷**，按 P2 放行 C2（`check.C2.md` 的 P2-1）。
  **R1 的两路复核都必须正面回应 F-009**：是接受「逐条计级 3 P1 + 2 P2」并建议修订 oracle 期望，
  还是要求冻结一条可执行的归并规则，或判它另有出路——**要给结论、给理由，不许绕开、不许只说「已登记」**。
- **RLT_21 树有未提交的工作区文件**（`git status --porcelain` 实测，R1 的 scribe 收敛时一并处理）：
  已改 `progress.md`；未跟踪 `check.C1.md`、`check.C2.md`、`review.plan.md`、
  `done.builder.md`、`done.plan-reviewer.md`、`done.coder.md`、`done.checker.md`、`done.scribe.md`、
  `done.coder.C2.md`、`done.checker.C2.md`、`done.scribe.C2.md`。
  **全部落在 `workspace/RLT_21/**` 允许路径内**，scribe 逐个点名 `git add` 即可，**禁 `git add -A` / `git add .`**。

## 本节点的权威定义（抄自计划，不要自行发挥）

| node | card | stage | type | close | depends_on |
|---|---|---|---|---|---|
| R1 | RLT_21 | `RLT_21:R#1` | review | **`agent:scribe`** | C2（已 closed） |

| agent | role | launch | output | trigger |
|---|---|---|---|---|
| requirement | reviewer | `codex -m gpt-5.6-sol --sandbox workspace-write` | `review.requirement.md` | （空，立即拉，normal Recipe 路 1） |
| lesson | reviewer | `codex -m gpt-5.6-sol --sandbox workspace-write` | `review.lesson.md` | （空，立即拉，normal Recipe 路 2） |
| scribe | scribe | `devin --model swe-2-medium` | `review.md`（含体检 / 四道闸脚本与 miner 汇总） | （空是模板约定例外：**全部 reviewer `done` 后由你拉起**） |

**三个 agent 全是 R1 名下的新实例，attempt 从 1 起**（`requirement#1` / `lesson#1` / `scribe#1`）——
账本按 `node` 区分实例，与 C 阶段的同名 `#1` 不冲突、不继承、不叠加 attempt。

**`close=agent:scribe` 的硬含义（与 C 阶段不同，看清楚）**：关节点看的是 **scribe 的 `done`**，
不是 reviewer 的 PASS。**reviewer 报 FAIL 不阻止关 R1**——复核结论通过 `review.md` 与 `stage_result` 的 note
传给编排，返工由 X 阶段承接（第 8 条）。别把 C 阶段「checker 不 PASS 不许关节点」的规矩套到这里。

## 进程与 pane 安排（与 C 阶段的实质差异）

| 角色 | pane | 进程 | 复用还是 fresh |
|---|---|---|---|
| requirement | `wH:p4`（C 阶段 checker 占的那个 codex pane） | codex `gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write` | **必须 fresh 实例** |
| lesson | 新 pane（`herdr pane split` **显式传目标 pane，不要用 `--current`**） | 同上 | **必须 fresh 实例** |
| scribe | `wH:p3`（C 阶段 scribe 的 devin） | devin `--model swe-2-medium --permission-mode normal` | 可复用（同角色） |

- **两路 reviewer 不许复用 C 阶段 checker 的进程上下文**：`review.md` 的路径表写死了复核要「fresh、非施工者」，
  而 `wH:p4` 里那个 codex 带着 C1/C2 小审的全部结论与倾向，复用等于让小审给自己背书。
  正确姿势：在 `wH:p4` 上把旧的 `checker` agent 停掉，**按新 agent 名 `requirement` 重新 `herdr agent start`**，
  让 herdr 的 agent 名与账本角色名对齐；`lesson` 在新 pane 上同样 fresh 拉起。
  ```powershell
  herdr agent start requirement --kind codex --pane wH:p4 -- -m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write
  herdr agent start lesson      --kind codex --pane <新 pane> -- -m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write
  ```
  pane id 以现场为准（`herdr pane list`），上表的 `wH:p4` / `wH:p3` 是 C 阶段的实测值，对不上就按现场改，
  **但「reviewer fresh、scribe 可复用」这条不变**。
- scribe 复用姿势：`herdr agent get scribe` 核进程活着 → `herdr agent wait scribe --until idle` →
  `herdr agent prompt scribe "<R1 派活 prompt>"`。复用的进程带着 C2 的上下文，所以 prompt 首行必须重新钉死
  节点与实例（`node=R1 · agent=scribe#1`），正文开头写一句「**这是 R1 新节点新实例，C 阶段已收口；下面是全新派单**」。
- **两路 reviewer 并行**：两条 `agent_launch` 都落账，两个 prompt 都发出去之后再统一等（第 7 条的轮询）。
  不要串行跑——agent 表 trigger 列为空就是「并行」的意思。
- **C 阶段的 coder pane（`wH:p2`，devin `swe-2-max`）本节点不碰**：R1 没有 coder 行。
  真要改代码是 X 阶段的事，由编排另开（第 8 条）。

## 你要按顺序做的事

1. **看现场**：跑 `status`，应见 `RLT_21:C#1` 已完整收口（C1 / C2 均 `closed`、`stage_result outcome=done`、
   `stage_close` 在），且 `RLT_21:R#1` 的 `stage_start` 与 `monitor_launch` 两行都带 `stage_id=RLT_21:R#1`，
   节点 R1 为 `ready`。**两行不全不要自己补**——那是编排的控制事件，写入者不符会被拒；
   按第 12 条打 `MONITOR_BLOCKED` 停下。顺手跑一次 `lint`，非 0 原样贴 stderr 并停。
2. **开节点**：
   ```powershell
   python tools/relay-light/relay_log.py add --plan docs/modules/relay-light/relay/rlt12-win-01 --node R1 --event node_start --agent monitor#3 --note "stage_id=RLT_21:R#1 depends_on=C2 closed；normal Recipe 双路并行复核" --config-dir ~/.claude/skills/relay-light/
   ```
   （`depends_on` 的 C2 已 closed，应当直接通过；被拒就贴 stderr 停下。）
3. **拉 requirement 路**（fresh codex，cwd = RLT_21 树）：`herdr agent start ...`（见上一节）→
   `add --node R1 --event agent_launch --agent requirement#1 --note "launch=codex gpt-5.6-sol reasoning=medium sandbox=workspace-write cwd=RLT_21树 fresh实例"`
   → `herdr agent wait requirement --until idle` → `herdr agent prompt requirement "<派活 prompt>"` → 核真提交。
4. **requirement 派活 prompt**，首行必须是
   `[relay-light] worker · node=R1 · agent=requirement#1 · workspace=docs/modules/relay-light/workspace/RLT_21`，
   正文照 adapter「派活 prompt 模板」，并把下面这些逐条写进去：
   - **只写一个文件**：**「你只准写 `docs/modules/relay-light/workspace/RLT_21/review.requirement.md`；
     除它之外不新建、不修改、不删除任何文件，不 commit、不跑任何 git 写操作，不改代码、不改测试、
     不改 `task_plan.md` / `brief.md` / `findings.md` / `progress.md` / `review.md`」**
     （沙箱给的是 `workspace-write`，只读靠这句约束承担，DR-W-001）。
   - 读：RLT_21 树 `AGENTS.md`、`brief.md` 的 HC-RL-A137~A143 逐字条款与证法、`task_plan.md`（含契约头三条与
     C1 九步 / C2 五步表）、`design/01` §11 对应段（oracle）、`review.plan.md`、`check.C1.md`、`check.C2.md`、
     `progress.md`、`findings.md`（**F-009 全文**）、`review.md` 的路径表；`gh issue view 21`；
     `dev_plan/P1-RelayLight-开发方案.md` 的 `#### RLT_21` 段；代码面 `tools/relay-light/relay_log.py`、
     `tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/**`，行号以现场为准、不凭记忆。
   - **审查面（逐条给结论，不许只给总评）**：
     - **七条验收是否真落地**：A137 / A138 / A139 / A140 / A141 / A142 / A143 逐条对齐 oracle 与证法——
       实现在不在、测试钉没钉住行为（不是钉住实现细节）、结构检查类是否给出 grep 命令与命中行、
       `skipped` 是否真为 0（两条去 skip 是自然转绿还是改了断言本体）。
     - **是否偏离 RLT_21 brief 的目标与允许路径**：四集合检查（`git diff --name-only master...HEAD`、
       working tree、index、untracked）有没有越出闭集 `tools/relay-light/relay_log.py`、
       `tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/**`、`docs/modules/relay-light/workspace/RLT_21/**`；
       有没有动 DevPlan / design / AGENTS / `tools/tests/` / 现役 Runner / RLT_12 树。
     - **Issue #21 与 DevPlan 的口径**：三者（Issue、开发方案、`task_plan.md`）对本卡目标与完成条件的表述是否一致，
       不一致的以开发方案与本计划为准，但**差异要逐条列出来**。
     - **F-009 正面裁决**（见第 0 条）：给出你对「oracle 期望 1 P1 + 4 P2 vs 冻结逐条计级 3 P1 + 2 P2」的结论与理由，
       并说明它该由谁在哪一步收口。
     - **复核路数分歧，你顺带裁决（见下一条，必须给结论）**。
   - **复核路数分歧（本路的额外任务，写进报告里当独立小节）**：
     `tools/relay-light/skill/dh-mapping.toml` 的 `[recipes.normal]` 是 `reviewers = ["requirement", "lesson"]`
     ——**两路**；而 Issue #21 与 RLT_21 `brief.md` / `review.md` 的路径表写的是**三路**（含 `code-round1`）。
     **本计划按配方两路跑**（计划 agent 表已冻结）。请你在报告里给出结论：
     ① 就 RLT_21 这张卡而言，**两路是否足够**（缺的独立代码路，是否已被 C 阶段两次 checker 小审 + 全量单测覆盖，
     还是确实存在无人审的面）；② **三路口径该如何统一**（改 `dh-mapping.toml` 的 normal 集合、
     改 Issue/brief 的表述、还是保留「按卡补派」的机制）——这是 RLT_21 收口的输入，要可执行，不要只提问题。
   - **结论格式（写死）**：报告必须给 **`PASS` / `FAIL`** 与 **P1（阻断）/ P2（不阻断）** 分级；
     **每条 FAIL 的 P1 都要给可执行的整改动作**（改哪个文件、改成什么、用什么命令验证）；
     每条发现挂一条可复跑的命令或可定位的文件:行号。**不许把口径分歧写成 P1 来凑数，也不许为收工把缺口降成 P2。**
   - **复跑要求**：oracle 与测试由你本机重跑，不采信别人贴的结果——至少跑
     `python -m unittest -v tools/relay-light/test_relay_log.py`（期望 `Ran 181 tests` / `OK` / `skipped=0` / exit 0），
     对不上就是发现；结构检查类给出你自己跑的 grep 命令与命中行。
   - 完成方式：写完 `review.requirement.md` → 打四行小结（做了什么 / 证据 / 偏离 / 下一步）→ 写完成信号
     **`workspace/RLT_21/done.requirement.R1.md`**（一行：
     `task=RLT_21 role=reviewer route=requirement node=R1 status=<PASS|FAIL> p1=<n> p2=<n> evidence=review.requirement.md next=monitor`）→ 即停。
     **不 commit、不碰别人的文件、不等下一节点。**
5. **拉 lesson 路**（fresh codex，新 pane，cwd = RLT_21 树）：
   `add --node R1 --event agent_launch --agent lesson#1 --note "launch=codex gpt-5.6-sol reasoning=medium sandbox=workspace-write cwd=RLT_21树 fresh实例"`
   → `wait --until idle` → `prompt` → 核真提交。**与第 3 条并行，不要等 requirement 出结果再拉。**
6. **lesson 派活 prompt**，首行 `[relay-light] worker · node=R1 · agent=lesson#1 · workspace=docs/modules/relay-light/workspace/RLT_21`，
   正文要点：
   - **只写一个文件**：**「你只准写 `docs/modules/relay-light/workspace/RLT_21/review.lesson.md`；
     除它之外不新建、不修改、不删除任何文件，不 commit、不跑任何 git 写操作」**——
     **特别是不许改 `lesson_candidates.md`**（那是 coder 的登记位，A67 写入者边界，本轮无人有权改它；
     你要补的候选写进自己的报告，由编排/后续节点裁决）。
   - 读：`findings.md` 全文（F-001~F-009）、`lesson_candidates.md`（L-001~L-004）、`progress.md`、
     `check.C1.md` / `check.C2.md`、`review.plan.md`、`task_plan.md`、本计划的 `dispatch/monitor-W1.md` /
     `monitor-C1.md` / `monitor-C2.md`（**在 RLT_12 树，只读**，派单纪律段落记着本轮踩过的坑）、
     `docs/modules/relay-light/workspace/RLT_12/evidence/`（Linux / Windows 预演的 DR-W-00x 事实）。
   - **审查面 = 本轮教训是否收全、去重是否干净、能不能复用**，下面四条是**已知漏网点，必须逐条查有没有被收**：
     - **F-009 的口径分歧卡点**（A143 复算 3 P1 + 2 P2 vs oracle 1 P1 + 4 P2）——L-004 已抽到一条，
       核它是否说到点子上（「oracle 的期望计数若依赖归并/去重口径，该口径必须随验收一起冻结」），要不要补。
     - **C1 无法在节点内返工的协议缺口**：coder 与 checker 的 `done` 一起记，导致 checker 报 FAIL p1=3 时
       A49（不许重拉）与 A60（不许给终态 agent 挂事件）把返工路当场堵死，只能整建制推到 C2。
       这是**协议级教训**（「`done` 的时机决定还有没有返工路」），核它有没有进 `lesson_candidates.md`；没有就报 P1 级缺口。
     - **Devin 审批菜单编号漂移**：菜单选项数量随上下文变化，按固定数字发键会误选（本轮 C 阶段实测踩过）。
     - **herdr 间歇 `PermissionDenied`**：`herdr agent wait` 在监工侧会间歇报 Os code 5，必须改轮询。
     - 另核：这四条之外，`findings.md` / `progress.md` 里还有没有**只记在 commit message 或终端里、没进任何登记位**的事实
       （「写进 commit message 不算记录」是同族老毛病，专门搜一遍）。
   - **去重与可迁移性**：每条候选要判「是本卡一次性现象，还是可迁移原则」；与 `lesson_candidates.md` 已有四条
     去重，撞了就标「疑似同源 L-00x」，不重复立条。**没有新候选也要形成可核查的 N/A 结论**，不许留空。
   - **结论格式与 requirement 路一致**：`PASS` / `FAIL` + P1 / P2 分级，FAIL 的 P1 给可执行整改动作，
     每条发现挂可定位证据（文件:行号 / 命令）。
   - 完成方式：写完 `review.lesson.md` → 四行小结 → 写 **`workspace/RLT_21/done.lesson.R1.md`**
     （`task=RLT_21 role=reviewer route=lesson node=R1 status=<PASS|FAIL> p1=<n> p2=<n> evidence=review.lesson.md next=monitor`）→ 即停。
7. **等两路（轮询，不要用 `herdr agent wait`）**——C 阶段实测教训：`herdr agent wait` 在监工侧会间歇
   `PermissionDenied`（Os code 5），把回合打断。改这样等：
   - **一轮 ≈ 9 分钟**：每 30 秒对**两个 agent 各**跑一次 `herdr agent get <名>` + `herdr agent read <名> --tail <n>`，
     看 `status` / `state_change_seq` / pane 末行是否在动；一轮跑满还没出结果，**直接进下一轮，不要结束回合空等**。
   - `herdr` 报 `Os code 5` / `PermissionDenied`：**退避重试**（等 5~10 秒再试同一条命令），
     连续 3 次同一命令都失败才按第 11 条当异常处理——**不要把工具抖动当 agent 失联**。
   - 两路各自结束后**先自己读产出判合格**：`review.<路>.md` 在不在、有没有 `PASS`/`FAIL` 与 P1/P2 分级、
     每条 P1 有没有可执行整改动作、**有没有正面回应 F-009**（requirement 路另加：有没有给出两路 / 三路的裁决）、
     `done.<路>.R1.md` 在不在。**另跑一次越界检查**：在 RLT_21 树 `git status --porcelain`，
     确认该路只动了自己那一个文件（+ 自己的完成信号）。不合格就发整改回它自己的 pane
     （**该路仍是 live 实例，整改往返不需要账本事件，不新增 attempt、不新增 `agent_launch`**）。
   - **一路先结束不等于可以先记 `done`**——记 `done` 的时机见第 8 条。
8. **【本派单最关键的一条】P1 的路由边界与 `done` 的时机**

   R1 的 agent 表**没有 coder 行**。这意味着：

   - **R1 内的 P1 若需要改代码 / 改测试，不在 R1 内改。** 拉新 coder 属于 X 阶段追加节点（计划注释 6），
     那是编排的事，**你不拉 coder、不写 `plan_amend`、不追加节点行**。你要做的是把这条 P1 的事实与整改动作
     原样带进 `review.md` 与 `stage_result` 的 note，交编排开 X 阶段。
   - **只改文档 / 登记位的 P1，可以由 scribe 在 R1 内修**（例如 `review.md` 登记缺项、`progress.md` 证据账漏登、
     口径表述不一致）。走法：**该路 reviewer 保持 live**，先落
     `add --node R1 --event checkpoint --agent <该路>#1 --note "routed_to=scribe#1 P1-<编号> <一句话整改>"`
     （每条 P1 一行），整改指令**实际发到 scribe 的 pane**；scribe 改完再让**同一个 reviewer 实例**复核该条
     （只发 prompt，不重拉、不新增 `agent_launch`）。
   - **代码类 P1 同样要落一行 `checkpoint`**（挂在该路 reviewer 名下，note 写
     `routed_to=orchestrator P1-<编号> 需开 X 阶段 <一句话>`），让「谁发现、路由到哪」在账本上可追。
     **`routed_to=` 是 note 里的自由文本，不是 helper token**——别写成 `decider=` / `strategist=`，A69 会拒。
   - **`done` 的时机**：一路 reviewer 的 `done` 压到**你已判定该路全部 P1 的归属**（文档类已由 scribe 改完并经该路复核，
     代码类已记 `checkpoint` 路由给编排）之后再记。理由就是 C1 那一跤：`done` 一记，A49 / A60 就把返工路封了。
     ```powershell
     add --node R1 --event done --agent requirement#1 --note "review.requirement.md <PASS|FAIL> p1=<n> p2=<n>；两路/三路裁决=<一句话>；F-009 结论=<一句话>"
     add --node R1 --event done --agent lesson#1      --note "review.lesson.md <PASS|FAIL> p1=<n> p2=<n>；新增候选 <n> 条；F-009 结论=<一句话>"
     ```
   - 同一条 P1 往返 **3 轮仍不收敛**就停下按第 12 条交编排（R1 没有 decider 行，别自己发明决策链）。
   - **不许为「有纠偏可展示」制造假问题或诱导 reviewer 报假 P1，也不许为收工把 FAIL 记成 PASS。**
     两路都 PASS、零 P1 是完全合法的结果，如实写就是。
9. **拉 scribe（在两路 reviewer 都记了 `done` 之后）**——agent 表 trigger 列为空是模板约定例外，
   note 写死「监工在全部 reviewer done 后拉起」，**早拉就是空收敛**。复用 `wH:p3` 的 devin 进程：
   `herdr agent get scribe` → `wait --until idle` →
   `add --node R1 --event agent_launch --agent scribe#1 --note "launch=devin swe-2-medium permission-mode=normal cwd=RLT_21树 复用 wH:p3 进程"`
   → `herdr agent prompt scribe "<派活 prompt>"` → 核真提交。

   scribe 派活 prompt 首行 `[relay-light] worker · node=R1 · agent=scribe#1 · workspace=docs/modules/relay-light/workspace/RLT_21`，
   正文写死这几块：

   - **允许写的文件恰好三个**：`docs/modules/relay-light/workspace/RLT_21/review.md`、
     同目录 `progress.md`、自己的完成信号 `done.scribe.R1.md`。
     **除这三个之外不新建、不修改、不删除任何文件**——特别是 **不许改 `findings.md` / `lesson_candidates.md` /
     `review.requirement.md` / `review.lesson.md` / `check.C*.md`**（各有各的写入者，A67 边界）。
   - **第 1 步 · 机器体检与四道闸（先体检、后收敛，顺序不许颠倒）**。本仓**没有 dev-harness 的 `dh` CLI**，
     四道闸按下面四组具名命令等价执行，**每闸都要贴命令全串 + 自然终态尾部 + 退出码**：
     - **闸 1 全量单测**：`python -m unittest -v tools/relay-light/test_relay_log.py`
       ——期望 `Ran 181 tests` / `OK` / `skipped=0` / exit 0，**对不上原样记录，不许粉饰**。
     - **闸 2 结构检查**：A140 三处监工模板（`SKILL.md` + 两份 adapter）命中「三者均无变化」与「不得中断」；
       A141 两份 adapter **各命中三段原文**；A143 命中「P2 不阻断」与四类 P1 原文。给出 grep 命令与命中行号。
     - **闸 3 卫生与边界**：`git diff --check`；四集合允许路径检查
       （`git diff --name-only master...HEAD`、working tree、index、untracked），越界即报。
     - **闸 4 账本体检**：**你（监工）在 RLT_12 树跑** `lint` 与 `status` 并把原文交给 scribe 登记
       ——**scribe 不跨树、不调账本命令**（`execution_strategy.md` 的硬约束）。
     这四闸的口径是**本节点的落地裁决，不改验收、不改 oracle**；把「本仓无 `dh` CLI，四道闸按具名命令等价执行」
     这句话写进 `review.md` 的体检段，留痕。
   - **第 2 步 · miner 汇总**：以 `findings.md`（F-001~F-009）、`lesson_candidates.md`（L-001~L-004）、
     `progress.md` 与 `review.lesson.md` 为料，做**去重后的候选汇总**，**只写进 `review.md` 的 miner 段**。
     **不许 append 任何 knowledge 文件**——`docs/modules/relay-light/` 下没有 knowledge 目录，
     dh-relay 模块的 `knowledge/教训库-候选.md` **不在本卡 allowed-paths 内**，碰了就是越界。
   - **第 3 步 · 收敛 `review.md`**（W1 已建骨架，按现有分区填，不重排版、不删既有行）：
     「Normal Recipe 路径登记」三行填实（`code-round1` 行按 requirement 路的裁决如实标注结论与去向，
     **不许自己判定它「已覆盖」**）；「独立复核区」填两路的复核者身份 / 模型 / 结论 / 发现级别 / 报告文件；
     「批次小审登记」把 W / C1 / C2 三行的结论与证据补齐（W1 PASS、C1 FAIL p1=3 已转 C2、C2 PASS p1=0 p2=1）；
     「有效单测候选」按两路复核的选点如实登记（复核侧没选点就写「本轮未选点」，不许替它选）；
     「AI 提交区」与「完成条件逐条挂证据」两表按七条验收挂上 commit SHA 与验证命令；
     **新增一段「体检与四道闸」和一段「miner 汇总」**，内容即第 1、2 步的产出。
   - **第 4 步 · 补 `progress.md`**：把 R1 的过程账补齐——两路 reviewer 的拉起与结论、P1/P2 计数与路由去向
     （哪些交 X、哪些 R1 内改）、四道闸命令与退出码、miner 汇总条数、commit SHA。
     `evidence=` 引用的东西必须先在证据账里登记。
   - **第 5 步 · 提交未提交的工作区文件**：在 RLT_21 树把第 0 条列出的那批文件 + 本节点新产出
     （`review.requirement.md`、`review.lesson.md`、`review.md`、`progress.md`、各 `done.*.R1.md`）
     **逐个点名 `git add` 后 commit 到 `wt/RLT_21`**（scope 用英文 `relay-light`；**禁 `git add -A` / `git add .`**；
     **不 push、不建 PR、不合 master**）。commit 前跑一次 `git status --porcelain` 与四集合检查，确认无越界文件被捎带。
   - 完成方式：四行小结 → 写 **`workspace/RLT_21/done.scribe.R1.md`**
     （一行：`task=RLT_21 role=scribe node=R1 status=DONE evidence=<commit SHA> next=monitor`；
     **文件名带 `.R1` 后缀，别覆盖 C 阶段的 `done.scribe.md` / `done.scribe.C2.md`**）→ 即停。
10. **等 scribe 并收产出**：同第 7 条的轮询姿势。返回后自己核：`review.md` 五块是否都填了（路径登记 / 独立复核区 /
    批次小审 / 体检与四道闸 / miner 汇总 / 提交区）、四闸命令与退出码是否原样在、`progress.md` 是否补齐、
    commit 是否只打 `wt/RLT_21` 且无越界文件、`done.scribe.R1.md` 是否在。合格才
    `add --node R1 --event done --agent scribe#1 --note "review.md 收敛完成；四道闸 <结论摘要>；miner <n> 条；commit=<sha>"`。
    不合格就发整改回 scribe 的 pane（同一实例，不新增 attempt）。
11. **异常出口**（照现行校验，别发明新写法）：
    - **静默超时**：worker 状态 `working` 但 pane 输出 **>20 分钟无变化** →
      `add --node R1 --event agent_lost --agent <名>#<n> --note "silence>20min"` → **同一个 pane** 关掉重拉 `#n+1`
      （`agent_launch` 的 attempt 必须恰为当前最大值 + 1），`attempt_max=3`。
    - **环境性 NOT_RUN**（起不来 / 沙箱拒写 / 输入通道冻结）：合法出口是 **`blocked` → `agent_lost` → 重拉**
      （DR-W-002 实证）。**R1 没有 decider 行，不拉 decider。**
      **不要写 `escalate --agent monitor#3 --note "decider=monitor#3 ..."`**——A69 只认 `decider=<名>#<n>` 或
      `strategist=<名>#<n>` 恰一个 helper token，监工不是合法 helper，写了必被拒。
      换档重拉时把事实写进 `agent_launch` 的 note（`launch_fix=<新档>`），**不要 `plan_amend`**
      （你这一侧跑的旧版账本里 `launch_fix=` 仍只是 note 文本、lint 不校验——计划注释 8 的已知缺口）。
    - **attempt_max 用尽仍 NOT_RUN**：按计划注释 5 由你拉 `strategist#1`
      （`codex -m gpt-5.6-terra -c model_reasoning_effort=high --sandbox workspace-write`），走 SKILL 的 strategist 链：
      `escalate`（记在卡住的那个 worker 名下，note 恰含 `strategist=strategist#1`）→ `agent_launch strategist#1`
      → `decision`（worker 名下，复述同一 helper）→ `done strategist#1` → **停在 `user_decision` 人闸**，
      按第 12 条交编排，不要自己代答。
    - **herdr 工具抖动**（`Os code 5` / `PermissionDenied`）：退避重试，**不算 agent 失联**，不记 `agent_lost`。
    - 任何 `add` 退出 2 / 3：**stderr 原样贴到终端并停下，不要绕过校验、不要改参数硬凑**。
12. **关节点与收尾**（顺序固定，`outcome` 取值看清楚）：
    - **关节点**：双判据成立（全部在场 agent 有终态 + `close` 列的 **scribe 已 `done`**）后
      `add --node R1 --event node_close --agent monitor#3 --note "requirement#1/lesson#1/scribe#1 均 done；review.md 已收敛；p1=<n> p2=<n>；commit=<sha>"`。
      **再说一次：reviewer 报 FAIL 不阻止关 R1**（`close=agent:scribe`）。
    - **`stage_result`**：`RLT_21:R#1` 只有 R1 一个节点，关掉即满足 A112。**账本只认四个 outcome**
      （`done` / `blocked` / `failed` / `cancelled`，`relay_log.py` 的 `STAGE_RESULT_OUTCOMES`）——
      **没有 `rework` 这个值，写了直接退 2**。按下表取值：

      | 现场 | outcome | 编排读到的 `suggested_action` | 含义 |
      |---|---|---|---|
      | 两路复核跑完，**零 P1** | `done` | `open_next_stage` | 编排开 F 阶段 |
      | 两路复核跑完，**有 P1 需改代码** | `done` | `open_next_stage` | **复核这件事做完了**；note 里写明打回项，编排按计划注释 6 追加 X1 并开 X 阶段 |
      | **R 阶段本身没跑成**（reviewer 起不来 / 节点关不掉 / 产出缺失） | `failed` | `relaunch_monitor` | 重拉监工重跑本阶段实例，**不是**开 X |
      | 需要**用户裁决**才能往下走（例如 F-009 被两路判为必须用户拍板且阻断） | `blocked` | `wait_user` | 停在人闸交编排 |

      **返工不是 `failed`**：`failed` 的路由是「重拉监工重跑 R#1」，不是「开 X 返工」；把返工写成 `failed`
      会让编排走错分路。返工的正确编码 = `outcome=done` + note 里的打回清单，**由编排决定开 X**。
      ```powershell
      python tools/relay-light/relay_log.py add --plan docs/modules/relay-light/relay/rlt12-win-01 --node R1 --event stage_result --agent monitor#3 --note "stage_id=RLT_21:R#1 outcome=done requirement=<PASS|FAIL> p1=<n> lesson=<PASS|FAIL> p1=<n> 全量单测 Ran 181 OK skipped=0；F-009 裁决=<一句话>；两路/三路裁决=<一句话>；打回项=<无 | P1-<编号> 需开 X 阶段: 一句话>；commit=<sha>" --config-dir ~/.claude/skills/relay-light/
      ```
      被拒就贴 stderr 停下，**不要硬凑、不要改 outcome 蒙混**。
    - 落账后**即停**，终端打印 **`MONITOR_DONE stage=R1 outcome=<done|failed|blocked>`**，并把交接事实一次说清：
      两路复核的结论与 P1/P2 计数、**F-009 的裁决**、**两路 / 三路口径的裁决**、四道闸的命令与退出码、
      `Ran <n> tests` 与 `skipped=<n>`、miner 汇总条数、commit SHA、**需要开 X 阶段的 P1 清单（逐条）**、遗留 findings。
    - **不写 `stage_close`**（编排的事），**不关终端空间 wH、不关 worker pane**（编排统一收；F1 可能还要复用 scribe）。
    - **不追加 X 节点、不写 `plan_amend`、不改 `relay_plan.md`**——计划注释 6 的追加动作由编排在开 X 阶段前做。
    - 需要用户裁决或节点走不下去、而 R1 又还没关时：按 SKILL 该写 `stage_result outcome=blocked`，
      但现行实现同样会被 A112 拒（节点未关）——**照写一次，把退出码与 stderr 原样留在终端当作 A137 缺口的现场证据**，
      **不要绕过校验、不要为了让它过去硬关节点**；随后打印
      `MONITOR_BLOCKED stage=R1 reason=<一句话>` 并停，交编排定夺，同时保留可复现的证据（命令、退出码、stderr 原文）。

## 派单纪律（承接 Windows 预演与 C 阶段实战，逐条落地）

- **审批菜单编号不得按固定数字（C 阶段实测踩过）**：Devin 与 codex 的审批菜单**编号随选项数量变化**。
  每次都要：① `herdr agent read <名>` 读菜单原文 → ② 找**写着「Yes (Approve once)」那一行**的编号 →
  ③ `herdr agent send-keys <名> <该编号>` → ④ 再 `read` 一次确认菜单已消失。
  **绝不选 bypass / 全放行、`Edit command`、`Describe change`、`No`**，也不替它降 `--permission-mode` 重拉。
- **等待一律轮询，不用 `herdr agent wait`（C 阶段教训）**：监工侧 `wait` 会间歇 `PermissionDenied`（Os code 5）。
  每 30 秒 `get` + `pane read` 一次，一轮约 9 分钟，未完再来一轮，**不结束回合空等**；工具报 Os code 5 就退避重试。
  （`herdr agent wait <名> --until idle` 这种**拉起前的短等**仍可用，抖动了就退避重试。）
- **真提交核验（DR-W-003，Windows 约 75% 命中）**：`herdr agent prompt` 发出后必须核真提交——
  `herdr agent get <名>` 看 `state_change_seq` 变化且 `status` 转 `working`；停在输入框（seq 不动 /
  `agent_prompt_stalled`）就补 `herdr agent send-keys <名> enter` 再复验；终极判据 = `herdr agent read`
  看输入框已清空。输入通道整体冻结则该实例弃用，按第 11 条 `agent_lost` 在同 pane 拉 fresh 实例。
- **显式钉模型档（DR-W-007）**：任何 codex 启动串都要带 `-m`，裸启会跑成账号默认模型。
- **复核角色一律 `workspace-write`（DR-W-001）**：`--sandbox read-only` 在 Windows 能读但拒写一切文件，
  产出落不了盘等同失联。「只读」由 prompt 约束承担，见第 4、6 条。
- **两路 reviewer 必须 fresh、必须并行**：fresh 的理由见「进程与 pane 安排」；并行的理由是 agent 表 trigger 列为空。
  一路的报告**不许拿给另一路当输入**（会污染独立性）；两份报告的分歧由你如实带进 `review.md`，不做裁判。
- **整改路由挂 live agent（DR-W-004）+ `done` 压到路由判定之后（C1 教训）**：见第 8 条，这是本节点的第一纪律。
- **完成信号一律带 `.R1` 后缀**：`done.requirement.R1.md` / `done.lesson.R1.md` / `done.scribe.R1.md`。
  **不许覆盖 C 阶段的同名信号文件**，也**不许往 `progress.md` 追加完成信号**——`progress.md` 是 scribe 独占（A67）。
- **记账不漏、不自造**：每一次拉起与每一个终态都要落账本，事件名只用 SKILL 词表里的
  （`agent_launch` / `checkpoint` / `blocked` / `escalate` / `decision` / `user_decision` / `resume` /
  `done` / `agent_lost` / `cancelled` + 控制事件 `node_start` / `node_close` / `stage_result` / `monitor_restart`），
  不要发明 `monitor_helper`、`relaunch`、`retry` 之类新词。
- **只拉本节点的 agent**：R1 只有 requirement / lesson / scribe 三行（加按需的 strategist）。
  **不拉 coder、不拉 decider、不拉 checker**；**F1 的 scribe 不准提前拉**；也不回头给 C 阶段的终态 agent 补事件。

## 硬边界

- 不 `push`、不建 PR、不合并、不动 `master`；commit 只打 `wt/RLT_21`，且只有 scribe 这一次提交。
- **不改 RLT_12 树除账本以外的任何文件**——`relay_plan.md`、`dispatch/`、开发方案都不动。
- 不改 `docs/modules/relay-light/design/`（禁区），不改验收 ID，不改 `task_plan.md` / `brief.md` 的验收编号与切法，
  **不改 oracle**（F-009 的分歧由复核给结论、编排/用户裁决，谁都不许顺手把期望数字改掉）。
- **不回头改 C 阶段的账本行、不改 `check.C1.md` / `check.C2.md`**——C 阶段是已关闭的既成事实。
- **不追加 X 节点、不写 `plan_amend`、不拉 coder**：R1 内不改代码，代码类 P1 一律交编排开 X。
- 不碰 dh-relay 模块的 `knowledge/**`、`tools/tests/`、现役 Runner、两侧用户级 skill 副本。
- 不跑 `install_skill.py`、不做双侧 skill 重同步（须用户当次明确授权，且不在 R 阶段）。
- 凭据 / 密钥值永不进 prompt、note、工件、账本；证据先按白名单过滤（A27）。
- 不越权替用户裁决；不自授权超限继续；不为「有纠偏可展示」制造假问题，也不为收工把 FAIL 记成 PASS。

## 授权记录

用户 2026-09-14 已授权：RLT_12 D-start（Issue #23，树 `wt/RLT_12`）；本计划 `rlt12-win-01` 的计划内业务卡 =
RLT_21（Issue #21，施工树 `wt/RLT_21`）；各节点的委托按计划 agent 表的默认档位执行，不逐个再问；
接受 A112 / NOT_RUN 已知缺口（迁移表下无 `blocked` 终态 agent，环境性 NOT_RUN 走 `blocked → agent_lost` 重拉，
`launch_fix=` 仅为 note 文本不受 lint 校验；`stage_result` 对所有 outcome 都要求节点全关），
并冻结该口径为本次运行的证据基线。

编排 2026-09-15 追加裁决（沿用并扩展 C 阶段的两条）：① C1 在 checker FAIL p1=3 下如实关闭、三条 P1 由 C2 承接返工，
C2 已复审 PASS；② 本计划按 `dh-mapping.toml` 的 `[recipes.normal]` **两路**（requirement + lesson）跑 R1，
与 Issue #21 / `brief.md` 写的三路（含 `code-round1`）的口径分歧，由 **requirement 路在报告里给出统一结论**，
作为 RLT_21 收口输入，**本节点不补派第三路**；③ R 阶段两路 reviewer 必须是 fresh 实例，不复用 C 阶段 checker 进程；
④ 本仓无 dev-harness `dh` CLI，R1 的「机器体检与四道闸」按第 9 条的四组具名命令等价执行，属落地口径、不改验收。
