<!-- dh:v1 · workspace/DHR_33/task_plan.md · 施工说明书（worker 可照做粒度） -->
# DHR_33 · 施工说明书

> 执行者：headless worker（codex gpt-5.6-terra high，Herdr 交互终端，cwd = `.dh-worktrees/DHR_33`）。
> 先读工作树根 `AGENTS.md` 编排协议段自我约束；边界与架构裁决以 `brief.md` 为准（裁决 1~6 不得改道，改道即 BLOCKED）。
> 卡住写 `findings.md` 的 `BLOCKED-<n>` 后停在原地；**要动 contracts/、要新增 reason code、host-observation v0 形状装不下——这三种情况一律 BLOCKED，不许自行绕**。

## Context Packet（侦察结论，先核对再动手）

- 执行器样板：`runtime/process-executor.mjs`（纯函数 + 句柄，:107 `startProcessStep -> { done:Promise, kill() }`；文件头明写「不碰 Store」）。
- driver 接入点：`runtime/workflow-driver.mjs:88` `const profile = (node.executor_profiles ?? []).find(item => item?.kind === 'process'); if (!profile) return;`（注释明说 herdr-agent 由本卡接管前「外部代持」）。记账 API：`:72 recordResult`（executor_kind 目前硬编码 'process'）、`:101-109` 开 Attempt（`node_started` 仅首 Attempt + `registerReceipt` 自发 `attempt_started`）。
- 状态真相表：`store/state.mjs:8-14` `STATUS_TRANSITIONS`（running ← node_started/attempt_started/checkpoint_recorded；waiting_human ← human_input_requested，唯一来源）。
- Store API：`store/store.mjs` `appendEvent/registerReceipt/appendCheckpoint/appendResult/subscribe/readEventsAfter/readState`；attempt 终态唯一入口 = `appendResult`；写序 = 先 events.jsonl 后 state.json。
- 事件 kind 全集（19 个，冻结）：含 `checkpoint_recorded`、`human_input_requested`、`host_observation_changed`。`executor_kind` 枚举已含 `herdr-agent`（contracts/_shared/relay.common.v1.schema.json:56-64）。**事件对象没有 payload 字段**：`store/store.mjs:162` `emitEvent` 只组装 12 个既有键，多余键静默丢弃——结构化信息只能进 `executor_ref` 与 `detail`（编码格式见 brief 裁决 3）。
- CLI：`cli/main.mjs` 扁平分发（:22 COMMANDS / :24 POSITIONAL_COUNTS / :329 分发链）；渲染 `cli/render.mjs`（:3-5 硬规则：打印值必须在传入对象逐字可找）；数据一律经 RPC `inspectRun`。
- 机器闸（预审 P3-18 修正）：`test/control-plane-imports.test.mjs` 的 test1 控制面扫描**不含 runtime/**，真正管住的是本卡要改的 `cli/main.mjs`/`cli/render.mjs`（禁 import `store/`、`host.mjs`——所以 focus 数据必须走 RPC）；test2 对 runtime 新文件只要求不引 host-main/startrun、不出现 createRunWithNumbering/startDetachedHost token。`test/agent-node.test.mjs`：:130 是 pi/dsh 不托管钉（与基线无机器联系，**保留原样**）；本卡**新增** herdr 托管钉 + 更新其文件头 :3-7。capability 基线来源 = `tools/capability-baseline.mjs:52` `REFERENCE_EXECUTOR_KINDS` 常量。
- 测试骨架参照 `test/workflow.test.mjs`（进程内 `startRuntimeService` 起真 Run）；等待一律用 `test/helpers/settled-state.mjs` 的 `settledState`（等不变量，候选-35）。fixtures/golden|negative 目录禁止放任何非 json/子目录。
- 本机 herdr 实测事实：`knowledge/herdr-派活操作.md`（pane split/agent start/get/read/send-keys；claude kind 有 PATH shim 坑；`herdr agent get` 返回 JSON 含 `agent_status`(idle/working/blocked/done/unknown) 与 `state_change_seq`）。herdr CLI 命令语法以本机 `herdr --help` 为准。
- `npm test` 是显式清单：新测试必须在 `package.json` `scripts.test` 末尾追加 ` test/herdr-adapter.test.mjs` 一个 token（候选-39：完成后对比用例总数增量确认真被拾取）。存量全量已知抖动（findings DHR_32/F-2：runtime detached-host ESRCH、agent-node settledState 超时），如实留档不豁免、不伪称全绿。

## 步骤 1 · 现状核对（只读，半小时内完成）

1. 通读 `runtime/process-executor.mjs`、`runtime/workflow-driver.mjs`、`store/state.mjs`、`test/agent-node.test.mjs` 文件头与第一条测试、`tools/capability-baseline.mjs`（搞清 `capability_manifest.executor_kinds` 的来源：工具常量还是 baseline 手写）。与 Context Packet 不符的任何点记 progress；影响裁决的记 BLOCKED。
2. 本机 `herdr --help`、`herdr agent --help`、`herdr pane --help` 输出摘要（只记子命令与参数名）进 progress；确认 `herdr agent get <名>` JSON 字段名（agent_status / state_change_seq / pane_id / terminal_id）。

## 步骤 2 · Herdr CLI 包装层（Create `runtime/executors/herdr/herdr-cli.mjs`）

- 导出无状态函数，全部 `spawnSync`/`spawn` 调 `herdr` CLI，可注入二进制路径与超时：`makeHerdrCli({ herdrBin = 'herdr', timeoutMs = 10000 })` 返回 `{ paneSplit({cwd, direction='right'}), agentStart({name, kind, paneId, args}), agentGet(name), agentRead(name, {lines, source}), agentSendKeys(name, keys), paneKill(paneId)?, version() }`。
- 每个函数返回 `{ ok:true, value } | { ok:false, reason, detail }`——**包装层错误（herdr 起不来/超时/JSON 解析失败）一律用进程内前缀码 `E_BAD_VALUE:*` 形态，不用协议 reason code**（预审 P1-4 裁决）；协议码（HOST_LOST/ORPHANED/KILLED）由 driver 侧按 brief 裁决 3 的分界选用。
- JSON 解析只取字段，不 eval；参数一律数组传 spawn，**不拼接 shell 字符串**（brief 裁决 4「不保存任意拼接命令」在这里同样适用）。

## 步骤 3 · Adapter 本体（Create `runtime/executors/herdr/herdr-executor.mjs` + `profile-registry.mjs`）

- 形状对齐 process-executor：纯函数 + 句柄；不 import store/host-main。
- **`profile-registry.mjs`**（brief 裁决 7）：`loadExecutorProfiles({ registryPath = <默认 ~/.dh-relay/executor-profiles.json> })` 只读载入 + 经 `../../profiles/validate-profiles.mjs` 校验（只读 import，`resolveAlias:false` 快速路径即可）；`resolveProfile(registry, ref)` 按 `executor_profile_id === ref` 查条目。**绝不写注册表。**
- `launchHerdrAgent({ cli, registryProfile, runId, nodeId, attemptId, workDirRoot })`：
  - `workDirRoot` 必填并写进返回句柄与事件 detail（brief 完成条件 5）；pane cwd = workDirRoot。
  - 流程：paneSplit → agentStart（kind 按注册表条目的 `backend/product` 映射；claude 系按 knowledge 手册须走 pane run 形态——本卡桩测不真拉 claude，真实 smoke 用 codex kind；把「claude 系需 pane run」写进句柄 `launch_constraints` 供 DHR_35 消费）→ 返回 `{ ok, handle:{ agent_name, pane_id, terminal_id, work_dir_root, started_at, launch_constraints } }`（herdr 版本不进句柄，真实 smoke 时另取进 progress）。
  - **launch 盲区**（brief 裁决 3）：内建 `readyTimeoutMs`（参数化），到时 agent 仍未进 idle/working → 返回 `{ ok:true, handle, blind:true }` 供 driver 发 Attention。
- `observeHerdrAgent({ cli, handle })` → `{ ok, observation:{ herdr_status, state_change_seq, observed_at } }`（快路：单次 `agent get`）。
- `reconcileHerdrAgent({ cli, handle, lastSeq })`（慢路）：`agent get` + 判定——status=unknown / 暂查无 agent → `{ kind:'observation_lost' }`；pane 与 agent 双双确认消失 → `{ kind:'host_lost' }`（driver 侧落 `E_EXECUTOR_HOST_LOST`）；否则 `{ kind:'alive', observation }`。
- `captureHerdrResult({ cli, handle, lines=120 })`：`agent read --source recent-unwrapped`，返回原文。**成败判定规则（唯一版本，照做）**：capture 拿不到输出 → 不出 Result，走 reconcile 分类；拿到输出但无结构化结论 → 缺判定器时不落 Result、保持 running + observation 登记，绝不猜；判定器由调用方注入（本卡 = 测试/真实 smoke 明确注入）。
- `sendToHerdrAgent({ cli, handle, keys })`（brief 裁决 8）：经 `agentSendKeys` 送达输入——waiting_human 的出口。
- `attachHerdrAgent({ handle })`：只返回附着句柄与指令文本（固定模板 + 逐字插 agent_name），不执行。
- `stopHerdrAgent({ cli, handle })`：优雅停（send-keys 或按 herdr --help 实际能力），返回 `{ ok }`。
- **状态映射表**（导出常量，测试直接引用）：`working→running(心跳)`、`blocked→waiting_human(只发一次)`、`done→仍 running + observation(宿主done)`、`idle→有判定结论则 capture 落 Result，无则 observation 登记`、`unknown→reconcile`、`observation_lost 超阈值→追发 Attention(不落 Result)`、`launch 盲区→Attention`。

## 步骤 4 · driver 接线（Edit `runtime/workflow-driver.mjs`，最小 diff）

- :88 分叉点改为：先找 `kind==='process'` 走原路；再找 `kind==='herdr-agent'` 走新分支——**经 profile-registry 以 `profile.ref` 解析注册表条目**（brief 裁决 7）；ref 查无此条 → 不开 Attempt、保持 pending（对齐 F-007）；都没有则 return（pi/dsh 仍外部代持）。
- herdr 分支复用既有开 Attempt 记账（`node_started` 首 Attempt + `registerReceipt`）。轮询循环（间隔参数化，测试注入小值，不写死魔数）：
  - working → `appendCheckpoint` 心跳。**注意 store/store.mjs:242 的幂等陷阱：同 id+同 digest 第二次起静默不发事件**——每次心跳生成唯一 `checkpoint_id`（如 `hb-<单调序号>`），`payload_digest = digest(observation)` 用 `tools/canonical.mjs` 的 `digest`（与 recordResult 同源，只读 import）；`receipt_id`/`attempt_id` 必须与当前回执一致（:237 身份链三查）。
  - blocked → `appendEvent({kind:'human_input_requested', executor_kind:'herdr-agent', executor_ref, detail: 按 brief 裁决 3 编码})`，**只发一次直到状态离开 blocked**；人给输入经 `sendToHerdrAgent` 送达后心跳恢复。
  - done/idle → capture；有判定结论才 `recordResult`（executor_kind 从 profile.kind 传入，**去掉 :72 硬编码**，process 行为不变）；无结论保持 running + `host_observation_changed`。
  - observation_lost → `appendEvent({kind:'host_observation_changed', observation_status:'observation_lost', detail 编码})`，不落 Result；**持续超过阈值（参数化）→ 追发一次 `human_input_requested`（observation_lost 语义），仍不落 Result、不判死**。
  - host_lost（pane+agent 双亡确认）→ `recordResult({ outcome:'failed', reason:'E_EXECUTOR_HOST_LOST' })`；Runtime 重启后按句柄探活失败 → `E_EXECUTOR_ORPHANED`。
  - launch 盲区（`blind:true`）→ 发 `human_input_requested`（needs_input 语义），不落 Result。
- driver `stop()` 时对活跃 herdr 句柄调 `stopHerdrAgent` 并落 `E_EXECUTOR_KILLED`（对齐 process 路径 stop 行为）。

## 步骤 5 · CLI（Edit `cli/main.mjs` + `cli/render.mjs`）

- `COMMANDS` 加 `'focus'`；`POSITIONAL_COUNTS` 加 `focus: 2`（run_id + node_id）；usage 补一行。
- `runFocus`（按预审 P1-3 修订）：**走既有 `subscribe` 方法**（`runEvents` 同路：event_stream_snapshot），过滤该 node 的 `host_observation_changed` 取最近一条；无则输出「无宿主观测」降级文案，不报栈。
- `renderFocus(model)`（按预审 P2-11 修订）：只逐字打印事件对象既有字段值（`executor_ref` / `detail` / `observation_status` / `at` / `node_id`）；附着指令 = 固定模板常量 + 逐字插入 `executor_ref`；**不做任何字符串拆解**（拆 detail 子串 = 计算新字段 = 违反 render.mjs:3-5 硬规则；在函数注释里写明模板自辩供代码轮核对）。
- **不加 RPC method、不改 contracts**；host_ref 展示同理只渲染事件对象既有字段。

## 步骤 6 · 测试（Create `test/herdr-adapter.test.mjs` + `test/helpers/fake-herdr.mjs`）

- 假宿主：`test/helpers/fake-herdr.mjs` 生成一个临时可执行桩（.mjs + 包一层 .cmd，或直接 node 脚本路径注入 `herdrBin`），按预演脚本응답 `pane split`/`agent start`/`agent get`/`agent read`/`send-keys`：状态序列可编程（如 `working,working,blocked,working,done`），read 返回预置文本。桩状态落临时文件，杜绝内存态依赖。
- 断言（照 workflow.test.mjs 骨架 + settledState 等待）：
  1. herdr 节点 launch 后进 `running`；**连续 N 次心跳产生 N 条 `checkpoint_recorded`**（专防幂等陷阱静默失效）；
  2. `blocked` → `waiting_human`，且 `human_input_requested` 只发一次；**重放（replayRun/重启 actor）后 waiting_human 持久**（H5）；**`sendToHerdrAgent` 送达输入后状态离开 blocked、心跳恢复**；
  3. `done` 不直接 succeeded：无判定结论时保持 `running` 且有 `host_observation_changed`；注入判定器后经 `appendResult` 变 `succeeded`（executor_kind='herdr-agent' 逐字断言）；
  4. 观测断：`host_observation_changed` + `observation_status='observation_lost'`，无任何 reason code、Attempt 不进终态；**持续超阈值（注入小阈值）→ 恰好一条追加的 `human_input_requested`，仍无 Result**；
  5. 宿主真丢（桩答复 pane+agent 双亡）：`E_EXECUTOR_HOST_LOST` 落 Result，failed 只中断本 attempt；
  6. `stop()` → `E_EXECUTOR_KILLED` 对齐 process 语义；
  7. launch 盲区（桩令 agent 永不进 idle/working + 注入小 readyTimeout）→ `human_input_requested`、无 Result；
  8. profile 桥：ref 查无此条 → 不开 Attempt、保持 pending、零事件（对齐 F-007）；
  9. 事件账重放与 state.json 逐字节一致（照 workflow.test.mjs 命题 3）；
  10. `relay focus` 渲染：构造含 host_observation 的事件对象，`renderFocus` 输出的每个值在传入对象逐字可找（含负例：无观测降级文案）；
  11. process 路径回归不变：`test/workflow.test.mjs`、`test/agent-node.test.mjs` 改后全绿。
- `agent-node.test.mjs` 更新（预审 P2-9 口径）：**:130 的 pi/dsh 不托管钉原样保留**；**新增**一条 herdr 托管钉（herdr-agent 节点会被 driver 驱动、开 Attempt、落事件）；文件头 :3-7 更新为 DHR_33 起 executor_kinds=['herdr-agent','process'] 的窄路径说明。
- `package.json` `scripts.test` 追加 ` test/herdr-adapter.test.mjs`；完成后对比用例总数增量（候选-39）贴 progress。
- **有效单测（heavy 规矩）**：变异点**由代码轮 2 复核实例选定**，本阶段只登记候选变异面（①状态映射表、②blocked 只发一次、③observation_lost 不落 Result、④超阈值恰好一条 Attention——四处），worker 不自选不自跑；复核轮到位后按其选点做红→还原（sha256 两算）→绿；选点须满足候选-45（该保护唯一负责的场景）。

## 步骤 7 · capability 基线（窄路径）

1. 改 `tools/capability-baseline.mjs:52` `REFERENCE_EXECUTOR_KINDS` 为 `['herdr-agent','process']`（唯一来源已预审确认），按该工具自己的机制再生成 `capability-baseline.json`；`capability_hash` 变化是**预期**（rpc/contracts 测试走复算路径自动跟随，不改那两个测试文件）。findings 记一条：`contracts/CANONICALIZATION.md` §三示例自此过时（contracts 本卡禁改，留后续契约变更卡修正）。
2. `git diff --stat contracts/` 必须为空（贴 progress）；`node tools/audit-contracts.mjs` 0 违规；`node tools/fixture-manifest.mjs` 绿；`npm test` 全量结果如实记录（已知 F-2 抖动照旧留档）。

## 步骤 8 · Windows 真实 herdr 最小 smoke（证据进 progress）

- 前置：确认本机 `herdr --version` 可用并把版本号记 progress（HostObservation「版本」的降级承载，见 brief Oracle 差异）。**smoke 期间先取证 DSH 未运行**（进程/服务查询输出摘要，按白名单脱敏）——这是完成条件 3（P6-M5）唯一的真实取证（预审 P2-14）。
- 用真实 herdr 跑一次 adapter 最小链路：注册表读 `%USERPROFILE%\.dh-relay\executor-profiles.json` 解析 `herdr.codex.main` → `launchHerdrAgent`（args 给 `--help` 类一次性无害命令）→ `observe` 若干次 → `captureHerdrResult` → `stopHerdrAgent`；随后依次跑 `relay status / inspect / events / focus` 输出摘要贴 progress。**不跑真实模型推理任务、不烧额度**。
- **preflight 判据三条**（预审 P2-13，DevPlan :144）：①handle 1:1——launch 返回句柄用 `herdr agent get` / `herdr pane get` 反查确认一一对应；②pane 可见且可交互；③`stop` 后有界退出（记录退出耗时）。三条证据贴 progress。
- Headless(Linux) 场景桩剧本（**非 manifest 冻结件**）：在 `test/helpers/` 放 SSH 断连语义桩（观测不中断），测试标注「Linux 真实 SSH 证据延后（B-22①），桩不冒充」。

## 步骤 9 · 回归与收尾

1. `cd relay-core && node --test test/herdr-adapter.test.mjs` 单跑绿 + `npm test` 全量（如实记录）+ `node tools/audit-contracts.mjs` 0 违规。
2. 提交前：`git status --short` 贴 progress，allowed-paths 外条目即停；`git diff --stat contracts/ fixtures/ profiles/ store/ rpc/ adapters/` 全部为空。
3. 只 `git add` allowed-paths 内文件；`git commit -m "feat(dh-relay): DHR_33 Herdr Adapter 与状态对账（wt/DHR_33）"`。禁止 push。
4. progress.md 写 DONE 段（完成条件逐条自评 + 证据指针 + 未决清单；H4/H9 写「延后 B-22①」不写达成）。**不改 DevPlan、不进入复核、不删 worktree。**
