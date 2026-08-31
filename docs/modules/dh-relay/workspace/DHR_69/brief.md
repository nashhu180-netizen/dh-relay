<!-- dh:v1 -->
# DHR_69 · Claude 假就绪 blocked 盲区 — Brief

> 出处（唯一权威）：[P6 开发方案](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md) §3.2 DHR_69。本文件是只读副本；冲突以 DevPlan 为准。
> 档位：标准（外部宿主组件接线 · 高危五类之一）。任务类型：**heavy**。
> 开工授权：用户 2026-08-31 对话点选「授权开工」+「开树」+「本会话自干」，承接 B-33 已确认的卡合同。授权至 E10 人验准备；**不含** verify、合并、推送、真实 Agent、产品配置读写。

## 目标

让 relay 在 **Claude 报"假就绪"**（`agent get` = `idle` 而实际卡在产品对话框、`pane get` = `blocked`）时仍能判定为 blocked，并落到 DHR_68 已冻结的人工暂停行为上——**保留 handle、不关 pane、扣住 Receipt 提交指令、恰写一条带真实 blocked 观测的 `human_input_requested`、两信号一致后恰补发一次**；且**两信号持续打架时不静默永等，而是升级为一条可区分的 Attention**。覆盖**启动期 / 轮询期 / recovery 期**三个时点（recovery 部分即并入的 `F-6807`）。

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_69 | P6 Herdr 多账号执行底座 | DevPlan §3.2 DHR_69；B-33；design/06 H1/H5 |

## Zero-context 自查

只读本文件 + DevPlan §3.2 DHR_69：终点是观测层交叉核对（仅 `idle` 时读一次 `pane get`），不是自动信任、不是新协议码、不是真实 Agent。六条完成条件全是机器证。detail 键名已在 D-start 冻结（见边界）。

## 完成条件

> 逐字复制自 DevPlan §3.2 DHR_69「验收口径」，六条均为**机器证**。

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| A | 夹具令 `agent start` 返回 exit 0、`agent get`=`idle`、`pane get`=`blocked` → adapter 返回 `launch_blocked=true` 且保留 handle、不关 pane、不额外创建 Attempt/Result；driver **不发**提交指令、**恰写一次**带 blocked 观测的 `human_input_requested`、不写 `E_EXECUTOR_HOST_LOST`。Codex 既有 `agent_not_ready` 路径的 argv 与行为**逐字不变**（负例断言）。承接 [design/06 H1/H5](../../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)。 | machine | DHR_69；B-33；design/06 H1/H5 |
| B | 启动正常、中途转为假 `idle`（`pane get`=`blocked`）→ **不得**落进 `done\|\|idle` 分支、**不得**写 `E_EXECUTOR_RESULT_MISSING`、**不得**结束 Attempt；须走 blocked 分支并恰写一条 `human_input_requested`。（本形态由 B-33 首次登记。） | machine | DHR_69；B-33 |
| C | 恢复到假 `idle` / 真 `blocked` 的 agent → 发提交指令**之前**先做一次观测；观测为 blocked 时扣住指令走人工暂停，离开 blocked 后**在同一 driver 届内恰补发一次**。**口径显式收窄到"届内"**：`instructionPending` 只是内存变量，跨 driver 重启的重复发送**是本卡明确接受的已知限制**（该限制的文字登记由收口一致性复核检查，不算机器证）。 | machine | DHR_69；F-6807 |
| D | `host_observation_changed` 同时留下 `agent get` 原始值、`pane get` 原始值与派生结论三者；仅在 `agent get`=`idle` 时才发起 `pane get`（`working`/`done`/`unknown` 三态下 `pane get` 调用次数断言为 0）。**承载结构冻结**：`relay.event/v2` 是 `additionalProperties:false`、`detail` 是唯一可扩充字段，故三者一律编码进 `detail` 的**受控键值格式**（沿用现役 `herdrDetail()` 的 `k=v;k=v` 形态，键名在 D-start 前冻结），以**解析断言**验证，**不新增顶层字段、不改 schema**。 | machine | DHR_69；B-33 |
| E | **E-1** 可复跑只读 shape probe——脚本 `docs/modules/dh-relay/workspace/DHR_69/evidence/scripts/herdr-shape-probe.mjs`，`node` 直跑，取样对象是 `pane split` 出来的**普通 shell pane**（**不启动任何产品 Agent**），采 `herdr pane get` / `agent get` 的 exit code、stdout 是否 JSON、`agent_status` 的**字段路径**与**取值域**，probe 自带解析与断言，产物落 `.../evidence/herdr-command-shapes.json`（脱敏，只留形态）；**E-2** fake 的 `paneGet` 必须按 E-1 实测形态返回（现役只是个 `paneAlive` 布尔桩，**没有状态字段，不得照它想当然**）。**取值边界**：`blocked` 这个取值本身不由 probe 取（那需要真实卡住的 Agent，属非目标），事实基准取自 [evidence/32 §2](../../design/evidence/32-A27-目录信任能力矩阵-实测.md)。 | machine | DHR_69；DHR_68/D |
| F | 夹具令 `agent get`=`idle` ∧ `pane get`=`blocked` **持续超过 `T`=60_000 ms**（与现役 `observationLostMs`/`doneTimeoutMs` 同形态、同为 driver 默认参数，**不新增环境变量或 registry 字段**）→ 断言：①提交指令始终未发；②初始 Attention **恰一条**；③超过 `T` 后**恰一条**可区分的升级 Attention——**靠冻结的 `detail` 键区分，`reason` 留空、不新增协议码**，事件里同时留两个原始信号；④两信号恢复一致后**恰补发一次**提交指令；⑤**负向断言**：超过 `T` 后**不得**改信 `agent get` 自动放行、**不得**自动判节点失败。 | machine | DHR_69；B-33 |

## 边界

- **In scope**（DevPlan `dh:allowed-paths:v1 task=DHR_69` 逐条精确路径）：
  - `relay-core/runtime/executors/herdr/herdr-executor.mjs`
  - `relay-core/runtime/workflow-driver.mjs`（只可改观测→事件路径与 recovery 分支的发送时机）
  - `relay-core/test/herdr-adapter.test.mjs`
  - `relay-core/test/helpers/fake-herdr.mjs`
  - `relay-core/test/dhr69-false-ready.test.mjs`
  - `relay-core/package.json`（只可向既有 test script 追加本卡新测试文件这一个 token）
  - `docs/modules/dh-relay/workspace/DHR_69/**`
- **Out of scope**：不预置/写/读任何产品配置；零按键（全路径无 `send-keys` / `send-text` 新增调用面）；不改 Receipt / Result / Store / RPC / contracts 语义；**不新增任何协议 reason code**；不改用户级 registry、凭据、账号或额度；**不跑真实 Agent**；不承诺自动收敛；不碰 Linux / SSH；不承接 `A27-M7` / `A27-M10` / `A27-M11` 本身；不修 `F-6808`；不得改 `herdr-cli.mjs`、`profile-registry.mjs`、`service.mjs`、DHR_35 / DHR_68 工作区。
- **D-start 冻结的 `detail` 键**（对话确认 2026-08-31）：
  - 原有六键顺序与名字不动：`herdr_status` / `agent` / `pane` / `seq` / `work_dir_root` / `profile`
  - 新加（永远追加，缺省 `-`）：`agent_get`（`agent get` 原始 `agent_status`）、`pane_get`（`pane get` 原始 `agent_status`；未调用=`-`，调用失败=`error`）
  - `herdr_status` = **派生结论**。覆盖规则唯一：仅当 `agent_get=idle` **且** `pane_get=blocked` 时派生为 `blocked`；pane 的其它取值（含 `working`/`idle`/`unknown`/`done`/`error`）**不覆盖** agent 观测——避免 evidence/32 已记录的采样时刻短暂不一致被误伤。
  - 升级 Attention 另加键 `conflict_escalation=idle_blocked`（只出现在机器证 F 那一条；`reason` 留空）。
  - driver 默认参数 `signalConflictMs = 60_000`（与 `observationLostMs` 同形态，函数入参，不读环境变量、不进 registry）。
- **必须停止（fail-closed）**：
  - E-1 真实 herdr 形态拿不到时停止并回报，不得以 fake 覆盖冒充。
  - 交叉核对只在 `agent get=idle` 时发起，不得改成每轮双读，也不得反向用 `agent get` 覆盖 `pane get`。
  - 「不动 Result 判定」= 不得修改 Receipt-bound Result、等待超时与 `E_EXECUTOR_RESULT_MISSING` 的**语义**；允许因受机器证支撑的派生 `blocked` 使该分支不可达（那正是机器证 B）。
  - 不代产品做信任决定、不自动确认任何目录信任。

## 触及子系统

- [as-built/relay-core.md](../../as-built/relay-core.md)（本卡允许路径不含它；E7 若无法更新须显式登记，不静默跳过）
