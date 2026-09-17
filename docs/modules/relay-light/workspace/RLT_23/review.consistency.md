# RLT_23 · R2 一致性路复核（reviewer-consistency，fresh 独立路）

复核对象：`wt/RLT_23` @ `cb5be21`（`git log master..HEAD` 四笔：W1 `199f92e` / C1 `f7c62c4` / C2 `4bd6f30` / C2-check 记录 `cb5be21`）。复核者未参与施工；全部结论经独立回读原始来源（design §11 `HC-RL-A140`/`A151`~`A154`、DevPlan「#### RLT_23」、RLT_11 `findings.md` F-003/F-005/F-006/F-007、三份 skill 文本现状）并自跑 grep 与两条规定回归得出，不采信施工者自述。

## 结论

APPROVE（P1=0，P2=0；另登记观察 1 条）

## 逐条判据

| # | 判据 | 结论 | 级别 | 依据（文件:行） | 整改动作 |
|---|---|---|---|---|---|
| 1 | A151：派活纪律段与两 adapter 编排/监工模板**三处**各含「读 pane 末行确认实际投递 / `queued` 时补 `send-keys enter` 并复核送达 / 未确认投递不得当作已通知」原文；无「发出即视为送达」类软表述 | PASS | — | 自跑 grep：整句逐字命中恰 3 处——`SKILL.md:34`（新增 `## 派活纪律与监工判活`）、`adapter-claude-code.md:79`、`adapter-codex.md:78`（两 adapter 的 `## 派活提交纪律` 内）；三要素各自逐字在句。软表述反查 `发出即\|即视为送达\|视为已送达\|视为送达\|发出即算\|发出后视为` 零命中（exit 1）；扩展扫 `送达\|投递\|通知` 全部残留行后确认无其它软口径。注：adapter 落点在监工「派活提交纪律」节，句子本身行为者中立（「向 agent 发通知后」），覆盖 F-005 实跑的编排→监工通知场景 | 无 |
| 2 | A152：两 adapter 各命中主控侧分叉表述；全 skill 无「codex 一律 bypass」类无条件措辞；原「环境预检」无条件 bypass 句已改分叉口径 | PASS | — | 分叉逐字命中：`adapter-claude-code.md:51-52`、`adapter-codex.md:50-51`，`SKILL.md:38` 同句。`git diff` 证实原 `## 环境预检（拉起前）` 无条件句已被删除、替换为 Claude/Codex 两分叉 + 「Codex 主控侧机制细节」段（`adapter-claude-code.md:54` / `adapter-codex.md:53`），只读启动失败、连续 `NOT_RUN`、prompt 只读约束、`launch_fix=`、不改 `launch` 列不走 `plan_amend` 均保留且附着 Codex 主控条件。自跑反查：`codex.{0,16}一律.{0,16}bypass\|总是\|所有 codex\|无条件.{0,12}bypass\|^拉起每个 agent 前.*改用 bypass` 零命中（exit 1）；全部 6 处 `bypass` 命中逐行人工核过，凡实际建议 bypass 的句子均带 Codex 主控 + 只读失败 + 连续 `NOT_RUN` 条件 | 无 |
| 3 | A153：监工模板命中三要素（pane 无 `Running tools` 计时器在走、账本无该 agent 新行、Herdr `agent get` 非 working）与「不得单凭 pane 状态」原文；与 A140「三者均无变化才中断」口径一致 | PASS | — | 整段逐字命中恰 3 处——`SKILL.md:36`、`adapter-claude-code.md:101`、`adapter-codex.md:100`（两 adapter 新增 `## agent_lost 判活（监工模板）`，位于 `## stalled 处置` 与 `## ledger_silent 处置` 之间）。人工核：三要素以「必须同时确认 …；不得单凭 pane 状态判死重拉」同句合取给出，非散词命中；「长 `sleep` 中也会被报 `done`」限定俱在。A140 原文 `SKILL.md:182-186`、`adapter-claude-code.md:107-109`、`adapter-codex.md:106-108` 未动；新句「`ledger_silent` 仍按 A140 核…三者均无变化才中断；任一仍在变化不得中断」为同向引述，无矛盾。语义上较 DevPlan 目标句「计时器**或**账本 DONE 行」更严（三要素合取），方向一致不算矛盾 | 无 |
| 4 | A154：F 阶段模板收口清单含独立 checklist 行「确认对应 worktree 已删（`git worktree list` / `git branch` 核对），先关终端空间再删树」，可勾选而非软提醒 | PASS | — | `SKILL.md:127-129`：`### F 阶段模板` scribe 表闭合后、`## 账本用法` 前新增 `**F 阶段收口 checklist**` + `- [ ]` 行，逐字与 oracle 一致且未勾选；`sed` 区间 + `grep -c -F` 实测命中 1。F 表 node/agent 行未动 | 无 |
| 5 | 结构回归：复跑两条规定命令记退出码；SKILL.md 既有模板（W/C/R/X/F 表头、A140 原文、硬规则编号）未被破坏 | PASS | — | 本复核者实跑：`cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log test_install_skill` → `Ran 210 tests` `OK` exit 0；仓根 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` → `RELAY ALL PASS (SKIPPED: 1)` exit 0。`git diff master` 对 `SKILL.md` 为纯新增（+12/−0），W/C/R/X/F 五张模板表头、R 模板、硬规则 1–11 编号、`ledger_silent` 处置段逐字未动（A149/A140 结构断言测试均绿） | 无 |
| 6 | 允许路径四集合核对：改动完全落在 `tools/relay-light/skill/**` 与 `workspace/RLT_23/**`；区分 pre-existing 与新增 `__pycache__` | PASS | — | `git diff master --name-only` 22 文件全在闭集（3 份 skill 文本 + 本卡 workspace）；`git diff --name-only` / `git diff --cached --name-only` / `git ls-files --others --exclude-standard` 现时增量仅 R 节点复核工件，亦在 workspace 内；`git diff --check` exit 0；`find` 全树无 `__pycache__`/`*.pyc`，`git status --ignored` 空——无 pre-existing 亦无新增 | 无 |
| 7 | 非目标：未动账本 schema/事件类型、design 正文、herdr、历史 workspace 工件 | PASS | — | diff 名单无 `tools/relay-light/*.py`（`relay_log.py`/`test_relay_log.py`/`test_install_skill.py`/`install_skill.py`）、无 `design/`、`dev_plan/`、`AGENTS.md`、无其它卡或历史 workspace；全 diff 仅 2 行删除，恰为两 adapter 原无条件 env-precheck bypass 句（预期内收窄）；账本词表未增事件类型 | 无 |

## 范围外发现

- **（观察）A152 落盘句省略成因**：design §11 `HC-RL-A152`（`01-...md:1332`）与 DevPlan `P1-...md:436` 的括号理由「该 flag 被本地 auto 分类器拦」未进三处 skill 文本（`task_plan.md:58` 冻结 oracle 即只保留「默认 sandbox 已够」半句，施工与冻结原文一致）。规范面（分叉 + 无条件措辞禁令）完整无缺；丢的是「为何不加」的实证理由——换一台不拦 bypass 的 Claude 主控机时，读者无从判断该规则是否本机限定。仅记一笔，不阻断（教训路 `review.lesson.md` 范围外观察亦登记同一事实）。
