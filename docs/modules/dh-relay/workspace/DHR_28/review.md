<!-- dh:v1 · review.md — 验收。🔴 收尾填。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_28

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

<标准档必做。这是收口审里“代码/实现”复核那一块（verify 总审还含完成条件/证据/DoD/人验）。两轮总量不减：①施工批次检查点前移的小审合集 → ②收口换另一个 agent 做增量复核。结论登记为证据。派出证据：派发复核时先 `dh dispatch` 在 progress 唯一合法账本落 review-dispatch/session-run 行；整个单元格/派出=值只能由 `e:E-xxx`、`log:非空路径` token 与分隔符组成，任何散文/畸形残留都不算；路径含空格写 `log:"logs/review run.log"`。>

**第一轮·批次小审合集**（施工批次检查点前移；每批 fresh subagent / Codex 只看本批 diff 与证据，专挑：目标范围漂移·行为回归·边界权限安全·证据缺口·隐性逻辑·过早收口·流程被跳过[没先规划/没读该读 ref/没汇报]）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| `cp3-DHR28` · Claude Opus 5 fresh subagent 会话 · 实例/会话 **≠ cp1-DHR28 且 ≠ cp2-DHR28** · 未参与批 3 任何施工 · 全程只读（`cat`/`sed`/`grep`/`git show`/`node` 跑校验脚本，零文件写入、零 git 改盘、零 `npm install`） | **批次检查点 3**：只看批 3 diff = 提交 `f99363d`（63 文件，校验器 + 审计器 + 31 份 fixture + 测试）。产物冻结于该提交、审查期间主会话不改盘（吸取 cp2 的 D-10 教训：上两轮都是复核者查 mtime 先发现文件在变）。四条必查 = 反例真能被拒（抽验 ≥2 手工复跑）/ 校验器对未知版本有无宽容放行 / fixture 期望是否被改来迁就校验器 / 校验器是否偷引 Runtime 或工作台代码 | **轮1 changes-requested：P1×2 / P2×3 / P3×5，P0=0**。 **P1-1**（→F-047）明文交付物 `fixtures/manifest.json` 未做，而 visual_map 的计划行被改写成不含 manifest 后标 100/present，且主会话派 cp3 时把步16 必查③「manifest sha256 是否真对得上」换成了别的题——计划/产物/复核题面三处同时消失。 **P1-2**（→F-048）run-state 七档聚合条款零机器闸，实测 `succeeded` 配一个 `failed` 节点被放行，**直接证伪批 2 已写进账本的 E-029 结论**。 P2-1（→F-049）未知版本 reason 只对 1/7 兑现；P2-2（→F-050）禁词表漏 `pi`，五家里一家的中立性检查是空的；P2-3（→F-051）禁词表↔白名单无机器闸。 P3-1~5（→F-052~F-056）expect 不钉位置 / 份数下限松一格 / `response` 帧无 golden / omitted-reason 无覆盖 / G5 判据靠 pattern 特征子串。 **冻结复检通过**：起止两次 `stat -c %Y` 逐行一致，HEAD 全程 `f99363d`。 **方法学**：必查①先给出比抽验更强的结构证据——9 份 `relay.run/v2` 系反例逐条 `diff` 确认是 golden 的**单 token 变异**、基准自身 PASS ⇒ 不可能「被别的原因拒」；非派生的几份逐条做「把无关处补合法」双向复跑（`h6-dsh-only-required-role` 改 `kind`、改 `required` 两向都翻）。必查③**先不看施工方解释、各自从 schema 原文推一遍**再印证，判定 3 条改期望**全是真修正**，另抽查 7 条未改动的确认非反抄。必查④逐条列 import，零 Runtime / 零工作台 / 零业务代码。 **主动更正自己一处误读**：注释里的 `han-dsh-ake` 是把 `handshake` 掰开的示意、不是测试串，边界规则本身是对的。 　—— **轮2 = `approved`，发现清单为空**。轮2 复检了返工的十条：**F-047** 另构造一个「让 selftest 完全绿、只有 manifest 能抓」的篡改（把 G5 反例的 `ref` 换成 `bin/`+1100 字符，过 locator pattern 但不过 `maxLength`，expect 同步改到自洽）→ `npm test` 7 条里只有 manifest 那条红，**实证这道闸的边际价值不是摆设**；另四种形态（新增未登记 / 删除 / manifest 自身被改 / manifest 缺失）逐一 exit 1 且文案精准。**F-048** 不靠抽样——自己按条款①~⑦重写一份聚合函数（不看 allOf），对**大小 1~3 的全部节点态组合 × 6 个 run_status 共 714 例**逐例比对：**over-rejection 0 / under-rejection 0**；再随机 n=4~6 共 24000 例，与条款不符 0 例 ⇒ **allOf 与规范条款等价，既不漏也不紧**，且给出了原理（∃/¬∃ 谓词与元素个数无关，故优先级序在任意节点数下成立）。**F-049** 按主会话点名的三类风险逐一构造 11 个边角值（含 `relay.run/`、`relay.run/v2extra`、`RELAY.RUN/V3`、`123`、`null`、`""`），未找到失败场景；确认 `pointerGet` 的 `~1`→`~0` 顺序符合 RFC 6901 §4，oneOf 分支下 instancePath 仍以载荷为根。**F-052** 独立从 schema 推了 22 条 `at`，确认无一反抄；删掉某条 `at` 实测 FAIL，无宽容通道；判定「`at` 是 fixture 台架属性、不给下游实现新增义务」⇒ **没有修过头**。**空绿红测五组**（去掉 `jcs()` 键排序 / 删掉 `fixture-manifest.mjs` / 删 expect 的 `at` / 插 `pi_session_ref` / 删禁词表 `pi`·`dsh`·`herdr`）全部真红。**CRLF 实证**：行尾 + 缩进 + 末尾换行三种无语义差异一次上齐，字节 sha256 已变而 manifest 对证仍 exit 0 ⇒ 选 JCS 而非文件字节哈希的推理成立。**主动认下自己轮1 一处推理写错**：「字符类换序会让三条 G5 静默退化」不成立（另一段特征串还在），并复现了「内联 locator pattern」那条残留形态比主会话登记的还退一格（落 `E_BAD_TYPE` 而非 `E_BAD_VALUE`），确认交 DHR_29 的处置正确。**方法学（只读纪律与"请自己动手篡改"的冲突处理）**：把 `relay-core/{tools,fixtures,contracts,test}` 整体复制到 scratchpad，**所有篡改在副本里做、盘上零字节改动**；副本先跑通对证证明与盘上等价再开始改。冻结复检：HEAD 全程 `15dccc2`，`git status --porcelain` 全空，mtime 起止快照 `diff` 逐行未变。 | e:E-036 | E-037 / E-038 / E-039 / E-040 / E-041 / E-042 / E-043 |
| `cp2-DHR28` · Claude Opus 5(1M) fresh subagent 会话（自称 `batch2-reviewer`）· 实例/会话 **≠ cp1-DHR28** · 未参与批 2 任何施工 · 全程只读（Read / `grep` / `awk` / `ls` / `node -e` 内联求值，**零文件写入、零 git 改盘、零网络、未装任何依赖**） | **批次检查点 2**（共 **3 轮往返**）：只看批 2 diff = `relay-core/` 下除 `adr/` 外全部产物（README / package.json / 7 份 schema / `_shared` / 4 份 v0 形状 / 处置表 / reason-codes / compat-matrix）；对照 brief / task_plan / DevPlan §2.2·§2.3·§3.2 / P4 报告 §4 / design/05 §6.2 / design/06 验收命题 / **`tools/contracts/` v1 现役 PowerShell 契约实读** | **轮1 changes-requested**：P0/P1=0、P2×7、P3×3（D-1 全域 aP:false 不实且 4 处开口未登记 / D-2 RPC params 的 locator 断言无机器闸 / D-3 locator 漏 `file:/`·`~/`·`%VAR%` / D-4 G5 描述与实装不符且列了 3 个不存在的字段 / D-5 schema 与 ADR-002 净产出表打架 / D-6 `proposed_by` 标记判错 / D-7 E-013 证据方法撑不住结论 / D-8 event kind 用数字凑账 / D-9 `bin` 悬空+`npm test` 假绿 / D-10 产物在小审中被改写）。**轮2 增量**：新增 **D-11（H6 fail-open by default，本卡最重一条）**、D-15（§0 计数失真复发）、D-17（notification 闭合依赖枚举↔分支对应）、**D-18（`format` 在 2020-12 默认只作注解，主会话对 F-013 的定性不准）**。**轮3 补正**：撤回 D-16；**明确反对 F-019 按"非缺陷"关闭**并给三条理由 + 补出"结构性必经"这一更隐蔽形态。**方法学**：自写忠实求值器（覆盖 `type`/`properties`/`required`/`const`/`enum`/`not`/`allOf`/`oneOf`/`contains`/`minContains`/`items`/`minItems`/`pattern`/`additionalProperties`/`if`/`then` + 跨文件 `$ref` 按 `$id` 解析），**明确声明未采信主会话探针的 ALL PASS 结论**；H6 专项实跑 14 例 + 12 例对抗性绕过；`$ref` 逐条下钻 85/85；locator 35/35；notification 15/15；AST 遍历逐个 object 节点。**v1 侧抽验 6 条：5 真 1 假**（假的即 D-6） | e:E-018 | E-022 / E-023 / E-024 / E-025 |
| `cp1-DHR28` · Claude Opus 5(1M) fresh subagent 会话 · 未参与 ADR-001/002 任何一句起草、不继承起草会话上下文 · 全程只读（Read + `rg`/`wc -l`/`awk`，零写入） | **批次检查点 1**：只看批 1 diff = `adr/ADR-001-runtime-language-and-code-root.md` + `adr/ADR-002-agent-host-ownership.md`；对照 brief / task_plan 步1~5 / DevPlan §2.2·§2.3·§3.2 / P4 报告 / design/05 §6.2·§6.3·§17 / design/06 验收命题 / DHR_26 findings | **结论 changes-requested**；P0=0、P1=0、P2=2、P3=5。P2：F-1 决策对照表换权威源致 B-11 折扣只落 TS 一侧（→findings F-002）、F-2 ADR-001 张力段与 ADR-002 第②问口径打架致「放弃 SDK 复用」被误记为 Go 独有成本（→F-003）。P3：F-3 出处指错（→F-004）、F-4「约250行」实测284行（→F-005）、F-5 G1~G6 前向引用未锁行序（→F-006）、F-6 代码根轴用「明显」下定性判断、语言轴却写成对赌（→F-007）、F-7 `executor_kind` 厂商 token 将与批3禁词表冲突（→F-008）。**抽验 6 条引用（E1/E2/E6/E7/E8 + E4/E5/E11）全部与原文相符，无编造无夸大** | e:E-006 | E-001 / E-002 / E-005 / E-007 |

**第二轮·增量复核**（**另派 fresh-context、未参与实施且不继承或注入第一轮会话上下文的独立 agent 实例，可只读仓内已落账的第一轮记录；模型/账号可同，不得复用同一会话**；核全程 + 核各批小审记录 + 查收口增量 diff；按类型叠加：SQL→pytest 契约 / 前端→截图比对 / 安全→security skill）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| `e2-DHR28` · Claude Opus 5 fresh subagent 会话 · 实例/会话 **≠ cp1 / cp2 / cp3-DHR28** · 未参与任何施工 · **不继承也未注入第一轮会话上下文**（只读仓内已落账的 `review.md` / `findings.md` / `progress.md`）· 全程只读，破坏性实验全部在 scratchpad 副本内进行、盘上零字节改动 | **核全程 + 核三批小审记录 + 查收口增量 diff**。范围 = `relay-core/` 全部产物 + `workspace/DHR_28/` 八件套 + 四个提交（`a10e294` / `e8d6a8e` / `f99363d` / `15dccc2`）及其后的收敛提交。四条必查 = 三批小审结论是否被如实执行 / 验收口径 5 条是否真有机器证 / 有没有把没做到的写成结论 / 跨批次是否有前批结论被后批证伪而未更正 | **轮1**：抽验 10 条 `resolved` finding，**9 条真改真对、1 条只改了一半**（→P1-1）。**独立复算不采信主会话数字**——按 description 条款①~⑦自己重写聚合函数，穷举 size 1~3 全部组合 × 6 个 `run_status` = **2394 例**（应过却拒 0 / 应拒却过 0），另随机 n=2~8 共 **30000 例** 不符 0。**必查④找到第二例**：D-19 证伪了原 4 档条款、schema 改了而 `v1-gap-disposition.md` G2 行没改，且**与冻结 schema 机器级互斥**（按它构造的三份载荷被本卡自己的校验器逐份拒收）。**必查③找到 2 例**「把没做到的写成结论」：E-034 的整条口径、A1/A2 的等价判据窄于命题。七条：P1×1 / P2×3 / P3×3。 　**轮2**：七条逐条复检**全部真关上**，无一条是「改了个字面让检查过关」。**产物本体零反例**——五种方法各跑一遍（聚合条款穷举等价性、11 例 H6 对抗、7/7 版本二分、逐条删 6 条 allOf **全部真红**、原型污染四角、三组中立性红测）。新发现七条**全部落在同一条缝上**：声称的覆盖面 vs 实际覆盖面。其中 **P2-1 = `capability_hash` 不覆盖 `_shared/relay.common.v1.schema.json`**，实测把 `locator.pattern` 改成 `^.*$`（G5 全域禁令彻底失效）后指纹**逐字未变** ⇒ F-033 缺口 A 下沉一层、本卡此类第五次。另主动确认了主会话在派出简报里提的两个自我怀疑：①第 11 维的 `type` 那条**确实不支撑**「不共享活动对象」（反例 `session_handle:{type:"string"}` 零违规），②基线落点选择无副作用但**覆盖面有问题**。 | **轮1 `changes-requested`（P1×1 / P2×3 / P3×3）→ 轮2 `changes-requested`（P0=0 / P1=0 / P2×2 / P3×5）**。轮2 明确：产物本体零反例，七条全是「声称 vs 实际」的差额，**这类问题有限且可枚举、不会一层层下沉**；P2-1 修掉后该收口。剩下只有 DHR_29 才有手段验的东西（真把 Runtime 跑起来握手、真让两个实现对指纹），正确做法是如实登记「部分覆盖 + 写清未覆盖边界」，不是在本卡再派第六路 | e:E-044 | E-049 ~ E-054 |

**返工收敛**（有 open P0/P1 → 修 → 重跑证据 → 复核者再过；最多 3 轮；3 轮不收敛则停，摆给用户决断）

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 批3-CP3（轮1→轮2） | **2 条 P1，均已 resolved**（收敛后 open P0/P1 = 0） | **十条全接全改**，无一条讨价还价，findings F-047~F-056。 **两条 P1 主会话先独立复验属实再动手**（不直接采信同侪结论）：`find` 实证 manifest 不存在 + `git show` 实证计划行被改写；两份构造载荷实跑 `{"ok": true}`。 **P3 五条也全改**，未按小审建议整批移交 DHR_29——理由：P3-1（expect 不钉位置）与 P3-5（判据挂在正则写法上）正是本卡反复在堵的「空绿」形态，P3-2/3/4 是廉价的覆盖洞，留给下游等于把已知的洞写进冻结契约。 **顺带多做一步**：F-049 比小审建议多做了「同名异版 vs 异名」的二分（一律判版本问题会把「发错协议」说成「版本太新」）；F-047 顺带把 `CANONICALIZATION.md` 从散文升为可执行实现（`tools/canonical.mjs`），五个内容指纹字段此前在本仓内部同样无人能复算。 **如实登记未关闭的边界**：F-056 的新判据只覆盖「按 `$ref` 引用共享 locator 定义」这条支持路径；内联 pattern 的形态两版判据都盖不住，随 F-042 交 DHR_29。 **终态机器闸**：`npm test` **7/7**；`validate.mjs --selftest` **pass=33 fail=0**；`audit-contracts.mjs` 9 维度全绿、84 条 `$ref` 实解析 0 失败；`fixture-manifest.mjs` 55 份逐份 digest 相符。四组负向红测全部真红（篡改 fixture / 改错 at / 插 `pi_session_ref` / 删禁词表 `dsh`）。 **停止判据（按教训 L-013，第一轮就问）**：复核者逐条归类——10 条里 **6 条是盘上已存在的事实**（P1-1/P1-2/P2-1/P2-2/P3-3/P3-4）、4 条是理论上可构造（P2-3/P3-1/P3-2/P3-5），**明确判定「还没到边际收益递减点」**，并预判「两条 P1 收掉、P2 三条给出处置后，下一轮该是最后一轮」。 | **是**（轮 2 `approved`，发现清单为空；open P0/P1 = 0；返工 2 轮收敛，未触及 ≤3 轮闸） |
| 批2-CP2·**终局** | **P0/P1 全程为 0** | **第 5 轮结论 = approved**（复核者原话：「批 2 可以冻结了」）。第 5 轮四问回答：Q1 纠正了主会话对⑦档的错误理由（→F-039）；Q2 以"description 承载规范性条款"为据判定 digest 全文粒度**正确、不改**（→F-040）；Q3 四条理论可绕形态，**c 已修、a/b/d 只记录**（→F-041）；Q4 主动认下**唯一一处"修过头"**（`node_states` 必填挤掉列表投影，为其上一轮建议）→ 不撤销、改划边界（→F-038）。**复核者主动建议停止迭代**，理由：前四轮找的是**实际存在的缺陷**，第 5 轮起找的是**当前 schema 里不存在的理论构造**，边际收益递减明确。终态机器闸：`probe` 13/13、`rs` 17/17、审计器 9 维度全绿 exit 0、负向 7 条全部真 fail | **收敛，批 2 冻结** |
| 批2-CP2·轮次账 | **P0/P1 全程为 0** | **5 轮往返，findings F-009~F-037（P2×14 / P3×15）**。逐轮：轮1=10 条（原始批 2 产物）；轮2=4 条（含 D-11 H6 fail-open）；轮3=补正（撤回 1 条 + 反对 F-019 定性）；轮4=8 条（含 D-25 空集合真空真）；轮5=待裁决。**关于 dev-harness「返工 ≤3 轮」闸**：该闸的触发条件是「有 open P0/P1」，本卡 **P0/P1 恒为 0**，故未触发硬停；但轮次已超 3，**如实登记并已摆给用户设停止判据**（见下方"收敛趋势与停止判据"）。**关于「止损换人」**：规则是"同一条 finding 连续 2 轮出现『修完引入新问题』"。本卡有**两条不同线索各自回归一次**——D-19 的修法引出 D-25、D-20 的修法引出 D-27（同一毛病下沉一层），**均未达到同一条连续 2 轮**，故未触发换人；但该模式已登记为教训 L-009 | **未硬停**（判据见下） |
| 批2-CP2 | 0（P0/P1 全程为 0；P2×9 + P3×5，跨 3 轮） | **全接全改**，其中 4 条是主会话未经小审自查发现的（含一条 **P1**：7 份 schema 原本编译不了，`$id` 绝对 URI + `$ref` 相对文件路径按规范解析后指向错误 URI，`MissingRefError`；若不发现批 3 一跑全炸、验收口径第 1/2/3 条一起落空）。**最重一条 D-11**：H6 的触发开关 `required` 原为可选+默认 false，导致该安全断言 fail-open by default——已改必填（语义不变，消灭"忘了标=不检查"）。**D-18**：`format` 在 2020-12 规范里默认只作注解不做断言，已并列加 RFC3339 `pattern` 兜底（本卡就改，未拖批 3）。**F-019 定性经小审反对后升级处置**：把可修的东西记成"固有边界"本身就是把没做到写成结论。**方法学纠错**：作废 E-013（数 grep 命中无法证明"无遗漏"、禁词表无一个是实际会出现的 token），改建 `tools/audit-contracts.mjs` AST 遍历（E-022）。终态复跑：`probe.mjs` **13/13 ALL PASS**、`audit-contracts.mjs` 退出码 **0** | **是**（P0/P1 恒为 0；P2/P3 全部 resolved 或显式移交下游并登记，findings F-009~F-024） |
| 批1-CP1 | 0（P2×2 + P3×5，无 P0/P1） | 七条**全接全改**：F-002 对照表并列 DevPlan §2.3 + design/05 §6.3 两份原文并把 B-11 折扣限定作用域；F-003 张力段把「放弃 SDK 复用」中性化、并把「L-TS 下是否放宽直连」升为次级裁决项摆给用户；F-004 出处改标 §3.1/§1；F-005 E2 加实测 284 行括注（不回改上游 P4 报告）；F-006 加「G 编号锁」；F-007 代码根轴改对赌句式去掉「明显」；F-008 加禁词表白名单豁免注。重跑机器闸：ADR-001 六节=6、`> 待用户裁决` 行=1（去重）、ADR-002 `answer:`=4、两份 ADR「待定/TBD」零命中、G编号锁与禁词表豁免注各在位 1 处（E-007） | **是**（P0/P1 本就为 0；P2/P3 全部 resolved，findings F-002~F-008 状态已改 resolved） |

<五路复核里的需求路与教训路（E4 / E5），结论单独登记；结构闸只查登记位填了没、不判语义对错。>

**需求复核结论**：**changes-requested → 已收敛**（2 P1 / 3 P2 / 3 P3，八条全接全改）｜证据(E-049 / E-050 / E-053)｜由 `e4-DHR28`（Opus fresh subagent，需求视角，全程只读）　　**要点**：①brief 完成条件表**不是逐字复制**（口径 5 有 5 处词级增删，均无放松、3 处是把 DevPlan 的转述还原回 P4 §4 原文）→ 已改 brief 口径为「逐字复制 + 标注型补注」；②**验收口径 1 的「能力不匹配」既没兑现也没有登记的承接人**，DHR_29/30 两张卡全文零提「能力」→ **本卡最重的一条**，已由用户 2026-08-21 裁决改 DevPlan 补承接（F-064）；③`CANONICALIZATION.md` 自己写进批 3 交付项的 digest 基线**没做**（本卡此类第四次）→ 已补 `capability-baseline.mjs`；④**独立判断「人验项 = 0」的二分对不对 → 判对**：DevPlan §3.2 五条口径全部以「机器证」开头，「语言/代码根点选」是方向决策不是验收结果项，「协议够不够用」被 DevPlan 挂在 §4.2 P5-H 由 DHR_31 承接、没安给本卡；⑤范围三项（`canonical.mjs` / `fixture-manifest.mjs` / `.expect.json` 的 `at`）判**必要支撑非范围外扩张**——判据是「没有它们那 5 条口径能不能成立」。｜派出=e:E-045

**教训复核结论**：**changes-requested → 已收敛**（**2 条真重蹈**，均已修）｜命中条目：**DHR_26「JSON 字典不能默认用 `{}` 承载外部/未知键」**（→F-062 `__proto__` 静默丢键，四轮复核全漏）、**DHR_49 L-07「『零 X』『只用 Y』全称结论的断言必须是白名单」**（→F-063 禁词表是黑名单，同一根因已冒头两次 F-050/F-058）｜由 `e5-DHR28`（Sonnet subagent，扫库视角，全程只读）　　**另**：③密钥红线检查零命中（`fixtures/` 里的 `aaaa…`/`bbbb…` 是占位、`C:/Users/nash/fix.sh` 是故意的 G5 反例夹具，均非泄漏）；④把关本卡自提教训时抓出 **L-012/L-013 编号冲突**（同号两条不同内容）→ 已重编为 L-014/L-015，L-005 判重复→指向 DHR_49 L-06；⑤DHR_49 L-07 **2026-08-20 22:19 进仓、比本卡批 1 早 12 分钟**——时序上是可避免的重蹈，非并行独立收敛。　　**E6 miner 回流**：已跑（`dh mine dh-relay DHR_28` → 派 `e6-DHR28`），去重比对候选区 1~10 + 同仓七张卡 lesson_candidates + 本卡 L-001~L-018 后，**新抽 4 条候选（候选-11~14）**append 进 `knowledge/教训库-候选.md`，纯 append 零删除（`git diff --stat` = 32 插入 / 0 删除），状态一律「待裁决」。⚠️ miner 捎回一条关键事实：**DHR_26 的 `__proto__` 教训从未被促升进候选区**——F-062 那个洞不是「教训在册却没查」，是**教训根本没进能被查到的地方**（→本卡 L-019 的直接来源）。｜派出=e:E-046

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<标准档必做。防"改了 A 处口径、没改同义的 B 处"长成跨路径不一致。逐行列出扫了哪些同类路径；**禁空表**——"全部一致"也要逐行写明扫了什么，只写"看过没问题"= 空过。表头/枚举逐字锁定 harness-core design/12 §六，dh-check 会检查它（A12/A13）。
 **本区必须是 `##` 二级标题、独立于「独立复核区」**——`裁决` 列若落进独立复核区切片，会被 R11 语义闸的 `conclusionTokens` 当成"复核轮结论"，使"两轮结论全待定"的弱复核被误判已达标（实测可复现，见 34-DH_44 findings F-003）。降级为 `###` 子节会重新打开这个洞。>

<!-- dh:consistency-review:v1 task=DHR_28 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| v2 状态机与终态枚举 | `tools/contracts/relay-transitions.ps1` + `transition-matrix.json`（v1 现役） | **一致**（vs v1 现役）＋ **不一致→已修**（vs 本卡内部） | **有意差异 + 遗漏各占一半**。vs v1：`terminal_state` 6 态 / `result_status` 6 值 / `illegal-final-status` 拦哪两个 / `quota_exhausted` 的 `p1:false` / event `kind` 12 值 → v2 15 值（新增 11 + 改名 3 + 合并 2→1），**逐值核过全部属实**。vs 本卡内部：G2 聚合条款有**三份文字副本**，`compat-matrix.md:69` 与 `v1-gap-disposition.md:38` 两份停在 D-19 之前 → **裁为遗漏**，已改现行七档（F-069）；标「P4 原文照抄」的行保留旧文字不动，那是留痕 | e:E-047 |
| v2 身份链与 receipt 字段 | `tools/contracts/relay-identity.ps1`（v1 现役） | **一致** | **一致，无裁决项**。7 段身份链逐字段对上（`plan_version`/`plan_hash`/`authority_generation`/`node_id`/`attempt_id`/`launch_id`/`session_id`）；`attempt_id` 由正整数改不透明串、`authority_generation` 弃用改 lease、v1 的 `stale`/`rejected` 二分合并为 `late_result_quarantined` —— 三处都已如实登记为改型/弃用并写了信息损失。compat-matrix 的 v1 侧声称**抽验 5 条全部属实**（含 `relay-schema.ps1:121` 这种行号级引用） | e:E-047 |
| v2 redaction / 白名单口径 | `tools/contracts/relay-redaction.ps1`（v1 现役） | **一致** | **一致，无裁决项**。厂商白名单三处同词（`forbidden-types.txt` 头注 / `audit-contracts.mjs` / `README.md` 硬约束 1 例外条）；有意开放点实跑 0 未登记；v1 的四类 redaction + `SessionTailMaxBytes` 在 compat-matrix §4「弃用（本卡范围内）」、§6 移交 DHR_29、`OPEN-POINTS.md` O-1 **三处口径一致，无一处宣称本卡已关闭**。禁词表比权威五家**更严**（另加 `psmux`/`subagent`），方向安全 | e:E-047 |
| Read Model 字段级起点 | P4 冻结 `relay.pilot-read-model/v1` + `relay.pilot-run-list/v1`（`relay-control-pilot/src/read-model/schema.mjs`） | **不一致 → 已修 / 已登记** | **遗漏 5 条，逐条裁决**（E14 实读 P4 冻结件源文件 `relay-control-pilot/src/read-model/` 比对，非采信转述）：①`progress` 由 `{done,total}` 计数对改 0..1 比率 → **裁为遗漏，已改回**（计数对严格更强；比率形态下 P4 已验证、被 B-13 列进 P5-M4 证据的跨屏断言无法表达）；②`group` 词表（`blocked` 去 / `failed` 增）与③`failed` 归堆（`needs_you`→`failed`）→ **裁为有意差异，已逐条登记理由**；④`trigger` 两值改名（`api→system` / `parent_run→upstream`）→ **遗漏，已补进 G1 处置行**；⑤`labels` 整体消失 → **遗漏，已采纳进 `relay.run/v2`**（P4 源文件明写它是 design/04 §1「私有标识只能以不透明 label 搭车」的唯一载体）。**`group.$comment` 原称与 pilot「保持同一口径」，该陈述不实，已改为如实登记三处差异**（F-070 / F-071）。⚠️ `node_states` 必填与 DHR_49 **不打架**：DHR_49 消费的是 `relay.pilot-run-list/v1`、不碰 run-state | e:E-047 |
| Store 根与 `.gitignore` 前置 | DevPlan §2.2 `<repo>/.dh-relay/<run_id>/` + design/02 B7 D23 | **一致**（含一条已登记的有意差异） | **有意差异 1 条，已成对登记**。Store 根 `<repo>/.dh-relay/<run_id>/` 在 DevPlan §2.2 / design/02 / README 硬约束 5 **三处逐字一致**；`.gitignore` 实盘是**任意深度** `.dh-relay/` 而 design/02 要求根锚定 `/.dh-relay/` → **裁为有意差异**（任意深度 ⊃ 根锚定，方向安全），理由写在 README 硬约束 5，且与 `reason-codes.md` 的「须按 git 忽略语义判定、禁字面量匹配」**成对**出现——恰好堵住 design/02 描述的那个假阴性。「Relay 不得自改业务仓 `.gitignore`」四处一致 | e:E-047 |

> `定义是否一致` 二选一：`一致` / `不一致`。
> `裁决` 三选一：`无需处置` / `有意差异` / `遗漏待修`——`有意差异` 必带理由落点指针 `有意差异→<文档#锚点>`（否则下一个人会当 bug 再"修"回去）；`遗漏待修` 必在 `findings.md` 有对应条目。
> `派出证据` 沿用 R27 既有文法（`e:E-xxx` / `log:路径`），派发时先 `dh dispatch` 落 progress 账本、再引用；不新造 token。

## AI 提交区　⚠️ This is not human approval

<由 AI 填。标完成前的自检，到不了"已验收"。>

**Confidence Challenge**：对实现有没有 100% 信心？没有就逐条列 gap。
-

**设计契约传导声明**（diff 涉 design 切面时，收口时只保留一条；精确语义以 harness-core design/10 §三为准。创建期不预选）：

- 契约同步：<仓库相对路径#稳定锚点>
- 契约无变化：<非占位理由>

**权威文档看护声明**（仅当本次 diff 命中 `authority-docs.manifest.json` 的 `watch`、且权威文档确实无需同步时使用；把下面示例移出代码围栏并写具体理由，最终只能保留一条有效声明）：

```markdown
- 文档无需改：<本次变化为何不影响该权威文档的具体理由>
```

**需求对齐证据**（证明"真实/低成本场景里是否满足需求"；UI/交互/可视化任务必须挂截图证据，完整本地服务太贵时可用 mock 路由 / 组件级浏览器 / 静态 HTML 预览）：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| 卡目标：后续 Runtime/CLI/任何客户端有唯一契约来源 | 拿 DHR_28 冻结的 schema + 独立校验器，在**不启动 Runtime、不装 DSH** 的干净环境里加载全部 12 份 schema/shape 并解析全部跨文件引用 | E-020 / E-027 | **待人验**（批 3 补 golden/negative fixture 全跑后转「满足」；当前已证：12/12 JSON 合法、85 条 `$ref` 实解析 0 失败、`$id` 注册表 12 项无重复，且**负向测试确认护栏真的会 fail**） |
| P5-M6：协议版本、能力和未知输入均 fail-closed | 用反例喂 schema：未知字段 / 未知 method / 能力不匹配 / 非法时间戳 / 绝对路径 locator，看是否**拒绝**而非降级放行 | E-021 / E-024 / E-025 | **待人验**（当前已证：未知字段拒、非法时间戳拒、绝对路径拒；**未知版本与能力不匹配属 RPC 运行期语义**，契约层只定形态与 reason code，实证归 DHR_29/30） |
| P5-M7（契约侧）：必经角色无 DSH-only 依赖 | 构造「必经角色只声明 `dsh-agent`」的 payload 喂 schema，看是否在 **schema 层**拒绝（非运行时检查） | E-021 / E-023 | **待人验**（当前已证：该 payload REJECT；且 **`required` 改必填后不再 fail-open**——缺省不标也 REJECT；小审另跑 7 种凑数绕法全部被拒） |

**完成条件逐条挂证据**（创建期先从 brief 每条预填 # / 完成条件 / 谁验；收口时补 progress 的 Evidence ID 和达成结论）：

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | 协议正反 fixture 可由独立校验器验证；未知字段、未知版本、能力不匹配 fail-closed | AI | E-038 / E-050 / E-053（fixture 与基线）；E-021 / E-025（批 2 探针，等价 committed 证据见该行注） | **否 · 三分句中两条兑现、第三条移交**。⚠️ **不标「达成」**：本条是三个分句，前两个兑现、第三个契约层不可能兑现。①**未知字段** fail-closed ✅（全域 `additionalProperties: false` + `unknown-field` 反例）；②**未知版本** fail-closed ✅（7 份协议的判别字段全改 `const`，**7/7 实测** `E_UNSUPPORTED_VERSION`，且区分「同名异版」与「发错协议」）；③**能力不匹配** fail-closed ❌ **本卡未证**——契约层只能校验 `capability_hash` 的**形态**（`^[0-9a-f]{64}$`），一份**形态合法但与对端不同**的指纹 schema 必然放行（也只能放行）；指纹**比对**属 RPC 运行期语义。本卡兑现的是这一半：**指纹的可复算性**（`capability-baseline.json`，8 份 digest + `capability_hash`，改任一 schema 一个字即 exit 1）。**移交见 findings F-064（`open`）**；⚠️ DHR_29 / DHR_30 两张卡的验收口径里**目前一个字都没提能力**，是否在 DevPlan §4.1 给 P5-M6 补承接标注属**计划层改动**，已摆给用户，AI 不自行修改计划。正反 fixture 由独立校验器验证这一分句 ✅（golden 11/11 + negative 22/22，reason 与出错位置 `at` 双钉） |
| 2 | 协议不导入 DSH / Cordis / Pi / Herdr / DevHarness 私有类型；DSH 与 Runtime 不共享活动对象或内存状态（fixture 与 schema 静态可证） | AI | E-034（原始，结论已改准）/ E-039 / E-049 | **达成**（两个合取项各自有机器证）。①**不导入五家私有类型** ✅ 双层：结构位置 token **白名单**（162 项，未登记即 exit 1）+ 禁词表黑名单（7 词）；红测四组全真红，含「插一个禁词表里根本没有的厂商词」也被拦。②**不共享活动对象或内存状态** ✅ 由审计器第 11 维 + 白名单三条合取承重（详见验收项元数据表 A2b 行）。⚠️ 首版此合取项**零证据零断言**而 E-034 结论写成整条口径兑现（与 E-029 同形），见 F-067；判据首版还把「`type` 只能是 JSON 原生类型 ⇒ 没有字段能承载句柄」这个**假蕴含**写进等价判据，见 F-076 |
| 3 | （契约级）任一必经角色不能只声明 `dsh-agent`（schema 层拒绝） | AI | E-021 / E-038 / E-051 | **达成**。`$defs.node` 的 `if(required===true) → then executor_profiles contains {kind: not const dsh-agent}`，`h6-dsh-only-required-role` → `E_DSH_ONLY_REQUIRED_ROLE`；E2 另跑 11 例对抗全部符合预期；副本删掉 `if/then` → `npm test` exit 1。⚠️ D-11 修掉了 fail-open by default（`required` 原为可选 + 默认 false，等于「忘了标 = 不检查」），`h6-required-omitted` 钉住。两条已知边界（DAG 传递必经、`{kind:process, ref:bridge/dsh-shim.exe}`）在 F-019 诚实登记并显式移交 DHR_30/31 |
| 4 | ADR 落盘且回答 §2.3「Agent 宿主 ADR 必答」四问；语言选择依据引用 P4 报告证据 | AI | E-001 / E-002 / E-004 / E-005 / E-007 / E-008 | **达成**。四问各有 `answer:` 锚点（计数 = 4，无一问留空或写「待定」）；ADR-001 六节齐、「待用户裁决」占位为 0；P4 证据指针 cp1 抽验 6 条全真、E2 复抽 3 条全真。⚠️ ADR-002 状态头曾停在「草案 · 待用户裁决」、三条 `answer:` 行曾写着 12 份 schema 里不存在的字段名，均已改（E4 P2-1 / E2 P3-1） |
| 5 | （B-13 新增）契约文档含对 P4 主报告 §4「v1 协议缺口清单」六条实测缺口的逐条处置表（每条：采纳进 v2 字段 / 显式不采纳 + 理由；含可 grep 锚点 `v1-gap-disposition:`） | AI | E-030 / E-031（锚点计数）；F-069 的更正 | **达成**。`v1-gap-disposition: G1~G6` 锚点齐，每条六行（缺口原文照抄 / P4 投影期处置 / P4 给 P5 的含义 / v2 处置 / 落到哪个字段 / 理由），六条与 P4 §4 原表逐条对应无增删，无一条留空或写「待定」，且六条全部「采纳」并给了为什么不能有「显式不采纳」的理由。⚠️ G2 的「v2 处置」行曾停在 D-19 之前的四档口径、**与冻结 schema 机器级互斥**（E2 实测按它构造的三份载荷被本卡自己的校验器逐份拒收），已改现行七档，见 F-069 |

**验收项元数据表**（每条稳定验收项一行；机器项填「事实证明方式」、人判项填「最终裁决者」，复合观察点拆两行共享稳定 ID。协议全文见 design/05，字段协议细化归 DH_30）：

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| 协议正反 fixture 可由独立校验器验证；**未知字段 / 未知版本** fail-closed | 校验器对 golden 正例与 negative 反例逐份执行，反例逐条命中 `.expect.json` 写死的 reason code **与出错位置 `at`** | machine | DHR28-A1 | 等价覆盖 | golden 11/11 pass ∧ negative 22/22 被拒且 reason 与 at 逐条相符 | `--selftest` **pass=33 fail=0**（E-038）；`npm test` **10/10**（E-040） | Node 24 / ajv 8.20 / ajv-formats 3.0（`package-lock.json` 钉版本） | 校验器独立于 Runtime 与任何工作台进程；依赖面只有 node 标准库 + ajv 系（E2 逐条列 import 复核） | 无 | `capability_hash = 3ccf3b1043afbd82…`（`capability-baseline.json`） | schema 层可判定 | — |
| 协议正反 fixture 可由独立校验器验证；**能力不匹配** fail-closed | 契约层只能校验 `capability_hash` 的形态；指纹**比对**属 RPC 运行期语义 | machine | DHR28-A1 | **部分** | 形态非法的指纹被拒（`capability-mismatch` → `E_BAD_VALUE @ /handshake/capability_hash`）∧ 参考实现的 `capability_hash` 可复算并有基线 | 形态例被拒：`capability-mismatch` → `E_BAD_VALUE @ /handshake/capability_hash`（E-038）；参考指纹可复算且有基线，改任一 schema 的任意一个字即 exit 1（E-050 / E-053）。⚠️ **命题本身未获证**——指纹**比对**属 RPC 运行期语义，契约层不可判定 | 同上 | `capability-baseline.json`（**8 份** = 7 份顶层协议 + 1 份共享定义模块 `relay.common/v1` 的 digest 基线。⚠️ 本格原写「12 份」，那是 `audit-contracts.mjs` 的扫描面而非基线覆盖面，由 E2 代码复核轮 2 · P3-1 更正；共享模块是同一轮 P2-1 补进来的） | ⚠️ **一份形态合法但与对端不同的指纹，schema 必然放行（也只能放行）**——「指纹比对」本卡未证，移交 DHR_29；见 findings **F-064**（`open`）。本卡兑现的是「两个实现能不能算出同一个指纹」这一半 　**【2026-08-21 用户对话裁决 · 合规风险接受】**：用户点选「改 DevPlan 补承接 + 风险接受」。DevPlan §4.1 的 P5-M6 承接卡已补 DHR_29，DHR_29 验收口径已增「握手期 capability_hash 比对 fail-closed」一条机器证（附等价判据）。findings **F-064** 状态由 `open` 改 `遗留→DHR_29（已确认）`。⚠️ 本卡完成条件 1 **仍判「否」不改判**——移交不等于兑现。 | 同上 | schema 层不可判定 | — |
| 协议**不导入** DSH/Cordis/Pi/Herdr/DevHarness 私有类型 | 结构位置 token **白名单**（`structural-tokens.txt`，162 项）+ 禁词表黑名单（`forbidden-types.txt`，7 词）双层，AST 遍历只扫字段名 / enum / const、剥散文键，匹配带边界 | machine | DHR28-A2 | 等价覆盖 | 未登记 token 为 0 ∧ 陈旧登记为 0 ∧ 禁词零命中 ∧ 四组红绿对照全部真红 | audit `exit 0`，「结构位置 token: 扫到 162 个，未登记 0，陈旧登记 0」；红测：插 `acme_workspace_ref`（禁词表里根本没有的厂商词）→ exit 1；清空禁词表后插 `cordis_hint` → 白名单层仍拦；删禁词表 `dsh` → exit 2（E-039 / E-049） | 同上 | DevPlan §2.2 + design/05 §6.2 权威原文（五家） | ⚠️ **采集口径的四个洞（E2 代码复核轮 2 · P3-3 逐个实测）**：①`required: ["dsh_session_handle"]` 而无对应 property → exit 0；②`dependentRequired` 里的键 → exit 0；③`format: "dsh-handle"` → exit 0；④**新建 `relay.dsh-bridge.v1.schema.json`（文件名与 `$id` 都含厂商名）→ 本维度 exit 0**。前三条**造不出可用的私有类型**（`additionalProperties:false` 下不可满足 / `format` 在 2020-12 只是注解），实质危害极低；**第四条实质最重，且不是被本维度拦住的，而是被 `capability-baseline.mjs` 的份数断言兜住**（报「顶层应有 7 份，实为 8 份」exit 1）——⚠️ **这条依赖关系必须写在这里：谁将来放宽那条份数断言，就会同时打开这个洞**。另：`patternProperties: {"^dsh_.*$": …}` 被黑名单正确拦下 exit 1。首版是**纯黑名单**、属重蹈 DHR_49 L-07，见 F-063 | 同上 | schema 层可判定 | — |
| DSH 与 Runtime **不共享活动对象或内存状态**（fixture 与 schema 静态可证） | 三条合取：①**信封编码的形式检查**——审计器第 11 维断言每个 `type` 取值只能是 JSON 原生类型，保证协议是纯 JSON（**不单独承重**，见「未覆盖边界」）；②**跨边界引用的形状约束**——每个 `ref` / `*_ref` / `locator` / `path` 字段必须 `$ref` 到共享 `relay.common/v1#/$defs/locator`，即跨进程只传不透明相对定位串；③**字段名的全称约束**——任何新字段名必须在 `structural-tokens.txt` 有意登记（与 A2a 同一道闸），使「没有任何字段承载句柄」成为**全称**断言而非举例 | machine | DHR28-A2 | 等价覆盖 | ①第 11 维「JSON-only 信封 + 跨边界引用违规」= 0 ∧ ②内联 locator pattern 实测被拒 ∧ ③未登记 token = 0 且新增 token 必须出现在 diff 里 | audit `exit 0`，该维度 0 违规；红测：把 `executor_profile.ref` 的 `$ref` 换成内联 pattern → exit 1；插 `session_handle`（不登记）→ exit 1（E-049 / E-053） | Node 24 / ajv 8.20 / ajv-formats 3.0 | `relay.rpc/v1` 信封本身是纯 JSON-RPC 2.0 | ⚠️ **①单独不支撑本命题**（E2 代码复核轮 2 · P2-2 实测）：`properties.session_handle = {type:"string"}` 在第 11 维下**零违规**——句柄用不透明字符串装就行，天然是 JSON 原生类型。①只会被 `type:"handle"` 这种**非法 JSON Schema** 触发，而 `--selftest` 对同一篡改本来就红，故①相对既有闸的独占战果 ≈ 0。本格原写「① ⇒ 没有任何字段能承载句柄」，**那个 ⇒ 是假的**，已改为三条合取：真正承重的是②与③。**句柄若以不透明字符串搭载，形式检查不可判**——由③兜底强制「新字段名必须有意登记且出现在 diff 里」，这是可判定的最强形态。⚠️ 首版此合取项**零证据零断言**而 E-034 结论写成整条口径兑现（与 E-029 同形），见 F-067 | `capability_hash = 3ccf3b1043afbd82…` | schema 层可判定 | — |
| （契约级）任一必经角色不能只声明 `dsh-agent`，schema 层拒绝 | 构造「必经角色只声明 `dsh-agent`」反例喂校验器 | machine | DHR28-A3 | 等价覆盖 | 该反例被拒且命中 `E_DSH_ONLY_REQUIRED_ROLE` ∧ 「不标 `required`」也被拒（D-11 后不再 fail-open） | `h6-dsh-only-required-role` → `E_DSH_ONLY_REQUIRED_ROLE @ /nodes/0/executor_profiles`；`h6-required-omitted` → `E_MISSING_FIELD @ /nodes/0/required`；E2 另跑 11 例对抗（含 `required:"true"` 字符串 / `required:1` / profile 缺 `kind` / `kind` 大写 / 空 profiles）**11/11 符合预期**；副本删掉 `if/then` → `npm test` exit 1 | Node 24 / ajv 8.20 | design/06 H6 原文（E4 独立读原文后判「等价、非字面近似」） | 两条已知边界（DAG 传递必经、`{kind:process, ref:bridge/dsh-shim.exe}`）已在 F-019 诚实登记并显式移交 DHR_30/31 | `capability_hash = 3ccf3b1043afbd82…` | schema 层可判定 | — |
| ADR 落盘且回答 Agent 宿主必答四问；语言选择依据引 P4 证据 | ADR-001 / ADR-002 落盘；`grep -c "^answer: "` = 4；语言依据逐条带可复跑指针 | machine | DHR28-A4 | 等价覆盖 | 四问各有 `answer:` 锚点 ∧ 无一问留空或写「待定」 ∧ P4 证据指针抽验可复跑 | `grep -c "^answer: " ADR-002` = **4**（E-002）；`grep -c "^## " ADR-001` = **6**；「待用户裁决」占位为 **0**（E-008）；ADR-001 的 E1/E6/E7/E8 证据指针 cp1 抽验 6 条全真（E-005），E2 复抽 3 条全真 | 文档态，无运行环境依赖 | design/05 §17 明列 design/04 的「Go 已锁定为最终语言」结论作废（E-004），确认语言是真两选、非追认既定结论 | 无。⚠️ ADR-002 的状态头曾停在「草案 · 待用户裁决」（裁决当天没跟着改），三条 `answer:` 行曾写着 12 份 schema 里不存在的 `adapter_ref` / `bridge_ref` / `server_ref`——而 `answer:` 正是本条的机器锚点。两处均已改（E4 需求复核 P2-1 / E2 代码复核 P3-1） | `capability_hash = 3ccf3b1043afbd82…` | 文档结构可判定 | — |
| v1 六条缺口逐条处置表落盘且带 grep 锚点 | `v1-gap-disposition.md` 六条各带 `v1-gap-disposition: G<n>` 锚点，每条六行齐 | machine | DHR28-A5 | 等价覆盖 | 锚点 G1~G6 齐 ∧ 六条与 P4 §4 原表逐条对应、无增删 ∧ 无一条留空或写「待定」 | 锚点计数 = **6**；E4 逐条对回 P4 §4 原表确认字面一一对应；禁词类占位（待定 / 后续再说 / TBD / 另行讨论）计数 = **0** | 文档态 | P4 主报告 §4 原表（E4 与 E2 各自独立比对，非采信主会话转述） | 无。⚠️ G2 的「v2 处置」行曾停在 D-19 之前的四档口径，**与冻结 schema 机器级互斥**——E2 实测按它构造的三份载荷被本卡自己的校验器逐份拒收，DHR_29 照它实现会撞进 D-19 判死的病灶。已改现行七档，见 **F-069** | `capability_hash = 3ccf3b1043afbd82…` | 文档结构可判定 | — |

**业务化五段展示区**（人验项证据先走这五段；原始断言/完整日志退为可追溯附录，只写 `npm test ✅`/"我跑过了" 不算人验展示）：

> **本卡人验项 = 0，本区不适用（N/A）**。DevPlan §3.2 DHR_28 的五条验收口径**全部**以「机器证」开头，无任何「人判」项（对照：DHR_31 才有人判项）。E4 需求复核独立判断过这个二分——「语言 / 代码根点选」是**方向决策**不是验收结果项（DevPlan §3.1 备注把它写在**开工分流**里）；「这套协议是否真的够用」确属人判性质，但 DevPlan 把它挂在 §4.2 P5-H 由 DHR_31 承接，**没有安给本卡**，E4 不能替 DevPlan 加一条它没写的人验项。

> 因此收口走 **H=0 双谓词**（见下方「本卡人验项 = 0」节）。E11 的「用户确认本地收口授权包」是**人闸②（授权动作）**，与人判**结果项**是两件事。

**风险放行账表**（可豁免风险登记；红线——数据口径 / 两轮复核 / 未收敛 P0P1 / 生产迁移上线 / 权限安全 / 流程完整性——原则上不许进本表。权限安全唯一窄例外须按 design/05 §二③在同一风险行完整登记 `RISK-PRIVATE-OWNER-SECRET-DISPLAY` 与全部条件；缺一仍硬拦。被接受项须反查到 findings/backlog/验收池的存活记录）：

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| —（无风险放行） | — | — | — | — | — | — |

> 私有凭据窄例外不是“任意 Git 文件可存凭据”：marker 与闭集内各 key 必须唯一，只登记仓库相对配置路径；任何公开/共享/可见/受众/群聊、未知 key、非白名单持久副本或其它红线均不适用。marker 一旦出现即严格校验，无 marker 的密钥/凭据风险仍硬拦。放行只能 `risk-accepted`；未轮换 finding 保持 open，轮换后改 resolved 时同一风险行追加唯一的 `rotation-completed=true rotated-at=YYYY-MM-DD`，完成日不得在未来。

> 无风险时：**范围/影响/期限/恢复/去处 各列留空或 `—`/`无`**（接受人写 `无` 或留 `{…}` 都行，结构闸只看描述列不看接受人）——这样判 0 风险、不触发 R24。反之：只要风险描述列填了实质内容，就算真已接受风险（接受人写什么、甚至没填，都计入），首行须写"带风险放行"、不能写"端到端验收通过"。

**E9 交付汇报**：已于 2026-08-21 在对话内发出（七段）。目标/范围/验收五条逐条结论/过程账/机器闸终态/待裁决项/下一步。**未把预期说成已确认**——完成条件 1 判「否」而非「部分达成」，理由是 dev-harness 规则里只有「等价覆盖」满足原命题。

**E10 放行证据包（机器证据摘要）**：已于 2026-08-21 在对话内发出并代跑展示。五道闸终态 —— `npm test` **10/10**；`validate.mjs --selftest` **pass=33 fail=0**（golden 11 + negative 22，reason 与出错位置 `at` 双钉）；`audit-contracts.mjs` **exit 0 / 11 维度全绿 / `$ref` 实解析 84 条失败 0**；`fixture-manifest.mjs` **55 份逐份 digest 相符**；`capability-baseline.mjs` **8 份相符，`capability_hash = 3ccf3b1043afbd82…`**。**五组红测同批展示**（证明闸真会红、不是摆设）：逐条删 6 条聚合 `allOf` → 全部真红；某份 schema 的 `description` 末尾加一个空格 → 能力指纹对证 exit 1；把 `__proto__` 修复退回 → 用例立刻红；插一个禁词表里根本没有的厂商词 `acme_workspace_ref` → 白名单层拦住；把 `locator.pattern` 改成 `^.*$` → 指纹对证 exit 1。**本卡人验项 = 0**，故无「待人验池」；E11 的确认是**授权动作**（人闸②）而非人判结果项。

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [ ]
**as-built 更新了没**：本批触及的子系统，其 `as-built/<子系统>.md` 已覆盖更新到最新现状？（没动子系统现状可 N/A） [ ]

→ 当前状态：**待验收**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

<核验清单由 AI 从 brief 的"人验"条目预生成，每条"AI/用户做什么 → 对话展示/应该看到什么 → 用户判断什么"，≤5 分钟点完。
 AI 可以代执行命令行、浏览器、截图、日志、对数等验证动作，但必须在对话框完整、真实展示关键证据（命令/操作、退出码/状态、关键输出或截图、完整日志/证据落点）；只报 `✅` 或"我跑过了"不算人验。
 你查看 AI 展示的证据或亲自核验后，AI 会在对话里只问一次：是否“已查看证据，认可执行本地收口”。默认本地收口授权包包含本任务的精确本地 squash、合入复验、verify、DevPlan/workspace 回填与任务 worktree/branch 清理；任务 SESSION 只由显式命令处理；不包含 push、deploy/发布/重启、环境或生产操作、下一张卡。你可以明说“只确认人验 / 暂不收口 / 保留工作树”缩窄。确认后 AI 连续执行 E11~E13，不再逐项追问，你全程不碰 git。
 没有你的对话确认，AI 永远不得碰本区。最高危（生产上线/迁移）建议你本人敲 git，不走代签。
 ——按"目的分块"组织：先写业务目的（覆盖哪条人验项），再写本工作区在这目的下交付了什么，最后列核验表；一个目的一块，多 H 项时比平铺清单好读。>

### 本卡人验项 = 0（H=0 收口，走双谓词）

DHR_28 的验收口径 5 条**全部是机器证**（见上「完成条件逐条挂证据」表，谁验列全 AI），DevPlan §3.2 任务卡没有任何人判项——本卡的人判命题（独立 Runtime + CLI 的成本、终端控制是否够用、选定语言是否继续作默认）由 **P5-H / DHR_31** 承接，不在本卡。

因此本区**故意为空**，收口按 H=0 双谓词机器推导，不认 AI 自写"无需人判"：

- **谓词 A（人验栏为空）**：无人判结果项 ∧ 无 open 方向项 ∧ 无待认险风险项 → <收口时机器核>
- **谓词 B（放行资格）**：全部稳定验收项（DHR28-A1~A5）已分类 ∧ 机器项均有等价 pass 证据 ∧ 不可豁免项均满足 ∧ 所有未验证项要么已等价验证要么已合规风险接受 → <收口时机器核>

> **方向决策账（本卡独有，非人验项）**：批次 1 的语言（Go / TypeScript）与代码根（本仓新顶层目录 / 新独立仓）由用户在对话中点选裁决——这是**开发方向确认，不是验收结果项**，不得据此把任何结果项标"通过"。裁决记录落 `progress.md` 与 ADR-001「决策」节。
>
> E11 仍需用户一次性确认本地收口授权包（人闸②，硬闸）——这是"授权收口动作"，与"人判验收结果"是两件事。

---

- 确认记录：**2026-08-21 对话内 AskUserQuestion 两问两答**。① F-064 处置 → 用户点选「**改 DevPlan 补承接 + 风险接受**」（另两个选项：只做风险接受不动计划 / 先不收口）；② E11 本地收口授权包 → 用户点选「**放行，按包内清单执行**」（另两个选项：放行但保留工作树 / 先别动我想先看东西）。**包内**（已授权）= 本地 squash 合入主干 → 复验五道闸 → 打 `verify(dh-relay): DHR_28` 提交 → 回填 DevPlan 状态与 SHA → 删工作树；**包外**（未授权、不做）= push / 部署 / 环境操作 / 下一张卡。
- verify 提交 SHA：<AI 代打后回填；`git log --grep="^verify"` 可查>
- 签名：hyf（**chat-confirm 代签**——用户 2026-08-21 在对话内经 AskUserQuestion 明确点选放行）　　时间：2026-08-21

→ 解锁状态：**已验收**（随后各任务回 DevPlan 任务表销户）

> 铁律：没有对应的 `verify(<模块>): <任务ID列表> …` git 提交，本批任务不许标"已完成"。

### 确认记录（append-only，每次人验确认追加一行｜协议见 design/05 §九 协议三）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| 2026-08-21 | hyf（对话内 AskUserQuestion 点选，chat-confirm 代签） | E11 本地收口授权包：squash 合入主干 → 复验五道闸 → `verify(dh-relay): DHR_28` → 回填 DevPlan 状态与 SHA → 删工作树（**包外不做**：push / 部署 / 环境操作 / 下一张卡） | 工作树 HEAD `0cb0df7` + 本次 E11 登记提交 | `capability_hash = 3ccf3b1043afbd82…`；`npm test` 10/10；`selftest` pass=33 fail=0；`audit` 11 维 exit 0；`manifest` 55 份；`capability-baseline` 8 份 | DHR28-A1 / A2 / A3 / A4 / A5 | **带风险放行** —— A1 的「能力不匹配」覆盖态=部分，经用户裁决走「改 DevPlan 补承接（P5-M6 承接卡加 DHR_29 + DHR_29 验收口径增一条机器证）+ 合规风险接受」，findings F-064 由 `open` 改 `遗留→DHR_29（已确认）`；**本卡完成条件 1 仍判「否」不改判** |


