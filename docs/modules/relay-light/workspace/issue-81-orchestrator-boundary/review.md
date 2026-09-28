# Issue #81 · light 独立复核

- 复核身份：Codex fresh reviewer（未参与施工）；2026-09-28。
- 范围：只复核 `tools/relay-light/skill/SKILL.md` 与两份 adapter 的本次协议差异，以及 task.md 所列验收；未改实现，未运行业务测试。

## 一致性路径：FAIL

### P1 · R81-C-01 · 独立审核通过后的 `closed-as-baseline` 没有可执行的唯一写者路径

依据：核心条款规定 `findings.md` 仅 coder 写、reviewer 只写自己的 review/check 工件，且只有“证据完整且独立审核通过”后才可将归因写为 `closed-as-baseline`（`SKILL.md` 新增第 331、334 行）。但 coder 的 `DONE` 只表示送审就绪并要求写完即停（第 336、365 行）；batch PASS 后又要求清理 coder/reviewer（第 360 行）。既有返工路径只在 reviewer **FAIL** 时返回同一 coder（第 354 行）。

因此顺序“coder 取证 → coder DONE → reviewer 独立 PASS”后，唯一可写 `findings.md` 的 coder 已按合同停止，reviewer 和 orchestrator 又被禁止写该文件；现有 phase/signal/轮次没有规定 PASS 后如何把审核引用回写为 `closed-as-baseline`。这不是措辞问题：它使“独立审核后才关闭”无法落盘，或诱导 coder 在审核前关闭。应在不新增 schema 的前提下明确既有阶段内的回写时点、派回 coder 的条件及其 signal/审核引用要求。

- 核心合同将测试、基线取证和业务证据复算明确交给已获派的 coder / batch-reviewer，编排仅可做身份、路径、状态、字段和既有结论的程序性核对；两份 adapter 均引用同一合同，并把派单模板补齐验证责任、基线、执行合同、临时现场、唯一写者及通过/阻塞字段。不存在 coder、reviewer 或 orchestrator 的职责冲突。
- `findings.md` 仅 coder 写、reviewer 自写 review/check、编排只路由 coder 登记；`progress.md` 仍限定当前 batch coder 的批末里程碑。该写者划分与 single-task 的既有 sole-writer 合同相容。
- 最小基线证据覆盖 SHA/候选差异、cwd/解释器/完整命令、环境、收集范围、计数、退出码、逐项失败原因和证据路径；环境不可比、候选代码污染、缺证、漏收集/skip/弱化断言、同名异因和修复项回退均明确不能进入允许失败集合。
- `closed-as-baseline` 被限制为归因闭合，不能豁免验收、必需 CI、独立复核、verify 或人验；集合外失败、证据不足、基线不可复现或审核未通过均走 BLOCKED，满足 task.md 的基线失败放行边界。R81-C-01 所示的审核后唯一写者时序仍须补齐。
- 临时现场由执行者在派单许可的位置建立，限制共享依赖改动与权限扩张，要求冻结、串行、先留白名单过滤的证据再清理；与编排不得自行建立临时环境的边界一致。
- 原则性纠正停止新增同类动作，但不自动 kill 或删现场；语义不清保留现场并由主会话澄清，明确停止/既有停止条件立即执行。终止进程与删除现场被明确分开判断。

## 教训路径：FAIL

除同一 P1 R81-C-01 外，未发现额外 P0/P1/P2 finding。

- 候选-12 要求结论不得以部分证据宣称整条验收完成；本次逐项判定把完整收集、允许集合、同名同因、必需通过项及修复项移出旧豁免逐一写入，避免把失败数或局部绿误读为可放行。
- 候选-17、48 和 62 指出环境归因与基线对齐必须可证明，且比较失败集合而非数量；本次条款要求环境/依赖与收集范围取证，环境不可比即 BLOCKED，并要求同名失败阶段/原因无实质变化，符合该教训的收窄方向。
- 候选-34 的可复算证据与独立复核要求在本次由精确命令、退出码、逐项标识和证据路径，以及 batch-reviewer 的独立审核落实；但 R81-C-01 缺少审核结论回写给唯一 writer 的既有路径，不能证明独立审核实际约束了关闭动作。
- 候选-13 的复核冻结教训与候选-10 的历史纠错纪律没有被本次文档改变；本次仅增加未来派单/取证合同，不重写既有历史结论或把修正误作现场清理授权。

## 结论

初审时两条 light 必做路径均为 FAIL，阻断项为 R81-C-01。

## 整改复核 1：PASS

- 复核对象：`SKILL.md` 新增「闭合时序」段；两份 adapter 继续以对核心合同的引用和同一派单字段承接，未引入侧别差异。
- R81-C-01 已闭合：coder 首次仅以待核状态送审；reviewer 在其自写 review/check 记录归因与待补项，并按既有 **FAIL → 同一 coder → 原 reviewer 复审** 路径返回。coder 按审核证据回写 `findings.md` 与允许集合引用后重新送审，原 reviewer 核对完成才发 batch PASS。
- 该时序明确沿用既有 `review_round` / `remediation_count`：计入原整改计数，不新建或重置轮次；FAIL 期间不 clear；额度不足进入原超限路径。它没有扩张 batch schema、引入新角色或授权编排/reviewer代写 `findings.md`。
- 新段还禁止先 PASS/clear 再代写，并明确“归因成立不等于整批 PASS”；因此独立审核仍在关闭动作之前，且必需通过项、有效允许集合和 reviewer durable signal 的既有批次门没有被绕过。
- 定向检查未发现新增 P1：写者边界、coder/reviewer 顺序、现有 FAIL 整改回路、PASS 后清理闸和 model-allocation gate 均相容。

整改后，两条 light 必做复核路径为 PASS。本复核不构成 CI、验收、verify 或合并结论。

## 整改复核 2：PASS

- 复核对象：`SKILL.md` 的「最终复核/E2 首次发现」条款，以及两份 adapter 对“当前路径 reviewer”的一致引用。
- workflow-final/E2 首次发现范围外失败现在有合法责任链：发现问题的原路径 reviewer 在自己的工件和 durable signal 记录阻断项；编排只按该路径既有合同派 coder；coder 沿用原 `phase/path` 与 `batch=na` 补证、回写 `findings.md` 后送审。没有把取证、归因或 PASS 判断交给编排，也没有让 coder 自审。
- 路由可执行且不扩 schema：`workflow-final` 与 `e2-code-review` 都在既有 phase 闭集，`batch=na` 已在既有 signal schema；精确产物和 signal 路径仍由派单指定。条款明确禁止重开已 PASS/clear 批次、把 batch-reviewer 挪作最终复核/E2 reviewer、重置计数或借 coder DONE 放行。
- 复核独立性未降级：workflow-final 的每轮复审仍换 fresh reviewer、每 path 最多两轮；E2 仍只在初审有 open P0/P1 时由同一 `reviewer_session_id` 进行 targeted attempt 2，且不发第三派。额度不足或不满足 E2 定向复查条件时按既有决策/用户路径停报，未把未闭合归因伪装为 PASS。
- 未发现新增 P1；初审 P1 R81-C-01 与本轮 GitHub 指出的最终复核/E2 actor/phase/round 缺口均已闭合。
