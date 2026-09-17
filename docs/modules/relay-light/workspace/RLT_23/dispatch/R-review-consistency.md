# R2 · reviewer — 一致性路复核（light 档必做两路之一）

先读同目录 `README.md`。你是**复核**，只读不改、不提交，做完即停。**不采信施工者自述，自己回原始来源核。**

## 范围
本卡全部改动：`git log --oneline master..HEAD`、`git diff master --name-only`、`git diff master`。

## 判据（逐条 PASS/FAIL，FAIL 给 P1/P2 与整改动作）
1. **A151**：skill 派活纪律段与两份 adapter 的编排/监工模板**三处**各含「读 pane 末行确认实际投递 / `queued` 时补 `send-keys enter` 并复核送达 / 未确认投递不得当作已通知」原文；静态检查无「发出即视为送达」类软表述。自己跑 grep 给命中数。
2. **A152**：两份 adapter 各命中「Claude 主控下 codex worker 默认 sandbox、不加 bypass flag（被本地 auto 分类器拦）/ Codex 主控下沿用既有 bypass 结论」分叉表述；全 skill 无「codex 一律 bypass」类无条件措辞（含 adapter 原「环境预检」节的 bypass 句是否已改为分叉口径）。
3. **A153**：监工模板命中三要素（无 `Running tools` 计时器在走、账本无该 agent 新行、Herdr `agent get` 非 working）与「不得单凭 pane 状态」原文；与 `HC-RL-A140`「三者均无变化才中断」口径一致、无矛盾。
4. **A154**：F 阶段模板收口清单含**独立 checklist 行**「确认对应 worktree 已删（`git worktree list` / `git branch` 核对），先关终端空间再删树」，是可勾选项而非软提醒。
5. **结构回归**：自己复跑 `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log test_install_skill` 与 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`，记退出码；SKILL.md 既有模板（W/C/R/X/F 表头、A140 原文、硬规则编号）未被破坏。
6. **允许路径四集合核对**：改动文件集合完全落在 `tools/relay-light/skill/**` 与 `workspace/RLT_23/**`；区分 pre-existing 与本卡新增 `__pycache__`（不要自己删）。
7. **非目标**：未动账本 schema/事件类型、design 正文、herdr、历史 workspace 工件。

## 产出
`workspace/RLT_23/review.consistency.md`（结构同教训路），并在 `review.md`「复核路径登记」consistency 行填结论。信号：
```
DONE task=RLT_23 role=reviewer-consistency node=R2 status=<APPROVE|REVISE> ts=<ISO8601>
  summary: <一行，含 P1/P2 计数>
  artifacts: review.consistency.md, review.md
```
