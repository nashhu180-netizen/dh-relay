# brief · DHR_26 树外 DSH Host Pilot

- 计划：[`P4-DSH工作台最小Pilot-开发方案.md`](../../dev_plan/P4-DSH工作台最小Pilot-开发方案.md#dhr_26桌面控制面轨--host-半程)
- 档位：标准
- 状态：进行中
- 分支：`wt/DHR_26-dsh-host-pilot`
- 草稿 PR：#1
- 实验根：`D:\MyFiles\ai-workflow\dh-relay-p4-pilot\`
- 独立 DSH Home：`<experiment-root>\dsh-home\`
- 仓外实施落点：`<experiment-root>\relay-control-pilot\src\dsh-host\`

## 目标

在不改 DeepSeek Harness 上游源码、不碰 dh-relay `tools/` 现役代码的前提下，提供可由 DSH profile 安装的树外 Host bundle。该 bundle 通过公共 Cordis `Service` seam 注册 `ctx.relayPilot`，从 DHR_25 冻结 fixture 读取并原样返回：

- `relay.pilot-run-list/v1`
- `relay.pilot-read-model/v1`

同时准备 rc.6 到 rc.7 版本证据、独立 Home、安装、显式禁用、卸载、清理、重新安装与 DHR_49 Client 侦察的一键施工脚本。

## 本轮已交付

1. 零构建 ESM Host bundle，依赖公共 `@deepseek-ai/cordis` 4.x，不导入 `@deepseek-ai/dsh-*` 私有运行类型。
2. `dsh.bundle.patch` profile 层，提供 Host 行与一次性 probe 行。
3. `ctx.relayPilot.listRuns()` 与 `ctx.relayPilot.inspectRun(runId?)`，每次重新读取 fixture，不缓存、不排序、不分组、不推导状态。
4. probe 通过 `ctx.appExit` 请求 DSH 有界退出，适合自动留证。
5. PowerShell 操作器，覆盖版本快照、升级失败续验、fixture 发现、profile 安装、进程内调用、禁用、卸载、清理、重装及 Client 侦察。
6. 18 项本地预检、语法检查、npm pack dry-run 与 mock transcript 对证。

## 尚未满足的收口条件

当前执行环境没有 Windows DSH、PowerShell、pnpm 与 `D:\MyFiles\...` 实验现场，因此以下机器证仍须在用户本机运行操作器后回填：rc.6/rc.7 版本链、真实 DSH 进程内调用、独立 Home 生命周期、实际安装目录侦察。两轮 fresh 独立复核也尚未派出。本卡保持“进行中”，草稿 PR 不转 Ready，不创建 `verify(dh-relay):` 提交。
