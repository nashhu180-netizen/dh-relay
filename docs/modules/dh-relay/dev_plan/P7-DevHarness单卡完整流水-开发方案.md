# P7 DevHarness 单卡完整流水 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:status
汇报: 路线计划已落盘，等待 P6 阶段闸
现状: DHR_36~40 均未开始
进行到: blocked-by-phase-gate:P6
下一步: P6 通过后，依据真实 Executor Profile 和 Herdr 证据做 B-adjust
看什么: design/02、design/05、design/04 的 Workflow Contract 部分、P6 证据
阻塞: P6 Gate 未通过
-->

## 0. 定位

P7 第一次把通用 Relay Runtime、DSH 工作台、Herdr 施工和 DevHarness 领域规则合成一条真实单卡流水。

目标是用一张用户选择的标准档任务卡，从已完成 A/B 和开工授权开始，跑完 S0~S3、E0~E13，并形成 `verify(<scope>)`。P7 不做多卡和通用重编排。

## 1. 前置条件

- P6 Gate 通过；
- 至少一个 Codex 和一个 Claude Code Executor Profile 已实测；
- DSH Bridge、Relay Store 和 Runtime 恢复已通过 P5；
- 用户选择真实标准档任务卡；
- DevHarness Contract 来源 commit 与 Gate Bundle 可冻结；
- 用户明确放行 P7。

## 2. 交付范围

交付：

1. `dev-harness/task-standard@1` Workflow Contract。
2. DevHarness Contract Exporter 或受控人工 fixture。
3. Gate Adapter 和结构化 Gate Result。
4. Authorization Request、Authority Snapshot 和 Plan Proposal。
5. S0~S3 施工路径。
6. E0~E10 机器闸、两轮复核、需求和教训复核、收口备料。
7. E11 持久 Approval、E12 Finalizer、E13 销户。
8. 一张真实卡的完整 verify 闭环。

不交付：

- 多卡调度；
- 卡级重编排；
- 通用诊断 Agent；
- 周报 Outbox；
- run 级跨卡归档；
- 远端 test push；
- Linux 完整验收。

## 3. DevHarness 与 Relay 的边界

领域真相继续位于业务仓：

```text
DevPlan
workspace
review
progress
as-built
knowledge
Git commit
verify trailer
```

Relay 运行真相位于：

```text
<repo>/.dh-relay/<run_id>/
```

Relay 不复制 DevHarness 全文，也不重新实现全部 `dh` 机器规则。Gate Adapter 调用冻结版本的 DevHarness 工具，返回结构化结果。

每个 Run 冻结：

```text
source_repo
source_commit
contract_id
contract_version
contract_content_hash
gate_bundle_id
gate_bundle_digest
required_capabilities
```

## 4. 任务表

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位 | 状态 | 依赖 | 工作区 | 验收时间 · verify SHA |
|---|---|---|---|---|---|---|
| DHR_36 | 发布 DevHarness 标准档 Contract 与 Gate Adapter | 标准 | blocked-by-phase-gate:P6 | P6 Gate | <开工时回填> | |
| DHR_37 | 接通授权 Request、Authority Snapshot 与棒 0 Proposal | 标准 | blocked-by-phase-gate:P6 | DHR_36 | <开工时回填> | |
| DHR_38 | 跑通 S0~S3 落户和 Herdr 施工 | 标准 | blocked-by-phase-gate:P6 | DHR_37 | <开工时回填> | |
| DHR_39 | 接通 E0~E10 机器闸、复核与收口备料 | 标准 | blocked-by-phase-gate:P6 | DHR_38 | <开工时回填> | |
| DHR_40 | 接通 E11~E13 并用真实卡完成 verify | 标准 | blocked-by-phase-gate:P6 | DHR_39 | <开工时回填> | |

### DHR_36：Contract 与 Gate Adapter

目标：

- 从 DevHarness 机读锚点、节点表和动作细则生成或维护冻结 Contract。
- 复杂领域规则通过 Gate Adapter 调用现有工具。
- Contract 区分 hard_required、default_enabled、optional、dynamic 和 crosscut_action。

机器验收：

- S0~S3、E0~E13 与源节点表可追溯。
- 两轮独立复核、E11、E12、E13 等硬节点不可省略。
- source commit、Contract hash、Gate digest 变化被检测。
- 旧 Run 继续绑定旧版本，新 Run 不静默切换。

### DHR_37：授权与棒 0

流程：

```text
DSH 选择项目与任务卡
  -> authorization-request
  -> Relay 校验仓、卡、状态、Git 与 Contract
  -> DSH 展示 Start Preview
  -> 用户确认
  -> Relay 原子生成 Authority Snapshot
  -> DSH Native Planner 生成 Proposal
  -> Compiler 生成 ResolvedPlan
```

机器验收：

- Agent 只能写 request 和 proposal，不能生成 snapshot。
- 未授权卡、目标变更、验收引用变化和范围越界被拒。
- ResolvedPlan 与 Authority、Contract、Profile 能力和 effect 一致。
- 用户确认前不创建正式 Run 和跨仓索引。

### DHR_38：S0~S3

目标：

- S0 确定性创建任务 worktree 和工作区骨架。
- S1/S2 由 DSH Native Agent 生成 brief 和 task plan。
- S3 长时间施工使用 Herdr + Codex/Claude Code。
- 按施工批次动态展开 checkpoint、小审和修复。

机器验收：

- 工作区文件齐备且非占位。
- 一卡一 worktree，普通节点不写主工作树。
- build Receipt 绑定 Executor Profile、账号、Contract 与 Authority。
- Agent `done` 且无合法 result 时保持 awaiting_result。

### DHR_39：E0~E10

目标：

- E0/E1 使用 Process 与 Gate Adapter。
- 代码复核两轮 fresh，施工者不复核自己。
- requirement review、lesson review、miner、as-built、证据挂接和交付材料按 Contract 执行。
- DSH one-shot Codex/Claude 可用于 fresh review，无法满足能力时使用 Herdr 或 DSH Native fresh Agent。

机器验收：

- R2 只在 R1 完成后 ready，汇合只在两轮结果齐全后 ready。
- rework 使用 fresh attempt，并重走受影响 Gate 和复核。
- lesson review 真正 launch 并诚实区分有候选、无候选、失败。
- E10 生成绑定候选、证据和 effect 的 releasePacket。

### DHR_40：E11~E13 和真实卡

E11：

- DSH UI 展示 releasePacket、allowed effects 和 excluded effects。
- 用户回答由 Relay 保存持久 Approval Receipt。
- DSH 内置一次性 Approval 只能作为界面适配，不能替代 Relay Receipt。

E12/E13：

- 只有 Runner 校验 Receipt 后签发 Privileged Process Receipt。
- Finalizer 在暂存分支上执行 squash、复验、回填和 verify，再一次 CAS 快进。
- 崩溃从 journal 最后完成步恢复。
- Agent 不能直接调用 Finalizer。

真实卡验收：

- 从 Start Preview 到 `verify(<scope>)` 的事件链完整。
- DSH 重启、浏览器刷新和 Herdr 重连不改变 Run 真相。
- 宿主外检查核对 candidate、manifest、DevPlan、verify 和 worktree 清理。

## 5. P7 阶段闸

### 机器闸 P7-M

| ID | 命题 |
|---|---|
| P7-M1 | DevHarness Contract 与冻结源一致，硬节点不可省略 |
| P7-M2 | Authority、Proposal、ResolvedPlan 权限链闭合 |
| P7-M3 | S0~S3 在真实卡上完成，Herdr 施工 Result 合法 |
| P7-M4 | E0~E10 的机器闸和复核链完整 |
| P7-M5 | E11 Receipt 绑定 releasePacket 和 effect |
| P7-M6 | E12/E13 崩溃恢复幂等，最终产生 verify |
| P7-M7 | DSH/Herdr 状态均不能越权改写 DevHarness 完成事实 |

### 人类闸 P7-H

用户判断：

- 真实单卡使用体验是否优于手动多终端接力；
- DSH 与 Herdr 之间的切换是否清楚；
- E11 证据展示和确认是否可信、易懂；
- 失败时是否能够知道系统卡在哪里。

### 解锁规则

P7-M 全部通过、P7-H 明确、用户同意进入 P8 后，P8 才解除阻塞。

## 6. 从旧 P2 吸收的责任

P7 吸收旧 P2 的：

```text
workspace 八件套
标准流水节点
脚本 Gate
两轮代码复核
需求复核
教训复核
收口确认
Finalizer
Authority Snapshot
单卡真实垂直闭环
```

多卡、重编排、诊断、归档和 Oracle 留给 P8。

## 7. 开工边界

P6 未通过时，DHR_36~40 均不得开工。真实卡由用户在 P7 开工前选择，计划不能替用户预选。
