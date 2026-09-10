<!-- dh:v1 · B-adjust 候选 v3 · 未生效。唯一业务输入是已正式晋级的 designInputs[]。 -->
# RLT-B-04 调整候选 v3 — RLT_03 / RLT_05 / RLT_07 验收 owner 对齐

- **目标文档**：[`dev_plan/P1-RelayLight-开发方案.md`](../P1-RelayLight-开发方案.md)
- **事件 ID**：`RLT-B-04`
- **状态**：**候选 · 未生效**
- **唯一设计输入**：`design/README.md` 的 `designInputs[]` 所指正式 `design/01-RelayLight-产品设计与验收.md`，已含 `RLT-A-04`；不读取 design draft/evidence 作为拆计划依据。

## 0. 调整目标

把 RLT-A-04 的原子验收映射到能“实现、证明、签署”同卡完成的任务：RLT_03 只签 parser/lint，RLT_05 签完整 status，RLT_07 签五阶段模板；不改变三卡目标、允许路径、档位、任务类型、依赖、批次或卡数。

## 1. 三张任务卡

### RLT_03

解析/lint 组作如下替换，其余账本/状态机验收全部不动：

| 动作 | 验收 ID | 卡内口径 |
|---|---|---|
| 保留并改描述 | `HC-RL-A18` | marker 四必需字段、decision_mode 默认解析、plan_loaded 版本；不再要求本卡证明 status 可读 |
| 删除退役号 | `HC-RL-A64/A86/A88/A90` | 不再作为活动验收 |
| 移出 | `HC-RL-A73` | 转 RLT_05 |
| 新增 | `HC-RL-A126` | lint 拒绝 kickoff/verify-signoff node type |
| 新增 | `HC-RL-A128` | superseded parser/lint 忽略及 A46/A72/A75/A120 四个封闭例外 |
| 新增 | `HC-RL-A129` | stage 枚举与分组连续 lint |
| 新增 | `HC-RL-A130` | decision_mode parser/default 与 lint 规则编号 |

目标、非目标、允许路径和 heavy Recipe 不变。B 正式生效并完成 workspace 合同同步后，在 **RLT_03 施工第 4 批**内续做窄返工（证据沿用 `workspace/RLT_03/reviews/batch-4-*.md`）：生产错误编号与测试断言 A64/A86/A88/A90 分别迁移到 A128/A129/A126/A130；`relay_log.py` 的空账本 pending_nodes 注释与对应测试只保留 A128/A84，去掉 A73 标签；删除 acceptance matrix 中把 A73 当成本卡 closeout 的项。A128 只证 parser/lint 行为，不提前实现 RLT_09 的运行中改计划机制，也不得实现 RLT_05 的完整 status contract。

### RLT_05

- 新增 `HC-RL-A73`：superseded 不产生状态、不进三列表，活跃 status 差分等价且唯一允许 `superseded_ignored` 不同。
- 更新 `HC-RL-A62` 描述：`plan` 精确键增加 `decision_mode`；A62 只验 schema/排序/计数结构，不重复 A73 差分证明。
- 更新 `HC-RL-A92` 描述：映射承载阶段、Recipe、limits、on_exceed，且 E11/E12/E13 不出现在任何阶段。
- 目标、非目标、允许路径、依赖和 heavy Recipe 不变。

### RLT_07

- 新增 `HC-RL-A127`：五阶段模板不生成 kickoff 或 verify 签字节点；等本卡创建模板后直接取证。
- `HC-RL-A12/A95` 等既有模板验收不变；A127 不与它们互相替代。
- 目标、非目标、允许路径、依赖和 heavy Recipe 不变。

## 2. DevPlan 全局联动

1. §1“承接设计”从 `106 A + 15 H = 121` 更新为 `107 A + 15 H = 122`。
2. §6 验收 ID→任务卡对照删除 A64/A86/A88/A90，新增：A126→RLT_03、A127→RLT_07、A128→RLT_03、A129→RLT_03、A130→RLT_03；A73 从 RLT_03 改为 RLT_05；表尾权威口径同步改为正式输入 §11 的 `107+15`。
3. §8.1 覆盖关改为正式 design 的 122 条活动验收全部正好一次；退役号不参与 owner 映射。
4. §8.2 颗粒度关写明：RLT_03 parser/lint、RLT_05 status、RLT_07 template 各自实现/证明/签署同卡；A62/A73 不重复。
5. §9 计划完工把“前四批 103 条机器验收”改为 104；总账 121 改为 122。
6. 文件头补 `RLT-B-04` 的 `dh:planning-event:v1` marker，review/understanding 回链 evidence/05；§0 调整史追加本次 owner 变化与 121→122。
7. 顶部现状与下一步写明 RLT-A-04 已生效、RLT_03 等 B-04 生效后做新 ID 窄返工；不把候选状态伪装成任务完成。
8. B 正式生效后同步在建 RLT_03 的 `brief.md`、`task_plan.md`、`progress.md` 与 acceptance matrix；同步完成后在当前 RLT_03 施工第 4 批续做，不另开 DevPlan 第 4 批或 RLT_17。
9. RLT_14 实施提示中的退役 A90 改为 A130，并全文检查 §3.2 不再以活动口径引用 A64/A86/A88/A90。

## 3. 三关自查

- **覆盖**：旧活动 owner 净变化为 -4 +5，活动总账 121→122；A73 只换 owner，不增减。新增五条各恰有一个 owner，四个退役号无 owner。
- **颗粒度**：RLT_03 不再签完整 status，RLT_05 不签模板，RLT_07 不签 parser；每卡仍是可一起实现、证明、签署的验收单元。
- **依赖**：RLT_03→RLT_05→RLT_07 原依赖方向不变；无新增边、无环、首 demo 批次不变。

## 4. AI 可证明

1. DevPlan 活动验收映射与正式 design §11.1 集合相等，且每个 ID 正好出现一次；退役 ID 集合无 owner。
2. RLT_03/RLT_05/RLT_07 卡片中的新增与迁移项和 §6 对照一致。
3. 三卡允许路径、依赖、批次、档位、任务类型和总卡数 diff 均为空。
4. §8 覆盖/颗粒度与 §9 的 104/122 数量一致。
5. DevPlan 文件头 marker、§0 调整史、§1 承接数与 §6 表尾权威口径均更新到 RLT-B-04/122。
6. B-review 所用正式 design SHA-256 与 evidence/05 登记值一致。

## 5. Fresh review 聚焦

1. 是否完整承接 RLT-A-04 正式输入，尤其 A62/A73、A126～A130？
2. 是否存在重复 owner、退役号残留或活动 ID 漏盖？
3. RLT_03 窄返工与 RLT_05/RLT_07 后续工作是否边界清晰？
4. 是否误改路径、依赖、批次、档位、任务类型或卡数？
5. 是否还有需要用户做产品取舍的问题？
