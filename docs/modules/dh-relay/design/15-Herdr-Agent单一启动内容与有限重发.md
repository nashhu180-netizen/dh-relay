<!-- dh:planning-event:v1 id=DHR-A-31 stage=A-full artifact=design/15-Herdr-Agent单一启动内容与有限重发.md review=evidence/42-A31-单一启动内容与有限重发-交叉审核记录.md#review-a31 understanding=evidence/42-A31-单一启动内容与有限重发-交叉审核记录.md#understanding-a31 -->
# Herdr Agent 单一启动内容与有限重发

> 状态：`DHR-A-31` 已完成需求理解对齐、fresh 审核、两轮定向复审与用户整版确认。本文件是 `design/README.md` `designInputs[]` 的正式输入，只冻结产品合同；不授权 B-adjust、DevPlan/任务卡、代码、真实 Agent、DHR_35/P6 收口、Linux、verify、合并、推送或部署。
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

每个 Attempt 在 ignored `runtime/<run_id>/` 中持久化一个版本化 `relay.startup-dispatch/v1` 结构工件。字段闭集为：

- `protocol`、`template_version`；
- `run_id`、`generation`、`node_id`、`pair_id`（适用时）、`attempt_id`、`agent_instance_id`；
- Ticket/Receipt identity refs；
- `worktree`、`workspace`、`instruction_ref`、`stop_after`；
- `host_generation`、脱敏 `host_ref`；
- `prompt_digest`；
- ordinal 1/2 的 slot、请求时间与结果枚举。

禁止任意自由文本、展开的 brief/task_plan/workspace 内容、普通聊天、pane/log/output、环境值、账号配置值、凭据值和未知字段。`receipt_id` 只允许存在于 `design/12` 已批准的私有 Run Store/受控启动内容和本机 RPC；Git 工件、公开日志、截图及证据继续只保留摘要关联符。

prompt UTF-8 字节串只由 `template_version + 上述冻结字段` 按版本化确定性 formatter 生成；不持久化 prompt body。ordinal 2 必须从同一个 dispatch 工件重建并重新计算 digest，逐字相同才可继续。模板版本不可用、来源已漂移、字段不合规、无法重建或 digest 不同，均禁止补发并进入 `waiting_human`。这条安全拒绝不能留给施工期临场决定。

## 3. 两个不可回收 delivery slot

### 3.1 首次投递

Host 完成 Agent ready/blocked 观测并取得当前实例身份后，由 HostSessionActor 以 CAS 持久占用 ordinal 1；占用成功后 Host Adapter 才可调用 prompt。启动期 blocked 时不得把内容打进确认框：保持 slot 1 未占用，直到解除 blocked、重新核对同一实例后再占用并发送。

slot 一经占用永不回收。API 返回 accepted 时记录 `request_accepted`；显式错误、超时、进程崩溃或占用后没有 durable outcome 时，该 slot 仍已消耗。`reserved` 后恢复发现没有 outcome，统一投影为 `delivery_uncertain`，不得猜“其实没发”。

### 3.2 唯一一次补发

ordinal 2 只在以下条件全部成立时可由 Actor CAS 占用：

1. ordinal 1 已明确记录 `request_accepted`；发送中崩溃或结果不明不适用补发；
2. Resolved Plan/Ticket 冻结的有限 `startup_progress_grace` 已到期；
3. 尚无同 Attempt 的 durable `node_started`、checkpoint 或 final Result；
4. 当前 `agent_instance_id`、Host generation 与现场 `terminal_id` 派生的 `host_ref` 均与 dispatch 绑定一致；
5. prompt 可从同一结构工件逐字重建且 digest 相同；
6. slot 2 尚未被占用。

满足后只向同一 Agent 原样补发一次。任何 durable 进展出现即永久禁止补发；身份不可证/变化、发送中崩溃、slot 状态不可证或重建不一致，均直接进入 `waiting_human`。slot 2 消耗后仍无持久进展，同样进入 `waiting_human`，禁止第三次发送、循环重试或并发拉起同一任务 Agent。

Herdr 没有 identity compare-and-send，因此 Host Adapter 必须在每次调用前后复核 Host generation、Agent identity 与 terminal-derived `host_ref`。前后发生变化时，本 slot 记 `delivery_uncertain` 并消耗；系统不得宣称精准投递，也不得因此补第三次。旧 Ticket/Attempt 的迟到 checkpoint/Result 继续受现有 fencing 与身份合同约束。

## 4. 恢复、Role Relay 与副作用边界

- 恢复只读已持久 dispatch 与 slot；不回收、不重编号、不推断未发送。相同恢复请求只能得到同一状态。
- “最多两次投递”不等于任务只执行一次。重复消息要求 Worker从当前 workspace/checkpoint/Result 事实续做，但 Receipt Result 的幂等不替文件、命令或外部系统承诺副作用幂等。
- 普通 Role Relay 继续是 `design/10` 定义的 best-effort 聊天，可补充当前 Node 做法；不得携带或改变 startup dispatch 的任务、授权、Receipt、停止点，不得充当 startup 重发。
- 需要改变目标、范围、验收、Attempt、Agent 或 Node 时，仍走显式控制面；不能用 prompt 重发绕过。

## 5. 正式验收清单

| ID | 类型 | 命题 | 自动证据 / 人判动作 |
|---|---|---|---|
| HC-SD-A1 | 机器证 | 每个 Attempt 只有一个 startup dispatch owner、一个 Host Adapter sender；完整内容取代 production driver 启动/恢复/解除 blocked 三处独立 completion instruction，外围 runner 与 Role Relay 均不能形成第二 sender。 | 生产调用图与静态扫描；第二 sender/旧 completion 路径变异必须红。 |
| HC-SD-A2 | 机器证 | `relay.startup-dispatch/v1` 字段闭集、身份链、source、template version 与 digest 可验证；当前 P6 `instruction_ref` 只能解析到仓根内，Ticket 路径只消费冻结字段；双来源、缺失、越界、漂移均拒绝。 | schema、resolver、路径逃逸与输入漂移正反例。 |
| HC-SD-A3 | 机器证 | 私有 runtime 只存白名单结构字段，不存 prompt/workspace/pane/log 正文、环境值、配置值或凭据；formatter 可从同一工件逐字重建，digest 不同或模板不可用时 ordinal 2 拒绝。 | secret fixture、未知字段、模板版本、重建 digest 变异与 Git/evidence 扫描。 |
| HC-SD-A4 | 机器证 | ordinal 1/2 均由 Actor 在发送前 CAS 占用且不可回收；accepted、显式错误、超时、mid-send crash、reserved-without-outcome 的恢复结果唯一，任何路径都不能产生第三发。 | 每个 crash point 强杀恢复、并发/重放和第三发变异。 |
| HC-SD-A5 | 机器证 | ordinal 2 只在第一次明确 accepted、有限 grace 到期、零 durable progress、同一身份/Host/terminal-derived ref、同 digest 时发送；已有 node_started/checkpoint/Result、身份不可证/变化、结果不明或 slot 不可证均不补发。 | Codex/Claude fake 序列、身份替换、已有进展和恢复负例。 |
| HC-SD-A6 | 机器证 | 发送前后身份复核变化时只记 `delivery_uncertain` 并消耗 slot；Herdr accepted、Host 状态、pane 文本、CLI exit 均不投影 delivered/read/executed/Result，业务完成仅认 committed Receipt-bound Result。 | compare-before/after 竞态、状态假阳性和迟到 Result/fencing 回归。 |
| HC-SD-A7 | 机器证 | ordinary Role Relay 不携带或改变 startup task/Authority/Receipt/stop，重复消息固定要求续做而非重开；Result 幂等不被描述为外部副作用幂等。 | Role Relay 边界、重复 prompt 文案和 Result regression。 |
| HC-SD-H1 | 人判 | 用户在 5 分钟内查看首次投递、同身份一次补发、已有进展不补发、身份变化或 mid-send crash 转 `waiting_human`、committed Result 收口的同一时间线，能区分 request accepted、无持久进展、delivery uncertain 与业务完成。 | 独立人验节点展示安全投影；用户判断操作语义清楚且没有第三发或敏感正文。 |

## 6. 非目标与止损

本设计不建设可靠聊天队列，不修改 Herdr，不通过内容锚点、`state_change_seq`、quiet period 或额外 Enter 假造 turn acknowledgement，不自动登录或读写账号配置，不运行真实 Agent，不替 DHR_35/P6 出证，也不恢复 Linux/P6-X。

后续 B-adjust 必须把协议/Store slot/Actor CAS/Workflow/Host Adapter/current P6 source/未来 Ticket mapping/测试与安全扫描作为一个不可拆的 heavy 实施单元；若 Herdr 身份无法按本合同复核、私有结构仍需保存自由正文或任一恢复路径可能第三发，必须停止并回到新的 A-adjust，不得降级为启发式重试。
