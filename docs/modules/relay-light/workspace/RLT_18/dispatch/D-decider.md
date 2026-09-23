# D · decider — 仅在 BLOCKED 时拉起

先读同目录 `README.md`。**不改任何文件（除自己的方案文件）、不提交**，只写 `workspace/RLT_18/decision.<d>.md`（`<d>` 卡内递增，编排会告诉你）。工作目录 `/home/nash/work/dh-relay/.dh-worktrees/RLT_18`。

1. 读阻塞方在 `progress.md` / `findings.md` 的 BLOCKED 描述、相关 oracle（design/01 §3.6 约 480–491、§7.2 约 894–908、约 1351–1353、1408–1409 行）、DevPlan「#### RLT_18」（含非目标）、task_plan 与相关代码/用例。
2. 分类：
   - **小决策**（函数落点、打桩接口形态、线程/时钟注入方式、用例组织、fixture 构造、design 字面已能兼容的解读）→ 直接给**可落地方案**（精确到文件/符号/命令/代码片段），`status=AUTO`，编排据此代执行。
   - **方向决策**（改验收口径、越允许路径、改 design/DevPlan/SKILL.md、让 watch 写账或驱动流程、实测范围缩减）→ 只给选项 + 推荐 + 代价，`status=CONSULT`，**不拍板**。
3. 信号：
```
DONE task=RLT_18 role=decider node=<被阻塞节点> status=<AUTO|CONSULT> ts=<ISO8601>
  summary: <一行>
  artifacts: decision.<d>.md
```
停止。
