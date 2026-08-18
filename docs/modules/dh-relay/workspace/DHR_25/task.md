<!-- task.md — 轻档（一件套）+ 人判签收。DHR_25 由 P4 计划拍板为轻档。 -->
# task — DHR_25 冻结客户端中立 Read Model、fixture 与 Windows/SSH CLI 必备控制面

- **计划**：[P4-DSH工作台最小Pilot-开发方案.md](../../dev_plan/P4-DSH工作台最小Pilot-开发方案.md) §3.2 DHR_25
- **档位**：轻 + 人判签收（用户 2026-08-18 拍板）；仓外一次性只读验证，不接线、不动生产代码
- **落点（开工闸确认，用户 2026-08-18 对话给定）**：
  - `<experiment-root>` = `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\`
  - 本卡代码 = `<experiment-root>\relay-control-pilot\`
  - Linux 目标 = 真机 `ssh thinkpad`（nash-ThinkPad-E470c，Ubuntu 24.04，Node v18.19.1）
- **worktree**：不开（轻档默认不开；代码在仓外，仓内只动本工作区 + DevPlan 状态行）

## 完成条件 ★前置（逐字继承 DevPlan §3.2 DHR_25 验收口径）

> 出处：[P4 计划 §3.2 DHR_25](../../dev_plan/P4-DSH工作台最小Pilot-开发方案.md#dhr_25)。DevPlan 是唯一权威，本节是只读副本；口径变更以 DevPlan 为准。

| # | 谁验 | 完成条件（原文） |
|---|---|---|
| C1 | 机器 | [design/06 §10 P4](../../design/06-多控制面与Headless-SSH运行-设计补充.md#10-阶段计划调整) · 本计划 P4-CM1/CM2：Windows 与 Linux SSH 对同一 fixture 输出规范化后相同的 JSON；文本输出只经唯一 render 函数从 Read Model 生成，测试断言 render 不读取 fixture 之外的旁路字段、不含第二套状态推导。（不承接 H3 全称；CLI↔DSH 一致性归 DHR_27） |
| C2 | 机器 | [design/06 §10 P4](../../design/06-多控制面与Headless-SSH运行-设计补充.md#10-阶段计划调整) · P4-CM5：DSH 完全不启动时本卡全部产出可完成。（fixture 级，不是 H1 的 Runtime 级证明） |
| C3 | 机器 | SSH 会话断开、重连后 fixture 内容与 hash 不变，远端无新增持久文件。（只证明本 Pilot 无副作用，不承接 H4「不取消 Run」） |
| C4 | 机器 | 健壮性与安全——未知字段、损坏 fixture、非法状态给出明确错误；testdata 零凭据、零本机敏感路径（承接 AGENTS 宪章#6） |
| C5 | 机器 | 记录 OS / Shell / Node 或临时运行依赖版本，但只作证据，不写成 Runtime 决策 |
| H1 | **人** | Read Model v1 的最小字段（P4 §2.3）是否足以作为 P5 协议设计的起点——向用户展示 fake / v1 两份 fixture 与字段说明，用户对话确认后 schema 才进入 P5 输入 |

**非目标**：不实现 Relay Runtime、不做 v2 协议、不锁定 P5 的实现语言与正式命令；不做 v1 活现场投影（归 DHR_27）；不做任何写入。

## 施工步骤 ★精简（开工那一刻写，跑偏只记下面进度表，不回头改这里）

1. **先写会失败的测试再写实现**：`test/` 下钉住 schema 校验（未知字段/坏 JSON/非法枚举报错）、render 纯度（不读旁路字段、无第二套状态推导）、canonical JSON 稳定性。
2. **冻结 schema + fixture**：`src/read-model/schema.js` 定 §2.3 最小字段与枚举；`testdata/fake/` 落 1 份正样例 + 若干反样例；fixture 先于 CLI 冻结。
3. **实现唯一 render + CLI**：`src/render/text.js`（唯一文本渲染函数，纯函数、不推导状态）、`src/cli/`（`show` / `hash` / `env` 三个子命令，`--format text|json`）。
4. **跨终端对证**：Windows 终端跑一遍 → scp 到 `thinkpad` → SSH 会话跑一遍 → 比对 canonical JSON 的 sha256；断开重连后再验 fixture hash 与远端无新增文件。
5. **收证据 + 人判备料**：把命令、输出、hash、版本写进本文件进度表；向用户展示 Read Model 字段说明，等对话确认 H1。

## 进度 + 证据（边做边记）

| 时间 | 做了什么 | 证据（命令/路径/结果） |
|------|---------|----------------------|
| 2026-08-18 | 开工闸：用户对话确认落点 `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\` 与 Linux 目标 `ssh thinkpad` | 本文件「落点」节 |
| 2026-08-18 | 探测 SSH 目标可用 | `ssh -o BatchMode=yes thinkpad 'uname -a; node --version'` → `Linux nash-ThinkPad-E470c 7.0.0-28-generic ... Ubuntu`；`v18.19.1` |
| 2026-08-18 | 先写测试后写实现：36 条测试覆盖 schema 校验 / render 纯度 / CLI 契约 | `relay-control-pilot/test/{schema,render,cli}.test.mjs` |
| 2026-08-18 | 冻结 `relay.pilot-read-model/v1`：8 个根字段全必填、7 个状态词、闭合白名单（未知字段报错不静默丢） | `relay-control-pilot/src/read-model/schema.mjs`；字段说明见 `relay-control-pilot/README.md` |
| 2026-08-18 | 落 4 份正样例（含空 Run、全状态矩阵）+ 5 份反样例 | `testdata/fake/`、`testdata/bad/` |
| 2026-08-18 | 唯一 render（`src/render/text.mjs`，零 import）+ CLI（`show`/`hash`/`env`，退出码 0/2/3） | `relay-control-pilot/src/render/text.mjs`、`src/cli/main.mjs` |
| 2026-08-18 | **C1a** Windows 单测全绿 | `node --test test/{schema,render,cli}.test.mjs` → `tests 36 / pass 36 / fail 0`（Node v24.12.0） |
| 2026-08-18 | **C1b** render 纯度机器证：Proxy 包住 Read Model，碰白名单外属性即抛错；逐个换状态断言「只有那一行变」 | `test/render.test.mjs`「render reads only whitelisted…」「node status is printed verbatim…」「render module imports nothing…」 |
| 2026-08-18 | **C2** Linux SSH 会话单测全绿（Node v18.19.1，大版本与 Windows 不同仍一致） | `ssh thinkpad 'cd ~/dhr25/relay-control-pilot && node --test …'` → `# tests 36 / # pass 36 / # fail 0` |
| 2026-08-18 | **C1/C2 跨终端对证**：4 份 fixture 的 canonical JSON sha256、文本渲染 sha256、23 个文件的树摘要两侧全等 | `node scripts/compare-reports.mjs evidence\windows\report.json evidence\linux\report.json` → `RESULT: IDENTICAL`，exit 0 |
| 2026-08-18 | 人可读转录两侧字节相同 | `evidence/windows/show-run-basic.txt` 与 `evidence/linux/show-run-basic.txt` SHA256 同为 `DDD978BB…14E6` |
| 2026-08-18 | **C3** 断开重连零副作用：新会话重采报告与首次一致；27 次 CLI 调用前后远端 23 个文件 mtime+size 逐条一致；`$HOME` 顶层只多出 scp 上去的 `dhr25` | `evidence/linux/report-reconnect.json`、`tree-stat-before/after.txt`、`home-before/after.txt` |
| 2026-08-18 | **C4a** 健壮性：5 份反样例全部 exit 3 且 stderr 带机器码（`unknown-field` / `unknown-enum` / `bad-json` / `duplicate-node-id` / `dangling-dependency`）；用法错 exit 2 | `test/cli.test.mjs`「exit code 3 for every rejected input」「exit code 2 for usage errors」 |
| 2026-08-18 | **C4b** 安全：testdata 正则扫零凭据、零本机路径；`env` 输出不含任何文件系统路径 | `test/cli.test.mjs`「testdata carries no credentials…」「env leaks no filesystem paths」 |
| 2026-08-18 | **C4c** CLI 只读机器证：跑完全部命令后逐文件比对整棵树 sha256 与文件清单无变化 | `test/cli.test.mjs`「the CLI is read-only…」 |
| 2026-08-18 | **C5** 版本记录（只作证据，不写成 Runtime 决策） | 两份 `report.json` 的 `env` 段；汇总见 `evidence/README.md` |
| 2026-08-18 | **C2/CM5** DSH 全程未启动 | `Get-Process | ? ProcessName -match 'deepseek|dsh|harness|cordis'` → 空 |
| 2026-08-18 | 证据索引与一键复跑命令落盘 | `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\evidence\README.md` |
| 2026-08-18 | **范围变更 ①（用户对话授权）**：用户看完详情页提出「title 换行显示不好看，想要表格」。首版改为 title 进表格 + 定宽截断 | `src/render/text.mjs`（后被 ③ 取代） |
| 2026-08-18 | **范围变更 ②（用户对话授权）**：用户问「多个 run / workflow 怎么展示」。AI 查明列表页原排在 P5 DHR_30、design/01~06 与 P5 均无字段级定义，指出列表页才是日常最常用一屏，用户点选「补，现在就做」。新增列表投影 `relay.pilot-run-list/v1` + `relay-pilot list` 子命令 | `src/read-model/schema.mjs` 的 `validateRunList`；`src/render/text.mjs` 的 `renderRunList`；`testdata/fake/runs-active.json`、`runs-empty.json`；`testdata/bad/list-inconsistent.json`；`test/list.test.mjs` |
| 2026-08-18 | 列表页同样零推导：`progress{done,total}` 由源头给出，客户端不数节点（否则两客户端各数一遍必然对不上）；另加 fixture 自洽测试，列表行与详情 fixture 的 workflow / 总数 / 完成数 / attention 数逐条对齐 | `test/list.test.mjs`「progress is carried by the source」「the list fixture stays consistent with the detail fixtures」 |
| 2026-08-18 | **范围变更 ③（用户对话授权）**：用户指出定宽空格排版「错行」，要求 markdown / claude-code 风格表格、TITLE 给足空间、**超长换行不省略**。全部四张表（Nodes / Attentions / Sources / Runs）改为 markdown 竖线表，格内按显示列换行，`detail` 折进 TITLE 格 | `src/render/text.mjs` 的 `wrapCell()` / `renderTable()` |
| 2026-08-18 | 排版机器证：逐行比对每根竖线所在的**显示列**，任一行漂移即失败；长中文标题与 detail 逐字回收断言不丢字、无省略号 | `test/render.test.mjs`「the nodes table is a real pipe table…」「CJK cells do not shift the columns」「a long title wraps inside its cell」「a node detail wraps into the title cell」；`test/list.test.mjs`「CJK workflow names keep the list table aligned」「a long workflow name wraps…」 |
| 2026-08-18 | **全量重跑（终版）** Windows 67/67、Linux SSH 67/67；跨终端对证 5 份详情 + 2 份列表 fixture、28 个文件树摘要 `RESULT: IDENTICAL`，exit 0 | `node relay-control-pilot\scripts\compare-reports.mjs evidence\windows\report.json evidence\linux\report.json` |
| 2026-08-18 | **范围变更 ④（用户对话授权）**：用户要求 Nodes 表再拉宽。列宽上限 NODE 22→24、TITLE 34→48、DEPENDS_ON 26→30（上限非定宽，列只长到内容需要的宽度）；中文 detail 由此收进一行 | `src/render/text.mjs` 的 `NODE_LIMITS` |
| 2026-08-18 | **范围变更 ⑤（用户对话授权）**：用户反馈「信息堆在一起、不够结构化」，点选「两版都做我在终端对比」。列表页做出两种排布：`--layout grouped`（默认，按 group 分块）与 `--layout table`（单表）；元信息收进 `--verbose`；详情页同步做同一套减法（要你处理排到流水表之前、schema/来源进 `--verbose`） | `src/render/text.mjs` 的 `renderRunGroups` / `renderRunTable`；`src/cli/main.mjs` 的 `takeViewOptions` |
| 2026-08-18 | **架构决策（P4 实测挖出、要带进 P5）**：分堆与排序**必须由源头给**，客户端不许自己按状态分。Read Model 因此新增必填 `group`（`needs_you`/`blocked`/`running`/`done`）与可选 `top_attention_summary`；分块顺序取「各堆首次出现的顺序」，客户端不内置优先级 | `src/read-model/schema.mjs` 的 `RUN_GROUP_VALUES`；`test/list.test.mjs`「the bucket comes from the source」「bucket order follows the source order」「row order inside a bucket follows the source order too」 |
| 2026-08-18 | 中文标签是**一对一改名不是推导**：每个枚举值唯一标签（1:1 断言）、词表外的值原样打印（`brand-new-state` 不会被兜底成「状态不明」）、`--format json` 永远给原始英文枚举 | `test/render.test.mjs`「status labels are a 1:1 rename of the enum」；`test/list.test.mjs`「--format json keeps the raw enums」 |
| 2026-08-18 | 四份人可读转录两侧字节相同：列表·分区式 `C826E4CEB780…`、列表·单表式 `27808F2644F1…`、中文详情页 `2290EF45FBD0…`、英文详情页 `212447A1A0FC…` | `evidence/{windows,linux}/{list-grouped,list-table,show-run-chinese,show-run-basic}.txt` |
| 2026-08-18 | **零写入重验（终版）**：断开重连 + 跑遍全部命令后，远端 28 个文件 mtime/size 逐条一致；`$HOME` 顶层仍只多出 scp 上去的 `dhr25` | `evidence/linux/tree-stat-before.txt` vs `tree-stat-after.txt`；`report-reconnect.json`；`home-before.txt` vs `home-after.txt` |

## 验收

### AI 自评（2026-08-18）

| 条 | 结论 | 证据行 |
|---|---|---|
| C1 Windows text+json + 唯一 render + 无第二套状态推导 | **达成** | 进度表 C1a / C1b / 跨终端对证行 |
| C2 Linux SSH 同 fixture、JSON 语义一致 | **达成**（两侧 canonical JSON sha256 全等，比「语义一致」更强） | C2 行 + 跨终端对证行 |
| C3 断开重连 fixture 与 hash 不变、远端无新增持久文件 | **达成** | C3 行 |
| C4 健壮性与安全 | **达成** | C4a / C4b / C4c 行 |
| C5 记录 OS/Shell/Node 版本 | **达成** | C5 行 |

对应阶段闸：**P4-CM1 通过**、**P4-CM2 通过**、**P4-CM5 通过**。CM3/CM4/CM6 不由本卡承接。

### 待人判

- **H1（已关闭 · 用户 2026-08-18 在对话里答复「暂时够了」）**：Read Model v1 的最小字段足以作为 P5 协议设计的起点。字段说明见 `relay-control-pilot/README.md`，样例见 `testdata/`。用户同时问了「后续增删麻不麻烦」，AI 已如实说明成本分级（加可选字段最便宜；加必填字段要迁移全部现存数据；改字段含义最危险——老客户端不报错却按旧义读；删字段因白名单封闭会让带该字段的老数据被判 unknown-field）并指出**成本拐点在 P5**：现在只有一个客户端、无真 Runtime、无历史数据，冻协议且 DSH 接上后同一改动要同时动写端、两个读端与历史数据。`schema_version` 已是硬闸，可让新老并存、老客户端遇新版本直接拒而非猜。**本项由用户明文答复关闭，AI 未代签。**
- **第六轮：默认表用「当前步骤」换掉「用时」（2026-08-18，用户提出）**

默认列定为 `run_id` / 说明 / 标签 / 状态 / 进度 / 待处理 / **当前步骤**；「用时」移进 `--verbose`。默认屏回答的三个问题因此是「是不是我的事 → 这是什么活 → 卡在哪一步」，跑了多久是追问。

**代价已量化并如实登记**：当前步骤的内容最长 26 显示列（用时只要 7），默认表宽因此从 133 涨到 **152 显示列**。窄终端会折行、折行就破表。试过收窄到 144（说明 34 / 标签 24 / 当前步骤 24），但换来 `nightly-doc-che`+`ck` 这类难看的断词，判定不值，故保留 152 并在 README 标明列宽。**若用户终端偏窄，退路是把标签并回说明单元格（回到 133）。**

**全量重跑（第九版）** Windows 90/90、Linux SSH 90/90；`RESULT: IDENTICAL`（5 详情 + 2 列表 + 29 文件树）；list-split `D07129535DE9…`、list-table `C427279C7E50…`、list-grouped `5ECC6BD5DD65…` 两侧一致。

**第五轮：标签独立成列，`attempt` 表头改名（2026-08-18，用户提出）**

- **标签从说明单元格里拆出来，单独一列「标签」。** 关键约束不变：**仍是一列装该运行的全部标签**，客户端没有 key 词表、不按 key 名拆列。按 key 拆列等于客户端必须"认识"`计划`/`任务卡` 这两个词，会直接推翻 design/04 §1「Core 不内置任务卡等词义」并让上一轮的变异测试变红。新增断言：默认表头必须恰为 `run_id / 说明 / 标签 / 状态 / 进度 / 待处理 / 用时`；`fake-run-0006` 的第三个标签（`口径版本 v2`，客户端没见过的 key）必须原样出现在同一格；无标签时该格为 `-`。
- **版面代价与取舍**：加一列后宽度会超 150 列，故把「当前步骤」移进 `--verbose`。理由：说明 + 标签已足以认出是哪条活；真卡住时"卡在哪一步"在详情页有完整表格。默认表宽 133 列（与加标签列之前持平）。
- **`第几次` → `运行次数`**（用户问"第几次是指啥"）。它是**整条接力重跑到第几遍**（运行级 `attempt`），与节点表的「尝试次数」（**某一步**重试几次）是两个量，同屏出现时旧表头有歧义。分区式排布同步拆成独立的「运行次数」行。**这是本卡第三次因中文表头造成误读**（棒 → 接力编号 → 第几次），教训候选已合并升级为：**新表头落地前先自查"这个词在同屏还有没有第二种读法"。**

**全量重跑（第八版）** Windows 90/90、Linux SSH 90/90；`RESULT: IDENTICAL`（5 详情 + 2 列表 + 29 文件树）；五份转录两侧 SHA256 相同（list-split `1408E6EB4262…`、list-table `736198905CCE…`、list-grouped `5ECC6BD5DD65…`、show-run-chinese `6246B783021D…`、show-run-basic `08FED1296C36…`）。

**第四轮：加 summary + labels，列名改回 run_id（2026-08-18，用户提出）**

用户三点意见：① 确认"流程 = Workflow Contract"的理解（含两种情形：dev-harness 打包成版本化 contract；日报这类固定工作）；② 列名「运行」是动词、要换；③ 只有编号看不出内容，要加说明，含计划 ID、任务 ID、接力概要。

**对①的核对与一处修正**：理解基本对。但"dh 有变化版本号就变"这句不准——design/04「调整五」明确写着：`dh` 可能指向可变工作区，run 启动后工具被更新时**即使 Contract 文件没变** Gate 行为也会变，所以每个 run 还须冻结 `source_commit` / `contract_content_hash` / `gate_bundle_digest`。**版本号说"照哪套流程"，commit 与 hash 才说"照哪一刻的那套"。**日报那类落 `relay/basic-agent-task@1` 族（"与 DevHarness 无关的基础流程"）。

**对②的两轮**：先改成「接力编号」，用户随即反馈歧义——「编号」在中文里既能读成身份也能读成序号，与同屏的 `attempt`（第几次运行）撞车。用户拍板 **直接用 `run_id` 当表头**。标识符保留字段名，无歧义。这是本卡第二次因中文选词造成误读（前一次是「棒」），已记教训候选：**标识符类列不要翻译，中文化只做在有语义的枚举上。**

**对③的落法——不能做成字段，必须走通用标签槽**：design/04 §1 第 4/5 条给 Core 划了硬线（"Core 只认识 run、node、edge、gate、result… 等通用概念"、"Core 不内置 A/B/D/E/R、**任务卡**、两轮复核…等词义"）。把「计划 ID」「任务卡 ID」做成字段＝把 DevHarness 词义写死进协议，接日报等流程时全是死字段。因此：

| 字段 | 说明 |
|---|---|
| `summary` | **必填**非空 string，一句话说清这次接力在干什么 |
| `labels[]` | 可选 `{key, value}` 数组，源头给什么客户端原样显示什么，**客户端无 key 词表** |

DevHarness contract 填 `计划=P4`、`任务卡=DHR_25`；`fake-run-0006` 额外带 `口径版本=v2`；`fake-run-0007` 带 `定时任务=nightly-doc-check`；两个自检 fixture 一个标签都不带（保证"无标签"路径由真 fixture 覆盖）。同 key 重复判 `duplicate-label-key`。

**三条断言守住这个机制**：① 变异测试——把渲染器改成"认识 `任务卡` 这个 key 并改写成 `CARD`"，断言立刻失败；② 扫 `ALL_ALLOWED_KEYS`，确保 `task_card_id`/`plan_id`/`review_round` 这类词永不成为字段名；③ 标签顺序由源头给，客户端不排序。

**版面改动**：列表默认列 = `run_id` | 说明 | 状态 | 进度 | 待处理 | 用时 | 当前步骤；「流程」（Workflow Contract ID）移进 `--verbose`——一眼扫的时候你找的是"这是什么活"，不是"哪个 contract 编译的"。标签在说明单元格里换行续排（复用 node.detail 同一套视觉语法）。详情页首行改成 `[run_id] summary · 状态`，其下依次是标签行、`流程 X`、触发行。

**全量重跑（第七版）** Windows 89/89、Linux SSH 89/89；`RESULT: IDENTICAL`（5 详情 + 2 列表 + 29 文件树）；五份转录两侧 SHA256 相同（list-split `38A0823E73AA…`、list-table `2FC6A3FE6910…`、list-grouped `68A920490B28…`、show-run-chinese `6246B783021D…`、show-run-basic `08FED1296C36…`）；零写入复验 29 个文件 mtime+size 逐字不变。

**术语结论更正（2026-08-18，第二次查证，推翻本文件上一条的判断）**

用户要求"把设计方案的术语也改一下"，我在动手前全仓扫词，扫到了 design/04 §5 的 **Workflow Contract**——**"可复用、版本化的流程模板"这个概念设计里一直有，上一条记的"design 里没有工作流概念"是错的，本条更正。**

design/04 的原话与族清单：

> Workflow Contract 是某类工作流面向 Relay 的版本化执行投影。它回答：可以有哪些节点；哪些节点和边必须存在；哪些可以选配；哪些角色必须独立；哪些状态需要用户确认……

```text
dev-harness/task-standard@1      当前 P2 主目标，映射 D/E 标准档
dev-harness/task-light@1
dev-harness/maintenance@1
relay/basic-agent-task@1         与 DevHarness 无关的基础流程
```

以及把整条链说全的一行：`Workflow Contract + Params + Extensions + Authority -> ResolvedPlan`。

**因此三层对应关系是：**

| 层 | design 名字 | 字段 |
|---|---|---|
| 模板（可复用、有版本） | Workflow Contract（design/04 §5） | `workflow_name` |
| 这一次排的班 | ResolvedPlan / RelayPlan（design/01 §3） | `nodes[]` + `depends_on` |
| 这一次的执行 | Run | `run_id` |

**落地改动**：列名「主题」→「**流程**」（列宽 24→30）；`run-basic.json` 与 `runs-active.json` 的 `fake-run-0001` 改用 contract ID 形态 `dev-harness/task-standard@1`，其余 fixture 保留人话名字，**两种写法都进实际渲染**。

**AI 认错留痕**：本卡关于 `workflow_name` 的解释错了两轮——先用"剧本"比喻（方向对但无据），再自我推翻成"设计里没有这个概念"（错），第三轮查 design/04 才落实。根因是前两轮只扫了 design/01–02 就下结论，没有全仓查词。**教训候选**：涉及"设计里有没有 X 概念"的判断，必须全 design/ 目录扫词后再答，不能只读最相关的一两篇。

**因此不改设计文档，改的是 CLI。** 用户原始诉求是"把设计方案的术语也改一下"，但查证结果是**设计文档的词是自洽的，偏离的是本 Pilot**。另有三条硬成本佐证不该动 design：① 「完整流水」全仓 141 处，其中两处是**文件名**（`02-完整流水-*.md` / `03-完整流水-*.md`）；② `<!-- dh:topic tier=标准 review=完整流水 -->` 是 dh-check 读的 review 调度标识，改名要同步 AGENTS.md 调度表；③ 改 design/ 属 A 事件（需 fresh-context 审核 + 用户整版确认），且本卡宪章明确禁改 `docs/modules/dh-relay/` 除工作区与计划回填外的路径。**已向用户说明，等其裁决是否另开 A 事件。**

**新增待 P5 决定项**：`workflow_name` 目前是自由 string，未强制成 `<族>/<名>@<版本>`。要不要在协议层收紧，P5 定。本卡不擅自加约束。

**全量重跑（第六版）** Windows 84/84、Linux SSH 84/84；`RESULT: IDENTICAL`（5 详情 + 2 列表 + 29 文件树）；五份转录两侧 SHA256 相同（list-split `C76D93233923…`、list-table `09D366172618…`、list-grouped `1BC3DD7DEB54…`、show-run-chinese `2C26925CD878…`、show-run-basic `44F9757B606B…`）。

**术语与设计文档对齐（2026-08-18，用户追问「工作流指的是什么」后查证 design/01 §3.2–3.3 得出）**

查证结论：**design 里没有"可复用工作流/模板"这个概念。**运行现场是 `.dh-runtime/<ns>/<run_id>/`，每个 run 一个目录、各自带一份 RelayPlan（`plans/relay-plan.vN.proposal.json` + `active-plan.json`）；计划由一次性编排 agent 依据已确认 Design/DevPlan 现场排出（§4.5），且允许中途重排（`authority` 记届次）。既没有模板目录，也没有模板注册表。

由此得到三条：

1. **`nodes[]` + `depends_on` 就是 design/01 §3 的 RelayPlan（接力计划表）**。渲染标题因此从「执行步骤」改为「**接力计划（N 步）**」，与设计文档同词。
2. **`workflow_name` 在 design 里没有对应概念**。它是 P4 开发方案 §2.3 列出的必备字段，但设计正文从未定义。本卡按"一句人话标签（这次接力在干什么）"实现，屏幕列名从「工作流」改为「**主题**」，避免叫得像模板 ID。**这是一个真缺口，带往 P5：冻协议时须定它是自由标签还是要升级成有身份的流程标识。本卡不擅自扩语义。**
3. **AI 前一轮的口头解释有误、已在对话里更正**：我曾用"同一个剧本跑了两次"解释 `fake-run-0001` / `fake-run-0002` 共享 `p1-relay-poc`。按设计这属于说过头——没有可复用剧本，同名只表示两次接力在干同一件事。

用户否决了「棒 / 流水」两个词（设计文档行文用词，非字段名），最终词表：**接力计划**（nodes 表标题）／**步骤**（行）／**主题**（workflow_name）。

**全量重跑（第五版）** Windows 84/84、Linux SSH 84/84；跨终端对证 `RESULT: IDENTICAL`（5 详情 + 2 列表 + 29 文件树）；五份转录两侧 SHA256 相同（list-split `A30661C457B0…`、list-table `051040C51B63…`、list-grouped `7535F55A9655…`、show-run-chinese `2C26925CD878…`、show-run-basic `A26BAB57EBDF…`）。

**第三轮字段扩充（2026-08-18，用户点选「加 ① 和 ③」）** 两份投影各加两个**可选**字段：

| 字段 | 说明 |
|---|---|
| `attempt` | 运行级重跑次数（整数 ≥ 1）。与节点级 `attempt` 分开：节点级说「这一步重试过」，运行级说「整条重跑过」。**缺省不等于 1**，缺省是「源头不记这个」，屏幕显示「未知」——有断言钉着不许给沉默的源头编一个数字 |
| `log_locator` | 想看现场从哪进。**校验拒绝主机绝对路径**（盘符、UNC、`/home/`、`/Users/`、`/root/`、`/mnt/`、`/var/`、`/etc/`），落宪章#6/G10「不把主机布局带进任何工件」。新增 `testdata/bad/host-path-locator.json` 走 CLI 退出码 3 |

三个 fixture（`run-status-matrix` / `run-empty` / `fake-run-0006`）**故意两个都不带**，让"缺省"这条路径由真 fixture 而不是只由测试里的临时删改覆盖。

**同轮补了一条真约束、并明确拒绝了一条假约束**（用户问「待处理件数是否应 ≤ 进度」）：

- **补**：待处理事项若写了 `node_id`，该步骤必须在本运行里真实存在，否则判 `dangling-node-ref`。理由是屏幕告诉你去某处看、那地方却不存在，是可检测的坏屏。
- **拒**：**不设**「待处理条数 ≤ 进度/总步数」。一个步骤可同时抛多件（一轮复核提 3 个 P1），运行级事项（配额耗尽、探针失联）根本不挂步骤。加上限会把真实情况判非法。已加反向断言：5 步的运行挂 7 条待处理事项必须通过。

**两块屏的关联键是 `run_id`**（用户问「待处理 2 件怎么看到那两件」）。列表页给计数、详情页给条目本身。一致性断言已扩到新字段：同一 `run_id` 下 `attention_count` 必须等于 `attentions[]` 条数，`progress` 必须等于详情节点实际计数，`workflow_name`/`run_status`/`started_at`/`trigger`/`trigger_by`/`attempt`/`log_locator` 必须逐字相同。**遗留粗糙处**：本 Pilot 的 `show` 收的是文件路径不是 run_id（fixture 就是文件），真实客户端应当 `show <run_id>`——这是 P5 的事，本卡不补。

**术语对齐的一个已知偏差（待用户裁决，未擅改）**：设计文档 design/01 §3 术语表用 **RelayPlan（接力计划表）**、**每棒**；design/02 用 **完整流水**。本轮我把 `workflow_name` 显示成「工作流」、`nodes[]` 显示成「步骤」，属于 CLI 自造的第三套词。建议回对齐成「流水」「棒」，已向用户提出。

**全量重跑（第四版）** Windows 84/84、Linux SSH 84/84；跨终端对证 5 份详情 + 2 份列表 fixture、29 个文件树摘要 `RESULT: IDENTICAL`；五份转录两侧 SHA256 相同（list-split `B88E613CAF19…`、list-table `94C8BA99C263…`、list-grouped `7535F55A9655…`、show-run-chinese `C3EA2D958348…`、show-run-basic `FDA536AB58E9…`）；零写入复验：跑遍全部命令（含 `--verbose`）前后 29 个文件 mtime+size 逐字不变。

**`cost`（token / 费用）经用户裁决不进 v1**，留待真有决策需求时进 v2。

**第二轮排布 + 术语 + 字段扩充（2026-08-18，用户在对话里逐条提出并授权）** 三件事：

1. **多表式成为默认排布**（`--layout split`）。按「已完成 / 进行中 / 其他」拆三张独立 markdown 表，三张表共用一套列宽、上下对齐成一张网格。单表式退为 `--layout table`，分区式仍是 `--layout grouped`。三节是对**源头 `group`** 的一次固定合并（`done`→已完成、`running`→进行中、`needs_you`+`blocked`→其他），客户端仍然从不读 `run_status` 决定归属；两条镜像断言钉着：改 `group` 必须移动、只改 `run_status` 必须逐字不变。词表外的 `group` 自成一节原样打印。变异测试已验证这组断言会咬（把分节改成按 `run_status` 推导 → 2 条断言立刻失败）。
2. **术语全面书面化**。状态：未开始/在跑/等人拍板/被卡住/状态不明 → 待开始/运行中/待人工确认/已阻塞/状态未知；级别：提醒/挡路 → 警告/阻塞；角色：施工 → 执行；类型：要你定/依赖没到/额度用完/要人复核 → 待决策/依赖未就绪/配额耗尽/待人工复核；表头：棒/活/流水/做什么/第几次/依赖谁/停在哪一棒 → 步骤/运行/工作流/内容/尝试次数/前置步骤/当前步骤；节标题统一成 `名称（条数）`；空节 `(none)` → `（无）`。1:1 映射断言与"词表外原样打印"断言同步更新，仍然全绿。
3. **详情页「待处理事项」从缩进键值块改成表格**，与执行步骤表同一套视觉语法；`attention_id` 收进 `--verbose`。

**新增四个字段（用户点名要「谁派的」「跑了多久」，两份投影都加，全部必填）**

| 字段 | 说明 |
|---|---|
| `started_at` | 运行起始时间；晚于 `updated_at` 直接报错 |
| `elapsed_seconds` | **由源头测量**、截至 `updated_at` 的已运行秒数（整数 ≥ 0） |
| `trigger` | `human` / `schedule` / `api` / `parent_run` |
| `trigger_by` | 具体是谁：人名 / 定时任务名 / 上游 run_id / 调用方；空串被拒 |

**关键取舍：时间差必须源头算，客户端不许读时钟。** 若客户端用「现在 − started_at」自算，同一份数据在两台机器、两个时刻会渲染出不同文本，"两地逐字节相同"这条证据当场作废——而它正是"客户端不推导"唯一的实证方式。代价是这个数是快照、屏幕不会自己往前走，与整份 Read Model 的快照语义一致。已加硬断言：渲染器源码中不得出现 `Date` / `now(` / `hrtime` / `Intl` / `toLocale` / `process.`。

**过程中发现并修掉一个真 bug**：上一轮我用 `scp a b host:~/.../src/` 把两个文件误投到 `src/` 根，在远端造出 `src/text.mjs`、`src/main.mjs` 两个孤儿副本。Linux 侧「唯一 render 函数」断言当场判失败（找到 2 个 `renderText` 定义）。已删除，远端文件树回到 28 个文件。**这条断言本来就是为防"第二套渲染实现"设的，它抓到的正是这种情况。**

**全量重跑（第三版终版）** Windows 77/77、Linux SSH 77/77；跨终端对证 5 份详情 + 2 份列表 fixture、28 个文件树摘要 `RESULT: IDENTICAL`；五份转录两侧 SHA256 相同（list-split `B88E613CAF19…`、list-table `94C8BA99C263…`、list-grouped `6A8958D2945A…`、show-run-chinese `34B8E8AEBA62…`、show-run-basic `1E1A8D015F8F…`）；断线重连后新会话再采一份 report 仍 `IDENTICAL`；零写入复验：跑遍全部 CLI 命令前后 28 个文件 mtime+size 逐字不变。

**仍未定的字段（已向用户提出，等答复，不擅自加进 v1）** `log_locator`（出问题能从哪看现场）、`cost`（token / 费用）、运行级 `attempt`（整条重跑第几次）。

**默认排布定稿（2026-08-18，用户在自己终端两版对比后拍板）** `relay-pilot list` 默认改为**单表式**，分区式退为 `--layout grouped`。同时把跨终端报告改成**两种排布各自出哈希**（`text_grouped_sha256` / `text_table_sha256`），让证据不依赖"谁是默认"；`compare-reports.mjs` 补了缺字段守卫（两侧同时缺某个 key 会被判 missing 而非静默 IDENTICAL）。改后全量重跑：Windows 67/67、Linux SSH 67/67，`RESULT: IDENTICAL`（5 详情 + 2 列表 + 28 文件树），四份转录两侧哈希与改动前一致（list-table `27808F2644F1…`、list-grouped `C826E4CEB780…`、show-run-chinese `2290EF45FBD0…`、show-run-basic `212447A1A0FC…`）——说明只动了默认开关，没动渲染。

**范围变更留痕（2026-08-18，六轮均由用户在对话里授权；已于同日随 `DHR-B-10` B-调整回写 DevPlan §3.2 DHR_25「实际交付范围」）**：DevPlan §3.2 DHR_25 的目标只写了单条 run 的详情投影与「text/json 双输出」，未含列表页、未规定排版形式。开发过程中用户提出五项：①title 要进表格；②多条 run 怎么看；③要 markdown 风格表格、超长换行不省略；④Nodes 表再拉宽；⑤信息堆在一起不够结构化，两版排布都做出来对比。其中 ② 与 ⑤ 属实质扩范围——列表页原排在 P5 DHR_30，AI 说明取舍后用户点选「补，现在就做」；⑤ 又逼出「分堆与排序必须由源头给」这条架构结论并改了 schema。本卡因此多交付 `relay.pilot-run-list/v1`、`relay-pilot list`（**三种排布**：`split` 默认多表 / `table` 单表 / `grouped` 分区）与必填 `group` 字段及 `progress / attention_count / max_attention_severity / top_attention_summary / current_node_id / current_node_title / attempt / log_locator` 等新字段。**DevPlan 正文未改**（改正文属 B-调整事件，非本卡权限），扩范围事实记于此——已由 `DHR-B-10`（2026-08-18）回写 DevPlan。
- **H1 问法问题（2026-08-18 记，待 P4 收口时随 B-调整处置）**：DevPlan 把 H1 写成「最小字段集是否足以作为 P5 起点」，这是技术判断，按 dev-harness G11 验收二分本不该进人验栏。用户 2026-08-18 对话明确反馈「我不是开发，无法判断字段」。本卡实际按业务面提问：「这一屏信息够不够盯一条 AI 跑的活、缺什么」，用户回答记在下方。**改 DevPlan 正文属 B-调整事件，本卡不擅自改**。
- **查证结论（回答用户「P5 字段是不是漏设计了」）**：design/01~06 只定原则（同一 Read Model、客户端只渲染不推导，见 design/06 §7 与 H3），无字段级定义；P5 计划点了 5 个类型名 `RunSummary / RunDetail / NodeSummary / EventEnvelope / AttentionSummary`（§2.3）但同样无字段，真正冻结在 P5 的 DHR_30。故 P4 出草稿 → P5 定合同是刻意分步，不是疏漏。
- 关闭方式：AI 自评 + 用户口头确认 H1；确认后回 DevPlan §3.1 销户，schema 才进入 P5 输入。
