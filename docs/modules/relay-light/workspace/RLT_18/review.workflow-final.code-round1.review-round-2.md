# RLT_18 workflow-final code-round1 review-round-2

2026-09-25 · reviewer#code-round1-r2（fresh，未参与施工与 r1）· 复审对象：整改提交 `41c29ed`（HEAD `5a1b216` 仅含编排侧 execution_strategy 记录）· 上一轮 `review.workflow-final.code-round1.review-round-1.md`（FAIL：open P1 C1-1、P2 C1-2，P3×5）。

## 结论

PASS — C1-1、C1-2 均闭合，P3 未修理由成立，整改未引入 P0/P1/P2 新问题（新增一条 P3 登记项 C2-1）。

## 发现

| ID | 级别 P0/P1/P2/P3 | 位置 文件:行 | 事实 | 建议整改 |
|---|---|---|---|---|
| C1-1 | 已闭合（原 P1） | `adapter-claude-code.md:113`、`adapter-codex.md:115`；钉字 `test_relay_log.py:6425-6440`；机制实测 `test_relay_log.py:6494-6536` | Linux 写法改 `pgrep -af -- '<模式>' \| grep -v 'pgrep' \| grep -Ev "^($$|$PPID) "`：本复审独立实测——无载体时裸 `pgrep -f` 返回幻 PID（4004147/4004148，即包装壳与管道子壳），新管道输出为空 rc=1；`test_c1_1` 三段（旧写法幻 PID / 新管道排己 / `while :; do sleep 5` 循环壳载体命中且死后归零）随套件通过。语义未被缩窄：循环壳或 python 任一命中即算存活，adapter 内文明写「勿锚定 `^python`」防 sleep 窗口误判。Windows 写法 `Get-CimInstance Win32_Process` + `-notlike '*Get-CimInstance*'` + `$_.ProcessId -ne $PID` 与 Linux 对称——任何含检查全文的包装壳必含 `Get-CimInstance` 字样且 `$PID` 兜底，排己有效；真 watch/重启壳命令行不含该字样不受影响。两 adapter 命令串逐字一致。旧写法可被测试击穿：`assertNotIn("pgrep -f -- 'relay_log.py watch")` + 新增 `assertIn` 钉件在旧文本下双双失败（red.txt 两 adapter FAIL 实据）。次级 caveat（共享 notify 名不能区分）已按上轮建议写进 adapter 内文。 | — |
| C1-2 | 已闭合（原 P2） | `relay_log.py:3744/3756-3802`（屏障+共享去重）、`relay_log.py:3881`（`notified_shared` 属主）、`relay_log.py:3920-3941`（重生传入）；`test_relay_log.py:9633-9676`；`test_relay_log.py:8285-8294`（FakeClock.enter） | 去重态移出线程局部进 `run_watch` 持有的 `notified_shared[key=(scope,agent)]`：异常死→stderr 一行 `died unexpectedly: {exc!r}; notified state kept for respawn`→re-raise→主循环重生→新线程 `_watch_notify(..., notified_shared.get(key))` 命中已通知态不重发。`test_c1_2` 用 flaky get 注入一次 RuntimeError：两次 wait、get 继续、prompt 恰一次、stderr 与 excepthook 双留痕、重生线程存活——旧实现下该用例失败（red.txt：第二条 `-> idle` 重发 + 无 stderr 行），RED/GREEN 真实。不变式核对：同 key 同时只有一条线程（`is_alive` 门 + 终态 agent 被 `_watch_present_agents` 的 TERMINAL_EVENTS 过滤逐出 present，无终态后空转重生）；terminal 分支 `pop` 仅为同名再 launch 清态，`working` 分支 `pop` 保 D9 重通知，`prompt` 失败保留旧态下轮重试——均正确。dict 操作 GIL 原子 + 单写者每 key，无竞态；条目数有界。FakeClock.enter 换新记录修 ident 复用隐身，方向正确（旧 setdefault 会复活 gone 记录）。 | — |
| C2-1 | P3（本轮新登记） | `adapter-claude-code.md:113`、`adapter-codex.md:115` | 排己过滤器按子串丢行：`grep -v 'pgrep'` / `-notlike '*Get-CimInstance*'`。真 watch 命令行若恰含该子串（如 plan 路径或 `--notify` 名含 "pgrep"/"Get-CimInstance"）会被误丢 → 存活核恒报死 → 人工重拉撞出双 watch。属构造性边缘：`$$`/`$PPID`/`$PID` 过滤已盖住主自匹配路径，子串过滤仅增益更深层祖先包装；触发需目录/名字含特定子串。 | 可接受，登记知悉；若求严可改按「行首 PID 后的可执行名」过滤（代价是 `bash -c` 包装壳 argv[1] 为 bash 不再被子串名命中，反而减覆盖），现状取舍合理。 |
| C1-3~C1-7 | P3 维持不修（理由核过） | 见上轮 | C1-3 tick 锚：间隔下限 ≥1200 不破 §7.2 兜底，成立。C1-4 herdr 无 timeout：daemon 随进程退 + join 35s 告警，有界，成立。C1-5 非法状态记账：**本复审核实**——`test_a82_13a/b`（`test_relay_log.py:8971-8994`）钉 `err.count("\n")==1`，若改「不记账」则每次 get 重打拒绝行 ≥3 行直接破钉，「留专项」理由属实。C1-6 哨兵枚举面：上轮自评「tripwire 够用」，成立。C1-7 两项批二 O-2/O-4② 已登记，重复不升编号，成立。F-008 维持「来源未定」：findings.md 追记如实区分「进程内重发候选已闭合」与「观测第二条来源仍未定」，未借整改冒领结案。L-03 已改记落地写法。 | — |

## 核查范围与方法

- **独立复跑**：`cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.WatchTests test_relay_log.SkillAdapterTests test_relay_log.SkillCoreDocTests` → 66 tests OK（4.101s），与 green.txt 一致；`__pycache__`/`.pyc` 审计为空。
- **机制实测**：本机真 `pgrep` 复跑旧/新写法（无载体）：旧式幻 PID×2，新管道空。载体段由 `test_c1_1` 真进程覆盖（非文本断言）。
- **RED 采信**：`evidence/workflow-final-remediation-1/red.txt` 为新测试打在整改前代码上的失败（钉字两 adapter FAIL + test_c1_2 重发+无 stderr），时间戳先于整改提交，链成立。
- **回归采信**：`regression-python.txt` 283 tests OK、`regression-pwsh.txt` RELAY ALL PASS（SKIPPED:1 与基线一致）；`path-audit.txt` 禁动路径空、SKILL.md 恰 UD-2 三 hunk；本复审另核 `git diff --check` 干净、`5a1b216` 仅 orchestrator 自有文件。
- **代码走读**：`_watch_agent_loop` 全函数、`run_watch` 生成/重生段、`_watch_notify`、`_watch_present_agents`/`_watch_agent_terminal` 终态过滤、FakeClock enter/leave/advance_to 配对、test_c1_1/test_c1_2/钉字断言、两 adapter 改动行逐字比对。
- **P3 理由逐条核**：C1-5 理由定位到 `test_a82_13a/b` 单行钉字实证；其余按上轮事实与有界性复核。

## 范围外发现

- `origin/master` 已漂移至 `13d477b`（path-audit 已标注），收口 rebase/合入属 orchestrator 与用户闸门，不属本路径。
- F-008 第二条通知的非进程内候选（短命重拉、prompt 投递层）悬置——上轮已判「代码层无稳态 dedup 缺陷」，本整改闭合其中唯一可代码消除的路径后维持该结论。
