<!-- findings.md — 问题清单。🟢 边做边记。 -->
# findings — DHR_02 实现最小 Runner 与确定性 fake replay

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|----|------|------|------|------|------|
| F-001 | P3 | v1 event kind 枚举无 `plan_rejected`，proposal 被拒只能借 `plan_proposed`+reason 落账（task_plan K-1）；目标形态可考虑扩枚举（属 DHR_01 契约变更，需重新过契约测试） | 主控 Code Scout | 记录·不在本卡改契约 | open（backlog 候选） |
| F-002 | P3 | `LaunchDeadlineSeconds` 是本卡追加进 `relay-params.psd1` 的第五键（DHR_01 未冻结该值）；as-built/relay-contracts.md 收口时补记 | task_plan A1 | 收口时更新 as-built | open |

> 级别：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞
> 遗留（P0/P1 唯一合法路径，DC_46）：状态列写 `遗留→<DC_xx / backlog / 下计划名>（已确认）`——"已确认"三字代表用户已在对话里明确点头；没有这三个字，`dh-check` R13 仍按 `open` 处理。
