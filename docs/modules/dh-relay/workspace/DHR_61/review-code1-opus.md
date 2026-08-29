<!-- dh:v1 -->
# review-code1-opus — DHR_61 代码轮 1（fresh，只读）

## 0. 抬头与模型证据

| 项 | 值 |
|---|---|
| 卡 | DHR_61 · Attempt 身份与暂停重试契约 |
| 复核路径 | heavy 配方 · 代码轮 1（fresh reviewer，非施工者、非主控） |
| 审查对象 | 工作树 `D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_61` 的**未提交 diff**，基线 `5999326` |
| 模式 | 只读。未改任何生产代码、未派活、未提交、未询问用户；本文件是本轮唯一写入 |
| 日期 | 2026-08-30 |

**模型证据（如实记录，含不一致项）**

1. 启动命令：`claude --model opus`（由主控在派活指令中声明）。
2. 状态栏显示：`Opus 5`（由主控在派活指令中声明）。
3. 本 session 自身可见的两条证据：系统上下文写明 `You are powered by the model named Opus 5. The exact model ID is claude-opus-5`；但 **SessionStart hook 注入的文本为 `当前模型：claude-fable-5[1m]`**。
4. 结论：第 1、2 项按指令如实登记；第 3 项存在**内部不一致**，我无法在 session 内自证哪一条为准。此项交主控裁决，本轮不代为判定。

## 1. 审查范围与方法

- 读取：仓根 `AGENTS.md`；`workspace/DHR_61/{brief,task_plan,progress,findings}.md`；`design/11-P6身份与额度治理契约调整.md`。
- diff 面：29 个改动文件 + 24 个新增文件（`git diff --stat 5999326` = 965 增 / 69 删）。逐文件通读了 `store/store.mjs`、`store/state.mjs`、`runtime/{service,workflow-driver,endpoint,attempt-retry}.mjs`、`rpc/{server,capabilities,bootstrap}.mjs`、`profiles/{identity,migrate-profile-registry}.mjs`、`runtime/executors/herdr/profile-registry.mjs`、全部 9 份新增 schema、`profiles/executor-profile.schema.json`、`contracts/relay.event.v2.schema.json`、`tools/{validate,audit-contracts,capability-baseline}.mjs`、`fixtures/manifest.json` 与全部新增 fixture。
- 只读验证手段：① 跑既有测试；② 跑契约闸；③ 在 scratchpad 用**只读探针脚本**驱动生产模块（`createStore`/`openStore`/`readOpenAttentions`/`migrateConfigFingerprintRule`/`loadAjv`），全部落在系统临时目录，未写入仓库、未触碰用户级 registry 或任何 profile 配置。

### 本轮取得的终态证据

| ID | 命令 | 结果 |
|----|------|------|
| R-001 | `node --test --test-concurrency=1 test/contracts.test.mjs test/attempt-contract.test.mjs test/profile-identity.test.mjs test/store.test.mjs test/profiles.test.mjs` | pass 55/55，fail 0 |
| R-002 | `node --test --test-concurrency=1 test/rpc.test.mjs test/rpc-service.test.mjs test/agent-node.test.mjs` | pass 61/61，fail 0，exit 0 |
| R-003 | `npm test`（全量 21 个测试文件） | **pass 228/228，fail 0，exit 0，136.4s** |
| R-004 | `node tools/validate.mjs --selftest` | pass 56 / fail 0 |
| R-005 | `npm run audit` | 引用违规 0；结构 token 259 个，未登记 0，陈旧 0；白名单↔OPEN-POINTS 不同步 0 |
| R-006 | `node tools/capability-baseline.mjs` | 19 份（18 顶层 + 1 共享）digest 相符，`capability_hash = f1ded34e993210ce…` |
| R-007 | `git diff --check` | 干净 |
| R-008 | 探针：schema 极限合法 pause 的 canonical 字节数 | **4301 > 4096**（见 P1-1） |
| R-009 | 探针：pause→resolution→`openStore` / pause→任一普通事件→`openStore` | 两例均 **抛 `E_STORE_MUTATION_RECOVERY_FAILED:target-conflict`**（见 P0-1） |
| R-010 | 探针：raw `appendEvent({kind:'fallback_pause_created'})` 后重开 | 重开成功；节点 `waiting_human`；`openAttentions=[]`；迟到 checkpoint **被接受**（见 P1-3） |
| R-011 | 探针：终态 Result 之后 `appendFallbackPause` | 返回 `{ok:true}`，节点状态由 `succeeded` **翻回** `waiting_human`（见 P2-1） |
| R-012 | 探针：`migrateConfigFingerprintRule` 对未排序的 legacy fields | 输出**保持原序**；随后 `createExecutorIdentity` 抛 `E_NONSECRET_PROJECTION_INVALID:fields-not-unique-sorted`（见 P1-5） |

> 注：R-003 为本轮取得的全量终态（有汇总与 exit code），可作为 `findings.md` F-002「全量回归未得终态」这一证据缺口的补充观测。是否据此关闭 F-002 由主控裁决，本轮不代判。

---

## 2. 结论清单（P0 → P3）

### P0-1 · `recoverMutations` 无条件重放已提交的 journal，Run 一旦 pause 过就会永久打不开

- 位置：`relay-core/store/store.mjs:197`（`recoverMutations`）、`relay-core/store/store.mjs:201`、`relay-core/store/store.mjs:146`（`commitMutation` 不删 journal / 不检查已 committed）
- 事实：
  - `commitMutation` 成功后**保留** `<tx>.prepared.json`，只额外写一个 `<tx>.committed` 标记（`store.mjs:164`）。
  - `recoverMutations` 遍历 `mutations/` 下**所有** `*.prepared.json` 并逐个 `applyPreparedMutation`，**从不检查是否已有 `.committed` 标记**（`store.mjs:201-206`）。
  - `applyPreparedMutation` 对每个目标判定：`current == staging_hash` → 跳过；否则 `current != before_hash` → `E_STORE_MUTATION_RECOVERY_FAILED:target-conflict`（`store.mjs:186-188`）。
  - pause / resolution 的 target 列表都包含**整份 `events.jsonl` 与 `state.json`**（`store.mjs:433-437`、`store.mjs:477-482`）。因此只要 pause 之后再写入**任何一条**事件，`events.jsonl` 就既不等于旧 journal 的 `staging_hash`、也不等于其 `before_hash`。
- 实测（R-009，两条独立路径均复现）：
  - `pause → resolution → openStore` → `E_STORE_MUTATION_RECOVERY_FAILED:target-conflict`
  - `pause → appendEvent(human_input_requested) → openStore` → 同一错误
- 生产可达性：`openStore` 的活路径是 `relay-core/runtime/host.mjs:60`（`createHostSessionActor` → lease 接管 → `openStore`），且紧接着在 `host.mjs:68` 写 `lease_acquired` 事件。也就是说：pause 之后第一次接管尚可打开，接管时写下的 `lease_acquired` 会让**下一次**接管永久失败。`retry-with-profile` 自身也经 `ensureActor`（`runtime/service.mjs:697`）走这条路。
- 附带问题：`store.mjs:201` 的 `.sort()` 是 UUID 字典序，不是提交时序；即使加上「跳过已 committed」，多条 prepared journal 的恢复顺序仍无序。
- 违反：design/11 D2「journal 更正」段（恢复应逐目标补全至 committed，而不是把已完成事务当未完成重放）；brief 完成条件 2「journal 强杀阶段均 fail-closed」——当前是**成功路径也永久 fail-closed**，语义反了。
- 现状缓解（如实记录）：本卡内 `appendFallbackPause` 在生产代码中**尚无调用方**（`grep` 仅命中 `store.mjs:414` 与测试），quota 分类归 DHR_34，所以线上暂不可触发。但这正是本卡要交给 DHR_34 的原语，交付前必须成立。
- 现有测试为何全绿：`test/attempt-contract.test.mjs` 的重开用例（:128、:143、:155）都只做「一次 pause 后立刻重开」，没有「pause 之后再写事件 / resolution 之后再重开」的组合。

### P1-1 · 缺 registry 注册期的 4096 容量证明，且 schema 极限合法的 registry 实测就超限

- 位置：`relay-core/profiles/validate-profiles.mjs`（无任何容量证明；全仓 `grep 4096` 只命中 schema 的 `maxLength` 与 `store.mjs:418` 的运行期兜底）、`relay-core/store/store.mjs:418`
- 事实：design/11 D2「容量约束」逐字要求 validator **在注册时**用「relay.common 各 ID 的 schema 最大合法代表 + RFC3339 毫秒时间戳最大代表 + 六个 snapshot」构造 JCS payload 并证明 `Buffer.byteLength(detail,'utf8') <= 4096`，否则**拒绝 registry**；并明写「不能在 quota 发生时才因尺寸失败」。当前实现只有 `store.mjs:418` 在 pause 落账那一刻抛 `E_FALLBACK_PAUSE_INVALID:detail-too-large` —— 恰是设计禁止的那个时点。
- 实测（R-008）：以 `relay.common/v1` 的合法上界构造（`run_id`/`node_id`/`attempt_id`/`receipt_id` 各 128 字符、`executor_profile_id` 96、`account_alias` 48、6 个 snapshot、毫秒时间戳），payload **通过 `relay.fallback-pause/v1` schema 校验**，canonical 字节数 = **4301**，被 `relay.event/v2` 以 `data/detail must NOT have more than 4096 characters` 拒绝。分档：6 项=4301、5 项=3929、4 项=3557、0 项=2070。
- 后果：一个完全合法的 registry 在 quota 到来时无法落下 pause —— 没有 fence、没有 `waiting_human`、没有 Attention，恰好是 design §5 止损条款点名的失败形态。
- 违反：design/11 D2 容量约束段；brief 完成条件 2；P6-IQ-A3。

### P1-2 · profile registry schema 未按 D2 冻结 `account_alias` / `executor_profile_id` 的上界

- 位置：`relay-core/profiles/executor-profile.schema.json:61`（`executor_profile_id`：`^(herdr|process|pi-agent)\.[a-z0-9-]+\.[a-z0-9-]+$`，**无 maxLength**）、`:65`（`account_alias`：仅 `{"type":"string","minLength":1}`，**无 pattern、无 maxLength**）
- 事实：design/11 D1/D2 逐字要求 registry schema 固定 `executor_profile_id` 为 ASCII `[A-Za-z0-9._-]{1,96}`、`account_alias` 为 ASCII `[A-Za-z0-9._-]{1,48}`。`fallback_profile_ids` 的 `maxItems:6` / `uniqueItems` / `{1,96}` 已按要求落实（`:70-75`），但这两项没有。
- 后果：`createExecutorIdentity` 原样拷贝 `profile.account_alias`（`profiles/identity.mjs:142`），而 `relay.attempt-receipt/v1#/$defs/identity` 强制 `^[A-Za-z0-9._-]{1,48}$`。一个通过 `validate-profiles` 的 registry（例如 alias 含中文或超 48 字符）会在 `registerAttemptReceipt` 时才抛 `E_SCHEMA_INVALID` —— 与 P1-1 同一类「该在注册期证的东西被推迟到运行期」。
- 违反：design/11 D2 容量约束段。

### P1-3 · pause 账本核对是单向的，raw `fallback_pause_created` 可造出「waiting_human 但无 Attention、旧 Attempt 未 fence」

- 位置：`relay-core/store/store.mjs:395`（`appendEvent` 只挡 `TERMINAL_RESULT_KINDS`，不挡两个新 kind）、`relay-core/store/store.mjs:51`（`assertPauseLedger` 只做 pause→event，不做 event→pause）
- 实测（R-010）：对已开 Attempt 的 Run 调 `appendEvent({kind:'fallback_pause_created', reason:'E_FALLBACK_UNAVAILABLE', detail:'not-canonical-json'})`，事件通过 `relay.event/v2` 校验落账；重开 Store **成功**；节点状态 = `waiting_human`；`openAttentions()` = `[]`；随后的迟到 checkpoint 返回 `{ok:true}`（未被 fence）。
- 后果：
  - `state.mjs:10` 已把 `fallback_pause_created` 接进 `waiting_human` 转移集，于是只要事件在，投影就变；但 fence 与 Attention 都只从 `pauses` 工件派生（`store.mjs:240`、`store.mjs:494`），于是**三者可以不同步**。
  - 对 v1 兼容闸是直接的洞：`assertV1AttentionCompatible` 只看 `openAttentions`，此时为空，v1 客户端会拿到一个 `needs_you` 的 Run 而不被拒绝。
  - `loadEvents`（`store.mjs:654`）逐行做 schema 校验，但**不解析 `detail`**、不比对 `relay.fallback-pause/v1`。
- 违反：design/11 D2「一次成功重放必须同时导出 fence、节点 `waiting_human` 与 open Attention；三者缺一……均为坏账并 fail-closed」；design §5 止损「不能用『页面看起来暂停』掩盖不存在的持久等待状态或 Attention」。
- 说明：反方向（pause 工件在、event 缺或被篡改）**是**被 `assertPauseLedger` 挡住的，已有定向反例（`test/attempt-contract.test.mjs:143`）。缺的是 event→pause 这一向。

### P1-4 · v1 订阅的 backfill 绕过关闭闸，冻结 v1 客户端会收到两个新事件 kind

- 位置：`relay-core/runtime/service.mjs:610`（`afterSend` 里 `for (const event of backfill) sink.event(event)`）对比 `relay-core/runtime/service.mjs:549`（关闭闸只在 `emit()` 内）
- 事实：v1 的强制关闭逻辑写在 `subscription.emit()`（`service.mjs:549-555`），而 cursor 补发走的是 `afterSend` 里的 `sink.event(event)` 直调，**完全不过 `emit`**。
- 可达场景：一个 pause 已被 resolution 关闭的 Run，`openAttentions` 为空 → `assertV1AttentionCompatible` 放行 → v1 客户端带 `after_seq` 订阅 → 补发区间内的 `fallback_pause_created` 与 `fallback_pause_resolved` 原样投递。`relay.rpc/v1` 的 notification 分支 `$ref` 到 `relay.event/v2`，而 `relay.event/v2` 的 kind 枚举本卡已加入这两个值，所以帧校验通过、正常送达。
- 另：关闭闸只匹配 `fallback_pause_created`，不匹配 `fallback_pause_resolved`。
- 违反：P6-IQ-A3「冻结 v1 endpoint 的列表/目标/订阅均不得静默丢失 Attention **或收到新 kind**」。

### P1-5 · `migrateConfigFingerprintRule` 的比较器实参写错，迁移根本没排序

- 位置：`relay-core/profiles/identity.mjs:153` —— `fields.sort((left, right) => left.pointer.localeCompare(right))`，`right` 是对象而非 `right.pointer`，`localeCompare` 会把它字符串化成 `"[object Object]"`，比较器对所有元素返回同一常数，等于不排序。
- 实测（R-012）：输入 `['/model','/Approval','/sandbox','/reasoning']` → 迁移输出 `["/model","/Approval","/sandbox","/reasoning"]`（原序不动）；code-unit 正序应为 `["/Approval","/model","/reasoning","/sandbox"]`。把迁移结果喂给 `createExecutorIdentity` 立即抛 `E_NONSECRET_PROJECTION_INVALID:fields-not-unique-sorted`。
- 第二层问题：即使实参改对，`localeCompare` 是 locale 序，而 `identity.mjs:20` 的守卫 `prior >= field.pointer` 是 UTF-16 code-unit 序。design/11 D1 明确要求「按现役 `CANONICALIZATION.md` 的 UTF-16 code-unit 升序」，此处应为 `sort()` 或显式 `<` 比较。
- 后果：只要旧 registry 的 fields 名称不是恰好已按 code-unit 序排列，`migrate-profile-registry.mjs` 迁移出的文件就会让该 profile **永远无法冻结身份**（`freezeProfileIdentity` 抛错 → `openAttempt` 抛错 → Herdr 节点开不出 Attempt）。
- 说明：`progress.md` E-004/E-005 记录的用户级 registry 迁移后 validator=PASS，是因为其源顺序恰好可接受；这掩盖了函数本身的缺陷。**本轮未读取、未修改该用户文件**。

---

### P2-1 · `appendFallbackPause` 缺终态守卫，可把已定终态的节点翻回 `waiting_human`

- 位置：`relay-core/store/store.mjs:414-447`（整条路径不经 `emitEvent`，因此跳过 `store.mjs:317-325` 的 `LIFECYCLE_KINDS` + `terminalOf` 守卫）；`relay-core/store/state.mjs:10`
- 实测（R-011）：`registerAttemptReceipt → appendResult(outcome:'succeeded') → appendFallbackPause` 返回 `{ok:true,idempotent:false}`，节点状态从 `succeeded` 变为 `waiting_human`。
- 事实：`appendFallbackPause` 只校验 `currentReceipt(node)` 身份匹配（`store.mjs:424-427`），没有检查该 Attempt 是否已有终态 Result。仓内既有不变量（`store.mjs:17-20` 注释）是「节点当前 attempt 定了终态之后再写推进状态的 kind 一律拒绝」。
- 影响面：需要调用方越界才触发，但本卡的立场是 Store 作为唯一强制点。

### P2-2 · v1 `subscribe` 的 Attention 前置检查在写队列之外，存在 TOCTOU 窗口

- 位置：`relay-core/runtime/service.mjs:526`（`assertV1AttentionCompatible` 在 `enqueue` **之前**）对比 `:528` 起的 `enqueue(...)` 与 `:590` 的 `subscription.lastSentSeq = nextSeq - 1`
- 事实：若 pause 在「检查通过」与「barrier 注册取尾 seq」之间落账，该 pause 的 `seq <= lastSentSeq`，`emit()` 在 `:548` 就 `return`，**永远走不到 `:549` 的关闭分支**。结果是一个 v1 连接稳定挂在一个有 open Attention 的 Run 上：既没被拒绝，也没被关闭，快照里只有一个 `waiting_human`。
- 违反：design/11 D2 §4「v1 `subscribe` 建立时有 open Attention 同样拒绝」。
- 修法方向（仅供主控参考，本轮不改）：把 Attention 判定移进 `enqueue` 内、取尾 seq 的同一临界区。

### P2-3 · mutation journal 缺目录 fsync，与 D2 明写的持久化顺序不符

- 位置：`relay-core/store/store.mjs:138-144`（`writeAtomicText`：`open → writeFile → handle.sync() → close → rename`，**rename 之后没有对父目录 fsync**）、被 `store.mjs:146-165` 的 blob 发布、prepared journal、committed marker 三处复用
- 事实：design/11 D2「journal 更正」逐字规定「先完整写入 immutable staging blob、**fsync blob 并原子发布/同步其目录**；再写入……prepared journal、**fsync journal 并同步其目录**」。当前只 fsync 了文件内容，目录项未同步。
- 后果：崩溃后可能出现「journal 目录项已落盘、blob 目录项未落盘」，恢复读不到 blob → `E_STORE_MUTATION_RECOVERY_FAILED:blob-invalid`，且**无法补全**（blob 内容已丢），该 Run 永久打不开。
- 说明：blob→journal→target→marker 的**先后顺序**本身是对的，缺的只是目录级持久化。

### P2-4 · staging blob 与 prepared journal 从不回收，且以整份 `events.jsonl` 作为 target

- 位置：`relay-core/store/store.mjs:146-165`
- 事实：每次 pause/resolution 都把**当前完整事件日志**写成一份 staging blob（`store.mjs:434`、`:480`），且 blob 与 journal 成功后从不删除。design/11 D2 写的是「成功后按审计保留规则回收」。
- 后果：磁盘占用随 pause 次数呈 O(n²) 增长；同时这批残留正是 P0-1 的燃料。

### P2-5 · retry 开出的新 Attempt Receipt 把 `fallback_profile_snapshots` 硬编码为空

- 位置：`relay-core/runtime/attempt-retry.mjs:46` —— `fallback_profile_snapshots: []`
- 事实：design/11 D1 规定该字段是「源 profile 的 `fallback_profile_ids` 按 routing-priority 顺序解析后的唯一完整身份快照」。人工 retry 选中的 profile 自身可以有已登记 fallback，这里一律丢弃。
- 后果：重试后的 Attempt 若再遇 quota，其 pause 的 `manual_retry_profiles` 必为空，人工也无从选择——重试链只有一跳。
- 说明：D3 的自动选择归 DHR_34，但**快照本身**是本卡 D1 的责任。

### P2-6 · `config_fingerprint_rule` 仍是可选，D1「开立即冻结身份」没有强制点

- 位置：`relay-core/profiles/executor-profile.schema.json:58`（`required` 不含 `config_fingerprint_rule`）、`relay-core/runtime/workflow-driver.mjs:97`（`if (executorProfile?.config_fingerprint_rule)`，否则走 `:113` 的旧 `registerReceipt`）
- 事实：缺规则的 profile 会**静默**退回到 DHR_61 之前的无身份 Receipt，不报错、不留痕。
- 后果：D1「Attempt Receipt 在开立时冻结 `executor_identity`」在 registry 层没有闸；一个漏配规则的 profile 直接绕过整套身份链，而 P6-IQ-A1 的机器证只覆盖了配了规则的路径。
- 对照：同一函数对 **fallback** 缺规则是 fail-closed 的（`workflow-driver.mjs:102` 抛 `E_NONSECRET_PROJECTION_MISSING`）；source profile 反而更宽。

---

### P3-1 · `relay.subscription-terminal/v1` 已冻结进 capability 基线但全仓无生产者

- 位置：`relay-core/contracts/relay.subscription-terminal.v1.schema.json`、`relay-core/rpc/server.mjs:220`（`subscriptionTerminal` sink 方法）、`relay-core/contracts/relay.rpc.v2.schema.json:45/51`
- 事实：`grep` 显示除 schema、fixture、基线与 sink 定义外，`runtime/service.mjs` 从未调用 `sink.subscriptionTerminal(...)`。v1 强制关闭走的是 `sink.close()`（`server.mjs:223`，即标准 v1 error 帧），v2 侧目前没有任何终止通知路径。
- 影响：契约已进 `capability_hash`，但没有行为与之对应；design/11 D2 §4 把它列为「v2 才可收到」的对象。

### P3-2 · 「不同键重试已关闭 pause」的错误码与设计口径不一致

- 位置：`relay-core/store/store.mjs:456-459` —— 抛 `E_FALLBACK_PAUSE_RESOLUTION_INVALID:pause-closed`
- 事实：design/11 D2 §5 写的是「不同键重试已关闭 pause **返回冲突**」；`contracts/reason-codes.md` 本卡新增行把 `E_FALLBACK_PAUSE_CONFLICT` 定义窄化为「同一 `pause_id` 重投的 canonical pause detail 不完全相同」，两处口径没对齐。另外此处是 `throw`，而同函数的幂等/冲突分支（`:453-455`）用的是 `return {ok:false, reason}`，错误面形态不统一。

### P3-3 · resolution schema 里 `pause_id` / `attention_id` 的宽窄与别处不一致

- 位置：`relay-core/contracts/relay.fallback-pause-resolution.v1.schema.json:8-9` 用 `relay.common/v1#/$defs/identifier`；同一语义在 `relay.fallback-pause.v1.schema.json:8` 与 `relay.rpc-methods.v2.schema.json`（`retry_with_profile_params.pause_id`）用的是 `sha256`。
- 影响：`identifier` 容得下 sha256 值，所以运行期不出错；但契约层对同一 ID 给了两种约束强度，跨实现校验会松紧不一。

### P3-4 · bootstrap endpoint 没有 owner/capability 闸

- 位置：`relay-core/rpc/bootstrap.mjs:8-11` —— `bindOwnedEndpoint(endpoint, {...})`，未传 `ownerAware` / `capability` / `authorize`；对比 v1/v2 端点均为 `formal:true, ownerAware:true`。
- 事实：它只回吐 descriptor（v2 端点地址 + capability hash），不含运行数据。design 未要求该端点鉴权。仅作口径不同源的登记项。

### P3-5 · 容量论证依赖「毫秒时间戳」这一非 schema 约束

- 位置：`relay-core/contracts/_shared/relay.common.v1.schema.json` 的 `timestamp` —— `(\.[0-9]+)?` 小数秒位数**无上界**。
- 影响：即便补上 P1-1 的注册期证明，只要 `raised_at` 用了更高精度小数秒，pause detail 仍可能溢出。design D2 说的「RFC3339 毫秒时间戳最大代表」目前没有 schema 层背书；建议要么在 pause payload 层收窄，要么在容量证明里显式预留裕度。

---

## 3. 已核对无问题的区域（逐条）

以下均为本轮实际核对并确认成立的部分，不是「未看」：

1. **v1 握手 capability hash 逐字冻结**。`rpc/capabilities.mjs:18` 的常量 `994d5f038cd1bcbbb9463eed5ca04b2ffc324f07b374571899b8df3a6c5c971e` 与 `git show 5999326:relay-core/capability-baseline.json` 的 `capability_hash` **逐字相同**；`localCapabilityHash()`（`:43`）返回该常量，新增合同只进入 `localCapabilityHashV2()`（`:48`）与 bootstrap/v2 的 `f1ded34e…`。v1 descriptor 只暴露 hash、不暴露 manifest，不会漏出新值。
2. **v1 endpoint 地址不变**。`runtime/endpoint.mjs:38-42` 的 `channel` 默认 `'v1'` → 后缀为空串，pipe/unix 地址与改前逐字一致；bootstrap/v2 走各自后缀，三条互不复用。
3. **v1 成功 payload 形态不变**。`runtime/service.mjs:625-648` 的 `listRuns` / `inspectRun` 仍返回 `relay.client-read-model/v1`，未加字段；`relay.rpc.v1.schema.json`、`relay.rpc-methods.v1` 与 `relay.client-read-model.v1` 三份在本 diff 中**零改动**（`git diff --stat` 中不存在）。
4. **v1 遇 open Attention 用既有 error 形态拒绝、不筛项**。`service.mjs:627`（listRuns 逐项检查后整体抛错，不 filter）、`:633`（inspectRun）、`:526`（subscribe），错误码 `E_ATTENTION_REQUIRES_READ_MODEL_V2` 已进 `contracts/reason-codes.md`。
5. **抛出的内部错误不会污染协议 `reason_code`**。`service.mjs:70-75` 的 `withReason` 按第一个 `:` 截断并用 `^E_[A-Z0-9_]{2,62}$` 校验，`E_FALLBACK_PAUSE_RESOLUTION_INVALID:profile-not-frozen` 这类消息最终落到线上的是合法的 `E_FALLBACK_PAUSE_RESOLUTION_INVALID`。
6. **fence 判定先于「当前 Receipt 判定」**。`store.mjs:533` 是 `appendResult` 的第一道检查；`store.mjs:512` 位于 `currentReceipt()` 之前（D2 要求的正是「在当前 Receipt 判定之前」）。resolution 之后旧 Attempt 的迟到 result 返回 `E_ATTEMPT_FENCED`，有定向断言（`test/attempt-contract.test.mjs:181`）。
7. **pause 同键幂等按 canonical 字节判定**。`store.mjs:419-422`：`jcs(prior) === detail` 才返回既存、不增 seq；任一字节不同即 `E_FALLBACK_PAUSE_CONFLICT`。
8. **三个派生 ID 逐字复算 + 时间戳三点对齐**。`store.mjs:360-375`：`pause_id` / `fence_id` / `attention_id` 按 `sha256(protocol\nrun\nnode\nattempt\nreceipt\nreason)` 现算比对；`raised_at == fence.fenced_at == attention.raised_at` 强制；嵌套 `run_id/node_id/attempt_id/receipt_id` 交叉校验。有伪造反例（`test/attempt-contract.test.mjs:119`）。
9. **`event.at == raised_at` 成立**。`store.mjs:429` 构造事件时直接取 `pause.raised_at`；重放侧 `assertPauseLedger`（`store.mjs:51-59`）再次比对 `item.at === pause.raised_at`。
10. **resolution 是单批原子提交**。`store.mjs:466-487`：resolution 工件、新 Receipt 工件、两条事件、`state.json` 共 4 个 target 走**同一个** `commitMutation`；提交前先校验 `receipts.has(new receipt_id)` 拒重（`:460`），失败路径在写盘前就抛，不部分提交。
11. **retry 幂等键与冲突**。`(pause_id, retry_request_id)` 作唯一键（`store.mjs:450`、`runtime/attempt-retry.mjs:21`）；同键返回同一 resolution + 同一 Receipt（`test/attempt-contract.test.mjs:184`、`:221`）；同键换 profile 报 `E_FALLBACK_PAUSE_CONFLICT:retry-key-profile-mismatch`（`attempt-retry.mjs:23-25`）。
12. **retry 的「冻结 + 当前 registry 全等」双重复核到位**。`attempt-retry.mjs:28`（必须在 `manual_retry_profiles` 里）→ `:30-33`（当前 registry 可载且含该 profile）→ `:34-35`（重新读非敏感 projection 并四字段全等比对，不等则 `profile-snapshot-mismatch`）；Store 侧 `store.mjs:377-391` 再独立复核一遍。有正反例（`test/attempt-contract.test.mjs:197`）。
13. **journal 目标路径不能逃出 Run root**。`store.mjs:176-183` 的 `underRoot` 对 `blob` 与 `path` 双向解析并拒绝 `..` / 绝对路径 / 空；有篡改反例（`test/attempt-contract.test.mjs:155`）。
14. **只读 Attention 投影不写盘、遇未提交 mutation 拒读**。`store.mjs:796-820`：不调 `recoverMutations`、不重写 `state.json`；prepared journal 无 `.committed` 标记即抛 `E_STORE_MUTATION_RECOVERY_FAILED:recovery-required`；transaction_id 形态与文件名一致性都查。
15. **projection provider 只读白名单**。`profiles/identity.mjs:100-117`：只按已登记 JSON Pointer 取值，原始配置与未列字段不返回；`:26-33` 的 `assertSafeProjection` 对值与键做凭据形态拒绝；TOML 读取只认 section 之前的顶层键（`:73-94`），Pointer 深度 >1 直接 `E_NONSECRET_PROJECTION_UNSUPPORTED`。
16. **`config_fingerprint` / `executor_capability_hash` 的哈希输入与 D1 逐字一致**。`identity.mjs:130-139`：算法名、字段集、`supported_platforms` 去重后 `sort()`（code-unit 序）、经 `digest()`（RFC 8785 JCS + sha256）；没有混用 Runtime/Host handshake 的 capability hash。
17. **Receipt 字段闭集与容量上界**。`relay.attempt-receipt.v1.schema.json` `additionalProperties:false`、identity 四字段闭集、`fallback_profile_snapshots.maxItems=6`、alias `{1,48}`、profile id `maxLength:96`、hash 为 64 位小写 hex。凭据形态字段与第 7 项 snapshot 都有拒绝断言（`test/attempt-contract.test.mjs:72`）。
18. **`launch-receipt/v2` 历史形态仍可读**。该 schema 与其 golden（`fixtures/golden/launch-receipt.v2.json`，digest `dcc35f3c…`）在 `fixtures/manifest.json` 中**未变**；`store.mjs` 的旧 `registerReceipt` 分支（`store.mjs:73-90`）保留，`workflow-driver.mjs:113` 仍可走它。
19. **零敏感值入库**。逐字读了 7 份新增 golden fixture（`attempt-receipt.v1` / `fallback-pause.v1` / `rpc-bootstrap.v1` / `rpc-descriptor.v2` / `subscription-terminal.v1` / `client-read-model.v2.run-list` / `rpc.v2.request`），全部为 `RUN-1` / `aaaa…` 占位值；对整份 diff 跑了凭据形态扫描（`api_key|token|cookie|secret|password|authorization|bearer|sk-…|eyJ…`），命中项全部是 `classification:"nonsecret"` 字面量与 `/permissions` 这类 Pointer 名，**无凭据值**。`profiles/fixtures/negative-username-path.json` 里的 `C:/Users/nash` 是 **5999326 之前就存在的存量**（已用 `git show` 比对），本 diff 只改了它的 `fields` 结构。
20. **契约闸自洽**。R-004~R-007 全绿；`tools/audit-contracts.mjs:36-37` 为 rpc/v2 的两个条件收窄点登记了白名单，且 `contracts/OPEN-POINTS.md` 同步加了对应两行（审计的「白名单↔OPEN-POINTS 不同步 = 0」证明这一对是齐的）。
21. **`validate.mjs --selftest` 的 schema 归属推断已按 v2 扩展**。`tools/validate.mjs:249` 改为按 `handshake.protocol_version` 选 `relay.rpc/v1|v2`，对无 handshake 的 v1 response/error golden 保持原行为。
22. **bootstrap 协商语义正确**。`rpc/bootstrap.mjs:14-26`：单次问答后关闭；请求必须逐字为 `{protocol:"relay.rpc-bootstrap/v1"}`（`oneOf` 通过后仍显式比对 `frame.protocol`，堵住「拿 descriptor 当请求」的分支）；回包前对 descriptor 再做一次 schema 校验；第二帧直接 destroy。
23. **v2 method 参数闭集**。`relay.rpc.v2.schema.json` 五个 method 逐一 `if/then` 到 `relay.rpc-methods/v2` 的 `additionalProperties:false` 参数对象；`listRuns`/`inspectRun`/`subscribe` 的 `read_model_version` 都是 **required**，因此「v2 端点漏传版本导致静默按 v1 走」这条路被 schema 挡住了（我一开始怀疑此处有洞，核对后确认不成立）。
24. **v2 read model 形态**。`relay.client-read-model.v2.schema.json` 顶层 `open_attentions` required + `run_summary` 内逐项 `open_attentions` required，`service.mjs:659-672` 的 `listRuns` 与 `:674-687` 的 `inspectRun` 都实填，无静默省略。
25. **service 启动失败时的资源回收**。`service.mjs:771-775`：catch 分支按 bootstrap → v2 → v1 逐个 close；`close()`（`:789-791`）同样三个都关。
26. **Store 既有回归未被破坏**。`test/store.test.mjs` 的 24 个既有用例（含终态守卫、快照/增量逐字节一致、并发 seq 串行化、订阅 barrier、cursor 补发、writeGuard fencing）在 R-001 中全绿。

---

## 4. 与 brief 完成条件的对照（只陈述事实，不做验收裁决）

| # | 完成条件 | 本轮观察到的事实 |
|---|---|---|
| 1 | Attempt Receipt 开立/持久化/重放同一 `executor_identity`；`launch-receipt/v2` 仍可读；零敏感值 | 已实现且有断言（本文 §3 第 15–19 项）。**但**身份冻结的强制点在 registry 层缺失（P2-6），且 `account_alias`/`profile_id` 上界未在 registry 冻结（P1-2）。 |
| 2 | 单条 canonical pause 原子重放 fence / `waiting_human` / Attention；重复、冲突、损坏、截断、journal 强杀 fail-closed；迟到写入 `E_ATTEMPT_FENCED`；v1 不静默丢失 Attention | 幂等/冲突/派生 ID/路径逃逸/pause 工件缺失均已 fail-closed 且有反例。**未成立的**：journal 恢复在正常成功路径上会永久 fail-closed（P0-1）；event→pause 单向核对留下「waiting_human 无 Attention」缺口（P1-3）；合法 registry 的 pause 存在落不了账的尺寸风险（P1-1）；终态之后仍可 pause（P2-1）；v1 backfill 会收到新 kind（P1-4）；v1 subscribe 有 TOCTOU 窗口（P2-2）。 |
| 3 | v2 `retry-with-profile` 仅接受冻结且仍匹配的 profile；同键幂等；关闭 pause / 快照不匹配 / 部分失败均有定向反例；旧 Attempt 始终 fenced | 主干已实现且有定向反例（§3 第 11–12 项）。缺口：新 Receipt 丢弃 fallback 快照（P2-5）；「已关闭 pause + 新键」的错误码与设计口径不一致（P3-2）；未见「resolution 各 journal 阶段强杀」的定向反例。 |

## 5. 反例覆盖缺口（供后续轮次/整改参考，不代主控排期）

本轮未在测试面找到对应用例的场景：

1. pause 之后再写任一事件，然后重开 Store（P0-1 的直接反例）。
2. resolution 之后重开 Store。
3. registry 注册期的 4096 容量证明正反例（P1-1）。
4. raw `appendEvent` 造 `fallback_pause_created` 后的重放坏账判定（P1-3）。
5. v1 带 `after_seq` 在「pause 已 resolve」的 Run 上补发（P1-4）。
6. resolution 在 blob 已写 / journal 已写 / 目标部分写 / marker 未写四个阶段各自强杀后的恢复（design/11 D2 要求「任一 journal 阶段强杀」，现有只覆盖 pause 的一个切点：`test/attempt-contract.test.mjs:128`）。
7. 终态之后 pause（P2-1）。
8. `migrateConfigFingerprintRule` 对乱序 legacy fields 的排序断言（P1-5）；现有用例 `test/profile-identity.test.mjs` 的「registry migration only annotates legacy fingerprint field names as nonsecret」只验了标注、没验序。

## 6. 声明

- 本轮只读，未改任何生产代码、未派活、未提交、未询问用户；探针脚本全部落在会话 scratchpad 与系统临时目录，运行结束即清理，未写入本仓库、未读写用户级 registry 或任何 profile 配置文件。
- 上述结论只陈述事实与级别，不代主控做验收裁决，也不勾任何人类签名区。

---

# 7. 整改复验（第 2 轮 · 同一 reviewer · 只读）

> 日期 2026-08-30。同一 fresh 代码轮 1 reviewer 对整改后的未提交 diff 复验。仍只读：未改生产代码、未派活、未提交、未询问用户；本文件仍是唯一写入。
> 模型证据同 §0，未变（启动 `claude --model opus`、状态栏 `Opus 5`；系统上下文 `claude-opus-5`，SessionStart hook 文本 `claude-fable-5[1m]` 的不一致仍未消解，仍交主控裁决）。

## 7.1 复验基线与本轮取得的证据

整改后 diff 相对 `5999326`：32 个改动文件 + 26 个新增文件，1176 增 / 86 删（上一轮为 29+24、965 增 / 69 删）。新增受改文件：`profiles/validate-profiles.mjs`、`test/profiles.test.mjs`、`test/herdr-adapter.test.mjs`；新增负例 fixture `dhr61-fallback-pause-submillisecond`。

| ID | 命令 / 探针 | 结果 |
|----|------------|------|
| V-001 | `node tools/validate.mjs --selftest` | **pass 57 / fail 0**（与主控口径一致） |
| V-002 | `npm run audit` | 引用违规 0；结构 token 260 个，未登记 0，陈旧 0；白名单↔OPEN-POINTS 不同步 0 |
| V-003 | `node tools/capability-baseline.mjs` | 19 份 digest 相符，`capability_hash = fb55f2f85d1db38c…`（v2 侧随 schema 改动而变，属预期） |
| V-004 | `git diff --check` | exit 0，干净 |
| V-005 | `grep RPC_V1_CAPABILITY_HASH` vs `git show 5999326:…/capability-baseline.json` | 均为 `994d5f038cd1bcbbb9463eed5ca04b2ffc324f07b374571899b8df3a6c5c971e` —— **v1 握手指纹仍逐字冻结** |
| V-006 | `git diff 5999326 -- contracts/relay.rpc.v1.schema.json relay.rpc-methods.v1.schema.json relay.client-read-model.v1.schema.json` | **空 diff**，v1 三份契约零改动 |
| V-007 | 探针 A：`pause → resolution → openStore → 再 openStore` | 两次重开均成功，events=4，attentions=0 |
| V-008 | 探针 B：`pause → 普通事件 → openStore → 再写事件 → 再 openStore` | 重开 ×2 成功，events=4，`openAttentions`=1，`readOpenAttentions`=1 |
| V-009 | 探针 C：篡改 `.committed` marker 后重开 | 抛 `E_STORE_MUTATION_RECOVERY_FAILED:marker-invalid` |
| V-010 | 探针 D/D2：raw `appendEvent` 造两种新 kind | 分别抛 `E_TERMINAL_STATE_CONFLICT:fallback_pause_created-via-raw-append` / `…fallback_pause_resolved-via-raw-append` |
| V-011 | 探针 D3：删掉 pause 工件与 mutations、保留事件后重开 | 抛 `E_STORE_MUTATION_RECOVERY_FAILED:pause-ledger-incomplete` |
| V-012 | 探针 E：终态 Result 之后 `appendFallbackPause` | 抛 `E_TERMINAL_STATE_CONFLICT:fallback-pause-after-terminal` |
| V-013 | 探针 F：已关闭 pause 上换新幂等键 | 返回 `{"ok":false,"reason":"E_FALLBACK_PAUSE_CONFLICT"}`（不再 throw） |
| V-014 | 探针 G：`validateProfiles` 容量证明 | 6×(96 位 id, 48 位 alias) registry → `E_SCHEMA: herdr.codex.src.fallback_pause_detail>4096`；现实 registry → `ok` |
| V-015 | 探针 G'：容量边界扫描（JCS 模型，identifier=128、时间戳=29） | n=0→2085 … n=5→3944（accept）、**n=6→4316（reject）** |
| V-016 | 探针 H：pause 时间戳精度 | 毫秒=accept；4 位小数=reject；无小数=reject；最长合法毫秒代表 `9999-12-31T23:59:59.999+23:59`（29 字符）=accept |
| V-017 | 探针 I：`migrateConfigFingerprintRule` 排序 | 输出 `["/Approval","/model","/reasoning","/sandbox"]`，与 code-unit 序**逐项相同**；`createExecutorIdentity` 通过 |
| V-018 | 探针：resolution detail 上界 | 最大 750 字节（限 4096），裕度 3346 字节 |
| V-019 | 探针：credential 检查仍生效 | 含 `sk-…` 值的 registry → `E_CREDENTIAL_VALUE`；6 fallback 超限 registry → 先报 `E_SCHEMA` 容量项 |
| V-020 | `npm test`（本轮跑了两次，均有汇总终态） | 第 1 次：末尾报 `cli.test.mjs:700 两个 CLI 并发 mutating` 超时；第 2 次：**tests 233 / pass 232 / fail 1**，失败项换成 `dsh-bridge：真实 socket 断线中途按已送达高水位续传`。两次失败项**不同**，且 `cli.test.mjs` 单测隔离跑 4.9s 通过、同文件第三次整体跑 17/17 通过 —— 判为本机负载相关的时序抖动，非确定性回归。总数 233 与主控口径一致；**本轮我方未自行复现 233/233 全绿**，主控的 233/233 终态以其现场为准。 |

## 7.2 逐项裁决

| 项 | 上轮级别 | 裁决 | 证据 |
|---|---|---|---|
| **P0-1** journal 重放 | P0 | **CLOSED** | `store/store.mjs:246` 新增 `if (await readCommittedMarker(mutationRoot, journal.transaction_id)) continue;`；`store.mjs:174-184` 的 `readCommittedMarker` 校验 marker 的 `protocol`/`transaction_id`/`state`，篡改即 `marker-invalid`（V-009）。`recoverMutations` 另补 `MUTATION_ID_PATTERN` 校验（`:245`）。V-007/V-008 两条原崩路径均重开成功且可反复重开；测试面新增 `test/attempt-contract.test.mjs:172` 定向钉住。 |
| **P1-1** 4096 注册期证明 | P1 | **CLOSED** | `profiles/validate-profiles.mjs:67-93` 新增 `fallbackPauseBytes`：以 `identifier='R'×128`、`hash=64 位`、`timestamp='9999-12-31T23:59:59.999+23:59'`（毫秒制最长合法代表）加该 profile 的实际 fallback 身份构造 JCS payload；`:115-117` 超 4096 即拒绝 registry。V-014/V-015 证实 6×(96,48) 被拒、现实配置通过。因证明用的是 schema 上界 ID 与最长时间戳，而实际 pause 用更短的真实 ID，该证明对实际载荷是**上界**，不存在"注册通过但落账超限"的缝。`store.mjs:460` 的运行期 4096 兜底保留为第二道闸。测试：`test/profiles.test.mjs` 新增定向反例。 |
| **P1-2** registry ID/alias 上界 | P1 | **CLOSED** | `profiles/executor-profile.schema.json:61` 加 `"maxLength": 96`；`:65` `account_alias` 改为 `"pattern": "^[A-Za-z0-9._-]{1,48}$"`。与 `relay.attempt-receipt/v1#/$defs/identity` 的约束现已同源，签发期不会再出现"registry 通过、Receipt 被拒"。测试：`test/profiles.test.mjs`「registry freezes profile and account identity bounds before Attempt signing」（非 ASCII alias、90+ 段 id 均被拒）。 |
| **P1-3** 账本单向 / raw kind | P1 | **CLOSED** | 双向账本：`store.mjs:60-70` 新增 event→pause 方向（解析 `detail`、按 schema 校验、比对工件与 `node_id/attempt_id/at/reason`），`:84-94` 同样补 event→resolution 方向。raw 入口：`store.mjs:26` 新增 `MUTATION_ONLY_KINDS`，`:439` 与 `TERMINAL_RESULT_KINDS` 一并在 `appendEvent` 拒绝。V-010/V-011 实测均 fail-closed；测试 `test/attempt-contract.test.mjs:184`。 |
| **P1-4** v1 backfill 漏新 kind | P1 | **CLOSED** | `runtime/service.mjs:619-621` 先行扫描 backfill，命中两种新 kind 即在 `afterSend`（`:645-648`）走 `closeForAttention` 并**不发任何事件帧**；`:647-650` 其余 backfill 改经 `subscription.emit`（同一 v1 关闭闸，`:560-563`），且关闭闸从只匹配 `fallback_pause_created` 扩到含 `fallback_pause_resolved`。`lastSentSeq` 起点相应改为 `afterSeq === null ? nextSeq - 1 : afterSeq`（`:625`），使 backfill 真正过闸。测试：`test/rpc-service.test.mjs` 内新增断言 —— v1 带 `after_seq` 订阅已 resolve 的 Run 时先收到 `E_ATTENTION_REQUIRES_READ_MODEL_V2` 关闭，且 `notifications` 中**不含**任一新 kind。 |
| **P1-5** 迁移排序 | P1 | **CLOSED** | `profiles/identity.mjs:153` 改为 `(left, right) => (left.pointer < right.pointer ? -1 : left.pointer > right.pointer ? 1 : 0)` —— 实参错误与 locale 序两个问题一并消除，现为 UTF-16 code-unit 序，与 `asNonsecretFields`（`identity.mjs:20`）的 `prior >= field.pointer` 判据同源。V-017 实测与 `Array.prototype.sort()` 逐项一致且 `createExecutorIdentity` 通过；测试 `test/profile-identity.test.mjs:47`。 |
| **P2-1** 终态守卫 | P2 | **CLOSED** | `store.mjs:468` 新增 `if (terminalOf(pause.node_id)) throw new Error('E_TERMINAL_STATE_CONFLICT:fallback-pause-after-terminal')`，与既有 `emitEvent` 终态守卫同码族。V-012 实测；测试 `test/attempt-contract.test.mjs:184` 后半段。 |
| **P2-2** v1 subscribe TOCTOU | P2 | **CLOSED** | Attention 判定从 `enqueue` 之外移入内部，并下沉到 Store：`store.mjs:639-645` 的 `subscribe(listener, { rejectOpenAttention })` 在**写队列内**判 open Attention 并抛 `E_ATTENTION_REQUIRES_READ_MODEL_V2`，与 barrier 取尾 seq 处于同一临界区，窗口消失；`service.mjs:588-599` 有 actor 时走该路径，无 actor（无写者）时才回落 `assertV1AttentionCompatible`（`:600-601`）。actor 换代路径同样传入该选项并在被拒时 `closeForAttention()`（`service.mjs:256-266`）。 |
| **P2-3** 目录 fsync | P2 | **CLOSED** | `store.mjs:166-172`：`rename` 之后打开父目录并 `sync()`，仅对 win32 的 `EPERM` 容忍（其余平台照抛）。blob 发布、prepared journal、目标写入、committed marker 四处共用该函数，满足 D2「fsync 并同步其目录」的顺序要求。 |
| **P2-5** retry 丢 fallback 快照 | P2 | **CLOSED** | `runtime/attempt-retry.mjs:48-52`：按重试选中 profile 的 `fallback_profile_ids` 原序解析并冻结，缺 `config_fingerprint_rule` 的 fallback 直接 `E_NONSECRET_PROJECTION_MISSING` fail-closed；新 Receipt 不再恒为空数组。与 `workflow-driver.mjs` 的 source 路径口径一致。 |
| **P2-6** source projection 未强制 | P2 | **CLOSED** | `runtime/workflow-driver.mjs:97-99`：Herdr 节点的 source profile 缺 `config_fingerprint_rule` 时抛 `E_NONSECRET_PROJECTION_MISSING:source-<id>`，不再静默退回无身份 Receipt；`:101` 起对所有带 profile 的 Herdr Attempt 一律冻结身份。测试 `test/agent-node.test.mjs`「Herdr Attempt freezes source and ordered fallback identities before launch」。**残留（不阻塞）**：registry schema 的 `required` 仍不含 `config_fingerprint_rule`，强制点在开 Attempt 而非注册；见 N-2。 |
| **P3-2** 已关闭 pause 的错误码 | P3 | **CLOSED** | `store.mjs:498-500` 改为 `return { ok: false, reason: 'E_FALLBACK_PAUSE_CONFLICT' }`，与同函数幂等/冲突分支形态统一，也与设计 §D2-5「不同键重试已关闭 pause 返回冲突」一致。V-013 实测。 |
| **P3-3** resolution ID 宽窄不一 | P3 | **CLOSED** | `contracts/relay.fallback-pause-resolution.v1.schema.json:8-9` 的 `pause_id`/`attention_id` 由 `identifier` 收窄为 `sha256`，与 `relay.fallback-pause/v1` 及 `relay.rpc-methods/v2` 同源。 |
| **P3-5** 时间戳精度无上界 | P3 | **CLOSED** | `contracts/relay.fallback-pause.v1.schema.json` 新增 `$defs/millisecondTimestamp`（在 `relay.common/v1` timestamp 之上叠加 `\.[0-9]{3}(?:[Zz]\|[+-]…)$`），`raised_at`/`fenced_at`/`attention.raised_at` 三处引用；新增负例 fixture `dhr61-fallback-pause-submillisecond`（期望 `E_BAD_VALUE@/raised_at`）并已登记 manifest。V-016 实测；容量证明所用的 29 字符时间戳恰为该约束下的最长合法代表，两者已对齐。 |

### 未整改项（上轮列出、本轮未纳入复验清单，状态照登）

| 项 | 级别 | 状态 | 说明 |
|---|---|---|---|
| P2-4 | P2 | **OPEN** | `store.mjs:186-206`：staging blob 与 prepared journal 成功后仍不回收，且 `events.jsonl` 仍以整份文件作为 mutation target。每次 pause/resolution 存一份完整事件日志副本，磁盘随 pause 次数 O(n²) 增长。P0-1 修复后它不再引发正确性问题，只剩存储成本；design D2「成功后按审计保留规则回收」尚无实现。 |
| P3-1 | P3 | **OPEN** | `relay.subscription-terminal/v1` 已进 capability 基线、`rpc/server.mjs:220` 有 sink 方法、`relay.rpc.v2.schema.json` 有通知分支，但全仓仍无调用方（`grep subscriptionTerminal` 只命中定义）。v1 强制关闭走 `sink.close()` 的标准 v1 error 帧，v2 侧无终止通知路径。 |
| P3-4 | P3 | **OPEN** | `rpc/bootstrap.mjs:8-11` 仍未传 `ownerAware`/`capability`/`authorize`，与 v1/v2 端点的接入策略不同源。它只回吐 descriptor，设计未要求鉴权，仅登记口径差异。 |

### 本轮新增观察（均不阻塞）

| ID | 级别 | 事实 |
|---|---|---|
| N-1 | P3 | `docs/modules/dh-relay/as-built/relay-core.md:199` 仍写「新增合同只进入 bootstrap/v2 的 `f1ded3…b79f2`」，而 `capability-baseline.json:100` 现为 `fb55f2f85d1db38ca12ed1a729c042e7cb8d80092643eb37532805f644c1d073`。as-built 的这句指纹已陈旧，需随收口同步（同段落里 v1 的 `994d5f…c971e` 仍正确）。 |
| N-2 | P3 | `workflow-driver.mjs:97` 的抛错位于 `driveHerdrNode` 的 `try`（`:187`）**之前**，会沿 `driveNode` → `drive()` 冒泡，被 `:406` 的 `done` 收成 `{ok:false,error}`。后果是**整届 driver 停摆**，同批其余 pending 节点不再推进；而相邻两条同类前置失败（`:132` registry 不可用、`:134` profile ref 无条目）只是 `return`、跳过该节点。语义不同源，建议后续统一。无未处理拒绝，仍是 fail-closed。 |
| N-3 | P3 | `assertPauseLedger`/`assertResolutionLedger`（`store.mjs:51-95`）现为双向全扫，复杂度约 O(事件数 × pause 数)，每次 `openStore`/`readOpenAttentions` 都跑。当前规模无感，事件账长起来后是热点。 |
| N-4 | P3 | `validate-profiles.mjs:100` 把 `E_CREDENTIAL_VALUE` 的返回从最前面挪到 schema/悬空 fallback/容量三项之后（`E_CREDENTIAL_FIELD` 仍最先）。两类凭据仍都被拒（V-019），只是报错优先级变了；无安全缺口，仅登记行为变化。 |
| N-5 | — | `workspace/DHR_61/{findings,progress}.md` 未随本轮整改更新：F-003 描述的「bootstrap/v2 endpoint、v2 read model、订阅后新建 Attention 的 v1 强制关闭、retry 的当前 Registry 复核」四项现已实现，F-002 的全量终态（tests 233）也已具备。属收口工件维护，不是代码缺陷；**本轮 reviewer 不代改**。 |
| N-6 | — | 已核对无问题：`relay.fallback-pause-resolution/v1` 虽无注册期容量证明、`resolved_at` 也未限毫秒，但其 canonical detail 的 schema 上界实测仅 **750 字节**（限 4096，裕度 3346），且失败时整笔 resolution 原子回退，不可达风险。 |

## 7.3 复验结论

- **P0：0 项。** 上轮唯一的 P0-1 已闭合，且有 marker 校验反例（V-009）与两条原崩路径的正例（V-007/V-008）。
- **P1：0 项。** P1-1~P1-5 五项全部闭合，每项均有代码位点 + 本轮独立探针 + 施工方新增的定向测试三重证据。
- 剩余 **P2 1 项**（P2-4 staging/journal 不回收，仅存储成本）、**P3 3 项**（P3-1 无生产者的 subscription-terminal、P3-4 bootstrap 无 owner 闸、N-1~N-4 一类的口径与文档同步项）。
- 契约闸与冻结面：selftest 57/57、audit 0 违规、capability 基线 19 份相符、`git diff --check` 干净；**v1 握手指纹 `994d5f…c971e` 与 v1 三份契约仍逐字未动**。
- 机器终态：主控口径 `npm test` 233/233。本轮我方两次 `npm test` 均得到汇总终态，第二次为 tests 233 / pass 232 / fail 1，两次失败项各不相同（`cli.test.mjs:700`、`dsh-bridge` 断线续传），且 `cli.test.mjs` 单测隔离通过、同文件整体第三次 17/17 通过 —— 判为本机负载引起的时序抖动，与 DHR_61 改动面（Store journal / pause / RPC v2 / profiles）无交集。**如实登记：本轮我方未自行复现 233/233 全绿**，是否以主控现场终态为准由主控裁决。
- 本节仍只陈述事实与级别，不代主控做验收裁决，不勾人类签名区；复验全程只读，未改生产代码、未派活、未提交。
