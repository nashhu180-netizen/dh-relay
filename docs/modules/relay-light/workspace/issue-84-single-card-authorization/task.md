# Issue #84 · 单卡交付授权对齐

- Issue：https://github.com/nashhu180-netizen/dh-relay/issues/84
- 档位：轻档；task_type=light；仅入口治理文档维护，不改运行代码或任务验收合同。
- 用户授权（2026-09-28）：检查三个仓库重复审批后，用户指示“改的话 建个 issue pr/mr 进行哈”。本次实施、commit、push、创建 PR；既有规则下的远端合并授权独立核对，不用本 PR 的新规则追溯扩权。
- 对象：nashhu180-netizen/dh-relay，docs/issue-84-single-card-authorization → master；基线 5f8850228c54b6c0da1bfb448d331808f0316e9d。
- worktree：.dh-worktrees/issue-84-single-card-authorization；client=codex-cli。
- 范围：AGENTS.md 与本目录 task.md、review.md；CLAUDE.md 为现有转发壳，无需修改。
- 目标：新任务单卡开工授权覆盖完整 Git 交付与本地收口，消除重复索权。
- 规则验收（适用于规则生效后的新卡，不是本卡权限追授）：Issue/commit/push/PR/合入态复验/verify/回填/任务清理共用该新卡开工授权；质量闸、真实人判、部署环境另授、旧卡不追溯、下一卡独立授权保留；实际远端合入与回填之前不清理。
- 步骤：登记 → 改入口规则 → 文档场景走读与独立一致性/教训复核 → commit/push/PR，读取 CI 结果。
- 停止边界：不改变 worker 节点权限、不替代平台必要审批、不调整 CI、不发布、不部署。
- 方案审核：独立 fresh-context 实例 /root/approval_alignment_review，建议对齐四类入口冲突；主会话采纳，结果复核另记 review.md。
- 状态：文档修改与独立一致性/教训复核 PASS；git diff --check 通过，进入 PR 交付。
- 阶段汇报@Issue84-文档复核：确认普通新卡不重复索权，保留 CI/人判/角色/环境边界，原审核实例定向复核通过。
