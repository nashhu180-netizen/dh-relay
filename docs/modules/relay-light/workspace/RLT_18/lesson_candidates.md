<!-- lesson_candidates.md — RLT_18 教训候选。 -->
# lesson_candidates — RLT_18

## 教训候选

| ID | 一句话教训 | 状态 |
|---|---|---|
| L-01 | `derive_status().agents` 对已终态 agent 永久保留（首个 `agent_launch` `setdefault`）；凡取「在场 agent」必须按 `last_event ∉ TERMINAL_EVENTS` 过滤，否则重挂/重拉逻辑会给已结束实例再开线程。触发现场：batch-1 `_watch_present_agents`（relay_log.py）；规则：读投影先过滤终态再消费 | 候选 |
| L-02 | FakeClock 下两条虚拟时间坑：① watch 启动期的 tick 锚点绑定当时的 `_now`——启动后立刻 `advance_to(150)` 会把锚点推到 1350，确定性节拍用例须先 `advance_to(0)` 落定初始化再推进；② 重试 `clock.sleep(2)` 是**相对**释放时刻而非绝对时刻表，断言重试落点要按「推进时刻+2」算。触发现场：batch-2 `test_a83_1`（red.txt 中 [1350,2550] 漂移）、`test_a83_12c/12d`；规则：虚拟时钟用例先 `advance_to(0)` 锚定，sleep 落点按执行时刻推算 | 候选 |

> 字段口径：候选 ID、触发现场/证据路径、下一次可执行规则、分类、状态；证据一律 repo-relative，不抄 pane/mtime/运行日志细节，不含凭据。升格进 `docs/modules/dh-relay/knowledge/教训库-候选.md` 是单独的人裁决动作。plan 阶段暂无候选。
