<!-- dh:v1 · check.C5.md -->
# check.C5 — RLT_09 B5 小审

- 候选：`44be5ba`（B5 / F-003）
- 范围：仅按 `audit.md` 模式 B 核 B5。
- 结论：**PASS**。

## RED → GREEN 与入口防护

- 在仓外临时目录以 `44be5ba^` 的实现搭配候选编码测试，独立复现 exit 1 / 8 个失败腿；UTF-8 sanity 腿通过。status 文本/JSON 四腿及 lint JSON 两腿为 `UnicodeEncodeError`，lint 普通 stderr 的 ascii/cp1252 两腿保持 exit 2 但把中文转义为 `\\u5361`，未满足 UTF-8 中文输出断言。因此施工账本“八腿全抛 UnicodeEncodeError”概括不精确，但 8 腿 RED 与目标行为失败结论成立。
- 候选 `RelayCliEncodingTests` 复跑 exit 0，3 tests 通过；ascii/cp1252 下 status 文本、status JSON、lint stderr、lint JSON 均按合同 exit，输出 bytes 可显式 UTF-8 解码并包含中文。
- `_configure_utf8_stdio()` 在 `main()` 首行、参数解析和所有 CLI 输出前统一调用，同时处理 stdout/stderr；未散落到 status/lint 分支。
- 测试子进程从环境中明确剔除 `PYTHONUTF8` 与原 `PYTHONIOENCODING`，再单独设置 ascii/cp1252，故 GREEN 不依赖薄壳 `PYTHONUTF8=1`。
- 额外就地探针以非 tty 的 ascii/cp1252 `TextIOWrapper` 连续调用防护两次，随后中文 bytes 均为 UTF-8；`StringIO` 等无 `reconfigure` 流也不报错。实现不关闭、不替换外部流，并容忍已关闭/不可重配流的预期异常。

## 范围与回归

- `git diff 44be5ba^ 44be5ba --name-only` 共五项：`relay_log.py`、`test_relay_log.py` 及 RLT_09 的 `progress.md`、`findings.md`、`lesson_candidates.md`，全部属于允许路径闭集；未改 skill、adapter、`install_skill.py`、`tools/tests/**`、design 或 dev_plan。
- `relay_log.py` 仅新增 17 行 stdio helper 和 `main()` 入口的一次调用；无其它行为改动。`git diff --check 44be5ba^ 44be5ba` 无输出。
- 整卡收束命令：exit 0，`Ran 19 tests in 27.234s`，五条 HC、A122 guard 与 F-003 映射均绿。
- Python 全量：exit 0，`Ran 162 tests in 229.896s`，`OK (skipped=2)`。
- PowerShell 全量：exit 0，末行 `RELAY ALL PASS (SKIPPED: 1)`；包装段内 Python 162 与 install_skill 7 项通过。
- 测试生成的 `tools/relay-light/__pycache__/` 已删除。

本批未偏离 task_plan、未越允许路径，F-003 在统一 CLI 入口生效且验证可复算，全量回归绿：**PASS**。
