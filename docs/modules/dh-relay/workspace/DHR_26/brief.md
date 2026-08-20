<!-- dh:v1 · brief.md — 工作区封面。🔵 前置填。完成条件只复制 DevPlan 终点，不替代权威计划。 -->
# brief — DHR_26 树外 DSH Host Plugin 与 rc.7 现场侦察

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_26 | P4-DSH 优先的多控制面最小 Pilot | [DevPlan §3.2 DHR_26](../../dev_plan/P4-DSH工作台最小Pilot-开发方案.md#dhr_26桌面控制面轨--host-半程) |

## 目标 (Outcome)

不改 DeepSeek Harness 上游源码，在仓外 Pilot 目录提供一个可装、可卸、可显式禁用/启用的 Host 插件。插件在 DSH 进程内暴露 `ctx.relayPilot`，从 DHR_25 冻结 fixture 读取列表与详情两份 Read Model，**原样透传**为普通 JSON（两个模型之间不做交叉校验：上游本就不是一一对应，缺 detail 的 run 降级为 `getRun()→null` 并记入 `snapshot.diagnostics`）；同时把 rc.6→rc.7 版本现场与树外 Client 插件构建/扫描事实交给 DHR_49。

## Zero-context 自查

新执行者只读本 brief、`task_plan.md` 与 DevPlan 任务卡即可接手。代码真源仍是仓外 `<experiment-root>/relay-control-pilot/src/dsh-host/`；本工作区的 `artifacts/` 是 GitHub 交接镜像，必须先用 `materialize.ps1` 同步到 DevPlan 指定的实验根。**（2026-08-20 更新）** 代码开发、Windows DSH rc.7 真实加载、版本快照、装卸/禁用/启用转录、**两轮换人复核（含两次收敛复检）与三轮返工**均已完成，P0/P1 清零；当前状态「待验收」，只差用户对话确认与 `verify(dh-relay):` 收口。证据总索引见 `evidence/README.md`（六批），复核结论见 `review.md`。

## 完成条件 ★逐项登记谁验

| # | 条件 | 谁验 | 证据归属 |
|---|---|---|---|
| 1 | P4-DM1：不修改 DSH 上游即可加载 Host Plugin；`ctx.relayPilot` 在 DSH 进程内可调用，两份 schema 原样透传，Host 不二次加工、不推导状态。 | AI 代码证 + 用户本机实跑 | DevPlan DHR_26 |
| 2 | P4-DM4a：Host Plugin 可安装/卸载；上游有显式启用/禁用机制则验证；卸载后服务与事件注册清理。 | 用户本机实跑 | DevPlan DHR_26 |
| 3 | P4-DM5a：Host 只传普通 JSON，不传 Cordis 活动对象；DSH RC 私有类型不进 Read Model。 | AI 代码证 + 用户本机实跑 | DevPlan DHR_26 |
| 4 | 本机 DSH 由 rc.6 升 rc.7，前后留 `dsh --version`、内置包版本与安装目录快照；证据链写明「B-10 预采前快照 + 本卡升级后快照」。版本漂移时作废预采并重采。 | 用户本机 | DevPlan DHR_26 版本基线 |
| 5 | `findings.md` 登记 `dsh.client`、`exports["./client"]`、profile 扫描锚点、类型定义位置、`--patch` 与 profile 安装边界，作为 DHR_49 开工输入。 | AI | DevPlan DHR_26 侦察落档 |
| 6 | 本卡只登记事实，不裁定 DSH 桌面轨三态。 | 主会话/用户 | DevPlan §2.3 |

## 边界 (Boundaries)

- In scope：仓外 `src/dsh-host/**`、隔离 `dsh-home/` 的本机验证、本工作区 DHR_26 工件。
- Out of scope：Client 面板、v1 活现场投影、Relay 写权、DSH 上游改动、DHR_27 三态裁定。
- 禁止宣称：未在此执行环境发生的 rc.7 升级、Windows DSH 进程加载、Profile 生命周期、截图/终端转录、复核与 verify。

## 交付镜像

- `artifacts/relay-control-pilot/src/dsh-host/`：Host 插件源码与测试。
- `materialize.ps1`：把镜像同步到既有 DHR_25 实验目录，不复制或改写 fixture。
- `evidence/`：代码级自动化证据 + 目标机证据。目标机接线已于 2026-08-18 晚完成（rc.7 / 独立 `DSH_HOME` / `web` profile / 两种安装形态），见 `evidence/target-web/` 与 `evidence/zero-import/`；2026-08-20 又补了 `round2-lifecycle/`（卸载清理动态证据 + 三套变异对照）。**仍缺的只有 verify 收口与用户签收。**
- `devplan-handoff.md`：本地同步 P4 状态块/任务行时的精确建议，不冒险整文件覆盖权威计划。
