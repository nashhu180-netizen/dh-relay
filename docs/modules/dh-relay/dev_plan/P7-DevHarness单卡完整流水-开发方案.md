# P7 DevHarness 单卡完整流水 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:status
汇报: 已按 design/06 改为多控制面单卡流水；等待 P6 阶段闸
现状: DHR_36~40 均未开始
进行到: blocked-by-phase-gate:P6
下一步: P6 通过后，依据真实 Executor Profile、CLI/SSH 和 Herdr 证据做 B-adjust
看什么: design/02、design/05、design/06、design/04 的 Workflow Contract 部分、P6 证据
阻塞: P6 Gate 未通过
-->

## 0. 定位

P7 第一次把通用 Relay Runtime、可替换控制客户端、Herdr 施工和 DevHarness 领域规则合成一条真实单卡流水。

目标是用一张用户选择的标准档任务卡，从已完成 A/B 和开工授权开始，跑完 S0~S3、E0~E13，并形成 `verify(<scope>)`。

本阶段必须证明：

```text
DSH 完全关闭
  -> Relay CLI 发起和观察 Run
  -> Herdr + Codex/Claude Code 施工
  -> CLI 处理 Attention 和 E11 Approval
  -> Finalizer 完成 verify
```

DSH、Pi 或其他客户端可以同时连接同一 Run，提供更好的展示和交互。它们不能成为单卡闭环的唯一入口。

P7 不做多卡和通用重编排。

## 1. 前置条件

- P6 Gate 通过；
- 至少一个 Codex 和一个 Claude Code Executor Profile 已实测；
- Relay CLI、Store、Runtime 恢复和无 DSH 路径已通过 P5/P6；
- 用户选择真实标准档任务卡；
- DevHarness Contract 来源 commit 与 Gate Bundle 可冻结；
- 用户明确放行 P7。

## 2. 交付范围

交付：

1. `dev-harness/task-standard@1` Workflow Contract。
2. DevHarness Contract Exporter 或受控人工 fixture。
3. Gate Adapter 和结构化 Gate Result。
4. Authorization Request、Authority Snapshot 和 Plan Proposal。
5. 控制客户端中立的 Start Preview、Attention 和 Approval。
6. S0~S3 施工路径。
7. E0~E10 机器闸、两轮复核、需求和教训复核、收口备料。
8. E11 持久 Approval、E12 Finalizer、E13 销户。
9. 一张真实卡的完整 verify 闭环。
10. 同一 Run 在 CLI 与任一增强客户端中的状态一致性证明。

不交付：

- 多卡调度；
- 卡级重编排；
- 通用诊断 Agent；
- 周报 Outbox；
- run 级跨卡归档；
- 远端 test push；
- Linux 完整产品定型；
- GUI 专属的流程完成条件。

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
allowed_control_clients
executor_profile_candidates
```

`allowed_control_clients` 只描述可以连接和提交请求的客户端种类，不赋予它们直接写 Run Store 的权限。

## 4. 控制面与角色路由

DevHarness 角色映射到能力要求，不能映射到唯一产品：

| 角色 | 必需能力 | 候选执行器 |
|---|---|---|
| planner / brief / task plan | 只读输入、结构化 Proposal、工件写入范围 | Pi、DSH Native、Herdr Agent |
| build | 交互、续接、编码、用户输入 | Herdr + Codex/Claude Code |
| fresh review | 独立上下文、通常只读 | Pi、DSH one-shot、fresh Herdr |
| lead / requirement / lesson | 结构化 verdict 或工件输出 | Pi、DSH Native、fresh Herdr |
| machine gate | 确定性执行 | Process / Gate Adapter |
| finalizer | 高权限、幂等、Receipt 绑定 | Privileged Process |

任何 hard_required 角色都必须在本次 Run 的候选集合中存在至少一个非 DSH-only Profile。若首选 DSH Executor 不可用，Relay 只允许使用预登记且能力等价的 fallback；没有 fallback 时暂停并生成 Attention。

## 5. 任务表

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位 | 状态 | 依赖 | 工作区 | 验收时间 · verify SHA |
|---|---|---|---|---|---|---|
| DHR_36 | 发布 DevHarness 标准档 Contract 与 Gate Adapter | 标准 | blocked-by-phase-gate:P6 | P6 Gate | <开工时回填> | |
| DHR_37 | 接通客户端中立授权、Authority Snapshot 与棒 0 Proposal | 标准 | blocked-by-phase-gate:P6 | DHR_36 | <开工时回填> | |
| DHR_38 | 跑通 S0~S3 落户和 Herdr 施工 | 标准 | blocked-by-phase-gate:P6 | DHR_37 | <开工时回填> | |
| DHR_39 | 接通 E0~E10 机器闸、复核与收口备料 | 标准 | blocked-by-phase-gate:P6 | DHR_38 | <开工时回填> | |
| DHR_40 | 接通多控制面 E11~E13 并用真实卡完成 verify | 标准 | blocked-by-phase-gate:P6 | DHR_39 | <开工时回填> | |

DHR_38~40 在开工 B-adjust 时预计需要按安全边界继续拆分。P7 在 S0~S3 + E0/E1 跑通后设置中途证据点，不等最终 DHR_40 才第一次检验真卡。

### DHR_36：Contract 与 Gate Adapter

目标：

- 从 DevHarness 机读锚点、节点表和动作细则生成或维护冻结 Contract。
- 复杂领域规则通过 Gate Adapter 调用现有工具。
- Contract 区分 hard_required、default_enabled、optional、dynamic 和 crosscut_action。
- Contract 声明节点所需能力，不写死 DSH 页面或某个 Agent 产品。

机器验收：

- S0~S3、E0~E13 与源节点表可追溯。
- 两轮独立复核、E11、E12、E13 等硬节点不可省略。
- source commit、Contract hash、Gate digest 变化被检测。
- 旧 Run 继续绑定旧版本，新 Run 不静默切换。
- Headless 不具备视觉能力时，相关节点启动前拒绝或路由，不能静默通过。

### DHR_37：授权与棒 0

流程：

```text
任一合法控制客户端选择项目与任务卡
  -> authorization-request
  -> Relay 校验仓、卡、状态、Git 与 Contract
  -> Relay 生成客户端中立 Start Preview
  -> DSH / Pi / CLI 渲染同一 Preview
  -> 用户确认
  -> Relay 原子生成 Authority Snapshot
  -> 选定 Planner Profile 生成 Proposal
  -> Compiler 生成 ResolvedPlan
```

Relay CLI 至少提供：

```text
relay start preview --request <file>
relay start confirm <request_id>
relay plan show <run_id>
```

具体命令可以在 DHR_37 冻结，但 DSH Bridge 和 Pi Extension 必须调用同一服务合同。

机器验收：

- Agent 只能写 request 和 proposal，不能生成 snapshot。
- 未授权卡、目标变更、验收引用变化和范围越界被拒。
- ResolvedPlan 与 Authority、Contract、Profile 能力和 effect 一致。
- 用户确认前不创建正式 Run 和跨仓索引。
- CLI 与 DSH/Pi 对同一 Start Preview 的任务卡、effect 和 hash 一致。
- DSH 不启动时可以完成完整授权链。

### DHR_38：S0~S3

目标：

- S0 确定性创建任务 worktree 和工作区骨架。
- S1/S2 由已选择的 Planner/Author Profile 生成 brief 和 task plan，首选可以是 Pi、DSH Native 或 Herdr。
- S3 长时间施工使用 Herdr + Codex/Claude Code。
- 按施工批次动态展开 checkpoint、小审和修复。

机器验收：

- 工作区文件齐备且非占位。
- 一卡一 worktree，普通节点不写主工作树。
- build Receipt 绑定 Executor Profile、账号、Contract 与 Authority。
- Agent `done` 且无合法 Result 时保持 `awaiting_result`。
- DSH Executor 丢失只中断对应 Attempt，预登记 fallback 产生 fresh Attempt。
- CLI 可以显示当前节点、Herdr host_ref 和 Attention。

中途证据点：

```text
S0~S3 完成
E0/E1 Gate 运行
不执行 E11/E12/E13
```

该证据点用于尽早验证真实代码、工件和 Gate 接线，不构成 P7 完成。

### DHR_39：E0~E10

目标：

- E0/E1 使用 Process 与 Gate Adapter。
- 代码复核两轮 fresh，施工者不复核自己。
- requirement review、lesson review、miner、as-built、证据挂接和交付材料按 Contract 执行。
- fresh review 通过能力匹配选择 Pi、DSH one-shot 或 fresh Herdr。
- E9/E10 生成可序列化的交付摘要和证据索引，DSH 页面与 CLI 只是不同渲染器。

机器验收：

- R2 只在 R1 完成后 ready，汇合只在两轮结果齐全后 ready。
- rework 使用 fresh Attempt，并重走受影响 Gate 和复核。
- lesson review 真正 launch 并诚实区分有候选、无候选、失败。
- E10 生成绑定候选、证据和 effect 的 releasePacket。
- `relay inspect` 可以在纯终端显示 releasePacket 摘要和证据路径。
- 无图形界面不能导致 E9/E10 被跳过。

### DHR_40：E11~E13 和真实卡

E11：

- Relay 持久化 Approval Request，绑定 releasePacket hash、allowed effects、excluded effects 和 expected state。
- DSH UI、Pi TUI 与 Relay CLI 均可展示同一请求。
- CLI 提供 `relay approve` 或等价窄命令。
- 用户回答由 Relay 保存不可变 Approval Receipt。
- 客户端自身的临时 Approval 不能替代 Relay Receipt。

E12/E13：

- 只有 Runner 校验 Receipt 后签发 Privileged Process Receipt。
- Finalizer 在暂存分支执行 squash、复验、回填和 verify，再一次 CAS 快进。
- 崩溃从 journal 最后完成步恢复。
- Agent 不能直接调用 Finalizer。

真实卡必测路径：

```text
DSH 关闭
  -> CLI Start Preview 与确认
  -> Herdr 施工
  -> CLI 查看 E9/E10
  -> CLI 提交 E11
  -> E12/E13
  -> verify(<scope>)
```

若 DSH 可用，同一 Run 再连接 DSH，只验证展示一致性，不能把两次不同 Run 拼成结论。

真实卡验收：

- 从 Start Preview 到 verify 的事件链完整。
- 控制终端断开、SSH 重连和 Herdr 重连不改变 Run 真相。
- DSH 重启或缺席不改变 Run 真相。
- 宿主外检查核对 candidate、manifest、DevPlan、verify 和 worktree 清理。
- 同一 Approval Request 从 CLI 或 DSH 提交时，Receipt 语义和 hash 绑定一致。

## 6. P7 阶段闸

### 核心机器闸 P7-M

| ID | 命题 |
|---|---|
| P7-M1 | DevHarness Contract 与冻结源一致，硬节点不可省略 |
| P7-M2 | Authority、Proposal、ResolvedPlan 权限链闭合 |
| P7-M3 | S0~S3 在真实卡上完成，Herdr 施工 Result 合法 |
| P7-M4 | E0~E10 的机器闸和复核链完整 |
| P7-M5 | E11 Receipt 绑定 releasePacket、effect 和 expected state |
| P7-M6 | E12/E13 崩溃恢复幂等，最终产生 verify |
| P7-M7 | DSH、Pi、CLI 和 Herdr 状态均不能越权改写 DevHarness 完成事实 |
| P7-M8 | DSH 完全关闭时，CLI 完成 Start、Attention、E11 和最终查询 |
| P7-M9 | 必经角色均有非 DSH-only Executor，fallback 产生 fresh Attempt |

### 增强验收 P7-X

```text
DSH 图形化展示同一真实 Run
Pi TUI 处理一次 Attention 或 review
DSH 到 Herdr 的 pane 聚焦
```

这些增强项决定日常首选体验，不决定单卡核心闭环是否成立。

### 人类闸 P7-H

用户判断：

- 真实单卡使用体验是否优于手动多终端接力；
- 纯 CLI/SSH 路径是否足以作为长期备用入口；
- DSH 或 Pi 与 Herdr 之间的切换是否清楚；
- E11 在图形界面和终端中的证据展示是否都可信、易懂；
- 失败时是否能够知道系统卡在哪里。

### 解锁规则

P7-M 全部通过、P7-H 明确、用户同意进入 P8 后，P8 才解除阻塞。P7-X 可以通过、受限或不适用。

## 7. 从旧 P2 吸收的责任

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

## 8. 开工边界

P6 未通过时，DHR_36~40 均不得开工。真实卡由用户在 P7 开工前选择，计划不能替用户预选。本计划重写后需要 fresh 审核。
