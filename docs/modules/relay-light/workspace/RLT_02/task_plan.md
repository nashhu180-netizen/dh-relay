<!-- dh:v1 · task_plan-轻档.md — 派 headless worker 的轻档任务用施工说明书模板。 -->
# task_plan — RLT_02 与现役 Runner 一致性对照（轻档·派 worker）

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：你（worker）默认只知道「本文件 + 同目录 `task.md` + 下列 Context 来源」。按步骤照做，偏离只记 `progress`（本卡轻档，记到 `task.md` 的进度表），不回写本文件。

| ID | 来源 (path) | 为什么 |
|----|------------|--------|
| C-001 | `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` §2 角色层（含 §2.1/§2.2/§2.3） | relay-light 侧「角色」的权威定义 |
| C-002 | 同上 §3.3 三层词表、§3.4 事件分两类 | relay-light 侧「事件」的权威定义；注意只有一类走状态机 |
| C-003 | 同上 §4.1 节点表、§4.2 agent 表 | relay-light 侧「节点」的权威定义 |
| C-004 | 同上 §5.2.1 阶段收尾的固定顺序、§5.3 节点关闭判据 | relay-light 侧「关闭」的权威定义 |
| C-005 | `tools/contracts/relay-schema.ps1` | 现役 Runner 的枚举与 schema：节点/角色/事件/关闭状态的机器口径 |
| C-006 | `tools/runner/`（尤以 `relay-store.ps1`） | 现役 Runner 的事件写入与状态推进实现 |
| C-007 | `tools/host/`（尤以 `relay-agent-tool.ps1`） | 现役 Runner 的 agent 侧关闭 / Receipt 合同 |
| C-008 | `docs/modules/dh-relay/as-built/`（contracts / relay-core / runner / psmux-host / policy 五份） | 现役实现的成文快照，比读代码快；**但代码是权威，快照有出入以代码为准** |
| C-009 | 仓根 `AGENTS.md` | 本仓宪章与 worker 铁律 |

## 权威源铁律（必守）

1. **只写这两个落点**，其余一律只读：
   - `docs/modules/relay-light/as-built/现役Runner一致性对照.md`（新建）
   - `docs/modules/relay-light/workspace/RLT_02/**`
2. **禁改路径（碰了就是验收失败）**：`tools/runner/`、`tools/host/`、`tools/contracts/`，以及 `relay-core/`、`docs/modules/dh-relay/**`。只读、不改、不迁移、不"顺手修"。
3. 不要 git commit / push——提交由主控收口统一做。
4. 范围外的新想法记进 `task.md` 进度表备注，**不顺手做**。
5. 不复用现役 PowerShell 代码：跨语言只借纯追加手法与枚举命名，不照搬值、不搬实现。
6. 密钥 / 凭据值永不入任何工件。

---

## 施工步骤 (Steps) — worker 粒度

| # | 改动文件（Create/Modify/Test + 路径:行） | 怎么改（代码片 / 签名 / 样板） | 怎么验（命令 → 预期输出） |
|---|------------------------------------------|------------------------------|--------------------------|
| 1 | 只读 C-001~C-004 | 抽出 relay-light 侧四类定义清单：**节点**（节点表列、节点身份构成）、**角色**（三类逻辑角色 + checker/decider/strategist 分界）、**事件**（三层词表、走状态机 vs 不走状态机的两类）、**关闭**（节点关闭判据 + 阶段收尾顺序）。每类列成 `id / 名称 / 定义一句话 / 出处(文件#节)` 四列草表，先落进 `task.md` 进度表或临时草稿，不直接下笔成稿。 | 四类各至少列全 design/01 里出现的条目；出处必须精确到 § 号 |
| 2 | 只读 C-005~C-008 | 对现役 Runner 侧做同样的四类抽取。枚举以 `tools/contracts/relay-schema.ps1` 为准（那里是机器口径），行为以 `tools/runner/` / `tools/host/` 为准。as-built 快照只当索引用。 | 同上四列草表；凡引用代码必带 `路径:行号` |
| 3 | **Create** `docs/modules/relay-light/as-built/现役Runner一致性对照.md` | 按四类分四节（`## 1. 节点` / `## 2. 角色` / `## 3. 事件` / `## 4. 关闭`）。每节一张表，列：`# / relay-light 侧定义(出处) / 现役 Runner 侧定义(出处) / 差异描述 / 裁决 / 裁决理由`。**裁决列只允许两个值：`有意差异` 或 `遗漏`**，禁止"待定/TBD/需讨论"。`有意差异` 必须写清"为什么 relay-light 故意这么选"；`遗漏` 必须写清"relay-light 缺了什么、后续哪张卡该补"。文件头加一句说明：本文档是 RLT_02 的只读对照产物，不改变任何一侧实现。 | 四节齐全；`grep -c '有意差异\|遗漏'` 与表格行数一致；无 TBD/待定 |
| 4 | 只读自查 | 跑禁改路径自查。 | `git status --short` → 只应出现 `docs/modules/relay-light/` 下的新增；`git diff --stat -- tools/runner tools/host tools/contracts` → **输出为空**；`git diff --stat -- relay-core docs/modules/dh-relay` → **输出为空** |
| 5 | **Modify** `docs/modules/relay-light/workspace/RLT_02/task.md` | 把第 4 步两条命令与其原样输出、以及四类各自的条目数，填进「进度 + 证据」表；在「验收」节做 AI 自评，逐条对应完成条件 1 与 2。 | `task.md` 进度表非空、证据列有真实命令输出 |

## 关键决策（一句话各一行）

- Worktree：否（轻档默认不开树，主树直接做）
- 派子 agent：否（本文件即 headless worker 施工说明书）
- marker：`task.md` 已写 `> 执行者：headless worker`
- Review / verify：轻档省仪式；`light` Recipe 的教训 + 一致性两路复核由主控收口时安排
- 关闭靠 AI 自评 + 用户口头确认（见 task.md 验收节）
