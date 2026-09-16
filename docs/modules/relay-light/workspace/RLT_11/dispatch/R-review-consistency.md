# R2 · reviewer — 一致性路复核（light 档必做两路之一）

先读同目录 `README.md`。你是**复核**，只读不改，做完即停。**不要采信施工者的自述，自己回原始来源核。**

## 复核范围

本卡（RLT_11）全部改动。用 `git status --porcelain` 与 `git diff` 自己确认改了哪些文件。

## 一致性路判据（逐条 PASS/FAIL，FAIL 给级别 P1/P2 与整改动作）

1. **退场核对结论属实**：C1 产出的退场核对表，与设计 `01-RelayLight-产品设计与验收.md` **§12**（持久化产物退场路径：谁删 / 何时删 / 删失败怎么办）逐类对得上吗？有无把设计没写的东西说成写了？
2. **实现侧核对属实**：「status 无自动删除」这一断言，是否有**实际源码依据**（自己去 `tools/relay-light/` 读 status 相关代码路径确认它只派生并输出状态，不做删除），而不是照抄设计？
3. **「只写不删」是显式选择且有理由**：设计里是否确实把它记成显式决策并给了理由？核对表是否如实转述？
4. **HC-RL-A13 三断言逐条落地**：①设计与实现均声明退场路径 ②status 无自动删除 ③三条教训候选逐条落账并回链——每条是否都能在本卡产物里找到**可机械核验**的证据行？
5. **允许路径四集合核对**：实际改动文件集合是否完全落在三条允许路径内？有无新增 `__pycache__` 等脏文件（区分 pre-existing 与本卡新增，**不要自己删**）？
6. **as-built 与现役实现一致**：若本卡改了 `docs/modules/relay-light/as-built/**`，改后的描述与现役代码是否一致？有无引入与 RLT_22 合入后现状矛盾的表述？
7. **不越界**：有无触碰 F-005 / F-010、dev-harness、历史账本/计划/证据、既有教训库其他条目？

## 产出

写 `docs/modules/relay-light/workspace/RLT_11/review.consistency.md`，格式同教训路（结论 / 逐条判据表 / 范围外发现）。

`progress.md` 追加：
```
DONE task=RLT_11 role=reviewer-consistency node=R2 status=<OK|REVISE> ts=<ISO8601>
  summary: <一行，含 P1/P2 计数>
  artifacts: review.consistency.md
```

## 你不做的事

- 不改任何文件、不删脏文件、不 commit、不 push、不问用户
- 不替编排做验收裁决
