<!-- dh:v1 · brief.md — 工作区封面。🔵 前置填。写"终点"，不写路线。完成条件 = 任务卡验收口径的逐字复制 + 出处回链；DevPlan 是唯一权威定义，本文件是施工现场的只读副本，口径变更以 DevPlan 为准、本文件跟改并在 progress 记一笔。 -->
# brief — DHR_03 接真实可见 psmux 并完成阻塞接力 dogfood

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|---------|-------------|
| DHR_03 | P1-最小接力PoC | [DevPlan §3.2 任务卡 DHR_03](../../dev_plan/P1-最小接力PoC-开发方案.md#dhr_03) |

## 目标 (Outcome)

接入真实 `psmux` adapter（`tools/relay/adapters/psmux-adapter.ps1`，六动词、自己实现 launch/probe/stop 的精确句柄语义），让 DHR_02 的 Runner 能自动打开**用户可见、可交互**的 agent 终端窗口，并用真实一次性 agent（编排 / 重编排 / worker）跑通两场 dogfood：① dependency-blocked 重编排接力（v1/A attempt1 blocked→handoff ack→exact exit→v2+B→B done→A attempt2 fresh，旧 A 迟到结果经真实摄入口只产生 stale 事件）；② decision-required 挂起（原 session 保持可交互，用户在该窗口回答一次后 agent 自然继续，Runner 不读回答、不调 resume，依赖节点冻结、无依赖节点继续）。开工第一道闸 = 终端后端 preflight：用同一 A7 判据对 psmux（默认）与 orca（纯终端宿主候选）各做一次实测并留证据；psmux 不过则停在"待环境"，orca 只有过判据且体验更优才可**提议**换后端（须先修订设计决策 7）。交付真实截图 + checkpoint/状态/receipt 时间线 + H2 对照表，供用户判 H1/H2。

## Zero-context 自查

新 agent 只读本 brief + DevPlan 任务卡 + `task_plan.md` 即可开工：终点 = psmux adapter + 宿主循环 + agent 侧工具落盘、`run-relay-tests.ps1` 全绿（DHR_01/02 11 套件不回归 + 新离线套件）、真实 psmux 套件在 `RELAY_REAL_TERMINAL=1` 下全绿、两场 dogfood 证据（事件流 + 状态快照 + receipt + 截图）落 `workspace/DHR_03/evidence/`；边界 = 只动 `tools/relay/adapters/psmux*`、`tools/relay/adapters/preflight/**`、`tools/relay/host/**`（新建·宿主循环与 agent 侧工具）、`tools/relay/tests/**`（新套件/新夹具/清单/守卫范围）、`tools/relay/dogfood/**`（最小 dogfood fixture）、本工作区；谁验 = A3/A4/A7 机器证 + H1/H2 人判；证据口径 = 套件 PASS 输出 + preflight JSON + 事件签名 + 截图（截图与机读事件必须能互相对照）。语义细节在 [design/01](../../design/01-产品设计与验收.md) §3～§5，Runner 现状在 [as-built/relay-runner.md](../../as-built/relay-runner.md)。

## 完成条件 ★必写（= 覆盖任务验收口径的并集，标好谁验）

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|------|---------------|--------------------------------|
| 1 | 【机器证·A3】事件序列严格为 v1/A attempt1 blocked→handoff ack→exact exit→v2+B→B done→A attempt2 fresh；旧 A result 通过 Runner 真实摄入入口提交，保持内容合法但携带旧身份链，只产生 stale event，不用测试桩直接改 active state。 | AI | DHR_03 / [产品设计与验收 A3](../../design/01-产品设计与验收.md#61-ai-自动验收栏) |
| 2 | 【机器证·A4】decision fixture 的原 session 保持可交互；用户在该 session 回答一次后 agent 自然继续，Runner 未读取/转发回答、未调用 resume；依赖节点在后续有效 checkpoint/result 前冻结，无依赖并行节点继续。要求用户再去 Runner 操作则 A4 失败。 | AI | DHR_03 / [产品设计与验收 A4](../../design/01-产品设计与验收.md#61-ai-自动验收栏) |
| 3 | 【机器证·A7】`tools/relay/adapters/psmux*` 自己实现 `launch/probe/suspend/resume/stop/emit_observation`，可组合现有 psmux/tmux 原语但不假定旧 `tools/psmux-launch.ps1` 已提供完整 handle；preflight 证明 receipt.launch_id 与新 adapter 返回的完整唯一 session handle 1:1、界面 `visible=true` 且 `interactive=true`、probe 全值匹配，按该 handle 回收后在 evidence 记录的有界期限内确认为 `exited`。仅后台 session、PID/标题/前缀猜测或平台无关 stop 命令均失败。 | AI | DHR_03 / [产品设计与验收 A7](../../design/01-产品设计与验收.md#61-ai-自动验收栏) |
| 4 | 【人判·H1/H2】向用户展示真实截图、checkpoint/状态/receipt 时间线和未覆盖范围；decision 正常路径必须记录人工动作数=1，且时间线证明 Runner 未介入回答。对照表按统一口径记录用户显式确认/回答/重启动作数、面向用户的状态通知数，以及 blocked→fresh A 的可见步骤与事件 hop 数，由用户判断是否符合直觉、是否值得进入完整流水阶段。 | 人 | DHR_03 / [产品设计与验收 H1/H2](../../design/01-产品设计与验收.md#62-人类验收栏) |

## 边界 (Boundaries)

- In scope：`tools/relay/adapters/psmux-adapter.ps1`（+ `adapters/README.md` 补 psmux 段）、`tools/relay/adapters/preflight/`（psmux/orca 同判据 preflight 脚本）、`tools/relay/host/`（新建：宿主循环 `relay-host.ps1`＝按 tick 驱动 Runner + 摄入 worker 落盘的 tmp 文件 + 拉起 ready 节点/replanner；agent 侧工具 `relay-agent-tool.ps1`＝按 receipt 身份写 checkpoint/result/handoff/proposal）、`tools/relay/dogfood/`（最小 dogfood fixture：fixture Design/DevPlan、A/B brief、剧本说明）、`tools/relay/tests/`（新套件 + 新夹具 + `run-relay-tests.ps1` 清单 + reason 守卫扫描范围）、本卡 `workspace/DHR_03/`（含 `evidence/`）。
- Out of scope：不实现完整生产流水 / review lead / 并行 reviewer / 通用 DAG；不做自动人类决策；不实现 orca adapter（orca 只做 preflight 对比实测；改选须另修设计决策 7 后再立项）；不改 DHR_01 契约函数/矩阵/六套件正文、DHR_02 Runner core 判定逻辑（只允许**扩展**：新增函数或新增可选参数，不改既有分支语义；如需改动记 findings 停下）；不改 `dh-crew` 一切（controller/loop/`tools/psmux-launch.ps1`/`dispatch*`）；不读写 dh-crew 的 `.dh-runtime/` 命名空间（dogfood 运行现场只落 `.dh-runtime/relay/<run_id>/`）；不把凭据值写入任何证据。
- 何时必须停下问人：preflight psmux 判据不过（停"待环境"）；orca 通过且体验更优需要用户拍板是否修订决策 7；dogfood 需要用户参与（decision 场景回答一次 + 查看窗口）；E11 一次性确认本地收口授权包；复核降级请求、P0/P1 三轮不收敛或需人裁决。

## 触及子系统（收口时更新其 as-built）

- `tools/relay/adapters/`（新增 psmux adapter）+ `tools/relay/host/`（新建宿主循环与 agent 侧工具）——收口时新建 `docs/modules/dh-relay/as-built/relay-psmux-host.md` 首份快照；`as-built/relay-runner.md` 补一行"真实 adapter/宿主循环见 relay-psmux-host.md"；`as-built/relay-contracts.md` 若追加 params 键（如 `IdleAfterSeconds`/`StopDeadlineSeconds`）补参数行。
