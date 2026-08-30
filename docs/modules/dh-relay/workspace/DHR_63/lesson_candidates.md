<!-- dh:v1 -->
# DHR_63 · 教训候选

| ID | 一句话教训 | 状态 |
|---|---|---|
| L-6301 | 任务类型复核配方与允许写入路径必须在立项时做可满足性互查；配方所需证据若不在允许路径内，任务从派工时即不可收口。 | ready-for-review |
| L-6302 | 同一输入有多条校验路径时，fail-closed 只能由生产实际走的路径证明；validator 拒绝不等于 loader 拒绝。 | ready-for-review |
| L-6303 | 引用配置指纹不可证的 fallback 会把 fail-closed 传染到调用方，导致上游在启动前被拒；维护 fallback 前须复核消费者的前置 guard。 | ready-for-review |
