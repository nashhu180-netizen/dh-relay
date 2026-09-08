<!-- dh:v1 -->
# as-built · relay-core（Relay v2 承重内核 · 契约层）

> **首份快照：DHR_28**（P5 批次 1·冻结 v2 最小协议集 + ADR + 独立校验器）。
> **阅读对象**：DHR_29（Runtime）、DHR_30（CLI / Read Model）以及任何要对接 v2 协议的客户端施工者。读完这份应当知道 `relay-core/` 是什么、边界在哪、哪些地方动之前必须先知道什么。
> **与 [relay-contracts.md](relay-contracts.md) 的关系**：那份是 **v1 的 PowerShell 契约层**（`tools/contracts/`，`relay/v1`），本份是 **v2 的 TypeScript/Node 契约层**（`relay-core/contracts/`）。两套**并列共存、互不迁移**——v1 现役且只读作 Oracle，v2 是后续 Runtime 的唯一契约来源。看到 `relay/v1`、`.psd1`、`Test-Relay*` 去那份；看到 `relay.run/v2`、`*.schema.json`、`validate.mjs` 看这份。

## 1. 它是什么 / 为什么存在

一句话：**控制面独立的承重内核的契约层**。协议在这里冻结，之后 Runtime（DHR_29）、Relay CLI（DHR_30）、以及任何客户端（DSH Bridge / Pi Adapter / 其他终端）**只认这一份契约来源**，谁都不再各自解释一遍字段含义。

它不是单一 Runtime，也不是客户端。DHR_29 已实现 Store/回放，DHR_51 已实现 detached 宿主、lease 与发号，DHR_52 已实现本地 RPC 服务端；**DHR_30 已实现仓库级 Runtime service（唯一写者装配人 + operation ledger）、正式 Relay CLI 七命令、DSH Bridge 库接缝与客户端中立 fixture，并把正式 Read Model `relay.client-read-model/v1` 的字段级定义冻结进 design/06 §14**。

## 2. A → B

| | 开工前（2026-08-20 之前） | 现在 |
|---|---|---|
| 本仓代码根 | 只有 `tools/`（P1 PowerShell Runner + 契约） | 多了并列的顶层目录 `relay-core/` |
| v2 协议 | 只存在于 design 文档的散文与表格里，无任何机器可校验形式 | 7 份冻结 JSON Schema + 1 份共享定义模块 + 4 份 v0 形状，全部可编译、可校验 |
| 语言/代码根决策 | design/05 §6.3 显式把语言决策**推迟到 P5 开工**（旧的「Go 已锁定」结论已被该文取代） | ADR-001 已裁决：**TypeScript / Node + 本仓 `relay-core/`** |
| Agent 宿主归属 | DevPlan §2.3 列了四个必答问题，无答案 | ADR-002 四问逐条作答，每问一行 `answer:` 锚点 |
| v1 六条协议缺口 | P4 主报告 §4 列出，无处置 | `v1-gap-disposition.md` 六条全部采纳，逐条写明落到哪个 schema 的哪个字段 |
| 机器闸 | 无（v2 侧） | 五道，见 §5 |

**没变的**：仓根 `tools/`（PowerShell）一个字节没动，`.dh-runtime/relay/`（v1 运行现场）一个字节没读写。

## 3. 目录结构与各自职责

```
relay-core/
├── README.md                 硬约束 6 条 + 三份基线的「改了什么跑什么」对照表
├── package.json              @dh-relay/relay-core · ESM · node>=18 · 依赖只有 ajv + ajv-formats
├── capability-baseline.json  能力指纹基线（见 §5 第五道闸）
├── adr/                      ADR-001（语言与代码根）、ADR-002（Agent 宿主四问）
├── contracts/                协议本体 + 五份规范文档
├── fixtures/                 golden 11 / negative 23 对 / manifest.json
├── tools/                    校验器、审计器、三个基线工具、JCS 实现
├── store/                    DHR_29 单 Run 账本：事件账 + 确定性回放（见 §3.5）
├── runtime/                  DHR_51 detached 宿主、lease、发号与三态读数；DHR_30 增仓库级 service / actor / endpoint / launcher / ledger / discovery / credentials（见 §3.6、§3.8）
├── rpc/                      DHR_52 本地传输、能力握手与订阅服务端（见 §3.7）
├── cli/                      DHR_30 正式 Relay CLI：main / client / pending / render（见 §3.9）
├── adapters/dsh-bridge/      DHR_30 DSH Host 可内嵌的库接缝（见 §3.10）
├── fixtures/clients/         DHR_30 Pi/通用客户端纯 JSON 样例 5 份（不入 manifest，见 §3.10）
└── test/                     node --test：12 个文件 153 用例（contracts/store/runtime/rpc/rpc-service/ledger/discovery/service/cli/dsh-bridge/client-fixtures/read-model-mirror）
```

### 3.1 `contracts/` —— 7 份冻结协议

| `$id` | 管什么 |
|---|---|
| `relay.rpc/v1` | JSON-RPC 2.0 信封：request / response / error / notification 四分支；method 枚举 7 个、notification 2 个；握手带 `protocol_version` + `capability_hash` |
| `relay.run/v2` | Run 定义：workflow 元信息、nodes（含 `title` / `required` / `executor_profiles` / `depends_on`）、`labels` |
| `relay.event/v2` | 事件账条目，带单调 `seq`、attempt 生命周期、`executor_kind` / `executor_ref` |
| `relay.run-state/v1` | Run 级状态文档：`run_status` + `group` + `progress` + `elapsed_seconds` + `node_states` |
| `relay.launch-receipt/v2` | 启动回执，`receipt_id` 是迟到结果判定的**单一锚点** |
| `relay.result/v2` | 任务结果：`outcome` + reason code + 通用 `structured` 载荷 |
| `relay.checkpoint/v2` | 检查点，`payload_digest` 幂等 |

**`_shared/relay.common.v1.schema.json`（`relay.common/v1`）**：共享定义模块，实际约束面的大半在这里——`locator` / `timestamp` / `sha256` / `run_id` / `node_id` / `attempt_id` / `executor_kind` / `executor_profile` / `reason_code` / `trigger` / `observation_status`。**它已冻结、承重，且计入能力指纹**（见 §6 的「指纹三步走」）。

**`v0-shapes/` 目录 4 份**：`relay.resolved-plan/v1`、`relay.host-observation/v1`、`relay.approval/v1` 仍是未冻结 v0；`relay.attention/v1` 已由 DHR_61 提前冻结为 fallback pause Attention，并与 `relay.fallback-pause/v1#/$defs/attention` 同形。该兼容 shape 文件本身不重复计入 `capability_hash`，承重定义已随 `relay.fallback-pause/v1` 进入 v2 manifest。

### 3.2 `contracts/` 的五份规范文档

| 文件 | 回答什么 | 什么时候必须去读 |
|---|---|---|
| `reason-codes.md` | 全部 **24** 个 `E_*` 码，分六类（fail-closed 三条 / start 前置 / 契约结构 / 幂等冲突 / Executor 生命周期 / RPC） | 要加码时——加码有三步规矩：写进表、加一份能触发它的反例 + `.expect.json`、说明与既有码的边界 |
| `v1-gap-disposition.md` | P4 主报告 §4 的 v1 六条缺口 G1~G6 逐条处置，含可 grep 锚点 `v1-gap-disposition: G<n>` | **DHR_30 开工前必读**（文件末尾有专门一节，见 §7） |
| `compat-matrix.md` | v1 ↔ v2 字段级对照；event `kind` 逐值对照；fail-closed 口径对照；移交下游三条 | 要论证「v2 判定不弱于 v1」时 |
| `CANONICALIZATION.md` | 摘要与签名口径 = RFC 8785（JCS）；五个指纹字段各对什么取摘要；`capability_hash` 的清单形状定死 | 要动任何 digest / signature 时 |
| `OPEN-POINTS.md` | 3 处有意开放点的登记 + H6 断言的两条固有边界 + 交给 DHR_29 的 K-1~K-4 | 要往 `contracts/` 加任何 `additionalProperties: true` 时（未登记的开口视为缺陷） |

### 3.3 `fixtures/`

- `golden/` **11 份**——每份已冻结协议至少一份正例（`relay.rpc/v1` 四分支各一份）。
- `negative/` **23 对**——反例载荷 + `.expect.json`。`.expect.json` 写死的不只是 reason code，**还有出错位置 `at`**（JSON Pointer）。这是 F-052 加的：只钉码不钉位置，一条反例被别的原因拒也算过。
- `manifest.json`——57 份 fixture（11 + 23 + 23）逐份的 canonical sha256。

### 3.4 `tools/`

| 文件 | 行数 | 干什么 |
|---|---|---|
| `validate.mjs` | 285 | 独立校验器（ajv 2020）。CLI + 可 import 双模；`--selftest` 跑全量 golden + negative |
| `audit-contracts.mjs` | 469 | `contracts/` 静态审计 11 维度（AST 遍历，不是 grep） |
| `fixture-manifest.mjs` | 130 | fixture 基线对证 / `--write` 重生成 |
| `capability-baseline.mjs` | 175 | 能力指纹基线对证 / `--write` 重生成 |
| `canonical.mjs` | 91 | JCS（RFC 8785）实现 + `digest()` / `digestExcluding()` |
| `structural-tokens.txt` | 162 个 token | 结构位置 token 的**白名单**（`properties`/`$defs` 键 + `enum` 项 + `const` 值） |
| `forbidden-types.txt` | 33 条 | 五家私有类型的**黑名单**（第二层，给已知厂商词更明确的报错） |


### 3.5 `store/` —— DHR_29 的单 Run 账本（库形态，无进程无 RPC）

| 文件 | 干什么 |
|---|---|
| `store.mjs` | 唯一写者 API：`createStore({ root, run })` / `openStore({ root })` / `registerReceipt` / `appendCheckpoint` / `appendResult` / `appendEvent` / `readState`。所有变更操作过**串行写队列**（seq 分配与落盘之间隔着 await，不排队并发 append 会重号） |
| `state.mjs` | 纯函数回放：`replayRun({ run, events })` 从零全量；`applyEvents({ run, state, events })` 从快照折叠增量。折叠只依赖「起始状态 + 其后事件」——这是「快照 + 增量 ≡ 全量逐字节」的全部前提 |

**语义要点**（测试钉在 `test/store.test.mjs`，21/21）：

- **不可变工件**：`run.json`、receipt、checkpoint、result 一律 create-new（`wx`），重投同内容 = 幂等，改内容 = 冲突码；唯一可变文件是 `state.json`（临时文件 + rename 原子替换）。
- **身份链**：checkpoint/result 的 `receipt_id` + `attempt_id` 必须与当前 Attempt 的回执一致；不符按 B11 处置——checkpoint 拒识即返（`E_IDENTITY_MISMATCH`，不留痕，与 v1 的有意差异已登记 `reason-codes.md` §四）、result 进隔离区并留 `late_result_quarantined` 事件。迟到判定挂 `seq`（当前 receipt），不依赖 attempt 字典序（K-2）。
- **终态语义**：终态按 receipt（= attempt）记账。旧 attempt 的终态锁不住新 receipt 的 fresh attempt（重试路径）；但已定终态的 attempt 自己不再接受 lifecycle 事件（`node_started` / `attempt_started` / `checkpoint_recorded` / `human_input_requested` 一律拒），隔离留痕除外。checkpoint 判定次序 = **身份链 → 幂等 → 终态守卫**：身份先行堵「冒用 attempt 借同 key 同 digest 白拿 idempotent ack」；幂等在终态守卫前，已记录 checkpoint 的原样重投在其 attempt 定终态后仍回 idempotent、不误报终态冲突。
- **恢复（F-003 收口实现）**：`openStore` 以 `run.json` 为锚点重建；`events.jsonl` 逐行校验——可解析、协议与 run 归属、seq 从 0 连续、逐条过冻结契约——任何损坏 fail-closed（`E_EVENT_LOG_CORRUPT*`），不做部分恢复；receipt/checkpoint/result 工件损坏同样 fail-closed（`E_STORE_CORRUPT:*`）。工件全量回装后幂等/冲突判定跨重启成立。`state.json` 是**纯派生缓存**：从不读回参与判定，每次打开由全量事件重算并原子重写——「append 与 persist 之间被强杀」的半更新现场被自愈；代价是外部对 state.json 的篡改会被静默纠正（事件账是唯一真值），这是有意取舍。
- **写前契约校验（F-004）**：每个事件落盘前过 `relay.event/v2`（ajv），拒绝即抛 `E_SCHEMA_INVALID:*`、不落盘不留痕。
- **脱敏（宪章#6）**：accepted result 与隔离区走同一 sanitizer，覆盖对象键、行内键值、`sk-` 与 PEM。
- **边界**：本层不认识客户端与宿主——detached 宿主 / lease / 发号归 DHR_51，RPC 归 DHR_52。
- **已知边界（DHR_29 轮 2 登记 + DHR_51 收口刷新）**：①跨文件撕裂窗口——**评估结论（DHR_51 F-102）**：有意接受、不实施 WAL。单宿主 lease 独占下撕裂只源于自身强杀；openStore 以事件账为真值，「有工件无事件」经幂等键重投收敛；DHR_52 引入 RPC 后写者仍唯一（lease+fencing）。重启评估触发条件：出现「工件存在与否本身参与状态判定」的机制，或现场迁到非本地 FS。②**F-011 已封堵（DHR_51 关账）**：公开 `appendEvent` 对 `attempt_succeeded/failed/orphaned` 抛 `E_TERMINAL_STATE_CONFLICT:<kind>-via-raw-append`，终态只经 `appendResult`；③renew 采用 unlink+wx（非 rename 覆写），租约文件在续租瞬间微秒级缺失——inspect 可能闪 dead，无操作面影响（R1-03 修复后登记）；④PID 复用残余（F-103）：死宿主 pid 被无关进程复用会误报 alive 至 TTL 过期，独占性不受影响；⑤损坏租约（open-wx 与 writeFile 之间被强杀）由 acquire 回收 + 有界超时 `E_LEASE_ACQUIRE_TIMEOUT`（F-109），绝不无限自旋。

### 3.6 `runtime/` —— DHR_51 的 Detached 宿主 / lease / 发号 / 恢复 / 三态读数

| 文件 | 干什么 |
|---|---|
| `runid.mjs` | D23 规范化：`R<nnn>-<slug>-<yyyyMMdd>`；slug ASCII 小写/数字/短横线 ≤30 首尾非短横线，五反例拒绝且不静默截断（`E_RUN_ID_INVALID:<why>:<原输入>`） |
| `pidalive.mjs` | `process.kill(pid,0)` 探活（ESRCH 死 / EPERM 活）；PID 复用残余登记为已知边界 |
| `repolock.mjs` | 仓级锁：wx 独占 + 陈旧回收（过期或死 pid）+ 超时 `E_REPO_LOCK_TIMEOUT`；**空文件=在途锁不偷**（临界区无 fencing，偷锁=双持有人，R1-02 修复）；payload 带 nonce，release 只删 pid+nonce 双匹配的自己 |
| `lease.mjs` | Run 级宿主 lease：`host-lease.json` 为唯一写者仲裁物；接管=过期或死持有人或损坏（`LEASE_CORRUPT` 区分，unlink+wx，fencing 兜底自愈）；`E_LEASE_HELD` 拒第二宿主；renew=**新鲜度闸 + unlink+wx**（绝不 rename 覆写接管者租约，R1-03）；有界超时 `E_LEASE_ACQUIRE_TIMEOUT` 防自旋；inspect 三态 alive/lease_expired/dead，与 acquire 成败构成可测不变量 |
| `gitignore.mjs` | start 前置闸：`git check-ignore` 语义判定（F-009 任意深度反例），缺失 `E_GITIGNORE_MISSING`，不改业务仓文件；其它失败 `E_GITCHECK_FAILED` fail-closed |
| `startrun.mjs` | 发号：slug 规范 → gitignore 闸 → **索引旁锁 `<indexPath>.lock`**（跨仓并发共享一把，E14 遗漏修复）→ runs.json 该仓分段 max+1 → 复合键查重 → 建 run 根 + createStore + `run_created` → 锁内原子回写索引；索引形状 `{version:1, repos:{[canonicalRepo]:{max_seq, runs}}}`（内部形态，演进归后续卡）；失败路径孤儿 run 根观察登记（F-106） |
| `host.mjs` / `host-main.mjs` | 会话：闸 → 取/接管 lease → openStore（writeGuard=fencing）→ 补记 `lease_expired`/`lease_acquired` → tick 续租 → 优雅释放 / 失租停机不删别人；**初始化写账期与 tick 期仅对精确 `E_LEASE_HELD:lease-lost` 同义收敛**，其它错误原样失败；`startDetachedHost` detached+unref 脱离终端存活；本卡宿主=生命周期保持器，无 executor（DHR_31 行使） |
| `status.mjs` | 只读三态读数：`node relay-core/runtime/status.mjs <run_id> [--root <p>]`，输出 JSON；三态来源仅 lease 文件，账面只渲染 Store 产出的 state.json/events.jsonl，**不自造协议对象、不注册 bin** |

**发号锁位置（E14 遗漏修复）**：锁挂在 `<indexPath>.lock` 而非仓内——每仓一把锁只能串行化同仓，跨仓并发会丢 runs.json 分段（后写覆盖先写 bucket）。共享索引锁 + wx 仲裁 + 超时陈旧回收，跨仓 4 仓大索引 10 轮 0 丢段（轮1 探针实证）。

**host-lease.json 是运行现场内部形态，不是协议对象**：无 protocol 字段、不进契约、不进能力指纹（实施提示 3）；D18 的「宿主可执行指纹」要素有意不承接（F-107 登记，RPC 阶段需要时再评估）。

### 3.7 `rpc/` —— DHR_52 的本地 RPC 服务端

| 文件 | 干什么 |
|---|---|
| `capabilities.mjs` | 从权威 `capability-baseline.json` 复算本地 capability snapshot；握手只接受严格相等的 peer hash，格式合法但不等也返回 `E_CAPABILITY_MISMATCH`，不按交集降级。 |
| `transport.mjs` | Windows Named Pipe / 非 Windows UDS 的本地端点、UTF-8 fatal NDJSON framing、单帧上限与 discard-until-LF；每连接有独立 handler seam，`close()` 先销毁已接受 socket 再关 server。 |
| `server.mjs` | `createRpcServer({ runId, store, capability, endpoint, handlers })`：先验冻结信封、再验 capability、再仅分派注入的 handler；断连只清本连接订阅，绝不写 Store 或 cancel Run。 |

**订阅与发送边界**：`subscribe` 通过注入 seam 注册连接本地的 `unsubscribe`，正常断连、server close 与迟到 resolve 都恰调一次。`sink.event` / `sink.runStateChanged` 只发送 descriptor-derived、null-prototype snapshot：拒绝 getter、Proxy 可变视图、稀疏/带额外键数组与 `toJSON` 污染；冻结 schema 校验与实际传输都使用该 snapshot。通知写入背压或连接已关时返回 `false`，并断开该连接，不能假称对端已收到。

**F-057 的窄码**：仅当错误位置收到一份完整、可独立通过校验的另一已冻结顶层协议对象时返回 `E_PROTOCOL_MISMATCH`。缺字段、未知字段、同名异版及本协议普通坏值保留各自最具体既有码；新增码有双向反例，且 manifest / capability / structural-token 三份基线已同批重生。

### 3.8 `runtime/` 增量 —— DHR_30 的仓库级 Runtime service（唯一写者装配人）

DHR_52 的 RPC seam 与 DHR_51 的 host 之间原本没有装配人（F-001）。DHR_30 补上：

| 文件 | 干什么 |
|---|---|
| `endpoint.mjs` | canonical repo root（Windows 大小写折叠 / UNC 保留 / realpath）→ `repoHash` → 确定性本地端点；endpoint 名只含 hash 不含路径明文 |
| `descriptor.mjs` + `launcher.mjs` | descriptor 原子发布 + **`ensureRuntimeService()`**：读 descriptor → 向端点上真正在跑的 service 发 `contracts` 回证（以服务端自报身份为准，陈旧/篡改 descriptor 全 fail-closed，F-005）→ 无 service 才 spawn；双 launcher 并发只产生一个 service |
| `service.mjs` | 仓库级单进程 service：独占 bind 端点、内嵌 lease-fenced host actor（**唯一**写 Run Store 的路径）、`listRuns`/`inspectRun`/`subscribe`/`start`/`control` 全走 Read Model 出口；**run_list 出口统一套 `orderRunSummaries()`**（F-026） |
| `actor.mjs` | per-run actor：ready 只在 lease 落定后兑现，控制走同一串行队列；失租拒一切写 |
| `ledger.mjs` | `runtime-operations.json` operation ledger：`(client_id, request_id, method)` + JCS request digest 持久幂等；保留号跨崩溃收敛（accepted 相位现发号、其余相位沿用保留号，F-017/F-024） |
| `discovery.mjs` | 启动引导（`bootstrapDiscovery`）与运行期重扫（`scanRuns`）分离（F-006）；损坏事件账 fail-closed（F-014）；孤儿 Store 投影 `read_only:true` 不隐藏不可写（F-013）；保守 seed（F-008）；**`orderRunSummaries()`**：分堆词表序 `needs_you → running → done → failed`、词表外首现堆、null 殿后、堆内 run_id 升序（design/06 §14.4 冻结） |
| `credentials.mjs` | 本机私有凭据：**创建权只归首次成功 bind 端点的 service**（`readOrCreateLocalUserCapability`）；CLI/Bridge 只读（`readLocalUserCapability`），缺失即 `E_LOCAL_USER_UNAUTHORIZED`（引导路径，无独立 init 命令） |

**Read Model 唯一来源**：`relay.client-read-model/v1` 四视图（run_list / status / detail / event_stream_snapshot），字段级定义冻结在 design/06 §14；分堆与排序**由源头给**（P4 B-13），两条镜像断言（改 group 必移动 / 只改 run_status 逐字不变）在 `test/read-model-mirror.test.mjs` 常驻。

### 3.9 `cli/` —— DHR_30 正式 Relay CLI

| 文件 | 干什么 |
|---|---|
| `main.mjs` | 七命令 `list/status/inspect/events/start/stop/resume`（`--json`）；positional 形状按命令声明、多余/缺失 usage 退出 1（F-025）；text 与 json 同源渲染、text 不自算字段；`events --follow` 断线按 `after_seq` 续传、`E_CURSOR_GAP` 整体重快照；**stdin 关闭 = 优雅结束 follow（退出码 0）** |
| `client.mjs` | 唯一 RPC client：launcher 发现 → 只读凭据 → `contracts` 首请求回证；client identity `wx` 独占创建、EEXIST 短退避重读赢家绝不覆盖（F-018） |
| `pending.mjs` | design/08 §2 客户端持久 request record：落点 `<repo>/.dh-relay/private/pending-operations.json`（owner-only：POSIX 0700/0600、win32 icacls `/reset`+断继承+只授当前用户，F-020 用户裁决）；跨进程锁 `{pid,token,at}`、owner token 双核验、**零自动回收**——外锁一律稳定拒绝并给恢复指引（pid 只是瞬时存活线索非所有权凭据，F-019 用户裁决 + F-031）；崩溃重试按残条原 `(client_id, request_id)` 收敛，绝不发第二个号 |
| `render.mjs` | Read Model 的人读渲染，不产字段 |

### 3.10 `adapters/dsh-bridge/` 与 `fixtures/clients/` —— 客户端接缝

**`adapters/dsh-bridge/index.mjs`**：DSH Host 插件可内嵌的**库接缝**（非进程）。零 `store/**` import（Read Model 只经 RPC）；**不落本地 pending 账**——持久 request record 归宿主客户端，宿主要重试须自存并复用同一 `requestId`；`client_id` = `dsh-bridge-<repoHash>` 确定性形态。查询原样返回；窄 `control`（stop/resume）的 Receipt/error 原样透传、`E_LEGACY_READ_ONLY`/`E_ORPHAN_STORE_READ_ONLY` 不重试。订阅状态只来自快照与 `runStateChanged`；断线按已送达高水位 `after_seq` 续传（重连快照不抢先推高水位，服务端 cursor 补发不丢）；`E_CURSOR_GAP` 整体重快照回调 `onGap`；socket close 立即以 `E_CONNECTION_CLOSED` reject 全部在途请求；重试耗尽回调 `onClosed('retries-exhausted')` 绝不静默死（F-029）。

**`fixtures/clients/` 5 份纯 JSON**（pi-run-list / pi-status / pi-detail / pi-event-stream / generic-control-receipt）：任何语言可解析的消费样例，逐份过冻结契约；配套「Pi 式中立消费」测试不 import 任何 relay 运行时代码。**是 `fixtures/golden|negative` 的兄弟目录，不入 manifest、不进基线**——manifest 只扫 golden/ + negative/，这是设计而非遗漏。

### 3.11 `workflows/basic-agent-task/` —— DHR_31 的第一个 Workflow 定义（行使场景，不是实现落点）

**Workflow 定义就是一份合法的已冻结 `relay.run/v2` 文档**——本卡没有引入任何新协议、没动 `contracts/` 一个字。`run.template.json` 三节点成链（`prepare` → `process-task` → `verify`），全部 `required:true`、全部只有 `kind:"process"` 的 profile；于是它顺带也是 H6 可达性推导的**阴性对照**（必经闭包里没有 dsh-only 节点 ⇒ 放行）。

`steps/*.mjs` 零依赖（只用 Node 标准库），因为它们会被复制进任意业务仓：stdin 收 JSON 上下文（含 `depends_on` **传递闭包**的上游结构化结果与原样转交的 `labels`），stdout 出 JSON 结构化结果，退出码即成败。`verify` 拿 `prepare` 的原始输入**独立复算** `process-task` 的结论并逐条断言——「exit 0 就算通过」的写法能让整条闭环在结果全错时依然全绿，那就没有闭环可言。`make-run.mjs` 按 Workflow 实际所在位置补 `ref` 前缀生成可直接 start 的 run 文档（`--delay-ms` 供断连实录把一条 Run 拉长）。

`executor_profiles[].ref` 是**业务仓相对路径**，解析口径见下面 3.12。

### 3.12 `runtime/` 增量 —— DHR_31 的 Workflow 驱动与 Process Executor

> **这一节同时是 design/07 §6 那句「不 import workflow / Process / executor，不推进业务节点」的现役边界更正**（findings F-008）。那句话是 **DHR_30** 的边界——那一卡交付的是生命周期保持器，节点推进无人负责。DHR_31 把推进接了进来，但**接法不动唯一写者**：service 只**起** driver，driver 自己不持 Store 句柄。design/ 是冻结历史材料、不回改，现役边界以本节为准。

| 文件 | 现役职责 |
|---|---|
| `workflow-driver.mjs` | 按 `depends_on` 找 ready 节点，驱动 Process 与 Herdr Attempt；**一切读写都经 `actor.submitControl(store => …)`**，唯一写者仍是持 lease 的宿主。Herdr judge 若产出已脱敏 `quota_signal`，driver 仅按调用方注入的已登记 detector 分类；高置信 quota 才按 Receipt 冻结顺序选择当前仍全等且可完整签发的首个 fallback，先落 source 终态再开 fresh Attempt。无合格项或第二次 quota 写 canonical pause；非 quota 正常落原 Result。生产 judge、真实 detector 与样本仍由 DHR_35 接线。 |
| `process-executor.mjs` | `resolveStepRef` 词法守卫 + **`resolveStepEntry` 真实落点守卫**（对仓根与目标各做一次 `realpath` 再判仓内）——只做词法判断挡不住符号链接：`steps/link.mjs` 词法上老老实实待在仓内，`realpath` 之后却落在仓外（F-009，P0）。逃逸**照旧开 Attempt 并立刻记 `E_BAD_VALUE` 终态**，绝不先跑一把再说。`classifyStepOutcome` 是纯函数，把退出形态翻成已冻结 reason code。 |

**「可驱动」的判据是 ref 在本仓解析到真实文件**；解析不到时节点保持 `pending`、**不开 Attempt**——Runtime 不为一个自己启动不了的入口凭空造一次尝试（F-007，批 2 小审裁定保持不收紧）。它同时是 DHR_30 既有 Run（`bin/probe`、golden 的 `bin/fix.sh`）事件账逐字不变的保护栏。

**DHR_31 当时的 Agent 边界（历史）**：当时 driver 只认 `kind==='process'`，Agent Attempt 由外部代持、Runtime 只记账。该“至今只托管 process”的结论已被 DHR_33 及后续 Herdr driver 实现取代；当前 `capability-baseline.json` 的 `executor_kinds` 为 `herdr-agent` + `process`。`pi-agent` / `dsh-agent` 仍未被 Runtime 直接托管；终态继续走 Receipt-bound Result 路径，不能由 Herdr 的 idle/done 观测代造。

### 3.10 增量 —— `adapters/dsh-bridge/snapshot-main.mjs`（DHR_31 批 5 sidecar）

一次性把某个仓的 Read Model 吐成 JSON 后退出的**进程入口**。存在的唯一理由是安装拓扑：树外 DSH Host 插件有一条自己的硬契约——不许裸说明符、不许 `require`、也不许**计算出来的动态 `import()`**（那条契约是一次 `ERR_MODULE_NOT_FOUND` 启动失败逼出来的），于是它没法在自己进程里 import 本仓的 Bridge。宿主按绝对路径 `spawn` 这个入口、读 stdout，`spawn` 不经过模块解析，两边契约都不必让步（findings F-019，用户 2026-08-29 裁决）。

三条边界都很硬：**只做取数转发**（原样吐 `relay.client-read-model/v1`，不投影、不改名、不补字段——投影归客户端侧，协议层对客户端中立不破）；**归 `adapters/` 不进 `runtime/`**（它是客户端侧取数工具，不是 Runtime 的一部分）；**只读**（只调 `listRuns`/`inspect`，不碰 `start`/`control`）。

### 3.12 DHR_61 增量 —— Attempt 身份、持久 Attention 与 RPC v2

- **contracts / capability**：新增 `relay.attempt-receipt/v1`、pause/resolution、`relay.client-read-model/v2`、bootstrap/descriptor、RPC methods/envelope v2 与 subscription terminal。旧 `relay.rpc/v1` schema、端点、参数和成功 payload 不加字段；DHR_77 起 v1、bootstrap 与 v2 共用当前完整 capability baseline，DHR_61 前的固定 `994d5f…c971e` 只作为分派/订阅前应拒绝的历史值。现役计算口径见 `contracts/CANONICALIZATION.md`。
- **profiles / Receipt 签发**：Registry 只允许显式标为 `nonsecret` 的 TOML/JSON Pointer 进入 projection；`profiles/identity.mjs` 只哈希该闭集。Herdr Attempt 在 launch 前冻结 source identity 与最多六项有序 fallback snapshots，Receipt、事件和 fixture 不保存原配置或凭据值。
- **Store / recovery**：`appendFallbackPause` 与 `appendFallbackPauseResolution` 通过 blob-before-prepared 的 `relay.store-mutation/v1` journal 同批提交工件、事件与状态；恢复逐目标核对 before/staging hash，journal/blob/派生 ID/路径/账本任一不一致即 `E_STORE_MUTATION_RECOVERY_FAILED`。pause 重放同时导出旧 Attempt fence、`waiting_human` 和 open Attention；旧 Attempt 的 checkpoint/result 返回 `E_ATTEMPT_FENCED`。只读 RPC 使用不重写 `state.json` 的 Attention 投影，未完成 prepared mutation 一律拒读。
- **RPC / retry**：`endpointForRepo(...,{channel})` 派生互不复用的 v1、bootstrap、v2 本地端点。bootstrap 只接受 `{protocol:"relay.rpc-bootstrap/v1"}` 并返回有 schema 的 v2 descriptor；客户端仍须从受保护的 v1 ready descriptor 取得本机 credential，再用 bootstrap 发现 v2 endpoint，bootstrap 不复制 secret。v2 的 list/inspect/subscribe 显式选择 `read_model_version`，v2 投影携带 `open_attentions`。任一 Run 的 mutation 账本不可恢复时，list 操作整体返回稳定 `E_STORE_MUTATION_RECOVERY_FAILED`，不静默过滤坏 Run；v1 若命中 open Attention 返回 `E_ATTENTION_REQUIRES_READ_MODEL_V2`，订阅建立后才出现 pause 时，publisher 在发送新事件前先发标准 error 并关闭连接。`retry-with-profile` 只在 actor 写队列内复核 pause 范围、冻结 profile 与当前非敏感 projection 全等，再原子关闭 Attention 并开 fresh Attempt；同一 `(pause_id,retry_request_id)` 返回原结果。
- **边界仍在**：DHR_61 不做 quota 分类、自动 fallback 选择或 DHR_34 D3 编排；它只提供可被这些后续路径调用的协议与持久化原语。
- **DHR_34 D3 增量**：`runtime/executors/quota/classifier.mjs` 只接受结构化双证据与显式注入 detector，未登记即 unknown；`runtime/executors/identity/fallback.mjs` 按 Receipt 原序复核当前 registry、平台、非敏感身份四件套，并预冻结候选自己的 fallback snapshots。该 seam 的机器证来自受控注入，不能解读为真实账号自动换号已可达。

## 4. 技术选型的裁决出处

| 决策 | 结论 | 出处 |
|---|---|---|
| 实现语言 | **TypeScript / Node** | ADR-001，**用户 2026-08-20 对话点选**（两轮：先答建议倾向，主会话给出明示建议 + 翻盘条件，用户第二轮「采纳，进批次 2」） |
| 代码根 | **本仓新顶层目录 `relay-core/`**（不另起独立仓） | 同上 |
| pi-agent 接入方式 | **经冻结 Adapter，不直连 SDK**（次级裁决，用户同批点选） | ADR-002 第②问 + ADR-001「决策」节末 |
| Agent 宿主四问 | process / pi-agent / DSH Native / Herdr 逐问作答，每问一行 `answer:` | ADR-002 |

**ADR-001 里显式登记了翻盘条件**（不因已裁决而抹掉）：若 Runtime 将来须装到**无 Node 运行时**的机器，或作为**独立产品向外部分发**，则「单二进制分发优势在本项目不成立」这条依据立刻失效、Go 的单二进制成为真需求。P5-H（DHR_31 人判）保留「选定语言是否继续作默认」一问。

## 5. 五道机器闸各自在守什么

在 `relay-core/` 下跑。以下数字**2026-08-22 由 DHR_51 收口实跑刷新**（上一版为 DHR_29 收敛批时点）。

| 闸 | 命令 | 当前实际输出 | 它独占守住的是什么 |
|---|---|---|---|
| ① 单元测试 | `npm test` | **90 条全过**（contracts/store/runtime/rpc 四组） | 把下面四道闸接进一个入口；RPC 侧另钉：能力 hash 严格比对、真实本地 socket 分帧/坏帧、断连零 Store/cancel、订阅帧冻结校验、背压、JSON snapshot 与 F-057 窄码边界。 |
| ② 校验器 selftest | `node tools/validate.mjs --selftest` | **pass=34 fail=0**（golden 11 + negative 23） | 每条反例**逐条命中写死的 reason code 与出错位置 `at`**，两者都不对就红 |
| ③ 契约静态审计 | `node tools/audit-contracts.mjs` | 扫 12 份 schema/shape；闭合对象 24；条件收窄 1；有意开放点 3；未登记开口 0；非白名单厂商 token 0；`$ref` 实解析 **98 条**失败 0（`$id` 注册表 12 项）；结构 token 164 个未登记 0；**F-042：ajv.validateSchema 0 拒、meta 分叉 0；K-3 身份键内联 pattern 0**（两闸 DHR_29 批次新增） | 「没有我没想到的那几种」——`$ref` 真解析、开口全登记、结构 token 全白名单、meta 规则单一权威、身份 pattern 结构受闸 |
| ④ fixture 基线 | `node tools/fixture-manifest.mjs` | **57 份逐份 digest 相符**（golden 11 / negative 载荷 23 / expect 23） | fixture **还是过审时那批**。没有它，②的通过数只能证明「当下盘上这批自洽」 |
| ⑤ 能力指纹基线 | `node tools/capability-baseline.mjs` | **8 份**（7 顶层协议 + 1 共享定义模块）digest 相符，`capability_hash = 970b54601ae582a5…`（批次 1 K-1/K-3 与批次 2 两处 description 更正后同批重生成） | schema **本身**没被改软。②③④ 全都盯 fixture 与结构，唯独没人钉 schema 全文 |

### 三份基线互不覆盖（这一节最容易被后来人省掉）

`manifest.json` 钉 fixture、`capability-baseline.json` 钉 schema 全文、`structural-tokens.txt` 钉字段名/枚举值的白名单。**任意两份都盖不住第三份**：

| 改了什么 | 必须跑 | 不跑会怎样 |
|---|---|---|
| 任一 fixture | `node tools/fixture-manifest.mjs --write` | fixture 被改软而 `--selftest` 仍绿 |
| 任一 schema 的**任意一个字**（含 `description`） | `node tools/capability-baseline.mjs --write` | 能力指纹变了却无人知道——见下 |
| 新增字段名 / 枚举值 / 常量 | `node tools/audit-contracts.mjs --write-tokens` | 「协议不导入私有类型」这条**全称命题**退回黑名单，证明不了「没有我没想到的那几种」 |

**「改一个错别字也是能力变更」不是修辞**。`protocols[].digest` 对 schema **文件全文**取摘要，**不剥 `description` / `$comment` / `title`**——因为在这份契约里 `description` 承载规范性条款：G2 的七档聚合优先级、G4 的「`null` 不得渲染成 1」、`group` 的六条映射、locator pattern 的实装口径、`node_states` 须覆盖 `nodes` 全集、H6 断言语义，**唯一落点都在 description 里**。剥掉 description，把 G2 的优先级从「failed > running」改成「running > failed」指纹都不变。代价明确接受：**契约文件不做随手润色，文字修订与协议修订同等对待、批量发布**。

## 6. 这套东西是怎么长成现在这样的

本卡 81 条 findings、69 条已修。下面八处是**动 `relay-core/` 之前必须先知道的**，不知道就会把它们改回去。

### 6.1 7 份 schema 曾经编译不了（F-012，P1）

`$id` 用绝对 URI（`https://dh-relay.local/contracts/relay.run/v2`）而 `$ref` 用**相对文件路径**（`./_shared/relay.common.v1.schema.json#/...`）。按规范 `$ref` 相对 `$id` 建立的 base URI 解析，于是被解成 `https://dh-relay.local/contracts/relay.run/_shared/...` → `MissingRefError`，**7 份全炸**。

→ **现在全部 `$ref` 按被引 schema 的 `$id` 引用**（`https://dh-relay.local/contracts/relay.common/v1#/$defs/...`）。**别改回相对路径**；③ 的 `$ref` 实解析就是这条的回归护栏（F-027 补的——在那之前审计器里写着「$ref 可解析性」，实际只做了计数，一次都没 resolve 过）。

### 6.2 H6 的触发开关曾是 fail-open by default（D-11 / F-022，全卡最重要的一条）

`relay.run/v2` 的 `node.required` 原本是**可选 + `default: false`**。于是「必经角色不能只声明 `dsh-agent`」这条安全断言——**本卡唯一被 DevPlan 点名为机器证的那条**——只要实现不标 `required` 就一次都不触发。小审实测两个应拦的 payload 直接放行。

→ **`required` 已改为必填**。语义不变（显式写 `false` 照样不触发 H6），但消灭了「忘了标 = 不检查」这条静默路径。**别把它改回可选**，也别加回 `default`。

### 6.3 聚合条款曾只写在 description 里、零机器闸（F-048 → F-066，两次 P1）

`run_status` 的七档聚合优先级条款正文写着「规范性聚合条款（冻结，实现不得另立）」，紧挨着的 `group` 六条映射写着「由下方 allOf 逐条机器强制」并确实做了——**聚合条款一条 `allOf` 都没有**。实测：`run_status=succeeded` + 节点里有一个 `failed` → 放行；全部节点 `pending` 报成功 → 放行。

升成 `allOf`（6 条增至 12 条）之后**又踩一次**：**`allOf` 自身没被任何东西钉住**。逐条删掉 6 条聚合分支中的任意一条，四道闸**全绿**。对照组是 `group` 那 6 条映射——各有一份反例钉着，删掉会红。

→ 现在有一条 `npm test` 用例照 description 的①~⑦档跑 **14 例红绿矩阵**（7 应过 / 7 应拒），它**同时钉住 `allOf` 与条款正文的对应关系**：谁改条款不改 `allOf`（或反过来）这里就红。已逐条删 `allOf[6..11]` 复验，六条全部真红。**改 run-state 聚合语义时，条款正文与 `allOf` 必须同批改。**

### 6.4 `capability_hash` 的覆盖面走了三步（F-033 → F-075）

| 步 | 形态 | 为什么不够 |
|---|---|---|
| 1 | `protocols` 是**裸名字数组** | `"relay.run/v2"` 只是个名字。两个 Runtime 对着**不同修订版**的同名协议编译，指纹完全相同 ⇒ 握手通过 ⇒ 然后 Runtime 拒掉对方发来的每一个节点。**这不是假设**——本卡之内 `relay.run/v2` 就实质变过两次（6.1 的 `$ref` 全量重写、6.2 的 `required` 改必填） |
| 2 | 改成 `{id, digest}` 对，另加 `executor_kinds` 维度 | 只枚举 `contracts/` **顶层** 7 份，`_shared/` 不在内。实测把 `relay.common/v1` 的 `locator.pattern` 改成 `^.*$`（G5 绝对路径禁令**彻底失效**）之后，`capability_hash` **逐字未变** |
| 3 | 纳入共享定义模块 ⇒ **8 条** | DHR_29 当时形态。`capability_hash` 由 `5c5685d0…` 变 `3ccf3b10…`——**这个变化本身是正确的，它确实是一次能力变更** |
| 4 | 继续按同一规则扩到 **20 份**（19 个顶层协议 + 1 个共享定义模块） | DHR_77 当前形态；v1、bootstrap、v2 共用该完整 baseline，当前 hash 为 `241a8804525a2d40…`。旧固定 v1 hash 不再是兼容常量。 |

`executor_kinds` 这个维度存在的理由：只托管 `process` 的 Runtime 与还托管 `dsh-agent`/`pi-agent`/`herdr-agent` 的，前三个键完全相同 ⇒ 指纹相同。**在 P5 特别活**——`pi-agent` 是 DevPlan §4.2 明列的 P5-X 条件项、非必达，**两个都合规的 P5 构建**（带 / 不带 Pi Adapter）在没有本键时指纹一模一样。

> 当前基线：`methods` 7 个、`notifications` 2 个、`executor_kinds = ["herdr-agent", "process"]`。将来若加入 Pi Adapter 或 DSH Native，算出**另一个**指纹是设计意图，不是回归。

### 6.4a Executor Profile 与 Herdr Adapter 现役边界（DHR_32/33）

- `relay-core/profiles/` 是闭字段 Executor Profile 注册表、校验器与 fixtures；用户级候选只保存路径模板、别名、能力位、掩码身份和 fallback 引用，不保存凭据值。注册表机读层目前不表达「当前可派/停用」；`codex-ninth` 未登录、当前不可派只由 DHR_32 evidence/findings 记录，下游不得仅凭六项 CLI 能力位推导它可派。
- `relay-core/runtime/executors/herdr/` 通过 Herdr CLI 实现 launch/observe/capture/reconcile/stop，Runtime 的 `herdr-agent` 分支负责 Attempt 与事件账。`done` 不直接等于 succeeded；无 judge 时只形成有界 Attention，判定器语义留 DHR_35。
- **DHR_75**：Herdr CLI wrapper 已改为 `spawn` + Promise，所有 adapter 调用点等待 Promise；通用 10s、启动 60s 与生产 Host lease 15s 均未改变。超时在 Windows 先用 `taskkill /T /F` 清进程树（清理工具自身上限 5s）并等 child `close` 后返回既有 `spawn:ETIMEDOUT` 形状；spawn/stream/signal/非零/空 stdout 的既有失败映射保持。正常 taskkill 路径已有真实父子进程零残留证据；若 taskkill 工具自身失败，Node fallback 只能保证父进程有界终止，要求异常路径也绝对清零须另建 Windows Job Object/专用清理能力，不能在 wrapper 内假装已保证。
- 当前只证明 Windows/DSH-off 慢路与安全 focus；DHR_77 已闭合 v1/bootstrap/v2 共用 capability hash 的协议与定向机器证。真实 Linux SSH、事件快路及 Codex/Claude Receipt→Result 业务闭环仍是 DHR_35 的受限项；fixture 不替代真实 SSH 证据。

- **DHR_76（已合入）**：runtime loader `await validateProfilesAsync()` 对完整 registry 校验；结构/fallback 先验，每 Profile 保持 config→alias 原首错顺序。同步 CLI `validateProfiles()` 兼容保留，runtime alias 使用异步子进程。默认单探针/整轮/清理宽限为 15s/60s/10s，Host lease TTL 不变；Windows 正常超时通过 taskkill /T /F 并等待 root close。DHR-B-42 明确：若 10 秒宽限耗尽仍无法确认，允许以 `E_UNRESOLVED_ALIAS:probe-cleanup-incomplete` 或 `probe-close-timeout` 异常拒绝，必须标记清理未确认、不得声称无残留、不得继续启动，该异常不计清理验收通过；loader 仍包装 `E_BAD_VALUE:PROFILE_REGISTRY`。driver 仅在 loader 返回后复查 stopping，停止期间不新开 Attempt；不新增探针取消协议。A~F 和独立复核终态见 `workspace/DHR_76/review.md`，不得替代 DHR_75/72/35 实录。
### 6.5 `digestExcluding` 曾被 `__proto__` 键静默吃掉（F-062，P1）

首版 `const copy = {}` 让 `copy["__proto__"] = X` 触发 `Object.prototype.__proto__` 的 **setter**（改 copy 的原型），而不是建一个同名自有属性——该键从此在 `Object.keys(copy)` 里消失，**两份不同载荷算出同一摘要**。而 `JSON.parse('{"__proto__":{…}}')` 产出的正是自有可枚举属性，不需要刁钻构造。

它是 `request_digest` / `payload_digest`(×2) / `plan_digest` / `state_signature` **五分之四的实现**，而 `request.params` 与 `result.structured` 恰是 OPEN-POINTS 登记的开放点 ⇒ **真实协议流量里可达**。cp1/cp2/cp3 三轮复核全未抓到。

→ `copy` 改用 `Object.create(null)`，补 `npm test` 回归用例（退回修复即红，已实测）。**动 `canonical.mjs` 时别把它改回字面量对象。**

### 6.6 「不导入私有类型」这个全称命题曾用黑名单实现（F-063）

验收口径第 2 条是**全称命题**（「不导入五家私有类型」），实现却是 `forbidden-types.txt` 黑名单——黑名单只能证明「没有我想到的那几种」。同一根因在本卡冒头两次（漏 `pi`、删掉四个词不被拦）。

→ 新增 `structural-tokens.txt` **白名单**登记全部 162 个结构位置 token，未登记 `exit 1`、陈旧登记也拦、清单文件缺失也拦（不静默降级）。黑名单保留为第二层。**加新字段名 / 枚举值 / 常量时必须跑 `--write-tokens`**，否则闸会红——这是有意的，它逼你在 diff 里显式承认这个新 token。

### 6.7 空绿反复出现（F-020 / F-080）

- `npm test` 在**零测试时仍退出 0**（`tests 0 / pass 0 / fail 0`），而 README 读起来像已可用；`node --test` 不指路径会去扫 `node_modules`、实测挂死。→ 已改为指定文件，且测试内**断言 fixture 份数**（不是下限，是精确数），空绿这条路被机器堵死。
- `validate.mjs` 无参调用打印用法后 **exit 0**——CI 里变量为空会静默绿。→ 改 `exit 2`。同批修掉双模守卫在 `process.argv[1]` 未定义（`node -e` / REPL / stdin）时 `pathToFileURL(undefined)` 抛 TypeError、模块半边整个不可用的问题。

### 6.8 测试名比断言强（F-072 / F-077）

「fail-closed **三条**各有一份反例钉住」实际只断言两个码、第三条只查文件存在；「审计 **9** 维度」而审计器已是 11 维度；元数据表写「12 份契约的 digest 基线」而实际是 7 份（12 是审计器的**扫描面**不是基线**覆盖面**）。

**测试标题是下游最先读到的东西**，`npm test` 全绿会让人相信断言和标题一样强。inline 注释是诚实的，但注释不进测试报告。→ 三处已改名并把欠账写进断言消息。

> 这八条里有五条是同一个形态的复发：**「形态冒充语义」——用一个更容易做到的事替代真正要证的那件事**（数命中次数冒充无遗漏、`$ref` 存在冒充目标闭合、名字相同冒充能力相同、退出码 0 冒充测试通过、标题冒充断言）。本卡最后一次抓到它是在第五层下沉（6.4 的第 2 步）。**在 `relay-core/` 里加任何检查时，先问一句：我断言的这件事，是不是比我要证的那件事更容易做到？**

## 7. 硬约束与禁改边界

`README.md` 的 6 条，逐条摘要（原文以 README 为准）：

1. **协议平台/客户端/业务域无关**：`contracts/` 与 `tools/` 不得导入 DSH / Cordis / Pi / Herdr / DevHarness 私有类型。
   - **例外（白名单）**：`pi-agent` / `dsh-agent` / `herdr-agent` 作为 `executor_kind` 的**不透明枚举字面量**允许出现——禁的是导入的类型名，不是厂商 token；且 H6 的契约断言本身依赖 `dsh-agent` 存在。
2. **不得把 Core 嵌入 DSH Web 进程**——design/05 §6.3 明列为不接受项，要改须回 A 立项。
3. **fail-closed**：未知字段、未知版本、能力不匹配一律拒绝，不得降级放行。
4. **locator 一律相对 / 符号化**，禁绝对路径（Windows 盘符 / UNC / POSIX 绝对 / 带 scheme 的 URI 全拒）。
5. **运行现场不入仓**：Run Store 根 = `<repo>/.dh-relay/<run_id>/`。仓根 `.gitignore` 第 17 行 `.dh-relay/` 已覆盖（任意深度，比 DevPlan 要求的根锚定更宽）。**Relay 不得自行改业务仓 `.gitignore`**，缺前置时 start fail-closed（`E_GITIGNORE_MISSING`）。判定须按 Git 的忽略语义（如 `git check-ignore`），**不得字面量匹配单一模式**——本仓用的正是任意深度模式，字面量找 `/.dh-relay/` 会假阴性。
6. **仓根 `tools/`（PowerShell）只读**：行为、契约与测试命题作 **Oracle**，文件级实施**不迁移**。注意它与 `relay-core/tools/` 不是一回事。

另：**`.dh-runtime/relay/`（v1 运行现场）只读发现与投影，不 resume、零新写**。

## 8. 交给下游的东西

### 8.1 有意开放点 3 处（`OPEN-POINTS.md`）

| # | 位置 | 为什么开 | 谁收窄 |
|---|---|---|---|
| O-1 | `relay.result/v2` → `structured` | **协议业务域无关这条硬约束的唯一泄压阀**。v1 把 `git_snapshot` / `changed_paths` / `tests_run` 写进契约必填（隐含假设「任务=改代码」），v2 要中立就必须有通用载荷 | **不收窄**（有意长期开放） |
| O-2 | `relay.rpc/v1` → `request.params` | 参数形状按 method 变，本卡不含 per-method schema | P6/P7 |
| O-3 | `relay.rpc/v1` → `response.result` | 同上 | DHR_30 冻结正式 Read Model 时可先收窄 `inspectRun` / `listRuns` |

**O-1 的代价（不掩盖）**：`structured` 内**私有类型中立性**与 **locator 相对化**两条硬约束不由 schema 保证。协议层**正式不承诺**这两条在该字段内成立。DHR_29 落盘 `structured` 时须复用 v1 `relay-redaction.ps1` 的口径做凭据脱敏。

**`notification.params` 不是开放点**——它由 `allOf` + `if/then` 按 method 条件收窄。但**闭合完全依赖「`method` 枚举值与 `if/then` 分支一一对应」**：P7/P8 若往 notification method 加第三个值而忘了加分支，`params` 会**静默退回完全开放**。**加值必须同批加分支并复跑审计器。**

### 8.2 交给 DHR_29 的四条已知缺口（K-1~K-4）

| # | 一句话 | 为什么现在写下来 |
|---|---|---|
| **K-1** | `waiting_human` 在已冻结的七份契约里**没有产生者**——没有 event kind 能产生它，唯一产生者 `relay.attention/v1` 还在未冻结的 v0 形状里 | P5-M3 要「强杀 Runtime 后从 Store 重建相同状态签名」。若状态只能从事件回放重建，这个状态**重建不出来**。设计恢复路径前必须先回答 |
| **K-2** | v1 用 `attempt_id` 的整数序区分 `stale` / `rejected`，v2 的 `attempt_id` 是**不透明串、无序**，该机制没了 | **可恢复**：`relay.event/v2` 有单调 `seq` 能提供序。但你得知道要去找它 |
| **K-3** | 身份 token 的 pattern 在 **13 处逐字重复**（`receipt_id` / `request_id` / `checkpoint_id` / `attention_id` / `approval_id` 全是内联副本） | **本卡不改的理由如实说**：加 `$defs/identifier` 是对的做法，但会改动多份 schema 全文摘要 ⇒ `capability_hash` 变化。按纪律这类修订应**批量发**，留给 DHR_29 的第一次契约修订批次一并做 |
| **K-4** | `relay.attention/v1`（v0）的 `reason` 必填（须是 `E_*` 码），而 `reason-codes.md` 明写「观测中断不产生任何 reason code」，且全表 23 个码里**没有**能给 `needs_input` 用的 | P7 冻结 attention 时必须二选一：`reason` 改可选，或补一个「需要人输入」类的码 |

### 8.3 `v1-gap-disposition.md` 末尾的「DHR_30 开工前必读」

**本卡已经替 DHR_30 冻掉了三个 Read Model 展示字段**——`relay.run-state/v1` 的 `group`（必填 + 6 条映射由 `allOf` 机器强制）、`progress`、`elapsed_seconds`。冻结在授权范围内，**但从 DevPlan 的卡面上看不见这个天花板**。三条具体约束：

1. **`group` 是 `run_status` 的全函数**，携带零独立信息。将来若正式 Read Model 需要一种不是 `run_status` 纯函数的分堆，**须改契约**（这同时是 `state_signature` 可复算的前提：源头对 group 有裁量 = 同一状态两个实现算出不同签名 = P5-M3 直接失效）。
2. **`group` 的词表与 pilot 不同**：pilot 是 `[needs_you, blocked, running, done]`，v2 是 `[needs_you, running, done, failed]`；`failed` 的归堆也从 `needs_you` 改成了 `failed`。
3. **`progress` 是 pilot 的 `{done, total}` 计数对**（本卡首版擅自改成 0..1 比率，会让 P4 已验证的跨屏断言「progress 等于详情节点实际计数」无法表达，已改回）。`done <= total` schema 表达不了，交实现期守。

另：**`node_states` 必填 + `minItems: 1` 只约束「完整状态文档」这一形态**。列表 / 摘要投影**不复用**本协议，应沿 `relay.pilot-run-list/v1` 血统另立列表协议。

另两处 schema 表达不了、交 DHR_29 守的语义约束：**`node_states` 须覆盖 `nodes` 全集**、**`labels` 按 `key` 升序且 `key` 在同一 Run 内唯一**。

### 8.4 `compat-matrix.md` §6 移交三条

`authority_generation` → lease 的语义等价性复核（**B-15 后归 DHR_51**）；7 段身份链 → `receipt_id` 单锚点的迟到结果判定；会话尾巴脱敏（`SessionTailMaxBytes` + redaction）。三条原移交 DHR_29，**都要用 P1 的 fixture 作 Oracle 复验「不弱于 v1」**。**DHR_29 处置（2026-08-22）**：迟到判定已用 P1 fixture 复验（`store.test.mjs`「P1 迟到结果 fixture 复验」一测：隔离 ≥ result_stale、冲突码 ≥ CAS）；脱敏已按 v1 redaction 口径对齐并双路钉死；**DHR_51 处置（2026-08-22，F-105 落账）**：lease 一条以 `result-A1-wrong-generation.json` 为 Oracle 复验（`runtime.test.mjs`「移交②」用例）——v1 权威代次（写时 CAS 比代次）≙ v2 fencing（写时重验 lease 持有人，覆盖一切变更入口而非仅 result）；v1 恢复锁陈旧回收 ≙ 「死持有人视同过期可接管」+ wx 独占仲裁；结论：**v2 唯一写者保证不弱于 v1 且严格更强**（接管事件可追溯、TTL 过期兜底、fencing 全入口）。差异面：v1 无显式接管概念，v2 显式接管并补记 lease 事件。

### 8.5 findings 里 `open` 的条目

本卡 findings 81 条，7 条 `open`。**`F-064` 是唯一 open 的 P1**，见 §9。其余 6 条：F-042（P3，手写 `KEYWORD_TYPES` 与 ajv 两套 meta-schema 规则可能漂移——**已由 DHR_29 批次收口：ajv.validateSchema 为权威 + 分叉 tripwire 进审计第③闸**）、F-013（P2，`format: "date-time"` 空转，已由 `relay.common/v1` 的 RFC3339 `pattern` 实际承担）、F-010 / F-009 / F-001 / F-061（工具链与仓级存量，与 `relay-core/` 本体无关）。

## 9. 已知不覆盖的（说清楚，别当已兑现）

**能力不匹配 fail-closed 已由 DHR_52 接入运行期、由 DHR_77 闭合 v1/v2 当前基线**：契约层仍只校验 `capability_hash` 的形态；`rpc/capabilities.mjs` 复算权威 20 份 capability 基线，v1 与 v2 返回同一当前 hash，`server.mjs` 在冻结信封通过后严格比较 peer hash。形态合法但不同的 hash（含旧固定 v1 值）在 handler/subscribe 前返回 `E_CAPABILITY_MISMATCH`，不按交集降级、不产生订阅推送。

另两处 schema 层的固有边界（`OPEN-POINTS.md` §H6，**不是缺陷但别以为 H6 已被完全兜住**）：

1. **schema 判不了「结构性必经」（DAG 可达性）**。一个 `required: false` 的 DSH-only 节点，被一个 `required: true` 的节点依赖 ⇒ 它在 DAG 上**事实必经**，H6 一次都不触发。**这不是故意规避，是诚实实现者会自然写出的形状。** ⇒ 移交 DHR_30 / DHR_31：Workflow 定义期须做可达性推导后再校验 H6。
2. **只拦 `dsh-agent` 这一个字面量，不拦「实质 DSH-only」**。`{kind: "process", ref: "bridge/dsh-shim.exe"}` 会被判为合法的非 DSH Executor。**加 `executor_kind` 枚举值时必须回头检查这条断言。**

## 10. 从这里往下怎么走

| 你是 | 先读 |
|---|---|
| DHR_29（Runtime） | 本文 §7 硬约束 → §8.2 K-1~K-4 → §8.4 移交三条 → §9 F-064 → `ADR-002`（executor 生命周期语义的**唯一**来源） |
| DHR_51（宿主/lease/发号） | 本文 §3.5（Store 边界）→ **§3.6（runtime 全貌）** → §5 闸表 → §8.4（lease 等价性已落账）→ `runtime/*.mjs` 源码 → `workspace/DHR_51/{findings,review}.md` |
| DHR_52（RPC/握手） | **§3.6（host-lease.json 形态与 fencing 接线）** → §8.1 O-2/O-3 → F-107（指纹要素评估触发点） |
| DHR_30（CLI / Read Model，已完成） | 本文 §3.8~§3.10 → design/06 §14（Read Model 字段冻结）→ design/07、design/08（service 与 RPC/ReadModel 合同）→ `workspace/DHR_30/{findings,review}.md` |
| DHR_31（端到端闭环） | 本文 §3.8（service 是唯一写者装配人，workflow/executor 不在其内）→ §9 第 1 条（H6 可达性推导归你）→ design/06 §14.4（排序合同，客户端不推导）→ DSH 附加客户端项含**真实 DSH 渲染截图**（DHR_30 收口移交，见其 review.md 条件 5） |
| 要改 `contracts/` 任何一个字的人 | 本文 §5「三份基线互不覆盖」→ §6 全节 → `CANONICALIZATION.md` §三 |

## 11. DHR_64 增量 —— Receipt-bound Result bridge

- **唯一提交路径**：`relay.executor-result-submission/v1` 是闭集 submission；v2 `submit-executor-result` 只把 matching Receipt 交给恢复后的 driver gate，driver 经 actor 调 `Store.submitExecutorResult()`。Store 从完整、当前、`herdr-agent` Attempt Receipt 派生 Result、terminal event、state 与 payload digest，并以同一个 mutation journal durable commit 后才 Ack。
- **拒绝与恢复**：旧/未知/非当前 Receipt 为 `E_IDENTITY_MISMATCH`，canonical fallback fence 为 `E_ATTEMPT_FENCED`，lease 丢失、伪 Receipt、坏 Result/事件账均 fail-closed；terminal duplicate 仅同 digest 已提交账本幂等。service 在任何 actor/lease 前校验所有恢复 candidate，坏 Receipt 阻止前序 Run 改账。
- **Herdr 与 CLI 边界**：done、idle、judge、capture、pane、host status、exit code 不生成 Result；缺 submission 写 `E_EXECUTOR_RESULT_MISSING` Attention。v2 CLI 不降级，socket close/error 会清 timer、拒绝全部在途 waiter 为 `E_TRANSPORT_CLOSED`。
- **证据**：`dhr64-result-bridge.test.mjs` 分三组 6/6、1/1、3/3；`dhr64-store-reject-matrix.test.mjs` 2/2；`dhr64-driver-observation.test.mjs` 3/3。默认全量历史运行未得终态且含 DHR33/DHR34 旧语义差异，不能作为绿色或本卡范围扩张理由。

## 12. DHR_70 增量 —— 提交权在 Attempt 非终态时的 gate/actor 生命周期

- **修的是什么**：gate 活得比它那一届 actor 长，而提交只认 actor。`driveRun` 的 done 回调在 `hasOpenSubmissionGates` 为真时**故意保留** driver（`service.mjs:301`，意图是"晚交不得绕过 gate"），但 driver 构造时就捕获了 actor 引用（`workflow-driver.mjs:95`）；那一届 actor 一失租关闭，这条被特意保留的 gate 就指着一具尸体，`submitExecutorResult` 首轮 drivers 循环把 `E_LEASE_HELD:actor-closed` 直接抛出调用栈，**走不到**下面从 durable 事实重建 actor/driver 的兜底。这就是 DHR_35 实录 E-3526 的形态（Claude 启动与 Receipt 均成功、提交撞 `actor-closed`、节点停 running 无 Result）。
- **现在的行为**：首轮循环捕获**精确**的 `E_LEASE_HELD:actor-closed` → `evictClosedActor` 摘掉这一届 driver 与已关闭的 actor（两处都带 `map.get(runId) === 实例` 的换届守卫，且先 `await dead.done` 让 `ensureActor` 注册在先的 `actors.delete` 回调跑完）→ `continue` 落进既有 durable 路径：`ensureActor` **重新取 lease** → `driveRun` → `registerSubmissionGate` 重建同一 Receipt 的 gate → 提交。
- **单写者没有被放宽（红线）**：只认 `actor-closed` 这一个完整 message。真正的 `E_LEASE_HELD:lease-lost` 是 Store `writeGuard` 在落盘前的 fence，是单写者本体，**原样抛出**。`host.mjs` 的拒绝条件与 lease 合同一个字没动。另一进程活着持有 lease 时，重建路径会在 `acquireLease` 被裸 `E_LEASE_HELD` 挡住——拒绝这件事本身不依赖 actor 是否已关闭。
- **契约同步**：design/12「Gate 生命周期」末句原文"不得从 drivers map 删除该 receiver gate"已同步为"gate 不得失去**可达性**"（DHR_70，用户对话授权扩路径；起因是需求复核 F-70-REQ-01 与一致性复核裁决 1/2 独立收敛到同一处）。gate 的归属仍是 **Receipt/Attempt，不是某一届 actor**——这是读这段代码时最容易读反的地方。
- **已知边界与坑**：
  - `actor-closed` 是按**完整 message 精确匹配**分流的，不是结构化字段——因为 `error.reason` 上两类错误都塌缩成 `E_LEASE_HELD`，光看 reason 分不出"陈旧 route 可重建"与"写入 fence 必须拒绝"。仓内既有 `host.mjs` 的 `isLostLease` 也是同款精确匹配，形态一致。**后续若有人把它泛化成 `startsWith('E_LEASE_HELD')`，等于把单写者闸门拆了**（一致性复核裁决 1）。
  - `runHostSession` 的 lease TTL / tick 不可从 `createHostSessionActor` 外部注入，夹具只能等 5s tick，A2 单例耗时约 11.6s（F-7002，记录不修）。
  - 本卡**不跑真实 Agent**：A4 的真实闭环仍归 DHR_35，机器证用受控夹具跑真实 service/driver。
- **证据**：`dhr70-submission-gate.test.mjs` 6/6（A1 lease 有效晚交 / A2 失租后重建补交 / A3-1 真接管一直拒 / A3-2 非 current Receipt / A3-3+B 终态冲突与未知 Receipt / C `agent_get=idle ∧ pane_get=error` 不判死 Attempt）。A2 断言链覆盖口径两半：拒绝阶段逐次 `E_LEASE_HELD` + 事件账逐字节不变，成功后 `holder_pid`/`epoch+2`/`lease_acquired` 恰新增一条。

## 13. DHR_72 增量 —— Herdr driver 持续观测

- **修的是什么**：`idle` / host-side `done` 只表示 Herdr 当前没有更多进展，不是 Receipt Result。driver 不再在首次 idle 后停止；缺 Result 时只去重写一条 `E_EXECUTOR_RESULT_MISSING` Attention，随后继续轮询，因此稍后的 `working`、合法晚交 Result 或 host loss 仍可观测。
- **checkpoint 与出口**：只有真实 `working` 才追加 checkpoint；长期 idle 折叠为 `waiting_human`，不产生 Result。committed Result、显式 stop、host_lost、Attempt 已终态，以及 actor-closed/lease-lost 写入失败仍是退出边界，退出后不再追加观测事件。
- **边界**：DHR_72 的 DSH-off Codex 实录只证明 checkpoint 可达，明确禁止 submit-result，不能替代 DHR_35 的 Receipt→Result 完整闭环。poll 比例守卫只覆盖列名 fixture 参数，不是全局生产默认值守卫。
- **证据**：专属套件 8/8、poll 守卫 1/1、冻结五文件 55/55（0 skip/0 fail）；真实 run6 保存 4 条 `checkpoint_recorded`、2 条 alive observation、0 Result。fresh 二轮选定 idle/done 分支提前 `return` 的生产变异点，变异后指定用例以 `timeout:working checkpoint` 失败，还原后 1/1。

## 14. DHR_77 增量 —— terminal-instance `host_ref` 与旧账只读兼容

- **来源与算法**：Herdr adapter 只接受 API 返回对象里的非空 string `terminal_id`，逐字计算 `SHA-256(UTF8("dh-relay.host-ref/v1\0" + terminal_id))`，展示为完整小写 `herdr-terminal/sha256-<64 hex>`。不 trim/normalize/case-fold，不从 pane、agent、session、路径、Receipt 或诊断文本 fallback；原始值只可留在运行期 handle，不进事件、Read Model、CLI 或证据。
- **生命周期与事件**：alive 必带当前 ref；lost 有历史则保留最后成功 ref、从未成功则缺省；同 ID 保持、不同 ID 形成 replacement，即使 `working→working` 也写新观测事件。恢复只用既有 `executor_ref` 重新查询 Herdr，不从旧事件诊断文本重建；旧事件不回写。
- **协议与 Store**：event/v2 与 host-observation/v0 对齐 nullable/optional 字段及 alive/非观测约束。新 writer 仍严格拒绝 alive 缺 ref。`loadEvents` 只有一个用户确认的 B-46 形状级历史例外：原 schema 失败且事件为 otherwise-valid alive v2、对象自身缺字段时，浅拷贝补固定全零 sentinel 仅供 schema 复验；返回原事件，不迁移、不写回、不造 ref。显式 null 与任何邻近损坏继续拒绝。
- **capability 与展示**：v1、bootstrap、v2 共用包含 event/v2 的 20 份完整 baseline；旧固定 v1 hash 在方法分派/订阅注册前拒绝且零推送。focus 默认安全投影移除诊断字段；非空 ref 按 alive/lost 标“当前观测/历史观测”，显式 null 标“尚无可信 terminal 标签”，旧账缺字段标“legacy 未提供”；`executor_ref` 仍只是 attach locator。
- **诚实边界**：现存账没有可信代际标记，真正旧账与升级后删字段的同形损坏账无法区分，方案 A 会把两者都按 legacy 只读接纳；该残余由用户在 DHR-B-46 明文接受。完整 `npm test` 仍未得自然终态，已知 DHR_76/C 预算断言与 DHR_34 identity-quota 挂起保持范围外；DHR_77 的受控 Herdr/DSH-off 标签对照不替代 DHR_35 真实产品 Agent、Linux SSH 或 Receipt→Result 闭环。

## 15. DHR_78 增量 —— 单一启动内容、一次补发与持久占次

- **任务引用合同**：run/v2 的 Herdr node 条件必填 `instruction_ref={path,sha256}`；loader 对仓根与目标分别 `realpath` 后判包含关系，再核 UTF-8 正文 SHA-256。缺失、仓根逃逸、摘要不匹配均在创建 Attempt/启动 Agent 前 fail-closed。prompt 只含仓根、任务指针与 Receipt 提交说明；业务正文和凭据不进发送账。
- **唯一 sender 与最终守卫**：workflow driver 的正常首发、启动 blocked 解除后的首发、60 秒补发均收敛 `dispatchStartupInstruction`，物理调用只经 Herdr adapter 的 `sendStartupInstruction`。每次先在 Store 队列持久占次并最终确认当前 Receipt/Attempt、无 checkpoint/Result；确认后重新读取 source/digest、重新观测同 `host_ref` 且状态为 idle/working/done，随后无异步间隔地调用 sender。
- **补发与恢复**：同一存活 driver 首发 accepted 后用单调时钟计 60 秒；若 Store 仍无当前 Attempt checkpoint/Result，原样补发一次。host 的 working 字样不是进展事实；Store checkpoint/Result 才是。总次数封闭为 1/2，失败、超时、失租、stop、blocked/unknown、身份或源漂移均停止；恢复旧 Attempt 永不自动再发。占次后调用前中断保留 `authorized`，Attention 明示可能未送达，要求检查现场、必要时 stop 旧执行再显式新执行。
- **私有账与边界**：`startup-dispatch.json` 只保存 version、Receipt/Attempt/node 关联、send_count、host_ref、prompt_digest、outcome，复用 Store 原子写与 Run 保留策略；不新增公开 event/RPC/read-model，不改变 checkpoint/Result 算法。当前专项 17/17、契约+专项 32/32、受影响 11 文件 125/125 自然终态通过；有效 host-status 变异红、还原绿。完整 `npm test` 因 DHR_76 时间预算旧断言与 identity-quota 旧 `herdrJudge`/Receipt 迁移尾项未得终态，不能写成全量绿；后者保留独立卡处理，真实产品链与 A9 外围分账仍属 DHR_35。

## 16. DHR_80 增量 —— 人工 retry Receipt 的结果提交模式接线

- **A→B**：A 为人工 `retry-with-profile` 产生的 fresh Receipt 没有提交模式，正式 v2 `submit-executor-result` 入口返回 `E_IDENTITY_MISMATCH`；B 仅在 `runtime/attempt-retry.mjs` 的 Receipt 构造处新增 immutable `result_submission_mode: 'receipt-bound/v1'`，沿用现役 actor、gate、Store 单写者和恢复路径，正式入口可形成 succeeded/failed committed Ack 与派生 Result。`service.mjs`、`workflow-driver.mjs`、Store 和公开 schema 未改。
- **恢复与边界**：该字段只适用于新 retry Receipt；历史缺 mode 的 Receipt 不迁移、不原地升级，旧 Receipt/旧 Attempt 仍 fenced。done/idle 无正式 submission 仍不产 Result、不触发 fallback 或 Agent 启动；retry 创建 fresh Attempt 不等于启动 Agent。
- **证据边界**：DHR80、attempt-contract、DHR64、DHR70 基础组合自然终态 37/37；`audit-contracts.mjs` 0 未登记开口、0 审计失败。默认 `npm test` 已补收专项；主控按用户授权终止卡死的 `identity-quota.test.mjs` 子进程后，本次唯一全量运行退出为 370 tests / 365 pass / 5 fail / 0 cancelled、exit 1。DHR_76/C 预算断言与 `identity-quota` 有历史同形，CLI 并发、DHR_69/F、DHR_76/B 仍未证明基线同形；不能记全量绿或用定向绿抵扣。

## 17. DHR_81 增量 —— 启动包络的执行顺序

- **固定语义**：`loadStartupInstruction()` 仍只读取并校验 `instruction_ref`，不复制正文；成功后生成的唯一 sender 包络明确要求先打开任务指针，再把其中正文作为当前 Attempt 的唯一业务任务执行，最后按真实结果提交 Receipt。`submit-result` 命令不是业务任务。
- **边界保持**：包络只含仓根、指针、摘要和 Receipt 提交说明；私有发送账继续只存 `prompt_digest` 等元数据。缺失、越界或摘要变化仍在 Attempt/Agent 前 fail-closed；Sender、Store、driver、重试与真实 Agent 均未改。
- **证据边界**：专项对完整动态包络作精确断言，固定顺序、succeeded/failed 两条提交命令、Receipt 非业务任务与正文零复制，并保留既有 17 项发送、一次补发、拒绝与恢复断言。该 fake/fixture 证据不证明真实 Agent 已读取或执行任务文件，DHR_35 仍独自承接 A16/H4/P6-M1。
