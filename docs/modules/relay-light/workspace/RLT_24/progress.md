# progress — RLT_24

## 日志

| 时间 | 节点 | 事实与下一步 |
|---|---|---|
| 2026-09-17 | W1 | builder 按 dispatch/README.md 与 W1-builder.md 入场，`git rebase --autostash master` 退出 0（up to date）；核对 DevPlan、design oracle、旧实现/测试、71 行历史账本及 RLT_10/RLT_22 先例，建立七件套和 C1→C4 分批计划。W1 不改代码。 |
| 2026-09-17 | C1 | coder#1 按 dispatch/C-coder.md 施工 A155+A2：`git rebase --autostash master` 退出 0；新增 `RelayResourceCloseTests` 8 用例 + `test_a2_all_twenty_events_in_legal_runtime_contexts`，改名 `test_all_nineteen_event_words_pass_lexical_validation`→`test_all_twenty_event_words_pass_lexical_validation`（20 词断言，含 `resource_close ∈ EVENTS`）。relay_log.py：`resource_close` 入 `CONTROL_EVENTS`（第 20 词）；严格 note wire format（`_close_note_fields`/`_decode_close_value`）；`_validate_close_row` 供 add 追加前与 lint 逐行共用；`_lint_command` 在 `lint_plan` 后加 `_lint_ledger` 逐行扫描（非字符串 note 的关闭行走 A155/2，旧事件仍 ledger/4）；`_ledger_warnings` 按解码 object_type 定写入者并对关闭行豁免 A93。先 RED（exit 1，62 断言失败）后 GREEN（10/10 OK）；unittest 212 OK、pwsh 回归 ALL PASS。 |
| 2026-09-17 | C1 | checker FAIL（check.C1.md，P1=1）：「编排空间非 F 首有效 node 退 2」缺实现与双入口反例。整改 r1 先做可行性判断：冻结 wire format 下 `object_type=workspace` 共用枚举、键闭集四键无扩展、`object_id` 无命名约定、计划 schema 无空间标识——无法可靠区分两类空间，checker 反例靠 `orchestrator-ws` 命名辨认属被禁路径。不猜不删判据，findings.md F-C1-04 记合同缺口并移交 decider/编排；代码与测试不改，写 BLOCKED 信号。 |
| 2026-09-17 | C1 | 用户裁决选项 A（decisions.md 第 1 行）：编排空间→F 首节点降为写入者纪律，机器校验只覆盖可计算边界；builder 修订 task_plan r2（commit 4bcaef4），checker 复审 PASS。C1 闭合。 |
| 2026-09-17 | C2 | coder#1 施工 A156 reason 条件：`git rebase --autostash master` 退出 0；新增 `test_a156_five_reason_rejections_add_and_injected_lint`（五反例 × add/lint 双入口，A156 退 2 指名字段）与 `test_a156_failed_reason_search_and_status_schema`（合法 failed 落账、seq+解码 object_id 查回、status --json 键集不扩、failed 不传染阶段）。relay_log.py：`_close_note_fields` 让 `reason=` 空值透传到 outcome 条件层，failed 缺/空/纯空白 reason 与 ok 携带 reason 均报 `HC-RL-A156`，共用函数同时覆盖 add 追加前与 lint 逐行。先 RED（exit 1，6 断言失败）后 GREEN（2/2 OK）；unittest 214 OK、pwsh 回归 ALL PASS。 |
| 2026-09-17 | C3 | coder#1 施工 A158 历史账本兼容：`git rebase --autostash master` 退出 0（与 C4 并行实例同树，按其硬规则此后不再 rebase/stash/reset，不碰 `evidence/`）。新增 `RelayResourceCloseBackwardCompatTests` 3 用例：71 行源账本 sha256 前后不变 + 逐行 `add` 回放 71/71 + 回放副本 lint 0；`git show master:` 取旧实现至 `/tmp/rlt24-*` 与新实现跑同一份复制计划/账本的 `status --json`，逐字段相等（唯一排除键 `agents[].idle_seconds`，now 派生；`last_ts` 账本来源留在比较内；两实现 agent 键集相同，排除对称）；终态副本追加两条合法关闭行（seq72 pane@C1 monitor#1 ok、seq73 worktree@F1 orchestrator#1 failed+reason，七字段连续 seq）lint 0 且 errors/stages/nodes/stable_document 全不变。**首跑 GREEN 3/3**——A158 判据已由 C1/C2 实现自然满足，按 task_plan「不可造假 RED」未改实现代码；unittest 217 OK、pwsh 回归 ALL PASS。 |
| 2026-09-17 | C4 | coder#1 并行实例（rlt24-coder2，与 C3 同树并行）施工 A157 取证：按 C4-parallel 硬规则跳过 rebase、不改代码、不跑全量单测。建 `evidence/fixture/` 自有计划（C1=RLT_24:C#1 首有效节点、F1=RLT_24:F#1 首有效节点），空账本 lint 0。**实跑** `herdr workspace close` 两个不存在探针 id（rlt24-c4-stage-probe / rlt24-c4-orch-probe）各 rc=1 `workspace_not_found`，前后 workspace id 集相同零误触；`orchestrator#1` 写两条 `resource_close outcome=failed`：seq 4 记 C1（阶段空间→所在阶段首节点）、seq 5 记 F1（编排空间→收口 F 首节点，写入者纪律实证）；lint 0、`status --json` errors=[] 且派生不变、seq/object_id 双向检索各恰命中一行；两例处置状态均为待人工处理；rlt12-win-01 账本 sha256 不变、relay/ 对 master diff 为空。证据落 `evidence/A157-stage-workspace.md`、`A157-orchestrator-workspace.md`、`raw/`、`C4-log.md`。 |

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
| E-C2-01 | C2 | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseTests.test_a156_five_reason_rejections_add_and_injected_lint test_relay_log.RelayResourceCloseTests.test_a156_failed_reason_search_and_status_schema`（RED） | 退出 1；Ran 2 tests，6 个断言失败，0 收集错误。五反例 subTest 各跑真实 add+lint：`failed` 无 reason、`reason=%20` 纯空白、`ok` 带非空 reason 均被 add 接受（rc 0 而非 2）；`reason=` 空值走旧 A155「must not be empty」而非 A156；`executed` 计数断言随之失败。属有效 RED：期望的 A156 条件拒绝与实现不符。 |
| E-C2-02 | C2 | 同上命令（实现后 GREEN） | 退出 0，Ran 2 tests OK。五反例 × 两入口全部实跑：`failed` 缺 reason / `reason=` / `reason=%20`（解码纯空白）报 `requires a reason`/`non-empty`；`ok` 带非空与空 reason 报 `must not carry a reason`——add 均退 `error: HC-RL-A156` 且账本字节不变，植入 lint 均退 `lint: HC-RL-A156 seq 2:` 并指名字段、lint 前后字节不变；`executed=5` 断言闭合。合法 `failed reason=permission%20denied`：add 0、lint 0，按 seq + 解码 `object_id=stage-C1` 从 JSONL 查回原行且 reason 解码为 `permission denied`；`status --json` 前后键路径集（顶层及各对象层）相等、无新增字段，非 volatile 字段逐项相等，C#1 stage 保持 `open`/result=None——failed 关闭不传染阶段。 |
| E-C2-03 | C2 | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseTests test_relay_log.RelayPlanLintTests.test_all_twenty_event_words_pass_lexical_validation test_relay_log.RelayPlanLintTests.test_add_rejects_unknown_and_case_changed_events_without_writing` | 退出 0，Ran 13 tests OK（C1 11 + A156 2）。`reason=` 延迟判空未回归既有用例。 |
| E-C2-04 | C2 | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log` | 退出 0，Ran 214 tests OK（212 + 新增 2）。 |
| E-C2-05 | C2 | 仓根 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | 退出 0；全部 suite SUITE PASS，Python 214 + install 7 OK，`RELAY ALL PASS (SKIPPED: 1)`（1 项为既有跳过项）。 |
| E-C2-06 | C2 | `git diff --check`; `git status --porcelain`; `sha256sum docs/modules/relay-light/relay/rlt12-win-01/relay_log.jsonl`; `git diff master --stat -- docs/modules/relay-light/relay/` | diff --check 干净；porcelain 仅 `M tools/relay-light/relay_log.py`、`M tools/relay-light/test_relay_log.py`，无新增 `__pycache__`、无 untracked；历史账本 sha256=`3cd08fdc88e9d51be16997ad9dc1bd92fc89f3c00796345e0a0b3a229a5ed40b`，`relay/` 对 master diff 为空。 |
| E-C3-01 | C3 | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseBackwardCompatTests`（首跑） | 退出 0，Ran 3 tests OK（17s）。**兼容断言首跑 GREEN、无新实现需求**——A158 判据由 C1/C2 实现自然满足，按 task_plan 不造假 RED，实现零改动。覆盖：①源账本读前两 sha256 相等、71 行逐条 `add` 各 rc=0 且 `accepted==71`、回放副本恰 71 行、`lint` rc=0 `lint: ok`、源账本读后再 sha256 不变（`relay/rlt12-win-01/` 只读实证）；②`git show master:tools/relay-light/relay_log.py` 物化至 `/tmp/rlt24-*`（旧实现 `resource_close`/`_lint_ledger` 计数均 0，非自我比较），新旧实现同副本 `status --json` 各 rc=0，stable_document 逐字段相等——唯一排除键 `agents[].idle_seconds`（`now` 派生，CLI 无 `--now` 钉入），`last_ts`/`ledger_silent` 等账本来源字段全在比较内，两实现 agent 键集相同证明排除对称非单边掩盖；③71 行终态副本追加 seq72 `pane`/`monitor#1`/`by=monitor`@C1 `outcome=ok` 与 seq73 `worktree`/`orchestrator#1`/`by=orchestrator`@F1 `outcome=failed reason=permission%20denied`（七字段、seq 连续），lint rc=0，`status --json` 的 errors/stages/nodes/stable_document 前后全等——关闭行是账本事实，不冒充状态派生。 |
| E-C3-02 | C3 | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log` | 退出 0，Ran 217 tests OK（214 + 新增 3；与 C4 并行期耗时 ~736s）。 |
| E-C3-03 | C3 | 仓根 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | 退出 0；全部 suite SUITE PASS，Python 217 + install 7 OK，`RELAY ALL PASS (SKIPPED: 1)`（1 项为既有跳过项）。 |
| E-C3-04 | C3 | `git diff --check`; `git status --porcelain`; `sha256sum docs/modules/relay-light/relay/rlt12-win-01/relay_log.jsonl`; `git diff master --stat -- docs/modules/relay-light/relay/`; `find tools/relay-light -name __pycache__ -o -name "*.pyc"` | diff --check 干净；porcelain 仅 `M tools/relay-light/test_relay_log.py`（C4 批已先行入库，本批不碰 `evidence/`）；历史账本 sha256=`3cd08fdc88e9d51be16997ad9dc1bd92fc89f3c00796345e0a0b3a229a5ed40b`，`relay/` 对 master diff 为空；无 `__pycache__`/`.pyc`。 |
| E-C4-01 | C4 | `lint --plan evidence/fixture --config-dir tools/relay-light/skill`（空账本）；`add plan_loaded`（C1）→`stage_start`→`monitor_launch`（C1，`stage_id=RLT_24:C#1`） | lint rc=0 `lint: ok`；三行各 rc=0，seq 1–3。fixture 计划声明 C1 为 `RLT_24:C#1` 首有效节点、F1 为 `RLT_24:F#1` 首有效节点（均无 superseded 行）。 |
| E-C4-02 | C4 | `herdr workspace list` → `herdr workspace close rlt24-c4-stage-probe` → `herdr workspace close rlt24-c4-orch-probe` → `herdr workspace list`（**实跑**，非打桩） | 两探针各 rc=1，stderr `{"error":{"code":"workspace_not_found",...}}`；前后 id 集同为 `['w15','w2B','w2C','w2E','w2F','w2G']`，6 个在用空间零误触。原始输出存 `evidence/raw/herdr-close-*.std*`。 |
| E-C4-03 | C4 | `add resource_close` ×2（`orchestrator#1`）：seq 4 `object_id=rlt24-c4-stage-probe` @node=C1；seq 5 `object_id=rlt24-c4-orch-probe` @node=F1 | 各 rc=0；`outcome=failed reason=herdr%20workspace_not_found` 合法落账。对应关系：命令参数 id ≡ 行 `object_id`，rc=1 ↔ `outcome=failed`，行 ts 晚于观察时刻。 |
| E-C4-04 | C4 | `lint`/`status --json` 复跑；python 脚本按 seq 与解码 `object_id` 双向检索 `fixture/relay_log.jsonl` | lint rc=0 `lint: ok`（`evidence/raw/lint-after-close-rows.txt`）；status rc=0 `errors=[]`、C1 ready / F1 pending、C#1 open / F#1 pending（`evidence/raw/status-json.txt`）；seq4↔stage-probe、seq5↔orch-probe 各恰命中一行（`evidence/raw/retrieval-by-seq-and-object-id.txt`）。 |
| E-C4-05 | C4 | `sha256sum docs/modules/relay-light/relay/rlt12-win-01/relay_log.jsonl`; `git diff master --stat -- docs/modules/relay-light/relay/`; `git status --porcelain`; `git diff --check` | sha256=`3cd08fdc88e9d51be16997ad9dc1bd92fc89f3c00796345e0a0b3a229a5ed40b` 与 E-C1-06/E-C2-06 一致；`relay/` 对 master diff 为空；porcelain 仅 C3 未提交 `M test_relay_log.py` 与本批 `?? evidence/`；diff --check 干净；无 `__pycache__`。按 C4-parallel 规则未跑全量 unittest（不绑定本批）。 |

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

DONE task=RLT_24 role=builder node=W1 status=OK ts=2026-09-17T14:51:16+08:00
  summary: 修订 r2；按用户裁决选项 A 调整 C1 机器边界与 C4 两类空间取证，保留原 P1/FAIL 留痕；计划提交 4bcaef4
  artifacts: task_plan.md, progress.md

DONE task=RLT_24 role=checker node=C1 status=PASS ts=2026-09-17T14:52:30+08:00
  summary: 复审 r1；原 P1 #1 按用户裁决和 task_plan r2 闭合，新增 P1=0、P2=0；定向 2/2 OK，代码仍为 2dd5d77
  artifacts: check.C1.md

DONE task=RLT_24 role=coder node=C2 status=OK ts=2026-09-17T15:22:08+08:00
  summary: 新增 2 用例（A156 五反例双入口 + 合法 failed 检索/schema 稳定）；RED exit 1/6 断言失败 → GREEN 2/2；全量 unittest 214/214 OK、pwsh 回归 RELAY ALL PASS
  artifacts: tools/relay-light/relay_log.py, tools/relay-light/test_relay_log.py, progress.md, findings.md, lesson_candidates.md, commit 5f7a45d

DONE task=RLT_24 role=checker node=C2 status=PASS ts=2026-09-17T15:41:51+08:00
  summary: C2 审核 P1=0、P2=0；A156 定向 2/2、Python 全量 214/214、PowerShell 总入口均通过
  artifacts: check.C2.md

DONE task=RLT_24 role=coder node=C4 status=OK ts=2026-09-17T16:05:00+08:00
  summary: A157 取证完成：阶段空间/编排空间各一例实跑关闭失败（herdr workspace close 探针 id，rc=1 workspace_not_found，前后空间清单不变零误触）；orchestrator#1 记两条 resource_close failed 行（seq4@C1、seq5@F1，落实「阶段空间→所在阶段首节点 / 编排空间→F 首节点」写入者纪律）；lint 0、status errors=[]、seq/object_id 双向检索命中；两例均待人工处理；历史账本 sha 不变；未改代码、未跑全量单测（C4-parallel 口径）
  artifacts: evidence/A157-stage-workspace.md, evidence/A157-orchestrator-workspace.md, evidence/C4-log.md, evidence/fixture/, evidence/raw/, progress.md, findings.md, lesson_candidates.md, commit 8cd513b

DONE task=RLT_24 role=checker node=C4 status=PASS ts=2026-09-17T16:06:06+08:00
  summary: C4 审核 P1=0、P2=0；两类实跑失败行 seq4@C1/seq5@F1 与 seq/object_id 检索一致，独立 lint/status 通过，C3 未提交测试改动未触碰
  artifacts: check.C4.md

DONE task=RLT_24 role=coder node=C3 status=OK ts=2026-09-17T16:20:55+08:00
  summary: A158 历史账本兼容断言落地：新增 RelayResourceCloseBackwardCompatTests 3 用例（71 行源账本 sha256 前后不变+逐行 add 回放 71/71+回放副本 lint 0；git show master 旧实现与新实现 status --json 稳定字段逐字段相等，唯一排除 agents[].idle_seconds；终态副本追加两条合法关闭行 lint 0 且投影不变）；首跑 GREEN 3/3——兼容判据已由 C1/C2 实现自然满足，实现零改动不造假 RED；全量 unittest 217/217 OK、pwsh 回归 RELAY ALL PASS；历史账本 sha256 不变
  artifacts: tools/relay-light/test_relay_log.py, progress.md, findings.md, lesson_candidates.md, commit aba9e8d

DONE task=RLT_24 role=checker node=C3 status=PASS ts=2026-09-17T16:24:34+08:00
  summary: C3 审核 P1=0、P2=0；A158 定向 3/3 OK，三种 /tmp 故障注入均被对应测试检出；核对 coder 登记的 Python 217/217 与 pwsh 总入口通过
  artifacts: check.C3.md
