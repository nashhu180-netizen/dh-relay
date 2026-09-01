<!-- dh:v1 · DHR_70 需求与方向复核 · 复核者原文（主控捕获落盘，未删改） -->
# review-req-codex — DHR_70

- **复核者**：`dhr70req`
- **形态**：codex `--sandbox read-only` · gpt-5.6-terra · high · **fresh，Review Batch 并发，四路互不继承会话**
- **派发**：`/codex` 插件 companion，cwd = `.dh-worktrees/DHR_70`
- **派单**：`review-brief-req.md`
- **基线**：派单锚定 `35ff2db..b6a3b47`；复核者已声明工作树已前进到 `cb742d4`，后续整改提交不计入其候选结论
- **落账**：e:E-7012

---

## 形态自述

只读需求/方向复核。按派单锚定候选 `35ff2db..b6a3b47`；工作树实际已前进到 `cb742d4`，后续提交不计入本轮候选结论。未修改文件。定向测试因只读沙盒禁止在 `%TEMP%` 创建夹具目录而全部 `EPERM`，故为静态审。

结论：**CHANGES-REQUESTED（2×P1，1×P2）**。

## 发现

### F-70-REQ-01 (P1) 冻结的 Gate 生命周期被实现字面改写，却声明“契约无变化”

- 位置：`design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md`「Gate 生命周期」；`relay-core/runtime/service.mjs` 的 `evictClosedActor`。
- 事实：冻结契约要求正常完成前不得从 `drivers` map 删除 receiver gate。候选在捕获 `E_LEASE_HELD:actor-closed` 后，先执行 `drivers.delete(runId)`，再走 durable 路径新取 lease、创建 actor 和重建 gate。
- 为什么这是需求问题（而不是代码问题）：这不是内部等价重构的自明结论；它改变了“原 gate 持续可达”这一冻结表述为“原 gate 可删、随后重建”。若逻辑 gate 替换被认为等价，必须在契约中明确；否则应走契约调整。当前 `review.md` 的“契约无变化”不能成立。

### F-70-REQ-02 (P1) A2 只证明最终成功，未证明旧 actor 零 mutation 与完整合法换届

- 位置：`relay-core/test/dhr70-submission-gate.test.mjs` 的 A2；DevPlan §3.2 DHR_70 A2。
- 事实：候选 A2 在旧 actor 失租期间循环提交，遇到 `lease-lost` 仅继续轮询；最终只断言成功、唯一 Result、事件文件“发生变化”和重投幂等。它没有在旧 actor 拒绝阶段逐字节核对 Store/event/state 零 mutation，也没有在候选版本断言新 lease、新 actor、重建 gate。
- 为什么这是需求问题（而不是代码问题）：A2 将这些都列为完成条件；测试绿不能替代缺失的命题证明。当前工作树后续提交虽补了 lease epoch 断言，但不属于派单指定的 `b6a3b47` 候选，且仍未把旧 actor 拒绝阶段与后续合法 mutation 分段取证。

### F-70-REQ-03 (P2) AI 提交区未形成可用的需求对齐证据

- 位置：`docs/modules/dh-relay/workspace/DHR_70/review.md` AI 提交区。
- 事实：该区仍写“尚未施工”，A1～D 证据和达成列均为空。三条“待人验”中：A1 行仅挂 E-7002，却同时声称覆盖 A2；A3 行引用 E-7003 但未登记结果；E-3526 行的 E-7004 仅覆盖受控 `idle ∧ pane_get=error` 观测形态，不是 DHR_35 真实 Agent 闭环。
- 为什么这是需求问题（而不是代码问题）：这不会造成虚假通过，但尚不能作为需求境证据或 H=0 放行材料。应保持未验状态，直至按各条件补齐等价证据。

## 逐点结论（上面 7 点逐条）

1. 范围漂移：未见往大漂；候选差异均在允许路径。A1、A3、B、C、D 有对应静态实现/夹具；A2 因 F-70-REQ-02 只完成部分证明，不能记为满足。
2. brief 忠实副本：完成条件 A1/A2/A3/B/C/D 与 DevPlan 逐字一致，未发现口径松动。
3. 三条对齐证据：均未在 `review.md` 落为已验证结论。E-7002 只直接覆盖 A1；E-7003 的场景指向 A3；E-7004 可覆盖 C 的机器命题，但不替代真实 A4。
4. 卡边界与 H=0：未见承接 A4 或运行真实 Agent 的实际差异；六条完成条件被冻结为机器证，H=0 本身成立。但 H=0 不免除 E11 对话确认，也不能绕过尚未补齐的机器证。
5. 结果失真：存在。A2 测试绿不足以证明“旧 actor 零 mutation + 合法新租约/新 actor/新 gate”，见 F-70-REQ-02。
6. 跨文档语义：实现与 design/12 的“不得删除 receiver gate”字面冲突；“契约无变化”目前不成立，见 F-70-REQ-01。
7. 方向决策账：H1/H2/H3 是施工归因假说，不是产品取舍；记录未把 H1 成立或 H2 排除冒充为验收通过，此点无发现。

## 范围外观察

- 本轮无法在只读沙盒独立复跑定向测试：失败原因为临时目录 `mkdtemp` 被拒，不能解读为业务回归。
- 当前 HEAD 有派单之后的整改提交；本结论未将其作为指定候选的修复证据。


Codex session ID: 01a05c35-e172-7433-9514-996cc8cc3231
Resume in Codex: codex resume 01a05c35-e172-7433-9514-996cc8cc3231
