# W2 · 审核（plan-review）— 对 W1 产物做计划评审

先读同目录 `README.md`。你是**审核**，只读不改，**做完即停**。你没有参与 W1 起草。

## 评审对象

- `docs/modules/relay-light/design/drafts/A11/brief.md`
- `docs/modules/relay-light/design/drafts/A11/task_plan.md`

## 权威来源（核对 brief / task_plan 是否失真）

- `gh issue view 37`
- `docs/modules/relay-light/workspace/RLT_11/findings.md` F-001 / F-002 / 裁决落记
- DevPlan「RLT-A-11 调整（待开工）」条、「#### RLT_23」「#### RLT_24」两段
- design/01 文件头、§11 总账段、`HC-RL-H10` 行、§12、§15
- 先例：`design/drafts/A09-*.md`、`design/evidence/10-交叉审核记录-RLT-A09-复核触发信号.md`

## 逐项判据（每条 PASS / FAIL，FAIL 给可执行整改动作）

1. **来源真实性**：引用与原文一致？行号 / 小节号对得上？有无凭印象转述？
2. **目标完整**：Issue #37 三条目标（§12 兜底类行、职责分层口径 + 回链 H10、续发 A151~）和五条验收口径是否每条都有批次认领、有机械判据？
3. **停止边界**：有无夹带实现代码、账本 schema、历史 SHA 追溯修改、RLT_22 F-005/F-010、skill、AGENTS.md、dev-harness？
4. **允许路径**：每批要写的文件是否都在 README 允许路径内？非晋级批是否碰了 design/01、evidence、DevPlan？DevPlan 改动是否限定到 README 列的那几行？
5. **流程符合先例**：是否具备 候选稿 → fresh 审核（三段格式）→ 整改 → 定向复审 → 用户裁决 → 晋级 → 开发后复核；用户裁决是否只由编排收集、worker 不回头问用户？
6. **分批独立性与完成判据**：每批是否可独立执行、可独立验证；完成判据是否为命令 / grep / 逐字比对，而非主观描述？
7. **验收 ID 口径**：是否要求实测当前最大号、自 A151 连续续号、只增不改、不复用退役号、同步 §11 总账数字与 §15「验收 ID 稳定性」行？
8. **A151~ 条目设计是否被合理约束**：是否要求原子化、每条可机械核验、分别承接 RLT_23 四条与 RLT_24 的预期覆盖面（schema 合法性、`outcome=failed` 分校验、§12 列取证路径、历史账本向后兼容）；是否禁止候选稿替 RLT_23/RLT_24 定实现细节（如事件最终名称）以外的越权决定——凡属产品决定应进开放项。
9. **职责分层口径**：是否要求写清「账本复现接力现场 / workspace+git+Issue 复现施工现场 / `commit=` 为顺手旁注，squash 后失效不构成契约破坏」三点，并回链 H10；是否把「改不改 H10 本身」作为开放项而非自行决定。

级别：影响 Issue 验收达成、越界、流程缺关键闸、判据不可机械核验 = **P1**；措辞、格式、引用小瑕疵 = **P2**。

## 产出

写 `docs/modules/relay-light/design/drafts/A11/plan-review.md`，三段格式：

```
## 结论
APPROVE | REVISE   （有任一 P1 即 REVISE）

## 逐项判据
| # | 判据 | 结论 | 级别(P1/P2/—) | 依据（文件:行/小节） | 整改动作 |

## 范围外发现
```

若文件已存在（第二轮），**追加** `## 第 N 轮` 节，只复核上轮 P1/P2 是否闭合 + 新引入问题。

然后 `progress.md` 追加：
```
DONE task=RLT-A-11 role=plan-reviewer node=W2 status=<APPROVE|REVISE> ts=<ISO8601>
  summary: <一行，含 P1/P2 计数>
  artifacts: plan-review.md
```
不改 brief / task_plan，不 commit，不回头问用户。
