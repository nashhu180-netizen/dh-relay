# review — workflow-final · code-round1（UD-3 定向，fresh）· round 1

复核对象：`git diff a6773e7..HEAD -- tools/`（RED `2c1dc47` + GREEN `638b9e6`）——
SKILL.md 两处、adapter-claude-code.md / adapter-codex.md 各 +31、test_relay_log.py +213。
权威：晋级后 design/01（RLT-A-14）、task_plan §5（D14–D23、§5.4 断言清单、§5.5）、decisions.md UD-3~UD-8。

## 结论

PASS —— 无 open P0/P1。实现忠实于 design/01（A-14 晋级版）与 D14–D23，两 adapter 对称，
新测试可证 RED→GREEN，relay_log.py 零改动，审计基点 `5ab3bba` 正确，两条全量回归自跑全绿。

## 发现

| ID | 级别 | 位置 文件:行 | 事实 | 建议整改 |
|---|---|---|---|---|
| U3-C1-1 | P3 | tools/relay-light/test_relay_log.py:6464-6466（`_assert_adapter_watch_contract`） | task_plan §5.4(2) 验收断言列「两份均不含 `stage-stalled`、`依赖人工`、`不设人肉 watcher agent`」三项否定；测试只钉了前两项，`不设人肉 watcher agent` 无 assertNotIn。当前文本确实不含该词（grep 0 命中），仅断言覆盖缺口 | 可补一行 `assertNotIn("不设人肉 watcher agent")`；不补亦可——旧句已被正向断言（watcher agent 常驻表述）实质覆盖 |
| U3-C1-2 | P3 | tools/relay-light/skill/references/adapter-claude-code.md:130-133 | 本侧既有约定对 watch 载体用「tab」（:107、:130），U1 新增/改写行改用「pane」（:131、:133「整个 watch pane 被关」），同文件相邻条目混用。语义等价（一 agent 一 tab、不 split，tab 的 root pane 即 watch pane），且与 RLT-A-14 P2-1(a) 设计统一用「pane」同向；F-013 已登记该漂移归 backlog 另案 | 无需本轮改；F-013 裁定日统一收口 |
| U3-C1-3 | P3 | tools/relay-light/skill/references/adapter-claude-code.md:137 / adapter-codex.md:137（「报信目标随派活方重拉」条） | F-014 落实条覆盖「Herdr 名不变→不切换 / 换新名→重拉 watch + 重派 watcher」，但未写明换名时**旧 watcher 实例**如何收场。推演：旧 watcher 按旧 `notify=` 旧 `--notify` 名巡检，会判缺席并向旧名报信（Herdr 目标已死则投递失败），靠 D18/D19「连续 3 轮 → `WATCHER_GAVE_UP`」收敛，残余 ≤3 条死信——在 D22 已接受的残余包络内，不阻断 | 可在该条补一句「旧 watcher 由 3 轮收声自收敛/由派活方顺手关闭」；留待下轮或 F-014 跟进亦可 |

## 核查范围与方法

1. **RELAY_RECEIPT preflight**：`env | grep ^RELAY_` 空 → 正常施工面，未进 fail-closed 分支。
2. **文案忠实性（design/01 晋级版 ↔ 两 adapter ↔ SKILL）**：逐条比对 §2 watcher 行（139）、§2.1 唯一例外（162）、§3.6（497）、§7.1（894-899）、§7.2（907）、§7.3（933-936）、H12 v2（1426）、§13（1456）与 task_plan D14–D23：
   - watcher 片段：D23 首行逐字；D16 两侧分写（Claude `run_in_background` 跑 `sleep 600`、无 `sleep 590`/前台长 sleep；Codex 前台 `sleep 600` + `timeout_ms=660000`）；D18 两式检查命令（pgrep stage/plan 两式 + Win32_Process 两式，均带 `grep -v 'pgrep'` 与 `^($$|$PPID) `/`-notlike '*Get-CimInstance*' -and $_.ProcessId -ne $PID` 自匹配排除）；非空=存活（循环壳或 python 任一命中）、空→`status --json` 判死口径与 `_watch_should_exit` 一致 + 「stage state=closed 即静默」补充项（relay_log.py:3836-3857 对照）；`WATCHER_STOPPED`/`WATCHER_GAVE_UP` 收声语义（连续 3 轮、恢复清零）；D19 两式通知原文、`queued`/`Press Enter to send` 补 Enter 限定；只读/不重拉/不写账/不改文件/不派活/不判内容；低档缺省 `[monitor]`。
   - 「watch 死亡处置」重写：进程级原样保留；stage-lead 位改收 `watch-down stage`（C1-1 命令、过滤说明、存活口径、重拉或改前台 wait 全保留）；编排位只做 §7.2 通用对账 + `watch-down plan plan` 自查重拉，**无** `stage-stalled`/`pgrep`/`Win32_Process` 存活判定；watcher 自身缺席顺带重拉（D22）；「完整 relay 每终端空间一个 watcher agent…编排不承担 watch 存活对账」收束句。
   - SKILL.md：第 40 行与第 347 行与 §5.4(3) 定稿逐字一致；第 25/287/331 行未动。
   - 无夹带：唯一超出 §5.4(2)c 字面清单的新增条「报信目标随派活方重拉」可溯源至 findings F-014 处置授权（「U1 施工时…并在 adapter 写明」），内容正确。
3. **两 adapter 对称性**：`diff` 抽取「拉起 watcher 的 prompt 片段」节与「watch 死亡处置」节互比——差异仅 §5.4(2) 允许项：D16 本侧节拍句（`run_in_background` vs `timeout_ms=660000`）、进程级载体词（tab vs pane）、既有方式 3 不对称（`（Claude 侧可 3）`）。
4. **测试有效性（RED→GREEN 自证 + 自行变异）**：
   - `evidence/ud3-u1/red.txt`：31 tests 中 12 subTest FAIL，全部落在 R-U3-1/2/3/5、watch 合同否定项、ud2_checks 改版上——RED 证据真实；GREEN 后同套 31+45=76 全过（本棒复跑 31 OK）。
   - 变异 1：删 adapter-codex.md 编排位句中「不做 watch 存活判定」→ `test_r_u3_1` 仅 codex subTest FAIL（定位精确）。
   - 变异 2：删 adapter-claude-code.md 片段中 `WATCHER_GAVE_UP` → `test_r_u3_2` 与 `test_watch_subcommand_documented` 均 FAIL。
   - 变异后 `git checkout` 还原，`git status --porcelain` = 0，与开工一致。
   - `test_install_skill` 劫持面：新片段不含「完全只读」「fail closed 分流」（`line_with` 首命中不偏移，SingleTaskStructureTests 19 tests 在回归中全过）。
   - `SkillAdapterTests` 基类改 `RelayCliTestCase`：setUp/tearDown 仅建临时目录，对纯文本断言无副作用；R-U3-5 ②以最小 fixture 真跑 `status --json` 核 `open_stages`/`pending_nodes`/`stages`/`nodes`/`state` 键真实存在（status_document 十三键对照 relay_log.py:3397-3436）。
   - WatchTests 45→45 用例数不减。
5. **零改动与审计基点**：`git diff a6773e7 -- tools/relay-light/relay_log.py` = 空（自行复跑）；SKILL.md vs `5ab3bba` 恰 3 hunk（37/284/344 区，287 行为本分支先行 UD-2 改动）、vs `a6773e7` 恰 2 hunk；路径审计以 `5ab3bba` 为基——`diff --name-only` 仅允许闭集 + A-14 事件节点 design/DevPlan 路径 + orchestrator 文件；U1 两提交（2c1dc47、638b9e6）文件清单全在允许路径内；禁动集（relay/、install_skill.py、roles.toml、dh-mapping.toml、AGENTS.md）stat 空；`__pycache__`/`.pyc` 审计空（本棒全命令带 `PYTHONDONTWRITEBYTECODE=1`）。
6. **F-013/F-014 处置**：F-013 把「adapter 用 tab ↔ design 用 pane」漂移留档 backlog 另案——合理（§5.4(2) 本允许载体词差异，设计已统一 pane，争议的是既有 adapter 口径，超 U1 范围）；F-014 处置（adapter 写明报信目标随派活方重拉、不改 design）落实正确，残余边界见 U3-C1-3。
7. **协议推演（正确性抽查）**：watcher 检查命令的 `grep -v 'pgrep'` 同时滤掉他方并发同款检查（任何跑该检查的壳 cmdline 必含 `pgrep`），不会把 stage-lead/watcher 的检查壳误判为活 watch；watch 正常退出/确定性退出致循环停止但本层未结束的情形同样被 watcher 捕到（比纯循环兜底更宽）；watcher→派活方报信→派活方自查后重拉构成自纠环（误报至多一次）。
8. **全量回归（本棒自跑）**：`cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s . -p 'test_*.py'` → **293 tests OK（490.677s）**；`PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` → **RELAY ALL PASS（SKIPPED: 1）**（既有 psmux-real 豁免，与基线一致）。

## 范围外发现

- `git stash` 存在 1 条 `stash@{0}`（2026-09-11「RLT_05 WIP migration to GitHub Issue #8」）——开工前即有，与本复核无关，未动。
- SKILL.md:40 watcher 行将 design §2 的「缺席且本层未正常结束即报信」压缩为「缺席即报信」——属 §5.4(3) 定稿逐字原文（条件细节由 adapter 判死口径承载），非缺陷，记此备 consistency 路参考。
