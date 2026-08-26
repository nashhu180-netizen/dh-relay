<!-- dh:v1 -->
<!-- dh:planning-event:v1 id=DHR-A-15 stage=A-full artifact=design/09-三Agent可交互终端与CLI优先编排-产品设计与验收.md review=evidence/12-三Agent终端编排正式设计-交叉审核记录.md#review-a15 understanding=evidence/12-三Agent终端编排正式设计-交叉审核记录.md#understanding-a15 -->
# 三 Agent 可交互终端与 CLI 优先编排：产品设计与验收

> 状态：正式设计输入。2026-08-26 已完成独立复核和用户整版确认，并在同一晋升批次进入 `design/README.md` 的拆计划依据；本次不授权 B-adjust、任何开发卡开工，也不改变 DHR_30 的状态、范围或工作区。
>
> 用户方向：2026-08-25～2026-08-26。近期产品以三个用户可见、可交互的 Agent 终端完成编排闭环；Runner 是编排 Agent 调用的确定性程序，不是第四个 Agent；Agent 间按逻辑角色自由交流，复核路径可分别绑定 Agent/Profile，repo-local Relay 根改为可见且可治理的 `dh_relay/`；本地应用、DSH 工作台和多控制面建设延后。
>
> 来源：[CLI 优先编排与节点级双 Agent 监控方向评估](../evidence/11-CLI优先编排与节点级双Agent监控-方向评估报告.md)。本文按后续对话澄清，修正其中“Monitor 验收 Worker”“Monitor 提交 accept”“Runner 是独立角色终端”等容易误解的表述。

## 1. 设计结论

dh-relay 的近期产品形态冻结为“三个可交互 Agent 终端 + 一个确定性 Runner 程序”：

```text
用户
  ├─ 编排 Agent 终端            长期、跨节点、默认控制入口
  │      └─ 调用 dh CLI
  │             └─ Runner       确定性程序；不是 Agent、没有第四个 Agent 终端
  │                    ├─ 启动/观察/回收当前节点 Monitor
  │                    ├─ 启动/观察/回收当前节点 Executor
  │                    └─ 按逻辑角色路由 Agent 间消息
  ├─ Monitor Agent 终端         当前节点临时监工，可直接交互
  └─ Executor Agent 终端        当前节点实际执行者，可直接交互
```

这里有四个软件职责，但只有三个 Agent、三个用户可交互终端：

1. **编排 Agent**：理解用户目标、选择已批准计划、调用 CLI、解释状态、处理跨节点判断和默认诊断。
2. **Monitor Agent**：监督当前节点是否按既有 brief 推进，识别停滞、显性跑偏和交付缺口，发送有限提醒，形成结构化监工意见。
3. **Executor Agent**：执行当前节点的业务工作。它在施工节点是施工者，在 `dedicated_pair` 复核节点是独立复核者，在诊断节点是诊断者。
4. **Runner**：校验命令、持久化事实、维护状态机、幂等启动、事件落账、精确回收、崩溃恢复，并通过确定性 Message Router 为三个 Agent做逻辑角色寻址和受控消息投递。它是程序，不推理业务内容，不拥有用户会话。

关键边界是：

> Runner 在产品使用上“嵌入”编排 Agent，表现为它调用的一组 CLI 工具；在工程生命周期上不能嵌入编排 Agent 进程，必须能以独立、可恢复的后台 Runtime 继续管理当前节点。

因此，关闭一个**终端视图**不等于对应 Agent 已退出；重新 attach 即可。非人为故障更可能发生在 Herdr/终端宿主或机器层，造成三个 Agent 共同失联，而不是只掉编排 Agent。无论是单 Agent 丢失还是三者共同丢失，Runner都不得把终端消失解释成业务完成，也不会擅自启动下一节点。

## 2. 目标、非目标与成功定义

### 2.1 产品目标

1. 用户可以同时看见并按需进入三个职责明确的交互终端。
2. 编排 Agent 通过自然语言降低 CLI 使用门槛，但运行事实不依赖其聊天记忆。
3. 每个业务节点由一个 Executor 工作、一个 Monitor 监工；两者上下文和权限分离。
4. Monitor 能提高发现停滞、显性跑偏和漏交付的速度，又不重复正式代码复核。
5. 当前节点完成后，两条节点终端被精确收口；编排 Agent在线时，按已批准计划推进下一节点。
6. 单 Agent 异常、宿主共同故障或 Runtime 重启后，都能从持久事实判断“发生过什么、现在能做什么、是否允许继续”；终端视图断开和用户明确停止不会被误判为故障。
7. 三个 Agent可以按 `orchestrator/monitor/executor` 逻辑角色主动交流，不需要知道 Herdr Pane ID；普通交流不进入业务事件账，产生正式执行影响时仍回到 Plan/Brief/Attention/Approval 合同。
8. RelayPlan 源文件、Run 归档和高频运行现场集中在可见的 `dh_relay/` 根下，并通过子目录明确区分 Git tracked 与 ignored 内容。

### 2.2 本阶段非目标

- 不建设本地 GUI、DSH Bridge 或通用多控制面产品。
- 不让 Monitor 成为第二个施工者、第二份运行真相或免费复用的正式复核者。
- 不引入常驻“诊断 Agent”作为第四个 Agent 角色。
- 不允许 Runner 推理代码质量、替用户作业务判断或自行修改批准计划。
- 不让 Agent 绕过 Message Router 直接向别的 Pane 注入输入，也不把 Agent 间普通聊天变成持久业务日志。
- 不做多节点并行、跨机器调度、通用 DAG 编辑器和自动账号切换。
- 不在本次 A-full 设计事件中调整 P4～P9 DevPlan、DHR_30 状态或启动新任务卡；正式设计确认后另走 B-adjust。

### 2.3 业务成功定义

“产品闭环成功”不是三个终端都显示 `done`，而是：

1. Runner 能证明当前身份、Attempt、事件和工件属于同一个节点代次；
2. Executor 提交了节点合同要求的结构化结果；
3. Monitor 完成了节点级监工检查并提交结构化意见；
4. Runner 通过确定性校验，生成 Handoff 并精确回收节点 Pair；
5. 需要独立复核、用户验收或 verify 的后续节点仍按计划存在，没有被 Monitor 越权替代；
6. 编排 Agent依据已批准计划决定继续、诊断、重试、重排或请求用户。

## 3. 四个职责的精确定义

### 3.1 编排 Agent：长期会话与默认诊断者

编排 Agent 是用户的默认控制入口，可以跨多个节点长期存在。它负责：

- 接收用户自然语言，读取当前项目、已批准计划、Run 摘要、Handoff 和 Attention；
- 作为 RelayPlan 的业务负责人，解释、维护、修订和重排接力计划，并据当前有效版本生成节点 Contract Brief；
- 调用 `dh run start/continue/stop/status` 等 CLI，不直接写 Store 或操作 Herdr Pane；
- 向用户解释当前处于哪一节点、Monitor 与 Executor 分别在做什么；
- 在当前节点收口后，判断已批准计划是否允许进入下一节点；
- 处理 Worker/Monitor 丢失、结果冲突、重试建议和跨节点影响；
- 承担默认的异常诊断，必要时提出建立显式诊断节点；
- 对新计划、重排、高权限动作、业务取舍和用户验收发起明确询问。

编排 Agent 不是运行真相。它重启后必须从 Runner Read Model、事件账和 Handoff 恢复，不能以“我记得已经完成”作为依据。

### 3.2 Runner：编排 Agent 的确定性 CLI 工具

Runner 是非 Agent 程序，并且是产品语义上的 Run 状态唯一写者。这里的“Runner”是用户看到的确定性执行层总称；工程实现分成 DHR_30 Runtime Broker 与后续 Workflow Engine，不能把二者误写成两个并发写者。

| 工程层 | 当前/后续归属 | 唯一所有权 | 明确不做 |
|---|---|---|---|
| Runtime Broker / `HostSessionActor` | DHR_30 的 07/08 合同 | endpoint、lease、Store I/O 串行化、operation ledger、基础 RPC/Read Model；它是物理 Store 写者 | 不理解 workflow、Node、Pair、Monitor、Executor，不在 DHR_30 卡内增加这些能力 |
| Workflow Engine | DHR_31 或 B-adjust 后的新卡 | Resolved Plan、Node/Pair/Attempt 状态转换、业务事件合法性、下一步 Ready；它是业务转换的唯一裁决者 | 不直接打开 Store 写句柄；只向本 Run 的 actor 提交待持久化命令 |
| Launcher/Host Adapter | 后续 Launcher/Pair 卡 | 按 Receipt 启动、probe、attach、stop 精确 Agent/Pane，调用 Herdr `agent prompt` 等受控输入面，并回传 Host Observation | 不改业务状态、不解释 Result；不允许 Agent 直接取得任意 Pane 输入能力 |
| Message Router | 后续三终端通信卡；由 Workflow Engine 做身份/策略，Host Adapter 做实际投递 | 把逻辑角色解析为当前 generation 的精确 Agent；维护有界内存队列、送达状态和回复关联 | 不是 Agent、不解释内容、不形成第二份 Run Store、不让普通消息产生业务授权 |
| 编排 Agent | 后续三终端卡 | 业务意图、解释和诊断，经 CLI 提交请求 | 不直写 Store，不持 lease，不绕过 Workflow Engine |

因此，“唯一写者”有两个不冲突的层次：`HostSessionActor` 是唯一执行落盘的物理写者；Workflow Engine 是唯一有权产生业务状态转换命令的逻辑写者。CLI、Agent 和 Launcher 都不能成为第三个写者。Workflow Engine 作为 actor 的后续消费者/组件接入，DHR_30 当前任务仍按已确认边界完成，不为本文返工。

Runner 产品层负责：

- 校验 Authority、Resolved Plan、generation、node、Attempt、Pair 和 Receipt；
- 在调用 Launcher 前持久化操作意图与 Receipt；
- 幂等启动 Monitor/Executor，拒绝重复 Pair 和迟到控制；
- 校验 checkpoint、result、monitor report 与 Handoff 的 Schema 和身份链；
- 将 Host 观察与业务完成分离，禁止把 `done`、Pane 退出或 CLI 成功投影成业务成功；
- 精确停止当前 Pair，并对孤儿 Agent/Pane 做代次绑定的对账；
- 为三个 Agent提供按逻辑角色寻址的受控消息投递；目标工作中先排队，目标 blocked/离线时明确返回未送达，不静默注入；
- 在单 Agent 丢失、宿主共同故障或 Runtime 重启时对账当前节点，持久保存下一步 Ready/Attention；
- 向三个终端提供同一 Read Model，不让任何 Agent 私自解释事件账形成第二份状态。

Runner 产品层不负责：

- 判断实现方案优劣、代码是否真正正确或业务目标是否合理；
- 根据终端聊天文本直接扩大范围、批准权限或改变计划；
- 把 Agent 普通消息写成业务事件、从消息内容推导授权，或在没有最终 Plan/Brief/Attention/Approval 的情况下改变执行；
- 把 Monitor 意见当作正式独立复核；
- 在编排 Agent 不可用或共同故障恢复期间擅自跨节点自动推进。

### 3.3 Monitor Agent：节点监工，不是独立复核者

Monitor 与当前节点同生共灭。它读取 Monitor Brief，其中只包含监督当前节点所需的信息。它关注四类问题：

1. **进度**：是否长时间无有效 checkpoint、是否卡在重复动作、是否明确 blocked 却未落信号。
2. **显性跑偏**：修改路径超出 allowlist、跳过 brief 明列步骤、开始做下一节点、遗漏必需测试或证据。
3. **交付完整性**：Result、测试摘要、变更路径、证据引用和未决风险是否齐全且相互一致。
4. **生命周期异常**：Executor 失联、身份不匹配、结果迟到、终端停止但无 Result、Pair 中只剩一方。

Monitor 可以读取：

- 当前节点 brief、acceptance criteria 和上一步 Handoff；
- Runner Read Model、事件和当前 Attention；
- Executor checkpoint、结构化 Result、测试摘要、变更路径；
- 有界终端尾部、Git diff 摘要，以及为核对某项显性偏离所需的有限 diff 片段。

Monitor 可以执行：

- 写 `monitor.observation`；
- 基于既有 brief 向 Executor 发送有限、具体、可执行的提醒；
- 请求 Executor 补 checkpoint、Result 字段或既有验收证据；
- 发现 brief/RelayPlan 本身可能有误时，向编排 Agent提交带事实依据的修订建议；修订待决期间不把受影响部分继续判作 Executor 跑偏；
- 提交 `continue_working`、`handoff_ready`、`retry_recommended`、`needs_orchestrator`、`needs_user`；
- 在 Executor 丢失时提交现象、最后有效进度和建议恢复点。

Monitor 禁止：

- 修改业务代码、测试、设计、计划、workspace 工件或 Run 状态；
- 重新设计方案、扩大任务范围或替 Executor 完成工作；
- 直接启动、停止、重启 Agent 或创建下一节点；
- 代答用户决策、权限确认、Approval 或人类验收；
- 使用 `accept/reject` 宣称实现质量已获独立验收；
- 把自己的检查计入“换 Agent 独立复核”。

#### Monitor 为什么能指出“做错了”

Monitor 只对**既有合同可直接证明的偏差**负责，不承担开放式质量审查：

| 观察 | Monitor 是否应管 | 原因 |
|---|---|---|
| brief 只允许改 `tools/`，Executor 改了 `docs/` | 应管 | allowlist 可机械对照 |
| brief 要求先写失败测试，Executor 直接宣称完成 | 应管 | 明列步骤和证据缺失 |
| 测试摘要显示失败，却提交成功 Result | 应管 | 结构化证据自相矛盾 |
| 实现用了另一种算法，但范围和验收都满足 | 不自行判错 | 需要业务/技术复核判断 |
| 代码存在隐蔽并发缺陷或安全漏洞 | 不假装已发现完 | 属于独立复核或专项审查 |
| 计划本身可能设计错了 | 上报编排 Agent | Monitor 无权改计划 |

所以，Monitor 可以为了核对某个已知标准查看有限代码或 diff，但不会从头重做一次全面代码审查。它不确定时输出 `needs_orchestrator` 或建议进入正式复核/诊断节点，而不是自行下结论。

### 3.4 Executor Agent：节点主控与唯一业务执行者

Executor 不是机械服从 brief 的低权限子 Agent，而是当前节点的主控 Worker。它拥有本节点业务 Attempt，负责理解目标、选择实现路径、发现 brief 问题并把工作推进到可交接状态。

Executor 获得自包含 Executor Brief：

```text
目标与非目标
允许范围和工作目录
节点类型与具体步骤
机器验收与人验项
上一步 Handoff
checkpoint / result 合同
需要用户或编排判断时的升级方式
```

Brief 分成两类内容：

| Brief 内容 | 例子 | 修改权 |
|---|---|---|
| 节点合同字段 | 目标、非目标、allowlist、验收、依赖、权限、Profile、输出合同 | 编排 Agent管控；Executor/Monitor 可发现问题并起草修订，不能单方让修改生效 |
| 节点工作字段 | 实现方法、施工子步骤、局部顺序、技术取舍、调查记录 | Executor 自主维护；不需要编排 Agent逐项批准 |

Executor 认为节点合同字段写错时，应主动把问题、影响和候选改法带给编排 Agent。编排 Agent在既有授权内可以直接修正并发布新 brief；若改变用户已批准的目标、范围、验收、权限或节点结构，则由编排 Agent带着上下文向用户确认。用户无需切换终端重新复述。

Executor 的角色由节点类型决定。下表中的复核行描述 `dedicated_pair` 执行模式；`inline_registration` 不启动新的节点 Pair，见下文：

| 节点类型 / `review_path_id` | Executor 做什么 | Monitor 做什么 |
|---|---|---|
| 施工批次 | 改代码/文档、跑测试、交 Result | 监进度、显性跑偏、交付完整性 |
| `code_round_1` | fresh-context 只读复核当前施工批次；多批施工时可以重复出现 | 监独立身份、批次范围、报告落账；不计入代码复核 |
| `code_round_2` | 另一个 fresh Agent 核全程、已落账轮1结论和收口增量；不得继承轮1会话上下文 | 监实例隔离、输入引用和报告完整性；不计入代码复核 |
| `requirement_direction` | 对回 brief、正式设计输入、验收清单和需求境证据，查范围漂移与结果失真 | 监输入是否覆盖、结论是否单独登记 |
| `consistency_review` | 横向搜索同类实现，给出比对清单，并逐条裁决有意差异或遗漏 | 监比对清单非空、发现均有裁决和落点 |
| `lessons` | 按触发场景扫描在册教训，深读命中项并判断是否重蹈；库空时给出可核查 N/A | 监库状态、命中项和跳过依据完整 |
| 验证节点 | 运行规定测试/场景并记录证据；有效单测是附加验证要求，不冒充第六条复核路 | 监证据和结果合同完整性 |
| 诊断节点 | 对明确异常做深入调查 | 监诊断范围、证据和停止条件 |

复核路径和复核 Agent不是同一件事。Adapter 必须同时冻结四层信息：

1. **Review Recipe** 决定哪些路径属于本任务类型的必做集合。dev-harness Adapter 按当前 `task_type` 和 registry 解析，Runner不把 dev-harness 规则硬编码进内核。
2. **Applicability** 决定一条必做路径在本 Run 是否实际适用。比如 `lessons.notApplicableWhen=lessons-absent`：Adapter 在 Resolved Plan 中冻结教训库状态/摘要和 `not_applicable` 理由，该路径不启动、不要求 Binding，但仍留下可核查的 N/A 解析结果；不能把“没有 Binding”冒充 N/A。
3. **Execution Mode** 决定适用路径如何执行：`dedicated_pair` 使用独立复核节点的 Executor+Monitor；`inline_registration` 由编排 Agent在现有会话完成上游规定的结构化字段并单独落结论，不拉新 Pair。Binding 不能暗中改变执行模式；把上游要求独立/fresh 的路径降成 inline 禁止，把 inline 升为 dedicated 需要在本 Run 计划中显式选择。
4. **Reviewer Binding** 只决定 `dedicated_pair` 由哪个 Executor Profile 执行。项目可为每个 `review_path_id` 提供默认绑定，编排 Agent可在用户授权范围内为本 Run覆盖；计划只保存安全的 `profile_id`，不保存账号凭据或任意启动参数。`inline_registration` 可以保留备用 Profile 配置，但未升级执行模式时不消费它。

适用的 `dedicated_pair` 缺合法 Profile、只读能力或身份隔离条件时，Run在启动该节点前 fail-closed；修改 Binding 或 Mode 都不能把必做且适用的路径从 Recipe 中删除。POC 不做多节点并行：多个 dedicated 路径按依赖串行展开；inline 路径也逐项登记，不能把多个 verdict 合成一句“都看过”。这只影响执行形态和时长，不改变必做集合及各自结论。

当前 dev-harness 配方作为首个 Adapter 验证样例：

| `task_type` | Resolved Review Recipe | 当前 dev-harness Adapter 默认执行形态 | 附加要求 |
|---|---|---|---|
| `heavy` 重核 | `code_round_1`、`code_round_2`、`requirement_direction`、`lessons`、`consistency_review` | 五路均 `dedicated_pair`；`lessons-absent` 时该路 N/A | 有效单测；变异点由轮2复核实例选 |
| `normal` 常规 | `code_round_1`、`requirement_direction`、`lessons` | 三路均 `inline_registration`，保留上游“主控自核/会话内结构化登记”；`lessons-absent` 时该路 N/A。用户可逐路升级为 `dedicated_pair` | 有效单测 |
| `light` 轻量 | `lessons`、`consistency_review` | 默认 `inline_registration`；`lessons-absent` 时教训路 N/A。用户可逐路升级为 `dedicated_pair` | 无代码复核轮次 |

推荐绑定形态如下；字段名是产品合同候选，不代表现役 CLI 已实现：

```yaml
reviewer_bindings:
  code_round_1: codex-code-review
  code_round_2: claude-code-review
  requirement_direction: codex-requirement-review
  consistency_review: codex-consistency-review
  lessons: claude-lessons-review
```

若当前类型默认是 inline，用户希望某一路改由专用 Agent执行，还要在计划中显式把该路 `execution_mode` 升为 `dedicated_pair`；仅填 `reviewer_bindings` 不会自动加节点、加成本或改变现行 dev-harness 配方。

每个 `dedicated_pair` 复核节点仍只拉起一个 Executor 和一个 Monitor。复核 Executor 才是该路径的 reviewer；旁边的 Monitor始终只是监工，不形成额外复核证据，也不会增加常驻 Agent 终端。`inline_registration` 没有该路径的 Monitor，也不得借用别的节点 Monitor 充当复核证据。

## 4. 三个终端都可交互，但交互含义不同

用户可以看见、attach 并直接与三个 Agent自由交谈；系统不得把 Monitor/Executor 隐藏成不可进入的后台黑盒，也不得把 Runner 变成逐句聊天记录器。

### 4.1 统一规则

1. 三个终端中的普通聊天、状态询问和解释请求不进入 Run Store，不产生事件，也不要求每句话更新状态。
2. 当前 Agent在有效 RelayPlan 和 brief 范围内自主判断。实现方案、技术取舍和局部施工顺序由 Executor负责；有价值的理由按需写进 checkpoint/result，而不是另造聊天记录。
3. Executor可以自主修改节点工作字段，也可以发现并起草节点合同字段修订；Monitor也可以提出 brief/RelayPlan 的问题。
4. 三个 Agent之间的主动联系都经 Message Router，发送方只使用 `orchestrator/monitor/executor` 逻辑角色；Agent Profile 不开放任意 Herdr `agent prompt`、Pane ID 枚举或原始 `send-keys` 权限。
5. 任何涉及 RelayPlan 或节点合同字段的变化，都由发现问题的 Agent通过 Router主动联系编排 Agent，并把问题、影响、证据和候选改法一起带过去。
6. 编排 Agent负责与 Executor/Monitor 协商、判断影响并发布新的有效 RelayPlan/brief。只在变化触及用户已批准的目标、范围、验收、权限、节点结构或高权限动作时，才主动找用户讨论并取得确认。
7. 用户在任意终端提出计划变化时，不需要自己切换终端重说。编排 Agent终端应出现带完整上下文的可见消息，例如：“Executor 提议修改当前节点，这会影响后续两个节点；我建议……我们确认一下？”
8. Router 注入目标终端的消息必须清楚标识来源角色、Run/Node/Pair 和“这是 Agent 协作消息，不是用户授权”；目标 Agent不能把它当成人类 Approval 或验收。
9. 只有在 **Monitor/Executor 仍在线而编排 Agent 单独意外退出**时，发现者才创建一个持久 `plan_change_request` Attention，只保存问题、影响、证据、候选改法和目标 generation，供编排 Agent恢复后接手；它不是聊天记录，也不让候选方案自动生效。三 Agent 共同失联时没有在线发现者，恢复只能依据故障前已持久化的 checkpoint、Attention 和业务工件。
10. 只有最终生效的 RelayPlan/brief 版本、权限决定、Attention/Approval、人类验收，以及上述单实例故障接力请求进入 Run Store；讨论过程、普通 Agent 间消息、投递状态和在线协商中的未生效候选不进入业务事件账。
11. Runner只执行当前有效版本；三个终端显示的 Run/Node/Attempt、RelayPlan generation 和 brief version 均来自同一 Runner Read Model。

### 4.2 RelayPlan 的管控关系

编排 Agent管理 RelayPlan 这一核心职责没有变化。四方关系固定为：

| 角色 | 对 RelayPlan/brief 的责任 |
|---|---|
| 编排 Agent | RelayPlan 的业务负责人：解释、维护、修订、重排、生成 Contract Brief，并发起必要的用户讨论 |
| Runner | 校验并持久化当前有效 generation，只执行有效版本，拒绝旧版本和重复启动；不做业务规划 |
| Executor | 当前节点主控：自主维护工作字段；发现合同问题时起草修订并主动与编排 Agent协商 |
| Monitor | 监督当前有效合同；发现计划或 brief 可能有误时提交观察，不拿有争议的旧条款继续判 Executor 跑偏 |
| 用户 | 只对目标、范围、验收、权限、重大重排和人类验收作最终决定 |

### 4.3 从任意终端发起计划变化的业务流程

```text
用户或 Agent 在 Monitor/Executor 终端发现计划问题
  -> 当前 Agent先判断它是节点内工作调整，还是合同/RelayPlan 变化
  -> 节点内工作调整：Executor 自主处理
  -> 合同/RelayPlan 变化：当前 Agent通过 Message Router 联系编排 Agent并携带完整上下文
  -> 仅编排 Agent意外退出、节点 Pair 仍在线：创建 plan_change_request Attention，受影响工作暂停，等待其恢复消费
  -> 编排 Agent与相关 Agent协商影响和候选改法
  -> 未越过既有用户授权：编排 Agent发布新版本
  -> 越过既有用户授权：编排 Agent带着结论主动找用户讨论
  -> 用户确认后发布新版本
  -> Runner原子切换 generation/brief version
  -> Monitor 与 Executor统一切到新版本继续
```

修订待决期间，Executor可以继续不受争议的工作；受影响部分暂停。Monitor继续观察进度和生命周期，但不依据正在争议的旧字段发跑偏结论。若编排 Agent判定原 brief 正确，则把理由和继续指令带回节点 Pair。`plan_change_request` 被接受、驳回或被新版本承接后必须结案，不能与已生效 generation 长期并存。

### 4.4 Message Router：自由交流的可靠底座

Herdr 已提供精确定向的 Agent prompt 和 `idle/working/blocked` 观测，但“能向 Pane 发文字”不等于“Agent 协作可靠”。Relay在其上增加确定性 Router：

```text
Agent 调用 dh agent tell --to <logical-role>
  -> Router 校验 sender / run / generation / node / pair / message budget
  -> 解析目标角色当前唯一 Agent 身份
  -> idle/done：Host Adapter 调用受控 Herdr agent prompt
  -> working：进入有 TTL 的内存队列，目标 settled 后再投递
  -> blocked/offline/身份歧义：不注入，返回 not_delivered
  -> 目标用 correlation_id 回复；发送方看到 accepted / delivered / replied
```

业务规则：

1. `accepted` 只表示 Router 接受请求；`delivered` 只表示当前目标 Agent终端已接受 prompt；只有目标按同一 `correlation_id` 回信才是 `replied`。三者都不代表业务同意。
2. 普通消息内容和投递状态只存在于当前 Host generation 的有界内存队列与终端会话，不进入 Run Store、不进入业务事件账；共同故障时允许丢弃，因为它们不是权威事实。
3. 不能丢的事项必须升级为现有结构化工件：节点进度写 checkpoint，交付写 Result/Monitor Report，计划问题在编排单实例离线时写 `plan_change_request` Attention，权限/验收写 Attention/Approval Receipt。
4. 每条消息绑定发送方和目标方当前身份；旧 generation、旧 Pair 或已替换 Agent 的迟到消息拒绝，不转送给新实例。
5. Router 对每个 topic 设 TTL、消息大小、往返次数和速率预算。预算耗尽时明确返回 `conversation_budget_exhausted`，相关 Agent改为提交 checkpoint、`needs_orchestrator` 或 Attention，不能无限互聊。
6. 用户直接进入任一终端聊天不经过 Agent-to-Agent Router；Router只承载 Agent主动联系另一个 Agent。普通用户聊天仍按 §4.1 不记业务账。
7. Router 在校验前生成一次不可变消息快照；身份、大小、内容校验和 Host 实际投递都使用同一快照，不能校验一个对象后再从可变输入重新拼装消息。

Message Router 是 Runner 产品层的通信子系统，不是第四个 Agent，也不拥有业务决策权。它的 Host 投递适配器可以使用 Herdr `agent prompt`，但 Agent自身不得直接调用该能力绕过身份、忙碌态和消息预算。

## 5. 真相、身份与权限模型

### 5.1 四层真相与可见 `dh_relay/` 根

| 真相层 | 权威来源 | Git | 说明 |
|---|---|---:|---|
| 业务与验收真相 | 业务仓 Git、DevPlan、workspace、review、verify | 是 | 目标、实现、复核、签收和是否完成 |
| Relay 计划源与归档 | `<repo>/dh_relay/plans/`、`<repo>/dh_relay/archive/` | 是 | 人可读、可评审的接力计划源文件和 settled Run 精选留档；不是运行中状态 |
| Relay 运行真相 | `<repo>/dh_relay/runtime/<run_id>/` | 否 | 已激活 Resolved Plan、Attempt、Pair、Receipt、事件、Attention、恢复；由 Runtime唯一写入 |
| 终端会话状态 | Herdr Workspace/Pane/Agent 与可重建投影 | 否 | 谁在线、终端尾部、可否 attach；可丢弃重建 |

仓内 Relay 内容统一放在不隐藏的普通目录：

```text
<repo>/dh_relay/
├─ README.md                 # tracked；目录说明与计划/归档索引
├─ plans/                    # tracked；RelayPlan 源文件、reviewer_bindings 等安全配置
├─ archive/                  # tracked；settled Run 精选工件，不含完整聊天/终端转录
└─ runtime/                  # ignored；每个 run_id 的高频运行现场
   └─ <run_id>/
      ├─ active/resolved plan snapshot
      ├─ attempts / pairs / receipts
      ├─ events / attention / approval
      └─ recovery / locks / host observation
```

硬边界：

1. `plans/` 中的文件只是可审查计划源。Git commit 改变它不会直接改变运行中的 Run；编排 Agent仍须提交新 proposal，Runner校验后原子激活新的 generation，并把 Resolved Plan 快照写入 `runtime/<run_id>/`。
2. `archive/` 只保存 settled Run 的精选 Handoff、Result/Report 摘要、最终 Plan 摘要和证据指针。完整事件账、Receipt、锁、PID、终端转录和普通 Agent 消息不进 Git。
3. 仓根 `.gitignore` 必须按 Git 语义忽略 `/dh_relay/runtime/`，但不能忽略整个 `/dh_relay/`；缺失、过宽或 `runtime/` 已被跟踪时，新路径 start fail-closed，Relay不自行修改业务仓 `.gitignore`。
4. 用户级 `~/.dh-relay/` 继续承载跨仓索引和 Profile registry，保持仓外、不进 Git；本次只改变 repo-local 根。
5. 现役 `<repo>/.dh-relay/<run_id>/` 和更早 `.dh-runtime/relay/` 不原地搬迁。迁移完成前 resolver 对旧根只做明确标记的 discovery/status/archive 读取；旧 Run按创建时合同处理，不把目录改名伪装成无损迁移。新根启用和 legacy resume 策略由后续迁移卡冻结。
6. `plans/` 由用户通过 Git 生命周期管理，Runner永不自动删除；`archive/` 是人工精选长期记录，本阶段显式选择不自动清理。`runtime/` 由 Runtime负责退场：Run 已终态、所需 archive/export Receipt 已完成且冻结保留期到期后，才可按精确 `run_id` 清理；操作内 staging/tmp 在原子提交或恢复裁决后清理。清理失败保留原目录并产生可见 `cleanup_failed` Attention，由后续重试处理，不能把失败伪装成已释放；验证探针必须位于待删目录之外。

`Herdr done`、Agent 进程退出、编排 Agent 说“完成了”、Monitor 说 `handoff_ready`，以及 Git 中某份 Plan 已更新，都不能单独改变业务完成事实或当前 Run generation。

### 5.2 身份链

每个节点至少冻结：

```text
run_id
plan_generation
node_id
review_recipe_digest / review_resolution_digest / review_path_id / execution_mode（复核工作项）
pair_id
executor_attempt_id
executor_receipt_id
monitor_instance_id
monitor_receipt_id
executor_profile_id
monitor_profile_id
```

Executor 拥有业务 Attempt；Monitor 是同一 Node/Pair 下的 sidecar 实例，不共享或冒充 `executor_attempt_id`。两者结果必须绑定当前 generation、node 和 pair；复核工作项还必须绑定 Review Recipe 与 applicability/mode 解析摘要、`review_path_id`。旧 Pair 的迟到 Result/Report 只记诊断事实，不得推进新 Pair。

### 5.3 工具权限

| 能力 | 编排 Agent | Monitor | Executor | Runner |
|---|---:|---:|---:|---:|
| 与用户自然语言交互 | 是 | 是 | 是 | 否 |
| 调用 Run 控制 CLI | 是 | 否 | 否 | 被调用方 |
| 经 Message Router 联系其他 Agent | 是 | 是，限当前 Pair | 是，限当前 Pair | 校验/路由；不解释内容 |
| 直接调用 Herdr prompt/send-keys | 否 | 否 | 否 | 仅 Host Adapter 可按 Router 命令调用 |
| 读取统一 Read Model | 是 | 是，限当前节点 | 是，限当前节点 | 生成 |
| 修改业务文件 | 否 | 否 | 按节点 allowlist | 否 |
| 修改节点工作字段 | 否 | 否，只观察 | 是 | 否 |
| 起草 RelayPlan/Contract Brief 修订 | 是 | 可提建议 | 可提建议并写候选 | 否 |
| 发布/激活 RelayPlan 或 Contract Brief | 提交业务修订 | 否 | 否 | 校验并原子切换有效版本 |
| 发有限节点提醒 | 否 | 是 | 接收 | 记录/投递 |
| 提交业务 Result | 否 | 否 | 是 | 校验/持久化 |
| 提交 Monitor Report | 否 | 是 | 否 | 校验/持久化 |
| 修改 Run 状态/启动回收 Agent | 否 | 否 | 否 | 唯一执行者 |
| 业务诊断与跨节点裁决 | 默认负责 | 只报局部现象 | 诊断节点内负责 | 否 |
| 代签用户决定/验收 | 否 | 否 | 否 | 否 |

## 6. 节点 Pair 生命周期

### 6.1 启动协议

本节只适用于施工、验证、诊断和 `dedicated_pair` 复核节点；`not_applicable` 路径不启动，`inline_registration` 由编排 Agent按 Resolved Plan逐项登记。编排 Agent调用 `dh run continue <run_id>` 后，Runner：

1. 校验当前 Run、批准计划、generation、Ready Node 和 Attention/Approval。
2. 如果是复核节点，校验该 Work Item 已解析为 `applicable + dedicated_pair`，`review_path_id` 确实存在于本 Run冻结的 Recipe，Reviewer Binding 指向已登记且具备该路径、只读和隔离能力的 Profile；代码轮2还必须与轮1使用不同 Agent 实例/会话。任一条件不满足都 fail-closed。
3. 创建 `pair_id`、Executor Attempt 和 Monitor Instance。
4. 冻结两个 Profile、两份 Brief 摘要、`review_recipe_digest/review_resolution_digest/review_path_id/execution_mode`（如适用）和幂等键。
5. 先落两份 Launch Receipt，再调用统一 Launcher。
6. 为用户创建两个可 attach 的交互终端，分别投递 Executor Brief 和 Monitor Brief。
7. 分别确认 `executor_ready` 与 `monitor_ready`，不得用一个 Ready 代替另一个。
8. 只有身份对账完成后，节点进入 `working`。

两个进程可以并行拉起，但状态提交、Receipt 和补偿动作必须确定性执行。

### 6.2 持久 Pair 状态与重放

Pair 由 Workflow Engine 裁决、由 DHR_30 actor 串行落账。最小状态机为：

```text
allocating
  -> launching
       -> working
            -> monitor_checking
                 -> handoff_ready
                      -> closing
                           -> closed

任一非终态 -> degraded -> recovery_pending
launching -> launch_failed
recovery_pending -> abandoned | launching/working（仅合法恢复边）
```

硬规则：

1. `closed`、`launch_failed`、`abandoned` 是 Pair 终态；终态 Pair 永不复活。
2. 每次 launch/stop/relaunch/abandon 都有持久补偿 Receipt；幂等键至少绑定 `(run_id, generation, node_id, pair_id, role, action, recovery_seq)`。
3. Executor launch 重试创建新 `pair_id` 和 fresh `executor_attempt_id`，并写 `fresh_attempt_from`；旧 Pair 进入 `launch_failed/abandoned`。
4. Monitor 重启可以留在同一 Pair，但创建新的 `monitor_instance_id` 和递增 `recovery_seq`；旧实例报告自动失效。
5. Executor lost 后，Runner 把 Pair 置 `recovery_pending`，允许当前 Monitor 只提交一次最后观察；随后精确关闭 Monitor、将 Pair 置 `abandoned`，再等编排 Agent决定是否创建 fresh Attempt。
6. 双丢失时由 Runner按 Receipt 和精确 Host ID 回收孤儿并置 `abandoned`；无法证明归属的会话不误杀，进入 Attention。
7. 所有报告、候选交付、Result 和关闭动作都绑定当前 Pair phase；crash/replay 只能重复返回既有 Receipt，不能重复创建会话或越过状态边。

### 6.3 只启动成功一方

| 情况 | 当前工作是否继续 | 补偿策略 | 能否最终 Handoff |
|---|---|---|---|
| Executor 启动失败，Monitor 成功 | 否 | 精确关闭 Monitor；同一操作按策略重试或交编排 Agent | 否 |
| Monitor 启动失败，Executor 成功 | Executor 可继续 | 保留 Executor，重启 Monitor；新 Monitor 从 Store/brief 恢复 | Monitor 有效前不能 Handoff |
| Monitor 中途丢失 | Executor 可继续 | Runner 重启 Monitor；旧 Monitor 迟到报告失效 | 新 Monitor 补齐报告后可以 |
| Executor 中途丢失 | 否，Pair 进入 `recovery_pending` | Monitor 提交一次最后进度和现象；Runner关闭 Monitor、废弃 Pair，编排 Agent诊断/决定 fresh Attempt | 否 |
| 两者都丢失 | 否 | Runner 对账 Receipt、Pane、checkpoint，回收可证明归属的孤儿并废弃 Pair；交编排 Agent决定恢复 | 否 |

Monitor 启动失败时不销毁已经工作的 Executor，是为了避免浪费有效施工；但也不能因为 Executor 已经交作业就绕过 Monitor。

### 6.4 工作期间与有限提醒

Monitor 默认事件驱动，触发源限定为：

```text
executor.checkpoint
executor.blocked
executor.decision_required
executor.stalled
executor.result_submitted
executor.lost
scope_or_evidence_mismatch
```

同一原因的提醒必须有有界预算，建议 POC 默认最多两次：

1. 第一次指出与 brief/证据的具体差距以及下一项可执行动作。
2. 第二次要求提交诊断 checkpoint 或明确 blocked。
3. 仍无进展则输出 `retry_recommended`、`needs_orchestrator` 或 `needs_user`，不让两个 Agent 无限对话。

Monitor 的提醒只能引用当前有效 brief、已有 Handoff 和可验证证据。它不能临场创造新要求，也不能以“我觉得更好”为由改施工方案；若认为有效 brief 本身有误，应联系编排 Agent发起修订，而不是继续据此判 Executor 跑偏。

### 6.5 Executor 候选交付与 Monitor 交接检查

Executor 判断工作已达到交付条件时，先提交不可变 `delivery_candidate`，而不是 final Result。候选至少包含 `candidate_id/revision`、变更清单、测试摘要、证据引用、风险、计划 Handoff，以及实际使用的 RelayPlan generation/brief version。

1. Runner 以 CAS 接收候选，冻结该 revision，节点进入 `monitor_checking`；Executor 终端暂不销毁。
2. Monitor 只检查当前 active candidate，并把 Report 绑定其 `candidate_id/revision`。
3. 若结论为 `continue_working`，该 candidate 和 Report 保持不可变，节点回到 `working`；Executor 补齐后提交递增 revision。旧 candidate 不删除，旧 Report 不再具有放行效力。
4. 若结论为 `handoff_ready`，节点进入同名 phase；Executor 随后提交**唯一 final Result**，引用 active candidate、对应 Monitor Report 和 Handoff。
5. Runner 只接受当前 Pair/Attempt 在 `handoff_ready` phase 的一次 final Result；重复同摘要返回既有 ack，不同摘要冲突拒绝。

详细交接步骤为：

1. Monitor 对照节点合同检查范围、步骤、测试摘要、证据、风险和 Handoff 字段。
2. Monitor 输出以下之一：

| 结论 | 含义 | 后续 |
|---|---|---|
| `handoff_ready` | 当前 candidate 的交付材料满足既有合同 | Executor 提交引用该 candidate/report 的 final Result；Runner 再做确定性校验 |
| `continue_working` | 存在可由 Executor 在原范围内补齐的具体缺口 | 返回 `working`，补齐后提交新 candidate revision |
| `retry_recommended` | 当前 Attempt 已不适合继续 | 编排 Agent/既有策略决定 fresh Attempt |
| `needs_orchestrator` | 需要跨节点判断、诊断或计划解释 | 编排 Agent处理 |
| `needs_user` | 需要用户决策、权限或验收 | 创建持久 Attention/Approval |

`handoff_ready` 只表示**当前节点的交接材料齐全**，不表示：

- 代码已经通过独立复核；
- 整张开发卡已经完成；
- 用户已经验收；
- verify 或上线闸已经通过。

Runner 只做身份、Schema、状态、证据存在性和机械 gate 校验。涉及实现质量的判断留在后续正式复核 Work Item；它按 Resolved Plan 可能是 dedicated 节点，也可能是 inline 结构化登记。

### 6.6 收口与下一节点

当前节点满足合同后，Runner：

1. 持久化 Monitor Report、Executor Result 和 Handoff。
2. 将业务节点记为合同定义的终态，例如 `succeeded`；这只代表该节点完成，不代表整张任务完成。
3. 精确关闭该 `pair_id` 的 Executor 与 Monitor，并验证没有同代孤儿 Pane/Agent。
4. 发出一次幂等 `node.completed`，把下一节点置为 `ready`。
5. 编排 Agent在线时读取 Handoff；若下一节点仍在已批准计划内且没有 Attention/Approval/重排，调用 `dh run continue`。

Runner 不直接把 `ready` 变成新 Pair。重复事件或重复 `continue` 最多命中同一持久 Receipt，不能启动第二对 Agent。

## 7. 终端断开、共同故障与恢复边界

### 7.1 四类状态不能混为“离线”

| 状态 | 业务含义 | 系统行为 |
|---|---|---|
| 视图断开 `detached` | 用户关闭终端窗口、网络断连或暂时不看，但 Agent/Pane 仍存活 | 不改 Run/Pair 状态、不重启 Agent；用户重新 attach 即可 |
| 单 Agent 意外退出 `single_agent_lost` | 没有显式停止 Receipt，且同一 Host generation 内其他角色与 Runtime 仍可用 | 按角色执行有界恢复；这是人为误关 Pane、单进程崩溃等边缘路径 |
| 宿主共同故障 `host_generation_lost` | Herdr Server/Workspace、终端宿主或机器故障使三个 Agent 一起不可用 | 进入共同恢复；这是主要的非人为故障路径，不存在“剩余 Agent 终端提醒” |
| 用户明确停止 `explicitly_stopped` | 用户通过受控命令明确停止某 Agent/会话，并取得停止 Receipt | 不自动重新拉起；按停止影响暂停或收口，并向用户展示后续选择 |

仅关闭视图必须走 detach；显式停止必须走受控 stop。直接杀 Pane 无法可靠表达“用户希望永久停止”，因此在没有停止 Receipt 时只能按意外退出处理，避免把误关变成静默停工。

### 7.2 单个编排 Agent 意外退出：补充路径

当 Runtime、Monitor 和 Executor 仍存活，只有编排 Agent 意外退出时：

1. 当前 Pair 继续工作，Runner持续接收信号；当前节点完成后只把下一节点置为 `ready`。
2. Runtime 通过 Launcher/Host Adapter 对同一 Profile 和 Run 做有界、幂等的编排 Agent 重拉起。
3. Runner向**仍在线的 Monitor 与 Executor 两个终端**各投递一条系统提醒：“编排 Agent意外退出；当前节点可继续，跨节点决策暂缓；正在重新拉起。”这只是故障提示，不是第四个 Agent 在聊天。
4. 若当前 Pair 发现计划/brief 问题，保存 `plan_change_request` Attention；受影响部分暂停，其余工作可继续。
5. 重拉起失败则持久化 Attention；Runner不能让 Monitor 或 Executor临时升格为编排者。

恢复后的编排 Agent从统一 Read Model 重建：当前 generation、最后完成节点、未决 Attention/`plan_change_request`、下一 Ready Node、Pair 回收状态和最新 Handoff。它不能依赖旧终端聊天记忆。

### 7.3 三 Agent 共同失联：主要恢复路径

共同故障时三个 Agent 终端都不在，因此故障发生当下没有任何“剩余终端”可提醒。恢复责任由非 Agent 的 Runtime/Launcher 承担：

1. Runtime 把旧 Host generation 标为不可用，依据 Receipt、lease 和精确 Host ID 对账，禁止在旧 generation 尚可能存活时重复拉起三套 Agent。
2. 若只是 Herdr/终端宿主故障而 Runtime 仍存活，Runtime保留 Run Store 并等待或执行有界宿主恢复；若机器重启导致 Runtime 也退出，Runtime重启后先重放 Store、operation ledger 和未完成 Receipt，再做同一套对账。
3. 先恢复**编排 Agent**，并在其新终端顶部展示恢复摘要：故障类型、Run/generation、当前 Node/Pair、最后持久 checkpoint、Result/Monitor Report/Handoff、未决 Attention，以及旧 Pair 是否已确认废弃。
4. 若当前 Pair 的 Monitor/Executor 已随宿主消失，Runner按 §6.2 将旧 Pair 置 `recovery_pending`，回收或废弃后由编排 Agent依据持久证据决定 fresh Attempt；不能把“终端已消失”当作节点完成，也不能凭聊天内容续接旧 Attempt。
5. 若故障前已完整持久化 final Result、Monitor Report 和 Handoff，Runner可以确定性完成旧 Pair 收口并把下一节点置 `ready`；仍须等待恢复后的编排 Agent决定是否 `continue`。
6. 编排 Agent恢复并完成对账后，再按当前节点状态恢复 Monitor/Executor 或启动 fresh Pair；重复恢复命令只能命中既有 Receipt，不能产生重复 Pair。

共同故障期间无法新建 `plan_change_request`；只能消费故障前已经落账的 checkpoint、Attention 和业务工件。物理磁盘及其备份同时损坏属于数据灾备问题，不在本地 POC 的会话恢复承诺内。

### 7.4 自动接力的业务授权

编排 Agent只有在以下条件全部成立时可以自动调用下一次 `continue`：

- 用户已经批准当前 Resolved Plan；
- 下一节点明确位于该计划内；
- 当前 generation 未变化；
- 上一节点已由 Runner 收口；
- 没有未决 Attention、Approval、replan 或强制阶段闸；
- 所需 Profile、能力和工作目录仍有效。

以下情况必须问用户或按正式流程重新确认：新计划、扩大目标或 allowlist、改变验收、重排节点、高权限 effect、上线/发布、人类验收、代签 verify。

## 8. 诊断模型：不保留常驻第四 Agent

局部现象由 Monitor 报告，默认诊断由编排 Agent承担：

```text
Monitor 提交事实与建议
  -> Runner 持久化
  -> 编排 Agent读取 Read Model / Result / Report / Handoff
  -> 决定原 Attempt 继续、fresh Attempt、换 Profile、请求用户或提出重排
```

当诊断本身需要大量上下文、专项工具或独立证据时，编排 Agent提出一个**显式诊断节点**。用户/计划授权后，仍按三终端模型运行：Executor 变成诊断者，Monitor 监督诊断范围，Runner管理状态。系统不新增常驻 Diagnoser Agent。

## 9. CLI、Launcher 与 Read Model

### 9.1 用户日常入口

```text
dh session start [project]
dh session attach [project]

dh run start --plan <file>
dh run list
dh run status <run_id>
dh run inspect <run_id>
dh run events <run_id> --follow
dh run continue <run_id>
dh run stop <run_id>

dh attention list [--run <run_id>]
dh attention show <attention_id>
dh attention answer <attention_id> --option <option_id>

dh agent attach --run <run_id> --role orchestrator|monitor|executor
dh agent tell --run <run_id> --to orchestrator|monitor|executor --stdin
dh agent reply --correlation <message_id> --stdin
dh doctor
```

命令名称是用户层产品候选，不代表 DHR_30 已经实现了这些 method。`dh` 只做薄门面，最终必须落到同仓唯一 `relay` Runtime endpoint，不能维护第二份进程、Store、Receipt 或 Read Model。

### 9.2 与 DHR_30 冻结合同的映射

| 用户层候选 | Runtime/CLI 落点 | 合同状态 |
|---|---|---|
| `dh run list` | `relay list` → `listRuns` | DHR_30 已冻结 |
| `dh run status/inspect` | `relay status/inspect` → `inspectRun` | DHR_30 已冻结 |
| `dh run events --follow` | `relay events --follow` → `subscribe` | DHR_30 已冻结 |
| `dh run start` | `relay start` → `start` | DHR_30 已冻结；只表示 Run/actor ready，不表示 workflow 已启动 |
| `dh run stop` / Runtime 恢复 | `relay stop/resume` → `control` | DHR_30 已冻结 |
| `dh run continue` | 后续 `continueRun` 或等价 workflow method | **尚未冻结**；由 Workflow Engine 卡版本化新增，不得塞回 DHR_30 当前范围 |
| `dh attention ...` | 后续 Attention methods | 尚未冻结；沿同一 RPC envelope/授权/Receipt 扩展 |
| `dh session start/attach` | 编排 Agent Profile + Launcher/Host Adapter | 后续三终端卡；它连接同一 Runtime，不是新控制服务 |
| `dh agent attach` | Launcher/Host Adapter 的精确 attach | 后续 Launcher 卡；只改变终端连接，不改变 Run 状态 |
| `dh agent tell/reply` | 后续 Message Router method → Host Adapter `agent prompt` | 尚未冻结；只返回瞬时 accepted/delivered/replied/not_delivered，不把普通消息写入 Store |

Workflow Engine 的 Node/Pair/Attempt 事件进入同一个 Run Store，但要通过 actor 串行提交。DHR_30 冻结的 `relay.client-read-model/v1` 保持字段、枚举和 `additionalProperties:false` 语义不变；后续合同卡新增 `relay.client-read-model/v2`（以及对应的 versioned RPC method/view 与 capability manifest），承载 workflow/Pair 字段。旧客户端继续读取 v1 冻结视图，三个 Agent终端统一消费 v2，不允许在 v1 上直接加字段。禁止 CLI handler 或 Workflow Engine 绕过 actor 直写文件。

### 9.3 Launcher/Profile

Runner 使用统一 Launcher 拉起编排、Monitor 和 Executor Profile。Profile 保存：

- 产品类型与命令别名，例如 Claude Code、Codex、Oh My Pi；
- 账号别名、配置目录、能力、允许环境变量名；
- 角色适用范围、工具 allowlist、工作目录和启动参数数组；
- 可承担的 `review_path_id`、只读强制形态、fresh-context/实例隔离能力；
- 是否允许调用受控 Message Router；Agent Profile 永不直接获得任意 Herdr Agent/Pane 输入权限；
- 可否交互、可否 attach、checkpoint/result 适配器。

Profile、Receipt、日志和设计文档永不保存凭据值。Prompt/Brief/Agent 消息不拼进 Shell 字符串；CLI 使用 stdin 或结构化 RPC 传递正文。启动前先落 Receipt，Ready 后经受控通道投递。

`dh_relay/plans/` 中的 Reviewer Binding 只引用已登记 `profile_id`。账号别名到配置目录、实际可执行文件和环境变量允许名仍由用户级 `~/.dh-relay/registry/` 管理；业务仓不能通过提交一个同名 Profile 接管本机账号。

### 9.4 Read Model

三个 Agent终端和未来 GUI/DSH/Pi 客户端只能消费同一 Runtime Read Model。最小展示包含：

```text
run / generation / plan
current node / next ready node
pair / executor attempt / monitor instance
orchestrator / monitor / executor host status
latest checkpoint / result / monitor report / handoff
attention / approval / retry / replan
receipt / event cursor / recovery state
```

客户端可以使用不同渲染，不得私自计算另一套终态。普通 Agent 消息及其瞬时 accepted/delivered/replied 状态不进入 Read Model；只有由失败交流升级形成的 Attention 才进入。

## 10. 最小 POC 与阶段顺序

### 10.1 POC 范围

- Windows 本机、一个业务仓、一条两节点线性计划；
- Herdr 作为三个交互终端的宿主；
- 一个长期编排 Agent；
- 每个节点一个 Monitor 与一个 Executor；
- 可见 `dh_relay/` 根：tracked `plans/archive` + ignored `runtime`；文件型 Store、追加事件账、Receipt、统一 Read Model；
- 三 Agent按逻辑角色互发消息，Herdr完成精确定向投递，Router处理忙碌/blocked/离线和往返预算；
- 至少跑通施工 + 当前 task_type 解析出的两种适用复核路径；POC 将这两路显式配置为 `dedicated_pair`，证明不同路径可绑定不同 Executor Profile，同时用一条 `lessons-absent` 或 inline 用例证明 N/A/会话内登记不会误拉 Pair；
- 至少两类 Agent 产品完成真实 Launcher smoke；第三类可在后续兼容切片补齐；
- 无 GUI、无 DSH Bridge、无跨机器和并行 DAG。

### 10.2 推荐垂直切片

1. **Runner/CLI 基座**：承接 DHR_30 Runtime、RPC、Read Model 和持久操作 Receipt，不改变其当前卡边界；另立迁移卡把 repo-local 新 Run 根切到 `dh_relay/runtime/`，旧根只读发现，并实现精确 `run_id` 退场与目录外清理探针。
2. **稳定 Launcher 与三终端会话**：Profile、精确 Agent/Pane ID、Ready/attach/stop、重复启动幂等。
3. **Message Router**：逻辑角色寻址、受控 Herdr prompt、工作中排队、blocked/offline 拒绝、回复关联和预算；证明普通消息不入 Store。
4. **单节点 Pair**：delivery candidate/revision、Monitor Report、final Result、局部提醒、部分启动补偿和精确收口。
5. **Review Recipe 与 Profile 路由**：从 dev-harness `task_type` 解析必做路径，校验 bindings、只读/fresh 隔离和 Monitor 不计入复核。
6. **两节点接力**：编排 Agent接收事件、读取 Handoff、在授权内调用下一次 `continue`。
7. **正式复核节点验证**：至少覆盖代码复核与另一条需求/一致性/教训路径，证明不同复核 Executor Profile、独立输出和验证节点附加要求都正确。

本地应用只在上述终端链路稳定后建设，并复用同一 Runner、CLI、RPC、Read Model 与 Receipt。

## 11. AI 机器验收

| ID | 可机判命题 |
|---|---|
| HC-3AT-A1 | 一个 Run 暴露且只暴露 orchestrator/monitor/executor 三类 Agent 终端身份；Runner 合同明确为非 Agent 程序，测试不存在第四 Agent 角色 |
| HC-3AT-A2 | Executor Attempt 与 Monitor Instance 分别有独立 Receipt/身份；旧 generation、旧 pair、旧 attempt 的迟到信号不能推进当前节点 |
| HC-3AT-A3 | 三终端均可 attach 和自由聊天；普通用户聊天及 Agent 间消息不产生业务事件；Executor 在有效 brief 内自主决策，只有最终生效的 RelayPlan/brief 版本、权限决定、人验和编排单实例意外退出时的 `plan_change_request` Attention 进入 Run Store |
| HC-3AT-A4 | Pair 状态机、补偿 Receipt 和 recovery key 覆盖 Executor-only、Monitor-only、Monitor lost、Executor lost 和双丢失剧本，动作与 §6.2/§6.3 一致且可 crash/replay |
| HC-3AT-A5 | Monitor 不能修改业务文件、Run 状态、计划或 Agent 生命周期；提醒只能引用当前有效 brief/证据且同因有次数上限；brief 修订待决时不得用争议字段继续判跑偏 |
| HC-3AT-A6 | Monitor 能检出 allowlist 越界、明列步骤/证据缺失和 candidate 自相矛盾；不能输出质量 `accept/reject`，只能输出 §6.5 五类交接意见 |
| HC-3AT-A7 | `delivery_candidate` revision、Monitor Report、唯一 final Result 与 Handoff 均不可变且引用闭合；`continue_working` 只能产生新 revision，不能覆盖已冻结 candidate/Result |
| HC-3AT-A8 | 每条适用复核路径都有独立 Work Item 和结论：`dedicated_pair` 才启动独立节点并使用满足合同的 reviewer，`inline_registration` 不拉 Pair但仍单独登记，N/A 有冻结依据；任何 Monitor 均不计入复核证据；代码轮2实例/会话与轮1不同且不继承其会话上下文 |
| HC-3AT-A9 | 编排 Agent所有控制都经 CLI/Runtime；重启后仅依据 Read Model、事件和 Handoff 恢复，不读取或直写 Store |
| HC-3AT-A10 | `detached` 不改变 Agent/Run 状态；编排 Agent 单实例意外退出时当前 Pair 可继续并收口、两条剩余终端收到系统提示，但下一 Ready Node 不自动启动；恢复后重复 `continue` 只产生一个有效 Pair |
| HC-3AT-A11 | Executor 可自主修改节点工作字段；RelayPlan/Contract Brief 字段变化必须由发现者带上下文交给编排 Agent；仅编排 Agent 单实例意外退出时生成绑定 generation 的 `plan_change_request` Attention；只有当前授权内修正可直接发布，目标/范围/验收/权限/节点结构变化在无用户确认时 fail-closed |
| HC-3AT-A12 | Pair 收口按精确身份关闭两条节点会话并对账孤儿；别的 Run、generation 或终端不受影响 |
| HC-3AT-A13 | 深度诊断只能作为显式诊断节点运行，不能在角色/Schema/Read Model 中出现常驻第四 Diagnoser Agent |
| HC-3AT-A14 | 三终端与任意未来客户端读取同一 Runtime Read Model；Host `done`、终端退出和聊天文本均不能单独改变业务完成状态 |
| HC-3AT-A15 | DHR_30 actor 是唯一物理 Store 写者、后续 Workflow Engine 是唯一业务转换裁决者；workflow/Pair/continue 不出现在 DHR_30 当前卡 diff，后续扩展也不能绕 actor 直写 |
| HC-3AT-A16 | 正式 manifest 不再包含 01/02/05/06；所有 active legacy acceptance 均在 §13.4 出现并有唯一 mapping，§13.5 冻结 ID 不会同时出现在 active mapping |
| HC-3AT-A17 | 已批准计划内的自动接力与新计划/重排/扩权/人验边界可机判；后四类在无持久用户授权时 fail-closed，Runner 永不自行扮演编排 Agent |
| HC-3AT-A18 | 模拟 Herdr/Host generation 共同故障以及 Runtime 同时重启两条路径：均先对账旧 Host/Receipt、只恢复一个编排 Agent并展示持久恢复摘要；旧 Pair 不被误判完成，重复恢复不产生重复 Agent/Pair，下一节点不会自动启动 |
| HC-3AT-A19 | repo-local 新根为可见 `dh_relay/`：`plans/`、`archive/` 可被 Git 跟踪，`runtime/` 按 Git 语义被忽略；改 tracked Plan 不直接改变 active generation，Runtime 只写 resolved snapshot；旧 `.dh-relay/`/`.dh-runtime/relay/` 只按迁移合同发现，不原地改名，用户级 `~/.dh-relay/` 不变 |
| HC-3AT-A20 | Message Router 按 run/generation/node/pair 和逻辑角色唯一寻址：idle 可投递、working 有界排队、blocked/offline/身份歧义不注入；accepted/delivered/replied 可区分，旧实例消息拒绝，预算耗尽明确失败；校验与 Host 投递使用同一不可变消息快照；Agent 无直接 Herdr prompt/send-keys 权限，普通消息正文与投递状态均不进 Run Store/Read Model |
| HC-3AT-A21 | dev-harness Adapter 对 `heavy/normal/light` 分别解析出五路/三路/两路 Recipe，并冻结 applicability、execution mode 和源摘要；`lessons-absent` 产生可核查 N/A 且不要求 Binding；normal/light 默认 inline 不误拉 Pair，显式升级 dedicated 后才消费逐路 Profile；适用 dedicated 路缺 Binding、只读或 fresh 隔离能力时 fail-closed，改 Binding/Mode 不能删必做路径或把上游独立路径降级；有效单测保持附加验证而非复核路径 |
| HC-3AT-A22 | `plans/`/`archive/` 不被 Runner 自动删除；终态 Run 只有在 archive/export 条件和保留期满足后才能精确清理自己的 `runtime/<run_id>/`，staging/tmp 可恢复收敛；模拟删除失败时原目录保留并出现 `cleanup_failed` Attention，目录外探针能证明真实退场而非“从未创建” |

## 12. 人类验收

| ID | 5 分钟内操作 | 人验判断 |
|---|---|---|
| HC-3AT-H1 | 启动一个两节点演示 Run，分别 attach 三个终端；用户各发一条无副作用询问，再让 Executor 经 Router 向编排 Agent提问并收到回复 | 用户能一眼区分三个 Agent 的职责；用户与 Agent、Agent 与 Agent 都能方便交流，来源清楚且无需第四 Runner 终端；普通交流没有污染业务事件账 |
| HC-3AT-H2 | 让编排 Agent单实例意外退出，但保留含错误 allowlist 或依赖的当前 Pair；让 Executor/Monitor发现问题，随后等待编排终端恢复 | 两个剩余终端都收到明确提示；恢复后已有完整 `plan_change_request`，用户无需重复；未越权修正能发布新版本，涉及目标/范围时会先找用户；Monitor 不再拿争议旧字段判跑偏 |
| HC-3AT-H3 | 观察 Executor 交 candidate、Monitor 给 `handoff_ready`、Executor 交 final Result、Runner 回收 Pair、编排 Agent启动下一节点 | 用户能区分“候选可交接”“节点收口”“独立复核”“整卡完成”，且没有重复或遗留终端 |
| HC-3AT-H4 | 当前节点工作中停止 Herdr/终端宿主，使三个 Agent 共同消失；恢复宿主并重新进入会话 | 没有虚构“剩余终端提醒”；先看到恢复后的编排终端及持久恢复摘要；旧 Pair 未被误判完成或重复拉起，且没有擅自启动下一节点 |
| HC-3AT-H5 | 选择一个包含至少两条适用复核路径的 Recipe，把两路显式设为 `dedicated_pair` 并绑定不同 Agent/Profile；另展示一个 inline 或 `lessons-absent` Work Item | 用户看到同一个 Executor 终端随节点切换为不同专用 reviewer，路径没有因换 Agent 被跳过；inline/N/A 没有误拉 Pair且理由清楚；复核者判断对应领域，Monitor只监督过程和工件，不算该路复核 |

## 13. 旧正式方案的冻结与验收迁移

### 13.1 文档治理决定

本设计正式晋升时，执行同一个原子变更：

1. 从 `design/README.md` 的 `designInputs` 移除 01/02/05/06，加入本设计；旧四份文件全部保留为历史方案，不再让 B 阶段同时消费互相冲突的拓扑。
2. `design/01` 标记“P1 已实现历史基线”；其身份链、双维状态和 fail-closed 等仍有效约束已在本文重新陈述。
3. `design/02` 标记“完整流水历史目标”；其 dev-harness 流程、安全边界和独立复核原则已在本文重新陈述，旧 psmux/窗口弱信任/常驻诊断角色不再生效。
4. `design/05` 标记“DSH 专属工作台方向冻结”；`design/06` 标记“多控制面/Headless 主线冻结”。
5. DHR_30 的 07/08 在其任务卡合并后继续作为 Runtime/RPC 技术合同并进入 `designInputs`；本文不抢改其文件、状态或当前卡验收。
6. `evidence/11` 保留为方向形成记录并链接到正式设计，不再被误读为当前合同。
7. 新增一份决策记录，逐项写清旧条款和验收 ID 的 `retained/superseded/deferred/historical` 状态、replacement 和适用阶段。
8. 同步重写 `acceptance-id-mapping.json` 为“当前活跃映射”：只保留仍由正式输入承载的 legacy canonical ID；已冻结 ID 的不可变去向由决策记录保存，不伪造成活跃验收。
9. 同一晋升批次同步仓库治理入口：AGENTS 的复核闸改为消费 `task_type` Recipe（存量卡仍走 legacy），运行现场段声明新 `dh_relay/` 分层；`.gitignore` 增加精确 `/dh_relay/runtime/` 并保留旧 `.dh-relay/`、`.dh-runtime/` 忽略项。任一项未同步，正式晋升批次不算完整，B-adjust 不得开始。

冻结不是删除，也不否认历史投入。历史文档继续解释 P1/P2、DSH 和多控制面为什么曾被选择、实现或验证；`as-built/` 继续记录现役实现。只是后续拆计划只读当前正式输入，不再让旧 PoC 产品形态反向约束新主线。

### 13.2 从 01/02 重新陈述的现役硬约束

| 现役约束 | 本文权威口径 |
|---|---|
| 身份与迟到隔离 | active plan CAS、authority generation、immutable Receipt、Run/Node/Pair/Attempt/Agent identity 缺一不可；旧届和旧 Attempt 的迟到事实只能审计，不能推进 |
| 双维状态 | Host/terminal observation 与业务 Result/Node/Task 状态分维；任何进程状态都不能直接投影业务完成 |
| 交棒先于退出 | 正常收口必须先有候选交付、Monitor Report、final Result、Handoff 和 Runner ack，再精确关闭 Pair |
| Runner 不判质量 | Runner 只做合同、身份、机械 gate 和状态迁移；正式复核节点、需求复核、用户验收与 verify 保持独立 |
| Fail-closed | 坏 JSON、半写、probe 失败、身份不明、Receipt 冲突、证据缺失和能力不足均停住，不猜测成功 |
| 凭据与脱敏 | Profile/plan/Receipt/事件/终端证据零凭据值；工件先脱敏，credential-shaped 命中即阻断 |
| 已授权任务才执行 | Run 绑定用户确认的 Design/DevPlan/卡范围与哈希；新计划、改目标、扩范围必须重新授权 |
| dev-harness 流程 | 必做复核路径由启动时冻结的 `task_type` Recipe 决定：`heavy` 为两轮代码复核 + 需求方向 + 一致性 + 教训，`normal` 为代码轮1 + 需求方向 + 教训，`light` 为一致性 + 教训；`heavy/normal` 另有有效单测要求。Adapter 同时保留 N/A 与 inline/dedicated 执行语义，不能把库空误判缺 Binding，也不能为 normal 静默增加独立派发。施工、机器闸、需求境证据、人验和 verify 仍各自登记，任何路径都不被 Monitor 合并 |
| 新 Attempt 与不可变证据 | 返工、换 Executor、重跑复核均产生 fresh Attempt；旧 candidate/result/review 不覆盖，只以明确 replacement 关系失效 |
| Profile 与工具边界 | 计划只引用登记 Profile/Script ID；参数、能力、工作目录和工具 allowlist 由冻结注册项决定，不接受任意命令注入 |
| 写入与 worktree | 业务修改只发生在授权任务 worktree/路径；Runner/Monitor/编排 Agent不顺手改业务文件，不允许未授权 push/deploy/收口 |
| 用户验收不可代签 | Agent只能记录和展示，Monitor/Executor/Runner均不能替用户作 Approval、人验或 verify 确认 |

### 13.3 明确被新设计取代的旧口径

| 旧来源 | 冻结口径 | 新口径 |
|---|---|
| 01 | 编排 Agent一次性运行、不持续监控 | 一个长期但可重启的编排 Agent终端；事实仍在 Runner |
| 01 | POC 固定 psmux 单 Worker | Herdr 三终端；当前节点 Monitor + Executor Pair |
| 01 | 用户在 Worker 原会话回答，Runner 不读取/转发/记录 | 三终端自由对话且不逐句记账；只有最终生效的计划/brief 版本与高权限 Attention/Approval 进入 Run Store |
| 01 | 一次性诊断/重编排 Agent | 编排 Agent默认诊断；深诊断/重排走显式节点和批准计划 |
| 02 | 没有常驻 AI 主控、主会话消息为 0 | 编排 Agent是长期用户入口，但可随时重启且不是真相 |
| 02 | psmux 窗口明文回答 + 截图护栏的弱信任确认 | 三终端可交互且普通聊天不记业务账；控制、批准、人验只保存最终 Request/Receipt 与有效版本，不保存完整聊天过程 |
| 02 | Agent 间靠窗口约定、主控转述或任意终端注入 | Runner 内置确定性 Message Router；Agent 只按逻辑角色发消息，Host Adapter 使用受控输入面投递，普通消息不进入 Run Store，权威效果必须升级为既有业务工件 |
| 02 | Runner 自动拉起常驻职能 Diagnoser | 不保留第四 Agent；异常默认交编排 Agent，深诊断是普通 Node 的 Executor |
| 02 | 旧 P2 多卡、test push、archive/finalizer 具体切分 | 冻结为历史实现目标；是否重新纳入由新 B-adjust 按本文拓扑逐项选择，不自动继承卡序 |
| 02 / D21 | repo-local `.dh-relay/<run_id>/` 全量忽略，长期归档另放 `docs/relay/` | 新 Run 使用 `dh_relay/plans/`、`dh_relay/archive/` 作为 tracked 源与归档，只有 `dh_relay/runtime/` 被忽略；旧 `.dh-relay/`、`.dh-runtime/relay/` 保持 legacy 读取，不原地改名 |
| 05 | DSH 作为首选专属工作台和近期 Bridge 主线 | 三终端 CLI 先行；本地应用/DSH 后置并复用同一协议 |
| 06 | 没有任何控制端在线时自动跨节点推进 | 当前 Pair 可收口；下一 Ready Node 等编排 Agent恢复 |
| 06 | DSH/Pi/CLI 多控制面并行交付 | 当前只交 CLI + 三终端；未来客户端另行立项 |

### 13.4 继续生效的旧 canonical 验收

以下旧 ID 的语义不改写，在本文重新承载；正式晋升时 mapping 的 `artifact` 改指本文：

| ID | 当前仍需满足的原语义 | 适用阶段 |
|---|---|---|
| HC-P1-A1 | RelayPlan/状态/Result/Handoff/Event 和合法转换都有版本化 Schema，未知字段与非法边失败 | 当前 |
| HC-P1-A2 | CAS、generation、Receipt 和完整身份链拒绝旧 Attempt 的迟到/重复/错绑定结果 | 当前 |
| HC-P1-A5 | 节点 `succeeded` 不被 Runner 直接投影为整张任务完成 | 当前 |
| HC-P1-A6 | 无结果退出、probe error、半写、坏 JSON、无进展和能力耗尽均 fail-closed | 当前 |
| HC-P1-A8 | Handoff 自足且所有最终工件不泄漏凭据值 | 当前 |
| HC-CTRL-H1 | DSH 未安装或完全停止时，Relay Runtime 可以启动、查询、运行和恢复 | 当前 |
| HC-CTRL-H2 | Relay CLI 能完成 list/status/inspect/watch/start/stop/resume/attention/approve 的基线控制 | 分阶段；DHR_30 先交基础方法，workflow/attention 后续补齐 |
| HC-CTRL-H3 | DSH、Pi 与 CLI 读取同一 Read Model，对同一 Run 的状态和终态一致 | 兼容客户端接入时；当前先证明三终端一致 |
| HC-CTRL-H4 | 客户端断开、DSH 插件卸载和 SSH 断开均不隐式取消 Run | 当前 |
| HC-CTRL-H6 | 任一必经 Workflow 角色至少存在一个非 DSH-only 合法 Executor Profile | Profile 切片 |
| HC-CTRL-H7 | DSH-only Executor 丢失只影响对应 Attempt，不能污染其他节点或 Run 真相 | 兼容 DSH Executor 时；Pair 隔离当前即验证 |
| HC-CTRL-H8 | 同一 Approval Request 经 DSH 或 CLI 提交后生成语义相同、hash 绑定的 Receipt | Approval 切片 |
| HC-CTRL-H9 | Linux 无 GUI、仅 SSH 时，可以运行 Runtime、CLI、Herdr 和一条代表性工作流 | 后续双平台阶段，不阻塞 Windows POC |
| HC-CTRL-H10 | Headless 缺少强证据能力时，启动前拒绝、路由或暂停，不静默降级 | 当前不变量 |
| HC-CTRL-H11 | 更换控制客户端不改变 Authority、ResolvedPlan、Gate、Result 和 Verify | 当前不变量 |
| HC-CTRL-H12 | 更换 Agent Executor 时产生 fresh Attempt，并重新经过相同质量链 | 当前 |

### 13.5 已冻结验收 ID 的不可变去向

| 旧 ID | 状态 | replacement / 以后如何处理 |
|---|---|---|
| P1 A3 | `historical` | P1 特定 A/B 重编排剧本保留为回归；新重排边界由 HC-3AT-A11 承接 |
| P1 A4 | `superseded` | 由 HC-3AT-A3/A11/A20 承接自由对话、节点自主权、Agent 间消息和计划变更路由 |
| P1 A7 | `superseded` | 由 HC-3AT-A1/A4/A12/A20 与 HC-3AT-H1 承接 Herdr 三终端生命周期和受控消息投递 |
| P1 H1/H2 | `historical` | 只证明 P1 psmux PoC 和当时方向价值，不进入新计划 |
| 02 的 B1～B18 | `historical/deferred` | 原 P2 完整流水卡序不继续作为当前验收包；§13.2 的安全/流程不变量继续生效，具体功能由新 B-adjust 重新挂 HC-3AT 或新 ID |
| P2 H3/H4 | `superseded` | 新终端体验由 HC-3AT-H1～H5 承接 |
| P2 H5 | `deferred` | 只有未来重新引入远端 test push 时另立设计与人验，不作为当前 POC 闸 |
| CTRL H5 | `superseded` | 由 HC-3AT-A10/H4 替代；旧“无人在线仍跨节点”语义不得继续引用 |

`acceptance-id-mapping.json` 的 v1 Schema 不支持状态字段，而且校验器要求每条 `artifact` 都是当前 `designInputs` 且 canonical ID 实际出现在该输入中。因此不擅自扩 Schema：正式晋升时只把 §13.4 的 active legacy ID 映射到本文，并移除 §13.5 已冻结条目；完整历史状态留在同批决策记录。HC-3AT 是新 canonical ID，直接出现在本文，不伪造 legacy mapping。

## 14. 与 DHR_30 和下一步开发的关系

DHR_30 当前负责 Runtime service、RPC、Read Model 和持久操作 Receipt。它没有、也不应在施工中临时增加 workflow、Launcher、Monitor 或 Agent Pair。本文只提出其后续消费者和新增合同，不反向扩大 DHR_30 已确认范围。

启用顺序是硬闸：先完成 §13.1 的正式输入与 AGENTS/`.gitignore` 同批同步，才允许 B-adjust；B-adjust 必须先排 repo-local resolver 迁移卡。该卡完成旧根发现/恢复策略、精确新根解析和 HC-3AT-A19/A22 后，`dh_relay/runtime/` 的新 Run start 才能开能力开关。在此之前，现役代码仍按旧根合同运行，设计晋升本身不改路径、不迁目录，也不允许 Worker仅凭新文档提前写新根。

本设计正式晋升后，下一步不是直接开 Launcher 代码，也不是把新内容塞进 DHR_30，而是先做一次 B-adjust：

1. 以正式 `designInputs` 重新梳理 P4～P9，冻结 DSH 主线任务的继续施工资格；
2. 保留 DHR_30 已完成/在途的 Runtime 基座，识别与新主线直接复用的卡；
3. 单独冻结 repo-local 存储迁移合同：新 Run 才写 `dh_relay/runtime/`，明确旧根 discovery/resume/archive、保留期、精确清理、失败 Attention 和目录外验证策略，再修改 resolver 并核验晋升批次已落的 `.gitignore` 精确规则；DHR_30 的当前 worktree 不承担目录迁移；
4. 把“Launcher/三终端”“Message Router”“单节点 Pair”“两节点接力”“Review Recipe/Profile 路由”“正式复核节点验证”拆成有依赖顺序的任务卡；
5. 校验仓库 AGENTS 宪章已与 dev-harness `task_type` registry 同步，且 resolver 能读取相同 Recipe/applicability/mode；若上游 registry 在拆卡前变化，先重新冻结 Adapter 合同，不由各节点自行猜测；历史卡继续按其冻结规则收口，新卡按冻结 Recipe 执行；
6. 分别定义施工、各必做复核路径、有效单测、需求境、人验和 verify 闸；
7. 用户确认调整后的 DevPlan 后，再逐卡创建 worktree 开工。

## 15. 整版确认与晋升摘要

本文采用以下决定：

1. 用户面对编排、Monitor、Executor 三个可交互 Agent 终端；Runner 是编排 Agent 调用并嵌入产品链路的确定性程序，不是第四个 Agent，也不拥有独立聊天终端。
2. 三个 Agent 能经 Message Router 按逻辑角色主动交流并看到 `accepted/delivered/replied`；普通消息和瞬态投递状态不进入 Run Store/Read Model，只有计划变更、Attention/Approval、Result、Monitor Report 等权威工件才能改变执行。
3. Executor 是当前节点主控；发现 brief 有问题时可提出具体修订并与编排 Agent交互，但未经新的有效版本与 Runner ack，不能静默偏离。Monitor只监进度、显性跑偏与工件完整性，不算正式复核者。
4. dev-harness 的 `task_type` 冻结本 Run 必做 Review Recipe，并逐路解析适用性与 inline/dedicated 执行模式；每条 dedicated `review_path_id` 可分别绑定 Agent/Profile。库空 N/A 不误阻断，Binding 可以换执行者但不能删除路径或降级上游独立要求；代码轮2仍要求换 Agent 实例/会话，Monitor不计入任何复核证据。
5. repo-local 新根采用 `dh_relay/`：`plans/`、`archive/` 可入 Git，`runtime/` 必须忽略；tracked Plan 是提案源，不会直接改活跃 generation。旧 `.dh-relay/`、`.dh-runtime/relay/` 不原地搬迁，用户级 `~/.dh-relay/` 不变。
6. 仅关闭终端视图不算 Agent 离线。单个编排 Agent退出时 Runner提示仍在线的 Monitor/Executor并机械重拉起；更常见的宿主/机器故障会让三者共同失联，此时恢复后先拉起编排 Agent并展示持久摘要。任何恢复路径都不会让 Runner独立扮演编排者或擅自跨节点。

第 6 条有意替换 `design/06` 的“没有客户端在线时自动节点继续”；其余各条分别取代旧的窗口通信、固定复核角色和隐藏 repo-local 根口径。本文已完成独立复核并取得用户对以上整版摘要的确认，现按 §13.1 原子晋升；本批 AGENTS/`.gitignore` 已同步，但新 resolver 未验收前仍不得启用新根 start，也不得进入 B-adjust。
