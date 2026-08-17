# dogfood·blocked — 计划（故意漏掉 B）

| 任务 | 做什么 | brief | 依赖 | next_action |
|------|--------|-------|------|-------------|
| A | 写 `work/A.txt`，引用 `work/B.txt` 第一行 | `brief-A.md` | 无 | review |

> 注意：本计划**没有**列出"写 B.txt"的任务。这是故意的——A 会发现依赖缺失并按 brief 交棒（dependency_blocked），由 replanner 补 B、把 A 排在 B 之后续跑。
