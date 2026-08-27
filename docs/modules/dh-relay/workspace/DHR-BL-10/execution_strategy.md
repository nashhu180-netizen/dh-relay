<!-- dh:v1 · execution_strategy.md — 分工。🟡 开工时定一次。 -->
# execution_strategy — DHR-BL-10

## 操作模型

**主控派活（手动派活模式）**：主控（Claude Opus）写户口 / brief / task_plan 并做收口裁决；施工由 **zcode（GLM-5.3 headless）**在 worktree `wt/DHR-BL-10` 里独立完成。这本身是本卡的自举 dogfood——zcode 一边被接进派活位，一边就用被接进来的那套方式干活。

## 子 agent 授权

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---------|---------------------------|--------|
| zcode（施工 worker · `zcode --prompt --mode yolo`） | 可写：`brief.md` 允许路径清单内的文件（`tools/host/relay-worker-entry.ps1`、`tools/host/run-dogfood.ps1`、`tools/tests/relay-agent-tool.ps1`、`as-built/relay-psmux-host.md`、本工作区现场件）。只读：其余全仓。禁止 `git commit` / `git push` / 建树删树 / 再派活 | 用户 2026-08-27 对话确认开工 |
| 复核者（待定 · **不得是 zcode**） | 全仓只读；只写 `review.md` 与 `review-logs/` | 收口时主控派出，`dh dispatch` 落账 |

## 收尾铁律

- 证据不全 / 有 P0–P1 未关闭前，不许标"待验收"。
- **施工者不复核自己的卡**（宪章#5）：zcode 施工 → 代码轮 1 必须另派他人。
- 提交与合并只由主控做；worker 不碰 git 提交。
