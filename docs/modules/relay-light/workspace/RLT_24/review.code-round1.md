# RLT_24 开发后复核 · 代码轮 1（fresh，非施工者）

复核人：rlt24-review（reviewer#1，devin swe-2-max）。复核对象 `master..HEAD` = `b41cd2d..9500780`；代码差异仅 `tools/relay-light/relay_log.py` 与 `tools/relay-light/test_relay_log.py`（其余为工作区工件）。oracle：design/01 §3.2 L221、§3.4 L257/L301–328、§11.1 A2/A155/A156/A158、§12 L1367–1368；另核 `decisions.md` 第 1 行用户裁决（可计算边界口径）。

## 结论

**REVISE**（P1=1，P2=1）。实现本体逐条对照 §3.4 全部通过、双入口同一校验、27 条 add 反例 + 注入 lint 反例全部实跑正确且账本字节不变；但 A158 基线获取 `git show master:` 在 CI 浅克隆 detached checkout 下必然 ERROR——`relay-light-python` 与 `relay-tests-pwsh`（Windows/Ubuntu matrix）两个硬门禁 job 在 PR 上会红，按仓根 GitHub 流程「CI 必须通过」构成合并阻塞。

## 逐条判据

| # | 判据 | 结论 | 级别 | 依据（文件:行 / 命令输出） | 整改动作 |
|---|---|---|---|---|---|
| 1 | 正确性：§3.4 wire format / token 规则 / 闭集 / 写入者 / node / 双入口同一校验 / 字节不变 | PASS | — | `relay_log.py:2212–2388`（`_decode_close_value`/`_close_note_fields`/`_validate_close_row`/`_validate_close_node`）；自跑 35+ 例见末节记录：裸字符集、`%HH` 大小写、`%2520` 单次解码、裸 `+`/Tab/换行、`%ZZ`/`%C3` 截断、`%0A`/`%09`/`%00` 控制字符、`reason=%20%20`、键顺序打乱、缺/重/未知/空键、枚举大小写、`by`/`agent` 前缀双不一致、superseded/未知/非首节点、worktree 相对路径、无 F 阶段、`coder#1`→A69，均退 2 且 `sha256sum -c` 通过（账本字节不变）。`add` 先 `_validate_event`→A84→`_validate_runtime_event` 提前 return（relay_log.py:2383–2388），不进 `_validate_agent_transition`；`lint` 经 `_lint_ledger` 逐行（relay_log.py:1609–1635）共用 `_validate_close_row`，报 `seq N` + 字段/原因。裁决边界核对：workspace/pane→所声明阶段首有效节点、worktree→收口 F 首有效节点、编排空间→F 为写入者纪律（C4 已取证 seq5@F1）。 | 无。 |
| 2 | 不误伤：旧事件自由 note 不解析；rlt12-win-01 lint 0；断言未删未弱 | PASS | — | 注入 `monitor_restart` 自由 note 含 `object_type=pane %ZZ a+b foo=bar` → lint 0（不解析）；rlt12-win-01 实跑 lint rc=0，sha256=`3cd08f…40b` 与登记一致；`git diff master -- test_relay_log.py` 全 diff 仅 2 行删除（`test_all_nineteen…` 定义行与 `assertEqual(19,…)`，即本卡自身的 19→20 词改造），无断言删除/弱化；无 `.lower()`/`.casefold`（A42）。 | 无。 |
| 3 | 测试有效性：新用例在旧实现上失败；A2/A155/A156/A158 oracle 要素有用例 | FAIL | **P1** | 抽 3 例在 `git show master:` 旧实现上实跑（`/tmp/rlt24-oldimpl`）：`test_a155_wire_encoding…`/`test_a156_five_reason…`/`test_a2_all_twenty…` 均真失败（`HC-RL-A2 invalid event: resource_close`，31 failures），非空测成立。oracle 覆盖齐（A155 双入口 8 例、A156 5 反例+检索/schema、A158 三用例、A2 20 词运行时映射）。**但** `test_relay_log.py:7757–7767`（`baseline_impl()`，`subprocess.run(["git","show","master:tools/relay-light/relay_log.py"], check=True)`）依赖本地 `master` ref。CI 用 `actions/checkout@v4` 默认 `fetch-depth:1`：PR 事件只 fetch 合并提交、detached HEAD，无 `master`/`origin/master` 可解析。模拟验证：`git init && git fetch --depth=1 origin <sha> && git checkout --detach FETCH_HEAD` 后 `git show master:`/`origin/master:` 均 `fatal: 无效的对象名`（rc=128）→ `CalledProcessError` → 该用例 ERROR → `relay-light-python` job 与 `run-relay-tests.ps1`（matrix 双 OS，内含同一 unittest）在 PR 上必然红。本地与 dev 机全绿（master 存在），故障只在 CI 环境。 | `baseline_impl()` 改为不依赖本地分支名：如先试 `git rev-parse --verify master`/`origin/master`，缺失时 `git fetch --depth=1 origin master` 后 `git show FETCH_HEAD:tools/relay-light/relay_log.py`（GitHub 支持按可达对象 fetch）；或钉死基线 SHA + 显式按 SHA fetch。修复须仍在允许路径 `test_relay_log.py` 内（`.github/workflows/ci.yml` 不在闭集）。不可 skip 了事——A158 oracle 要在门禁环境仍有证明力。 |
| 4 | 代码质量：add/lint 共用校验；错误指明 seq/字段；无死代码/常量散落 | PASS | — | `add` 与 `lint` 共用 `_validate_close_row`（relay_log.py:2358–2374 与 1619–1635 唯一入口）；lint 错误统一前缀 `seq N:` + 内层字段/原因（实测 `lint: HC-RL-A155 seq 3: unknown resource_close note key: 'extra'`）；六个 `CLOSE_*` 常量集中定义、grep 全引用、无死代码；`read_ledger` 拆 `_ledger_lines`/`_validate_ledger_row` 供读路径与 lint 复用，非字符串 note 分流注释清楚。小疵不判级：`_validate_close_row` 中 `by != owner or _writer_from_agent(agent) != owner` 在 add 路径两条件同源冗余（lint 路径 `by` 为行字段、不冗余）；`'pane'` 单引号系 A51 静态闸的既定口径（F-C1-02 已登记）。 | 无。 |
| 5 | 回归：两条全量命令自己复跑；无新增 `__pycache__` | PASS | — | 亲跑 `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log`：退出 0，`Ran 217 tests in 546.605s OK`。亲跑 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`：退出 0，Python 217 + install 7 OK，`RELAY ALL PASS (SKIPPED: 1)`。`git status --porcelain` 空、`git diff --check` 干净、无 `__pycache__`/`.pyc`。旧实现对含关闭行账本 `status` 退 4（`line 2: invalid event`），印证 `_lint_ledger`/`_ledger_warnings` 新分支是必要的。 | 无。 |

## 实跑边界输入记录

fixture：`/tmp/rlt24-review/plan`（W0 superseded + W1@W#1、C1/C2@C#1、F1@F#1，agent 表含 builder/coder/checker/scribe），`--config-dir tools/relay-light/skill`，全部命令带 `PYTHONDONTWRITEBYTECODE=1`。账本先 `plan_loaded` 种子行，sha256 前后比对。

**add 正例（8/8 rc=0，lint 复跑 0）**：`pane`/`workspace`/`worktree` 三类型 ok；`%2b`/`%2B` 大小写 hex；`%E4%B8%AD` UTF-8；键序打乱 `outcome=ok object_id=x object_type=pane`；`failed reason=perm%20denied`（workspace/orchestrator）；附加：`%2520`（单次解码→字面 `%20`，未再解成空格）、`%3D`、`%25`、`%20a%20`（首尾编码空格保留、非纯空白判合法）、pane@W1（W0 superseded 后 W1 即首有效节点）。

**add 反例（27/27 rc=2，账本字节 sha256 不变）**：裸 `+`、`%ZZ`、`%C3`（截断 UTF-8）、`%0A`、`%09`、`%00`；`reason=%20%20`、failed 缺 `reason`、`ok` 带 `reason=`/`reason=y`、缺 `outcome`、重复键（同值）、未知键 `foo=bar`/`OBJECT_TYPE`、首空格/双空格/自由尾文、`object_id=`、`object_id=%20`（纯空白）、`object_type=Pane`、`outcome=OK`；写入者/节点：pane←orchestrator#1（A85）、workspace←monitor#1（A85）、coder#1（A69）、pane@C2 非首节点（A155）、worktree@C1（A155）、worktree 相对路径（A155）、superseded W0（A59）、未知 C9（A59）。

**lint 注入侧**：旧事件自由 note 携带 wire-format 垃圾 → rc 0 不解析；注入未知键 → `lint: HC-RL-A155 seq 3: unknown …key: 'extra'` rc 2；注入 `by`/`agent` 不一致（monitor#1+by=orchestrator+pane）→ A85 rc 2；非字符串 `note:123` 关闭行 → A155 rc 2；旧事件非字符串 `note:5` → 通用 `lint: ledger line 2: non-string ledger value` rc 4。关闭行在 `stage_close` 后与未启动阶段均合法：lint 0，`status --json` `errors=[]`、`agents=[builder#1]` 不变、W#1 closed / C#1 pending 派生不变；注入非法关闭行（coder#9、`%ZZ`）时 status rc 0 且 `errors` 分别报 A69/A155 警告（读侧只报告不拒绝）。

**旧实现失败证明**：`/tmp/rlt24-oldimpl`（`git show master:` 产物，新测试文件原样跑）：三例真失败，31 failures（全为 `HC-RL-A2 invalid event: resource_close` 或缺 A155/A156 语义），非 fixture/导入故障；`test_a158_…replay` 在 /tmp 因 `parents[2]` 路径解析 ERROR，属环境伪影，不计入三条证明（A158 本义是兼容断言，设计为新旧实现都过）。

## 范围外发现

- **P2（并入整改建议，不单独判级阻塞）**：`baseline_impl()` 以 `master` 为基线是移动目标——本卡 squash 合入后 `master` 即含 `resource_close` 实现，此后该用例退化为新旧自我比较（仍绿但失去 A158 证明力），且 master push 腿的 CI 在 depth=1 下同样取不到该对象。建议整改时把基线钉到固定 SHA（本卡基线 `b41cd2d`）并显式 fetch。
- **口径记录（非新发现）**：add 校验顺序为 node 存在→agent 类→note 语法→写入者归属→node 归属，与 §3.4 拒绝时点表的「写入者/node→note」字面次序不同——写入者由解码后 `object_type` 决定，客观上必须先解析 note；已登记 findings F-C1-03，与「追加前全量校验、任一不合法退 2、字节不变」硬承诺一致。
- **口径记录（非新发现）**：`lint` 由此开始读取账本并对每行做通用七字段闸——这是 §3.4 拒绝时点表要求的 lint 管线本身；副作用是任何历史账本结构性坏行（含非字符串 note）现在使 lint 退 4，此前 lint 不读账本。rlt12-win-01 实跑 lint 0 证明兼容。`_lint_ledger` 不校验跨行时序（如首行须 `plan_loaded`），跨行不变量仍只在 add/status 读路径——属 lint 既有职责边界，非本卡引入。
- **观察（非缺陷）**：`status` 文本输出的「当班写入者」反映最新行 `by`——尾部关闭行会令其显示 orchestrator/monitor 属实；该字段纯文本、不入 `status --json` 十三键（relay_log.py:2785 注释），task_plan L78 已声明行事实字段不当作状态派生。
- 施工者已登记的转派项 F-C1-01（skill/adapter/as-built 未收录 `resource_close`）维持「只登记不顺手改」，本路复核确认未越界。
