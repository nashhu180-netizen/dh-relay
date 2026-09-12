<!-- dh:v1 -->
# RLT_05 heavy 复核 · 教训路 — rlt05-hr-les-devin

- reviewer：`rlt05-hr-les-devin`（Devin CLI · SWE-2 Max），fresh session，未参与 RLT_05 任何批次施工/批审
- 快照：`/tmp/rlt05-hr-les.tCj1xu/repo`（可写一次性快照）；真实 worktree `/home/nash/work/dh-relay` 及其 `.dh-worktrees` 未触碰
- 范围：`lesson_candidates.md` 逐条核对（证据可核查 / 与既有库去重 / 表述可复用）+ `progress.md`/`findings.md`/`reviews/**` 顺查漏登记项；只读核查，不改任何工件外的文件
- 去重语料：`docs/modules/dh-relay/knowledge/教训库-候选.md`（候选-1~87，全文逐条扫过触发场景与建议动作）；`docs/modules/relay-light/workspace/RLT_03/lesson_candidates.md`（L-001~L-003）；仓内无 `教训库.md` 正册、relay-light 无独立 knowledge 目录；其余 `DHR_*/lesson_candidates.md` 为各卡工作区流水、与库候选互为源流，亦纳入比对
- 已读：`brief.md`、`task_plan.md`、`progress.md`（E-001~E-088 台账 + fixture 对齐表 #1~#20）、`findings.md`（H1~H4、B1~B4 事实登记、F-B*/F-B4-R*）、`review.md`、`reviews/` 全部八份（含 `heavy-code-r1-devin.md` 的登记/残差族 F-HR1-01/02 与 F-B4-R01~R06 裁决）

## 0. 结论

**APPROVE**。11 条候选全部有真实可核查的支撑事实，无伪造候选、无一次性流水账；`lessons-absent` 不成立（候选非空且成立）。open=5 全部为 **P3 登记/判重类**事项：两条占位行未随施工回填证据、一条同族判重未标注、两条达门槛事项未登记、一组库内条目重蹈事实未点名。均不改变候选内容本身的成立性，由有权写工件的节点（scribe/主控收口）clerical 闭合，不阻断本路复核。

## 1. 候选逐条核对表

| ID | 证据核查（E-ID/文件/测试名可核查性） | 去重（对 87 条在册 + RLT_03 L-001~003） | 可复用性 | 判定 |
|---|---|---|---|---|
| L-001 | **成立但登记不完整**。脚注已补 Batch 1 证据：E-011（四份损坏配置矩阵 rc3 + 精确编号 + 账本不增）、E-012（三档 reviewer 集合经**替换输入 TOML**证明，含 `strict` 未配置被拒）；A99 双 hash 证法已按脚注预期由 Batch 4 交付 E-081（`90707b7e…` ×3，B4 小审与 heavy-r1 各自独立复算同值）；测试锚 `test_plan_x_rounds_length_and_ids_come_from_the_loaded_config`。行内「触发现场=待施工、状态=placeholder」未随证据回填 | 无强重复。邻域：候选-36（真产物真环境机器证）、候选-2/7（oracle 来源独立）均不同机制——本条是「证法=替换输入配置而非改源码」 | 是（通用证法规则） | PASS-with-note → F-HLS-01 |
| L-002 | **规则成立但工件零登记**。支持事实存在且可核查：F-007（A62 schema 与 A73 superseded 差分分域，赛前冻结）；B2-F8 + E-035（placeholder 三键输出**掩盖** A128/A73 fixture 在 `close`/`depends_on` 列的真实差异，完整投影首跑即暴露——正是「一个弱/合并 oracle 掩盖 owner 边界」的实发）；E-034（A73 独立判别矩阵） | 无。候选-46（护栏区分对错）相邻不同 | 是 | PASS-with-note → F-HLS-01 |
| L-003 | E-012（`recipe=strict` 未配置被 rc2/rc3 A116 拒 + 零 reviewer 豁免共存，同一 fixture 下两规则叠加可见）、B1-F1（豁免范围冲突如实登记交裁决）→ B1-F1-R1（rework R1 按「枚举恒校验、豁免仅限集合检查」闭合）；design §3.5:413「`recipe` 值非法 → HC-RL-A116」与 task_plan:85 豁免字面冲突属实，本审已对读两侧原文 | 无。同属「文档传导」家族的候选-4/14/42/47 触发形均不同（悬空引用/口径未核/摘录漏项/门槛句漏组）；本条是「两文本对同一 HC 豁免范围不一致→保守叠加+登记+不自选边」 | 是 | PASS |
| L-004 | fixture#1（`run_cli` 自动注入受控 `--config-dir`，`test_relay_log.py:152-165` 实证：`--help` 与显式传参不补）、E-008（三 CLI flag 面）、E-010（**合成 HOME** 五情形矩阵：单侧 rc0 / 双侧、零侧、显式缺失 rc3 + 账本不增） | **疑似重复候选-50**（测试对家目录默认配置的隐式依赖→强制注入、缺省即失败；DHR_33）。增量差异：本条额外要求「用合成 HOME 逐一覆盖默认解析分支」，候选-50 只管注入。裁决时可并入候选-50 或标其子款 | 是 | PASS（判重待裁决）→ F-HLS-02 |
| L-005 | E-017（有效红：伪造 token 被保留 / 重复例收两值 / 相对 `--plan .` 原样记录）、E-021（伪造/重复/冲突/缺省四例写入后各恰一键且解码=实际值）、E-022（相对路径规范化）；实现锚 `_plan_loaded_note` 无条件重建（`relay_log.py:1171-1182`，`PROVENANCE_KEYS` :64）；测试 `test_plan_loaded_provenance_is_rebuilt_from_the_real_resolver`（:1587+，docstring 即「forged tokens never survive」） | 无。候选-7/15 同族不同层（测试 oracle/发送快照 vs 账本写入侧来源字段） | 是（写入侧来源字段重建是通用规则） | PASS |
| L-006 | E-017（扩展配置 `[recipes.strict]` 下 `recipe=strict` 被 lint 接受的有效红 `2 != 0`）、E-020（扩展配置仍拒 / 删除 `normal` 的配置下 `normal` 亦拒 / heavy 正例 rc0 三分对照）；实现 `RECIPE_TIERS = frozenset({heavy,normal,light})`（:63）先于配置查询（:626-629）；`test_recipe_tiers_stay_within_the_frozen_three_value_enum` | 无（库中无「闭集枚举不委托可替换配置」条目） | 是 | PASS |
| L-007 | B2-F1（§10.2 前 12 行逐字 + 3 行最小续写 + `now` 注入，续写行与取 `ts` 已登记）、B2-F2（§10.1 摘录补 6 行 agent，逐行列入 `PLAN_10_1_AGENT_ROWS` 并注「excerpt completion」，`test_relay_log.py:1800-1814` 注释实证）；E-032/E-033（§10.3 与 design 行区间 `==` 逐字节相等、13 键全量等值） | 无强重复。候选-57 同族不同轴（57=条目/字段/关系完整性；本条=摘录样张→最小自洽闭包+逐行登记） | 是 | PASS |
| L-008 | B2-F8/E-035（等价 fixture 带伤实发+对齐为「仅差一行 superseded」后断言更强）；E-031（替换 placeholder 后全量 84 绿且唯一转红旧例即该 fixture——「先全量回归再按 A73 重校」的实际执行记录） | 无强重复。候选-84（迁移期 fixture 结算副作用）相邻不同；同卡 L-010 覆盖的是「无校验主题测试转红」，本条是「占位输出掩盖数据伤」，两机制可分 | 是 | PASS |
| L-009 | E-042（顶层多出 `amend`/`nodes` 的精确有效红，且同测 `stages[].result` 五键当时已绿=红只锚顶层）、E-045（真 CLI 顶层恰 3 键、`stages[].result` 恰 5 键、两对象分离）；实现 `_last_result_document`/`_result_document` 分函数（`relay_log.py:1717`、`:1739`）；测试 `STATUS_LAST_RESULT_KEYS` 三键精确断言 ×2（`:1863/:2213/:2230`）+ fixture#10 登记 | 无 | 是（分层键集→分层 serializer+逐层断言，通用） | PASS |
| L-010 | E-058（三条 RLT_03 fixture 显式以「不做该校验」为主题：不经写入者校验的 `by` 派生、未关节点写 `stage_result`、`agent_launch orchestrator#1`）、fixture 表 #11–#13（旧用途/改动/原 HC-ID 逐行）；「转红=新合同判别证据非回归」的处理按新合同重写并保留仍有效断言，B3 小审与 heavy-r1 均确认 | 无强重复（候选-84 相邻） | 是（补守门时旧测试处置的通用规则） | PASS |
| L-011 | B3-F2（缺口窗口如实登记：全节点已关、实例未 `stage_close`；副作用写明 `stage_close` 后回 `null`/`none`）、E-059③（断言随兜底更正并登记）；**补强可引** E-068⑤（R1 rework 真 CLI：awaiting-close 窗口实收 `current_stage=DHR_90:C#1`、`current_node=R1`，条目未引但已在台账） | 无 | 中偏弱但成立（「兜底只盖缺口窗口、主 oracle 逐字不动、写明依据 ID 与副作用」可迁移；战术性偏强） | PASS（引用可补强 E-068⑤） |

## 2. 库内既有条目在本卡的命中/重蹈（顺查副产物）

| 在册条目 | 本卡事实 | 判定 |
|---|---|---|
| 候选-87 · 「机器强制只读」须先探沙盒 | **重蹈成立**：教训登记次日即复发——B1/B2/B2-复审小审 reviewer 动态全部 `bwrap RTM_NEWADDR` NOT_RUN（E-015/E-037/E-038/E-048）；处置演进为 hash-matched 可写快照重派 + 主控源 worktree 复跑补动态缺口（E-026/E-047/E-048），该快照降级路径本身比候选-87 原文的「侦测型降级」更具体 | 重蹈事实未进工件 → F-HLS-05 |
| 候选-2/7 · oracle 自证循环族 | **近失重蹈**：B2 顶层 `last_stage_result` 五键断言把错误实现锁成 oracle（F-B2-LAST-RESULT-SCHEMA），fresh 小审对读 §3.5 逮住、rework 闭合 | 同族事实未点名 → F-HLS-05 附带 |
| 候选-45/46 · 判别力/唯一负责族 | **近失**：F-B3-A89-BRANCH-EVIDENCE——断言先命中 unknown-stage 分支、未覆盖目标分支；R1 改用已知未 start 实例 + E-065 mutation 红复证命中 | 同族事实未点名 → F-HLS-05 附带 |
| 候选-85 · 存在≠闭环 | F-B4-R01 同形：`loss_stop`/`plan_x_rounds` 纯内部、无产品消费点但 A107 证法只要求单测即通过 | 已由 heavy-r1 转设计层裁决（ESCALATE），无需新候选；供裁决者注意同族性 |
| 候选-61 · 负例不钉非冻结 detail | **未重蹈**：抽查负例断言均钉 `^error: HC-RL-* `/`^lint: HC-RL-* ` 前缀 + rc + 账本不增；`test:1157` 的 `.*coder#1` 属 A17 冻结语义 | 教训被遵守 |
| 候选-17 · 环境假红两判据 | B3 小审 4 个 `PermissionError` 如实归类环境假红、主控无沙盒复跑不复现（E-062） | 正确应用 |
| 候选-50 | 见 L-004 行 | 被遵守并扩展 → F-HLS-02 |
| 候选-65 · 复核者自报 HEAD | 各小审与 heavy-r1 均自报所见 SHA/快照 | 被遵守 |

## 3. 漏登记项（达教训门槛、未进 lesson_candidates）

| 事项 | 事实与证据 | 门槛判定 |
|---|---|---|
| **证法替换**（→ F-HLS-03） | design §11 A99 证法原文含「`git diff` 对 `relay_log.py` 为空」（已对读 `:1215` 证实）；全卡 B1–B4 均为未提交 WIP，该字面证法在本卡**结构性不可达**。task_plan:139 冻结「双运行双 sha256」替代证法，B4 小审 M-复算与 heavy-r1 F-B4-R05 均追认「不弱于原证法」。可迁移规则：**验收证法不得依赖在取证时点可能不成立的状态语义（提交态/工作树 diff）；替换证法须显式登记+追认** | 真实合同-工作流冲突 + 已落地替代证法 + 经复核追认，达门槛；库中无对应条目（候选-49/68 是「终态证据基线」族，不管证法本身可达性） |
| **late-added discriminator 登记模式**（→ F-HLS-04） | task_plan:71 冻结「旧行为已正确允许登记 late-added discriminator，写明旧行为/实际编号/判别对象，不伪造红」；本卡实际执行：B2-F10（A44 词表 pass-before）、E-076 ×3（plan_loaded 双键等）、E-058 改名承接 | 按 DHR_30 教训复核先例（R-N-09/R-N-10：合同已落档的可迁移原则仍独立成条）建议登记；库中无对应条目（候选-45/46 管判别力本身，不管「实现前即绿」的诚实登记形态） |

**顺查已排除项**（看过但低于门槛，不立 finding）：B1-F3（`Path.read_text` 保 RLT_03 mock 面——单点战术事实）、E-059②（测试期望自纠如实登记——账本诚实惯例，单例）、B3R1 残差族与 F-HR1-01/02（缺陷/裁决残差登记，非教训；F-HR1-02 已结转）、E-063..068→E-064..069 快照间 E-ID 映射错位（簿记事实）、`SUGGESTED_ACTIONS` 死常量（F-HR1-01 已登记）。

## 4. Findings（F-HLS-*）

| ID | 级别 | 位置 | 事实 | 最小闭合 |
|---|---|---|---|---|
| F-HLS-01 | P3 | `lesson_candidates.md` L-001/L-002 行 | 两条施工前占位候选的状态列仍 `placeholder-awaiting-evidence`、触发现场仍「待施工」：L-001 证据经脚注 + E-081 已实际成立但未回填行内状态；L-002 行内与脚注均无证据登记（支撑事实 E-034/E-035/B2-F8/F-007 存在但未挂接） | 由有权写工件的节点将 L-001 更新为 `evidence-registered(E-011,E-012,E-081)`、L-002 更新为 `evidence-registered(E-034,E-035,B2-F8,F-007)`；若裁决者认为 L-002 证据不足支撑其规则表述，则按库规标弃而非留占位 |
| F-HLS-02 | P3 | `lesson_candidates.md` L-004 | 与在册候选-50 同族疑似重复未在工件标注；增量=「合成 HOME 逐分支覆盖默认解析」 | 裁决时按库去重规则处理：并入候选-50 或标「疑似候选-50 + 增量子款」 |
| F-HLS-03 | P3 | `lesson_candidates.md`（漏登记） | 「证法依赖提交态在 WIP 流不可达→等价证法显式替换+追认」（A99 git-diff→双 hash）达门槛未登记 | 建议补为候选；可参考 §3 表行措辞 |
| F-HLS-04 | P3 | `lesson_candidates.md`（漏登记） | late-added discriminator 登记模式（不伪造红的诚实通道）达门槛未登记 | 建议补为候选 |
| F-HLS-05 | P3 | `lesson_candidates.md` / 收口登记 | 候选-87 本卡重蹈（B1/B2 小审动态全 NOT_RUN + 快照降级演进）、候选-2/7 与候选-45/46 家族近失（F-B2-LAST-RESULT-SCHEMA / F-B3-A89-BRANCH-EVIDENCE）均未作重蹈点名 | 在工件或收口材料点名重蹈事实（重蹈证据有助于库内条目裁决分量），不新增候选 |

无 P0/P1/P2。

## 5. lessons-absent 判定

**`lessons-absent = false`**（可核查）：卡内 11 条候选均成立（§1 逐条核对），另有 §3 两条漏登记项——非空 N/A 不适用。核查路径：候选表逐条 ↔ progress.md E-台账/fixture 表/findings.md 登记行 ↔ `tools/relay-light/{relay_log,test_relay_log}.py` 实现与测试锚点三方对拍。不拉 Pair、不要求 Binding。

## 6. NOT_RUN（不冒充已验证）

| 事项 | 状态 | 说明 |
|---|---|---|
| 测试套件/CLI 动态复跑 | NOT_RUN | 教训路径为文档核查，不要求动态复算；各 E-ID 指向的测试名/函数/常量锚点经**静态**定位属实（§1 表内已列行号），台账记录的输出值未独立复跑 |
| E-ID 台账所述输出值的复算 | NOT_RUN | 动态证据真实性归代码轮/需求路；本路只核「候选 ↔ 台账登记 ↔ 代码锚点」三者一致 |
| 候选库外其他模块 knowledge | N/A | `docs/modules/` 下仅 `dh-relay/knowledge/` 存在（已全文扫描）；relay-light 无 knowledge 目录，无遗漏语料 |

## 7. Verdict

`APPROVE`，open=5（F-HLS-01~F-HLS-05 全 P3，登记/判重/点名性质）。候选集本身成立、无伪造、去重除 L-004↔候选-50 一处待裁外干净；漏登记与重蹈点名由有权节点 clerical 闭合，不阻断教训路径结论，也不替代主控整卡验收与人裁决。

DONE APPROVE open=5
