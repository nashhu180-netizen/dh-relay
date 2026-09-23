<!-- lesson_candidates.md — RLT_18 教训候选。 -->
# lesson_candidates — RLT_18

## 教训候选

| ID | 一句话教训 | 状态 |
|---|---|---|
| L-01 | `derive_status().agents` 对已终态 agent 永久保留（首个 `agent_launch` `setdefault`）；凡取「在场 agent」必须按 `last_event ∉ TERMINAL_EVENTS` 过滤，否则重挂/重拉逻辑会给已结束实例再开线程。触发现场：batch-1 `_watch_present_agents`（relay_log.py）；规则：读投影先过滤终态再消费 | 候选 |

> 字段口径：候选 ID、触发现场/证据路径、下一次可执行规则、分类、状态；证据一律 repo-relative，不抄 pane/mtime/运行日志细节，不含凭据。升格进 `docs/modules/dh-relay/knowledge/教训库-候选.md` 是单独的人裁决动作。plan 阶段暂无候选。
