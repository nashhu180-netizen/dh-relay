<!-- dh:v1 -->
# as-built · relay-core（Relay v2 承重内核 · 契约层）

> **首份快照：DHR_28**（P5 批次 1·冻结 v2 最小协议集 + ADR + 独立校验器）。
> **阅读对象**：DHR_29（Runtime）、DHR_30（CLI / Read Model）以及任何要对接 v2 协议的客户端施工者。读完这份应当知道 `relay-core/` 是什么、边界在哪、哪些地方动之前必须先知道什么。
> **与 [relay-contracts.md](relay-contracts.md) 的关系**：那份是 **v1 的 PowerShell 契约层**（`tools/contracts/`，`relay/v1`），本份是 **v2 的 TypeScript/Node 契约层**（`relay-core/contracts/`）。两套**并列共存、互不迁移**——v1 现役且只读作 Oracle，v2 是后续 Runtime 的唯一契约来源。看到 `relay/v1`、`.psd1`、`Test-Relay*` 去那份；看到 `relay.run/v2`、`*.schema.json`、`validate.mjs` 看这份。

## 1. 它是什么 / 为什么存在

一句话：**控制面独立的承重内核的契约层**。协议在这里冻结，之后 Runtime（DHR_29）、Relay CLI（DHR_30）、以及任何客户端（DSH Bridge / Pi Adapter / 其他终端）**只认这一份契约来源**，谁都不再各自解释一遍字段含义。

它**不是** Runtime。本卡不实现任何运行逻辑——没有 Store、没有 lease、没有事件回放、没有 CLI。目录里已经预留了 `runtime/` `store/` `rpc/` `cli/` `adapters/` `workflows/` 的位置，但**一个都还没建**。

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
├── fixtures/                 golden 11 / negative 22 对 / manifest.json
├── tools/                    校验器、审计器、三个基线工具、JCS 实现
├── store/                    DHR_29 单 Run 账本：事件账 + 确定性回放（见 §3.5）
└── test/                     node --test：contracts.test.mjs（10 条）+ store.test.mjs（11 条）
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

**`v0-shapes/` 4 份**（`relay.resolved-plan/v1`、`relay.host-observation/v1`、`relay.attention/v1`、`relay.approval/v1`）：**不是冻结契约**，每份带 `"x-freeze-status": "v0-shape-only"`，P6/P7 首次承重时才正式冻结。**不计入 `capability_hash`**——计入会让指纹随未定形状漂移。

### 3.2 `contracts/` 的五份规范文档

| 文件 | 回答什么 | 什么时候必须去读 |
|---|---|---|
| `reason-codes.md` | 全部 **23** 个 `E_*` 码，分六类（fail-closed 三条 / start 前置 / 契约结构 / 幂等冲突 / Executor 生命周期 / RPC） | 要加码时——加码有三步规矩：写进表、加一份能触发它的反例 + `.expect.json`、说明与既有码的边界 |
| `v1-gap-disposition.md` | P4 主报告 §4 的 v1 六条缺口 G1~G6 逐条处置，含可 grep 锚点 `v1-gap-disposition: G<n>` | **DHR_30 开工前必读**（文件末尾有专门一节，见 §7） |
| `compat-matrix.md` | v1 ↔ v2 字段级对照；event `kind` 逐值对照；fail-closed 口径对照；移交下游三条 | 要论证「v2 判定不弱于 v1」时 |
| `CANONICALIZATION.md` | 摘要与签名口径 = RFC 8785（JCS）；五个指纹字段各对什么取摘要；`capability_hash` 的清单形状定死 | 要动任何 digest / signature 时 |
| `OPEN-POINTS.md` | 3 处有意开放点的登记 + H6 断言的两条固有边界 + 交给 DHR_29 的 K-1~K-4 | 要往 `contracts/` 加任何 `additionalProperties: true` 时（未登记的开口视为缺陷） |

### 3.3 `fixtures/`

- `golden/` **11 份**——每份已冻结协议至少一份正例（`relay.rpc/v1` 四分支各一份）。
- `negative/` **22 对**——反例载荷 + `.expect.json`。`.expect.json` 写死的不只是 reason code，**还有出错位置 `at`**（JSON Pointer）。这是 F-052 加的：只钉码不钉位置，一条反例被别的原因拒也算过。
- `manifest.json`——55 份 fixture（11 + 22 + 22）逐份的 canonical sha256。

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
- **已知边界（轮 2 复核登记，非缺陷）**：①工件先落盘、事件后追加，两文件之间存在跨文件撕裂窗口——openStore 以事件账为真值重建，撕裂现场表现为「有工件无事件」，幂等键仍可对上但不做交叉断言（彻底消除需单文件事务或 WAL，归 DHR_51 恢复路径评估）；②`appendEvent` 是库级原始入口，直接投递 `attempt_succeeded/failed/orphaned` 可绕过终态守卫——运行期只应经 `appendResult` 走结果，raw 投递的封堵归 DHR_51（runtime 层不暴露 raw 入口）。

## 4. 技术选型的裁决出处

| 决策 | 结论 | 出处 |
|---|---|---|
| 实现语言 | **TypeScript / Node** | ADR-001，**用户 2026-08-20 对话点选**（两轮：先答建议倾向，主会话给出明示建议 + 翻盘条件，用户第二轮「采纳，进批次 2」） |
| 代码根 | **本仓新顶层目录 `relay-core/`**（不另起独立仓） | 同上 |
| pi-agent 接入方式 | **经冻结 Adapter，不直连 SDK**（次级裁决，用户同批点选） | ADR-002 第②问 + ADR-001「决策」节末 |
| Agent 宿主四问 | process / pi-agent / DSH Native / Herdr 逐问作答，每问一行 `answer:` | ADR-002 |

**ADR-001 里显式登记了翻盘条件**（不因已裁决而抹掉）：若 Runtime 将来须装到**无 Node 运行时**的机器，或作为**独立产品向外部分发**，则「单二进制分发优势在本项目不成立」这条依据立刻失效、Go 的单二进制成为真需求。P5-H（DHR_31 人判）保留「选定语言是否继续作默认」一问。

## 5. 五道机器闸各自在守什么

在 `relay-core/` 下跑。以下数字**2026-08-22 由 DHR_29 收敛批实跑刷新**（上一版为 DHR_28 时点快照，hash `3ccf3b10…` 已被批次 1/2 的授权契约修订取代）。

| 闸 | 命令 | 当前实际输出 | 它独占守住的是什么 |
|---|---|---|---|
| ① 单元测试 | `npm test` | **23 条全过**（contracts 10 + store 13） | 把下面四道闸接进一个入口；Store 侧另钉：幂等/冲突/隔离、身份链、终态守卫、openStore fail-closed、快照切点等价、并发 seq、P1 fixture 复验、F-037/F-070 反例 |
| ② 校验器 selftest | `node tools/validate.mjs --selftest` | **pass=33 fail=0**（golden 11 + negative 22） | 每条反例**逐条命中写死的 reason code 与出错位置 `at`**，两者都不对就红 |
| ③ 契约静态审计 | `node tools/audit-contracts.mjs` | 扫 12 份 schema/shape；闭合对象 24；条件收窄 1；有意开放点 3；未登记开口 0；非白名单厂商 token 0；`$ref` 实解析 **98 条**失败 0（`$id` 注册表 12 项）；结构 token 164 个未登记 0；**F-042：ajv.validateSchema 0 拒、meta 分叉 0；K-3 身份键内联 pattern 0**（两闸 DHR_29 批次新增） | 「没有我没想到的那几种」——`$ref` 真解析、开口全登记、结构 token 全白名单、meta 规则单一权威、身份 pattern 结构受闸 |
| ④ fixture 基线 | `node tools/fixture-manifest.mjs` | **55 份逐份 digest 相符**（golden 11 / negative 载荷 22 / expect 22） | fixture **还是过审时那批**。没有它，②的通过数只能证明「当下盘上这批自洽」 |
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
| 3 | 纳入共享定义模块 ⇒ **8 条** | 当前形态。`capability_hash` 由 `5c5685d0…` 变 `3ccf3b10…`——**这个变化本身是正确的，它确实是一次能力变更** |

`executor_kinds` 这个维度存在的理由：只托管 `process` 的 Runtime 与还托管 `dsh-agent`/`pi-agent`/`herdr-agent` 的，前三个键完全相同 ⇒ 指纹相同。**在 P5 特别活**——`pi-agent` 是 DevPlan §4.2 明列的 P5-X 条件项、非必达，**两个都合规的 P5 构建**（带 / 不带 Pi Adapter）在没有本键时指纹一模一样。

> 当前基线取「只托管 `process` 的最小 P5 参考实现」：`methods` 7 个、`notifications` 2 个、`executor_kinds = ["process"]`。DHR_29 真做出 Pi Adapter 或 DSH Native 时，算出的是**另一个**指纹，那是设计意图不是回归。

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

`authority_generation` → lease 的语义等价性复核（**B-15 后归 DHR_51**）；7 段身份链 → `receipt_id` 单锚点的迟到结果判定；会话尾巴脱敏（`SessionTailMaxBytes` + redaction）。三条原移交 DHR_29，**都要用 P1 的 fixture 作 Oracle 复验「不弱于 v1」**。**DHR_29 处置（2026-08-22）**：迟到判定已用 P1 fixture 复验（`store.test.mjs`「P1 迟到结果 fixture 复验」一测：隔离 ≥ result_stale、冲突码 ≥ CAS）；脱敏已按 v1 redaction 口径对齐并双路钉死；lease 一条随 B-15 移交 DHR_51。

### 8.5 findings 里 `open` 的条目

本卡 findings 81 条，7 条 `open`。**`F-064` 是唯一 open 的 P1**，见 §9。其余 6 条：F-042（P3，手写 `KEYWORD_TYPES` 与 ajv 两套 meta-schema 规则可能漂移——**已由 DHR_29 批次收口：ajv.validateSchema 为权威 + 分叉 tripwire 进审计第③闸**）、F-013（P2，`format: "date-time"` 空转，已由 `relay.common/v1` 的 RFC3339 `pattern` 实际承担）、F-010 / F-009 / F-001 / F-061（工具链与仓级存量，与 `relay-core/` 本体无关）。

## 9. 已知不覆盖的（说清楚，别当已兑现）

**验收口径 1 的「能力不匹配 fail-closed」本卡只兑现了一半**（F-064，唯一 open 的 P1）：

- **兑现的**：指纹的**可复算性**。`capability-baseline.json` 让「两个实现能不能算出同一个指纹」变成可机器复算的，红测已验（只在某份 schema 的顶层 `description` 末尾加一个空格 → `exit 1`）。
- **没兑现的**：指纹的**运行期比对**。契约层只能校验 `capability_hash` 的**形态**（`^[0-9a-f]{64}$`）——`capability-mismatch` 反例实测命中的是 `E_BAD_VALUE @ /handshake/capability_hash`，而一份**形态合法但与对端不同**的指纹，schema 必然放行，也只能放行。
- **移交状态**：比对移交 **DHR_29**，**但 DHR_29 与 DHR_30 的验收口径里一个字都没提能力 / capability**，DevPlan §4.1 的 P5-M6 承接卡也只写了 DHR_28。「是否在 DevPlan 给 P5-M6 补上 DHR_29/30 的承接标注」属计划层改动，已摆给用户，**AI 未自行修改计划**。→ **DHR_29 接手时请先确认这条有没有落到你的卡上。**

另两处 schema 层的固有边界（`OPEN-POINTS.md` §H6，**不是缺陷但别以为 H6 已被完全兜住**）：

1. **schema 判不了「结构性必经」（DAG 可达性）**。一个 `required: false` 的 DSH-only 节点，被一个 `required: true` 的节点依赖 ⇒ 它在 DAG 上**事实必经**，H6 一次都不触发。**这不是故意规避，是诚实实现者会自然写出的形状。** ⇒ 移交 DHR_30 / DHR_31：Workflow 定义期须做可达性推导后再校验 H6。
2. **只拦 `dsh-agent` 这一个字面量，不拦「实质 DSH-only」**。`{kind: "process", ref: "bridge/dsh-shim.exe"}` 会被判为合法的非 DSH Executor。**加 `executor_kind` 枚举值时必须回头检查这条断言。**

## 10. 从这里往下怎么走

| 你是 | 先读 |
|---|---|
| DHR_29（Runtime） | 本文 §7 硬约束 → §8.2 K-1~K-4 → §8.4 移交三条 → §9 F-064 → `ADR-002`（executor 生命周期语义的**唯一**来源） |
| DHR_30（CLI / Read Model） | 本文 §8.3 → `v1-gap-disposition.md` 全文 → `OPEN-POINTS.md` O-3 |
| 要改 `contracts/` 任何一个字的人 | 本文 §5「三份基线互不覆盖」→ §6 全节 → `CANONICALIZATION.md` §三 |
