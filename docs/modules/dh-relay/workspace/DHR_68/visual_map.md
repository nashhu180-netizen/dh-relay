<!-- dh:v1 -->
# visual_map — DHR_68

## 步骤证据表

| 步骤 | 完成% | 要的证据 | 证据状态 |
|---|---:|---|---|
| 真实逐命令形态对照（验收 D） | 100 | 10 个动词的 exit code / stdout 是否 JSON / 长度 / 顶层键名；另拿到 herdr 自身 `agent start --timeout` 默认 30 000 ms 这条关键依据（E-6801、E-6802） | present |
| fake 形态校正 + A/B/C 红测 | 100 | fake 逐条对齐真实形态且只引出一处既有断言不符；五条红测取得**行为**失败终态（E-6803、E-6804） | present |
| CLI 层：启动专用 60s + timedOut/notReady 语义位 + paneRun 不解 JSON | 100 | `HERDR_START_TIMEOUT_MS === 60_000`；通用上限 30ms 时 `agent get` 超时而 `agent start` 通过；`paneRun` 返回字符串；`agent start` argv 逐字不变（E-6805、E-6806） | present |
| adapter 层：超时对账 + 启动期 blocked 保留 handle | 100 | 超时+存在→`paneKills=0` 且沿用 handle；超时+不存在→`paneKills=1` 且关闭 ID = 创建 ID；两支的 `agentStart`/`paneRun` 调用次数均恰好 1（不重试）；`agent_not_ready`→`ok:true` + `launch_blocked` | present |
| driver 层：blocked 恰写一次 Attention + 延后补发指令 | 100 | 事件序列 `attempt_started → host_observation_changed(blocked) → human_input_requested(blocked)`，节点稳定停在 `waiting_human`；无 `E_EXECUTOR_HOST_LOST`；blocked 期间 `sent=0`，离开 blocked 后 `sent=1` 且 Attention 仍为 1；零 Result | present |
| 卫生与范围 | 100 | `git diff --check` 干净；改动严格落在 5 条允许路径 + 本工作区；凭据形态扫描零命中 | present |
| 回归对照 | 90 | 定向 24 例 21 通过、3 例与 master 同名同因；全量并发基线本身不稳（F-6806），改串行定向比对 | present |
| 五路复核 + 变异点 | 100 | 轮1/轮2/需求/教训/一致性五路均由 fresh 只读实例完成；变异点由第二轮实例选点，其指定测试红、还原绿（E-6813、E-6816~E-6821） | present |
| 收口备料（gate / miner / 卫生） | 90 | `dh gate` 结构闸全过（唯一 ❌ 是待用户确认的 verify）；miner 备料已生成；凭据扫描零命中（E-6810、E-6824、E-6825） | partial |
