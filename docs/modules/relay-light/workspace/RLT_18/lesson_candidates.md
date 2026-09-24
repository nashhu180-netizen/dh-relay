<!-- lesson_candidates.md — RLT_18 教训候选。 -->
# lesson_candidates — RLT_18

## 教训候选

| ID | 一句话教训 | 状态 |
|---|---|---|
| L-01 | `derive_status().agents` 对已终态 agent 永久保留（首个 `agent_launch` `setdefault`）；凡取「在场 agent」必须按 `last_event ∉ TERMINAL_EVENTS` 过滤，否则重挂/重拉逻辑会给已结束实例再开线程。触发现场：batch-1 `_watch_present_agents`（relay_log.py）；规则：读投影先过滤终态再消费 | 候选 |
| L-02 | FakeClock 下两条虚拟时间坑：① watch 启动期的 tick 锚点绑定当时的 `_now`——启动后立刻 `advance_to(150)` 会把锚点推到 1350，确定性节拍用例须先 `advance_to(0)` 落定初始化再推进；② 重试 `clock.sleep(2)` 是**相对**释放时刻而非绝对时刻表，断言重试落点要按「推进时刻+2」算。触发现场：batch-2 `test_a83_1`（red.txt 中 [1350,2550] 漂移）、`test_a83_12c/12d`；规则：虚拟时钟用例先 `advance_to(0)` 锚定，sleep 落点按执行时刻推算 | 候选 |
| L-03 | adapter 交付给 stage-lead/编排的 watch 存活核 `pgrep -f -- 'relay_log.py watch --plan <dir> --notify <名> --level stage'` 在 `bash -c`/agent Bash 工具包装内执行时，包装壳 cmdline 自带模式全文 → `pgrep -f` 命中调用壳自身 → 已死 watch 被判「存活」（幻 PID 即包装壳 PID，命令结束即消失）。触发现场：batch-3 H12-②，阶段级 watch 已随 pane 死亡，lead-claude 仍答「Watch 存活（pid 3787534），无需重启」；driver 复现同一 pgrep 返回自身包装壳 PID（raw/pgrep-selfmatch.txt）。规则：存活核须排除调用壳自身且不得锚定解释器——落地写法 `pgrep -af -- <模式>` 后丢含 `pgrep` 与 `$$`/`$PPID` 的行（循环壳或 python 任一命中即算在；锚定 `^python` 会把重启循环 `sleep` 窗口误判死、撞出双 watch）；Windows 对应 `Get-CimInstance Win32_Process` + `-notlike '*Get-CimInstance*'` + `-ne $PID`。已落两 adapter 存活核与钉字断言，`test_c1_1` 真进程实测三段（旧写法幻 PID / 新管道排己 / 循环壳载体命中与死后归零，evidence/workflow-final-remediation-1） | 候选 |
| L-04 | Claude Code 探针两条实测行为：① 长命令一律自动后台化（`sleep 240`、`python3 -c time.sleep` 均「Running in background」+ 回合 done），靠 shell TASK 造不出持续 `working` 窗口，忙碌形态是「排队消息+后台完成事件」驱动的连串微回合；② 发给忙碌 agent 的 prompt 以排队预览形态滞留输入框（`❯` 前缀，backspace/esc 删不掉，`send-text` 只临时覆盖显示，`agent prompt` 到达时按序处理）。触发现场：batch-3 H11/H12 各 pane；规则：探针设计按「排队即送达」理解 herdr prompt 语义，勿把输入框 `❯` 文本当未送达 | 候选 |

> 字段口径：候选 ID、触发现场/证据路径、下一次可执行规则、分类、状态；证据一律 repo-relative，不抄 pane/mtime/运行日志细节，不含凭据。升格进 `docs/modules/dh-relay/knowledge/教训库-候选.md` 是单独的人裁决动作。plan 阶段暂无候选。
