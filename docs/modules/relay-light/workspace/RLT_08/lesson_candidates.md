<!-- dh:v1 -->
# lesson_candidates — RLT_08

> 仅在施工/复核出现有证据且可复用的现场时追加；W 阶段不预判教训结论。

## 候选

| ID | 触发现场 | 可复用规则候选 | 状态 |
|---|---|---|---|
| LC-1 | B1 红命令在 Linux worktree 首次执行时 `rg: 未找到命令`（环境错误不算 RED） | oracle 机检脚本假定 `rg` 在 PATH；worker 环境缺失时先免 root 补装（`apt download ripgrep && dpkg -x` → `~/.local/bin`），再重跑取红 | 候选 |
| LC-2 | B2 落笔时险些给 `RELAY_RECEIPT`/`node_closed` 套反引号 | oracle `rg -F` 判定句按裸文本逐字节匹配（如「有 RELAY_RECEIPT 即冻结 Runner 流水」）；写 AGENTS 条文时凡被 `-F` 锁定的句子不得加反引号/改标点，先复制 oracle 原文再排版 | 候选 |
| LC-3 | B3 RED 复跑时 `rg -c` 零命中输出为空串而非 `0`，`test "" -eq 1` 报「需要整数表达式」 | 写 oracle 计数断言时 `rg -c` 空结果需 `${var:-0}` 兜底或直接用 rc 判；本批 oracle 写法仍正确判红（空串≠1） | 候选 |
