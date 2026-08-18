<!-- dh:v1 · execution_strategy.md — 分工。🟡 开工时定一次。 -->
# execution_strategy — DHR_49

## 操作模型

- 分支：`agent/dhr49-client-pilot`，父提交为 DHR_26 `155dd831`，保持硬依赖可见；本卡自身压为单提交。
- 生产落点：仓外 `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\dsh-client\`。
- GitHub transport mirror 只用于审查/同步；`materialize.ps1` 负责目标目录构建，不改变 P4 落点。
- 构建不下载依赖、不 checkout DSH：Node 18+ 直接生成 rc.7 module-loader factory。
- ChatGPT 负责：公开接口侦察、TDD、实现、确定性构建与代码级证据。
- 用户本地负责：Windows DSH rc.7 实装、列表中途人闸、两屏操作/刷新/重启、ThinkPad 换机重建、两轮复核、收口。

## 子系统边界

| 面 | 做法 | 原因 |
|---|---|---|
| Host→Client Pilot transport | same-origin GET/HEAD frozen snapshot route | Typert 正式 Remote 生成链不属于 P4；保持零写、易卸载 |
| Client build | dependency-free wrapper builder | 直接复刻 rc.7 公开 module-loader wire，避免 monorepo/私有 build helper |
| UI seat | `sidebar.footer.action` | 公开 list slot，最小侵入且可完整清理 |
| 状态组织 | 源 `group` + 源顺序 | 禁止从 `run_status` 推导第二套真相 |

## 收尾铁律

- 真实 DSH 渲染、刷新/重启与 ThinkPad build 缺证时，DM2/DM3/DM4b 不能记 pass。
- 本卡只能登记事实，不贴 `passed / passed-with-constraints / stopped-by-pilot`。
- same-origin route 只是一阶段 fake-fixture Pilot 约束，不得偷渡成 P5 生产协议。
