<!-- dh:v1 -->
# task_plan — DHR_51

## 要读的上下文 (Context Packet) ★前置

| ID | 来源 (path / url) | 为什么 |
|----|------------------|--------|
| C-001 | `docs/modules/dh-relay/dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md` §3.2 DHR_51 + §4.1 P5-M1/M3/M8 | 唯一目标、六条机器证、三条 CLI 硬边界、实施提示 6 条。 |
| C-002 | `relay-core/README.md`、`docs/modules/dh-relay/as-built/relay-core.md`（§3.5、§6、§7、§8） | 硬约束 6 条、「这套东西怎么长成的」八条教训、F-011 与撕裂窗口两笔已知边界。 |
| C-003 | `relay-core/store/{store.mjs,state.mjs}`、`relay-core/test/store.test.mjs` | 现役唯一写者 API 形态、串行写队列、终态守卫位置；测试惯例（注入时钟、临时 root、精确断言）。 |
| C-004 | `relay-core/contracts/{reason-codes.md,compat-matrix.md,relay.event.v2.schema.json,_shared/relay.common.v1.schema.json}` | 可用码集与「进程内异常前缀 vs 协议码」边界；lease 事件 kind 的字段约束；移交第 1 条原文。 |
| C-005 | `tools/tests/fixtures/runner/results/result-A1-wrong-generation.json` 及 `relay-runner-authority.ps1` 中 CAS 断言 | v1 权威代次拒收语义 = 移交② 的 Oracle。 |
| C-006 | design/02 §2.4 续跑判定、D18/D23 拍板段；design/06 H1 | 三态语义、发号规则、detached 存活命题的原文出处。 |

## 施工步骤 (Steps)

| # | 改动文件（Create/Modify/Test + 路径） | 怎么改（签名级） | 怎么验（命令 → 预期输出） |
|---|--------------------------------------|------------------|--------------------------|
| 1 | Create · `runtime/runid.mjs` | `normalizeThemeSlug(slug)`（ASCII 小写/数字/短横线，≤30，首尾非短横线，违例抛 `E_RUN_ID_INVALID:<why>`，绝不截断转写）；`formatRunId({ seq, slug, date })` → `R<nnn>-<slug>-<yyyyMMdd>`；`isValidRunId(id)`。 | 定向测试：正例 R007-…；五反例各红且报错含原输入。 |
| 2 | Create · `runtime/repolock.mjs` | `acquireRepoLock({ path, ttlMs, timeoutMs, clock })`：wx 独占创建 + 过期/死 PID 陈旧回收 + 超时抛内部前缀 `E_REPO_LOCK_TIMEOUT`；`releaseRepoLock(lock)` 校验持有人再删。PID 探活 = `process.kill(pid,0)`（ESRCH 死 / EPERM 活）。 | 定向测试：活锁超时拒、陈旧锁即收、双进程互斥。 |
| 3 | Modify · `store/store.mjs`；Test · `test/store.test.mjs` | ①F-011：公开 `appendEvent` 对 `attempt_succeeded/failed/orphaned` 抛 `E_TERMINAL_STATE_CONFLICT:<kind>-via-raw-append`（appendResult 内部路径不受影响）；②`createStore/openStore` 增可选 `writeGuard`，在串行队列内、每次变更落盘前调用，抛错即中止。 | 先红后绿：raw 终态投递被拒且账本零变化；guard 抛错时事件与工件都不落盘。 |
| 4 | Create · `runtime/lease.mjs` | `acquireLease({ runRoot, runId, ttlMs, clock })` → `{ pid, epoch, expires_at, … }`：无锁即取（epoch=1）；过期或持有人 PID 已死可接管（epoch+1，先记 `lease_expired` 再记 `lease_acquired`）；新鲜且活 → `E_LEASE_HELD`。`renewLease` 读-改-校验持有人后原子重写；`verifyLeaseOwner` 供 fencing。 | 定向测试：第二宿主被拒；接管产生两事件且 epoch 递增；僵尸宿主 renew 失败。 |
| 5 | Modify · `runtime/*` 接线 fencing | 宿主侧所有经 store 的变更都挂 `writeGuard: () => verifyLeaseOwner(lease)`——接管后旧宿主的任何写（含 appendResult）在队列内被 `E_LEASE_HELD:lease-lost` 拒绝。 | **移交② 主断言**：模拟接管后旧 handle 写 → 红；对照 P1 `result-A1-wrong-generation.json` 映射用例（陈旧权威 ≙ 失去 lease）必须同拒。 |
| 6 | Create · `runtime/gitignore.mjs`、`runtime/startrun.mjs` | `assertStoreRootIgnored({ repoRoot })` 调 `git check-ignore -q .dh-relay/x`，exit 1 → `E_GITIGNORE_MISSING`，不改业务仓文件；`createRunWithNumbering({ repoRoot, slug, run, indexPath })`：slug 规范化 → gitignore 闸 → 仓级锁内读 `runs.json` 该仓分段 max+1 → 复合键查重 → 建 run 根 + createStore → 锁内原子回写索引。索引路径默认 `~/.dh-relay/runs.json`，**可注入**供测试隔离。 | 定向测试：缺忽略行 start_rejected；任意深度模式（字面量法会假阴性的反例）放行；零误跟踪（ls-files 空 + porcelain 净）。 |
| 7 | Test · `test/runtime.test.mjs`（真并发） | 两个真实子进程同时跑发号 helper → 各得不同序号、无跳号无重号；runs.json 结构合法。 | `node --test` 并发用例绿；实施提示 4 的「真并发」要求落实。 |
| 8 | Create · `runtime/host.mjs`、`runtime/host-main.mjs`、`runtime/status.mjs` | `runHostSession({ repoRoot, runId, ttlMs, tickMs, clock })`：闸检查 → 取 lease → openStore（fail-closed 重建）→ tick 循环续租 → SIGTERM/SIGINT 优雅释放退出；`startDetachedHost` spawn detached+unref；`readHostStatus` 三态：alive=新鲜且 PID 活 / lease_expired=过期或持有人已死（此时 acquire 必成功）/ dead=run 在而 lease 无；CLI 入口 `node runtime/status.mjs <run_id> [--root <p>]` 只打印 JSON，不注册 bin。 | 强杀 -9 后新宿主重建 `state_signature` 与杀前逐字节相同（P5-M3）；状态↔acquire 结果等价性断言；真实 detached 子进程存活探针。 |
| 9 | Modify · `as-built/relay-core.md`、`workspace/DHR_51/{progress,findings}.md` | as-built 新增 runtime 小节 + §3.5 刷新（F-011 关账、撕裂窗口评估结论落账）；findings 登记范围注记（store 触碰授权）与评估结论。 | 全量闸：`npm test` / validate --selftest / audit-contracts / fixture-manifest / capability-baseline 五道全绿且基线零漂移。 |

## 关键决策（一句话各一行）

- Worktree：是，分支 = `wt/DHR_51`，目录 = `.dh-worktrees/DHR_51`；自本地 master `b441fc6` 建（F-010 教训，不从 origin/master）。
- F-011 封堵落点选 store 公开入口而非仅 runtime 不暴露——库级洞不堵会给 DHR_52 RPC 留旁路；已在 brief 预登记为授权范围内触碰。
- Fencing 用「写前 guard 重验 lease 持有人」而非全局单调代次——与 v1 CAS 同强度（写时校验），且不需要跨重启的持久计数器。
- 「持有人进程已死」视同 lease 过期可接管（比字面 TTL 更早）：独占性仍由 wx 仲裁保证，可用性对齐 P1 恢复锁的陈旧回收语义；等价性结论里明示这一处是**强于** v1 的差异。
- PID 复用导致假活的残余风险：登记为已知边界，TTL 是兜底（最坏假 alive 至过期），不做跨平台进程启动时间比对。
- 时钟全部注入（DHR_02 F-011 教训）；`~/.dh-relay/runs.json` 路径可注入，测试永不触真 home。
