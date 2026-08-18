# review · DHR_26

## 完成条件覆盖

| ID | 命题 | 当前覆盖 | 结果与证据 |
|---|---|---|---|
| C1 | 树外加载 Host；DSH 进程内 `ctx.relayPilot` 可调用；两份 schema 原样透传。 | 部分 | Host 逻辑、profile bundle 与 mock transcript 已绿；真实 DSH 进程待用户本机。 |
| C2 | 安装、显式禁用、卸载及清理。 | 部分 | 操作器与契约测试已覆盖命令/断言；真实 profile 生命周期待本机。 |
| C3 | 只传普通 JSON，不引入 DSH RC 私有类型。 | 预检覆盖 | 运行包导入边界检查、普通 JSON 行为测试、schema guard 与 mock transcript 已绿。 |
| C4 | rc.6 到 rc.7 的前后快照与差异。 | 未覆盖 | 操作器已实现采集和失败续验；当前环境无 dsh。 |
| C5 | Client 声明、export、扫描锚点、类型路径、patch/profile 边界。 | 部分 | 上游 rc.7 事实已记录，侦察脚本测试通过；本机路径待采。 |
| C6 | 只登记事实，不自行给三态。 | 已遵守 | `findings.md` 与操作器的 `feasibility_judgement` 均无三态裁定。 |

## 实施者复核

已对并发草案进行一次完整差异复核，识别 5 个 P1 与 1 个 P2，全部在当前施工包中修复。该复核由实施上下文完成，只算自检，不冒充 dev-harness 要求的 fresh 独立复核。

## 第一轮 fresh 代码复核

- 状态：待派出。
- 范围：工作区、Host bundle、操作器、证据链、版本失败分支。
- 重点：实际 DSH package resolution、profile layer、`ctx.appExit` 时序、禁用/卸载清理与路径脱敏。

## 第二轮 fresh 对抗复核

- 状态：待派出。
- 前提：第一轮问题已修复，并取得用户机器运行证据。

## 需求境证据

主证据应为用户 Windows 机器执行 `Invoke-Dhr26Pilot.ps1` 后的首次 `ctx.relayPilot` 转录、`RESULT: IDENTICAL` 报告、禁用/卸载 absence transcript 和版本差异。预检中的 mock report 只用于施工前检查。

## 放行判断

当前不可放行。本卡继续处于“进行中”，PR 保持 Draft。缺口为真实 Windows DSH 机器证、两轮 fresh 复核和用户确认；未创建 verify 提交。
