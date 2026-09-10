<!-- dh:v1 -->
# review — RLT_03

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

**第一轮·整卡代码复核**

| 复核者 | 范围 | 发现（P0~P3） | 派出证据 | 证据 |
|---|---|---|---|---|
| rlt03-code1-opus（fresh Claude Opus 5） | batch 1–4 + 收口全量 diff | 初审 `CHANGES_REQUESTED`：P1×2、P2×4；closeout-rework=1 定向复验后六项全部 CLOSED，余 5 项 P3 非阻塞 | e:E-047, e:E-055 | `reviews/closeout-code-round-1-opus.md`；`reviews/closeout-code-round-1-recheck-opus.md`（APPROVE） |

**第二轮·增量复核**

| 复核者 | 范围 | 核第一轮结论 + 新发现 | 结论 | 派出证据 | 证据 |
|---|---|---|---|---|---|
| rlt03-code2-opus（fresh Claude Opus 5） | 全程 + 增量 diff | 初审 P1×1、P2×2；rework=1 后原项闭合，新增 F-043 测试网缺口 | 条件 APPROVE，F-043 转 fresh 定向复验 | e:E-048, e:E-056 | `reviews/closeout-code-round-2-opus.md`；`reviews/closeout-code-round-2-recheck-opus.md` |
| rlt03-code2b-opus（fresh Claude Opus 5） | F-043 + 最终字节有效变异 | F-043 删闸/坏闸均被杀死；A74 当前最终字节变异仍被杀死；新增 finding 0 | **APPROVE** | e:E-058 | `reviews/closeout-code-round-2-recheck2-opus.md` |

**有效单测·变异点登记**

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人 | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| `relay_log.py:693` A74 node-close 双条件 | `latest["event"] != "done"` → `not in TERMINAL_EVENTS` | 状态机关闭前置 | `test_node_close_requires_all_terminals_and_configured_agent_done` | 隔离副本目标 + 全量 unittest | `1c0b66…56c25` | `f484ff…7ceb1` / test `8c2098…00dbd` | rlt03-code2b-opus | 行为断言 `2 != 0`；54 tests 仅 1 failure；真实树 54 OK |
| `relay_log.py:433-434` ledger 末行 LF guard | 整段删除；另测 `raise` → 静默 `text += "\\n"` | JSONL 追加边界 | `test_non_newline_terminated_ledger_is_rejected_without_append` trailing-space/no-LF | 隔离副本目标 + 全量 + 真 CLI probe | `07a875…b93d` / `2e4916…bc51` | `f484ff…7ceb1` / test `8c2098…00dbd` | rlt03-code2b-opus | 两种变异均行为断言 `4 != 0`；删闸全量仅 1 failure；真实树 54 OK |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑证据 | 是否收敛 |
|---|---|---|---|
| 1 | 2 | E-052 先红（8 个行为断言失败）→ E-053/E-054 54 tests 全绿；代码轮 1 APPROVE | 是 |
| 2（F-043） | 0 | E-057 补 trailing-space/no-LF 判别器；E-065 独立杀死删闸/坏闸与 A74 变异，真实树 54 tests 全绿 | 是 |

**需求复核结论**：rlt03-req-opus｜派出=e:E-049, e:E-059, e:E-071, e:E-075｜`APPROVE`（P0/P1/P2=0、P3=2，均为登记项）：E-071 已把 A5/A128/A129 正式合同冲突与 `b7f4ecc` 路径例外四条历史 blocker 全部判 CLOSED；其唯一 P1 元数据误枚举由 E-074 修正，E-075 原路径单点终审确认闭合且未引入新 P1/P2，heavy `requirement_direction` 已收敛。此结论只关闭需求方向路径，不代表整卡验收或人类签收｜证据 E-049 / E-059 / E-071 / E-074 / E-075｜`reviews/closeout-requirement-direction-opus.md`；`reviews/closeout-requirement-direction-recheck-opus.md`；`reviews/closeout-requirement-direction-recheck2-opus.md`；`reviews/closeout-requirement-direction-recheck3-opus.md`

**教训复核结论**：rlt03-sol1｜派出=e:E-050, e:E-060, e:E-064｜`APPROVE`（P0/P1/P2/P3=0）：候选占位与全部 detail 文案误绑定均已闭合，`lessons-absent=false` 合规；OMP GLM-5.3-Flash 的 detail-rework=2 经同一变异旧红/新绿与 54 tests 独立复验｜证据 E-050 / E-060 / E-062~E-064｜`reviews/closeout-lessons-sol.md`；`reviews/closeout-lessons-recheck-sol.md`；`reviews/closeout-lessons-recheck2-sol.md`

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=RLT_03 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| plan/ledger 合同 | design/01、DevPlan RLT_03、现役 Runner 对照 | 复验确认 `review.md` 旧口径 CLOSED；as-built owner/状态词、DevPlan A59 数量及 A5/A128/A129 正式文本当时仍不一致，且目标路径越出本卡授权 | 用户 2026-09-10 确认 Astra REVISE 并授权精确七路径后**已按裁决同步**（零代码改动）；**E-072 原路径复验 `APPROVE`：P0/P1/P2=0、P3=1（DevPlan 抬头阶段文案滞后，不阻塞）** | e:E-051, e:E-061, e:E-072 |

## 合同补充落账（2026-09-10，用户确认 Astra REVISE）

> 裁决源：`reviews/closeout-contract-decision-astra.md`（总裁决 REVISE；六项中 ACCEPT×3 = 第 1/4/6 项，REVISE×3 = 第 2/3/5 项）。用户明文「按照 Astra 的决策来」。本批为 **doc-only 同步，零代码改动**，且**不代表整卡验收、verify、合并或下一卡开工**。

| 项 | 落点 | 内容 |
|---|---|---|
| 1 A5（ACCEPT） | design §3.1 + A5 行；DevPlan RLT_03 A5 行 | 解析级失败三命令退 3；已解析后违反 lint 规则 lint 退 2、add/status 退 3；节点号重复示例移入 A46；不泛化 add 自身校验 |
| 2 A128（REVISE） | design A128 行；DevPlan RLT_03 A128 行 | 本卡核心为「活跃 parser/lint 忽略 superseded」+ 逐项证 A46/A72/A75；A120 降为跨卡兼容引用，其表尾放宽与「两正四反」集成取证归 RLT_09；四项清单不删 |
| 3 A129（REVISE） | design §3.5 映射行 + 阶段性交付注记、§4.3、§4.5.4、A129 行；DevPlan RLT_03 A129 行、RLT_09 目标与 A120 行 | 基础边界先忽略 superseded，superseded 隔行当前即通过；其他活跃 stage 隔断按基础规则拒绝；合法表尾追加放宽归 RLT_09/A120，运行中追加终态承诺保留；既有 `C1→R1→C2` 多违规 fixture 不承诺原样翻绿 |
| 4 A59（ACCEPT） | design §3.5 add 入参校验 + A59 行；DevPlan RLT_03 A59 行；brief #14 | 豁免数量文字改为**并列四成员** `orchestrator` / `monitor` / `planner-amend` / `strategist`；仅豁免「agent 名属于该节点 agent 表」这一条，其余校验照常 |
| 5 as-built（REVISE） | `as-built/现役Runner一致性对照.md` | 四态（`superseded` 为计划行废弃标记）；原 RLT_04→RLT_03、原 RLT_06→RLT_05 逐句语义校正；关闭第 1 行改为「RLT_03 写入前校验，RLT_05 只派生可关闭状态/原因」 |
| 6 b7f4ecc 例外（ACCEPT） | progress「b7f4ecc 一次性路径例外治理记录」 | 绑定提交全号与既有的五份治理 patch（336 插入 / 44 删除）；原 allowed-paths 不动、无通配、无未来继承、不伪称机械闸原本通过 |

**范围与状态**：本批只触碰 `design/01`、`dev_plan/P1-*`、`as-built/现役Runner一致性对照.md` 与本卡 `brief.md` / `review.md` / `progress.md` / `findings.md` 七个精确文件；F-003 / F-016 已按需求方向（E-071）与一致性（E-072 `APPROVE`）两路原路径复验置 `resolved`（见 `findings.md`），**RLT_03 未验收、未签收、DevPlan RLT_03 仍未完成、RLT_05 仍未开始、未 commit / push / verify / merge**。

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：代码轮 1、代码轮 2、需求方向、教训、一致性五路均已收敛为 `APPROVE`，有效变异已杀死且真实树 54 tests 全绿；A5、A128、A129 的正式文本与 as-built owner/状态词已按用户确认的 Astra REVISE 落账（doc-only，零代码改动）。需求方向 E-075 确认 E-071 唯一 P1 已由 E-074 闭合，一致性 E-072 为 `APPROVE`（P0/P1/P2=0、P3=1）。**但五路收敛不构成当前可确认状态**：R29 规划事件闸在 E-080/E-081 被判为阻塞（`design/01` `EVENT_COUNT=3`、`DevPlan` `EVENT_COUNT=4`；Astra 裁决 `VERDICT=REQUIRE_NEW_EVENT`），该阻塞已按用户明确授权的精确治理包**闭合**（E-083：design/01 留 fresh `RLT-A-05`、DevPlan 留 fresh `RLT-B-05`、七条旧事件转历史索引、新建 `design/evidence/06-交叉审核记录-RLT03阶段合同补充.md` 承载当前变化集证据，当前源版体检 0 失败、仅 R14 已知警告）。**该治理包经 Astra pane 终审为 `VERDICT=REVISE`（P0=0 / P1=0 / P2=2 / P3=0）；两项 P2 已按终审修正（E-084），并经原 Astra pane 定向复审判 `VERDICT=APPROVE`（P0=0 / P1=0 / P2=0 / P3=0，E-085）闭合：evidence/06 不再把主控派单的第三人称句写成用户逐字原话（改为「授权转述」并注明来源），且不再把批次/owner/任务索引的核验记到 E-072 名下（改归本轮 Astra 终审）；marker 绑定、结论与人类签名区未动。**完整收口体检已于本轮复跑并如实登记（E-086：54 tests OK、diff-check 0、两 Python hash 未变、dh-check 0 失败/1 警告、`dh gate` 唯一拦点=尚无 verify、R29 当前源 `issues=[]`）**，但 **releasePacket 展示版本仍未出新版**，展示版本 `RLT_03-E10-20260910-01`（E-078）继续 superseded，**在新展示版本发出并由用户明文确认前不得宣称 E10 可用**。这不推翻上述五路结论，也**不等于**用户已经签收：人类签名区保持未勾，DevPlan RLT_03 仍「进行中」，RLT_05 仍「未开始」；`b7f4ecc` 越界差分仍仅是一项不继承、不扩张 allowed-paths、且不伪称机械闸原本通过的一次性路径例外，且**不覆盖**本次新证据文件。

**E-088 当前覆盖（取代上段 E-086 时点的“尚未展示/未确认”状态）**：新版 releasePacket `RLT_03-E10-20260910-02` 已于 E-087 展示，用户先回复“认可”，继而明文“授权”执行精确收口包；人类签名区据此勾选。DevPlan RLT_03 在真实 verify SHA 回填前仍保持“进行中”，RLT_05 仍“未开始”。

**TDD 结论**：有效行为红、修复后绿与独立变异杀死证据均齐备；E-003 的导入错误已明确剔除，不作为有效红。最终有效单测证据以 E-052~E-054、E-057、E-063、E-065 为准。

**设计契约传导声明**：RLT_03 只实现 parser/lint、append-only ledger 与本卡状态机；RLT_05 完整 status/配置/Recipe、RLT_07 五阶段模板、RLT_09 运行中改计划（含 A120 表尾追加放宽）均**未实现**。A5 的命令边界、A128 的活跃解析核心与 A46/A72/A75 逐项、A129 的基础 lint 与阶段性放宽范围均以本批同步后的正式文本为准，本卡不再自带任何冲突口径。

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| RLT_03：合法 plan 可读、非法 plan fail closed | 临时目录生成合法/重复节点/坏 marker plan，逐一执行 `lint`、`status`、`add`，核退出码、stderr 与零写入 | E-008、E-018、E-045、E-052~E-054；E-071 | 满足：A5 命令边界已按 Astra 第 1 项落账（解析级退 3 / 已解析规则违反 lint 2、add-status 3 / 重复号归 A46）；E-071 独立真 CLI 五形态 × 三命令复核与 A46/A80 三方一致、拒绝路径零写入；一致性 E-072 `APPROVE` |
| RLT_03：账本只追加且 JSONL 可持续读取 | 连续 20 次 add 保存旧前缀 bytes；另以 U+0085/U+2028/U+2029 note 往返，再以无 LF/尾随空格末行验证 status/add 均拒绝且 bytes 不变 | E-013、E-052~E-054、E-057、E-058、E-065 | 满足：54 tests 全绿；F-043 判别器与最终字节变异复验均已闭合 |
| RLT_03：事件、attempt、agent 状态机与触发/关闭前置 fail closed | 真 CLI 执行 `plan_loaded → node_start → agent_launch → blocked → escalate → decision/user_decision → resume` 正反序列，逐项核 rc、HC-ID 与不落行 | E-040、E-052~E-054；Batch-4 验收矩阵 | 满足：代码轮 1 与代码轮 2（含 F-043 定向复验）均 APPROVE |
| 人验项：机器证足以支撑本地收口 | 用户查看五路复核、有效变异、合同边界与 releasePacket 后明文确认 | E-078（**已 superseded**）；本表与五路 review | **待人验（R29 已闭合、两项 Astra P2 已由原 pane 定向复审 `APPROVE` 闭合（E-085），完整收口体检已复跑并如实登记（E-086），但 releasePacket 展示版本未出新版、人类签名未勾；出新展示版本并由用户明文确认前不进入人验）**；AI 不代签 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | 节点号含 superseded 在内全计划唯一 | AI | Batch-4 矩阵 #1；E-045 | 是 |
| 2 | close 仅空或 `agent:<同节点已存在名字>` | AI | Batch-4 矩阵 #2；E-045、E-052~E-053 | 是 |
| 3 | depends_on 存在且无环 | AI | Batch-4 矩阵 #3；E-045 | 是 |
| 4 | 依赖 superseded 节点必拒；parser/lint 派生活跃计划时忽略 superseded（含/不含的结构与退出码对照），并逐项证明 A46/A72/A75 三个本卡例外；A120 仅作跨卡兼容引用，其表尾放宽与「两正四反」集成取证归 RLT_09 | AI | Batch-4 矩阵 #4；E-045；F-003（已 `resolved`） | 实现通过；A128 正文已收窄为「核心命题 + A46/A72/A75 逐项」，A120 归 RLT_09；E-071 判「A128 第四例外归属」CLOSED（含/不含 superseded 的活跃结构与退出码实测相等），一致性 E-072 `APPROVE` |
| 5 | 空节点或 agent 全 superseded 必拒 | AI | Batch-4 矩阵 #5；E-045 | 是 |
| 6 | stage 枚举、分组连续、stage_id/card/k 和同卡串行/跨卡并行正确。基础边界**先忽略 superseded 行**（superseded 行隔开的重现当前即通过），被其他**活跃** stage 隔断的重现按基础规则拒绝；合法同 stage 表尾追加的放宽与完整运行中追加的终态承诺保留，由 RLT_09/A120 实现取证 | AI | Batch-4 矩阵 #6；E-045；F-003（已 `resolved`） | 实现通过；A129 正文与 §3.5/§4.3/§4.5.4 已加阶段性交付注记；E-071 实测 superseded 隔行 `lint` rc=0 未削弱、活跃隔断报 A129、运行中追加终态承诺无缩水，一致性 E-072 `APPROVE` |
| 7 | parser/lint 拒绝 kickoff/verify-signoff node type | AI | Batch-4 矩阵 #7；E-044~E-045 | 是 |
| 8 | marker 四必需字段、固定双表、禁竖线、agent.node/重名/默认依赖成立；decision_mode 缺省为 auto 且仅 auto/consult | AI | Batch-4 矩阵 #8；E-045 | 是 |
| 9 | trigger 三态与引用校验成立，`on:done` 不得跨节点 | AI | Batch-4 矩阵 #9；E-045 | 是 |
| 10 | 连续 20 次 add 得 seq 1..20，无重复/覆盖，旧行字节不变，不生成临时文件，无锁 | AI | Batch-4 矩阵 #10；E-013/E-045 | 是 |
| 11 | 19 事件 fail closed、大小写严格、无 lower/casefold 枚举归一 | AI | Batch-4 矩阵 #11；E-045 | 是 |
| 12 | **解析级**失败（缺文件 / 缺 marker / 缺表头或表结构不合法）三命令退出 3；计划已解析但违反 lint 规则时 lint 退 2、add/status 退 3 且拒绝路径账本不增行；坏账本 status 退出 4；空账本与首行 plan_loaded 语义正确。节点号重复由 A46 负例取证 | AI | Batch-4 矩阵 #12；E-018/E-045；F-016（已 `resolved`） | 行为通过；A5 命令边界已落账（解析级失败三命令退 3；已解析后违反 lint 规则 lint 2、add/status 3；节点号重复归 A46）；E-071 真 CLI 探针逐形态确认，一致性 E-072 `APPROVE` |
| 13 | JSONL 每行固定七字段，agent 格式、配对键、attempt 每节点分配/跳号/重号校验正确，不含 pane ID | AI | Batch-4 矩阵 #13；E-045、E-052~E-053 | 是 |
| 14 | node/agent/event 入参与**四类**豁免（`orchestrator#`/`monitor#`/`planner-amend#`/`strategist#`，仅豁免「agent 名属于该节点 agent 表」这一条）、agent 状态机/终态封口、node_start/node_close/monitor_restart 时序正确 | AI | Batch-4 矩阵 #14；E-045、E-052~E-053 | 是 |
| 15 | 控制事件分类、升级链 agent 归属、on:done/on:blocked/依赖/node_start 前置和节点关闭双条件正确 | AI | Batch-4 矩阵 #15；E-040、E-052~E-054；E-065 A74 最终字节变异 | 是 |
| 16 | 错误仅进 stderr 且统一 `error: <code> <message>`；add 的 0/2/3/4 可复现 | AI | Batch-4 矩阵 #16；E-018/E-045、E-052~E-057；E-063/E-065 | 是 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者 | 稳定 ID | 覆盖态 | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RLT_03 任务卡全部机器验收语义 | unittest 正反例 + CLI 退出码/stdio + 追加 bytes/目录观测 | machine | RLT_03 | 等价覆盖 | 42 个 owned HC-ID 映射完整、有效变异转红且真实树全绿；正式合同无冲突 | 54 tests OK；代码轮 1/2、需求方向、lessons、一致性五路均 `APPROVE`；E-071 唯一 P1 已由 E-074 闭合，终审 E-075 确认 `APPROVE`。R29 规划事件阻塞已闭合：`design/01` fresh `RLT-A-05`、DevPlan fresh `RLT-B-05`、七条旧事件转历史索引、当前变化集证据落 `design/evidence/06-交叉审核记录-RLT03阶段合同补充.md`（E-083；当前源版体检 0 失败、仅 R14 已知警告）。Astra pane 终审 `VERDICT=REVISE`（P0=0 / P1=0 / P2=2 / P3=0），两项 P2 已修正（E-084），并经原 Astra pane 定向复审 `VERDICT=APPROVE`（P0=0 / P1=0 / P2=0 / P3=0）闭合（E-085）。**完整收口体检已复跑并如实登记（E-086：54 tests OK、`git diff --check` 0、两 Python SHA256 未变、dh-check 0 失败/1 警告、`dh gate` 唯一拦点=尚无 verify、R29 当前源 `issues=[]`）**；**releasePacket 展示版本尚未出新版**，本行结果在新展示版本发出并由用户明文确认前不可用于确认 | Linux worktree / Python 3 | design/01 验收表 + 五路独立 review | RLT_05/RLT_07/RLT_09 明确不实现 | v1 | test-runner + independent-reviewers | user-authorized-local |

**材料齐没齐**：[x]

> **当前口径（2026-09-10，E-081 → E-088）**：R29 规划事件闸已**闭合**——`design/01` 留 fresh `RLT-A-05`、DevPlan 留 fresh `RLT-B-05`，七条旧事件转普通历史索引，当前变化集证据落在新建 `design/evidence/06-交叉审核记录-RLT03阶段合同补充.md` 的四个显式锚点段；用户明确授权本精确治理包。**Astra pane 对该治理包的终审为 `VERDICT=REVISE`（P0=0 / P1=0 / P2=2 / P3=0）**，两项 P2 已按终审修正（E-084）：P2-1 把 evidence/06 的第三人称句改为「主控派单中的授权转述（非用户逐字原话）」并与用户直接原话分开登记；P2-2 把 E-072 的覆盖收窄为其报告自身记录，批次/owner/任务索引的「与 HEAD 一致」核验改归本轮 Astra 终审。**两项 P2 已由原 Astra pane 定向复审判 `VERDICT=APPROVE`（P0=0 / P1=0 / P2=0 / P3=0）闭合**（E-085）。完整收口体检 E-086 通过，随后新版 releasePacket `RLT_03-E10-20260910-02` 已于 E-087 展示；用户先回复“认可”，并在收到远端基线、RLT_02 WIP 与尾巴分流的精确执行包后明文回复“授权”（E-088）。**E11 已成立，风险账=0、人判结果项=0；当前进入已授权的 Issue/PR、CI、squash verify 与机械回填执行段。**

**as-built 更新了没**：[x]

→ 当前状态：**E11 已确认，远端收口包执行中；RLT_03 尚未合并/verify/销户，RLT_05 仍不开放**

---

## 人类签名区　✅ 仅凭用户对话确认解锁

本卡无业务人判结果项；收口时展示机器证 releasePacket，由用户确认是否执行本地收口授权包。AI 不得预勾。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| RLT_03 机器证可支撑本地收口 | 查看主控展示的测试、复核、变异点和边界证据 | heavy 五路复核收敛、有效单测改坏必红、全部机器项等价 pass | [x] 2026-09-10 用户确认 `RLT_03-E10-20260910-02` 并明文“授权”执行精确收口包 |
