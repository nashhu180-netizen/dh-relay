<!-- findings.md — 问题清单。边做边记。 -->
# findings — DHR_70

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-7001 | P1 | 承接 DHR_35 的 `F-3514`：Claude Receipt 提交撞 `E_LEASE_HELD:actor-closed`，节点停 `running` 无 Result（E-3526）。**根因已由 A2 夹具钉死 = H1**：`driveRun` 的 done 回调在 `hasOpenSubmissionGates` 为真时故意保留 driver（`service.mjs:301`），但 driver 构造时捕获了 `actor` 引用（`workflow-driver.mjs:95`）；actor 一失租关闭，这条被特意保留的 gate 就指着一具尸体，而 `submitExecutorResult` 首轮 drivers 循环里 `tryDriver` 直接 `throw`，走不到后面从 durable 事实重建 actor/driver 的兜底 | E-7005（只读侦察）、E-7006（A2 红测同码复现）、E-7007（修后转绿） | 已在 `service.mjs` 的 `submitExecutorResult` 首轮 drivers 循环加 `evictClosedActor`：**只**认 `E_LEASE_HELD:actor-closed`，摘掉这一届 driver 与已关闭的 actor 后 `continue`，交给既有 durable 路径重取 lease、重建 actor 与 gate。未动 `host.mjs` 的拒绝条件，未动 lease 单写者合同 | closed |
| F-7003 | P2 | **master 基线本来就红**：`npm test --prefix relay-core` 在本机 master 上 291 tests / 275 pass / **16 fail**。其中 `identity-quota.test.mjs` 的 DHR_34 族 9 条稳定失败（隔离单跑同样 12 tests / 3 pass / 9 fail），形态是**等满约 60s 后断言 `0 !== 1`**（如 `identity-quota.test.mjs:227`）——等一个永远不来的事件，不是并发抖动，`agent-node.test.mjs` 的「DHR_33 窄路径」隔离单跑在 master 与本卡上**同样红**；余下几条在两次同代码全量跑之间集合不同（`--test-concurrency=4` 下的负载抖动），隔离单跑即绿 | E-7007 | **不修**：identity-quota / agent-node 都不在本卡允许路径，改它们既越界也会污染本卡的"没修过头"判据。**尾巴裁决（用户 2026-09-01 对话点选）：入 backlog**，与 F-7004 合并为同一条（根因已定位到 EPERM）。本卡的对齐判据改为**逐条比对失败集合**而非只看数字。**⚠ superseded（2026-09-01 收口）**：左栏「形态是等满约 60s 后断言 `0 !== 1`——等一个永远不来的事件」这句**已被 F-7004 取代**——真实报错是 `%TEMP%` 原子重命名 `EPERM`（见 E-7018），60s 是等待超时的表象而非成因。原句按候选-10 保留不改，以此指针作废。另「余下几条…隔离单跑即绿」的抖动判据也已被 E-7016 的三轮实证取代（原判据本身命中候选-48，见 F-70-LES-01） | **遗留→backlog（已确认）** |
| F-7004 | P2 | 本机 `%TEMP%` 下 `state.json` 的原子重命名会**间歇性** `EPERM`，任何写状态的测试都可能因此假红——包括本卡 A2（还原变异后的首次复跑就撞上一次）。这也是 F-7003 那批稳定失败的真实报错，比原先记的「等一个永远不来的事件」准确 | E-7018、E-7016 | **不修**：属本机环境（实时扫描/索引占用句柄），不在本卡允许路径也不在 relay 代码范围。已把它从「未知原因的稳定红」升级为「已定位的环境故障」并留精确报错文本，供后续卡判红时先比对签名。**尾巴裁决（用户 2026-09-01 对话点选）：入 backlog**，且用户明示这条优先——它污染的是整仓测试可信度 | **遗留→backlog（已确认）** |
| F-7002 | P3 | `runHostSession` 的 lease TTL / tick 不可从 `createHostSessionActor` 外部注入（`service.mjs:223` 只传 `repoRoot/runId/gitBin`），A2 夹具只能等 5s tick，单例 6.3s | E-7006 耗时 | 记录不修：注入点属 host 合同，本卡非目标。**尾巴裁决（用户 2026-09-01 对话点选）：明确挂起**——只影响测试耗时（A2 单例 11.6s），套件真变慢再议 | **挂起（已确认）** |

## E 阶段复核发现（五路）

| ID | 级别 | 提出者 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|---|
| F-70-R1-01 | P2 | `dhr70rev1`（代码轮 1） | A2 只断言"提交成功 + Result 唯一 + 重投幂等"，**没证明提交是经由新取的 lease 落地的**。一个绕开 lease、直接往 Store 落盘的错误实现能让 A2 保持绿——而 A2 口径原文要求"service 新取 lease、新 actor、重建 gate" | E-7008（派出）、E-7010（整改后复跑） | 提交 `8ed411d`：A2 补 `holder_pid === process.pid`、`epoch === held.epoch + 2`、`lease_acquired` 序列恰新增一条。轮 1b 独立推演三条均非装饰性并判**闭合** | closed |
| F-70-R2-01 | P2 | `dhr70rev2`（代码轮 2） | A2 只证了口径的**后半句**。原文是"旧 actor 对提交**拒绝且零 mutation**；service 新取 lease…"，而轮询里含 `lease-lost` 的响应被直接丢弃，既没核拒绝码、也没核那一刻账本没动。一个"被 fence 时顺手写非 Result 事件、之后再照常重建"的实现能一路绿 | E-7011（派出）、E-7015（整改后复跑） | 提交 `1e118a2`：每一次被拒都走 A3-1 同款 `assertRejected`（`E_LEASE_HELD` + 零 Result）+ `events.jsonl` 逐字节不变，另加 `refusals >= 1` 防"一次就成功因而什么都没证" | closed |
| F-70-REQ-01 | **P1** | `dhr70req`（需求方向） | design/12「Gate 生命周期」末句字面为"正常完成前，service **不得从 drivers map 删除**该 receiver gate"，而本卡实现先删死 driver 再重建 → review.md 的「契约无变化」声明不成立。**一致性复核裁决 1/2 独立指到同一处**，两路互不相干却收敛 | E-7012、E-7013 | **用户 2026-09-01 对话点选「扩路径，本卡同步掉」**。已把 design/12 与本 DevPlan 卡节按限定范围扩入允许路径并记明授权；design/12 末句改为「gate 不得失去**可达性**：可摘除 actor 已关闭的陈旧 driver 条目，但必须按同一 Receipt 从 durable 事实重建；晚交不得绕过 gate、不得要求新签 Receipt」，并附 DHR_70 同步说明（含"单写者一律不放宽"的不变部分）。review.md 声明改为**契约同步** | closed |
| F-70-REQ-02 | P1 | `dhr70req`（需求方向） | A2 未证明旧 actor 零 mutation 与完整合法换届 | E-7010、E-7015 | **后续整改已闭合**（表述经轮 2b 纠正）：本条**对其审查基线 `b6a3b47` 而言是真实问题**，两个缺口分别由 `8ed411d`（合法换届：lease/epoch/`lease_acquired`）与 `1e118a2`（拒绝阶段零 mutation）闭合——它与 F-70-R1-01/F-70-R2-01 是同一缺口的两个面。⚠ **原表述「提出时已过期」已作废**：那把一条有效发现的成因推给了派单基线。派单基线写死是**主控自己的流程错误（L-7007）**，不构成对该发现的减分（轮 2b `dhr70rev2b` 指出，已采纳） | closed |
| F-70-REQ-03 | P2 | `dhr70req`（需求方向） | review.md AI 提交区仍写"尚未施工"，A1~D 证据列与达成列全空，不能作需求境证据或 H=0 放行材料 | — | 属 E8 未做，非缺陷。已在 E8 逐条挂证据补齐 | closed |
| F-70-R2B-01 | P2 | `dhr70rev2b`（轮 2b 复验） | **终态越界证据的计数失实**：E-7020 与 review.md 均写「21 个文件、workspace 15 个」，实际 `git diff --name-only master..HEAD` 为 **23 个 / workspace 17 个**。逐条路径确实都在允许集内（复核者亦确认无越界），但**拿错数字当放行材料本身就是缺陷** | E-7022 | 采纳。根因：该计数是在最后两笔提交落盘**之前**取的，却被当作「终态」自查写进放行包——**候选-49 在 diff 计数上的同形复发**。已在最终提交上重取并改正，记 L-7010 | closed |
| F-70-LES-01 | P2 | `dhr70les`（教训） | **真重蹈候选-48/12/23/31**：E-7007 用"隔离单跑一次绿"就推出"两条新红都是并发抖动、零新增失败"，证据覆盖不足以支撑该全称结论 | E-7016 | 采纳。同一份代码连跑 3 次全量，用**失败集合两两比对**直接证明抖动。结论按轮 2b 意见再收窄一档：**「本次样本 / 可比条件下未见新增稳定失败」**——不外推成全仓永久零新增（否则就是在修完一个过度声称之后又立一个新的）。见 E-7016 | closed |
| F-70-LES-02 | P2 | `dhr70les`（教训） | 命中候选-51/58：异步套件门槛账本未记 exit code 与 wall-clock | E-7016 | 采纳。E-7016 逐轮记 exit code + wall-clock；E-7015 补记定向套件的 exit code | closed |

> 一致性复核（`dhr70con`）**零遗漏**，两处裁定为「有意差异」（`actor-closed` 用完整 message 精确匹配 vs 常规只留 reason 前缀；gate 可长于创建它的 actor），两条的建议落点均为 design/12 —— 已随 F-70-REQ-01 一并落地。

> 级别：P0 阻塞发布 / 数据丢失 / 安全 · P1 阻塞任务目标 · P2 质量 / 证据缺口 · P3 后续不阻塞
> 遗留（P0/P1 唯一合法路径）：状态列写 `遗留→<卡号 / backlog>（已确认）`；没有"已确认"三字仍按 open 处理。
