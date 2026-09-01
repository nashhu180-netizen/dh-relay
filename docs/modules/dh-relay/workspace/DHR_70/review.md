<!-- dh:v1 · review.md — 验收。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_70

## 独立复核区

本卡任务类型为 **heavy**。施工者不得复核自己的卡；代码轮 1、代码轮 2、需求、教训、一致性五路均由未参与施工的独立实例完成。第二轮复核实例负责选择并登记有效变异点。

**第一轮·批次小审合集**（本卡不分批，收口时跑完整轮 1）

> **派发形态说明**：本卡五路均为 codex `--sandbox read-only`（OS 级机器强制只读）· gpt-5.6-terra · reasoning effort high · fresh context，经 `/codex` 插件 companion 后台任务派出，cwd 钉在 `.dh-worktrees/DHR_70`。**与仓内 `knowledge/herdr-派活操作.md` 规程的偏离**：该规程前置要求主控自身在 Herdr 管的 pane 内（`HERDR_ENV=1`），本收口会话不满足，故改用上述形态——**机器强制只读这一条没有降级**，降的只是终端形态（记 L-7005）。各路只读边界如实申报：只读沙盒 `mkdtemp` 被拒，五路**均无法复跑测试**，一律为静态审；测试结果由主控执行并留证。

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|---|---|---|---|---|
| `dhr70rev1`（codex `--sandbox read-only` · gpt-5.6-terra high · fresh · session `01a05c24`） | 全 diff `35ff2db..b6a3b47`、A1/A2/A3/B/C/D 逐条、越界、**单写者是否被放宽**、是否黏旧进程、`await dead.done` happens-before、Map 迭代删元素、F-7003 诚实性 | **零 P0/P1**。**F-70-R1-01 (P2)**：A2 未证明提交经由**新取的 lease** 落地——绕开 lease 直接落盘的实现能让 A2 保持绿，而 A2 口径明写"新取 lease、新 actor、重建 gate"。其余 7 点均"看过、未发现"；第 8 点如实申报只读沙盒无法独立证实全量结论 | e:E-7008 | log:`review-code1-codex.md`；整改后 E-7010 |
| `dhr70rev1b`（同形态 · fresh · **未继承 `dhr70rev1` 会话** · session `01a05c30`） | F-70-R1-01 整改增量 `b6a3b47..8ed411d` + 对轮 1 其余结论的独立意见 | **F-70-R1-01 判闭合**（逐条推演三条新断言均非装饰性）；**零新问题、零"整改引入的新问题"**（止损换人硬条未触发）。额外核掉主控自提的脆性疑问：`renew()` 不改 epoch、提交经单一 `enqueue` 串行，故 `epoch+2` 不是过拟合断言。独立同意轮 1 其余全部结论 | e:E-7009 | log:`review-code1-reverify-codex.md` |

**第二轮·增量复核**（另派 fresh-context，不继承轮 1 会话）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|---|---|---|---|---|---|
| dhr70rev2 | 全程 + 轮 1/1b 记录 + 增量 diff + A1~D 逐条 + 越界 + **变异点选点** | 独立复核后**同意**轮 1/1b 的四条承重结论（单写者未放宽、`await dead.done` 不 reject、A3-1 判据放松后仍有防护力、F-70-R1-01 已闭合）；**明确不同意**轮 1b「无新 P2」。**F-70-R2-01 (P2)**：A2 只证了口径**后半句**——轮询把 `lease-lost` 响应整个丢弃，"旧 actor 拒绝且零 mutation"这前半句从未被断言。另选定变异点（见下表） | **changes-requested** | e:E-7011 | log:`review-code2-codex.md`；整改后 E-7015、变异 E-7017 |
| dhr70rev2b | 五条整改闭合性 + 契约同步是否越权/是否顺手放宽 + 变异证据可信度 + LES-01 是否仍过度声称 + E8 挂证据与 H=0 + 允许路径两次变更是否自开后门 + 是否引入新问题 | **五条整改技术上全部判闭合**；契约同步**未越授权小节、未放宽单写者**（`git diff` 核过，非只读改后文本）；变异证据**红因、解释、hash 链均成立**；允许路径两次变更**理由可追溯、未见自开范围**；DHR_70-C 自评「部分覆盖」**诚实且必要**；**H=0 成立**；整改**未引入新实现问题**。**F-70-R2B-01 (P2)**：终态越界证据计数失实（写 21/15，实为 23/17）；另指出 REQ-02 归因表述有误、LES-01 结论须保留样本边界 | **changes-requested** → 三条全部采纳整改后闭合 | e:E-7019 | log:`review-code2-reverify-codex.md`；整改后 E-7022 |

> **轮 2 两个实例的身份**（复核者格按机器匹配收成纯实例名，形态在此登记）：
> - `dhr70rev2` —— codex `--sandbox read-only` · gpt-5.6-terra · high · **fresh，未继承轮 1 / 1b 任一会话** · session `01a05c35`
> - `dhr70rev2b` —— 同形态 · **fresh，未继承本卡前六路任一会话** · session `01a05c84` · **自报 HEAD `843fbc4`**（派单不写死基线、由其自报，是 L-7007 的整改）
> 两者与轮 1 的 `dhr70rev1` / `dhr70rev1b` 互不继承会话；施工者（主会话）未复核自己的卡。

**有效单测·变异点登记**（重核卡：必须由轮 2 实例选点，施工方自报即红）

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人(重核须=轮2实例) | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| relay-core/runtime/service.mjs:474 | `!==` → `===`（把 `if (String(error?.message ?? error) !== 'E_LEASE_HELD:actor-closed') throw error;` 的比较符反转） | 改条件 | DHR70 A2: 旧 actor 失租关闭后，非终态 Run 的晚交必须由新持 lease 的 actor 写入唯一 Result | `node --test test/dhr70-submission-gate.test.mjs`（cwd=`relay-core`） | 934efded9bc99676e06dddb20f0a0e3c809f9d54 | d0c7ebf7bc7c3afdf79b0cf2626528c1ca3e3d56 | dhr70rev2 | 断言失败 |

> **变异取证细节**（表内只放机器可解析字段，叙述放这里）：
> - **选点权在轮 2**：锚点、原值→变异值、语义类别、对应测试、运行命令全部由 `dhr70rev2` 指定；施工会话（主控）只负责施加、跑、还原、取 hash（e:E-7017）。重核卡规矩是施工方自报即红。
> - **实测比选点人预期更强**：轮 2 只预测 A2 会红，实测 **A2 与 A3-1 同时红**（`6 tests / 4 pass / 2 fail`，exit=1）——正例与「不得放宽单写者」红线负例双抓。
> - **红因已确认**（候选-45 的要求：变异后红了要先确认红的原因）：A2 停在 `refusals >= 1`，而非轮 2 预测的 `assert.equal(settled.error, undefined)`。因为判据反转是**双向**的——`===` 之后 `lease-lost` 反被吞掉并触发摘除重建，轮询首次即成功、拒绝阶段被整段跳过，这正是「放宽单写者」的形态；A3-1 则停在 `assert.match(…, /lease-lost/)`，同源。
> - **hash 链**：登记的是 **git 对象 id**（`git cat-file -e` 可取回复现），两个对象均已在库中——变异态 `934efded` 由 `git hash-object -w` 写入，还原态 `d0c7ebf7` 即当前提交里的 blob。还原后 `git hash-object` 与施加前**同一对象**，`git status` 0 处改动，CRLF 1078/1078 未混（候选-53）。另存文件级 sha256 链 `7b7e3bcd…` → `d40307ff…` → `7b7e3bcd…` 作旁证。
> - **还原后复跑**：首次撞 F-7004 环境 EPERM 红一条，紧接两次 exit=0 / 0 fail / 零 EPERM。


**返工收敛**

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|---|---|---|---|
| 1 | 0（另 1 条 P2：F-70-R1-01） | A2 补「lease 真换手」三条断言（`8ed411d`）；定向 6/6（E-7010） | 是（`dhr70rev1b` 判闭合、零新问题） |
| 2（Review Batch 四路并发） | **1**（F-70-REQ-01，需求路提、一致性路裁决 1/2 独立收敛到同一处） | ①F-70-REQ-01：**用户对话授权扩路径**，design/12「Gate 生命周期」末句同步为"gate 不得失去可达性"，review 声明改**契约同步**（`5d372e5`）②F-70-R2-01：A2 补拒绝阶段零 mutation 断言（`1e118a2`）、定向 6/6 exit=0（E-7015）③F-70-LES-01：三轮全量 18/15/14 + master 对照差集为空（E-7016）④F-70-LES-02：补 exit code/wall-clock ⑤F-70-REQ-02 提出时已过期、F-70-REQ-03 属 E8 未做 ⑥变异点施加/还原取证（E-7017） | 是（`dhr70rev2b` 判五条技术闭合，另提一条 P2 见下轮） |
| 2b（收口复验） | 0（新提 1 条 **P2**：F-70-R2B-01 计数失实） | 三条全部采纳、无一驳回：①终态越界计数在**最终提交**上重取并改正 21/15 → 23/17（E-7022）②F-70-REQ-02 归因由「提出时已过期」改为「后续整改已闭合」——不把有效发现的成因推给派单基线③F-70-LES-01 结论再收窄为「**本次样本 / 可比条件下**未见新增稳定失败」，不外推为全仓永久零新增 | 是（三条均为**证据表述**缺陷，不涉实现；实现侧自 `1e118a2` 起未再改动） |

> **止损换人硬条**：未触发。轮 1 的整改经 `dhr70rev1b` 判定"零新问题、零整改引入的新问题"；轮 2 的整改交由 `dhr70rev2b`（fresh、未继承前四路）复验。全程无"同一条 finding 连续 2 轮修完引入新问题"——轮 2b 明确记载「整改未引入新的实现问题」。**返工共 3 轮（1 / 2 / 2b），未达 3 轮不收敛的停机线**：轮 2b 提出的是证据表述缺陷、非实现缺陷，且当轮即闭合。

**需求复核结论**：**changes-requested（2×P1 / 1×P2）→ 主控裁决后三条全部 closed**｜F-70-REQ-01 属实并已按用户授权做**契约同步**；F-70-REQ-02 系派单基线写死导致的**过期发现**（复核者本人已声明后续提交不计入其结论），其两个缺口分别由 `8ed411d`、`1e118a2` 闭合；F-70-REQ-03 属 E8 当时未做、非缺陷｜另确认：范围**未往大漂**、brief 对 DevPlan **逐字一致无口径松动**、**H=0 本身成立**（六条均机器证，但不免除 E11 对话确认）、方向决策账无发现（H1/H2/H3 是归因假说，未被冒充为验收通过）｜证据(E-7012、E-7010、E-7015、E-7016)｜由 `dhr70req`（原文 `review-req-codex.md`）｜派出=e:E-7012

**教训复核结论**：**N/A（可核查）**｜正册 `knowledge/教训库.md` 不存在，不拉 Pair、不要求 Binding｜扫候选库全 58 条，命中 13 条（候选-6/12/23/31/35/39/45/48/49/50/51/56/58）；**判定重蹈 4 条**（候选-12/23/31/48，同一病灶：用单次隔离绿推出全称抖动结论）→ 已由 E-7016 三轮实证闭合；未重蹈 候选-35/39/50/58；候选-6/45/49（变异证据须以最终提交为基线）已由 E-7017 在最终提交 `f2aad12` 上闭合｜本卡 L-7001~L-7004 经其逐条质量核：**四条均判真教训、无库内重复**，并确认 L-7003 表述准确、未把"判据写松"包装成合理化；L-7004 按其建议回链候选-31/48｜由 `dhr70les`（原文 `review-lessons-codex.md`）｜派出=e:E-7014

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_70 -->

> 复核者 `dhr70con`（codex 只读沙盒 · terra high · fresh · session `01a05c36`）。**比对清单**（横向复核的硬要求，"全部一致"也要列）：当前 actor 路由 6 处 · lease 拒绝语义 7 处 · gate 注册 4 处 · Result 幂等 5 处 · 允许路径 8 项对 6 条实际 · `drivers`/`actors` 清理 9 处 · 异步收口 `await *.done` 5 处 · 命名组织 4 处。**结论：零"遗漏"级发现**，两处裁定为「有意差异」。

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| 提交路由「当前持 lease 的 actor」 | `submitExecutorResult` 首轮 drivers 循环（`service.mjs:469-500`）vs durable 重建循环（`:487-499`）vs `commitReceipt`（`:650-703`）/ `stopDriver`（`:507-512`） | 是 | **一致**——所有写入路径都经本届 actor；本卡只摘除"actor 已关闭"对应的陈旧 route，不直接写 Store，也不把提交固定到写 Receipt 的旧进程 | e:E-7013 |
| `actor-closed` / `lease-lost` 的拒绝语义 | `host.mjs:157-161` `refuseIfClosed` · `host.mjs:62-64` Store `writeGuard` · `service.mjs:70-74` `withReason` · 本卡 `:474` | 字面不完全一致（两类错误共享协议 reason `E_LEASE_HELD`，本卡按**完整 message** 精确分流） | **有意差异（裁决 1）**——必须区分"陈旧 route 可重建"与"写入 fence 必须拒绝"，而 `error.reason` 上两者都塌缩成 `E_LEASE_HELD`；仓内既有 `host.mjs` 的 `isLostLease` 是同款完整 message 精确匹配，形态一致。**理由已按其建议落进 design/12「Gate 生命周期」**（含"后续若泛化成 `startsWith('E_LEASE_HELD')` 等于拆了单写者闸门"的警告），并同步进 `as-built/relay-core.md` §12 | e:E-7013 |
| gate 注册与本届 driver 生命周期 | `workflow-driver.mjs:239-240`（新 Attempt）/ `:527-528`（恢复既有 Attempt）· `service.mjs:415-419`（bootstrap）/ `:496-499`（本卡 durable 重建）/ `:654-656`、`:701-703`（start/resume） | 是 | **一致**——gate 的归属是 **Receipt/Attempt，不等同于旧 actor**；旧 actor 关闭时删除陈旧 driver 后按 durable Receipt 事实向新 driver 重建同一 gate | e:E-7013 |
| 「恰一条 Result」与幂等 | `dhr64-result-bridge.test.mjs:108/289/319` vs 本卡 `dhr70-submission-gate.test.mjs:182-186/243-247` | 是 | **一致**——本卡只改变到达 Store 的合法 actor/gate 路由，唯一 Result 与 digest 幂等仍由既有 Store Result bridge 保证 | e:E-7013 |
| 允许路径 vs 实际 diff | DevPlan `dh:allowed-paths:v1 task=DHR_70` vs `git diff --name-only` | 是 | **一致**——复核时（`35ff2db..b6a3b47`）6 条全在允许集内、`git diff --check` 无输出。**复核后另有两次允许路径变更**：①`design/12` 与本 DevPlan 卡节按**用户对话授权**扩入（起因即本路裁决 1/2 与需求路 F-70-REQ-01）②`as-built/relay-core.md` 按 brief 既有「触及子系统」声明**补登**（原清单漏列）。终态越界自查见 E-7020 | e:E-7013 |
| gate 可长于创建它的 actor | 本卡 `evictClosedActor` vs design/12 冻结表述 | 字面冲突（原文"不得从 drivers map 删除该 receiver gate"） | **有意差异（裁决 2）**——晚交仍必须经过 Receipt gate；本卡通过"摘旧 driver + 按 durable Receipt 重建"消除死 route，兑现该条用意。**与需求路 F-70-REQ-01 独立收敛到同一处**，已按用户授权做契约同步 | e:E-7013、e:E-7012 |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：
- 生产改动只有 `service.mjs` 一处（`submitExecutorResult` 首轮 drivers 循环 + `evictClosedActor`）。信心来自三条**可复算**的证据，不来自"看起来对"：①定向套件 6/6 且 exit=0（E-7015）；②轮 2 指定的变异点施加后 **A2 与 A3-1 双红**、还原后逐字节复原并转绿（E-7017）——红线负例参与了变异对照，说明"没修过头"这条不是自评；③三轮全量 + master 同条件对照，失败集合差集为空（E-7016）。
- **信心的边界，明说**：本卡**不跑真实 Agent**。A4 的真实闭环归 DHR_35，本卡六条全部是受控夹具跑真实 service/driver 的机器证。所以"Claude 那条交不进去的 Result 现在能交进去"这句话，本卡证到的是**机制层**（失租关闭后的重建补交路径通了），不是**产品层**（真实 Claude 实录仍待 DHR_35 重跑，且那不在本卡授权内）。
- **另一处诚实边界**：五路复核者**全部无法复跑测试**（只读沙盒 `mkdtemp` 被拒），一律静态审。所有测试结果均由主控执行，复核者只能核我的推理与断言，不能独立复算我的数字。这是本卡证据链最弱的一环，已如实登记而非掩饰。
- 本卡套件**不免疫** F-7004 的环境 EPERM（还原变异后的首次复跑就撞上一次），"6/6 绿"须带这个限定读。

**设计契约传导声明**：
- **契约同步**（唯一一条，改自原先的"契约无变化"）：`design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md`「Gate 生命周期」末句由"正常完成前，service **不得从 drivers map 删除**该 receiver gate"同步为"正常完成前，该 receiver gate **不得失去可达性**：service 可摘除 actor 已关闭的陈旧 driver 条目，但必须按同一 Receipt 从 durable 事实重建 gate；晚交任何时候不得绕过 gate，也不得要求新签 Receipt"，并附 DHR_70 同步说明。
  - **为什么必须同步**：原表述预设"driver 条目还在 = gate 还能用"，而本卡实测出第三种形态——driver 条目在、它那一届 actor 已失租关闭。修复兑现了该句的**用意**却与其**字面**冲突。需求复核 F-70-REQ-01 与一致性复核裁决 1/2 两路独立收敛到同一处。
  - **授权**：用户 2026-09-01 对话点选「扩路径，本卡同步掉」，范围**仅限该节措辞**。
  - **不变的部分（这条同步没有放宽任何东西）**：Receipt/Result/RPC 合同、reason code 表、Store mutation 语义一律未动；gate 归属仍是 Receipt/Attempt 而非某一届 actor；重建仍走 `ensureActor` 重新取 lease；单写者与 `writeGuard` fencing 一律不放宽——只有精确的 `E_LEASE_HELD:actor-closed` 触发摘除重建，`lease-lost` 必须原样拒绝（A3 是这条的机器闸，变异对照里它也红了）。

**需求对齐证据**（本卡无人判项；机器证用受控夹具跑真实 service/driver）：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| P6-RI-A1：非终态 + current Receipt 的晚交能落地 | **两个子场景各自取证**：①lease 仍有效的晚交（A1，本届 herdr 等待已收口到 `observation_status=observation_lost`）②旧 actor 失租关闭后的重建补交（A2，外部把 `host-lease.json` epoch+1 且 holder 用已死 pid） | E-7002（A1）、E-7015（A2 终态 6/6）、E-7017（变异对照） | **满足** |
| P6-RI-A3：无合法 lease 一律不改账 | 真 lease-lost（另一进程**活着**持有、租约未过期）/ 非 current Receipt / 已终态 三条负例 | E-7003、E-7015、E-7017（变异下 A3-1 亦红，证明该负例在咬） | **满足** |
| DHR_35 E-3526 形态 | driver 层注入 `statuses:['idle'] + paneAlive:false`，末条 `host_observation_changed` 确为 `agent_get=idle;pane_get=error` | E-7004、E-7015 | **满足（机制层）**——见下方边界说明 |

> **这三行证到哪、没证到哪**（需求复核 F-70-REQ-03 要求把话说清）：三条都是**机器证**，用受控夹具跑**真实** service/driver（不是 mock 掉被测路径）。**没证到的是产品层**：本卡不跑真实 Agent，DHR_35 的 Windows 真实 Codex/Claude 实录是 P6-RI-A4，归 DHR_35 且**不在本卡授权内**。所以本卡的结论是"提交权的机制缺陷已修复且有机器闸守住"，不是"Claude 实录已通过"。

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---|---|---|---|
| A1 | lease 仍然有效、Receipt 仍 current、节点非终态 → 晚交（含 driver 本届 herdr 等待已结束）必须得到 committed Ack + `relay.result/v2`（`structured.source=receipt-bound-submission/v1`）。 | machine | E-7002、E-7015 | **是**——断言链含 `holder_pid === process.pid`（证 lease 确由现役合法持有）、等到 `observation_status=observation_lost`（证本届等待已收口）、committed Ack、`structured.source=receipt-bound-submission/v1`、`results/` 恰一个文件、节点转 `succeeded`、同 digest 重投 `idempotent:true` 不新增 Result |
| A2 | 旧 actor 已结束或已失租、Run 非终态、Receipt 仍 current → 旧 actor 对提交拒绝且零 mutation；service 新取 lease、新 actor、重建 gate 后提交恰好一个 Result；同 digest 重投幂等。 | machine | E-7006（修前红·同码复现）、E-7010、E-7015、E-7017 | **是（口径两半分别取证）**——**前半句**：轮询期每一次被拒都断言 `E_LEASE_HELD` + 零 Result + `events.jsonl` **逐字节不变**，另加 `refusals >= 1` 防「首次即成功因而什么都没证」（F-70-R2-01 整改）；**后半句**：成功后断言 `holder_pid === process.pid`、`epoch === held.epoch + 2`（外部接管是 +1）、`lease_acquired` 序列**恰新增一条**——该事件只在 host 取到 lease 后写，故新增一条即证新起了一届 actor 而非旧 actor 复活（F-70-R1-01 整改）；重投 `idempotent:true` 且 `results/` 仍恰一条 |
| A3 | 无法合法取得当前 lease（真 lease-lost / 非 current Receipt / 已终态）→ 保持拒绝、零 mutation。禁止为修 `actor-closed` 放宽单写者。 | machine | E-7003、E-7015、E-7017 | **是**——三条负例**在实现前先绿**（作「没修过头」基线），实现后仍绿。A3-1 两阶段都 reason=`E_LEASE_HELD`、`results/` 空、`events.jsonl` 逐字节不变、节点仍 `running`。**红线机器闸的有效性已被变异对照证明**：变异让 `lease-lost` 被吞掉后 A3-1 立即变红 |
| B | 未知 Receipt / 终态冲突仍按现役拒绝或幂等，不因改 gate 而变。 | machine | E-7003、E-7015 | **是**——未知 Receipt → `E_IDENTITY_MISMATCH` 且零 Result；终态冲突换 outcome 重投 → `E_TERMINAL_STATE_CONFLICT`，已落 Result 未被改写 |
| C | `agent_get=idle` ∧ `pane_get=error`（对齐 E-3526 观测）**不得单独**把 Attempt 写成 `E_EXECUTOR_HOST_LOST` 终态；提交走 A1 或 A2。 | machine | E-7004、E-7015 | **是（且未改任何实现）**——末条 `host_observation_changed` 确为 `agent_get=idle;pane_get=error`；全程无 `E_EXECUTOR_HOST_LOST`、无 `attempt_failed`，只落 `E_EXECUTOR_RESULT_MISSING` Attention，节点停 `waiting_human`（非终态），`hasOpenSubmissionGates` 仍为 true，随后提交成功。**副产物：H2 假说被否**——`pane_get=error` 与本卡故障无因果，DHR_69 的「仅 idle∧blocked 才覆盖」已挡住它 |
| D | 定向套件可复跑；`git diff --name-only` 不越 DevPlan 逐条允许路径。 | machine | E-7015、E-7017、**E-7022**（E-7020 计数已作废） | **是**——套件可复跑（终态连跑 3 次：一次 exit=1 系 F-7004 环境 EPERM，紧接两次 exit=0 / 0 fail / 零 EPERM）；终态 `git diff --name-only master --cached` 共 **26 个文件（workspace 20）逐条落在允许路径内**（含用户授权扩入的 `design/12` 与 DevPlan 卡节、按 brief 既有声明补登的 `as-built/relay-core.md`），`git diff --check` 无输出。⚠ 早先 E-7020 记的 21/15 系**中途取数**，已由轮 2b 逮到并作废（F-70-R2B-01 / L-7010）——路径无越界的结论不受影响，作废的只是计数 |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| lease 有效时的晚交必须落地 | 非终态 Run + current Receipt + 本届等待已结束的提交 | machine | DHR_70-A1 | **等价覆盖** | committed Ack；`relay.result/v2` 恰 1 条；`structured.source=receipt-bound-submission/v1` | **pass**（E-7002；终态 E-7015 exit=0） | 本地 Node · Windows 11 · `--test-concurrency` 默认 | Store 事件 + Ack | 不跑真实 Agent | design/12 P6-RI-A1 | service/driver tests | 自动化 |
| 旧 actor 已死时由新持 lease actor 重建后补交 | 令旧 actor 失租或结束后提交 | machine | DHR_70-A2 | **等价覆盖** | 旧 actor 零 mutation；新 lease/新 actor/新 gate；Result 恰 1 条；同 digest 重投不新增 | **pass**（修前红同码复现 E-7006 → 修后 E-7010/E-7015；变异对照 E-7017 转红） | 本地 Node · Windows | Store 事件 + lease epoch + `lease_acquired` 序列 | 不要求打到写 Receipt 的那一届进程 | design/12 Gate 生命周期（本卡已同步） | service tests | 自动化 |
| 无合法 lease 一律拒绝且零 mutation | 真 lease-lost / 非 current Receipt / 已终态 三负例 | machine | DHR_70-A3 | **等价覆盖** | 拒绝码不变；Store 无任何新事件 | **pass**（E-7003 实现前先绿 → 实现后仍绿 E-7015；变异下 A3-1 转红 E-7017，证明该闸在咬） | 本地 Node | Store 事件计数 + `events.jsonl` 逐字节比对 | 无 | design/12 P6-RI-A3 | service tests | 自动化 |
| 未知 Receipt 与终态冲突行为不变 | 现役基线负例回归 | machine | DHR_70-B | **等价覆盖** | 与 master 基线逐条同结果 | **pass**（E-7003、E-7015；`dhr64-result-bridge.test.mjs` 隔离 10/10，未改动） | 本地 Node | DHR_64 既有断言 | 无 | design/12 | service tests | 自动化 |
| pane_get=error 不单独判死 Attempt | fake herdr CLI 注入 `statuses:['idle'] + paneAlive:false`，驱动**真实** driver | machine | DHR_70-C | **等价覆盖** | 无 `E_EXECUTOR_HOST_LOST` 终态；提交仍走 A1/A2 | **pass**（E-7004、E-7015；现役已满足，未改实现） | 本地 Node | driver 事件序列 | **真实 Herdr 会否产出该观测形态，不由本卡取证——归 DHR_35 的 P6-RI-A4（真实 Agent 闭环）** | DHR_35 E-3526 | driver tests | 自动化 |
| 定向套件可复跑且不越界 | 复跑命令 + `git diff --name-only` 比对 | machine | DHR_70-D | **等价覆盖** | 套件可复跑；diff ⊆ 允许路径 | **pass**（E-7015 exit=0；**E-7022**：终态 26 文件全在允许路径、`git diff --check` 无输出；E-7020 的 21 计数已作废） | 本地 Node · git | `dh:allowed-paths:v1 task=DHR_70`（含本卡两次授权/补登变更） | 无 | DevPlan | 脚本 | 自动化 |

**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|---|---|---|---|---|---|---|
| 无 | — | — | — | — | — | — |

> **DHR_70-C 覆盖态的判定（用户 2026-09-01 对话裁决：等价覆盖）**：本命题是「**driver 的决策逻辑**在 `agent_get=idle ∧ pane_get=error` 下不得判死 Attempt」。夹具里被 fake 的只有 herdr CLI，**driver 是真实代码**；注入的两个观测值是 DHR_35 实录 E-3526 里**真实出现过**的值，不是构造的假设输入。真实观测输入 × 真实决策逻辑 → 对本命题构成等价覆盖。
> **主控自我更正留痕**：E8 初稿曾自评为「部分」，那是把「本卡没做端到端 A4」错当成「证据只部分覆盖本命题」——两者是**不同命题**。轮 2b `dhr70rev2b` 当时评价该降级「诚实且必要」，它评的是自报诚实度、未在 design/05 §五 四态语义与 R21 闸门的视角下判定。本次更正会把 R21 从失败翻为通过，故**不由主控单方改口**，已在对话里明示理由并由用户裁决。
> 
> **本卡无可豁免风险放行项**：六条完成条件均已 pass，无「未验证且未获风险接受」的项。DHR_70-C 的「真实 pane error 形态」按覆盖四态登记为**部分覆盖 / 未覆盖边界**，**不是**风险接受——它本就属 DHR_35 的 P6-RI-A4 范围，不是本卡欠的债。
> **红线不可豁免项自查**：两轮复核完整性 OK（轮 1+1b、轮 2+并发四路，均 fresh 独立实例，施工者未复核自己的卡）· 未收敛 P0/P1 OK（七条复核发现全部 closed）· 权限安全 OK（零凭据入工件）· 流程完整性 **待**（worktree 尚未收口，E12/E13 待 E11 授权）· 数据口径 N/A（本卡不动指标口径）· 生产/迁移/上线硬证据 N/A（本卡不含生产接入，真实闭环归 DHR_35）。

**材料齐没齐**：brief / task_plan / progress(证据 E-7002~E-7022) / 独立复核记录（**七份**复核者+miner 原文 + **七份**派单）/ findings / lesson_candidates / review 都有了？ [x]
**as-built 更新了没**：本批触及的子系统，其 `as-built/relay-core.md` 已覆盖更新到最新现状？ [x] —— 新增 §12「DHR_70 增量 —— 提交权在 Attempt 非终态时的 gate/actor 生命周期」：修的是什么 / 现在的行为 / 单写者没被放宽 / 契约同步 / **已知边界与坑**（精确 message 匹配不得泛化成 `startsWith`、lease TTL 不可注入、本卡不跑真实 Agent）/ 证据。

→ 当前状态：**待人验（E10 放行包已生成，等 E11 对话确认；worktree 未收口）**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

本卡六条完成条件**均为机器证**，无人判结果项（H=0）。E11 仍需对话确认本地收口授权包。没有对话确认，AI 不得碰本区。

### 目的一：证明 Claude 那条交不进去的 Result 现在能交进去，且没把锁拆了（覆盖 A1/A2/A3/B/C）

本工作区交付：非终态时提交权保持 + 合法重建。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| （无人判项）查看机器证包 | 看 E10 展示的定向测试、事件序列与越界自查 | 六条机器证均有等价 pass；A3 三条负例仍绿 | [x] 通过 |

- 确认记录：用户 2026-09-01 在对话里看完 E10 证据展示区（A1/A2/A3 三段业务化五段 + 变异对照 + 全量回归 + 证据落点 + 「七个复核者均无法复跑测试、一律静态审」的诚实边界申报）后，点选「**认可，执行本地收口**」。同拍裁决三条尾巴：F-7003 / F-7004 入 backlog、F-7002 明确挂起、L-7001~L-7010 本次一并提炼。
- verify 提交 SHA：本提交（squash `64a7950`）
- 签名：hyf（chat-confirm 代签）　　时间：2026-09-01

### 确认记录（append-only）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---|---|---|---|---|---|---|
| 2026-09-01 | hyf（对话确认 · AI 代签） | DHR_70 本地收口授权包（人验记录 → 精确 squash 合入本地 master → 合入后复验 → `verify(dh-relay)` → DevPlan/workspace/status 回填 → 删任务树与分支；**不含** push / deploy / 环境操作 / 真实 Agent / DHR_35 重跑 / 下一张卡） | 终态 `f66e817`（26 文件 / workspace 20；`dh dh-relay` 0 失败 78 警告） | 定向套件 6/6 exit=0（E-7015）· 变异对照 A2+A3-1 双红、hash 链 `7b7e3bcd`→`d40307ff`→`7b7e3bcd`（E-7017）· 三轮全量 18/15/14 且 master 同条件对照差集为空（E-7016）· 终态越界 26 文件零越界（E-7022）· 收口体检 0 失败（E-7023） | DHR_70-A1 / A2 / A3 / B / C / D | **通过**（H=0，全验收通过，非带风险放行） |
