# AGENTS.md — dh-relay · 跨 agent 唯一权威入口

> 所有 coding agent（Claude / Codex / …）进本仓库的**唯一权威入口**。CLAUDE.md 只是 Claude 兼容壳。
> 方法论全文在 dev-harness skill（按下方矩阵触发）；本文件**只放宪章 + 索引**，不抄方法论、不堆事实。

## 项目概况

- **这是什么**：接力执行范式的 Runner——没有常驻 AI 主控，Runner 按状态给三类逻辑角色（orchestrator / monitor / executor）的终端实例逐棒交棒；Review Batch 可并发存在多个 reviewer executor。relay 是给**任意业务仓**用的通用工具，它操作的一直是别人的仓。
- 技术栈：PowerShell 7 脚本 + Markdown 工件；终端后端默认 psmux（PATH 命令，不在本仓）
- 仓库形态：单仓 · 独立仓（2026-08-17 从 `dh-crew` 用 `git filter-repo` 拆出，保留全部 31 笔历史；拆分始末见 [docs/modules/dh-relay/backlog.md](docs/modules/dh-relay/backlog.md) `DHR-BL-5`）
- 默认分支：master
- dev-harness 模块：slug=`dh-relay`，模块根 `docs/modules/dh-relay/`；slug=`relay-light`，模块根 `docs/modules/relay-light/`（本仓两个现役模块，均保留 `docs/modules/<slug>/` 这一层——`dh` 工具链按它解析模块）

## GitHub 协作默认流程（可由用户明确豁免）

> 2026-09-11 起生效。本仓直接使用 GitHub，不采用 wf-analytics-platform 的 ThinkPad→ThinkBook→GitLab 接力。本节只规范版本协作路径，不替代下文的 A/B/D/E、复核、verify、人验、发布与密钥闸。

1. **Issue 先立户**：凡新增设计方案、开发方案或任务卡，在创建对应受跟踪工件前必须先建 GitHub Issue，写明目标、范围、验收、档位/风险与停止边界。同一工作项的设计、DevPlan、任务卡与实现可共用一个 Issue；目标或验收边界独立的工作项不得借用无关 Issue。设计、DevPlan 和 workspace 必须记录 Issue 号；除第 7 条的用户明确豁免外，无 Issue 时 fail closed，不先写文件后补号。
2. **任务分支 / worktree**：Issue 建立后，从已核对的 `master` 基线创建与 Issue/任务 ID 关联的分支；任务卡施工仍严格执行“一卡一 worktree”。设计、计划、任务工作区、代码与测试的实质变更不得直接提交到 `master`。任务分支上的规划确认仍不等于 D-start。
3. **PR 请求合入**：任务分支 push 到 GitHub `origin` 后，必须创建目标为 `master` 的 Pull Request。PR 必须关联 Issue（按收口条件使用 `Closes #N` 或 `Relates to #N`），并写明任务/卡号、最终差异、验证证据、风险、未完成闸与范围外发现。dev-harness 独立复核不替代 GitHub PR 检查。
4. **CI 必须通过**：PR 必须等待 `.github/workflows/ci.yml` 完成；`relay-tests-pwsh` 的 Windows/Ubuntu matrix 与 `relay-light-python` 必须成功，失败不得合并。`relay-core` 在 dh-relay 模块暂停期按 workflow 中的 `continue-on-error` 只作观测；暂停解除并去掉该配置后自动恢复为硬门。本地测试、PR 列表中出现 workflow 或某个非必须 job 绿，都不能代替上述完整 CI 结论。
5. **人工检查与合并**：CI 通过后仍须有权维护者检查并在 GitHub 合并。AI 只在用户对话明确点名授权“创建 Issue”、“commit”、“push”、“创建 PR”或“GitHub 服务端合并”后执行对应远端/版本动作；这些动作互不推定，可在一个精确授权包中逐项列明后一次确认。PR 合并不等于 verify、验收、部署、发布或清理。
6. **故障与 Issue 关闭**：GitHub 不可达、鉴权失败、目标分支漂移或必需 CI 无法得出结论时，停在当前闸门并保留本地 WIP，不绕过、不伪造远端证据。普通任务只在 PR 合并已满足全部完成条件时可自动关联关闭；高危或仍需合入后 verify/人验的任务只写 `Relates to #N`，待出口闸真正闭合后再关 Issue。
7. **用户可明确豁免**：用户可在对话中明确同意某一工作项不执行本节全部或指定的 GitHub 协作步骤（如 Issue、push、PR、Actions CI、服务端合并）；agent 必须按用户实际同意的范围执行，不得把单项豁免扩张为全流程豁免。豁免范围与日期须记入最近的设计、DevPlan、workspace 或进度工件；未建 Issue 时以 `GitHub-flow: user-waived (YYYY-MM-DD, scope=...)` 代替 Issue 号。该豁免只作用于本节，不授权 D-start、commit、复核代签、verify、验收、部署、发布或清理，也不取消“一卡一 worktree”等其他宪章硬规则。

**存量边界**：本规则默认不追溯补造已完成或已在已登记合同下进行的旧工作。用户已在 2026-09-11 明确指定 **RLT_05 作为首个迁入的存量任务**：下一次 B06 正式落盘或 D-start 前，须先创建 GitHub Issue，或取得并记录第 7 条所述的 RLT_05 明确豁免；未豁免时把当前未提交工件完整保留、转入 Issue 关联的任务分支/worktree，后续经 PR + CI 合入。迁移或豁免本身都不是 B06 确认或 D-start。

## 不可违反的硬规则（宪章）

> 与 dev-harness SKILL §硬规则同源；这里是常驻每轮的最小子集。少而硬。

1. **【入口闸】** 非平凡任务**动代码前先落户**：先按 dev-harness 分流给出档位 / 目标 / 范围 / 验收 / 落点。标准档·高危**必须用户在对话里明确确认后才开工**。用户说"做一下 / 改一下"只是提需求，不等于跳过分流。**禁止先改代码、后补工件**；已发生必须标"**失序补录**"，不得伪装成正常流程。
2. **【出口闸】** 高危五类（生产接入 / 迁移 / 上线 / 组件接线 / 数据口径）标"完成"前必须有 `verify(dh-relay):` 提交；无 verify 只能"待验收"。scope 必须是英文 `dh-relay`（中文 scope 会让 grep 闸门失效）。
3. **【需求境闸】** 标准档进"待验收"前必须有「需求境证据」（需求/人验项 + 场景操作路径 + 证据 ID + 结论）；UI/交互/可视化任务必须有真实浏览器或等价渲染截图，单测/DOM 存在/代码复核不能替代。
4. **【确认闸】** 没有用户对话里的明确确认（点选或明文），AI 不得代签 verify、不得勾人类签名区（文档勾选不算）。
5. **【复核闸】** 新卡的必做复核由启动时冻结的 `task_type` Recipe 决定：`heavy` 为代码轮 1、代码轮 2、需求方向、一致性、教训五路，`normal` 为代码轮 1、需求方向、教训三路，`light` 为教训、一致性两路；`heavy/normal` 另有有效单测要求。`heavy` 的代码轮1及必要整改闭合后，代码轮2、需求、一致性、教训四条适用路径进入同一Review Batch并发执行。`lessons-absent` 只形成可核查 N/A，不拉 Pair、不要求 Binding；适用路径的 `inline_registration` 与 `dedicated_pair` 必须按冻结 Mode 执行，Binding 不能删路径或把独立/fresh 路径降级。存量无 `task_type` 的标准档仍需两轮独立换人复核；**施工者不复核自己的卡**。
6. **【密钥红线】** 密钥 / 凭据值永不入任何工件（findings / progress / 设计文档 / commit）。进仓的窗口枚举、截图类证据先按白名单过滤，不能事后靠扫描凭据兜底。
7. **【worktree 纪律】** 一个任务卡 = 一个 worktree，收口 squash 合并即删树；禁止长命 worktree。worker 进场第一动作自 rebase master。

## relay-light 编排协议段

> 被 relay-light 监工派进本仓的 agent 读本段；与下方 Runner「编排协议段（worker 铁律）」并列、互不隶属，两套流水不交叉执行。

- 判定：监工派活 prompt 首行必须是 `[relay-light] worker · node=<n> · agent=<角色>#<实例> · workspace=<任务工作区>`（四字段样式：node、agent 角色、agent 实例、workspace）。见此标头即完成即停不等 node_closed，有 RELAY_RECEIPT 即冻结 Runner 流水。
- 分工：编排管阶段，监工管本阶段节点，worker 只完成当前节点；写完完成信号即停，无 node_closed，不越位派活、不回头问用户、不自行续节点。
- 计划例外：relay-light 运行中的白名单追加有意绕过 B-adjust；例外只覆盖任务卡、开发方案任务行与接力计划追加，设计与验收仍走 dev-harness。

## 编排协议段（worker 铁律 · 被派进本仓的 agent 必读）

> **谁读**：任何被派进本仓的 worker（Claude / Codex / …），无论施工还是复核——包括被 relay 自举流水拉起的每一棒。
> **为什么在宪章层**：这几条是 dh-crew P1 试点实拉三次踩出来的（worker 越位当主控 / 自加载流程框架空转 / 卡住憋死不回话），靠临时话术救不住，必须常驻。
> **口径来源**：原始定义在 dh-crew 仓 `docs/modules/dh-crew/design/10-手动派活范式.md`——**该文档不在本仓**，故本段自包含地写全，不留悬空指针。

### 通用铁律（施工 / 复核都适用）

1. **你是 worker，不是主控**：禁止再拉终端 / 派活 / 起 watcher，禁止调 AskUserQuestion 或以任何方式回头问用户。relay流水下只完成Work Item Ticket指向的当前Node；手动派活下只完成brief/review-brief指向的这一件事。
2. **Ticket 定位，workspace 给业务合同**：收到Ticket时，先按Ticket进入精确worktree，读仓根AGENTS，再读Ticket指向的workspace `brief.md` / `task_plan.md` / `progress.md` / `findings.md`与Handoff；Ticket不重抄业务全文，workspace才是节点工作内容的权威来源。尚未启用Ticket的手动派活继续以brief/review-brief作为完整指令集。两种模式下都别自己加载dev-harness skill，也别满仓库寻找额外“流程框架”。棒次协议归属先看标记：有 RELAY_RECEIPT 即冻结 Runner 流水，不交叉执行 relay-light（其标头判定见上段）。
3. **硬节点边界**：施工、复核、验证、诊断是不同 Node。当前 Node durable 收口并收到 `node_closed` 后立即停止；不得自行调用 `continue`、启动下一 Worker、把施工会话变成复核会话，或把测试通过解释为复核开始。
4. **卡住必须落信号、不许憋死**：遇到阻塞 / 有疑问 / 缺信息，不要停在原地等——按 Ticket/workspace 规定的方式把 `blocked` 写出去（relay 流水下 = 写 checkpoint / result；手动派活下 = 写结构化 DONE）。单向憋在交互态里不写任何文件 = 主控在超时前完全看不见你。
5. **范围外新想法记 findings/backlog，不顺手做**——哪怕看起来只是顺手一行改动。
6. **禁止在自己的 shell 里 `Remove-Item Env:RELAY_*`**：那会摧毁本棒的 relay 身份（`RELAY_RECEIPT` 一没，`relay-agent-tool.ps1` 按设计 exit 3，checkpoint 与 result 全部写不出去，最终被误判失联并丢结果）。要清 env 跑全量回归，**必须新开子进程**。事故链见 [docs/modules/dh-relay/backlog.md](docs/modules/dh-relay/backlog.md) `DHR-BL-4`。

### 施工 worker

- relay流水：读Ticket → 进入精确worktree → 读workspace brief/task_plan/Handoff → 只执行当前construction Node。手动派活：按brief及其task_plan工作。两种模式下跑偏都只记progress、不回头改task_plan。
- 完成动作三条：①过程与证据写`progress.md`；②按Ticket或手动brief规定的Result/Handoff/完成信号收口，relay流水等待`node_closed`；③**不改DevPlan任务表状态列、不进入复核**（状态和下一次`continue`只由主控处理）。

### 复核 worker

- relay流水按Ticket进入精确worktree并读取指定review brief/candidate/Handoff；手动派活直接读review-brief。只处理本`review_path_id`或手动brief指定轮次，只读不改代码，逐条按级别把结论写进独立`review.md`。
- 完成写**独立**的轮次信号（如 `review2.DONE`），**不复用施工的**——否则主控 watcher 秒退、收工唤醒废掉。
- 只写事实与级别，不替主控做验收裁决。

## 任务类型阅读矩阵（索引）

> 按任务类型读最少够用的上下文，别一次性全加载。

| 干什么 | 先读 |
|---|---|
| 立项 / 拆计划 | dev-harness `references/动作-A-立项.md` / `references/动作-B-拆计划.md` + `references/查漏-W14.md` |
| 开工 / 档位判定 | dev-harness `references/动作-D-开工.md` + `references/节点表.md` + 本文件宪章#1 |
| 收口 / verify / 复核 | dev-harness `references/动作-E-收口.md` + `references/节点表.md` + `references/verify-代签与汇报.md` + 本文件宪章#2~#5 |
| 恢复现场 / 继续 | dev-harness `references/动作-R-恢复.md` + [docs/modules/dh-relay/dev_plan/](docs/modules/dh-relay/dev_plan/) / [docs/modules/dh-relay/workspace/](docs/modules/dh-relay/workspace/) |
| 修 bug / 优化分流 | dev-harness `references/维护任务.md` |
| 接力执行范式总览 / Runner / RelayPlan | [docs/modules/dh-relay/design/README.md](docs/modules/dh-relay/design/README.md) + [docs/modules/dh-relay/dev_plan/](docs/modules/dh-relay/dev_plan/) |
| 现役实现是什么样 | [docs/modules/dh-relay/as-built/](docs/modules/dh-relay/as-built/)（contracts / **relay-core** / runner / psmux-host / policy 四份快照） |
| 未排期的需求与已知坑 | [docs/modules/dh-relay/backlog.md](docs/modules/dh-relay/backlog.md) |
| 踩过的坑 | [docs/modules/dh-relay/knowledge/教训库-候选.md](docs/modules/dh-relay/knowledge/教训库-候选.md) |
| 主控派活（Windows 默认走 Herdr 拉交互式终端；claude kind 有 PATH shim 坑） | [docs/modules/dh-relay/knowledge/herdr-派活操作.md](docs/modules/dh-relay/knowledge/herdr-派活操作.md)（2026-08-28 用户指示 + 实测） |

## dev-harness 落点 / slug

- 模块工件归 `docs/modules/dh-relay/`：`design/` 设计与验收、`dev_plan/` 计划与状态、`workspace/<卡>/` 任务工作区、`as-built/` 实现快照、`knowledge/` 教训、`backlog.md` 需求池。**与拆分前同路径**——历史留痕里的 doc 路径引用继续有效。
- 生产代码落点 `tools/`（拆仓时由 `tools/relay/` **提级一层**，独立仓里只有 relay 一份代码，再套 `relay/` 是冗余）；测试入口 `tools/tests/run-relay-tests.ps1`（本仓自带，与任何外部 run-all 无关）。
- verify scope = `dh-relay`；状态以 `docs/modules/dh-relay/dev_plan/` 为权威，本文件只登记不抄状态。
- relay-light 模块：slug=`relay-light`，文档根 `docs/modules/relay-light/`，代码根 `tools/relay-light/`，verify scope = `relay-light`。
- **运行现场不入业务仓**：P1 的 `.dh-runtime/relay/` 与历史 `<repo>/.dh-relay/<run_id>/` 仅作 legacy 读取，不原地迁移。新正式根统一为独立 PlanHome `D:/MyFiles/ai-workflow/02-agent-workspace/dh-relay-workspace`：tracked `plans/<plan_id>/plan.yaml`、`registry/projects.yaml`、`archive/`，ignored `runtime/<run_id>/`、`local/`；但 resolver 迁移验收前禁止初始化或 start。跨仓 run 索引仍在用户级 `~/.dh-relay/`，只做定位。

### `dh` 命令

`dh` 全局装在 `AppData\Roaming\npm\dh.cmd`（指向 `D:\MyFiles\ai-workflow\dev-harness\tools\dh-check.mjs`，两个仓都不在）。本仓保留了 `docs/modules/<slug>/` 这一层，所以它的模块解析正常：

- `dh dh-relay` —— 按 dh-relay slug 解析
- `dh relay-light` —— 按 relay-light slug 解析
- `dh` —— 不给参数时，本仓有多个模块，须显式指定

体检报出的存量失败项与拆分前在 dh-crew 里跑的结果一致（不是拆仓引入的）。

## 与 dh-crew 的关系

- dh-crew 是**另一个仓**（`D:\MyFiles\ai-workflow\dh-crew`），本仓文档里凡提到 `docs/modules/dh-crew/`、dh-crew 的 controller/loop/dispatch/notify、`tools/protocol/`，一律指那个仓，不是本仓路径。
- 设计上的"禁改 dh-crew"「不消费其 active state」等边界条款**继续有效**——拆仓让它从纪律变成了物理事实。
- `docs/modules/dh-relay/workspace/DHR_*/` 与 `docs/modules/dh-relay/design/evidence/` 是**历史留痕**（当时的事实记录），拆仓时未做路径改写。里面的 **doc 路径继续有效**（`docs/modules/dh-relay/` 与拆分前同路径）；只有 **`tools/relay/` 是 dh-crew 时期的旧地址**，本仓对应 `tools/`——**按原样读，不要"修正"**。现役文档与活代码的 `tools/` 路径已在拆仓时改好。
