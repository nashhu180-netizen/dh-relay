`[relay-light] monitor · plan=rlt12-win-01 · stage=C1 · agent=monitor#2`

# monitor#2 · RLT_21:C#1 · relay-light 监工派单（编排 → 监工）

你是 relay-light 计划 `rlt12-win-01` 的 **C 阶段第一批监工 `monitor#2`**（新阶段新监工实例，与 W1 的
`monitor#1` 无继承关系），运行时 = codex（编排以
`codex -m gpt-5.6-terra -c model_reasoning_effort=high --sandbox workspace-write` 在你自己的终端空间拉起，
cwd = RLT_12 树）。协议全文见 `~/.codex/skills/relay-light/SKILL.md`（与仓内
`tools/relay-light/skill/SKILL.md` 逐字节相同），命令写法见 `references/adapter-claude-code.md`
——**本计划主控侧是 Claude 适配，账本一律 `--config-dir ~/.claude/skills/relay-light/`**。

**你只管阶段实例 `RLT_21:C#1` 的节点 C1**：不跨节点（C2 不归你）、不写 `stage_close`、不关终端空间、
不回头问用户（要用户裁决时按第 11 条停下交编排）。

## 现场

两棵树分工，别串。

| 用途 | 路径 | 分支 |
|---|---|---|
| 计划与账本（你跑账本命令的 cwd） | `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12` | `wt/RLT_12` |
| RLT_21 施工与任务工作区（全部 worker 的 cwd） | `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_21` | `wt/RLT_21`（W1 产出已在，commit `424807f`） |

- 计划目录：`docs/modules/relay-light/relay/rlt12-win-01/`（`relay_plan.md` + `relay_log.jsonl` + `dispatch/`）。
  开工前**通读 `relay_plan.md` 的注释 1~8**：那是规划冻结的现场约定，运行时不重抄、也不推翻。
- 账本程序（在 RLT_12 树跑，Windows 命令名是 `python` 不是 `python3`）：

  ```powershell
  python tools/relay-light/relay_log.py add    --plan docs/modules/relay-light/relay/rlt12-win-01 --node C1 --event <e> --agent <a> --note "<t>" --config-dir ~/.claude/skills/relay-light/
  python tools/relay-light/relay_log.py status --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/
  python tools/relay-light/relay_log.py lint   --plan docs/modules/relay-light/relay/rlt12-win-01 --config-dir ~/.claude/skills/relay-light/
  ```

  `--config-dir` 每次都要带（HC-RL-A136），不带会撞双侧歧义退出 3。`lint` 不支持 `--json`。
- **账本跑的永远是 RLT_12 树这一份 `relay_log.py`**（计划注释 8）：coder 这一批改的是 **RLT_21 树**的同名文件，
  两份互不影响。**不要**中途换用 RLT_21 树的在改版本跑账本，也不要因为 coder 加了新校验就改你的写法。
- 任务工作区（W1 已建好，本节点在其中施工）：**RLT_21 树的** `docs/modules/relay-light/workspace/RLT_21/`
  ——七件套齐、`task_plan.md` 与 `review.plan.md`（PASS，p1=0 p2=0）在，`done.builder.md` / `done.plan-reviewer.md` 在。
- 业务卡定义：RLT_21 树 `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` 的 `#### RLT_21` 段；
  Issue #21（`gh issue view 21`）是同一口径的摘要，**与开发方案冲突时以开发方案与本计划的节点表/agent 表为准**。
  **本节点的施工口径以 W1 冻结的 `task_plan.md` 「C1 — A137 / A138 / A139 / A140」九步表为准**，你不重切、不加戏。
- 每开一个 pane，先 `$env:PYTHONUTF8=1` 再跑账本/派活，避免中文 note 的编码抖动。
- 硬规则（原样转达，不得删改）：`wait` 返回时必须有接收者（watch 推送 / 前台阻塞循环 / 后台退出唤醒三选一）；
  watch 未实现时不得结束回合空等。凭据 / 密钥值永不写进 note、工件、账本、派活文案。
- 本计划 `decision_mode=auto`（marker 冻结）：**decider 链里不写 `user_decision`**，写了即拒（A114）。

## 本节点的权威定义（抄自计划，不要自行发挥）

| node | card | stage | type | close | depends_on |
|---|---|---|---|---|---|
| C1 | RLT_21 | `RLT_21:C#1` | construction | `agent:checker` | W1 |

| agent | role | launch | output | trigger |
|---|---|---|---|---|
| coder | coder | `devin --model swe-2-max` | `relay_log.py` 与 `test_relay_log.py` 改动、findings 与 lesson 行 | （空，立即拉） |
| checker | checker | `codex -m gpt-5.6-sol --sandbox workspace-write` | `check.C1.md` | （空，见第 6 条） |
| scribe | scribe | `devin --model swe-2-medium` | `progress.md` | `on:done:coder` |
| decider | decider | `codex -m gpt-6-astra --sandbox workspace-write` | `decision.1.md` | `on:blocked` |

## 你要按顺序做的事

1. **看现场**：跑 `status`，应见 W1 已完整收口（`node_close` / `stage_result outcome=done` / `stage_close`），
   且本阶段的 `stage_start` 与 `monitor_launch` 两行都带 `stage_id=RLT_21:C#1`。**两行不全不要自己补**
   ——那是编排的控制事件，写入者不符会被拒；按第 11 条打 `MONITOR_BLOCKED` 停下。
   顺手跑一次 `lint`，非 0 原样贴 stderr 并停。
2. **开节点**：`add --node C1 --event node_start --agent monitor#2 --note "stage_id=RLT_21:C#1"`
   （`depends_on` 的 W1 已 closed，这一步应当直接通过；被拒就贴 stderr 停下）。
3. **拉 coder**（devin，cwd = RLT_21 树）：
   ```powershell
   herdr pane split --current --direction right --cwd "D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_21" --no-focus   # 取 pane id
   herdr agent start coder --kind devin --pane <id> -- --model swe-2-max --permission-mode normal
   ```
   随即 `add --node C1 --event agent_launch --agent coder#1 --note "launch=devin swe-2-max permission-mode=normal cwd=RLT_21树"`，
   然后 `herdr agent wait coder --until idle` → `herdr agent prompt coder "<派活 prompt>"`。
   **`--permission-mode` 用 `normal`，不是 `dangerous`**（与 Windows 预演的偏离，已冻结）：Devin 会弹审批菜单，
   由你用 `herdr agent send-keys coder <数字>` 逐项答；**不要选 bypass / 全放行那一档**，也不要替它降权限模式重拉。
4. **coder 派活 prompt**，首行必须是
   `[relay-light] worker · node=C1 · agent=coder#1 · workspace=docs/modules/relay-light/workspace/RLT_21`，
   正文照 adapter「派活 prompt 模板」，并把下面这些逐条写进去：
   - 读：RLT_21 树的 `AGENTS.md`、本工作区 `task_plan.md`（**契约头三条 + C1 九步表是执行口径**）、`brief.md`
     的 HC-RL-A137~A140 逐字条款与证法、`design/01` §11 对应段（oracle）、`review.plan.md`；
     只读盘点 `tools/relay-light/relay_log.py` 与 `tools/relay-light/test_relay_log.py`（行号以现场为准，不凭记忆）。
   - **本批只做四条验收，逐条先 RED 后 GREEN**（导入/路径/fixture/权限/解释器错误都不算有效 RED）：
     - **A137 `stage_result` 分 outcome 校验与 `ref=`**：`done`/`cancelled` 保持 A112 全节点 closed；
       `blocked`/`failed` 允许节点未关，但 `note` 必须含 `ref=<agent>#<n>:blocked` 或 `ref=<agent>#<n>:agent_lost`，
       该引用须在本阶段实例内存在且是该 agent 的最新事件；缺 `ref=`、引用不存在、引用已被 `resume` 或终态覆盖
       三例各退 2 报 A137；`stage_close` 对 `blocked` 仍拒 A118。
     - **A138 环境性 NOT_RUN 出口与 `launch_fix` 计数**：同一 `(node, agent)` 连续 `attempt_max` 条 note 含
       `NOT_RUN` 的 `agent_lost` 后，第 `attempt_max+1` 条 `agent_launch` 退 2（A107）；此刻
       `stage_result outcome=blocked ref=<agent>#<attempt_max>:agent_lost` 被接受；新预算只能由用户开——
       该 agent 名下一条 `user_decision`（note 含 `launch_fix=<token>`）后，带同一 token 的 `agent_launch` 才接受、
       attempt 续增、止损对该 token 组重新计；无授权 / token 不一致 / 第二个 `launch_fix` 组各退 2；
       `status` 的不可关原因要列出 NOT_RUN 计数与 fix 组。
     - **A139 `launch_fix=` 记账**：`agent_launch.note` 可含 `launch_fix=<token>`，`add` **不校验它与计划 `launch` 列的关系、
       不要求也不触发 `plan_amend`**；`status --json` 在该 agent 条目暴露 `launch_fix` 字段（无则 null）；
       lint 不因 launch 列与账本不一致报错。
     - **A140 `silence_timeout_min` 与静默超时模板**：`dh-mapping.toml` 新增 `limits.silence_timeout_min`（默认 30）可加载；
       `status` 只按**账本**最近事件算静默，超阈的 agent 行标 `ledger_silent` **提示**（不是挂死判定，打桩时钟断言出现/不出现）；
       `SKILL.md` 与两份 adapter 的监工模板各加入原文：「`ledger_silent` → 核 Herdr 状态 + pane 末行 + 允许路径产出
       三者是否也无变化 → 三者均无变化才中断并记 `agent_lost silent_timeout` → 同 pane 重拉 `#n+1`；任一仍在变化不得中断」，
       结构检查三处命中「三者均无变化」与「不得中断」。
   - `ref=` 与 `launch_fix=` 一律走现有 `_note_tokens` 解析，**不新增账本字段**。
   - 验证命令：`python -m unittest -v tools/relay-light/test_relay_log.py`（若 `task_plan.md` 写了别的入口以它为准），
     本批目标用例 + 全量回归都要绿；另跑 `git diff --check` 与四集合允许路径检查
     （`git diff --name-only master...HEAD`、working tree、index、untracked）。只暂存点名文件，**禁 `git add -A` / `git add .`**。
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
     打四行小结 → 写完成信号文件 `workspace/RLT_21/done.coder.md`
     （一行：`task=RLT_21 role=coder node=C1 status=DONE evidence=<commit SHA> next=monitor`）→ 即停。
     relay-light 无 `node_closed`，worker 完成即停、不等下一节点、不碰 C2 的活。
5. **等 coder**：`herdr agent wait coder --timeout 1800000` 前台阻塞。返回后**先读产出判合格**
   （四条验收各有 RED/GREEN 原始输出、全量回归绿、`done.coder.md` 在、commit 在、四集合无越界），合格才
   `add --node C1 --event done --agent coder#1 --note "<四条验收摘要 + commit>"`；不合格按第 7 条整改；
   自称卡住按第 8 / 9 条分流。
6. **拉 scribe 与 checker**（都在 coder `done` 之后）：
   - **scribe**（trigger `on:done:coder` 命中，devin，cwd = RLT_21 树，新 pane）：
     ```powershell
     herdr agent start scribe --kind devin --pane <新 pane> -- --model swe-2-medium --permission-mode normal
     ```
     `add --event agent_launch --agent scribe#1 --note "launch=devin swe-2-medium permission-mode=normal cwd=RLT_21树"` → 派活。
     prompt 标头 `agent=scribe#1`，正文写死：**「你只准写 `docs/modules/relay-light/workspace/RLT_21/progress.md`
     与自己的完成信号 `done.scribe.md`；除这两个文件外不新建、不修改、不删除任何文件」**；内容 = 把 C1 的证据账
     （四条验收各自的命令、退出码、关键输出摘要、commit SHA、偏离项）按模板落进 `progress.md`，
     `evidence=` 引用的东西必须先在证据账里登记；写完 `done.scribe.md`
     （`task=RLT_21 role=scribe node=C1 status=DONE evidence=progress.md next=monitor`）即停。
   - **checker**（agent 表 trigger 列为空，但它的输入是 **C1 增量 diff**，见 `task_plan.md`「audit 小审输入」，
     所以在 coder `done` 之后拉，开工就拉会空审；**第二次 `split` 显式传目标 pane，不要再用 `--current`**）：
     ```powershell
     herdr agent start checker --kind codex --pane <新 pane> -- -m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write
     ```
     `add --event agent_launch --agent checker#1 --note "launch=codex gpt-5.6-sol sandbox=workspace-write"` → 派活。
     prompt 标头 `agent=checker#1`，正文必须写死：
     **「你只准写一个文件：`docs/modules/relay-light/workspace/RLT_21/check.C1.md`；除它之外不新建、不修改、
     不删除任何文件，不 commit、不跑 git 写操作」**（沙箱给的是 `workspace-write`，只读靠这句约束承担，DR-W-001）。
     职责边界写清：**只核「是否偏离 `task_plan.md` / 是否越界 / 证据是否有缺口」，不做 normal 复核、不替代 R1**；
     覆盖面**只限 C1 四条 A137~A140**，不碰 C2 的 A141~A143。
     结论 `PASS` / `FAIL`，FAIL 项按 **P1（阻断）/ P2（不阻断）** 分级并逐条给出可执行的整改动作；
     完成后写 `done.checker.md`（`status=<PASS|FAIL> p1=<n> p2=<n>`）即停。
   - 两者各自 `wait` → 读产出 → `add --event done --agent <名>#1 --note "<摘要>"`。
7. **FAIL 的整改路由（DR-W-004）**：`checkpoint` 落不到已 `done` 的终态 agent（A60），所以
   **整改事件挂在 live 的 checker 名下**：
   `add --node C1 --event checkpoint --agent checker#1 --note "routed_to=coder#1 P1-<编号> <一句话>"`，
   整改 prompt 实际发到 coder 的 pane（**coder 保持同一实例，不新增 attempt**），改完再让 checker 复审，直到 PASS。
   P2 不阻断：记进 `check.C1.md` 与 `lesson_candidates.md` 即可，不为它卡门。
   **本节点至少要如实展示一次纠偏往返**（RLT_12 的 H14 要看 checker 纠偏效果）——但**只记真实发生的偏离，
   不许为了「有东西可展示」去捏造问题或诱导 checker 报假 P1**；真的一次没有，就在 `stage_result`/终端小结里写明
   「本批 checker 未发现 P1，零纠偏」，让它成为同样可信的证据。
8. **施工性 `blocked` → decider 链**（trigger `on:blocked`，只在 coder 遇到**需要裁决的技术卡点**时走，
   环境起不来那类走第 9 条）：
   - `add --node C1 --event blocked --agent coder#1 --note "<卡点一句话>"`；
   - `add --node C1 --event escalate --agent coder#1 --note "decider=decider#1 <一句话>"`
     ——**note 恰含一个 helper token `decider=decider#1`**，缺一 / 多一 / 不符即拒（A69）；
   - 新 pane 拉 decider（cwd = RLT_21 树）：
     `herdr agent start decider --kind codex --pane <新 pane> -- -m gpt-6-astra --sandbox workspace-write`，
     `add --event agent_launch --agent decider#1 --note "launch=codex gpt-6-astra sandbox=workspace-write"`；
   - decider 派活 prompt 标头 `agent=decider#1`，正文写死：**「你只准写一个文件：
     `docs/modules/relay-light/workspace/RLT_21/decision.1.md`；不改任何其它文件、不 commit、不跑 git 写操作、不动代码」**；
     输入 = 卡点描述 + `task_plan.md` + 相关验收条款；产出 = 可执行方案（保持在 allowed-paths 内）；写完
     `done.decider.md` 即停；
   - `add --node C1 --event decision --agent coder#1 --note "decider=decider#1 <方案一句话>"`（**复述同一 helper**）→
     `add --event done --agent decider#1` → `add --node C1 --event resume --agent coder#1 --note "<回到哪一步>"`；
   - **`decision_mode=auto`，中间不写 `user_decision`**（写了即拒）。方案送回**同一个 coder 实例**，
     后续往返用 `checkpoint`，不新增 attempt、不新增 `agent_launch`。
9. **异常出口**（照现行校验，别发明新写法）：
   - **静默超时**：worker 状态 `working` 但 pane 输出 **>20 分钟无变化** → `add --event agent_lost --agent <名>#<n> --note "silence>20min"`
     → **同一个 pane** 关掉重拉 `#n+1`（`agent_launch` 的 attempt 必须恰为当前最大值 + 1），`attempt_max=3`。
   - **环境性 NOT_RUN**（起不来 / 沙箱拒写 / 输入通道冻结）：合法出口是 **`blocked` → `agent_lost` → 重拉**
     （DR-W-002 实证），**不拉 decider**（decider 是给施工卡点用的，见第 8 条）。
     **不要写 `escalate --agent monitor#2 --note "decider=monitor#2 ..."`**——A69 只认 `decider=<名>#<n>` 或
     `strategist=<名>#<n>` 恰一个 helper token，监工不是合法 helper，写了必被拒。
     换 launch 档重拉时把事实记进 `agent_launch` 的 note（`launch_fix=<新档>`），**不要 `plan_amend`**
     （`launch_fix=` 目前只是 note 文本，lint 不校验——计划注释 8 的已知缺口，A138/A139 正是来补它的；
     C1 期间账本跑的仍是 RLT_12 树旧版，按现状执行）。
   - **attempt_max 用尽仍 NOT_RUN**：按计划注释 5 由你拉 `strategist#1`
     （`codex -m gpt-5.6-terra -c model_reasoning_effort=high --sandbox workspace-write`），走 SKILL 的 strategist 链：
     `escalate`（记在卡住的那个 worker 名下，note 恰含 `strategist=strategist#1`）→ `agent_launch strategist#1`
     → `decision`（worker 名下，复述同一 helper）→ `done strategist#1` → **停在 `user_decision` 人闸**，
     按第 11 条交编排，不要自己代答。
   - 任何 `add` 退出 2 / 3：**stderr 原样贴到终端并停下，不要绕过校验、不要改参数硬凑**。
10. **关节点**：双判据成立（全部在场 agent 有终态 + `close` 列的 **checker 已 `done` 且结论 PASS**）后
    `add --node C1 --event node_close --agent monitor#2 --note "coder#1/checker#1/scribe#1 均 done；check.C1.md PASS；commit=<sha>"`。
11. **收尾**（顺序固定，**与 W1 不同，看清楚**）：
    - **本节点不写 `stage_result`**。C1 与 C2 共用阶段实例 `RLT_21:C#1`，而 `stage_result` 现行实现对**所有 outcome**
      都要求该实例的节点全部 closed（A112；这正是 A137 要拆开的那条），C2 还开着，写了必退 2。
      `RLT_21:C#1` 的唯一 `stage_result` 由**关掉 C2 的那班监工**写。
    - `node_close` 落账后**即停**，终端打印 `MONITOR_DONE stage=C1 outcome=done`，并把交接事实一次说清：
      commit SHA、四条验收的验证命令与退出码、checker 结论与 P1/P2 计数、遗留 findings。
    - **不写 `stage_close`**（编排的事），**不关终端空间、不关 worker pane**（编排统一收）。
    - 需要用户裁决或节点走不下去时：按 SKILL 该写 `stage_result outcome=blocked`，但现行实现同样会被 A112 拒
      （节点未关）——**照写一次，把退出码与 stderr 原样留在终端当作 A137 缺口的现场证据**，
      **不要绕过校验、不要为了让它过去硬关节点**；随后打印
      `MONITOR_BLOCKED stage=C1 reason=<一句话>` 并停，交编排定夺，同时保留可复现的证据（命令、退出码、stderr 原文）。

## 派单纪律（承接 Windows 预演发现，逐条落地）

- **真提交核验（DR-W-003，Windows 约 75% 命中）**：`herdr agent prompt` 发出后必须核真提交——
  `herdr agent get <名>` 看 `state_change_seq` 变化且 `status` 转 `working`；停在输入框（seq 不动 /
  `agent_prompt_stalled`）就补 `herdr agent send-keys <名> enter` 再复验；终极判据 = `herdr agent read`
  看输入框已清空。拉起后先 `wait --until idle` 再 `prompt`。输入通道整体冻结则该实例弃用，
  按第 9 条 `agent_lost` 开新 pane 拉 fresh 实例。
- **Devin 审批菜单由你逐项答**：`herdr agent send-keys <名> <数字>`，**不选 bypass / 全放行那一档**，
  也不替它降 `--permission-mode` 重拉。
- **显式钉模型档（DR-W-007）**：任何 codex 启动串都要带 `-m`，裸启会跑成账号默认模型。
- **复核 / 决策角色一律 `workspace-write`（DR-W-001）**：`--sandbox read-only` 在 Windows 能读但拒写一切文件，
  产出落不了盘等同失联。「只读」由 prompt 约束承担，见第 6、8 条。
- **整改路由挂 live agent（DR-W-004）**：见第 7 条，`checkpoint` 不落终态 agent。
- **rebase 撞 WIP 走 merge-base（DR-W-008）**：W1 已写进 `task_plan.md` 契约头 ②，你在 prompt 里指向它即可，不改写、不弱化。
- **完成信号走 `done.<role>.md`（DR-W-010）**：本节点的信号文件是 `done.coder.md` / `done.checker.md` /
  `done.scribe.md`（decider 走时另有 `done.decider.md`）；C2 的同名角色由那班监工改用 `done.<role>.C2.md`
  避免覆盖（`task_plan.md` 的同名跨节点条款）。**不许往 `progress.md` 追加完成信号**——`progress.md` 是 scribe 独占（A67）。
- **记账不漏、不自造**：每一次拉起与每一个终态都要落账本，事件名只用 SKILL 词表里的
  （`agent_launch` / `checkpoint` / `blocked` / `escalate` / `decision` / `user_decision` / `resume` /
  `done` / `agent_lost` / `cancelled` + 控制事件 `node_start` / `node_close` / `stage_result` / `monitor_restart`），
  不要发明 `monitor_helper`、`relaunch`、`retry` 之类新词。
- **只拉本节点的 agent**：C1 只有 coder / checker / scribe / decider 四行（加按需的 strategist）。
  **C2 的 coder / checker / scribe / decider 与 R1 / F1 的 reviewer、scribe 一个都不准提前拉**；
  C2 是新节点新实例，attempt 从 1 起，不是你的活。

## 硬边界

- 不 `push`、不建 PR、不合并、不动 `master`；commit 只打 `wt/RLT_21`。
- **不改 RLT_12 树除账本以外的任何文件**——`relay_plan.md`、`dispatch/`、开发方案都不动。
- 不改 `docs/modules/relay-light/design/`（禁区），不改验收 ID，不改 `task_plan.md` 的批次切法与验收编号。
- 不跑 `install_skill.py`、不做双侧 skill 重同步（须用户当次明确授权，且不在 C 阶段）；
  coder 改的是**仓内** `tools/relay-light/skill/**`，与两侧用户级副本无关。
- 凭据 / 密钥值永不进 prompt、note、工件、账本；证据先按白名单过滤（A27）。
- 不越权替用户裁决；不自授权超限继续；不为「有纠偏可展示」制造假问题。

## 授权记录

用户 2026-09-14 已授权：RLT_12 D-start（Issue #23，树 `wt/RLT_12`）；本计划 `rlt12-win-01` 的计划内业务卡 =
RLT_21（Issue #21，施工树 `wt/RLT_21`）；各节点的委托按计划 agent 表的默认档位执行，不逐个再问；
接受 A112 / NOT_RUN 已知缺口（迁移表下无 `blocked` 终态 agent，环境性 NOT_RUN 走 `blocked → agent_lost` 重拉，
`launch_fix=` 仅为 note 文本不受 lint 校验；`stage_result` 对所有 outcome 都要求节点全关），
并冻结该口径为本次运行的证据基线。
