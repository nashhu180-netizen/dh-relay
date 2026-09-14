<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-14 session=dryrun recipe=light cards=DRILL_02 -->

## 节点表
| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| W1 | DRILL_02 | DRILL_02:W#1 | build | agent:plan-reviewer | | 演习卡：仓根 .gitignore 忽略 __pycache__ 与 *.pyc（RLT_10 F-002） |
| C1 | DRILL_02 | DRILL_02:C#1 | construction | agent:checker | W1 | 单批施工 |
| R1 | DRILL_02 | DRILL_02:R#1 | review | agent:scribe | C1 | light Recipe：lesson + consistency |
| F1 | DRILL_02 | DRILL_02:F#1 | handoff | agent:scribe | R1 | 收口备料 |

## agent 表
| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| builder | W1 | builder | devin --model swe-2-max | 七件套与 task_plan.md | | zcode 未装，沿 Linux 裁决用 devin |
| plan-reviewer | W1 | plan-reviewer | codex -m gpt-5.6-sol --sandbox read-only | review.plan.md | on:done:builder | |
| coder | C1 | coder | devin --model swe-2-max | .gitignore 与 findings/lesson 行 | | |
| checker | C1 | checker | codex -m gpt-5.6-sol --sandbox read-only | check.C1.md | | |
| scribe | C1 | scribe | devin --model swe-2-medium | progress.md | on:done:coder | |
| decider | C1 | decider | codex -m gpt-6-astra --sandbox read-only | decision.1.md | on:blocked | |
| lesson | R1 | reviewer | codex -m gpt-5.6-sol --sandbox read-only | review.lesson.md | | light Recipe 路 1 |
| consistency | R1 | reviewer | codex -m gpt-5.6-sol --sandbox read-only | review.consistency.md | | light Recipe 路 2 |
| scribe | R1 | scribe | devin --model swe-2-medium | review.md 汇总 | | 全部 reviewer done 后由监工拉起（模板约定例外） |
| scribe | F1 | scribe | devin --model swe-2-medium | as-built、AI 提交区、汇报与证据区 | | |
