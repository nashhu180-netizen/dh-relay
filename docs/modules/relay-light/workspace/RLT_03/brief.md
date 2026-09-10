<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_03 relay_plan 解析/lint 与纯追加账本/状态机

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| RLT_03 | P1-RelayLight-开发方案 | DevPlan §3.2 `RLT_03` |

## 目标 (Outcome)

在两个 Python 文件内交付可独立运行的 `relay-log add/status/lint` 内核：对 `relay_plan.md` marker+固定双表 fail closed 解析，对 JSONL 账本只追加并守住事件词表、attempt、agent 状态机与触发/关闭前置。

## Zero-context 自查

施工者只读本文件、`task_plan.md`、DevPlan RLT_03 卡和 Context Packet 即可开工；冲突时按权威顺序：DevPlan 验收口径 > design/01 契约 > task_plan 路径。

## 完成条件 ★必写

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| 1 | 节点号含 superseded 在内全计划唯一 | AI | RLT_03 / design/01 + HC-RL-A46 |
| 2 | close 仅空或 `agent:<同节点已存在名字>` | AI | RLT_03 / design/01 + HC-RL-A47 |
| 3 | depends_on 存在且无环 | AI | RLT_03 / design/01 + HC-RL-A48 |
| 4 | 依赖 superseded 节点必拒；parser/lint 忽略 superseded，并仅允许四个冻结例外 | AI | RLT_03 / design/01 + HC-RL-A72/A128 |
| 5 | 空节点或 agent 全 superseded 必拒 | AI | RLT_03 / design/01 + HC-RL-A75 |
| 6 | stage 枚举、分组连续、stage_id/card/k 和同卡串行/跨卡并行正确 | AI | RLT_03 / design/01 + HC-RL-A129/A104/A109/A87 |
| 7 | parser/lint 拒绝 kickoff/verify-signoff node type | AI | RLT_03 / design/01 + HC-RL-A126 |
| 8 | marker 四必需字段、固定双表、禁竖线、agent.node/重名/默认依赖成立；decision_mode 缺省为 auto 且仅 auto/consult | AI | RLT_03 / design/01 + HC-RL-A24/A18/A130 |
| 9 | trigger 三态与引用校验成立，`on:done` 不得跨节点 | AI | RLT_03 / design/01 + HC-RL-A35/A71 |
| 10 | 连续 20 次 add 得 seq 1..20，无重复/覆盖，旧行字节不变，不生成临时文件，无锁 | AI | RLT_03 / design/01 + HC-RL-A37/A38/A39/A40 |
| 11 | 19 事件 fail closed、大小写严格、无 lower/casefold 枚举归一 | AI | RLT_03 / design/01 + HC-RL-A2/A41/A42 |
| 12 | 坏/缺计划三命令退出 3，坏账本 status 退出 4，空账本与首行 plan_loaded 语义正确 | AI | RLT_03 / design/01 + HC-RL-A5/A45/A84 |
| 13 | JSONL 每行固定七字段，agent 格式、配对键、attempt 每节点分配/跳号/重号校验正确，不含 pane ID | AI | RLT_03 / design/01 + HC-RL-A55/A50/A49/A58/A51 |
| 14 | node/agent/event 入参与豁免、agent 状态机/终态封口、node_start/node_close/monitor_restart 时序正确 | AI | RLT_03 / design/01 + HC-RL-A59/A60/A68 |
| 15 | 控制事件分类、升级链 agent 归属、on:done/on:blocked/依赖/node_start 前置和节点关闭双条件正确 | AI | RLT_03 / design/01 + HC-RL-A69/A70/A77/A78/A17/A74 |
| 16 | 错误仅进 stderr 且统一 `error: <code> <message>`；add 的 0/2/3/4 可复现 | AI | RLT_03 / design/01 + HC-RL-A63/A56 |

## 边界 (Boundaries)

- In scope：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、本工作区。
- Out of scope：模板生成器、Herdr 驱动、写死阶段顺序、锁/临时文件替换、`by` 身份验真、产出质量判断、RLT_05 所属完整 status/配置/Recipe/止损。
- 何时必须停下问人：仅 E11 本地收口确认、复核降级、P0/P1 三轮不收敛或出现超出已冻结设计的真正方向冲突。

## 触及子系统

- relay-light `relay-plan` / `relay-log`（收口时覆盖更新对应 as-built）
