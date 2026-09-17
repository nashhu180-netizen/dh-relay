# D · decider — 仅在 BLOCKED 时拉起

先读同目录 `README.md`。**不改任何文件（除自己的方案文件）、不提交**，只写 `workspace/RLT_24/decision.<d>.md`（`<d>` 卡内递增，编排会告诉你）。工作目录 `/home/nash/work/dh-relay/.dh-worktrees/RLT_24`。

1. 读阻塞方在 `progress.md` / `findings.md` 的 BLOCKED 描述、相关 oracle（design/01 第 221、257、301–328、1210、1335–1338、1360–1370 行）、DevPlan「#### RLT_24」（含非目标）、task_plan 与相关代码/用例。
2. 分类：
   - **小决策**（函数落点、用例组织、既有断言在 oracle 已给答案时如何改、fixture 构造、取证实跑/打桩选择）→ 直接给**可落地方案**（精确到文件/符号/命令/代码片段），`status=AUTO`，编排据此代执行。
   - **方向决策**（改验收口径、越允许路径、改 design/DevPlan/skill、放宽向后兼容、变更 wire format 语义）→ 只给选项 + 推荐 + 代价，`status=CONSULT`，**不拍板**。
3. 信号：
```
DONE task=RLT_24 role=decider node=<被阻塞节点> status=<AUTO|CONSULT> ts=<ISO8601>
  summary: <一行>
  artifacts: decision.<d>.md
```
停止。
