# dogfood·decision — 计划

| 任务 | 做什么 | brief | 依赖 | next_action |
|------|--------|-------|------|-------------|
| A | 问用户中/英文，写 `work/A.txt` | `brief-A.md` | 无 | review |
| B | 写 `work/B.txt` | `brief-B.md` | 无 | none |
| C | 抄 A.txt 首行写 `work/C.txt` | `brief-C.md` | A | next_stage |

> A 挂起等用户回答期间：C 因依赖 A 被冻结（frozen_by=[A]），B 不受影响继续；用户在 A 的窗口回答**一次**后 A 继续、C 解冻。
