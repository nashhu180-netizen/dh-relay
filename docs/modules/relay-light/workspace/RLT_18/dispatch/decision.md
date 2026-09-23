# phase=decision · decider — 仅在 BLOCKED 或整改超限时拉起

先读同目录 `README.md`。不改任何文件（除自己的 `decision.<tag>.md` 与 signal），不提交。工作目录 `/home/nash/work/dh-relay/.dh-worktrees/RLT_18`。RELAY_RECEIPT preflight。

1. 读阻塞方 `BLOCKED.*.md` 与相关 review/check、oracle（design/01 §3.6、§7.2、A82/A83/A101、H11/H12）、DevPlan「#### RLT_18」（含非目标）、task_plan 与相关代码/用例。
2. 分类：
   - **小决策**（函数落点、打桩接口形态、线程/时钟注入、用例组织、fixture、design 字面可兼容的解读）→ 给可落地方案（精确到文件/符号/命令），verdict=AUTO，orchestrator 据此派回原 worker。
   - **方向决策**（方向/范围/验收/数据语义/安全/生产影响：改验收口径、越允许路径、改 design/DevPlan/SKILL.md、让 watch 写账或驱动流程、缩减实测）→ 只给选项 + 推荐 + 代价，verdict=CONSULT，**不拍板**，交用户。
3. 写 `workspace/RLT_18/decision.<tag>.md` 与 `DONE.decision.<tag>.md`（phase=decision agent=decider#1 batch=<n|na> path=na review_round=1 remediation_count=0 verdict=AUTO|CONSULT evidence=...），停止。
