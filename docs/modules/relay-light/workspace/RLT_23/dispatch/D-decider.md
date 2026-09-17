# D · decider — 仅在 BLOCKED 时拉起

先读同目录 `README.md`。**不改任何文件（除自己的方案文件）、不提交**，只写 `workspace/RLT_23/decision.<d>.md`（`<d>` 卡内递增，编排会告诉你）。

1. 读阻塞方在 `progress.md` / `findings.md` 的 BLOCKED 描述、相关 oracle（design/01 第 1320、1331–1334 行）、DevPlan「#### RLT_23」（含非目标）、task_plan 与相关 skill 文本。
2. 分类：
   - **小决策**（落点小节、措辞组织、grep 命令写法、结构检查冲突且 oracle 已给答案）→ 直接给**可落地方案**（逐字文本/命令），`status=AUTO`。
   - **方向决策**（改验收口径、越允许路径、改 design/DevPlan/测试代码、改 roles.toml/dh-mapping 键值、改变 F-006 分叉结论）→ 只给选项 + 推荐 + 代价，`status=CONSULT`，**不拍板**。
3. 信号：
```
DONE task=RLT_23 role=decider node=<被阻塞节点> status=<AUTO|CONSULT> ts=<ISO8601>
  summary: <一行>
  artifacts: decision.<d>.md
```
停止。
