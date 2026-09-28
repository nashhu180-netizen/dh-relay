# check.batch-1 — RLT_18 batch 1 复核（batch-reviewer#b1，初审 round 1）

> 日期 2026-09-24。审查对象：commit `4b4b95c`（watch 核心 + A82 + A101）。复核方式：逐项对 task_plan batch 1 用例清单与 D 系解读、design/01 §3.6/§7.2/A82/A101 逐字 oracle、允许路径闭集；复核人独立复跑新增用例。

## 结论：FAIL

仅 1 项须整改（P1-1，边界/审计项，机械性、整改量极小）；代码与测试本体对 task_plan 与 design 无偏离。

## 逐项核对

| # | 检查项 | 结论 | 依据 |
|---|---|---|---|
| 1 | task_plan 符号落地 | 符合 | `HerdrClient`(wait/get/prompt)、`WatchClock`、`run_watch(plan_dir,notify,level,config,herdr,clock,stop_event=None)`、`_watch_agent_loop`、`_watch_present_agents`、`_watch_herdr_name`、`main` 注册 `watch`（relay_log.py:3521–3815, 3846–3850, 3893–3894）；`_watch`/`run_watch`/`HerdrClient`/`WatchClock` 前缀集供 A101 定界 |
| 2 | 用例清单逐项落地 | 符合，24/24 | R-A82-1~15 → 19 用例（含 4a/b/c、11a/b、13a/b/c）、R-A101-1~3、R-CLI-1；oracle 要素齐：无立即重挂、两条退出路径、去重（A82），静态闭包无写账 + 变异自证 + 运行旁证（A101），无丢项 |
| 3 | RED 先行 | 符合 | `evidence/batch-1/red.txt`（2026-09-23T17:14Z，24 用例 3 failures + 21 errors，全部因 `run_watch`/`watch` 子命令不存在）早于 green（17:29Z），非伪造 |
| 4 | 复核人复跑本批新增用例 | 通过 | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.WatchTests -v` → Ran 24 tests in 2.839s OK（本棒实测）；<30s 证明无真 sleep |
| 5 | 全量回归自洽（不重跑） | 符合 | `regression-python.txt`（245 tests OK，483s）与 `regression-pwsh.txt`（RELAY ALL PASS SKIPPED:1）登记于 01:39:59；代码最终改动 mtime 01:29:08，回归晚于最终改动且覆盖最终代码（工作区与 HEAD 一致） |
| 6 | 允许路径闭集 | **偏离 → P1-1** |  tracked 面干净：`git diff origin/master --name-only` 仅 `relay_log.py`+`test_relay_log.py`+workspace/orchestrator 件；SKILL.md 0 hunk、design/adapter/`docs/modules/relay-light/relay/`/install_skill 未触；dev_plan diff 仅 RLT_18 任务行 + UD-2 路径行。**但 `tools/relay-light/__pycache__/` 新增**，详见下 |
| 7 | design §3.6/A82 语义 | 符合 | 通知→30s get 轮询；终态（done/agent_lost/cancelled）退线程；回 working 重挂并按 D9 转换口径再通知；`(agent,状态)` 转换去重；`[relay-light] <ledger> -> <state>` 短 ASCII 单行（含非 ASCII/换行拒发 + stderr 一行）；1200s tick 由主循环驱动；D11 提前失败 30s 退避 vs 超时立即重挂（节拍断言 wait+get ≤4/90s）；启动期 2s×2 重试、运行期重读失败沿用上次快照不退出（R-A82-14/15） |
| 8 | A101 只通知不写账 | 符合 | 静态闭包检查（`_watch*`/`run_watch`/`HerdrClient`/`WatchClock` 根递归追模块级调用）禁 append_event/_add_command/写模式 open/write_text/os.replace/os.rename/shutil；非字面首参 subprocess 限 HerdrClient 内（`_git_readonly` 的 `["git",…]` 字面量正确豁免）；变异注入自证；运行期 `append_event` patch assert_not_called + plan/ledger 字节不变 |
| 9 | 打桩真实性 | 符合 | `FakeClock` 为离散事件调度器（sleep 登记 wake_at 后阻塞、advance_to 唯一推进、quiescence 静止等待 5s 墙钟上限 + 线程栈 dump、expect_thread/enter/leave 闭 spawn 间隙）；`FakeHerdr` 脚本化记录全调用时刻；全程无真实 herdr、无真 sleep |
| 10 | progress 写者边界 | 符合 | 施工里程碑仅 batch 1 一行（coder#b1）+ 证据账本 E-101~105；无 pane/agent 状态；`lesson_candidates.md` L-01 在 coder 写入范围内；`DONE.batch-1.coder.md` 单行 schema 齐（phase=batch, verdict=READY, evidence 五项均存在） |
| 11 | execution_strategy / decisions | 符合 | 两文件只出现在 orchestrator 提交（c04f3a2 等）；coder 提交 4b4b95c 未含 |

## FAIL 项（须整改）

### P1-1 `tools/relay-light/__pycache__/` 新增，且 §1.1 第 4 条审计命令未执行/登记

- 事实：`git status --porcelain --ignored | grep __pycache__` → `!! tools/relay-light/__pycache__/`（`relay_log.cpython-312.pyc` + `test_relay_log.cpython-312.pyc`，mtime 2026-09-24 01:35）。task_plan §1.1 明确「plan 期（2026-09-23 builder 实测）pre-existing 集合为空 → 期望仍为空」。本棒复核时该目录仍在（复核人全程带 `PYTHONDONTWRITEBYTECODE=1`，非本棒产生；目录时间戳 01:35 亦早于本棒进场 01:43）。
- 旁证：全部已登记命令（red/green/regression×2）均带 `PYTHONDONTWRITEBYTECODE=1` 且 pwsh 子进程继承该 env，不能解释 01:35 的字节码写入 → 存在一次未登记的 python 执行或外部工具写入；`evidence/batch-1/path-audit.txt` 也只登记了 §1.1 的前 3 条审计命令，第 4 条 `git status --porcelain --ignored | grep __pycache__` 未跑未录，导致该偏离随 signal 漏出。
- 整改（一条闭环）：
  1. 删除 `tools/relay-light/__pycache__/`（该目录晚于 plan 基线生成，不属「已有不删只登记」的 pre-existing）；
  2. 重跑 §1.1 全部 4 条审计命令（含 `git status --porcelain --ignored | grep __pycache__` → 期望空），把输出补进 `evidence/batch-1/path-audit.txt`；
  3. 按整改流程提交并写 `DONE.batch-1.coder.remediation-1.md`（remediation_count=1）。

## 观察项（不阻塞本批 PASS，供 orchestrator/后续批次知悉）

| # | 级别 | 观察 |
|---|---|---|
| O-1 | P2·batch-2 必改点 | `_watch_present_agents` 在 `level="plan"` 时遍历 `status.agents`（节点 worker）。D3 要求编排级在场者取 `monitor_launch`（R-A83-10：对 worker 零 herdr 调用）。本批按计划只做「参数被接受 + 共用骨架」，编排级取法列为 batch-2 符号项——batch 2 须**替换**该分支而非仅新增 monitor 处理，否则 plan 级 watch 会给 worker 发 prompt。 |
| O-2 | P3 | `SUBCOMMANDS = ("add","status","lint")` 未含 `watch`：`run_cli` 的自动 `--config-dir` 注入对 watch 不生效（现 CLI 用例均显式传 `--config-dir`，无影响）；`test_each_subcommand_help` 等 4 处遍历不覆盖 watch。batch 2 加 watch CLI 用例时注意，或届时扩 SUBCOMMANDS。 |
| O-3 | P3 | R-A82-13 覆盖了非 ASCII/换行 **状态**（13a/b）与非法名跳过（13c）；「非 ASCII ledger 标识 + 合法 `herdr=` token 抵达 `_watch_notify` 文本闸」这一组合未单独演练——与 13a 同一拒发路径，覆盖视为够用，仅记录。 |
| O-4 | P3 | `run_watch` 对已死线程的同 key agent 会重开线程：终态 agent 已离在场集，实际只在「线程异常死亡」时触发，偏向韧性语义；与 D4「已盯过并退出的不再重开」在异常路径上有解读空间，不构成本批问题。 |
| O-5 | P3 | `_watch_startup` 在 2s 重试窗口内收到 `stop` 时按 RelayError 外抛（非干净退出 0）——边角路径，影响为零。 |
| O-6 | P3 | `_watch_notify` 对非法文本返回 `state`（视为已通知、不再每轮刷 stderr）——与 R-A82-13「stderr 恰一行」自洽，记录该取舍。 |

## 复核人执行的命令（摘要）

- `env | grep '^RELAY_'` → 空（RELAY_RECEIPT preflight 通过）
- `git log --oneline origin/master..HEAD` / `git diff origin/master --name-only` / `--stat` 守护项 / SKILL.md hunk 数 → 见上表 #6
- `git status --porcelain --ignored | grep __pycache__` → `!! tools/relay-light/__pycache__/`（P1-1）
- `git status --porcelain` → 空（全部已提交，无散落 WIP）
- `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.WatchTests -v` → 24/24 OK，2.839s
- `PYTHONDONTWRITEBYTECODE=1 python3 relay_log.py watch --help` → 含 `--plan/--notify/--level/--config-dir`
- `git show --stat 4b4b95c` → 10 文件：2 代码文件 + 本批证据 5 + progress/lesson/DONE signal；dev_plan diff 仅 RLT_18 行 + UD-2 行

## 复审 round 2（2026-09-24，batch-reviewer#b1）

> 范围：只核 P1-1 闭合 + 整改有无引入新问题。整改提交 `b6bd264`（docs，5 个 workspace 文件，零代码改动）。

### P1-1 闭合核对

| 要求 | 结果 | 证据 |
|---|---|---|
| 删除 `tools/relay-light/__pycache__/` | 闭合 | 本棒实测：`find . -name __pycache__ -type d` 全树为空；`git status --porcelain --ignored \| grep __pycache__` 空（非仅删除 tracked 面，目录本身已不存在） |
| 重跑 §1.1 全 4 条审计并补录 | 闭合 | `path-audit.txt` 新增「remediation-1」节：[1/4] name-only 仅允许路径+orchestrator 件；[2/4] stat 守护空；[3/4] SKILL.md 0 hunk；[4/4] `__pycache__` grep 空（登记时间 17:55Z） |
| 来源如实说明 | 闭合 | path-audit 末段 + progress E-106：定位为一次未登记 `python3 -c` 探针（AST 闭包 sanity-check，未带 PYTHONDONTWRITEBYTECODE）import 编译产生两个 .pyc——与初审「存在未登记 python 执行」的判断一致；非外部工具、非套件泄漏 |

### 整改范围与新问题

- 整改提交 `b6bd264` 仅触 `DONE.batch-1.coder.remediation-1.md`、`path-audit.txt`、`regression-python.txt`、`regression-pwsh.txt`、`progress.md`——全部在 `workspace/RLT_18/` 内，**零代码改动**（relay_log.py / test_relay_log.py 未再触），无新越界。
- `progress.md`：仅在证据账本追加 E-106 一行；施工里程碑仍只 batch 1 一行——写者边界未被破坏。
- 回归证据：remediation 后复跑 `unittest discover` 264 tests（245 test_relay_log + 19 test_install_skill，18:04Z）与 pwsh `RELAY ALL PASS (SKIPPED: 1)` 均 OK——代码未变，结论与初审复跑（24/24 OK）一致；顺带把 §1.6 discover 口径（含 test_install_skill）补齐，属收紧非弱化。
- `DONE.batch-1.coder.remediation-1.md`：单行 schema 齐（review_round=2 remediation_count=1 verdict=READY），4 个 evidence 路径均存在。
- 小问题：无。整改未引入新问题。

### 复审 round 2 结论：**PASS**

P1-1 三项要求全部闭合并有本棒独立核实；整改未引入新问题。batch 1（watch 核心 + A82 + A101）通过 batch-review。初审 O-1~O-6 观察项不变，留给 batch 2 / orchestrator 知悉。
