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
- 事件 kind 全集（18 个，冻结）：含 `checkpoint_recorded`、`human_input_requested`、`host_observation_changed`。`executor_kind` 枚举已含 `herdr-agent`（contracts/_shared/relay.common.v1.schema.json:56-64）。
- CLI：`cli/main.mjs` 扁平分发（:22 COMMANDS / :24 POSITIONAL_COUNTS / :329 分发链）；渲染 `cli/render.mjs`（:3-5 硬规则：打印值必须在传入对象逐字可找）；数据一律经 RPC `inspectRun`。
- 机器闸：`test/control-plane-imports.test.mjs`（runtime 新文件会被 test2 扫：不 import host-main、不出现 createRunWithNumbering/startDetachedHost token 即绿）；`test/agent-node.test.mjs` 第一条钉 = 基线 executor_kinds 与 driver 托管面一致性；capability 基线 = `relay-core/capability-baseline.json` + `tools/capability-baseline.mjs`。
- 测试骨架参照 `test/workflow.test.mjs`（进程内 `startRuntimeService` 起真 Run）；等待一律用 `test/helpers/settled-state.mjs` 的 `settledState`（等不变量，候选-35）。fixtures/golden|negative 目录禁止放任何非 json/子目录。
- 本机 herdr 实测事实：`knowledge/herdr-派活操作.md`（pane split/agent start/get/read/send-keys；claude kind 有 PATH shim 坑；`herdr agent get` 返回 JSON 含 `agent_status`(idle/working/blocked/done/unknown) 与 `state_change_seq`）。herdr CLI 命令语法以本机 `herdr --help` 为准。
- `npm test` 是显式清单：新测试必须在 `package.json` `scripts.test` 末尾追加 ` test/herdr-adapter.test.mjs` 一个 token（候选-39：完成后对比用例总数增量确认真被拾取）。存量全量已知抖动（findings DHR_32/F-2：runtime detached-host ESRCH、agent-node settledState 超时），如实留档不豁免、不伪称全绿。

## 步骤 1 · 现状核对（只读，半小时内完成）

1. 通读 `runtime/process-executor.mjs`、`runtime/workflow-driver.mjs`、`store/state.mjs`、`test/agent-node.test.mjs` 文件头与第一条测试、`tools/capability-baseline.mjs`（搞清 `capability_manifest.executor_kinds` 的来源：工具常量还是 baseline 手写）。与 Context Packet 不符的任何点记 progress；影响裁决的记 BLOCKED。
2. 本机 `herdr --help`、`herdr agent --help`、`herdr pane --help` 输出摘要（只记子命令与参数名）进 progress；确认 `herdr agent get <名>` JSON 字段名（agent_status / state_change_seq / pane_id / terminal_id）。

## 步骤 2 · Herdr CLI 包装层（Create `runtime/executors/herdr/herdr-cli.mjs`）

- 导出无状态函数，全部 `spawnSync`/`spawn` 调 `herdr` CLI，可注入二进制路径与超时：`makeHerdrCli({ herdrBin = 'herdr', timeoutMs = 10000 })` 返回 `{ paneSplit({cwd, direction='right'}), agentStart({name, kind, paneId, args}), agentGet(name), agentRead(name, {lines, source}), agentSendKeys(name, keys), paneKill(paneId)?, version() }`。
- 每个函数返回 `{ ok:true, value } | { ok:false, reason:'E_EXECUTOR_ADAPTER_LOST'|'E_BAD_VALUE', detail }`——herdr 进程起不来/超时/JSON 解析失败一律 `E_EXECUTOR_ADAPTER_LOST` 语义（既有码，不新增）。
- JSON 解析只取字段，不 eval；参数一律数组传 spawn，**不拼接 shell 字符串**（brief 裁决 4「不保存任意拼接命令」在这里同样适用）。

## 步骤 3 · Adapter 本体（Create `runtime/executors/herdr/herdr-executor.mjs`）

- 形状对齐 process-executor：纯函数 + 句柄；不 import store/host-main。
- `launchHerdrAgent({ cli, profile, runId, nodeId, attemptId, workDirRoot })`：
  - `workDirRoot` 必填并写进返回句柄（brief 完成条件 5：work_dir_root 由 launch 决定并登记）；pane cwd = workDirRoot。
  - 流程：paneSplit → agentStart（kind 按 profile.backend/product 映射；claude 系按 knowledge 手册须走 pane run 形态——本卡桩测不真拉 claude，真实 smoke 用 codex kind；把「claude 系需 pane run」写进句柄 constraints 字段供 DHR_35 消费）→ 返回 `{ ok, handle:{ agent_name, pane_id, terminal_id, work_dir_root, herdr_version, started_at, launch_constraints } }`。
- `observeHerdrAgent({ cli, handle })` → `{ ok, observation:{ herdr_status, state_change_seq, observed_at } }`（快路：单次 `agent get`）。
- `reconcileHerdrAgent({ cli, handle, lastSeq })`（慢路）：`agent get` + 判定——status=unknown / agent 不存在 / pane 消失 → `{ kind:'observation_lost' }`；进程可证已亡（agent 记录消失且 pane 亡）→ `{ kind:'adapter_lost' }`；否则 `{ kind:'alive', observation }`。
- `captureHerdrResult({ cli, handle, lines=120 })`：`agent read --source recent-unwrapped`，返回原文供 driver 落 Result payload；**不在 adapter 里判成败语义**（成败判定规则由 driver 侧函数 `classifyHerdrOutcome` 承担，缺可证结论一律 `{ outcome:'failed', reason:'E_EXECUTOR_ADAPTER_LOST' }` fail-closed？——不对：观测不到 ≠ 失败。规则：capture 拿不到输出 → 不出 Result，走 reconcile 分类；capture 拿到输出但无结构化结论 → outcome 由调用方（本卡 = 测试/真实 smoke 明确注入的判定器）给，缺判定器时**不落 Result、保持 running + observation 登记**，绝不猜）。
- `stopHerdrAgent({ cli, handle })`：优雅停（send-keys 或 pane kill，按 herdr --help 实际能力），返回 `{ ok }`。
- **状态映射表**（导出常量，测试直接引用）：`working→running(心跳 checkpoint)`、`blocked→waiting_human`、`done→仍 running + observation(awaiting_result)`、`idle→结合 result 有无：有→capture，无→observation 登记`、`unknown→reconcile`。

## 步骤 4 · driver 接线（Edit `runtime/workflow-driver.mjs`，最小 diff）

- :88 分叉点改为：先找 `kind==='process'` 走原路；再找 `kind==='herdr-agent'` 走新分支；都没有则 return（保持 pi/dsh 外部代持）。
- herdr 分支复用既有开 Attempt 记账（`node_started` 首 Attempt + `registerReceipt`）；轮询循环：observe → working 时按节流（如 ≥5s 间隔）`appendCheckpoint` 心跳；blocked 时 `appendEvent({kind:'human_input_requested', ...})`（payload 按 attention v0 形状）且**只发一次直到状态离开 blocked**；done/idle 时 capture → 有判定结论则 `recordResult`（executor_kind 从 profile.kind 传入，**去掉 :72 的硬编码**，process 路径行为不变）；observation_lost → `appendEvent({kind:'host_observation_changed', payload: host-observation v0 形状})`，**不落 Result**；adapter_lost → `recordResult({ outcome:'failed', reason:'E_EXECUTOR_ADAPTER_LOST' })`。
- driver `stop()` 时对活跃 herdr 句柄调 `stopHerdrAgent` 并按既有语义落 `E_EXECUTOR_KILLED`（对齐 process 路径 stop 行为）。
- 心跳/轮询间隔做成参数（默认值 + 测试可注入小值），不写死 sleep 魔数。

## 步骤 5 · CLI（Edit `cli/main.mjs` + `cli/render.mjs`）

- `COMMANDS` 加 `'focus'`；`POSITIONAL_COUNTS` 加 `focus: 2`（run_id + node_id）；usage 补一行。
- `runFocus`：经既有 `inspectRun`（detail 视图）取事件流，找该 node 最近一条 `host_observation_changed` 的 payload；无则输出「无宿主观测」文案。渲染 `renderFocus(model)`：打印 pane/agent 句柄字段 + 安全附着指令（`herdr agent attach <agent_name>` 形式，字段逐字来自 payload；**不拼接、不持久化任何命令**）。host_ref 展示同理挂进 `renderDetailView` 对既有事件对象的渲染（值逐字可找）。
- **不加 RPC method、不改 contracts**；`focus` 拿不到数据时降级输出指引文案，不报栈。

## 步骤 6 · 测试（Create `test/herdr-adapter.test.mjs` + `test/helpers/fake-herdr.mjs`）

- 假宿主：`test/helpers/fake-herdr.mjs` 生成一个临时可执行桩（.mjs + 包一层 .cmd，或直接 node 脚本路径注入 `herdrBin`），按预演脚本응답 `pane split`/`agent start`/`agent get`/`agent read`/`send-keys`：状态序列可编程（如 `working,working,blocked,working,done`），read 返回预置文本。桩状态落临时文件，杜绝内存态依赖。
- 断言（照 workflow.test.mjs 骨架 + settledState 等待）：
  1. herdr 节点 launch 后进 `running`，心跳产生 `checkpoint_recorded`；
  2. `blocked` → `waiting_human`，且 `human_input_requested` 只发一次；**重放（replayRun/重启 actor）后 waiting_human 持久**（H5「持久 Attention」）；
  3. `done` 不直接 succeeded：无判定结论时状态保持 `running` 且有 `host_observation_changed`；注入判定器给出成功结论后经 `appendResult` 变 `succeeded`（executor_kind='herdr-agent' 逐字断言）；
  4. 观测断（桩返回 agent 不存在）：产生 `host_observation_changed` + `observation_status='observation_lost'`，**无任何 reason code、Attempt 不进终态**；
  5. adapter 真丢（桩进程杀死且 pane 亡）：`E_EXECUTOR_ADAPTER_LOST` 落 Result，failed 只中断本 attempt；
  6. `stop()` → `E_EXECUTOR_KILLED` 对齐 process 语义；
  7. 事件账重放与 state.json 逐字节一致（照 workflow.test.mjs 命题 3）；
  8. `relay focus` 渲染：构造含 host_observation 的 detail 对象，`renderFocus` 输出的每个值在传入对象逐字可找（含负例：无观测时的降级文案）；
  9. process 路径回归不变：`test/workflow.test.mjs`、`test/agent-node.test.mjs` 改后全绿。
- `agent-node.test.mjs` 更新：第一条钉改为「基线 executor_kinds = ['process','herdr-agent'] 且 driver 托管面 = 恰好这两类；pi-agent/dsh-agent 仍不托管（钉保留）」。
- `package.json` `scripts.test` 追加 ` test/herdr-adapter.test.mjs`；完成后对比用例总数增量（候选-39）贴 progress。
- **有效单测（heavy 规矩）**：变异点**由代码轮 2 复核实例选定**，本阶段只登记候选变异面（状态映射表、blocked 只发一次、observation_lost 不落 Result 三处），worker 不自选不自跑；复核轮到位后按其选点做红→还原（sha256 两算）→绿。

## 步骤 7 · capability 基线（窄路径）

1. 读 `tools/capability-baseline.mjs` 确定 `executor_kinds` 来源；按机制把 hosted 集合更新为 `["process","herdr-agent"]`（工具常量则改那一处并登记；baseline 手写则改 baseline 后跑工具校验）。
2. `git diff --stat contracts/` 必须为空（贴 progress）；`node tools/audit-contracts.mjs` 0 违规；`node tools/capability-baseline.mjs`（校验模式）与 `node tools/fixture-manifest.mjs` 均绿；`npm test` 全量结果如实记录（已知 F-2 抖动照旧留档）。

## 步骤 8 · Windows 真实 herdr 最小 smoke（证据进 progress）

- 前置：确认 `$env:HERDR_ENV` 或本机 `herdr --version` 可用。用真实 herdr 跑一次 adapter 最小链路：`launchHerdrAgent`（profile 用 `herdr.codex.main`，kind codex，args 给 `--help` 类一次性无害命令；或 herdr 支持的最小 agent 形态）→ `observe` 若干次 → `captureHerdrResult` → `stopHerdrAgent`；每步命令与 JSON 摘要贴 progress。**不跑真实模型推理任务、不烧额度**；产品级闭环归 DHR_35。
- Linux fixture 冻结件：在 `test/helpers/` 放 Headless 场景桩剧本（SSH 断连语义 = 观测不中断），测试标注「Linux 真实 SSH 证据延后（B-22①），fixture 不冒充」。

## 步骤 9 · 回归与收尾

1. `cd relay-core && node --test test/herdr-adapter.test.mjs` 单跑绿 + `npm test` 全量（如实记录）+ `node tools/audit-contracts.mjs` 0 违规。
2. 提交前：`git status --short` 贴 progress，allowed-paths 外条目即停；`git diff --stat contracts/ fixtures/ profiles/ store/ rpc/ adapters/` 全部为空。
3. 只 `git add` allowed-paths 内文件；`git commit -m "feat(dh-relay): DHR_33 Herdr Adapter 与状态对账（wt/DHR_33）"`。禁止 push。
4. progress.md 写 DONE 段（完成条件逐条自评 + 证据指针 + 未决清单；H4/H9 写「延后 B-22①」不写达成）。**不改 DevPlan、不进入复核、不删 worktree。**
