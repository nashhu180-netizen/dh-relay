# brief — DHR_26 树外 DSH Host Plugin 与 rc.7 现场侦察

- 计划：[P4-DSH工作台最小Pilot-开发方案.md](../../dev_plan/P4-DSH工作台最小Pilot-开发方案.md#dhr_26桌面控制面轨--host-半程)
- 档位：标准
- 分支：`wt/DHR_26-dsh-host-pilot`
- 工作区：`docs/modules/dh-relay/workspace/DHR_26/`
- 实验根：`D:\MyFiles\ai-workflow\dh-relay-p4-pilot\`
- DSH 独立 Home：`<experiment-root>\dsh-home\`
- 实施落点：`<experiment-root>\relay-control-pilot\src\dsh-host\`
- 仓内源包：`artifacts/src/dsh-host/`，只作 DHR_26 本机施工输入，不接入本仓 `tools/` 生产代码。

## 背景与边界

DHR_26 是桌面控制面轨的 Host 半程。目标是在不修改 DeepSeek Harness 上游源码的前提下，把最小 `ctx.relayPilot` Host Service 以树外插件方式装进独立 Home 的 DSH，让 DSH 进程内能读取 DHR_25 冻结的两份 fake Read Model。Client 插件、面板 UI、v1 活现场投影、Relay 写权、DHR_49 的 Client bundle 可行性判断均不属于本卡。

本仓 GitHub 侧只能完成工作区、施工源包和静态检查准备。`dsh --version` 复验、rc.6 到 rc.7 升级、独立 Home 安装、DSH 进程内 `ctx.relayPilot` 调用、卸载清理与升级后快照，必须在用户本机执行后把证据回填到 `progress.md`、`findings.md` 和 `review.md`。

## 完成条件

| ID | 谁验 | 完成条件 |
|---|---|---|
| C1 | 机器 | P4-DM1：不修改 DSH 上游仓库即可加载 Host Plugin。`ctx.relayPilot` 在 DSH 进程内可被调用，两份 schema 原样透传，Host 不做二次加工、不推导状态。 |
| C2 | 机器 | P4-DM4a：Host Plugin 可安装、卸载。上游有显式启用或禁用机制则一并验证；无则如实登记“未验证”。卸载后服务与事件注册得到清理。 |
| C3 | 机器 | P4-DM5a：Host 只传普通 JSON，不传 Cordis 活动对象；DSH RC 私有类型不进 Read Model。 |
| C4 | 机器 | 版本基线：开工第一步复验本机仍为 `0.1.0-rc.6`；由 `0.1.0-rc.6` 升到 `0.1.0-rc.7`；升级前后各留 `dsh --version`、内置包版本与安装目录结构快照。证据来源登记为“B-10 预采前快照 + 本卡升级后快照”。版本已漂时作废预采，就地重采前快照再升。 |
| C5 | 机器 | 侦察落档：`findings.md` 记录官方 client 插件的 `dsh.client` 声明形态、`exports["./client"]` 产物形态、profile 的 client 扫描锚点、本机可用类型定义位置、`--patch` 与 profile 安装各自适用边界。缺此项 DHR_49 不得开工。 |
| C6 | 机器 | 本卡只登记事实，不自行给出 `passed / passed-with-constraints / stopped-by-pilot` 三态结论。 |

## 非目标

不做 Client 插件和面板 UI；不做 v1 活现场投影；不接 Relay 运行写权；不修改 DeepSeek Harness 上游源码；不判断 Client bundle 构建配方是否可行；不改本仓 `tools/` 现役生产代码。
