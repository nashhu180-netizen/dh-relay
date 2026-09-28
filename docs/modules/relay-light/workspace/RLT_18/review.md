<!-- dh:v1 · review.md — RLT_18 验收靶与复核登记。 -->
<!-- dh:review-policy:v1 mode=single-full-targeted max_attempts=2 -->
# review — RLT_18

## 验收靶

| # | 验收 ID | 类型 | 承接批次 | 证据 | 结论 |
|---|---|---|---|---|---|
| 1 | `HC-RL-A82` | 机器证 | batch 1（编排级分支 batch 2 回归） | 待 batch 1 | 待定 |
| 2 | `HC-RL-A83` | 机器证 | batch 2 | 待 batch 2 | 待定 |
| 3 | `HC-RL-A101` | 机器证 | batch 1 | 待 batch 1 | 待定 |
| 4 | `HC-RL-H11` | 人判 | batch 3 取证 | 待 batch 3 | 用户判 |
| 5 | `HC-RL-H12`（契约 v2，RLT-A-14 / RLT-B-10） | 人判 | UD-3 U2 取证（v1 取证见 batch 3） | `evidence/ud3-h12/H12.md` | 用户判 |
| — | `HC-RL-A125` | 终局回归（不承接） | 挂起（F-002） | — | 挂起 |

## plan / batch review 登记

| 闸 | review_round | remediation_count | reviewer | 结论 | durable signal / 工件 |
|---|---:|---:|---|---|---|
| plan-review | 1 | 0 | plan-reviewer#1 | FAIL（P1×4） | `DONE.plan-review.md` / `review.plan.md` |
| builder 整改 1 | 2 | 1 | builder#1 | P1-1/2/4 与 P2 已改；P1-3 先 BLOCKED 待裁决（D12） | `BLOCKED.builder.plan-remediation-1.md` |
| builder 整改 1 续（UD-1/UD-2 后） | 2 | 1 | builder#1 | D12/D13 落裁决、batch 2 纳入 SKILL 三处与旧断言同步、H12 两段演示 | `DONE.builder.plan-remediation-1.md` |
| plan-review 复审 | 2 | 1 | plan-reviewer#1 | FAIL（新 P1×3：P1-A/B/C） | `DONE.plan-review.round-2.md` / `review.plan.md`「复审 round 2」 |
| builder 整改 2（plan 阶段最后一次） | 3 | 2 | builder#1 | P1-A 退出码与运行期容错、P1-B 存活检查按层级定位、P1-C H12-② 事件顺序；P2-A/B | `DONE.builder.plan-remediation-2.md` |
| plan-review 复审 | 3 | 2 | plan-reviewer#1 | 待定 | `DONE.plan-review.round-3.md` |
| batch-1 review | 1 | 0 | 待派 | 待定 | `DONE.batch-1.review.md` |
| batch-2 review | 1 | 0 | 待派 | 待定 | `DONE.batch-2.review.md` |
| batch-3 review | 1 | 0 | 待派 | 待定 | `DONE.batch-3.review.md` |

## 独立复核区

### workflow-final review 层（single-task · heavy 五路）

> heavy 五路一条不少；每条 path 每轮必须 fresh reviewer，施工者不复核自己；每路最多返工 2 轮。此区不写 E2 targeted receipt。

| path | review_round | remediation_count | reviewer identity/session | fresh 相对上一轮 | 输入 SHA/diff | findings | 结论 | durable signal |
|---|---:|---:|---|---|---|---|---|---|
| code-round1 | 1 | 0 | 待派 | 是 | 5ab3bba→wt/RLT_18 | 待定 | 待定 | `DONE.workflow-final.code-round1.review-round-1.md` |
| code-round2 | 1 | 0 | 待派 | 是 | 5ab3bba→wt/RLT_18 + code-round1 | 待定 | 待定 | `DONE.workflow-final.code-round2.review-round-1.md` |
| requirement | 1 | 0 | 待派 | 是 | 验收/场景证据 | 待定 | 待定 | `DONE.workflow-final.requirement.review-round-1.md` |
| consistency | 1 | 0 | 待派 | 是 | 兄弟合同（SKILL/双 adapter/design） | 待定 | 待定 | `DONE.workflow-final.consistency.review-round-1.md` |
| lesson | 1 | 0 | 待派 | 是 | lesson_candidates/知识对照 | 待定 | 待定 | `DONE.workflow-final.lesson.review-round-1.md` |

### dev-harness E2 `code_review` 层

> full 初审 fresh；仅 open P0/P1 后允许 attempt 2，且必须同一 `reviewer_session_id`。与 workflow-final 分开取证，不合并。

| attempt | kind | review_round | remediation_count | reviewer_session_id | baseline/target/diff | findings | 结论 / signal |
|---:|---|---:|---:|---|---|---|---|
| 1 | full | 1 | 0 | 待派 | 5ab3bba → wt/RLT_18 | 待定 | 待定 / `DONE.e2-code-review.attempt-1.md` |
| 2 | targeted（仅 open P0/P1） | 2 | 1 | 须与 attempt 1 相同 | 待定 | 待定 | not-dispatched / `DONE.e2-code-review.attempt-2.md` |

## 需求境证据

| 需求 / 人验项 | 场景操作路径 | 证据 ID | 结论 |
|---|---|---|---|
| H11 Claude 监工忙时 prompt | 待 batch 3 | 待定 | 用户判 |
| H11 Codex 监工忙时 prompt | 待 batch 3 | 待定 | 用户判 |
| H12 watch 死亡后本终端空间 watcher 10 分钟巡检是否接住（契约 v2，RLT-A-14 / RLT-B-10） | 关阶段级 / 编排级 watch pane → watcher 巡检发现 → `watch-down` 报派活方 → 重拉；进程级见 batch 3 | `evidence/ud3-h12/H12.md` | 用户判 |

## 人类签名区（仅用户在对话中明确确认后由主会话填写；AI 不代签，文档勾选不算）

- [x] **H11**（Claude / Codex 监工忙时 prompt 是否被排队而非丢弃）：结论 接受——沿用 2026-09-24 人判「H11 接受，后台 watch 可以」（忙时推送未丢弃，不退回前台循环；知悉 F-008 多发方向、codex 首通 pane 不可见 RQ-2/RQ-3；原文见 `evidence/batch-3/H11-claude.md` / `H11-codex.md`）｜ 用户 2026-09-24 人判，2026-09-28 对话中回复「同意」确认沿用 ｜ 日期 2026-09-28
- [x] **H12**（契约 v2，RLT-A-14 / RLT-B-10：watch 死亡后本终端空间 watcher 的 10 分钟巡检是否兜得住，10 分钟是否可接受）：结论 接受——兜得住，10 分钟可接受（阶段级/编排级两链均单发 watch-down→核死→重拉闭环，缺席期事件经新 watch 补推只延迟不丢；阶段级实测 ≈8.8 min 未超上界；进程级死亡由重启循环 ≤7 s 接住，10 分钟巡检只兜整 pane 被关的低频场景）。知悉项：① 两 watcher 启动均需一次轻推，编排侧首个检查间隔 ≈14 min 越过 10 min，登记后续项——brief 应让 watcher 无需确认即自启节拍；② 阶段级×Codex、编排级×Claude 两组合未实测，按机制同构接受；③ E2 三条 P3（存活核仅 Linux python3 写法、pgrep 模式未转义、手敲循环 sleep 窗可漏检一轮）最坏为多报，不阻塞。证据 `evidence/ud3-h12/H12.md` ｜ 用户 2026-09-28 对话中回复「同意」主会话提出的上述结论 ｜ 日期 2026-09-28
- [ ] **需求境证据**确认：____ ｜ 用户 ____ ｜ 日期 ____
- [ ] **verify**（`verify(relay-light):` 提交 SHA，可能被模块级钩子拦，见 findings F-003）：____ ｜ 日期 ____
- [ ] **最终验收**：____ ｜ 用户 ____ ｜ 日期 ____
