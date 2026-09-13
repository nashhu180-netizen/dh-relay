<!-- dh:v1 -->
# check.X2 — RLT_10 X2 checker

- 审核对象：exec commit `9c185b6`，READY_FOR_REVIEW 信号 commit `59dc09f`
- 背景证据：PR #17 首轮 Windows runner 35 例失败；修复后 run `34756415188` 三个硬门绿色（本轮按派单核本地工件与复跑，不把外部 run 叙述冒充本机执行）
- 审核边界：仅判断 X2 是否偏离整改目标、是否越 allowed-paths、期望侧是否弱化、F-003 是否准确及本地验证是否真绿
- 结论：**PASS**

## 1. X2 是否偏离整改目标

**PASS。**

- `tools/tests/relay-light-log.ps1` 只在解释器确认存在后、两次 Python 调用前设置 `PYTHONUTF8=1` 与 `PYTHONIOENCODING=utf-8`。变量由 unittest 子进程及其调用的 `relay_log.py` 继承，针对 Windows 默认 cp1252 下中文 stdout/stderr 的测试运行崩溃；解释器缺失的既有单行 `SUITE SKIP` 分支、调用顺序和退出码透传未改。
- `test_relay_log.py` 只调整两个 HC-RL-A135 用例的三处期望：将期望绝对路径以 `replace(os.sep, "/")` 规范化，再与解码后的实际值做精确相等。
- 实现 `_encode_path` 本就先执行同一 `str(value).replace(os.sep, "/")` 再编码；因此 Windows `C:\\...` 与冻结输出 `C:/...` 的差异被按合同对齐，Linux 为 no-op。

## 2. 允许路径与 relay_log.py

**PASS。**

- `9c185b6` 仅改 `tools/tests/relay-light-log.ps1`、`tools/relay-light/test_relay_log.py`、RLT_10 `findings.md` / `progress.md`；均在允许路径内。
- `59dc09f` 只向 RLT_10 `progress.md` 追加 X2 READY_FOR_REVIEW 信号。
- X2 对 `tools/relay-light/relay_log.py`、`install_skill.py`、`run-relay-tests.ps1` 与其它 suite 零 diff。
- 两个提交的 `git diff --check` 均通过。独立复跑产生的 `__pycache__` 已按测试前干净基线清理；最终 working tree、index、untracked 三集合均为 0。

## 3. 测试期望是否弱化

**PASS。**

- 三处仍使用 `assertEqual` 比较完整路径，没有改为 `assertIn`、后缀匹配、正则宽松匹配、平台跳过或删除断言。
- 配置目录、计划目录、百分号编码、绝对路径与其它 provenance 字段断言全部保留；只在期望侧加入与实现相同的分隔符规范化。
- 修改未掩盖程序行为差异：若实现返回错误目录、缺字段、错误编码或非绝对路径，原测试仍失败。

## 4. findings F-003

**PASS。**

- F-003 准确登记首轮 Windows CI 暴露的程序侧事实：`status` 中文输出在 cp1252 下可能触发 `UnicodeEncodeError: 'charmap'`，35 个失败中 29 个属于该错误。
- F-003 明确说明 `relay_log.py` 在本卡只获 `lint --json` 授权，X2 不得顺手修 status 输出；程序侧 UTF-8 reconfigure 需求仍待后续归属裁决，并指出对 RLT_12 Windows 真跑的影响。
- 记录把本卡的薄壳环境继承标为“测试侧缓解”，没有宣称程序缺陷已修，也没有用第二轮 CI 绿色关闭 F-003。

## 5. 本地验证是否真绿

**PASS。** 审核者在 `59dc09f` 上独立复跑：

- 两份 Python 回归：`python3 -m unittest tools/relay-light/test_relay_log.py tools/relay-light/test_install_skill.py -v`，exit 0；Ran 148 tests in 158.397s；OK (skipped=2)。
- 全量 runner：`pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`，exit 0；第 740 行命中 `=== relay-light-log.ps1 ===`；第 1000 行为 `RELAY ALL PASS (SKIPPED: 1)`。
- 全量中的薄壳原始输出为 `test_relay_log.py` Ran 141 tests、OK (skipped=2)，`test_install_skill.py` Ran 7 tests、OK。
- 结果与 E-X2-004/E-X2-005 的本地结论一致；Linux 本机结果仅证明本地防回归，Windows 效果由 CI run `34756415188` 承担。

## 裁决

**PASS**。X2 改动全部位于允许路径，`relay_log.py` 未动；路径期望仍为完整精确断言，仅与实现合同作同构规范化；F-003 登记准确；本机两份 Python 回归与全量 runner 均由审核者独立复跑为真绿。
