<!-- dh:v1 -->
# code-round2 复核 — RLT_09

- **复核者**：`rlt09-review`（自报：Devin 会话，模型 swe-2-max）；路径：**code-round2**（fresh 视角）；只读复核，未改任何被审代码。
- **候选**：`wt/RLT_09` @ `2f5ea51`（code-round1 复核提交；实现同 `94cb21b`）；基线 master `b6b7d66`。
- **方法**：按 review.md code-round2 条目先独立走查——不读 round1 结论，对五个点名边界逐一写独立探针实测（探针均在 `/tmp` 仓外，驱动真实 `lint_plan`/`add` CLI），完成后再对照 round1 报告。
- **输入清单**：`dispatch/README.md`、`dispatch/review.md`、`brief.md`、`task_plan.md`、`progress.md`、`findings.md`、`decision.1.md`、`git diff master..HEAD`、design/01 §4.5/§11 A119~A123/A126、`tools/relay-light/relay_log.py` 全文（lint 路径、账本校验、status 投影、A122 守卫、F-003 防护）、`test_relay_log.py` 相关用例、round1 报告（对照用）。

## 独立探针证据（复核者自跑，非随仓测试）

### A120/lint 边界组合（21 探针，`lint_plan` 直调，全符预期）

| # | 场景 | 实测 |
|---|---|---|
| E1 | superseded 行隔开同 stage 重现（RLT_03 基线） | PASS（放行） |
| E2 | superseded 行落在追加尾段内（`C1,R1,C2sup,C3`） | PASS |
| E3/E3b | 首段整体被 supersede、替代节点重加在 R 后 | A89 / A109（双闸锁死，不可表达） |
| E4/E20/E21 | 第二个 stage 重现 / 追加段后又有段 / 双重追加 | 全部 A129（仅末段可重现，round1 P3-4 实证） |
| E5 | 追加节点 depends_on 后阶段 | A89 |
| E6 | 中段节点依赖表内后行但靠前 stage 实例（`R1 dep C2`，C2 在尾段） | PASS——合同合法但语义反常，记录 |
| E7/E8 | 重复节点号：首个/两个均为 superseded 行 | A46（all_nodes 覆盖全表） |
| E9 | 新实例 `C#2` 置于 `R#1` 之后 | A109——**新实例**追加被 A89+A109 结构性锁死 |
| E10 | 尾段追加既有 `R#1` 实例 | PASS |
| E11 | 追加段内依赖链（C3 dep C2） | PASS |
| E12 | 追加节点自依赖 | A48（无环检查兜住自环） |
| E13 | 追加节点依赖 superseded 节点 | A72 |
| E14 | 追加节点依赖不存在节点 | A48 |
| E15 | 追加节点无 agent | A75 |
| E16 | **追加行 depends_on 留空 → 隐式依赖上一活跃行 R1 → A89** | A89——追加必须显式写靠前 stage 依赖 |
| E17/E18 | 全新 `X#1`/`F#1` 尾置 | X PASS；F 撞 A126（本探针 `type=close` 非法 node type，非追加缺陷） |
| E19 | `W#1` 实例表尾重现（W2 dep W1） | **PASS**——任一已出现实例均可表尾重现，包络比预想宽 |

**lint 语义包络（fresh 结论）**：A120 实际放开的是"任一已出现 stage 实例在表尾重现一次"，含 W#1；而"新实例"置于后阶段之后永远过不了 A89+A109（deps 只能指向同/靠前 stage，新实例与相邻前实例间不可能有祖先链）。四硬约束在全部组合上仍逐字拒绝。

### stage_result / plan_amend 账本边界（41 步 CLI 探针全过 + 1 个缺陷）

- 三态全验证：无 plan_amend 带 `amend=`（含空值）→A123；有 plan_amend 缺 `amend=`/缺 `nodes=`/空值/空项 →A123；齐→放行。`nodes=` 单带（无 amend）属自由文本放行，与 oracle 一致。
- 时序变体验证：stage_result（干净）→ plan_amend → 后续 stage_result 必须补摘要——首条已落账的干净结果不回溯失效，latest-wins 语义一致。
- plan_amend 窗口：stage_close 后 →A93；未 stage_start 阶段的节点 →A93；`coder#1` →A119、`orchestrator#1` →A85 分层正确；可重复落账。
- 跨实例隔离：W#1 的 plan_amend 不绑定 C#1 的 stage_result。

### F-003 reconfigure 健壮性（9 探针）

StringIO / closed 流 / `sys.stdout=None` / 二次 reconfigure 幂等 / ascii 已写半篇后 reconfigure / `main()` 端到端挂 ascii TextIOWrapper——全部安全。异常未覆盖项见 P3-2。

## 发现（按级别）

- **P0**：无。
- **P1**：无。
- **P2-1**（A123 绑定可被合法操作孤儿化，round1 未覆盖；与 consistency P3-3 同根不同失效形态）：`_stage_of`（`relay_log.py:2214-2226`）按**当前**计划的活跃节点表（`_active_node_map`）给非 STAGE_NOTE_EVENTS 行归因 stage。superseded 行在 `plan.nodes` 中仍保留 `stage_id`，但不在活跃表内。实测序列：C#1 开窗内 monitor 在 `C1` 上落 `plan_amend` → 同一次 amendment 把 `C1` 以 `superseded-by:C3` 退役、尾段追加 `C3`（A120 明确允许的 supersede-separation 形态，lint PASS）→ `C2`、`C3` 正常关闭 → `stage_result stage_id=DHR_90:C#1 outcome=done`（无 `amend=`/`nodes=`）**被接受（rc=0）**。此时账本历史里确有该阶段实例的 `plan_amend`（写入时 A93 已验证其在 C#1 窗口内），但 A123 的"本阶段有 plan_amend 时必须带摘要"对该实例不再生效；`derive_status` 同样把该行跳过（`stage_id=None → continue`），无任何告警——属静默失效而非显式拒绝。合同本意是绑定"该阶段实例账本历史里发生过的 plan_amend"（superseded 行的 stage_id 仍在当前计划中可查），实现用活跃表归因导致绑定随计划改写漂移。与 consistency 报告 P3-3 同根（`_stage_of` 活跃表归因）：彼处为"挂别阶段节点→错位归因"，需监工主动错挂；本处为"同阶段 supersede 载体→归属整行蒸发"，可在诚实流程自然命中（『C1 方案作废、改派 C3』正是 amendment 的典型形态）。修复方向（建议，不代施工）：stage 归因改用含 superseded 行的全节点表，或在 plan_amend 落账时冻结 stage 归属。
- **P3-1**（reconfigure 异常覆盖缺口）：`_configure_utf8_stdio`（`relay_log.py:194-208`）只捕 `(OSError, ValueError, AttributeError)`。实测 sys.stdout 换成 `reconfigure` 属性非 callable（`reconfigure=42`）或签名不收 `encoding` kwarg 的对象时，`TypeError` 逃逸 → `main()` 入口即崩（traceback）；`reconfigure` 抛 `RuntimeError` 同。现实失败形态（closed→ValueError、不支持→OSError/UnsupportedOperation、无属性→None）均已覆盖，剩余为病态 double；建议把 `TypeError` 并入捕集。
- **P3-2**（A122 manifest 信任面，round1 P3-2 延伸）：`_load_sample_snapshot` 直读自签 manifest 的 `raw_id` 并拼 `before.raw_dir / raw_id`（`relay_log.py:1119`），未校验形态——伪造 manifest 可令 restore 读 `../` 穿越出的任意本 uid 可读文件写入仓内路径。manifest 在 0700 目录内、自写自读，篡改者已具备同 uid 全部能力，无提权，故维持 P3；与 round1 P3-2（结构损坏→KeyError/TypeError traceback）同源，可一并记录。
- **P3-3**（A122 观察面边界，round1 P3-3 延伸）：快照宇宙 = tracked ∪ 非 ignored untracked；**gitignored 路径的写入对 actual 差集不可见**（`ls-files --others --exclude-standard` 与 `status --ignored=no` 双双排除）。proposed 中列 ignored 路径已被 `_reject_ignored` 拒（测试 4183-4191 覆盖），但未列入 proposed 的 ignored 写入既不可见也不可恢复。允许类路径本身若被 gitignore 则 proposed 阶段已拒，故保护集不泄漏——记录边界供 orchestrator 知悉。
- **P3-4**（presence-only 语义，oracle 逐字一致）：A123 只查 `amend=`/`nodes=` **存在且非空**，不回对 plan_amend 行内的方案名/节点表（实测 `amend=other.md nodes=C9` 在 plan_amend 记 `decision.9.md nodes=C3` 后放行）；plan_amend 的 `nodes=` 也不回对计划实际新增节点。与 oracle "必须含" 字义相符，记录语义边界。
- **P3-5**（E6 语义记录）：lint 允许中段节点依赖表内后行（靠前 stage 实例）——`R1 dep C2`（C2 在尾段）合法，runtime A78 会在 C2 未关时挡住 R1 启动，无安全问题，语义反常记录备查。

## 复跑记录（复核者自跑，wt/RLT_09 @ 2f5ea51）

| 验收 | 命令 | exit | 结果 |
|---|---|---|---|
| A119 | `python3 -m unittest …test_plan_amend_requires_monitor_and_complete_note_and_is_repeatable` | 0 | 1 test OK |
| A120 | `…test_a120_allows_append_and_superseded_separation` | 0 | 1 test OK |
| A120 | `…test_a120_keeps_four_hard_constraints` | 0 | 1 test OK |
| A121 | `…test_status_rereads_appended_stage_in_plan_order` | 0 | 1 test OK |
| A123 | `…test_stage_result_amend_summary_matches_stage_history` | 0 | 1 test OK |
| F-003 | `…RelayCliEncodingTests` | 0 | 3 tests OK |
| 全量 Python | `python3 -m unittest tools/relay-light/test_relay_log.py` | 0 | 162 tests OK (skipped=2) |
| 全量 pwsh | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | 0 | RELAY ALL PASS (SKIPPED: 1) |
| lint 边界探针 | `/tmp/r2_lint_probe.py`（21 例，仓外） | 0 | 21/21 符预期 |
| 账本边界探针 | `/tmp/r2_ledger_probe.py`（41 步，仓外） | 0 | 41/41 符预期 |
| utf-8 探针 | `/tmp/r2_utf8_probe.py`（9 例） | 0 | 6 OK / 3 预期外异常（=P3-1） |
| A123 孤儿化探针 | `/tmp/r2_supersede_carrier.py` | 0 | **P2-1 复现：stage_result 无 amend= 被接受** |

## 与 round1 及其它已闭合路径的对照

- round1 五条 P3（meta=True 死分支 / manifest 损坏 traceback / symlink 观察面 / 链式追加边界 / best-effort 尾项）本轮独立复核全部再确认；P3-2/P3-3 为同族延伸记录。
- **round1 未覆盖项**：P2-1（supersede 载体节点孤儿化 plan_amend 归因）。round1 报告的 A123 分析（"`stage_amends` 经 `_stage_of` 只取本实例历史"）正确但未推进一步到"实例历史由当前活跃表归因、可被 supersede 改写"这一层。
- 本轮出稿时 progress.md 显示 consistency/requirement/lesson 三路已闭合（APPROVE_WITH_NITS/APPROVE/APPROVE_WITH_NITS）。P2-1 与 consistency 报告 P3-3 同根（`_stage_of` 活跃表归因），该路把错挂形态记为操作纪律边界；本路探针证明同一归因面在诚实流程内也可静默失效，故升级为 P2，供 orchestrator 合并裁决。
- round1 结论在当时覆盖范围内无误；P2-1 超出其检查口径，不推翻其结论，但构成本卡新增整改项。

## 结论

**REQUEST_CHANGES** —— 核心实现质量高、探针覆盖的 21+41 项边界全部符合 oracle，但 P2-1 表明 HC-RL-A123 的强制路径存在一条全合法操作可静默击穿的缝隙（supersede plan_amend 载体节点），属验收口径内的行为缺口而非提示项。建议整改 `_stage_of`/stage_amends 归因（含 superseded 行）并补该形态回归用例；P3-1~P3-5 为提示性记录。本结论不代替验收、verify、人验或远端动作。

## X1 复看（code-round2 P2-1 整改定向复看）

- **复核者**：`rlt09-review`（Devin 会话 / swe-2-max）；范围：仅核本路 P2-1 是否真正闭合；候选 `258a9be`（HEAD 另含 exec 信号 `334f8fb` 与 audit `check.X1` 未提交工件）。
- **整改形态**：`_validate_stage_event` 内 `stage_amends` 判定的节点归因从活跃表（`nodes_by_name`）改为全计划表 `all_nodes`（含 superseded 行；superseded 行保留 `stage_id`，节点名经 A46 全表唯一）。`_stage_of` 本体与其余消费方（status 投影、`_ledger_warnings`、`_validate_writer_handoff`、loss_stop）口径未动——最小爆炸半径修法，findings X1 注记如实记录了该 scoping。

### 复看证据（复核者自跑）

| 项 | 命令/方式 | 结果 |
|---|---|---|
| 原缝隙复现 | `python3 /tmp/r2_supersede_carrier.py`（同 code-round2 探针原样重跑） | `stage_result`（无 `amend=`）现被拒：rc=2 `error: HC-RL-A123 … must carry amend=<proposal> after plan_amend` |
| 新用例 GREEN | `python3 -m unittest …test_a123_binds_plan_amend_whose_carrier_was_superseded` | exit 0，OK |
| 新用例 RED 可信性 | 仓外隔离目录 `/tmp/r2_red/`：`git show 5fc8abf:…relay_log.py`（修复前实现）+ 候选新用例 | exit 1，`FAILED (failures=1)`：`AssertionError: 2 != 0`——用例确实咬合被修行 |
| 账本矩阵回归 | `/tmp/r2_ledger_probe.py` 41 步三态/窗口/写者矩阵原样重跑 | 41/41 OK，零 MISMATCH——归因加宽未漂 A119/A123/A93 既有判定 |
| 五条 HC + F-003 | 五条 unittest 定向命令 | 全部 exit 0 |
| 全量 Python | `python3 -m unittest tools/relay-light/test_relay_log.py` | exit 0，163 tests OK (skipped=2)，162→163 与新用例对应 |
| 全量 pwsh | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | exit 0，`RELAY ALL PASS (SKIPPED: 1)`（内嵌 Python 163 绿 + install 7 绿） |

### 归因面残留核对

- 误绑风险零：全表归因下 plan_amend 行仍按其载体 `stage_id` 归实例，A46 全表唯一排除名碰撞；载体写入时已过 A93 窗口校验，属该实例真实历史。跨实例隔离保持（本探针 S3/S4 腿原样通过）。
- 未动面的残余口径（status 投影/`_ledger_warnings` 对 superseded 节点上的历史行仍按活跃表跳过）属投影/告警呈现面，非 A123 强制面；写入闸已封住矛盾账本态的生成，findings 注记如实记录，不追加要求。
- 允许路径：`relay_log.py`+`test_relay_log.py`+`dev_plan`（RLT-A-07 授权措辞同步，两处）+workspace 工件；`git diff 258a9be^..258a9be` 文件集与 audit `check.X1` 记录一致。

### 复看结论

**APPROVE** —— P2-1 真实闭合：原缝隙以同一探针复现为拒绝、新用例 RED→GREEN 独立复跑可信、41 步账本矩阵与双全量回归零漂移。本结论只覆盖 code-round2 P2-1；consistency/lesson 两路的 X1 整改项归各自复核者收口。不代替验收、verify、人验或远端动作。
