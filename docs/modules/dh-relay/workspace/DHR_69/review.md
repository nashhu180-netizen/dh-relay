<!-- dh:v1 -->
# DHR_69 · Review

## 独立复核区

本卡任务类型为 **heavy**。施工者不得复核自己的卡；代码轮 1、代码轮 2、需求、教训、一致性五路均由未参与施工的独立实例完成。第二轮复核实例负责选择并登记有效变异点。

**第一轮·批次小审合集**（本卡不分批，收口时跑完整轮 1）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| | 全 diff、A/B/C/D/E/F 逐条、越界、recovery 发送时机 | | | |

**第二轮·增量复核**（另派 fresh-context，不继承轮 1 会话）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| | 全程 + 轮 1 记录 + 增量 diff + 变异点选点 | | | | |

**有效单测·变异点登记**（重核卡：必须由轮 2 实例选点，施工方自报即红）

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人(重核须=轮2实例) | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| <待收口填> | <待收口填> | | <待收口填> | <待收口填> | <待收口填> | <待收口填> | <待收口填> | |

**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 1 | | | |

**需求复核结论**：｜证据(E-xxx)｜由 ｜派出=
**教训复核结论**：｜命中条目｜由 ｜派出=

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_69 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| 假就绪判定（idle∧blocked → 派生 blocked） | DevPlan §3.2、brief、`observeHerdrAgent`、driver 轮询/recovery | | | |
| `detail` 三键 + `conflict_escalation` | `observationDetail`、host_observation_changed、升级 Attention、task_plan 冻结键 | | | |
| 「恰补发一次」届内限制 | F-6807 并入口径、`instructionPending`、一致性文字登记 | | | |
| Codex `agent_not_ready` 负例不变 | DHR_68/C 测试、本卡 A 负例 | | | |
| 允许路径 vs 实际 diff | DevPlan `dh:allowed-paths:v1 task=DHR_69` vs `git diff --name-only` | | | |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：
- 尚未施工，无实现信心声明。

**设计契约传导声明**：
- 契约无变化：本卡修实现以兑现 design/06 H1/H5 与 B-33 已确认语义，不改 Receipt/Result/Store/RPC/contracts，不新增协议 reason code。

**需求对齐证据**（本卡无人判项；机器证用 fake 夹具跑真实 driver）：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| design/06 H1/H5：假就绪仍形成一次人工暂停 | fake：agent idle + pane blocked → 事件序列、节点 waiting_human、指令扣住 | | |
| B-33 轮询期错误归因 | 中途假 idle 不得写 `E_EXECUTOR_RESULT_MISSING` | | |
| F-6807 recovery 先观测 | 恢复届 blocked 时不先发指令 | | |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---|---|---|---|
| A | 夹具令 `agent start` 返回 exit 0、`agent get`=`idle`、`pane get`=`blocked` → adapter 返回 `launch_blocked=true` 且保留 handle、不关 pane、不额外创建 Attempt/Result；driver **不发**提交指令、**恰写一次**带 blocked 观测的 `human_input_requested`、不写 `E_EXECUTOR_HOST_LOST`。Codex 既有 `agent_not_ready` 路径的 argv 与行为**逐字不变**（负例断言）。承接 design/06 H1/H5。 | machine | | |
| B | 启动正常、中途转为假 `idle`（`pane get`=`blocked`）→ **不得**落进 `done\|\|idle` 分支、**不得**写 `E_EXECUTOR_RESULT_MISSING`、**不得**结束 Attempt；须走 blocked 分支并恰写一条 `human_input_requested`。 | machine | | |
| C | 恢复到假 `idle` / 真 `blocked` 的 agent → 发提交指令**之前**先做一次观测；观测为 blocked 时扣住指令走人工暂停，离开 blocked 后**在同一 driver 届内恰补发一次**。口径显式收窄到"届内"。 | machine | | |
| D | `host_observation_changed` 同时留下 `agent get` 原始值、`pane get` 原始值与派生结论三者；仅在 `agent get`=`idle` 时才发起 `pane get`（`working`/`done`/`unknown` 三态下 `pane get` 调用次数断言为 0）。三者编码进 `detail` 受控键。 | machine | | |
| E | E-1 可复跑只读 shape probe（普通 shell pane，不启动产品 Agent）+ E-2 fake `paneGet` 按 E-1 实测形态返回。`blocked` 取值以 evidence/32 §2 为事实基准。 | machine | | |
| F | `idle`∧`blocked` 持续超过 T=60_000 ms → 指令始终未发；初始 Attention 恰一条；超时后恰一条可区分升级 Attention（`conflict_escalation=idle_blocked`，reason 留空）；两信号恢复一致后恰补发一次；不得改信 `agent get` 放行、不得自动判节点失败。 | machine | | |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| 启动期假就绪仍 launch_blocked 并人工暂停；Codex agent_not_ready 不变 | fake Claude idle+pane blocked 的 launch/driver 事件序列 + Codex 负例 | machine | DHR_69-A | | launch_blocked=true、handle 保留、paneKills=0、Attention 恰 1 且三键正确、sent=0、无 HOST_LOST；Codex 负例 argv/行为不变且 paneGets=0 | | 本地 Node · Windows | fake 调用账本 + Store 事件 | 不跑真实 Claude；blocked 取值不由 E-1 取 | design/06 H1/H5 | adapter+driver tests | 自动化 |
| 轮询期假 idle 不得误判 RESULT_MISSING | fake 中途切换 idle+blocked | machine | DHR_69-B | | 无 E_EXECUTOR_RESULT_MISSING、Attempt 未结束、走 blocked Attention | | 本地 Node | Store 事件清单 | 真实中途信任框 | B-33 | driver tests | 自动化 |
| recovery 先观测再决定发送；届内恰补发一次 | recoveryFixture 假就绪 | machine | DHR_69-C | | blocked 期间 sent=0；离开 blocked 后 sent=1 | | 本地 Node | fake.sent + 事件 | 跨 driver 重启重复发送是已知限制 | F-6807 | driver tests | 自动化 |
| 观测留痕三键且非 idle 不读 pane | 解析 detail + paneGets 计数 | machine | DHR_69-D | | 三键可解析；working/done/unknown 的 paneGets=0 | | 本地 Node | fake.paneGets | 无 | B-33 | adapter tests | 自动化 |
| fake paneGet 形态对齐真实普通 pane | E-1 JSON oracle + fake 字段路径 | machine | DHR_69-E | | probe 可复跑；fake 含相同 agent_status 路径 | | 本地 Node · herdr | E-1 JSON | blocked 取值不由 probe 取 | DHR_68/D | shape probe | 自动化 |
| 持续不一致可见升级，不自动放行/失败 | 短 T 的粘性 mismatch 夹具 | machine | DHR_69-F | | 初始 Attention=1、升级=1 且键为 idle_blocked、reason 空、sent=0、非 failed；恢复后 sent=1 | | 本地 Node | 事件+sent+node status | T 生产默认 60s，测试用入参缩短 | B-33 | driver tests | 自动化 |

**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| 无 | | | | | | |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [ ]
**as-built 更新了没**：本批触及的子系统，其 `as-built/<子系统>.md` 已覆盖更新到最新现状？（没动子系统现状可 N/A） [ ]

→ 当前状态：**进行中（D-start）**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

本卡六条完成条件**均为机器证**，无人判结果项（H=0）。收口按 G14 走双谓词，E11 仍需对话确认本地收口授权包。没有对话确认，AI 不得碰本区。

### 目的一：证明假就绪会停下来等你按，按完接着干（覆盖机器证 A/B/C/F）

本工作区交付：观测层交叉核对 + 三时点人工暂停（待挂证据）。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| （无人判项）查看机器证包 | 看 E10 展示的定向测试与事件序列 | 六条机器证均有等价 pass | [ ] |

- 确认记录：
- verify 提交 SHA：
- 签名：hyf（<chat-confirm 代签 / 本人敲 git>）　　时间：

### 确认记录（append-only）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| | | | | | | |
