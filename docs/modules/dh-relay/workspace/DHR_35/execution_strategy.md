<!-- dh:v1 · workspace/DHR_35/execution_strategy.md -->
# execution_strategy — DHR_35

## 操作模型

主会话在 `wt/DHR_35` 执行。先写并验证临时仓脚本，随后逐条运行 Windows Codex 与 Claude Code 真实闭环；所有外部状态先记录、再裁决，任何缺失前置都 fail-closed。

## 子 agent 授权

本卡施工阶段不派子 agent。收口时另派未参与施工的 fresh-context 只读复核者；其范围以 review brief 为准。

## 收尾铁律

- Linux 只记 B-22 延后/受限，不能标 pass 或用 fixture 顶替。
- 证据不全、出现 P0/P1 或身份链不一致前，不许标待验收。
- 不读取或写入凭据、账号配置、登录态；不 push、部署或打 verify。
