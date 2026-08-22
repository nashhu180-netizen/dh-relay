<!-- dh:v1 -->
# brief — DHR_51 Detached 宿主 / lease / run_id 发号 / 恢复

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|---------|-------------|
| DHR_51 | P5 Relay v2 持久内核与 DSH 桥接 | DevPlan §3.2 DHR_51（`DHR-B-15` 新建） |

## 目标 (Outcome)

把 DHR_29 的 Store 装进一个脱离任何终端与客户端存活的后台宿主：PID/lease 保证同一 Run 唯一活写者、强杀后新宿主重建出相同 `state_signature`、`run_id` 按 D23 规范化并在仓级锁内发号、Store 根规范化到 `<repo>/.dh-relay/<run_id>/` 且 `.gitignore` 前置 fail-closed；交付只读的宿主三态读数。顺带完成 DHR_29 带出的两笔移交：F-011 终态 kind raw 入口封堵、compat-matrix §6 移交第 1 条 lease 语义等价性复核。

## Zero-context 自查

执行者须先读本文件、`task_plan.md`、DevPlan DHR_51 卡、`relay-core/README.md`、`as-built/relay-core.md`（§3.5 已知边界与 §8.4 移交三条）、`contracts/{reason-codes.md,compat-matrix.md}`。三条硬边界：**不注册 `bin`**（package.json 不在变更范围）；design/02 B7 只承接三态半条、收口不得按整条记过；宿主三态来源仅 PID/lease 文件 + `lease_*` 事件，以库返回值与测试断言呈现，**不自造协议对象、不冻结 v0 形状**。

## 完成条件 ★必写

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|------|---------------|--------------------------------|
| 1 | Detached 宿主在启动它的终端关闭后仍存活推进或可恢复；DSH 不参与。 | AI + 人判 | DHR_51；design/06 H1 · P5-M1 |
| 2 | 强杀宿主后新宿主从 Store 重建逐字节相同 `state_signature`；同 Run 第二宿主被拒（`E_LEASE_HELD`）；lease 过期（或持有人进程已死）可接管；三态读数正确区分活着/已死/lease 过期。 | AI | DHR_51；design/02 B7 D18 · P5-M3 整条 |
| 3 | Store 根落 `<repo>/.dh-relay/<run_id>/`；`.gitignore` 前置缺失 start fail-closed（按 `git check-ignore` 语义判定，反例=任意深度模式）；不改业务仓 `.gitignore`；零误跟踪双证。 | AI | DHR_51 · P5-M8a；DHR_28 F-009 |
| 4 | `run_id = R<nnn>-<slug>-<yyyyMMdd>` 规范化 + 仓级锁内发号：真并发两进程各得不同序号、无跳号无重号；`(repo, run_id)` 复合键唯一；slug 五反例（中文/大写/空格/超长/首尾短横线）拒绝且不静默截断；锁有超时与陈旧回收。 | AI | DHR_51 · P5-M8b；design/02 D23 |
| 5 | F-011 封堵：终态 kind（`attempt_succeeded/failed/orphaned`）不能经 raw `appendEvent` 落账，只能经 `appendResult`；回归反例钉住。 | AI | DHR_29 findings F-011 |
| 6 | lease 语义等价性复核：用 P1 恢复锁/CAS 用例（`result-A1-wrong-generation.json` 的权威代次拒收语义为 Oracle）证明 v2 lease+fencing 的唯一写者保证不弱于 v1 `authority_generation`；结论落账。 | AI | compat-matrix §6 移交第 1 条 |
| 7 | 人判需求境证据：真实开一个 Run → 关掉全部终端（或断 SSH）→ 隔一段时间回来 → 跑宿主状态读数看到宿主与账都在。实录留 progress.md。 | 人 | 宪章#3；DevPlan DHR_51 人判条 |

## 边界 (Boundaries)

- In scope：`relay-core/runtime/`（含只读状态读数入口，不建 `cli/`）、`relay-core/test/`、用户级 `~/.dh-relay/runs.json`（仓外；实现须允许注入索引路径供测试隔离）、`workspace/DHR_51/`。
- **授权范围内的 store 触碰（预先登记，非静默扩范围）**：F-011 的封堵落点在 `store.mjs` 公开 `appendEvent` 入口——只挡 runtime 层会留下库级洞给一切后续调用方（含 DHR_52），违背 finding 处置本意；同批为写权 fencing 增加**通用可选 `writeGuard` 回调**（域中立，不含 lease 知识）。两处均为最小 diff，回归测试钉住。
- Out of scope：RPC/握手（DHR_52）、CLI 命令集与正式 Read Model、双根发现（DHR_30）、多卡调度、Herdr、契约 schema 任何一字（不动 capability_hash）、撕裂窗口的 WAL 级重构（本卡只做评估落账）。
- 何时必须停下问人：P0/P1 三轮不收敛；实现中发现必须改冻结契约或 v0 形状；E10 之后的 E11 本地收口确认。

## 触及子系统（收口时更新其 as-built）

- `relay-core`：更新 `docs/modules/dh-relay/as-built/relay-core.md`——新增 runtime 小节（宿主/lease/发号/恢复/三态读数）、§3.5 已知边界刷新（F-011 关账、撕裂窗口评估结论）。
