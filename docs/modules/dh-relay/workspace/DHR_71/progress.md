<!-- progress.md — 施工日志 + 证据账本。边做边记；跑偏记这里，不回写计划文档。 -->
# progress — DHR_71

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-02 | 主会话 | D-start：用户对话点选「开工授权」；分流 = 标准 · light · 开树 `wt/DHR_71` · 施工派 Opus Herdr 右上 pane · 委托节点（S1 自写，E5/E14 派 fresh 只读，E6/E7 沿默认）。主树建 v2 七件套骨架、写 worker 粒度 task_plan | — | 切 `wt/DHR_71`，Herdr 右侧 split 拉 Opus，喂 brief |
| 2026-09-02 03:16Z | worker | 进场：`cwd=.dh-worktrees/DHR_71`、分支 `wt/DHR_71`、`git status` clean、`HEAD=81f5a53` 与 master 一致（无需 rebase）。读完 C-001~C-009 | `git log -1 --oneline` = `81f5a53` | 第 1 步取基线 |
| 2026-09-02 03:19Z | worker | 第 1 步基线取证（**改代码前**）：五文件合跑 1 次 + 五个文件各自隔离单跑 1 次 | `evidence/baseline-20260902T0316Z.txt`、`evidence/isolated-*-20260902T0322Z.txt` | 逐条归类红名单 |
| 2026-09-02 03:30Z | worker | 第 2/3/4/5/6/7/8 步：`:242`/`:279` 加 skip（恰 2 条）；新增 `test/helpers/bounded-wait.mjs`；八处等待改有界化 | `git diff --stat` | 第 9 步负例 |
| 2026-09-02 03:38Z | worker | 第 9 步 652s 负例：A~F 六组对照，定位根因并验证修法 | `evidence/hang-repro-20260902T0338Z.txt` | 第 10 步三轮 |
| 2026-09-02 03:50Z | worker | **跑偏记录**：task_plan 第 4 步①的「加 `t.after(() => driver.stop())`」被自己的负例证伪（B 组 4 轮 2 挂），改为用例体内 `try/finally`。理由见 F-7103。计划文档不回改 | `evidence/hang-repro-*.txt` B 组 vs F 组 | — |
| 2026-09-02 03:52Z | worker | **本卡自造的问题**：`dumpDriverScene` 初版把原始 Receipt ID 打进 evidence，当场闭合（工具侧 `redactIds()` + 回溯脱敏 + 复扫 0） | F-7106 | — |
| 2026-09-02 04:04Z | worker | 第 10 步：五文件绿闸连续 3 轮 | `evidence/gate-round{1,2,3}-20260902T0405Z.txt`（+ 同名 `.junit.xml`） | 第 11/12 步 |

## 第 1 步 · 基线（`master@81f5a53`，改代码前）

**合跑**（`evidence/baseline-20260902T0316Z.txt`，exit=1）：tests 55 / pass 50 / **fail 5** / skip 0，`duration_ms 125404.8`，墙钟 **126s**，进程正常收口（未挂）。

**隔离单跑**（`evidence/isolated-<短名>-20260902T0322Z.txt`，每次只给一个文件）：

| 文件 | 墙钟 | tests / pass / fail |
|---|---|---|
| `herdr-adapter.test.mjs` | 53s | 27 / 24 / 3 |
| `agent-node.test.mjs` | 27s | 9 / 8 / 1 |
| `dhr64-driver-observation.test.mjs` | 16s | 3 / 3 / 0 |
| `dhr69-false-ready.test.mjs` | 52s | 10 / 9 / 1 |
| `dhr70-submission-gate.test.mjs` | 37s | 6 / 6 / 0 |
| **合计（机器证 A 的分母）** | **185s** | — |

→ 机器证 A 的时长判据上限 = **185 × 2 = 370s**。

### 基线红名单（合跑 5 红；行号为基线行号）

| 用例 | 名称 | 归类 | 报错首行 |
|---|---|---|---|
| `agent-node:198` | DHR_33 窄路径：driver 托管 herdr-agent… | **① 语义** | `AssertionError … + undefined - 'E_EXECUTOR_KILLED'`（断言在 `:228`；等待本身已过） |
| `agent-node:231` | DHR_61 D1: freezes source and ordered fallback… | **② 时序** | `Error: timeout waiting for DHR61 receipt heartbeat`（1s 预算） |
| `herdr-adapter:242` | DHR_33 driver #3/#5：done 有界… | **① 语义**（冻结 skip） | `Error: timeout:judge result` |
| `herdr-adapter:279` | DHR_33 driver：stop 撞 launch 窗口… | **① 语义**（冻结 skip） | `AssertionError … + undefined - 'E_EXECUTOR_KILLED'` |
| `herdr-adapter:354` | DHR_33 driver #10：恢复届按账上 ref 判 orphaned… | **① 语义** | `Error: timeout:orphaned recovery`（10s 预算） |

**③ EPERM：0 条**（基线全程未出现 `EPERM … rename … %TEMP%`，BL-17 签名未命中）。**④ 其他：0 条**。

### 与 DHR_35 `F-3520` 的差异（必须写明）

1. **5 红同名同位、数量一致**，且无 EPERM、无挂死——这一点复现到了。
2. **归类不同（本卡的主要结论）**：F-3520 把 `:198` / `:354` 与 `:231` 一起归成「1s–10s 预算的等待超时，倾向时序脆弱」。本机取证证明 **`:198` 与 `:354` 都是语义红**（F-7102 / F-7104）——现役 driver 在这两条路径上根本不会写它们等的那个事件，超时只是表象。真正的时序红只有 `:231` 一条。差异原因不是机器/负载，是 F-3520 当时对这三条**没做定位**（其自述「本卡未做进一步定位」）。
3. **隔离 vs 合跑的差异换了对象**：F-3520 记「`herdr-adapter:510` 只在隔离跑里红」，本机 `:510` 隔离与合跑**两次都绿**；反而是 `dhr69-false-ready:179` 只在隔离跑里红（第 2 轮绿闸里也红了一次）→ F-7105。该文件不在允许路径，只登记。

## 第 9 步 · 652s 归因（机器证 C）

**复现步骤**（原始输出全在 `evidence/hang-repro-20260902T0338Z.txt`）：把 `agent-node.test.mjs` 的 `DHR_33 窄路径` 用例的等待目标临时换成永不发生的 `never_such_event`、上限 3s，**故意不带 `--test-timeout`**，外面套 `timeout 120~150`；`exit=124` = 被硬截断 = 用例已 fail 而进程不退。

| 组 | 变体 | 结果 |
|---|---|---|
| A | 无任何兜底 stop | `exit=124`，150s 硬截断（**挂死复现**） |
| B | 加 `t.after(() => driver.stop())`（task_plan 第 4 步①的方案） | 4 轮里 **2 轮 `exit=124`**（150s / 151s），2 轮 22s 正常退 → **该方案被证伪** |
| C | rm 钩子吞异常 + stop 加 10s race + 打句柄 | 23s 退；`[diag] rm FAILED ENOTEMPTY`、`[diag] stop -> stopped` |
| D | rm 还原（异常不吞）+ stop 诊断 | 22s 退；日志出现 `EPERM … rename state.json.<uuid>.tmp`（BL-17 签名） |
| E | B 形态 + `unref()` 的 20s interval 探针 | 抓到挂死那一轮：`[diag-alive] ["FSReqPromise","PipeWrap","PipeWrap"]` 连打 6 次 |
| F | **改成用例体内 `try/finally` 收口** | 5 轮 **0 挂**（20 / 21 / 21 / 30 / 30s） |

**观察**：挂住时活跃句柄只剩 **一个 `FSReqPromise`** —— **没有 `Timeout`、没有 `ChildProcess`**。

**结论**：652s 挂死**不是**泄漏的轮询定时器（原假设），而是用例 `t.after` 里那次 `rm(repoRoot, { recursive: true, force: true })` 在 Windows `%TEMP%` 上撞见仍在写 `state.json.<uuid>.tmp` 的 driver 时**不返回也不报错**。node:test 的 after 钩子按**登记顺序**执行，而 `rm(repoRoot)` 在用例体第一行就登记了，所以任何 `t.after(stop)` 都排在它后面——救不了场（B 组实测）。

**修法（本卡在允许路径内做的）**：把 `driver.stop()` 从 `t.after` 改成用例体内的 `try/finally`，保证 driver 在任何 after 钩子之前收口。生产代码零改动。`%TEMP%` 自身的脆弱性（fs 调用挂住 / EPERM）仍归 **`DHR-BL-17`**，本卡只登记（F-7103）。

## 第 10 步 · 机器证 B 清单（每个被改的等待）

| 被改的等待 | 目标事件 | 上限 | 上限依据 | 超限输出 |
|---|---|---|---|---|
| `agent-node` `DHR_33 窄路径` | 首条 `checkpoint_recorded` | 30s（原 1s） | `herdrReadyTimeoutMs=10_000`（driver 默认）+ 一次 `agentGet` 的 per-call `timeoutMs=10_000`（`herdr-cli.mjs:41`）+ 10s 给 Store 落盘抖动 | 事件 kind 序列 + `node_states` + `run_status` + fake 计数器（`agentGets/paneGets/agentReads/paneSplits/paneKills/sent`）+ `elapsed_ms`；样例见 `evidence/hang-repro-*.txt` F 组段 |
| `agent-node` `DHR_61 D1 receipt` | 首条 `checkpoint_recorded` | 30s（原 1s） | 同上 | 同上 |
| `agent-node` `DHR_61 projection-missing` | `driver.done` 落定 | 60s | driver 自己的 `doneTimeoutMs=60_000`（`workflow-driver.mjs:33`） | 同上（`withDeadline`） |
| `herdr-adapter` `#10 恢复届` | `attempt_orphaned` | 15s（原 10s） | 恢复届探活是**一次 `herdrCli.agentGet`**，生产上限 = per-call `timeoutMs=10_000`（**不是** `HERDR_START_TIMEOUT_MS`——恢复届不 launch）；原 10s 等于 0 余量，按「生产上限 + 50%」取 15s | 见下方实测样例 |
| `herdr-adapter` `#10 gone.driver.done` | `driver.done` 落定 | 60s | `doneTimeoutMs=60_000` | 同上 |
| `herdr-adapter` `#10 接管同一 attempt` | 首条 `checkpoint_recorded` | 15s（原 10s） | 同恢复届探活 | 同上 |
| `herdr-adapter` `DHR_68/C waiting_human` | `node_states[0].status === 'waiting_human'` | **45s（不变）** | 走完整 launch 路径，生产上限是 `HERDR_START_TIMEOUT_MS=60_000`；45s 本就在其内且有余量，基线两次都绿——**没有把预算改大或改小的证据，只换超时输出** | 同上 |
| `herdr-adapter` `DHR_68/C ≥5 blocked polls` | `fake.agentGets >= 5` | **45s（不变）** | 同上 | 同上 |

**超限输出实测样例**（第 1/3 轮绿闸里 `#10 恢复届` 的真实输出——它同时就是 F-7104 的证据）：

```
Error: bounded-wait: #10 恢复届 attempt_orphaned 在 15000ms 内未发生（实测等了 15017ms）
    events(5)=["run_created","node_started","attempt_started","host_observation_changed(alive)","human_input_requested:E_EXECUTOR_HOST_LOST"]
    node_states=[{"node_id":"herdr","status":"waiting_human","attempt_count":1}]
    run_status=waiting_human
```

原来的输出只有一句 `Error: timeout:orphaned recovery`——说不出它停在哪，这正是 F-3520 把它误判成时序红的原因。

## 第 10 步 · 机器证 A 三轮 —— **首轮施工**（`evidence/gate-round{1,2,3}-20260902T0405Z.txt`）

> ⚠️ 本节是 **B-36 之前**的首轮结果（隔离清单还是 2 条），已被下方「增量（B-36）」一节取代。保留是为了留痕，不是当前结论。

| 轮 | tests | pass | **skip** | **fail** | 墙钟 | 收口 |
|---|---|---|---|---|---|---|
| 1 | 55 | 51 | **2** | 2 | 103s | 是 |
| 2 | 55 | 50 | **2** | 3 | 143s | 是 |
| 3 | 55 | 51 | **2** | 2 | 102s | 是 |

每文件时长（从同名 `.junit.xml` 的 `<testcase … time= … file=>` 按文件汇总）：

| 文件 | 轮 1 | 轮 2 | 轮 3 |
|---|---|---|---|
| `herdr-adapter.test.mjs` | 28.0s | 25.6s | 29.3s |
| `agent-node.test.mjs` | 16.2s | 16.5s | 17.2s |
| `dhr64-driver-observation.test.mjs` | 11.9s | 11.5s | 14.7s |
| `dhr69-false-ready.test.mjs` | 2.8s | **49.0s** | 2.9s |
| `dhr70-submission-gate.test.mjs` | 39.9s | 37.6s | 34.9s |
| 用例耗时合计 | 98.9s | 140.2s | 99.0s |

**判据逐条**：

- **skip 恰 2**：三轮均为 2（`herdr-adapter:242` / `:279`）✅
- **三轮都收口**：无一轮不退出（103 / 143 / 102s）✅ ——基线之前记录的 652s 挂死形态本轮零发生
- **每轮总时长 ≤ 隔离单跑之和 × 2（370s）**：最大 143s ✅
- **fail = 0**：**未达成**（2 / 3 / 2）❌

**三轮红名单**（全部已归类，全部不在本卡可修范围）：

| 用例 | 轮 1 | 轮 2 | 轮 3 | 归类与去向 |
|---|---|---|---|---|
| `agent-node` `DHR_33 窄路径` | 红 | 红 | 红 | 语义 → **DHR_72**（F-7102） |
| `herdr-adapter` `#10 恢复届` | 红 | 红 | 红 | 语义 → **DHR_72**（F-7104） |
| `dhr69-false-ready:179` | 绿 | 红 | 绿 | 文件不在允许路径 → 只登记（F-7105） |

按 task_plan 的 blocked 判据：三轮之后 fail 仍 > 0，且每条红都已归类为「语义 → DHR_72」或「越界 → 只登记」，**不再折腾夹具或断言**，照实提交并把 `construction.DONE` 写成 `status: blocked`。绿闸「skip 恰 2、fail 0」在本卡允许路径内**不可达**——是否扩路径是主控的裁决，不是 worker 的。

> 措辞纪律：本卡任何地方都不写「全绿」。当前事实是「**隔离 2 条 skip，其余仍有 2~3 条红且已逐条归类**」。

## 第 11 步 · 机器证 D（路径越界自查）—— **首轮施工**

改动文件（工作树 = 提交内容）：

```
relay-core/test/agent-node.test.mjs          （改）
relay-core/test/herdr-adapter.test.mjs       （改）
relay-core/test/helpers/bounded-wait.mjs     （新增）
docs/modules/dh-relay/workspace/DHR_71/**    （工件 + evidence）
```

逐 hunk 核对行级限定（`git diff -U0` 的 `-` 侧 = 基线行号）：

- `herdr-adapter.test.mjs`：`-14,0`（import 区）、`-242`、`-279`（两条 skip 的**头行**各一行）、`-354,0` / `-356,2` / `-360,2`（⊂ 354–364）、`-518,0` / `-521` / `-532,2`（⊂ 510–538）。**共享夹具 `:203-230`（含 `runtimeSleep`/`runtimeUntil`）与 `:335-352` 零改动**——diff 里不出现这两段。
- `agent-node.test.mjs`：`-32,0`（import）、`-48,0`（文件级超时常量 + 上限依据注释）、`-198` / `-231` / `-265`（三条用例头行加 `{ timeout: FILE_TEST_TIMEOUT_MS }`）、`-223,2` / `-255,2` / `-286,0` / `-288`（三条用例体内的等待逻辑）。
- 未触碰：`relay-core/runtime/**`、`store/**`、`contracts/**`、`package.json`、`test/helpers/fake-herdr.mjs`、`workflows/**`，以及绿闸里另外三个测试文件。
- `git diff --check -- relay-core/ docs/modules/dh-relay/workspace/DHR_71/*.md` 无输出。**例外并说明**：`evidence/**` 里有若干 trailing-whitespace 命中，那是 `node --test` 断言 diff 的**原样输出**（`+ actual - expected` 之间的空行）；证据必须逐字保留，不做美化，故不在自查范围内。
| 2026-09-02 | 主会话 | **B-36 落盘**（master `1b4b1ce`）：隔离清单 2→4（S1~S4）、`dhr69:179` 等待归本卡、上限规则「真实调用链逐段相加 × 1.5」、反向禁改；`wt/DHR_71` 已 rebase 到 master，brief/review 完成条件 A 与边界随 DevPlan 跟改 | evidence/36 | worker 续做增量：S3/S4 加 skip、`:510` 两处 + `dhr69:179` 上限改正 + 负例、三轮绿闸 |
| 2026-09-02 | 主会话 | **收工核对 DONE(done)**：三轮 `gate-round*-20260902T0525Z.txt` 原始输出核实 55/51/4/0 ×3、skip 名单 S1~S4 逐条同名、157/110/170s ≤ 370s；`git diff master...HEAD` hunk 逐段核：`dhr69-false-ready.test.mjs` 只有 import 一行 + `:184` 用例体，`herdr-adapter` 只有 import / S1S2 头行 / `:354` 体 / `:510` 体。**裁决 flagged-1**：`dhr69` 的 import 行是调用等待工具的机械前提，不是文件级 `until` 助手也不是其它用例，按 brief 对 `herdr-adapter` import 区的同类明文授权**等价放行**，记入 review 一致性比对清单，不算越界。**F-7107 已修**：DevPlan 目标段（master `25d697d`）与 brief `:18/:22/:45/:46` 的「2 条」措辞已统一为 4 条 / `dhr69` 仅 `:179`。`wt/DHR_71` 已 rebase 到 master `25d697d`。 | E-7109（三轮）、本行 | 进 E 阶段：E0 体检 → E6 miner → E5 教训 + E14 一致性两路派 fresh 只读 → E7~E10 |
| 2026-09-02 | 主会话 | **E5 教训 + E14 一致性两路回收**（`dhr71les`/`dhr71con`，codex 只读沙盒 · fresh · Herdr 右上/右下 pane，派出 E-7111/E-7112，基线 `28af9af`；回收后 `git status` 仅本账本 dispatch 行 + 两份原样输出 = 零写入）：一致性 2×P1（F-71-CON-01 首 checkpoint 等待漏算 Codex 启动链 → 120s；F-71-CON-02 `:510` 两段 195s > `--test-timeout=180000` → 300000）+ 1×P2 范围外；教训 1×P1（F-71-LES-01 **驳回**，理由见 findings，按候选-26 另派窄审）+ 2×P2 采纳。两路均确认 dhr69 import 裁决站得住、skip 形态与机器证 E 一一对应、S3/S4 断言零 hunk。 | `review-lessons-codex.md`、`review-consistency-codex.md` | 派 Opus worker 修 CON-01/02 + 重跑三轮；派 fresh 窄审攻击 LES-01 驳回 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 操作 | 退出码 / 结果 | 落点 |
|---|---|---|---|---|
| E-7101 | session-run | `node --test --test-concurrency=1 --test-timeout=180000 test/{herdr-adapter,agent-node,dhr64-driver-observation,dhr69-false-ready,dhr70-submission-gate}.test.mjs`（基线合跑，**改代码前**） | exit=1；55 / 50 / 5，skip 0；126s | `evidence/baseline-20260902T0316Z.txt` |
| E-7102 | session-run | 同上 flag，五个文件**各自单跑**一次 | 各 exit 见基线表；墙钟合计 185s | `evidence/isolated-*-20260902T0322Z.txt`（5 份） |
| E-7103 | session-run | `node -e "import('./test/helpers/bounded-wait.mjs').then(m=>console.log(Object.keys(m)))"` | `[ 'dumpDriverScene', 'redactIds', 'untilEvent', 'withDeadline' ]`——较 task_plan 第 3 步预期多两个：`dumpDriverScene` 按该步括注「或放进 `bounded-wait.mjs` 导出」；`redactIds` 是 F-7106 的闸 | 终端 |
| E-7104 | session-run | 652s 负例 A~F 六组（含 `timeout 120/150` 硬截断与 `unref` 探针） | A 挂；B 4 轮 2 挂；F 5 轮 0 挂 | `evidence/hang-repro-20260902T0338Z.txt` |
| E-7105 | session-run | 五文件绿闸 ×3（`--test-reporter=spec` → txt，`--test-reporter=junit` → xml，同一进程双 reporter） | exit=1/1/1；skip 恰 2 ×3；fail 2/3/2；103 / 143 / 102s | `evidence/gate-round{1,2,3}-20260902T0405Z.txt` + 同名 `.junit.xml` |
| E-7106 | session-run | `git diff -U0` 逐 hunk 核对允许行 + `git diff --check` | 全部 ⊂ 允许路径与行级限定；check 无输出 | 本文件「第 11 步」小节 |
| E-7107 | session-run | `grep -rlEi "rcpt-[0-9a-f]{8}\|herdr-[0-9a-f]{8}" workspace/DHR_71/evidence/` | **0 命中**（含 `.junit.xml`）；脱敏内建在 `bounded-wait.mjs` 的打印路径上，不是事后扫描 | 终端；机制见 F-7106 |
| E-7108 | session-run | `dhr69-false-ready:179` 等待有界化负例：上限临时改 `1`（ms），其余一字不动 | exit=1、6s；用例 **525ms 内 fail**（不是挂住），失败输出带完整 dump；跑完已还原 `90_000` 并 `diff` 确认与负例前逐字一致 | `evidence/negative-dhr69-179-20260902T0520Z.txt` |
| E-7109 | session-run | 增量后五文件绿闸 ×3（同一命令、同样双 reporter） | **exit=0 / 0 / 0；55 / pass 51 / skip 4 / fail 0 ×3**；157 / 110 / 170s | `evidence/gate-round{1,2,3}-20260902T0525Z.txt` + 同名 `.junit.xml` |
| E-7110 | session-run | 增量后 `git diff -U0 master` 逐 hunk 核对 + `git diff --check -- relay-core/` | 全部 ⊂ 允许路径与行级限定；check 无输出 | 本文件「增量（B-36）· 机器证 D」小节 |
| E-7111 | review-dispatch | herdr agent start dhr71les --kind codex --pane <right-top> -- --sandbox read-only -c model_reasoning_effort=high --model gpt-5.6-terra | observed | 复核派出：dhr71les｜E5 教训复核 · fresh · brief=review-brief-lessons.md · HEAD 见本行前一提交 |
| E-7112 | review-dispatch | herdr agent start dhr71con --kind codex --pane <right-bottom> -- --sandbox read-only -c model_reasoning_effort=high --model gpt-5.6-terra | observed | 复核派出：dhr71con｜E14 一致性复核 · fresh · brief=review-brief-consistency.md |
| E-7113 | review-dispatch | herdr agent start dhr71les2 --kind codex --pane w2:p11 -- --sandbox read-only -c model_reasoning_effort=high --model gpt-5.6-terra | observed | 复核派出：dhr71les2｜候选-26 窄审：攻击主控对 F-71-LES-01 的驳回；结论=部分成立 |
| E-7114 | session-run | 复核整改后五文件绿闸，新命令 `--test-timeout=300000`（双 reporter 同前）；4 个系列共 8 轮 | **3 绿 5 红，未凑出连续 3 轮**；绿轮均 55 / pass 51 / skip 4 / fail 0（197 / 167 / 111s）；红轮逐条分类见「机器证 A · 本届各系列逐轮结果」 | `evidence/gate-round{1,2}-20260902T{0714,0739,0810,0821}Z.txt` + 同名 `.junit.xml`（含 1 份 `.VOID-bl17-eperm.*` 作废轮，留证不删） |
| E-7115 | session-run | **对照实验**：`git checkout HEAD -- relay-core/test/agent-node.test.mjs`（回 30_000）+ 旧命令 `--test-timeout=180000`，同时段同负载跑 2 轮 | 1 绿（122s）1 红（174s，`dhr70-submission-gate:339` `ERR_ASSERTION`）⇒ **上一届被验收的那套配置在当前负载下同样红**，归因指向环境而非本届改动；跑完已还原带修版本并核对常量 `120_000` | `evidence/control-headcode-round{1,2}-20260902T0831Z.txt` + 同名 `.junit.xml` |
| E-7116 | session-run | `%TEMP%` 现场取证：目录/文件计数、套件遗留夹具计数、并发进程与 CPU 采样、`Get-MpPreference`、近 2 小时 node 进程逐个核对 | 24,592 目录 / 66,950 文件 / 201 个 `dhr*` 遗留夹具；负载峰值 82%；`Get-MpPreference` **> 2 分钟未返回**；**无孤儿 test runner** | 本文件「`%TEMP%` 现场取证」小节（终端观测，未落原始文件） |

---

# 增量（B-36，2026-09-02 · `wt/DHR_71@0117247` 起）

> 主控已按 `DHR-B-36` 改口径并 rebase 到 `master@1b4b1ce`：隔离清单 **2→4**（S1~S4，按完整用例名核销）、`dhr69-false-ready.test.mjs` 加入允许路径（仅 `:179` 用例体等待）、等待上限规则改为「按真实调用链逐段相加 × 1.5」、S3/S4 反向禁改断言。本节是据此续做的增量。

## 增量改了什么（5 处）

| # | 文件 · 位置 | 改动 |
|---|---|---|
| 1 | `herdr-adapter.test.mjs` S3「DHR_33 driver #10：恢复届…」头行 | 加 `{ skip: 'F-3520 → DHR_72：DHR_64 起恢复届探活 missing 写 human_input_requested(E_EXECUTOR_HOST_LOST) 而非 attempt_orphaned(E_EXECUTOR_ORPHANED)，用例待按 Receipt-bound 语义重写' }` |
| 2 | `agent-node.test.mjs` S4「DHR_33 窄路径…」头行 | 原有 `{ timeout: FILE_TEST_TIMEOUT_MS }` 合并进 `skip: 'F-3520 → DHR_72：现役 driver 在 stop 时写 human_input_requested(E_EXECUTOR_KILLED) 而非 attempt_failed(E_EXECUTOR_KILLED)，用例待按 Receipt-bound 语义重写'` |
| 3 | `herdr-adapter.test.mjs` `:510` 第一处等待 | 上限 `45_000` → **`120_000`**（`BLOCKED_LAUNCH_BUDGET_MS`），依据见下表 |
| 4 | `herdr-adapter.test.mjs` `:510` 第二处等待 | 上限 `45_000` → **`75_015`**（`BLOCKED_FIVE_POLLS_BUDGET_MS`） |
| 5 | `dhr69-false-ready.test.mjs` `:179` 用例体 | 文件级 `until(..., 'false-ready waiting_human')`（45s 默认）→ `untilEvent` + `dumpDriverScene`，上限 **`90_000`**（`FALSE_READY_LAUNCH_BUDGET_MS`）；另加一行 `import { dumpDriverScene, untilEvent }` |

S3/S4 加 skip 时**只动头行**：两条用例体内首轮落的有界等待与 `try/finally stop` 原样保留（DevPlan「做什么」段明确要求），**断言一个字未动**（B-36 反向禁改）。

## 上限代入过程（B-36 冻结规则）

规则：按该用例**实际走的** `launchHerdrAgent` 调用链，把每次 Herdr CLI 调用的**生产上限**逐段相加 × 1.5。生产上限只有两个值：`herdr-cli.mjs:41` 的通用 per-call `timeoutMs = 10_000`；`herdr-cli.mjs:17` 的 `HERDR_START_TIMEOUT_MS = 60_000`，**只有 `agent start` 用它**。

| 等待 | 调用链 | 代入 | 上限 |
|---|---|---|---|
| `herdr-adapter :510` 第一处（`waiting_human`） | Codex profile，`agentStart` 返回 `notReady` → `startBlocked`：`paneSplit` → `agentStart` → 首次 `agentGet`（夹具 `herdrReadyTimeoutMs:0`，就绪循环不重试） | (10_000 + **60_000** + 10_000) × 1.5 = 80_000 × 1.5 | **120_000** |
| `herdr-adapter :510` 第二处（`agentGets ≥ 5`） | 不是 launch，是轮询：等满 5 轮，每轮 = 一次观测 CLI 上限 10_000 + 夹具生效的 `herdrPollMs`（`runtimeFixture` 给 2；本用例 driver options 只覆盖 `herdrReadyTimeoutMs`，没覆盖它） | 5 × (2 + 10_000) × 1.5 = 5 × 10_002 × 1.5 | **75_015** |
| `dhr69-false-ready :179` | 夹具默认 `claudeProfile` → Claude `pane run` 链，六次 CLI 调用、**无 `agent start`**：`paneSplit` → `paneRun` → `agentList` → `agentRename` → `agentGet` → `paneGet`；夹具 `herdrReadyTimeoutMs: 0` 故 rename 恰一轮、ready 循环不等 | 6 × 10_000 = 60_000 × 1.5 | **90_000** |

**首轮那条理由方向是反的，这里更正**：首轮给 `:510` 保留 45s 的理由写成「45s 在生产 60s 之内，还有余量」——这把关系搞反了。等待上限的作用是「把挂住变成上限内 fail」，所以它必须 **≥ 生产合法上限**；45s < 该链 80s 的合法上限，意味着一次完全合法的慢启动会被判成失败。同一个错误也解释了 `dhr69:179` 为什么时红时绿：它的 45s 预算低于自身链路 60s 的合法上限。

## 机器证 B 清单（增量后全量，8 条改正为 8 条 + 1 条新增）

首轮已列的 6 条（`agent-node` 三条、`herdr-adapter #10` 三条）**依据不变**，此处只列本次改动的三条：

| 被改的等待 | 目标事件 | 上限 | 上限依据 | 超限失败输出 |
|---|---|---|---|---|
| `herdr-adapter` `DHR_68/C waiting_human` | `node_states[0].status === 'waiting_human'` | **120_000**（原 45_000） | 上表第 1 行 | 事件 kind 序列 + `node_states` + `run_status` + fake 计数器 + `elapsed_ms`（`dumpDriverScene`） |
| `herdr-adapter` `DHR_68/C ≥5 blocked polls` | `fake.agentGets >= 5` | **75_015**（原 45_000） | 上表第 2 行 | 同上 |
| `dhr69-false-ready` `DHR_69/A false-ready waiting_human` | `node_states[0].status === 'waiting_human'` | **90_000**（原文件级 `until` 的 45_000 默认） | 上表第 3 行 | 同上；**实测样例见下** |

**负例实证**（E-7108，`evidence/negative-dhr69-179-20260902T0520Z.txt`）：把 `FALSE_READY_LAUNCH_BUDGET_MS` 临时改成 `1`（ms），其余一字不动 → 用例在 **525ms 内 fail**（不是挂住，进程 6s 正常退出），失败输出：

```
Error: bounded-wait: DHR_69/A false-ready waiting_human 在 1ms 内未发生（实测等了 364ms）
    events(1)=["run_created"]
    node_states=[{"node_id":"herdr","status":"pending","attempt_count":null}]
    run_status=pending
    fake: agentGets=0 paneGets=0 agentReads=0 paneSplits=0 paneKills=0 sent=0
```

跑完已还原 `90_000`，并用 `diff` 逐字确认文件与负例前一致。

## 机器证 A · 增量三轮（`evidence/gate-round{1,2,3}-20260902T0525Z.txt`）

| 轮 | tests | pass | **skip** | **fail** | 墙钟 | 收口 |
|---|---|---|---|---|---|---|
| 1 | 55 | 51 | **4** | **0** | 157s | 是 |
| 2 | 55 | 51 | **4** | **0** | 110s | 是 |
| 3 | 55 | 51 | **4** | **0** | 170s | 是 |

每文件时长（同名 `.junit.xml` 按 `file=` 汇总）：

| 文件 | 轮 1 | 轮 2 | 轮 3 |
|---|---|---|---|
| `herdr-adapter.test.mjs` | 43.4s | 21.3s | 47.2s |
| `agent-node.test.mjs` | 28.6s | 21.3s | 26.5s |
| `dhr64-driver-observation.test.mjs` | 14.5s | 16.2s | 21.9s |
| `dhr69-false-ready.test.mjs` | 7.9s | 3.4s | 12.3s |
| `dhr70-submission-gate.test.mjs` | 53.5s | 43.5s | 50.3s |
| 用例耗时合计 | 147.9s | 105.7s | 158.1s |

**4 条 skip 按完整用例名逐条核销**（三轮一致，无多解无少解）：

| 冻结表 | 用例名 |
|---|---|
| S1 | `DHR_33 driver #3/#5：done 有界、判定成功与双亡 HOST_LOST` |
| S2 | `DHR_33 driver：stop 撞 launch 窗口仍杀 pane，失败写 killed Result 且不造 Attention` |
| S3 | `DHR_33 driver #10：恢复届按账上 ref 判 orphaned 或接管同一 attempt` |
| S4 | `DHR_33 窄路径：driver 托管 herdr-agent，开 Attempt、记心跳并按 stop 落 killed` |

**判据逐条**：

- **skip 恰 4（B-36 冻结表 S1~S4）**：三轮均为 4，且与 S1~S4 一一对应 ✅
- **fail = 0**：三轮均 0（`exit=0` ×3）✅
- **三轮都收口**：157 / 110 / 170s，无一轮不退出 ✅
- **每轮总时长 ≤ 隔离单跑之和 × 2**：分母沿用**改代码前**的基线 185s（`evidence/isolated-*-20260902T0322Z.txt`），上限 370s；最大 170s ✅

> 措辞纪律：结论只能写「**隔离 4 条 skip、其余全 pass**」，**不写「全绿」**。那 4 条是转给 DHR_72 的债，不是豁免。

## 机器证 C（652s）· 增量复核

首轮的定位与修法不变（F-7103）：根因是 `t.after` 里的 `rm(repoRoot)` 撞上仍在写盘的 driver，修法是用例体内 `try/finally stop`。增量三轮零挂死，`exit=0` ×3。另外 `dhr69-false-ready.test.mjs` 的两个夹具（`runtimeFixture` / `recoveryFixture`）本来就是 `await started.stop()` 之后才 `rm`，顺序正确，无需改动——这也从反面印证了 F-7103 的结论。

## 机器证 D · 增量越界自查

相对 `master@1b4b1ce` 的**代码**改动只有三个文件（其余全在 `docs/modules/dh-relay/workspace/DHR_71/**`）：

```
relay-core/test/agent-node.test.mjs
relay-core/test/dhr69-false-ready.test.mjs
relay-core/test/helpers/bounded-wait.mjs
relay-core/test/herdr-adapter.test.mjs
```

逐 hunk 核对（`git diff -U0 master` 的 `-` 侧 = `master@81f5a53` 基线行号，与 DevPlan 冻结锚同基准）：

- `herdr-adapter.test.mjs`：`-14,0`（import 区）、`-242`（S1 头行）、`-279`（S2 头行）、`-354`（S3 头行）+ `-356,2` / `-360,2`（⊂ 354–364 用例体）、`-518,0` / `-521` / `-533`（⊂ 510–538 用例体）。**共享夹具 `runtimeFixture`（`:203-230`）与 `recoveryFixture`（`:335-352`）零改动。**
- `agent-node.test.mjs`：`-32,0`（import）、`-48,0`（文件级超时常量 + 依据注释）、`-198`（S4 头行）、`-223,2`、`-231`、`-255,2`、`-265`、`-286,0`、`-288`（三条用例体内等待逻辑 + 头行 timeout）。
- `dhr69-false-ready.test.mjs`：**只有两处** —— `-10,0`（import 行）与 `-184`（`:179` 用例体内那行 `until`）。**文件级 `until` 助手（`:15-21`）与其余 9 条用例零改动。**
  - ⚠️ **如实说明一处允许路径的边缘**：DevPlan 对本文件写的是「仅 `:179` 用例体内的等待逻辑」，而 `-10,0` 那行 `import` 在用例体外。它是使用 `untilEvent`/`dumpDriverScene` 的**机械前提**（不 import 就无法调用），且不碰 `until` 助手、不碰其余用例；参照 brief 对 `herdr-adapter.test.mjs` 的同类明文授权（「import 行不属于夹具区，允许」）等价处理。**提请主控确认**，若判越界，替代做法是在用例体内用动态 `await import(...)`。
- 未触碰：`relay-core/runtime/**`、`store/**`、`contracts/**`、`package.json`、`test/helpers/fake-herdr.mjs`、`workflows/**`，以及 `dhr64-driver-observation` / `dhr70-submission-gate` 两个文件。
- `git diff --check -- relay-core/` 无输出（`evidence/**` 的 trailing whitespace 是 `node --test` 原样输出，逐字保留，不在自查范围）。
- `git diff --name-only master...HEAD` 仅含 `relay-core/test/**` 与 `docs/modules/dh-relay/workspace/DHR_71/**`。

## 增量日志

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-02 06:00Z | worker | 进场核对：`HEAD=0117247`、`git status` clean、master=`1b4b1ce`；读 brief「B-36 同步」段 + DevPlan §3.2（S1~S4 冻结表、允许路径、上限规则、反向禁改） | `git log --oneline -5` | 增量 1~3 |
| 2026-09-02 06:02Z | worker | S3/S4 加 skip；`:510` 两处上限按链改正；`dhr69:179` 换 `untilEvent` + dump（上限 90_000） | `git diff` | 冒烟 |
| 2026-09-02 06:03Z | worker | 三改动文件冒烟：46 条 / pass 42 / skip 4 / **fail 0**、60s | — | 负例 |
| 2026-09-02 06:05Z | worker | `dhr69:179` 负例（上限临时 1ms）→ 525ms 内 fail + dump；还原并 `diff` 确认逐字一致 | E-7108 | 三轮绿闸 |
| 2026-09-02 06:04–06:12Z | worker | 增量三轮绿闸：**skip 4 / fail 0 ×3**，157 / 110 / 170s，三轮均收口 | E-7109 | 越界自查 → 提交 → 重写 DONE |
| 2026-09-02 06:15Z | worker | 越界自查（含 `dhr69` 只有 import + `:179` 用例体两处）、更新 findings（F-7102/F-7104 改「已隔离，移交 DHR_72」，F-7105 改 resolved，新增 F-7107 文本残留）、重写 `construction.DONE` | E-7110 | 停下等主控 |

---

# 复核整改（F-71-CON-01 / F-71-CON-02，2026-09-02 · `wt/DHR_71@37bc26a` 起）

> 本节记第三届 worker（Opus，Herdr 交互 pane）的整改。范围只有两条已采纳的 P1，其余一律不动。
> **本节尚未拿到合格的三轮绿闸**——原因是本机 `%TEMP%` 现场，不是改动本身；证据与归因见下。

## 改了什么（2 处，其中 1 处是命令行不是代码）

| # | 落点 | 改动 | 依据 |
|---|---|---|---|
| 1 | `relay-core/test/agent-node.test.mjs` `:56-61` → `:56-68` | `HERDR_FIRST_CHECKPOINT_BUDGET_MS` **30_000 → 120_000**，注释重写为按调用链推导 | F-71-CON-01 |
| 2 | 绿闸命令行 | `--test-timeout` **180000 → 300000** | F-71-CON-02 |

- 第 1 处是**文件级常量**（brief 允许路径里 `agent-node.test.mjs` 的「文件级超时配置」），被且只被两条 Codex 启动用例引用：`:198`（S4「DHR_33 窄路径」，已 skip）与 `:231`（「DHR_61 D1: Herdr Attempt freezes source and ordered fallback identities before launch」）。改常量 = 两条用例体内 `untilEvent` 的 `timeoutMs` 同时改正，**用例体本身零 hunk**，S3/S4 的断言与 skip 一字未动。
- `FILE_TEST_TIMEOUT_MS = 180_000` **不动**（仍 > 120s 的新预算，安全网关系成立）。
- 第 2 处**不是代码**：`package.json` 不在允许路径，`--test-timeout` 只走命令行。按 F-71-CON-02 的裁决，`task_plan.md` 是一次性消耗品**不回改**，命令变更记在本节。

### 新绿闸命令（本节起用）

    node --test --test-concurrency=1 --test-timeout=300000
      --test-reporter=spec --test-reporter-destination=stdout
      --test-reporter=junit --test-reporter-destination=<evidence>/gate-round<N>-<ts>.junit.xml
      test/herdr-adapter.test.mjs test/agent-node.test.mjs test/dhr64-driver-observation.test.mjs
      test/dhr69-false-ready.test.mjs test/dhr70-submission-gate.test.mjs

（cwd = `relay-core/`；四行是同一条命令，双 reporter 与前两届一致。300000 的依据：`herdr-adapter:510` 同一用例内两段顺序等待最坏 120s + 75.015s = 195.015s，旧的 180000 会先把用例外层截断，第二段 `untilEvent` 的 dump 就出不来了——上限的职责是「超限即有界失败并打印现场」，外层不能比内层先动手。）

## 上限代入过程（F-71-CON-01）

规则沿用 B-36 冻结口径：按该用例实际走的 `launchHerdrAgent` 调用链，把每次 Herdr CLI 调用的生产上限逐段相加 × 1.5。

    paneSplit   10_000   （herdr-cli.mjs:41 通用 per-call timeoutMs）
    agentStart  60_000   （herdr-cli.mjs:17 HERDR_START_TIMEOUT_MS，只有 agent start 用）
    agentGet    10_000   （herdr-cli.mjs:41，首次观测）
    --------------------
                80_000 × 1.5 = 120_000

原 30_000 的错在**只按 `herdrReadyTimeoutMs` 推**，漏掉了 `paneSplit` 与 `agentStart` 两段，小于这条链 80s 的合法上限——一次完全合法的慢启动会被判成失败；且与同为 Codex 启动链、已取 120s 的 `herdr-adapter:510` 横向矛盾。方向与 B-36 的 `bound_direction_correction` 一致：上限必须 ≥ 生产合法上限。

## 机器证 B 清单 · `agent-node` 两处上限行（更新）

| 被改的等待 | 目标事件 | 上限 | 上限依据 | 超限失败输出 |
|---|---|---|---|---|
| `agent-node` `DHR_33 窄路径 首条 checkpoint_recorded`（`:244`，S4，用例已 skip） | `store.events.some(kind === 'checkpoint_recorded')` | **120_000**（原 30_000） | `(paneSplit 10_000 + agentStart 60_000 + agentGet 10_000) × 1.5` | 事件 kind 序列 + `node_states` + `run_status` + fake 计数器 + `elapsed_ms`（`dumpDriverScene`） |
| `agent-node` `DHR_61 D1 首条 checkpoint_recorded`（`:282`） | 同上 | **120_000**（原 30_000） | 同上（同一条 Codex 启动链） | 同上 |

其余 7 条（`herdr-adapter` 三条 + `#10` 三条 + `dhr69:179`）依据与上限**不变**，见上一节「机器证 B 清单（增量后全量）」。

## 机器证 A · 本届各系列逐轮结果（**未达标**，全部留证不删）

命令为上面的新绿闸命令；`control-*` 两轮是**对照实验**，用的是 HEAD 代码 + 旧命令。判据：skip 恰 4 ∧ fail 0 ∧ 每轮 ≤ 370s。

| 系列 / 轮 | exit | tests | pass | skip | fail | 墙钟 | 判定 | 红因 | 分类 |
|---|---|---|---|---|---|---|---|---|---|
| `gate-round1-20260902T0714Z` | 0 | 55 | 51 | 4 | 0 | 197s | **绿** | — | — |
| `gate-round2-20260902T0714Z` | 1 | 55 | 49 | 4 | **2** | 369s | 红 | ① `agent-node`「批4 边界钉」`timeout waiting for start response`（`untilAsync` 30s，用例 53.05s）② `dhr69-false-ready:180`「DHR_69/A driver」bounded-wait 90_000 未发生（实测 90032ms），`events(3)=[run_created,node_started,attempt_started]`、fake 全 0 | ① 环境（负载）② **BL-17 停顿形态 → F-7108** |
| `gate-round1-20260902T0739Z` | 0 | 55 | 51 | 4 | 0 | 167s | **绿** | — | — |
| `gate-round2-20260902T0739Z.VOID-bl17-eperm` | 1 | 55 | 50 | 4 | 1 | 123s | **作废** | `DHR_69/B`：`EPERM: operation not permitted, rename` `…\Temp\dhr69-runtime-BHch0w\.dh-relay\R001-dhr69\state.json.<uuid>.tmp` → `state.json`，栈 `store.mjs:554:9` | **BL-17 EPERM 文本形态**；按 review.md「EPERM 轮次作废重跑需如实登记」作废，原始输出改名留证不删 |
| `gate-round2-20260902T0739Z`（作废轮的重跑） | 1 | 55 | 50 | 4 | 1 | **827s** | 红 | `dhr70-submission-gate:189` DHR70 A2 `Error: timeout`（该文件自带的 `until`，`:64`） | 环境；**另外整轮 827s ≫ 370s 预算**：`duration_ms 825306`，而各用例自报耗时之和只有约 120s → 约 700s 花在用例体外的 `%TEMP%` 文件操作（`mkdtemp` / `git init` / `rm -r`） |
| `gate-round1-20260902T0810Z` | 0 | 55 | 51 | 4 | 0 | 111s | **绿** | — | — |
| `gate-round2-20260902T0810Z` | 1 | 55 | 50 | 4 | 1 | 210s | 红 | `herdr-adapter:532`「DHR_68/C driver：启动即 blocked…」bounded-wait 120_000 未发生（实测 120031ms），`events(3)` 止于 `attempt_started`、fake 全 0，用例 120.07s | **BL-17 停顿形态 → F-7108** |
| `gate-round1-20260902T0821Z` | 1 | 55 | 50 | 4 | 1 | 128s | 红 | `herdr-adapter:293`「DHR_67 driver：Claude adapter 启动失败…」`runtimeUntil` `timeout:claude launch attention`（19.6s；范围外的 `runtimeFixture` 助手） | 环境（负载） |
| `control-headcode-round1-20260902T0831Z` | 0 | 55 | 51 | 4 | 0 | 122s | 对照·绿 | — | — |
| `control-headcode-round2-20260902T0831Z` | 1 | 55 | 50 | 4 | 1 | 174s | **对照·红** | `dhr70-submission-gate:339` DHR70 C `ERR_ASSERTION`：`/agent_get=idle/` 不匹配 `undefined`（Attention detail 还没落） | 环境竞态；**归因关键证据**，见下 |

> **evidence 命名提醒**：两份 `control-headcode-*` 文件末行的 runner 标签沿用了脚本模板的 `gate round N` 字样，**文件名 `control-headcode-` 前缀才是权威区分**，别当成绿闸轮。

### 归因：不是本届改动造成的（对照实验）

`control-headcode-round{1,2}-20260902T0831Z` 是**把 `agent-node.test.mjs` 临时 `git checkout HEAD --` 回到 30_000 版本、并用旧命令 `--test-timeout=180000`** 跑的两轮，即上一届被验收为「三轮 55/51/4/0」的那套配置，在**同一时段、同一负载**下：第 1 轮绿 122s，**第 2 轮红**（`dhr70-submission-gate:339`）。跑完已还原带修的版本并核对常量为 `120_000`。

结论：红是环境的，与 F-71-CON-01 / CON-02 两处改动无关。逻辑上也成立——

- `--test-timeout` 由 180000 放宽到 300000 **只可能让用例活得更久**，不可能让用例更早失败；
- `HERDR_FIRST_CHECKPOINT_BUDGET_MS` 由 30_000 放宽到 120_000 **只可能让等待更容易等到**，方向同样是减少红；
- 本届所有红的用例（`批4 边界钉`、`dhr69:180`、`dhr70 A2`、`dhr70 C`、`herdr-adapter:293`、`herdr-adapter:532`）**没有一条引用** `HERDR_FIRST_CHECKPOINT_BUDGET_MS`。

### 一处自我纠正（值得记的教训）

`gate-round2-20260902T0739Z` 那轮我一度判成「挂死」并 `Stop-Process` 干预：依据是 txt 的 mtime 停在 11 分钟前、node 进程 CPU 只涨 0.07s、无子进程。**判错了**——`node --test` 的 stdout 被重定向到文件时是**块缓冲**，mtime 停住不等于进程停住；它其实自己跑完了（`duration_ms 825306`，summary 完整）。下次判挂死不能只看 mtime + CPU，要么让 reporter 直连终端，要么用 `process._getActiveHandles()` 类探针取证。

## F-7108 · `%TEMP%` 停顿形态（BL-17 一族，登记不修）

**形态**（本届出现 2 次：`gate-round2-0714Z` 的 `dhr69:180`、`gate-round2-0810Z` 的 `herdr-adapter:532`）：

    Error: bounded-wait: <label> 在 <上限>ms 内未发生（实测等了 <上限+30>ms）
        events(3)=["run_created","node_started","attempt_started"]
        node_states=[{"node_id":"herdr","status":"running","attempt_count":null}]
        run_status=running
        fake: agentGets=0 paneGets=0 agentReads=0 paneSplits=0 paneKills=0 sent=0

**判读**：事件账**恰好止于 `attempt_started`**，且 fake Herdr CLI 的六个计数器**全为 0**——driver 连第一次 `paneSplit` 都没发出去。对应代码位置是 `relay-core/store/store.mjs` `registerReceipt`（`:484`）：`:497` 的 `emitEvent({ kind: 'attempt_started', … })` 落账成功，紧接着 `:498` 的 `await persistState()` 原子 rename 在 `%TEMP%` 上**停住**（不报错、不返回），于是 `registerReceipt` 不 resolve，`launchHerdrAgent` 后续调用链一次都没开始。

**与 EPERM 形态的关系**：同族、两种表现。`%TEMP%` 上的原子 rename 撞上外部持有者时，**要么**当场抛 `EPERM`（`gate-round2-0739Z.VOID` 那轮，栈 `store.mjs:554:9`，也是一处 `persistState`），**要么**长时间不返回（本形态）。都归 `DHR-BL-17`。

**为什么不是「上限给少了」**：`herdr-adapter:532` 那条的上限已经是按链推导的 **120_000**（合法链 80s × 1.5），它把 120s 等满、fake 计数器仍是 0——环境停顿超过了任何合法上限，再抬上限也没有意义。这条同时反证了「上限不够」这个替代解释。

**去向**：不修，登记。生产侧 `persistState` 是否需要加超时/重试**不在本卡允许路径**（`store/**` 明确 Out of scope），归 `DHR-BL-17` 或另卡。

## `%TEMP%` 现场取证

| 观测 | 值 |
|---|---|
| `%TEMP%` 目录数 | 24,592 |
| `%TEMP%` 文件数 | 66,950 |
| 本测试套件遗留的 `mkdtemp` 目录（`dhr*` 等前缀） | 201 |
| 同时段本机负载 | `Win32_Processor.LoadPercentage` 峰值 82%；并发跑着 Herdr + 多个 codex CLI（15:13 / 16:00 / 16:08 各起一个）+ chrome-devtools-mcp |
| `Get-MpPreference` | **超过 2 分钟未返回**（Defender 引擎自身被拖住，侧证 `%TEMP%` 扫描压力） |
| 本届测试进程是否有残留 | **无**——近 2 小时内的 node 进程逐个核过，没有孤儿 test runner |

主控已独立取证并给出同一结论（24,594 个目录、24,452 个超过 1 天、绝大多数是 `dh-*` 测试夹具残留），**用户已授权主控清理 `%TEMP%` 下超过 1 天的 `dh-*` / `.tmp` 目录**。本 worker 未对 `%TEMP%` 做任何删除。

## 本届状态 / 下一步

- 两处整改**已落盘**（代码 1 处 + 命令行 1 处），依据完整；
- 机器证 A **未达标**：8 轮绿闸里 3 轮绿，最长的一次连续绿只有 1 轮，未凑出「连续 3 轮」；红因已逐轮分类，**无一条归到本届改动**（对照实验佐证）；
- **等主控清理 `%TEMP%` 后重跑三轮。**
- 措辞按 F-71-LES-02：重跑后的三轮结论必须带条件——「在该五文件命令、`--test-concurrency=1`、本机负载下」。届时还要补一句 `%TEMP%` 清理已完成，因为它是那批证据的前置条件。
- `findings.md` 里 F-71-CON-01 / F-71-CON-02 **本届不改 resolved**：改动虽已落盘，但两条的验收都挂在「重跑三轮」上，绿闸没过就不能签。

## 增量日志（复核整改届）

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-02 07:10Z | worker | 进场核对：`HEAD=37bc26a`、`git status` clean、分支 `wt/DHR_71`；读 AGENTS 编排协议段 + brief + `construction.DONE` + findings（CON-01/02）+ `review-consistency-codex.md` §2 | `git log -1` | 改两处 |
| 2026-09-02 07:14Z | worker | F-71-CON-01：`HERDR_FIRST_CHECKPOINT_BUDGET_MS` 30_000 → 120_000 + 注释按链重写；核对 `herdr-cli.mjs:17/:41` 两个生产上限确实是 60_000 / 10_000 | `git diff -- relay-core/` | F-71-CON-02 起绿闸 |
| 2026-09-02 07:17–08:23Z | worker | 新命令（`--test-timeout=300000`）跑了 4 个系列共 8 轮，3 绿 5 红；逐轮分类红因，作废轮改名留证 | E-7114 | 归因对照 |
| 2026-09-02 08:27–08:33Z | worker | **对照实验**：HEAD 代码 + 旧命令 `--test-timeout=180000`，同负载 2 轮 → 1 绿 1 红 ⇒ 红与本届改动无关；跑完还原带修版本并核对常量 | E-7115 | `%TEMP%` 取证 |
| 2026-09-02 08:35Z | worker | `%TEMP%` 现场取证（24,592 目录 / 66,950 文件 / 201 个套件遗留夹具；`Get-MpPreference` 2 分钟不返回）；登记 F-7108 停顿形态并定位到 `store.mjs:484/:497/:498` | E-7116 | — |
| 2026-09-02 08:40Z | worker | **主控插话**：停止重跑，用户已授权主控清理 `%TEMP%` 超 1 天的 `dh-*`/`.tmp`。按指令写完本节、登记 F-7108、不改任何代码，**停下等主控** | 本节 | 主控清理完再派本 worker 重跑三轮 |

## 清理 `%TEMP%` 后复跑（E-7117，2026-09-02）

- 对照：主控清理前观测为 24,594 个目录；清理后约 1,900 个目录。本 worker 未执行任何 `%TEMP%` 删除。
- 命令（cwd=`relay-core/`）：`node --test --test-concurrency=1 --test-timeout=300000 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination=<evidence>/gate-round<N>-<ts>.junit.xml test/herdr-adapter.test.mjs test/agent-node.test.mjs test/dhr64-driver-observation.test.mjs test/dhr69-false-ready.test.mjs test/dhr70-submission-gate.test.mjs`。

| 轮次 | 结果 | 时长 | 判读 / 证据 |
|---|---:|---:|---|
| `gate-round1-20260902T135717Z` | 50 pass / 4 skip / 1 fail | 497.235s | `dhr69:180` 90s 超时；events 含 `host_observation_changed(alive)` 且 fake 非零，**不匹配** F-7108 停于 `attempt_started` + 全零签名。 |
| `gate-round2-20260902T140707Z` | 51 pass / 4 skip / 0 fail | 392.147s | 无 fail，但超过 370s，不能计入合格三轮。 |
| `gate-round3-20260902T141425Z.VOID-bl17-eperm` | 47 pass / 4 skip / 4 fail | 537.315s | 含 `EPERM ... rename state.json.<uuid>.tmp -> state.json`，符合 BL-17，作废并保留 stdout/JUnit。 |
| `gate-round4-20260902T142535Z` | 50 pass / 4 skip / 1 fail | 474.113s | 与 round1 同一 `dhr69:180` 非 F-7108 签名超时；不能计入合格三轮。 |

结论：未取得连续三轮 `skip=4 ∧ fail=0 ∧ elapsed<=370s`，故 F-71-CON-01 / F-71-CON-02 仍为 open，F-7108 保持 open；未改代码、未改 DevPlan、未进入复核或提交。

## 隔离子进程 TEMP 验证（E-7118，2026-09-03）

- 方法：只对 Node 子进程设置 `TEMP` / `TMP` 为 worktree 内 `.tmp-gate-dhr71`；不改系统环境、不改生产代码。每轮 stdout / JUnit 均入 `evidence/`。
- 首次受限 sandbox 试跑 `isolation-temp-dhr69-20260902T230703Z.*` 在 Node 创建测试子进程时即 `spawn EPERM`，未进入测试体；原始 stdout / JUnit 保留，但**不是** DHR_71 门禁轮次。其后的 `233139Z` 预检在正常本机权限下执行。
- 预检：单跑 `dhr69-false-ready.test.mjs` 为 10 pass / 0 fail / 24.089s（`isolation-temp-dhr69-20260902T233139Z.*`），说明受控目录不是必然失败。

| 轮次 | 结果 | 时长 | 判读 / 证据 |
|---|---:|---:|---|
| `gate-isolated-temp-round1-20260902T234348Z` | 51 pass / 4 skip / 0 fail | 333.403s | 合格单轮；说明 F-71-CON-01/02 整改在该环境可通过，但还不是连续三轮。 |
| `gate-isolated-temp-round2-20260902T235550Z` | 50 pass / 4 skip / 1 fail | 572.898s | `dhr69:180` 再次等满 90s；事件为 `run_created,node_started,attempt_started,host_observation_changed(alive)`，fake 非零，故**不匹配 F-7108**。归新 F-7109；不能把隔离 TEMP 当作解除硬阻塞。 |

结论：DHR_71 仍未取得连续三轮 `skip=4 ∧ fail=0 ∧ elapsed<=370s`。F-7108 保持 open；F-7109 是独立、范围外的持久化/环境诊断债，需由 DHR-BL-17 专卡承接。本届不改代码、DevPlan 或收口状态，不进入复核、提交或 push。

## 独立基线绿闸（E-7119，2026-09-03，**主控执行**）

- **背景**：DHR_74 的机器证 C 六轮跑在 `wt/DHR_74@22dc16c`（已合入本分支）的**组合分支**上，无法把绿单独归因给任一张卡（DHR_74 三路复核 F-74-REQ-03 / F-74-R1-02，主控已采纳）。用户 2026-09-03 点选合并序「DHR_71 先收口，DHR_74 rebase 后重跑」，故先验证一个经验问题：**DHR_71 单独（不含 DHR_74 的时间参数改动）能否自己达标**。
- **基线**：`wt/DHR_71@b7f894f`（= master@6050276 + 本卡全部改动；**不含** DHR_74 的探针与 12 行时间参数）。
- **命令**：与本卡冻结命令逐字相同（五文件、`--test-concurrency=1 --test-timeout=300000`、spec + junit 双 reporter，cwd=`relay-core/`），无探针、无 `NODE_OPTIONS` 注入、无 TEMP 隔离。
- **负载条件**：2026-09-03 白天，主控 Claude session 在跑但**未派任何 worker**（三轮期间零 codex/复核实例，与 09-02 晚间多实例常驻的条件不同）。

| 轮次 | 结果 | 用例耗时 | 墙钟 | 判读 |
|---|---:|---:|---:|---|
| `own-baseline-round1-20260903T073829Z` | 51 pass / 4 skip / 0 fail | 288.954s | 296s | 合格 |
| `own-baseline-round2-20260903T074338Z` | 51 pass / 4 skip / 0 fail | 285.143s | 292s | 合格 |
| `own-baseline-round3-20260903T074844Z` | 51 pass / 4 skip / 0 fail | 287.998s | 295s | 合格 |

- **skip 核销**：三轮同一批 S1~S4（四条 DHR_33 用例，均挂 `F-3520 → DHR_72` 待重写），按完整用例名逐条比对一致，无多解无少解。
- **签名扫描**：`evidence/own-baseline-signature-scan-20260903.md`——S-EPERM / S-STALL / S-FAIL / S-CRED **四类零命中**，并附「同 glob 扫 `skipped|<testsuite` 得 21 命中 / 6 文件」的对照自证（证明不是空扫）。
- **判定**：本卡机器证「连续三轮 `skip=4 ∧ fail=0 ∧ 每轮 ≤370s`」**在本基线下达成**；`construction.DONE` 里 `machine_proof_a: blocked` 的记录反映的是 09-02 晚间条件下的事实，本节不改写它，另行由主控在收口裁决里登记状态迁移。
- **条件措辞（F-71-LES-02）**：结论仅在「该五文件冻结命令、`--test-concurrency=1`、2026-09-03 白天本机负载（无并发 worker）」下成立。F-7402 登记的事件循环整段冻结是随机环境事件，**未复现 ≠ 已修复**；后续轮次若再撞 BL-17 签名，按 `.VOID-*` 作废留证重跑。
- **附带结论（对 DHR_74 有影响）**：本轮证明 **DHR_74 的 ×10 时间参数改动不是绿闸达标的必要条件**——不含该改动的基线同样连续三轮达标。DHR_74 的机器证 B/C 措辞须据此进一步降级（已并入其整改轮 1 派单）。
