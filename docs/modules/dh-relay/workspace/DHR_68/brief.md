<!-- dh:v1 -->
# DHR_68 · Herdr 宿主真实接线缺陷 — Brief

> 出处（唯一权威）：[P6 开发方案](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md) §3.2 DHR_68。本文件是只读副本；冲突以 DevPlan 为准。
> 档位：标准（组件接线 · 高危五类之一）。任务类型：**heavy**。
> 开工授权：用户 2026-08-31 对话明文「授权开工」，承接 B-32 已确认的卡合同。授权至 E10 人验准备；**不含** verify、合并、推送、部署、真实 Agent 闭环实录或 Linux/SSH。

## 目标

让 Herdr adapter 与 driver 在**真实宿主**上正确接线三件事——启动调用给足时限且超时后先对账再决定回滚、`pane run` 不期待 JSON、启动期 `blocked` 保留 handle 并按 design/06 形成一次持久 Attention。

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_68 | P6 Herdr 多账号执行底座 | DevPlan §3.2 DHR_68；B-32；design/06 H1/H5 |

## 完成条件

> 逐字复制自 DevPlan §3.2 DHR_68「验收口径」，四条均为**机器证**。

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| A | 启动调用使用**启动专用**超时默认值 **60 秒**（B-32 用户裁决冻结；**不暴露配置面**，不新增环境变量或 registry 字段），其余 CLI 命令继续用现有 10 秒默认、超时语义不变；以 DHR_35 已有的 29482 ms 真实样本形态证明该启动能完成；fake 覆盖「超时后 agent 存在」与「超时后 agent 不存在」两支，前者继续走既有 handle 路径、后者才关闭本卡创建的同一 pane。不得声称"默认足以覆盖任意未来启动"（不可证）。 | machine | DHR_68；B-32 |
| B | `paneRun` 不再期待 JSON；以**对齐真实 herdr 输出形态**（exit 0 + 空 stdout）的 fixture 证明 Claude 启动继续走 `pane run → 唯一识别 → rename → 交既有 Attempt`，且 Codex `agent start` 的 argv 与返回处理不变。 | machine | DHR_68；DHR_67 |
| C | `agent start` 返回启动期 `blocked`（含 `agent_not_ready`）时——adapter 返回 handle、不关 pane、不额外创建 Attempt/Result；driver **不发 completion instruction**，并**恰好写一次**带 blocked 观测的 `waiting_human` + `human_input_requested`，不写 `E_EXECUTOR_HOST_LOST`。以 fake 正负例 + driver 事件序列断言证明。 | machine | DHR_68；design/06 H1/H5 |
| D | `relay-core/test/helpers/fake-herdr.mjs` 中被本卡触及的每个命令，其**返回形态**须与真实 herdr 一致，并留下逐命令的真实输出对照证据（exit code + stdout 是否为 JSON）。这是本卡存在的直接原因，是验收项而非提示。 | machine | DHR_68；B-32 |

## 边界

- **In scope**（DevPlan `dh:allowed-paths:v1 task=DHR_68` 逐条精确路径）：
  - `relay-core/runtime/executors/herdr/herdr-cli.mjs`
  - `relay-core/runtime/executors/herdr/herdr-executor.mjs`
  - `relay-core/runtime/workflow-driver.mjs`（**仅**启动期 blocked 的事件路径）
  - `relay-core/test/herdr-adapter.test.mjs`
  - `relay-core/test/helpers/fake-herdr.mjs`
  - `docs/modules/dh-relay/workspace/DHR_68/**`
- **Out of scope**：Receipt/Result/Store/RPC/contracts 语义；driver 的 **Result 判定**逻辑；`profile-registry.mjs`、`service.mjs`；用户级 registry、产品配置、凭据；DHR_35 工作区；Linux/SSH。
- **必须停止（fail-closed）**：
  - 真实 herdr 的慢启动 / 逐命令输出形态观测拿不到时，停止并回报，**不得以 fake 覆盖冒充**。
  - 超时对账**不得**退化成"重试一次启动"（会拉起第二个真实 agent）。
  - 不代产品做信任决定、不自动确认任何目录信任。
  - 不把 Herdr `done`、pane 文本或 exit code 当 Result。

## 触及子系统

- [as-built/relay-core.md](../../as-built/relay-core.md)
