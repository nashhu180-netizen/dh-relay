# review.e2-code-review.ud3.attempt-1 — RLT_18 UD-3 差异终审（fresh）

reviewer：e2-reviewer#ud3-1（fresh，未参与本卡任何施工/批审/workflow-final）
对象：`git diff a6773e7..HEAD -- tools/` 为主；`git diff 5ab3bba...HEAD -- tools/` 整体回归确认
权威：晋级后 design/01（RLT-A-14、HC-RL-H12 v2）、task_plan.md §5（D14–D23、§5.4 断言清单）
RELAY_RECEIPT preflight：`env | grep '^RELAY_'` 无命中 → 正常进入复核流水。

## 结论 PASS

无 open P0/P1。UD-3 差异正确落地 RLT-A-14 设计（watcher 每 10 分钟只读巡检、watch-down 报本空间派活方重拉、编排不再做 watch 存活对账/不发 stall 提示），relay_log.py 零改动核实，测试有效且回归全绿。仅 3 条 P3 记录。

## 发现

| ID | 级别 | 文件:行 | 事实 | 建议 |
|---|---|---|---|---|
| E2U3-1 | P3 | adapter-claude-code.md:91 / adapter-codex.md:93 | watcher 片段判死用 `python3 <RELAY_LOG> status …` 只给 Linux 写法，无 Windows `python` 变体（pgrep 段却有「Windows 同式」）。方向安全：Windows watcher 跑 `python3` 失败会落入「status 读失败 → 报信」（宁可多报），且两 adapter 账本命令模板节已建立 Windows=python 约定。 | 可在该句后补「（Windows 用 `python`）」六字；不改不阻断。 |
| E2U3-2 | P3 | adapter-claude-code.md:85-89 / adapter-codex.md:87-91 | `<plan_dir>` 与 `<Herdr 名>` 以未转义方式进入单引号 pgrep ERE 与 `-like` 通配模式：含 `'` 会破坏引用、ERE/-like 元字符（`.` `[` `*` 等）会放宽匹配。值均为派活方自控的 plan 路径与 Herdr 名（`watch --notify` 实现侧已强制 ASCII 非空白，relay_log.py:3997-4004），非外部输入；与既有 C1-1 命令同一边界。失真方向多为误报（安全向）。 | 派单约定层面可补一句「plan_dir 与 Herdr 名须为无空白/引号的普通 token」；不阻断。 |
| E2U3-3 | P3 | adapter-claude-code.md:85-86,90 / adapter-codex.md:87-88,92 | 「循环壳或 python 任一命中」依赖循环壳 cmdline 携带循环全文——`bash -c`/`pane run` 包装成立（本机实测），交互 pane 逐键输入的循环壳 cmdline 只是 `bash` 不含模式，sleep 5 窗口期会漏检一次（下一轮 python 复生即恢复，误报仅一条且派活方自查会纠正）。 | 无需改；记录为按名定位固有边界的同类。 |

## 核查范围与方法

**UD-3 差异面**（`a6773e7..HEAD -- tools/`）：4 文件——SKILL.md ±2 行（第 40 行 watcher 行分模式表述、第 347 行放弃项「不做人肉盯屏」）、adapter-claude-code.md / adapter-codex.md 各 +31/-9 行（新增「拉起 watcher 的 prompt 片段」节、等待节拍归属补第三句、watch 死亡处置节重写）、test_relay_log.py +213 行（断言改写 + R-U3-1..5 新用例）。`relay_log.py` 该范围 diff = 0 字节，符合 §5.4(1) 零改动令。`ae4f93c..a6773e7` 间无 tools/ 提交——E2 attempt-1/2 PASS 的面与本轮增量并集即 `5ab3bba...HEAD` 全量，无被 UD-3 破坏面；`stage-stalled`/`依赖人工`/`人肉实例退役`/`停滞对账由其本层` 在 tools/ 内全词退场（仅存于测试否定断言）。SKILL.md hunk 数：vs `5ab3bba` = 3、vs `a6773e7` = 2，与 §5.4(3) 验收一致。

**逐字一致（对实现）**：
- watch 调用行 `watch --plan <d> --notify <n> --level {stage,plan} --config-dir <d>/config/`（relay_log.py:3990-3994）与 adapter 重启循环两式逐字一致；pgrep/`-like` 模式是真实 cmdline 的连续子串，`--level` 位次正确。
- 过滤机制**本机实测**：仿循环壳 `bash -c 'while:;…'` 被 `pgrep -af` 命中（存活判定成立）；无匹配时管线输出为空，检查者自身 `bash -c` 包装壳（cmdline 含 'pgrep' 且 PID=$$）被 `grep -v 'pgrep'` + `^($$|$PPID) ` 双滤正确排除——与 C1-1 注释的机制说明一致。
- Get-CimInstance 式对称：`-like '*…--level stage|plan*'` + `-notlike '*Get-CimInstance*'` + `$_.ProcessId -ne $PID`，包装壳自匹配同样双滤。
- `status --json` 键 `open_stages`/`pending_nodes`/`stages[].stage_id,state,nodes`/`nodes[].state` 全部真实存在于 `status_document`（relay_log.py:3397-3450）；编排级判死 `open_stages 且 pending_nodes 均空 且 stages[-1].state=closed` 与 `_watch_should_exit`（3854-3857）逐字同构；阶段级「或该 stage state=closed」系 D18 明文有意追加（安全向）。
- watch-down 两式 `"[relay-light] watch-down stage <stage_id>"` / `"[relay-light] watch-down plan plan"` 发送端（片段）与接收触发（stage-lead/编排位条目）字面一致、ASCII 单行。
- queued/`Press Enter to send` 才补一次 Enter、其它残留不碰 = D19 原文；Claude `run_in_background sleep 600` 与 Codex 前台 `sleep 600` + `timeout_ms=660000` 双侧分叉 = D16 原文。
- 编排位 tick 句（adapter-claude-code.md:133 / adapter-codex.md:135）只跑 §7.2 通用对账、正向写明「不做 watch 存活判定、不发任何 stall 提示」，与 design §7.2（line 907）/§7.3（930-936）一致；RLT-A-14「编排不做这个事情」落地。

**测试有效性**：R-U3-1..5 均为响亮失败——`_section` 缺节抛 AssertionError；编排位句级断言（禁词 + 正向短语）；片段逐件齐备含两侧分叉与措辞禁区（不劫持 `test_install_skill` 的 `完全只读`/`fail closed 分流` 首命中）；watch-down 字面量非空守卫 + isascii/无换行；R-U3-5② 用真 `status --json`（RelayCliTestCase fixture）锁文档键名与实现输出一致，防文档引用不存在字段。基线 RED 不降：`_skill_ud2_checks` 对 `5ab3bba` 仍要求 ≥2 False；新正向断言在基线全真为假；测试内不钉 `a6773e7`（浅克隆安全）。任一破坏（删片段、改通知原文、去过滤、改 status 键名、删 `--level plan` 式）都会使对应断言 FAIL。

**回归（自跑，PYTHONDONTWRITEBYTECODE=1）**：
- `cd tools/relay-light && python3 -m unittest test_relay_log` → **Ran 274 tests，OK**，549.1s，exit 0。
- `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` → **RELAY ALL PASS**（内含 274 例单测 + 19 例 install 复跑全 OK），SKIPPED=1（`relay-psmux-real` 环境门槛，另有一处 Windows-only ACL skip，均为预存环境性跳过），exit 0。
- `find tools/ -name __pycache__` 无新增；`git status` tools/ 干净。

**越界核查**：本轮除本文件与 signal 外零写入；未提交、未改码、未动 agent/herdr。
