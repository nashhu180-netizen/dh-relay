# W2 · plan-reviewer — 审 task_plan（标准档）

先读同目录 `README.md`。你是**审核**，只读不改（不改 brief/task_plan/代码，不提交），**做完即停**。工作目录 `/home/nash/work/dh-relay/.dh-worktrees/RLT_24`。

## 评审对象
`workspace/RLT_24/` 下 builder 建的七件套，重点 `brief.md`、`task_plan.md`。

## 权威来源
DevPlan「#### RLT_24」段；design/01 §3.2 第 221 行、§3.4 第 242–330 行、§11.1 `HC-RL-A2`（1210）/ `A85` / `A155`～`A158`（1335–1338）、§12 第 1360–1370 行；`workspace/RLT_11/findings.md` F-004；现状 `relay_log.py` 与 `test_relay_log.py`。

## 判据（标准档：以下任一不满足即 P1；纯措辞/格式/引用陈旧为 P2）
1. **允许路径**：任何一批要改允许路径外文件（含写 `docs/modules/relay-light/relay/**`、skill、design）；
2. **写入者边界**：progress / findings / lesson_candidates / review.* / check.* 写入者缺失或矛盾；
3. **批次边界**：某条 HC（A2/A155/A156/A157/A158）无批次认领、批间隐式依赖、R/F 收口混进 C 批；
4. **oracle 覆盖**：逐条对照 1335–1338 行「怎么证明」列，列出 task_plan 测试清单漏掉的要素（如 A155 的 add 与 lint 分测、字节一致、终态节点后/重复尝试、派生一致；A156 纯空白解码后判定、`reason=` 空值、ok 带空 reason；A158 与旧实现 status 基线比对排除动态字段；A157 实跑/打桩标注、按 seq/object_id 实际检索、不冒称已处置）——漏任一要素即 P1；
5. **wire format 一致性**：task_plan 对编码规则（裸字符集、`%HH` 大小写、`+` 不当空格、单次解码、控制字符/无效 UTF-8 拒绝、单空格分隔、无首尾/连续空格、每 token 恰一个裸 `=`）与写入者（pane→monitor；workspace/worktree→orchestrator）、node 合法性（存在且非 superseded）的描述是否与第 257、301–328 行一致；
6. **可执行性**：每批是否有 RED 先行要求、可机械执行的完成判据与回归命令；单测入口是否为 README 写法；A2 既有 19 词断言与 A85 用例的处理是否说清且不削弱既有断言；
7. **向后兼容风险**：实现方案是否可能让 rlt12-win-01 或现有 fixture 的旧行被新校验误拒（例如把自由 `note` 解析扩到非 `resource_close` 事件）。

## 产出
`workspace/RLT_24/review.plan.md`：
```
## 结论
PASS | REVISE   （有任一 P1 即 REVISE）

## 逐项判据
| # | 判据 | 结论 | 级别(P1/P2) | 依据（文件:行） | 整改动作 |

## 范围外发现
```
`progress.md` 信号节追加：
```
DONE task=RLT_24 role=plan-reviewer node=W2 status=<PASS|REVISE> ts=<ISO8601>
  summary: <一行，含 P1/P2 计数>
  artifacts: review.plan.md
```
二轮及以后（编排说「复审 r<k>」）：只核上轮 P1 是否闭合 + 修订是否引入新 P1，产出追加到 `review.plan.md` 末尾「复审 r<k>」节。
