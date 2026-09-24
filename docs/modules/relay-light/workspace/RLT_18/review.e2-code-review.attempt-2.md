# E2 code review — RLT_18 `watch` 实现 · attempt 2（targeted）

> e2-reviewer#2 · round=2 · 2026-09-24 · fresh 实例（attempt-1 会话已清理）。
> 范围：只核 attempt-1 两项 open P2（P2-1 monitor 更替零覆盖、P2-2 A101 oracle 逃逸面）
> 在整改提交 `ae4f93c` 下是否闭合；整改提交范围审计；两条回归本棒自跑。
> P3 与已登记项不重审。审查基线 HEAD `ada9ace`。

## 结论 PASS

P2-1、P2-2 均闭合；整改提交范围干净；两条回归本棒复跑全绿。下方两项观察为
残余加固面（非 attempt-1 点名面），按 P3 口径登记，不重开 P2。

## 逐项核对

### P2-1（monitor 更替覆盖）→ 闭合

`_watch_monitor_terminal`（relay_log.py:3687–3709）三分支现状：

| 分支 | 覆盖用例 | 本棒实证 |
|---|---|---|
| `stage_close`（3700–3701） | 既有 `test_a83_5` 等 | 沿用既有覆盖，本次未重验 |
| `launches > int(own)`（3709） | 新 `test_a83_14` | 变异 A/C 均转红（下表） |
| `monitor_restart`（3705–3708） | 新 `test_a83_15` | 变异 C 下独立兜底退出，证明真实行使 |

`_monitor_replacement`（test_relay_log.py:9580–9625）断言有效链：fixture
`_open_w_stage_rows` 用正确写者（`monitor_launch`→`orchestrator#1`，
`monitor_restart`→`monitor#2`，无 P3-3 式失真）；追加第二条
`monitor_launch(stage_id=DHR_90:W#1 herdr=lead-w2)` 后，断言旧线程名消失、
`watch:DHR_90:W#1:monitor#2` 在列、`wait@30`/`get@60` 打 `lead-w2`（
`_watch_present_monitors` 取该 stage 最新 launch note 得新 herdr 名，3652）、
末条 prompt 为 `[relay-light] monitor#2 -> idle`、旧名 `lead-w` 仅 t=0 一笔
wait 且零 get——旧线程与新线程行为双侧钉死。

本棒自做三次变异（均在 relay_log.py 工作区临时改动，跑完 `git checkout`
还原，`git status`/`git diff` 已核为空）：

| 变异 | 命令 | 结果 | 说明 |
|---|---|---|---|
| A：`launches > int(own)` → `>=`（3709） | a83_14 + a83_15 | **双双 FAIL**（monitor#1 在 t=0 即自杀，`assertIn` 失败；failures=2，0.108s） | 派单建议变异，确认会红 |
| B：`int(other) > int(own)` → `<`（3707，仅 restart 比较） | a83_15 + a83_14 | **双双 PASS（逃逸）** | restart 分支被行使但未被隔离——见观察 O-1 |
| C：launch 计数 `stage_id ==` → `!=`（3703） | a83_14 + a83_15 | **a83_14 FAIL**（monitor#1/#2 并存，恰为 P2-1 描述失败面）；**a83_15 PASS** | 非对称结果证明 restart 分支独立行使、非顺带同行 |

判定：P2-1 点名的失败面（launches 比较 / stage_id note 匹配）已被断言有效
钉住且变异可红；restart 分支真实覆盖（C 的非对称结果 + 整改方 `>own+99`
变异下 a83_15 仍绿互为印证）。闭合。

### P2-2（A101 oracle 逃逸面）→ 闭合

- **subprocess 约束语义**：`_watch_subprocess_violations`（test_relay_log.py:
  8523–8555）现为「watch 闭包内一切 `subprocess.run`/`Popen` 必须位于
  `HerdrClient` 类体内」，argv 内容无关；闭包外（如 `_git_readonly`）不约束。
  本棒独立重算闭包：60 个成员（`run_watch`/`HerdrClient`/`WatchClock` + 全量
  传递引用），`_git_readonly` **不在**闭包内——旧豁免的目的（放行 git 只读）
  改由闭包边界正确承担。`HerdrClient._run` 的 `["herdr",*argv]` 位于类体内，
  不判违规。
- **禁则覆盖**：对照 P2-2 点名逐项——`.open`（`Path.open("w")`，任意接收者
  一律判）/`.unlink`/`.touch`/`.mkdir`/`.rename`/`.symlink_to` 均在
  `_WATCH_BANNED_ATTRS`；`os.remove/unlink/mkdir/makedirs/rmdir/chmod/write/
  open`（+既有 replace/rename）均在 `_WATCH_BANNED_OS_ATTRS`；`tempfile.*`
  与 `shutil.*` 由新增 `_WATCH_BANNED_MODULE_ATTRS` 罩全属性。**点名面全覆盖**。
- **注入自测**：`test_a101_4` 注入点 `polling = False`（relay_log.py:3760，
  `_watch_agent_loop` 内、闭包内，replace 第 1 处命中正确）。本棒手工复跑
  checker 于变异源码，5 行注入逐一落判：`.open`、`.unlink`、`os.remove`、
  `tempfile.mkstemp`、`subprocess call outside HerdrClient`（`["tee",…]` 字面量
  不再被豁免）。
- **对当前实现仍全绿**：`_watch_source_violations(现行源码)` → `[]`（本棒
  实测）；`test_a101_1` 绿。

判定：三项验收点（约束语义 / 禁则覆盖 / 注入判违规 + 现行实现全绿）全部
满足。闭合。

### ae4f93c 范围审计 → 干净

`git show ae4f93c --name-only`：仅 `tools/relay-light/test_relay_log.py`
（+152/−21：禁则三集合、` _watch_subprocess_violations` 签名与语义、
`_monitor_replacement` + test_a83_14/15、test_a101_4）与
`workspace/RLT_18/`（DONE signal、evidence/e2-remediation-1/ 五件、
progress.md 追加一行）。**未改** `relay_log.py` / 两 adapter / `SKILL.md`。

## 观察（残余加固面，P3 口径，不重开 P2）

- **O-1　restart 分支未被单变量隔离**：a83_15 的 restart 总与第二条
  monitor_launch 同现，`launches > own` 永远兜底——单破 restart 比较
  （变异 B）逃逸。真实账本模型下 `monitor_restart` 的写者 monitor#k 必先有
  launch #k，两分支天然耦合，残余面窄；若要彻底隔离需构造「restart 到本
  stage 节点但本 stage launches 未增」的跨界 fixture（如他 stage 的
  monitor#2 对本 stage 节点写 restart）。登记知悉，不阻塞。
- **O-2　oracle 同族残余面**：subprocess 检查只看 `run`/`Popen` 属性，
  `subprocess.call/check_output`、`os.system/os.popen` 仍逃逸（`io.open`
  已被 `.open` 禁则兜住）。这些不在 P2-2 点名集合内；oracle 定位是防呆
  绊线而非完备证明，扩面是一行级加固，留后续。

## 核查范围与方法

- 读：`dispatch/e2-code-review.md`、`review.e2-code-review.attempt-1.md`
  （P2-1/P2-2 原文）、`git show ae4f93c` 全量 diff、`evidence/e2-remediation-1/`
  五件；实现 `_watch_monitor_terminal`/`_watch_present_monitors`/`run_watch`
  主循环/`_watch_agent_loop`；测试 `_watch_source_violations`/
  `_watch_subprocess_violations`/`_monitor_replacement`/FakeClock/FakeHerdr 及
  全部 fixture helper。
- 变异试验：三次单点变异（上表），全部在工作区临时改动、跑后 `git checkout`
  还原；结束态 `git status --porcelain` 与 `git diff` 均为空。
- oracle 实测：python 内联提取 `_watch_source_violations` 对现行源码、注入
  源码、残余族源码分别求值（结果见上）。

## 回归复跑（本棒实测）

| 命令 | 结果 | 退出码 |
|---|---|---|
| `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log` | **Ran 269 tests in 498.022s — OK** | 0 |
| `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` | **RELAY ALL PASS (SKIPPED: 1)**；skip=`relay-psmux-real`（既有真终端豁免口径，与基线一致）；内含 test_relay_log 269 tests 473.692s OK + test_install_skill 19 tests OK | 0 |

269 = 基线 266 + 新增 test_a83_14 / test_a83_15 / test_a101_4，与整改证据一致。

## `__pycache__` 审计

`find . -type d -name __pycache__ -o -type f -name '*.pyc'` → **空**
（本棒全部 python 命令带 `PYTHONDONTWRITEBYTECODE=1`）。

## 边界声明

本棒只写本文件与 `DONE.e2-code-review.attempt-2.md`；未提交、未启动
agent/终端；三次变异均已还原且工作区零残留；RELAY_RECEIPT preflight 通过
（无 `RELAY_*` 环境变量）。
