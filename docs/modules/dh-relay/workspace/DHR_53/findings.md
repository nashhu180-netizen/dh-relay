<!-- findings.md -->
# findings — DHR_53

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|----|------|------|------|------|------|
| F-001 | P2 | 用户消息中的两块粘贴文本（施工顺序 9 行 / 要做的任务 3 行）未进入主控上下文，卡选择为推断。 | `decisions.md` D-000；E-001 | 已按链头 DHR_53 推进并全程可回滚（未合 master）；明天人验第一项确认卡选对没有 | open |
| F-002 | P3 | 复核路径 id 在两份权威间不一致：design/10 §5.3 写 `consistency`，dev-harness registry 写 `consistency_review`。 | `decisions.md` D-003；`dev-harness/tools/dh-policy/registry.mjs` `TYPE_RECIPES` | 本卡冻结 registry 的 id，design/10 的写法登记为行文简写；是否回头统一 design/10 交人验裁决 | open |
| F-003 | P2 | P7 §1 前置「P6 Gate 通过」「DHR_30 进 master」今晚均未满足，本卡按 `decisions.md` D-002 放宽开工。 | `decisions.md` D-002 | 放宽限定在「不启动 Agent、不启用新根 start、不消费 `wt/DHR_30` 代码」；未改 P7 计划正文；明天人验裁决 | open |
| F-004 | P3 | `wt/DHR_30` 分支与 `master` 历史已分叉（同内容不同 SHA，merge-base 停在 `554e543` DHR_49 期），后续 DHR_30 收口合并会比预期麻烦。 | `git merge-base master wt/DHR_30`；`git log --oneline master..wt/DHR_30` | 不属本卡范围，登记备查，供 DHR_30 收口时处理 | open |

> 级别：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞
