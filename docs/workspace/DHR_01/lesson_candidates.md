<!-- lesson_candidates.md — 教训候选。🟢 收尾顺手记。AI 起草、人裁决。 -->
# lesson_candidates — DHR_01 冻结接力权威、双维状态与异常契约

## 教训候选

| ID | 一句话教训 | 状态 |
|----|-----------|------|
| L-001 | 主控预写 task_plan 里"见下方 XX 表 / 见 §X"类内部引用，派活前须机械核一遍引用目标真实存在——本卡首派因悬空引用【schema 冻结表】blocked 一轮（worker 正确 escalate，主控失误） | ready-for-review |
| L-002 | 判定函数的每个 reason 码/分支至少一条断言钉住；建议加静态守卫：扫源码 reason 码集合 vs 测试中出现的集合，差集非空即红——本卡 node 级（批A）、stale-plan/wrong-node（批B）两批各漏一次 | ready-for-review |
| L-003 | 验收口径写"多类工件任一残留即失败"时，测试不得用同一函数换标签循环冒充多类覆盖；每类要有该工件形态的真实夹具，或 review 明写"本卡只证通用函数、接线归下游卡" | ready-for-review |

> 状态流：`ready-for-review`（AI 觉得可能重要）→ 人裁决 →`needs-promotion / promoted / rejected`
