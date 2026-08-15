<!-- dh:v1 · execution_strategy.md — 分工。🟡 开工时定一次。 -->
# execution_strategy — DHR_03 接真实可见 psmux 并完成阻塞接力 dogfood

## 操作模型

混合：**批0（preflight）/ 批C / 批D（两场 dogfood）由主控（Claude 主会话）亲跑**——要弹真实可见窗口、要截图、decision 场景要用户在窗口里回答一次；**批A（psmux adapter）/ 批B（宿主循环 + agent 侧工具）派 headless worker 施工**（默认 codex `codex exec --yolo`，同 DHR_02 先例；worker 只保证离线套件绿，真实 psmux 套件由主控在 `RELAY_REAL_TERMINAL=1` 下跑）。主控负责工作区/task_plan/K 决策、worktree、派活、批次小审、真实套件与 preflight 亲跑、两场 dogfood 驱动、收口三路复核调度与 E 段。用户 2026-08-15 对话"继续DHR3"= 开工授权（DevPlan dh:status 原写"待用户明确开工"）。

## 子 agent 授权（若派单）

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---------|---------------------------|--------|
| codex（施工 worker，headless，cwd=任务树根 `.dh-worktrees/DHR_03`） | 可写：`tools/relay/adapters/psmux*`、`tools/relay/adapters/preflight/**`、`tools/relay/host/**`、`tools/relay/tests/**`（新套件/新夹具/清单/守卫范围）、`tools/relay/contracts/relay-params.psd1`（只追加三键）、`docs/modules/dh-relay/workspace/DHR_03/{progress,findings,DONE,review-logs}`；只读：design/01、as-built、contracts 其余、runner（只可追加新函数）；禁写：其余一切；**禁起可见窗口** | 用户 2026-08-15 对话"继续DHR3" |
| 一次性 orchestrator / replanner agent（dogfood 内，headless `claude -p`） | 只写 `.dh-runtime/relay/<run_id>/inbox/`（经 agent-tool）；只读 dogfood fixture 与 handoff | 批C/批D 主控拉起 |
| dogfood worker agent（可见交互 `claude`，psmux 窗口） | 只写 `.dh-runtime/relay/<run_id>/attempts/<n>/<a>/`（经 agent-tool）与 `work/`；不写 Runner 状态 | 同上 |
| fresh 小审 / 轮1 / 轮2 复核（headless，非施工者） | 只读全仓 + 可写本工作区 review 相关登记（由主控代落） | 开工委托默认 |

## 收尾铁律

- 证据不全 / 有 P0–P1 未关闭前，不许标"待验收"。
- 子 agent 默认无写权，要人批准。
- 施工者不复核自己的代码；两轮换人复核不用施工会话。
- H1/H2 只能由用户在对话里判；截图与机读事件必须能互相对照（文件名含 event_id + 同刻窗口标题列表）。
- 主控收口前必做变异探针：至少各改一条 adapter 判定（精确匹配改前缀 / kill 改 `=name` / 去掉 attached 等待 / 宿主去掉 tmp 改名）证明对应断言真红后复原。
- 任何一步不得把凭据值写进 evidence（tail 经 `Invoke-RelayTailSanitize`；截图前确认窗口无凭据显示）。
