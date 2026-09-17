# RLT_23 · 范围外发现

本节点无。

- 2026-09-17 C1：无。
- 2026-09-17 C2：无。

## 转派候选（R 阶段两路复核范围外发现，原样汇总，本卡不施工）

- **（P2 级建议，源 review.lesson.md）Claude 主控侧只读复核形态失败时无书面兜底**：`adapter-claude-code.md:44`「复核只读形态尾部加 `-- --sandbox read-only`」仍为无条件句（本卡按 `task_plan.md:55` 要求未动该节）。在 DR-F-001 环境下新环境预检在 Claude 主控侧只写「默认 sandbox」原则，未写明只读约束此时是否改由派活 prompt 承担（Codex 主控侧有明文）。建议后续补一句：Claude 主控下只读形态不可用时改用默认 sandbox 启动、只读约束由派活 prompt 明文承担。
- **（观察，源 review.lesson.md 与 review.consistency.md 登记同一事实）A152 落盘句省略成因**：「该 flag 被本地 auto 分类器拦」未进文本（task_plan 冻结原文即如此，设计 A152 行内仅以括号保留）。方向正确且偏保守，但换一台不拦 bypass 的 Claude 主控机时，读者无从判断该规则是否本机限定。
- **（观察，源 review.lesson.md）F-003 现场含 origin 同名分支滞留**，A154 核对命令为 `git worktree list` / `git branch`（本地视角）；远端分支删除不在该 checklist 项字面内，现由编排/人工收口覆盖。
