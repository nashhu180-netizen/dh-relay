# DHR-B-29 · P6 Windows 真实闭环修复 — 交叉审核与确认

> 事件性质：B-adjust。正式设计输入未变；本记录归档候选、fresh 审核、理解问答与用户确认，不是 D-start、registry 写入、生产代码、真实 Agent、verify、合并、推送、部署或环境操作授权。

<a id="review-b29"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-29 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=review -->

## 触发与候选

DHR35 E-3512 证明 `herdr.codex.main` 在签发 Attempt 前因 `E_NONSECRET_PROJECTION_MISSING:/profiles` fail-closed；Windows Claude 的 `agent start --kind claude` 又不满足已知 PATH shim 约束。用户原始意图为：「补齐 Codex 的非敏感身份投影，以及让 Windows Claude 走受支持的 Herdr 启动路径……都要修正」。

候选新增可并行的 DHR66 与 DHR67，并保留 DHR34、DHR63、DHR64、DHR65 为 DHR35 的既有前置；design/12 P6-RI-A4/A5、Receipt-bound Result 和 Linux 延后语义不变。

## fresh 审核、裁决与定向复审

首次 fresh Codex 只读审核提出五项 P1：Receipt 身份对象不得收窄；nonsecret projection 允许最小程序读取但不得落值；Claude 启动须规定唯一识别/超时/rename 失败的关 pane 协议；DHR67 路径须精确且与 DHR66 隔离；DHR66/DHR67 与 DHR35 的 A4/A5 补充关系须明确。主会话全部采纳。

用户理解后明确授权：`/profiles` 必须已由 registry 声明为 nonsecret，程序只保留 hash、错误码与脱敏摘要，不保存投影值或配置正文。

第一次定向复审额外发现两个 P1：Receipt 字段名必须是 `executor_profile_id`，且 DHR35 必须明确保留 DHR34、DHR63、DHR64、DHR65 并新增 DHR66、DHR67。候选修订后，第二个 fresh Codex 实例终检 P1=0、P2=0，确认既有 P1 未重开。

## 最终计划边界

- DHR66：只维护用户级 registry 中已声明 nonsecret 的 `/profiles` 元数据。Receipt 仍是 `executor_profile_id`、脱敏 `account_alias`、`config_fingerprint`、`executor_capability_hash` 四字段；不保存投影值或配置正文，坏 pointer 在 Attempt/Agent/pane/Result 前停止。
- DHR67：Claude 只走 `pane run → 有界且唯一自动识别 → agent rename → 交给既有 Attempt`。识别为零/多个、超时或 rename 失败时关闭同一新 pane；Herdr 观测绝不生成 Result。
- DHR35：依赖 DHR34、DHR63、DHR64、DHR65、DHR66、DHR67；仅在全部完成并经独立 D-start 后重跑 DSH-off Windows 实录。Linux SSH 继续 B-22 延后。

## 用户确认与生效边界

<a id="understanding-b29"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-29 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=understanding -->

- 理解回答：2026-08-30，用户明确「是的，可以」接受 DHR66 仅读取 registry 已声明为 nonsecret 的 `/profiles`，只记录 hash/错误码/脱敏摘要。
- 最终确认：2026-08-30，用户明确「确认」本 B-adjust。
- 生效：本次只授权 DevPlan、DHR35 brief/progress 与本审核工件落盘。DHR66 与 DHR67 必须分别取得 D-start 后，才可创建各自 worktree、读取/写入用户 registry 或修改生产代码。
