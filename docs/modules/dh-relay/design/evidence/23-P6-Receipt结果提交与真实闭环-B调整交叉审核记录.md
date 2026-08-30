# DHR-B-24 · P6 Receipt 结果提交与真实闭环 B-adjust 交叉审核记录

<a id="review-b24"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-24 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=review -->

## 1. 审核输入与范围

- 候选：`dev_plan/drafts/DHR-B-24-P6-Receipt结果提交与真实闭环-调整候选.md`。
- 正式设计输入：[design/12](../12-Receipt绑定结果提交与P6真实闭环-契约调整.md)。
- 只审计划拆分、所有权、恢复/幂等、registry fail-closed、DHR_35 阻塞与 Linux 延后；不读用户配置正文、凭据或真实 Agent 状态。

## 2. Fresh 审核与主会话裁决

- **初审（fresh、只读）**：发现 P0=0，P1=3：
  1. DHR_64 应使用实际 `relay-core/runtime/workflow-driver.mjs`，并显式承接 Herdr completion instruction，不能留给禁止改 Runtime 的 DHR_35。
  2. 重复 submission 必须区分已 committed 且同 digest 的幂等，不能一概失败关闭。
  3. DHR_63 必须承接「任一已登记坏条目整体 fail-closed 且拒绝真实启动」的负例。
- **裁决及回写**：三项全采纳；另将 Ack-after-commit、单写者、actor/lease/gate/recovery 失败不改账、prepared 强杀点及 DHR_35 的 `submit-executor-result → committed Ack → Result` 同步要求写入候选。
- **复审（同一 fresh reviewer 仅核原 P1 闭合）**：P0=0、P1=0、无新增 P2；Linux 延后/受限未放松，允许进入用户 B 确认。

## 3. 用户讲解、理解与确认

- **讲解**：新增 DHR_63 仅维护已冻结 registry 的非敏感元数据；新增 DHR_64 实现 Receipt 绑定 Result bridge；DHR_35 不再承担协议/配置修复，只在两卡完成后做 Windows 实录；Linux 继续延后。
- **理解问题**：DHR_35 现阶段会被前置卡阻塞，不能继续真实 Windows 实录；只有 DHR_63/DHR_64 分别完成后才恢复。

<a id="understanding-b24"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-24 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=understanding -->

- **用户理解回答**：2026-08-30，用户明文“确认”。
- **正式 B 确认**：在收到“请明确回复确认 B-adjust”后，用户再次明文“确认”。

## 4. 生效范围与止损

- 生效：P6 DevPlan 增加 DHR_63/DHR_64，DHR_35 标为 `blocked-by:DHR_63,DHR_64`，并同步 DHR_35 的合同。
- 不生效：不创建 DHR_63/DHR_64 worktree；不写 registry；不改生产代码；不启动真实 Agent；不运行 Linux；不读取凭据；不 verify、合并、推送、部署或做环境动作。
