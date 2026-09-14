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

（待 fresh-context reviewer 落盘后由主会话逐条裁决并回填；见 `workspace/RLT_12/evidence/linux-dry-run/reviews/`）

## 四、主会话裁决

（待填）

<a id="understanding-rlt-b07"></a>

<!-- dh:planning-evidence:v1 event=RLT-B-07 artifact=dev_plan/P1-RelayLight-开发方案.md kind=understanding -->

## 五、讲解与用户确认

（待填：讲解要点 + 用户确认原话）
