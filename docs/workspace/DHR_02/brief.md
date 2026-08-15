<!-- dh:v1 · brief.md — 工作区封面。🔵 前置填。写"终点"，不写路线。完成条件 = 任务卡验收口径的逐字复制 + 出处回链；DevPlan 是唯一权威定义，本文件是施工现场的只读副本，口径变更以 DevPlan 为准、本文件跟改并在 progress 记一笔。 -->
# brief — DHR_02 实现最小 Runner 与确定性 fake replay

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|---------|-------------|
| DHR_02 | P1-最小接力PoC | [DevPlan §3.2 任务卡 DHR_02](../../dev_plan/P1-最小接力PoC-开发方案.md#dhr_02) |

## 目标 (Outcome)

实现最小确定性 Runner core（`tools/relay/runner/`）与 fake terminal adapter（`tools/relay/adapters/fake-adapter.ps1`），用可重放测试证明 CAS、receipt、幂等、暂停和异常 fail-closed：Runner 只调用 DHR_01 冻结的契约函数做身份与转换判定，不复制判定逻辑；两条端到端确定性回放（blocked→replan→B→fresh A、decision checkpoint→依赖冻结/无依赖继续→同 session 后续 checkpoint/final）与一张异常矩阵全部由 `tools/relay/tests/run-relay-tests.ps1` 一键复跑证明。

## Zero-context 自查

新 agent 只读本 brief + DevPlan 任务卡 + `task_plan.md` 即可开工：终点=runner/adapter/夹具/五套件落盘且 `run-relay-tests.ps1` 11 套件全绿（DHR_01 六套件保持绿）；边界=只动 `tools/relay/runner/**`、`tools/relay/adapters/**`、`tools/relay/tests/**`（新套件+新夹具子目录+runner 清单+reason 守卫扫描范围）、`relay-params.psd1` 追加一键、本工作区；谁验=全部机器证（本卡 H=0）；证据口径=每条验收项对应套件的 PASS 输出 + 回放事件签名。语义细节全部在 [design/01](../../design/01-产品设计与验收.md) §3～§4，契约现状在 [as-built/relay-contracts.md](../../as-built/relay-contracts.md)。

## 完成条件 ★必写（= 覆盖任务验收口径的并集，标好谁验）

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|------|---------------|--------------------------------|
| 1 | 【机器证·A1/A2】Runner 只接受合法 active generation 和绑定结果，CAS 冲突/迟到/重复事件不推进。 | AI | DHR_02 / [产品设计与验收 A1/A2](../../design/01-产品设计与验收.md#61-ai-自动验收栏) |
| 2 | 【机器证·A3/A4】fake replay 跑通 blocked→replan proposal→B→fresh A，以及 decision checkpoint→依赖冻结/无依赖继续→同 session 后续 checkpoint/final result；断言 Runner 未调用输入或 resume 动作。 | AI | DHR_02 / [产品设计与验收 A3/A4](../../design/01-产品设计与验收.md#61-ai-自动验收栏) |
| 3 | 【机器证·A5】`succeeded + next_action=review` 后任务仍 active。 | AI | DHR_02 / [产品设计与验收 A5](../../design/01-产品设计与验收.md#61-ai-自动验收栏) |
| 4 | 【机器证·A6】错版本、半写、坏结果、进程活但无进展、无可信 stop/quota 原因均 fail-closed。 | AI | DHR_02 / [产品设计与验收 A6](../../design/01-产品设计与验收.md#61-ai-自动验收栏) |
| 5 | 【机器证·fake adapter 行为契约】实现 `launch/probe/suspend/resume/stop/emit_observation` 六个终端动词；消费 DHR_01 的 fixture/观测流，不修改 fixture、不持有业务状态、不判断代码质量。decision fixture 由同一 session 依次发出 `decision_required` 与后续 checkpoint/final result，adapter 不提供人工输入 API；测试断言 Runner 在两者之间没有调用 `resume`，并覆盖依赖节点冻结、无依赖并行节点继续、错身份后续结果拒绝。launch receipt 写入后进入 `launching`；在有界启动期限内未获得绑定 `running` 观测则转 `unknown`、追加 `launch_failed` 事件并停住。 | AI | DHR_02 / DevPlan 任务卡「fake adapter 行为契约」 |

## 边界 (Boundaries)

- In scope：`tools/relay/runner/`、`tools/relay/adapters/fake*`（+ adapters/README）、`tools/relay/tests/`（新套件 `relay-runner-*.ps1`、新夹具 `fixtures/runner/**`、`run-relay-tests.ps1` 清单、`relay-contract-reason-coverage.ps1` 扫描范围/白名单）、`tools/relay/contracts/relay-params.psd1` 只追加 `LaunchDeadlineSeconds`、本卡 `workspace/DHR_02/`。
- Out of scope：不接真实 `psmux`；不实现完整 review lead、并行 reviewer 或通用 DAG scheduler；不改 `dh-crew` 控制器；不改 DHR_01 契约函数/矩阵/六套件正文/既有夹具；不拉真实编排 agent（proposal 全由 fixture 提供）；不实现 quota 识别/恢复通道（按 `interrupted_unknown` 兜底）；不实现 resume/suspend 的 Runner 调用路径；不读写 `.dh-runtime/`。
- 何时必须停下问人：默认只有 E11 一次性确认本地收口授权包、复核降级请求、P0/P1 三轮不收敛或需人裁决；E12/E13 包内机械步骤不重复索权，"待复核 / 待收口"不是停工理由。

## 触及子系统（收口时更新其 as-built）

- `tools/relay/runner/` + `tools/relay/adapters/`（新建：Runner core + fake adapter）——收口时新建 `docs/modules/dh-relay/as-built/relay-runner.md` 首份快照；`as-built/relay-contracts.md` 补一行 `LaunchDeadlineSeconds` 参数。
