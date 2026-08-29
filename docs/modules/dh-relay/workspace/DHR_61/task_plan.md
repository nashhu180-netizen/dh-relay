<!-- dh:v1 -->
# task_plan — DHR_61

## 要读的上下文 (Context Packet) ★前置

> 执行者只按本文件、`brief.md` 与 P6 DevPlan DHR_61 施工；偏离路线只记 `progress.md`，不把 D3 或凭据操作带进本卡。

| ID | 来源 (path / url) | 为什么 |
|----|------------------|--------|
| C-001 | `docs/modules/dh-relay/design/11-P6身份与额度治理契约调整.md` D1/D2、P6-IQ-A1/A3/A5 | 冻结 Receipt、pause/retry、fence、Attention、journal 与 v1/v2 兼容语义。 |
| C-002 | `relay-core/contracts/relay.launch-receipt.v2.schema.json`、`relay-core/contracts/relay.event.v2.schema.json`、`relay-core/contracts/relay.rpc.v1.schema.json` | 保留旧 `launch-receipt/v2` 与 v1 endpoint，扩展有接收方的版本化合同。 |
| C-003 | `relay-core/store/state.mjs`、`relay-core/runtime/service.mjs`、`relay-core/runtime/workflow-driver.mjs`、`relay-core/rpc/server.mjs` | 定位当前事件投影、Receipt 签发、持久化与 RPC 接线，避免 DHR_34 越界承担。 |
| C-004 | `relay-core/test/store.test.mjs`、`relay-core/test/service.test.mjs`、`relay-core/test/rpc-service.test.mjs` 与 `relay-core/fixtures/manifest.json` | 复用现役测试入口并登记正反 fixture。 |
| C-005 | `docs/modules/dh-relay/workspace/DHR_34/findings.md` F-003/F-004 | 证明本卡是前置协议卡，DHR_34 继续 blocked-by 本卡。 |

## 施工步骤 (Steps)

| # | 改动文件（Create/Modify/Test + 路径） | 怎么改（代码片 / 签名） | 怎么验（命令 → 预期输出） |
|---|------------------------------------------|----------------------|--------------------------|
| 1 | Test/Create · `relay-core/test/*attempt*.test.mjs`、`relay-core/fixtures/{golden,negative}/**`、`relay-core/fixtures/manifest.json` | 先写 D1 红例：Attempt Receipt 身份四件套、六项 fallback snapshot 容量、v2 开立/重放一致性、敏感字段拒绝；保留 `launch-receipt/v2` golden 可读。 | `cd relay-core; node --test test/*attempt*.test.mjs` → 断言失败，原因指向缺失 Attempt Receipt 合同。 |
| 2 | Modify/Create · `relay-core/contracts/**`、`relay-core/profiles/**` 与 schema/fixture 定向测试 | 最小冻结 `relay.attempt-receipt/v1`、`relay.fallback-pause/v1`、fence、attention、resolution 及非敏感 profile/capacity validator；canonical detail 仍落现有 string event.detail。 | `cd relay-core; npm test -- --test-name-pattern "Attempt|Receipt|profile"` → 新旧 receipt/schema 断言通过。 |
| 3 | Test/Modify · `relay-core/test/store.test.mjs`、`relay-core/store/**` | 先钉 pause 同键幂等、冲突、截断、强杀恢复、`E_ATTEMPT_FENCED`；实现单事务 `appendFallbackPause` / resolution 与 journal 恢复屏障，重放同时导出 fence、`waiting_human`、Attention。 | `cd relay-core; node --test test/store.test.mjs` → 正反例通过；损坏/截断均拒绝而不开放 Run。 |
| 4 | Test/Modify · `relay-core/test/{service,rpc-service}.test.mjs`、`relay-core/runtime/{service,workflow-driver}.mjs`、`relay-core/rpc/**` | 先钉 v1 成功字节形态不变、Attention 只报既有错误形态；实现 bootstrap/v2 descriptor、v2 read model 与 `retry-with-profile` 的冻结快照/幂等检查，失败不得部分提交。 | `cd relay-core; node --test test/service.test.mjs test/rpc-service.test.mjs` → v1/v2、retry 与拒绝例全通过。 |
| 5 | Test/Record · 受影响测试、`workspace/DHR_61/{progress,findings,review}.md` | 跑全量定向回归、契约审计和凭据模式扫描；记录每批命令、输出、发现及首轮小审，不修改 DHR_34 代码范围。 | `cd relay-core; npm test; npm run audit` → 终态 PASS / audit 0 违规；`git diff --check` → PASS。 |

## 关键决策

- Worktree：是，分支=`wt/DHR_61`，从包含 B-23 的本地 `master` 切出。
- 派子 agent：施工与判断留主会话；S1/E4/E5/E14/E6/E7 按重核配方记录为 Herdr 上的独立实例，施工用 codex `gpt-5.6-terra` reasoning high，复核用 Claude Opus。
- Review：heavy，代码轮 1 + fresh 代码轮 2 + 需求 + 教训 + 一致性五路；变异点仅由轮 2 实例登记。
