<!-- dh:v1 -->
# brief — DHR_30 Relay CLI 与可选 DSH/Pi Bridge

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|---------|-------------|
| DHR_30 | P5 | `dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md` §3.2 |

## 目标 (Outcome)

交付基于同一 Runtime/RPC 的正式 Relay CLI、客户端中立 Read Model 与可选 DSH Bridge/Pi 消费接缝，任何客户端都不直接写 Store。

## Zero-context 自查

执行者先读本文件、P5 DevPlan §2.1/§2.3/§3.2 DHR_30、`relay-core/README.md`、`as-built/relay-core.md`、`relay-core/contracts/v1-gap-disposition.md`，再在 `wt/DHR_30` 施工；DHR_31、完整 DSH UI、Attention/Approval 命令与 Store 写入均不在范围内。

## 完成条件 ★必写（= 覆盖任务验收口径的并集，标好谁验）

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|------|---------------|--------------------------------|
| 1 | DSH 未安装时，`relay list/status/inspect/events --follow/start/stop/resume` 均可经 RPC 使用，CLI 不依赖 DSH。 | AI | DHR_30；design/06 H2；P5-M2 |
| 2 | CLI 文本与 JSON 同源于 Runtime Read Model；字段定义以两份 P4 pilot schema 和 v1-gap 处置表为起点，`group` 两条镜像断言成立，P4 白名单例外按指定标记关闭。 | AI | DHR_30；design/06 H3；P5-M4 |
| 3 | 客户端断开、退出或 SSH 断链不取消 Run；重连从 Runtime 重建状态。重复 control request 以 request id 幂等，Receipt 唯一。 | AI | DHR_30；design/06 H4；design/02 B1；P5-M2 |
| 4 | DSH Bridge 经 RPC 做查询、订阅、重连与窄控制；Pi/其他客户端 fixture 与 RPC 示例可解析；Bridge 不直接写 Store。 | AI | DHR_30；P5-X；DHR_50 `passed-with-constraints` 条件 |
| 5 | Bridge 若执行，有真实 DSH 渲染截图作为需求境证据；目标机 UI/H-e2e 未验证边界如实保留。 | AI | DHR_30 档位说明；DHR_50 约束 |

## 边界 (Boundaries)

- In scope：`relay-core/cli/`、`relay-core/adapters/dsh-bridge/`、`relay-core/fixtures/clients/`、必要的 CLI/adapter 测试、design/06 字段定义及 P4 §0.2 关闭标记、`workspace/DHR_30/`。
- Out of scope：完整 DSH Client UI、Attention/Approval、basic-agent-task/DHR_31、Runtime/Store/协议私自扩展、业务仓 `.gitignore` 写入、push/deploy/环境操作。
- 何时必须停下问人：P0/P1 三轮不收敛、需改冻结协议或扩大范围、需要改变 DHR_50 约束解释、或 E11 本地收口授权包。

## 触及子系统（收口时更新其 as-built）

- `as-built/relay-core.md`
