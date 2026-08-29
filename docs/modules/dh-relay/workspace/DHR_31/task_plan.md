<!-- dh:v1 · task_plan.md — 施工图（实施方案的家）。🔵 开工那一刻才写，一次性消耗品：跑偏了去 progress.md 记实际，不回头改这里。
     标准档详到"另一个 agent 能照着直接施工"（动哪个文件 / 关键代码片 / 测试点）——因为马上执行、当场消耗、从不维护；轻档可只写大方向。
     本模板标准档专用；派 headless worker 的轻档请改用 `task_plan-轻档.md`。 -->
# task_plan — DHR_31 basic-agent-task 端到端闭环

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：执行者默认“只知道本文件 + `brief.md` + DevPlan 任务卡”，不得靠脑补上下文施工；按步骤照做，偏离路线只记 `progress.md` 不回写本文件；每批默认 3 步或一个可独立验证功能点后，先跑本批验证并给阶段汇报（①~⑦），再继续下一批。

| ID | 来源 (path / url) | 为什么 |
|----|------------------|--------|
| C-001 | `docs/modules/dh-relay/dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md` §3.2 DHR_31 + §2.1/§2.3 + §4.1 | 验收口径唯一权威；实现单元与最小 Runtime 接口定义（`validate(request)` 在 §2.3） |
| C-002 | `docs/modules/dh-relay/workspace/DHR_31/brief.md` | 完成条件只读副本 + 边界 |
| C-003 | `relay-core/README.md` | 硬约束 6 条 + 「改了什么跑什么」基线对照表——动 relay-core 前必读 |
| C-004 | `docs/modules/dh-relay/as-built/relay-core.md` | 现役实现快照（runtime service / store / rpc / cli / bridge 是怎么长成现在这样的） |
| C-005 | `docs/modules/dh-relay/design/06-多控制面与Headless-SSH运行-设计补充.md` §11 验收命题 | H1/H2/H3/H5/H6/H7/H12 命题原文 |
| C-006 | `relay-core/contracts/`（schemas + `reason-codes.md` + `capability-baseline.json`） | 协议冻结集与指纹；`relay.resolved-plan/v1` v0 形状是 Workflow 定义的起点；改契约必须走批次 + 重生成三份基线 |
| C-007 | `docs/modules/dh-relay/workspace/DHR_30/review.md`（RISK-DHR30-DSH-RENDER 登记位：当前状态行 + 条件 5 取证路径分析）+ `workspace/DHR_30/evidence/` | 承接的风险项原文（另见 verify `93df648` Risk-Refs）；终端冒烟转录的证据格式先例 |
| C-008 | `docs/modules/dh-relay/workspace/DHR_26/findings.md` + DHR_49 workspace（DSH Host Plugin 侦察落档） | 树外 DSH 插件施工依据：`dsh plugin` profile 装载、`ctx.provide` API、repack 流程、rc 迭代风险 |
| C-009 | Code Scout 侦察报告（progress.md E-002 挂账） | relay-core 现状结构、CLI→runtime 调用链、测试与证据惯例 |

## 施工步骤 (Steps)　★详细级（轻档在 task.md 写精简 3–5 步即可）

> S2 已冻结（2026-08-28，主会话依据 Code Scout 侦察报告起草）。执行者是零上下文 codex headless worker：cwd 必须是 `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\DHR_31`，分支 `wt/DHR_31`。跑偏只记 progress.md。
>
> **侦察给定的三个基点事实**（worker 不必重新发现）：①`relay-core/workflows/` 与 executor 完全不存在；②`validate` 是一行无条件 `{valid:true}` 的 stub（`relay-core/runtime/service.mjs:550`），RPC 方法名/参数/结果 schema 均已冻结（`validate_params={contract_id,document}`，`validate_result={valid,reason}`）；③节点/attempt 状态机与终态守卫全部就位但无人驱动（`store/state.mjs` 折叠、`store.mjs:20` TERMINAL_RESULT_KINDS 硬拒 raw append、`store.mjs:127-139` fresh attempt 机制现成）。
>
> **全程硬边界（每批都适用）**：
> - **禁改 `relay-core/contracts/` 任何文件**（含 schema 的一个字、reason-codes.md、基线）。若实现中发现"必须新增 reason code / 改 schema / 扩 capability executor_kinds"才能继续——**立即停本批，findings 登记，写 DONE 摆回主会话**，不得自行开契约批次。判定辅助：改动后 `node tools/capability-baseline.mjs`（不带 --write）必须报零漂移，capability_hash 保持 `a990fdda…`。
> - 终态只能经 `store.appendResult()` 记账（`appendEvent` 写 attempt 终态会被 `E_TERMINAL_STATE_CONFLICT` 硬拒，这是设计不是 bug）。
> - locator 一律相对/符号化（README 硬约束 4）；运行现场在 `<repo>/.dh-relay/`，不入仓。
> - `test/control-plane-imports.test.mjs` 的禁引钉子：cli/adapters/rpc 不得 import store；生产代码不得引 `createRunWithNumbering`/`startDetachedHost`/`host-main`。新建 `workflows/` 不在钉子名单里，但同样遵守精神：workflow 定义是数据（JSON），驱动逻辑归 `runtime/`。
> - 改了 fixture / schema / 新增字段名，各自必跑 README `:67-73` 对照表命令——本卡预期**一个都不用跑**（因为禁改 contracts），跑了说明越界。
> - 每批完成 = 本批测试绿 + 全量 `npm test` 绿 + `npm run audit` 0 违规 + `node tools/validate.mjs --selftest` 48/48 + 过程写 progress.md（含证据 E-ID）+ 按路径 commit 到 wt/DHR_31。

## 施工步骤 (Steps)　★详细级

### 批 0 · 进场核对（worker 第一动作）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 0.1 | —（只读） | 核对 `pwd`=worktree 根、`git branch --show-current`=wt/DHR_31、HEAD=403b367 或其后继；读 C-002 brief、C-003 README、C-005 design/06 §11、C-006 契约（重点 `relay.run.v2.schema.json:113-189` 节点定义、`v0-shapes/relay.resolved-plan.v1.shape.json`、`reason-codes.md`）。 | `cd relay-core && npm test`（158/158）、`npm run audit`（0 违规）、`node tools/validate.mjs --selftest`（48/48）——基线不绿即停，findings 登记。 |

### 批 1 · H6 可达性推导（TDD，四例判据）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 1.1 | Test · `relay-core/test/reachability.test.mjs`（Create） | 四例判据测试（brief 条件 3 附表逐字对应）：例1 深度1（输入用 `contracts/OPEN-POINTS.md:39-47` 的逐字样例 JSON：`gate` dsh-only+required:false，`final` required:true+depends_on:["gate"]）→ 期望拒；例2 深度≥2（`gate`(dsh-only,false) ← `mid`(false) ← `final`(true) 传递链）→ 拒；例3 阴性对照（图含至少一个 required:true 节点 + 一个不被任何 required 节点传递可达的 dsh-only 节点）→ 放行；例4 直接形态（输入复用 `fixtures/negative/h6-dsh-only-required-role.json`）→ 拒。另加边界组：depends_on 指向不存在节点 → 拒（fail-closed）；depends_on 成环 → 拒；自环 → 拒。 | `node --test test/reachability.test.mjs` → 先全红（模块不存在）。 |
| 1.2 | Create · `relay-core/runtime/reachability.mjs` | 纯函数 `export function assessRunReachability(runDoc)` → `{valid, reason, at}`。算法：①建 node_id→node 映射，depends_on 引用缺失/成环即 `{valid:false, reason:'E_BAD_VALUE', at:'/nodes/<i>/depends_on'}`（复用既有码，**不新增**）；②必经集 = 全部 `required:true` 节点沿 `depends_on` 的传递闭包（含自身）；③必经集内任一节点的 `executor_profiles` 全部 `kind==='dsh-agent'` → `{valid:false, reason:'E_DSH_ONLY_REQUIRED_ROLE', at:'/nodes/<i>/executor_profiles'}`；④否则 `{valid:true, reason:null}`。零依赖、不 import store/service。 | 1.1 的四例+边界组转绿。 |
| 1.3 | Modify · `relay-core/runtime/service.mjs:550` 附近 | 替换 stub：validate handler 对 `{contract_id, document}` 先过冻结校验器（`tools/validate.mjs` 导出的 `loadAjv`/`validateOne`，与 store/rpc 同一份实现），schema 不过即 `{valid:false, reason:<校验器 reason>}`；`contract_id==='relay.run/v2'` 时叠加 `assessRunReachability`。返回值严格 `{valid, reason}` 两字段（结果 shape 已冻结，多一个字段都不行）。 | Test · `test/service.test.mjs` 增 validate 用例：四例经 RPC `validate` 方法各返回期望 valid/reason；`node --test test/service.test.mjs` 绿。 |
| 1.4 | Modify · `relay-core/runtime/service.mjs` `runStart`（`:293` 附近，createStore 之前） | start 前对 `params.run` 跑 `assessRunReachability`，invalid 即按既有错误路径 fail-closed 拒 start（error receipt 惯例照 DHR_30 契约批次的 error receipt required 语义，reason 用 assess 返回值）；不动幂等/发号逻辑。 | Test：start 一份例1 文档 → 拒且 reason=E_DSH_ONLY_REQUIRED_ROLE、无 Run 目录残留；start golden `fixtures/golden/run.v2.json` → 照常成功。全量回归 + audit + selftest + 指纹零漂移。 |
| 1.5 | Record | commit（路径限 `relay-core/runtime/`、`relay-core/test/`）；progress 记批 1 证据（命令+输出摘要→E-ID）。 | `git status --short` 无 contracts/ 改动 → PASS。 |

**批 1 检查点**：主会话派 fresh 小审只看本批 diff。

### 批 2 · basic-agent-task Workflow 定义 + Process 执行闭环（TDD）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 2.1 | Create · `relay-core/workflows/basic-agent-task/run.template.json` + `steps/prepare.mjs`、`steps/process-task.mjs`、`steps/verify.mjs` + `README.md` | Workflow 定义 = 一份合法 `relay.run/v2` 文档模板：`workflow_name: "relay/basic-agent-task@1"`；三节点链 `prepare` → `process-task`(depends_on:[prepare]) → `verify`(depends_on:[process-task])，全部 `required:true`、`executor_profiles:[{kind:"process", ref:"workflows/basic-agent-task/steps/<node>.mjs"}]`（**ref 相对路径**，README 硬约束 4）。steps 脚本：stdin 收 JSON 上下文（含前序节点 structured 结果），stdout 出 JSON 结构化结果；`process-task` 产出可机验的确定性载荷（如对固定输入做变换+计数），`verify` 对照期望断言、不符 exit 非 0。README 写清节点语义与生成 run 文档的方法。 | `node tools/validate.mjs workflows/basic-agent-task/run.template.json`（或等价：golden 校验路径）→ 过 `relay.run/v2`；`assessRunReachability` → valid。 |
| 2.2 | Test · `relay-core/test/workflow.test.mjs`（Create） | 闭环断言（先红）：经 service `start` 该 run 文档 → 节点按依赖序推进，事件账出现 `node_started`/`attempt_started`/`attempt_succeeded`（各带 node_id/attempt_id，经 `registerReceipt`/`appendResult` 落账）；`verify` 节点成功后全部 required succeeded → 追加 `run_finished` 事件（该 kind 已冻结但当前零生产者，本卡首用，不改 schema）；`state.mjs` aggregate=`succeeded`；重放（重开 store）状态逐字一致。负例：`process-task` 步骤脚本 exit 非 0 → `attempt_failed` + reason=`E_EXECUTOR_EXIT_NONZERO`（reason-codes.md:50 已定义零使用，首用不算新增）、run 不得标 succeeded。 | `node --test test/workflow.test.mjs` 红→绿。 |
| 2.3 | Create · `relay-core/runtime/process-executor.mjs` + `relay-core/runtime/workflow-driver.mjs`；Modify · `service.mjs`（actor 挂接） | driver：service actor 内，Run 建立后找 ready 节点（depends_on 全 succeeded）→ `store.registerReceipt()` 开 attempt → process-executor `spawn('node', [resolve(repoRoot, ref)])`（ref 只允许仓内相对路径，越界拒）→ stdin 喂上下文、收 stdout JSON → `store.appendResult()`（成功 `outcome:'succeeded'` + `structured`；exit≠0 → `outcome:'failed'` + `reason:'E_EXECUTOR_EXIT_NONZERO'`）→ 下一 ready 节点；required 全 succeeded → `appendEvent({kind:'run_finished'})`。**只在宿主 actor 一侧驱动（唯一写者不破）**；`stop` control 要能中断在跑的子进程（`E_EXECUTOR_KILLED`）；`resume` 后从事件账重建进度、对失败节点开 fresh attempt（`store.mjs:127-139` 机制现成）。 | 2.2 转绿；`test/control-plane-imports.test.mjs` 仍绿（driver 在 runtime/ 合法）；全量回归 + audit + selftest。 |
| 2.4 | Record | commit；progress 记批 2 证据。 | 同批 1 收口检查。 |

**批 2 检查点**：fresh 小审本批 diff（重点：唯一写者纪律、终态入口、ref 路径逃逸）。

### 批 3 · CLI 行使 + 真实终端断连/重连实录（需求境证据硬条）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 3.1 | Create · `relay-core/test/e2e-basic-agent-task.test.mjs`（或并入 workflow.test） | 端到端：CLI 进程级 `relay start --run <生成的 run.json>` → `relay events <id>` 观察闭环 → `relay status/inspect` 终态 succeeded；text 与 --json 同源断言沿用 read-model-mirror 惯例。 | `npm test` 全绿。 |
| 3.2 | Create · `docs/modules/dh-relay/workspace/DHR_31/evidence/e2e-disconnect-<YYYYMMDD>.txt` | **真实终端**（不是测试进程）：全新终端 A `relay start`（给 process-task 加可配置延时使 run 跑 ≥30s）→ 记录启动耗时 → **杀掉终端 A** → 终端 B `relay status/events` 看到 run 仍在推进或已 succeeded、事件账连续 → 记录重连耗时。转录格式照 DHR_30 `evidence/cli-smoke-20260828.txt` 先例：头 4 行 `#` 注释、`$ 命令`+原样输出+`[exit=0]`、末行自检行（命令头数=exit 码数=exit0 数）。 | 转录落仓；耗时读数（启动/恢复/资源）单独小结进 progress——这是 P5-H 人判材料。 |

**批 3 检查点**：fresh 小审（重点：实录真实性——service 是否真 detached、不是测试内存态）。

### 批 4 · Agent 节点（条件项，Process 闭环通过后才开）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 4.1 | —（先决策后施工） | **先核对能力边界**：`capability-baseline.json` executor_kinds=`["process"]`。若让 Runtime 托管 pi-agent/dsh-agent 需动基线=能力变更 → **停，findings 登记摆主会话**。候选窄路径（不动基线）：Agent 节点 attempt 由外部代持（Bridge/手动 receipt+result 注入），runtime 只记账——验 H7/H12 语义：杀掉 executor → 仅该 attempt `attempt_orphaned/failed`（`E_EXECUTOR_ADAPTER_LOST`/`E_EXECUTOR_ORPHANED` 首用）、其他节点与 Run 真相不动；retry 产生 fresh attempt。 | 测试断言 + 全量回归。Agent 失败不推翻 Process 结论（卡面明文）。 |

### 批 5 · DSH 附加客户端 + 真实渲染截图（树外承接项，销 F-001）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 5.1 | 树外 · `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\relay-control-pilot\src\dsh-host\`（数据源层） | fixture 数据源改为经 `relay-core/adapters/dsh-bridge` `connectDshBridge({repoRoot})` 取活数据（本仓真实 service、真实 Run）；**保持 `ctx.provide('relayPilot', api)` 五个只读方法签名不变**（面板 src/dsh-client 零改动优先）。改动前先跑 `workspace/DHR_26/artifacts/.../check-drift.ps1` 核镜像基线；改完把 diff/关键文件镜像回落 `workspace/DHR_31/evidence/`。 | 本地起 service + 一条真实 basic-agent-task Run → host API 返回活数据。 |
| 5.2 | 树外 · repack + 重装 | `npm pack --pack-destination ..\..\dist`（dist 不存在先建，--pack-destination 不自建目录）；**必须 `dsh plugin --profile web remove` 再 `add`**（F-005：版本号不变时 add 静默装旧版，退出码 0 不可信），装完核四个关键文件 SHA256。 | SHA256 对照记录落 evidence。 |
| 5.3 | 截图取证 | 起 DSH（`$DSH_HOME` 照 DHR_49 配方）→ 专用会话先发一条消息激活页签（F-007：hero 态无 tab）→ Relay 面板显示本仓真实 Run（与 CLI `relay status` 同数据对照）→ 浏览器 `http://127.0.0.1:3080` 截图。**若 codex 环境截不了图**：把环境跑到"只差截图"状态，progress 写明，DONE 摆回主会话（主会话有浏览器工具可补截）。 | 截图 + CLI 同态对照落 `workspace/DHR_31/evidence/`；H3 断言（附加客户端见同一状态）。 |

**批 4/5 检查点**：fresh 小审各自 diff；批 5 另核树外改动是否越出承接项边界。

> **批 4 已闭合**（2026-08-28）。窄路径落地：Agent 节点 Attempt 由外部代持、Runtime 只记账，`capability-baseline.json` 的 `executor_kinds:["process"]` 未动、**零生产代码改动**。
> 复核链：小审 changes-requested（P1-1 dsh-agent 未覆盖 / P1-2 engines 与 `--test-concurrency` 冲突）→ 整改 `95477dd`；
> 第一轮复裁 P1-2 闭合、余三件（P1-1 尾巴 / F-016 状态 / F-017 授权）→ 整改 `e6f8a3d`；
> **第二轮复裁 Accept，批 4 闭合**（复核方注明：仅放行批 4，`F-016` 保持 open·P2，整卡收口另行处理）。
> 落点：`test/agent-node.test.mjs`（5 条）+ `test/helpers/settled-state.mjs`；绿证 E-074~E-077，原始 TAP 落 `evidence/`。
> 未开批 5。

> **批 5 已闭合**（2026-08-29）。DSH 附加客户端 + 真实渲染截图落地，销 `RISK-DHR30-DSH-RENDER`（F-001）。
> 三步：5.1 活数据投影（树外 4 文件；只投影 `relay.client-read-model/v1` 真有的字段，缺的整键省掉、`attentions: []` 是真值；**面板一行未改**）；
> 5.2 repack + **remove 再 add** + 三方 SHA256 7/7（版本号未变而 `cordis.patch.yml` 哈希在两轮间改变，F-005 的教训被现场证实）；
> 5.3 真实浏览器截图（列表 + 详情）+ CLI 同态对照，`updated_at` 逐字节相同、`source=runtime-v2` 证实非 fixture。
> 本仓仅新增 `adapters/dsh-bridge/snapshot-main.mjs` 一个文件（F-019 用户裁决走 sidecar 路，插件安装拓扑契约与协议中立性都不让步）。
> 复核链：小审 changes-requested（三条 P2 取证留痕）→ 整改 `4dcc6bc`（复核方现场独立复算三方 SHA 7/7）→ **复裁 Accept，批 5 闭合**。
> 承接项边界未越：树外只动 `dsh-host` 4 个文件，`dsh-client` 与源码/DHR_49 期安装副本逐字节相同。
> 落点：`evidence/dsh-render-20260829-*.png`、`cli-status-20260829-parity.json.txt`、`dsh-live-render-ready-20260829.txt`、`dsh-host-live-20260829/`。

> **五个施工批次至此全闭**（批 1 H6 / 批 2 basic-agent-task 闭环 / 批 3 CLI e2e + 断连实录 / 批 4 Agent 窄路径 / 批 5 DSH 附加客户端）。进入收口准备：review.md AI 提交区与 `as-built/relay-core.md` 增量已填，**人类签名区未碰**，待用户人验。

## 关键决策（一句话各一行）

- Worktree：是，分支 = `wt/DHR_31`，目录 = `.dh-worktrees/DHR_31`
- 派子 agent：是——施工全部派 codex headless worker（用户 2026-08-28 确认「全用 codex，zcode 没额度」；DSH 部分不留主会话，取证不了的缺口记 findings 回落用户）
- Review：批次小审 + 轮 2 换人复核 = fresh-context subagent / codex 只读（按 `references/复核只读派发.md`）；E4/E5/E14/E6/E7 委托 subagent（用户确认按默认）
