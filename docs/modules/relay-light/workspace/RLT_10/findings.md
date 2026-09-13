<!-- dh:v1 -->
# findings — RLT_10

> 只登记施工期发现的合同冲突、范围外事实与建议；状态变化由 orchestrator/decider 裁决，worker 不自改。

## 登记项

| ID | 发现 | 影响 | 状态 |
|---|---|---|---|
| F-001 | design §11 HC-RL-A80 明确要求 `lint --json` 输出 `{"ok","violations":[{"rule","message","line"}]}`；但 W 现场读取 `relay_log.py` 发现只有 `status_parser.add_argument("--json", ...)`，`lint_parser` 未注册 `--json`，`_lint_command` 也只输出文本。DevPlan/dispatch allowed-paths 明确排除 `relay_log.py` | B1 可以在允许路径内新增准确测试并取得有效 RED，但无法在本卡当前写权限内恢复 GREEN；不得用 `status --json` 冒充 | 已写入 task_plan 停止边界；B1 触发后须 `BLOCKED` 交 decide/orchestrator，不在 W 阶段改程序 |
