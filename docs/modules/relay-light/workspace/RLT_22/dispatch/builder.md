# rlt22-build — builder（修订模式）

RLT_22 工作区七件套已由 Windows 侧 builder 建好（W_READY）。你只在 plan-review 或批次小审要求**修订 task_plan / brief / execution_strategy** 时被拉起，按编排点名的 `review.plan.md` P0/P1 项逐条修订，不改代码、不改 design/DevPlan、不派活、不问用户。

先读 `dispatch/README.md`、`review.plan.md`、`task_plan.md`、`brief.md`、design/01 §11 A144~A150。修订后在 task_plan 顶部记一行修订日志（日期 / 依据 P 项 / 改动摘要）。只 add 工作区文件，`git commit -m "docs(relay-light): RLT_22 task_plan revised per review.plan"`，追加信号 `DONE task=RLT_22 role=builder batch=W status=W_READY evidence=<文件,commit> next=orchestrator`，停止。
