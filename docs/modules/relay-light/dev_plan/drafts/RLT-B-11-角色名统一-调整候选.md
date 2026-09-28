<!-- dh:v1 · RLT-B-11 B-adjust 候选稿 v2 · 未生效。不得作为 D 开工输入；用户确认后才落 dev_plan/P1-RelayLight-开发方案.md。 -->

# ⚠️ 未生效候选稿 ⚠️ — RLT-B-11：新增 RLT_30「角色名统一施工」

- **规划输入**：只读已晋级的 `design/01`（RLT-A-15，用户 2026-09-28 整版确认，`7e05f34`）；不读候选稿/evidence 作为规划依据。
- **GitHub**：Issue **#70**；分支 `plan/RLT_A_15`（PR #71，A-15 设计与本卡同一 PR 收口）。
- **状态**：v2（v1→v2：落 fresh B 审核 `design/evidence/15` §七 全部 finding 与用户 2026-09-28 四答——报错卡里写规矩、status 按样张、RLT_30 在 plan/RLT_A_15 施工、两机同步现在授权）
- **stage**：B-adjust——新增 1 张卡、新增第 9 批、§6 改挂 1 个验收 ID；不删、不拆、不合并既有卡，不解冻旧卡。

## 1. DevPlan 改点

| 编号 | 位置 | 改动 |
|---|---|---|
| B-01 | 标题日期 + 顶部活动声明（四处） | ①标题更新至 2026-09-28；②第 3 行前新增 `> **2026-09-28 RLT-B-11 / Issue #70**：基于已晋级的 RLT-A-15（角色名统一），新增 RLT_30 与第 9 批；A131 改挂 RLT_30；更正卡数；不改其它卡、不解冻旧卡。`；③第 10 行可解析注释 `id=RLT-B-10` → `id=RLT-B-11`，review / understanding 指向 `../design/evidence/15-交叉审核记录-RLT-A15-角色名统一.md#review-rlt-b11` / `#understanding-rlt-b11`；④历史索引表追加 RLT-B-10 行（stage B-adjust，证据 evidence/14 `#review-rlt-b10`），第 12 行「当前活动声明为上面的 `RLT-B-10`」→ `RLT-B-11`（RLT-B-10 转入索引） |
| B-02 | §3.1 任务表末行后 | 新增 `\| RLT_30 \| 角色名统一：monitor → stage-lead / watcher（账本字段冻结，relay_log 只改显示层） \| 标准 \| 未开始 \| 9 \| RLT-A-15/RLT-B-11 已确认；Issue #70 \| [workspace/RLT_30](../workspace/RLT_30/) \| — \| normal；relay_log.py 显示层代码改动 \|` |
| B-03 | §3.2 RLT_29 卡后 | 插入下文 §2 卡片全文 |
| B-04 | §4 批次表 | 新增 `\| 9 \| RLT_30 \| 新终端启用 relay-lite：角色层只见 stage-lead / watcher；完整模式 status 文本显示 stage-lead；两机 skill 副本同步 \| RLT-A-15/RLT-B-11 已确认 + D-start \|`；753 行「全计划共 **24** 张卡」→ **26** 张（再加 RLT_30；更正 RLT_27 加入时漏计） |
| B-06 | §8.1（886）、§8.3（897）、§9（903） | 「24 张卡」→「26 张卡」；§8.1「第 8 批 RLT_29 是本次唯一新增卡」类表述补 RLT_30 / 第 9 批；§9 销户清单含第 9 批 RLT_30；§6 ID 计数 159 不变（A131 改挂不增 ID） |
| B-05 | §6 对照表 | `HC-RL-A131 \| RLT_05` → `HC-RL-A131 \| RLT_30`；表尾注追加「A131 由 RLT-A-15 修订判据（11→12 角色），新版由 RLT_30 承接，RLT_05 的旧版本证据原样保留；RLT-A-15 其余只换措辞的条目 owner 不变，由 RLT_30 做措辞回归，**措辞行不重判、不重签**（含 H 人判行）」 |

## 2. RLT_30 卡片全文（拟）

```markdown
#### RLT_30

角色名统一：monitor → stage-lead / watcher（Issue #70）

<!-- dh:task-type:v1 task=RLT_30 type=normal -->
<!-- dh:review-policy:v1 task=RLT_30 mode=single-full-targeted max_attempts=2 -->

- **目标**：按已晋级 RLT-A-15 把 relay-light 现役面的角色名统一为 stage-lead / watcher：single-task `phase=monitor` → `phase=watcher`（九值闭集）；`roles.toml` 模板 `[monitor]` → `[stage-lead]`（沿用原档 codex sol medium）并新增 `[watcher]`（codex luna medium）；`dh-mapping.toml` 模板中的「监工」字样改 stage-lead；SKILL、两 adapter、AGENTS.md relay-light 两段、as-built single-task 快照现役合同行同步；`relay_log.py` 只改显示层（`status` 文本「当班写入者」与错误/告警措辞称 stage-lead 并带出账本值）。
- **非目标**：不改账本 `agent`/`by` 值、控制事件名、`status --json` 键与枚举、watch 通知格式；不改状态机与读写逻辑；不改 AGENTS.md 中 dh-relay Runner 体系段落；不改 `docs/relay/` 下用户已开计划的产物；design 与测试不断言 `[watcher]` 具体模型（模板暂写 codex luna medium，按月可换）；as-built 快照中 RLT_29 实跑的历史证据行（如 tab 名 monitor、monitor 零写）不改写，只加「当时 phase 名为 monitor，现 watcher」注；`RLT_05-实现快照.md` 等时点快照不改。
- **最小交付物**：上述现役文件与测试改动、as-built 同步、全量回归绿、合入后 ThinkPad 与 thinkbook 两机四份用户级 skill 副本同步并核哈希。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A131`（RLT-A-15 修订）｜`roles.toml` 可由 `tomllib` 加载，角色键与 §6.3 的 12 个角色（含 `stage-lead`、`watcher`）精确相等，每个角色有 `model` 与 `launch`。
  - **机器证**｜来源：design/01 + `HC-RL-A163`～`A165`、`A167`（RLT-A-15 措辞回归，owner 仍 RLT_29）｜SKILL/双 adapter/AGENTS relay-light 段中 single-task 观察者称 watcher、标头 phase 九值闭集含 `watcher` 不含 `monitor`；结构测试（`test_install_skill.py` 九值集合、零写入正则等）同步通过。
  - **机器证**｜来源：design/01 §10.3 + `HC-RL-A43`（样张随 RLT-A-15）、`A44`（原判据回归：固定显示别名仍属转述账本事实）｜`status` 文本与 §10.3 样张**逐字一致**：「当班写入者：stage-lead（DHR_90:C#1）」——括号内为 stage_id，status 文本不另带出 `monitor#<n>`（用户 2026-09-28）；`derive_last_writer` 仍返回账本原值 `monitor`。
  - **机器证**｜来源：design/01 RLT-A-15 声明 ⑤ + `HC-RL-A69`、`A85`、`A93`、`A119`（错误码不变、字面改）+ `A62`（JSON 键与枚举不变）｜错误/告警（含汇入 `status --json` `errors` 的字符串）遵守三条规矩（用户 2026-09-28「卡里写规矩，字面施工定」）：①主语写 stage-lead；②括号带出账本原值（`by=monitor` 或 `monitor#<n>`）；③错误码 HC-RL-Axx 与退出码不变。具体字面由 `task_plan` 定，复核按三条规矩逐条核；含事件名 `monitor_launch` 的报错不改。
  - **机器证**｜来源：design/01 RLT-A-15 活动声明（角色层统一）｜对 skill 五件（SKILL.md、两 adapter、`roles.toml`、`dh-mapping.toml`）与 AGENTS.md relay-light 两段跑 grep：①「监工」= 0；②`monitor` 按 promotion-check 同一正则删去冻结词后，剩余命中只允许落在 `task_plan` 预先登记的**内容锚定白名单行**（stage-lead 账本标识说明句、「监督 / 监控 / monitor」别名句、反引号内 `[monitor]` 旧名兼容句、AGENTS 中「原『监工 monitor』」更名说明句），其余 = 0；③`roles.toml` 无以 `[monitor]` 开头的段头。
  - **机器证**｜全量回归：`PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log test_install_skill`（`tools/relay-light/`）与 `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` 全绿；PR CI 三硬门 success。
  - **机器证**｜两机同步：合入后 ThinkPad `/home/nash/.claude/skills/relay-light`、`/home/nash/.codex/skills/relay-light` 与 thinkbook `C:\Users\nash\.claude\skills\relay-light`、`C:\Users\nash\.codex\skills\relay-light` 四份副本经 `install_skill.py --all` 同步（用户 2026-09-28 已授权），五文件与 master 源 LF 归一化哈希一致；thinkbook 不可达时如实挂起并报告。
- **变更范围**：skill 五件（SKILL / 双 adapter / roles.toml / dh-mapping.toml）；`relay_log.py` 仅显示层；两份测试；AGENTS.md 仅 relay-light 两段；as-built single-task 快照现役合同行；本卡工作区；合入后两机用户级副本（子段限定由复核按 diff 核，路径审计不可按段执行）。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_30 -->
  - `AGENTS.md`
  - `tools/relay-light/relay_log.py`
  - `tools/relay-light/test_relay_log.py`
  - `tools/relay-light/test_install_skill.py`
  - `tools/relay-light/skill/SKILL.md`
  - `tools/relay-light/skill/roles.toml`
  - `tools/relay-light/skill/dh-mapping.toml`
  - `tools/relay-light/skill/references/adapter-claude-code.md`
  - `tools/relay-light/skill/references/adapter-codex.md`
  - `docs/modules/relay-light/as-built/single-task-实现快照.md`
  - `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md`
  - `docs/modules/relay-light/workspace/RLT_30/**`
- **档位**：标准（非高危五类；含 `relay_log.py` 显示层代码改动，不按纯文档卡处理）。
- **任务类型**：常规 `normal`——代码轮 1、需求方向、教训三路 + 有效单测「改坏必红」（变异点建议：①`status` 文本渲染把 `by=monitor` 映射为 stage-lead 的那一行；②A85 写者报错字面退回 monitor 必须变红）。
- **依赖 / 批次**：RLT-A-15 已晋级；第 9 批，单验收单元，无跨卡依赖。
- **实施提示**：施工在 worktree `.dh-worktrees/RLT_A_15`、分支 `plan/RLT_A_15`（用户 2026-09-28 点选；该 worktree 只承载 RLT_30 一张卡，A-15/B-11 为规划事件；与 A-15/B-11 同一 PR #71 合入，避免设计已改名而 SKILL 仍旧名的窗口）；`workspace/RLT_30/progress.md` 首条记 worktree、branch、D-start 确认时点与首个施工提交 SHA。主会话直做（用户 2026-09-28 点选），复核派 fresh subagent；施工者不复核自己。两机用户级副本不在 git diff 内，不进允许路径，合入后按验收同步。
- **D-start 与 GitHub 授权**：GitHub 动作已由用户 2026-09-28 对本工作项全部授权（Issue / commit / push / PR / 服务端合并）；D-start 须用户对本卡单独确认。
- **停止边界**：若统一需改账本值、事件名、`status --json` 键或状态机 → 停下交用户；越出允许路径，或改动 AGENTS.md relay-light 两段以外内容、`relay_log.py` 显示层以外逻辑 → 停下由用户重新定类。
```

## 3. 待用户确认

B 整版（本稿 §1 改点 + §2 卡片）。确认后落盘 DevPlan；D-start 另行确认。
