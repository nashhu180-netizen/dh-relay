<!-- dh:v1 -->
# findings — RLT_10

> 只登记施工期发现的合同冲突、范围外事实与建议；状态变化由 orchestrator/decider 裁决，worker 不自改。

## 登记项

| ID | 发现 | 影响 | 状态 |
|---|---|---|---|
| F-001 | design §11 HC-RL-A80 明确要求 `lint --json` 输出 `{"ok","violations":[{"rule","message","line"}]}`；但 W 现场读取 `relay_log.py` 发现只有 `status_parser.add_argument("--json", ...)`，`lint_parser` 未注册 `--json`，`_lint_command` 也只输出文本。DevPlan/dispatch allowed-paths 明确排除 `relay_log.py` | B1 可以在允许路径内新增准确测试并取得有效 RED，但无法在本卡当前写权限内恢复 GREEN；不得用 `status --json` 冒充 | 已裁决落地：decision.1 选项 A（用户 2026-09-13 批准）把 `relay_log.py` 纳入允许路径、仅限 `lint --json`；exec 恢复 B1 后实现转绿，冻结入口五分支 + A94 97 项 + 回归 147 项全过（E-B1-007/009/010），发 `READY_FOR_REVIEW` 待 audit |
| F-002 | 仓根缺 `.gitignore` 忽略 `__pycache__`：复核期 `70d68b8` 把 `tools/relay-light/__pycache__/*.pyc` 两个二进制副产品提交进树（code-round1 P2-1），编排已于 `bdde365` 移除；`.gitignore` 不在本卡 allowed-paths 内，本卡不建 | Python 测试副产品有再入树风险，合入 master 前需保持清理纪律；建议后续卡在仓根 `.gitignore` 加 `__pycache__/`（注：测试文件 skip 装饰器引用的「F-002」为 RLT_07 findings 命名空间的 decision_mode 缺口，与本 ID 不同源） | 已登记，不改代码；待编排裁决归属卡 |
| F-003 | `relay_log.py` 在 Windows 默认代码页（cp1252）下，`status` 打印中文（`_status_command`）会 `UnicodeEncodeError: 'charmap'` 崩溃——PR #17 windows-latest runner 首次把 test_relay_log.py 接入 Windows 全量暴露此差异（薄壳套件 35 败中 29 例为该错）；`relay_log.py` 仅授权 `lint --json`，本卡不得改程序侧 | 程序侧应 `sys.stdout`/`sys.stderr` reconfigure utf-8（或等价防护），直接影响 RLT_12 Windows 真跑；本卡以薄壳 `PYTHONUTF8=1`/`PYTHONIOENCODING=utf-8` 环境继承作测试侧缓解，不改实现 | 已登记，待编排裁决归属卡 |
