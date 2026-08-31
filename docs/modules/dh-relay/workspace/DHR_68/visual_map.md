<!-- dh:v1 -->
# visual_map — DHR_68

## 步骤证据表

| 步骤 | 完成% | 要的证据 | 证据状态 |
|---|---:|---|---|
| 真实逐命令形态对照（验收 D） | 0 | 每个动词的 exit code / stdout 是否 JSON / 长度；`agent start` 引用 DHR_35 已有 6 轮样本 | missing |
| fake 形态校正 + A/B/C 红测 | 0 | 三组红测失败原因是"缺该能力"；fake 默认值与对照表逐条一致 | missing |
| CLI 层：启动专用 60s + timedOut/notReady 语义位 + paneRun 不解 JSON | 0 | argv 不变、启动上限 60000、其余动词仍 10000 | missing |
| adapter 层：超时对账 + 启动期 blocked 保留 handle | 0 | `paneKills` 计数、关闭 ID = 创建 ID、`agentStart` 调用恰好 1 次 | missing |
| driver 层：blocked 恰写一次 Attention + 延后 completion instruction | 0 | 事件序列断言；无 `E_EXECUTOR_HOST_LOST`；`fake.sent` 时序 | missing |
| mutation 与收口 | 0 | 第二轮指定变异点、五路复核、卫生扫描、E10 证据包 | missing |
