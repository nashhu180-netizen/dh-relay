<!-- dh:v1 · review.md — 验收。🔴 收尾填。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — RLT_22 复核触发改非终态「待复核」信号与节点内返工生命周期

> **建工作区期只预填「复核路径登记」与「验收靶子」。证据列、结论列、达成列与人类签名区结果列一律留空，AI 不得预勾、不得代签**（宪章#4 / G5）。
> RLT_22 `task_type=normal`，卡上**不带** `dh:review-policy:v1`、**不带** `dh:review-scope:v1` marker，故代码复核走存量路径、三路分流不派生。normal 档「几路」的三份来源互相打架，已登记 `findings.md` **F-005**，由编排/用户裁一次；**施工方与复核方均不得自行降路或合路**。
> 施工者不复核自己的卡；批次小审者不得兼任同批的 normal 复核路径。

## 预测变更面（开工 predict 时点，五个布尔位为人声明；`changed_files` 记 `—`，收口 recompute 由机器直取 Git diff）

<!-- dh:change-surface:v1 task=RLT_22 phase=predict -->

| 字段 | 值 |
|---|---|
| changed_files | — |
| touches_architecture_or_contract | true |
| touches_permission_security_or_metric | false |
| touches_shared_definition | true |
| carries_prior_finding_refs | true |
| lesson_candidates_nonempty | false |

依据（人声明的理由，非机器推导）：trigger 词表由三态扩四态、`checkpoint` 与 agent `done` 新增语义合同，属**运行时契约**变更；判定角色闭集与三个 note token 的 wire format 被所有 W/C/X 计划共享，属**共享定义**；输入直接承接 `workspace/RLT_12/findings.md` 的 **F-008**（prior finding）；不触及权限、安全与指标口径；开工期教训候选为空。

## 复核路径登记（normal Recipe · 靶子在开工时钉死，结论收口时填）

| 路径 | 时序 / 独立性 | 必审靶子 | reviewer | 派出证据 (e:E-xxx / log:路径) | 结论 | 证据 (E-xxx) |
|---|---|---|---|---|---|---|
| code-round1 | 三批小审闭合、`CONSTRUCTION_DONE` 之后；fresh，非施工者、非小审者 | 整卡 diff。重点六项：①A146 的**执行位点**确在 agent `done` 的语义校验一线而非 `_validate_node_close`；②新校验一律用 `_latest_for_instance`，无一处沿用 `_latest_by_name`；③`_note_tokens`「首个同名 key 胜出」行为未改，重复 token 拒在写入侧；④`_validate_agent_transition` 迁移表、`Status` / `status_document`、`roles.toml`、`dh-mapping.toml` 的键与取值零改动；⑤`on:done:` 分支与 A70 逐字一致；⑥反例编号不串（重复 `agent_launch` 报 A58/A49，终态后挂事件报 A60） | rlt22-review（devin swe-2-max，fresh，非施工者非小审者） | log:dispatch/review.md | APPROVE（R 批 APPROVE_WITH_NITS：P2×1 畸形 `ready_seq` Unicode 数字退 1 破退出码合同、P3×1 陈旧注释——均经 X1 批 `2a8f7e6` 整改并由同复核者复看闭合） | review.code-round1.md |
| requirement（需求方向） | normal Review Batch 独立路径 | 逐字对齐 design/01 §11 的 `HC-RL-A144`~`A150` 七条「怎么验」列；核 A35/A65/A71/A107 四条修订的承接证据是否到位；核卡「非目标」六条（A2/A62/A95/A102 不改，A49/A60/A70 不豁免不削弱，R 模板不动，不强制迁移）逐条有反向证据；核 A102 是否由 A145 正例**显式**证明而非假定继承（findings F-006） | rlt22-review2（devin swe-2-max，fresh，非施工者非小审者非 code-round1 复核者） | log:dispatch/review.md | APPROVE_WITH_NITS（P2×1：与 code-round1 P2-1 同源，`ready_seq` Unicode 数字走未捕获 ValueError 退 1 破退出码合同，fail-closed 不削弱枚举反例，在飞修复未提交；P3×3：上游措辞差/并发变异假红环境项/陈旧注释） | review.requirement.md |
| lesson（教训） | normal Review Batch 独立路径 | 核 `lesson_candidates.md` 候选的现场证据、去重与可复用性；核三批登记位是否「无候选也写了本批无」；若全程 absent，须形成可核查 N/A（`库版本=<在册条目数>` + 无候选/无重犯），不得空过 | rlt22-review2（devin swe-2-max，fresh，非施工者非小审者非 code-round1 复核者） | log:dispatch/review.md | APPROVE_WITH_NITS（LC-01/LC-02 证据与登记齐全、三批登记位含两处「本批无」；核心既往教训根治、两次轻犯均被卡内捕获改正并登记；P3×2：LC-02 缺去重自注、两条可登记未登记项待裁） | review.lesson.md |

**需求复核结论**：approved｜证据=review.requirement.md｜由 rlt22-review2（devin swe-2-max，fresh）｜派出=log:dispatch/review.md｜prior_finding_refs=F-008（RLT_12，本卡动机）｜direction_verdict=approved-无漂移

**教训复核结论**：过｜命中条目=LC-01/LC-02（均有证据、已登记、ready-for-review）；既往相关条目 RLT_12 L-002/L-008/L-009/L-010 与 RLT_21 L-002~L-005 遵守，RLT_21 L-001 与库内候选-6/候选-46 各一次轻犯、卡内捕获改正并已登记为 LC-02/LC-01｜由 rlt22-review2（devin swe-2-max，fresh）｜派出=log:dispatch/review.md｜库版本=87（候选-1~候选-87，候选-40 已裁决、候选-80 附属不单计、余待裁决）｜非「无候选」——本卡 2 候选在册；非「无重犯」——两次轻犯均已捕获改正登记，无沉默重犯

**code_review 初审结论**：<approved / changes-requested / 需人裁决>｜派出=<e:E-xxx / log:路径>

## 批次小审登记（代码复核轮 1 前移；每批 fresh 只看本批 diff 与证据）

| Batch | 承接验收编号 | audit reviewer（须≠本批 exec） | 结论 | 证据 / check 文件 | 状态 |
|---|---|---|---|---|---|
| B1 | `A150`（承接 `A35`/`A71`）+ `A145` | | | `check.B1.md` | |
| B2 | `A144` + `A146` | | | `check.B2.md` | |
| B3 | `A147`（承接 `A107`）+ `A148` + `A149`（附 `A65` 补例） | | | `check.B3.md` | |

## 返工收敛（有 open P0/P1 → 修 → 重跑证据 → 复核者再过；最多 3 轮；同一 finding 连续 2 轮「修完引入新问题」即止损换人）

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|---|---|---|---|
| 1 | | | |

## 有效单测·变异点登记（`task_type=normal` 必填；判据只认「改坏必红」，不做覆盖率）

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人 | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| tools/relay-light/relay_log.py:1706 | `latest["event"] == "checkpoint"` → `== "done"` | 改条件 | `test_a144_launch_gate_replaces_b1_placeholder`、`test_a146_pairing_done_accepted_in_order` | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayReviewReadySignalTests.test_a144_launch_gate_replaces_b1_placeholder test_relay_log.RelayReviewReadySignalTests.test_a146_pairing_done_accepted_in_order` | df59161fff69879f1674787cf8ef5fecd411cb18 | 5174ea1b5b3076485bcf409b6f08f5c11f502df8 | rlt22-review | 断言失败 |
| tools/relay-light/relay_log.py:2043 | `.get("ready_for_review") != name` → `== name` | 改条件 | `test_a146_pairing_done_accepted_in_order`、`test_a146_two_lanes_bind_their_own_ready_seq` | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayReviewReadySignalTests.test_a146_pairing_done_accepted_in_order test_relay_log.RelayReviewReadySignalTests.test_a146_two_lanes_bind_their_own_ready_seq` | 431c150384085a234d8b2ee8158bf0eff5c30109 | 5174ea1b5b3076485bcf409b6f08f5c11f502df8 | rlt22-review | 断言失败 |
| tools/relay-light/relay_log.py:3039 | `review_rounds[combo] >= config.limits.rework_max_rounds` → `>` | 改边界 | `test_a147_review_rounds_is_a_projection_never_a_write_gate` | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayLimitsTests.test_a147_review_rounds_is_a_projection_never_a_write_gate` | e5f6fe41f78f2db7d0dfaba1da8817ccfa264f83 | 5174ea1b5b3076485bcf409b6f08f5c11f502df8 | rlt22-review | 断言失败 |
| tools/relay-light/relay_log.py:2022 | `not (ready_seq.isascii() and ready_seq.isdigit())` → `not ready_seq.isdigit()`（X1 复看：回退守卫验证新用例非空转） | 改条件 | `test_a146_malformed_ready_seq_exits_two_not_crash` | `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log.RelayReviewReadySignalTests.test_a146_malformed_ready_seq_exits_two_not_crash` | 5174ea1b5b3076485bcf409b6f08f5c11f502df8 | f6e22a8578d10de086cb244fec0efa0409678cc2 | rlt22-review | 断言失败 |

> `语义类别` 三选一：`改条件` / `改返回值` / `改边界`——构建错误、语法错误不算语义变异。
> `施加后结果` 三选一：`断言失败` / `未变红` / `构建错误`——**只有 `断言失败` 算通过**。
> 锚点必须是本卡 diff 内的**生产代码**（即 `tools/relay-light/relay_log.py`）并带行号；落在测试文件或 diff 之外一律红。
> `施加 hash` / `还原 hash` 为 40 位十六进制且两者不得相同。

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

> 逐行列出扫了哪些同类路径；**禁空表**——「全部一致」也要逐行写明扫了什么。本路在 normal Recipe 下是否必做，见 `findings.md` **F-005**，由编排/用户裁决；靶子先钉在这里，裁决前不得删表。

<!-- dh:consistency-review:v1 task=RLT_22 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| `trigger` 合法值集合（三态→四态） | `relay_log.py` lint 的 trigger 校验（`:591`-`:603`） vs 运行时 `_require_trigger`（`:1649`-`:1666`） vs design/01 §3.5 映射表 vs `SKILL.md` 五阶段模板 trigger 列 | | | |
| 判定角色闭集 `{plan-reviewer, checker, reviewer}` | `relay_log.py` 新增的按 `role` 读取 vs `skill/roles.toml` 的十一个角色键 vs design/01 §11 A145/A146 原文 | | | |
| 三个 token 的 wire format（`ready_for_review=` / `reviewed=` / `ready_seq=`） | `relay_log.py` 写入与封口两处校验 vs `_note_tokens` 解析 vs A69 helper token 扫描集（`decider=` / `strategist=`） vs `SKILL.md` 账本用法段 | | | |
| 「三套止损计数」表述 | `relay_log.py` 的 `LossStop` / `loss_stop()` vs `skill/dh-mapping.toml` `[limits.on_exceed].note` vs design/01 §11 A107（已改「三套」） vs design/01 正文第 779/873/966 行（**仍写「两套」，不在本卡允许路径内**，见 findings F-004） | | | |
| 封口纪律原文（「PASS 前双方均不记 `done`…」） | `SKILL.md` 硬规则段 vs `references/adapter-claude-code.md` vs `references/adapter-codex.md` 三处 | | | |

**比对对象为空理由**：<有比对对象，本行不适用；收口时删除本行>

## AI 提交区　⚠️ This is not human approval

<由 AI 在收口时填。标完成前的自检，到不了「已验收」。>

**Confidence Challenge**：<收口时逐条列 gap；开工期不预填>

**设计契约传导声明**（收口时只保留一条）：

- 契约同步：<仓库相对路径#稳定锚点>
- 契约无变化：<非占位理由>

**需求对齐证据**（证明真实/低成本场景里需求被满足；单测与代码复核不算）

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-xxx) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| A144 拉起前置 | 合成计划里 coder 发 ready 信号 → 拉起指定判定方成功；九类反例逐条退 2 报 A144 | | |
| A145 送审信号写入合同 | 写带 `ready_for_review=` 的 `checkpoint`：合法接受、四类反例退 2 报 A145、连续 N 条（N > `rework_max_rounds`）仍被 `add` 接受 | | |
| A146 判定方封口配对闸 | 正序封口被接受；七类反例退 2 报 A146 且**该 `done` 不落账、账本行数不变**；无信号节点的判定方直接 `done` 被接受 | | |
| A147 第三套止损投影 | `rework_max_rounds` 取 2 与 3，同一实现分别在第 2 / 第 3 条未通过信号处耗尽；超限后第 N+1 条仍被接受且账本增行 | | |
| A148 向后兼容 | `rlt12-win-01` 的 `relay_plan.md` 原样过 lint 退 0；账本 71 行原样重放逐条被接受、R 段不触发 A146；混用两种 trigger 的合成 plan 跑通且反例编号不串 | | |
| A149 模板与 adapter 同步 | 五阶段模板逐一读取断言；**R 三行与改前逐字一致**；三处纪律原文命中；C 与 X 的最小账本序列三情形（范围口径待 findings F-003 裁决） | | |
| A150 lint 四态 | 四种合法 trigger 各一正例；`on:review_ready:nobody` / 跨节点 / 拼写变体分别报 A35 / A71 / A35；R 形态反例被 **A71** 拒 | | |

**完成条件逐条挂证据**（从 `brief.md` 逐条预填 # / 完成条件 / 谁验；证据与达成收口时补）

| # | 完成条件 | 谁验 | 证据 (E-xxx) | 达成? |
|---|---|---|---|---|
| 1 | `HC-RL-A144` 拉起前置（含九条拒绝例与「重复 `agent_launch` 由 A58/A49 拦下、编号不串」） | AI | | |
| 2 | `HC-RL-A145` 送审信号写入合同（含 token 唯一、闭集校验、不增 attempt、`add` 不设硬上限、不被 A69 误命中） | AI | | |
| 3 | `HC-RL-A146` 判定方封口配对闸（位点在 agent `done`，不落 `_validate_node_close`；错误 `done` 不落账） | AI | | |
| 4 | `HC-RL-A147` 第三套止损计数只投影不拒写（`review_rounds` / `review_exhausted`；2 与 3 两配置同一实现；三套互不叠加不重置） | AI | | |
| 5 | `HC-RL-A148` 向后兼容（`on:done:` 与 A70 逐字一致；旧计划旧账本原样通过；同节点混用两种 trigger） | AI | | |
| 6 | `HC-RL-A149` 模板与 adapter 同步（W/X 换新 trigger、C 补纪律原文、R 三行逐字不变、三处原文、最小账本序列） | AI | | |
| 7 | `HC-RL-A150` lint 四态（A35 / A71 承接；R 形态反例被 A71 拒） | AI | | |

**同批承接的四条**（owner 不变，不单列完成条件）：A35 / A71 由 A150 承接；A107 由 A147 承接；A65 补一个 `on:review_ready:` 未触发的同款正例。

**验收项元数据表**（每条稳定验收项一行；本卡七条全为机器项，最终裁决者 = machine）

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A144 拉起前置 | | machine | HC-RL-A144 | | | | | design/01 §11 | | | | |
| A145 写入合同 | | machine | HC-RL-A145 | | | | | design/01 §11 | | | | |
| A146 封口配对闸 | | machine | HC-RL-A146 | | | | | design/01 §11 | | | | |
| A147 第三套计数 | | machine | HC-RL-A147 | | | | | design/01 §11 | | | | |
| A148 向后兼容 | | machine | HC-RL-A148 | | | | | design/01 §11 | | | | |
| A149 模板与 adapter | | machine | HC-RL-A149 | | | | | design/01 §11 | | | | |
| A150 lint 四态 | | machine | HC-RL-A150 | | | | | design/01 §11 | | | | |

**业务化五段展示区**（收口时填）

- 要证明啥：
- 期望值：
- 实际值：
- 差没差：
- 证据局限：

**风险放行账表**（无风险时描述列留空或 `—`；红线不许进本表）

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|---|---|---|---|---|---|---|
| | | | | | | |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [ ]
**as-built 更新了没**：`parity-ledger`、`relay-light skill 协议` 两个子系统的 as-built 已覆盖更新到最新现状？ [ ]

→ 当前状态：**开工建档，未进复核**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

> 本卡七条验收**全为机器证，无人判结果项**（H=0）。合法收口须同时满足谓词 A（人验栏为空：无人判结果项 ∧ 无 open 方向项 ∧ 无待认险风险项）与谓词 B（放行资格：全部稳定验收项已分类 ∧ 机器项均有等价 pass 证据 ∧ 不可豁免项均满足 ∧ 所有未验证项要么已等价验证要么已合规风险接受）——**机器推导，不认 AI 自写「无需人判」**。
> 下表是收口时向用户展示的核验清单；**结果列由用户在对话里确认后才由 AI 回填，AI 永远不得预勾、不得代签**。

### 目的一：证明 F-008 的三规则互锁已被根治（覆盖 A144 / A146 / A148）

本工作区交付：<收口时填，挂 E-xxx>。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| 节点内返工路径真的通了 | 查看 A144 正例 + A146 正序封口 + 同实例 FAIL→PASS 无第二条 `agent_launch` 的账本片段与退出码 | 送审方全程 live 到 PASS 后才封口；判定方在 PASS 前不记 `done`；两者终态顺序为送审方→判定方 | [ ] |
| 旧计划与 R 阶段没被误伤 | 查看 `rlt12-win-01` 原样过 lint 退 0、账本 71 行原样重放逐条被接受、R 段不触发 A146 的输出 | 旧计划零迁移即通过；R 判定方直接 `done` 仍被接受 | [ ] |

### 目的二：证明既有硬闸未被削弱（覆盖 A145 / A147 / A149 / A150 与「非目标」六条）

本工作区交付：<收口时填，挂 E-xxx>。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| A49 / A60 / A70 仍然生效 | 查看反例输出：终态后挂事件报 A60、终态后重拉报 A49、`on:done:` 那路仍按 A70 判 | 三条编号原样出现且**不串**成 A144/A146 | [ ] |
| 不该动的都没动 | 查看 `git diff` 对 `Status` / `status_document` / `_validate_node_close` / `_validate_agent_transition` 迁移表 / `roles.toml` / `dh-mapping.toml` 键与取值为空 | 六处零改动；`status --json` 顶层键集合未变 | [ ] |
| skill 两侧同步（**须另取当次授权**） | 先看 `%USERPROFILE%` 解析后的两个绝对目标，授权后查看 `install_skill.py --all` 的命令、退出码、最终哈希与两份 manifest | 两目标五文件哈希与仓内源一致；未授权则本行记「停在仓内验证」 | [ ] |

---

- 确认记录：<AI 回填：确认方式 + 用户选择/答复摘要>
- verify 提交 SHA：<AI 代打后回填；`git log --grep="^verify"` 可查>
- 签名：<待用户确认后填>　　时间：<待填>

→ 解锁状态：**未解锁**

> 铁律：没有对应的 `verify(relay-light): RLT_22 …` git 提交，本卡不许标「已完成」。scope 必须是英文 `relay-light`。

### 确认记录（append-only，每次人验确认追加一行）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---|---|---|---|---|---|---|
| | | | | | | |
