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
- **P1-02：CLOSED by W4。** W2 的临时 Git index/tree 方案作废；B4 改用仓外运行现场的原始工作树快照、只读 Git 清单与业务仓 object database 零变化证明，覆盖 tracked、untracked、clean/EOL filter 和改前 dirty 同路径二次修改。
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

采用现有 `lint` 的 planner-amend 校验模式（新增 lint 下属 flags/内部 helper），**不新增顶层子命令**，故 A135 的命令集仍为 `add/status/lint`。W4 将两阶段接口冻结为：

```text
relay_log.py lint --plan <plan_dir> --amend-check before --repo <repo> --snapshot-dir <仓外运行现场绝对目录> --proposed-path <path> [--proposed-path <path> ...]
relay_log.py lint --plan <plan_dir> --amend-check after  --repo <repo> --snapshot-dir <同一仓外运行现场绝对目录>
```

`before` 完成 proposed 全量预检、双采样稳定检查，在业务仓及其 `.git` 之外新建权限 0700 的 snapshot-dir，并保存原始工作树副本与仅供本次运行使用的 manifest；目录已存在、位于 repo/`.git` 内或权限无法收紧均拒绝。成功后才准动笔。`after` 读取同一运行现场快照、复核 repo 身份/HEAD/真实 index/object database，按原始状态比较 actual。上述 flag 名、阶段值和快照目录布局是 P1-02 冻结接口，不再留给 exec 改名；snapshot-dir 不是 durable evidence，完成或验证恢复后安全删除，普通 lint 合同不变。

**decision.1 ①B 已生效**：三类闭集不增加第四类。禁区或其它 proposed 非法时，`before` 预检在任何目标写入前整份拒绝；全部计划目标文件和输入方案文件均保持零变化。planner-amend 不写 `blocked` / `escalate` / `plan_amend`，只完成普通 `agent_launch → done`，`done.note` 固定为 `outcome=out-of-scope proposal=<方案文件名> reason=<原因>`；当班 monitor 随后写 `stage_result outcome=blocked`。不得回写 decision/strategist 方案文件，不得把账本文件加入或偷滤出计划 actual 集合。

### P1-02 冻结：改前快照、洁净前提与改后取集

本节是 B4 实现和测试的固定算法；不得退回 `git diff <长期 tree-ish>`，也不得用改前 `git status` 的路径集合做减法，因为两者都会漏掉“原本 dirty 的同一路径再次变化”。

#### 1. 洁净前提不是“全仓必须 clean”

- 允许入场前存在 tracked dirty、staged 状态和 untracked 非忽略文件；它们必须被 before 快照原样吸收，不能混入本次 actual。ignored 文件与空目录不属于合同观察面，proposed 指向它们时预检拒绝。
- 守门窗口必须是单写者静默区：从 before 双采样开始到 after 采样结束，除当前 planner-amend 外无其他进程写业务仓。若 HEAD、真实 index、状态清单或 object database 发生外部变化，一律 A122 fail closed。
- `snapshot-dir` 必须由调用方指向 relay 运行现场中的新随机目录，且位于 `repo_root`、worktree git-dir、common git-dir 及 object directory 之外；helper 以 0700 创建，文件以 0600 创建，拒绝 symlink 父链和已有目录。原始副本只留在该目录，不进入 Git、workspace、progress 或 audit evidence。
- 所有 Git 只读子进程固定设置 `GIT_OPTIONAL_LOCKS=0`，只允许调用：`git rev-parse --show-toplevel/HEAD/--git-path index/--git-path objects/--git-common-dir`、`git status --porcelain=v2 -z --untracked-files=all --ignored=no`、`git ls-files -z --cached`、`git ls-files -z --others --exclude-standard`、`git check-ignore --no-index -z --stdin`、`git count-objects -v`；明确禁止 `git add`、`read-tree`、`write-tree`、`hash-object`、`update-index`、`checkout-index`、`commit-tree` 以及任何可能写 index/object 的命令。
- 真实 index 的存在性、原始 bytes SHA-256 与 permission mode 直接从 `git rev-parse --git-path index` 指向的文件读取，禁止用 `git write-tree` 代替；before/after 必须相同。
- `_object_database_fingerprint()` 在 before/after 递归读取实际 object directory 的相对项名、lstat 类型、size、mtime_ns 与文件 SHA-256，并同时记录 `git count-objects -v` 的只读结果；两次完整指纹必须相等。生产 durable evidence 只写 `object_database_unchanged=true` 与聚合计数，不写对象名、业务路径、内容哈希或正文。
- before 连续构造两份独立内存 manifest；两次 HEAD、index 指纹、porcelain-v2 原始 bytes、tracked/untracked 集合、逐路径原始状态与 object database 指纹必须全等才允许动笔。不一致说明现场未静默，拒绝且不产生业务文件写入。

#### 2. before / after 原始工作树快照（tracked + untracked）

固定 helper/数据合同如下，exec 不得改回 Git tree/blob：

```text
_read_git_path_sets(repo_root) -> (tracked, untracked, porcelain_v2_bytes)
_snapshot_raw_path(repo_root, relpath, raw_dir) -> RawPathState
_snapshot_worktree(repo_root, snapshot_dir, phase) -> WorktreeSnapshot
_diff_worktree_snapshots(before, after) -> tuple[str, ...]
_restore_worktree_snapshot(before, relpaths) -> None
_object_database_fingerprint(repo_root) -> ObjectDbFingerprint
_validate_amend_before(...) / _validate_amend_after(...)
```

- `_read_git_path_sets` 以 NUL 协议解析 `ls-files --cached` 和 `ls-files --others --exclude-standard`；观察集合为两者并集。tracked 中工作树已删除的路径仍采为 `absent`，after 新出现的非忽略 untracked 路径通过 after 集合进入并集比较。路径统一为 repo-relative POSIX，拒绝 NUL、绝对路径、`.`/`..`、repo 外解析、submodule 内部路径、目录和特殊文件。
- `_snapshot_raw_path` 使用 `lstat` 且绝不经 Git clean/smudge/EOL filter：regular 记录 `kind=regular`、permission mode、size、原始 bytes SHA-256，并把原始 bytes 复制到 `raw/<opaque-id>`；symlink 记录 `kind=symlink`、lstat mode/type 与 `os.readlink()` 的原始 target，并保存 target 到受限副本；不存在记录 `kind=absent`。采样前后再次 `lstat`，元数据变化则拒绝，避免边读边写。
- snapshot manifest 只在 0700 运行现场目录内保存，opaque-id 不暴露业务路径。敏感 untracked 的正文、路径、target 与内容哈希不得复制到 durable evidence；测试日志/异常也只报告计数和合成 fixture 标签，不回显真实值。
- before 的稳定双采样使用不同临时子目录；全等后保留第一份作为恢复源并删除第二份。after 复用同一算法写入单独子目录。比较集合取 before/after tracked 与 untracked 的并集，逐路径比较 `(kind, raw_sha256, permission_mode, symlink_target)`；任何元组不同即进入 actual。
- 这种直接工作树采样保证：clean/EOL filter 不改变快照；改前 tracked dirty 或已有 untracked 在同路径再次修改仍以 v1→v2 的原始状态差进入 actual；新增与删除分别是 `absent↔present`。不承诺目录、ignored 文件、submodule 内部或特殊文件，proposed 指向它们必须在 before 拒绝。

#### 3. proposed 与 actual 的精确算法

1. 从方案抽取完整 proposed 列表，先转成 repo-relative POSIX 路径；拒绝绝对路径、空路径、`.`/`..` 穿越、NUL、repo 外路径、重复项和 Git ignored 路径。
2. 从 before 原始副本读取 relay_plan marker cards 做授权判断；不得读改后的 marker 给新卡 task_plan 反向授权。输入方案文件只读，用于 `done.note proposal=` 关联，不属于 proposed 或成功白名单。
3. 全量 proposed 预检必须在任何目标文件写入前完成；任一非法则整组拒绝，不调用写入动作。
4. 预检通过后才一次修改；`_snapshot_worktree(..., phase="after")` 复采。`_diff_worktree_snapshots` 对 before/after 路径并集逐元组比较，按 repo-relative POSIX 路径去重排序得到 `actual`；rename 自然表现为旧路径删除 + 新路径新增，不使用相似度启发式。
5. 成功的唯一集合判据是 `actual == proposed`：actual 多路径表示越界，少路径表示 proposed 中有未真正变化/no-op 的目标；两者都 A122 fail closed。随后再核 HEAD、真实 index 原始状态与 object database 完整指纹未变，最后运行普通 plan lint。
6. after 守门、普通 lint 或第 3 次修复最终失败时，恢复集合固定为 `actual ∪ proposed`。before 为 regular 时，先拒绝父链 symlink，在同一父目录以 `O_CREAT|O_EXCL|O_NOFOLLOW` 建 0600 临时文件，逐字节写入受限 raw 副本、`fsync`、`fchmod` 为原 permission mode 后 `os.replace`；before 为 symlink 时不跟随链接，只 unlink 当前 regular/symlink 并以 `os.symlink` 重建同一 target；before 为 absent 时只允许删除本次新建的 regular/symlink。恢复前若目标已成目录、特殊文件或越出 repo，立即 fail closed，不做递归删除。symlink 的 mode 合同是 `lstat` 文件类型 + 原始 target（平台不支持独立修改 symlink permission bits，守门器也不声称可恢复它）。
7. 恢复后重新采样并要求受影响集合的 `(kind, raw bytes hash, permission mode, symlink target)` 与 before 全等、全仓 actual 为空，且 HEAD/index/object database 仍全等；否则保留受限 snapshot-dir 供人工接管，只报告不含正文/真实敏感路径的 runtime handle，不得写成功 `plan_amend`。成功或验证恢复后才删除 snapshot-dir。

生产 evidence 只登记命令、exit、规则号、`actual == proposed`/`actual == ∅` 布尔结论、合成用例名和 object database 聚合不变结论；不得登记业务文件正文、真实 untracked 路径、symlink target、逐文件哈希或对象名。

#### 4. 必做回归矩阵

- **已有 dirty 不混入**：改前路径 A 已 dirty，proposed 只含 B；before 吸收 A，after 只改 B，断言 actual 恰 `{B}`。
- **同路径二次修改不漏报**：允许路径 A 改前已 dirty（相对 HEAD 为 v1），before raw snapshot 固化 v1；planner-amend 再改为 v2，断言 actual 恰 `{A}`，证明不是用“改前 dirty 路径集合相减”。
- **tracked 三态**：对 clean tracked 修改、tracked 删除、原 staged/unstaged dirty 后二次修改分别断言 actual；并断言真实 index 原始 bytes/mode 前后相同。
- **untracked 三态**：改前已有 untracked 非忽略文件后再改、运行中新建、运行中删除分别进入 actual；ignored proposed 在预检拒绝。
- **object database 零新增**：分别以递归 objects 目录指纹和 `git count-objects -v` 采 before/after；运行 before、成功 after、失败恢复三条路径均要求完全相等。fixture 含未忽略 untracked，证明守门过程中没有 `git add/hash-object/write-tree` 产生 loose/pack 对象。

  ```bash
  GIT_OPTIONAL_LOCKS=0 git -C <repo_root> count-objects -v
  python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanAmendGuardTests.test_snapshot_diff_captures_tracked_untracked_and_dirty_same_path_without_git_objects
  ```
- **clean/EOL filter 原样恢复**：fixture 为 tracked 路径配置会改写内容的 clean filter 与 EOL 规则，改前工作树另有 dirty 原始 bytes/mode；planner 再改并触发 after 失败，恢复后以直接文件读取/lstat 断言逐字节和 mode 相等，不用 `git show/checkout` 作 oracle。另含 symlink target 恢复断言。
- **敏感 untracked 不落对象/证据**：未忽略 untracked 写入唯一 canary 内容与敏感式文件名；完成 before/after/恢复后搜索业务仓 objects 与 durable evidence，均不得出现 canary bytes、文件名或其逐文件哈希；运行现场副本权限为 0700/0600，成功清理后不存在。
- **成功精确相等**：proposed 含两个允许路径且两者都产生净变化，断言排序后 `actual == proposed`；再加一个 proposed no-op，断言因 actual 少项而拒绝。
- **越界多项**：proposed 只含允许 A，但写入同时碰 B，断言 actual 多出 B 并拒绝。
- **禁区混合零变化**：proposed 同时含允许目标 A 与 design 禁区 D，预检即拒绝，不调用写入 callback；复采断言 `actual == ∅`，并逐个断言 A、D 与输入方案 P 的原始 bytes/mode/symlink 状态均相等，object database 也相等。
- **失败恢复不抹旧 dirty**：允许 A 改前已 dirty 为 v1，planner 改 A→v2 并新建 B，after/lint 判失败；从仓外 raw 副本恢复后 A 回到原始 v1/mode 而非 HEAD，B 恢复为不存在，复采 actual 为空，输入方案仍原状态。
- **失败账本链**：planner-amend 只接受普通 `agent_launch → done`，done.note 的 `outcome/proposal/reason` 三 token 齐全；其名下 `blocked` / `escalate` 被拒，失败分支无 `plan_amend`，monitor 的 `stage_result` 写 `outcome=blocked` 并关联 proposal。账本验证与计划 actual 集合分开，不能把 `relay_log.jsonl` 当白名单目标。
- **静默/真实 index/object 破坏**：before 双采样不一致、HEAD 改变、真实 index bytes 改变或 object database 指纹改变各一例 fail closed，不把污染后的集合报成成功。

### 改动点

- `relay_log.py`：
  - 按上节 `_read_git_path_sets`、`_snapshot_raw_path`、`_snapshot_worktree`、`_diff_worktree_snapshots`、`_restore_worktree_snapshot`、`_object_database_fingerprint`、`_validate_amend_before/_after` 固定函数实现；解析 before 原始副本中 `relay_plan.md` marker 的 module/cards；路径全规范化为 repo-relative POSIX，拒绝绝对路径、`..`、repo 外路径。
  - snapshot-dir 必须位于业务仓和全部 Git 元数据目录之外，权限固定 0700/0600；Git 调用只读，禁止任何 index/object 写命令。守门前后要求 HEAD、真实 index 原始 bytes/mode、object database 完整指纹不变。
  - 白名单仅三类：该 plan 的 `relay_plan.md`；同模块 `dev_plan/P<N>-*.md`；改动前 cards 中现有卡的 `workspace/<card>/task_plan.md`。输入方案文件始终只读。
  - `docs/modules/<module>/design/` 前缀和其他路径一律 A122；新加到 marker 的 card 不得反向授权其 task_plan。
  - 预检集合任一非法则整体失败，调用方未写任何文件；改后按 before/after 原始状态元组取得 actual，并要求 `actual == proposed`。after/lint 最终失败时从仓外 raw 副本恢复 `actual ∪ proposed` 的原始 bytes/mode/symlink/存在性并复证 actual 为空；普通 `lint --plan` 不启用 Git 工作树检查。
  - 为 planner-amend 冻结 out-of-scope 生命周期：其 `blocked` / `escalate` 拒绝；普通 `done.note` 要求 `outcome=out-of-scope proposal=<方案文件名> reason=<非空原因>`。不生成 `plan_amend`；monitor 负责 stage_result blocked。
- `test_relay_log.py`：新增 `RelayPlanAmendGuardTests`，至少落下并逐项可运行：
  - `test_snapshot_diff_captures_tracked_untracked_and_dirty_same_path_without_git_objects`
  - `test_failed_amend_restores_raw_bytes_mode_and_symlink_across_clean_eol_filter`
  - `test_sensitive_untracked_stays_out_of_object_database_and_durable_evidence`
  - `test_success_requires_actual_equal_proposed`
  - `test_mixed_forbidden_proposal_leaves_targets_and_proposal_unchanged`
  - 另覆盖三类逐项/组合正例、旧 card/new card、repo 外路径、普通 lint、顶层三命令、静默破坏和 planner-amend done.note/禁写事件/monitor blocked 交接。
- `tools/relay-light/skill/SKILL.md`：补 `planner-amend` 专节/提示词模板，输入恰含方案文件、当前 relay_plan、开发方案、涉及的已有卡 task_plan；先从方案列出完整 proposed paths 并跑预检，命中禁区时任何文件都不改，只以普通 `done.note` 写结构化 out-of-scope 原因后停止，由 monitor 写 blocked stage_result；通过才一次改完，改后跑精确 diff 守门与普通 lint，失败最多修三次，第 3 次仍按同一零文件变化/完成记录路径收尾。明确不写 blocked/escalate、不建新卡七件套。
- 两份 adapter 若只需链接到核心模板则不复制模板；若当前派活入口必须增加引用，两份保持同构并加结构测试。

### RED → GREEN

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayPlanAmendGuardTests.test_snapshot_diff_captures_tracked_untracked_and_dirty_same_path_without_git_objects \
  tools.relay-light.test_relay_log.RelayPlanAmendGuardTests.test_failed_amend_restores_raw_bytes_mode_and_symlink_across_clean_eol_filter \
  tools.relay-light.test_relay_log.RelayPlanAmendGuardTests.test_sensitive_untracked_stays_out_of_object_database_and_durable_evidence \
  tools.relay-light.test_relay_log.RelayPlanAmendGuardTests.test_success_requires_actual_equal_proposed \
  tools.relay-light.test_relay_log.RelayPlanAmendGuardTests.test_mixed_forbidden_proposal_leaves_targets_and_proposal_unchanged
python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanAmendGuardTests
python3 -m unittest -v tools.relay-light.test_relay_log.SkillCoreDocTests.test_planner_amend_template_contract
python3 -m unittest -v tools.relay-light.test_relay_log.RelayConfigTests.test_each_subcommand_help_exposes_config_dir
```

- RED 准备：先只接通冻结的 flags/helper 名与受控 `A122 snapshot-not-implemented` 结果，再加入上述行为测试；不得让测试因未知参数、缺函数、TypeError、fixture 未初始化或 A112 前置失败。RED 必须是目标行为断言失败，例如受控 not-implemented 导致预期 success/restore 不成立，或对象库/原始状态不变断言失败。
- RED 判据：五个点名用例至少分别咬住 object database 零变化、filter 下逐字节/mode/symlink 恢复、敏感 untracked 不进 objects/evidence、`actual == proposed`、禁区混合零变化；记录 before/after `git count-objects -v` 与递归 objects 指纹的合成 fixture 摘要。任何 canary 正文出现在输出即测试失败且证据不得持久化该输出。
- GREEN：P1-02 矩阵全部通过；成功例 `actual == proposed`；改前 dirty 同路径二次修改仍进入 actual；tracked/untracked 处理符合原始快照算法；before/after/恢复均 object database 零新增零变化；clean/EOL filter 下恢复原始 bytes/mode/symlink；敏感 untracked 不进入对象库或 durable evidence；新卡 task_plan/design/混合集合 A122；design 混合反例 `actual == ∅` 且所有目标及输入方案原始状态零变化；planner-amend 只有结构化 done、禁写 blocked/escalate/plan_amend，monitor blocked 交接成立；普通 lint 不回归；顶层命令仍三个。

### audit 小审输入

- CLI/help 与上述八个 helper 契约、HEAD/真实 index/before 双采样稳定证明、before cards 快照、snapshot-dir 边界与权限、所有正反例的合成 path set/exit/rule。
- tracked/untracked/改前 dirty 同路径二次修改矩阵；object database 递归指纹与 `git count-objects -v` 前后相等；clean/EOL filter 恢复逐字节/mode/symlink 相等；敏感 untracked 未进入 objects/evidence 的 canary 扫描布尔结论（不附 canary）；design 混合反例的 `actual == ∅` 与计划目标 + 输入方案原始状态零变化；planner-amend done.note/禁写事件/monitor blocked 账本证据；成功例的 proposed/actual 精确相等证明。
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
