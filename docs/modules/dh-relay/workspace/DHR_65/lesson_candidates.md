<!-- dh:v1 -->
# DHR_65 · 教训候选

## 教训候选

| ID | 一句话教训 | 状态 |
|---|---|---|
| L-6501 | formal validator 的负例不能替代 runtime consumer 的 fail-closed 证据；消费点必须做实现级 mutation。与 DHR_63 的 L-6302 重合，本卡仅补充 consumer mutation 的落证。 | ready-for-review |
| L-6502 | 若验收声明覆盖“任一已登记项”，synthetic fixture 必须枚举完整 ID、可观测结构和 fallback 图；子集绿测只能作为局部证据。 | ready-for-review |
| L-6503 | 显式 test script 新增专项文件时，须同时证明被清单拾取；异步启动前断言应等待完成事件，保险 timeout 必须可清理，不能用固定短等待当成功证据。 | ready-for-review |
