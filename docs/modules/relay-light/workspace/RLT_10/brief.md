<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_10 测试合同与仓库入口

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| RLT_10 | P1-RelayLight-开发方案 | [DevPlan §RLT_10](../../dev_plan/P1-RelayLight-开发方案.md#rlt_10--测试合同与仓库入口) |

- **GitHub Issue**：[dh-relay #16](https://github.com/nashhu180-netizen/dh-relay/issues/16)
- **施工现场**：`/home/nash/work/dh-relay/.dh-worktrees/RLT_10`（`wt/RLT_10`，基线 master `73947ac`）
- **档位 / Recipe**：标准档；`task_type=normal`。

## 目标 (Outcome)

把 relay-light 已有 Python unittest 的 lint 合同补到可机械证明的程度：退出码 0/2/3、stderr 逐行格式、JSON 结构、§3.5 全部 lint 规则编号均有可触发反例；用 AST 证明 `relay_log.py` 的 import 只来自标准库；新增最薄 PowerShell 壳，顺序运行 `test_relay_log.py` 与 `test_install_skill.py`，并把它登记进仓库全量 `$suites`，保持 Python 输出和退出码透明。

## Zero-context 自查

施工 worker 进入本 worktree 后第一个 Git 动作执行 `git rebase --autostash master`，再读仓根 `AGENTS.md`、本文件、`task_plan.md`、`progress.md`、`findings.md`、DevPlan §2.1 `test-entry` 行与 §RLT_10、design/01 §3.5 映射表及 §11 的 HC-RL-A80/A94/A11/A15/A16。随后只读盘点 `relay_log.py`、两份 Python 测试、全量 runner 与一个现有 PowerShell suite。DevPlan 决定 allowed-paths 和 normal Recipe，design §11 是 oracle；如合同与现状程序冲突，只落 `findings.md` 并发 `BLOCKED`，不得修改不在 allowed-paths 内的 `relay_log.py` / `install_skill.py`。

## 完成条件 ★必写

以下四条逐字承接 design/01 §11；HC-RL-A15 仅作 Linux 直跑同文件的旁证，不冒充本卡验收项。

### HC-RL-A80

> `lint` 合同：签名与退出码 0/2/3；违反项每条一行写 stderr，格式 `lint: <规则编号> <message>` 且编号为验收项 ID；`--json` 输出 `{"ok","violations":[{"rule","message","line"}]}`

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayPlanLintTests.test_lint_cli_exit_stderr_and_json_contract
```

判据：有效计划 exit 0；语义违规 exit 2 且 stderr 每个非空行匹配 `^lint: HC-RL-A[0-9]+ .+`；输入/配置失败 exit 3；`lint --json` 的顶层键恰为 `ok,violations`，每个 violation 的键恰为 `rule,message,line`，类型和值逐字段断言。若 `--json` 的行为 RED 需要修改 `relay_log.py` 才能转绿，按 F-001 发 `BLOCKED`。

### HC-RL-A94

> lint 规则编号全覆盖：§3.5 映射表列出的每条规则都能被触发，且报出的编号存在于本验收表

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayPlanLintTests \
  tools.relay-light.test_relay_log.RelayConfigTests \
  tools.relay-light.test_relay_log.RelayLifecycleTests \
  tools.relay-light.test_relay_log.RelayLimitsTests
```

判据：先把 §3.5 的 20 个映射行机械列成「规则描述 → ID → 现有触发用例」矩阵；按规则行而不是只按 unique ID 核对。差集为空则不重复造用例；有差集时只补缺失反例。每个反例得到映射表指定 ID，实际编号集合是 §11 `HC-RL-*` 验收 ID 集合的子集，且整组 unittest 通过。

### HC-RL-A11

> 测试经薄壳 `tools/tests/relay-light-log.ps1` 登记进 `$suites` 并全绿

```bash
pwsh -NoProfile -File tools/tests/relay-light-log.ps1
thin_rc=$?
pwsh -NoProfile -File tools/tests/run-relay-tests.ps1
all_rc=$?
printf 'thin_rc=%s all_rc=%s\n' "$thin_rc" "$all_rc"
```

判据：薄壳显示两份 Python unittest 的原始输出，成功时 exit 0、任一测试失败时透传非零；找不到 `python`/`python3` 时只输出一行 `SUITE SKIP <原因>` 并 exit 0。全量输出包含 `=== relay-light-log.ps1 ===`，最终 exit 0 且 `RELAY ALL PASS`。

### HC-RL-A16

> 账本程序只用标准库

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayPlanLintTests.test_relay_log_imports_are_stdlib_only
```

判据：用 `ast` 解析 `relay_log.py`，收集 `Import` 与 `ImportFrom` 的顶层模块；`__future__` 单列允许，其余模块集合全部属于 `sys.stdlib_module_names`，断言失败须打印越界模块名。

### HC-RL-A15（旁证，不计入本卡四条完成条件）

> Python 测试可脱离 pwsh 直跑（Linux 回归入口）

```bash
python3 -m unittest tools/relay-light/test_relay_log.py tools/relay-light/test_install_skill.py -v
```

判据：Linux 直接运行同两份文件并展示退出码；该结果只作为 A15 旁证，不替代 A11 的 PowerShell runner 证据，也不冒充 RLT_17 的 Linux 真机验收。

## 边界 (Boundaries)

- In scope 闭集：`tools/relay-light/test_relay_log.py`、`tools/relay-light/test_install_skill.py`、`tools/tests/relay-light-log.ps1`、`tools/tests/run-relay-tests.ps1`、`docs/modules/relay-light/workspace/RLT_10/**`。
- Out of scope：不改 `tools/relay-light/relay_log.py`、`tools/relay-light/install_skill.py`、DevPlan、design、其他卡工作区、Runner 循环架构或用户级 skill 副本。
- 不把 Python 测试改写成 PowerShell；薄壳只定位解释器、shell out、顺序执行并转发输出/退出码。
- 本卡环境为 Linux；pwsh 在 Linux 下运行是本地兼容证据，不冒充 Windows 真机矩阵。
- normal 三路独立复核、verify、验收、push、PR、CI、merge 与发布均是后续闸门；施工测试绿不自动解锁。
- 每批 exec 发 `READY_FOR_REVIEW` 后立即停止；audit PASS 前不得续批。发现需改越界程序，发 `BLOCKED`，由 decider/orchestrator 裁决。

## 触及子系统

- `parity-ledger/test contract`：lint CLI 契约、规则编号覆盖、标准库边界。
- `repository test entry`：PowerShell 薄壳与 `$suites` 登记。
- `skill installer tests`：只被薄壳调用；本卡原则上不修改其实现或既有测试，除非薄壳入口所需且仍在 allowed-paths 内。
