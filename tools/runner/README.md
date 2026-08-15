# Relay Runner core v1

入口函数：

- `New-RelayRun` / `Open-RelayRun`：创建或打开运行档案。
- `Submit-RelayProposal`：校验提案并按 expected generation CAS 晋级。
- `Get-RelayReadyNodes` / `Start-RelayNodeAttempt`：计算 ready 集并先写 receipt 后启动。
- `Invoke-RelayTick`：消费宿主观测、probe、启动期限和停滞阈值。
- `Submit-RelayCheckpointFile` / `Submit-RelayResultFile`：按冻结身份与转换契约摄入工件。
- `Invoke-RelayReplay` / `Invoke-RelayReplayTick`：用静态剧本确定性回放。

运行目录是 `<Root>/<run_id>/`，包含 `plans/`、`launches/`、`attempts/`、`active-plan.json`、`authority.json`、`relay-state.json` 和只追加 `events.jsonl`。

固定决策：

1. 事件 kind 不扩枚举，拒收原因写入既有事件。
2. stale result 与其他 rejection 分流，checkpoint rejection 不设 stale kind。
3. receipt 与事件先于 adapter launch，句柄必须精确相等。
4. 心跳不刷新进展时间。
5. 同状态 checkpoint 是进度更新，不制造自环转换。
6. 异常统一投影 paused，active plan 与 authority 不变。
7. 自报 quota final 拒收并降级为 interrupted unknown。
8. replan 只允许保留旧节点并新增无环前置。
9. Runner 不调用 suspend/resume，也没有人工输入入口。
10. decision 冻结集由 DHR_01 契约函数计算，有效后续工件解冻。

落账顺序统一为 state 先于 event。Runner 自身发生 IO 故障时两者并非原子双写；从事件与状态对账、检测半态属于目标形态，本版不实现。

P1 明确不做：真实终端、完整 review lead、通用 DAG 调度、quota 识别/恢复通道、Runner resume。
