<!-- findings.md -->
# findings — DHR_53

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|----|------|------|------|------|------|
| F-001 | P2 | 用户消息中的两块粘贴文本未进入旧主控上下文，旧卡选择为推断。 | `decisions.md` D-000；E-001 | 后续用户明确允许继续 DHR_53；该过程只作历史，不授权按旧卡面施工 | resolved |
| F-002 | P3 | 旧实现曾试图让 Core 冻结 dev-harness Recipe/path id。 | 旧 `decisions.md` D-003；旧 task_plan | A23/B21 已裁决 Core 不读取 task_type/Recipe；DevPlan task_type 继续由 dev-harness 自身使用 | superseded |
| F-003 | P2 | 旧 DHR_53 在 P6 Gate/DHR_30 未满足时按 workspace waiver 开工。 | `decisions.md` D-002；旧 P7 | B21 使旧实现整体 superseded；waiver 不延续。重建须满足当前 P7 前置并取得单独授权 | superseded |
| F-004 | P3 | `wt/DHR_30` 分支与 `master` 历史已分叉（同内容不同 SHA，merge-base 停在 `554e543` DHR_49 期），后续 DHR_30 收口合并会比预期麻烦。 | `git merge-base master wt/DHR_30`；`git log --oneline master..wt/DHR_30` | 不属本卡范围，登记备查，供 DHR_30 收口时处理 | open |
| F-005 | P1 | 旧 DHR_53 HEAD `fec9ec1bbbab90813d7d3f3aad1dc847c317ca81` 实现单 task Run Binding、task_type Recipe、业务 node_type 和 DevHarness workflow/adapter，与正式 A23 冲突。 | tree `6452aebbab080ea6002ddd749b6cbc8061352744`；E-005；`archive/legacy-fec9ec1-path-blob-manifest.md` | 已建立 `archive/DHR_53/pre-A23-fec9ec1` 并删除旧 worktree/branch；旧证据不计新验收。新施工须从届时精确 master SHA 建树 | resolved |
| F-006 | P2 | 主树的 `execution_strategy.md`、`visual_map.md`、`review.md`、`decisions.md` 仍保存旧卡面形成史。 | 本 workspace；archive tag | 新 brief/task_plan 明确它们不是当前施工权威；完整旧版本已由 archive tag 保存。新施工开工时按新实现重新生成/回填，不提前伪造 | open |

> 级别：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞
