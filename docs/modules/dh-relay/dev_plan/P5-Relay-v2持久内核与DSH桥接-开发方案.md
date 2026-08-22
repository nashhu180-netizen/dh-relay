# P5-Relay v2 持久内核与多控制面桥接 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:planning-event:v1 id=DHR-B-15 stage=B-adjust artifact=dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md review=../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b15 understanding=../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#understanding-b15 -->
<!-- dh:status
汇报: P5 已按 design/06 重写为「控制面独立的承重内核」：Runtime + Store + 参考 CLI 必备，DSH/Pi 只是可替换客户端。B-11（2026-08-20）：解锁前置改为 P4-CM1/2/3/5/6a + 主报告 + 用户放行，不再等 DSH 三态收敛；DSH 轨与本阶段并行，汇合点在 DHR_30 的 DSH Bridge 条件部分与 DHR_31 的 DSH 附加客户端项（须有 DHR_50 结论才执行）
现状: **P4 阶段闸已解锁**——CM1/2/3/5/6a 全绿 + 主报告落盘（P4 verify `252a131`）+ 用户 2026-08-20 对话放行；**DHR_28 已完成**（verify `0e2dd54`，2026-08-21 用户对话放行）——relay v2 最小协议集已冻结，`relay-core/` 是本仓唯一契约来源。**DHR_29 已于 2026-08-21 经 `DHR-B-15` 拆为三张卡**；DHR_29 已开工，DHR_51 / DHR_52 / DHR_30 / DHR_31 未开始。
进行到: P5 ▸ **DHR_29 已完成**（2026-08-22 用户对话放行、chat-confirm 代签 verify；SHA 回填见本表）；DHR_51 / DHR_52 / DHR_30 / DHR_31 未开始。
下一步: **开工 DHR_51**（Detached 宿主 / lease / `run_id` 发号 / 恢复）——开工前仍按入口闸单独分流并需用户对话内确认；承接项含 DHR_29 带出的 F-011（raw result-kind 绕终态锁，runtime 层封堵）与 §8.4 lease 语义等价性复核。
看什么: **`relay-core/README.md`（硬约束 6 条 + 「改了什么跑什么」基线对照表）与 [as-built/relay-core.md](../as-built/relay-core.md)（含「这套东西是怎么长成现在这样的」一节，动它之前先读）**；P4 主报告（evidence/10 §4 v1 协议缺口清单）、design/05、design/06
阻塞: 无。DHR_28 已收口，DHR_29 的依赖（契约冻结）已满足；`DHR-B-15` 已由用户 2026-08-21 对话确认落盘
-->

> 文件名沿用首次落盘的「DSH桥接」，标题与责任已按 design/06 改为多控制面桥接；改名放 P9 统一处置。

## 0. B 方案审核与理解确认

### 0.1 白话说明：这个阶段做啥、解决啥、做完得到啥

- **要解决的问题**（`DHR-B-15` 后按 5 张卡叙述）：现在 AI 干活是「你开着窗口它才跑，窗口一关就断」。P5 要造一个后台常驻的「接力内核」：任务状态存在它那里，你关掉窗口、断开 SSH，活照样跑，回来还能接着看。同时定死一套协议，让命令行、DSH、Pi 这些窗口都只是「看同一份真相的不同显示器」。

| 任务 | 用大白话说在做啥 | 解决什么问题 |
|---|---|---|
| DHR_28 | 先拍板技术选型（内核用什么语言写、怎么独立跑），把内核和外部窗口之间说话的「协议」定死，并给一份样例数据集和校验器 | 后面所有人（内核、命令行、DSH、Pi）说同一种话，避免各写各的 |
| DHR_29 | 先做**账本**：任务的每一步都记成一行、只追加不改写，状态不是存下来的、是把账从头念一遍算出来的；顺带把上一张卡冻结协议时留下的一批已知小口子一次性补掉 | 有了这本账，「崩了能重建出一模一样的状态」才有依据；协议的口子早补比晚补便宜 |
| DHR_51 | 再把账本装进一个**后台进程**：脱离终端活着、同一时刻只有它能写、被强杀后能接管重建；顺带把「这趟接力叫什么名字」这套发号规则做掉 | **「关窗不停工、断线不丢账」在这一刻真正成立**——也是你第一次能看到东西的节点（有个简易读数能看宿主还活着、账走到第几条，但还不是正式命令行） |
| DHR_52 | 再开一个**对外的门**：外部程序能连进来订阅和查询；连接时先对暗号（能力指纹），对不上直接拒绝、绝不「降级凑合着用」 | 命令行、DSH、Pi 之后都从这扇门进；对暗号是防止两边版本不一致却假装能协作 |
| DHR_30 | 做正式的命令行客户端（查询 / 跟踪 / 启动 / 停止 / 恢复），条件允许时把 DSH 接到同一内核上；给 Pi 等其他窗口留好接口 | 命令行成为第一条正式控制面；DSH 是并行接入的第二条，两者读同一份状态 |
| DHR_31 | 全程不开 DSH，只用命令行跑通一条最小任务：启动 → 处理 → 收结果 → 机器验收 → 完成；中途关掉终端再连回来，状态一致 | 端到端证明内核真的能脱离任何窗口独立工作 |

- **完成后你手里有什么**：
  1. 一个后台常驻的接力内核 + 一份定死的协议（后面 P6~P9 都在它上面盖房子）。
  2. 一个正式的命令行控制面，可以启动、看、停、恢复任务。
  3. 一次「关掉窗口任务照跑、回来能接上」的实证。
  4. DSH 接入内核的桥（如果 P4 判 DSH 可行）。

### 0.2 审核与确认记录

- **事件类型**：B-新建（2026-08-18 从 design/05 阶段主线拆出）+ 同日 B-调整（按 design/06 把 DSH Bridge 从必交付降为可选 Adapter，Relay CLI 升为必备参考客户端，新增 fail-closed 与客户端断开不取消 Run 等硬约束）。同一未确认事件内修订，任务数、依赖未变。
- **审核记录**：已做闸前路线图级 fresh 审核——2026-08-18 claude-grok（fresh、只读、`--model grok-4.5`）R-P56 一致性与承接审，结论「有条件通过」；原文与只读形态见 [evidence/09](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b05)。P4 阶段闸通过、用户放行后，依据前序证据再做定向 B-调整 + 复审（不是「闸前不能审」）。
- **主会话裁决**：已做——逐条采纳 / 待用户决定见 [evidence/09 §2 裁决总表](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#2-主会话裁决总表2026-08-18)；已采纳项已回写本计划正文，「待用户决定」项在正文显式标注。
- **讲解记录**：待补——重点讲清 Run 真相从哪进（start request）、存在哪（`<repo>/.dh-relay/<run_id>/`）、Runtime 承诺什么（客户端断开不取消、强杀可恢复、fail-closed）、如何独立验证（状态签名重建、CLI 与客户端同 Read Model）、失败怎么发现（reason code / Attention）。
- **理解问题**：待补（候选：「Runtime 强杀后恢复，你期望的是『完全一致地续跑』还是『恢复到最后安全点、需人确认再续』？」）。
- **用户回答 / 解释**：待补。
- **调整与复审**：待补。
- **用户确认**：待补。**DHR_28~31 与 `DHR-B-15` 新建的 DHR_51 / DHR_52 为预留编号，落盘不等于 B 确认，也不构成开工授权。**
- **B-12 关联修订（2026-08-20，本计划侧事件；与 P4 `DHR-B-11` 同批、同一次审核 / 讲解 / 用户确认）**：本计划前置条件、DHR_28 依赖口径、DHR_30/31 的 DSH 条件项判定依据（含 H4「DSH 插件卸载」子命题条件化、P5-H「DSH 组合」问条件化）随 B-11 调整同步修订——解锁不再等 DSH 三态收敛，DSH 条件项以 P4 DHR_50 结论为开工判据。事件本体见 P4 计划 §0.2（DHR-B-11），本计划侧记录见 [evidence/09 §21~§22](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b12)。本条不改变 DHR_28~31 的任务拆分与验收口径本体。
- **B-14 收口期 B-调整（2026-08-21，DHR_28 收口证据回流）**：DHR_28 收口时发现 **P5-M6「协议版本、能力和未知输入均 fail-closed」是三个分句，而承接卡只写了 DHR_28**——其中「协议版本」与「未知输入」DHR_28 已在契约层证毕（7 份协议的判别字段全为 `const`，7/7 实测；全域 `additionalProperties: false`），但**「能力不匹配」契约层不可能证**：schema 拿不到对端指纹，一份形态合法而与对端不同的 `capability_hash` 必然被放行。而 **DHR_29 / DHR_30 两张卡全文里 `capability` / 能力 / 指纹 / 握手 四个词零命中**（主会话与 E4 需求复核各自独立核过），于是这一分句处在「本卡证不了、下游也没人接」的状态，P5 阶段闸走到 P5-M6 时会在**没有任何一张卡真正证过它**的情况下记为通过。**两处修订**：①§4.1 P5-M6 承接卡列由 `DHR_28` 改为 `DHR_28 / DHR_29`；②DHR_29 验收口径**增一条机器证**「RPC 握手期对 `capability_hash` 做比对并在不符时 fail-closed（`E_CAPABILITY_MISMATCH`），不得按能力交集降级工作」，附等价判据。**不改变**任何任务的拆分、依赖、档位与其余验收口径。**为什么不只做风险接受**：只做风险接受能让 DHR_28 过闸，但敞口会飘着；改计划是把它**钉到真正有手段验它的那张卡上**。事件本体见 DHR_28 findings **F-064**（`遗留→DHR_29（已确认）`）；审核与确认记录见 [evidence/09 §25~§26](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b14)。
- **B-15 开工前 B-调整 · DHR_29 拆卡（2026-08-21）**：
  - **触发**：本计划三处已预留——§1「下一步」行、§1 概述末条「批次」bullet（「预计拆成不少于两张实际施工卡，至少分离「Store/回放」与「宿主/lease/恢复」」）、§3.2 DHR_29 档位行（「开工 B-调整时拆卡」）。用户 2026-08-21 对话「继续 DHR29」触发执行该预留。
  - **调整内容**：DHR_29 由 1 张拆为 **3 张**——`DHR_29`（保 ID 缩范围：Store / 事件账 / 确定性回放 + 契约修订批次 1）、**`DHR_51`**（新建：Detached 宿主 / lease / `run_id` 发号 / 恢复 / 宿主三态读数）、**`DHR_52`**（新建：RPC 服务端 / 握手 `capability_hash` 比对 fail-closed）。依赖链 `DHR_28 → DHR_29 → DHR_51 → DHR_52 → DHR_30 → DHR_31` 单链无环；批次 2 相应改写。**ID 依据**：`DHR_01`~`DHR_50` 全占用（全仓 grep 实测，连续无缺号），下一自由号 51；保 ID 缩范围 + 新号承接沿用 `DHR-B-10`（DHR_26 拆出 DHR_49）与 `DHR-B-11`（DHR_27 拆出 DHR_50）先例。**切法依据**：原卡实施提示「先证明『无客户端也能跑』再接任何客户端」即 `runtime/` 与 `rpc/` 之间的卡边界 + 拆后每条 P5-M 命题（或分句）恰有唯一整条承接卡。⚠️ 草案初版曾称「`relay-core/README.md` 目录表已把三目录并列预留」，**该依据经复核证伪并撤销**——那是**一行三目录共用一个归属格**的目录命名，不是三个现成的验收单元。
  - **同时发生的实质变化（不止「换个承接人」）**：①把 DHR_28 移交的十余条已知缺口**第一次正式落到卡上**（K-1/K-2/K-3、F-009/F-023/F-037/F-042/F-056/F-057/F-064/F-070/F-081，加 `compat-matrix` §6 三条移交与 §4b 四个无对应事件值）——原卡 5 条验收 → 三张卡 16 条；②DHR_29 变更范围扩入 `contracts/` `fixtures/` 与三份基线；③**三张卡一律标高危**（DHR_51/52 直接命中宪章#2「组件接线」；DHR_29 系**主会话判断**——动已冻结契约与三份基线，后果等价于「数据口径」，宪章五类中并无「契约修订」一项，此处是类比不是引用），故后续需**三次**用户对话内开工确认；④`~/.dh-relay/runs.json` 首次进入本计划 §2.2 落点表。
  - **审核记录**：三轮，同一 fresh-context 复核实例（未参与起草、零上下文继承）。**只读形态如实登记 = 会话内 fresh subagent，「侦测型降级、非机器只读」**（`复核只读派发` 口径；codex `--sandbox read-only` 因本机凭据块已不在 PowerShell profile 而未采用）；派出前 git 基线 HEAD `f2a6ed1`、工作树仅含 DHR_49 并行 WIP，回收后比对无差异。轮1 = 17 条（5×P1/7×P2/5×P3）+ 判断 α/β/γ；轮2 定向复审 = `changes-requested` 12 条（5/4/3）；轮3 窄审 = `changes-requested` 9 条（1/4/4）。**合计 38 条全接全改，无一条讨价还价。** 主会话对每条 P1 均先独立复验原文再采纳（不直接采信同侪结论）。全文见 [evidence/09 §27](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b15)。
  - **主会话裁决中的两处自主判断**（超出复核建议，已向用户明示）：①**扩写 P5-M8 命题文字**（+「`run_id` 按 D23 规范化并在仓级锁内发号」）——用户裁决 Q-D 选「做」而其否掉的选项恰是「不做但闸上写明只过了一半」，不扩写则 3a 一过即可记全绿而发号没做在闸面上看不出来。**M8 是本次唯一动了命题文字的一条**，其余七条一字未动。②**DHR_30 退出 P5-M7 承接卡列**——用户 Q-A 选的是补成四张卡，但 DHR_30 只能拿到实施提示、零验收口径，「承接卡列里写了名字 ≠ 有手段验它」正是 F-064 原话；故分句2 整条归 DHR_31，DHR_30 只留实施提示。此为更忠实于用户意图的收紧。
  - **面向用户讲解 + 理解问题（一次一问）**：问「DHR_51 做完，你晚上开一个 Run、关掉所有终端去睡觉，第二天想知道它跑到哪了，你会怎么看？」**用户答「敲个命令，比如 `relay status`」**。**该回答暴露方案缺口**：草案初版把全部命令行推给 DHR_30，而 design/02 B7 里「`relay status` 区分宿主活着/已死/lease 过期三态」本就与 D18 同源、归 DHR_51，属漏承接。**据此调整**：DHR_51 增只读宿主状态读数 + 人判需求境证据项。⚠️ 该补丁经复核再收紧——命令名 `relay status` 在 §2.1/§2.3 两处均判给 DHR_30，故 DHR_51 的交付物**不叫 `relay status`、不注册 `bin`**（形态 `node relay-core/runtime/status.mjs`），且只承接 B7 三态那一半，**双根发现仍归 DHR_30**。**已向用户明说期望与实际的差**：DHR_51 做完能敲一条命令看进度，但那条命令要到 DHR_30 才叫 `relay status`。
  - **用户回答（四项裁决，2026-08-21 对话内 AskUserQuestion 点选，全选推荐项）**：**Q-A** P5-M7 第二分句 →「现在就补上」；**Q-B** 拆几张 →「3 张」；**Q-C** 契约打开几次 →「现在开一次小批」；**Q-D** `run_id` 发号 →「做，放进 DHR_51」。讲解与问答记录见 [evidence/09 §28](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#understanding-b15)。
  - **一条存量缺口如实登记（非本次引入）**：design/02 **B1 的「双根 discovery」分句**在本计划内**无任何任务卡承接**（全文仅 §1 承接设计清单与 §2.2 禁改边界各提一次；原 DHR_29 卡面同样零命中）。承接人**待 DHR_30 开工 B-调整时定**，在此之前 B1 与相关 P5-M 均不得按整条记过。见 §5 覆盖行。
  - **用户确认**：已确认——2026-08-21 用户点选「落盘并提交」。`DHR-B-15` 事件闭合。**DHR_29 / DHR_51 / DHR_52 三张卡均未授权开工**，每张开工前仍按入口闸单独分流并各需一次用户对话内确认（三张均为标准档·高危）。

- **B-13 开工前 B-调整（2026-08-20，P4 证据回流）**：P4 阶段闸解锁（DHR_27 verify `252a131` + 用户放行）后，按 §0.2 既有约定把 P4 实测证据回流进本计划：①DHR_28 增加「v1 协议缺口逐条处置表」验收（缺口清单 = P4 主报告 §4 六条实测缺口）；②DHR_30 的 Read Model 冻结起点钉为 P4 冻结的两份 pilot schema + 「分堆与排序由源头给」架构约束（两条镜像断言纳入 P5-M4 证据），并承接关闭 P4 §0.2 列表投影白名单例外；③§2.3 增补 Read Model 字段级起点条款；④DHR_30 Bridge 条件部分登记 DHR_26 侦察落档为施工依据。任务拆分、依赖、档位均未变。**缺口清单所有权改挂说明**：P4 主报告 §4 原标注「P5 DHR_30 协议设计输入」的 v1 缺口清单，自本事件起二分——**逐条处置表 → DHR_28**（契约冻结时裁决）；**正式 Read Model 冻结 + 关闭白名单例外 → DHR_30**；P4 报告原文按留痕原则不回改，差异由 DHR_50 附录按诚实差额机制核对。审核与确认记录见 [evidence/09 §23~§24](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b13)。

## 1. 概述

- **交付什么 / 不含什么**：
  - 交付：①Runtime 实现语言与独立进程形态 ADR；②平台无关核心 JSON 协议与 `relay.rpc/v1`；③Detached Relay Runtime、唯一写者 Store、事件账、快照与恢复；④Windows Named Pipe / Linux Unix Domain Socket 本地协议边界（首轮可先完成当前主平台传输，另一平台以合同 + fixture 固定，P9 定型）；⑤一等公民 Relay CLI 参考客户端；⑥可选 DSH Bridge Adapter（P4 判否时不要求完整 Client UI）；⑦Pi / 其他终端客户端接入所需 JSON/RPC 合同；⑧`relay/basic-agent-task@1` 的 Process 垂直闭环；⑨【P5-X 条件项，非必达——用户 2026-08-18 拍板】一个 Agent Executor 候选闭环（Pi / DSH Native，不得让 Runtime 依赖相应工作台进程）；⑩CLI 与任一已接入客户端读取同一 Run。
  - 不含：DevHarness S0~E13、Herdr 多账号正式施工、多卡调度、重编排 / 诊断 Agent、周报 Outbox、E11/E12/E13、完整 Linux 生产定型、公网远程服务、多主机分布式调度。
- **最早可用结果**：不开 DSH → 启动 Relay Runtime → 用 relay CLI 创建和观察 basic-agent-task → 关闭 SSH/终端 → Runtime 保持或确定性恢复 → 重连后继续处理。
- **承接设计**（拆计划输入 = `design/README.md` 白名单）：
  - [design/06 多控制面、Headless 与 SSH 运行](../design/06-多控制面与Headless-SSH运行-设计补充.md) · 「验收命题」节 **H1 / H2 / H3 / H4 / H5**（P5 以 basic-agent-task 级证明）+ §3 硬约束 + §10「P5」。
  - [design/05 DSH 插件化与专属工作台](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md) · §4 三类真相、§6 Relay Runtime 与 IPC（6.1 生命周期 / 6.2 生产协议 / 6.3 核心语言）、§10.2 运行现场。
  - [design/02 完整流水 · 产品设计与验收](../design/02-完整流水-产品设计与验收.md) · **B1**（relay/v2 契约与 v1 只读兼容、双根 discovery）、**B7**（控制台与接续、宿主存活语义 D18、run_id 规范化 D23、`.gitignore` 前置）、**B6**（宿主健壮性）——作为行为 / 契约 Oracle 承接，旧 PowerShell 文件切分不迁移。
- **前置条件**（B-11 修订）：P4-CM1/2/3/5/6a 全部通过（CM4 可为「延后（DHR_50）」）；P4 主报告（CM 部分）已落盘；P4 证据已回流并完成本计划开工前 B-调整；本计划经 fresh 审核；用户对话明确放行 P5。**DSH 三态收敛不再是本阶段解锁前置**：DSH 轨（DHR_26→DHR_49→DHR_50）与本阶段并行，汇合点 = DHR_30 的 DSH Bridge 条件部分与 DHR_31 的 DSH 附加客户端项——该两处开工 / 执行前必须已有 DHR_50 三态结论，未有则记「未执行，待 DHR_50」，CLI 主线不受影响。DHR_50 收敛前本阶段默认控制面为 Relay CLI（阶段默认，不是回退）；DSH 判否时 DSH Bridge 只保留合同接口或转可选。
- **实施策略一句话**：新建独立 Runtime 旁路（不在旧 PowerShell Host 上改），先冻结协议再建 Store/恢复，再做 CLI，最后用 basic-agent-task 闭环——用「无 DSH、无 DevHarness」的最小工作流证明内核与所有工作台、领域规则解耦。
- **任务前缀 / 模块 slug**：`DHR_` / `dh-relay`。
- **批次**（`DHR-B-15` 修订）：批次 1=`DHR_28`（ADR + 协议 fixture，已完成）；批次 2=`DHR_29 → DHR_51 → DHR_52 → DHR_30`（Store/回放 → 宿主/lease/发号/恢复 → RPC/握手 → CLI）；批次 3=`DHR_31`（第一个端到端 demo：DSH 关闭下 Process 闭环 + 可选 Agent 节点）。**原「开工 B-调整时预计拆 ≥2 张」的预告已兑现**——2026-08-21 `DHR-B-15` 拆为 3 张（Store/回放、宿主/lease/恢复、RPC/握手），事件本体见 §0.2。

## 2. 工程切分

### 2.1 实现单元

| 单元 | 职责 | 入口 / 主要文件 | 关联任务 |
|---|---|---|---|
| ADR + contracts | 语言 / 进程形态 ADR；`relay.rpc/v1`、`relay.run/v2`、`relay.event/v2`、`relay.run-state/v1`、`relay.launch-receipt/v2`、`relay.checkpoint/v2`、`relay.result/v2` schema、reason code、兼容矩阵、golden fixture；`resolved-plan/host-observation/attention/approval` v0 形状 | 新 Runtime 仓 / 目录（DHR_28 ADR 定）下 `contracts/`；独立校验器 | DHR_28 |
| runtime-core | Detached 宿主、PID/lease、唯一写者 Store、追加事件、原子快照、确定性回放、checkpoint/result/迟到结果 | Runtime 源码 `runtime/`、`store/` | `store/` = **DHR_29**；`runtime/` + lease + `run_id` 发号 + 恢复 = **DHR_51**（`DHR-B-15`） |
| rpc-transport | Named Pipe（Windows）/ Unix Domain Socket（Linux）+ NDJSON JSON-RPC 2.0；握手 `protocol_version / runtime_version / capability_hash / client_id / request_id` | `rpc/` | 服务端 = **DHR_52**；客户端侧 = DHR_30（`DHR-B-15`） |
| relay-cli | 参考客户端：`list / status / inspect / events --follow / start / stop / resume`（`[--json]`）；客户端中立 Read Model 渲染 | `cli/` | DHR_30　⚠️ `DHR-B-15` 加注：**`status` 的只读最小面（宿主活着/已死/lease 过期三态读数）归 DHR_51**，落 `runtime/`、**不注册 `bin`、不占用 `relay` 命令名**；完整命令集、`[--json]`、文本与 JSON 同源渲染、`cli/` 落点与正式 Read Model 字段级定义**仍归 DHR_30** |
| client-adapters | 可选 DSH Host Bridge（查询 / 订阅 / 重连 / 窄控制）；Pi / 其他客户端 JSON fixture 与 RPC 示例 | `adapters/dsh-bridge/`、`fixtures/clients/` | DHR_30 |
| basic-agent-task | `relay/basic-agent-task@1` Workflow：Process 闭环 + 可选 Agent 节点 | `workflows/basic-agent-task/`、e2e 证据 | DHR_31 |

### 2.2 复用与禁改边界

| 路径 | 禁改 / 扩展 / 新建 | 说明 |
|---|---|---|
| 新 Runtime 代码根（DHR_28 ADR 决定语言与落点） | 新建 | Go sidecar 或独立 TypeScript Runtime；「把 Core 嵌入 DSH Web 进程」当前拒绝，需回 A |
| `<repo>/.dh-relay/<run_id>/` | 新建（运行现场，不入仓） | P5 起固定为 Run Store 根；仓根须显式忽略 `/.dh-relay/`；Relay 不得自行改业务仓 `.gitignore`，缺前置时 start fail-closed |
| `~/.dh-relay/`（用户级跨仓 run 索引 `runs.json`） | 新建（**仓外，不入任何仓**） | `DHR-B-15` 补登记：D23 的 `R<nnn>` 发号须在仓级锁内由该仓分段最大值 +1 发出，`(repo 路径, run_id)` 复合键唯一；由 **DHR_51** 首次写入。锁**必须有超时与陈旧锁回收**——跨仓单文件意味着 A 仓的死锁会挡住 B 仓建 run |
| `.dh-runtime/relay/`（v1 现场） | 只读 | 只读发现与投影，不 resume、零新写 |
| `tools/`（P1 PowerShell Runner）与 `tools/tests/` | 只读复用为 Oracle | 行为、契约与测试命题作为 Oracle；文件级实施切分不迁移；DHR_04 隔离与策略守卫成果继续作迁移 Oracle |
| DSH / Cordis / Pi / Herdr / DevHarness 私有类型 | 禁入协议 | 协议必须平台、客户端、业务域无关 |
| DeepSeek Harness 上游源码 | 禁改 | Bridge 只走树外 |

### 2.3 阶段专属约束

- **P5 冻结的最小协议集**：`relay.rpc/v1`、`relay.run/v2`、`relay.event/v2`、`relay.run-state/v1`、`relay.launch-receipt/v2`、`relay.checkpoint/v2`、`relay.result/v2`；`relay.resolved-plan/v1`、`relay.host-observation/v1`、`relay.attention/v1`、`relay.approval/v1` 只定 v0 形状与 fixture，首次承重时（P6/P7）再冻结。
- **RPC**：Windows Named Pipe / Linux Unix Domain Socket，newline-delimited JSON-RPC 2.0；握手字段见 2.1。
- **最小 Runtime 接口**：`contracts() / listRuns() / inspectRun(runId) / validate(request) / start(request) / control(request) / subscribe(filter)`。
- **客户端中立 Read Model**：`RunSummary / RunDetail / NodeSummary / EventEnvelope / AttentionSummary`，由 Runtime 生成，DSH / Pi / CLI 只渲染、不各自从 events 推导状态。**（B-13）字段级起点** = P4 冻结的 `relay.pilot-read-model/v1`（详情）与 `relay.pilot-run-list/v1`（列表，含必填 `group`、源头给的 `progress / elapsed_seconds` 等），经 DHR_25 人判签收并被 DHR_27 真实历史数据验证；P5 正式化时按 DHR_28 的 v1 缺口处置表修订，字段增删须留处置记录、不静默漂移。
- **参考 CLI 最小命令**（**归 DHR_30**；`DHR-B-15` 加注：DHR_51 交付的宿主三态读数**不叫 `relay status`、不注册 `bin`**，形态为 `node relay-core/runtime/status.mjs <run_id>` 或等价库函数）：`relay list [--json]`、`relay status <run_id> [--json]`、`relay inspect <run_id> [--json]`、`relay events <run_id> --follow [--json]`、`relay start --request <file>`、`relay stop <run_id>`、`relay resume <run_id>`；Attention / Approval / Plan Revision 命令 P7/P8 首次使用时补齐，但 RPC 与命令装配方式须预留。
- **Agent 宿主 ADR 必答**：process executor 由 Runtime 直接持有；pi-agent 由 Runtime 直接持有 SDK/RPC 或经冻结 Adapter；DSH Native Agent 由 Bridge 代持时 DSH 消失如何标记 Attempt；Herdr Agent 由 Herdr server 持有时 Runtime 如何恢复观察。
- **语言选择原则**：独立 CLI、跨外壳、单二进制、DSH 隔离价值更高 → Go；TypeScript 复用 Agent SDK 收益高且仍独立进程 + CLI → TypeScript。

## 3. 任务表

### 3.1 索引

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位（轻/标准） | 状态 | 依赖 | 工作区 | 验收时间 / verify SHA | 备注 |
|---|---|---|---|---|---|---|---|
| DHR_28 | 根据 P4 证据确定 Runtime 语言、Agent 宿主归属与客户端中立协议（ADR + golden fixture） | 标准 | 已完成 | P4 阶段闸（P4-CM1/2/3/5/6a 通过 + 主报告落盘 + 用户放行，B-11 口径） | [workspace/DHR_28/](../workspace/DHR_28/) | | **verify `0e2dd54`**（2026-08-21，用户对话内 AskUserQuestion 放行、chat-confirm 代签）。交付 = 本仓顶层代码根 `relay-core/`：7 份冻结协议 + 1 份共享定义模块 + 4 份 v0 形状、23 个 reason code、44 行兼容矩阵、v1 六条缺口逐条处置表、11 golden + 22 negative fixture、独立校验器 + 11 维度静态审计 + 三份互不覆盖的基线；ADR-001（TypeScript / 本仓新顶层目录，用户 2026-08-20 点选）+ ADR-002（Agent 宿主必答四问）；as-built 首份建。　**验收口径**：2/3/4/5 达成；**1 判「否」**——未知字段与未知版本已证（7 份协议判别字段全为 `const`，7/7 实测），**「能力不匹配」契约层不可能证**（schema 拿不到对端指纹），本卡兑现的是「指纹可复算」那一半（`capability-baseline.json`，8 份契约 digest + 参考 `capability_hash = 3ccf3b10…`，改任一 schema 的任意一个字即 `exit 1`）；**指纹比对已移交 DHR_29**——见 findings **F-064**（`遗留→DHR_29（已确认）`）与本计划 §4.1 P5-M6 承接卡、DHR_29 新增的那条机器证。　**过程**：六路复核（cp1/cp2/cp3 批次小审 + E2 代码轮2 + E4 需求 + E5 教训 + E14 一致性）共 60 余条发现全接全改；findings 85 条、**P0 全程为 0**、收敛后 open 的 P0/P1 归零；教训 20 条，miner 另抽 4 条候选。 |
| DHR_29 | 实现唯一写者 Store、追加事件账与确定性回放；顺带做契约修订批次 1 | 标准 · **高危** | 已完成 | DHR_28 | [workspace/DHR_29/](../workspace/DHR_29/) | | `DHR-B-15` 保 ID 缩范围（原含宿主与 RPC，已拆出 DHR_51 / DHR_52）。2026-08-22 完成：Store 纯库（追加事件账/确定性回放/openStore 恢复/身份链/终态守卫/串行写队列，测试 23/23）+ 契约修订批次 1 与漂移收敛指纹批（capability_hash=`970b5460…`，基线同批重生成）；两轮换人复核 + 需求/教训/一致性四路全落账（CP1 fail→修复→CP2 approved→轮 2 approved；需求漂移四处收敛 F-009）。verify 提交见 `git log --grep="^verify"`（SHA 由收口回填提交写入） |
| DHR_51 | 实现 Detached 宿主、PID/lease、`run_id` 规范化与仓级锁内发号、恢复与宿主三态读数 | 标准 · **高危** | 未开始 | DHR_29 | <开工时回填 workspace/…> | | `DHR-B-15` 新建。高危 = 组件接线 + 持久状态。**第一个「关窗不停工」可观察的节点**；交付的三态读数**不叫 `relay status`、不注册 `bin`**（命令名归 DHR_30） |
| DHR_52 | 实现 RPC 服务端与握手 fail-closed（含 `capability_hash` 比对） | 标准 · **高危** | 未开始 | DHR_51 | <开工时回填 workspace/…> | | `DHR-B-15` 新建。高危 = 组件接线。**开工前 DHR_29 的契约修订批次 1 必须已收口**，否则基线断言会在施工中途被改动 |
| DHR_30 | 实现 Relay CLI 参考客户端与可选 DSH/Pi Bridge 接缝 | 标准 | 未开始 | DHR_52 | <开工时回填 workspace/…> | | 阶段闸阻塞；DSH Bridge 条件部分以 P4 DHR_50 结论为开工判据（B-11 汇合点）：无结论→记「未执行，待 DHR_50」，判否→只留合同接口；CLI 部分不受影响 |
| DHR_31 | 以 DSH 关闭状态跑通 basic-agent-task 垂直闭环 | 标准 | 未开始 | DHR_30 | <开工时回填 workspace/…> | | 阶段闸阻塞；第一个端到端 demo；DSH 附加客户端项按 DHR_50 结论执行（B-11） |

> 状态列只填五枚举；阶段闸阻塞写在「备注」列。P4-CM 未通过时 DHR_28~31 与 `DHR-B-15` 新建的 DHR_51 / DHR_52 均不得进入 D 开工。

### 3.2 任务卡

#### DHR_28

- **目标**：依据 P4 控制面证据做出 Runtime 语言 / 独立进程形态 ADR 与 Agent 宿主归属 ADR，冻结 P5 最小协议集、reason code、兼容矩阵与 golden fixture，并交付独立校验器，让后续 Runtime、CLI 与任何客户端有唯一契约来源。
- **非目标**：不实现 Runtime；不写 DSH UI；不冻结 P7/P8 才承重的 resolved-plan / attention / approval 正式版本（只定 v0 形状）。
- **验收口径**：
  - **机器证**：[design/02 B1](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)（契约正反例、双解析器思路）· 本计划 P5-M6：协议正反 fixture 可由独立校验器验证；未知字段、未知版本、能力不匹配 fail-closed。
  - **机器证**：[design/05 §6.2 生产协议](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#62-生产协议)：协议不导入 DSH / Cordis / Pi / Herdr / DevHarness 私有类型；DSH 与 Runtime 不共享活动对象或内存状态（fixture 与 schema 静态可证）。
  - **机器证**：[design/06 H6](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)（契约级）：任一必经角色不能只声明 `dsh-agent`（schema 层拒绝）。
  - **机器证**：ADR 落盘且回答 §2.3「Agent 宿主 ADR 必答」四问；语言选择依据引用 P4 报告证据。
  - **机器证 · v1 缺口处置（B-13 新增）**：契约文档含对 [P4 主报告 §4「v1 协议缺口清单」](../design/evidence/10-P4-多控制面Pilot报告.md)六条实测缺口的**逐条处置表**（每条：采纳进 v2 字段 / 显式不采纳 + 理由；含可 grep 锚点 `v1-gap-disposition:`）——缺口含：run 现场不记录 `workflow_name / summary / trigger / trigger_by`（P4 实证导致投影须操作员补供）、无 run 级状态、无节点 title、run 级 attempt「缺省≠1」语义、locator 必须相对/符号化、会话观测态与任务结果须分字段。处置方向由本卡 ADR 定，不预设结论。
- **变更范围**：新 Runtime 仓 / 目录的 `contracts/`、校验器、ADR 文档；本卡 `workspace/DHR_28/`。
- **档位**：标准（协议与架构决策是后续全部阶段的地基）。
- **实施提示**：复用 P1 `tools/contracts/` 与 DHR_04 守卫作为 Oracle；「把 Core 嵌入 DSH Web 进程」不是可选项；不因 DSH 增强轨结论改变协议中立性。**（B-13）**Read Model 语义起点 = P4 冻结的 `relay.pilot-read-model/v1` + `relay.pilot-run-list/v1`（DHR_25 人判 H1 签收 + DHR_27 真实数据验证），尤其**架构约束**（分堆与排序由源头给、客户端不推导）与**源头计量约束**（progress/elapsed 由源头算，客户端不读时钟）两条——与 DHR_30 的「两条镜像断言」（该架构约束的测试形态）分名指称，避免混淆；语言 ADR 的 P4 侧证据含：Node 全链 pilot（schema/render/CLI + 约 250 行纯函数投影器）跨 Node v24(Win)/v18(Linux) 输出逐字节一致、dsh-host 零 bare import 的装载拓扑教训（workspace/DHR_26）。

#### DHR_29

> `DHR-B-15`（2026-08-21）保 ID 缩范围：原卡含宿主/lease/恢复与 RPC，已分别拆出 **DHR_51** 与 **DHR_52**。

- **目标**：以**库形态**（无进程、无 RPC）实现单 Run 的 Store：不可变工件 + 单调追加事件账 + 原子快照 + 确定性回放；checkpoint / result 幂等、冲突终态拒绝、迟到结果按 Receipt 身份链接受或隔离；产出可复算的 `state_signature`。附带完成 DHR_28 移交的**契约修订批次 1**。
- **非目标**：不做 detached 宿主与 lease（DHR_51）；不做 RPC 服务端（DHR_52）；不做 CLI（DHR_30）；不跑 basic-agent-task 全闭环（DHR_31）；不做多卡；不实现 Herdr。
- **验收口径**：
  - **机器证**：[design/02 B6 / B11](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)：重复 checkpoint / result 幂等，冲突终态拒绝；迟到结果按 Receipt 身份链**接受或隔离**（`late_result_quarantined`）。附 `compat-matrix.md` §6 移交第 2 条——须用 **P1 迟到结果 fixture** 复验 v2 判定**不弱于 v1**。
  - **机器证 · 加固断言**（**不单独计 P5-M3**——M3 是单句命题、整条归 DHR_51；本条是支撑它的更强断言）：同一事件账独立回放 N 次得逐字节相同 `state_signature`；「快照 + 增量回放」与「从零全量回放」结果逐字节相同。
  - **机器证 · 承接 DHR_28 移交的四条实现期约束**（schema 表达不了，每条各一反例）：`node_states` 覆盖对应 `relay.run/v2` `nodes` 的**全集**（F-037）；`progress.done <= total`（F-070）；`labels` 按 `key` UTF-16 码元升序且 `key` 在同一 Run 内唯一（F-081）；`structured` 落盘复用 v1 `relay-redaction.ps1` 口径**脱敏**（`compat-matrix.md` §6 移交第 3 条 + `OPEN-POINTS.md`「O-1 的已知代价」，**AGENTS 宪章#6 红线**）。
  - **机器证 · 承接 `OPEN-POINTS.md` K-2**：`stale` / `rejected` 的判定改挂 `relay.event/v2` 的单调 `seq`，**不依赖** `attempt_id` 的整数序（v2 已改为不透明串）。反例：两份 `attempt_id` 字典序与 `seq` 序相反的迟到结果，判定须按 `seq`。
  - **机器证 · 契约修订批次 1**（用户 2026-08-21 裁决：现在开一次小批，放本卡）。**一次成批发**，改完**同批重生成三份基线**（`fixture-manifest` / `capability-baseline` / `audit --write-tokens`），`npm test` 全绿。
    ⚠️ **口径**：本批是**本阶段第一次**，**不是「P5 内唯一一次」**——已知后续还有两处可能的契约触碰：DHR_52 若判补 `E_PROTOCOL_MISMATCH`；DHR_30 冻结正式 Read Model 时收窄 `OPEN-POINTS` O-3（改 `relay.rpc.v1.schema.json`，在指纹 8 份内）。各自触发时同批重生成基线。**如实登记，不加码。**
    内容六项：
    1. **K-3 身份 token 去重**，判据为**结构判据**（不是计数、不是字符串扫描——把判据挂在「正则怎么写」上正是 F-056 记过的事故形态）：「`contracts/`（含 `v0-shapes/`）下，除 `_shared/relay.common.v1.schema.json` 的**唯一一处** `$defs/identifier` 外，任何身份类属性（`*_id`）节点**不得自带 `pattern` 关键字**，一律 `$ref` 到 `identifier`」。`pattern` 关键字的有无是结构事实，`audit-contracts.mjs` 的节点级遍历现成可判。现状实测 13 处 = `_shared` 规范定义 3（收敛后应只剩 1）+ 已冻结协议内联 7 + `v0-shapes/` 3；**`v0-shapes/` 不计入指纹**（`tools/capability-baseline.mjs` 逐字：「v0 形状不计入」），故本批的能力影响面比「13 处」暗示的小。
    2. **四个无对应事件值逐条裁决**（`compat-matrix.md` §4b 的 `launch_receipt` / `launch_failed` / `checkpoint_rejected` / `control`，结账句逐字写「4 个无对应值全部登记为待 DHR_29 判定的缺口，不用『数字对得上』掩盖」）：**只要求逐条给出裁决并落账**（补值 / 显式不补 + 理由），不要求四条都补值。
    3. **F-042**：ajv `validateSchema` 与手写 `KEYWORD_TYPES` 合一，别让两套 meta-schema 规则各自演化。
    4. **F-056 的残留形态**（findings 明写「随 F-042 一并交 DHR_29」）：内联的 locator 类 pattern 会让 reason 判据退化，纳入 schema 演进纪律。
    5. **卡号指名更正**，分两类执行：**动指纹**的三份（`relay.event.v2` / `relay.run-state.v1` / `relay.run.v2` 的 `description` 与 `$comment` 内含 `DHR_29` 字样）**只能走本批并同批重生成基线**；`contracts/*.md`、`adr/`、`tools/`、`test/`、`fixtures/`、`README.md` **不动指纹**、可随时改。依据：`CANONICALIZATION.md`「任何一次编辑，包括改一个错别字，都是能力变更、都会断握手」。
    6. **`v1-gap-disposition.md` 的 `done <= total` 归属更正**：该行写「交你（DHR_30）实现期守」，与 `relay.run-state.v1.schema.json`（归 DHR_29）矛盾，改准为 DHR_29。
  - **方向决策账 · 承接 `OPEN-POINTS.md` K-1**：`waiting_human` 在已冻结七份契约里**没有产生者**，而 P5-M3 要求状态可从事件账重建。本卡须给出显式结论并落账，二选一：①定一个事件产生者（走批次 1）；②登记「本阶段该状态不可从事件重建」并移交 P7 冻结 attention 时收口。**不允许沉默带过。**
- **变更范围**：`relay-core/store/`、`relay-core/test/`、`relay-core/contracts/`（仅批次 1 涉及）、`relay-core/fixtures/`、三份基线文件；本卡 `workspace/DHR_29/`。
- **档位**：标准 · **高危**（主会话判断：动已冻结契约与三份基线，后果等价于宪章#2 五类里的「数据口径」；宪章五类中并无「契约修订」一项，此处是**类比**不是引用）。
- **实施提示**：复用 P1 `tools/` 的迟到结果 / CAS fixture 作 Oracle（**只读，不迁移文件**）；契约修订**一次批量发**、不在收敛轮零散动（`CANONICALIZATION.md` 纪律）；Store 层不认识「客户端」这个概念；**进场先 `git rev-parse master origin/master` 对基点**（F-010 实测 `dh wt new` 会从落后的 `origin/master` 切树）。

#### DHR_51

> `DHR-B-15`（2026-08-21）新建，由原 DHR_29 拆出「宿主 / lease / 恢复」半程，并按用户裁决纳入 D23 发号。

- **目标**：把 DHR_29 的 Store 装进一个**脱离任何终端与客户端存活**的后台宿主：PID/lease 文件、同一 Run 唯一活宿主、第二个宿主被拒、lease 过期可接管、强杀后走恢复路径重建；`run_id` 按 D23 规范化并在仓级锁内发号；Store 根规范化到 `<repo>/.dh-relay/<run_id>/`，`.gitignore` 前置不满足时 start fail-closed。交付**只读的宿主状态读数**作为上述事实的观察手段。
- **非目标**：不开 RPC 端口、不接任何网络 / 管道客户端（DHR_52）；不做多卡调度；**不做任何 CLI**——三条硬边界：
  1. **不注册 `bin`、不占用 `relay` 命令名**。交付形态 = `node relay-core/runtime/status.mjs <run_id>` 或等价库函数，**不叫 `relay status`**（§2.1 与 §2.3 都把该命令连同整个命令集判给 DHR_30 / `cli/`，本卡不得先到先得）。
  2. [design/02 B7](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) 的 `relay status` 是**复合验收**，本卡只承接「宿主活着 / 已死 / lease 过期」三态那一半；其**双根发现**部分（同时列新根 `.dh-relay/` 的 v2 run 与 legacy 根 `.dh-runtime/relay/` 的 v1 存量 run、后者标只读且拒 resume）**不在本卡**，仍归 DHR_30。**收口时 B7 不得按整条记过。**
  3. `list` / `inspect` / `events --follow` / `start` / `stop` / `resume`、文本与 JSON 同源渲染、正式 Read Model 字段级定义，一律归 DHR_30。
- **验收口径**：
  - **机器证**：[design/06 H1](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · **P5-M1**：DSH 未安装 / 完全停止、SSH 断开、启动它的终端全关之后，宿主仍在推进（可观察：事件账 `seq` 继续增长）或可恢复。〔H4 的「客户端断开不 cancel」分句归 DHR_52——本卡阶段还没有客户端可断〕
  - **机器证**：[design/02 B7 宿主存活语义 D18](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) · **P5-M3（整条）**：强杀宿主后新宿主从 Store 重建出与强杀前**相同的 `state_signature`**，事件与终态确定一致；同一 Run 第二个宿主被 lease 拒绝（`E_LEASE_HELD`）；lease 过期后新宿主可接管；宿主状态读数正确区分「宿主活着 / 已死 / lease 过期」三态——**呈现形态与来源按下方实施提示 3 办**。
  - **机器证**：[design/02 B7 D23 / `.gitignore` 前置](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) · **P5-M8**，两半都要：
    - **a · 落点与忽略**：Store 根落 `<repo>/.dh-relay/<run_id>/`；`.gitignore` 锚定缺失时 start fail-closed 且 Relay **不改**业务仓 `.gitignore`；零误跟踪（`git ls-files` + 「误暂存」反例双证）。
    - **b · `run_id` 规范化与发号**：格式 `R<nnn>-<主题slug>-<yyyyMMdd>`；`R<nnn>` 在**仓级锁内**由 `runs.json` 该仓分段最大值 +1 发出（**并发两个 start 各得不同序号、无跳号无重号**）；`(repo 路径, run_id)` 复合键唯一；slug 字符集 ASCII 小写字母数字短横线、≤30、首尾非短横线，**中文 / 大写 / 空格 / 超长 / 首尾短横线各一反例**，规范化失败即 `start_rejected`，**不得静默截断或转写**。
  - **机器证 · 承接 DHR_28 F-009**（`open`）：`.gitignore` 前置检查必须按 **Git 的忽略语义**判定（如调 `git check-ignore`），**不得字面量匹配**单一模式 `/.dh-relay/`。反例：本仓现状用的是任意深度 `.dh-relay/`，字面量实现会假阴性拒启动。
  - **机器证 · 承接 `compat-matrix.md` §6 移交第 1 条**（同文件称这是「v1→v2 语义变化最大的一处」）：`authority_generation` → lease 的**语义等价性复核**——须用 **P1 恢复锁 / CAS 用例**复验 v2 的唯一写者保证**不弱于 v1** 的权威代次机制。
  - **人判 · 需求境证据**（宪章#3）：真实开一个 Run → 关掉全部终端（或断 SSH）→ 隔一段时间回来 → 跑宿主状态读数，看到宿主与账都还在。实录留 `progress.md`，E-ID 可回链。
- **变更范围**：`relay-core/runtime/`（含只读状态读数入口，**不建 `cli/`**）、`relay-core/test/`、**用户级 `~/.dh-relay/runs.json`**（仓外，见 §2.2）；本卡 `workspace/DHR_51/`。**`relay-core/package.json` 不在范围内**——「注册 `bin`」这个动作本身即越界。
- **档位**：标准 · **高危**（组件接线 + 持久状态）。
- **实施提示**：
  1. lease 与恢复**走同一事件账，不另立状态**。
  2. **run / node 状态**：只渲染 Store 产出的 `relay.run-state/v1` 文档，**不得自行从 events 推导**（§2.3 架构约束：「由 Runtime 生成，DSH / Pi / CLI 只渲染、不各自从 events 推导状态」）。
  3. **宿主三态另论，且必须走这条路**：`relay.run-state/v1` 顶层属性实测 = `protocol / run_id / run_status / group / progress / elapsed_seconds / node_states / updated_at / state_signature`，**没有任何宿主或 lease 字段**；宿主侧信息在已冻结协议里只以**事件**存在（`relay.event/v2` 的 `lease_acquired` / `lease_expired`）。最接近的 `relay.host-observation/v1` 是 **v0 未冻结形状**，且带 `node_id` / `attempt_id` / `executor_kind` / `host_ref`——那是 **Executor 观测**、不是 Runtime 宿主存活，形状本身就不对。⇒ 三态**来源** = PID/lease 文件 + `lease_*` 事件；**呈现形态** = **只以库返回值与测试断言呈现**，**不定义新协议对象、不提前冻结或扩写 `relay.host-observation/v1`**（其冻结仍归 P6/P7，见 §2.3）。另两条路都要付计划外代价：自造宿主状态对象等于绕过「`relay-core/` 是唯一契约来源」；提前冻结 v0 形状是一次**计划外的契约触碰**，会打穿 DHR_29 批次 1 立的那本账、也会动 DHR_52 要对齐的基线。
  4. **b 的并发用例是真并发**（起两个进程同时 start），不是单测形态——这份成本先算进来。
  5. **`runs.json` 的锁必须有超时与陈旧锁回收**：跨仓单文件按仓分段，A 仓一把卡死的锁会挡住 B 仓建 run。D23 原文说发号「搭在建 run 时**已有的**仓级锁上」，但 v2 Runtime 里那把锁还不存在（那是 v1 PowerShell 侧的），本卡要新造。
  6. 进场先对 `master` / `origin/master` 基点（F-010）。

#### DHR_52

> `DHR-B-15`（2026-08-21）新建，由原 DHR_29 拆出 RPC 服务端半程，并承接 DHR_28 的 F-064。

- **目标**：在宿主上开客户端中立的 RPC 服务端——Named Pipe（Windows）/ Unix Domain Socket（Linux）+ NDJSON JSON-RPC 2.0；握手校验 `protocol_version / runtime_version / capability_hash / client_id / request_id`，指纹不符即 fail-closed；订阅推送帧为完整自描述协议对象；客户端断开 / 退出不取消 Run。
- **非目标**：不做 CLI 与任何客户端 Adapter（DHR_30）；不做 attention / approve 方法（P7/P8）；不冻结正式 Read Model（DHR_30）；不做 per-method 参数 schema，**不收窄 `OPEN-POINTS` O-2 / O-3 两处开放点**（O-3 归 DHR_30，O-2 归 P6/P7）。
- **验收口径**：
  - **机器证**（承接 DHR_28 **F-064**）· **P5-M6 的「能力」分句**：构造两份 `capability_hash` 不同的握手（例如一端多托管一种 `executor_kind`），断言被拒且 reason 为 `E_CAPABILITY_MISMATCH`，**不得按能力交集降级工作**；并断言参考实现算出的指纹与 `relay-core/capability-baseline.json` **逐字相符**（该基线在 DHR_29 批次 1 后已重生成，本卡对着新基线断言）。
  - **机器证**：[design/06 H4](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · **P5-M7 的第一分句**：客户端断开 / 进程退出 / SSH 断链均**不生成 cancel**，Run 状态与事件账逐字不变；重连后从 Runtime 重建同一状态。
  - **机器证 · 承接 DHR_28 F-023 的语义决定**（`OPEN-POINTS.md` 逐字写「DHR_29 实现 subscribe 时按此办」，本次拆卡后落本卡）：`subscribe` 推送帧的 `params` 必须是**完整自描述的协议对象**（含 `protocol` 常量、过对应协议全部必填），**不能只推增量字段**。反例：`method=event` 塞 run-state 载荷 / 载荷缺 `protocol` / 含未知字段，三者均被拒。同处维护约束：加 notification `method` 枚举值必须**同批**加 `if/then` 分支并复跑 `audit-contracts.mjs`，否则 `params` 静默退回完全开放。
  - **方向决策账 · 承接 DHR_28 F-057**（其处置口径逐字：「待 DHR_29/30 **真正用起来后**再决定是否值一个新码」；本卡是握手第一次真正跑起来的地方）：裁决是否给「发错协议」新增 `E_PROTOCOL_MISMATCH`。若判补，属协议变更、须走 `reason-codes.md` + 反例 + 边界说明三件套并重生成三份基线；若判不补，写明理由并留档。
- **变更范围**：`relay-core/rpc/`、`relay-core/test/`；若 F-057 判补则含 `relay-core/contracts/` 与三份基线；本卡 `workspace/DHR_52/`。
- **档位**：标准 · **高危**（组件接线）。
- **实施提示**：服务端只认契约，不认任何客户端类型；**开工前 DHR_29 的契约修订批次 1 必须已收口**，否则基线断言会在施工中途被改动；进场先对 `master` / `origin/master` 基点（F-010）。

#### DHR_30

- **目标**：实现 Relay CLI 参考客户端（查询 / follow / start / stop / resume，text 与 json 同源渲染），冻结客户端中立 Read Model；条件允许时实现 DSH Host Bridge 的查询、订阅、重连与窄控制，并给出 Pi / 其他客户端可消费的 JSON fixture 与 RPC 示例。
- **非目标**：不实现完整 DSH Client UI（P4 判否时更不实现）；不做 Attention / Approval 命令正式版（P7/P8）；不让任何客户端直接写 Store。
- **验收口径**：
  - **机器证**：[design/06 H2](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P5-M2：DSH 未安装时 CLI 完整可用（list/status/inspect/events/start/stop/resume）。
  - **机器证**：[design/06 H3](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P5-M4：CLI 文本与 JSON 由同一 Read Model 渲染；任一已接入客户端与 CLI 读取同一 Run；DSH/Pi 私有字段不进入 Relay Store。**（B-13 加严）**Read Model 正式冻结以 P4 两份 pilot schema 为字段级起点（按 DHR_28 的 v1 缺口处置表修订），「分堆与排序由源头给」的两条镜像断言（改 `group` 必须移动 / 只改 `run_status` 必须逐字不变）纳入 P5-M4 证据；随本卡把字段级定义补进 design 正文并**关闭 P4 §0.2 列表投影白名单例外**——关闭判据（机检，双端 `rg` 可证）：design 落点文出现字段级定义 + 可 grep 标记 `whitelist-exception-closed: DHR_30`，且 P4 计划 §0.2 例外条机械回注回链该标记。
  - **机器证**：[design/06 H4](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)：任一客户端断开 / 退出不取消 Run，重连后从 Runtime 重建状态（无条件项，用 CLI 或任一非 DSH 客户端证）；其中「DSH 插件卸载只断开客户端」子命题为条件项（B-11 复审回写）——按 P4 DHR_50 结论执行，未收敛记「未执行，待 DHR_50」，判否记 N/A。
  - **机器证**：[design/02 B1](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)（relay/v2 契约矩阵中的控制请求幂等子命题）· P5-M2：重复 control request 以 request id 幂等，Receipt 唯一。
  - **机器证**（P5-X，条件执行；B-11：执行条件 = P4 DHR_50 已收敛且非判否，未收敛记「未执行，待 DHR_50」）：DSH Bridge 重连并重建 UI；Pi 客户端读取同一 Run 的 fixture 示例可解析（Pi 部分不受 DHR_50 约束）。
- **变更范围**：`cli/`、`adapters/dsh-bridge/`（条件）、`fixtures/clients/`；**（B-13）**承接 Read Model 字段级定义的 design 落点——默认 [design/06](../design/06-多控制面与Headless-SSH运行-设计补充.md)（新增字段级定义节；若开工分流时确认另建 design 文档，按 design-治理走）+ `dev_plan/P4-DSH工作台最小Pilot-开发方案.md` §0.2 白名单例外条（仅机械回注关闭标记回链）；本卡 `workspace/DHR_30/`。
- **档位**：标准（客户端接线；DSH Bridge 部分若执行需真实截图作需求境证据）。
- **实施提示**：CLI 是 P5 唯一必备客户端；Bridge 只走 RPC 合同不碰内存对象；命令装配方式为 P7/P8 的 attention/approve 预留。**（`DHR-B-15`）不要以为 design/06 H6 已被 schema 完全兜住**——`OPEN-POINTS.md` 明写 schema 表达不了图的传递闭包，可达性校验归 DHR_31（本卡不进 P5-M7 承接卡列）；另 `relay status` 的**完整形态**（含 design/02 B7 的**双根发现**：同时列新根 v2 run 与 legacy 根 v1 存量 run、后者标只读且拒 resume）归本卡，DHR_51 只交付了宿主三态那一半。**（B-13）**DSH Bridge 条件部分若执行，施工依据 = DHR_26 侦察落档（[workspace/DHR_26/](../workspace/DHR_26/) findings 与 `src/dsh-host/` README：`dsh plugin` profile 装载、`ctx.provide` 公开 API、零 bare import 拓扑约束、rc 迭代风险基线）。

#### DHR_31

- **目标**：以 DSH 全程关闭状态，用 Relay CLI 启动、观察、恢复 `relay/basic-agent-task@1` 的 Process 闭环（prepare → process task → collect structured result → machine verify → succeeded），关闭控制终端后 Runtime 继续或可恢复，重连后读取相同事件 / 状态 / 终态；Process 闭环通过后再尝试一个 Agent 节点（Pi / DSH Native，Executor 消失只中断对应 Attempt）。
- **非目标**：不使用任何 DevHarness 特有字段；不跑 Herdr（P6）；不做多卡；DSH 作为附加客户端连接只验展示一致性，P4 判否时记不适用。
- **验收口径**：
  - **机器证**：[design/06 H1 / H2 / H5](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P5-M5：无 DevHarness、无 DSH 时 Process 闭环完整运行；控制终端关闭后 Runtime 继续；重连后事件 / 状态 / 终态一致。
  - **机器证**：[design/06 H7 / H12](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)（若 Agent 节点执行）：Executor 消失只中断对应 Attempt，重试产生 fresh Attempt。
  - **机器证（`DHR-B-15` 新增，承接 P5-M7 的第二分句）**：[design/06 H6](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · **Workflow 定义期须先做可达性推导（传递闭包）再校验 H6**——「被必经节点**传递**依赖的节点，自身也应视为必经」。**为什么在这里**：`OPEN-POINTS.md` 已白纸黑字写明 JSON Schema **表达不了图的传递闭包**，DHR_28 只能在契约层证「必经角色不能只声明 `dsh-agent`」这个**直接形态**，并明文移交 DHR_30 / DHR_31；而 P5-M7 承接卡列原先只有 DHR_28 / DHR_29，本次拆卡后三张新卡无一能证它——与 F-064 完全同形。用户 2026-08-21 对话裁决「现在就补」。
    **判据 = 四例齐，缺一不算做了可达性推导**（少于四例时，下述错实现能全绿）：

    | # | 形态 | 期望 | 挡住哪种错实现 |
    |---|---|---|---|
    | 1 | 深度 1（`OPEN-POINTS.md` 原样例）：`gate` `required:false` 且只有 `dsh-agent`；`final` `required:true` 且 `depends_on:["gate"]` | **拒** | 完全不做可达性 |
    | 2 | 深度 ≥2 传递链：`gate`(dsh-only, `required:false`) ← `mid`(`required:false`) ← `final`(`required:true`) | **拒** | 只查一层 `depends_on` |
    | 3 | 阴性对照：一个 dsh-only 节点**不被任何 `required` 节点（传递）可达**，且**该图含至少一个 `required:true` 节点** | **放行** | 「见 `dsh-agent` 就拒」；以及「图里没 required 就整体跳过校验」——缺后半句它能三例全绿 |
    | 4 | H6 的**直接形态**：`required:true` 且 `executor_profiles` 只有 `dsh-agent` | **拒** | 让「分句2 整条归本卡」字面为真；顺带在实现层复证 DHR_28 的 schema 断言仍生效 |

    **判定逻辑的代码落点**：落 `runtime/` 的 `validate(request)`（承接 §2.3「最小 Runtime 接口」），本卡以 basic-agent-task 的 Workflow 定义**行使**并作为验收证据——本卡的 `workflows/` 是行使场景、不是实现落点；若施工时发现须由 DHR_51 / DHR_52 先落桩，按 findings 登记、**不静默扩范围**。
  - **机器证**：[design/06 H3](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)（P5-X）：DSH 在 Run 已存在后作为附加客户端连接并看到同一状态；按 P4 DHR_50 结论执行（B-11）——未收敛时登记「未执行，待 DHR_50」，判否时登记不适用。
  - **人判**：[design/05 §6.1 生命周期](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#61-生命周期) · P5-H：向用户展示启动 / 资源 / 恢复耗时、终端断连恢复实录与 CLI 输出；用户判断独立 Runtime + CLI 的成本是否可接受、不开 DSH 时终端控制是否足以处理故障、DSH 若可用组合是否仍像统一工作台（本问按 P4 DHR_50 结论：未收敛时延后、判否时记 N/A，不阻塞其余人判，B-11 复审回写）、选定语言是否继续作默认。
- **变更范围**：`workflows/basic-agent-task/`、e2e 脚本与证据；本卡 `workspace/DHR_31/`。
- **档位**：标准（端到端接线 + 人判）。
- **实施提示**：Process 闭环先于 Agent 闭环，Agent 失败不推翻 Process 结论；不得借 DevHarness 字段「顺手」证明领域接入。

### 3.3 标准档共同收口条件

每张卡进入「待验收」前：两轮独立换人复核；需求境证据（DHR_31 须有真实终端断连 / 重连实录，Bridge 若执行须有截图）；`dh dh-relay` 与本卡证据命令可复跑；P0/P1 清零；只停在待人验，用户对话确认后才 `verify(dh-relay):`。

## 4. P5 阶段闸

### 4.1 核心机器闸 P5-M

| ID | 命题 | 承接卡 |
|---|---|---|
| P5-M1 | Runtime 与 DSH、Pi、终端客户端的生命周期分离 | **DHR_51**（整条） |
| P5-M2 | DSH 完全关闭时，CLI 可启动、查询、停止、恢复 Run | DHR_30 / DHR_31 |
| P5-M3 | 强杀 Runtime 并恢复后，状态、事件和终态确定一致 | **DHR_51**（整条·单句命题，不得劈分计分；DHR_29 的「N 次回放 / 快照+增量 == 全量」是支撑它的**加固断言**，不单独计 M3） |
| P5-M4 | CLI 文本/JSON 与任一已接入客户端读取同一 Read Model（B-13：含源头 `group` 镜像断言；正式字段级定义关闭 P4 列表白名单例外——细则见 DHR_30 卡） | DHR_30 |
| P5-M5 | basic-agent-task 的 Process 闭环在无 DevHarness、无 DSH 时完整运行 | DHR_31 |
| P5-M6 | 协议版本、能力和未知输入均 fail-closed | 分句「版本」+「未知输入」→ **DHR_28**（契约层已证，7/7 实测）；分句「**能力**」→ **DHR_52**（整条，握手期 `capability_hash` 比对，`DHR-B-15`） |
| P5-M7 | 客户端断开不取消 Run，必经角色无 DSH-only 依赖 | 分句1「客户端断开不取消 Run」→ **DHR_52**（整条）；分句2「必经角色无 DSH-only 依赖」（= design/06 H6）→ **DHR_31**（整条，四例可达性判据）。**DHR_28** = 契约层已证的直接形态，**不计入分句2 的闸面判定**（已 verify `0e2dd54` 销户，不可能再补证）。**DHR_30 不进本行**——只在其实施提示留一句「不要以为 H6 已被 schema 完全兜住」（`DHR-B-15`） |
| P5-M8 ★ | Store 位于规范根、**`run_id` 按 D23 规范化并在仓级锁内发号**、`.gitignore` 前置与零误跟踪有证据 | **DHR_51**（整条） |

> ★ **`DHR-B-15` 唯一动了命题文字的一条**：P5-M8 原文为「Store 位于规范根，`.gitignore` 前置与零误跟踪有证据」，**不含 `run_id` 发号**。用户 2026-08-21 裁决把 D23 发号纳入 DHR_51 后，若不扩写命题文字，则「Store 根 + `.gitignore` + 零误跟踪」一过即可记全绿、而发号没做在闸面上看不出来（与 F-064「闸上记通过、其实没人证过」同源，只是形态是"证了一半也算全绿"）。故扩写。**其余七条命题文字一字未动。**
>
> 📍 **M7 分句2 的判定逻辑落点**：落 `runtime/` 的 `validate(request)`（承接 §2.3「最小 Runtime 接口」），**由 DHR_31 以 basic-agent-task 的 Workflow 定义行使并作为其验收证据**——DHR_31 的 `workflows/` 是**行使场景**，不是实现落点；若施工时发现须由 DHR_51 / DHR_52 先落桩，按 findings 登记、**不静默扩范围**。不放 DHR_30 的理由：§2.3 明写客户端只渲染、不推导，把安全断言的判定权交给客户端是反的。

### 4.2 增强验收 P5-X 与人类闸 P5-H

- **P5-X**（按 P4 结论与实际可用性执行，其中 DSH 项以 DHR_50 结论为判据（B-11）；失败不推翻已通过的独立内核，但影响默认工作台与 P6/P7 Executor 选择）：DSH Bridge 重连并重建 UI；Pi 客户端读取同一 Run；Agent Executor basic task。
- **P5-H**（用户判断，见 DHR_31 人判项）：独立 Runtime 与 CLI 的启动 / 资源 / 恢复成本；不开 DSH 时终端控制是否足以处理故障；DSH 与独立 Runtime 组合是否仍像统一工作台（按 DHR_50 结论：未收敛延后、判否 N/A，B-11）；选定语言是否继续作默认。

### 4.3 解锁 P6 的规则

P5-M 全部通过 ∧ P5-H 明确 ∧ 用户对话同意进入 P6。P5-X 中的 DSH 项可以是通过 / 受限 / 不适用，不能成为核心路线的唯一解锁条件。

## 5. 覆盖、颗粒度与依赖查漏

| 检查 | 结论 |
|---|---|
| 覆盖（`DHR-B-15` 重跑） | design/06 **H1** → DHR_51；**H2** 只承接子集（list/status/inspect/events/start/stop/resume，**不含 attention/approve**，其余交 P7）→ DHR_30；**H3** → DHR_30/31；**H4** 拆两半：「无客户端时 Runtime 存活」→ DHR_51、「客户端断开不 cancel」→ DHR_52；**H5** → DHR_31；**H6** 直接形态 → DHR_28（契约层，已 verify），传递闭包形态 → DHR_31（四例判据，`DHR-B-15` 新增）；**H7/H12** 条件级承接（Agent 节点为 P5-X，H7 全称由 P6/P7 关闭）。design/05 §6 → DHR_28 / DHR_29 / DHR_51 / DHR_52。design/02 **B6/B11** → DHR_29；**B7** 拆两半：宿主存活 D18 + run_id D23 + `.gitignore` 前置 → DHR_51，**双根发现 → DHR_30**。**P5-M1~M8 每条（或每分句）恰有唯一整条承接卡**，见 §4.1。<br>⚠️ **一条存量缺口如实登记**：design/02 **B1 的「双根 discovery」分句**在本计划内此前**无任何任务卡承接**（全文仅 §1 承接设计清单与 §2.2 禁改边界各提一次）——非 `DHR-B-15` 引入（原 DHR_29 卡面同样零命中）。本次只做登记，**承接人待 DHR_30 开工 B-调整时定**；在此之前 P5-M 与 B1 均不得按整条记过。 |
| 颗粒度（`DHR-B-15` 重跑） | DHR_28=契约 + ADR 验收单元（已完成）；**DHR_29=Store / 回放 / 契约修订验收单元**；**DHR_51=宿主 / lease / 发号 / 恢复验收单元**；**DHR_52=RPC / 握手验收单元**；DHR_30=客户端验收单元；DHR_31=端到端闭环 + 人判单元。原「开工时拆 ≥2」的预告已兑现（拆 3 张） |
| 依赖（`DHR-B-15` 重跑） | `DHR_28 → DHR_29 → DHR_51 → DHR_52 → DHR_30 → DHR_31` **单链无环**；DHR_28 额外依赖 P4 阶段闸。时序自洽性已核：DHR_29 的契约修订批次 1 重生成三份基线 **先于** DHR_52「参考实现指纹与 `capability-baseline.json` 逐字相符」的断言 |

## 6. 计划完工

- [ ] DHR_28~31 **与 DHR_51 / DHR_52** 全部销户（状态=已完成 或 已取消并留因）。
- [ ] P5-M1~M8 全部有等价 pass 证据；P5-X 三态已登记。
- [ ] 端到端联调证据：DSH 关闭下 basic-agent-task Process 闭环 + 终端断连恢复实录可复跑。
- [ ] P5-H 已向用户展示并由用户在对话中判断；P6 是否解锁由用户明确表态。
- [ ] `dev_plan/README.md` 活跃计划表状态已更新。
