# W2 · plan-reviewer（审核）— 对 W1 产物做计划评审

先读同目录 `README.md`。你是**审核**，只读不改，**做完即停**。

## 评审对象

- `docs/modules/relay-light/workspace/RLT_11/brief.md`
- `docs/modules/relay-light/workspace/RLT_11/task_plan.md`（W1 切成 C1 / C2 两批）

## 权威来源（用来核对 brief/task_plan 是否失真）

- `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` 的「#### RLT_11」段（目标/非目标/验收/允许路径/档位/实施提示）
- `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md`：§12（持久化产物退场路径）、§15（查漏自查，「教训候选（本卡新增）」行的三条原文）、验收 ID `HC-RL-A13`
- `docs/modules/dh-relay/knowledge/教训库-候选.md`（只读，看既有编号与条目格式）

## 逐项判据（每条给 PASS / FAIL，FAIL 必须给可执行的整改动作）

1. **来源真实性**：brief 与 task_plan 里对设计/开发方案的引用是否与原文一致？有无凭印象转述、张冠李戴、行号/小节号对不上？
2. **三条教训原文保真**：§15 那三条的措辞有没有被悄悄改写或合并？回流计划是否要求逐条回链来源（设计 01 §15 + 产生该教训的卡号）？
3. **验收可达**：`HC-RL-A13` 的三个断言——①设计与实现均声明退场路径 ②status 无自动删除 ③三条教训候选逐条落账并回链——是否每一条都能被 C1/C2 的产物**机械核验**？有没有哪个断言没人认领？
4. **分批独立性**：C1 与 C2 是否真的可独立执行、独立验证、无隐式依赖？某一批单独失败时另一批是否仍成立？
5. **允许路径合规**：计划中每一处要写的文件是否都落在三条允许路径内？有没有隐含越界（含新建目录、顺手改 as-built 之外的文件）？
6. **停止边界**：有没有把「顺手整理既有教训库其他条目」「修 F-005 / F-010」「改 dev-harness」「删历史账本/计划/证据」混进任何一批？
7. **完成判据质量**：每批的完成判据是不是**可机械核验**的（而不是「核对完成」「写清楚」这类主观描述）？
8. **候选编号口径**：W1 记录「候选库现有末号 87」，计划是否要求 C2 施工时 fresh 复核末号、续号不复用？

## 你不做的事

- 不改 `brief.md` / `task_plan.md`（整改由编排决定是否回派 builder）
- 不执行 C 批任何施工动作，不动教训库
- 不 commit、不 push
- 不回头问用户；卡住把 BLOCKED 写进 progress.md 并结束

## 产出

写 `docs/modules/relay-light/workspace/RLT_11/plan-review.md`，三段格式：

```
## 结论
APPROVE | REVISE   （有任一 P1 即 REVISE）

## 逐项判据
| # | 判据 | 结论 | 级别(P1/P2) | 依据（文件:行/小节） | 整改动作 |

## 范围外发现
（记这里，不要顺手改）
```

然后在 `progress.md` 追加：
```
DONE task=RLT_11 role=plan-reviewer node=W2 status=<OK|REVISE> ts=<ISO8601>
  summary: <一行，含 P1/P2 计数>
  artifacts: plan-review.md
```
