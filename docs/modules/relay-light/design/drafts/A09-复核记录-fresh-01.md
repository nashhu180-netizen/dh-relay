<!-- dh:v1 · fresh 独立复核；只复核候选稿，不构成确认或施工授权。 -->
# RLT-A-09 交叉审核记录 — fresh-01

- 日期：2026-09-15
- 被复核对象：`design/drafts/A09-复核触发信号与返工生命周期修订候选.md`
- 复核方式：fresh、未参与起草；只读核验正式设计、现有实现、测试、skill、实跑账本与派单。
- 未运行单测：本次没有改实现，未把静态审阅写成测试验证。

## 结论

**REVISE；P1=3，P2=5。**

F-008 所述的互锁事实成立，且把复核触发移至非终态信号是符合用户三句方向的可行方向；不过候选稿尚未给出能覆盖 C 阶段 checker、R 阶段多路 reviewer、X 阶段单路 reviewer 的可判配对合同。尤其 A146 放在 `node_close` 的实现位点，既不能在错误的 `done` 当场拒绝，也没有覆盖 R 模板的 `close=agent:scribe`。在这三项 P1 收束前，不应晋级。

## P1（阻断）

### P1-1：A146 的配对对象与执行位点均不成立

- **事实**：A146 要求「`close` 列指向的复核方」在被复核者 `done` 后才可 `done`，但当前 R 模板的 `close=agent:scribe`，R 阶段的 reviewer 有多路；C 模板的 `close=agent:checker`，却明确保持 checker 空 trigger；只有 X 模板的 close 指向被打回路 reviewer。候选稿 §6.1 又只拟在 `_validate_node_close`（现 `relay_log.py:1835`）加入该闸。现实现的 `node_close` 只在所有已启动实例均为终态后检查 close agent 为 `done`（`relay_log.py:1838-1851`），所以它不能实现 A146 所称「复核方不得记 done」的即时拒绝。
- **证据**：`SKILL.md:74-101`；`relay_log.py:1835-1851`；候选稿 `:208-210`、`:262-267`。R 阶段实际是按 Recipe 多路展开，normal 为 `requirement, lesson`（`dh-mapping.toml:17-18`）。
- **整改动作**：先冻结一个显式、逐路的配对键，例如 source `checkpoint` 的 `ready_for_review=<reviewer>` 与 reviewer `done.note` 的 `reviewed=<source>#<attempt> ready_seq=<seq>`，并规定每个实际 reviewer 行只能消费自己的 ready 信号。把「source 尚未 done 时 reviewer 的最终 done 被拒」放进 agent `done` 的语义校验，而非只在 node_close 兜底；R 的 scribe 另按「所有 reviewer 已终态」的既有收敛规则处理。C checker 若也在范围内，必须定义其 source/ready 配对；若不在范围，候选稿所有「checker」表述要收窄。

### P1-2：`ready_for_review=` 的语法、路由与重复语义未闭合

- **事实**：A144 只检查 source 的最新事件是否为带 token 的 `checkpoint`，没有要求 token 值等于将被 `agent_launch` 的 reviewer；A145 也只说 token 名字在本节点 agent 表存在。于是同一条 `ready_for_review=requirement` 可启动 `lesson`，多路 reviewer 也无法判定各自消费哪一次信号。现 `_note_tokens` 对重复 key 只保留第一次（`relay_log.py:2203-2210`），因此同一 note 写多个同名 token 也不能自然表达多路；现有 `checkpoint` 本身没有 token 校验。
- **证据**：候选稿 `:79-94`、`:208-210`；`relay_log.py:1649-1665`（现 trigger 只认 `on:done:`）、`:2203-2210`。现 R 模板确有「每路一行、并行多行」（`SKILL.md:74-86`）。
- **整改动作**：定义无歧义 wire format 与消费规则：一条 ready 只能指向一个本节点 reviewer，或定义可解析的去重列表；`on:review_ready:<source>` 必须在启动该 reviewer 时核对 token 的 reviewer 名、source 实例、未终态及未被该实例消费。checkpoint 写入时即校验 token 值为当前节点的 reviewer 角色，而不是等到某次 launch 才偶然发现。相应把 `status` 设计为可表示每条 outstanding/consumed ready 的集合与 seq，而不是单个不明的 `review_ready` 字段。

### P1-3：A145/A147 的轮次合同自相矛盾，且 strategist 出口不可执行

- **事实**：A145 写「可重复任意次」，A147 又以同一 `(node, 复核方)` 的 token 条数设上限；默认 `rework_max_rounds=2` 时，A145 的「连续三轮信号均接受」测试与 A147 的「第 3 条拒绝」不能同时成立。A147 还要求拒绝第 N+1 条后走 strategist，但现 `loss_stop()` 只计算 attempt 与 X 阶段两套计数（`relay_log.py:2563-2613`），没有节点内 review counter；被拒的 add 不落账，也没有可由账本自动触发 strategist 的新事实。其「断言 `git diff` 对 relay_log.py 为空」更与为该计数修改 `relay_log.py` 的提案矛盾。
- **证据**：候选稿 `:181-185`、`:209-211`、`:232`；`dh-mapping.toml:24-33`；`relay_log.py:2545-2613`。
- **整改动作**：先界定「一轮」是首次送审、FAIL 后重送，还是一个 reviewer 的 FAIL 结论；指定达到第几次 FAIL 时停止，而非在第 N+1 次写入失败后才临时分路。若维持用户指定的同一配置值，新增独立 `review_rounds[(node, reviewer)]` 投影并把第三计数纳入 `loss_stop`/monitor 分路与 strategist 链；A107 同步改为三套。删去不可能的空 diff 断言，替换为「配置 2/3 均按同一实现得出正确停止点」的测试。

## P2（不阻断）

### P2-1：用例「会失效」清单把“需扩测”写成了“必失败”

- **事实**：662、1333、1440、3642 所列现有测试分别只覆盖旧 trigger、旧运行门、旧未触发 agent、两套 loss counter；添加新分支后不必然失败，通常是需要新增断言。A62 的精确 schema 测试和 template 的精确 trigger fixture 才会在实际改字段/模板后必然失败。1162 保持为 A60/A78 回归证据的判断正确。
- **证据**：`test_relay_log.py:662-686`、`:1333-1361`、`:1440-1451`、`:3642-3699`、`:2151-2269`、`:4576`、`:4776`；候选稿 `:243-252`。
- **整改动作**：把表头改为「需新增/可能受影响」，分别标明“断言将失败”与“仅补正反例”；保留 1162 原样，A102 只扩 token/重拉联合正例。

### P2-2：A144 的“单测四例”与实际列出的情形不一致

- **事实**：A144 实际列出了合法、普通 checkpoint、无事件、done、agent_lost、cancelled，至少六类，不是四例。并且还缺“token 指向另一 reviewer”“重复 signal”“同一 reviewer 已启动未失联又重复 launch”三类。
- **证据**：候选稿 `:208`；`relay_log.py:1791-1811`（重复 launch 还会经过 A49）。
- **整改动作**：按正式状态表列出所有正反例，并分别断言 write-time token 校验、launch-time token 消费、终态封口、重复/重放的结果码。

### P2-3：A62 的 schema 变更尚非可验收设计

- **事实**：当前 `agents[]` 固定为 `{node, agent, last_event, last_ts, idle_seconds}`，且 `RelayStatusProjectionTests` 用精确 key 集合与整份文档断言冻结它。一个 `review_ready: null|…` 字段既不足以表示 R 的多路 pending 信号，也没说明是 latest、未消费集合还是历史。
- **证据**：`relay_log.py:2173-2179`、`:2485-2503`、`:2680-2689`；`test_relay_log.py:2139-2152`、`:2246-2256`；候选稿 `:233`。
- **整改动作**：先决定是否真的需要 status 暴露；若需要，定义稳定 JSON shape、排序、空值、消费后保留/移除与 1:N 语义，再写 A62 修订与完整投影测试；否则删去“status 要能区分”的承诺，避免伪半实现。

### P2-4：A149 的模板范围与现状不完全对齐

- **事实**：候选稿要把 R/X reviewer 默认改为新 trigger，但 R 还有 scribe 的“等全部 reviewer done”约定例外；C checker 按 A95 保持空 trigger。仅检查三处纪律原文不能证明 monitor 在 reviewer `agent_lost`、重复 ready 或多路一条 FAIL 时会保留其他路并正确分路。
- **证据**：`SKILL.md:66-71`、`:74-102`；候选稿 `:213`、`:274-279`。
- **整改动作**：A149 追加各阶段最小账本序列/派单结构测试，覆盖 reviewer lost→合法重拉、一路 FAIL 后同路复审、其他并行路不被重拉或提前封口。

### P2-5：事实表述需更精确

- **事实**：候选稿的核心行号、账本 seq、最大编号和总账算术均核实正确；候选文件在当前 checkout 实际为 326 行，而不是任务说明中的 327 行。A145「任意次」与 A147 上限、以及 A147 的空 diff 断言是内部文本不一致，不是已验证的实现事实。
- **证据**：本记录“实际命令与原始输出”；候选稿 `:202`、`:209-214`。
- **整改动作**：晋级前按当前文件重新取行数；将所有“会失效/天然成立/自动继承”改成有条件命题，并以 A144～A150 的最终测试为唯一证明。

## 八个问题的独立结论

1. **事实核验**：`design/01` 当前最大 AI= A143、最大人验=H18；A144～A150 均未出现；133=118+15，晋级后 140=125+15 的算术正确。A2 的 19 词与 A49/A60/A70/A17/A74/A97/A107/A114 的现行位置和候选引用一致。代码位置：lint 594-603、trigger 1649-1665、迁移表 1821-1829、node_close 1835 起均属实；候选点名的测试起行也属实。唯一需改正的是“会失效”分类及上述内部测试矛盾；当前候选文本为 326 行。
2. **A49/A60/A70 保持不变**：方向上成立，且不应为已终态实例开后门。A70 保号并另立 A144 也比把两个前置混成一条更好。但只有在 P1-1 的配对/终态闸真正覆盖 checker、R 多 reviewer、X reviewer 后，才可称“三条都无需豁免”；当前稿尚未做到。
3. **两个信号名**：复用 checkpoint 的确可不改 A2 白名单和迁移表，候选理由在这一点正确；但它把可执行语义塞入自由 note，现有 parser 还会吞掉重复 key，status/lint 也不会自然理解。因此我不代替用户定名：若坚持候选一，必须先完成 P1-2 的类型化 token/消费合同；若要最清晰、最少 note 语义污染，新增 `ready_for_review` 事件更稳，但接受 A2、迁移表、样张的完整改动半径。
4. **两处争议**：
   - (a) A146 的 seq 只能证明账本顺序，不能证明实际产物“PASS”。顺序闸本身合理，前提是以逐路 `reviewed`/`ready_seq` 绑定，并在 reviewer 写最终 done 时校验 source 已 done；monitor 仍须从实际 review 文件判断 PASS，不能把 seq 当 PASS 证明。
   - (b) 用同一 `rework_max_rounds` 值供第三套独立计数可行，且比把节点内循环并入 X#k 更保留粒度；它不是“无需改 relay_log.py”的小改动。最小安全方案是读取同一值、显式投影第三计数、改 A107 与 loss_stop/strategist 分路；先定义首轮是否计入和达到上限的停止时点。
5. **向后兼容**：现有 `rlt12-win-01` 未改动 lint=ok，证明旧计划当前可跑。把 trigger 词表实现为扩集后，旧 `on:done:` 保持不变是可达目标；但混用计划尚未有实现或测试，不能写成已经成立。若按 P1-1/P1-2 补齐逐路绑定，lint、status、node_close 才不会在混用时误判。
6. **A144～A150**：A148 的旧计划与混用正例、A150 的 lint 扩集、A149 的模板同步是必要的；A144/A145/A146/A147 目前钉不住命题，原因分别是 token route、重复/上限、配对/即时拒绝、计数/出口未定义。还缺：reviewer `agent_lost` 后重拉、重复/重放 ready、并行一路 FAIL 一路 PASS、token 消费顺序、达到上限后 strategist 链的完整账本正反例。
7. **更简单的解法**：不改 trigger 而让 monitor 在 coder done 前手工拉 reviewer（C2 的空 trigger 做法）改动最小，却不能覆盖 X 的 `on:done` 硬闸，也不满足用户已裁决的“承认非终态待复核信号”。把 X reviewer 也改为空 trigger 能绕过程序，但退回纯纪律，不能作为本案替代。更干净的技术替代是候选二的独立事件；代价较大但状态与 status 更直接。
8. **纪律核查**：候选稿明确标为“待复核提案”，三句用户裁决之外的信号名、码位、计数、lint 迁移均未冒充已决；没有勾人验、代签或声称 A144～A150 已运行。§1.3 的 X1 FAIL 推演也标作推论。这些纪律表述合格。需要修的只是把尚未实现的兼容性和“自动继承”改为条件性结论。

## 已核实的正面事实

- F-008 的三条互锁真实存在：C1 的 checker#1 在 seq 20 以 FAIL p1=3 记 done，seq 21 如实记录“节点内无合法返工路径（A49/A60）”；C2 以 live checker 的 seq 25/26/27 checkpoint 路由后，seq 33 记 PASS。X1 的两路在 seq 59/60 均 PASS，因此“若 FAIL 会复现”仍只是合理推论，不是实测。
- A49 的重拉限制、A60 的终态封口、A70 的 `on:done` 前置、A17/A74 的 node_close 双判据均与候选描述相符。保留终态封口而调整进终态的时机，是较小且正确的边界。
- 当前 `rlt12-win-01` 原样 lint 成功；该结果不等于未来新 trigger 或混用场景已验证。

## 实际命令与原始输出

以下均在 `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12` 执行，首句已设置 `$env:PYTHONUTF8=1`；没有执行 git 写操作、没有执行测试。

```powershell
$env:PYTHONUTF8=1; rg -n 'def _require_trigger|def _validate_agent_transition|def _validate_node_close|def loss_stop|def status_document' 'tools/relay-light/relay_log.py'; rg -n 'def test_agent_launch_requires_node_start_and_terminal_agents_are_sealed|def test_trigger_values_and_same_node_done_references_are_checked|def test_runtime_trigger_and_dependency_gates|def test_node_close_ignores_an_untriggered_agent|def test_attempt_and_x_loss_stops_trigger_independently|class RelayStatusProjectionTests|class SkillTemplateTests|def test_a102_checkpoint_round_trips_do_not_burn_attempts' 'tools/relay-light/test_relay_log.py'
```

```text
1649:def _require_trigger(plan: Plan, entries: list[dict[str, object]], node: NodeSpec, name: str) -> None:
1783:def _validate_agent_transition(
1835:def _validate_node_close(plan: Plan, entries: list[dict[str, object]], node: NodeSpec) -> None:
2563:def loss_stop(plan: Plan, entries: list[dict[str, object]], config: RelayConfig) -> LossStop:
2640:def status_document(status: Status) -> dict[str, object]:
662:    def test_trigger_values_and_same_node_done_references_are_checked(self) -> None:
1162:    def test_agent_launch_requires_node_start_and_terminal_agents_are_sealed(self) -> None:
1333:    def test_runtime_trigger_and_dependency_gates(self) -> None:
1440:    def test_node_close_ignores_an_untriggered_agent(self) -> None:
2156:class RelayStatusProjectionTests(RelayCliTestCase):
3642:    def test_attempt_and_x_loss_stops_trigger_independently(self) -> None:
4576:class SkillTemplateTests(RelayCliTestCase):
4776:    def test_a102_checkpoint_round_trips_do_not_burn_attempts(self) -> None:
```

```powershell
$env:PYTHONUTF8=1; $all=(Select-String -Path 'docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md' -Pattern 'HC-RL-A\d+' -AllMatches).Matches.Value; $nums=$all | ForEach-Object {[int]($_ -replace 'HC-RL-A','')}; "max_ai=A$($nums | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum)"; $human=(Select-String -Path 'docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md' -Pattern 'HC-RL-H\d+' -AllMatches).Matches.Value; $hnums=$human | ForEach-Object {[int]($_ -replace 'HC-RL-H','')}; "max_h=H$($hnums | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum)"; "new_ids_present=$([bool](Select-String -Path 'docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md' -Pattern 'HC-RL-A14[4-9]|HC-RL-A150'))"; python 'tools/relay-light/relay_log.py' lint --plan 'docs/modules/relay-light/relay/rlt12-win-01' --config-dir 'tools/relay-light/skill'
```

```text
max_ai=A143
max_h=H18
new_ids_present=False
lint: ok
```

```powershell
$env:PYTHONUTF8=1; $entries = Get-Content 'docs/modules/relay-light/relay/rlt12-win-01/relay_log.jsonl' | ForEach-Object { $_ | ConvertFrom-Json }; "ledger_lines=$($entries.Count)"; $entries | Where-Object { $_.seq -in 20,21,25,26,27,33,59,60 } | ForEach-Object { "seq=$($_.seq) event=$($_.event) agent=$($_.agent) note=$($_.note)" }
```

```text
ledger_lines=71
seq=20 event=done agent=checker#1 note=check.C1.md FAIL p1=3 p2=0；A137 ref 及 A118 码偏离，原始 RED 不可证
seq=21 event=node_close agent=monitor#2 note=coder#1/scribe#1/checker#1 均 done；check.C1.md FAIL p1=3（P1-1 A137 ref= 未强制、P1-2 stage_close 负例码非 A118、P1-3 原始 RED 不可证）；节点内无合法返工路径（A49/A60），三条 P1 由编排裁决带入 C2 返工；commit=a80fcde
seq=25 event=checkpoint agent=checker#1 note=routed_to=coder#1 P1-1 删除 C2 生成的 .devin/config.local.json 及空目录，四集合复核
seq=26 event=checkpoint agent=checker#1 note=routed_to=coder#1 P1-2 补 C2 RED 原始或如实不可证与重建 RED 非冒充证据
seq=27 event=checkpoint agent=checker#1 note=routed_to=coder#1 P1-3 A143 同根去重与写入者边界合同冲突，按 checker 可执行动作整改或报技术卡点
seq=33 event=stage_result agent=monitor#2 note=stage_id=RLT_21:C#1 outcome=done C1(A137~A140 commit=a80fcde)+C2(三条P1返工+A141~A143 commits=0e0f24a/4105da8) 全量回归绿 skipped=0；check.C1.md FAIL p1=3 已在 C2 整改，check.C2.md PASS p1=0 p2=1
seq=59 event=done agent=lesson#1 note=review.lesson.X1.md PASS p1=0 p2=0；三条新候选=全部成立；L-001~L-004 未被改动
seq=60 event=done agent=requirement#1 note=review.requirement.X1.md PASS p1=0 p2=4；P1-1 durable 裁决=CLOSED 3 条/OPEN 0 条；代码轮合并口径已写明；变异点=移除 cancelled 后 A69 目标断言 RED，恢复后 GREEN
```

## 停止线

本记录只复核候选稿，不代表晋级、不代表 D-start、不代表验收；未替用户作信号名、计数归属或任何落盘决策。
