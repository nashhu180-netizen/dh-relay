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
