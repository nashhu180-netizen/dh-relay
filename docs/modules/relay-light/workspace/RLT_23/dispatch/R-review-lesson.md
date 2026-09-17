# R1 · reviewer — 教训路复核（light 档必做两路之一）

先读同目录 `README.md`。你是**复核**，只读不改、不提交，做完即停。**不采信施工者自述，自己回原始来源核。**

## 范围
本卡全部改动：`git log --oneline master..HEAD`、`git diff master --name-only`、`git diff master`。

## 判据（逐条 PASS/FAIL，FAIL 给 P1/P2 与整改动作）
1. **来源教训是否被真正回流**：RLT_11 findings F-003/F-005/F-006/F-007 的现象、原因与处置，是否在 skill 文本里写成可执行纪律（现象 + 动作 + 判据），而非「注意某某」软提醒？逐条对照 findings 原文，有无丢限定条件（如 F-006 的「Claude 主控下」、F-007 的「长 sleep 中也会被报 done」）。
2. **与既有教训是否冲突或重犯**：对照 `docs/modules/dh-relay/knowledge/教训库-候选.md` 中与派活、通知、agent_lost、删树、sandbox 相关条目，以及 RLT_12 `evidence/linux-dry-run/README.md` DR-F-001～006（尤其 codex bypass 结论）、`HC-RL-A140`——新纪律是否与之矛盾或把 Linux/Codex 主控结论误改成全局？
3. **本卡 lesson_candidates.md**：有无该登记未登记项（含 W2/checker 抓出的 P1 模式）；已登记项是否可复用（现象/为什么/下次怎么做）。
4. **不越界**：未改历史 workspace 工件、未改 design/DevPlan/测试代码、未跑 install_skill 改用户目录副本。

## 产出
`workspace/RLT_23/review.lesson.md`：
```
## 结论
APPROVE | REVISE   （有任一 P1 即 REVISE）
## 逐条判据
| # | 判据 | 结论 | 级别 | 依据（文件:行） | 整改动作 |
## 范围外发现
```
并在 `review.md`「复核路径登记」lesson 行填结论。信号：
```
DONE task=RLT_23 role=reviewer-lesson node=R1 status=<APPROVE|REVISE> ts=<ISO8601>
  summary: <一行，含 P1/P2 计数>
  artifacts: review.lesson.md, review.md
```
