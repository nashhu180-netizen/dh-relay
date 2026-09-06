# DHR-A-29 · `host_ref` 正式冻结交叉审核记录

> 审核对象：[`design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md`](../14-Herdr-host-ref正式冻结与DSH-off可验证展示.md)（候选形成史：`design/drafts/DHR-A-29-host-ref正式冻结-候选.md`）。两轮均由 fresh、机器只读会话完成；审核者未写入候选或生产路径。

<a id="review-a29"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-29 artifact=design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md kind=review -->
## 轮 1：初审与主会话裁决

- 初审核实：现有事件契约封闭，实际 driver 仅写 `executor_ref` / `detail`；候选最初没有明确内部恢复 locator 与展示标签的边界，也没有唯一的旧客户端兼容路径。
- 初审 P1-1（采纳）：若拿展示 `host_ref` 作恢复查询键，重连/恢复会错误；主会话补入“`executor_ref` 仅供内部恢复、`host_ref` 仅展示，禁止从 `detail` 解析”的责任边界，并在 HR-A2 加相应变异。
- 初审 P1-2（采纳）：封闭 `relay.event/v2` 不能由施工方临场选择扩字段方式；主会话固定为 schema 字段更新 + capability/descriptor 指纹变更，旧客户端显式拒绝/刷新、旧账本只回放“未提供”。
- 初审 P2（采纳）：不可逆摘要须让操作者仍能对照；主会话要求 CLI 和受控 Herdr 对照面只展示同一安全标签，用户不看原始会话名。
<a id="understanding-a29"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-29 artifact=design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md kind=understanding -->
- 用户理解对齐与决定：同一会话的普通轮询和 driver 恢复保持标签；会话重建/不同会话重附着才换标签，旧值留历史。用户于 2026-09-06 明文“按你的建议”确认。

## 轮 2：定向复审（机器只读）


无 P0/P1。复核假设：候选文档是待实施的冻结设计；现有 schema/driver 尚未承诺已实现。它明确分离展示标签与内部恢复 locator，并冻结旧账本、旧客户端和新 descriptor 的兼容路径。反例：若实现用展示标签发起恢复，或旧客户端静默处理新增事件，即违反候选约束。

用户理解风险

无 P0/P1。安全比较已定义为：CLI 与受控 Herdr 对照面只展示同一脱敏标签，用户仅核对是否相同，不需查看原始会话名。反例：把“历史观测”展示成“当前存活”会误导用户；候选已要求 lost 状态明确标历史。

需要用户决定的问题

无。候选已规定格式、生命周期、兼容策略及人工判定动作。
