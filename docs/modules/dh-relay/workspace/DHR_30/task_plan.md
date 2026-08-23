<!-- dh:v1 -->
# task_plan — DHR_30 Relay CLI 与可选 DSH/Pi Bridge

## 要读的上下文 (Context Packet) ★前置

| ID | 来源 (path / url) | 为什么 |
|----|------------------|--------|
| C-001 | `dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md` §2.1、§2.3、§3.2 DHR_30 | 命令面、验收、精确边界与 DHR_50 条件。 |
| C-002 | `relay-core/README.md`、`docs/modules/dh-relay/as-built/relay-core.md` | 冻结协议、基线闸和 DHR_29/51/52 的既有实现接口。 |
| C-003 | `relay-core/contracts/v1-gap-disposition.md:107-113` | Read Model 字段冻结起点和不可静默漂移规则。 |
| C-004 | `relay-core/rpc/server.mjs`、`relay-core/rpc/transport.mjs`、`relay-core/test/rpc.test.mjs` | 现有 RPC server/transport seam 与真实 socket 测试样板。 |
| C-005 | `workspace/DHR_26/` findings 与 `src/dsh-host/README.md` | 条件执行 Bridge 的 DSH 插件装载、公开 API 与零 bare-import 约束。 |

## 施工步骤 (Steps)　★详细级

| # | 改动文件（Create/Modify/Test + 路径:行） | 怎么改（代码片 / 签名） | 怎么验（命令 → 预期输出） |
|---|------------------------------------------|----------------------|--------------------------|
| 1 | Test · `relay-core/test/cli.test.mjs`（新建）；Modify · `relay-core/package.json` | 先为七条 CLI 命令、`--json`、文本/JSON 同源、RPC 握手和无 DSH 依赖写失败的端到端客户端测试；只在测试确实纳入默认门面时精确修改 `scripts.test`。 | `cd relay-core; node --test test/cli.test.mjs` → 初始断言失败。 |
| 2 | Create · `relay-core/cli/`（客户端、Read Model 与 renderer）；Modify · `relay-core/package.json` | 用 `createTransportClient` 构建单一 RPC client；命令映射仅为 `listRuns/inspectRun/subscribe/start/control`，文本与 JSON 都先取得同一 Read Model 再渲染；实现 legacy 只读发现与拒绝 resume。 | `node --test test/cli.test.mjs` → CLI 回归转绿；`npm test` → 全量转绿。 |
| 3 | Test/Modify · `relay-core/test/cli.test.mjs`、`relay-core/cli/` | 钉 control 的 request_id 幂等/唯一 Receipt、断连零 cancel 和重连同态；若现有 server 缺少 DHR_30 所需的已冻结方法接口，先在 findings 记边界，不把 Runtime 业务逻辑塞进 CLI。 | 定向真实 socket 用例 → 绿；`node tools/validate.mjs --selftest`、`npm test` → 绿。 |
| 4 | Create · `relay-core/adapters/dsh-bridge/`、`relay-core/fixtures/clients/`；Test · adapter/client fixtures tests | 依据 DHR_26 资料以 RPC adapter 实现查询/订阅/重连/窄控制，禁止 Store 导入与 DSH 私有类型入协议；提供 Pi/通用 client JSON fixture 与可复跑解析例。 | adapter/client 定向测试 → 绿；真实 DSH 页面截图库或等价渲染证据 → 可审。 |
| 5 | Modify · `docs/modules/dh-relay/design/06-多控制面与Headless-SSH运行-设计补充.md`；Modify · `dev_plan/P4-DSH工作台最小Pilot-开发方案.md` §0.2 | 在 design/06 增字段级 Read Model 定义和 `whitelist-exception-closed: DHR_30`；P4 §0.2 仅机械回注同一标记回链。 | 两端 `rg -n "whitelist-exception-closed: DHR_30"` → 各命中；Read Model 镜像断言 → 绿。 |
| 6 | Record · `workspace/DHR_30/{progress,findings,review}.md`；Modify · `as-built/relay-core.md` | 跑全量基线、批次小审与收口证据；逐条记录 DHR_50 的约束和 Bridge 截图，不改 DHR_31。 | `npm test`、validator、audit、fixture manifest、capability baseline、`git diff --check` → 全绿。 |

## 关键决策（一句话各一行）

- Worktree：是，分支 = `wt/DHR_30`，基点 = 本地 `master` `888c472`。
- 派子 agent：否；本卡施工由主会话完成。
- Review：按存量标准档，收口前两轮独立换人复核，另做需求/教训/一致性复核。
