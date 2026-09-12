<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_07 skill 核心、adapter 与五阶段模板

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：你是 RLT_07 手动派活的 construction worker，只处理本次派单指定的一个 Batch。进入主控给定的精确 RLT_07 worktree 后，第一个 Git 动作是 `git rebase --autostash master`，并核对基线包含 RLT_05 完成提交（squash `a7ce13c` + verify `7d06678`）。先读本文件、`brief.md`、`progress.md`、`findings.md`、DevPlan RLT_07 卡和下列 Context。**本卡正式依赖 RLT_01 尚未交付，D-start 未授权**——施工只在派单明确开放的 Batch 与 allowed-paths 内进行；路线偏离只记 `progress.md`，不回写本文件。不改 DevPlan 状态，不自行复核、验证、验收、commit、merge、push 或 deploy。

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `AGENTS.md` | 手动 worker、durable signal、密钥与 worktree 纪律 |
| C-002 | `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` §RLT_01/03/05/07、§4、§8.3 | DevPlan 权威决定 owner、任务边界、依赖、allowed-paths、heavy 与跨卡守恒 |
| C-003 | `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` §2–§2.3 | 角色表、Recipe 唯一来源、roles.toml 权威值 |
| C-004 | 同上 §3.1–§3.5 | CLI 签名/退出码、账本七字段、状态机、错误与 lint 映射 |
| C-005 | 同上 §5.1–§5.3 | 五阶段、节点 agent 纪律、收尾偏序与关闭判据 |
| C-006 | 同上 §6.1–§6.3 | dh-mapping 承载、§6.2.1 配置五情形、§6.3 完整配置样例 |
| C-007 | 同上 §7.1–§7.4 | 分工拉取、wait/接收者、恢复协议、终端空间拓扑 |
| C-008 | 同上 §9.1–§9.4 | 四场景：trigger/close、blocked/decider、strategist、resume |
| C-009 | 同上 §11 中 RLT_07 当前 20 个 HC-RL 行 | design §11 是逐条 oracle 原文与证法；DevPlan 只定 owner 与边界 |
| C-010 | `tools/relay-light/skill/roles.toml`、`dh-mapping.toml` | RLT_05 已交付配置；skill 引用其值，不改不重建 |
| C-011 | `tools/relay-light/relay_log.py`、`test_relay_log.py` | 现役账本实现与测试基座；attempt/decision-chain 语义已实现，本卡只加测试不改实现 |
| C-012 | `docs/modules/relay-light/workspace/RLT_03/`、`RLT_05/` 七件套 | 已完成基线、worker 边界与报告格式 |

## 全程允许路径闭集与禁改项

允许修改/创建且仅允许以下路径：

1. `tools/relay-light/skill/**`（新建 `SKILL.md`、`references/adapter-claude-code.md`、`references/adapter-codex.md`；`roles.toml`、`dh-mapping.toml` **只读不改**）
2. `tools/relay-light/test_relay_log.py`
3. `docs/modules/relay-light/workspace/RLT_07/**`

禁止修改 `relay_log.py`、两份 TOML、安装器（RLT_01 路径）、DevPlan、design、as-built、AGENTS 与其他卡工作区；禁止实现 `watch`、plan-amend、新增 CLI 子命令；禁止就地编辑或反向同步用户级 skill 副本。若正式 oracle 只能越界满足，写 findings 与结构化 `DONE status=BLOCKED` 后立即停止。

## 基线、依赖与跨卡守恒

- 任务 worktree 基点为完整 SHA `77bde7006b3ef56b9e2b04a8717e462e221241fe`（master=origin/master，含 RLT_05 squash 合入 `a7ce13c` 与 verify `7d06678`）。
- 正式依赖：RLT_01（**未开始**：仓内骨架 + 安装器，明确不写业务内容）、RLT_02（已完成）、RLT_05（已完成）。已登记 findings F-001，D-start 前由主控裁决消解方式。
- 跨卡守恒：RLT_07 不创建/修改安装器与两 TOML；RLT_01 后开时先 rebase 含本卡的 master，只补骨架、安装器与其测试，不覆盖、不回退本卡业务内容。
- 卡内 Batch 1 → 2 → 3 严格串行。每批是新的手动派单；批内固定「行为/结构断言红 → 最小实现 → 批内绿 → diff 边界 → progress 结构化 DONE → 立即停止」。批次小审由主控在 worker 停止后另派并决定是否开放下一批。

## 手动派活 durable signal（三批统一）

每批 worker 在 `progress.md` 日志表追加一行，并在证据账本追加对应 E-ID；日志「下一步」字段使用以下固定结构，随后立即停止，不等待 `node_closed`：

```text
DONE task=RLT_07 batch=<1|2|3> status=<READY_FOR_REVIEW|BLOCKED|CONSTRUCTION_DONE> evidence=<E-ID,...> next=main-controller
```

- Batch 1–2 正常完成用 `READY_FOR_REVIEW`；Batch 3 正常完成用 `CONSTRUCTION_DONE`；阻塞用 `BLOCKED` 并写 reason/finding。
- 小审者只回填 `review.md` 的对应批次行与独立报告，不修代码。后续 Batch 必须由主控重新派发，原 worker 不持续等待、不自行续做。

## 施工共通约束

- skill 五件唯一源在 `tools/relay-light/skill/`；本卡新增三件为 Markdown，结构与措辞以 design 正文为唯一权威；测试一律进 `test_relay_log.py`，用 pathlib 读仓内源文件做结构清点与扫描断言。
- 全文不硬编码模型名（A132）：测试对 `SKILL.md` 与两 adapter 做冻结闭集 `{opus, gpt-5.6-terra}` 大小写不敏感词边界匹配，排除 TOML、档位词与启动器/通道名；闭集只随正式 A 事件变化，施工者不临场扩充。
- 术语分域（A100）：「终端空间」指 pane/会话拓扑，「任务工作区」指 workspace 工件目录，测试做用词扫描，两词不得混用。
- adapter 的全部 `add`/`status`/`lint` 命令模板显式带本侧 `--config-dir`：claude → `~/.claude/skills/relay-light/`，codex → `~/.codex/skills/relay-light/`（A136，由 A135 展开）；Windows/Linux 双写法。
- wait 必须返回且有接收者、三种方式齐（A21，按 design §7.2 冻结）；adapter 必须写无 watch 的前台 wait 回退，前四批 `watch` 未落地，不得假定其存在。
- 凭据值禁写规则同时进核心硬规则与派活模板（A27），与 AGENTS 宪章密钥红线同源。
- 五阶段模板生成物必须过既有 lint（A95 fixture 与 §4/§5 合同一致）；模板不产生 kickoff/verify 签字节点（A127）。
- 每批跑 focused 与全文件 `python3 -m unittest tools/relay-light/test_relay_log.py`，保留全部回归；新增运行时断言遇旧实现已正确时登记 `late-added discriminator`，写清旧行为、实际编号与判别对象，不伪造红。
- 每批更新 `progress.md`，coder 只在 `findings.md` / `lesson_candidates.md` 追加事实。

## 施工步骤 (Steps)

### Batch 1 — SKILL.md 核心（角色/账本/拓扑/硬规则/职责）与结构测试（A12 核心小节部分、A117、A132、A100、A98、A19、A66、A67、A27 核心侧）

**功能单元**：建立 `SKILL.md` 核心小节闭集与全部横向硬规则；五阶段模板小节本批立容器、Batch 2 填正文。

| 项 | 冻结内容 |
|---|---|
| Modify/Create/Test | Create `tools/relay-light/skill/SKILL.md`；Modify `tools/relay-light/test_relay_log.py`；Record RLT_07 workspace。 |
| 目标结构 | A12 小节闭集：角色表 / 五阶段模板 / 账本用法 / 拓扑布局 / 硬规则 / 放弃项；角色表与 roles.toml 的 11 个角色键对齐（引用不改写）。 |
| 合同 | A117 Recipe 唯一来自任务卡 task_type、字段缺失停下问用户；A98 计划/账本落模块 relay 目录不落任务工作区；A19 Linux 收口前直跑测试并原样记 progress；A66 coder 四行小结缺项写「无」、scribe 三素材优先级与禁写边界；A67 findings/lesson→coder、progress→scribe 映射；A27 凭据值禁写进硬规则。 |
| 先红断言 | SKILL.md 缺失、小节清点缺项、闭集模型名扫描命中、术语混用扫描命中、写入者映射断言未命中——均先红。 |
| 实现约束 | 只写 Markdown 与测试；不创建 adapter、不填模板正文、不动 TOML/relay_log；措辞引用角色名不引用模型名。 |
| 命令与预期 | focused 红后绿；全文件 unittest exit 0；`git diff --check` exit 0。 |
| 边界 diff | 仅 `SKILL.md`、`test_relay_log.py`、RLT_07 workspace；不得含 adapter、TOML、relay_log 改动。 |
| 小审输入/靶子 | Batch 1 diff、小节清点断言、两处扫描规则、红绿 E-ID、A66/A67 映射断言。 |
| 退出条件 | 获调整后本批 owner 原子项有证、旧测试全绿、无 P0/P1；progress 追加 `DONE ... batch=1 status=READY_FOR_REVIEW ...` 后立即停止。 |

### Batch 2 — 五阶段模板与运行时合同测试（A95、A133、A127、A102、A113、A103、A114、A96）

**功能单元**：在 SKILL.md 填齐五种阶段模板，并用测试把模板生成物与既有账本语义钉在同一合同上。

| 项 | 冻结内容 |
|---|---|
| Modify/Test | Modify `SKILL.md`（模板小节正文）、`test_relay_log.py`；Record workspace。 |
| 合同 | A95 场景一 C 节点 coder+checker+scribe+decider：coder/checker trigger 留空、scribe `on:done:coder`、decider `on:blocked`、`close=agent:checker`；A133 C 节点默认含 checker；A127 逐模板断言无 kickoff/verify 节点；A102 批内 checkpoint 往返 attempt 恒 1；A113 仅 agent_lost/cancelled/阶段 failed 后 attempt+1；A103 X 阶段 coder 各自 #1、C 节点内无第二 coder 实例；A114 decider 链与 strategist 链顺序、归属与 `user_decision` 必需（含 auto）；A96 两模式 resume 记原 coder、不新增 launch。 |
| 先红断言 | 模板未落地时结构断言红；运行时合同对已实现账本语义做行为断言，已正确者逐条登记 late-added discriminator。 |
| 实现约束 | 模板生成物必须过既有 lint；只改 SKILL.md 与测试；不用模板生成器、不新增 CLI。 |
| 命令与预期 | focused 红后绿；全文件 unittest exit 0；模板 fixture 过 lint。 |
| 边界 diff | 仅模板正文 + 测试 + workspace；不含 adapter、TOML、relay_log 改动。 |
| 小审输入/靶子 | Batch 2 增量、模板四角色 trigger/close、checker 默认、禁生成节点清单、attempt/决策链判别明细、红绿 E-ID。 |
| 退出条件 | 本批 owner 项有证、全量绿、无 P0/P1；progress 追加 `DONE ... batch=2 status=READY_FOR_REVIEW ...` 后立即停止。 |

### Batch 3 — 双 adapter 与五件齐收尾（A21、A26、A136、A27 adapter 侧、A12 五件齐）

**功能单元**：写齐两份 adapter，完成五件齐与落点正确收尾。

| 项 | 冻结内容 |
|---|---|
| Modify/Create/Test | Create `tools/relay-light/skill/references/adapter-claude-code.md`、`references/adapter-codex.md`；Modify `test_relay_log.py`；Record workspace。 |
| 合同 | A21 两 adapter 均写 wait 返回必须有接收者及三种方式，含无 watch 的前台 wait 回退；A26 双平台命令、claude kind 起法与 stalled 处置按 design 冻结；A136 枚举两份 adapter 全部 add/status/lint 调用，每个显式带本侧默认副本 `--config-dir`（claude `~/.claude/skills/relay-light/`、codex `~/.codex/skills/relay-light/`），三子命令各至少一次、Windows/Linux 双写法；A27 派活模板凭据禁写；A12 五件齐、落点正确在本批收尾签署。 |
| 先红断言 | adapter 文件缺失、命令模板枚举缺 `--config-dir` 或错侧、wait/接收者/三方式缺项、双平台与 stalled 小节清点缺项——均先红。 |
| 实现约束 | 只创建两 adapter 与测试；措辞不硬编码模型名（A132 扫描覆盖新增文件）；不引用 watch。 |
| 命令与预期 | focused 红后绿；全文件 unittest exit 0；`git diff --check` exit 0。 |
| 边界 diff | 仅两 adapter + 测试 + workspace。 |
| 小审输入/靶子 | Batch 3 与整卡 diff、命令模板枚举矩阵、本侧 config-dir 路径、wait 三方式、A12 五件清点、红绿 E-ID。 |
| 退出条件 | 获正式调整后 20/20 owner 项闭合或按调整更新，全量绿、无 P0/P1；progress 追加 `DONE ... batch=3 status=CONSTRUCTION_DONE ...` 后立即停止。不得自行进入 review/verify。 |

## 最终施工交接清单（不等于复核或验收）

1. `progress.md` 有每批有效红或 late-added 判别器、绿、全量回归、diff 边界、小审结论与 E-ID。
2. `review.md` 保持 20 条 owner 闭集；不得抢入 RLT_01/08/09/10/18 的验收项。
3. `git status --short` 与 `git diff --name-only` 仅 allowed-paths；不使用 `git add -A`/`.`，construction Node 不 commit。
4. Batch 3 结构化 DONE 后立即停止；heavy review 由主控另派，施工者不得自审。
