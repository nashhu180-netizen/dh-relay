# reason codes — relay v2

> **形态约束**：`^E_[A-Z0-9_]{2,62}$`（`_shared/relay.common.v1.schema.json#/$defs/reason_code`）。schema 只约束形态、不内联全集——否则每加一个码就要改 7 份 schema。**本文件是全集的唯一权威来源。**
>
> **总纪律**：拒绝就是拒绝。**不得降级放行、不得按交集工作、不得静默兜底。**（P5-M6：协议版本、能力和未知输入均 fail-closed）

## 一、fail-closed 三条（DHR_28 验收口径第 1 条的直接落点）

| code | 何时报 | 为什么不能宽容 |
|---|---|---|
| `E_UNKNOWN_FIELD` | 载荷含 schema 未声明的字段（**除 `OPEN-POINTS.md` 登记的 3 处有意开放点外**，全域 `additionalProperties: false`） | 未知字段常常是"新版本客户端在说旧版本听不懂的话"。放过它 = 单方面假设语义兼容，而真相账不能建立在假设上。v1 已是同口径（`unknown-field:<key>`），v2 继承 |
| `E_UNSUPPORTED_VERSION` | **判别字段**（`relay.rpc/v1` 握手叫 `protocol_version`，其余 6 份协议叫顶层 `protocol`）取值是**同名协议的另一个版本**，如 `relay.run/v3` ← `relay.run/v2` | 同上，且更硬：版本不认识意味着**连字段含义都不确定**。v1 同口径（`schema_version` 精确等于 `relay/v1`，`-cne` 大小写敏感）。⚠️ **与 `E_BAD_VALUE` 的分界（批次检查点 3 小审 P2-1）**：判别字段**异名**（`relay.run-state/v1` 收到 `relay.event/v2`）不是版本问题、是**发错了协议**，报 `E_BAD_VALUE`——两者给客户端的行动不同（前者去升级，后者去改发送目标），混在一起等于让对方猜。首版只对 `protocol_version` 一个字段映射本码，于是 7 份协议里 6 份的未来版本落进 `E_BAD_VALUE` 兜底桶，同一份载荷按调用方式不同还会给出两种码 |
| `E_CAPABILITY_MISMATCH` | 握手 `capability_hash` 与 Runtime 不符 | 能力集不同 = 双方对"能做什么"的理解不同。按交集工作看似友好，实则让客户端以为某能力存在而它并不存在 |

## 二、start 前置

| code | 何时报 |
|---|---|
| `E_GITIGNORE_MISSING` | 目标业务仓未忽略 Run Store 根（`.dh-relay/`），start 拒绝。**Relay 不得自行修改业务仓 `.gitignore`**（DevPlan §2.2），只能拒绝并告知。判定须按 Git 的忽略语义（如 `git check-ignore`），**不得字面量匹配单一模式**——见 workspace/DHR_28 findings F-009：本仓用的是任意深度模式 `.dh-relay/`，字面量找 `/.dh-relay/` 会假阴性 |
| `E_RUN_ID_INVALID` | `run_id` 不符规范化口径（design/02 B7 D23） |

## 三、契约结构类（校验器直接产出）

| code | 何时报 |
|---|---|
| `E_MISSING_FIELD` | 缺必填字段。v1 同口径 `missing-field:<key>` |
| `E_BAD_TYPE` | 类型不符。v1 同口径 `bad-type:<key>` |
| `E_BAD_VALUE` | 类型对但取值非法（格式、范围）。v1 同口径 `bad-value:<key>` |
| `E_UNKNOWN_ENUM` | 枚举取值不在允许集内。v1 同口径 `unknown-enum:<key>` |
| `E_ABSOLUTE_LOCATOR` | locator 类字段携带绝对路径（Windows 盘符 / UNC / POSIX 绝对 / 带 scheme 的 URI）。承接 `v1-gap-disposition` **G5** ——v1 的 `brief_ref` 是自由字符串、无此约束，P4 冻结时被迫做授权改写 |
| `E_DSH_ONLY_REQUIRED_ROLE` | 必经角色（`required: true`）的 `executor_profiles` 里**只有** `dsh-agent`。这是 design/06 **H6** 的契约层拒绝，**在 schema 层发生、不是运行时检查**——对应 DHR_28 验收口径第 3 条 |

## 四、幂等与冲突（design/02 B1 / B6 / B11）

| code | 何时报 |
|---|---|
| `E_REQUEST_CONFLICT` | 同一 `request_id` 但请求摘要不同。**重复且摘要相同 → 返回同一 receipt，不是错误**；摘要不同才是冲突，且不得静默覆盖 |
| `E_CHECKPOINT_CONFLICT` | 同一 `checkpoint_id` 但 `payload_digest` 不同 |
| `E_TERMINAL_STATE_CONFLICT` | 试图改写已定终态。已定终态不可变——迟到结果只能进隔离区 |
| `E_IDENTITY_MISMATCH` | 结果/检查点的 `receipt_id` 与当前 Attempt 的回执不符 → 按 B11 隔离（`quarantined: true`），保留可追溯、可人工裁决，**但不改写已定终态** |
| `E_LEASE_HELD` | 第二个宿主试图取得同一 Run 的写权，而 lease 未过期。唯一写者由 lease 保证（P5-M3，DHR_29 承接） |

## 五、Executor 生命周期（ADR-002 四问的直接产出）

| code | 何时报 | 出自 |
|---|---|---|
| `E_EXECUTOR_EXIT_NONZERO` | process executor 子进程自己以非 0 退出 | 第①问 |
| `E_EXECUTOR_KILLED` | process executor 被外部杀死 | 第①问 |
| `E_EXECUTOR_ADAPTER_LOST` | pi-agent 的冻结 Adapter 进程消失。**不假设 Pi 侧会话可续**——按 H12 开 fresh Attempt，不把旧会话后续输出续写进旧 Attempt | 第②问 |
| `E_EXECUTOR_HOST_LOST` | 承载 Executor 的宿主消失（DSH Native Agent 场景）。**必须与"DSH 作为控制客户端断开"严格区分**——后者绝不产生任何 Executor 码，也不动 Run（design/06 **H4**） | 第③问 |
| `E_EXECUTOR_ORPHANED` | Runtime 恢复后按 ref 探活/重连失败，确认该 Attempt 已无宿主 → 判 `orphaned` + 开 fresh Attempt | 第①②③问共用 |

> **v1 已有先例**：v1 `result` 的 `interruption_reason` 枚举含 `host_lost`（另有 `stopped_by_user` / `unknown`）——v2 的 `E_EXECUTOR_HOST_LOST` 是它的**语义收窄版**：v1 的 `host_lost` 混合了"会话没了"和"执行方没了"，v2 按 **G6** 拆开，只有确认 Executor 消失才用本码；观测中断走 `relay.host-observation/v1` 的 `observation_lost`，**不产生任何 reason code、不判 Attempt 死**（ADR-002 第④问）。

## 六、RPC 层

| code | 何时报 |
|---|---|
| `E_UNKNOWN_METHOD` | 方法不在 `relay.rpc/v1` 的枚举内。**不为未来方法预留宽容通道**——P7/P8 增补 attention/approve 时 `capability_hash` 随之变化，握手自然拒绝旧 Runtime |
| `E_TRANSPORT_FRAME_INVALID` | NDJSON 帧不可解析或不符 JSON-RPC 2.0 信封 |

## 汇总

共 **23** 个码（去重实测：`grep -oE '\bE_[A-Z][A-Z0-9_]+\b' reason-codes.md | sort -u | wc -l` → 23），覆盖 fail-closed 三条、start 前置、契约结构、幂等冲突、Executor 生命周期、RPC 六类。

**新增码的规矩**：加码必须同时 ①写进本表 ②在 `fixtures/negative/` 加一份能触发它的反例 + `.expect.json` ③说明它与既有码的边界（尤其别和 `E_EXECUTOR_HOST_LOST` / `observation_lost` 的分界线混淆）。
