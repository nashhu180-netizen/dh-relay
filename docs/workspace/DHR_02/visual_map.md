<!-- dh:v1 · visual_map.md — 步骤证据表。🟢 边做边更新。 -->
# visual_map — DHR_02 实现最小 Runner 与确定性 fake replay

## 步骤证据表 (Step Table)

| 步骤 | 完成% | 要的证据 | 证据状态 |
|------|------|---------|---------|
| 批A store+CAS 晋级+receipt 先于 spawn+fake adapter 骨架 | 100 | `relay-runner-authority.ps1` SUITE PASS + commit 9babae0 | present |
| 批B tick/observation+result/checkpoint 摄入+依赖冻结+fail-closed 矩阵 | 100 | `relay-runner-ingest.ps1` + `relay-runner-failures.ps1` SUITE PASS + commit 7789e9d | present |
| 批C 回放驱动器+blocked/decision 端到端回放 | 100 | 两回放套件 SUITE PASS + review-logs/replay-signatures.txt + commit 6a3d368 | present |
| 批D 守卫扩围+runner 清单+README | 100 | 守卫扩围 PASS（55 码）+ RELAY ALL PASS 11 套件 + commit 55819a0 | present |
| 批次小审（轮1 前移） | 100 | 轮1 account4 全面复核 + E4/E5 subagent 登记 review.md | present |
| 收口两轮复核+E 段 | 90 | 轮2 account9 + 返工轮1/2 + 轮2b fresh approved；主控探针 E-003/E-006/E-008；dh-check → 待 E11 用户确认 | present |

> 证据状态四态：`missing / partial / present / waived`
