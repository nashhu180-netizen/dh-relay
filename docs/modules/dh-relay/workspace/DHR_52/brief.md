<!-- dh:v1 -->
# brief — DHR_52 RPC 服务端与握手 fail-closed

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_52 | P5 Relay v2 持久内核与 DSH 桥接 | DevPlan §3.2 DHR_52（`DHR-B-15`） |

## 目标 (Outcome)

实现客户端中立的本地 RPC 服务端：Windows Named Pipe / Linux Unix Domain Socket 上用 NDJSON JSON-RPC 2.0 通信；每个 request 校验 `protocol_version`、`runtime_version`、`capability_hash`、`client_id`、`request_id`，指纹不符拒绝且不按交集降级；订阅推送完整的冻结协议对象；客户端断开不改变 Run 或事件账。

## Zero-context 自查

执行者须先读本文件、`task_plan.md`、DevPlan DHR_52 卡、`relay-core/README.md`、`docs/modules/dh-relay/as-built/relay-core.md` §3.5~§3.6、`relay-core/contracts/{relay.rpc.v1.schema.json,reason-codes.md,OPEN-POINTS.md,CANONICALIZATION.md}`、`relay-core/tools/capability-baseline.mjs` 与 `relay-core/test/{contracts,runtime}.test.mjs`。

三条硬边界：服务端只认冻结契约、不认客户端类型；不改 `package.json`、CLI、Adapter 或 Read Model；`request.params` 与 `response.result` 的开放点 O-2/O-3 保持原状，不以运行时实现偷渡 per-method schema。

## 完成条件 ★必写

| # | 条件 | 谁验（AI / 人） | 出处 |
|---|---|---|---|
| 1 | 两份 capability hash 不同但形态合法的握手被 Runtime 拒绝为 `E_CAPABILITY_MISMATCH`，不按交集降级；参考实现的指纹逐字匹配 `capability-baseline.json`。 | AI | DHR_52；DHR_28 F-064；P5-M6 能力分句 |
| 2 | 客户端断开、进程退出或模拟 SSH 断链均不生成 cancel；Run 状态和事件账逐字不变，重新连接可从 Runtime 取得同一状态。 | AI | design/06 H4；P5-M7 第一分句 |
| 3 | `subscribe` 的 `event` 与 `runStateChanged` 推送为完整自描述协议对象；交叉 payload、缺 `protocol`、未知字段均拒绝。 | AI | DHR_28 F-023；`relay.rpc/v1` notification 约束 |
| 4 | F-057 对「发错协议」是否需要 `E_PROTOCOL_MISMATCH` 有可复现事实、既有码边界与明确裁决；若需变更冻结契约，先停在决策点，不静默修改。 | AI + 主控裁决 | DHR_28 F-057；`reason-codes.md` |

## 边界 (Boundaries)

- In scope：`relay-core/rpc/`、`relay-core/test/`、`workspace/DHR_52/`；仅 F-057 经明确裁决后才可触及 `relay-core/contracts/` 与相应基线。
- Out of scope：`relay-core/package.json`、`runtime/`、CLI 与任何客户端 Adapter、正式 Read Model、attention/approve、per-method 参数 schema、O-2/O-3 收窄、DHR_30/31。
- 停止条件：需要越界修改 `runtime/` 或 `package.json`；需要新增/改动冻结 reason code/schema 而 F-057 尚未裁决；任一 P0/P1 连续三轮不收敛。

## 触及子系统

- `relay-core`：若实现形态改变现役快照，E7 更新 `docs/modules/dh-relay/as-built/relay-core.md` 的 RPC 小节。
