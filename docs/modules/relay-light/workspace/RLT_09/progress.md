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

## 批次 Handoff

| 批次 | candidate SHA | RED / GREEN | audit | 下一步 |
|---|---|---|---|---|
| B1 | 6edb32e | E-B1-01 / E-B1-02 | PASS（check.C1.md） | audit 小审 → B2 |
| B2 | ab6343c | E-B2-01 / E-B2-02 | PASS（check.C2.md） | audit 小审 → B3 |
| B3 | 75eb1a0 | E-B3-01 / E-B3-02 | 待审 | audit 小审 → B4 |

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
