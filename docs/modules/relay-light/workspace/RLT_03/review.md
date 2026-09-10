<!-- dh:v1 -->
# review — RLT_03

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·批次小审合集**

| 复核者 | 范围 | 发现（P0~P3） | 派出证据 | 证据 |
|---|---|---|---|---|
| 待派 fresh Opus pane | batch 1–4 | 待审 | 待填 | 待填 |

**第二轮·增量复核**

| 复核者 | 范围 | 核第一轮结论 + 新发现 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|---|
| 待派 fresh Opus pane（不得复用批审会话） | 全程+增量 diff | 待审 | 待审 | 待填 | 待填 |

**有效单测·变异点登记**

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人 | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| 待轮 2 Opus 选点 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑证据 | 是否收敛 |
|---|---|---|---|
| 1 | 待审 | 待填 | 待审 |

**需求复核结论**：待派 fresh Opus｜证据待填｜派出待填

**教训复核结论**：待派 fresh Opus｜命中条目待填｜派出待填

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=RLT_03 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| plan/ledger 合同 | design/01、DevPlan RLT_03、现役 Runner 对照 | 待审 | 待审 | 待填 |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：待施工和五路复核后填写。

**设计契约传导声明**：待收口判定。

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| RLT_03：合法 plan 可读、非法 plan fail closed；账本纯追加且时序受控 | 在临时目录执行 add/status/lint 正反例 | E-001（开工占位，收口换为真实场景证据） | 待人验 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | 节点号含 superseded 在内全计划唯一 | AI | 待填 | 待验 |
| 2 | close 仅空或 `agent:<同节点已存在名字>` | AI | 待填 | 待验 |
| 3 | depends_on 存在且无环 | AI | 待填 | 待验 |
| 4 | 依赖 superseded 节点必拒；status/lint 忽略 superseded，且其不算 closed/pending | AI | 待填 | 待验 |
| 5 | 空节点或 agent 全 superseded 必拒 | AI | 待填 | 待验 |
| 6 | 阶段枚举、分组连续、stages 顺序、stage_id/card/k 和同卡串行/跨卡并行正确 | AI | 待填 | 待验 |
| 7 | kickoff/verify-signoff 被禁，映射不含 E11~E13 | AI | 待填 | 待验 |
| 8 | marker 五字段、固定双表、禁竖线、agent.node/重名/默认依赖成立；decision_mode 仅 auto/consult 且可读 | AI | 待填 | 待验 |
| 9 | trigger 三态与引用校验成立，`on:done` 不得跨节点 | AI | 待填 | 待验 |
| 10 | 连续 20 次 add 得 seq 1..20，无重复/覆盖，旧行字节不变，不生成临时文件，无锁 | AI | 待填 | 待验 |
| 11 | 19 事件 fail closed、大小写严格、无 lower/casefold 枚举归一 | AI | 待填 | 待验 |
| 12 | 坏/缺计划三命令退出 3，坏账本 status 退出 4，空账本与首行 plan_loaded 语义正确 | AI | 待填 | 待验 |
| 13 | JSONL 每行固定七字段，agent 格式、配对键、attempt 每节点分配/跳号/重号校验正确，不含 pane ID | AI | 待填 | 待验 |
| 14 | node/agent/event 入参与豁免、agent 状态机/终态封口、node_start/node_close/monitor_restart 时序正确 | AI | 待填 | 待验 |
| 15 | 控制事件分类、升级链 agent 归属、on:done/on:blocked/依赖/node_start 前置和节点关闭双条件正确 | AI | 待填 | 待验 |
| 16 | 错误仅进 stderr 且统一 `error: <code> <message>`；add 的 0/2/3/4 可复现 | AI | 待填 | 待验 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者 | 稳定 ID | 覆盖态 | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RLT_03 任务卡全部机器验收语义 | unittest 正反例 + CLI 退出码/stdio + 追加 bytes/目录观测 | machine | RLT_03 | 否 | DevPlan 每个 HC-ID 均有正反例且全绿 | 待施工 | Linux worktree | design/01 验收表 | RLT_05 范围 | v1 | test-runner | user-authorized-local |

**材料齐没齐**：[ ]

**as-built 更新了没**：[ ]

→ 当前状态：**施工中**

---

## 人类签名区　✅ 仅凭用户对话确认解锁

本卡无业务人判结果项；收口时展示机器证 releasePacket，由用户确认是否执行本地收口授权包。AI 不得预勾。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| RLT_03 机器证可支撑本地收口 | 查看主控展示的测试、复核、变异点和边界证据 | heavy 五路复核收敛、有效单测改坏必红、全部机器项等价 pass | [ ] |
