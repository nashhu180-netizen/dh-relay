<!-- dh:v1 -->
# findings — DRILL_02

> 只登记施工/规划期发现的合同冲突、范围外事实与建议；状态变化由 monitor/orchestrator 裁决，worker 不自改。

## 登记项

| ID | 发现 | 影响 | 状态 |
|---|---|---|---|
| F-001 | 进场 `git rebase master` 被脏树拒绝：他人 WIP 占树（`relay_log.jsonl` 未暂存改动；untracked `.devin/`、`dispatch/monitor-W1.md`、`tools/relay-light/__pycache__/`）。`git merge-base HEAD master` = master 顶点 `51d8062`，本分支已含最新基线，rebase 属 no-op | 无实质影响——基线等价已满足；但后续 coder 进场同样会撞此拒绝，应按同款「merge-base 核查 + 记 progress」处理，不得 stash/清理他人现场 | 已登记，供监工/编排知情；不阻塞 |
