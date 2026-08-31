<!-- dh:v1 -->
# DHR_68 · 整改复验 brief（fresh，未参与施工，未继承任何前轮会话）

> 你是**复核 worker**，不是主控。只读复核：不改任何文件、不拉终端、不派活、不问用户。
> 结论**直接写在你的回复正文里**（不要用 heredoc 打印）。只写事实与级别，不替主控做验收裁决。

## 你在哪

- 仓库：`D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_68`（分支 `wt/DHR_68`）
- 整改提交：`1d2e49d`；本卡开工基线：`d6358dc`
- 必读：仓根 `AGENTS.md` → `workspace/DHR_68/brief.md` → `review.md` → `findings.md` → `progress.md`

## 背景一句话

DHR_35 用真实 Codex / Claude Code 跑 Windows 首次实录，暴露三条只有真实宿主才看得见的 Herdr adapter/driver 缺陷（fake 返回形态与真实 herdr 不一致，测试全绿却跑不通）。本卡逐条接线修复，验收 A/B/C/D 四条全为机器证。前面已跑完代码轮 1、代码轮 2、需求、教训、一致性五路。

## 你要复验的四件事

1. **F-68-R2-01（轮 2 的 P1）是否真的闭合**：`workflow-driver.mjs` 的 `instructionPending` 补发判据已从白名单 `['working','idle']` 改为 `observation.herdr_status !== 'blocked'`。核：
   - blocked → done 现在会补发；blocked → working / blocked → idle 仍各补发**恰好一次**；
   - 会不会出现**重发**（同一 Attempt 发两次提交指令）；
   - 会不会在 agent 从未 blocked 的正常路径上**多发**一次（正常路径应在 launch 时发、`instructionPending` 应为 false）；
   - `observation_lost → 恢复` 期间该标志的行为是否仍正确；
   - 这一改动有没有溢出「启动期 blocked 事件路径」，碰到 Result 判定、`done/idle` 分支或 `waitForExecutorResult`。
2. **轮 1 两条整改仍闭合**：`agentPrompt` 的 fake 形态、`git diff --check d6358dc..HEAD`。
3. **教训两条 P1（C-68-01/C-68-02）是否落实**：`lesson_candidates.md` 是否显式标注了与 [候选-6]/[候选-36] 的边界、是否回链 [候选-35]；新增的 L-6802/L-6803 是否有出处、是否与既有候选重复（既有候选在 `docs/modules/dh-relay/knowledge/教训库-候选.md`，**只读**）。
4. **有没有因为整改引入新问题**（含越界）：改动是否仍严格落在 DevPlan `dh:allowed-paths:v1 task=DHR_68` 的 5 条精确路径 + `workspace/DHR_68/**`。

## 已知、不用重复报

- `herdr-adapter.test.mjs` 有 3 例 DHR_33 失败，在**未改代码的 master** 上同名同因复现。
- `agent-node.test.mjs` 的 `DHR_61 D1` 经两树各跑 3 次证明是双向抖动（等待窗口仅 1000ms）。
- 本仓 `npm test` 在 `--test-concurrency=4` 下基线本身不稳，不能拿全量结果做判定。
- F-6805（可执行桩不在允许路径）已由三路裁定链条足够；F-6806 记账不修；F-6807（recovery 届同类缺陷）三路一致裁定不在本卡修、维持范围外 P2。**这三条不用再议**，除非你发现新事实。

## 产出格式

```
## 结论：PASS / FAIL
## 逐项复验
- F-68-R2-01：闭合 / 未闭合 + 依据
- 轮 1 两条：闭合 / 未闭合
- 教训 C-68-01 / C-68-02：落实 / 未落实
- 整改是否引入新问题 / 越界：是 / 否
## 发现（表：ID | 级别 | 文件:行 | 问题 | 为什么是问题 | 建议）
## 我实际跑了什么
```

级别口径：P0 正确性/安全/越界；P1 会导致验收不成立；P2 可维护性/证据不足；P3 建议。
