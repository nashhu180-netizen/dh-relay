# review — DHR_26

## 完成条件逐条挂证据

| ID | 命题 | 事实证明方式 | 最终裁决者 | 覆盖态 | 实际执行结果 | 证据 |
|---|---|---|---|---|---|---|
| C1 | 不修改 DSH 上游仓库即可加载 Host Plugin；`ctx.relayPilot` 在 DSH 进程内可调用；两份 schema 原样透传，Host 不二次加工、不推导状态。 | 独立 Home DSH rc.7 进程内调用 `snapshot/detail/list`，对比 DHR_25 fixture sha256 与 schema version。 | 机器 | 未覆盖 | 待执行 | 待补 |
| C2 | Host Plugin 可安装、卸载；显式启用/禁用机制存在时一并验证；卸载后服务与事件注册清理。 | 安装转录、卸载转录、重启后服务缺失或清理证据。 | 机器 | 未覆盖 | 待执行 | 待补 |
| C3 | Host 只传普通 JSON，不传 Cordis 活动对象；DSH RC 私有类型不进 Read Model。 | 源包静态检查 + 运行时 `JSON.stringify` + 导入边界检查。 | 机器 | 部分覆盖 | 静态源包已准备，运行时未执行。 | `artifacts/src/dsh-host/` 待提交 |
| C4 | 本机 DSH 由 `0.1.0-rc.6` 升到 `0.1.0-rc.7`，升级前后快照留证，证据来源标明 B-10 预采 + 本卡后快照。 | `dsh --version`、内置包版本、目录结构快照与 diff。 | 机器 | 未覆盖 | 待执行 | 待补 |
| C5 | `findings.md` 登记 DHR_49 所需侦察事实：`dsh.client`、`exports["./client"]`、profile client 扫描锚点、类型定义位置、`--patch` 与 profile 边界。 | 本机 rc.7 文件/安装现场侦察，并记录脱敏路径。 | 机器 | 部分覆盖 | 已记录上游源码初步形态，本机安装事实待补。 | `findings.md` |
| C6 | 本卡只登记事实，不自行贴三态结论。 | review 与 progress 中不出现通过/约束通过/判否裁定。 | 机器 | 部分覆盖 | 当前分支未贴三态结论。 | `progress.md`、`findings.md` |

## 第一轮代码复核

- 状态：未开始。
- 范围：本工作区全部文件、`artifacts/src/dsh-host/` 源包、静态测试、证据链。
- 目标：查 P0/P1 问题，尤其是 DSH 私有类型污染、DevPlan 验收口径漏项、把本机未执行步骤误写成已通过。

## 第二轮换人复核

- 状态：未开始。
- 要求：fresh context，未参与实施，允许只读第一轮记录，不继承第一轮会话上下文。

## 需求境证据

- 状态：未开始。
- 需要的展示：用户本机 DSH 独立 Home 中 `ctx.relayPilot` 首次调用返回两份 fake Read Model 的终端转录，外加安装/卸载路径说明。
- 通过标准：用户能看到 DSH 进程内取到同一份 Read Model；本卡仍不要求 UI 面板。

## 放行判断

当前不可放行。缺失项：本机 DSH rc.7 升级证据、Host Plugin 安装与进程内调用证据、卸载清理证据、两轮复核、需求境证据。
