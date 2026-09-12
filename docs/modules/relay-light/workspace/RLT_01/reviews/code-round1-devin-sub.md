# code-round1 复核报告 — RLT_01（独立 fresh reviewer：devin-sub）

**结论：APPROVE**

- 复核对象：`git diff master...HEAD`（基线 `77bde70` → HEAD `8959f5f`，12 个新增文件，全为 `A`）
- 合同出处：DevPlan `#### RLT_01`（`P1-RelayLight-开发方案.md` L121-135）、design/01 §8.1（L886-893）、§11 `HC-RL-A124`（L1172）
- reviewer 未参与施工，只读未改仓内任何文件（除本报告）；未 commit。

## Findings

| ID | 级别 | 位置 | 事实 |
|---|---|---|---|
| RLT01-CR1-01 | P3 | `install_skill.py` L73-92 `_sync_target` | 部分失败残态下旧 manifest 滞留：目标 2 复制中途失败时，其 `manifest.json` 仍是上一次成功值，描述的状态可能与盘上半成品文件不符。设计 §8.1 明示「不承诺原子/回滚、失败后允许暂时不同步」，且 manifest 合同语义为「每目标**成功**后写当前值」——失败由非零退出码表达，未伪装成功。仅作观察记录，不阻塞。 |
| RLT01-CR1-02 | P3 | `install_skill.py` L47-49 `_copy_file` | `shutil.copyfile` 对 dst 跟随符号链接：若用户级目标侧被预先植入 symlink，复制会写穿到目标目录之外，且事后 hash 校验读同一路径仍判一致。合同仅禁止安装器自身使用软链（未使用），对抗性目标侧状态属边界情形，超出本卡合同。 |
| RLT01-CR1-03 | P3 | `test_install_skill.py` L96-119 | A124 测试序列中，被改坏的 codex 侧 `SKILL.md` 恰在注入点（第 8 次复制）前的第 6 次复制已被覆盖修复，故「重跑修复改坏」主要由 `test_overwrites_stale_replica`（L89-94）承担；A124 用例本身仍完整满足 oracle 字面（改一侧→中途失败→非零→源未变→重跑双侧一致）。可选强化：失败断言后补「目标 1 文件+manifest 保留」以直证不回滚。 |

无 P0/P1/P2。

## 必审靶子核对

1. **allowed-paths 闭集 ✅**：diff `name-status` 12 项全为新增，路径集合 = `tools/relay-light/skill/{SKILL.md,references/adapter-claude-code.md,references/adapter-codex.md}` + `install_skill.py` + `test_install_skill.py` + `workspace/RLT_01/` 七件套。`roles.toml`/`dh-mapping.toml` 与 master 同 blob（`cd4af2f`/`e621eb8`），零改动；`relay_log.py`、`test_relay_log.py` 未触及。`git diff --check` exit 0。
2. **A124 证法真实性 ✅**：`test_mid_copy_failure_is_nonzero_and_rerun_converges` 先 `main(["--all"])` 成功（L98）→ 改坏 `targets()[1]/SKILL.md`（codex 侧，L99-100）→ 快照源五件 sha256（L102）→ `mock.patch.object(install_skill,"_copy_file")` 打在真实复制路径上，第 8 次调用抛 `OSError`（=第二目标 `.codex` 第 3 件 `references/adapter-codex.md`，10 次复制之中途，L106-112）→ 断言返回非零（L113，实测返回 1，stderr `error: injected mid-copy failure`）→ 源哈希全等（L115）→ 无注入重跑返回 0（L116）→ 两侧五件逐字节等源 + 两 manifest 可解析（L117-119）。注入点有效。
3. **安装器正确性 ✅**：缺件检查先于任何目标写入（`install_all` L96-99），测试实证缺件时两目标目录均未落盘（L121-130）；`--all` 经 argparse `required=True` 为唯一入口，无参/`--bogus`/`sync`/多余参数均 exit 2（L49-53 四例）；单向覆盖仅写目标侧，源仅被读（`_git` 两条均为只读查询）；逐件复制后 sha256 校验目标=源（L77-81）；manifest 五顶层键 `source_head`/`source_dirty`/`files`/`installed_to`/`installed_at` 与 §8.1 逐字一致，`files` 恰含五件路径→哈希（测试 L73-87 断言集合相等）；无回滚代码，目标 1 成功后目标 2 失败不回撤，退出码为 1 不伪装成功。
4. **骨架无业务内容 ✅**：三件均为最小占位，显式标注「业务内容由 RLT_07 交付」；`SKILL.md` front-matter 仅 `name`/`description`，无角色表/五阶段/硬规则等业务文字。
5. **无密钥 ✅**：`git diff master...HEAD` 全文 grep `token|secret|password|api_key|bearer|ghp_|sk-|BEGIN` 零命中。
6. **有效单测（改坏必红）✅**：见下节。
7. **真实测试 ✅**：见下节。

## 有效单测记录（变异测试）

- 副本：`cp -r tools/relay-light /tmp/rlt01-cr1-mut`（含 skill/ 五件；`__pycache__` 已剔除）
- **变异点**：`install_skill.py` `install_all` 内删除源缺件 fail-closed 检查（原 L96-98 三行：`missing = ...` / `if missing:` / `raise InstallError(...)`）
- **施加前 hash**：`8c94c234c4f8f134a66bd2bd173fa0ce9325825ea5bfa6e83026f5e64d77f191`（与 worktree 原文件一致）
- **施加后 hash**：`76734a75669a725a8a87fda416da484215f0acd57f80792aafc716c725a02684`
- **变异后跑测**：`cd /tmp/rlt01-cr1-mut && python3 -m unittest test_install_skill.py` → **exit 1**，`Ran 7 tests`，`FAILED (failures=1)`：`test_source_missing_file_fails_closed` 在 L130 `assertFalse(target.exists())` 抛 `AssertionError: True is not false`——**行为断言级红**（非 import/报错级）：缺件源的前四件被复制落盘后才在第五件 FileNotFoundError，证明 fail-closed 语义被测住。
- **还原后 hash**：`8c94c234c4f8f134a66bd2bd173fa0ce9325825ea5bfa6e83026f5e64d77f191`（与施加前一致）
- **还原后跑测**：同命令 → **exit 0**，`Ran 7 tests`，`OK`。

## 测试命令与退出码（worktree 实跑）

| 命令 | 退出码 | 结果 |
|---|---|---|
| `python3 -m unittest tools/relay-light/test_install_skill.py -v` | 0 | Ran 7 tests，OK |
| `python3 -m unittest tools/relay-light/test_relay_log.py` | 0 | Ran 108 tests in 145.640s，OK |
| `HOME=/tmp/rlt01-smoke python3 tools/relay-light/install_skill.py --all` | 0 | 两目标各五件+manifest.json；`source_head=8959f5f…`、`source_dirty=false`、`files` 五件齐 |

合计 115 例与 `progress.md` E-003（`Ran 115 tests ... OK`）一致。测试运行产生的 `__pycache__/` 已清理，`git status --short` 干净。
