<!-- dh:v1 -->
<!-- dh:planning-event:v1 id=DHR-B-49 stage=B-new artifact=dev_plan/drafts/DHR_80-task_plan-施工说明书候选.md review=../../design/evidence/50-B49-DHR80施工说明书-交叉审核记录.md#review-b49 understanding=../../design/evidence/50-B49-DHR80施工说明书-交叉审核记录.md#understanding-b49 -->
# task_plan 候选 — DHR_80 人工重试 Receipt-bound 结果提交闭环

> 状态：施工说明书候选，2026-09-07 按用户“开始拆计划”形成。DHR_78 未收口前不得执行；依赖满足并完成 D-start 后，原样或按届时基线机械校准到 `workspace/DHR_80/task_plan.md`。跑偏只记 `progress.md`，不回改已启动的 task_plan。

## 执行契约头

- 执行者：Herdr 右侧可交互终端中的 Luna，reasoning effort=max；cwd 必须是未来的 `D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_80`，branch=`wt/DHR_80`。
- 一个批次一次派发。Luna 只执行主控明确点名的当前批次；完成后在 `workspace/DHR_80/progress.md`、`findings.md` 落账，回复结构化 `BATCH_<N>_DONE` 并停止，不自行进入下一批、复核、验收、verify、合并、push 或真实 Agent。
- 每批先核 `pwd`、branch、HEAD、status 和允许路径。发现 DHR_78 未收口、基线不符、需改允许路径外文件、命令未得自然终态或 P0/P1 时，写 `BATCH_<N>_BLOCKED` 后停止。
- 主控在每批结束后检查精确 diff、测试终态、范围和账本；发现 P0/P1 则原批返工并复审，通过后才派下一批。批次小审构成 heavy 代码复核轮 1 的分段记录，收口仍需 fresh 轮 2及需求、教训、一致性复核和变异红/恢复绿。

## Context Packet

| ID | 来源 | 执行者要读什么 / 为什么 |
|---|---|---|
| C-8001 | `AGENTS.md` | worker 铁律、Result/Handoff、范围和 worktree 纪律。 |
| C-8002 | `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` 的 DHR_80 卡面 | 唯一目标、非目标、验收、依赖和允许路径。 |
| C-8003 | `docs/modules/dh-relay/design/11-P6身份与额度治理契约调整.md` D2/P6-IQ-A5 | 人工 retry 的 fresh Attempt、幂等、错误 profile、快照、fence 和原子性合同。 |
| C-8004 | `docs/modules/dh-relay/design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md` §2~§4 | `result_submission_mode=receipt-bound/v1`、唯一 writer、恢复 gate 与拒绝原因。 |
| C-8005 | `relay-core/runtime/attempt-retry.mjs:15-55` | 当前 retry Receipt 构造点；已知缺 mode，但不得预设只补字段即可闭环。 |
| C-8006 | `relay-core/runtime/service.mjs:311-410,430-510,962-976,1019` | receipt-bound 检索、提交 gate、恢复和 RPC retry 入口。 |
| C-8007 | `relay-core/runtime/workflow-driver.mjs:137-220,515-580` | 普通 Attempt 的 mode、gate 注册和恢复行为；人工 retry 不自动启动 Agent。 |
| C-8008 | `relay-core/test/rpc-service.test.mjs:613-706` | 现有真 socket/Store/lease 的 retry fixture，可复制必要最小件，不能直接改该文件。 |
| C-8009 | `relay-core/test/dhr64-result-bridge.test.mjs`、`dhr70-submission-gate.test.mjs` | Result/重启/actor gate 的既有 oracle，避免另造提交路径。 |
| C-8010 | `relay-core/test/attempt-contract.test.mjs:248-287` | frozen snapshot、同键幂等、projection drift 现有负例。 |

## 批次 0：开工闸与基线冻结（主控执行，不派 Luna）

目标：只在 DHR_78 已完成本地收口的精确主干上建立 DHR_80；不产生生产 diff。

1. 核对 DevPlan 中 DHR_78=`已完成` 且可定位 squash/verify；主干 index 干净，DHR_78 工作树已按收口决定处理。
2. 把本候选机械晋级为标准 v2 七件套；`brief.md` 逐字承接 DHR_80 六条验收，`review.md` 预填 heavy 五路与变异表，DevPlan 状态改“进行中”。
3. 提交 D-start 骨架后，从最新 master 建 `.dh-worktrees/DHR_80` / `wt/DHR_80`；核 `merge-base=master`、工作树干净，并把基线 SHA 记 E-8001。
4. Herdr 右侧 `--no-focus` 可交互 pane 启 Luna max，首条消息只让其读 AGENTS、brief/task_plan 和 Handoff，不施工；主控确认回读身份、cwd/branch/HEAD 后再派批次 1。

停止条件：任何依赖或身份核验失败均保持 DHR_80 未开工，不创建/复用别的任务树。

## 批次 1：入口级失败复现

独立验收点：当前人工 retry Receipt 无法通过正式提交入口，红测稳定钉在 mode/gate 链，不靠静态字段比较。

| # | 文件 | Luna 可照做的动作 | 验证与预期 |
|---|---|---|---|
| 1.1 | Create `relay-core/test/dhr80-retry-result-bridge.test.mjs` | 复用 `rpc-service.test.mjs` 的临时 Git 仓、真 v2 socket、Store、lease 与 profile registry 最小 fixture：创建带 frozen profile 的 pause，经 RPC `retry-with-profile` 得 fresh Receipt；不得直接调用 `retryWithFrozenProfile` 作为主验收。 | 测试先断言 retry 成功、新 attempt/receipt 与旧值不同、Attention 关闭。 |
| 1.2 | 同文件 | 用 fresh receipt_id 经同一服务的 `submit-executor-result` 提交 succeeded；断言当前基线返回稳定拒绝且结果目录、attempt 终态、event/state 均无新增成功事实。失败点必须来自正式入口不可发现/无 gate，不接受手写 `assert.equal(mode, undefined)` 充当红测。 | `cd relay-core; node --test --test-concurrency=1 test/dhr80-retry-result-bridge.test.mjs` → 预期测试 FAIL；记录具体 reason、断言、exit code，命令须自然终态。 |
| 1.3 | `workspace/DHR_80/progress.md`、`findings.md` | 登记红测 E-ID、版本 SHA、命令与失败语义；若实际已能提交或失败落在 fixture/认证/schema，先诊断并修测试，不改生产。 | `git diff --check` 通过；diff 仅新专项测试和工作区账本。 |

批次结束信号：`BATCH_1_DONE`，附 HEAD、changed paths、red command/exit、失败 reason、未关闭项。主控只读审查红测是否真的穿过 retry RPC 和 submit RPC、是否验证零 mutation；批准后才进批次 2。

## 批次 2：最小修复与结果接收闭环

独立验收点：fresh retry Receipt 能接收显式外部提交；成功、失败、重启和拒绝路径均由正式入口证明，仍不启动 Agent。

| # | 文件 | Luna 可照做的动作 | 验证与预期 |
|---|---|---|---|
| 2.1 | Modify `relay-core/runtime/attempt-retry.mjs:44-52` | 先做最小候选：新 retry Receipt 写 immutable `result_submission_mode: 'receipt-bound/v1'`。保持字段来源、fallback snapshot、resolution 与 Store 事务不变；不迁移历史 Receipt。 | 批次 1 专项由红转绿；读取持久 Receipt 断言 mode 正确。 |
| 2.2 | Modify（仅红测证明必要时）`relay-core/runtime/service.mjs`、`workflow-driver.mjs` | 若仅加 mode 后正式提交仍无法建立/恢复 gate，沿用 `receiptBoundRun`、`submissionGates`、`ensureActor`、`driveRun` 现有函数补最小接线。禁止 service 直接开 Store 写 Result，禁止 retry 自动 launch。任何需要公开协议、Store 算法或历史 backfill 的方案写 P1 blocked，不实施。 | 专项 succeeded 与 failed 两个子例均得到 committed Ack；Result 字段从 Receipt 派生，event/state 一致，fake Herdr 启动/发送调用为 0。 |
| 2.3 | Test `dhr80-retry-result-bridge.test.mjs` | 加同服务重复同结果幂等、冲突终态；关闭/重启服务后对同一 fresh Receipt 提交并验证只恢复 gate、不新建 Attempt、不 launch；缺 mode 的历史 Receipt 仍拒绝且零 mutation。所有提交均走正式 RPC，逐项覆盖请求字段闭集、failed 固定 reason、服务端生成的 `structured`/digest；多余身份或 `structured` 字段稳定拒绝。另覆盖旧 Receipt fenced 且不污染新结果、失租、未认证、未知/非当前 Receipt，逐例断言稳定 reason 与 Result/event/state/attempt 零 mutation。 | 专项全部 PASS、0 fail/cancelled，自然终态；正例 Ack 与 Result 的 reason、structured、digest 均由服务端合同证明，负例零 mutation。 |
| 2.4 | Test `attempt-contract.test.mjs` 或专项（按现有 oracle 归属） | 覆盖 non-frozen profile、snapshot drift、closed pause/new key、同键 replay；逐个断言稳定 reason 与 attempt/receipt/resolution/attention 零额外推进。只在既有文件确有直接职责时修改。 | `node --test --test-concurrency=1 test/attempt-contract.test.mjs test/dhr80-retry-result-bridge.test.mjs` → PASS。 |
| 2.5 | Test `dhr80-retry-result-bridge.test.mjs` | 用 fake adapter 构造 retry Attempt 的 done/idle 但无正式 submission 场景，观察到合同要求的 timeout 边界；不得用 2.2 的“提交路径未 launch”代替。 | timeout 前后只有既定 human-input/waiting 事实；无 Result、attempt 终态、fallback、Agent 启动或指令发送。 |
| 2.6 | `progress.md`、`findings.md` | 记录实际生产路径；`service/driver` 无需修改时明确记“经红绿证明无需改”，不要为匹配预登记范围制造 diff。 | `git diff --check`；允许路径审计通过。 |

批次结束信号：`BATCH_2_DONE`，附 red→green 对照、全部命令终态、生产 diff、是否触及 service/driver、未关闭项。主控审查入口/actor/Store 边界、恢复与零启动证据；P0/P1 返工闭合后才进批次 3。

## 批次 3：兄弟回归、治理证据与施工交接

独立验收点：修复未改变普通 Receipt、Result bridge、DHR_70 gate、done/idle 或 DHR_78 启动发送语义，施工证据足以进入 heavy 自动收口。

| # | 文件 | Luna 可照做的动作 | 验证与预期 |
|---|---|---|---|
| 3.1 | Test only | 依次运行 DHR80 专项（含 done/idle 无 submission）、attempt contract、DHR64 result bridge、DHR70 gate；再按实际 diff 补 workflow-driver/DHR78 受影响组。每条单独保留退出码和摘要；不得把局部可见输出算终态。 | 基础命令：`cd relay-core; node --test --test-concurrency=1 test/dhr80-retry-result-bridge.test.mjs test/attempt-contract.test.mjs test/dhr64-result-bridge.test.mjs test/dhr70-submission-gate.test.mjs` → 全部 PASS。若 DHR_78 收口时新增专测，纳入其文件。 |
| 3.2 | Test/Record `relay-core/package.json` | 仅在专项文件尚未进入默认 `npm test` 时追加它，不改其他脚本。运行 `npm test` 一次到自然终态；失败逐项归因但不擅自扩路径修。 | 完整输出、exit、pass/fail/cancelled、耗时与当前 diff 摘要落 E-ID；非 0 就保持未通过。 |
| 3.3 | Record `as-built/relay-core.md`、`knowledge/教训库-候选.md`、workspace | 只按真实 A→B 更新人工 retry Receipt 的 mode/接收恢复边界；教训候选聚焦“字段存在必须由入口 committed Ack 证明”和“retry 创建不等于 Agent 启动”。无新事实则写无需改及理由。 | 在 cwd=`relay-core` 运行 `node tools/audit-contracts.mjs`；回仓根运行 `git diff --check`、`dh dh-relay`。均记录终态，体检存量项与本卡新增项分开。 |
| 3.4 | `progress.md`、`findings.md`、`review.md` | 登记施工完整文件集、证据、P2/P3、每批小审身份/结论，形成 construction Handoff；不自行派复核或进入验收。 | 精确 status/diff 可由下一节点复建；零未登记允许路径外改动。 |

批次结束信号：`BATCH_3_DONE`，附所有终态、完整测试结论、体检结论、尾巴和建议 review 输入。主控通过后结束 Luna construction node；随后按 heavy 配方完成规定复核、轮 2 指定变异红/恢复绿和需求境材料，施工会话不复核自己的卡。上述证据齐备后只停在“待用户本地收口确认”，不得把绿色证据当作授权；verify、合入、push 仍分别等待对应授权。

## 主控逐批审查表

| 批次 | 必查 | 放行下一批的最低条件 |
|---|---|---|
| 1 | 是否走真 RPC/Store/lease；红点是否为新 Receipt 不可进入 Result gate；拒绝后是否零 mutation | 红测稳定、自然终态、无生产改动、无 P0/P1 测试缺陷。 |
| 2 | mode 是否 immutable；是否误启动 Agent；service 是否绕 writer；成功/失败/恢复/历史兼容/负例是否闭合 | 专项与 attempt contract 全绿；所有 P0/P1 闭合；范围内最小 diff。 |
| 3 | 兄弟与完整回归终态；治理同步；工作区可复建；并行 WIP 未卷入 | 本卡新增失败为 0；完整测试如非绿则保持 construction blocked，不进入复核。 |

## 关键决策

- Worktree：是；依赖满足后从最新 master 建 `wt/DHR_80`。
- Worker：Herdr 右侧可交互终端，Luna max；一次只收一个批次指令。
- TDD：批次 1 必须以正式入口红测开场，不能用静态字段断言代替。
- Review：每批由主控派 fresh 只读小审并裁决；heavy 收口另做 fresh 轮 2、需求、教训、一致性和轮 2 指定变异点；全部通过只进入待用户本地收口确认，不自动 verify 或合入。
- 停止点：DHR_78 未收口、需扩大公开合同/Store/启动语义、测试未得自然终态或连续返工不收敛时，worker 写 blocked 并停止。
