<!-- dh:v1 -->
# lesson_candidates — DRILL_02

> 仅在施工/复核出现有证据且可复用的现场时追加；W 阶段不预判教训结论。

## 候选

| ID | 触发现场 | 可复用规则候选 | 状态 |
|---|---|---|---|
| L-DRILL-02-1 | F-001/F-002：builder、coder 两个独立实例进场 `git rebase master` 均被他人 unstaged WIP 拒绝，`merge-base(HEAD, master)` 与 `git rev-parse master` 等值证 rebase 为拓扑 no-op | 共树现场：先按合同尝试 `git rebase master`；仅当其因已识别的他人 WIP 被拒时，才核 `merge-base(HEAD, master) == master`；等值只证拓扑 no-op，不授权 stash/清理/提交他人文件 | **R1 lesson：采纳**（W/C1 两次描述合并为一条，补条件链后收编；措辞 P2-1 转记 findings F-003） |
| L-DRILL-02-2 | C1 全程 `__pycache__/` 目录原地未动，以 RED→追加→`check-ignore`/测后 status GREEN 证明 ignore 生效不靠删除产物 | 验证 ignore 生效应保留副产品现场、以「不删除产物」验真，不靠删除凑 `git status` 判据 | **R1 lesson：合并**——并入 RLT_10 F-002 / RLT_03 F-008 既有 Python 副产品教训链，作机制化闭合证据，不另建平行教训 |

W（builder#1）：本批无。现场记录：多会话共树时进场 `git rebase master` 会被他人 unstaged WIP 拒绝；`git merge-base HEAD master` 与 `git rev-parse master` 等值核查可证「基线已含 master 顶点、rebase 为 no-op」，是比 stash 他人 WIP 更安全的处置——是否成候选留 R1 教训路裁决。

C1（coder#1）：同一现场第二次命中（builder、coder 两个独立实例进场 rebase 均被拒、merge-base 核查均证 no-op，见 F-001/F-002）。「共树现场进场第一步以 merge-base 等值核查替代 stash/清理」出现重复观测，可作为可复用规则候选；收编与否仍留 R1 教训路裁决。另注：本批 RED→追加→GREEN 全程 `__pycache__/` 目录原地未动，验证 ignore 生效不依赖删除产物——与合同「不靠删除凑判据」的边界设定一致。
