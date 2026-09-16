# RLT_22 · Batch 3 小审

- 审核对象：`776b020`（A147 投影 + A148 向后兼容 + A149 模板同步，附 A65）
- 审核模式：`dispatch/audit.md` 模式 B · batch-check
- 结论：**PASS**

## P0

无。

## P1

无。

## P2

无。

## 重点核查

### 1. A147：第三套止损只投影、不拒写

- `LossStop` 新增 `review_rounds` / `review_exhausted`，`loss_stop()` 只读统计 `(node, 判定方名)` 下的 `ready_for_review=` checkpoint；未把计数接入 `add` 的校验或写入拒绝路径。
- 同一实现读取 `limits.rework_max_rounds`：用例分别以 2、3 验证第 N 条未收口信号触发耗尽；第 N+1 条 ready 仍由 `add` 接受且账本增一行。耗尽后 strategist 链可由 `escalate` 正常起头。
- attempt、X round、review round 三套计数使用独立键与独立 exhausted 集；attempt-only、X-only fixture 均断言 review 为空，review-only fixture 断言另两套未触发。判定方 done 后只清 review exhaustion，累计 round 数仍保留，证明投影不会相互叠加或重置。
- `Status` 与 `status_document()` 未改；A62 的精确顶层/嵌套 key 集合断言随全量测试通过，`status --json` schema 未新增第三套字段。

### 2. A148：旧计划、71 行账本与双 trigger 混用

- 候选把 `relay_plan.md` 与 71 行 `relay_log.jsonl` fixture 收进 `workspace/RLT_22/fixtures/rlt12-win-01/`；测试只从本卡工作区读取并复制到临时 plan dir，没有引用 RLT_12 worktree 或其它树。
- 旧计划原样进入 lint，exit 0；71 行按原顺序逐条调用 `add`，每行均接受，重放后仍为 71 行，node/event/agent/by 与 note（除按合同重建的 plan_loaded provenance）保持一致。R/X reviewer 的旧式 done 无配对 token 仍被接受，A146 未误伤。
- 混用 fixture 在同一节点同时包含 `on:done:` 与 `on:review_ready:`：未满足前置时分别精确报 A70 与 A144，满足各自前置后完整账本可闭合，编号不串。

### 3. A149：模板、封口纪律与 W/C/X 最小序列

- W 的 plan-reviewer 与 X 的被打回 reviewer 已改为 `on:review_ready:`；C 的 trigger 列保持原形，并补封口纪律。R 模板的整个段落与 `776b020` 父提交逐字比较一致，结构用例另钉住节点行和两条 agent 行。
- SKILL.md 硬规则段、Claude adapter、Codex adapter 均包含同一段原文：PASS 前双方不 done，FAIL 由 live 判定方 checkpoint 路由回同一送审方，PASS 后按送审方→判定方顺序终态。
- W 最小序列覆盖 reviewer lost 后 A49 合法重拉并消费 fresh signal；C 覆盖同一 checker FAIL→checkpoint 路由→同实例复审 PASS、无第二次 launch；X 覆盖两路 reviewer 一 FAIL 一 PASS、均不重拉且 sender done 前判定方不得提前封口。

### 4. A65 与 dh-mapping

- A65 补例证明未收到 ready 信号、从未触发的 `on:review_ready:` agent 不进入 node_close 悬空判定，节点可正常关闭。
- `dh-mapping.toml` 仅修改 `[limits.on_exceed].note` 两行，将“两套”改为“三套”并说明送审轮数；`rework_max_rounds=2`、`attempt_max=3`、`action=strategist-then-user` 等键值未改。

### 5. 验证与允许路径四集合

- 独立复跑 `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log`：exit 0，`Ran 202 tests in 467.593s`，`OK`。
- 独立复跑 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`：exit 0；relay-light 段 202 例 `test_relay_log` + 7 例 `test_install_skill` 全部 OK；最终 `RELAY ALL PASS (SKIPPED: 1)`。
- E-015～E-021 的 RED/GREEN、用例计数与本次静态核查及独立复跑一致。
- 候选提交、`master...HEAD`、working tree、index/untracked 四集合均核过：`776b020` 只改 `relay_log.py`、`test_relay_log.py`、`skill/**` 与本卡 workspace；审前 working tree/index/untracked 为空。`git diff --check` 无输出，未产生 `__pycache__`。

## 裁决

**PASS**。B3 未偏离 task_plan，A147/A148/A149、A65 与允许路径均闭合，未发现新问题；三批小审至此全部通过，可交回编排进入下一节点。
