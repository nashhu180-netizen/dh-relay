<!-- dh:v1 -->
会话 ID `session_01KWkDbhZNSKSbdo8tZjTAQf`｜模型形态（自观察）：Claude Code CLI 内的 Opus 5，模型 ID `claude-opus-5`，知识截止 2026-05；本次工具形态为只读（审核期间 Bash / Write 被拒，无 Glob/Grep），未执行任何命令、未改动任何既有文件。

# RLT_05 · W 阶段 task-plan 复核（fresh，非施工者、非主控）

**VERDICT = REVISE**（P0=0 · P1=6 · P2=7 · P3=3）

## 0. 范围与方法限制

只读输入：`AGENTS.md`；RLT_05 工作区 6 份工件；DevPlan（RLT_05 卡、§3.1、§4、§6、§8.3）；design/01 §2/3/5/6/7/9/10 与 §11 的 25 行；`relay_log.py`；`test_relay_log.py`。

**限制（非 finding）**：无目录列举能力。`progress.md:8/:25` 称本工作区「七文件」，我按文件名逐个尝试只读到 **6 份**（brief / task_plan / progress / findings / review / lesson_candidates），第 7 份未命中（已试 handoff、verify、requirement_evidence、evidence、README、context_packet、closeout、acceptance、design_delta、index、test_plan、baseline、report、as_built、decision_log、open_questions、worklog、review.plan 等）。**结论仅基于已读到的 6 份。**

## 1. brief 是否逐字且 25/25 承接 DevPlan —— 通过，无 finding

- DevPlan `:209-235` 为 16+9=25 条；`brief.md:23-52` 同为 16+9=25，**分组、顺序、编号、正文逐字一致**（含 A106 五枚举括注、A62「不重复 A73」、A99「对外子命令仍只有 add/status/lint」、A97「auto 模式亦然」）。
- `review.md:26-50` 的 25 行与四批标题 ID 集合闭合（B1=4、B2=8、B3=9、B4=4，无重无漏）。
- `brief.md:56` In scope 与 DevPlan `:237-242` allowed-paths **完全一致**；`brief.md:57` 覆盖 DevPlan `:207` 非目标全部六项并额外排除 RLT_07/09/18；`brief.md:58` 的 heavy 与 DevPlan `:244` 一致。

## 2. 逐条 Finding

### P1-1｜Batch 2 的 owner（A43/A62）依赖被冻结到 Batch 3 的能力，退出条件不可执行
- **位置**：`task_plan.md:75-77`、`:82` 对 `task_plan.md:91`；`design/01:1193`（A62）、`:1134`（A43）、`:379-387`、`:1090-1105`。
- **问题**：① A62 冻结 oracle 明写「**有/无 `plan_amend` 各断言 result 五键**」，而 `{stage_id,outcome,note,amend,nodes}` 必须解析 `stage_result` note，该解析被冻结进 Batch 3。② A43 的 oracle 是「与 §10.3 样张一致」，样张含 `阶段 DHR_90:W#1 closed result=done`（需 stage_result 投影）与 `当班写入者：monitor(...)`（需 A93 写者区间，Batch 3）；`task_plan.md:76` 却自行收窄为「六项」。
- **影响**：Batch 2 退出条件按计划**无法达成**；施工者只能越界提前实现 Batch 3，或以缩水 oracle 把 A43/A62 标绿（**错误验收**）。
- **修法**（择一）：(a) 把**只读侧** stage/result 投影下沉到 Batch 2，Batch 3 只留 `add` 侧偏序守门；或 (b) A43/A62 整体移到 Batch 3 并改写 Batch 2 退出条件。同时把 `:76` 改为「§10.3 样张逐行一致（六项为子集）」。

### P1-2｜Batch 1 的 A116 严格 lint 与「旧 RLT_03 测试保持绿」直接冲突，且 reviewer 路径名口径未唯一冻结
- **位置**：`task_plan.md:59`、`:60`、`:66`；`test_relay_log.py:38-41`（默认 marker 恒为 `recipe=normal`）、`:346-379`（R 节点 agent 名为 `reviewer`）、`:282-297`；`design/01:1168`、`:408`、`:804-806`。
- **问题**：① 现存 fixture 几乎全是 `recipe=normal`，带 R 节点者 reviewer 集合为 `{reviewer}`，不带 R 节点者为空集，均 ≠ `{requirement,lesson}`；A116 一接进 `lint_plan()`，Batch 1 退出条件的两项要求互斥。② design 未冻结两个必需口径：**无 R 阶段时 A116 是否适用**；**reviewer 路径名取哪一列**（`roles.toml` 只有单一 `reviewer` 角色，路径名只能来自 agent 列），而 `:59` 写成「`agent` **或** `note`」，把一个 lint 判据留成二选一。
- **修法**：新增 `open-needs-main-controller`，冻结「无 R 阶段则 A116 不适用」+「路径名唯一取 agent 列」；Batch 1 退出条件补一句：既有 fixture 因新增 A116 判据需补 `recipe=`/reviewer 行属**fixture 对齐**，须逐条在 `progress.md` 登记。

### P1-3｜「配置 fail closed」与 `add`/`status` 路径的冲突未被任何 finding 捕获
- **位置**：`task_plan.md:59`、`:62`、`:107`；`relay_log.py:408-415`（`_runtime_plan()` 让 add/status **一律走 `lint_plan()`**）；`design/01:192`、`:408`。
- **问题**：A116 一旦成为 lint 规则，add/status 也必须拿到配置。但 Batch 1 禁读 home、不许降级默认，resolver 要 Batch 4 才有 → Batch 1~3 期间真实 CLI 未定义：要么静默跳过 A116（违反 `design/01:192`），要么全部 fail closed 转红。
- **F-001 未覆盖**：`findings.md:8` 的选项里「仅 lint/status」事实上不可用。
- **修法**：并入 F-001 重写，请主控一次裁决：(a) `--config-dir` 挂载形态；(b) 无配置目录时三命令各自退出码与消息；(c) Batch 1~3 是否允许 `config=None` 显式跳过 A116 并在 Batch 4 收口（若允许，Batch 4 退出条件须加「默认路径下 A116 也生效」的复算）。

### P1-4｜A89 的 lint 半边（跨阶段依赖只指向前面的阶段）没有落进任何一批
- **位置**：`design/01:414`、`:1184`、`:506`；`task_plan.md:91`（Batch 3 接口无 `lint_plan`）、`:93`、`:96-97`；`relay_log.py:287-392`（无该规则，只有 `:380-391` 的 A109）。
- **问题**：A89 五条反例里有一条是**计划层 lint 规则**。Batch 3 把 A89 整条当事件时序处理，接口/先红/边界/小审四处都没有 lint 位置；而现状该场景**会被 A109 误伤性拒绝**，`review.md:36` 又不要求断言编号 → 用 A109 拒绝的结果会被当成 A89 通过。
- **影响**：A89 假绿；§3.5 表中编号 A89 的规则实际缺失，会在 RLT_10 的 A94（`design/01:1196`）暴雷，属跨卡返工。
- **修法**：Batch 3 接口补 `lint_plan()` 的该规则（报 `HC-RL-A89`），先红补该 lint 反例，边界显式允许本批改 `lint_plan()`（仅此一条），`review.md:36` 加严为「rc=2 **且编号为 HC-RL-A89**」；顺带补 A89 缺席的另一反例「`stage_close` 要求该实例全部节点 closed」。

### P1-5｜§6.2.1 优先级 2 是按主控 CLI 区分，程序判定方式未冻结；计划用 `platform` 参数掩盖
- **位置**：`design/01:705-712`、`:879`、`:1201`；`task_plan.md:107`、`:108`。
- **问题**：第二优先级按**谁在当主控**（Claude / Codex）分，不是操作系统；design 全文未冻结程序如何得知（无环境变量/参数/marker 约定）。计划把它命名为 `platform` 做成可注入参数——测试能过 A99「显式优先」断言，但**真实默认路径行为由施工者即兴决定**。
- **影响**：默认若选 `~/.claude/...`，RLT_13 的 `HC-RL-H2`（DevPlan `:377`「不带 `--config-dir` 使用默认 Codex 副本」）直接跑不通，缺陷推迟到跨卡实跑才暴露。
- **修法**：新增 `open-needs-main-controller` 请主控裁决判定机制（`--host claude|codex` / 约定环境变量 / marker 增字段 / 明确本卡只交付可注入接口、默认路径推迟到 RLT_07），并改写 `:108` 的「当前平台」措辞。

### P1-6｜worker stop 边界模式错配：手动派活的卡却要求「等待 `node_closed`」，四个批次信号无落点
- **位置**：`task_plan.md:114`、`:66`/`:82`/`:98`、`:6`；`AGENTS.md:34-37`、`:44`。
- **问题**：`node_closed` 是 relay 流水信号，而 RLT_05 正是「relay-light 还没造出来」的卡（DevPlan `:97`、`:500`），只能走手动派活，不存在会发 `node_closed` 的通道。四条完成信号（`READY_FOR_REVIEW batch=1..3`、`CONSTRUCTION_DONE batch=4`）**未指定落点**（progress？独立文件？仅 pane 输出？）。
- **影响**：施工者按字面会停在交互态等一个永不到来的信号，正是 `AGENTS.md:37`/`:29` 明令禁止的「憋死、主控看不见」；四次停—放行往返无法机械交接。
- **修法**：`:114` 改为手动派活口径（写结构化 DONE 后**立即停止**，不等异步信号；主控另派下一批/复核），并在「施工共通约束」冻结信号落点（建议：固定行格式追加进 `progress.md` 日志表，小审结论由小审者回填 `review.md:54-59`）。

### P2-1｜A91 后半与 A108 前半的被检对象属于 RLT_07，本卡期为空集；F-006 自行冻结与 F-002/F-003 处理不一致
`design/01:1198`（A91「模板与流程文档无硬编码模型名」）、`:1202`（A108「模板默认挂 checker」）对 `task_plan.md:60`、`:78`、`findings.md:18`。RLT_05 期 `skill/` 下只有本卡两份 TOML，模板/流程文档全归 RLT_07（`brief.md:57` 明确排除）→ A91 静态扫描空集通过、A108 模板半边无法取证。此与 F-002/F-003 **同构**却被 W builder 自行冻结。**修法**：F-006 降级为 `open-needs-main-controller`，与 F-002/F-003 统一裁决；`review.md:45`/`:49` 的预期证元数据写明「扫描范围=本卡期存在文件；模板半边留 RLT_07 复验」。

### P2-2｜Batch 4 的 `git diff -- relay_log.py 为空` 在本批必然非空
`task_plan.md:111` 对 `design/01:1201`、`task_plan.md:6`/`:120`（不 commit）。本批正在改 `relay_log.py` 且禁止 commit，切换 fixture 前后两次 diff 都非空，字面不可满足；小审机械核对必判红，或诱使施工者越界 commit/stash。**修法**：改为「两份配置各跑一次内部 X 规划，两次运行之间 `relay_log.py` 的 sha256 相同（记录哈希），且 X 节点数不同」。

### P2-3｜A97 需要一条 §3.5 lint 规则表里不存在的规则，未登记为 finding
`design/01:1209`（A97「再开一轮 X 被 lint 拒绝」）对 `:401-423`（映射表**无 A97 行**）、`:401`（「新增规则必须同批补验收项」）；design/ 是本卡禁改（`task_plan.md:32`）。**影响**：一致性路判「规则与映射表不闭合」；RLT_10 的 A94 会发现表与实现不同集。**修法**：登记新 finding 请主控明确「表缺行属 design 侧待补，本卡按 A97 正文实现并留跨卡指针，不越界改 design」。

### P2-4｜Batch 3 写者表用「等」带过，与 A85 四反例 oracle 不闭合
`task_plan.md:92`（「monitor 为 node/agent/stage_result **等**」）对 `design/01:1179`（monitor 侧逐字含 `monitor_restart` 与 `plan_amend`，四反例之一是「编排写 `plan_amend`」）。**修法**：逐字复制 `design/01:1179` 的两侧写者表，不用「等」。

### P2-5｜Batch 3 缺 Batch 2 的「late-added discriminator」条款
`task_plan.md:77` 对 `:93`（「旧实现若错误接受，**必须**得到行为红」）。部分预期反例现状并非「错误接受」（最典型是 A89 跨阶段依赖，现状被 `relay_log.py:380-391` 以 A109 拒绝）→ 红不可达，或诱使施工者去改本不该改的既有判据。**修法**：把 discriminator 条款原样复制进 Batch 3，并要求登记「旧行为为何已正确、以哪条编号拒绝」。

### P2-6｜有效 mutation 只锚 status/lifecycle 一域
`review.md:16-20` 仅一行变异点（status schema 或 stage-close 偏序，二选一）；对 `AGENTS.md:22`。本卡 9 条 owner 属配置/Recipe/止损组，而 A99 的核心命题正是「改配置即改行为」，该半张卡无变异覆盖。**修法**：扩为至少两行，一行锚 status/lifecycle，一行锚配置驱动（建议 `limits.rework_max_rounds` 读取点或 Recipe 集合比较点），两行都记施加/还原 hash 与行为红结果。

### P2-7｜Batch 1 新建两份 TOML 与 RLT_01「skill 五文件唯一源」重叠，交叉未登记
`task_plan.md:58`（Create 两 TOML）对 DevPlan `:118`（RLT_01 建五文件唯一源）、`:79`（「RLT_05/07/09/18 只在此**改内容**」）、`:97`（RLT_05 依赖列**只有 RLT_03**）、`:121`（A124 以五文件为单位）。本卡有权创建（DevPlan `:240-241`），但创建后 `skill/` 只有 2/5 文件，而 A124/A32 都建立在五文件齐备之上；计划未登记该交叉，也未说明 RLT_01 能否覆盖本卡内容。**修法**：在 `findings.md` 已冻结边界加一条事实登记（RLT_01 建骨架时不得覆盖/回退本卡内容，两卡以 §6.3 为共同权威），并在交接清单留指针。

### P3-1｜基线 SHA 不是合法 40 位 SHA-1
`task_plan.md:36`、`progress.md:8` 的 `1bea79fe18271f9d5dc6cc8993bfbf57d` 只有 33 位十六进制（前 7 位与当前 master 短 SHA `1bea79f` 吻合，疑为转录截断）；对照 DevPlan `:96` 的 RLT_03 verify SHA 为规范 40 位。虽已写「必须重新审计当前 SHA」，但「核对基线包含 RLT_03 完成提交」用不可解析串做起点会造成无谓卡壳。**修法**：补全 40 位，或删值只留「必须包含 verify `8b67bbdb…`」。

### P3-2｜brief 权威顺序与 task_plan 的 oracle 用法有误读空间
`brief.md:17`（DevPlan > design/01 > task_plan）对 `task_plan.md:18`（C-009：design §11 是 oracle 原文）。DevPlan 25 条是**一句话摘要**，design §11 才是含证法的 oracle（P1-1、P1-4 两处偏差正源于此）。**修法**：改为「DevPlan 定 owner 与边界，design §11 定 oracle 原文与证法；冲突时停下写 findings」。

### P3-3｜A115 的「静态检查 §6.2 未复述具体路数」未指定落点
`design/01:1200` 对 `task_plan.md:59-62`/`:65`；测试可读输入闭集也未列 `design/01`。**修法**：明确该半条由批次小审人工核对（写进 `review.md:47` 预期证元数据），或明确授权单测只读 `design/01` 做静态断言——二选一冻结。

## 3. 闭集其余项结论

| 闭集项 | 结论 |
|---|---|
| 2) 批次切分与依赖顺序 | **部分成立**。「配置 → status 投影 → 阶段生命周期 → 定位与止损」切分合理，B1→B4 串行与 DevPlan §8.3 单向依赖一致；但 owner 落位有两处错配（P1-1、P1-4），修正后可用。 |
| 3) 红测口径与是否过度设计 | **红测合格**：`task_plan.md:47` 明确排除 import/fixture/setup/TypeError；已核对 `relay_log.py:697-719`，Batch 3 的八类负例现状**确实会被错误接受**，红可得（唯一例外见 P2-5）。**无过度设计**：`RelayConfig`/`derive_status`/`StageState`/`limit_state` 均可回指 design §3.5/§5.1/§6.2/§7.3；`plan_x_rounds` 限定为纯内部不写文件，与 A99「内部实现、不新增公共 CLI」一致。 |
| 4) 抢跑与 allowed-paths | **未发现抢跑，路径闭集自洽**。四批 Modify/Create 与边界 diff 全在 DevPlan `:237-242` 内；`:32` 明确排除 SKILL/adapter/模板/watch/plan-amend 与新增子命令。需澄清但不越界：Batch 3 投影 `result` 的 `amend`/`nodes` 属 A62 本卡要求而非 RLT_09 的 A119/A123，且经核对 `plan_amend`/`stage_result` 当前确为无校验直通，`:91` 的说法属实。另见 P2-7。 |
| 5) F-001~F-003 完整性 | **三条成立、定级恰当**；**但有漏项**：P1-3、P1-5、P2-3 应补入，P2-1 指出 F-006 处理不一致；F-001 的「仅 lint/status」选项不成立（`add` 经 `_runtime_plan()` 同样需配置）。 |
| 6) heavy 五路 / mutation / 小审 / stop 边界 | **五路登记正确**（`review.md:8-14` 与 `AGENTS.md:22` 完全一致，fresh、不复用、不自审）；**批次小审输入**逐批具体可执行；**mutation 覆盖不足**见 P2-6；**stop 边界不可执行**见 P1-6。 |
| 7) 是否存在 P0/P1 | **6 条 P1，无 P0**。P1-1/2/3 让 Batch 1/2 退出条件字面不可达；P1-4 造成 A89 假绿并向 RLT_10 传导；P1-5/6 迫使施工者自行裁决产品行为或停在憋死态。不存在方向性错误、越界或抢跑级缺陷。 |

## 4. 复核者边界声明

本报告只写事实与级别，不替主控做验收裁决，未修改任何既有工件。finding 的采纳、新 F-00x 的登记与 task_plan 修订均由主控处理；`brief.md:59`「施工路线冻结于 task_plan」在主控落定修订前继续有效。

---

**VERDICT = REVISE｜P0=0 · P1=6 · P2=7 · P3=3｜报告路径：`docs/modules/relay-light/workspace/RLT_05/reviews/task-plan-review-opus.md`。**
