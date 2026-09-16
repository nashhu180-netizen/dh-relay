<!-- dh:v1 -->
# review.plan — RLT_22 task_plan 模式 A 审核

- 审核对象：`task_plan.md`（当前 HEAD `9abdffb`）
- 对照：`brief.md`、DevPlan §RLT_22、design/01 §11 的 HC-RL-A144～A150 与 A35/A65/A71/A107、当前 `relay_log.py` / `test_relay_log.py`
- 结论：**FAIL**

## P0

无。

## P1

### P1-1 — 各批 Python 验证命令不可执行，且会制造允许路径外的 `__pycache__`

- `task_plan.md:102-109,115,117,127,136,142` 使用 `python -m unittest ... tools.relay-light.test_relay_log...`。`tools/relay-light` 含连字符，不能作为 Python dotted module 导入；`dispatch/README.md` 已明确该写法不可用，并冻结了可用入口。
- 当前工作树已有未跟踪的 `tools/relay-light/__pycache__/relay_log.cpython-312.pyc` 与 `test_relay_log.cpython-312.pyc`；它们不属于允许路径闭集。计划的测试命令未设置 `PYTHONDONTWRITEBYTECODE=1`，与每批要求的 untracked 允许路径核对直接冲突。
- 影响：RED/GREEN 与每批全量回归命令不能形成有效机器证；即使改成可运行入口，执行后也可能因自身生成的越界文件让四集合检查失败。
- 整改：所有目标/全量命令改为从 `tools/relay-light` 目录运行，例如 `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayPlanLintTests -v` 与 `... python3 -m unittest test_relay_log -v`（或 dispatch 允许的 discover 入口）；同时冻结进场已有 `__pycache__` 的处置/基线口径，确保四集合检查可机械得出结论。

### P1-2 — A149 最小账本序列仍漏 W，与已闭合裁决和当前 oracle 冲突

- `task_plan.md:92,133` 仍写 A149 只对 **C 与 X** 跑最小账本序列，并称“卡正文口径；以 F-003 裁决为准”。
- 但 `findings.md` F-003 已记录裁决闭合：design/01 是 oracle，W 纳入；DevPlan §RLT_22 与 design/01 `HC-RL-A149` 当前均明确要求 **W、C、X 各一条**。
- 影响：照计划施工会缺少 W 的最小账本机器证，不能满足 A149「怎么验」列；计划还会把已闭合 finding 当成开放分支，worker 无法按当前权威执行。
- 整改：把 `task_plan.md:92,133` 统一为 W/C/X 各一条，并明确三种场景各自落在哪条序列及断言。

### P1-3 — A150 缺少 lint 规则映射表的结构断言

- `task_plan.md:102-103` 覆盖四态、A35/A71、拼写变体与 R 形态反例，但没有覆盖 design/01 `HC-RL-A150`「怎么验」末句：断言 §3.5 lint 规则映射表中 `on:review_ready:` 的 A35 与 A71 两行均存在。
- 影响：程序行为可绿，但设计要求的规则编号映射证据仍为空，不能宣称 A150 完整达成。
- 整改：B1 增加可执行的结构检查，限定在 design/01 的 lint 映射表范围内，分别精确断言两行存在且绑定 A35/A71；只读检查 design，不修改禁区。

### P1-4 — B1 的新 trigger 运行时占位没有冻结 fail-closed 行为

- `task_plan.md:104` 要求在 `_require_trigger` 中加入 `on:review_ready:` “分流占位”，只断言不再串入 A70；没有要求 B2 的 A144 尚未实现时拒绝 `agent_launch`。
- 同一计划又要求 B1 独立提交并经 checker PASS。若占位直接返回，B1 会让 `on:review_ready:` 的判定方在没有 ready 信号时被拉起，形成 fail-open 的可提交中间态；这与 A144 的核心前置相反，也与计划自己在 `task_plan.md:90` 拒绝半成品不变量缺口的理由冲突。
- 整改：二选一冻结：B1 占位对所有 `on:review_ready:` launch 明确退 2 报 A144，并加反例证明 fail-closed，B2 再替换为完整前置；或把 lint/A145 与 A144 合并到同一批，不留下可 PASS 的无前置中间态。

## P2

### P2-1 — `relay_log.py` 行号已随 RLT_21 基线漂移，需更新锚点

漂移本身不判 FAIL，但当前 Context Packet 多处数字已指向错误逻辑，worker 不应按旧行号落刀。当前 `72c6c4d` 基线上的正确锚点为：

- `lint_plan` `:516`，trigger 校验 `:598-610`；`_runtime_plan` `:1515-1522`；`append_event` `:2306-2316`。
- `_latest_by_name` `:1595`；`_latest_for_instance` `:1604`；`_require_trigger` `:1656-1672`。
- `_validate_agent_transition` `:1904`，迁移表 `:1957-1967`；`_validate_node_close` `:1979`；`_validate_runtime_event` `:1998`；`_validate_event_semantics` `:2014`。
- `_decision_helper` `:1675` / `_validate_decision_helper` `:1683`；`_note_tokens` `:2420`。
- `LossStop` `:2790` / `loss_stop()` `:2812`；`Status` `:2400` / `status_document` `:2889`。
- `AgentSpec.role` 字段 `:132`，解析赋值 `:454`；skill 硬规则从 `SKILL.md:212` 起。

整改时只更新定位数字与邻近符号，不改变函数/文件边界。

## P3

- 七条新 HC 均已分配到批次：B1=A145/A150，B2=A144/A146，B3=A147/A148/A149；A35/A71、A107、A65 的承接关系总体正确。
- A144 九类反例、A145 写入合同与 A102 正例、A146 done-write-time 与账本不落行、A147 2/3 阈值和 N+1 可写、A148 旧账本与混用、A149 模板/adapter 主体结构均已写入计划。
- 六条实现硬约束与 design/01 原文方向一致：复用 note token、A146 位点、实例级 latest、重复 token 写入侧拒绝、A2/A62/A95/A102 零改动、A49/A60/A70 不削弱。
- allowed-paths 闭集、每批 RED→GREEN、全量回归、批次小审与最终 `CONSTRUCTION_DONE` 停点均已登记；闭合上述 P1 后可直接复审。

## 裁决

**FAIL**。先闭合 P1-1～P1-4，再重新执行模式 A plan-review；P2 行号更新不单独阻断，但应随整改一并完成，避免 worker 按旧锚点误改。
