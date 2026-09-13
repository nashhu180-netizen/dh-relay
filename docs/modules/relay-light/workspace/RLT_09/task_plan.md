<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_09

> 五批串行施工。每批由同一个 `rlt09-exec` coder 完成目标行为 RED→GREEN、证据登记、窄提交并发 `READY_FOR_REVIEW`；`rlt09-audit` 小审 PASS 后 orchestrator 才重派下一批。任何 BLOCKED 交 `rlt09-decide`，不得越批。

## 全局施工约束

1. 每次进场先 `git rebase --autostash master` 并记录 HEAD/工作树；读 `brief.md`、本文件、`progress.md`、`findings.md` 与最新 Handoff。
2. 只用 `git add <精确文件>`；测试后删除 `tools/relay-light/__pycache__/`，再核 `git status --short --untracked-files=all`、`git diff --check`、`git diff --name-only <批前SHA>..HEAD`。
3. RED 必须命中本批目标行为断言；把完整命令、exit、失败断言摘要记为 E-ID。随后只做本批最小实现并用同命令 GREEN。
4. 每批完成后 coder 在终端打印四行小结（做了什么 / 证据 / 偏离与 findings / 下一步）；scribe 只据事实追加 `progress.md`。coder 可追加 `findings.md` / `lesson_candidates.md`，不得让 scribe 代写。
5. 每批 commit scope 为英文 `relay-light`；commit 后发 `DONE ... READY_FOR_REVIEW`，audit 未 PASS 不开始下一批。B5 PASS 后由 orchestrator 重派 exec 才能发 `CONSTRUCTION_DONE`。

## W audit 待裁决项

- **P1-01：待 `decision.1` 裁决后重写。** 当前 B4 关于三类白名单与方案文件写「超出范围」的合同取向不变；builder W2 不选边、不删任一要求。裁决同步权威 oracle 后，必须重写 B4 对应的程序、skill 模板、正反例与 actual 集合判据，再交 plan-review。
- **P1-03：待 `decision.1` 裁决后重写。** 当前 B3 的 A121 措辞及“节点表和 agent 表追加”fixture 不变；builder W2 不解释“节点行”范围。裁决同步权威 oracle 后，必须重写 B3 场景动作与验证判据，再交 plan-review。
- **本次 W2 只闭合 P1-02。** 下述 B4 快照算法独立于 P1-01 的白名单取向；P1-01/P1-03 未裁决前整份 W 计划仍不具备 PASS 条件。

## B1 — A119 + A123 账本合同

### 改动点

- `tools/relay-light/relay_log.py`
  - 新增专用 plan-amend note 解析/校验（可复用 `_note_tokens`，但方案文件名必须是独立非 key token，`nodes=` 列表非空且节点号逐项合法）。
  - 在 `_validate_event_semantics` 的控制事件分支中，对 `plan_amend` 执行 A119；保持 `_validate_stage_event` 对它不施加 stage 生命周期/agent 状态转换。
  - 在 `_validate_stage_event` 校验 `stage_result` 时，按该 note 的 `stage_id` 只查询同阶段历史 plan_amend：有则要求 `amend=` 与 `nodes=` 都存在，无则禁止 `amend=`；错误码 A123。不额外发明“无 amend 时禁止独立 nodes token”等 oracle 未冻结的拒绝条件。
- `tools/relay-light/test_relay_log.py`
  - 新增 `RelayLifecycleTests.test_plan_amend_requires_monitor_and_complete_note_and_is_repeatable`。
  - 新增 `RelayLifecycleTests.test_stage_result_amend_summary_matches_stage_history`。
  - 保持 `test_writer_consistency_exits_two_for_every_frozen_owner`、`test_stage_result_projection_carries_five_keys_with_and_without_amend` 的 schema 分层断言。

### RED → GREEN

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayLifecycleTests.test_plan_amend_requires_monitor_and_complete_note_and_is_repeatable \
  tools.relay-light.test_relay_log.RelayLifecycleTests.test_stage_result_amend_summary_matches_stage_history
```

- RED：当前合法 plan_amend 已可写，但缺文件名不被 A119 拦；stage_result 与本阶段 plan_amend 不对称/不一致未按 A123 拒绝。只接受这些目标断言失败。
- GREEN：A119 的写者、两类缺字段、重复且状态机不变全部通过；A123 有 amend 缺两类摘要、合法摘要、无 amend 却写摘要、普通无 amend 五组通过，exit 与编号精确。

### audit 小审输入

- 批前/批后 SHA、B1 commit；两条定向命令的 RED 与 GREEN E-ID。
- `git diff --stat`、`git diff --name-only`、`git diff --check`；实现只触及两份 Python 文件及 workspace 证据。
- A119/A123 用例矩阵；证明 plan_amend 未进入 `AGENT_EVENTS` 转换，stage 查询不串阶段；既有 serializer 两层 key-set 回归结果。

## B2 — A120 lint 连续性放宽与 RLT_03 交接证据

### 改动点

- `tools/relay-light/relay_log.py`
  - 仅替换 `lint_plan` 中 `stage_runs` 的 A129 连续性判定：允许一个已出现 stage 在表尾形成合法追加段；仍忽略 superseded 行。
  - 放宽算法必须只识别“表尾追加到一个既有 stage”的形态，不改变依赖图、stage 顺序、节点唯一、同卡串行校验。
- `tools/relay-light/test_relay_log.py`
  - 新增 `test_a120_allows_append_and_superseded_separation`：其余条件全合法的同-stage 表尾追加正例；superseded 隔开正例复验。
  - 新增 `test_a120_keeps_four_hard_constraints`：A46 重复号（含 superseded）、A72 依赖 superseded、A89 指向后阶段、A109 同卡并行，逐项 assert exit 2 + 编号。
  - 既有 `test_stage_must_be_known_and_grouped_contiguously` 的 `C1→R1→C2` fixture 只保留它真实承担的 A129 非法活跃隔断断言；不得把同时含 `C2.depends_on=R1` 的多违规 fixture 当作 A120 正例。

### RED → GREEN 与正式前后证据

在任何实现改动前，先提交/运行新增合法表尾正例：

```bash
python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanLintTests.test_a120_allows_append_and_superseded_separation
```

- RED：正式基线 `b6b7d66` 语义上“表尾追加”子例 exit 2/A129；superseded 隔开子例保持通过。记录基线 SHA、命令、exit、失败断言为“拒绝”证据。
- GREEN：实现后同一命令两正例通过，构成正式版本拒绝→通过。

再运行：

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayPlanLintTests.test_a120_allows_append_and_superseded_separation \
  tools.relay-light.test_relay_log.RelayPlanLintTests.test_a120_keeps_four_hard_constraints \
  tools.relay-light.test_relay_log.RelayPlanLintTests.test_node_number_is_unique_even_when_superseded \
  tools.relay-light.test_relay_log.RelayPlanLintTests.test_dependencies_cannot_target_superseded_nodes \
  tools.relay-light.test_relay_log.RelayPlanLintTests.test_each_active_node_needs_an_active_agent \
  tools.relay-light.test_relay_log.RelayPlanLintTests.test_stage_must_be_known_and_grouped_contiguously \
  tools.relay-light.test_relay_log.RelayLifecycleTests.test_a89_lint_rejects_a_backward_cross_stage_dependency
```

判据：两正四反精确通过；A46/A72/A75/A89/A109 编号不漂；枚举与依赖相关既有测试全绿。RLT_16/RLT_19 真流程证明明确记作后续，不在本批伪造。

### audit 小审输入

- 实现前正式 SHA 下表尾正例 RED，以及同一测试实现后 GREEN。
- 两正四反 fixture 逐行表格，解释每个 fixture 除目标变量外为何合法；旧多违规 fixture 的收窄 diff。
- 相关既有回归输出、B2 commit、四集合与 whitespace。

## B3 — A121 status 重读

### 改动点

- `tools/relay-light/test_relay_log.py` 新增 `RelayStatusProjectionTests.test_status_rereads_appended_stage_in_plan_order`。
- fixture 必须在同一个 plan 目录第一次调用 `status --json`，随后只对 `relay_plan.md` 节点表和 agent 表追加一个合法 X 阶段实例，再次调用 status；计划采用非 WCRF 顺序并维护合法依赖。
- 若测试暴露实现缓存，才最小修改 `relay_log.py` 的 `_status_command`/计划读取路径；不得为“证明不改代码”制造无意义实现 diff。A121 的“仅向计划追加”描述的是两次 status 之间的场景动作。

### RED → GREEN

```bash
python3 -m unittest -v tools.relay-light.test_relay_log.RelayStatusProjectionTests.test_status_rereads_appended_stage_in_plan_order
```

- RED：先临时让断言期待一个未追加阶段，确认测试咬住 `stages` 精确顺序（变异只在工作树、随即撤回，不提交）；若现状已满足 A121，允许“行为已绿 + 断言变异红”，不得伪称实现前行为失败。
- GREEN：两次 status 均 exit 0；第二次恰多 X 实例，节点与 stage 顺序随 plan，且第一次 payload 不被回写改变。

### audit 小审输入

- fixture 追加前后 diff、两次 payload 摘要、断言变异 RED 与最终 GREEN。
- 说明 `relay_log.py` 是否零改及理由；B3 commit、边界四集合。

## B4 — A122 白名单守门 + planner-amend 模板

### 落地形态裁决

采用现有 `lint` 的 planner-amend 校验模式（新增 lint 下属 flags/内部 helper），**不新增顶层子命令**，故 A135 的命令集仍为 `add/status/lint`。W2 将两阶段接口冻结为：

```text
relay_log.py lint --plan <plan_dir> --amend-check before --repo <repo> --snapshot-out <repo外临时JSON> --proposed-path <path> [--proposed-path <path> ...]
relay_log.py lint --plan <plan_dir> --amend-check after  --repo <repo> --snapshot <同一临时JSON>
```

`before` 完成 proposed 全量预检、双采样稳定检查并把 repo root、HEAD、真实 index tree、before tree、before marker cards 与规范化 proposed 写入 repo 外新文件（存在即拒绝覆盖）；成功后才准动笔。`after` 读取同一快照、复核身份/HEAD/index，构造 after tree 并比较 actual。上述 flag 名、阶段值和快照字段是 P1-02 冻结接口，不再留给 exec 改名；临时文件不得进入 Git，普通 lint 合同不变。

**F-001 前置闸**：design §4.5.2 同时要求“可碰文件只有三类 / 禁区命中整份不落笔”和“碰禁区时在方案文件写『超出范围』”；方案文件通常是 `workspace/<卡>/decision.<n>.md` 或 strategist 文件，不在三类白名单内，若用全仓 `git diff --name-only` 会出现第四类路径。exec 在 B4 动代码前必须发 `BLOCKED` 交 decider/orchestrator 裁决，二选一后才能继续：

- **方案 A（扩白名单）**：经用户/design 修订，把“当前输入方案文件仅可追加超出范围结果”列为第四类控制记录，再让 actual diff 校验显式接纳它；不授权其他 workspace 文件。
- **方案 B（保持三类闭集）**：经用户/design 修订，planner-amend 不写方案文件，只打印结构化“超出范围”，由 monitor 写 `stage_result outcome=blocked`；actual diff 继续严格只认三类。

builder 不选边；未裁决时 B1～B3 可依序完成，B4 停在前置闸，B5 是否先行由 orchestrator 明确重排，exec 不自行越批。

### P1-02 冻结：改前快照、洁净前提与改后取集

本节是 B4 实现和测试的固定算法；不得退回 `git diff <长期 tree-ish>`，也不得用改前 `git status` 的路径集合做减法，因为两者都会漏掉“原本 dirty 的同一路径再次变化”。

#### 1. 洁净前提不是“全仓必须 clean”

- 允许入场前存在 tracked dirty、staged 状态和 untracked 非忽略文件；它们必须被 before 快照原样吸收，不能混入本次 actual。
- 守门窗口必须是单写者静默区：从 before 采样开始到 after 采样结束，除当前 planner-amend 外无其他进程写业务仓。
- 记录 `repo_root = git rev-parse --show-toplevel`、`head_before = git rev-parse HEAD`、`real_index_before = git write-tree`。真实 index 只读，planner-amend 在守门窗口内禁止 `git add/reset/commit`；after 再取 `head_after` 与 `real_index_after`，任一不等即 A122 fail closed，actual 不作通过结论。
- before 快照连续构造两次，两次 tree id、HEAD、真实 index tree id 必须一致才允许动笔；不一致说明现场仍在变化，A122 fail closed。临时 index 文件必须由安全临时目录新建，不能复用真实 `.git/index`，结束后删除。

#### 2. before / after tree 构造（tracked + untracked）

对 before 的两次稳定性采样和 after 采样都执行同一算法，所有 Git 命令固定 `-C <repo_root>`，且只为该子进程设置 `GIT_INDEX_FILE=<全新临时 index>`：

```bash
git -C <repo_root> read-tree <head_before>
git -C <repo_root> add -A -- .
git -C <repo_root> write-tree
```

- `read-tree` 从同一 HEAD 初始化临时 index；`add -A -- .` 把采样时的 tracked 修改/删除以及 untracked 非忽略文件写入临时 index，不改变真实 index和工作树；`write-tree` 返回该时刻完整可复现 tree id。
- untracked 非忽略文件的新建、内容修改和删除均被树差捕获；tracked 文件无论原来 clean、unstaged dirty 或 staged dirty，均以采样时工作树 bytes/mode 为准。ignored untracked、`.git/` 内部对象、空目录不进入 Git tree，明确不属于 A122 路径观察面；proposed 若指向这些不可观察路径则预检拒绝。
- 路径按 Git 的 NUL 协议处理，禁止按换行切分；symlink/mode/blob 都由 tree 记录。遇到无法 add/read 的文件、submodule 工作树内路径、Git 命令非零或解码失败一律 A122 fail closed。

#### 3. proposed 与 actual 的精确算法

1. 从方案抽取完整 proposed 列表，先转成 repo-relative POSIX 路径；拒绝绝对路径、空路径、`.`/`..` 穿越、NUL、repo 外路径、重复项和 Git ignored 路径。
2. 以 **before tree 内的 relay_plan marker cards** 做授权判断；不得读改后的 marker 给新卡 task_plan 反向授权。P1-01 裁决前仍按现有两案停在前置闸，不改变白名单取向。
3. 全量 proposed 预检必须在任何目标文件写入前完成；任一非法则整组拒绝，不调用写入动作。
4. 预检通过后才一次修改；构造 `after_tree`，并取：

   ```bash
   git -C <repo_root> diff --name-only -z --no-renames <before_tree> <after_tree>
   ```

   输出按 NUL 分隔解码、统一为 repo-relative POSIX 路径、去重排序，得到 `actual`。`--no-renames` 固定 rename 为 delete+add 两个路径，避免相似度启发式改变集合。
5. 成功的唯一集合判据是 `actual == proposed`：actual 多路径表示越界，少路径表示 proposed 中有未真正变化/no-op 的目标；两者都 A122 fail closed。随后再核 HEAD/真实 index 未变，最后运行普通 plan lint。

临时 tree/blob 只作为 Git 对象证据，不改真实 index；测试与证据要登记 before/after tree id、proposed/actual 的 JSON 或 NUL 安全转写，不登记文件正文或凭据。

#### 4. 必做回归矩阵

- **已有 dirty 不混入**：改前路径 A 已 dirty，proposed 只含 B；before 吸收 A，after 只改 B，断言 actual 恰 `{B}`。
- **同路径二次修改不漏报**：允许路径 A 改前已 dirty（相对 HEAD 为 v1），before tree 固化 v1；planner-amend 再改为 v2，断言 actual 恰 `{A}`，证明不是用“改前 dirty 路径集合相减”。
- **tracked 三态**：对 clean tracked 修改、tracked 删除、原 staged/unstaged dirty 后二次修改分别断言 actual；并断言真实 index tree id 前后相同。
- **untracked 三态**：改前已有 untracked 非忽略文件后再改、运行中新建、运行中删除分别进入 actual；ignored proposed 在预检拒绝。
- **成功精确相等**：proposed 含两个允许路径且两者都产生净变化，断言排序后 `actual == proposed`；再加一个 proposed no-op，断言因 actual 少项而拒绝。
- **越界多项**：proposed 只含允许 A，但写入同时碰 B，断言 actual 多出 B 并拒绝。
- **禁区混合零变化**：proposed 同时含允许目标 A 与 design 禁区 D，预检即拒绝，不调用写入 callback；重新采 after tree，断言 `actual == ∅`，并逐个断言 A、D 的 before/after tree blob 与工作树 bytes 均相等。
- **静默/真实 index 破坏**：before 双采样不一致、HEAD 改变或真实 index tree id 改变各一例 fail closed，不把污染后的集合报成成功。

### 改动点

- `relay_log.py`：
  - 按上节临时 Git index/tree 算法实现 before/after 快照；解析 **before tree** 中 `relay_plan.md` marker 的 module/cards；路径全规范化为 repo-relative POSIX 格式，拒绝绝对路径、`..`、repo 外路径。
  - 白名单仅三类：该 plan 的 `relay_plan.md`；同模块 `dev_plan/P<N>-*.md`；改动前 cards 中现有卡的 `workspace/<card>/task_plan.md`。
  - `docs/modules/<module>/design/` 前缀和其他路径一律 A122；新加到 marker 的 card 不得反向授权其 task_plan。
  - 预检集合任一非法则整体失败，调用方未写任何文件；改后固定用 `git diff --name-only -z --no-renames <before_tree> <after_tree>` 取得 actual，并要求 `actual == proposed`。普通 `lint --plan` 不启用 git 检查。
- `test_relay_log.py`：新增 `RelayPlanAmendGuardTests`，覆盖三类逐项/组合正例、旧 card/new card、design、混合集合全有全无、repo 外路径、普通 lint、顶层三命令，以及本节 tracked/untracked/dirty/静默/集合相等完整矩阵。
- `tools/relay-light/skill/SKILL.md`：补 `planner-amend` 专节/提示词模板，输入恰含方案文件、当前 relay_plan、开发方案、涉及的已有卡 task_plan；先从方案列出完整 proposed paths 并跑预检，命中禁区只向方案文件追加「超出范围」说明后停止；通过才一次改完，改后跑精确 diff 守门与普通 lint，失败最多修三次，第 3 次仍失败按超出范围收尾。明确不 blocked/escalate、不建新卡七件套、agent_launch→done。
- 两份 adapter 若只需链接到核心模板则不复制模板；若当前派活入口必须增加引用，两份保持同构并加结构测试。

### RED → GREEN

```bash
python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanAmendGuardTests
python3 -m unittest -v tools.relay-light.test_relay_log.SkillCoreDocTests.test_planner_amend_template_contract
python3 -m unittest -v tools.relay-light.test_relay_log.RelayConfigTests.test_each_subcommand_help_exposes_config_dir
```

- RED：F-001 已裁决并同步权威合同后，校验模式/模板当前缺失；有效 RED 是预期 API/文本合同未实现，不接受 argparse 方法名写错或 fixture 仓库未初始化。
- GREEN：P1-02 矩阵全部通过；成功例 `actual == proposed`；改前 dirty 同路径二次修改仍进入 actual；tracked/untracked 处理符合冻结算法；新卡 task_plan/design/混合集合 A122；design 混合反例 `actual == ∅` 且目标 blob/bytes 零变化；普通 lint 不回归；顶层命令仍三个。P1-01 的最终白名单集合按 `decision.1` 重写后执行。

### audit 小审输入

- CLI/help 与 helper 契约、HEAD/真实 index/before 双采样稳定证明、before cards 快照、before/after tree id、所有正反例的 path set/exit/rule。
- tracked/untracked/改前 dirty 同路径二次修改矩阵；design 混合反例的 `actual == ∅` 与目标 blob/bytes 零变化；成功例的 proposed/actual 精确相等证明。
- SKILL 模板逐项映射；两 adapter 是否改动及同构证据；B4 commit、边界四集合。

## B5 — F-003 UTF-8 输出防护

### 改动点

- `relay_log.py`：在 `main` 解析/输出前调用小型 `_configure_utf8_stdio()`，对支持 `reconfigure` 的 stdout/stderr 设置 `encoding="utf-8"`；对测试替身/无 reconfigure 流不破坏，避免关闭或替换外部流。stdout 与 stderr 都覆盖。
- `test_relay_log.py`：新增 `RelayCliEncodingTests`，以真实 CLI 子进程强制 `PYTHONIOENCODING=ascii`、`cp1252`，分别触发 status 中文 stdout、lint 中文 stderr/JSON；用 bytes 捕获并显式 UTF-8 解码，不继承/依赖薄壳 `PYTHONUTF8=1`。

### RED → GREEN

```bash
python3 -m unittest -v tools.relay-light.test_relay_log.RelayCliEncodingTests
```

- RED：当前实现至少一个子例非零，stderr 含 `UnicodeEncodeError`/`charmap` 或 stdout 写入失败；fixture 本身必须先在 UTF-8 环境能成功。
- GREEN：ascii/cp1252 两环境的 status/lint 均按合同 exit，stdout/stderr bytes 可 UTF-8 解码并含中文；移除入口防护会恢复目标 RED。

随后整卡收束：

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayLifecycleTests.test_plan_amend_requires_monitor_and_complete_note_and_is_repeatable \
  tools.relay-light.test_relay_log.RelayLifecycleTests.test_stage_result_amend_summary_matches_stage_history \
  tools.relay-light.test_relay_log.RelayPlanLintTests.test_a120_allows_append_and_superseded_separation \
  tools.relay-light.test_relay_log.RelayPlanLintTests.test_a120_keeps_four_hard_constraints \
  tools.relay-light.test_relay_log.RelayStatusProjectionTests.test_status_rereads_appended_stage_in_plan_order \
  tools.relay-light.test_relay_log.RelayPlanAmendGuardTests \
  tools.relay-light.test_relay_log.SkillCoreDocTests.test_planner_amend_template_contract \
  tools.relay-light.test_relay_log.RelayCliEncodingTests
python3 -m unittest tools/relay-light/test_relay_log.py
pwsh -NoProfile -File tools/tests/run-relay-tests.ps1
```

判据：定向、Python 全量与 PowerShell 全量 exit 0；继承失败按基线逐项分类，不笼统称全绿；无 `__pycache__` 入提交，allowed-paths 闭集成立。

### audit 小审输入

- ascii/cp1252 的 RED/GREEN 原始摘要与环境变量白名单（不得泄露凭据）。
- 整卡定向/Python/pwsh 输出、B5 commit、边界四集合、`git diff --check`。
- 五条 HC + F-003 → 用例 → E-ID 总映射；若全量有继承失败，附 master 基线同命令逐项比较。

## 构造完成信号

B5 audit PASS 后，只有 orchestrator 明确重派 exec 收束，exec 才追加：

```text
DONE task=RLT_09 role=exec batch=5 status=CONSTRUCTION_DONE evidence=<E-ID范围,commits> next=orchestrator
```
