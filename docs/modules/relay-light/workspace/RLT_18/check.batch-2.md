# check.batch-2 — RLT_18 batch 2 复核（batch-reviewer#b2，初审 round 1）

> 日期 2026-09-24。审查对象：commit `0f9686f`（A83 两层退出 + 编排级 monitor 在场 + adapter watch 改写 + SKILL UD-2）。复核方式：逐项对 task_plan batch 2 用例清单与 D 系解读、design/01 §3.6/§7.2/A83 逐字 oracle、UD-1/UD-2 裁决落地、check.batch-1 O-1 与 review.plan P2-C 指定必核项、允许路径闭集；复核人独立复跑本批全部相关用例。
> RELAY_RECEIPT preflight：`env | grep -i '^RELAY'` 空，按正常流程执行。

## 结论：PASS

task_plan batch 2 全部符号与用例落地，oracle 要素无丢失，O-1 为真替换，P2-C 已落地，SKILL.md 改动限于 UD-2 三处且全仓无其它 hunk；无 FAIL 项。观察项 O-1~O-4 不阻塞，交 orchestrator 知悉（其中 O-1 为措辞保真度问题，orchestrator 若要求逐字 UD-2 原文可开最小整改）。

## 逐项核对

| # | 检查项 | 结论 | 依据 |
|---|---|---|---|
| 1 | task_plan 符号落地 | 符合 | `_watch_should_exit(level,bound_stage,status)`（relay_log.py:3817）；`_watch_present_monitors`（3639，D3 `monitor_launch` 取在场）；`_watch_monitor_terminal`（3691）；`_watch_agent_terminal`/`_watch_agent_loop` 增 scope/stage_id 双形态；`run_watch` level 分路 + 退出 join + return 0（3872–3935）；主循环 tick `WATCH_TICK_SECONDS=1200`（3527、3863、3925） |
| 2 | 用例清单逐项落地 | 符合，15 条全落 | R-A83-1/2/3/4/5/6/7/10/11/12a–f/13 → WatchTests `test_a83_*` 15 个；R-A83-8 → `test_watch_subcommand_documented`；R-A83-9 → `test_a83_adapter_contract_red_baseline`；既有断言三处同步：`test_a21`（未实现→无 watch 回退+空等保留，6351–6353）、`test_no_watch_subcommand_invoked`→改名 `test_watch_subcommand_documented` 并反转为断言含 watch（6454）、`test_a136` 枚举扩为 add\|status\|lint\|watch 且 watch≥1（6319–6336） |
| 3 | RED 先行 | 符合 | `evidence/batch-2/red.txt`（02:51）早于 green（03:17）；失败原文为「无退出逻辑 / 编排级盯 worker（O-1 实症）/ adapter 无 watch / SKILL 缺 UD-2」，非伪造；tick 与启动重试本属 batch-1 已有行为，red.txt 如实标注「already existed, now pinned」，a83_1/12c/12d 的测试侧修正（FakeClock 锚定）亦如实披露并沉淀为 L-02 |
| 4 | 复核人复跑本批新增用例 | 通过 | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.WatchTests test_relay_log.SkillAdapterTests test_relay_log.SkillCoreDocTests` → Ran 64 tests in 4.232s **OK**（本棒实测；<30s 证明无真 sleep） |
| 5 | 全量回归自洽（不重跑） | 符合 | 全部代码/文档最终 mtime ≤03:02:12；`regression-python.txt`（281 tests OK，~03:17→03:24）与 `regression-pwsh.txt`（RELAY ALL PASS SKIPPED:1，03:17:30）均晚于最终改动；用例数自洽：batch-1 的 245 + 本批净增 17（15 新 + 改名反转 0 增 + red_baseline/a83_13 各 1）= 262 test_relay_log + 19 test_install_skill = 281；`git status --porcelain` 空，工作区与 HEAD 一致 |
| 6 | 允许路径闭集 | 符合 | `git diff origin/master --name-only` 仅 5 个允许代码文件 + workspace + orchestrator 件（dev_plan 任务行、execution_strategy、decisions 只在 orchestrator 提交出现）；禁动路径 --stat 空；`git status --porcelain --ignored \| grep __pycache__` 空（本棒实测）；无 relay_plan/relay_log 工件 |
| 7 | SKILL.md 限于 UD-2 三处 | 符合（措辞见 O-1） | `diff -U0` 恰 3 hunk：@@-40 watcher 行、@@-287 硬规则 8、@@-347 放弃项 5——与 UD-2 登记的三处一一对应；`grep -c 'watch 未实现\|不做 watch 推送的实现'` = 0；SKILL 其它内容字节不变（331 行 single-task 段未触） |
| 8 | design §3.6/§7.2/A83 语义 | 符合 | tick 1200/2400/3600 恰 3 次且与状态通知独立（D10）；阶段级退出 = 绑定 stage 全部 active 节点 closed 且空阶段不满足（D2，`stages` 由 active nodes 分组构建故缺席即不满足）；plan_amend 追加节点重算末节点；编排级退出 = open_stages/pending_nodes 空 + 末 stage closed（D3）；退出码 {0,2,3,4} 沿用现有合同不重映射（`_fail`→`exc.exit_code`；argparse 2 / `_error` 缺省 2 / `_runtime_plan` 3 / `_ledger_error` 4 / 未捕获异常外抛 ∉ 停止集）；启动期 2s×2 重试、运行期重读失败 stderr+本轮跳过不退出（D4/D13） |
| 9 | O-1（check.batch-1）是否替换 | **符合——真替换** | `_watch_present_agents` 签名由 `(status,entries,level,bound_stage)` 改为 `(status,entries,bound_stage)`，plan 级分支从该函数删除；`run_watch` 按 level 分路，plan 级改走 `_watch_present_monitors`（`read_ledger` 的 `monitor_launch` 按 `stage_id=` 分组计序 → `monitor#<n>`，note 取 `herdr=`）；R-A83-10 断言编排级 wait/get 只命中 `lead-w`、对 worker 零 herdr 调用——plan 级 watch 不会给 worker 发 prompt |
| 10 | P2-C（review.plan 复审）落地 | 符合 | 两 adapter 存活检查均为 `pgrep -f -- 'relay_log.py watch --plan <plan_dir> --notify <自己的 Herdr 名> --level stage'` 与 `-like '*…--notify <自己的 Herdr 名> --level stage*'`——` --level stage` 后缀切断 `--notify` 名前缀误命中并排除编排级 watch；`_assert_adapter_watch_contract` 同步断言该原文（6427–6432） |
| 11 | adapter 改写六要素 | 符合 | 两份对称：①硬规则句改「无 watch 时不得结束回合空等」；②方式 1 = watch 默认 + D13 重启循环（Linux `while :; do…0\|2\|3\|4) break…sleep 5`、Windows `$LASTEXITCODE -in 0,2,3,4`/`Start-Sleep 5`），调用行 `--plan … --notify …` 固定首两位 + `--config-dir <plan_dir>/config/`，沿用本侧载体（claude tab / codex pane，偏离登记 F-006）；③节拍归属两句齐 + 无 watch 回退方式 2（claude 侧可 3）；③a 死亡处置三层齐（进程级循环重拉 / stage-lead 位 `--notify+--level stage` 分层存活检查 / 编排位 tick 对账→`stage-stalled`+编排 pane 被关依赖人工 §7.3）+ 共通句「不设人肉 watcher、停滞判定不进程序」；④`herdr=` 约定；⑤single-task 段未动（P1-4 闭合）；codex 侧 kind 轴描述同步更新为 watch 条件式，必要一致性改动 |
| 12 | A101 只通知不写账 | 符合 | R-A101-1/2/3 在本批代码上仍全过（含于本棒 64 用例）；新增 `_watch_present_monitors`/`_watch_monitor_terminal`/`_watch_should_exit` 均在 `_watch`/`run_watch` 定界闭包内、无写调用；subprocess 仍只在 `HerdrClient` 内 |
| 13 | progress 写者边界 | 符合 | 施工里程碑仅新增 batch 2 一行（coder#b2）；证据账本 E-201~E-205 五行；无 pane/agent 状态/轮询/通知；lesson_candidates 仅 L-02 一条（coder 写入范围内）；execution_strategy/decisions/dev_plan 未出现在 coder 提交（0f9686f 仅 5 代码文件 + 证据 5 + progress/lesson/DONE） |
| 14 | DONE signal schema | 符合 | `DONE.batch-2.coder.md` 单行齐（phase=batch batch=2 review_round=1 remediation_count=0 verdict=READY），5 个 evidence 路径均存在 |

## 观察项（不阻塞本批 PASS，供 orchestrator/后续批次知悉）

| # | 级别 | 观察 |
|---|---|---|
| O-1 | P2·措辞保真 | SKILL.md 两处新句是 UD-2/task_plan 引用文的**改写**而非逐字：①第 40 行 plan 引用文「`single-task` 无账本，`phase=monitor` 仍由人肉 watcher 按 adapter 120 秒节拍承担」→ 实际「`single-task` 模式无账本不接 watch，`phase=monitor` 角色仍以 120 秒节拍人肉充当」（语义等价且「不接 watch」更精确，但 R-A83-13 plan oracle 片段「`single-task` 无账本」非连续子串，测试断言用的是更弱片段「single-task」+「120 秒」分列）；②放弃项 5 plan 建议文「watch 只通知不写账、不做驱动器与停滞检测；无 watch 时一律走前台 `wait` 回退」→ 实际重写为「不设人肉盯屏 watcher agent…停滞对账由其本层 watch tick 驱动」（对齐 UD-1④，但「只通知不写账」在 SKILL 内不再复述——该保证仍由 A101 测试与两份 adapter 的「watch 只通知不写账」承担）。三处 hunk 数与 UD-2 范围均满足；若要求逐字 UD-2 原文，属最小文档整改。 |
| O-2 | P3 | `evidence/batch-2/` 四份文件头标「2026-09-25」，实际生成时刻为 2026-09-24 03:17–03:24（mtime 与系统日期）——标注性笔误，不影响证据时序（RED 02:51 < GREEN 03:17 < 回归 03:17–03:24 < 提交 03:25，均晚于最终代码改动 03:02）。 |
| O-3 | P3 | task_plan 要求「在 progress 注明『反转而非删除』」：`progress.md` batch-2 行未含该句。反转事实可由 git diff（`test_no_watch_subcommand_invoked`→`test_watch_subcommand_documented`，断言反向）与 green.txt 佐证，仅登记遗漏。 |
| O-4 | P3 | ① `_watch_monitor_terminal` 的 `monitor_restart` 分支只在 restart 事件的 node 经 `stage_of` 映射回本 stage 时命中；写在别处的 restart 不被该分支捕获——同 stage 新 `monitor_launch` 分支已覆盖常规重拉语义，属边角。② check.batch-1 O-2：`SUBCOMMANDS` 仍为 `("add","status","lint")`，watch 不进 `run_cli` 自动 `--config-dir` 注入与遍历型用例；本批 watch 用例均显式传 `--config-dir`，无回归，维持 P3。 |

## 复核人执行的命令（摘要）

- `env | grep -i '^RELAY'` → 空（RELAY_RECEIPT preflight 通过）
- `git log --oneline origin/master..HEAD` / `git show --stat 0f9686f` → 提交面见 #6/#13
- `git -c core.quotepath=false diff origin/master --name-only` → 仅允许路径 + orchestrator 件
- `git -c core.quotepath=false diff origin/master --stat -- <禁动路径>` → 空
- `git -c core.quotepath=false diff origin/master -U0 -- tools/relay-light/skill/SKILL.md` → 3 hunk（40/287/347）
- `git status --porcelain` → 空；`git status --porcelain --ignored | grep __pycache__` → 空（收尾复核仍空）
- `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.WatchTests test_relay_log.SkillAdapterTests test_relay_log.SkillCoreDocTests` → 64/64 OK，4.232s
- 完成判据 grep：`未实现`(adapter 0/0)、`timeout 1200000`(两份命中)、`[relay-light] tick`(两份命中)、`stage-stalled`(各 2)、SKILL 过时措辞(0)
- `stat` 时间线核对：代码最终改动 03:02:12 < RED 不适用方向 < GREEN 03:17 < 回归 ≤03:24 < 提交 03:25
- 代码走读：`_watch_should_exit` vs `derive_status` 投影（`stages` 由 active nodes 分组、空阶段缺席）、`_watch_present_monitors`/`_watch_monitor_terminal` vs D3、`main`/`_fail`/`_watch_startup` 退出码链路 vs D13
