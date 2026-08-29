<!-- dh:v1 -->
# DHR_33 · 证据地图

## 步骤证据表

| 步骤 | 完成% | 要的证据 | 证据状态 |
|---|---:|---|---|
| 1 · Adapter 与状态映射 | 100 | E-3302/E-3305 | present |
| 2 · CLI/DSH-off smoke | 100 | E-3303 | partial |
| 3 · 快慢路与能力边界 | 100 | E-3304 | partial |
| 4 · 变异与五路复核 | 100 | E-3306 | present |
| 5 · Linux/Oracle 人验 | 0 | E-3301/E-3307/E-3308 | partial |

```text
herdr CLI（真实/桩）
   │ 步骤2 包装层 herdr-cli.mjs（spawn，不拼 shell）
   ▼
herdr-executor.mjs（launch/observe/capture/reconcile/stop + 状态映射表）
   │ 步骤4 driver :88 分叉点接线（herdr-agent 分支）
   ▼
store 事件账（checkpoint 心跳 / human_input_requested / host_observation_changed / appendResult）
   │ 冻结 7 值状态机（state.mjs 真相表）
   ▼
CLI focus/host_ref（inspectRun detail → renderFocus，零契约变更）
   │
   ├─ test/herdr-adapter.test.mjs（fake-herdr 桩，断言 1~9）→ E-3302/3303/3304/3305
   ├─ capability 基线窄路径更新 + agent-node 钉 → 步骤7
   └─ Windows 真实 herdr 最小 smoke → progress 证据；Linux = 延后（E-3301）
```
