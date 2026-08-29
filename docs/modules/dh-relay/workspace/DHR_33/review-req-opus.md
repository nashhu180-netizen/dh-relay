<!-- dh:v1 · workspace/DHR_33/review-req-opus.md -->
# DHR_33 · 需求方向复核（fresh、只读侦测型）

> **实例自报模型**：`claude-fable-5[1m]`（SessionStart hook 告知；文件名沿用派工时的 `review-req-opus`，实际运行模型以本行为准，请按候选-40 双证口径登记差异）。
> 复核对象：提交 `596a49b`「feat(dh-relay): DHR_33 Herdr Adapter 与状态对账」。
> 复核范围：需求对位，不做代码细审；与代码轮独立，未读其输出（review.md 的「代码轮 1/2」两节回收时均为空）。
> 对照材料：`dev_plan/P6` §2.3 与 §3.2 DHR_33、`design/06` §3/§4/§5/§11（H1/H4/H5）、`design/03` H4/H7/H8 与 §123 去重规则、`workspace/DHR_33/brief.md`（含 Oracle 差异段）与 `task_plan.md` 步骤 6/8 的断言与取证清单。
> 只读自证：本 session 除本文件外零写入、零 git 写操作、零派活。

---

## 一、五个判断点的直接结论

| # | 判断点 | 结论 |
|---|---|---|
| ① | H5 四件事是否各有真实证据 | **否**。四件事里只有「pane 消失」在 adapter 层有一条字符串断言；blocked 持久 Attention、done≠succeeded、launch 盲区三项**只有映射表常量与未被任何测试驱动过的 driver 代码**；「漏事件 / Herdr 重启 / 进程退出」既无实现路径也无断言。task_plan 步骤 6 列了 11 条断言，实际落地 3 条。 |
| ② | 真实 smoke 的证据强度 | **只够撑「snapshot 慢路」的半条**。真实 herdr 0.8.2 走通了 launch→`agent get`→capture→stop 四动词、handle 1:1 有取证，这是硬证据；但**事件快路在交付里根本不存在**（全量 1s 轮询），smoke 无法为它作证。P6-M5 的 DSH 关闭取证**没有留下任何进程/服务查询输出**，只有 progress 括号里一句「（DSH 未运行）」，且 CLI 侧拿到的是非 Run ID 的 `E_RUN_NOT_FOUND`——③ 目前是零有效证据，而 DONE 段却把它并进「②~④ 已有机器证」。 |
| ③ | Linux 延后（E-3301）登记是否合规、是否冒充 | **不冒充成立，登记不完整**。授权链（B-22① + DevPlan §4.3 P6-M6 例外 + review.md 人类受理勾）齐全，progress 与 review.md 都写「延后」不写「达成」，没有拿 fixture 当真实 SSH 证据——这一半干净。但 E-3301 行写的「fixture 冻结 + 待真实 smoke 备注」在交付物里**没有对应物**：交付物 7 的 Headless/SSH 断连语义桩剧本未产出，`test/helpers/` 只有一个平台无关的 `fake-herdr.mjs`，仓内也搜不到「待真实 smoke」标注。 |
| ④ | brief 三条 Oracle 差异是否兑现 | **兑现两条半**。`work_dir_root`：adapter 强制必填 + 进句柄 + 进 detail，**已兑现**（唯一瑕疵见 R-13）。`awaiting_result` 语义替换：done 保持 `running` + `host_observation_changed`，形式上兑现，但代价是**根本没有走向 succeeded 的路**（R-2），这不是「done≠succeeded」，是「永远不 succeed」，语义替换的验收前提被换掉了。「版本/能力 hash 降级为 progress 证据」：herdr 版本 `0.8.2` 已进 progress，**能力 hash 从头到尾没有出现在任何工件里**（capability_hash 是 Relay 自己的基线 hash，不是 Herdr 侧的能力 hash），这一条只兑现了一半。 |
| ⑤ | 能否支撑 DHR_34 / DHR_35 往下走 | **不能，且阻断点没升 findings**。profile 桥只做到「查得到条目」，条目里除 `product` 外**一个字段都没进启动路径**（`agentStart` 的 args 恒为空数组，`command_alias`/`account_alias`/`expected_identity` 全未消费），DHR_34 的身份链无处依附；waiting_human 的人工出口 `sendToHerdrAgent` **没有任何调用方**，Attention 进得去出不来；herdr 节点无成功终态，DHR_35 的「result → 终结节点」在此断路。findings 现有 3 条（F-0/F-1/F-2）全部与这些无关。 |

---

## 二、findings

### P1

**R-1 · 完成条件② 的四件事，三件只有常量与零测试代码**（挂 E-3302）

- 事实：`herdr-adapter.test.mjs` 对 blocked 的全部断言是 `assert.deepEqual(HERDR_STATUS_MAPPING.blocked, { status:'waiting_human', event:'human_input_requested' })`——断的是**一张导出的常量表**，不是行为。done 在测试里出现在 `statuses` 数组末尾但**没有任何断言**。launch 盲区（`blind`）只在正向路径断了 `=== false`，`blind:true` 分支零覆盖。driver 侧新增的 herdr 钉（`agent-node.test.mjs`）只断了 `attempt_started` / `checkpoint_recorded` / `E_EXECUTOR_KILLED` 三件事。
- 对照 task_plan 步骤 6 的 11 条断言：落地 3 条（#6 stop killed、#10 renderFocus 逐字、#8 的 adapter 半条），**缺失 8 条**——含「连续 N 次心跳产生 N 条 checkpoint（专防 store.mjs:242 幂等陷阱）」「重放后 waiting_human 持久」「send 后离开 blocked、心跳恢复」「注入判定器后变 succeeded 且 executor_kind 逐字断言」「超阈值恰好一条 Attention」「host_lost 落 Result」「ref 查无此条时 driver 零事件」「事件账重放与 state.json 逐字节一致」。
- 影响：H5 / P6-M3 的「均有明确结果」目前靠读代码相信，不靠机器证。heavy 档的有效单测轮（步骤 6 末尾登记的四个候选变异面：状态映射表 / blocked 只发一次 / observation_lost 不落 Result / 超阈值恰好一条）里，**后三个变异面根本没有保护它的测试可以变红**——变异测试轮到位后会直接卡住。
- 建议：返工补断言，优先补 blocked 全链（发一次 → 重放持久 → send 后恢复）与超阈值 Attention 两条，这两条同时解锁变异面 ②③④。

**R-2 · herdr 节点没有任何成功终态路径，done≠succeeded 是靠「永不 succeed」换来的**（挂 E-3302 / 阻断 DHR_35）

- 事实：`workflow-driver.mjs` 的 herdr 分支调 `captureHerdrResult({ cli, handle })`——**不传 `judge`**；`captureHerdrResult` 的实现是 `judge` 为函数才算 verdict，否则 `verdict: null`；driver 随即 `if (captured.ok && captured.verdict)` 恒假，落一条 `host_observation_changed` 继续轮询。轮询体是 `while (!stopping)`，**没有任何自退出条件**。
- 结果：herdr-agent 节点可达的终态只有三种，全部是 failed——`E_BAD_VALUE`（launch 失败）、`E_EXECUTOR_HOST_LOST`、`E_EXECUTOR_KILLED`（driver.stop）。`store/state.mjs` 的 `aggregate` 因此永远不会把含 herdr 节点的 Run 判为 succeeded，Run 也永远不会 finish。
- 影响：DHR_35 的验收口径第一条「Relay 签发 Receipt → Herdr 启动 → 观测 → checkpoint → result → Relay 终结节点」在 result 这一步断路，P6-M1 无法达成。task_plan 步骤 6 断言 #3 明写「注入判定器后经 appendResult 变 succeeded」，交付里 driver **没有留下注入判定器的接缝**（`driveHerdrNode` 无参数、`startWorkflowDriver` 也没有 herdrJudge 之类的注入口）。
- 补充：即使 herdr 侧回到 done，节点若此前进过 blocked，`host_observation_changed` 不在 `state.mjs:10` 的任何 `STATUS_TRANSITIONS` 集合里，节点会**永久卡在 waiting_human**。
- 建议：要么把判定器注入口补到 driver（与 process 路径的 `classifyStepOutcome` 对齐），要么在 findings 里明写「本卡不提供成功终态，DHR_35 须先补判定器接缝」并升到 DevPlan 的 DHR_35 依赖备注——现在两样都没有。

**R-3 · 完成条件④ 的「事件快路」完全缺席，且未登记为缺口**（挂 E-3304）

- 事实：完成条件④ 逐字要求「事件快路与 snapshot 慢路**均**可工作」。`design/03` §46 与 H4 把快路定义得很死：`events.subscribe(pane.agent_status_changed)`，「订阅只用来提前触发一次 tick，每个 tick 仍执行一次全量对账 probe」。交付实现是**单一 1 秒定时轮询 `agent get`**（`herdrPollMs = 1_000`），`herdr-cli.mjs` 没有任何订阅面，全仓 `runtime/executors/herdr/` 搜不到 `subscribe`/`events`。
- 连带：`design/03` §123 冻结了「`state_change_seq` 用于去重与顺序，同一 seq 的重复观测不产生新事件」。交付把 `state_change_seq` 读进 detail 却**从不比较**——idle/done 状态下每个 poll 都无条件 append 一条 `host_observation_changed`。配合 R-2 的永不退出，一个 idle 的 herdr 节点会以 1 条/秒的速率无限灌 `events.jsonl`。
- 影响：④ 只成立一半；且事件账体积失控会直接拖垮 DHR_35 的长跑闭环与 `relay events` 回放。
- 说明：herdr 0.8.2 是否经 CLI 暴露订阅面，progress 步骤 1 的子命令清单里没有取证（只记了 pane/agent 两组）。若 CLI 确实不暴露，正确动作是**在 findings 里登记「快路受 CLI 能力所限本卡不做」并挂到阶段闸**，而不是静默按慢路交付。
- 建议：seq 去重必须补（这是 design/03 的冻结口径，不是优化）；快路的有无按取证结果登记。

**R-4 · 注册表条目除 product 外零消费，DHR_34 的身份链无落点**（阻断 DHR_34）

- 事实：`registryProfile` 在 adapter 里的唯一用途是 `agentKind()`——`product === 'claude-code' ? 'claude' : 'codex'`。`agentStart` 的 `args` 由 `launchHerdrAgent` 的默认参数 `args = []` 供给，driver **不传**，于是恒为空。`command_alias` / `account_alias` / `expected_identity` / `config_fingerprint_rule` / `capabilities` / `supported_platforms` / `headless_supported` **全部未被读取**。
- 直接后果：注册表里两个 `product` 相同、`account_alias` 不同的 profile（DHR_32 冻结的正是这种多账号形态），走本 adapter 会启动出**完全一样的进程**。DevPlan P6-M2「身份不串用」、P6-M7「客户端变化不改变 Executor Profile / Attempt / Result 身份链」在这套 Adapter 上无从谈起。
- 加重：事件账里也**没有任何字段记录本次用了哪个 profile**——成功路径上 `executor_ref = handle.agent_name`（`herdr-<attempt 前缀>`），detail 的 k=v 五键里没有 profile；只有 launch 失败那一条 `structured.executor_ref` 里意外带了 `profile.ref`。也就是说事后从事件账**反推不出**这个 Attempt 用的是 `herdr.codex.main` 还是别的。
- 影响：DHR_34 不是「在 DHR_33 基础上加身份」，而是要回头改 launch 签名、改 detail 编码（detail 编码是 brief 裁决 3 **冻结**的，改它要走契约变更）。这个代价没有在任何工件里登记。
- 建议：本卡至少把 `executor_profile_id` 塞进 detail 的固定键序（现在 detail 才 5 个键，`≤4096` 完全放得下），否则 DHR_34 开工第一件事就是撞冻结口径。

**R-5 · waiting_human 的人工出口没有调用方，Attention 进得去出不来**（挂 E-3302 / 阻断 DHR_35）

- 事实：brief 裁决 8 明写 `sendToHerdrAgent` 是「承接 waiting_human 的出口：人给输入后经它送达，状态离开 blocked、心跳恢复」。交付里它是一个**导出但无人调用**的函数——`workflow-driver.mjs` 的 import 列表是 `captureHerdrResult / launchHerdrAgent / observationDetail / observeHerdrAgent / reconcileHerdrAgent / stopHerdrAgent`，没有它；`cli/main.mjs` 没有对应命令；没有新 RPC method（这倒是符合零契约变更）。`attachHerdrAgent` 同样无调用方。
- 结果：节点进 waiting_human 之后，人在 CLI 侧**没有任何途径**把输入送进去。只能靠人绕开 Relay 直接 `herdr agent attach` 手敲——那么 Relay 侧的「人处理了 Attention」这件事就没有事件、没有 Receipt、不可复盘。
- 对照 design/06 H5：「需要人类输入时安全暂停并留下持久 Attention」——暂停做到了，「留下」也做到了，但**处理完继续**这半程没有闭环。
- 建议：本卡不加 RPC 的边界是对的，但至少要在 findings 里把「Attention 出口未接线，DHR_34/35 需要一条控制通道」登记出来并挂阶段闸。现在 findings 里一个字都没有。

**R-6 · 完成条件③（H1 / P6-M5）零有效证据，DONE 段自评却把它计入「已有机器证」**（挂 E-3303）

- 事实链：
  - task_plan 步骤 8 明写「smoke 期间**先取证 DSH 未运行**（进程/服务查询输出摘要，按白名单脱敏）——这是完成条件 3（P6-M5）**唯一**的真实取证（预审 P2-14）」。progress 的 DONE 段只有标题括号里一句「（DSH 未运行）」，**没有任何进程/服务查询输出**。
  - CLI 侧的记录是：`relay list --json` 返回空 `run_list`；对**非 Run ID** 调 `status/inspect/events/focus` 得 `E_RUN_NOT_FOUND`。worker 自己诚实地写了「因此这不是 H1 的完整 Run 证据，也不伪称成功」——这句是对的。
  - 但同一段的完成条件自评写「②~④ 代码、定向单测和真实 adapter smoke 已有机器证」，把 ③ 括了进去，与前一行自相矛盾。
  - 自动化侧也补不上：`relay focus` **没有任何 CLI 层测试**（本次 diff 没碰 `test/cli.test.mjs`），只有 `renderFocus` 的纯函数断言。
- 影响：③ 是 P6 阶段闸 P6-M5 的两张承接卡之一，现在既无真实证据也无端到端测试，却在自评里被计为已达成。这是本次交付里唯一一处**自评强于事实**的地方，需求侧必须点掉。
- 建议：补一次真实取证——起一个真 Run（fake herdr 注入即可，H1 要证的是「DSH 不在时 CLI 能查能附着」，不要求真产品 Agent），逐字贴 `status/inspect/events/focus` 四条命令与输出；DSH 未运行的进程查询输出一并贴上。

### P2

**R-7 · E-3301 登记的「fixture 冻结」半句没有对应交付物**（挂 E-3301）

- 事实：brief 交付物 7 = 「Headless(Linux) 场景桩剧本（非 manifest 冻结件，落 `test/helpers/`）+「待真实 smoke」备注」；task_plan 步骤 8 末条 = 「在 `test/helpers/` 放 SSH 断连语义桩（观测不中断），测试标注『Linux 真实 SSH 证据延后（B-22①），桩不冒充』」。交付后 `test/helpers/` 只有 `concurrent-issue.mjs`（存量）、`settled-state.mjs`（存量）、`fake-herdr.mjs`（本卡新增，平台无关、无 SSH 语义、无任何延后标注）。
- 判断：**延后本身合规**——授权链（B-22① + DevPlan §4.3 的 P6-M6 例外条款 + review.md 人类签名区留了「P6-M6 延后受理」勾）齐全，progress 与 review.md 都记「延后」不记「达成」，也确实没有拿任何 fixture 去冒充真实 SSH 证据。**但 E-3301 行的证明方式写的是「fixture 冻结 + 待真实 smoke 备注，无冒充」，其中「fixture 冻结」这项本卡义务未履行**，登记文字比事实宽。
- 影响：阶段闸上用户看到的是「已冻结 fixture，只差真实 smoke」，实际是「什么都没冻结」。DHR_35 补 SSH smoke 时没有既定桩剧本可对照，行为等价性无从判断。
- 建议：要么补桩剧本，要么把 E-3301 行改写成「本卡仅登记延后，未产出 Headless 桩；桩剧本随 DHR_35 真实 smoke 一并建立」——两条路都行，但登记必须与事实对齐。

**R-8 · preflight 三条判据只交了一条**（挂 E-3304 / DevPlan §3.2 实施提示）

- 事实：DevPlan DHR_33 实施提示要求「复用 evidence/03 的 preflight 判据（handle 1:1、visible/interactive、有界退出）」，task_plan 步骤 8 把它拆成三条并要求逐条贴 progress。progress 的 DONE 段只给了 ①handle 1:1（agent / pane / terminal 三个 id 逐字，这条扎实）；②pane 可见且可交互——无记录；③stop 后有界退出（含退出耗时）——只写「stop 成功」，**无耗时**。
- 影响：`design/03` H8 明写 herdr 无退出事件、「列表缺席 ≠ 退出，须列表消失 ∧ 进程消失才算 exited」（DHR_03 F-022 的教训），有界退出耗时正是这条教训的量化落点；缺了它，`stop` 的 `E_EXECUTOR_KILLED` 到底多久收敛没人知道，DHR_35 的 stop 路径要重测。
- 建议：真实 smoke 补跑一次，只贴两个数（可交互的一次按键回显 + stop 到 pane 消失的耗时），成本极低。

**R-9 · `relay focus` 在 blocked 时给不出当前 Attention，只能给过期观测**（挂 E-3303 / E-3304）

- 事实：`runFocus` 只收集 `frame.params?.kind === 'host_observation_changed'` 且 node 匹配的事件，取 seq 最大的一条。而 driver 的 blocked 分支只在**进入** blocked 时发一条 `human_input_requested`，此后每个 poll 什么事件都不发。于是节点处于 waiting_human 期间，`focus` 拿到的是**进入 blocked 之前**的那条观测（herdr_status=working/idle），或者干脆「无宿主观测」。
- 对照 P6-M5 逐字口径：「DSH 关闭时，CLI 能显示状态、**Attention** 和正确 Herdr host_ref」。host_ref 拿得到（agent_name 在 `executor_ref`，attach 模板能拼），状态与 Attention 拿到的是陈旧值。
- 说明：`human_input_requested` 事件本身是带 `executor_ref` 与 k=v detail 的（driver 那条发得很完整），focus 少收它属于过滤器写窄了，不是契约限制。
- 建议：focus 的过滤器把 `human_input_requested` 一并纳入取最近一条（`renderFocus` 的字段逐字规则不受影响，两类事件的字段集一致）。

**R-10 · 假宿主是内存对象注入，herdr-cli.mjs 整层零自动化覆盖**

- 事实：task_plan 步骤 6 要求「生成一个**临时可执行桩**（.mjs + 包一层 .cmd，或直接 node 脚本路径注入 `herdrBin`）……**桩状态落临时文件，杜绝内存态依赖**」。交付的 `fake-herdr.mjs` 是一个返回内存闭包对象的工厂，直接顶掉整个 `cli` 对象。
- 结果：`herdr-cli.mjs` 的全部实际风险面——`spawnSync` 参数装配（`pane split --current --no-focus --direction --cwd`、`agent start <name> --kind --pane -- args`）、`{ id, result, type }` 信封拆包、超时/signal/非零退出三种失败分支、`json:false` 的 `agentRead` 特例——**没有任何自动化测试碰过**。唯一的验证是一次真实 smoke，而那次只走了 4 个动词（`agentSendKeys`、`paneGet` 未覆盖，`paneGet` 恰恰是 host_lost 判定的关键一票）。
- 影响：herdr CLI 一旦改参数名或输出信封，测试全绿而线上全崩；DHR_35 会在真实闭环里首次撞见。
- 建议：至少补一个 node 脚本桩注入 `herdrBin`，把 6 个动词的参数序列与信封解析各钉一次。

**R-11 · 观测断超阈值的 Attention 脱离冻结的 detail 编码，人拿到它无法附着**

- 事实：brief 裁决 3 把 detail 编码冻结为 `herdr_status=…;agent=…;pane=…;seq=…;work_dir_root=…` 且键序固定。driver 的超阈值 Attention 写的是 `detail: 'observation_lost'` 裸串，绕过了 `observationDetail()`。
- 影响：这条 Attention 不带 agent / pane / work_dir_root——而它恰恰是「观测断了 60 秒，请人去看一眼」的那条，是最需要附着信息的一条。配合 R-9（focus 不收 `human_input_requested`），人从 CLI 侧拿不到任何指向。
- 建议：改用 `observationDetail({ herdrStatus:'observation_lost', … })`，键序不变即不破冻结。

### P3

**R-12 · smoke 记录里 `focus` 的调用形态与实现对不上，且无逐字命令输出**

- `POSITIONAL_COUNTS.focus = 2`（run_id + node_id）。progress 写「对本 smoke 的**非 Run ID** 调 `status/inspect/events/focus` 均稳定返回 `E_RUN_NOT_FOUND`」——若 focus 只给一个 positional，走的是 `UsageError` 退出码 1，不会是 `E_RUN_NOT_FOUND`。记录没贴逐字命令，无法判断是漏写了 node_id 还是记述取了平均。
- P6 §3.3 要求「`dh dh-relay` 与证据命令可复跑」，本条打折。建议 smoke 复跑时逐字贴命令行。

**R-13 · `work_dir_root` 由 driver 硬写 `repoRoot`，无 run/node 级接缝**

- Oracle 差异①「由本卡 Adapter launch 决定并登记」形式上兑现（adapter 必填校验 + 进句柄 + 进 detail，这部分做得干净），但 driver 传的恒是 `repoRoot`，run 文档与节点都无处指定。DHR_35 的验收口径明写要用「临时仓或用户批准的低风险真实卡」，届时需要改 driver 而不是改数据。
- 建议：登记一句「work_dir_root 目前恒等于 repoRoot，DHR_35 需要 run/node 级来源」即可，不必本卡改。

**R-14 · attach 指令模板两处各写一份，不同源**

- `herdr-executor.attachHerdrAgent()` 拼 `herdr agent attach ${handle.agent_name}`；`render.mjs.renderFocus()` 又独立拼了一遍 `herdr agent attach ${dash(event.executor_ref)}`。两处将来会漂移，而 `attachHerdrAgent` 目前无调用方（见 R-5），实际生效的是 render 那份。
- 说明：render 那份**不违反** `render.mjs:3-5` 硬规则（固定模板 + 逐字插入既有字段，无字符串拆解），brief 裁决 4 这条守住了。仅是重复实现的维护隐患。

**R-15 · 候选-39 的用例总数增量对比未做**

- task_plan 步骤 6 要求「完成后对比用例总数增量确认新测试真被拾取」。progress 只报了绝对值「200 tests」，没有基线差。实际新增 5 个 test（herdr-adapter 4 + agent-node 1），`package.json` 的 token 确实加了，结论应该成立，但取证方式与要求不符。

**R-16 · 状态映射表把 idle/done/unknown 折叠成同构条目，并混入非 herdr 状态键**

- `HERDR_STATUS_MAPPING` 里 `done` / `idle` / `unknown` / `observation_lost` 四个键的值完全相同（`{status:'running', event:'host_observation_changed'}`），其中 `observation_lost` 并不是 herdr 的 `agent_status` 取值，而是 Relay 侧的观测语义，混在同一张「Herdr 状态 → Relay 状态」表里会误导读者。
- 更实质的是：DevPlan §2.3 写的是「`idle` → **结合阶段与 result 对账**」，表里退化成与 done 同构、由 driver 的 else 分支一并处理。配合 R-2（判定器未接线），「结合 result 对账」这件事在交付里没有发生。
- 建议：表里把 Relay 侧观测语义与 herdr 状态分开；idle 的对账口径要么实现要么登记为 DHR_35 承接。

---

## 三、需求侧总评（供主控裁决用，非结论）

- **对准了的部分**（不打折）：落位与形状（纯函数 + 句柄、不碰 Store）、契约零变更（contracts/fixtures/profiles 三处 diff 为空已取证）、reason code 分界（HOST_LOST 而非 pi 专属的 ADAPTER_LOST）、`work_dir_root` 必填与登记、profile ref 逐字承载 `executor_profile_id` 的桥、focus 走 subscribe 而非直读 events.jsonl、`renderFocus` 的逐字规则、capability 基线经工具再生成且 CANONICALIZATION 过时项已记 F-2、以及 progress 对 `npm test` 6 例失败不伪称全绿的态度。这些都扎实。
- **对偏了的部分**：本卡的重心落在了「把 Adapter 的形状做对」，而完成条件②③④要的是「**把 H5/H1 的命题证出来**」。八个动词有七个能跑通（`reconcile` 的 host_lost 判定只在双亡时成立），但**证明链是空的**——三个 E-33xx 的覆盖态都还是「待」，而 DONE 段已按「②~④ 已有机器证」自评。
- **下游风险排序**：R-2（无成功终态）> R-4（身份链无落点）> R-5（Attention 无出口）> R-3（快路缺席 + seq 不去重）。这四条只要有一条不处理，DHR_34/35 开工就得回头动本卡的冻结口径（尤其 detail 编码），而冻结口径是要走契约变更的。**建议在本卡收口前，至少把这四条写进 findings 并挂到 DevPlan 的 DHR_34/35 依赖备注**——现在 findings 里一条都没有，下游卡看不到。

---

REVIEW-DONE 共16条（P1×6 / P2×5 / P3×5）
