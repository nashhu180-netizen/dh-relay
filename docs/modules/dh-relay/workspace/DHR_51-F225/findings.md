<!-- dh:v1 -->
# findings — DHR_51-F225

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F225 | P1 | 初始化账本写入期的 `writeGuard` 发现 lease 已换手时，`runHostSession` 抛错而非返回既定 lost-lease 摘要。 | DHR_52 集成 `npm test` 89/90；定向用例失败 `E_LEASE_HELD:lease-lost`。 | 初版前缀匹配被第二轮复核拒绝；已收紧为**完全相同**的失租错误，保留其它初始化错误抛出。 | resolved，待增量复核 |
