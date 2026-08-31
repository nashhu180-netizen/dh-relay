<!-- dh:v1 · dev_plan/drafts/DHR-B-33-review-brief.md -->
# DHR-B-33 fresh 只读审核 brief

## 你是谁、做什么

你是**未参与起草**的 fresh 复审实例。任务：审核一份 **B-调整草案**（拆一张新任务卡）。你**只读**，不改任何文件、不 commit、不跑测试、不启动任何产品 Agent。

**读完直接把结论打在终端回复里**（不要写文件）。

## 只读硬约束

- 你运行在 `--sandbox read-only` 下。**不得**写、改、删任何文件，不得 `git add/commit/checkout`，不得跑 `npm test`，不得启动 codex / claude 产品实例。
- 主控会在你回收后比对 `git rev-parse HEAD` 与 `git status --porcelain` 证明零写入。

## 待审对象

- **草案**：`docs/modules/dh-relay/dev_plan/drafts/DHR-B-33-Claude假就绪blocked盲区-候选.md`

## 必读上下文

| 文件 | 读什么 |
|---|---|
| `AGENTS.md` | 宪章七条（尤其 #1 入口闸、#5 复核闸、#6 密钥红线、#7 worktree 纪律） |
| `docs/modules/dh-relay/design/13-目录信任自动放行-产品设计与验收.md` | §0 阻塞依赖、§2.2 前置、§4.1 验收表（`A27-M5/M7/M10/M11`）、§6 拟议 B-adjust、§7 与既有冻结件的关系 |
| `docs/modules/dh-relay/design/evidence/32-A27-目录信任能力矩阵-实测.md` §2 | `F-6809` 的原始实测与证据边界 |
| `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` | §0.2 的 `B-22` / `B-32` 两条既有事件、§3.1 任务表、§3.2 的 `DHR_67` / `DHR_68` / `DHR_35` 三张卡、§4 阶段闸、§6 查漏 |
| `relay-core/runtime/executors/herdr/herdr-executor.mjs` | `launchHerdrAgent`、`observeHerdrAgent`、`reconcileHerdrAgent` |
| `relay-core/runtime/workflow-driver.mjs` | 启动段、recovery 段、轮询循环（尤其 `instructionPending` 的补发判据与 `done\|\|idle` 分支） |
| `relay-core/test/helpers/fake-herdr.mjs` | `paneGet` / `agentGet` / `paneRun` 现役桩的返回形态 |

## 你必须自己核查的事实（**不要只信草案的转述**）

1. 草案 §2 表格里 ①②③ 三条**代码位置与后果**是否属实——**逐条打开代码核对**，行为不符就报。
2. 草案说"② 此前未登记"是否属实（全仓 grep `E_EXECUTOR_RESULT_MISSING`、`F-6809`、`F-6807`）。
3. `DHR_69` 这个 ID 是否真的未被占用。
4. 草案 §4 的允许路径是否**逐条精确**、是否够用也不超发（比如：要改的东西有没有落在清单外的文件里？清单里有没有其实用不上的文件？）。
5. 草案 §6 声称"不改任何稳定验收 ID、不触发 A-full"是否成立。

## 三段固定结论格式

### 一、方案问题
### 二、用户理解风险
### 三、需要用户决定的问题

每条写：**问题 → 依据（原始需求 / 你自己核到的仓库事实，注明文件与行）→ 影响 → 建议**，并标 **P0 / P1 / P2**。

**没有新增实质问题时，也必须列出：你核过的假设、你找过但没找到的反例、你依据的证据。** 不接受一句"通过"。

## 特别请你攻击的四个面

1. **D-B33-1（修在观测层 vs 只修启动期）**：草案推荐"仅当 `agent get` = `idle` 时才多读一次 `pane get`，`pane get` = `blocked` 才判 blocked"。这个判据会不会**误伤正常的 idle**（Claude / Codex 打完一轮就是 idle）？`pane get` 的 `agent_status` 到底是什么语义、和 `agent get` 的是不是同一个字段？草案说"误判会自愈，因为 DHR_68 有离开 blocked 后恰补发一次的路径"——**去代码里验这句是不是真的**，特别是：误判后若 `pane get` 一直不改口，会不会**永久卡住**而不是自愈？
2. **D-B33-2（把 `F-6807` 并进来）**：这是扩范围还是让命题闭合？并入后 `workflow-driver.mjs` 的允许改动面变宽，会不会碰到"不动 Result 判定"这条红线？
3. **D-B33-3（`DHR_35` 是否新增依赖）**：草案承认这会再拖一次用户等着的实录。判断依据（"错误归因的记录比失败的记录更贵"）成不成立？有没有第三条路（比如让 DHR_35 先跑但在实录里显式登记该盲区）？
4. **验收口径**：五条机器证 A~E 是否**都可机器判**、有没有偷偷混进人判；有没有哪一条其实证不了它声称的命题；`A27-M7` / `A27-M11` 与本卡的分界写清楚了没有（本卡是前置、不承接它们本身）。

## 边界

- 只审这份 B-调整草案。**不要**去审 A-27 设计本身（它已经用户整版确认、四轮复审过），除非你发现草案与它**冲突**。
- 不要建议本卡顺手做目录信任预置——那是 A-27 主卡，且其前置未完成。
- 不要提出"先跑一次真实 Claude 看看"——本卡明确不跑真实 Agent。
