<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_24 resource_close

修订日志：2026-09-17 r1，依据 `review.plan.md` P1 #4a/#4b/#5/#6：补 A2 二十词合法运行映射、worktree 相对路径反例、`_ledger_warnings` 读侧归属与关后豁免、非字符串 note 的失败层级与退出码。

## Context Packet 与执行契约

施工 worker 只处理派单指定的一个 C 批。进入 `/home/nash/work/dh-relay/.dh-worktrees/RLT_24` 后第一项 Git 动作为 `git rebase --autostash master`；读 `AGENTS.md`、`dispatch/README.md`、`dispatch/C-coder.md`、本卡 brief/progress/findings、本计划和下表。DevPlan §RLT_24 冻结范围，design/01 §3.4 与 §11.1 为逐字 oracle；不以本计划替换 oracle。读 source 只为找到落点，不能把当前行为误写成目标合同。

| ID | 来源 | 需核的事实 |
|---|---|---|
| CP-1 | DevPlan `#### RLT_24`；design/01 §3.2 note 例外、§3.4 242–330、§11.1 A2/A85/A155–A158、§12 1360–1370 | 目标、wire format、add/lint 拒绝时点、验收与禁改边界 |
| CP-2 | `tools/relay-light/relay_log.py` | `CONTROL_EVENTS`/`EVENTS`/`AGENT_EVENTS`、`CONTROL_WRITERS`/`WRITER_BY_EVENT`、`_validate_event`、`_authorize_agent`、`_validate_runtime_event`/`_validate_event_semantics`、`_validate_writer`、`_validate_writer_handoff`、`append_event`、`read_ledger`、`_lint_command`、`_ledger_warnings`、`derive_status`/`status_document` |
| CP-3 | `tools/relay-light/test_relay_log.py` | `RelayCliTestCase` fixture helpers、`test_all_nineteen_event_words_pass_lexical_validation`、`test_add_rejects_unknown_and_case_changed_events_without_writing`、`test_by_is_derived_from_agent_prefix_under_the_frozen_writer_contract`、`RelayLifecycleTests.test_writer_consistency_exits_two_for_every_frozen_owner`、`RelayBackwardCompatTests` |
| CP-4 | `docs/modules/relay-light/relay/rlt12-win-01/relay_plan.md` 与 `relay_log.jsonl` | 71 行真实旧账本，只读；历史源字节不变 |
| CP-5 | `workspace/RLT_11/findings.md` F-004；`workspace/RLT_10`、`workspace/RLT_22` 的 brief/task_plan | 问题来源和标准档计划样式，不作为新验收 oracle |

## 共同约束与每批收口

- 允许路径闭集：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`docs/modules/relay-light/workspace/RLT_24/**`。不改 design、DevPlan、skill、as-built、历史 `docs/modules/relay-light/relay/**` 或其它工作区。不改 herdr，不追溯旧账本，不扩对象类型。skill/as-built 需同步时只记 `findings.md` 转派。
- 每批先新增有意义的行为单测并运行到 **有效 RED**（期望字段/退出码与程序行为不符）；记录命令、退出码和失败摘要。导入、路径、解释器、fixture 故障不算有效 RED。再最小实现至 GREEN，记录同一测试命令、退出码和断言要点。每批独立可完成并自证。
- 每批在 `progress.md` 追加时间线和 E-Cn-* 证据；由 coder 更新 `findings.md`、`lesson_candidates.md`（无则写「本批无」）；coder 用四行小结：改动、RED/GREEN、回归、风险/范围外发现。不得改 DevPlan 状态列。
- 每批跑两条完整回归并登记各自退出码：`cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log`；从仓根 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`。所有 Python/PowerShell 测试和脚本命令均带 `PYTHONDONTWRITEBYTECODE=1`；目录名含连字符，不用 dotted 模块路径。
- 每批执行 `git diff --check`；`git diff master --name-only` 与 working tree/index/untracked 四集合逐个检查，仅允许闭集路径；`git status --porcelain` 不得出现**新增** `__pycache__`，已有缓存只登记不删；历史 `relay/**` 字节不动。仅 `git add` 点名文件，commit scope 为英文 `relay-light`，不 push。
- 每批完成后由编排派 checker，结论留 `check.Cn.md`。checker PASS 前不续下一批。coder 按 `dispatch/C-coder.md` 的格式写 DONE 后即停；BLOCKED 写 `progress.md` 结构化信号，交 decider/编排。

## C1 — A155 + A2：事件基础合同与共用校验

**前置**：W2 plan-review PASS。**本批目标**：第 20 词、三个对象的 `ok` 关闭事实、基础 note 语法/值/归属/node 规则，在 add 与 lint 两入口同一校验集；不处理 `reason` 与 `outcome` 的条件关系（C2 承接）。

**改动落点**：

1. `test_relay_log.py` 的 `RelayCliTestCase` 下新增 `RelayResourceCloseTests`（或等价独立类），复用 `write_plan`、`run_add`、`run_lint_cli`，为 lint 反例直接向**临时 fixture** 的 JSONL 植入一条顶层七字段/seq 合法而 note/归属非法的行；不能先通过 add 写入再误称 lint 拒绝。通用反例 helper 同时断言 add `returncode=2`、失败前后 `read_bytes()` 相同、lint `returncode=2` 且错误指明 `seq` 和字段/原因，lint 前后字节相同。无账本时用不存在/空文件前后等价判断。
2. `relay_log.py` 的 `CONTROL_EVENTS`/`EVENTS` 扩第 20 词，`AGENT_EVENTS` 自动排除新控制事件；`_validate_event` 保留未知词 A2 fail closed。`CONTROL_WRITERS`/`WRITER_BY_EVENT` 对该词按**解码后的**对象类别确定 owner，避免用单一 writer 常量硬套。`_authorize_agent`、`_validate_runtime_event`、`_validate_event_semantics`、`_validate_writer` 和 `_validate_writer_handoff` 需要允许 §3.4 的控制语义：有效非 superseded node，阶段空间用该阶段首个有效 node，编排空间/worktree 用 F 阶段首个有效 node；可在 `node_close`、`stage_close` 后记录，可重复，不要求 `agent_launch`，不进入 `_validate_agent_transition`。禁止把所有控制事件的 handoff 规则一并放松。`object_type=worktree` 的 `object_id` 解码后须为绝对路径；相对路径即使编码合法也退 2。
3. 新建只针对 `resource_close` 的严格 note 解析/校验函数，供 `append_event` 的追加前路径和 `_lint_command` 的读账路径共用；不要复用会 `split()` 并首键胜出的 `_note_tokens`。token 恰一个裸 `=`，单 ASCII 空格分隔且无首尾/连续空格、Tab、裸换行；键仅 `object_type/object_id/outcome/reason` 且无重复；值裸字符 `[A-Za-z0-9._~-]`，其它按 UTF-8 字节 `%HH`（大小写十六进制均收）；只解码一次，拒绝裸 `+`、非法 `%`、无效 UTF-8、解码控制字符；解码后空/纯空白标识拒绝，普通内部空格保留；枚举大小写敏感。其它事件的自由 note 不解析。
4. `_lint_command` 当前只调 `lint_plan`。在计划通过后增加**逐行**账本语义检查，只对新事件启用严格关闭校验；直接植入非法关闭行须按设计退出 2，说明 `seq`/字段/原因；合法历史行保持兼容。`read_ledger` 的通用 JSON、七字段、连续 `seq` 检查先行。**非字符串 note 的特殊分流**：当前 `read_ledger` 在所有字符串字段类型检查处先退 `ledger`/4；为 `resource_close` 保留已解析的 event 与原始 note 值，在通用 JSON/七字段/seq 通过后将其非字符串 note 交给同一关闭语义校验入口，退 `HC-RL-A155`/2 并指出 `seq`/`note`；其它事件的非字符串字段仍走既有 `ledger`/4，通用错误口径不变。CLI `--note` 只能传字符串，故非字符串只在直接植入行后的 lint 侧测试；不能把此用例写成 add 的可构造反例，也不能依赖尚未执行的解析函数宣称覆盖。
5. `_ledger_warnings` 当前两处直接取 `WRITER_BY_EVENT[event]`，并把任何 `stage_close` 后的行标 A93。新增事件的只读状态诊断须按**已解码 `object_type`** 判 owner（pane=monitor，其余两类=orchestrator），合法 `resource_close` 不因 `stage_close` 后或无 `stage_start` 被报 A93；不往 `status --json` 添加字段。非法植入行仍由 lint 退 2；旧事件 A85/A93 的 warning 逻辑及既有测试保持原样。测试须在 `status --json` 的 `errors` 实际断言无新增异常，不只比 node/stage 投影。
6. 改现有 `test_all_nineteen_event_words_pass_lexical_validation` 为 20 词断言；另建 `test_a2_all_twenty_events_in_legal_runtime_contexts`，按下表逐词走合法计划/账本前缀、合法 agent/node/note 做 `add` 0 和新行 event/seq 校验，并断言已成功的目标词集合**恰等于** `EVENTS` 且大小为 20；不能仅调用 `_validate_event`。未知词退 2、字节不变的既有测试保留。A85 既有四个越权反例不变；新事件的条件 writer 测试归 A155，依据 design §3.4 第 320 行，勿改旧 A85 的法定枚举文字。

**A2 二十词逐词合法上下文映射**（每行代表一个目标事件的成功 `add`，可共享合法前缀，但要逐词记录 rc=0 与追加行）：

| 目标词 | 合法上下文、writer 与必需字段/前缀 |
|---|---|
| `plan_loaded` | 空账本，首行；`orchestrator#1`，`node=W1`，`note=skill=0.1.0`，provenance 由程序补。 |
| `stage_start` | `plan_loaded` 后；`orchestrator#1`，阶段首有效 `W1`，`stage_id=DHR_90:W#1`。 |
| `monitor_launch` | 本阶段 `stage_start` 后；`orchestrator#1`，相同 `stage_id`。 |
| `node_start` | `monitor_launch` 后，依赖已关；`monitor#1`，目标节点 `W1`。 |
| `agent_launch` | `node_start` 后，本节点表有 `builder`；`builder#1`。 |
| `checkpoint` | `builder#1` 已 launch、未终态；普通自由 note，无强制 ready token。 |
| `done` | 同一 `builder#1` 活实例，可在 checkpoint 后终态；无待配对复核信号。 |
| `node_close` | builder 已 `done`，close agent 条件满足；`monitor#1`。 |
| `stage_result` | 本实例全部节点已 closed；`monitor#1`，`stage_id=DHR_90:W#1 outcome=done`。 |
| `stage_close` | 最新 stage_result 为 done；`orchestrator#1`，同一 `stage_id`。 |
| `monitor_restart` | 另开 C 阶段 `stage_start`/`monitor_launch` 后；`monitor#1`，同阶段有效 `node=C1`。 |
| `plan_amend` | C 阶段运行中；`monitor#1`，`node=C1`，`note=decision.2.md nodes=C3,C4`（已有 `RelayLifecycleTests.test_plan_amend_requires_monitor_and_complete_note_and_is_repeatable` 成功路径可作 fixture 锚点）。 |
| `blocked` | C 节点 `node_start`、`coder#1 agent_launch` 后；`coder#1` 发 blocked。 |
| `escalate` | 同一 coder blocked 后；`coder#1`，`note=decider=decider#1`。 |
| `decision` | 对应 escalate 后；同一 coder，重复同一 `decider=decider#1`。 |
| `user_decision` | **独立 consult fixture** 的 decision 后；同一 coder，合法用户决定 note（参照 `test_decision_and_user_decision_must_resume_before_original_agent_done`）。 |
| `resume` | auto fixture 的 decision 后，或 consult fixture 的 user_decision 后；同一 coder。 |
| `agent_lost` | **独立活实例 fixture**：本节点 coder launch 后，`agent=coder#1` 记失联，行的 `by=monitor` 由该 agent 事件规则得出；随后才可重拉，本词目标行只需前半段。 |
| `cancelled` | **独立 strategist fixture**：按 `test_a114_strategist_chain_cancelled_finale` 的 escalate→strategist launch→decision→strategist done→user_decision 后，对触发 coder 写 cancelled；不把它简化成任意活 agent 的直接取消。 |
| `resource_close` | pane：`monitor#1` + 阶段首有效 node + `object_type=pane object_id=pane-7 outcome=ok`；另由 A155 正例证明 workspace/worktree 条件 writer；允许关后前缀。 |

此表也可在现有成功用例间建立明确映射，但 C1 必须有**一个可执行的汇总断言**核对上述 20 个目标词的合法 add 结果；仅对已有单测名称做静态 grep 或只核长度不算 A2 完成。

**测试清单（名称可用下列精确名；改名须在 progress 做旧→新映射）**：

| 用例 | 对应 oracle 要素与断言 |
|---|---|
| `test_a155_three_ok_object_types_add_and_injected_lint` | pane、workspace、worktree 三个合法 `ok` 正例，各自 add 0、植入后 lint 0；writer/by、node 按 §3.4 取值；worktree 标识用绝对路径。 |
| `test_a155_missing_base_keys_add_and_injected_lint` | 分别缺 `object_type`、`object_id`、`outcome`，每例 add/lint 各退 2。 |
| `test_a155_blank_id_invalid_type_and_outcome_add_and_lint` | 空标识、`%20` 纯空白标识、非法/大小写变化的 `object_type` 与 `outcome`，以及 `object_type=worktree object_id=relative%2Ftree outcome=ok` 相对路径，各例 add/lint 退 2 且 add 前后账本字节一致；合法标识中的 `%20` 不被 trim 改写，绝对路径正例由三类对象用例证明。 |
| `test_a155_wire_encoding_and_token_grammar_add_and_lint` | 正例 `%20/%2B/%3D/%25`、大小写 hex、UTF-8、多值顺序；反例非法 `%`、无效 UTF-8、控制字符、裸 `+`、裸 Tab/换行、首尾/双空格、无等号/双等号、裸非 safe 字符，各例 add/lint 退 2。 |
| `test_a155_duplicate_unknown_and_non_string_note_add_and_lint` | 重复键（同值也拒）、未知键、尾随自由文本各经 add/lint 退 2；非字符串 note 仅直接植入顶层 JSONL 行测 lint `HC-RL-A155`/2 且错误含 seq/note；另植入一个**旧事件**非字符串 note，核仍按既有通用 `ledger`/4 失败。CLI `--note` 只能传字符串，不造无法执行的 add 反例。 |
| `test_a155_wrong_writer_and_node_add_and_lint` | pane 用 orchestrator、workspace/worktree 用 monitor、未知/superseded node、阶段 workspace 非首有效 node、编排空间/worktree 非 F 首有效 node，各经 add/lint 退 2；错误 `by` 只可直接植入行后测 lint（add 的 `by` 由 agent 派生）；writer 的 agent 前缀与 by 一致性同时核。 |
| `test_a155_after_terminal_and_repeated_close_preserve_projection` | `node_close` 与 `stage_close` 后仍可 add 合法关闭行；同一对象连续关闭尝试有不同 seq；无 `agent_launch`；前后 node/stage/agent 状态派生相同；pane/workspace/worktree 三类合法行的 `status --json` 均 `errors=[]`，证明 `_ledger_warnings` 不误报 A85/A93。`last_writer` 等行事实字段另行观察，不当作状态机状态。 |
| `test_a155_status_warnings_preserve_old_a85_a93` | 直接植入旧事件错误 writer 与关后旧事件，`status --json` 仍分别报 A85/A93；新事件豁免不放宽旧检查。 |
| `test_all_twenty_event_words_pass_lexical_validation`、`test_a2_all_twenty_events_in_legal_runtime_contexts`、`test_add_rejects_unknown_and_case_changed_events_without_writing` | A2 词表长度 20 + 上表 20 词逐个合法上下文 add 0/行字段正确 + 未知词退 2、前后字节一致；A85 旧反例原样通过。 |

**RED→GREEN 与机械完成**：先加以上单测，运行 `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseTests test_relay_log.RelayPlanLintTests.test_all_twenty_event_words_pass_lexical_validation`，预期 RED 为未实现事件/语义导致的断言失败；实现后同命令退出 0。若用例改名，同步命令与 progress。除 `rg -n 'assertEqual\(20, len\(EVENTS\)\)|resource_close' tools/relay-light/test_relay_log.py` 外，必须运行 `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseTests.test_a2_all_twenty_events_in_legal_runtime_contexts`（cwd 为 `tools/relay-light`）并在 E-C1-* 记 20 个成功目标词、各目标行/rc 与 `set(successful_events)==EVENTS` 的证据；未知词的账本字节比较、相对路径双入口反例、非字符串 note 失败层级、三类关闭行的 `status --json errors=[]` 和旧 A85/A93 warning 保留都须逐项记录。再跑共同回归。证据落 `progress.md` E-C1-*，必要的临时 fixture 生成代码在测试文件中；不得把历史账本改成 fixture。

## C2 — A156：reason 条件与可检索失败事实

**前置**：C1 checker PASS。**目标**：在 C1 基础字段合法时，`failed` 必须有非空非纯空白 `reason`，`ok` 完全没有 `reason` 键；合法失败是一条可查询事实，lint 0，状态 JSON 字段不扩。

**改动落点**：`test_relay_log.py` 的 `RelayResourceCloseTests` 增下列用例；`relay_log.py` 的 C1 共用关闭 note 校验函数加入 reason 条件，`append_event`/`_lint_command` 保持同一函数与先验失败时点。`status_document` 不加字段。

| 用例 | 对应 oracle 要素与断言 |
|---|---|
| `test_a156_five_reason_rejections_add_and_injected_lint` | 五反例逐个 add 与直接植入后的 lint 均退 2：failed 无 reason、`reason=`、`reason=%20` 或等价解码纯空白、ok 带非空 reason、ok 带空 reason。其它三基础字段全合法；每次 add 前后账本字节相同，lint 给 seq/字段/原因且不修复。 |
| `test_a156_failed_reason_search_and_status_schema` | 带有效 `reason=permission%20denied` 的 failed add 0、lint 0；从真实 JSONL 按 `seq` 与解码 `object_id` 检索回原行并核原 reason；与插入前 `status --json` 的键集合（顶层及既有各对象层）一致，未新增 resource 字段；failed 不使阶段自动 failed。 |

先加测试运行 `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseTests.test_a156_five_reason_rejections_add_and_injected_lint test_relay_log.RelayResourceCloseTests.test_a156_failed_reason_search_and_status_schema` 取得有效 RED；实现后同命令 exit 0，再跑共同回归。另从测试结果核对五反例 × 两入口全执行，非只用 `subTest` 名义覆盖。证据落 `progress.md` E-C2-*。

## C3 — A158：旧账本字节兼容与稳定状态

**前置**：C2 checker PASS。**目标**：历史 `rlt12-win-01` 71 行源字节不变；逐条旧事件被新 `add` 接受，新 `lint` 0；固定输入的旧/新 `status --json` 稳定字段一致；含合法关闭行 fixture 也 lint 0 且 agent/node/stage 派生不变。

**改动落点**：仅 `test_relay_log.py` 增 `RelayResourceCloseBackwardCompatTests`，可复用 `RelayBackwardCompatTests` 的 fixture 处理，但不得改历史文件。旧实现通过 `git show master:tools/relay-light/relay_log.py > /tmp/rlt24-*/relay_log_base.py` 取到临时目录并对**同一份复制的计划/账本、同一 config、固定时间输入**运行 `status --json`；若 CLI 内动态 now 影响投影，则测试层明确只投影稳定字段并逐字段比较，排除 `last_ts`、`idle_seconds` 等动态时间字段，列出排除键，不能删除不相等的稳定字段来凑绿。

| 用例 | 对应 oracle 要素与断言 |
|---|---|
| `test_a158_historical_source_bytes_and_71_row_replay` | 对历史源在前后计算 SHA-256/`read_bytes()`；assert 71 行；逐条以旧行 event/node/agent/note 喂新 add 均 0，成功数恰 71；重放副本 lint 0；原源绝不写入。`plan_loaded` provenance 在重放目标里可按既有行为变化，不误判源字节变动。 |
| `test_a158_old_and_new_status_stable_fields_equal` | 旧/新实现对同一原样副本运行 `status --json` 均 0；明确抽出 plan/current/open/pending/superseded/stage/node/agent 状态等稳定字段（动态时间排除），逐字段相等；保存基线命令、master SHA 与比较字段清单。 |
| `test_a158_close_row_fixture_lints_and_preserves_projection` | 在工作区或临时目录的副本植入合法 `resource_close` 行，保证连续 seq 和七字段，lint 0；前后 agent/node/stage 派生结果相同；可变化的最后写入者事实不冒充状态派生。 |

先加测试运行 `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayResourceCloseBackwardCompatTests` 得有效 RED（A158 在 C1/C2 后可能已自然 GREEN；若如此，记录“兼容断言首跑 GREEN、无新实现需求”，不可造假 RED）；然后做必要的最小实现、同命令 GREEN，并跑共同回归。命令/原源与副本 SHA-256、旧实现路径、71/71 与稳定字段比较结果登记 `progress.md` E-C3-*；临时基线文件放 `/tmp/rlt24-*` 且不入仓。

## C4 — A157：两类终端空间关闭失败取证

**前置**：C3 checker PASS。**目标**：按 design §12 的「阶段的终端空间与 pane」及「编排的终端空间」两行，各做一例可控关闭失败，完成命令观察→合法失败行→按 seq/object_id 查回→处置记录，且不操作真实在用资源。

**改动落点**：只新增本卡 `evidence/` 和更新 `progress.md`；若取证暴露 C1/C2 程序缺陷，可在允许路径内做最小修复并补对应单测，记录 RED→GREEN，交 checker 复核。本批不改设计正文、herdr 或历史账本。

| 证据/核验名 | 对应 oracle 要素与断言 |
|---|---|
| `evidence/A157-stage-workspace.md` | 阶段空间：标明实跑或打桩；关闭不存在的测试 id 或 stub 的命令与实际报错/返回码；在本卡 fixture 计划的账本用 `agent=orchestrator#n`、阶段首有效 node 写合法 `object_type=workspace outcome=failed reason=...` 行；展示原 JSONL 行、seq/object_id 检索输出、账本路径；写人工处置或“待人工处理”，不冒称已处理。 |
| `evidence/A157-orchestrator-workspace.md` | 编排空间：同样四要素；用 F 阶段首有效 node，写入者 orchestrator；独立失败观察、独立 seq 与 object_id 查回。 |
| `test_a157_evidence_replay`（需要时） | 若以脚本/测试实现可控 stub，断言两个独立对象均有失败行、`lint` 0、按 seq/object_id 命中；脚本/测试仍在允许路径且带 `PYTHONDONTWRITEBYTECODE=1`。 |

取证步骤：先在 `evidence/fixture/` 建自有合法最小 `relay_plan.md`（可从测试 helper 生成；不复制到历史 `relay/**`），确认 `lint` 0；执行两次安全失败观察，记原始命令和输出（先按白名单过滤凭据）；按实际观察调用新 `add` 写 `reason`，记退出 0、原行与 lint 0；从 JSONL **实际**用 seq 与 object_id 两键查回并保存输出。实跑可选 `herdr workspace close <不存在的测试 id>`；若本机命令签名不符或会误触在用资源，使用可审计 stub，并明确“打桩”。失败记录落账失败时保留原观察并报错，不能称 A157 通过。两例均需明确待人工处理状态，不做强删。

本批无必然程序 RED；若程序已有 C1/C2 的合法写入能力，记录取证首次执行结果，不为形式强造失败。机械完成判据：两个证据文件分别含命令/观察、合法 failed JSONL 行、seq/object_id 检索输出、处置状态；两行 `lint` 0；源历史目录 SHA/字节不变；再跑共同回归，证据落 `progress.md` E-C4-*。checker 核验后，本卡施工完成信号由 dispatch 合同决定，不自行启动 R/F。

## 交接边界

C4 checker PASS 后，编排负责 normal Recipe 的代码轮 1、需求方向、教训三路独立复核，必要整改按新派单处理。需求境、人类签名、verify、Issue/PR/CI/合并、部署与 worktree 清理是独立后续闸；此计划不预签、不代判。
