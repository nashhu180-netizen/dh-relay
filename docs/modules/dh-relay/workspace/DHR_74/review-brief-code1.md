<!-- dh:v1 · review-brief — DHR_74 代码复核轮 1 派单。主控写，复核者只读。 -->
# review-brief · DHR_74 · 代码复核轮 1

## 你是谁 / 不是谁

你是**复核 worker**，不是主控。只读、不改任何文件（你跑在 codex `--sandbox read-only` 里，写操作会被 OS 沙盒拒绝——设计如此，别绕）。
不要再派活、不要起子任务、不要回头问用户。只做本轮复核，产出一份结论文本回给主控。

先读仓根 `AGENTS.md`「编排协议段 → 复核 worker」再动手。

## 你要审什么

**基线**：cwd 已是 worktree `wt/DHR_74`，HEAD = `49196f8`。复核范围三段：

1. `git diff 4742b97..12b4654` —— 探针三件套 + README + 基线/探针证据 + progress
2. `git show b9619c3` —— **夹具时间参数 ×10 共缩（5 文件 12 行）** + 探针补丁 + 追猎证据
3. `git show 22dc16c` —— 合并 `wt/DHR_71` 的**冲突解决选择**（施工方称「相邻行交叠、DHR_71 的 finally 结构 + S1 skip 原样保留、只把数值换成 DHR_74 的轮询参数」）
4. `git show 49196f8` —— 收口工件（progress 机器证 C 小节、findings、construction.DONE）

**代码面实质只有两类**：`relay-core/test/helpers/fs-probe-{shim,hooks,register}.mjs`（新增诊断探针，仅经 `NODE_OPTIONS=--import` 注入）与五个 `*.test.mjs` 里的 12 行时间参数。**没有生产代码改动**——你要判断「没改对不对」，以及「测试侧这么改会不会把真问题盖住」。

**必读上下文**（都在 cwd 内）：

| 读什么 | 为什么 |
|---|---|
| `docs/modules/dh-relay/workspace/DHR_74/brief.md` | 机器证 A/B/C 口径、允许路径、升级条款（触及 Store 写路径语义即停手） |
| `docs/modules/dh-relay/workspace/DHR_74/progress.md` | 证据账本 E-7401~E-7408 + 机器证 C 六轮表 |
| `docs/modules/dh-relay/workspace/DHR_74/findings.md` | F-7401（放大，resolved 部分）/ F-7402（停顿，函数级闭合、内核级移交） |
| `docs/modules/dh-relay/workspace/DHR_74/construction.DONE` | 施工方的自我结论——你要核它站不站得住 |
| `dev_plan/P6-Herdr多账号执行底座-开发方案.md` §3.2 `DHR_74` | **唯一权威口径**：`dh:allowed-paths:v1 task=DHR_74` 里对「时间参数」的逐字限定 |
| `relay-core/runtime/workflow-driver.mjs`（只读） | `:319-326` 启动期 Attention、`:394-398` 逐 poll 心跳——本卡**没改**它们，判断该不该改 |
| `relay-core/store/store.mjs`（只读） | `:426-428` 每 event 全量 replay 持久化——升级条款的对象 |

## 逐条要你给结论的点

按 P0/P1/P2/P3 定级，每条说清**在哪一行、什么输入下会怎样错**。没问题也要明说「看过、没发现」，别空过。

1. **「×10 等比共缩」的自我描述与实际改动是否一致（最高优先级）**。DevPlan 允许路径写死：时间参数 = `herdrPollMs` 与**同一 driver options 里配对的** `doneTimeoutMs` / `observationLostMs` **按同一倍率（×10）**调整。请逐行核这 12 行：
   - `agent-node.test.mjs:222/254` 是 `5 → 20`（×4，不是 ×10），且这两处**没有配对的超时参数**——这算不算超出「×10 共缩」的授权文字？倍率不一致会不会改变任何时序语义？
   - `dhr69-false-ready.test.mjs:55/104` 是 `2 → 20`（×10），但同一 options 里的 `observationLostMs: 60_000` / `doneTimeoutMs: 60_000` **原地不动**——按逐字口径，配对参数没有同倍率缩。请判断：这是「授权文字被违反」，还是「60s 相对 poll 已足够宽、语义不变」？给出具体的失效场景或明确排除。
   - `herdr-adapter.test.mjs` 五处、`dhr64`、`dhr70` 各处的倍率与配对关系是否自洽（尤其 `:273` 只改 `observationLostMs: 100→1000` 而 poll 由夹具默认给出）。
2. **改后每个用例经历的 poll 次数是否变了**。列表型 fake 按 poll 次数推进状态（施工方的机械前提）。请独立验证这个前提：去 `relay-core/test/helpers/fake-herdr.mjs`（**本卡未改**）确认 statuses 消费确实按调用次数而非墙钟；然后逐个用例判断「固定墙钟窗口 ÷ 放大 10 倍的 poll 间隔 = poll 次数变少」的地方有没有改变断言成立的路径——特别是依赖「第 N 次 poll 才出现某状态」的用例，和 `untilAsync(..., 1_000, ...)` 这类**没跟着缩放的等待预算**。
3. **绿是不是靠时序遮住的**。核心质疑：把轮询放慢 10 倍让门禁 6 连绿，究竟是「消除了放大→减少了 fs/事件压力」，还是「把偶发停顿的命中窗口缩小到看不见」？施工方自己承认 F-7402 的事件循环冻结**未被消除**（只是 6 轮没复现）。请判断 `construction.DONE` 里「**DHR_71 门禁阻塞解除**」这句措辞，在现有证据下是否越界（对照 brief 纪律：未复现 ≠ 已修复）。
4. **断言零改动是不是真的**。用 `git diff 4742b97..49196f8 -- relay-core/test/` 逐 hunk 核：有没有任何 `assert.*` 行、用例名、`skip` 标记、`t.after` 结构被动过（S1~S4 四条 skip 用例是 DHR_72 的债，一字不许动）。合并提交 `22dc16c` 的冲突解决尤其要核——冲突处最容易悄悄丢掉 DHR_71 的改动。
5. **探针的一键卸载与零污染**。`fs-probe-hooks.mjs` 用 loader hook 把 `node:fs/promises` 整体重定向到 shim：
   - 不设 `NODE_OPTIONS` 时是否**完全不参与**常规 `node --test`（核 `relay-core/package.json` 的 test script glob 会不会把 helpers 拉进去；核有没有任何 test 文件 import 了探针）；
   - `fs-probe-shim.mjs` 结尾 `export * from 'node:fs/promises'` 与上方 16 个具名导出并存——ESM 语义下本地具名导出是否**确实**遮蔽 `export *` 的同名项（如果不是，被包装的 op 就没生效，探针证据全部作废）；
   - shim 只覆盖 ESM import，CJS `require('fs')` / `fs` 同步 API 不经过 hook（README 自承的缺口）：这会不会让「fs 全程健康、零 SLOW」这个**排除性结论**站不住？`store.mjs` / `workflow-driver.mjs` 实际用的是哪套 fs API，请去核；
   - `describeArgs` 取第一个可 `toString` 的参数当 path，`timed()` 对返回 `FileHandle` 的 `open` 也只计时不跟踪句柄——有没有把「慢在句柄使用阶段」误报成「fs 健康」。
6. **LOOP-LAG 判据的可信度**。`fs-probe-register.mjs` 用 500ms interval 的实际漂移 >400ms 判事件循环滞后。请判断：这个判据会不会被**探针自身**（每 500ms 遍历 pending、字符串拼接、stderr 同步写）或 GC 放大？「drift≈2.9s×N」是否足以支撑 findings 里「进程被整段饿死」的强结论，还是只能支撑「主线程在这几秒没有回到 timer 阶段」？两者对 F-7402 的归因差别很大。
7. **F-7402 排除法是否闭合**。施工方声称排除了「CPU 争用 / fs 慢 / 写队列卡死 / 调度优先级」四个替代解释。逐条核证据够不够：写队列卡死是**怎么**排除的（有没有直接观测 Store 写队列深度，还是仅由「fs 无慢 op」间接推出）？CPU 采样是全机 2s 粒度，能不能排除 2s 以内的瞬时争用？请指出任一未闭合的推理跳跃。
8. **有效单测要求（normal 配方）**。本卡零新增用例、零断言改动，全部「测试」都是同一批既有用例的重跑。请给出结论：本卡的 normal「有效单测」要求应判为**满足**（机器证 C 的 6 轮门禁即有效验证）、**不适用**（诊断卡无新语义可测）、还是**未满足**（例如 ×10 缩放这条修复本身缺一个能防回归的机械检查，比如「参数与倍率一致性」的守卫）？给理由。
9. **越界**：`git diff --name-only 4742b97..49196f8` 逐条对 DevPlan `dh:allowed-paths:v1 task=DHR_74` 比。特别核有没有碰 `store/**`、`runtime/**`、`contracts/**`、`package.json`、`fake-herdr.mjs`。
10. **证据账本自洽**。E-7408 那行仍写着「（跑完后填）」而下方机器证 C 小节已是六轮完整表；progress 自承系列脚本 verdict 曾因 ms/s 解析 bug 误标 RED。请核：`evidence/gate-round{1..6}-*.txt` / `.junit.xml` 的原始数字是否**真的**支撑「55/51/4/0、≤370s」；六轮的 skip 是否**同一批** S1~S4（按完整用例名核，不看计数）。

## 硬边界

- **只读**。跑不了测试就如实申报「仅静态审」，不许假装跑过（只读沙盒里 `mkdtemp` 会被拒，测试由主控跑）。只读命令（`git diff/show/log`、`grep`、读文件）随便用。
- 只写事实与级别，**不替主控做验收裁决**（不要写 approved/rejected）。
- 范围外的新想法写在结论末尾「范围外观察」，不要求本卡改。
- 密钥 / 凭据值、原始 Receipt ID 永不出现在你的结论里。

## 产出格式

完整结论输出到 stdout（主控捕获并落盘为 `review-code1-codex.md`）。结构：

```
## 形态自述
（模型、sandbox 模式、是否跑过测试）

## 发现
### F-74-R1-01 (P?) 标题
- 位置：path:line
- 事实：
- 失效场景：什么输入 → 什么错误结果
- 依据：

## 逐点结论（上面 10 点逐条，无发现也要写"看过、没发现"）

## 范围外观察
```
