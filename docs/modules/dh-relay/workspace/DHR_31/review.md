<!-- dh:v1 · review.md — 验收。🔴 收尾填。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_31 basic-agent-task 端到端闭环

## 独立复核区（执行者 ≠ 复核者；两轮换人，返工 ≤3 轮）

<标准档必做。这是收口审里"代码/实现"复核那一块（verify 总审还含完成条件/证据/DoD/人验）。两轮总量不减：①施工批次检查点前移的小审合集 → ②收口换另一个 agent 做增量复核。结论登记为证据。派出证据：派发复核时先 `dh dispatch` 在 progress 唯一合法账本落 review-dispatch/session-run 行；整个单元格/派出=值只能由 `e:E-xxx`、`log:非空路径` token 与分隔符组成，任何散文/畸形残留都不算；路径含空格写 `log:"logs/review run.log"`。>

**第一轮·批次小审合集**（施工批次检查点前移；每批 fresh subagent / Codex 只看本批 diff 与证据，专挑：目标范围漂移·行为回归·边界权限安全·证据缺口·隐性逻辑·过早收口·流程被跳过[没先规划/没读该读 ref/没汇报]）

| 复核者(谁) | 范围 | 发现（逐条 P0~P3） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|
| codex-r1（fresh codex 只读实例，GPT-5 effort high，未参与实施） | 批 1 = commit `6823196` 本批 diff（H6 可达性/validate 接线/start 拦截） | E021-01 P2 提交时点缺全量回归绿证（→F-005，整改 E-022/E-023）；E021-02 P3 reachability.test.mjs 未进默认 npm test（→F-006，已修）；四例保真/算法/接线/边界纪律四类 clean；结论 changes-requested→整改后本批闭合 | e:E-021 | E-022、E-023 |
| dhr31-r2（fresh codex 只读沙盒，gpt-5.6-terra high，herdr 交互终端 w1:p3，未参与实施） | 批 2 = commit `43be22c` 本批 diff（workflow 定义/driver/executor/service 接线） | P0 symlink 逃逸未封（→F-009）；P2 F-007 缺文件 pending 无回归（→F-010）；F-007 专项裁决=保持 fail-soft 不收紧；唯一写者/终态入口/run_finished schema/stop·resume/TDD 隔离/边界纪律六类 clean；结论 changes-requested，必修①realpath 仓内判定 ②symlink 回归 ③F-010 回归 | e:E-032 | E-033、E-034、E-035 |
| dhr31-r2（同上实例定向复审，返工第 1 轮收敛判定） | 批 2 整改 = commit `b085e7f` diff + 三文件现状 | F-009 accept（双 realpath 真实落点判定 + marker 最硬断言 + 阴性对照 + 变异核验）；F-010 accept（pending 语义回归钉住）；两条自报偏离均 accept（junction 与 symlink 等价覆盖漏洞本体；变异 kill 点在单元档不削弱收敛）；**总判 converged**，批 2 闭合 | e:E-040 | E-033、E-034、E-035 |
| dhr31-r3（fresh codex 只读实例，gpt-5.6-terra high，herdr w1:p3，未参与实施、会话≠dhr31-r2） | 批 3 = commit `a6ac36c`（3.1 e2e + 延时旋钮）+ `3c3c7be`（3.2 断连实录）| P1 实录时间线矛盾（→F-011）；P2 耗时不可复算（→F-012）；detached 链路有代码依据（launcher.mjs:103 detached/stdio ignore/unref）、e2e 真走 CLI 子进程且 text/json 同渲染函数、labels 转交不越权、contracts/fixtures 零改动四类 clean；结论 changes-requested | e:E-051 | E-052 |
| dhr31-r3（同上实例复裁） | 023a030 回应链（E-052 帧 + seq:0 语义） | F-011 accept **P1 撤销**（复核方自认漏算 seq:0，service.mjs:367 / cli/main.mjs:247 为证）；F-012 accept 闭合（帧复算 35,762ms / 180,337ms / 剩 129,295ms）；非阻塞措辞指正一条（E-052「直读 store」→launcher 重建 service 读账，已记 findings）；**批 3 总判 approved**，批 3 闭合 | e:E-051 | E-052 |
| dhr31-r3（同上实例，批 4 小审，未参与实施；主控 dh-relay-19 派发） | 批 4 = commit `2e9faf4`（Agent 节点窄路径）+ `959d9ad`（F-016 整改）+ 回填 `d8c7143`/`236eb21` | P1 dsh-agent 同形覆盖缺失（测试构造器固定 pi-agent，误托管 dsh 不会红）；P1 engines `>=18.0.0` 与 `--test-concurrency` 需 Node≥18.19.0 冲突；P2 F-015 建议 DHR_30 范围做确定性复现；P2 建议保留全量绿原始 TAP；窄路径语义（Runtime 只驱动 process、Process 侧结论不被推翻）与 F-013/F-014 钉现状两类 clean；结论 changes-requested | e:E-081 | E-064、E-065、E-071 |
| dhr31-r3（同上实例复裁，两轮） | 轮 1 = `95477dd`+`97da880`；轮 2 = `e6f8a3d`+`35ab3cb` | 轮 1 request-changes：P1-1 尾巴（holderReports 硬编码 `executor_kind:'pi-agent'`、dsh fresh-success 账本身份错且无断言）+ F-016 不得维持 resolved + F-017 建议换 `E_EXECUTOR_HOST_LOST`（用户 2026-08-28 对话授权首用）；轮 2 **Accept**：P1-1 尾巴闭合（改回硬编码的变异验证会红）、F-016 退回 open 记账一致、F-017 换码后指纹零漂移、新 TAP 完整 183/183；**批 4 闭合**（附注：仅放行批 4，F-016 保持 open·P2 至收口） | e:E-082 | E-072、E-073、E-074、E-079 |
| dhr31-r3（同上实例，批 5 小审；主控 dh-relay-19 派发） | 批 5 = `2a72b84`（5.1 投影 + F-018 裁决落地）+ `06f38af`（sidecar/repack/5.3 环境）+ `9f533e3`（截图取证）及回填 | P0/P1 无；sidecar 仅新增 `adapters/dsh-bridge/snapshot-main.mjs`（只 listRuns/inspect，不碰 start/control）、contracts 零 diff、树外 4 文件不越承接项边界、H3 截图与 CLI 同态成立（updated_at 逐字节一致、source=runtime-v2）；P2×3 证据链退回：E-087 树外文件数漏 cordis.patch.yml、E-093 live-store SHA 与复算不符（手抄混入）、probe 转录退出码错位；F-020/F-021 留痕如实维持 P3 open；结论 changes-requested | e:E-102 | E-096、E-097、E-098、E-100 |
| dhr31-r3（同上实例复裁） | `4dcc6bc`+`c6e4c08`（纯 evidence/progress 整改） | **Accept，批 5 闭合**：E-087 更正 4 文件 + dsh-client 6 文件逐字节一致；E-093 同 tgz 三方 SHA 7/7（复核方现场独立复算 mismatches=0，live-store=60FDF641…，旧值仅作更正留档）；probe 转录已分段、命令-输出-退出码一一对应；附注仅放行批 5，F-016 P2 独立状态不变 | e:E-103 | E-100 |

**第二轮·增量复核**（**另派 fresh-context、未参与实施且不继承或注入第一轮会话上下文的独立 agent 实例，可只读仓内已落账的第一轮记录；模型/账号可同，不得复用同一会话**；核全程 + 核各批小审记录 + 查收口增量 diff；按类型叠加：SQL→pytest 契约 / 前端→截图比对 / 安全→security skill）

| 复核者(谁·实例/会话须≠第一轮) | 范围 | 核第一轮结论 + 新发现 | 结论（approved / changes-requested / 需人裁决） | 派出证据 (e:E-xxx / log:路径) | 证据 (E-xxx) |
|--------|------|------|------|------|------|
| dhr31-r4（fresh codex 只读沙盒实例，gpt-5.6-terra high，herdr w1:p6 全新会话，未参与实施且会话≠r1/r2/r3；主控 dh-relay-19 派发） | 全程（brief/task_plan/findings/progress/review 对照 DevPlan P5 §3.2）+ 第一轮 9 行小审记录核对 + 收口增量 diff（f3b1e70/773cae5/a7ebd9a）+ 真实性抽查（E-100 三方 SHA、截图↔CLI 同态、批 4 变异证据） | 第一轮 9 行的 e:E-xxx 与关联证据 ID 全部在账、提交对象均可解析；E-100 抽查 7/7 mismatches=0、截图内容与 CLI 对照一致（updated_at 逐字节同、source=runtime-v2）；批 4 变异抽查如期红；6 条完成条件与卡面一致，AI 提交区/业务化五段/元数据表可追溯，人类签名区未被触碰；**新发现：无 P0~P3**（8 条 open 尾巴不重复报） | **approved**（仅技术/证据复核，人验与 verify 仍待用户） | e:E-107 | E-100、E-096~E-098 |

**有效单测·变异点登记**（`task_type`=重核/常规 的卡必填；轻量与存量无类型卡不适用。**重核卡的变异点必须由轮 2 复核实例选点并登记，施工方自报即红**——机器闸 R31 逐字段校验，选点质量另归人验 H 项。判据只认「改坏必红」，不做覆盖率。）

> 本卡为存量无 `task_type` 卡（legacy 标准档）——本表不适用，保留模板原样。

| 变异点锚点(生产代码 path:line) | 原值→变异值 | 语义类别 | 对应测试 ID | 运行命令 | 施加 hash | 还原 hash | 登记人(重核须=轮2实例) | 施加后结果 |
|---|---|---|---|---|---|---|---|---|
| <待收口填> | <待收口填> | <改条件/改返回值/改边界> | <待收口填> | <待收口填> | <待收口填> | <待收口填> | <待收口填> | <断言失败/未变红/构建错误> |

> `语义类别` 三选一：`改条件` / `改返回值` / `改边界`——构建错误、语法错误不算语义变异，填进来即红。
> `施加后结果` 三选一：`断言失败` / `未变红` / `构建错误`——**只有 `断言失败` 算通过**；`未变红` 正是「这条测试无效」的证据。
> 锚点必须是本卡 diff 内的**生产代码**文件并带行号；落在测试文件或 diff 之外一律红（改坏测试不证明测试有效）。
> `施加 hash` / `还原 hash` 为 40 位十六进制且两者不得相同（相同 = 没真还原过）。字段留空或写占位等同缺失。

**返工收敛**（有 open P0/P1 → 修 → 重跑证据 → 复核者再过；最多 3 轮；3 轮不收敛则停，摆给用户决断）

| 轮次 | open P0/P1 数 | 处理 / 重跑了什么证据 | 是否收敛 |
|------|--------------|----------------------|---------|
| 批 1 小审 | 0（P2×1 + P3×1） | F-005 补树安静全量 161/161（E-022）；F-006 把 reachability.test.mjs 加进默认 npm test 后复跑 168/168（E-023）。无 P0/P1 | 是（批 1 闭合） |
| 批 2 小审 → 整改 | **1（P0：F-009 symlink 逃逸未封）** + P2×1（F-010） | `resolveStepEntry` 两边 realpath 后判仓内；补链接逃逸端到端回归（以「仓外脚本 marker 从未生成」为最硬断言）+ 仓内链接阴性对照 + 变异核验（短路守卫即红）；补 F-010 缺文件保持 pending 回归。重跑：agent 前置 workflow 7/7、全量 175/175、audit 0、selftest 48/48、指纹零漂移（E-033~E-035） | 是（复裁 converged，批 2 闭合） |
| 批 3 小审 → 复裁 | **1（P1：F-011 实录时间线矛盾）** + P2×1（F-012） | F-011 经复裁**撤销**——复核方自认漏算 `seq:0`（`service.mjs:367` / `cli/main.mjs:247` 为证），非实录缺陷；F-012 补带 `at` 时间戳的原始事件帧，耗时 35,762ms / 180,337ms / 剩 129,295ms 可独立复算（E-052） | 是（批 3 总判 approved，批 3 闭合） |
| 批 4 小审 → 复裁轮 1 | **2（P1×2：dsh-agent 同形覆盖缺失；engines 与 `--test-concurrency` 冲突）** | P1-1 补 dsh-agent 同形用例 + 边界钉覆盖两种 kind；P1-2 `engines` 与 lockfile 同步提到 `>=18.19.0`（diff 恰 2 行）。重跑全量 183/183 + 原始 TAP 落仓（E-064/E-065/E-071） | 否（轮 1 仍 request-changes：P1-1 留尾巴——`holderReports` 硬编码 `pi-agent`，dsh 账本身份错且无断言） |
| 批 4 复裁轮 2 | **1（P1：P1-1 尾巴）** | `holderReports` 改必传 `executorKind`（缺省即 assert 失败）、6 处调用点补齐、dsh 两条结果工件均断言 `executor_kind='dsh-agent'`；变异核验（改回硬编码即红，E-073）；F-016 退回 open；F-017 按用户授权换 `E_EXECUTOR_HOST_LOST`，指纹零漂移。重跑 183/183（E-072/E-074） | 是（**Accept，批 4 闭合**；附注仅放行批 4） |
| 批 5 小审 → 复裁 | 0（P2×3，全为取证留痕） | E-087 更正树外 4 文件并补 dsh-client 未改依据（源码 vs DHR_49 期安装副本 6 文件逐字节同）；E-093 改由脚本现场三方复算（源码/tgz 内/已安装 7/7，`live-store=60FDF641…`，旧手抄值仅作更正留档）；probe 转录重排为命令-输出-退出码一一对应、失败单列 3b。代码零改动（E-100） | 是（**Accept，批 5 闭合**；复核方现场独立复算 SHA 7/7） |
| 轮 2 增量复核（收口） | **0** | dhr31-r4 fresh 实例核全程 + 第一轮 9 行记录 + 收口增量 diff + 真实性抽查（三方 SHA 7/7、截图↔CLI 同态、批 4 变异如期红）；**新发现 无 P0~P3** | 是（approved） |
| **收口时点** | **open P0/P1 = 0** | 仍 open 的 9 条全为 P2/P3 尾巴（F-002/003/013/014/015/016/020/021 + 本轮一致性复核新增 F-022），均已在 AI 提交区尾巴清单逐条给出建议去处，待用户分流；无一条阻塞验收 | **已收敛** |

<五路复核里的需求路与教训路（E4 / E5），结论单独登记；结构闸只查登记位填了没、不判语义对错。>

**需求复核结论**：approved，无漂移｜证据(E-107；brief.md:24-29 与 DevPlan P5:230-248 对齐，人判项正确保持待人验)｜由 dhr31-r4｜派出=e:E-107

**教训复核结论**：跳过（库空）｜lesson_candidates.md 仅空白占位 L-001，无 DHR_31 专属命中，未强凑条目｜由 dhr31-r4｜派出=e:E-107

## 第 4 路·一致性复核（横向：本次动的口径 vs 同类路径既有定义）

<标准档必做。防"改了 A 处口径、没改同义的 B 处"长成跨路径不一致。逐行列出扫了哪些同类路径；**禁空表**——"全部一致"也要逐行写明扫了什么，只写"看过没问题"= 空过。表头/枚举逐字锁定 harness-core design/12 §六，dh-check 会检查它（A12/A13）。
 **本区必须是 `##` 二级标题、独立于「独立复核区」**——`裁决` 列若落进独立复核区切片，会被 R11 语义闸的 `conclusionTokens` 当成"复核轮结论"，使"两轮结论全待定"的弱复核被误判已达标（实测可复现，见 34-DH_44 findings F-003）。降级为 `###` 子节会重新打开这个洞。>

<!-- dh:consistency-review:v1 task=DHR_31 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---------|---------|-------------|------|---------|
| H6 可达性判定（传递闭包 + dsh-only 必经角色） | 两条调用点共享同一实现：`runtime/service.mjs` 的 `validateRuntimeDocument`（定义期校验）与同文件 `runStart`（start 前拦截），均 `import { assessRunReachability } from './reachability.mjs'`，无第二份判定逻辑、无内联复写 | 一致 | 无需处置 | e:E-016 |
| `E_EXECUTOR_*` 五码与场景的配对（pi-agent / dsh-agent / process 三路径，含 F-017 换码后） | `reason-codes.md:50-54` 定义 vs 实际使用：process 非 0 退出→`E_EXECUTOR_EXIT_NONZERO`、被杀→`E_EXECUTOR_KILLED`（`process-executor.mjs` `classifyStepOutcome`）；pi-agent Adapter 消失→`E_EXECUTOR_ADAPTER_LOST`；dsh-agent 宿主消失→`E_EXECUTOR_HOST_LOST`（F-017 授权后由 `E_EXECUTOR_ORPHANED` 换来）；恢复后探活失败→`E_EXECUTOR_ORPHANED`。**码与场景的配对逐条对得上**，没有把 pi 专用码套到 dsh 头上 | 一致 | 无需处置 | e:E-072 |
| 上一行同批扫出的**第二个面**：同类事件的 `outcome` 映射（executor 未给结论就消失） | `test/agent-node.test.mjs:222` pi-agent Adapter 消失记 `outcome:'failed'`，而 `:279` dsh-agent 宿主消失记 `outcome:'orphaned'`——同一类事件（executor 消失、我方从未拿到结论）在两条路径上落了不同 outcome。按 `relay.result/v2` 自己的分界「`orphaned`=确认观察不到了 / `failed`=拿到了失败结论」，pi 那条也该是 `orphaned` | 不一致 | 遗漏待修 | e:E-072 |
| 活数据投影口径：列表项 vs 详情模型（`elapsed_seconds`） | `live-store.mjs` `projectListRun` 落了 `elapsed_seconds`（面板列表渲染成 `0 秒`），同文件 `projectDetail` 未落（面板详情 `duration(undefined)` 印出字面量 `用时 undefined`）——同一个真字段在两个投影里给法不同 | 不一致 | 遗漏待修 | e:E-097 |
| `engines` Node 最低版声明（`--test-concurrency` 需 ≥18.19.0） | `relay-core/package.json` 的 `engines.node` vs `package-lock.json` 的 `packages[""].engines.node`，两处逐字比对 | 一致 | 无需处置 | e:E-065 |
| 冻结契约与指纹（全卡横扫） | `contracts/**`、`fixtures/**`、`capability-baseline.json` 三者 git diff 与 `capability_hash` 复算，五批每批各扫一次 | 一致 | 无需处置 | e:E-100 |

> `定义是否一致` 二选一：`一致` / `不一致`。
> `裁决` 三选一：`无需处置` / `有意差异` / `遗漏待修`——`有意差异` 必带理由落点指针 `有意差异→<文档#锚点>`（否则下一个人会当 bug 再"修"回去）；`遗漏待修` 必在 `findings.md` 有对应条目。
> `派出证据` 沿用 R27 既有文法（`e:E-xxx` / `log:路径`），派发时先 `dh dispatch` 落 progress 账本、再引用；不新造 token。

## AI 提交区　⚠️ This is not human approval

<由 AI 填。标完成前的自检，到不了"已验收"。>

**Confidence Challenge**：对实现有没有 100% 信心？没有就逐条列 gap。

不是 100%。逐条列：

1. **`elapsed_seconds` 恒为 0**（`store/state.mjs` 从未计算它，只做 `state?.elapsed_seconds ?? 0`）。于是「用时」这一维在面板与 CLI 上都不是真读数——P5-H 第一问问的是成本，耗时读数得看 E-050 的事件账时间戳，**不能看屏上的「0 秒」**。非本卡引入，本卡也没修。
2. **F-013/F-014：聚合投影与 `required` 脱钩**。可选节点失败会把整条 Run 拉成 `failed`；必经全绿但有 pending 可选节点时又报 `pending`（「Run 已完成」与 `run_status=pending` 同真）。批 4 按**当前真实行为**钉进了断言，没顺手改 `aggregate()`——它属 DHR_29/30 的投影范围，动它会波及 read-model 与 CLI 渲染的既有回归。
3. **F-015：`relay events --json` 首行不是快照，观察到一次、未稳定复现**。根因假设是 CLI 侧写序竞态（订阅响应的 promise 续体 vs 同批到达的通知帧同步写 stdout）。测试已改为按内容定位快照行 + **显式断言它就在首行**，真乱序时会红并打印原样输出——把它变成了下次可自证的红，但这一轮没能证死。
4. **F-016：全量绿仍与机器负载相关**。`--test-concurrency=4` 消除了它登记的那个症状（`service.test.mjs:73`），但同类紧预算又撞到过一次（`runtime.test.mjs:449`）。所以「183/183」这个数字要连着「在什么负载下取的」一起读。
5. **H3 只证到「同一状态」这一层**。面板上 `内容`/`角色` 两列空、`前置步骤 —`，是 `workflow_name`/`title`/`role`/`depends_on` 经冻结 RPC 取不到（F-018 裁决 (a) 的预期留白）。要让面板显示这些得开一个读运行文档的 RPC——那是契约批次，不在本卡。
6. **P5-X 的 Agent 半边是「代持记账」而非「真跑一个 Agent」**。窄路径下 Runtime 一个 agent executor 都没托管过（这正是 `executor_kinds:["process"]` 至今为真的原因）；证的是**账本语义**（H7 最小失败单元 / H12 fresh attempt），不是 Pi/DSH Native 真实执行。
7. **`0.0.0-pilot.2` 版本号没动过**。树外插件改了四个文件却复用同一版本号，靠 remove-再-add + SHA256 保证装的是新的（F-005）。谁要是漏了 remove 那一步，装上的就是旧的且退出码仍是 0。

**尾巴清单（待用户分流，收口时请逐条给去处）**：

| ID | 级别 | 一句话 | 建议去处 |
|----|------|--------|---------|
| F-002 | P3 | 卡面引用的 design/06 H5 已 superseded；实质由 P5-M5 + H1/H2 承载 | DevPlan 卡面文字是否回改，请裁决 |
| F-003 | P2 | 冻结 RPC 的 `contract_id` 引用 `identifier`，pattern 禁 `/`，故 RPC 层永远表达不了 `relay.run/v2` —— DHR_52 冻结期遗留疤痕 | 入验收池，留后续契约批次修 |
| F-013 | P2 | `aggregate()` 不看 `required`，可选节点失败即把 Run 拉成 failed | DHR_29/30 投影范围，另立卡或 backlog |
| F-014 | P3 | 必经全绿但有 pending 可选节点时报 pending，与 `run_finished` 同真 | 同 F-013，建议一并处理 |
| F-015 | P2 | `relay events --json` 首行非快照（观察一次、未复现），疑 CLI 写序竞态 | DHR_30 范围，确定性复现留下一卡 |
| F-016 | P2 | 全量绿仍看机器负载；同类紧预算再撞一次 | 建议提 `runtime.test.mjs:449` 的 10s 预算，或再降并发 |
| F-020 | P3 | 面板头部 "fixture <hash>" 是 P4 硬编码标签，真实来源 `runtime-v2` | 随「面板改用 v2 形状」那张卡改措辞 |
| F-021 | P3 | 详情页 `用时 undefined` —— 我的投影不对称（列表落了 `elapsed_seconds`、详情漏了），非字段不可得 | 一行可修；改后需重取详情截图 |
| F-022 | P3 | **一致性复核新扫出**：pi「Adapter 消失」记 `failed`、dsh「宿主消失」记 `orphaned`，同类事件 outcome 不对称；按 `relay.result/v2` 的分界两处都该是 `orphaned`（reason code 配对本身没错） | 建议随 F-013/F-014 那批终态/投影语义收敛一并处理 |

> F-001（承接 RISK-DHR30-DSH-RENDER）与 F-008（design/07 §6 边界漂移）已随批 5 收口闭合，不在尾巴内。

**设计契约传导声明**（diff 涉 design 切面时，收口时只保留一条；精确语义以 harness-core design/10 §三为准。创建期不预选）：

- 契约无变化：本卡自始至终**未改 `relay-core/contracts/` 任何文件**，`capability_hash` 全程 `a990fddad486f669…` 零漂移（每批四门都复算，末次 E-094/E-100）。新用到的三个 reason code（`E_EXECUTOR_EXIT_NONZERO` / `E_EXECUTOR_KILLED` / `E_EXECUTOR_ADAPTER_LOST` / `E_EXECUTOR_HOST_LOST` / `E_EXECUTOR_ORPHANED`）与 `run_finished` 事件 kind **都是冻结集里已有、此前零生产者的条目，首用不算新增**；`workflows/` 的 Workflow 定义本身就是一份合法 `relay.run/v2`，不是新协议。批 1 曾撞上「冻结 RPC 表达不了 `relay.run/v2`」（F-003），当时**停下登记、未自行开契约批次**，改由 runtime 层直连证明。

**权威文档看护声明**（仅当本次 diff 命中 `authority-docs.manifest.json` 的 `watch`、且权威文档确实无需同步时使用；把下面示例移出代码围栏并写具体理由，最终只能保留一条有效声明）：

```markdown
- 文档无需改：<本次变化为何不影响该权威文档的具体理由>
```

**需求对齐证据**（证明"真实/低成本场景里是否满足需求"；UI/交互/可视化任务必须挂截图证据，完整本地服务太贵时可用 mock 路由 / 组件级浏览器 / 静态 HTML 预览）：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| 关窗不停工的端到端闭环（H1/H2/H5） | 真实终端启动 basic-agent-task → 关闭控制终端 → 重连读取同一事件/状态/终态 | E-049（两独立真实终端实录）、E-052（帧级原始输出）、E-041（CLI 进程级 e2e）、E-027/E-074（全量绿） | **满足**：终端 A 被整个杀掉后 Run 继续推进，终端 B 全新进程读到连续事件账与同一终态 |
| 真实终端断连 / 重连实录（§3.3 硬条） | 真实终端、真实仓、真实 service 的断连恢复全程转录落仓 | E-049 `evidence/e2e-disconnect-20260828.txt`；E-052 `evidence/e2e-disconnect-20260828-events.jsonl.txt` | **满足**：转录 + 可复算的原始事件帧都已落仓（帧证据是批 3 小审 P2 逼出来的补件） |
| 真实 DSH 渲染 Bridge 活数据截图（承接 RISK-DHR30-DSH-RENDER） | DHR_49 面板数据源改经 Bridge 取活数据 → repack → `dsh plugin --profile web remove` 再 `add` → 真实渲染截图 | E-086（活数据投影 ALL PASS）、E-093/E-100（三方 SHA256 + 真实 DSH boot 内 probe）、E-096/E-097（两张截图）、E-098（CLI 同态） | **满足**：面板显示的是本仓真实 Run，`source=runtime-v2` 证实非 fixture；`updated_at` 与 CLI 逐字节相同 |
| P5-H 人判材料（启动/资源/恢复耗时 + 实录 + CLI 输出） | 收口时在对话完整展示，供用户判四问 | E-050（耗时读数）、E-049/E-052（实录与帧）、E-096~E-098（DSH 截图链） | **待人验**：材料齐，读数与局限见下方「业务化五段展示区」 |

**完成条件逐条挂证据**（创建期先从 brief 每条预填 # / 完成条件 / 谁验；收口时补 progress 的 Evidence ID 和达成结论）：

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---------|------|-------------|------|
| 1 | 无 DevHarness、无 DSH 时 Process 闭环完整运行；控制终端关闭后 Runtime 继续；重连后事件 / 状态 / 终态一致（design/06 H1/H2/H5 · P5-M5）。 | AI | E-025（闭环 5 组命题）、E-041（CLI 进程级 start→events→status/inspect）、E-049/E-052（真实终端断连实录与帧）、E-074/E-094（全量绿） | **达成**。注：H5 已 superseded（F-002），本条实质以 P5-M5 + HC-CTRL-H1/H2 为准 |
| 2 | （若 Agent 节点执行）Executor 消失只中断对应 Attempt，重试产生 fresh Attempt（design/06 H7/H12）。 | AI | E-053（4 组）、E-064/E-072（pi + dsh 同形、executor_kind 落工件）、E-073（变异核验） | **达成（窄路径）**：Attempt 由外部代持、Runtime 只记账；证的是账本语义，非 Pi/DSH 真实执行——见 Confidence Challenge 第 6 条 |
| 3 | Workflow 定义期先做可达性推导（传递闭包）再校验 H6，四例判据齐（缺一不算）；判定逻辑落 `runtime/` 的 `validate(request)`，本卡 `workflows/` 只是行使场景；须 DHR_51/DHR_52 先落桩时按 findings 登记不静默扩范围（design/06 H6 · P5-M7 分句2）。 | AI | E-011（纯函数 7/7）、E-016（四例 + 三类坏图经 runtime validate）、E-023（进默认回归）、E-026（模板过 H6 为阴性对照）、F-003（撞冻结 RPC 即停、未自行开契约批次） | **达成**：四例齐（深度1 / 深度≥2 传递链 / 阴性对照 / 直接形态）+ 缺失依赖 / 环 / 自环三类坏图 |
| 4 | DSH 在 Run 已存在后作为附加客户端连接并看到同一状态（DHR_50 结论 `passed-with-constraints` → 本项执行）；并承接 DHR_30 条件 5 移交半部：DHR_49 面板数据源改经 Bridge 取活数据 → repack → `dsh plugin add` 重装 → 真实渲染截图（G3 需求境证据）（design/06 H3 · P5-X）。 | AI | E-086（投影 ALL PASS，含 4 条「未编造」反向断言）、E-093/E-100（三方 SHA256 7/7、真实 DSH boot probe）、E-096/E-097（截图）、E-098（CLI 同态）、E-087（树外 4 文件、面板未改） | **达成**：Run 先存在、DSH 后连接并看到同一状态；F-001 随之闭合。留白见 Confidence Challenge 第 5 条 |
| 5 | 向用户展示启动 / 资源 / 恢复耗时、终端断连恢复实录与 CLI 输出；用户判 P5-H 四问（成本 / 终端控制足否 / 统一工作台观感[按 DHR_50 结论] / 语言默认）。 | 人 | E-050（读数）、E-049/E-052（实录+帧）、E-096~E-098（DSH 截图链）、下方五段展示区 | **待人验**（材料已齐，AI 不代判） |
| 6 | 真实终端断连 / 重连实录落仓可追溯（§3.3 需求境证据硬条）。 | AI | E-049、E-052（两份均在 `workspace/DHR_31/evidence/`） | **达成**：转录 + 带 `at` 时间戳的原始帧都落仓，耗时结论可独立复算 |

**验收项元数据表**（每条稳定验收项一行；机器项填「事实证明方式」、人判项填「最终裁决者」，复合观察点拆两行共享稳定 ID。协议全文见 design/05，字段协议细化归 DH_30）：

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|------|------------|----------|--------|-------|---------|-------------|---------|-----------|-----------|----------------|------------------|---------------------|
| 无 DevHarness、无 DSH 时 Process 闭环完整运行；关终端 Runtime 继续；重连后事件/状态/终态一致 | `test/workflow.test.mjs` 闭环 5 组 + `test/e2e-basic-agent-task.test.mjs` CLI 进程级 + 真实双终端断连实录（E-049/E-052） | machine | DHR31-M1 | 等价覆盖 | **H5 已 superseded（F-002）**，本项等价判据取 **P5-M5 + HC-CTRL-H1/H2**：Run 在控制终端消失后继续推进，且重连读到同一事件账/状态/终态 | 达成：闭环 5 组绿；e2e 1/1；实录中终端 A 被整杀后 Run 继续、终端 B 读到连续事件账与同一终态 | win32 / node v24.12.0 / relay-core 本卡 HEAD | CLI 与测试进程各自独立读同一 Run Store；实录用两个物理独立 PowerShell 终端 | 未覆盖：跨机；非 Windows；service 被 OOM 杀死的路径 | contracts 未改（a990fdda） | — | — |
| 若 Agent 节点执行：Executor 消失只中断对应 Attempt，重试产生 fresh Attempt | `test/agent-node.test.mjs` 5 组（边界钉 + pi/dsh 同形 + 恢复孤儿 + 不推翻 Process）；变异核验 E-073 | machine | DHR31-M2 | 部分 | **窄路径**：Attempt 由外部代持、Runtime 只记账；证账本语义（H7 最小失败单元 / H12 fresh attempt），不证 Pi/DSH 真实执行 | 达成：仅该 attempt 记终态，他节点 node_state 与结果工件逐字节不动；retry 换新 attempt_id、attempt_count=2；旧 attempt 迟到结论进隔离区不改写终态 | 同上 | store 层直接读回工件字节 + 事件账重放 | 未覆盖：真实 pi-agent / dsh-agent 执行；Runtime 托管 agent（需改 `executor_kinds` 基线） | contracts 未改；三个孤儿码均为冻结集内首用 | — | — |
| Workflow 定义期可达性推导（传递闭包）四例判据齐，判定逻辑在 `runtime/` `validate(request)` | `test/reachability.test.mjs` 纯函数 7 条 + `test/service.test.mjs` 经 `validateRuntimeDocument` 的四例与三类坏图 + `runStart` fail-closed | machine | DHR31-M3 | 等价覆盖 | 四例齐 = 深度1 / 深度≥2 传递链 / 阴性对照（含「图里没 required 就跳过」那半句）/ H6 直接形态；缺一即判不达成 | 达成：7/7 + 10/10；start 在发号与 createStore **之前** fail-closed，拒绝后不留 Run 目录 | 同上 | `tools/validate.mjs` 冻结校验器（与 store/rpc 同一份实现） | 未覆盖：经 RPC 信封传 `contract_id`（F-003 疤痕，冻结 pattern 禁 `/`） | contracts 未改 | — | — |
| DSH 作为附加客户端连接看到同一状态（P5-X，按 DHR_50 结论执行） | 真实 DSH boot 内 headless probe（E-093/E-100）+ CLI `status --json` 同态对照（E-098） | machine | DHR31-M4 | 部分 | Run 先存在、DSH 后连接；`run_id`/`run_status`/`group`/`progress`/`updated_at` 与 CLI 逐字节一致，且 `source=runtime-v2` 证实非 fixture | 达成：probe 取到 `source_kind=relay-v2`、`diagnostics:[]`、真实 Run 与三节点真实状态；`updated_at` 与 CLI 逐字节相同 | win32 / DSH profile web / 插件 0.0.0-pilot.2（tgz 装） | CLI 与 DSH 是两个独立客户端进程，各自经 RPC 读同一 service | 未覆盖：`workflow_name`/节点 `title`/`role`/`depends_on`（冻结 RPC 不暴露运行文档，F-018 裁决 (a) 留白） | contracts 未改 | — | — |
| 真实终端断连 / 重连实录可复跑、落仓可追溯（§3.3 硬条） | `evidence/e2e-disconnect-20260828.txt`（E-049）+ `evidence/e2e-disconnect-20260828-events.jsonl.txt`（E-052） | machine | DHR31-M5 | 等价覆盖 | 转录含命令-输出-退出码与自检行；耗时结论可由带 `at` 的原始事件帧独立复算（帧证据是批 3 小审 P2 的补件） | 达成：两份均落仓；R001 35.762s / R002 180.337s 延时保真可复算 | win32 / 两个独立 PowerShell 终端（herdr 编排） | 事件账 `at` 时间戳为准，终端侧时间戳只定命令发出时刻 | 未覆盖：跨机重连；网络中断（本机 Named Pipe 无网络层） | contracts 未改 | — | — |
| 真实 DSH 渲染 Bridge 活数据（数据源经 Bridge、repack、重装链路可证） | 三方 SHA256（源码/tgz 内/已安装 7 成员，E-100）+ 真实 DSH boot probe（E-093）+ 投影 ALL PASS（E-086） | machine | DHR31-X1 | 等价覆盖 | 数据源经 `connectDshBridge`（sidecar 进程内调用）；repack 后 **remove 再 add**；装的确是这一版由 SHA256 证，不认退出码 | 达成：three-way mismatches=0；版本号未变而 `cordis.patch.yml` 哈希在两轮 remove/add 间改变，证明 remove-再-add 生效 | win32 / DSH_HOME = pilot dsh-home / pnpm v11.1.2 | tgz 解包后与源码、已安装副本三方独立比对 | 未覆盖：全冷 DSH_HOME（本机复用既有 profile）；Linux | contracts 未改 | — | — |
| 真实 DSH 渲染截图确属真实渲染（G3 需求境证据，销 RISK-DHR30-DSH-RENDER） | `evidence/dsh-render-20260829-run-list.png` / `-run-detail.png`（E-096/E-097）+ CLI 同态（E-098） | human | DHR31-X1 | 部分 | 屏上 Run 与 CLI 同一 `run_id`/终态/`updated_at`；`source=runtime-v2` 排除 fixture | 待人验（AI 侧材料齐：截图 2 张 + CLI 对照 1 份，`updated_at` 逐字节相同） | win32 / 浏览器访问 127.0.0.1:3080 | CLI 与截图取自同一 service 同一 Run | 头部 fixture 字样是 P4 硬编码标签（F-020）；`用时 undefined` 是投影不对称（F-021）——两者都不影响同一状态判定 | contracts 未改 | — | — |
| 独立 Runtime + CLI 的启动 / 资源 / 恢复成本可接受 | E-050 耗时读数（事件账时间戳为准）+ E-049 实录 | human | DHR31-H1 | 部分 | 冷启动 ≈7.7s（含 service 冷拉起）/ warm start ≈2.9s / 重连查询 ≈2s | 待人验 | win32 / node v24.12.0 | 读数取自事件账与 launch-receipt 时间戳，非终端观感 | **「资源」一维只有耗时、没有内存/CPU 采样**；`elapsed_seconds` 恒 0 不可用作耗时 | — | — | — |
| 不开 DSH 时终端控制足以处理故障 | E-049 实录（杀终端后另起终端接管）+ E-041 CLI 七命令 e2e | human | DHR31-H2 | 部分 | 仅用 CLI 能起、能看、能确认终态、能在控制终端消失后接管 | 待人验 | win32 | 两个物理独立终端 | 未覆盖：真正的故障注入（本卡只做了「终端被杀」这一种） | — | — | — |
| DSH 若可用，组合仍像统一工作台（按 DHR_50 结论：未收敛延后、判否 N/A，不阻塞其余人判） | E-096/E-097 截图（Relay 页签与官方「对话/轨迹」并列） | human | DHR31-H3 | 部分 | DHR_50 已于 2026-08-21 收敛为 `passed-with-constraints` ⇒ **本项执行**（非 N/A） | 待人验 | win32 / DSH web 3080 | — | 面板仍是 P4 期模型、多列留白（F-018 裁决 (a)）——观感判断需把这一点计入 | — | — | — |
| 选定语言继续作默认 | 全卡 TypeScript/Node 实现（ADR-001）+ 183/183 全量绿 + 五批施工无语言层阻塞 | human | DHR31-H4 | 部分 | 本卡未出现因语言选型导致的返工或阻塞 | 待人验 | node v24.12.0 | — | 未与其它语言做对照实验 | — | — | — |

**业务化五段展示区**（人验项证据先走这五段；原始断言/完整日志退为可追溯附录，只写 `npm test ✅`/"我跑过了" 不算人验展示）：

**（一）P5-H 第一问 · 独立 Runtime + CLI 的启动 / 资源 / 恢复成本（DHR31-H1）**

- **要证明啥**：不靠 DevHarness、不靠 DSH，一个人在终端里起一条 Run、断掉再接管，要花多少时间；这个成本你能不能接受。
- **期望值**：没有预设阈值——这一问就是让你看着真数字拍板。参照物是「人在终端前等得住吗」。
- **实际值**（全部以事件账 / launch-receipt 时间戳为准，终端侧时间戳只定命令发出时刻，E-050）：
  - 冷启动（含 service 冷拉起）：CLI 发出 09:33:09.0 → `lease_acquired` 09:33:16.742 ≈ **7.7s**
  - warm start（service 已在）：09:35:11.4 → receipt 09:35:14.286 ≈ **2.9s**
  - 断连后另起终端查询（全新 CLI 进程）：**≈2s 内**返回
  - 延时旋钮账面保真：R001 `process-task` 35.762s ≥ 35000ms；R002 180.337s ≥ 180000ms
- **差没差**：没有可比基线，故不判「差」；三个读数都可由 `evidence/e2e-disconnect-20260828-events.jsonl.txt` 的原始帧独立复算。
- **证据局限**：①**「资源」这一维只有耗时，没有内存/CPU 采样**——问题问的是「成本」，我只答了时间这一半；②屏上和 CLI 的 `elapsed_seconds` 恒为 0（`state.mjs` 从不计算它），**不能当耗时读**；③单机 Windows 一次采样，非统计量。

**（二）P5-H 第二问 · 不开 DSH 时终端控制够不够处理故障（DHR31-H2）**

- **要证明啥**：控制终端没了以后，只用 CLI 能不能把局面接管回来。
- **期望值**：Run 不因终端消失而中断；新终端能看到连续事件账与同一终态。
- **实际值**（E-049 实录）：终端 A 起 180s 延时 Run → `herdr pane close` **整个终端被杀** → 全新终端 B 用 `relay list/status/events` 看到 Run 仍在推进、事件账连续、最终 succeeded；七条命令全部 exit 0。
- **差没差**：没差。
- **证据局限**：只做了「终端被杀」这一种故障；**没做**真正的故障注入（service 被杀、Store 损坏、磁盘满）。「够不够」是你的判断，我只证了这一种情形下够。

**（三）P5-H 第三问 · DSH 若可用，组合是否仍像统一工作台（DHR31-H3）**

- **要证明啥**：DSH 作为**附加客户端**接上来之后，Relay 面板和官方页签是不是一个整体。
- **期望值**：Relay 页签与「对话 / 轨迹」并列；点进去看到的 Run 与 CLI 是同一条、同一状态。
- **实际值**：`dsh-render-20260829-run-list.png` 显示 Relay 页签与官方两个页签并列、列表里是本仓真实 Run `R001-relay-basic-agent-task-1-20260829` 3/3 步；`-run-detail.png` 显示三步全「已完成」、尝试次数各 1、待处理事项 0；`cli-status-20260829-parity.json.txt` 的 `updated_at` 与详情页**逐字节相同**、`source=runtime-v2`。
- **差没差**：同一状态这一层没差。**观感上有差**：详情页 `内容`/`角色` 两列空、`前置步骤 —`、`用时 undefined`，头部还写着 `fixture <hash>`。
- **证据局限**：面板仍是 P4 期模型，那些空列是 F-018 裁决 (a) 的**预期留白**（冻结 RPC 不暴露运行文档，取不到就不编）；`用时 undefined` 是我的投影不对称（F-021，一行可修）；头部 fixture 字样是 P4 客户端硬编码标签、与数据来源无关（F-020）。**你判「像不像统一工作台」时需要把这几处计入**——它们是真实观感的一部分，不是噪声。

**（四）P5-H 第四问 · 选定语言继续作默认（DHR31-H4）**

- **要证明啥**：TypeScript/Node（ADR-001）这个选型，在真跑完五批之后还成不成立。
- **期望值**：没有因语言选型导致的返工、阻塞或性能悬崖。
- **实际值**：五批施工全部在 Node 上完成，183/183 全量绿；本卡登记的 21 条 findings 里**没有一条**根因是语言选型。
- **差没差**：没差。
- **证据局限**：**这是「没有出问题」的证据，不是「比别的语言更好」的证据**——没有做任何跨语言对照实验。

**（五）承接项 · 真实 DSH 渲染截图为真、销 RISK-DHR30-DSH-RENDER（DHR31-X1 人判半行）**

- **要证明啥**：屏上那条 Run 是本仓真实活数据，不是 fixture 摆拍。
- **期望值**：截图里的 Run 与 CLI 同一 `run_id`、同一终态、同一 `updated_at`；来源标记为 runtime-v2。
- **实际值**：三方 SHA256 证明装进 profile 的确是这一版（`mismatches=0`，且版本号未变而 `cordis.patch.yml` 哈希在两轮 remove/add 间改变）；真实 DSH boot 内 probe 取到 `source_kind=relay-v2` / `diagnostics:[]` / 真实 Run 与三节点真实状态；截图与 CLI 的 `updated_at` 逐字节相同。
- **差没差**：没差。
- **证据局限**：截图由主控在真实浏览器取（建会话需人手发消息、走用户额度，第三方无法用代码切 tab）；**我没有亲手截这两张图**，我核对的是它们的内容与 CLI/probe 一致。本机复用既有 `DSH_HOME`，未做全冷环境。

**风险放行账表**（可豁免风险登记；红线——数据口径 / 两轮复核 / 未收敛 P0P1 / 生产迁移上线 / 权限安全 / 流程完整性——原则上不许进本表。权限安全唯一窄例外须按 design/05 §二③在同一风险行完整登记 `RISK-PRIVATE-OWNER-SECRET-DISPLAY` 与全部条件；缺一仍硬拦。被接受项须反查到 findings/backlog/验收池的存活记录）：

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|-------|---------|------|------|------------|---------|---------|
| 无 | — | — | — | — | — | — |

> 私有凭据窄例外不是"任意 Git 文件可存凭据"：marker 与闭集内各 key 必须唯一，只登记仓库相对配置路径；任何公开/共享/可见/受众/群聊、未知 key、非白名单持久副本或其它红线均不适用。marker 一旦出现即严格校验，无 marker 的密钥/凭据风险仍硬拦。放行只能 `risk-accepted`；未轮换 finding 保持 open，轮换后改 resolved 时同一风险行追加唯一的 `rotation-completed=true rotated-at=YYYY-MM-DD`，完成日不得在未来。

> 无风险时：**范围/影响/期限/恢复/去处 各列留空或 `—`/`无`**（接受人写 `无` 或留 `{…}` 都行，结构闸只看描述列不看接受人）——这样判 0 风险、不触发 R24。反之：只要风险描述列填了实质内容，就算真已接受风险（接受人写什么、甚至没填，都计入），首行须写"带风险放行"、不能写"端到端验收通过"。

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [x] —— brief、task_plan（批 0~5 全闭）、progress（E-001~E-104）、独立复核区（五批各自小审 + 复裁记录）、review（本区）均在位
**as-built 更新了没**：本批触及的子系统，其 `as-built/<子系统>.md` 已覆盖更新到最新现状？（没动子系统现状可 N/A） [x] —— `as-built/relay-core.md` 新增 §3.11（`workflows/`）、§3.12（`workflow-driver` / `process-executor`，并按 F-008 承诺就地更正 design/07 §6 的现役边界）、§3.10 增量（`snapshot-main.mjs` sidecar 的三条边界）

→ 当前状态：**已验收**（E11 chat-confirm 2026-08-29，尾巴分流已裁决 F-023）

---

## 人类签名区　✅ 凭你在对话里的确认解锁

<核验清单由 AI 从 brief 的"人验"条目预生成，每条"AI/用户做什么 → 对话展示/应该看到什么 → 用户判断什么"，≤5 分钟点完。
 AI 可以代执行命令行、浏览器、截图、日志、对数等验证动作，但必须在对话框完整、真实展示关键证据（命令/操作、退出码/状态、关键输出或截图、完整日志/证据落点）；只报 `✅` 或"我跑过了"不算人验。
 你查看 AI 展示的证据或亲自核验后，AI 会在对话里只问一次：是否"已查看证据，认可执行本地收口"。默认本地收口授权包包含本任务的精确本地 squash、合入复验、verify、DevPlan/workspace 回填与任务 worktree/branch 清理；任务 SESSION 只由显式命令处理；不包含 push、deploy/发布/重启、环境或生产操作、下一张卡。你可以明说"只确认人验 / 暂不收口 / 保留工作树"缩窄。确认后 AI 连续执行 E11~E13，不再逐项追问，你全程不碰 git。
 没有你的对话确认，AI 永远不得碰本区。最高危（生产上线/迁移）建议你本人敲 git，不走代签。
 ——按"目的分块"组织：先写业务目的（覆盖哪条人验项），再写本工作区在这目的下交付了什么，最后列核验表；一个目的一块，多 H 项时比平铺清单好读。>

### 目的一：证明独立 Runtime + CLI 端到端可用且成本可接受（覆盖 P5-H 四问 · DHR31-H1~H4）

本工作区交付：{DSH 全程关闭下的 basic-agent-task 端到端闭环 + 真实终端断连/重连实录与耗时读数，挂 E-xxx（收口时回填）}。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| DHR31-H1 独立 Runtime + CLI 的启动 / 资源 / 恢复成本是否可接受 | 查看 AI 在对话展示的启动 / 资源 / 恢复耗时读数与实录 | 你判断该成本对日常使用可接受 | [x] |
| DHR31-H2 不开 DSH 时终端控制是否足以处理故障 | 查看断连恢复实录与 CLI 输出（含故障处理路径） | 你判断只靠终端控制面即可定位并处理故障 | [x] |
| DHR31-H3 DSH 若可用，组合是否仍像统一工作台 | 查看 DSH 附加客户端同态证据与真实渲染截图（按 DHR_50 结论：未收敛延后、判否 N/A，不阻塞其余人判） | 你判断 DSH + 独立 Runtime 组合仍像统一工作台（或明示延后 / N/A） | [x] |
| DHR31-H4 选定语言是否继续作默认 | 结合本卡实现与运行表现回顾 ADR-001 语言选型 | 你明确表态继续 / 不继续作默认 | [x] |

### 目的二：确认真实 DSH 渲染截图为真、销 DHR_30 移交风险项（覆盖 DHR31-X1 人判半行 · RISK-DHR30-DSH-RENDER）

本工作区交付：{DHR_49 面板数据源改经 Bridge 取活数据 → repack → `dsh plugin add` 重装 → 真实渲染截图（G3 需求境证据），挂 E-xxx（收口时回填）}。

| 验什么 | 做什么 | 通过标准 | 结果 |
|--------|--------|----------|------|
| DHR31-X1 截图确属真实 DSH 渲染 Bridge 活数据（非 fixture 重建 / 非摆拍） | 查看 AI 展示的截图与取证链（数据源 diff、repack/重装命令、活数据对照） | 你认可截图为真实渲染，`RISK-DHR30-DSH-RENDER` 可销 | [x] |

---

- 确认记录：chat-confirm——2026-08-29 用户在对话明文「认可，收口」，确认对象=上一轮已展示的 releasePacket（P5-H 四问业务化五段展示区 + DSH 截图取证链 + 完成条件 6 条挂证据 + 0 风险表；环境留在 127.0.0.1:3080 供核）；同拍 AskUserQuestion 两题裁决尾巴分流（9 条整批按建议去处）与 F-002（卡面不回改、留注记），记 findings F-023
- verify 提交 SHA：`3aede91`（master；squash 合入 `52f6427`）
- 签名：hyf（chat-confirm 代签）　　时间：2026-08-29

→ 解锁状态：**已验收**（随后各任务回 DevPlan 任务表销户）

> 铁律：没有对应的 `verify(<模块>): <任务ID列表> …` git 提交，本批任务不许标"已完成"。

### 确认记录（append-only，每次人验确认追加一行｜协议见 design/05 §九 协议三）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---------|--------|----------------------|----------------------|-------------------------------|---------------|--------------------------------|
| 2026-08-29 | hyf | DHR_31 releasePacket（人判结果 H1~H4+X1 全过 + 风险决定 0 条 + 机器证据摘要） | review.md@63772ef AI 提交区（业务化五段展示区 + 完成条件表 + 元数据 11 行） | capability_hash `a990fddad486f669…` 零漂移；全量 183/183（E-074/E-094）；三方 SHA mismatches=0（E-100）；实录耗时可复算（E-050/E-052） | DHR31-M1~M5、DHR31-X1、DHR31-H1~H4 | 通过 |
