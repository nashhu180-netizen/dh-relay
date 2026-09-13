<!-- dh:v1 -->
# code-round1 — RLT_10 复核（代码轮 1）

- 身份：`rlt10-review`（normal Recipe 三路之一：code-round1）；模型自报：Devin / SWE-2 Max。
- 复核对象：wt/RLT_10 整卡 diff（基线 master `73947ac` → 复核开始时 HEAD `b796991`；复核期间 `70d68b8` 落盘，见 P2-1）。
- 输入清单：`dispatch/README.md`、`dispatch/review.md`、`brief.md`、`task_plan.md`、`progress.md`（证据账本+§3.5 盘点矩阵）、`findings.md`、`decision.1.md`、`check.C1/C2/C3.md`、`lesson_candidates.md`、`git diff master...HEAD` 全量、design/01 §3.5 映射表与 §11 验收清单原文、`relay_log.py` / `test_relay_log.py` / `relay-light-log.ps1` / `run-relay-tests.ps1` 现行源码。
- 边界：只读不改（运行测试产生的 `__pycache__` 副产品已清理/恢复）；只写事实与级别，不做验收裁决。

## 复核者独立复跑（四条 HC 验证命令，退出码为本人实测）

| HC | 命令（缩写） | 退出码 | 实测输出 |
|---|---|---|---|
| A80 | `python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanLintTests.test_lint_cli_exit_stderr_and_json_contract` | **0** | Ran 1 test in 1.061s，OK（唯一冻结入口，5 个 subTest 分支全过） |
| A94 | `python3 -m unittest -v RelayPlanLintTests RelayConfigTests RelayLifecycleTests RelayLimitsTests`（四类别全名） | **0** | Ran 98 tests in 125.268s，OK |
| A11 | `pwsh -NoProfile -File tools/tests/relay-light-log.ps1` | **0** | test_relay_log.py `Ran 141 tests` / `OK (skipped=2)`；test_install_skill.py `Ran 7 tests` / `OK` |
| A11 | `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | **0** | 第 740 行 `=== relay-light-log.ps1 ===`，第 1000 行 `RELAY ALL PASS (SKIPPED: 1)` |
| A16 | `python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanLintTests.test_relay_log_imports_are_stdlib_only` | **0** | Ran 1 test in 0.062s，OK |

附注（事实，非缺陷）：A94 命令组实测 98 项，多于 E-B1-009 记录的 97 项——B2 把 `test_relay_log_imports_are_stdlib_only` 加进了 `RelayPlanLintTests`，该类在 A94 命令组内，时序上自洽。 skipped=2 为既有 F-002 A114 skip，非本卡引入。全量 `SKIPPED: 1` 是 `relay-psmux-real`（需 `RELAY_REAL_TERMINAL=1`），非本 suite。

## 逐条核对

### 1. 新增用例是否真正断言合同（非弱断言）— PASS

`test_lint_cli_exit_stderr_and_json_contract`（test_relay_log.py:589）单方法五分支：

- valid：exit 0 + stdout **精确** `lint: ok\n` + stderr 空；
- semantic violation：exit 2 + stdout 空 + 每条非空 stderr 行 `fullmatch` `^lint: (HC-RL-A[0-9]+) .+$` 且 ID ∈ §11 白名单；
- exit-3 三分支（缺 plan / 非法 plan / 缺 config-dir）各自断言 exit 3、`^error: HC-RL-A18|A135 `、且 `assertNotIn("lint:", stderr)` 不误判成 violation；
- `--json` valid：`json.loads` 后 `set(document)=={"ok","violations"}`、`assertIs(ok, True)`、`violations==[]`；
- `--json` violation：exit 2 + 顶层精确键 + 每个 violation 精确键 `{rule,message,line}`、`rule` str 且在白名单、`message` 非空 str、`line` int 且 `assertFalse(isinstance(line, bool))`（bool 是 int 子类，此断言挡掉了 `true` 冒充行号）；另钉死 `violations[0].rule=="HC-RL-A46"`、`line==7`。

行号 7 经本人核算属实：fixture 布局 marker=1、空行=2、`## 节点表`=3、NODE_HEADER=4、SEPARATOR=5、首行 W1=6、重复 W1=7；`lint_plan` 首循环在 line 7 抛 A46 先于任何 type 检查。fixture 注释与实现一致。

### 2. A94 编号枚举机械可复算 — PASS

- 本人从 design/01 §3.5 重抄 20 行映射（行 410–429），unique ID 集合 = {A24,A18,A116,A130,A46,A47,A48,A72,A89,A35,A71,A75,A129,A104,A109,A87,A126,A97} 共 18 个，与 task_plan 缓存行及 progress 矩阵一致；A24、A129 各覆盖两行规则，按规则行核对无差集。
- 矩阵列出的 24 个触发方法逐一以脚本扫描方法体：全部存在，且每个方法体内确实出现所映射 ID 的断言（`assert_rule("HC-RL-Axx")` 锁 `RelayError.code`，或 stderr `^lint: HC-RL-Axx ` + exit 2 锁 CLI 层）。抽读 `test_fixed_tables_and_cells_fail_closed`、`test_a89_lint_rejects_a_backward_cross_stage_dependency`、`test_x_rounds_beyond_the_configured_limit_are_rejected_as_a97` 确认 ID 出现在断言而非注释。
- §11 白名单机械核对：从 design §11.1 首列提取 111 个 ID，与测试内 `acceptance_ids` frozenset **双向差集均为空**——是设计冻结集，非程序输出自证循环。

### 3. A16 静态检查方法可靠性 — PASS

`test_relay_log_imports_are_stdlib_only`（test_relay_log.py:696）：`Path(__file__).with_name("relay_log.py")` 定位 → `ast.parse`（不 import 被测模块）→ `ast.Import` 收 `alias.name.split('.')[0]`、`ast.ImportFrom` 收 `node.module.split('.')[0]`（`node.module` 真值守卫，兼容 `from . import x` 的 None 形态）→ 先断言收集非空防空文件假绿 → `discard("__future__")` → 与 `sys.stdlib_module_names` 作差，失败消息列排序后越界名。变异 RED（注入 `rlt10_fake_third_party`）有 E-B2-002 记录且未提交。relay_log.py 现行顶层 import（argparse/json/os/re/sys/tomllib/dataclasses/datetime/pathlib/urllib）经本人复跑 GREEN。

### 4. 薄壳合同 — PASS

`tools/tests/relay-light-log.ps1`（12 行）：只 shell out，不重写断言。`python`→`python3` 顺序 `Get-Command -CommandType Application` 取 `(Select-Object -First 1).Source`（多命中数组化已修）；两者皆缺恰一行 `SUITE SKIP relay-light-log (python/python3 missing)` + `exit 0`，命中 runner 的 `'SUITE SKIP *'` 计数；`$PSNativeCommandUseErrorActionPreference=$false` 防 `ErrorActionPreference='Stop'` 下原生命令非零退出被 pwsh 7.4+ 转异常；`$PSScriptRoot/../..` 上溯仓根；每份 unittest 后 `exit $LASTEXITCODE` 透传首非零。E-B3-003（假 python exit 7 透传、无解释器单行 SKIP）与 check.C3 定向复验（`/bin/false` exit 1 透传）可复现。

### 5. runner 循环架构 — PASS

`run-relay-tests.ps1` diff 仅 `$suites` 末尾追加 `'relay-light-log.ps1'`（含前末项补逗号）；foreach、`$failed`/`$skipped` 计数、`RELAY ALL PASS`/`RELAY TESTS FAIL` 总结零改动。

### 6. `relay_log.py` 是否越出 decision.1/A 授权（仅限 `lint --json`）— PASS

整卡 `relay_log.py` diff 共 +29/-5：新增 `LINT_VIOLATION_LINE_RE` 与 `_lint_violation`（产出 `{rule,message,line}`，`line` 取自消息 `line <n>:` 前缀、无前缀为 `None`）；`_lint_command` 增 `as_json` 形参与两个 JSON 分支；`lint_parser` 注册 `--json` store_true；main 分发透传 `args.json`。exit-3 路径仍走既有 `_fail`→`error:` 合同，未伪造 lint 违反项；lint 规则语义、status/add、installer、runner 零改动。属授权文内「参数注册、分发与 JSON 输出、必要的真实行号传递」。DevPlan 增行即 decision.1/A 的 allowed-paths 同步记录，本身经授权。

## 发现项（按级别）

- **P2-1**：复核期间落盘的 `70d68b8`（requirement/lesson 复核提交）把 `tools/relay-light/__pycache__/install_skill.cpython-312.pyc`、`test_install_skill.cpython-312.pyc` 两个二进制副产品提交进树，现已进入 `git diff --name-only master...HEAD` 集合，且 `__pycache__` 不在 allowed-paths 闭集内。非施工提交、非代码缺陷，但合入 master 前须移除（删除并提交即可），否则二进制运行副产品将随 PR 进主干。
- **P3-1**：`lint --json` 叠加 exit-3 输入/配置失败的行为形状未钉——实现走 `_fail` 输出 `error:` 于 stderr、stdout 空，该行为经 decision.1 认可（不伪造 lint 违反项），但测试三个 exit-3 分支均未带 `--json`，组合路径无断言。
- **P3-2**：`--json` 两分支未断言 stderr 为空；实现当前 stderr 确实为空，行为正确但未冻结。
- **P3-3**：`line` 为 `null` 的 violation 形态（消息无 `line <n>:` 前缀，如 A130「invalid decision_mode」、A129 非连续分组行）经 decision.1 认可但无用例覆盖；合同测试只钉了 int 情形（A46→7）。
- 说明（非发现）：`violations` 数组当前基数恒为 1（`lint_plan` 遇首个违规即抛），合同要求的是结构形状，测试对列表逐元素断言，方向正确；基数>1 的场景在现有 lint 架构下不可达。

## 结论

**APPROVE_WITH_NITS**

五条 code-round1 检查项全部通过：新用例为强断言（精确键集/逐行 fullmatch/白名单机械可证）；A94 二十行枚举经本人重导零差集且每个触发方法体含对应 ID 断言；A16 AST 方法可靠且有未提交的变异 RED 记录；薄壳仅 shell out + 透传 + 单行 SKIP；runner 架构未改；`relay_log.py` 未越 decision.1/A 的 `lint --json` 专用授权。P2-1 的 `.pyc` 二进制入树为复核期提交卫生问题，合入前须清除；三条 P3 为已认可行为的未冻结边角，不阻塞。

```text
DONE task=RLT_10 role=review batch=R status=APPROVE_WITH_NITS evidence=reviews/code-round1-rlt10-review.md next=orchestrator
```
