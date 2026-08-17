<!-- lesson_candidates.md — 教训候选。🟢 收尾顺手记。AI 起草、人裁决。 -->
# lesson_candidates — DHR_02 实现最小 Runner 与确定性 fake replay

## 教训候选

| ID | 一句话教训 | 状态 |
|----|-----------|------|
| L-001 | reason 守卫按前缀归一时，同前缀多谓词/多子码（`proposal-rejected:*`、replan 六谓词）对守卫不可见——「每分支一断言」守卫要么按完整码比对、要么 task_plan 对同码多谓词函数单列每谓词一条反例（本卡 F-003/F-004） | ready-for-review |
| L-002 | 确定性回放已把事件签名落盘为工件时，测试应与之逐行全等，不用「里程碑子序列」——子序列会放过夹在中间的意外事件，口径比证据强（F-006） | ready-for-review |
| L-004 | 多个 headless 复核者做变异探针时必须隔离（各自 worktree）或严格串行——本卡一个被「stop」但未真杀的 reviewer 与 fresh 复验并发同树，导致复验首跑撞上被临时改坏的源码（F-020）；Bash 包装 10 分钟被 kill 不等于子进程死，派长活要 Monitor 产物文件 + 按 PID 确杀 | ready-for-review |
| L-005 | headless worker 自报 commit SHA 会笔误（本卡 5b6ceb9 实为 ffbaf92）——主控以 git log 为准并在 findings 机械纠正（L-010 家族再实锤） | ready-for-review |
| L-003 | 已提交 final 的节点，后续观测只记账不改业务投影/不 pause；`on_stop=ignore + probe_error` 这种真实终端形态要先在 fake 层演一遍，别留给真实 adapter 首次触发（F-005·DHR_03 前置风险） | ready-for-review |

> 状态流：`ready-for-review`（AI 觉得可能重要）→ 人裁决 →`needs-promotion / promoted / rejected`
