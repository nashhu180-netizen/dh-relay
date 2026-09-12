<!-- dh:v1 -->
# review — RLT_01

> RLT_01 task_type=`normal`。施工者不得复核自己的卡；复核 Recipe 三路：代码轮 1、需求方向、教训，另有有效单测要求。

## Normal Recipe 路径登记

| 路径 | 时序/独立性 | 必审靶子 | reviewer | 证据 | 状态 |
|---|---|---|---|---|---|
| code-round1 | construction 完成后的代码复核；fresh，非施工者 | 整卡 diff、A124 证法（mid-failure 注入+重跑收敛）、manifest 六字段、五件闭集、只进 allowed-paths | 待主控指派 | — | 未开始 |
| requirement | 独立路径 | 逐字对齐 DevPlan RLT_01 卡与 design §8.1；无 RLT_07 业务内容抢跑、无真实用户目录写入 | 待主控指派 | — | 未开始 |
| lesson | 独立路径 | 核 `lesson_candidates.md` 证据、去重与可复用性；若 absent 形成可核查 N/A | 待主控指派 | — | 未开始 |

## 批次小审登记

| Batch | 小审 reviewer | 结论 | 证据 | 状态 |
|---|---|---|---|---|
| 1 | 待主控指派 | — | — | 未开始 |

## 有效单测·改坏必红（代码轮 1 必填）

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应测试 | 命令 | 施加 hash | 还原 hash | 行为红结果 | 状态 |
|---|---|---|---|---|---|---|---|---|
| 待代码轮 1 填写 | — | — | — | — | — | — | — | 未开始 |
