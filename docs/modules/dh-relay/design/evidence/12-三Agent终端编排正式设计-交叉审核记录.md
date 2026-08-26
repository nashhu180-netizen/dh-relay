# 三 Agent 终端编排正式设计 · 交叉审核记录

> 状态：A-full 设计事件 `DHR-A-15` 的复核与理解证据。正式设计候选位于 `design/drafts/09-三Agent可交互终端与CLI优先编排-产品设计与验收.md`；用户整版确认前不进入正式 `designInputs`。

<a id="review-a15"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-15 artifact=design/09-三Agent可交互终端与CLI优先编排-产品设计与验收.md kind=review -->

## A-15 · fresh-context 审核与裁决（2026-08-25）

### 复核方式与隔离

- 基线 HEAD：`29b1d66`。
- 独立复核者：fresh-context 只读 review brief，不参与草拟；对话委派采用侦测型降级、非机器只读。
- 复核范围：候选 09、现行 01/02/05/06、evidence/11、README、acceptance mapping，以及 DHR_30 独立 worktree 中的 07/08。
- 写入核对：复核者未修改文件；复核前后均只有主会话新增/修订的候选稿和本审核记录。
- 当前候选 SHA-256：`146a84788540494cade99eda4f786fc9b19d40dc72497e3769d5c558ef32c58e`。

### 第一轮全面复核

结论：无 Blocker；5 High、1 Medium。`handoff_ready` 已明确只表示交接材料齐全，本轮未发现它暗中承担代码质量验收。

| 级别 | Finding | 主会话裁决与修订 |
|---|---|---|
| High | 产品 Runner 与 DHR_30 actor 都写“唯一写者”，工程分层和 CLI 映射不闭合 | 采纳。新增 Runtime Broker/Workflow Engine/Launcher 分层；actor 是物理 Store 唯一写者，Workflow Engine 是业务转换唯一裁决者；`continue` 留后续合同 |
| High | 01/02 仍是正式输入，却与长期编排 Agent、Herdr 三终端和持久交互冲突 | 采纳并扩大冻结边界。01/02/05/06 全部退出新 `designInputs`；稳定约束在候选 §13.2 重述，冲突口径逐项 supersede |
| High | Monitor/Executor 终端中的用户输入没有持久、可恢复事实 | 采纳。新增 `interaction_record`，影响执行前必须 ack；范围/权限/计划/人验统一升级为 Attention/Approval Receipt |
| High | final Result 已冻结，却允许 `continue_working` 回原 Attempt 修改 | 采纳。改为不可变 candidate revision → Monitor Report → 唯一 final Result；补交只产生新 revision |
| High | `HC-CTRL` 验收迁移无法由 v1 mapping 表达 | 采纳。active ID 在新设计逐条重述并迁移 mapping；冻结 ID 从 active mapping 移除，完整历史状态放决策记录；不擅改 mapping Schema |
| Medium | Pair 部分启动和丢失只有策略表，没有持久 phase/补偿 Receipt | 采纳。新增 Pair 状态机、recovery key、fresh_attempt_from、Monitor replacement 和异常收口规则 |

### 第二轮定向复审

复核者只复看上述六项和对应机器验收，结论：**无 Blocker/High，可以进入用户整版确认**。确认以下边界已经闭合：

1. DHR_30 当前卡不新增 workflow、Pair、Launcher 或 `continue`；后续 Workflow Engine 也不能绕 actor 直写。
2. 01/02/05/06 冻结，现役不变量和 active/frozen acceptance 去向可区分。
3. 三终端输入有持久引用、权限升级和弱身份登记。
4. candidate revision 消除了 Result 覆盖矛盾。
5. Pair crash/replay 和孤儿回收可机判。
6. `HC-3AT-A3/A4/A7/A15/A16` 与上述合同对应。

定向复审另报两项 Medium，主会话已在进入理解确认前修正：

| Finding | 修正 |
|---|---|
| 已冻结 `CTRL H5` 一处旧句仍称“保留历史 mapping” | 删除矛盾句；active JSON 必须移除该行，历史 tuple 只留决策记录 |
| “扩展 `relay.client-read-model/v1`”可能被理解为在 strict v1 加字段 | 改为 v1 永不修改；后续新增 `relay.client-read-model/v2` 和 versioned RPC/capability，旧客户端继续读 v1 |

### 用户澄清与第三、四、五轮定向复审

用户指出第一轮为补审计而加入的通用 `interaction_record` 属过度设计，并进一步明确：

1. 三个终端里的普通聊天不需要分类、标记或逐句更新状态。
2. Executor 是当前节点的主控 Worker，不是机械服从 brief 的低权限子 Agent。
3. Executor 可以自主调整节点内实现方法，也可以发现并起草 brief 修订；涉及 RelayPlan/合同字段时应主动与编排 Agent交互。
4. 编排 Agent继续负责管理 RelayPlan；用户在任意终端提出变化时，编排 Agent应带着上下文主动接手，用户不需要重复。
5. 只有最终生效的计划/brief 版本、正式权限决定和人验进入运行账。

用户随后答复“可以，把文档更新下”，授权按上述理解修订候选稿。主会话删除 `non_authoritative`/通用 `interaction_record`，新增 brief 两层修改权、Agent 间计划变更协商、编排 Agent主动消息和对应 A/H 验收。

第三轮定向复审结论：无 Blocker/High；唯一 Medium 是“编排 Agent离线时，待处理的计划修订上下文无持久接力路径”。主会话补充窄用途 `plan_change_request` Attention：仅保存问题、影响、证据、候选改法和目标 generation；它不保存聊天、不让候选生效，受影响工作暂停，编排 Agent恢复后消费并结案。

第四轮极窄复审结论：上述 Medium 已闭合；普通聊天仍不入账、候选不生效、只有发布并原子切换后的有效版本生效。**无 Blocker/High/Medium，可以进入用户整版确认。**

用户随后追问“离线”具体指什么、编排 Agent意外退出时哪一个剩余终端显示提醒，并补充：除非人为误关或单进程异常，现实中更可能是 Herdr/终端宿主或机器故障导致三个 Agent一起失联。主会话据此把故障口径改为：

1. `detached` 只表示视图断开，Agent/Pane 仍活着，不触发恢复。
2. `single_agent_lost` 是补充路径；只有编排 Agent单实例丢失时，仍在线的 Monitor 和 Executor 两个终端才显示系统提醒，并允许窄用途 `plan_change_request` 接力。
3. `host_generation_lost` 是主要非人为故障路径；三终端同时消失，当下不存在“剩余终端提醒”。
4. Runtime/Launcher 只做 Host/Receipt/Pair 对账和机械重拉起，先恢复编排 Agent；跨节点判断仍由恢复后的编排 Agent承担。
5. 用户通过受控 stop 明确停止时不自动重拉起；没有 stop Receipt 的直接杀 Pane 按意外退出处理。

第五轮极窄复审只核对上述故障分类、共同恢复、权限边界、`plan_change_request` 限定和 A/H 验收。结论：**Blocker/High/Medium/Low 均无，可以进入用户整版确认。**

### 主会话最终裁决

- 第一轮 5 High + 1 Medium 先按审核建议修订；其中通用 `interaction_record` 后被用户业务澄清推翻并删除，改为只持久化最终有效版本和离线 `plan_change_request` 窄接力。
- 第二轮 2 Medium 全采纳并修正。
- 第三轮 1 Medium 全采纳；第四轮定向复审已收敛。用户补充共同故障口径后，第五轮定向复审也已收敛。
- 不采纳“给 mapping v1 增 status 字段”的潜在做法：现役 validator 不接受该 Schema 变化；使用 active mapping + 历史决策记录能在不改 dev-harness 工具链的情况下闭合。
- 设计候选可以进入用户整版讲解与一次理解确认；在确认前不晋升、不冻结旧文档正文、不改 DevPlan、不启动开发卡。

<a id="understanding-a15"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-15 artifact=design/09-三Agent可交互终端与CLI优先编排-产品设计与验收.md kind=understanding -->

## 用户理解、问答与确认

### 整版讲解摘要

1. 用户面对三个都可交互的 Agent 终端；Runner 只是编排 Agent背后的 CLI/确定性程序，没有第四个 Agent终端。
2. Monitor 只根据既有 brief 和结构化证据监督进度、显性跑偏及交付完整性，不承担开放式代码质量复核。
3. Executor 先交 candidate；Monitor 可要求在同一范围补齐并生成新 revision；`handoff_ready` 后才交唯一 final Result。
4. 正式复核仍是单独节点，该节点的 Executor 才是 reviewer；Monitor 不计入两轮独立复核。
5. 非人为故障的主路径是三个 Agent随宿主共同失联：Runtime依据持久事实先恢复编排 Agent，再决定当前节点；单独掉编排 Agent只是补充路径，当前 Pair 可继续并收口，但下一节点仍只置 `ready`。
6. 01/02/05/06 全部冻结为历史输入；稳定安全/流程约束在新设计重述，DHR_30 的 07/08 技术合同继续独立生效。
7. 普通聊天不进入 Run Store；Executor 是节点主控并可自主维护工作字段，合同字段变化由它/Monitor 主动带上下文与编排 Agent协商。
8. 只有编排 Agent单实例意外退出且节点 Pair 仍在线时，才用 `plan_change_request` 接力计划问题；共同失联时只能依赖故障前持久事实，RelayPlan 仍由恢复后的编排 Agent管控。

### 一次理解问题

待用户整版确认：**三个 Agent通常随宿主一起故障；Runner负责保存事实和机械恢复，先拉起编排 Agent，但永远不独立扮演编排者或擅自跨节点。**

### 用户回答与最终状态

用户已确认“普通聊天不记账、Executor 是节点主控、RelayPlan 变化与编排 Agent交互”，并确认“非人为故障更可能三 Agent共同失联”的局部修订，已授权更新候选稿；整版最终确认前，主会话不得执行 formal input 原子晋升、旧方案冻结标记和 mapping/决策记录迁移；该确认仍不授权 B-adjust 或开发卡开工。

## 2026-08-26 追加澄清与第六轮定向复审

用户在整版确认前继续补充三项产品前提：

1. dev-harness 已把复核拆为代码轮1、代码轮2、需求方向、一致性和教训等路径；用户要求配置的是“每条复核路径由哪个 Agent/Profile 执行”，不是让 Profile 决定是否跳过必做复核。
2. repo-local Relay 目录希望从默认隐藏的 `.dh-relay` 改为可见 `dh_relay`，以便计划和长期归档由 Git 管理；高频运行现场不能因此进入 Git。
3. 三个 Agent 能方便自由地互相联系是本方案成立的重要前提。用户确认其业务语义是：Agent 可按角色主动发消息并获得可靠的投递/回复反馈；普通交流不成为业务事件账，只有真正影响执行或形成正式结论的内容才升级为权威工件。

主会话据此修订候选：

- 增加 Review Recipe / Reviewer Binding 两层模型，按 `task_type` 冻结必做路径，再逐路绑定 Profile；缺路径能力、只读约束或 fresh 隔离时启动失败，Monitor 不计入复核。
- 增加 Runner Message Router，按逻辑角色寻址，提供 `accepted/delivered/replied` 和有界忙碌队列；Agent 不获得任意 Herdr Pane 输入权，普通消息不进入 Run Store/Read Model。
- 新 repo-local 布局为 tracked `dh_relay/plans/`、`dh_relay/archive/` 与 ignored `dh_relay/runtime/`；计划源变更不直接改变 active generation，旧 `.dh-relay`/`.dh-runtime/relay` 不原地搬迁，用户级 `~/.dh-relay/` 不变。
- 将目录迁移、Message Router 和 Review Recipe/Profile 路由明确列为 DHR_30 之外的后续 B-adjust 卡，不扩大当前 worktree。
- 按 A-full 查漏清单补上持久产物退场合同：`plans/archive` 不由 Runner 自动删除，终态 `runtime/<run_id>` 满足归档与保留期后才精确清理，失败产生 `cleanup_failed` Attention；吸收教训候选-8/15，要求清理探针位于被删目录外，消息校验与投递使用同一不可变快照。

第六轮复审仅核对上述三项合同、旧口径替换、DHR_30 边界以及 `HC-3AT-A19～A21/H1/H5`。结论为无 Blocker/High，2 Medium：

| Finding | 主会话裁决与修订 |
|---|---|
| Recipe 路数正确，但未保留 `lessons-absent` N/A 和 normal 的会话内登记语义；统一要求“每路 Pair + Binding”会让库空误阻断、常规卡变重 | 采纳。Resolved Work Item 新增 applicability 与 `dedicated_pair/inline_registration`；N/A 有冻结依据但不拉 Pair/不要求 Binding，normal/light 默认保留上游 inline，用户可显式升级 dedicated；每路结论仍独立 |
| AGENTS、`.gitignore` 和 resolver 仍是旧根/旧复核口径，§14 只有“以后同步”而无启用闸 | 采纳并设硬顺序：正式晋升同批同步 AGENTS 与精确 `/dh_relay/runtime/` ignore，未同步禁止 B-adjust；resolver 迁移卡通过 A19/A22 前禁止新根 start，旧根继续按旧合同运行 |

复核者已确认 Message Router、A19/A20/A22、H1/H5、DHR_30 边界和旧口径替换除此之外均闭合。上述两项完成后进入一次极窄复审。

极窄复审结论：**Blocker/High/Medium/Low 均无，可以进入用户整版确认**。复核者确认：

1. §3.4/§6.1 与 A8/A21/H5 已区分 Recipe、Applicability、Execution Mode、Binding；库空 N/A 不误阻断，normal/light 默认 inline，dedicated 才拉 Pair，独立/fresh 路径不能被降级。
2. §13.1/§14/§15 已把 AGENTS/`.gitignore` 同批同步、未同步禁止 B-adjust、resolver 未验收禁止新根 start、旧根继续现役全部设成硬闸。

本轮复审冻结的候选 SHA-256：`e9390b096b51ca932ad5d4ca29855ec83044c6847bdc95608f8f5da778ddcce0`。

### 整版确认与晋升结果

2026-08-26，用户在对话中明文确认“确认吧”。主会话据此将候选原子晋升为当时的正式输入；该形成稿后来被design/10取代，现归档于`design/archive/09-三Agent可交互终端与CLI优先编排-产品设计与验收.md`。当时同批完成README白名单、旧方案冻结标记、活跃验收映射、决策记录、AGENTS与`.gitignore`同步。

该确认**不授权** B-adjust、resolver 迁移、新根 start、DHR_30 扩范围或任何开发卡开工。

<a id="review-a16"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-16 artifact=design/records/01-三Agent终端编排-正式晋升决策记录.md kind=review -->

## A-16 · 正式晋升决策记录核对

该记录是 A-15 §13.1、§13.4、§13.5 已审内容的同批落点，不引入新的目标、范围、验收或任务拆分。第六轮已独立核对旧口径替换与活跃 mapping；本次只将其分为 retained/superseded/deferred/historical，并确认活跃 mapping 只保留 09 实际承载的 legacy canonical ID。未发现新增问题。

<a id="understanding-a16"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-16 artifact=design/records/01-三Agent终端编排-正式晋升决策记录.md kind=understanding -->

用户在 2026-08-26 对整版设计明文确认“确认吧”，确认范围包含 A-15 §13.1 要求的决策记录与活跃映射迁移。本记录只落实该已确认决定；不授权 B-adjust 或任何开发。
