# 有意开放点清单（intentional open points）

> **为什么有这份文件**：`contracts/` 的总纪律是 fail-closed —— 未知字段一律拒绝（`additionalProperties: false`）。但有少数位置**故意**留开口。批次检查点 2 小审（`cp2-DHR28`）用 AST 遍历逐个 object 节点扫描后指出：文档里"全域 `additionalProperties: false`"是**不实陈述**，且开口未在任何地方登记（findings F-014）。本文件就是那份登记。
>
> **规矩**：`contracts/` 下每一处 `additionalProperties: true` 或缺省开放，**必须**在此登记，写明①位置②为什么开③谁在何时收窄。未登记的开口视为缺陷。批 3 步 14 的静态检查按本清单做白名单。
>
> **注意一类不算开口的情形**：`if` / `then` 子 schema 内没有 `additionalProperties` 是**正确写法**，不是遗漏——在 `if` 里加会让 `if` 恒不匹配，在 `then` 里加会把整个实例判死。小审已逐个确认这类共 8 组（event 4、run 2、run-state 1、result 1）写法正确。

## 清单

| # | 位置 | 形态 | 为什么开 | 谁在何时收窄 |
|---|---|---|---|---|
| **O-1** | `relay.result.v2.schema.json` → `properties.structured` | `additionalProperties: true` | **协议业务域无关这条硬约束的唯一泄压阀。** v1 把 `git_snapshot` / `changed_paths` / `tests_run` 写进契约必填（隐含假设"任务=改代码"）；v2 要中立就必须有一个通用载荷兜住领域特定的结果数据。代价已在 `compat-matrix.md` §4 如实登记：v2 不再对 git 证据做结构校验，该责任移交 Workflow 层。 | **不收窄**（有意长期开放）。但见下方「O-1 的已知代价」——需要 Workflow 层补校验，协议层不承诺。 |
| **O-2** | `relay.rpc-methods.v1.schema.json` → `$defs.validate_params.properties.document` | `additionalProperties: true` | `validate` 的被校验文档天然是任意 JSON 对象；它不携带 Runtime 状态，且由所选 contract 自己校验。 | **不收窄**（协议验证的必要输入）。 |

### 已收窄（本卡内根据小审意见修掉，不再是开口）

| 原位置 | 原形态 | 处置 |
|---|---|---|
| `relay.rpc.v1.schema.json` → `$defs.notification.properties.params` | 曾为 `additionalProperties: true` 且**零说明** | **已收窄**。推送只有两种载荷（`event` → `relay.event/v2`、`runStateChanged` → `relay.run-state/v1`），而这两份 schema 本卡已冻结——留开口是纯粹少做一步。现改为 `allOf` + `if/then` 按 method 分别 `$ref` 到对应协议。小审原话："最站不住"，判断成立。 |
| `relay.rpc.v1.schema.json` → `$defs.request.properties.params` | 曾为 `additionalProperties: true` | **DHR_30 已收窄**。全部七个已枚举 RPC method 由 `relay.rpc-methods/v1` 的一一对应闭合参数对象约束；`allOf` 分支与 method 枚举必须同批维护。 |

> **关于该位置的审计口径**：`tools/audit-contracts.mjs` 是**节点级**遍历，看不到同级 `allOf` 的条件收窄，因此它仍会把 `notification.properties.params` 报成"节点上开着"。脚本里用单独的 `CONDITIONALLY_NARROWED` 名单把它与"有意开放点"区分开，报告为「被 allOf/if-then 条件收窄（实际闭合）」。**它不是开放点**——`method` 枚举只有两个值，两条 `if/then` 必有其一命中，而两个 `$ref` 目标自身都是 `additionalProperties: false`。
>
> ⚠️ **维护约束（批次检查点 2 小审 D-17，findings F-023）**：该位置的闭合**完全依赖「`method` 枚举值与 `if/then` 分支一一对应」**。当前严密（两值两分支全覆盖），但 **P7/P8 若往 `method` 枚举加第三个值而忘了加对应分支，`params` 会静默退回完全开放**，且静态扫描看到的仍是"缺省开放"、分不清是有意还是漏了。**加 notification method 值时必须同批加 `if/then` 分支**，并复跑 `tools/audit-contracts.mjs`。
>
> 📌 **语义决定（DHR_29 实现 subscribe 时按此办）**：本收窄意味着推送帧的 `params` 必须是**完整自描述的协议对象**（含 `protocol` 常量、通过对应协议的全部必填校验），**不能只推增量字段**。小审已实测：`method=event` 塞 run-state 载荷、或载荷缺 `protocol`、或含未知字段，三者均被拒。

## H6 契约断言的两条边界（批次检查点 2 小审提出，非缺陷但须留痕）

`relay.run/v2` 的 `if/then` + `contains` 在 schema 层拒绝「必经角色只声明 `dsh-agent`」——这一点已由小审独立写求值器实跑 14 例确认成立（另见 findings F-019）。但它**不是** design/06 H6 的完整兜底：

> **先说已修掉的那一条**：`required` 原本是**可选 + `default: false`**，意味着 H6 是 **fail-open by default**——实现只要不标 `required`，这条安全断言一次都不触发。批次检查点 2 小审 D-11 实测两个 payload 通过（应拦却放行），并指出本卡自己在 G1/G3 用的推理（「可选会让所有实现都省掉它、降级重新变成常态」）对本字段**更适用**：`title` 缺了只是屏幕难看，`required` 缺了是安全断言整个静默失效。**已改为必填**（`$defs/node` 的 `required` 列表含 `"required"`），语义不变（标 `false` 照样不触发），但消灭了"忘了标 = 不检查"这条静默路径。见 findings F-022。

以下两条是**改成必填之后仍然存在**的固有边界：

1. **schema 判不了「结构性必经」（DAG 可达性）。** 显式规避（把所有节点标 `required: false` 再全用 `dsh-agent`）现在至少**留痕可查**——必填强制作者写下这个声明。但下面这种更隐蔽的形态 schema 依然拦不住，且**它不是故意规避，是诚实实现者会自然写出的形状**：

   ```json
   "nodes": [
     { "node_id": "gate",  "title": "闸", "role": "复核", "required": false,
       "executor_profiles": [{ "kind": "dsh-agent", "ref": "bridge/dsh" }] },
     { "node_id": "final", "title": "终", "role": "执行", "required": true,
       "depends_on": ["gate"],
       "executor_profiles": [{ "kind": "process", "ref": "bin/x" }] }
   ]
   ```

   `gate` 是 DSH-only，`final` 依赖它——`gate` 在 DAG 上**事实必经**（它不过，`final` 永远跑不了），但作者以为"标了 `final` 就够了"，H6 一次都没触发。DSH 一没整条 Run 卡死，正是 H6 要防的事。
   **JSON Schema 表达不了图的传递闭包，这条只能移交 Workflow 定义层。** ⇒ **移交 DHR_30 / DHR_31：被必经节点（传递）依赖的节点，自身也应视为必经**；Workflow 定义期须做可达性推导后再校验 H6。**DHR_30 / DHR_31 不要以为 H6 已被 schema 完全兜住。**

2. **只拦 `dsh-agent` 这一个字面量，不拦"实质 DSH-only"。** 两种形态：①若将来 `executor_kind` 加入其它依赖 DSH 宿主的值，`not: {const: "dsh-agent"}` 不会自动覆盖——**加 `executor_kind` 枚举值时必须回头检查这条断言**；②`{kind: "process", ref: "bridge/dsh-shim.exe"}` 会被判为合法的非 DSH Executor，但实际仍吊在 DSH 上。第②种 schema 层无解（ref 是不透明 locator），属固有边界。

## 交给 DHR_29 的四条已知缺口（E14 一致性复核登记，非本卡缺陷）

这四条都是「本卡冻结的东西留下的口子」。写在这里，比让下游重新发现便宜。

### K-1 · `waiting_human` 在已冻结的七份契约里没有产生者（F-E14-11）

`run_status` 与 `node_state.status` 都枚举了 `waiting_human`，`allOf` 条款③还机器强制了它的聚合位置——但**没有任何已冻结协议能产生这个状态**：`relay.event/v2` 没有对应的 event kind；`relay.checkpoint/v2` 的 `phase` 是自由字符串、没有 `decision_required` 常量；唯一的产生者 `relay.attention/v1` 的 `category: needs_input` 落在**未冻结的 v0 形状**里。

**为什么现在写下来**：P5-M3 要「强杀 Runtime 后从 Store 重建相同状态签名」。若状态只能从事件回放重建，而 `waiting_human` 没有事件能产生它，那这个状态要么重建不出来、要么得靠 Store 里的非事件数据——DHR_29 设计恢复路径时必须先回答这个。P7 冻结 attention 时一并收口。

> ✅ **DHR_29 已裁决（K-1 结账，2026-08-22）**：走裁决①——批次 1 已为 `relay.event/v2` 增补 `human_input_requested` 事件 kind 并以 `if/then` 强制其携带 `node_id`（见该 schema 的 `$comment`「DHR_29 K-1」）；Store 回放把该事件投影为 `waiting_human`，状态可从事件账重建。P7 Attention 对象仍未冻结、本条不预冻结它；正文上段的现状描述就此成为历史记录。

### K-2 · v1 的 `stale` 判定依赖 `attempt_id` 的整数序，v2 的 `attempt_id` 是不透明串（F-E14-10）

v1 用 `attempt_id -lt` 比大小区分「陈旧结果」与「被拒结果」（`stale` vs `rejected`）；v2 的 `attempt_id` 改成不透明字符串后**无序**，这个机制直接没了。兼容矩阵 §6 只写了「复验不弱于 v1」，没点名这个具体机制。


**可恢复**：`relay.event/v2` 有单调 `seq`，能提供序。但 DHR_29 得知道要去找它——点名一句能省半天。（顺带：v2 把 `stale` 与 `rejected` 合并成了 `late_result_quarantined`，兼容矩阵 §4b 已如实登记这个信息损失。）
> ✅ **DHR_29 已裁决（K-2 结账，2026-08-22）**：按本条预告落点实现——迟到判定挂 `relay.event/v2` 的单调 `seq`（receipt 签发时记 `issued_seq`，当前回执 = 该节点 `issued_seq` 最大者），与 `attempt_id` 的字典序完全解耦；反例（attempt 字典序与 seq 相反的两份迟到结果）钉在 `store.test.mjs`。v1 的 `stale`/`rejected` 二分在 v2 合并为 `late_result_quarantined`（§4b 已登记该信息损失）。

### K-3 · 身份 token 的 pattern 在 13 处逐字重复（F-E14-8）

`_shared/relay.common.v1` 只给了 `run_id` / `node_id` / `attempt_id` 三个 `$def`，而 `receipt_id`（3 份文件）/ `request_id`（2 处）/ `checkpoint_id` / `attention_id` / `approval_id` 全是**内联副本**。改一处漏一处是迟早的事。

**本卡不改的理由（如实说，不粉饰）**：加一个 `$defs/identifier` 让其余全部 `$ref` 过去是对的做法，但它会改动多份 schema 的全文摘要 ⇒ **`capability_hash` 变化**。按 `CANONICALIZATION.md` 的纪律，这类修订应与其他文字修订**一起批量发**，而不是在收敛轮末尾单独动。留给 DHR_29 的第一次契约修订批次一并做。

### K-4 · attention v0 形状的 `reason` 必填 与 reason-codes 的口径对撞（F-E14-7）

`relay.attention/v1`（v0 形状）的 `required` 含 `reason`（须是 `E_*` 码），`category` 含 `observation_lost` / `needs_input`；而 `reason-codes.md` 明写「观测中断……**不产生任何 reason code**」，且全表 23 个码里**没有**能给 `needs_input` 用的。两句直接对撞。

**P7 冻结 attention 时必须二选一**：要么 `reason` 改成可选（观测类 attention 不带码），要么补一个「需要人输入」类的码。现在写一行，比让 P7 重新发现便宜。

## O-1 的已知代价（不掩盖）

`structured` 开放意味着**两条硬约束在该字段内不由 schema 保证**：

1. **私有类型中立性**（design/05 §6.2）：`structured` 里可以塞 DSH / Pi / Herdr 的私有结构，schema 拦不住。
2. **locator 相对化**（v1-gap-disposition G5）：`structured` 里可以塞绝对路径，schema 拦不住。

这不是"忘了"，是"通用载荷"这个设计的固有代价。**处置**：
- 协议层**不承诺**这两条在 `structured` 内成立——本文件即为该不承诺的正式登记。
- Runtime（DHR_29）落盘 `structured` 时须复用 v1 `relay-redaction.ps1` 的口径做凭据脱敏（AGENTS 宪章#6 红线，`compat-matrix.md` §6 已移交）。
- Workflow 层若需要结构校验，自行定义并挂在自己的契约上，不要求协议层承担。

## 与文档口径的对齐

以下两处原写"全域 `additionalProperties: false`"，已改为"除 `OPEN-POINTS.md` 所列外全域"：

- `reason-codes.md` §一 `E_UNKNOWN_FIELD` 行
- `compat-matrix.md` §5 结论段
