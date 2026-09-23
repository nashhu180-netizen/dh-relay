<!-- progress.md — 施工进展与验证证据索引；不是运行真相 -->
# progress — RLT_18

## 写入合同

- 仅当前顺序执行的 batch coder 在自己 batch 完成时追加：「施工里程碑」一行 + 「证据账本」本批证据行。
- builder（plan 阶段）只建本骨架；monitor、reviewer、decider、orchestrator 禁止写本文件。
- 禁止记录 pane/agent 状态、轮询、通知、终端输出或运行快照。
- 恢复权威是 durable signals + 独立 review/decision 工件 + `execution_strategy.md` + Herdr 实态；本文件只作施工证据索引。

## 施工里程碑

| batch | coder | 里程碑 | 证据引用 | 结论 |
|---|---|---|---|---|

> 模板：`| <1|2|3> | <coder instance> | <简洁施工进展> | <repo-relative evidence paths> | <已验证|进行中|BLOCKED> |`

## 证据账本

| 证据 ID | batch | 内容 | 路径 | 命令 / 结论 |
|---|---|---|---|---|

> 模板：`| E-<batch><nn> | <1|2|3> | <一句话> | <repo-relative path> | <命令摘要与 exit/OK> |`
