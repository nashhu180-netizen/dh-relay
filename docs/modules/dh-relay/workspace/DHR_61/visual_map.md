<!-- dh:v1 -->
# visual_map — DHR_61

## 步骤证据表 (Step Table)

| 步骤 | 完成% | 要的证据 | 证据状态 |
|------|------|---------|---------|
| 1 · Attempt Receipt 红例与兼容样本 | 0 | D1 测试跑红、旧 v2 receipt 仍可读 | missing |
| 2 · 合同与 profile 容量校验 | 0 | schema/fixture 定向绿、容量与脱敏反例 | missing |
| 3 · Store pause/fence/recovery | 0 | 幂等/冲突/截断/强杀恢复与 fenced 写入反例 | missing |
| 4 · RPC v1/v2 与 retry | 0 | v1 兼容、v2 bootstrap/retry 原子性反例 | missing |
| 5 · 全量回归与审计 | 0 | `npm test`、audit、凭据扫描、复核证据 | missing |

> 证据状态四态：`missing / partial / present / waived`
