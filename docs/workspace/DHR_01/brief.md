<!-- dh:v1 · brief.md — 工作区封面。🔵 前置填。写"终点"，不写路线。完成条件 = 任务卡验收口径的逐字复制 + 出处回链；DevPlan 是唯一权威定义，本文件是施工现场的只读副本，口径变更以 DevPlan 为准、本文件跟改并在 progress 记一笔。 -->
# brief — DHR_01 冻结接力权威、双维状态与异常契约

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|---------|-------------|
| DHR_01 | P1-最小接力PoC | [DevPlan §3.2 任务卡 DHR_01](../../dev_plan/P1-最小接力PoC-开发方案.md#dhr_01) |

## 目标 (Outcome)

冻结 dh-relay 的 RelayPlan、双维状态、active authority、launch receipt、不可变 final result/handoff、可信控制事件、机器可读穷举转换矩阵与脱敏规则 v1 契约（落 `tools/relay/contracts/`），并建立覆盖失败路径的 deterministic replay fixtures（落 `tools/relay/tests/fixtures/`），全部由可一键复跑的测试套件证明。

## Zero-context 自查

新 agent 只读本 brief + DevPlan 任务卡 + `task_plan.md` 即可开工：终点=契约文件与 fixtures 全部落盘且 `tools/relay/tests/run-relay-tests.ps1` 全绿；边界=只动 `tools/relay/**` 与本工作区；谁验=全部机器证（本卡 H=0）；证据口径=每条验收项对应测试套件的 PASS 输出。语义细节全部在 [design/01-产品设计与验收.md](../../design/01-产品设计与验收.md) §3～§4（task_plan Context Packet 已列必读段落）。

## 完成条件 ★必写（= 覆盖任务验收口径的并集，标好谁验）

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|------|---------------|--------------------------------|
| 1 | 【机器证·A1】schema、固定枚举和机器可读穷举转换矩阵通过；每个合法边有正例、每个未列举边均失败，终端/业务两维任一非法时整体不推进。 | AI | DHR_01 / [产品设计与验收 A1](../../design/01-产品设计与验收.md#61-ai-自动验收栏) |
| 2 | 【机器证·A2】plan/generation/attempt/launch/session 完整绑定，旧/重复/错版本结果夹具被拒。 | AI | DHR_01 / [产品设计与验收 A2](../../design/01-产品设计与验收.md#61-ai-自动验收栏) |
| 3 | 【机器证·A4/A6】冻结 `decision_required` 非终态 checkpoint 与 final result 的边界；checkpoint 后只冻结依赖节点、无依赖并行节点继续，同一 authority/launch/session/attempt 的后续 checkpoint/final result 可更新投影，错 session/generation 与旧 attempt 均拒绝；Runner 不读取、转发人工回答，也不调用 resume；quota P1 降级为 `interrupted_unknown` 兜底，不实现独立可信恢复事件通道（目标形态再补）。 | AI | DHR_01 / [产品设计与验收 A4/A6](../../design/01-产品设计与验收.md#61-ai-自动验收栏) |
| 4 | 【机器证·A5/A6】`succeeded` 不等于完成；final result 不可改写；半写、坏 JSON、probe error、无进展和无结果退出均有反例夹具。 | AI | DHR_01 / [产品设计与验收 A5/A6](../../design/01-产品设计与验收.md#61-ai-自动验收栏) |
| 5 | 【机器证·A8】交接自足；credential-shaped detector 至少覆盖 `api_key/private_key/password` 三类代表性凭据（jwt/env_secret/bearer_token 等其余类别随目标形态补齐），命中值完整替换、不保留前缀，handoff/result/event/session-tail 任一 final 工件残留即失败；PII/内部主机名不纳入本卡 detector。 | AI | DHR_01 / [产品设计与验收 A8](../../design/01-产品设计与验收.md#61-ai-自动验收栏) |

## 边界 (Boundaries)

- In scope：`tools/relay/contracts/`、`tools/relay/tests/`（含 fixtures 与独立 runner）、本卡 `workspace/DHR_01/`。
- Out of scope：不实现 Runner 主循环；不拉真实 agent；不决定完整 review 流水；不改现有 `dh-crew` 协议或状态；不动 `tools/tests/run-all.ps1` 等 dh-crew 测试设施；不动 `tools/protocol/**`（只可只读参考其风格）；quota 识别/恢复通道、nonce 重放攻击测试、jwt/env_secret/bearer_token 检测均为目标形态、本卡不做。
- 何时必须停下问人：默认只有 E11 一次性确认本地收口授权包、复核降级请求、P0/P1 三轮不收敛或需人裁决；E12/E13 包内机械步骤不重复索权，"待复核 / 待收口"不是停工理由。

## 触及子系统（收口时更新其 as-built）

- `tools/relay/`（新建子系统：接力契约层 v1）——收口时新建 `docs/modules/dh-relay/as-built/relay-contracts.md` 首份快照。
