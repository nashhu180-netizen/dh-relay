<!-- dh:v1 · progress.md -->
# progress — RLT_09

> 事实与证据账本。施工期由 scribe 按账本/diff/四行小结追加；W builder 只写初始化行与预留结构。

## 日志

| 日期 | 阶段 / 批次 | 动作 | 结果 | 证据 |
|---|---|---|---|---|
| 2026-09-13 | W / builder | 读取 dispatch 与冻结输入，建立 RLT_09 七件套，拆 B1～B5（含 RLT_10 F-003）并冻结 heavy 五路复核 | 待 plan-reviewer 审核 | `brief.md`、`task_plan.md`、`execution_strategy.md`、`findings.md`、`lesson_candidates.md`、`review.md` |
| 2026-09-14 | C / B1 exec | A119+A123 账本合同：`plan_amend` note 校验（文件名独立非 key token + `nodes=` 非空逐项）与非控制名写者→A119；`stage_result` 按同阶段 `plan_amend` 历史对称摘要校验 | RED(E-B1-01)→GREEN(E-B1-02)→Python 143 绿 + pwsh ALL PASS | E-B1-01..05；commit=6edb32e |
| 2026-09-14 | C / B2 exec | A120 lint 连续性放宽：`stage_runs` 除末段外必须唯一、末段允许重现既有 stage_id（只识别表尾追加形态）；两正例 + 四硬约束反例；两处旧 fixture 收窄至实际负责断言（A89） | 基线 b6b7d66 RED(E-B2-01)→GREEN(E-B2-02)→Python 145 绿 + pwsh ALL PASS | E-B2-01..05；commit=ab6343c |
| 2026-09-14 | C / B3 exec | A121 status 重读合同测试：非 WCRF 计划两次 status 间仅向同一 relay_plan.md 追加 X#2 节点行 + 必需 agent 行；断言新实例按计划序出现、代码/账本哈希不变、A75 回归保持 | 断言变异 RED(E-B3-01)→GREEN(E-B3-02)→Python 146 绿 + pwsh ALL PASS；relay_log.py 零改动 | E-B3-01..05；commit=75eb1a0 |
| 2026-09-14 | C / B4 exec | A122 白名单守门 + planner-amend 模板：`lint --amend-check before|after` 下属模式实现 P1-02 冻结快照算法（三类闭集预检、双采样原始快照、actual==proposed、仓外恢复、object database 只读核对）；planner-amend 生命周期禁 blocked/escalate + 结构化 out-of-scope done.note；SKILL.md 模板 + 双 adapter 同构指针 | stub RED(E-B4-01)→GREEN(E-B4-02)→Python 159 绿 + pwsh ALL PASS；禁表冲突改写后复绿 | E-B4-01..05；commit=bc89770 |
| 2026-09-14 | C / B5 exec | F-003 UTF-8 输出防护：`main()` 入口 `_configure_utf8_stdio()` 就地 reconfigure stdout/stderr；`RelayCliEncodingTests` 以 bytes 捕获 ascii/cp1252 子进程四路中文输出（status 文本/JSON、lint stderr/JSON） | RED(E-B5-01 八腿 UnicodeEncodeError)→GREEN(E-B5-02)→Python 162 绿 + pwsh ALL PASS | E-B5-01..06；commit=44be5ba |
| 2026-09-14 | C / 收口 | 五批小审全 PASS（check.C1..C5）后收口：B1 6edb32e / B2 ab6343c / B3 75eb1a0 / B4 bc89770 / B5 44be5ba；证据 E-B1-01..E-B5-06 共 26 条；findings 记 F-001 闭合链 + B1..B5 五批注记，lesson 候选 L-B2-01/L-B3-01/L-B4-01/L-B5-01 四条；四集合 allowed-paths 闭集确认（design/01、design/evidence/08、dev_plan/P1 属 RLT-A-07 授权项），git status 干净 | 收口 | commits=6edb32e,ab6343c,75eb1a0,bc89770,44be5ba |
| 2026-09-14 | R / X1 整改 | heavy 五路复核齐后整改：①code-round2 P2-1——`stage_amends` 归因改全节点表（superseded 行保留 stage_id），补 `test_a123_binds_plan_amend_whose_carrier_was_superseded`；②consistency P2-1——DevPlan :322/:623 两处「Git tree 快照」改 W4 冻结仓外原始快照表述；③lesson P2-1——登记 L-R-01/L-R-02；④review.md 回填五路结论 + 批次小审 + 独立复核区 + AI 提交区 | RED(E-X1-01 复现 P2-1)→GREEN(E-X1-02)→Python 163 绿 + pwsh ALL PASS | E-X1-01..05；commit=258a9be |

## 证据账本

| E-ID | 批次 | 命令 / 操作 | 原始结果摘要 | 支撑结论 |
|---|---|---|---|---|
| E-B1-01 | B1 | `python3 -m unittest -v tools.relay-light.test_relay_log.RelayLifecycleTests.test_plan_amend_requires_monitor_and_complete_note_and_is_repeatable tools.relay-light.test_relay_log.RelayLifecycleTests.test_stage_result_amend_summary_matches_stage_history`（实现经 `git stash` 还原至批前态） | exit 1，`FAILED (failures=9)`：coder#1 写 plan_amend 报 HC-RL-A69 而非 A119；monitor#1 缺文件名 / 缺 `nodes=` / `nodes=` 空值 / 空列表项 4 例均被接受（exit 0）；status 投影 `errors` 因无 `nodes=` 的入帐行报警；A123 三例（有 amend 缺 `amend=`、缺 `nodes=`、无 amend 带 `amend=`）均被接受 | RED：A119/A123 目标断言失败，无 TypeError/fixture 错 |
| E-B1-02 | B1 | 同上命令（实现恢复后） | exit 0，`OK`，2 tests | GREEN：A119 五反例精确拒绝 + 同 `(node, monitor#1)` 连写两条 + 前后 status 投影不变；A123 五组通过 |
| E-B1-03 | B1 | `python3 -m unittest tools/relay-light/test_relay_log.py` | exit 0，`Ran 143 tests in 167.868s OK (skipped=2)` | Python 全量回归绿（2 skipped 为既有 F-002 标记用例） |
| E-B1-04 | B1 | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | exit 0，末行 `RELAY ALL PASS (SKIPPED: 1)` | PowerShell 全量绿（relay-light 薄壳重跑 Python 143 + install_skill 7） |
| E-B1-05 | B1 | `rm -rf tools/relay-light/__pycache__`；`git diff --check`；`git diff master --name-only`；`git status --short --untracked-files=all` | __pycache__ 已删；`--check` 无输出；name-only 仅含允许路径（design/dev_plan 为已授权 W 阶段提交，非本批改动） | 边界与 whitespace 洁净 |
| E-B2-01 | B2 | `git show b6b7d66:tools/relay-light/relay_log.py > tools/relay-light/relay_log.py`（正式基线语义）后 `python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanLintTests.test_a120_allows_append_and_superseded_separation`；随后 `git checkout HEAD -- tools/relay-light/relay_log.py` 还原 | exit 1，`FAILED (failures=1)`：`case='tail-append'` 得 `AssertionError: 0 != 2 : lint: HC-RL-A129 nodes for a stage instance are not grouped contiguously`；`case='superseded-separation'` 未列入失败（基线即通过） | RED：正式基线 b6b7d66 拒绝表尾追加（exit 2/A129），superseded 隔开保持通过 |
| E-B2-02 | B2 | task_plan B2 七用例命令（两新用例 + A46/A72/A75/A129/A89 既有回归） | exit 0，`Ran 7 tests in 1.450s`，`OK` | GREEN：两正例通过；四硬约束各报 A46/A72/A89/A109；编号不漂 |
| E-B2-03 | B2 | `python3 -m unittest tools/relay-light/test_relay_log.py` | exit 0，`Ran 145 tests in 169.846s`，`OK (skipped=2)` | Python 全量回归绿；中途曾捕到 `test_structural_lint_precedes_the_recipe_check` fixture 漂移（A129→A89），已按 dev_plan「仅变更其实际负责的规则断言」收窄后复绿 |
| E-B2-04 | B2 | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | exit 0，末行 `RELAY ALL PASS (SKIPPED: 1)` | PowerShell 全量绿（relay-light Python 145 + install_skill 7） |
| E-B2-05 | B2 | `rm -rf tools/relay-light/__pycache__`；`git diff --check`；`git diff --name-only`；`git status --short --untracked-files=all` | __pycache__ 已删；`--check` 无输出；name-only 仅 `relay_log.py` + `test_relay_log.py` 两份允许路径 | 边界与 whitespace 洁净 |
| E-B3-01 | B3 | `python3 -m unittest -v tools.relay-light.test_relay_log.RelayStatusProjectionTests.test_status_rereads_appended_stage_in_plan_order`（断言变异：期望未追加的 `DHR_90:F#1`） | exit 1，`FAILED (failures=1)`：`First differing element 3: 'DHR_90:F#1' / 'DHR_90:X#2'`——第二次 status 实际返回追加的 X#2 实例且按节点表首次出现序 | 断言变异 RED：测试咬住 `stages` 精确顺序；`relay_log.py` 零改动（`_status_command`→`_runtime_plan`→`lint_plan` 每次重读），不伪称实现前失败 |
| E-B3-02 | B3 | 同上命令（断言改回 `DHR_90:X#2` 后） | exit 0，`OK`，1 test | GREEN：两次 status 均 exit 0；第二次恰多 `DHR_90:X#2`（pending，nodes=[X2]），顺序=计划首次出现序（非 WCRF：`W,C,X#1,X#2`）；首 payload 前缀不变；两次间 `relay_log.py`/`relay_log.jsonl` sha256 不变、plan 目录仅 `relay_plan.md` 变化；A75 空节点追加仍 exit 3 |
| E-B3-03 | B3 | `python3 -m unittest tools/relay-light/test_relay_log.py` | exit 0，`Ran 146 tests in 169.368s`，`OK (skipped=2)` | Python 全量回归绿（2 skipped 为既有 F-002 标记用例） |
| E-B3-04 | B3 | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | exit 0，末行 `RELAY ALL PASS (SKIPPED: 1)` | PowerShell 全量绿（relay-light Python 146 + install_skill 7） |
| E-B3-05 | B3 | `rm -rf tools/relay-light/__pycache__`；`git diff --check`；`git diff --name-only`；`git status --short --untracked-files=all` | __pycache__ 已删；`--check` 无输出；name-only 仅 `test_relay_log.py` 一份允许路径 | 边界与 whitespace 洁净；实现零改动 |
| E-B4-01 | B4 | `python3 -m unittest -v` 对 RED stub 跑五名 guard 用例 + allowlist/lint-failure/external-mutation/normal-lint/snapshot-dir 用例 + lifecycle/template/adapter 三用例 | exit 1，`FAILED (failures=40, errors=1)`：`HC-RL-A122 amend-check snapshot-not-implemented`、恢复未还原原始 bytes、snapshot 目录 0755 非 0700、混合禁区预检未拒、done.note 结构未校验、模板/adapter 指针缺失 | RED：目标行为断言失败，非未知旗标/fixture 错 |
| E-B4-02 | B4 | `python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanAmendGuardTests` + `RelayLifecycleTests.test_planner_amend_out_of_scope_lifecycle_contract` + `SkillCoreDocTests.test_planner_amend_template_contract` + `SkillAdapterTests.test_planner_amend_reference_isomorphic` + `RelayConfigTests.test_each_subcommand_help_exposes_config_dir` | exit 0，`Ran 10 tests ... OK`（guard 类）+ 4 用例 OK | GREEN：三类闭集逐项通过、design/新卡/越界/绝对/穿越/重复/目录整份拒、actual==proposed 唯一判据、raw 恢复 bytes/mode/symlink、静默区四类破坏 fail closed、敏感 untracked 不入 object database/输出、普通 lint 合同不变、planner-amend 生命周期 + 结构化 done.note + 模板 + 同构 adapter 全绿 |
| E-B4-03 | B4 | `python3 -m unittest tools/relay-light/test_relay_log.py` | exit 0，`Ran 159 tests in 227.561s`，`OK (skipped=2)` | Python 全量回归绿；首轮曾三红灯——`test_static_forbidden_primitive_and_pane_guards` 禁表命中 tempfile/mkstemp/os.replace，改写为 O_EXCL 顺序号副本 + unlink-重建恢复后复绿 |
| E-B4-04 | B4 | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | exit 0，末行 `RELAY ALL PASS (SKIPPED: 1)` | PowerShell 全量绿（relay-light Python 159 + install_skill 7） |
| E-B4-05 | B4 | `rm -rf tools/relay-light/__pycache__`；`git diff --check`；`git status --porcelain` | __pycache__ 已删；`--check` 无输出；改动仅 `relay_log.py`、`test_relay_log.py`、`SKILL.md`、两 adapter 五份允许路径 | 边界与 whitespace 洁净 |
| E-B5-01 | B5 | `python3 -m unittest -v tools.relay-light.test_relay_log.RelayCliEncodingTests`（无入口防护的实现） | exit 1，`FAILED (failures=8)`：ascii/cp1252 ×（status 文本、status --json、lint stderr、lint --json）八腿全抛 `UnicodeEncodeError: 'charmap' codec can't encode`（exit 1 traceback）；utf-8 环境 sanity 腿 ok | RED：fixture 先证 UTF-8 可过；四路中文输出在非 UTF-8 stdio 下写入失败 |
| E-B5-02 | B5 | 同上命令（`_configure_utf8_stdio()` 挂入 `main()` 后） | exit 0，`Ran 3 tests ... OK` | GREEN：ascii/cp1252 下 status/lint 按合同 exit（0/2），stdout/stderr bytes 显式 UTF-8 解码成功且含 `卡X`；env 白名单剔除 PYTHONUTF8 后单独注入，不依赖薄壳 PYTHONUTF8=1 |
| E-B5-03 | B5 | task_plan B5 收束八用例命令（两 B1 + 两 B2 + B3 + guard 类 + 模板 + 编码类） | exit 0，`Ran 19 tests in 27.388s`，`OK` | 整卡定向用例全绿：五条 HC + F-003 映射闭合 |
| E-B5-04 | B5 | `python3 -m unittest tools/relay-light/test_relay_log.py` | exit 0，`Ran 162 tests in 230.196s`，`OK (skipped=2)` | Python 全量回归绿（159→162，新增 3 条编码用例） |
| E-B5-05 | B5 | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | exit 0，末行 `RELAY ALL PASS (SKIPPED: 1)` | PowerShell 全量绿（relay-light Python 162 + install_skill 7） |
| E-B5-06 | B5 | `rm -rf tools/relay-light/__pycache__`；`git diff --check`；`git status --porcelain` | __pycache__ 已删；`--check` 无输出；改动仅 `relay_log.py` + `test_relay_log.py` 两份允许路径 | 边界与 whitespace 洁净 |
| E-X1-01 | X1 | `python3 -m unittest -v tools.relay-light.test_relay_log.RelayLifecycleTests.test_a123_binds_plan_amend_whose_carrier_was_superseded`（修复前） | exit 1，`FAILED (failures=1)`：`AssertionError: 2 != 0`——`plan_amend` 载体 C1 被 `superseded-by:C3` 退役、C3 尾段追加的合法形态下，`stage_result stage_id=DHR_90:C#1 outcome=done`（无 `amend=`）被接受（rc=0） | RED：复现 code-round2 P2-1 探针形态，A123 绑定被孤儿化（同 `/tmp/r2_supersede_carrier.py` 结论） |
| E-X1-02 | X1 | `python3 -m unittest -v` 同上新用例 + `test_stage_result_amend_summary_matches_stage_history` + `test_plan_amend_requires_monitor_and_complete_note_and_is_repeatable` | exit 0，`Ran 3 tests ... OK` | GREEN：`stage_amends` 归因改用含 superseded 行的全节点表后，无 `amend=` 拒、带 `amend=decision.9.md nodes=C3` 放行并 `stage_close`；A119/A123 既有矩阵不漂 |
| E-X1-03 | X1 | `python3 -m unittest tools/relay-light/test_relay_log.py` | exit 0，`Ran 163 tests`，`OK (skipped=2)` | Python 全量回归绿（162→163，新增 1 条 X1 用例） |
| E-X1-04 | X1 | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | exit 0，末行 `RELAY ALL PASS (SKIPPED: 1)` | PowerShell 全量绿 |
| E-X1-05 | X1 | `rm -rf tools/relay-light/__pycache__`；`git diff --check`；`git status --porcelain`；`git diff master --name-only` | __pycache__ 已删；`--check` 无输出；改动限 `relay_log.py`、`test_relay_log.py`、`dev_plan/P1`（RLT-A-07 授权措辞同步）、workspace 工件 | 边界与 whitespace 洁净；四集合闭集保持 |

## 批次 Handoff

| 批次 | candidate SHA | RED / GREEN | audit | 下一步 |
|---|---|---|---|---|
| B1 | 6edb32e | E-B1-01 / E-B1-02 | PASS（check.C1.md） | audit 小审 → B2 |
| B2 | ab6343c | E-B2-01 / E-B2-02 | PASS（check.C2.md） | audit 小审 → B3 |
| B3 | 75eb1a0 | E-B3-01 / E-B3-02 | PASS（check.C3.md） | audit 小审 → B4 |
| B4 | bc89770 | E-B4-01 / E-B4-02 | PASS（check.C4.md） | audit 小审 → B5 |
| B5 | 44be5ba | E-B5-01 / E-B5-02 | PASS（check.C5.md） | audit 小审 → 卡收束 |
| X1 | 258a9be | E-X1-01 / E-X1-02 | 待 code-round2 复看 | orchestrator 裁决 |

## 信号

DONE task=RLT_09 role=builder batch=W status=W_READY evidence=brief.md,task_plan.md,execution_strategy.md,progress.md,findings.md,lesson_candidates.md,review.md,commit=aaa2700 next=orchestrator
DONE task=RLT_09 role=audit batch=W status=FAIL evidence=review.plan.md next=orchestrator
DONE task=RLT_09 role=builder batch=W2 status=W_READY evidence=commit=ce14890 next=orchestrator

DONE task=RLT_09 role=decide batch=1 status=CONSULT evidence=decision.1.md next=orchestrator
DECISION task=RLT_09 decision=decision.1 choice=F-001:B,P1-03:A,A-adjust:authorized by=user(2026-09-13,orchestrator-session) evidence=design/evidence/08,RLT-A-07 next=builder-W3
DONE task=RLT_09 role=builder batch=W3 status=W_READY evidence=commits=bdd6cc2,e201158 next=orchestrator
DONE task=RLT_09 role=audit batch=W3 status=FAIL evidence=review.plan.md next=orchestrator
DONE task=RLT_09 role=builder batch=W4 status=W_READY evidence=commit=0898ab9 next=orchestrator
DONE task=RLT_09 role=audit batch=W4 status=PASS evidence=review.plan.md next=orchestrator
DONE task=RLT_09 role=exec batch=1 status=READY_FOR_REVIEW evidence=E-B1-01,E-B1-02,E-B1-03,E-B1-04,E-B1-05,commit=6edb32e next=orchestrator
DONE task=RLT_09 role=audit batch=1 status=PASS evidence=check.C1.md next=orchestrator
DONE task=RLT_09 role=exec batch=2 status=READY_FOR_REVIEW evidence=E-B2-01,E-B2-02,E-B2-03,E-B2-04,E-B2-05,commit=ab6343c next=orchestrator
DONE task=RLT_09 role=audit batch=2 status=PASS evidence=check.C2.md next=orchestrator
DONE task=RLT_09 role=exec batch=3 status=READY_FOR_REVIEW evidence=E-B3-01,E-B3-02,E-B3-03,E-B3-04,E-B3-05,commit=75eb1a0 next=orchestrator
DONE task=RLT_09 role=audit batch=3 status=PASS evidence=check.C3.md next=orchestrator
DONE task=RLT_09 role=exec batch=4 status=READY_FOR_REVIEW evidence=E-B4-01,E-B4-02,E-B4-03,E-B4-04,E-B4-05,commit=bc89770 next=orchestrator
DONE task=RLT_09 role=audit batch=4 status=PASS evidence=check.C4.md next=orchestrator
DONE task=RLT_09 role=exec batch=5 status=READY_FOR_REVIEW evidence=E-B5-01,E-B5-02,E-B5-03,E-B5-04,E-B5-05,E-B5-06,commit=44be5ba next=orchestrator
DONE task=RLT_09 role=audit batch=5 status=PASS evidence=check.C5.md next=orchestrator
DONE task=RLT_09 role=exec batch=5 status=CONSTRUCTION_DONE evidence=E-B1-01..E-B5-06,commits=6edb32e,ab6343c,75eb1a0,bc89770,44be5ba,c1dafff next=orchestrator
DONE task=RLT_09 role=review batch=R status=APPROVE_WITH_NITS evidence=reviews/code-round1-rlt09-review.md next=orchestrator
DONE task=RLT_09 role=review batch=R status=APPROVE_WITH_NITS evidence=reviews/consistency-rlt09-review.md next=orchestrator
DONE task=RLT_09 role=review batch=R status=APPROVE evidence=reviews/requirement-rlt09-review.md next=orchestrator
DONE task=RLT_09 role=review batch=R status=APPROVE_WITH_NITS evidence=reviews/lesson-rlt09-review.md next=orchestrator
DONE task=RLT_09 role=review batch=R status=REQUEST_CHANGES evidence=reviews/code-round2-rlt09-review.md next=orchestrator
DONE task=RLT_09 role=exec batch=X1 status=READY_FOR_REVIEW evidence=E-X1-01,E-X1-02,E-X1-03,E-X1-04,E-X1-05,commit=258a9be next=orchestrator
DONE task=RLT_09 role=audit batch=X1 status=PASS evidence=check.X1.md next=orchestrator
DONE task=RLT_09 role=review batch=X1 status=APPROVE evidence=reviews/code-round2-rlt09-review.md next=orchestrator
