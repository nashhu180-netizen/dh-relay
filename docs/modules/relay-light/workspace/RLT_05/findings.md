<!-- dh:v1 -->
# findings — RLT_05

> 报告只提供事实/建议；以下状态来自 2026-09-11 主控 A–K 裁决，不是 reviewer/decider 自动生效。独立报告保持原样：`reviews/task-plan-review-opus.md`、`reviews/task-plan-decisions-fable.md`。

## 正式合同缺口：RLT-A-06 / RLT-B-06 已闭合

| ID | 对应报告项 | 缺口 | 建议正式调整 | 状态 |
|---|---|---|---|---|
| H1 | Opus P1-2/P2-1；Fable F-002 | A117 oracle 明指 `SKILL.md`，对象归 RLT_07 且不在本卡 allowed-paths | RLT-B-06 已将 A117 转 RLT_07；本卡保留 A116 | resolved |
| H2 | Opus P2-1；Fable D4 | A91/A108 各是跨 RLT_05 与 RLT_07 的复合验收，不能跨卡半句签署 | RLT-A-06 退役 A91/A108、续发 A131～A134；B06 已分账 | resolved |
| H3 | Opus P1-3/P1-5；Fable F-001/D2/D3 | §6.2.1 未定义程序如何识别主控 CLI 默认目录；§3.1 又漏三签名 flag | RLT-A-06 已冻结三 CLI flag、五情形 resolver、规范化绝对路径与百分号编码；A135 归本卡 | resolved |
| H4 | Opus P2-3；Fable D5 | §11 A97 要求 X 超限 lint，但 §3.5 lint 映射表漏行 | RLT-A-06 已补 A97 映射行，沿用现有 ID | resolved |

**四项均已由正式 A06/B06 合同闭合。B06 落盘曾单独停在 `blocked-by-D-start-authorization`；用户随后明文“后者，继续”，当前只授权 Batch 1 施工。**

## Opus findings 主控裁决登记

| 报告编号 | 主控裁决 | 落实位置/说明 |
|---|---|---|
| P1-1 | accepted | Batch 2 纳入 stage/result/last-writer 完整只读投影与 §10.3/result 五键；Batch 3 留 add 守门及联动 |
| P1-2 | accepted-via-Fable-D1 | A116 按每个活跃 R 实例、`role=reviewer`、名字取 agent 列；无 R/零 reviewer 不触发；结构 lint 优先；fixture 逐条登记 |
| P1-3 | resolved-by-RLT-A-06/B-06 | 三 CLI 共用 config，resolver/load_config 前移 Batch 1，禁止 config=None；五情形与编码合同已正式冻结 |
| P1-4 | accepted | Batch 3 增 A89 plan lint，必须报 A89，并补 stage_close 全节点 closed |
| P1-5 | resolved-by-RLT-A-06/B-06 | 默认目录识别已正式冻结为五情形 resolver |
| P1-6 | accepted | 手动派活，progress durable DONE 后立即停止，不等 node_closed |
| P2-1 | resolved-by-RLT-A-06/B-06 | 拒绝空集/合成 plan 对复合 ID 整条签署；A91/A108 已原子化分账 |
| P2-2 | accepted | A99 改用两次运行间 relay_log.py SHA-256 相同证明配置驱动 |
| P2-3 | resolved-by-RLT-A-06 | A97 映射已补；施工不得以 A109 假绿 |
| P2-4 | accepted | Batch 3 复制 orchestrator/monitor 完整写者集合 |
| P2-5 | accepted | Batch 3 明确允许并如实登记 late-added discriminator |
| P2-6 | accepted | review mutation 扩为 status-lifecycle 与 config-recipe 至少两域 |
| P2-7 | accepted-boundary-rejected-dependency | 登记跨卡守恒；主控驳回 Fable D6 的新增 RLT_01 依赖 |
| P3-1 | corrected | worktree 基点完整 SHA 为 `1bea79fe18271b3b0b45c8d5dc6cc8993bfbf57d`；A06/B06 是其上未提交 WIP，不冒充已在 master commit |
| P3-2 | accepted | DevPlan 定 owner/边界，design §11 定 oracle/证法，冲突停下记 findings |
| P3-3 | accepted | A115 的 design §6.2 静态核对落 Batch 1 小审 |

报告路径：`docs/modules/relay-light/workspace/RLT_05/reviews/task-plan-review-opus.md`。

## Fable 建议主控裁决登记

| 建议编号 | 主控裁决 | 说明 |
|---|---|---|
| F-001 / D2 | accepted | 三子命令各有可选 flag，显式 resolver/load_config 前移 Batch 1；不允许静默跳过配置 lint |
| F-002 | resolved-by-RLT-B-06 | A117 已转 RLT_07，本卡 25 条以 A131/A134/A135 替换旧 owner |
| F-003 | accepted | 用纯内部 X-round 规划等价接口，与 A97 共用配置上限；函数名仅建议，不生成文件/子命令 |
| D1 | accepted | per-active-R reviewer 集合、结构 lint 优先、旧 fixture 逐条对齐 |
| D3 | resolved-by-RLT-A-06/B-06 | 默认目录正式采用单侧自动、双侧/零侧 exit 3，并补显式路径展开/规范化/编码 |
| D4 | resolved-by-RLT-A-06/B-06 | 不采“复合 ID owner 不动、跨卡承接半句”；已原子化并分账 |
| D5 | resolved-by-RLT-A-06 | A97 正式 lint 映射已补行 |
| D6 | rejected | 不给 RLT_05 增加 RLT_01 依赖；依 DevPlan 当前批次/allowed-paths 与跨卡守恒执行 |

报告路径：`docs/modules/relay-light/workspace/RLT_05/reviews/task-plan-decisions-fable.md`。

## 已冻结、无需再问的施工边界

| ID | 结论 | 依据 |
|---|---|---|
| F-004 | Recipe 具体集合只取 design §6.3 / `dh-mapping.toml`；§6.2 只核未复述，落 Batch 1 小审 | 主控 F；design §6.2–§6.3 |
| F-005 | 止损节固定 `[limits]`、`[limits.on_exceed]`，键 `rework_max_rounds`；无 `[rework]` | DevPlan RLT_05；design §6.2–§6.3 |
| F-006 | A62 status result 的 amend/nodes 是只读投影，不等于实现 RLT_09 plan-amend | 主控 A；design §3.5 |
| F-007 | superseded 差分由 A73 独占；A62 只验 schema/排序/计数 | design §3.5 A62/A73 分工 |
| F-008 | RLT_05 先建两 TOML；RLT_01 后 rebase 并只补其余文件，不覆盖 TOML；RLT_07 等两卡 | 主控 I；DevPlan RLT_01/RLT_05/RLT_07 |

当前 open 的正式调整项数量：**0**。当前施工边界由独立 D-start 授权与逐 Batch 派单控制。

## Batch 1 施工事实登记（2026-09-11 · rlt05-build-deepseek）

> 只登记事实与解释，不改合同；证据见 `progress.md` E-004～E-013。

| ID | 事实 | 影响 |
|---|---|---|
| B1-F1 | task_plan Batch 1 写「plan 无 R 实例，或某 R 实例 reviewer 数为 0，均不触发 A116」，design §3.5 的 lint 映射行把「`recipe` 值非法」也归 A116，DevPlan 验收写「recipe 三值…严格匹配配置」 | 本批实现取：**集合相等检查**按 task_plan 豁免（无 R/零 reviewer 不查），而 **`recipe=` 值必须能在配置中查到**始终校验（无 R 实例的 `recipe=strict` 亦被拒，rc2/rc3 A116）。若主控认为豁免应覆盖取值校验，属设计/计划冲突，需裁决后由后续批次或整改处理 —— **结论文本保留，裁决见下行** |
| B1-F1-R1 | **resolved（2026-09-11 · rework round 1，闭合 E-015 · F-B1-RECIPE-ENUM）**：小审裁决为「P1 阻断：无 R/零 reviewer 的集合豁免可保留，但 `recipe` 合法值不能因替换配置新增档位而扩张」。整改后实现为：`RECIPE_TIERS = {heavy, normal, light}` 显式闭集，`_lint_recipe_reviewers` 先验 `plan.recipe in RECIPE_TIERS` 再查配置；替换配置新增 `[recipes.strict]` 时 `recipe=strict` 仍 rc2/rc3 `HC-RL-A116` 且账本不增，删除 `normal` 时 `recipe=normal` 同编号被拒。豁免范围仍严格限于「R 实例 reviewer 集合」 | 证据 E-017（红）/E-020（行为矩阵）。闭集取自 design §11 A116 与 DevPlan「recipe 三值」，非 reviewer 集合硬编码，不违反 task_plan「集合不写死进 Python」 |
| B1-F2 | 本批在 `append_event` 内对 `plan_loaded` **代填**缺失的 `config_dir=` 与 `plan=` token（调用方已写则原样保留） | task_plan Batch 4 的红断言「plan_loaded 缺两个键被接受」若指**写入后**的 note，则 Batch 1 之后该断言不再成立；Batch 4 需改为校验**调用方传入**的 note，或按「既有行为已正确」登记 late-added discriminator。Batch 1 自身只证明「账本内必含两键且可解码复算」—— **结论文本保留，裁决见下行** |
| B1-F2-R1 | **resolved（2026-09-11 · rework round 1，闭合 E-015 · F-B1-PLAN-LOADED-PROVENANCE）**：小审裁决为「P1 阻断：自动补齐可保留，但『调用方已写则原样保留』不满足实际来源真实性」。整改后实现为**无条件重建**：丢弃调用方全部 `config_dir=`/`plan=` token，按 resolver 实际目录与 `--plan` 规范绝对路径重新生成，其余 token 保序；伪造、重复、冲突三类输入均被覆盖，写入后各恰好一个 token（E-017 红 / E-021、E-022 绿）。**Batch 4 的判别器须以调用方输入为对象**：写入后的 note 现在恒含两键，不得再断言「缺键被接受」 | 证据 E-017/E-021/E-022。小审原话已在本行承接，Batch 4 计划文本未由施工者改写 |
| B1-F3 | `load_config` 读文件走 `Path.read_text`，不经 `builtins.open` | 保持 RLT_03 `test_add_reports_genuine_append_failure_as_exit_four` 的原语义（该 fixture 全量 patch `builtins.open`，只应命中账本写入） |
| B1-F4 | `plan=` 同样做百分号编码（design 只明文要求 `config_dir` 编码） | 理由：计划目录含空格时保持单一无空白 token；§10.2 样例路径无待编码字符，编码后与该样例逐字一致。属最小扩展，供复核对齐。**R1 更新**：`plan` 的取值现额外经 `_normalized_dir()` 规范化——`--plan .` 等相对路径也记录为规范绝对路径（E-022） |
| B1-F5 | 阶段键、档位名、角色名、模型名均未写死进 `relay_log.py`：`stages`/`recipes` 只做「非空表 + `dh_nodes`/`reviewers` 为非空字符串列表」结构校验，A115 的集合相等由测试对交付 TOML 断言，档位键由 marker `recipe=` 反查 | 满足 task_plan「reviewer/limits/角色集合不写死进 Python」；RLT_05 与 RLT_07 间无重复权威。**R1 精化**：写死的只有 design §11 A116 明文冻结的**档位名闭集** `RECIPE_TIERS = {heavy, normal, light}`（档位枚举，非 reviewer 集合、非 limits 值）；三档对应的 reviewer 集合仍只从 `dh-mapping.toml` 读取 |
| B1-F6 | 交付 `tools/relay-light/skill/{roles.toml,dh-mapping.toml}` 逐字取自 design §6.3；`roles.toml` 11 角色，`dh-mapping.toml` 含 stages/recipes/limits/on_exceed | 跨卡守恒：RLT_01 后开时只补 `SKILL.md`/adapter/安装器与测试，**不得覆盖或回退**这两份 TOML |
| B1-F7 | 本批未实现 status 投影/add 侧生命周期/X planner/模板/watch/plan-amend；`_status_command` 仍是 RLT_03 placeholder，仅接入配置与 A116 | Batch 2 仍须替换 placeholder；本批不构成 A43/A61/A62 的任何证据 |
| B1-F8 | worktree 内 `AGENTS.md`、`design/01`、`design/README.md`、`dev_plan/P1-…` 的 M 状态与 `design/drafts`、`design/evidence/07`、`dev_plan/drafts`、`workspace/RLT_05/**` 的未跟踪状态是 B06 落盘带入的既有 WIP，非本批改动 | 复核与收口按「仅 allowed-paths 被本批触碰」核对：本批只改 2 个 Python + 新建 2 个 TOML + 追加 workspace/RLT_05/progress.md、findings.md |

## Batch 1 fresh 小审 R1（2026-09-11 · rlt05-b1-check-sol）

| ID | 级别/状态 | 事实 | 收敛要求 |
|---|---|---|---|
| F-B1-RECIPE-ENUM | P1 · **resolved（2026-09-11 rework R1）** | `relay_log.py:147-150,552-565` 仅要求 marker recipe 存在于当前配置；替换配置新增 `[recipes.strict]` 后可把 `strict` 扩张为合法档位，现有测试只用 shipped 配置 | Batch 1 锁定 `heavy/normal/light` 三值闭集，并新增“配置含 strict + plan 用 strict”行为拒绝测试 |
| F-B1-PLAN-LOADED-PROVENANCE | P1 · **resolved（2026-09-11 rework R1）** | `relay_log.py:902-925` 对调用方已有 `config_dir=`/`plan=` 原样保留，可写入伪造、重复或冲突来源 token | Batch 1 拒绝冲突/重复 token，或以实际 resolver/plan 规范值覆盖；补拒绝时账本不增测试，并明确 Batch 4 判别对象 |
| F-A92-COVERAGE | P2 · **resolved（2026-09-11 rework R1）** | `test_relay_log.py:1317-1331` 未精确断言 W/C/R/X/F 完整 stage mapping | 建议随整改补完整映射精确等值断言；不单独阻断 Batch 2 |

小审报告：`reviews/batch1-review-sol.md`（E-015）。Batch 2 在两个 P1 闭合并复审通过前保持 blocked。

定向复审（E-024/E-025）结论：上述两项 P1 与一项 P2 均已闭合，open findings=0，Batch 1 小审最终 `APPROVE`。主控动态复验 E-026 为 focused 18/18、全文件 72/72；Batch 2 仍须独立授权，不因复审通过自动开放。

### 上述三条的整改证据与实现事实（施工者登记，裁决仍在主控）

| finding | 整改实现 | 判别证据 | 备注 |
|---|---|---|---|
| F-B1-RECIPE-ENUM | `relay_log.py` 新增 `RECIPE_TIERS = {heavy, normal, light}`；`_lint_recipe_reviewers` 先验 `plan.recipe in RECIPE_TIERS`（报 `HC-RL-A116`）再查配置档位 | 红 E-017（`AssertionError: 2 != 0`，扩展配置下 `recipe=strict` 未被拒）；绿 E-020：扩展配置下 `lint` rc2、`add`/`status` rc3 且账本不增；同配置下 `recipe=heavy` 仍 rc0；删除 `normal` 的配置下 `recipe=normal` 亦被拒 | 本轮采用「锁定 Recipe 键闭集」一支；写死的仅是 design §11 A116 明文冻结的档位名枚举，reviewer 集合仍只读 `dh-mapping.toml` |
| F-B1-PLAN-LOADED-PROVENANCE | `_plan_loaded_note()` 由「缺则补」改为**无条件重建**：丢弃调用方全部 `config_dir=`/`plan=` token，追加 `config_dir=<resolver 实际目录编码>` 与 `plan=<规范绝对路径编码>`，其余 token 保序 | 红 E-017（伪造 token 被原样保留、重复例实收两值、相对 `--plan .` 原样记录）；绿 E-021（伪造/重复/冲突/缺省四例写入后各恰好 1 个 token 且解码等于实际值、伪造值不出现）、E-022（相对路径被规范化为绝对路径） | 本轮采用**覆盖/重建**分支而非拒绝分支；因 add 恒 rc0，故以「恰好一行且值为真」证明，未使用「拒绝时账本不增」断言。Batch 4 的判别对象须是**调用方传入**的 note |
| F-A92-COVERAGE | `test_shipped_dh_mapping_carries_the_four_frozen_content_classes` 改为对 `mapping["stages"]` 精确等值断言（W/C/R/X/F 全键全值，含 R 的 `E0,E1,E2,E4,E5,E14,E6,E3` 顺序），并保留 E11–E13 不出现在任何阶段的显式断言 | E-023（断言通过；该断言为**覆盖补强**，实现前即绿，未冒充红） | 额外 R 节点、阶段缺失或顺序漂移现被直接拦下 |

本轮未改 `reviews/batch1-review-sol.md` 与本 `review.md`；小审原文与既有 E-ID 未回改。R1 待整改项：**0**。

## Batch 2 fresh 小审 R1（2026-09-11）

| ID | 级别/状态 | 事实 | 收敛要求 |
|---|---|---|---|
| F-B2-LAST-RESULT-SCHEMA | P1 · **resolved（2026-09-11 rework R1）** | design §3.5 冻结顶层 `last_stage_result={stage_id,outcome,note}`，但原实现/测试曾错误共用阶段五键 serializer | E-042 有效行为红；`_last_result_document()` 与 `_result_document()` 分离；E-043～E-045 绿与真实 CLI；E-047/E-048 定向复审 PASS、open=0 |

小审报告：`reviews/batch2-review-sol.md`（E-039）。E-037/E-038 的 reviewer 动态命令均因 `bwrap RTM_NEWADDR` 为 `NOT_RUN`；主控正常 worktree 的 12/84 绿仅作动态补充，不覆盖本 P1。

定向复审（E-047/E-048）结论：`F-B2-LAST-RESULT-SCHEMA` 已闭合，new P0/P1=0、open=0，Batch 2 小审最终 `APPROVE`；Batch 3 仍需独立授权。

## Batch 2 施工事实登记（2026-09-11 · rlt05-build-deepseek）

> 只登记事实与解释，不改合同；证据见 `progress.md` E-028～E-036。

| ID | 事实 | 影响 |
|---|---|---|
| B2-F1 | design §10.3 的样张**不是** §10.2 账本的直接产物：§10.2 只写到 seq 12 `stage_start DHR_90:C#1`，此时 C1 仍无 `node_start`（状态 `ready`）、也没有任何在场 agent；样张的 C1 是 `open` 且有 `coder#1` 最近 `checkpoint @ 10:31:12` | 本批 fixture 取「§10.2 前 12 行逐字 + 3 行最小续写（C1 `node_start` / `coder#1` `agent_launch` / `checkpoint@10:31:12`）」，并以 `now=10:43:52+08:00` 复核样张的「静默 00:12:40」。续写行数与被取 `ts` 已在测试常量与 fixture 明细中登记；§10.3 文本与 design 源行经 `==` 校验逐字节相等（E-032） |
| B2-F2 | design §10.1 的 plan 是**摘录**：C2/R1/F1 三行节点在 agent 表里没有任何 agent 行，直接喂 lint 会因 A75（空节点）与 A47（close 目标不存在）被拒 | §10.3 样张只能建立在「§10.1 逐字 + 补 6 行 agent」的 lint-clean 合成 plan 上：C2 补 coder/checker（`close=agent:checker`），R1 补 requirement/lesson/scribe（R1 为复核实例，reviewer 集合恰等于 normal 档），F1 补 scribe。补齐行逐行列在测试常量 `PLAN_10_1_AGENT_ROWS` 并标注「excerpt completion」，未改动 §10.1 的 5 行节点与 6 行 agent |
| B2-F3 | 「不可关原因」在 §10.3 只出现一条（`coder#1 无终态事件`），而按 §5.3 双判据，C1 的另一条（`close=agent:checker` 未 done）同样不成立 | 实现取「按 §5.3 的顺序报告，条件 1 有原因时不再列条件 2」，理由：该顺序与既有 `_validate_node_close` 的检查顺序一致（先 A17 后 A74），且能逐字复现样张。`closable` 本身仍由**两条合取**决定，不因只报一条而放宽；条件 1 通过时条件 2 的原因会照常输出（如 C2/R1/F1） |
| B2-F4 | §10.3 中 `pending` 的阶段行**不带** `result=` token（`阶段 DHR_90:R#1  pending`），只有已进入的实例（`closed`/`open`）才打印 `result=<outcome|—>` | 渲染器按此分流；`stages[].result` 在 JSON 中仍按 §3.5 恒存在（`null` 表示尚无结果），两者不冲突 |
| B2-F5 | `closable` 对「依赖已满足但从未 `node_start`」的节点按字面判据计算：无已 launch agent + `close` 列为空 ⇒ `true` | 与 RLT_03 `_validate_node_close` 的实际接受条件一致（该函数不要求 `node_start`），故投影与写者守门不矛盾。若 Batch 3 收紧 `add` 侧，投影需同批同步，属 Batch 3 owner |
| B2-F6 | `current_stage`/`current_node` 的「未开始」特例与「首个未 `node_close` 节点」通例并存：空账本按 §3.5 一律 `null` + 全 `pending`；非空账本才启用三态表与首个未关节点 | 空账本语义由 RLT_03 既有断言固定（`pending_nodes` 全列 + 当前态 `null`），本批保持；这解释了为何「仅 `plan_loaded`」时 `W1` 已是 `ready` 但仍被同时列为当前节点 |
| B2-F7 | `errors` 本批收集四类只读结构问题：`stage_result` 缺 `stage_id=`、`outcome` 非法、`ts` 不可解析或与当前时区不可比、`plan_amend` 缺 `nodes=`；命中时该条 `stage_result` 不产生 `result` 对象，但**不改变退出码、不阻止其它投影** | `status` 仍是只读投影（A44）：异常只被如实登记进 `errors`，不构成拒绝。Batch 3 若要在此之上加 `add` 侧时序校验，属其 owner |
| B2-F8 | A128/A73 的旧差分 fixture 实际并非「仅差 superseded 行」：superseded 变体的 `W1.close` 为空而 plain 变体为 `agent:builder`，`C1` 的 `close`/`depends_on` 也不同 | placeholder 三键 payload 掩盖了该差异，完整投影首跑即暴露（E-035）。对齐为「仅差一行 superseded」后，断言改为显式核对 `superseded_ignored` 0/1 再比较其余字段——较原「整包相等」更强，未放宽任何既有断言 |
| B2-F9 | 本批未写死阶段键、档位、reviewer 集合或 limits：`derive_status` 只读 plan 对象与账本；`suggested_action` 五枚枚举与 `monitor_relaunch_count` 为只读派生，`add` 侧守门、X 规划、A89 lint 均未实现 | 满足「不为 Batch 3/4 抢跑」；`stages[].result.amend/nodes` 只从 `stage_result` note 的 `amend=`/`nodes=` 投影，不实现 RLT_09 的 plan-amend 规则 |
| B2-F10 | 「输出词表不含合格性判断词」（A44）在本批对渲染文本与 JSON 全量扫描通过，但 placeholder 的旧文本同样不含这些词 | 该断言是**late-added discriminator**（红绿两侧皆通过），不冒充红；A44 的有效行为红由「完整 13 键契约缺失」（E-029）与「异常账本仍 rc0 且只登记 errors、账本字节不增」（E-034 的只读矩阵）承担 |

## Batch 2 fresh 小审 R1（2026-09-11 · rlt05-b2-check-sol / rlt05-b2-check2-sol）

| ID | 级别/状态 | 事实 | 收敛要求 |
|---|---|---|---|
| F-B2-LAST-RESULT-SCHEMA | P1 · **resolved（2026-09-11 rework R1）** | `_result_document()` 固定返回五键，`status_document()` 同时把它用于顶层 `last_stage_result` 与 `stages[].result`；测试还明确要求顶层为同一五键集合。design §3.5 只给顶层 `{stage_id,outcome,note}`，五键仅属 `stages[].result` | 顶层正向 fixture 改为精确三键并先取有效红；再拆分顶层与 stage-result serializer，保持 `stages[].result` 五键；focused/full/真实 CLI 复跑 |

小审报告：`reviews/batch2-review-sol.md`（E-039）。P0=0、P1=1、P2=0；E-037/E-038 的动态项均因 `bwrap RTM_NEWADDR` 为 `NOT_RUN`。Batch 3 在整改经定向复审通过前保持锁定。

### F-B2-LAST-RESULT-SCHEMA 的整改证据与实现事实（施工者登记，裁决仍在主控）

| 项 | 内容 |
|---|---|
| 有效红 | E-042：`-k test_stage_result_projection_carries_five_keys_with_and_without_amend -v` → `Ran 1 test ... FAILED (failures=1)`，diff 明确列出实收多出 `+ 'amend': 'decision.2.md'`、`+ 'nodes': ['C3','C4']`；同一测试里 `stages[].result` 的五键断言当时已通过，证明红只锚定顶层违约，未误伤阶段层 |
| 整改实现 | `_result_document` 语义收紧为**仅供** `stages[].result`（键集未变）；新增私有 `_last_result_document` 输出顶层三键；`status_document` 顶层改调后者。`derive_status` 及其余派生**未改动**——`Status.last_stage_result` 仍持完整 `StageResult`，差异只在序列化层 |
| 绿 | E-043：smallest `OK (1)`、focused `OK (12)`；E-044：全文件 `Ran 84 tests ... OK` |
| 真实 CLI 探针 | E-045：`status --json` 顶层恰 3 键 `['note','outcome','stage_id']` 且取值精确；`stages[].result` 恰 5 键并保留 `amend="decision.2.md"`、`nodes=["C3","C4"]`；两者为不同对象；顶层仍 13 键；空账本 `last_stage_result` 为 `null`；运行前后账本字节不变 |
| 测试 oracle 修正 | 原先把错误行为锁成 oracle 的顶层五键断言已按 §3.5 拆正：新增常量 `STATUS_LAST_RESULT_KEYS = {stage_id,outcome,note}` 并断言精确三键 + 精确取值（有/无 `plan_amend` 两例），`stages[].result` 五键断言原样保留（fixture 明细 #10） |
| 边界 | E-046：改动仅两 Python；两 TOML sha256 与 Batch 1 完全相同；无新公共子命令；`git diff --check` exit 0；移除前确认 `__pycache__` 仅含两 pyc，移除后全仓无缓存 |

本轮未改 `reviews/batch2-review-sol.md` 与本 `review.md`；小审原文与既有 E-ID 未回改。Batch 2 R1 待整改项：**0**。

## Batch 3 施工事实登记（2026-09-11 · rlt05-build-deepseek）

> 只登记事实与解释，不改合同；证据见 `progress.md` E-052～E-060。

| ID | 事实 | 影响 |
|---|---|---|
| B3-F1 | design §3.4 对 `monitor_restart`／`plan_amend` 的时序规则只写「任意位置，不限次」，A85 单独给写入者归属 | 本批：A85 对这两个事件的写入者照常校验（`monitor_restart` 仅 monitor、`plan_amend` 仅 monitor），但**不**新增任何阶段级时序约束；A93 的「关窗」是唯一会拒它们的规则。这是把「任意位置」与「stage_close 后不得再写」并列读的结果，供复核裁决 |
| B3-F2 | `current_stage` 在「全部节点已 `node_close`、但本实例尚未 `stage_close`」这一窗口内，design §3.5 未定义（「首个非 superseded 且未 `node_close` 的节点」此时不存在） | 实现取：无未关节点但仍有已 `stage_start` 未 `stage_close` 的实例时，取其中 `stage_start` seq 最大者为 `current_stage`；一个都不剩则 `null`。理由：A106 要求 `last_stage_result.outcome` 可用于分路，而 `stage_close` 正是编排读到结果后才写的动作——若此窗口内 `current_stage` 为 `null`，`failed`→`relaunch_monitor`/`notify_user` 与 `done`→`open_next_stage` 都无法判定。副作用：`stage_close` 之后 `last_stage_result` 回到 `null`、`suggested_action` 回到 `none`（此时该由计划推导下一阶段，不需结果分路）。**E-059 的测试侧更正 ③ 即源于此**，请复核确认该读法 |
| B3-F3 | A111 原文是「同卡两实例同时 open **报警**」，未说 `add` 应否拒绝第二次 `stage_start` | 实现取「报警」字面：`add` 接受该次 `stage_start`，由 `status.errors` 报 `HC-RL-A111 card <card> has N open stage instances: [...]`。若复核认为应在 add 侧 fail closed，则属合同加强，需主控裁决后另行整改 |
| B3-F4 | A112 的「`stage_result` 必须晚于该实例**末节点** `node_close`」 | 实现按「该实例**全部**节点已 `node_close`」判定（末节点 close 蕴含于其中），与 §5.2.1 的四步顺序及 A89 的 `stage_close` 前置一致；因此阶段中途补写结果会被拒。`done` 之外的三值同样要求先关节点，不设例外 |
| B3-F5 | A118「`cancelled` 的 `note` 必须引用 `user_decision`」 | 实现取字面：note 中需出现 `user_decision` 字样（§9.3 的样例行即 `引用上条 user_decision，停卡`）。未额外要求 `resume`/`cancelled` 必须先有真实的 `user_decision` 事件——那属于 A114/A97 的链式校验，归 strategist 链 owner，本批不越界 |
| B3-F6 | `monitor_relaunch_count` 的算法 | 实现取「当前实例内 `monitor_launch` 条数 − 1（下限 0）」，即首次拉监工不计重拉；与 §3.5「因 `failed` 重拉监工的次数」及 A106「failed 最多重拉一次」在真实 CLI 上一致（E-056：0 → 1，动作 `relaunch_monitor` → `notify_user`）。本批**未**校验「重拉是否确由 failed 触发」——该因果属 Batch 4 的止损 owner |
| B3-F7 | `plan_amend` 的 `note` 规则（`amend=` + `nodes=`）与 `stage_result.note` 的 amend 摘要 | 本批只做只读投影与 `nodes=` 缺失时的 `errors` 提示（Batch 2 已有），**不**在 add 侧校验；白名单与追加规则归 RLT_09（不在本卡 allowed-paths） |
| B3-F8 | 首轮全量回归暴露 3 条 RLT_03 旧 fixture 依赖「旧实现错误接受」（E-058） | 三条均改在测试侧、按新合同重写，未删除任何仍有效的合同断言；明细见 `progress.md` fixture 对齐表 #11–#13。这类失败是 A85/A112 生效的直接证据，不是回归 |
| B3-F9 | 本批未实现：X 轮数与 attempt 上限的止损判定、A97 lint、strategist 链的链式校验、plan-amend 白名单、模板/watch | 上述均属 Batch 4 或 RLT_07/09/18；本批只交付 add 侧生命周期/偏序/写者、status 联动与 A89，边界未扩张 |

## Batch 3 fresh 小审 R1（2026-09-11 · rlt05-b3-review-devin / SWE-2 Max）

| ID | 级别/状态 | 事实 | 收敛要求 |
|---|---|---|---|
| F-B3-PRESTART-INTERVAL | P1 · open | A93 只封 `stage_close` 后，没有禁止 monitor 在实例 `stage_start` 前写；真实 CLI 已证明 C#1 可先完整跑完再补 start，零 monitor_launch 也能 close，且 `status.errors=[]` | add/status 对称补 start 下界，stage_close 要求至少一次 monitor_launch；补有效红、focused/full/CLI |
| F-B3-CURRENT-STAGE-MIDPLAN | P2 · open | C#1 已 result、未 close 且 R#1 未 start 时，status 把 R#1 当 current，丢失 C#1 的结果路由；B3-F2 的 all-closed fallback 本身通过 | 统一 current_stage 对 open 实例与首个未关节点的优先级并补 fixture |
| F-B3-RELAUNCH-COUNT | P2 · open | 当前计数把所有额外 monitor_launch 都视为 failed 重拉，包含 monitor-crash 恢复 | 实现 failed 因果或由主控明确登记 Batch 4 延后 |
| F-B3-A89-BRANCH-EVIDENCE | P2 · open | launch-before-start 测试先命中 unknown-stage，未覆盖目标分支 | 改用已知未 start 实例并取得有效红绿 |

小审报告：`reviews/batch3-review-devin.md`（E-062）。P0=0、P1=1、P2=3、open=4；Batch 4 保持锁定。

## Batch 3 rework R1 施工事实登记（2026-09-11 · rlt05-b3-r1-devin / SWE-2 Max）

> 只登记事实与解释，不改合同；证据见 `progress.md` E-063～E-069。本轮仅闭合 E-062 的四个 open finding，不进入 Batch 4。

| ID | 级别/状态 | 事实 | 闭合方式 |
|---|---|---|---|
| F-B3-PRESTART-INTERVAL | P1 · **resolved（2026-09-11 rework R1）** | A93 原只封 `stage_close` 右边界；monitor 可在实例 `stage_start` 前写完整个节点链，零 `monitor_launch` 也能 `stage_close`，`status.errors=[]` | `_validate_writer_handoff` 新增下界：monitor-owned 事件所归实例无 `stage_start` 行 → `HC-RL-A93`；`_stage_lifecycle_events`（原 `_open_stage_ids`）改收 `monitor_launch`，`stage_close` 分支新增「本实例无 `monitor_launch` → `HC-RL-A89`」；`_ledger_warnings` 镜像三类报警：monitor 行先于 `stage_start`（A93）、非 stage 级事件携带与节点归属不一致的 `stage_id=`（A93）、`stage_close` 时零 `monitor_launch`（A89） |
| F-B3-CURRENT-STAGE-MIDPLAN | P2 · **resolved（2026-09-11 rework R1）** | 首个未关节点属于未 start 的实例时，`current_stage` 仍取该节点 stage，已 start 且有结果的 open 实例失去结果路由 | `current_stage` 规则改为：当前节点所属实例已 `stage_start` → 取该实例（原路径）；否则若存在 open 实例 → 优先「全部节点已关、等 `stage_close`」者，再退最新 `stage_start`；无 open 实例 → 回退 A61 字面（当前节点 stage）。B3-F2 的 all-closed fallback 保持为其中「current 为空」的子情形 |
| F-B3-RELAUNCH-COUNT | P2 · **resolved（2026-09-11 rework R1）** | `monitor_relaunch_count` 取「monitor_launch 数 − 1」，把 §7.3 崩溃恢复重拉也算成 failed 重拉 | 改为因果计数：只在「该实例最新 `stage_result.outcome == failed`」期间写入的 `monitor_launch` 计数；首拉与非 failed 窗口内的恢复拉不计。残余歧义已登记：failed 窗口内的崩溃恢复拉也会计入（账本无法区分拉起因），若复核要求严格区分需补事件或规则 |
| F-B3-A89-BRANCH-EVIDENCE | P2 · **resolved（2026-09-11 rework R1）** | 原断言用未知实例 `R#1`，先命中 unknown-stage 分支，未覆盖「must follow stage_start」 | `write_stage_plan` 扩出真实存在但永未 start 的 `R#1` 实例；断言改用该实例并加验 `must follow stage_start` 消息；E-065 mutation 红证明该断言确实命中目标分支 |

### rework R1 附带事实（供复核裁决）

| ID | 事实 | 处理 |
|---|---|---|
| B3R1-F1 | 阶段归属规则：`stage_start`/`monitor_launch`/`stage_result`/`stage_close` 四枚由 `note` 的 `stage_id=` 寻址；其余事件一律按 `node` 归属实例 | 新增 `STAGE_NOTE_EVENTS` 常量；`_stage_of` 改为「stage 级事件 note 优先，其余 node 归属」；`_ledger_warnings`/`derive_status`/`_stage_entries`/`derive_last_writer` 随之不再被伪 `stage_id=` 串实例。E-062 的 P3 备注「stage 级事件未核 node 是否为实例首节点」**未**动（不在四 finding 范围） |
| B3R1-F2 | monitor-owned 下界以 `stage_start` 为准（按 E-062 最小收敛列），不以 `monitor_launch` 为准：实例 `stage_start` 之后、`monitor_launch` 之前的监工写入仍合法 | 与 §3.4「monitor_launch 每阶段实例至少一次」合读：`monitor_launch` 只作 `stage_close` 的前置，不是监工写入的前置。若复核认为监工写入应以 `monitor_launch` 为下界，属合同加强，需主控裁决 |
| B3R1-F3 | `current_stage` 与 `current_node` 在 mid-plan 窗口可不一致（`current_node=R1` 指向未 start 实例的节点，`current_stage=C#1` 指向 open 实例） | 按 E-062 要求保留：结果路由跟 `current_stage`，节点进度跟 `current_node`；A61 字面在「无任何 open 实例」时兜底 |
| B3R1-F4 | 旧 fixture 对齐：`start_ledger` 现写入 `plan_loaded + stage_start + monitor_launch` 合法开场三行；7 处旧 fixture/test 补 stage 事件或行数（明细见 `progress.md` fixture 表 #14–#20） | 同 E-058 口径：这类失败是新下界生效的直接证据，不是回归；所有原 HC-ID 断言保留 |


## Batch 4 施工事实登记（2026-09-12 · rlt05-b4-build-devin / SWE-2 Max）

> 只登记事实与解释，不改合同；证据见 `progress.md` E-075～E-084。本批仅 Batch 4 范围，不进入复核。

| ID | 事实 | 处理 |
|---|---|---|
| B4-F1 | A107「X 轮数达 `max_rounds`」的触发时点，design §7.3 只写「任一计数到上限即触发」 | 实现取「该卡已开 X 实例的最高 `k` 达到 `limits.rework_max_rounds`，且该实例最新 `stage_result` 仍为 `failed`」——即「需要再开一轮时已无余量」。与 §9.3「X2 仍不过 → 监工拉 strategist」一致；`X#max` 仅开启/进行中/`done` 均不触发 |
| B4-F2 | A107「attempt 达 3」的触发时点同理 | 实现取「`(node, agent名)` 的 `agent_launch` 计数 = `limits.attempt_max`，且最新行仍需重拉」——重拉资格复用 HC-RL-A49 同一组原因（`agent_lost`/`cancelled` 或其后 `stage_result outcome=failed`）；计数达上限但 agent 正常 `done` 不触发 |
| B4-F3 | strategist 链终局闸的判定与挂载位置 | `_validate_strategist_conclusion`：仅当该 agent 是**活跃链属主**（`_active_decision_owners` 命中）且 helper 为 `strategist` 时，`resume`/`cancelled` 要求属主最新行是 `user_decision`；decider 链与其他 agent 不受影响。链已 `resume` 落地后属主失效，后续 `cancelled` 走普通终态。`cancelled` 不在 `DECISION_EVENTS`，故闸挂在 `_validate_event_semantics`、先于状态机 |
| B4-F4 | `loss_stop`/`plan_x_rounds` 是纯内部函数：不写文件、不进 argparse、`status` 输出不含其字段 | `status` 的 13 键 schema 由 A62 冻结，止损计数属内部派生；X 计数取「已开实例最高 `k`」（正常顺序下等价于开启条数），attempt 计数取 `agent_launch` 行数（A58 已保证连续编号） |

## heavy 复核设计层待裁项处置（2026-09-12 · rlt05-decide-fable 裁决，E-091）

> 来源：B4 小审 F-B4-R01/R03/R05/R06 + heavy 代码轮1 裁决。decider（Claude Fable low）裁定**四项全部 defer**——登记到验收材料转后续卡，最终归属裁定自然落在对应后续卡授权时点由用户裁决；无一改变本卡代码或验收结论。

| ID | 事项 | defer 去向 |
|---|---|---|
| F-B4-R01 | `loss_stop`/`plan_x_rounds` 纯内部无产品消费出口（本卡合同无违，A62 不回改） | 验收材料登记三候选出口（RLT_07 skill 内部消费 / RLT_18 watch / 合同增补），归属裁定挂 RLT_07 brief 编制阶段 |
| F-B4-R03 | `attempt_max` 无 add 硬闸（与 X 侧 A97 硬拒不对称，合同本无要求） | design 待补规则→ID 映射后另派卡；本卡不动 |
| F-B4-R05 | §11 A99 证法原文「git diff 为空」在 WIP 期不可达，已按 P2-2 以双 sha256 等价替代 | design §11 A99 行证法文字改 hash 口径（A 侧修订候选）；交接须写明「A99 按 P2-2 等价口径执行」防 verify 误判 |
| F-B4-R06 | `XRound` 不承载「coder 修+reviewer 审」语义（F-003 已接受的纯内部接口边界） | RLT_07 交接段点名：不得从 XRound 结构反推角色语义 |

## Batch 4 fresh 小审登记（2026-09-12 · rlt05-b4-review-opus / Claude Opus 5 high）

> 按 B1–B3 惯例补开本节（承接一致性路 F-HCN-02）。完整审件：`reviews/batch4-review-opus.md`；逐项裁决见 `reviews/heavy-code-r1-devin.md` §4；defer 去向见上节「heavy 复核设计层待裁项处置」。

| ID | 级别 | 事实 | 处置 |
|---|---|---|---|
| F-B4-R01 | P2 | `loss_stop`/`plan_x_rounds`/`LossStop`/`XRound` 纯内部、无产品调用点（A107 §11 证法只要求单测、A62 冻结 13 键——不违约，但止损计数无可机械消费出口） | heavy-r1 裁 ESCALATE→decider 裁 defer：验收材料登记三候选出口，归属挂 RLT_07 brief 编制时点 |
| F-B4-R02 | P3 | attempt/X 止损「触发时点」取「再要一轮时已无余量」收敛读法（字面读法会使 attempt_max=3 退化为 2） | heavy-r1 确认闭合：X 侧有 §9.3 直接支撑，attempt 侧读法更合理；可选 §7.3 补一句澄清 |
| F-B4-R03 | P3 | `attempt_max` 无 add 硬闸（`coder#4` launch 仍 rc0），与 X 侧 A97 硬拒不对称；合同本无要求 | defer：是否硬上限属产品设计裁决，须 design 补规则→ID 映射另派卡 |
| F-B4-R04 | P3 | strategist 链 `resume` 落地后，同 coder 再写 `cancelled` 不再过 user_decision 闸（链属主失效） | heavy-r1 确认闭合：窄读法与 §3.4/§9.3 链止于二选一一致 |
| F-B4-R05 | P3 | §11 A99 证法「git diff 为空」在整卡 WIP 期结构性不可达，task_plan 冻结双 sha256 替代（证明力不弱） | defer：design §11 A99 行证法文字改 hash 口径（A 侧修订候选）；交接写明按 P2-2 等价口径执行 |
| F-B4-R06 | P3 | `XRound` 仅 stage_id/card/k/dh_nodes 四字段，「coder 修+reviewer 再审」语义只在 docstring | defer：RLT_07 交接点名，不得从 XRound 反推角色语义 |

## heavy 复核处置裁决登记（2026-09-12 · rlt05-decide-fable 二轮裁决，E-097）

| ID | 裁决 | 去向 |
|---|---|---|
| F-B4-R03 | amend-design | 登记为 design 补规则+ID 映射请求（attempt_max 是否硬上限），另派卡执行；本卡不改 |
| F-B4-R05 + F-HRQ-01 + F-HCN-03 + F-HCN-04 | amend-design（打包一条，四子弹） | design/01 文字精化包：①§11 A99 证法改「同一不变二进制按配置产出不同结构」hash 口径；②§3.5 当前阶段派生补 current_stage 精化规则一句；③`lint --json` 补 A80/RLT_10 阶段注记；④决策类事件枚举（design 5 枚含 cancelled vs `DECISION_EVENTS` 4 枚）补归属注记。转后续 A 侧动作 |
| F-HLS-02 | merge | L-004 并入库内候选-50 标子款（增量=合成 HOME 覆盖默认解析分支）；`lesson_candidates.md` 判重注记已按此口径写明 |
| F-HR1-01 = F-HRQ-05 | rework · **resolved（2026-09-12，闭合 E-098/E-099）** | 本卡内机械改已执行：`test_relay_log.py:23` 改从 `relay_log` 导入 `SUGGESTED_ACTIONS`、删 :1866 本地副本，`_suggested_action` 五返回值全有 `assertIn(..., SUGGESTED_ACTIONS)`（:1987/:2580/:2596）——常量由死代码转为测试消费的契约枚举；`relay_log.py` hash 不变、108/108 绿；定向复审 `reviews/rework-fhr1-rereview-devin.md` APPROVE open=0 |
| F-HR1-02 + F-HRQ-02 + F-HRQ-04 | accept-as-is | 三处静默点登记为已知沉默区；若后续要收紧归属或 errors 加只读提示，先走 design 修订，不在本卡上升 |
