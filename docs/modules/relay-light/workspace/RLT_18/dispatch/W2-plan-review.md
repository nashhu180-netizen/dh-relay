# W2 · plan-reviewer — 审 task_plan（heavy）

先读同目录 `README.md`。你是**审核**，只读不改（不改 brief/task_plan/代码，不提交），**做完即停**。工作目录 `/home/nash/work/dh-relay/.dh-worktrees/RLT_18`。

## 评审对象
`workspace/RLT_18/` 下 builder 建的七件套，重点 `brief.md`、`task_plan.md`。

## 权威来源
DevPlan「#### RLT_18」段；design/01 §3.6（约 480–491）、§7.2（约 894–908）、第 115/140/189/1436–1439 行、`HC-RL-A82`/`A83`/`A101`（约 1351–1353）、`H11`/`H12`（约 1408–1409）；现状 `relay_log.py`、`test_relay_log.py`、两个 adapter。

## 判据（任一不满足即 P1；纯措辞/格式/引用陈旧为 P2）
1. **允许路径**：任何一批要改 README 闭集外文件（含 design、SKILL.md、历史账本、用户级副本）。
2. **写入者边界**：progress / findings / lesson_candidates / review.* / check.* 写入者缺失或矛盾；watch 自身有无任何写账路径（A101 是硬约束）。
3. **批次边界**：A82/A83/A101/H11/H12 与 adapter 结构检查各有批次认领；无隐式依赖；R/F 收口不混进 C 批。
4. **oracle 覆盖**：逐条对照 §3.6 与 1351–1353「怎么证明」列——无立即重挂、30 秒轮询、终态退出、working 重挂、去重、20 分钟 tick、两层退出（阶段末 `node_close` / 编排末阶段 `stage_close`）、短 ASCII 单行 prompt、每 agent 一线程、adapter 写明节拍归属——漏任一即 P1。
5. **打桩可行性**：单测是否不依赖真实 herdr / 真实时钟；并发线程的测试是否确定性（不靠 sleep 竞态）。
6. **实测批**：H11 是否 Claude、Codex **分别**验；H12 是否「杀 watch → 展示下一次例行查看的时刻与发现」；探针命名/关闭/不写历史账本/不冒写人判是否写明。
7. **可执行性**：每批 RED 先行、机械完成判据、README 单测入口写法。
8. **歧义处理**：builder 标的「待确认解读」是否与 design 字面兼容；若只能改 design 才成立 → P1 并建议走 decider。

## 产出
`workspace/RLT_18/review.plan.md`：
```
## 结论
PASS | REVISE   （有任一 P1 即 REVISE）

## 逐项判据
| # | 判据 | 结论 | 级别(P1/P2) | 依据（文件:行） | 整改动作 |

## 范围外发现
```
`progress.md` 信号节追加：
```
DONE task=RLT_18 role=plan-reviewer node=W2 status=<PASS|REVISE> ts=<ISO8601>
  summary: <一行，含 P1/P2 计数>
  artifacts: review.plan.md
```
二轮及以后（编排说「复审 r<k>」）：只核上轮 P1 是否闭合 + 有无新 P1，追加到 `review.plan.md` 末尾「复审 r<k>」节。
