# review.plan — RLT_18 plan-review（plan-reviewer#1 · review_round=1 · remediation_count=0）

- 被审对象：`docs/modules/relay-light/workspace/RLT_18/task_plan.md`（builder#1 初稿，`fa304ef`），连同 `brief.md`、`findings.md`。
- 权威输入：DevPlan「#### RLT_18」（第 644–668 行）；design/01 §3.6（第 480–491 行）、§7.2（第 894–908 行）、第 115/140/189/1436–1440 行、A82/A83/A101（第 1351–1353 行）、H11/H12（第 1408–1409 行）；`tools/relay-light/skill/SKILL.md`（现行版本）；两份 adapter；`relay_log.py` / `test_relay_log.py` 现状代码。
- RELAY_RECEIPT preflight：`env | grep -c '^RELAY_RECEIPT='` = 0，按正常流程执行。
- 只读核实（未改任何文件）：`relay_log.py` 中 `derive_status`(3071)、`status_document`(3395)、`read_ledger`(1659)、`TERMINAL_EVENTS`(60)、`_runtime_plan`(1605) 均存在；从 `_runtime_plan`/`read_ledger`/`derive_status`/`status_document`/`load_config` 出发的 AST 调用闭包里**没有** `append_event`/`_add_command`/`_write_json_restricted`/`_restricted_writer`，也没有写模式 `open`，所以 R-A101-1 在现有代码上可以成立、不会误判。`status_document` 的 `agents[]` 只收 `agent_launch`（3192–3220），**不含 `monitor_launch`**。`git status --porcelain --ignored | grep -c __pycache__` = 0，与计划 §1.1 一致。

## 结论 FAIL

有 4 条 P1（判据 4/5/6/8/9 各有涉及），须回 builder 整改；其中 P1-3 里「watch 死亡如何被发现」一问可能要改 design 语义，建议 builder 若不能在 design 字面内解决，就交 decider。其余判据通过，另有 P2 若干，一并整改或在计划里写明理由。

## 逐项判据

| # | 判据 | 结论 | 级别 | 依据 文件:行 | 整改动作 |
|---|---|---|---|---|---|
| 1 | 允许路径闭集 | 通过 | — | task_plan.md:30–35；dispatch/README.md「允许路径」；DevPlan 655–664 | 三批只改 README 闭集内的文件；DevPlan 允许的用户级副本由 README 收窄给 orchestrator，计划没有越权碰副本（task_plan.md:36、144）。 |
| 2 | 写者边界 / signal / A101 | 通过 | — | task_plan.md:38、104、143、148、159；R-A101-1～3（90–92） | progress 只由 coder 每批写一条；execution_strategy 由 orchestrator 独写；signal 文件名合 README 表；watch 自身无写账路径，由静态、变异自证、运行期三层证明。 |
| 3 | 批次边界 | 通过 | — | task_plan.md:67、71、108、150、161–165 | 共 3 批。A82 与 A101 在 batch 1，A83 与 adapter 结构检查在 batch 2，H11/H12 在 batch 3；批间依赖已显式写出；workflow-final、E2 与人验都放在批外。 |
| 4a | oracle 覆盖：无立即重挂 / 30 秒 / 终态退出 / working 重挂 / 去重 / 每 agent 一线程 | 通过（有条件） | — | R-A82-2/3/4/5/6/7（81–86） | 要素都有用例认领。但 30 秒节拍能否成立还受 P1-2 影响，详见下文。 |
| 4b | oracle 覆盖：20 分钟 tick / 两层退出 / adapter 节拍归属 | 通过 | — | R-A83-1/3/5/8（123–130） | — |
| 4c | oracle 覆盖：短 ASCII 单行 | 通过（P2） | P2 | D7（59）；R-A82-1（80） | 只有正例。须补反例：ledger 标识或状态里含非 ASCII 字符或换行时，断言不调用 prompt，并在 stderr 报一行（D7 已承诺这一行为，但没有用例）。 |
| 5 | 打桩可行性 / 线程测试确定性 | **不通过** | **P1** | task_plan.md:75（`FakeClock`「sleep 只推进虚拟时间」）；R-A82-3（82）、R-A82-7（86）、R-A83-1/2（123–124）；D8（60） | **P1-1**，见下文。 |
| 6 | 实测批 H11/H12 | **不通过** | **P1** | task_plan.md:153–156；design 1409、898；adapter-claude-code.md:89–93、adapter-codex.md:91–95 | **P1-3**，见下文。H11 分 Claude/Codex 两边验、探针命名、关闭、白名单过滤、不写结论这几项都合格。 |
| 7 | 可执行性：RED 先行 / 机械判据 / 单测入口 | 通过（P2） | P2 | task_plan.md:95、98–101、133–140 | RED 先行、`-m unittest test_relay_log.WatchTests`（cwd 为 `tools/relay-light`，不用 dotted 路径）合 README 入口。P2：第 100 行「≥1 且只在 HerdrClient 内」后半句不是机械判据；而且把命令放进变量再调 `subprocess.run(cmd)` 时，grep 会漏报。建议改成 AST 断言：所有 `subprocess.run` 的第一个参数以 `"herdr"` 开头的调用都在 `HerdrClient` 内，并纳入 R-A101-1。 |
| 8a | 歧义解读 D1/D2/D5/D6/D7/D9/D10 与 design 字面兼容 | 通过 | — | task_plan.md:53–62；design 482–490 | D9「转换」口径（`working→idle→working→idle` 算两次）与 design「转换」字面一致，接受。D1 新增的 `--level` / `--config-dir` 都是可选参数，不改冻结签名，接受。 |
| 8b | D3/D4：编排级在场者的取法 | 通过（P2） | P2 | D3（55）、D4（56）；design 484；relay_log.py:3192–3220、3435 | design 写的是「读 `status --json` 取在场 agent」，但 `status` 的 `agents[]` 只含 `agent_launch`，不含 `monitor_launch`；A62 又冻结了 status schema。所以编排级盯 stage-lead 只能直接读账本的 `monitor_launch`，这偏离了 design 字面。整改：在 D3 写明「编排级在场者不经 status 投影、只读 `read_ledger`，理由是 A62 冻结」，并补用例断言编排级**不**对节点 worker 发通知（防止越级报信）。 |
| 8c | D8 / D11：herdr 失败语义 | **不通过** | **P1** | D8（60）、D11（63）；design 486 | **P1-2**，见下文。 |
| 9 | 术语：与现行 SKILL 一致 | **不通过** | **P1** | task_plan.md:118（batch 2 adapter 第 5 项）；SKILL.md:40；findings.md F-004 | **P1-4**，见下文。W/C/R/X/F 只出现在「被实现的完整 relay」语境（task_plan.md:39），合格；stage-lead / watcher 用词合格。 |

### P1-1 多线程虚拟时钟没有确定性方案（判据 5）

`FakeClock` 的写法是「`sleep` 只推进虚拟时间」（task_plan.md:75）。但 watch 同时有 N 个 agent 线程加 1 个 tick 主循环，都会调 `clock.sleep(30)` 或 `sleep(1200)`。共享虚拟时钟时，每个线程各自推进，时间会叠加：A 睡 30 秒到 t=30，B 再睡 30 秒就到了 t=60。叠加的结果取决于线程调度，于是 R-A82-3（「差均为 30 秒 ±0」）、R-A82-7（多 agent）、R-A83-1（tick 恰在 1200/2400/3600）、R-A83-2 在多线程下会出现不确定的结果。这正是判据 5 要排除的「靠 sleep 竞态」。

**整改**：在 batch 1 的「文件与符号」里写明一种确定性方案，二选一或同等方案：
- (a) `FakeClock` 做成离散事件调度器。`sleep(s)` 登记唤醒时刻后，在条件变量上阻塞调用线程；测试驱动方 `advance_to(t)` 先等全部已登记线程都处于阻塞状态，再按唤醒时刻顺序逐个放行，放行之间做「静止等待」，即等被放行线程再次阻塞或结束，并设墙钟上限、超时就 `self.fail`。
- (b) 把 `_watch_agent_loop` 拆成可单步调用的状态机（`step(now) -> next_wake`），时间与线程相关的断言在单线程里驱动。另外只保留一条真线程用例，证明每 agent 一线程，以及线程能 join 收敛。

同时写明：R-A82-3、R-A83-1 在 ≥2 线程的场景下也必须精确成立，并补一条「两个 agent 加 tick 同时存在时，各自的节拍互不叠加」的用例。

### P1-2 wait 非零退出没有退避，会退化成热循环（判据 4 / 8）

D11 写的是「wait 超时或非零 → 视为未返回，继续循环」（task_plan.md:63），D8 是分段 `--timeout 30000`。可是 herdr 名解析错、目标 agent 已关、herdr 自身报错时，`herdr agent wait` 会**立即**非零返回，线程随即再挂，形成无 sleep 的子进程热循环。这违背 design 486 的 30 秒节拍和 1437「不做秒级盯屏」，而且 batch 3 真跑时会暴露（探针关闭顺序稍错就会触发）。

**整改**：
- D11 要区分两种情况：「超时返回」（耗时 ≥ timeout）照常重挂；「提前非零返回」要先 `clock.sleep(30)` 再重试，或降级为 30 秒 `get` 轮询。
- 同样约束 `get` 连续失败时的节奏。
- 补用例 R-A82-11：桩 `wait` 立即返回 rc≠0，虚拟时钟推进 90 秒，`wait` 与 `get` 的总调用数 ≤ 4 次，而且不发 prompt。

### P1-3 H12 探针替被测对象做出了兜底动作，adapter 也没写 watch 死亡怎么被发现（判据 6 / 8）

H12 问的是「watch 进程死亡后 20 分钟兜底**是否接住**」（design 1409）。计划的探针是 watch 被 kill 后，由 coder 让 lead「按 adapter 无 watch 回退，启动前台 `herdr agent wait … --timeout 1200000`」（task_plan.md:155）。这等于由施工方人为触发兜底：展示出来的是「被提示后能回退」，不是「兜底接住了」。按 §7.2（898），有 watch 时 lead 被允许结束回合。watch 死后，tick 和状态推送都停了，已结束回合的 lead 按现行 adapter 与计划中的 batch 2 改写（115–116）**没有任何机制**得知 watch 已死。batch 2 第 3 项「watch 未启动或进程已死时回退方式 2」也没说由谁、怎样发现「已死」。

**整改**：
1. batch 2 adapter 改写必须写明 watch 死亡的发现机制，或者如实写明没有这种机制。可选思路供 builder 或 decider 取舍：Claude 侧用 `run_in_background` 运行 watch，让进程退出唤醒 session（§7.2 902 已承认后台退出会唤醒）；或者由 lead 在结束回合前自设一个 20 分钟前台或后台 dead-man 检查。第一条思路与「单独开一个 pane」（design 482）有张力。若这一点在 design 字面内做不成，按判据 8 交 decider，不得由 coder 自行发明。
2. H12 探针改为：kill watch 之后，**不向 lead 发任何提示**，按 batch 2 定稿的 adapter 原样观察，记录 kill 时刻、PID，以及 lead 下一次自发例行查看的时刻与内容，或「截至 kill 后 T 分钟未发生」。如果需要人工介入，必须在 `H12.md` 单列「操作者介入」节，写明时刻与原文，供用户判断时区分。

### P1-4 batch 2 adapter 第 5 项与现行 SKILL 的 watcher 定义冲突（判据 9）

SKILL.md:40 写的是「watcher（旁路）……`relay_log.py watch` 程序落地后由程序承担、人肉实例退役；`single-task` 模式里的 `phase=monitor` 角色就是它」。计划却要在两份 adapter 的 single-task 段补一句「single-task 不用 watch 程序（无账本），monitor 仍按 120 秒节拍」（task_plan.md:118）。事实上这句话是对的：watch 需要 `--plan` 与账本，single-task 没有账本。但它与 SKILL 字面「落地后人肉实例退役」直接冲突。SKILL 不在允许路径内，F-004 只登记了硬规则 8 与「放弃项」，**没有登记第 40 行**。

**整改**：
- 把 SKILL.md:40 的冲突并入 F-004，或新开 F-006，并交 orchestrator / decider 路由。
- adapter 措辞在裁决前只能与 SKILL 兼容，例如写成「watch 程序以账本为输入，只作用于完整 relay；single-task 的 watcher 实例何时退役以 SKILL 为准」。或者先删掉第 5 项，等裁决。
- 不得在 adapter 里单方面给出与 SKILL 相反的结论。

### P2 汇总（不阻断，整改时一并处理或写明不改的理由）

- **P2-1 tab 与 pane**：design 482 写「单独开一个 **pane**」，1440 写「Herdr tab 这一层：不使用」。计划 batch 2 第 2 项（115）让 claude 侧用 `tab create` 开 watch。现行 claude adapter 已按「一 agent 一 tab」执行（adapter-claude-code.md:42、125），与 design 的偏离早已存在，不是本卡引入的。但 watch 的启动写法应注明「沿用本侧 adapter 的载体约定」，并把 design 1440 与 adapter 的既有偏离登记到 findings（范围外）。
- **P2-2 R-A101-3 与 R-A82-4 的 patch 冲突**：R-A82-4 由测试自身调用 `append_event` 往 fixture 账本追加终态；R-A101-3 在同一运行段里 `mock.patch.object(relay_log, "append_event")` 并 `assert_not_called`。测试自己的追加会被 mock 记录或吞掉，导致误判，或者终态根本写不进账本。整改：测试侧先保存原函数引用再 patch，或直接写原始 JSONL 行；断言对象限定为 watch 线程发起的调用。
- **P2-3 batch 3 fixture 豁免**：`evidence/batch-3/fixture/<probe-id>/relay_plan.md` 与 `relay_log.jsonl` 是被测对象的输入，不是本卡的运行账本。本 reviewer 认为这与 README「不创建/读写 relay_plan/relay_log」的本意兼容，接受。条件是：路径审计命令里把豁免精确写成 `evidence/batch-3/fixture/**` 的 glob，并由 orchestrator 在 `execution_strategy.md` 或 README 记一笔。原因是 H19 要求「无 relay_plan/relay_log 的路径审计」，工作区里出现同名文件容易被误读。另外 `_runtime_plan` 走 `lint_plan`（relay_log.py:1605–1612），fixture 计划须过完整 lint，建议 batch 3 完成判据加一条 `relay_log.py lint --plan <fixture>` 退出 0。
- **P2-4 批 2 完成判据重复**：`-m unittest test_relay_log.WatchTests test_relay_log`（136）会把 WatchTests 跑两遍，改成只写 `test_relay_log`。
- **P2-5 D2 空阶段**：绑定 stage 暂时没有 active 节点时（刚 `stage_start`、节点尚未 `node_start`），「全部节点已 `node_close`」对空集恒真，watch 会立即退出。须规定为「至少一个节点且全部已关」，并补用例。

## 范围外发现

- SKILL.md:40（watcher 由程序承担、人肉实例退役）与 single-task 无账本的事实冲突，见 P1-4；建议并入 F-004 一起路由。
- design/01:1440「Herdr tab 这一层：不使用」与 claude adapter 现行「一 agent 一 tab」（adapter-claude-code.md:42、125）不一致，这个偏离在本卡之前就存在。只登记，不在本卡处理。

## 复审 round 2（plan-reviewer#1 · review_round=2 · remediation_count=1）

- 被审对象：`task_plan.md` @ `397dd58`（builder#1 整改 1 及续），连同 `findings.md`、`decisions.md`（UD-1/UD-2）、`decision.f007-watch-death.md`、`BLOCKED`/`DONE.builder.plan-remediation-1.md`、`dispatch/README.md` 与 DevPlan 的 UD-2 增行。
- RELAY_RECEIPT preflight = 0。UD-1、UD-2 是用户裁决，本轮不重新评价方向，只核落地是否忠实。

### 结论 FAIL

round 1 的 P1-1～P1-4 **全部闭合**，UD-1/UD-2 的落字也忠实。但整改引入的 D13 重启循环和 H12-② 探针带出 **3 条新 P1**，它们会让 UD-1 的①②两层在真实运行或 H12 取证中失效，须回 builder。

### round 1 P1 闭合核对

| P1 | 结论 | 依据 task_plan.md:行 |
|---|---|---|
| P1-1 线程/时钟确定性 | 闭合 | 80（离散事件调度器，`advance_to` 负责静止等待与墙钟上限，线程 sleep 不叠加）；87（R-A82-3 多线程下精确成立）；96（R-A82-12 A/B/tick 节拍互不叠加）；91（R-A82-7 真线程 + join 收敛） |
| P1-2 wait 提前失败热循环 | 闭合 | 66（D11 按耗时区分超时返回与提前失败，提前失败 sleep 30；`get` 连续失败不加速；90 秒窗口 ≤4 次）；95（R-A82-11 两子测） |
| P1-3 H12 代做兜底 / 死亡发现机制 | 闭合（机制已按 UD-1 落字；探针另见新 P1-C） | 67–68（D12/D13）；129–133（adapter 3a）；184–189（H12 两段、零提示、「操作者介入」节、模型闸） |
| P1-4 adapter 与 SKILL:40 冲突 | 闭合 | 135（原第 5 项已删）；136–140（UD-2 的 SKILL 三处，第 40 行逐字取 UD-2 原文）；153（R-A83-13 含 RED 钉 SHA）；32/36/168（SKILL hunk ≤3 的审计） |

UD-1 落地核对：UD-1 的五项在 D12/D13、adapter 3a、H12-①② 中都有对应，且无越界添加。这五项是：①pane 内 shell 重启循环、不引入 watcher agent；②编排 tick 对账后发 `stage-stalled`，lead 醒来先核 watch 存活；③编排级 pane 被关如实写「依赖人工，按 §7.3 恢复」；④完整 relay 不保留人肉 watcher；⑤停滞判定不进程序（design 1437）。UD-2 核对：README/DevPlan 允许路径已加 SKILL.md，并限定三处；task_plan §1.1/§1.2 与 R-A83-13 一致。round 1 的 P2 各项也已处理：4c→R-A82-13，7→R-A101-1 AST，8b→D3 + R-A83-10，P2-2→写原始 JSONL，P2-3→精确 glob + fixture lint，P2-4/P2-5→R-A83-11。

### 新 P1

**P1-A　D13 退出码合同与现有退出码不符，且没有区分「运行中重读失败」（判据 7/8，影响 UD-1①）**

- 现状：`relay_log.py` 对计划解析/lint 失败、配置失败走 exit **3**（`_runtime_plan` 1605–1612 把 lint 错误转为 `RelayError(3)`；design §3.1 表），账本读取/解析失败走 exit **4**（`_ledger_error`）。D13（68）却把「参数/计划/账本/无 open stage」统称 **2**，重启循环只在 `rc ∉ {0,2}` 时重拉；R-A83-12（152）也断言「计划 lint 失败 / 账本损坏 → 2」。计划没有写「watch 把 3/4 重映射为 2」，coder 复用现有函数时自然得到 3/4。结果是：启动时计划坏了，重启循环每 5 秒空转一次，这正是 D13 自称要防的情况。
- 更严重的是：D4（59）要求每 30 秒重读 plan + ledger，但计划没有规定运行中某一次重读失败怎么办。现实中有两个触发源：(a) `append_event` 用缓冲文本写（relay_log.py:2773–2774），读者可能读到最后一行未以换行结尾，`_ledger_lines` 随即判「last ledger line is not newline-terminated」（exit 4）；(b) planner-amend 改 `relay_plan.md` 并非原子写。瞬时失败如果让 watch 退出，按 2 处理就是循环停止、watch 静默永久死亡，UD-1① 失效；按 3/4 处理则会重拉，但去重被重置，产生重复通知。
- 整改：
  1. 分两类写清。**启动期**确定性错误（参数、计划不可用、配置、账本损坏、无 open stage）退出且循环不重拉；把循环的停止集合写成与实际一致，例如 `{0,2,3,4}`，或者明写 watch 统一重映射为 2，并在 R-A83-12 分别断言。
  2. **运行期**重读失败：本轮跳过、stderr 报一行、30 秒后再读，**不退出**；连续失败也不加速。
  3. 补用例：运行中把账本末行写成无换行的半行，下一轮不退出、不通知；补齐换行后恢复正常。

**P1-B　「先核 watch 存活」的 pgrep 模式分不清阶段级与编排级（判据 6，影响 UD-1②）**

- adapter 3a stage-lead 段（131）与 D12（67）用 `pgrep -f 'relay_log.py watch --plan <plan_dir>'`。可是编排级 watch 与阶段级 watch 的 `--plan` 是**同一个 plan 目录**（D1、H12-② 186 两个都跑）。阶段级 pane 被关后，这个模式仍会命中编排级 watch，lead 会误判「watch 在」而不重拉。H12-② 演示的恰好就是这个场景，兜底会在最后一步失效，取证结果也会被误读。
- 整改：存活检查必须能按层级和通知对象定位。例如匹配 `relay_log.py watch --plan <plan_dir> --notify <自己的 Herdr 名>`，要求 watch 调用行固定参数顺序，并在 R-A83-8 断言调用行里 `--notify` 紧跟 `--plan`；或者用 `--level stage` 加 `--notify` 的组合。Windows 的 CommandLine 匹配同样处理。R-A83-8 的关键词随之更新。

**P1-C　H12-② 事件顺序会让兜底不被触发（判据 6）**

- 186 写的是「让 worker 回 idle **后**关闭阶段级 watch 的整个 pane」。worker 回 idle 时阶段级 watch 还活着，它会照常通知 lead，lead 醒来处理，账本不会出现「worker 停而无终态」。编排 tick 对账也就找不到停滞，演示不到 B′ 兜底，得到的「未发出 stage-stalled」会被误读成「兜底没接住」。
- 整改：顺序改为：先在 worker 仍 `working` 时关闭阶段级 watch pane（记录时刻），再让 worker 完成短任务回 idle（记录时刻），然后零提示观察到编排下一次 tick 之后。lead 事先处于「有 watch 允许结束回合」的空闲态。`H12.md` 须记录这三个时刻，外加关闭时 `agent get` 的 worker 状态摘录。

### P2（不阻断）

- **P2-A**　H12-① 要求「只 kill Python 进程、不杀循环 shell」（185），但 `pgrep -f 'relay_log.py watch'` 在循环以 `bash -c '...'` 形式运行时也会命中 shell。建议写明取 PID 用 `pgrep -f '^python3? .*relay_log\.py watch'`，或者先 `pgrep -af` 摘录再人工挑出 python 行记证。
- **P2-B**　UD-1 ① 说的是「watch 退出后短暂等待即重拉」，D13 把 0/2 排除在重拉之外（正常结束、确定性错误），这是合理细化，不算偏离。整改 P1-A 时保持这一取向即可。

### 范围外发现

无新增。

## 复审 round 3（plan-reviewer#1 · review_round=3 · remediation_count=2）

- 被审对象：`task_plan.md` @ `59ed241`（builder#1 整改 2），连同 `DONE.builder.plan-remediation-2.md`、`decisions.md`（UD-1/UD-2）。
- RELAY_RECEIPT preflight = 0。本轮只核 round 2 的 P1-A/B/C 与 P2-A/B 是否闭合、有无新 P1；UD-1/UD-2 不重新评价方向。

### 结论 PASS

round 2 的三条 P1 全部闭合，两条 P2 已处理，没有发现新 P1。UD-1 的①②③三层与 UD-2 的 SKILL 三处，落字与上轮核对一致，整改 2 没有动到它们的语义。

### round 2 闭合核对

| 项 | 结论 | 依据 task_plan.md:行 |
|---|---|---|
| P1-A 退出码与运行期重读 | 闭合 | 69（D13）：退出码沿用现有合同，参数与无 open stage 为 2（`_error` 缺省 exit_code=2，relay_log.py:214），计划与配置为 3，账本为 4，不重映射；重启循环的停止集是 {0,2,3,4}，Linux `case` 与 Windows `-in` 两种写法同步；启动期先重试 2 次、间隔 2 秒，吸收瞬时态。60（D4）：运行期重读失败时，本轮跳过、stderr 报一行、沿用上次成功的快照、不退出；agent 线程读失败按「非终态」处理。用例覆盖：99（R-A82-14 半行）、100（R-A82-15 运行期 lint 失败）、155（R-A83-12 分码断言，含启动首读半行被重试吸收、未捕获异常 ∉ 停止集）。 |
| P1-B 存活检查分层 | 闭合 | 68（D12②）、134（adapter 3a）：用 `pgrep -f -- '…watch --plan <plan_dir> --notify <自己的 Herdr 名>'` 按层定位，Windows `CommandLine -like` 同构。69、130（D13、adapter 第 2 项）：调用行固定 `--plan … --notify …` 为 watch 之后的首两个参数。159（R-A83-8）：断言每条 watch 调用行都匹配 `watch --plan \S+ --notify \S+`，且含带 `--notify` 的 pgrep 原文。 |
| P1-C H12-② 顺序 | 闭合 | 189：worker 处于 working 时先关阶段级 watch pane（T1，附 worker 状态摘录）；worker 回 idle 记 T2；零提示观察到编排 tick（T3）之后。编排级 watch 须在 T1 前已运行，保证窗口内至少有一次 tick。另外还要核实 lead 没有被编排级 watch 误判为「在」。 |
| P2-A H12-① 取 PID | 已处理 | 188：用 `^python3? .*relay_log\.py watch --plan <fixture> --notify rlt18-probe-lead-` 取 python 行，先做全量摘录，证明循环 shell 的 PID 不变、python 的 PID 已变。 |
| P2-B 0/确定性错误不重拉 | 已处理 | 69 末句写明这是细化、不是偏离 UD-1①。 |

### 新 P2（不阻断，batch 2 施工或 batch-review 时顺带处理即可）

- **P2-C　`--notify` 名的前缀误命中**：`pgrep -f` 与 `-like '*…*'` 都是子串匹配。如果 stage-lead 名是另一个在场 watch 的 `--notify` 名的前缀（例如 `p21-C1` 与 `p21-C1-2`），存活检查可能误判「在」。调用行已固定 `--notify <名>` 后紧跟 ` --level `，建议 adapter 的存活检查模式把 ` --level` 也带上，写成 `--notify <名> --level stage`，并同步 R-A83-8 的关键词。

### 范围外发现

无新增。
