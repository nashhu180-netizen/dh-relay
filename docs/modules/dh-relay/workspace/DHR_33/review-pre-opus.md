<!-- dh:v1 · workspace/DHR_33/review-pre-opus.md -->
# DHR_33 · 开工预审复核（fresh · 只读侦测型）

> 复核对象：`brief.md` / `task_plan.md`；对照 DevPlan §3.2 DHR_33（P6 开发方案 :134-146）、design/06 §3/§4/§11、relay-core 真实代码。
> 形态：只读。除本文件外未创建/修改任何文件，未执行任何 git 写操作，未派活。
> 全部行号均为本次实读所得（relay-core 相对 `relay-core/`；DevPlan 相对 `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`）。

---

## P1（开工前必须由主控裁决，worker 照做会直接撞墙）

### P1-1 · `relay.event/v2` 根本没有 `payload` 字段，而且多传的键会被**静默丢弃**

- **位置**：`brief.md:27`（Attention「放 payload」）、`brief.md:31`（host-observation「放 payload」）；`task_plan.md:47`、`:54`、`:64`、`:68` 全线依赖 payload。
- **问题**：`contracts/relay.event.v2.schema.json:7-86` 的事件对象字段闭集只有 `protocol / run_id / seq / at / kind / node_id / attempt_id / executor_kind / executor_ref / observation_status / reason / detail`，且 `additionalProperties: false`（:86）。**没有 payload**。
  更要命的是它不会报错：`store/store.mjs:162-176` 的 `emitEvent` 是逐字段组装 event 对象的（只认上面那 12 个键），worker 传进去的 `payload:{...}` 会在组装时被**丢掉**，schema 校验随后通过、事件正常落盘——数据静默消失，测试如果只断言"事件存在"还会绿。这是本卡最容易变成"表面完成、实际零信息"的一处。
- **建议**：brief 裁决 3 改写为：观测/Attention 的结构化信息**只能落在 `executor_ref`（locator 字符串，≤1024，禁绝对路径与 scheme 形前缀）与 `detail`（≤4096 自由字符串）两个既有字段上**，并在 brief 里冻结 `detail` 的编码格式（例如固定 `k=v;k=v` 且键序固定，便于测试逐字断言）。同时把 v0-shape 的用词从"放 payload"改成"按该 shape 的字段语义映射到 event 的既有字段"，否则按 brief 自己的红线（:31 末句）这就是 BLOCKED。

### P1-2 · HostObservation「记版本 / 能力 hash / pane 句柄」在现有 v0 形状里装不下 —— 这是 brief 自己定义的 BLOCKED 触发条件，会在开工第一天踩到

- **位置**：`brief.md:18`（完成条件 4，逐字来自 DevPlan:138）、`brief.md:31`（"locator 放 pane/agent/版本/能力 hash"）。
- **问题**：`contracts/v0-shapes/relay.host-observation.v1.shape.json:10-31` 的字段全集是 `protocol / run_id / node_id / attempt_id / executor_kind / host_ref / observation_status / observed_at / lost_since`，`additionalProperties: false`（:31）。**没有版本字段、没有 capability hash 字段、没有 pane 字段**——`host_ref` 只有一个，且是 `relay.common/v1#/$defs/locator`（单个字符串）。
  把「pane 句柄 + agent 名 + herdr 版本 + 能力 hash」四样塞进一个 locator，还要同时满足 `relay.common.v1.schema.json:17` 的 pattern（`^(?![A-Za-z][A-Za-z0-9+.-]*:)(?![\\/~%]).+$` —— 任何 `herdr:xxx` 形态会被 `E_ABSOLUTE_LOCATOR` 拒），不是"紧一点"，是**语义上装不下**。
  另附一条事实：这份 shape 目前**零生产代码引用**（全仓 grep `host-observation` 只有 `runtime/status.mjs:7` 一句"不动它"），它是未冻结的 v0 形状（`x-freeze-status: v0-shape-only`），首次承重点标注就是 P6/P7。
- **建议**：不要把这个裁决留给 worker 触发 BLOCKED 再回头（那等于白烧一次派活）。主控在开工前三选一并写进 brief：
  (a) **不动契约**：三项信息编码进 `event.detail` 的固定文本格式，HostObservation 对象本身不落盘；完成条件 4 的"记录"以事件账里可逐字检出为准。
  (b) **承认首次承重**：走契约变更冻结 host-observation v0 → 本卡范围显著变大、`capability_hash` 变化、`contracts/` 零 diff 硬闸作废。
  (c) **降级**：版本/能力 hash 降为 progress 证据（真实 smoke 记录），只有 pane 句柄进事件账；按候选-42 登记为上游 Oracle 差异。
  个人倾向 (a)+(c) 组合，但这是主控的裁决位，不是复核的。

### P1-3 · `relay focus` 的取数路径不成立：`inspectRun` 的 detail 视图里**没有事件**

- **位置**：`brief.md:32`（裁决 4："经既有 `inspectRun`（detail 视图，事件里含 host_observation payload）取 herdr 句柄"）、`task_plan.md:54`（步骤 5）、`task_plan.md:68`（断言 8）、`visual_map.md`（"inspectRun detail → renderFocus"）。
- **问题**：`runtime/service.mjs:588-601` 的 `inspectRun`，detail 分支返回的 `detail` 就是**直接读该 Run 的 `state.json`**；`contracts/relay.client-read-model.v1.schema.json:13` 把 `detail` 约束为 `relay.run-state/v1`；`contracts/relay.run-state.v1.schema.json` 的字段只有 run_id / run_status / group / progress / elapsed_seconds / node_states / updated_at / state_signature；`cli/render.mjs:51-66` 的 `renderDetailView` 也只渲染这些。**整条 detail 路径上一条事件都没有**，遑论 host_observation。
- **建议**：改走既有 `subscribe` 方法（`rpc/server.mjs:55` 的方法白名单里有它，`cli/main.mjs` 的 `runEvents` 就是这条路：event_stream_snapshot + 事件通知）。`focus` = 取事件流 → 找该 node 最近一条 `host_observation_changed` → 渲染。**这仍然是零契约变更**（不加 method、不改枚举），但 brief 裁决 4 的措辞、task_plan 步骤 5、断言 8 都要按这条重写。顺带注意 `cli/**` 受 `test/control-plane-imports.test.mjs:22` 的 import 纪律闸管辖（禁 `store/`、`host.mjs`），数据必须经 RPC，不能图省事直读 events.jsonl。

### P1-4 · reason code 选错：herdr 宿主丢失应是 `E_EXECUTOR_HOST_LOST`，不是 `E_EXECUTOR_ADAPTER_LOST`

- **位置**：`brief.md:30`、`task_plan.md:29`、`:39`、`:47`、`:65`（五处都写 `E_EXECUTOR_ADAPTER_LOST`）。
- **问题**：`contracts/reason-codes.md:52` 原文——`E_EXECUTOR_ADAPTER_LOST` = "**pi-agent 的冻结 Adapter 进程消失**"；`:53` ——`E_EXECUTOR_HOST_LOST` = "**承载 Executor 的宿主消失**"。herdr 的 pane / agent / server 正是"承载 Executor 的宿主"。
  这不是我的解读：`test/agent-node.test.mjs:247` 已经就同一问题留下过明文裁决——"码的选择不是照抄 ①：`E_EXECUTOR_ADAPTER_LOST` 按 reason-codes.md:52 **专指 pi-agent 的** …"，而该文件 `:244` 的 dsh-agent 用例用的正是 `E_EXECUTOR_HOST_LOST`。brief 复用 ADAPTER_LOST 等于把 pi 的码借给 herdr 用，恰好重蹈那条已登记的判断。
- **建议**：分界改为——herdr pane/agent 确认消失 = `E_EXECUTOR_HOST_LOST`；Runtime 重启后按句柄探活/重连失败 = `E_EXECUTOR_ORPHANED`（`reason-codes.md:54`）；driver `stop()` 主动杀 = `E_EXECUTOR_KILLED`（对齐 process 语义，`:51`）；herdr CLI 自身起不来/超时/JSON 解析失败属**包装层入参与环境问题**，不是协议码语义，走 `E_BAD_VALUE:*` 这类进程内前缀（`reason-codes.md` §四末的"边界声明"明确这类前缀不上线、不当协议码用）。改动波及 task_plan 步骤 2 的返回码约定、步骤 4 的分类、步骤 6 断言 5。三个码都是既有码，不触发"新增 reason code = BLOCKED"。

### P1-5 · 两套 profile 结构如何对上，brief/task_plan 一个字没说（用户点名的第 ⑥ 项，确认是断点）

- **位置**：`task_plan.md:37`——"agentStart（kind 按 `profile.backend/product` 映射）"。
- **问题**：driver 在 `runtime/workflow-driver.mjs:88` 拿到的 `node.executor_profiles[i]` 是 **run 文档里的 `executor_profile`**，其定义在 `contracts/_shared/relay.common.v1.schema.json:66-82`：**只有 `kind` 和 `ref` 两个字段，`additionalProperties: false`**。`profile.backend` / `profile.product` **不存在**，读出来恒为 `undefined`——步骤 3 照这句写，kind 映射必然全落空。
  另一侧，DHR_32 冻结的 profile 在 `profiles/executor-profile.schema.json:49-53`：`executor_profile_id`（pattern `^(herdr|process|pi-agent)\.[a-z0-9-]+\.[a-z0-9-]+$`，实例即 `herdr.codex.main`）+ `backend` / `product` / `command_alias` / `account_alias` / `capabilities` / …。注册表**实体在仓外**：`~/.dh-relay/executor-profiles.json`（DHR_32 `brief.md:43` 冻结的路径，`progress.md:41` 有实跑记录）；仓内 `profiles/fixtures/golden-registry.json` 只是脱敏副本，且 `profiles/**` 在本卡禁改清单里。
  而 DevPlan `:77` 与 `:88` 都明写"**Runtime 侧接线在 DHR_33/34**"——这道桥就是本卡的活，brief 却整篇没提。
- **建议**：brief 补一条裁决（编号 7），至少定死三件事：
  1. **桥接口径**：`executor_profile.ref` 逐字承载 `executor_profile_id`。实测 `herdr.codex.main` 满足 locator pattern（无冒号前缀、非 `/ \ ~ %` 起头），可直接放行，无需任何契约改动。
  2. **注册表读取器落点**：`runtime/executors/herdr/profile-registry.mjs`（已在 allowed-paths 的 `runtime/executors/herdr/**` 内，不扩范围）；只读、路径参数化（默认 `~/.dh-relay/executor-profiles.json`，测试注入临时文件），**绝不写**注册表。
  3. **解析不到时的行为**：ref 在注册表里查无此条 → **不开 Attempt、保持 pending**（与 `workflow-driver.mjs:97` 对 process 路径 F-007 的既有语义一致："Runtime 不该为一个自己启动不了的入口凭空造一次尝试"），不要发明新失败码。
  另：task_plan 步骤 8 让真实 smoke "profile 用 `herdr.codex.main`"，若不定第 2 条，worker 会不知道该从哪读它。

### P1-6 · 交付面比 DevPlan 少两个动作：`attach` 与 `send` 全程无人实现

- **位置**：DevPlan `:136` 与 `:79`、`brief.md:11`（目标行）都写八个动作 `launch / observe / capture / focus / attach / send / stop / reconcile`；`task_plan.md:32-42`（步骤 3）实际只排了 launch / observe / reconcile / capture / stop **五个**。
- **问题**：`send` 不是可有可无的——完成条件 2（H5 · P6-M3）要的是"`blocked` 进入持久 Attention"，而 Attention 的完整语义链是"人给输入 → 继续跑"；没有 send，本卡产出的 blocked 是个**只能进不能出**的态。步骤 2 的包装层已经写了 `agentSendKeys`（`task_plan.md:28`），但 adapter 与 driver 层没有任何调用者，等于建好了管子不接。`attach` 同理：`focus` 只渲染指令、不执行，那"附着"这个动作在本卡就没有落点，而完成条件 3 的原文正是"CLI 可完成查询**与附着**"。
- **建议**：二选一，别含糊过去：
  - **补**：步骤 3 增 `sendToHerdrAgent({cli, handle, keys})` 与 `attachHerdrAgent({cli, handle})`（后者只返回附着所需句柄/指令、不执行），步骤 6 增一条"blocked → send → 状态离开 blocked → 心跳恢复"的桩测；
  - **砍**：brief 非目标段显式写"attach/send 的真实交互闭环延后至 DHR_35，本卡只产出句柄与指令渲染"，并按候选-42 登记为与 DevPlan 目标行的 Oracle 差异（现在 brief 的 Oracle 差异段只有 work_dir_root 一条）。

---

## P2（不拦开工，但不改就会在复核轮/验收轮返工）

### P2-7 · "`done` 只进 `awaiting_result`"是一条**逐字无法达成**的验收口径，却没登记进 Oracle 差异

- **位置**：`brief.md:16`（完成条件 2，逐字复制自 DevPlan `:139`）vs `brief.md:28`（裁决 3 把它改写成"保持 running"）。
- **问题**：全仓 grep `awaiting_result` —— **零命中**。node_state 的 7 个取值里没有它（`contracts/relay.run-state.v1.schema.json` run_status 描述原文："条款覆盖 node_state.status 的全部 7 个取值"），`store/state.mjs:8-14` 的 `STATUS_TRANSITIONS` 里也没有对应产生边。裁决 3 的重解释（done → 保持 running + `host_observation_changed` 标注）本身是对的、也是唯一可行解，但它是一次**验收口径的语义替换**，brief 只写在裁决段，没进"上游 Oracle 差异说明"（`brief.md:19` 那段目前只有 work_dir_root 一条）。复核轮/验收人按完成条件字面核对时，这条会被判不达标。
- **建议**：把它并入完成条件 5 的 Oracle 差异段，写清："H5 的 `awaiting_result` 在冻结的 7 值状态机里无对应取值；本卡以 `running` + `host_observation_changed`（标注宿主已 done）表达 done ≠ succeeded；是否接受该表达由验收人裁决。"候选-42 的纪律要的就是这个动作。

### P2-8 · capability 基线的**语义**被改写，而承载该语义的 `contracts/CANONICALIZATION.md` 在禁改清单里

- **位置**：`brief.md:24`、`brief.md:46`、`task_plan.md:76`。
- **问题**：来源确认了，brief 的猜测是对的——`tools/capability-baseline.mjs:52` 的 `REFERENCE_EXECUTOR_KINDS = ['process']` 就是唯一来源，改这一处即可，`rpc/capabilities.mjs:17` 只读 `capability-baseline.json` 文件，**不需要动 `rpc/`**（这点 allowed-paths 是够的）。
  但该常量承载的不只是一个数组：`tools/capability-baseline.mjs:28-30` 与 `:50-51` 的注释原文是"基线取『**只托管 process 的最小 P5 参考实现**』…别的 Runtime（带 Pi Adapter 的、带 DSH Native 的）算出的是**另一个**指纹，那是设计意图"；`contracts/CANONICALIZATION.md:77` 的示例逐字写着 `"executor_kinds": ["process"]`，`:89` 写着"上例即『只托管 process 的最小 P5 参考实现』的清单形状（… **1 个 executor kind**）"，末段又重申一次。
  改了常量，机器全绿（复算路径自洽），但**冻结契约文档从此与代码事实矛盾，而 contracts/ 本卡禁改 = 无法修**。这是一次有代价的决定，brief 用"允许仅改该一处常量并登记 progress"一句话带过了。
- **建议**：brief 显式裁决并留档："本仓 Runtime 的实际托管面自本卡起含 herdr-agent，基线跟随实际实现；`CANONICALIZATION.md` §三示例与本文表述随之过时，记 findings + backlog，留给后续契约变更卡修正，本卡不改 `contracts/`。" 顺带给 worker 一条定心丸：`capability_hash` 会变是**预期**，`test/rpc.test.mjs`（基线平等三例）与 `test/contracts.test.mjs:203` 都走复算路径，会自动跟随，不需要改这两个测试文件（它们也不在 allowed-paths 里）。

### P2-9 · "`agent-node.test.mjs` 第一条钉 = 基线与 driver 托管面一致性"—— 与事实不符

- **位置**：`task_plan.md:16`（Context Packet）、`brief.md:24`（裁决 2 末句）。
- **问题**：实读 `test/agent-node.test.mjs:130-197`，第一条测试是"批4 边界钉：driver 不托管 agent 节点——不开 Attempt、不写任何事件"，它构造 pi-agent + dsh-agent 两个节点，断言二者零事件、`status='pending'`、`attempt_count=null`。**全文不读 `capability-baseline.json`，与基线没有任何机器联系**。所以：加 herdr 托管**不会让这条钉变红**，"更新它"这个说法不成立——实际要做的是**新增**一条 herdr 托管面的钉。
  真正会因本卡而过时的是该文件的**文件头 `:3-7`**，它写死了"`capability-baseline.json` 的 `executor_kinds` 是 `["process"]`…让 Runtime 去托管 pi-agent / dsh-agent 就是能力变更，得动冻结基线——本卡不走那条路"。
- **建议**：task_plan 步骤 6 的措辞改为："①`:130` 的 pi/dsh 不托管钉**原样保留**（这正是 brief 裁决 2 要保的那条）；②新增一条 herdr 托管钉（herdr-agent 节点会被 driver 驱动、开 Attempt、落事件）；③更新文件头 `:3-7` 的窄路径说明，写清 DHR_33 起 executor_kinds 变为 `["herdr-agent","process"]`。"文件头改动也在 allowed-paths 内，无须扩范围。

### P2-10 · 用 `appendCheckpoint` 做心跳有三个现成陷阱，步骤 4 一条都没交代

- **位置**：`task_plan.md:47`（"working 时按节流（如 ≥5s 间隔）`appendCheckpoint` 心跳"）。
- **问题**：读 `store/store.mjs:230-255`：
  - `:242-246` 同一 `checkpoint_id` + 同 `payload_digest` → 返回 `{ok:true, idempotent:true}` 且**不发任何事件**。心跳若用固定 id + 固定内容，第二次起就**静默失效**，状态不会刷新，而测试若只断言"有 checkpoint_recorded"照样绿；
  - 同 id + 不同 digest → `E_CHECKPOINT_CONFLICT`；
  - `:247` 该 attempt 已有 Result → `E_TERMINAL_STATE_CONFLICT`；
  - `:237-241` 身份链三查：`receipt_id` 必须存在、`attempt_id` 必须与回执一致、且必须是该 node 的 current receipt。
  另外 checkpoint 对象必须自带 `checkpoint_id` 与 `payload_digest`（`workflow-driver.mjs` 目前**从未调用过 `appendCheckpoint`**，process 路径没有先例可抄，worker 是从零写这段）。
- **建议**：步骤 4 写明"每次心跳生成唯一 `checkpoint_id`（如 `hb-<单调序号>`），`payload_digest = digest(observation)`（用 `tools/canonical.mjs` 的 `digest`，与 `recordResult` 同源）"；步骤 6 加一条断言：**连续 N 次心跳必须产生 N 条 `checkpoint_recorded`**——这条专防上面第一个陷阱。

### P2-11 · `renderFocus` 与 `render.mjs` 硬规则会正面对撞

- **位置**：`task_plan.md:54` vs `cli/render.mjs:3-5`（原文："本模块因此禁止自己计算任何新字段——每个打印出来的值都必须能在传入对象里逐字找到"）。
- **问题**：一旦按 P1-1 的结论把句柄编码进 `detail` 字符串，`renderFocus` 想单独打印 `agent_name` 就必须**解析**那个字符串——解析出来的子串在传入对象里**不是逐字可找**的（对象里只有整串），这就是"计算新字段"。步骤 6 断言 8 要求"输出的每个值在传入对象逐字可找"，届时会自相矛盾。
- **建议**：`renderFocus` 只逐字打印事件对象**已有的字段值**（`executor_ref` / `detail` / `observation_status` / `at` / `node_id`），附着指令用固定模板 + 逐字插入 `executor_ref`（模板是常量不是计算，但要在函数注释里把这条自辩写清楚，供代码轮复核核对）；**不做任何字符串拆解**。这也顺带满足了 brief 裁决 4 的"不保存任意拼接命令"。

### P2-12 · 状态映射漏两个态，完成条件 2 有一半没有靶子

- **位置**：`brief.md:25-31`（映射五条）vs `brief.md:16`（完成条件 2 要求"…**pane 消失、进程退出**均有明确结果；**启动信任弹窗等盲区进入 Attention 或启动失败**"）。
- **问题**：
  1. **observation_lost 超阈值 → Attention 缺位**。`contracts/v0-shapes/relay.host-observation.v1.shape.json:27` 的 `lost_since` 描述原文："超过阈值后出 Attention（design/06 H5），但**始终不判 Attempt 死**"；`relay.attention.v1.shape.json:25` 的 category 枚举里也确实有 `observation_lost`。brief 只写了"observation_lost 只登记、不判死"，**没有超阈值升级这一档**——于是"观测断了三小时"和"观测断了三秒"在账上完全一样，H5 的"明确结果"落空。
  2. **launch 阶段盲区完全没有映射**。信任弹窗、agent 起了但永远不进 idle/working、pane 起了但 agent 没起——步骤 3 的 `launchHerdrAgent` 只返回 `{ok, handle}`，没有任何超时/盲区判定。
- **建议**：映射表补两行，并在步骤 6 各配一条断言：
  - `observation_lost 持续 > 阈值（参数化，测试可注入小值）` → 发 `human_input_requested`（waiting_human 的唯一合法来源，`store/state.mjs:12`），语义对应 attention 的 `observation_lost` 类别；**仍不落 Result、不判死**（与裁决 3 不冲突）。
  - `launch 后 T 秒内 agent 从未进入 idle/working` → 判启动失败（reason 按 P1-4 的结论选码）或发 Attention，二选一在 brief 里定死。

### P2-13 · DevPlan 明写的 preflight 判据没进 brief/task_plan

- **位置**：DevPlan `:144`（实施提示："复用 evidence/03 的 preflight 判据（**handle 1:1、visible/interactive、有界退出**）"）vs brief/task_plan 零提及。
- **问题**：这三条是 DevPlan 给本卡的实施约束，尤其"handle 1:1"（launch 返回的 pane/agent 句柄与真实终端一一对应，不能张冠李戴）正是 focus/attach 能否可信的前提。
- **建议**：至少在步骤 8（Windows 真实 smoke）把三条列为检查项：launch 返回句柄 → 用 `herdr agent get` / `pane` 侧反查确认 1:1；pane 可见且可交互；`stop` 后进程有界退出（记录退出耗时）。证据贴 progress。

### P2-14 · 完成条件 3（H1 · P6-M5）没有任何步骤产出对应证据

- **位置**：`brief.md:17`（"DSH 不启动时 CLI 可完成查询与附着"）、`review.md` E-3303 挂"focus/status/inspect/events 测试 + 真实 smoke（DSH 关闭）"vs `task_plan.md` 步骤 5/6/8 —— 无一步涉及"DSH 未运行"这个前提事实。
- **问题**：测试环境里 DSH 本来就不运行，所以单测**天然满足但零证明力**；而真实 smoke（步骤 8）也没要求记录 DSH 状态。这条验收会变成"没人证过、但也没人能说它没达成"。
- **建议**：步骤 8 补一条：smoke 期间记录 DSH 未运行的事实（进程/服务查询输出摘要，按凭据白名单脱敏），随后依次跑 `relay status / inspect / events / focus` 并贴 progress。这是 P6-M5 唯一便宜且真实的取证方式。

---

## P3（措辞/准确性，改起来很便宜）

### P3-15 · 事件 kind 数目写错：是 19 个不是 18 个

- **位置**：`brief.md:25`（"18 个事件 kind 是全集"）、`task_plan.md:14`（"事件 kind 全集（18 个，冻结）"）。
- **问题**：`contracts/relay.event.v2.schema.json:18-38` 实际枚举 **19 个**：run_created / node_started / attempt_started / attempt_succeeded / attempt_failed / attempt_orphaned / checkpoint_recorded / human_input_requested / result_recorded / late_result_quarantined / host_observation_changed / client_connected / client_disconnected / lease_acquired / lease_expired / operation_accepted / operation_committed / operation_failed / run_finished。
- **建议**：改成 19。数字本身无害，但复核轮若拿 18 当基数做覆盖率论证就会连带错。（同段的其余引证均已核实无误：7 值 node_state ✓；`executor_kind` 枚举已含 `herdr-agent`，`relay.common.v1.schema.json:56-64` ✓。）

### P3-16 · "Headless fixture 冻结件"落 `test/helpers/` 就不是冻结件

- **位置**：`brief.md:60`（交付物 7）、`task_plan.md:82`。
- **问题**：本仓里"冻结"这个词有确切所指——`fixtures/` + `fixtures/manifest.json` 的钉（`tools/fixture-manifest.mjs:37-53` 的三道守卫），而 `fixtures/**` 本卡禁改。落在 `test/helpers/` 的桩剧本不受 manifest 保护，改了没人知道。落点选择本身是对的（裁决 5 避开 fixtures 是正确的），只是叫法不对。
- **建议**：措辞改为"Headless(Linux) 场景桩剧本（**非 manifest 冻结件**）"，并在 progress 里写明它不受 manifest 钉保护、DHR_35 补真实 SSH smoke 时须重新核对。这条也直接服务于 B-22① 的"fixture 不得冒充真实证据"。

### P3-17 · README 与 as-built 会漂移，且都不在 allowed-paths

- **位置**：`relay-core/README.md`（工具与命令清单，`:45` 那行已经因 DHR_30 增补而说着"8 份"了）、`docs/modules/dh-relay/as-built/`（relay-core 快照）。
- **问题**：新增 `relay focus`、新增 `runtime/executors/herdr/`、`capability_hash` 变化，三处都不会反映进这两份文档；而它们不在 allowed-paths 内，worker 想同步也不能改。
- **建议**：brief 的 allowed-paths 段补一句"as-built 与 README 的同步由主控在收口批处理，worker 不改、也不算缺漏"——省得 worker 越界，或一致性复核轮把它记成 P2。

### P3-18 · Context Packet 对 import 纪律闸的覆盖面描述有误导

- **位置**：`task_plan.md:16`（"runtime 新文件会被 test2 扫"）。
- **问题**：`test/control-plane-imports.test.mjs:22` 的 `CONTROL_PLANE_DIRS = ['cli','adapters/dsh-bridge','rpc']` —— **不含 `runtime/`**。第一条测试根本不看新 adapter；第二条测试管的是"生产代码不引 `host-main.mjs` / `startrun.mjs` / 不出现 `createRunWithNumbering` token"。现在的写法容易让 worker 以为 runtime 新文件受 import 纪律保护，从而放松对 `cli/` 侧（真正受管的那侧）的自查。
- **建议**：改为"新 adapter 落 `runtime/`，**不在** test1 的控制面扫描面内；test1 真正管住的是本卡要改的 `cli/main.mjs` / `cli/render.mjs`（禁 `store/`、`host.mjs` —— 所以 focus 必须走 RPC，见 P1-3）。test2 只要求不引 host-main/startrun。"
  （`findings.md` 的 F-0 已登记该测试 `:21`/实为 `:22` 的 `adapters/dsh-bridge` 写死问题，处置"本卡不动"合理，无异议。）

### P3-19 · 步骤 3 里留着一段自问自答的草稿，说明书不该保留被推翻的推理

- **位置**：`task_plan.md:40`——"…缺可证结论一律 `{outcome:'failed', reason:'E_EXECUTOR_ADAPTER_LOST'}` fail-closed？——不对：观测不到 ≠ 失败。规则：…"。
- **问题**：这是给 worker **照做**的施工说明书。把被推翻的第一版和最终规则并排放着，照做者有相当概率抓错前半句（而前半句恰好是最危险的那个：把观测不到判成失败，直接违反 ADR-002 第④问与 `reason-codes.md:56`）。
- **建议**：删掉被推翻的半句，只留最终规则："capture 拿不到输出 → 不出 Result，走 reconcile 分类；拿到输出但无结构化结论 → 缺判定器时不落 Result、保持 running + observation 登记，绝不猜。"

---

## 附：已核实**无误**的部分（供主控免于重复核对）

- `workflow-driver.mjs:88` 分叉点原文与注释 ✓（`:89` 注释确实写着 herdr-agent 由外部代持）；`:72` `recordResult` 的 `executor_kind: 'process'` 确为硬编码（`:78`）✓；`:101-109` 开 Attempt 的记账形态 ✓；`:97` 的 F-007 语义 ✓。
- `store/state.mjs:8-14` `STATUS_TRANSITIONS` 内容与 brief 裁决 3 完全一致：running ← node_started/attempt_started/checkpoint_recorded；waiting_human ← human_input_requested（唯一来源）✓。
- `store/store.mjs:16` `LIFECYCLE_KINDS` **不含** `host_observation_changed` —— 意味着观测事件**不受终态守卫拦截**，终态后仍可写。brief 裁决 3 对观测事件的定位站得住 ✓。
- `runtime/process-executor.mjs:107` `startProcessStep` 返回 `{done, kill}`、文件头"不碰 Store" ✓；作为形状样板合适。
- `cli/main.mjs:22` COMMANDS / `:24` POSITIONAL_COUNTS / `:329` 分发链行号全对 ✓；`cli/render.mjs:3-5` 硬规则原文 ✓。加 `focus` 不会打破 `test/cli.test.mjs`（`:586-597` 只断言 stderr 含 `usage:`，`:892-906` 只查多余 positional）✓ —— 无须把 cli.test.mjs 拉进 allowed-paths。
- 裁决 5 的"桩严禁放 `fixtures/`"有据：`tools/fixture-manifest.mjs:39`（非普通文件抛错）、`:42`（非 .json 抛错）✓。
- 候选-35 / -39 / -40 / -42 四条引用全部存在且语义对得上（`knowledge/教训库-候选.md:290 / 322 / 330 / 346`）✓。
- allowed-paths 闭集**不过宽**：禁改重点提示覆盖 contracts / fixtures / profiles / store / rpc / adapters / runtime 其余文件，与本卡实际需要吻合。唯一的**不够用**是 P1-5 指出的注册表读取器落点（建议方案落在已允许目录内，故无须扩权）。
- **heavy 有效单测由轮 2 选点**（`task_plan.md:72`）的安排自洽 ✓：本阶段只登记候选变异面、worker 不自选不自跑，与 AGENTS 宪章 #5「有效单测变异点由代码轮 2 复核实例选定」一致。三处候选变异面（状态映射表 / blocked 只发一次 / observation_lost 不落 Result）选得也合理。**唯一提醒**：若 P1-1~P1-4 的裁决改变了实现形态，这三处候选面需同步重述，否则轮 2 会对着不存在的代码选点。

---

REVIEW-DONE 共19条（P1 6 · P2 8 · P3 5）
