<!-- dh:v1 · brief.md — 工作区封面。完成条件 = 任务卡验收口径的逐字复制 + 出处回链；DevPlan 是唯一权威，本文件是只读副本。 -->
<!-- dh:workspace-contract:v2 -->
# brief — DHR_70 · Receipt 提交撞上已关闭的执行器

> 出处（唯一权威）：[P6 开发方案](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md) §3.2 DHR_70。本文件是只读副本；冲突以 DevPlan 为准。
> 档位：标准（外部宿主组件接线 · 高危五类之一）。任务类型：**heavy**。
> 开工授权：用户 2026-09-01 对话「开工授权」+ 点选「开树 wt/DHR_70」「本会话自干」「委托节点沿用默认」，承接 B-34 已确认的卡合同。授权至 **E10 人验准备**；**不含** verify、合并、推送、真实 Agent、DHR_35 重跑、用户级 registry/凭据读写。

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_70 | P6 Herdr 多账号执行底座 | DevPlan §3.2 DHR_70；`DHR-B-34`；design/12 P6-RI-A1/A3 与「Gate 生命周期」 |

## 目标 (Outcome)

让 Receipt-bound 的 `submit-executor-result` 在 Attempt 仍**非终态**时，一定打到**当前持 lease 的 actor / gate** 并写入**唯一** Result；覆盖 DHR_35 已暴露的 Claude 形态（启动与 Receipt 均成功、提交报 `E_LEASE_HELD:actor-closed`）。本卡是 P6-RI-A4 的**提交前置**，不承接 A4 本身。

## Zero-context 自查

只读本文件 + DevPlan §3.2 DHR_70：终点是**让提交找到活的持 lease actor**，不是让旧 actor 活得更久，也不是让 `host.mjs` 少拒绝。六条完成条件全是机器证，A3 是防止"修过头"的负例闸。不跑真实 Agent，不改协议合同。

## 完成条件 ★必写

> 逐字复制自 DevPlan §3.2 DHR_70「验收口径」，六条均为**机器证**。

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| A1 | lease **仍然有效**、Receipt 仍 current、节点非终态 → 晚交（含 driver 本届 herdr 等待已结束）必须得到 committed Ack + `relay.result/v2`（`structured.source=receipt-bound-submission/v1`）。 | machine | DHR_70；P6-RI-A1 |
| A2 | 旧 actor **已结束或已失租**、Run 非终态、Receipt 仍 current → 旧 actor 对提交**拒绝且零 mutation**；service **新取 lease、新 actor、重建 gate** 后提交**恰好一个** Result；同 digest 重投幂等。 | machine | DHR_70；P6-RI-A1 + design/12「Gate 生命周期」 |
| A3 | 无法合法取得当前 lease（真 lease-lost / 非 current Receipt / 已终态）→ **保持拒绝、零 mutation**。禁止为修 `actor-closed` 放宽单写者。 | machine | DHR_70；P6-RI-A3 |
| B | 未知 Receipt / 终态冲突仍按现役拒绝或幂等，不因改 gate 而变。 | machine | DHR_70；P6-RI-A3 |
| C | `agent_get=idle` ∧ `pane_get=error`（对齐 E-3526 观测）**不得单独**把 Attempt 写成 `E_EXECUTOR_HOST_LOST` 终态；提交走 A1 或 A2。 | machine | DHR_70；DHR_35 E-3526 |
| D | 定向套件可复跑；`git diff --name-only` 不越 DevPlan 逐条允许路径。 | machine | DHR_70 |

**有效单测（重核卡必做）**：变异点由**轮 2 复核实例**选点并登记；把 gate/actor 复用判据改坏后，指定测试必须变红。施工方自报即红。

## 边界 (Boundaries)

- **In scope**：`service.mjs`、`workflow-driver.mjs`（仅提交权/gate/actor 复用与 idle 等待收口）、`host.mjs`（仅当 H1 证明 actor 过早 `done`）、`launcher.mjs`（仅当 H3 成立）、`test/dhr70-submission-gate.test.mjs`（新建）、`test/dhr64-result-bridge.test.mjs`（仅最小更新）、`package.json`（只追加测试文件名）、本工作区。
- **Out of scope**：`contracts/**`、`store/**` 的 mutation 语义、reason code 表、`herdr-cli.mjs`、`herdr-executor.mjs`、DHR_35 工作区与实录脚本、用户级 registry/凭据/账号配置、Linux/SSH、产品目录信任、真实 Agent。
- **红线**：**不得放宽 lease 单写者闸门**——修 `actor-closed` 不许用"失租后也允许写"实现（A3 就是这条的机器闸）；**不得**把「必须打到写 Receipt 的那一届进程」写进实现或测试（与重启恢复冲突）。
- **何时必须停下问人**：E11 一次性确认本地收口授权包；P0/P1 三轮不收敛；夹具证明必须动 `herdr-executor.mjs` 观测层（需另走用户确认扩路径）。

## 触及子系统（收口时更新其 as-built）

- `as-built/relay-core.md`（提交权 / gate / actor 生命周期现状）
