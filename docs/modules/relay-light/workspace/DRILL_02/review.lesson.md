<!-- dh:v1 · lesson review -->
# review.lesson — DRILL_02 R1 教训路复核

- 复核身份：fresh lesson reviewer（`lesson#1`），未参与 W/C1 施工。
- 复核对象：`lesson_candidates.md`、`findings.md`、`progress.md`、`brief.md`、`task_plan.md`，施工提交 `85af7fb3e47e0cfe4150595c056da82f0d0e1b5a`，以及 `git log --all --grep=DRILL_02` 所列本卡提交。
- 去重范围：仓内 `docs/modules/relay-light/**` 的 lesson/复核/工作区记录与 `docs/modules/dh-relay/knowledge/教训库-候选.md`；按 `merge-base`、`rebase`、`stash`、共树/脏树、`__pycache__`、`.pyc`、删除/清理副产品等关键词核对。未在该仓内范围找到的，只记为“未找到”，不外推为全局不存在。
- 边界：只评候选取舍与重复关系，不代替 consistency 路、验收或 verify。

## 候选逐条裁决

| 候选 | 现场证据 | 与既有 lessons 的关系 | 裁决 | 理由 |
|---|---|---|---|---|
| L-DRILL-02-1：共树现场 rebase 被他人 WIP 拒绝后，以 `git merge-base HEAD master` 与 `git rev-parse master` 等值核查确认已包含 master 顶点，并且不 stash/清理他人现场 | F-001/F-002 记录 builder、coder 两个独立实例均先执行 `git rebase master` 并因 unstaged WIP 被拒；两次 merge-base 均等于 master `51d80629e2debfde8c6cc644f2433808a9a66275`。`85af7fb` 提交正文及 diff 复述 coder 现场；`progress.md` 的 W-BL-001、C1-EV-001 给出同链证据 | 仓内关键词核对未找到“共享工作树中 rebase 因他人 WIP 被拒时，以 merge-base 等值作 no-op 判据且不碰他人 WIP”的既有候选。RLT_05 等记录的是 `--autostash` 成功现场，不是同一处置；AGENTS 只有一般 worktree/rebase 纪律，也未冻结该失败分支 | **采纳（合并 W 与 C1 两次描述为一条，补前提后采纳）** | 两次独立复现足以支撑可复用性。但可采纳规则必须写成条件链：**先按合同尝试 `git rebase master`；仅当它因已识别的他人 WIP 被拒时**，才核 `merge-base(HEAD, master) == master`。等值只证明 HEAD 已包含当前 master 顶点、此次 rebase 在提交拓扑上无需搬移；它不证明工作树干净，也不授权 stash、清理、提交或修改他人文件 |
| L-DRILL-02-2：验证 ignore 生效不应靠删除测试副产品凑 `git status`，应保留 `__pycache__/` 现场并用 RED→规则追加→`check-ignore`/测后 status GREEN 证明 | `lesson_candidates.md` 记 C1 全程未移动目录；`progress.md` C1-EV-002 为追加前 exit 1 且 status 可见目录，C1-EV-003/004 为追加后命中规则且完整测试后 status/索引零命中；`85af7fb` 的 `.gitignore` diff 仅追加 `__pycache__/`、`*.pyc` | 既有 RLT_10 F-002 已记录 `.pyc` 曾入树及建议仓根 ignore；RLT_09 lesson 复核已把“清理副产品、禁 add-all”归为该教训的机制化实例；RLT_03 F-008 也已登记 `.gitignore` 缺口。DRILL_02 的增量是从人工删除纪律升级为 ignore 规则并以“不删除产物”证明机制真实生效 | **合并** | 不另建平行教训；并入 RLT_10 F-002 / RLT_03 F-008 的闭环证据，记录处置从“每轮人工删除”升级为“仓根 ignore + 保留产物验真”。该现场是既有问题的机制化闭合证据，不是新的根因 |

## 分级发现

| ID | 级别 | 发现 | 影响与处置 |
|---|---|---|---|
| P2-1 | P2 | C1 候选原句“进场第一步以 merge-base 等值核查替代 stash/清理”省略了“先尝试 rebase，且仅在其因他人 WIP 被拒后”的触发条件；若逐字收编，可能被误读为绕过仓根要求的首个 Git 动作 | 非阻塞；按 L-DRILL-02-1 的条件链合并收编即可。不得把 merge-base 检查泛化成所有 rebase 的替代物 |

计数：**P1 = 0，P2 = 1**。

## 结论

**PASS**。

两组现场均有可核查证据：第一组以限定条件后的新规则采纳，W/C1 重复描述合并为一条；第二组并入既有 Python 副产品教训链，不重复立项。唯一 P2 是候选措辞缺少触发前提，按本报告限定语收编即可，不构成 R1 阻断。
