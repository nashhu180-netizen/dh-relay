<!-- dh:v1 · B 调整候选 v6（已于 2026-09-10 确认并晋级）。事件 RLT-B-02。
     按用户 2026-09-09 明文要求移除过度设计，采用失败后全量重同步。 -->
# B 调整候选 v6 — RLT-B-02 承接仓内 skill 单源

- **目标文档**：[`dev_plan/P1-RelayLight-开发方案.md`](../P1-RelayLight-开发方案.md)
- **上游 A 事件**：`RLT-A-03`
- **状态**：**形成史**。2026-09-10 用户确认后已晋级正式开发方案。

## 1. 共用同步合同

- 唯一源：`tools/relay-light/skill/`；用户级 Claude/Codex 目录均为派生副本。
- 单份标准库安装器：Windows `python tools/relay-light/install_skill.py --all`；Linux `python3 tools/relay-light/install_skill.py --all`。
- `--all` 固定覆盖当前用户两个目录的全部五文件并校验哈希；生产模式不接受任意目标。
- 失败非零退出，可能留下不同步状态；禁止启动新计划，排除原因后整套重跑，直到退出 0 且两侧哈希一致。
- 每个目标只留可覆盖的当前 manifest：`source_head`、`source_dirty`、五文件哈希、目标、时间。无 ID、无历史、无 `plan_loaded` 绑定。
- 真实用户目录写入仍是高危组件接线：每张涉及真实同步的卡开工前展示解析后的两个目录并取得用户明确授权，收口前必须有 `verify(relay-light):`。

## 2. 新增 `RLT_20` — skill 首次安装

- **目标**：在 Windows 用 `--all` 把仓内完整五文件首次同步到 `%USERPROFILE%\.claude\skills\relay-light\` 与 `%USERPROFILE%\.codex\skills\relay-light\`。
- **验收**：只承接 `HC-RL-A32`——两目录五文件分别与仓内源哈希一致。
- **非目标**：不实现安装器、不写 skill 内容、不做跨机验证。
- **依赖**：`RLT_01`、`RLT_06`、`RLT_07`、`RLT_08`。
- **顺序**：第 1 批，RLT_12 的直接前置。
- **档位**：标准 · 高危（组件接线），`normal`；须用户开工确认与 `verify(relay-light):`。
- **允许边界**：上述两个 Windows 用户级目录与 `docs/modules/relay-light/workspace/RLT_20/**`。
- **证据**：命令、退出码、两个目标最终五文件哈希和两份当前 manifest。

## 3. `RLT_01` — 仓内单源与安装器

- 标题改为 `RLT_01 — 仓内 skill 单源与安装器`。
- 建 `tools/relay-light/skill/**` 骨架、`tools/relay-light/install_skill.py` 与 `tools/relay-light/test_install_skill.py`。
- 支持 `--all` 与可选 `--dry-run`；测试使用临时 home 覆盖，不写两个真实用户目录。
- 明确不做软链、历史 manifest、事务化、原子替换、回滚或中断恢复。
- 承接 `HC-RL-A124`：临时 home 中验证单向覆盖，并注入一次复制中途失败；再次执行 `--all` 后两侧五文件与源一致。
- 从允许路径删除真实用户级目录；保留仓内源、安装器、测试和本卡 workspace。
- 不依赖 RLT_07；RLT_07 仍可依赖 RLT_01，因此无环。

## 4. 内容生产卡只改仓内源

| 卡 | 调整 |
|---|---|
| `RLT_06` | 两个配置文件改写 `tools/relay-light/skill/`；A99 与 `plan_loaded` 原两键合同保持不变 |
| `RLT_07` | 核心、两个 adapter 与配置只写仓内五文件；A12 的正确落点改为仓内源 |
| `RLT_09` | 模板内容只改仓内源；不直接写用户目录 |
| `RLT_18` | 两个 adapter 只改仓内源，随后按第 6 节在两机重同步 |

## 5. 辅助卡调整

| 卡 | 调整 |
|---|---|
| `RLT_08` | 先按 A29 更新仓根双模块身份与 `verify(relay-light)` scope；RLT_20 依赖它 |
| `RLT_10` | 全量测试入口显式登记 `test_install_skill.py` |
| `RLT_12` | 依赖 RLT_20；直接使用已安装默认 Claude 副本，不重复同步 |
| `RLT_13` | fixture 从当前仓内五文件复制；核心和两个 adapter 保持一致，只允许配置/明确模板片段变化；另跑一次不带 `--config-dir` 的默认 Codex 副本，承接 H2 改口径 |

## 6. 后续真实同步点

| 卡 | 机器与动作 | 证据/验收 |
|---|---|---|
| `RLT_16` | Windows 实跑前执行一次 `python ... --all` | 命令、退出 0、两个目录最终哈希 |
| `RLT_19` | Windows 实跑前再次执行一次 `python ... --all` | 同上，确认包含 RLT_09 后续源变更 |
| `RLT_17` | Windows 与 ThinkPad 在同一 clean commit 各执行一次 `--all` | 承接 A125：四目录五文件哈希全等，四份当前 manifest 的 source_head/源哈希一致 |
| `RLT_18` | 直接依赖 RLT_17；最终 adapter 改完后，Windows 与 ThinkPad 各再执行一次 `--all` | 四目录最终哈希一致；这是 A125 的终局回归，不新增 owner |

上述四张卡和 RLT_20 均只允许安装器写当前机器固定的 Claude/Codex 目标。每卡开工前展示实际绝对路径并取得用户明确授权；保留高危出口闸，但不再要求 manifest ID、历史收据、事务过程或副本退场证明。

## 7. 验收与依赖总账

| 处 | 调整 |
|---|---|
| §1 承接设计 | `104 A + 15 H = 119` → `106 A + 15 H = 121` |
| §6 映射 | A32 → RLT_20；新增 A124 → RLT_01、A125 → RLT_17 |
| §7 卡数 | 19 → 20；RLT_20 放第 1 批，在 RLT_07/RLT_08 后、RLT_12 前 |
| §8.1 覆盖关 | 121 个唯一 ID，20 张卡 |
| §8.3 依赖关 | 新增 `RLT_01/06/07/08 → RLT_20 → RLT_12`、`RLT_17 → RLT_18`；RLT_01 不依赖 RLT_07 |
| §9 完工 | 同步改为 121 项总账；A124/A32 位于第 1 批，A125 位于第 4 批 |

## 8. §2.2 边界表替换

| 路径 | 边界 |
|---|---|
| `tools/relay-light/skill/` | 唯一源；RLT_06/07/09/18 只在此编辑五文件 |
| `tools/relay-light/install_skill.py` | 单向全量同步到当前用户两目标；无反向同步、软链或事务发布 |
| 两侧用户级 `relay-light/` | 派生副本；只允许相关卡在用户确认后调用安装器整套覆盖，不允许就地编辑 |

## 9. 明确不改

- RLT_01~RLT_19 的 ID 不变，仅新增 RLT_20。
- 五个批次的划分不变。
- RLT_02 不受影响。
- A1~A123（除 A32）、H1、H3~H15 的既有口径不变。
- dev-harness 不改；运行时配置优先级不改；不增加陈旧检测。

## 10. 落盘同步点

用户确认后同步修改正式设计的 §8.1、§6.2.1、A32、A124/A125、§14、§11 总数、H2；正式开发方案的 §1、§2.2、§6 映射、§7 批次、§8.1/§8.3、§9，以及 RLT_01/06/07/08/09/10/12/13/16/17/18/19/20 七类受影响卡。`plan_loaded` 不改。

## 11. 最终窄复审问题

1. 20 卡图是否无环，RLT_20 与后续同步点是否都有清楚 owner？
2. A32/A124/A125 是否唯一承接且足够验证“仓内单源 + 失败整套重跑”？
3. RLT_18 是否在 A125 后的最终源变更完成两机重同步，而不重复承接 A125？
4. 是否彻底移除了历史 manifest、ID、`plan_loaded` 绑定和事务化要求？
