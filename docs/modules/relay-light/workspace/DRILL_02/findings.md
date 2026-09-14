<!-- dh:v1 -->
# findings — DRILL_02

> 只登记施工/规划期发现的合同冲突、范围外事实与建议；状态变化由 monitor/orchestrator 裁决，worker 不自改。

## 登记项

| ID | 发现 | 影响 | 状态 |
|---|---|---|---|
| F-001 | 进场 `git rebase master` 被脏树拒绝：他人 WIP 占树（`relay_log.jsonl` 未暂存改动；untracked `.devin/`、`dispatch/monitor-W1.md`、`tools/relay-light/__pycache__/`）。`git merge-base HEAD master` = master 顶点 `51d8062`，本分支已含最新基线，rebase 属 no-op | 无实质影响——基线等价已满足；但后续 coder 进场同样会撞此拒绝，应按同款「merge-base 核查 + 自有 done 文件留证」处理（由 scribe 汇总至 `progress.md`），不得 stash/清理他人现场 | 已登记，供监工/编排知情；不阻塞 |
| F-002 | coder 进场复现 F-001：`git rebase master` 再被他人 WIP 拒绝（`relay_log.jsonl` unstaged；untracked `.devin/`、`dispatch/monitor-C1.md`、`dispatch/monitor-W1.md`、`done.builder.md`、`done.plan-reviewer.md`、`review.plan.md`、`tools/relay-light/__pycache__/`）。核查 `git merge-base HEAD master` = `git rev-parse master` = `51d80629e2debfde8c6cc644f2433808a9a66275`，HEAD=`4a718d931da6a6581c233f511d75f15068f8c8a9` 已含 master 顶点 | 无实质影响；按合同同款处置（不 stash/不清理），留证于 `done.coder.md`。证实「监工账本持续写 + 多角色共树」下进场 rebase 必被拒，merge-base 等值核查是稳定可用的替代判据 | 已登记，不阻塞 |
| F-003 | R1 lesson 路 P2-1：C1 候选原句「进场第一步以 merge-base 等值核查替代 stash/清理」省略触发条件——正确顺序是**先尝试 `git rebase master`，仅当它因已识别的他人 WIP 被拒后**，才核 `merge-base(HEAD, master) == master` 等值；该核查不得泛化为所有 rebase 的替代物，也不授权 stash/清理/提交他人文件 | 非阻塞措辞缺陷；按 review.lesson.md 限定语收编即可，不影响 R1 PASS | 已登记，待监工/编排知情 |

## 交接状态（F1 · scribe#1 · 2026-09-14）

- **开放项：无**。F-001 / F-002 / F-003 均为已登记的非阻塞项：F-001、F-002 为事实留证（进场 rebase 被他人 WIP 拒绝、merge-base 等值核查通过），F-003 为 R1 lesson 路 P2 措辞限定，已按 `review.lesson.md` 条件链处置收编；三者均不阻塞 F1 交接。
- 交付物 `85af7fb3e47e0cfe4150595c056da82f0d0e1b5a` 留在分支 `dryrun/rlt12-win`，本预演不进 master、不 push/PR/合并。
