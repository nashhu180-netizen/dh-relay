<!-- dh:v1 -->
# lesson_candidates — DHR_75

## 教训候选

| ID | 一句话教训 | 状态 |
|---|---|---|
| L-7501 | 短 TTL 续租复现必须把 fixture 初始化与目标慢调用分段取证：先完成 Store/actor 初始化并记录基线 expiry，再单独记录 CLI 调用区间、每次 renew 前后 expiry 与 observation/checkpoint；否则初始化抖动会伪造失租，无法证明同步阻塞因果。 | ready-for-review |
