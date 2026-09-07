<!-- dh:v1 -->
# task_plan — DHR_80 人工重试 Receipt-bound 结果提交闭环

## 执行契约头

- 执行者：Herdr 右侧可交互终端中的 Luna，reasoning effort=max；cwd=`D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_80`，branch=`wt/DHR_80`。
- 一个批次一次派发。Luna 只执行主控明确点名的当前批次；完成后在 `progress.md`、`findings.md` 落账，回复 `BATCH_<N>_DONE` 并停止，不自行进入下一批、复核、验收、verify、合并、push 或真实 Agent。
- 每批先核 `pwd`、branch、HEAD、status 和允许路径。基线不符、需改允许路径外文件、命令未得自然终态或存在 P0/P1 时，写 `BATCH_<N>_BLOCKED` 并停止。
- 主控逐批检查精确 diff、测试终态、范围与账本；P0/P1 在原批返工并复审，通过后才派下一批。批次小审构成 heavy 代码复核轮 1 的分段记录；收口仍需 fresh 轮 2、需求、教训、一致性复核及轮 2 指定的变异红/恢复绿。

## 要读的上下文 (Context Packet) ★前置

| ID | 来源 | 为什么 |
|----|------|--------|
| C-8001 | `AGENTS.md` | worker 铁律、节点边界、范围和 worktree 纪律。 |
| C-8002 | `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` 的 DHR_80 卡面 | 唯一目标、非目标、验收、依赖与允许路径。 |
| C-8003 | `docs/modules/dh-relay/design/11-P6身份与额度治理契约调整.md` D2/P6-IQ-A5 | fresh Attempt、幂等、错误 profile、快照、fence 与原子性合同。 |
| C-8004 | `docs/modules/dh-relay/design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md` §2~§4 | submission mode、唯一 writer、恢复 gate 与拒绝原因。 |
| C-8005 | `relay-core/runtime/attempt-retry.mjs:15-55` | retry Receipt 构造点；已知缺 mode，但不得预设只补字段即可。 |
| C-8006 | `relay-core/runtime/service.mjs:311-410,430-510,962-976,1019` | receipt-bound 检索、提交 gate、恢复和 retry RPC 入口。 |
| C-8007 | `relay-core/runtime/workflow-driver.mjs:137-220,515-580` | 普通 Attempt mode、gate 注册与恢复；人工 retry 不自动启动 Agent。 |
| C-8008 | `relay-core/test/rpc-service.test.mjs:613-706` | 现有真 socket/Store/lease/profile registry fixture；只读复用，不在允许路径内修改。 |
| C-8009 | `relay-core/test/dhr64-result-bridge.test.mjs`、`relay-core/test/dhr70-submission-gate.test.mjs` | Result/重启/actor gate 的既有 oracle。 |
| C-8010 | `relay-core/test/attempt-contract.test.mjs:248-287` | frozen snapshot、同键幂等、projection drift 负例。 |

## 批次 0：开工闸与基线冻结（主控执行，不派 Luna）

目标：只在已含 DHR_78 收口的精确主干上建立 DHR_80，不产生生产 diff。

1. 核对 DHR_78=`已完成` 且定位 squash/verify；审计主树、index、并行 worktree 与路径所有权。
2. 把已审核候选机械晋级为本 v2 七件套；`brief.md` 逐字承接六条验收，`review.md` 预填 heavy 五路和变异表，DevPlan 改“进行中”。
3. 精确提交 D-start 骨架，从最新 master 建 `.dh-worktrees/DHR_80` / `wt/DHR_80`；核 merge-base、branch、clean，并把基线 SHA 记为 E-8001。
4. Herdr 右侧 `--no-focus` 可交互 pane 启 Luna max；首条只读回读 AGENTS、brief/task_plan 和 Handoff。主控确认身份、cwd、branch、HEAD 后再派批次 1。

停止条件：依赖、路径所有权或身份核验失败即停止，不复用别卡工作树。

## 批次 1：入口级失败复现

独立验收点：当前人工 retry Receipt 无法通过正式提交入口，红测稳定钉在 mode/gate 链，不靠静态字段比较。

| # | 改动文件 | 怎么改 | 怎么验 |
|---|----------|--------|--------|
| 1.1 | Create/Test `relay-core/test/dhr80-retry-result-bridge.test.mjs` | 复用 `rpc-service.test.mjs` 的临时 Git 仓、真 v2 socket、Store、lease 与 profile registry 最小 fixture：经 RPC `retry-with-profile` 得 fresh Receipt；主验收不得直接调用 `retryWithFrozenProfile`。 | 先断言 retry 成功、新 attempt/receipt 与旧值不同、Attention 关闭。 |
| 1.2 | 同文件 | 用 fresh receipt 经同一服务的 `submit-executor-result` 提交 succeeded；断言当前基线稳定拒绝，Result、attempt 终态、event/state 均无新增成功事实。失败必须来自正式入口不可发现/无 gate，不接受静态字段断言代替。 | `cd relay-core; node --test --test-concurrency=1 test/dhr80-retry-result-bridge.test.mjs` → 预期 FAIL，且自然终态。 |
| 1.3 | Record workspace | 登记红测 E-ID、版本 SHA、命令、稳定 reason 和零 mutation；若失败在 fixture/认证/schema，先修测试，不改生产。 | `git diff --check` → PASS；diff 仅专项测试与工作区账本。 |

结束信号：`BATCH_1_DONE`，附 HEAD、changed paths、red command/exit、失败 reason、未关闭项；主控审查真 retry RPC + submit RPC + 零 mutation 后才放行。

## 批次 2：最小修复与结果接收闭环

独立验收点：fresh retry Receipt 能接收显式外部提交；成功、失败、重启和拒绝路径均由正式入口证明，仍不启动 Agent。

| # | 改动文件 | 怎么改 | 怎么验 |
|---|----------|--------|--------|
| 2.1 | Modify `relay-core/runtime/attempt-retry.mjs:44-52` | 最小候选：新 retry Receipt 写 immutable `result_submission_mode: 'receipt-bound/v1'`；保持字段来源、fallback snapshot、resolution 与 Store 事务不变，不迁移历史 Receipt。 | 批次 1 专项红转绿；读取持久 Receipt 断言 mode。 |
| 2.2 | Modify only if red test proves necessary: `service.mjs` / `workflow-driver.mjs` | 若 mode 后仍无 gate，复用 `receiptBoundRun`、`submissionGates`、`ensureActor`、`driveRun` 补最小接线。禁止 service 直写 Result、retry 自动 launch。需改公开协议/Store/历史 backfill 时记 P1 blocked。 | succeeded/failed 都得 committed Ack；Result 从 Receipt 派生；event/state 一致；fake Herdr 启动/发送=0。 |
| 2.3 | Test 专项 | 补同结果幂等、冲突终态；重启后同 Receipt 恢复 gate、不新建 Attempt/launch；历史缺 mode Receipt 拒绝。逐项覆盖请求字段闭集、failed 固定 reason、server structured/digest；多余身份/structured 拒绝。覆盖旧/非当前 Receipt、失租、未认证、未知 Receipt，逐例断言稳定 reason 与 Result/event/state/attempt 零 mutation。 | 专项全部 PASS，0 fail/cancelled，自然终态。 |
| 2.4 | Test `attempt-contract.test.mjs` 或专项 | 覆盖 non-frozen profile、snapshot drift、closed pause/new key、同键 replay；断言稳定 reason 与 retry facts 零额外推进。仅在既有文件直接负责时修改。 | `node --test --test-concurrency=1 test/attempt-contract.test.mjs test/dhr80-retry-result-bridge.test.mjs` → PASS。 |
| 2.5 | Test 专项 | fake adapter 构造 retry Attempt done/idle 但无正式 submission，观察合同 timeout 边界；不得用“提交路径未 launch”代替。 | timeout 前后无 Result/attempt 终态/fallback/Agent 启动/指令发送，仅既定 human-input/waiting 事实。 |
| 2.6 | Record workspace | 记录实际生产路径；service/driver 无需修改时明确写“红绿证明无需改”，不为匹配范围制造 diff。 | `git diff --check` 与允许路径审计通过。 |

结束信号：`BATCH_2_DONE`，附红→绿、命令终态、生产 diff、是否触及 service/driver、未关闭项；主控核入口/actor/Store/恢复/零启动，P0/P1 闭合后才放行。

## 批次 3：兄弟回归、治理证据与施工交接

独立验收点：修复未改变普通 Receipt、Result bridge、DHR_70 gate、done/idle 或 DHR_78 启动发送语义，施工证据足以进入 heavy 自动收口。

| # | 改动文件 | 怎么改 | 怎么验 |
|---|----------|--------|--------|
| 3.1 | Test only | 依次运行 DHR80 专项（含 done/idle 无 submission）、attempt contract、DHR64 bridge、DHR70 gate；按实际 diff 补 workflow-driver/DHR78 受影响组。每条保留退出码和摘要。 | `cd relay-core; node --test --test-concurrency=1 test/dhr80-retry-result-bridge.test.mjs test/attempt-contract.test.mjs test/dhr64-result-bridge.test.mjs test/dhr70-submission-gate.test.mjs` → PASS。 |
| 3.2 | Test/Record `relay-core/package.json` | 仅在专项尚未进入默认 `npm test` 时追加，不改其他脚本。运行 `npm test` 一次至自然终态；失败归因但不擅自扩路径。 | 落账 exit、pass/fail/cancelled、耗时和版本；非 0 保持未通过。 |
| 3.3 | Record `as-built/relay-core.md`、`knowledge/教训库-候选.md`、workspace | 只按真实 A→B 更新 retry Receipt 的 mode/接收恢复边界；教训聚焦“字段存在须由入口 committed Ack 证明”和“retry 创建不等于 Agent 启动”。无新事实则记无需改及理由。 | cwd=`relay-core`：`node tools/audit-contracts.mjs`；仓根：`git diff --check`、`dh dh-relay`；均须自然终态。 |
| 3.4 | Record workspace | 登记完整文件集、证据、P2/P3、每批小审身份/结论，形成 construction Handoff；不自行派复核或验收。 | 精确 status/diff 可重建；零未登记范围外改动。 |

结束信号：`BATCH_3_DONE`。主控通过后结束 Luna construction node；随后按 heavy 配方自动收口，施工会话不复核自己的卡。齐备后只到“待用户本地收口确认”，不自动 verify/合入/push。

## 主控逐批审查表

| 批次 | 必查 | 放行下一批最低条件 |
|---|---|---|
| 1 | 真 RPC/Store/lease；红点为新 Receipt 不可进入 gate；拒绝后零 mutation | 红测稳定、自然终态、无生产改动、无 P0/P1 测试缺陷。 |
| 2 | mode immutable；无 Agent 启动；service 不绕 writer；成功/失败/恢复/历史兼容/负例闭合 | 专项与 attempt contract 全绿；P0/P1=0；最小范围内 diff。 |
| 3 | 兄弟/完整回归终态；治理同步；workspace 可重建；并行 WIP 未卷入 | 本卡新增失败=0；完整测试非绿则 construction blocked。 |

## 关键决策

- Worktree：是，`wt/DHR_80`。
- Worker：Herdr 右侧可交互 Luna max；一次只执行一个主控点名批次。
- TDD：批次 1 必须正式入口红测开场，静态字段断言不算。
- Review：每批 fresh 只读小审并由主控裁决；heavy 收口另做 fresh 轮 2、需求、教训、一致性和轮 2 指定变异。
- 停止点：需扩大合同/Store/启动语义、测试未得自然终态或返工不收敛；全部绿色也只到待用户本地收口确认。
