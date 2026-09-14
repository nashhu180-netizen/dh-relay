<!-- dh:v1 -->
# findings — RLT_09

> 只登记施工期发现的合同冲突、范围外事实与建议；worker 不自行改 design/dev_plan 或替 orchestrator/用户裁决。

## 登记项

| ID | 发现 | 影响 | 状态 |
|---|---|---|---|
| F-001 | design §4.5.2 原合同一方面把 planner-amend 可碰文件锁为 relay_plan、DevPlan、已有卡 task_plan 三类，并要求禁区命中时整份改动不落笔；另一方面又要求 planner-amend 在方案文件（`decision.<n>.md` 或 strategist 文件）写「超出范围」。方案文件通常位于 workspace 且不属于三类；HC-RL-A122 又要求 actual diff 是白名单闭集，二者形成 oracle 冲突。 | `decision.1` ①已选择 B，RLT-A-07 已同步 design/DevPlan：保留三类闭集；禁区命中时计划目标与输入方案文件零变化，planner-amend 的普通 `done.note` 承载结构化 out-of-scope 原因，monitor 写 `stage_result outcome=blocked`。B4 不再有该前置 BLOCKED。 | CLOSED — `decision.1` ①B + RLT-A-07 已闭合；发现事实保留作审计链 |

W4 盘点：F-001 已按 `decision.1` ①B + RLT-A-07 闭合。A122 可落在现有 `lint` 的 planner-amend 校验模式，不新增顶层子命令，当前未发现与 A135「命令集保持 add/status/lint 三个」的必然冲突。若施工证明该形态仍无法满足“禁区命中时整份不落笔”，须新增 F-ID 并 BLOCKED，不得自行改成第四个顶层子命令。

B1 注记（非冲突、不阻塞）：brief 判据「coder 写入 … exit 2 且 A119」按字面落成——非控制名（coder 等）写 `plan_amend` 在 `_authorize_agent` 报 `HC-RL-A119`；`orchestrator#<n>` 写 `plan_amend` 沿用既有 `HC-RL-A85` 写入者层（`test_writer_consistency_exits_two_for_every_frozen_owner` 冻结回归保持）。`plan_amend` 不进 agent 状态机：`_validate_stage_event` 对它照旧早退，A119 只做 note 形状校验（文件名 = 独立非 key token；`nodes=` 非空且逗号项逐项非空），节点号不做计划成员判定——既有 A93 反例 fixture `decision.9.md nodes=C9`（C9 不在计划内）保持 `HC-RL-A93` 语义不变。A123 挂在 `_validate_stage_event` 的 `stage_result` 分支、A112 之后，只查同阶段 `plan_amend` 历史；无 amend 时仅禁 `amend=`，不发明 `nodes=` 禁令。本批无新增冲突项。

B2 注记（非冲突、不阻塞）：A120 放宽按 task_plan「只识别表尾追加到一个既有 stage」落成——`stage_runs` 除末段外必须各自唯一，末段允许重现既有 `stage_id`；superseded 行照旧先滤除。两处既有 fixture 收窄：`test_stage_must_be_known_and_grouped_contiguously` 的 `C1→R1→C2` 尾追加例与 `test_structural_lint_precedes_the_recipe_check` 的同款 fixture 在放宽后不再触发 A129，按 dev_plan「仅变更其实际负责的规则断言」分别收窄为断言 A89（`C2.depends_on=R1` 回边 / 结构性规则仍先于 A116）。非表尾隔断（`C1→R1→C2→F1`）保持 A129 断言不变。本批无新增冲突项。

B3 注记（非冲突、不阻塞）：A121「status 重读同一份计划并按计划顺序派生阶段」现状已满足——`_status_command` 每次经 `_runtime_plan` → `lint_plan` 重读 `relay_plan.md`，无任何缓存，`relay_log.py` 零改动。按 task_plan 的「行为已绿 + 断言变异红」口径取证：先把期望阶段列表变异为未追加的 `DHR_90:F#1` 跑出 RED（实际返回 X#2），再改回 `DHR_90:X#2` 得 GREEN。fixture 为非 WCRF 顺序 `[W#1, C#1, X#1]`，追加 `X#2` 节点行 + 必需 agent 行；断言两次 status 间 `relay_log.py`/`relay_log.jsonl` sha256 不变、plan 目录内仅 `relay_plan.md` 变化、A75 空节点仍拒。本批无新增冲突项。

B4 注记（非冲突、不阻塞）：A122 按 decision.1 ①B + W4 冻结算法落成——`lint --amend-check before|after` 下属模式（顶层子命令仍 add/status/lint 三个，A135 回归保持）。两个实现口径值得留痕：①冻结静态守卫 `test_static_forbidden_primitive_and_pane_guards` 禁止 relay_log.py 出现 tempfile/mkstemp/os.replace/os.rename/shutil.move——惯用的「临时文件+原子 rename」恢复不可用；raw 副本改用 O_EXCL 顺序号命名（0600）、恢复改「unlink + O_EXCL 重建 + fsync + chmod」，非原子性由恢复后整树重采样 diff 兜底，验证不过则保留 0700 现场交人工接管。②双采样不一致腿的 mock 探针摸不到子进程 CLI——该腿经 in-process `main(argv)` + redirect_stderr 注入（与既有 `test_add_reports_genuine_append_failure_as_exit_four` 同款形态）。OSError 消息统一降级为 `exc.strerror`，避免敏感 untracked 路径回显 stderr。本批无新增冲突项。

B5 注记（非冲突、不阻塞）：F-003 按 task_plan 落成——`main()` 入口处 `_configure_utf8_stdio()` 对 `sys.stdout`/`sys.stderr` 就地 `reconfigure(encoding="utf-8")`，无 reconfigure/已关闭/替身流跳过，不关闭不替换外部流（`redirect_stderr(StringIO)` 等既有 in-process 测试不受影响）。RED 形态与冻结判据一致：ascii/cp1252 子进程下 status 文本、`status --json`、lint stderr、`lint --json` 四腿均抛 `UnicodeEncodeError: 'charmap'`（exit 1 traceback）；fixture 先行在 `PYTHONIOENCODING=utf-8` 下全绿。测试环境白名单剔除 `PYTHONUTF8`/`PYTHONIOENCODING` 后单独注入，不继承薄壳 PYTHONUTF8=1。本批无新增冲突项。

X1 注记（复核整改、非冲突）：code-round2 P2-1——`_stage_of` 按当前活跃节点表归因非 `STAGE_NOTE_EVENTS` 行，`plan_amend` 载体节点被 supersede 后该行失去 stage 归因，`stage_result` 无 `amend=` 被静默接受（击穿 A123）。整改：`_validate_stage_event` 的 `stage_amends` 判定改用含 superseded 行的全节点表（superseded 行保留 `stage_id`，节点名经 A46 全表唯一），补回归用例 `test_a123_binds_plan_amend_whose_carrier_was_superseded`（先 RED 复现探针形态后 GREEN）。`derive_status`/`_ledger_warnings`/`loss_stop`/`_validate_writer_handoff` 的活跃表归因未动——阶段事件走 note `stage_id=` 与 map 无关，非阶段行在投影与告警中的归属口径不在本次整改范围。consistency P2-1 的 DevPlan 两处「Git tree 快照」措辞已同步为 W4 冻结的仓外原始快照表述（RLT-A-07 授权范围）；lesson P2-1 两条现场登记为 L-R-01/L-R-02。本批无新增冲突项。

X2 注记（CI 修复、非冲突）：PR #19 windows-latest 红（163 中 10 败）——`_prepare_snapshot_dir` 用 `realpath(snap) != abspath(snap)` 字符串判等检测 symlink 父链，Windows 临时目录的 8.3 短名（`RUNNER~1`）经 realpath 展开为长名后字符串不等，被误报为 symlink 父链。整改：改逐级祖先 `lstat`+`S_ISLNK` 判定（同 `_require_plain_parents` 口径），8.3/junction 规范化不可见、真 symlink 仍拒；`resolved = realpath(snap)` 仍用于 forbidden-roots 仓内归属判定，语义未放松。补 `test_snapshot_dir_tolerates_realpath_name_expansion`：monkeypatch `os.path.realpath` 模拟 8.3→长名展开（in-process `main(argv)`，同 m4 探针形态），Linux 上先 RED（误报 A122）后 GREEN，且同一补丁下真 symlink 父链仍拒。本批无新增冲突项。
