<!-- dh:v1 -->
# task_plan — DHR_78

## 要读的上下文 (Context Packet)

| ID | 来源 | 为什么 |
|----|------|--------|
| C-001 | `AGENTS.md` | 节点边界、密钥红线、精确路径和 worktree 纪律。 |
| C-002 | `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` §DHR_78 | 唯一任务卡：验收、允许路径和 heavy 配方。 |
| C-003 | `docs/modules/dh-relay/design/15-Herdr-Agent单一启动内容与有限重发.md` §1–3 | 单一 sender、次数、补发、恢复与安全展示的冻结合同。 |
| C-004 | `relay-core/runtime/workflow-driver.mjs`、`runtime/executors/herdr/herdr-executor.mjs` | 当前 completion-only sender、Herdr 调用和 lease/stop 边界。 |
| C-005 | `relay-core/store/store.mjs`、`contracts/relay.run.v2.schema.json` | 既有串行写队列、Attempt/Receipt/checkpoint/Result 和封闭 node schema。 |
| C-006 | `relay-core/test/herdr-adapter.test.mjs`、`agent-node.test.mjs`、`dhr64-driver-observation.test.mjs`、`dhr70-submission-gate.test.mjs`、`dhr72-continuous-observation.test.mjs`、`dhr75-host-lease-during-herdr.test.mjs`、`dhr77-host-ref.test.mjs` | 复用现有 fake、时序测试与 Receipt/lease 回归，不造新框架。 |

## 施工步骤 (Steps)

| # | 改动文件（Create/Modify/Test） | 怎么改 | 怎么验 |
|---|---|---|---|
| 1 | Create/Test · `relay-core/test/dhr78-startup-dispatch.test.mjs`；Modify/Test · `test/helpers/fake-herdr.mjs`、`test/helpers/fake-herdr-bin.mjs` | 先写失败行为测试：合法 `instruction_ref`、缺失/越界/摘要变化拒绝、唯一 sender、任务+Receipt 指令内容、首发/补发内容相等、进展抑制、恢复不重发、两发上限、授权后窄竞态。fake 只记录安全字段。 | `cd relay-core; node --test --test-concurrency=1 test/dhr78-startup-dispatch.test.mjs` → 修前断言失败。 |
| 2 | Modify · `contracts/relay.run.v2.schema.json`、`runtime/startup-dispatch.mjs`（若此文件尚不存在，在已授权路径创建）； Modify/Test · `test/contracts.test.mjs` | 将 `instruction_ref={path,sha256}` 纳入 P6 node 的封闭 schema；实现仓根内解析、摘要核对和固定启动内容构造，禁止 workspace 硬编码。 | 专项与 `node --test --test-concurrency=1 test/contracts.test.mjs` → 正反例通过。 |
| 3 | Modify · `runtime/workflow-driver.mjs`、`runtime/executors/herdr/herdr-executor.mjs` | 收敛启动/恢复/解除 blocked 的旧 completion-only 发送为一个 Host Adapter 调用点；调用必须位于 Store 队列外，复用现有 identity、lease 与 stop guard。 | 专项静态调用检查 + adapter/agent-node 定向测试 → 旧路径归零、唯一 sender 通过。 |
| 4 | Modify · `store/store.mjs`；Modify/Test · 专项和 `dhr64-*`、`dhr70-*`、`dhr72-*`、`dhr75-*`、`dhr77-*` | 在既有单写队列增加私有、字段封闭的发送记录：第 1/2 次授权及补发资格检查同一 job；读取当前 Attempt 的 checkpoint/Result/终态，次数不可回收。不得改 checkpoint/Result 算法。 | 专项并发、进展先后、崩溃/恢复、stop/lease/身份负例；兄弟定向组均有自然终态。 |
| 5 | Modify/Test · `relay-core/package.json` 与 DevPlan 列出的受影响测试 | 只登记本卡专项；按允许路径补输入适配，不削弱既有断言。运行本卡和受影响定向回归，记录完整 npm 若无自然终态。 | `git diff --check`；专项和定向组 exit 0；每个命令记录终态。 |
| 6 | Record · `progress.md`、`findings.md`、`review.md`；Modify · `as-built/relay-core.md`、必要时 `lesson_candidates.md` | 施工后自动进入 heavy 收口：批次轮1、fresh 轮2/需求/教训/一致性、轮2选择生产变异点并证明红→还原绿；制作四例 H3 安全摘要。 | 所有机器项有 E-ID；H3 证据展示后才等待 E11。 |

## 关键决策

- Worktree：是；先提交本工作区，再从该主干提交建立 `D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_78`，分支 `wt/DHR_78`。
- 施工：主会话当前只执行 construction Node；不启动真实产品 Agent，不自行进入复核或收口人闸。
- Review：`task_type=heavy`；代码轮1收敛后，轮2、需求、教训、一致性走独立 fresh review batch；轮2选择变异点。
