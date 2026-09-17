<!-- relay-light:plan v1 skill=0.1.0 generated=2026-09-17 session=rlt24-c4-a157 decision_mode=auto recipe=normal cards=RLT_24 -->

## 节点表

| node | card | stage | type | close | depends_on | note |
|---|---|---|---|---|---|---|
| C1 | RLT_24 | RLT_24:C#1 | construction | | | A157 取证 fixture：C 阶段首有效节点，阶段终端空间关闭失败的记账位 |
| F1 | RLT_24 | RLT_24:F#1 | handoff | | C1 | A157 取证 fixture：收口 F 阶段首有效节点，编排终端空间关闭失败的记账位 |

## agent 表

| agent | node | role | launch | output | trigger | note |
|---|---|---|---|---|---|---|
| coder | C1 | coder | devin --model swe-2-max | evidence | | fixture 行，仅满足 A75 非空节点 |
| scribe | F1 | scribe | devin --model swe-2-medium | evidence | | fixture 行，仅满足 A75 非空节点 |
