# ADR-001 · Relay Runtime 实现语言与代码根

- **状态**：**已裁决**（2026-08-20 用户对话点选）· 结论 = **TypeScript + 本仓 `relay-core/`**；次级项 pi-agent = 冻结适配器（不放宽为直连 SDK）
- **卡**：DHR_28（P5 批次 1）
- **决策轴**：语言（Go｜TypeScript）× 代码根（本仓新顶层目录｜新独立仓）——**四种组合逐一评**
- **裁决方式**：用户 2026-08-20 入口闸分流点选「草案出来摆给你点选」

## 背景

design/05 §6.3「核心语言」把语言决策**显式推迟到 P5 开工**：「P4 Pilot 完成前不锁定 Relay Runtime 最终语言，P5 开工时根据证据选择」。同文 §17「与既有设计和计划的关系 · design/04」把旧结论 **`Go 已经锁定为最终语言` 列入"以下结论由本文取代"**——所以本 ADR 是一次真实的两选，不是对既定结论的追认。

同时 §6.3 第三行钉死一条**不可选项**：「需要把 Runtime 嵌入 DSH Web 进程 → 回到 A 讨论，当前不接受」。本 ADR 的四种组合**均以"独立进程"为前提**，嵌入 DSH Web 进程不在候选内。

代码根之所以与语言同批裁决：DevPlan §2.2 把「新 Runtime 代码根」整行标为"新建"，且 §3.2 DHR_28 的变更范围写的是「新 Runtime 仓 / 目录的 `contracts/`、校验器、ADR 文档」——**根落哪决定批次 2 起的一切路径**，不能拖到写 schema 时才拍。

> 无论选哪个：协议、Run Store、Workflow Contract 和业务仓真相**保持平台无关**（design/05 §6.3 末句）。本 ADR 不改变协议中立性，也不因 DSH 增强轨（DHR_49/DHR_50）的结论而改变。

## 候选

### 语言轴

| 候选 | 一句话 |
|---|---|
| **L-Go** | Go 写 Runtime + CLI，单二进制分发，Agent 侧一律走进程 / RPC / 冻结 Adapter |
| **L-TS** | TypeScript(Node) 写 Runtime + CLI，独立进程运行，可直接持有 Agent SDK |

### 代码根轴

| 候选 | 一句话 | 具体落点 |
|---|---|---|
| **R-In** | 本仓（dh-relay）新顶层目录 | `<dh-relay>/relay-core/`，与现有 `tools/`（P1 PowerShell）并列 |
| **R-Out** | 新独立仓 | 例如 `D:\MyFiles\ai-workflow\relay-core\`，dh-relay 只留 `docs/modules/dh-relay/` 治理工件 |

### 四种组合

| 组合 | 形态 | 主要好处 | 主要代价 |
|---|---|---|---|
| **L-Go × R-In** | Go 源码放本仓新顶层目录，PowerShell 与 Go 同仓共存 | 治理零搬迁（AGENTS 入口闸 / dh 模块解析 / worktree 纪律全部现成）；单二进制分发 | 一个仓两套工具链（PS7 + Go），`dh dh-relay` 与 `tools/tests/run-relay-tests.ps1` 之外要再挂 Go 测试入口；CI/本机环境要装 Go |
| **L-Go × R-Out** | Go 独立仓 | 语言与工具链最干净；与 P1 PowerShell 物理隔离 | 治理要重建一套（新仓 AGENTS.md + CLAUDE.md 壳 + dh 模块解析）；workspace 文档与代码跨仓，收口 squash / verify 要跨仓协调；worktree 纪律「一卡一树」跨两仓成本翻倍 |
| **L-TS × R-In** | TS 源码放本仓新顶层目录 | 治理零搬迁；P4 pilot 的 Node 资产（投影器 / render / schema）可直接搬 | 同仓两套工具链（PS7 + Node）；**Node 依赖树与 DSH 安装拓扑同生态**，DHR_26 实证的软链农场 / `link:` 依赖坑离得近 |
| **L-TS × R-Out** | TS 独立仓 | P4 pilot 资产可整体演进；与 dh-relay 的 PowerShell 完全隔离 | 治理重建（同 L-Go × R-Out）；跨仓收口成本；Node 生态与 DSH 的耦合风险不因换仓而消失 |

## P4 证据

> 每条带可复跑指针（路径 + grep 锚点或行号），供复核抽验。

### 支持 L-TS 的实测证据

| # | 事实 | 指针（可复跑） |
|---|---|---|
| E1 | **Node 全链 pilot 跨版本逐字节一致**：同一 fake Read Model 在 Windows(Node v24.12.0) 与 Linux SSH(Node v18.19.1) 两侧，90/90 测试全过、七份 fixture canonical sha256 **全等**、四份人可读转录**字节相同**——比 P4-CM2 命题要求的"语义一致"更强 | `design/evidence/10-P4-多控制面Pilot报告.md` §1 表 P4-CM2 行 + §2.3「版本与实耗」；`rg -n "RESULT: IDENTICAL" design/evidence/10-*.md` |
| E2 | **投影器是一个约 250 行的纯函数**（P4 报告与 DevPlan §2.3 原文均记「约 250 行」；**2026-08-20 批次检查点 1 复核实测 284 行**——差 13%，只在此补注，按留痕原则**不回改上游 P4 报告**）：v1 现场 → 客户端中立 Read Model 的映射只需纯函数，列表/详情两屏**零改动**直接复用；架构约束（分堆源头给、客户端不推导）在真数据上未破 | `design/evidence/10-P4-多控制面Pilot报告.md` §5 H4「正面」段；实现 `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\read-model\project-v1.mjs` |
| E3 | **Node 侧开发实耗低**：DHR_27 用约 1.5 小时跑完三批（冻结 fixture → 投影器 → 演示+审计+主报告），终值 **159/159** 测试绿 | `design/evidence/10-P4-多控制面Pilot报告.md` §2.3「实耗」+ §2.2 末句 |
| E4 | **TS 侧有 Agent 复用的长期价值**：DSH continuable Subagent 已有持久描述符、会话持久化与冷恢复，提高原生 TypeScript 方案长期价值（但它解决的是 Agent 会话续接，整张受控工作流的事务与恢复仍由 Relay Runtime 提供） | `design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md` §3.2 末段；`rg -n "continuable Subagent" design/05-*.md` |

### 支持 L-Go 的实测证据

| # | 事实 | 指针（可复跑） |
|---|---|---|
| E5 | **设计口径本就把"独立 CLI / 跨外壳 / 单二进制 / DSH 隔离价值"整组倒向 Go** | `design/05-*.md` §6.3 表第 1 行（本文件 line 215 区） |
| E6 | **Node 生态与 DSH 装载拓扑真的会纠缠**：DHR_26 实测——`import Service` 会让插件可用性**依赖安装拓扑**，最终改为 `apply(ctx,config)` + `ctx.provide` 的**零 bare import**才解耦；DSH 的 module fallback「只对物理装进 profile 树的包生效，靠它解析 = 把正确性押在安装方式上」 | `workspace/DHR_26/findings.md` §12e 取代注（第 9 行）与 §7 取代注（第 17 行）；`rg -n "零 bare import" workspace/DHR_26/findings.md` |
| E7 | **Node 侧为拿到隔离付出了额外工程代价**：「零 bare import」契约测试第一版被复核判 P2——原正则只认字面量静态 import，`import(expr)` / `createRequire()` / `require()` 全是开着的门；改为从 `package.json` 的 `files` 派生运行时清单 + 四条变异逐条见红才闭合 | `workspace/DHR_26/findings.md` 第 91 行「§17 零 bare import 契约测试补漏」 |
| E8 | **DSH 侧安装拓扑有不自愈的硬失败**：首次进入全新 `DSH_HOME` 建软链农场时中断，`profiles/node_modules/` 会留一个**空目录**，下次启动 `exists and is not a symlink` 硬失败、须手工删 | `workspace/DHR_26/findings.md` 第 29 行 §12 |
| E9 | **Go 单二进制对这类风险天然免疫**：上述 E6~E8 全部是"Node 模块解析 / 安装拓扑"类风险；Go 产物不参与 DSH 的 profile 依赖树，也不需要 module fallback | 推论，依据 E6~E8 + design/05 §6.3 表第 1 行 |

### 中立事实（两边都要背）

| # | 事实 | 指针 |
|---|---|---|
| E10 | **v1 现场作为长期数据源不够**：P4 §4 六条实测缺口说明 P5 必须在 v2 协议里补齐——这是 DHR_28 批次 2 的工作量，与语言无关 | `design/evidence/10-*.md` §4 + §5 H4「负面（如实）」 |
| E11 | **CLI 是 P5 唯一必备客户端**，DSH 只是可替换客户端；DSH 三态（DHR_50）未收敛不阻塞本卡与 CLI 主线 | DevPlan §1「前置条件」B-11 段；DevPlan §3.2 DHR_30「实施提示」 |

## 代价与风险

### 语言轴

| 选 L-Go 的代价 | 说明 |
|---|---|
| **P4 Node 资产要重写** | 投影器（实测 284 行）+ render 层 + 两份 pilot schema 的消费代码不能直接搬（schema 本身是 JSON、可搬）。P4 的 159 测试是 Node 的，Go 侧要重建等价测试。**这是 Go 侧真正的差异化成本** |
| ~~失去 Agent SDK 直接复用~~ **（已中性化，不计入语言差）** | ADR-002 第②问已判 pi-agent **无论选哪种语言都走冻结 Adapter**（理由：协议中立性 + DHR_26 安装拓扑教训 + 架构不该被语言裁决绑架），故"直连 SDK"两种语言都不采用，**不构成 Go 的差异化成本**。仅当用户在次级裁决里把 L-TS 放宽为直连时，本行才重新成为 Go 的代价（批次检查点 1 小审 F-2，findings F-003） |
| **本机与 CI 要装 Go 工具链** | 当前 dh-relay 只需 PS7 + Node |

| 选 L-TS 的代价 | 说明 |
|---|---|
| **单二进制分发弱** | 要靠 Node SEA / pkg 一类方案，跨外壳（PS / bash / SSH）分发不如 Go 干净。P5 的 §1「最早可用结果」要求"启动 Relay Runtime → 用 relay CLI 观察 → 关掉 SSH"，分发形态直接影响这条体验 |
| **与 DSH 同生态的污染面** | E6~E8 是 DHR_26 花了整卡才驯服的一类坑。TS Runtime 若与 DSH 共享 Node 生态，需要在**协议之外**再维持一套"不被安装拓扑污染"的纪律 |
| **"独立进程"≠"独立生态"** | design/05 §6.3 第 2 行承认 TS 仍可保持生命周期分离——生命周期是分离的，依赖解析面不是 |

### 代码根轴

| 选 R-In 的风险 | 一仓两套工具链，`dh dh-relay` 体检与测试入口要扩；仓变大；但**治理与留痕零搬迁** |
| 选 R-Out 的风险 | 新仓要按 `references/AGENTS-CLAUDE-写法.md` 重建 AGENTS.md + CLAUDE.md 壳（否则新仓成为 virgin 项目、下一个 agent 会绕过入口闸直接改代码）；`docs/modules/dh-relay/workspace/DHR_28~31/` 与代码**跨仓**，E12 的"精确 squash 合入 + verify"要跨两仓协调；worktree 纪律「一卡一树」成本翻倍。**参考先例**：dh-relay 本身就是 2026-08-17 从 dh-crew 用 `git filter-repo` 拆出的，拆仓可行但有成本（见 `backlog.md` DHR-BL-5） |

### 通用风险

- **不可选项**：把 Core 嵌入 DSH Web 进程——无论哪种组合都不接受（design/05 §6.3 第 3 行），要改须回 A 立项。
- **协议中立性不受本 ADR 影响**：任何组合下，`contracts/` 都不得导入 DSH / Cordis / Pi / Herdr / DevHarness 私有类型（DevPlan §2.2 禁改边界 + design/05 §6.2）。

## 决策（待用户裁决）

按「语言选择原则」逐条对照。**两份权威原文并列**——DevPlan §2.3 是本卡的直接依据（task_plan C-001），design/05 §6.3 是其上游；两者 TS 侧措辞不同，不并列会丢掉一半判据（批次检查点 1 小审 F-1，findings F-002）：

| 原则原文（两处并列，逐字） | 本卡证据落在哪边 |
|---|---|
| **DevPlan §2.3**：独立 CLI、跨外壳、单二进制、DSH 隔离价值更高 → Go<br>**design/05 §6.3**：独立 CLI、跨外壳、单二进制和 DSH 隔离价值更高 → Go Runtime<br>（两处同义） | **Go**：E5 口径直给；E6~E8 把"DSH 隔离价值"从纸面变成实测代价；E9 单二进制免疫 |
| **DevPlan §2.3**：TypeScript 复用 **Agent SDK** 收益高且仍独立进程 + CLI → TypeScript<br>**design/05 §6.3**：**DSH Service** 复用收益很高，独立 TypeScript 进程仍可保持生命周期分离 → TypeScript Runtime<br>（**两处不同义**：前者说 Agent SDK，后者说 DSH Service） | **TS**：E1~E3 证明 Node 全链已跑通且跨平台逐字节一致、实耗低；E4 是长期复用价值。<br>**B-11 折扣的作用域（限定）**：E11 提醒 CLI 才是 P5 唯一必备客户端、DSH 只是可替换客户端——该折扣**只作用于 design/05 那半句的「DSH Service 复用」**，**不适用于 DevPlan 那半句的「Agent SDK 复用」（E4）**。即：TS 侧被 B-11 削弱的是"和 DSH 同生态的便利"，不是"能直接用 Agent SDK"。 |
| 需要把 Runtime 嵌入 DSH Web 进程 → 回到 A，当前不接受 | 不适用（四种组合均为独立进程） |

**AI 侧读到的张力**（供裁决参考，不代替裁决；已按批次检查点 1 小审 F-2/F-6 去偏斜）：

- **语言轴**：P4 的实测把**两边都加强了**——E1~E3 证明 Node 这条路走得通且快，E6~E8 证明 Node 与 DSH 同生态确实会纠缠。差别在赌注：
  - 选 **TS** 的赌注 = 赌"隔离纪律能长期维持"（DHR_26 已实证维持得住，但花了整卡）。
  - 选 **Go** 的赌注 = 重写约 250~284 行投影器 + 在 Go 侧重建等价测试，换掉整类安装拓扑风险。
  - **「放弃 SDK 直接复用」不计入语言差**——ADR-002 第②问已判 pi-agent **无论选哪种语言都走冻结 Adapter**，该成本两边都付。若用户希望在 L-TS 下放宽为直连 SDK，那是一个**独立的次级裁决**（见「决策」节末尾），不能默默算进 Go 的差异化成本。
- **代码根轴**（与语言轴同构的对赌，不下定性判断）：
  - 选 **R-In** 换到的 = 治理零搬迁（AGENTS 入口闸 / dh 模块解析 / worktree 纪律 / 收口 squash 全部现成）；代价 = 一仓两套工具链。
  - 选 **R-Out** 换到的 = 物理隔离与独立分发/独立开源的资格；代价 = 治理重建（新仓 AGENTS + CLAUDE 壳）+ 跨仓收口协调 + worktree 成本翻倍。
  - 分水岭是一个**外部事实**，不是技术偏好：**这份 Runtime 将来要不要独立分发或独立开源**？要 → R-Out 的代价买的是真东西；不要 → 那些代价换不到对应收益。

**次级裁决项（仅当语言选 L-TS 时才需要回答）**：ADR-002 第②问建议"即使选 TypeScript，pi-agent 也走冻结 Adapter 而非直连 SDK"。是否放宽为直连？——本 ADR 建议**不放宽**（理由见 ADR-002 第②问三条）；若放宽，须作方向决策登记，不得在批次 2 写 schema 时静默改口。

> **决策：TypeScript + 本仓新顶层目录 `relay-core/`**（用户 2026-08-20 对话点选）
>
> **裁决过程留痕**：用户首轮对语言答「你建议用哪个？」、对代码根答「我倾向于本仓，你觉得呢？」，次级裁决答「走冻结适配器（ADR 建议）」；主会话据此给出明示建议（TypeScript + 本仓 `relay-core/`）并列出**会翻盘的条件**，用户第二轮点选「采纳，进批次 2」。
>
> **主会话建议的四条依据**（供后续复核与 P5-H 复盘对照）：
> 1. 用户已定「Pi 走冻结适配器」→ TS 侧「Agent SDK 直接复用」优势自行消解；同时 Go 侧「躲开 Node 生态」优势被依据 3 消解大半，两边差价均收窄。
> 2. **DSH Bridge 无论选什么语言都必须是 JS**（它是塞进 DSH 进程内跑的插件，见 ADR-002 第③问）。选 Go = 内核 Go + 桥 JS 两套语言；选 TS = 一套到底。
> 3. **DHR_26 的安装拓扑坑咬不到内核**：软链农场 / `link:` 依赖 / 模块解析押在安装方式上（findings §12、§12c、§7 取代注）全部是"插件被装进 DSH 进程"才有的问题；Runtime 是独立进程，任何语言都不进 DSH 依赖树。真正需要隔离的是 Bridge，而 Bridge 必须是 JS。
> 4. **单二进制分发优势在本项目不成立**：两台目标机均已装 Node（P4 §2.3 实测 Windows Node v24.12.0 / Ubuntu Node v18.19.1），且 `dh` 工具链本身即 npm 全局安装的 Node 程序——dh-relay 这一系的**既有分发通道就是 npm**。
>
> **翻盘条件（诚实登记，不因已裁决而抹掉）**：若本 Runtime 将来须装到**无 Node 运行时**的机器，或作为**独立产品向外部分发**，则依据 4 立刻失效、Go 的单二进制成为真需求。P5-H（DHR_31 人判）保留「选定语言是否继续作默认」一问，本裁决不是终审。
>
> **代码根依据**：独立仓的代价（重建入口闸文档 + 跨两仓收口 + worktree 成本翻倍）只有在"要独立开源/分发"时才换得到对应收益，目前无该迹象；真到那天可用 `git filter-repo` 拆出——dh-relay 自身即 2026-08-17 用该方式从 dh-crew 拆出（`backlog.md` DHR-BL-5），路径已知、成本已知。

## 后果

裁决落定后，本卡后续步骤按下表机械执行，不再回头改本 ADR：

| 裁决 | 立即后果 |
|---|---|
| 语言 = L-Go | 批次 2/3 的 schema 用 JSON Schema（语言无关），校验器用 Go 写；`<CODE_ROOT>/tools/validate.go`；测试入口 `go test ./...` |
| 语言 = L-TS | 同上，校验器 `<CODE_ROOT>/tools/validate.mjs`；测试入口 `node --test`；P4 pilot 的 schema 消费代码可作起点（但不得把 pilot 私有形状带进正式协议） |
| 代码根 = R-In | 建 `<dh-relay>/relay-core/`；仓根 `.gitignore` 补 `/.dh-relay/`；批次 1 两份 ADR `git mv` 进 `relay-core/adr/`；批次 2 起可 `dh wt new DHR_28` 开树 |
| 代码根 = R-Out | 新仓 `git init` + 按 `references/AGENTS-CLAUDE-写法.md` 建 AGENTS.md / CLAUDE.md 壳（**先建入口闸再写代码**）；两份 ADR 复制过去，本仓 workspace 留指针并在 `progress.md` 记跨仓落点；批次 2/3 在新仓内施工，本仓只回填治理工件 |

对下游的影响（无论选哪个）：

- **DHR_29**（Runtime/Store）、**DHR_30**（CLI + 可选 Bridge）、**DHR_31**（端到端）全部继承本决策的语言与根。
- **P5-H**（DHR_31 人判）保留一条「选定语言是否继续作默认」——本 ADR 不是终审，DHR_31 跑完端到端后用户仍可推翻。
- 协议本体（`contracts/*.schema.json`）**语言无关**，即使日后换语言也不作废。
