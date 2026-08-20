<!-- dh:v1 · execution_strategy.md — 分工。🟡 开工时定一次。solo 任务可只填操作模型一行。 -->
# execution_strategy — DHR_28

## 操作模型

主会话（Opus）主导 + 定点派子 agent。主会话负责 S2 施工步骤、ADR 正文裁断、E2/E3 代码复核收敛与人闸；机械与可并行的备料按节点表默认委托给 subagent。分 3 批，每批结束派一个 fresh subagent 只看本批 diff 做小审（代码复核轮 1 前移）。

## 子 agent 授权（若派单）

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---------|---------------------------|--------|
| S1 brief 起草（sonnet） | 只写 `workspace/DHR_28/brief.md`；其余全仓只读 | 用户 2026-08-20 分流「照节点表默认」 |
| 批次检查点 1/2/3 小审 | **全只读**，不写任何文件；结论以返回文本交主会话回填 `review.md` / `findings.md` | 同上 |
| E2 代码复核·增量轮 2 | **全只读**；实例/会话须 ≠ 三次批次小审，不继承轮 1 会话上下文，可只读仓内已落账的轮 1 记录 | 同上（硬闸，不可 skip） |
| E4 需求复核 / E5 教训复核 / E14 一致性复核 | 全只读；结论由主会话核后登记 `review.md` | 同上 |
| E6 miner / E7 as-built | miner 只读备料进候选区；as-built 按覆盖式写 `as-built/<子系统>.md` | 同上 |

## 收尾铁律

- 证据不全 / 有 P0–P1 未关闭前，不许标"待验收"。
- 子 agent 默认无写权，要人批准。
- **主树有并行 session 的 `workspace/DHR_49/` WIP**：本卡一切提交禁 `git add -A`，按路径 stage。
