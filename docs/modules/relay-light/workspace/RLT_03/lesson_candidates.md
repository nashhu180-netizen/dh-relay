<!-- dh:v1 -->
# lesson_candidates — RLT_03

## 教训候选

| ID | 一句话教训 | 状态 |
|---|---|---|
| L-001 | 同一 finding 连续出现 ownership → note 必填 → 空值/kind → equality 等根因翻新时，第二次翻新即按候选-25 触发换路线或主控审计；本卡虽最终闭合，但过程未及时留下止损判断 | reuse-existing-candidate-25 |
| L-002 | JSONL 写入与读取必须共用 LF 这一记录边界，不能让 Unicode `splitlines()` 语义扩大分隔符集合；成功写入必须立刻可读 | new-candidate-ready-for-review |
| L-003 | 负例冻结稳定 code、退出码与状态不推进，不冻结未写入正式合同的诊断 detail；但同类字符串绑定居多，必须全库枚举而不是只改点名的单列——E-054 只关四处、lessons recheck 又揪出 `marker cards=`/`ledger line 1: ` 两处残留，E-063 补判别变异后才全闭合 | reuse-existing-candidate-61 |

结论：`lessons-absent=false`；复用候选-25/61，并新增 L-002，故不适用 `no-new-candidate`。
