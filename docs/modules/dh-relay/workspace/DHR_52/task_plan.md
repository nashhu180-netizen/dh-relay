<!-- dh:v1 -->
# task_plan — DHR_52

## 要读的上下文 (Context Packet) ★前置

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `docs/modules/dh-relay/dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md` §3.2 DHR_52 | 目标、四条验收、范围与 F-057 决策边界。 |
| C-002 | `relay-core/contracts/relay.rpc.v1.schema.json`、`reason-codes.md`、`OPEN-POINTS.md` | 冻结信封、通知条件分支、RPC reason codes 与不可收窄的开放点。 |
| C-003 | `relay-core/tools/{validate,capability-baseline}.mjs`、`capability-baseline.json` | 复用现有 schema 校验与 8 份协议指纹算法，不另算一套 hash。 |
| C-004 | `relay-core/runtime/{host,lease}.mjs`、`store/store.mjs`、`test/{runtime,store}.test.mjs` | 宿主/账本的唯一真相与断连不得 cancel 的可观察断言。 |
| C-005 | `docs/modules/dh-relay/as-built/relay-core.md` §3.5~§3.6、§6.4 与 `DHR_51/findings.md` F-107 | RPC 不冒充宿主身份、不扩写 host-lease 内部形态。 |

## 施工步骤 (Steps)

| # | 改动文件（Create/Modify/Test） | 怎么改（签名级） | 怎么验（命令 → 预期） |
|---|---|---|---|
| 1 | Read/Test · `contracts/relay.rpc.v1.schema.json`、`test/contracts.test.mjs` | 先写红色运行期用例：合法格式但不同的 capability hash 必须被运行时拒绝；复核 schema 仍只校验形态，不能把运行期比较错塞回 schema。 | `node --test test/rpc.test.mjs` → capability mismatch 先红。 |
| 2 | Create · `rpc/capabilities.mjs` | 从现有 `capability-baseline.json`/工具导出或复用同一计算口径，提供 Runtime capability snapshot 与严格相等比较；不得复制一套不同的 canonicalization。 | 参考结果与 `capability-baseline.json` 完全一致；篡改 executor kind 或 digest 后不一致。 |
| 3 | Create · `rpc/transport.mjs` | 实现仅本地端点选择（Windows pipe / 非 Windows UDS）、NDJSON 一帧一对象、长度/JSON/信封失败映射 `E_TRANSPORT_FRAME_INVALID`；端点清理不越出 run root。 | 分帧、坏 JSON、两行帧、连接关闭用例均确定性完成。 |
| 4 | Create · `rpc/server.mjs` | `createRpcServer({ runId, store, capability, endpoint, handlers })`：先按冻结 schema 验信封，再比较 capability，随后只分派已有 method 枚举；断连只取消订阅者，不写 Store、不发 cancel。handlers 为注入 seam，不定义 Read Model 或 per-method schema。 | 连接→握手→订阅→关闭→重连：events/state signature 与关闭前逐字相同。 |
| 5 | Test · `test/rpc.test.mjs` | 覆盖 capability mismatch、未知方法、断连零写入、完整 `event`/`runStateChanged` 通知及三种 F-023 反例；用真实本地 socket/pipe，不用 mock 代替 transport。 | `node --test test/rpc.test.mjs` → 全绿；完整测试显式列出四个 test 文件。 |
| 6 | Read/Decision · `contracts/reason-codes.md`、F-057 | 构造「同协议版本但将 A 协议对象发送到 B 协议位置」反例，比较 `E_BAD_VALUE`、`E_UNSUPPORTED_VERSION` 与候选 `E_PROTOCOL_MISMATCH` 的可操作边界；先落 `findings.md`。只有主控确认需要改冻结契约时，才按三件套进入条件分支。 | 证据写入 `progress.md`；未确认时 contracts 与三份基线零 diff。 |
| 7 | Modify · `as-built/relay-core.md`、`workspace/DHR_52/{progress,findings,review}.md` | 记录实际模块边界、连接断开语义、F-057 裁决与全部可重跑证据；不把未实施的 CLI/Adapter 写成已有。 | `npm test` + `node --test test/rpc.test.mjs` + validate/audit/fixture/capability 五闸，全量结果逐项落账。 |

## 关键决策

- Worktree：是，分支 `wt/DHR_52`，目录 `.dh-worktrees/DHR_52`，只从本地 `master` 当前 HEAD 建；不用会落后 16 个提交的 `origin/master`。
- 施工 worker：OMP `deepseek-v4-flash`，只可写 `relay-core/rpc/**`、`relay-core/test/rpc.test.mjs` 和本工作区过程账；不改主干或冻结契约。
- F-057：先证据后裁决。默认保持 `E_BAD_VALUE` 的既有边界；是否新增码不由 worker 自主决定。
