<!-- dh:v1 · workspace/DHR_33/review-code1-opus.md -->
# DHR_33 · 代码轮 1 复核（fresh / 只读侦测型）

> **复核者实际运行模型：`claude-fable-5[1m]`**（SessionStart hook 告知；非 `--model opus` 期望的 Opus，按候选-40 取证登记口径如实记录）。
> 复核对象：提交 `596a49b`（本工作树 HEAD，14 文件 / +441 −29）。
> 对照基准：`brief.md` 八条架构裁决 + 完成条件 1~5；`task_plan.md` 步骤 2~9。
> 手段：只读。`git show/diff`、`rg`、`node --test`、`node --input-type=module -`（临时目录内起真 Store + 真 driver 的行为探针，用完即删）、本机 `herdr --help` 系列只读子命令。未创建/修改本文件以外的任何文件，未做任何 git 写操作，未派活。

---

## 一、结论

**不建议放行本轮。** 六条 P1。其中 `P1-1` 是**主路径直接崩**：herdr agent 一旦进入 `done` / `idle`（也就是 brief 完成条件 2、裁决 3 的核心语义「done ≠ succeeded」那条路），driver 会因事件 schema 校验失败整体抛出、attempt 永久悬挂——这条路径**从未被任何测试走过**，正是 task_plan 步骤 6 断言组 3 本该抓到的。

契约面是干净的：`contracts/` `fixtures/` `profiles/` `store/` `rpc/` `adapters/` 六个目录相对父提交 **零 diff**（已验），`node tools/audit-contracts.mjs` 0 违规，`node tools/fixture-manifest.mjs` 79/79 对证通过，capability 基线经工具机制再生成、`capability_hash` 变化符合裁决 2 的预期。CLI 侧的 `focus` 走 `subscribe`、`render.mjs:3-5` 硬规则也守住了。问题全部集中在 **driver 状态机的正确性** 与 **测试覆盖**。

按 task_plan 步骤 6 的 11 组断言逐组核对，**只有第 10 组（renderFocus）是真的在验事实**；其余 10 组或只验了纯函数替身（映射常量、reconcile 分类），或完全没有。逐组结论见 §四。

---

## 二、P1（六条，必须回修）

### P1-1 · `host_observation_changed` 不带 `observation_status` → driver 当场崩，attempt 永久悬挂

- **位置**：`relay-core/runtime/workflow-driver.mjs:166-167`（done/idle 分支的 `appendEvent`）
- **问题**：`contracts/relay.event.v2.schema.json:113-122` 对 `kind === 'host_observation_changed'` 有 `required: ["observation_status"]` + `$ref` 到 `relay.common/v1#/$defs/observation_status`（`enum: ["alive","observation_lost"]`）。`store/store.mjs:162` 的 `emitEvent` 会把缺省的 `observation_status` 填成 `null`，`null` 不在枚举里 → 抛 `E_SCHEMA_INVALID:E_UNKNOWN_ENUM`。异常经 `actor.submitControl` 冒泡出 `driveHerdrNode` → `driveNode` → `drive()`，`driver.done` 变 `{ok:false}`，`finishIfComplete` 不执行，节点停在 `attempt_started`（状态 `running`）、**永远不落 Result**；因为不是 `failed/orphaned`，后续 `resume --retryFailed` 也捞不回来（`workflow-driver.mjs:258-259` 只挑 `pending`/`failed`/`orphaned`）。
- **实证**（临时仓 + 真 Store + 真 driver，假宿主状态序列 `['idle','done',…]`）：

  ```
  SUBMIT-THROW: E_SCHEMA_INVALID:E_UNKNOWN_ENUM
  driver.done.ok=false
  events: run_created | node_started | attempt_started        ← 到此为止，没有 host_observation_changed
  ```

  对照 `['idle','working',…]` 与 `['idle','blocked',…]` 两组不崩，可确认崩点唯一在 done/idle 分支。
- **影响**：brief 完成条件 2（H5 · P6-M3「`done` 只进 `awaiting_result`」）与裁决 3「done → 保持 running + `host_observation_changed`」**在运行时完全走不通**。真实 agent 干完活的第一时间就撞这条。
- **建议**：该分支补 `observation_status: 'alive'`（这正是 `alive` 这个枚举值存在的理由；`observation_lost` 分支 `:139-140` 已经带对了）。同时建议在 `driveHerdrNode` 外层包一次 `try/catch`，把「事件写入失败」降级成一次可见终态或 Attention，而不是让整届 driver 静默死掉——现在一个节点的写失败会连带后面所有节点不再被驱动。

### P1-2 · 判定器没有注入口 → herdr 节点在 driver 路径下永远不可能 `succeeded`

- **位置**：`relay-core/runtime/workflow-driver.mjs:161`（`captureHerdrResult({ cli: herdrCli, handle })`）、`:31-32`（`startWorkflowDriver` 参数表）
- **问题**：`captureHerdrResult` 的成败判定靠 `judge` 形参（`herdr-executor.mjs:63,67`），driver 调用时**没传**，`startWorkflowDriver` 也没有任何 `herdrJudge` / `verdictOf` 参数可供注入。于是 `captured.verdict` 恒为 `null`，`:162` 的 `recordResult` 是**死代码**：herdr 节点经 driver 只可能以 `E_EXECUTOR_KILLED` / `E_EXECUTOR_HOST_LOST` / `E_BAD_VALUE` 收场，`succeeded` 无路可达。
- **对照规格**：task_plan 步骤 3「判定器由调用方注入（本卡 = 测试/真实 smoke 明确注入）」——driver 就是这里的调用方；步骤 6 断言组 3「注入判定器后经 `appendResult` 变 `succeeded`（`executor_kind='herdr-agent'` 逐字断言）」在当前接线下**不可能写出来**。这也解释了为什么该断言组缺席。
- **建议**：`startWorkflowDriver` 增一个 `herdrJudge = null` 参数（与 `herdrCli` / `herdrPollMs` 同层，测试注入小实现），透传到 `captureHerdrResult`；顺带把「无判定器时的终止条件」想清楚（见 P2-3：现在无判定器 + done 会无限轮询）。

### P1-3 · `blocked → working → blocked`：第二段阻塞静默，Attention 再也不发

- **位置**：`relay-core/runtime/workflow-driver.mjs:149-152`（working 分支）与 `:153-158`（blocked 分支）
- **问题**：`blocked` 标志只在 `else`（done/idle/其他）分支 `:160` 复位，**working 分支不复位**。裁决 3 的原话是「离开 blocked 前只发一次」——而 `blocked → working` 就是离开。现在的实现是「整个 attempt 只发一次」。
- **实证**（状态序列 `['idle','blocked','working','blocked','blocked','blocked','blocked']`）：

  ```
  run_created | node_started | attempt_started | human_input_requested | checkpoint_recorded | attempt_failed
  final node status = running（直到 stop 才变 failed）
  ```

  第 2~4 次 `blocked` 一条事件都没有；节点被心跳推回 `running` 后就再没回过 `waiting_human`。
- **影响**：完成条件 2 的「`blocked` 进入**持久** Attention」在多轮交互场景（这恰恰是交互式 agent 的常态：问一次→答→再问）下失守。人第二次被卡住时系统完全不吭声。
- **建议**：working 分支（以及 observation_lost 分支）里一并 `blocked = false`；更稳的写法是用 `lastStatus` 做状态转移判定，只在 `prev !== 'blocked' && now === 'blocked'` 的沿上发事件。

### P1-4 · launch 盲区的 `readyTimeoutMs` 是死参数；宿主已死也被算成「盲区」

- **位置**：`relay-core/runtime/executors/herdr/herdr-executor.mjs:21`（`readyTimeoutMs = 10_000`）、`:39-41`（`blind` 判定）
- **问题**：裁决 3 的语义是「launch 后 **T 秒** agent 从未进入 idle/working → 发 Attention」。实现却是 `agentStart` 之后**立刻观测一次**，不是 idle/working 就判 `blind`；`readyTimeoutMs` 只被原样回吐成 `ready_timeout_ms`，**没有任何一处读它**。真实 herdr 里 agent 刚 start 的瞬时状态几乎不可能已经是 idle——每一次真实 launch 都会误发一条 `human_input_requested`，节点开局即 `waiting_human`。
- **附带问题**：`blind = !observed.ok || …`——`observed.ok === false` 是「CLI 调不通/JSON 解析失败/agent 查无此人」，把它并进「信任弹窗」语义是错的。实证：宿主一开始就不存在（`agentAlive:false, paneAlive:false`）时，事件序列是

  ```
  node_started | attempt_started | human_input_requested | attempt_failed/E_EXECUTOR_HOST_LOST
  ```

  先给人推一条「需要你输入」的误导 Attention，下一轮才判宿主丢。
- **建议**：真做轮询窗口——`launchHerdrAgent` 内按 `readyTimeoutMs` 轮询 `agent get` 直到 idle/working 或超时；本机 herdr 0.8.2 有现成的 `herdr agent wait --state …`（已验，见 `herdr agent --help`），比自转圈更省事。`blind` 只在「观测成功但状态不是 idle/working」时为真；观测失败走 reconcile。

### P1-5 · `E_EXECUTOR_ORPHANED` 完全缺席；Runtime 重启后 herdr attempt 永久悬挂

- **位置**：全仓生产代码零命中（`rg E_EXECUTOR_ORPHANED --glob '!contracts/**' --glob '!fixtures/**'` 只命中 `test/store.test.mjs` 与 `test/agent-node.test.mjs` 的既有 DHR_31 用例）
- **问题**：裁决 3 明列三码分界，其中「Runtime 重启后按句柄探活失败 → `E_EXECUTOR_ORPHANED`」一条没实现。更根本的是：句柄（`agent_name` / `pane_id` / `terminal_id`）**只活在 driver 的内存里**，没有任何落盘承载（事件 `executor_ref` 里只有 `agent_name`，且没有任何代码在重启后去读它）；而 `drive()` 的挑节点条件（`:257-260`）只认 `pending`（或 `retryFailed` 下的 `failed`/`orphaned`），重启后处于 `running` 的 herdr 节点**永远不会被再看一眼**。
- **影响**：完成条件 2「漏事件、**Herdr 重启**、pane 消失、**进程退出**均有明确结果」不成立——Runtime 侧重启这一路没有任何结果。
- **建议**：本卡至少要有恢复路径的最小闭环：driver 起届时扫 `running` 且 `executor_kind='herdr-agent'` 的未决 attempt，用 `executor_ref` 逐字反查 `herdr agent get`；查得到→接管续观测，查不到→`appendResult({outcome:'orphaned', reason:'E_EXECUTOR_ORPHANED'})`。若判定这超出本卡边界，也应显式写进 findings + brief 的未决清单，而不是无声缺失。

### P1-6 · task_plan 步骤 6 的 11 组断言，只有 1 组在验事实

- **位置**：`relay-core/test/herdr-adapter.test.mjs`（全文 63 行 / 4 个 test）+ `relay-core/test/agent-node.test.mjs:198-225`（新增 1 个 herdr 钉）
- **问题**：逐组核对结果见 §四表。**7 组完全没有**（心跳 N 次 N 条、重放后 waiting_human 持久、送输入后离开 blocked、超阈值恰好一条 Attention、`E_EXECUTOR_HOST_LOST` 落 Result、profile ref 未命中零事件、事件账重放与 state.json 逐字节一致）；3 组只验了纯函数替身而非落账事实（映射常量 ≠ blocked→waiting_human、reconcile 返回 `kind` ≠ 落 Result、`launched.blind===false` ≠ 盲区发 Attention）。
- **代价是可量化的**：P1-1 / P1-3 / P1-4 三条缺陷，全部落在缺失的那几组断言的射程内——补上断言组 3、2、7 就会当场变红。heavy 卡登记的四个变异面（状态映射表 / blocked 只发一次 / observation_lost 不落 Result / 超阈值恰好一条 Attention）里，**前两个现在根本没有对应保护**，代码轮 2 就算选中也做不成红→绿。
- **建议**：按步骤 6 原清单补齐，骨架照 `test/workflow.test.mjs` + `test/helpers/settled-state.mjs`。假宿主 `fake-herdr.mjs` 目前已够用（状态序列可编程 + `paneAlive/agentAlive` 开关），主要缺的是 driver 层的场景装配；`herdrPollMs` / `observationLostMs` 已参数化，注入小值即可——我这轮的行为探针就是这么跑通的，成本不高。另注：桩状态存在闭包变量里，与步骤 6 要求的「桩状态落临时文件，杜绝内存态依赖」不符（本卡够用，但跨进程真 smoke 用不上）。

---

## 三、P2（七条）

### P2-1 · driver 分叉顺序与裁决 2/步骤 4 明文相反，改变了多候选节点的既有行为

- **位置**：`relay-core/runtime/workflow-driver.mjs:179-181`
- **问题**：规格是「**先找 `kind==='process'` 走原路；再找 `kind==='herdr-agent'` 走新分支**」（task_plan 步骤 4 首行、brief 裁决 2「在 :88 分叉点**新增**分支」）。实现把 herdr 放在了 process 之前。`contracts/relay.run.v2.schema.json:142-149` 的 `executor_profiles` 是 `minItems:1` 且**无 `maxItems`**，描述写明是「候选**集合**」——一个同时声明 `[{process},{herdr-agent}]` 的节点，改前跑 process、改后跑 herdr。这就是复核焦点②「守住既有 process 路径行为」的破口。
- **建议**：调换两个 `find` 的先后，与规格逐字对齐。若确有「herdr 优先」的理由，那是改道，须走 BLOCKED 而非默默实现。

### P2-2 · `detail` 编码三处破格（裁决 3 冻结的 `k=v;k=v` 固定键序）

- **位置**：`workflow-driver.mjs:144`、`:126`、`:140`
- **问题**：
  1. `:144` 超阈值 Attention 的 `detail` 是裸串 `'observation_lost'`——完全不是冻结格式；同一函数里 blocked 的 Attention（`:157`）用的却是 `observationDetail(...)`，自相矛盾。
  2. `:126` launch 盲区事件写 `herdr_status=needs_input`——`needs_input` 不是 herdr 状态值（herdr 0.8.2 实测为 `idle/working/blocked/done/unknown`），冻结格式里 `<s>` 的位置塞了个语义标签，下游按 herdr 状态解析会读到不存在的取值。
  3. `:140` 与 `:126` 都把 `seq` 硬编码成 `0`，丢掉了最后一次已知的 `state_change_seq`——而 `seq` 恰恰是观测断场景下最有价值的那一格（能判断「断之前走到哪」）。
- **建议**：三处统一走 `observationDetail`；`herdr_status` 位只放真实 herdr 状态（盲区用 `unknown`），语义标签另找位置（`executor_ref` 已被 agent_name 占用，可考虑在 detail 末尾追加固定键，但那要回主控确认是否属于「改冻结格式」）；`seq` 传最后一次观测到的值。

### P2-3 · 观测断/无判定器时每轮一条事件，且第二段观测断永不再发 Attention

- **位置**：`workflow-driver.mjs:138-145`（lost 分支）、`:166-167`（done/idle 分支，修完 P1-1 之后）
- **问题**：两个分支都在**每一轮轮询**落一条 `host_observation_changed`。默认 `herdrPollMs = 1_000`，一个失联一小时的宿主会产出 3600 条事件——而这个 kind 的名字是 `changed`，语义上应当只在观测态**变化**时落账。修完 P1-1 后 done/idle 分支同理：无判定器的 done 节点会永远轮询 + 每秒一条事件，且没有任何退出条件。另外 `lostAttention` 一次置真后不复位（`:122,141-142`），「断→恢复→再断」的第二段观测断不会再有 Attention。
- **建议**：只在 `observation_status` 或 `herdr_status` 相对上一轮发生变化时落事件；`lostAt = null` 的同时 `lostAttention = false`；给「done 且无判定器」设一个有界上限（超时 → Attention 或 orphaned），否则一个 attempt 会挂到天荒地老。

### P2-4 · launch 失败落 Result 用裸协议码 `E_BAD_VALUE`，并丢掉了包装层子码

- **位置**：`workflow-driver.mjs:112-115`
- **问题**：裁决 3 的原话是「herdr CLI 起不来/超时/解析失败属包装层进程内错误，用 `E_BAD_VALUE:*` 前缀，**不当协议码**」。这里恰好反着做：`reason: 'E_BAD_VALUE'`（`contracts/reason-codes.md:29` 的协议码本体）落进了 Result，而 `launched.reason`（形如 `E_BAD_VALUE:HERDR_CLI` / `E_BAD_VALUE:WORK_DIR_ROOT`，唯一能区分「起不来」还是「参数缺」的信息）被整个丢弃，只留了 `structured.detail`。
- **建议**：把 `launched.reason` 带进 `structured`（`reason_detail` 之类）以保住子码；`reason` 用哪个协议码需主控确认——若认为 launch 失败等于宿主起不来，`E_EXECUTOR_HOST_LOST` 语义比 `E_BAD_VALUE` 更贴，但那属于分界裁决，不该由 worker 自定。

### P2-5 · `reconcile` 把「CLI 失败」当「agent 消失」，可能误落 `E_EXECUTOR_HOST_LOST`

- **位置**：`relay-core/runtime/executors/herdr/herdr-executor.mjs:56-61`
- **问题**：判据是 `!observed.ok && !pane.ok → host_lost`。而 `observed.ok === false` 的来源有三种：herdr 二进制起不来 / 超时、JSON 解析失败（`herdr-cli.mjs:22-29`）、返回体缺 `agent_status`（`herdr-executor.mjs:48`）——只有最后一种沾边「agent 没了」。herdr 服务整体短暂不可用时，`agentGet` 与 `paneGet` 会**同时**失败 → 直接判 `host_lost` 并落 Result 判死。这正是 `contracts/reason-codes.md:56` 反复强调要拆开的那条线（观测中断走 `observation_lost`、不判死）。
- **建议**：把「CLI 层失败」与「查得到但确认不存在」分开——只有 CLI 调用成功且明确答复「无此 agent / 无此 pane」才判 `host_lost`；CLI 本身失败一律 `observation_lost`。`herdr-cli.mjs` 需要区分「非零退出且 stderr 指示 not found」与「spawn 失败」。

### P2-6 · `sendToHerdrAgent` 用 `agent send-keys` 送人类输入，语义不对

- **位置**：`herdr-executor.mjs:71-73`、`herdr-cli.mjs:40`
- **问题**：裁决 8 给它的职责是「承接 waiting_human 的出口：人给输入后经它送达」。但本机 herdr 0.8.2 的 `agent send-keys` 收的是**按键名**（同族命令另有 `pane send-text  Send literal text to a pane` 与 `agent prompt  Submit a prompt to an agent`，已实测于 `herdr agent --help` / `herdr pane --help`）。`test/herdr-adapter.test.mjs:32` 传的 `['hello','enter']` 在假宿主下当然过，真实 herdr 上 `hello` 会被当按键序列解析。
- **建议**：文本输入走 `agent prompt`（最贴「给 agent 递一段输入」）或 `pane send-text` + 一个 `enter` 按键；`send-keys` 保留给纯按键场景。附带：该出口目前**没有任何调用方**（driver 不调、CLI 无入口），若本卡就是只交付 adapter 能力，请在 progress 里写明「出口已备、接线归 DHR_35」。

### P2-7 · progress 的 DONE 自评夸大了覆盖面，未披露断言缺口

- **位置**：`docs/modules/dh-relay/workspace/DHR_33/progress.md`（worker 步骤 2~6 条目与 DONE 段）
- **问题**：「覆盖 profile 只读桥、状态映射、blocked/unknown 语义、attach/send/stop，以及 driver 对 herdr-agent 开 Attempt、心跳、stop→`E_EXECUTOR_KILLED` 的窄路径」——这段话对 4 个纯函数用例是成立的，但读者会理解成步骤 6 那 11 组断言已覆盖。DONE 段「②~④ 代码、定向单测和真实 adapter smoke 已有机器证」同样超出事实：完成条件 2 的 `done` 分支实际会崩（P1-1）、`blocked` 持久 Attention 有洞（P1-3）、「Herdr 重启/进程退出有明确结果」无实现（P1-5）。
- **需要说明的是**，worker 在 F-1（`npm test` 6 例失败）和「CLI 无 DSH 前置查询不是 H1 完整证据」两处是**如实留档、没有伪称全绿**的，这点做得对。缺的是「哪些断言没写」的显式披露。
- **建议**：DONE 段补一份步骤 6 的 11 组逐组落地状态表（已写/替身/缺），并把完成条件 2、4 的自评从「已有机器证」下调为「部分」。完成条件 3（H1 · P6-M5，DSH 不启动时 CLI 可完成查询与附着）目前只有 `E_RUN_NOT_FOUND` 的负例，仍是空缺——建议在真实 smoke 里造一个真 Run 再跑 `status/inspect/events/focus`，否则这条验收拿不到证据。

---

## 四、步骤 6 · 11 组断言逐组核对

| # | 断言组（task_plan 步骤 6） | 是否存在 | 是否在验事实 | 证据 / 说明 |
|---|---|---|---|---|
| 1 | 心跳 N 次产生 N 条 `checkpoint_recorded`（防幂等陷阱） | ❌ 无 | — | `agent-node.test.mjs:216` 只断言「**存在**至少一条 `checkpoint_recorded`」。N 次 N 条、`hb-<n>` 唯一性、digest 差异一个都没验。我这轮探针实测 2 次 working → 2 条，功能是对的，但零保护 |
| 2 | `blocked`→`waiting_human`，Attention 只发一次；**重放后持久**；送输入后离开 blocked、心跳恢复 | ⚠️ 替身 | ❌ | `herdr-adapter.test.mjs:25` 只 `deepEqual` 了 `HERDR_STATUS_MAPPING.blocked` 这个**常量字面量**——常量等于自己，与 Store 里是否真落 `human_input_requested`、`state.json` 是否真变 `waiting_human`毫无机器联系。重放持久（H5 核心）、送输入后恢复：完全没有。**P1-3 就藏在这一组的缺口里** |
| 3 | `done` 不直接 succeeded：无结论保持 running + `host_observation_changed`；注入判定器后 `appendResult` 变 succeeded（`executor_kind` 逐字） | ❌ 无 | — | **这一组一旦写就会红**（P1-1 崩溃）；后半段在当前接线下无法写（P1-2 无注入口） |
| 4 | 观测断 → `observation_status='observation_lost'`、无 reason code、Attempt 不进终态；**超阈值恰好一条** Attention | ⚠️ 替身 | ❌ | `herdr-adapter.test.mjs:42` 只断言 `reconcileHerdrAgent` 返回 `kind==='observation_lost'`（纯函数返回值），没碰事件账。「恰好一条」「不落 Result」零覆盖。探针实测该路径本身可用，但 P2-3 的复位缺陷无人守 |
| 5 | 宿主真丢 → `E_EXECUTOR_HOST_LOST` 落 Result，failed 只中断本 attempt | ⚠️ 替身 | ❌ | 同上，`:43` 只验 `kind==='host_lost'`；「落 Result」「只中断本 attempt」没验。探针实测确实会落 `attempt_failed/E_EXECUTOR_HOST_LOST` |
| 6 | `stop()` → `E_EXECUTOR_KILLED` 对齐 process 语义 | ✅ 有 | ✅ | `agent-node.test.mjs:218` 逐字断言 reason。**本组合格** |
| 7 | launch 盲区（永不进 idle/working + 小 readyTimeout）→ `human_input_requested`、无 Result | ⚠️ 反向 | ❌ | 只有 `herdr-adapter.test.mjs:24` 的 `assert.equal(launched.blind, false)`——**验的是不盲区**。盲区正例零覆盖，`readyTimeoutMs` 从未被注入过小值（**因为它根本没被使用**，P1-4） |
| 8 | profile 桥：ref 查无此条 → 不开 Attempt、保持 pending、**零事件** | ⚠️ 替身 | ❌ | `:54` 只验 `resolveProfile(...) === null`（Map 查找），没验 driver 的零事件行为。探针实测该行为正确（只剩 `run_created`） |
| 9 | 事件账重放与 state.json 逐字节一致（照 workflow.test.mjs 命题 3） | ❌ 无 | — | 全无 |
| 10 | `relay focus` 渲染：每个值在传入对象逐字可找 + 无观测降级负例 | ✅ 有 | ✅ | `herdr-adapter.test.mjs:57-63`，`for (const value of Object.values(event)) assert.ok(text.includes(value))` + `renderFocus(null) === '无宿主观测'`。**本组合格，写法也对**（真在验 render.mjs:3-5 硬规则） |
| 11 | process 路径回归不变（workflow / agent-node 全绿） | ⚠️ 待确认 | — | `herdr-adapter.test.mjs` 单跑 4/4 绿（本轮实测）；`agent-node.test.mjs` 本轮超 2 分钟未收敛（后台仍在跑，与 findings F-1/DHR_32 F-2 登记的 `settledState` 超时抖动一致）。worker 记的「10/10 pass」我无法在本轮内独立复现，请代码轮 2 或收口时补跑确认 |

合计：**合格 2 组（#6、#10）／替身 4 组（#2、#4、#5、#8）／缺失 4 组（#1、#3、#7-正例、#9）／待确认 1 组（#11）**。

---

## 五、P3（六条，可延后）

| # | 位置 | 问题 | 建议 |
|---|---|---|---|
| P3-1 | `workflow-driver.mjs:172`、`herdr-executor.mjs:79-81` | `stopHerdrAgent`（`pane close`）的返回值被完全忽略，无论成败都落 `E_EXECUTOR_KILLED`——pane 没关掉时账上却写「已杀」 | 检查返回值；关不掉时落 detail 或降级成 `host_observation_changed` |
| P3-2 | `cli/render.mjs:86-96` | `executor_ref` 缺失时输出 `attach: herdr agent attach —`，是一条无法执行的假指令 | 无 `executor_ref` 时整行不输出，或换成明确的「无附着句柄」文案 |
| P3-3 | `cli/main.mjs:328` | `report(outcome, { renderText: renderFocus, pickResult: … })` 里两个参数永远走不到（`report` 在 `!ok` 时只走 `emitError`，`:79-83`） | 删掉误导性的死参数 |
| P3-4 | `herdr-cli.mjs:29` | `value?.result ?? value` 在 `result` 为 `null`/`false`/`0` 时会回退成整个信封，调用方拿到形状不同的对象。本机实测真实信封是 `{id, result:{…, type}}`，当前取法对 `agent get`/`pane split` 都成立，但兜底语义不严 | 用 `'result' in value ? value.result : value` |
| P3-5 | `workflow-driver.mjs:91-100` | `openAttempt` 抽取时把原 `:185-187` 那段裁决注释（`node_started` 为何只属首次 attempt、重试可见性由 `attempt_started` 承担）丢了——这是本仓少数几处解释「为什么」的注释 | 迁到 `openAttempt` 函数头 |
| P3-6 | `workflow-driver.mjs:277-280`；progress 步骤 8 | `stop()` 从 `current?.kill()` 改成 `await current?.kill()`，herdr 路径下 `kill` 是 `spawnSync`（`timeoutMs` 默认 10s），`stop` RPC 最长会被顶住 10s。另：步骤 8 preflight 三条判据里，②「pane 可见且可交互」与③「stop 后**有界退出**（记录退出耗时）」在 progress 中都只写了「stop 成功」，没有耗时数字，也没有可交互取证 | kill 加独立短超时；smoke 补两条证据 |

---

## 六、本轮已验证通过的项（供收口引用）

- **契约冻结面零 diff**：`git diff --stat 596a49b^ 596a49b -- relay-core/{contracts,fixtures,profiles,store,rpc,adapters}` 输出为空 ✅
- `node tools/audit-contracts.mjs`：0 违规（meta 分叉 0 / K-3 内联 0 / 信封违规 0 / 结构 token 217 全登记 / 白名单同步 0）✅
- `node tools/fixture-manifest.mjs`：79 份逐份 digest 相符 ✅
- capability 基线：`REFERENCE_EXECUTOR_KINDS` 单点改动 + 工具再生成，`executor_kinds` 与 `capability_hash` 同步变化，`rpc/contracts` 两个测试文件未被触碰 ✅（裁决 2 窄路径守住）
- `package.json` `scripts.test`：末尾追加 ` test/herdr-adapter.test.mjs` 一个 token，无其它改动 ✅
- CLI 纪律：`runFocus` 走 `subscribe` 通知流（`main.mjs:314-350`），不 import `store/`、不读 `events.jsonl` ✅；`renderFocus` 逐字转述 + 固定模板，未做任何字符串拆解 ✅（裁决 4）
- `agent-node.test.mjs`：`:130` 的 pi/dsh 不托管钉原样保留、文件头 `:3-7` 已按窄路径更新 ✅（裁决 2）
- herdr CLI 包装层语法与本机 herdr **0.8.2** 实测对齐：`pane split --current --no-focus --direction --cwd`、`pane close`、`agent start <name> --kind --pane --`、`agent get`、`agent read --source --lines`、`agent attach` 全部存在 ✅（`herdr agent attach` 确认存在，附着指令模板是真命令）
- `profile-registry.mjs` 只读、路径参数化、经 `validate-profiles.mjs` 校验、ENOENT 降级为空注册表、绝不写盘 ✅（裁决 7）
- adapter 不 import Store / host-main ✅（裁决 1）

---

## 七、给代码轮 2 的交接备注

- 变异面四处（状态映射表 / blocked 只发一次 / observation_lost 不落 Result / 超阈值恰好一条 Attention）中，**前两处当前没有任何机器保护**，选点前需先按 P1-6 补齐断言组 2、3、4，否则红→绿做不成。
- 我这轮用的行为探针（临时仓 + 真 `createStore` + 真 `startWorkflowDriver` + `makeFakeHerdr`，注入 `herdrPollMs:5` / `observationLostMs:0`）可直接改写成正式测试骨架，成本很低——步骤 6 缺的那几组基本都是这个形状。
- `agent-node.test.mjs` 全量在本轮未跑完，第 11 组「process 路径回归不变」需要独立确认；结合 findings F-1 的 6 例失败，建议收口时给一份「本卡改动前后同机同参」的对照，把抖动与回归分开。

REVIEW-DONE 共19条（P1×6 / P2×7 / P3×6）
