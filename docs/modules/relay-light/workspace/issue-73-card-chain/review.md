# Issue #73 · 独立文档复核

复核范围：`docs/relay/README.md`、`docs/relay/templates/card-chain.md`、`docs/relay/wf-analytics-platform/README.md` 与 `tools/relay-light/skill/SKILL.md` 的本卡差异。只读复核；未改候选文件、未代签验收。

## 一致性路径（light）

结论：**PASS（无 P1/P2）**。

- 总表是一行一张已有卡，表内只保留卡/原卡与恢复入口、接棒条件、接力状态、下一步；模板明确禁止拆施工批次、角色或复核步骤（`docs/relay/templates/card-chain.md:9-19`）。这满足卡内计划和 Recipe 复核仍由原卡承担的边界。
- 原卡及 DevPlan 明定为任务与依赖的权威；证据不足只能记“待核实”，“已交棒”不等同原卡完成，也不授权下一卡开工（模板:18-19；`docs/relay/README.md:10`）。没有把摘要升级为授权或验收证据。
- 交互卡仍按现有规则走单会话；总表只记等待事项和恢复入口，不派发交互 worker（`tools/relay-light/skill/SKILL.md:24-35`）。等待用户被明确作为正常停点（模板:17）。
- 路径与现有仓内事实一致：现存完整计划 `docs/relay/wf-analytics-platform/task-runtime/p21-normal/relay_plan.md:4` 就位于 `docs/relay/<施工仓名>/<模块>/<plan_id>/`，并把账本和 `config/` 放在同目录。总表模板、仓入口与 skill 均使用同一落点；相对 Markdown 链接目标 `docs/relay/templates/card-chain.md` 和 `tools/relay-light/skill/SKILL.md` 均实际存在。
- 用户要求的跨模块单一总表得到落实：仓入口和 wf-analytics-platform 入口均要求选牵头模块、只维护一份；模板只给占位结构，未伪造 WFP/OBD 的业务依赖或进度。

## 教训路径（light）

结论：**PASS（适用，已吸收；无 P1/P2）**。

- 查核 `docs/modules/dh-relay/knowledge/教训库-候选.md:346-351` 的候选-42：逐级摘录会遗漏上游约束。模板没有复制卡内目标、验收或复核内容，而是要求引用原卡、恢复时读取原卡与工作区证据，并以原卡/DevPlan 为权威（模板:16-19）；因此不会把摘要误当作可独立执行的业务合同。
- 未发现与本纯文档、无执行协议变更范围直接相关、且尚未被上述权威/证据边界覆盖的其他教训。

复核结果：可进入后续 PR/CI 闸；本结论不替代用户验收、GitHub CI 或合并授权。
