<!-- dh:v1 · dispatch/README.md — RLT_09 手动派活协议（编排=Claude 主会话 rlt09-orch，只分发不施工） -->
# RLT_09 派活协议

- **Issue**：https://github.com/nashhu180-netizen/dh-relay/issues/18 · **worktree**：`/home/nash/work/dh-relay/.dh-worktrees/RLT_09`（`wt/RLT_09`，基线 master `b6b7d66`）
- **任务卡**：`docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` §RLT_09（目标 / 非目标 / 五条验收含 A120 承接 RLT_03 的交接断言 / 允许路径 / 实施提示）
- **并入项（用户 2026-09-13 裁决）**：RLT_10 `findings.md` F-003——`relay_log.py` 在 Windows cp1252 下 `status` 输出中文 `UnicodeEncodeError`。本卡在程序入口做 stdout/stderr UTF-8 防护并加单测（单测以强制 ascii/cp1252 编码的 stdout 取得 RED）。
- **允许路径（闭集）**：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/**`、`docs/modules/relay-light/workspace/RLT_09/**`。**`install_skill.py`、`tools/tests/**`、`design/`、`dev_plan/` 不动**。
- **oracle**：design/01 §11 的 HC-RL-A119 / A120 / A121 / A122 / A123 逐字；正文 §4.5（运行中改计划）与 §1314 行「改计划实例的提示词与白名单校验」；DevPlan §RLT_09 验收口径里 A120 的五条交接断言原文。
- **模式**：手动派活（relay-light 账本尚未启用）。每个 agent 只做自己那一件事，完成后把结构化信号追加到 `../progress.md` 并**立即停止**，不等 node_closed、不越位派活、不回头问用户；有疑问写 `BLOCKED` 信号。
- **信号格式**（追加到 `../progress.md` 「信号」节末尾一行，独占一行）：
  `DONE task=RLT_09 role=<builder|audit|exec|decide|review> batch=<n|W|R|X<n>> status=<W_READY|PASS|FAIL|READY_FOR_REVIEW|CONSTRUCTION_DONE|BLOCKED|APPROVE|APPROVE_WITH_NITS|REQUEST_CHANGES> evidence=<逗号分隔> next=orchestrator`
- **凭据红线**：任何密钥/凭据值不入任何文件。
- **权限**：用户 2026-09-13 明示沿用 RLT_08/RLT_10 配方、各 agent 最大权限；worker 可自己 `git commit` 到 `wt/RLT_09`（不 push、不改 master、不动其它 worktree）。提交信息 scope 用英文 `relay-light`。
- **环境事实**：本机 Linux，`python3` 3.12、`pwsh` 7.6 在 PATH；全量回归 `python3 -m unittest tools/relay-light/test_relay_log.py`（约 2.5 分钟，含 RLT_10 新增的 lint --json 用例）与 `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`。跑回归会生成 `tools/relay-light/__pycache__/`，**提交前删掉、不要 `git add -A`**（RLT_10 教训）。
- **task_type=heavy**：复核五路——代码轮 1 先行，其整改闭合后 代码轮 2 / 需求方向 / 一致性 / 教训 四路并发；heavy 另有有效单测要求。

| herdr 名 | 角色 | 模型 | 何时拉起 | brief |
|---|---|---|---|---|
| rlt09-orch | 编排（Claude 主会话） | — | 常驻 | 本文件 |
| rlt09-build | builder（W：七件套 + 分批 task_plan） | codex gpt-5.6-sol medium | 立即 | builder.md |
| rlt09-audit | 审核：plan-reviewer（W）/ checker（每批） | codex gpt-5.6-sol medium | builder W_READY 后 / 每批 exec DONE 后 | audit.md |
| rlt09-exec | coder | devin swe-2-max | audit PASS task_plan 后，逐批 | exec.md |
| rlt09-decide | decider | codex gpt-6-astra medium | 任一 BLOCKED 时 | decide.md |
| rlt09-monitor | 监督 | devin swe-2-medium | 立即，常驻 | monitor.md |
| rlt09-review / review2 / review3 | 复核（heavy 五路） | devin swe-2-max | CONSTRUCTION_DONE 后：review=代码轮1→代码轮2，review2=需求→教训，review3=一致性 | review.md |
