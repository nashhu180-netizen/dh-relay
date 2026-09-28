# RLT_27 终止归档独立复核

复核日期：2026-09-28。范围仅为用户终止后的归档语义与证据保留；不复核历史试跑的验收，也不构成 verify 或人类验收。

## 一致性路径

**PASS（终止语义一致）**。

- DevPlan 任务表及 RLT_27 正文均为“已终止”，并明确“非验收通过、不补 verify”；`brief.md`、`progress.md`、`review.md`、`findings.md` 的新增终止覆盖层均指向同一决定。
- `progress.md` 将历史试跑、verify 阻断与原授权保留为历史事实，并声明新决定覆盖其后续执行含义；未把 PR、Issue 关闭或工作树移除表述为 verify。
- `progress.md` 明确只清理本机旧树/后续临时树与 `wt/RLT_27`，并明确不宣称已清理历史 Windows 镜像。
- `review.md` 中既有的 2026-09-20 人类确认及勾选仅为历史最小试跑记录；本次终止没有新增人验勾选或代签。

## 教训路径

**PASS（停止点与原始证据保留）**。

- 终止不重跑旧协议、不修 F-001、不补 verify；如需验证现行 relay-light，须另立任务。
- 原始首次阻塞与 retry02 账本仍由已跟踪的 `docs/modules/relay-light/relay/rlt27-linux-codex-01/{relay_log.jsonl,retry02/relay_log.jsonl}` 保留。复核时 `git diff --name-only` 仅列出 DevPlan 和 RLT_27 的归档入口文件，未列出任何账本或计划文件。
- 本机备份位置、三份备份产物及 SHA-256 已列在 `progress.md`；这支持恢复旧现场，但不把备份替代为验收证据。

## 必要发现

无 P0/P1。终止归档入口满足“需求取消、非验收通过、证据保留、停止旧执行”的语义；本记录不改变历史证据或人类签名区。
