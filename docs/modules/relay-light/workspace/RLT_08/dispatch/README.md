<!-- dh:v1 · dispatch/README.md — RLT_08 手动派活协议（编排=Claude 主会话 rlt08-orch，只分发不施工） -->
# RLT_08 派活协议

- **Issue**：https://github.com/nashhu180-netizen/dh-relay/issues/14 · **worktree**：`/home/nash/work/dh-relay/.dh-worktrees/RLT_08`（`wt/RLT_08`，基线 master `851433c`）
- **任务卡**：`docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` §RLT_08（允许路径只有 `AGENTS.md` 与本工作区）
- **oracle**：`docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` §11 的 HC-RL-A28 / A29 / A33 / A34 逐字，正文 §0.3 模块身份、§1.3 核心决策清单第 2/3/7 条、§7.1 分工。
- **模式**：手动派活（relay-light 账本尚未启用）。每个 agent 只做自己那一件事，完成后把结构化信号追加到 `../progress.md` 并**立即停止**，不等 node_closed、不越位派活、不回头问用户；有疑问写 `BLOCKED` 信号。
- **信号格式**（追加到 `../progress.md` 「信号」节末尾一行，独占一行）：
  `DONE task=RLT_08 role=<builder|audit|exec|decide|review> batch=<n|W|R> status=<W_READY|PASS|FAIL|READY_FOR_REVIEW|CONSTRUCTION_DONE|BLOCKED|APPROVE|APPROVE_WITH_NITS|REQUEST_CHANGES> evidence=<逗号分隔> next=orchestrator`
- **凭据红线**：任何密钥/凭据值不入任何文件。
- **权限**：用户 2026-09-13 明示各 agent 最大权限；worker 可自己 `git commit` 到 `wt/RLT_08`（不 push、不改 master、不动其它 worktree）。提交信息 scope 用英文 `relay-light`。

| herdr 名 | 角色 | 模型 | 何时拉起 | brief |
|---|---|---|---|---|
| rlt08-orch | 编排（Claude 主会话） | — | 常驻 | 本文件 |
| rlt08-build | builder（W：七件套 + 分批 task_plan） | codex gpt-5.6-sol medium | 立即 | builder.md |
| rlt08-audit | 审核：plan-reviewer（W）/ checker（每批） | codex gpt-5.6-sol medium | builder W_READY 后 / 每批 exec DONE 后 | audit.md |
| rlt08-exec | coder | devin swe-2-max | audit PASS task_plan 后，逐批 | exec.md |
| rlt08-decide | decider | codex gpt-6-astra medium | 任一 BLOCKED 时 | decide.md |
| rlt08-monitor | 监督 | devin swe-2-medium | 立即，常驻 | monitor.md |
| rlt08-review | 复核（normal 三路：代码轮1 / 需求方向 / 教训） | devin swe-2-max | CONSTRUCTION_DONE 后 | review.md |
