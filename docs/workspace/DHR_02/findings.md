<!-- findings.md — 问题清单。🟢 边做边记。 -->
# findings — DHR_02 实现最小 Runner 与确定性 fake replay

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|----|------|------|------|------|------|
| F-001 | P3 | v1 event kind 枚举无 `plan_rejected`，proposal 被拒只能借 `plan_proposed`+reason 落账（task_plan K-1）；目标形态可考虑扩枚举（属 DHR_01 契约变更，需重新过契约测试） | 主控 Code Scout | 记录·不在本卡改契约 | open（backlog 候选） |
| F-002 | P3 | `LaunchDeadlineSeconds` 是本卡追加进 `relay-params.psd1` 的第五键（DHR_01 未冻结该值）；as-built/relay-contracts.md 收口时补记 | task_plan A1 | 收口时更新 as-built | open |
| F-003 | P2 | （轮2 复验：修了未锁——「旧 depends_on 被删」分支删 L40 仍全绿，其余 3 分支已锁）K-8 replan 兼容 6 谓词只有「丢旧节点」被断言；role/brief_ref/next_action 改变、旧 depends_on 被删、新增指向旧节点的依赖、resume_from 指向别节点 4 分支零断言（删 `Test-RelayReplanCompatible` L39~42 任一行全绿），reason 同码守卫看不见 | E4（subagent）| reopen（轮2 P-A1b·返工轮2 补 plan-v2-bad-drop-dep 夹具+断言） | resolved（返工轮2 ffbaf92） |
| F-004 | P2 | Runner 入口 schema 拒收分支（`proposal-rejected:<schema reason>`）与 `proposal-immutable` 无 Runner 级断言（删 L48-49 全绿）；根因 reason 守卫把 `a:b` 归一到前缀 `a`，`proposal-rejected:*` 子码全盲 | E4 | resolved（返工轮1 39425b2） | resolved（返工轮1 39425b2） |
| F-005 | P2 | `Apply-RelayObservation` probe_error 路径无 `final_committed` 守卫：blocked 节点（final 已提交、stop 后等 exited）连续 3 次 probe_error→`dependency_blocked→interrupted_unknown` 无边→节点 paused/`probe-lost`；后续 replan 只复位 `scheduling='blocked'`，该节点永久卡 paused、fresh A 拉不起。fake 夹具 on_stop 全 exited、`ignore` 分支从未走过，真实 psmux 停掉的 session 很可能返 probe_error | E4 | resolved（返工轮1 39425b2） | resolved（返工轮1 39425b2） |
| F-006 | P3 | 两条回放里程碑用 `Assert-Subsequence`，中间夹杂带 reason 事件不会红；decision 期望只覆 11 行中 7 行 | E4 | resolved（返工轮1 39425b2） | resolved（返工轮1 39425b2） |
| F-007 | P3 | 「receipt 写入后进入 launching」无直接断言 | E4 | resolved（返工轮1 39425b2） | resolved（返工轮1 39425b2） |
| F-008 | P3 | 无输入 API 静态扫描未覆 `adapters/fake-adapter.ps1`；`Open-RelayRun` 无测试；`Invoke-RelayTick` 遍历 `state.nodes.Keys` 无序（同 tick 多节点带 reason 事件相对顺序理论上不定） | E4 | resolved（返工轮1 39425b2） | resolved（返工轮1 39425b2） |
| F-009 | P3 | K-8 `resume_from.attempt_id` 未校验；「先 ack 后回收」只证 stop 是最后一次调用、调换顺序不红 | E4 | resolved（返工轮1 39425b2） | resolved（返工轮1 39425b2） |
| F-010 | P3 | 无「decision_required 挂起超 StallThreshold 不判 stalled」「decision 期间 probe 连败→unknown/interrupted_unknown」的 Runner 级断言 | E4 | resolved（返工轮1 39425b2） | resolved（返工轮1 39425b2） |
| F-011 | P2 | 事件 `occurred_at` 确定性零断言（task_plan A6⑯ 要求"等于注入时钟"）：把 store 的 occurred_at 改 UtcNow 后 11 套件仍全绿；实现本身正确 | 轮1 account4 探针 P-04 | resolved（返工轮1 39425b2） | resolved（返工轮1 39425b2） |
| F-012 | P3 | blocked 路径 `adapter.stop` 返回 ok=false 被静默丢弃（task_plan 写"记 findings"实际无任何记录） | 轮1 account4 | resolved（返工轮1 39425b2） | resolved（返工轮1 39425b2） |
| F-013 | P3 | F-004 守卫改完整码后仍看不见 `Submit-RelayProposal` 里 `Add-RelayProposalRejection $Run $Proposal 'proposal-rejected:<sub>'` 各行（行内无 `reason=`/`reason` 字样，不进生产扫描）：主控探针把 `wrong-run` 改名 `wrong-run-zzz` 守卫仍 PASS（行为断言仍红，属守卫盲区非行为缺陷） | 主控返工轮1 探针 D | 返工轮2 顺带：生产扫描触发条件加 `Add-RelayProposalRejection` 行 | resolved（返工轮2 ffbaf92） |
| F-014 | P1 | 空文件（0 字节）result/checkpoint 提交抛 `null-valued expression`（`ConvertFrom-Json ''`→$null 穿过 Read-RelayJson 的 try/catch→`Get-RelayResultVerdict` 对 $null 调 ContainsKey），无 `result_rejected`/`checkpoint_rejected` 事件；不存在路径/目录路径正确走 unparseable | 轮2 account9 探针 B-4b | 返工轮2：`Read-RelayJson` 解析结果非 hashtable（$null/数组/标量）→throw；摄入入口 catch 后走 `unparseable-result`/`unparseable-checkpoint`；测试用静态空文件夹具 `fixtures/runner/results/result-empty.json`（0 字节）+ checkpoint 同 | resolved（返工轮2 ffbaf92） |
| F-015 | P2 | 外部改坏 relay-state.json（多键）后 `Open-RelayRun` 不校验；`Submit-RelayProposal` accept 路径先写 proposal/authority/active-plan 再 `Save-RelayState` 抛→磁盘部分写（authority 声称 gen=1，state 仍 0，事件 0 条），run 卡死 | 轮2 探针 B-5b | 返工轮2：`Open-RelayRun` 读入即 `Test-RelayStateSnapshot` 不过 throw `state-invalid:*`；`Submit-RelayProposal` 在写任何文件前先对「更新后的 state 副本」跑 `Test-RelayStateSnapshot`（不过→拒 `proposal-rejected:state-invalid` 不写盘）；断言：改坏 state 后 Open 抛 + accept 不写 authority | resolved（返工轮2 ffbaf92） |
| F-016 | P2（复核者报 P2·主控裁 P3：Runner 自身 IO 故障下的事务性属目标形态，P1 单机 fake 场景不触发；但落账顺序须一致并文档化） | 事件追加与状态 Save 无事务边界：events.jsonl 不可写→state 领先事件；relay-state.json 不可写→事件领先 state；`Open-RelayRun` 无对账 | 轮2 探针 B-6a/B-6b | 返工轮2 顺带：统一顺序「先 Save state 再 Add event」（现有 3 处反序 L151/155/167 改齐），runner/README 记明"IO 故障双写不原子·目标形态补对账"；不新增对账逻辑（backlog） | resolved（返工轮2 ffbaf92·顺序统一+文档；对账→backlog） |
| F-017 | P3 | paused 节点的依赖者永久 waiting 行为正确但零断言 | 轮2 探针 B-7 | 返工轮2 顺带：failures 套件加 1 断言（A paused 后 C waiting、ready 空） | resolved（返工轮2 ffbaf92） |
| F-018 | P3 | fake adapter `emit_observation` 对已 stop 的 session 仍吐 host 事件 | 轮2 探针 B-8 | 返工轮2 顺带：stop 后清空该 session host 队列 + 断言 1 条 | resolved（返工轮2 ffbaf92） |
| F-019 | P3 | 返工轮2 DONE/findings 自报 commit `5b6ceb9`，git log 实为 `ffbaf92`（L-010 类自报笔误；主控以 git log 为准，findings 各行 SHA 收口时机械纠正） | 主控 git log | 记录；收口时把 findings 中 `返工轮2 ffbaf92` 替换为 `ffbaf92` | resolved（记录） |
| F-020 | P3（复核者报 P2 偶发·主控裁 P3：可归因于编排事故） | 轮2b fresh 复验首跑（17:18）ingest 在 F-014 空文件断言处崩溃一次（签名=守卫缺失时的 null 异常），此后 40+ 次干净执行未复现，静态分析证守卫在位时不可达。主控归因：同一时段一个漏派 brief 的 reviewer 进程（首派失败后 TaskStop 未真正杀掉、17:22 才手动确杀）在同一任务树上做变异探针，与 fresh 复验并发——首跑读到了被临时删守卫的 relay-store.ps1 | review-logs/review-round2b.fresh.md N-01 + 主控进程记录（PID 59260 存活到 17:22） | 记录；教训入 lesson_candidates（复核并发须隔离工作树或串行）；若干净树复现即回升 P1 | resolved（记录·归因编排并发） |

> 级别：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞
> 遗留（P0/P1 唯一合法路径，DC_46）：状态列写 `遗留→<DC_xx / backlog / 下计划名>（已确认）`——"已确认"三字代表用户已在对话里明确点头；没有这三个字，`dh-check` R13 仍按 `open` 处理。
