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
