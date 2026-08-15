<!-- dh:v1 · execution_strategy.md — 分工。🟡 开工时定一次。 -->
# execution_strategy — DHR_01 冻结接力权威、双维状态与异常契约

## 操作模型

派子 agent：codex headless 施工（用户指定"代码让 codex 开发"）。主控（Claude 主会话）负责：工作区/task_plan、worktree、派活、批次小审派发、收口三路复核调度与 E 段收口；codex 按 `task_plan.md` 批A~批D 施工并按批提交。

## 子 agent 授权（若派单）

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---------|---------------------------|--------|
| codex（施工 worker，headless） | 可写：`tools/relay/**`、`docs/modules/dh-relay/workspace/DHR_01/`（progress/findings/DONE）；只读：design/01、tools/protocol 样板；禁写：其余一切 | 用户 2026-08-15 对话确认开工并指定 codex |
| fresh 小审 / 轮2 复核（headless，非 codex） | 只读全仓 + 可写本工作区 review 相关登记（由主控代落） | 开工委托默认 |

## 收尾铁律

- 证据不全 / 有 P0–P1 未关闭前，不许标"待验收"。
- 子 agent 默认无写权，要人批准。
- codex 不复核自己施工的代码；两轮换人复核均不用 codex。
