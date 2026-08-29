<!-- dh:v1 -->
# visual_map — DHR_61

## 步骤证据表 (Step Table)

| 步骤 | 完成% | 要的证据 | 证据状态 |
|------|------|---------|---------|
| 1 · Attempt Receipt 红例与兼容样本 | 100 | D1 测试跑红、旧 v2 receipt 仍可读；E-002/E-003/E-013 | present |
| 2 · 合同与 profile 容量校验 | 100 | schema/fixture 定向绿、容量与脱敏反例；E-006/E-014/E-016 | present |
| 3 · Store pause/fence/recovery | 100 | 幂等/冲突/损坏/恢复与 fenced 写入反例；E-010~E-017 | present |
| 4 · RPC v1/v2 与 retry | 100 | v1 兼容、v2 bootstrap/retry 原子性与稳定错误反例；E-013~E-017 | present |
| 5 · 全量回归与审计 | 100 | `npm test`、audit、凭据扫描、复核证据；E-019 冻结字节 237/237 | present |

> 证据状态四态：`missing / partial / present / waived`
