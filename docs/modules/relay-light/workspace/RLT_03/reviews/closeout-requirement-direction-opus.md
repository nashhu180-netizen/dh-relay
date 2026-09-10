<!-- dh:v1 · review-report -->
# RLT_03 收口复核 · 需求方向路径（独立）

## 0. 身份与形态

| 项 | 值 |
|---|---|
| review_path_id | `requirement_direction` |
| 派出证据 | E-049（`herdr agent prompt rlt03-req-opus`） |
| pane / session | `HERDR_PANE_ID=w15:pC`；`HERDR_TAB_ID=w15:t1`；`HERDR_WORKSPACE_ID=w15`；`HERDR_SESSION=kpi-agg`；`CLAUDE_CODE_SESSION_ID=6db9d3e6-527d-4d2e-a624-3ebca7aaaf6b` |
| 自报模型 | Claude Opus 5（`claude-opus-5`） |
| 启动形态 | Claude Code CLI 子会话（`CLAUDE_CODE_CHILD_SESSION=1`、`AI_AGENT=claude-code_2-1-267_agent`），Herdr pane 内 fresh 独立 worker；未加载 dev-harness skill、未派活、未起子 agent、未问用户 |
| branch / HEAD | `wt/RLT_03` / `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc`（working tree 仅 `workspace/RLT_03/progress.md` 为 M） |
| 时间 | 2026-09-10T16:40+08:00 |
| 复核范围 | 仅需求方向：完成条件闭集、HC-ID 同卡可证明性、范围漂移、是否误实现 RLT_05/RLT_07/RLT_09、需求境证据能否支撑机器验收与 releasePacket |
| 本报告性质 | **方向复核结论，不是验收通过，不代表任何机器项已签、不代表可 verify / merge** |

读过：仓根 `AGENTS.md`；`workspace/RLT_03/` 的 `brief.md` / `task_plan.md` / `progress.md` / `findings.md` / `review.md` / `execution_strategy.md` / `lesson_candidates.md` 与 `reviews/` 全部 11 份批审报告；`dev_plan/P1-RelayLight-开发方案.md`（RLT_03 卡、RLT_05 卡、§6 42-ID owner 表、依赖与分批段）；`design/01-RelayLight-产品设计与验收.md` §3.1~§3.6、§4.1~§4.5、§5.1~§5.3、§10、§11.1、§14；`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`。

只读复核，未改任何代码 / `review.md` / `progress.md` / `findings.md` / DevPlan，未 commit / push。测试与 CLI 探针均在 scratchpad 隔离副本执行，工作树未产生 `__pycache__` 或任何新文件。

## 1. 闭集映射与遗漏计数

### 1.1 42 个 HC-ID 的三处闭集比对

| 比对 | 结果 |
|---|---|
| DevPlan §6 owner 表判给 RLT_03 的 ID | **42** 个（脚本解析全表 122 条后按 owner 归并） |
| DevPlan RLT_03 卡「验收口径」列出的 ID | **42** 个，去重后 42；与 owner 表**完全相等**（差集双向为 0，无重复列项） |
| brief「完成条件」16 组展开后的 ID（含 `A72/A128` 斜杠合写形式） | **42** 个；与 owner 表**完全相等**（缺 0、多 0） |
| design/01 §11.1 中这 42 个 ID 的存在性 | **42/42 命中**，全部落在 **AI 自动验收栏**，无一条落人类验收栏 |

闭集判定：**RLT_03 的需求边界是一个精确闭集，brief 16 组条件对 42 个 owned ID 是一一覆盖的划分，无遗漏、无越界、无重复归属。** 这是本卡方向上最扎实的一点。

42 个 ID：`A2 A5 A17 A18 A24 A35 A37 A38 A39 A40 A41 A42 A45 A46 A47 A48 A49 A50 A51 A55 A56 A58 A59 A60 A63 A68 A69 A70 A71 A72 A74 A75 A77 A78 A84 A87 A104 A109 A126 A128 A129 A130`。

### 1.2 条件 → 测试 → 证据 的可追溯性

| 计数项 | 值 |
|---|---|
| `progress.md` Batch-4 矩阵引用的测试名 | 50 个，**全部在 `test_relay_log.py` 中真实定义**（悬空引用 0） |
| 测试文件实际定义的 test 数 | 53 个（矩阵未引用的 3 个为额外覆盖：`test_by_is_derived_from_agent_prefix_without_event_ownership_validation`、`test_empty_cards_is_a_plan_parse_error_in_the_lint_cli`、`test_help_lists_exactly_the_three_frozen_subcommands`） |
| 独立复跑结果 | scratchpad 隔离副本 `python3 -m unittest test_relay_log` → `Ran 53 tests in 27.799s` / `OK`（exit 0，0 skip），**与 E-045 声明一致** |
| 在测试源码中有 HC-ID 文本锚点的 owned ID | 26 / 42 |
| **无任何文本锚点、只能靠 progress 手工矩阵挂钩的 owned ID** | **16**：`A5 A37 A38 A39 A40 A41 A42 A49 A50 A51 A56 A63 A68 A70 A74 A77` |
| 生产源码出现的非 owned ID | 1 个：`HC-RL-A61`，仅作 RLT_05 边界占位注释（`relay_log.py:748`），非实现 |

### 1.3 同卡可证明性判定（逐 ID 结论）

- **39 / 42 判定为「同卡可机器证明且已被现有测试或静态守卫覆盖」**。
- **3 / 42 判定为「同卡可证明性依赖一个尚未落定的设计裁决」**：`A5`、`A128`、`A129`。三条都不是实现缺陷，而是冻结文本自身互斥，详见 §2 的 R-P1-1 ~ R-P1-3。

## 2. findings

> 级别口径：P0 = 方向错误必须停；P1 = 收口/签署前必须闭合，否则会签到不成立或不属本卡的项；P2 = 收口前应处理；P3 = 登记即可。
> 本路径不改代码、不改 `review.md` / `progress.md` / `findings.md` / DevPlan，全部结论以待办形式交主控。

### R-P0：无

未发现方向性错误。任务终点、非目标、允许路径、依赖方向（RLT_02 → RLT_03 → RLT_05）与 DevPlan 一致；未发现把别的卡的目标当成本卡目标来做。

### R-P1-1（P1）｜`A5` 的取证配方与 §3.1 / `A80` 互斥，brief 条件 12 按字面不成立

- **需求文本**：§11.1 `A5` = 「relay_plan 缺失或解析失败时**三个子命令均退出码 3**」，怎么证明栏写「单测：缺文件 / 缺表头 / **节点号重复**」。brief 条件 12 原样承接为「坏/缺计划三命令退出 3」。
- **另一处冻结文本**：design §3.1 退出码表明确写 `lint` = 「`0` 通过；**`2` 规则违反**；`3` relay_plan 缺失或解析失败」；`A80`（**owner = RLT_10**）进一步冻结「`lint` 合同：签名与退出码 0/2/3；违反项每条一行写 stderr，格式 `lint: <规则编号> <message>`」。§3.5 的 lint 规则映射表把「节点号重复（含已 superseded 的号）」列为 **lint 规则**，ID = `A46`。
- **实测（scratchpad 隔离目录，真实 CLI）**：

| 场景 | `lint` | `status` | `add` |
|---|---|---|---|
| 缺 `relay_plan.md` | rc=3 `error: HC-RL-A18 …` | rc=3 同 | rc=3 同 |
| 缺表头（marker 在但无固定表头） | rc=3 `error: HC-RL-A24 …` | rc=3 同 | rc=3 同 |
| **节点号重复** | **rc=2**，stderr `lint: HC-RL-A46 line 7: duplicate node W1` | rc=3 `error: HC-RL-A46 …` | rc=3 `error: HC-RL-A46 …` |

- **判定**：`A5` 语句的前两例成立；第三例（节点号重复）在 `lint` 上是 2 而非 3。实现选的是 §3.1 / `A80` 一侧，是**更具体、更可辩护**的一侧，测试名 `test_runtime_plan_semantic_errors_map_to_exit_three_while_lint_is_two` 也把这个偏离写在了名字里。问题不在实现，在于 **`A5` 的取证配方与 `A80`／§3.1 直接互斥，而 `A5` 是 RLT_03 owned、`A80` 是 RLT_10 owned**——本卡无法在不越界改 `A80` 的前提下让 `A5` 按字面通过。
- **已被本卡登记**：`F-016`（P2，**状态 open**，原文即写「`HC-RL-A5` 与 `A120` 的互斥文字仍需主控/后续设计裁决」）。
- **要求**：收口前由主控给出并落盘一条裁决，二选一：(a) 把 §11.1 `A5` 的取证栏与语句收窄为「缺失或**解析级**失败」，把「节点号重复」从 `A5` 的三例中移除（它已由 `A46` + §3.1 覆盖）；或 (b) 明文记录 `A5` 在 `lint` 上按 §3.1 解释、`F-016` 随裁决转 resolved。**在裁决落盘前，`A5` 与 brief 条件 12 不得勾「达成」。**

### R-P1-2（P1）｜`A128` 的四个封闭例外中有一个归 RLT_09，本卡结构上无法「逐项覆盖」

- **需求文本**：`A128`（RLT_03 owned）= 「parser/lint 派生活跃计划时忽略 superseded 行；显式例外封闭为 **A46 节点号占用、A72 禁止依赖 superseded、A75 空节点、A120 表尾/隔断放宽**」，怎么证明栏要求「**逐项覆盖四个例外**」。
- **冲突**：第四个例外 `A120` 的 owner 是 **RLT_09**（DevPlan §6 表）。本卡不但没实现该放宽，还按 §11 把其中「同 stage 表尾追加」一路**反向严格拒绝**（`progress.md` 收口句与 `F-003` 均明记：A46/A72/A75 逐项闭合，A120 归 RLT_09，「须由 RLT_09 显式反转」）。
- **判定**：`A128` 的取证配方要求覆盖一个本卡按设计**不得实现**的例外，因此 `A128` 在本卡**不可能按字面完整取证**——现状是「3 项正向覆盖 + 第 4 项以其否定形式覆盖」。这不是施工偷工，是 ID 文本跨了卡。
- **要求**：收口前把 `A128` 的例外清单在 §11.1 里显式分域（如「A46/A72/A75 由 RLT_03 逐项取证；A120 的放宽由 RLT_09 承接并在该卡取证」），或由主控落盘等效裁决。**在此之前 `A128` 与 brief 条件 4 只能记「部分闭合（3/4 例外）」，不得整条勾达成。**

### R-P1-3（P1）｜`A129` 的表尾豁免在设计正文里有两处正面表述，与 §11.1 取证栏相反，本卡冻结了一个后继卡必须反转的行为

- **设计正文（两处，均支持豁免）**：
  - §3.5 lint 规则映射表：「同一阶段的节点未按 stage 分组连续（忽略 superseded 行；**§4.5 的追加行落在表尾不算违规**）| HC-RL-A129」。
  - §4.3 正文：「『连续』这条按 stage 分组判定，不看物理行号相邻（为 §4.5 运行中改计划放宽）……**追加行落在表尾也通过**」。
- **§11.1 `A129` 取证栏（相反）**：要求「同 stage 节点被另一 stage 隔断**各一例被拒**」，无豁免。
- **本卡取舍**：按 §11 严格拒绝（`F-003` open，主控裁决在案），并把放宽推给 RLT_09 / `A120`。
- **方向风险（本条比 R-P1-1/2 更重）**：本卡不是在两个都空白的读法里选一个，而是**实现了与设计正文两处明文相反的行为，并用测试把它钉死**。`A120`（RLT_09）的语句「同一 stage 的节点**追加在表尾通过**、被 superseded 行隔开通过」说明放宽才是设计终态。也就是说 RLT_03 交付的是一个**RLT_09 必须回来删测试、反转行为**的合同。这会在 RLT_09 触发一次「后继卡推翻前卡已签机器项」的返工，正是复核闸要提前拦的形态。
- **要求**：收口前**修文本而不是只留裁决**——把 §3.5 该行与 §4.3 那句同步改成「表尾/隔断放宽属 `A120`，RLT_09 承接前 lint 严格判定」，让 `A129` 三处口径一致；`F-003` 随之转 resolved。若主控坚持只保留裁决不动文本，须在 `F-003` 里显式写明「RLT_09 实现 A120 时**必须删除/反转** `test_stage_must_be_known_and_grouped_contiguously` 的表尾反例」，作为跨卡待办交接。

### R-P1-4（P1）｜`review.md` 的完成条件表仍是 RLT-B-04 之前的旧口径，照此挂证据会签到不属本卡且未实现的项

`brief.md` 已按 RLT-B-04 更新为新 16 条，但 `review.md` 的「完成条件逐条挂证据」表**未同步**，至少 4 条仍是旧措辞：

| # | `review.md` 现存旧措辞 | 与现行 brief 的差 | 风险 |
|---|---|---|---|
| 4 | 「…**status**/lint 忽略 superseded，且其**不算 closed/pending**」 | brief 现为「parser/lint 忽略 superseded，并仅允许四个冻结例外」 | `status` 差分语义已随 `A73`/更新后 `A62` **划归 RLT_05**（`F-030`），本卡未实现；照旧表挂证据 = 替 RLT_05 签字 |
| 6 | 「…分组连续、**stages 顺序**、stage_id/card/k…」 | brief 无「stages 顺序」 | `stages` 顺序属 `A62`（RLT_05 `status --json` schema），本卡未实现 |
| 7 | 「kickoff/verify-signoff 被禁，**映射不含 E11~E13**」 | brief 现为「parser/lint 拒绝 kickoff/verify-signoff node type」 | 映射检查属更新后 `A92`（RLT_05）/`A127`（RLT_07）（`F-032`），本卡未实现 |
| 8 | 「marker **五字段**…decision_mode 仅 auto/consult **且可读**」 | brief 现为「marker **四必需字段**…decision_mode 缺省 auto 且仅 auto/consult」 | 「五字段」是 `decision_mode` 可省之前的旧数；「可读」属 `A62` 的 `plan.decision_mode`（RLT_05，`F-031`） |

同表其余行的证据列**全为「待填」、达成列全为「待验」**；「验收项元数据表」仍写 `覆盖态=否`、`实际执行结果=待施工`。

- **判定**：这是本次方向复核里**最直接的误签风险**。收口若以 `review.md` 这张表为准逐条挂证据，等于在 RLT_03 上勾选 RLT_05（A62/A73/A92）与 RLT_07（A127）的口径——正是 RLT-A-04/RLT-B-04 花三轮 fresh 复核拆开的那批混合 owner。
- **要求**：由主控把 `review.md` 的 16 条完成条件、元数据表与 brief 现行文本对齐后再挂证据。**本路径按纪律不动 `review.md`，仅报告。**

### R-P2-1（P2）｜需求境证据仍是开工占位，宪章#3 的进「待验收」前置尚未满足

- `review.md`「需求对齐证据」唯一一行：证据列 = `E-001（开工占位，收口换为真实场景证据）`，结论列 = `待人验`。
- 宪章#3 要求标准档进「待验收」前必须有需求境证据四件套（需求/人验项 + 场景操作路径 + 证据 ID + 结论）。本卡是纯 CLI，无 UI/可视化，故不触发浏览器截图要求；**等价物已经存在但没被挂上去**：`E-008`（lint CLI 正/反例真 CLI）、`E-013`（20 次 add 真序列）、`E-030`/`E-033`/`E-037`（`--help` 三子命令 smoke）、`E-040`（真 CLI 对抗序列：`plan_loaded → node_start → agent_launch → blocked → 七类坏 note escalate → 合法 escalate → decision → user_decision`，逐例断言 rc 与不落行）、`E-045`（53 tests 全绿 + 静态守卫 + 退役编号零残留）。
- **判定**：证据**足够**支撑机器验收，但**尚未成形为需求境证据行**，releasePacket 目前缺这一行的支撑。
- **要求**：收口时把 `E-008 / E-013 / E-040 / E-045` 按「场景操作路径 + 证据 ID + 结论」填进该行替换 `E-001`，并把元数据表的 `覆盖态` / `实际执行结果` 更新为实测值。

### R-P2-2（P2）｜打包层范围漂移：施工提交把 5 份治理文档并进了 RLT_03 的 diff

- RLT_03 的 `dh:allowed-paths:v1` 只有三条：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`docs/modules/relay-light/workspace/RLT_03/**`。
- 但 `b7f4ecc`（`feat(relay-light): implement RLT_03 plan and ledger core`）同时改了：`design/01-RelayLight-产品设计与验收.md`（+43/-…）、`dev_plan/P1-RelayLight-开发方案.md`、`design/drafts/A04-…`、`design/evidence/05-…`、`dev_plan/drafts/RLT-B-04-…`，共 5 份、336 插入 / 44 删除。核对 `master` 侧确认这些改动**在本分支引入**（master 的 design/01 仍是 `A64/A86/A88/A90`，无 `A126~A130`）。
- **不是内容问题**：RLT-A-04 / RLT-B-04 的文档内容有用户 2026-09-10 明文「你来写入」授权、有 fresh Opus 三轮 `APPROVE`、有 `design/evidence/05`，`progress.md` 也如实登记了这一步是「主控 RLT-A-04 / RLT-B-04 正式同步」。
- **是打包问题**：治理卡的改动与 RLT_03 的代码进了同一个 commit，导致 RLT_03 的 `git diff master...HEAD` 与 PR #4 携带越出本卡允许路径的文件，releasePacket 的「仅允许路径有 diff」这条自证会失败。
- **要求**：收口前由主控明确其一：(a) 在 `progress.md` / releasePacket 里显式声明「本 PR 含 RLT-A-04/RLT-B-04 治理同步，已单独授权，路径闸例外在案」；或 (b) 把治理文档改动拆成独立 commit。**不建议为此重写已推送历史**，(a) 更省事且留痕更清楚。

### R-P2-3（P2）｜16 个 owned ID 在测试源码中无锚点，可追溯性只靠一张手工表

`A5 A37 A38 A39 A40 A41 A42 A49 A50 A51 A56 A63 A68 A70 A74 A77` 在 `test_relay_log.py` 中没有任何 `HC-RL-Axx` 文本。这些多为行为/静态类断言（20 次追加字节不变、无锁、无 `.lower()`、pane 缺席、退出码形态），本身不产生带编号的错误串，**没有锚点是合理的**；但后果是「42 ID → 测试」的映射**只存在于 `progress.md` 的人工矩阵里**，机器验收无法自证。

本次已独立校验该矩阵**当前准确**（50 个引用测试名 100% 存在、53 tests 全绿）。**要求**：不必改测试；收口时在 releasePacket 里注明该映射为人工维护、以本次独立校验（本报告 §1.2）为佐证，并在 RLT_10 建全量测试入口时考虑给这些用例补 docstring 级 ID 锚点。

### R-P3-1（P3）｜`task_plan.md` 的 C-007 指错节

C-007 写「`design/01` **§14** 中 RLT_03 验收表」，实际验收表在 **§11.1**；§14 是「开发方案同步项（B 拆计划时必须承接）」，与验收表无关。施工未被误导（实际按 §11.1 做的），但该指针会误导后续读者。登记即可，不必返工。

### R-P3-2（P3）｜`A18` 的 `plan_loaded` note 口径是已知前向变更点

本卡按 §11.1 `A18` 只强制 `plan_loaded` 的 note 含非空 `skill=`。而 design §3.4 与 §6.2.1 另要求该 note 含 `config_dir=` 与 `plan=`，其取证归 **`A99`（RLT_05）**。当前全部合法 fixture 的 note 只有 `skill=0.1.0`，RLT_05 落地 `A99` 时这些 fixture 需同步补两键。**本卡边界正确**（不越界实现 `A99`），仅登记为跨卡交接项。

### R-P3-3（P3）｜DevPlan 抬头状态落后一步

DevPlan 抬头「进行到: P1 ▸ 第 1 批 ▸ RLT_03 施工 / 下一步: OMP GLM-5.3-Flash 完成 RLT_03 施工第 4 批窄返工，再进入独立复核」已落后于实际：`progress.md` 的 Node Signal 为 `CONSTRUCTION_DONE batch=4 contract-rework=RLT-B-04 rework=1`，五路复核已派出（E-047~E-051）。状态列 `进行中` 无误。登记即可。

## 3. 是否误实现 RLT_05 / RLT_07 / RLT_09（逐项核）

**结论：无越界实现。** 这一项本卡做得干净，且边界是**写在源码里**的，不是靠自述。

| 后继卡 | 核查方式 | 结论 |
|---|---|---|
| **RLT_05**（完整 status / 生命周期 / 配置 / Recipe / 止损） | grep `open_stages` / `suggested_action` / `last_stage_result` / `monitor_relaunch` / `idle_seconds` / `superseded_ignored` / `stages` / `rework_max` / `limits.` / `roles.toml` / `dh-mapping` 于生产与测试 | **零命中**。`_status_command` 只输出 `{current_stage:null, current_node:null, pending_nodes:[…]}` 且仅在空账本时投影 pending，非空账本退化为计数字符串；`relay_log.py:748` 有显式占位注释「Intentional RLT_05 placeholder (HC-RL-A61/A62)…deliberately NOT implemented in RLT_03」。唯一读 `stage_result` 的地方是 `_stage_failed_after()`，用途是 §3.5 冻结的 attempt 递增前因（`agent_lost`/`cancelled`/所属阶段 `failed`），属 `A49`/`A58` 本卡范围，非 status 派生。`A116`/`A89` 无特判（E-010 复现：grep 零命中） |
| **RLT_07**（五阶段模板） | grep 模板 / template / 阶段模板生成 / `A127` | **零命中**，无模板生成器，`--help` 实测仅 `{add,status,lint}` |
| **RLT_09**（运行中改计划与白名单） | grep `amend` / `A120` / `A119~A123` | `plan_amend` 仅作为 19 词表中的一个控制事件词存在（`A2` 要求），`planner-amend#` 仅作为 `A59` 的四个豁免前缀之一；**无 §4.5 改计划语义、无白名单校验、无 `A120` 表尾放宽特判**。见 R-P1-3：本卡在 `A120` 的领地上是「反向严格」，不是「提前实现」 |
| 公共 CLI 面 | 真实 `--help` + `test_help_lists_exactly_the_three_frozen_subcommands` | 仅 `add` / `status` / `lint` 三子命令，符合 §3.1 「前四批对外仍只有三个」 |
| 反向越界（本卡吃了别卡的活） | `A80`（RLT_10）冻结的 lint 退出码 0/2/3 与 `lint:` stderr 格式，本卡已按其实现 | **属必要行为、不算漂移**（lint 必须给退出码），但请在 RLT_10 做 `A80` 时**核对而非重做**，避免二次定义 |

## 4. 需求境证据能否支撑机器验收与 releasePacket

| 维度 | 判定 |
|---|---|
| 42 个 ID 是否全属机器可证 | **是**。§11.1 中 42/42 落 AI 栏，人类验收栏 0 条；`review.md` 人类签名区「本卡无业务人判结果项」与之自洽 |
| 机器证据是否真实存在且可复算 | **是**。E-001~E-046 逐条带命令、退出码、结果与结论；本路径独立复跑 53 tests → OK，独立真 CLI 复现 A5/A46 三场景退出码，独立静态复核 `.lower()`/`.casefold()`/`fcntl`/`msvcrt`/`filelock`/`tempfile`/`os.replace`/`pane` **全部零命中** |
| 有效单测/变异证据 | **充分**。E-019 / E-024 / E-029 / E-032 / E-036 / E-041 / E-042 / E-043 共 30+ 项定向变异，且 `F-035` 记录了「精确 equality 变异曾存活 53 绿」的缺口并已闭合——这条自曝比结论本身更能说明测试有判别力 |
| 是否有伪装成结果通过的表述 | **无**。Node Signal 是 `CONSTRUCTION_DONE` 而非验收通过；Draft PR 行明写「Draft 不代表 verify、验收或允许合并」；`F-029` 主动标注 6 处 late-added coverage「不存在也不伪造有效行为红」。这一点合规 |
| **releasePacket 当前是否可成立** | **否，尚缺三块**：① `review.md` 完成条件表口径过期（R-P1-4）；② 需求境证据行仍是 `E-001` 占位（R-P2-1）；③ `A5`/`A128`/`A129` 三条需裁决落盘后才能勾（R-P1-1~3）；另 ④ diff 越出允许路径需声明（R-P2-2） |

## 5. 结论

**CHANGES_REQUESTED**（需求方向路径）

方向本身是对的，且对得相当扎实：42 个 owned ID 与 brief 16 组条件构成精确闭集，无遗漏无越界；对 RLT_05 / RLT_07 / RLT_09 的边界不仅没越，还把「不做」写成了源码注释和 findings；证据链真实可复算，53 tests 独立复跑全绿。

不给 APPROVE 的原因不在实现，在于**签署面**：

1. **三条 owned ID（`A5` / `A128` / `A129`）的取证配方与另外几处冻结文本互斥**，其中 `A129` 更严重——本卡冻结了一个与 design §3.5 / §4.3 正文相反、且 RLT_09 必须回头反转的行为。需要主控**改文本**（不只是留裁决）后才能签。
2. **`review.md` 的完成条件表停留在 RLT-B-04 之前**，照它挂证据会把 RLT_05 / RLT_07 的口径签到 RLT_03 头上，正是 A-04/B-04 拆开的那批混合 owner。
3. **需求境证据行仍是开工占位**，宪章#3 的进「待验收」前置未满足；材料齐备，只差归位。
4. **本卡 diff 越出允许路径**（5 份治理文档并进施工 commit），releasePacket 的路径自证需要一条显式例外声明。

上述 4 项均由主控在收口环节处理即可，**不需要施工返工、不需要改代码**。四项闭合后本路径可转 APPROVE。

**再次声明：本报告是需求方向确认，不构成任何机器项的验收通过，不解锁 verify / merge / 人类签名区。**
