<!-- dh:v1 -->
# brief — DHR_51-F225 lost-lease 初始化窗口维护

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_51-F225（维护） | P5 Relay v2 持久内核与 DSH 桥接 | DHR_51 P5-M3；DHR_52 findings F225 |

## 目标 (Outcome)

使宿主在 lease 已换手、但尚在初始化账本事件时，也按既有 lost-lease 语义停止并绝不释放接管者租约。

## Zero-context 自查

本维护不改变 DHR_51/DHR_52 的功能边界或协议：只把 `E_LEASE_HELD:lease-lost` 在 `runHostSession` 初始化写入期收敛成已定义的会话摘要；原回归用例是红例，修复后应绿。

## 完成条件

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| 1 | 接管在 `openStore` 后、首个 `lease_*` 事件落账前发生时，会话返回 `lost_lease=true`、`graceful=false`，不抛出未处理错误。 | AI | DHR_51 P5-M3；F225 |
| 2 | 旧会话不释放或覆盖 epoch=99 的接管者 lease。 | AI | DHR_51 P5-M3；F225 |
| 3 | `relay-core` 定向失租用例和全量 `npm test` 均通过，DHR_52 原 90 条集成闸恢复通过。 | AI | DHR_52 F225 处置 |

## 边界

- In scope：`relay-core/runtime/host.mjs`、`relay-core/test/runtime.test.mjs`、本维护工作区及 DHR_52 F225 证据回填。
- Out of scope：lease 文件格式、RPC/握手、契约/能力基线、DHR_52 验收口径、任何远端或环境操作。
- 停下问人：出现非 `E_LEASE_HELD:lease-lost` 的初始化错误需要吞没，或修复需改 lease/store API。

## 触及子系统

- `relay-core`：宿主失租处理语义；收口同步 as-built 与 DHR_52 F225。
