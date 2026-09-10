<!-- dh:v1 · review-report -->
# RLT_03 收口复核 · 需求方向路径 **原路径复验 #2**（Astra REVISE 合同同步后）

## 0. 身份与形态

| 项 | 值 |
|---|---|
| review_path_id | `requirement_direction`（第 3 轮：初审 → 复验 → **本轮同步后复验**） |
| 派出证据 | E-071（`herdr agent prompt rlt03-req-opus`｜Astra REVISE contract sync final requirement-direction recheck） |
| pane / session | `HERDR_PANE_ID=w15:pC`；`HERDR_TAB_ID=w15:t1`；`HERDR_WORKSPACE_ID=w15`；`HERDR_SESSION=kpi-agg`；`CLAUDE_CODE_SESSION_ID=6db9d3e6-527d-4d2e-a624-3ebca7aaaf6b` |
| 自报模型 | Claude Opus 5（`claude-opus-5`） |
| 启动形态 | Claude Code CLI 子会话（`CLAUDE_CODE_CHILD_SESSION=1`、`AI_AGENT=claude-code_2-1-267_agent`），Herdr pane 内 worker；未加载 dev-harness skill、未派活、未起子 agent、未问用户 |
| branch / HEAD | `wt/RLT_03` / `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc`（HEAD 未动；E-070 为 working-tree doc-only 同步） |
| 被复验代码 hash（本轮独立复算） | `relay_log.py` `sha256=f484ffba38504424d5be3c3080b71d83186e31c0d5c6b6e5ed01cbbf117ceb1e`；`test_relay_log.py` `sha256=8c2098fcb0e59bb18dcaa9a6912da2373d71b315252fa32a85c531a7e2300dbd`——**与 Astra 报告及 E-070 记录逐字符一致，确认合同同步为零代码改动** |
| 时间 | 2026-09-10T19:37+08:00 |
| 本报告性质 | **方向复验结论，不是验收通过**；不代签任何机器项，不解锁 verify / merge / 人类签名区 |

读过：仓根 `AGENTS.md`；`reviews/closeout-contract-decision-astra.md`；本卡 `brief.md` / `task_plan.md` / `progress.md`（含 E-070 与 b7f4ecc 治理记录）/ `findings.md` / `review.md` / `lesson_candidates.md`；本人前两份报告 `closeout-requirement-direction-opus.md`、`closeout-requirement-direction-recheck-opus.md`；正式 `design/01`（§3.1、§3.5、§4.1、§4.3、§4.5、§11.1）、`dev_plan/P1-RelayLight-开发方案.md`（RLT_03 卡、RLT_09 卡、§6 owner 表、允许路径块）、`as-built/现役Runner一致性对照.md`；当前七文件 working diff 与两条 Python diff。

只读复核。除本报告外未修改任何文件；未 commit / push；探针与全量测试在 scratchpad 隔离副本执行，工作树未新增 `__pycache__`。

## 1. 逐项核验

### 1.1 A5 命令边界是否与 A46 / A80 / 实现一致 —— **一致，三方零冲突**

**落账文本**：design §3.1 新增「命令边界（A5 勘误）」段；§11.1 A5 行改写；DevPlan RLT_03 A5 行、brief #12、review #12、progress 矩阵 #12 同步。

**本轮独立真 CLI 探针**（scratchpad 隔离目录，五种形态 × 三命令）：

| 形态 | `lint` | `status` | `add` | 账本 |
|---|---|---|---|---|
| 缺 `relay_plan.md` | rc=3 `error: HC-RL-A18 cannot read…` | rc=3 同 | rc=3 同 | 未创建 |
| 缺 marker（首行非 marker） | rc=3 `error: HC-RL-A18 first line must be…` | rc=3 同 | rc=3 同 | 未创建 |
| 缺节点表表头 | rc=3 `error: HC-RL-A24 missing or repeated fixed table header: node…` | rc=3 同 | rc=3 同 | 未创建 |
| 表结构不合法（缺 agent 表） | rc=3 `error: HC-RL-A24 …: agent…` | rc=3 同 | rc=3 同 | 未创建 |
| **已解析但违反 lint 规则**（节点号重复） | **rc=2** `lint: HC-RL-A46 line 7: duplicate node W1` | **rc=3** `error: HC-RL-A46 …` | **rc=3** `error: HC-RL-A46 …` | **未创建（零写入）** |

三方一致性逐条核：

- **与新 A5 文本一致**：解析级四形态三命令一律 3 ✔；已解析后规则违反 `lint`=2 / `add`+`status`=3 ✔；拒绝路径账本不增行 ✔；`add` 自身入参非法（A59 等）仍走 2 ✔（`test_agent_authorization_has_four_exempt_prefixes_and_active_nodes` 等覆盖）。
- **与 A46 一致**：节点号重复现由 `HC-RL-A46` 报错，A5 的取证栏已把该例移出。**这消除了原冲突的根源**——重复号本就是 §3.5 lint 规则映射表里 A46 的行，不该同时充当 A5 的「解析失败」示例。
- **与 A80（RLT_10 owned）一致**：`lint` 保持 0/2/3 三态，违反项走 stderr 且格式为 `lint: <规则编号> <message>`（实测 `lint: HC-RL-A46 …`）。**未越界改写 A80、未据此宣称 RLT_10 完成**——Astra 第 1 项对此的两条限制均被遵守。
- **未泛化**：没有把「规则违反为 2」扩散到 `add`/`status`；也没有把 `add` 自身的时序/词表校验并进这条分流。

**结论**：`F-016` 的互斥文本已在正式合同层消解，实现无需改动即满足新文本。

### 1.2 A128 是否保留本卡核心 + 三个本卡例外，且只把 A120 增量/集成取证给 RLT_09 —— **符合 Astra 修订句，未把 A128 变成无人负责**

**落账文本**（design §11.1 A128 行 + DevPlan RLT_03 A128 行 + brief #4 + review #4 + progress 矩阵 #4）逐要素核对 Astra §3.2 的推荐替换句：

| Astra 要求 | 落账文本 | 判定 |
|---|---|---|
| RLT_03 仍须完整证明 A128 **主命题**（活跃 parser/lint 忽略 superseded） | design 写「parser/lint 派生活跃计划时忽略 superseded 行（**本卡核心命题**）」；DevPlan 写「**本卡核心**为 …（含/不含的结构与退出码对照）」 | ✔ 主命题未被「只数三个例外」取代 |
| 逐项证明 A46 / A72 / A75 三个本卡例外 | design 取证栏「A46 / A72 / A75 逐项覆盖」；brief #4 同 | ✔ |
| A120 降为**跨卡兼容性引用**，其新增放宽与完整「两正四反」集成取证归 RLT_09，且**不作为 RLT_03 已实现能力** | design：「A120 是**跨卡兼容性引用**，其表尾追加放宽与完整「两正四反」集成取证由 RLT_09 独占，**不作为 RLT_03 已实现能力**」 | ✔ 逐字对应 |
| **四项约束清单不增不减** | design 写「显式例外清单**不增不减**」；A120 未从清单删除 | ✔ |
| RLT_03 已有的「superseded 隔行通过」保留，由 RLT_09 在 A120 下复验，**不重复发 owner** | design 取证栏明写该句；owner 表复核：A128→RLT_03、A120→RLT_09 各出现**恰好一次**，全表无重复 ID 行 | ✔「验收 ID 正好一次」未破 |

**本轮独立行为探针**（A128 主命题直证）：同一计划含/不含一条 superseded 节点行（`X9 … superseded-by:C1` + 对应 agent 行 `superseded`）：

- `lint`：两侧均 rc=0 / `lint: ok`；
- `status --json`：两侧均 `{"current_stage": null, "current_node": null, "pending_nodes": ["W1", "C1"]}` —— **活跃结构与退出码完全相等**。
- 四项硬约束抽查未被放宽：`depends_on` 指向 superseded 仍 rc=2 `lint: HC-RL-A72 line 8: dependency X9 is superseded`；节点号重复仍 rc=2 `HC-RL-A46`（见 §1.1）。

**结论**：A128 在本卡是**完整命题 + 三例外逐项**，而非「四例外只做三个」；A120 的能力增量与集成取证清晰交给 RLT_09，交接的是能力边界不是签收责任。

### 1.3 A129 是否保留 superseded 隔行当前通过、仅把合法表尾增量延至 A120、且未削弱运行中追加终态 —— **三条全部满足**

**落账位置共五处**：design §3.5 映射行加注 + §3.5「阶段性交付注记」、§4.3 引用块注记、§4.5.4「lint 放宽」行加注、§11.1 A129 行改写；DevPlan RLT_03 A129 行 + RLT_09 目标 + A120 行。

**本轮独立行为探针**（隔离目录，真 CLI `lint`）：

| 形态 | 期望（新文本） | 实测 |
|---|---|---|
| 同一 `stage_id` `DHR_90:C#1` 被**一条 superseded 行**（`X9 … superseded-by:C2`）隔开后重现 | **当前即通过** | **rc=0 / `lint: ok`** ✔ |
| 同一 `stage_id` `DHR_90:C#1` 被**活跃** `DHR_90:R#1` 隔断后重现 | 按基础规则拒绝并报 A129 | **rc=2 / `lint: HC-RL-A129 nodes for a stage instance are not grouped contiguously`** ✔ |

三条逐一判定：

1. **superseded 隔行当前通过 —— 保留，未被削弱**。Astra §3.3 的红线（「把这项延迟到 RLT_09 会退化现有 A128/A129，不能接受」）被守住：实现先做 `active_nodes` 过滤再查连续性，探针 rc=0 直证；design/DevPlan/brief/review 四处文本都把它写成「**当前即通过**」而非留待 RLT_09。
2. **只把「合法同 stage 表尾追加」的放宽延至 RLT_09 / A120**。design 注记写明「**只放宽连续性这一条**，其余四项硬约束不放宽」；A120 的 design 行本身**一字未改**（两正例 + 四反例完整），owner 仍是 RLT_09 唯一。产品终态在 §3.5 / §4.3 / §4.5.4 三处均以「产品终态」明标后保留，而非删除。
3. **运行中追加的终态承诺未缩水**。§4.5「追加节点谁接手」原文（当前阶段实例内由当班监工接手、后续阶段由编排开到时按常规处理）**未被改动**；§4.3 注记明写「**RLT_03 的临时拒绝不代表最终产品禁止运行中追加**——§4.5 的终态承诺（…并由 RLT_16 / RLT_19 实跑证明）保留不变」；DevPlan RLT_09 目标句新增「A120 的两项连续性放宽由本卡交付」，且 A120 验收行补齐 Astra 要求的**五条交接断言**（①superseded 隔行始终通过 ②合法表尾追加前后「拒绝→通过」③四项硬约束保持拒绝并报有效编号 ④既有 A46/A72/A75/枚举与依赖回归保持 ⑤RLT_16/RLT_19 实跑）。Astra §3.2 点名禁止的四种缩水形态（停机重建计划 / 必须重开阶段 / 手工插回中间 / 另设第二个人工批准闸）在落账文本中**均未出现**。
4. **`C1→R1→C2` fixture 的处理已按 Astra 校正**：DevPlan A120 行明写该 fixture 因 `C2.depends_on=R1` 同时违反硬约束、**不承诺原样翻绿**，要求 RLT_09 另造「满足全部其他规则、只有表尾位置差异」的合法追加正例。我在前一份报告里写的「RLT_09 必须删除/反转该表尾反例」这一表述**由 Astra 校正为更精确的版本，本轮采纳该校正**。
5. **未另增同义 ID**：design §11 的「共 122 条」计数与退役 ID 清单未变；owner 表仍 122 条、RLT_03 仍恰好 42 个、无重复行。A129 以「基础规则 + A120 优先例外」的适用域澄清保留，符合 Astra 的 ID 处理建议与 design 稳定 ID 规则。

### 1.4 b7f4ecc 例外是否精确且不弱化 allowed paths —— **精确，且未弱化**

**独立复算**：`git show --numstat b7f4ecc` 过滤掉两条 Python 与本卡 workspace 后，越界治理差分**恰为五份**，逐份增删与 progress 治理记录表、Astra §3.6 表**逐格一致**：

| 路径 | 实测增/删 | 记录值 |
|---|---:|---:|
| `design/01-RelayLight-产品设计与验收.md` | 25 / 18 | 25 / 18 |
| `design/drafts/A04-RLT03与RLT05验收边界修订候选.md` | 117 / 0 | 117 / 0 |
| `design/evidence/05-交叉审核记录-RLT03与RLT05验收边界.md` | 87 / 0 | 87 / 0 |
| `dev_plan/P1-RelayLight-开发方案.md` | 30 / 26 | 30 / 26 |
| `dev_plan/drafts/RLT-B-04-…-调整候选.md` | 77 / 0 | 77 / 0 |
| **合计** | **336 / 44** | **336 / 44** |

不弱化的四条逐一验证：

- **原 allowed-paths 一字未动**：DevPlan `dh:allowed-paths:v1 task=RLT_03` 仍是三条（`relay_log.py`、`test_relay_log.py`、`workspace/RLT_03/**`），**未添加 `design/**`、`dev_plan/**` 或模块级目录，无通配** ✔
- **范围严格限定**：治理记录明写「**仅**上述五份的**既有差分**，作用域为该次已推送打包；**不是**这五个文件此后的任意内容，**不**产生未来继承」，并明确本次 doc-only 同步的七路径**另行单独授权、不从本条推导** ✔
- **不伪称机械闸通过**：明写「若机械闸不消费本例外，必须保留原始 fail 与有权裁决记录，**不得**伪称原检查通过」，releasePacket 分两项报告 ✔
- **不与 §4.5 白名单混淆、不追认、不改历史**：明写本例外**不是** planner-amend 白名单放宽（A122 对 `design/` 整目录禁入保留），不追认未单独授权的写入，不 rewrite / rebase / force-push ✔

提交全号与父提交（`b7f4ecc…7ceb1131` / `baf2aad6…`）、授权出处（evidence/05 的 A04「嗯，授权」与 B04「你来写入」）均已登记且可机械核对。

### 1.5 brief / review 是否有方向偏移或过度宣称 —— **无方向偏移；过度宣称仅剩一处（见 §2 P1-1）**

| 检查 | 结果 |
|---|---|
| brief 16 条展开后的 HC-ID 闭集 | **42 个，与 DevPlan §6 owner 表判给 RLT_03 的集合完全相等**（缺 0 / 多 0）；owner 表总数仍 122、无重复 ID 行 |
| brief 改写是否改变闭集 | 未改：#4 / #6 / #12 / #14 为**口径细化**（A128 主命题+三例外、A129 基础边界、A5 命令边界、A59 四类豁免），四条涉及的 ID 与原先完全相同 |
| brief 边界段 | Out of scope 已补 **RLT_07 五阶段模板** 与 **RLT_09 运行中改计划（A119~A123）与 A120 表尾追加放宽**，与 §1.2/§1.3 的分域一致 ✔ |
| brief ↔ review 完成条件逐条比对 | 16/16 语义一致；唯一字面差为 #8「缺省**为** auto」/「缺省 auto」，同义 |
| review 完成条件达成列 | #4 / #6 / #12 写「实现通过 / 行为通过 + 待原路径复验」，未因合同落账就改勾「是」——**克制得当** |
| review 合同补充落账段 | 六项落点与 Astra 的 ACCEPT×3 / REVISE×3 对应正确，明写「doc-only、零代码改动」「不代表整卡验收 / verify / 合并 / 下一卡开工」 |
| review Confidence Challenge | 明写「仍不能把『实现全绿 + 合同已同步』扩大为『整卡可验收』」 ✔ |
| 人类签名区 / 材料齐 / as-built 勾选 | 三处 `[ ]` 均未勾；状态「收口复核中（未验收、未签收）」；**无代签** ✔ |
| DevPlan RLT_03 状态列 / RLT_05 状态 | 仍「进行中」/「未开始」，未被本批改动 ✔ |
| 全量回归（本轮独立复跑，隔离副本） | `Ran 54 tests in 34.358s` / `OK`，0 skip ✔ |

## 2. findings

### P0：无

### P1-1 ｜`review.md` 验收项元数据行把「需求」列入 APPROVE，会被读成需求路径已 APPROVE

**位置**：`review.md` 「验收项元数据表」→ `实际执行结果` 列。

**原文**：

> 54 tests OK；代码轮 1/2、**需求初复验**与 lessons APPROVE；A5/A128/A129 及 as-built owner 已按 Astra REVISE doc-only 落账；**需求/一致性原路径复验未做**

**事实**：需求方向路径至今**从未给出过 APPROVE**——

| 轮次 | 报告 | 结论 |
|---|---|---|
| 初审（E-049） | `closeout-requirement-direction-opus.md` | **CHANGES_REQUESTED** |
| 复验（E-059） | `closeout-requirement-direction-recheck-opus.md` | **CHANGES_REQUESTED** |
| 本轮（E-071） | 本报告 | 见 §3 |

**为什么是 P1 而不是 P3**：

1. **该句会被读成需求路径已放行**。「代码轮 1/2、需求初复验与 lessons APPROVE」是一个并列枚举，字面把三条路径都归入 APPROVE。**代码轮 1/2 与 lessons 确实是 APPROVE，需求不是**——真假混排的枚举比整句错误更容易被当真。
2. **它与同一文件另两处自相矛盾**：同页「需求复核结论」行明写「**结论仍为待复验**……AI 不据此勾完成、不代签」；同一单元格结尾又写「需求/一致性原路径复验未做」。一个单元格里同时说需求 APPROVE 和需求复验未做。
3. **落点是验收项元数据表**，即 releasePacket 直接取数的地方。heavy Recipe 要求五路收敛，若此行被当作「需求路径已 APPROVE」，会把「五路收敛」的判断建立在一条不存在的结论上。

**另一处同单元格的反向失准（并入本项一并修）**：「需求**/一致性**原路径复验**未做**」低估了已完成的工作——需求路径的原路径复验（E-059）**已做并已落盘**；当时未做的是**对同步后正文**的复验（即本轮 E-071）。

**建议改法**（仅改这一个单元格，不动其余）：

> 54 tests OK；代码轮 1/2 与 lessons `APPROVE`，**需求方向两轮均为 `CHANGES_REQUESTED`（E-049 / E-059），其前置已由 Astra REVISE 落账**；A5/A128/A129 及 as-built owner 已按 Astra REVISE doc-only 落账；**对同步后正文的需求方向复验见 E-071，一致性见 E-072**

**注**：`review.md` 不在本路径写权限内，本项只报不改。

### P2：无

本轮未发现 P2。前两轮的 P2（需求境占位、`b7f4ecc` 打包边界、HC-ID 锚点）均已闭合或降级。

### P3-1 ｜矩阵未引用新测试

`test_unicode_line_separators_round_trip_as_json_string_content`（docstring 标 `A38/A56`）仍未被 Batch-4 矩阵 #10 / #16 引用。矩阵当前 50 条引用**零悬空**（本轮复算），4 条测试未被引用。补引更完整，不阻塞。

### P3-2 ｜HC-ID 锚点剩 10 处

`A5 A37 A39 A40 A41 A42 A50 A51 A56 A63` 在测试源码无 HC-ID 文本锚点（32/42 已有）。均为静态 / 字节 / 退出码类断言，无锚合理；建议留给 RLT_10 建全量测试入口时统一补 docstring 锚点。

### P3-3 ｜证据账本 E-ID 顺序错位

`E-057` 仍排在 `E-055` / `E-056` 之前。72 条 E-ID 全部可定位、被引用零缺失，不影响可追溯性。

### P3-4 ｜前两轮 P3 沿用

`task_plan.md` C-007 仍指「design/01 §14 中 RLT_03 验收表」（实际 §11.1）；`A18` 只强制 `plan_loaded` note 含 `skill=`，`config_dir=` / `plan=` 归 `A99`（RLT_05），属已登记的前向变更点；§3.4 散文与 §9.3/§9.4 样张对 `user_decision` note 的张力（本卡按样张 + A69 取证栏解释）。三项结论不变，继续登记。

## 3. `F-003` / `F-016` 能否置 `resolved`

### F-016（A5 命令边界）—— **需求方向路径确认：可 resolved**

原 finding 的活动内容是「`HC-RL-A5` 与 `A120` 的互斥文字仍需主控/后续设计裁决」。本轮核实：

- 互斥根源（A5 取证栏把「节点号重复」当解析失败示例）已删除，重复号归 A46；
- A5 新文本与 §3.1 退出码表、`A80`（RLT_10）的 `lint` 0/2/3 合同**三方一致**；
- 实现无需改动即满足新文本，**五形态 × 三命令真 CLI 探针全部符合**（§1.1），且拒绝路径零写入；
- DevPlan / brief / review / progress 四处活动口径已同步，无残留旧句。

**本路径的闭合前提已满足。**

### F-003（A129 表尾豁免 / A128 第四例外）—— **需求方向路径确认：可 resolved**

原 finding 的活动内容是「design §3.5 与 §11 对 A129 是否含 §4.5 表尾豁免存在文本分歧」。本轮核实：

- 分歧的五处落点（§3.5 映射行、§3.5 注记、§4.3、§4.5.4、§11.1 A129 行）现**全部携带同一口径**：产品终态保留 + 阶段性交付基础 lint；
- 基础边界「先忽略 superseded」被写死，**superseded 隔行当前即通过**（rc=0 实测），未退化既有 A128/A129 能力；
- 仅「合法同 stage 表尾追加」的放宽延至 RLT_09/A120，A120 design 行未改、owner 唯一，DevPlan RLT_09 卡补齐五条交接断言与 fixture 校正；
- §4.5 运行中追加终态承诺（当班监工接手 / 编排重读 / RLT_16、RLT_19 实跑）**逐条保留，无缩水**；
- A128 保住主命题 + 三例外逐项，第四例外降为跨卡兼容引用而非删除，清单不增不减，「验收 ID 正好一次」未破。

**本路径的闭合前提已满足。**

### 置位建议

两条 finding 的现状文本都写着「待**需求方向与一致性**原路径复验收敛后闭合」，即闭合条件挂了**两条路径**。本报告只能为**需求方向**这一半签字：

> **需求方向路径判定：`F-003` / `F-016` 的实质条件已全部满足，本路径同意置 `resolved`。**
> 最终从 `resolved-pending-recheck` 翻到 `resolved`，还需一致性原路径（E-072 / `rlt03-sol2`）对同步后正文出具收敛结论——**那不是本路径可以代签的**。若一致性路径亦收敛，两条 finding 即可置 `resolved`，无需再回到需求方向。

## 4. 结论

### 4.1 已闭合（本路径确认）

| 前两轮 blocker | 级别 | 本轮判定 |
|---|---|---|
| `A5` 与 §3.1 / `A80` 互斥 | P1 | **CLOSED**：三方一致，实测五形态×三命令符合，零写入 |
| `A128` 第四例外归属 | P1 | **CLOSED**：主命题 + 三例外在本卡，A120 增量/集成归 RLT_09，清单不增不减，ID 正好一次 |
| `A129` 表尾豁免文本分歧 | P1 | **CLOSED**：五处口径统一；superseded 隔行实测 rc=0 未削弱；仅合法表尾增量延至 A120；运行中追加终态承诺逐条保留 |
| `b7f4ecc` 打包越界 | P2 | **CLOSED**：五份 patch 增删逐格复算一致；allowed-paths 三条一字未动、无通配、无未来继承、不伪称机械闸通过 |
| 需求境证据占位（第 2 轮） | P2 | 保持 CLOSED |
| `review.md` 旧口径（第 1 轮） | P1 | 保持 CLOSED；本轮 brief↔review 16/16 一致 |

另确认：42-ID 闭集完整、owner 表 122 条无重复、零代码改动（两条 Python sha256 与 Astra / E-070 记录逐字符相同）、54 tests 独立复跑 OK、RLT_05 / RLT_07 / RLT_09 边界未越、DevPlan 状态与 RLT_05 未开工状态未被改动、人类签名区未勾。

**Astra 的六项裁决在需求方向维度上落账准确**：ACCEPT 的第 1/4/6 项按原句落地；REVISE 的第 2/3/5 项按**修订后**的句子落地，没有出现「按原提案句落地却称已采纳 REVISE」的偷换。第 5 项（as-built）Astra 点名的两处遗漏——关闭表第 1 行的 `node_close` 双条件归属、事件表第 1 行的 Herdr 边界——均已逐句语义校正，而非 `RLT_04→RLT_03` 字符串替换。

### 4.2 剩余

**唯一 P1：`review.md` 验收项元数据行的「需求初复验……APPROVE」**（§2 P1-1）。这是一处**事实陈述错误**，会让读者认为需求方向路径已放行，且与同文件两处表述互相矛盾；落点又恰是 releasePacket 取数的元数据表。改动量为**一个单元格**，无需碰代码、无需碰其他文本。

三项 P3 均为登记项，不阻塞。

### 4.3 本路径判定

**CHANGES_REQUESTED**

需要说清楚这个判定的性质：**方向面已经全部合格**——四条历史 blocker 本轮全部 CLOSED，合同文本、实现行为、brief/review 口径与 42-ID 闭集四者自洽，未发现任何方向偏移、越界实现或范围缩水。若不是那一行元数据，本轮就是 APPROVE。

之所以仍判 `CHANGES_REQUESTED`，是因为剩下的这条 P1 恰好是**关于本路径自己的结论被写错**：文档里写着需求路径 APPROVE，而需求路径两轮都是 CHANGES_REQUESTED。这种错误不能由我在报告里说明一句就算数——它必须从 `review.md` 里改掉，否则收口时机械读该表的人会拿到一个不存在的放行结论。

**改掉那一个单元格后，本路径即转 `APPROVE`，无需再复验其他内容。** `F-003` / `F-016` 在需求方向维度已可置 `resolved`，最终翻转等一致性路径（E-072）收敛即可。

**再次声明：本报告是需求方向复验，不构成任何机器项的验收通过，不解锁 verify / merge / 人类签名区；RLT_03 未验收，DevPlan RLT_03 未完成，RLT_05 未开始。**
