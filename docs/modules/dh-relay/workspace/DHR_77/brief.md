<!-- dh:v1 -->
<!-- dh:workspace-contract:v2 -->
# brief — DHR_77 terminal-instance host_ref 原子兼容闭环

## 授权与现场

2026-09-06，用户在理解“DHR_77 只解除 DHR_35 的计划阻塞，DHR_35 仍须独立 D-start”后明确要求“落盘，建workspace，建task-plan”，先授权 S0～S2；task plan 写成后又明确要求“右侧开可交互终端执行。你这边挂个wait”，据此独立 D-start 已成立，授权在 `wt/DHR_77` 执行 S3 并等待 construction Node 收口。仍不授权真实 Codex/Claude 产品 Agent、DHR_35、verify、合并、推送或部署。

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|---------|-------------|
| DHR_77 | P6 | [DevPlan DHR_77](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md#dhr_77) |

## 目标 (Outcome)

在一张 heavy 卡内原子实现 Herdr `terminal_id` → 脱敏 `host_ref` 的 event/v0、writer/recovery、capability hash、read-model/CLI 与新旧客户端兼容闭环，并备齐 DSH-off 安全展示的人验证据。

## Zero-context 自查

新执行者只读本文件、`task_plan.md` 与 DevPlan DHR_77 即可知道六条完成条件、精确允许路径、禁止 fallback/泄密边界、TDD 顺序和 heavy 五路复核要求；若合同与 DevPlan 不一致，以 DevPlan 为唯一权威并停止施工，不自行改口径。

## 完成条件

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|------|---------------|--------------------------------|
| 1 | 只接受非空 string `terminal_id`，逐字 UTF-8 按冻结公式生成完整 SHA-256 ref；空白/Unicode golden vectors、缺失/错类型/空串与全部 fallback 负例见红。 | AI | DHR_77 / [design/14 `HC-HR-A1`](../../design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md#4-正式验收清单) |
| 2 | 轮询/recovery 相同 ID 保持 ref，不同 ID 换 ref；pane/agent 改名不影响；`working→working` replacement 仍写事件。 | AI | DHR_77 / [design/14 `HC-HR-A2`](../../design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md#4-正式验收清单) |
| 3 | alive 必有 ref；lost 保留最后成功 ref 或如实缺省；recover/replace/初始失败回放正确，旧事件不回写。 | AI | DHR_77 / [design/14 `HC-HR-A3`](../../design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md#4-正式验收清单) |
| 4 | event/v0、descriptor/hash、writer/recovery/read-model/CLI 原子闭合；旧 v1 hash 在分派/订阅前 `E_CAPABILITY_MISMATCH` 且零推送，新 hash 的 v1 与 bootstrap/v2 均工作；旧账本仅显示 legacy 缺省。 | AI | DHR_77 / [design/14 `HC-HR-A4`](../../design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md#4-正式验收清单) |
| 5 | CLI 区分当前/历史/尚无标签；默认安全投影省略 `detail`；非观测事件拒绝非空 ref；既有 Result/Receipt/lease/fencing/状态全回归。 | AI | DHR_77 / [design/14 `HC-HR-A5`](../../design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md#4-正式验收清单) |
| 6 | 独立展示 DSH-off 安全投影与受控 Herdr 对照面中的同一脱敏 ref，用户判断状态措辞可区分且证据未出现原始 `terminal_id`、`detail`、路径或敏感信息；不得消费为 DHR_35 真实闭环证据。 | 人 | DHR_77 / [design/14 `HC-HR-H1`](../../design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md#4-正式验收清单) |

## 边界 (Boundaries) 与任务合同逐字副本

- **目标**：在一张卡内原子实现 Herdr `terminal_id` → 脱敏 `host_ref` 的完整兼容闭环：event/v2 与 v0 mirror、capability baseline/hash、launch/observe/reconcile/driver recovery writer、事件回放/read-model、CLI 安全投影、v1 与 bootstrap/v2 客户端兼容，以及 DSH-off 受控对照展示。
- **非目标**：不改 Result、Receipt、run_status、Attention、lease、fencing、Profile、fallback 或 Linux 合同；不以 `host_ref` 查询 Herdr；不持久化原始 `terminal_id` 映射；不把本卡人验或实录冒充 DHR_35 的 P6-RI-A4/P6-M1；不读写凭据或用户级 registry；不自动启动真实 Codex/Claude Agent；不做 DHR_35 重跑。
- **变更范围**：
  <!-- dh:allowed-paths:v1 task=DHR_77 -->
  - `relay-core/contracts/relay.event.v2.schema.json`
  - `relay-core/contracts/v0-shapes/relay.host-observation.v1.shape.json`
  - `relay-core/contracts/compat-matrix.md`
  - `relay-core/capability-baseline.json`
  - `relay-core/tools/capability-baseline.mjs`
  - `relay-core/rpc/capabilities.mjs`
  - `relay-core/runtime/executors/herdr/herdr-executor.mjs`
  - `relay-core/runtime/workflow-driver.mjs`
  - `relay-core/runtime/service.mjs`
  - `relay-core/cli/main.mjs`
  - `relay-core/cli/render.mjs`
  - `relay-core/test/contracts.test.mjs`
  - `relay-core/test/rpc.test.mjs`
  - `relay-core/test/rpc-service.test.mjs`
  - `relay-core/test/read-model-mirror.test.mjs`
  - `relay-core/test/client-fixtures.test.mjs`
  - `relay-core/test/cli.test.mjs`
  - `relay-core/test/herdr-adapter.test.mjs`
  - `relay-core/test/dhr72-continuous-observation.test.mjs`
  - `relay-core/test/helpers/fake-herdr.mjs`
  - `relay-core/test/dhr77-host-ref.test.mjs`
  - `relay-core/fixtures/golden/**`
  - `relay-core/fixtures/negative/**`
  - `relay-core/fixtures/clients/**`
  - `relay-core/package.json`
  - `docs/modules/dh-relay/workspace/DHR_77/**`
  - `docs/modules/dh-relay/as-built/relay-core.md`
  - `docs/modules/dh-relay/knowledge/教训库-候选.md`
  - `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`

  **限定**：`herdr-executor.mjs` 只保留合格 `terminal_id`，不得使用 `pane_id`/agent/`agent_session` fallback；`workflow-driver.mjs` 只改 host-observation 写入、最后成功 ref 对账与 recovery，停止从旧 `detail` 重建 terminal identity，既有 `executor_ref` locator 与 Result/Attention/lease 行为不变；`service.mjs`、CLI 与 fixtures 只承接事件回放、read-model/安全展示和新旧账本兼容，默认人验投影不得输出 `detail`；`rpc/capabilities.mjs` 删除 v1 固定 hash 分叉，使 v1/v2 共用完整 baseline，`server.mjs` 现有“hash 校验早于分派/subscribe”顺序只读守住；fixtures 只更新受协议/hash/展示变化直接影响的样本，`package.json` 只追加本卡测试。workspace 只存脱敏向量、测试日志、受控对照与截图；原始 `terminal_id`、路径、账号、Receipt、Result 或凭据不得进入证据。
- **档位**：标准（协议、RPC 兼容与 Herdr 组件接线，高危）。
- **任务类型**：重核<!-- dh:task-type:v1 task=DHR_77 type=heavy -->
- **依赖**：DHR_72（已完成）。DHR_77 收口只解除 DHR_35 的计划阻塞，不构成 DHR_35 D-start；须独立 D-start。
- **何时必须停下问人**：construction Node durable 收口后停止；后续只有 E11 本地收口确认、P0/P1 三轮不收敛、复核降级或必须扩大上述允许路径/改变正式合同时停下。worker 不自行进入复核。

## 触及子系统（收口时更新其 as-built）

- `relay-core`
