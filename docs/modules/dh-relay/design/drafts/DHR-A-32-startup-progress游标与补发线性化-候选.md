<!-- dh:planning-no-event:v1 artifact="design/drafts/DHR-A-32-startup-progress游标与补发线性化-候选.md" reason="DHR-A-32 候选形成史；正式合同已晋级 design/15，本稿不参与 designInputs" -->
# DHR-A-32：startup progress 游标与补发线性化（形成史）

> 状态：**形成史 · 不参与正式输入**。用户已选择“ordinal 2 CAS 成功即形成不可撤销发送授权”的方案 A，并于 2026-09-07 整版确认；正式合同已晋级 [`design/15`](../15-Herdr-Agent单一启动内容与有限重发.md)。本稿只保留形成过程，不授权 B-adjust、DevPlan、任务卡、代码、真实 Agent、DHR_35 重跑、verify、合并、推送或部署。

## 1. 人话目标与现场事实

用户确认的行为是：第一次 prompt 已明确 accepted 后，如果同一已核身份 Agent 在有限宽限期内没有新持久进展，则逐字相同补发一次；发送前已有的调度事实不应让补发永远不可达，ordinal 2 CAS 前已提交的 checkpoint/Result 必须阻止补发。用户随后明确选择方案 A：ordinal 2 CAS 成功即形成不可撤销发送授权，CAS 后才提交的进展不撤销这次已授权发送，但必须诚实显示先后关系。

现役 P6 的事实是：`workflow-driver.mjs::openAttempt()` 在调用 Herdr prompt 前就写 `node_started`，且该事件没有 `attempt_id`。DHR_35 脱敏成功 Claude 实录 `prompt-diagnosis-20260906T0200Z-pwsh/.../events.jsonl` 中，`node_started`/`attempt_started` 在 `02:07:48Z`，首次 Host observation 在 `02:07:55Z`，首个 checkpoint 在 `02:08:12Z`。若按 `design/15` 当前“已有同 Attempt node_started”作全历史判断，ordinal 2 永远不可达。该证据只使用 `kind/seq/at/has_attempt`，不使用 Receipt、Attempt、terminal 或路径值。

另一个不可消除的事实是：Store CAS 与外部 Herdr prompt API 不能组成原子事务。若把 Host Adapter 的外部调用放进 HostSessionActor 单写队列，会重新阻塞 lease/heartbeat；因此必须明确“补发资格在哪一刻被原子决定”，不能假装 Store 进展与外部发送可以 compare-and-send。

## 2. 修订合同

### 2.1 v2 工件与 ordinal 1 进展游标

本修订把尚未实施的 `relay.startup-dispatch/v1` 设计退役为 pre-implementation draft，正式实施版本改为 `relay.startup-dispatch/v2`；Runtime 必须拒绝 v1，不做迁移或兼容读取。v2 的 ordinal 1 slot 增加 `progress_seq_at_reservation`。

HostSessionActor 占用 ordinal 1 时，必须调用 Store 内部单一的 `reserve_delivery` CAS mutation，在同一个 prepared/committed journal 中原子保存 slot=`reserved`、ordinal、Actor lease/epoch、dispatch/prompt digest 与 `progress_seq_at_reservation`；该游标是占用前最后一个已持久事件的严格连续 `seq`。CAS 前置不成立、读取不到唯一连续序号、序号回退或已有冲突值时，不占用 slot、不调用 Herdr，进入 `waiting_human`。禁止先 `readState` 再另写 slot。

`node_started`、`attempt_started` 或 Host observation 若在该游标之前已经存在，只是发送前调度/准备事实，不属于本次投递后的 Agent 进展，不阻止 ordinal 2。不得用墙钟、文件 mtime、Host 状态、pane 文本或内存采样代替该游标。

合格 checkpoint 必须由 Store 内部同一个可恢复 mutation 原子提交 checkpoint 工件、对应 `checkpoint_recorded` event/连续 `seq`，并按 §2.5 的规则同时生成所需 timeline 条目；committed final Result 也必须由其 Store commit mutation 同时生成对应 event/连续 `seq` 与 timeline 条目。恢复若看到 checkpoint/Result 工件存在但对应 committed event、连续 `seq` 或 journal 关系缺失，统一视为孤立持久进展：立即 `waiting_human`，禁止任一后续 `reserve_delivery`，不得以“事件不可见”推断零进展。旧的非原子写入路径不得作为 v2 资格依据。

Herdr 返回后，HostSessionActor 只可调用 Store 内部 `record_delivery_outcome` CAS mutation：输入必须匹配 reserved slot、ordinal、dispatch/prompt digest 与 Actor epoch。`request_accepted` 与 Runtime UTC `accepted_at` 在同一 journal commit；显式错误也原子记录 outcome。Herdr accepted 后、outcome commit 前崩溃统一恢复为 `reserved-without-outcome → delivery_uncertain`，slot 已消耗、禁止 ordinal 2；不得猜 accepted 与否。

### 2.2 “无持久进展”的唯一谓词

ordinal 1 明确持久记录 `request_accepted` 后，以同一 outcome commit 的 durable Runtime UTC `accepted_at` 起算 `startup_progress_grace=60s`；到期判据为 `now_utc >= accepted_at + 60s`。v2 工件以字段 `last_runtime_at` 保存每次 committed Store mutation 观察到的最后 Runtime UTC，mutation 只能令其单调不减。恢复继续使用同一 `accepted_at`，不重置宽限期；`now_utc < last_runtime_at`、时间无效或任一持久时间回拨时 fail closed 到 `waiting_human`。到期时，HostSessionActor 调用 Store 内部单一 `reserve_delivery` CAS mutation 占用 ordinal 2，并在该 mutation 内检查：

1. ordinal 1 的 `progress_seq_at_reservation` 合法；
2. 没有 `seq > progress_seq_at_reservation`、且 Receipt/Attempt/node 身份链精确匹配的 durable checkpoint；无 `attempt_id` 的 `node_started` 永不作为本谓词输入；
3. 当前 Attempt 没有 committed final Result；
4. `design/15` 已冻结的 first accepted、同 identity/Host/host_ref、同 digest 与 slot 2 未占用条件仍全部成立。

只有全部成立，ordinal 2 才能被占用。任何在 ordinal 2 CAS **之前**提交的合格进展都必须被同一 Store mutation 观察到并拒绝占用；恢复时重放同一序列得到同一结论。

### 2.3 用户选择的线性化点与不可消除竞态

ordinal 2 的成功 CAS 是“是否允许第二次物理投递”的唯一线性化点。不得把 Herdr 外部调用放进 Actor 单写队列，也不得为追求跨系统原子性阻塞 lease/heartbeat。

- CAS 前已提交的进展：禁止占用、禁止补发。
- CAS 后才提交的进展：不能撤销已占用的 slot；Host Adapter 仍完成这一次已授权调用，最多两发上限不变。安全投影必须把这种顺序显示为 `progress_after_resend_reserved`，不能谎称“已有进展仍主动决定补发”。
- CAS 后、外部调用前崩溃：slot 已消耗，按既有 `delivery_uncertain`，不得补第三次。

这是 Store 与 Herdr 两个系统之间的显式一致性边界，不承诺“进展出现”与外部发送全局原子。若未来 Herdr 提供 identity/progress compare-and-send，只能另起协议版本，不能在 v2 静默改变线性化点。

### 2.4 delivery mutation 恢复表

| 持久状态 | 唯一恢复投影 | 后续动作 |
|---|---|---|
| slot absent | 尚未占用 | 仅在全部前置成立时可执行对应 ordinal 的 `reserve_delivery` |
| `reserved` 且无 outcome | `delivery_uncertain` | slot 消耗；ordinal 1 不得触发 ordinal 2，ordinal 2 不得第三发；`waiting_human` |
| ordinal 1 `request_accepted` | 已接受请求，不代表交付/执行 | 使用同一 `accepted_at` 与 progress cursor 等待 60 秒并重放资格谓词 |
| 任一 ordinal 显式错误/超时 | 明确失败，slot 消耗 | `waiting_human`；不得回收或重复 ordinal |
| ordinal 2 CAS committed、调用未得 outcome | 已形成发送授权但结果不明 | `delivery_uncertain`；不得第三发 |
| checkpoint/Result 工件存在，但对应 committed event、连续 `seq` 或 journal 关系缺失 | 孤立持久进展、不可证 | 禁止 `reserve_delivery`；不修补、不猜零进展；`waiting_human` |
| dispatch/slot journal 冲突、缺字段、未知版本、cursor 不连续或 Runtime 时间回拨 | 不可证 | 不修补、不迁移；`waiting_human` |

### 2.5 安全投影与验收 ID 迁移

`relay.startup-dispatch/v2` 仍不保存 prompt body、workspace 正文、pane/log/output、环境/配置或凭据值。受控人验投影使用封闭的 `relay.startup-dispatch-timeline/v2`，其 schema 为：

- 顶层只允许 `protocol/attempt_ref/host_ref/prompt_digest/timeline`；`protocol` 必须等于该协议字面量，三个 ref/digest 均为既有安全派生值，类型为非空字符串且分别通过现役 ref/digest validator，禁止正文或自由文本。
- `timeline[]` 只允许 `kind/ordinal/at/outcome`；`ordinal` 只能是整数 `1` 或 `2`；`at` 只能是 Runtime 产生并已随 Store mutation 持久提交的 UTC RFC3339 时间戳；`outcome` 只能为 `accepted/progress_committed/reserved/uncertain/waiting_human/completed`。
- `kind` 封闭为 `request_accepted/durable_progress/resend_reserved/progress_after_resend_reserved/delivery_uncertain/waiting_human/business_completion`，且 kind/outcome 合法组合由 schema 固定，禁止任意字符串。

`reserve_delivery` 提交 ordinal 2 时同时记录 `resend_reserved` 条目及其 reservation `seq`。之后 checkpoint 或 Result 的 owning Store mutation 若观察到自身 progress `seq` 大于该 reservation `seq`，必须在同一 journal commit 生成 `progress_after_resend_reserved`；否则只生成 `durable_progress`。恢复只按 committed journal 与这两个 `seq` 的全序关系重放，必须得到相同条目，不得另读墙钟、pane 或自由文本补写。未知字段、枚举或组合必须拒绝，timeline 不得写入 `relay.event/v2.detail`，也不得扩展公开 event/RPC/read-model。

`HC-SD-A5` 与 `HC-SD-H1` 保留为 A31 历史命题并标 `superseded-before-implementation`，不得由实现卡宣称通过；二者分别由新 ID `HC-SD-A8` 与 `HC-SD-H2` 承接。没有 v1 runtime 工件或既有消费者，因此不存在运行时迁移，只保留设计追踪映射。

## 3. 验收清单

### AI 自动验收栏

| ID | 命题 | 自动证据 |
|---|---|---|
| HC-SD-A8 | `relay.startup-dispatch/v2` 的 `reserve_delivery`/`record_delivery_outcome` 原子 journal、checkpoint/Result 工件与事件原子性、progress cursor、60 秒窗口与用户选择的 CAS 线性化语义完整成立；发送前既有 `node_started` 不会封死补发，CAS 前 checkpoint/Result 必阻止，CAS 后进展只产生诚实竞态投影，恢复结果一致且永无第三发。 | 确定性事件序列覆盖 pre-existing node_started、游标缺失/回退、grace 边界、UTC 回拨、accepted-before-outcome-commit crash、CAS 前 checkpoint/Result、孤立 checkpoint/Result、CAS 后 checkpoint、CAS 后崩溃、timeline schema/producer、journal 冲突与恢复重放；生产变异逐项见红。 |

### 人类验收栏

| ID | AI/用户动作 | 展示证据 | 用户判断 |
|---|---|---|---|
| HC-SD-H2 | AI 生成 `relay.startup-dispatch-timeline/v2` 脱敏受控时间线，用户在 5 分钟内查看。 | 发送前 node_started + 60 秒后补发、CAS 前 checkpoint 不补发、CAS 后 checkpoint 的 `progress_after_resend_reserved`、delivery uncertain、committed Result；无 prompt/Receipt/路径/敏感正文。 | 判断“什么时候还能补发、什么时候已经禁止、CAS 后哪种窄竞态会完成已授权发送”是否清楚可用。 |

## 4. 不变边界

- 不改变“同一完整内容、最多两次物理投递”；不承诺 exactly-once execution。
- 不改变唯一 owner/sender、身份前后复核、Receipt-bound Result、lease/fencing、Role Relay、host_ref 或安全边界。
- 不实现 Ticket/PlanHome/P7，不运行真实 Agent，不替 DHR_35 出证。
- A32 正式晋级后，DHR-B-47 必须重新调用 resolver，只消费更新后的正式 `designInputs[]`，再做定向复审与用户确认。
