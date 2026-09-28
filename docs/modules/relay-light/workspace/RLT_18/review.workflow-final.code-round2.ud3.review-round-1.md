# review — workflow-final · code-round2（UD-3 定向，fresh）· round 1

复核对象：`git diff a6773e7..HEAD`（tools/ 面 = RED `2c1dc47` + GREEN `638b9e6`；U2/A-14/编排登记提交全为 docs/workspace）。
本路侧重：测试有效性第二视角（断言能否捕获破坏）、§5.4 断言清单逐条覆盖、跨平台对称、adapter 命令↔实现参数逐字对照、可维护性。code-round1 已 PASS（P3×3），本路不重复其结论。

## 结论

PASS —— 无 open P0/P1。§5.4 断言清单除已登记的 `不设人肉 watcher agent`（U3-C1-1）外逐条有测试覆盖；新用例非纯 happy path（含句界否定、ASCII 校验、缺失节 loud-fail、基线必假、真实子进程 schema 校验）；两 adapter 差异恰为 §5.4(2) 允许项；变异实证断言对实质破坏敏感（Mut-B）。三处 P3 均为「spec 正文条目/清单项未被断言钉住」的粒度缺口，非文案错误。

## 发现

| ID | 级别 | 位置 文件:行 | 事实 | 建议整改 |
|---|---|---|---|---|
| U3-C2-1 | P3 | tools/relay-light/test_relay_log.py:6503-6504 | §5.4(2) 验收清单列「`Win32_Process` 两式」，断言只钉 plan 式（`--level plan*'`）与通用存在性；**变异实证**：删 adapter-codex.md watcher 片段内 stage 式 Win32 行（`阶段空间：`Get-CimInstance … --level stage*`）后 `SkillAdapterTests` 15 项全过——stage-lead 位自带同款 stage 式命令（adapter-codex.md:136）掩盖删除。pgrep 两式在 R-U3-2 内有片段级断言，Win32 无等价片段级钉住 | 在 `test_r_u3_2` 的 frag 内补 `--level stage*` 与 `--level plan*` 两式 assertIn（片段级）；或接受现状——stage-lead 条留有等价命令可人工恢复 |
| U3-C2-2 | P3 | tools/relay-light/test_relay_log.py:5595-5601（`_skill_ud2_checks`） | 三条检查按整篇 SKILL 文本做片段在位判定；**变异实证**：SKILL.md:40 watcher 行「每 10 分钟」→「每 20 分钟」后 `SkillCoreDocTests` 16 项全过——第 347 行放弃项仍含「10 分钟」使 `watcher_row` 保持真，行级职责漂移不可见。属 §5.4(4) 规定检查法的固有粒度，实现忠实 spec | 可让 `watcher_row` 先抽取 `| watcher` 行再断片段归属；或接受现状（347 行与 40 行同步漂移的概率低） |
| U3-C2-3 | P3 | task_plan.md §5.4(2)b/c spec 条目 vs 断言清单 | 三处 spec 正文条目不在验收断言清单、无测试钉住，**变异实证删除后全绿**：①方式 1 段尾「watch 起来后在本空间拉起 watcher（见「拉起 watcher 的 prompt 片段」）」指针句（adapter-claude-code.md:119 / adapter-codex.md:121）；②「watcher 自身缺席」残余条（D22/UD-5 Q4 落点，:135/:137）；③「报信目标随派活方重拉」条（F-014 处置落点，:136/:138）。三条均承载行为语义（拉起时机衔接、二级兜底缺省约定、重拉后报信切换） | 若要钉可在 `_assert_adapter_watch_contract` 补 `assertIn`（`在本空间拉起 watcher`、`watcher 自身缺席`、`报信目标随派活方`）；不补则靠 consistency 路与人工复核兜底 |

## 核查范围与方法

1. **RELAY_RECEIPT preflight**：`env | grep -E '^RELAY_'` 空 → 正常复核面。
2. **差异面与 relay_log.py 零改动**：`git diff a6773e7..HEAD -- tools/relay-light/relay_log.py` 为空；commit 级 `git log --name-only … -- tools/` 确认 tools/ 改动只来自 U1 两提交（`2c1dc47` 测试、`638b9e6` adapter×2+SKILL），U2（`f495cf5`/`f4c2661`/`401defb`）与 A-14 事件提交全为 docs/workspace。
3. **§5.4 断言清单逐条映射**（→ `_assert_adapter_watch_contract` / `test_r_u3_1/2/3/5` / `_skill_ud2_checks`）：`stage-stalled`/`依赖人工` 否定、`watch-down` 两式、`10 分钟`/`sleep 600`/`WATCHER_STOPPED`/`WATCHER_GAVE_UP`/`queued`+`Press Enter to send`、pgrep C1-1 stage/plan 两式（片段级，R-U3-2）、`编排不承担 watch 存活对账`、Claude `run_in_background`+无 `sleep 590`、Codex `timeout_ms=660000`、片段禁区两短语、保留项（tick/1200000/D13 循环五关键词/接收者硬规则）——均有覆盖；唯 `不设人肉 watcher agent` 否定缺席，**已由 code-round1 U3-C1-1 登记，不重复**；`Win32_Process 两式` 覆盖不全即 U3-C2-1。`_PATTERN_LINE_MARKERS` 自净性：新增检查命令行均含 `pgrep`/`Win32_Process`/`-like` 标记，不进 `_relay_log_calls` 的 `--config-dir` 检查面（test_a136 绿即证）；片段内 `status` 调用行无标记 → 被 a136 收入且确带 `--config-dir <plan_dir>/config/`。
4. **变异测试（本轮新做，与 round1 不重叠；均 `git checkout` 还原，`git status` 无 modified）**：
   - Mut-A 删 codex 片段 stage 式 Win32 行 → 15 项全过（未捕 → U3-C2-1）；
   - Mut-B `timeout_ms=660000`→`600000` → `test_r_u3_2` 与 `test_watch_subcommand_documented` FAIL（敏感 ✓）；
   - Mut-C SKILL:40「每 10 分钟」→「每 20 分钟」→ 16 项全过（未捕 → U3-C2-2）；
   - Mut-D 删方式 1 指针句、Mut-E 删「watcher 自身缺席」+「报信目标随派活方重拉」两条 → 均全过（未捕 → U3-C2-3）。
5. **单测自跑**（PYTHONDONTWRITEBYTECODE=1，`git status --ignored` 无 `__pycache__` 新增）：`test_relay_log.SkillAdapterTests`+`SkillCoreDocTests` 31 OK、`WatchTests` 45 OK、`test_install_skill` 19 OK；与 `evidence/ud3-u1/green.txt`「76 tests OK」一致。
6. **跨平台对称**：difflib 互比两 adapter「拉起 watcher 的 prompt 片段」节——唯一差异为 D16 本侧节拍句（Claude `run_in_background` 跑 `sleep 600`、明示不写前台长 sleep；Codex 前台 `sleep 600` + `timeout_ms=660000`，与 D16「≥600 秒+60 秒余量」逐字一致）；「watch 死亡处置」节唯一差异为载体词 tab/pane（F-013 已登记，非本路新发现）。pgrep 三式与 Win32 三式两 adapter **逐字一致**；watcher 片段占位符用 `<stage-lead 的 Herdr 名>`/`<编排的 Herdr 名>`（watcher 代查派活方的 watch），与 stage-lead 位 `<自己的 Herdr 名>` 语义区分正确。自匹配排除对称：Linux `grep -v 'pgrep'`+`^($$|$PPID)` ↔ Windows `-notlike '*Get-CimInstance*'`+`-ne $PID`。
7. **adapter 命令↔实现参数逐字**：`status --plan <plan_dir> --json --config-dir <plan_dir>/config/` 对 relay_log.py:3978-3981 argparse 一致；watch 调用行 `--plan/--notify/--level stage|plan/--config-dir` 对 :3990-3994 一致；判死键 `open_stages`/`pending_nodes`/`stages[-1]`/`state=closed` 与 `_watch_should_exit`（:3836-3857）、`status_document`（:3397-3436）逐义一致，阶段级「或该 stage state=closed」为 D18 规定的有意加项（stage 非全关节点收口时 watcher 静默）。R-U3-5② 用真实 `status --json` fixture 把文档键名钉在实现输出上——键集漂移会被捕获。
8. **测试有效性与非 happy-path**：R-U3-1 按「`**编排位**`（全文件恰 1 处）→首个 `。`」划句界做否定断言——tick 句禁存活判定而 watch-down 句保留「同 C1-1 写法」核死权，边界与 spec 一致；`_section` 缺节 raise AssertionError 非静默通过；R-U3-3 抽 `"…watch-down …"` 引号字面量做 `isascii()`+无换行校验且防空集；RED 纪律合规——`RLT18_BASELINE_SHA=5ab3bba` 钉死 + `git cat-file -e`/`fetch --depth=1` 兜底 + `self.fail` 不 skip；测试内 grep `a6773e7` 零命中（未误钉本分支 SHA）；基线必假机制（`test_a83_adapter_contract_red_baseline`、`_skill_ud2_checks` 基线 ≥2 假）在 UD-3 断言加入后仍成立。
9. **可维护性/风格**：`test_r_u3_*` 命名、docstring 引 D 号、行内 `# UD-3:` 注与既有 `test_a83_*`/`test_c1_1_*` 一致；`_section` 助手通用且 loud-fail；`SkillAdapterTests` 基类改 `RelayCliTestCase` 为 R-U3-5② 起真子进程所需的最小变更（每测试多一次临时目录建销，纯文本断言无副作用）；`_skill_ud2_checks` 名留旧称、docstring 已注明覆盖 UD-3，改动内聚。

## 范围外发现

- 工作区 `git status` 出现其它路并发产物（requirement round-2、lesson 的 untracked 文件）——同一 Review Batch 正常并发态，未动、不计入本路结论。
- `stash@{0}`（RLT_05 WIP）同 code-round1 记录，开工前即有，未动。
