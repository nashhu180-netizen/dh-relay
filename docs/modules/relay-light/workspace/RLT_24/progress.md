# progress — RLT_24

## 日志

| 时间 | 节点 | 事实与下一步 |
|---|---|---|
| 2026-09-17 | W1 | builder 按 dispatch/README.md 与 W1-builder.md 入场，`git rebase --autostash master` 退出 0（up to date）；核对 DevPlan、design oracle、旧实现/测试、71 行历史账本及 RLT_10/RLT_22 先例，建立七件套和 C1→C4 分批计划。W1 不改代码。 |
| 2026-09-17 | C1 | coder#1 按 dispatch/C-coder.md 施工 A155+A2：`git rebase --autostash master` 退出 0；新增 `RelayResourceCloseTests` 8 用例 + `test_a2_all_twenty_events_in_legal_runtime_contexts`，改名 `test_all_nineteen_event_words_pass_lexical_validation`→`test_all_twenty_event_words_pass_lexical_validation`（20 词断言，含 `resource_close ∈ EVENTS`）。relay_log.py：`resource_close` 入 `CONTROL_EVENTS`（第 20 词）；严格 note wire format（`_close_note_fields`/`_decode_close_value`）；`_validate_close_row` 供 add 追加前与 lint 逐行共用；`_lint_command` 在 `lint_plan` 后加 `_lint_ledger` 逐行扫描（非字符串 note 的关闭行走 A155/2，旧事件仍 ledger/4）；`_ledger_warnings` 按解码 object_type 定写入者并对关闭行豁免 A93。先 RED（exit 1，62 断言失败）后 GREEN（10/10 OK）；unittest 212 OK、pwsh 回归 ALL PASS。 |
| 2026-09-17 | C1 | checker FAIL（check.C1.md，P1=1）：「编排空间非 F 首有效 node 退 2」缺实现与双入口反例。整改 r1 先做可行性判断：冻结 wire format 下 `object_type=workspace` 共用枚举、键闭集四键无扩展、`object_id` 无命名约定、计划 schema 无空间标识——无法可靠区分两类空间，checker 反例靠 `orchestrator-ws` 命名辨认属被禁路径。不猜不删判据，findings.md F-C1-04 记合同缺口并移交 decider/编排；代码与测试不改，写 BLOCKED 信号。 |

## 证据账本

| ID | 节点 | 命令/来源 | 结果 |
|---|---|---|---|
| E-W1-01 | W1 | `git rebase --autostash master`; `git rev-parse --short master` | 退出 0；master=`b41cd2d`。 |
| E-W1-02 | W1 | `wc -l docs/modules/relay-light/relay/rlt12-win-01/relay_log.jsonl` | 71 行；原账本只读，后续用 SHA-256 和字节比较证明不变。 |
| E-W1-03 | W1 | `relay_log.py` 的 `_lint_command`、`append_event`、`_validate_event_semantics`、`_validate_writer_handoff`；`test_relay_log.py` 现有 19 词与 A85 用例 | 当前 lint 只校验计划；事件集 19 词；关闭后写入需显式豁免旧 handoff 闸。属计划定位，尚无施工结论。 |
| E-C1-01 | C1 | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseTests test_relay_log.RelayPlanLintTests.test_all_twenty_event_words_pass_lexical_validation`（RED） | 退出 1；Ran 10 tests，62 个断言失败，0 收集错误。代表失败：`error: HC-RL-A2 invalid event: resource_close`（add 全拒）、`20 != 19`（词表断言）、lint 对植入非法关闭行返回 0（尚未读账本）。属有效 RED：期望行为与实现不符。 |
| E-C1-02 | C1 | 同上命令（实现后 GREEN） | 退出 0，Ran 10 tests OK。逐项覆盖：四类 ok 正例（pane→monitor#1@C1、workspace→orchestrator#1@C1、编排 workspace→orchestrator#1@F1、worktree→orchestrator#1@F1）add 0 且植入后 lint 0；缺 object_type/object_id/outcome 各退 2 指名字段；空值/`%20` 纯空白标识、非法与大小写变化枚举、`worktree` 相对路径（`relative%2Ftree`）双入口退 2；合法标识内 `%20` 不 trim 原样落账；wire 正例 `%20/%2B/%3D/%25`、小写 hex、UTF-8、键序自由 8 个全收，反例非法 `%`/无效 UTF-8/解码控制字符/裸 `+`/裸 Tab/裸换行/首尾与双空格/无 `=`/双 `=`/裸非 safe 字符 16 个双入口退 2；重复键（含同值）、未知键、尾随自由文本退 2；非字符串 note 仅 lint 侧 `HC-RL-A155 seq 2: ... note` 退 2，旧事件非字符串 note 仍 `lint: ledger ` 退 4；writer 按解码 object_type 归属（pane→monitor#n/by=monitor，workspace/worktree→orchestrator#n/by=orchestrator），错 writer/错 by 植入各退 A85/2；未知 C9 与 superseded W0 退 A59/2；workspace/pane 非阶段首 node、worktree 非 F 首 node 退 A155/2；终态后+重复关闭行 add 0、seq 独立、无 agent_launch、前后投影一致且 `status --json` errors=[]；植入旧事件错 by/关后事件仍分别报 A85/A93 warning。 |
| E-C1-03 | C1 | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseTests.test_a2_all_twenty_events_in_legal_runtime_contexts` | 退出 0，1 用例 OK。20 个目标词逐词 `add` rc=0 并核行 event/seq：fixture A（close 计划，auto）plan_loaded→stage_start→monitor_launch→node_start→agent_launch→checkpoint→done→node_close→stage_result→stage_close→stage_start(C#1)→monitor_launch→monitor_restart→plan_amend→node_start(C1)→agent_launch→blocked→escalate→decision→resource_close；fixture B（consult 单节点）补 user_decision→resume；fixture C（auto strategist 链）补 user_decision→cancelled；fixture D 补 agent_lost。终断言 `successful == EVENTS` 且 `len(EVENTS)==20`；未知词退 2、账本字节不变由既有 `test_add_rejects_unknown_and_case_changed_events_without_writing` 保持。 |
| E-C1-04 | C1 | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log` | 退出 0，Ran 212 tests OK（旧 203 + 新增 9；改名用例不计新增）。 |
| E-C1-05 | C1 | 仓根 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | 退出 0；全部 suite SUITE PASS，Python 212 + install 7 OK，`RELAY ALL PASS (SKIPPED: 1)`（1 项为既有跳过项）。 |
| E-C1-06 | C1 | `git diff --check`; `git status --porcelain`; `sha256sum docs/modules/relay-light/relay/rlt12-win-01/relay_log.jsonl`; `git diff master --stat -- docs/modules/relay-light/relay/` | diff --check 干净；porcelain 仅 `M tools/relay-light/relay_log.py`、`M tools/relay-light/test_relay_log.py`，无新增 `__pycache__`；历史账本 sha256=`3cd08fdc88e9d51be16997ad9dc1bd92fc89f3c00796345e0a0b3a229a5ed40b`，`relay/` 对 master diff 为空，字节未动。 |
| E-C1-07 | C1 | 整改 r1 判据可行性核对：design/01 L257/L301–320、decision.1.md §2、skill/adapter 命名段、rlt12-win-01 relay_plan schema | 冻结 wire format 下 `object_type=workspace` 无字段/枚举/命名约定可区分阶段空间与编排空间；checker 反例靠 `object_id=orchestrator-ws` 命名辨认，派单禁止此路径。判据「编排空间非 F 首有效 node 退 2」无可实现校验，按派单走 BLOCKED，不改代码不删判据。详见 findings.md F-C1-04。 |

## 信号

DONE task=RLT_24 role=builder node=W1 status=OK ts=2026-09-17T13:20:22+08:00
  summary: 七件套与分批 task_plan 已落盘，共 4 批
  artifacts: brief.md, task_plan.md, progress.md, findings.md, lesson_candidates.md, review.md, execution_strategy.md

DONE task=RLT_24 role=plan-reviewer node=W2 status=REVISE ts=2026-09-17T13:22:16+08:00
  summary: 计划复核 P1=4、P2=0；A2 合法词上下文、worktree 相对路径、状态异常扫描、非字符串 note lint 退出码须整改
  artifacts: review.plan.md

DONE task=RLT_24 role=builder node=W1 status=OK ts=2026-09-17T13:25:43+08:00
  summary: 修订 r1；已处理 review.plan.md 四条 P1
  artifacts: task_plan.md

DONE task=RLT_24 role=plan-reviewer node=W2 status=PASS ts=2026-09-17T13:26:47+08:00
  summary: 复审 r1；上轮 P1 4/4 闭合，本轮新增 P1=0、P2=0
  artifacts: review.plan.md

DONE task=RLT_24 role=coder node=C1 status=OK ts=2026-09-17T14:19:43+08:00
  summary: 新增 9 用例 + 改名 1（19→20 词）；RED exit 1/62 断言失败 → GREEN 10/10；全量 unittest 212/212 OK、pwsh 回归 RELAY ALL PASS
  artifacts: tools/relay-light/relay_log.py, tools/relay-light/test_relay_log.py, progress.md, findings.md, lesson_candidates.md, commit 2dd5d77

DONE task=RLT_24 role=checker node=C1 status=FAIL ts=2026-09-17T14:38:48+08:00
  summary: C1 审核 P1=1、P2=0；编排空间非 F 首节点被 add 接受且缺双入口负例；定向 11/11、Python 212/212、pwsh 全绿
  artifacts: check.C1.md

DONE task=RLT_24 role=coder node=C1 status=BLOCKED ts=2026-09-17T14:45:34+08:00
  summary: 整改 r1：判定冻结 wire format 下 object_type=workspace 无法区分阶段/编排空间（四键闭集、object_id 无命名约定、node 位置不可辨），P1 判据无可实现校验；不猜不删判据，findings F-C1-04 移交 decider/编排；代码未改，commit 2dd5d77 保持
  artifacts: findings.md, progress.md
