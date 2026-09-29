<!-- dh:v1 -->
# findings — Issue #86

| ID | 级别 | 事实 / 边界 | 状态 / 下一步 |
|---|---|---|---|
| F-001 | 信息 | 范围收窄事实：原草案按「文档 agent 承接全部人工文档（DA-01 全类别）」+ 拟标准档规划；本轮用户定为轻档一批试跑「过程文档委托」——产品文档仍由执行者写，只把 dev-harness 过程工件交文档 agent。DA-01～DA-08 大部分口径本卡不覆盖，收口时在 review.md 如实登记未覆盖项 | 已在 task.md 验收候选与草案注记写明；不冒充全量交付 |
| F-002 | 信息 | 写者例外事实：现役 SKILL/AGENTS 的 sole writer 与恢复权威未登记文档 agent；本卡 execution_strategy/progress 由 builder#docs 代笔是用户本卡明确例外，不是旧协议本来如此 | 已在各工件头注标明；实施时把 document 角色边界写进协议 |
| F-003 | 信息 | phase 闭集冻结：`test_install_skill.py` 断言九值 phase 闭集；本卡不改测试代码，故 document 只能是角色、沿用现有 phase | 已落 task_plan §3 |
| F-004 | 信息 | PR #87（规划草案 PR）未合并、未实现是历史边界；本轮开发为用户另行授权，实际交付/合入按 AGENTS 单卡授权由主会话核对 | 施工/收口时由主会话核对目标分支与关联 |
| F-005 | P2 | plan-review F-R1：task.md 范围行「roles.toml 条件句」与「不改配置」冻结并存可被误读；主会话采纳建议收紧为「roles.toml 不动；本卡不改任何配置或测试代码」 | 已改 task.md；来源 evidence/plan-review-1.json |
| F-006 | P3 | plan-review F-R2：execution_strategy 属四类恢复权威但本卡由文档 agent 代笔；恢复方须按协议对 Herdr 实态核验 | 审核信息项，工件头注已标明，无需改动 |
| F-007 | P3 | plan-review F-R3：未启动复核实例未在计划重申 model gate 步骤；新实例启动时 gate 自然覆盖 | 审核信息项，无需改动 |
| F-008 | P3 | batch-review F-B1：SKILL「原责任方停止并写」首读歧义（实指停止并行写） | Codex 已修措辞为「原责任方不再同时写入这些文件」，SKILL.md 新 hash `70b87ca…`，19 tests 仍 OK（evidence/batch-1-codex-revision.json） |
| F-009 | P3 | batch-review F-B2：双 adapter 增补「当前 space 标签页」复用段，超 task_plan §3 四 bullet 但与现役拓扑一致、不冲突 | 审核信息项，记录备查 |
| F-010 | P3 | batch-review F-B3：SKILL 列 document 可用 phase 为超集，本卡未实证 plan-review/e2-code-review/decision 转录路径 | 主会话事实注：plan-review 转录已由 `DONE.plan-review.document-plan-summary.md` + `reviewer-confirmed-1` 实际证明；未跑仅 e2-code-review/decision；收口覆盖登记按此口径 |
| F-011 | 信息 | 缺证反例演练（获授权）：拟更新事实「跨平台验证已通过」唯一指定来源 `evidence/probe-cross-platform-result-missing.json` 不存在，文档 agent 按合同 BLOCKED（reason=missing_evidence），未用本地 19 tests 替代、未补造来源、未标跨平台通过 | 预期反例闭环，非整卡真实阻塞；见 `BLOCKED.batch.document-missing-source.md` |
| F-012 | P2 | 一致性复核 F-C1：adapter-codex 同节相邻句单位不一致——拓扑 bullet 定义角色实例为「具名 pane」，新增段写「分别创建具名 tab」，Codex 侧无 tab 创建合同可依据 | 主会话决定本轮保留为非阻断建议、**未修**；收口覆盖登记/后续修订轮备查 |
| F-013 | P2 | 教训复核 F-L1：草案尾注 line「实施方案精简（用户 2026-09-28）」错归因（实为 Codex 方案），review.md/progress.md 权威更正已存在，但草案尾注同文副本无相邻更正标记 | 已按指示在原文旁追加更正标记并指向 review.md 确认记录，原文保留 |
| F-014 | P3 | 教训复核 F-L2：`docs/modules/relay-light/knowledge/` 不存在，本卡教训只有 workspace lesson_candidates.md 一个落点 | 如实记录现状；是否建模块级教训落点属范围外决策，交主会话/用户裁，不新建 |

## 可恢复的下一步

读 `task_plan.md` 步骤表与 `execution_strategy.md` 实态表定位；plan-review 结论到后按其路由（PASS→主会话 S3 施工；FAIL→回本文档 agent 整改）。
