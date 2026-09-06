<!-- dh:planning-event:v1 id=DHR-A-30 stage=A-full artifact=design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md review=evidence/41-A30-terminal-id-host-ref修订-交叉审核记录.md#review-a30 understanding=evidence/41-A30-terminal-id-host-ref修订-交叉审核记录.md#understanding-a30 -->
# Herdr terminal-instance `host_ref` 与 DSH-off 可验证展示

> 状态：`DHR-A-30` 已完成需求理解对齐、fresh 审核、调整复审与用户整版确认。本文件继续占用 `design/14` 的正式输入路径，并取代 `DHR-A-29` 对“Herdr 会话”的模糊身份定义；它不授权 B-adjust、任务卡、工作区、代码、真实 Agent、凭据读取/写入、verify、合并、推送或部署。
>
> 本文件在 Herdr host-observation 范围内补充 `design/06`、`design/07`、`design/08` 与 `design/12`；未提及的 Result、Receipt、lease、fencing、Profile、fallback 与 Linux 合同保持不变。

## 0. 修订依据

`DHR-A-29` 把 `host_ref` 写成 Herdr“会话”标签，却没有指定 Herdr 提供的真实身份字段。该表述会迫使施工者临场发明一个不存在的 `session_instance_id`，或错误地拿 agent 名、`pane_id`、`detail` 充当身份。

截至 2026-09-06，本机 Herdr stable `0.8.2` 的已安装 schema 与官方 [Socket API](https://herdr.dev/docs/socket-api/) 共同给出的事实是：

- `PaneInfo` 有必填 `terminal_id`；本仓现役 Herdr adapter 的 launch handle 也已经接收该字段。
- Herdr 没有公开名为 `session_instance_id` 的字段。
- `agent_session` 是可选的原生 Agent 对话引用；没有上报时会缺省。它用于 Codex/Claude 等 Agent 自身会话恢复，不是本设计要标识的 Herdr 终端实例。
- Herdr 的 [Session state and restore](https://herdr.dev/docs/session-state/) 明确区分 detach/reattach、server restart 与 Agent conversation resume，但没有给 Relay 一条可据此承诺“冷重启后 terminal identity 必然不变”的更强合同。

因此本设计撤回 `session_instance_id` 路线，并把 `host_ref` 的对象、来源、算法与稳定边界全部冻结到现有 `terminal_id`。

## 1. 目标、对象与精确派生

### 1.1 目标对象

`host_ref` 是**某次宿主观测所关联的 Herdr terminal instance 的脱敏关联标签**，不是 Herdr server session、workspace、tab、pane 位置、Agent 显示名或原生 Agent conversation。

它只回答：“Relay 当前/最近成功观测到的是 Herdr 返回的哪一个 terminal instance？”它不回答：“这是哪个 Codex/Claude 对话？”也不证明该进程仍存活。

### 1.2 唯一来源

唯一权威输入是 Herdr API 返回对象中满足 `typeof terminal_id === "string" && terminal_id.length > 0` 的值。Herdr 0.8.2 没有冻结更窄格式，因此 Relay 不得自行 trim、Unicode normalize、case-fold 或拒绝空白/控制字符；满足该谓词的字符串一律按 Herdr 原值进入 UTF-8 编码，原值本身不进入展示。禁止以下替代或 fallback：

- `pane_id`、workspace/tab/pane 名称或位置；
- agent 名、`executor_ref`、Executor Profile；
- 可选 `agent_session`；
- `detail` 文本、路径、Receipt、Result 或凭据；
- Relay 自造的“session instance”字段。

Herdr 响应缺少 `terminal_id`、类型不是 string 或 string 长度为 0 时，本次成功关联判定必须 fail closed：不得写 `observation_status=alive` 的 `host_observation_changed`，不得退化为 `pane_id`，而应走既有观测丢失/Attention 机制。

### 1.3 唯一算法

实现必须按下式逐字生成，不留算法选择权：

```text
source_bytes = UTF8("dh-relay.host-ref/v1\0" + terminal_id)
host_ref     = "herdr-terminal/sha256-" + lowercase_hex(SHA-256(source_bytes))
```

`host_ref` 因而固定为 `^herdr-terminal/sha256-[0-9a-f]{64}$`。Relay 的事件、read-model、CLI、日志与截图不得保存或展示用于计算的原始 `terminal_id`；内部 Herdr handle 可以为调用 Herdr 而持有它，但不得把 `host_ref` 反解或当作 Herdr 查询参数。

这里的 SHA-256 只提供稳定、不可直接反解的脱敏关联与域隔离，不是授权、认证或保密能力；能枚举候选 `terminal_id` 的本机主体仍可做字典比对。实现使用完整 256-bit 摘要、不截断，也不持久化原始 ID 映射来承诺跨重启碰撞检测；密码学碰撞作为已知的可忽略残余风险保留。若将来出现碰撞证据，必须 fail closed 并另起协议版本，不能覆盖旧绑定或临场加映射表。

## 2. 生命周期与恢复语义

稳定性完全由**本次 Herdr 返回的 `terminal_id` 是否相同**决定，不再使用模糊的“同一会话”判断：

| 场景 | 判据 | `host_ref` 结果 |
|---|---|---|
| 普通轮询 | 返回相同 `terminal_id` | 保持相同 |
| Relay driver 重启并恢复 | 重新查询得到相同 `terminal_id` | 由固定算法重算，结果相同 |
| pane 移动、改名或 agent 改名 | `terminal_id` 未变 | 保持相同；位置/名称不参与计算 |
| terminal 被替换或重建 | Herdr 返回不同 `terminal_id` | 生成新 ref；旧事件不回写 |
| Herdr server 冷重启/快照恢复 | 以重启后 Herdr 实际返回值为准 | 相同则保持，不同则更换；本设计不作更强保证 |
| 查询失败或缺 `terminal_id` | 没有可信输入 | 不得宣称 alive，不得新造 ref |

`executor_ref` 继续是可供 `herdr agent get/attach` 使用的内部/操作 locator；`terminal_id` 是生成和核对 terminal instance 标签的源；`host_ref` 是只读展示标签。三者不得互换。

恢复时不得从旧事件 `detail` 重建 `terminal_id`。driver 必须用既有 `executor_ref` 重新查询 Herdr，读取响应中的 `terminal_id`，再重算并与最后成功的 `host_ref` 对账：相同则延续，不同则记一次 terminal replacement；查询不到则记观测丢失，不能把旧 ref 当查询键。每个 Attempt 必须在 driver 内存/既有事件账中保留最后成功的 `host_ref`；写 alive 观测事件的触发式是“观测状态变化 **或** Herdr 状态变化 **或** `host_ref` 变化”，因此 `working→working` 期间更换 terminal 也必须落账。

## 3. 事件、兼容与展示合同

### 3.1 事件合同

`relay.event/v2` 的封闭字段集新增 nullable/可缺省的 `host_ref`，其值出现时必须符合 §1.3 的固定格式；并追加以下跨事件不变量：

- `observation_status=alive` 必须有非空 `host_ref`。
- `observation_status=observation_lost` 且本 Attempt 先前有成功绑定时，必须携带最后一次成功的 `host_ref`，表示“历史观测”；不得用失败响应或 `detail` 重新计算。
- Attempt 从未成功取得 `terminal_id` 时，`observation_lost` 允许缺省 `host_ref`，CLI 显示“尚无可信 terminal 标签”。单事件 schema 无法证明“先前是否成功”，该条件由事件账 reducer/回放测试承重。
- terminal replacement 产生新 ref；旧事件保留旧 ref，历史账本永不回写。
- `kind != host_observation_changed` 时，`host_ref` 必须缺省或为 `null`；Result、Attention、checkpoint、lease 与控制客户端事件均不得携带该字段的非空值。

原 v0 `relay.host-observation/v1` shape 同批晋级为上述字段与语义的兼容镜像，不另创第二套定义。

### 3.2 原子兼容闭环

这是一次不可拆开的协议变更。后续 B-adjust 只能用**一张 `task_type=heavy` 实施卡**同时承接：

1. `relay.event/v2` 与 v0 mirror；
2. descriptor / capability baseline 与 hash；
3. Herdr launch、observe、reconcile、driver recovery 的写入与对账；
4. event reducer / read-model / CLI 投影；
5. 新旧账本、新旧 capability 客户端与全套变异测试。

禁止按 schema、driver、CLI 分成可各自宣称兼容完成的卡。旧账本缺字段时只显示“legacy 未提供”，不伪造标签。

客户端路径固定为：**保留 `relay.rpc/v1` 及其 `subscribe` 方法，不废止 v1；但 v1 不再沿用与 event schema 脱钩的旧固定 hash。** 本次实施必须让 v1 与 bootstrap/v2 都依据包含新 `relay.event/v2` 的完整 capability baseline 生成/校验新 hash。携带旧固定 v1 hash 的任意请求必须在方法分派和订阅注册之前返回既有 `E_CAPABILITY_MISMATCH`，不得下发任何 event；刷新后携带新 hash 的 v1 客户端继续按原 v1 信封和方法工作。禁止只更新 v2 baseline、却让旧 v1 hash 继续订阅新 event。

### 3.3 DSH-off 展示

CLI/read-model 必须把三类信息分开：

- `host_ref`：用户核对 terminal instance 的脱敏关联标签；alive 标“当前观测”，lost 标“历史观测”。
- `executor_ref`：附着/内部 locator；可以供现有 attach 操作使用，但不得描述为 terminal identity。
- `detail`：诊断文本；不得作为身份来源或对照面。DSH-off 人验的默认安全投影必须省略 `detail`，因为现役值含 `work_dir_root`；若实施仍保留诊断查看能力，只能放在另一个明确命名、由用户主动请求的受控诊断面，不得进入 `HC-HR-H1` 截图或证据。

受控 Herdr 对照面必须用**同一 §1.3 算法**从 Herdr API 的 `terminal_id` 现场计算标签，仅展示计算后的 `host_ref`，不把原始 `terminal_id`、路径、账号、凭据、Receipt 或 Result 写入证据。`HC-HR-H1` 只比较两端安全标签和状态措辞；它不等于 DHR_35 的真实业务闭环。

## 4. 正式验收清单

> `DHR-A-29` 的 `HR-A1`～`HR-A5`、`HR-H1` 不是 harness 可识别的 canonical ID，现一对一退役，由下列 `HC-HR-*` 承接；不伪造旧 ID 已被工具收集或已有实施证据。

| ID | 类型 | 命题 | 自动证据 / 人判动作 |
|---|---|---|---|
| HC-HR-A1 | 机器证 | writer 只接受 `typeof terminal_id === "string" && length > 0`，不 trim/normalize/case-fold，逐字按 §1.3 生成完整 SHA-256 ref；缺字段、错类型、空串、`pane_id` fallback、agent/`agent_session`/路径/Receipt 输入均见红。 | 含空白/Unicode 的算法 golden vectors、schema 正反例、来源变异。 |
| HC-HR-A2 | 机器证 | 相同 `terminal_id` 在轮询和 driver 恢复后 ref 相同；不同 `terminal_id` 换 ref；pane/agent 名变化不影响；冷重启只按返回 ID 裁决；状态不变但 ref 变化也必须落 replacement 事件。 | Herdr fixture 事件账、恢复与 `working→working` replacement 变异。 |
| HC-HR-A3 | 机器证 | alive 必有 ref；有历史绑定的 lost 保留最后 ref；从未绑定的 lost 不伪造；旧事件不回写。 | reducer/回放测试，含初始失败与 lost→recover→replace 全序列。 |
| HC-HR-A4 | 机器证 | event/v0 mirror、descriptor/hash、writer/recovery/read-model/CLI 在同一 heavy 卡原子闭合；v1 与 bootstrap/v2 都校验含新 event 的完整 hash，旧固定 v1 hash 在分派/订阅前收到 `E_CAPABILITY_MISMATCH` 且零推送，刷新后的 v1 客户端继续工作，旧账本只显示 legacy 缺省。 | v1/v2 capability 握手、旧 hash 订阅零推送、新旧账本双读及整卡回归。 |
| HC-HR-A5 | 机器证 | CLI 明分当前/历史/尚无标签，DSH-off 安全投影不含 `detail`，`executor_ref` 只作 locator；非观测事件拒绝非空 `host_ref`，且该字段不改变 Result、run_status、Attention、lease、fencing、Profile、账号或 fallback。 | CLI/read-model 与 schema 负例测试，以及既有 Receipt/lease/状态回归。 |
| HC-HR-H1 | 人判 | 用户查看 DSH-off 安全投影与受控 Herdr 对照面中的同一脱敏 ref，能区分当前、历史与尚无标签，且未见原始 `terminal_id`、`detail`、路径或敏感信息。 | 独立人验节点展示终端/截图；用户在对话中判断。 |

## 5. 范围与退场

本设计不授权 B-adjust、任务卡、代码、真实 Agent、用户 registry、凭据读写、DHR_35 复跑、Linux/P6-X、verify、合并、推送或部署；DHR_72、DHR_74、DHR_75、DHR_76 与 DHR_35 的既有状态、依赖和证据归属均不改变。

若实施无法从 Herdr 响应取得非空 `terminal_id`，不能完成协议原子兼容闭环，或受控对照必须暴露原始/敏感值，则停止并回到新的 A-adjust；不得退化到 `pane_id`、`agent_session`、`executor_ref` 或 `detail`。
