<!-- dh:v1 -->
# review — DHR_51

## 独立复核区

### E4 需求复核（2026-08-22，fresh 只读 · 需求视角）

- **复核实例**：E4Requirement（fresh subagent，零上下文，只读；未参与实施）。基线 `HEAD = f34f1a5`（wt/DHR_51），diff = `master..HEAD`（18 文件 +1203 −8）。只读验证命令实跑：`npm test` 41/41 绿、`validate --selftest` pass=33 fail=0、`audit-contracts` 全绿（token 164 未登记 0）、`fixture-manifest` 55 份相符、`capability-baseline` 8 份相符且 `capability_hash=970b54601ae582a5…` 与 DHR_29 收口值零漂移；`node runtime/status.mjs <run_id> --root <p>` 命令行形态冒烟通过（输出 JSON、exit 0）。
- **复核依据**：brief.md 完成条件 7 条、DevPlan §3.2 DHR_51 卡（目标/非目标三条硬边界/验收 6 机器证+1 人判/实施提示 6 条）、relay-core/README.md 硬约束 6 条、compat-matrix §6 移交三条、reason-codes.md。

### 完成条件逐条核对

| # | 完成条件 | 落点（文件 / 测试锚点） | 结论 |
|---|----------|------------------------|------|
| 1 | Detached 宿主在终端关闭后存活推进或可恢复；DSH 不参与（P5-M1） | `runtime/host.mjs` `startDetachedHost`（`spawn detached+unref`、stdio 丢弃）；`test/runtime.test.mjs`「host：detached 宿主存活可读（P5-M1 机器面）；强杀 -9 后 Store 重建逐字节同签名（P5-M3）」——真实 detached 子进程存活探针 + `readHostStatus` 观察到 `alive` | ✅ 机器证已实现且实跑绿；真实「关终端/断 SSH」场景归条件 7 人判 |
| 2 | 强杀后新宿主重建逐字节相同 `state_signature`；第二宿主 `E_LEASE_HELD`；过期/持死人可接管；三态读数正确（P5-M3 整条） | `runtime/lease.mjs`（wx 独占、epoch、接管、`inspectHost` 三态）；`runtime/host.mjs` `runHostSession`（openStore fail-closed 重建 + writeGuard=fencing）；`test/runtime.test.mjs`：P5-M3 主用例（SIGKILL 后 `openStore` 重建 `deepEqual preKill` 逐字节同、接管 epoch 1→2、事件账 kind 序列 `run_created→lease_acquired→lease_expired→lease_acquired` 全量过契约）、「lease：首取 epoch=1；第二宿主 E_LEASE_HELD」、「lease：TTL 过期可接管 epoch 递增」、「lease：持有人进程已死视同过期可接管」、「lease：inspect 三态与 acquire 成败构成不变量」、「status：读数区分三态并带账面」 | ✅ 全链机器证齐，实跑绿 |
| 3 | Store 根落 `<repo>/.dh-relay/<run_id>/`；`.gitignore` 前置 fail-closed 且按 `git check-ignore` 语义判定；不改业务仓 `.gitignore`；零误跟踪双证（P5-M8a + F-009） | `runtime/gitignore.mjs`（`git check-ignore -q`，exit 1 → `E_GITIGNORE_MISSING`，其余错误一律 fail-closed，零写入）；`runtime/startrun.mjs`（`root = join(repoRoot, '.dh-relay', runId)`）；`test/runtime.test.mjs`「startRun：缺忽略前置 → E_GITIGNORE_MISSING 且零落盘；任意深度模式放行（F-009 反例）」（反例 = `.dh-relay/` 任意深度模式，字面量实现会假阴性——按 Git 语义必须放行）、「startRun：同仓连发序号递增、复合键入账；零误跟踪双证（P5-M8a/M8b）」（`git ls-files -- .dh-relay` 空 + `git status --porcelain` 净） | ✅ 三件套齐（语义判定/不改仓/双证），实跑绿 |
| 4 | `run_id = R<nnn>-<slug>-<yyyyMMdd>` 规范化 + 仓级锁内发号：真并发两进程各得不同序号、无跳号无重号；`(repo, run_id)` 复合键唯一；slug 五反例拒绝且不静默截断；锁有超时与陈旧回收（P5-M8b + D23 + 实施提示 4/5） | `runtime/runid.mjs`（SLUG_PATTERN、报错携带原输入证明未静默改写）；`runtime/repolock.mjs`（wx 独占 + TTL/死 PID 陈旧回收 + `E_REPO_LOCK_TIMEOUT` + release 校验持有人）；`runtime/startrun.mjs`（锁内 `max_seq+1` 发号、复合键查重、tmp+rename 原子回写）；`test/runtime.test.mjs`：五反例测试（中文/大写/空格/超长/首尾短横线各拒且带 `slug-*` 子码）、「repolock：活锁超时拒、陈旧锁（死 pid）立即回收、释放后可重取」、「startRun：真并发两进程同时发号——不同序号、无跳号无重号」（两个真实子进程 `concurrent-issue.mjs`，断言 seq=[1,2] 且索引账面一致） | ✅ 真并发落实（实施提示 4 的进程级并发非单测形态）、锁超时+陈旧回收落实（提示 5），实跑绿 |
| 5 | F-011 封堵：终态 kind 不能经 raw `appendEvent` 落账，只能经 `appendResult`；回归反例钉住 | `store/store.mjs`（`TERMINAL_RESULT_KINDS` 在公开 `appendEvent` 入口抛 `E_TERMINAL_STATE_CONFLICT:<kind>-via-raw-append`，内存账与落盘双零变化）；`test/store.test.mjs`「Store：F-011 封堵——终态 kind 不得经 raw appendEvent 落账」（三终态 kind 各拒 + `appendResult` 仍为唯一通道） | ✅ 封堵在库级入口（比 runtime 层不暴露更严，堵死 DHR_52 旁路，符合 finding 处置本意）；`E_TERMINAL_STATE_CONFLICT` 为既有协议码，未新增码 |
| 6 | lease 语义等价性复核：用 P1 恢复锁/CAS 用例（`result-A1-wrong-generation.json` 权威代次拒收语义为 Oracle）证明 v2 lease+fencing 不弱于 v1 `authority_generation`；结论落账 | 机制与测试：`lease.mjs` fencing（写前 `verify()` 重验 pid+epoch）+ `host.mjs` writeGuard 接线 + `test/runtime.test.mjs`「lease：僵尸持有者——租约被换手后 verify 失效、renew 拒绝（fencing 本体）」+ `test/store.test.mjs`「Store：writeGuard 失守时拦截一切变更，事件与工件零落盘（fencing 接线）」；等价映射注释：`lease.mjs`/`host.mjs` 头注释（与 v1 CAS 同强度） | ⚠️ **部分完成**：机制与语义映射测试已实现（陈旧权威 ≙ 失去 lease、写必拒，与 v1 wrong-generation 拒收同构，且「死 PID 视同过期」登记为强于 v1 的差异）；但 **① 未按卡面用 P1 fixture 作 Oracle 直接复验**（`result-A1-wrong-generation.json` 与 `relay-runner-authority.ps1` 的 `stale-generation` 断言在测试中零引用，等价性靠手写映射用例而非跑 v1 用例）；**② 结论未落账**（findings 仅 F-104 附带一句，as-built §8.4 未回写，无正式复核结论条目）——详见缺口 B/C |
| 7 | 人判需求境证据：真实开 Run → 关全部终端/断 SSH → 隔段时间回来 → 跑状态读数看到宿主与账都在，实录留 progress.md | `runtime/status.mjs`（观察手段已具备，实测可用）；`test/runtime.test.mjs`「host：detached 宿主存活可读」为**机器面**探针，非真实终端场景 | ⚠️ **收口前待办，未执行**（进度停在 E0 前置→派复核，属正常时序）；但 task_plan 步骤表**无对应执行步骤**、progress「下一步」未列人判——计划缺口见缺口 D |

### 卡面硬边界核对（三条 + B7 半条）

| 硬边界 | 核对结果 | 证据 |
|--------|----------|------|
| 不注册 `bin`、不占 `relay` 命令名 | ✅ 守住 | `package.json` diff 仅 `scripts.test` 追加 `test/runtime.test.mjs`，**无 `bin` 字段**；无 `cli/` 目录；交付形态 `node relay-core/runtime/status.mjs <run_id> [--root <p>]`（`host-main.mjs`/`status.mjs` 头注释明写「不是 CLI 命令、不注册 bin」，冒烟实测 CLI 形态可用） |
| 三态不定义新协议对象、不动 `relay.host-observation/v1` | ✅ 守住 | `lease.mjs` 文件 `host-lease.json` 是运行现场内部状态（无 `protocol` 字段、不进契约）；`grep runtime/` 对 `host-observation` 仅命中 `status.mjs` 注释（声明不动）；`contracts/` 与三份基线在 diff 中**零改动**（实测 `capability_hash=970b5460…` 与 DHR_29 收口逐字一致）；三态只以库返回值（`inspectHost`）+测试断言+status JSON 呈现 |
| B7 只承接三态半条、收口不得按整条记过 | ✅ 守住（三态半条实现） | `status.mjs` 只做「宿主活着/已死/lease 过期」三态 + Store 账面（state.json/events.jsonl 只渲染不推导，符合 §2.3）；**双根发现（v1 存量 run 投影）未做、正确未做**（归 DHR_30）；实施提示 2 遵守——run/node 状态全部来自 `state.json`（`ledger` 直接取 `run_status/group/progress/state_signature`），无自行推导 |
| 不做任何 CLI/Read Model/list/inspect/events/start/stop/resume | ✅ 守住 | diff 无 `cli/`、无 Read Model 对象、`status.mjs` 输出是 JSON 文档（三态+账面），不含命令集 |

### 范围漂移与缺口

**越界类（已预登记/有先例，非静默）**：
- A. `store/store.mjs` 触碰（F-011 封堵 + 通用 `writeGuard`）——brief「授权范围内的 store 触碰」预登记，findings F-101 登记，最小 diff（约 20 行），回归钉两测。合理且必要（库级洞不堵会给 DHR_52 留旁路）。`package.json` 的 `scripts.test` 改动系测试接入必需（DHR_29 同例），F-101 已注明未注册 bin。
- 未发现任何目标外文件写入（无 rpc/cli/adapters/workflows、无 contracts 触碰、无 README/.gitignore 改动）。

**该做未做（缺口）**：
- B. **as-built/relay-core.md 未更新**（brief「触及子系统」明确要求）：应新增 runtime 小节（宿主/lease/发号/恢复/三态读数）、§3.5 刷新（F-011 关账、撕裂窗口评估结论）、§8.4 lease 移交回写、目录表 `runtime/` 行与 test 计数（现仍写「DHR_51（尚未建）」「contracts 10 + store 11」）。`git diff master..HEAD` 中 as-built 零改动。P2。
- C. **移交② 等价性复核结论未落账 + Oracle 未按卡面复验**：brief 条件 6 要求「用 P1 恢复锁/CAS 用例（`result-A1-wrong-generation.json` 为 Oracle）复验 + 结论落账」——fixture 零引用（仅 DHR_29 的移交②迟到结果那条用了 P1 fixture，属另一条）；findings/progress/as-built 均无正式等价性结论条目。机制已实现且测试钉住，缺的是「对照 v1 用例跑一遍 + 落账」两步。P2。
- D. **人判需求境证据（条件 7）无计划化**：工具已具备（status.mjs），但 task_plan 步骤 1~9 无「真实开 Run→关终端→隔时回来→读数实录」步骤，progress「下一步」未挂人判；属收口前待办，但需先补计划（含 E-ID 回链格式）再执行。P3。
- E. **progress.md 证据粒度薄**：仅 3 行过程账，无 E-ID 逐条证据表（DHR_29 先例 E-001~E-019），五道闸实跑结果无回链锚点；findings F-101~F-104 全部 `open（待轮2 复核确认）`，尚未有复核实例核销。P3。
- F. **测试隔离缺陷（违反自身关键决策）**：`test/runtime.test.mjs`「startRun：缺忽略前置…任意深度模式放行」用例未注入 `indexPath`，每次 npm test 真实写入 `~/.dh-relay/runs.json`（实测现含 9 条 `dhr51-repo-*` 测试临时仓记录，本次复核跑测又增一条）——直接违反 task_plan 关键决策「测试永不触真 home」与卡面「索引路径可注入供测试隔离」的意图；用户级跨仓索引被测试数据污染且随跑测累积。修复=该用例补 `indexPath`。P2。
- G. 发号失败路径的边界：`createRunWithNumbering` 先建 run 根/写事件、后写索引（tmp+rename），若索引回写失败会留下「run 已建、序号未记」现场（下次 max+1 重号）。属并发语义外的失败原子性边角，卡面未要求，登记观察不阻塞。P3。

### E4 结论

**needs_evidence**。

依据：7 条完成条件中 1~5 机器证全绿（本次只读实跑 npm test 41/41 + 四道闸全绿 + capability_hash 零漂移，可复跑）；三条硬边界 + B7 三态半条全部守住，无静默越界、无契约触碰、无新协议对象。不判 approved 的原因：条件 6（移交②）未按卡面用 P1 fixture 作 Oracle 复验、等价性结论未落账；条件 7（人判）收口前待办且无计划步骤；as-built 未按 brief「触及子系统」更新（缺口 B/C/D）。不判 escalate 的原因：无 P0/P1、无未登记越界、机器证可独立复跑、核心语义（fencing 不弱于 v1 CAS 的机制与测试）已成立，缺的是证据形态与收口落账。

需补（按优先级）：①移交②用 `tools/tests/fixtures/runner/results/result-A1-wrong-generation.json` + `relay-runner-authority.ps1` 的 `stale-generation` 语义做 Oracle 复验并落账（findings 正式条目 + as-built §8.4 回写）；②as-built 新增 runtime 小节 + §3.5 F-011 关账/撕裂窗口评估结论；③修复测试触真 home 的用例（补 indexPath）并清理既有污染记录；④task_plan 补人判需求境执行步骤，收口前完成实录。

---

### 第一轮·全面复核（2026-08-22，fresh 只读 · 代码视角）

- **复核实例**：ReviewRound1（fresh subagent，零上下文，只读；未参与实施）。基线：**复核期间 HEAD 三次前移——`f34f1a5`（原批次）→ `67cc8c4`（收敛批：移交② Oracle 复验 + 索引锁跨仓互斥 + F-009 测试隔离 + F-105~108）→ `8960ae3`（P1 修复批 66d24e3 + F-109 登记）**，三版全部复核；最终复核基线 `git diff master..8960ae3` = 21 文件 +1427 −8。worktree 余 Main 的 knowledge/progress 未提交增量（与代码无关）。
- **只读验证实跑（最终 HEAD 8960ae3 + 在场测试）**：`npm test` **48/48** exit 0；`validate --selftest` pass=33 fail=0；`audit-contracts` 全绿（token 164 未登记 0）；`fixture-manifest` 55 份相符；`capability-baseline` 8 份相符、`capability_hash=970b54601ae582a5…` **零漂移**（契约零改动，与 DHR_29 收口逐字一致）。
- **探针（只读，mkdtemp 隔离，已清理，均复跑于修复后 HEAD）**：①lease 空/损坏文件接管——修复前两版 HUNG-2s；修复后 `8960ae3` **空文件→立即接管（epoch=1）、损坏 JSON→接管、目录占位→有界 `E_LEASE_ACQUIRE_TIMEOUT`，全部不再挂死**；②跨仓并发丢索引分段——`f34f1a5`/`67cc8c4` 复现丢段（130004→130007），修复后 `8960ae3` **10 轮 4 仓全零丢失**；③单锁文件双进程并发持有时段重叠——修复前 40/40 双持有人（含偷在途锁），修复后 **0/20 重叠、互斥成立**；④真实 home 污染实证（`C:\Users\nash\.dh-relay\runs.json` 含 `dhr51-repo-*` 历史记录，用例已修、记录待清）。

### Findings（R1-xx）

| ID | 级别 | 问题 | 证据（文件:行 / 探针） | 建议 |
|----|------|------|------------------------|------|
| R1-01 | P1 → ✅ 已修并复验（66d24e3 + F-109） | **lease 空/损坏文件 → `acquireLease` 无限自旋挂死（无超时、无回收）**（原缺陷）。旧实现 `readLease` 对空/半写/损坏返回 null，acquire 的 null 分支不 unlink 直接 wx 创建 → EEXIST → `continue` 死循环（`lease.mjs:70-96` 旧版）；触发面 = 宿主在 `open('wx')` 与 `writeFile` 之间被强杀 -9。修复：`readLease` 区分 ENOENT(null)/`LEASE_CORRUPT`(symbol)；损坏=可接管（unlink+wx，fencing 兜底旧持有人）；`E_LEASE_ACQUIRE_TIMEOUT` 有界超时 + 25ms 退避；`inspectHost` 对损坏报 `lease_expired`。**复验**：空/损坏文件→立即接管（epoch=1）；目录占位→有界超时；两版旧 HEAD 均 HUNG，`8960ae3` 全过。回归三测钉住（含「损坏当无锁→超时」变异真红）。 | 关闭。残余登记：损坏租约从 epoch=1 重来（旧代次不可读，语义正确——撕裂租约从未生效过）；`E_LEASE_ACQUIRE_TIMEOUT` 是新内部前缀，须并入 R1-09 的 §四登记 |
| R1-02 | P0 → ✅ 已修并复验（66d24e3 + F-109） | **repolock「空文件窗口」双持有人——互斥协议本体缺陷，曾击穿索引锁修复**（原缺陷）。`open('wx')` 与 `writeFile` 之间并发者读到空文件 → 判陈旧 → unlink → 双方持锁；修复：`holderIsStale` 对不可解析文件一律 `return false`（在途锁不回收，等超时）。**复验**：修复前双进程同时 acquire 40/40 重叠持有、跨仓 4 仓并发 1/10 丢分段；`8960ae3` 下 **0/20 重叠、0/10 丢分段**。回归测试「空文件=在途锁不得被偷」+ 跨仓共享索引锁用例钉住。 | 关闭。残余登记（P3 观察）：空文件若由「open-wx 后崩死」留下，将永久卡到超时（有界、需人工清）——当前取舍 fail-closed 正确；若后续要恢复自愈，可加「取得后重读校验（read-back verify）：写后重读非己即重试」以兼得两者，列入后续卡 |
| R1-03 | P1（**唯一未修协议级缺陷**） | **`renew` 读-改-写非原子：接管窗口内旧持有人可覆写新持有人 lease（fence 复活）**。`renew` = `readLease` → `sameHolder` → `replaceLeaseAtomic`（tmp+rename 整体覆盖，`lease.mjs:106-119`）；修复批未触碰此路径。若接管者 T 在 H 的 read 与 rename 之间完成 unlink+wx+write，H 的 rename 把 T 的租约覆写回 H → H 的 `verify()` 复活 → 直到 T 下一个 tick 发现 lease-lost 停机前，**两个宿主都可能经各自 store 队列追加事件（内存 seq 各自计数 → events.jsonl 可能双 seq）**。现有测试只覆盖顺序场景（文件已被覆写后再 renew）。触发前提：H 存活且 tick 停滞超过 TTL（15s）后 T 恰好接管，窗口约 1~3ms。 | replaceLeaseAtomic 后重读校验：读回非己（覆写了他人）→ 立即 unlink 恢复接管者租约并抛 `E_LEASE_HELD:lease-lost`（T 下个 tick 重取即收敛）；或在 findings 显式登记触发前提与影响面后接受。**变异探针**：修复后加「在 renew 的 read 与 rename 之间注入接管（慢 rename/mock）→ renew 必须失败且接管者 lease 不被覆写」测试；删除 rename 后重读校验 → 该测试红 |
| R1-04 | P2 | **as-built/relay-core.md 仍未更新**（task_plan 步骤 9、brief「触及子系统」明确要求）：runtime 小节（宿主/lease/发号/恢复/三态读数）、§3.5 F-011 关账与撕裂窗口评估结论、§8.4 lease 移交回写、目录表 `runtime/` 行（仍写「DHR_51（尚未建）」）、§3.5 测试计数（仍写 21/21，现 45）、§3.5 边界②（「appendEvent 原始入口可绕过终态守卫，封堵归 DHR_51」——本卡已封堵、文案 stale）。`git diff master..67cc8c4` 中 as-built 零改动。 | 收口前补齐：新增 runtime 小节、刷新 §3.5（F-011 关账、撕裂窗口评估引用 F-102、测试计数）、§8.4 回写 F-105 等价性结论（或指向 findings）。**变异探针**：收口核对加「as-built 必须含 'runtime' 小节与 'F-011' 关账字样」的存在性断言——若有人跳过本项，核对即红 |
| R1-05 | P3 | 移交② 收敛批已实质关闭（Oracle 测试 + F-105 落账 + F-108 决策登记）；残余观察：Oracle 用例用 mock guard（`authorityValid` 标志）而非真实 `lease.verify` 接线，端到端「真实接管后旧 handle 写被拒」用例缺（F-108 已登记：本卡宿主无业务写路径，不为此加产品 debug 钩子——接受，DHR_31 补）。 | 无需动作；DHR_31 引入 executor 写路径时补端到端 fencing 用例（F-108 已挂账） |
| R1-06 | P3 | 测试触真 home 已修（收敛批给「任意深度模式放行」分支注入 `indexPath` + F-009 注记）；**遗留**：`C:\Users\nash\.dh-relay\runs.json` 仍含历史污染记录（`dhr51-repo-*` → `R001-probe-…`，注记称「已清理」但文件未清）。 | 清理真实 home 的残留记录（一次性手工动作），并确认此后 `npm test` 不再新增 |
| R1-07 | P3 | **并发竞态的直接回归已补，仍有牙但非 barrier 形态**：修复批新增「空文件=在途锁不得被偷」测试（把 `holderIsStale` 改回「空文件判陈旧」该测即红）——R1-02 窗口已有直接咬合；但「真并发两进程同时发号」与跨仓用例仍靠 `git check-ignore` 天然错峰，对「两进程同时到达锁」形态无同步。 | 可选增强：并发用例加启动 barrier（两进程就绪后同时 acquire），把错峰依赖去掉；不阻断 |
| R1-08 | P3 | 覆盖缺口：repolock 的 **TTL 过期回收分支**（`expires_at_epoch_ms`）与 `release`「只删自己的锁」均无测试（现测只覆盖死 pid 回收；lease 侧过期有测）。 | 补「过期但持有人活着 → 可回收」用例（注入 clock 越过 TTL）；补「换手后 release 不删他人锁」用例 |
| R1-09 | P3 | 新进程内异常前缀未登记：`E_REPO_LOCK_TIMEOUT` / `E_GITCHECK_FAILED` / `E_LEASE_ACQUIRE_TIMEOUT`（修复批新增）/ `E_LEASE_HELD:lease-lost` / `E_TERMINAL_STATE_CONFLICT:*-via-raw-append` 不在 `reason-codes.md` §四边界声明列表（该列表自称「若干」、未封闭）。 | §四补一句或扩表登记本卡新增内部前缀，保持「内部前缀集」可审计 |
| R1-10 | P3 | 发号失败原子性边角：run 根与 `run_created` 事件先落、`runs.json` 后写（`startrun.mjs:72-82`）；索引回写失败/强杀 → 孤儿 run 根 + seq 未记账，重试撞 `run.json` EEXIST（裸错误码）。F-106 已登记本卡不修（恢复=人工清理）——接受。 | 无动作（F-106 已挂账）；后续卡若做事务化，重试路径给编码错误 |
| R1-11 | P3 | Windows 路径大小写：`canonicalRepo = resolve(repoRoot)`（`startrun.mjs:62`）不归一大小写，同仓两种拼写（`D:\Foo` vs `d:\foo`）→ 两个 bucket → 序号流分裂 → 潜在重号/复合键失效（fs 层大小写不敏感但 JSON 键敏感）。 | win32 下 key 做大小写归一（如 `toLowerCase`）或 realpath 后归一 |

### 正面确认（非缺陷，逐条核过）

- **M3 强杀恢复的 `updated_at` 语义覆盖到位**：`deepEqual(rebuilt.readState(), preKill)` 是整对象逐字节（含 `updated_at`），且杀前基准取自事件账静默窗口（300ms 无增长）之后——无「append 与 persist 竞态造成假红」风险；事件账 kind 序列四事件全量过冻结契约。
- **F-011 封堵锁得住**：精确子码断言（`E_TERMINAL_STATE_CONFLICT:<kind>-via-raw-append`）+ 内存账与落盘双零变化 + `appendResult` 唯一通道复验；删掉 `TERMINAL_RESULT_KINDS` 检查该测即红。
- **slug 五反例有牙**：每个反例断言报错含 `slug-*` 子码**且携带原输入**（证明未静默截断/转写）；`R007-` 三位补零、超千号不截位、30 字符边界均有正反例。
- **三态与 acquire 不变量**：`dead ⇔ acquire 必成功`、`alive ⇔ acquire 被拒`、`lease_expired ⇔ 死持有人/过期` 由「inspect 三态与 acquire 成败构成不变量」测钉住。
- **硬边界守住**：无 `bin` 注册、无 `cli/`、无新协议对象（`host-lease.json` 无 protocol 字段不进契约）、`capability_hash` 零漂移、status 只渲染 Store 产出（不自行推导）、`runtime/` 不含 `relay` 命令名。
- **收敛批质量**：索引锁方向正确（R1-02 根因修复前的前置）、F-009 用例隔离修复到位、F-105~108 落账诚实（含 MUT-C/MUT-D 空洞与处置决策）；未提交两测（会话真实续租 / lost_lease 停机不释放他人租约）有牙——删 `lease.renew()` 调用即红。

### 整体结论

**changes-requested**。

依据：五道机器闸全绿（48/48、33/33、0 违规、55 份、capability_hash 零漂移），三条硬边界与三态半条守住。**修复批（66d24e3）已实证关闭本复核的 P0 与两个 P1 中的两个**——R1-01（lease 损坏租约挂死）与 R1-02（repolock 在途锁被偷 → 双持有人/丢分段）均经修复后探针复验通过（不再挂死、0/20 重叠、0/10 丢分段），回归测试有牙（变异探针真红），F-109 落账诚实。收敛批亦已关闭 E4 的 F/C 并补移交② Oracle 与索引锁。**剩余未修：R1-03（P1，renew 读-改-写非原子的 fence 复活窗口，修复批未触碰）** 与 R1-04（P2，as-built 未更新）——故整体仍为 changes-requested，但返工面已收敛到一处代码缺陷 + 一处文档。

返工优先级：①R1-03 补 renew rename 后重读校验（覆写即 unlink 恢复 + 抛 lease-lost）与竞态测试；②R1-04 收口前补 as-built（runtime 小节、§3.5 F-011 关账/撕裂窗口结论/测试计数 48、§8.4 回写 F-105）；③R1-06 清理真实 home 残留记录；④R1-05/R1-07~11 登记/收口项（含 `E_LEASE_ACQUIRE_TIMEOUT` 并入 R1-09 登记）。与 E4 needs_evidence 一致且互补（E4 缺的 P0/P1 代码级实证在此补上，均已实证闭环）。

---

### E14 一致性复核（2026-08-22，fresh 只读 · 横向比对）

- **复核实例**：E14Consistency（fresh subagent，零上下文，只读；未参与实施）。基线 `HEAD = f34f1a5`（wt/DHR_51），diff = `master..HEAD`（18 文件 +1203 −8）。
- **比对口径**：只扫「本次碰到的东西在别处有没有兄弟」——lease/锁/发号/宿主/三态读数相关既有实现与文档：v1 Oracle（`tools/contracts/relay-identity.ps1`、`tools/runner/relay-store.ps1`、`tools/tests/relay-runner-authority.ps1`、fixture `result-A1-wrong-generation.json`）、`design/02`（B7/D18/D23 原文）、DevPlan P5 DHR_51 卡、`contracts/{reason-codes.md,compat-matrix.md,relay.event.v2.schema.json,_shared/relay.common.v1.schema.json}`、as-built §3.5/§8.4。
- **只读验证实跑**：`node tools/capability-baseline.mjs` → 8 份 digest 相符、`capability_hash = 970b54601ae582a5…` 与 DHR_29 收口值**零漂移**；`git diff master..HEAD` 确认 `contracts/` 与三份基线文件零改动。

### dh:consistency-review:v1 五列表

| 比对对象 | 本次形态 | 别处形态 | 一致或差异 | 裁决 |
|---|---|---|---|---|
| ① lease+fencing vs v1 `authority_generation` CAS（compat-matrix §6 移交①） | v2：lease 文件 `host-lease.json`（wx 独占 + epoch + 死 PID 视同过期）+ 每次经 Store 变更前 `verify()` 重验 pid+epoch（writeGuard），失去持有即 `E_LEASE_HELD:lease-lost` 拒写 | v1：`Get-RelayIdentityVerdict` 提交时比对 `authority_generation`，不符 → `rejected/stale-generation`、relay-state/authority 字节不变（`relay-identity.ps1:7`、fixture `result-A1-wrong-generation.json`、`relay-runner-ingest.ps1:35` 断言） | 一致（同构：都是「写时校验持有权威，陈旧即拒、状态零污染」）；另「持有人已死视同过期可接管」比 v1 字面 TTL 更早放行接管 | 有意差异（F-104 已登记；wx 仲裁保证独占，可用性对齐 P1 恢复锁陈旧回收语义——强于 v1 处已明示）。**遗留**：task_plan step 5 的「主断言」未按卡面直接引用 P1 fixture 跑 Oracle（relay-core/test 对 `result-A1-wrong-generation.json` 零引用），等价性结论仅 F-104 一句 + 测试注释，as-built §8.4 未回写（同 E4 缺口 C，独立复现） |
| ② 仓级锁 vs D23「搭在建 run 时已有的仓级锁」 | v2 新造 `repolock.mjs`：wx 独占 + TTL/死 PID 陈旧回收 + `E_REPO_LOCK_TIMEOUT` + release 校验持有人；锁文件 `<repo>/.dh-relay/repo.lock`（每仓一把） | v1 PowerShell 侧**无显式锁文件**——grep `tools/` 全部 ps1 零命中；v1 并发控制实为 `Write-RelayJsonCreateNew`（tmp+Move 不覆盖，等价 wx）+ authority CAS。「v1 那把锁」系 P2 设计概念，实施提示 5 已明示本卡新造 | 一致（新造符合实施提示 5；同仓并发真进程测试钉住） | 有意差异（本卡新造已预登记）。锁粒度问题独立见 ↓ ③ |
| ③ runs.json 写入锁粒度 vs D23 原文「临时文件 + 原子改名 + **文件锁**」与 B7「索引写入原子且并发两宿主不互相覆盖」 | `startrun.mjs` 索引读-改-写在**仓级锁内**执行；`runs.json` 本身无文件锁；`writeRunsIndexAtomic` 全量回写 | D23（design/02 §1.3-10）：「写入用临时文件 + 原子改名 + 文件锁」；DevPlan §2.2：「跨仓单文件按仓分段，**A 仓死锁不得挡 B 仓**」——该句仅在**共享单锁**语义下成立 | **差异**：同仓串行成立（测试钉住）；**跨仓并发建 run 时 A、B 各持自己的仓锁、同时读同一 `runs.json`、各自全量回写 → 后写者覆盖先写者仓分段（读-改-写竞态丢段），违反 B7「并发两宿主不互相覆盖」**。「真并发」用例只覆盖同仓，跨仓未测 | **遗漏**（D23「文件锁」未实现，跨仓并发丢分段）→ 修复建议：锁文件移至索引旁（如 `~/.dh-relay/runs.json.lock`，实现已有超时+陈旧回收，仅需挪位并保留 per-repo 分段语义），或在回写前重读最新 index 合并（乐观并发）；最低限度登记已知边界留 DHR_30 |
| ④ run_id 规范化 vs design/02 B7/D23 原文 | `R<nnn>-<slug>-<yyyyMMdd>`；slug ASCII 小写/数字/短横线 ≤30 首尾非短横线；五反例各拒且报错带原输入（不静默截断）；序号仓级锁内 `max_seq+1`；`(repo, run_id)` 复合键查重；日期=本地日历日只为人读 | B7/D23 逐字一致：格式、字符集、≤30、首尾非短横线、五类反例（中文/大写/空格/超长/首尾短横线）、不得静默截断或转写、复合键唯一、`R<nnn>` 唯一性来源 | 一致（正例 `R007-kpi-alignment-20260822` 与 D23 示例同构；R 序号三位补零、超千号不截断；事件账内 run_id 亦过 `relay.common/v1` identifier pattern） | 一致 |
| ⑤ 事件 kind 用法 vs `relay.event/v2` 枚举与既存产生者口径 | DHR_51 首次产生 `lease_acquired`/`lease_expired`（host.mjs：接管先 `lease_expired` 再 `lease_acquired`，detail=`epoch:N`；M3 测试对全账逐条过 ajv） | 枚举含二值（批次 1 新增 12 值，compat-matrix §4b：`lease_acquired`/`lease_expired` 已在新增 12 值内）；lease kind 无条件约束（allOf 仅约束 attempt_*/client_* 等），基座必填 protocol/run_id/seq/at/kind；`detail` 字段 schema 允许 | 一致（kind 在冻结枚举内、零 schema 触碰；detail 承载 epoch 合法；与其他产生者同走 `emitEvent` → ajv → 落盘） | 一致 |
| ⑥ reason 码 vs reason-codes.md | `E_LEASE_HELD`（acquire 拒第二宿主）、`E_LEASE_HELD:lease-lost`（renew/guard）、`E_GITIGNORE_MISSING`（`git check-ignore -q` exit 1）、`E_RUN_ID_INVALID:<why>:<原输入>`；内部前缀 `E_REPO_LOCK_TIMEOUT`、`E_GITCHECK_FAILED` 不上协议线 | §二/§四语义逐条吻合（E_GITIGNORE_MISSING 须按 Git 忽略语义判定、不得字面量匹配——F-009；E_RUN_ID_INVALID 归 B7 D23；E_LEASE_HELD 归 P5-M3）；§四边界声明允许进程内异常前缀带 `:detail` 子码（既有先例 `E_REQUEST_CONFLICT:run-id-exists`、`E_TERMINAL_STATE_CONFLICT:*-via-raw-append`） | 一致（协议码未新增、未越界；子码形态与既有内部前缀模式同构） | 一致 |
| ⑦ 三态读数 vs design/02 B7/D18 与 DevPlan DHR_51 卡 | `inspectHost` 三态：alive=新鲜且 PID 活 / lease_expired=过期或持有人已死（此时 acquire 必成功）/ dead=run 在而 lease 无；`status.mjs` 只打印 JSON；**不叫 relay status、不注册 bin、不定义新协议对象** | B7：「`relay status` 正确区分宿主活着/已死/lease 过期三态」；D18：PID/lease 文件（含 run_id、启动时刻、**宿主可执行指纹**）写进 `<run>/`；卡面三条硬边界（不注册 bin、三态半条、不动 v0 形状） | 差异①（命名映射）：「已死」拆为 lease_expired（持死人/过期）+ dead（无 lease），由 task_plan 定义、测试钉住「inspect 三态与 acquire 成败不变量」——**一致**；差异②：**lease payload 无「宿主可执行指纹」**（D18/B7 原文要素，卡面未承接、findings 未登记） | 差异② = **遗漏（未登记的有意收敛）**：指纹不参与任何判定路径（epoch+pid 重验已覆盖），卡面亦未要求——但 design/02 原文要素缺失且无登记，建议 findings 补一条「宿主指纹不进 lease payload」的有意取舍。其余**一致**（三条硬边界全守住） |
| ⑧ 撕裂窗口评估 vs as-built §3.5 登记 | F-102 落账：**有意接受**（单宿主 lease 独占下无并发写者；openStore 以事件账为真值，「有工件无事件」按幂等键原样重投收敛；DHR_52 后写者仍唯一）；「重启评估触发条件」已登记 | as-built §3.5 边界①「归 DHR_51 恢复路径评估」（待评估状态） | 差异：评估结论已在 findings 落账，但 **as-built §3.5 刷新（关账）+ 新增 runtime 小节 + §8.4 回写未落盘**（git diff 中 as-built 零改动；task_plan step 9 属收口段） | 待收口（同 E4 缺口 B，独立复现；收口段完成，非本轮施工遗漏） |
| ⑨ capability_hash / 契约零触碰 | 实跑 `capability-baseline.mjs` 8/8 相符、`capability_hash=970b54601ae582a5…`；`contracts/` 与三份基线 diff 零改动 | DHR_29 收口值 `970b54601ae582a5…`（as-built §4.1⑤） | 一致（零漂移） | 一致 |
| ⑩ 测试隔离 vs 自身关键决策「测试永不触真 home」 | 「startRun：缺忽略前置…任意深度模式放行」用例未注入 `indexPath` → 每次 `npm test` 写真实 `~/.dh-relay/runs.json` | task_plan 关键决策：「`~/.dh-relay/runs.json` 路径可注入——测试永不触真 home」；卡面「索引路径可注入供测试隔离」 | 差异（实测 `~/.dh-relay/runs.json` 现存 `dhr51-repo-*` 临时仓记录，系测试写入且随跑测累积） | 遗漏（同 E4 缺口 F，独立复现）→ 修复建议：该用例补 `indexPath` 并清理既有污染记录 |

### E14 结论

**机制与文档一致性高**：lease+fencing 与 v1 CAS 同构（不弱于 v1 成立，机制+测试在）、run_id 规范化与 D23/B7 逐字一致、kind 用法在冻结枚举内零契约触碰、reason 码语义逐条吻合、capability_hash 零漂移、三态与三条硬边界全守住、撕裂窗口评估结论已在 findings 落账。

**两条新发现（E4 需求视角未覆盖的横向差异）**：
1. **③ runs.json 锁粒度**：D23「文件锁」未实现——每仓一把 `repo.lock` 序列化不了跨仓对同一索引文件的读-改-写，「并发两宿主不互相覆盖」（B7）在跨仓并发建 run 时被打破（丢分段）。同仓安全且有真并发测试。裁决 = **遗漏**，建议收口前修复（锁挪至索引旁或写前重读合并）或登记已知边界。
2. **⑦ 宿主指纹**：D18/B7 原文的 lease 文件「宿主可执行指纹」要素缺失且无登记。裁决 = **遗漏（未登记的有意收敛）**，建议 findings 补登记。

**与 E4 复核重叠确认**：移交② 未按卡面直接引用 P1 fixture 作 Oracle + 等价性结论缺 as-built §8.4 回写（E4 缺口 C）、as-built 未刷新（缺口 B）、测试触真 home（缺口 F）——三条均独立复现，结论一致。E14 对整体结论无追加阻塞：无 P0/P1，两项新差异均为收口段可处置项。

---

### E5 教训复核（2026-08-22，fresh 只读 · 教训库对照）

- **复核实例**：E5Lesson（fresh subagent，零上下文，只读；未参与实施）。基线 `HEAD = f34f1a5`（wt/DHR_51），diff = `master..HEAD`（18 文件 +1203 −8）。
- **复核依据（在册）**：`docs/modules/dh-relay/knowledge/教训库-候选.md` 候选-1~14 全文 + `as-built/relay-core.md` §6 八条与 §3.5 已知边界。方法：先实跑基线（`npm test` 41/41 绿），再在**临时副本**（工作区零改动）做 9 个变异探针：7 个单元/库层变异验证"断言在咬"，2 个宿主会话层变异验证"删合法路径是否红"。

### 变异探针实证（临时副本，每探针单变量、跑后还原）

| 探针 | 位置 | 变异内容 | 结果 | 说明 |
|---|---|---|---|---|
| MUT-A | `store/store.mjs` | 删 raw 终态门（`TERMINAL_RESULT_KINDS` 检查） | 🔴 红 | 仅 F-011 测试失败（store 15 条中 fail 1）——断言精确到子码 |
| MUT-B | `store/store.mjs` | `runWrite` 退化为 `enqueue`（writeGuard 不接线） | 🔴 红 | 仅 writeGuard 测试失败——守卫接线在库层真被钉住 |
| MUT-C | `runtime/host.mjs` | tick 循环删 `await lease.renew()`（续租调用） | 🟢 **绿 41/41** | **删合法路径不红**：续租是 lease 语义核心（维持唯一活写者长期有效），但没有任何测试断言 renewals>0 或"跨多 tick 后 lease 仍新鲜"；shouldStop 测试第一轮即停、detached 测试在 15s TTL 窗口内完成，初始 lease 已够 |
| MUT-D | `runtime/host.mjs` | `openStore` 撤掉 writeGuard（fencing 接线删除） | 🟢 **绿 41/41** | **删合法路径不红**：fencing 机制本体（接管后旧宿主残余写被拒）只在 store/lease 单元级被测，宿主把两者接起来的那一行无端到端测试（没有"旧持有者失去 lease 后仍写"场景） |
| MUT-E | `runtime/lease.mjs` | 删"新鲜且活 → E_LEASE_HELD"检查 | 🔴 红 | 2 测失败（第二宿主被拒 + 三态不变量） |
| MUT-F | `runtime/repolock.mjs` | 死 pid 不再视同陈旧 | 🔴 红 | 陈旧锁测试失败（10s 超时后红，期望立即回收） |
| MUT-G | `runtime/lease.mjs` | renew 删 sameHolder 校验 | 🔴 红 | 僵尸持有者测试失败（fencing 本体在咬） |
| MUT-H | `runtime/gitignore.mjs` | `git check-ignore` exit 1 不再抛 | 🔴 红 | 前置闸测试失败 |
| MUT-I | `runtime/runid.mjs` | SLUG_PATTERN 放宽（允许首尾短横线） | 🔴 红 | 五反例测试失败（含 `assert.fail` 兜底） |

### 逐条在册教训核对（教训 | 是否重蹈 | 证据）

| 在册教训 | 是否重蹈 | 证据 |
|---|---|---|
| 候选-1：判定函数每个 reason 码/分支都要有断言钉住 | 未重蹈（单元层） | 本卡判定函数（runid 五反例子码、E_LEASE_HELD、E_GITIGNORE_MISSING、E_REPO_LOCK_TIMEOUT、F-011 精确子码）逐个有断言且 MUT-E/F/H/I/A 全真红；仅 `E_GITCHECK_FAILED`（git 缺失/非 git 仓）分支无测试，轻量观察 |
| 候选-2：穷举/矩阵期望值不能来自被测数据（自证循环） | 未重蹈 | 本卡无矩阵穷举；"startRun：同仓连发"的 `bucket.runs == [first.run_id, second.run_id]` 期望取自被测返回值，但 run_id 形状由 runid 测试独立钉住、seq/max_seq 为独立硬编码（1/2），该断言验证"返回与落账一致"而非格式——账实相符检查，非自证 |
| 候选-3：多类工件每类真实形态夹具 | 未重蹈 | F-011 三终态 kind 逐 kind 断言（同类三值全覆盖）；writeGuard 测试对 receipt 工件与事件账双零落盘都有断言 |
| 候选-4：task_plan/brief 内部引用先机械核 | 未重蹈 | 引用的上下文文件与 `result-A1-wrong-generation.json` 全部真实存在；"引用存在但落实落空"归候选-14/12（见下） |
| 候选-5：PowerShell 大小写不敏感 | 不适用 | 本卡为 Node 实现，无 PS 枚举比对 |
| 候选-6：钉边界的断言必须配变异对照 | **部分重蹈** | 单元层断言在咬（E5 实测 7 变异全真红）；但宿主会话层两条关键路径无断言可变异（MUT-C/D 全绿），且测试注释声称"变异级反例"并无可复跑的 harness，收口证据仍以"测试通过"呈现——该空洞登记为新候选-15 |
| 候选-7：校验器/期望不能复用被测代码 | 未重蹈（测试本体） | 无校验器；P5-M3 重建 `deepEqual preKill` 的 oracle 是系统自身先前落盘产物（语义本体），重建正确性由 store 套件独立承担；但验收 6 等价性论证未引入独立于被测实现的 v1 oracle（归候选-14） |
| 候选-8：探针不能与被卸载对象同生共死 | 未重蹈（做得对） | detached 测试探针（readHostStatus/测试进程）独立于被观测宿主子进程，kill -9 后探针仍活并观察到 lease_expired |
| 候选-9：安装拓扑 | 不适用 | 无插件/依赖解析 |
| 候选-10：文档纠错 append + superseded | 未重蹈 | 本卡无推翻早前结论的情况；findings 均新登记、未改历史 |
| 候选-11：补丁覆盖同类目标清单 | 未重蹈 | F-011 三终态 kind 全入 `TERMINAL_RESULT_KINDS` 且逐 kind 断言（清单完整）；writeGuard 挂满 store 四个变更入口（appendEvent/registerReceipt/appendCheckpoint/appendResult 全改），但 appendCheckpoint/appendResult 的 guard 拦截无独立断言（机制统一，低风险观察） |
| 候选-12：证据只覆盖一部分，结论写整条 | **重蹈** | findings F-104 写"这是移交②**等价性结论里明示的**「强于 v1」差异点"——等价性复核结论并未落账（as-built 零改动、progress 无条目），F-104 引用了一个尚不存在的结论，把"机制已实现"写成"等价性结论已成立"；验收 6 的"结论落账"缺位（同 E4 缺口 C，教训视角确认形态） |
| 候选-13：写下教训不等于教训生效 | **重蹈（轻量）** | task_plan 关键决策「测试永不触真 home」——首个 startRun 测试（"缺忽略前置…任意深度模式放行"）未注入 `indexPath`，每次 `npm test` 真实写入 `~/.dh-relay/runs.json`（E4/E14 独立复现，实测污染累积）——自己写下的隔离决策自己在同批测试里违反 |
| 候选-14：声称与上游/同仓保持一致必须实读对方源文件 | **重蹈** | `lease.mjs`/`host.mjs` 头注释声称"与 v1 authority_generation CAS 同强度"、F-104 声称"强于 v1"——relay-core 测试对 P1 fixture（`result-A1-wrong-generation.json`）与 `relay-runner-authority.ps1` 的 stale-generation 断言**零引用**，验收 6 明确要求的"用 P1 恢复锁/CAS 用例为 Oracle 证明"未兑现；等价性结论建立在转述/印象上而非源文件核对留痕上（E14 复核者独立实读 P1 源才确认同构，那是复核工作，不是施工证据） |
| §6.1~6.6（$ref 编译/required/聚合 allOf/capability 覆盖面/digestExcluding/白名单） | 不适用 | 本卡零触碰 contracts/、canonical.mjs、三份基线（capability_hash=970b54601ae582a5… 与 DHR_29 收口零漂移，E5 复跑确认） |
| §6.7 空绿 | 未重蹈 | `package.json` 显式指定三个测试文件；41 条无 skip/todo；"startRun：slug 违例在闸前被拒"等负例测试含 `assert.fail` 兜底（不抛即红） |
| §6.8 测试名比断言强 | 未重蹈 | 逐条核对：测试名与断言匹配（如"零误跟踪双证"确有两证断言、P5-M3 主用例断言事件 kind 序列与逐字节重建）；"inspect 三态与 acquire 成败构成不变量"的 lease_expired→acquire 成功分支在 TTL 测试中覆盖 |

### 任务点名的六类检查小结

| 检查项 | 结论 | 证据 |
|---|---|---|
| 自证循环 / 期望值取自被测数据 | 未发现 | 逐用例分析见候选-2 行；runid/status/lease 测试期望均为独立硬编码 |
| 形态冒充语义 | **宿主层命中 2 处** | MUT-C/MUT-D 全绿 = "npm test 通过"冒充"宿主机制成立"（登记候选-15）；F-104 结论冒充见候选-12；单元层无 |
| 空绿 | 未发现 | 41 条全绿、无 skip/todo、显式文件、负例有 assert.fail 兜底 |
| 变异探针不真红 / 删合法路径仍全绿 | **宿主层命中 2 处** | 删续租调用（MUT-C）、撤 fencing 接线（MUT-D）后 41/41 仍全绿；单元层 7 变异全真红 |
| 时间/时钟未注入导致不确定性 | 未发现 | lease/repolock/startrun/host/status 全部注入 clock，TTL 测试用假时钟；真实时钟仅 detached/并发端到端用例，均有 deadline 轮询防挂；唯一观察：tick 循环（sleep+renew 周期行为）本身无测试——正是 MUT-C 的空洞，时钟注入救不了"没有驱动周期行为的测试" |
| fixture 与规格漂移、检查顺序未锁 | 未重蹈 + 一处规格落空 | fixture 零改动/基线零漂移（manifest 55 份、capability 8 份相符）；检查顺序有钉（gitignore 闸在一切落盘前，拒绝路径 repo.lock 不存在的断言）；但验收 6 规格要求"用 P1 fixture 为 Oracle"的用例零引用（归候选-14） |

### 新教训候选登记

- **候选-15**（已追加 `knowledge/教训库-候选.md` 候选区，只追加未改既有条目）：**宿主/守护进程的长期运行行为（周期副作用、跨层接线）测试窗口天然覆盖不到——删除续租调用、撤掉 fencing 接线测试仍全绿**。一句描述：短命测试（几秒内跑完）测不到"运行数十秒后才可见"的续租行为，单层单元测试测不到"A 调 B 的那一行"接线，这两类空洞删除代码不红；建议周期副作用用注入 tick+假时钟断言 renewals>0、跨层接线补"旧持有者失去 lease 后仍写被拒"的端到端断言、每条"保持/不弱于"类验收配删除该调用的变异探针。与候选-1（分支数量覆盖）/候选-6（断言有效性）同族不同角度。

### E5 结论

**测试本体质量高，但命中在册教训 3 条 + 新候选 1 条，教训视角判 needs_evidence**。

- **亮点（未重蹈的实证）**：单元/库层断言全部在咬（7 个变异探针全真红，含 F-011 封堵、writeGuard 接线、lease 三态、死 pid 回收、gitignore 前置、slug 五反例）；无空绿、无自证循环、无测试名>断言；clock 全注入；探针独立于被观测对象（候选-8 反面做对）；F-011 补丁清单完整（候选-11 正面）。
- **重蹈（3 条）**：候选-12（F-104 引用未落账的等价性结论；验收 6 结论落账缺位）、候选-13（测试触真 home，违反自己写下的隔离决策）、候选-14（验收 6 的"不弱于 v1 / 强于 v1"声称未实读 P1 源文件核对，Oracle 零引用）。
- **新增空洞（候选-15）**：宿主会话层两条关键行为（tick 续租、fencing 接线）删除后测试仍全绿——task_plan 步骤 5 的"移交② 主断言"只做到单元级，宿主接线无端到端测试。
- **与 E4/E14 交叉印证**：E4 缺口 B/C/F 与 E14 ⑩在教训视角下正是候选-12/13/14 的复发形态，非孤例；E5 独立新增的是变异实证（MUT-C/D）与候选-15。
- **返工判定**：不构成批级返工（无 P0/P1、单元测试在咬、机制与测试主体正确），但收口前必须补：①验收 6 用 P1 fixture + `relay-runner-authority.ps1` 的 stale-generation 语义做 Oracle 对拍并落账（findings 正式条目 + as-built §8.4 回写）；②宿主接线端到端测试（旧持有者失去 lease 后写被拒 + 注入 tick 断言续租生效），并按候选-15 建议配删除式变异探针；③"测试永不触真 home"用例补 `indexPath` 并清理 `~/.dh-relay/runs.json` 污染；④as-built §5 闸表数字刷新（现仍写 23 条，实际 41 条）。


---

### 第二轮·增量复核（2026-08-22，fresh 只读 · 核销 + 对抗证伪）

- **复核实例**：ReviewRound2（fresh subagent，零上下文，只读；未参与实施、未参与轮1）。
- **基线说明**：复核期间 HEAD 从 brief 记录的 f109c58 前移到 **7b98fde**（主控补提交 as-built 收口 + progress 收敛账，恰是本轮待核销的 R1-04 落点），最终复核基线 `git diff master..HEAD` = **20 文件 +1498 −13**（master=b441fc6）。worktree 未提交增量仅 `knowledge/教训库-候选.md`（E5 候选-15 登记，8 行）与 `workspace/DHR_51/review.md`（本文件），与代码无关。
- **方法**：先读轮1 结论 R1-01~R1-11 与 E4/E14/E5 全部未决项 → 读 diff + 关键源码（lease/repolock/startrun/host/status/store）→ 五道机器闸独立复跑 → 逐条核销（P1/P2 项配变异探针）→ 五组对抗证伪探针（全部在 %TEMP% 独立目录，已清理，工作区零改动）。

### 只读验证实跑（本实例独立执行）

| 闸 | 实跑结果 |
|---|---|
| `npm test`（contracts 10 + store 15 + runtime 25） | **50/50 pass, fail 0, exit 0**（as-built §5 写 49 条、runtime 24——off-by-one，见 R2-N3） |
| `node tools/validate.mjs --selftest` | pass=33 fail=0 |
| `node tools/audit-contracts.mjs` | 未登记 token 0、K-3 内联 pattern 0、ajv 拒 0、meta 分叉 0、$ref 失败 0（结构 token 164 全登记） |
| `node tools/fixture-manifest.mjs` | 55 份逐份 digest 相符 |
| `node tools/capability-baseline.mjs` | 8 份 digest 相符，capability_hash=970b54601ae582a5… **零漂移**（契约零改动） |

### 逐条核销表（轮1 / E4 / E14 / E5 / F-101~109）

判级：**真修+锁住**（修复在 diff 中 + 有咬合测试/变异实证）｜**修了未锁**（修复在但无直接咬合）｜**已处置**（登记/落账/计划化）｜**未修**（仍开放，登记理由）。

| ID | 判级 | 证据（本实例独立核实） |
|----|------|--------------------------|
| R1-01（P1，lease 损坏租约无限自旋） | **真修+锁住** | 66d24e3/f109c58 修复（LEASE_CORRUPT 区分 + 有界超时）；**MUT-F109 变异**（readLease 损坏当无锁）→「空/损坏租约可回收」测红（2013ms 挂到 2s 超时，复现旧缺陷形态）；「持久无法创建走 E_LEASE_ACQUIRE_TIMEOUT」在测。F-109 落账 |
| R1-02（P0，repolock 空文件窗口双持有人） | **真修+锁住** | 66d24e3 修复（holderIsStale 对不可解析文件不回收）；「空文件=在途锁不得被偷」测试在位（变异即红，轮1 已证）；全量 50/50 绿、跨仓并发 3/3 复跑无丢段 |
| R1-03（P1，renew 读-改-写覆写接管者租约） | **真修+锁住**（含残余登记） | f109c58：renew 改 **新鲜度闸 + unlink+wx**（与 acquire 同一仲裁协议，绝不 rename 覆写）。**MUT-R1-03a**（删新鲜度闸）→「过期租约不得续租（R1-03 闭合）」测红；**MUT-R1-03b**（renew 退回 rename 覆写）→ 同测红。**探针 p1/p2**：接管者已持有时 renew 抛 E_LEASE_HELD:lease-lost 且租约文件零触碰（epoch 不变）；**探针 p3 压力 60 轮**：围绕过期边界并发 renew vs acquire，双持有人 0、fence 复活 0。残余登记（as-built §3.5 ③已写）：unlink 解析与 wx open 之间是微任务边界，理论上 T 的 wx 可插缝 → 我方 wx 失败 → lease-lost（安全收敛路径），正常调度不可达（需事件循环恰在无 await 的相邻语句间停滞且时钟同时越过过期点）；unlink+wx 半条无确定性测试（需注入钩子），由新鲜度闸测试 + 压力探针 + 代码推演兜住 |
| R1-04（P2，as-built 未更新） | **真修+锁住**（一处 off-by-one） | 7b98fde 新增 §3.6 runtime 小节（九模块表 + 发号锁位置 + host-lease 形态声明）、§3.5 已知边界五条刷新（F-011 关账、F-102 撕裂窗口评估、renew 微窗口、PID 复用、损坏租约）、§5 闸表刷新、§8.4 lease 等价性回写、§10 阅读对象补 DHR_51/52。瑕疵：§5 写「49 条全过（runtime 24）」，实测 50 条（runtime 25）→ R2-N3 |
| R1-05（P3，移交②收尾） | **已处置** | F-108 登记：本卡宿主无 executor 写路径，端到端 fencing 用例挂 DHR_31 |
| R1-06（P3，真实 home 残留污染） | **真修+锁住** | `C:\Users\nash\.dh-relay\runs.json` **已不存在**（历史 13 条污染记录清空、文件整体移除）；本实例两次全量 npm test 后仍未重建——测试彻底不触真 home |
| R1-07（P3，并发用例 barrier） | **未修**（可选增强，不阻断） | concurrent-issue.mjs 无启动 barrier，仍靠 git check-ignore 天然错峰；同仓/跨仓并发测试 3/3 稳定通过，牙性靠「不同序号、无跳号无重号 + 账面一致」断言承担 |
| R1-08（P3，repolock TTL 回收/release 只删自己） | **真修+锁住** | f109c58 新增「repolock：TTL 过期按时钟回收；release 只删仍属于自己的锁」（注入 clock 越过 TTL；换手后旧 holder release 不动新锁文件） |
| R1-09（P3，内部前缀登记） | **部分修** | f109c58 在 reason-codes §四边界声明补登 `E_GITCHECK_FAILED:*`、`E_LEASE_ACQUIRE_TIMEOUT`、`E_LEASE_HELD:<detail>`；**`E_REPO_LOCK_TIMEOUT` 仍未登记**（grep 全文件零命中，仅 as-built §3.6 提到）→ R2-N4 |
| R1-10（P3，F-106 发号原子性边角） | **已处置** | F-106 落账「登记观察、本卡不修」（失败现场明确报错、无静默重号、恢复=人工清理），与 E4-G 同一口径 |
| R1-11（P3，Windows 路径大小写） | **未修**（P3 观察） | `canonicalRepo = resolve(repoRoot)`（startrun.mjs）无大小写归一；`D:\Foo` vs `d:\foo` 两 bucket → 序号流分裂风险。不构成静默损坏（同 run_id 撞同一实际目录 → createStore wx EEXIST 拒绝而非覆盖），登记建议留后续卡 |
| E4-B（P2，as-built） | **真修+锁住** | 同 R1-04，7b98fde 已全部落盘 |
| E4-C（P2，移交② Oracle 复验 + 结论落账） | **真修+锁住** | 67cc8c4 起「移交②：P1 恢复锁/CAS Oracle 复验」用例**真实读入 `result-A1-wrong-generation.json`**（断言 authority_generation=2 锚点）→ 映射 v2：authorityValid=false 后事件写与结果写均被 E_LEASE_HELD:lease-lost 拒、readState 逐字段零变化、权威恢复后幂等重投收敛；F-105 在 findings 正式落账（含「严格更强」论证与差异面登记）；as-built §8.4 回写 DHR_51 处置行 |
| E4-D（P3，人判需求境计划化） | **已处置**（计划挂接，未执行=需人） | progress 记录 E-201 机器侧预演（关 shell 后新 shell 读数 alive、SIGKILL 后接管 took_over=true）；真实「关终端→隔时回来→读数」人判步骤挂收口 E11（progress 最后一行「轮2 复核 → E8~E10 verify 备料 → E11」），属人判时序非施工遗漏 |
| E4-E（P3，progress 证据粒度） | **已处置** | progress 扩至 8 行，含 E-ID 回链（E0/E2/E4/E5/E14/E7/E8~E11）、各批次提交号、探针数据（0/20 重叠、0/10 丢段） |
| E4-F（P2，测试触真 home） | **真修+锁住** | 全部 startRun 用例注入 indexPath（源码逐处核实：f009/连发/并发/跨仓/M3/grace/wire/lost/stat 用例均显式传 indexPath）；真实 home 文件不存在（见 R1-06） |
| E4-G（P3，发号失败原子性） | **已处置** | F-106 登记（同 R1-10） |
| E14-③（runs.json 锁粒度跨仓丢段） | **真修+锁住** | 67cc8c4 锁挪至索引旁 `<indexPath>.lock`（跨仓共享一把，A 仓死锁不挡 B 仓的语义靠超时+陈旧回收）；「跨仓并发建 run 共享索引锁」测试在位；本实例连跑 3 轮全绿（两仓分段各自入账、max_seq 正确、无覆盖）；as-built §3.6「发号锁位置（E14 遗漏修复）」明示 |
| E14-⑦（宿主可执行指纹要素） | **已处置** | F-107 登记有意不承接（卡面未要求、指纹用途已由 F-103+TTL 兜底、lease 文件是运行现场内部形态非契约）；as-built §3.6 引用 F-107 并挂 DHR_52 评估触发点 |
| E5 候选-12（F-104 引用未落账结论） | **真修** | F-105 正式落账（findings + as-built §8.4），「强于 v1」差异点现在有真实结论条目可引用 |
| E5 候选-13（测试触真 home） | **真修+锁住** | 同 E4-F/R1-06；测试源注释明示「已清理并加此注」 |
| E5 候选-14（Oracle 零引用） | **真修+锁住** | 同 E4-C；relay-core 测试对 P1 fixture 由零引用变为真实读入断言 |
| E5 候选-15（宿主层接线空洞） | **已处置**（一半锁住 + 一半登记） | MUT-C 已锁：新增「会话在宿主层真实续租」（轮1 变异实证删 renew 即红；本实例 MUT-R1-03b 下该测仍绿证明续租路径活着）；MUT-D 残余：本卡宿主无业务写路径，guard 接线闭环由 store 单测（writeGuard 失守拦截）+ 移交② Oracle 测承担，F-108 显式登记「不为测试给产品加 debug 钩子」、DHR_31 补端到端 |
| F-101（store 触碰授权） | **已处置** | brief 预登记段 + F-101 落账；package.json 仅 scripts.test 追加（diff 核实无 bin 字段）；store diff 两处共 ~26 行（F-011 门 + writeGuard 接线到全部四个变更入口） |
| F-102（撕裂窗口评估） | **已处置** | F-102 落账「有意接受 + 重启评估触发条件」；as-built §3.5 ①引用关账 |
| F-103（PID 复用） | **已处置** | F-103 登记双保险（TTL 兜底 + 死 PID 即过期路径）；pidalive.mjs 注释同步 |
| F-104（死 PID 视同过期） | **真修+锁住** | 「持有人进程已死视同过期可接管（强于字面 TTL）」测试在位；与 E14-①裁决一致（wx 仲裁保独占） |
| F-105（移交②结论落账） | **真修+锁住** | 同 E4-C；findings 正式条目 + Oracle 测试 + as-built §8.4 |
| F-106（发号失败原子性） | **已处置** | 登记接受（同 R1-10/E4-G） |
| F-107（指纹要素） | **已处置** | 同 E14-⑦ |
| F-108（宿主接线空洞） | **已处置** | 同 E5 候选-15 |
| F-109（P1 损坏租约自旋） | **真修+锁住** | 同 R1-01；MUT-F109 本实例实证红 |

### 对抗证伪（本轮新角度，均为独立探针；探针目录已清理）

| # | 角度 | 探针设计 | 结果 |
|---|------|----------|------|
| a | **renew unlink+wx 窗口**：unlink 后 wx 前被第三方接管 → 我方 wx 失败 → lease-lost | ①接管者先 wx 成功（我方 read 之后）→ renew 必须拒且文件零触碰；②我方已过期 → 新鲜度闸拒且从不 unlink；③60 轮真实并发 renew vs acquire 围绕过期边界（ttl=120ms）压力 | ①E_LEASE_HELD:lease-lost、租约文件字节不变（epoch 仍为接管者的）；②拒绝且文件原样；③双持有人 0、renew 在接管后成功 0、接管租约被覆写 0。代码推演：renew 内 readLease→sameHolder→新鲜度闸→unlink→wx 之间仅 unlink 解析与 wx open 一个微任务边界可插缝，插缝时 wx 失败走 lease-lost（安全收敛），且 T 需在「时钟越过过期点」的同一瞬时完成整串 acquire（3 次 I/O）才可能撞上——正常调度不可达，残余已登记 as-built §3.5 ③ |
| b | **并发发号两轮**（同仓 + 跨仓）各连跑 3 次 | `node --test --test-name-pattern` 定向跑「真并发两进程同时发号」与「跨仓并发建 run 共享索引锁」各 3 轮 | 6/6 全绿；同仓 seq=[1,2] 无跳号无重号、跨仓两仓分段均入账 max_seq=1 无覆盖（丢段 0） |
| c | **三态读数在「损坏租约」下与 acquire 语义一致** | 空文件/坏 JSON/目录占位三种损坏现场：inspect 状态 vs acquire 结果 | 空文件/坏 JSON：inspect=lease_expired+corrupt:true，acquire 立即接管（epoch=1，<15ms）——一致；**目录占位**：inspect=lease_expired 但 acquire=E_LEASE_ACQUIRE_TIMEOUT（313ms 有界）——「lease_expired ⇔ acquire 必成功」在此病理现场不成立，属 fail-closed 取舍（已有测试登记「持久无法创建的损坏现场走有界超时」），登记观察 R2-N5；对照（正常租约）alive→release→dead 正确 |
| d | **E_GITCHECK_FAILED 分支**（非 git 仓） | 无 .git 目录 + 不存在的 git 可执行文件两种入参调 assertStoreRootIgnored | 非 git 仓 → `E_GITCHECK_FAILED:128`（git check-ignore 非零退出），**绝不降级成 E_GITIGNORE_MISSING 放行**；git 缺失 → `E_GITCHECK_FAILED:ENOENT`。fail-closed 双向成立 |
| e | **status.mjs 直跑 CLI 与库调用形态一致性** | 真实 git 仓建 run + detached 宿主起活 → CLI `node runtime/status.mjs <run_id> --root <p>` vs 库 `readHostStatus` | CLI exit 0、stdout 可 JSON.parse、与库返回 **JSON.stringify 逐字节一致**（6 键全同：run_id/workflow_name/host/host_detail/ledger/events）；detached 宿主独立存活可见（alive）；run 不存在 → CLI exit 2 + stderr E_RUN_NOT_FOUND（库抛同文案）；无参数 → exit 2 + usage；全程不注册 bin（node 直跑） |

### 变异探针（P1/P2 项；临时副本内单变量变异，工作区零改动）

| 变异 | 目标 | 结果 |
|------|------|------|
| MUT-R1-03a：删 renew 新鲜度闸 | R1-03 闭合测试「过期租约不得续租」 | 🔴 红（唯一失败；「TTL 过期可接管」「僵尸持有者」仍绿——闸是 R1-03 过期续租路径的直接守卫） |
| MUT-R1-03b：renew 退回 rename 整体覆写（旧缺陷形态） | 同上 | 🔴 红（唯一失败）——防覆写方向至少被新鲜度闸测试钉住 |
| MUT-F109：readLease 损坏当无锁（旧 P1 形态） | 「空/损坏租约可回收，不再无限自旋」 | 🔴 红（2013ms 挂满 2s 超时，复现旧挂死形态） |

### 新发现（R2-Nxx，全部 P3）

| ID | 发现 | 证据 | 建议 |
|----|------|------|------|
| R2-N1 | **readLease 校验不对称**：只校验 holder_pid/epoch 为整数，不校验 expires_at 存在/可解析。构造「pid+epoch 合法、缺 expires_at」的租约 → **inspect=alive 而 acquire=接管（epoch+1）**——三态与 acquire 的不变量对这类形状破裂（探针实证：missing-expires_at 用例 inspect=alive、acquire tookOver=true epoch 5→6）。当前写者恒写 expires_at+expires_at_epoch_ms，此形状不可达于现役写者；但外来/未来写者形状下读数失真（inspect 报 alive 而实际已被接管）。根因：acquire 用 `Date.parse(expires_at)`（NaN→视作不新鲜→接管），inspect 用 `expires_at_epoch_ms ?? Date.parse(expires_at)`（NaN→expired=false→alive） | readLease 把 expires_at 纳入形状校验（缺/不可解析 → LEASE_CORRUPT），两侧语义即自动一致；或 acquire/inspect 统一同一解析表达式。低优先级，不阻塞收口 |
| R2-N2 | **readLease/parseHolder 的 catch-all 吞调用方编程错误**：`readLease(undefined)`（参数名传错的调用方 bug）被 try 包住 → TypeError 被当作 LEASE_CORRUPT 返回，静默掩盖编程错误（探针开发中实测：inspect 返回 lease_expired+corrupt 而非抛 TypeError）。防御性 catch 的代价是掩错 | catch 区分 fs 错误码与其它异常（非 ENOENT/非 fs 错误直接 rethrow），或把 leasePath 计算移出 try |
| R2-N3 | as-built §5 闸表 off-by-one：写「49 条全过（contracts 10 + store 15 + runtime 24）」，实测 **50 条**（runtime 25） | 收口时改数字；probe：grep -cE '^test\(' 三文件 = 10/15/25 |
| R2-N4 | R1-09 部分修复残留：`E_REPO_LOCK_TIMEOUT` 仍未进 reason-codes §四边界声明（E_GITCHECK_FAILED/E_LEASE_ACQUIRE_TIMEOUT/E_LEASE_HELD:<detail> 已补） | §四补一句；与 as-built §3.6 repolock 行（已提 E_REPO_LOCK_TIMEOUT）对齐 |
| R2-N5 | 「lease_expired ⇔ acquire 必成功」不变量在**目录占位**（不可恢复损坏）下不成立：inspect=lease_expired 而 acquire=E_LEASE_ACQUIRE_TIMEOUT。属 fail-closed 取舍（损坏无法由任何一方消除，超时是有界兜底），已有测试登记 | 无需动作；若想严格化可在 inspect 的 corrupt detail 区分「可回收损坏」与「不可消除占位」，属可读性增强非缺陷 |

### 整体结论

**approved（附 P3 观察清单，无 P0/P1/P2 遗留）**。

轮1 changes-requested 的全部返工面已实证闭合：R1-03（P1，renew 覆写窗口）以新鲜度闸 + unlink+wx + 双变异红 + 60 轮压力探针锁住；R1-04（P2，as-built）以 7b98fde 收口落盘锁住（仅剩 §5 数字 off-by-one）。E4 needs_evidence 的 B/C/F 与 E14 两条遗漏（跨仓锁粒度、指纹要素）与 E5 命中的候选-12/13/14/15 全部处置到位（Oracle fixture 真实引用、测试隔离真 home 零写入、F-105 落账、候选-15 半锁半登记）。五道机器闸独立复跑全绿（50/50、33/33、0 违规、55 份、capability_hash=970b54601ae582a5… 零漂移），对抗证伪五组（renew 窗口/并发发号 6 轮/损坏三态/E_GITCHECK_FAILED/status CLI≙库）全部通过预期语义。

剩余未修仅 P3 观察与文档 nit（R1-07 barrier 可选增强、R1-11 路径大小写、R2-N1~N5），全部登记且不阻塞本卡验收；findings F-101~F-109 可从 open 转 resolved。

---

### 两轮独立复核结论

| 轮次 | 复核人 | 结论 |
|---|---|---|
| 第一轮·全面复核 | ReviewRound1（fresh subagent，未参与实施） | changes-requested 已闭合 |
| 第二轮·增量复核 | ReviewRound2（fresh subagent，未参与实施且未参与第一轮） | approved |

## AI 提交区　⚠️ This is not human approval

## E8~E10 收口区（verify 备料，2026-08-22 主控）

### E8 完成条件逐条挂证据

| # | 条件 | 证据 | 结论 |
|---|------|------|------|
| 1 | P5-M1 detached 存活 / 可恢复 | runtime.test.mjs「detached 宿主存活可读」+ E-201 真实场景预演（启动 shell 退出后新 shell 读数 alive）；DHR_31 端到端行使后续 | PASS（AI 面） |
| 2 | P5-M3 强杀恢复同签名 + E_LEASE_HELD + 接管 + 三态 | runtime.test.mjs「强杀 -9 后 Store 重建逐字节同签名」「首取 epoch=1 第二宿主 E_LEASE_HELD」「TTL 过期可接管」「inspect 三态⇔acquire 不变量」 | PASS |
| 3 | P5-M8a Store 根 / gitignore 前置 / 零误跟踪 | runtime.test.mjs「缺忽略前置 E_GITIGNORE_MISSING 且零落盘」「F-009 任意深度放行」「同仓连发零误跟踪双证」 | PASS |
| 4 | P5-M8b run_id 规范化 + 锁内发号 + 五反例 + 锁超时陈旧回收 | runtime.test.mjs「runid 五反例」「真并发两进程 seq=[1,2]」「跨仓并发不丢分段」「活锁超时/在途锁不偷/TTL 回收」 | PASS |
| 5 | F-011 封堵回归 | store.test.mjs「F-011 封堵——终态 kind 不得经 raw appendEvent」「writeGuard 失守拦截」 | PASS |
| 6 | 移交② lease 等价性复核 | runtime.test.mjs「移交②：P1 恢复锁/CAS Oracle 复验」（result-A1-wrong-generation.json 实读）+ findings F-105 落账 + as-built §8.4 回写 | PASS |
| 7 | 人判需求境（宪章#3） | E-201 机器侧预演已录（progress）；真实终端闭环待 E11 用户执行/确认 | 待人验 |

### 完成条件逐条挂证据

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | Detached 宿主在启动它的终端关闭后仍存活推进或可恢复；DSH 不参与。 | AI + 人 | E-201/E-202；`runtime.test.mjs` detached 场景；verify `bd6b3b5` | [x] |
| 2 | 强杀宿主后新宿主从 Store 重建逐字节相同 `state_signature`；同 Run 第二宿主被拒（`E_LEASE_HELD`）；lease 过期（或持有人进程已死）可接管；三态读数正确区分活着/已死/lease 过期。 | AI | `runtime.test.mjs` 的强杀、拒第二宿主、接管与三态用例；E-202；verify `bd6b3b5` | [x] |
| 3 | Store 根落 `<repo>/.dh-relay/<run_id>/`；`.gitignore` 前置缺失 start fail-closed（按 `git check-ignore` 语义判定，反例=任意深度模式）；不改业务仓 `.gitignore`；零误跟踪双证。 | AI | `runtime.test.mjs` 的 E_GITIGNORE_MISSING、任意深度与零误跟踪用例；verify `bd6b3b5` | [x] |
| 4 | `run_id = R<nnn>-<slug>-<yyyyMMdd>` 规范化 + 仓级锁内发号：真并发两进程各得不同序号、无跳号无重号；`(repo, run_id)` 复合键唯一；slug 五反例（中文/大写/空格/超长/首尾短横线）拒绝且不静默截断；锁有超时与陈旧回收。 | AI | `runtime.test.mjs` 五反例、真并发、锁超时与回收用例；verify `bd6b3b5` | [x] |
| 5 | F-011 封堵：终态 kind（`attempt_succeeded/failed/orphaned`）不能经 raw `appendEvent` 落账，只能经 `appendResult`；回归反例钉住。 | AI | `store.test.mjs` F-011 封堵回归；verify `bd6b3b5` | [x] |
| 6 | lease 语义等价性复核：用 P1 恢复锁/CAS 用例（`result-A1-wrong-generation.json` 的权威代次拒收语义为 Oracle）证明 v2 lease+fencing 的唯一写者保证不弱于 v1 `authority_generation`；结论落账。 | AI | `runtime.test.mjs` 移交② Oracle 复验、findings F-105、as-built §8.4；verify `bd6b3b5` | [x] |
| 7 | 人判需求境证据：真实开一个 Run → 关掉全部终端（或断 SSH）→ 隔一段时间回来 → 跑宿主状态读数看到宿主与账都在。实录留 progress.md。 | 人 | E-201/E-202；verify `bd6b3b5` 的 `Verified-Via: chat-confirm` 与真实终端演示记录 | [x] |

### E9 交付汇报（七段）

① 交付：`relay-core/runtime/` 八模块（runid/pidalive/repolock/lease/gitignore/startrun/host/host-main/status）+ store 两处最小触碰（F-011 封堵、writeGuard fencing）+ 测试 50 条。
② 验收：六条机器证逐条挂证据见 E8；人判条件 7 待 E11。
③ 风险：无 open P0/P1/P2；P3 观察 7 项全登记（F-110）。
④ 尾巴：无未关闭 P2/P3 需另立卡；E5 新候选-15 已入教训库候选区待裁决。
⑤ 复核：轮1（fresh）changes-requested 全数返工闭合；轮2（fresh 换人）approved；E4/E5/E14 三路独立复核结论落账。
⑥ 需求境：E-201 机器侧预演（关终端宿主仍活 + 强杀接管）已录；人判闭环待 E11。
⑦ 落点：worktree wt/DHR_51 @ 1573a6d，待 E11 授权后 squash 合入 + verify(dh-relay)。

### E10 证据展示区

- 五道闸最终实跑：npm test **50/50** exit 0；validate --selftest **33/33**；audit-contracts **0 违规**（F-042 ajv 权威闸、K-3 结构闸、token 164 未登记 0）；fixture-manifest **55 份相符**；capability-baseline **8 份相符、capability_hash=970b54601ae582a5… 与 DHR_29 基线零漂移**（全程未触碰契约/基线文件）。
- 变异探针实证（全部临时副本、仓库零改动）：F-011 封堵删→红；writeGuard 不接线→红；损坏租约当无锁→红（复现旧挂死）；新鲜度闸删→红；renew rename 覆写→红；MUT-C 删续租→红。
- 真实场景（E-201）：临时仓 R001-demo-20260822 + detached 宿主 pid 13952 → 启动 shell 退出 → 新 shell `status.mjs` 输出 host=alive、events=2、租约在续 → SIGKILL → 接管 epoch 2 → 现场清理。
- 人判需求境闭环操作路径（E11 供用户执行）：①我准备演示脚本（复用 E-201 现场流程）→ ②用户关掉全部终端 → ③新终端跑状态读数看到宿主与账都在 → ④结论回填 progress。

## 人类签名区

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| DHR_51 人判需求境 | 审阅 E-201/E-202 的真实终端关闭与恢复演示 | 新终端读到宿主与账仍在，强杀后可安全接管 | [x] 用户于 2026-08-22 对话确认；`verify(dh-relay)` `bd6b3b5` 已记录 `Verified-Via: chat-confirm` |
