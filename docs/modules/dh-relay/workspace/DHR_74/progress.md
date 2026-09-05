<!-- progress.md — DHR_74 施工日志 + 证据账本。construction.DONE 在施工 Node 收口时才写，不预置占位。 -->
# progress — DHR_74

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-03 | 主会话 | 立项：用户对话确认按标准档为 DHR-BL-17 立 DHR_74 专卡（范围=诊断并修复 Store 持久化/测试临时目录争用，修后重跑 DHR_71 门禁）。主控侦察写链（actor 队列 → Store 写队列 → `writeAtomic`）与 DHR_72/73 归属冻结，落 backlog 补录 + DevPlan §3.1/§3.2/卡规格 + 本工作区；开树 `wt/DHR_74` | backlog DHR-BL-17、DevPlan §3.2 DHR_74 | 步骤 1 基线 |
| 2026-09-03 | 主会话 | **派工偏差登记**：本会话 `HERDR_ENV` 为空（不在 Herdr pane），按 `knowledge/herdr-派活操作.md` 前置检查不得从外部调度 herdr——施工由主会话按 brief 边界亲自执行，复核仍 fresh 换人另派；已在 DevPlan 状态行同步登记 | DevPlan §3.1 状态行 | 步骤 1 |
| 2026-09-03 17:07Z | worker | **口径校正**：本 worktree 基于 master@6050276（**不含 DHR_71 未合入的改动**），故本卡基线里 DHR_69/A 的等待预算是 master 原生 45s 文件级 `until`，失败时长 45.1s 与 DHR_71 门禁里的 90s 有界形态是**同一停顿现象的两种包装**；机器证 C 的门禁重跑须等本卡合入、`wt/DHR_71` rebase 之后在 DHR_71 分支执行 | 本行 | 步骤 1 |
| 2026-09-03 17:10Z | worker | 步骤 1 基线（改代码前）：负载快照 cpu=2%、node 进程 22、codex/claude/chrome/herdr 常驻 43（**CPU 空载但高并发常驻**）；dhr69 单跑 5 轮，**2/5 红**（round 3/5），红 = DHR_69/A 等满 45.1s，同族停顿复现协议成立；红轮 cpu_after 分别 6% / 59%，5 轮内无单调 CPU 相关 | E-7401 | 步骤 2 探针 |
| 2026-09-03 17:25Z | worker | 步骤 2 探针落盘 + 自证：loader-hook 三件套（`fs-probe-{shim,hooks,register}.mjs`）+ README；自证 ACTIVE/拦截计数（writeFile:1,rename:1,unlink:1）/UUID 脱敏（`~<sha256 前 12>`）全过；`node -e` 自证首轮因 `D:/` 裸路径未转 file:// 报 `ERR_UNSUPPORTED_ESM_URL_SCHEME`，改相对路径后通过——失败首试的输出未入证据（无证据价值） | E-7402 | 步骤 3 复现系列 |
| 2026-09-03 17:33Z | worker | 步骤 3a：dhr69 单跑 ×10（带探针）**10/10 绿、零 SLOW**——单文件空载复现不出；修正复现策略：停顿历来在全量门禁现形（E-7117），改跑五文件全量 | E-7403a | 全量复现 |
| 2026-09-03 17:44Z | worker | 步骤 3b：五文件全量 ×1（带探针）**第 1 轮即捕获放大现场**：herdr-adapter 子进程 `EXIT-SUMMARY calls={writeFile:56775,mkdir:28438,rename:28404,appendFile:28377,…} slow=6 max=3277ms` ≈ 2.8 万事件；失败 8 红（5 已知语义 + 环境/预算红）。结合代码定位放大链：夹具 1-5ms `herdrPollMs` × fake 卡 `working` 时每 poll 写心跳（`workflow-driver.mjs:394-398`）× Store 每 event 全量 replay 持久化（`store.mjs:426`）→ **F-7401** | E-7403b | 步骤 4 决策树 |
| 2026-09-03 18:00Z | worker | 步骤 4 落决策：① fs 停于 `writeAtomic` 不成立（探针未见）；② 收尾竞态不成立（dhr69 夹具本就 stop→rm）；④ 放大 = 真根因之一 → **测试侧调整为 poll 统一 20ms（原值 2 或 5，倍率不一），配对超时按语义处理**（DevPlan 后补授权）；Store 批量持久化 = 语义面，登记升级候选；driver 心跳节流 = DHR_72 归属，移交登记 | DevPlan DHR_74、findings F-7401 | 步骤 5 |
| 2026-09-03 18:19Z | worker | 步骤 5 实施 + 验证：poll 统一抬到 20ms（原值 2 或 5，倍率不一；配对超时按 poll 数语义处理，墙钟上限保持不变；断言零改动）；修后全量 ×1：herdr-adapter 事件 28,404→**8,841**（3.2×，未满 10×——两个 42s/72s 长等用例是时间驱动等待）；该轮 699s、11 红含 DHR_69/A 与 DHR_68/C 停顿红——**放大侧对照成立，但该改动对绿闸的必要性未证** | E-7404 | 停顿归因 |
| 2026-09-03 18:46Z | worker | **停顿归因（F-7402）**：探针加 `LOOP-LAG` 后 dhr69 追猎 15 轮抓到 3 轮停顿，均见 `drift≈2.8-3.2s × 6+`、已覆盖 fs 路径零慢操作（max ≤117ms）、零 EXIT-PENDING；这证明 timer 未按期获调度，**未捕获停住的精确 op**。全机 CPU 采样实际相邻间隔约 18–19s，不能排除其间短时争用。High 优先级对照 6 轮仍 2/6 红，已排除调度优先级单因子；actor/Store 写队列与 FileHandle 方法未观测 | E-7405/06/07 | 机器证 C |
| 2026-09-03 19:0xZ | worker | 合入 `wt/DHR_71`（`22dc16c`）后按冻结命令跑门禁系列（最多 6 轮，连续 3 绿即停）；本行记录为过程证据，独立基线结果由 DHR_71 E-7119 提供 | E-7408 | 机器证 C |
| 2026-09-03 20:05Z | worker | **过程证据**：组合分支冻结命令连续 **6 轮** `tests=55 / pass=51 / skip=4 / fail=0 / exit=0`，时长全部 ≤370s；但 DHR_71 独立基线 `wt/DHR_71@b7f894f` 已按同一命令连续 3 轮 `51 pass / 4 skip / 0 fail / 285–289s` 达标，故本卡时间参数改动对绿闸的必要性未证，阻塞是否解除不由本卡判定 | E-7408 / E-7119 | 收口 |
| 2026-09-03 晚 | 主控 + worker | 轮 2 三路窄复核（omp/deepseek-v4-flash，fresh 只读，自报 HEAD `0a24cb4`）结论落盘并裁决登记：**三路均无 P0/P1，可进收口**；处置随记——机械守卫遗留移交 DHR_72/轻量卡、基线引用统一 `b7f894f`、BL-17 范围外观察备注、lessons 两条采纳整改；REQB-01~05 等五项处置标「待主控确认」 | `review.md` 轮 2 节；`review-{code1-reverify,req-recheck,lessons-reverify}-omp.md` | 收口段 E6~E10 |
| 2026-09-03 | worker | **[工具链] 登记补漏**（轮 2 教训路漏记③）：整改轮 1 worker 运行中由 `gpt-5.6-terra` high 降档为 `gpt-5.6-luna` medium（codex 额度限流）；产出经主控逐 hunk 核过、本轮质量尚可，按候选-52 纪律登记在案；候选-40 补「运行中形态变更同样取证」一句属共享教训库存量条目，待主控确认 | 主控交接 20260903「坑与纪律」；review.md 轮 2 表漏记③行 | — |
| 2026-09-03 | worker | **E6 教训回流**：本卡 7 条候选按轮 2 判重结论（5 新增 + 1 附属包 + 1 新增）落库 `knowledge/教训库-候选.md` **候选-75~81**——从 75 起编，避开 master 上 DHR_71 已占的 69~74，防 squash 撞号（squash 时该文件两侧同为尾部追加，预计一处文本冲突，按号并留即可）；LESB-01/02/03 三处事实缺陷在落库条目按复核建议修正并标注，本卡 `lesson_candidates.md` 原文不动 | `knowledge/教训库-候选.md` 候选-75~81；review.md 轮 2 表 | E7/E9/E10 |
| 2026-09-03 | worker | **E9/E10 足迹**：七段收口汇报 + 证据展示区已按规程随收工汇报输出（对话产物不落盘，底表=本文件与 review/findings）；E10 人验项按 **E-7409 own-baseline 口径**出具（REQB-04 指出的基线句修正待主控确认）；四条诚实结论原样带入 E7 判定与 E9 汇报 | 收工汇报（worker stdout）；本文件 E7 节 | 待主控/用户 |

## 机器证 C · 门禁重跑（E-7408，合并分支 `wt/DHR_74@22dc16c`）

- 命令（冻结，cwd=`relay-core/`，无探针、无包装）：`node --test --test-concurrency=1 --test-timeout=300000 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination=<evidence>/gate-round<N>-<ts>.junit.xml test/herdr-adapter.test.mjs test/agent-node.test.mjs test/dhr64-driver-observation.test.mjs test/dhr69-false-ready.test.mjs test/dhr70-submission-gate.test.mjs`

| 轮 | exit | tests | pass | skip | fail | 时长 | 判定 |
|---|---|---|---|---|---|---|---|
| 1 | 0 | 55 | 51 | 4 | 0 | 280.0s | 合格 |
| 2 | 0 | 55 | 51 | 4 | 0 | 280.3s | 合格 |
| 3 | 0 | 55 | 51 | 4 | 0 | 280.0s | 合格 |
| 4 | 0 | 55 | 51 | 4 | 0 | 279.9s | 合格 |
| 5 | 0 | 55 | 51 | 4 | 0 | 280.0s | 合格 |
| 6 | 0 | 55 | 51 | 4 | 0 | 279.6s | 合格 |

- 判据逐条：组合分支 **skip 恰 4 / fail=0 / ≤370s / 签名 0 命中**；这些是过程证据。DHR_71 独立基线 E-7119 才是当前绿闸事实：三轮 `51 pass / 4 skip / 0 fail / 285–289s`。本卡时间参数改动的必要性未证。
- **条数说明**：本卡要求连续 3 轮，实际交付连续 6 轮（要求 3 连绿，交付 6 连绿；第 1 轮在系列脚本崩溃前已完成且合格，第 2~6 轮由修复解析的续跑脚本完成——两段使用同一冻结命令、同一机器状态）。
- 条件措辞（F-71-LES-02）：本结论仅在「该五文件冻结命令、`--test-concurrency=1`、本机（32GB/多核、常驻 herdr+多 CLI）2026-09-02 晚间负载」下成立；F-7402 的事件循环整段冻结为随机环境事件，内核级机制未钉死（见 findings），不排除未来轮次复现——复现时按 `.VOID-*` 作废留证重跑。

## 步骤 1 · 基线（master@6050276，改代码前）

- 负载快照（17:07Z 附近）：CPU **2%**；node 进程 **22**；codex/claude/chrome/herdr 常驻 **43**。→ 停顿相关候选是「高并发常驻 IO/句柄」而非 CPU 饱和。
- dhr69 单跑 5 轮（`--test-concurrency=1 --test-timeout=300000`，cwd=`relay-core/`，无探针）：

| 轮 | exit | 时长（相邻 ts 差） | cpu_after |
|---|---|---|---|
| 1 | 0 | ~40s | 80% |
| 2 | 0 | ~40s | 5% |
| 3 | **1** | ~40s | 6% |
| 4 | 0 | ~82s | 4% |
| 5 | **1** | ~41s | 59% |

- 红轮失败均为 `DHR_69/A driver：假就绪恰写一次 blocked Attention…`（45131ms / 45120ms = master 原生 45s 预算等满）——与 F-7109 同停点（`waiting_human` 迟迟不落账），仅预算包装不同。
- 复现率 2/5，与 DHR_71 门禁「凑不出连续三轮」的现场一致。

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 操作 | 退出码 / 结果 | 落点 |
|---|---|---|---|---|
| E-7401 | session-run | dhr69 单跑 ×5（无探针）；负载快照（CPU/进程数） | 0/0/1/0/1；复现率 2/5 | `evidence/baseline-dhr69-r{1..5}-20260902T17*.txt` |
| E-7402 | session-run | 探针自证：`NODE_OPTIONS="--import ./test/helpers/fs-probe-register.mjs" node --input-type=module -e …`（拦截 rename/writeFile/unlink + redactId） | ACTIVE + 拦截计数全过 + `receipt-~666ff6ccaa5b.json` | `evidence/probe-selftest-20260902T1725Z.txt` |
| E-7403a | session-run | 步骤 3a：dhr69 单跑 ×10（带探针） | 10/10 绿、零 SLOW | `evidence/probe-dhr69-r{1..10}-*.txt` |
| E-7403b | session-run | 步骤 3b：五文件全量 ×1（带探针） | 1 红（8 红：5 已知 + 3 环境）；**捕获 2.8 万事件放大现场** | `evidence/probe-gate-r1-20260902T173754Z.txt` + `.junit.xml` |
| E-7404 | session-run | 修后（poll 统一 20ms；配对超时按语义处理）五文件全量 ×1（带探针） | exit=1；herdr-adapter 事件 28,404→8,841；699s、11 红；停顿侧无红→绿对照 | `evidence/postfix-gate-r1-20260902T181905Z.txt` + `.junit.xml` |
| E-7405 | session-run | dhr69 单跑 ×15（带 LOOP-LAG 探针） | 3/15 红（r9/r12/r15）；**三轮全部 LOOP-LAG≈2.9s×N + fs 零慢** | `evidence/stalk-dhr69-r{1..15}-*.txt` |
| E-7406 | session-run | dhr69 单跑 ×8（LOOP-LAG 探针 + 全机 CPU 采样；相邻采样约 18–19s） | 1/8 红；停顿窗口 cpu 27-76%（低至 1%）、无单进程吃核；短时争用未观测 | `evidence/stalk2-dhr69-r{1..8}-*.txt` + `stalk2-cpu-sampler.log` |
| E-7407 | session-run | dhr69 单跑 ×6（PriorityClass=High 对照） | 2/6 红——排除优先级单因子 | `evidence/hprio-dhr69-r{1..6}-*.txt`（+`.err`） |
| E-7408 | session-run | 合并 `wt/DHR_71`（`22dc16c`）后按冻结命令跑门禁系列 | 6 轮 `51 pass / 4 skip / 0 fail`，279.6–280.3s；**组合分支过程证据**，非独立基线验收 | `evidence/gate-round{1..6}-*.txt` + `.junit.xml` |
| E-7409 | session-run | 本卡 own-baseline（`master@84f2514` 起枝的 `wt/DHR_74`）冻结命令 ×3，无探针；详表见下方「机器证 C」节 | 三轮 exit=0；`55 tests / 51 pass / 4 skip / 0 fail`；284.2–285.5s；四类签名零命中 | `evidence/ownbase-gate-round{1,2,3}-*` + `ownbase-signature-scan-20260903.md` |

## 需求境人验项（F-74-REQ-05）

- 请在**本卡自身基线（own-baseline，E-7409）**——`master@84f2514` 起枝、只含本卡改动的 `wt/DHR_74`（收口 squash 后即 master 上的本卡合入提交）、cwd=`relay-core/`，按冻结命令 `node --test --test-concurrency=1 --test-timeout=300000` 加载五个门禁文件，连续三轮核对预期 `51 pass / 4 skip / 0 fail`、每轮用例耗时 284.2–285.5s（判据 ≤370s）、四类签名零命中；原始证据见 `evidence/ownbase-gate-round{1,2,3}-*` 与 `evidence/ownbase-signature-scan-20260903.md`。
- DHR_71 独立基线（E-7119，`wt/DHR_71@b7f894f`，三轮 `51 pass / 4 skip / 0 fail`、285–289s）是**横比对照项**，已随 DHR_71 自行收口，不是本卡人验基线；组合分支 `22dc16c` 的六轮结果只作过程证据。本卡未证明时间参数改动是绿闸必要条件。机器证 A 未捕获停住的精确 op；机器证 B 仅放大侧红→绿对照成立；actor/Store 队列、FileHandle 方法与短时 CPU 争用仍未观测。
- 请用户确认：接受上述证据边界与“必要性未证”措辞，并决定是否继续另立卡验证未观测机制；本施工节点不代签人验或 verify。

## 机器证 C · 独立基线三轮（E-7409，2026-09-03，**主控执行**）

- **为什么重跑**：三路复核（F-74-REQ-03 / F-74-R1-02）指出原六轮跑在合入 `wt/DHR_71` 的组合分支 `22dc16c` 上，只能证明组合版本；用户 2026-09-03 点选确认合并序改为「DHR_71 先收口 → DHR_74 rebase 后重跑」，DevPlan 机器证 C 已据此补基线口径（master `2b5810a`）。
- **基线**：`wt/DHR_74`（从 master@84f2514 起新枝，只挑本卡 10 笔提交；**已丢弃合并提交 `22dc16c`**，旧形态留备份 ref `keep/dhr74-pre-rebase-260903`）。改动面 = 12 行时间参数 + 探针三件套 + README + backlog 一行，断言零改动（`git diff master..HEAD -- relay-core/ | grep '^[+-].*assert\.'` 空）。
- **命令**：与冻结命令逐字相同，**无探针、无 `NODE_OPTIONS` 注入**。
- **负载条件**：2026-09-03 白天，主控 session 在跑但三轮期间零并发 worker（复核与整改 pane 均已关闭）。

| 轮次 | exit | tests | pass | skip | fail | 用例耗时 | 墙钟 | 判定 |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `ownbase-gate-round1-20260903T105057Z` | 0 | 55 | 51 | 4 | 0 | 284.548s | 292s | 合格 |
| `ownbase-gate-round2-20260903T105601Z` | 0 | 55 | 51 | 4 | 0 | 284.225s | 292s | 合格 |
| `ownbase-gate-round3-20260903T110106Z` | 0 | 55 | 51 | 4 | 0 | 285.453s | 293s | 合格 |

- **判据逐条**：skip 恰 4 且三轮同一批（摘要一致，见扫描记录）✅；fail=0 ✅；每轮 ≤370s（最大 285.5s）✅；四类签名零命中 ✅。
- **横比（对本卡结论很关键）**：DHR_71 独立基线（**不含**本卡 12 行时间参数）三轮为 285–289s；本卡基线（含）为 284–285s——**墙钟差异 ≈1%**。放大侧指标确有改善（fs 写 56,775→17,650、事件 28,404→8,841），但**在绿闸达标与耗时上看不出必要性**。故本卡对机器证 B/C 的措辞维持整改后的口径：放大侧对照成立、**停顿侧无对照**、时间参数改动**必要性未证**。
- **落点**：`evidence/ownbase-gate-round{1,2,3}-*.txt|.junit.xml`、`evidence/ownbase-signature-scan-20260903.md`。

| ID | 类型 | 命令 / 操作 | 退出码 / 结果 | 落点 |
|---|---|---|---|---|
| E-7409 | session-run | 独立基线（master@84f2514 + 本卡 10 笔）冻结命令 ×3，无探针 | 三轮 exit=0；51 pass / 4 skip / 0 fail；284.2–285.5s | `evidence/ownbase-gate-round{1,2,3}-*` + `ownbase-signature-scan-20260903.md` |
| E-7241 | check | clean master `b956e04` 上 `dh dh-relay`；核对 DHR_72/DHR_74 双向 `mutation-transfer:v1` marker | pass：exit=0；DHR_74 R31 清零；全仓 0 failure | DHR_72 H 已正式承接本卡 R31 义务；具备补签 `verify(dh-relay): DHR_74` 的条件。 |
| E-7243 | verify | `a20cfc7` `verify(dh-relay): DHR_74 带风险放行` | pass：risk-accepted；Risk-Count=1；Risk-Refs=`RISK-DHR74-F7402`；chat-confirm | DHR_74 verify 已落账；F-7402 诚实边界保留并移交，不含 push、deploy 或下一卡。 |

## E7 · as-built 判定（2026-09-03，收口段）

- **判定：`as-built/` 五份快照（relay-contracts / relay-core / relay-runner / relay-psmux-host / relay-policy）均不需更新。**
- 理由：本卡 relay-core 改动面 = 五个门禁测试文件的时间参数/注释/预算常量行（断言零改动）+ `test/helpers/` 探针三件套与 README（仅 `NODE_OPTIONS=--import` 注入、常规运行零影响、可一键卸载）。不触及 relay-core 快照描述的任何生产 A→B 面（contracts/store/runtime/rpc/cli）、不新增或变更机器闸、不动 fixtures manifest。as-built 规程为「首份真实 A→B 触发再建，不空挖箱子」；同域先例：DHR_71 同为纯测试改动，收口亦未动 as-built（`git diff HEAD master -- as-built/` 为空可证）。
- F-7402 的环境级未知项（内核级未钉死）不进生产快照；其权威登记处 = findings F-7402 移交条款 + backlog DHR-BL-17 + 教训候选-75/80/81（E6 已回流）。
- **四条诚实结论（收口材料原文，原样携带，不许弱化、不许变强）**：
  1. 机器证 A 未捕获精确 op，只有函数级落点 + 机制候选 + 复现率数据。
  2. 机器证 B 只有放大侧红→绿对照，停顿侧无对照。
  3. 本卡时间参数改动对绿闸达标的必要性未证：DHR_71 独立基线不含它也三轮达标，差约 1%。
  4. F-7402 停顿机制内核级未钉死，移交环境侧 A/B 与 DHR_73。

## E6 / E7 / E9 / E10 收口登记

- **E6 miner 备料产出**：本仓 `dh` 只装 dh-check（无 `mine` 子命令），按 miner 规程人工抽候选——本卡 7 条候选经轮 2 判重后落库 `knowledge/教训库-候选.md` 候选-75~81（从 75 起编，避开 master 上 DHR_71 已占的 69~74）。
- **E7 as-built 收敛**：已完成——判定 `as-built/` 五份快照均无可收敛项，理由见上节。
- **E9 七段交付汇报**：已发出（2026-09-03 收工汇报，对话产物不落盘；底表＝本文件与 `review.md` / `findings.md`）。
- **E10 人验证据展示区**：已发出，口径＝E-7409 own-baseline 三轮（`51 pass / 4 skip / 0 fail`、284.2–285.5s、四类签名零命中），同时展示四条诚实结论与保留项 F-7402；REQB-04 修正后基线句与展示区口径已一致（2026-09-04）。

## 收口段待主控确认清单（2026-09-03）

> 以下各项派单未给处置、按「不确定不猜着补」原则挂起；逐项理由见 review.md 轮 2 裁决总表对应行。均不阻塞「收口材料就绪」。
>
> **用户裁决（2026-09-04）**：7 项中**只改 REQB-04**，其余 6 项（REQB-01 / REQB-02 / REQB-03 / REQB-05 / LESB-01-02-03 / 漏记③后半）**保持原样带入收口后处理**。四条诚实结论措辞不动。

### R31 阻塞项 · 移交 DHR_72（回签义务，2026-09-04 用户裁决「出口 1」）

- **阻塞事实**：master 合入后体检唯一失败＝`R31 任务「DHR_74」类型=normal 缺合法的「有效单测·变异点登记」表`。R31 要求变异锚点是**本卡 diff 内的非测试文件生产代码**且施加后结果为「断言失败」；本卡 diff 100% 是 `relay-core/test/**` 与 `test/helpers/**`，无生产代码可变异，且轮 1 F-74-R1-01 已实证「时间参数违规也全绿」——即便变异也只会得到「未变红」，同样不通过。故**不伪造变异点、不改状态绕闸**。
- **移交去处**：**DHR_72**，登记为其**机器证 H**（DevPlan §3.2 `DHR_72` 验收口径末条）。
- **回签义务与补签条件（三条全满足才补签）**：
  1. DHR_72 交付 poll（`herdrPollMs`）与其配对超时（`doneTimeoutMs` / `observationLostMs`）的**比例一致性机械守卫**并入库；
  2. 对该守卫**做一次变异**，得到**「断言失败」**，并登记进 DHR_72 的变异点表；
  3. master 上 `dh dh-relay` 的 **R31 对 DHR_74 清零**。
- **补签动作**：在 master 打 `verify(dh-relay): DHR_74 …`，回填本卡 review.md 人类签名区的 verify SHA 与 DevPlan DHR_74 状态格（待验收 → 已完成），然后才删 worktree `wt/DHR_74` 与分支。
- **在此之前的冻结状态**：DHR_74 状态＝**待验收**；工件已在 master（squash `14c0fef`）；worktree 与分支**保留不删**。

1. **REQB-01**：机器证 A 兜底条款缺两组负载条件的 A/B 指认与逐组复现率对照（数据已在账：E-7403a 0/10 vs E-7405 3/15）——复核者判补一行登记即可闭合。**用户决定：带入收口后处理（本卡不改）。**
2. **REQB-02**：是否对机器证 B 加一句「未达成验收口径」显式登记（现口径已含「只有放大侧红→绿对照，停顿侧无对照」）。**用户决定：带入收口后处理（本卡不改）。**
3. **REQB-03**：DevPlan §3.2「机器证 C 同时记入 DHR_71 证据账」补注「已由 E-7119 承担，E-7409 因 DHR_71 已收口不必回填」。**用户决定：带入收口后处理（本卡不改）。**
4. **REQB-04**：本卡「需求境人验项」基线句仍指 E-7119/DHR_71 基线（`b7f894f`、285–289s），未指本卡 E-7409 own-baseline（284–285s）——recheck 判为「本轮最大需求境残留」。**已处理（2026-09-04，用户授权）**：改动位置 = 本文件「需求境人验项（F-74-REQ-05）」段第 1 条（基线句改指 own-baseline E-7409：`master@84f2514` 起枝的 `wt/DHR_74`、预期 284.2–285.5s、证据 `evidence/ownbase-gate-round{1,2,3}-*`）与第 2 条（连带句把 E-7119 降为横比对照项）。数字取自本文件 E-7409 表，未新增数据；四条诚实结论原文未动。
5. **REQB-05**：E-7403b 账目「8 红」与原始 fail=10 的精度修正。**用户决定：带入收口后处理（本卡不改）。**
6. **LESB-01/02/03**：同款修正是否也回改本卡 `lesson_candidates.md` 原文（E6 落库条目已按复核建议修正，卡内原文未动）。**用户决定：带入收口后处理（本卡不改）。**
7. **漏记③后半**：共享教训库候选-40 补「运行中形态变更同样取证」一句（降档事件本身已在 progress 日志以 `[工具链]` 行登记）。**用户决定：带入收口后处理（本卡不改）。**
