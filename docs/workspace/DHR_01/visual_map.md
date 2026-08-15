<!-- dh:v1 · visual_map.md — 步骤证据表。🟢 边做边更新。 -->
# visual_map — DHR_01 冻结接力权威、双维状态与异常契约

## 步骤证据表 (Step Table)

| 步骤 | 完成% | 要的证据 | 证据状态 |
|------|------|---------|---------|
| 批A 契约参数+计划/权威/回执 schema | 0 | `relay-contract-schema.ps1` SUITE PASS + commit | missing |
| 批B result/checkpoint/事件/handoff schema+身份链判定 | 0 | `relay-contract-identity.ps1` SUITE PASS + commit | missing |
| 批C 穷举转换矩阵+双维 fail-closed | 0 | `relay-contract-transitions.ps1` 穷举 72 组合 PASS + commit | missing |
| 批D 脱敏+失败路径夹具+runner | 0 | `relay-contract-redaction.ps1`/`relay-contract-failures.ps1` PASS + `run-relay-tests.ps1` → RELAY ALL PASS + commit | missing |
| 批次小审（轮1 前移） | 0 | 各批 fresh 小审结论登记 review.md | missing |
| 收口两轮复核+E 段 | 0 | review.md 轮2 结论 + dh gate/check | missing |

> 证据状态四态：`missing / partial / present / waived`
