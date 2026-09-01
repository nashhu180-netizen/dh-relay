<!-- dh:v1 · DHR_70 一致性复核（第 4 路 · 横向） · 复核者原文（主控捕获落盘，未删改） -->
# review-consistency-codex — DHR_70

- **复核者**：`dhr70con`
- **形态**：codex `--sandbox read-only` · gpt-5.6-terra · high · **fresh，Review Batch 并发，四路互不继承会话**
- **派发**：`/codex` 插件 companion，cwd = `.dh-worktrees/DHR_70`
- **派单**：`review-brief-consistency.md`
- **基线**：`35ff2db..b6a3b47`，HEAD 记为 `cb742d4`
- **落账**：e:E-7013

---

## 形态自述

- 只读静态一致性复核；未修改文件，未执行测试。
- HEAD：`cb742d4`；指定基线实现提交：`b6a3b47`；diff 基线：`35ff2db..b6a3b47`。
- 结论：未发现 P0/P1/P2/P3 级“遗漏”。发现两处有意差异，均有当前代码语义支撑。

## 比对清单（扫了哪些维度、每个维度找到几处同类）

| 维度 | grep/搜索方式 | 找到几处同类 |
|---|---|---:|
| 当前 actor 路由 | `submitExecutorResult`、`ensureActor`、`commitReceipt`、`stopDriver` | 6 |
| lease 拒绝语义 | `E_LEASE_HELD`、`refuseIfClosed`、`writeGuard`、`withReason` | 7 |
| gate 注册 | `registerSubmissionGate`、`submissionGates.add` | 4 |
| Result 幂等 | `idempotent` 于 DHR_64/DHR_70 测试 | 5 |
| 允许路径 | DevPlan 标记与 `git diff --name-only` | 8 项允许、6 条实际 |
| `drivers`/`actors` 清理 | `drivers.delete`、`actors.delete`、`clear` | 9 |
| 异步收口 | `await *.done` | 5 |
| 命名组织 | `evict`、`detach`、`stopDriver` 等清理函数 | 4 |

## 五个冻结比对对象（逐个）

### 1. 提交路由「当前持 lease 的 actor」

- 并排定义：
  - 首轮路由遍历 `drivers`；仅遇到精确 `E_LEASE_HELD:actor-closed` 时摘除旧 driver/actor，再进入 durable 重建循环（`service.mjs:469-500`）。
  - durable 路径从持久化 Receipt/状态识别目标 Run，调用 `ensureActor` 重新取 lease，再 `driveRun` 并重建 gate（`service.mjs:487-499`）。
  - `commitReceipt` 的 start/resume 均先 `ensureActor`，stop 仅使用当前 live actor，并在提交 Receipt 后停 driver、停 actor（`service.mjs:650-703`）。
  - `stopDriver` 先从 map 摘 driver，再等待其收口（`service.mjs:507-512`）。
- 定义是否一致：是。
- 裁决（一致 / 有意差异 / 遗漏）：一致。
- 依据：所有写入路径都经本届 actor；DHR_70 只把已关闭 actor 对应的陈旧 route 移除，未直接写 Store，也不把提交固定到写 Receipt 的旧进程。

### 2. `actor-closed` / `lease-lost` 的拒绝语义

- 并排定义：
  - `refuseIfClosed` 产生 `E_LEASE_HELD:actor-closed`，稳定 reason 为 `E_LEASE_HELD`（`host.mjs:157-161`）。
  - Store `writeGuard` 在 lease 不再属于当前 actor 时产生 `E_LEASE_HELD:lease-lost`（`host.mjs:62-64`）。
  - service 的 `withReason` 只提取 reason 前缀；DHR_70 在路由处分辨完整 message，且只捕获 `actor-closed`（`service.mjs:70-74, 474`）。
- 定义是否一致：是。
- 裁决（一致 / 有意差异 / 遗漏）：有意差异。
- 依据：两类错误共享协议 reason，却必须在 service 内区分“陈旧 route 可重建”和“写入 fence 必须拒绝”。当前 `service.mjs:448-459` 已说明该边界；应将此 discriminator 补入 `design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md` 的 Gate 生命周期说明，避免后续将其泛化为吞掉全部 `E_LEASE_HELD`。

### 3. gate 注册与本届 driver 生命周期

- 并排定义：
  - 新 Attempt 创建时直接加入 gate（`workflow-driver.mjs:239-240`）。
  - 恢复既有 Attempt 时直接加入 gate（`workflow-driver.mjs:527-528`）。
  - service bootstrap 恢复后显式注册（`service.mjs:415-419`）。
  - DHR_70 durable 重建后显式注册（`service.mjs:496-499`）。
  - start/resume 的 `commitReceipt` 后启动 `driveRun`，由 driver 创建 Attempt 后加入 gate（`service.mjs:654-656, 701-703`）。
- 定义是否一致：是。
- 裁决（一致 / 有意差异 / 遗漏）：一致。
- 依据：gate 的归属是 Receipt/Attempt，不等同于旧 actor；旧 actor 关闭时，DHR_70 删除陈旧 driver 后按 durable Receipt 事实向新 driver 重建同一 gate。

### 4. 「恰一条 Result」与幂等

- 并排定义：
  - DHR_64 覆盖 Store 同 digest 重投、RPC 重投和 service 重启后的终态重投幂等（`dhr64-result-bridge.test.mjs:108,289,319`）。
  - DHR_70 的 A1、A2 均断言第二次提交 `idempotent:true`，且 `results/` 仍只有一条（`dhr70-submission-gate.test.mjs:182-186,243-247`）。
- 定义是否一致：是。
- 裁决（一致 / 有意差异 / 遗漏）：一致。
- 依据：DHR_70 只改变到达 Store 的合法 actor/gate 路由；唯一 Result 与 digest 幂等仍由既有 Store Result bridge 保证。

### 5. 允许路径 vs 实际 diff

- 并排定义：
  - DevPlan 允许 `service.mjs`、相关可选 runtime/test 文件、`package.json` 与 `workspace/DHR_70/**`（DevPlan:406-414）。
  - 实际 diff 共六条：三个 DHR_70 工作区文档、`service.mjs`、新增 DHR_70 测试、`package.json`。
- 定义是否一致：是。
- 裁决（一致 / 有意差异 / 遗漏）：一致。
- 依据：实际路径均为允许集合子集；`git diff --check 35ff2db..b6a3b47` 无输出。

## 自选维度的比对结果

- Map 清理：`ensureActor`、`driveRun` 与新 `evictClosedActor` 都在可能存在换届时使用 `map.get(runId) === 实例` 守卫。`stopDriver` 是同一 service 控制流中读取后立即删除，语义不同且无冲突。
- 同类错误：仓内已有 `host.mjs:isLostLease` 的完整 message 精确匹配；本卡的精确匹配与其一致。其余 `E_LEASE_HELD` 不携带足以区分 `actor-closed` 的结构化字段，因此不宜仅按 `error.reason` 判定。
- 异步生命周期：actor 的 `done` 无论成功或失败均兑现为结果对象（`host.mjs:143-155`）。`evictClosedActor` 等待该 Promise，再以 identity guard 删除；与 stop 路径等待 `actor.done` 的顺序一致。
- 命名与组织：`evictClosedActor` 为局部、动词加资源名，和 `detach`、`stopDriver`、`stopLiveWorkers` 一致；没有引入跨模块单用途抽象。

## 不一致逐条裁决汇总

| 编号 | 不一致点 | 有意差异 or 遗漏 | 理由 | 建议落到哪 |
|---|---|---|---|---|
| 1 | `actor-closed` 以完整 message 精确匹配，而常规 reason 映射只保留 `E_LEASE_HELD` | 有意差异 | 必须只重建陈旧 actor route，不能吞掉 `lease-lost` fencing | `design/12` Gate 生命周期；现有 `service.mjs:448-459` 注释可保留 |
| 2 | gate 可长于创建它的 actor | 有意差异 | 晚交仍必须经过 Receipt gate；DHR_70 通过摘旧 driver、按 durable Receipt 重建而消除死 route | `design/12` Gate 生命周期；现有 `service.mjs:448-459` 注释可保留 |

静态一致性复核结论：无遗漏发现；不代替测试执行或主控验收裁决。

Codex session ID: 01a05c36-34a6-7d13-bd76-4d7d85999e31
Resume in Codex: codex resume 01a05c36-34a6-7d13-bd76-4d7d85999e31
