<!-- dh:v1 -->
# lesson_candidates — DRILL_02

> 仅在施工/复核出现有证据且可复用的现场时追加；W 阶段不预判教训结论。

## 候选

| ID | 触发现场 | 可复用规则候选 | 状态 |
|---|---|---|---|

W（builder#1）：本批无。现场记录：多会话共树时进场 `git rebase master` 会被他人 unstaged WIP 拒绝；`git merge-base HEAD master` 与 `git rev-parse master` 等值核查可证「基线已含 master 顶点、rebase 为 no-op」，是比 stash 他人 WIP 更安全的处置——是否成候选留 R1 教训路裁决。

C1（coder#1）：同一现场第二次命中（builder、coder 两个独立实例进场 rebase 均被拒、merge-base 核查均证 no-op，见 F-001/F-002）。「共树现场进场第一步以 merge-base 等值核查替代 stash/清理」出现重复观测，可作为可复用规则候选；收编与否仍留 R1 教训路裁决。另注：本批 RED→追加→GREEN 全程 `__pycache__/` 目录原地未动，验证 ignore 生效不依赖删除产物——与合同「不靠删除凑判据」的边界设定一致。
