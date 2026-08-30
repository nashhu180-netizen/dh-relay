<!-- dh:v1 · workspace/DHR_35/brief.md -->
# DHR_35 · Windows 真实 Codex/Claude Code 执行闭环 — Brief

> 出处（唯一权威）：[P6 开发方案](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md) §3.2 DHR_35。本文件是只读副本；口径冲突以 DevPlan 为准。
> 档位：标准（存量卡无 `任务类型`，按标准档 legacy 配方执行两轮独立复核、需求/教训/一致性复核与有效单测；本卡无生产代码 diff 时变异测试不适用，须留证）。
> 开工授权：用户 2026-08-30 明确“继续 DHR35，linux 可以暂缓”。B-29 已确认：DHR35 现在 `blocked-by:DHR_34,DHR_63,DHR_64,DHR_65,DHR_66,DHR_67`；DHR34/63/64/65 已完成范围保留，DHR66/DHR67 尚需各自 D-start。原授权不扩展至 registry 或生产桥接，且在全部前置完成、用户重新放行前不再运行真实 Windows 实录。

## 目标（一句话）

在 DHR_34/DHR_63/DHR_64/DHR_65/DHR_66/DHR_67 闭合且用户重新放行后，在 DSH 关闭的 Windows 本机上分别用一个已冻结 Codex Profile 与一个已冻结 Claude Code Profile 完成 Relay Receipt → Herdr 观测 → checkpoint → `submit-executor-result` → committed Ack → Result → CLI inspect/events/focus 的真实闭环，并留下不含凭据的可复查证据。

## 覆盖任务

- 覆盖 DevPlan 的 DHR_35 Windows 真实闭环、design/12 P6-RI-A4、P6-M1/P6-M3/P6-M5、P6-X（若 DSH/Pi 可用则同一 Run 对证，否则登记不适用）和 P6-H 的 Windows 展示备料。
- Linux SSH smoke（P6-M6）按已确认的 DHR-B-22 调整①保持 `延后/受限`，不运行、不以 fixture 冒充真实 SSH；只在 P6 阶段闸裁决时由用户受理或指定补录卡。

## 完成条件（验收口径逐字承接 DevPlan §3.2 DHR_35）

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| 1 | **机器证**：[design/12 P6-RI-A4](../../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md#4-验收清单) · P6-M1：至少一个 Codex 与一个 Claude Profile 完成 Receipt→checkpoint→submission→Result 真实节点，Receipt 身份链可证、零凭据；Herdr/judge 不得直写 Result。 | AI | DHR_35 验收口径 |
| 2 | **机器证**：[design/06 H9](../../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P6-M6：Linux SSH 断开 / 重连不丢 Herdr 会话与 Relay Run 真相（真实 SSH，不接受 fixture 替代；`DHR-B-22` 调整①延后，汇合点 = P6 阶段闸裁决）。 | AI（本卡不执行，记延后/受限） | DHR_35 验收口径 |
| 3 | **机器证**：[design/06 H1 / H5](../../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P6-M3/M5：working / blocked / done / unknown 均有真实或受控证据；DSH 关闭时 CLI 显示状态、Attention 与正确 host_ref。 | AI | DHR_35 验收口径 |
| 4 | **机器证**（P6-X）：[design/06 H3](../../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)：DSH / Pi 可用时连接同一 Run，无第二份状态判断；不可用登记不适用。 | AI | DHR_35 验收口径 |
| 5 | **人判**：[design/05 §8.2](../../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#82-实际-codex-和-claude-code-产品) · P6-H：向用户展示 Windows 两条闭环实录 + Linux SSH 实录 + pane 交互延迟；用户判断 Herdr + Codex/Claude Code 是否适合作施工主力、多账号选择与 fallback 是否清楚、Windows pane 交互延迟是否可接受、Linux SSH detach/重连/附着是否适合日常、DSH→Herdr 跳转（若可用）是否自然。 | 人（Linux 部分延后） | DHR_35 验收口径 |

## 允许路径（施工前冻结）

- `docs/modules/dh-relay/workspace/DHR_35/**`
- 由本卡脚本创建的系统临时目录 `DHR35-*`（不入仓；完成/失败后按脚本清理）

> 以上仅在 DHR_34/DHR_63/DHR_64/DHR_65/DHR_66/DHR_67 闭合且用户重新 D-start 后可使用；当前不执行。

## 禁改边界

- `relay-core/contracts/**`、`relay-core/store/**`、`relay-core/rpc/**`、`relay-core/runtime/**`、`relay-core/profiles/**`、`relay-core/cli/**`：本卡只消费既有实现，不改生产合同或运行时。
- 用户级 Codex/Claude Code/Herdr 配置、凭据、账号状态：不读取值、不写入、不登录。
- Linux/SSH、push、部署、环境/生产操作、verify 和人类签名区：均不在本轮授权内。

## 触及子系统（收口时更新其 as-built）

- 无（本卡仅产生外部实录与工作区证据，不改现役子系统）。
