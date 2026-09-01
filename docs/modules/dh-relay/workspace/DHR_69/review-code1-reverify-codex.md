<!-- dh:v1 -->
# DHR_69 · 代码轮 1 整改复验（`dhr69rev1b`）原文

- 复核者：`dhr69rev1b`（Herdr pane `w1:p47` · codex `--sandbox read-only` · gpt-5.6-terra high · fresh，未继承轮 1 会话）
- 派出：e:E-6906
- 结论：**FAIL**（生产修复判正确；负例未钉死计时器已启动）

## F-69-R1-01：未闭合（测试侧）

生产修复本身正确：unknown/观测失败分支会清除 `mismatchAt` 和 `mismatchEscalated`。但新增负例只等启动期初始 Attention 就切 unknown，不保证轮询已执行 mismatch 分支并设置 `mismatchAt`。旧实现在这种调度下也可能重新计时，测试可能错误通过。

建议：切 unknown 前先等到 poll 期 paneGet，并等到 observation-lost 后再恢复 blocked。

## 越界检查

改动文件均在允许路径。未改 Result 语义。复核者零写入（仅 progress.md 主控 dispatch 未提交）。
