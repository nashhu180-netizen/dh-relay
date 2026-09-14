<!-- dh:v1 -->
# consistency 复核 — RLT_09

- **复核者**：`rlt09-review3`（自报：Devin 会话，模型 swe-2-max）；路径：**consistency**（heavy Recipe 五路之一，与 code-round2 / requirement / lesson 同批并发）；只读复核，未改任何被审对象。
- **候选**：`wt/RLT_09` @ `2f5ea51`（含收口 `c1dafff` 与 code-round1 报告落账）；基线 master `b6b7d66`。
- **输入清单**：`dispatch/README.md`、`dispatch/review.md`、`brief.md`、`task_plan.md`、`progress.md`（E-B1-01..E-B5-06）、`findings.md`、`decision.1.md`、`check.C1..C5.md`、`review.plan.md`、`lesson_candidates.md`、`execution_strategy.md`、`git diff master..HEAD` 全量、design/01 §3.4/§3.5/§4.3/§4.4/§4.5/§5.2.1/§9.4/§11 A119~A123/A59/A62/A85/A99/A120 注记/A135/§13/§14-6（RLT-A-07 同步后）、`design/evidence/08`、DevPlan §RLT_03/§RLT_09/§7.2、`tools/relay-light/relay_log.py`、`test_relay_log.py`、`tools/relay-light/skill/SKILL.md` 与两份 adapter、RLT_03 workspace 交接史（F-003/E-070~E-072）、RLT_10 `findings.md` F-003。
- **授权边界声明**：`design/01`、`design/evidence/08`、`dev_plan/P1` 三处 diff 属用户授权的 RLT-A-07 最小 A-adjust（`decision.1` ③，2026-09-13）。本路只核同步后文本的内外一致性与施工落账是否忠实于冻结合同，不重新裁决 RLT-A-07 内容本身。

## 一、五面措辞与合同对照（行为 ↔ SKILL ↔ adapter ↔ design ↔ DevPlan ↔ brief/task_plan）

### 1. `plan_amend` 账本合同（A119）—— 一致

- design §3.4 控制事件表（`plan_amend`｜监工｜`note` 写方案文件名 + 新节点号列表，形如 `decision.2.md nodes=C3,C4`，任意位置不限次、不进状态机）与 §3.5 add 校验（`agent` 必须 `monitor#<n>`、`by=monitor`、note 同含文件名与 `nodes=`）逐字对应 §11 A119 行；DevPlan §RLT_09、brief §A119 逐字承接。
- 实现：`plan_amend ∈ CONTROL_EVENTS`（relay_log.py:30-42）且 `∉ AGENT_EVENTS`；`CONTROL_WRITERS["plan_amend"]="monitor"`（:83）；`_validate_plan_amend_note` 要求独立非 key token（方案文件名）+ `nodes=` 非空逐项（:1703-1709）；`_validate_stage_event` 对其早退（:1953），不入状态机、无阶段时序约束——与"任意位置"措辞一致。
- SKILL.md:157 事件表行（监工、note 必含方案文件名与 `nodes=<新节点号,…>`）与表标题"控制事件…不进状态机"覆盖同一合同；写法为摘要式但与 oracle 无冲突。
- 写者分层：非控制名（coder 等）写 `plan_amend` → A119；`orchestrator#<n>` 写 → 经 `_validate_writer` 报 A85（:1888-1893）。findings B1 注记与 DevPlan/brief"coder 写入被拒"判据同口径，无措辞矛盾。

### 2. `stage_result` 改动摘要（A123）—— 一致

- design §3.4 `stage_result` 行、§4.5.4"带改动摘要"、§5.2.1 摘要段（:646-649 示例 `amend=decision.2.md nodes=C3,C4`）、§9.4 示例（:1007）、§11 A123 行互相同构；§3.5 `stages[].result` 的 `amend`/`nodes` 字段（:394-395）与 `parse_stage_result_note`（relay_log.py:2206-2210）、status 投影（:2399-2402）对应。
- 实现 `_validate_stage_event`（:1977-1998）：同阶段实例有 `plan_amend` → 缺 `amend=` 或缺/空 `nodes=` 均 A123；无 → 出现 `amend=` 键即 A123。只看同阶段事实（`_stage_entries` 按 `stage_id` 过滤）。
- SKILL.md:154 `stage_result` 行含"本阶段发生过 `plan_amend` 时另补 `amend=<方案文件名>` 与 `nodes=`"，并给出操作性理由（裸文件名丢 `result.amend` 信号）。SKILL 与 §4.5.4/§5.2.1 一样只复述正向；A123 的反向禁条（无 `plan_amend` 禁 `amend=`）只在验收行——属同一口径分层，不构成漂移。
- 阶段归属语义：`plan_amend` 不在 `STAGE_NOTE_EVENTS`，其阶段由 `node` 字段推导（`_stage_of`，:2214-2226）。见 P3-3。

### 3. A120 连续性放宽 —— 一致

- design §4.3"按 stage 分组判定…追加行落在表尾也通过"+ 阶段性交付注记（:517-519）、§3.5 映射表 A129 行与注记（:427,:434）、§4.5.4"lint 放宽"行（:607）、§11 A120 行、DevPlan §RLT_09、brief §A120、task_plan B2——全部同一口径：只放宽"同一 stage 的节点追加在表尾"；节点号唯一（含 superseded）、`depends_on` 不指 superseded、跨阶段依赖只指前阶段、同卡阶段实例串行四项不变；superseded 行先滤除。
- 实现 `stage_runs[:-1]` 唯一性判定（:546-554）精确等价"仅末段可重现既有 stage_id"；`active_nodes` 过滤 superseded 行沿用既有路径；stage 枚举（:539-540 A129）、A46/A72/A89/A109 均未动。
- "被 superseded 行隔开通过"正例（test:484-500）与表尾追加正例（test:461-480）与 oracle 两正例逐项对应；四反例各锁 A46/A72/A89/A109（test:502-562）。

### 4. A121 status 重读 —— 一致（RLT-A-07 后）

- design §11 A121（:1172）现行文本"两次调用之间不修改 relay_log.py 代码、不改账本，只修改同一份计划文件，追加新阶段节点行及保持计划合法所必需的对应 agent 行"与 DevPlan:310、brief:58-66、task_plan B3、decision.1 ②A 完全同构；§4.5.4"编排不缓存计划"（:603）语义一致。
- `relay_log.py` 对该合同零改动：`_status_command`→`_runtime_plan`→`lint_plan` 每次重读（:1500-1506, :2735+）；测试 `test_status_rereads_appended_stage_in_plan_order`（:2606）冻结代码/账本 sha256 与 plan 目录文件集，断言非 WCRF 顺序。
- DevPlan §RLT_03 与 RLT_03 workspace 的历史措辞（"本卡只交付严格基础 lint，表尾放宽归 RLT_09/A120"）与现状无冲突——RLT_03 承诺的"临时拒绝不代表终态禁止"由本卡兑现，无文本矛盾残留。

### 5. A122 白名单守门 + planner-amend 生命周期 —— 基本一致，一处 DevPlan 措辞滞后（P2-1）

- 三类闭集、design/ 禁区、禁区命中整份拒绝零变化、不做部分执行、新卡 task_plan 由 W builder 建（改动前 cards 判定）、planner-amend 不写 `blocked`/`escalate`/`plan_amend`、普通 `done.note` 写 `outcome=out-of-scope proposal=<方案文件名> reason=<原因>`、monitor 续写 `stage_result outcome=blocked`——design §4.5.2（:574-589）、§4.5.3 第四行（:598）、§9.4 超出范围分支（:1030-1037）、§11 A122（:1173）、§14-6（:1317）、§13（:1295）六处 RLT-A-07 后文本互相同构。
- SKILL.md「planner-amend 改计划模板」（:168-194）逐项覆盖 §14-6 要求：输入恰四件（方案文件只读、`relay_plan.md`、`dev_plan/P<N>-*.md`、已有卡 `task_plan.md`）、三类闭集、禁区整份拒绝不做部分执行、`lint --amend-check before|after` 两阶段接口、`actual == proposed` 唯一判据、失败恢复 `actual ∪ proposed`、最多修三次且第三次按零变化+结构化 done.note 收尾、不写 blocked/escalate/plan_amend、不建新卡七件套、snapshot-dir 0700/0600 非 durable evidence、敏感 untracked 不进证据。
- 实现与冻结接口逐项对应：`--amend-check before|after` 挂 lint 子解析器（:2768-2771），`main` 顶层仍恰 `add/status/lint`（A135）；`_validate_amend_before`（:1343-1385）双采样静默、before 原始副本、marker cards 取改前值；`_check_amend_allowlist`（:1314+）三类闭集 + `_AMEND_DESIGN_RE` 禁区先行；`_validate_amend_after`（:1412-1464）`actual == proposed` + HEAD/index/object database 指纹不变 + 普通 lint 收尾；`_authorize_agent`（:1630-1636）planner-amend 的 `blocked`/`escalate` → A122；`_validate_planner_amend_done_note`（:1712-1730）`outcome=out-of-scope` + `proposal=`（禁路径分隔符，即"文件名"）+ `reason=` 非空。
- adapter 两份各只新增一行同构指针（`planner-amend`…以 SKILL.md 模板为准，不重复展开），与 task_plan"只需链接则不复制模板"一致；`test_planner_amend_reference_isomorphic` 断言两 adapter 的 planner-amend 行完全相等。
- **偏差**：DevPlan §RLT_09 实施提示（:322）与 §7.2 附录项（:623）仍写"before/after **Git tree** 快照（差）"——该措辞由 RLT-A-07（`bdd6cc2`）按当时 W2 方向同步（`evidence/08` 明记"同步…W2 before/after tree 算法"）；其后 W4（`0898ab9`）把 P1-02 冻结为**仓外原始工作树快照 + 只读 Git 清单 + object database 指纹**，并明令禁止 `git add/hash-object/write-tree`（task_plan B4 §P1-02；findings B4 注记；review.plan.md W4 PASS 段确认 `0898ab9` 只改 brief/findings/task_plan，DevPlan 未再同步）。验收口径（DevPlan:311）与 design §14-6 均为机制中立措辞（"改前/改后快照"），不受影响；但见 P2-1。
- 关联观察（非独立 finding）：dispatch/exec.md:8、audit.md:9、builder.md:20 保留更早的 `git diff --name-only` 机制措辞——属派单时点快照即形成史，权威合同以 task_plan/brief 为准；另 brief/dispatch 的"design/**、dev_plan/** 禁止"是施工者边界，已执行的 RLT-A-07 例外在 DevPlan allowed-paths 括注、`decision.1` ③、progress 与 code-round1 报告中均有记录，授权链完整。

### 6. A135 命令集与 A59 豁免 —— 一致

- `main` 顶层子命令恰为 `add/status/lint`（:2752-2771）；`--amend-check/--repo/--snapshot-dir/--proposed-path` 仅挂 lint 且 `args.command=="lint"` 门内校验必填/互斥（:2774-2785）；SKILL.md:121-127 三命令签名 + :180-187 amend-check 下属模式、两份 adapter 只含三命令模板，与 §11 A135、A99"不新增公共 CLI 子命令"一致。
- A59 豁免四名 `orchestrator#`/`monitor#`/`planner-amend#`/`strategist#`：design §3.5:298 与 §11 A59（master 已有四名单文本，非本卡改动）↔ SKILL.md:159 ↔ `RELAUNCH_EXEMPT_AGENT_NAMES`（:60-62）逐名相等；豁免范围"仅 agent 表成员一条"在四处均保留限定语。

### 7. F-003 UTF-8 防护 —— 一致

- RLT_10 `findings.md` F-003 原文（cp1252 下 `_status_command` 中文 `UnicodeEncodeError`）逐字并入 brief §F-003；task_plan B5 的"入口小型 `_configure_utf8_stdio()`、不依赖 `PYTHONUTF8`、bytes 捕获"与实现（:194-208 探测 `reconfigure` + OSError/ValueError/AttributeError 降级、不关不换流；:2750 位于 `main()` 首行先于参数解析）及 `RelayCliEncodingTests`（:4969-5061，ascii/cp1252 × status 文本/status --json/lint stderr/lint --json 八路）同构。brief 边界"只做入口防护、不改薄壳"与 diff 相符（`tools/tests/**` 零改动）。

### 8. AGENTS 例外句 —— 一致

- AGENTS.md relay-light 协议段"运行中的白名单追加有意绕过 B-adjust；例外只覆盖任务卡、开发方案任务行与接力计划追加，设计与验收仍走 dev-harness"↔ design §4.5 护栏（:537 三样可改/设计验收不碰）、§4.5.3 第三行（:597 显式绕过 B-adjust 决策）、§14-7（:1318 要求写进 AGENTS）。例外枚举恰为三类白名单对应的工件种类；"追加"是追加范型简称，范围无缩水。

## 二、RLT_03 交接断言逐条闭合（DevPlan §RLT_09 A120 行 ①~⑤ 逐字）

| # | 断言 | 闭合判定 | 前后记录（证据账本 / 复核自核） |
|---|---|---|---|
| ① | 「被 superseded 行隔开」始终通过 | CLOSED | 前：E-B2-01 记录正式基线 `b6b7d66` 复跑该子例未失败（基线即通过）；后：E-B2-02 七用例 exit 0 含该子例；check.C2 独立复跑同结论。测试实体 test:484-500。 |
| ② | 「其余条件合法的同 stage 表尾追加」在 RLT_09 前后按正式版本记录拒绝→通过 | CLOSED | 前（拒绝）：E-B2-01 `git show b6b7d66:…relay_log.py` 还原正式基线语义后跑候选正例 → exit 1，`tail-append` 精确报 `HC-RL-A129`；check.C2 在仓外临时目录独立复跑同结论。后（通过）：E-B2-02 同命令 exit 0。正例确为"其余条件全合法、仅表尾位置差异"（test:461-480 逐 fixture 可核）。 |
| ③ | 四项硬约束全部保持拒绝及有效编号 | CLOSED | E-B2-02：A46（重复号含 superseded）/A72（依赖 superseded）/A89（指向后阶段）/A109（同卡并行）逐项 exit 2 + 精确编号；check.C2 复核实现仅动 `stage_runs` 5 行。 |
| ④ | 既有 A46/A72/A75/枚举与依赖回归保持 | CLOSED | E-B2-02 七用例含 `test_node_number_is_unique_even_when_superseded`/`test_dependencies_cannot_target_superseded_nodes`/`test_each_active_node_needs_an_active_agent`(A75)/`test_stage_must_be_known_and_grouped_contiguously`/A89；check.C2 补跑枚举与依赖既有用例 7 项 exit 0；E-B2-03 全量 145 绿。两处多违规旧 fixture 按 DevPlan"仅变更其实际负责的规则断言"收窄为 A89，未假借翻绿。 |
| ⑤ | 运行中追加能力最终由 RLT_16/RLT_19 实跑证明，交付方式仍按 §4.5 | CLOSED | 措辞保全：design §4.5.4"追加节点谁接手"（:606）与 §4.3 注记（:519）在整卡 diff 中未改一字；未冒领：DevPlan RLT_16/RLT_19 仍"未开始"，task_plan B2 判据明记"记作后续，不在本批伪造"，全仓无相反声明。本条为非测试断言，账本未单列 E-ID，由合同措辞 diff 为空 + 计划状态共同取证，记录在 task_plan 判据与本表。 |

## 三、发现（按级别）

- **P0**：无。
- **P1**：无。
- **P2-1**（DevPlan 措辞滞后，建议修）：`dev_plan/P1-RelayLight-开发方案.md:322`（§RLT_09 实施提示）与 `:623`（§7.2 RLT_09 项）写"before/after **Git tree** 快照（差）"，是 RLT-A-07 时按 W2 方向同步的措辞（`evidence/08` 明记）；W4 已把 P1-02 冻结算法改为仓外原始工作树快照 + 只读 Git 清单 + object database 指纹，并明禁 `git write-tree/hash-object` 等写对象命令。DevPlan 未随 W4 再同步——后续读者（RLT_16/RLT_19 或本卡复审者）按提示会走向已作废且部分被禁的机制。验收口径本身机制中立不受影响；修复是一行级措辞同步（如"仓外原始工作树快照 + 只读 Git 状态核对"），因 DevPlan 是受控工件，改它需按既有授权路径取得确认，本复核只登记不动笔。
- **P3-1**（存量漂移，非本卡引入）：`SKILL.md:129` "lint 的 `--json` 输出结构随 RLT_10 落地——当前只 `status` 实现 `--json`，给 lint 传 `--json` 会报参数错"已不成立：master 上 `lint --json` 已随 RLT_10 落地（A80 有覆盖），本卡 B5 编码用例也在实际调用 `lint --json`。该句 master 已存在，本卡触及 SKILL.md 时未顺手修正；一行修。
- **P3-2**（模板完整性提示）：SKILL.md:183-187 的 amend-check 命令块未示 `--config-dir`。按 A136 约定两侧每个 add/status/lint 调用应显式带本侧 `--config-dir`，而 adapter 只含普通三命令模板且按约定不复制 amend 命令——监工照抄该命令块在双侧机器上可能撞五情形解析 exit 3。非合同违反，可在后续小修中补占位符。
- **P3-3**（语义边界记录）：`plan_amend` 的阶段归属按其 `node` 字段推导（`_stage_of`，非 `STAGE_NOTE_EVENTS`）；design §3.4"任意位置"未约束该 node 必须属于本阶段实例。若监工把 `plan_amend` 挂在别阶段节点，A123 的"本阶段"判定会错位。oracle 未冻结此约束，实现解释为"按 node 归属"与 §9.4 示例（改计划完成后在本阶段写）自洽；属操作纪律边界，记录供 code-round2/后续知悉。
- **P3-4**（形成史提示）：dispatch/exec.md、audit.md、builder.md 保留最早的 `git diff --name-only` 机制措辞，系派单时点快照；权威合同以 task_plan/brief（W4 已同步）为准。不改派单史，仅提示。

另：进场时 `tools/relay-light/__pycache__/` 存在未跟踪残留（`relay_log`/`test_relay_log` 两个 .pyc，疑为 code-round1 复跑后再次生成），已按复核 brief 纪律删除；未跟踪状态本就不入提交，不影响四集合结论。

## 结论

**APPROVE_WITH_NITS** —— relay_log.py 行为、SKILL.md 事件表与 planner-amend 模板、两份 adapter、design §4.5.2/§9.4/A121/A122（RLT-A-07 后）、DevPlan 卡、brief/task_plan 六面措辞与冻结合同逐轴同构；RLT_03 五条交接断言逐条闭合且前后记录可复算。唯一实质措辞欠账是 P2-1 的 DevPlan"Git tree 快照"滞后（机制中立、不触验收口径，但属受控工件需授权路径修正）；其余 P3 为提示性记录，不要求整改。本结论不代替验收、verify、人验或远端动作。
