<!-- dh:v1 · dispatch/README.md — RLT_21 手动派活协议（编排=Claude 主会话 rlt21-orch，只分发不施工） -->
# RLT_21 派活协议

- **Issue**：https://github.com/nashhu180-netizen/dh-relay/issues/21 · **worktree**：`/home/nash/work/dh-relay/.dh-worktrees/RLT_21`（`wt/RLT_21`，基线 master `51d8062`）
- **任务卡**：`docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` §RLT_21（目标 / 非目标 / 七条验收 A137～A143 / 允许路径 / 实施提示）；规划事件 RLT-A-08/RLT-B-07 记录在 `design/evidence/09-交叉审核记录-RLT-A08-Linux预演回流.md`。
- **oracle**：design/01 §11.1 HC-RL-A137 / A138 / A139 / A140 / A141 / A142 / A143 逐字；正文 §3.4 `stage_result` 行、§4.2 `launch` 列、§5.2.1「环境性 NOT_RUN 出口」、§7.3「静默超时」；A112 收窄后的原文；A96 / A114 / A69 / A107 / A113 原文（A142 是它们的实现承接，ID 不改）。
- **事实来源（不重跑预演）**：`docs/modules/relay-light/workspace/RLT_12/evidence/linux-dry-run/README.md` DR-F-001～006；预演账本在分支 `dryrun/rlt12-linux` 的 `docs/modules/relay-light/relay/dryrun-linux-01/relay_log.jsonl`（只读参考，`git show dryrun/rlt12-linux:<path>`）；`workspace/RLT_07/findings.md` F-002 / F-003 与 `test_relay_log.py` 里两条 `@unittest.skip` 负例。
- **允许路径（闭集）**：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/**`、`docs/modules/relay-light/workspace/RLT_21/**`。**`install_skill.py`、`tools/tests/**`、`design/`、`dev_plan/`、`.gitignore`、其它 workspace 不动**。两侧用户目录 `~/.claude|~/.codex/skills/relay-light/` 的重同步需用户当次授权，worker 不得自行执行 `install_skill.py --all`。
- **模式**：手动派活。每个 agent 只做自己那一件事，完成后把结构化信号追加到 `../progress.md` 并**立即停止**；有疑问写 `BLOCKED` 信号，不问用户。
- **信号格式**（`../progress.md`「信号」节末尾独占一行）：
  `DONE task=RLT_21 role=<builder|audit|exec|decide|review> batch=<n|W|R|X<n>> status=<W_READY|PASS|FAIL|READY_FOR_REVIEW|CONSTRUCTION_DONE|BLOCKED|APPROVE|APPROVE_WITH_NITS|REQUEST_CHANGES> evidence=<逗号分隔> next=orchestrator`
- **凭据红线**：任何密钥/凭据值不入任何文件。
- **权限**：用户 2026-09-14「开21」沿用 RLT_08/09/10 配方、各 agent 最大权限；worker 可自己 `git commit` 到 `wt/RLT_21`（不 push、不改 master、不动其它 worktree）。提交信息 scope 用英文 `relay-light`。
- **环境事实**：本机 Linux，`python3` 3.12、`pwsh` 7.6；全量回归 `python3 -m unittest tools/relay-light/test_relay_log.py`（约 3 分钟）与 `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`。跑回归会生成 `tools/relay-light/__pycache__/`，**提交前删掉、不要 `git add -A`**。本机 codex `--sandbox read-only` 起不来（bwrap loopback），所有 codex 角色一律 `--dangerously-bypass-approvals-and-sandbox`，只读靠 brief 约束。
- **task_type=normal**：复核三路——代码轮 1 / 需求方向 / 教训；normal 另有有效单测要求。

| herdr 名 | 角色 | 模型 | 何时拉起 | brief |
|---|---|---|---|---|
| rlt21-orch | 编排（Claude 主会话） | — | 常驻 | 本文件 |
| rlt21-build | builder（W：七件套 + 分批 task_plan） | codex gpt-5.6-sol medium | 立即 | builder.md |
| rlt21-audit | 审核：plan-reviewer（W）/ checker（每批） | codex gpt-5.6-sol medium | builder W_READY 后 / 每批 exec DONE 后 | audit.md |
| rlt21-exec | coder | devin swe-2-max | audit PASS task_plan 后，逐批 | exec.md |
| rlt21-decide | decider | codex gpt-6-astra medium | 任一 BLOCKED 时 | decide.md |
| rlt21-monitor | 监督 | devin swe-2-medium | 立即，常驻 | monitor.md |
| rlt21-review / review2 | 复核（normal 三路） | devin swe-2-max | CONSTRUCTION_DONE 后：review=代码轮1，review2=需求→教训 | review.md |
