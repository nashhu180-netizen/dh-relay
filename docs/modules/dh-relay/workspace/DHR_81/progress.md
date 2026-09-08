<!-- dh:v1 -->
# progress — DHR_81

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-08 | 主会话 | 用户明文“继续施工”；完成 D-start，建立七件套并准备单独 worktree。 | `61cd6d1` / DevPlan DHR_81 | 提交工作区骨架后在 `wt/DHR_81` 施工。 |
| 2026-09-08 | 主会话 | 先补红测，再把唯一固定包络改为明确“打开指针并执行正文；完成后提交 Receipt-bound 结果”。未复制正文，未触及 sender、重试或真实 Agent。 | E-8102（红→绿） | 提交本批最小实现，进入 heavy 收口复核。 |
| 2026-09-08 | 主会话 | 收到代码轮1/需求/教训三路复核的 A13/A14 缺口后，补全“正文为唯一业务任务、Receipt 不是业务任务”的固定文本与完整包络快照；两轮红测后均还原绿色。 | E-8106；E-8103~E-8105 | 提交整改，派 fresh 代码轮2与一致性复核。 |
| 2026-09-08 | 主会话 | 完成 fresh 代码轮2与一致性复核；按轮2选择临时反转 Receipt 非业务任务语义，专项精确快照红，再原样还原绿。`dh mine` 已运行，未抽出重复候选。 | E-8107~E-8110 | 完成 as-built 与收口机器证据整理；不进入 E11。 |
| 2026-09-08 | 主会话 | 用户明文“认可”E11 本地收口包；`dh wt done DHR_81` 已 squash 到 master 暂存区，合入版本专项复验自然终态绿色。 | E-8111；chat-confirm 认可 | 代签 verify、销户并清理分支；不含 push、真实 Agent 或 DHR_35。 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 | 支撑什么结论 |
|---|---|---|---|---|
| E-8101 | inspect | DevPlan DHR_81 + 当前 `startup-dispatch.mjs` | observed | 范围与当前缺少明确执行顺序已核对。 |
| E-8102 | test | `node --test --test-concurrency=1 test/dhr78-startup-dispatch.test.mjs` | red: 16 pass / 1 fail（新顺序断言缺失）；green: 17 pass / 0 fail，exit 0，6502ms | 固定包络现已要求“先打开指针并执行其中正文；完成任务后再提交 Receipt-bound 结果”，且原有发送、一次补发、持久占次、拒绝与恢复断言均仍通过。 |
| E-8106 | test | `node --test --test-concurrency=1 test/dhr78-startup-dispatch.test.mjs` | red: 16 pass / 1 fail（Receipt 业务边界）；red: 16 pass / 1 fail（唯一业务任务语义）；green: 17 pass / 0 fail，exit 0，6221ms | 完整动态包络精确锁定指针、正文唯一业务任务、成功/失败真实结果提交、Receipt 非业务任务和正文零复制；原有拒绝与发送边界断言仍通过。 |
| E-8109 | mutation-test | `node --test --test-concurrency=1 --test-name-pattern "首发和无进展补发使用同一启动内容" test/dhr78-startup-dispatch.test.mjs` | 将生产文本“Receipt 提交命令不是业务任务”临时改为“是业务任务”后：0 pass / 1 fail，断言失败；未提交。 | 代码轮2选择的生产语义变异确实被完整包络快照咬住。 |
| E-8110 | test | `node --test --test-concurrency=1 test/dhr78-startup-dispatch.test.mjs` | 变异原样还原后：17 pass / 0 fail，exit 0，6810ms。 | 有效单测变异红→还原绿闭合。 |
| E-8111 | test | `node --test --test-concurrency=1 relay-core/test/dhr78-startup-dispatch.test.mjs`（master 待提交合入版本） | 17 pass / 0 fail，exit 0，6455ms。 | squash 合入版本保留 DHR_81 专项语义与既有发送、拒绝、补发和恢复断言。 |
| E-8103 | review-dispatch | dh dispatch | observed | 复核派出：dhr81-code-round1 (independent, non-machine-readonly)｜E3 code round 1: b42f7ae fixed startup envelope and targeted test |
| E-8104 | review-dispatch | dh dispatch | observed | 复核派出：dhr81-requirements (independent, non-machine-readonly)｜E4 requirement/direction review: A13-A15, scope and evidence boundary |
| E-8105 | review-dispatch | dh dispatch | observed | 复核派出：dhr81-lessons (independent, non-machine-readonly)｜E5 lessons review: DHR78/DHR35 evidence-boundary patterns |
| E-8107 | review-dispatch | dh dispatch | observed | 复核派出：dhr81-code-round2 (fresh, independent, non-machine-readonly)｜E2 fresh code round 2: current b42f7ae..95d44e5, choose production semantic mutation and verify red then restore green |
| E-8108 | review-dispatch | dh dispatch | observed | 复核派出：dhr81-consistency (fresh, independent, non-machine-readonly)｜E14 consistency review: startup envelope siblings, sender contract and allowed-path scope |
