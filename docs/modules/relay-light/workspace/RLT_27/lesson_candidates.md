# lesson candidates — RLT_27

### 候选-1 · Herdr 终端状态不是节点完成凭据

触发场景：通过 Herdr 调度 relay-light worker，以 idle/done/blocked 或 prompt wait 返回判断节点完成 · 建议分类：行为流程 · 来源：retry02/lesson_candidates.md、review.lesson.md、review.consistency.md；fresh miner rlt27_closeout_miner。

疑似重复：项目正册/候选区不存在，0 条；任务内原候选是来源，不重复追加。

- 现象：终端状态或对 working agent 的 prompt wait 返回，不保证角色产物或本次 turn 已完成。
- 反思：以角色专属产物、唯一完成信号、监工消费并闭合账本三项判断；终端状态仅作唤醒线索。
- 建议后续动作：运行时继续核对三项证据，不把 terminal done 直接写为 ledger done。
- 不抽：本次 R FAIL 路由笔误、checkpoint token/ready_seq 填写失误、诊断 shell 转义错误；暂无系统性根因证据，不扩张为新开发项。

状态：待裁决；限定任务内候选，不写正册，不自动创建后续任务。
