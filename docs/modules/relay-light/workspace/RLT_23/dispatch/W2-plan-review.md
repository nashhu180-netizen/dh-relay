# W2 · plan-reviewer — 审 task_plan（light 档两级分级）

先读同目录 `README.md`。你是**审核**，只读不改（不改 brief/task_plan/skill，不提交），**做完即停**。

## 评审对象
`workspace/RLT_23/` 下 builder 建的七件套，重点 `brief.md`、`task_plan.md`。

## 权威来源
DevPlan「#### RLT_23」段；design/01 §11 `HC-RL-A151`～`A154`（1331–1334 行）与 `HC-RL-A140`（1320 行）；`workspace/RLT_11/findings.md` F-003/F-005/F-006/F-007；现状 skill 三文件；`test_relay_log.py` / `test_install_skill.py` 中针对 skill 文本的结构检查用例。

## 分级规则（light 档，照 SKILL.md「plan-reviewer 分级」）
纯措辞、格式、引用陈旧项一律 **P2 不阻断**。以下四类 **P1 阻断**：
1. allowed-paths 越界（任何一批要改允许路径外文件）；
2. 写入者边界（谁写 progress / findings / lesson_candidates / review.*）缺失或矛盾；
3. 节点/批次边界缺漏或矛盾（某条 HC 没有批次认领、批间隐式依赖、F 阶段收口混进 C 批）；
4. 验收命令与完成信号缺失或矛盾（A151～A154 任一条没有可机械执行的 grep/结构检查命令，或命令期望与 oracle「怎么证明」列不一致；A152 未处理 adapter 现有 bypass 句导致「无条件 bypass」静态检查必然失败；A153 与 A140 口径冲突）。

另核：task_plan 给出的「拟写入纪律原文」是否逐条覆盖 oracle 验收项里的引号原文要素（不是转述丢要素）；是否要求跑回归命令防既有结构检查被打破。

## 产出
`workspace/RLT_23/review.plan.md`：
```
## 结论
PASS | REVISE   （有任一 P1 即 REVISE）

## 逐项判据
| # | 判据 | 结论 | 级别(P1/P2) | 依据（文件:行） | 整改动作 |

## 范围外发现
```
`progress.md` 信号节追加：
```
DONE task=RLT_23 role=plan-reviewer node=W2 status=<PASS|REVISE> ts=<ISO8601>
  summary: <一行，含 P1/P2 计数>
  artifacts: review.plan.md
```
二轮及以后（编排说「复审 r<k>」）：只核上轮 P1 是否闭合 + 修订是否引入新 P1，产出追加到 `review.plan.md` 末尾「复审 r<k>」节。
