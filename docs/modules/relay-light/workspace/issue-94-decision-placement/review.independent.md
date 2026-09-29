# 独立复核原始报告

- 任务：issue-94-decision-placement；Issue：https://github.com/nashhu180-netizen/dh-relay/issues/94
- reviewer：`/root/review_issue94`，fresh-context，未参与施工；一致性与教训分别给结论。
- 执行方式：会话内独立子代理，非机器隔离只读；宿主核对派前/派后 HEAD、git status 及三产品文件 SHA256 均相同。未发现持久差异不等于证明从未写入。

## 首次只读 CLI 尝试（无有效复核结论）

- 会话：01a0eb91-ad80-7d31-863a-aa762f1ce3b9；配置 sandbox=read-only，approval=never。

## 静态复核结论

**无法给出 light Recipe 一致性或教训复核的 PASS / P0–P3 结论。** 我已阅读消息中提供的 AGENTS.md，但本地只读命令因沙箱错误 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` 未能执行；另一文件读取途径也被当前审批策略拒绝。因此，我无法读取最新实施合同、三文件候选差异及教训原文，不能核查行号、工件冲突或编造教训 ID。

### light Recipe 一致性

未完成核查；无可证实的分级发现或 PASS。

### 教训复核

未完成核查；无法定位并引用教训库中的可核查行，故无可证实的分级发现或 PASS。

本次没有修改仓库、运行测试或代签人验。需恢复该工作树的只读访问后，才能完成指定复核。

## 有效独立复核返回（原文）

独立静态复核报告（未参与实施）

范围：仅核对三处产品文档 diff 与原文；未写文件、未测试、未 rebase。宿主应以派前/派后文件哈希与 Git 状态侦测保证只读；本运行不是机器隔离只读，未宣称隔离。

**一致性路径：PASS**

- P0/P1/P2：无。
- `SKILL.md:368-372` 完整覆盖用户裁决、decider 摘要及独立 decision 引用、D 项、范围外发现/P3 去处、知会；遗留须用户点头，缺源/冲突不放行。
- `SKILL.md:370-372` 编排只追加既有裁决的记录，不得生成业务结论或基线归因；后者仍限 coder 取证、reviewer 审核。
- `SKILL.md:371` 保留授权、停止线、模型确认等编排事实于 `execution_strategy.md`，业务决定只留 findings 指针。
- `SKILL.md:368,384,399` single-task 的 `progress.md` 不记录决定；`findings.md` 只是回查原件的检索入口，不成为第五类恢复权威。
- `SKILL.md:310,331` 明确完整模式仍由 scribe 按既有合同摘录裁决；single-task 不迁入该写权，未改完整模式合同。
- 双 adapter 的落点、模板“决定引用”、恢复规则一致：`adapter-claude-code.md:184-186,206-207,227` 与 `adapter-codex.md:186-188,208-209,229`。
- 触发例：人验中用户仅说“接受 D1，P3 转 backlog”。编排可把原始用户来源、状态和去处写入 findings；不得把正文写进 execution_strategy、不得据摘要当人验签字，也不得在缺来源时推进依赖动作。
- 最小修正：无。

**教训路径：PASS**

- P0/P1/P2：无；无需新增或编造教训 ID。
- 可核查依据：
  - `教训库-候选.md:338-344` 的候选-41：会影响下游验收/收口的事实应升入 findings，支持把决定与遗留置于可消费的 findings，而非藏入运行配置。
  - `教训库-候选.md:330-336` 的候选-40：模型身份事实须如实登记但不替代复核独立性，支持保留模型确认于 execution_strategy。
  - `教训库-候选.md:96-102` 的候选-11：同类目标应逐项同步核验；本次两份 adapter 已逐项同构落地。
- 触发例：恢复时仅看到 findings 中“decider 建议继续”，但没有独立 decision 原件或用户裁决来源；`SKILL.md:372,399` 与双 adapter 均要求保持待核并回原责任方澄清，符合“事实进入 findings、摘要不冒充权威”的边界。
- 最小修正：无。

## 宿主核对说明

上述“侦测保证只读”仅按事后无持久差异理解，不是机器阻写保证。未伪造 sandbox 成功或把失败 CLI 算成复核 PASS。

## 候选 SHA256

- `tools/relay-light/skill/SKILL.md`：`792bcc179442c1aa04c11fcd689d89a1abb52a8db6f32dfb81acd7521b5709d7`
- `tools/relay-light/skill/references/adapter-claude-code.md`：`f624df39f56bfdf6bedcfa6001a4ca0b1be9830b81ac72e44f8204c928c96034`
- `tools/relay-light/skill/references/adapter-codex.md`：`7256a7cdf24b355f2e7e9388657566cfb5e1dd19696c5d7bb6f1119cd458e6f6`
