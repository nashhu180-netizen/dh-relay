# findings — DHR_82

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|----|------|------|------|------|------|
| F-8201 | P2 | fake 绿仅证明 seq 判据；真实 Herdr 是否稳定提供字段仍不可证。 | B-53 §6 | 如实写入 review/E10，不扩大为真实 Agent 结论。 | open |
| F-8202 | P1 | DHR_72 定向组出现未归因失败；DHR_76 定向组未得终态且 worker 未提交施工账即被中断。 | progress E-8206/E-8207；Herdr `w6:p2W` | fresh worker 先核现有 allowlist diff、确认失败归因与后台进程；不把当前候选送入 review/verify。 | open |
