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
| 5 | `HC-RL-H12` | 人判 | batch 3 取证 | 待 batch 3 | 用户判 |
| — | `HC-RL-A125` | 终局回归（不承接） | 挂起（F-002） | — | 挂起 |

## plan / batch review 登记

| 闸 | review_round | remediation_count | reviewer | 结论 | durable signal / 工件 |
|---|---:|---:|---|---|---|
| plan-review | 1 | 0 | plan-reviewer#1 | FAIL（P1×4） | `DONE.plan-review.md` / `review.plan.md` |
| builder 整改 1 | 2 | 1 | builder#1 | P1-1/2/4 与 P2 已改；P1-3 设计机制待裁决（D12） | `BLOCKED.builder.plan-remediation-1.md` |
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
| H12 杀 watch 后 20 分钟兜底 | 待 batch 3 | 待定 | 用户判 |

## 人类签名区（仅用户在对话中明确确认后由主会话填写；AI 不代签，文档勾选不算）

- [ ] **H11**（Claude / Codex 监工忙时 prompt 是否被排队而非丢弃）：结论 ____ ｜ 用户 ____ ｜ 日期 ____
- [ ] **H12**（杀 watch 后 20 分钟兜底是否接住、是否可接受）：结论 ____ ｜ 用户 ____ ｜ 日期 ____
- [ ] **需求境证据**确认：____ ｜ 用户 ____ ｜ 日期 ____
- [ ] **verify**（`verify(relay-light):` 提交 SHA，可能被模块级钩子拦，见 findings F-003）：____ ｜ 日期 ____
- [ ] **最终验收**：____ ｜ 用户 ____ ｜ 日期 ____
