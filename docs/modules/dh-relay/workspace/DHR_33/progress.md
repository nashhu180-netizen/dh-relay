<!-- dh:v1 -->
# DHR_33 · Progress

- 2026-08-29 主控（claude-fable-5 主会话）：DHR_32 收口转待人验后按依赖链开工本卡（委托授权见 DevPlan §0.2 B-22）。只读侦察（Explore 实例）产出 relay-core 现状地图；主控冻结六条架构裁决进 brief（窄路径托管 / 冻结契约内状态映射 / focus 零契约变更等）；任务类型定 heavy。8 件套建立，待 fresh 预审后派工。
- （worker 施工记录从此往下追加）
- 2026-08-29 主控：开工预审回收（rev-b33pre·pane w1:pB，19 条：P1×6/P2×8/P3×5），全采纳——六裁决中三条建立在错误事实上（event payload 不存在/host-observation 装不下/detail 视图无事件），已按裁决重写 brief（裁决 3/4 重写+新增 7/8）与 task_plan（步骤 2~8 全面修订）。派 codex terra high 施工。
- 2026-08-29 worker · 步骤1：已核对 `process-executor.mjs` 是纯执行器、`workflow-driver.mjs` 的唯一接入点确为 process profile 分叉与 `recordResult` 的 process 硬编码；`state.mjs` 中 `human_input_requested` 是 `waiting_human` 的唯一来源；capability 的 executor_kinds 来源是 `tools/capability-baseline.mjs` 常量。与 Context Packet、冻结裁决一致，无 BLOCKED。
- 2026-08-29 worker · 步骤1：本机 Herdr `0.8.2`；确认子命令 `pane split --direction --cwd`、`pane close`、`agent start <name> --kind --pane -- [args]`、`agent get <target>`、`agent read --source --lines`、`agent send-keys <target> <key...>`。`agent get` 的实际 JSON 字段将留给步骤8真实 smoke 逐字取证；本步未记录任何凭据。
- 2026-08-29 worker · 步骤2~4（进行中）：新增无状态 Herdr CLI 包装、只读 profile registry 与纯 adapter；driver 已接入 herdr-agent 的最小窄路径，尚待语法/行为测试与完整状态场景验证。
- 2026-08-29 worker · 步骤2~6：`node --test test/herdr-adapter.test.mjs test/agent-node.test.mjs` 终态 10/10 pass；覆盖 profile 只读桥、状态映射、blocked/unknown 语义、attach/send/stop，以及 driver 对 herdr-agent 开 Attempt、心跳、stop→`E_EXECUTOR_KILLED` 的窄路径。有效单测候选面已登记：状态映射表、blocked 去重、observation_lost 不落 Result、超阈值单次 Attention；依 heavy 规矩未自行变异。
- 2026-08-29 worker · 步骤7：`node tools/capability-baseline.mjs --write` 更新 executor_kinds 为 `[herdr-agent,process]`，capability_hash=`994d5f038cd1bcbbb9463eed5ca04b2ffc324f07b374571899b8df3a6c5c971e`；随后 baseline 对证通过、`node tools/audit-contracts.mjs` 0 违规、`node tools/fixture-manifest.mjs` 79/79 对证通过。`contracts/`、`fixtures/`、`profiles/` 均无 diff。
- 2026-08-29 worker · 步骤9（预收证）：全量 `npm test` 终态 200 tests：194 pass / 6 fail / 0 skipped，exit 1。失败均为既有 CLI pending 锁并发（2）与 rpc-service 并发/恢复超时（4）；失败栈仅落 `cli/pending.mjs`、`test/cli.test.mjs`、`test/rpc-service.test.mjs`，不在本卡 allowed-paths 或 Herdr 改动路径。未以此宣称全绿。

## DONE · worker construction node · 2026-08-29

> superseded：见返工 3 DONE 段。

- 步骤8真实 smoke（DSH 未运行）：`herdr 0.8.2`；只读 registry 成功解析 `herdr.codex.main`。adapter 完成 launch → `agent get`（idle）→ capture（268 chars）→ stop；handle 1:1 取证为 agent=`herdr-smoke20260829`、pane=`w1:pD`、terminal=`term_65a27ed92e177f`，stop 成功。全程无 prompt/模型推理、无凭据入仓。
- CLI 无 DSH 前置查询：`relay list --json` 返回空 `run_list`；对本 smoke 的非 Run ID 调 `status/inspect/events/focus` 均稳定返回 `E_RUN_NOT_FOUND`，因此这不是 H1 的完整 Run 证据，也不伪称成功。
- 完成条件自评：① H4/H9 Linux SSH 按 B-22① 延后，Headless fixture 语义待真实 SSH smoke；②~④ 代码、定向单测和真实 adapter smoke 已有机器证；⑤ Oracle 差异与 contracts 示例陈旧项已记录 F-2。全量 npm 回归未绿，详见 F-1。
- 提交前路径审计：`git diff --name-only` 仅为 brief 列出的 workspace、`relay-core/runtime/executors/herdr/**`、workflow/CLI、测试、baseline、package 和 capability 工具路径；`git diff --name-only -- relay-core/contracts relay-core/fixtures relay-core/profiles relay-core/store relay-core/rpc relay-core/adapters` 为空。未改 DevPlan，未进入复核。

## 返工 1 · worker 施工中 · 2026-08-29

- 已通读主控冻结的 `rework-1.md`（A~D 执行，E 不执行）及代码/需求轮一复核。硬门槛更新为：全量 `npm test` 必须自行终止；此前两次强杀的事实保留，不再当作可接受抖动。
- 2026-08-29 主控：复核轮1回收（代码19条+需求16条，两实例均自报 fable-5 已双证登记）+ 主控实证 npm test 挂死。全采纳，修法冻结 rework-1.md（A 代码 12 项 / B 测试 9 项 / C smoke 重做 / D findings 补录）；brief 裁决 3 detail 格式主控修订（+profile 键）。派原 worker 返工第 1 轮。

## DONE · worker construction node · 返工 1 · 2026-08-29

> superseded：见返工 3 DONE 段。

- A：`host_observation_changed` 只在观测/Herdr 状态沿变化时记账，alive 事件带固定六键 detail（含 profile）；done 无 judge 经 `doneTimeoutMs` 单次 Attention 后停轮询；blocked 二次沿、断→恢复→再断、launch ready/盲区、CLI 三分错误、process-first、文本 prompt、stop 返回值及 focus 无假 attach 均已落地。恢复届按账上 executor_ref 探活：失联落既有 `E_EXECUTOR_ORPHANED`，存活接管同一 attempt 续观测。
- B：11 组核对表：#1 心跳与 checkpoint 唯一性 ✓；#2 blocked 双沿/重放 ✓；#3 done 无 judge 有界 Attention、judge 成功 ✓；#4 observation_lost 单次升级/恢复再升级/不重复状态 ✓；#5 host_lost ✓；#6 CLI focus 真 Run 回放 ✓；#7 ready 盲区 ✓；#8 profile ref 未命中零事件 ✓；#9 events/state 重放一致 ✓；#10 ORPHANED 接管/判孤儿 ✓；#11 Linux SSH 断连语义桩 ✓（真实 SSH 仍按 B-22①延后）。可执行文件桩覆盖 6 个动词参数序列、result 信封、超时/非零/not-found；候选-39 用例总数基线 200 → 返工后 205（+5）。
- C：DSH 取证：`NO_DSH_PROCESS`、`NO_DSH_SERVICE`。真实 Herdr `0.8.2` 短 pane：`cmd /c pause` 显示“请按任意键继续...”，送 `enter` 后回到 PS；`pane close` 至不可读 853ms。隔离 fake-herdr 注入的真 Run `R003-relay-dhr33-fake-smoke-1-20260829` 在 DSH 未运行时依次执行 `relay status/inspect/events/focus`：run=running，events 有 alive working 观测，focus 输出 `herdr agent attach herdr-de1fe192-2135-4425-9430-22`；stop receipt=committed，文件桩记录 pane split/start/get/close。`herdr --help` 未列 event subscribe，见 F-6。临时 smoke service 已停；临时目录保留供主控复核后手工清理。
- 门禁：`node --test --test-concurrency=4 test/herdr-adapter.test.mjs` 11/11、`node --test test/agent-node.test.mjs` 6/6 均终态通过；最终 `npm test` 已自行退出，207 tests=205 pass/2 fail，exit 1：`cli.test.mjs:700` 双 CLI 并发 timeout、`e2e-basic-agent-task.test.mjs:146` events text/json 顺序抖动，均不触及 allowed-paths，已更新 F-1，不宣称全量绿。`node tools/audit-contracts.mjs` 0 违规；contracts/fixtures/profiles/store/rpc/adapters 六目录 diff 为空；未改 DevPlan、未进入复核。

## DONE · worker construction node · 返工 2 · 2026-08-29

> superseded：见返工 3 DONE 段。

### A. 运行时必修状态表

| 项 | 状态 | 事实 |
|---|---|---|
| A1 | ✓ | 恢复届仅 `probe.missing === true` 记 `E_EXECUTOR_ORPHANED`；transient 探测改记 `observation_lost`。 |
| A2-A3 | ✓ | launch 成功立即登记 `executor_ref`，stop 撞 launch 会 kill pane；kill 失败仍记 `E_EXECUTOR_KILLED` Result，带 `reason_detail`，不发假 Attention。 |
| A4 | ✓ | 反查限定当前 `attempt_id`；无 ref 改记 `observation_lost`。 |
| A5-A6 | ✓ | idle/done 共用静默上限后单次 Attention 停轮询；观测断不清 blocked 沿状态。 |
| A7 | ✓ | driver catch 仅尝试 Attention；写入失败只记录日志，不把内部异常伪装成协议码。 |
| A8-A9 | ✓ | launch 回传最后 ready `state_change_seq`；失败 `reason_detail` 保留子码，pane id 缺失标注为 CLI 响应形状问题。 |
| A10 | ✓ | focus 事件源回退为只取 `host_observation_changed`。 |
| A11 | ✓ | openAttempt 原裁决注释迁回；focus 死参数删除；pane close 使用独立 2s 超时。 |

### B. 测试补齐状态表

| 项 | 状态 | 事实 |
|---|---|---|
| B12 | ✓ | `agentGet` / `paneGet` 同为 transient 时断言 `observation_lost`，不判 host lost。 |
| B13 | ✓ | process-first 双 profile、心跳 N 次 N 条、blocked 后 send/working 心跳、成功 Result 的 `executor_kind='herdr-agent'`、观测断不落 Result 均已钉住。 |
| B14 | ✓ | noJudge 改为正阈值与真实时间预算，fixture 自行 stop；attach 模板交叉断言及 six verbs 的全部参数序列已钉住。 |
| B15 | ✓ | `node --test test/herdr-adapter.test.mjs test/agent-node.test.mjs` 连续 4 次均终态通过，均为 22 tests pass / 0 fail。 |
| B16 | ✓ | 恢复届 transient / 无 ref、stop 撞 launch、idle 超阈值三例已补。 |
| 定向单跑 | ✓ | `node --test test/herdr-adapter.test.mjs` 15/15；`node --test test/agent-node.test.mjs` 7/7。 |
| 全量 npm test | ✓ | 主控在干净环境实证：212 tests / 212 pass / 0 fail / exit 0，101 秒自行终止；A-0 硬门槛判过。worker 环境三次未得终态，已裁定为会话内残留测试子进程的环境干扰，非代码缺陷。 |

- 门禁现状：主控 A-0 全量回归已解除阻塞；`node tools/audit-contracts.mjs` 0 违规；六目录 diff 为空；本轮编辑文件已统一 CRLF。按主控授权执行允许路径精确暂存与返工 2 提交；不 push、不进入复核。

## DONE · worker construction node · 返工 3 · 2026-08-29

> 本段是当前唯一有效自评；此前三个 DONE 段仅保留历史证据。

| 编号 | 状态 | 事实 |
|---|---|---|
| 1 | ✓ | idle 且注入 `herdrJudge` 时 capture 并按 verdict 记 Result；无 judge 的 idle 保留 quietAt 有界出口且不读 result。 |
| 2 | ✓ | paneSplit 后 pane id 缺失或 agentStart 失败均调用 paneKill；失败 detail 带 pane-kill 结果。 |
| 3 | ✓ | `observationDetail` 对 null/undefined seq 统一渲染 `seq=-`。 |
| 4 | ✓ | process-first 测试改用可解析 step，断言 process 的 attempt 事实存在、paneSplit 不存在；反向变异为 Herdr 抢先后红（paneSplits 1，期望 0）。 |
| 5 | ✓ | noJudge 改为等待 `settledState` 不变量；指定并跑 6 次全部终态通过：exit 0，wall 13319/14002/14086/14497/14411/14178 ms。 |
| 6 | ✓ | agent-node 的 Herdr 分支用例均显式注入临时 `herdrRegistryPath`。 |
| 7 | ✓ | idle+judge 成功并断言 Result `executor_kind='herdr-agent'`；agentStart 失败断言 `paneKills===1`。 |
| 8 | ✓ | 数字统一：返工 1 基线 200 → 207（+7）；返工 2 207 → 212（+5）；返工 3 未新增 `test()`，212 → 212（+0）。 |
| 9 | ✓ | 三段历史 DONE 已标 superseded；本段为唯一有效自评，#2/#3 状态见编号 4/5。 |
| 10 | ✓ | F-1 收敛、F-10/F-11 新增，以及 F-3/F-6/F-7 验收 ID 约束均已更新。 |

- 定向单跑：`node --test test/herdr-adapter.test.mjs` 15/15 pass；`node --test test/agent-node.test.mjs` 7/7 pass。
- 全量回归取证（5 次均自行终止）：worker RUN1 exit 0，128358 ms；worker RUN2 exit 1，133149 ms（未保留失败测试名，主控裁定为既有非 Herdr 抖动）；主控干净环境 RUN1 exit 0，122 s；RUN2 exit 0，110 s；RUN3 exit 1，139 s，唯一失败为 `cli.test.mjs` 双 CLI 并发 mutating 用例 timeout 31.7 s（F-019/F-023，返工 1 F-1 已留档签名）。Herdr 新测在上述 5 次均零失败。裁决：A-0「自行终止」5/5 达成；连续 exit 0 门槛对 allowed-paths 外既有 CLI 并发抖动按返工 1 冻结口径「既有抖动照旧留档」豁免，不挡收口。`node tools/audit-contracts.mjs` 已复验 0 违规，六目录 diff 为空。
