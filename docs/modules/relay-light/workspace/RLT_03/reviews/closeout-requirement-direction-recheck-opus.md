<!-- dh:v1 · review-report -->
# RLT_03 收口复核 · 需求方向路径 **同路径复验**

## 0. 身份与形态

| 项 | 值 |
|---|---|
| review_path_id | `requirement_direction`（**复验轮**，对应初审 `closeout-requirement-direction-opus.md`） |
| 派出证据 | E-059（`herdr agent prompt rlt03-req-opus`｜requirement-direction recheck after review and demand-evidence sync） |
| pane / session | `HERDR_PANE_ID=w15:pC`；`HERDR_TAB_ID=w15:t1`；`HERDR_WORKSPACE_ID=w15`；`HERDR_SESSION=kpi-agg`；`CLAUDE_CODE_SESSION_ID=6db9d3e6-527d-4d2e-a624-3ebca7aaaf6b` |
| 自报模型 | Claude Opus 5（`claude-opus-5`） |
| 启动形态 | Claude Code CLI 子会话（`CLAUDE_CODE_CHILD_SESSION=1`、`AI_AGENT=claude-code_2-1-267_agent`），Herdr pane 内 worker；未加载 dev-harness skill、未派活、未起子 agent、未问用户 |
| branch / HEAD | `wt/RLT_03` / `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc`（HEAD 未动；整改全部在 working tree） |
| 被复验对象 hash | `relay_log.py` `md5=3a032b0c4b25d5e86fd8b6f1f09103c2`；`test_relay_log.py` `md5=87905c6ec2b069085ef74f34f067ccf7` |
| 时间 | 2026-09-10T18:17+08:00 |
| 本报告性质 | **方向复验结论，不是验收通过；不代签任何机器项、不解锁 verify / merge / 人类签名区** |

读过：仓根 `AGENTS.md`；`workspace/RLT_03/` 的 `brief.md` / `task_plan.md` / `progress.md` / `findings.md` / `review.md` / `lesson_candidates.md`；初审报告 `reviews/closeout-requirement-direction-opus.md`；同轮四路报告 `closeout-code-round-1-opus.md`、`closeout-code-round-1-recheck-opus.md`、`closeout-code-round-2-opus.md`、`closeout-code-round-2-recheck-opus.md`、`closeout-consistency-sol.md`、`closeout-lessons-sol.md`；`design/01` §3.1~§3.5、§4.1~§4.3、§9.3~§9.4、§11.1；DevPlan RLT_03 卡与 §6 owner 表；当前 Python working diff（`relay_log.py` +24/-9、`test_relay_log.py` +126/-…）。

只读复核。除本报告外未修改任何文件；未 commit / push；测试与探针在 scratchpad 隔离副本执行，工作树未新增 `__pycache__`。

## 1. 已修项复核（初审 4 条中 3 条判定 CLOSED）

### 1.1 R-P1-4 `review.md` 完成条件表口径过期 → **CLOSED**

逐条 diff 比对 `brief.md` 与 `review.md` 的 16 条完成条件：

| 检查 | 结果 |
|---|---|
| 条目数 | brief 16 / review 16 |
| 逐条文本比对 | **16/16 语义一致**；唯一字面差异是第 8 条 brief「decision_mode **缺省为** auto」vs review「decision_mode **缺省** auto」，同义，不构成口径差 |
| 初审点名的 4 条旧口径 | **全部已改**：#4 去掉「status 忽略 superseded / 不算 closed-pending」，改为「parser/lint 忽略 superseded，并仅允许四个冻结例外」；#6 去掉「stages 顺序」；#7 由「映射不含 E11~E13」改为「parser/lint 拒绝 kickoff/verify-signoff node type」；#8 由「marker **五字段**…decision_mode…**且可读**」改为「marker **四必需字段**…缺省 auto 且仅 auto/consult」 |
| 误签风险 | **已消除**。RLT_05 的 `A62`/`A73`/`A92`、RLT_07 的 `A127` 口径不再出现在本卡完成条件表中 |
| 42-ID 口径 | `review.md:85` 元数据表已写「42 个 owned HC-ID 映射完整」；`review.md:33` 需求复核结论行如实转录初审 `CHANGES_REQUESTED` 与四项签署面问题 |
| 证据列 | 16/16 已填，**零「待填」、零「待验」**（脚本校验：`'待填' in 表 == False`、`'| 待验' in 表 == False`）；引用的 `E-013/E-018/E-040/E-044/E-045/E-052/E-053/E-054/E-057/E-058` **全部在 `progress.md` 证据账本中真实存在** |

`progress.md` 的矩阵收口句也同步改掉了初审所指的过度宣称：由旧版「已与 42 个 ID 全部对应并闭合……无 blocker」改为「已与 42 个 ID 全部建立**测试映射**……**当前不能写「全部闭合」**：A5 受 F-016 限定，A128/A129 受 F-003 限定，须先完成正式合同裁决」。**这是本轮最重要的一处修正**——把「映射完整」与「合同闭合」两件事分开写，正是初审要的。

### 1.2 R-P2-1 需求境证据仍是开工占位 → **CLOSED**

`E-001` 占位行已被替换为 4 行，四件套齐备：

| # | 需求 / 人验项 | 场景与操作路径 | 证据 ID | 结论 | 四件套 |
|---|---|---|---|---|---|
| 1 | 合法 plan 可读、非法 plan fail closed | 临时目录生成合法/重复节点/坏 marker，逐一跑 `lint`/`status`/`add`，核退出码、stderr、零写入 | E-008、E-018、E-045、E-052~E-054 | 实现证据通过；A5 文字冲突待裁决 | 齐 |
| 2 | 账本只追加且 JSONL 可持续读取 | 20 次 add 存旧前缀 bytes；U+0085/U+2028/U+2029 note 往返；无 LF / 尾随空格末行验 `status`/`add` 拒绝且 bytes 不变 | E-013、E-052~E-054、E-057、E-058（待） | 54 tests 全绿；最终有效变异待 E-058 | 齐 |
| 3 | 事件 / attempt / 状态机 / 触发关闭前置 fail closed | 真 CLI 跑 `plan_loaded → node_start → agent_launch → blocked → escalate → decision/user_decision → resume` 正反序列，逐项核 rc、HC-ID、不落行 | E-040、E-052~E-054、Batch-4 矩阵 | 代码轮 1 APPROVE；代码轮 2 待 F-043 复验 | 齐 |
| 4 | **人验项**：机器证足以支撑本地收口 | 用户查看五路复核、有效变异、合同边界与 releasePacket 后明文确认 | 本表、五路 review、后续 releasePacket | **未签收；AI 不代签** | 齐 |

- 四行的证据 ID **全部可在证据账本中定位**（脚本校验缺失数 = 0）。
- 本卡为纯 CLI，无 UI/交互/可视化，宪章#3 的浏览器截图要求不触发；等价物为真 CLI 往返 + 退出码 + 字节观测，已挂上。
- 人类签名区 `[ ]` 未勾、「材料齐没齐」`[ ]` 未勾、「as-built 更新了没」`[ ]` 未勾，状态改为「**收口复核中（未验收、未签收）**」。**无代签迹象**，符合宪章#4。

### 1.3 R-P2-3 HC-ID 锚点不足 → **实质改善（16 → 10）**

| 项 | 初审 | 本轮 |
|---|---|---|
| 在测试源码有 HC-ID 文本锚点的 owned ID | 26 / 42 | **32 / 42** |
| 仍无锚点 | 16 个 | **10 个**：`A5 A37 A39 A40 A41 A42 A50 A51 A56 A63` |
| 新增锚点 | — | `A49 A58 A68 A70 A74 A77 A78 A17`（`assertRegex(..., r"^error: HC-RL-Axx ")` 形式）+ `A38/A56`（新测试 docstring） |
| 矩阵悬空引用 | 0 | **0**（50 个引用测试名全部真实定义） |

剩余 10 个多为静态/字节/退出码类断言（无编号错误串可锚），无锚点属合理。**判定：本项从 P2 降为 P3，不再作为收口阻塞。**

### 1.4 R-P3-1 / R-P3-3（`task_plan` C-007 指向 §14、DevPlan 抬头落后）→ **未处理，仍 P3**

均为登记项，不阻塞收口。`task_plan.md` C-007 仍写「design/01 §14 中 RLT_03 验收表」（实际在 §11.1）；DevPlan 抬头仍写「下一步：完成第 4 批窄返工」，而实际已到 `READY_FOR_REVIEW closeout-rework=1`。两处都在本卡允许路径之外或属主控维护面，登记即可。

## 2. E-052~E-057 代码整改是否偏离需求（逐项核，只看方向不看实现质量）

生产侧共 4 处改动，逐一对照冻结合同：

### 2.1 `read_ledger` 由 `splitlines()` 改为按 LF 切分（F-037，E-052/E-053）

- **需求依据**：`A38`（20 次 add 后历史行逐字节不变、无重复无覆盖）、`A55`（每行固定七字段可读）、`A45`（账本读取/解析失败 `status` 退 4）、`A56`（add 0/2/3/4 可复现）。
- **偏离判定**：**不偏离，且是必要修正**。旧实现下一次 `exit 0` 的 `add`（note 含 U+0085/U+2028/U+2029）会让账本在下一条命令永久不可读——这是 `A38` 语义下的真实损坏路径。新实现只认 JSONL 的 LF 分隔符，把 Unicode 行分隔符还原为 JSON 字符串内容。
- **未越界**：未改写侧、未引入 `os.replace`/锁/临时文件（静态 grep 复核零命中），`A39`/`A40` 不受影响。

### 2.2 `agent` 名为空以 `A24` fail-closed（F-040，E-052/E-053）

- **需求依据**：`A24`「relay_plan 解析规范：……`agent.node` 存在、同节点 agent 名唯一」；§4.2 定义 `agent` 列为 agent 名字（账本身份前半段）。
- **偏离判定**：**不偏离**。空名字在 §4.2 下不是合法 agent 行；更关键的是它会让 `close=agent:`（空引用）被误判为「引用了一个已存在的 agent」，直接污染 `A47`。以 `A24` 而非新编号拒绝，符合 §3.5 lint 规则映射表把表结构类问题归 `A24` 的做法。**未新增 HC-ID、未越界。**

### 2.3 attempt 基线由「按名字最新事件」改为「该 node/name 全部 `agent_launch` 的最大 attempt」（F-038，E-052/E-053）

- **需求依据**：§3.5 明文「attempt 分配 = 该 `(node, 名字)` **已有最大 attempt + 1**」，`A58`「`agent_launch` 的 attempt 必须恰为最大值 + 1，否则退出 2」，`A49`「每节点从 1 起、跨节点不累计」。
- **偏离判定**：**不偏离，是向冻结文本靠拢**。旧实现取「最新事件」的 attempt，在 stage-failed 重拉后旧实例继续写事件的场景下会让同一 `coder#2` 二次 launch；新实现取 `max(agent_launch.attempt)`，字面就是 §3.5 的「已有最大 attempt + 1」。

### 2.4 A69 helper token 重复要求由 `{decision, user_decision}` 收窄为 `decision`（F-039，E-052/E-053）

这是本轮唯一需要逐字核合同的改动，我独立核过 design 原文：

| design 位置 | 冻结样张 | 是否带 helper token |
|---|---|---|
| §9.3 strategist 链 | `escalate coder#1 note=strategist=strategist#1 原因=rework 达 max_rounds=2` | **是** |
| §9.3 strategist 链 | `decision coder#1 note=strategist=strategist#1 strategy.1.md` | **是** |
| §9.3 strategist 链 | `user_decision coder#1 note=用户裁决：继续，按 strategy.1.md 收窄本卡范围` | **否** |
| §9.3 strategist 链（停卡） | `user_decision coder#1 note=用户裁决：停卡，本卡转 backlog` | **否** |
| §9.4 decider 链 | `escalate coder#1 note=decider=decider#1` / `decision coder#1 note=decider=decider#1 decision.2.md 含「需要改计划」` | **是** |
| §9.4 同意改计划 | `user_decision coder#1 note=approve-amend: 用户同意 decision.2.md（含改计划）` | **否** |
| §9.4 否决改计划 | `user_decision coder#1 note=reject-amend: 不拆步，先按原 task_plan 用桩接口跑通再说` | **否** |
| §3.4 note 约定 | `user_decision` 的 note = `approve-amend:` / `reject-amend:` / 方案不含改计划时自由文本 | **否** |

- **偏离判定**：**不偏离，是修正一处此前的过度收紧**。整改前的实现会把 design **自己的 7 条冻结样张里的 3 条 `user_decision`** 全部判 `A69` 退 2——即旧行为与冻结样张直接互斥。
- **与 `A69` 取证配方一致**：§11.1 `A69` 的怎么证明栏写「升级链断言**三条事件的 `agent` 字段**」，冻结的是 **ownership（记在被阻塞 agent 名下）**，不是 note token。整改后 `user_decision` 仍受 owner 闸约束（必须是触发链上的原 agent），并仍必须走 `resume` 才能 `done`（`A60`），**该收的没放**。
- **残留文本张力（新登记，见 §4.5）**：§3.4 散文句「`escalate` / `decision` / `user_decision` 记在被阻塞 agent 名下、**决策 agent 的标识写进 note**」在字面上把三者并列，与同章节的 note 约定和 §9.3/§9.4 样张不一致。本卡按「样张 + `A69` 取证栏」解释，是可辩护且唯一自洽的读法，但建议登记以免 RLT_05/RLT_09 再次收紧。

### 2.5 测试侧改动的方向核

- 负例断言由绑定诊断 detail 文案（如 `cannot read relay_plan\.md:`、`first line must be`）收窄为只断言 `^error: HC-RL-Axx `（F-042，E-054）。**方向正确**：`A63` 冻结的是「stderr + `error: <code> <message>` 格式」，**不冻结 message 文本**；绑定未冻结文案会产生假红。隔离探针只改 4 处 detail 后 3 个目标测试仍 `exit 0`，真实树全绿——判别力保留在 code/退出码/零写入上。
- 新增 `test_unicode_line_separators_round_trip_as_json_string_content`（docstring 标 `A38/A56`）、`A49` 重拉资格反例、8 处稳定 HC-ID 断言（F-041）。**均在 42-ID 闭集内，无新 ID、无越界。**

### 2.6 整改后的越界复核（独立复跑）

| 检查 | 结果 |
|---|---|
| 全量回归（scratchpad 隔离副本，`PYTHONDONTWRITEBYTECODE=1`） | `Ran 54 tests in 29.447s` / `OK`，**与 E-053/E-057 声明一致**，0 skip |
| RLT_05 泄漏（`open_stages`/`suggested_action`/`last_stage_result`/`monitor_relaunch`/`idle_seconds`/`superseded_ignored`/`roles.toml`/`dh-mapping`/`rework_max`） | **零命中** |
| 禁用原语（`.lower(`/`.casefold(`/`fcntl`/`msvcrt`/`filelock`/`tempfile`/`os.replace`/`pane`） | **零命中** |
| 公共 CLI 面 | `--help` 实测仅 `{add,status,lint}` |
| 非 owned ID 出现 | 生产仅 `HC-RL-A61`（RLT_05 边界占位注释）；测试 **0** |
| 工作树改动路径 | 仅 `tools/relay-light/*.py` + `workspace/RLT_03/**`，**全部在 `dh:allowed-paths:v1 task=RLT_03` 内** |
| design/01、DevPlan 是否被本轮静默改动以消解冲突 | **否**，`git status` 中两者均无 `M`——**这一点做得对**：没有用越权改设计的方式把 A5/A128/A129 抹平 |

**§2 总判定：E-052~E-057 的 4 处生产改动与测试改动 全部落在 42-ID 闭集内，无一处偏离需求；其中 2.1 / 2.3 / 2.4 是向冻结文本回归的修正，2.2 是必要的 fail-closed 补洞。方向侧对代码整改无异议。**

## 3. 逐条列出仍需主控 / 用户裁决的事项

以下 4 条**均未在本轮闭合**，且**均不属施工可自行处理的范围**——前 3 条要改正式合同文本，第 4 条要范围授权。

### 裁决项 1 ｜`A5`：`lint` 退出码与 §3.1 / `A80` 互斥（对应 `F-016`，状态 open）

- **冲突**：§11.1 `A5` 语句「三个子命令均退出码 **3**」+ 取证栏列「缺文件 / 缺表头 / **节点号重复**」；而 §3.1 退出码表写 `lint` = 「`2` 规则违反；`3` 缺失或解析失败」，§3.5 把「节点号重复」明列为 lint 规则（ID = `A46`），`A80`（**owner = RLT_10**）进一步冻结 `lint` 的 0/2/3 与 `lint: <规则编号> <message>` 格式。
- **实测（初审已复现，本轮未变）**：缺文件、缺表头 → 三命令均 rc=3 ✔；**节点号重复 → `lint` rc=2（`lint: HC-RL-A46 …`），`status`/`add` rc=3**。
- **本轮状态**：`review.md` 完成条件 #12 已如实改为「行为通过；**A5 文本冲突待裁决**」，不再冒充达成。**记录面已合规，合同面仍未裁决。**
- **需要主控/用户二选一**：
  - **(a) 收窄 `A5`（推荐）**：把 §11.1 `A5` 的取证栏「节点号重复」删除或移到 `A46`，语句限定为「缺失或**解析级**失败」。理由：`A80` 是 lint 的专属合同且更具体，`A46` 已单独咬住重复节点号。
  - **(b) 保留 `A5` 字面**：则须改实现让 `lint` 对语义类违规也退 3——但这会与 `A80`（RLT_10 owned）冲突，等于本卡越界改别卡合同，**不建议**。
- **裁决前**：`A5` 与完成条件 #12 **不得勾「达成」**，`F-016` 保持 open。

### 裁决项 2 ｜`A128`：第四个封闭例外 `A120` 归 RLT_09，本卡结构上无法「逐项覆盖」（对应 `F-003`）

- **冲突**：`A128`（RLT_03 owned）要求「显式例外封闭为 `A46` / `A72` / `A75` / **`A120` 表尾-隔断放宽**」且取证栏要求「**逐项覆盖四个例外**」；但 `A120` 的 owner 是 **RLT_09**（DevPlan §6 表），本卡按设计不得实现。
- **现状**：`A46`/`A72`/`A75` 三项已逐项取证；第四项以**其否定形式**存在（本卡严格拒绝表尾追加）。即 3/4 正向覆盖。
- **本轮状态**：`progress.md` 收口句与 `review.md` 完成条件 #4 已改为「实现通过；**A128 第四例外归属待裁决**」。**记录面已合规。**
- **需要主控/用户**：在 §11.1 把 `A128` 的例外清单显式分域，例如「`A46`/`A72`/`A75` 由 RLT_03 逐项取证；`A120` 的放宽由 RLT_09 承接并在该卡取证」。
- **裁决前**：`A128` 与完成条件 #4 只能记「部分闭合（3/4 例外）」。

### 裁决项 3 ｜`A129`：表尾豁免在 design 正文两处为「通过」，§11.1 取证栏为「拒绝」（对应 `F-003`）

**这是三条里方向风险最高的一条**，本轮无变化，重申并补全定位：

| 位置 | 原文取向 |
|---|---|
| §3.5 lint 规则映射表（`A129` 行） | 「……忽略 superseded 行；**§4.5 的追加行落在表尾不算违规**」→ **通过** |
| §4.3 正文 | 「『连续』这条按 stage 分组判定，不看物理行号相邻（为 §4.5 运行中改计划放宽）……**追加行落在表尾也通过**」→ **通过** |
| §11.1 `A129` 取证栏 | 「同 stage 节点被另一 stage 隔断**各一例被拒**」→ **拒绝** |
| `A120`（RLT_09 owned） | 「同一 stage 的节点**追加在表尾通过**、被 superseded 行隔开通过」→ **放宽是设计终态** |

- **本卡取舍**：按 §11 严格拒绝，并用测试钉死。
- **风险**：本卡不是在两个空白读法里选一个，而是**实现了与设计正文两处明文相反的行为并冻结为回归**。`A120` 表明放宽才是终态，因此 RLT_09 将被迫回来**删除/反转** `test_stage_must_be_known_and_grouped_contiguously` 的表尾反例——即「后继卡推翻前卡已签机器项」。
- **需要主控/用户（建议改文本，不只留裁决）**：把 §3.5 该行与 §4.3 那句同步改为「表尾 / 隔断放宽属 `A120`，RLT_09 承接前 lint 严格判定」，使 `A129` 三处口径一致，`F-003` 随之转 resolved。
- **若坚持只留裁决不动文本**：须在 `F-003` 内显式写明跨卡待办——「RLT_09 实现 `A120` 时**必须删除/反转**该表尾反例」——作为交接条款。
- **裁决前**：`A129` 与完成条件 #6 保持「实现通过；表尾规则待裁决」。

### 裁决项 4 ｜`b7f4ecc` 打包边界：5 份治理文档越出本卡允许路径（初审 R-P2-2，**本轮仍未处理**）

- **事实（本轮复核未变）**：`b7f4ecc`（`feat(relay-light): implement RLT_03 plan and ledger core`）除两条 Python 外，另改 `design/01-RelayLight-产品设计与验收.md`、`dev_plan/P1-RelayLight-开发方案.md`、`design/drafts/A04-…`、`design/evidence/05-…`、`dev_plan/drafts/RLT-B-04-…`，共 5 份、336 插入 / 44 删除；核对 `master` 侧确认这些改动由本分支引入。
- **不是内容问题**：RLT-A-04 / RLT-B-04 有用户 2026-09-10 明文「你来写入」授权、fresh Opus 三轮 `APPROVE`、`design/evidence/05` 留痕，`progress.md:21` 已如实登记该步为「主控 RLT-A-04 / RLT-B-04 正式同步」。
- **是打包问题**：治理卡改动与 RLT_03 代码进同一 commit，导致本卡 `git diff master...HEAD` 与 PR #4 携带越出 `dh:allowed-paths:v1 task=RLT_03` 的文件，releasePacket 的「仅允许路径有 diff」自证会失败。
- **本轮进展**：已从「无人提及」变为**公开登记**——`review.md:47` Confidence Challenge 写「越界打包尚未裁决」，`progress.md:28` 写「design/DevPlan 越界冲突仍待主控向用户提交裁决」。**登记合规，但未闭合。**
- **需要主控/用户二选一**：
  - **(a)（推荐）** 在 `progress.md` / releasePacket 显式声明「本 PR 含 RLT-A-04/RLT-B-04 治理同步，已单独授权，路径闸例外在案」，附 `design/evidence/05` 与用户确认时间；
  - **(b)** 把治理文档改动拆成独立 commit。**不建议为此重写已推送历史。**
- **关联**：一致性路径（E-051）另报「as-built owner 状态与 DevPlan A59 数量仍越出本卡允许路径」——**与本项同源**，建议主控一次性向用户提交同一份范围授权请求，不要分两次问。

## 4. 本轮新增 / 剩余次要登记（均 P3，不阻塞）

| 编号 | 级别 | 内容 |
|---|---|---|
| RR-P3-1 | P3 | **§3.4 散文与 §9.3/§9.4 样张对 `user_decision` note 的第 4 处文本张力**（详见 §2.4）。本卡按样张 + `A69` 取证栏解释，是唯一自洽读法。建议在 `F-039` 或 design 勘误里登记，避免 RLT_05/RLT_09 再次把 helper token 扩到 `user_decision` 上 |
| RR-P3-2 | P3 | 新测试 `test_unicode_line_separators_round_trip_as_json_string_content`（docstring 标 `A38/A56`）**未被 Batch-4 矩阵第 10 / 第 16 行引用**。矩阵目前 50 条引用零悬空、4 条测试未被引用；补引更完整 |
| RR-P3-3 | P3 | 完成条件 #15 / #16 的达成列写「**是**（…变异待 E-058）」，而同页「有效单测·变异点登记」表对应两行仍是「待 E-058 / 待审」。两处措辞不齐。建议在 E-058 落盘前把 #15/#16 也写作「待验」，与变异登记表保持一致——避免「机器项已达成」与「有效变异未复验」并存的读感 |
| RR-P3-4 | P3 | 证据账本 E-ID 顺序错位：`E-057` 排在 `E-055`/`E-056` 之前。不影响可追溯性（61 条 ID 全部可定位、被引用零缺失），登记即可 |
| RR-P3-5 | P3 | 初审 R-P3-1（`task_plan` C-007 指 §14，实际 §11.1）与 R-P3-2（`A18` 只强制 `skill=`，`config_dir=`/`plan=` 归 `A99`/RLT_05）、R-P3-3（DevPlan 抬头落后一步）**均未处理，结论不变**，继续登记 |
| RR-P3-6 | P3 | HC-ID 锚点从 16 缺降至 10 缺（`A5 A37 A39 A40 A41 A42 A50 A51 A56 A63`），剩余均为静态/字节/退出码类，无锚合理。建议留给 RLT_10 建全量测试入口时统一补 docstring 级锚点 |

## 5. 结论（已修项与剩余 blocker 分开）

### 5.1 已修项 —— 本路径确认闭合

| 初审项 | 级别 | 复验结论 |
|---|---|---|
| R-P1-4 `review.md` 完成条件表口径过期、会误签 RLT_05/RLT_07 | P1 | **CLOSED**。16/16 与 brief 一致，4 处旧口径全改，证据列零待填，误签风险消除 |
| R-P2-1 需求境证据仍是开工占位 | P2 | **CLOSED**。四件套 4 行齐备，证据 ID 全部可定位，人验项明记「未签收；AI 不代签」 |
| R-P2-3 HC-ID 锚点不足 | P2 | **降级为 P3**。锚点 26→32，矩阵零悬空 |
| 代码整改方向（E-052~E-057） | — | **无异议**。4 处生产改动全部在 42-ID 闭集内；2.1/2.3/2.4 是向冻结文本回归的修正，2.2 是必要 fail-closed；54 tests 独立复跑 OK；RLT_05/07/09 零泄漏；design/DevPlan 未被静默改动 |

另需明确肯定一点：`progress.md` 把矩阵收口句从「全部闭合、无 blocker」改为「已建立**测试映射**，当前**不能写全部闭合**」，以及 `review.md` 完成条件 #4/#6/#12 改为「实现通过；××待裁决」——**这是本轮最关键的合规动作**，把「实现通过」与「合同闭合」两件事拆开了，不再有冒充结果通过的表述。

### 5.2 剩余 blocker —— 仍需主控 / 用户裁决，本路径不得代签

| # | 事项 | 级别 | 归属 | 闭合动作 |
|---|---|---|---|---|
| 1 | `A5` 的 `lint` 退出码与 §3.1 / `A80`(RLT_10) 互斥 | **P1** | 正式合同（design §11.1 文本） | 收窄 `A5` 取证栏（推荐 (a)）；`F-016` 转 resolved |
| 2 | `A128` 第四例外 `A120` 归 RLT_09，本卡无法逐项覆盖 | **P1** | 正式合同（design §11.1 文本） | 在 `A128` 显式分域 owner |
| 3 | `A129` 表尾豁免：§3.5 + §4.3「通过」vs §11.1「拒绝」，本卡冻结了 RLT_09 必须反转的行为 | **P1** | 正式合同（design §3.5 / §4.3 / §11.1 三处） | 建议改文本使三处一致；否则须在 `F-003` 写明 RLT_09 反转条款 |
| 4 | `b7f4ecc` 把 5 份治理文档并入本卡 commit，越出 `allowed-paths` | **P2** | 范围授权 | 显式声明路径闸例外（推荐 (a)）；与一致性路径的 as-built/DevPlan 越界一并向用户提交 |

四项**均不需要施工返工、不需要再改代码**；1~3 是改正式合同文本，4 是补一条范围授权声明。

### 5.3 本路径判定

**CHANGES_REQUESTED（需求方向 · 复验轮）**

方向面已经很干净：42-ID 闭集精确、代码整改零偏离、RLT_05/RLT_07/RLT_09 边界未越、记录面不再过度宣称、无代签。初审 4 条中 **3 条已闭合**（R-P1-4、R-P2-1 CLOSED，R-P2-3 降 P3）。

不转 APPROVE 的唯一原因是 **§5.2 的 4 条仍在**：3 条正式合同文本冲突（`A5` / `A128` / `A129`）与 1 条打包范围授权（`b7f4ecc`）。这 4 条决定的是**能不能签**，不是**做得对不对**——它们落定后本路径即可转 APPROVE，无需再看代码。

另有 F-043 的最终有效变异复验（E-058 / `rlt03-code2b-opus`）仍在进行中，属代码轮 2 路径，本路径不代为裁决、不计入需求方向结论。

**再次声明：本报告是需求方向复验，不构成任何机器项的验收通过，不解锁 verify / merge / 人类签名区；`A5` / `A128` / `A129` 与打包边界须由主控向用户提交裁决后方可勾选。**
