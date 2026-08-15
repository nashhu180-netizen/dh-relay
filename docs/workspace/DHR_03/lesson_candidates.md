<!-- lesson_candidates.md — 教训候选。🟢 收尾顺手记。AI 起草、人裁决。 -->
# lesson_candidates — DHR_03 接真实可见 psmux 并完成阻塞接力 dogfood

## 教训候选

| ID | 一句话教训 | 状态 |
|----|-----------|------|
| L-001 | tmux 兼容品（psmux）对"精确目标"语法可能静默不兼容（`-t =name` kill 无效却 exit 0）——写 adapter 前先用 5 分钟原语实测把"成功退出码≠真的做了"这类坑逮出来，并把它写成离线套件的 argv 断言，而不是信 man page | ready-for-review |

> 状态流：`ready-for-review`（AI 觉得可能重要）→ 人裁决 →`needs-promotion / promoted / rejected`
