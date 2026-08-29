<!-- dh:v1 -->
# review-code2-opus — DHR_61 代码轮 2（fresh，只读 + 变异验证）

## 0. 抬头与模型证据

| 项 | 值 |
|---|---|
| 卡 | DHR_61 · Attempt 身份与暂停重试契约 |
| 复核路径 | heavy 配方 · **代码轮 2**（fresh reviewer，非施工者、非主控；轮 1 见 `review-code1-opus.md`） |
| 审查对象 | 工作树 `D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_61` 的未提交 diff，基线 `5999326` |
| 模式 | 只读 + 一次受控变异（详见 §4）。未派活、未提交、未询问用户；本文件是本轮唯一永久写入 |
| 日期 | 2026-08-30 |

**模型证据（如实记录，含不一致项）**

1. 启动命令：`claude --model opus` —— 由主控在派活指令中声明；本 session 内无法自证进程命令行。
2. 状态栏显示：`Opus 5` —— 同上，由主控声明。
3. 本 session 自身可见的两条证据互相矛盾：
   - 系统上下文写明 `You are powered by the model named Opus 5. The exact model ID is claude-opus-5`；
   - **SessionStart hook 注入的文本为 `当前模型：claude-fable-5[1m]`**。
4. 结论：第 1、2 项按指令如实登记；第 3 项的内部不一致我无法在 session 内消解，**交主控裁决，本轮不代判**。轮 1 报告 §0 记录了完全相同的不一致，说明这是环境层的稳定现象，不是某一轮的偶发。

---

## 1. ⚠️ 首要事实：本轮审查期间工作树被并发改写三次

这一节放在最前面，因为它决定了本报告所有 `file:line` 引用的可信范围。

本轮开始逐文件通读后，我发现同一文件的 SHA256 在两次测量之间发生变化——**施工 session 仍在这棵工作树上写代码**。实测漂移：

| 时刻 | 观察 |
|---|---|
| 02:00 前 | `store/store.mjs` = `a891914b…`，883 行，`git diff --stat` 405 增 |
| 02:00:41 | `store/store.mjs` 变为 `19f2b088…`，894 行，417 增（新增 `assertFrozenRetryProfiles`）；`workflow-driver.mjs`、`test/{agent-node,attempt-contract}.test.mjs` 同批变动 |
| 02:01:52 | `runtime/service.mjs` 被改写 |
| 02:05:03 | **我取快照钉住 55 个文件的 SHA256**（见 §7 附录口径），此后所有结论按此快照复核 |
| 02:19:07 | 复查快照，`runtime/attempt-retry.mjs`、`test/rpc-service.test.mjs`、`tools/structural-tokens.txt` 三份又变了 —— 施工方**在我复核期间修掉了我本轮发现的 P1-1**（见 §2.0） |
| 02:23:06 | 终态：`git diff --stat 5999326` = 34 文件 / 1254 增 / 122 删（轮 1 首轮为 29+24 / 965 增；轮 1 复验为 32+26 / 1176 增） |

**这对复核纪律的影响，如实登记、不代主控裁决**：

- 「代码轮 2 对整改后的冻结 diff 做 fresh 复核」这一前提在本轮**没有成立**——审查对象在审查过程中被改。轮 1 的 §7 复验同样是对一个仍在变的树做的。
- 我采取的补救：在 02:05 钉住全量哈希，之后每条结论都在**当前字节**上重跑探针复现（§2 各条均标注复现时间），并在 02:19 和 02:23 各做一次漂移复查。**未复现的结论一条都没写进本报告。**
- 我的变异实验（§4）对 `store/store.mjs` 有一次临时写入。该文件在整个变异窗口（02:08:20–02:09:10）内未被他人改动，恢复后 SHA256 与变异前逐字相同，且我在恢复前后各做了一次哈希比对（见 §4）。**但这类并发下的变异操作有真实的互相覆盖风险**，这次只是没撞上。
- 建议（不代排期）：heavy 配方的代码轮 2 需要一个「冻结点」——施工方停手、主控声明 diff 冻结之后再发轮 2，否则轮 2 的结论永远是对历史状态的陈述。

---

## 2. 结论清单（P0 → P3）

**P0：0 项。**

### 2.0 P1-1 · retry 冲突在 RPC 上表现为静默断连 —— 本轮发现，施工方已在复核期间修复

这一条按发现时的事实与当前状态**分开登记**，不合并，因为它同时是一条缺陷记录和一条流程记录。

**发现时（02:05 快照，`attempt-retry.mjs` = `b16a6eba…`）的事实：**

- `store/store.mjs:511`、`:513` 在两种冲突下返回 `{ ok: false, reason: 'E_FALLBACK_PAUSE_CONFLICT' }`（同键内容不同 / 已关闭 pause 换新键）。
- `runtime/attempt-retry.mjs` 当时**原样透传**该返回值，`runtime/service.mjs:743-746` 的 `retry-with-profile` 也不做 `ok === false` 处理（对照 `service.mjs:380` 的 `commitReceipt` 是做的）。
- `contracts/relay.rpc.v2.schema.json` 的 `response.result` 是四分支 `oneOf`，其中 `relay.rpc-methods/v2#/$defs/retry_result` 的 `ok` 是 `const true`，`additionalProperties:false`。`{ok:false, reason}` 不匹配任何分支。
- `rpc/server.mjs:188` → `encodeValidatedFrame` 在 `formal:true` 下校验整帧，失败即 `throw` → `:191-193` 走 `dropConnection(conn)` = `conn.destroy()`。

**实测（探针 M-002，02:06 与 02:19 两次复现）**：一个正常握手完成的 v2 客户端发出冲突 retry 后：

```
after conflicting retry:
  frames received total = 1     （只有 contracts 的那一帧）
  any frame with id=2   = false （没有响应）
  any error frame       = false （没有 error 帧）
  socket closed on us   = true  （服务端直接 destroy）
```

**违反**：design/11 D2-5「不同键重试已关闭 pause **返回冲突**」；`contracts/reason-codes.md:45` 把 `E_FALLBACK_PAUSE_CONFLICT` 登记为**协议层码**（该表自称「协议层 reason code 的全集权威」），协议码必须上线；`rpc/server.mjs:294-297` 的注释逐字点名这种形态是 design/07 §5.2 禁止的「稳定拒绝表现为静默断连」。

**回归性质**：轮 1 的 P3-2 建议把这两处从 `throw` 改成 `return {ok:false}` 并判为 CLOSED。改之前，`throw` 会经 `withReason` 变成一个带 `E_FALLBACK_PAUSE_RESOLUTION_INVALID` 的合法 error 帧；改之后客户端**什么都收不到**。可观测性是净退步，轮 1 复验时未核对 RPC 出口面。

**当前状态（02:19 之后）：已修复，我已复验。** `runtime/attempt-retry.mjs:54` 新增 `if (result?.ok === false) throw new Error(result.reason ?? 'E_FALLBACK_PAUSE_CONFLICT');`；`test/rpc-service.test.mjs:682-686` 新增 RPC 级定向断言，其断言消息逐字写着 `'a closed-pause conflict must be a schema-valid RPC error, not a dropped connection'`。我跑 `node --test test/rpc-service.test.mjs test/attempt-contract.test.mjs` → **tests 25 / pass 25 / fail 0，exit 0**。

**残留（不阻塞）**：`store/store.mjs:475` 的 `appendFallbackPause` 冲突分支同样返回 `{ok:false}`，目前无生产调用方（§3 第 21 项），所以没有 RPC 出口；DHR_34 接入 pause 时必须做同样的 `ok===false → throw` 转换，否则同一个洞会从另一扇门回来。建议把这条写进交接说明。

---

### 2.1 P1-2 · 一个 Run 的未恢复 mutation journal 让 `listRuns`（v1 **与** v2）对**所有**客户端失效

- **位置**：`runtime/service.mjs:671`（v1 `listRuns` 逐 Run 调 `assertV1AttentionCompatible`）、`runtime/service.mjs:710`（v2 `listRuns` 逐 Run 调 `attentionsFor`）→ 二者都落到 `store/store.mjs:869-870` 的 `E_STORE_MUTATION_RECOVERY_FAILED:recovery-required`；`runtime/discovery.mjs:38-63`（`classifyRunRoot`）。
- **根因**：DHR_61 给 `openStore` / `readOpenAttentions` 加了一条新的「可打开」前置条件（所有 prepared journal 必须有 committed marker），但**没有**把这条前置加进 discovery 的完整性判据。于是一个 pause 事务崩在 marker 之前的 Run 被 `classifyRunRoot` 判为 `complete`、进入 `known.roots`，随后每一次 `listRuns` 都会在它身上抛错。
  这恰好打破 `discovery.mjs:33-36` 自己写下的不变量：「这里复用 Store 的同一段 `readEventLog`，**让两者永远同真同假**……只看存在性会把一本读不动的账端进 Read Model：list/status 已经把它当成可控 Run 报出去，随后任何 openStore 都会 fail-closed——两条判据不一致，就是『看得见、打不开』」。DHR_61 让这两条判据重新分叉了。
- **实测（探针 M-003，02:04 与 02:21 两次复现）**：一个临时仓，两个 Run —— `R001-healthy`（完全健康，无 pause）与 `R002-broken`（一次已落账的 pause，仅 `.committed` marker 被删，blob/journal/目标全在）：

  ```
  C1 discovery roots = [ 'R001-healthy-20260827', 'R002-broken-20260827' ]   ← 两个都判为 complete
  C1 discovery report = []                                                   ← 没有任何异常登记
  C2 readOpenAttentions(healthy) -> []
  C2 readOpenAttentions(broken)  -> THROWS E_STORE_MUTATION_RECOVERY_FAILED:recovery-required
  C3 v1 listRuns  -> CONNECTION DROPPED (no frame)
  C4 v2 listRuns  -> CONNECTION DROPPED (no frame)
  C5 v2 inspectRun(healthy Run) -> ok open_attentions=[]        ← 逐 Run 方法正常
  C6 v2 inspectRun(broken Run)  -> CONNECTION DROPPED (no frame)
  ```

- **违反**：design/11 D2「在 mutation 恢复完成前**该 Run** 一律拒绝读写/订阅」——设计把拒绝范围钉在**单个 Run**，实现把它放大到整张列表；`reason-codes.md:47` 同样把该码的语义写成「Store 必须拒绝打开**该 Run**」。design §4 的「绝不筛掉项目」讲的是 open Attention 场景，不是给「一个坏 Run 拖垮整张表」背书。
- **后果**：任何一次 pause/resolution 事务在 marker 落盘前被强杀，之后**全仓的 run 列表对所有客户端不可用**，v2 也不能幸免——而 v2 正是设计里用来看 Attention、做 retry 收拾残局的那条路。运维想恢复必须已经知道那个 run_id 并直接走 `control`（经 `ensureActor` → `openStore` → `recoverMutations` 才会自愈），但他连列表都列不出来。
- **未被测试覆盖**：现有用例只在**单 Run** Store 层面验证恢复（`test/attempt-contract.test.mjs:152`、`:169`），没有「一个坏 Run + 一个好 Run，走 service 的 listRuns」这一组合。
- **修法方向（仅供参考，本轮不改）**：二选一或并用——① 把 mutation-recovery 检查并进 `classifyRunRoot`，让坏 Run 像坏事件账一样落进 `report` 而不进 `roots`；② `listRuns` 逐项捕获，把该 Run 投影成 `read_only` + 明确 reason，而不是让异常穿透整个方法。

### 2.2 P1-3 · `E_STORE_MUTATION_RECOVERY_FAILED` 是登记在册的协议码，却在全链上被降级成「断连」

这是 P1-2 的另一半，根因不同、修法不同，单列。

- **位置**：`store/store.mjs:869-870`、`:250`、`:230` 等处抛的是**裸 `new Error('E_STORE_MUTATION_RECOVERY_FAILED:…')`**，没有 `.reason` 属性；`runtime/service.mjs` 的 `assertV1AttentionCompatible`（`:328-336`）、`attentionsFor`（`:341-349`）以及调用它们的 `listRuns`（`:671`/`:710`）、`inspectRun`（`:677`/`:723`）、`subscribe`（`:631`）**都没有 `withReason` 包装**；`rpc/server.mjs:328-330` 的分派器判据是 `error?.reason ? sendError(...) : dropConnection(conn)`。
- **事实**：`contracts/reason-codes.md:47` 把 `E_STORE_MUTATION_RECOVERY_FAILED` 写在**表格行内**，而该文件的「边界声明」明确区分了「表格 = 协议层 reason code 全集」与「`E_EVENT_LOG_CORRUPT:*` / `E_STORE_CORRUPT:*` 这类进程内异常前缀，不是协议码、不上线」。也就是说：这个码是被有意设计成要上线的，但实现里它一次都到不了线上。
- **实测**：即 §2.1 的 C3/C4/C6 —— 三条路径全部 `CONNECTION DROPPED (no frame)`，客户端拿不到任何 reason。
- **违反**：`rpc/server.mjs:294-297` 自述「所有同步 throw 的稳定拒绝……都表现为静默断连，客户端连 reason 都收不到。这正是 design/07 §5.2 禁止的形态」。
- **对照**：同一份 `service.mjs` 里，`serviceError()` 造的错误都带 `.reason`，`mutate` 路径（`:510`）与 `retry-with-profile`（`:747`）都显式 `withReason(error)`。新加的 Attention 读路径是唯一漏掉这一步的。
- **说明**：`E_ATTENTION_REQUIRES_READ_MODEL_V2` 走的是 `serviceError`，所以**它**能正常回帧（rpc-service 测试也钉住了）；坏掉的只有 Store 直抛的那一族。这就是为什么现有测试全绿也照不到这个洞。

---

### 2.3 P2-1 · `commitMutation` 中途失败后仍存活的 Store 句柄会与盘上事件账错位，把该 Run 变成永久打不开

- **位置**：`store/store.mjs:492-501`（`appendFallbackPause`：`pauses.set` / `events.push` **在** `commitMutation` 之后）、`:535-548`（resolution 同构）、`:230`（`target-conflict`）。
- **机理**：`commitMutation` 在 `applyPreparedMutation` 里就已经把 `events.jsonl` 写成新内容了，最后才写 `committed` marker（`:204`）。若这两步之间任一次 `writeAtomicText` 抛错（ENOSPC、杀软/OneDrive 的 EPERM、目录 fsync 失败等），异常向上抛出，但**进程还活着，Store 句柄也还活着**——它的内存 `events` 数组没更新，盘上却已经多了一条。此后该句柄写的任何一条普通事件都会让 `events.jsonl` 既不等于 journal 的 `staging_hash`、也不等于 `before_hash`，于是重开必然 `target-conflict`。
- **实测（探针 M-004，02:18 复现）**：

  ```
  marker present  | events.jsonl lines=3 | reopen -> OPENS OK, events=3
  marker REMOVED  | events.jsonl lines=3 | reopen -> THROWS E_STORE_MUTATION_RECOVERY_FAILED:target-conflict
  ```

  两行只差「marker 是否存在」，对照组证明这不是「pause 之后再写事件」本身的问题（那是轮 1 P0-1，已真闭合），而是「事务未标 committed 却让同一句柄继续写」的问题。
- **性质**：这是轮 1 P0-1 的**同一种坏账形态从另一扇门回来**。marker 修复解决了「成功路径被当成未完成重放」，没有解决「失败路径下内存与盘面分叉」。纯进程崩溃不受影响（崩了就没有后续写入，恢复正常）；触发条件是**写失败但进程存活**。
- **违反**：design/11 D2「恢复 `prepared` 时逐目标判定……**无法补全**均为 `E_STORE_MUTATION_RECOVERY_FAILED` 并 fail-closed」——fail-closed 是满足了，但该条款的语境是「逐目标**补全**」，此处补全的可能性被自己写没了，Run 不可恢复。
- **修法方向**：`commitMutation` 拒绝后毒化句柄（置 `poisoned = true`，`runWrite` 前置检查一律抛 `E_STORE_MUTATION_RECOVERY_FAILED:handle-poisoned`），让该 Run 只能经重开+恢复回到一致态。

### 2.4 P2-2 · retry 把「registry 不可用」和「fallback 缺规则」并成同一个码

- **位置**：`runtime/attempt-retry.mjs:49-51` —— `const fallback = resolveProfile(...); if (!fallback?.config_fingerprint_rule) throw new Error(\`E_NONSECRET_PROJECTION_MISSING:fallback-${profileId}\`)`。`?.` 让「registry 里根本没有这个 profile」和「有但缺 `config_fingerprint_rule`」落到同一条错误上。
- **叠加**：`runtime/executors/herdr/profile-registry.mjs:19` 把 `ENOENT` 当成 `{ ok: true, registry: { profiles: [] } }`。于是 registry 文件整个不存在时，`attempt-retry.mjs:31` 的 `registry-invalid` 分支走不到，最终报的是 `:33` 的 `profile-not-current`。
- **违反**：design/11 D3 逐字要求「`registry unavailable` 与 `fallback unavailable` 必须是**两个独立负例**」；design §5 止损条款点名「不能把 `registry unavailable` 误判成『没有 fallback』」。
- **性质**：两条路都是 fail-closed（retry 都被拒），没有安全或数据风险，但把设计明确要求可分辨的两种失败合并成一种，会在 DHR_34 接 D3 自动选择时变成实打实的误判源。`profile-registry.mjs:19` 的 ENOENT 分支是 DHR_32 存量，但 DHR_61 把它变成了 D2-5 的承重件。

---

### 2.5 P3 清单

| ID | 位置 | 事实 |
|---|---|---|
| P3-1 | `runtime/service.mjs:736-742` | `retry-with-profile` 没有 `isLegacy` 闸；对照 `subscribe`（`:540`）和 `mutate` 都有。legacy run_id 目前报 `E_RUN_NOT_FOUND`（因为 legacy 不进 `known.roots`）而不是 `E_LEGACY_READ_ONLY`，口径与同层方法不同源。 |
| P3-2 | `docs/modules/dh-relay/as-built/relay-core.md:199` | 仍写「新增合同只进入 bootstrap/v2 的 `f1ded3…b79f2`」，实测 `node tools/capability-baseline.mjs` 现为 `fb55f2f85d1db38c…`。同段 v1 的 `994d5f…c971e` 仍正确。轮 1 N-1，仍 OPEN。 |
| P3-3 | `workspace/DHR_61/findings.md` | F-002（全量回归无终态）与 F-003（bootstrap/v2、v2 read model、v1 强制关闭、retry registry 复核未完成）描述的缺口均已实现，工件未更新。轮 1 N-5，仍 OPEN。收口工件维护，非代码缺陷。 |
| P3-4 | `store/store.mjs:186-205` | staging blob 与 prepared journal 成功后从不回收（全文件 `grep rm(/unlink/rmdir` 零命中），且每次 pause/resolution 都把**整份** `events.jsonl` 存一份副本。磁盘随 pause 次数 O(n²)。design D2「成功后按审计保留规则回收」无实现。轮 1 P2-4，仍 OPEN。 |
| P3-5 | `contracts/relay.subscription-terminal.v1.schema.json`、`rpc/server.mjs:220-222` | 全仓 `grep subscriptionTerminal` 只命中 sink 定义本身，仍无任何生产者。契约已进 `capability_hash`，无对应行为。轮 1 P3-1，仍 OPEN。 |
| P3-6 | `rpc/bootstrap.mjs:10` | `bindOwnedEndpoint` 仍未传 `ownerAware`/`capability`/`authorize`（grep 零命中），与 v1/v2 端点的 `formal:true, ownerAware:true` 不同源。只回吐 descriptor，设计未要求鉴权。轮 1 P3-4，仍 OPEN。 |
| P3-7 | design/11 §2 D2「容量约束」段 | **设计文本内部不可满足**：它同时要求 `fallback_profile_ids.maxItems=6` 与「以各 ID 的 schema 最大合法代表 + 毫秒时间戳最大代表 + **六个** snapshot 构造 JCS payload 并证明 ≤4096」。我实测（探针 M-001B，`identifier`=128 字符取自 `relay.common/v1`、`executor_profile_id`=96、`account_alias`=48、时间戳 29 字符）：n=0→2085、n=4→3572、n=5→3944、**n=6→4316 > 4096**。也就是说按字面口径，任何带 6 个 fallback 的 registry 都必须被拒，`maxItems:6` 形同虚设。`profiles/validate-profiles.mjs:67-93` 的实现改用**该 profile 的真实 fallback id/别名与真实条数**——对实际载荷仍是上界（因为 Receipt 的快照就来自同一份通过校验的 registry），是必要且正确的偏离，但 design 文本未同步。留给一致性路。 |
| P3-8 | `profiles/validate-profiles.mjs:100`、`tools/validate.mjs:207` | `validateProfiles` 每次调用都 `loadAjv()`，而 `loadAjv` 每次都重新遍历并解析整个 `contracts/` 目录（无缓存，对照 `store/store.mjs:28-32` 的 `validatorCache`）。`loadExecutorProfiles` 在**每次开 Attempt、每次 retry** 都调它。存量问题，但 DHR_61 把 `fallbackPauseBytes` 也放进了这条热路径。 |
| P3-9 | `store/store.mjs:467` | `appendFallbackPause` 仍无生产调用方（全仓 `grep` 只命中定义与测试）。这是本卡的预期形态（quota 分类归 DHR_34），登记为交接事实，非缺陷。 |

---

## 3. 已核对无问题的区域（本轮独立复核，逐条）

以下每条都是我本轮自己看过 / 跑过并确认成立的，不是转述轮 1。

1. **v1 握手指纹逐字冻结**。`git show 5999326:relay-core/capability-baseline.json` 的 `capability_hash` = `994d5f038cd1bcbbb9463eed5ca04b2ffc324f07b374571899b8df3a6c5c971e`；`rpc/capabilities.mjs:20` 的常量逐字相同。`localCapabilityHash()`（`:43`）只返回它，新合同只进 `localCapabilityHashV2()`（`:48`）。
2. **v1 三份契约零改动**。`git diff --stat 5999326 -- contracts/relay.rpc.v1.schema.json relay.rpc-methods.v1.schema.json relay.client-read-model.v1.schema.json` 输出为空。
3. **v1 端点地址不变**。`runtime/endpoint.mjs` 的 `channel` 默认 `'v1'` → `suffix` 为空串，pipe/unix 地址与改前逐字一致；bootstrap 与 v2 各带自己的后缀，三条不复用。
4. **`relay.event/v2` 对两个新 kind 的条件收窄**。`fallback_pause_created` 强制 `node_id`/`attempt_id`/`reason`/`detail` 齐备且 `reason` 为 `E_FALLBACK_UNAVAILABLE`；`fallback_pause_resolved` 强制 `node_id`/`attempt_id`/`detail`。两个 `if/then` 都用 `required:["kind"]` 守住，不会误伤其他 kind。
5. **Attempt Receipt 字段闭集与上界**。`additionalProperties:false`；identity 四字段闭集，`executor_profile_id` `maxLength:96`、`account_alias` `^[A-Za-z0-9._-]{1,48}$`、两个 hash 为 `sha256`；`fallback_profile_snapshots.maxItems:6`。与 `profiles/executor-profile.schema.json` 的 registry 侧约束现已同源（`:61` 加了 `maxLength:96`，`:65` 改成同一 alias pattern），签发期不会再出现「registry 通过、Receipt 被拒」。
6. **`millisecondTimestamp` 的定义与覆盖面**。`contracts/relay.fallback-pause.v1.schema.json` 的 `$defs/millisecondTimestamp` 在 `relay.common/v1#/$defs/timestamp` 之上叠加 `\.[0-9]{3}(?:[Zz]|[+-]…)$`，`raised_at` / `fence.fenced_at` / `attention.raised_at` 三处全部引用，没有漏网。
7. **容量证明的上界是可靠的**。我逐字核对 `relay.common/v1#/$defs/identifier` 的 pattern 上界确为 128 字符，`validate-profiles.mjs:68` 的 `'R'.repeat(128)` 因此是真上界而非低估；`'9999-12-31T23:59:59.999+23:59'`（29 字符）在 `millisecondTimestamp` 约束下确为最长合法代表（闰秒 `23:59:60` 同长）。探针 M-001B 复算的分档与该实现口径一致。
8. **`assertFrozenRetryProfiles`（`store/store.mjs:419-428`，02:00 那批新增）**：强制 pause 的 `manual_retry_profiles` 是当前 Receipt `fallback_profile_snapshots` 的**保序子序列**（`cursor` 单调不回退），任一项不在快照里或次序颠倒即 `E_FALLBACK_PAUSE_INVALID:profile-not-frozen`。这堵住了「pause 凭空扩大人工可选集」和「打乱 routing-priority 原序」两条，正是 design D1「不得重新计算或扩大它」要的。`test/attempt-contract.test.mjs:136`/`:140`/`:143` 有正反例。
9. **raw 入口对两个新 kind 全封**。`store/store.mjs:26` 的 `MUTATION_ONLY_KINDS` 与 `TERMINAL_RESULT_KINDS` 一并在 `appendEvent`（`:450`）拒绝，报 `E_TERMINAL_STATE_CONFLICT:<kind>-via-raw-append`。
10. **pause 的终态守卫**。`store/store.mjs:481` 在 `commitMutation` 之前判 `terminalOf(node)`，与 `emitEvent` 的终态守卫同码族；已定终态的节点翻不回 `waiting_human`。
11. **fence 判定先于当前 Receipt 判定**。`appendCheckpoint`（`:567`）与 `appendResult`（`:588`）都把 `fencedAttempts` 检查放在 `currentReceipt()` 之前，与 design D2「必须在当前 Receipt 判定**之前**」逐字一致。**这一条我用变异实验实证了它是承重的**，见 §4。
12. **三个派生 ID 逐字复算 + 时间戳三点对齐**。`store/store.mjs:402-417`：`pause_id`/`fence_id`/`attention_id` 按 `sha256(protocol\nrun\nnode\nattempt\nreceipt\nreason)` 现算比对；`raised_at == fence.fenced_at == attention.raised_at` 与嵌套 ID 交叉校验一并强制。伪造反例在 `test/attempt-contract.test.mjs:124`。
13. **双向账本核对**。`assertPauseLedger`（`:52-71`）与 `assertResolutionLedger`（`:73-96`）两个方向都做：工件→事件（找不到同 canonical 的事件即 `pause-ledger-incomplete`）、事件→工件（解析 `detail`、过 schema、比对工件与 `node_id`/`attempt_id`/`at`/`reason`）。`openStore` 与 `readOpenAttentions` 都调。
14. **只读 Attention 投影确实只读**。`store/store.mjs:842-882` 不调 `recoverMutations`、不重写 `state.json`；遇未提交 prepared journal 抛 `recovery-required`；transaction_id 形态与文件名一致性都查。探针 M-003 的 C2 实测健康 Run 返回 `[]`、坏 Run 抛错，行为与代码一致。
15. **marker 校验有内容而不只是存在性**。`readCommittedMarker`（`:175-184`）校验 `protocol`/`transaction_id`/`state` 三项，篡改即 `marker-invalid`；`recoverMutations`（`:245`）另补 `MUTATION_ID_PATTERN` 形态校验。
16. **journal 目标路径不能逃出 Run root**。`:216-223` 的 `underRoot` 对 `blob` 与 `path` 双向 resolve 并拒 `..`/绝对路径/空。反例在 `test/attempt-contract.test.mjs:180` 一族。
17. **resolution 是单批原子提交**。`:535-548`：resolution 工件、新 Receipt 工件、两条事件、`state.json` 共 4 个 target 走**同一个** `commitMutation`；提交前先 `receipts.has(new receipt_id)` 拒重，失败路径在写盘前抛，不部分提交。
18. **retry 的双重复核到位**。`attempt-retry.mjs:28`（必须在 `manual_retry_profiles` 里）→ `:30-33`（当前 registry 可载且含该 profile）→ `:34-35`（重读非敏感 projection 四字段全等）；Store 侧 `assertResolutionSemantics`（`store.mjs:430-444`）再独立复核一遍，且强制新 `attempt_id`/`receipt_id` 都不得等于旧的。
19. **v2 method 参数闭集且 `read_model_version` 必填**。`relay.rpc.v2.schema.json` 五个 method 逐一 `if/then` 到 `relay.rpc-methods/v2` 的 `additionalProperties:false` 参数对象；`listRuns`/`inspectRun`/`subscribe` 的 `read_model_version` 都是 `required`——「v2 端点漏传版本静默按 v1 走」这条路被 schema 挡住。
20. **bootstrap 协商语义**。`rpc/bootstrap.mjs:14-26`：单次问答后 `close`，第二帧 `destroy`；请求 `oneOf` 通过后仍显式比对 `frame.protocol`（堵住「拿 descriptor 当请求」）；回包前对 descriptor 再校验一次。
21. **v1 backfill 不会漏出新 kind**。`service.mjs:619-621` 先扫 backfill，命中即在 `afterSend`（`:643-646`）走 `closeForAttention` 并**不发任何事件帧**；其余 backfill 改经 `subscription.emit`（`:647-650`）过同一道 v1 关闭闸，闸口已含 `fallback_pause_resolved`。`test/rpc-service.test.mjs:686-695` 有定向断言。
22. **v1 subscribe 的 Attention 判定在写队列内**。`store/store.mjs:651-657` 的 `subscribe(listener, { rejectOpenAttention })` 在 `enqueue` 内判 open Attention 并与 barrier 取尾 seq 处于同一临界区；`service.mjs:589-592` 有 actor 时走该路径，`attach()`（`:256-266`）换代时同样传该选项。TOCTOU 窗口确已消失。
23. **零敏感值**。我对整份未提交 diff 与全部新增（untracked）文件各跑了一次凭据形态扫描（`sk-…{16,}` / `eyJ…` / `Bearer …` / `(api_key|token|secret|password|cookie|authorization)="…"` / `C:/Users/`），**零命中**。7 份新增 golden fixture 全为 `RUN-1` / `aaaa…` 占位。
24. **契约闸全绿**（02:23 复跑）：`node tools/validate.mjs --selftest` = pass 57 / fail 0；`npm run audit` = 引用违规 0、结构 token 255 个未登记 0 陈旧 0、白名单↔OPEN-POINTS 不同步 0、条件收窄自验失败 0；`node tools/capability-baseline.mjs` = 19 份 digest 相符，`capability_hash = fb55f2f85d1db38c…`；`git diff --check` exit 0。
25. **定向回归终态**：`node --test --test-concurrency=1 test/{attempt-contract,profile-identity,profiles,contracts,rpc,rpc-service,agent-node,store}.test.mjs` → **tests 123 / pass 123 / fail 0，exit 0，110.1s**（02:12）。修复后复跑 `rpc-service + attempt-contract` → **tests 25 / pass 25 / fail 0，exit 0**（02:20）。
26. **我一开始怀疑、核对后确认不成立的**：① v2 `subscribe` 会不会漏掉「订阅后才出现 Attention」——不会，v2 本就该收到，v1 才关闭；② `retry_result` 的成功返回会不会因 `...record` 多带字段而违反 `additionalProperties:false`——不会，`{ok, idempotent, resolution, attempt_receipt}` 恰好四个键，我用 schema 探针（M-001A2）验过；③ `foldNode` 会不会因为 `fallback_pause_resolved` 不在任何转移集而把节点卡在 `waiting_human`——不会，同批的 `attempt_started` 排在其后，`state.mjs:9` 把它折成 `running`，`test/attempt-contract.test.mjs` 有断言。

---

## 4. 变异验证（本轮的实证环节）

按轮 2 职责登记一次真实变异，用来验证「关键强制点确实被测试钉住」而不是只有代码看起来对。

**选点**：`relay-core/store/store.mjs` 中 `appendResult` 的 `E_ATTEMPT_FENCED` 守卫。这是 brief 完成条件 2 的字面要求（「迟到写入返回 `E_ATTEMPT_FENCED`」）与 design/11 D2 的字面要求（「`appendCheckpoint` 与 `appendResult` 必须在当前 Receipt 判定**之前**检查该集合并以 `E_ATTEMPT_FENCED` 拒绝」）在代码里的唯一落点。

**全过程与哈希**

| 步骤 | 时刻 | 命令 / 动作 | 结果 |
|---|---|---|---|
| 0 | 02:02:34 | `cp store/store.mjs <scratchpad>/store.mjs.orig` | 逐字备份 |
| 1 | 02:08:20 | `sha256sum store/store.mjs` | **`19f2b088132d41441ae74689f5a600bcec6079917fa50dbf3550646e357a0ecb`** |
| 2 | 02:08:21 | 变异：删除第 588 行 `if (fencedAttempts.has(\`${result.attempt_id}\u0000${result.receipt_id}\`)) return { ok: false, reason: 'E_ATTEMPT_FENCED' };` | 变异后 SHA256 = `e38a102b5c1c27b2bf492966c67273e088a47acaccdf5fe99057e2884fbee0b2`；**删除 132 字节 = 该行长度，`diff -u` 只有一处 `-` 行，无其他差异**（用逐字节脚本改写，不用 `sed`——`sed -i` 会顺手把 LF 换成 CRLF，第一次尝试就是这样，已废弃重做） |
| 3 | 02:08:22 | `node --test --test-concurrency=1 test/attempt-contract.test.mjs` | **NODE_EXIT_CODE=1；tests 13 / pass 11 / fail 2 —— 红色终态** |
| 4 | 02:09:10 | `cp <scratchpad>/store.mjs.orig store/store.mjs` | 恢复 |
| 5 | 02:09:10 | `sha256sum store/store.mjs` | **`19f2b088132d41441ae74689f5a600bcec6079917fa50dbf3550646e357a0ecb`** —— 与步骤 1 **逐字相同** |
| 6 | 02:09:10 | `diff <scratchpad>/store.mjs.orig store/store.mjs` | 输出为空，exit 0 |
| 7 | 02:09:12 | 重跑同一命令 | **NODE_EXIT_CODE=0；tests 13 / pass 13 / fail 0 —— 绿色终态** |

**被杀死的两条断言（原文）**

```
✖ DHR_61 D2: opening a Store completes a prepared pause mutation before allowing writes
    actual:   { ok: true, idempotent: false }
    expected: { ok: false, reason: 'E_ATTEMPT_FENCED' }

✖ DHR_61 D2: a retry resolution atomically closes the pause and opens one fresh Attempt
    actual:   { ok: false, reason: 'late_result_quarantined' }
    expected: { ok: false, reason: 'E_ATTEMPT_FENCED' }
```

**读法**：第一条尤其有信息量——守卫一旦拿掉，被 fence 的旧 Attempt 的迟到 Result 不是「被降级隔离」，而是**直接 `ok:true` 落成终态**，把一个已经进入人工等待的节点写成 succeeded/failed。第二条说明即使身份链兜住了一部分（落到 quarantine），错误码也已经不是协议要求的那个。两条合起来证明：这个强制点是**承重**的，且现有测试对它的钉法能区分「拒绝」与「用别的理由拒绝」，不是只看 `ok===false` 的弱断言。

**纪律声明**：变异窗口内我只写了 `store/store.mjs` 一个文件，未改任何其他代码、未改测试、未改工件。窗口起止各做一次哈希比对，确认期间该文件未被并发改写（见 §1 —— 施工方在 02:00 和 02:19 两批改动都不含此文件）。恢复后除本报告外，本轮对仓库无任何永久写入。

---

## 5. 与 brief 完成条件的对照（只陈述事实，不做验收裁决）

| # | 完成条件 | 本轮观察到的事实 |
|---|---|---|
| 1 | Attempt Receipt 在开立/持久化/重放中保有同一 `executor_identity`；`launch-receipt/v2` 仍可读；零敏感值 | **成立**。§3 第 5/7/8/12/18 项为身份链，第 23 项为脱敏，均本轮独立复核。轮 1 的 P2-6（source profile 未强制冻结）已在 `workflow-driver.mjs:97-99` 闭合。残留只有 registry schema 的 `required` 仍不含 `config_fingerprint_rule`（强制点在开 Attempt 而非注册），级别 P3，轮 1 已登记。 |
| 2 | 单条 canonical pause 原子重放 fence / `waiting_human` / Attention；重复、冲突、损坏、截断、journal 强杀均 fail-closed；迟到写入 `E_ATTEMPT_FENCED`；v1 不静默丢失 Attention | **主干成立，两处未成立**。幂等/冲突/派生 ID/路径逃逸/双向账本/终态守卫/raw 入口全部 fail-closed 且有反例；`E_ATTEMPT_FENCED` 经 §4 变异实证承重。**未成立的**：① journal 强杀之后，**该 Run 的失效被放大成整张 `listRuns` 失效**，且失效形态是断连而非协议码（P1-2 / P1-3）——A3 要求的是「只在恢复补全后才开放**该 Run**」；② `commitMutation` 失败且进程存活时该 Run 变为不可恢复（P2-1）。 |
| 3 | v2 `retry-with-profile` 仅接受冻结且仍匹配的 profile；同键幂等；关闭 pause / 快照不匹配 / 部分失败均有定向反例；旧 Attempt 始终 fenced | **本轮期间从不成立变为成立**。冻结校验、同键幂等、快照不匹配、原子性均有定向反例（§3 第 17/18 项）。「关闭 pause + 新键」这一条在 02:19 前是**静默断连、无任何反例**（P1-1），02:19 后施工方补了实现与 RPC 级断言，我已复验 25/25 通过。 |

---

## 6. 反例覆盖缺口（供后续轮次/整改参考，不代主控排期）

本轮在测试面找不到对应用例的场景：

1. **service 级**：一个坏 Run（prepared journal 未 committed）+ 一个好 Run，走 `listRuns`（v1 与 v2 各一次）——P1-2 的直接反例。现有恢复用例全部是单 Run、Store 层的。
2. **service 级**：`E_STORE_MUTATION_RECOVERY_FAILED` 必须以合法 RPC error 帧到达客户端，而不是断连——P1-3 的直接反例。可与第 1 条合并成一个用例。
3. **Store 级**：`commitMutation` 注入失败后，同一句柄继续写，再重开——P2-1 的直接反例（可用可注入的 `writeAtomicText` seam，或直接钉「失败后句柄必须拒绝后续写」这一行为）。
4. **registry**：文件不存在 / 不可读 与 profile 缺 `config_fingerprint_rule` 必须产出**不同**的错误码——P2-2 与 design D3「两个独立负例」的直接反例。
5. **resolution 的各 journal 阶段强杀**：design D2 要求「任一 journal 阶段强杀」，现有只覆盖 pause 的一个切点（`test/attempt-contract.test.mjs:152`）；resolution 的 blob 已写 / journal 已写 / 目标部分写 / marker 未写四个阶段各自未覆盖。轮 1 已列，仍缺。
6. **DHR_34 交接项**：`appendFallbackPause` 的 `{ok:false}` 分支在接入 RPC 时必须转成 throw（同 P1-1 的修法），目前无生产调用方故无用例。

---

## 7. 声明与附录口径

- 本轮为只读复核 + 一次受控变异。除 `docs/modules/dh-relay/workspace/DHR_61/review-code2-opus.md`（本文件）外，对本仓库无任何永久写入；`store/store.mjs` 的临时变异已按 §4 逐字节恢复并双向验证。
- 未派活、未提交、未询问用户、未读写用户级 registry（`~/.dh-relay/executor-profiles.json`）或任何真实 profile 配置文件。
- 全部探针（M-001~M-004）为独立脚本，运行于会话 scratchpad 与系统临时目录（`mkdtemp`），运行结束即清理；它们只 `import` 生产模块，不改动生产模块。探针涉及的所有 Run Store、registry、socket 端点均为一次性临时对象。
- §1 的哈希快照（02:05:03，55 个文件）与 02:19、02:23 两次漂移复查记录留在会话 scratchpad；报告正文已把关键哈希与时刻内联，不依赖外部文件。
- 本节只陈述事实与级别，**不代主控做验收裁决，不勾任何人类签名区**。§2.0 中「已修复、我已复验」是对机器证据的陈述，不等于我替主控关闭该项。

## 8. 本轮裁决（级别陈述，非验收）

- **P0：0 项。**
- **P1：2 项** —— P1-2（一个 Run 的未恢复 mutation 让 `listRuns` 对所有客户端失效）、P1-3（`E_STORE_MUTATION_RECOVERY_FAILED` 作为登记在册的协议码全链降级为静默断连）。二者根因不同、修法不同，但同一个反例可同时钉住。另有 P1-1 在本轮审查期间由施工方修复并已复验通过，按事实分开登记。
- **P2：2 项** —— P2-1（`commitMutation` 失败后句柄与盘面分叉，Run 变为不可恢复）、P2-2（registry unavailable 与 fallback unavailable 未分离）。
- **P3：9 项**，其中 4 项（P3-2 as-built 指纹、P3-4 journal 不回收、P3-5 无生产者的 subscription-terminal、P3-6 bootstrap 无 owner 闸）是轮 1 已登记且仍 OPEN，1 项（P3-7）是 design 文本自身的不可满足条款，建议转一致性路。
- **机器终态**：契约闸四项全绿；定向回归 123/123（8 个文件）+ 修复后 25/25，均有汇总与 exit 0。**本轮未跑 `npm test` 全量**——理由如实说：工作树在审查期间被并发改写三次（§1），全量跑一次约 2 分钟，跑出来的数字对应的是哪一版字节无法确定，写进报告会是一个不可复现的数。全量终态以主控在冻结点上的现场为准。
- **流程层面**：§1 的并发改写是本轮最需要主控处置的事项——它使「fresh 代码轮 2 对冻结 diff 复核」这一配方前提未能成立。

---

# 9. 整改复验（代码轮 2 · 同一 reviewer · 只读）

> 日期 2026-08-30 02:33–02:59。**范围严格限定为本报告 §2.1 / §2.2 / §2.3 三项（P1-2、P1-3、P2-1）的当前修复状态**，按主控指示不扩展任何新审查面。仍只读：未改生产代码、未派活、未提交、未询问用户；本文件仍是本轮唯一永久写入。
> 模型证据同 §0，未变（`claude --model opus` / 状态栏 `Opus 5` 由主控声明；系统上下文 `claude-opus-5` 与 SessionStart hook `claude-fable-5[1m]` 的不一致仍未消解，仍交主控裁决）。

## 9.1 复验时的状态钉子

我复验所依据的两个文件在 02:33（跑探针）与 02:59（收尾）两次测量之间**哈希未变**，结论因此可靠：

| 文件 | SHA256（02:33 == 02:59） |
|---|---|
| `relay-core/store/store.mjs` | `5c5472d2bdb72798eea1da0ae48e70c3d64cb56270383c18d45fb39862a7148c` |
| `relay-core/runtime/service.mjs` | `8fd96de8feef9826c23c3f15cc969bcfa81c05055cfcaa677984df84213da8ff` |
| `relay-core/runtime/discovery.mjs` | `b47569ae546803d8053757e914b341cf228220f9cde33e3cd02b5b6f19d418be`（**与基线 `5999326` 相同，本卡从未改过它**） |

工作树整体仍在变（`git diff --stat 5999326`：02:23 = 34 文件 / 1254 增 → 02:33 = 35 / 1288 → 02:59 = 38 / 1344），但漂移不在上述两个被复验文件上。§1 关于「轮 2 前提未成立」的记录继续有效。

## 9.2 逐项裁决

| 项 | 原级别 | 裁决 | 证据 |
|---|---|---|---|
| **P1-3** Attention 读异常降级为静默断连 | P1 | **CLOSED** | `runtime/service.mjs:334-340`（`assertV1AttentionCompatible`）与 `:351-357`（`attentionsFor`）各加 `try/catch { throw withReason(error) }`，把 Store 直抛的裸 `Error` 认领成协议码。`withReason`（`:70-75`）按第一个 `:` 截断并过 `^E_[A-Z0-9_]{2,62}$`。实测 M-003 三条路径全部由 `CONNECTION DROPPED (no frame)` 变为合法 error 帧：`{"reason":"E_STORE_MUTATION_RECOVERY_FAILED","receipt":null,"detail":"E_STORE_MUTATION_RECOVERY_FAILED:recovery-required"}`（v1 listRuns / v2 listRuns / v2 inspectRun 坏 Run 各一次）。 |
| **P1-2** 一个坏 Run 让 `listRuns` 对所有客户端失效 | P1 | **降级为 P3 残留**（影响面按主控裁决保留，不再够 P1） | 主控已明示取舍：`listRuns` **不筛坏 Run**，改为返回稳定 `E_STORE_MUTATION_RECOVERY_FAILED`。这是 design §4「绝不筛掉项目」与 D2「该 Run 一律拒绝」两条在本场景下相互拉扯时的一次归口，属主控职权，我不复议。我原判 P1 的分量有一半来自「且无法诊断」——那一半已随 P1-3 消失。**实测影响面确实仍在**：M-003 的 C3/C4 显示一个坏 Run 仍使 v1 与 v2 的整张列表返回错误（C5 证明逐 Run 的 `inspectRun(healthy)` 不受影响，`open_attentions=[]` 正常）。**残留（P3）**：错误 `detail` 只有 `E_STORE_MUTATION_RECOVERY_FAILED:recovery-required`，**不含出问题的 `run_id`**；对照同文件 `serviceError('E_ATTENTION_REQUIRES_READ_MODEL_V2', runId)` 是带 runId 的。运维拿到码但不知道该去恢复哪个 Run，而列表恰恰又列不出来。建议把 runId 接进 detail。 |
| **P2-1** `commitMutation` 失败后句柄与盘面分叉、Run 不可恢复 | P2 | **CLOSED** | `store/store.mjs:283` 新增 `mutationRecoveryRequired`；`:301-308` 的 `commitStoreMutation` 捕获失败即置位后重抛；`:294-299` 的 `guardedJob` 在 `writeGuard` **之前**检查该位，命中即 `E_STORE_MUTATION_RECOVERY_FAILED:reopen-required`，且 `runWrite` 是所有写入口的唯一通道。两条 mutation 路径（`:502` pause、`:545` resolution）都改走 `commitStoreMutation`，无遗漏。 |

## 9.3 P2-1 的实证（探针 M-005，02:36）

原报告的 M-004 是**模拟事后现场**（外部删 marker），不是我提的机理。本次改为**真实诱发** `commitMutation` 失败，覆盖失败发生在 `events.jsonl` 推进前后的两种时点：

```
CASE A  early failure（在 pauses/<id>.json 位置放一个目录，读 before_hash 即 EISDIR）
  A1 appendFallbackPause      -> THROWS EISDIR: illegal operation on a directory, read
  A2 events.jsonl lines        -> 1 -> 1          （事件账未推进）
  A3 next write on same handle -> THROWS E_STORE_MUTATION_RECOVERY_FAILED:reopen-required
  A4 reopen                    -> ok:{"events":1}

CASE B  late failure（state.json 置只读，最后一个 target 的 rename 失败）
  B1 appendFallbackPause      -> THROWS EPERM: operation not permitted, rename ...
  B2 events.jsonl lines        -> 1 -> 2          （事件账已推进 —— 正是原 P2-1 的分叉窗口）
  B3 next write on same handle -> THROWS E_STORE_MUTATION_RECOVERY_FAILED:reopen-required
  B4 reopen after unlocking    -> ok:{"events":2,"attentions":1}
```

**Case B 是决定性的一条**：事件账已经多了一行、事务却没有 committed marker——这正是我在 §2.3 描述的分叉窗口。修复前，B3 会成功并写入一个重号 seq，B4 必然 `target-conflict`、该 Run 永久打不开；现在 B3 被句柄挡住，B4 重开后 journal 恢复补全，**events=2 且 attentions=1——那条 pause 作为已提交事实存活下来，既没丢也没把 Run 锁死**。design/11 D2「逐目标补全至 committed」的语义现在真正成立。

**一条有界观察（不是新发现，登记以免被误读为已覆盖）**：M-004 的外部篡改变体（marker 被外部删除、无失败提交因而不置位）重跑仍为 `target-conflict`。该场景不是我在 §2.3 提出的机理（I/O 失败 + 句柄存活），也不在本次复验范围内，不另立条目。

## 9.4 复验期间的机器证据

| ID | 命令 / 探针 | 结果 |
|----|------------|------|
| R2-001 | 探针 M-003（一好一坏两个 Run，走真实 service 的 v1/v2 端点） | 三条路径全部返回合法 error 帧，不再断连；`inspectRun(healthy)` 正常 |
| R2-002 | 探针 M-005（诱发真实 commitMutation 失败，早/晚两个时点） | 两例均 `reopen-required` 挡住后续写，重开均恢复成功 |
| R2-003 | `node tools/validate.mjs --selftest` | **pass 57 / fail 0** |
| R2-004 | `npm run audit` | 引用违规 0；结构 token 255 个，未登记 0，陈旧 0；白名单↔OPEN-POINTS 不同步 0 |
| R2-005 | `node tools/capability-baseline.mjs` | 19 份 digest 相符，`capability_hash = fb55f2f85d1db38c…` |
| R2-006 | `git diff --check` | exit 0 |

**我没有取得的证据，如实说**：本轮启动的 8 文件窄测回归（`store` / `attempt-contract` / `rpc` / `rpc-service` / `agent-node` / `profiles` / `profile-identity` / `contracts`）在跑到终态之前被中止，**没有汇总也没有 exit code，因此本节不引用任何窄测数字**。按主控指示，全量与窄测终态以主控在冻结点的现场为准。上表 R2-003~R2-006 四项契约闸是本轮实跑取得的完整终态。

## 9.5 反例覆盖：三项修复均无定向测试

本次复验对 `test/` 全目录 grep `reopen-required` 与 `E_STORE_MUTATION_RECOVERY_FAILED`，只命中两条**既有**用例（`test/attempt-contract.test.mjs:172` 的 `pause-ledger-incomplete`、`:187` 的 `path-escape`），**与本次三项修复无关**。

也就是说：P1-2 的稳定错误码、P1-3 的 `withReason` 认领、P2-1 的句柄 poison —— **三项都是无定向反例落地的**。它们目前只由我这一轮的探针证明，仓内没有任何东西阻止它们被下一次改动悄悄改回去（P1-1 已经演示过一次「轮 1 的整改引入回归」是怎么发生的）。

对应 §6 反例覆盖缺口的第 1、2、3 条**原样保留、未被填补**，并按本次实测把第 3 条的措辞收紧为：应钉「`commitMutation` 失败后同句柄的后续写必须抛 `reopen-required`，且重开后事务可补全」，Case B 的形态（失败发生在 `events.jsonl` 已推进之后）是必须覆盖的那一支。

## 9.6 最终数

以本报告 §2 的全部条目为口径，复验后：

- **P0：0 项。**
- **P1：0 项。** 三条 P1 全部不再成立——P1-1（retry 冲突静默断连）已于 02:19 修复并复验；P1-3（Attention 读异常降级断连）本次 CLOSED；P1-2 按主控对影响面的裁决降为 P3 残留（错误码不含 `run_id`）。
- **P2：1 项 OPEN** —— P2-2（`registry unavailable` 与 `fallback unavailable` 未分离，`attempt-retry.mjs:49-51` + `profile-registry.mjs:19`）。本次未在复验范围内，状态照登。P2-1 CLOSED。
- **P3：11 项** —— §2.5 原 9 项（其中 P3-2 as-built 指纹、P3-4 journal 不回收、P3-5 无生产者的 subscription-terminal、P3-6 bootstrap 无 owner 闸为轮 1 即登记且仍 OPEN；P3-7 为 design 文本自身不可满足条款，建议转一致性路），加本次两项：**P3-10** = P1-2 降级后的残留（坏 Run 的错误 detail 不含 `run_id`）、**P3-11** = 三项修复无定向反例（§9.5）。

**仍需主控处置的两件事**（只陈述，不代判）：① §9.5 的测试缺口；② §1 记录的并发改写——本报告从头到尾是对一棵仍在被写的树做的复核，包括本节。

## 9.7 声明

- 本节为纯只读复验，**未做任何变异**，未改生产代码、未派活、未提交、未询问用户。§4 的变异实验属上一轮，其恢复已在当时双向验证。
- 探针 M-003 / M-004 / M-005 均为独立脚本，运行于会话 scratchpad 与系统临时目录（`mkdtemp`），只 `import` 生产模块、不改动它们；涉及的 Run Store、socket 端点全部为一次性临时对象，运行结束即清理。M-005 对临时目录内的 `state.json` 做过 `chmod` 只读并在同一次运行内还原，未触及本仓任何文件。
- 本轮对仓库的唯一永久写入是本文件的 §9。
- 本节只陈述事实与级别，**不代主控做验收裁决，不勾任何人类签名区**。

---

## 9.8 末注：新增定向反例核对（只读，2026-08-30 03:06）

主控补齐了 §9.5 指出的缺口。我只读核对了两条新增用例，**未重跑全量**；核对时 `store/store.mjs` = `5c5472d2…`、`runtime/service.mjs` = `8fd96de8…`，与我 §9.2 做出裁决时**逐字相同**，因此这两条用例钉的正是我复验过的那份实现。

**① `test/attempt-contract.test.mjs:301-312`** —「a failed mutation poisons the live handle until reopen completes recovery」

准确。它走的是**真实机理**而非模拟事后现场：`chmod(state.json, 0o444)` → `appendFallbackPause` 以 `EPERM|EACCES` 失败（对应我 M-005 的 Case B，失败发生在 `events.jsonl` 已推进之后）→ 同句柄 `appendCheckpoint` 断言 `/E_STORE_MUTATION_RECOVERY_FAILED:reopen-required/` → 解锁后 `openStore` 断言 `openAttentions().length === 1`，断言消息写着「must finish the prepared pause rather than lose or duplicate it」。三个断言与我 B1/B3/B4 的观察一一对应。杀伤力我按代码推演过：poison 一旦移除，第二步会以 `EPERM` 而非 `reopen-required` 拒绝（正则不匹配 → `assert.rejects` 失败），第三步的重开也会撞 `target-conflict`，两道都拦得住。

**一条如实登记的边界**：该用例带 `{ skip: process.platform !== 'win32' }`。这个 skip 是**正确**的——POSIX 的 `rename` 只看父目录权限、不看目标文件权限，`chmod 0444` 在那里诱发不出失败。但后果是：**非 Windows 平台上这条回归保护不生效**。本卡现役开发与验收都在 win32，不阻塞；若将来接 Linux CI，需要换一种可移植的失败注入（例如把 `writeAtomicText` 做成可注入 seam）。

**② `test/rpc-service.test.mjs:702-741`** —「坏 Run 让列表稳定 fail-closed，但连接仍可读取健康 Run」

准确。一好一坏两个 Run，坏 Run 的损伤是往其 `mutations/` 直接写一份合法形态、无 `.committed` marker 的 `<uuid>.prepared.json`——这确实命中 `store/store.mjs:869-870` 的 `recovery-required` 分支，与我 M-003 用「真实 pause + 删 marker」触达的是同一条路径。四个断言覆盖到位：v1 `listRuns` 与 v2 `listRuns` 各断言 `error.data.reason === 'E_STORE_MUTATION_RECOVERY_FAILED'`；**并且在同一条连接上**紧接着断言 `inspectRun(healthy)` 返回正确 `run_id`，断言消息逐字写着「must not drop the connection or poison healthy per-Run reads」——这正是 P1-3 的核心命题（不是断连）与 P1-2 降级后必须守住的底线（逐 Run 读不受牵连）。杀伤力：`withReason` 一旦被移回去，连接会被 destroy，`connect()` 助手的 `until(...)` 会超时抛错，用例失败。

该用例用的是合成 journal 而非真实中断的事务，因此它钉的是**错误形态**（这也正是它该钉的）；**恢复语义**由 ① 钉住。两条互补，之间没有缝。

**主控提供的执行结果（非我本轮实跑，如实标注来源）**：poison 用例随 `attempt-contract` 通过；坏 Run 新用例 1/1、exit 0。

### 裁决更新

- **P3-11（三项修复无定向反例）：CLOSED。** P2-1 由 ① 钉住，P1-3 与 P1-2 降级后的底线由 ② 钉住，三项修复现均有定向反例。§6 反例覆盖缺口的第 1、2、3 条相应关闭。
- **P3-10 仍 OPEN**：坏 Run 的错误 `detail` 不含 `run_id`。② 只断言 `.reason`、不约束 `detail`，所以补 runId 不会与该用例冲突。
- 新登记 **P3-12（P3 级，低）**：① 的回归保护仅在 win32 生效，见上文边界说明。

### 最终数（本报告全部条目口径）

- **P0：0 项。**
- **P1：0 项。**（P1-1 于 02:19 修复并复验；P1-3 于 §9.2 CLOSED；P1-2 按主控裁决降为 P3 残留）
- **P2：1 项 OPEN** —— P2-2（`registry unavailable` 与 `fallback unavailable` 未分离），始终不在复验范围内，状态照登。
- **P3：11 项** —— §2.5 原 9 项 + P3-10（错误 detail 缺 run_id）+ P3-12（poison 用例仅 win32）；P3-11 已关闭。

仍需主控处置的只剩一件：§1 记录的**并发改写**——本报告自始至终是对一棵仍在被写的树做的复核。本节亦为只读，未改生产代码、未派活、未提交；对本仓的唯一永久写入仍是本文件。

---

## 9.9 末注二：pending lock EPERM 最小补丁与两条 DHR61 回归测试（只读，2026-08-30 03:13）

按主控指示只读核对，未跑全量。核对时 `relay-core/cli/pending.mjs` = `06153469205cdc21753fd1d9addfc1e2e10e52e276d903ce863a6a3ec19699e9`。

### ① 补丁本体：`cli/pending.mjs:153-156`（净 +4 / -1，全部落在 `wx` 的 catch 内）

```js
-        if (error?.code !== 'EEXIST') throw error;
+        const windowsCreateRace = process.platform === 'win32'
+          && (error?.code === 'EPERM' || error?.code === 'EACCES');
+        if (error?.code !== 'EEXIST' && !windowsCreateRace) throw error;
+        if (windowsCreateRace && attempt >= LOCK_RETRY_MAX - 1) throw error;
```

主控描述的三条性质我逐条核对，**全部属实**：

1. **有界**：复用既有的 `LOCK_RETRY_MAX = 100` × `LOCK_RETRY_MS = 50`（`cli/pending.mjs:33-34`），上限约 5s，与 EEXIST 退避同一把尺，没有引入新的循环或新的上限。
2. **耗尽仍抛原错误**：新增的第二个 `if` 抛的是 `error` 本身，**不是** `lockBusy(...)`。这一点是对的且重要——一个持续 5s 的 EPERM 不是争用而是真实权限/ACL 问题，把它包装成 `E_PENDING_LOCK_BUSY`（其文案写着「稍后重试」）会把一个永远重试不好的故障说成暂时性故障。保留原始 `code` 才可诊断。
3. **锁 ownership / unlink 语义未改**：`token = randomUUID()` 的生成、`stillOwner` seam、`finally` 里 `if (await lockOwnedBy(lockPath, token)) await unlink(...)` 这道「不是自己的锁绝不删」的守卫（R-D-01 根因所在）、外圈 `round` 的 `E_PENDING_LOCK_LOST` 整段重试，**一个字都没动**。diff 确实只有那一处 catch。

另外两点我自己核对的：

- **不会把「锁被真正持有」误判成竞争**：Windows 上 `open(...,'wx')` 撞到已存在的文件返回的是 `EEXIST`，仍走原路径 (C)，照旧产出带 holder pid/时间与「先停光本机 CLI 再复核锁面才可手工删锁」的 `lockBusy` 诊断。EPERM/EACCES 在这里的典型来源是 DELETE_PENDING——上一个持有者的 unlink 尚未落地，正是这次要治的释放竞争。
- **重试成功不构成越权**：竞争解除后 `wx` 创建成功即意味着锁确实空闲，且 token 是本次新生成的，释放时仍按 token 校验。没有绕过任何所有权判定。
- **非 win32 行为逐字不变**：`windowsCreateRace` 恒为 false，第一个 `if` 退化成原来的 `error?.code !== 'EEXIST'`。

**判定：补丁正确、最小、与 DHR_61 契约面零交集**（`cli/pending.mjs` 管的是 CLI 的 `pending-operations.lock`，与 `store/store.mjs` 的 mutation journal 是两套互不相干的机制）。`store/store.mjs` = `5c5472d2…`、`runtime/service.mjs` = `8fd96de8…` 与我 §9.2/§9.8 做裁决时逐字相同，本补丁未触及它们。

### ② 两条 DHR61 回归测试

`test/attempt-contract.test.mjs` = `6e51dfcd…`、`test/rpc-service.test.mjs` = `791e5d38…`，与我 §9.8 核对时**逐字相同**，即主控所指的正是我已核对过的那两条（poison 用例、坏 Run 列表用例）。结论沿用 §9.8，不重复展开，也无需重读。

### ③ 如实登记的两点

- **该补丁没有配确定性回归测试**：`git diff --stat 5999326 -- test/cli.test.mjs cli/pending.mjs` 只有 `cli/pending.mjs` 一项，`test/cli.test.mjs` 未动。它是靠原失败用例（并发双 CLI mutating，即我在 §1 记录、轮 1 V-020 也撞到过的那个抖动点）**连续 3 次通过**来验证的。对一个 Windows DELETE_PENDING 时序竞争来说，写确定性反例确实很难（要能注入 `wx` 的 EPERM），3 次重复是合理的替代证据——但它证明的是「不再抖」，不是「不会再抖」。登记为 **P3-14**。
- **真实权限故障的暴露延迟**：非竞争性的 EPERM/EACCES（例如 ACL 拒绝、目录被占）现在要退避满 100 次约 5s 才抛出，此前是立即抛。有界、只影响 win32、且换来了闸门稳定，是划算的取舍；登记为 **P3-13** 备查，不建议改。

**收口提示（非缺陷，供主控在收口时定夺）**：`cli/**` 不在 brief「In scope」枚举的 `contracts/** / store/** / rpc/** / profiles/** / 必要的 Runtime Receipt 签发接点 / 定向测试与本工作区」之内。这一改动是为让全量闸门稳定绿而做的必要修复，动机正当、面积最小（4 行），但它确实让一张契约卡的 diff 面多了一个文件。是按「闸门修复」并入本卡，还是单独记一笔，属主控职权，我不代判。

### 最终数（本报告全部条目口径）

- **本次核对新增 P0：0 项；新增 P1：0 项。**
- **P0：0 项。P1：0 项。**（P1-1 已修并复验；P1-3 §9.2 CLOSED；P1-2 按主控裁决降为 P3 残留）
- **P2：1 项 OPEN** —— P2-2（`registry unavailable` 与 `fallback unavailable` 未分离），始终不在复验范围，状态照登。
- **P3：13 项** —— §2.5 原 9 项 + P3-10（坏 Run 错误 detail 缺 `run_id`）+ P3-12（poison 用例仅 win32）+ P3-13（真实权限故障延迟约 5s 暴露）+ P3-14（lock 竞争修复无确定性反例）；P3-11 已于 §9.8 关闭。

本节为纯只读核对，未跑测试、未改生产代码、未派活、未提交；对本仓的唯一永久写入仍是本文件。§1 记录的并发改写现象贯穿本报告全部章节，仍是唯一需要主控在流程层处置的事项。
