<!-- dh:v1 · A 增补候选 v6（已于 2026-09-10 确认并晋级）。事件 RLT-A-03，A-full 增补。
     v1~v5 的审核历史见前序复审 findings。本版按用户 2026-09-09 明文
     “不用这么严谨，不用过度设计，不行就全部重新同步下就好”主动降复杂度。
     落盘前仍须：窄复审 → 讲解 → 理解问题 → 用户确认。 -->
# A 增补候选 v6 — 仓内 skill 单源 + 两侧全量同步

- **目标文档**：[`design/01-RelayLight-产品设计与验收.md`](../01-RelayLight-产品设计与验收.md)
- **事件 ID**：`RLT-A-03`（`RLT-A-02` 已被既有“运行中改计划”增补占用）
- **状态**：**形成史**。2026-09-10 用户确认后已晋级正式设计。

## 0. 一句话

skill 五文件只在 `tools/relay-light/skill/` 编辑；安装时用一条命令把五文件**全量覆盖**到当前机器 Claude 与 Codex 两个用户级目录。失败就修正原因后重新执行整套同步，不为首版设计发布事务、历史收据或中断恢复协议。

## 1. 设计改动

### 1.1 唯一源与运行时边界

- 唯一源：`tools/relay-light/skill/`，包含 `SKILL.md`、两个 adapter、`roles.toml`、`dh-mapping.toml`。
- 派生副本：`~/.claude/skills/relay-light/` 与 `~/.codex/skills/relay-light/`。不得就地编辑，不反向同步，不使用软链。
- 运行时加载不变：`--config-dir` 优先，否则读取当前 CLI 的用户级 skill 目录；运行时不读仓内源，也不检测副本是否陈旧。
- 仓内源更新不等于用户级副本已更新；需要运行新版本时重新执行全量同步。

### 1.2 单份安装器

新增标准库 Python 安装器 `tools/relay-light/install_skill.py`：

- Windows：`python tools/relay-light/install_skill.py --all`
- Linux：`python3 tools/relay-light/install_skill.py --all`
- `--all` 从当前用户 home 派生固定的 Claude/Codex 目标，不接受任意生产目标。
- 每次都覆盖两个目标的全部五文件；成功后逐文件校验两侧与仓内源哈希一致。
- 任一步失败即非零退出。首版**不承诺原子、回滚或中断恢复**；失败后两个目录可能处于不同步状态。此时不得启动新的 relay-light 计划，排除失败原因后重新执行 `--all`，直到退出 0 且两侧五文件哈希都一致。
- 测试通过临时 home 覆盖隔离目标，不写真实用户目录。

### 1.3 简单当前 manifest

每个目标成功同步后写一份可解析的**当前 manifest**，下次成功同步直接覆盖。只记录：

- `source_head`
- `source_dirty`
- 五文件相对路径与哈希
- `installed_to`
- `installed_at`

manifest 只回答“当前副本来自什么版本”，不提供历史追溯。不增加 `manifest_id`，不追加历史，不与 `plan_loaded` 绑定。跨机正式证据要求 `source_dirty=false`。

## 2. 验收口径变化

| ID | 新口径 | 唯一承接卡 |
|---|---|---|
| `HC-RL-A32` | 当前机器两个用户级目录的五文件分别与仓内源逐字节一致 | `RLT_20` |
| `HC-RL-A124` | 仓内目录是唯一可编辑源；安装器只有仓内源→两侧副本的单向全量同步。临时 home 中注入一次五文件复制中途失败，随后再次执行 `--all`，最终两侧五文件与仓内源一致 | `RLT_01` |
| `HC-RL-A125` | Windows 与 ThinkPad 在同一 clean commit 各执行一次 `--all`，四个用户级目录的五文件哈希全等；四份当前 manifest 的 `source_head` 与五文件源哈希一致 | `RLT_17` |

活动验收总账由 `104 A + 15 H = 119` 改为 `106 A + 15 H = 121`。A124/A125 是续号；A32 从 RLT_01 改挂 RLT_20。

`HC-RL-H2` 增加一次 Windows Codex **不带 `--config-dir`** 的默认安装副本实跑。`HC-RL-H7` 仍可使用 fixture，但 fixture 从当时仓内五文件复制，核心与两个 adapter 不变，只允许配置及明确模板片段有差异。

## 3. 卡片影响

| 卡 | 调整 |
|---|---|
| `RLT_01` | 建仓内源骨架、简单安装器与临时 home 测试；不写真实用户目录；承接 A124 |
| `RLT_06` | `roles.toml` / `dh-mapping.toml` 改写仓内源；A99 与 `plan_loaded` 两键合同不变 |
| `RLT_07` | 五文件内容只写仓内源 |
| `RLT_08` | 先落实 relay-light 模块身份与 `verify(relay-light)` scope；RLT_20 依赖它 |
| `RLT_09` | 模板只改仓内源 |
| `RLT_10` | 全量测试入口登记安装器测试 |
| `RLT_12` | 依赖 RLT_20，使用已安装默认副本 |
| `RLT_13` | fixture 验证之外增加一次默认 Codex 副本实跑 |
| `RLT_16` / `RLT_19` | Windows 实跑前各执行一次 `--all`，记录命令、退出码和两目标最终哈希 |
| `RLT_17` | Windows 与 ThinkPad 各执行一次 `--all`，承接 A125 |
| `RLT_18` | 最终 adapter 改完后，两台机器各再执行一次 `--all`，回归四目标最终哈希；直接依赖 RLT_17，但不重复承接 A125 |
| `RLT_20` | 新增首次真实安装卡，承接 A32；依赖 RLT_01/06/07/08，位于 RLT_12 之前 |

卡总数 `19 → 20`，新增边为 `RLT_01/06/07/08 → RLT_20 → RLT_12` 与 `RLT_17 → RLT_18`；RLT_01 不依赖 RLT_07，无完成闭环。

## 4. 明确删除 v4/v5 的过度设计

- 不要 manifest ID、追加历史或 `plan_loaded.skill_manifest`。
- 不要 staging/事务标记、回滚目录、原子切换或中断恢复合同。
- 不要逐次收据目录和跨卡收据 ID 矩阵；机器证只保留命令、退出码、最终哈希与当前 manifest。

仍保留必要安全边界：任何真实用户目录写入都属于高危组件接线，逐卡开工前展示解析后的两个目标并取得用户明确授权，收口前必须有 `verify(relay-light):`；凭据值不得入工件。

## 5. 已裁决项

| 编号 | 裁决 |
|---|---|
| D-1 | 单份 Python 安装器 |
| D-2 | A125 计入正式验收，总账 121，RLT_17 唯一承接 |
| D-3 | 运行时不检测陈旧；只保留可覆盖的当前 manifest |
| D-4 | 新增 RLT_20，卡数 20 |
| D-5 | H2 至少一次不带 `--config-dir` 的默认安装副本实跑 |
| D-6 | 首版不做事务化；失败后整套重新同步 |

## 6. 最终窄复审问题

1. 简化后是否仍守住唯一源，以及 A32/A124/A125 的可验证性？
2. “失败可能留下不同步状态，禁止开新计划，修好后整套重跑”的表述是否诚实且足够？
3. 20 卡依赖是否无环，RLT_18 是否覆盖 A125 之后的最终源变更？
4. 是否还残留 manifest 历史、ID、`plan_loaded` 绑定或发布事务的隐性要求？
