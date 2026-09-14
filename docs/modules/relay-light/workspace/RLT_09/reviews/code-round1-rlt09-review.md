<!-- dh:v1 -->
# code-round1 复核 — RLT_09

- **复核者**：`rlt09-review`（自报：Devin 会话，模型 swe-2-max）；路径：**code-round1**（heavy 首路）；只读复核，未改任何被审代码。
- **候选**：`wt/RLT_09` @ `94cb21b`（含收口 `c1dafff`；五批 commit `6edb32e`/`ab6343c`/`75eb1a0`/`bc89770`/`44be5ba`）；基线 master `b6b7d66`。
- **输入清单**：`dispatch/README.md`、`dispatch/review.md`、`brief.md`、`task_plan.md`、`progress.md`（E-B1-01..E-B5-06）、`findings.md`、`decision.1.md`、`check.C1..C5.md`、`review.plan.md`、`lesson_candidates.md`、`review.md`（heavy 路径登记与变异锚点）、`git diff master..HEAD` 全量、design/01 §3.5/§4.5/§9.4/§11 A119~A123/§14-6（RLT-A-07 同步后）、`evidence/08`、DevPlan §RLT_09、`tools/relay-light/skill/SKILL.md` 与两份 adapter、RLT_10 `findings.md` F-003。
- **授权边界声明**：`design/01`、`design/evidence/08`、`dev_plan/P1` 三处 diff 属用户授权的 RLT-A-07 最小 A-adjust（`decision.1` ③，2026-09-13）。本路已核对：§11 验收 ID 集合未增/未删/未改号，改动仅为 A121/A122 措辞澄清与 DevPlan 同步，与 `decision.1` 记录的范围一致；不重复裁决其内容。

## 逐条核对（review.md 五问）

### Q1 账本/lint/status 改动是否精确且不误伤既有规则 — 命中

- **A119 写者分层正确**：`plan_amend` 由 `CONTROL_EVENTS` 分支处理；非控制名（如 `coder#1`）在 `_authorize_agent` 精确报 `HC-RL-A119`；`orchestrator#<n>` 通过控制名校验后被既有 `_validate_writer`（owner=monitor）报 `HC-RL-A85`——与 findings B1 注记及 `test_writer_consistency_exits_two_for_every_frozen_owner` 冻结回归一致。`_validate_plan_amend_note` 要求独立非 key token 作方案文件名 + `nodes=` 非空且逗号项逐项非空；`plan_amend` 不在 `AGENT_EVENTS`，`_validate_stage_event` 对它早退（line 1953），不进状态机、不做节点成员判定（A93 惯例不变）。
- **A123 同阶段隔离**：挂在 `_validate_stage_event` 的 `stage_result` 分支、A112 之后；`stage_amends` 经 `_stage_entries`/`_stage_of` 按 `stage_id` 只取本实例历史（plan_amend 不属 STAGE_NOTE_EVENTS，按其 `node` 归属阶段）。有 amend 缺 `amend=`/`nodes=`（含空值/空项）→A123；无 amend 出现 `amend=` 键（含空值）→A123；未发明"无 amend 禁 nodes="的额外条件，与 oracle 逐字一致。
- **planner-amend 生命周期**：`_authorize_agent` 的 RELAUNCH_EXEMPT 分支内 `planner-amend` 写 `blocked`/`escalate` → A122（对是否入 agent 表均生效）；`_validate_planner_amend_done_note` 仅对 `done` 生效——无 `outcome` 键视为普通 note 放行，`outcome!=out-of-scope` 或缺 `proposal`/`reason`/`proposal` 含路径分隔符 → A122。无其它旁支行为改动。
- **A120 改动最小**：仅 `len(stage_runs) != len(set(stage_runs))` → `len(stage_runs[:-1]) != len(set(stage_runs[:-1]))`。除末段外不得重复 ⇔ 只允许"表尾追加一个既有 stage"这一种重现形态。stage 枚举校验（line 539-540 A129）、A46 全表节点号唯一（含 superseded 行）、A72、A89、A109、A75 全部未动。
- **status 路径零改动**：`_status_command`/`_runtime_plan`/`derive_status` 无 diff，每次调用经 `lint_plan` 重读计划，无缓存；A121 由纯测试用例证明（`relay_log.py` 零改动属实，fixture 冻结代码/账本 sha256 与 plan 目录文件集）。
- **F-003 入口统一**：`_configure_utf8_stdio()` 位于 `main()` 首行，先于参数解析与一切输出；同时覆盖 stdout/stderr，`getattr(reconfigure)` 探测 + `except (OSError, ValueError, AttributeError)`，不关闭/不替换外部流（`redirect_stderr(StringIO)` 等既有 in-process 测试不受影响）。
- `main` 顶层子命令仍恰为 `add/status/lint`（A135）；`--amend-check`/`--repo`/`--snapshot-dir`/`--proposed-path` 仅挂在 lint 子解析器，`args.command == "lint"` 门内才访问这些字段，无缺省污染其它子命令。

### Q2 A120 放宽只放开两项、四硬约束仍拒且编号有效 — 命中

- 两项放宽 = 同 stage 表尾追加 + superseded 行隔开（后者是 RLT_03 既有行为，正例复验）。
- 四硬约束各有独立反例用例逐项断言 exit 2 + 精确编号（A46 重复号含 superseded、A72 依赖 superseded、A89 指向后阶段、A109 同卡并行）。
- 既有 `C1→R1→C2` 多违规 fixture 两处收窄为 A89（放宽后真实首触发规则），非表尾隔断 `C1→R1→C2→F1` 与非法 stage 值仍断言 A129——收窄符合 DevPlan"仅变更其实际负责的规则断言"授权。
- 验证命令复跑 exit 0（见下）。

### Q3 白名单校验真按精确变更集且 design/ 整份拒绝 — 命中

- 形态：`lint --amend-check before|after` 下属模式，未新增顶层子命令；`before` 冻结 proposed、双采样 before/verify 全等才放行；`after` 从自签 manifest 读回 proposed，按 before/after 原始状态元组 `(kind, sha256, mode, symlink_target)` 得 `actual`，成功唯一判据 `actual == proposed`，再核 HEAD/真实 index bytes+mode/object database 完整指纹，最后跑普通 `lint_plan`。
- 三类闭集精确：本 plan `relay_plan.md`、同模块 `dev_plan/P<N>-*.md`（fullmatch、不含子目录）、before 原始副本 marker `cards=` 已存在卡的 `task_plan.md`（新卡/跨模块均被拒）；`_AMEND_DESIGN_RE` 前缀整目录禁区先行拒绝，其后是兜底"不在三类即拒"。
- 禁区混合在动笔前预检整份拒绝，snap 目录随异常清理；敏感 untracked 只进仓外 0700/0600 快照，进程输出不回显其文件名/哈希（`actual != proposed` 错误只列 proposed 未变项名 + 越界项计数）。
- Git 调用全部经 `_git_readonly` 白名单（10 条只读命令精确元组匹配）+ `GIT_OPTIONAL_LOCKS=0`；index 从 `rev-parse --git-path index` 直读原始 bytes，不经 `write-tree`；恢复走 unlink+O_EXCL 重建+fsync+chmod / `os.symlink` 重建（受 `test_static_forbidden_primitive_and_pane_guards` 禁表约束的合规替代，findings B4 注记已说明），恢复后整树重采样 + HEAD/index/objects 复核，不过则保留现场交人工。
- worktree `.git` 为 gitlink 文件的场景由 `rev-parse --git-path` 正确解析真实 index/objects 目录，forbidden_roots 覆盖 common-dir。

### Q4 F-003 防护入口统一、不依赖环境变量 — 命中（含独立探针）

- 防护在 `main()` 统一入口，不读取/不依赖 `PYTHONUTF8`/`PYTHONIOENCODING`；测试子进程显式剔除二者后注入 ascii/cp1252。
- **独立探针（复核者自跑，非测试框架）**：仓外临时 plan（card=`卡X`），`env -i … PYTHONIOENCODING=ascii python3 tools/relay-light/relay_log.py status …` → exit 0，stdout bytes 可 UTF-8 解码且含 `卡X`；同条件跑 master 版 `relay_log.py` → exit 1，`UnicodeEncodeError: 'ascii' codec can't encode` 于 `_status_command`——RED 机制与 GREEN 行为均独立复现。

### Q5 新增用例是否强断言 — 命中

- 全部新用例断言退出码 + 精确规则编号/输出内容，非"仅不崩"：`assertRegex(stderr, r"^lint: {rule} ")`、`assertEqual("lint: ok\n", stdout)`、`actual==proposed` 集合判据经用例正负两侧（多项/少项均拒）、编码用例 bytes 显式 UTF-8 解码 + 中文内容断言、A121 冻结代码/账本 sha256 + plan 目录唯一变化文件集。
- review.md 五个有效单测变异锚点均有真实断言兜底：plan_amend 入 AGENT_EVENTS→状态机投影相等断言破；尾追加放宽过宽→`C1→R1→C2→F1` A129 断言破；cards 授权读改后→新卡 task_plan 反例破；禁区部分执行→零变化断言破；仅护 stdout→cp1252 lint stderr 腿破。

## 复跑记录（复核者自跑，wt/RLT_09 @ 94cb21b）

| 验收 | 命令 | exit | 结果 |
|---|---|---|---|
| A119 | `python3 -m unittest -v …RelayLifecycleTests.test_plan_amend_requires_monitor_and_complete_note_and_is_repeatable` | 0 | 1 test OK |
| A120 | `python3 -m unittest -v …RelayPlanLintTests.test_a120_allows_append_and_superseded_separation …test_a120_keeps_four_hard_constraints` | 0 | 2 tests OK |
| A121 | `python3 -m unittest -v …RelayStatusProjectionTests.test_status_rereads_appended_stage_in_plan_order` | 0 | 1 test OK |
| A122 | `python3 -m unittest -v …RelayPlanAmendGuardTests` | 0 | 10 tests OK |
| A122 | `python3 -m unittest -v …SkillCoreDocTests.test_planner_amend_template_contract` | 0 | 1 test OK |
| A123 | `python3 -m unittest -v …RelayLifecycleTests.test_stage_result_amend_summary_matches_stage_history` | 0 | 1 test OK |
| F-003 | `python3 -m unittest -v …RelayCliEncodingTests` | 0 | 3 tests OK |
| 全量 | `python3 -m unittest tools/relay-light/test_relay_log.py` | 0 | 162 tests OK (skipped=2，既有 F-002 标记用例) |
| CLI 探针 | `lint --amend-check before` 缺 `--repo`/`--snapshot-dir` → exit 2；`after` 带 `--proposed-path` → exit 2；伪顶层 `amend` → exit 2 | 2/2/2 | A135 三命令集不变 |
| F-003 探针 | ascii stdio 下 status 中文：HEAD exit 0 UTF-8 含 `卡X`；master 版 exit 1 `UnicodeEncodeError` | — | RED/GREEN 独立复现 |

复跑后 `tools/relay-light/__pycache__/` 已删除。

## 发现（按级别）

- **P0**：无。
- **P1**：无。
- **P2**：无。
- **P3-1**（死分支）：`_decode_git_z_paths` 的 `meta=True` 路径无调用方（三处调用均 `meta=False`：两条 `ls-files -z` 与 `check-ignore -z --stdin` 输出均为裸路径）。无行为影响，属防御性预留。
- **P3-2**（错误形态）：`_load_sample_snapshot`/`_load_json` 对结构损坏的 manifest（缺 `index`/`objects`/`paths` 键或字段类型错）抛未捕获 `KeyError`/`TypeError`（traceback + exit 1），而非干净 A122。manifest 在 0700 受限目录内自写自读，损坏≈外部篡改，fail-closed 结果不变，仅报错形态不整洁。
- **P3-3**（合同观察面边界，非实现缺陷）：before/after 观察面按 P1-02 冻结为"工作树路径状态元组"。穿过指向**仓外**目标的 symlink 写入不使该 symlink 路径状态变化（仓外目标不可见）；但任一允许类路径经此写法仍因 `actual` 不含 proposed 而 fail-closed，指向仓内文件的 symlink 因目标在观察面内仍被捕获。此外 snap/manifest 由调用方自签，防错不防恶意调用方——完整性依赖监工如实执行协议与账本证据。两处均为冻结合同边界，记录供 code-round2/consistency 知悉。
- **P3-4**（语义边界记录）：A120 的"仅末段可重现"意味着先追加 C 再追加 R 的链式追加会让前一段成为中非隔断而被 A129 拒；多轮异阶段追加需先 supersede 旧追加段。与冻结 oracle"追加在表尾"逐字一致，真实多轮流程属 RLT_16/RLT_19 范围。
- **P3-5**（best-effort 尾项）：`_restricted_writer` 的 `os.fdopen` 失败路径理论泄露 fd（极小概率）；`_remove_snapshot_dir` `ignore_errors=True` 失败时残留目录不报错。均可接受。

## 结论

**APPROVE_WITH_NITS** —— 五条 HC 与 F-003 的实现与 oracle 逐字相符，改动精确、无既有规则误伤，全部验证命令独立复跑 exit 0，全量 162 绿；allowed-paths 闭集成立（三处 design/dev_plan 改动在 RLT-A-07 授权范围内）。上述 P3 均为提示性记录，不要求整改。本结论不代替验收、verify、人验或远端动作。
