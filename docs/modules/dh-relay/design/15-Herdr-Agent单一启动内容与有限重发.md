<!-- dh:planning-event:v1 id=DHR-A-32 stage=A-full artifact=design/15-Herdr-Agent单一启动内容与有限重发.md review=evidence/46-A32-startup-progress游标与补发线性化-交叉审核记录.md#review-a32 understanding=evidence/46-A32-startup-progress游标与补发线性化-交叉审核记录.md#understanding-a32 -->
# Herdr Agent 单一启动内容与有限重发

> 状态：`DHR-A-32` 已完成需求理解对齐、fresh 审核、定向复审与用户整版确认；本版取代尚未实施的 A31 startup progress 判定与 v1 工件。本文件是 `design/README.md` `designInputs[]` 的正式输入，只冻结产品合同；不授权 B-adjust、DevPlan/任务卡、代码、真实 Agent、DHR_35/P6 收口、Linux、verify、合并、推送或部署。
>
> 本文件在 Herdr Agent 启动指令范围内补充 `design/10` 的 Work Item Ticket/Role Relay 合同与 `design/12` 的 Receipt-bound completion instruction。未提及的 Ticket、Result、lease、fencing、Profile、fallback、Role Relay 和 Host Observation 合同保持不变。

## 0. 起因与设计目标

DHR_35 的 Windows 实录暴露了两个独立 prompt 写入者：production driver 单独发送 Receipt completion instruction，外围 runner 再发送任务指令。Herdr 0.8.2 的 prompt API 接受请求不等于目标 Agent 已收到、已读或开始执行；宿主 `idle/state_change_seq` 也不能充当某次 turn 的确认。用延时、状态采样、内容锚点或额外 Enter 串联两个发送者，只能增加启发式，不能形成可恢复的产品合同。

本设计目标是：**一份完整、不可变的启动内容只有一个逻辑 owner，经一个物理发送者投递；常规无持久进展时可向同一已核身份 Agent 原样补发一次。**准确承诺是“单一内容、最多两次物理投递”，不是 exactly-once delivery，也不承诺 exactly-once execution。

## 1. 责任与内容来源

### 1.1 唯一 owner 与唯一发送者

- Runner/Workflow 是 startup dispatch 的唯一逻辑 owner：从已冻结的节点输入与 Attempt Receipt 生成一次不可变 dispatch。
- Host Adapter 是唯一物理发送者：只有它可以消费已持久占用的 delivery slot 并调用 Herdr prompt API。
- production driver 现有的独立 completion-instruction 发送、DHR_35 runner 的第二份任务 prompt、Role Relay 或任何外围脚本都不得再承担 startup/completion 指令发送。后续实施必须把现有启动、恢复、解除 blocked 三处独立 completion instruction 路径归零。

`Herdr request accepted` 只表示 Host 收到 Herdr API 的接受结果，不表示 delivered、read、turn started 或 executed。业务完成继续只认 committed Receipt-bound Result；pane 文本、Host 状态、CLI exit、Agent 自述和超时均不能替代。

### 1.2 一份“完整启动内容”

启动 prompt 只给 Worker 恢复当前 Node 所需的指针与硬边界，不复制业务全文。它必须在同一条不可变内容中同时包含：

1. 当前 Run/generation/node/Attempt 的身份提示；
2. 精确 worktree、workspace 与 `instruction_ref`；
3. `stop_after`；
4. 当前 Attempt Receipt-bound 的 succeeded/failed 提交命令；
5. 重复收到同一 dispatch 时“从当前 Ticket/workspace 的持久事实续做，不重新开始”的固定提示。

来源分两类并使用同一 formatter：

- 当前 P6 `relay.run/v2` Herdr 节点：后续实施须补一个受 schema 约束、解析到当前仓根内的 `instruction_ref`；没有该字段不得启动 Receipt-bound Herdr Attempt，外围 runner 不得运行后再补任务正文。
- `design/10` 的 Work Item Ticket 路径：直接使用 Ticket 已冻结的 worktree/workspace/instruction_ref/stop_after 与 Receipt identity；不得展开 workspace 正文或把 Plan/聊天当第二来源。

同一 Attempt 恰有一个来源；双来源、缺来源、越界引用、输入摘要不符或内容无法确定性重建均 fail closed。

## 2. 私有 dispatch 工件与安全边界

每个 Attempt 在 ignored `runtime/<run_id>/` 中持久化一个版本化 `relay.startup-dispatch/v2` 结构工件。A31 的 v1 仅为 pre-implementation 设计，标记 `superseded-before-implementation`；Runtime 必须拒绝 v1，不迁移、不兼容读取。字段闭集为：

- `protocol`、`template_version`；
- `run_id`、`generation`、`node_id`、`pair_id`（适用时）、`attempt_id`、`agent_instance_id`；
- Ticket/Receipt identity refs；
- `worktree`、`workspace`、`instruction_ref`、`stop_after`；
- `host_generation`、脱敏 `host_ref`；
- `prompt_digest`；
- ordinal 1/2 的 slot、请求时间与结果枚举；
- ordinal 1 的 `progress_seq_at_reservation` 与工件级 `last_runtime_at`。

禁止任意自由文本、展开的 brief/task_plan/workspace 内容、普通聊天、pane/log/output、环境值、账号配置值、凭据值和未知字段。`receipt_id` 只允许存在于 `design/12` 已批准的私有 Run Store/受控启动内容和本机 RPC；Git 工件、公开日志、截图及证据继续只保留摘要关联符。

prompt UTF-8 字节串只由 `template_version + 上述冻结字段` 按版本化确定性 formatter 生成；不持久化 prompt body。ordinal 2 必须从同一个 dispatch 工件重建并重新计算 digest，逐字相同才可继续。模板版本不可用、来源已漂移、字段不合规、无法重建或 digest 不同，均禁止补发并进入 `waiting_human`。这条安全拒绝不能留给施工期临场决定。

## 3. 两个不可回收 delivery slot

### 3.1 首次投递

Host 完成 Agent ready/blocked 观测并取得当前实例身份后，由 HostSessionActor 调用 Store 内部单一 `reserve_delivery` CAS mutation，在同一个 prepared/committed journal 中原子保存 ordinal 1 slot=`reserved`、Actor lease/epoch、dispatch/prompt digest 与 `progress_seq_at_reservation`；该游标是占用前最后一个持久事件的严格连续 `seq`。占用成功后 Host Adapter 才可调用 prompt，禁止先读状态再另写 slot。启动期 blocked 时不得把内容打进确认框：保持 slot 1 未占用，直到解除 blocked、重新核对同一实例后再占用并发送。

slot 一经占用永不回收。Herdr 返回后只能调用 Store 内部 `record_delivery_outcome` CAS mutation；它必须匹配 slot、ordinal、digest 与 Actor epoch，并把 `request_accepted`、Runtime UTC `accepted_at` 或显式错误原子写入同一 journal commit。Herdr accepted 后、outcome commit 前崩溃，或 `reserved` 后恢复没有 outcome，统一投影为 `delivery_uncertain`，slot 已消耗，不得猜“其实没发”。

### 3.2 唯一一次补发

ordinal 2 只在以下条件全部成立时可由 Actor 调用同一个 `reserve_delivery` CAS mutation 占用：

1. ordinal 1 已明确记录 `request_accepted`；发送中崩溃或结果不明不适用补发；
2. 从 ordinal 1 outcome commit 的 durable Runtime UTC `accepted_at` 起，固定 `startup_progress_grace=60s` 已到期，判据为 `now_utc >= accepted_at + 60s`；
3. 自 ordinal 1 的 `progress_seq_at_reservation` 后，尚无 Receipt/Attempt/node 身份链精确匹配的 durable checkpoint，且没有 committed final Result；发送前既有 `node_started`、`attempt_started` 与 Host observation 不算 Agent 进展，无 `attempt_id` 的 `node_started` 永不参与本谓词；
4. 当前 `agent_instance_id`、Host generation 与现场 `terminal_id` 派生的 `host_ref` 均与 dispatch 绑定一致；
5. prompt 可从同一结构工件逐字重建且 digest 相同；
6. slot 2 尚未被占用。

ordinal 2 成功 CAS 是第二次物理投递授权的唯一线性化点。CAS 前已提交的合格进展必须由同一 mutation 观察并拒绝占用；CAS 后才提交的进展不撤销已形成的授权，Host Adapter 仍完成该次调用，并投影为 `progress_after_resend_reserved`。CAS 后、外部调用前崩溃时 slot 已消耗，投影 `delivery_uncertain`。slot 2 消耗后仍无持久进展时进入 `waiting_human`；所有路径均禁止第三次发送、循环重试或并发拉起同一任务 Agent。

v2 工件的 `last_runtime_at` 保存每次 committed Store mutation 观察到的最后 Runtime UTC，只能单调不减。恢复沿用原 `accepted_at`，不重置宽限期；`now_utc < last_runtime_at`、时间无效或任一持久时间回拨均 fail closed 到 `waiting_human`。

Herdr 没有 identity compare-and-send，因此 Host Adapter 必须在每次调用前后复核 Host generation、Agent identity 与 terminal-derived `host_ref`。前后发生变化时，本 slot 记 `delivery_uncertain` 并消耗；系统不得宣称精准投递，也不得因此补第三次。旧 Ticket/Attempt 的迟到 checkpoint/Result 继续受现有 fencing 与身份合同约束。

## 4. 恢复、Role Relay 与副作用边界

- 恢复只读已持久 dispatch 与 slot；不回收、不重编号、不推断未发送。相同恢复请求只能得到同一状态。
- 合格 checkpoint 必须由 Store 内部同一个可恢复 mutation 原子提交 checkpoint 工件、`checkpoint_recorded` event、连续 `seq` 与所需受控时间线；committed final Result 也必须由其 Store commit mutation 同时生成对应 event、连续 `seq` 与时间线。恢复发现 checkpoint/Result 工件与 committed event、连续 `seq` 或 journal 关系不完整时，视为孤立持久进展，立即 `waiting_human` 并禁止任何后续 `reserve_delivery`，不得推断零进展。
- 受控人验投影协议为封闭的 `relay.startup-dispatch-timeline/v2`：顶层只允许 `protocol/attempt_ref/host_ref/prompt_digest/timeline`，ref/digest 必须通过现役安全 validator；`timeline[]` 只允许 `kind/ordinal/at/outcome`，ordinal 只能为整数 1/2，`at` 只能为随 Store mutation 提交的 Runtime UTC RFC3339 时间，outcome 只能为 `accepted/progress_committed/reserved/uncertain/waiting_human/completed`。kind 只允许 `request_accepted/durable_progress/resend_reserved/progress_after_resend_reserved/delivery_uncertain/waiting_human/business_completion`，kind/outcome 组合由 schema 固定。
- ordinal 2 `reserve_delivery` 同 commit 记录 `resend_reserved` 与 reservation `seq`；后续 checkpoint/Result owning mutation 依据自身 progress `seq` 与 reservation `seq` 的全序关系，同 commit 生成 `progress_after_resend_reserved` 或 `durable_progress`。恢复只重放 committed journal/seq；未知字段、枚举或组合必须拒绝，timeline 不得进入公开 event detail、RPC 或 read-model。
- “最多两次投递”不等于任务只执行一次。重复消息要求 Worker从当前 workspace/checkpoint/Result 事实续做，但 Receipt Result 的幂等不替文件、命令或外部系统承诺副作用幂等。
- 普通 Role Relay 继续是 `design/10` 定义的 best-effort 聊天，可补充当前 Node 做法；不得携带或改变 startup dispatch 的任务、授权、Receipt、停止点，不得充当 startup 重发。
- 需要改变目标、范围、验收、Attempt、Agent 或 Node 时，仍走显式控制面；不能用 prompt 重发绕过。

## 5. 正式验收清单

| ID | 类型 | 命题 | 自动证据 / 人判动作 |
|---|---|---|---|
| HC-SD-A1 | 机器证 | 每个 Attempt 只有一个 startup dispatch owner、一个 Host Adapter sender；完整内容取代 production driver 启动/恢复/解除 blocked 三处独立 completion instruction，外围 runner 与 Role Relay 均不能形成第二 sender。 | 生产调用图与静态扫描；第二 sender/旧 completion 路径变异必须红。 |
| HC-SD-A2 | 机器证 | `relay.startup-dispatch/v2` 字段闭集、身份链、source、template version 与 digest 可验证；Runtime 拒绝未实施的 v1；当前 P6 `instruction_ref` 只能解析到仓根内，Ticket 路径只消费冻结字段；双来源、缺失、越界、漂移均拒绝。 | schema、resolver、旧版本拒绝、路径逃逸与输入漂移正反例。 |
| HC-SD-A3 | 机器证 | 私有 runtime 只存白名单结构字段，不存 prompt/workspace/pane/log 正文、环境值、配置值或凭据；formatter 可从同一工件逐字重建，digest 不同或模板不可用时 ordinal 2 拒绝。 | secret fixture、未知字段、模板版本、重建 digest 变异与 Git/evidence 扫描。 |
| HC-SD-A4 | 机器证 | ordinal 1/2 均由 `reserve_delivery` 原子 journal 在发送前 CAS 占用且不可回收，outcome 由匹配 epoch/digest 的 `record_delivery_outcome` 原子提交；accepted、显式错误、超时、mid-send crash、reserved-without-outcome 的恢复结果唯一，任何路径都不能产生第三发。 | 每个 crash point 强杀恢复、并发/重放、journal 冲突和第三发变异。 |
| HC-SD-A5 | 历史命题 | A31 的“所有既有 node_started 均阻止补发”语义标记 `superseded-before-implementation`，不得由实现卡宣称通过。 | 仅保留 A31 历史追踪；由 HC-SD-A8 承接。 |
| HC-SD-A6 | 机器证 | 发送前后身份复核变化时只记 `delivery_uncertain` 并消耗 slot；Herdr accepted、Host 状态、pane 文本、CLI exit 均不投影 delivered/read/executed/Result，业务完成仅认 committed Receipt-bound Result。 | compare-before/after 竞态、状态假阳性和迟到 Result/fencing 回归。 |
| HC-SD-A7 | 机器证 | ordinary Role Relay 不携带或改变 startup task/Authority/Receipt/stop，重复消息固定要求续做而非重开；Result 幂等不被描述为外部副作用幂等。 | Role Relay 边界、重复 prompt 文案和 Result regression。 |
| HC-SD-A8 | 机器证 | v2 的原子 journal、checkpoint/Result 工件与事件原子性、progress cursor、固定 60 秒窗口与 CAS 线性化完整成立；发送前既有 node_started 不封死补发，CAS 前 checkpoint/Result 必阻止，CAS 后进展只形成诚实竞态投影，恢复一致且永无第三发。 | 确定性事件序列覆盖游标缺失/回退、grace 边界、UTC 回拨、accepted-before-outcome-commit crash、CAS 前后进展、孤立 checkpoint/Result、timeline schema/producer、journal 冲突与恢复重放；生产变异逐项见红。 |
| HC-SD-H1 | 历史命题 | A31 的旧时间线语义标记 `superseded-before-implementation`，不得作为人验结论。 | 仅保留 A31 历史追踪；由 HC-SD-H2 承接。 |
| HC-SD-H2 | 人判 | 用户在 5 分钟内查看封闭的 `relay.startup-dispatch-timeline/v2`：发送前 node_started、60 秒后补发、CAS 前 checkpoint 不补发、CAS 后 checkpoint 的 `progress_after_resend_reserved`、delivery uncertain 与 committed Result。 | 用户判断什么时候还能补发、什么时候已禁止、CAS 后哪种窄竞态会完成已授权发送；投影无 prompt、Receipt、路径或敏感正文。 |

## 6. 非目标与止损

本设计不建设可靠聊天队列，不修改 Herdr，不通过内容锚点、`state_change_seq`、quiet period 或额外 Enter 假造 turn acknowledgement，不自动登录或读写账号配置，不运行真实 Agent，不替 DHR_35/P6 出证，也不恢复 Linux/P6-X。

后续 B-adjust 必须把协议/Store slot/Actor CAS/Workflow/Host Adapter/current P6 source/未来 Ticket mapping/测试与安全扫描作为一个不可拆的 heavy 实施单元；若 Herdr 身份无法按本合同复核、私有结构仍需保存自由正文或任一恢复路径可能第三发，必须停止并回到新的 A-adjust，不得降级为启发式重试。
