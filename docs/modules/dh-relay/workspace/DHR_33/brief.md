<!-- dh:v1 · workspace/DHR_33/brief.md -->
# DHR_33 · Herdr Adapter、CLI/SSH 能力探测与状态对账 — Brief

> 出处（唯一权威）：[dev_plan/P6-Herdr多账号执行底座-开发方案.md](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md) §3.2 DHR_33。本文件是只读副本；口径冲突以 DevPlan 为准。
> 档位：标准。任务类型：**heavy**（重核：代码两轮换人 + 五路复核 + 有效单测；触及 runtime 核心接线与 capability 基线）。
> 执行者：codex `gpt-5.6-terra`（reasoning high）经 Herdr 交互终端；复核 claude（`--model opus` 拉起，实际模型按候选-40 取证登记）。
> 开工授权：用户 2026-08-29 委托（见 DevPlan §0.2 B-22 授权依据）；人验与 verify 待用户回归。

## 目标（一句话）

实现 Herdr Adapter（launch / observe / capture / focus / attach / send / stop / reconcile）与 Herdr 状态 → Relay 状态映射（事件快路 + snapshot 慢路对账、HostObservation 记版本/能力/pane 句柄），接通 CLI 的 host_ref 展示与 `relay focus`。

## 完成条件（验收口径逐字复制自 DevPlan §3.2 DHR_33）

1. **机器证**：design/06 H4 / H9 · P6-M6：Linux SSH 启动 Herdr → detach → 断开 → 重连后 pane 与状态可恢复观察；Runtime 不把 SSH 离线当 Agent / Run 退出。——**本条按 `DHR-B-22` 调整① 延后**：本卡只冻结 Headless fixture 并备注「待真实 smoke」，不得以 fixture 冒充真实 SSH 证据；汇合点 = P6 阶段闸裁决。
2. **机器证**：design/06 H5 · P6-M3：`blocked` 进入持久 Attention；`done` 只进 `awaiting_result`；漏事件、Herdr 重启、pane 消失、进程退出均有明确结果；启动信任弹窗等盲区进入 Attention 或启动失败。
3. **机器证**：design/06 H1 · P6-M5：DSH 不启动时 CLI 可完成查询与附着（`relay status/inspect/events/focus`）。
4. **机器证**：事件快路与 snapshot 慢路均可工作；HostObservation 记录版本、能力 hash、pane 句柄；`relay focus` 不保存任意拼接命令。
5. **上游 Oracle 差异说明**（候选-42）：DevPlan 本卡目标未含 `work_dir_root` 字样，但 DevPlan DHR_33 承接备注（2026-08-29）明确 design/02 B4 的 `work_dir_root` 由本卡 Adapter `launch` 决定并登记——launch 必须显式接受并登记 work_dir_root（进 Receipt/observation 证据链）。

## 主控架构裁决（开工前冻结，worker 不得改道；依据 = 2026-08-29 只读侦察）

1. **Adapter 落位与形状**：`relay-core/runtime/executors/herdr/`。形状照抄 `runtime/process-executor.mjs` 的契约：纯函数 + 句柄工厂，**不碰 Store、不认识节点依赖**，记账与调度归 workflow-driver。
2. **托管走合法窄路径**（`test/agent-node.test.mjs` 文件头预设的那条）：driver 在 `workflow-driver.mjs:88` 分叉点新增 herdr 分支（`executor_profiles` 里 `kind === 'herdr-agent'`）；`appendResult` 的 `executor_kind` 传 `'herdr-agent'`；capability 基线 `capability_manifest.executor_kinds` 由 `["process"]` 更新为 `["process","herdr-agent"]`（**必须经 `tools/capability-baseline.mjs` 的既有机制再生成**，先读该工具搞清 executor_kinds 的来源；若来源是工具内常量，允许仅改该一处常量并登记 progress）；`agent-node.test.mjs` 的第一条钉按其文件头的合法路径更新——**pi-agent / dsh-agent 仍不托管的钉必须保留**。
3. **状态映射塞进冻结契约，contracts/ 一个字不动**：7 值 node_state + 18 个事件 kind 是全集。映射冻结为：
   - `working → running`：心跳 `checkpoint_recorded`（running 的合法产生 kind 之一）。
   - `blocked → waiting_human`：`human_input_requested`（该状态唯一合法来源），Attention 内容按 `contracts/v0-shapes/relay.attention.v1.shape.json` 现有形状放 payload；重放后持久。
   - `done → awaiting_result` 语义：**保持 `running`**，记 `host_observation_changed` 标注宿主已 done；只有 result 被 capture 并核验后才 `appendResult`（done ≠ succeeded）。
   - `unknown / 观测断`：`host_observation_changed` 且 `observation_status='observation_lost'`——**不产生任何 reason code、不判 Attempt 死**（reason-codes.md:56 原文约束）。
   - 进程/宿主真丢：按 `contracts/reason-codes.md` 既有码分界用 `E_EXECUTOR_ADAPTER_LOST` / `E_EXECUTOR_KILLED`；**不新增 reason code**（要新增就是 BLOCKED）。
   - `host_observation_changed` 的 payload 用 `contracts/v0-shapes/relay.host-observation.v1.shape.json` 现有形状（required: protocol/run_id/observation_status/observed_at + locator 放 pane/agent/版本/能力 hash）；**若现有形状装不下必需信息 → 写 BLOCKED 停下，不许改 contracts**。
4. **`relay focus` 与 host_ref 零契约变更**：不加 RPC method、不改 `control.action` 枚举、不动 `run_status_view` 字段。`focus` 是 CLI 本地命令：经既有 `inspectRun`（detail 视图，事件里含 host_observation payload）取 herdr 句柄，渲染安全 attach 指令（如 `herdr agent attach <名>`）。遵守 `cli/render.mjs:3-5` 硬规则（打印值必须在传入对象逐字可找）；不保存任意拼接命令。
5. **测试假宿主**：herdr 桩放 `relay-core/test/helpers/`（**严禁放 fixtures/**——manifest 工具对子目录/非 json 抛错）。测试照 `test/workflow.test.mjs` 骨架 + `test/helpers/settled-state.mjs` 的不变量等待（候选-35）。
6. **Windows 真实 smoke 本卡必做、产品级闭环归 DHR_35**：用真实 herdr（本机可用）验证 adapter 的 pane split → 观察 → stop 最小链路，证据进 progress；跑真实 Codex/Claude 完整闭环不在本卡。

## 非目标 / 硬边界

- 不做身份/quota/fallback（DHR_34）；不跑真实产品 Agent 完整闭环（DHR_35）；不做 DSH pane 聚焦 UI。
- Linux/SSH 全部延后（B-22①）：Headless fixture 冻结 + 「待真实 smoke」备注；fixture 不得冒充真实 SSH 证据。
- **allowed-paths（闭集：未列出的路径一律禁改，含新建与删除；相对工作树根 `.dh-worktrees/DHR_33/`）**：
  - `relay-core/runtime/executors/herdr/**`（新目录）
  - `relay-core/runtime/workflow-driver.mjs`（仅 :88 分叉点接线与 herdr 分支所需的最小改动；`recordResult` 的 executor_kind 改为按 profile 传入）
  - `relay-core/cli/main.mjs`、`relay-core/cli/render.mjs`（focus 命令 + host_ref 渲染）
  - `relay-core/test/herdr-adapter.test.mjs`（新）、`relay-core/test/helpers/**`（herdr 桩等）
  - `relay-core/test/agent-node.test.mjs`（仅按裁决 2 的窄路径更新，保留 pi/dsh 不托管钉）
  - `relay-core/capability-baseline.json`（仅经既有工具机制再生成）＋必要时 `relay-core/tools/capability-baseline.mjs` 内 executor_kinds 常量一处（登记 progress）
  - `relay-core/package.json`（仅 `scripts.test` 末尾追加 ` test/herdr-adapter.test.mjs` 一个 token）
  - `docs/modules/dh-relay/workspace/DHR_33/**`
- **禁改重点提示（非穷举）**：`relay-core/contracts/**`（含 v0-shapes，一个字不动）、`relay-core/fixtures/**`、`relay-core/profiles/**`（DHR_32 冻结产物）、`relay-core/store|rpc|adapters/**`、`runtime/` 其余文件（host/service/process-executor/status/…）、仓根 `tools/**` 与 `relay-core/tools/**` 其余文件、`package-lock.json` 与依赖段。
- 本机 AI 配置目录一律只读；凭据值零入仓（沿用 DHR_32 白名单纪律）；禁止 `git push` / 切分支 / rebase / 对 master 操作。

## 交付物清单

1. `relay-core/runtime/executors/herdr/`（herdr-cli 包装 + herdr-executor 适配器 + 状态映射表）。
2. workflow-driver herdr 分支接线（最小 diff）。
3. `relay focus` + host_ref 渲染（CLI 本地实现，零契约变更）。
4. `test/herdr-adapter.test.mjs` + `test/helpers/` herdr 桩（含 H5/P6-M3 各态、观测断、重放持久性断言）。
5. capability 基线更新 + `agent-node.test.mjs` 钉更新（窄路径）。
6. Windows 真实 herdr 最小 smoke 证据（progress）。
7. Headless(Linux) fixture 冻结件 + 「待真实 smoke」备注。
