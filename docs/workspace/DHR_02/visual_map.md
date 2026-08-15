<!-- dh:v1 · visual_map.md — 步骤证据表。🟢 边做边更新。 -->
# visual_map — DHR_02 实现最小 Runner 与确定性 fake replay

## 步骤证据表 (Step Table)

| 步骤 | 完成% | 要的证据 | 证据状态 |
|------|------|---------|---------|
| 批A store+CAS 晋级+receipt 先于 spawn+fake adapter 骨架 | 0 | `relay-runner-authority.ps1` SUITE PASS + commit | missing |
| 批B tick/observation+result/checkpoint 摄入+依赖冻结+fail-closed 矩阵 | 0 | `relay-runner-ingest.ps1` + `relay-runner-failures.ps1` SUITE PASS + commit | missing |
| 批C 回放驱动器+blocked/decision 端到端回放 | 0 | `relay-runner-replay-blocked.ps1` + `relay-runner-replay-decision.ps1` SUITE PASS + 事件签名存档 + commit | missing |
| 批D 守卫扩围+runner 清单+README | 0 | `relay-contract-reason-coverage.ps1` 扩围 PASS + `run-relay-tests.ps1` → RELAY ALL PASS（11 套件）+ commit | missing |
| 批次小审（轮1 前移） | 0 | 各批 fresh 小审结论登记 review.md | missing |
| 收口两轮复核+E 段 | 0 | review.md 轮2 结论 + 主控变异探针 + dh gate/check | missing |

> 证据状态四态：`missing / partial / present / waived`
