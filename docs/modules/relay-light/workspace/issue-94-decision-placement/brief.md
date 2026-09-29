# Issue #94 · 决定落 findings

- 任务 ID：`issue-94-decision-placement`
- Issue：https://github.com/nashhu180-netizen/dh-relay/issues/94
- 状态：本地实施与验证、独立复核已完成；2026-09-29 用户在本会话明确“授权继续”；未 PR/合入/安装。


## 当前远端交付授权（2026-09-29）

- 用户原话：“合并master，同步安装，继续完成 pr”。本轮明确解除此前不 push/PR/merge/install 的停止线；覆盖本卡分支推送、PR、必要CI与评审、GitHub master 合入与合入态复验、已有 ThinkPad/ThinkBook 多 agent 技能副本同步、证据回填与本卡清理。以实际核验为准，不提前宣称完成。
- 仓库/源/目标：nashhu180-netizen/dh-relay；docs/issue-94-decision-placement → master。同卡事实收口 PR 在本授权内；不部署业务、不重启环境、不修改无关现场。
- 本轮允许新增精确证据路径：`docs/modules/relay-light/workspace/issue-94-decision-placement/closeout.md`。

## 实施阶段合同（历史）

- 用户原话：“授权继续”。承接上一轮待实施的 Issue #94，授权本卡实施、验证、独立复核及必要修复；保留原明确“不建 PR、不合入”限制，不安装、不部署、不清理工作树。
- 档位：轻档；task_type=light。主会话直接实施，非 relay-light 运行，不启动 Herdr 角色或 watcher。独立复核采用 fresh 实例；一致性、教训两路必做。
- 交付对象：`nashhu180-netizen/dh-relay`，`docs/issue-94-decision-placement`；目标主干仍为 master，本次不集成。只精确提交本卡工件，不推送（保留无 PR 停止线）。
- 实施范围：核心技能和双 adapter 的决定落点、写者、恢复及内嵌派单模板。完整模式只补模式差异说明，不改 scribe 合同；不修改运行代码、schema、AGENTS 或业务仓历史。
- 完成条件：下方六条建议验收作为本次检查口径；两路独立复核无未闭合问题，既有安装契约测试通过，文档场景走读和差异检查通过。结果只代表本地交付，不代表远端合入或技能已安装。
- 决定与理由：见 findings.md 的 D-94-01；实际步骤见 task_plan.md。

<!-- dh:allowed-paths:v1 -->
- `tools/relay-light/skill/SKILL.md`
- `tools/relay-light/skill/references/adapter-claude-code.md`
- `tools/relay-light/skill/references/adapter-codex.md`
- `docs/modules/relay-light/workspace/issue-94-decision-placement/brief.md`
- `docs/modules/relay-light/workspace/issue-94-decision-placement/task_plan.md`
- `docs/modules/relay-light/workspace/issue-94-decision-placement/findings.md`
- `docs/modules/relay-light/workspace/issue-94-decision-placement/progress.md`
- `docs/modules/relay-light/workspace/issue-94-decision-placement/lesson_candidates.md`
- `docs/modules/relay-light/workspace/issue-94-decision-placement/review.md`
- `docs/modules/relay-light/workspace/issue-94-decision-placement/execution_strategy.md`
- `docs/modules/relay-light/workspace/issue-94-decision-placement/review.independent.md`
- `docs/modules/relay-light/workspace/issue-94-decision-placement/closeout.md`

## 立户阶段记录（历史）

- 日期：2026-09-29。
- 仓库：`nashhu180-netizen/dh-relay`；后续目标主干：master。
- 来源：WFP_03 主编排 `wfp03-orch2` 转达用户 hyf 的明确立户请求；原派单已完整保存于 findings.md。
- 分流：拟轻档、task_type=light；目标是澄清协议文档落点；风险为写者冲突和决定摘要越权。后续实施开工时确认并冻结档位与 Recipe。
- 本次可写路径：仅本工作区七件套；GitHub Issue 创建与回填。
- 本次验收：Issue 已建立、工作区关联 Issue、问题与建议验收完整、影响清单可定位、明确停在实施前、通过 Herdr 向发起人回报。
- 本次授权不包含技能/代码/其它工作区变更、PR、合入、安装、verify、验收代签或清理。
- 提交/推送判断：AGENTS.md 的开工授权包不能替代本次明确缩窄的立户授权；本次立户无需提交或推送，保留本地 WIP。任务分支与 worktree 不清理。
- GitHub-flow: user-waived (2026-09-29, scope=本次不建 PR、不合入)。Actions CI 待后续交付，不声称通过；本记录不豁免实施开工授权和复核。

## 目标与来源

明确 relay-light single-task 的决定落点：业务决定与遗留记录进入 findings.md，避免编排持续写入 execution_strategy.md。

来源：2026-09-29 用户 hyf 经 WFP_03 主编排 wfp03-orch2 派单。本次仅授权建立任务户口与 GitHub Issue；实施另行授权。事故为派单报告，未独立审核 WFP_03 原始对话。

WFP_03（分支 wt/WFP_03-B1）两次将以下内容写入 execution_strategy.md：① B2 P3-3「开跑/准入能力未区分，留 D1」、decider decision-1 结论和给用户的知会；② 人验时用户点选的 P3 处置去处、D1 接受后定及合入后 test 影响、教训采纳。用户指出这是第二次，应放 findings 或 progress。

## 档位、范围与风险

- 拟轻档，task_type=light，协议文档维护；后续开工时确认并冻结。没有代码或生产环境变更。
- 范围：核心 SKILL 的决定落点、写者边界、恢复与人验收口，以及 Claude Code/Codex adapters 和存在的配套模板。
- 风险：不能把决定摘要当作原始裁决或 durable signal；不能扩大编排的基线归因权；不能把 single-task 的写者规则直接覆盖完整模式的 scribe 合同。

## 建议验收口径（未实施）

- [ ] findings.md 承载用户裁决（时间/来源）、decider 结论摘要和原件引用、D 项状态、范围外发现与 P3 去处、给用户的知会；遗留须用户点头并明确去处。编排与 coder 按派单分段、错开追加；启用 document 时可按原责任方确认代笔，默认不强制启用文档 agent。
- [ ] execution_strategy.md 仅记录授权/停止线、角色/模型/实例、派单与路由、批次流转/clear 闸、提交/checkpoint SHA；业务决定仅指向 findings，模型确认事实仍保留。
- [ ] single-task 的 progress.md 仅记录 coder 施工里程碑与证据账本，不记录决定。
- [ ] 写者边界、恢复权威、人验收口一致；findings 中摘要指向原始用户来源与独立 decision 工件，不替代原始结果、复核、signal 或人验签字。
- [ ] 完整模式与 single-task 的差异得到明确说明；双 adapter 及存在的模板同步，无写者冲突；基线归因仍由 coder 取证、reviewer 审核。
- [ ] 后续实施走 light 的独立一致性/教训复核；按届时授权完成验证与交付。本次不声称复核或验收通过。

## 已核影响清单

基线：a1710e0ae6509220528bee3aac867737b3c846ce。

- tools/relay-light/skill/SKILL.md：完整模式角色表及写入者唯一/scribe 素材边界（58–59、308–310）；single-task 基线归因写者（331）；model-allocation（349）；生命周期、人验、durable signal/写者边界（354–368）；可选 document（372–380）；恢复权威（395）。
- tools/relay-light/skill/references/adapter-claude-code.md：single-task model-allocation（173）、派单/信号/只读边界（约 182–214）、恢复（220）。
- tools/relay-light/skill/references/adapter-codex.md：对应 model-allocation（175）、派单/信号/只读边界（约 184–216）、恢复（222）。
- tools/relay-light/skill 下未发现独立 workspace/dispatch 模板文件；派单模板内嵌于 adapter。历史 workspace/dispatch 是证据，不批量改写。
- tools/relay-light/test_install_skill.py 现有安装/合同校验涉及 execution_strategy 与写者边界；后续评估受影响断言，本次不改代码。

## 本次交付与停止边界

先建此 Issue，再从已核对 master 建立 Issue 关联分支和独立 worktree，写任务卡/工作区并回填链接。

GitHub-flow: user-waived (2026-09-29, scope=本次不建 PR、不合入；Actions CI 留待实施交付，不声称通过)。只授权立户不是 D-start；本次无提交/推送，工件以本地 WIP 保留。禁止修改技能、代码、安装副本、WFP_03 现场；不派施工/复核，不 verify，不关闭 Issue。
