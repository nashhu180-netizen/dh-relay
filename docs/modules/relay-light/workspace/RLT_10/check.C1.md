<!-- dh:v1 -->
# check.C1 — RLT_10 Batch 1 checker

- 审核对象：B1 初始测试提交 `5b79d03`、decision.1 选项 A 后施工提交 `542e2df`、READY_FOR_REVIEW 信号提交 `f4ea869`
- 调整后边界：`tools/relay-light/relay_log.py` 仅允许实现 `lint --json` 的参数注册、分发、输出及必要真实行号传递；依据 `decision.1.md`、`progress.md` DECISION 行与 `dispatch/README.md`
- 审核边界：只判断 B1 是否偏离 task_plan、是否越调整后的 allowed-paths、B1 验证是否真绿
- 结论：**PASS**

## 1. 是否偏离 task_plan

**PASS。**

- `test_relay_log.py` 保留唯一冻结入口 `test_lint_cli_exit_stderr_and_json_contract`，一个方法内五个 `subTest` 分支：文本 valid exit 0、文本 semantic violation exit 2 与 stderr 行形/验收 ID、parse/config exit 3、JSON valid、JSON semantic violation。
- 初始 B1 已取得 F-001 目标行为 RED、登记 20 行 §3.5 映射矩阵并按规则行盘点差集；decision.1/A 用户裁决后才恢复施工，没有在授权前越过 BLOCKED。
- 20 行矩阵逐行保留 A24 与 A129 的重复 ID 规则，机械所得 18 个 unique ID 与 §3.5 一致；每行均指向现有实际触发方法，差集为空，未复制既有反例。
- `progress.md` 已登记 E-B1-006～E-B1-010，覆盖恢复基线、冻结入口、原始 CLI、A94 目标组与两份 Python 回归；READY 信号引用这些 E-ID 和 `542e2df` 后停止，未进入 B2。

## 2. 是否越允许路径

**PASS。**

- `542e2df` 的程序改动仅在 `tools/relay-light/relay_log.py`：给 lint parser 注册 `--json`、把 `args.json` 传给 `_lint_command`、输出 A80 的成功/违规 JSON，并从既有违规消息的 `line <n>:` 前缀提取真实行号；没有改 lint 规则语义、status/add、installer、PowerShell runner 或循环架构。
- `542e2df` 其余改动只在 RLT_10 的 `progress.md`、`findings.md`、`lesson_candidates.md`；`f4ea869` 只追加 RLT_10 progress 信号。均属于调整后的闭集。
- `git diff master...HEAD` 的额外 DevPlan/dispatch/workspace 文件来自 W、审核及 decision.1/A 的授权合同同步；B1 两个候选提交未把这些路径当程序施工扩张。
- 独立检查 `git diff --check master...HEAD` 通过；复跑清理自产生的 `__pycache__` 后，working tree、index、untracked 三集合均为空。

## 3. B1 验证命令是否真绿

**PASS。** 审核者在 `f4ea869` 上独立复跑：

- A80 冻结入口：exit 0，Ran 1 test in 1.027s，OK；该唯一方法的五个 `subTest` 分支全部通过。
- A94 四类别：exit 0，Ran 97 tests in 121.939s，OK。
- 两份 Python 回归：exit 0，Ran 147 tests in 156.305s，OK (skipped=2)。两项 skip 均为既有 A114 decision_mode 负例，未由本批引入。
- 结果与 E-B1-007、E-B1-009、E-B1-010 一致；未以测试运行副产品、环境错误或 fixture 错误冒充 GREEN。

## 裁决

**PASS**。Batch 1 未偏离 task_plan，`relay_log.py` 改动未超出 decision.1/A 的 `lint --json` 专用授权，冻结五分支、A94 目标组和两份 Python 回归均由审核者独立复跑为真绿。
