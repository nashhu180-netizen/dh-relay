<!-- dh:v1 · workspace/DHR_33/review-code2-opus.md -->
# DHR_33 · 代码轮 2 复核（换人 fresh / 侦测型 + 有效单测变异点选定）

> **复核者模型身份（候选-40 双证，两处自述不一致，如实并存）**：
> · **SessionStart hook 告知：`claude-fable-5[1m]`**（与预审、代码轮 1、需求轮三个实例同源）；
> · 本实例系统提示自述：`Opus 5` / model id `claude-opus-5`。
> 拉起参数按主控为 `--model opus`。两处冲突不做裁定，按候选-40 原样登记，待用户裁决。
> 复核对象：`5ecd4b0`（返工 1）叠加 `596a49b`（施工），工作树 HEAD。
> 对照基准：`rework-1.md` A1~A12 / B13~B16 / C17~C18 / D19~D20；不重复 `review-code1-opus.md` 已裁决项。
> 手段：只读 + 行为探针（scratchpad 内的一次性脚本，不入仓）+ 字节级临时变异（全部按 sha256 往返还原）。未 commit / 未 push；contracts、fixtures、profiles、store、rpc、adapters 六目录连临时改动都未发生。

---

## 一、结论

**返工 1 的 A 组主体是真修，不是声明修**——A1/A2/A3/A4/A6/A7/A8/A10/A11 我都读了代码并用变异实证，其中 6 项有机器保护（见 §三变异表）。轮 1 的 P1-1（done/idle 主路径崩）、P1-3（blocked 第二沿静默）、P1-4（readyTimeoutMs 死参数）确认已消灭。

**但不建议按现状放行，两条 P1 是返工新引入 / 返工未闭合的运行时缺陷**，都能用探针复现：

1. 恢复届把「herdr CLI 暂时性故障」判成 `E_EXECUTOR_ORPHANED`——与 A10 刚刚收紧的判据自相矛盾，会把活着的 agent 判死，配合 `resume --retryFailed` 造成双跑；
2. `stop()` 撞在 launch 窗口（默认 10s 宽）→ 真实 pane/agent **不被杀、泄漏**，节点终态反而变成 `waiting_human`，且**一条 Result 都不落**。

另有一类系统性问题需要主控注意：**A7（分叉顺序）、A10（reconcile 收紧）、B13#3（executor_kind 逐字）三项"改对了但零测试保护"**——我把它们回退成返工前的错误写法，17/17 全绿（§三 N1~N3）。返工把行为修对了，却没把这几处钉住，下一次改动可以无声退回。

契约面复验通过：六目录相对 `596a49b^` 零 diff、`audit-contracts` 0 违规、返工提交所碰文件全部落在 brief allowed-paths 闭集内。

---

## 二、返工清单逐条核对（读代码验证，不看声明）

| 项 | 主张 | 我的核对结论 | 依据 |
|---|---|---|---|
| A1 done/idle 崩溃 | 补 `observation_status:'alive'` + 外层 try/catch | ✅ 真修 | `workflow-driver.mjs:174-175` 带 alive；`:210` catch 存在。变异 V1 证红。catch 自身仍有隐患 → P3-17 |
| A2 判定器注入口 + done 有界 | `herdrJudge` / `doneTimeoutMs` 参数化 | ✅ 真修 | `:33` 参数、`:188` 透传、`:193-199` 有界后单次 Attention 并 `return`。变异 V4 证红 |
| A3 blocked 沿触发 | 用 `lastStatus` 判转移；working/lost 复位 | ✅ 真修（有边角）| `:183`；`:172` lostAttention 复位。变异 V2 证红。瞬时断致重复发 → P3-16 |
| A4 launch 盲区真轮询 | 按 `readyTimeoutMs` 轮询到 idle/working | ✅ 真修 | `herdr-executor.mjs:42-48`；`blind` 只在"观测成功但非 ready"为真，观测失败不算盲区。变异 V5 证红 |
| A5 ORPHANED 恢复闭环 | 起届扫 running attempt，探活接管 / 判孤儿 | ⚠️ **部分**：闭环在、测试在，但**判据过宽**（P1-1）且 `executor_ref` 未按 attempt 过滤（P2-6） | `:291-318`。变异 V8 证红 |
| A6 事件与轮询治理 | 只在沿变化落账；所有轮询有生命周期出口 | ⚠️ **部分**：沿变化 ✅（V3 证红）；**出口只覆盖 done，`idle` 恒态无任何上限**（P2-5） | `:160`、`:173`、`:193-200` |
| A7 分叉顺序 process 先 | 与规格逐字对齐 | ✅ 代码对，**零测试保护**（P2-2） | `:218-221`。变异 N2 全绿 |
| A8 detail 统一 + 第 6 键 profile | 三处破格全部走 `observationDetail` | ✅ 真修 | `:147/:161/:167/:175` 全走 `herdrDetail`；`observationDetail` 六键含 `profile`。变异 V6 证红。`seq` 仍两处硬编码 0 → P3-15 |
| A9 launch 失败码分界 | 参数错 → `E_BAD_VALUE`；herdr 起不来 → `E_EXECUTOR_HOST_LOST`；子码进 `reason_detail` | ⚠️ **部分**：两类码分开了，但 `structured.reason_detail` 放的是 `launched.detail`，**子码 `launched.reason` 仍被丢弃** → P3-19 | `:126-130` |
| A10 reconcile 收紧 | 只有明确 not-found 才 host_lost | ✅ 代码对，**零测试保护**（P2-1） | `herdr-executor.mjs:67-68` + `herdr-cli.mjs:35` 的 `missing` 位。变异 N1 全绿 |
| A11 send 语义走 prompt | 文本走 `agent prompt` | ✅ 真修 | `herdr-executor.mjs:79-82`、`herdr-cli.mjs:53`；出口归属已在 F-5 登记 |
| A12 P3 小修 6 项 + attach 交叉断言 | 全做 | ⚠️ **3 做 3 未做 + 交叉断言未做** | 做了：stop 返回值检查（`:135/:207`）、renderFocus 假指令（`render.mjs:92`）、`'result' in value`（`herdr-cli.mjs:41`）。**未做**：删 `main.mjs:328` 死参数（P3-12）、openAttempt 迁回裁决注释（P3-11）、kill 独立短超时（P3-13）、attach 双份交叉断言（P3-14） |
| B13 11 组补齐 | 全补 | ⚠️ **部分**：#3 的 `executor_kind='herdr-agent'` 逐字断言、#2 的「send 后恢复」缺席；#1 是 `>=2` 而非 N=N；#4 缺「不落 Result」负断言 | `herdr-adapter.test.mjs:136-209`。变异 N3 全绿为证 |
| B14 herdr-cli 层覆盖 | 6 个动词参数序列 + 三分支 | ⚠️ 基本达成；参数序列只钉了 4 个（`calls[0]/[1]/[4]/[5]`），带 `--source/--lines` 的 `agentRead` 没钉 → P3-18 | `:70-108` |
| B15 Headless SSH 桩剧本 | 补产出 + 不冒充备注 | ✅ | `test/helpers/headless-ssh-scenario.mjs`，`:168` 有断言 |
| B16 候选-39 用例总数 | 记基线差 | ❌ **数字错且自相矛盾**（P2-8） | progress:29 写「200 → 205（+5）」，同段 :31 又写「207 tests」 |
| C17/C18 smoke 重做 | 一次跑全逐字贴 | ⚠️ 文本齐全（DSH 双取证、真 Run 四命令、pane 回显、stop 853ms、`herdr --help` 无 subscribe→F-6）。一次性现场，只读复核无法独立复现，仅核了内部一致性 | progress:30 |
| D19 findings 追加 | F-3~F-8 | ✅ 六条全在，状态 open、处置写清 | findings.md:9-14 |
| D20 progress DONE 重写 | 11 组落地表 + 自评按事实改 | ⚠️ 新增了返工 DONE 段，但**11 组全打 ✓**（与 B13 实况不符），且旧 DONE 段 :18 的「②~④ 已有机器证」原样留着未重写，两段自评并存 → P2-7 |

---

## 三、有效单测变异（E-3306 机器证）

**方法**：字节级精确替换（只替换目标字节串，不重写文件编码/行尾），五步 = 记 sha256 → 变异 → 跑定向测试 → 还原并验 sha256 → 复跑证绿。

**改前基线 sha256（= 还原后 sha256，逐项已核）**

| 文件 | sha256 | 字节 |
|---|---|---|
| `relay-core/runtime/workflow-driver.mjs` | `f00e55c3f0229c6130864d3aba735b3696d59ed7634b60716c41212024e4a665` | 19538 |
| `relay-core/runtime/executors/herdr/herdr-executor.mjs` | `96802815b66265ac4f10e35b400d0d595d10a24258b97aa90c551229622bcce1` | 4922 |
| `relay-core/cli/render.mjs` | `7155e32874557376019b00764c5850f231d22a719ecc1b340b59068deda3400e` | 5982 |
| `relay-core/runtime/executors/herdr/herdr-cli.mjs`（未变异） | `8669b8797f06efe63638804b8f3525cff6e8832966107e3f7f7df11db8717bda` | — |
| `relay-core/cli/main.mjs`（未变异） | `3872739c903188f9b20293b23715a214a14c591228d01098239c3dcef46a99a1` | — |

> **操作留痕（必须报给主控，不是缺陷但改变了字节）**：`workflow-driver.mjs` 在本 session 开始时实测 sha256 = `59e75b1e3969b6478231ea5ba743a82a88c7db6ce74fd191cf37bf0a3a372ccb`（**混合行尾**：worker 写入的新行是 LF，原文件是 CRLF）。我第一次变异误用了 Edit 工具，它把全文规范化成了统一 CRLF。已用 `git checkout --` 归位到**仓库规范形态**（即 `git checkout` 本来就会产出的字节），现 sha256 = `f00e55c3…`；`git hash-object` = `0dbdd627…` **与 HEAD 完全一致**、`git diff` 为空、六目录零 diff、`git status` 干净。混合行尾的原始字节无法从 git 复原（autocrlf=true，blob 是纯 LF），内容零变化。**此后所有变异改用字节级替换，sha256 完全往返**。

### 3.1 有效变异点（8 处，全部红 → 还原 → 绿）

| # | 选点（生产代码） | 语义改坏方式 | 预期红 | 实际 | 变异态 sha256 | 还原 sha256 一致 | 复跑绿 |
|---|---|---|---|---|---|---|---|
| V1 | `runtime/workflow-driver.mjs:175` alive 观测事件 | 删掉 `observation_status: 'alive',`（回退 A1） | driver 主路径写事件失败 | ✅ **红 4 例**：`timeout:two blocked edges` / `timeout:done attention` / `timeout:loss attention twice` / `timeout:take over recovery`（pass 7 / fail 4） | *（用 Edit 工具，见上方留痕）* | ✅ `f00e55c3…` | ✅ 11/11 |
| V2 | `workflow-driver.mjs:183` blocked 沿判定 | `lastStatus !== 'blocked'` → `lastStatus === null`（回退 A3 到"整个 attempt 只发一次"） | #1/#2 第二沿不发 | ✅ **红 1 例**：`Error: timeout:two blocked edges`（pass 10 / fail 1） | `89ced364ef85ff97c7afe5091626dc55d0b511934b0481b6b7468f13bd5b6a6e` | ✅ `f00e55c3…` | ✅ 11/11 |
| V3 | `workflow-driver.mjs:160` observation_lost 去重守卫 | `if (lastObservationStatus !== 'observation_lost')` → `if (true)`（回退 A6 沿变化落账） | #4 断次数超标 | ✅ **红**：`AssertionError actual: 5, expected: 2`。**附带**：该变异下测试进程 120s 未退出（exit=124），同命令基线 exit=0 | `798113a20966fad81f9c9b5d9fb48c53898730903ad555227bc92e6a39fcefb6` | ✅ `f00e55c3…` | ✅ |
| V4 | `runtime/executors/herdr/herdr-executor.mjs:75` 判定器调用 | `typeof judge === 'function' ? judge(text) : null` → `null`（回退 A2 注入口） | #3/#5 succeeded 无路可达 | ✅ **红**：`Error: timeout:judge result` | `6fc129ac6c647f11e534189cd280f261a7abbdba1efe77afea585fa9b12ed69d` | ✅ `96802815…` | ✅ |
| V5 | `herdr-executor.mjs:48` 盲区判定 | ready 名单加 `'unknown'`（让盲区判不出来，回退 A4） | #7/#8 盲区正例 | ✅ **红**：`actual: false, expected: true` | `607247100e06addae2bee9b14b92f49c69b42688cbb48e740d53aa4db4bab7d4` | ✅ `96802815…` | ✅ |
| V6 | `herdr-executor.mjs:20` detail 编码 | 删掉第 6 键 `;profile=${profileId}`（回退 A8 主控修订） | adapter#1 + #4 | ✅ **红 2 例**：逐字串比较失败 + `/;profile=herdr\.codex\.test$/` 不匹配 | `e64908cea34e96fae01e3497ab21dbc3dc82a852664820011d489e8baa97a949` | ✅ `96802815…` | ✅ |
| V7 | `cli/render.mjs:92` focus 渲染 | `detail: ${dash(event.detail)}` → 常量 `detail: -`（破坏"每个值逐字可找"硬规则） | focus 用例 | ✅ **红**：`The expression evaluated to a falsy value` | `b24bfcca1a59b6d7cd0f6aef7ded2e0ae84909c2b3e1bc4bc0d6b75dfe8f2d5b` | ✅ `7155e328…` | ✅ |
| V8 | `workflow-driver.mjs:302` 恢复届孤儿判据 | `if (!probe.ok)` → `if (false)`（回退 A5 的判孤儿分支） | #10 orphaned | ✅ **红**：`Error: timeout:orphaned recovery` | `958ba517130cc46cf27381d66325fbb63fb016972c95f68251ddbc656ca8cbc1` | ✅ `f00e55c3…` | ✅ |

**选点覆盖面**：`runtime/workflow-driver.mjs` ×4、`runtime/executors/herdr/herdr-executor.mjs` ×3、`cli/render.mjs` ×1；对应 task_plan 步骤 6 登记的四个候选变异面全部命中（①状态映射/detail 编码=V6、②blocked 只发一次=V2、③observation_lost 记账=V3、④超阈值 Attention 链=V1/V3），另补 A2/A4/A5 三个返工新增面。全部满足候选-45「该保护唯一负责的场景」。

### 3.2 无效变异点（4 处，改坏后**全绿** → 覆盖缺口实证）

| # | 选点 | 语义改坏方式 | 结果 | 变异态 sha256 | 还原一致 | 说明 |
|---|---|---|---|---|---|---|
| N1 | `herdr-executor.mjs:68` reconcile 判据 | 回退成轮 1 的 `!observed.ok && !pane.ok` | ❌ **11/11 全绿** | `1c5289ecdfd3eae41f771176020464b068b6aa2037887c83bfe95475a0947c92` | ✅ | A10 的收紧零保护 → P2-1 |
| N2 | `workflow-driver.mjs:219` 分叉顺序 | 加条件让 herdr 抢在 process 之前 | ❌ **17/17 全绿**（含 agent-node） | `1c97c7e726562870f08d56cd5b13e23eed7e27e41a0de0234f0ddde0a0fc3b9f` | ✅ | A7 零保护 → P2-2 |
| N3 | `workflow-driver.mjs:190` 成功终态 | `executorKind: 'herdr-agent'` → `'process'` | ❌ **17/17 全绿** | `f439bf38a11421583c24115cdd3848041853c7b98b5b8598eceaf44927ea2bc2` | ✅ | B13#3 的逐字断言缺席 → P2-3 |
| N4 | `cli/render.mjs:92` attach 守卫 | 拆掉 `event.executor_ref ?` 守卫，退回 `dash()` 假指令 | ❌ **11/11 全绿** | `09f5630a3119003da9383d66f398f9c00a76a21dfb02aed0ed02027c59fc0aa2` | ✅ | A12/轮1 P3-2 的修复零保护 → P3-14 |

### 3.3 收工核验

```
runtime/workflow-driver.mjs                   f00e55c3f0229c6130864d3aba735b3696d59ed7634b60716c41212024e4a665  ✅
runtime/executors/herdr/herdr-executor.mjs    96802815b66265ac4f10e35b400d0d595d10a24258b97aa90c551229622bcce1  ✅
runtime/executors/herdr/herdr-cli.mjs         8669b8797f06efe63638804b8f3525cff6e8832966107e3f7f7df11db8717bda  ✅
cli/render.mjs                                7155e32874557376019b00764c5850f231d22a719ecc1b340b59068deda3400e  ✅
cli/main.mjs                                  3872739c903188f9b20293b23715a214a14c591228d01098239c3dcef46a99a1  ✅
git status --porcelain                        （空）
git diff --stat 596a49b^ HEAD -- contracts fixtures profiles store rpc adapters   （空）
node tools/audit-contracts.mjs                0 违规（meta 0 / K-3 0 / 信封 0 / token 217 全登记 / 白名单 0）
node --test test/herdr-adapter.test.mjs       11/11
node --test test/agent-node.test.mjs           6/6
```

---

## 四、P1（两条，必须回修）

### P1-1 · 恢复届把「herdr CLI 暂时性故障」判死成 `E_EXECUTOR_ORPHANED`

- **位置**：`relay-core/runtime/workflow-driver.mjs:301-305`
- **问题**：`const probe = await herdrCli.agentGet(...); if (!probe.ok) { …outcome:'orphaned', reason:'E_EXECUTOR_ORPHANED' }`。`!probe.ok` 的来源里，只有「明确答复无此 agent」（`herdr-cli.mjs:35` 的 `missing:true`）才算宿主没了；spawn 失败（herdr 没装 / 没在 PATH / 服务没起）、超时、JSON 解析失败**同样落进这条分支**。这正是 A10 刚刚在 `reconcileHerdrAgent` 里收紧掉的判据——恢复届把它原样犯了一遍。`contracts/reason-codes.md` 对该码的措辞是「Runtime 恢复后探活/重连失败、**确认已无宿主**」，`!probe.ok` 不构成"确认"。
- **实证**（临时仓 + 真 Store + 真 driver，注入一个所有动词都返回 `{ok:false, detail:'spawn:ENOENT', missing:false}` 的 CLI）：

  ```
  [A] 事件流: run_created | node_started | attempt_started | host_observation_changed | attempt_orphaned
  [A] attempt_orphaned? true  E_EXECUTOR_ORPHANED
  ```

- **影响**：Runtime 重启时 herdr 恰好没起（开机后、服务重装、PATH 尚未生效——都是常态），**全部在飞的 herdr attempt 会被一次性判死**；而真实的 agent 还活着在烧 quota。更糟的是 `resume --retryFailed` 会挑 `orphaned` 重开 fresh attempt（`:333`），于是同一个任务上出现两个真实 agent 并行跑。
- **建议**：与 A10 同口径——只有 `probe.missing === true` 才判 orphaned；其它失败视为"这一届探不动"，保持 running 不落 Result（或落一条 `host_observation_changed / observation_lost` 后跳过本节点），等下一届再探。

### P1-2 · `stop()` 撞在 launch 窗口 → 真实 pane/agent 泄漏、无 Result、节点反而变成 `waiting_human`

- **位置**：`relay-core/runtime/workflow-driver.mjs:121-136`（`current = stopHandle` 之前的整段 launch）、`:207-209`（stop 后的分支）
- **问题**：process 路径在 spawn 之后立刻补了一句 `if (stopping) handle.kill();`（`:264`，注释写明"stop 与 spawn 撞在一起时不留活口"）。herdr 路径**没有对称处理**：`current` 要等 `launchHerdrAgent` 整个返回才被赋值，而 launch 内部会按 `readyTimeoutMs`（默认 **10 秒**）轮询 `agent get`。这 10 秒里 `stop()` 拿到的 `current` 还是 null / 上一个节点的句柄，`await current?.kill()` 什么也没杀。等 launch 回来，`while (!stopping)` 直接为假，跳过整个循环，落到 `:207`：`stopHandle.result` 是 `null` → 走 else → 发一条 `human_input_requested`。
- **实证**（launch 期间 60ms 处调 `stop()`，`herdrReadyTimeoutMs:400`）：

  ```
  [B] paneSplit=1 agentStart=1 paneKill=0          ← pane 开了、agent 起了、一次都没关
  [B] 事件流: run_created | node_started | attempt_started | human_input_requested | human_input_requested
  [B] node status = waiting_human | 有终态 Result? false
  ```

- **影响**：三重错。①**真实资源泄漏**——一个已经启动的 coding agent 和它的 pane 永远没人回收（生产上就是一个持续烧账号 quota 的实例）；②**账目撒谎**——用户按了 stop，账上却记"需要你输入"，节点状态 `waiting_human`；③**没有终态**——本 attempt 永远不落 Result，`resume --retryFailed` 也捞不回（只挑 pending/failed/orphaned）。
- **建议**：`launchHerdrAgent` 成功后立即 `current = stopHandle; if (stopping) { await stopHandle.kill(); }`，与 process 路径 `:264` 对称；`:207-209` 的 else 分支不该发 Attention——stop 语义下 kill 失败应落 Result（reason 仍 `E_EXECUTOR_KILLED`，把 kill 失败塞 `structured.reason_detail`）或至少落一条 `host_observation_changed`，绝不能既无终态又谎报 Attention。另建议 launch 期间也把句柄以某种形式先落账（现在 pane 已开、agent 已起，但账上一个 `executor_ref` 都没有，连 P2-6 的恢复路径都救不了它）。

---

## 五、P2（九条）

### P2-1 · A10 的 reconcile 收紧零测试保护（回退到轮 1 错误写法后 11/11 全绿）
`herdr-executor.mjs:67-68`。变异 N1 把判据换回 `!observed.ok && !pane.ok`，全部用例照绿。原因：`herdr-adapter.test.mjs:43-49` 的两个场景（`paneAlive:true` 的 unknown / `missing:true` 的双亡）在新旧两种判据下结论相同，**没有一个用例落在两者分歧的区间**——即「CLI 调不通但 pane 其实还在」。建议补一例：`agentGet`/`paneGet` 都返回 `{ok:false, missing:false}` → 必须是 `observation_lost`。这也是 P1-1 该有的护栏。

### P2-2 · A7 的分叉顺序零测试保护（herdr 抢在 process 前，17/17 全绿）
`workflow-driver.mjs:218-221`。变异 N2 让同时声明 `[{process},{herdr-agent}]` 的节点优先走 herdr，herdr-adapter + agent-node 全绿。轮 1 P2-1 把这条定性为"复核焦点②守住既有 process 路径行为的破口"，返工改对了顺序却没钉住。建议在 `agent-node.test.mjs` 加一个双候选节点：`executor_profiles: [{kind:'process',…},{kind:'herdr-agent',…}]` → 必须走 process。

### P2-3 · B13#3 要求的 `executor_kind='herdr-agent'` 逐字断言缺席
`herdr-adapter.test.mjs:152-155` 只断言了 `attempt_succeeded` 事件存在 + 节点 `succeeded`，没有断言 `executor_kind`。变异 N3 把成功终态的 `executorKind` 改成 `'process'`，17/17 全绿。rework B13 第 3 条原文就是"succeeded 且 `executor_kind='herdr-agent'` 逐字"。同组还缺 B13#2 的「send 后离开 blocked、心跳恢复」（driver 层完全没有），#4 的「不落 Result」负断言，#1 的 N 次 N 条（现在是 `>=2`）。

### P2-4 · 新增 driver 测试 #3/#5 在并发负载下间歇性红
同一份未变异代码，`node --test test/herdr-adapter.test.mjs test/agent-node.test.mjs`（node 默认多文件并发）4 次里红了 2 次，失败点固定在 `Error: timeout:done attention`（10s 用尽）；单跑 `herdr-adapter.test.mjs` 4 次全绿，加 `--test-concurrency=1` 全绿（17/17），换成 `herdr-adapter + workflow.test` 并跑也绿——冲突对象是重进程负载的 `agent-node.test.mjs`。
返工门槛记录的是"`node --test --test-concurrency=4 test/herdr-adapter.test.mjs` 11/11、`node --test test/agent-node.test.mjs` 6/6"——**两个文件是分开跑的**，恰好绕开了这个抖动；而 `npm test` 正是 19 文件 `--test-concurrency=4`。所以 progress:31 的"207 tests = 205 pass / 2 fail、失败均不触及 allowed-paths"这条结论，对新测的稳定性没有覆盖力。建议：`noJudge` 场景别靠 `herdrPollMs:0` + `doneTimeoutMs:-1` + 合成时钟去逼有界，改成显式小正阈值 + 放宽 `runtimeUntil` 预算，并给该 fixture 补 `t.after(() => driver.stop())`（现在它靠 driver 自终止，一旦不终止就是挂死风险，见 V3 观测到的 exit=124）。

### P2-5 · `idle` 恒态没有任何生命周期出口，且每轮都在 spawn `agent read`
`workflow-driver.mjs:187-200`。`doneAt` 的有界上限只在 `observation.herdr_status === 'done'` 时累积，`else doneAt = null`——一个停在 `idle` 的 agent 会**永远轮询下去**：既不落 Result、也不发 Attention、连事件都不再产生（沿变化去重之后）。而且每一轮都会先 `captureHerdrResult` → `cli.agentRead`（`herdr-cli.mjs` 是 `spawnSync`），生产默认 `herdrPollMs=1000` 时相当于每秒起 2 个 herdr 子进程，永不停。
- **实证**：`[C] 400ms 后 idle 节点: agentRead 次数=25, 事件数=4, 事件流=run_created | node_started | attempt_started | host_observation_changed`
- rework A6 的原文是「**所有**轮询循环必须有生命周期出口（stop / done 上限 / lost 升级后停发）」，idle 这条没兑现。建议把有界上限挂在"非 working / 非 blocked 的静默期"上，而不是只挂 `done`。

### P2-6 · 恢复届取 `executor_ref` 没按当前 attempt 过滤
`workflow-driver.mjs:299`：`[...events].reverse().find(event => event.node_id === node.node_id && typeof event.executor_ref === 'string')` —— 只按 node 找，不看 `attempt_id`。两个后果：
1. 当前 attempt 崩在 `attempt_started` 与首条观测之间（正是 P1-2 那个 launch 窗口）时，会捞到**上一届 attempt** 的 `agent_name` / `pane`，然后用它去"接管"当前 attempt，或据它判当前 attempt 孤儿；
2. 该节点历史上从没有过任何 `executor_ref` 事件时直接 `continue`，attempt 永久悬挂、真实 agent 泄漏——A5 想堵的就是这个洞。

建议加上 `event.attempt_id === nodeState.current_attempt_id`，并为"当届无任何 executor_ref"补一条明确处置（判孤儿或落 Attention），别静默跳过。

### P2-7 · progress 返工 DONE 段的 11 组核对表全打 ✓，与实况不符；旧自评未按 D-20 重写
progress:29 把 11 组全标 ✓，但 #3 的 `executor_kind` 逐字（P2-3）、#2 的 send 后恢复实际不存在，N3 变异全绿即为反证。同时 D-20 要求"DONE 段重写、完成条件自评按事实改"，实际做法是**追加**了一个新的 DONE 段，旧段 :18 的"②~④ 代码、定向单测和真实 adapter smoke 已有机器证"原样留着，两份自评并存，读者会取到过期的那份。这与轮 1 P2-7 是同一类问题的复发。

### P2-8 · 候选-39（B16）取证数字错误且自相矛盾
progress:29 写「用例总数基线 200 → 返工后 205（+5）」，同一 DONE 段 :31 又写「207 tests」。实测：`herdr-adapter.test.mjs` 由 4 → 11（+7），`agent-node.test.mjs` 6 不变，基线 200 是在 `596a49b` 上测的（已含施工新增的 5 例），所以正确写法是 **200 → 207（+7）**。B16 是明确的取证条目，数字得对。

### P2-9 · `main.mjs:322` 把 focus 的事件源从 `host_observation_changed` 扩到含 `human_input_requested`，未经裁决
brief 裁决 4 的逐字口径是「找该 node 最近一条 `host_observation_changed`，渲染附着指引」。返工把过滤条件改成 `['host_observation_changed','human_input_requested'].includes(...)`——这一改动**不在 rework-1 的任何条目里**，属于 worker 自行改道冻结裁决（AGENTS 编排协议§通用铁律 5「范围外新想法记 findings，不顺手做」）。功能上也有副作用：`human_input_requested` 没有 `observation_status` 字段，focus 会渲染成 `observation_status: -`。改动本身也许更好用，但应该走 findings / 回主控裁决，而不是默默进代码。

---

## 六、P3（九条）

| # | 位置 | 问题 | 建议 |
|---|---|---|---|
| P3-11 | `workflow-driver.mjs:92-101` | A12「openAttempt 迁回裁决注释」**未做**。`596a49b^:101-104` 的原注释（`node_started` 会被终态守卫拒、所以只属首次 attempt；重试可见性由 `attempt_started` 承担）在提级成 `openAttempt` 后彻底消失——本仓少数解释"为什么"的注释之一 | 迁到 `openAttempt` 函数头 |
| P3-12 | `cli/main.mjs:328` | A12「删死参数」**未做**。`report(outcome, { …, renderText: renderFocus, pickResult: result => result })` 两个参数在 `!ok` 分支永远走不到 | 删掉 |
| P3-13 | `herdr-executor.mjs:88-90` | A12「kill 加独立短超时」**未做**。`stopHerdrAgent → cli.paneKill` 仍吃 `makeHerdrCli` 的 `timeoutMs=10_000`，`stop()` 里是 `await current?.kill()`，`stop` RPC 最长被顶 10s | `paneKill` 走一个独立短超时的 invoke |
| P3-14 | `herdr-adapter.test.mjs:39` vs `:66` | A12「attach 模板双份交叉断言」**未做**。`ATTACH_PREFIX`（runtime 侧）与 `render.mjs:92` 的字面量仍是两份，测试里各自硬编码、互不钉。变异 N4 拆掉 `executor_ref` 守卫退回假指令，11/11 全绿——连轮 1 P3-2 的修复也没保护 | 补一条断言：`renderFocus(evt)` 的 attach 行 === `attachHerdrAgent({handle}).instruction`；再补一条 `renderFocus({…, executor_ref: null})` 不含 `attach:` |
| P3-15 | `workflow-driver.mjs:147`、`:161/:167` | A8「seq 传最后已知值」两处仍是 0。launch 的 ready 轮询已经观测到 seq，但没随 `launched` 返回；首轮就观测断时 `lastSeq` 也还是 null。实测 detail：`herdr_status=unknown;agent=herdr-c0333b5e-…;pane=pane-1;seq=0;work_dir_root=…` | `launchHerdrAgent` 回吐最后一次观测的 `state_change_seq`，driver 用它初始化 `lastSeq` |
| P3-16 | `workflow-driver.mjs:163` | blocked 期间一次**瞬时**观测断会让 Attention 重发。lost 分支把 `lastStatus = null`，恢复后若仍是 blocked 就再发一条——规格是"离开 blocked 前只发一次"，观测抖动不等于离开 blocked。实证 `[D]`：`blocked → unknown → blocked` 产出 2 条 `human_input_requested` | lost 分支别清 `lastStatus`（或另存 `lastAliveStatus`） |
| P3-17 | `workflow-driver.mjs:210-212` | A1 的 catch-all 用裸协议码 `E_BAD_VALUE` 落 Result（轮 1 P2-4 已定性"包装层错误不当协议码"）；且 catch 内的 `recordResult` 自己再抛（终态冲突、失租、盘满）就会重演 A1 想堵的"整届 driver 静默死" | catch 内的 recordResult 再包一层，失败时只记日志不外抛；reason 用能表达"driver 内部异常"的既有码 |
| P3-18 | `herdr-adapter.test.mjs:91-94` | B14「6 个动词参数序列各钉一次」只钉了 4 个（`calls[0]/[1]/[4]/[5]`）。唯一带非平凡参数的 `agentRead`（`--source recent-unwrapped --lines 120`）没钉，`agentGet`/`paneGet`/`paneKill` 也没钉——herdr 换版改参数名时这几条不会红 | 补 `calls[2]/[3]/[6]/[7]` 的 deepEqual |
| P3-19 | `workflow-driver.mjs:126-130` | A9「子码进 `structured.reason_detail`」只放了 `launched.detail`，`launched.reason`（`E_BAD_VALUE:HERDR_CLI` / `E_BAD_VALUE:WORK_DIR_ROOT`）仍被丢。另：`pane-id-missing`（herdr 返回体形状不符，属 CLI 契约漂移）被归到 `E_EXECUTOR_HOST_LOST`，语义偏了 | `reason_detail` 带上 `launched.reason`；形状不符单列 |

---

## 七、本轮已复验通过的项（供收口引用）

- 六目录（contracts / fixtures / profiles / store / rpc / adapters）相对 `596a49b^` **零 diff** ✅
- `node tools/audit-contracts.mjs` **0 违规**（meta 0 / K-3 0 / 信封 0 / 结构 token 217 全登记 / 白名单 0）✅
- 返工提交 `5ecd4b0` 所碰的 9 个非 workspace 文件，**全部落在 brief allowed-paths 闭集内** ✅（cli/main、cli/render、herdr 三件套、test/helpers ×3、herdr-adapter.test）
- `node --test test/herdr-adapter.test.mjs` 11/11 ✅；`node --test test/agent-node.test.mjs` 6/6 ✅（`:130` pi/dsh 不托管钉仍在，`:198` herdr 托管钉逐字断言 `E_EXECUTOR_KILLED`）
- 轮 1 六条 P1 的代码面：P1-1（alive 补齐）、P1-2（herdrJudge 注入口）、P1-3（沿判定）、P1-4（真轮询 + blind 语义）、P1-5（恢复闭环）、P1-6（11 组从 2 组真验事实扩到 9 组）**全部有代码落地**，其中 6 处经变异证有机器保护
- `herdr-cli.mjs` 三分错误分类（spawn / timeout-or-signal / 非零退出 + `missing` 位）与可执行文件桩实测一致 ✅
- `test/helpers/fake-herdr-bin.mjs` 落在 `test/helpers/`、非 fixtures，未触发 manifest 钉 ✅；`fixture-manifest` 79/79 未受影响（六目录零 diff 已覆盖）
- CLI 纪律：`runFocus` 仍走 `subscribe`，不 import store、不读 `events.jsonl` ✅；`renderFocus` 仍是逐字转述 + 固定模板 ✅（唯一偏差是事件源扩了一类，见 P2-9）

---

## 八、给主控的收口提示

1. **两条 P1 都不是"补断言"能解决的**，是运行时行为，建议进返工 2。P1-2 尤其建议连带把「launch 成功后立刻落一条带 `executor_ref` 的事件」一起做掉——它同时是 P2-6 的前提。
2. **P2-1/P2-2/P2-3 是同一类**：返工把行为改对了但没留护栏，三处各补一条断言即可（我已在每条里写明断言形状），成本很低，但不补就等于这三处修复随时可以无声退回。
3. **E-3306 已可判定达成**：8 个有效变异点全部红→还原（sha256 两算一致）→绿，覆盖四个登记候选面 + A2/A4/A5 三个返工新增面，证据在 §三。
4. **E-3302 / E-3303 / E-3304 我这一轮不做裁决**：E-3302 受 P1-1/P1-2 影响（"进程退出/Herdr 重启均有明确结果"这半句在 P1-1 下反而会给出**错误**的明确结果）；E-3303 的真实 smoke 是一次性现场，只读复核只能核文本一致性，需要人验。
5. **本轮操作留痕**：`workflow-driver.mjs` 工作树字节由混合行尾被规范化成仓库规范形态（详见 §三基线表下的说明框）——`git hash-object` 与 HEAD 一致、`git diff` 空、`git status` 干净、内容零变化，但字节确实变了，请主控知悉后再决定是否需要 worker 侧统一行尾。

REVIEW-DONE 共20条（P1×2 / P2×9 / P3×9）＋变异表 8 有效 / 4 无效
