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
5. **上游 Oracle 差异说明**（候选-42，预审 P1-2/P2-7 增补）：
   - `work_dir_root`：DevPlan 本卡目标未含该字样，但 DevPlan DHR_33 承接备注（2026-08-29）明确由本卡 Adapter `launch` 决定并登记——launch 必须显式接受并登记 work_dir_root（进事件 detail 证据链）。
   - `awaiting_result`：H5 的该词在冻结的 7 值状态机里**无对应取值**（全仓零命中）；本卡以 `running` + `host_observation_changed`（detail 标注宿主 done）表达 done ≠ succeeded；该语义替换是否可接受由验收人裁决。
   - HostObservation「版本/能力 hash」：host-observation v0 形状与事件字段装不下，降级为真实 smoke 的 progress 证据；pane/agent 句柄经事件 `detail` 固定格式承载。

## 主控架构裁决（开工前冻结，worker 不得改道；依据 = 2026-08-29 只读侦察）

1. **Adapter 落位与形状**：`relay-core/runtime/executors/herdr/`。形状照抄 `runtime/process-executor.mjs` 的契约：纯函数 + 句柄工厂，**不碰 Store、不认识节点依赖**，记账与调度归 workflow-driver。
2. **托管走合法窄路径**（`test/agent-node.test.mjs` 文件头预设的那条；按预审 P2-8/P2-9 修订）：driver 在 `workflow-driver.mjs:88` 分叉点新增 herdr 分支（`executor_profiles` 里 `kind === 'herdr-agent'`）；`appendResult` 的 `executor_kind` 按 profile 传入（去掉 :72 硬编码，process 行为不变）。capability 基线来源已确认 = `tools/capability-baseline.mjs:52` 的 `REFERENCE_EXECUTOR_KINDS = ['process']` 常量，改为 `['herdr-agent','process']` 后再生成 baseline；**`capability_hash` 变化是预期**，`test/rpc.test.mjs` 与 `test/contracts.test.mjs` 走复算路径会自动跟随、不改这两个文件。**代价留档**：`contracts/CANONICALIZATION.md` §三示例（"1 个 executor kind"）自此与代码事实过时，contracts/ 本卡禁改 → 记 findings + 留后续契约变更卡修正。`agent-node.test.mjs`：**:130 的 pi/dsh 不托管钉原样保留**；**新增**一条 herdr 托管钉（herdr-agent 节点被 driver 驱动、开 Attempt、落事件）；更新文件头 :3-7 的窄路径说明。
3. **状态映射塞进冻结契约，contracts/ 一个字不动**（按预审 P1-1/P1-2/P1-4/P2-12 修订）：7 值 node_state + 19 个事件 kind 是全集；**`relay.event/v2` 没有 payload 字段，`store/store.mjs:162` 的 `emitEvent` 逐字段组装、多余键静默丢弃**——观测/Attention 的结构化信息**只能落在事件既有字段 `executor_ref`（locator 字符串 ≤1024，禁 scheme 前缀与绝对路径形态）与 `detail`（≤4096 自由字符串）**。`detail` 编码格式冻结为 `k=v;k=v` 且键序固定：观测事件用 `herdr_status=<s>;agent=<名>;pane=<id>;seq=<n>;work_dir_root=<锚>;profile=<executor_profile_id>`（**2026-08-29 复核轮1修订：增补第 6 键 `profile`，承接需求轮 R-4——事件账必须可反推本 Attempt 用了哪个 Profile**；`<s>` 位只放真实 herdr 状态值 idle/working/blocked/done/unknown，盲区用 unknown；`seq` 传最后一次已知观测值；herdr 版本与能力 hash 不入事件账，降级为真实 smoke 的 progress 证据——按候选-42 记 Oracle 差异）。映射冻结为：
   - `working → running`：心跳 `checkpoint_recorded`。
   - `blocked → waiting_human`：`human_input_requested`（该状态唯一合法来源）；重放后持久；离开 blocked 前只发一次。
   - `done → awaiting_result` 语义：**保持 `running`**，记 `host_observation_changed`（detail 标注宿主已 done）；只有 result 被 capture 并有判定结论后才 `appendResult`（done ≠ succeeded）。
   - `unknown / 观测断`：`host_observation_changed` 且 `observation_status='observation_lost'`——不产生任何 reason code、不判 Attempt 死。**观测断持续超过阈值（参数化，默认值 brief 定 60s，测试注入小值）→ 追发 `human_input_requested`（Attention 语义=observation_lost 类别），仍不落 Result、不判死**。
   - **launch 盲区**：launch 后 T 秒（参数化）agent 从未进入 idle/working（信任弹窗等）→ 发 `human_input_requested`（needs_input 语义），不落 Result。
   - 宿主真丢（pane/agent 确认消失）：`E_EXECUTOR_HOST_LOST`（reason-codes.md:53「承载 Executor 的宿主消失」——**不是** `E_EXECUTOR_ADAPTER_LOST`，那个专指 pi-agent，见 agent-node.test.mjs:247 既有裁决）；Runtime 重启后按句柄探活失败 → `E_EXECUTOR_ORPHANED`；driver `stop()` 主动杀 → `E_EXECUTOR_KILLED`。herdr CLI 起不来/超时/解析失败属包装层进程内错误，用 `E_BAD_VALUE:*` 前缀，不当协议码。**不新增 reason code**（要新增就是 BLOCKED）。
4. **`relay focus` 与 host_ref 零契约变更**（按预审 P1-3 修订）：不加 RPC method、不改 `control.action` 枚举、不动 `run_status_view` 字段。**`inspectRun` 的 detail 视图不含事件（它就是 state.json）**——`focus` 走既有 `subscribe` 方法取事件流快照（`cli/main.mjs` 的 `runEvents` 同路），找该 node 最近一条 `host_observation_changed`，渲染附着指引。`renderFocus` 只逐字打印事件对象既有字段值（`executor_ref`/`detail`/`observation_status`/`at`/`node_id`），附着指令 = 固定模板 + 逐字插入 `executor_ref`，**不做任何字符串拆解**（遵守 `cli/render.mjs:3-5` 硬规则）；不保存任意拼接命令。CLI 侧受 control-plane import 纪律管辖：数据只能经 RPC，禁止直读 events.jsonl。
5. **测试假宿主**：herdr 桩放 `relay-core/test/helpers/`（**严禁放 fixtures/**——manifest 工具对子目录/非 json 抛错）。测试照 `test/workflow.test.mjs` 骨架 + `test/helpers/settled-state.mjs` 的不变量等待（候选-35）。
6. **Windows 真实 smoke 本卡必做、产品级闭环归 DHR_35**：用真实 herdr（本机可用）验证 adapter 的 pane split → 观察 → stop 最小链路，证据进 progress；跑真实 Codex/Claude 完整闭环不在本卡。

7. **profile 两套结构的桥**（预审 P1-5 裁决）：run 文档里的 `executor_profile` 只有 `kind`+`ref` 两字段（contracts 冻结）——**`ref` 逐字承载 DHR_32 的 `executor_profile_id`**（`herdr.codex.main` 形态实测满足 locator pattern，零契约改动）。注册表读取器落 `runtime/executors/herdr/profile-registry.mjs`：只读、路径参数化（默认 `~/.dh-relay/executor-profiles.json`，测试注入临时文件）、**绝不写注册表**；载入后经 `profiles/validate-profiles.mjs` 校验（只读 import）。`ref` 在注册表查无此条 → **不开 Attempt、保持 pending**（对齐 F-007 既有语义），不发明新失败码。
8. **attach / send 补齐**（预审 P1-6 裁决取「补」）：adapter 增 `sendToHerdrAgent`（承接 waiting_human 的出口：人给输入后经它送达，状态离开 blocked、心跳恢复）与 `attachHerdrAgent`（只返回附着所需句柄与指令文本、不执行）；八动作对齐 DevPlan 目标行。

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
7. Headless(Linux) 场景桩剧本（**非 manifest 冻结件**，落 test/helpers/，不受 fixtures 钉保护）+ 「待真实 smoke」备注。

> 附注（预审 P3-17）：`relay-core/README.md` 与 `as-built/` 的同步由主控在收口批处理，worker 不改、一致性复核也不算缺漏。
