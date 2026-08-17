# AGENTS.md — dh-relay · 跨 agent 唯一权威入口

> 所有 coding agent（Claude / Codex / …）进本仓库的**唯一权威入口**。CLAUDE.md 只是 Claude 兼容壳。
> 方法论全文在 dev-harness skill（按下方矩阵触发）；本文件**只放宪章 + 索引**，不抄方法论、不堆事实。

## 项目概况

- **这是什么**：接力执行范式的 Runner——没有常驻 AI 主控，Runner 按状态给一串终端里的 worker 逐棒交棒。relay 是给**任意业务仓**用的通用工具，它操作的一直是别人的仓。
- 技术栈：PowerShell 7 脚本 + Markdown 工件；终端后端默认 psmux（PATH 命令，不在本仓）
- 仓库形态：单仓 · 独立仓（2026-08-17 从 `dh-crew` 用 `git filter-repo` 拆出，保留全部 31 笔历史；拆分始末见 [docs/modules/dh-relay/backlog.md](docs/modules/dh-relay/backlog.md) `DHR-BL-5`）
- 默认分支：master
- dev-harness 模块：slug=`dh-relay`，模块根 `docs/modules/dh-relay/`（独立仓里只有这一个模块，但保留 `docs/modules/<slug>/` 这一层——`dh` 工具链按它解析模块）

## 不可违反的硬规则（宪章）

> 与 dev-harness SKILL §硬规则同源；这里是常驻每轮的最小子集。少而硬。

1. **【入口闸】** 非平凡任务**动代码前先落户**：先按 dev-harness 分流给出档位 / 目标 / 范围 / 验收 / 落点。标准档·高危**必须用户在对话里明确确认后才开工**。用户说"做一下 / 改一下"只是提需求，不等于跳过分流。**禁止先改代码、后补工件**；已发生必须标"**失序补录**"，不得伪装成正常流程。
2. **【出口闸】** 高危五类（生产接入 / 迁移 / 上线 / 组件接线 / 数据口径）标"完成"前必须有 `verify(dh-relay):` 提交；无 verify 只能"待验收"。scope 必须是英文 `dh-relay`（中文 scope 会让 grep 闸门失效）。
3. **【需求境闸】** 标准档进"待验收"前必须有「需求境证据」（需求/人验项 + 场景操作路径 + 证据 ID + 结论）；UI/交互/可视化任务必须有真实浏览器或等价渲染截图，单测/DOM 存在/代码复核不能替代。
4. **【确认闸】** 没有用户对话里的明确确认（点选或明文），AI 不得代签 verify、不得勾人类签名区（文档勾选不算）。
5. **【复核闸】** 标准档进"待验收"前需两轮独立换人复核（第一轮全面排查 + 第二轮换 agent 交叉评估）；**施工者不复核自己的卡**。
6. **【密钥红线】** 密钥 / 凭据值永不入任何工件（findings / progress / 设计文档 / commit）。进仓的窗口枚举、截图类证据先按白名单过滤，不能事后靠扫描凭据兜底。
7. **【worktree 纪律】** 一个任务卡 = 一个 worktree，收口 squash 合并即删树；禁止长命 worktree。worker 进场第一动作自 rebase master。

## 编排协议段（worker 铁律 · 被派进本仓的 agent 必读）

> **谁读**：任何被派进本仓的 worker（Claude / Codex / …），无论施工还是复核——包括被 relay 自举流水拉起的每一棒。
> **为什么在宪章层**：这几条是 dh-crew P1 试点实拉三次踩出来的（worker 越位当主控 / 自加载流程框架空转 / 卡住憋死不回话），靠临时话术救不住，必须常驻。
> **口径来源**：原始定义在 dh-crew 仓 `docs/modules/dh-crew/design/10-手动派活范式.md`——**该文档不在本仓**，故本段自包含地写全，不留悬空指针。

### 通用铁律（施工 / 复核都适用）

1. **你是 worker，不是主控**：禁止再拉终端 / 派活 / 起 watcher，禁止调 AskUserQuestion 或以任何方式回头问用户。你只完成 brief 交给你的这一件事。
2. **规则全在 brief 里**：别自己去加载 dev-harness skill、别自加「先读一下流程规则 / 复核规范」这类步骤——brief（施工）或 review-brief（复核）就是你的**完整**指令集，读它、照做即可。满仓库找不到的"流程框架"不要找，那是主控的事。
3. **卡住必须落信号、不许憋死**：遇到阻塞 / 有疑问 / 缺信息，不要停在原地等——按 brief 规定的方式把 `blocked` 写出去（relay 流水下 = 写 checkpoint / result；手动派活下 = 写结构化 DONE）。单向憋在交互态里不写任何文件 = 主控在超时前完全看不见你。
4. **范围外新想法记 findings/backlog，不顺手做**——哪怕看起来只是顺手一行改动。
5. **禁止在自己的 shell 里 `Remove-Item Env:RELAY_*`**：那会摧毁本棒的 relay 身份（`RELAY_RECEIPT` 一没，`relay-agent-tool.ps1` 按设计 exit 3，checkpoint 与 result 全部写不出去，最终被误判失联并丢结果）。要清 env 跑全量回归，**必须新开子进程**。事故链见 [docs/modules/dh-relay/backlog.md](docs/modules/dh-relay/backlog.md) `DHR-BL-4`。

### 施工 worker

- 读 brief → 照 brief 指向的 `task_plan.md` 施工步骤建代码与测试；跑偏只记 progress、不回头改 task_plan。
- 完成动作三条：①过程与证据写 `progress.md`；②按 brief 规定写完成信号；③**不改 DevPlan 任务表状态列**（状态只由主控改，worker 只管把证据摆进工作区）。

### 复核 worker

- 读 review-brief（**零上下文，光读这一份即可**）→ 只读不改代码 → 逐条按级别把结论写进 `review.md`。
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
| 现役实现是什么样 | [docs/modules/dh-relay/as-built/](docs/modules/dh-relay/as-built/)（contracts / runner / psmux-host / policy 四份快照） |
| 未排期的需求与已知坑 | [docs/modules/dh-relay/backlog.md](docs/modules/dh-relay/backlog.md) |
| 踩过的坑 | [docs/modules/dh-relay/knowledge/教训库-候选.md](docs/modules/dh-relay/knowledge/教训库-候选.md) |

## dev-harness 落点 / slug

- 模块工件归 `docs/modules/dh-relay/`：`design/` 设计与验收、`dev_plan/` 计划与状态、`workspace/<卡>/` 任务工作区、`as-built/` 实现快照、`knowledge/` 教训、`backlog.md` 需求池。**与拆分前同路径**——历史留痕里的 doc 路径引用继续有效。
- 生产代码落点 `tools/`（拆仓时由 `tools/relay/` **提级一层**，独立仓里只有 relay 一份代码，再套 `relay/` 是冗余）；测试入口 `tools/tests/run-relay-tests.ps1`（本仓自带，与任何外部 run-all 无关）。
- verify scope = `dh-relay`；状态以 `docs/modules/dh-relay/dev_plan/` 为权威，本文件只登记不抄状态。
- **运行现场不入仓**：P1 现役走 `.dh-runtime/relay/`，P2 决策 D21 换根到 `<repo>/.dh-relay/<run_id>/`；跨仓 run 索引在用户级 `~/.dh-relay/`。三者均已在 `.gitignore` 里锚定或本就在仓外。

### `dh` 命令

`dh` 全局装在 `AppData\Roaming\npm\dh.cmd`（指向 `D:\MyFiles\ai-workflow\dev-harness\tools\dh-check.mjs`，两个仓都不在）。本仓保留了 `docs/modules/dh-relay/` 这一层，所以它的模块解析正常：

- `dh dh-relay` —— 按 slug 解析
- `dh` —— 不给参数，本仓只有一个模块，自动选中

体检报出的存量失败项与拆分前在 dh-crew 里跑的结果一致（不是拆仓引入的）。

## 与 dh-crew 的关系

- dh-crew 是**另一个仓**（`D:\MyFiles\ai-workflow\dh-crew`），本仓文档里凡提到 `docs/modules/dh-crew/`、dh-crew 的 controller/loop/dispatch/notify、`tools/protocol/`，一律指那个仓，不是本仓路径。
- 设计上的"禁改 dh-crew"「不消费其 active state」等边界条款**继续有效**——拆仓让它从纪律变成了物理事实。
- `docs/modules/dh-relay/workspace/DHR_*/` 与 `docs/modules/dh-relay/design/evidence/` 是**历史留痕**（当时的事实记录），拆仓时未做路径改写。里面的 **doc 路径继续有效**（`docs/modules/dh-relay/` 与拆分前同路径）；只有 **`tools/relay/` 是 dh-crew 时期的旧地址**，本仓对应 `tools/`——**按原样读，不要"修正"**。现役文档与活代码的 `tools/` 路径已在拆仓时改好。
