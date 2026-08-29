<!-- dh:v1 -->
# review-consistency-opus — DHR_61 一致性复核（heavy Review Batch · fresh · 只读）

## 0. 抬头与模型证据

| 项 | 值 |
|---|---|
| 卡 | DHR_61 · Attempt 身份与暂停重试契约 |
| 复核路径 | heavy 配方 · **一致性轮**（fresh reviewer，非施工者、非主控） |
| 审查对象 | 工作树 `D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_61` 的**未提交 diff**，基线 `5999326`（32 改 + 26 新增，1176 增 / 86 删） |
| 关注面 | 设计↔schema↔实现↔测试↔as-built↔v1 冻结面的**逐字一致**；capability hash 双轨、RPC bootstrap/v2、Attention、journal、profile 容量、旧 launch-receipt 可读 |
| 模式 | 只读。未改任何生产代码、未派活、未提交、未询问用户；本文件是本轮唯一写入 |
| 日期 | 2026-08-30 |

**模型证据（如实记录，含不一致项）**

1. 派活指令声明：本轮为 **fresh Opus** 一致性 reviewer。
2. 本 session 自身可见的两条互斥证据：
   - 系统上下文写明 `You are powered by the model named Opus 5. The exact model ID is claude-opus-5`；
   - **SessionStart hook 注入的文本为 `当前模型：claude-fable-5[1m]`**。
3. 结论：与代码轮 1（`review-code1-opus.md` §0 第 3 项）**观察到完全相同的内部不一致**，且本轮同样无法在 session 内自证哪一条为准。此项**交主控裁决**，本轮不代为判定，也不据此弱化或强化任何结论。
4. 本轮未执行 `claude --model` 之类的启动命令核验（worker 不得越位拉终端），状态栏值以主控现场为准。

## 1. 方法与本轮取得的终态证据

- 读取：仓根 `AGENTS.md`；`workspace/DHR_61/{brief,task_plan,progress,findings,review-code1-opus}.md`；`design/11-P6身份与额度治理契约调整.md`；`as-built/relay-core.md`；`contracts/{OPEN-POINTS,reason-codes,CANONICALIZATION,compat-matrix}.md`；`capability-baseline.json` 与 `tools/capability-baseline.mjs`；全部 9 份新增 schema + `relay.event.v2` / `executor-profile.schema.json` 的 diff；`store/store.mjs`、`runtime/{service,workflow-driver,endpoint,attempt-retry}.mjs`、`rpc/{server,capabilities,bootstrap}.mjs`、`profiles/{identity,validate-profiles}.mjs`；`fixtures/manifest.json` 与全部新增 fixture；`tools/{validate,audit-contracts,structural-tokens}`。
- 只读手段：① 跑四道契约闸与定向测试；② 在 scratchpad 用**只读 schema 探针**（只 `loadAjv`/`ajv.compile`，不建 Store、不起 service、不读用户级 registry、不读任何 profile 配置）。

| ID | 命令 / 探针 | 结果 |
|----|------------|------|
| K-001 | `node tools/validate.mjs --selftest` | **pass 57 / fail 0，exit 0** |
| K-002 | `npm run audit` | 未登记开口 0；`$ref` 实解析 222 条失败 0；结构 token 260 个，未登记 0、陈旧 0；白名单↔OPEN-POINTS 不同步 0，exit 0 |
| K-003 | `node tools/capability-baseline.mjs` | 19 份（18 顶层 + 1 共享）digest 相符，`capability_hash = fb55f2f85d1db38c…`，exit 0 |
| K-004 | `git diff --check` | exit 0，干净 |
| K-005 | `node --test --test-concurrency=1 test/{attempt-contract,profile-identity,profiles}.test.mjs` | **pass 31 / fail 0，exit 0** |
| K-006 | `git show 5999326:relay-core/capability-baseline.json` vs `rpc/capabilities.mjs:20` | 均为 `994d5f038cd1bcbbb9463eed5ca04b2ffc324f07b374571899b8df3a6c5c971e` —— v1 握手指纹**逐字冻结成立** |
| K-007 | 探针：`{jsonrpc:"2.0",id:1,result:{ok:false,reason:"E_FALLBACK_PAUSE_CONFLICT"}}` 对 `relay.rpc/v2` 校验 | **不通过**：`data/result must match exactly one schema in oneOf`、`data/result/ok must be equal to constant`（见 P1-2） |
| K-008 | 探针：`fixtures/golden/fallback-pause.v1.json` 的 `attention` 对象 → `v0-shapes/relay.attention/v1` | **不通过**：缺 `category`/`reason`/`message`，且四个字段被判 additionalProperties（见 P1-1） |
| K-009 | 探针：v0 形状的合法 attention 样本 → `relay.fallback-pause/v1#/$defs/attention` | **不通过**：缺 `attempt_id`/`receipt_id`/`reason_code`/`state`，`attention_id` 不合 `^[0-9a-f]{64}$`（见 P1-1） |

> 全量 `npm test` 本轮未自行复跑（代码轮 1 已有 R-003 228/228 与复验 233 的记录，重复跑不增加一致性面的判别力）。本轮所有结论均不依赖全量回归。

---

## 2. 结论清单（P0 → P3）

### P0：0 项

一致性面未发现 P0。代码轮 1 的 P0-1（journal 无条件重放）本轮复核代码位点确认已闭合：`store/store.mjs:246` 的 `if (await readCommittedMarker(...)) continue;` 与 `store.mjs:175-184` 的 marker 校验成立。

---

### P1-1 · `relay.attention/v1` 在同一仓内有**两套互斥定义**，且 v0 形状的"P7 才承重"元数据已被本卡打破

- 位置：
  - `relay-core/contracts/v0-shapes/relay.attention.v1.shape.json:3-38`（`x-freeze-status: v0-shape-only`、`x-first-load-bearing: "P7（首次承重时冻结）"`；required = `protocol/attention_id/run_id/raised_at/category/reason/message`，`attention_id` 为 `identifier`，`additionalProperties:false`）
  - `relay-core/contracts/relay.fallback-pause.v1.schema.json:41-56`（同一 `protocol` 常量 `relay.attention/v1`；required = `protocol/attention_id/run_id/node_id/attempt_id/receipt_id/reason_code/state/raised_at`，`attention_id` 为 `sha256`，`additionalProperties:false`）
  - 消费面：`relay-core/contracts/relay.client-read-model.v2.schema.json:18` 与 `:38` 的 `open_attentions` 直接 `$ref` 到 `relay.fallback-pause/v1#/$defs/attention`
- 实测（K-008 / K-009）：**两个方向都不通过**。DHR_61 的 attention 对象被 v0 形状拒（缺 `category`/`reason`/`message`，另四字段判为多余）；v0 形状的合法样本被 DHR_61 内联定义拒（缺 `attempt_id`/`receipt_id`/`reason_code`/`state`，`attention_id` 形态不合）。两者**没有任何交集**。
- 一致性后果：
  1. 线上 v2 `open_attentions[]` 里的对象自称 `relay.attention/v1`，但按仓内那份同名 shape 校验必然失败。任何第三方实现按 `contracts/v0-shapes/` 编译 Attention 解析器，收到本 Runtime 的 Attention 会 100% 拒收。
  2. `x-first-load-bearing` 写的是 "P7 首次承重时冻结"，而本卡已让它**持久化、可重放、并进入 v2 Read Model**——它现在就在承重，元数据是假的。
  3. design/11 D2 逐字规定了 DHR_61 这一套字段（`{attention_id, run_id, node_id, attempt_id, receipt_id, reason_code, state:"open", raised_at}`），**设计本身就与仓内既存 v0 形状冲突**；本卡既没有更新/冻结 v0 形状，也没有在 `OPEN-POINTS.md` 登记这次改型，属于设计↔既有冻结面的对账被静默跳过。
- 对照 design：§5 止损「不能只记录 fence/Attention 文本：缺少所列协议字段……时一律未满足」；`compat-matrix.md:82` 仍写「`relay.attention/v1`（v0 形状，P7 冻结）」。
- 为什么四道闸抓不到：`v0-shapes/` 不计入 capability manifest（`tools/capability-baseline.mjs:69-70` 明写 v0 不计入），`audit-contracts.mjs` 只做节点级结构扫描，不做"同名协议是否唯一定义"的检查。

### P1-2 · `retry-with-profile` 的冲突返回值**装不进 `relay.rpc/v2`**，design 要求的"返回冲突"实际表现为静默断连

- 位置：`relay-core/store/store.mjs:497-502`（两处 `return { ok:false, reason:'E_FALLBACK_PAUSE_CONFLICT' }`）→ `relay-core/runtime/attempt-retry.mjs:53`（原样 `return`）→ `relay-core/runtime/service.mjs:739-744`（v2 handler 直接返回该值；`catch` 只处理 `throw`）→ `relay-core/contracts/relay.rpc-methods.v2.schema.json:60-70`（`retry_result` 的 `ok` 是 `const true`，required 含 `idempotent/resolution/attempt_receipt`，`additionalProperties:false`）
- 实测（K-007）：该帧对 `relay.rpc/v2` 校验失败（`result` 匹配不上 `oneOf` 四个分支中的任何一个）。
- 运行期链路：v2 端点 `formal:true`（`service.mjs:767-769`）→ `rpc/server.mjs:181` 的 `encodeValidatedFrame` 抛 `invalid frame` → `:191-194` 的 `sendResponse` catch → `dropConnection(conn)` → `conn.destroy()`。**客户端拿不到任何 error 帧、任何 reason，只看到 socket 被销毁。**
- 违反：
  - design/11 D2 §5 逐字「不同键重试已关闭 pause **返回冲突**」——现状是不返回任何东西。
  - 仓内既有明写的反面教材：`rpc/server.mjs:276` 「断连会把一次可纠正的客户端错误升级成不可诊断的失联」；`server.mjs:295-297` 引 design/07 §5.2「所有同步 throw 的稳定拒绝……都表现为静默断连……这正是 design/07 §5.2 禁止的形态」。
  - brief 完成条件 3「**关闭 pause**……均有定向反例」——反例只存在于 Store 层。
- 测试面为何全绿：`test/attempt-contract.test.mjs:215-218` 直接调 Store 断言 `{ok:false, reason:'E_FALLBACK_PAUSE_CONFLICT'}`，**把 RPC 层装不下的形态钉成了期望值**；`test/rpc-service.test.mjs:677/680` 只覆盖成功与同键幂等重放，没有任何 RPC 层的 `ok:false` 用例。
- 补充（同一形态、同样可达）：`store.mjs:462-464` 的 `appendFallbackPause` 冲突分支也是 `{ok:false}`，只是本卡内它没有 RPC 调用方（quota 分类归 DHR_34），暂不可达；但作为交给 DHR_34 的原语，同一问题会随第一个调用方一起上线。
- 与代码轮 1 的关系：轮 1 的 P3-2 把「已关闭 pause 的错误码」判为 CLOSED（V-013 直接探 Store 看到 `{ok:false,...}`）。**在 Store 层确实闭合了，但整改把问题挪到了 RPC 编码面**——这正是一致性轮该接住的那一段。

### P1-3 · `CANONICALIZATION.md §三` 是 capability_hash 的唯一口径来源，本卡引入 v1/v2 双轨后它既未更新也未登记，第三方实现照文档算不出任一指纹

- 位置：
  - `relay-core/contracts/CANONICALIZATION.md §三` —— 样例 manifest 只列 7 份协议，正文逐字写「故 `protocols` 是 **7 份顶层协议 + 1 份共享定义模块 = 8 条**」，注释块写「**它同时是 12 份契约的 digest 基线**」
  - 实际：`capability-baseline.json` 现为 **18 顶层 + 1 共享 = 19 条**（K-003 实跑确认），其 `$comment` 已由本卡从「12 份」改成「19 份」，`tools/capability-baseline.mjs:55-56/76-78` 也已按 18 改
  - 双轨落点：`rpc/capabilities.mjs:20` 的硬编码常量 `RPC_V1_CAPABILITY_HASH`、`:43-45` 的 `localCapabilityHash()`、`:47-50` 的 `localCapabilityHashV2()`；唯一的说明是 `capabilities.mjs:18-19` 的两行英文注释
- 一致性后果（这是本项判 P1 的理由，不只是文档陈旧）：
  1. `CANONICALIZATION.md §三` 定义的算法是 `capability_hash = sha256(JCS(capability_manifest))`。**本卡之后，v1 端点广播的 `994d5f…c971e` 不再是任何现存语料按该算法的结果**——它是 DHR_61 之前那一版 manifest 的历史值。任何在 DHR_61 之后按文档规则、对当前 `contracts/` 语料实现 `relay.rpc/v1` 的第二方，会算出 `fb55f2f8…` 并被本 Runtime 以 `E_CAPABILITY_MISMATCH` 拒绝——而 §一 开篇写的失效后果原话正是「握手永远 `E_CAPABILITY_MISMATCH`」。
  2. `capability-baseline.json` 与 `tools/capability-baseline.mjs` 的注释都还在说「改任一 schema 的任意一个字都会让 capability_hash 变化 → 握手立刻断」。**对 v1 轨这句话现在是假的**：本卡就改了 `relay.event/v2`（digest `76f26cf0…` → `391b9eee…`，kind 枚举 +2），而 `relay.rpc/v1` 的 notification 分支正 `$ref` 它，v1 广播的指纹却逐字未动。
  3. 双轨这件事本身是 design D2 §4 授权的（"其握手/descriptor capability hash……冻结不变"），**问题不在决定，在于决定没有落到任何权威工件**：`CANONICALIZATION.md` 没写、`OPEN-POINTS.md` 没登记、`compat-matrix.md` 没登记，只有两行代码注释。
- 存量 / 本卡引入的划分（如实区分）：
  - **存量**：文档写「8 条 / 12 份」而基线在本卡前已是 12 份——8 vs 12 的偏差在 `5999326` 之前就存在，不是本卡造成的。
  - **本卡引入**：偏差扩大到 19；`$comment` 的同一句话在 `capability-baseline.json` 里改了、在 `CANONICALIZATION.md` 里没改（说明施工方知道该改这句，只是漏了另一处）；**v1/v2 双轨是全新协议事实，此前不存在，本卡未在任何契约文档登记**。

---

### P2-1 · 新增的进程内错误码可上线成协议 `reason_code`，但没进 `reason-codes.md` 的任一份清单

- 位置：`relay-core/runtime/attempt-retry.mjs:50`（`throw new Error('E_NONSECRET_PROJECTION_MISSING:fallback-'+profileId)`）→ `relay-core/runtime/service.mjs:743` 的 `withReason(error)` → `service.mjs:70-75` 按首个 `:` 截断并以 `^E_[A-Z0-9_]{2,62}$` 放行 → 落到 v2 error 帧的 `data.reason`
- 事实：`contracts/reason-codes.md` 本卡新增 6 行（`E_FALLBACK_UNAVAILABLE` / `E_ATTEMPT_FENCED` / `E_ATTENTION_REQUIRES_READ_MODEL_V2` / `E_FALLBACK_PAUSE_CONFLICT` / `E_FALLBACK_PAUSE_RESOLUTION_INVALID` / `E_STORE_MUTATION_RECOVERY_FAILED`），但 `E_NONSECRET_PROJECTION_MISSING` 既不在这张"协议码全集权威"表里，也不在同文件末尾那段"内部前缀不上线"的枚举清单里（该清单也未随本卡增补）。
- 违反：`reason-codes.md` 边界声明逐字「本表是**协议层 reason code 的全集权威**……新增协议码必须先进本表；内部前缀不得越界当协议码用」。当前是既没进表、又实际越界上线。
- 同类漏登（不上线，但 design 点名）：`E_FALLBACK_PAUSE_INVALID`（`store.mjs:460`、`:467`）是 design/11 D2 逐字规定的 pause 校验拒绝码（「否则 `E_FALLBACK_PAUSE_INVALID`」），两张清单里都没有。另有 `E_NONSECRET_PROJECTION_INVALID` / `_UNSAFE` / `_UNSUPPORTED`、`E_CREDENTIAL_FIELD` / `E_CREDENTIAL_VALUE` 同样未登记（目前无上线路径，只作口径缺口登记）。

### P2-2 · `relay.store-mutation/v1` journal 缺 design 逐字要求的两个字段，且这个"协议"没有 schema、不在 contracts/、不进指纹

- 位置：`relay-core/store/store.mjs:197-200` —— journal 实际形态为 `{protocol, transaction_id, state, targets:[{path, blob, before_hash, staging_hash}]}`
- 事实：design/11 D2「journal 更正」逐字要求「journal 含事务 ID、**幂等键**、**事件 seq**、每个目标的版本前置条件/hash」。实现有事务 ID 与逐目标的 before/staging hash，**幂等键（`pause_id` / `(pause_id, retry_request_id)`）与事件 seq 两项完全缺失**。
- 后果：
  - 恢复是纯内容哈希驱动的，无法把一笔 prepared journal 关联回它属于哪个 pause/resolution——`E_STORE_MUTATION_RECOVERY_FAILED` 抛出时没有任何业务定位信息。
  - `store.mjs:241` 的 `.sort()` 是 UUID 字典序，不是提交时序。**design 要求的 `事件 seq` 恰恰是唯一能给出确定顺序的字段**，缺了它就只能靠字典序。（今日单条未提交 journal 的场景下不可达，因为写被 `runWrite` 串行化且 committed 者被 marker 跳过；但排序缺陷的根因就是这个缺字段。）
  - `relay.store-mutation/v1` 被 design 当作一个带版本号的协议来写，实现里却只有三处字符串字面量（`store.mjs:180/200/204/208/248`）：没有 schema 文件、不在 `contracts/`、不进 capability manifest、不进 `structural-tokens.txt`。与同批新增的 `relay.attempt-fence/v1`（至少活在冻结 schema 的 `$defs` 里）相比，口径更松一档。
- as-built `relay-core.md:201` 已把 `relay.store-mutation/v1` 当作既成协议写进快照，进一步固化了这个没有契约背书的名字。

### P2-3 · bootstrap 返回的 descriptor 不足以完成 v2 握手，design 的"bootstrap → 连 v2"主路径在实现上不自洽且无端到端测试

- 位置：`relay-core/runtime/service.mjs:795-799`（`v2Descriptor` 只有 `protocol/endpoint/capability_hash/methods_schema/read_model_versions` 五个字段，与 design D2 §4 逐字一致）vs `service.mjs:770-779`（v2 端点的 `authorize` 比对 `descriptor_version` / `repo_id` / `generation` / `local_user_capability`，且取值来自 **v1 的 `descriptor`**）vs `contracts/relay.rpc-methods.v2.schema.json:49-59`（`contracts_params` 四项全 required）
- 事实：`rpc/server.mjs:270-272` 对 v2 端点同样施行 `formal && method !== 'contracts' && !conn.authorized → E_CLIENT_NOT_AUTHORIZED`。也就是说**必须先过 `contracts`**，而 `contracts` 需要的四个值 bootstrap 一个都不给：`generation` 是每届随机 UUID（`service.mjs:790`），只写在 `writeDescriptor(repoRoot, descriptor)` 落盘的 v1 descriptor 文件里；`local_user_capability` 在凭据文件里。
- 后果：design D2 §4 描述的"新客户端向固定地址 bootstrap → 拿 descriptor → 连 v2"这条路，**光靠 bootstrap 走不通**，客户端仍必须去读仓内的 v1 descriptor 文件——固定地址 bootstrap 端点想解决的正是这件事。
- 测试面：`test/rpc-service.test.mjs:662-665` 用的是**进程内的** `service.descriptor.repo_id` / `service.descriptor.generation`，没有任何用例证明"只凭 bootstrap 产出即可完成 v2 授权"。as-built `relay-core.md:202` 的描述也停在"bootstrap 返回有 schema 的 v2 descriptor"，没说这一步之后还得回头读 v1 descriptor。

### P2-4 · `relay.subscription-terminal/v1` 已进 capability_hash 与 v2 通知枚举，全仓零生产者；v2 订阅因此没有任何终止信号

- 位置：`contracts/relay.subscription-terminal.v1.schema.json`（进 `capability-baseline.json:78-80`）、`contracts/relay.rpc.v2.schema.json:45/51`（notification 枚举与 `if/then` 分支）、`rpc/server.mjs:220-222`（`sink.subscriptionTerminal`）
- 事实：`grep subscriptionTerminal` 在 `runtime/` 下**零命中**——`runtime/service.mjs` 从未调用它。v1 侧的强制关闭走 `subscription.closeForAttention()` → `sink.close()`（`service.mjs:575-582`），是标准 v1 error 帧；**v2 侧不存在任何关闭/终止路径**。
- 违反：design/11 D2 §4 逐字「v2 才可收到 `open_attentions[]` 和前置卡新定义的 `relay.subscription-terminal/v1` `{code, run_id, caused_by_seq}`」——契约冻结了、指纹认了，行为没有。v2 客户端无法区分"流正常结束"与"流还活着"。
- 关系：代码轮 1 的 P3-1 记为 OPEN。本轮从一致性面把它上调到 P2：它不是"暂未实现的功能"，而是**一个已经进入 capability_hash 的对外承诺没有对应实现**——第二方按指纹认定本 Runtime 支持它。

### P2-5 · as-built 与 contracts 散文中有 4 处已被本卡推翻但未同步的陈述

| # | 位置 | 现文 | 实际 |
|---|---|---|---|
| 1 | `docs/modules/dh-relay/as-built/relay-core.md:199` | 「新增合同只进入 bootstrap/v2 的 `f1ded3…b79f2`」 | `capability-baseline.json:100` = `fb55f2f85d1db38c…`（K-003 实跑）。同段的 v1 `994d5f…c971e` 正确 |
| 2 | `relay-core/contracts/OPEN-POINTS.md:62` | 「**没有任何已冻结协议能产生这个状态**（`waiting_human`）：`relay.event/v2` 没有对应的 event kind」 | 本卡已加 `fallback_pause_created`（`relay.event.v2.schema.json` kind 枚举）并在 `store/state.mjs:10` 接进 `waiting_human` 转移集——这个开放点已被本卡实质关闭，条目未更新 |
| 3 | `relay-core/contracts/OPEN-POINTS.md:84` | 「`relay.attention/v1`（v0 形状）……全表 23 个码里**没有**能给 `needs_input` 用的」 | 本卡已让 `relay.attention/v1` 承重并给了 `reason_code=E_FALLBACK_UNAVAILABLE`（已进 `reason-codes.md`）。条目未更新，且与 P1-1 的双定义纠缠在一起 |
| 4 | `relay-core/contracts/compat-matrix.md:82` | 「`relay.attention/v1`（v0 形状，P7 冻结）」 | 同上，已在 P6 承重 |

> 第 1 项与代码轮 1 的 N-1 同一处，本轮独立复算确认；第 2~4 项为本轮新增。`npm run audit` 的「白名单↔OPEN-POINTS 不同步 0」只覆盖 `CONDITIONALLY_NARROWED` / `REGISTERED_OPEN` 的机器对账，**不覆盖散文**，所以这四处闸门天然抓不到。

### P2-6 · workspace 证据链断在 S4 之前，findings 与 progress 未随实现更新

- `docs/modules/dh-relay/workspace/DHR_61/progress.md` 日志最后一行（E-011/E-012）仍写「**仍须冻结并接通独立 bootstrap/RPC v2 endpoint 与 retry 的当前 Registry 等值复核，DHR_34 继续阻塞**」——而 `rpc/bootstrap.mjs`、`relay.rpc/v2`、`relay.client-read-model/v2`、`runtime/attempt-retry.mjs` 的当前 registry 全等复核**都已在树上**。task_plan 步骤 4/5 的过程与证据没有任何 progress 条目。
- `findings.md` F-003（P1，open）描述的四项缺口全部已实现；F-002（P2，open）的"全量回归未得终态"已被代码轮 1 的 R-003（228/228，exit 0）与复验（tests 233）补上观测。
- 影响：按 AGENTS 宪章 #3「需求境证据」与施工 worker 完成动作①「过程与证据写 `progress.md`」，**当前工件不足以支撑收口**——不是代码缺陷，是收口件缺失。代码轮 1 的 N-5 已登记同一事实，本轮独立确认并明确它落在 brief 完成条件的证据链上。**本轮 reviewer 不代改。**

---

### P3（登记，不阻塞）

| ID | 事实 |
|---|---|
| P3-1 | **v2 没有 `start`/`control`**：`relay.rpc.v2.schema.json:7` 的 method 枚举只有 5 个，v2 客户端要发起 Run 或控制仍须并存一条 v1 连接。design D2 §4 未言明，as-built §3.12 也没写这条使用约束。 |
| P3-2 | `relay.client-read-model.v2.schema.json:29-42` 的 `run_summary` **手抄**了 v1 的六个字段（`run_id/source/read_only/run_status/group/updated_at`）而不是 `$ref` v1 的 `$defs/run_summary` 再加 `open_attentions`。本轮核对二者字段集**今日完全一致**，但 v1 日后增删字段不会传导到 v2。 |
| P3-3 | `relay.fallback-pause-resolution.v1.schema.json` 的 `resolved_at` 用普通 `relay.common/v1#/$defs/timestamp`，而同卡 `relay.fallback-pause/v1:14` 的 `raised_at` 用新增的 `millisecondTimestamp`。两份都是要落 `event.detail` 的 canonical JSON，精度口径不同源（容量上无风险，轮 1 实测 resolution 上界 750/4096）。 |
| P3-4 | `relay.attempt-fence/v1` 作为一个带版本号的协议名，只以 `relay.fallback-pause/v1#/$defs/fence` 的内联形式存在，没有自己的 `$id` 文件，也不作为独立条目进 capability manifest；与仓内"每个 `relay.X/vN` 一份 `$id` 文件"的既有约定不同源。`relay.attention/v1` 同理（见 P1-1）。 |
| P3-5 | `tools/structural-tokens.txt` 已不是 `--write-tokens` 的输出序：新增 20 个 token 追加在文件尾部（`attempt_receipt`…`v2`），`millisecondTimestamp` 插在 `pause_id` 之后、`retry_request_id` 插在 `manual_retry_profiles` 之后。`audit-contracts.mjs:74-76` 按 Set 判定所以全绿（K-002 实跑 0/0），但文件头写的更新命令（`audit-contracts.mjs:448` 是 `.sort()`）一跑就会产出大段重排 diff。 |
| P3-6 | 注册期容量证明的取值与 design 措辞不同源：`profiles/validate-profiles.mjs:71-79` 用的是**该 registry 里真实 fallback 的 `executor_profile_id`/`account_alias`**，而 design D2 逐字要求「以 relay.common 各 ID 的 schema 最大合法代表……及**六个 snapshot**构造」。本轮核对：`identifier`=128、hash=64、时间戳 29 字符均已取 schema 上界，真实 alias 只会更短，**因此该证明对实际 pause 载荷是严格上界，不存在"注册通过、落账超限"的缝**；差异只在于 design 会拒的"六个满长 fallback"配置实现可能放行。登记为口径差，不作缺陷。 |
| P3-7 | `rpc/capabilities.mjs:57-67` 的 `verifyPeerCapability()` 只比 v1 常量，v2 侧没有对应帮助器（v2 走 `rpc/server.mjs:264` 内的直接比对）。功能无缺口，仅两条轨的校验入口不同源。 |

---

## 3. 已逐字核对成立的区域（clean 项）

以下均为本轮**实际逐字比对过**的部分，不是"未看"：

1. **v1 握手指纹逐字冻结**。`rpc/capabilities.mjs:20` 的常量与 `git show 5999326:relay-core/capability-baseline.json` 的 `capability_hash` 逐字相同（K-006）。`localCapabilityHash()` 返回该常量，新增合同只进 `localCapabilityHashV2()`。
2. **v1 三份契约零改动**。`relay.rpc/v1`（digest `45b4d043…`）、`relay.rpc-methods/v1`（`030aad75…`）、`relay.client-read-model/v1`（`2081c842…`）在 `capability-baseline.json` 的 diff 中**均为上下文行、未变**，与 `git diff --stat` 中不存在这三份文件互证。
3. **v1 端点地址逐字不变**。`runtime/endpoint.mjs:38-42`：`channel` 默认 `'v1'` → `suffix` 为空串 → pipe/unix 地址与改前逐字一致；bootstrap/v2 各带独立后缀，三条互不复用。
4. **旧 `launch-receipt/v2` 仍可读**。schema digest `38af9a22…` 与 golden `fixtures/golden/launch-receipt.v2.json` 的 digest `dcc35f3c…` 在本卡 diff 中均**未变**；`store/store.mjs` 的旧 `registerReceipt` 分支保留，`runtime/workflow-driver.mjs` 无 `config_fingerprint_rule` 的非 Herdr 路径仍可走它。design D1「原 `relay.launch-receipt/v2` 仍只表达 start/control 操作回执」成立。
5. **9 份新增契约全部进 capability manifest 且对证相符**。K-003 实跑 19 份 digest 全符；`tools/capability-baseline.mjs:76` 的 `files.length !== 18` 硬闸与 `:84` 的共享模块 1 份硬闸同批更新。
6. **descriptor/v2 五字段与 design D2 §4 逐字相同**。design 写 `{protocol:"relay.rpc-descriptor/v2", endpoint, capability_hash, methods_schema, read_model_versions:["v1","v2"]}`；`contracts/relay.rpc-descriptor.v2.schema.json` 的 required 五项、`methods_schema` 为 `const "relay.rpc-methods/v2"`、`read_model_versions` 用 `prefixItems:[const v1, const v2] + min/maxItems:2` 钉死顺序与长度；`runtime/service.mjs:795-799` 逐字构造同一形态。
7. **`retry-with-profile` 参数与 design D2 §5 逐字相同**。design 写 `{run_id, node_id, pause_id, executor_profile_id, retry_request_id}`；`relay.rpc-methods.v2.schema.json:37-48` 五项全 required、`additionalProperties:false`、`retry_request_id` 为 `sha256`（对应 design「调用方生成的 sha256 格式幂等键」）。
8. **`relay.fallback-pause/v1` 字段集与 design D2 逐字相同**。design 写 `{pause_id, run_id, node_id, attempt_id, receipt_id, reason_code, raised_at, fence, attention, manual_retry_profiles}`，schema required 为这 10 项 + `protocol`，`additionalProperties:false`；`fence` 的 `{fence_id, attempt_id, receipt_id, reason_code, fenced_at}` 与 `attention` 的 `{attention_id, run_id, node_id, attempt_id, receipt_id, reason_code, state:"open", raised_at}` 两个子对象**逐字段与 design 一一对应**（`state` 为 `const "open"`）。三个派生 ID 的 `sha256("<protocol>\n"+run+node+attempt+receipt+reason)` 口径在 `store/store.mjs` 与 `test/attempt-contract.test.mjs:44-45`、`test/rpc-service.test.mjs:628-640` 三处同源。
9. **`relay.attempt-receipt/v1` 与 design D1 逐字一致**。identity 四字段闭集（`executor_profile_id`/`account_alias`/`config_fingerprint`/`executor_capability_hash`）、`fallback_profile_snapshots.maxItems=6`、alias `^[A-Za-z0-9._-]{1,48}$`、profile id `maxLength:96`、两个 hash 为 `relay.common` 的 `sha256`（64 位小写 hex）、顶层与 identity 双层 `additionalProperties:false`。
10. **`fallback_pause_created` 的 schema 条件与 design D2 逐字一致**。`relay.event.v2.schema.json` 新增的 `if/then` 强制 `reason` 为 `const "E_FALLBACK_UNAVAILABLE"`、`node_id`/`attempt_id`/`detail` required 且 `$ref` 到 `relay.common`（对应 design「必须有非空 `node_id`、`attempt_id`、`reason=E_FALLBACK_UNAVAILABLE`」）；`event.at == raised_at` 由 `store/store.mjs:471` 构造时直接取 `pause.raised_at` 保证。`detail` 保持 string 类型、值为 canonical JSON，未把对象塞进 string 字段——与 design「其 `detail` 保持现有 string 类型」逐字相符。
11. **profile registry 容量约束三项已按 D2 冻结**。`profiles/executor-profile.schema.json`：`fallback_profile_ids` 的 `maxItems:6` + `uniqueItems:true` + `^[A-Za-z0-9._-]{1,96}$`，`executor_profile_id` 加 `maxLength:96`，`account_alias` 由 `minLength:1` 收窄为 `^[A-Za-z0-9._-]{1,48}$`。与 `relay.attempt-receipt/v1#/$defs/identity` 同源，注册期与签发期不再宽窄不一。
12. **注册期 4096 容量证明存在且生效**。`profiles/validate-profiles.mjs:67-93` 的 `fallbackPauseBytes` 用 `identifier='R'×128`、hash 64 位、时间戳 `9999-12-31T23:59:59.999+23:59`（毫秒制最长合法代表，恰与 `relay.fallback-pause/v1#/$defs/millisecondTimestamp` 的上界对齐）构造 JCS payload，`:114-116` 超 4096 拒绝 registry；`store/store.mjs:459-460` 保留运行期兜底为第二道闸。定向反例 `test/profiles.test.mjs`「registry rejects fallback sets whose maximum legal pause detail exceeds 4096 bytes」本轮实跑通过（K-005）。design「不能在 quota 发生时才因尺寸失败」成立。
13. **journal 提交顺序与目录 fsync 与 D2 逐字一致**。`store/store.mjs:186-205`：逐目标写 staging blob → 写引用已发布 blob 的 prepared journal → `applyPreparedMutation` 写目标 → 原子写 committed marker；`:161-173` 的 `writeAtomicText` 在 `rename` 之后打开父目录 `sync()`（仅容忍 win32 的 `EPERM`），四处复用。`applyPreparedMutation:229-233` 的逐目标三分支判定（等于 staging → 跳过；等于 before → 从 staging 重写并回读校验；皆非 → `target-conflict`）与 design 逐字对应。
14. **fence 判定先于当前 Receipt 判定**。`store.mjs:555`（`appendCheckpoint`）与 `:576`（`appendResult`）的 `fencedAttempts` 检查均在 `currentReceipt()` 判定之前，与 design D2「必须在当前 Receipt 判定**之前**检查该集合」逐字相符。
15. **reason-codes 新增 6 码全部在代码中实际使用**，且 `relay.common/v1#/$defs/reason_code` 的 `^E_[A-Z0-9_]{2,62}$` 全部容得下。
16. **OPEN-POINTS 与 audit 白名单同批新增**。`tools/audit-contracts.mjs:36-37` 为 `relay.rpc.v2` 的两个条件收窄点登记白名单，`contracts/OPEN-POINTS.md` 同步加了对应两行；K-002 的「白名单↔OPEN-POINTS 不同步 0」机器证明这一对是齐的。
17. **fixtures manifest 计数与实物一致**。`counts` 由 17/31/31/79 改为 24/33/33/90，与 diff 中新增的 7 份 golden + 2 对 negative 逐一对应；K-001 的 selftest 57/57 覆盖全部 golden 与 negative 的期望 reason/位置。
18. **`package.json` test 脚本已纳入两个新测试文件**（`test/attempt-contract.test.mjs`、`test/profile-identity.test.mjs`），不存在"写了测试但不在 `npm test` 里"的缺口。
19. **`validate.mjs --selftest` 的 schema 归属推断已按 v2 扩展**。`tools/validate.mjs:249` 改为按 `handshake.protocol_version` 选 `relay.rpc/v1|v2`，对无 handshake 的 v1 golden 保持原行为——这是新增 `golden/rpc.v2.request.json` 能被正确归属的前提（K-001 实跑）。
20. **零敏感值**。7 份新增 golden fixture 全部为 `RUN-1` / `aaaa…` / `example` 占位；`profiles/fixtures/*.json` 本卡只改 `fields` 结构，`negative-username-path.json` 里的 `C:/Users/nash` 经 `git show 5999326` 比对为**存量**，非本卡引入。`config_fingerprint_rule.fields` 已升为 `{pointer, classification:"nonsecret"}` 闭集，`classification` 是 `const "nonsecret"`——design D1「每个 Pointer 均须显式标为 `nonsecret`」在 schema 层强制。
21. **四道闸本轮实跑全绿**（K-001~K-004），无一项依赖施工方的历史记录。

---

## 4. 与 design/11 验收 ID 及 brief 完成条件的对照（只陈述事实，不做验收裁决）

| 验收 ID / 条件 | 本轮一致性面的事实 |
|---|---|
| **P6-IQ-A1** / brief 条件 1（Receipt 身份、`launch-receipt/v2` 可读、零敏感值） | schema↔design 逐字一致（§3 第 9、11、20 项）；旧 receipt 可读有 digest 级证据（§3 第 4 项）。**未成立项**：无。 |
| **P6-IQ-A3** / brief 条件 2（单条 canonical pause 原子重放 fence/`waiting_human`/Attention；v1 不静默丢失 Attention 或收到新 kind） | pause 载荷、派生 ID、时间戳对齐、journal 顺序、容量证明均与 design 逐字一致（§3 第 8、10、12、13 项）。**未成立项**：Attention 的协议形态在仓内有两套互斥定义（P1-1）；`relay.store-mutation/v1` 缺 design 逐字要求的两个 journal 字段且无契约背书（P2-2）。 |
| **P6-IQ-A5** / brief 条件 3（v2 `retry-with-profile` 幂等、关闭 pause 有定向反例、旧 Attempt 始终 fenced） | 参数 schema、幂等键、双重快照复核与 design 逐字一致（§3 第 7、14 项）。**未成立项**：「不同键重试已关闭 pause 返回冲突」在 RPC 层表现为静默断连，定向反例只存在于 Store 层且钉的是装不进 v2 的形态（P1-2）。 |
| design D2 §4（冻结 v1 + 固定地址 bootstrap + 独立 v2） | v1 冻结面逐字成立（§3 第 1~3 项）；bootstrap/v2 契约与 design 逐字一致（§3 第 6 项）。**未成立项**：capability_hash 双轨未在任何权威契约文档登记，且文档规则算不出 v1 广播值（P1-3）；bootstrap 产出不足以完成 v2 授权（P2-3）；`relay.subscription-terminal/v1` 无生产者（P2-4）。 |
| as-built 同步（触及子系统收口要求） | §3.12 已新增且四段描述与实现基本对应。**未成立项**：v2 指纹陈旧、三处 contracts 散文已被推翻未更新（P2-5）。 |
| workspace 证据链 | **未成立**：progress 止于 S3，findings F-002/F-003 状态与实物不符（P2-6）。 |

## 5. 一致性面的覆盖缺口（供后续轮次 / 整改参考，不代主控排期）

1. 无任何用例断言「同一 `protocol` 常量在 `contracts/` 与 `contracts/v0-shapes/` 下唯一定义」——P1-1 因此可以静默存在。
2. 无 RPC 层的 `retry-with-profile` 失败/冲突用例（现有只有成功 + 同键幂等），P1-2 因此四道闸与全量回归都是绿的。
3. 无任何闸门核验 `CANONICALIZATION.md` 的数字与 `capability-baseline.json` 的实际份数一致（`capability-baseline.mjs` 只硬编码 18/1 两个数，不回头读文档）。
4. 无「只用 bootstrap 产出连上 v2 并完成 `contracts` 授权」的端到端用例。
5. 无 `relay.store-mutation/v1` 的 schema 与正反 fixture，journal 形态的任何漂移都不会被契约闸发现。
6. `reason-codes.md` 与代码实际抛出的 `E_*` 集合之间没有机器对账（本轮是靠 `grep` 手工比对出 P2-1 的）。

## 6. 声明

- 本轮只读：未改任何生产代码、未派活、未提交、未询问用户、未勾任何人类签名区。探针脚本只做 `loadAjv` / `ajv.compile` / schema 校验，全部落在会话 scratchpad，未建 Store、未起 service、未读写用户级 registry 或任何 profile 配置文件、未触碰任何凭据。
- 上述结论只陈述事实与级别，不代主控做验收裁决；与代码轮 1 重合的条目已明确标注重合关系与本轮独立复算结果，不重复计数。
- §0 的模型证据不一致项**未消解**，与代码轮 1 同源，交主控裁决。

---

# 7. 整改复验（一致性轮 · 同一 reviewer · 只读）

> 日期 2026-08-30。**复验范围严格限定**为本报告的 P1-1 / P1-2 / P1-3，加上新增 reason code 与 docs 同步；未开新审查面，未重跑与该范围无关的项。仍只读：未改生产代码、未派活、未提交、未询问用户；本文件仍是唯一写入。
> 模型证据同 §0，未变（系统上下文 `claude-opus-5` vs SessionStart hook `claude-fable-5[1m]` 的不一致仍未消解，仍交主控裁决）。

## 7.1 复验基线与本轮证据

整改后 diff 相对 `5999326`：35 个改动文件 + 26 个新增文件，1263 增 / 125 删（首轮为 32+26、1176 增 / 86 删）。本复验范围内新受改文件：`contracts/CANONICALIZATION.md`、`contracts/compat-matrix.md`、`contracts/v0-shapes/relay.attention.v1.shape.json`、`contracts/reason-codes.md`、`contracts/OPEN-POINTS.md`、`runtime/attempt-retry.mjs`、`test/rpc-service.test.mjs`、`as-built/relay-core.md`、`workspace/DHR_61/{progress,findings}.md`。

| ID | 命令 / 探针 | 结果 |
|----|------------|------|
| V-001 | `node tools/validate.mjs --selftest` | **pass 57 / fail 0，exit 0** |
| V-002 | `npm run audit` | 全项 0；结构 token 255 个（v0 形状字段收敛后由 260 降至 255），未登记 0、陈旧 0；白名单↔OPEN-POINTS 不同步 0，exit 0 |
| V-003 | `node tools/capability-baseline.mjs` | 19 份 digest 相符，`capability_hash = fb55f2f85d1db38c…`（**未变**，与 v0 形状不计入指纹的规则一致），exit 0 |
| V-004 | `git diff --check` | exit 0，干净 |
| V-005 | `node --test --test-concurrency=1 test/{rpc-service,rpc,contracts}.test.mjs` | **pass 65 / fail 0，exit 0**（含新增的 retry 冲突用例） |
| V-006 | 探针：`fixtures/golden/fallback-pause.v1.json` 的 `attention` → `v0-shapes/relay.attention/v1` | **通过**（首轮为不通过） |
| V-007 | 探针：同一对象 → `relay.fallback-pause/v1#/$defs/attention` | **通过** |
| V-008 | 探针：旧 v0 语义样本（`category`/`reason`/`message`） → 两侧 | **两侧同时拒**，旧形态确已退役 |
| V-009 | 探针：仅把 `raised_at` 改成亚毫秒 → 两侧 | v0-shapes **接受**、pause 内联 **拒**（`millisecondTimestamp` pattern）——见残留 R-1 |
| V-010 | 探针：`{jsonrpc,id,result:{ok:false,reason}}` → `relay.rpc/v2` | 仍**不合法**（schema 面有意未改） |
| V-011 | 探针：标准 error 帧 `{...,error:{data:{reason:'E_FALLBACK_PAUSE_CONFLICT',receipt:null}}}` → `relay.rpc/v2` | **合法** —— 冲突改走 error 帧是与 schema 相容的形态 |
| V-012 | `grep -oE '^\| \`E_[A-Z0-9_]+\`' reason-codes.md \| sort -u \| wc -l`（该文件自带的计数命令） | **39**，与文中「共 **39** 个码」逐字相符 |
| V-013 | `grep -l "E_ATTEMPT_FENCED\|E_FALLBACK_PAUSE\|E_ATTENTION_REQUIRES\|E_STORE_MUTATION\|E_NONSECRET" fixtures/negative/*.json` | **零命中** —— 见残留 R-5 |

## 7.2 逐项裁决

| 项 | 上轮级别 | 裁决 | 证据 |
|---|---|---|---|
| **P1-1** `relay.attention/v1` 双定义 | P1 | **CLOSED** | `contracts/v0-shapes/relay.attention.v1.shape.json` 已整份改写为承重形态：required 收为 `protocol/attention_id/run_id/node_id/attempt_id/receipt_id/reason_code/state/raised_at`，`attention_id` 由 `identifier` 收窄为 `sha256`，`node_id` 去掉可空，`reason_code` 为 `const "E_FALLBACK_UNAVAILABLE"`、`state` 为 `const "open"`，`category`/`reason`/`message`/`resolved_at` 四个旧字段删除；元数据同步为 `x-freeze-status: frozen`、`x-frozen-at: DHR_61`、`x-first-load-bearing: P6 DHR_61`，description 明写「权威字段与 `relay.fallback-pause/v1#/$defs/attention` 相同」。V-006/V-007 双向通过，V-008 证实旧形态已退役。配套散文也齐了：`OPEN-POINTS.md` K-1 与 K-3 各加一行 DHR_61 裁决（明写「原 v0 的 category/reason/message 形态不再现役」「其他 Attention 类别若后续需要承重，必须升新版本」），`compat-matrix.md:82` 由「v0 形状，P7 冻结」改为「DHR_61 冻结为 fallback pause Attention」并补了不得同版本扩义的边界。 |
| **P1-2** retry 冲突静默断连 | P1 | **CLOSED** | `runtime/attempt-retry.mjs:53-54` 新增 `const result = await store.appendFallbackPauseResolution(...)` + `if (result?.ok === false) throw new Error(result.reason ?? 'E_FALLBACK_PAUSE_CONFLICT')`。抛错后经 `service.mjs:747` 的 `withReason` → `rpc/server.mjs` 的 `sendError`，落成 schema 合法的 v2 error 帧（V-011 证实该帧形态合法），不再触发 `encodeValidatedFrame` 抛错→`dropConnection` 那条路。修在**生产者**而非放宽 `retry_result`，与仓内「拒绝走 error 帧、不塞进 result」的既有形态同源（V-010 记录 schema 面有意未动）。定向反例已补：`test/rpc-service.test.mjs` 新增第三次调用（换 `retry_request_id` 打已关闭 pause）并断言 `conflict.error.data.reason === 'E_FALLBACK_PAUSE_CONFLICT'`，断言消息逐字写「a closed-pause conflict must be a schema-valid RPC error, not a dropped connection」。V-005 实跑 65/65。design D2 §5「不同键重试已关闭 pause 返回冲突」现成立。 |
| **P1-3** capability 双轨无权威登记 | P1 | **CLOSED** | `contracts/CANONICALIZATION.md §三` 新增「DHR_61 后的 v1/v2 双轨」小节，三条逐字写明：① `relay.rpc/v1` 固定广播 `994d5f…c971e`，**「是兼容常量，不再由当前 `contracts/` 重新计算」**，入口 `localCapabilityHash()`；② bootstrap 与 `relay.rpc/v2` 用当前契约集按后文算法计算，权威清单在 `capability-baseline.json`，入口 `localCapabilityHashV2()`；③ **「v1 客户端不得拿当前 manifest 重算值替代上述兼容常量」**。这正是首轮判 P1 的那条互操作缺口——第三方现在有明文规则可依。同段另加「下面的 JSON 是最小参考实现的历史形状示例，不是当前 v2 清单的穷举；当前条目数量和值一律以生成的 `capability-baseline.json` 为准」，把首轮列的存量数字漂移一并纳管。「12 份契约的 digest 基线」改为「当前 19 份……具体数量由生成器校验，不再手抄」。`as-built/relay-core.md:199` 的陈旧指纹 `f1ded3…b79f2` 已改为 `fb55f2…d073` 并加「双轨计算口径见 `contracts/CANONICALIZATION.md`」。V-003 复算确认基线值一致。 |
| **P2-1** 新增 reason 未登记 | P2 | **部分 CLOSED** | `reason-codes.md` 补入 `E_FALLBACK_PAUSE_INVALID`（design D2 逐字点名的那个）与 `E_NONSECRET_PROJECTION_MISSING`（首轮实证可上线的那个），两条描述都写明了触发面与「v2 返回稳定错误帧」的语义。汇总计数由 31 改为 **39**，与该文件自带的 grep 命令实跑逐字相符（V-012）——注意首轮之后一度写作 33（与实跑 39 不符），当前树上已是 39，本轮以当前字节为准。**残留见 R-4。** |
| **P2-5** as-built / contracts 散文陈旧 | P2 | **CLOSED** | 首轮列的四处全部同步：as-built 指纹（见 P1-3 行）、`OPEN-POINTS.md:62` 段补 DHR_61 再裁决行、`OPEN-POINTS.md:84` 段补 DHR_61 已裁决行、`compat-matrix.md:82` 改写。 |
| **P2-6** workspace 证据链断在 S4 前 | P2 | **CLOSED（E-019 待回填）** | `progress.md` 补 E-013~E-019 五条日志与证据行，覆盖 bootstrap/v2、代码轮 1 整改、Review Batch 四路与人类放行；`findings.md` 重写为 F-001~F-007，其中 **F-004 逐条对应本报告的 P1-1~P1-3**（「Attention 同名双定义、retry 冲突会在 RPC 静默断连、capability 双轨无权威说明」）并记为 resolved，**F-006 收本报告的 P2-3/P2-4** 并明确记为 `accepted nonblocking`（含「禁止下游误当已提供完整 v2 控制通道」这句边界），F-002 保留历史失败观察不冒充。E-019（最终冻结字节上的全量收口终态）标 `pending`，如实未冒充——该项属主控收口动作，不在本轮复验范围。 |

## 7.3 残留（均不阻塞，登记备查）

| ID | 级别 | 事实 |
|---|---|---|
| R-1 | P3 | `v0-shapes/relay.attention.v1.shape.json` 的 `raised_at` 用 `relay.common/v1#/$defs/timestamp`，而 `relay.fallback-pause/v1#/$defs/attention` 用新增的 `millisecondTimestamp`。V-009 实测：亚毫秒 `raised_at` 被 shape 接受、被 pause 内联拒。方向是**单向放宽**（线上对象只由 pause 路径产出，必然合两侧），不再是首轮那种互斥；但两份自称"权威字段相同"的定义在这一个字段上仍不同源。 |
| R-2 | P3 | 该文件现在自称 `x-freeze-status: frozen` / `x-frozen-at: DHR_61`，却仍住在 `contracts/v0-shapes/`、仍叫 `*.shape.json`，因而**不进 capability manifest**（V-003 的 19 份未变）。CANONICALIZATION §三 给「v0 形状不计入」的理由原话是「**它们尚未冻结**，计入会让指纹随未定形状漂移」——这条理由对它已不再成立。后果：改这份已冻结 schema 的任意一个字都不会推动 v2 指纹。 |
| R-3 | P3 | CANONICALIZATION §三 正文「故 `protocols` 是 **7 份顶层协议 + 1 份共享定义模块 = 8 条**」这句仍在（存量）。它已被本次新加的前置免责句（「条目数量和值一律以生成的 `capability-baseline.json` 为准」）覆盖，不再误导，但字面数字仍与 19 不符。 |
| R-4 | P2 | **P2-1 只补了 `_MISSING` 一个。** `E_NONSECRET_PROJECTION_INVALID` / `_UNSAFE` / `_UNSUPPORTED` 由 `profiles/identity.mjs:19-20/27/30/50/69/76/87/108/113` 抛出，而 `runtime/attempt-retry.mjs:34` 与 `:51` 的 `freezeProfileIdentity` 正是 `retry-with-profile` 路径上的调用点——**与已登记的 `_MISSING` 可达性完全相同**（同一函数、同一次调用即可抛出任一者），却既不在协议码表、也不在边界声明的内部前缀枚举里。`E_CREDENTIAL_FIELD` / `E_CREDENTIAL_VALUE` 同样两处皆无（目前无上线路径，只作口径缺口登记）。 |
| R-5 | P3 | `reason-codes.md` §「新增码的规矩」②逐字要求「加码必须同时……在 `fixtures/negative/` 加一份能触发它的反例 + `.expect.json`」。本卡新增的 8 个码（6 个首批 + 本次 2 个）**一个都没有对应反例**（V-013 零命中）。现有 `dhr61-fallback-pause-submillisecond.expect.json` 期望的是 schema 层的 `E_BAD_VALUE@/raised_at`，不是这批码中的任一个。 |

## 7.4 复验结论

- **P1 = 0。** 首轮三项 P1（P1-1 Attention 双定义、P1-2 retry 冲突静默断连、P1-3 capability 双轨无权威登记）**全部闭合**，每项均有：契约/代码位点 + 本轮独立探针 + 施工方新增的定向测试或明文裁决三重证据。
- **P0 = 0**（首轮即为 0，本轮未新增）。
- P2：首轮 6 项中 P2-1 部分闭合（残留 R-4）、P2-5 与 P2-6 闭合；P2-2 / P2-3 / P2-4 不在本次复验范围，状态照首轮登记，其中 P2-3 / P2-4 已由施工方在 `findings.md` F-006 记为 `accepted nonblocking`（是否接受由主控裁决，本轮不代判）。
- 新增 reason 与 docs 同步：**成立**。两个码入表、计数与自带 grep 命令实跑逐字相符（39/39）、四处散文全部同步、双轨口径进 CANONICALIZATION 并被 as-built 反向引用。残留 R-4（三个同路径同可达的兄弟码未登记）与 R-5（8 个新码零反例 fixture）如实登记。
- 本轮闸门与窄测：selftest 57/57、audit 全项 0、capability 基线 19 份 `fb55f2f8…` 未变、`git diff --check` 干净、`rpc-service + rpc + contracts` 65/65 exit 0。**未跑全量 `npm test`**——不在本次复验范围，最终终态以 E-019 为准。
- 本节仍只陈述事实与级别，不代主控做验收裁决、不勾人类签名区；复验全程只读，未改生产代码、未派活、未提交，探针只做 schema 校验、未建 Store、未起 service、未读写用户级 registry 或任何 profile 配置。
