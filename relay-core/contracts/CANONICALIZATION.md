# 摘要与签名的规范化口径

> **为什么有这份文件**：`contracts/` 里有五个字段承载"内容指纹"语义，全部只约束了**形态**（`^[0-9a-f]{64}$`），而"规范化"到底指什么，此前**全文没有任何一处定义**。批次检查点 2 小审 D-24 指出这是硬缺陷（findings F-026）。
>
> **失效后果不是理论上的**：两个实现各按自己的方式序列化再 sha256，结果必然不同 ⇒ `capability_hash` 对不上 → **握手永远 `E_CAPABILITY_MISMATCH`**；`plan_digest` 对不上 → **design/06 H11 永远不成立**；`state_signature` 对不上 → **P5-M3 的验收永远过不了**。而 `README.md` 开宗明义写的是「Runtime、Relay CLI、以及任何客户端都只认这一份契约来源」——决定互操作的五个值不在这份来源里，那句话就是空的。
>
> **这是本卡第二次犯同一类错**：`v1-gap-disposition.md` G2 的理由段自己写着「**冻结聚合语义** 解决"源头怎么算出这个值"必须唯一、可复算、跨实现一致。**只记不冻，两个 Runtime 实现会算出不同的 run_status**」——同一条推理没用在这五个字段上，而它们失效的后果比 `run_status` 更硬（前者只是显示不一致，后者是握不上手）。与 D-11（H6 的 `required` 该必填却设成可选）同类。

> **可执行实现（批次检查点 3 小审 P1-1 补）**：`tools/canonical.mjs` 的 `jcs()` / `digest()` / `digestExcluding()`。
> 在此之前本文档只是散文——口径写在纸上、无人能复算，于是这五个字段的「唯一、可复算、跨实现一致」
> 在本仓内部同样没有兑现。`fixtures/manifest.json` 是它的第一个消费者，`npm test` 里有一条把
> 本节的硬规定（键序、数字格式、非 ASCII 直出、拒 NaN/undefined）钉成回归的用例。

## 一、规范化 JSON = RFC 8785（JCS）

所有摘要一律按 **RFC 8785 JSON Canonicalization Scheme (JCS)** 序列化后取 sha256，输出**小写十六进制**。

选 JCS 而不是自定义规则，是因为它已经把容易分歧的地方逐条定死，且跨语言有现成实现：

| 分歧点 | JCS 规定 |
|---|---|
| 对象键顺序 | 按键的 **UTF-16 码元**序列排序（不是字节序，也不是 locale 序） |
| 数字格式 | 按 ECMAScript `Number::toString` 规则，无前导零、无 `+`、无尾随 `.0` |
| 字符串转义 | 最短转义形式，非 ASCII 直接输出 UTF-8 而非 `\uXXXX` |
| 空白 | 无任何多余空白（compact） |
| 编码 | 输出 UTF-8 字节序列 |

**计算式**：`digest = lowercase_hex( sha256( utf8_bytes( JCS(payload) ) ) )`

### 与 v1 现役口径的关系（承接 Oracle，如实登记差异）

v1 已经做过同一件事——`tools/contracts/relay-schema.ps1` 的 `ConvertTo-RelayCanonicalValue` + `Get-RelayPlanHash`：递归按键排序 → `ConvertTo-Json -Depth 50 -Compress` → UTF-8 → SHA256 → 小写十六进制。**思路一致，故本口径是 v1 的收紧而非另起炉灶。**

差异逐条（v1 是 JCS 的**近似**，未定死以下几点，故不能直接互认）：

| 项 | v1 | v2（JCS） |
|---|---|---|
| 键排序依据 | PowerShell `Sort-Object` 的默认比较（受实现与文化影响） | UTF-16 码元序，确定 |
| 数字格式 | 交给 `ConvertTo-Json` | ECMAScript `Number::toString`，确定 |
| 非 ASCII 转义 | 交给 `ConvertTo-Json` | 直出 UTF-8，确定 |
| 嵌套深度 | 硬上限 `-Depth 50` | 无上限 |

⇒ **v1 与 v2 的摘要不可互认**，兼容矩阵按"改型"处理；v1 现场只读投影本就不消费 v2 摘要，无迁移问题。

## 二、五个字段：各自对什么取摘要

**通则**：摘要字段**自身**永不参与摘要计算（v1 的 `Get-RelayPlanHash` 排除 `plan_hash` 是同一做法）。下表的"排除"列即不参与计算的键。

| 字段 | 落点 | 对什么取摘要 | 排除 | 本卡是否定死 |
|---|---|---|---|---|
| **`capability_hash`** | `relay.rpc/v1` 握手 | **能力清单对象**（见 §三，形状本卡定死） | — | ✅ **本卡定死**（它是 fail-closed 三条之一、验收口径第 1 条的直接落点，不能留给下游） |
| `request_digest` | `relay.launch-receipt/v2` | 被回执的**整个 request 对象**（`relay.rpc/v1` 的 request 信封） | `handshake.request_id`（幂等键本身）、`id` | ✅ 本卡定死 |
| `payload_digest` | `relay.result/v2` | 该 result 对象 | `payload_digest`、`quarantined`（隔离标记由 Runtime 事后置位，不属结果内容） | ✅ 本卡定死 |
| `payload_digest` | `relay.checkpoint/v2` | 该 checkpoint 对象 | `payload_digest` | ✅ 本卡定死 |
| `plan_digest` | `relay.resolved-plan/v1`（**v0 形状**） | 该 resolved-plan 对象 | `plan_digest`、`resolved_at`（时刻不属计划内容——否则同一份计划解析两次 digest 不同，H11 立刻失效） | ⚠️ **口径定死，但字段随 v0 形状待 P6/P7 冻结** |
| `state_signature` | `relay.run-state/v1` | 该 run-state 对象 | `state_signature`、`updated_at`（时刻不属状态内容——否则"强杀后重建相同签名"永不可能，P5-M3 立刻失效） | ✅ 本卡定死 |

> ⚠️ **两处"排除时间戳"是硬要求，不是优化**：`plan_digest` 若含 `resolved_at`，H11「换客户端后重新读到的 ResolvedPlan 必须 digest 相同」就不可能成立；`state_signature` 若含 `updated_at`，P5-M3「强杀 Runtime 后从 Store 重建相同状态签名」就不可能成立。这两条是各自验收命题的**前提**。

## 三、`capability_hash` 的能力清单（本卡定死）

`capability_hash = lowercase_hex(sha256(utf8(JCS(capability_manifest))))`，其中 `capability_manifest` 形状如下，**只含这三个键，多一个少一个都算不同能力集**：

```json
{
  "protocols": [
    { "id": "relay.checkpoint/v2",     "digest": "<sha256(JCS(该 schema 全文))>" },
    { "id": "relay.event/v2",          "digest": "…" },
    { "id": "relay.launch-receipt/v2", "digest": "…" },
    { "id": "relay.result/v2",         "digest": "…" },
    { "id": "relay.rpc/v1",            "digest": "…" },
    { "id": "relay.run-state/v1",      "digest": "…" },
    { "id": "relay.run/v2",            "digest": "…" }
  ],
  "methods": ["contracts", "control", "inspectRun", "listRuns", "start", "subscribe", "validate"],
  "notifications": ["event", "runStateChanged"],
  "executor_kinds": ["process"]
}
```

- **`protocols` 是 `{id, digest}` 对，不是裸名字数组**（批次检查点 2 小审 D-26 缺口 A，findings F-033）。**为什么**：`"relay.run/v2"` 只是个名字，两个 Runtime 各自对着**不同修订版**的同名协议编译，指纹会**完全相同**。这不是假设——**本批之内 `relay.run/v2` 就实质变过两次**（F-012 的 `$ref` 全量重写、D-11 的 `required` 由可选改必填）。设想按 D-11 之前的 schema 构建的客户端对上之后构建的 Runtime：两边都报 `relay.run/v2` ⇒ 指纹相同 ⇒ **握手通过** ⇒ 然后 Runtime 拒掉客户端发来的每一个节点（缺 `required`）。而 `reason-codes.md` 给 `E_CAPABILITY_MISMATCH` 的理由原话正是「**能力集不同 = 双方对"能做什么"的理解不同**」——上面这个就是理解不同，裸名字认不出来。`digest` = 该 schema 文件全文的 `sha256(JCS(...))`。
  - v0 形状**不计入**——它们尚未冻结，计入会让能力指纹随未定形状漂移。
- **`_shared/relay.common.v1.schema.json`（`relay.common/v1`）必须计入**（E2 代码复核轮 2 · P2-1）。与「v0 不计入」是同一条理由的两面：v0 未冻结所以排除，**共享模块已冻结且承重**所以必须纳入。实际约束面的大半在它里面——`locator` / `timestamp` / `sha256` / `run_id` / `node_id` / `attempt_id` / `executor_kind` / `executor_profile` / `reason_code` / `trigger` / `observation_status`。 **漏掉它就是 F-033 缺口 A 下沉一层**：E2 实测把 `locator.pattern` 改成 `^.*$`（G5 全域绝对路径禁令**彻底失效**）之后，`capability_hash` **逐字未变** ⇒ 两个带着完全不同 locator 约束的 Runtime 能握手成功，然后互相拒对方的每一份载荷。故 `protocols` 是 **7 份顶层协议 + 1 份共享定义模块 = 8 条**。
- `methods`：`relay.rpc/v1` 的 `$defs.method` 枚举中本 Runtime 实际实现的子集。
- `notifications`：`$defs.notification.method` 枚举中本 Runtime 实际推送的子集。
- **`executor_kinds`：本 Runtime 实际能托管的 `executor_kind` 子集**（小审 D-26 缺口 B）。**为什么必须有**：只实现 `process` 的 Runtime 与另外还实现了 `dsh-agent`/`pi-agent`/`herdr-agent` 的 Runtime，前三个键**完全相同 ⇒ 指纹相同**；客户端于是能把一个声明了 `dsh-agent` 的 Run 交给一个根本托管不了它的 Runtime，失败发生在运行期而不是握手期。**这条在 P5 特别活**：`pi-agent` 是 DevPlan §4.2 明列的 **P5-X 条件项、非必达**——也就是说**两个都合规的 P5 构建**（一个带 Pi Adapter、一个不带）在没有本键时指纹一模一样。ADR-002 整篇讲的都是 executor 宿主归属，能力指纹里不能没有 executor 维度。
- **四个数组均按 UTF-16 码元升序排序后再计算**（JCS 只规定对象键序、不规定数组序，故数组序必须在此显式规定）；`protocols` 按 `id` 排序。

**上例即"只托管 process 的最小 P5 参考实现"的清单形状**（7 份已冻结协议 + 全部 7 个 method + 2 个 notification + 1 个 executor kind），可直接用作参考实现的自检基线；`digest` 的具体值已由 `tools/capability-baseline.mjs` 算出并固定在 **`capability-baseline.json`**（代码根顶层），接进 `npm test`。

> ⚠️ **本句原写「由批 3 的校验器算出并作为回归基线固定下来」，而批 3 没做**（E4 需求复核 P1-1 + E2 代码复核 P3-3 抓出）——这是本卡「写进冻结契约文档的交付承诺静默没做」的**第四次**（F-047 的 manifest 是第一次）。当时的状态是：有口径散文、有 JCS 实现，唯独没有那个**让两边能对上的参考值**——而 §一 自己写的失效后果正是「握手永远 `E_CAPABILITY_MISMATCH`」，DHR_29 与 DHR_30 各自实现握手时谁都无法验证自己算对了。现已补齐。
>
> **它同时是 12 份契约的 digest 基线**：`fixtures/manifest.json` 钉的是 55 份 fixture，`contracts/` 一份都没钉，而 schema 才是本卡真正冻结的工件。红测已验：只在某份 schema 的顶层 `description` 末尾加一个空格 → `exit 1`。下面那条「改一个错别字也是能力变更、也会断握手」的规定，现在是机器可证的，不再只是一句话。
>
> 参考基线取「只托管 `process` 的最小 P5 参考实现」。带 Pi Adapter 或 DSH Native 的 Runtime 算出的是**另一个**指纹——那正是 `executor_kinds` 这个维度存在的全部理由（D-26 缺口 B）。

> **暂未纳入（记录备查，不建议现在加）**：Runtime 能发出的 reason code 集合；`subscribe` 是否支持从指定 `seq` 续订。二者对互操作的判别力弱于上述四键，且都会在 P6/P7 随功能增补自然进入 `methods` 维度。

### `digest` 覆盖 schema 全文——这是有意的，代价必须接受

`protocols[].digest` 对该 schema **文件全文**取摘要，**包含 `description` / `$comment` / `title`，不剥离**。

**为什么不剥**（第 5 轮小审 Q2 给出的决定性论据）：**在这份契约里，`description` 不是散文，它承载规范性条款**——

| 规范性条款 | 唯一落点 |
|---|---|
| G2 的七档聚合优先级 | `run_status.description` |
| G4「`null` 不得渲染成 1」 | `attempt.description` |
| `group` 的六条映射口径与"无裁量"理由 | `group.description` |
| locator pattern 的实装口径与从严取舍 | `locator.description` |
| `node_states` 须覆盖 `nodes` 全集 | `node_states.description` |
| H6 断言的语义 | `then.$comment` |

若 digest 剥掉 `description`，那么**把 G2 的优先级从「`failed > running`」改成「`running > failed`」，指纹不变**——两个实现算出不同的 `run_status`，握手却认为能力一致。**这正是本文件 §三 缺口 A 刚修掉的问题换个位置复发。**

**代价（明确接受，不是 bug）**：契约文件的**任何一次编辑，包括改一个错别字，都是能力变更、都会断握手**。这是"契约文件是冻结工件"的直接推论。

**由此确立的操作纪律**：

1. **契约文件不做随手润色。** 文字修订与协议修订**同等对待**，走版本流程、批量发布，不搞"顺手改个措辞"。
2. **改动契约文件后必须重算 `digest` 并同步双方**，否则握手会以 `E_CAPABILITY_MISMATCH` 拒绝——这是设计意图，不是回归。

> **长期方向（记录，不在本卡做）**：另一条路是「剥离 `description` + 硬性规定规范性条款不得只存在于散文里」。设计上更干净，但要求把 G2 七档、G4 纪律、`group` 映射等**全部结构化成机器可校验的形式**——是一次大重构，远超本卡范围。**既然"改字就断握手"，本身就是在倒逼这件事**，可作为 P6/P7 的演进方向。

> **与 P7/P8 的关系**：增补 `attention` / `approve` 等 method、或冻结任一 v0 形状，都会改变本清单 ⇒ `capability_hash` 随之变化 ⇒ 旧客户端握手被 `E_CAPABILITY_MISMATCH` 拒绝。**这是设计意图，不是回归**（见 `reason-codes.md` §六对 `E_UNKNOWN_METHOD` 的说明：不为未来方法预留宽容通道）。

## 四、留给下游

| 项 | 承接 | 说明 |
|---|---|---|
| JCS 的参考实现与一致性测试 | **批 3** | 校验器侧至少提供一个 JCS 实现，并对本文件 §三 的样例清单跑出可复算的固定 digest 作为回归基线 |
| `plan_digest` 的字段级最终形状 | **P6/P7** | `relay.resolved-plan/v1` 冻结时；**口径（JCS + 排除 `plan_digest`/`resolved_at`）本卡已定死，届时不得另立** |
| v1↔v2 摘要不可互认的登记 | **已登记** | 见 §一"与 v1 现役口径的关系"，兼容矩阵按改型处理 |
