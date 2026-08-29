<!-- dh:v1 -->
# lesson_candidates — DHR_62

| ID | 一句话教训 | 状态 |
|---|---|---|
| L-001 | verify 的全模块治理门应区分「本卡新增失败」与「全模块总失败」，否则新卡会被历史欠账阻塞。 | reviewed-refine |
| L-002 | 治理卡不能把 `dh exit 0` 当唯一验收；状态语义、证据账本与源事实必须三方一致，避免通过改触发条件漂绿。 | reviewed-add |
| L-003 | warning 也要做前后基线：本轮 64→71 暴露新造不可核引用，返工补账后降至 61。 | reviewed-add |
| L-004 | 存量卡后补结构时应显式标治理补录，并完成所有被引用 E-ID；不靠改标题、删 SHA 或压缩事实过闸。 | reviewed-add |
| L-005 | 文档结论不得跑在机读证据前面；schema/注册表未表达的“可派”结论只能作为有来源限定的人读事实，下游不得反向推导。 | reviewed-add |
| L-006 | 复核摘要不得把冲突的模型身份双证压成单一结论；启动参数与 SessionStart 冲突时并列留痕，交候选-40 裁定。 | reviewed-add |
| L-007 | docs-only 卡若为验证反向约束临时做 mutation，该取证动作必须先在 brief/execution strategy 显式授权，再记录红/还原/绿，并用生产路径 `git diff --name-only` 复证零残留。 | reviewed-add |
