<!-- lesson_candidates.md — RLT_18 教训候选。 -->
# lesson_candidates — RLT_18

## 教训候选

| ID | 分类 | 一句话教训 | 状态 |
|---|---|---|---|
| L-01 | 编码陷阱 | `derive_status().agents` 对已终态 agent 永久保留（首个 `agent_launch` `setdefault`）；凡取「在场 agent」必须按 `last_event ∉ TERMINAL_EVENTS` 过滤，否则重挂/重拉逻辑会给已结束实例再开线程。触发现场：batch-1 `_watch_present_agents`（tools/relay-light/relay_log.py）；规则：读投影先过滤终态再消费 | 候选 |
| L-02 | 编码陷阱 | FakeClock 下两条虚拟时间坑：① watch 启动期的 tick 锚点绑定当时的 `_now`——启动后立刻 `advance_to(150)` 会把锚点推到 1350，确定性节拍用例须先 `advance_to(0)` 落定初始化再推进；② 重试 `clock.sleep(2)` 是**相对**释放时刻而非绝对时刻表，断言重试落点要按「推进时刻+2」算。触发现场：batch-2 `test_a83_1`（docs/modules/relay-light/workspace/RLT_18/evidence/batch-2/red.txt 中 [1350,2550] 漂移）、`test_a83_12c/12d`；规则：虚拟时钟用例先 `advance_to(0)` 锚定，sleep 落点按执行时刻推算 | 候选 |
| L-03 | 领域知识 | adapter 交付给 stage-lead/编排的 watch 存活核 `pgrep -f -- 'relay_log.py watch --plan <dir> --notify <名> --level stage'` 在 `bash -c`/agent Bash 工具包装内执行时，包装壳 cmdline 自带模式全文 → `pgrep -f` 命中调用壳自身 → 已死 watch 被判「存活」（幻 PID 即包装壳 PID，命令结束即消失）。触发现场：batch-3 H12-②，阶段级 watch 已随 pane 死亡，lead-claude 仍答「Watch 存活（幻 PID），无需重启」；driver 复现同一 pgrep 返回自身包装壳 PID（docs/modules/relay-light/workspace/RLT_18/evidence/batch-3/raw/pgrep-selfmatch.txt）。规则：存活核须排除调用壳自身且不得锚定解释器——落地写法 `pgrep -af -- <模式>` 后丢含 `pgrep` 与 `$$`/`$PPID` 的行（循环壳或 python 任一命中即算在；锚定 `^python` 会把重启循环 `sleep` 窗口误判死、撞出双 watch）；Windows 对应 `Get-CimInstance Win32_Process` + `-notlike '*Get-CimInstance*'` + `-ne $PID`。已落两 adapter 存活核与钉字断言，`test_c1_1` 真进程实测三段（旧写法幻 PID / 新管道排己 / 循环壳载体命中与死后归零，docs/modules/relay-light/workspace/RLT_18/evidence/workflow-final-remediation-1/pgrep-self-exclusion.txt） | 候选 |
| L-04 | 领域知识 | Claude Code 探针两条实测行为：① 长命令一律自动后台化（`sleep 240`、`python3 -c time.sleep` 均「Running in background」+ 回合 done），靠 shell TASK 造不出持续 `working` 窗口，忙碌形态是「排队消息+后台完成事件」驱动的连串微回合；② 发给忙碌 agent 的 prompt 以排队预览形态滞留输入框（`❯` 前缀，backspace/esc 删不掉，`send-text` 只临时覆盖显示，`agent prompt` 到达时按序处理）。触发现场：batch-3 H11/H12 各 pane（docs/modules/relay-light/workspace/RLT_18/evidence/batch-3/）；规则：探针设计按「排队即送达」理解 herdr prompt 语义，勿把输入框 `❯` 文本当未送达 | 候选 |
| L-05 | 领域知识 | 兜底 / 看门机制的计时与触发源不得依赖被兜底对象——「watch 给 watcher 发 tick」的方案会随 watch 死亡同步停摆。评估兜底方案先问：被兜对象死亡时，兜底的节拍源还在走吗。触发现场：UD-3 D16 定稿（docs/modules/relay-light/workspace/RLT_18/task_plan.md D16 理由列；decisions.md UD-3）；规则：兜底节拍由兜底方自身定时 | 候选 |
| L-06 | 行为流程 | driver 自起的观测 / 轮询后台脚本必须进收尾清单：探针 tab 与 watch 进程零残留不代表收尾完成——U2 driver 的 nohup 轮询脚本漏关约 18 小时，并持续向已入库证据文件追加噪声，造成提交后漂移。触发现场：docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/H12.md 收尾核验节、raw/agent-status-poll.log 行 71 起（f4c2661 补记）；规则：收尾单列「driver 自起后台写者」（自记 PID），先杀写者再提交证据，观测输出不写已入库文件，补救命令 tee 进 raw | 候选 |
| L-07 | 行为流程 | Devin 长会话停在 `Connection error, send a message to continue retrying` 后不会自动恢复，herdr 状态显示 done / idle，看起来像收工。触发现场：UD-3 U2 coder 提交前、requirement ud3 r1 reviewer 落 review 前各一次（docs/modules/relay-light/workspace/RLT_18/execution_strategy.md 对应行注记）；规则：派活方等 signal 时同时检查 pane 末行的连接错误，发现后发一条无害续跑消息，不按「仍在干活」无限等 | 候选 |
| L-08 | 行为流程 | 带周期节拍职责的 agent 派单后须确认「节拍已武装」（后台 sleep 或合并调用已经起了），首回合 done 不代表已进入节拍；推迟武装会直接拉长首个检查间隔。评估发现时延以实际武装时刻为基准。触发现场：docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/raw/nudge-1.txt（两侧 watcher 各需一次轻推），watcher-o 首个间隔约 14 分钟（review.workflow-final.requirement.ud3.review-round-1.md RQ-U3-3）；规则：拉起 watcher 后核一次节拍已武装再离开 | 候选 |
| L-09 | 领域知识 | pane 输入框里未提交的文字可能是客户端自动建议或残留草稿，不得据此归因「用户 / 操作者键入」；判断是否构成介入，只看其后有没有对应的回应回合。向 agent 转述用户意图前，先确认文本已提交。触发现场：review.workflow-final.requirement.ud3.review-round-1.md RQ-U3-2、docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/H12.md 操作者介入节（三处输入框文字）；规则：输入框文字只记「未提交，键入者不可考」 | 候选 |

## 已知候选复发登记

| ID | 分类 | 复发注记 | 状态 |
|---|---|---|---|
| L-R1 | 行为流程 | dh-relay 教训候选-34「证据转录必须由脚本现场采集写入，不得手抄/摘要——手抄在独立复核复算时才会露馅」在本卡完整复发：batch-3 初审 FAIL 的 F-1~F-8 共 8 条全部为手工转录与 raw 的偏差（docs/modules/relay-light/workspace/RLT_18/check.batch-3.md F-1~F-8；docs/modules/relay-light/workspace/RLT_18/check.batch-2.md O-2 证据头日期笔误同族）；整改 e144dac 后文字与 raw 逐字一致、round-2 PASS。对候选-34 升格属加权证据；后续同类卡教训账建议固定设「已知候选复发登记」位 | 已登记 |
| L-R2 | 行为流程 | 已知坑「后台进程回收」以 driver 侧新形态复发：探针与 watch 零残留成立，但 driver 自己的 nohup 轮询脚本漏关约 18 小时并写入已入库证据文件（docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/H12.md 收尾核验节，f4c2661）。规则扩展见 L-06 | 已登记 |
| L-R3 | 行为流程 | dh-relay 教训候选-34（证据手抄）小形态再复发：H12.md 4 处行号 / 出处偏差，事实本体无误（review.workflow-final.requirement.ud3.review-round-1.md RQ-U3-4），整改 401defb 闭合。同族轻于 L-R1 | 已登记 |

> 字段口径：候选 ID、触发现场/证据路径、下一次可执行规则、分类、状态；证据一律 repo-relative，不抄 pane/mtime/运行日志细节，不含凭据。升格进 `docs/modules/dh-relay/knowledge/教训库-候选.md` 是单独的人裁决动作。
