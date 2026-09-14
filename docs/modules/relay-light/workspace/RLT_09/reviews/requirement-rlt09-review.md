<!-- dh:v1 -->
# requirement 复核 — RLT_09

- **复核者**：`rlt09-review2`（自报：Devin 会话，模型 swe-2-max）；路径：**requirement**（heavy 五路之一，与 code-round2 / consistency / lesson 同批并发）；只读复核，未改任何被审代码。
- **候选**：`wt/RLT_09` @ `2f5ea51`（相对 code-round1 候选 `94cb21b` 仅多 review 工件与 progress 信号，被审代码零变化）；基线 master `b6b7d66`。
- **输入清单**：`dispatch/README.md`、`dispatch/review.md`、`brief.md`、`task_plan.md`、`progress.md`（E-B1-01..E-B5-06）、`findings.md`、`decision.1.md`、`check.C1..C5.md`、`review.md`、`reviews/code-round1-rlt09-review.md`、`git diff master..HEAD` 全量、design/01 §4.5 全文 / §11 A119~A123 现文 / §14 第 6 条（RLT-A-07 同步后）、`design/evidence/08`（RLT-A-07 记录）、DevPlan §RLT_09 与 §7.2、`tools/relay-light/skill/SKILL.md` 与两份 adapter、RLT_10 `findings.md` F-003。
- **对照基准声明**：A121/A122 以 RLT-A-07 澄清后的 design/01 现文为 oracle（用户 2026-09-13 点选 ①B/②A/③最小 A-adjust，见 `decision.1.md` 与 `evidence/08`）。本路不重复裁决 A-adjust 内容本身，只核对交付是否满足澄清后口径、A-adjust 是否越出授权范围。

## 逐条对照（oracle 原文 → 交付 → 判定）

### HC-RL-A119 — 命中

> oracle：`agent` 必须是 `monitor#<n>`（`by=monitor`），`note` 必须同时含方案文件名与 `nodes=<节点号,节点号>`；不进状态机，同一 `(node, monitor#<n>)` 可重复出现且不影响 agent 事件配对。判据：coder 写入、缺方案文件名、缺 `nodes=` 三类 exit 2 且 A119；两条合法事件连续接受，前后 agent 配对与 status 投影一致。

- 实现：`_authorize_agent` 对非控制名写 `plan_amend` 报 `HC-RL-A119`；`orchestrator#<n>` 经既有 `_validate_writer`（owner=monitor）报 `HC-RL-A85`——两层均拒绝，oracle 的「必须是 monitor#<n>」成立（错误编号归属既有写入者层，findings B1 注记已留痕）。`_validate_plan_amend_note` 要求方案文件名为独立非 key token + `nodes=` 非空且逗号项逐项非空。`plan_amend` 不在 `AGENT_EVENTS`，`_validate_stage_event` 早退。
- 测试：`test_plan_amend_requires_monitor_and_complete_note_and_is_repeatable` 五反例（coder#1 / 缺文件名 / 缺 nodes= / 空值 / 空列表项）精确断言 A119；同 `(C2, monitor#1)` 连写两条接受；前后 status 投影逐键相等（agents 去 `idle_seconds`、errors 为空），随后 `done`+`node_close` 正常配对。
- 复跑 exit 0（见末表）。

### HC-RL-A120 — 命中（含 RLT_03 五条交接断言逐条闭合）

> oracle：同一 stage 的节点追加在表尾通过、被 superseded 行隔开通过；节点号重复（含已 superseded 的号）、`depends_on` 指向 superseded、跨阶段依赖指向后面的阶段、同卡阶段实例并行仍被拒。

- 实现仅放宽 A129 一处：`stage_runs[:-1]` 必须互异，仅末段可重现既有 stage_id ⇔ 只识别表尾追加形态；superseded 行照旧先滤除。
- 测试：`test_a120_allows_append_and_superseded_separation` 两正例（表尾追加其余规则全合法、superseded 隔开）断言 `lint: ok`；`test_a120_keeps_four_hard_constraints` 四反例逐项断言 exit 2 + 精确编号 A46/A72/A89/A109。
- RLT_03 交接断言（DevPlan 冻结原文）：
  1. 「被 superseded 行隔开」始终通过——superseded-separation 子例现绿；E-B2-01 基线复跑显示该子例在 b6b7d66 下即通过。**闭合**。
  2. 表尾追加按正式版本记录拒绝→通过——E-B2-01 在还原 b6b7d66 语义后 `tail-append` 子例 exit 2 / A129，GREEN 后通过。复核者独立探针：同一表尾追加 fixture 对 master 版 `relay_log.py` 跑 lint 得 `lint: HC-RL-A129 ...` exit 2，对 HEAD 得 `lint: ok` exit 0。**闭合**。
  3. 四项硬约束保持拒绝及有效编号——四反例 exit 2 + 精确编号。**闭合**。
  4. 既有 A46/A72/A75/枚举与依赖回归保持——B2 七用例命令含既有 A46/A72/A75/A129/A89 回归全绿；全量 162 绿（E-B5-04）。**闭合**。
  5. 运行中追加由 RLT_16/RLT_19 实跑证明、交付方式按 §4.5——本卡未冒领实跑：`task_plan.md` B2 与 `findings.md` B2 注记明确记作后续；design §4.5.4「追加节点谁接手」原文保留未动。**闭合**。
- 既有 `C1→R1→C2` 多违规 fixture 收窄为 A89（放宽后真实首触发规则）、`C1→R1→C2→F1` 非表尾隔断仍断言 A129——符合 DevPlan「不承诺原样翻绿，必要时仅变更其实际负责的规则断言」的授权边界。

### HC-RL-A121 — 命中（RLT-A-07 澄清后版本）

> oracle：两次调用之间不修改 `relay_log.py` 代码、不改账本，只修改同一份计划文件，追加新阶段节点行及保持计划合法所必需的对应 agent 行；再次 `status` 输出 `stages` 含该新阶段且顺序正确，下一阶段由计划推导而非固定 `W→C→R→F`。

- 测试 `test_status_rereads_appended_stage_in_plan_order`：非 WCRF fixture `[W#1, C#1, X#1]`；第一次 `status --json` 后只向同一 `relay_plan.md` 追加 `X#2` 节点行 + A75/A24 必需的 agent 行；断言第二次 `stages` 恰多 `DHR_90:X#2`（pending、nodes=[X2]）、顺序等于节点表首次出现序、首 payload 前缀不变；两次之间 `relay_log.py` 与 `relay_log.jsonl` sha256 不变、plan 目录内仅 `relay_plan.md` 变化；A75 空节点追加仍 exit 3。
- `relay_log.py` 零改动属实：B3 commit `75eb1a0` 的 `--stat` 只含测试与 workspace 工件；`_status_command`→`_runtime_plan`→`lint_plan` 每次重读无缓存。
- 澄清边界未外溢：fixture 追加的就是澄清授权的「节点行 + 合法所必需的对应 agent 行」两类，无其它计划文件变化。复跑 exit 0。

### HC-RL-A122 — 命中（RLT-A-07 澄清后版本）

> oracle：三类闭集（本 plan `relay_plan.md` 含 marker `cards=`、同模块 `dev_plan/P<N>-*.md`、改动前 cards 已存在卡的 `workspace/<卡号>/task_plan.md`）；新卡 task_plan 由该卡 W builder 建、改计划实例写它即判失败；`design/` 整目录禁区；禁区命中整份拒绝、全部计划目标与输入方案文件零变化、不做部分执行；planner-amend 不写 `blocked`/`escalate`/`plan_amend`，以普通 `done.note` 写 `outcome=out-of-scope proposal=<方案文件名> reason=<原因>`，monitor 写 `stage_result outcome=blocked`。

- 形态：现有 `lint` 子命令下 `--amend-check before|after` 下属模式；`main` 顶层仍恰 `add/status/lint`（伪 `amend` → exit 2；`test_help_lists_exactly_the_three_frozen_subcommands` 保持），不与 A135 冲突。
- 三类闭集精确：`_check_amend_allowlist` 以 `rel == plan_file` 精确等值限定本 plan 的 `relay_plan.md`（同目录其它文件、跨模块路径均拒）、`dev_plan/P<N>-*.md` fullmatch、before 快照 marker `cards=` 已存在卡的 task_plan；`_AMEND_DESIGN_RE` 前缀禁区先行拒绝，兜底「不在三类即拒」。`test_allowlist_classes_and_precheck_rejections` 逐项覆盖：三类正例通过；design / 新卡 task_plan / 跨模块 dev_plan / 绝对路径 / `..` 穿越 / 重复项 / 目录与 tracked 祖先 / git-ignored 各反例 exit 2 + A122。
- 禁区混合零变化：`test_mixed_forbidden_proposal_leaves_targets_and_proposal_unchanged` 对 proposed={relay_plan, design/01} 预检即拒，逐路径断言 relay_plan、design、task_plan 与输入方案文件 `decision.1.md` 的 `(kind, sha256, mode, symlink_target)` 原始状态前后全等、object database 全等——「计划目标与输入方案文件零变化、不做部分执行」按澄清后口径取证。
- 成功判据：`test_success_requires_actual_equal_proposed` 证明 `actual == proposed` 为唯一收口——no-op 少项拒、越界多项拒并恢复。
- 账本链：`test_planner_amend_out_of_scope_lifecycle_contract` 断言 planner-amend 只走 `agent_launch → done`；`done.note` 带 `outcome=` 即须为完整 `out-of-scope proposal=<文件名> reason=<非空>` 形态（`proposal` 含路径分隔符亦拒）；其名下 `blocked`/`escalate` → A122、`plan_amend` → A119；monitor 续写 `stage_result outcome=blocked` 成立且账本中无 planner-amend 的禁写事件。
- SKILL.md「planner-amend 改计划模板」含 oracle 要件：输入恰四件、方案文件只读、三类闭集 + design 禁区、预检不过零文件变化 + 结构化 done.note + monitor blocked、一次改完、`after` 精确 diff 守门、最多修三次、不建新卡七件套；两 adapter 只留同构指针（`test_planner_amend_template_contract`、`test_planner_amend_reference_isomorphic` 均绿）。
- 复跑：`RelayPlanAmendGuardTests` 10 例 + 生命周期/模板/adapter 用例全部 exit 0。

### HC-RL-A123 — 命中

> oracle：本阶段有 `plan_amend` 时 `note` 必须含 `amend=<方案文件名>` 与 `nodes=<节点号,节点号>`，缺则退出 2；无 `plan_amend` 时不得出现 `amend=`。

- 实现：`_validate_stage_event` 的 `stage_result` 分支按 `stage_id` 只取本实例 `plan_amend` 历史；有 amend 缺 `amend=`/`nodes=`（含空值/空项）→ A123；无 amend 出现 `amend=` → A123；未发明「无 amend 禁 nodes=」的额外条件。
- 测试五组：W#1 有 amend 时缺 `amend=`、缺 `nodes=` 各拒；合法摘要通过；C#1 无 amend 带 `amend=` 被拒且普通 stage_result 通过——W#1 的 plan_amend 不串入 C#1，跨阶段隔离按 oracle「只看同阶段事实」验证。复跑 exit 0。

### F-003（RLT_10 并入项）— 命中

> 并入口径：程序入口根治；测试子进程显式设 `PYTHONIOENCODING=ascii` 与 `cp1252`（各至少一条 status/lint 中文输出路径）；RED 必须是 `UnicodeEncodeError`/非零退出而非 fixture 错；入口 reconfigure utf-8 或等价防护后按合同 exit、bytes 可 UTF-8 解码且含预期中文；不依赖薄壳 `PYTHONUTF8`。

- 实现：`_configure_utf8_stdio()` 为 `main()` 首行，先于参数解析与一切输出，stdout/stderr 同时就地 `reconfigure(encoding="utf-8")`；无 `reconfigure`/已关闭/替身流跳过，不关闭不替换外部流、不读任何环境变量。
- 测试：`RelayCliEncodingTests` 以 env 白名单剔除 `PYTHONUTF8`/`PYTHONIOENCODING` 后单独注入 ascii/cp1252，bytes 捕获四路中文输出（status 文本、`status --json`、lint stderr、`lint --json`）× 两编码共八腿，显式 UTF-8 解码并断言含 `卡X`；fixture 先在 utf-8 环境 sanity 全绿。RED 证据 E-B5-01：八腿均 `UnicodeEncodeError: 'charmap'`（exit 1 traceback）——正是 F-003 原始故障形态。
- 并入授权链：F-003 原文限定 RLT_10「不得改程序侧」；dispatch README 与 brief 记录用户 2026-09-13 裁决并入本卡并授权程序入口根治；`tools/tests/**` 薄壳零 diff，「只做程序入口防护 + Python 单测」边界保持。复跑 3 例 exit 0。

## 非目标核对 — 未越

| 非目标（DevPlan §RLT_09 / brief §边界） | 核对结果 |
|---|---|
| 不原地复用节点号 | 未引入复用机制；A46 对含 superseded 的重复号仍 exit 2（复跑确认）；superseded 行机制为 RLT_03 存量，非本卡新增 |
| 不允许 planner-amend 改 `design/` | 运行时守门 `_AMEND_DESIGN_RE` 前缀整目录拒绝；本卡 diff 中 design/01 属 RLT-A-07 A-adjust 授权（另一层，见下） |
| 不把白名单内部分先落笔 / 不做部分执行 | 全量预检先于任何写入；混合禁区例证 `actual == ∅` 且全部目标与方案文件原始状态零变化 |
| 不借此改变正式验收 ID | master↔HEAD 的 `HC-RL-A/H` 真实 ID 集合逐一比对完全相同；唯一差异是 §9.4 示例行里的占位符 `HC-RL-A???`（无数字、非 ID）随授权重写消失 |
| 不放宽 A46/A72/A89/A109；不新增第四个顶层子命令 | 四硬约束反例逐项 exit 2 + 精确编号；伪 `amend` 顶层命令 exit 2 |
| F-003 不改现有 PowerShell 薄壳缓解 | `tools/tests/**` 零 diff |
| 范围外新想法只登记不施工 | findings 仅 F-001 闭合链 + B1..B5 注记，无越权改动 |

## 允许路径闭集 — 成立

`git diff master --name-only` 全量 30 文件逐项归类：

- `tools/relay-light/relay_log.py`、`test_relay_log.py`、`skill/SKILL.md`、`skill/references/adapter-{claude-code,codex}.md` —— 基线闭集内。
- `docs/modules/relay-light/workspace/RLT_09/**` 22 份工件 —— 闭集内。
- `docs/modules/relay-light/design/01-*.md`、`design/evidence/08-*.md`、`dev_plan/P1-*.md` —— **RLT-A-07 授权项**（`decision.1` ③ + `evidence/08` 声明 + DevPlan allowed-paths 括注）。三处改动全部落在单一 commit `bdd6cc2`，内容逐项对应 `evidence/08` 修改前后对照表（§4.5.2 两处、§9.4、§11 A121/A122 行、§14-6、DevPlan §RLT_09 卡及 §7.2 同一条 A122 取证句的机械同步），无授权外句子。
- 排除项确认：`install_skill.py`、`tools/tests/**`、其它 workspace、其它 design/dev_plan 文件均零 diff；无 push、无 master/其它 worktree 触碰。
- 工作树唯一 untracked 为 `tools/relay-light/__pycache__/`（测试副产品，收尾删除，不入提交）。

## 复跑记录（复核者自跑，wt/RLT_09 @ 2f5ea51）

| 验收 | 命令 | exit | 结果 |
|---|---|---|---|
| A119 | `python3 -m unittest -v …test_plan_amend_requires_monitor_and_complete_note_and_is_repeatable` | 0 | 1 test OK |
| A123 | `…test_stage_result_amend_summary_matches_stage_history` | 0 | 1 test OK |
| A120 | `…test_a120_allows_append_and_superseded_separation …test_a120_keeps_four_hard_constraints` | 0 | 2 tests OK |
| A121 | `…test_status_rereads_appended_stage_in_plan_order` | 0 | 1 test OK |
| A122 | `…RelayPlanAmendGuardTests` | 0 | 10 tests OK |
| A122 | `…test_planner_amend_template_contract …test_planner_amend_out_of_scope_lifecycle_contract …test_planner_amend_reference_isomorphic` | 0 | 3 tests OK |
| F-003 | `…RelayCliEncodingTests` | 0 | 3 tests OK |
| A120 交接②探针 | 同一表尾追加 plan：master 版 `relay_log.py lint` → `HC-RL-A129` exit 2；HEAD → `lint: ok` exit 0 | 2/0 | 正式版本拒绝→通过独立复现 |
| 验收 ID 集合 | master 与 HEAD 的 design/01 全文 `HC-RL-A/H[0-9]+` 集合 diff | — | 完全相同（仅占位符 `HC-RL-A???` 随授权示例重写消失） |

## 发现（按级别）

- **P0**：无。
- **P1**：无。
- **P2**：无。
- **P3-1**（覆盖度观察，非缺口）：A122 反例矩阵无显式「同模块不同 `plan_id` 的 `relay_plan.md`」用例；`rel == plan_file` 精确等值使该情形与其它路径共用同一拒绝分支，且同目录非 plan 文件（`extra.md`）反例在案。记录供后续卡参考。
- **P3-2**（核对方法留痕）：design/01 的 ID 集合比对中，master 侧独有匹配是示例占位符 `HC-RL-A???`（正则 `HC-RL-[AH][0-9]*` 的零数字匹配），属 RLT-A-07 授权的 §9.4 示例重写范围；真实验收 ID 集合未增、未删、未改号。

## 结论

**APPROVE** —— 五条 HC（A121/A122 按 RLT-A-07 澄清后口径）与 F-003 并入口径逐条命中，RLT_03 五条交接断言逐条闭合并留正式版本前后证据；四项非目标未越；允许路径闭集成立，design/01、evidence/08、dev_plan 三处 diff 均在 RLT-A-07 授权范围内且验收 ID 集合不变；RLT_16/RLT_19 实跑未被本卡冒领。两条 P3 为信息性记录，不要求整改。本结论只写事实与级别，不代替验收、verify、人验或远端动作。
