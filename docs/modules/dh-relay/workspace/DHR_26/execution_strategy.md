<!-- dh:v1 · execution_strategy.md — 分工。🟡 开工时定一次。 -->
# execution_strategy — DHR_26

## 操作模型

- 任务分支：`agent/dhr26-host-pilot`，从 `master@a4584ee7` 独立产生；不改 master、不建 PR、不 merge。
- 生产落点：DevPlan 指定的仓外 `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\dsh-host\`。
- GitHub 仅保存可审查的 transport mirror 与 DevHarness 工件；`materialize.ps1` 是唯一同步入口。
- ChatGPT 负责：上游接口侦察、TDD、代码实现、代码级自检、交接工件。
- 用户本地负责：rc.6→rc.7、真实 DSH/Windows 生命周期、终端转录、两轮独立复核、收口与 verify。

## 权限与边界

| 角色 | 可写 | 禁止 |
|---|---|---|
| 施工会话 | 本工作区、transport mirror | P4 其他任务、DSH 上游、master、真实用户 DSH 配置 |
| 本地复核者 1/2 | 只读代码；仅写各自 review log | 修改实现后仍自称独立复核 |
| 用户 | 目标机实验根、独立 DSH_HOME、最终状态/verify | 未看证据直接把任务标完成 |

## 收尾铁律

代码测试全绿不等于 DHR_26 验收全绿；没有 Windows rc.7 进程证据与两轮复核时，状态固定为「进行中」。本卡不裁定 DSH 三态。
