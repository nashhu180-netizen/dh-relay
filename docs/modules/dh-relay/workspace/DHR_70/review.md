<!-- dh:v1 · review.md — 验收。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_70

## 独立复核区

本卡任务类型为 **heavy**。施工者不得复核自己的卡；代码轮 1、代码轮 2、需求、教训、一致性五路均由未参与施工的独立实例完成。第二轮复核实例负责选择并登记有效变异点。

**第一轮·批次小审合集**（本卡不分批，收口时跑完整轮 1）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|---|---|---|---|---|
| | 全 diff、A1/A2/A3/B/C/D 逐条、越界、**单写者是否被放宽**、是否黏旧进程 | | | |

**第二轮·增量复核**（另派 fresh-context，不继承轮 1 会话）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|---|---|---|---|---|---|
| | 全程 + 轮 1 记录 + 增量 diff + 变异点选点 | | | | |

**有效单测·变异点登记**（重核卡：必须由轮 2 实例选点，施工方自报即红）

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人(重核须=轮2实例) | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| <待收口填> | <待收口填> | | <待收口填> | <待收口填> | <待收口填> | <待收口填> | <待收口填> | |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|---|---|---|---|
| 1 | | | |

**需求复核结论**：｜证据(E-xxx)｜由 ｜派出=

**教训复核结论**：｜命中条目｜由 ｜派出=

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_70 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| 提交路由「当前持 lease 的 actor」 | `submitExecutorResult` 首轮 drivers 循环 vs durable 重建循环 vs `commitReceipt` / `stopDriver` 各自的 actor 取用 | | | |
| `actor-closed` / `lease-lost` 的拒绝语义 | `host.mjs` `refuseIfClosed`、Store `writeGuard`、service 的 `withReason` 映射 | | | |
| gate 注册与本届 driver 生命周期 | `registerSubmissionGate` 调用点（bootstrap / commitReceipt 后 / 重建路径） | | | |
| 「恰一条 Result」与幂等 | DHR_64 既有 Result bridge 断言 vs 本卡 A2 重投断言 | | | |
| 允许路径 vs 实际 diff | DevPlan `dh:allowed-paths:v1 task=DHR_70` vs `git diff --name-only` | | | |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：
- 尚未施工，无实现信心声明。

**设计契约传导声明**：
- 契约无变化：本卡修实现以兑现 design/12 已冻结的 P6-RI-A1/A3 与「Gate 生命周期」语义，不改 Receipt/Result/RPC 合同、reason code 表与 Store mutation 语义。

**需求对齐证据**（本卡无人判项；机器证用受控夹具跑真实 service/driver）：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| P6-RI-A1：非终态 + current Receipt 的晚交能落地 | lease 仍有效的晚交（A1）与旧 actor 已死后的重建补交（A2） | E-7002 | 待人验 |
| P6-RI-A3：无合法 lease 一律不改账 | 真 lease-lost / 非 current Receipt / 已终态 三条负例（A3） | E-7003 | 待人验 |
| DHR_35 E-3526 形态 | `agent_get=idle` ∧ `pane_get=error` 不得单独判 `E_EXECUTOR_HOST_LOST`（C） | E-7004 | 待人验 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---|---|---|---|
| A1 | lease 仍然有效、Receipt 仍 current、节点非终态 → 晚交（含 driver 本届 herdr 等待已结束）必须得到 committed Ack + `relay.result/v2`（`structured.source=receipt-bound-submission/v1`）。 | machine | | |
| A2 | 旧 actor 已结束或已失租、Run 非终态、Receipt 仍 current → 旧 actor 对提交拒绝且零 mutation；service 新取 lease、新 actor、重建 gate 后提交恰好一个 Result；同 digest 重投幂等。 | machine | | |
| A3 | 无法合法取得当前 lease（真 lease-lost / 非 current Receipt / 已终态）→ 保持拒绝、零 mutation。禁止为修 `actor-closed` 放宽单写者。 | machine | | |
| B | 未知 Receipt / 终态冲突仍按现役拒绝或幂等，不因改 gate 而变。 | machine | | |
| C | `agent_get=idle` ∧ `pane_get=error`（对齐 E-3526 观测）**不得单独**把 Attempt 写成 `E_EXECUTOR_HOST_LOST` 终态；提交走 A1 或 A2。 | machine | | |
| D | 定向套件可复跑；`git diff --name-only` 不越 DevPlan 逐条允许路径。 | machine | | |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| lease 有效时的晚交必须落地 | 非终态 Run + current Receipt + 本届等待已结束的提交 | machine | DHR_70-A1 | | committed Ack；`relay.result/v2` 恰 1 条；`structured.source=receipt-bound-submission/v1` | | 本地 Node · Windows | Store 事件 + Ack | 不跑真实 Agent | design/12 P6-RI-A1 | service/driver tests | 自动化 |
| 旧 actor 已死时由新持 lease actor 重建后补交 | 令旧 actor 失租或结束后提交 | machine | DHR_70-A2 | | 旧 actor 零 mutation；新 lease/新 actor/新 gate；Result 恰 1 条；同 digest 重投不新增 | | 本地 Node | Store 事件 + lease epoch | 不要求打到写 Receipt 的那一届进程 | design/12 Gate 生命周期 | service tests | 自动化 |
| 无合法 lease 一律拒绝且零 mutation | 真 lease-lost / 非 current Receipt / 已终态 三负例 | machine | DHR_70-A3 | | 拒绝码不变；Store 无任何新事件 | | 本地 Node | Store 事件计数 | 无 | design/12 P6-RI-A3 | service tests | 自动化 |
| 未知 Receipt 与终态冲突行为不变 | 现役基线负例回归 | machine | DHR_70-B | | 与 master 基线逐条同结果 | | 本地 Node | DHR_64 既有断言 | 无 | design/12 | service tests | 自动化 |
| pane_get=error 不单独判死 Attempt | fake：agent idle + paneGet 失败 | machine | DHR_70-C | | 无 `E_EXECUTOR_HOST_LOST` 终态；提交仍走 A1/A2 | | 本地 Node | driver 事件序列 | 真实 pane error 形态不由本卡取证 | DHR_35 E-3526 | driver tests | 自动化 |
| 定向套件可复跑且不越界 | 复跑命令 + `git diff --name-only` 比对 | machine | DHR_70-D | | 套件可复跑；diff ⊆ 允许路径 | | 本地 Node · git | `dh:allowed-paths:v1 task=DHR_70` | 无 | DevPlan | 脚本 | 自动化 |

**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|---|---|---|---|---|---|---|
| 无 | | | | | | |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [ ]
**as-built 更新了没**：本批触及的子系统，其 `as-built/relay-core.md` 已覆盖更新到最新现状？ [ ]

→ 当前状态：**进行中（D-start）**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

本卡六条完成条件**均为机器证**，无人判结果项（H=0）。E11 仍需对话确认本地收口授权包。没有对话确认，AI 不得碰本区。

### 目的一：证明 Claude 那条交不进去的 Result 现在能交进去，且没把锁拆了（覆盖 A1/A2/A3/B/C）

本工作区交付：非终态时提交权保持 + 合法重建（待挂证据）。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| （无人判项）查看机器证包 | 看 E10 展示的定向测试、事件序列与越界自查 | 六条机器证均有等价 pass；A3 三条负例仍绿 | [ ] |

- 确认记录：
- verify 提交 SHA：
- 签名：hyf（<chat-confirm 代签 / 本人敲 git>）　　时间：

### 确认记录（append-only）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---|---|---|---|---|---|---|
