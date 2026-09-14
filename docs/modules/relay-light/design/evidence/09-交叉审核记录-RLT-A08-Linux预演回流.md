<!-- dh:v1 -->
# RLT-A-08 / RLT-B-07 交叉审核记录 — Linux 预演回流

- 日期：2026-09-14
- 性质：A-full（design/01 续发 A137～A142）+ B-adjust（新增 RLT_21）。**草案，未经用户确认；不是 D-start、施工、verify、push、PR、合并授权**
- 权威产物：`design/01-RelayLight-产品设计与验收.md`、`dev_plan/P1-RelayLight-开发方案.md`
- 输入：`workspace/RLT_12/evidence/linux-dry-run/README.md`（DR-F-001～006，预演分支 `dryrun/rlt12-linux` 账本 `relay/dryrun-linux-01/relay_log.jsonl` 55 行）、`workspace/RLT_07/findings.md` F-002/F-003
- 用户触发原话：编排汇报六条预演发现并建议「先转成对 SKILL.md 的修订卡（B-adjust）再跑正式」，用户答「**可以转**」（2026-09-14）。该答复只授权起草与审核，落盘另取确认。

<a id="review-rlt-a08"></a>

<!-- dh:planning-evidence:v1 event=RLT-A-08 artifact=design/01-RelayLight-产品设计与验收.md kind=review -->

## 一、发现 → 设计结论对照（A-full）

| 预演发现 | 事实 | 设计缺口判定 | 续发 ID |
|---|---|---|---|
| DR-F-003 | 监工三次 NOT_RUN 后写 `stage_result outcome=blocked` 被 A112 拒（要求全节点 closed），但节点内 agent 无终态则节点不可关 → `blocked` 在实现上不可达；§5.2.1 的「blocked → 继续 → 补写 done」路径与 A112 矛盾 | 设计与实现冲突：`stage_result` 未按 outcome 区分节点关闭前置 | A137（分 outcome 校验 + `ref=`） |
| DR-F-001 / DR-F-003 | codex read-only 沙箱在本机 bwrap loopback 失败，worker 从未进入工作态；协议无「环境性 NOT_RUN」出口，attempt 计数与换启动方式无关系 | 设计缺口 | A138（NOT_RUN 出口 + `launch_fix` 分别计数） |
| DR-F-001 | 换启动方式落地时 relay_plan `launch` 列与实际不符，按现行规则应 `plan_amend`，代价与收益不匹配 | 设计缺口 | A139（`launch_fix=` 运行事实记账） |
| DR-F-002 | devin 单轮 Connection lost 挂 34 分钟，状态机无法区分长思考与挂死；监工 `wait` 无限等 | 设计缺口（§7.3 只有 attempt/X 两计数） | A140（`silence_timeout_min` + 监工模板） |
| DR-F-004 / DR-F-005 | 派单回车被启动提示吞掉空转 1 小时；后台 wait/轮询被低内存杀 | adapter 纪律缺口（§7.2 只写「必须有接收者」） | A141（提交确认 + 事件监听 + 沙箱替代预检） |
| RLT_07 F-002 / F-003 | `decision_mode` 模式门与 `cancelled` 归属闸未实现，两条负例 skip 钉住 | 已有 oracle（A96/A114/A69）的实现缺口，无卡承接 | A142（实现承接，不改原 ID） |
| DR-F-006 | light 卡 plan-review 两轮 P1 全是措辞/边界项 | 非设计缺口，属模板收窄建议 | 不发 ID；随 A140 模板改动顺带，由 RLT_21 实施提示承接与否交 B 审核判断 |

### design/01 变更集（草案）

| 位置 | 改动 |
|---|---|
| §3.4 `stage_result` 行 | 增：`done/cancelled` 要求全节点 closed；`blocked/failed` 允许未关但须 `ref=<agent>#<n>:<事件>` |
| §4.2 `launch` 列 | 增：实际启动不同不改计划，`agent_launch.note` 写 `launch_fix=`，不触发 `plan_amend`，lint 不校验 |
| §5.2.1 | 增「环境性 NOT_RUN 出口」段 |
| §7.3 | 增「静默超时」段（`limits.silence_timeout_min` 默认 30） |
| §11 抬头 | 126→132 条，AI 111→117 |
| §11.1 | 追加 A137～A142 六行 |
| §14 | 增第 8 项 |

ID 声明：只续发，不退役、不改号、不改既有 owner；A96/A114/A69 保留在 RLT_07 名下，A142 是其实现承接。

<a id="review-rlt-b07"></a>

<!-- dh:planning-evidence:v1 event=RLT-B-07 artifact=dev_plan/P1-RelayLight-开发方案.md kind=review -->

## 二、DevPlan 变更集（B-adjust 草案）

| 位置 | 改动 |
|---|---|
| §0 | 增 RLT-B-07 行（标草案） |
| §3.1 | 增 RLT_21 索引行；RLT_12 备注加「正式跑前应使用 RLT_21 产物（非依赖）」 |
| §3.2 | 增 RLT_21 卡（标准 / normal / 允许路径四项 / 依赖 RLT_07、RLT_09、RLT_10） |
| §4 | 第 1 批加入 RLT_21（置于 RLT_12 前）；卡数 17→18 |
| §6 | A137～A142 → RLT_21 |
| dh:status | 下一步与阻塞行同步 |

批次理由：RLT_21 全部可在 Linux 完成且无高危；RLT_12 正式跑（Windows）若带着已知的 A112/blocked 不可达缺口去跑，第一次真计划的异常路径会重复预演的假 blocked；故排在 RLT_12 前，但不作 RLT_12 的硬依赖，用户可选择先跑 RLT_12。

## 三、fresh 审核

- 派出：codex `gpt-5.6-sol`（`b07-review-sol`，独立终端空间，未参与原稿；bypass 沙箱 + 提示词只读，派出前后 git 基线 `9204012` 一致，产出文件外零改动）。
- 产出：`workspace/RLT_12/evidence/linux-dry-run/reviews/rlt-b07-fresh-review-sol.md`，`VERDICT=REVISE P0=0 P1=5 P2=2`。
- 独立核查的仓库事实：`relay_log.py` A112 对所有 outcome 统一拒未关节点；`loss_stop()` 按 `(node, agent)` 累计、无分桶；`derive_status()` 静默只按账本 `last_ts`；§6 对照表机器提取 132 个唯一 ID、0 重复。

## 四、主会话裁决

| # | 级别 | 审核意见 | 裁决 | 落点 |
|---|---|---|---|---|
| 方案-1 | P1 | A112 与 A137 互相矛盾 | 采纳：A112 文本收窄为只约束 `done/cancelled`，标「RLT-A-08 澄清」；A137 标 `clarifies: HC-RL-A112`；owner 不变 | design §11.1 |
| 方案-2 | P1 | `launch_fix` 分桶可无限刷新止损；A113 误引 | 采纳：新预算只能由用户开——须先有该 agent 名下 `user_decision`（note 含 `launch_fix=<token>`），同 token 才接受；每 `user_decision` 一个 token、每 `(node, agent)` 最多一组，总预算 ≤ 2×attempt_max；引用改 A107 | design §11.1 A138 |
| 方案-3 | P1 | A140 把账本静默误写成终端/产出静默 | 采纳：`status` 只标 `ledger_silent` 提示；中断前监工须核 Herdr 状态 + pane 末行 + 允许路径产出三者均无变化；加「任一仍在变化不得中断」 | design §7.3、§11.1 A140 |
| 方案-4 | P2 | 覆盖自查计数停在修订前 | 采纳：§承接设计、§6 尾注、§8.1、§9 四处同步为 117+15=132、18 张卡 | DevPlan |
| 理解-1 | P1 | 「六条发现」表述漏掉 DR-F-006 | 采纳：RLT_21 非目标显式写明 DR-F-006 另由用户裁决；转为「需用户决定-2」 | DevPlan RLT_21 |
| 理解-2 | P2 | 双侧安装缺当次授权闸 | 采纳：RLT_21 实施提示补与 RLT_12 同闸的展示目标 + 当次授权 + 证据要求 | DevPlan RLT_21 |
| 决定-1 | P1 | RLT_21 是否为 RLT_12 硬依赖 | 交用户；主会话推荐硬依赖（先修后跑）；design §14 第 8 项改为「由用户裁决」占位 | 待用户 |
| 决定-2 | P1 | light plan-review 收窄 / 保持 / 折中 | 交用户；主会话推荐 C（纯措辞降 P2，写入者与节点边界仍 P1） | 待用户 |

裁决后未做定向复审（改动均为审核意见的直接落地，无新增裁量）；用户确认时若改变决定-1/2 的推荐项，再做一次定向复审。

<a id="understanding-rlt-b07"></a>

<!-- dh:planning-evidence:v1 event=RLT-B-07 artifact=dev_plan/P1-RelayLight-开发方案.md kind=understanding -->

## 五、讲解与用户确认

（待填：讲解要点 + 用户确认原话）
