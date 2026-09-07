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
| 6 | Record · `progress.md`、`findings.md` | 记录当前 construction Node 的实现、测试终态、剩余风险和交接；可备四例 H3 安全摘要，不自行进入复核或验收。 | 每项证据有 E-ID；未闭合项如实列出，交回主控后停止。 |

## 2026-09-07 调整后的当前施工顺序

用户已确认局部调整并要求 Terra 按本计划继续。以下顺序优先于上表尚未完成的步骤；目标和正式 design/15 A9–A12/H3 不变。

本轮仅将已批准范围写入本工作区，施工由执行者另行落实；不修改生产代码、测试、工作区外文件或 Git 状态列，不复核、不验收、不提交。allowed paths 的本次增量精确为 `relay-core/test/identity-quota.test.mjs`、`relay-core/test/dhr76-profile-validation-lease.test.mjs`，仅用于 `instruction_ref` fixture；不包含旧测试 Result 结算驱动改写。

1. **先闭合发送安全边界**（现有允许的 driver/adapter/startup-dispatch/Store 与专项测试）：首发后进入 blocked 且无进展满 60 秒不得补发；补发/首发调用前复用 stop、lease/fencing、host_ref 身份检查，覆盖占次后异步源校验期间 stop/失租/身份变化。Herdr 调用仍在 Store 队列外，不把授权后迟到 checkpoint 的已接受窄竞态改成新事务框架。用受控时序测试证明禁止调用及次数不可回收。
2. **补计时和恢复行为**：60 秒使用单调时钟，测试可注入，验证未到阈值不发、达到阈值至多补发一次且无第三发。故障注入首发已持久占次、尚未调用 Herdr 即崩溃，重开 Store/恢复旧 Attempt 后不发送；沿用 Attention 明示“启动内容可能未送达，本 Attempt 不再自动发送”，提示检查现场，必要时先 stop 旧执行再显式新执行。不得以“已发送后恢复不重发”替代此例。
3. **适配两条新增测试路径**：在 `identity-quota.test.mjs` 与 `dhr76-profile-validation-lease.test.mjs` 的临时仓 fixture 创建任务文件并提供匹配的 `instruction_ref={path,sha256}`，保留原配额/fallback、profile validation/lease 行为断言，不增加生产兼容绕过。
4. **同步 schema 治理基线**：仅修改用户再次明文批准的 `relay-core/tools/audit-contracts.mjs`、`relay-core/tools/structural-tokens.txt`、`relay-core/capability-baseline.json`，使 `instruction_ref` 的复合 locator 审计、结构 token 与 capability digest/hash 和正式 schema 一致。
5. **依次取得证据**：先专项及受影响定向组，再分别运行两条新增路径测试；核对 EBUSY 原始失败栈、清理与进程退出并单独复跑 dsh-bridge。代码稳定后运行一次完整 `npm test` 到自然终态，留原始输出、退出码、pass/fail/cancelled 和对应代码版本/差异依据。定向修正数不能减算成当前全量通过；未得终态如实登记。`git diff --check` 只作静态检查。
6. **施工交接即停**：在 progress/findings 登记本轮事实和未闭合风险，交给主控；不自行发起复核、验收、verify、合并、push 或真实 Agent。dsh-bridge EBUSY 未证实前保持失败；需要修改该文件或其它未授权路径时列依据并停止相关改动，不阻塞可独立进行的卡内工作。

EBUSY 独立定位约束：只有确证同一根因且所需变更确有必要时，才向主控提出进一步精确变更；诊断、前三例通过或未得终态均不能视为复现、排除或豁免 EBUSY，不将 bridge 改动混入本次施工。

当前证据基线：完整 `npm test` 仅有 330 pass / 30 fail / 0 cancelled 的历史记录，无后续全量终态。保留已登记定向结果与未得终态记录，不以其推导全量绿；新完整回归是待执行步骤，不是已完成事实。

## 关键决策

- Worktree：是；先提交本工作区，再从该主干提交建立 `D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_78`，分支 `wt/DHR_78`。
- 施工：主会话当前只执行 construction Node；不启动真实产品 Agent，不自行进入复核或收口人闸。
- Review：`task_type=heavy`；代码轮1收敛后，轮2、需求、教训、一致性走独立 fresh review batch；轮2选择变异点。
