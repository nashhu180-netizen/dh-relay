<!-- dh:v1 -->
# task_plan — DHR_77

## 要读的上下文 (Context Packet)

> **执行契约头（zero-context）**：2026-09-06 用户已在 task plan 写成后明确要求从右侧可交互终端执行，S3 D-start 成立。执行者先确认 cwd/branch/worktree 与本表一致，只读本文件、`brief.md`、DevPlan 卡和下列来源；严格按 TDD 顺序施工。偏离路线只记 `progress.md`，不回写本文件；任何一步若要求扩大允许路径、启动真实产品 Agent、读取凭据/用户 registry 或改变正式合同，立即停止并写 blocked 信号。

| ID | 来源 (path) | 为什么 |
|----|---------------|--------|
| C-001 | `AGENTS.md` | 宪章、worker 节点边界、密钥红线与 worktree 纪律。 |
| C-002 | `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` § DHR_77 | 唯一任务卡权威：六项验收、允许路径、heavy Recipe 与 DHR_35 边界。 |
| C-003 | `docs/modules/dh-relay/design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md` §1～§4 | 冻结来源谓词、逐字算法、生命周期、event/v0、v1/v2 hash 和安全展示语义。 |
| C-004 | `relay-core/contracts/relay.event.v2.schema.json`、`contracts/v0-shapes/relay.host-observation.v1.shape.json`、`contracts/compat-matrix.md` | 现役封闭字段集、v0 mirror 与兼容账。 |
| C-005 | `relay-core/runtime/executors/herdr/herdr-executor.mjs` 的 `renameClaudeAgent`/`launchHerdrAgent`/`observeHerdrAgent`/`reconcileHerdrAgent`；`runtime/workflow-driver.mjs` 的 host-observation 写入与 recovery 段 | 当前错误 fallback、Herdr 返回值与事件写入/最后观测状态的真实调用链。 |
| C-006 | `relay-core/tools/capability-baseline.mjs` 的 `frozenSchemas/build`、`rpc/capabilities.mjs` 的 `localCapabilityHash*`、RPC server 现有握手顺序 | 让 v1/v2 共用完整 baseline，并用测试守住 mismatch 早于分派/订阅。server 只读。 |
| C-007 | `relay-core/runtime/service.mjs` 的 event/read-model handlers；`cli/main.mjs` 的 `runFocus`；`cli/render.mjs` 的 `renderFocus`/`renderEvent` | 回放、legacy 缺省、当前/历史/尚无标签及默认省略 `detail` 的落点。 |
| C-008 | `relay-core/test/{contracts,rpc,rpc-service,read-model-mirror,client-fixtures,cli,herdr-adapter,dhr72-continuous-observation}.test.mjs`、`test/helpers/fake-herdr.mjs`、`fixtures/{golden,negative,clients}` | 复用测试 harness 和样本，不另造框架；核对全部受影响兄弟路径。 |

## 施工步骤 (Steps)

> **批次决定**：这是正式设计明令不可拆的一项原子兼容变更，只有一个功能批次。步骤 1～6 全部闭合后才设批次检查点；中间测试通过只表示局部 TDD 节拍，不得宣称协议兼容完成。

| # | 改动文件（Create/Modify/Test + 路径:锚点） | 怎么改 | 怎么验（命令 → 预期输出） |
|---|---------------------------------------------|--------|--------------------------|
| 1 | Create/Test · `relay-core/test/dhr77-host-ref.test.mjs`；Modify/Test · `test/helpers/fake-herdr.mjs`、`fixtures/golden/**`、`fixtures/negative/**` | 先写失败测试，覆盖：`UTF8("dh-relay.host-ref/v1\\0" + terminal_id)` 的 ASCII/前后空白/Unicode/control-char golden；缺失、number、object、空串全部拒绝；不得 trim/normalize/case-fold；不得从 `pane_id`、agent、`agent_session`、路径/Receipt/detail fallback。fake 只提供显式 `terminal_id` 控制点，不把原值写进持久证据。 | `cd relay-core; node --test --test-concurrency=1 test/dhr77-host-ref.test.mjs` → 修前因无派生函数/事件字段而**断言失败**，不是语法或构建错误；将失败摘要记 E-77xx。 |
| 2 | Modify · `runtime/executors/herdr/herdr-executor.mjs` 的 launch/rename/observe/reconcile；Modify/Test · `test/herdr-adapter.test.mjs` | 做最小来源实现：统一校验 `typeof terminal_id === 'string' && terminal_id.length > 0`，使用 Node SHA-256 完整小写 hex 与固定域前缀；Codex/Claude launch 与后续 `agentGet` 都只从响应的 `terminal_id` 生成 ref。删除现有 `terminal_id→pane_id` fallback；缺值按既有观测失败面返回，内部 handle 可持有原 ID，但任何 event/read-model/CLI/测试日志不得输出它。 | 同一步骤 1 命令 + `node --test --test-concurrency=1 test/herdr-adapter.test.mjs` → 来源/golden/负例全绿，既有 adapter 行为不回归。 |
| 3 | Modify · `contracts/relay.event.v2.schema.json`、`contracts/v0-shapes/relay.host-observation.v1.shape.json`、`contracts/compat-matrix.md`；Modify/Test · `test/contracts.test.mjs` | 给 event/v0 mirror 增加 nullable/可缺省 `host_ref` 格式；用 `if/then/not` 守住 alive 必有 ref、非 observation 事件不得有非空 ref。账本时序不变量留给 reducer 测试；compat matrix 登记旧账缺省和 atomic change。先补正反 schema 断言，再改 schema。 | `node --test --test-concurrency=1 test/contracts.test.mjs test/dhr77-host-ref.test.mjs` → 负例确实因 schema/断言被拒，正例通过。 |
| 4 | Modify · `runtime/workflow-driver.mjs` 的初始、轮询、lost、recovery 与 `working→working` 写入；Modify/Test · `test/dhr72-continuous-observation.test.mjs`、`test/dhr77-host-ref.test.mjs` | 在 driver 内维护每 Attempt 最后成功 ref：alive 写当前 ref；lost 有历史则保留、从未成功则缺省；恢复只用既有 `executor_ref` 查询 Herdr 并重算，不从旧 `detail` 还原；事件触发条件加入 ref 变化，状态不变但 terminal replacement 也落事件。测试覆盖 same/replace/rename/cold-restart-as-returned、initial-lost、lost→recover→replace 和旧事件不回写。先写新增时序断言见红，再最小实现。 | `node --test --test-concurrency=1 test/dhr77-host-ref.test.mjs test/dhr72-continuous-observation.test.mjs` → 所有序列绿；既有 checkpoint 持续观察用例仍绿。 |
| 5 | Modify · `tools/capability-baseline.mjs`、`capability-baseline.json`、`rpc/capabilities.mjs`；Modify/Test · `test/rpc.test.mjs`、`test/rpc-service.test.mjs`、`test/read-model-mirror.test.mjs`、`test/client-fixtures.test.mjs`、`fixtures/clients/**` | 先加旧固定 v1 hash 的 request/subscribe 负例和刷新后 v1/v2 正例；断言 mismatch 在 handler/subscribe 注册前、event 推送为 0。再删除 v1 固定 hash 分叉，让 `localCapabilityHash()` 与 v2 都取包含新 event digest 的完整 baseline；只用 `node tools/capability-baseline.mjs --write` 生成快照，不手改 hash。同步仅受影响客户端 fixture；`server.mjs` 不改。 | 先跑 `node --test --test-concurrency=1 test/rpc.test.mjs test/rpc-service.test.mjs` → 旧实现应因 v1 仍接受旧 hash见红；实现后运行 `node tools/capability-baseline.mjs` 与上述四文件 → baseline 对证 exit 0，新 hash v1/v2 通过、旧 hash mismatch 且零推送。 |
| 6 | Modify · `runtime/service.mjs` event/read-model 投影、`cli/main.mjs` `runFocus`、`cli/render.mjs` `renderFocus/renderEvent`；Modify/Test · `test/read-model-mirror.test.mjs`、`test/client-fixtures.test.mjs`、`test/cli.test.mjs`、`test/dhr77-host-ref.test.mjs` | 先写当前/历史/尚无/legacy 四态和泄密负断言见红；再让回放逐字保留 event ref，旧账仅给 legacy 缺省；focus/默认安全事件投影显示 ref 与“当前观测/历史观测/尚无可信 terminal 标签”，`executor_ref` 只标 locator，省略 `detail`。如保留诊断 detail，只能是另一个用户主动请求且不用于 H1 的面，不扩命令面。 | `node --test --test-concurrency=1 test/read-model-mirror.test.mjs test/client-fixtures.test.mjs test/cli.test.mjs test/dhr77-host-ref.test.mjs` → 四态措辞和 JSON/text 同源通过，输出中无原始 terminal/detail/path。 |
| 7 | Modify · `relay-core/package.json`；Test · 全部本卡/兄弟回归；Record · `progress.md`/`findings.md`/`review.md` | 只把新测试追加到现有 `test` script。运行单并发原子专项后，跑 contracts/RPC/read-model/CLI/adapter/DHR72/Result/Receipt/lease/fencing/profile 定向，再跑仓内 `npm test` 与根目录 `tools/tests/run-relay-tests.ps1`；每个命令必须等终态，不把 yield/timeout 当通过。完成唯一批次后派代码轮1小审并落 `review-dispatch`；P0/P1 未清零不得进入收口。 | `cd relay-core; npm test`、`pwsh -NoProfile -File ../tools/tests/run-relay-tests.ps1`、仓根 `dh dh-relay`、`git diff --check` → 均得终态；预期 exit 0/0 failures。任何存量红须登记基线对照，不猜。 |
| 8 | Record/Test · `workspace/DHR_77/evidence/**`、`review.md`；Modify · `as-built/relay-core.md`、必要时 `knowledge/教训库-候选.md` | E2/E4/E5/E14 使用 heavy 五路：代码轮2必须为未参与施工/轮1的 fresh 实例，并由其从“来源谓词、ref 变化触发、lost 历史绑定、旧 v1 hash 零推送、非观测字段禁入”选择一个本卡生产 diff 变异点；施工者施加、断言失败、还原并登记双 hash。E10 生成 DSH-off CLI 安全投影与受控 Herdr API 同算法对照，只保存脱敏 ref/状态措辞和截图或等价终端渲染；落盘前白名单过滤，禁止原始 ID/detail/路径/账号/Receipt/Result/凭据。 | 定向变异命令 → 改坏后只能是“断言失败”，还原后 exit 0；白名单扫描 → 禁止字段/敏感值 0 命中；用户仅在对话看到业务化五段展示后判断 HC-HR-H1。本卡证据不得登记到 DHR_35 P6-M1。 |

## 关键决策

- Worktree：是；骨架提交后从最新 `master` 建 `D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_77`，分支 `wt/DHR_77`。
- S3：2026-09-06 用户明确要求右侧可交互终端执行；只授权当前 construction Node，worker durable 收口后等待 `node_closed`，不自行进入复核。
- 施工分工：未来 D-start 默认一个 construction worker 独占本卡全部允许代码路径；它不是主控、不得派活或复核自己。主控只做边界/证据收敛与人验展示。
- Review：`task_type=heavy`，`inline_registration`；代码轮1批次小审后，代码轮2、需求、教训、一致性进入同一 Review Batch，身份独立；代码轮2实例须与施工/轮1不同。
- 真实环境：不启动真实 Codex/Claude Agent；H1 只做受控 Herdr 对照与 DSH-off 安全展示，不消费为 DHR_35 实录。
