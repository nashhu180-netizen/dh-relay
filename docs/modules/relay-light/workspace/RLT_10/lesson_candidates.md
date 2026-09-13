<!-- dh:v1 -->
# lesson_candidates — RLT_10

> 仅在施工/复核出现有证据且可复用的现场时追加；W 阶段不预判教训结论。F-001 是本卡具体合同冲突，先留在 findings，不在此重复包装成教训。

## 候选

| ID | 触发现场 | 可复用规则候选 | 状态 |
|---|---|---|---|
| LC-1 | B3 薄壳首跑：`Get-Command python3 -CommandType Application` 在 `/usr/bin/python3`+`/bin/python3` 双命中下返回 `CommandInfo[]`，`& <数组>` 字符串化成 `'python3 python3'` 而失败（lesson 复核 L-1；E-B3-003 为修复后最终版证据） | `Get-Command` 探测解释器不得假设单命中：取 `(…\|Select-Object -First 1).Source` 或等价首命中路径后再 `&`；属候选-38「可解析/可执行/可拉起」三层之外未写明的第四层「单命中假设」，裁决时可并入候选-38 或独立成条 | 待裁决 |
| LC-2 | F-001：design §11 HC-RL-A80 要求 `lint --json`，但 `relay_log.py` 落在本卡 allowed-paths 闭集之外——oracle 要求的行为无处实现（lesson 复核 L-2） | 派活前机械互查「验收口径 ↔ allowed-paths 闭集」自洽：凡 oracle 钉的行为点，确认其宿主文件在写权限内，否则先 BLOCKED/decide 再施工；属候选-4/候选-42 文档传导家族但判据不同（那两条查引用存在/目标↔口径，本条查口径↔允许路径） | 待裁决 |
| LC-3 | E-B3-004 把薄壳分项凭记忆记成「148+4」，实为 141+7（合计对、分项错），被 check.C3 独立复跑捕获，经 E-B3-008 verbatim 更正闭合（lesson 复核 L-3） | 无需新候选——登记为**候选-34 重犯佐证**（证据手抄必在独立复算时露馅）并兼作候选-13 实例（「待裁决」教训已记录仍会复发，记录存在 ≠ 写证据时自动执行 verbatim 纪律） | 待裁决 |

B1（exec）：本批无。F-001 合同冲突按约定留在 findings.md，不在此重复包装成教训。
B1 恢复（exec，decision.1/A 后）：本批无。
B2（exec）：本批无。
B3（exec）：本批无。现场记录：`Get-Command <exe> -CommandType Application` 在同名多 PATH 命中时返回数组，`& <CommandInfo[]>` 会字符串化成 `'python3 python3'` 失败——薄壳取 `Select-Object -First 1).Source` 后成立（批内自修，E-B3-003 为最终版证据）。
