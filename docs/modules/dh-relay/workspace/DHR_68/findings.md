<!-- dh:v1 -->
# DHR_68 · Findings

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-6801 | P2 | B-32 把缺陷 A 记为"10 秒 spawnSync 上限"，但未写明 Windows 的命中分支：现役 `invoke` 只在 `child.signal` 为真时判超时，而 DHR_35 实测的失败串是 `spawn:ETIMEDOUT`（走 `if (child.error)`）。只按 `child.signal` 实现超时语义位会漏判，A 的对账分支永远不会触发。 | `workspace/DHR_35/evidence/f3508-root-cause/production-defects.json`（分支 `wt/DHR_35`）的 `observed_failure`；`herdr-cli.mjs` `invoke` 失败分支 | 施工步骤 3② 明确按 `child.error?.code === 'ETIMEDOUT' \|\| child.signal` 判定。不改 DevPlan 文字（验收口径本身没错，只是实现细节需补）。 | open |
| F-6802 | P1 | 验收项 C 只写"driver 不发 completion instruction"，没写**解除 blocked 之后**由谁补发。若严格按字面实现（永不发），真实 Codex/Claude 在用户完成信任后将永远收不到 Receipt-bound 提交指令，DHR_35 的闭环仍然跑不通——本卡等于把"启动失败"换成"启动后静默挂死"。 | 卡片验收口径 C；`workflow-driver.mjs` L256~L263（`receiptBound` 时唯一一处发指令） | **主控取解释**：`instructionPending` 延后补发——启动即 blocked 时不发，状态首次离开 `blocked` 时补发恰好一次。理由：这仍属"启动期 blocked 的事件路径"，不触碰 Result 判定，且是唯一能让 C 不与 P6-RI-A4 相矛盾的读法。已在对话中向用户明示该解释，若用户要收窄为严格字面则回退并把缺口登记给 DHR_35。 | open · 待用户认可解释 |
