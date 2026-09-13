<!-- dh:v1 · dispatch/README.md — RLT_10 手动派活协议（编排=Claude 主会话 rlt10-orch，只分发不施工） -->
# RLT_10 派活协议

- **Issue**：https://github.com/nashhu180-netizen/dh-relay/issues/16 · **worktree**：`/home/nash/work/dh-relay/.dh-worktrees/RLT_10`（`wt/RLT_10`，基线 master `73947ac`）
- **任务卡**：`docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` §RLT_10（目标 / 非目标 / 四条验收 / 允许路径 / 实施提示）
- **允许路径（闭集）**：`tools/relay-light/relay_log.py`（**2026-09-13 用户裁决 decision.1 选项 A 追加，仅限实现 `lint --json`**）、`tools/relay-light/test_relay_log.py`、`tools/relay-light/test_install_skill.py`、`tools/tests/relay-light-log.ps1`、`tools/tests/run-relay-tests.ps1`、`docs/modules/relay-light/workspace/RLT_10/**`。**`relay_log.py` 只允许 `lint --json` 相关改动；`install_skill.py` 不在允许路径内**——其它程序缺陷只记 findings 并打 BLOCKED，不顺手改。
- **oracle**：`docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` §11 的 HC-RL-A80 / A94 / A11 / A16 逐字（另 A15 是 Linux 直跑同一文件，本卡只作旁证不冒充）；§3.5 账本合同（lint 规则编号映射表）。
- **模式**：手动派活（relay-light 账本尚未启用）。每个 agent 只做自己那一件事，完成后把结构化信号追加到 `../progress.md` 并**立即停止**，不等 node_closed、不越位派活、不回头问用户；有疑问写 `BLOCKED` 信号。
- **信号格式**（追加到 `../progress.md` 「信号」节末尾一行，独占一行）：
  `DONE task=RLT_10 role=<builder|audit|exec|decide|review> batch=<n|W|R> status=<W_READY|PASS|FAIL|READY_FOR_REVIEW|CONSTRUCTION_DONE|BLOCKED|APPROVE|APPROVE_WITH_NITS|REQUEST_CHANGES> evidence=<逗号分隔> next=orchestrator`
- **凭据红线**：任何密钥/凭据值不入任何文件。
- **权限**：用户 2026-09-13 明示沿用 RLT_08 配方、各 agent 最大权限；worker 可自己 `git commit` 到 `wt/RLT_10`（不 push、不改 master、不动其它 worktree）。提交信息 scope 用英文 `relay-light`。
- **环境事实**：本机 Linux，`python3` 3.12、`pwsh` 7.6 均在 PATH；`python3 -m unittest discover -s tools/relay-light -p 'test_*.py'` 现状可直跑（耗时较长，请用 `-v` 或 `timeout` 观察）。Windows 全量 runner 证据只能在 pwsh 下模拟，本卡不冒充 Windows/Linux 真机对方证据。

| herdr 名 | 角色 | 模型 | 何时拉起 | brief |
|---|---|---|---|---|
| rlt10-orch | 编排（Claude 主会话） | — | 常驻 | 本文件 |
| rlt10-build | builder（W：七件套 + 分批 task_plan） | codex gpt-5.6-sol medium | 立即 | builder.md |
| rlt10-audit | 审核：plan-reviewer（W）/ checker（每批） | codex gpt-5.6-sol medium | builder W_READY 后 / 每批 exec DONE 后 | audit.md |
| rlt10-exec | coder | devin swe-2-max | audit PASS task_plan 后，逐批 | exec.md |
| rlt10-decide | decider | codex gpt-6-astra medium | 任一 BLOCKED 时 | decide.md |
| rlt10-monitor | 监督 | devin swe-2-medium | 立即，常驻 | monitor.md |
| rlt10-review | 复核（normal 三路：代码轮1 / 需求方向 / 教训） | devin swe-2-max | CONSTRUCTION_DONE 后 | review.md |
