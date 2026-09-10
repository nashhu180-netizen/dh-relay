<!-- dh:v1 · A-full 共创草案 v4 · 未生效。事件候选 RLT-A-04。
     本文件不属于 designInputs[]，不得作为 B 拆计划或施工输入。 -->
# RLT-A-04 共创草案 v4 — 校正 RLT_03 / RLT_05 验收边界

- **目标文档**：[`design/01-RelayLight-产品设计与验收.md`](../01-RelayLight-产品设计与验收.md)
- **事件 ID**：`RLT-A-04`（既有事件已使用至 `RLT-A-03`）
- **状态**：**共创草案 · 未生效**
- **触发事实**：RLT_03 Batch 4 独立复核确认 implementation findings open=0，但 `HC-RL-A18/A64/A73/A86/A88/A90` 中的 status、模板或 mapping 子句无法由 RLT_03 允许路径和当前任务边界完整证明；其中 A73 还与正式 status schema 自相矛盾。

## 0. 人话目标

保持产品行为不缩水：superseded 行仍不会干扰活跃执行，`decision_mode` 仍能从 `status --json` 读出，五阶段模板与映射仍不会把 kickoff、verify 签字或 E11/E12/E13 纳入接力。只把每条验收交给能完整证明它的任务，并修掉正式设计内部不可同时满足的文字。

## 1. 不变边界与 ID 策略

- `HC-RL-A18/A62/A73/A92` 保留原 ID；A18 只修正验证描述，不改变“marker + plan_loaded”产品语义；A62 补齐既有 status 承诺缺失的字段；A73 纠正不可满足的自相矛盾。
- `HC-RL-A64/A86/A88/A90` 都跨越两个以上可独立失败的验收单元，按稳定 ID 规则退役且永不复用；新增 `HC-RL-A126`～`HC-RL-A130` 原子承接。A64 的 status 等价子句归并到语义相同的 A73；A86 的 status 顺序和 A90 的 status 可读分别已被 A62 覆盖，不重复发 ID。
- 活动验收总账从 `106 A + 15 H = 121` 改为 `107 A + 15 H = 122`：退役四条（-4），新增五条（+5）。
- 不扩大任何任务允许路径，不改卡数、依赖、批次或档位。
- 本候选不授权改正式 design、DevPlan、RLT_03 workspace、代码、提交、verify、合并或推送。

## 2. 正式设计拟修改项

### 2.1 `HC-RL-A62`：补齐 `decision_mode` 的稳定 status 落点

`plan` 精确键集合从 `{marker, cards}` 改为：

```text
plan { marker, cards, decision_mode }
```

其中 `decision_mode` 必为 `auto` 或 `consult`；marker 省略时输出 `auto`。同步修改 §3.5 字段表、JSON 样例、A62 验收描述与验证方式。

`HC-RL-A18` 的正文继续只承诺 marker 必需字段、`decision_mode` 默认值与 `plan_loaded` 版本；其验证描述把“status 读出 auto”改为“parser 派生出 auto”。status 的稳定可读位置统一由 A62 验证。这是去掉跨验收单元的重复验证，不改变 A18 产品语义。

### 2.2 `HC-RL-A73`：修正 superseded 自相矛盾

现合同同时要求 superseded 行“`state` 为 `superseded`”和“不出现在 `nodes`/`stages`/`agents`”，而 §3.5 的 node state 枚举没有 `superseded`。

保留 A73 原 ID并改为：

> superseded 节点没有关闭状态，不进入 `status --json` 的 `stages`、`nodes`、`agents`、closed 或 pending 派生；只增加 `superseded_ignored`，且不影响 `current_stage`、`current_node` 与活跃节点状态。

验证：含 superseded 行的状态输出与删去该行的活跃投影一致，唯一允许差异是 `superseded_ignored` 计数。该改写与 §4.4 既有“status 直接忽略、没有关闭语义”一致，是纠正不可满足文字，不改变用户可见承诺。

### 2.3 退役 `HC-RL-A64/A86/A88/A90`，原子化为 A126～A130

正式退役清单两处（§11.1 前注与 §15 稳定性自查）追加这四个 ID 及原因，旧号永不复用。

新增：

| ID | 产品承诺 | 验证方式 | 下游唯一 owner |
|---|---|---|---|
| `HC-RL-A126` | relay_plan 节点表只含监工派 agent 的节点；lint 拒绝 kickoff 或 verify-signoff 类 `type` | 合法 node type 正例与两类禁止 type 反例，断言 lint 结果及规则编号 | RLT_03 |
| `HC-RL-A127` | 五阶段模板生成的节点均为监工派 agent 的节点，不生成 kickoff 或 verify 签字节点 | 对五阶段模板逐一生成/读取并断言无禁止 `type` | RLT_07 |
| `HC-RL-A128` | parser/lint 派生活跃计划时忽略 superseded 行；显式例外封闭为 A46 节点号占用、A72 禁止依赖 superseded、A75 空节点、A120 表尾/隔断放宽 | 含/不含同一 superseded 行的对照只比较活跃结构与退出码，不比较可能由 A72 降级为 A48 的 lint 规则编号；逐项覆盖四个例外 | RLT_03 |
| `HC-RL-A129` | lint 只接受 `W/C/R/X/F` 阶段，且同一阶段节点分组连续（忽略 superseded 行） | 非法枚举、非连续分组反例与合法正例，断言 lint 结果及规则编号 | RLT_03 |
| `HC-RL-A130` | lint 拒绝非法 `decision_mode`；parser 对显式值只接受 `auto/consult`，省略时派生 `auto` | 两合法值、非法值与省略默认四例；非法例断言 lint 退出码及规则编号 A130 | RLT_03 |

原子迁移映射：A64 的 lint 面→A128、status 等价→A73；A86 的 lint 面→A129、status 顺序继续由 A62；A88→A126+A127，mapping 缺席继续由 A92；A90 的 parser/lint 面→A130、status 可读继续由 A62。A73 独占 superseded status 差分等价；A62 只负责 schema、排序与计数结构，不重复差分证明。

### 2.4 正文一致性联动

正式晋级时必须同批修改：

- §3.3 三层状态词表：superseded 只作计划行废弃标记，不列为 status 节点状态。
- §3.5 status 字段表与 JSON 示例：`plan.decision_mode`；node state 枚举仍不含 superseded。
- §4.4：保留“status 直接忽略、没有关闭语义”，并与 A73 用词一致。
- A62/A73 分工：A62 只验 schema、排序与计数结构，A73 独占 superseded 差分等价；两条不互抄验证方式。
- lint 映射表：A64/A86/A88/A90 分别改链 A128/A129/A126/A130；A18 规则编号不变。
- §10.1 relay_plan 样品：A24/A46/A47/A87 回链保持不变，只把 A86/A90 替换为 A129/A130；按样品实际内容决定是否另链 A126/A128，不虚构覆盖。
- §10.3 status 样品：保留 A62，并仅在样品实际覆盖时增链 A73；A92 继续由 §6.3 mapping 样例支撑。A127 本次只登记进 §11.1，待 RLT_07 建出五阶段模板后再按机械证据回填，不在本次 §10.4 前向引用不存在的样品。
- §11.1：退役 A64/A86/A88/A90，新增 A126～A130，更新总账；A18 只改验证描述，A62/A73 按上文修订。
- §15 验收 ID 稳定性自查与 planning-event 回链；§11.1 前注和 §15 自查表两处退役清单同批更新。

## 3. 下游 B-adjust 影响（不在本事件内生效）

A-full 正式晋级后，另起 fresh-context `RLT-B-04` 候选，只读取更新后的正式 `designInputs[]`：

| 验收 ID | 当前卡 | 拟调整卡 | 说明 |
|---|---|---|---|
| `HC-RL-A18` | RLT_03 | RLT_03 | 保留 marker/default/plan_loaded；验证不再跨到 status |
| `HC-RL-A64` | RLT_03 | 退役 | lint 由 A128；status 等价由 A73 |
| `HC-RL-A73` | RLT_03 | RLT_05 | 完整 status 排除、计数与当前派生 |
| `HC-RL-A86` | RLT_03 | 退役 | lint 由 A129；status 顺序已由 A62 覆盖 |
| `HC-RL-A88` | RLT_03 | 退役 | 由 A126/A127/A92 原子承接 |
| `HC-RL-A90` | RLT_03 | 退役 | parser/lint 由 A130；status 可读由 A62 覆盖 |
| `HC-RL-A126` | 新增 | RLT_03 | 禁止 node type 的 parser/lint 合同 |
| `HC-RL-A127` | 新增 | RLT_07 | 五阶段模板不生成禁止 node type |
| `HC-RL-A128/A129/A130` | 新增 | RLT_03 | superseded lint、stage lint、decision_mode parser/lint |
| `HC-RL-A62/A92` | RLT_05 | RLT_05 | status schema/顺序/decision_mode 与 mapping 缺席 |

RLT_05 与 RLT_03 使用同一 `relay_log.py` / `test_relay_log.py` 生产与测试路径，且 RLT_05 依赖 RLT_03；原子 ID 让每张卡继续“实现、证明、签署”同卡完成。B-adjust 需同步三张卡、验收 ID→任务卡对照、§8.1 覆盖/颗粒度自查，以及 §9 的前四批机器验收数 `103→104` 与总账 `121→122`。

## 4. 验收清单

### AI 可证明

1. §11.1 活动验收表中 A18/A62/A73/A92/A126～A130 各恰有一行；A64/A86/A88/A90 只在两处退役清单出现，活动总账为 122。
2. lint 映射表、§10 样品回链、§11.1 验收表与 §15 稳定性自查对旧/新 ID 的引用一致且不虚构样品。
3. §3.3、§3.5、§4.4 和 A73 不再同时要求“status 列表排除”与 `state=superseded`。
4. A62 的 `plan` 精确键、字段表、JSON 示例与 A18 的默认值派生及 A62 自身的 status 可读一致。
5. A126～A130、A73 与 A62/A92 覆盖原四个复合 ID 的全部失败面，各有唯一 owner。
6. RLT_03、RLT_05、RLT_07 均保持实现/证明/签署同卡；允许路径、依赖、批次、档位和卡数不变，DevPlan 前四批机器验收为 104、总账为 122。

### 人类判断

1. AI 展示“四个复合 ID 原子化、A18 保号、A73 纠错并承接 status 等价”的前后对照；用户判断是否接受稳定 ID 迁移与总账 122。
2. AI 展示 A-full 审核结论与剩余风险；用户判断是否授权整版正式设计晋级。

## 5. Fresh 定向复审问题

1. A18 保号改验证、A64/A86/A88/A90 退役并原子化，是否完整消除 RLT_03 越界且符合稳定 ID 规则？
2. A73 保留 ID 的理由是否充分，§3.3/§3.5/§4.4 是否闭合？
3. A126～A130、A73 与 A62/A92 是否完整覆盖四个退役 ID 的所有失败面且无重复 owner？
4. 总账 122、§10 实际样品回链、§15 退役清单和下游 owner 是否精确一致？
5. 是否还有必须由用户先做产品取舍的问题？
