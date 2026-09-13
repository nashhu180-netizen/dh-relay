<!-- dh:v1 · requirement 路复核 — RLT_10 -->
# requirement-rlt10-review — RLT_10 需求方向复核

- **身份**：`rlt10-review2`（RLT_10 复核者，normal Recipe 三路之 requirement 路）
- **模型自报**：Devin · SWE-2 Max
- **复核对象**：`wt/RLT_10` @ `b796991`（`git diff master...HEAD` 整卡，基线 master `73947ac`）
- **只读声明**：本路只读源码/工件并复跑只读验证命令，未修改任何文件。

## 输入清单

- `dispatch/README.md`、`dispatch/review.md`、`brief.md`、`task_plan.md`、`progress.md`（含证据账本与 §3.5 盘点矩阵）、`findings.md`、`decision.1.md`、`lesson_candidates.md`、`check.C1.md`/`check.C2.md`/`check.C3.md`
- `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` §3.1（lint 签名行）、§3.5（lint 违反项输出 + 20 行规则映射表）、§11（HC-RL-A80/A94/A11/A15/A16 原文逐字）
- `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` §RLT_10（目标/非目标/四条验收/允许路径）
- 整卡 diff：`relay_log.py`、`test_relay_log.py`、`relay-light-log.ps1`（新）、`run-relay-tests.ps1`、DevPlan、dispatch 与 RLT_10 workspace
- 复核者实跑（只读）：A80 冻结入口、A16 冻结入口、`lint --json` 原始 CLI 探针（A46 违规例 + A130 无行号例）

---

## 一、四条 HC oracle 逐条对照

### HC-RL-A80 — **命中**

> 原文：「`lint` 合同：签名与退出码 0/2/3；违反项每条一行写 stderr，格式 `lint: <规则编号> <message>` 且编号为验收项 ID；`--json` 输出 `{"ok","violations":[{"rule","message","line"}]}`」；单测判据「三种退出码各一例；断言行格式与编号取值；`--json` 逐字段断言」。

- **签名**：`relay_log.py:1884-1886` 注册 `lint --plan <dir> [--json] [--config-dir]`，与 §3.1 冻结签名一致。
- **退出码 0/2/3**：冻结入口 `test_lint_cli_exit_stderr_and_json_contract`（`test_relay_log.py:589`）单一方法内五个 subTest 覆盖；复核者复跑 `python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanLintTests.test_lint_cli_exit_stderr_and_json_contract` → exit 0，`OK`。
- **stderr 行格式**：违规分支逐非空行 `^lint: (HC-RL-A[0-9]+) .+$` fullmatch 且 ID ∈ 白名单；复核者机械比对——测试内冻结白名单 111 个 ID 与 design §11 第一列 111 个 ID **完全相等**（`design-not-in-whitelist=[]`、`whitelist-not-in-design=[]`），非自证循环。
- **`--json` 逐字段**：断言顶层精确键 `{ok,violations}`、violation 精确键 `{rule,message,line}`、类型（rule/message 为非空 str、line 为 int 且非 bool）、`violations[0]={rule:"HC-RL-A46", line:7}`。复核者原始 CLI 探针复现：`{"ok": false, "violations": [{"rule": "HC-RL-A46", "message": "line 7: duplicate node W1", "line": 7}]}` exit 2；合法计划 `{"ok": true, "violations": []}` exit 0。
- **冻结入口唯一性**：全仓 grep 仅一个 `test_lint_cli_exit_stderr_and_json_contract`，未被同名前缀方法组替换（`test_lint_cli_smoke_uses_success_and_plan_error_contracts` 是既有的另一方法，非替代）。
- **P3**：`--json` 两分支未断言 stderr 为空（实现实际不发 stderr，oracle 未规定 `--json` 下 stderr 行为）；`--json` + exit-3 组合（仍走 `error:` stderr）只在 E-B1-008 原始探针中取证，未进冻结方法——均不违 oracle 字面，仅锁定强度可再加深。

### HC-RL-A94 — **命中**

> 原文：「lint 规则编号全覆盖：§3.5 映射表列出的每条规则都能被触发，且报出的编号存在于本验收表」；单测判据「逐规则构造反例，断言编号集合 ⊆ 验收 ID 集合」。

- **逐规则可触发**：`progress.md` 「B1 §3.5 规则映射盘点矩阵」把 design §3.5 的 20 行映射（非 unique ID 去重）机械抄成「规则→期望 ID→现有触发方法」矩阵，按规则行差集为空。复核者抽查矩阵列名的全部 16 个触发方法，确认每个均以 `assert_rule("HC-RL-A<映射ID>")` 或 `assertRegex(stderr, r"^lint: HC-RL-A<映射ID> ")` 锁**精确编号**——比「⊆ 验收集」更强。
- **实跑佐证**：E-B1-004/E-B1-009 四类别组（`RelayPlanLintTests`+`RelayConfigTests`+`RelayLifecycleTests`+`RelayLimitsTests`）97 项在 `--json` 修复后全绿，矩阵声明的触发方当前实跑仍按登记 ID 命中。
- **编号 ⊆ 验收表**：§3.5 全部映射 ID（18 unique：A24,A18,A116,A130,A46,A47,A48,A72,A89,A35,A71,A75,A129,A104,A109,A87,A126,A97）均为 §11 第一列成员；新合同测试另对采样违规断言 `rule ∈ acceptance_ids`。
- **差集为空未重复造例**：符合 task_plan「差集为空则不复制既有反例」。

### HC-RL-A11 — **命中**

> 原文：「测试经薄壳 `tools/tests/relay-light-log.ps1` 登记进 `$suites` 并全绿」；判据「跑 `run-relay-tests.ps1` 全量，展示退出码与套件名」。

- **薄壳** `tools/tests/relay-light-log.ps1`（12 行）：`python`→`python3` 顺序 `Get-Command -CommandType Application` 取首命中 `.Source`；两者皆缺时恰一行 `SUITE SKIP relay-light-log (python/python3 missing)` 并 exit 0；经 `$PSScriptRoot` 上溯仓根顺序跑两份 unittest `-v`，原样透传输出、非零即以 `$LASTEXITCODE` 退出。不复制断言、不改写为 PowerShell。
- **登记**：`run-relay-tests.ps1` diff 仅在 `$suites` 末项后追加 `'relay-light-log.ps1'`。
- **全绿证据**：E-B3-005 全量 runner exit 0、输出含 `=== relay-light-log.ps1 ===`（第 740 行）与 `RELAY ALL PASS (SKIPPED: 1)`（第 1000 行）；check.C3 审核者独立复跑复现同一行号与 141+7 分项。E-B3-003 隔离证：假解释器 exit 7 透传、无解释器单行 SKIP exit 0。

### HC-RL-A16 — **命中**

> 原文：「账本程序只用标准库」；判据「静态检查 import 全在标准库清单内」。

- `test_relay_log_imports_are_stdlib_only`（`test_relay_log.py:716`）：`ast.parse` 读仓内 `relay_log.py`（不 import/执行被测模块）；`Import` 收 `alias.name.split('.')[0]`、`ImportFrom` 收 `node.module.split('.')[0]`；`__future__` 单列；差集须 ⊆ `sys.stdlib_module_names`；失败消息列排序越界名；`assertTrue(modules)` 防空文件假绿。
- 复核者复跑 → exit 0（0.064s）。变异 RED（注入 `rlt10_fake_third_party`）已在 E-B2-002 取证并撤销未提交；collected 集合 `{__future__,argparse,dataclasses,datetime,json,os,pathlib,re,sys,tomllib,urllib}` 与源码 import 段一致。

### HC-RL-A15 — **旁证处理正确**（不计入本卡四条）

- Linux 直跑同两文件（E-B1-010/E-B2-004/E-B3-006，148 项 `OK (skipped=2)`）已留证且**明示只作旁证**，未冒充 A11 的 pwsh runner 证据，也未冒充 RLT_17 的 Linux 真机验收——符合 brief 边界。

---

## 二、DevPlan 非目标核对（§RLT_10）

| 非目标 | 核对结果 |
|---|---|
| 不改 `run-relay-tests.ps1` 循环架构 | **未越过**：diff 仅 `$suites` 数组末尾一项追加；`foreach`、`SUITE SKIP` 计数、`$failed`/`$skipped` 与总结行零改动 |
| 不把 Python 测试改写成 PowerShell | **未越过**：薄壳只定位解释器并 `& $python -m unittest` shell out，无断言重写 |
| 本卡不冒充 Linux 真机证据 | **未越过**：progress 明确标「Linux pwsh 7.6.6 本地兼容证，不冒充 Windows 真机」；A15 标旁证 |

---

## 三、允许路径闭集核对（含 decision.1 选项 A 窄授权）

`git diff --name-only master...HEAD` 全量清单逐条落位：

| 路径 | 落位 |
|---|---|
| `tools/relay-light/relay_log.py` | decision.1/A 追加路径内，且 diff 限 `lint --json`：`lint_parser` 注册 `--json`、`_lint_command` 增 `as_json` 透传、新增 `_lint_violation` 与 `LINT_VIOLATION_LINE_RE`；lint 规则语义、status/add、installer、runner 零改动——**窄授权内** |
| `tools/relay-light/test_relay_log.py` | 允许路径内（+`import ast`、两个新测试方法） |
| `tools/tests/relay-light-log.ps1` | 允许路径内（新文件） |
| `tools/tests/run-relay-tests.ps1` | 允许路径内（仅 `$suites` 追加） |
| `docs/modules/relay-light/workspace/RLT_10/**` | 允许路径内 |
| `docs/modules/relay-light/dev_plan/P1-...md` | **不在 exec 允许路径字面值内**，但属 decision.1/A 交接条件明列的「由授权规划角色同步 DevPlan §RLT_10 allowed-paths」合同同步（commit `9d1f7d7`，内容恰为允许路径块单行追加），非施工越界 |
| `docs/modules/relay-light/workspace/RLT_10/dispatch/README.md` 等 | 同上，decision.1/A 同步动作 |

- `install_skill.py`、`test_install_skill.py` 零 diff；工作区/index/untracked 干净；`git diff --check` 通过。
- `relay_log.py` 变更逐行复核确认未越出「参数注册、分发、JSON 输出、真实行号传递」四项用途。

---

## 四、逐条结论（P0~P3）

| # | 级别 | 条目 | 说明 |
|---|---|---|---|
| 1 | — | HC-RL-A80 | **命中**：签名/退出码/stderr 行形/白名单/JSON 逐字段全部落位；冻结入口唯一且复核者复跑绿 |
| 2 | — | HC-RL-A94 | **命中**：20 行规则映射按规则行差集为空，每行触发方断言精确映射 ID，97 项组实跑绿 |
| 3 | — | HC-RL-A11 | **命中**：薄壳登记入 `$suites`，全量输出含套件名与 `RELAY ALL PASS` exit 0；SKIP/透传两分支有隔离证据且被 checker 复现 |
| 4 | — | HC-RL-A16 | **命中**：AST 静态检查按 oracle 实现，变异 RED→撤销 GREEN 链完整，复核者复跑绿 |
| 5 | — | HC-RL-A15 | **旁证正确处理**：Linux 直跑留证且未计入四条验收 |
| 6 | — | 非目标 | **未越过**：runner 循环架构未改、无 PowerShell 改写、无真机证据冒充 |
| 7 | — | 允许路径闭集 | **闭合**：`relay_log.py` 变更限 decision.1/A 窄授权；DevPlan/dispatch 改动为裁决明列的合同同步 |
| 8 | P3 | `--json` 分支 stderr 未断言 | 实现实际静默，oracle 未规定；可在后续卡加深锁定 |
| 9 | P3 | `--json`+exit-3 未进冻结方法 | 仅 E-B1-008 原始探针取证（`error: HC-RL-A18` exit 3）；合同文本允许该解释，冻结方法内未覆盖 |
| 10 | P3 | JSON `line` 对无行号规则为 `null` | A48 环/A129 连续/A130/A109/A116 消息无 `line N:` 前缀，实测 A130 → `"line": null`；键恒在、取值诚实，符合 decision.1「真实行号」边界；冻结测试只在 A46 例上锁 int |
| 11 | — | 证据链事故 | E-B3-004 分项误记（148+4 → 实 141+7）被 check.C3 FAIL 捕获，经 E-B3-008 更正且历史不改写；流程机制按设计工作 |

## 结论

**APPROVE_WITH_NITS**

四条 HC 全部命中，DevPlan 非目标未越过，允许路径闭集在 decision.1/A 授权范围内闭合。仅存三条 P3 级锁定强度观察（#8–#10），不阻塞本卡进入下一闸。本路只写事实与级别，验收裁决归主控。
