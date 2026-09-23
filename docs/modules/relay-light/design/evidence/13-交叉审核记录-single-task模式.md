<!-- dh:v1 · RLT-A-13 / RLT-B-09 交叉审核与确认形成史 -->
# RLT-A-13 / RLT-B-09 · single-task 模式交叉审核记录

## 一、事件身份与证据边界

- GitHub Issue：#56。
- 规划编号：`RLT-A-13`（A12 已为 RLT_25 预留）、`RLT-B-09`；任务卡 `RLT_29`。
- 档位：标准档；高危类型：组件接线；`task_type=heavy`。
- 用户确认日期：2026-09-22。
- 本文件忠实登记本次派单明确给出的产品合同、审核结论与用户确认摘要。上游三轮 fresh reviewer 的逐字会话、实例名、模型和完整原始报告未随派单提供，因此不编造这些字段；可核查结论仅按用户提供的形成史记录。

## 二、已确认产品合同

1. `single-task` 与完整 relay 并列、互斥；不创建/读写 `relay_plan.md`、`relay_log.jsonl`，不使用 W/C/R/X/F，完整模式零回归。
2. 一任务一 Herdr workspace，每角色实例一独立具名 agent tab/pane；orchestrator 只分发与按 durable signal 路由。
3. 生命周期为 workspace/task_plan → plan review → 分批开发+batch review → 按 `task_type` 展开的开发后全量复核 → 主会话人验；逐批复核与 final review 是两道独立闸。
4. 模型/推理档由用户启动时逐角色选择，协议不写死；`execution_strategy.md` 保存角色、模型、实例、tab/pane 快照。最大工具权限不扩张 commit/push/PR/merge/deploy/verify/人验授权。
5. plan/batch review 各最多整改 2 轮：FAIL 回同 builder/coder，原 reviewer 复审。final 每条适用 path 最多返工 2 轮且每轮 fresh reviewer；超限交 decider，方向/范围/验收/数据语义/安全/生产影响交用户。
6. `progress.md` 是 single-task 恢复唯一真相且仅 monitor 写；顶部当前快照、正文状态变化/通知，包含 task_type、角色/模型/实例/tab、phase/batch/round、输入输出、最近观察、最后 PASS/FAIL/BLOCKED、下一接收者；monitor 重启先重建 snapshot。
7. monitor 每 120 秒 wait/get，无变化静默。Enter 仅当本次派单仍在输入框、`state_change_seq` 未推进、且不是审批/确认 UI 时发送一次并复验；失败通知 orchestrator、换 fresh，不连按。
8. 首行标头固定为 `[relay-light:single-task] worker · phase=<plan|batch|final|decision|monitor> · agent=<role>#<instance> · batch=<n|na> · round=<n> · workspace=<repo-relative-path>`。DONE/BLOCKED 后即停、不等 node_closed；不碰 full plan/log；存在 `RELAY_RECEIPT` 时 fail closed 且不得自行清环境变量。
9. 完成须全部适用 Recipe path PASS 或可核查 N/A，最终汇总无 open P0/P1；单一 final reviewer 不替代 Recipe。

## 三、三轮 fresh 审核形成史

<a id="review-rlt-a13"></a>
<!-- dh:planning-evidence:v1 event=RLT-A-13 artifact=design/01-RelayLight-产品设计与验收.md kind=review -->

| 轮次 | 审核结论 | 用户提供的实质 findings | 整改结果 |
|---|---|---|---|
| fresh 初审 | REVISE | 模式边界、三类审核路由、Recipe、恢复、Enter、模型快照、授权边界需冻结 | 全部纳入候选合同 |
| 定向复审 | REVISE | 标头冲突、`progress.md` 唯一写者、final 上限/完成判据仍需补齐 | 补齐互斥标头、monitor 单写、每 path 上限与 Recipe 完成谓词 |
| fresh 最终复审 | APPROVE | P0=0，P1=0 | 允许进入整版确认 |

审核记录只登记结论与 finding 主题，不把本次派单摘要扩写成不存在的 reviewer 原话或逐条报告。

<a id="review-rlt-b09"></a>
<!-- dh:planning-evidence:v1 event=RLT-B-09 artifact=dev_plan/P1-RelayLight-开发方案.md kind=review -->

RLT-B-09 的计划审核结论按同一用户提供形成史登记：最终 APPROVE、P0/P1=0；审核范围明确包含单验收单元卡 RLT_29、三批顺序、heavy Recipe、恢复、模型快照、授权边界与完成判据。这里不新增第四轮审核，也不冒充 builder 对自己计划的独立复核；后续 `review.plan.md` 仍由运行期独立 plan-reviewer 审 headless 施工粒度。

## 四、用户裁决、讲解与整版确认

<a id="understanding-rlt-a13"></a>
<!-- dh:planning-evidence:v1 event=RLT-A-13 artifact=design/01-RelayLight-产品设计与验收.md kind=understanding -->

<a id="understanding-rlt-b09"></a>
<!-- dh:planning-evidence:v1 event=RLT-B-09 artifact=dev_plan/P1-RelayLight-开发方案.md kind=understanding -->

- 用户确认的四项裁决：①逐批复核与开发后全量终审是两道独立闸；②模式名为 `single-task`；③其余两项产品裁决按本文件 §二的最终合同成立；用户 2026-09-22 已整版确认。派单未提供四项逐字问答全文，因此仅登记确认结论，不伪造引号原话。
- 全局地图：任务从已落户的 workspace/task_plan 进入；orchestrator 分发、monitor 单写 progress 并路由，角色实例各占独立 tab/pane；最终证据回主会话人验。
- 契约/定义：single-task 无 full relay plan/log；durable signal 与 progress 恢复替代账本；batch review 只放行下一批，final review 按 Recipe 决定任务能否进入人验。
- 运作机制：FAIL 按阶段回同施工者或 fresh final reviewer；120 秒静默监控与 Enter 三条件防误触；超限由 decider/用户裁决。
- 独立验证：结构测试、安装副本一致性、完整模式回归与真实 Herdr single-task 自举演示共同取证。
- 故障处置：BLOCKED/超限/标头冲突/RELAY_RECEIPT/恢复不完整均 fail closed，不清环境、不越位推进。

## 五、规划与授权边界

- 新验收 ID：`HC-RL-A159`～`HC-RL-A168`、`HC-RL-H19`；旧 ID 不改号、不复用。
- 单验收单元卡：`RLT_29`；三批施工建议为 C1 协议归属与 skill 核心、C2 双 adapter 与监控/恢复、C3 结构测试/安装一致性/真实 Herdr 自举与 as-built。
- 用户 2026-09-22 已授权连续推进设计落盘、B、D、施工、复核、commit/push/PR/CI/merge/verify/清理/Issue close；但 E10 展示后的**人验结论仍须用户看证据后确认**。
- 本 builder 节点只落规划工件，不执行未来施工，不 commit/push/PR，不冒充 monitor 或 reviewer。

## 六、2026-09-22 plan round-3 超限裁决与新增模型确认需求

- 来源：用户本次 decider 派单明确授权此小决策代执行；范围仅限合同文档，不授权本棒施工、派 agent、版本动作或人验代签。
- 已读事实：`review.plan.md` round3 FAIL 唯一残余 P1-04 为 round-2 signal 缺 batch/path 与“round2 起新 schema”冲突；remediation_count=2，不再回 builder 追加整改。
- 兼容裁决：保留 `DONE.plan-review.round-2.md` 原字节，将其明确定义为新 schema 冻结前产生的唯一新增历史例外；精确文件名、旧字段与 SHA-256 识别规则见 task_plan §4。round-1 原历史地位不变；round3 及未来所有 signal 强制新 schema。decision RESOLVED 不改写原 FAIL，也不代替原 plan-reviewer 复核。
- 用户新增需求：relay-light skill 开始 single-task 前，orchestrator 必须展示全部拟启动角色/实例的模型与推理档表并询问确认；可逐角色修改，未确认不得启动任何 agent。确认后落 execution_strategy 快照；恢复可沿用已确认且未变快照，新增/更换角色或实例、模型/推理档必须重问。推荐默认只是提案，最大权限不替代模型确认或其它授权。
- 写者交接：当前主会话 orchestrator 在启动引导期仅落已确认分配，随后才能启动 agent；monitor 接管后仍是运行期唯一快照写者，避免为了记录确认先启动 monitor 的循环。
- 本次局部事实：用户说明 builder#1、plan-reviewer#1 已按要求切为当前 w41 独立 tab 上的 Codex GPT-5.6 Sol medium；decider#1 是 Codex Astra medium。本 decider 未查询 Herdr，不编造精确 tab ID、其它角色确认或启动前询问记录；这些局部指定供后续演示引用，并须补实际观察。
- A160/H19/RLT_29 验收强化：结构测试覆盖询问/确认/未确认阻断、逐角色修改、恢复与变更重问；真实证据必须串联询问、用户明确确认、Herdr 实际 tab/model/推理档与快照一致。缺项不宣称通过，不用静态字段存在或本裁决代替实跑。
- 本次裁决见 `workspace/RLT_29/decision.plan-round-3.md`；review.plan 与所有历史 plan-review signal 保持原样，等待原 plan-reviewer 按裁决验点检查。

## 七、2026-09-22 用户更正：monitor 对 repo 完全只读

- 用户明确更正：monitor 的“监控这个动作”不应在 workspace 任何文档落记录。本节是规划合同调整，不伪称代码已实现。
- 更正前的错误合同是：`progress.md` 由 monitor 单写并作为恢复唯一真相，monitor 接管 `execution_strategy.md` 并落盘状态变化、通知与 model-allocation DONE。这些未提交记录不继续作为形成史。
- 更正后合同：monitor 对 repo/workspace 完全只读，只在 Herdr 终端 wait/get/read；状态变化立即 prompt 通知 orchestrator，安全 Enter 契约保留。monitor 不写 `progress.md`、`execution_strategy.md`、`DONE`/`BLOCKED`、轮询日志、通知日志或任何 workspace 文档；其通知不是 durable artifact。
- durable 状态只来自实际 worker/reviewer/decider 自己写的 `DONE` / `BLOCKED` / review / decision。orchestrator 读取后机械路由；恢复联合使用 durable signals、独立 review/decision 工件、orchestrator 维护的 `execution_strategy.md` 配置与 Herdr 实态。
- `progress.md` 恢复为“施工进展与验证证据索引”，由当前顺序执行的 batch coder 在自己 batch 追加简洁里程碑/证据引用；不含 pane/agent 状态、轮询、通知或终端输出，reviewer/monitor/orchestrator 不写。
- `execution_strategy.md` 只保存用户确认的模型分配与实际启动配置，由 orchestrator 在启动/更换角色时机械维护；monitor 只读。已核实的 w41 配置保留，不再归因于 monitor 写入。
- 旧 `DONE.plan-review.post-decision.md` PASS 是本次 user-adjust 之前的历史结论；由于规划合同已变更，它不再放行后续施工，必须等待本调整的独立 plan-review。model-allocation gate 保留。

## 八、2026-09-22 monitor-contract plan review 整改 1

- 独立 `plan-reviewer#2` 对 monitor-contract user-adjust 的首轮审核结论为 FAIL（P0=0、P1=1、P2=0）；唯一 finding `P1-01` 指出通用 RELAY_RECEIPT preflight 的“每个/所有 worker 写 BLOCKED”与 monitor repo/workspace 零写入冲突。评审记录见 `workspace/RLT_29/review.plan.monitor-contract.md`。
- remediation_count=1 的最小整改将 preflight 冻结为两个互斥分支：产出型 builder/coder/reviewer/decider 命中 `RELAY_RECEIPT` 时仍只写本角色精确 `BLOCKED.*.md` 后停；monitor 命中时 repo/workspace 零写入，只用 Herdr prompt 非 durable 通知 orchestrator 后立即停止，不写 BLOCKED。两个分支均不清除 `RELAY_*`。
- 计划验收同步要求 SKILL/双 adapter/结构测试覆盖 monitor receipt 正反例：monitor 分支 repo diff 必须为空且只有 Herdr prompt 通知；同时必须证明其它产出型角色的精确 BLOCKED preflight 未被削弱。本节只登记规划整改，不伪称代码已实现或测试已通过。

## 九、2026-09-22 monitor-contract plan review 整改 2

- 同一 `plan-reviewer#2` 对 remediation_count=1 的 targeted recheck 已确认 P1-01 CLOSED，但新发现唯一残留 `P1-02`：`task_plan.md` batch-3 出口仍写“PASS 后 monitor fan-out workflow-final”，与同文件 §10 及正式合同的 orchestrator 机械路由相冲突。
- remediation_count=2 的最小整改仅修正该出口：batch-3 reviewer 写 durable PASS signal 后，由 orchestrator 读取并分派 heavy 五路 workflow-final；monitor 只观察 Herdr 变化并 prompt 通知，不读取 durable 工件、不路由、不分派或启动 agent。
- 对现役 `task_plan.md`、`brief.md`、`execution_strategy.md`、design/01 与 DevPlan RLT_29 扫描，其它 single-task 口径已把读取 durable 工件、机械路由与分发归 orchestrator；design/01 其它章节出现的 monitor 派发/路由是完整 relay 模式合同，不是 single-task 残留。本次未改动已闭合的 RELAY_RECEIPT 分流。
