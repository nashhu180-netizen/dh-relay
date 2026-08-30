<!-- dh:v1 -->
# DHR_64 · Fresh Code Round 2 Review（Herdr）

## 身份、范围与方法

- 身份：fresh code round 2 reviewer；非主控，未参与 DHR_64 实现。
- 基线与候选：以 task_plan 冻结的 `33219fe` 为基线，审查当前 DHR_64 生产候选至 `4d7d0d6`；`ec8f718` 仅为既有代码轮 1 收口文档，不含生产变更。
- 范围：DHR_64 的 contracts、Store、v2 RPC/service、workflow driver、Herdr completion instruction、CLI、capability 生成接点及对应定向测试。未操作真实 Agent、registry、DHR_35、长服务或 `npm test`；未暂存、commit、merge 或 verify。
- 方法：读取仓根 `AGENTS.md`、DHR_64 workspace 全部任务/复核工件与 DevPlan P6 §3.2；逐项检查 `33219fe..4d7d0d6` 的生产 diff、Receipt/Result 原子账本、service 恢复 gate、driver 唯一写入路径、v2 授权与 CLI negotiation；扫描 Herdr 路径的 Result 写入点；执行 contract audit、capability baseline、自检和 DHR64 定向测试。

## P0

无。

## P1

无。

## 已核对的关键边界

- Store 仅从当前、完整的 `relay.attempt-receipt/v1` 派生 `herdr-agent` Result；旧 Receipt、fence、非当前 Attempt、非 Herdr profile、冲突终态和非匹配提交均被拒绝。Result、Attempt terminal event 与 state 由同一 mutation journal 提交，恢复时 ledger/result/Receipt 不自洽即 fail-closed。
- service 的启动预检在任何 actor/lease 前验证所有活动 Receipt-bound candidate；v2 submission 只能经过 matching driver gate，再由 actor 调用 Store。终态同 digest retry 走持久 ledger 校验，且不重新取得 lease。
- Herdr 的 done/idle、judge、capture、pane、host status 和 exit 不再产生 Result 或触发 quota/fallback；completion instruction 只提供闭集 Receipt submission。缺 submission 进入 `human_input_requested:E_EXECUTOR_RESULT_MISSING`。
- v2 RPC 仅在 contracts 授权后的连接上可用；CLI 明确使用 v2 bootstrap/capability/handshake，未发现 v1 静默降级。

## 运行证据

- `git diff --check 33219fe..4d7d0d6`：通过。
- `node relay-core/tools/audit-contracts.mjs`：通过（未登记开口、条件自验、引用、命名与 token 违规均为 0）。
- `node relay-core/tools/capability-baseline.mjs`：通过（20 contracts）。
- `node relay-core/tools/validate.mjs --selftest --json`：`57 pass / 0 fail`。
- `cd relay-core; node --test --test-concurrency=1 test/dhr64-result-bridge.test.mjs`：还原后完整终态 `10 pass / 0 fail / exit 0`。

## 有效单测·Mutation 记录

> 按本轮写入限制，本记录写在独立 round-2 原始报告中；未修改既有 `review.md`。

| 变异点锚点 | 原值 → 变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人 | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| `relay-core/store/store.mjs:708` | `executorKind !== 'herdr-agent'` → `executorKind !== 'process'` | 取消 Result bridge 的 Herdr executor kind 强制约束 | `DHR64 Store bridge: only a current receipt-bound submission commits a server result`（同一文件套件同时覆盖 recovery/driver/service bridge） | `cd relay-core; node --test --test-concurrency=1 test/dhr64-result-bridge.test.mjs` | `653F5C81A53A705114E3A0592F899E3FE54FECE4C3A5BBFD2076D12B0B0A226E` | `653F5C81A53A705114E3A0592F899E3FE54FECE4C3A5BBFD2076D12B0B0A226E` | fresh code round 2 reviewer | 红：目标 Store bridge test 失败，套件观测到 6 个失败；立即原样还原后绿：`10 pass / 0 fail / exit 0`。 |

## RULING

**RULING: PASS。** P0=0，P1=0。本结论仅为 DHR_64 fresh code round 2 的独立代码事实复核，不代替主控验收、verify、合并、发布或任何环境操作。
