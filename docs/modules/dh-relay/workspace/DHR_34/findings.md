<!-- dh:v1 -->
# DHR_34 · Findings

| ID | 级别 | 状态 | 描述 | 处置 |
|---|---|---|---|---|
| F-001 | P2 | open | Receipt 的身份字段是否能在既有 contracts 零 diff 约束下承载，尚未完成 fresh 预审。 | 预审先核对 schema、store 与 runtime 写入点；若需契约扩展则 BLOCKED，不越过 allowed paths。 |
| F-002 | P2 | open | quota 高置信样本的稳定、脱敏形态尚未冻结。 | 仅在假样本/已批准脱敏证据上定义分类器；普通、权限、网络错误必须保留负例。 |
