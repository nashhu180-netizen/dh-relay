<!-- dh:v1 -->
# visual_map — DHR_52

## 步骤证据表 (Step Table)

| 步骤 | 完成% | 要的证据 | 证据状态 |
|---|---:|---|---|
| capability snapshot + 严格握手 | 0 | 同/异 hash 正反例与基线逐字匹配 | missing |
| 本地 NDJSON transport | 0 | pipe/UDS、坏帧、连接关闭测试 | missing |
| RPC server + 断连隔离 | 0 | 断连前后 state/event byte equality | missing |
| subscribe 完整帧 | 0 | 两种正例与 F-023 三种反例 | missing |
| F-057 决策 | 0 | 可复跑反例、reason 边界、裁决 | missing |
| 五道机器闸 | 0 | test/validate/audit/fixture/capability 输出 | missing |

> 证据状态四态：`missing / partial / present / waived`。
