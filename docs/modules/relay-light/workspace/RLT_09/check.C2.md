<!-- dh:v1 · check.C2.md -->
# check.C2 — RLT_09 B2 小审

- 候选：`ab6343c`（B2 / A120）
- 范围：仅按 `audit.md` 模式 B 核 B2。
- 结论：**PASS**。

## task_plan 与 RLT_03 交接断言

- 在仓外临时目录以正式基线 `b6b7d66` 的代码搭配候选测试复跑：`tail-append` 子例精确因 `HC-RL-A129` 失败；`superseded-separation` 未失败，证明改前状态为“表尾追加拒绝、superseded 隔开通过”。临时目录已随命令退出清理，业务工作树代码未改。
- 候选七项命令复跑 exit 0，`Ran 7 tests in 1.439s`：表尾追加与 superseded 隔开均通过；A46 节点号唯一、A72 不依赖 superseded、A89 不反向跨阶段、A109 同卡串行四项仍按原编号拒绝；A75、A129 非尾部活跃隔断与 A89 既有回归保持。
- 补跑枚举/依赖相关既有测试 7 项，exit 0：覆盖 A48 依赖存在/无环、默认依赖、运行时依赖门、stage 枚举/连续性、同卡串行及结构规则优先级。
- 实现仅把 `stage_runs` 判定改为“除末段外不得重复，末段可重现既有 stage_id”；superseded 行仍由既有 active-node 过滤排除，其余 lint 顺序和规则未改。
- 旧 `C1→R1→C2` 多违规 fixture 的两处断言仅由 A129 改为其放宽后仍真实首触发的 A89（`C2.depends_on=R1` 回边）；非表尾 `C1→R1→C2→F1` 的 A129 断言仍在。改动符合 DevPlan 对该 fixture 的收窄要求。

## 路径与差异

- `git diff ab6343c^ ab6343c --name-only` 共五项：`relay_log.py`、`test_relay_log.py` 及 RLT_09 的 `progress.md`、`findings.md`、`lesson_candidates.md`，全部属于允许路径闭集；未改 `install_skill.py`、`tools/tests/**`、design 或 dev_plan。
- `relay_log.py` 仅有 A120 `stage_runs` 判定的 5 行差异；`git diff --check ab6343c^ ab6343c` 无输出。
- 账本 E-B2-05 的“name-only 仅两份 Python”是对实质实现文件的简写；提交本身另含三份允许的 workspace 证据文件，不构成越界。

## 全量复跑

- Python：`python3 -m unittest tools/relay-light/test_relay_log.py`，exit 0，`Ran 145 tests in 170.074s`，`OK (skipped=2)`。
- PowerShell：`pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`，exit 0，末行 `RELAY ALL PASS (SKIPPED: 1)`；其中 relay-light Python 145 与 install_skill 7 项通过。
- 测试生成的 `tools/relay-light/__pycache__/` 已删除。

本批未偏离 task_plan、未越允许路径，前后行为证据可复算，相关回归与全量回归均绿：**PASS**。
