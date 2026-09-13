<!-- dh:v1 -->
# progress — RLT_10

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-13 | W builder (`rlt10-build`) | 读取 AGENTS、DevPlan RLT_10/交付物矩阵、design §3.5/§3.8 与五条 oracle、现状程序/两份 Python 测试/全量 runner、RLT_08 七件套；rebase master；建立 RLT_10 七件套和 B1–B3 红→绿/audit 计划；盘点并登记 `lint --json` 越界实现缺口 | Issue #16；worktree `wt/RLT_10`；master `73947ac`；rebase=up to date；W-BL-001；W-BL-002；F-001；七件套 | 发 `W_READY`；等 orchestrator 派 W audit，不进入施工 |
| 2026-09-13 | exec (`rlt10-exec`) | B1：rebase master（up to date）；机械抄 §3.5 二十行映射为盘点矩阵并逐行对出现有触发（按规则行差集为空）；新增唯一冻结入口 `test_lint_cli_exit_stderr_and_json_contract`（exit 0/2/3、stderr 行形、§11 首列 111 ID 白名单、`--json` 成功/失败逐字段断言）；运行取得有效行为 RED——`--json` 两分支红于 argparse exit 2 / `error: arguments unrecognized arguments: --json`（F-001 触发），其余三分支绿；97 测试四类别跑仅该测试两分支红 | E-B1-001～E-B1-005；F-001；见下「B1 §3.5 规则映射盘点矩阵」 | 按 task_plan 停止边界发 `status=BLOCKED`，等 decide/orchestrator 裁决，不续批 |
| 2026-09-13 | exec (`rlt10-exec`) | B1 恢复（decision.1 选项 A 用户批准）：rebase master（up to date）；`relay_log.py` 最小实现 `lint --json`——`lint_parser` 注册 `--json`、分发透传、`_lint_violation` 产出 `{rule,message,line}`（line 取违规消息 `line <n>:` 前缀真实行号，无前缀为 null）、`--json` 成功出 `{"ok":true,"violations":[]}`；不改 lint 规则语义、不复用 status schema、exit-3 `error:` 合同不变；冻结入口五分支全绿，A94 四类别 97 项 OK，两文件回归 147 项 OK | E-B1-006～E-B1-010；决策=decision.1/A（progress 末尾 DECISION 行）；`relay_log.py` diff 仅限 `--json` | 发 `status=READY_FOR_REVIEW`，等 audit B1 小审，不续批 |
| 2026-09-13 | exec (`rlt10-exec`) | B2（B1 audit PASS=check.C1.md 后派单）：rebase master（up to date）；新增 `test_relay_log_imports_are_stdlib_only`——`ast.parse` 解析仓内 `relay_log.py`（不 import 被测模块），`Import`/`ImportFrom` 收集顶层模块，`__future__` 单列，差集须全在 `sys.stdlib_module_names`，断言非空防假绿、失败列排序越界名；先注入 `rlt10_fake_third_party` 变异取 RED 再撤销（未提交），现状 import 集合 GREEN | E-B2-001～E-B2-005；collected={__future__,argparse,dataclasses,datetime,json,os,pathlib,re,sys,tomllib,urllib} | 发 `status=READY_FOR_REVIEW`，等 audit B2 小审，不续批 |
| 2026-09-13 | exec (`rlt10-exec`) | B3（B2 audit PASS=check.C2.md 后派单）：rebase master（up to date）；登记前全量 runner 证 `relay-light-log` 零命中（入口缺席 RED）；新建薄壳 `tools/tests/relay-light-log.ps1`——`python`→`python3` 顺序 Get-Command 取首命中 `.Source`、两者皆缺时恰一行 `SUITE SKIP relay-light-log (python/python3 missing)` exit 0、经 `$PSScriptRoot` 上溯仓根顺序跑两份 unittest、原样透传输出与 `$LASTEXITCODE`；首跑暴露 `Get-Command` 双命中（`/usr/bin/python3` 与 `/bin/python3`）数组化 bug，改 `Select-Object -First 1).Source` 修复；`run-relay-tests.ps1` 仅在 `$suites` 末尾追加一项；隔离证 fake python exit 7 透传、无解释器单行 SKIP；薄壳独立、全量、Python 直跑三证全绿 | E-B3-001～E-B3-007；Linux pwsh 7.6.6 本地兼容证，不冒充 Windows 真机 | 发 `status=READY_FOR_REVIEW`，等 audit B3 小审，不打 CONSTRUCTION_DONE |

## 施工批次状态（预填，不代表已执行）

| Batch | 功能单元 | 红 | 绿 | 小审 | 状态 |
|---|---|---|---|---|---|
| 1 | lint 0/2/3、stderr/JSON、§3.5 20 行规则映射 | 已取得：`--json` 分支 argparse exit 2 / `error: arguments ...`（E-B1-002/003） | 已转绿：decision.1/A 落地 `lint --json`，冻结入口五分支 + A94 97 项 + 回归 147 项全绿（E-B1-007/009/010） | 待执行 | READY_FOR_REVIEW |
| 2 | `relay_log.py` import AST 标准库检查 | 已取得：临时注入 `rlt10_fake_third_party` 变异使断言 FAIL 且消息列出越界名（E-B2-002） | 已转绿：变异撤销后冻结入口 + 两文件回归全绿（E-B2-003/004） | 待执行 | READY_FOR_REVIEW |
| 3 | PowerShell 薄壳 + `$suites` 登记 + 全量入口 | 已取得：登记前全量 runner `relay-light-log` 零命中；隔离证 exit 7 透传与单行 SKIP（E-B3-002/003） | 已转绿：薄壳 exit 0、全量 `RELAY ALL PASS`、Python 直跑 148 项 OK（E-B3-004/005/006） | 待执行 | READY_FOR_REVIEW |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 | 支撑结论 |
|---|---|---|---|---|
| W-BL-001 | Git / workspace 基线 | `git status --short --branch`; `git rebase --autostash master`; `git merge-base HEAD master`; `git rev-parse master` | branch=`wt/RLT_10`；rebase=`Current branch ... is up to date`；merge-base 与 master 均为 `73947acdf48514704e1d535effc01598acaf2556`；动笔前无 tracked/untracked WIP | W 在正确任务树和已核对 master 基线上规划 |
| W-BL-002 | Python 现状基线（A15 旁证，不是 A11） | `python3 -m unittest tools/relay-light/test_relay_log.py tools/relay-light/test_install_skill.py -v` | exit 0；Ran 146 tests in 157.687s；OK (skipped=2)；两项为既有 A114/relay_log.py 范围缺口 skip | 两份现状测试可在本 Linux 环境直接运行；不冒充 pwsh/Windows runner 验收 |
| E-B1-001 | Git 基线（B1 进场） | `git rebase --autostash master`; `git status`; `git branch --show-current` | rebase=`当前分支 wt/RLT_10 是最新的`；工作区干净；分支=`wt/RLT_10` | B1 施工在正确任务树与已核对 master 基线上开始 |
| E-B1-002 | A80 冻结入口有效 RED | `python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanLintTests.test_lint_cli_exit_stderr_and_json_contract` | exit 1；`FAILED (failures=1, errors=1)`；`--json valid plan` 分支 `0 != 2`；`--json semantic violation` 分支 `json.loads` 空 stdout `JSONDecodeError`；valid-exit-0 / semantic-exit-2 / exit-3 三分支绿 | RED 精确落在 `--json` 行为缺口，非 fixture/环境错误；非 `--json` 三分支证明测试其余断言与现状一致 |
| E-B1-003 | `lint --json` 原始 CLI 探针 | `python3 tools/relay-light/relay_log.py lint --plan <valid_plan_dir> --json --config-dir tools/relay-light/skill` | exit 2；stdout 空；stderr 一行 `error: arguments unrecognized arguments: --json` | F-001 坐实：`lint_parser` 未注册 `--json`，argparse 按 `error: arguments` 退 2；与 task_plan 预测一致，属有效行为 RED |
| E-B1-004 | A94 四类别基线 | `python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanLintTests tools.relay-light.test_relay_log.RelayConfigTests tools.relay-light.test_relay_log.RelayLifecycleTests tools.relay-light.test_relay_log.RelayLimitsTests` | Ran 97 tests in 123.742s；`FAILED (failures=1, errors=1)`；唯一失败=新增合同测试的两个 `--json` 分支，其余 96 项全绿 | 既有 20 行规则反例全部仍按其映射 ID 触发；B1 唯一回归缺口即 F-001 |
| E-B1-005 | 边界四集合 + whitespace | `git diff --check`; `git status --short`; `git diff --name-only master...HEAD`; `git ls-files --others --exclude-standard` | `diff --check` exit 0；master...HEAD 仅 `docs/modules/relay-light/workspace/RLT_10/**`；working tree/index 仅 `test_relay_log.py` + RLT_10 施工账；untracked 仅测试运行副产品 `__pycache__`（已删除）；`relay_log.py`/`install_skill.py` 零 diff | 本批全部改动落在 allowed-paths 闭集内 |
| E-B1-006 | Git 基线（B1 恢复进场） | `git rebase --autostash master`; `git status`; `git branch --show-current` | rebase=`当前分支 wt/RLT_10 是最新的`；工作区干净；分支=`wt/RLT_10`；HEAD=`91d9fe6` | 恢复施工在 decision.1/A 已同步的基线上开始 |
| E-B1-007 | A80 冻结入口转绿 | `python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanLintTests.test_lint_cli_exit_stderr_and_json_contract` | exit 0；`OK`；1 test（五个 subTest 分支全过） | A80 合同经唯一冻结入口完整通过 |
| E-B1-008 | `lint --json` 原始 CLI 取证 | `relay_log.py lint --plan <dir> --json --config-dir tools/relay-light/skill` | 违规计划→`{"ok": false, "violations": [{"rule": "HC-RL-A46", "message": "line 7: duplicate node W1", "line": 7}]}` exit 2；合法计划→`{"ok": true, "violations": []}` exit 0；文本模式仍 `lint: ok` exit 0；缺计划+`--json`→`error: HC-RL-A18 ...` exit 3 | 字段完整真实（rule/message/line），exit 0/2/3 与 stderr 合同保持；exit-3 不伪造 lint 违反项 |
| E-B1-009 | A94 四类别基线转绿 | `python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanLintTests tools.relay-light.test_relay_log.RelayConfigTests tools.relay-light.test_relay_log.RelayLifecycleTests tools.relay-light.test_relay_log.RelayLimitsTests` | exit 0；Ran 97 tests in 123.076s；`OK` | A94 命令组全绿，含新合同测试 |
| E-B1-010 | 两份 Python 全量回归（A15 旁证） | `python3 -m unittest tools/relay-light/test_relay_log.py tools/relay-light/test_install_skill.py -v` | exit 0；Ran 147 tests in 159.256s；`OK (skipped=2)` | 整仓 Python 回归绿；两项 skip 为既有 A114/relay_log.py 范围缺口，非本批引入 |
| E-B2-001 | Git 基线（B2 进场） | `git rebase --autostash master`; `git status`; `git branch --show-current` | rebase=`当前分支 wt/RLT_10 是最新的`；工作区干净；分支=`wt/RLT_10`；前置 audit PASS 信号与 check.C1.md 已在位 | B2 施工在正确任务树、已核对基线与已闭合 B1 小审上开始 |
| E-B2-002 | A16 变异 RED（未提交） | `python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanLintTests.test_relay_log_imports_are_stdlib_only`（临时在收集集合注入 `rlt10_fake_third_party`） | exit 1；`FAILED (failures=1)`；`AssertionError: ['rlt10_fake_third_party'] is not false : non-stdlib top-level imports in relay_log.py: ['rlt10_fake_third_party']` | 断言确实会咬非标准库 import，失败消息列出排序越界名；变异随即撤销、未入任何提交 |
| E-B2-003 | A16 冻结入口 GREEN | `python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanLintTests.test_relay_log_imports_are_stdlib_only`（正式版） | exit 0；`OK`；0.052s；另立独立收集脚本复核：collected={__future__,argparse,dataclasses,datetime,json,os,pathlib,re,sys,tomllib,urllib}，越界集=[] | `relay_log.py` 顶层 import 全部属标准库；收集非空断言防止空文件假绿 |
| E-B2-004 | 两份 Python 全量回归（A15 旁证） | `python3 -m unittest tools/relay-light/test_relay_log.py tools/relay-light/test_install_skill.py -v` | exit 0；Ran 148 tests in 155.371s；`OK (skipped=2)` | 新用例并入后整仓 Python 回归绿；两项 skip 仍为既有 A114 缺口 |
| E-B2-005 | 边界四集合 + whitespace（B2） | `git diff --check`; `git status --short`; `git ls-files --others --exclude-standard` | `diff --check` exit 0；本批 working tree 仅 `test_relay_log.py`（`import ast` + 一个测试方法）；`relay_log.py` 本批零 diff；untracked 仅测试副产品 `__pycache__`（已删除） | B2 全部改动落在 allowed-paths；B1 已审 `lint --json` 改动未被本批触碰 |
| E-B3-001 | Git 基线（B3 进场） | `git rebase --autostash master`; `git status`; `git branch --show-current` | rebase=`当前分支 wt/RLT_10 是最新的`；工作区干净；分支=`wt/RLT_10`；B2 audit PASS 信号与 check.C2.md 已在位 | B3 施工在正确任务树、已核对基线与已闭合 B2 小审上开始 |
| E-B3-002 | 入口缺席 RED | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`（登记前） | exit 0；`RELAY ALL PASS (SKIPPED: 1)`；输出中 `relay-light-log` 命中 0 次 | 登记前 suite 名确实缺席，构成有效入口缺席 RED |
| E-B3-003 | 薄壳隔离行为证（最终版复验） | 临时目录复制壳 + 假 `python`（`#!/bin/sh exit 7`）；空 PATH 目录 | 假解释器：壳 exit 7；无解释器：stdout 恰 1 行 `SUITE SKIP relay-light-log (python/python3 missing)`、stderr 0 字节、exit 0 | 非零透传与缺解释器 SKIP 两条合同在最终版本上成立；临时文件不入提交 |
| E-B3-004 | 薄壳独立运行 GREEN | `pwsh -NoProfile -File tools/tests/relay-light-log.ps1` | exit 0；输出为两份 unittest 原始 `-v` 流（test_relay_log 148 项 + test_install_skill 4 项 OK） | A11：薄壳独立 exit 0 且原样展示 Python 输出 |
| E-B3-005 | 全量 runner 登记 GREEN | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | exit 0；第 740 行 `=== relay-light-log.ps1 ===` 后随 unittest 原始输出；第 1000 行 `RELAY ALL PASS (SKIPPED: 1)` | A11：suite 名出现在全量入口且最终 exit 0 |
| E-B3-006 | 两份 Python 直跑（A15 旁证） | `python3 -m unittest tools/relay-light/test_relay_log.py tools/relay-light/test_install_skill.py -v` | exit 0；Ran 148 tests in 155.692s；`OK (skipped=2)` | Linux 直跑同两文件绿；仅旁证，不冒充 pwsh/Windows runner 验收 |
| E-B3-007 | 边界四集合 + whitespace（B3） | `git diff --check`; `git status --short`; `git ls-files --others --exclude-standard`; `git diff tools/tests/run-relay-tests.ps1` | `diff --check` exit 0；改动仅新文件 `relay-light-log.ps1` 与 runner `$suites` 末尾一行追加；`relay_log.py`/`install_skill.py` 本批零 diff；untracked 副产品已清 | runner foreach/计数/总结架构未动；B3 全部改动落在 allowed-paths |

## B1 §3.5 规则映射盘点矩阵（exec 机械抄表 + 读码对出触发方）

> 来源：design/01 §3.5 映射表 20 行（2026-09-13 重抄，非缓存）；unique ID 集合 = {A24,A18,A116,A130,A46,A47,A48,A72,A89,A35,A71,A75,A129,A104,A109,A87,A126,A97}，与 task_plan 缓存行一致。「CLI 观察」指已有经 `run_lint_cli`/`run_cli("lint",...)` 锁 `lint:` stderr 的用例；其余经 `lint_plan` 直接锁 `RelayError.code`。E-B1-004 的 97 项运行证明下表每个触发方当前实跑仍按其登记 ID 命中。

| # | 规则描述（§3.5 摘要） | 期望 ID | 现有触发方法 | CLI 观察 | 差集 |
|---|---|---|---|---|---|
| 1 | 缺表头/表结构不合法/单元格含竖线 | A24 | `test_fixed_tables_and_cells_fail_closed`（竖线单元格） | 否 | 无 |
| 2 | `agent.node` 不存在 / 同节点 agent 重名 | A24 | `test_agent_rows_reference_existing_nodes_with_unique_names`（两种形态） | 否 | 无 |
| 3 | 缺 marker / 缺 `skill=`/`session=`/`recipe=`/`cards=` | A18 | `test_marker_requires_only_frozen_fields_and_allows_missing_generated`；`test_empty_cards_is_a_plan_parse_error_in_the_lint_cli` | 是（exit 3 `error:`） | 无 |
| 4 | `recipe` 非法 / R 阶段 reviewer 集合不符 | A116 | `test_recipe_reviewer_mismatch_is_rejected_as_a116`、`test_one_mismatched_r_instance_rejects_the_whole_plan`、`test_recipe_value_must_name_a_configured_tier`、`test_recipe_tiers_stay_within_the_frozen_three_value_enum`、`test_a_config_without_one_frozen_tier_rejects_plans_using_it` | 是 | 无 |
| 5 | `decision_mode` 非法 | A130 | `test_decision_mode_accepts_frozen_values_and_rejects_others` | 否 | 无 |
| 6 | 节点号重复（含 superseded） | A46 | `test_node_number_is_unique_even_when_superseded`；`test_runtime_plan_semantic_errors_map_to_exit_three_while_lint_is_two` | 是 | 无 |
| 7 | `close` 非法 / 引用不存在 agent | A47 | `test_close_requires_an_active_agent_of_its_node`（两形态） | 否 | 无 |
| 8 | `depends_on` 不存在 / 成环 | A48 | `test_dependencies_must_exist_and_be_acyclic`（两形态） | 否 | 无 |
| 9 | `depends_on` 指向 superseded | A72 | `test_dependencies_cannot_target_superseded_nodes` | 否 | 无 |
| 10 | `depends_on` 跨阶段指向后阶段 | A89 | `test_a89_lint_rejects_a_backward_cross_stage_dependency` | 是 | 无 |
| 11 | `trigger` 非法 / `on:done:` 引用不存在 | A35 | `test_trigger_values_and_same_node_done_references_are_checked`（两形态） | 否 | 无 |
| 12 | `on:done:` 跨节点引用 | A71 | 同上（`on:done:builder` 跨节点） | 否 | 无 |
| 13 | 空节点（无非 superseded agent） | A75 | `test_each_active_node_needs_an_active_agent`（零 agent + 全 superseded） | 否 | 无 |
| 14 | `stage` 值不在枚举 | A129 | `test_stage_must_be_known_and_grouped_contiguously`（`Z#1`） | 否 | 无 |
| 15 | 同 stage 节点未连续分组 | A129 | `test_stage_must_be_known_and_grouped_contiguously`（两例）；`test_structural_lint_precedes_the_recipe_check` | 是 | 无 |
| 16 | `stage_id` 格式非法 / `<card>` 前缀不符 | A104 | `test_stage_id_card_and_instance_are_structural`（两形态） | 否 | 无 |
| 17 | 同卡阶段实例并行 | A109 | `test_same_card_stages_are_serial_but_cards_can_be_parallel` | 否 | 无 |
| 18 | `card` 不在 marker `cards` | A87 | `test_card_and_node_type_are_limited`（首例） | 否 | 无 |
| 19 | kickoff / verify-signoff 类 `type` | A126 | `test_card_and_node_type_are_limited`、`test_forbidden_types_are_the_sole_violation_in_legal_plans` | 否 | 无 |
| 20 | `X#k` 超 `rework_max_rounds` | A97 | `test_x_rounds_beyond_the_configured_limit_are_rejected_as_a97` | 是 | 无 |

按规则行差集为空，B1 未复制既有反例；本批新增仅为 A80 冻结入口一法（`--json` 缺口即 F-001，导致 BLOCKED）。

## 信号
DONE task=RLT_10 role=builder batch=W status=W_READY evidence=brief.md,task_plan.md,execution_strategy.md,progress.md,findings.md,lesson_candidates.md,review.md,commit=0d1520f next=orchestrator
DONE task=RLT_10 role=audit batch=W status=FAIL evidence=review.plan.md next=orchestrator
DONE task=RLT_10 role=builder batch=W2 status=W_READY evidence=commit=0fc505a next=orchestrator
DONE task=RLT_10 role=audit batch=W2 status=PASS evidence=review.plan.md next=orchestrator
DONE task=RLT_10 role=exec batch=1 status=BLOCKED evidence=E-B1-001,E-B1-002,E-B1-003,E-B1-004,E-B1-005,F-001,commit=5b79d03 next=orchestrator
DONE task=RLT_10 role=decide batch=1 status=CONSULT evidence=decision.1.md next=orchestrator
DECISION task=RLT_10 batch=1 decision=decision.1 choice=A by=user(2026-09-13, orchestrator session) scope=relay_log.py:lint --json only next=exec-B1-resume
DONE task=RLT_10 role=exec batch=1 status=READY_FOR_REVIEW evidence=E-B1-006,E-B1-007,E-B1-008,E-B1-009,E-B1-010,commit=542e2df next=orchestrator
DONE task=RLT_10 role=audit batch=1 status=PASS evidence=check.C1.md next=orchestrator
DONE task=RLT_10 role=exec batch=2 status=READY_FOR_REVIEW evidence=E-B2-001,E-B2-002,E-B2-003,E-B2-004,E-B2-005,commit=0746c64 next=orchestrator
DONE task=RLT_10 role=audit batch=2 status=PASS evidence=check.C2.md next=orchestrator
DONE task=RLT_10 role=exec batch=3 status=READY_FOR_REVIEW evidence=E-B3-001,E-B3-002,E-B3-003,E-B3-004,E-B3-005,E-B3-006,E-B3-007,commit=3db8ad8 next=orchestrator
DONE task=RLT_10 role=audit batch=3 status=FAIL evidence=check.C3.md next=orchestrator
