<!-- dh:v1 -->
# RLT_21 R1 requirement 独立复核

## 结论

**FAIL**

- P1：2
- P2：3
- 复核身份：requirement#1；只读审查候选 `4105da85368a8a9587a81941e8c8c7f9cf36a0da`，未修改代码、测试、合同、账本或既有工件。
- 判定边界：A137～A142 的当前实现与行为证据通过；A143 的模板结构通过，但历史复算数值 oracle 与冻结逐条计级规则冲突，不能宣称整条验收闭合。另有两个独立复核硬闸尚未形成 durable PASS。

## 独立复跑与边界证据

### 全量测试

命令：

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'; python -m unittest -v tools/relay-light/test_relay_log.py
```

自然终态：`Ran 181 tests in 502.087s`，`OK`，exit=0。输出无 `skipped=` 行；结合以下结构检查无 skip 装饰器，故本轮 **skipped=0**：

```powershell
rg -n '@unittest\.skip|@unittest\.skipIf|@unittest\.skipUnless' tools/relay-light/test_relay_log.py
```

结果：0 命中，`rg` exit=1；文件仅有运行环境缺 Git 时才触发的 `self.skipTest`（`test_relay_log.py:3954`），本轮 Git 可用且实际未 skip。A142 两条原负例及 cancelled 归属例均实际执行通过，入口见 `test_relay_log.py:4913,4925,4937`。

### 四集合 allowed-paths

复跑命令：

```powershell
git diff --name-only master...HEAD
git diff --name-only
git diff --cached --name-only
git ls-files --others --exclude-standard
git diff --check master...HEAD
git diff --check
git diff --cached --check
```

结果：

- base `master...HEAD`：仅 `tools/relay-light/{relay_log.py,test_relay_log.py,skill/**}` 与 `docs/modules/relay-light/workspace/RLT_21/**`；符合 `brief.md:81` 闭集。
- working tree：仅 `docs/modules/relay-light/workspace/RLT_21/progress.md`。
- index：空。
- untracked：仅 `docs/modules/relay-light/workspace/RLT_21/**` 下的小审、复核与完成信号；本报告落盘前未见闭集外项。
- 三条 `diff --check` 均 exit=0。

结论：当前四集合未超出闭集；历史 `.devin/config.local.json` 已不在任何集合，不能把已清理的旧越界当作当前越界。

## A137～A143 逐条裁决

| 验收 | oracle / 证法 | 实现与独立证据 | 裁决 |
|---|---|---|---|
| A137 | design `01-RelayLight-产品设计与验收.md:1258`；blocked/failed 始终强制最新同实例 `ref=`，done/cancelled 保 A112，blocked 后 stage_close 报 A118 | `_validate_result_ref` 在 `relay_log.py:2089-2130`；outcome 分路在 `:2168-2193`。行为例覆盖合法 ref、缺失/跨实例/陈旧 ref、全节点已关仍强制 ref、A118，见 `test_relay_log.py:5206-5322`；本轮全绿 | PASS |
| A138 | design `:1259`；连续 NOT_RUN 止损、用户只开一个同 token fix 组、组内重计、总预算封顶，status 列原因 | `_not_run_budget` 与两道授权闸在 `relay_log.py:1814-1901,1935-1955`；status 原因在 `:2473-2502`。四组行为例在 `test_relay_log.py:5405-5517`，本轮全绿 | PASS |
| A139 | design `:1260`；`launch_fix=` 仅 note 事实，不触发 plan_amend/lint，status JSON 有值/null | 投影在 `relay_log.py:2741,2936`；带/不带字段与 lint 零告警在 `test_relay_log.py:5563-5588`，本轮全绿 | PASS |
| A140 | design `:1261`；默认/覆盖阈值、按账本最近事件提示、三处模板原文 | 配置在 `relay_log.py:310-314`，提示在 `:2742-2746`；测试在 `test_relay_log.py:5635-5708`。结构命中：`skill/SKILL.md:173`、Claude adapter `:95`、Codex adapter `:94` 均含“三者均无变化/不得中断” | PASS（P2-2 保留终态范围澄清） |
| A141 | design `:1262`；两 adapter 各含三段 | Claude adapter：环境替代 `:49`、idle→prompt→末行/Enter `:72`、事件监听+2 分钟告警 `:84`；Codex adapter 对应 `:48,71,83`。结构测试入口 `test_relay_log.py:5116`，本轮全绿 | PASS |
| A142 | design `:1263`；consult/auto 模式门、cancelled 纳入 A69，去掉两 skip | `DECISION_EVENTS` 含 cancelled（`relay_log.py:63`），ownership 在 `:1748-1769`，mode gate 在 `:1772-1793`；三例入口 `test_relay_log.py:4913,4925,4937`，无 skip 装饰且本轮实际全绿 | PASS |
| A143 | design `:1264`；模板结构 + 历史五项复算应为 `1 P1 + 4 P2` | 结构文本在 `skill/SKILL.md:57`，结构测试 `test_relay_log.py:4544-4560` 通过；但 F-009（`findings.md:19`）按冻结四类逐项只能得 `3 P1 + 2 P2` | **PARTIAL / oracle 未闭合**（P2-1） |

## P1（阻断）

### P1-1 — C1 checker 的 FAIL 没有 durable 复审闭环，C2/R1 前置不成立

事实：`check.C1.md:6-9` 当前结论仍为 FAIL、P1=3；`done.checker.md` 只有 `status=FAIL p1=3 p2=0`，不符合 `task_plan.md:41` 的完整信号格式；`progress.md:18` 明写“复审结论未在本工作区落盘”。而 `task_plan.md:38,77` 冻结的是 C1 checker PASS 后才可进入 C2/R1。F-004/F-007 与当前代码/测试说明整改很可能已经完成，但施工方自述和全量绿不能代替 checker 的独立 PASS。

可执行整改：

1. 由非施工者 checker 复审当前 A137～A140 增量，在 `docs/modules/relay-light/workspace/RLT_21/check.C1.md` 保留原 FAIL 并追加“复审”段，明确旧三项 P1 的逐项 CLOSED/OPEN 与最终 PASS/FAIL。
2. 用完整格式新写不覆盖旧信号的 `docs/modules/relay-light/workspace/RLT_21/done.checker.C1.recheck.md`；随后只由 scribe 更新 `progress.md`。
3. 验证命令：

```powershell
python -m unittest -v tools/relay-light/test_relay_log.py -k RelayStageResultRefTests
python -m unittest -v tools/relay-light/test_relay_log.py -k "RelayNotRunRetryTests or RelayLaunchFixStatusTests or RelayLedgerSilenceTests"
python -m unittest -v tools/relay-light/test_relay_log.py
rg -n "复审|P1：0|PASS" docs/modules/relay-light/workspace/RLT_21/check.C1.md
```

若复审不是 PASS，按 X 节点返工；不得直接由 scribe 或 requirement reviewer 改写结论。

### P1-2 — normal 整体必做的独立 code-round1 尚未执行

事实：仓根 `AGENTS.md` 冻结 normal 为代码轮 1、需求方向、教训三路；`review.md:4,24,50` 也登记 code-round1 必做且仍“待编排派/待执行”。当前不存在 `review.code-round1.md`。`dh-mapping.toml:17-18` 的 normal 两路只定义 R-stage reviewer 行，不包含代码轮 1；两路 Recipe 展开不能替代整卡代码轮 1。

可执行整改：

1. 在 C1 checker durable PASS 后，由 monitor 派 fresh、非 coder 的 code-round1 reviewer，只读整卡 diff 与实现行为，输出 `docs/modules/relay-light/workspace/RLT_21/review.code-round1.md`。
2. 至少选 `review.md:38-42` 的一个有效单测变异点，登记“变异后目标断言红、恢复后全绿”的命令与自然终态；并复跑全量 181 tests。
3. 验证命令：

```powershell
Test-Path docs/modules/relay-light/workspace/RLT_21/review.code-round1.md
rg -n "^(## 结论|PASS|FAIL)|P1|变异|Ran 181 tests|OK" docs/modules/relay-light/workspace/RLT_21/review.code-round1.md
```

只有 code-round1、requirement、lesson 三条独立路径均闭合后，scribe 才可把 normal 复核写成完成。

## P2（不把口径分歧凑成 P1）

### P2-1 — A143 的数值 oracle 与冻结逐条计级规则不可兼得

独立复算：P1-01（目标扩围）与 P1-02（版本授权缺口）不属于 A143 冻结四类，均为 P2；P1-03（全员写 progress）、P1-03R（coder 入口仍写 progress）、P1-04（builder 写 lesson_candidates）每一项都直接命中“写入者边界”，逐条均为 P1。因此诚实结果是 **3 P1 + 2 P2**。若把后三项按“同一类别合并为一个 P1、其余残留降 P2”，才会得到 **1 P1 + 4 P2**，但这种聚合/折级规则不在 `SKILL.md:57` 或 design `:1264` 中。

明确结论：F-009 的 `3P1+2P2` 逐条复算正确；A143 的 `1P1+4P2` 期望当前不可证。此为合同口径冲突，不是当前模板实现缺陷，故记 P2，不升级为 P1，也不粉饰为 PASS。

收口责任：design/验收 owner（编排提交用户裁决）须二选一：

- 把 design/brief/task_plan 的期望改为逐条规则对应的 `3 P1 + 2 P2`；或
- 明文冻结可执行的聚合规则（例如同一“写入者边界”类别只保留一个 P1、其余残留降 P2），并新增确定性复算 fixture/测试。

选择前，coder/checker 无代码整改责任，F1 不得宣称 A143 数值 oracle 已闭合。

### P2-2 — A140 对终态 agent 是否提示 `ledger_silent` 未在 oracle 中说透

design `:1261` 与 brief 的字面是“超过阈值时该 agent 行标提示”；当前实现 `relay_log.py:2744` 明确排除终态，测试 `test_relay_log.py:5670-5677,5691-5694` 也钉住终态不标。该选择符合“只提示在场 agent、避免历史终态刷屏”的运行语义，但 oracle 没写“仅非终态”。建议验收 owner 把 A140 改为“最近事件非终态的在场 agent”；若坚持所有 agent 行，则应改 `relay_log.py:2742-2746` 及对应测试。当前按语义一致记 P2 澄清项，不判实现 P1。

### P2-3 — “normal Recipe 两路”与“normal 整体三路”术语混用

权威配置/design §6.3 是 `[recipes.normal].reviewers = ["requirement", "lesson"]`（design `:756-767`；`dh-mapping.toml:17-18`），故 R-stage agent 表展开两路足够；Issue #21、`brief.md:13`、`task_plan.md:100`、`review.md:4` 所说三路，是 normal **整体必做复核路径**，另含不属于该数组的 code-round1。`task_plan.md:93` 的两路与 `:100` 的三路并非功能冲突，但命名会让执行者误以为两路足够完成整卡。

可执行统一口径：

- 一律写“R-stage Recipe reviewer 两路：requirement + lesson”；
- 另写“normal 整体必做三路：code-round1 + requirement + lesson”；
- Issue/brief/review/task_plan 采用上述两句，`dh-mapping.toml` 保持两路不变；计划 lint 只校验 R-stage 两路，收口清单另校验三份独立报告齐全。

该文案分歧本身为 P2；本轮 P1-2 来自现场确实缺少 code-round1 durable 证据，不是把分歧凑成 P1。

## Issue / DevPlan / task_plan 差异与收口边界

- Issue #21（`gh issue view 21 --json ...`，2026-09-15 只读取得）当前 OPEN；目标覆盖 A137～A143，关闭条件另含两 skip 去除、PR→master、三项硬 CI 与人工合并。
- DevPlan `P1-RelayLight-开发方案.md:385-405` 定义实现目标、七条机器证、闭集与 `task_type=normal`；其卡段不把 PR/CI 写进七条机器证，但仓库全局 GitHub-flow 仍适用。
- task_plan 负责 C1/C2/R1/F1 本地流水与证据，`task_plan.md:93-95` 明确 verify、安装同步、PR/CI/merge 是后续闸；因此“本地施工完成”与“Issue 可关闭”是分层完成条件，不应互相替代。
- 当前真正偏离不是分层本身，而是 `task_plan.md:38,77` 的 C1 PASS 前置尚无 durable 证据却已进入 C2/R1；见 P1-1。
- `review.md:32-34,50-52` 的路径/批次表仍是待执行占位；应由后续 scribe 根据独立报告更新，不能用该表当前空状态否认已存在的 requirement/lesson 文件，也不能用已有文件掩盖 code-round1 缺失。

## 停止线

本报告只完成 R1 requirement 独立复核。未修改代码、测试、brief、task_plan、findings、progress、review、DevPlan 或 design；未作 commit、verify、push、PR、CI、merge、安装同步或验收代签。
