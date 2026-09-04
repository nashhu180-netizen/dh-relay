<!-- dh:v1 · remediation-brief-r1 — DHR_74 第一轮整改派单（施工 Node，不是复核）。主控写；整改者按此执行并只写允许路径。 -->
# remediation-brief · DHR_74 · 整改轮 1

## 你是谁 / 不是谁

你是**整改施工 worker**，不是主控、不是复核者。
- 只做本派单列出的整改项；范围外的新想法记 `findings.md`，**不顺手做**。
- 不改 DevPlan 任务表状态列、不进入复核、不 push、不合并。
- 收口写 `remediation1.DONE`（status: done / blocked），**不复用** `construction.DONE`。
- 先读仓根 `AGENTS.md`「编排协议段 → 施工 worker」。

## 背景

DHR_74（BL-17 停顿诊断与修复）施工已收口，三路 fresh 只读复核（代码轮 1 / 需求方向 / 教训）共出 17 条发现，主控裁决**15 条采纳、0 条驳回**（P0=0 / P1=9 / P2=6）。裁决与整改清单在 `workspace/DHR_74/review.md`，复核原文在 `review-{code1,req,lessons}-codex.md`。

**技术结论不推翻**——探针、追猎、LOOP-LAG 取证、优先级对照都站得住，升级条款也守住了（零 `store/**`、`runtime/**`、`contracts/**` 改动、零断言改动，三路独立确认）。要改的是**结论强度、账目准确性、教训质量**。

## 已由主控完成、你不要重做

- **整改 A 的口径侧**：DevPlan §3.2 DHR_74 允许路径的时间参数授权已按用户 2026-09-03 确认修订（master `2b5810a`）——新口径 = 「`herdrPollMs` 统一抬到 **20ms 绝对值**（倍率各文件不同是正常的）；配对超时**只在语义是「等满 N 次 poll」时**同比例放大，是墙钟上限时（dhr69 的 `60_000`）保持不变；依赖 poll 推导的注释与预算常量必须随之更新」。
- **机器证 C 基线口径**已补：合格三轮必须在**本卡自己的基线**上取得，`22dc16c` 组合分支上的 6 轮降级为过程证据。
- DHR_71 在飞工件已落盘（`wt/DHR_71@b7f894f`），其 DONE 恢复 `status: blocked` 的事实为准。

## 整改项（逐条做，逐条在 progress 留痕）

### R1-A · 自述与注释对齐新口径

1. `relay-core/test/herdr-adapter.test.mjs:568-575`：`BLOCKED_FIVE_POLLS_BUDGET_MS` 的推导注释仍按旧 `herdrPollMs=2` 写（`5 × (2 + 10_000) × 1.5 = 75_015`）。按夹具实际值 20 更新注释与常量（同式新值 `5 × (10_000 + 20) × 1.5 = 75_150`）。**只改这一处注释 + 常量，断言一字不动**。
2. `workspace/DHR_74/brief.md`「变更范围」补同步 DevPlan 后补 + 修订后的时间参数授权（现文仍停在「临时目录根、清理顺序、import 探针」，与实际施工不符 = F-74-REQ-04）。
3. 把 `progress.md` / `findings.md` / `construction.DONE` 里所有「**12 行 ×10 等比缩放**」类自述改为事实描述：**poll 统一抬到 20ms（原值 2 或 5，倍率不一）；配对超时按语义处理（poll 数语义的同比例放大，墙钟上限的保持不变）**。

### R1-B · 措辞降级到证据边界

对 `construction.DONE` / `progress.md` / `findings.md` 逐句改：

| 现文 | 改成 |
|---|---|
| 机器证 A **达成** | **未达成「精确 op」，按兜底条款登记**：交付 = 函数级落点（`workflow-driver.mjs:319-326` 启动期 Attention 写入不完成）+ 机制候选（LOOP-LAG）+ 复现率数据；**未捕获停住的精确 op** |
| 「四个替代解释**全部排除**」 | 「**已排除**调度优先级单因子（High 对照 2/6 仍红）；**未观测**：actor/Store 写队列入出队与深度、`FileHandle` 写/同步/关闭阶段、18–19s 采样间隔以下的短时 CPU 争用」 |
| 机器证 B **达成（部分）** | 「**放大侧**红→绿对照成立（fs 写 56,775→17,650）；**停顿侧无对照**——修后 E-7404 仍 11 红含停顿红」 |
| 「**DHR_71 门禁阻塞解除**」 | 「在 `22dc16c` 组合分支上取得 6 连绿（过程证据）；**独立基线复验未做，阻塞是否解除待定**」 |
| 「fs 全程健康」 | 「**已覆盖的 fs 路径**未见慢调用（`open()` 已计时，其返回的 `FileHandle.writeFile/sync/close` **未覆盖**；CJS `require('fs')` 不经 hook）」 |
| 「函数级已钉死」 | 保留「函数级落点已定位」，删掉任何暗示机制已确证的措辞；内核级仍为**未钉死**并移交 |

另补一份**需求境人验项**（F-74-REQ-05）写进 `progress.md` 末尾：在哪个基线、跑哪条冻结命令、预期什么结果、哪些口径**仍未达成**、请用户确认什么。

### R1-C · 证据账目改正

1. `progress.md` E-7408 账本行仍是「（跑完后填）」→ 填实（六轮结果 + 落点，并标注这六轮按新基线口径为**过程证据**）。
2. `progress.md` 里「全机 CPU 采样**每 2s**」是事实错误——原始 `evidence/stalk2-cpu-sampler.log` 相邻采样为 **18–19s**（02:51:05 → 02:51:24 → 02:51:42）。改正，并把由它推出的「排除 CPU 争用」结论按 R1-B 降级。
3. 「EPERM / stall 签名扫描 0 命中」目前只有转述。补出**可复核的扫描命令与签名定义**（例如对六份 `.txt` / `.junit.xml` 跑的具体 grep 模式），把命令与输出落进 `evidence/`。

### R1-E · 探针 README 补盲区

`relay-core/test/helpers/fs-probe.README.md` 增一节「覆盖边界（不能用它下什么结论）」：
- 只包 ESM `node:fs/promises` 的具名 op；`FileHandle` 实例方法（`writeFile` / `sync` / `close`）未包；
- CJS `require('fs')` 与同步 API 不经 loader hook；
- **不观测** actor `submitControl` 队列与 Store 写队列的入队/出队/深度——「fs 无慢 op」**不能**推出「写队列没卡」；
- `LOOP-LAG` 只证明 timer 未按期获调度，不能区分同步 JS / GC / OS 调度 / 探针自身 I/O。

### R1-F · 教训整改（按教训复核结论）

`lesson_candidates.md` 重写：
1. **候选 2 撤回**（声称「配对超时必须同倍率缩」，与本卡实践相反 = 会误导后人）。改写为：先逐 options 列出「poll 频率 / 超时窗口 / 状态列表长度 / 期望 poll 次数」，再判每个超时是 poll 数语义还是墙钟语义，只缩前者。
2. **候选 1 改写**：保留「机器空闲 ≠ 进程在前进」的取证价值，但结论收窄为「LOOP-LAG 只能证明 timer 未获调度；fs / CPU / 队列必须各自按**覆盖面**出结论」，并记下阈值（1s/5s/15s、drift>400ms）、探针覆盖面与反例边界。关联既有候选-31 / -48 / -62。
3. **候选 3 改写**：保留放大机制（1-5ms 轮询 × 每 poll 心跳落盘 × 每 event 全量 replay = 单文件 2.8 万事件），删掉「治本位置在 DHR_72 / Store」这种越权处方，改为「治本候选，需各自立卡验证」。
4. **新增**「复现粒度必须匹配目标负载」：单文件 10/10 绿、回到五文件全量第 1 轮即现形——粒度选错等于没复现。
5. **新增**「判定脚本自身的单位解析错误会把绿误标成红」：本卡系列脚本 ms/s 解析 bug 实录；判定脚本必须先用已知样本自证。
6. 补 **F-7402 最小复现包**（LES-06）：代码锚点、完整命令、负载条件、命中签名、阈值、覆盖盲区、`.VOID-*` 作废重跑规则。

## 允许路径（严格）

- `relay-core/test/helpers/fs-probe.README.md`
- `relay-core/test/herdr-adapter.test.mjs` —— **仅** R1-A.1 那一处注释与常量
- `docs/modules/dh-relay/workspace/DHR_74/**`
- `docs/modules/dh-relay/backlog.md` —— 仅 `DHR-BL-17` 进度补录

**禁改**：`relay-core/store/**`、`runtime/**`、`contracts/**`、`package.json`、`fake-herdr.mjs`、任何断言与用例语义、DevPlan（状态列由主控处理）、`workspace/DHR_71/**`。

## 纪律

- 不得为了让措辞好看而**加强**任何结论；本轮只允许把结论**降级到证据边界**。
- 不新增任何「跑测试」的主张——本轮不跑门禁（重跑由主控按新基线口径安排）。
- 密钥 / 凭据值、原始 Receipt ID 零出现。
- 收口前自查：`git diff --name-only` 逐条对允许路径；`git diff -U0` 逐 hunk 确认零断言改动。

## 收口

写 `workspace/DHR_74/remediation1.DONE`：status、逐项（R1-A~F）做了什么 / 落在哪、未做项与原因、`git diff --stat`、自查结论。
