<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_10 测试合同与仓库入口

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：你是 RLT_10 手动派活的 construction worker，只处理本次派单指定的一个 Batch。进入 `/home/nash/work/dh-relay/.dh-worktrees/RLT_10` 后第一个 Git 动作是 `git rebase --autostash master`；先读仓根 `AGENTS.md`、本文件、`brief.md`、`progress.md`、`findings.md` 与派单指定 oracle。只在 RLT_10 allowed-paths 内修改；偏离路线只记 progress/findings，不改本计划、DevPlan、design 或越界程序，不自行复核、verify、push、PR、merge 或部署。

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `AGENTS.md` | worker 铁律、allowed-path/复核/凭据边界 |
| C-002 | DevPlan §2.1 `test-entry`、§2.2、§RLT_10、§3.1 | owner、交付物、非目标、四条验收、normal Recipe |
| C-003 | design/01 §3.5 映射表、§3.8 | 20 行 lint 规则映射、薄壳/runner 合同 |
| C-004 | design/01 §11 HC-RL-A80/A94/A11/A15/A16 | 逐字 oracle 与证法 |
| C-005 | `relay_log.py`、`test_relay_log.py`、`test_install_skill.py` | 当前 CLI/import/测试覆盖，程序两文件只读边界 |
| C-006 | `tools/tests/run-relay-tests.ps1` 与任一 `relay-*.ps1` | `$suites`、`SUITE SKIP`、输出/退出码风格 |
| C-007 | `dispatch/README.md`、`dispatch/exec.md` | 手动派活信号、角色、逐批停止合同 |

## 全程允许路径闭集与禁改项

只允许修改：

- `tools/relay-light/test_relay_log.py`
- `tools/relay-light/test_install_skill.py`
- `tools/tests/relay-light-log.ps1`
- `tools/tests/run-relay-tests.ps1`
- `docs/modules/relay-light/workspace/RLT_10/**`

禁止修改 `relay_log.py`、`install_skill.py`、DevPlan、design、AGENTS、Runner 循环架构和其他 workspace。若测试证明必须改禁止路径才能满足 oracle，登记 finding 与证据后发 `DONE ... status=BLOCKED`，不得自行选边。

## 批次与 durable signal

B1 → audit PASS → B2 → audit PASS → B3 → audit PASS → orchestrator 再派施工收束，严格串行。每批写 progress 日志、E-ID 证据账并提交后，只追加一行：

```text
DONE task=RLT_10 role=exec batch=<1|2|3> status=<READY_FOR_REVIEW|BLOCKED> evidence=<E-ID,...,commit=SHA> next=orchestrator
```

B3 audit PASS 后，只有 orchestrator 再次明确派令，exec 才追加 `status=CONSTRUCTION_DONE`；不得在 B3 首次派单预写。任一 `BLOCKED` 先由 decide 裁决并由 orchestrator 重新开放。

## 施工共通约束

- 每批先做行为断言 RED，再作最小修改恢复 GREEN；导入失败、路径错误、fixture 错误、权限错误或解释器缺失都不是有效 RED。
- 每个证据先登记到 `progress.md` 的证据账本，再从 DONE 的 `evidence=` 引用；禁止悬空描述符。
- 每批运行目标测试、两份 Python 基线（适用时）、`git diff --check` 与四集合 allowed-paths 检查。
- 四集合分别为 `git diff --name-only master...HEAD`、working tree、index、untracked；逐集合反选 allowed-paths，任何越界都失败。
- 每批只暂存点名文件，禁止 `git add -A` / `git add .`；commit scope 使用英文 `relay-light`。
- audit 只读检查本批 diff/证据并写独立 `check.C*.md`；exec 不修改 audit 结论或 `review.md` 的复核结论。

## 施工步骤 (Steps)

### Batch 1 — lint CLI 合同与规则全覆盖（HC-RL-A80 / A94）

**改动文件**：`tools/relay-light/test_relay_log.py`，以及 RLT_10 `progress.md` / `findings.md` / `lesson_candidates.md`。

**先做差集盘点**

1. 把 design §3.5 映射表机械抄成 20 行盘点矩阵（不可只去重 ID）：规则描述、期望 ID、现有触发方法、是否通过 CLI 观察、缺口。
2. 映射表当前 unique ID 应为：`A24,A18,A116,A130,A46,A47,A48,A72,A89,A35,A71,A75,A129,A104,A109,A87,A126,A97`；必须由当时 design 重算，不信任本行缓存。
3. 逐个运行现有反例，确认实际 `RelayError.code` 或 CLI stderr 等于映射 ID；只出现字符串/注释不算触发。
4. `映射表规则行 − 已实际触发规则行` 才是补测清单。W 盘点显示 unique ID 无差集，但相同 ID 下多规则仍需逐行核对，尤其 A24 与 A129；施工时若事实变化，以实跑矩阵为准。

**新增/调整用例**

- 新增 `test_lint_cli_exit_stderr_and_json_contract`（可按单一职责拆为同名前缀的多个方法）：
  - valid plan：exit 0，stdout 为 `lint: ok`，stderr 空；
  - semantic violation：exit 2，stdout 空，每条 stderr 非空行严格匹配 `lint: <HC ID> <message>`，并断言 ID 在 §11 验收 ID 白名单；
  - parse/config input failure：exit 3，维持 `error: <ID> <message>`，不可误断成 lint violation；
  - `lint --json` 成功与失败各一例，逐字段断言顶层精确键 `ok/violations`，violation 精确键 `rule/message/line`，并核类型、空列表/非空列表和行号。
- 对差集中的每一规则只新增最小单缺陷 fixture；同 fixture 先直接调用 `lint_plan` 锁编号，再经 CLI 锁 stderr。若差集为空，不复制既有反例。
- 增加验收 ID 白名单时，从 design §11 机械提取/冻结预期集合，断言所有实际 `rule` 均属于该集合；不得用“以程序输出生成期望值”的自证循环。

**已知 RED / 停止边界**

W 现场确认当前 `lint` parser 未注册 `--json`，而 allowed-paths 禁止修改 `relay_log.py`。先提交能准确表达 A80 的测试并运行，预期 `--json` 分支得到 argparse exit 2 / `error: arguments ...`，这是有效行为 RED；把命令、exit、stderr 摘要记为 E-ID 和 F-001，然后发 `BLOCKED`。不得为追求 GREEN 修改 `relay_log.py`，也不得把 `status --json` 代替 `lint --json`。仅当 decider/orchestrator 给出不冲突的后续裁决并重新派单，才继续。

**红 → 绿命令**

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayPlanLintTests.test_lint_cli_exit_stderr_and_json_contract
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayPlanLintTests \
  tools.relay-light.test_relay_log.RelayConfigTests \
  tools.relay-light.test_relay_log.RelayLifecycleTests \
  tools.relay-light.test_relay_log.RelayLimitsTests
```

RED：新增合同断言因产品行为不满足而失败，failure 精确落在 exit/stderr/JSON 字段之一。GREEN：新增合同与全部映射反例通过，且 20 行盘点无缺口。任何环境/fixture/setup 失败均无效，先修测试再取红。

**audit 小审输入**：B1 增量 diff；20 行规则矩阵及差集；新增测试清单；RED/GREEN 原始摘要与退出码；F-001/decider 裁决（如发生）；全相关测试结果；四集合边界；commit SHA。

### Batch 2 — 标准库静态检查（HC-RL-A16）

**前置**：B1 audit PASS；若 B1 BLOCKED，必须已有 decide 裁决和 orchestrator 明确重派。

**改动文件**：`tools/relay-light/test_relay_log.py` 与 RLT_10 施工账。

**新增用例**：`test_relay_log_imports_are_stdlib_only`。

1. 从测试文件位置解析仓内 `relay_log.py`，使用 `ast.parse`；不得 import/执行被测模块来替代静态检查。
2. 对 `ast.Import` 收集 `alias.name.split('.')[0]`；对 `ast.ImportFrom` 收集 `node.module.split('.')[0]`。
3. `__future__` 单列允许；其余顶层模块必须在 `sys.stdlib_module_names`。
4. 失败消息列出排序后的越界模块；另断言扫描结果非空，防止路径错/空文件假绿。

**红 → 绿方法**：测试先临时把已观测标准库名之一加入拒绝集合或给解析源码 AST 注入一个假第三方 import，确认断言 RED；随后撤销变异，只保留正式测试，现状 import 集合应 GREEN。变异不得提交。

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayPlanLintTests.test_relay_log_imports_are_stdlib_only
python3 -m unittest tools/relay-light/test_relay_log.py tools/relay-light/test_install_skill.py -v
```

**audit 小审输入**：AST 收集逻辑；变异 RED 与恢复 GREEN；完整两文件结果；`relay_log.py` 零 diff；四集合边界；commit SHA。

### Batch 3 — PowerShell 薄壳与全量 suite 登记（HC-RL-A11；A15 旁证）

**前置**：B2 audit PASS。

**改动文件**：新建 `tools/tests/relay-light-log.ps1`；只在 `tools/tests/run-relay-tests.ps1` 的 `$suites` 数组末尾追加 `'relay-light-log.ps1'`；RLT_10 施工账。

**薄壳行为**

1. `$ErrorActionPreference = 'Stop'`、UTF-8 输出；按 `python` 后 `python3` 的顺序用 `Get-Command` 选第一个可用解释器。
2. 两者都缺失时只写 `SUITE SKIP relay-light-log (python/python3 missing)` 并 exit 0。
3. 从 `$PSScriptRoot` 计算仓根，依次执行：
   - `<python> -m unittest <repo>/tools/relay-light/test_relay_log.py -v`
   - `<python> -m unittest <repo>/tools/relay-light/test_install_skill.py -v`
4. 不捕获、不重写 unittest stdout/stderr；第一份非零立即以该 `$LASTEXITCODE` 退出，第二份同理；全绿 exit 0。
5. 不复制 Python 测试，不在壳里重写断言，不改 runner `foreach`/计数/总结架构。

**行为 RED**

- 登记前运行全量 runner，断言输出中 `=== relay-light-log.ps1 ===` 零命中，形成入口缺席 RED。
- 薄壳正式落盘前可在临时目录复制壳并用假解释器返回 7，断言壳 exit 7；再用隔离 PATH/命令解析注入模拟无解释器，断言恰一行 `SUITE SKIP ...` 且 exit 0。不得修改用户环境或提交临时文件。

**GREEN / 回归命令**

```bash
pwsh -NoProfile -File tools/tests/relay-light-log.ps1
thin_rc=$?
pwsh -NoProfile -File tools/tests/run-relay-tests.ps1 | tee /tmp/rlt10-all.txt
all_rc=${PIPESTATUS[0]}
rg -n -F '=== relay-light-log.ps1 ===' /tmp/rlt10-all.txt
rg -n -F 'RELAY ALL PASS' /tmp/rlt10-all.txt
printf 'thin_rc=%s all_rc=%s\n' "$thin_rc" "$all_rc"
python3 -m unittest tools/relay-light/test_relay_log.py tools/relay-light/test_install_skill.py -v
```

GREEN：薄壳独立 exit 0；全量入口包含 suite 名并 exit 0；Python 直跑同两文件 exit 0。Linux pwsh 证据标成本地兼容证，不写成 Windows 真机通过；A15 只标旁证。

**audit 小审输入**：新壳完整 diff；runner 仅数组末尾一项的 diff；缺解释器 SKIP 与失败 exit 透传隔离证据；薄壳/全量/直跑输出摘要及退出码；四集合边界；commit SHA。

## 整卡收束（仅 orchestrator 在 B3 audit PASS 后另派）

1. 复跑四条完成条件命令与两份 Python 全量，登记最终 E-ID；复核 `git diff --check`。
2. 检查 `git diff --name-only master...HEAD`、working tree、index、untracked 四集合均无 allowed-paths 外路径；特别断言 `relay_log.py`、`install_skill.py` 零 diff。
3. 确认 B1/B2/B3 小审均 PASS、证据账无悬空 ID、findings/lessons 状态准确。
4. 先发 B3 `READY_FOR_REVIEW` 并停止；只有 audit PASS 后新派单才发 `CONSTRUCTION_DONE`。normal 三路由 orchestrator 另派，施工者不自审。
