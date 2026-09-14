<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_09

> 五批串行施工。每批由同一个 `rlt09-exec` coder 完成目标行为 RED→GREEN、证据登记、窄提交并发 `READY_FOR_REVIEW`；`rlt09-audit` 小审 PASS 后 orchestrator 才重派下一批。任何 BLOCKED 交 `rlt09-decide`，不得越批。

## 全局施工约束

1. 每次进场先 `git rebase --autostash master` 并记录 HEAD/工作树；读 `brief.md`、本文件、`progress.md`、`findings.md` 与最新 Handoff。
2. 只用 `git add <精确文件>`；测试后删除 `tools/relay-light/__pycache__/`，再核 `git status --short --untracked-files=all`、`git diff --check`、`git diff --name-only <批前SHA>..HEAD`。
3. RED 必须命中本批目标行为断言；把完整命令、exit、失败断言摘要记为 E-ID。随后只做本批最小实现并用同命令 GREEN。
4. 每批完成后 coder 在终端打印四行小结（做了什么 / 证据 / 偏离与 findings / 下一步）；scribe 只据事实追加 `progress.md`。coder 可追加 `findings.md` / `lesson_candidates.md`，不得让 scribe 代写。
5. 每批 commit scope 为英文 `relay-light`；commit 后发 `DONE ... READY_FOR_REVIEW`，audit 未 PASS 不开始下一批。B5 PASS 后由 orchestrator 重派 exec 才能发 `CONSTRUCTION_DONE`。

## W audit 裁决闭合

- **P1-01：CLOSED by `decision.1` ①B + RLT-A-07。** B4 保留三类闭集；禁区拒绝时全部计划目标与输入方案文件零变化，失败原因进入 planner-amend 普通 `done.note`，monitor 写 blocked `stage_result`；删除回写方案文件要求。
- **P1-02：CLOSED by W2。** B4 保留下述临时 Git index/tree 的 before/after 快照与 `actual == proposed` 算法，覆盖 tracked、untracked 和改前 dirty 同路径二次修改。
- **P1-03：CLOSED by `decision.1` ②A + RLT-A-07。** B3 明确两次 status 之间只修改同一 `relay_plan.md`，追加新阶段节点行及保持计划合法所必需的对应 agent 行；不改代码、不改账本。

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
- fixture 必须在同一个 plan 目录第一次调用 `status --json`，冻结 `relay_log.py` 与 `relay_log.jsonl` 的 bytes/hash；随后只修改同一 `relay_plan.md`，追加一个新 X 阶段的节点行及通过 A75、A24 所必需的对应 agent 行，再次调用 status。计划采用非 WCRF 顺序并维护合法依赖。
- 若测试暴露实现缓存，才最小修改 `relay_log.py` 的 `_status_command`/计划读取路径；不得为“证明不改代码”制造无意义实现 diff。A121 的“仅向计划追加”描述的是两次 status 之间的场景动作。

### RED → GREEN

```bash
python3 -m unittest -v tools.relay-light.test_relay_log.RelayStatusProjectionTests.test_status_rereads_appended_stage_in_plan_order
```

- RED：先临时让断言期待一个未追加阶段，确认测试咬住 `stages` 精确顺序（变异只在工作树、随即撤回，不提交）；若现状已满足 A121，允许“行为已绿 + 断言变异红”，不得伪称实现前行为失败。
- GREEN：两次 status 均 exit 0；第二次恰多 X 实例，节点与 stage 顺序随 plan，且第一次 payload 不被回写改变；两次之间 `relay_log.py` 与 `relay_log.jsonl` bytes/hash 不变，除同一 `relay_plan.md` 外 repo/fixture 无其它文件变化；A75 空节点反例仍拒绝。

### audit 小审输入

- fixture 的计划文件追加前后 diff（仅节点行 + 必要 agent 行）、两次 payload 摘要、代码/账本哈希不变、A75 回归、断言变异 RED 与最终 GREEN。
- 说明 `relay_log.py` 是否零改及理由；B3 commit、边界四集合。

## B4 — A122 白名单守门 + planner-amend 模板

### 落地形态裁决

采用现有 `lint` 的 planner-amend 校验模式（新增 lint 下属 flags/内部 helper），**不新增顶层子命令**，故 A135 的命令集仍为 `add/status/lint`。W2 将两阶段接口冻结为：

```text
relay_log.py lint --plan <plan_dir> --amend-check before --repo <repo> --snapshot-out <repo外临时JSON> --proposed-path <path> [--proposed-path <path> ...]
relay_log.py lint --plan <plan_dir> --amend-check after  --repo <repo> --snapshot <同一临时JSON>
```

`before` 完成 proposed 全量预检、双采样稳定检查并把 repo root、HEAD、真实 index tree、before tree、before marker cards 与规范化 proposed 写入 repo 外新文件（存在即拒绝覆盖）；成功后才准动笔。`after` 读取同一快照、复核身份/HEAD/index，构造 after tree 并比较 actual。上述 flag 名、阶段值和快照字段是 P1-02 冻结接口，不再留给 exec 改名；临时文件不得进入 Git，普通 lint 合同不变。

**decision.1 ①B 已生效**：三类闭集不增加第四类。禁区或其它 proposed 非法时，`before` 预检在任何目标写入前整份拒绝；全部计划目标文件和输入方案文件均保持零变化。planner-amend 不写 `blocked` / `escalate` / `plan_amend`，只完成普通 `agent_launch → done`，`done.note` 固定为 `outcome=out-of-scope proposal=<方案文件名> reason=<原因>`；当班 monitor 随后写 `stage_result outcome=blocked`。不得回写 decision/strategist 方案文件，不得把账本文件加入或偷滤出计划 actual 集合。

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
2. 以 **before tree 内的 relay_plan marker cards** 做授权判断；不得读改后的 marker 给新卡 task_plan 反向授权。输入方案文件只读，用于 `done.note proposal=` 关联，不属于 proposed 或成功白名单。
3. 全量 proposed 预检必须在任何目标文件写入前完成；任一非法则整组拒绝，不调用写入动作。
4. 预检通过后才一次修改；构造 `after_tree`，并取：

   ```bash
   git -C <repo_root> diff --name-only -z --no-renames <before_tree> <after_tree>
   ```

   输出按 NUL 分隔解码、统一为 repo-relative POSIX 路径、去重排序，得到 `actual`。`--no-renames` 固定 rename 为 delete+add 两个路径，避免相似度启发式改变集合。
5. 成功的唯一集合判据是 `actual == proposed`：actual 多路径表示越界，少路径表示 proposed 中有未真正变化/no-op 的目标；两者都 A122 fail closed。随后再核 HEAD/真实 index 未变，最后运行普通 plan lint。
6. after 守门、普通 lint 或第 3 次修复最终失败时，恢复集合固定为 `actual ∪ proposed`：before tree 有该路径就按 tree entry 恢复 blob、mode 与 symlink 形态，before tree 无该路径就删除本次新建项；恢复只针对这次集合，不用 `checkout HEAD`，因此不会抹掉改前已有 dirty。恢复后以同一算法重建 tree，必须证明相对 before 的 actual 为空；恢复失败即 fail closed 并报告人工接管，不得写成功 `plan_amend`。

临时 tree/blob 只作为 Git 对象证据，不改真实 index；测试与证据要登记 before/after tree id、proposed/actual 的 JSON 或 NUL 安全转写，不登记文件正文或凭据。

#### 4. 必做回归矩阵

- **已有 dirty 不混入**：改前路径 A 已 dirty，proposed 只含 B；before 吸收 A，after 只改 B，断言 actual 恰 `{B}`。
- **同路径二次修改不漏报**：允许路径 A 改前已 dirty（相对 HEAD 为 v1），before tree 固化 v1；planner-amend 再改为 v2，断言 actual 恰 `{A}`，证明不是用“改前 dirty 路径集合相减”。
- **tracked 三态**：对 clean tracked 修改、tracked 删除、原 staged/unstaged dirty 后二次修改分别断言 actual；并断言真实 index tree id 前后相同。
- **untracked 三态**：改前已有 untracked 非忽略文件后再改、运行中新建、运行中删除分别进入 actual；ignored proposed 在预检拒绝。
- **成功精确相等**：proposed 含两个允许路径且两者都产生净变化，断言排序后 `actual == proposed`；再加一个 proposed no-op，断言因 actual 少项而拒绝。
- **越界多项**：proposed 只含允许 A，但写入同时碰 B，断言 actual 多出 B 并拒绝。
- **禁区混合零变化**：proposed 同时含允许目标 A 与 design 禁区 D，预检即拒绝，不调用写入 callback；重新采 after tree，断言 `actual == ∅`，并逐个断言 A、D 与输入方案 P 的 before/after tree blob 及工作树 bytes 均相等。
- **失败恢复不抹旧 dirty**：允许 A 改前已 dirty 为 v1，planner 改 A→v2 并新建 B，after/lint 判失败；按 before tree 恢复后 A 回到 v1 而非 HEAD，B 恢复为不存在，复采 actual 为空，输入方案仍原 bytes。
- **失败账本链**：planner-amend 只接受普通 `agent_launch → done`，done.note 的 `outcome/proposal/reason` 三 token 齐全；其名下 `blocked` / `escalate` 被拒，失败分支无 `plan_amend`，monitor 的 `stage_result` 写 `outcome=blocked` 并关联 proposal。账本验证与计划 actual 集合分开，不能把 `relay_log.jsonl` 当白名单目标。
- **静默/真实 index 破坏**：before 双采样不一致、HEAD 改变或真实 index tree id 改变各一例 fail closed，不把污染后的集合报成成功。

### 改动点

- `relay_log.py`：
  - 按上节临时 Git index/tree 算法实现 before/after 快照；解析 **before tree** 中 `relay_plan.md` marker 的 module/cards；路径全规范化为 repo-relative POSIX 格式，拒绝绝对路径、`..`、repo 外路径。
  - 白名单仅三类：该 plan 的 `relay_plan.md`；同模块 `dev_plan/P<N>-*.md`；改动前 cards 中现有卡的 `workspace/<card>/task_plan.md`。输入方案文件始终只读。
  - `docs/modules/<module>/design/` 前缀和其他路径一律 A122；新加到 marker 的 card 不得反向授权其 task_plan。
  - 预检集合任一非法则整体失败，调用方未写任何文件；改后固定用 `git diff --name-only -z --no-renames <before_tree> <after_tree>` 取得 actual，并要求 `actual == proposed`。after/lint 最终失败时按 before tree 恢复 `actual ∪ proposed` 的 bytes/mode/存在性并复证 actual 为空；普通 `lint --plan` 不启用 git 检查。
  - 为 planner-amend 冻结 out-of-scope 生命周期：其 `blocked` / `escalate` 拒绝；普通 `done.note` 要求 `outcome=out-of-scope proposal=<方案文件名> reason=<非空原因>`。不生成 `plan_amend`；monitor 负责 stage_result blocked。
- `test_relay_log.py`：新增 `RelayPlanAmendGuardTests`，覆盖三类逐项/组合正例、旧 card/new card、design、混合集合全有全无、输入方案零变化、repo 外路径、普通 lint、顶层三命令，以及本节 tracked/untracked/dirty/静默/集合相等完整矩阵；另加生命周期用例锁 planner-amend done.note 与禁写事件、monitor blocked 交接。
- `tools/relay-light/skill/SKILL.md`：补 `planner-amend` 专节/提示词模板，输入恰含方案文件、当前 relay_plan、开发方案、涉及的已有卡 task_plan；先从方案列出完整 proposed paths 并跑预检，命中禁区时任何文件都不改，只以普通 `done.note` 写结构化 out-of-scope 原因后停止，由 monitor 写 blocked stage_result；通过才一次改完，改后跑精确 diff 守门与普通 lint，失败最多修三次，第 3 次仍按同一零文件变化/完成记录路径收尾。明确不写 blocked/escalate、不建新卡七件套。
- 两份 adapter 若只需链接到核心模板则不复制模板；若当前派活入口必须增加引用，两份保持同构并加结构测试。

### RED → GREEN

```bash
python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanAmendGuardTests
python3 -m unittest -v tools.relay-light.test_relay_log.SkillCoreDocTests.test_planner_amend_template_contract
python3 -m unittest -v tools.relay-light.test_relay_log.RelayConfigTests.test_each_subcommand_help_exposes_config_dir
```

- RED：校验模式、planner-amend 禁写事件/done.note 与模板当前缺失；有效 RED 是预期行为断言失败，不接受 argparse 方法名写错、fixture 仓库未初始化或违反既有 A112 前置造成的噪声。
- GREEN：P1-02 矩阵全部通过；成功例 `actual == proposed`；改前 dirty 同路径二次修改仍进入 actual；tracked/untracked 处理符合冻结算法；新卡 task_plan/design/混合集合 A122；design 混合反例 `actual == ∅` 且所有目标及输入方案 blob/bytes 零变化；planner-amend 只有结构化 done、禁写 blocked/escalate/plan_amend，monitor blocked 交接成立；普通 lint 不回归；顶层命令仍三个。

### audit 小审输入

- CLI/help 与 helper 契约、HEAD/真实 index/before 双采样稳定证明、before cards 快照、before/after tree id、所有正反例的 path set/exit/rule。
- tracked/untracked/改前 dirty 同路径二次修改矩阵；design 混合反例的 `actual == ∅` 与计划目标 + 输入方案 blob/bytes 零变化；planner-amend done.note/禁写事件/monitor blocked 账本证据；成功例的 proposed/actual 精确相等证明。
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
