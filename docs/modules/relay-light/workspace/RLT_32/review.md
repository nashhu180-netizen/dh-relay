# RLT_32 独立复核

- Issue：#153；复核日期：2026-10-07。
- 执行者：独立只读 reviewer（与施工会话分离）。
- Recipe：`light`；本报告分别记录 `consistency_review` 与 `lessons`。
- 候选 SHA：`7d89f0606b88b0a537af14258cdccd03a6ca8ce2`。
- 比较基线：`origin/master=039f54d6bcd8e9070fcd1608bcf8950b978e8945`。
- 被审内容：候选相对基线的四个 skill 文件及本卡 task.md；取证时 `HEAD` 为候选 SHA，`git diff --name-only` 为空。报告新增自身不属于被审产品差异。
- 写入边界：只新增本报告；未改产品、测试或任务记录，未 commit、派活、启动 Herdr 角色或执行模型推理。

## consistency_review — PASS

P0=0，P1=0，P2=0，P3=0；无阻断或遗留问题。

| 检查项 | 独立事实与证据 | 结论 |
|---|---|---|
| 用户要求与五角色配置 | `roles.toml` 经 Python 3 `tomllib` 解析；分别以 `shlex` 核对 launch 的 `-m`、`-c model_reasoning_effort=` 与 model 描述。watcher=`gpt-6-luna/medium`；coder、batch-reviewer、reviewer=`gpt-6.1-sol/high`；decider=`gpt-6-astra/medium`，五项均一致。 | PASS |
| 核心表与两侧 adapter | 核心 `SKILL.md:361` 的默认表与 `adapter-codex.md:176`、`adapter-claude-code.md:174` 的默认引用逐项一致；均把用户原写 `gpt-6.1-sol-high` 拆为模型与 effort 两字段。 | PASS |
| 未点名角色 | 对基线与候选 TOML 做逐字段比较：planner、orchestrator、stage-lead、builder、plan-reviewer、scribe、checker、strategist 全部相等；唯一新增段为用户点名的 batch-reviewer。 | PASS |
| 确认闸及在途分配 | 四文件明确新默认仅作提案、不覆盖在途明确确认；核心 `SKILL.md:372` 与两 adapter 原有启动确认、恢复换档确认、`execution_strategy.md` 写者/来源合同保留。未修改任何在途卡配置。 | PASS |
| 安装模板兼容 | `install_skill.py:24` 的封闭复制集合包含 roles.toml、核心文档与两个 adapter，引用的安装后文件实际均在包内；本次未改安装器。`test_install_skill.py:326` 所要求的完整模式定位原句保留，roles.toml 用单卡参考说明区分运行时来源，未引入 `single-task` 字样触发该结构检查。 | PASS |
| 差异卫生 | `git diff --check origin/master` 返回 0；差异仅涉及已允许 skill 配置/说明与任务登记，无业务实现或测试更改。 | PASS |

施工侧另已报告五角色真实 CLI `--version` 参数解析通过、19 项安装回归全部通过；本 reviewer 独立完成上述静态/TOML核对，未重跑安装器、未修改用户 skill 安装副本。CLI 参数解析证明启动参数可解析，不证明模型服务接受请求或实际推理；这两项均在本卡停止边界之外，不作为本报告 PASS 的事实前提。

## lessons — PASS（lessons-absent，适用检查 N/A）

P0=0，P1=0，P2=0，P3=0。

可核查依据：目标模块为 `relay-light`；独立执行 `Path('docs/modules/relay-light/knowledge').exists()` 返回 False，`git ls-files docs/modules/relay-light/knowledge` 返回空列表。因此当前候选没有可供逐条适用性检查的模块 knowledge 教训库；本路记录 `lessons-absent` / N/A，不制造教训条目或要求 Pair/Binding。未把历史 workspace 的 lesson_candidates 当作正式模块教训库，未读取或修改其它卡的候选记录。

仍按本卡直接合同检查了容易产生回退的边界：安装包自包含、两侧适配同源、默认不代替明确确认、在途分配不迁移、未点名角色不改变，均由本报告 consistency_review 的现行代码/文档证据覆盖。

## 候选文件指纹（SHA-256）

| 文件 | SHA-256 |
|---|---|
| `tools/relay-light/skill/roles.toml` | `9175dbfa6e30d5d251fceddef6dbcd3fd91a5239b952c789a848222d99f8f421` |
| `tools/relay-light/skill/SKILL.md` | `e7ed4582b1bc095721fe3c2930f3bf11d4a9a713409d1761bb8bce8fb64dd0c6` |
| `tools/relay-light/skill/references/adapter-codex.md` | `ee29d8569cb03b8a25891ea38ddaff258ee3b65df8acd7bfadab225a04c89941` |
| `tools/relay-light/skill/references/adapter-claude-code.md` | `cdbc90ea9d6ff00596329ecc8e68afa7ef7f62d81c4dbe46a89ac24addc26565` |

两路复核已完成。结论只针对上述候选及本卡范围，不替代尚在运行的 GitHub 必需 CI、PR 实际合入或合入后的安装副本同步与复验。

## 历史后续：CI 发现闭集冲突与同路径定向复查

- 日期：2026-10-07；定向复查执行者：原独立 reviewer。
- 首候选保留：`7d89f0606b88b0a537af14258cdccd03a6ca8ce2`；修正候选：`7c67f92a8afa474c72f2df9095962788c47e9e37`。
- 范围：复查完整模式角色闭集、single-task batch-reviewer 默认映射、四文件同源、允许路径及原有确认/在途边界；仅追加本节，不覆盖首审原文或将历史失败改写成绿色。

### 历史发现 RLT32-C-001（P1，修正候选已闭合）

远端全量 Python CI run `37592138630` 对首候选报告 319 tests / 1 failure，失败位置为 `tools/relay-light/test_relay_log.py:2478` 的 `test_shipped_roles_toml_has_the_twelve_design_roles`。该既有合同要求模板段名恰为 12 个设计角色；首候选新增 `[batch-reviewer]`，使段名集合变成 13 个，破坏模板闭集并阻断必需 CI。

上述远端计数与 run 由编排提供，本 reviewer 没有重新读取远端运行。独立读取当前未改动的测试，确认其精确集合断言和每角色仅含非空字符串 model/launch 的字段断言；另与首候选 diff 对照，确认新增段直接违反该断言。首审只核了安装回归与配置一致性，漏查这一已有模板消费者合同，因此首审 consistency_review 的 PASS 不足以支持首候选放行；就本项补充事实，首候选应为 FAIL。该遗漏由本 reviewer 承认并在本次定向复查补齐。

### 修正候选 consistency_review — PASS

当前 open P0=0、P1=0、P2=0、P3=0；历史 RLT32-C-001=P1 closed，不从历史中删除。

| 定向检查项 | 独立事实与证据 | 结论 |
|---|---|---|
| 12 角色闭集与字段 | Python 3 解析修正候选 roles.toml，段名集合精确等于测试中的 planner/orchestrator/stage-lead/watcher/builder/plan-reviewer/coder/scribe/checker/decider/reviewer/strategist；每段恰含 model、launch 两个非空字符串字段。新增 batch-reviewer 段已移除。 | PASS |
| batch-reviewer 同源默认 | roles.toml 顶部明确单卡 batch-reviewer 沿用 `[coder]` 的模型、effort 与启动参数，且只读约束靠 prompt；核心 `SKILL.md:370` 同样明确三项继承与只读约束，两 adapter 默认段均显式映射至 `[coder]` 并声明不新增完整模式角色。核心默认表仍为 coder/batch-reviewer=`gpt-6.1-sol/high`。 | PASS |
| 用户四组默认及未点名角色 | 对四个真实模板角色独立核对 model/launch 中的模型与 effort；watcher=`gpt-6-luna/medium`、coder/reviewer=`gpt-6.1-sol/high`、decider=`gpt-6-astra/medium`；batch-reviewer 由 coder 同源映射满足用户要求。其余 8 角色与原基线逐字段相等。 | PASS |
| 确认闸与在途边界 | 将核心和两 adapter 的现有启动确认、确认后登记、恢复换角色/模型/effort 确认段落与首候选逐行比对，全部未改；新默认不覆盖在途确认、执行来源仍为本卡 execution_strategy.md。 | PASS |
| scope 与安装兼容 | 基线至修正候选的文件集合仅为 task.md、review.md 及四个允许 skill 文件；无安装器、测试或在途配置变化。安装器原复制集合仍包含四文件；完整模式模板定位及两 adapter 的既有原句保留。`git diff --check <基线>..<修正候选>` 返回 0。 | PASS |

编排另报告修正候选的角色闭集测试 1/1、安装回归 19/19 通过。该既有测试回归不是本 reviewer 重新执行的结果；本 reviewer 独立以只读解析与精确集合/字段断言核实了修正结果。取证时 HEAD 为修正候选、工作树干净；追加本报告后仅本报告产生工作差异。

### 修正候选 lessons — PASS（lessons-absent / N/A）

独立复查 `docs/modules/relay-light/knowledge` 仍不存在；目标模块的教训适用性 N/A 依据不变。历史 CI 失败与首审遗漏保留在本节，不将其追加为正式 knowledge 或其它角色专属 lesson_candidates；本次仅做已派定向复查。当前两路结论适用修正候选，不宣称首候选 CI 成功或远端全量 CI 已闭合。

### 修正候选四文件指纹（SHA-256）

| 文件 | SHA-256 |
|---|---|
| `tools/relay-light/skill/roles.toml` | `25ef060afec19ca5a0fab290fda62c71168556e6abcf0482c868b772154693f4` |
| `tools/relay-light/skill/SKILL.md` | `8eac9d6e10c8d4022db3db4f16eb887448ef5697309bf59d9b9aefd1a4b1cd22` |
| `tools/relay-light/skill/references/adapter-codex.md` | `5a2ed449b36342b874a297af12be371723ded58988cf50e883e05f7302646b0b` |
| `tools/relay-light/skill/references/adapter-claude-code.md` | `f3298989469efc7a3986051f4085b14e5bc31a67e4d80638eab46ac9cf83c0ef` |

本次定向复查完成；继续保留必需 CI、PR 实际合入、合入态复验及安装副本同步的独立出口闸。
