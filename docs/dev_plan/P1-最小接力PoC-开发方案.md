# P1-最小接力 PoC 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:planning-event:v1 id=DHR-B-01 stage=B-new artifact=dev_plan/P1-最小接力PoC-开发方案.md review=../design/evidence/01-交叉审核记录-接力方案.md#review-b understanding=../design/evidence/01-交叉审核记录-接力方案.md#understanding-b -->

<!-- dh:status
汇报: 接力 PoC 三卡已完成两卡——契约层与确定性 Runner 都能一键复跑证明并已收口；最后一卡（接真实可见终端做实机演示）已于 2026-08-15 开工，先做终端后端 preflight 闸
现状: DHR_01 已完成（squash 0c0cc42）；DHR_02 已完成（squash f34e212）；DHR_03 进行中（用户"继续DHR3"授权·工作区 8 件套已落·主控 psmux 原语实测完成）
进行到: P1 ▸ 批次 2 DHR_03 ▸ 批0 终端后端 preflight（psmux 默认 + orca 原语级对比·A7 判据）
下一步: 主控亲跑 preflight 落 evidence → psmux 过闸后派 codex 施工批A（psmux adapter）/批B（宿主循环+agent 工具）→ 主控跑真实套件与两场 dogfood（decision 场景需用户在窗口回答一次）→ 两轮换人复核 → H1/H2 用户判
看什么: workspace/DHR_03/task_plan.md（K-1～K-15 决策 + 主控实测事实 S1～S6）+ workspace/DHR_03/progress.md + as-built/relay-runner.md
阻塞: 无（若 psmux preflight 任一判据 fail → 停"待环境"）
-->

## 0. B 方案审核与理解确认

- **事件类型**：B-新建（DHR-B-01 同一未落盘事件内修订）；不增删任务、不改依赖或状态，只收紧三卡验收契约。
- **审核记录**：[需求讨论与 A/B 交叉审核记录](../design/evidence/01-交叉审核记录-接力方案.md#review-b)，追加覆盖复审见[同文件修订段](../design/evidence/01-交叉审核记录-接力方案.md#review-b2)。
- **主会话裁决**：采纳转换矩阵、quota、fake adapter 边界、psmux 客观判据、脱敏与 H2 统计口径；人工回答不进入 Runner 控制面；退出使用宿主精确 handle 原语，不写死 `kill -TERM`。
- **讲解记录**：[B 讲解与理解确认](../design/evidence/01-交叉审核记录-接力方案.md#understanding-b)，本轮补充见[修订讲解](../design/evidence/01-交叉审核记录-接力方案.md#understanding-b2)。
- **理解问题**：decision 期间是否只冻结依赖节点、无依赖并行节点继续；用户回答后是否由原 session 自然继续、Runner 不再介入。
- **用户回答 / 解释**：2026-08-14 用户回答“可以”；采用非终态 checkpoint，Runner 不读取、转发回答或调用 resume。
- **调整与复审**：三卡顺序保持 `DHR_01 → DHR_02 → DHR_03`；A4 与三卡验收已联动，定向复审结论见审核记录。
- **用户确认**：已确认上述行为；本次确认不授权任何任务开工。
- **2026-08-15 P1 降级修订（用户对话确认）**：quota 识别/恢复通道降为 `interrupted_unknown` 兜底、A8 凭据 fixture 六类收窄为三类代表性、nonce 防重放仅冻结字段不做重放测试；设计文档同日同步修订，不增删任务、不改依赖。
- **2026-08-15 终端后端评估补充（用户拍板）**：DHR_03 开工前按 A7 同一判据对 orca 做一次 preflight 对比实测再定后端；psmux 为默认，orca 仅作纯终端宿主候选（编排仍归自有 Runner），改选须先修订设计决策 7。详见 DHR_03 实施提示。

## 1. 概述

- **交付什么 / 不含什么**：交付一个可重复验证、再用真实 `psmux` 演示的状态接力 PoC；不含完整 workspace→施工→并行 review→返工生产流水，不改现有 `dh-crew`。
- **承接设计**：[产品设计与验收](../design/01-产品设计与验收.md) · A1～A8 / H1～H2。
- **实施策略一句话**：先冻结权威与异常契约，再用 fake adapter 证明状态机，最后接真实可见终端，避免终端副作用掩盖状态错误。
- **任务前缀 / 模块 slug**：`DHR_` / `dh-relay`，verify scope=`dh-relay`。
- **批次**：批次 1=`DHR_01 → DHR_02`，得到可重复仿真；批次 2=`DHR_03`，得到第一个真实端到端演示。

## 2. 工程切分

### 2.1 实现单元

| 单元 | 职责 | 入口 / 主要文件 | 关联任务 |
|---|---|---|---|
| contracts | RelayPlan、authority、receipt、result/handoff、control event schema、机器可读穷举转换矩阵与脱敏规则 | `tools/relay/contracts/` | DHR_01 |
| replay fixtures | 正常、阻塞、挂起、迟到、半写、异常退出和可信事件夹具 | `tools/relay/tests/fixtures/` | DHR_01 / DHR_02 |
| Runner core | active-plan CAS、事件消费、合法转换、幂等和 fail-closed | `tools/relay/` | DHR_02 |
| terminal adapters | fake adapter 与真实 `psmux` adapter | `tools/relay/adapters/` | DHR_02 / DHR_03 |
| PoC evidence | 真实事件、状态快照、receipt、截图和人验剧本 | `docs/modules/dh-relay/workspace/` | DHR_03 |

### 2.2 复用与禁改边界

| 路径 | 禁改 / 扩展 / 新建 | 说明 |
|---|---|---|
| `docs/modules/dh-relay/` | 扩展 | 本模块唯一设计、计划与现场根 |
| `tools/relay/` | 新建 | PoC 代码候选根；开工时经 Code Scout 校准具体文件 |
| canonical runtime layout / `psmux` 通用原语 | 复用边界 | 可通过 adapter 调用，不复制或改写 `dh-crew` active state |
| `docs/modules/dh-crew/dev_plan/`、`workspace/`、active runtime | 禁改 | 新模块不得消费或投影旧模块状态 |
| 现有 dh-crew controller/loop 代码 | 禁改 | P1 不以“顺手复用”为名改旧控制器 |

## 3. 任务表

### 3.1 索引

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位（轻/标准） | 状态 | 依赖 | 工作区 | 验收时间 / verify SHA |
|---|---|---|---|---|---|---|
| DHR_01 | 冻结接力权威、双维状态与异常契约 | 标准 | 已完成 | - | [workspace/DHR_01/](../workspace/DHR_01/brief.md) | 2026-08-15 / squash 0c0cc42 · verify 见 `git log --grep="^verify(dh-relay): DHR_01"` |
| DHR_02 | 实现最小 Runner 与确定性 fake replay | 标准 | 已完成 | DHR_01 | [workspace/DHR_02/](../workspace/DHR_02/brief.md) | 2026-08-15 / squash f34e212 · verify 见 `git log --grep="^verify(dh-relay): DHR_02"` |
| DHR_03 | 接真实可见 psmux 并完成阻塞接力 dogfood | 标准 | 进行中 | DHR_02 | [workspace/DHR_03/](../workspace/DHR_03/brief.md) | |

### 3.2 任务卡

#### DHR_01

- **目标**：冻结 RelayPlan、双维状态、active authority、launch receipt、不可变 final result/handoff、可信控制事件、机器可读穷举转换矩阵与脱敏规则 v1 契约，并建立覆盖失败路径的 deterministic replay fixtures。
- **非目标**：不实现 Runner 主循环；不拉真实 agent；不决定完整 review 流水；不改现有 `dh-crew` 协议或状态。
- **验收口径**：
  - **机器证**：[产品设计与验收 A1](../design/01-产品设计与验收.md#61-ai-自动验收栏)：schema、固定枚举和机器可读穷举转换矩阵通过；每个合法边有正例、每个未列举边均失败，终端/业务两维任一非法时整体不推进。
  - **机器证**：[产品设计与验收 A2](../design/01-产品设计与验收.md#61-ai-自动验收栏)：plan/generation/attempt/launch/session 完整绑定，旧/重复/错版本结果夹具被拒。
  - **机器证**：[产品设计与验收 A4/A6](../design/01-产品设计与验收.md#61-ai-自动验收栏)：冻结 `decision_required` 非终态 checkpoint 与 final result 的边界；checkpoint 后只冻结依赖节点、无依赖并行节点继续，同一 authority/launch/session/attempt 的后续 checkpoint/final result 可更新投影，错 session/generation 与旧 attempt 均拒绝；Runner 不读取、转发人工回答，也不调用 resume；quota P1 降级为 `interrupted_unknown` 兜底，不实现独立可信恢复事件通道（目标形态再补）。
  - **机器证**：[产品设计与验收 A5/A6](../design/01-产品设计与验收.md#61-ai-自动验收栏)：`succeeded` 不等于完成；final result 不可改写；半写、坏 JSON、probe error、无进展和无结果退出均有反例夹具。
  - **机器证**：[产品设计与验收 A8](../design/01-产品设计与验收.md#61-ai-自动验收栏)：交接自足；credential-shaped detector 至少覆盖 `api_key/private_key/password` 三类代表性凭据（jwt/env_secret/bearer_token 等其余类别随目标形态补齐），命中值完整替换、不保留前缀，handoff/result/event/session-tail 任一 final 工件残留即失败；PII/内部主机名不纳入本卡 detector。
- **变更范围**：`tools/relay/contracts/`、`tools/relay/tests/`（fixtures + 契约测试套件 + 独立 runner `run-relay-tests.ps1`，不进 dh-crew `run-all`；2026-08-15 收口期同步字面：原写 `tests/fixtures/`，验收口径本就要求"由测试证明"，套件落 `tests/` 是其必然承载，非扩大到旧 controller/loop——见 workspace/DHR_01/findings F-010）、本卡 `workspace/DHR_01/`；开工 Code Scout 只可收窄，不得扩大到旧 controller/loop。
- **档位**：标准（接力状态与终端组件接线的基础契约）。
- **实施提示**：复用 canonical runtime 与精确 session 的安全原则；authority generation 在首个 active-plan CAS 成功时从 1 开始，proposal 不自带 generation；控制事件的 nonce/防重放仅冻结字段定义，P1 不做逐项重放攻击测试；冻结 `session_tail_max_bytes` 默认值与合法覆盖入口，处理顺序固定为先脱敏、再限长，session tail 只作诊断证据；Git snapshot 只含提交、changed paths 与 diff stat 元数据。

#### DHR_02

- **目标**：实现最小确定性 Runner core 与 fake terminal adapter，用可重放测试证明 CAS、receipt、幂等、暂停和异常 fail-closed。
- **非目标**：不接真实 `psmux`；不实现完整 review lead、并行 reviewer 或通用 DAG scheduler；不改 `dh-crew` 控制器。
- **验收口径**：
  - **机器证**：[产品设计与验收 A1/A2](../design/01-产品设计与验收.md#61-ai-自动验收栏)：Runner 只接受合法 active generation 和绑定结果，CAS 冲突/迟到/重复事件不推进。
  - **机器证**：[产品设计与验收 A3/A4](../design/01-产品设计与验收.md#61-ai-自动验收栏)：fake replay 跑通 blocked→replan proposal→B→fresh A，以及 decision checkpoint→依赖冻结/无依赖继续→同 session 后续 checkpoint/final result；断言 Runner 未调用输入或 resume 动作。
  - **机器证**：[产品设计与验收 A5](../design/01-产品设计与验收.md#61-ai-自动验收栏)：`succeeded + next_action=review` 后任务仍 active。
  - **机器证**：[产品设计与验收 A6](../design/01-产品设计与验收.md#61-ai-自动验收栏)：错版本、半写、坏结果、进程活但无进展、无可信 stop/quota 原因均 fail-closed。
- **fake adapter 行为契约**：实现 `launch/probe/suspend/resume/stop/emit_observation` 六个终端动词；消费 DHR_01 的 fixture/观测流，不修改 fixture、不持有业务状态、不判断代码质量。decision fixture 由同一 session 依次发出 `decision_required` 与后续 checkpoint/final result，adapter 不提供人工输入 API；测试断言 Runner 在两者之间没有调用 `resume`，并覆盖依赖节点冻结、无依赖并行节点继续、错身份后续结果拒绝。launch receipt 写入后进入 `launching`；在有界启动期限内未获得绑定 `running` 观测则转 `unknown`、追加 `launch_failed` 事件并停住。
- **变更范围**：`tools/relay/`、`tools/relay/adapters/fake*`、`tools/relay/tests/`、本卡 `workspace/DHR_02/`。
- **档位**：标准（组件接线与状态流转）。
- **实施提示**：Runner 不读代码质量；所有推进先验身份再验转换；事件追加与状态 CAS 必须可重放。
- **编排输入边界**：DHR_02 的初始/重编排 proposal 均由 fixture 提供，不拉真实编排 agent；真实一次性编排 agent 只在 DHR_03 dogfood 中验证。

#### DHR_03

- **目标**：接入真实 `psmux` adapter，自动打开可见、可交互 agent 终端，完成 dependency-blocked 重编排与 decision-required 挂起的真实 dogfood。
- **非目标**：不以“能看到窗口”替代精确退出证明；不支持普通 `wt` 降级宣称通过；不实现完整生产流水或自动人类决策。
- **验收口径**：
  - **机器证**：[产品设计与验收 A3](../design/01-产品设计与验收.md#61-ai-自动验收栏)：事件序列严格为 v1/A attempt1 blocked→handoff ack→exact exit→v2+B→B done→A attempt2 fresh；旧 A result 通过 Runner 真实摄入入口提交，保持内容合法但携带旧身份链，只产生 stale event，不用测试桩直接改 active state。
  - **机器证**：[产品设计与验收 A4](../design/01-产品设计与验收.md#61-ai-自动验收栏)：decision fixture 的原 session 保持可交互；用户在该 session 回答一次后 agent 自然继续，Runner 未读取/转发回答、未调用 resume；依赖节点在后续有效 checkpoint/result 前冻结，无依赖并行节点继续。要求用户再去 Runner 操作则 A4 失败。
  - **机器证**：[产品设计与验收 A7](../design/01-产品设计与验收.md#61-ai-自动验收栏)：`tools/relay/adapters/psmux*` 自己实现 `launch/probe/suspend/resume/stop/emit_observation`，可组合现有 psmux/tmux 原语但不假定旧 `tools/psmux-launch.ps1` 已提供完整 handle；preflight 证明 receipt.launch_id 与新 adapter 返回的完整唯一 session handle 1:1、界面 `visible=true` 且 `interactive=true`、probe 全值匹配，按该 handle 回收后在 evidence 记录的有界期限内确认为 `exited`。仅后台 session、PID/标题/前缀猜测或平台无关 stop 命令均失败。
  - **人判**：[产品设计与验收 H1/H2](../design/01-产品设计与验收.md#62-人类验收栏)：向用户展示真实截图、checkpoint/状态/receipt 时间线和未覆盖范围；decision 正常路径必须记录人工动作数=1，且时间线证明 Runner 未介入回答。对照表按统一口径记录用户显式确认/回答/重启动作数、面向用户的状态通知数，以及 blocked→fresh A 的可见步骤与事件 hop 数，由用户判断是否符合直觉、是否值得进入完整流水阶段。
- **变更范围**：`tools/relay/adapters/psmux*`、最小 dogfood fixture、`docs/modules/dh-relay/workspace/DHR_03/`；不得把凭据值写入任何证据。
- **档位**：标准（真实终端组件接线 + 交互人验）。
- **实施提示**：DHR_03 的第一道闸是 backend preflight：先证明 launch_id/完整 handle 1:1、visible+interactive、全值 probe 与按 handle 有界退出；失败则停在“待环境”，不进入 dogfood。后端选定（2026-08-15 用户定）：开工前用同一 A7 判据对 orca（仅作纯终端宿主候选）加跑一次 preflight 对比实测；psmux 为默认，orca 通过判据且体验更优时方可提议换后端，且须先修订设计决策 7 再实施。精确匹配唯一 session_id；截图与机读事件必须能互相对照。

### 3.3 标准档共同收口条件

每张卡进入“待验收”前必须：

- 有两轮独立换人复核：轮 1 全面排查，轮 2 fresh-context 对抗证伪。
- 有需求境证据；DHR_03 的交互必须有真实可见终端截图，单测不能替代。
- `dh dh-relay` 与该卡证据命令可复跑；P0/P1 清零。
- 只停在待人验，不由 AI 代签；用户明确确认后才允许 `verify(dh-relay):` 收口。

## 4. 覆盖、颗粒度与依赖查漏

| 检查 | 结论 |
|---|---|
| 覆盖 | A1～A8、H1～H2 全部至少由一张任务卡承接；DHR_01 冻结契约/矩阵/脱敏，DHR_02 证明 deterministic runner，DHR_03 证明真实 psmux 与人判；evidence 未参与拆计划 |
| 颗粒度 | DHR_01=契约验收单元，DHR_02=确定性 Runner 验收单元，DHR_03=真实终端人验单元；可分别开工和签收 |
| 依赖 | `DHR_01 → DHR_02 → DHR_03` 单链无环；真实终端不会先于状态契约开工 |

## 5. 计划完工

- [ ] DHR_01～DHR_03 全部销户，状态=已完成。
- [ ] fake replay 与真实 `psmux` 端到端证据可一键复跑/复查。
- [ ] A1～A8 机器项全部有等价 pass 证据。
- [ ] H1～H2 已向用户展示并由用户在对话中判断。
- [ ] 交付明确标注“状态接力 PoC”，不宣传为完整生产编排。
