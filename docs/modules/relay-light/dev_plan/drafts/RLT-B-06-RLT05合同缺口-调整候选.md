<!-- dh:v1 · B-adjust 候选 v5（已于 2026-09-11 确认并晋级）。事件 RLT-B-06。
     本文件仅作形成史；正式施工输入为 DevPlan 与 RLT_05 workspace。 -->
# RLT-B-06 调整候选 v5 — RLT_05 / RLT_07 验收 owner 对齐

- **目标文档**：[`dev_plan/P1-RelayLight-开发方案.md`](../P1-RelayLight-开发方案.md)
- **事件 ID**：`RLT-B-06`（当前活动事件已是 `RLT-B-06`）
- **状态**：**形成史**。2026-09-11 v5 窄核 `APPROVE`、讲解与理解校验完成，用户回复“后者，继续”后已晋级正式 DevPlan/workspace。
- **输入边界**：正式 B-adjust 只读取 `design/README.md` 的 `designInputs[]`；当前唯一正式输入的活动事件是 RLT-A-06。审核、理解与确认见 `design/evidence/07-交叉审核记录-RLT05合同缺口候选.md#understanding-rlt-b06`。B06 晋级与独立 D-start 分闸，形成史本身不作为施工输入。

## 0. 调整目标

在不改变任务集合、状态、依赖、批次、档位、task_type、allowed-paths 或首 demo 链的前提下，把 RLT-A-06 的原子验收交给能完整实现、证明和签署的卡：RLT_05 负责 relay-log、两份 TOML 与合成 plan 行为；RLT_07 负责 skill 文档与五阶段模板。

## 1. RLT_05 卡拟调整

当前 25 条机器验收作以下净变化：

| 动作 | ID | 卡内口径 |
|---|---|---|
| 移出 | `HC-RL-A117` | 转 RLT_07；本卡保留 A116 的运行时 recipe/reviewer 一致性 |
| 删除退役号 | `HC-RL-A91` | 由 A131（本卡）+ A132（RLT_07）承接 |
| 删除退役号 | `HC-RL-A108` | 由 A133（RLT_07）+ A134（本卡）承接 |
| 新增 | `HC-RL-A131` | roles.toml 角色键与正式 design §6.3 的 11 个角色精确相等，且每个角色的 model/launch 可加载 |
| 新增 | `HC-RL-A134` | 无 checker 的合法合成 plan 仍过 lint/status |
| 新增 | `HC-RL-A135` | 三 CLI 均接 `--config-dir`；显式值展开 `~` 并把规范化绝对路径百分号编码后记入账本；直接调用走五情形 resolver |
| 更新措辞 | `HC-RL-A99` | 保持 2→3 X 规划原命题，只把配置来源改称 §6.2.1 默认目录 |
| 更新描述 | `HC-RL-A97` | X 超限 lint 精确报 A97，strategist 人闸语义不变 |

净结果：RLT_05 机器验收仍为 **25 条**。目标只随 owner 做措辞对齐：改为“按 marker `recipe=` 机械校验每个 R 实例的 reviewer 集合（Recipe 来源规则由 RLT_07 的 skill 承载）”；非目标、两组结构、五条 allowed-paths、标准档与 heavy Recipe 不变。实施提示改为正式 adapter 显式传各自默认副本；直接调用显式优先、单侧自动、双侧或零侧 fail closed。

RLT_05 在建 workspace 若获 B06 正式落盘授权，须同批同步六个文件，且**只解除合同缺口，不解除开工闸**：

1. `brief.md`：替换 25 条 owner 闭集及所有“H1～H4 未确认”描述；明文改为“A06/B06 合同已闭合，当前 `blocked-by-D-start-authorization`”。
2. `task_plan.md`：同步 H1～H4 表、全文配置/resolver 五情形、Batch 标题与行内 ID、25/25、交接文案及收尾 blocker；冻结 A131→Batch 1、A135→Batch 1、A134→Batch 2，A99 保持 Batch 4 且只复算。将原 H1～H4 前置门全部替换为 `blocked-by-D-start-authorization`。
3. `execution_strategy.md`：把 H1～H4 确认门改为已闭合事实，并将执行链首冻结为“B06 落盘 → 用户另行 D-start 授权 → Batch 1”。
4. `review.md`：替换 25 条元数据、A99/A97 描述、新 ID 的 Batch 列，并把提交区 blocker 明确改为 `blocked-by-D-start-authorization`；Batch 归属与上条相同，不得写入任何 review 已执行结论。
5. `findings.md`：把 H1～H4 与 `open-as-H*`/裁决登记改为正式闭合，open 数归零；新 blocker 为 `blocked-by-D-start-authorization`。
6. `progress.md`：不改写历史行；追加“B-adjust 机械同步、非 D-start、无测试/review 证据”与基线更正行，Batch 1 状态记为 `blocked-by-D-start-authorization`。

同步后六文件的活动合同中，`A91|A108|HC-RL-H2\b|A117`（作为 RLT_05 owner）以及 `blocked-by-user-confirmed-contract-adjustment`/`blocked-by-H1-H4` 必须零命中；形成史与追加日志中的旧文本允许保留，但必须有后续更正行。`task_plan.md`/`findings.md` 的错误 SHA 改为 **A06 与 B06 落盘后所在的 master 40 位提交**；`progress.md` 旧行不改，只追加更正。不得写成 Batch 1 已开工或已有测试/review 证据。

## 2. RLT_07 卡拟调整

新增四条机器验收：

| ID | 卡内口径 |
|---|---|
| `HC-RL-A117` | SKILL.md 规定 Recipe 只来自任务卡 task_type，缺失时停下问用户 |
| `HC-RL-A132` | skill/adapter/模板/流程不硬编码模型名，只引用角色名 |
| `HC-RL-A133` | 五阶段模板 C 节点默认包含 checker，且与 A95 的 trigger/close 合同一致 |
| `HC-RL-A136` | 两份 adapter 的 add/status/lint 全部命令模板均显式传本侧默认安装副本的 `~/... --config-dir`，由 A135 展开 |

RLT_07 机器验收由 16 条变为 **20 条**。A95 仍负责场景一四角色的完整结构；A133 只负责 checker 的模板默认存在，二者不互相替代。非目标、三条 allowed-paths、依赖、标准档与 heavy Recipe 不变。

RLT_07 目标仅随 owner 补一句：skill 承载“Recipe 唯一来自任务卡 task_type、字段缺失即问用户”的规划规则；其余目标不变。

## 3. RLT_12 / RLT_13 / RLT_17 与 H2→H18 联动

- RLT_12 的 Claude 首跑实施提示改为：Claude adapter 显式传 `~/.claude/skills/relay-light/`，由 A135 展开并编码记录，证明使用默认安装副本而非 fixture。
- RLT_13 删除退役 `HC-RL-H2`，新增 `HC-RL-H18`：Codex adapter 显式传 `~/.codex/skills/relay-light/` 跑同一计划，由 A135 展开并编码记录；展示完整计划/账本/status/产出、默认副本哈希、adapter 命令与账本 `config_dir=` 解码路径；用户仍判断换主控是否只靠 adapter 跑通。RLT_13 实施提示同步删除“不带 --config-dir”，改为显式传 Codex 默认副本以承接 H18。
- RLT_17 的 Linux H3/H4 卡面与实施提示同步：Claude/Codex adapter 各显式传本侧默认副本，展示 adapter 命令、账本 `config_dir=` 解码路径与默认副本哈希；H3 另展示 `python3 -m unittest` 退出码。
- 任务状态、依赖、批次、allowed-paths 与首 demo 链不变；这里只改变配置定位验收语义与实施提示。

## 4. DevPlan 全局联动

RLT-A-06 已正式晋级。RLT-B-06 若经用户单独确认，正式落盘必须原子同步：

1. DevPlan 文件头活动 planning-event 改为 RLT-B-06，RLT-B-05 转历史索引，并回链本专题 evidence 的 B-review/understanding 锚点；DevPlan 顶部“design/01 的 RLT-A-05”改为 RLT-A-06。同批对 `design/01` 顶部“DevPlan 仍是 RLT-B-05，待 RLT-B-06”只做追踪性更新为“DevPlan 活动事件已是 RLT-B-06”，不改产品语义或验收 ID。
2. §0 调整史与顶部现状登记 H1～H4 合同补齐；RLT_05 仍为未开始，不能把 B-adjust 写成 D-start。
3. §1 承接总账由 `107 A + 15 H = 122` 改为 `111 A + 15 H = 126`；§1 的运行时落点约束同步改为“adapter 显式传本侧用户级副本；直接调用按 design §6.2.1 五情形；不直接读仓内源”。
4. RLT_05/RLT_07/RLT_12/RLT_13/RLT_17 五张卡按 §1～§3 精确同步；目标只随 owner 做措辞对齐。
5. §6 owner 表删除 A91/A108/H2；A117 owner 改为 RLT_07；新增 A131→RLT_05、A132→RLT_07、A133→RLT_07、A134→RLT_05、A135→RLT_05、A136→RLT_07、H18→RLT_13；§6 表尾脚注同步 111+15。
6. §7.1“配置定位已澄清”行追加 RLT-A-06 H3 的 adapter 显式路径与直接调用五情形。
7. §8.1 覆盖关更新为 126 条活动验收恰好一次；§8.2 颗粒度关补记配置/模板分域；§8.3 依赖关保持无变化。
8. §9 总账与前四批机器验收数机械更新：全局机器项 `107→111`，前四批机器验收 `104→108`，总账 `122→126`；闭集脚本扫描全文所有旧计数字面值，不只信算术。
9. 全文活动引用不得残留 A91/A108/H2；退役历史引用可保留但必须明确标注 retired。

## 5. 三关自查

- **覆盖**：活动 A 集合 `-2 +6 = +4`；A117 只换 owner；人验 `-H2 +H18` 净值为 0。七个新增活动 ID（A131～A136、H18）各恰有一个 owner，三个退役号无活动 owner。
- **颗粒度**：RLT_05 只签 Python/TOML 与合成 plan 行为；RLT_07 只签 skill 文本、adapter 与正式模板。A116/A117、A131/A132、A133/A134 均不跨卡半签；A99/A135 同在 RLT_05 且显式优先不重复计证；A135（RLT_05 relay-log）与 A136（RLT_07 adapter）分域不半签。
- **依赖**：RLT_03→RLT_05→RLT_07 方向不变；无新增边、无环、首 demo 串行链和五批顺序不变。

## 6. AI 可证明

1. A06 晋级后的正式 design 活动 ID 集合与 DevPlan owner 集合相等，且每个 ID 正好一次；A91/A108/H2 无活动 owner。
2. RLT_05 恰 25 条、RLT_07 恰 20 条；A117/A131～A136/H18 的卡内描述与 owner 表一致。
3. 任务数量、状态、依赖、批次、档位、task_type、allowed-paths diff 均为空。
4. §1、§6、§8、§9 的 111/15/126 与前四批 108 由闭集枚举重算一致。
5. RLT_05 workspace 同步只更新合同与 blocker 状态，不出现代码、测试、review 或施工已执行的假证据。

## 7. 正式 B-review、讲解与确认顺序

fresh Opus 已基于 RLT-A-06 的正式 designInputs[] 快照完成正式 B-review，报告在 evidence/07 `#review-rlt-b06`，结论 `REVISE`（P2=2）。本 v5 吸收整改后须经原 reviewer 窄核；通过后由主控完成 B 讲解与至少一个理解问题，记录 `#understanding-rlt-b06`，再单独请求用户确认 B06。

## 8. Fresh review 聚焦

1. v5 是否已把所有 H1～H4 解除后的工作区状态替换为独立 `blocked-by-D-start-authorization`，且没有伪造施工/测试/review 证据？
2. RLT_05 25 条、RLT_07 20 条与全局 126/前四批 108 是否闭集复算正确？
3. A116/A117、A131/A132、A133/A134、A99/A135、A135/A136、H2/H18 是否各自成为同卡实现/证明/签署单元？
4. 是否误改任务状态、依赖、批次、档位、task_type、allowed-paths 或首 demo 链？
5. RLT_05 workspace 的行级同步闭集、A131/A135→Batch 1、A134→Batch 2、A99→Batch 4 是否已冻结；RLT_17 与两处活动声明是否已纳入？
