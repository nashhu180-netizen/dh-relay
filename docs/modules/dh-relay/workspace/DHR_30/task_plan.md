<!-- dh:v1 -->
# task_plan — DHR_30 Relay CLI 与可选 DSH/Pi Bridge

## 要读的上下文 (Context Packet) ★前置

| ID | 来源 (path / url) | 为什么 |
|----|------------------|--------|
| C-001 | `dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md` §2.1、§2.3、§3.2 DHR_30 | 命令面、验收、精确边界与 DHR_50 条件。 |
| C-002 | `relay-core/README.md`、`docs/modules/dh-relay/as-built/relay-core.md` | 冻结协议、基线闸和 DHR_29/51/52 的既有实现接口。 |
| C-003 | `relay-core/contracts/v1-gap-disposition.md:107-113` | Read Model 字段冻结起点和不可静默漂移规则。 |
| C-004 | `relay-core/rpc/server.mjs`、`relay-core/rpc/transport.mjs`、`relay-core/test/rpc.test.mjs` | 现有 RPC server/transport seam 与真实 socket 测试样板。 |
| C-005 | `workspace/DHR_26/` findings 与 `src/dsh-host/README.md` | 条件执行 Bridge 的 DSH 插件装载、公开 API 与零 bare-import 约束。 |

## 施工步骤 (Steps)　★详细级

> `DHR-A-13/A-14` 与 `DHR-B-18` 已将 F-001 的 Runtime service 承接纳入本卡；以下步骤以
> design/07、design/08 为唯一合同。不得先写 CLI 再补 service。

| # | 改动文件（Create/Modify/Test + 路径:行） | 怎么改（代码片 / 签名） | 怎么验（命令 → 预期输出） |
|---|------------------------------------------|----------------------|--------------------------|
| 1 | Test/Modify · `relay-core/contracts/`、`relay-core/fixtures/`、`relay-core/test/` | 先把 design/08 的 method/Read Model、operation Receipt/event、reason code 与 notification schema 落成红测；同步 capability baseline/manifest。 | 契约 validator、negative fixtures、capability baseline 初始红后转绿。 |
| 2 | Create/Modify · `relay-core/runtime/{endpoint,service,service-main,host}.mjs` 与 tests | 实现确定性 endpoint、owner-aware UDS 清理、私有 credential、唯一 operation ledger、run_id reservation 和内嵌 HostSessionActor；不 import workflow/Process/executor。 | 双 launcher、各 phase crash/retry、actor lease/stop/resume、restart discovery 真实进程测试通过。 |
| 3 | Modify · `relay-core/rpc/`；Test · RPC socket tests | 把 `contracts` 连接闸、method schema、稳定业务 error、subscribe barrier/cursor 接入 service handlers；客户端断开只清订阅。 | 未授权/identity/cursor/legacy 失败不断连；并发 snapshot/live/reconnect 用例通过。 |
| 4 | Create · `relay-core/cli/`；Test · CLI tests | 用唯一 RPC client 实现 list/status/inspect/events/start/stop/resume；text/json 只渲染同一 Read Model，重试复用私有 pending operation。 | 无 DSH 的真实 service+CLI 七路径通过。 |
| 4 | Create · `relay-core/adapters/dsh-bridge/`、`relay-core/fixtures/clients/`；Test · adapter/client fixtures tests | 依据 DHR_26 资料以 RPC adapter 实现查询/订阅/重连/窄控制，禁止 Store 导入与 DSH 私有类型入协议；提供 Pi/通用 client JSON fixture 与可复跑解析例。 | adapter/client 定向测试 → 绿；真实 DSH 页面截图库或等价渲染证据 → 可审。 |
| 5 | Modify · `docs/modules/dh-relay/design/06-多控制面与Headless-SSH运行-设计补充.md`；Modify · `dev_plan/P4-DSH工作台最小Pilot-开发方案.md` §0.2 | 在 design/06 增字段级 Read Model 定义和 `whitelist-exception-closed: DHR_30`；P4 §0.2 仅机械回注同一标记回链。 | 两端 `rg -n "whitelist-exception-closed: DHR_30"` → 各命中；Read Model 镜像断言 → 绿。 |
| 6 | Record · `workspace/DHR_30/{progress,findings,review}.md`；Modify · `as-built/relay-core.md` | 跑全量基线、批次小审与收口证据；逐条记录 DHR_50 的约束和 Bridge 截图，不改 DHR_31。 | `npm test`、validator、audit、fixture manifest、capability baseline、`git diff --check` → 全绿。 |

## 批次 B 施工说明（步骤 4 · headless worker 粒度）

> 执行者为零上下文 headless worker；照本节做即可，不必重读全部合同。冲突时以
> design/07、design/08 为准。TDD 先红后绿；每完成一个命令族就 `npm test` 全量跑一遍。

### B-0 铁律（worker 必守）

- 只改 `relay-core/cli/**`、`relay-core/test/cli*.test.mjs`；不改 contracts/、runtime/、rpc/、store/ 任何一行（发现必须改 = 停下写 findings.md，不许自行动手）。
- 不派 agent、不问用户、不复核、不合并、不 push；blocked → 把卡点写进 `docs/modules/dh-relay/workspace/DHR_30/findings.md` 后停。
- 密钥/凭据值永不写入任何文件、测试、日志、提交信息。
- 提交信息格式照现有历史：`feat(dh-relay): …` / `test(dh-relay): …`，中文一句话。

### B-1 现有骨架的处置

`cli/main.mjs` 现在是带内联 `ensureService`（约 :25-59）的旧骨架——**整段删掉**，不保留兼容层：

- 服务发现/拉起一律用 `runtime/launcher.mjs` 的 `ensureRuntimeService({ repoRoot })`（内含 descriptor 回证 `handshakeIdentity()`，勿再自己探端口）。
- 凭据只用 `runtime/credentials.mjs` 的 `readLocalUserCapability(repoRoot)`（只读，缺失返回 null → CLI 报 `E_LOCAL_USER_UNAUTHORIZED` 类稳定错误并退出码非 0）；**禁止调用 `readOrCreateLocalUserCapability`**——客户端无权创建凭据（design/07 §3.4）。

### B-2 七条命令与渲染

`relay list / status <run_id> / inspect <run_id> / events <run_id> [--follow] / start … / stop <run_id> / resume <run_id>`，全部走唯一 RPC client（连接后首帧必发 `contracts` 回证）。

- `--json` 输出 = Read Model 原样序列化；text 输出 = 同一对象的人读渲染，**禁止 text 路径自己再算字段**。
- `list` 默认不含 legacy；`--include-legacy` 显式开启，legacy 条目渲染 `read_only:true`；对 legacy/孤儿发控制命令时把服务端 `E_LEGACY_READ_ONLY` / `E_ORPHAN_STORE_READ_ONLY` 原样透传给用户，不做重试。
- 错误渲染：RPC error `data.receipt` 现为**必填**（`Receipt|null`，capability_hash `a990fdda`）——`receipt` 非 null 时按「操作已确定失败，凭同幂等键重试可拿回同一份 failed Receipt」提示；为 null 时按「结果未知，可安全重试」提示。二者措辞必须可区分，测试钉住。

### B-3 客户端 pending record（design/08 §2）

`start/stop/resume` 发送前先在 `.dh-relay/pending-operations.json` 原子落一条 request record（幂等键、method、params、时间戳；写法 = 临时文件 + rename）；收到 Receipt（成功或 failed）后删除该条。CLI 启动时若发现残留 record，用原幂等键先重试收敛再执行新命令。测试用 `DH_RELAY_INDEX_PATH` / `DH_RELAY_CREDENTIAL_ROOT` 环境变量重定向（样板见 `test/service.test.mjs` 的 processHarness）。

### B-4 events --follow

- 状态只来自 `runStateChanged` notification 与 subscribe 快照，**不得从 event 流推导状态**。
- 断线重连带 `after_seq` 续传；收到 `E_CURSOR_GAP` 时整体重新 snapshot（不许拼接补缝）。
- 退出：Ctrl-C / 流终态后正常收尾，退出码 0。

### B-5 验收（机器）

- 新增 `test/cli.test.mjs`（或拆多文件）：七路径×(text/json)、pending record 崩溃重试、receipt 渲染二分、legacy/孤儿拒绝透传、--follow 断线重连与 E_CURSOR_GAP 重新快照。全部走真实 service 进程（processHarness），不 mock RPC。
- `npm test` 全绿；`node tools/validate-contracts.mjs`（或 as-built 登记的 validator 命令）全绿；`git status` 干净；三份基线**不应变**（本批不动契约，若 validator 报基线漂移即为越界信号，停下写 findings）。
- 完工后在 `progress.md` 追加批次 B 记录（改了什么/测试数/遗留），新发现按 F-0xx 追加 findings.md。

## 批次 B 返工说明（小审 F-018~F-023、F-025 · headless worker 粒度）

> 背景：批次 B 小审 changes-requested（E-026）。逐条修复下列 findings（详情与证据行号见 `findings.md`）。F-024 已由主控直修，**不要碰 `test/rpc-service.test.mjs`**。

### RW-0 铁律（同 B-0，重申）

- 只许改：`relay-core/cli/**`、`relay-core/test/cli.test.mjs`、workspace 两份文档（progress.md / findings.md）。contracts/、runtime/、rpc/、store/、design 文档、三份基线**一律不动**——若发现修复需要动合同，停下写 findings，不要动手。
- 不派 agent、不问用户、不 push、不 merge；被卡住就把卡点写进 findings.md 然后停。

### RW-1 修 F-018（P0 · identity 竞争）

- `cli/client.mjs` identity 文件改**独占创建**：先 `readFile` 尝试读取；不存在则 `writeFile(path, json, { flag: 'wx', mode: 0o600 })`；`wx` 抛 `EEXIST` 时**重读盘上赢家**并使用之（绝不覆盖）。临时文件+rename 方案不满足「不覆盖」语义，禁用。
- pending record 增加 `client_id` 字段（见 RW-2）；`cli/main.mjs` 启动收敛残条时，重放帧的 handshake 用 **record 里存的** `client_id`，不用当前进程的 identity——保证复合幂等键与原请求逐字一致。

### RW-2 修 F-019（P1 · pending 无锁并发）

- `cli/pending.mjs` 增跨进程互斥：同目录 `pending-operations.lock` 以 `wx` 独占创建（内容写 `{pid, at}`），拿不到锁则短退避重试（如 50ms×最多 100 次）；锁文件 mtime 超过 10s 视为陈锁、先 unlink 再抢。`add`/`remove` 全程持锁做 read-modify-rename。
- record 持久**完整请求**：`client_id`、`request_id`、`method`、`params`、`request_digest`、`at`。收敛重放时逐字段用 record 值（配合 RW-1）。

### RW-3 修 F-020（P1 · pending 权限）

- pending 文件与其临时文件按 identity 同款收权：写入 `mode: 0o600`；若首次创建 `.dh-relay/` 相关目录用 `mode: 0o700`。锁文件同样 0o600。

### RW-4 修 F-021（P1 · 400ms backfill 窗）

- `cli/main.mjs` 非 follow 的 `events`：subscribe 响应快照里有 `next_seq`；`after_seq < seq < next_seq` 的补发事件**逐条计数收齐即完成**（`after_seq` 起点为用户传入或 0；无缺口时收到 seq = next_seq - 1 即收齐；`next_seq - 1 <= after_seq` 则无需等待直接完成）。固定时长 sleep 只许作 fail-out 上限（如 30s 超时报错退出码非 0），**不许作完成判据**。

### RW-5 修 F-022（P2 · 缺失 receipt fail-closed）

- `cli/client.mjs` 归一稳定拒绝时：`error.data` 中**无 `receipt` 属性**（`'receipt' in data === false`）即视为协议违约，抛传输层错误（措辞含 reason 与「协议违约：error data 缺 receipt」），使 pending 保留、CLI 报「结果未知」路径以外的协议错误。`receipt: null` 是合法值，不受影响。

### RW-6 修 F-023 + F-025（测试补齐 · argv 严格）

- `cli/main.mjs`：每个命令声明 positional 形状，多余 positional 一律 usage + 退出码 1（`relay list junk`、`relay start --run x junk` 必须拒绝）。
- `test/cli.test.mjs` 补用例（全部真实子进程，禁 mock）：
  1. 首次双 CLI 并发（同时 spawn 两个 `list`）：事后 identity 文件只有一个 `client_id`，两进程都成功退出。
  2. pending 并发写：两个 CLI 进程并发 mutating（不同 request_id），事后 ledger 无丢条（可用故意打断/慢化手段构造窗口，或直接并发跑多轮断言零丢失）。
  3. 成功 `resume --json` E2E（断言 receipt 字段与 Read Model 原样）。
  4. 凭据缺失走 **CLI 子进程** E2E（重定向 `DH_RELAY_CREDENTIAL_ROOT` 至空目录，断言退出码与 `E_LOCAL_USER_UNAUTHORIZED` 措辞）。
  5. RW-5 负例：伪造缺 `receipt` 字段的 error data（可起最小假服务或用测试钩子），断言按协议违约处理、pending 保留。
  6. RW-4：构造 backfill 事件量足够大（或延迟发送）的场景，断言非 follow `events` 收齐全部 `after_seq..next_seq-1` 事件。
  7. F-025：多余 positional 报 usage 退出码 1。

### RW-7 完工门（同 B-5）（一轮已完成；二轮见下）

- `npm test` 全绿（135 + 新增用例）；validator selftest 全绿；三份基线零漂移（capability_hash 仍 a990fdda）；`git status` 干净。
- 提交拆分：fix（RW-1~5 + F-025 实现）/ test（RW-6）/ docs（progress.md 返工记录 + findings.md F-018~F-023、F-025 → resolved，写明修法与提交号）。

## 批次 B 返工二轮说明（定向复审 not-closed 三条 · headless worker 粒度）

> 背景：一轮返工定向复审（E-033）判 F-019 / F-020 / F-023 未闭合（细节与证据行号见 findings.md 三条的复审记录）。铁律同 RW-0：白名单仍是 `relay-core/cli/**`、`relay-core/test/cli.test.mjs`、workspace 的 progress.md / findings.md 四处；**task_plan.md 是主控的，不许动**；contracts/runtime/rpc/store/design/基线/其余测试文件零改动。

### RW2-1 修 F-019（R-D-01 · 锁 owner token）

- `cli/pending.mjs` 锁文件内容加**随机 owner token**（如 `randomUUID()`）：`{pid, token, at}`。
- 释放锁前必须重读锁文件核验 token 是自己的才 `unlink`；token 不符或文件已不存在 = 自己的锁已被陈锁回收，**绝不 unlink**。
- rename 提交前同样核验 token：非己方持锁则**放弃本次 rename**，整段 read-modify-write 从抢锁开始重试（防「被回收后仍提交」写坏账）。
- 陈锁判据维持 mtime 超 10s；回收动作本身也要防双回收竞争（unlink 后以 `wx` 抢建，抢不到就继续退避）。

### RW2-2 修 F-020（R-D-02 · 显式收权）

- `cli/pending.mjs` 每次写入前对 `.dh-relay/` 目录显式 `chmod 0o700`（目录已存在也收），pending/临时/锁三类文件显式 `chmod 0o600`（`wx`/写入的 mode 参数保留，chmod 兜底已存在文件）。
- 测试补权限断言：POSIX 平台断言 `stat` 真实 mode（0700/0600）；`process.platform === 'win32'` 时降级断言写入路径无异常（Node 在 win32 上 mode 语义有限，不硬断 mode 位）。

### RW2-3 修 F-023（R-D-03 · 两组并发回归补强杀伤力）

- **identity 并发**：改用能记录 handshake 的 service（真 service 或既有最小假 service），两个首启 CLI 并发跑完后断言：①两次 handshake 的 `client_id` **相同**；②identity 文件内容 = 该 client_id。另加「输家不覆盖」负向钉子：预置已知 `client_id` 的 identity 文件，再跑 CLI，断言文件逐字未变且 handshake 用的就是预置 id（改回覆盖写必红）。
- **双 CLI mutating 零丢失**：两个子进程各自用不同 `request_id` 发 mutating、指向**收下 contracts 后挂起不回**的假 service，轮询 ledger 直到**两条 request_id 都在账**（超时即红）再杀子进程；这直接钉住 add 的互斥零丢失。收敛语义断言维持既有用例。

### RW2-4 完工门

- `npm test` 全绿（142 + 新增/改强用例）；validator selftest 全绿；三份基线零漂移（capability_hash 仍 a990fdda）；`git status` 干净。
- 提交拆分：fix（RW2-1~2）/ test（RW2-3 + RW2-2 权限断言）/ docs（progress.md 二轮记录 + findings.md F-019/F-020/F-023 → resolved 写明修法与提交号）。

## 批次 C 施工说明（步骤 4b · headless worker 粒度）

> 范围 = 步骤 4b（dsh-bridge adapter + client fixtures）。步骤 5（design/06 字段落档 + P4 标记）由**主控直写**，worker 不碰任何 design/dev_plan 文档。DHR_50 结论 = passed-with-constraints（DSH Bridge 条件部分已解锁）；真实 DSH 页面截图证据属收口证据阶段，worker 不做。

### C-0 铁律

- 只许改：`relay-core/adapters/dsh-bridge/**`（新建）、`relay-core/fixtures/clients/**`（新建）、`relay-core/test/dsh-bridge.test.mjs`（新建）、`relay-core/test/client-fixtures.test.mjs`（新建）、`relay-core/test/read-model-mirror.test.mjs`（新建）、`relay-core/package.json`（仅 test 列表挂新测试文件）、workspace 的 progress.md / findings.md。
- **一律不动**：contracts/、runtime/、rpc/、store/、cli/、既有测试文件、design 文档、dev_plan 文档、三份基线。fixtures/ 的 manifest 只扫 `golden/`+`negative/`，新建 `fixtures/clients/` 是兄弟目录、不入 manifest——若 validator/manifest 报漂移即为越界信号，停下写 findings。
- 不派 agent、不问用户、不 push、不 merge；被卡就把卡点写进 findings.md 然后停。

### C-1 adapter：`relay-core/adapters/dsh-bridge/index.mjs`

- 定位：给 DSH Host 插件（Node 侧）内嵌用的**库接缝**，不是进程。复用 `runtime/launcher.mjs` 的 `ensureRuntimeService` + `runtime/credentials.mjs` 的 `readLocalUserCapability`（只读，缺失原样抛 `E_LOCAL_USER_UNAUTHORIZED`，绝不创建凭据）+ `rpc/transport.mjs`——**禁止 import `store/**`**（Read Model 只经 RPC）；参考实现 = `cli/client.mjs`（连接后 `contracts` 唯一首请求、响应与 descriptor 逐字段比对），但**不引入 cli/pending**（见 C-3）。
- API 面（全部只吐冻结契约的纯 JSON，禁止 DSH 私有类型/Context/活对象跨界——DHR_26 的边界纪律）：
  - `connectDshBridge({repoRoot}) → bridge`；`bridge.close()`。
  - 查询：`listRuns({includeLegacy})` / `status(runId)` / `inspect(runId)`——RPC 结果里的 Read Model **原样返回**，不加工字段。
  - 订阅：`subscribe(runId, {afterSeq, onSnapshot, onEvent, onState, onGap}) → subscription`；状态只来自快照与 `runStateChanged`（不从 event 流推导）；断线自动重连按已送达高水位带 `after_seq` 续传；收到 `E_CURSOR_GAP` 时整体重新 snapshot 并回调 `onGap`（新快照重建、不拼接）。`subscription.stop()` 收尾。
  - 窄控制：`control(runId, action, {requestId})`——action ∈ {stop, resume}；`requestId` 由**调用方提供**（幂等键归调用方所有），Receipt / error（含 `receipt: Receipt|null` 二分）**原样透传**，`E_LEGACY_READ_ONLY` / `E_ORPHAN_STORE_READ_ONLY` 不重试。

### C-2 client fixtures：`relay-core/fixtures/clients/`

- 提供 Pi/通用客户端的可复跑样例（纯 JSON，任何语言可解析）：`pi-run-list.json`、`pi-status.json`、`pi-detail.json`、`pi-event-stream.json`（快照 + 若干事件 + next_seq 的转录形态）、`generic-control-receipt.json`（成功 + failed 两份 Receipt）。内容用真实 service 跑出来的形状（可参考 fixtures/golden 里的四视图），字段必须过冻结 schema。
- `test/client-fixtures.test.mjs`：逐份 fixture 过对应冻结契约校验（用 `tools/validate.mjs` 的编程接口或等价 ajv 装配）+ 一段「Pi 式消费」解析示例断言（只按 JSON 结构取字段，不 import 任何 relay 运行时代码——证明客户端中立）。

### C-3 设计决策（写死，不留给 worker 发挥）

- Bridge **不落本地 pending 账**：design/08 §2 的 request record 持久化义务归**宿主客户端**（CLI 有自己的账；DSH 宿主要重试须自备持久化并复用同一 requestId）。adapter 文档注释里写明这条边界与理由（库接缝无权替宿主定持久化落点）。
- 重连语义与 CLI 对齐：`snapshotSeq/printedSeq` 高水位取 max 作 `after_seq`；重连失败退避重试（有界，间隔与上限做成可配置项，默认 500ms×20）。

### C-4 镜像断言：`test/read-model-mirror.test.mjs`（P5-M4 证据 · B-13 两条）

- 真实 service + 真实 Store 造两个不同 `group` 的 Run，经 RPC 取 `run_list`：
  1. **改 `group` 必须移动**：在源头（Run Store 状态）改一个 Run 的 `group`，重取 `run_list`——该条目的 `group` 字段随源头变化且列表分组/排序位置随之移动（排序由源头给，客户端不推导）。
  2. **只改 `run_status` 必须逐字不变**：只改 `run_status` 不改 `group`，重取 `run_list`——除该条目 `run_status` 字段外，整份投影 JSON **逐字**相同（deepEqual 掩掉该字段后全等）。
- 两条都要先证「改前基线」再证「改后差异」，断言差异恰好是预期字段、无其他漂移。

### C-5 完工门

- `npm test` 全绿（146 + 新增）；validator selftest 全绿；audit 0 违规；三份基线零漂移（capability_hash 仍 a990fdda）；`git status` 干净。
- 提交拆分：feat（C-1 adapter）/ test+fixtures（C-2 + C-4）/ docs(progress.md 批次 C 记录 + findings 新发现按 F-0xx)。

## 批次 C 返工说明（RW3-1~RW3-4 · headless worker 粒度）

> 起因 = 批次 C 小审（codex 只读 fresh-context）判 changes-requested，R-G-01~R-G-04 已登记为 F-028~F-031。**F-031 已由主控直修**（`cli/pending.mjs` 文案，CLI 17/17 绿），worker 不碰。**F-028 主控已部分驳回**（调用次序与 `cli/client.mjs` 逐字相同，凭据由 service 首次 bind 创建是既定引导设计），worker 只做注释精化、**不许改调用次序、不许在 adapter 里加凭据预检**。

### RW3-0 铁律

- 只许改：`relay-core/adapters/dsh-bridge/index.mjs`、`relay-core/test/dsh-bridge.test.mjs`、`relay-core/test/read-model-mirror.test.mjs`、workspace 的 `progress.md` / `findings.md`。
- **一律不动**：`cli/`（F-031 主控已修）、`runtime/`、`rpc/`、`store/`、`contracts/`、`fixtures/`、既有其他测试、`package.json`、design/dev_plan/task_plan、三份基线。
- 不派 agent、不问用户、不 push、不 merge；被卡写 findings 停工。提交只 `git add` 范围内文件，绝不 `git add -A`。
- **完工门不用你跑全量**：你只跑 `node --test test/dsh-bridge.test.mjs test/read-model-mirror.test.mjs` 即可（你的沙箱跑全量必报 EPERM 假红，见 F-027）。全量四道闸由主控在无沙箱环境跑。

### RW3-1 · F-028 注释精化（只改注释，零行为变更）

`adapters/dsh-bridge/index.mjs` 头部注释与 `openSession` 里 `E_LOCAL_USER_UNAUTHORIZED` 的说明，当前写「只读，缺失原样抛…，绝不创建凭据」，会被读成「调 Bridge 绝不会让凭据出现」——与事实不符。改成精确表述，口径对齐 `cli/client.mjs:38-41`：

- adapter **自身**只读凭据、从不铸造；
- 但 `ensureRuntimeService()` 在本机尚无 service 时会拉起 service，而**凭据的创建权归首次成功 bind 端点的 service**（本仓无独立 init 命令，这是既定引导路径，CLI 同构）；
- 因此 `E_LOCAL_USER_UNAUTHORIZED` 的真实含义 = 「service 已就绪但本机凭据仍缺失」，不是「本机从没有过凭据」。

### RW3-2 · F-029 订阅失败路径闭合（本轮主体）

**实现**（`adapters/dsh-bridge/index.mjs`）：

1. `openSession` 的 `onClose` / `onSocketError` 里，除 `resolveClosed()` 外**遍历 `pending` 逐个 reject** 并清空 map、清掉各自的超时定时器；reject 用稳定 reason `E_CONNECTION_CLOSED`（沿用 `bridgeError()` 形态，`error.reason` 可判）。这样 socket 断掉时在途请求**立即失败**，不再吃满 120s——「500ms×20」才真的是有界退避。
2. `connectDshBridge` 的 `subscribe` 增回调 `onClosed(reason)`（可选）：`reconnect()` 重试耗尽、或首次连接后遭遇不可恢复错误时，**调用它并把该 subscription 置为非 active、从 `subscriptions` 摘除**，不再静默 `return`。`reason` 至少区分 `retries-exhausted` 与底层 error。
3. `subscription` 对象除 `stop()` 外不新增其他 API 面；`onClosed` 与既有 `onGap` 一样是可选回调，宿主不传也不能抛。

**测试**（`test/dsh-bridge.test.mjs`，三组新用例，全走真实 service + 真实 socket）：

- ①**断线中途事件无重无漏**：订阅后写若干事件 → 强制断掉连接 → 期间再写若干事件 → 重连后宿主收到的事件序列按 `seq` 严格连续、无重复、无遗漏（用已送达高水位 `after_seq` 续传的直接证据）。
- ②**重试耗尽走通知路径**：把 `reconnectAttempts` 调到很小（如 2）、`reconnectDelayMs` 调小，关掉 service 让重连必失败 → 断言 `onClosed` **被调用且 reason 指明 retries-exhausted**，且 `subscription` 已不在活动集（再次触发不会重复回调）。
- ③**close 后 pending 立即失败**：发一个请求后立刻断连 → 断言该请求在**远小于 120s**（如 5s 内）以 `E_CONNECTION_CLOSED` reject，而不是挂到超时。**这条要有牙**：把 RW3-2①的 reject 逻辑注释掉后此用例必须变红。

### RW3-3 · F-030 镜像断言②补字段面钉子

`test/read-model-mirror.test.mjs`：

1. 断言②当前用 `{...beforeAlpha, run_status:'running'}` 造期望，生产投影**新增**字段会同时出现在两侧被吃掉。改为**显式钉死 `run_summary` 的完整字段集合**：`assert.deepEqual(Object.keys(afterAlpha).sort(), ['group','read_only','run_id','run_status','source','updated_at'], ...)`（六个必填字段，以 design/06 §14.2 为准；若实际投影字段与此不符，**不要改断言去迁就实现**，写 findings 停工）。改前基线对象同样钉一次。
2. 测试里的轮询 `call()`（`read-model-mirror.test.mjs:44-54`）无超时：schema 不合导致 RPC 断连时会**永远挂着**而不是报红。加超时（如 15s），超时即以明确信息断言失败。
3. 断言①保持现状（小审已判「删排序必红」，有牙）。

### RW3-4 提交拆分

- fix（RW3-1 注释 + RW3-2 实现）/ test（RW3-2 三组 + RW3-3 两处）/ docs（progress.md 本轮落账 + findings.md 把 F-028 处置栏补「注释已精化」并置 resolved、F-029 / F-030 置 resolved）。

## 关键决策（一句话各一行）

- Worktree：是，分支 = `wt/DHR_30`，基点 = 本地 `master` `e52a45b`（`dh wt new` 初建于落后的 `origin/master` `554e543` 后已立即 rebase）。
- 范围：含 Runtime service/正式 RPC 合同；不含 DHR_31 workflow、Process、executor。
- Review：按存量标准档，收口前两轮独立换人复核，另做需求/教训/一致性复核。
