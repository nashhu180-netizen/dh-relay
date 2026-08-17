<!-- dh:v1 · execution_strategy.md — 分工。🟡 开工时定一次。 -->
# execution_strategy — DHR_02 实现最小 Runner 与确定性 fake replay

## 操作模型

派子 agent：codex headless 施工（用户 2026-08-15 "开"= 按 DHR_01 同流程，施工照旧派 codex）。主控（Claude 主会话）负责：工作区/task_plan（含 Code Scout 校准与 K-1～K-10 决策）、worktree、派活、批次小审派发、收口三路复核调度与 E 段收口；codex 按 `task_plan.md` 批A~批D 施工并按批提交。

## 子 agent 授权（若派单）

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---------|---------------------------|--------|
| codex（施工 worker，headless，`codex exec --yolo`，cwd=任务树根） | 可写：`tools/relay/runner/**`、`tools/relay/adapters/**`、`tools/relay/tests/**`（新套件/新夹具/清单/守卫扫描范围）、`tools/relay/contracts/relay-params.psd1`（只追加一键）、`docs/modules/dh-relay/workspace/DHR_02/`（progress/findings/DONE/review-logs）；只读：design/01、as-built、contracts 其余、DHR_01 夹具；禁写：其余一切 | 用户 2026-08-15 对话确认开工（"开"） |
| fresh 小审 / 轮2 复核（headless，非 codex） | 只读全仓 + 可写本工作区 review 相关登记（由主控代落） | 开工委托默认 |

## 收尾铁律

- 证据不全 / 有 P0–P1 未关闭前，不许标"待验收"。
- 子 agent 默认无写权，要人批准。
- codex 不复核自己施工的代码；两轮换人复核均不用 codex 施工会话（fresh codex 会话可作复核候选，同 DHR_01 先例）。
- 主控收口前必做变异探针：至少各删一条 Runner 判定（如去掉 receipt 先于 spawn 的顺序、去掉 frozen_by 写入、去掉 CAS 比对）证明对应断言真红后复原。
