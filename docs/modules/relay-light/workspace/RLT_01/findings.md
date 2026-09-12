<!-- dh:v1 -->
# findings — RLT_01

> 只登记事实与建议；状态变化由主控裁决后回填，不由施工者自改。

## 登记项

| ID | 发现 | 影响 | 状态 |
|---|---|---|---|
| F-001 | RLT_07（Issue #10 / PR #11）与本卡同触 `tools/relay-light/skill/**`：本卡先建三件骨架，RLT_07 往骨架填业务内容；两卡交错时以先合入者为准、后者 rebase | 跨卡守恒已写进双方 task_plan；2026-09-12 用户裁决 RLT_01 先开 | resolved · 2026-09-12 用户裁决 |
| F-002 | 仓根 `.gitignore` 未覆盖 `__pycache__/`/`*.pyc`，测试运行会在 worktree 产生 pyc 副产物（需求复核 F-03） | 不改 `.gitignore`（在 allowed-paths 外）；移交主控/后续卡裁决是否补白名单 | registered · 2026-09-12 需求复核 |
| F-003 | RLT_07 task_plan Batch 1/3 措辞为「Create SKILL.md/两 adapter」，本卡合入后三件将以骨架形态已存在（需求复核 F-02） | 属 RLT_07 rebase 时计划对齐事项，由 RLT_07 侧消化；本卡无动作 | registered · 2026-09-12 需求复核 |
