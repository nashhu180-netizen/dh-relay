# E2 code review — RLT_18 `watch` 实现 · attempt 1

> e2-reviewer#1 · round=1 · 2026-09-24。审查对象：`git diff 5ab3bba...HEAD -- tools/`（当前 HEAD `4378a9d`）：`tools/relay-light/relay_log.py`（+463）、`tools/relay-light/test_relay_log.py`（+1708）、`skill/SKILL.md`（3 hunk）、`skill/references/adapter-claude-code.md`、`adapter-codex.md`。
> 本审为 fresh 独立审查：设计 §3.6/§7.2/§7.3、A82/A83/A101 逐条作 oracle，两条回归命令本棒自行复跑；batch-1/2/3 复核与五路 workflow-final 结论仅作背景，不承接其判定。

## 结论 PASS

无 open P0/P1。下列 2 项 P2（均为测试有效性、非实现正确性缺陷）与 3 项 P3 不阻塞通过，交 orchestrator 知悉并决定是否开整改。

## 发现

### P2-1　monitor 更替路径零测试覆盖（测试有效性）

`_watch_monitor_terminal`（relay_log.py:3687–3709）的 stage-lead 线程终了判定有三条分支：本 stage `stage_close`、同 stage 更新的 `monitor_restart`（serial 更大且其 node 经 `stage_of` 映回本 stage）、同 stage `monitor_launch` 计数超过自身 serial。全测试文件 `monitor#2` 零命中——没有任何用例写第二条 `monitor_launch` 或 `monitor_restart`。后果面：若 `launches > int(own)` 比较或 `stage_id` note 匹配被破坏，旧 monitor 线程不退出、与 monitor#2 线程并存，编排将收到新旧两个 monitor 的状态通知；285 个测试仍全绿。§7.3 监工重拉是设计内的预期恢复路径，不是臆想边角。修法：加一个 WatchTests 用例——open stage 存在 monitor#1 线程后 append 第二条 `monitor_launch`（可选再补 `monitor_restart`），断言旧线程退出、monitor#2 线程 spawn 且 wait/get 打在新名上。

### P2-2　A101 静态 oracle 存在逃逸面（测试有效性）

`_watch_source_violations`/`_watch_subprocess_violations`（test_relay_log.py:8415–8528）当前对实现成立，但禁则集合不完整，未来改动可带写路径过闸：

- subprocess 约束豁免全文件内**字面量非 `"herdr"` 打头**的 argv——`_git_readonly` 的 `["git",…]` 豁免是对的，但同一豁免同样放过 watch 闭包内新增的 `["tee",…]`/`["rm",…]` 字面量调用；约束应按「在 watch 闭包内必须落在 `HerdrClient` 类体内」判定，而不是按字面量打头豁免。
- 禁则漏 `Path.open`（`func.attr=="open"` 不在 `_WATCH_BANNED_ATTRS`，`path.open("w")` 直接逃逸）、`os.remove/unlink/mkdir/makedirs/rmdir/chmod/write`、`Path.unlink/touch/mkdir/rename/symlink_to`、`tempfile.*`、`os.open`+`os.write`——这些都可以不写 append 路径也改到账本/计划文件。

本棒逐行核当前实现：watch 闭包内唯一 subprocess 是 `HerdrClient._run` 的 `["herdr", *argv]`，无 `append_event`/写模式 `open`/`write_text`/`os.replace`/`shutil`——当前代码本体干净，失分项在 oracle 自保能力。修法：把 subprocess 约束改为「watch 闭包内一切 subprocess 调用必须位于 `HerdrClient`」；扩充 `_WATCH_BANNED_ATTRS`/`_WATCH_BANNED_OS_ATTRS` 覆盖上述名字。

### P3-1　stage 级绑定 `status.current_stage` 在并发 open stage 下绑错对象

`_watch_startup`（relay_log.py:3827）以启动时 `status.current_stage`（=首个未关 active node 所属 stage，relay_log.py:3177–3187）作绑定 stage，进程生命周期内不 rebinding。账本层面无任何规则禁止两个 stage 同时 open（`_validate_*` 只约束 stage 实例内顺序，relay_log.py:2667–2700）；此时多个 stage 级 watch 都会绑到「最早未关节点」的那一个 stage——另一 stage 的 worker 全程无人盯，且通知仍发给本层 `--notify` 目标造成错对象信号。设计运营模型是串行 stage（§7.2），该边只在异常账本下触发，且 stage 关闭后循环重拉会自愈——但无任何文档写明「watch 假定任一时刻至多一个 open stage」。属 spec 层假设未显化，不阻塞；如需修法：文档显化假设，或绑定改为「拉我本 watch 的 stage-lead 所在 stage」。

### P3-2　`--notify`/`herdr=` 名校验留 `*`/`?`/`[`/前导 `-` 边角

`_watch_herdr_name`（relay_log.py:3595–3605）只拒绝空/非 ASCII/含空白；`main()` 对 `--notify` 同口径（relay_log.py:3997–4004）。craft 的 `herdr=-x` 会原样进 `["agent","wait","-x",…]` argv——herdr 当 flag 解析失败 → `None` → 静默重试（与已登记 C2-2 同族的 watch 失聪，安全失败方向）；`--notify` 含 `*` 或 `?` 合法通过，使 adapter 存活检查的 `-like` 模式过宽匹配。账本写者与 `--notify` 提供方均是受信位，失败方向收敛，P3。修法方向：名字收紧为 `[A-Za-z0-9._~-]` 白名单。

### P3-3　`_stage_fixture` 的 `monitor_launch` 写者字段失真

test_relay_log.py:8602 以 `agent="monitor#1"`（`by="monitor"`）写 `monitor_launch`；`WRITER_BY_EVENT["monitor_launch"]="orchestrator"`（relay_log.py:84），该行若走 `append_event` 必被拒。fixture 经 `write_ledger_rows` 绕校验，而 plan 级用例 fixture（`_open_w_stage_rows`）写的是正确 `orchestrator#1`。对现有断言无影响（stage 级 watch 不消费 monitor_launch 的写者字段），但失真 fixture 会误导后续测试。修法：`agent` 改 `orchestrator#1`。

### 已登记项复核（不重报新发现，仅确认状态）

check.batch-1 O-2（`SUBCOMMANDS` 不含 watch→CLI/config-dir 注入旁路）、check.batch-2 O-4②（`monitor_restart` 仅 node 映回本 stage 时命中）、code-round C2-2（wait/get 返 `None` 静默 30s 重试）、C2-3（存活检查模板模式字符未转义）、C2-4（adapter 未写 `--notify` 取值合同）、C2-5（adapter 仅枚举 add/status/lint）、C2-6（WatchClock hook 无注释）、C1-4（join 35s 对最坏 ~60s 仅告警）、F-002/F-006（真 Windows/载体未实测，任务卡登记暂停口径）——本棒逐项复核，结论与登记一致，级别维持。

## 逐项判定（对 brief 核查清单）

| 轴 | 判定 | 依据 |
|---|---|---|
| watch 线程 | 符合 | 每在场 agent 一 daemon 线程（relay_log.py:3931–3941），stage 级在场 = `status.agents` ∩ 绑定 stage 节点 ∩ 非终态（3608–3629），plan 级在场 = `monitor_launch` 按 stage 计序合成 `monitor#k`（3632–3657，O-1 真替换，编排级对 worker 零 herdr 调用） |
| 重挂/无立即重挂 | 符合 | wait 返回 settled → notify → `polling=True` 每 30s `get`；`working` → 清去重回 wait 重挂；`None` 早失败 → 30s 退避、超时立即重挂（3760–3793，D11 两拍语义正确） |
| 去重 | 符合 | `(scope,agent)` 转换去重存 `notified_shared`，线程异常重生继承、终态/working 清键（3744–3793）；同 state 重读不重发、prompt 失败保留旧键下拍重试 |
| tick | 符合 | 主循环 `next_tick = +1200s`（3883,3942–3945），A83-1/2 钉 1200/2400/3600 恰三次且与状态通知独立 |
| 两层退出 | 符合 | stage 级：绑定 stage 全部 active node closed → 0（3836–3853，amend 扩节点取消退出有 a83_4）；plan 级：无 open stage 且无 pending node 且末 stage closed → 0（3854–3857） |
| 运行期重读 | 符合 | 每 30s 重 lint plan+重读账本+重 derive（3885–3889）；RelayError 打 stderr 保留上次快照续跑（3890–3896，D4）；启动期 2s×2 重试（3813–3826） |
| 退出码 | 符合 | 0 正常收口、参数/`watch_no_open_stage`→2、plan/config→3、账本→4（`_fail`/`_error` 216–222；a83_12b/c/d/f 钉住，未捕获异常不外抛为退出码）；`parser.error` 经 `RelayError`→`_fail` 返 2 不 `SystemExit` |
| 重启循环停止集 | 符合 | 两 adapter `{0,2,3,4}` 与实现退出码逐字一致；`sleep 5`/`Start-Sleep 5` 对称 |
| 异常屏障 | 符合 | 线程 `except Exception`→stderr+保留去重，主循环下拍重生（3794–3800, 3920–3941；C1-2 用例钉住） |
| UTF-8 | 符合 | `_run` 字节 capture+`decode("utf-8", errors="replace")`（3540–3547），`_configure_utf8_stdio`（225–239），pwsh runner 自带 `PYTHONUTF8=1`；C2-1 两用例钉住 |
| A101 只通知不写账 | 符合（代码本体） | watch 闭包无 `append_event`/`open(w)`/`write_text`/`os.replace`/`shutil`；静态+变异+运行期三钉（见 P2-2 对 oracle 完备性的保留） |
| 测试有效性 | 符合（有保留） | FakeClock 离散事件调度无真 sleep、FakeHerdr 脚本化记录；baseline 取不到 `fail` 非 skip；P2-1/P2-2 两处覆盖缺口见上 |
| Windows/跨平台 | 符合（登记边界内） | adapter Windows 段 `python`+`Get-CimInstance`+`$PID` 排除对称；真 Windows/真载体为任务卡登记的暂停口径（F-002/F-006） |
| adapter 与实现逐字一致 | 符合 | `--plan/--notify/--level stage|plan/--config-dir` 拼写、固定首两位参数序、`{0,2,3,4}` 停止集、`[relay-light] tick` 文本、`herdr=` 约定、`stage-stalled` 回退、三层死亡处置——两 adapter 逐字对称且与实现一致；SKILL.md 恰 3 hunk 与 UD-2 登记范围一一对应 |
| 命令注入/模式安全 | 符合（有保留） | 全程 argv 列表无 shell 拼接；`pgrep -af --`/`Get-CimInstance` 均带自匹配排除且明确禁缩窄为 python；残余：`herdr=`/`--notify` 名未限字符集（P3-2）、模板内模式字符未转义（已登记 C2-3） |
| 回归 | 见下 | 本棒两条命令自行复跑全绿 |

## 核查范围与方法

- 全量读 `git diff 5ab3bba...HEAD -- tools/`（+2211/−32）；`run_watch`/`_watch_*`/`HerdrClient`/`WatchClock`/`main` 逐行走读，对照 design/01 §3.6 watch 合同、§7.2 等待/节拍、§7.3 监工重拉与 A82/A83/A101 逐条 oracle。
- 独立核 `derive_status` 的 `current_stage`/`open_stages`/`stages` 语义（3170–3244）与 stage 生命周期校验（2667–2700），确认绑定与退出条件的投影前提。
- 测试有效性：核 WatchTests 24+ 用例的 oracle 要素（无立即重挂/两拍轮询/终态/重挂/去重/tick/两层退出/退出码/adapter 合同/SKILL UD-2/RED baseline），核 `monitor#2` 缺席与 A101 oracle 禁则完备性。
- 安全：核 subprocess 调用面（仅 `HerdrClient._run` argv 列表）、notify 文本 ASCII/换行闸、存活检查命令的包装壳自匹配排除。
- 与五路 workflow-final 及三份 batch 复核对照：结论独立得出，登记项逐条复核不重报。

## 回归复跑（本棒实测）

| 命令 | 结果 | 退出码 |
|---|---|---|
| `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log` | **Ran 266 tests in 463.057s — OK** | 0 |
| `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | **RELAY ALL PASS (SKIPPED: 1)**；skip=`relay-psmux-real`（需 `RELAY_REAL_TERMINAL=1` 真终端，与本仓惯例一致）；内含 test_relay_log 266 tests OK + test_install_skill 19 tests OK | 0 |

旁证：`cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest`（目录全量 discovery，含 test_install_skill）→ Ran 285 tests in 503.903s OK，exit 0。

## `__pycache__` 审计

`find . -type d -name __pycache__ -o -type f -name '*.pyc'` → **空**（本棒全部 python 命令带 `PYTHONDONTWRITEBYTECODE=1`，无新增字节码产物）。

## 备注

- 同 worktree 并发 redemo coder 的 `evidence/rq1-redemo/`（untracked）及 `findings.md`/`progress.md` 改动非本棒所写，按派单不动不判。
- 本棒只写本文件与 `DONE.e2-code-review.attempt-1.md`，未提交、未启动 agent/终端（测试用后台 shell 属复跑命令，非派活）。
