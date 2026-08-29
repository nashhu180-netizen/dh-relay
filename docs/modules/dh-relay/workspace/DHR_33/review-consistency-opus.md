<!-- dh:v1 · workspace/DHR_33/review-consistency-opus.md -->
# DHR_33 · 一致性复核（fresh / 侦测型只读 + 行为探针）

> **复核者模型身份（候选-40 取证，本实例两处自述不一致，如实并存，不做裁定）**：
> · **SessionStart hook 告知：`claude-fable-5[1m]`**（与预审、代码轮 1、需求轮、代码轮 2 四个实例同源）；
> · 本实例系统提示自述：`Opus 5` / model id `claude-opus-5`。
> 拉起参数按主控为 claude fresh 实例。两证冲突原样登记，待用户裁决。
> **复核对象**：`4d68163`（返工 2）= 工作树 HEAD；对照基准 `5ecd4b0`（返工 1）与 `rework-2.md` A1~A11 / B12~B18 / C19~C21。
> **手段**：`git diff 5ecd4b0..4d68163` 逐条读代码（不看 progress 声明）＋ scratchpad 内 relay-core 完整副本上的 12 个字节级变异探针（全部 sha256 往返还原）＋ 仓内只读复跑。
> **边界遵守**：仓库零改动（收工 `git status --porcelain` 为空）；变异全部发生在 `%TEMP%` 的副本里，仓内五个目标文件 sha256 与 HEAD 逐一比对一致；未 commit、未 push。

---

## 一、结论

**返工 2 的运行时主体是真修**：review-code2 两条 P1（恢复届误判孤儿、stop 撞 launch 窗口）都在代码里闭环，并且各自有一条新用例咬住——我把两处分别改回错误写法，各红一例（M5 / M6）。轮 2 报的三处"改对了但零保护"里，两处（P2-1 reconcile、P2-3 executor_kind）现在有真护栏。

**但不建议按现状判"20 条全闭环"，三条实证未闭环、三条半闭环**：

1. **P2-2（分叉顺序钉死）名义补了用例，实际零判别力** —— 我让 herdr 抢在 process 之前，`agent-node.test.mjs` **7/7 全绿**，与返工前的 N2 变异结果完全一样。新用例的两个断言（`paneSplits===0`、`events===['run_created']`）在"走 process"和"走 herdr"两条路上取值相同，钉了个寂寞。
2. **P2-4（#3/#5 并发抖动）没有消灭，只是变稀** —— progress B15 写"连续 4 次均 22 pass / 0 fail"，我独立并跑 **6 次红了 2 次**，失败点与轮 2 报的**逐字相同**：`✖ DHR_33 driver #3/#5：done 有界、判定成功与双亡 HOST_LOST`、`Error: timeout:done attention`。
3. **C 段文档修正（P2-7 / P2-8）整段没做** —— progress 的过期自评、全 ✓ 的 11 组表、`200 → 205（+5）` 与 `207 tests` 的自相矛盾，一个字都没改；返工 2 反而**追加了第三段 DONE**，现在三段自评并存。

半闭环三条：P3-15（seq 补了，但空值现在渲染成字面 `seq=null`）、P3-19（子码保真做了，`pane-id-missing` 仍归 `E_EXECUTOR_HOST_LOST`——rework-2 原文明写"不再归"）、P3-17（按令执行，但副作用是 driver 内部异常届永久悬挂）。

另发现 **3 条返工 2 新引入 / 无人覆盖的问题**（§七）：idle 不再 capture 与 task_plan 状态映射表冲突；launch 失败路径不回收已开的 pane；新测隐式读用户家目录的真实注册表。

**E-3306 的证据基线已过期**：8 个有效变异是在 `5ecd4b0` 上取的，返工 2 又改了 `workflow-driver.mjs` 108 行。我在 HEAD 上复算了其中 5 个点，全部仍红（§三），可支持"达成"结论继续成立，但验收表应注明基线。

---

## 二、review-code2 二十条逐条闭环核对（读代码 + 变异实证）

> 判定口径：**✅ 真闭环**＝代码改对且有断言咬住（或本条不需要断言）；**⚠️ 半闭环**＝改了但 rework-2 明文要求的某一半未兑现；**❌ 未闭环**＝要求项没做，或做了但零效力。

| # | 轮 2 条目 | rework-2 项 | 判定 | 依据（代码位置 / 探针） |
|---|---|---|---|---|
| P1-1 | 恢复届把 herdr CLI 暂时性故障判死成 ORPHANED | A1 | ✅ | `workflow-driver.mjs:332-345`：`if (probe.missing === true)` 才 `outcome:'orphaned'`，否则解析账上 detail 重建六键、落 `observation_status:'observation_lost'` 后 `continue`。探针 **M5**（判据放回 `if (true)`）→ 红 1 例 |
| P1-2 | stop 撞 launch 窗口 → pane 泄漏、无终态、假 Attention | A2+A3 | ✅ | `:133-136` launch 成功即 `current = stopHandle; if (stopping) await stopHandle.kill();`（与 process 路径 `:264` 对称）；`:137-142` 立刻落一条带 `executor_ref` 的 `host_observation_changed`；`:205-208` 原 else 分支删除，统一 `recordResult(E_EXECUTOR_KILLED)`，kill 失败详情进 `reason_detail`。探针 **M6**（去掉补杀）→ 红 1 例 |
| P2-1 | A10 的 reconcile 收紧零测试保护 | B12 | ✅ | `herdr-adapter.test.mjs:46-49` 新增 transient 桩（`agentGet`/`paneGet` 均 `{ok:false, missing:false}`）→ 断言 `observation_lost`。探针 **M1**（判据回退成 `!observed.ok && !pane.ok`）→ **红 2 例** |
| P2-2 | A7 分叉顺序零测试保护 | B13 | ❌ **未闭环** | 用例加了（`agent-node.test.mjs:227-244`），但断言是 `fake.paneSplits===0` + `events===['run_created']`。process 候选 ref 是 `missing-step.mjs`（不可解析 → `:258` 提前 return，零事件）；herdr 候选 ref 是 `herdr.codex.test`，测试**没注入 herdrRegistryPath**，注册表查无此条 → `:114` F-007 提前 return，同样零事件。**两条路可观测结果完全相同**。探针 **M2**（让 herdr 抢在 process 前）→ **7/7 全绿**，与返工前 N2 结果一致 |
| P2-3 | B13#3 `executor_kind` 逐字断言缺席 | B14 | ✅ | `herdr-adapter.test.mjs:163-164`：读回 `results/<receipt>.json` 断言 `executor_kind === 'herdr-agent'`。探针 **M3**（成功终态改 `'process'`）→ 红 1 例 |
| P2-4 | #3/#5 并发负载间歇性红 | B15 | ❌ **未闭环** | fixture 确已改造（`:132` 去掉合成时钟、`doneTimeoutMs:10 herdrPollMs:2`、`:144` 补 `t.after(driver.stop())`），挂死风险确实消除（见 §三 V3′）。但抖动仍在：`node --test test/herdr-adapter.test.mjs test/agent-node.test.mjs` **独立并跑 6 次，红 2 次**，失败逐字同轮 2：`✖ DHR_33 driver #3/#5…` / `Error: timeout:done attention` (10042ms)。progress B15「连续 4 次 0 fail」不可复现 |
| P2-5 | idle 恒态无生命周期出口 + 每轮 spawn agent read | A5 | ✅（带新偏差） | `:194/:200/:210-216`：`quietAt` 挂"非 working / 非 blocked 的静默期"，超 `doneTimeoutMs` 单次 Attention 后 `return`；`captureHerdrResult` 收进 `if (herdr_status === 'done')`，idle 不再 spawn。新用例断言 `agentReads === 0`。探针 **M7**（上限回退成仅 done）→ 红 1 例。**偏差见 §七-1** |
| P2-6 | 恢复届 executor_ref 未按 attempt 过滤 | A4 | ✅ | `:324` 反查加 `event.attempt_id === nodeState.current_attempt_id`；`:326-331` 当届无 ref 不再静默 `continue`，落 `observation_lost` 观测。新用例 `:264-273` 两例（transient / withoutRef）都断言无 `attempt_orphaned` |
| P2-7 | progress 11 组全 ✓ 与实况不符；旧自评未按 D-20 重写 | C20 | ❌ **未做** | `progress.md:29` 的 11 组表仍全 ✓（其中 #3 的 `executor_kind`、#2 的 send 后恢复当时并不存在）；`:18` 的过期自评「②~④ 已有机器证」原样保留；返工 2 **又追加**了第三段 DONE（`:33-60`）。现在施工 / 返工 1 / 返工 2 三段自评并存，读者按顺序读会先取到两份过期的 |
| P2-8 | 候选-39 取证数字错误且自相矛盾 | C19 | ❌ **未做** | `progress.md:29` 仍是「基线 200 → 返工后 205（+5）」，同段 `:31` 仍是「207 tests」。rework-2 C19 要求改成「200 → 207（+7）」并删矛盾表述，一个字未动 |
| P2-9 | focus 事件源擅自扩到 human_input_requested | A10 | ✅ | `cli/main.mjs:324` 回到 `frame.params?.kind === 'host_observation_changed'` 单值判定；`findings.md` F-9 已登记（open，交主控/后续卡） |
| P3-11 | openAttempt 裁决注释未迁回 | A11 | ✅ | `workflow-driver.mjs:96-97` 与 `596a49b^:101-102` 逐字一致（"node_started 在终态之后会被终态守卫拒…重试的可见性由 registerReceipt 发的 attempt_started 承担"） |
| P3-12 | `main.mjs:328` 死参数未删 | A11 | ✅ | 现为 `report(outcome, { json, out, err })` |
| P3-13 | kill 未走独立短超时 | A11 | ✅ | `herdr-cli.mjs:27/55` invoke 支持每调用超时、`paneKill(paneId, {timeoutMs})` 透传；`herdr-executor.mjs:90` `stopHerdrAgent({…, timeoutMs = 2_000})` |
| P3-14 | attach 模板双份交叉断言未做 | B16 | ✅ | `herdr-adapter.test.mjs:72-74`：attach 行 === `attachHerdrAgent({handle}).instruction`，且 `renderFocus({…executor_ref:null})` 不含 `attach:`。探针 **M4**（拆掉 `event.executor_ref ?` 守卫）→ 红 1 例 |
| P3-15 | seq 两处硬编码 0 | A8 | ⚠️ **半闭环** | `herdr-executor.mjs:50-51` 回吐 `ready_state_change_seq`，driver `:159` 用它初始化 `lastSeq`，三处 `?? 0` 全部去掉 ✅。**但**空值现在直接进模板：`observationDetail` 的 `seq=${seq}` 在 seq 为 null 时渲染成字面 **`seq=null`**（launch 期观测失败、恢复届无 ref 两条路径都会产出）。brief 裁决 3 的 `seq=<n>` 位出现非数值 token，是把"硬编码 0 撒谎"换成了"字面 null" |
| P3-16 | blocked 期间瞬时观测断重发 Attention | A6 | ✅ | `:180` 的 `lastStatus = null;` 已删除；`lostAttention` 复位保留（符合 A6 原意：断→恢复→再断仍应升级） |
| P3-17 | catch-all 用裸协议码 + recordResult 自身再抛 | A7 | ⚠️ **按令执行，有副作用** | `:218-226`：不再 `recordResult`，改 `console.error` + 内层 try/catch 包住 Attention 写入。符合 rework-2「无合适码则落 Attention 而非 Result」。**副作用**：driver 内部异常后本 attempt 既无终态也不在 `resume --retryFailed` 的捞取集合（`:358` 只挑 pending/failed/orphaned），会永久悬挂——从"静默死"变成"有 Attention 的悬挂"，是改善但未消灭 |
| P3-18 | B14 六动词只钉了 4 个 | B17 | ✅ | `herdr-adapter.test.mjs:101-106` 补齐 `calls[2]/[3]/[6]/[7]`，含 `agentRead` 的 `--source recent-unwrapped --lines 120` |
| P3-19 | launch 失败子码被丢 | A9 | ⚠️ **半闭环** | `reason_detail` 已带 `launch.reason` ✅（`:126-130` 三段 join）。**但** `pane-id-missing` 仍走 `reason = 'E_EXECUTOR_HOST_LOST'`，只在 `reason_detail` 里加了 `herdr-cli-response-shape` 标记。rework-2 A9 原文是"**不再归** `E_EXECUTOR_HOST_LOST`，单列到 `reason_detail` 说明"——前半句未兑现 |

**统计：✅ 真闭环 14 / ⚠️ 半闭环 3（P3-15、P3-17、P3-19）/ ❌ 未闭环 3（P2-2、P2-4、P2-7、P2-8 —— 其中 P2-7/P2-8 同属 C 段文档，合计条目 4 条）。**

> rework-2 C21（findings 追加 F-9、F-1 更新）：**F-9 已补 ✅**，与代码事实一致（focus 确已回退）。**F-1 更新了但与 progress 矛盾**，见 §四-4。

---

## 三、变异复验（基线 = HEAD `4d68163`，全部在 scratchpad 副本上做）

**方法**：把 relay-core 整树复制到 `%TEMP%` 副本（node_modules 软链），字节级精确替换 → 跑定向测试 → 还原并复算 sha256。**仓内文件全程零改动**，收工时副本七个文件与仓内逐一 sha256 相同。

### 3.1 返工 2 新增/收紧行为的护栏（7 处）

| # | 变异（把返工 2 的修复改回错误写法） | 目标测试 | 结果 |
|---|---|---|---|
| M1 | `reconcileHerdrAgent` 判据回退成轮 1 的 `!observed.ok && !pane.ok` | herdr-adapter | ✅ **红 2 例**（15→13 pass）：`adapter：unknown 经 pane 复核…` / `driver #3/#5` |
| M2 | 分叉顺序：让 herdr 抢在 process 之前 | agent-node | ❌ **7/7 全绿** —— 护栏无效，见 P2-2 |
| M3 | 成功终态 `executorKind: 'herdr-agent'` → `'process'` | herdr-adapter | ✅ **红 1 例**：`driver #3/#5` |
| M4 | 拆掉 `render.mjs:95` 的 `event.executor_ref ?` 守卫，退回 `dash()` 假指令 | herdr-adapter | ✅ **红 1 例**：`focus：只渲染事件既有字段` |
| M5 | 恢复届孤儿判据 `probe.missing === true` → `true`（放宽回 `!probe.ok`） | herdr-adapter | ✅ **红 1 例**：`driver：恢复届 transient 探测与无 ref 都只落 observation_lost` |
| M6 | 删掉 launch 成功后的 `if (stopping) await stopHandle.kill();` | herdr-adapter | ✅ **红 1 例**：`driver：stop 撞 launch 窗口仍杀 pane…` |
| M7 | idle 静默上限回退成"仅 done 才计时" | herdr-adapter | ✅ **红 1 例**：`driver：idle 超阈值单次 Attention 后停止轮询` |

### 3.2 轮 2 八个有效变异点在 HEAD 上的复算（抽 5 个，E-3306 基线补证）

| # | 对应轮 2 | 变异 | 结果（HEAD） |
|---|---|---|---|
| V1′ | V1 | alive 观测事件删 `observation_status: 'alive'` | ✅ 红 **5 例**（轮 2 是 4 例；返工 2 新增用例扩大了咬合面） |
| V2′ | V2 | blocked 沿判定 `lastStatus !== 'blocked'` → `=== null` | ✅ 红 2 例 |
| V3′ | V3 | observation_lost 去重守卫短路成 `if (true)` | ✅ 红 1 例，**`exit=1` 正常退出**（轮 2 时该变异导致 120s 不退出 `exit=124`——挂死风险已被 B15 的 `t.after(driver.stop())` 消除，这条治理是真的） |
| V6′ | V6 | `observationDetail` 删第 6 键 `;profile=` | ✅ 红 2 例 |
| V7′ | V7 | `renderFocus` 的 `detail:` 改成常量 | ✅ 红 1 例 |

> 结论：轮 2 选定的变异点在返工 2 之后**依然有效**，E-3306「达成」可继续成立；但**验收表应把证据基线从 `5ecd4b0` 更正为 `4d68163`，并注明复算范围（8 点中复算 5 点 + 新增 7 点）**。

### 3.3 只读复跑（仓内，未变异）

```
node --test test/herdr-adapter.test.mjs            15/15  ✅   （progress 定向单跑声称 15/15，一致）
node --test test/agent-node.test.mjs                7/7   ✅   （progress 声称 7/7，一致）
node --test herdr-adapter + agent-node（并跑）×6    4 绿 / 2 红 ❌（progress B15 声称 4/4 绿，不可复现）
node tools/audit-contracts.mjs                     0 违规 ✅（meta 0 / K-3 0 / 信封 0 / token 217 全登记 / 白名单 0）
git diff --stat 596a49b^ HEAD -- contracts fixtures profiles store rpc adapters   （空）✅
git status --porcelain                             （空）✅
```

**行尾纪律实测**：返工 2 触碰的 8 个文件全部 100% CRLF（`workflow-driver 397/397`、`herdr-executor 92/92`、`herdr-cli 58/58`、`main 395/395`、`render 141/141`、`herdr-adapter.test 273/273`、`agent-node.test 521/521`、`fake-herdr 27/27`），轮 2 报的混合行尾问题已消除 ✅。

---

## 四、三方对账：brief 完成条件 ↔ review.md 验收表 ↔ progress/findings

| # | 矛盾 | 三方原文 | 影响 |
|---|---|---|---|
| 1 | **验收表 6 行只回填了 1 行，progress 旧自评却说"②~④ 已有机器证"** | review.md 表：E-3301 延后 / E-3302~E-3305 覆盖态「待」、证据列与结论列**全空** / E-3306 达成。progress `:18`：「②~④ 代码、定向单测和真实 adapter smoke 已有机器证」 | 验收表是收口靶子，progress 是账本；一个说"待"、一个说"已有机器证"。按宪章 #3，标准档进待验收要有需求境证据——目前 4 条口径**在验收表上零证据** |
| 2 | **brief 完成条件 5 有三个分句，验收表只给了第一个分句 ID** | brief 完成条件 5 = ①`work_dir_root` 由 launch 决定并登记 → E-3305；②`awaiting_result` 语义替换为 `running`+`host_observation_changed`「是否可接受由验收人裁决」→ **无 ID、无行**；③HostObservation 版本/能力 hash 降级为 smoke progress 证据 → **无 ID、无行** | 两条明确写着"由验收人裁决"的 Oracle 差异（候选-42 增补项）没有验收靶子，收口时会被整体跳过。**建议主控补 E-3307 / E-3308 两行**，否则候选-42 的机制在本卡只走完了"记录"没走完"验收" |
| 3 | **完成条件 4 的"事件快路"与 F-6 直接冲突** | brief 完成条件 4：「事件快路与 snapshot 慢路均可工作」；F-6：「`herdr --help` 未暴露事件订阅面；本卡交付慢轮询与状态沿变化记账，**未冒充事件快路**」 | E-3304 按字面**不可能达成**（详见 §六）。findings 如实记了、brief 没改，验收表也没标"受限"——三方各说各话 |
| 4 | **F-1 与 progress 返工 2 表对全量回归的结论相反** | F-1（open）：「三次全量 `npm test` 都在 `cli.test.mjs` 阶段未给终态摘要…**不能作为本卡全量绿证据**」；progress `:58`：「主控在干净环境实证 212 tests / 212 pass / 0 fail / exit 0…**A-0 硬门槛判过**」 | 同一件事两个结论并存且都是 open/有效。rework-2 C21 要求 F-1「按事实更新」，实际只更新了 worker 侧观察，没把主控的 212/212 写进去 |
| 4b | **且主控那次 212/212 是单样本** | 我独立并跑 herdr+agent-node **6 次红 2 次**，签名与轮 2 P2-4 完全相同 | `npm test` 是 19 文件 `--test-concurrency=4`，包含这两个文件；单次绿不足以证明 A-0 门槛稳定通过。**建议主控在收口前把 212/212 复跑 3 次以上再判 A-0** |
| 5 | **progress 三段 DONE 自评并存，无 superseded 指针** | `:14-19` 施工 DONE、`:26-31` 返工 1 DONE、`:33-60` 返工 2 DONE | 读者从上往下读会先取到两份过期结论（含全 ✓ 的 11 组表和 205/+5）。rework-2 C20 明文"两段自评合并为一份，不得并存"，未执行 |
| 6 | **task_plan 状态映射表与 HEAD 代码不符（返工 2 新引入）** | task_plan 步骤 3：「`idle→有判定结论则 capture 落 Result`」、步骤 4：「`done/idle → capture`」；HEAD `:207-211`：capture 只在 `herdr_status === 'done'` 分支内 | 见 §七-1，是行为差异不只是文档差异 |
| 7 | **rework-2 的分组编号与 progress 状态表编号对不上，C 段整段没有落地行** | rework-2 = A(1~11) / B(12~18) / C(19~21)；progress 状态表 = A1~A11（8 行合并）+ B12~B16（5 行合并）+ 定向单跑 + 全量 npm test | A/B 合并尚可追溯，**C 段三项在状态表里没有任何一行**——正是这三项里有两项没做（P2-7/P2-8）却无人核对。rework-2 门槛句写的是"本清单 **A/B** 逐项在 progress 落地状态表"，C 段被门槛本身放行了 |

---

## 五、数字一致性抽查

| 项 | 声明 | 实测 | 结论 |
|---|---|---|---|
| 候选-39 用例总数（返工 1） | progress `:29`「基线 200 → 返工后 205（+5）」 | 轮 2 已实测正确值 = **200 → 207（+7）**（herdr-adapter 4→11，agent-node 6 不变） | ❌ **仍错，且与同段 `:31` 的「207 tests」自相矛盾**（rework-2 C19 未执行） |
| 候选-39 用例总数（返工 2） | progress 无独立记录 | herdr-adapter 11→**15**（+4），agent-node 6→**7**（+1）；207+5 = **212** | ✅ 与主控 212 tests 自洽；但**返工 2 段没写增量**，候选-39 的取证动作这一轮缺席 |
| 定向单跑 | 「herdr-adapter 15/15；agent-node 7/7」 | 我复跑：**15/15、7/7** | ✅ 一致 |
| 并跑 4 次 | 「连续 4 次均终态通过，22 pass / 0 fail」 | 我并跑 6 次：**4 绿 / 2 红**（`#3/#5` timeout:done attention） | ❌ **不可复现** |
| 全量 npm test | 「主控干净环境 212 / 212 / exit 0 / 101 秒」 | 未独立复跑（本轮只读，且 F-1 记录了挂死史）；算术自洽（207+5=212） | ⚠️ **单样本**，见 §四-4b |
| F-1 状态 | open，「不能作为全量绿证据」 | 与 progress「A-0 判过」冲突 | ❌ 两份事实并存 |
| F-9 状态 | open，「返工 2 已回退为仅 host_observation_changed」 | `main.mjs:324` 实测确已回退 | ✅ 描述与代码一致 |
| 复核条数 | review.md：预审 19 / 代码轮 1 19 / 需求轮 16 / 代码轮 2 20 | review-code2 尾行「共20条（P1×2 / P2×9 / P3×9）」，正文条目实数 2+9+9=20 | ✅ 一致 |

---

## 六、E-3302 / E-3304 的复核侧意见（**建议，不是裁决**）

### E-3302（H5 · P6-M3）：**建议判「达成」**

brief 拆出的五个分句逐一核：

| 分句 | 代码事实 | 机器证 | 意见 |
|---|---|---|---|
| `blocked` 进入持久 Attention | `:198-203` 沿触发发 `human_input_requested`（`state.mjs` 里该事件是 `waiting_human` 唯一来源）；`:180` 不再清 `lastStatus`，瞬时断不重发 | 用例 #1/#2 两沿 + 重放持久（`openStore` 重读 state 逐字节比对）；探针 V2′ 红 | ✅ |
| `done` 只进 awaiting_result（本卡=保持 running + 观测事件） | `:207-211`：done 且无 judge → 不落 Result；`:190-193` 落 `host_observation_changed`（detail 带 `herdr_status=done`） | 用例 #3 断言 `waiting_human`（有界后），judge 注入才 `succeeded`；探针 M3/V1′ 红 | ✅ |
| 漏事件 | 沿变化去重 + 每轮 `agent get` 慢路对账，`seq` 随观测推进 | 用例 #4 观测断单次升级 / 恢复再升级；探针 V3′ 红 | ✅ |
| Herdr 重启（CLI 探不动） | **P1-1 修复后**：`:339-345` 只落 `observation_lost`，不判死 | 新用例 transient 恢复届；探针 M5 红 | ✅ 这条正是轮 2 判"E-3302 受影响"的原因，现已消除 |
| pane 消失 / 进程退出 | `reconcile` 双亡 → `E_EXECUTOR_HOST_LOST`（`:172-175`）；stop → `E_EXECUTOR_KILLED`（`:205-208`，含撞 launch 窗口）；恢复届确认 missing → `E_EXECUTOR_ORPHANED` | 用例 #5 host_lost、agent-node herdr 托管钉断言 KILLED、#10 orphaned；探针 M1/M6 红 | ✅ |

**唯一保留意见**：`E_BAD_VALUE` 的 catch-all 路径（P3-17）下 attempt 无终态且不可 retry（§二 P3-17 副作用）——这是"driver 自己出异常"这一格，不在 H5 点名的五格里，不影响本条判定，建议作为 findings 交后续卡。

### E-3304（快路 + 慢路对账 / HostObservation 记版本·能力·pane 句柄 / focus 不存拼接命令）：**建议判「受限达成」，且必须由验收人显式受理三处降级**

| 分句 | 事实 | 意见 |
|---|---|---|
| snapshot 慢路可工作 | `observeHerdrAgent` + `reconcileHerdrAgent` 每轮对账，沿变化落 `host_observation_changed` | ✅ 达成 |
| **事件快路可工作** | **不存在**。F-6：`herdr --help` 未暴露事件订阅面，本卡交付的是"慢轮询 + 状态沿变化记账"，worker 明确写了"未冒充事件快路" | ❌ **不达成**。这不是实现缺陷而是上游能力缺失，处置正确（如实登记 + 交 DHR_35），但**按 brief 字面不能判达成** |
| HostObservation 记 **pane 句柄** | `detail` 六键含 `pane=<id>`、`agent=<名>`；探针 V6′ 证有断言咬 | ✅ 达成 |
| HostObservation 记 **版本 / 能力 hash** | 已按 brief 裁决 3 + 候选-42 降级为"真实 smoke 的 progress 证据"。progress 记了 herdr `0.8.2`（版本 ✅），**"能力 hash" 全链无对应产物**——progress `:11` 的 `capability_hash=994d5f…` 是 relay 自己的 capability baseline，不是 herdr 能力指纹 | ⚠️ **版本达成、能力 hash 未达成也未登记**。建议要么补一条 findings 明说"herdr 能力 hash 本卡不产出，交 DHR_35"，要么在验收表标"未承接" |
| `focus` 不保存任意拼接命令 | `render.mjs:86-96` 逐字段打印 + 固定模板 `ATTACH_PREFIX` + 逐字插 `executor_ref`，零字符串拆解；`runFocus` 走 `subscribe`，不 import store、不读 events.jsonl | ✅ 达成，探针 M4/V7′ 双向咬住 |

**建议裁决口径**：E-3304 = **受限达成**（4 个分句里 2 达成 / 1 部分 / 1 因上游能力缺失不达成）。若主控希望保留"达成"，须先把 brief 完成条件 4 的"事件快路"按候选-42 的 Oracle 差异条款改写为"本卡不承接，归 DHR_35"，并在验收表留行——**不能在完成条件不变的情况下判达成**。

### 附：其余四条的旁证（供主控回填参考，非裁决）

- **E-3301**：延后处置合规——`test/helpers/headless-ssh-scenario.mjs` 在 helpers/ 不在 fixtures/，测试有"不冒充"断言，brief/progress 双处写"待真实 smoke" ✅ 无冒充。
- **E-3303**：真实 smoke 是一次性现场（progress `:30`），只读复核只能核内部一致性；其中"DSH 未运行"取证（`NO_DSH_PROCESS`/`NO_DSH_SERVICE`）+ 注入 fake-herdr 的真 Run 四命令回放，形态符合候选-36（以真实产物+真实环境跑一次）。**需人验**。
- **E-3305**：`launchHerdrAgent` 无 `workDirRoot` 直接 `E_BAD_VALUE:WORK_DIR_ROOT`；handle 与 detail 六键都带 `work_dir_root`；用例 `:27` 逐字断言 ✅ 达成。但 F-7 记着"当前恒取 repoRoot"——**"由 launch 决定"这半句只在形状上成立**，来源规则交 DHR_35，建议验收表结论写"达成（来源规则见 F-7）"。
- **E-3306**：达成成立，但**证据基线需从 `5ecd4b0` 更正为 `4d68163`**（§三.2）。

---

## 七、返工 2 新引入 / 至今无人覆盖的问题（本轮新报）

### N-1（P2）· idle 不再 capture，与 task_plan 状态映射表冲突，可能让成功终态不可达

- **位置**：`workflow-driver.mjs:206-211`
- **事实**：返工 1 的写法是"非 working / 非 blocked → capture（含 idle）"；返工 2 修 P2-5 时把 `captureHerdrResult` 整段收进了 `if (observation.herdr_status === 'done')`。rework-2 A5 只要求"把有界上限从仅 done 改挂静默期"，**没要求也不需要**同时收窄 capture 的触发面。
- **与冻结口径冲突**：task_plan 步骤 3 状态映射表写「`idle→有判定结论则 capture 落 Result，无则 observation 登记`」，步骤 4 写「`done/idle → capture`」。现在 idle 一次也不 capture。
- **风险**：本机 `herdr agent get` 的 `agent_status` 取值是 idle/working/blocked/done/unknown（knowledge 手册 + task_plan `:24`）。若真实 coding agent 干完活回落到 **idle**（而不是 done），成功终态永远不可达——节点只会走到静默超时的 Attention。本卡桩测全部用 `['idle','done']` 序列，天然绕开了这个形态。
- **建议**：要么恢复 idle 也 capture（把"每轮 spawn agent read"的问题用节流而不是取消解决），要么在 DHR_35 冻结判定器语义时明确"成功只从 done 转"，并把 task_plan 那两行改掉 + 记 findings。

### N-2（P2）· launch 失败路径不回收已开的 pane

- **位置**：`herdr-executor.mjs:25-32`
- **事实**：`paneSplit` 成功之后有两条失败出口——`:28` `pane-id-missing` 和 `:32` `agentStart` 失败——两条都直接 `return`，**不调 `paneKill`**。driver 侧 `:122-131` 收到 `!launch.ok` 就 `recordResult(failed)` 返回，`stopHandle` 还没建立，`current` 仍是 null。
- **影响**：与轮 2 P1-2 同类的真实资源泄漏，只是窗口更窄：herdr 起了 pane、agent 没起来，pane 永远留着。返工 2 修好了"stop 撞 launch"，这条尾巴没扫。
- **建议**：`launchHerdrAgent` 在 pane 已开而后续失败时先 `cli.paneKill(paneId)` 再返回，失败详情并进 `detail`；补一条用例（`agentStart` 返回 `{ok:false}` → `paneKills === 1`）。

### N-3（P3）· 新增的分叉顺序用例隐式依赖用户家目录的真实注册表

- **位置**：`agent-node.test.mjs:238`
- **事实**：`startWorkflowDriver({ repoRoot, runId, actor, herdrCli: fake.cli })` **未传 `herdrRegistryPath`**，默认落到 `~/.dh-relay/executor-profiles.json`（本机实测该文件存在、3142 字节、无 `herdr.codex.test` 条目）。当前不可达（process 分支先返回），但这正是 P2-2 零判别力的成因；一旦有人按建议改成"herdr 分支必须可达"的强断言，测试结论就会随本机注册表内容漂移。
- **建议**：所有触碰 herdr 分支的测试一律显式注入 `herdrRegistryPath` 指向临时文件（herdr-adapter.test 的 `runtimeFixture` 已经这么做了，agent-node 的两条没有）；`loadExecutorProfiles` 可考虑在测试环境下缺省即失败。

### N-4（P3）· `seq=null` 进 detail

见 §二 P3-15。建议 `observationDetail` 对 null 归一成 `seq=-`（与恢复届 `agent=-`/`pane=-` 的占位符一致）或保留 `0` 但同时在 detail 里区分"未观测到"与"seq 真为 0"。

### N-5（P3）· driver 内部异常届不可 retry

见 §二 P3-17。建议在 `resume --retryFailed` 的捞取集合里增加"有 Attention 但无 Result 且超期"的判据，或 catch 分支落一条能表达"driver 内部异常"的 Result（需要新 reason code 时按 brief 规矩 = BLOCKED，交后续契约卡）。

---

## 八、给主控的收口提示

1. **三条必须回修才谈"20 条全闭环"**：P2-2（护栏零判别力，我给了可直接用的修法：process 候选换成**可解析**的 step ref，让"走 process"产出真实 attempt 事件，两条路结果才有差）、P2-4（抖动仍在，6 跑 2 红，建议按 P2-4 原建议给 `noJudge` 场景放宽 `runtimeUntil` 预算而不是只改阈值）、C 段两项文档修正（P2-7/P2-8，纯文本，成本最低但一直在漏）。
2. **rework 清单的门槛句要改**：现在写的是"A/B 逐项落表"，C 段被自己的门槛放行；本卡两次返工，C 段各漏一次（返工 1 漏 D-20，返工 2 漏 C19/C20）。
3. **A-0 硬门槛建议复跑 3 次**：212/212 是单样本，而我实测同一批文件的并发抖动没有消灭。
4. **验收表需要主控动手三处**：①补 E-3307/E-3308 承接 brief 完成条件 5 的两条 Oracle 差异；②E-3306 的证据基线改成 `4d68163`；③E-3304 若判达成，须先按候选-42 改写完成条件 4 的"事件快路"分句。
5. **本轮零越权**：仓内文件全程未改（收工 `git status --porcelain` 空），全部变异在 `%TEMP%` 副本内完成并 sha256 往返还原；除本文件与 `review-lessons-opus.md` 外未新增任何文件。

CONSISTENCY-REVIEW-DONE 闭环核对 20 条（✅14 / ⚠️3 / ❌3 条目、4 项）＋ 三方对账矛盾 7 条 ＋ 数字抽查 8 项 ＋ 新报问题 5 条（P2×2 / P3×3）＋ 变异探针 12 个
