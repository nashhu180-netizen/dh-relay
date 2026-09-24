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
| 2 | coder#b2 | 两层退出与编排级在场者落地：阶段级末节点 node_close / 编排级末 stage_close 退出 0 并 join；编排级在场者改由 `monitor_launch` 账本行推导（O-1 替换，monitor#\<n\>）；空 stage 不满足退出、amend 追加节点重算；退出码 {0,2,3,4} 合同钉住；两 adapter 改写为 watch 默认+前台 wait 1200000 回退+D13 重启循环+D12 存活检查（pgrep/Win32_Process 带 --notify --level stage）+herdr= 约定+stage-stalled；SKILL.md UD-2 三处（watcher 行/硬规则8/放弃项5） | docs/modules/relay-light/workspace/RLT_18/evidence/batch-2/ | 已验证 |
| 3 | coder#b3 | 实测批（只取证不判）：H11 Claude/Codex 分别实测忙碌时 watch 通知去向（均留存于转写并被处理）；H12-① kill watch python → 重启壳不变、≤7s 自动重拉、重拉后 lead 收 `coder#1 -> done`（该交换 pane 原文未保存，以 kill-sequence 同期记录为准）；H12-② 关阶段级 pane（worker=working）→ T2 worker done 无层级观测 → T3 编排 tick 对账 → `stage-stalled RLT18X:C#1` → lead pgrep 存活核命中自匹配幻 PID 判「存活」未重拉；tick 后观察窗约 2 分钟；异常留痕：orch 输入框滞留 ghost tick、codex 会话模型切换 GPT-5.6-Sol→GPT-6-Luna、第二条 `coder#1 -> done` 通知来源未定（findings F-008 待复核）与多条未提交输入草稿 | docs/modules/relay-light/workspace/RLT_18/evidence/batch-3/ | 已取证待人判 |

> 模板：`| <1|2|3> | <coder instance> | <简洁施工进展> | <repo-relative evidence paths> | <已验证|进行中|BLOCKED> |`

## 证据账本

| 证据 ID | batch | 内容 | 路径 | 命令 / 结论 |
|---|---|---|---|---|
| E-101 | 1 | RED：WatchTests 24 用例未实现时全失败（无 `run_watch`/`watch` 子命令） | docs/modules/relay-light/workspace/RLT_18/evidence/batch-1/red.txt | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.WatchTests` → exit 1（3 failures + 21 errors） |
| E-102 | 1 | GREEN：WatchTests 24 用例全过；`watch --help` 展示 `--plan/--notify/--level/--config-dir` | docs/modules/relay-light/workspace/RLT_18/evidence/batch-1/green.txt | 同命令 → exit 0（24 OK） |
| E-103 | 1 | Python 全量回归 245 tests OK（含既有 add/status/lint 合同） | docs/modules/relay-light/workspace/RLT_18/evidence/batch-1/regression-python.txt | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log` → exit 0 |
| E-104 | 1 | pwsh 全仓回归 RELAY ALL PASS（SKIPPED: 1） | docs/modules/relay-light/workspace/RLT_18/evidence/batch-1/regression-pwsh.txt | `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` → exit 0 |
| E-105 | 1 | 路径审计：diff --check 干净；变更仅 `relay_log.py`+`test_relay_log.py`+本批证据；SKILL.md 0 hunk、design/adapter 未触 | docs/modules/relay-light/workspace/RLT_18/evidence/batch-1/path-audit.txt | `git diff --check`/`--name-only`/`--stat` → 符合允许路径闭集 |
| E-106 | 1 | 整改 1（check.batch-1 P1-1）：删除 `tools/relay-light/__pycache__/` 并重跑 §1.1 全 4 条审计（含 `--ignored` __pycache__ 检查 → 空） | docs/modules/relay-light/workspace/RLT_18/evidence/batch-1/path-audit.txt | 4 条全绿；来源排查：一次未登记 `python3 -c` 探针（未带 PYTHONDONTWRITEBYTECODE）import 编译所致，已删除并补录审计 |
| E-201 | 2 | RED：R-A83 新断言在旧实现上失败（无退出逻辑、编排级盯 worker 非 monitor、adapter 无 watch、SKILL UD-2 缺三处）；含 5ab3bba 基线 RED 有效性断言 | docs/modules/relay-light/workspace/RLT_18/evidence/batch-2/red.txt | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest <R-A83 用例>` → FAIL/TIMEOUT 如文 |
| E-202 | 2 | GREEN：WatchTests 39 + SkillAdapterTests 13 + SkillCoreDocTests 12 = 64 全过（3.585s，无真 sleep） | docs/modules/relay-light/workspace/RLT_18/evidence/batch-2/green.txt | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.WatchTests test_relay_log.SkillAdapterTests test_relay_log.SkillCoreDocTests` → exit 0 |
| E-203 | 2 | Python 全量回归 281 tests OK（test_relay_log 262 + test_install_skill 19） | docs/modules/relay-light/workspace/RLT_18/evidence/batch-2/regression-python.txt | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s . -p 'test_*.py'` → exit 0 |
| E-204 | 2 | pwsh 全仓回归 RELAY ALL PASS（SKIPPED: 1，与基线一致的 psmux-real 豁免） | docs/modules/relay-light/workspace/RLT_18/evidence/batch-2/regression-pwsh.txt | `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` → exit 0 |
| E-205 | 2 | 路径审计：本批仅动 5 允许文件+本批证据；禁动路径 --stat 空；SKILL.md 恰 3 hunk（UD-2 三处逐条标注）；`__pycache__` 与 relay_plan/relay_log 工件审计均空 | docs/modules/relay-light/workspace/RLT_18/evidence/batch-2/path-audit.txt | §1.1 四条审计命令全绿 |
| E-301 | 3 | H11-claude：worker done 转换触发 `[relay-light] coder#1 -> done`，于 lead 忙碌窗口（排队 TASK+后台完成事件）到达，转写中 `❯` 按序出现并被后续回合处理（一次曾见排队滞留的 pane 读原文未保存） | docs/modules/relay-light/workspace/RLT_18/evidence/batch-3/H11-claude.md | raw/pane-lead-claude-*.txt + agent-status-poll.log |
| E-302 | 3 | H11-codex：同转换通知于 lead「Waiting for background terminal」期间到达，按序留存转写（`› [relay-light] coder#1 -> done`） | docs/modules/relay-light/workspace/RLT_18/evidence/batch-3/H11-codex.md | raw/pane-lead-codex-0809.txt；启动横幅 GPT-5.6-Sol 与状态栏 GPT-6-Luna 差异已记异常 |
| E-303 | 3 | H12-①：kill 3774076（08:05:40.58）→ 循环壳 3773911 不变 → 新 python 3774542（≤7s）→ 首通 `coder#1 -> done` | docs/modules/relay-light/workspace/RLT_18/evidence/batch-3/H12.md + raw/h12-1-kill-sequence.txt | 逐条命令输出原文 |
| E-304 | 3 | H12-②：T1 08:08:14 关 pane（worker=working）→ T2 ~08:09 worker done → T3 ~08:14:03 tick → orch 对账三命令 → `stage-stalled RLT18X:C#1` → lead pgrep 判「存活（pid 3787534）」未重拉（自匹配幻 PID，08:15:23 复现） | docs/modules/relay-light/workspace/RLT_18/evidence/batch-3/H12.md + raw/pane-orch-t3.txt + raw/pgrep-selfmatch.txt | pane 原文 + 复现记录 |
| E-305 | 3 | 回归与审计：fixture lint×3 exit 0；python 262 tests OK；pwsh RELAY ALL PASS（SKIPPED: 1）；`__pycache__` 空；`git diff --check` 干净；探针 tab/watch 进程零残留 | docs/modules/relay-light/workspace/RLT_18/evidence/batch-3/raw/regressions.txt + raw/cleanup-verify.txt | 命令与 exit 如文 |

> 模板：`| E-<batch><nn> | <1|2|3> | <一句话> | <repo-relative path> | <命令摘要与 exit/OK> |`
