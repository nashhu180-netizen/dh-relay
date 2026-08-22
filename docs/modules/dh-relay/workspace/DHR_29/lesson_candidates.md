<!-- dh:v1 -->
# lesson_candidates — DHR_29

## 教训候选

| ID | 一句话教训 | 状态 |
|----|-----------|------|
| L-001 | `dh wt new`（dev-harness 仓 `tools/dh-wt.mjs:105-106`）在本地 master 领先 origin 时会以滞后的 `refs/remotes/origin/master` 为建树 base——这是**工具事实**；对策沿用既有规则：任务树第一动作 `git rebase master` 对基点（宪章#7 / 动作-D「从最新 master 切出」），工具侧修法（base 择优或分歧告警）指归 dev-harness 工具仓，不在本卡修。 | ready-for-review |
| L-N1 | P2 · 能力指纹只盖 schema 全文；`contracts/*.md` 规范散文不在任何基线内，散文修订/失修对五道闸全隐形（实例：checkpoint schema description 失修与 §4b 裁决漏执行都靠人肉复核才抓出）。 | proposed |
| L-N2 | P3 · 派生缓存不可信、打开即由真值重算自愈的取舍必须显式登记——代价是外部篡改被静默纠正（as-built relay-core §3.5 已记实例）。 | proposed |
| L-N3 | P3 · 会话内 subagent 复核不是机器只读：以「侦测型降级」如实登记 + 派出前后 git 基线比对零差异作补偿控制，实例身份显式落账（E-011/E-014/E-015/E-016 四次已成范式）。 | proposed |
