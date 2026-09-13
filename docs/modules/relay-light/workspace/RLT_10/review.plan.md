<!-- dh:v1 -->
# review.plan — RLT_10 task_plan 模式 A 审核

- 审核对象：builder `W_READY`，commit `0d1520f`
- 对照：`brief.md`、DevPlan §RLT_10、design/01 §3.5 / §3.8 / §11 的 HC-RL-A80/A94/A11/A16、现状 `relay_log.py` / `test_relay_log.py`、`dispatch/exec.md`
- 审核边界：只审计划，不改代码或 `task_plan.md`
- 结论：**FAIL**

## P0

无。

## P1

### P1-1 — A80 允许拆分测试名，但冻结的验收命令只运行未拆分方法

- `brief.md:31-34` 与 `task_plan.md:78-80` 把 A80 的唯一目标命令冻结为 `RelayPlanLintTests.test_lint_cli_exit_stderr_and_json_contract`。
- `task_plan.md:64` 又允许“按单一职责拆为同名前缀的多个方法”，但目标命令没有 discovery、通配或拆分后的方法清单；若 worker 采用该许可并以多个后缀方法替代原方法，冻结命令会以找不到测试方法失败，或只运行保留的同名子集而漏验合同。
- 影响：四条 HC 中 A80 的验证入口并非在所有获准实现路径下都可执行且覆盖完整，worker 无法机械判断拆分后应运行哪些用例。
- 整改：二选一冻结且全处一致：禁止替换该精确方法（可在该方法内用 `subTest` 覆盖各分支）；或明确列出拆分后的全部精确方法/discovery 命令，并同步 `brief.md`、B1 红绿命令与整卡收束命令。不能只靠“同名前缀”约定。

## P2

无。

## P3

- **F-001 停止边界处理正确。** 现状 `relay_log.py` 仅给 `status_parser` 注册 `--json`，`lint_parser` 未注册，`_lint_command` 也只有文本输出；只读实测 `lint --json` 得到 `rc=2` 与 `error: arguments unrecognized arguments: --json`。`relay_log.py` 不在 RLT_10 allowed-paths 内。
- `task_plan.md:72-74` 要求 B1 先在允许路径内提交准确的 A80 行为断言并取得目标行为 RED，登记 E-ID/F-001 后发 `BLOCKED`；明确禁止改 `relay_log.py`、禁止用 `status --json` 冒充，并要求 decider/orchestrator 裁决及重派后才能继续。这与 `dispatch/exec.md` 的越界程序缺陷停棒合同一致，没有把已知不可绿伪装为可完成批次。
- 四条 HC 的主体命令与 oracle 一致：A80 覆盖 0/2/3、stderr 与 JSON 精确结构；A94 按 §3.5 规则行而非 unique ID；A11 验薄壳、suite 标头、全量退出码与总结；A16 用 AST 静态收集 import 并防空扫描。
- A94 的 20 行映射可从 §3.5 机械复算，当前 unique ID 恰为计划列出的 18 个：`A24,A18,A116,A130,A46,A47,A48,A72,A89,A35,A71,A75,A129,A104,A109,A87,A126,A97`；A24、A129 各对应两行，计划明确保留逐行矩阵和差集，不以去重集合替代覆盖。
- B1/B2/B3 串行边界、每批 RED→GREEN、E-ID、四集合 allowed-paths、commit、audit 小审输入和最后一批 `READY_FOR_REVIEW -> audit PASS -> orchestrator 重派 -> CONSTRUCTION_DONE` 均可由 worker 照做。
- 薄壳设计限定为解释器探测、顺序 shell out、原样输出、首个非零退出码透传；两种解释器均缺失时恰一行 `SUITE SKIP` 且 exit 0；runner 只允许在 `$suites` 末尾追加一项，不改循环架构。

## 裁决

**FAIL**。F-001 的发现、有效 RED、越界禁改、`BLOCKED` 和裁决重派链处理得当；阻断项仅为 P1-1 的 A80 测试拆分许可与冻结验证命令冲突。闭合 P1-1 后再执行模式 A 定向复审。

---

## W2 定向复审

- 审核对象：builder W2 commit `0fc505a`
- 审核范围：仅核 P1-1；其余结论不重审
- 结论：**PASS**

### P1-1 — CLOSED

- `brief.md` 已冻结唯一精确入口 `RelayPlanLintTests.test_lint_cli_exit_stderr_and_json_contract`，明确不得以同名前缀多个方法替换，并要求在该方法内用 `subTest` 覆盖全部分支。
- B1 用例说明与 RED/GREEN 命令使用同一个精确方法名；计划再次明确 RED、GREEN 都须逐字运行该入口，不得改用 discovery、前缀约定或拆分方法集合。
- 整卡收束现显式列出同一条 A80 命令，并要求先逐字复跑，再运行 A94/A11/A16 与两份 Python 全量。
- 三处方法名与执行约束一致，已消除“获准拆分后冻结命令找不到方法或漏验合同”的路径。

### W2 裁决

**PASS**。P1-1 已闭合；本次定向复审未重开首轮其他结论。
