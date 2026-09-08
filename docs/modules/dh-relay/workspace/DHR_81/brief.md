<!-- dh:v1 -->
<!-- dh:workspace-contract:v2 -->
# brief — DHR_81 instruction_ref 执行语义

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_81 | P6 | [DevPlan DHR_81](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md#dhr_81) |

## 目标 (Outcome)

让唯一启动包络明确要求 Agent 打开并执行 `instruction_ref` 指向的任务文件，再按真实结果提交 Receipt；任务正文仍不复制。

## 完成条件 ★必写

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| 1 | 包络快照固定“打开指针→执行文件任务→按真实结果提交”的顺序，Receipt 命令不是业务任务。 | AI | DHR_81 / design/15 HC-SD-A13 |
| 2 | 正文不进入 prompt/记录/公开协议；缺失、越界、摘要变化仍在 Attempt/Agent 前拒绝。 | AI | DHR_81 / design/15 HC-SD-A14 |
| 3 | 唯一 sender、外围调用为 0、A10/A11/A12 直接回归保持自然终态绿色；不以 fake 替代真实副作用。 | AI | DHR_81 / design/15 HC-SD-A15 |
| 4 | 第二轮 fresh reviewer 选择生产语义变异，指定专项测试改坏必红、还原后绿。 | AI | DHR_81 / heavy 有效单测 |

## 边界 (Boundaries)

- In scope：`startup-dispatch.mjs` 固定文本与既有 DHR_78 专项测试，以及本卡工作区/as-built/计划机械收口路径。
- Out of scope：正文复制、新 sender/重试/错误码/协议、Store/driver/Herdr executor、真实 Agent、DHR_35 重跑、用户配置和凭据。
- 停止条件：需要任何未列生产/测试路径、A13~A15 无法由当前最小改动满足，或出现 P0/P1。

## 触及子系统

- `as-built/relay-core.md`：startup dispatch 的实际启动包络语义。
