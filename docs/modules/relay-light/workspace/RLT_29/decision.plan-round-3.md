# RLT_29 · plan round-3 超限裁决

- 日期：2026-09-22；角色：decider#1；phase=decision；review_round=3；remediation_count=2。
- 来源：本次用户精确派单授权小决策代执行；Issue #56。本棒不是 builder、monitor、orchestrator 或 reviewer。

## 问题

round3 唯一残余 P1-04：不可覆盖的 DONE.plan-review.round-2.md 缺 batch/path，但整改后的 schema 声称 round2 起适用；修补历史会违反 durable 原字节保护。另有用户明确新增的启动前模型分配询问要求，需落入正式合同和验收。

## 裁决

1. **RESOLVED（合同裁决）**：round-2 保留原字节，明确为新 schema 冻结前已产生的唯一新增历史例外；round-1 仍保留既有历史身份。monitor 按 task_plan §4 的精确文件名、全部旧字段与 SHA-256 三重匹配识别 round-2 历史 FAIL：文件名定位轮次，旧字段定位任务/角色/轮次/计数/结论/证据，读取层仅解释 batch/path 不适用，不回写、不改 FAIL、不清零计数。不匹配即阻断；round3 及未来所有 signal 必须新 schema，不能类推例外。
2. **model-allocation gate**：启动前由当前主会话 orchestrator 展示全部拟启动角色/实例的模型与推理档表并询问明确确认，允许逐角色修改；未确认不启动任何 agent。推荐默认仅提案。引导期只由 orchestrator 写已确认分配后才启动 agent；monitor 接管后独占运行快照。恢复沿用未变确认；新增/换角色或实例、模型/推理档须重问。最大工具权限不等于确认或其它授权。
3. **验收**：A160/H19 与 task_plan 强制结构正反例和真实询问→用户确认→实际 Herdr tab/model/推理档→快照一致链。本次用户对 builder/plan 的 Codex GPT-5.6 Sol medium 调整及 w41 独立 tab 说明只作为局部来源事实，精确 tab/实际模型由 monitor 后续取证；本棒 Astra medium 身份不扩展成其它角色确认。

round-2 原始 SHA-256：`9f6cf3a3b0d73f2060f2483d0d79342862cf0302b9bc687b57cf8dd7921ed62f`。

## 修改清单

- design/01：§7.5 启动闸、写者交接、兼容裁决；A160/H19 证据要求。
- evidence/13：追加本次决策、新需求和局部模型指定事实及证据边界。
- DevPlan P1：仅 RLT_29 卡的验收与裁决合同，不改状态。
- brief.md：同步模型闸、证据和逐轮信号定位。
- task_plan.md：历史精确例外、未来 schema、此次 decision 文件/证据解析特例、启动合同和三批实施/测试/真实证据要求。
- execution_strategy.md：确认模板、启动/运行写者交接、用户提供的局部指定；不冒填 Herdr 观察。
- 本裁决及 DONE.decision.plan.md。

## 边界

不改 review.plan.md、DONE.plan-review*.md、其它历史 signals、progress、代码、AGENTS 或 as-built；不派 agent、不执行版本动作、不问用户。未运行未来结构测试或真实演示，不宣称 A160/H19 通过。本次 RESOLVED 仅解决合同冲突，不代签 plan PASS/verify/人验，不进入施工、不增加 builder 整改轮；remediation_count 保持 2。

## 交给原 plan-reviewer 的验点

1. 核验 round-2 原字节/hash 未变，round3 FAIL 历史也未改；例外只匹配该文件与旧字段，不放宽未来 signal。
2. 核验 brief/task_plan/设计中的轮号命名与 schema 生效边界一致，decision 信号精确文件名与 workspace 相对 evidence 可唯一解析。
3. 核验模型分配表、询问、明确确认、快照、启动的先后顺序；引导期无先启动 monitor 才能记录确认的循环，运行期 sole writer 仍为 monitor。
4. 核验逐角色修改、恢复复用、新增/换角色或实例及模型/推理档重问、默认仅提案、权限不替代确认全部落到 skill/双 adapter 施工要求。
5. 核验 A160/H19/DevPlan/brief/task_plan 同步要求结构正反例与真实证据链；局部 Codex 调整未伪造成全角色确认或已观察 Herdr。
6. 由原 plan-reviewer 形成独立核验结论，monitor/orchestrator 再按有效信号处理；本棒不分配新轮次或覆盖旧 signal，不以裁决代替复核放行。

## 本棒检查

最终执行 `git diff --check`；结果以本棒工具退出码为准。历史 round-2 hash 与受保护工作区工件字节核对保持不变。
