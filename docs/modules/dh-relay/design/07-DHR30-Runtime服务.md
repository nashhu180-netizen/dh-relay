<!-- dh:planning-event:v1 id=DHR-A-13 stage=A-full artifact=design/07-DHR30-Runtime服务.md review=evidence/10-DHR30-Runtime服务与CLI合同-交叉审核记录.md#review-a13 understanding=evidence/10-DHR30-Runtime服务与CLI合同-交叉审核记录.md#understanding-a13 -->
# DHR_30 仓库级 Runtime 服务

> 状态：正式设计输入。承接用户 2026-08-23 的确认和独立复审；它定义 DHR_30 的 Runtime service
> 与控制边界，不授权 DHR_31 的 workflow、Process 或 executor 施工。

## 1. 要解决什么

用户在业务仓执行 `relay start` 后，Relay 需要有一个独立后台服务，CLI、DSH Bridge
和 Pi 客户端都只向这个服务发请求：查询看到同一份 Run 状态；停止或恢复由后台受控执行；
重复提交不会把同一操作做两次。DSH 没安装不影响 CLI；`basic-agent-task` 真正执行仍留给
DHR_31。

## 2. 用户确认的三项承诺

1. **后台统一控制**：DHR_30 承接仓库级 Runtime broker。它管理本仓多个 Run 的宿主生命周期，
   接收 `start`、`stop`、`resume` 和订阅；不会引入 workflow、Process 或任何 Agent executor。
2. **连接当前服务**：客户端只把 `runtime.json` 当作发现信息；连接后必须通过 service-specific
   `contracts` 回证确认仓库身份、服务代次和能力指纹一致，才可调用业务方法。保持
   `relay.rpc/v1` 顶层握手字段不变。
3. **重复操作只生效一次**：幂等键为 `(client_id, request_id, method)`；同键、同规范化摘要
   返回同一持久 Receipt，同键但摘要不同以既有冲突 reason 拒绝。Receipt 不在 CLI 内存中，
   service 重启后仍能从 Run 事件账恢复。

用户随后确认以下三项实施选择：host session 内嵌在 service 进程；启动先记项目级可恢复账本；
本阶段只信任持有当前 OS 用户私有本地凭据的客户端，legacy v1 全部控制动作均拒绝。

## 3. 运行方式与所有权

```text
relay start
  -> 校验 .dh-relay/ 已被 Git 语义忽略
  -> 连接或拉起本仓唯一 Runtime service
  -> service 取得本仓确定性本地 endpoint 的绑定所有权
  -> service 就绪后发布 runtime.json
  -> CLI 经 RPC 请求 start；service 为该 Run 取得 lease 后才回 Receipt

CLI / DSH Bridge / Pi
  -> 读 descriptor
  -> 连接本地 endpoint + 原有握手
  -> contracts 回证 descriptor 的 repo_id/generation/capability_hash
  -> listRuns / inspectRun / subscribe / start / control
```

- endpoint 由规范化 `repo_root` 的稳定 SHA-256 hash 导出；Windows 用 Named Pipe、Linux 用
  UDS。canonical repo identity 取解析后的绝对路径：Windows 在 hash 前作不区分大小写的规范化，
  UNC 保留服务器/共享名；Linux 用 realpath。**成功 bind 该 endpoint 是唯一服务的 fencing**，
  不是 PID。endpoint 名只使用 hash，避免路径长度与敏感路径泄露。
- `runtime.json` 至少包含 `descriptor_version`、`repo_id`、`endpoint`、`generation`、
  `runtime_version`、`capability_hash` 与 `state=ready`。`generation` 为每次成功 bind 后产生的
  不可预测 UUID，只用作本次服务身份，不假装是跨机器时钟。
- descriptor 用临时同目录文件 + 原子 rename 发布。服务退出不删除 `runtime.json`：保留的
  descriptor 是可检测的陈旧发现信息，而不是服务所有权。下一服务仅在已经成功 bind 同一
  确定性 endpoint 后覆盖它，杜绝旧进程删除新 descriptor 的 ABA 风险。
- `relay start` 发现 descriptor 损坏、endpoint 不可连或回证不一致时 fail-closed；它可尝试
  连接确定性 endpoint，确认无活 service 后才拉起新 service。不会按 PID 杀进程，不会让
  CLI 直读或直写 Run Store。
- `relay start` 的 launcher 与 service 共用 endpoint 函数和 bounded ready 协议：service 先
  bind、初始化控制账本与 RPC、再发布 `state=ready` descriptor；launcher 仅在完成身份回证后
  返回。bind/ready 超时或早退不发布 ready descriptor，且保留既有 Run 不受影响。

## 3.1 本机授权

本阶段的访问边界是“当前 OS 用户的本机客户端”，不是网络服务。service 在成功 bind 后读取既有、
仅在缺失时原子创建 local-user capability，保存在用户私有目录
`~/.dh-relay/services/<repo_hash>/credential.json`；
项目中的 `runtime.json` 和 Run 账本不含该值。CLI、DSH Bridge 与 Pi fixture 从同一用户私有
文件取得 capability，在首个 `contracts` 请求中提交。service 仅在 capability 正确、descriptor
identity 完整匹配后把连接标记为已授权；未授权连接只能得到稳定拒绝，不能调用读写业务方法。
Linux UDS 同时设为 owner-only。Windows 使用仅包含 repo hash 的 pipe 名和上述 capability，
不把 Node 的默认 pipe ACL 当作跨用户授权证明。

## 3.2 session actor 合同

service 以 `run_id -> HostSessionActor` 映射管理所有活 Run。actor 的唯一构造入口接收
`repoRoot/runId`，并返回以下合同；旧 `startDetachedHost` 不在 DHR_30 service 路径调用：

```text
actor.ready       -> 成功仅当 lease 已取得、Store 已打开、lease_acquired 已写入
actor.submitControl(request) -> 在 actor 串行队列内：写 control_requested / Receipt，执行 stop 或 resume
actor.stop()      -> 请求优雅停止；同一队列释放 lease，且只释放自己取得的 lease
actor.done        -> { graceful | lost_lease | failed }；lost_lease 后队列拒绝所有写
```

service 只创建、查找和等待 actor，绝不持 Store 写句柄；actor 是其 Run Store 的唯一写者。
`start` 仅在 `actor.ready` 于有界超时内成功后提交 Receipt。`stop` 先在 actor lease 内提交
Receipt 再终止；`resume` 只在新 actor 的 `ready` 成功后提交 Receipt。service 崩溃时 actor
随进程终止；下一 service 先扫描已知 v2 Run 根、再按 lease 恢复 actor。DHR_30 actor 不 import
workflow、Process 或 executor，也不推进业务节点。

## 3.3 start 请求账本合同

本节的 `runtime-requests.json` 草案已被
[`08-DHR30-RPC与ReadModel合同.md` §3](./08-DHR30-RPC与ReadModel合同.md#3-jcs幂等键与-operation-ledger)
中的唯一 `runtime-operations.json` 替代；不得并存或迁移读取。本节仅保留其 session 交接含义。

JCS、operation key、phase/recovery、`next_seq` reservation、Run Store event 裁决、全局
`runs.json.lock` 更新次序均以该补充稿为唯一来源。禁止 RPC handler 或 CLI 直接调用旧
`createRunWithNumbering`。

## 3.4 credential 生命周期

local-user capability 是 `<repo_hash>` 的持久随机值，不会每次 service 启动轮换。只有已经成功
bind 确定性 endpoint 的 service 才能在私有 credential 缺失时原子创建它；bind 失败候选绝不读取、
改写或删除 credential。service restart 复用同一 capability；用户显式删除私有 credential 时，
下一届已取得 bind 的 service 创建新值，旧连接失效。私有目录仅允许该用户读写；临时文件须按
相同权限创建并清理。公开 `capability_hash` 仍是冻结的 Runtime 能力指纹，绝不用于或泄露
local-user capability。

## 4. 写入与控制边界

- service 是唯一导入 Store 与 runtime host 的控制面进程。每个 Run 的 host session 内嵌在
  service，提供可取消的 `ready / stop / lost_lease` 生命周期；session 自己持有 lease 且以
  `writeGuard` 串行写自己的事件、control request 与 Receipt。service 不会与 session 并发写
  同一 Store。**措辞澄清（DHR_30 F-034 回写）**：「唯一写者」的运行期仲裁是 lease fencing，
  该论证**仅覆盖宿主入口**（`host-main` / `startDetachedHost` → `runHostSession` 先取 lease
  再以 writeGuard 开 Store）；发号原语 `createRunWithNumbering` **不在 fencing 覆盖内**，对它
  的纪律是 §3.3 的生产全面禁调（含 service 自身，无豁免）+ 建 Run 根 fail-closed 不接管残缺
  目录，两者均由 `test/control-plane-imports.test.mjs` 与 runtime 回归静态/动态钉住；本条的
  import 禁令限控制面（cli / adapters / rpc），不要求删除宿主侧原语。
- `stop` 是持久 control request：当前 session 在自己的 lease 内写 Receipt、完成优雅 stop；
  `resume` 由 service 重建 session，待新 session 取得 lease、写入 Receipt 后成功。不得用裸
  PID kill 代替。service crash 后，新一届 service 重新发现 Run、取得/接管 lease；旧 session
  一旦失租必须拒绝任何迟到写入。
- start/control 共用项目级 `runtime-operations.json`（定义、状态与恢复均以补充稿 §3 为准）；
  它在创建 Store 前保留 run_id，崩溃恢复继续同一 run_id，绝不发第二个号。Receipt 随 Run
  事件账保存，operation ledger 处理创建窗口与索引修复；`runs.json` 仅为跨仓发号/加速索引，
  Run Store 才是 Run 真相。
- 客户端断开只取消连接本地订阅，不生成 cancel。
- `start` 的成功含义是「Run 已创建且该 Run host 已取得 lease」；endpoint bind、Store、
  `.gitignore` 或 lease 失败均返回稳定错误且不把请求误报为成功。

## 5. RPC 与 Read Model

service 组合 `listRuns`、`inspectRun`、`subscribe`、`start`、`control` 和既有
`contracts`/`validate`。所有业务方法都必须在成功的 `contracts` 后才可调用；每个方法的参数、
结果、既有 reason 与未知字段拒绝规则在 DHR_30 同批冻结：

| CLI | RPC | 关键约束 |
|---|---|---|
| `list` | `listRuns` | 同时发现 v2 与 legacy v1；legacy 只读，所有 control 拒绝 |
| `status <run_id>` | `inspectRun { view: "status" }` | 唯一 Runtime Read Model，含 DHR_51 宿主三态 |
| `inspect <run_id>` | `inspectRun { view: "detail" }` | 唯一 Runtime Read Model，text/json 只作渲染 |
| `events --follow` | `subscribe` | 先快照、再按 seq 接实时事件；重连以 cursor 补发，缺口拒绝而非猜测 |
| `start` | `start` | 成功仅在 Run 与 host lease 就绪后回 Receipt |
| `stop` / `resume` | `control` | 操作为 lease-fenced 持久 Receipt；legacy v1 resume 拒绝 |

`contracts` 是连接级首个必需请求：它携带 local-user capability，成功后返回 `repo_id`、
`generation`、`runtime_version`、`capability_hash` 与 `descriptor_version`；客户端比较完整
descriptor 后才解除业务方法闸。代次、身份或 capability 不符一律拒绝。这不增加或改变冻结
顶层握手字段。

### 5.1 连接状态、方法与事件合同

每个连接只能按以下状态机前进：`handshake-valid -> contracts-pending -> authorized -> closed`。
在 `contracts-pending`，除一次 `contracts` 外的任何方法均以稳定拒绝返回；`contracts` 参数为
`descriptor_version/repo_id/generation/local_user_capability`，响应为完全相同的 service identity。
任何字段、local-user capability 或 Runtime `capability_hash` 不符均不授权。`validate` 是无副作用
契约查询，允许在授权后调用。

| RPC 方法 | 最小输入 | 成功结果 | 拒绝 / 语义 |
|---|---|---|---|
| `listRuns` | `include_legacy` | 同一 Read Model 的 v2+v1 条目 | v1 标 `read_only=true` |
| `inspectRun` | `run_id` | 一个 Runtime Read Model | 未知 run 拒绝 |
| `subscribe` | `run_id`, `after_seq` 可选 | `snapshot`, `snapshot_seq`, `next_seq` | 仅由事件账 seq 驱动 |
| `start` | 显式完整 start 请求 | 持久 Receipt + run_id | 仅 actor ready 后 committed |
| `control` | `run_id`, `action=stop|resume` | 持久 Receipt | v1 及未授权 Run 一律拒绝 |
| `contracts` | descriptor identity + local-user capability | service identity | 每连接唯一首请求 |
| `validate` | 已冻结 contract id | 验证结果 | 不读取/不写 Run |

`subscribe` 在同一 actor/Store 序列中先注册 buffered subscriber 并取得 `snapshot_seq`，再读取
snapshot；网络发送后按 seq 排空严格 `> snapshot_seq` 的缓冲。cursor `after_seq` 从事件账补发
严格连续序列。重复 seq 可由客户端丢弃；任何缺口、过期 cursor 或跨 Run cursor 均返回稳定
cursor 拒绝，不猜测或拼接。
legacy v1 只投影只读状态：所有现有和未来 `control` action 都以 legacy-read-only 拒绝。

### 5.2 可预期失败与发现顺序

业务 handler 不得以断开连接表达可预期失败。DHR_30 在 reason-code 权威中登记并在 method schema
引用 service 专用原因：未完成授权、descriptor identity 不符、service 未就绪、request in-flight、
cursor gap、legacy read-only；已有 `.gitignore`、lease、Store、能力、未知字段和 request conflict
继续使用既有 reason。仅坏帧/非法协议才断连接。Receipt 总是显式呈现 `in_flight/committed/failed`
之一，允许同键安全重试。

service 重启发现顺序固定为：①扫描 `<repo>/.dh-relay/*/` 中有完整 Store 的 v2 Run（Run 真相）；
②仅对 `runtime-operations.json` 对账、补齐保留号与 Receipt（无根 reservation、损坏或重复 Run
均按补充稿 §3 的唯一 fail-closed 结果处理）；③用发现结果修复用户级 `runs.json` 加速
索引；④只读扫描 legacy 根 `.dh-runtime/relay/` 并投影。重复 run_id、损坏 Store、ledger 与 Store
冲突均 fail-closed，绝不以索引覆盖事件账。

## 6. 不做什么

- 不新增公网、跨主机服务、DSH 私有类型或客户端 Store 写入。
- 不实现 basic-agent-task、Process、Agent executor、Attention 或 Approval；这些仍由 DHR_31
  或后续卡承接。
- DSH Bridge 仍按 DHR_50 `passed-with-constraints` 条件执行；不承诺目标面板 UI 或 H-e2e。

## 7. 机器验收

1. 无 DSH 时，真实 `relay start` 拉起/复用 service，七条 CLI 路径均只经同一 RPC endpoint。
2. 双 launcher、陈旧/损坏 descriptor、endpoint 残留、service crash/restart、能力/代次不符
   均以真实进程测试；不会误杀活进程、不会连接未回证服务。
3. 同幂等键并发、断线重试、service 在 `accepted` 到 `receipt` 各阶段崩溃、等价 JSON 字段
   顺序、摘要冲突均可复跑；Receipt 唯一且持久，崩溃重试不产生第二个 run_id。
4. 多 Run 的 start/control、lease 接管和旧写拒绝可复跑；服务不 import `workflows/` 或 executor。
5. `subscribe` 的快照/seq/cursor、未知输入和 legacy 只读拒 resume 可复跑；CLI text/json 与
   Bridge/Pi fixture 读取同一 Read Model。
6. 未授权本机用户、缺失/错误 local-user capability、`.dh-relay/` 未被 Git 忽略时均在启动/调用
   前失败；项目中零 descriptor/临时文件残留，私有 credential 绝不进入仓库或工件。
