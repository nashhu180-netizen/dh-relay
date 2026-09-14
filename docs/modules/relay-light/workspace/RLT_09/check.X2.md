<!-- dh:v1 · check.X2.md -->
# check.X2 — RLT_09 X2 小审

- 候选：`0323498`（X2 / PR #19 Windows CI 快照目录误判修复；当前 HEAD 另含 exec 信号提交 `7f552b9`）。
- 范围：仅按 `audit.md` 模式 B 核 X2。
- 结论：**PASS**。

## 实现边界与拒绝语义

- `git diff 0323498^ 0323498 --name-only` 共 4 项：`relay_log.py`、`test_relay_log.py` 及 RLT_09 的 `progress.md`、`findings.md`，全部位于 dispatch 冻结允许路径；未改 skill、adapter、`install_skill.py`、`tools/tests/**`、design 或 DevPlan。`git diff --check 0323498^ 0323498` 无输出。
- `_prepare_snapshot_dir` 仅把 `realpath(snap) != abspath(snap)` 的字符串判等替换为从目标到根逐级 `_lstat_or_none` + `stat.S_ISLNK`；后续 `resolved = realpath(snap)` 及 repo / Git metadata forbidden-roots 判定保持不变。
- 候选下 `RelayPlanAmendGuardTests` 全组 exit 0；既有 `test_before_rejects_bad_snapshot_dir` 继续覆盖相对路径、已存在目录、真 symlink 父链和仓内目录拒绝。新增用例自身也在 POSIX 腿复验真 symlink 父链仍 exit 2、含固定报错且不创建目标目录。因此 A122 的真 symlink 父链拒绝语义未放松。

## RED → GREEN 可信度

- 在仓外临时目录以 `0323498^` 的实现搭配候选新增用例，独立复现 exit 1、`FAILED (failures=1)`、`AssertionError: 0 != 2`，stderr 为 `HC-RL-A122 --snapshot-dir has a symlink parent chain`；与 E-X2-02 的误报签名一致。
- 用例通过 monkeypatch 令同一非 symlink 快照路径的 `realpath` 字符串发生 8.3→长名式展开，旧实现仅因字符串不等而拒绝；候选改为检查真实目录项类型后放行。该变异直接咬住本次根因，而非 setup 或 fixture 失败。
- 候选定向全组：exit 0，实际 `Ran 11 tests in 13.285s`，`OK`；新 8.3 等效正例与既有 symlink 反例同组通过。

## 全量复算与账本核对

- Python 全量：exit 0，`Ran 164 tests in 226.756s`，`OK (skipped=2)`；与 E-X2-04 的退出状态、数量和结论一致。
- PowerShell 全量：exit 0；包装段 Python `Ran 164 tests in 225.630s`、`OK (skipped=2)`，install_skill `Ran 7 tests`、`OK`，末行 `RELAY ALL PASS (SKIPPED: 1)`；与 E-X2-05 一致。
- 非阻断记录瑕疵：E-X2-03 把 guard 测试类写成 `Ran 13 tests`，独立复跑实际为 11；命令 exit 0 与 GREEN 结论成立。E-X2-06 的“改动仅两份 Python”若指候选提交全量路径不精确，候选还包含两个允许的 workspace 证据文件；不存在越界路径。
- 测试生成的 `tools/relay-light/__pycache__/` 已删除。

X2 未偏离修复目标、未越允许路径；目标 RED 可复现，候选 GREEN 且真 symlink 拒绝保持，两套全量回归绿。上述两处证据摘要数量/措辞误差不改变可复算的行为判据：**PASS**。
