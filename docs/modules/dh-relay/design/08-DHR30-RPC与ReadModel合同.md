<!-- dh:planning-event:v1 id=DHR-A-14 stage=A-full artifact=design/08-DHR30-RPC与ReadModel合同.md review=evidence/10-DHR30-Runtime服务与CLI合同-交叉审核记录.md#review-a14 understanding=evidence/10-DHR30-Runtime服务与CLI合同-交叉审核记录.md#understanding-a14 -->
# DHR_30 RPC、Read Model 与操作账本合同

> 状态：正式设计输入。本文件是 [07-DHR30-Runtime服务.md](./07-DHR30-Runtime服务.md) 的可施工
> 补充；它不改变用户确认的边界，也不包含 DHR_31 的 workflow / Process / executor。

## 1. 唯一的合同落点

DHR_30 同批新增 `relay.rpc-methods/v1`（参数、结果、error data）和
`relay.client-read-model/v1`（列表、状态、详情、订阅快照）。它们与既有七份冻结协议一同进入
capability manifest；修改后同批重算 capability baseline、fixture manifest 与独立校验器。
`relay.rpc/v1` 的顶层 envelope 保持不变，但 `params`/`result` 不再是开放对象：按 method 引用
上述 schema，未知字段一律 `E_UNKNOWN_FIELD`。

CLI 映射固定如下：

| CLI | RPC method / params | Read Model |
|---|---|---|
| `list` | `listRuns { include_legacy }` | `run_list` |
| `status <run_id>` | `inspectRun { run_id, view: "status" }` | `run_status_view` |
| `inspect <run_id>` | `inspectRun { run_id, view: "detail" }` | `run_detail_view` |
| `events <run_id> --follow` | `subscribe { run_id, after_seq? }` | `event_stream_snapshot` + event frames |
| `start` | `start { run, request }` | `operation_receipt` |
| `stop` / `resume` | `control { run_id, action, request }` | `operation_receipt` |

`run_list` 只含 `run_id/source/read_only/run_status/group/updated_at`；不得偷塞 `node_states`。
`run_status_view` 额外含现有 DHR_51 宿主三态 `host/host_detail`、账面状态摘要与 event count；
`run_detail_view` 才包含完整 `relay.run-state/v1`。v2 均从 Runtime 生成，legacy 仅依据
`.dh-runtime/relay/` 可读事实投影，统一带 `source:"legacy-v1"`、`read_only:true` 和
`control_actions:[]`。任何 legacy control（包括未来 action）返回 `E_LEGACY_READ_ONLY`；
`subscribe` 对 legacy Run 同样返回 `E_LEGACY_READ_ONLY`——legacy 现场没有 v2 事件流可订，
这不是「Run 不存在」也不是「服务未就绪」（DHR_30 F-010 回写）。

`relay.rpc-methods/v1` 的字段级定义如下（所有对象 `additionalProperties:false`；文中未标
optional 的字段均 required，optional 字段缺省按表内 default 补入后才参与业务）：

| method | params | result |
|---|---|---|
| `listRuns` | `include_legacy:boolean=false` | `{protocol:"relay.client-read-model/v1",view:"run_list",items:RunSummary[]}` |
| `inspectRun` | `run_id:identifier, view:"status"\|"detail"` | `{protocol,view,source,read_only,status:RunStatusView\|null,detail:relay.run-state/v1\|null}`；status/detail 二者恰一非 null |
| `subscribe` | `run_id:identifier, after_seq:integer>=0\|null=null` | `{protocol,view:"event_stream_snapshot",run_id,snapshot:RunStatusView,snapshot_seq:integer>=0,next_seq:integer>=snapshot_seq}` |
| `start` | `run:relay.run/v2` | `{receipt:relay.launch-receipt/v2}` |
| `control` | `run_id:identifier, action:"stop"\|"resume"` | `{receipt:relay.launch-receipt/v2}` |
| `contracts` | 本稿 §2 的四字段 | `{descriptor_version,repo_id,endpoint,generation,runtime_version,capability_hash,state:"ready"}` |
| `validate` | `contract_id:identifier, document:object` | `{valid:boolean,reason:reason_code\|null}` |

`RunSummary` 精确字段为 `run_id/source/read_only/run_status/group/updated_at`；`RunStatusView` 为
`run_id/source/read_only/host/host_detail/ledger/events`，其中 `ledger` 是
`run_status/group/progress/updated_at/state_signature` 或 null，`events` 是 integer 或 null。所有
legacy `RunStatusView` 的 `host/host_detail/ledger/events` 允许 null，绝不从 v1 events 猜值。
RPC error response 一律为 `{reason:reason_code,receipt:relay.launch-receipt/v2|null}`：validation、
identity、cursor、legacy 和 operation 失败都保持连接；只有坏帧/非法顶层 envelope 断连接。

## 2. 连接、授权与端点

`endpointForRepo(canonicalRepoRoot)` 是唯一 endpoint 计算：`SHA-256(UTF-8(canonicalRepoRoot))`
小写 hex。Windows canonical root = 解析后的绝对路径、盘符/普通路径不区分大小写、UNC 保留
server/share；Linux canonical root = realpath。Windows pipe 名为 `dh-relay-<hash>`；Linux socket
位于用户私有 runtime directory 的 `<hash>.sock`，不是项目目录，权限 owner-only。

项目 descriptor 的固定落点为 `<repo>/.dh-relay/runtime.json`，公开最小 schema 是：
`descriptor_version:1, repo_id:"sha256:<hash>", endpoint:{kind:"pipe"|"unix",address:string},
generation:uuid, runtime_version:string, capability_hash:sha256, state:"ready"`；`pid` 不进入身份或
回收判断。descriptor 目录权限沿业务仓既有 ACL；它不含 credential。用户私有 credential 与
`pending-operations.json` 目录为 owner-only。**pending 落点（DHR_30 定稿，2026-08-28 用户裁决）**：
`<repo>/.dh-relay/private/pending-operations.json`，连同其锁文件与临时文件同住 `private/` 独立
子目录——该子目录 owner-only（POSIX 目录 0700 / 文件 0600；Windows 以 DACL 仅授当前用户，设不上
即 fail-closed），与沿业务仓 ACL 的 descriptor 根目录分层隔离，两侧权限要求互不冲突。transport 的现有随机 `localEndpoint()` 仅保留测试
seam；DHR_30 service/launcher 一律改用 `endpointForRepo()`。

客户端**不信任 descriptor 指定的 endpoint**：自行从 cwd/repo root 推导 endpoint，再将 descriptor
的 `descriptor_version/repo_id/endpoint/generation/runtime_version/capability_hash/state` 与推导值逐字
比较。只有 endpoint 相等且 `state=ready` 才可连接。于是被篡改的项目 descriptor 无法把凭据导向
别的 endpoint。

service 取得 endpoint bind 后才读取或创建持久 local-user capability；失败候选绝不碰 credential。
UDS `EADDRINUSE` 时先以无凭据探测：活 owner 存在则复用，明确无 listener 才由同一 bind 流程
unlink 后重试一次；第二次竞争失败则重新探测，永不盲删。Windows 不删 pipe。`runtime.json`
以原子 rename 只在 RPC/ledger/credential 全部 ready 后发布；服务退出不删它。

正式 service 不调用 `localEndpoint()`，也不使用其无条件 UDS close-unlink 语义。DHR_30 在
transport 中新增 owner-aware close：仅 endpoint 仍由本 service generation 持有、且重新 bind 前未
出现新 owner 时才清理残留；新 service 已 bind 后旧 close continuation 只能关闭自己的句柄，不能
unlink 该路径。

连接状态机为 `handshake-valid -> contracts-pending -> authorized -> closed`。`contracts` 必须是连接
唯一首请求，其 params 为：

```json
{
  "descriptor_version": 1,
  "repo_id": "sha256:<canonical-root>",
  "generation": "uuid",
  "local_user_capability": "opaque-private-value"
}
```

响应返回 descriptor 的全部公开字段。成功前任何其他 method 返回 `E_CLIENT_NOT_AUTHORIZED`；
身份/代次不符返回 `E_SERVICE_IDENTITY_MISMATCH`。capability 只在推导 endpoint 已连接后发出，
不会写入项目文件、日志、fixture、设计或 commit。

客户端身份也持久在当前用户私有目录：`client.json` 含稳定 `client_id`；每次 mutating command
先原子写 `pending-operations.json`（完整 request、request_id、digest），成功/确定失败后标完成。
CLI 在新进程、断线或 service restart 后重试同一 pending record，Bridge/Pi 必须保存同一 identity
与 request record；新操作才产生新 request_id。

## 3. JCS、幂等键与 operation ledger

所有 `request_digest` **直接复用** `tools/canonical.mjs` 的 RFC 8785 JCS：先克隆完整
`relay.rpc/v1` request envelope 并从其 `handshake` 副本移除 `request_id`，再对该对象调用
`digestExcluding(..., ["id"])`，输出小写 SHA-256。不得把 `handshake.request_id` 当顶层排除键，
不得另造键序/数字/Unicode 规则。幂等键序列化为 JCS 的
`{client_id,request_id,method}`，并与 digest 共同保存；因此既符合既有 launch-receipt 口径，又实现
用户确认的复合键。相同 key+digest 合并到同一 Receipt；相同 key 不同 digest =
`E_REQUEST_CONFLICT`，绝不执行第二次。

`<repo>/.dh-relay/runtime-operations.json` 是 start 与 control 的唯一 service ledger，最小记录为：

```json
{
  "version": 1,
  "operations": {
    "<jcs-key>": {
      "client_id": "identifier",
      "request_id": "identifier",
      "method": "start|control",
      "request_digest": "sha256",
      "run_id": "R001-topic-20260823",
      "phase": "accepted|run_id_reserved|store_created|actor_ready|receipt_committed|failed",
      "receipt_id": "identifier",
      "reason": null
    }
  },
  "next_seq": 42
}
```

ledger 只由已 bind 的 service 在单一 async queue 写入，写入为 temp file write+fsync、atomic rename、
directory fsync；每一阶段的恢复如下：

| 崩溃时 phase | 恢复动作 | 重试返回 |
|---|---|---|
| `accepted` | 继续 reserve，同一 key 不重开号 | `in_flight` 或最终 Receipt |
| `run_id_reserved` | 检查对应根，不存在则用保留号建 Store | 同一 run_id |
| `store_created` | 打开 Store，建立 actor | 同一 run_id |
| `actor_ready` | 将 Receipt 写入 Run Store 后提交 ledger | 同一 Receipt |
| `receipt_committed` | 直接读取/返回 Receipt | 同一 Receipt |
| `failed` | 不重新执行 | 同一 failed Receipt |

`next_seq` 的 seed 取**所有 run-id 形态的目录名（含建到一半的残缺根）**、ledger 保留号与
`runs.json` 本仓最大号三者的最大值——半成品目录同样意味着该号已发出，只算「完整 v2 Run 根」
会把它漏掉、下一个 Run 撞进半成品目录（DHR_30 F-008 回写：保守 seed 正确且必要）。service
独占队列中先把 `next_seq+1` 与 operation key 原子写为 `run_id_reserved`，再创建 Store。Run 根
已存在而 ledger 不在时作为孤儿 Store fail-closed 并进入 discovery report；不得静默覆盖。
**孤儿投影语义（DHR_30 F-009 回写）**：fail-closed 指「拒绝一切写入与 actor 建立」，不是「从
Read Model 隐藏」——Run Store 才是 Run 真相，索引缺失不得否定事件账已发生的事实；孤儿 Run
仍以 `source:"runtime-v2"`、`read_only:true` 进入 list/status/inspect/subscribe（只读可订），
一切 control 以 `E_ORPHAN_STORE_READ_ONLY` 拒绝，其号计入 seed 绝不重发。`runs.json` 是跨仓发号索引，
在 Store/ledger 对账后、仍持既有全局 `<runs.json>.lock` 时修复，永远不是 Run 或 Receipt 真相；
跨仓 service 只在该锁内读改写索引，避免丢失其他仓 segment。

`relay.launch-receipt/v2` 同批扩展为 operation Receipt：新增 `client_id`、`method`、
`state: in_flight|committed|failed`、可空 `reason`；`kind` 保持 start/stop/resume。新增事件 kind
`operation_accepted/operation_committed/operation_failed`，其现有 event `detail` 严格改为
`operation:<receipt_id>:<request_digest>:<state>`，同批将该格式和 kind 条件写入
`relay.event/v2`，且不包含 capability。`relay.launch-receipt/v2` 新字段规则为：`client_id/method/state`
required；`reason` 仅 `failed` 时为 reason_code、否则 null；`node_id/attempt_id` 对 DHR_30 operation
恒为 null。`runStateChanged` notification params 同批扩为 `{state:relay.run-state/v1,caused_by_seq:integer}`。
actor 在其 lease/writeGuard 内先将 operation event flush 到 Run Store，再将
ledger 变为 `receipt_committed`；恢复时两者不一致以已存在的 Run Store event 为真并修复 ledger。
不得复用 workflow attempt receipt。

## 4. actor、控制与稳定失败

actor 是 Store 单写者；它有有界 `ready`、串行 `submitControl()`、`stop()`、`done` 四个接口。
`start` 成功 = Store 已创建、actor lease 已取得、`operation_committed` 已 flush；不是 workflow 已运行。
`stop` 成功 = operation Receipt 已提交且 actor 已完成优雅 stop；`resume` 成功 = 新 actor ready 后 Receipt
已提交。lease-lost 立即关闭 actor queue，旧 actor 之后的写必须拒绝。

可预期业务失败用 JSON-RPC error data.reason 回包，不断连接：既有码继续使用
`E_GITIGNORE_MISSING/E_LEASE_HELD/E_REQUEST_CONFLICT/E_CAPABILITY_MISMATCH/E_UNKNOWN_FIELD`；DHR_30
新增并登记 `E_CLIENT_NOT_AUTHORIZED/E_SERVICE_IDENTITY_MISMATCH/E_SERVICE_NOT_READY/
E_REQUEST_IN_FLIGHT/E_CURSOR_GAP/E_LEGACY_READ_ONLY`，每码有 negative fixture、错误数值码边界和重试
语义。只有坏帧或非法顶层协议才断连接。

## 5. 订阅与重启发现

actor 在 Store 的单写队列上建立订阅 barrier：注册 buffered subscriber 并取得当前尾 seq 为
`snapshot_seq`，读取该 seq 对应 snapshot，随后发送 snapshot；再按 seq 排空 `>snapshot_seq` 的缓冲。
网络发送从写队列外进行。`event` 通知携带唯一 Store seq；`runStateChanged` 必带 `caused_by_seq`，
故两种通知均可按同一事件序定位。`after_seq` 仅补严格连续的 event seq；重复允许客户端丢弃，
任何缺口、跨 Run 或早于 retention 的 cursor 均 `E_CURSOR_GAP`，不猜测。

重启 discovery 生成同一 Read Model，顺序固定为：

1. 扫描 `<repo>/.dh-relay/<run_id>/`，仅有 `run.json + events.jsonl + state.json` 且协议校验通过者为完整 v2 Run；
2. ledger 对账：缺根的 reservation 重走保留号，Store event 与 ledger 不一致按 Store event 修复，损坏/重复 run_id 进入 fail-closed report；
3. 用 v2 Run 列表修复 `runs.json` 索引；
4. 扫描 `.dh-runtime/relay/`，只产生 legacy-v1 read-only list/status/inspect 投影，不迁移、不取得 lease。

测试必须覆写双 launcher、UDS 残留、descriptor 篡改且 capability 不泄露、每个 ledger phase crash、
新进程重试、actor stop/renew 竞态、subscribe barrier 并发写、cursor gap、双根 list/status/inspect 与
legacy 所有 control 拒绝。
