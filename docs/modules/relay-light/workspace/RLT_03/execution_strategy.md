<!-- dh:v1 -->
# execution_strategy — RLT_03

## 操作模型

Herdr 交互 pane 分工：Terra High 只做施工，每批按 TDD 收到 checkpoint；Opus 只读审核批次 diff/证据。heavy Recipe 的收口轮 2 用另一个 fresh Opus pane，不复用批次小审会话。

## 子 agent 授权

| agent | 范围 | 谁批准 |
|---|---|---|
| `rlt03-terra` | 可写 `relay_log.py`、`test_relay_log.py`、`workspace/RLT_03/progress.md`、`findings.md`；其余只读 | 用户 2026-09-10 明文 |
| `rlt03-opus-bN` | 只读本批 diff/证据；结论写指定的 workspace review 日志文件，不改代码 | 用户 2026-09-10 明文 |
| `rlt03-opus-r2` | fresh-context 收口增量复核+选有效单测变异点；只读代码 | 用户 2026-09-10 明文 |

## 收尾铁律

- 证据不全或有 P0/P1 未关前不许标“待验收”。
- 审核者不修代码；发现逐条 P0–P3 落指定独立日志，主控裁决并回送 Terra 修。
- 施工者不更改 DevPlan 状态、review.md、不 commit/merge/verify/push。
