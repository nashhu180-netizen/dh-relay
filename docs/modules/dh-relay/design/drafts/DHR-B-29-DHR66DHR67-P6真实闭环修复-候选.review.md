<!-- dh:draft-review:v1 status=not-effective -->
# DHR-B-29 候选草案 · fresh-context 复核

> 审核身份：Herdr fresh Codex 实例 `b29review`；只读，未参与候选起草。审核时间：2026-08-30。

## 方案问题

1. P1：DHR66 不得把既有 Receipt 身份对象收窄为「profile id + hash」。design/11 与当前实现保持 `profile_id`、脱敏 `account_alias`、`config_fingerprint`、`executor_capability_hash` 四字段；证据展示可遮蔽 alias，但冻结对象合同不变。
2. P1：DHR66 的正确边界是程序只读取用户批准、registry 声明为 nonsecret 的 pointer，投影值不落盘、不输出；无法确认该 pointer 即在 Attempt 前拒绝。不能写成「不读取任何配置」。
3. P1：DHR67 必须把 `pane run -> 有界且唯一自动识别 -> agent rename -> 交给现有 Attempt` 固定为验收。零/多个识别对象、超时、rename 失败均关闭本卡新 pane，并不启动 DHR35 Claude 实录。
4. P1：DHR67 允许范围须收窄为 Herdr CLI 包装、Claude executor、专属测试、必要测试入口与本卡 workspace；明确禁止 profile registry、driver、Store、RPC、contracts。DHR66 的用户级 registry 与 DHR67 不重叠。
5. P2：正式 B-adjust 须明确 DHR66 是 DHR63 后的新增 Codex projection 修复/复验，DHR67 是 Windows Claude 启动接线；二者完成后才解除 DHR35 的新阻塞，DHR64/65 已完成范围不重开。

## 用户理解风险

- 非敏感投影允许最小程序读取，但只持久化 hash/错误码/脱敏摘要，永不持久化投影值或配置正文。
- Windows Claude 的受支持路径不是 `agent start --kind claude`，而是 pane 内启动、自动识别和 rename。
- 两张前置卡完成后仍需 DHR35 在 DSH-off Windows 临时仓完成 Receipt-bound submission；Linux SSH 继续延后。
- Herdr `done`、pane 文本和 exit code 不可替代 Receipt-bound Result。

## 待用户定界

- DHR66 仅允许程序读取并校验明确、已登记为 nonsecret 的 Codex pointer（候选为 `/profiles`），并只保留 hash/错误码/脱敏摘要。
- DHR67 将失败协议固定为唯一识别、rename 成功才接入 Attempt；任何失败或超时关闭同一新 pane。
- DHR66、DHR67 成为 DHR35 新前置卡，不回滚或重开 DHR63/64/65。

## 独立核查依据

- 用户原始意图：「补齐 Codex 的非敏感身份投影，以及让 Windows Claude 走受支持的 Herdr 启动路径……都要修正」。
- `design/11` 四字段身份快照合同；`design/12` P6-RI-A4/A5 与「观测不能生成 Result」边界。
- 活跃 P6 DevPlan 中 DHR63–65、DHR35 的依赖与验收；DHR35 E-3512、F-3505、F-3506。
- `identity.mjs`、`profile-registry.mjs`、`workflow-driver.mjs`、Herdr CLI/adapter 的实现与定向测试，以及 Windows Herdr 操作手册。

## 定向复审闭合

- 第一次定向复审要求将字段名精确为 `executor_profile_id`，并把 DHR35 依赖明确为保留 DHR34、DHR63、DHR64、DHR65 后新增 DHR66、DHR67。
- 候选据此修订后，由第二个 fresh Codex 实例 `b29finalcheck` 只读终检：P1=0、P2=0；核对 design/11 的 Receipt 四字段及现役 P6 DevPlan 原四项前置关系，确认既有 P1 未重开，允许进入最终用户确认。
