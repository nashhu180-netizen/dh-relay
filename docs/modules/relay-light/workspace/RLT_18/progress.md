<!-- progress.md — 施工进展与验证证据索引；不是运行真相 -->
# progress — RLT_18

## 写入合同

- 仅当前顺序执行的 batch coder 在自己 batch 完成时追加：「施工里程碑」一行 + 「证据账本」本批证据行。
- builder（plan 阶段）只建本骨架；monitor、reviewer、decider、orchestrator 禁止写本文件。
- 禁止记录 pane/agent 状态、轮询、通知、终端输出或运行快照。
- 恢复权威是 durable signals + 独立 review/decision 工件 + `execution_strategy.md` + Herdr 实态；本文件只作施工证据索引。

## 施工里程碑

| batch | coder | 里程碑 | 证据引用 | 结论 |
|---|---|---|---|---|
| 1 | coder#b1 | watch 核心落地：`relay_log.py watch --plan --notify [--level stage|plan] [--config-dir]`；每在场 agent 一线程 wait→prompt→30s get 轮询；终态退出 / working 重挂 / (agent,状态) 去重 / 1200s tick；启动读失败 2s×2 重试、运行期重读失败不退出；A101 静态+运行旁证只读 | docs/modules/relay-light/workspace/RLT_18/evidence/batch-1/ | 已验证 |

> 模板：`| <1|2|3> | <coder instance> | <简洁施工进展> | <repo-relative evidence paths> | <已验证|进行中|BLOCKED> |`

## 证据账本

| 证据 ID | batch | 内容 | 路径 | 命令 / 结论 |
|---|---|---|---|---|
| E-101 | 1 | RED：WatchTests 24 用例未实现时全失败（无 `run_watch`/`watch` 子命令） | docs/modules/relay-light/workspace/RLT_18/evidence/batch-1/red.txt | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.WatchTests` → exit 1（3 failures + 21 errors） |
| E-102 | 1 | GREEN：WatchTests 24 用例全过；`watch --help` 展示 `--plan/--notify/--level/--config-dir` | docs/modules/relay-light/workspace/RLT_18/evidence/batch-1/green.txt | 同命令 → exit 0（24 OK） |
| E-103 | 1 | Python 全量回归 245 tests OK（含既有 add/status/lint 合同） | docs/modules/relay-light/workspace/RLT_18/evidence/batch-1/regression-python.txt | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log` → exit 0 |
| E-104 | 1 | pwsh 全仓回归 RELAY ALL PASS（SKIPPED: 1） | docs/modules/relay-light/workspace/RLT_18/evidence/batch-1/regression-pwsh.txt | `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` → exit 0 |
| E-105 | 1 | 路径审计：diff --check 干净；变更仅 `relay_log.py`+`test_relay_log.py`+本批证据；SKILL.md 0 hunk、design/adapter 未触 | docs/modules/relay-light/workspace/RLT_18/evidence/batch-1/path-audit.txt | `git diff --check`/`--name-only`/`--stat` → 符合允许路径闭集 |

> 模板：`| E-<batch><nn> | <1|2|3> | <一句话> | <repo-relative path> | <命令摘要与 exit/OK> |`
