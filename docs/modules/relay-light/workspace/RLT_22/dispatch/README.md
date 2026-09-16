<!-- dh:v1 · dispatch/README.md — RLT_22 手动派活协议（编排=Claude 主会话 rlt22-orch，只分发不施工） -->
# RLT_22 派活协议

- **Issue**：https://github.com/nashhu180-netizen/dh-relay/issues/24 · **worktree**：`/home/nash/work/dh-relay/.dh-worktrees/RLT_22`（`wt/RLT_22`，已 rebase 到 master `72c6c4d`）
- **任务卡**：`docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` §RLT_22；**oracle**：`docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` §11 的 HC-RL-A144~A150（承接 A35/A65/A71/A107；不改 A2/A49/A60/A62/A69/A70/A95/A102）。
- **工作区**：`docs/modules/relay-light/workspace/RLT_22/`（brief / task_plan / execution_strategy / progress / findings / lesson_candidates / review 七件已由 Windows 侧 builder 建好，W_READY 已落）。task_plan 三批 B1/B2/B3 与每批 check 文件见 task_plan.md「批次切法」。
- **允许路径（闭集）**：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/**`、`docs/modules/relay-light/workspace/RLT_22/**`。**不动** `tools/tests/**`、`install_skill.py`、design、DevPlan、AGENTS.md、其它卡工作区。
- **模式**：手动派活。每个 agent 只做自己那一件事，完成后把结构化信号追加到 `../progress.md`「信号」节末尾并**立即停止**；不等 node_closed、不越位派活、不回头问用户；有疑问写 `BLOCKED`。
- **信号格式**：`DONE task=RLT_22 role=<builder|exec|audit|decide|review> batch=<W|1|2|3|R> status=<W_READY|PASS|FAIL|READY_FOR_REVIEW|CONSTRUCTION_DONE|BLOCKED|APPROVE|APPROVE_WITH_NITS|REQUEST_CHANGES> evidence=<逗号分隔> next=orchestrator`
- **凭据红线**：任何密钥/凭据值不入任何文件。
- **权限**：用户 2026-09-16 明示各 agent 最大权限；worker 可自己 `git commit` 到 `wt/RLT_22`（不 push、不改 master、不动其它 worktree）。提交 scope 用英文 `relay-light`。**只 add 点名文件，禁止 `git add -A` / `git add .`**（`__pycache__` 曾误入树）。
- **环境事实**：本机 Linux，`python3` 3.12、`pwsh` 7.6 在 PATH。单测：`python3 -m unittest tools.relay-light.test_relay_log` 不可用（目录名含连字符），用 `cd tools/relay-light && python3 -m unittest test_relay_log -v` 或 `python3 -m unittest discover -s tools/relay-light -p 'test_*.py'`；全量 runner：`pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`。task_plan 里的 Windows 路径 `D:\MyFiles\...\RLT_22` 在本机对应 `/home/nash/work/dh-relay/.dh-worktrees/RLT_22`。

| herdr 名 | 角色 | 模型 | 何时拉起 | brief |
|---|---|---|---|---|
| rlt22-orch | 编排（Claude 主会话） | — | 常驻 | 本文件 |
| rlt22-build | builder（仅 plan-review FAIL 时修订 task_plan/七件套） | codex gpt-5.6-sol medium | 按需 | builder.md |
| rlt22-audit | 审核：plan-reviewer（W）/ checker（每批） | codex gpt-5.6-sol medium | 立即（审 task_plan）/ 每批 exec DONE 后 | audit.md |
| rlt22-exec | coder | devin swe-2-max | audit PASS task_plan 后，逐批 | exec.md |
| rlt22-decide | decider | codex gpt-6-astra medium | 任一 BLOCKED 时 | decide.md |
| rlt22-monitor | 监督 | devin swe-2-medium | 立即，常驻 | monitor.md |
| rlt22-review / review2 | 复核（normal 三路：代码轮1 / 需求方向 / 教训） | devin swe-2-max | CONSTRUCTION_DONE 后 | review.md |
