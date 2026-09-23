# phase=plan-review · plan-reviewer — 审 task_plan（heavy）

先读同目录 `README.md`。只读不改（除自己的 `review.plan.md` 与 signal），不提交，做完即停。工作目录 `/home/nash/work/dh-relay/.dh-worktrees/RLT_18`。

权威：DevPlan「#### RLT_18」；design/01 §3.6、§7.2、第 115/140/189/1436–1439 行、A82/A83/A101、H11/H12；现行 `SKILL.md`（single-task 节、watcher 定义）；现状代码与两个 adapter。

## 判据（任一不满足即 P1；措辞/格式/引用陈旧为 P2）
1. 允许路径：任何一批改 README 闭集外文件。
2. 写者边界：progress 仅 batch coder 每批一条；execution_strategy 仅 orchestrator；signal 文件名与单行 schema 合 README；watch 自身无写账路径（A101）。
3. 批次边界：≤3 批；A82/A83/A101/H11/H12 与 adapter 结构检查各有认领；无隐式依赖；workflow-final/E2/人验不混进 batch。
4. oracle 覆盖：无立即重挂、30 秒轮询、终态退出、working 重挂、`(agent,状态)` 去重、20 分钟 tick、两层退出、短 ASCII 单行、每 agent 一线程、adapter 写明节拍归属——漏任一即 P1。
5. 打桩可行性：单测不依赖真实 herdr/时钟；线程测试确定性，不靠 sleep 竞态。
6. 实测批：H11 Claude/Codex 分别验；H12「杀 watch → 展示下一次例行查看时刻与发现」；探针命名/关闭/不写历史账本/不冒写人判。
7. 可执行性：RED 先行、机械完成判据、README 单测入口。
8. 歧义解读与 design 字面兼容；只能改 design 才成立 → P1 并建议交 decider。
9. 术语：未使用 W/C/R/X/F 作本卡阶段词；adapter 改写目标与现行 SKILL（stage-lead/watcher）一致。

## 产出
`workspace/RLT_18/review.plan.md`：`## 结论 PASS|FAIL`、`## 逐项判据`（# / 判据 / 结论 / 级别 / 依据 文件:行 / 整改动作）、`## 范围外发现`。
signal `DONE.plan-review.md`：phase=plan-review agent=plan-reviewer#1 batch=na path=na review_round=1 remediation_count=0 verdict=PASS|FAIL evidence=docs/modules/relay-light/workspace/RLT_18/review.plan.md。
复审（orchestrator 说「复审 round k」）：只核上轮 P1 闭合 + 有无新 P1，追加到 `review.plan.md`「复审 round k」节，signal `DONE.plan-review.round-<k>.md`（review_round=k）。
