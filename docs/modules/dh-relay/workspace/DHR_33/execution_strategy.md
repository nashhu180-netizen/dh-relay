<!-- dh:v1 -->
# DHR_33 · 执行策略

- 派发：施工 codex gpt-5.6-terra high（Herdr 交互终端，`agent start --kind codex`）；复核 claude `--model opus` 拉起（模型身份按候选-40 双证登记）；全程 `agent wait` 后台监控，blocked 由主控逐条审批。
- 复核配方（heavy）：开工预审 → 施工 → 代码轮 1（fresh）→ 代码轮 2（换人 fresh，选有效单测变异点）→ 需求方向 → 教训 → 一致性 → 返工收敛 → squash 合入（委托代执行）→ 待人验。
- 风险面：capability 基线更新与 agent-node 钉更新是本卡唯一「动既有保护」的点，复核轮重点盯；contracts/ 零 diff 是硬闸。
