<!-- dh:v1 · brief.md — 工作区封面。🔵 前置填；本卡因 connector 顺序问题标失序补录，见 progress。 -->
# brief — DHR_49 树外 Client Bundle 与 Relay 列表/详情面板

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_49 | P4-DSH 优先的多控制面最小 Pilot | [DevPlan §3.2 DHR_49](../../dev_plan/P4-DSH工作台最小Pilot-开发方案.md#dhr_49桌面控制面轨--client-半程) |

## 目标 (Outcome)

在不 checkout/fork DeepSeek Harness monorepo、也不导入 DSH RC 私有运行类型的前提下，交付一个树外 Client 包：Node 半部只读桥接 DHR_26 `ctx.relayPilot`，浏览器半部装入 DSH Web 的 `sidebar.footer.action`，先按源头 `group` 展示 Run 列表，再可进入对应详情；清净重建、刷新、重启、安装/卸载均有可复跑路径。

## Zero-context 自查

代码真源仍是 DevPlan 指定的仓外 `<experiment-root>/relay-control-pilot/src/dsh-client/`。本工作区 `artifacts/` 是 GitHub transport mirror，`materialize.ps1` 同步后才成为本机 Pilot 代码。当前已完成代码、依赖零化构建配方和 10 条自动化测试；Windows rc.7 实际加载、两屏截图/录屏、浏览器刷新与 DSH 重启、ThinkPad 换机重建、安装卸载清理、列表屏体验中途闸、两轮复核与 verify 均未执行，所以任务保持「进行中」。

## 完成条件 ★逐项登记谁验

| # | 条件 | 谁验 | 当前覆盖 |
|---|---|---|---|
| 1 | P4-DM2：Client Plugin 有可重复构建产物；本机清净重跑与 `ssh thinkpad` 换机重跑都能得到可加载 bundle。 | AI + 用户本机/ThinkPad | 本机清净重跑 present；换机 missing |
| 2 | P4-DM3：列表屏与详情屏分别从统一 Read Model 重建；浏览器刷新与 DSH 重启后结果相同。 | 用户本机 | 代码/模块工厂 partial；真实 DSH missing |
| 3 | P4-DM6：分节与排序只读源头 `group`；改 `group` 必须移动，只改 `run_status` 分组签名逐字不变，未知 group 原样成节。 | AI 机器证 + 用户界面核对 | 自动化 present；界面核对 missing |
| 4 | P4-DM4b / DM5b：Client 可安装/禁用/启用/卸载并清理 route/UI；面板消费路径不把 DSH RC 私有类型塞入 Read Model。 | AI 代码证 + 用户本机 | 静态/单测 partial；进程生命周期 missing |
| 5 | 构建配方全文、外部前提与 §4.4 止损条件逐条登记；本卡不自行贴三态标签。 | AI | present（目标机项仍标 missing） |
| 6 | 列表屏首次真实渲染后执行中途人闸；用户亲跑端到端并逐条判断渲染机制/信息组织/控制面偏好。 | 人 | missing，必须本地补做 |

## 边界 (Boundaries)

- In scope：`src/dsh-client/**`、隔离 `dsh-home/` 的本机验证、本工作区 DHR_49 工件。
- Out of scope：正式 Relay RPC、v1 活现场投影、Relay 写权、DSH 上游改动、完整工作台首页/项目管理/流程编辑器、P4 三态裁定。
- Pilot 约束：Node 半部使用 same-origin GET/HEAD 路由承载**冻结 fake Read Model**，只服务 DSH Web Pilot；它不是 P5 的生产 IPC/RPC 决策。
- 禁止宣称：未发生的 Windows/ThinkPad 构建、真实 DSH 页面、截图、刷新/重启、生命周期、复核和 verify。

## 交付镜像

- `artifacts/relay-control-pilot/src/dsh-client/`：Node bridge、独立 Client model、列表/详情面板、无依赖 builder、测试。
- `materialize.ps1`：同步后立即 build + clean-rebuild verify；要求 DHR_25 fixture 与 DHR_26 Host 已存在。
- `review.md`：用户本地完整安装、打开、列表中途闸、详情、刷新、重启、卸载与 ThinkPad 操作路径。
